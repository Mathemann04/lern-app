import { type Expr, add, div, mul, neg, num, variable } from '../expr/types.ts'
import { type Rational, isOne, isZero, rat, ratAdd, ratDiv, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import { type Factor, type Factored, factorExprs, factorize, factoredPoly, reduceFrac } from './factor.ts'
import { type Frac, fracAdd, fracOf, polyExpr, startsNegative } from './frac.ts'
import { type Poly, atomsOf, constValue, degreeIn, divRem, isZeroPoly, polyConst, polyEquals, polyMul, polyNeg, polyPow, polySubstitute, polySum, totalDegree } from './poly.ts'

// Partialbruchzerlegung (Stufe 5, M2b): ein Bruch aus Polynomen in einem Buchstaben, dessen Nenner
// in Linearfaktoren zerfällt (auch doppelt), als Summe einfacher Brüche. Wie im Lehrbuch:
// 1. Ist der Grad des Zählers nicht kleiner als der des Nenners, zuerst teilen (Polynomdivision):
//    \frac{Z}{N} = q + \frac{r}{N}; zerlegt wird dann nur \frac{r}{N}.
// 2. Nenner zerlegen, je Faktor ein Bruch mit einer Zahl im Zähler; ein doppelter Faktor (x − a)²
//    bekommt zwei: \frac{A}{x - a} + \frac{B}{(x - a)^2}.
// 3. Mal den Nenner: r = A · (Nenner ohne seinen Faktor) + … Die Zahlen bestimmen: Nullstellen
//    einsetzen (dann fallen alle Summanden mit diesem Faktor weg), was übrig bleibt, über einen
//    Koeffizientenvergleich (Zahlen vor derselben Potenz von x auf beiden Seiten gleich).
// Gerechnet wird exakt; der Test fasst die Zerlegung wieder zusammen.

// Namen der unbekannten Zahlen (E ist in der Bruch-Engine schon e^x)
export const PARTIAL_LETTERS = ['A', 'B', 'C', 'D'] as const

// Ein einfacher Bruch des Ansatzes: letter / factor^power mit dem Wert value
export type PartialTerm = { readonly letter: string; readonly factor: Poly; readonly power: number; readonly value: Rational }

// Wie eine Zahl bestimmt wird:
// - insert: x = at einsetzen (Nullstelle von factor). Links steht restAt, rechts others · letter
//   (others: der Rest des Nenners an dieser Stelle)
// - compare: Zahlen vor x^power vergleichen. Links restCoef, rechts own · letter plus die Beiträge
//   der anderen, schon bekannten Zahlen (je coef · deren Wert)
export type Finding =
  | { readonly kind: 'insert'; readonly letter: string; readonly at: Rational; readonly factor: Poly; readonly restAt: Rational; readonly others: Rational; readonly value: Rational }
  | {
      readonly kind: 'compare'
      readonly letter: string
      readonly power: number
      readonly restCoef: Rational
      readonly own: Rational
      readonly others: ReadonlyArray<{ readonly letter: string; readonly coef: Rational; readonly value: Rational }>
      readonly value: Rational
    }

export type PartialWork = {
  readonly letter: string
  readonly num: Poly
  readonly den: Poly
  // Polynomdivision nötig? Dann quotient der ganze Teil (sonst leer) und rest der Rest
  readonly divided: boolean
  readonly quotient: Poly
  readonly rest: Poly
  // Nenner in Faktoren, in der Reihenfolge, in der sie geschrieben werden
  readonly factored: Factored
  readonly terms: readonly PartialTerm[]
  readonly findings: readonly Finding[]
  // Mal den Nenner: rest = rechte Seite, z. B. A(x + 1) + B(x - 2)
  readonly equationRight: Expr
}

// --- Rechnen ---

const valueAt = (p: Poly, letter: string, at: Rational): Rational => constValue(polySubstitute(p, letter, polyConst(at))) ?? rat(0)

// Zahl vor letter^power
function coefAt(p: Poly, letter: string, power: number): Rational {
  const term = p.find((t) => degreeIn([t], letter) === power)
  return term?.coef ?? rat(0)
}

// Nullstelle eines Linearfaktors ax + b
function rootOf(f: Poly, letter: string): Rational {
  const a = coefAt(f, letter, 1)
  return ratNeg(ratDiv(coefAt(f, letter, 0), a))
}

const isLinear = (f: Poly, letter: string) => degreeIn(f, letter) === 1 && atomsOf(f).every((a) => a === letter)

// Faktoren in der Reihenfolge, in der factoredExpr sie schreibt: einzelne Buchstaben zuerst, dann
// nach Grad (sonst wie gegeben)
export function displayOrder(factors: readonly Factor[]): Factor[] {
  return [...factors].sort((a, b) => (a.poly.length === 1 ? 0 : 1) - (b.poly.length === 1 ? 0 : 1) || totalDegree(a.poly) - totalDegree(b.poly))
}

// Nenner ohne den Faktor f^power (Zahl davor bleibt): das, womit die Zahl des Bruchs f^power nach dem
// Malnehmen mit dem Nenner dasteht
export function cofactor(factored: Factored, f: Poly, power: number): Factored {
  const factors = factored.factors.flatMap((g) => {
    if (!polyEquals(g.poly, f)) return [g]
    return g.exp > power ? [{ poly: g.poly, exp: g.exp - power }] : []
  })
  return { coef: factored.coef, factors }
}

// Zerlegt num/den in Partialbrüche; null, wenn der Nenner nicht in Linearfaktoren (höchstens doppelt)
// zerfällt oder mehr als ein Buchstabe vorkommt
export function partialWorkOf(numerator: Poly, den: Poly, hints: readonly Poly[] = []): PartialWork | null {
  const atoms = [...new Set([...atomsOf(numerator), ...atomsOf(den)])]
  if (atoms.length > 1) return null
  const letter = atoms[0] ?? 'x'
  if (degreeIn(den, letter) < 1) return null
  const divided = degreeIn(numerator, letter) >= degreeIn(den, letter)
  const { q, r } = divided ? divRem(numerator, den, letter) : { q: [] as Poly, r: numerator }
  if (isZeroPoly(r)) return null
  const raw = factorize(den, hints)
  if (!raw.factors.every((f) => isLinear(f.poly, letter) && f.exp <= 2)) return null
  const factored: Factored = { coef: raw.coef, factors: displayOrder(raw.factors) }

  // Ansatz: je Faktor f^e die Brüche f^1 … f^e
  const slots = factored.factors.flatMap((f) => Array.from({ length: f.exp }, (_, i) => ({ factor: f.poly, power: i + 1, top: i + 1 === f.exp })))
  if (slots.length > PARTIAL_LETTERS.length) return null
  const named = slots.map((s, i) => ({ ...s, letter: PARTIAL_LETTERS[i], co: factoredPoly(cofactor(factored, s.factor, s.power)) }))

  const values = new Map<string, Rational>()
  const findings: Finding[] = []
  const pure = factored.factors.length === 1
  // Nullstellen einsetzen (je Faktor für die höchste Potenz), außer der Nenner ist eine einzige Potenz
  if (!pure) {
    for (const s of named.filter((s) => s.top)) {
      const at = rootOf(s.factor, letter)
      const restAt = valueAt(r, letter, at)
      const others = valueAt(s.co, letter, at)
      if (isZero(others)) return null
      const value = ratDiv(restAt, others)
      values.set(s.letter, value)
      findings.push({ kind: 'insert', letter: s.letter, at, factor: s.factor, restAt, others, value })
    }
  }
  // Der Rest über Koeffizientenvergleich, von der höchsten Potenz an abwärts
  const n = degreeIn(den, letter)
  let power = n - 1
  for (const s of named.filter((s) => !values.has(s.letter))) {
    const own = coefAt(s.co, letter, power)
    if (isZero(own)) return null
    const others = named
      .filter((o) => o !== s && values.has(o.letter))
      .map((o) => ({ letter: o.letter, coef: coefAt(o.co, letter, power), value: values.get(o.letter)! }))
      .filter((o) => !isZero(o.coef))
    const restCoef = coefAt(r, letter, power)
    const known = others.reduce((sum, o) => ratAdd(sum, ratMul(o.coef, o.value)), rat(0))
    const value = ratDiv(ratSub(restCoef, known), own)
    values.set(s.letter, value)
    findings.push({ kind: 'compare', letter: s.letter, power, restCoef, own, others, value })
    power--
  }

  // Probe: rechte Seite ausmultipliziert gleich dem Rest
  const right = polySum(named.map((s) => polyMul(polyConst(values.get(s.letter)!), s.co)))
  if (!polyEquals(right, r)) return null
  const terms = named.map((s) => ({ letter: s.letter, factor: s.factor, power: s.power, value: values.get(s.letter)! }))
  const equationRight = add(
    ...named.map((s) => {
      const co = cofactor(factored, s.factor, s.power)
      const parts = factorExprs(co)
      const c = isOne(co.coef) ? [] : [num(co.coef)]
      return parts.length === 0 && c.length === 0 ? variable(s.letter) : mul(...c, variable(s.letter), ...parts)
    }),
  )
  return { letter, num: numerator, den, divided, quotient: q, rest: r, factored, terms, findings, equationRight }
}

// --- Werte ---

export const termFrac = (t: PartialTerm): Frac => ({ num: polyConst(t.value), den: polyPow(t.factor, t.power) })

// Wert der Zerlegung (ganzer Teil plus einfache Brüche)
export function partialFrac(quotient: Poly, terms: readonly PartialTerm[]): Frac {
  return terms.filter((t) => !isZero(t.value)).reduce((sum, t) => fracAdd(sum, termFrac(t)), fracOf(quotient))
}

// --- Schreibweise ---

// Summe möglichst mit Plus vorn: 3 − x statt −x + 3
function sumExpr(p: Poly): Expr {
  if (p.length >= 2 && startsNegative(p) && !startsNegative([...p].reverse())) return polyExpr(p, 'ascending')
  return polyExpr(p)
}

// Der ganze Teil als Summanden (ohne Klammer davor): x + 1 + \frac{…}{…} statt (x + 1) + …
function wholeTerms(quotient: Poly): Expr[] {
  if (isZeroPoly(quotient)) return []
  const e = sumExpr(quotient)
  return e.kind === 'add' ? [...e.terms] : [e]
}

// Faktor mit Hochzahl: x - 2, (x - 1)^2, x
export const factorPowerExpr = (f: Poly, power: number): Expr => factorExprs({ coef: rat(1), factors: [{ poly: f, exp: power }] })[0]

// Ein einfacher Bruch: \frac{3}{x - 2}, -\frac{2}{(x + 1)^2}, \frac{2}{3(x - 1)}
function termExpr(t: PartialTerm): Expr {
  const v = t.value
  const abs = ratSign(v) < 0 ? ratNeg(v) : v
  const den = factorPowerExpr(t.factor, t.power)
  const body = div(num(abs.n), abs.d === 1n ? den : mul(num(abs.d), den))
  return ratSign(v) < 0 ? neg(body) : body
}

// Ganzer Teil vorn, dann die Brüche; Zahlen 0 fallen weg
export function partialExpr(quotient: Poly, terms: readonly PartialTerm[]): Expr {
  const fractions = terms.filter((t) => !isZero(t.value)).map(termExpr)
  const all = [...wholeTerms(quotient), ...fractions]
  return all.length === 0 ? num(0) : add(...all)
}

// Ansatz mit den Buchstaben: q + \frac{A}{x - 2} + \frac{B}{x + 1}
export function ansatzExpr(quotient: Poly, terms: ReadonlyArray<Pick<PartialTerm, 'letter' | 'factor' | 'power'>>): Expr {
  const fractions = terms.map((t) => div(variable(t.letter), factorPowerExpr(t.factor, t.power)))
  return add(...wholeTerms(quotient), ...fractions)
}

// Bruch mit Zähler und Nenner als Summen: \frac{3x + 1}{x^2 - x - 2}, Minus vor dem Bruch, wenn der
// Zähler ganz negativ ist
export function plainFracExpr(numerator: Poly, den: Expr): Expr {
  const allNegative = startsNegative(numerator) && (numerator.length < 2 || startsNegative([...numerator].reverse()))
  return allNegative ? neg(div(sumExpr(polyNeg(numerator)), den)) : div(sumExpr(numerator), den)
}

// Nach der Polynomdivision: q + \frac{r}{N} (den: der Nenner, wie er dasteht)
export function dividedExpr(w: PartialWork, den: Expr): Expr {
  return add(...wholeTerms(w.quotient), plainFracExpr(w.rest, den))
}

// Zahl mal Buchstabe: 3A, -A, \frac{1}{2}B
export function coefTimes(c: Rational, letter: string): Expr {
  const v = variable(letter)
  if (isOne(c)) return v
  if (isOne(ratNeg(c))) return neg(v)
  return ratSign(c) < 0 ? neg(mul(num(ratNeg(c)), v)) : mul(num(c), v)
}

// Gleichung, aus der eine Zahl folgt, links die Zahl, rechts die Buchstaben: beim Einsetzen
// 9 = 3A, beim Koeffizientenvergleich 0 = A + C
export function findingEquation(f: Finding): [Expr, Expr] {
  if (f.kind === 'insert') return [num(f.restAt), coefTimes(f.others, f.letter)]
  return [num(f.restCoef), add(coefTimes(f.own, f.letter), ...f.others.map((o) => coefTimes(o.coef, o.letter)))]
}

// Zerlegung eines beliebigen Bruchs als Term (für falsche Ergebnisse); null, wenn er sich nicht zerlegen lässt
export function partialResultOf(value: Frac, hints: readonly Poly[] = []): Expr | null {
  // erst kürzen: Summen von Brüchen haben oft gemeinsame Faktoren in Zähler und Nenner
  const reduced = reduceFrac(value, hints)
  const w = partialWorkOf(reduced.num, factoredPoly(reduced.den), hints)
  return w ? partialExpr(w.quotient, w.terms) : null
}

// Werte der Zerlegung, wenn eine Zahl falsch bestimmt wurde und man danach richtig weiterrechnet:
// Eingesetzte Zahlen bleiben, was danach über den Koeffizientenvergleich kommt, rechnet mit der
// falschen Zahl weiter
export function termsWith(w: PartialWork, letter: string, wrong: Rational): PartialTerm[] {
  const values = new Map<string, Rational>()
  for (const f of w.findings) {
    if (f.letter === letter) values.set(f.letter, wrong)
    else if (f.kind === 'insert') values.set(f.letter, f.value)
    else {
      const known = f.others.reduce((sum, o) => ratAdd(sum, ratMul(o.coef, values.get(o.letter) ?? o.value)), rat(0))
      values.set(f.letter, ratDiv(ratSub(f.restCoef, known), f.own))
    }
  }
  return w.terms.map((t) => ({ ...t, value: values.get(t.letter) ?? t.value }))
}

// Wie oft der Faktor im Nenner steht
export const multiplicityOf = (w: PartialWork, f: Poly) => w.factored.factors.find((g) => polyEquals(g.poly, f))?.exp ?? 0

// Wert eines Polynoms an einer Stelle
export const polyValueAt = valueAt
