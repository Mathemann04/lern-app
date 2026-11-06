import { contains } from '../../expr/compare.ts'
import { E, type Expr, add, div, fn, mul, neg, num, pow } from '../../expr/types.ts'
import { type Frac, fracDiv, fracMul, fracOf, fracSub } from '../../fraction/frac.ts'
import { type Poly, atomsOf, constValue, degreeIn, polyAtom, polyConst, polyDivideExact, polyEquals, polyMul, polySub } from '../../fraction/poly.ts'
import { type Rational, isOne, rat, ratDiv, ratMul, ratSub } from '../../rational.ts'
import { newAtoms, niceFrac, polyToExpr, toPoly, toRat } from '../algebra.ts'

// Summen, Reihen und Grenzwerte der Stufe 5 (docs/PLAN-M3.md, Teil 7b): geometrische Summe und Reihe,
// auch abgeleitet (\sum k q^k) und integriert (\sum \frac{q^k}{k}), und Grenzwerte, die auf e^{□} führen.
// Gerechnet wird mit den Formeln der Lernkarten; die Gegenprobe (evaluate.ts, Tests) rechnet Summanden
// und große n numerisch.

// --- Summand c · q^k (bzw. c · k · q^k, c · \frac{q^k}{k}) ---

// plain: c q^k; k: c k q^k (abgeleitet); over-k: c \frac{q^k}{k} (integriert)
export type SeriesShape = 'plain' | 'k' | 'over-k'
export type Geometric = { readonly c: Expr; readonly q: Expr; readonly shape: SeriesShape }

const one = num(1)
const isNum = (e: Expr, value: number) => e.kind === 'num' && e.value.n === BigInt(value) && e.value.d === 1n

// Zähler- und Nennerfaktoren eines Produkts oder Bruchs
function factorsOf(e: Expr): { num: Expr[]; den: Expr[]; negative: boolean } {
  if (e.kind === 'neg') {
    const inner = factorsOf(e.arg)
    return { ...inner, negative: !inner.negative }
  }
  if (e.kind === 'mul') {
    const parts = e.factors.map(factorsOf)
    return { num: parts.flatMap((p) => p.num), den: parts.flatMap((p) => p.den), negative: parts.filter((p) => p.negative).length % 2 === 1 }
  }
  if (e.kind === 'div') {
    const top = factorsOf(e.num)
    const bottom = factorsOf(e.den)
    return { num: [...top.num, ...bottom.den], den: [...top.den, ...bottom.num], negative: top.negative !== bottom.negative }
  }
  return { num: isNum(e, 1) ? [] : [e], den: [], negative: false }
}

const product = (factors: readonly Expr[]): Expr => (factors.length === 0 ? one : factors.length === 1 ? factors[0] : mul(...factors))
const quotient = (top: readonly Expr[], bottom: readonly Expr[]): Expr => (bottom.length === 0 ? product(top) : div(product(top), product(bottom)))

// Potenz base^{αk + β}: q-Teil base^α und Faktor base^β; null, wenn die Hochzahl nicht linear in k ist
function powerParts(f: Expr, k: string): { q: Expr; c: Expr | null } | null {
  if (f.kind !== 'pow' || contains(f.base, k)) return null
  const atoms = newAtoms('')
  const p = toPoly(f.exp, atoms)
  if (!p || degreeIn(p, k) !== 1) return null
  const withK = p.filter((t) => t.mono.some(([a]) => a === k))
  const rest = p.filter((t) => !t.mono.some(([a]) => a === k))
  const alpha = polyDivideExact(withK, polyAtom(k))
  if (!alpha || atomsOf(alpha).includes(k)) return null
  return { q: powerOf(f.base, polyToExpr(alpha, atoms)), c: rest.length === 0 ? null : powerOf(f.base, polyToExpr(rest, atoms)) }
}

// base^m, e^{α}^m = e^{αm}, base^1 = base
function powerOf(base: Expr, m: Expr): Expr {
  if (isNum(m, 0)) return one
  if (isNum(m, 1)) return base
  if (base.kind === 'pow' && base.base.kind === 'const' && base.base.name === 'e') return pow(E, simplified(mul(base.exp, m)))
  return pow(base, m)
}

// Summand als c · q^k (· k bzw. durch k); null bei anderen Summanden
export function geometricParts(body: Expr, k: string): Geometric | null {
  const { num: top, den: bottom, negative } = factorsOf(body)
  const c: { num: Expr[]; den: Expr[] } = { num: [], den: [] }
  const q: { num: Expr[]; den: Expr[] } = { num: [], den: [] }
  let shape: SeriesShape = 'plain'
  for (const [factors, side] of [[top, 'num'], [bottom, 'den']] as const) {
    for (const f of factors) {
      if (!contains(f, k)) {
        c[side].push(f)
        continue
      }
      if (f.kind === 'var' && f.name === k) {
        if (shape !== 'plain') return null
        shape = side === 'num' ? 'k' : 'over-k'
        continue
      }
      const parts = powerParts(f, k)
      if (!parts) return null
      q[side].push(parts.q)
      if (parts.c) c[side].push(parts.c)
    }
  }
  if (q.num.length + q.den.length === 0) return null
  const cExpr = quotient(c.num, c.den)
  return { c: negative ? neg(cExpr) : cExpr, q: numericQ(q.num, q.den), shape }
}

// q mit Zahlen ausgerechnet: \frac{1}{2^k} → q = \frac{1}{2}
function numericQ(top: readonly Expr[], bottom: readonly Expr[]): Expr {
  const value = (fs: readonly Expr[]) => fs.reduce<Rational | null>((r, f) => (r && f.kind === 'num' ? ratMul(r, f.value) : null), rat(1))
  const [vt, vb] = [value(top), value(bottom)]
  if (vt && vb) return num(ratDiv(vt, vb))
  return quotient(top.length === 0 ? [one] : top, bottom)
}

// --- Zusammenfassen ---

// Ein Bruch aus Polynomen (Teile wie e^{-x} als eigene Zeichen) in Endform; ohne Bruch bleibt der Term
function simplified(e: Expr): Expr {
  const atoms = newAtoms('')
  const f = toRat(e, atoms)
  return f ? niceFrac(f, atoms) : e
}

// Hat q einen Nenner mit Buchstaben (\frac{x}{a}, \frac{a}{x}, \frac{x}{x + a})?
function isLetterFraction(q: Expr): boolean {
  const f = toRat(q, newAtoms(''))
  return f !== null && constValue(f.den) === null
}

const times = (c: Expr, e: Expr): Expr => (isNum(c, 1) ? e : isNum(c, -1) ? neg(e) : mul(c, e))

// -c, mit Zahlen ausgerechnet
const negated = (c: Expr): Expr => (c.kind === 'num' ? num(ratMul(c.value, rat(-1))) : c.kind === 'neg' ? c.arg : neg(c))

// c · r mit einer Zahl r: Zahl vorn (2a statt a · 2), Zahlen zusammengefasst
function scaled(c: Expr, r: Rational): Expr {
  if (isOne(r)) return c
  if (c.kind === 'num') return num(ratMul(c.value, r))
  if (c.kind === 'mul' && c.factors[0].kind === 'num') {
    const [first, ...rest] = c.factors
    return scaled(rest.length === 1 ? rest[0] : mul(...rest), ratMul((first as Extract<Expr, { kind: 'num' }>).value, r))
  }
  if (c.kind === 'neg') return scaled(c.arg, ratMul(r, rat(-1)))
  return r.n === -1n && r.d === 1n ? neg(c) : mul(num(r), c)
}

// 1 - q, mit Zahlen ausgerechnet
const oneMinus = (q: Expr): Expr => (q.kind === 'num' ? num(ratSub(rat(1), q.value)) : add(one, neg(q)))
const minusOne = (q: Expr): Expr => (q.kind === 'num' ? num(ratSub(q.value, rat(1))) : add(q, num(-1)))

// Bruch c · \frac{top}{bottom}; bei q als Bruch mit Buchstaben über die Bruch-Engine zusammengefasst;
// eine Zahl im Nenner geht in den Faktor (2a(2^n - 1), -a(2^n - 1)), außer sie ist ganz (\frac{3^n - 1}{2})
function fraction(c: Expr, top: Expr, bottom: Expr, q: Expr): Expr {
  if (bottom.kind === 'num') {
    const inverse = ratDiv(rat(1), bottom.value)
    if (inverse.d === 1n) return times(scaled(c, inverse), top)
    const front = scaled(c, rat(inverse.n < 0n ? -1 : 1))
    return div(times(front, top), num(rat(inverse.d)))
  }
  const raw = div(times(c, top), bottom)
  return isLetterFraction(q) ? simplified(raw) : raw
}

// --- Reihe \sum_{k = unten}^{\infty} ---

// Typische Fehler beim Ausrechnen einer Reihe oder Summe (Ids der Fehlerregeln)
export type SeriesMistake = 'eq-sum-count' | 'eq-series-start' | 'eq-series-sign' | 'eq-series-not-geometric'

// Wert der Reihe ab k = lower (Zahl): \frac{c q^{unten}}{1 - q}, \frac{cq}{(1 - q)^2}, -c\ln(1 - q);
// mistake: typischer Fehler (null, wenn es ihn hier nicht gibt)
export function seriesValue(g: Geometric, lower: number, mistake: SeriesMistake | null = null): Expr | null {
  const { c, q } = g
  const shape = mistake === 'eq-series-not-geometric' ? 'plain' : g.shape
  if (mistake === 'eq-series-not-geometric' && g.shape === 'plain') return null
  if (mistake === 'eq-sum-count') return null
  switch (shape) {
    case 'plain': {
      // erster Summand c q^{unten}; beim Fehler mit falschem Start: q^0 statt q^{unten} bzw. q statt 1
      const start = mistake === 'eq-series-start' ? (lower === 0 ? 1 : 0) : lower
      const first = powerOf(q, num(start))
      const bottom = mistake === 'eq-series-sign' ? minusOne(q) : oneMinus(q)
      return fraction(c, first, bottom, q)
    }
    case 'k': {
      if (lower > 1 || mistake === 'eq-series-sign') return null
      // \sum_{k=1}^{\infty} k q^k = \frac{q}{(1 - q)^2}; Fehler: Faktor q vergessen
      const top = mistake === 'eq-series-start' ? one : q
      return squaredFraction(c, top, q)
    }
    case 'over-k': {
      if (lower !== 1 || mistake === 'eq-series-start') return null
      // \sum_{k=1}^{\infty} \frac{q^k}{k} = -\ln(1 - q); Fehler: Minus vergessen
      const log = fn('ln', isLetterFraction(q) ? simplified(oneMinus(q)) : oneMinus(q))
      return mistake === 'eq-series-sign' ? times(c, log) : times(negated(c), log)
    }
  }
}

// c \frac{top}{(1 - q)^2}, bei q als Bruch zusammengefasst: \frac{ax}{(a - x)^2}
function squaredFraction(c: Expr, top: Expr, q: Expr): Expr {
  if (!isLetterFraction(q)) return div(times(c, top), pow(oneMinus(q), num(2)))
  const atoms = newAtoms('')
  const base = toRat(oneMinus(q), atoms)!
  const front = toRat(times(c, top), atoms)!
  // \frac{u}{w} \cdot \frac{r^2}{p^2} mit 1 - q = \frac{p}{r}
  const rest = niceFrac(fracMul(front, { num: polyMul(base.den, base.den), den: polyConst(1) }), atoms)
  const p = niceFrac(fracOf(base.num), atoms)
  const square = pow(p, num(2))
  return rest.kind === 'div' ? div(rest.num, mul(rest.den, square)) : div(rest, square)
}

// --- Endliche geometrische Summe \sum_{k = unten}^{oben} c q^k ---

// Anzahl der Summanden oben - unten + 1 als Term (n - 1 - 0 + 1 = n)
function countOf(lower: number, upper: Expr): Expr {
  const atoms = newAtoms('')
  const p = toPoly(add(upper, num(1 - lower)), atoms)
  return p ? polyToExpr(p, atoms) : add(upper, num(1 - lower))
}

// Wert der Summe: c q^{unten} \frac{q^m - 1}{q - 1} mit m Summanden; Fehler: Anzahl um eins verschoben
// (shift ±1), ohne den ersten Summanden, Vorzeichen im Nenner
export function sumValue(g: Geometric, lower: number, upper: Expr, mistake: SeriesMistake | null = null, shift = 1): Expr | null {
  if (g.shape !== 'plain' || mistake === 'eq-series-not-geometric') return null
  if (mistake === 'eq-series-start' && lower === 0) return null
  const { c, q } = g
  const m = countOf(lower, upper)
  const count = mistake === 'eq-sum-count' ? simplified(add(m, num(shift))) : m
  const front = mistake === 'eq-series-start' ? c : timesPower(c, q, lower)
  const top = add(powerOf(q, count), num(-1))
  const bottom = mistake === 'eq-series-sign' ? oneMinus(q) : minusOne(q)
  // Zahl im Nenner: \frac{3^n - 1}{2}, bei q = 2 kein Nenner
  return fraction(front, top, bottom, q)
}

// c · q^m mit Zahlen zusammengefasst
function timesPower(c: Expr, q: Expr, m: number): Expr {
  if (m === 0) return c
  const qm = powerOf(q, num(m))
  if (qm.kind === 'num') return scaled(c, qm.value)
  return isNum(c, 1) ? qm : mul(c, qm)
}

// --- Grenzwert \lim_{n \to \infty}\left(\frac{n + p}{n + r}\right)^{sn} = e^{s(p - r)} ---

export type LimitParts = { readonly s: Frac; readonly p: Frac; readonly r: Frac }
export type LimitMistake = 'eq-lim-one' | 'eq-lim-exponent' | 'eq-lim-denominator'

// Rumpf als \left(\frac{n + p}{n + r}\right)^{sn} (auch \left(1 + \frac{p}{n}\right)^{sn}); null sonst
export function limitParts(body: Expr, n: string): LimitParts | null {
  if (body.kind !== 'pow') return null
  const atoms = newAtoms('')
  const exp = toRat(body.exp, atoms)
  const base = toRat(body.base, atoms)
  if (!exp || !base) return null
  // s = \frac{Hochzahl}{n} ohne n
  const sNum = atomsOf(exp.den).includes(n) ? null : polyDivideExact(exp.num, polyAtom(n))
  if (!sNum || atomsOf(sNum).includes(n)) return null
  const s: Frac = { num: sNum, den: exp.den }
  const linear = (poly: Poly) => {
    if (degreeIn(poly, n) !== 1) return null
    const withN = poly.filter((t) => t.mono.some(([a]) => a === n))
    const lead = polyDivideExact(withN, polyAtom(n))
    return lead && !atomsOf(lead).includes(n) ? { lead, rest: polySub(poly, withN) } : null
  }
  const top = linear(base.num)
  const bottom = linear(base.den)
  if (!top || !bottom) return null
  // gleicher Faktor vor n oben und unten (sonst geht der Bruch nicht gegen 1)
  if (!polyEquals(top.lead, bottom.lead)) return null
  const lead = fracOf(top.lead)
  return { s, p: fracDiv(fracOf(top.rest), lead), r: fracDiv(fracOf(bottom.rest), lead) }
}

// e^{s(p - r)}; Fehler: 1 („1 hoch unendlich"), ohne s, den Nenner nicht beachtet (e^{sp})
export function limitValue(parts: LimitParts, mistake: LimitMistake | null = null): Expr | null {
  const { s, p, r } = parts
  const isZeroFrac = (f: Frac) => f.num.length === 0
  const isOneFrac = (f: Frac) => polyEquals(f.num, f.den)
  if (mistake === 'eq-lim-one') return one
  if (mistake === 'eq-lim-exponent' && isOneFrac(s)) return null
  if (mistake === 'eq-lim-denominator' && isZeroFrac(r)) return null
  const inner = mistake === 'eq-lim-denominator' ? p : fracSub(p, r)
  const exponent = mistake === 'eq-lim-exponent' ? inner : fracMul(s, inner)
  if (isZeroFrac(exponent)) return one
  const atoms = newAtoms('')
  const power = niceFrac(exponent, atoms)
  // e^1 = e
  return isNum(power, 1) ? E : pow(E, power)
}

