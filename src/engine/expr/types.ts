import { type Rational, isOne, rat, ratNeg, ratSign } from '../rational.ts'

// Ein Term als Baum. Die Knoten sind unveränderlich.
//
// Aufgabenform: Der Baum behält die Struktur, wie der Term geschrieben ist
// (Bruch bleibt Bruch, Wurzel bleibt Wurzel, Minus bleibt Minus). Davon hängt
// ab, welche Regel beim Ableiten die richtige ist.
// Normalform (normalize.ts): nur add, mul, pow, fn, log und Atome, zum Vergleichen.

export type FnName =
  | 'sin'
  | 'cos'
  | 'tan'
  | 'cot'
  | 'ln'
  | 'arcsin'
  | 'arccos'
  | 'arctan'
  | 'sinh'
  | 'cosh'
  | 'tanh'
  | 'arsinh'
  | 'arcosh'
  | 'artanh'

export type Num = { readonly kind: 'num'; readonly value: Rational; readonly decimal?: boolean }
export type Const = { readonly kind: 'const'; readonly name: 'e' | 'pi' }
export type Var = { readonly kind: 'var'; readonly name: string }
export type Add = { readonly kind: 'add'; readonly terms: readonly Expr[] }
// explicit: beim Ausgeben überall Malpunkt setzen (für eingesetzte Formeln wie u' · v)
export type Mul = { readonly kind: 'mul'; readonly factors: readonly Expr[]; readonly explicit?: boolean }
export type Neg = { readonly kind: 'neg'; readonly arg: Expr }
export type Div = { readonly kind: 'div'; readonly num: Expr; readonly den: Expr }
export type Pow = { readonly kind: 'pow'; readonly base: Expr; readonly exp: Expr }
export type Root = { readonly kind: 'root'; readonly arg: Expr; readonly index: number }
export type Fn = { readonly kind: 'fn'; readonly name: FnName; readonly arg: Expr }
export type Log = { readonly kind: 'log'; readonly base: Expr; readonly arg: Expr }

export type Expr = Num | Const | Var | Add | Mul | Neg | Div | Pow | Root | Fn | Log

// Gleichung, z. B. für implizites Ableiten: x² + y² = 25
export type Equation = { readonly lhs: Expr; readonly rhs: Expr }

// --- Bauhelfer ---

export function num(n: bigint | number | Rational, d: bigint | number = 1n): Num {
  const value = typeof n === 'object' ? n : rat(n, d)
  return { kind: 'num', value }
}

// Zahl, die mit Dezimalkomma geschrieben werden soll (z. B. 2,5)
export function dec(value: Rational): Num {
  return { kind: 'num', value, decimal: true }
}

export const E: Const = { kind: 'const', name: 'e' }
export const PI: Const = { kind: 'const', name: 'pi' }
export const variable = (name: string): Var => ({ kind: 'var', name })
export const x: Var = variable('x')
export const y: Var = variable('y')

export function add(...terms: Expr[]): Expr {
  return terms.length === 1 ? terms[0] : { kind: 'add', terms }
}

export function mul(...factors: Expr[]): Expr {
  return factors.length === 1 ? factors[0] : { kind: 'mul', factors }
}

// Produkt mit sichtbarem Malpunkt zwischen allen Faktoren: 2x · e^x
export function mulDot(...factors: Expr[]): Expr {
  return factors.length === 1 ? factors[0] : { kind: 'mul', factors, explicit: true }
}

export const neg = (arg: Expr): Neg => ({ kind: 'neg', arg })
export const sub = (a: Expr, b: Expr): Expr => add(a, neg(b))
export const div = (numerator: Expr, denominator: Expr): Div => ({
  kind: 'div',
  num: numerator,
  den: denominator,
})
export const pow = (base: Expr, exp: Expr): Pow => ({ kind: 'pow', base, exp })
export const sqrt = (arg: Expr): Root => ({ kind: 'root', arg, index: 2 })
export const root = (arg: Expr, index: number): Root => ({ kind: 'root', arg, index })
export const exp = (arg: Expr): Pow => pow(E, arg)
export const fn = (name: FnName, arg: Expr): Fn => ({ kind: 'fn', name, arg })
export const ln = (arg: Expr): Fn => fn('ln', arg)
export const sin = (arg: Expr): Fn => fn('sin', arg)
export const cos = (arg: Expr): Fn => fn('cos', arg)
export const tan = (arg: Expr): Fn => fn('tan', arg)
export const log = (base: Expr, arg: Expr): Log => ({ kind: 'log', base, arg })

// c · e in Aufgabenform: 1 · e → e, −1 · e → −e, −3 · e → −(3 · e)
export function scale(c: Rational, e: Expr): Expr {
  if (ratSign(c) < 0) return neg(scale(ratNeg(c), e))
  if (isOne(c)) return e
  return mul(num(c), e)
}

export const eq = (lhs: Expr, rhs: Expr): Equation => ({ lhs, rhs })

// Liest einen Zahlenwert aus einem Knoten wie 3, −2 oder 2/3 (auch geschrieben als
// Minus- oder Bruch-Knoten). null, wenn der Knoten keine reine Zahl ist.
export function asRational(e: Expr): Rational | null {
  switch (e.kind) {
    case 'num':
      return e.value
    case 'neg': {
      const inner = asRational(e.arg)
      return inner && ratNeg(inner)
    }
    case 'div': {
      const a = asRational(e.num)
      const b = asRational(e.den)
      if (!a || !b || b.n === 0n) return null
      return rat(a.n * b.d, a.d * b.n)
    }
    default:
      return null
  }
}

