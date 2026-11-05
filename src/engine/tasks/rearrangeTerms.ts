import { toLatex } from '../expr/print.ts'
import { contains, subterms } from '../expr/compare.ts'
import { holds, samplePoints } from '../rearrange/check.ts'
import { solveEquation } from '../rearrange/isolate.ts'
import { type RearrangeTask, taskLatex, taskVariables } from '../rearrange/task.ts'
import { type Rng, createRng } from '../random/rng.ts'
import { type KitTask, buildLevel1, buildLevel2, buildLevel3 } from './rearrangeKit.ts'
import type { Level, TaskRef } from './taskNumber.ts'

// Vorlagen für Umstell-Aufgaben je Stufe (siehe docs/PLAN-M3.md, „Stufen"). Jede Vorlage baut aus
// Zufallszahlen eine Gleichung; Rechenweg und Lösung berechnet die Umstell-Engine. Die Stufen 1 bis
// 3 kommen aus dem Baukasten (rearrangeKit.ts, Kern und Schalen, ab Stufe 3 Kerne ineinander).

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

// --- Stufe 3: Brüche, Wurzeln und Quadrate, Kerne ineinander (Baukasten) ---

const level3Kit: RearrangeTemplate = {
  id: 'baukasten-3',
  level: 3,
  label: 'Baukasten: Kerne ineinander, gegeneinander oder in einer Summe',
  build: (rng) => buildLevel3(rng).task,
  buildLabeled: buildLevel3,
}

export const REARRANGE_TEMPLATES: readonly RearrangeTemplate[] = [level1Kit, level2Kit, level3Kit]

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

const hasNestedFraction = (t: RearrangeTask) =>
  [t.equation.lhs, t.equation.rhs].flatMap((side) => subterms(side)).some((s) => s.kind === 'div' && [s.num, s.den].some((p) => subterms(p).some((q) => q.kind === 'div')))

// Brauchbar: lösbar, das Ergebnis ohne die gesuchte Variable, an genug erlaubten Stellen
// prüfbar, nicht zu lang; im Baukasten außerdem nicht zu leicht, höchstens sieben Buchstaben
function isGood(t: RearrangeTask, level: Level, kit: boolean): boolean {
  if (kit) {
    const letters = taskVariables(t).length
    if (taskLatex(t).length > MAX_TASK_LATEX || letters > 7 || letters < 2) return false
    const { count, inDenominator } = occurrences(t)
    if (level === 1 && count !== 1) return false
    if (level === 2 && count < 2 && !inDenominator) return false
    // Doppelbrüche erst ab Stufe 3
    if (level <= 2 && hasNestedFraction(t)) return false
  }
  const solution = solveEquation(t.equation, t.target)
  if (!solution || contains(solution.result, t.target)) return false
  if (kit && solution.steps.length < MIN_STEPS[level]) return false
  if (toLatex(solution.result).length > 90) return false
  const points = samplePoints(t, solution.result, createRng('brauchbar'), 8, solution.requires)
  // Gegenprobe: Die Lösung erfüllt die Aufgabe an allen Prüfstellen
  return points.length >= 8 && points.every((p) => holds(t.equation, p) === true)
}

// Mindestzahl der Umformungen je Stufe im Baukasten
const MIN_STEPS: Record<Level, number> = { 1: 3, 2: 3, 3: 5, 4: 5, 5: 5 }

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
