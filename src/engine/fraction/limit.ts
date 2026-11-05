import { type Expr, add, div, mul, neg, num, pow, variable } from '../expr/types.ts'
import { type Rational, isInteger, rat, ratAbs, ratDiv, ratSign } from '../rational.ts'
import { reducedFrac, reduceFrac } from './factor.ts'
import { type Frac, rootOf } from './frac.ts'
import { type Poly, atomsOf, constValue, degreeIn, isZeroPoly, polyConst, polySubstitute } from './poly.ts'

// Grenzwerte von Brüchen (Stufe 5, Kapitel 4 und 5 des Lehrbuchs):
// - x → a: Einsetzen ergibt „0/0". Nach dem Zerlegen und Kürzen (bzw. Zusammenfassen) lässt sich a
//   einsetzen.
// - n → ∞: Zähler und Nenner durch die höchste Potenz des Nenners teilen; Summanden mit n im Nenner
//   gehen gegen 0, übrig bleibt das Verhältnis der Zahlen vor der höchsten Potenz (oder 0, wenn der
//   Zähler einen kleineren Grad hat).

export type LimitTarget = Rational | 'infinity'

// Wurzel einer Bruchzahl, wenn sie wieder eine Bruchzahl ist (4/9 → 2/3); sonst null
function rationalRoot(r: Rational): Rational | null {
  if (ratSign(r) < 0) return null
  const root = (n: bigint): bigint | null => {
    const s = BigInt(Math.round(Math.sqrt(Number(n))))
    return s * s === n ? s : null
  }
  const [a, b] = [root(r.n), root(r.d)]
  return a !== null && b !== null ? rat(a, b) : null
}

// Wert eines Polynoms für letter = a (√x wird zu √a); null, wenn noch etwas anderes darin steht
function polyValueAt(p: Poly, letter: string, a: Rational): Rational | null {
  let q = polySubstitute(p, letter, polyConst(a))
  if (atomsOf(q).includes(rootOf(letter))) {
    const r = rationalRoot(a)
    if (!r) return null
    q = polySubstitute(q, rootOf(letter), polyConst(r))
  }
  return isZeroPoly(q) ? rat(0) : constValue(q)
}

// Wert eines Bruchs an der Stelle letter = a; null, wenn der Nenner dort 0 ist
export function fracValueAt(f: Frac, letter: string, a: Rational): Rational | null {
  const [n, d] = [polyValueAt(f.num, letter, a), polyValueAt(f.den, letter, a)]
  if (n === null || d === null || ratSign(d) === 0) return null
  return ratDiv(n, d)
}

// Zahl vor letter^k (0, wenn es diese Potenz nicht gibt)
function coefOf(p: Poly, letter: string, k: number): Rational {
  const t = p.find((term) => (term.mono.find(([a]) => a === letter)?.[1] ?? 0) === k && term.mono.every(([a]) => a === letter))
  return t?.coef ?? rat(0)
}

// Grenzwert für letter → ∞; null, wenn er unendlich ist oder andere Buchstaben vorkommen
export function limitAtInfinity(f: Frac, letter: string): Rational | null {
  if ([...atomsOf(f.num), ...atomsOf(f.den)].some((a) => a !== letter)) return null
  const [p, q] = [degreeIn(f.num, letter), degreeIn(f.den, letter)]
  if (isZeroPoly(f.num) || p < q) return rat(0)
  if (p > q) return null
  return ratDiv(coefOf(f.num, letter, p), coefOf(f.den, letter, q))
}

// Grenzwert eines Bruchs: erst kürzen, dann einsetzen bzw. die höchsten Potenzen vergleichen; null,
// wenn es keinen (endlichen) Grenzwert gibt
export function limitOf(f: Frac, letter: string, to: LimitTarget): Rational | null {
  if (to === 'infinity') return limitAtInfinity(f, letter)
  return fracValueAt(reducedFrac(reduceFrac(f)), letter, to)
}

// Höchste Potenz des Nenners, durch die geteilt wird
export const highestPower = (den: Poly, letter: string) => degreeIn(den, letter)

// Ein Polynom durch letter^k geteilt, Summand für Summand: 3n^2 - n durch n^2 → 3 - \frac{1}{n}
function dividedPolyExpr(p: Poly, letter: string, k: number, ascending: boolean): Expr {
  const n = variable(letter)
  const terms = p.map((t) => {
    const j = t.mono.find(([a]) => a === letter)?.[1] ?? 0
    const c = t.coef
    const abs = ratAbs(c)
    let e: Expr
    if (j >= k) e = j === k ? num(abs) : mul(...(isInteger(abs) && abs.n === 1n ? [] : [num(abs)]), j - k === 1 ? n : pow(n, num(j - k)))
    else e = div(num(abs), k - j === 1 ? n : pow(n, num(k - j)))
    return ratSign(c) < 0 ? neg(e) : e
  })
  const ordered = ascending ? [...terms].reverse() : terms
  return ordered.length === 0 ? num(0) : ordered.length === 1 ? ordered[0] : add(...ordered)
}

// Zähler und Nenner durch letter^k geteilt; side: nur der Zähler (typischer Fehler)
export function dividedFracExpr(
  f: Frac,
  letter: string,
  k: number,
  order: { readonly num: boolean; readonly den: boolean } = { num: false, den: false },
  side: 'both' | 'num' = 'both',
): Expr {
  const top = dividedPolyExpr(f.num, letter, k, order.num)
  const bottom = side === 'both' ? dividedPolyExpr(f.den, letter, k, order.den) : dividedPolyExpr(f.den, letter, 0, order.den)
  return div(top, bottom)
}

// Zahlen ohne letter (wie beim Einsetzen von n = 0) bzw. die vorne geschriebenen Zahlen
export const constantOf = (p: Poly, letter: string): Rational => coefOf(p, letter, 0)
export const leadingOf = (p: Poly, letter: string): Rational => coefOf(p, letter, degreeIn(p, letter))
