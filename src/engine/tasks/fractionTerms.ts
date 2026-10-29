import { reduceFrac } from '../fraction/factor.ts'
import type { Frac } from '../fraction/frac.ts'
import {
  type Poly,
  atomsOf,
  polyAdd,
  polyAtom,
  polyConst,
  polyMul,
  polyPow,
  polyScale,
  totalDegree,
} from '../fraction/poly.ts'
import {
  type FractionShape,
  type FractionTask,
  type Part,
  type Signed,
  expanded,
  minus,
  part,
  plus,
  taskFrac,
} from '../fraction/task.ts'
import { type Rng, createRng } from '../random/rng.ts'
import { rat } from '../rational.ts'
import type { Level, TaskRef } from './taskNumber.ts'

// Vorlagen für Bruchaufgaben je Stufe (siehe docs/PLAN-M2.md, „Stufen"). Jede Vorlage baut aus
// Zufallszahlen eine Aufgabe; Lösung und Rechenweg berechnet die Bruch-Engine.

export type FractionTemplate = {
  readonly id: string
  readonly level: Level
  readonly label: string
  build(rng: Rng): FractionTask
}

export type GeneratedFractionTask = {
  readonly ref: TaskRef
  readonly template: FractionTemplate
  readonly task: FractionTask
}

// --- kleine Bausteine ---

const c = (n: number) => polyConst(n)
// a·t + b
const lin = (a: number, b: number, atom = 'x'): Poly => polyAdd(polyScale(polyAtom(atom), rat(a)), c(b))
// k · Atome mit Hochzahlen, z. B. mono(6, ['x', 2], ['y', 1]) = 6x²y
const mono = (k: number, ...atoms: Array<readonly [string, number]>): Poly =>
  atoms.reduce((p, [atom, e]) => (e > 0 ? polyMul(p, polyAtom(atom, e)) : p), c(k))

const numberPart = (n: number, d = 1): Part => part(expanded(c(n)), expanded(c(d)))
const polyPart = (n: Poly, d: Poly = c(1)): Part => part(expanded(n), expanded(d))

const signed = (sign: 1 | -1, p: Part): Signed => (sign > 0 ? plus(p) : minus(p))
const anySign = (rng: Rng): 1 | -1 => (rng.chance(0.5) ? 1 : -1)
const nonZero = (rng: Rng, max: number) => (rng.chance(0.5) ? 1 : -1) * rng.int(1, max)

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

// Zahl zwischen 1 und 7, teilerfremd zu d
function coprimeTo(rng: Rng, d: number): number {
  return rng.pick([1, 2, 3, 4, 5, 6, 7].filter((n) => gcd(n, d) === 1))
}

// Zähler zwischen 1 und d − 1, teilerfremd zu d (echter, gekürzter Bruch)
function properNumerator(rng: Rng, d: number): number {
  const options = Array.from({ length: d - 1 }, (_, i) => i + 1).filter((n) => gcd(n, d) === 1)
  return rng.pick(options)
}

const shape = (s: FractionShape, hints: readonly Poly[] = []): FractionTask => ({ ...s, hints }) as FractionTask

// Nenner-Paare mit gemeinsamem Teiler (Hauptnenner kleiner als das Produkt) und teilerfremde
const SHARED_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [4, 6],
  [6, 8],
  [6, 9],
  [4, 10],
  [8, 12],
  [6, 10],
  [9, 12],
  [10, 15],
  [3, 6],
  [4, 8],
  [6, 4],
  [12, 8],
]
const COPRIME_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [2, 3],
  [3, 4],
  [2, 5],
  [3, 5],
  [4, 5],
  [5, 6],
  [3, 7],
  [4, 7],
  [5, 8],
]

// --- Stufe 1: Zahlenbrüche ---

const level1Sum: FractionTemplate = {
  id: 'zahlen-plus-minus',
  level: 1,
  label: 'Zwei Zahlenbrüche plus oder minus',
  build(rng) {
    const [b, d] = rng.pick(rng.chance(0.6) ? SHARED_PAIRS : COPRIME_PAIRS)
    let first = [properNumerator(rng, b), b]
    let second = [properNumerator(rng, d), d]
    const sign = anySign(rng)
    // Ergebnis positiv: den größeren Bruch nach vorn
    if (sign < 0 && first[0] * second[1] < second[0] * first[1]) [first, second] = [second, first]
    return shape({ kind: 'sum', terms: [plus(numberPart(first[0], first[1])), signed(sign, numberPart(second[0], second[1]))] })
  },
}

const level1Whole: FractionTemplate = {
  id: 'zahl-und-bruch',
  level: 1,
  label: 'Ganze Zahl plus oder minus Bruch',
  build(rng) {
    const d = rng.int(2, 9)
    const fraction = numberPart(properNumerator(rng, d), d)
    return shape({ kind: 'sum', terms: [plus(numberPart(rng.int(1, 4))), signed(anySign(rng), fraction)] })
  },
}

const level1Product: FractionTemplate = {
  id: 'zahlen-mal',
  level: 1,
  label: 'Zahlenbrüche malnehmen (mit Kürzen über Kreuz)',
  build(rng) {
    if (rng.chance(0.3)) {
      // Zahl mal Bruch, Zahl und Nenner haben einen gemeinsamen Teiler
      const d = rng.pick([4, 6, 8, 9, 10, 12])
      const n = rng.pick([2, 3, 4, 5, 6].filter((k) => gcd(k, d) > 1 && k !== d))
      return shape({ kind: 'product', left: numberPart(n), right: numberPart(properNumerator(rng, d), d) })
    }
    for (;;) {
      const [b, d] = [rng.int(2, 12), rng.int(2, 12)]
      const [a, e] = [properNumerator(rng, b), properNumerator(rng, d)]
      if (gcd(a, d) > 1 || gcd(e, b) > 1) return shape({ kind: 'product', left: numberPart(a, b), right: numberPart(e, d) })
    }
  },
}

const level1Quotient: FractionTemplate = {
  id: 'zahlen-geteilt',
  level: 1,
  label: 'Zahlenbrüche teilen',
  build(rng) {
    for (;;) {
      const [b, d] = [rng.int(2, 10), rng.int(2, 10)]
      const [a, e] = [properNumerator(rng, b), properNumerator(rng, d)]
      if (a * d !== e * b) return shape({ kind: 'quotient', left: numberPart(a, b), right: numberPart(e, d) })
    }
  },
}

// --- Stufe 2: Buchstaben in Produkten ---

const LETTER_PAIRS = [
  ['x', 'y'],
  ['a', 'b'],
] as const

const level2Reduce: FractionTemplate = {
  id: 'potenzen-kuerzen',
  level: 2,
  label: 'Produkte mit Potenzen kürzen',
  build(rng) {
    const [s, t] = rng.pick(LETTER_PAIRS)
    const g = rng.pick([2, 3, 4, 5, 6])
    const [p, q] = rng.pick([
      [1, 2],
      [2, 3],
      [3, 2],
      [1, 3],
      [3, 4],
      [2, 1],
      [4, 3],
      [5, 2],
    ])
    // erstes Atom oben höher, zweites unten höher (so wird in beide Richtungen gekürzt)
    const [n1, d1] = [rng.int(2, 6), rng.int(1, 2)]
    const [n2, d2] = [rng.int(0, 1), rng.int(2, 4)]
    const num = mono(g * p, [s, n1], [t, n2])
    const den = mono(g * q, [s, d1], [t, d2])
    return shape({ kind: 'reduce', part: polyPart(num, den) })
  },
}

const level2Sum: FractionTemplate = {
  id: 'buchstaben-plus-minus',
  level: 2,
  label: 'Brüche mit Buchstaben im Nenner plus oder minus',
  build(rng) {
    const sign = anySign(rng)
    const variant = rng.int(1, 4)
    if (variant === 1) {
      // \frac{2}{x} - \frac{1}{x^2}
      const t = rng.pick(['x', 'a'])
      const [p, q] = rng.pick([
        [1, 2],
        [1, 3],
        [2, 3],
        [2, 1],
      ])
      return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 5)), mono(1, [t, p]))), signed(sign, polyPart(c(rng.int(1, 5)), mono(1, [t, q])))] })
    }
    if (variant === 2) {
      // \frac{3}{2x} + \frac{5}{6x}
      const t = rng.pick(['x', 'a'])
      const [m1, m2] = rng.pick([
        [2, 6],
        [3, 6],
        [2, 3],
        [4, 6],
        [2, 4],
        [3, 4],
      ])
      return shape({
        kind: 'sum',
        terms: [plus(polyPart(c(coprimeTo(rng, m1)), mono(m1, [t, 1]))), signed(sign, polyPart(c(coprimeTo(rng, m2)), mono(m2, [t, 1])))],
      })
    }
    if (variant === 3) {
      // 1 + \frac{2}{x}
      const t = rng.pick(['x', 'a'])
      return shape({ kind: 'sum', terms: [plus(numberPart(rng.int(1, 3))), signed(sign, polyPart(c(rng.int(1, 5)), mono(1, [t, rng.int(1, 2)])))] })
    }
    // \frac{a}{b} - \frac{b}{a} oder \frac{1}{a} + \frac{1}{b}
    const [s, t] = rng.pick(LETTER_PAIRS)
    if (rng.chance(0.5)) {
      return shape({ kind: 'sum', terms: [plus(polyPart(mono(1, [s, 1]), mono(1, [t, 1]))), signed(sign, polyPart(mono(1, [t, 1]), mono(1, [s, 1])))] })
    }
    return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 3)), mono(1, [s, 1]))), signed(sign, polyPart(c(rng.int(1, 3)), mono(1, [t, 1])))] })
  },
}

// Zwei Bruchteile aus Produkten, die sich über Kreuz kürzen lassen
function monomialParts(rng: Rng): [Part, Part] {
  const [s, t] = rng.pick(LETTER_PAIRS)
  const k = rng.pick([2, 3, 4])
  const left = polyPart(mono(rng.pick([1, 2, 3]) * k, [s, rng.int(1, 2)]), mono(rng.pick([2, 3, 4, 5]), [t, rng.int(1, 2)]))
  const right = polyPart(mono(rng.pick([2, 3, 4, 5]), [t, rng.int(1, 3)]), mono(rng.pick([1, 2, 3]) * k, [s, rng.int(1, 3)]))
  return [left, right]
}

const level2Product: FractionTemplate = {
  id: 'buchstaben-mal',
  level: 2,
  label: 'Brüche mit Buchstaben malnehmen',
  build(rng) {
    const [left, right] = monomialParts(rng)
    return shape({ kind: 'product', left, right })
  },
}

const level2Quotient: FractionTemplate = {
  id: 'buchstaben-geteilt',
  level: 2,
  label: 'Brüche mit Buchstaben teilen',
  build(rng) {
    const [left, right] = monomialParts(rng)
    // Für „geteilt" den zweiten Bruch umdrehen, damit nach dem Kehrwert gekürzt werden kann
    return shape({ kind: 'quotient', left, right: part(right.den, right.num) })
  },
}

// --- Stufe 3: Summen in Zähler und Nenner ---

const level3Reduce: FractionTemplate = {
  id: 'summen-kuerzen',
  level: 3,
  label: 'Ausklammern und binomische Formeln, dann kürzen',
  build(rng) {
    const p = rng.int(1, 6)
    const k = rng.int(2, 5)
    const s = rng.chance(0.5) ? 1 : -1
    const plusP = lin(1, p)
    const minusP = lin(1, -p)
    const hints = [plusP, minusP]
    const squares = polyMul(plusP, minusP)
    switch (rng.int(1, 5)) {
      case 1:
        // \frac{x^2 - 9}{2x + 6}
        return shape({ kind: 'reduce', part: polyPart(squares, polyScale(lin(1, s * p), rat(k))) }, hints)
      case 2:
        // \frac{x^2 + 6x + 9}{x^2 - 9}
        return shape({ kind: 'reduce', part: polyPart(polyPow(lin(1, s * p), 2), squares) }, hints)
      case 3:
        // \frac{3x + 9}{x^2 + 6x + 9}
        return shape({ kind: 'reduce', part: polyPart(polyScale(lin(1, s * p), rat(k)), polyPow(lin(1, s * p), 2)) }, hints)
      case 4: {
        // \frac{3x^2 + 6x}{3x} bzw. mit einer Zahl im Nenner
        const r = rng.pick([1, 2, 3])
        return shape({ kind: 'reduce', part: polyPart(polyMul(mono(k, ['x', 1]), lin(1, s * p)), mono(k * r, ['x', 1])) }, hints)
      }
      default:
        // \frac{3 - x}{x^2 - 9}: vertauschte Differenz
        return shape({ kind: 'reduce', part: part(expanded(lin(-1, p), true), expanded(squares)) }, hints)
    }
  },
}

const level3Sum: FractionTemplate = {
  id: 'summen-im-nenner',
  level: 3,
  label: 'Brüche mit Nennern wie $x + 1$ und $x - 1$',
  build(rng) {
    const sign = anySign(rng)
    const p = nonZero(rng, 5)
    let q = nonZero(rng, 5)
    while (q === p) q = nonZero(rng, 5)
    switch (rng.int(1, 4)) {
      case 1:
        return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 5)), lin(1, p))), signed(sign, polyPart(c(rng.int(1, 5)), lin(1, q)))] }, [lin(1, p), lin(1, q)])
      case 2:
        return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 5)), lin(1, 0))), signed(sign, polyPart(c(rng.int(1, 5)), lin(1, p)))] }, [lin(1, p)])
      case 3:
        return shape({ kind: 'sum', terms: [plus(numberPart(rng.int(1, 3))), signed(sign, polyPart(c(rng.int(1, 5)), lin(1, p)))] }, [lin(1, p)])
      default: {
        // gleicher Nenner, Summen im Zähler: \frac{2x + 1}{x + 3} - \frac{x - 2}{x + 3}
        const den = lin(1, p)
        return shape({ kind: 'sum', terms: [plus(polyPart(lin(rng.int(2, 4), nonZero(rng, 5)), den)), minus(polyPart(lin(1, nonZero(rng, 5)), den))] }, [den])
      }
    }
  },
}

// --- Stufe 4: Uni-Niveau ---

// Zwei verschiedene ganze Zahlen ≠ 0 zwischen −6 und 6, nicht Gegenzahlen voneinander
function twoRoots(rng: Rng): [number, number] {
  for (;;) {
    const a = nonZero(rng, 6)
    const b = nonZero(rng, 6)
    if (a !== b && a !== -b) return [a, b]
  }
}

const level4Reduce: FractionTemplate = {
  id: 'quadratisch-kuerzen',
  level: 4,
  label: '$x^2 + px + q$ zerlegen und kürzen',
  build(rng) {
    const [r1, r2] = twoRoots(rng)
    let r3 = nonZero(rng, 6)
    while (r3 === r2 || r3 === r1) r3 = nonZero(rng, 6)
    const [f1, f2, f3] = [lin(1, r1), lin(1, r2), lin(1, r3)]
    const hints = [f1, f2, f3]
    switch (rng.int(1, 3)) {
      case 1:
        // \frac{x^2 - x - 6}{x^2 - 9}
        return shape({ kind: 'reduce', part: polyPart(polyMul(f1, f2), polyMul(f1, f3)) }, hints)
      case 2: {
        // \frac{x^2 - x - 6}{2x - 6}
        const k = rng.int(2, 4)
        return shape({ kind: 'reduce', part: polyPart(polyMul(f1, f2), polyScale(f1, rat(k))) }, hints)
      }
      default: {
        // \frac{x^3 - 4x}{x^2 + 2x}
        const p = Math.abs(r1)
        return shape({ kind: 'reduce', part: polyPart(polyMul(polyAtom('x'), polyMul(lin(1, p), lin(1, -p))), polyMul(polyAtom('x'), lin(1, rng.chance(0.5) ? p : -p))) }, [lin(1, p), lin(1, -p)])
      }
    }
  },
}

const level4Sum: FractionTemplate = {
  id: 'hauptnenner-zerlegen',
  level: 4,
  label: 'Hauptnenner aus zerlegten Nennern',
  build(rng) {
    const p = rng.int(1, 5)
    const sign = anySign(rng)
    const [plusP, minusP] = [lin(1, p), lin(1, -p)]
    const hints = [plusP, minusP]
    if (rng.chance(0.5)) {
      // \frac{x}{x^2 - 1} - \frac{1}{x + 1}
      const top = rng.chance(0.5) ? lin(1, 0) : c(rng.int(1, 5))
      return shape({ kind: 'sum', terms: [plus(polyPart(top, polyMul(plusP, minusP))), signed(sign, polyPart(c(rng.int(1, 4)), rng.chance(0.5) ? plusP : minusP))] }, hints)
    }
    // \frac{3}{x^2 + 2x} - \frac{1}{x}
    const shifted = rng.chance(0.5) ? plusP : minusP
    return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 5)), polyMul(polyAtom('x'), shifted))), signed(sign, polyPart(c(rng.int(1, 4)), polyAtom('x')))] }, hints)
  },
}

const level4Complex: FractionTemplate = {
  id: 'doppelbruch',
  level: 4,
  label: 'Doppelbrüche',
  build(rng) {
    const p = rng.int(1, 4)
    const hints = [lin(1, p), lin(1, -p)]
    const one = numberPart(1)
    const over = (n: Poly, d: Poly) => polyPart(n, d)
    switch (rng.int(1, 4)) {
      case 1:
        // \frac{1 + \frac{2}{x}}{1 - \frac{4}{x^2}}
        return shape({ kind: 'complex', top: [plus(one), plus(over(c(p), polyAtom('x')))], bottom: [plus(one), minus(over(c(p * p), polyAtom('x', 2)))] }, hints)
      case 2:
        // \frac{1 - \frac{2}{x}}{x - 2}
        return shape({ kind: 'complex', top: [plus(one), minus(over(c(p), polyAtom('x')))], bottom: [plus(polyPart(lin(1, -p)))] }, hints)
      case 3:
        // \frac{x - \frac{4}{x}}{1 + \frac{2}{x}}
        return shape({ kind: 'complex', top: [plus(polyPart(polyAtom('x'))), minus(over(c(p * p), polyAtom('x')))], bottom: [plus(one), plus(over(c(p), polyAtom('x')))] }, hints)
      default:
        // \frac{\frac{1}{x} + \frac{1}{2}}{x + 2}
        return shape({ kind: 'complex', top: [plus(over(c(1), polyAtom('x'))), plus(numberPart(1, p + 1))], bottom: [plus(polyPart(lin(1, p + 1)))] }, [lin(1, p + 1)])
    }
  },
}

// Bausteine statt x: e^x, ln x, sin x, cos x
const BLOCKS = ['E', 'L', 'S', 'C'] as const

const level4Blocks: FractionTemplate = {
  id: 'bausteine',
  level: 4,
  label: 'Bausteine wie $e^x$, $\\ln x$, $\\sin x$ statt $x$',
  build(rng) {
    const b = rng.pick(BLOCKS)
    // bei sin und cos nicht 1: 1 − sin² x wäre schon eine Regel der Winkelfunktionen
    const p = b === 'S' || b === 'C' ? rng.int(2, 4) : rng.int(1, 4)
    const [plusP, minusP] = [lin(1, p, b), lin(1, -p, b)]
    const hints = [plusP, minusP]
    const sign = anySign(rng)
    switch (rng.int(1, 4)) {
      case 1:
        // \frac{e^{2x} - 4}{e^x + 2}
        return shape({ kind: 'reduce', part: polyPart(polyMul(plusP, minusP), rng.chance(0.5) ? plusP : minusP) }, hints)
      case 2: {
        // \frac{3\sin x + 6}{\sin^2 x - 4}
        const k = rng.int(2, 4)
        return shape({ kind: 'reduce', part: polyPart(polyScale(plusP, rat(k)), polyMul(plusP, minusP)) }, hints)
      }
      case 3:
        // \frac{2}{\sin x} - \frac{1}{\sin^2 x}
        return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 4)), polyAtom(b))), signed(sign, polyPart(c(rng.int(1, 4)), polyAtom(b, 2)))] }, hints)
      default:
        // \frac{1}{e^x - 2} + \frac{1}{e^x + 2}
        return shape({ kind: 'sum', terms: [plus(polyPart(c(rng.int(1, 3)), minusP)), signed(sign, polyPart(c(rng.int(1, 3)), plusP))] }, hints)
    }
  },
}

export const FRACTION_TEMPLATES: readonly FractionTemplate[] = [
  level1Sum,
  level1Whole,
  level1Product,
  level1Quotient,
  level2Reduce,
  level2Sum,
  level2Product,
  level2Quotient,
  level3Reduce,
  level3Sum,
  level4Reduce,
  level4Sum,
  level4Complex,
  level4Blocks,
]

export function fractionTemplatesForLevel(level: Level): FractionTemplate[] {
  return FRACTION_TEMPLATES.filter((t) => t.level === level)
}

// Eine Aufgabe ist brauchbar, wenn ihr Ergebnis nicht 0 ist, ab Stufe 2 noch einen Buchstaben
// enthält und die Zahlen klein bleiben
function isGood(task: FractionTask, level: Level): boolean {
  let value: Frac
  try {
    value = taskFrac(task)
  } catch {
    return false
  }
  if (value.num.length === 0) return false
  const reduced = reduceFrac(value, task.hints)
  if (level >= 2 && atomsOf(reduced.num).length === 0 && reduced.den.factors.length === 0) return false
  const big = [...reduced.num, ...reduced.den.factors.flatMap((f) => f.poly)].some((t) => Math.abs(Number(t.coef.n)) > 200)
  return !big && Number(reduced.den.coef.n) <= 200 && totalDegree(reduced.num) <= 4
}

export const isFractionLevelAvailable = (level: Level) => fractionTemplatesForLevel(level).length > 0

// Erzeugt die Aufgabe zu einer Aufgaben-Nummer. Gleiche Nummer → gleiche Aufgabe.
export function generateFractionTask(ref: TaskRef): GeneratedFractionTask {
  const rng = createRng(`brueche:${ref.level}:${ref.seed}`)
  const templates = fractionTemplatesForLevel(ref.level)
  if (templates.length === 0) throw new Error(`Für Stufe ${ref.level} gibt es noch keine Bruchaufgaben`)
  for (;;) {
    const template = rng.pick(templates)
    const task = template.build(rng)
    if (isGood(task, ref.level)) return { ref, template, task }
  }
}
