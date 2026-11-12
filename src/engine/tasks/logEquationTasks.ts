import { key } from '../expr/compare.ts'
import { type Expr, E, add, div, eq, fn, log, mul, num, sub } from '../expr/types.ts'
import type { Condition, RearrangeTask } from '../rearrange/task.ts'
import type { Rng } from '../random/rng.ts'
import type { LogEquationKind } from './logEquationKinds.ts'
import { type KitTask, type Names, names } from './rearrangeKit.ts'

// Baukasten für Logarithmen auf beiden Seiten und verschiedene Basen (M6 Schritt 4b-2, Arten in logEquationKinds.ts):
// Argumente aus x, Zahlen und Buchstaben, Basen e, 2, 3, 5, 10 und ein Buchstabe (mit Bedingung größer 1), Zahlen oder
// Logarithmen ohne x dazu, Seiten vertauscht. Ob eine Aufgabe taugt (lösbar, genau eine passende Lösung, nicht zu breit),
// entscheidet rearrangeTerms.ts.

type Arg = { readonly e: Expr; readonly conditions: readonly Condition[] }
type Base = { readonly e: Expr; readonly conditions: readonly Condition[] }

const L = (base: Expr, arg: Expr): Expr => (base === E ? fn('ln', arg) : log(base, arg))

const numeric = (rng: Rng): Base => ({ e: num(rng.pick([2, 2, 3, 3, 5, 10])), conditions: [] })

// e, eine Zahl oder ein Buchstabe größer 1
function anyBase(rng: Rng, n: Names): Base {
  const r = rng.next()
  if (r < 0.3) return { e: E, conditions: [] }
  if (r < 0.5) {
    const a = n.letter()
    return { e: a, conditions: [{ lhs: a, rel: '>', rhs: num(1) }] }
  }
  return numeric(rng)
}

// Zahl vor x: 2 bis 5
const factor = (rng: Rng) => num(rng.int(2, 5))

type ArgKind = 'x' | 'kx' | 'bx' | 'x/b' | 'x+b' | 'x+k' | 'kx+b' | 'bx+c' | 'bx+k' | 'x-b' | 'b-x'

// Lineares Argument mit x; Bedingung, damit es positiv ist
function linear(rng: Rng, n: Names, kinds: readonly ArgKind[]): Arg {
  const x = n.unknown
  switch (rng.pick(kinds)) {
    case 'x':
      return { e: x, conditions: [] }
    case 'kx':
      return { e: mul(factor(rng), x), conditions: [] }
    case 'bx':
      return { e: mul(n.letter(), x), conditions: [] }
    case 'x/b':
      return { e: div(x, n.letter()), conditions: [] }
    case 'x+b':
      return { e: rng.chance(0.8) ? add(x, n.letter()) : add(n.letter(), x), conditions: [] }
    case 'x+k':
      return { e: add(x, factor(rng)), conditions: [] }
    case 'kx+b':
      return { e: add(mul(factor(rng), x), n.letter()), conditions: [] }
    case 'bx+c':
      return { e: add(mul(n.letter(), x), n.letter()), conditions: [] }
    case 'bx+k':
      return { e: add(mul(n.letter(), x), factor(rng)), conditions: [] }
    case 'x-b': {
      const b = n.letter()
      return { e: sub(x, b), conditions: [{ lhs: x, rel: '>', rhs: b }] }
    }
    case 'b-x': {
      const b = n.letter()
      return { e: sub(b, x), conditions: [{ lhs: x, rel: '<', rhs: b }] }
    }
  }
}

const ALL: readonly ArgKind[] = ['x', 'kx', 'bx', 'x/b', 'x+b', 'x+k', 'kx+b', 'bx+c', 'bx+k', 'x-b', 'b-x']
// Argumente, nach denen die Gleichung quadratisch wird (keine Zahl vor x im Quadrat, sonst lange Brüche)
const SUMS: readonly ArgKind[] = ['x+b', 'x+k', 'kx+b', 'bx+c', 'bx+k', 'bx']

// Zahl neben den Logarithmen: bei e oft ein Buchstabe, sonst 1 bis 3, aber Basis hoch Zahl höchstens 100
function constantFor(rng: Rng, n: Names, base: Expr): Expr {
  if (base === E && rng.chance(0.6)) return n.letter()
  const b = base.kind === 'num' ? Number(base.value.n) : 3
  return num(rng.int(1, base === E ? 2 : b >= 5 ? 2 : 3))
}

// Zahl oder Logarithmus ohne x: 2, \log_2 b
function extra(rng: Rng, n: Names, base: Expr): Expr {
  return rng.chance(0.35) ? L(base, n.letter()) : constantFor(rng, n, base)
}

// Summe mit einem Summanden ohne x dazu, vorn oder hinten, mit Plus oder (seltener) Minus
function withExtra(rng: Rng, logTerm: Expr, c: Expr, allowMinus = true): Expr {
  if (allowMinus && rng.chance(0.25)) return sub(logTerm, c)
  return rng.chance(0.65) ? add(logTerm, c) : add(c, logTerm)
}

const two = (rng: Rng, a: Expr, b: Expr): [Expr, Expr] => (rng.chance(0.5) ? [a, b] : [b, a])

function unique(conditions: readonly Condition[]): Condition[] {
  const seen = new Set<string>()
  return conditions.filter((c) => {
    const k = `${key(c.lhs)}${c.rel}${key(c.rhs)}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

const task = (rng: Rng, n: Names, lhs: Expr, rhs: Expr, conditions: readonly Condition[]): RearrangeTask => {
  const [l, r] = rng.chance(0.5) ? [rhs, lhs] : [lhs, rhs]
  return { equation: eq(l, r), target: n.target, conditions: unique(conditions) }
}

// Basis und ihr Quadrat: 2 und 4, 3 und 9, 5 und 25
function basePair(rng: Rng): [Expr, Expr] {
  const g = rng.pick([2, 2, 3, 3, 5])
  return [num(g), num(g * g)]
}

const BUILDERS: Readonly<Record<string, (rng: Rng, n: Names) => KitTask>> = {
  // \log_2(x + a) = \log_2 x + 3, \ln(bx) = \ln(x + c) + \ln d
  zahl: (rng, n) => {
    const base = anyBase(rng, n)
    const a = linear(rng, n, ALL)
    const b = linear(rng, n, ALL)
    const conditions = [...base.conditions, ...a.conditions, ...b.conditions]
    return { task: task(rng, n, L(base.e, a.e), withExtra(rng, L(base.e, b.e), extra(rng, n, base.e)), conditions), label: 'Logarithmen auf beiden Seiten mit einer Zahl' }
  },
  // 2\ln x = \ln(ax + b), auch mit einer Zahl dazu
  faktor: (rng, n) => {
    const base = anyBase(rng, n)
    const other = linear(rng, n, SUMS)
    const left = mul(num(2), L(base.e, n.unknown))
    const right = rng.chance(0.4) ? withExtra(rng, L(base.e, other.e), extra(rng, n, base.e), false) : L(base.e, other.e)
    return { task: task(rng, n, left, right, [...base.conditions, ...other.conditions]), label: 'Faktor vor dem Logarithmus, danach quadratisch' }
  },
  // \ln(x + a) + \log_3(x + a) = b, \log_2(x + a) = \ln(x + a) + b
  'basis-ln': (rng, n) => buildLnPair(rng, n, false),
  // \log_3(x + a) - 1 = \log_3(x - b) + 1
  zahlen: (rng, n) => {
    const base = anyBase(rng, n)
    const a = linear(rng, n, ALL)
    const b = linear(rng, n, ALL)
    const c1 = extra(rng, n, base.e)
    let c2 = extra(rng, n, base.e)
    // nicht zweimal dieselbe Zahl (sie höbe sich nur weg)
    for (let i = 0; i < 5 && key(c1) === key(c2); i++) c2 = constantFor(rng, n, base.e)
    return {
      task: task(rng, n, withExtra(rng, L(base.e, a.e), c1), withExtra(rng, L(base.e, b.e), c2), [...base.conditions, ...a.conditions, ...b.conditions]),
      label: 'Logarithmen auf beiden Seiten mit Zahlen',
    }
  },
  // 2\log_4(x + a) = \log_2(bx) + 1: der Faktor 2 hebt sich mit dem Basiswechsel weg
  'basis-linear': (rng, n) => {
    const [small, big] = basePair(rng)
    const a = linear(rng, n, ALL)
    const b = linear(rng, n, ALL)
    const bigSide = mul(num(2), L(big, a.e))
    const smallSide = rng.chance(0.7) ? withExtra(rng, L(small, b.e), rng.chance(0.3) ? L(big, n.letter()) : num(1)) : L(small, b.e)
    return { task: task(rng, n, bigSide, smallSide, [...a.conditions, ...b.conditions]), label: 'Basen und ihr Quadrat, danach linear' }
  },
  // \ln(x + a) + \ln(x - a) = \ln(bx), \ln(x + a) - \ln x = \ln(x + b)
  produkt: (rng, n) => buildProduct(rng, n, false),
  // \log_2 x = \log_4(x + a)
  'basis-potenz': (rng, n) => buildBasePair(rng, n, false),
  // 2\ln x = \ln b + \ln(x + c)
  'faktor-produkt': (rng, n) => {
    const base = anyBase(rng, n)
    const other = linear(rng, n, SUMS)
    const [p, q] = two(rng, L(base.e, n.letter()), L(base.e, other.e))
    const r = rng.next()
    const x = n.unknown
    const left = r < 0.6 ? mul(num(2), L(base.e, x)) : r < 0.8 ? add(L(base.e, x), L(base.e, x)) : mul(num(2), L(base.e, x))
    const right = r >= 0.8 ? withExtra(rng, L(base.e, other.e), constantFor(rng, n, base.e), false) : add(p, q)
    return { task: task(rng, n, left, right, [...base.conditions, ...other.conditions]), label: 'Faktor gegen zwei Logarithmen, danach quadratisch' }
  },
  // \log_2 x + 1 = \log_4(x + a)
  'basis-zahl': (rng, n) => buildBasePair(rng, n, true),
  // \log_2(x + a) + \log_2(x - a) = \log_2(bx) + 1
  'produkt-zahl': (rng, n) => buildProduct(rng, n, true),
  // 2\ln x = \ln(x + a) + \ln(x - b) mit a > b: x^2 hebt sich weg
  'quadrat-weg': (rng, n) => {
    const base = anyBase(rng, n)
    const x = n.unknown
    const a = n.letter()
    const b = n.letter()
    const r = rng.next()
    if (r < 0.35) {
      const [p, q] = two(rng, L(base.e, add(x, a)), L(base.e, sub(x, b)))
      const conditions: Condition[] = [...base.conditions, { lhs: x, rel: '>', rhs: b }, { lhs: a, rel: '>', rhs: b }]
      return { task: task(rng, n, mul(num(2), L(base.e, x)), add(p, q), conditions), label: 'Faktor gegen zwei Logarithmen, das Quadrat hebt sich weg' }
    }
    if (r < 0.65) {
      // \ln(x + a) - \ln x = \ln x - \ln(x - b)
      const conditions: Condition[] = [...base.conditions, { lhs: x, rel: '>', rhs: b }, { lhs: a, rel: '>', rhs: b }]
      return { task: task(rng, n, sub(L(base.e, add(x, a)), L(base.e, x)), sub(L(base.e, x), L(base.e, sub(x, b))), conditions), label: 'Zwei Quotienten, das Quadrat hebt sich weg' }
    }
    const [p, q] = two(rng, L(base.e, add(x, a)), L(base.e, sub(x, a)))
    const conditions: Condition[] = [...base.conditions, { lhs: x, rel: '>', rhs: a }, { lhs: a, rel: '>', rhs: b }]
    return { task: task(rng, n, add(p, q), mul(num(2), L(base.e, sub(x, b))), conditions), label: 'Zwei Logarithmen gegen einen Faktor, das Quadrat hebt sich weg' }
  },
  // 2\ln(x + a) - \log_3(x + a) = b
  'basis-ln-faktor': (rng, n) => buildLnPair(rng, n, true),
}

// \ln und \log_b desselben Arguments; mit Faktor 2 oder 3 vor einem der beiden
function buildLnPair(rng: Rng, n: Names, scaled: boolean): KitTask {
  const base = numeric(rng).e
  const arg = linear(rng, n, ['x', 'kx', 'bx', 'x/b', 'x+b', 'x+k', 'kx+b', 'bx+c'])
  const c = rng.chance(0.8) ? n.letter() : num(rng.int(1, 3))
  const k = num(rng.int(2, 3))
  const lnTerm = scaled && rng.chance(0.5) ? mul(k, fn('ln', arg.e)) : fn('ln', arg.e)
  const logTerm = scaled && lnTerm.kind !== 'mul' ? mul(k, log(base, arg.e)) : log(base, arg.e)
  const r = rng.next()
  const sides: [Expr, Expr] = r < 0.45 ? [add(...two(rng, lnTerm, logTerm)), c] : r < 0.8 ? [logTerm, add(lnTerm, c)] : [lnTerm, add(logTerm, c)]
  return { task: task(rng, n, sides[0], sides[1], arg.conditions), label: scaled ? 'ln und ein anderer Logarithmus mit Faktor' : 'ln und ein anderer Logarithmus desselben Terms' }
}

// zwei Logarithmen mit x auf einer Seite: Summe (\ln(x + a) + \ln(x - a), \ln x + \ln(x + a)) oder Differenz
// (\ln(x + a) - \ln x); auf der anderen ein Logarithmus mit x, dazu manchmal einer ohne x oder eine Zahl
function buildProduct(rng: Rng, n: Names, number: boolean): KitTask {
  const base = anyBase(rng, n)
  const x = n.unknown
  const r = rng.next()
  let left: Expr
  let right: Arg
  const conditions: Condition[] = [...base.conditions]
  if (r < 0.35) {
    const a = n.letter()
    const [p, q] = two(rng, L(base.e, add(x, a)), L(base.e, sub(x, a)))
    left = add(p, q)
    conditions.push({ lhs: x, rel: '>', rhs: a })
    right = linear(rng, n, ['bx', 'kx', 'bx+c', 'kx+b', 'x/b', 'bx+k'])
  } else if (r < 0.7) {
    const first = linear(rng, n, ['x', 'kx', 'bx', 'x/b'])
    const [p, q] = two(rng, L(base.e, first.e), L(base.e, linear(rng, n, ['x+b', 'x+k']).e))
    left = add(p, q)
    right = linear(rng, n, ['bx+c', 'kx+b', 'x+b', 'bx+k', 'x+k'])
  } else {
    left = sub(L(base.e, linear(rng, n, ['x+b', 'x+k', 'kx+b']).e), L(base.e, x))
    right = linear(rng, n, ['x+b', 'kx+b', 'bx+c', 'x+k', 'bx'])
  }
  conditions.push(...right.conditions)
  const plain = L(base.e, right.e)
  const rightSide = number ? withExtra(rng, plain, constantFor(rng, n, base.e), false) : rng.chance(0.3) ? withExtra(rng, plain, L(base.e, n.letter()), false) : plain
  return {
    task: task(rng, n, left, rightSide, conditions),
    label: number ? 'Zwei Logarithmen auf einer Seite und eine Zahl, danach quadratisch' : 'Zwei Logarithmen auf einer Seite, danach quadratisch',
  }
}

// \log_2 x = \log_4(B), auch mit \log_4 b oder einer Zahl dazu
function buildBasePair(rng: Rng, n: Names, number: boolean): KitTask {
  const [small, big] = basePair(rng)
  const other = linear(rng, n, SUMS)
  const smallSide = L(small, linear(rng, n, ['x', 'x', 'x/b', 'bx']).e)
  const plainBig = L(big, other.e)
  const bigSide = rng.chance(0.3) ? withExtra(rng, plainBig, L(big, n.letter()), false) : plainBig
  if (!number) return { task: task(rng, n, smallSide, bigSide, other.conditions), label: 'Basen und ihr Quadrat, danach quadratisch' }
  const c = num(key(small) === key(num(2)) ? rng.int(1, 2) : 1)
  // die Zahl beim kleinen oder beim großen Logarithmus, mit Plus oder Minus
  const sides: [Expr, Expr] = rng.chance(0.6) ? [withExtra(rng, smallSide, c), bigSide] : [smallSide, withExtra(rng, bigSide, c)]
  return { task: task(rng, n, sides[0], sides[1], other.conditions), label: 'Basen und ihr Quadrat mit einer Zahl, danach quadratisch' }
}

// Aufgabe einer Art
export function buildLogEquation(rng: Rng, kind: LogEquationKind): KitTask {
  const build = BUILDERS[kind.id]
  if (!build) throw new Error(`Unbekannte Art ${kind.id}`)
  return build(rng, names(rng, false))
}

// nur für Tests: alle Arten haben einen Baukasten
export const LOG_EQUATION_BUILDERS = Object.keys(BUILDERS)
