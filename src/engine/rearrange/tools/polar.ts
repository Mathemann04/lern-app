import { subterms } from '../../expr/compare.ts'
import { evaluate } from '../../expr/evaluate.ts'
import { toLatex } from '../../expr/print.ts'
import { type Expr, type Tool, IMAG, PI, add, asRational, div, fn, mul, neg, num, pow, sqrt, sub } from '../../expr/types.ts'
import { type Rational, isOne, isZero, rat, ratAdd, ratMul, ratNeg, ratSign } from '../../rational.ts'
import { newAtoms, polyToExpr, toPoly } from '../algebra.ts'
import { product } from './determinant.ts'
import { signedPart, squareOf, squareRootOf, tidySum } from './tidy.ts'

// Betrag und Winkel komplexer Zahlen (Stufe 5, Teil 8b). Im Rumpf steht ein Produkt oder Bruch aus
// komplexen Zahlen p + q\mathrm{i} (auch hoch 2, auch e^{\mathrm{i}x} = \cos x + \mathrm{i}\sin x):
// - Betrag: \lvert p + q\mathrm{i}\rvert = \sqrt{p^2 + q^2}, Beträge werden malgenommen bzw. geteilt; ein Bruch
//   steht unter einer Wurzel (\sqrt{\frac{x^2 + a^2}{x^2 + b^2}}), \left\lvert z^2\right\rvert = p^2 + q^2 ohne
//   Wurzel, eine Zahl wie \lvert 3 + 4\mathrm{i}\rvert = 5 vor der Wurzel.
// - Winkel: \arg(p + q\mathrm{i}) = \arctan\frac{q}{p} für p > 0 (der Baukasten sorgt dafür), Winkel werden
//   addiert bzw. abgezogen, beim Quadrieren verdoppelt; feste Faktoren mit ihrem Winkel (1 + \mathrm{i}:
//   \frac{\pi}{4}); zwei Faktoren mit Buchstaben werden erst ausmultipliziert.
// Die Gegenprobe (evaluate.ts) rechnet mit komplexen Zahlen, unabhängig davon.

export type AbsTool = Extract<Tool, { kind: 'abs' }>
export type ArgTool = Extract<Tool, { kind: 'arg' }>

export type AbsMistake = 'eq-abs-termwise' | 'eq-abs-root' | 'eq-abs-imag-squared'
export const ABS_MISTAKES: readonly AbsMistake[] = ['eq-abs-termwise', 'eq-abs-root', 'eq-abs-imag-squared']
export type ArgMistake = 'eq-arg-power' | 'eq-arg-swapped' | 'eq-arg-arctan-forgotten' | 'eq-arg-quotient-sign'
export const ARG_MISTAKES: readonly ArgMistake[] = ['eq-arg-power', 'eq-arg-swapped', 'eq-arg-arctan-forgotten', 'eq-arg-quotient-sign']

// Komplexe Zahl p + q\mathrm{i} mit reellen Teilen, hoch power (±1, ±2)
export type ComplexFactor = { readonly re: Expr; readonly im: Expr; readonly power: number }

const isImag = (e: Expr) => e.kind === 'const' && e.name === 'i'
const isE = (e: Expr) => e.kind === 'const' && e.name === 'e'
const hasImag = (e: Expr) => subterms(e).some(isImag)
const hasLetter = (...es: readonly Expr[]) => es.some((e) => subterms(e).some((s) => s.kind === 'var'))
const isZeroExpr = (e: Expr) => e.kind === 'num' && e.value.n === 0n
const negated = (e: Expr): Expr => {
  const r = asRational(e)
  return r ? num(ratNeg(r)) : e.kind === 'neg' ? e.arg : neg(e)
}

// Faktor vor \mathrm{i} in einer Hochzahl: \mathrm{i}x → x, 2\mathrm{i}x → 2x; sonst null
function imagCoefficient(e: Expr): Expr | null {
  if (isImag(e)) return num(1)
  if (e.kind !== 'mul' || e.factors.filter(isImag).length !== 1 || e.factors.some((f) => !isImag(f) && hasImag(f))) return null
  const rest = e.factors.filter((f) => !isImag(f))
  return rest.length === 1 ? rest[0] : product(...rest)
}

// Real- und Imaginärteil einer Summe wie x + a\mathrm{i}, (x + a)\mathrm{i}, be^{\mathrm{i}x} - a; null bei anderen Formen
function linearParts(e: Expr): { re: Expr[]; im: Expr[] } | null {
  const re: Expr[] = []
  const im: Expr[] = []
  for (const term of e.kind === 'add' ? e.terms : [e]) {
    const negative = term.kind === 'neg'
    const inner = negative ? term.arg : term
    const signed = (x: Expr) => (negative ? negated(x) : x)
    if (!hasImag(inner)) {
      re.push(signed(inner))
      continue
    }
    const factors = inner.kind === 'mul' ? inner.factors : [inner]
    const imag = imagCoefficient(inner)
    if (imag) {
      im.push(signed(imag))
      continue
    }
    // c \cdot e^{\mathrm{i}t} = c\cos t + c\mathrm{i}\sin t
    const euler = factors.filter((f) => f.kind === 'pow' && isE(f.base) && hasImag(f.exp))
    const angle = euler.length === 1 && euler[0].kind === 'pow' ? imagCoefficient(euler[0].exp) : null
    if (!angle || factors.some((f) => f !== euler[0] && hasImag(f))) return null
    const c = factors.filter((f) => f !== euler[0])
    re.push(signed(product(...c, fn('cos', angle))))
    im.push(signed(product(...c, fn('sin', angle))))
  }
  return { re, im }
}

// Faktoren des Rumpfs: Produkte aus Klammern, Brüche und Potenzen wie (x + a\mathrm{i})^2
export function complexFactors(body: Expr): ComplexFactor[] | null {
  if (body.kind === 'div') {
    const top = complexFactors(body.num)
    const bottom = complexFactors(body.den)
    return top && bottom && [...top, ...bottom.map((f) => ({ ...f, power: -f.power }))]
  }
  if (body.kind === 'pow' && !isE(body.base)) {
    const k = asRational(body.exp)
    const inner = k && k.d === 1n ? complexFactors(body.base) : null
    return inner && inner.map((f) => ({ ...f, power: f.power * Number(k!.n) }))
  }
  if (body.kind === 'mul' && body.factors.some((f) => f.kind === 'add' || f.kind === 'div' || (f.kind === 'pow' && !isE(f.base)))) {
    const parts = body.factors.map(complexFactors)
    return parts.every((p) => p !== null) ? (parts as ComplexFactor[][]).flat() : null
  }
  const p = linearParts(body)
  return p && [{ re: tidySum(p.re), im: tidySum(p.im), power: 1 }]
}

// --- Betrag ---

// Wert hoch k (k > 0), Summen in Klammern: (x^2 + a^2)^2
const raised = (e: Expr, k: number): Expr => (k === 1 ? e : e.kind === 'add' ? pow(e, num(k)) : squareOf(e))

// Produkt und Bruch aus Werten mit Potenzen (±1, ±2), Zahlen vorn
function combine(items: readonly { readonly value: Expr; readonly power: number }[]): Expr {
  const part = (list: typeof items) => {
    const sorted = [...list.filter((i) => i.value.kind === 'num'), ...list.filter((i) => i.value.kind !== 'num')]
    const factors = sorted.map((i) => raised(i.value, Math.abs(i.power))).filter((f) => !(f.kind === 'num' && isOne(f.value)))
    return factors.length === 0 ? num(1) : factors.length === 1 ? factors[0] : mul(...factors)
  }
  const top = part(items.filter((i) => i.power > 0))
  const bottom = items.filter((i) => i.power < 0)
  return bottom.length === 0 ? top : div(top, part(bottom))
}

// p^2 + q^2 (mit dem Fehler „\mathrm{i} mitquadriert" p^2 - q^2 bei Faktoren mit Buchstaben)
function squareSum(f: ComplexFactor, imagSquared: boolean): Expr {
  const q = squareOf(f.im)
  return tidySum([squareOf(f.re), imagSquared && hasLetter(f.re, f.im) ? negated(q) : q])
}

// \lvert z\rvert mit einem typischen Fehler; null, wenn der Rumpf keine passende Form hat oder der Fehler
// hier nichts ändert
export function absValue(t: AbsTool, mistake: AbsMistake | null): Expr | null {
  const factors = complexFactors(t.body)
  if (!factors || factors.some((f) => f.power === 0 || Math.abs(f.power) > 2) || factors.every((f) => isZeroExpr(f.im))) return null
  const odd = factors.some((f) => Math.abs(f.power) === 1)
  if (mistake === 'eq-abs-termwise') {
    // \lvert p + q\mathrm{i}\rvert = p + q: ändert nur etwas, wenn Real- und Imaginärteil beide dastehen
    if (!factors.some((f) => !isZeroExpr(f.re) && !isZeroExpr(f.im))) return null
    return combine(factors.map((f) => ({ value: tidySum([f.re, f.im]), power: f.power })))
  }
  // Wurzel vergessen: \lvert z\rvert^2 statt \lvert z\rvert (ohne Wurzel im Betrag gibt es nichts zu vergessen)
  if (mistake === 'eq-abs-root') return odd ? combine(factors.map((f) => ({ value: squareSum(f, false), power: f.power }))) : null
  const imagSquared = mistake === 'eq-abs-imag-squared'
  if (imagSquared && !factors.some((f) => hasLetter(f.re, f.im) && !isZeroExpr(f.im))) return null
  const outside: { value: Expr; power: number }[] = []
  const inside: { value: Expr; power: number }[] = []
  for (const f of factors) {
    const s = squareSum(f, imagSquared)
    const r = asRational(s)
    const root = r && squareRootOf(r)
    if (Math.abs(f.power) === 2) outside.push({ value: s, power: f.power / 2 })
    else if (root !== null) outside.push({ value: num(root), power: f.power })
    else inside.push({ value: s, power: f.power })
  }
  if (inside.length === 0) return combine(outside)
  const root = sqrt(combine(inside))
  const top = outside.filter((o) => o.power > 0)
  const bottom = outside.filter((o) => o.power < 0)
  const numerator = top.length === 0 ? root : mul(...top.map((o) => raised(o.value, o.power)), root)
  return bottom.length === 0 ? numerator : div(numerator, combine(bottom.map((o) => ({ ...o, power: -o.power }))))
}

// --- Winkel ---

// Winkel eines Faktors ohne Buchstaben als Vielfaches von \pi (1 + \mathrm{i}: \frac{1}{4}, \sqrt{3} + \mathrm{i}: \frac{1}{6});
// null, wenn es kein Vielfaches von \frac{\pi}{12} ist
function standardAngle(f: ComplexFactor): Rational | null {
  const angle = Math.atan2(evaluate(f.im, {}), evaluate(f.re, {})) / Math.PI
  const twelfths = Math.round(angle * 12)
  return Number.isFinite(angle) && Math.abs(angle * 12 - twelfths) < 1e-9 ? rat(twelfths, 12) : null
}

// Ist der Realteil für alle positiven Buchstaben positiv? (x, a, e^{x}, \sqrt{x}, x + a, 2ax; nicht x - a)
const positiveTerms = (e: Expr) => (e.kind === 'add' ? e.terms : [e]).every((t) => signedPart(t).sign > 0 && !isZeroExpr(t))

// Faktor mit Buchstaben: \arctan\frac{q}{p}, mit einem Fehler vertauscht oder ohne \arctan; Minus vor q nach vorn
function factorAngle(f: ComplexFactor, mistake: ArgMistake | null): Expr | null {
  if (!positiveTerms(f.re) || isZeroExpr(f.im)) return null
  const { sign, magnitude } = signedPart(f.im)
  const ratio = mistake === 'eq-arg-swapped' ? quotient(f.re, magnitude) : quotient(magnitude, f.re)
  const angle = mistake === 'eq-arg-arctan-forgotten' ? ratio : fn('arctan', ratio)
  return sign < 0 ? negated(angle) : angle
}

const quotient = (top: Expr, bottom: Expr): Expr => (bottom.kind === 'num' && isOne(bottom.value) ? top : div(top, bottom))

// (p + q\mathrm{i})(r + s\mathrm{i}) = (pr - qs) + (ps + qr)\mathrm{i}, ausmultipliziert
function multiplied(f: ComplexFactor, g: ComplexFactor): ComplexFactor | null {
  const atoms = newAtoms('~')
  const re = toPoly(sub(mul(f.re, g.re), mul(f.im, g.im)), atoms)
  const im = toPoly(add(mul(f.re, g.im), mul(f.im, g.re)), atoms)
  return re && im ? { re: polyToExpr(re, atoms), im: polyToExpr(im, atoms), power: 1 } : null
}

// Faktoren für den Winkel: zwei Faktoren mit Buchstaben (ein Produkt) erst ausmultipliziert
export function argFactors(t: ArgTool): ComplexFactor[] | null {
  const factors = complexFactors(t.body)
  if (!factors || factors.some((f) => f.power === 0 || Math.abs(f.power) > 2)) return null
  if (factors.filter((f) => hasLetter(f.re, f.im)).length < 2) return factors
  if (factors.length !== 2 || factors.some((f) => f.power !== 1)) return null
  const product = multiplied(factors[0], factors[1])
  return product && [product]
}

// Vielfaches von \pi: \frac{\pi}{4}, -\frac{\pi}{4}, \frac{3\pi}{4}, \pi
function piTimes(c: Rational): Expr {
  if (ratSign(c) < 0) return negated(piTimes(ratNeg(c)))
  const top = c.n === 1n ? PI : mul(num(c.n), PI)
  return c.d === 1n ? top : div(top, num(c.d))
}

// k \cdot Winkel: 2\arctan\frac{a}{x}, -\arctan\frac{a}{x}
const timesAngle = (k: number, angle: Expr): Expr => {
  if (k === 1) return angle
  if (k === -1) return negated(angle)
  const { sign, magnitude } = signedPart(angle)
  // ohne \arctan (typischer Fehler): 2 \cdot \frac{a}{x} als \frac{2a}{x}
  const value = magnitude.kind === 'div' ? div(product(num(Math.abs(k)), magnitude.num), magnitude.den) : mul(num(Math.abs(k)), magnitude)
  return sign * Math.sign(k) < 0 ? neg(value) : value
}

// \arg z mit einem typischen Fehler; null, wenn der Rumpf keine passende Form hat (Realteil nicht sicher
// positiv, Winkel eines festen Faktors kein Vielfaches von \frac{\pi}{12}) oder der Fehler nichts ändert
export function argValue(t: ArgTool, mistake: ArgMistake | null): Expr | null {
  const factors = argFactors(t)
  if (!factors) return null
  if (mistake === 'eq-arg-power' && !factors.some((f) => Math.abs(f.power) > 1)) return null
  if (mistake === 'eq-arg-quotient-sign' && !factors.some((f) => f.power < 0 && !isZero(standardAngle(f) ?? rat(1)))) return null
  const terms: Expr[] = []
  let constant: Rational = rat(0)
  for (const f of factors) {
    let k = mistake === 'eq-arg-power' ? Math.sign(f.power) : f.power
    // beim Teilen addiert: der Winkel des Nenners mit Plus
    if (mistake === 'eq-arg-quotient-sign') k = Math.abs(k)
    if (!hasLetter(f.re, f.im)) {
      const c = standardAngle(f)
      if (c === null) return null
      constant = ratAdd(constant, ratMul(c, rat(k)))
      continue
    }
    const angle = factorAngle(f, mistake === 'eq-arg-swapped' || mistake === 'eq-arg-arctan-forgotten' ? mistake : null)
    if (!angle) return null
    terms.push(timesAngle(k, angle))
  }
  if (terms.length === 0) return null
  return tidySum([...terms, ...(isZero(constant) ? [] : [piTimes(constant)])])
}

// --- Rechenweg für die Erklärung ---

// Für jeden Faktor mit Buchstaben Real- und Imaginärteil, Betrag bzw. Winkel; feste Faktoren mit Betrag bzw. Winkel
// (\lvert 3 + 4\mathrm{i}\rvert = \sqrt{25} = 5, \arg(1 + \mathrm{i}) = \frac{\pi}{4}); dazu, welche Regeln vorkommen
export type PolarWork = {
  readonly parts: readonly { readonly z: string; readonly re: string; readonly im: string; readonly value: string }[]
  readonly constants: readonly { readonly z: string; readonly value: string }[]
  readonly power: boolean
  readonly quotient: boolean
  readonly product: boolean
  // zwei Faktoren mit Buchstaben, ausmultipliziert: (x + a\mathrm{i})(a - x\mathrm{i}) = 2ax + \left(a^{2} - x^{2}\right)\mathrm{i}
  readonly multiplied: string | null
}

// q\mathrm{i}: \mathrm{i}, -\mathrm{i}, a\mathrm{i}, (x + a)\mathrm{i}; mit einer Funktion, Wurzel oder e-Funktion \mathrm{i} vorn
// (\mathrm{i}b\sin x)
function imagTerm(q: Expr): Expr {
  const { sign, magnitude } = signedPart(q)
  const block = subterms(magnitude).some((s) => s.kind === 'fn' || s.kind === 'root' || (s.kind === 'pow' && isE(s.base)))
  const term = magnitude.kind === 'num' && isOne(magnitude.value) ? IMAG : block ? mul(IMAG, magnitude) : mul(magnitude, IMAG)
  return sign < 0 ? neg(term) : term
}

// p + q\mathrm{i} in dieser Reihenfolge (3 + 4\mathrm{i}, nicht 4\mathrm{i} + 3)
const complexLatex = (f: ComplexFactor) => toLatex(isZeroExpr(f.im) ? f.re : isZeroExpr(f.re) ? imagTerm(f.im) : add(f.re, imagTerm(f.im)))

export function polarWork(t: AbsTool | ArgTool): PolarWork | null {
  const factors = complexFactors(t.body)
  const shown = t.kind === 'arg' ? argFactors(t) : factors
  if (!factors || !shown) return null
  const constants = factors
    .filter((f) => !hasLetter(f.re, f.im))
    .map((f) => {
      const z = complexLatex(f)
      if (t.kind === 'arg') {
        const c = standardAngle(f)
        return { z, value: c === null ? '' : toLatex(piTimes(c)) }
      }
      const s = squareSum(f, false)
      const r = asRational(s)
      const root = r && squareRootOf(r)
      return { z, value: root !== null ? `\\sqrt{${toLatex(s)}} = ${root}` : `\\sqrt{${toLatex(s)}}` }
    })
  // ein einziger Faktor steht da wie in der Aufgabe (be^{\mathrm{i}x} - a)
  const single = factors.length === 1 && factors[0].power === 1
  const parts = shown
    .filter((f) => hasLetter(f.re, f.im))
    .map((f) => {
      const angle = t.kind === 'arg' ? factorAngle(f, null) : null
      return {
        z: single ? toLatex(t.body) : complexLatex(f),
        re: toLatex(f.re),
        im: toLatex(f.im),
        value: t.kind === 'arg' ? (angle ? toLatex(angle) : '') : `\\sqrt{${toLatex(squareSum(f, false))}}`,
      }
    })
  const multiplied = t.kind === 'arg' && factors.filter((f) => hasLetter(f.re, f.im)).length >= 2 && shown.length === 1
  return {
    parts,
    constants,
    power: factors.some((f) => Math.abs(f.power) > 1),
    quotient: factors.some((f) => f.power < 0),
    product: factors.filter((f) => f.power > 0).length > 1 && !multiplied,
    multiplied: multiplied ? `${factors.map((f) => `(${complexLatex(f)})`).join('')} = ${complexLatex(shown[0])}` : null,
  }
}
