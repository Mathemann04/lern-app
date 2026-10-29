import { type Rng, createRng } from '../random/rng.ts'
import { rat } from '../rational.ts'
import {
  type Equation,
  type Expr,
  E,
  add,
  cos,
  div,
  eq,
  exp,
  fn,
  ln,
  log,
  mul,
  neg,
  num,
  pow,
  root,
  scale,
  sin,
  sqrt,
  tan,
  x,
  y,
} from '../expr/types.ts'
import type { Level, TaskRef } from './taskNumber.ts'

// Vorlagen für Ableitungsaufgaben, je Stufe (siehe docs/PLAN-M1.md, „Stufen-Vorlagen").
// Jede Vorlage baut aus Zufallszahlen einen Term in Aufgabenform.
// Hier entstehen nur die Aufgaben; Lösungen berechnet die Engine (ab Schritt 3).

export type DerivativeTask =
  | { readonly kind: 'function'; readonly expr: Expr }
  | { readonly kind: 'implicit'; readonly equation: Equation }

export type TermTemplate = {
  readonly id: string
  readonly level: Level
  readonly label: string
  build(rng: Rng): DerivativeTask
}

export type GeneratedTask = {
  readonly ref: TaskRef
  readonly template: TermTemplate
  readonly task: DerivativeTask
}

// --- kleine Bausteine ---

const fx = (expr: Expr): DerivativeTask => ({ kind: 'function', expr })

const xPow = (n: number): Expr => (n === 1 ? x : pow(x, num(n)))

// c · e mit ganzzahligem c (1 → e, −1 → −e)
const times = (c: number, e: Expr): Expr => scale(rat(c), e)

const signed = (rng: Rng, value: number) => (rng.chance(0.5) ? value : -value)

// kx + b, z. B. 3x − 1 oder −2x
function linear(rng: Rng, { allowOne = false } = {}): Expr {
  const k = signed(rng, rng.int(allowOne ? 1 : 2, 6))
  const b = rng.chance(0.5) ? 0 : signed(rng, rng.int(1, 5))
  const kx = times(k, x)
  return b === 0 ? kx : add(kx, num(b))
}

// Nichtlineare innere Funktion, z. B. x², x² + 1, x² − 3x, 2x² + 1, x³ − 2x.
// sumOnly: keine reine Potenz, denn (x³)⁵ rechnet man besser direkt als x¹⁵
function nonlinear(rng: Rng, { sumOnly = false } = {}): Expr {
  const k = rng.int(2, 5)
  const c = rng.int(1, 9)
  const sums: Array<() => Expr> = [
    () => add(xPow(2), num(signed(rng, c))),
    () => add(xPow(2), times(-k, x)),
    () => add(times(k, xPow(2)), num(c)),
    () => add(xPow(3), times(signed(rng, k), x)),
  ]
  return rng.pick(sumOnly ? sums : [() => xPow(2), () => xPow(3), ...sums])()
}

// kx + b mit b ≠ 0 und k > 0, z. B. x − 3 oder 2x + 1 (für Potenzen wie (2x + 1)⁵;
// ohne b wäre (2x)⁵ einfacher direkt als 32x⁵ zu rechnen)
function linearWithOffset(rng: Rng): Expr {
  return add(times(rng.int(1, 5), x), num(signed(rng, rng.int(1, 9))))
}

// x² + c mit c > 0 (überall positiv, z. B. für Nenner und Wurzeln)
const positiveQuadratic = (rng: Rng): Expr => add(xPow(2), num(rng.int(1, 9)))

type Basic = 'exp' | 'ln' | 'sin' | 'cos'
const BASICS: readonly Basic[] = ['exp', 'ln', 'sin', 'cos']

function basic(name: Basic, arg: Expr): Expr {
  switch (name) {
    case 'exp':
      return exp(arg)
    case 'ln':
      return ln(arg)
    case 'sin':
      return sin(arg)
    case 'cos':
      return cos(arg)
  }
}

// --- Stufe 1: Potenz-, Faktor-, Summenregel ---

const FRACTION_EXPONENTS: ReadonlyArray<readonly [number, number]> = [
  [2, 3],
  [3, 2],
  [3, 4],
  [5, 2],
  [4, 3],
  [1, 3],
  [5, 3],
  [2, 5],
]

const FRACTION_COEFFICIENTS: ReadonlyArray<readonly [number, number]> = [
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 3],
  [3, 4],
  [3, 2],
]

const level1Sum: TermTemplate = {
  id: 'l1-summe',
  level: 1,
  label: 'Summe aus Potenzen, Brüchen und Wurzeln',
  build(rng) {
    const n = rng.int(2, 6)
    const leadingCoef = rng.chance(0.15)
      ? rat(...rng.pick(FRACTION_COEFFICIENTS))
      : rat(rng.chance(0.2) ? -rng.int(1, 9) : rng.int(1, 9))
    const leading = scale(leadingCoef, xPow(n))

    type Kind = 'power' | 'linear' | 'reciprocal' | 'sqrt' | 'root' | 'fractionExp' | 'constant'
    const pool: Kind[] = ['linear', 'reciprocal', 'sqrt', 'root', 'fractionExp', 'constant']
    if (n > 2) pool.push('power')
    const kinds = rng.shuffle(pool).slice(0, rng.int(1, 3))

    const middle: Expr[] = []
    let constant: Expr | null = null
    for (const kind of kinds) {
      const c = signed(rng, rng.int(1, 9))
      switch (kind) {
        case 'power':
          middle.unshift(times(c, xPow(rng.int(2, n - 1))))
          break
        case 'linear':
          middle.push(times(c, x))
          break
        case 'reciprocal': {
          const term = div(num(rng.int(1, 9)), xPow(rng.int(1, 3)))
          middle.push(c < 0 ? neg(term) : term)
          break
        }
        case 'sqrt':
          middle.push(times(signed(rng, rng.int(1, 6)), sqrt(x)))
          break
        case 'root': {
          const index = rng.pick([3, 4])
          const m = rng.pick(index === 3 ? [1, 2, 4, 5] : [1, 3, 5])
          middle.push(times(signed(rng, rng.int(1, 5)), root(xPow(m), index)))
          break
        }
        case 'fractionExp': {
          const [p, q] = rng.pick(FRACTION_EXPONENTS)
          middle.push(times(signed(rng, rng.int(1, 6)), pow(x, num(p, q))))
          break
        }
        case 'constant':
          constant = num(signed(rng, rng.int(2, 12)))
          break
      }
    }
    return fx(add(leading, ...middle, ...(constant ? [constant] : [])))
  },
}

// --- Stufe 2: e^x, ln, sin, cos mit höchstens einer Verknüpfung ---

const level2Basics: TermTemplate = {
  id: 'l2-grundfunktionen',
  level: 2,
  label: 'Grundfunktionen mit Faktor und Summe',
  build(rng) {
    const names = rng.shuffle(BASICS).slice(0, rng.int(2, 3))
    const terms = names.map((name, i) => times(i === 0 ? rng.int(1, 6) : signed(rng, rng.int(1, 6)), basic(name, x)))
    if (rng.chance(0.5)) terms.unshift(times(rng.int(1, 5), xPow(rng.int(2, 4))))
    return fx(add(...terms))
  },
}

const level2Product: TermTemplate = {
  id: 'l2-produkt',
  level: 2,
  label: 'Produkt aus Potenz und Grundfunktion',
  build(rng) {
    const c = rng.chance(0.6) ? 1 : signed(rng, rng.int(2, 5))
    return fx(times(c, mul(xPow(rng.int(1, 4)), basic(rng.pick(BASICS), x))))
  },
}

const level2Chain: TermTemplate = {
  id: 'l2-kette-linear',
  level: 2,
  label: 'Kettenregel mit linearer innerer Funktion',
  build(rng) {
    const name = rng.pick(BASICS)
    const inner = linear(rng, { allowOne: name === 'exp' && rng.chance(0.3) })
    const c = rng.chance(0.6) ? 1 : signed(rng, rng.int(2, 5))
    return fx(times(c, basic(name, inner)))
  },
}

// --- Stufe 3: zwei Regeln kombiniert ---

const level3ProductChain: TermTemplate = {
  id: 'l3-produkt-kette',
  level: 3,
  label: 'Produkt, ein Faktor mit Kettenregel',
  build(rng) {
    const k = signed(rng, rng.int(2, 5))
    const chained = rng.pick<() => Expr>([
      () => exp(rng.chance(0.5) ? xPow(2) : neg(xPow(2))),
      () => exp(times(k, x)),
      () => sin(times(Math.abs(k), x)),
      () => cos(times(Math.abs(k), x)),
      () => ln(positiveQuadratic(rng)),
    ])()
    const isExp = chained.kind === 'pow'
    const partner = rng.pick<() => Expr>([
      () => xPow(rng.int(1, 3)),
      () => sin(x),
      () => cos(x),
      () => (isExp ? ln(x) : exp(x)),
      () => ln(x),
    ])()
    const partnerIsPower = partner.kind === 'var' || (partner.kind === 'pow' && partner.base.kind === 'var')
    return fx(partnerIsPower ? mul(partner, chained) : mul(chained, partner))
  },
}

const level3Quotient: TermTemplate = {
  id: 'l3-quotient',
  level: 3,
  label: 'Quotient',
  build(rng) {
    const numerators: Array<() => Expr> = [
      () => ln(x),
      () => sin(x),
      () => cos(x),
      () => exp(x),
      () => xPow(rng.int(1, 3)),
      () => add(xPow(2), num(signed(rng, rng.int(1, 9)))),
    ]
    const denominators: Array<() => Expr> = [
      () => xPow(rng.int(1, 3)),
      () => positiveQuadratic(rng),
      () => add(x, num(signed(rng, rng.int(1, 5)))),
      () => exp(x),
    ]
    for (;;) {
      const u = rng.pick(numerators)()
      const v = rng.pick(denominators)()
      const isPower = (e: Expr) => e.kind === 'var' || (e.kind === 'pow' && e.base.kind === 'var')
      // x^n / x^m wäre nur die Potenzregel, e^x / e^x trivial
      if (isPower(u) && isPower(v)) continue
      if (u.kind === 'pow' && u.base === E && v.kind === 'pow' && v.base === E) continue
      if (u.kind === 'add' && v.kind === 'add') continue
      return fx(div(u, v))
    }
  },
}

const level3Chain: TermTemplate = {
  id: 'l3-kette',
  level: 3,
  label: 'Kettenregel mit nichtlinearer innerer Funktion',
  build(rng) {
    return fx(
      rng.pick<() => Expr>([
        () => sin(nonlinear(rng)),
        () => cos(nonlinear(rng)),
        () => exp(nonlinear(rng)),
        () => ln(positiveQuadratic(rng)),
        () => sqrt(positiveQuadratic(rng)),
        () => pow(linearWithOffset(rng), num(rng.int(3, 6))),
        () => pow(nonlinear(rng, { sumOnly: true }), num(rng.int(2, 5))),
      ])(),
    )
  },
}

const level3PowerOfFunction: TermTemplate = {
  id: 'l3-potenz-funktion',
  level: 3,
  label: 'Potenz einer Funktion',
  build(rng) {
    const n = rng.int(2, 4)
    return fx(pow(rng.pick([sin(x), cos(x), ln(x)]), num(n)))
  },
}

// --- Stufe 4: Uni-Niveau, verschachtelt, auch a^x, log_a, tan, arctan ---

const BASES = [2, 3, 5, 10]

const level4NestedQuotient: TermTemplate = {
  id: 'l4-quotient-verschachtelt',
  level: 4,
  label: 'Quotient mit Produkt und Kettenregel',
  build(rng) {
    const k = signed(rng, rng.int(2, 4))
    return fx(
      rng.pick<() => Expr>([
        () => div(mul(xPow(rng.int(1, 3)), exp(times(k, x))), sqrt(positiveQuadratic(rng))),
        () => div(mul(x, ln(x)), positiveQuadratic(rng)),
        () => div(sin(times(k, x)), positiveQuadratic(rng)),
        () => div(fn('arctan', x), xPow(rng.int(1, 3))),
        () => div(tan(x), exp(times(Math.abs(k), x))),
        () => div(exp(xPow(2)), add(x, num(rng.int(1, 5)))),
      ])(),
    )
  },
}

const level4LnOfQuotient: TermTemplate = {
  id: 'l4-ln-quotient',
  level: 4,
  label: 'Logarithmus eines Quotienten',
  build(rng) {
    const a = rng.int(1, 9)
    const b = rng.int(1, 5)
    return fx(
      ln(
        rng.pick<() => Expr>([
          () => div(add(xPow(2), num(a)), add(x, num(-b))),
          () => div(add(x, num(a)), add(x, num(-b))),
          () => div(add(xPow(2), num(-a)), add(xPow(2), num(b))),
        ])(),
      ),
    )
  },
}

const level4GeneralExp: TermTemplate = {
  id: 'l4-exponential-a',
  level: 4,
  label: 'Exponentialfunktion zur Basis a',
  build(rng) {
    const a = num(rng.pick(BASES))
    return fx(
      rng.pick<() => Expr>([
        () => pow(a, nonlinear(rng)),
        () => mul(xPow(rng.int(1, 3)), pow(a, x)),
        () => pow(a, sin(times(rng.int(1, 4), x))),
        () => div(pow(a, x), xPow(rng.int(1, 3))),
        () => pow(a, linear(rng)),
      ])(),
    )
  },
}

const level4GeneralLog: TermTemplate = {
  id: 'l4-log-a',
  level: 4,
  label: 'Logarithmus zur Basis a',
  build(rng) {
    const a = num(rng.pick(BASES))
    return fx(
      rng.pick<() => Expr>([
        () => log(a, positiveQuadratic(rng)),
        () => log(a, add(xPow(3), times(rng.int(1, 4), x))),
        () => mul(xPow(rng.int(1, 3)), log(a, x)),
        () => log(a, sqrt(x)),
        () => log(a, sin(x)),
      ])(),
    )
  },
}

const level4Tan: TermTemplate = {
  id: 'l4-tan',
  level: 4,
  label: 'Tangens',
  build(rng) {
    const k = signed(rng, rng.int(2, 4))
    return fx(
      rng.pick<() => Expr>([
        () => tan(nonlinear(rng)),
        () => mul(xPow(rng.int(1, 3)), tan(times(k, x))),
        () => exp(times(rng.int(1, 3), tan(x))),
        () => pow(tan(times(k, x)), num(rng.int(2, 3))),
        () => ln(tan(times(Math.abs(k), x))),
        () => div(tan(x), xPow(rng.int(1, 3))),
      ])(),
    )
  },
}

const level4Arctan: TermTemplate = {
  id: 'l4-arctan',
  level: 4,
  label: 'Arkustangens',
  build(rng) {
    const k = rng.int(2, 5)
    return fx(
      rng.pick<() => Expr>([
        () => fn('arctan', times(k, xPow(2))),
        () => fn('arctan', sqrt(x)),
        () => mul(xPow(rng.int(1, 3)), fn('arctan', x)),
        () => fn('arctan', div(num(1), x)),
        () => fn('arctan', exp(times(signed(rng, k), x))),
      ])(),
    )
  },
}

const level4TripleNesting: TermTemplate = {
  id: 'l4-dreifach',
  level: 4,
  label: 'Dreifach verschachtelt',
  build(rng) {
    const k = signed(rng, rng.int(2, 4))
    return fx(
      rng.pick<() => Expr>([
        () => sin(ln(positiveQuadratic(rng))),
        () => exp(sin(times(k, x))),
        () => sqrt(ln(times(Math.abs(k), x))),
        () => pow(cos(exp(times(k, x))), num(2)),
        () => ln(cos(times(Math.abs(k), x))),
        () => exp(sqrt(positiveQuadratic(rng))),
        () => ln(ln(times(Math.abs(k), x))),
      ])(),
    )
  },
}

// --- Stufe 5: Profi ---

const level5LogDifferentiation: TermTemplate = {
  id: 'l5-log-ableiten',
  level: 5,
  label: 'Logarithmisches Ableiten',
  build(rng) {
    const k = rng.int(1, 4)
    return fx(
      rng.pick<() => Expr>([
        () => pow(x, x),
        () => pow(x, sin(times(k, x))),
        () => pow(x, cos(times(k, x))),
        () => pow(x, times(k, ln(x))),
        () => pow(x, xPow(rng.int(2, 4))),
        () => pow(x, div(num(k), x)),
        () => pow(x, times(rng.int(2, 6), x)),
        () => pow(x, add(x, num(rng.int(1, 5)))),
        () => pow(positiveQuadratic(rng), x),
        () => pow(add(x, num(rng.int(1, 5))), x),
        () => pow(ln(x), times(k, x)),
        () => pow(x, sqrt(x)),
        () => pow(sin(x), x),
      ])(),
    )
  },
}

const level5Inverse: TermTemplate = {
  id: 'l5-umkehrfunktionen',
  level: 5,
  label: 'Umkehrfunktionen (arcsin, arccos)',
  build(rng) {
    const k = rng.int(2, 5)
    const name = rng.pick(['arcsin', 'arccos'] as const)
    return fx(
      rng.pick<() => Expr>([
        () => fn(name, times(k, x)),
        // innere Funktion kx ± 1, damit der Definitionsbereich nahe 0 liegt
        () => fn(name, add(times(k, x), num(signed(rng, 1)))),
        () => fn(name, times(rng.int(1, 3), xPow(2))),
        () => fn(name, sqrt(x)),
        () => mul(xPow(rng.int(1, 3)), fn(name, x)),
        () => fn(name, exp(times(rng.int(1, 3), x))),
      ])(),
    )
  },
}

const level5Hyperbolic: TermTemplate = {
  id: 'l5-hyperbel',
  level: 5,
  label: 'Hyperbelfunktionen',
  build(rng) {
    const k = signed(rng, rng.int(2, 5))
    return fx(
      rng.pick<() => Expr>([
        () => fn('sinh', times(k, x)),
        () => fn('cosh', nonlinear(rng)),
        () => fn('tanh', times(k, x)),
        () => mul(xPow(rng.int(1, 3)), fn(rng.pick(['sinh', 'cosh'] as const), times(k, x))),
        () => mul(exp(times(k, x)), fn('sinh', x)),
        () => pow(fn(rng.pick(['sinh', 'cosh', 'tanh'] as const), x), num(rng.int(2, 3))),
        () => fn('arsinh', times(rng.int(1, 3), xPow(2))),
        () => fn('arcosh', times(Math.abs(k), x)),
        () => fn('artanh', times(Math.abs(k), x)),
      ])(),
    )
  },
}

const level5Implicit: TermTemplate = {
  id: 'l5-implizit',
  level: 5,
  label: 'Implizites Ableiten',
  build(rng): DerivativeTask {
    const r = rng.int(2, 9)
    const c = rng.int(2, 10)
    const k = rng.int(2, 6)
    const equation = rng.pick<() => Equation>([
      () => eq(add(xPow(2), pow(y, num(2))), num(r * r)),
      () => eq(add(times(rng.int(2, 5), xPow(2)), times(rng.int(2, 5), pow(y, num(2)))), num(c * 10)),
      // rechts nicht 1: sonst liegt die ganze Gerade y = 0 auf der Kurve (dort ist y' überall 0)
      () => eq(add(times(rng.int(1, 4), mul(x, y)), exp(y)), num(rng.int(2, 5))),
      () => eq(add(mul(xPow(2), y), pow(y, num(3))), num(c)),
      () => eq(add(xPow(3), pow(y, num(3))), times(k, mul(x, y))),
      () => eq(add(xPow(2), times(rng.int(1, 3), mul(x, y)), pow(y, num(2))), num(c)),
      () => eq(sin(mul(x, y)), times(rng.int(1, 3), x)),
      () => eq(pow(y, num(2)), add(xPow(3), times(signed(rng, rng.int(1, 4)), x))),
    ])()
    return { kind: 'implicit', equation }
  },
}

export const DERIVATIVE_TEMPLATES: readonly TermTemplate[] = [
  level1Sum,
  level2Basics,
  level2Product,
  level2Chain,
  level3ProductChain,
  level3Quotient,
  level3Chain,
  level3PowerOfFunction,
  level4NestedQuotient,
  level4LnOfQuotient,
  level4GeneralExp,
  level4GeneralLog,
  level4Tan,
  level4Arctan,
  level4TripleNesting,
  level5LogDifferentiation,
  level5Inverse,
  level5Hyperbolic,
  level5Implicit,
]

export function templatesForLevel(level: Level): TermTemplate[] {
  return DERIVATIVE_TEMPLATES.filter((t) => t.level === level)
}

// Schon spielbar? Implizites Ableiten (Stufe 5) kommt in Schritt 11; die Nummern bleiben
// trotzdem dieselben, solche Aufgaben werden bis dahin nur übersprungen.
export function isPlayable(ref: TaskRef): boolean {
  return generateDerivativeTask(ref).task.kind === 'function'
}

// Erzeugt die Aufgabe zu einer Aufgaben-Nummer. Gleiche Nummer → gleiche Aufgabe.
export function generateDerivativeTask(ref: TaskRef): GeneratedTask {
  const rng = createRng(`ableitung:${ref.level}:${ref.seed}`)
  const template = rng.pick(templatesForLevel(ref.level))
  return { ref, template, task: template.build(rng) }
}
