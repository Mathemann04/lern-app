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
// e: Eulersche Zahl, pi: Kreiszahl, i: imaginäre Einheit (i² = −1, nur in der Bruch-Engine gerechnet)
export type Const = { readonly kind: 'const'; readonly name: 'e' | 'pi' | 'i' }
// tool: Werkzeug der Stufe 5 beim Umstellen (Ableitung, Integral, …), siehe Tool
export type Var = { readonly kind: 'var'; readonly name: string; readonly tool?: Tool }
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

// Werkzeug der Stufe 5 beim Umstellen (docs/PLAN-M3.md): steht im Termbaum als Buchstabe mit eigenem
// Namen (Var mit tool), damit Vergleichen und Umformen es wie ein Zeichen behandeln. Gesetzt wird es als
// Ableitung, Integral usw. (print.ts), ausgewertet numerisch als Gegenprobe (evaluate.ts). Gerechnet
// wird erst, wenn es ausgerechnet ist (rearrange/tools/).
export type Tool =
  // Ableitung nach v an der Stelle v: \frac{\mathrm{d}}{\mathrm{d}x}\left(body\right)
  | { readonly kind: 'derivative'; readonly body: Expr; readonly v: string }
  // bestimmtes Integral \int_{lower}^{upper} body \,\mathrm{d}v (v ist gebunden)
  | { readonly kind: 'integral'; readonly body: Expr; readonly v: string; readonly lower: Expr; readonly upper: Expr }
  // Stammfunktion mit Grenzen: \left[body\right]_{lower}^{upper} = body(upper) - body(lower)
  | { readonly kind: 'bracket'; readonly body: Expr; readonly v: string; readonly lower: Expr; readonly upper: Expr }
  // endliche Summe \sum_{v=lower}^{upper} body (v ist gebunden, z. B. k)
  | { readonly kind: 'sum'; readonly body: Expr; readonly v: string; readonly lower: Expr; readonly upper: Expr }
  // Reihe \sum_{v=lower}^{\infty} body
  | { readonly kind: 'series'; readonly body: Expr; readonly v: string; readonly lower: Expr }
  // Grenzwert \lim_{v \to \infty} body (v ist gebunden, z. B. n)
  | { readonly kind: 'limit'; readonly body: Expr; readonly v: string }

// Gebundene Variable eines Werkzeugs (bei der Ableitung keine: dort ist v die Stelle) und die Teile
// außerhalb des Rumpfs (Grenzen)
export const toolBound = (tool: Tool): string | null => (tool.kind === 'derivative' ? null : tool.v)
export function toolLimits(tool: Tool): Expr[] {
  switch (tool.kind) {
    case 'derivative':
    case 'limit':
      return []
    case 'series':
      return [tool.lower]
    default:
      return [tool.lower, tool.upper]
  }
}

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
export const IMAG: Const = { kind: 'const', name: 'i' }
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
export const isEquation = (e: Expr | Equation): e is Equation => !('kind' in e)

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

