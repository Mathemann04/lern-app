import { asRational, type Expr, add, div, exp, ln, mul, neg, num, pow, sin, cos, variable, x } from '../expr/types.ts'
import { type Rational, isInteger, isOne, rat, ratNeg, ratSign } from '../rational.ts'
import {
  type Monomial,
  type Poly,
  atomsOf,
  isZeroPoly,
  leadingCoef,
  polyAdd,
  polyAtom,
  polyConst,
  polyEquals,
  polyMul,
  polyNeg,
  polyPow,
  polyScale,
} from './poly.ts'

// Brüche aus zwei Polynomen (Zähler, Nenner) und die Übersetzung zwischen Termbaum und Polynom.
//
// Atome: Buchstaben x, y, a, b, h und Bausteine, mit denen man rechnet wie mit einem Buchstaben:
// E = e^x (E² = e^{2x}), L = ln x, S = sin x, C = cos x.

export type Frac = { readonly num: Poly; readonly den: Poly }

const LETTERS = new Set(['x', 'y', 'a', 'b', 'h'])

// --- Rechnen ---

export const fracOf = (p: Poly): Frac => ({ num: p, den: polyConst(1) })

export const fracAdd = (a: Frac, b: Frac): Frac => ({
  num: polyAdd(polyMul(a.num, b.den), polyMul(b.num, a.den)),
  den: polyMul(a.den, b.den),
})

export const fracNeg = (a: Frac): Frac => ({ num: polyNeg(a.num), den: a.den })

export const fracSub = (a: Frac, b: Frac): Frac => fracAdd(a, fracNeg(b))

export const fracMul = (a: Frac, b: Frac): Frac => ({ num: polyMul(a.num, b.num), den: polyMul(a.den, b.den) })

export function fracDiv(a: Frac, b: Frac): Frac {
  if (isZeroPoly(b.num)) throw new RangeError('Teilen durch null')
  return { num: polyMul(a.num, b.den), den: polyMul(a.den, b.num) }
}

// Gleichwertig: Überkreuz-Malnehmen ergibt dasselbe Polynom (exakt, ohne Zahlenstellen)
export const fracEquals = (a: Frac, b: Frac) => polyEquals(polyMul(a.num, b.den), polyMul(b.num, a.den))

export const fracAtoms = (f: Frac) => [...new Set([...atomsOf(f.num), ...atomsOf(f.den)])]

// --- Termbaum → Bruch ---

// Ganzzahliger Wert eines Exponenten, sonst null
function integerExponent(e: Expr): number | null {
  const r = asRational(e)
  return r && isInteger(r) ? Number(r.n) : null
}

// Faktor k im Exponenten von e^{kx}: x → 1, 2x → 2, −x → −1; sonst null
function linearInX(e: Expr): number | null {
  if (e.kind === 'var') return e.name === 'x' ? 1 : null
  if (e.kind === 'neg') {
    const k = linearInX(e.arg)
    return k === null ? null : -k
  }
  if (e.kind === 'mul' && e.factors.length === 2 && e.factors[1].kind === 'var' && e.factors[1].name === 'x') {
    return integerExponent(e.factors[0])
  }
  return null
}

function power(base: Frac, k: number): Frac {
  const up = { num: polyPow(base.num, Math.abs(k)), den: polyPow(base.den, Math.abs(k)) }
  return k >= 0 ? up : { num: up.den, den: up.num }
}

// Wert eines Terms als Bruch aus Polynomen; null, wenn der Term etwas anderes enthält
// (z. B. eine Wurzel oder sin(2x)). Teilen durch null ergibt ebenfalls null.
export function toFrac(e: Expr): Frac | null {
  switch (e.kind) {
    case 'num':
      return fracOf(polyConst(e.value))
    case 'var':
      return LETTERS.has(e.name) ? fracOf(polyAtom(e.name)) : null
    case 'add': {
      let sum = fracOf(polyConst(0))
      for (const t of e.terms) {
        const f = toFrac(t)
        if (!f) return null
        sum = fracAdd(sum, f)
      }
      return sum
    }
    case 'mul': {
      let product = fracOf(polyConst(1))
      for (const factor of e.factors) {
        const f = toFrac(factor)
        if (!f) return null
        product = fracMul(product, f)
      }
      return product
    }
    case 'neg': {
      const f = toFrac(e.arg)
      return f && fracNeg(f)
    }
    case 'div': {
      const a = toFrac(e.num)
      const b = toFrac(e.den)
      return a && b && !isZeroPoly(b.num) ? fracDiv(a, b) : null
    }
    case 'pow': {
      if (e.base.kind === 'const' && e.base.name === 'e') {
        const k = linearInX(e.exp)
        return k === null ? null : power(fracOf(polyAtom('E')), k)
      }
      const k = integerExponent(e.exp)
      const base = toFrac(e.base)
      if (k === null || !base || (k < 0 && isZeroPoly(base.num))) return null
      return power(base, k)
    }
    case 'fn': {
      if (e.arg.kind !== 'var' || e.arg.name !== 'x') return null
      if (e.name === 'ln') return fracOf(polyAtom('L'))
      if (e.name === 'sin') return fracOf(polyAtom('S'))
      if (e.name === 'cos') return fracOf(polyAtom('C'))
      if (e.name === 'tan') return { num: polyAtom('S'), den: polyAtom('C') }
      return null
    }
    default:
      return null
  }
}

// --- Polynom → Termbaum ---

// Potenz eines Atoms als Term: x², e^{2x}, \sin^2 x, (\ln x)^2
export function atomPowerExpr(atom: string, k: number): Expr {
  const base = atomExpr(atom)
  if (k === 1) return base
  if (atom === 'E') return exp(mul(num(k), x))
  return pow(base, num(k))
}

function atomExpr(atom: string): Expr {
  switch (atom) {
    case 'E':
      return exp(x)
    case 'L':
      return ln(x)
    case 'S':
      return sin(x)
    case 'C':
      return cos(x)
    default:
      return variable(atom)
  }
}

// Reihenfolge beim Schreiben eines Produkts: Buchstaben alphabetisch (ax, 2xy), Bausteine danach
const BLOCK_ORDER = ['E', 'L', 'S', 'C', 'T']
export const displayRank = (atom: string) => (BLOCK_ORDER.includes(atom) ? 100 + BLOCK_ORDER.indexOf(atom) : atom.charCodeAt(0))

export const monoExpr = (m: Monomial): Expr[] =>
  [...m].sort(([a], [b]) => displayRank(a) - displayRank(b)).map(([atom, k]) => atomPowerExpr(atom, k))

// c · Monom, mit Minus außen: −3x² → neg(3x²)
function termExpr(coef: Rational, mono: Monomial): Expr {
  if (ratSign(coef) < 0) return neg(termExpr(ratNeg(coef), mono))
  const factors = monoExpr(mono)
  if (factors.length === 0) return num(coef)
  if (isOne(coef)) return mul(...factors)
  // Bruch als Vorzahl über den Term schreiben: \frac{x}{2} statt \frac{1}{2}x
  if (!isInteger(coef)) {
    const top = coef.n === 1n ? mul(...factors) : mul(num(coef.n), ...factors)
    return div(top, num(coef.d))
  }
  return mul(num(coef), ...factors)
}

// Polynom als Summe; ascending: kleinster Grad zuerst (9 − x² statt −x² + 9)
export function polyExpr(p: Poly, order: 'descending' | 'ascending' = 'descending'): Expr {
  if (p.length === 0) return num(0)
  const terms = order === 'ascending' ? [...p].reverse() : p
  return add(...terms.map((t) => termExpr(t.coef, t.mono)))
}

// Hat der erste Summand (in der Schreibweise) ein Minus?
export const startsNegative = (p: Poly) => ratSign(leadingCoef(p)) < 0

export const fracConst = (n: number, d = 1): Frac => fracOf(polyConst(rat(n, d)))

export const fracScale = (f: Frac, c: Rational): Frac => ({ num: polyScale(f.num, c), den: f.den })
