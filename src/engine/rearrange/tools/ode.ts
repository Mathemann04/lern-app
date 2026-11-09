import { contains } from '../../expr/compare.ts'
import { toLatex } from '../../expr/print.ts'
import { type Expr, type Tool, add, cos, div, exp, mul, neg, num, sin } from '../../expr/types.ts'
import { type Rational, isOne, rat, ratDiv, ratSign } from '../../rational.ts'

// Differentialgleichungen der Stufe 5 (docs/PLAN-M3.md, Teil 7c): f' = kf, f' = -kf, Abkühlen
// f' = k(b - f) und f'' = k^2 f mit Anfangswerten. Die Lösung steht in Exponentialform da, wie sie mit dem
// Ansatz e^{\lambda x} und den Anfangswerten herauskommt (f'' = k^2 f, f(0) = a, f'(0) = 0:
// \frac{a}{2}e^{kx} + \frac{a}{2}e^{-kx}); danach wird wie gewohnt umgestellt (Substitution, pq-Formel).
// Die Gegenprobe (evaluate.ts) löst die Gleichung numerisch.

export type OdeTool = Extract<Tool, { kind: 'ode' }>

export type OdeMistake =
  | 'eq-ode-initial-unused'
  | 'eq-ode-not-halved'
  | 'eq-ode-inner-factor'
  | 'eq-ode-oscillation'
  | 'eq-ode-constant-added'
  | 'eq-ode-exp-sign'
  | 'eq-ode-constant-start'

export const ODE_MISTAKES: readonly OdeMistake[] = [
  'eq-ode-initial-unused',
  'eq-ode-not-halved',
  'eq-ode-inner-factor',
  'eq-ode-oscillation',
  'eq-ode-constant-added',
  'eq-ode-exp-sign',
  'eq-ode-constant-start',
]

// Art der Gleichung, mit \lambda > 0 als rate: f' = \pm\lambda f (growth), f' = \lambda(b - f) (cooling,
// b ist der Endwert), f'' = \lambda^2 f (second)
export type OdeShape =
  | { readonly kind: 'growth'; readonly rate: Expr; readonly sign: 1 | -1 }
  | { readonly kind: 'cooling'; readonly rate: Expr; readonly end: Expr }
  | { readonly kind: 'second'; readonly rate: Expr }

const isNum = (e: Expr, value: number) => e.kind === 'num' && e.value.n === BigInt(value) && e.value.d === 1n
const isFunction = (e: Expr, f: string) => e.kind === 'var' && !e.tool && e.name === f
const product = (factors: readonly Expr[]): Expr => (factors.length === 0 ? num(1) : factors.length === 1 ? factors[0] : mul(...factors))

// Faktoren ohne f vor f: k f, -3f, f; null, wenn f nicht genau einmal als Faktor dasteht
function coefficientOf(body: Expr, f: string): { factors: Expr[]; sign: 1 | -1 } | null {
  if (isFunction(body, f)) return { factors: [], sign: 1 }
  if (body.kind === 'neg') {
    const inner = coefficientOf(body.arg, f)
    return inner && { ...inner, sign: inner.sign === 1 ? -1 : 1 }
  }
  if (body.kind !== 'mul') return null
  const all = body.factors.flatMap((x) => (x.kind === 'mul' ? x.factors : [x]))
  const withF = all.filter((x) => contains(x, f))
  if (withF.length !== 1 || !isFunction(withF[0], f)) return null
  let sign: 1 | -1 = 1
  const factors = all
    .filter((x) => !contains(x, f))
    .map((x) => {
      if (x.kind === 'num' && ratSign(x.value) < 0) {
        sign = sign === 1 ? -1 : 1
        return num(rat(-x.value.n, x.value.d))
      }
      return x
    })
    .filter((x) => !isNum(x, 1))
  return { factors, sign }
}

export function odeShape(t: OdeTool): OdeShape | null {
  const f = t.v
  if (t.order === 2) {
    const c = coefficientOf(t.body, f)
    if (!c || c.sign < 0 || c.factors.length > 1) return null
    if (c.factors.length === 0) return { kind: 'second', rate: num(1) }
    const [k] = c.factors
    // k^2 f bzw. 4f
    if (k.kind === 'pow' && isNum(k.exp, 2) && !contains(k.base, f)) return { kind: 'second', rate: k.base }
    if (k.kind === 'num' && k.value.d === 1n) {
      const root = BigInt(Math.round(Math.sqrt(Number(k.value.n))))
      if (root * root === k.value.n) return { kind: 'second', rate: num(root) }
    }
    return null
  }
  // k(b - f)
  if (t.body.kind === 'mul' && t.body.factors.length === 2) {
    const [k, inner] = t.body.factors
    if (!contains(k, f) && inner.kind === 'add' && inner.terms.length === 2) {
      const [end, minusF] = inner.terms
      if (!contains(end, f) && minusF.kind === 'neg' && isFunction(minusF.arg, f)) return { kind: 'cooling', rate: k, end }
    }
  }
  const c = coefficientOf(t.body, f)
  return c && { kind: 'growth', rate: product(c.factors), sign: c.sign }
}

// --- Bauteile der Lösung ---

// \lambda x bzw. -\lambda x
const exponent = (rate: Expr, point: Expr, sign: 1 | -1): Expr => {
  const e = isNum(rate, 1) ? point : mul(rate, point)
  return sign === 1 ? e : neg(e)
}

// c \cdot e^{…} (ohne mal 1)
const times = (c: Expr, e: Expr): Expr => (isNum(c, 1) ? e : isNum(c, -1) ? neg(e) : mul(c, e))

// top / (n \cdot rest), gekürzt, wo Zahlen stehen: \frac{a}{2}, \frac{b}{2k}, \frac{3}{2}, \frac{2}{k}
function over(top: Expr, n: Rational, rest: Expr | null): Expr {
  if (top.kind === 'num') {
    const c = ratDiv(top.value, n)
    if (!rest) return num(c)
    const den = c.d === 1n ? rest : mul(num(c.d), rest)
    return div(num(c.n), den)
  }
  if (!rest) return isOne(n) ? top : n.d === 1n ? div(top, num(n.n)) : div(mul(num(n.d), top), num(n.n))
  return div(top, isOne(n) ? rest : mul(num(n), rest))
}

// Zahl- und Buchstabenteil von \lambda: 3 → (3, null), k → (1, k)
const rateParts = (rate: Expr): { n: Rational; rest: Expr | null } => (rate.kind === 'num' ? { n: rate.value, rest: null } : { n: rat(1), rest: rate })

// c / \lambda bzw. c / (2\lambda)
function perRate(c: Expr, rate: Expr, factor: number): Expr {
  const { n, rest } = rateParts(rate)
  return over(c, rat(n.n * BigInt(factor), n.d), rest)
}

const isZero = (e: Expr | undefined) => e !== undefined && isNum(e, 0)

// a - b, mit Zahlen ausgerechnet
function minus(a: Expr, b: Expr): Expr {
  if (a.kind === 'num' && b.kind === 'num') return num(rat(a.value.n * b.value.d - b.value.n * a.value.d, a.value.d * b.value.d))
  return add(a, neg(b))
}

// --- Rechenweg für die Erklärung ---

// Ansatz und Konstanten aus den Anfangswerten als LaTeX: f(x) = C_1e^{kx} + C_2e^{-kx} und
// C_1 + C_2 = a,\; k(C_1 - C_2) = 0 \Rightarrow C_1 = C_2 = \frac{a}{2}
export function odeWork(t: OdeTool): { readonly approach: string; readonly constants: string } | null {
  const shape = odeShape(t)
  if (!shape) return null
  const f = `${t.v}(${toLatex(t.point)})`
  const e = (sign: 1 | -1) => toLatex(exp(exponent(shape.rate, t.point, sign)))
  const [f0, f1] = t.initial
  switch (shape.kind) {
    case 'growth':
      return { approach: `${f} = C${e(shape.sign)}`, constants: `${t.v}(0) = C = ${toLatex(f0)}` }
    case 'cooling': {
      const b = toLatex(shape.end)
      return { approach: `${f} = ${b} + C${e(-1)}`, constants: `${t.v}(0) = ${b} + C = ${toLatex(f0)} \\Rightarrow C = ${toLatex(minus(f0, shape.end))}` }
    }
    case 'second': {
      if (f0 === undefined || f1 === undefined || isZero(f0) === isZero(f1)) return null
      const k = isNum(shape.rate, 1) ? '' : toLatex(shape.rate)
      const both = `C_1 + C_2 = ${toLatex(f0)},\\; ${k}(C_1 - C_2) = ${toLatex(f1)}`
      const solved = isZero(f1) ? `C_1 = C_2 = ${toLatex(over(f0, rat(2), null))}` : `C_1 = -C_2 = ${toLatex(perRate(f1, shape.rate, 2))}`
      return { approach: `${f} = C_1${e(1)} + C_2${e(-1)}`, constants: `${both} \\Rightarrow ${solved}` }
    }
  }
}

// --- Lösung und typische Fehler ---

// Lösung der Differentialgleichung als Term in der Stelle (x), mit einem typischen Fehler; null, wenn
// sie sich so nicht ausrechnen lässt oder der Fehler hier nicht passt (bzw. nichts ändert)
export function odeSolution(t: OdeTool, mistake: OdeMistake | null): Expr | null {
  const shape = odeShape(t)
  if (!shape) return null
  const [f0, f1] = t.initial
  const e = (sign: 1 | -1) => exp(exponent(shape.rate, t.point, sign))
  switch (shape.kind) {
    case 'growth': {
      const s = shape.sign
      const a = f0
      switch (mistake) {
        case null:
          return times(a, e(s))
        // C = 1 statt f(0)
        case 'eq-ode-initial-unused':
          return isNum(a, 1) ? null : e(s)
        // e^{kx + C} = e^{kx} + C, C aus f(0) = 1 + C
        case 'eq-ode-constant-added':
          return isNum(a, 1) ? null : a.kind === 'num' ? add(e(s), minus(a, num(1))) : add(e(s), a, num(-1))
        case 'eq-ode-exp-sign':
          return times(a, e(s === 1 ? -1 : 1))
        default:
          return null
      }
    }
    case 'cooling': {
      const a = f0
      const b = shape.end
      switch (mistake) {
        case null:
          return add(b, times(minus(a, b), e(-1)))
        case 'eq-ode-exp-sign':
          return add(b, times(minus(a, b), e(1)))
        // C = f(0) statt f(0) - b
        case 'eq-ode-constant-start':
          return add(b, times(a, e(-1)))
        default:
          return null
      }
    }
    case 'second': {
      // nur f(0) = a, f'(0) = 0 oder f(0) = 0, f'(0) = b
      if (f0 === undefined || f1 === undefined || isZero(f0) === isZero(f1)) return null
      const rate = shape.rate
      if (isZero(f1)) {
        const a = f0
        const half = over(a, rat(2), null)
        switch (mistake) {
          case null:
            return add(times(half, e(1)), times(half, e(-1)))
          // nur C e^{kx}: f'(0) = 0 bleibt ungenutzt
          case 'eq-ode-initial-unused':
            return times(a, e(1))
          case 'eq-ode-not-halved':
            return add(times(a, e(1)), times(a, e(-1)))
          case 'eq-ode-oscillation':
            return times(a, cos(exponent(rate, t.point, 1)))
          default:
            return null
        }
      }
      const b = f1
      const c = perRate(b, rate, 2)
      switch (mistake) {
        case null:
          return add(times(c, e(1)), neg(times(c, e(-1))))
        // nur C e^{kx}: f(0) = 0 bleibt ungenutzt
        case 'eq-ode-initial-unused':
          return times(perRate(b, rate, 1), e(1))
        case 'eq-ode-not-halved': {
          const whole = perRate(b, rate, 1)
          return add(times(whole, e(1)), neg(times(whole, e(-1))))
        }
        // (e^{kx})' = e^{kx}: der Faktor k fehlt in f'(0)
        case 'eq-ode-inner-factor': {
          if (isNum(rate, 1)) return null
          const half = over(b, rat(2), null)
          return add(times(half, e(1)), neg(times(half, e(-1))))
        }
        case 'eq-ode-oscillation':
          return times(perRate(b, rate, 1), sin(exponent(rate, t.point, 1)))
        default:
          return null
      }
    }
  }
}
