import { evaluate } from '../expr/evaluate.ts'
import { type Expr, E, add, div, eq, fn, log, mul, neg, num, pow, sqrt, variable } from '../expr/types.ts'
import { numberExpr } from '../rearrange/isolate.ts'
import type { RearrangeTask } from '../rearrange/task.ts'
import type { Rng } from '../random/rng.ts'
import { rat } from '../rational.ts'
import type { NumberEquationKind } from './numberEquationKinds.ts'

// Baukasten für Gleichungen mit Zahlen (M6 Schritt 4b-3, Arten in numberEquationKinds.ts): Erst die Lösung (eine ganze
// Zahl), dann die Zahlen der Aufgabe so, dass sie aufgeht; Teile wie 3x - 1, \frac{x}{2} + 4 oder 5 - x, Faktoren, Summanden
// auf derselben oder der anderen Seite in wechselnder Reihenfolge (spread). Manche Aufgaben haben mit Absicht keine Lösung
// (none). Ob eine Aufgabe taugt (Lösung wie gewollt, Bausteine der Art, nicht zu breit), entscheidet rearrangeTerms.ts.

export type NumberKitTask = { readonly task: RearrangeTask; readonly label: string; readonly none: boolean }

const X = variable('x')
const n = (v: number): Expr => numberExpr(rat(v))
const sign = (rng: Rng) => (rng.chance(0.5) ? 1 : -1)
const valueOf = (e: Expr, x: number) => evaluate(e, { x })

// k·x: x, 3x, -x; auch k vor einem anderen Term: 2\sqrt{x}
function times(k: number, e: Expr = X): Expr {
  const size = Math.abs(k) === 1 ? e : mul(num(Math.abs(k)), e)
  return k < 0 ? neg(size) : size
}

// Summe mit Zahl: x + 3, x - 3, 5 - 2x (bei negativem Teil mit x die Zahl vorn)
function plus(e: Expr, m: number): Expr {
  if (m === 0) return e
  if (e.kind === 'neg') return add(n(m), e)
  return add(e, m < 0 ? neg(num(-m)) : num(m))
}

type LinStyle = 'kx+m' | 'x+m' | 'm-x' | 'm-kx' | 'x/k+m' | 'kx'
// Linearer Teil k·x + m mit vorgegebenem Wert an der Stelle x0 (die Zahl m wird so gewählt); null, wenn das nicht geht
function linearWith(rng: Rng, style: LinStyle, x0: number, value: number): Expr | null {
  switch (style) {
    case 'x+m':
      return value - x0 === 0 ? null : plus(X, value - x0)
    case 'kx+m': {
      const k = rng.int(2, 5)
      return value - k * x0 === 0 ? null : plus(times(k), value - k * x0)
    }
    case 'kx':
      return x0 === 0 || value % x0 !== 0 || Math.abs(value / x0) < 2 ? null : times(value / x0)
    case 'm-x':
      return value + x0 === 0 ? null : plus(neg(X), value + x0)
    case 'm-kx': {
      const k = rng.int(2, 4)
      return value + k * x0 === 0 ? null : plus(neg(times(k)), value + k * x0)
    }
    case 'x/k+m': {
      const k = rng.int(2, 4)
      return x0 % k !== 0 ? null : plus(div(X, num(k)), value - x0 / k)
    }
  }
}

// Linearer Teil mit beliebigen kleinen Zahlen
function anyLinear(rng: Rng, styles: readonly LinStyle[]): Expr {
  const style = rng.pick(styles)
  const k = rng.int(2, 5)
  const m = sign(rng) * rng.int(1, 9)
  switch (style) {
    case 'x+m':
      return plus(X, m)
    case 'kx+m':
      return plus(times(k), m)
    case 'kx':
      return times(k)
    case 'm-x':
      return plus(neg(X), Math.abs(m))
    case 'm-kx':
      return plus(neg(times(k)), Math.abs(m))
    case 'x/k+m':
      return plus(div(X, num(k)), m)
  }
}

// Bruch a / P mit dem Minus vor dem Bruch
const over = (a: number, p: Expr): Expr => (a < 0 ? neg(div(num(-a), p)) : div(num(a), p))

// Summand mit umgedrehtem Vorzeichen
function negated(e: Expr): Expr {
  if (e.kind === 'neg') return e.arg
  if (e.kind === 'num') return n(-Number(e.value.n) / Number(e.value.d))
  return neg(e)
}

const isNumber = (e: Expr) => e.kind === 'num' || (e.kind === 'neg' && e.arg.kind === 'num')

// Summanden links und rechts; manche wechseln die Seite (mit umgedrehtem Vorzeichen), die Reihenfolge wechselt. Die ersten
// fixed Summanden links bleiben links (die Wurzel, der Logarithmus …). Seiten auch vertauscht.
function spread(rng: Rng, left: readonly Expr[], right: readonly Expr[], fixed = 1, move = 0.3): RearrangeTask {
  const l = left.slice(0, fixed)
  const r: Expr[] = []
  // was die Seite wechselt, mit umgedrehtem Vorzeichen
  for (const term of left.slice(fixed)) {
    if (rng.chance(move)) r.push(negated(term))
    else l.push(term)
  }
  for (const term of right) {
    if (rng.chance(move) && right.length > 1) l.push(negated(term))
    else r.push(term)
  }
  // keine Seite nur mit 0
  if (r.length === 0) r.push(negated(l.pop()!))
  const order = (all: Expr[]) => {
    // Zahlen einer Seite zusammengefasst (nicht 7 - 3)
    const numbers = all.filter(isNumber)
    const total = numbers.reduce((sum, e) => sum + evaluate(e, {}), 0)
    const others = all.filter((e) => !isNumber(e))
    const terms = numbers.length === 0 ? others : total === 0 && others.length > 0 ? others : [...others, n(total)]
    const sorted = rng.chance(0.3) ? rng.shuffle(terms) : terms
    // nicht mit einem Minus beginnen, wenn ein Summand mit Plus folgt: 3 - x statt -x + 3
    const plus = sorted.findIndex((e) => e.kind !== 'neg')
    return plus > 0 && sorted[0].kind === 'neg' ? [sorted[plus], ...sorted.filter((_, i) => i !== plus)] : sorted
  }
  const lhs = add(...order(l))
  const rhs = r.length === 0 ? num(0) : add(...order(r))
  return { equation: rng.chance(0.3) ? eq(rhs, lhs) : eq(lhs, rhs), target: 'x', conditions: [], numeric: true }
}

const L = (base: Expr, arg: Expr): Expr => (base === E ? fn('ln', arg) : log(base, arg))
const baseNumber = (base: Expr) => (base.kind === 'num' ? Number(base.value.n) : 0)
const ROOT_STYLES: readonly LinStyle[] = ['x+m', 'kx+m', 'm-x', 'm-kx', 'x/k+m', 'kx']

// --- Stufe 1 ---

// f\sqrt{P} + d = c, auch mit einer negativen Zahl für die Wurzel (keine Lösung)
function buildRoot(rng: Rng): NumberKitTask | null {
  const x0 = rng.int(-6, 20)
  const s = rng.int(1, 9)
  const inner = linearWith(rng, rng.pick(ROOT_STYLES), x0, s * s)
  if (!inner) return null
  const f = rng.chance(0.5) ? rng.pick([2, 3, 4, -2, -1]) : 1
  const d = rng.chance(0.6) ? sign(rng) * rng.int(1, 9) : 0
  const none = rng.chance(0.25)
  const rootValue = none ? -rng.int(1, 4) : s
  const left = d === 0 ? [times(f, sqrt(inner))] : [times(f, sqrt(inner)), n(d)]
  return { task: spread(rng, left, [n(f * rootValue + d)]), label: none ? 'Wurzel gleich einer negativen Zahl' : 'Wurzel gleich Zahl', none }
}

// \frac{a}{P} = c, \frac{a}{P} + d = c, \frac{P}{Q} = c, \frac{a}{P} = \frac{b}{Q}
function buildFraction(rng: Rng): NumberKitTask | null {
  const x0 = rng.int(-6, 15)
  const p = anyLinear(rng, ['x+m', 'x+m', 'kx+m', 'm-x', 'kx'])
  const pv = valueOf(p, x0)
  if (pv === 0) return null
  const t = sign(rng) * rng.int(1, 6)
  const form = rng.int(1, 4)
  if (form === 1) return { task: spread(rng, [over(t * pv, p)], [n(t)]), label: 'Zahl durch Term gleich Zahl', none: false }
  if (form === 2) {
    const d = sign(rng) * rng.int(1, 9)
    return { task: spread(rng, [over(t * pv, p), n(d)], [n(t + d)]), label: 'Bruch und Zahl gleich Zahl', none: false }
  }
  const q = anyLinear(rng, ['x+m', 'kx+m', 'm-x', 'x+m'])
  const qv = valueOf(q, x0)
  if (qv === 0) return null
  if (form === 3) {
    const r = rat(pv, qv)
    if (r.d > 5n || r.n === 0n) return null
    return { task: spread(rng, [div(p, q)], [numberExpr(r)]), label: 'Bruch aus zwei Termen gleich Zahl', none: false }
  }
  return { task: spread(rng, [over(t * pv, p)], [over(t * qv, q)], 1, 0), label: 'Bruch gleich Bruch', none: false }
}

const NUMBER_BASES: readonly Expr[] = [num(2), num(2), num(3), num(5), num(10), E]

// \log_b(P) = c, f\log_b(P) + d = c, \log_b(P) = \log_b(n)
function buildLog(rng: Rng): NumberKitTask | null {
  const base = rng.pick(NUMBER_BASES)
  const b = baseNumber(base)
  const x0 = rng.int(-5, 15)
  // mit e: \ln P = 0 oder \ln P = \ln n
  const plain = rng.chance(0.3) || (base === E && rng.chance(0.6))
  const c = base === E ? 0 : rng.int(b >= 5 ? 1 : 0, b === 2 ? 5 : b === 3 ? 3 : 2)
  const value = plain ? rng.int(2, 40) : b === 0 ? 1 : b ** c
  const inner = linearWith(rng, rng.pick(['x+m', 'kx+m', 'kx+m', 'm-x', 'm-kx', 'x/k+m', 'kx']), x0, value)
  if (!inner) return null
  if (plain) return { task: spread(rng, [L(base, inner)], [L(base, num(value))]), label: 'Logarithmus gleich Logarithmus einer Zahl', none: false }
  const f = rng.chance(0.35) ? rng.pick([2, 3, -1]) : 1
  const d = rng.chance(0.45) ? sign(rng) * rng.int(1, 6) : 0
  const left = d === 0 ? [times(f, L(base, inner))] : [times(f, L(base, inner)), n(d)]
  return { task: spread(rng, left, [n(f * c + d)]), label: 'Logarithmus gleich Zahl', none: false }
}

// --- Stufe 2 ---

// f\sqrt{P} = kx + m mit Summanden auf beiden Seiten
function buildRootLinear(rng: Rng): NumberKitTask | null {
  const x0 = rng.int(-4, 12)
  const s = rng.int(1, 8)
  const none = rng.chance(0.2)
  const inner = linearWith(rng, rng.pick(['x+m', 'kx+m', 'kx+m', 'm-x', 'm-kx', 'kx', 'x/k+m']), x0, s * s)
  if (!inner) return null
  const f = rng.chance(0.25) ? rng.pick([2, 3]) : 1
  const k = rng.pick([1, 1, 1, 2, -1, 3])
  const m = f * (none ? -s : s) - k * x0
  const right = m === 0 ? [times(k)] : [times(k), n(m)]
  return { task: spread(rng, [times(f, sqrt(inner))], right, 1, 0.35), label: 'Wurzel und x, danach quadratisch', none }
}

// \frac{P}{d(x - k)} = \frac{r}{d(x - k)} + c (auch umgestellt), \frac{x^2 + q}{x - k} = x + c; die Lösung kann der verbotene
// Wert sein
function buildFractionDomain(rng: Rng): NumberKitTask | null {
  const k = sign(rng) * rng.int(1, 6)
  const none = rng.chance(0.35)
  const x0 = none ? k : rng.int(-6, 12)
  if (x0 === k && !none) return null
  const c = sign(rng) * rng.int(1, 5)
  if (rng.chance(0.25)) {
    // x^2 + q = (x + c)(x - k): x = \frac{q + ck}{c - k}
    if (c === k) return null
    const q = x0 * (c - k) - c * k
    return { task: spread(rng, [div(plus(pow(X, num(2)), q), plus(X, -k))], [X, n(c)], 1, 0.2), label: 'Quadrat im Zähler, danach linear', none }
  }
  const d = rng.pick([1, 1, 1, 2, 3])
  const den = plus(times(d), -d * k)
  const p = anyLinear(rng, ['x+m', 'kx+m', 'kx', 'm-x'])
  // P - r = c·d(x - k) bei x0
  const r = valueOf(p, x0) - c * d * (x0 - k)
  const slope = valueOf(p, 1) - valueOf(p, 0)
  if (slope === c * d || r === 0) return null
  return { task: spread(rng, [div(p, den)], [over(r, den), n(c)], 1, 0.4), label: 'Brüche mit demselben Nenner', none }
}

const LOG_BASES: readonly Expr[] = [num(2), num(2), num(3), num(10), E]

// \log_b P_1 + \log_b P_2 = c bzw. = \log_b n, 2\log_b x = \log_b P; danach quadratisch, die zweite Lösung liegt außerhalb des
// Definitionsbereichs
function buildLogQuadratic(rng: Rng): NumberKitTask | null {
  const base = rng.pick(LOG_BASES)
  const b = baseNumber(base)
  const x0 = rng.int(1, 12)
  if (rng.chance(0.1)) {
    // 2\log_b x = \log_b(kx + m): x_0^2 = kx_0 + m
    const inner = linearWith(rng, rng.pick(['x+m', 'kx+m', 'kx']), x0, x0 * x0)
    if (!inner) return null
    return { task: spread(rng, [times(2, L(base, X))], [L(base, inner)], 1, 0), label: 'Faktor vor dem Logarithmus, danach quadratisch', none: false }
  }
  const p1 = rng.pick<Expr>([X, X, times(rng.int(2, 3)), plus(X, sign(rng) * rng.int(1, 6))])
  const p2 = plus(times(rng.pick([1, 1, 1, 2])), sign(rng) * rng.int(1, 8))
  const v1 = valueOf(p1, x0)
  const v2 = valueOf(p2, x0)
  const product = v1 * v2
  if (!(v1 > 0 && v2 > 0) || product > 120) return null
  const power = b > 0 ? [1, 2, 3, 4, 5, 6].find((c) => b ** c === product) : undefined
  const right = power !== undefined && rng.chance(0.8) ? n(power) : L(base, num(product))
  const logs = rng.shuffle([L(base, p1), L(base, p2)])
  return { task: spread(rng, logs, [right], 1, 0.35), label: 'Zwei Logarithmen, danach quadratisch', none: false }
}

// --- Stufe 3 ---

// \sqrt{f^2 x + a} = f\sqrt{x + b} + c (auch umgestellt); auch ohne Lösung
function buildTwoRoots(rng: Rng): NumberKitTask | null {
  const f = rng.pick([1, 1, 2, 3])
  const k = rng.pick([1, 1, 2, 3, -1])
  const x0 = rng.int(-3, 15)
  const s = rng.int(0, 6)
  const b = s * s - k * x0
  const c = rng.int(1, 4)
  const none = rng.chance(0.2)
  const t = none ? -rng.int(1, 3) : s
  // nach dem ersten Quadrieren: \sqrt{kx + b} = \frac{a - f^2 b - c^2}{2fc}
  const a = f * f * b + c * c + 2 * f * c * t
  const ra = sqrt(plus(times(f * f * k), a))
  const rb = times(f, sqrt(plus(times(k), b)))
  if (a === f * f * b) return null
  return { task: spread(rng, [ra], [rb, n(c)], 1, 0.5), label: 'Zwei Wurzeln, zweimal quadrieren', none }
}

// u = \sqrt{x} bzw. e^x: u^2 = Au + B mit u_1 = r > 0, u_2 = -q < 0
function substitutionNumbers(rng: Rng): { r: number; A: number; B: number } | null {
  const r = rng.int(2, 7)
  const q = rng.int(1, 6)
  if (q === r) return null
  return { r, A: r - q, B: r * q }
}

// fx = fA\sqrt{x} + fB, Summanden auf beiden Seiten
function buildRootX(rng: Rng): NumberKitTask | null {
  const z = substitutionNumbers(rng)
  if (!z) return null
  const f = rng.pick([1, 1, 2, 3])
  if (rng.chance(0.12)) {
    // \sqrt{x}(\sqrt{x} - A) = B
    return { task: spread(rng, [mul(sqrt(X), plus(sqrt(X), -z.A))], [n(z.B)], 1, 0), label: 'Wurzel mal Klammer, Substitution', none: false }
  }
  if (rng.chance(0.25) && z.A % 2 === 0 && z.B % 2 === 0) {
    // \frac{x}{2} = \frac{A}{2}\sqrt{x} + \frac{B}{2}
    return { task: spread(rng, [div(X, num(2))], [times(z.A / 2, sqrt(X)), n(z.B / 2)], 1, 0.5), label: 'Halbes x und Wurzel aus x, Substitution', none: false }
  }
  return { task: spread(rng, [times(f)], [times(f * z.A, sqrt(X)), n(f * z.B)], 1, 0.5), label: 'x und Wurzel aus x, Substitution', none: false }
}

// \frac{x^2 + q}{x - k} = \frac{mx + n}{x - k} (Lösungen k und r, k fällt weg), auch mit Zahl oder x daneben, oder
// \frac{x}{x - k} - \frac{k + r}{x} = \frac{k^2}{x(x - k)}
function buildFractionQuadratic(rng: Rng): NumberKitTask | null {
  const k = sign(rng) * rng.int(1, 6)
  const r = rng.int(-6, 9)
  if (r === k || r === 0) return null
  const den = plus(X, -k)
  const lin = (m: number, c: number): Expr => plus(times(m), c)
  const form = rng.int(1, 4)
  if (form === 1) {
    const q = rng.chance(0.4) ? 0 : sign(rng) * rng.int(1, 9)
    const m = k + r
    if (m === 0) return null
    return { task: spread(rng, [div(plus(pow(X, num(2)), q), den)], [div(lin(m, q - k * r), den)], 1, 0), label: 'Quadrat im Zähler, eine Lösung verboten', none: false }
  }
  if (form === 2) {
    // x^2 + c(x - k) = mx + n
    const c = sign(rng) * rng.int(1, 5)
    const m = k + r + c
    if (m === 0) return null
    return { task: spread(rng, [div(pow(X, num(2)), den), n(c)], [div(lin(m, -c * k - k * r), den)], 1, 0.4), label: 'Bruch und Zahl gleich Bruch, quadratisch', none: false }
  }
  if (form === 3) {
    // x(x - k) + q = rx + n
    const q = sign(rng) * rng.int(1, 9)
    return { task: spread(rng, [over(q, den), X], [div(lin(r, q - k * r), den)], 1, 0.4), label: 'x und Bruch gleich Bruch, quadratisch', none: false }
  }
  // x^2 - (k + r)(x - k) = k^2: Lösungen k und r
  if (k + r === 0) return null
  return { task: spread(rng, rng.shuffle([div(X, den), over(-(k + r), X)]), [over(k * k, mul(X, den))], 1, 0.4), label: 'Hauptnenner, danach quadratisch', none: false }
}

// \frac{a}{x - j} + \frac{b}{x - k} = \frac{c}{(x - j)(x - k)} (j oft 0): a(x - k) + b(x - j) = c, auch so, dass die
// Lösung j oder k wäre (keine Lösung)
function buildCommonDenominator(rng: Rng): NumberKitTask | null {
  const j = rng.chance(0.6) ? 0 : sign(rng) * rng.int(1, 6)
  const k = sign(rng) * rng.int(1, 6)
  const a = sign(rng) * rng.int(1, 6)
  const b = sign(rng) * rng.int(1, 6)
  if (a + b === 0 || j === k) return null
  const none = rng.chance(0.3)
  const x0 = none ? rng.pick([j, k]) : rng.int(-6, 10)
  if (!none && (x0 === j || x0 === k)) return null
  const c = a * (x0 - k) + b * (x0 - j)
  if (c === 0) return null
  const d1 = plus(X, -j)
  const d2 = plus(X, -k)
  const fractions = rng.shuffle([over(a, d1), over(b, d2)])
  return { task: spread(rng, fractions, [over(c, mul(d1, d2))], 1, 0.35), label: 'Hauptnenner aus zwei Nennern', none }
}

// --- Stufe 4 ---

// fe^{2x} = fAe^x + fB, e^x = A + Be^{-x}, e^x(e^x - A) = B, \frac{B}{e^x} = e^x - A
function buildExpQuadratic(rng: Rng): NumberKitTask | null {
  const z = substitutionNumbers(rng)
  if (!z) return null
  const f = rng.pick([1, 1, 2, 3])
  const ex = pow(E, X)
  const r = rng.next()
  const form = r < 0.32 ? 1 : r < 0.64 ? 2 : r < 0.74 ? 3 : 4
  if (form === 1) return { task: spread(rng, [times(f, pow(E, times(2)))], [times(f * z.A, ex), n(f * z.B)], 1, 0.4), label: 'e hoch 2x und e hoch x, Substitution', none: false }
  if (form === 2) return { task: spread(rng, [times(f, ex)], [n(f * z.A), times(f * z.B, pow(E, neg(X)))], 1, 0.4), label: 'e hoch x und e hoch minus x, Substitution', none: false }
  if (form === 3) return { task: spread(rng, [mul(ex, plus(ex, -z.A))], [n(z.B)], 1, 0), label: 'e hoch x mal Klammer, Substitution', none: false }
  return { task: spread(rng, [over(z.B, ex)], [ex, n(-z.A)], 1, 0.3), label: 'Zahl durch e hoch x, Substitution', none: false }
}

// \log_b P_1 + \log_b P_2 = \log_b P_3 + c bzw. + \ln n, danach quadratisch
function buildLogNumberQuadratic(rng: Rng): NumberKitTask | null {
  const base = rng.pick([num(2), num(2), num(3), num(10), E])
  const b = baseNumber(base)
  const c = b === 10 ? 1 : b === 0 ? 0 : rng.int(1, b === 2 ? 3 : 2)
  const extra = b === 0 ? rng.int(2, 6) : b ** c
  const x0 = rng.int(1, 12)
  const p1 = rng.pick<Expr>([X, plus(X, rng.int(1, 6)), plus(X, -rng.int(1, 4)), times(2)])
  const p2 = plus(X, sign(rng) * rng.int(1, 8))
  const v = valueOf(p1, x0) * valueOf(p2, x0)
  if (!(valueOf(p1, x0) > 0 && valueOf(p2, x0) > 0) || v % extra !== 0) return null
  const p3 = linearWith(rng, rng.pick(['x+m', 'kx+m', 'kx', 'kx']), x0, v / extra)
  if (!p3 || !(valueOf(p3, x0) > 0)) return null
  const number = b === 0 ? L(base, num(extra)) : n(c)
  return { task: spread(rng, [L(base, p1), L(base, p2)], [L(base, p3), number], 1, 0.4), label: 'Logarithmen und Zahl, danach quadratisch', none: false }
}

// \frac{fB}{\sqrt{x}} = f\sqrt{x} - fA, \frac{x - B}{\sqrt{x}} = A (auch mit Faktor)
function buildRootFraction(rng: Rng): NumberKitTask | null {
  const z = substitutionNumbers(rng)
  if (!z) return null
  const root = sqrt(X)
  const f = rng.pick([1, 1, 2])
  if (rng.chance(0.3)) return { task: spread(rng, [div(plus(times(f), -f * z.B), root)], [n(f * z.A)], 1, 0), label: 'Bruch mit Wurzel im Nenner gleich Zahl', none: false }
  return { task: spread(rng, [over(f * z.B, root)], [times(f, root), n(-f * z.A)], 1, 0.4), label: 'Zahl durch Wurzel und Wurzel, Substitution', none: false }
}

// \sqrt{ax^2 + px + q} = kx + c mit a = k^2 + d: nach dem Quadrieren d(x - r_1)(x - r_2) = 0; eine der beiden Zahlen ist eine
// Scheinlösung (kr + c < 0) oder beide (keine Lösung). p und q durch a teilbar, damit die Normalform ohne Brüche ist.
function buildRootSquare(rng: Rng): NumberKitTask | null {
  const k = rng.pick([1, -1, 2, -2, 3])
  const d = rng.pick([1, 1, 2, 3, 5])
  const a = k * k + d
  const c = rng.chance(0.25) ? 0 : sign(rng) * rng.int(1, 6)
  const [r1, r2] = [rng.int(-8, 10), rng.int(-8, 10)]
  if (r1 === r2) return null
  const valid = [r1, r2].filter((r) => k * r + c >= 0).length
  const none = valid === 0
  if (valid === 2) return null
  // a x^2 + p x + q = (kx + c)^2 + d(x - r_1)(x - r_2)
  const p = 2 * k * c - d * (r1 + r2)
  const q = c * c + d * r1 * r2
  if (p % a !== 0 || q % a !== 0) return null
  const inner = add(times(a, pow(X, num(2))), ...(p === 0 ? [] : [times(p)]), ...(q === 0 ? [] : [n(q)]))
  return { task: spread(rng, [sqrt(inner)], c === 0 ? [times(k)] : [times(k), n(c)], 1, 0.45), label: 'Wurzel aus einem quadratischen Term, Scheinlösung', none }
}

// --- M6 Schritt 4c ---

// f(P)^3 + d = c mit (P)^3 meist negativ: Die dritte Wurzel aus einer negativen Zahl gibt es (\sqrt[3]{-8} = -2)
function buildCube(rng: Rng): NumberKitTask | null {
  const f = rng.chance(0.4) ? rng.pick([2, 3, -1, -2]) : 1
  const size = rng.int(1, f === 1 ? 5 : 4)
  const p0 = rng.chance(0.75) ? -size : size
  let inner: Expr | null = X
  if (rng.chance(0.75)) inner = linearWith(rng, rng.pick(['x+m', 'kx+m', 'm-x', 'm-kx', 'x/k+m'] as const), rng.int(-8, 8), p0)
  if (!inner) return null
  const d = rng.chance(0.6) ? sign(rng) * rng.int(1, 9) : 0
  const left = d === 0 ? [times(f, pow(inner, num(3)))] : [times(f, pow(inner, num(3))), n(d)]
  return { task: spread(rng, left, [n(f * p0 ** 3 + d)]), label: p0 < 0 ? 'Hochzahl 3 gleich einer negativen Zahl' : 'Hochzahl 3', none: false }
}

const BUILDERS: Readonly<Record<string, (rng: Rng) => NumberKitTask | null>> = {
  wurzel: buildRoot,
  bruch: buildFraction,
  log: buildLog,
  'wurzel-linear': buildRootLinear,
  'bruch-def': buildFractionDomain,
  'log-quadratisch': buildLogQuadratic,
  'zwei-wurzeln': buildTwoRoots,
  'wurzel-x': buildRootX,
  'bruch-quadratisch': buildFractionQuadratic,
  hauptnenner: buildCommonDenominator,
  'exp-quadratisch': buildExpQuadratic,
  'log-zahl-quadratisch': buildLogNumberQuadratic,
  'wurzel-bruch': buildRootFraction,
  'wurzel-quadrat': buildRootSquare,
  'hoch-drei': buildCube,
}

// Aufgabe einer Art (null: diesmal nichts Brauchbares gewürfelt)
export function buildNumberEquation(rng: Rng, kind: NumberEquationKind): NumberKitTask | null {
  const build = BUILDERS[kind.id]
  if (!build) throw new Error(`Unbekannte Art ${kind.id}`)
  return build(rng)
}

// nur für Tests: alle Arten haben einen Baukasten
export const NUMBER_EQUATION_BUILDERS = Object.keys(BUILDERS)
