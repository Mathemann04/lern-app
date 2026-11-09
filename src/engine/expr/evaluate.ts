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
  if (tool.kind === 'det') return numericDeterminant(tool.rows.map((row) => row.map((e) => evaluate(e, env))))
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
    case 'sum':
      return numericSum(at, evaluate(tool.lower, env), evaluate(tool.upper, env))
    case 'series':
      return numericSeries(at, evaluate(tool.lower, env))
    case 'limit':
      return numericLimit(at)
    case 'ode': {
      // rechte Seite p \cdot f + c, nur lineare (sonst NaN, z. B. f(1 - f))
      const c = at(0)
      const p = at(1) - c
      if (!(Math.abs(at(2) - (c + 2 * p)) <= 1e-12 * Math.max(1, Math.abs(c), Math.abs(p)))) return NaN
      const [f0, f1 = 0] = tool.initial.map((value) => evaluate(value, env))
      return numericOde(tool.order, p, c, f0, f1, evaluate(tool.point, env))
    }
  }
}

// Lineare Differentialgleichung f' = pf + c bzw. f'' = pf + c von 0 bis x: klassisches Runge-Kutta-Verfahren
// (4. Ordnung) mit n und 2n Schritten, h \cdot \lambda \le 0{,}025 (\lambda = |p| bzw. \sqrt{|p|}), dann
// Richardson-Extrapolation (Fehler etwa 10^{-11}); unabhängig von der Lösungsformel, ohne e-Funktion.
// NaN, wenn \lambda |x| > 50 (Werte jenseits von e^{50} sagen nichts mehr) oder die beiden Rechnungen
// nicht übereinstimmen. Negatives x geht auch (rückwärts gerechnet).
function numericOde(order: 1 | 2, p: number, c: number, f0: number, f1: number, x: number): number {
  if (![p, c, f0, f1, x].every(Number.isFinite)) return NaN
  if (x === 0) return f0
  const span = Math.abs(x) * (order === 1 ? Math.abs(p) : Math.sqrt(Math.abs(p)))
  if (span > 50) return NaN
  let n = 16
  while (span / n > 0.025) n *= 2
  const coarse = rungeKutta(order, p, c, f0, f1, x, n)
  const fine = rungeKutta(order, p, c, f0, f1, x, 2 * n)
  if (!Number.isFinite(coarse) || !Number.isFinite(fine) || Math.abs(fine - coarse) > 1e-6 * Math.max(1, Math.abs(fine))) return NaN
  return (16 * fine - coarse) / 15
}

function rungeKutta(order: 1 | 2, p: number, c: number, f0: number, f1: number, x: number, n: number): number {
  const h = x / n
  let f = f0
  let g = f1
  for (let i = 0; i < n; i++) {
    if (order === 1) {
      const k1 = p * f + c
      const k2 = p * (f + (h / 2) * k1) + c
      const k3 = p * (f + (h / 2) * k2) + c
      const k4 = p * (f + h * k3) + c
      f += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
    } else {
      // System f' = g, g' = pf + c
      const a1 = g
      const b1 = p * f + c
      const a2 = g + (h / 2) * b1
      const b2 = p * (f + (h / 2) * a1) + c
      const a3 = g + (h / 2) * b2
      const b3 = p * (f + (h / 2) * a2) + c
      const a4 = g + h * b3
      const b4 = p * (f + h * a3) + c
      f += (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4)
      g += (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4)
    }
  }
  return f
}

// Endliche Summe: bei ganzzahligen Grenzen Summand für Summand. Ist die obere Grenze keine ganze Zahl
// (sie kommt beim Umstellen nach n aus dem Ergebnis), wird eine geometrische Summe mit ihrem Quotienten
// q fortgesetzt: s = f(unten) \frac{q^m - 1}{q - 1} mit m = oben - unten + 1 Summanden; q kommt
// numerisch aus drei Summanden, die Summe muss also geometrisch sein.
function numericSum(f: (k: number) => number, lower: number, upper: number): number {
  if (!Number.isInteger(lower) || !Number.isFinite(upper)) return NaN
  const count = upper - lower + 1
  if (Number.isInteger(upper)) {
    if (count > 100000) return NaN
    let sum = 0
    for (let k = lower; k <= upper; k++) sum += f(k)
    return sum
  }
  const [f0, f1, f2] = [f(lower), f(lower + 1), f(lower + 2)]
  if (!(f0 !== 0 && f1 !== 0)) return NaN
  const q = f1 / f0
  if (Math.abs(f2 / f1 - q) > 1e-12 * Math.max(1, Math.abs(q)) || !(q > 0) || q === 1) return NaN
  return (f0 * (q ** count - 1)) / (q - 1)
}

// Reihe: Teilsummen, bis die Summanden im Rundungsfehler verschwinden; NaN, wenn sie nach 20 000
// Summanden nicht klein genug sind (keine oder sehr langsame Konvergenz, q nahe 1)
function numericSeries(f: (k: number) => number, lower: number): number {
  if (!Number.isInteger(lower)) return NaN
  let sum = 0
  let previous = NaN
  const ratios: number[] = []
  for (let k = lower; k < lower + 20000; k++) {
    const term = f(k)
    if (!Number.isFinite(term)) return NaN
    // plötzlich genau 0, obwohl der Summand davor noch zählte: Unterlauf (x^k zu klein für den Rechner
    // bei \frac{x^k}{ka^k}), die Summe wäre zu früh abgebrochen
    if (term === 0 && Math.abs(previous) > 1e-17 * Math.abs(sum)) return NaN
    sum += term
    if (k > lower + 5 && Math.abs(term) <= 1e-17 * Math.max(1e-300, Math.abs(sum))) return sum
    // rein geometrische Summanden (Quotient zweier Summanden immer gleich, z. B. \left(\frac{t}{a}\right)^k):
    // der Rest ist f(k) \frac{r}{1 - r}, sonst bräuchte die Reihe im Integral zu viele Summanden
    if (previous !== 0 && Number.isFinite(previous)) ratios.push(term / previous)
    const r = ratios[ratios.length - 1]
    if (ratios.length >= 4 && Math.abs(r) < 1 && ratios.slice(-4).every((s) => Math.abs(s - r) <= 1e-13 * Math.abs(r))) return sum + (term * r) / (1 - r)
    previous = term
  }
  return NaN
}

// Grenzwert n \to \infty: Werte bei n = 64, 128, 256, … (erst ab einem n, bei dem der Term definiert ist,
// z. B. n > x bei \frac{n + x}{n - x}), dann mit Neville zu \frac{1}{n} = 0 extrapoliert (die Fehler gehen
// mit Potenzen von \frac{1}{n} weg, z. B. bei \left(1 + \frac{x}{n}\right)^n); NaN, wenn sich die
// Schätzungen nicht einig werden
function numericLimit(f: (n: number) => number): number {
  let start = 64
  while (start < 2 ** 24 && !Number.isFinite(f(start))) start *= 2
  if (!Number.isFinite(f(start))) return NaN
  const hs: number[] = []
  const table: number[] = []
  let previous = NaN
  let best = { value: NaN, gap: Infinity }
  for (let j = 0; j < 9; j++) {
    const n = start * 2 ** j
    hs.push(1 / n)
    table.push(f(n))
    // Neville: Polynom durch alle Punkte, an der Stelle 0
    for (let m = table.length - 2; m >= 0; m--) {
      const h0 = hs[m]
      const h1 = hs[table.length - 1]
      table[m] = table[m + 1] + ((table[m + 1] - table[m]) * h1) / (h0 - h1)
    }
    const estimate = table[0]
    if (!Number.isFinite(estimate)) return NaN
    const gap = Math.abs(estimate - previous) / Math.max(1, Math.abs(estimate))
    if (gap < best.gap) best = { value: estimate, gap }
    previous = estimate
  }
  return best.gap <= 1e-9 ? best.value : NaN
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
  // nicht definiert (z. B. eine Reihe, die dort nicht schnell genug konvergiert): gleich aufhören
  let rough = 0
  for (const [lo, hi] of parts) {
    rough += gauss(lo, hi)
    if (!Number.isFinite(rough)) return NaN
  }
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

// Determinante numerisch: Gauß-Verfahren mit Spaltenpivotsuche (Dreiecksform: Produkt der Diagonale, je
// Zeilentausch ein Minus); unabhängig von der Regel für 2 × 2 und vom Entwickeln im Rechenweg. NaN, sobald
// ein Eintrag nicht definiert ist (auch neben einer Spalte aus Nullen)
function numericDeterminant(rows: readonly (readonly number[])[]): number {
  if (!rows.every((row) => row.length === rows.length && row.every(Number.isFinite))) return NaN
  const a = rows.map((row) => [...row])
  const n = a.length
  let det = 1
  for (let j = 0; j < n; j++) {
    let p = j
    for (let i = j + 1; i < n; i++) if (Math.abs(a[i][j]) > Math.abs(a[p][j])) p = i
    if (a[p][j] === 0) return 0
    if (p !== j) {
      ;[a[p], a[j]] = [a[j], a[p]]
      det = -det
    }
    det *= a[j][j]
    for (let i = j + 1; i < n; i++) {
      const l = a[i][j] / a[j][j]
      for (let k = j + 1; k < n; k++) a[i][k] -= l * a[j][k]
    }
  }
  return det
}
