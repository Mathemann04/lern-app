import { toLatex } from '../expr/print.ts'
import { type Expr, add, div, eq, mul, num, pow, sqrt, sub, variable } from '../expr/types.ts'
import { contains } from '../expr/compare.ts'
import { samplePoints } from '../rearrange/check.ts'
import { solveEquation } from '../rearrange/isolate.ts'
import type { Condition, RearrangeTask } from '../rearrange/task.ts'
import { type Rng, createRng } from '../random/rng.ts'
import type { Level, TaskRef } from './taskNumber.ts'

// Vorlagen für Umstell-Aufgaben je Stufe (siehe docs/PLAN-M3.md, „Stufen"). Jede Vorlage baut aus
// Zufallszahlen eine Gleichung; Rechenweg und Lösung berechnet die Umstell-Engine.

export type RearrangeTemplate = {
  readonly id: string
  readonly level: Level
  readonly label: string
  build(rng: Rng): RearrangeTask
}

export type GeneratedRearrangeTask = {
  readonly ref: TaskRef
  readonly template: RearrangeTemplate
  readonly task: RearrangeTask
}

// --- kleine Bausteine ---

const [a, b, c, d, m, x, y] = ['a', 'b', 'c', 'd', 'm', 'x', 'y'].map(variable)
const n = (k: number) => num(k)
const sign = (rng: Rng): 1 | -1 => (rng.chance(0.5) ? 1 : -1)
// e ± f
const pm = (e: Expr, f: Expr, s: 1 | -1) => (s > 0 ? add(e, f) : sub(e, f))
// k · e, bei k = 1 nur e
const times = (k: number, e: Expr) => (k === 1 ? e : mul(n(k), e))
const sq = (e: Expr) => pow(e, n(2))

const task = (lhs: Expr, rhs: Expr, target = 'x', conditions: Condition[] = []): RearrangeTask => ({ equation: eq(lhs, rhs), target, conditions })

// --- Stufe 1: mehrere Schritte, die Variable kommt einmal vor ---

const level1Scaled: RearrangeTemplate = {
  id: 'scaled',
  level: 1,
  label: 'Bruch mit Klammer und Summand',
  build: (rng) => task(y, pm(div(times(rng.int(2, 9), pm(x, a, sign(rng))), b), c, sign(rng))),
}

const level1PointSlope: RearrangeTemplate = {
  id: 'point-slope',
  level: 1,
  label: 'Punkt-Steigungs-Form, nach $m$, $x$ oder $a$',
  build: (rng) => task(y, pm(mul(m, pm(x, a, sign(rng))), b, sign(rng)), rng.pick(['m', 'x', 'a'])),
}

const level1Fractions: RearrangeTemplate = {
  id: 'fractions',
  level: 1,
  label: 'Zwei Brüche, einer mit $x$',
  build: (rng) => task(pm(div(times(rng.int(1, 9), x), a), div(b, c), sign(rng)), d),
}

const level1MinusFraction: RearrangeTemplate = {
  id: 'minus-fraction',
  level: 1,
  label: 'Bruch mit Minus davor',
  build: (rng) => task(y, sub(a, div(pm(x, b, sign(rng)), n(rng.int(2, 9))))),
}

const level1Nested: RearrangeTemplate = {
  id: 'nested',
  level: 1,
  label: 'Klammer in der Klammer',
  build: (rng) => task(pm(mul(a, pm(times(rng.int(2, 9), x), b, sign(rng))), c, sign(rng)), d),
}

// --- Stufe 2: die Variable kommt mehrfach vor oder steht im Nenner ---

const level2BothSides: RearrangeTemplate = {
  id: 'both-sides',
  level: 2,
  label: '$x$ auf beiden Seiten',
  build: (rng) =>
    rng.chance(0.5)
      ? task(pm(mul(a, x), b, sign(rng)), pm(mul(c, x), d, sign(rng)))
      : task(pm(times(rng.int(2, 9), x), a, sign(rng)), pm(mul(b, x), c, sign(rng))),
}

const level2Brackets: RearrangeTemplate = {
  id: 'brackets',
  level: 2,
  label: 'Klammern auf beiden Seiten',
  build: (rng) =>
    rng.chance(0.5)
      ? task(mul(a, pm(x, b, sign(rng))), mul(c, pm(x, d, sign(rng))))
      : task(mul(n(rng.int(2, 9)), pm(x, a, sign(rng))), mul(b, pm(x, c, sign(rng)))),
}

const level2Reciprocal: RearrangeTemplate = {
  id: 'reciprocal',
  level: 2,
  label: '$x$ im Nenner',
  build: (rng) => {
    switch (rng.int(0, 2)) {
      case 0:
        return task(pm(div(a, x), b, sign(rng)), c)
      case 1:
        return task(pm(div(n(rng.int(2, 9)), x), a, sign(rng)), b)
      default:
        return task(div(a, pm(x, b, sign(rng))), c)
    }
  },
}

const level2Hyperbola: RearrangeTemplate = {
  id: 'hyperbola',
  level: 2,
  label: '$y$ als Bruch mit $x$ im Nenner',
  build: (rng) => {
    switch (rng.int(0, 2)) {
      case 0:
        return task(y, div(a, pm(b, x, sign(rng))))
      case 1:
        return task(y, pm(div(a, pm(x, b, sign(rng))), c, sign(rng)))
      default:
        return task(y, add(div(n(rng.int(2, 9)), sub(x, a)), b))
    }
  },
}

const level2MinusBracket: RearrangeTemplate = {
  id: 'minus-bracket',
  level: 2,
  label: 'Klammer mit $x$ hinten',
  build: (rng) => task(pm(times(rng.int(2, 9), x), a, sign(rng)), mul(b, sub(c, x))),
}

// --- Stufe 3: Brüche und Wurzeln, die Variable kommt mehrfach vor ---

const level3Mobius: RearrangeTemplate = {
  id: 'mobius',
  level: 3,
  label: '$x$ in Zähler und Nenner',
  build: (rng) => {
    if (rng.chance(0.3)) return task(y, div(pm(mul(a, x), b, sign(rng)), sub(x, c)))
    const p = rng.int(1, 5)
    const r = rng.int(1, 6)
    let q = rng.int(1, 7) * sign(rng)
    if (p * r + q === 0) q += 1
    return task(y, div(pm(times(p, x), n(Math.abs(q)), q > 0 ? 1 : -1), sub(x, n(r))))
  },
}

const level3Reciprocals: RearrangeTemplate = {
  id: 'reciprocals',
  level: 3,
  label: 'Kehrwerte addieren',
  build: (rng) => {
    const k = rng.pick([1, 1, 2, 3])
    const left = add(div(n(k), x), div(n(1), a))
    if (k === 1 && rng.chance(0.3)) return task(div(n(1), b), add(div(n(1), x), div(n(1), a)), 'b')
    return task(left, div(n(1), b), rng.pick(k === 1 ? ['a', 'x'] : ['a']))
  },
}

const level3Ratio: RearrangeTemplate = {
  id: 'ratio',
  level: 3,
  label: 'Verhältnis zweier Summen',
  build: (rng) => {
    const k = rng.int(1, 4)
    const s = sign(rng)
    const top = rng.chance(0.5) ? pm(x, times(k, a), s) : pm(times(k, x), a, s)
    // nie Zähler gleich Nenner: bei k = 1 hat der Nenner das andere Vorzeichen
    return task(div(top, pm(x, a, k === 1 ? (-s as 1 | -1) : sign(rng))), b)
  },
}

const level3Cross: RearrangeTemplate = {
  id: 'cross',
  level: 3,
  label: 'Bruch gleich Bruch',
  build: (rng) => {
    if (rng.chance(0.5)) return task(div(a, pm(x, b, sign(rng))), div(c, pm(x, rng.chance(0.5) ? b : d, sign(rng))))
    const k = rng.int(2, 9)
    let j = rng.int(2, 9)
    if (j === k) j = k + 1
    return task(div(n(k), pm(x, a, sign(rng))), div(n(j), pm(x, b, sign(rng))))
  },
}

const level3SumX: RearrangeTemplate = {
  id: 'sum-x',
  level: 3,
  label: '$x$ in zwei Brüchen',
  build: (rng) => {
    const k = rng.int(1, 5)
    return task(pm(div(x, a), div(times(k, x), b), sign(rng)), rng.chance(0.5) ? n(1) : c)
  },
}

const level3RootRatio: RearrangeTemplate = {
  id: 'root-ratio',
  level: 3,
  label: 'Wurzel aus einem Bruch',
  build: (rng) => {
    const k = rng.int(1, 3)
    const inner = div(add(x, times(k, a)), sub(x, a))
    const j = rng.pick([1, 1, 2, 3])
    return task(y, j === 1 ? sqrt(inner) : mul(n(j), sqrt(inner)), 'x', [{ lhs: x, rel: '>', rhs: a }])
  },
}

const level3RootCircle: RearrangeTemplate = {
  id: 'root-circle',
  level: 3,
  label: '$x^2$ unter der Wurzel',
  build: (rng) => {
    switch (rng.int(0, 2)) {
      case 0:
        return task(y, mul(a, sqrt(sub(sq(b), sq(x)))))
      case 1:
        return task(y, sqrt(sub(a, times(rng.int(2, 9), sq(x)))))
      default:
        return task(y, mul(n(rng.int(2, 5)), sqrt(sub(sq(a), sq(x)))))
    }
  },
}

const level3RootDiff: RearrangeTemplate = {
  id: 'root-diff',
  level: 3,
  label: 'Differenz zweier Wurzeln (zweimal quadrieren)',
  build: (rng) => {
    const k = rng.int(1, 4)
    const shifted = sqrt(add(x, times(k, a)))
    return rng.chance(0.5) ? task(y, sub(shifted, sqrt(x))) : task(shifted, add(sqrt(x), y))
  },
}

export const REARRANGE_TEMPLATES: readonly RearrangeTemplate[] = [
  level1Scaled,
  level1PointSlope,
  level1Fractions,
  level1MinusFraction,
  level1Nested,
  level2BothSides,
  level2Brackets,
  level2Reciprocal,
  level2Hyperbola,
  level2MinusBracket,
  level3Mobius,
  level3Reciprocals,
  level3Ratio,
  level3Cross,
  level3SumX,
  level3RootRatio,
  level3RootCircle,
  level3RootDiff,
]

export function rearrangeTemplatesForLevel(level: Level): RearrangeTemplate[] {
  return REARRANGE_TEMPLATES.filter((t) => t.level === level)
}

export const isRearrangeLevelAvailable = (level: Level) => rearrangeTemplatesForLevel(level).length > 0

// Brauchbar: lösbar, das Ergebnis ohne die gesuchte Variable, an genug erlaubten Stellen
// prüfbar, nicht zu lang
function isGood(t: RearrangeTask): boolean {
  const solution = solveEquation(t.equation, t.target)
  if (!solution || contains(solution.result, t.target)) return false
  if (toLatex(solution.result).length > 90) return false
  return samplePoints(t, solution.result, createRng('brauchbar'), 8, solution.requires).length >= 8
}

// Erzeugt die Aufgabe zu einer Aufgaben-Nummer. Gleiche Nummer → gleiche Aufgabe.
export function generateRearrangeTask(ref: TaskRef): GeneratedRearrangeTask {
  const rng = createRng(`umstellen:${ref.level}:${ref.seed}`)
  const templates = rearrangeTemplatesForLevel(ref.level)
  if (templates.length === 0) throw new Error(`Für Stufe ${ref.level} gibt es noch keine Umstell-Aufgaben`)
  for (;;) {
    const template = rng.pick(templates)
    const t = template.build(rng)
    if (isGood(t)) return { ref, template, task: t }
  }
}
