import { E as EULER, asRational, type Expr, add, div, exp, ln, mul, neg, num, pow, sin, cos, sqrt, variable, x } from '../expr/types.ts'
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
  polyMul,
  polyNeg,
  polyPow,
  polyScale,
  polySub,
  polySubstitute,
} from './poly.ts'

// Brüche aus zwei Polynomen (Zähler, Nenner) und die Übersetzung zwischen Termbaum und Polynom.
//
// Atome: Buchstaben x, y, a, b, h und Bausteine, mit denen man rechnet wie mit einem Buchstaben:
// E = e^x (E² = e^{2x}), L = ln x, S = sin x, C = cos x, R = √x. Dazu e, die Eulersche Zahl, für
// falsche Ergebnisse wie e^2.
//
// Bausteine mit eigenen Regeln (Stufe 5):
// - R = √x mit R² = x: In Aufgaben mit Wurzel wird nur mit R gerechnet (x als R², rootForm).
// - S² + C² = 1: Beim Vergleichen wird C² durch 1 − S² ersetzt, bis höchstens C¹ übrig bleibt
//   (trigRewrite, isZeroValue).
// - tan x = S / C

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

// x → (√x)², wenn eine Wurzel vorkommt; sonst unverändert
export function rootPoly(p: Poly): Poly {
  return atomsOf(p).includes('R') ? polySubstitute(p, 'x', polyAtom('R', 2)) : p
}

export const rootForm = (f: Frac): Frac => ({ num: polySubstitute(f.num, 'x', polyAtom('R', 2)), den: polySubstitute(f.den, 'x', polyAtom('R', 2)) })

// sin² x + cos² x = 1 anwenden: Potenzen ab 2 des einen Bausteins (atom, S oder C) ersetzen,
// z. B. atom C: cos² x → 1 − sin² x, cos³ x → cos x (1 − sin² x)
export function trigRewrite(p: Poly, atom: 'S' | 'C'): Poly {
  const other = atom === 'S' ? 'C' : 'S'
  const power = (t: Poly[number]) => t.mono.find(([a]) => a === atom)?.[1] ?? 0
  let result = p
  for (let k = Math.max(0, ...p.map(power)); k >= 2; k--) {
    const high = result.filter((t) => power(t) === k)
    if (high.length === 0) continue
    const lowered = high.map((t) => ({ mono: t.mono.map(([a, e]) => [a, a === atom ? e - 2 : e] as const), coef: t.coef }))
    result = polyAdd(polySub(result, high), polyMul(lowered, polyAdd(polyConst(1), polyNeg(polyAtom(other, 2)))))
  }
  return result
}

// Hat ein Polynom überall den Wert 0 (auch mit den Regeln der Bausteine)? Mit cos² x → 1 − sin² x
// bleibt eine eindeutige Form übrig: genau dann 0, wenn das Polynom auf dem Einheitskreis 0 ist.
export const isZeroValue = (p: Poly) => isZeroPoly(trigRewrite(rootPoly(p), 'C'))

// Gleichwertig: Überkreuz-Malnehmen ergibt dasselbe Polynom (exakt, ohne Zahlenstellen), mit den
// Regeln der Bausteine: (√x)² = x und sin² x + cos² x = 1
export const fracEquals = (a: Frac, b: Frac) => isZeroValue(polySub(polyMul(a.num, b.den), polyMul(b.num, a.den)))

export const fracAtoms = (f: Frac) => [...new Set([...atomsOf(f.num), ...atomsOf(f.den)])]

// --- Termbaum → Bruch ---

// Ganzzahliger Wert eines Exponenten, sonst null
function integerExponent(e: Expr): number | null {
  const r = asRational(e)
  return r && isInteger(r) ? Number(r.n) : null
}

// Hochzahl n/2 (z. B. bei x^{1/2}), sonst null
function halfExponent(e: Expr): number | null {
  const r = asRational(e)
  return r && r.d === 2n ? Number(r.n) : null
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
    case 'const':
      return e.name === 'e' ? fracOf(polyAtom('e')) : null
    case 'root':
      return e.index === 2 && e.arg.kind === 'var' && e.arg.name === 'x' ? fracOf(polyAtom('R')) : null
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
        if (k !== null) return power(fracOf(polyAtom('E')), k)
        // Zahl als Hochzahl: e^2 (Eulersche Zahl)
        const c = integerExponent(e.exp)
        return c === null ? null : power(fracOf(polyAtom('e')), c)
      }
      // x^{1/2} = √x, x^{3/2} = x√x
      const half = e.base.kind === 'var' && e.base.name === 'x' ? halfExponent(e.exp) : null
      if (half !== null) return power(fracOf(polyAtom('R')), half)
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

// Potenz eines Atoms als Term: x², e^{2x}, \sin^2 x, (\ln x)^2; bei √x: (√x)² = x, (√x)³ = x√x
export function atomPowerExpr(atom: string, k: number): Expr {
  const base = atomExpr(atom)
  if (k === 1) return base
  if (atom === 'E') return exp(mul(num(k), x))
  if (atom === 'R') {
    const whole = Math.floor(k / 2)
    const xPart = whole === 1 ? x : pow(x, num(whole))
    return k % 2 === 0 ? xPart : mul(xPart, sqrt(x))
  }
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
    case 'R':
      return sqrt(x)
    case 'e':
      return EULER
    default:
      return variable(atom)
  }
}

// Reihenfolge beim Schreiben eines Produkts: die Zahl e zuerst, dann Buchstaben alphabetisch
// (ax, 2xy), Bausteine in fester Reihenfolge (\sin x \cos x)
const BLOCK_ORDER = ['E', 'L', 'S', 'C', 'T', 'R']
export const displayRank = (atom: string) =>
  atom === 'e' ? 0 : BLOCK_ORDER.includes(atom) ? 100 + BLOCK_ORDER.indexOf(atom) : atom.charCodeAt(0)

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
