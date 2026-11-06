import { isInteger, ratToNumber } from '../rational.ts'
import { type Expr, type FnName, type Tool, asRational } from './types.ts'

export type Env = Readonly<Record<string, number>>

// Wert eines Terms an einer Stelle. NaN, wenn der Term dort nicht definiert ist.
//
// Definitionsbereich nach deutscher Schulkonvention:
// - Wurzeln und gebrochene Exponenten nur für Zahlen ≥ 0 (auch die dritte Wurzel),
// - Potenzen mit variablem Exponenten (a^x, x^x) nur für Basis > 0,
// - ln und log nur für Zahlen > 0.
export function evaluate(e: Expr, env: Env): number {
  const value = evaluateRaw(e, env)
  return Number.isFinite(value) ? value : NaN
}

function evaluateRaw(e: Expr, env: Env): number {
  switch (e.kind) {
    case 'num':
      return ratToNumber(e.value)
    case 'const':
      // i ist keine reelle Zahl: Werte mit i rechnet nur die Bruch-Engine (exakt)
      return e.name === 'e' ? Math.E : e.name === 'pi' ? Math.PI : NaN
    case 'var':
      return e.tool ? evaluateTool(e.tool, env) : (env[e.name] ?? NaN)
    case 'add':
      return e.terms.reduce((sum, t) => sum + evaluate(t, env), 0)
    case 'mul':
      return e.factors.reduce((product, f) => product * evaluate(f, env), 1)
    case 'neg':
      return -evaluate(e.arg, env)
    case 'div': {
      const den = evaluate(e.den, env)
      return den === 0 ? NaN : evaluate(e.num, env) / den
    }
    case 'pow':
      return evaluatePow(e.base, e.exp, env)
    case 'root': {
      const a = evaluate(e.arg, env)
      if (!(a >= 0)) return NaN
      return e.index === 2 ? Math.sqrt(a) : e.index === 3 ? Math.cbrt(a) : a ** (1 / e.index)
    }
    case 'fn':
      return evaluateFn(e.name, evaluate(e.arg, env))
    case 'log': {
      const base = evaluate(e.base, env)
      const arg = evaluate(e.arg, env)
      if (!(base > 0) || base === 1 || !(arg > 0)) return NaN
      return Math.log(arg) / Math.log(base)
    }
  }
}

function evaluatePow(baseExpr: Expr, expExpr: Expr, env: Env): number {
  const base = evaluate(baseExpr, env)
  if (Number.isNaN(base)) return NaN
  const literal = asRational(expExpr)
  if (literal) {
    const r = ratToNumber(literal)
    if (isInteger(literal)) return base === 0 && r < 0 ? NaN : base ** r
    // Gebrochener Exponent = Wurzel: nur für Basis ≥ 0
    if (base < 0 || (base === 0 && r < 0)) return NaN
    return base ** r
  }
  const exponent = evaluate(expExpr, env)
  if (Number.isNaN(exponent)) return NaN
  if (baseExpr.kind === 'const' && baseExpr.name === 'e') return Math.exp(exponent)
  if (base > 0) return base ** exponent
  if (base === 0 && exponent > 0) return 0
  return NaN
}

function evaluateFn(name: FnName, a: number): number {
  if (Number.isNaN(a)) return NaN
  switch (name) {
    case 'sin':
      return Math.sin(a)
    case 'cos':
      return Math.cos(a)
    case 'tan':
      return Math.cos(a) === 0 ? NaN : Math.tan(a)
    case 'cot':
      return Math.sin(a) === 0 ? NaN : Math.cos(a) / Math.sin(a)
    case 'ln':
      return a > 0 ? Math.log(a) : NaN
    case 'arcsin':
      return Math.abs(a) <= 1 ? Math.asin(a) : NaN
    case 'arccos':
      return Math.abs(a) <= 1 ? Math.acos(a) : NaN
    case 'arctan':
      return Math.atan(a)
    case 'sinh':
      return Math.sinh(a)
    case 'cosh':
      return Math.cosh(a)
    case 'tanh':
      return Math.tanh(a)
    case 'arsinh':
      return Math.asinh(a)
    case 'arcosh':
      return a >= 1 ? Math.acosh(a) : NaN
    case 'artanh':
      return Math.abs(a) < 1 ? Math.atanh(a) : NaN
  }
}

// --- Werkzeuge der Stufe 5 (Umstellen): numerisch, als Gegenprobe unabhängig vom Rechenweg ---

function evaluateTool(tool: Tool, env: Env): number {
  const at = (value: number) => evaluate(tool.body, { ...env, [tool.v]: value })
  switch (tool.kind) {
    case 'derivative': {
      const x = env[tool.v]
      return x === undefined ? NaN : numericDerivative(at, x)
    }
    case 'integral':
      return numericIntegral(at, evaluate(tool.lower, env), evaluate(tool.upper, env))
    case 'bracket':
      return at(evaluate(tool.upper, env)) - at(evaluate(tool.lower, env))
  }
}

// Zentrale Differenzenquotienten mit Richardson-Extrapolation (Fehler etwa h^6); nah an der 0 kleiner,
// damit \ln x oder \sqrt{x} links von x noch definiert sind
// Steile Stellen (nahe einer Polstelle): h kleiner, bis zwei Schätzungen übereinstimmen
function numericDerivative(f: (x: number) => number, x: number): number {
  const d = (s: number) => (f(x + s) - f(x - s)) / (2 * s)
  const estimate = (h: number) => {
    const [d1, d2, d3] = [d(h), d(h / 2), d(h / 4)]
    const r1 = (4 * d2 - d1) / 3
    const r2 = (4 * d3 - d2) / 3
    return (16 * r2 - r1) / 15
  }
  let h = x === 0 ? 1e-2 : Math.min(1e-2 * Math.max(1, Math.abs(x)), Math.abs(x) / 4)
  let previous = estimate(h)
  // die Schätzung, die sich am wenigsten von der vorigen unterscheidet
  let best = { value: NaN, gap: Infinity }
  for (let i = 0; i < 12; i++) {
    h /= 4
    const current = estimate(h)
    const gap = Math.abs(current - previous) / Math.max(1, Math.abs(current))
    if (gap < best.gap) best = { value: current, gap }
    if (gap <= 1e-11) break
    previous = current
  }
  // keine stabile Schätzung (z. B. ganz nah an einer Polstelle): lieber kein Wert als ein falscher
  return best.gap <= 1e-8 ? best.value : NaN
}

// Gauß-Legendre mit 5 Stützstellen je Teilstück, adaptiv: ein Teilstück wird halbiert, bis beide Hälften
// zusammen dasselbe ergeben wie das ganze (auch bei steilen Stellen wie \frac{1}{t + a} mit kleinem a)
const GAUSS_NODES = [0, -0.5384693101056831, 0.5384693101056831, -0.906179845938664, 0.906179845938664]
const GAUSS_WEIGHTS = [0.5688888888888889, 0.47862867049936647, 0.47862867049936647, 0.23692688505618908, 0.23692688505618908]

function numericIntegral(f: (t: number) => number, a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN
  const gauss = (lo: number, hi: number) => {
    const mid = (lo + hi) / 2
    const half = (hi - lo) / 2
    let sum = 0
    for (let j = 0; j < GAUSS_NODES.length; j++) sum += GAUSS_WEIGHTS[j] * f(mid + GAUSS_NODES[j] * half)
    return sum * half
  }
  const pieces = 8
  const width = (b - a) / pieces
  const parts = Array.from({ length: pieces }, (_, i) => [a + i * width, a + (i + 1) * width] as const)
  const rough = parts.reduce((sum, [lo, hi]) => sum + gauss(lo, hi), 0)
  const tolerance = 1e-13 * Math.max(1, Math.abs(rough))
  let budget = 20000
  const refine = (lo: number, hi: number, whole: number, depth: number): number => {
    const mid = (lo + hi) / 2
    const left = gauss(lo, mid)
    const right = gauss(mid, hi)
    budget--
    if (depth >= 60 || budget <= 0 || !Number.isFinite(left + right) || Math.abs(left + right - whole) <= tolerance) return left + right
    return refine(lo, mid, left, depth + 1) + refine(mid, hi, right, depth + 1)
  }
  return parts.reduce((sum, [lo, hi]) => sum + refine(lo, hi, gauss(lo, hi), 0), 0)
}
