import { toLatex } from '../expr/print.ts'
import { type Expr, add, div, eq, mul, num, pow, sqrt, sub, variable } from '../expr/types.ts'
import { contains, subterms } from '../expr/compare.ts'
import { samplePoints } from '../rearrange/check.ts'
import { solveEquation } from '../rearrange/isolate.ts'
import { type Condition, type RearrangeTask, taskLatex, taskVariables } from '../rearrange/task.ts'
import { type Rng, createRng } from '../random/rng.ts'
import { type KitTask, buildLevel1, buildLevel2 } from './rearrangeKit.ts'
import type { Level, TaskRef } from './taskNumber.ts'

// Vorlagen für Umstell-Aufgaben je Stufe (siehe docs/PLAN-M3.md, „Stufen"). Jede Vorlage baut aus
// Zufallszahlen eine Gleichung; Rechenweg und Lösung berechnet die Umstell-Engine. Die Stufen 1 und
// 2 kommen aus dem Baukasten (rearrangeKit.ts, Kern und Schalen).

export type RearrangeTemplate = {
  readonly id: string
  readonly level: Level
  readonly label: string
  build(rng: Rng): RearrangeTask
  // Baukasten: Aufgabe mit eigener Beschreibung (Art des Kerns, Zahl der Schalen)
  buildLabeled?(rng: Rng): KitTask
}

export type GeneratedRearrangeTask = {
  readonly ref: TaskRef
  readonly template: RearrangeTemplate
  readonly task: RearrangeTask
  // Beschreibung für die Galerie
  readonly label: string
}

// --- kleine Bausteine ---

const [a, b, c, d, x, y] = ['a', 'b', 'c', 'd', 'x', 'y'].map(variable)
const n = (k: number) => num(k)
const sign = (rng: Rng): 1 | -1 => (rng.chance(0.5) ? 1 : -1)
// e ± f
const pm = (e: Expr, f: Expr, s: 1 | -1) => (s > 0 ? add(e, f) : sub(e, f))
// k · e, bei k = 1 nur e
const times = (k: number, e: Expr) => (k === 1 ? e : mul(n(k), e))
const sq = (e: Expr) => pow(e, n(2))

const task = (lhs: Expr, rhs: Expr, target = 'x', conditions: Condition[] = []): RearrangeTask => ({ equation: eq(lhs, rhs), target, conditions })

// --- Stufen 1 und 2: aus dem Baukasten (rearrangeKit.ts) ---

const level1Kit: RearrangeTemplate = {
  id: 'baukasten-1',
  level: 1,
  label: 'Baukasten: Variable einmal, Schalen drumherum',
  build: (rng) => buildLevel1(rng).task,
  buildLabeled: buildLevel1,
}

const level2Kit: RearrangeTemplate = {
  id: 'baukasten-2',
  level: 2,
  label: 'Baukasten: Variable mehrfach oder im Nenner',
  build: (rng) => buildLevel2(rng).task,
  buildLabeled: buildLevel2,
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
  level1Kit,
  level2Kit,
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

// Längste Aufgabe (LaTeX), damit sie am Handy lesbar bleibt
const MAX_TASK_LATEX = 64

// Wie oft kommt die gesuchte Variable vor, und steht sie in einem Nenner?
function occurrences(t: RearrangeTask): { count: number; inDenominator: boolean } {
  const count = [t.equation.lhs, t.equation.rhs].flatMap((side) => subterms(side)).filter((s) => s.kind === 'var' && s.name === t.target).length
  const inDenominator = [t.equation.lhs, t.equation.rhs].flatMap((side) => subterms(side)).some((s) => s.kind === 'div' && contains(s.den, t.target))
  return { count, inDenominator }
}

// Brauchbar: lösbar, das Ergebnis ohne die gesuchte Variable, an genug erlaubten Stellen
// prüfbar, nicht zu lang; im Baukasten außerdem nicht zu leicht, höchstens sieben Buchstaben
function isGood(t: RearrangeTask, level: Level, kit: boolean): boolean {
  if (kit) {
    const letters = taskVariables(t).length
    if (taskLatex(t).length > MAX_TASK_LATEX || letters > 7 || letters < 2) return false
    const { count, inDenominator } = occurrences(t)
    if (level === 1 && count !== 1) return false
    if (level === 2 && count < 2 && !inDenominator) return false
  }
  const solution = solveEquation(t.equation, t.target)
  if (!solution || contains(solution.result, t.target)) return false
  if (kit && solution.steps.length < 3) return false
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
    const kit = template.buildLabeled?.(rng)
    const t = kit ? kit.task : template.build(rng)
    if (isGood(t, ref.level, kit !== undefined)) return { ref, template, task: t, label: kit?.label ?? template.label }
  }
}
