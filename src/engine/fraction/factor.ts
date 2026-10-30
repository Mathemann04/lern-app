import { type Expr, div, mul, neg, num, pow } from '../expr/types.ts'
import { type Rational, isInteger, isOne, isZero, rat, ratAbs, ratAdd, ratDiv, ratMul, ratNeg, ratSign } from '../rational.ts'
import { type Frac, atomPowerExpr, displayRank, polyExpr, startsNegative } from './frac.ts'
import {
  type Poly,
  atomsOf,
  constValue,
  degreeIn,
  gcdUnivariate,
  isZeroPoly,
  lcmBig,
  monomialContent,
  polyConst,
  polyContent,
  polyDivideExact,
  polyEquals,
  polyMul,
  polyPow,
  polyScale,
  primitivePart,
  totalDegree,
} from './poly.ts'

// Zerlegen in Faktoren wie im Skript, kleinstes gemeinsames Vielfaches (Hauptnenner) und Kürzen.
//
// Zerlegt wird: Zahl ausklammern, gemeinsame Potenzen ausklammern (3x² + 6x = 3x(x + 2)), durch
// bekannte Faktoren der Aufgabe teilen (hints, auch bei mehreren Buchstaben) und bei einem
// Buchstaben über rationale Nullstellen (x² − 9 = (x − 3)(x + 3), x² − x − 6 = (x − 3)(x + 2)).
// Was übrig bleibt (z. B. x² + 1), gilt als nicht weiter zerlegbar.

export type Factor = { readonly poly: Poly; readonly exp: number }
// coef · f₁^e₁ · f₂^e₂ …; jedes fᵢ ganzzahlig, teilerfremd, erster Summand positiv, verschieden
export type Factored = { readonly coef: Rational; readonly factors: readonly Factor[] }

export const ONE_FACTORED: Factored = { coef: rat(1), factors: [] }

function withFactor(factors: Factor[], poly: Poly, exp: number): Factor[] {
  const i = factors.findIndex((f) => polyEquals(f.poly, poly))
  if (i === -1) return [...factors, { poly, exp }]
  return factors.map((f, j) => (j === i ? { poly, exp: f.exp + exp } : f))
}

// Koeffizienten eines Polynoms in einem Atom, Index = Hochzahl
function coefficients(p: Poly, atom: string): Rational[] {
  const result = Array.from({ length: degreeIn(p, atom) + 1 }, () => rat(0))
  for (const t of p) {
    const e = t.mono.find(([a]) => a === atom)?.[1] ?? 0
    result[e] = t.coef
  }
  return result
}

function valueAt(coefs: readonly Rational[], r: Rational): Rational {
  return coefs.reduceRight((acc, c) => ratAdd(ratMul(acc, r), c), rat(0))
}

// Positive Teiler einer (nicht zu großen) ganzen Zahl
function divisors(n: bigint): bigint[] {
  const m = n < 0n ? -n : n
  if (m === 0n || m > 1_000_000n) return []
  const result: bigint[] = []
  for (let d = 1n; d * d <= m; d++) {
    if (m % d === 0n) {
      result.push(d)
      if (d * d !== m) result.push(m / d)
    }
  }
  return result.sort((a, b) => (a < b ? -1 : 1))
}

// Lineare Faktoren (q·t − p) eines ganzzahligen Polynoms in einem Atom aus rationalen Nullstellen
function splitLinear(p: Poly, atom: string): { linear: Poly[]; rest: Poly } {
  const linear: Poly[] = []
  let rest = p
  let found = true
  while (found && degreeIn(rest, atom) >= 1) {
    found = false
    const coefs = coefficients(rest, atom)
    const a0 = coefs[0].n
    const an = coefs[coefs.length - 1].n
    if (a0 === 0n) break
    search: for (const q of divisors(an)) {
      for (const pAbs of divisors(a0)) {
        for (const pVal of [-pAbs, pAbs]) {
          const r = rat(pVal, q)
          if (r.d !== q || !isZero(valueAt(coefs, r))) continue
          const factor = primitivePart([
            { mono: [[atom, 1]], coef: rat(q) },
            { mono: [], coef: rat(-pVal) },
          ])
          rest = polyDivideExact(rest, factor)!
          linear.push(factor)
          found = true
          break search
        }
      }
    }
  }
  return { linear, rest }
}

// Zerlegt p in Faktoren. hints: bekannte Faktoren der Aufgabe, z. B. x + h oder a − b.
export function factorize(p: Poly, hints: readonly Poly[] = []): Factored {
  if (isZeroPoly(p)) throw new RangeError('Null lässt sich nicht zerlegen')
  const c = constValue(p)
  if (c) return { coef: c, factors: [] }

  const unit = polyContent(p)
  let rest = polyScale(p, ratDiv(rat(1), unit))
  let factors: Factor[] = []

  const mono = monomialContent(rest)
  if (mono.length > 0) {
    for (const [atom, e] of mono) factors = withFactor(factors, [{ mono: [[atom, 1]], coef: rat(1) }], e)
    rest = polyDivideExact(rest, [{ mono, coef: rat(1) }])!
  }

  for (const raw of hints) {
    const h = primitivePart(raw)
    if (h.length < 2) continue
    for (let q = polyDivideExact(rest, h); q && constValue(rest) === null; q = polyDivideExact(rest, h)) {
      factors = withFactor(factors, h, 1)
      rest = q
    }
  }

  const atoms = atomsOf(rest)
  if (atoms.length === 1) {
    const split = splitLinear(rest, atoms[0])
    for (const f of split.linear) factors = withFactor(factors, f, 1)
    rest = split.rest
  }
  if (constValue(rest) === null) {
    const restUnit = polyContent(rest)
    factors = withFactor(factors, polyScale(rest, ratDiv(rat(1), restUnit)), 1)
    return { coef: ratMul(unit, restUnit), factors }
  }
  return { coef: ratMul(unit, constValue(rest)!), factors }
}

export const factoredPoly = (f: Factored): Poly =>
  polyScale(
    f.factors.reduce((acc, { poly, exp }) => polyMul(acc, polyPow(poly, exp)), polyConst(1)),
    f.coef,
  )

// Kleinstes gemeinsames Vielfaches (für den Hauptnenner); Zahlfaktoren als ganze Zahlen
export function factoredLcm(items: readonly Factored[]): Factored {
  let coef = 1n
  let factors: Factor[] = []
  for (const item of items) {
    coef = lcmBig(coef, item.coef.n < 0n ? -item.coef.n : item.coef.n)
    for (const f of item.factors) {
      const i = factors.findIndex((g) => polyEquals(g.poly, f.poly))
      if (i === -1) factors = [...factors, f]
      else if (factors[i].exp < f.exp) factors = factors.map((g, j) => (j === i ? f : g))
    }
  }
  return { coef: rat(coef), factors }
}

// a / b, wenn jeder Faktor von b in a steckt (Erweiterungsfaktor); sonst null
export function factoredDivide(a: Factored, b: Factored): Factored | null {
  let factors = [...a.factors]
  for (const f of b.factors) {
    const i = factors.findIndex((g) => polyEquals(g.poly, f.poly))
    if (i === -1 || factors[i].exp < f.exp) return null
    factors[i] = { poly: f.poly, exp: factors[i].exp - f.exp }
  }
  factors = factors.filter((f) => f.exp > 0)
  return { coef: ratDiv(a.coef, b.coef), factors }
}

export const isOneFactored = (f: Factored) => isOne(f.coef) && f.factors.length === 0

// Ist h ein gemeinsamer Nenner für d (d geht in h auf, ganzzahliger Erweiterungsfaktor)?
export function isMultipleOf(h: Poly, d: Poly): boolean {
  const q = polyDivideExact(h, d)
  return q !== null && q.every((t) => isInteger(t.coef))
}

// --- Schreibweise ---

// Faktor als Term: x², (x + 3), (e^x − 1)³
function factorExpr({ poly, exp }: Factor): Expr {
  if (poly.length === 1 && poly[0].mono.length === 1 && poly[0].mono[0][1] === 1) {
    return atomPowerExpr(poly[0].mono[0][0], exp)
  }
  const base = polyExpr(poly)
  return exp === 1 ? base : pow(base, num(exp))
}

const atomOf = (f: Factor) => (f.poly.length === 1 && f.poly[0].mono.length === 1 ? f.poly[0].mono[0][0] : null)

// Die Faktoren ohne Zahl davor, je als Term: einzelne Buchstaben zuerst und alphabetisch (ab, x(x + 1))
export const factorExprs = (f: Factored): Expr[] =>
  [...f.factors]
    .sort((a, b) => {
      const [x, y] = [atomOf(a), atomOf(b)]
      if (x !== null && y !== null) return displayRank(x) - displayRank(y)
      return (x === null ? 1 : 0) - (y === null ? 1 : 0)
    })
    .map(factorExpr)

// Zerlegung als Produkt, z. B. 2(x − 3)(x + 3), −(x − 1), 6x²
export function factoredExpr(f: Factored): Expr {
  if (ratSign(f.coef) < 0) return neg(factoredExpr({ coef: ratNeg(f.coef), factors: f.factors }))
  const parts = factorExprs(f)
  if (parts.length === 0) return num(f.coef)
  if (isOne(f.coef)) return mul(...parts)
  if (!isInteger(f.coef)) {
    const top = f.coef.n === 1n ? mul(...parts) : mul(num(f.coef.n), ...parts)
    return div(top, num(f.coef.d))
  }
  return mul(num(f.coef), ...parts)
}

// --- Kürzen ---

// Vollständig gekürzter Bruch: Zähler ausmultipliziert, Nenner in Faktoren mit ganzer Zahl vorn
export type Reduced = { readonly num: Poly; readonly den: Factored }

export function reduceFrac(f: Frac, hints: readonly Poly[] = []): Reduced {
  if (isZeroPoly(f.num)) return { num: [], den: ONE_FACTORED }
  const fd = factorize(f.den, hints)
  const fn = factorize(f.num, [...fd.factors.map((g) => g.poly), ...hints])

  // gemeinsame Faktoren streichen
  let numFactors = [...fn.factors]
  let denFactors = [...fd.factors]
  for (const g of fd.factors) {
    const i = numFactors.findIndex((h) => polyEquals(h.poly, g.poly))
    if (i === -1) continue
    const k = Math.min(numFactors[i].exp, g.exp)
    numFactors = numFactors.map((h, j) => (j === i ? { ...h, exp: h.exp - k } : h)).filter((h) => h.exp > 0)
    denFactors = denFactors.map((h) => (polyEquals(h.poly, g.poly) ? { ...h, exp: h.exp - k } : h)).filter((h) => h.exp > 0)
  }
  let coef = ratDiv(fn.coef, fd.coef)
  let numPoly = factoredPoly({ coef: rat(1), factors: numFactors })
  let den: Factored = { coef: rat(1), factors: denFactors }

  // Sicherheitsnetz bei einem Buchstaben: was die Zerlegung übersehen hat, findet Euklid
  const g = gcdUnivariate(numPoly, factoredPoly(den))
  if (g && totalDegree(g) > 0) {
    numPoly = polyDivideExact(numPoly, g)!
    const rest = factorize(polyDivideExact(factoredPoly(den), g)!, hints)
    coef = ratDiv(coef, rest.coef)
    den = { coef: rat(1), factors: rest.factors }
  }

  // Zahlfaktor p/q: p in den Zähler, q (positiv) als Zahl vor den Nenner
  return { num: polyScale(numPoly, rat(coef.n)), den: { coef: rat(coef.d), factors: den.factors } }
}

export const reducedFrac = (r: Reduced): Frac => ({ num: r.num, den: factoredPoly(r.den) })

// Schreibweise des Ergebnisses: \frac{x + 5}{(x - 1)(x + 1)}, -\frac{2x}{3y^2}, e^x - 1. Der Zähler
// beginnt möglichst mit Plus (\frac{b - a}{ab}); nur wenn alles negativ ist, steht das Minus vorn.
export function reducedExpr(r: Reduced): Expr {
  const flipped = r.num.length >= 2 && startsNegative(r.num) && !startsNegative([...r.num].reverse())
  const numerator = polyExpr(r.num, flipped ? 'ascending' : 'descending')
  if (isOneFactored(r.den)) return numerator
  if (startsNegative(r.num) && !flipped) return neg(div(polyExpr(polyScale(r.num, rat(-1))), factoredExpr(r.den)))
  return div(numerator, factoredExpr(r.den))
}

// Schreibweise eines falschen Ergebnisses im geführten Modus: gekürzt wie ein Ergebnis, aber ein
// Zähler aus mehreren Faktoren mit Klammern bleibt ein Produkt, so wie man ihn nach dem Fehler
// hinschreibt: \frac{x(x + 3)(x - 3)}{2} statt \frac{x^3 - 9x}{2}
export function productFormExpr(r: Reduced, hints: readonly Poly[] = []): Expr {
  const fn = factorize(r.num, [...r.den.factors.map((f) => f.poly), ...hints])
  const brackets = fn.factors.filter((f) => f.poly.length >= 2)
  const isProduct = brackets.length > 0 && (fn.factors.length >= 2 || brackets.some((f) => f.exp >= 2))
  if (!isProduct) return reducedExpr(r)
  const numerator = factoredExpr({ coef: ratAbs(fn.coef), factors: fn.factors })
  const body = isOneFactored(r.den) ? numerator : div(numerator, factoredExpr(r.den))
  return ratSign(fn.coef) < 0 ? neg(body) : body
}
