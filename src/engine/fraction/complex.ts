import { type Expr, IMAG, add, mul, neg, num } from '../expr/types.ts'
import { type Reduced, reduceFrac, reducedExpr } from './factor.ts'
import { type Frac, IMAG_ATOM, isImagTerm, reduceImag } from './frac.ts'
import { type Poly, atomsOf, polyAdd, polyAtom, polyContent, polyMul, polyNeg, polyScale, polySum } from './poly.ts'
import { rat, ratAbs, ratDiv } from '../rational.ts'

// Komplexe Zahlen (Stufe 5, Kapitel 3 des Lehrbuchs): i ist ein eigenes Zeichen der Bruch-Engine
// mit i² = −1 (frac.ts, reduceImag). Teilen heißt: mit dem konjugiert Komplexen des Nenners
// erweitern, dann ist der Nenner reell (c + di)(c − di) = c² + d²; das Ergebnis steht in der Form
// a + bi mit Realteil a und Imaginärteil b. Mit Buchstaben gilt: Buchstaben sind reell.

export const hasImag = (p: Poly) => atomsOf(p).includes(IMAG_ATOM)

// Kommt eine Potenz von i ab i² vor (i², i³ …)?
export const hasImagPower = (p: Poly) => p.some((t) => (t.mono.find(([a]) => a === IMAG_ATOM)?.[1] ?? 0) >= 2)

// Realteil und Imaginärteil: p = re + im·i (nach i² = −1)
export function imagParts(p: Poly): { readonly re: Poly; readonly im: Poly } {
  const q = reduceImag(p)
  const re = q.filter((t) => !isImagTerm(t))
  const im = polySum([q.filter(isImagTerm).map((t) => ({ mono: t.mono.filter(([a]) => a !== IMAG_ATOM), coef: t.coef }))])
  return { re, im }
}

const imagJoin = (re: Poly, im: Poly): Poly => polyAdd(re, polyMul(im, polyAtom(IMAG_ATOM)))

// i durch −i ersetzt: 3 + 4i → 3 − 4i
function conjugatePoly(p: Poly): Poly {
  const { re, im } = imagParts(p)
  return imagJoin(re, polyNeg(im))
}

// Womit erweitert wird: das konjugiert Komplexe des Nenners ohne gemeinsame Zahl, 1 − 2i → 1 + 2i,
// 2 + 4i → 1 − 2i, 3i → −i. So ist der neue Nenner (c + di)(c − di) = c² + d² positiv.
export function conjugateFactor(den: Poly): Poly {
  const c = conjugatePoly(den)
  return polyScale(c, ratDiv(rat(1), ratAbs(polyContent(c))))
}

// Bruch mit reellem Nenner: Realteil und Imaginärteil je als Bruch
export type ComplexParts = { readonly re: Frac; readonly im: Frac }

// Erweitert mit dem konjugiert Komplexen des Nenners: Zähler und Nenner ausmultipliziert mit i² = −1
function rationalized(f: Frac): { readonly num: Poly; readonly den: Poly; readonly conj: Poly | null } {
  const den = reduceImag(f.den)
  if (!hasImag(den)) return { num: reduceImag(f.num), den, conj: null }
  const conj = conjugateFactor(den)
  return { num: reduceImag(polyMul(f.num, conj)), den: reduceImag(polyMul(den, conj)), conj }
}

export function complexParts(f: Frac): ComplexParts {
  const r = rationalized(f)
  const { re, im } = imagParts(r.num)
  return { re: { num: re, den: r.den }, im: { num: im, den: r.den } }
}

// Wert als ein Bruch mit reellem Nenner, gekürzt: \frac{2 - 11i}{25} (für Vergleiche und Kürzen)
export function complexReduced(f: Frac, hints: readonly Poly[] = []): Reduced {
  const r = rationalized(f)
  return reduceFrac({ num: r.num, den: r.den }, hints)
}

// b·i geschrieben: \mathrm{i}, -\mathrm{i}, 3\mathrm{i}, \frac{2}{5}\mathrm{i}, (x + 1)\mathrm{i},
// \frac{b}{a^2 + b^2}\mathrm{i}
function imagTermExpr(r: Reduced): Expr {
  const e = reducedExpr(r)
  const times = (x: Expr): Expr => (x.kind === 'num' && x.value.n === 1n && x.value.d === 1n ? IMAG : mul(x, IMAG))
  if (e.kind === 'neg') return neg(times(e.arg))
  if (e.kind === 'num' && e.value.n < 0n) return neg(times(num(ratAbs(e.value))))
  return times(e)
}

// Ergebnis in der Form a + bi, Realteil und Imaginärteil je gekürzt: -1 + 2\mathrm{i},
// \frac{2}{25} - \frac{11}{25}\mathrm{i}; ohne Realteil nur bi, ohne Imaginärteil nur a
export function complexExpr(c: ComplexParts, hints: readonly Poly[] = []): Expr {
  const re = reduceFrac(c.re, hints)
  const im = reduceFrac(c.im, hints)
  const parts: Expr[] = []
  if (re.num.length > 0) parts.push(reducedExpr(re))
  if (im.num.length > 0) parts.push(imagTermExpr(im))
  return parts.length === 0 ? num(0) : parts.length === 1 ? parts[0] : add(...parts)
}

export const complexValueExpr = (f: Frac, hints: readonly Poly[] = []) => complexExpr(complexParts(f), hints)

// Fehler „i² = 1": Potenzen von i mit dem falschen Vorzeichen, i² → 1, i³ → i
export function reduceImagWrong(p: Poly): Poly {
  return polySum(
    p.map((t) => {
      const k = t.mono.find(([a]) => a === IMAG_ATOM)?.[1] ?? 0
      if (k < 2) return [t]
      const mono = [...t.mono.filter(([a]) => a !== IMAG_ATOM), ...(k % 2 === 1 ? [[IMAG_ATOM, 1] as const] : [])]
      // richtig wäre (−1)^⌊k/2⌋; falsch ist das Gegenteil
      return [{ mono, coef: Math.floor(k / 2) % 2 === 1 ? t.coef : polyNeg([t])[0].coef }]
    }),
  )
}
