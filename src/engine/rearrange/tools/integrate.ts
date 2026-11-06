import { contains, key } from '../../expr/compare.ts'
import { toLatex } from '../../expr/print.ts'
import { substitute } from '../../expr/substitute.ts'
import { type Expr, add, div, fn, ln, mul, neg, num, pow, root, variable } from '../../expr/types.ts'
import { reduceFrac } from '../../fraction/factor.ts'
import { type Frac, fracDiv, fracMul, fracNeg, fracOf } from '../../fraction/frac.ts'
import { type Poly, constValue, degreeIn, polyConst, polyDivideExact, polyMul, polyProduct, polyScale, polySub, polySubstitute } from '../../fraction/poly.ts'
import { type Rational, isOne, isZero, rat, ratDiv, ratMul, ratNeg, ratSign } from '../../rational.ts'
import { type Atoms, monomialSqrt, newAtoms, niceFrac, polyToExpr, toPoly, toRat } from '../algebra.ts'

// Integrale der Stufe 5 (docs/PLAN-M3.md, „Stufe 5: erst ausrechnen, dann umstellen"): Stammfunktionen
// aus einer kleinen Tafel, Partialbrüche über die Bruch-Engine, Grenzen einsetzen. Jede Stammfunktion
// hat die Form Faktor · G (z. B. \frac{1}{2}\ln(t^2 + a^2)); typische Fehler ändern den Faktor oder ein
// Vorzeichen. Die Gegenprobe (Tests): G abgeleitet ergibt den Integranden, das Integral numerisch.

// Stammfunktion factor · inner; factor ist frei von t (Zahl oder Bruch aus Buchstaben)
export type Antiderivative = { readonly factor: Frac; readonly inner: Expr }

export type IntegralMistake = 'eq-int-inner-factor' | 'eq-int-derived' | 'eq-int-power' | 'eq-int-sign'

type Rule = { readonly factor: Frac; readonly inner: Expr; readonly mistakes: ReadonlyArray<{ readonly id: IntegralMistake; readonly factor: Frac; readonly inner?: Expr }> }

const constFrac = (r: Rational): Frac => fracOf(polyConst(r))
const ONE = constFrac(rat(1))

// Linear in v mit einer Zahl vor v: αv + p
function linear(e: Expr, v: string, atoms: Atoms): { alpha: Rational; p: Poly } | null {
  const q = toPoly(e, atoms)
  if (!q || degreeIn(q, v) !== 1) return null
  const withV = q.filter((term) => term.mono.some(([a]) => a === v))
  const alpha = withV.length === 1 && withV[0].mono.length === 1 ? withV[0].coef : null
  if (!alpha) return null
  return { alpha, p: q.filter((term) => !term.mono.some(([a]) => a === v)) }
}

// αv^2 + p ohne v^1
function quadraticNoLinear(e: Expr, v: string, atoms: Atoms): { alpha: Rational; p: Poly } | null {
  const q = toPoly(e, atoms)
  if (!q || degreeIn(q, v) !== 2) return null
  const squares = q.filter((term) => term.mono.some(([a, k]) => a === v && k === 2))
  const lin = q.filter((term) => term.mono.some(([a, k]) => a === v && k === 1))
  if (lin.length > 0 || squares.length !== 1 || squares[0].mono.length !== 1) return null
  return { alpha: squares[0].coef, p: q.filter((term) => !term.mono.some(([a]) => a === v)) }
}

const isV = (e: Expr, v: string) => e.kind === 'var' && e.name === v && !e.tool

// Stammfunktion eines Summanden ohne Faktor davor (Tafel); null, wenn er nicht in der Tafel steht
function tableRule(core: Expr, v: string, atoms: Atoms): Rule | null {
  const V = variable(v)
  // v^n (auch v selbst), n ≠ -1
  const power = isV(core, v) ? rat(1) : core.kind === 'pow' && isV(core.base, v) ? asNumber(core.exp) : null
  if (power && !(power.n === -1n && power.d === 1n)) {
    const n1 = rat(power.n + power.d, power.d)
    return { factor: constFrac(ratDiv(rat(1), n1)), inner: pow(V, num(n1)), mistakes: [{ id: 'eq-int-power', factor: ONE }] }
  }
  // e^{kv + m}
  if (core.kind === 'pow' && core.base.kind === 'const' && core.base.name === 'e') {
    const l = linear(core.exp, v, atoms)
    if (l) {
      const k = l.alpha
      const mistakes: Rule['mistakes'] = isOne(k)
        ? []
        : [
            { id: 'eq-int-inner-factor', factor: ONE },
            { id: 'eq-int-derived', factor: constFrac(k) },
          ]
      return { factor: constFrac(ratDiv(rat(1), k)), inner: core, mistakes }
    }
  }
  // v e^{v^2}
  if (core.kind === 'mul' && core.factors.length === 2 && isV(core.factors[0], v)) {
    const g = core.factors[1]
    if (g.kind === 'pow' && g.base.kind === 'const' && g.base.name === 'e' && key(g.exp) === key(pow(V, num(2)))) {
      return { factor: constFrac(rat(1, 2)), inner: g, mistakes: [{ id: 'eq-int-inner-factor', factor: ONE }] }
    }
  }
  // sin, cos, sinh, cosh von kv
  if (core.kind === 'fn' && ['sin', 'cos', 'sinh', 'cosh'].includes(core.name)) {
    const l = linear(core.arg, v, atoms)
    if (l && l.p.length === 0) {
      const k = l.alpha
      const partner = ({ sin: 'cos', cos: 'sin', sinh: 'cosh', cosh: 'sinh' } as const)[core.name as 'sin' | 'cos' | 'sinh' | 'cosh']
      const sign = core.name === 'sin' ? rat(-1) : rat(1)
      const right = ratDiv(sign, k)
      const mistakes: Rule['mistakes'] = [
        { id: 'eq-int-sign', factor: constFrac(ratNeg(right)) },
        ...(isOne(k) ? [] : [{ id: 'eq-int-inner-factor' as const, factor: constFrac(sign) }]),
      ]
      return { factor: constFrac(right), inner: fn(partner, core.arg), mistakes }
    }
  }
  if (core.kind === 'div' && isV(core.num, v)) {
    // \frac{v}{αv^2 + p}: \frac{1}{2α}\ln(αv^2 + p)
    const q = quadraticNoLinear(core.den, v, atoms)
    if (q) return { factor: constFrac(ratDiv(rat(1), ratMul(rat(2), q.alpha))), inner: ln(core.den), mistakes: [{ id: 'eq-int-inner-factor', factor: ONE }] }
    // \frac{v}{\sqrt{αv^2 + p}}: \frac{1}{α}\sqrt{αv^2 + p}
    if (core.den.kind === 'root' && core.den.index === 2) {
      const r = quadraticNoLinear(core.den.arg, v, atoms)
      if (r) return { factor: constFrac(ratDiv(rat(1), r.alpha)), inner: core.den, mistakes: [{ id: 'eq-int-inner-factor', factor: constFrac(ratDiv(rat(1), ratMul(rat(2), r.alpha))) }] }
    }
  }
  if (core.kind === 'div' && core.num.kind === 'num' && isOne(core.num.value)) {
    // \frac{1}{αv + p}: \frac{1}{α}\ln(αv + p)
    const l = linear(core.den, v, atoms)
    if (l) {
      return {
        factor: constFrac(ratDiv(rat(1), l.alpha)),
        inner: ln(core.den),
        mistakes: isOne(l.alpha) ? [] : [{ id: 'eq-int-inner-factor', factor: ONE }],
      }
    }
    // \frac{1}{v^2 + p^2}: \frac{1}{p}\arctan\frac{v}{p}
    const q = quadraticNoLinear(core.den, v, atoms)
    const p = q && isOne(q.alpha) ? monomialSqrt(q.p) : null
    if (p) {
      const pe = polyToExpr(p, atoms)
      return { factor: fracDiv(ONE, fracOf(p)), inner: fn('arctan', div(V, pe)), mistakes: [{ id: 'eq-int-inner-factor', factor: ONE }] }
    }
    // \frac{1}{\sqrt{αv + p}}: \frac{2}{α}\sqrt{αv + p}
    if (core.den.kind === 'root' && core.den.index === 2) {
      const r = linear(core.den.arg, v, atoms)
      if (r) return { factor: constFrac(ratDiv(rat(2), r.alpha)), inner: core.den, mistakes: [{ id: 'eq-int-power', factor: constFrac(ratDiv(rat(1, 2), r.alpha)) }] }
    }
  }
  return null
}

function asNumber(e: Expr): Rational | null {
  if (e.kind === 'num') return e.value
  if (e.kind === 'neg' && e.arg.kind === 'num') return ratNeg(e.arg.value)
  return null
}

// Faktor ohne v vor dem Kern: c · Kern, \frac{Kern}{c}, -Kern
function splitFactor(term: Expr, v: string, atoms: Atoms): { c: Frac; core: Expr } | null {
  if (term.kind === 'neg') {
    const inner = splitFactor(term.arg, v, atoms)
    return inner && { c: fracNeg(inner.c), core: inner.core }
  }
  if (term.kind === 'mul') {
    const free = term.factors.filter((f) => !contains(f, v))
    const withV = term.factors.filter((f) => contains(f, v))
    if (free.length > 0 && withV.length > 0) {
      const c = toRat(mul(...free), atoms)
      return c && { c, core: withV.length === 1 ? withV[0] : mul(...withV) }
    }
  }
  if (term.kind === 'div' && !contains(term.den, v) && contains(term.num, v)) {
    const c = toRat(div(num(1), term.den), atoms)
    const inner = splitFactor(term.num, v, atoms)
    return c && inner && { c: fracMul(c, inner.c), core: inner.core }
  }
  // \frac{c}{…} mit c ohne v: c · \frac{1}{…}
  if (term.kind === 'div' && !contains(term.num, v) && !(term.num.kind === 'num' && isOne(term.num.value))) {
    const c = toRat(term.num, atoms)
    return c && { c, core: div(num(1), term.den) }
  }
  return { c: ONE, core: term }
}

const termsOf = (e: Expr): readonly Expr[] => (e.kind === 'add' ? e.terms : [e])

// Stammfunktion eines Summanden mit Faktor; mistake: dieser typische Fehler (null, wenn er nicht passt)
function termAntiderivative(term: Expr, v: string, atoms: Atoms, mistake: IntegralMistake | null): Antiderivative | null {
  if (!contains(term, v)) {
    const c = toRat(term, atoms)
    return c && { factor: c, inner: variable(v) }
  }
  const split = splitFactor(term, v, atoms)
  const rule = split && tableRule(split.core, v, atoms)
  if (!split || !rule) return null
  if (!mistake) return { factor: fracMul(split.c, rule.factor), inner: rule.inner }
  const m = rule.mistakes.find((x) => x.id === mistake)
  return m ? { factor: fracMul(split.c, m.factor), inner: m.inner ?? rule.inner } : null
}

// Faktor mal Term, wie man es schreibt: \frac{1}{2}\ln(…), -\frac{1}{3}\cos(3t), \frac{t^2}{2}, 2\sqrt{t + a}
export function timesFactor(factor: Frac, inner: Expr, atoms: Atoms): Expr {
  const c = niceFrac(factor, atoms)
  if (c.kind === 'num' && isOne(c.value)) return inner
  if (c.kind === 'num' && ratSign(c.value) < 0) return neg(timesFactor(fracNeg(factor), inner, atoms))
  if (c.kind === 'neg') return neg(timesFactor(fracNeg(factor), inner, atoms))
  // Potenz von t: \frac{t^2}{2} statt \frac{1}{2}t^2
  if (inner.kind === 'pow' && inner.base.kind === 'var' && c.kind === 'div' && c.num.kind === 'num' && isOne(c.num.value)) return div(inner, c.den)
  if (inner.kind === 'add') return mul(c, inner)
  return mul(c, inner)
}

// Stammfunktion des ganzen Integranden: Summe der Stammfunktionen der Summanden; ein gemeinsamer Faktor
// vor einer Klammer bleibt vorn (\frac{1}{b}\left(\ln t - \ln(t + b)\right)). mistake: an genau einem
// Summanden (index) der typische Fehler. null, wenn ein Summand nicht in der Tafel steht.
export function antiderivative(body: Expr, v: string, mistake: { id: IntegralMistake; index: number } | null = null): Antiderivative | null {
  const atoms = newAtoms(v)
  // c · (Summe): Faktor vorn behalten
  let outer = ONE
  let sum = body
  if (body.kind === 'mul' && body.factors.length === 2 && !contains(body.factors[0], v) && body.factors[1].kind === 'add') {
    const c = toRat(body.factors[0], atoms)
    if (!c) return null
    outer = c
    sum = body.factors[1]
  }
  const terms = termsOf(sum)
  const parts: Antiderivative[] = []
  for (const [i, term] of terms.entries()) {
    const own = mistake && mistake.index === i ? mistake.id : null
    let part = termAntiderivative(term, v, atoms, own)
    // Vorzeichen falsch bei mehreren Logarithmen: \ln t + \ln(t + b) statt \ln t - \ln(t + b)
    if (!part && own === 'eq-int-sign' && terms.length > 1 && term.kind === 'neg') {
      const right = termAntiderivative(term, v, atoms, null)
      part = right && { factor: fracNeg(right.factor), inner: right.inner }
    }
    if (!part) return null
    parts.push(part)
  }
  if (mistake && mistake.index >= terms.length) return null
  if (parts.length === 1) return { factor: fracMul(outer, parts[0].factor), inner: parts[0].inner }
  return { factor: outer, inner: add(...parts.map((p) => timesFactor(p.factor, p.inner, atoms))) }
}

// Anzahl der Summanden, an denen ein Fehler passieren kann
export const antiderivativeTerms = (body: Expr, v: string) =>
  termsOf(body.kind === 'mul' && body.factors.length === 2 && !contains(body.factors[0], v) && body.factors[1].kind === 'add' ? body.factors[1] : body).length

export const antiderivativeExpr = (a: Antiderivative, v: string) => timesFactor(a.factor, a.inner, newAtoms(v))

// --- Partialbrüche ---

// \frac{N}{(v + p)(v + q)} mit zwei verschiedenen Linearfaktoren und N vom Grad < 2:
// \frac{A}{v + p} + \frac{B}{v + q}; bei B = -A als A\left(\frac{1}{v + p} - \frac{1}{v + q}\right).
// forgetFactor: typischer Fehler, der Faktor A fehlt. null, wenn der Integrand nicht so aussieht.
export function partialFractions(body: Expr, v: string, forgetFactor = false): Expr | null {
  if (body.kind !== 'div' || !contains(body.den, v)) return null
  const atoms = newAtoms(v)
  const f = toRat(body, atoms)
  if (!f) return null
  const r = reduceFrac(f)
  const n = r.num
  const den = r.den
  if (degreeIn(n, v) > 1 || den.factors.length < 2) return null
  const withV = den.factors.filter((g) => degreeIn(g.poly, v) > 0)
  if (withV.length !== 2 || withV.some((g) => g.exp !== 1 || degreeIn(g.poly, v) !== 1)) return null
  // mit Plus vor v: (a - t) → -(t - a)
  const leadOf = (p: Poly) => p.find((term) => term.mono.some(([a]) => a === v))?.coef ?? rat(0)
  const flips = withV.filter((g) => ratSign(leadOf(g.poly)) < 0).length
  const linearFactors = withV.map((g) => (ratSign(leadOf(g.poly)) < 0 ? { ...g, poly: polyScale(g.poly, rat(-1)) } : g))
  // Zahl und Buchstaben ohne v im Nenner
  const rest = den.factors.filter((g) => degreeIn(g.poly, v) === 0)
  const restPoly = polyMul(polyConst(flips % 2 === 1 ? ratNeg(den.coef) : den.coef), polyProduct(rest.map((g) => g.poly)))
  // v + p: Nullstelle -p (nur mit 1 vor v)
  const roots: Poly[] = []
  for (const g of linearFactors) {
    const lead = g.poly.filter((term) => term.mono.some(([a]) => a === v))
    if (lead.length !== 1 || !isOne(lead[0].coef) || lead[0].mono.length !== 1) return null
    roots.push(polySub(polyConst(0), g.poly.filter((term) => !term.mono.some(([a]) => a === v))))
  }
  const coefficient = (i: number): Frac => {
    const other = 1 - i
    const value = polySubstitute(n, v, roots[i])
    const gap = polySub(roots[i], roots[other])
    return { num: value, den: polyMul(restPoly, gap) }
  }
  const [a, b] = [coefficient(0), coefficient(1)]
  if (a.num.length === 0 || b.num.length === 0) return null
  // v vorn: t + b, t - a
  const factorExprs = linearFactors.map((g) => {
    const rest = g.poly.filter((term) => !term.mono.some(([a]) => a === v))
    if (rest.length === 0) return variable(v)
    const r = polyToExpr(rest, atoms)
    return r.kind === 'neg' ? add(variable(v), r) : add(variable(v), r)
  })
  const frac = (c: Frac, i: number) => {
    const ce = niceFrac(c, atoms)
    return ce.kind === 'neg' ? neg(div(ce.arg, factorExprs[i])) : div(ce, factorExprs[i])
  }
  // B = -A: A vor die Klammer (der Nenner mit Plus zuerst)
  const opposite = polyDivideExact(polyMul(a.num, b.den), polyMul(b.num, a.den))
  const ratio = opposite && constValue(opposite)
  if (ratio && ratEqual(ratio, rat(-1))) {
    const [plusIndex, minusIndex] = ratSign(fracSign(a)) > 0 ? [0, 1] : [1, 0]
    const c = plusIndex === 0 ? a : b
    const inner = add(div(num(1), factorExprs[plusIndex]), neg(div(num(1), factorExprs[minusIndex])))
    const ce = niceFrac(c, atoms)
    if (forgetFactor) return ce.kind === 'num' && isOne(ce.value) ? null : inner
    return ce.kind === 'num' && isOne(ce.value) ? inner : mul(ce, inner)
  }
  if (forgetFactor) return null
  // in der Reihenfolge der Nenner: \frac{1}{t + a} + \frac{1}{t + b}
  const parts = [frac(a, 0), frac(b, 1)]
  const order = toLatex(factorExprs[0]) <= toLatex(factorExprs[1]) ? parts : [parts[1], parts[0]]
  return add(...order)
}

const ratEqual = (a: Rational, b: Rational) => a.n === b.n && a.d === b.d

// Vorzeichen eines Bruchs an positiven Buchstaben (grob: Vorzeichen der führenden Zahlen)
function fracSign(f: Frac): Rational {
  const lead = (p: Poly) => p[0]?.coef ?? rat(0)
  return ratMul(lead(f.num), lead(f.den))
}

// --- Grenzen einsetzen ---

// G(v = bound), mit Zahlen ausgerechnet: e^{2 \cdot 0} → 1, \ln(0 + a) → \ln a
export function atBound(inner: Expr, v: string, bound: Expr): Expr {
  return tidy(substitute(inner, v, bound))
}

const isMonomialTerm = (e: Expr): boolean =>
  e.kind === 'num' ||
  (e.kind === 'var' && !e.tool) ||
  (e.kind === 'neg' && isMonomialTerm(e.arg)) ||
  (e.kind === 'mul' && e.factors.every(isMonomialTerm)) ||
  (e.kind === 'pow' && isMonomialTerm(e.base) && e.exp.kind === 'num')

// Kleine Vereinfachungen nach dem Einsetzen einer Zahl
function tidy(e: Expr): Expr {
  switch (e.kind) {
    case 'add': {
      const terms = e.terms.map(tidy).filter((t) => !(t.kind === 'num' && isZero(t.value)))
      const sum = terms.length === 0 ? num(0) : terms.length === 1 ? terms[0] : add(...terms)
      // Summe aus Zahlen und Buchstaben zusammengefasst: 2a - a → a
      if (sum.kind === 'add' && sum.terms.every(isMonomialTerm)) {
        const atoms = newAtoms('')
        const p = toPoly(sum, atoms)
        if (p) return polyToExpr(p, atoms)
      }
      return sum
    }
    case 'mul': {
      const factors = e.factors.map(tidy)
      if (factors.some((f) => f.kind === 'num' && isZero(f.value))) return num(0)
      const rest = factors.filter((f) => !(f.kind === 'num' && isOne(f.value)))
      const numbers = rest.filter((f) => f.kind === 'num')
      if (numbers.length >= 2) {
        const product = numbers.reduce((acc, f) => ratMul(acc, (f as Extract<Expr, { kind: 'num' }>).value), rat(1))
        return tidy(mul(num(product), ...rest.filter((f) => f.kind !== 'num')))
      }
      return rest.length === 0 ? num(1) : rest.length === 1 ? rest[0] : mul(...rest)
    }
    case 'neg': {
      const a = tidy(e.arg)
      if (a.kind === 'num') return num(ratNeg(a.value))
      return neg(a)
    }
    case 'div': {
      const n = tidy(e.num)
      const d = tidy(e.den)
      if (n.kind === 'num' && isZero(n.value)) return num(0)
      if (n.kind === 'num' && d.kind === 'num') return num(ratDiv(n.value, d.value))
      if (d.kind === 'num' && isOne(d.value)) return n
      return div(n, d)
    }
    case 'pow': {
      const b = tidy(e.base)
      const x = tidy(e.exp)
      if (x.kind === 'num' && isZero(x.value)) return num(1)
      if (b.kind === 'num' && x.kind === 'num' && x.value.d === 1n && x.value.n >= 0n) return num(rat(b.value.n ** x.value.n, b.value.d ** x.value.n))
      return pow(b, x)
    }
    case 'root': {
      const a = tidy(e.arg)
      if (a.kind === 'num' && isZero(a.value)) return num(0)
      if (a.kind === 'num' && isOne(a.value)) return num(1)
      // Wurzel aus einem Quadrat (Buchstaben sind positiv): \sqrt{a^2} = a
      if (e.index === 2 && isMonomialTerm(a)) {
        const atoms = newAtoms('')
        const p = toPoly(a, atoms)
        const r = p && monomialSqrt(p)
        if (r) return polyToExpr(r, atoms)
      }
      return root(a, e.index)
    }
    case 'fn': {
      const a = tidy(e.arg)
      const zero = a.kind === 'num' && isZero(a.value)
      if (zero && ['sin', 'tan', 'arctan', 'sinh', 'tanh', 'arcsin'].includes(e.name)) return num(0)
      if (zero && ['cos', 'cosh'].includes(e.name)) return num(1)
      if (e.name === 'ln' && a.kind === 'num' && isOne(a.value)) return num(0)
      return fn(e.name, a)
    }
    default:
      return e
  }
}

