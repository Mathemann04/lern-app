import { equationToLatex, toLatex } from '../expr/print.ts'
import { contains, subterms } from '../expr/compare.ts'
import type { Expr } from '../expr/types.ts'
import { holds, samplePoints } from '../rearrange/check.ts'
import { hasNestedFraction as hasNestedResult } from '../rearrange/finished.ts'
import { solveTask } from '../rearrange/isolate.ts'
import { type RearrangeTask, givenLatex, taskVariables } from '../rearrange/task.ts'
import { type Rng, createRng } from '../random/rng.ts'
import { latexWidthEm } from './latexWidth.ts'
import {
  type KitTask,
  buildLevel1,
  buildLevel2,
  buildLevel3,
  buildLevel4,
  buildLevel4Quadratic,
  buildLevel4Trig,
  buildLevel5Det,
  buildLevel5Ode,
  buildLevel5Polar,
  buildLevel5Series,
  buildLevel5Tools,
} from './rearrangeKit.ts'
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
  // später dazugekommene Vorlage: fester Anteil, vorweg mit eigenem Zufall gewählt, damit die
  // übrigen Nummern ihre Aufgabe behalten (wie bei den Brüchen)
  readonly share?: number
  // darf Wege der Engine nutzen, die erst seit Teil 7b dazugekommen sind (ältere Vorlagen nicht, damit ihre
  // Nummern dieselbe Aufgabe behalten)
  readonly novel?: boolean
  // das Ergebnis muss am Handy in eine Zeile passen (Teil 7c: nach der pq-Formel stehen sonst lange
  // Wurzeln da); ältere Vorlagen ohne diese Prüfung behalten ihre Aufgaben
  readonly narrow?: boolean
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

// --- Stufe 4: verschachtelt mit e-Funktion, Logarithmus, Wurzeln in Wurzeln (Baukasten, Teil 6a) ---

const level4Kit: RearrangeTemplate = {
  id: 'baukasten-4',
  level: 4,
  label: 'Baukasten: e-Funktion, Logarithmus, Wurzeln in Wurzeln, Potenz- und Logarithmusgesetze',
  build: (rng) => buildLevel4(rng).task,
  buildLabeled: buildLevel4,
}

// Teil 6b: Winkel- und Hyperbelfunktionen, Umkehrfunktionen
const level4Trig: RearrangeTemplate = {
  id: 'baukasten-4-winkel',
  level: 4,
  label: 'Baukasten: Winkel- und Hyperbelfunktionen, Umkehrfunktionen',
  build: (rng) => buildLevel4Trig(rng).task,
  buildLabeled: buildLevel4Trig,
  share: 0.35,
}

// Teil 6c: Substitution und pq-Formel; der Anteil gilt unter den Nummern, die nicht schon zu 6b gehören
const level4Quadratic: RearrangeTemplate = {
  id: 'baukasten-4-quadratisch',
  level: 4,
  label: 'Baukasten: Substitution und pq-Formel',
  build: (rng) => buildLevel4Quadratic(rng).task,
  buildLabeled: buildLevel4Quadratic,
  share: 0.4,
}

// --- Stufe 5: quer durch die Mathematik, erst das Werkzeug ausrechnen (Teil 7a: Ableitungen, Integrale) ---

const level5Tools: RearrangeTemplate = {
  id: 'baukasten-5-analysis',
  level: 5,
  label: 'Baukasten: Ableitungen und Integrale',
  build: (rng) => buildLevel5Tools(rng).task,
  buildLabeled: buildLevel5Tools,
}

// Teil 7b: Summen, Reihen und Grenzwerte, mit festem Anteil (die übrigen Nummern behalten ihre Aufgabe)
const level5Series: RearrangeTemplate = {
  id: 'baukasten-5-reihen',
  level: 5,
  label: 'Baukasten: Summen, Reihen und Grenzwerte',
  build: (rng) => buildLevel5Series(rng).task,
  buildLabeled: buildLevel5Series,
  share: 0.4,
  novel: true,
}

// Teil 7c: Differentialgleichungen; der Anteil gilt unter den Nummern, die nicht schon zu 7b gehören
const level5Ode: RearrangeTemplate = {
  id: 'baukasten-5-dgl',
  level: 5,
  label: 'Baukasten: Differentialgleichungen',
  build: (rng) => buildLevel5Ode(rng).task,
  buildLabeled: buildLevel5Ode,
  share: 0.3,
  novel: true,
  narrow: true,
}

// Teil 8a: Determinanten; der Anteil gilt unter den Nummern, die weder zu 7b noch zu 7c gehören
const level5Det: RearrangeTemplate = {
  id: 'baukasten-5-determinante',
  level: 5,
  label: 'Baukasten: Determinanten',
  build: (rng) => buildLevel5Det(rng).task,
  buildLabeled: buildLevel5Det,
  share: 0.25,
  novel: true,
  narrow: true,
}

// Teil 8b: Betrag und Winkel komplexer Zahlen, Vektoren; der Anteil gilt unter den Nummern, die zu keiner
// späteren Vorlage gehören (also zu 7a)
const level5Polar: RearrangeTemplate = {
  id: 'baukasten-5-betrag-winkel',
  level: 5,
  label: 'Baukasten: Betrag und Winkel',
  build: (rng) => buildLevel5Polar(rng).task,
  buildLabeled: buildLevel5Polar,
  share: 0.3,
  novel: true,
  narrow: true,
}

export const REARRANGE_TEMPLATES: readonly RearrangeTemplate[] = [
  level1Kit,
  level2Kit,
  level3Kit,
  level4Kit,
  level4Trig,
  level4Quadratic,
  level5Tools,
  level5Series,
  level5Ode,
  level5Det,
  level5Polar,
]

export function rearrangeTemplatesForLevel(level: Level): RearrangeTemplate[] {
  return REARRANGE_TEMPLATES.filter((t) => t.level === level)
}

export const isRearrangeLevelAvailable = (level: Level) => rearrangeTemplatesForLevel(level).length > 0

// Längste Aufgabe (LaTeX), damit sie am Handy lesbar bleibt; in Stufe 5 ohne die Schreibweise der
// Werkzeuge gezählt (\mathrm{d}, \left, \right), Summen- und Grenzwertzeichen so breit wie drei Zeichen
// (ihre Grenzen stehen klein darüber und darunter)
const MAX_TASK_LATEX = 64
const MAX_TOOL_TASK = 64
// Zeile einer Differentialgleichung mit Anfangswerten
const MAX_ODE_LATEX = 64
const visibleLatex = (latex: string) =>
  latex
    .replace(/\\mathrm\{d\}/g, 'd')
    .replace(/\\left|\\right|\\,/g, '')
    .replace(/\\sum_\{[^}]*\}\^\{[^}]*\}/g, 'Sum')
    .replace(/\\lim_\{[^}]*\}/g, 'lim')

// Mit Determinante: Breite in em geschätzt (latexWidth.ts), denn eine Matrix ist nur so breit wie ihre
// breiteste Zeile; 12 em passen in der Aufgabe (text-2xl) am Handy in eine Zeile
const MAX_DET_WIDTH = 12
// Ergebnis mit Determinante: Im Kasten am Handy (318 Pixel, kleinste Schrift) passen etwa 17,7 em
const MAX_DET_RESULT_WIDTH = 16.5
// Werkzeuge, deren Breite geschätzt wird: Determinante (8a), Betrag, Winkel und Vektoren (8b)
const WIDE_TOOLS = new Set(['det', 'abs', 'arg', 'length', 'dot', 'angle'])
const hasDet = (t: RearrangeTask) =>
  [t.equation.lhs, t.equation.rhs].flatMap((side) => subterms(side)).some((s) => s.kind === 'var' && s.tool !== undefined && WIDE_TOOLS.has(s.tool.kind))

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
function isGood(t: RearrangeTask, level: Level, kit: boolean, novel = false, narrow = false): boolean {
  if (kit) {
    const letters = taskVariables(t).length
    const latex = equationToLatex(t.equation)
    const width = level === 5 && hasDet(t) ? latexWidthEm(latex) > MAX_DET_WIDTH : visibleLatex(latex).length > MAX_TOOL_TASK
    const long = level === 5 ? width || givenLatex(t).some((g) => g.length > MAX_ODE_LATEX) : latex.length > MAX_TASK_LATEX
    if (long || letters > 7 || letters < 2) return false
    const { count, inDenominator } = occurrences(t)
    if (level === 1 && count !== 1) return false
    if (level === 2 && count < 2 && !inDenominator) return false
    // Doppelbrüche erst ab Stufe 3
    if (level <= 2 && hasNestedFraction(t)) return false
  }
  const solution = solveTask(t)
  if (!solution || contains(solution.result, t.target)) return false
  // Wege der Engine ab Teil 7b nur in Vorlagen ab 7b (die älteren behalten ihre Aufgaben)
  if (solution.novel && !novel) return false
  if (kit && solution.steps.length < MIN_STEPS[level]) return false
  if (toLatex(solution.result).length > MAX_RESULT_LATEX[level]) return false
  if (narrow && !fitsOneLine(solution.result)) return false
  // mit Determinante: Ergebnis am Handy in einer Zeile, ohne Doppelbruch (auch in der Hochzahl, wie im
  // freien Modus)
  if (level === 5 && hasDet(t)) {
    if (latexWidthEm(`${t.target} = ${toLatex(solution.result)}`) > MAX_DET_RESULT_WIDTH || hasNestedResult(solution.result)) return false
  }
  // Stufe 5: Buchstaben im Ergebnis (sie heben sich nicht alle weg)
  if (level === 5 && taskVariables({ ...t, equation: { lhs: solution.result, rhs: solution.result } }).length === 0) return false
  // Stufe 5: keine Wurzel aus einer Summe mit Brüchen im Ergebnis (\sqrt{\frac{k^2}{4} + \frac{k}{b - c}})
  if (level === 5 && subterms(solution.result).some((s) => s.kind === 'root' && s.arg.kind === 'add' && subterms(s.arg).some((p) => p.kind === 'div'))) return false
  const points = samplePoints(t, solution.result, createRng('brauchbar'), 8, solution.requires)
  // Gegenprobe: Die Lösung erfüllt die Aufgabe an allen Prüfstellen
  return points.length >= 8 && points.every((p) => holds(t.equation, p) === true)
}

// Ergebnis, das am Handy (390 Pixel breit, kleinste Schrift) in eine Zeile passt: höchstens 90 Zeichen
// LaTeX, keine Wurzel aus mehr als drei Summanden (gemessen an den Ergebnissen der Stufe 5)
const fitsOneLine = (result: Expr) =>
  toLatex(result).length <= 90 && !subterms(result).some((s) => s.kind === 'root' && s.arg.kind === 'add' && s.arg.terms.length > 3)

// Mindestzahl der Umformungen je Stufe im Baukasten
const MIN_STEPS: Record<Level, number> = { 1: 3, 2: 3, 3: 5, 4: 6, 5: 6 }

// Längstes Ergebnis (LaTeX) je Stufe
const MAX_RESULT_LATEX: Record<Level, number> = { 1: 90, 2: 90, 3: 90, 4: 120, 5: 100 }

// Vorlage mit festem Anteil (share), vorweg mit eigenem Zufall gewählt; sonst null. Bei mehreren
// Vorlagen gilt der Anteil einer späteren unter den Nummern, die keine frühere genommen hat.
function sharedPick(ref: TaskRef, templates: readonly RearrangeTemplate[]): RearrangeTemplate | null {
  const rng = createRng(`umstellen-anteil:${ref.level}:${ref.seed}`)
  return templates.find((t) => t.share !== undefined && rng.next() < t.share) ?? null
}

// Erzeugt die Aufgabe zu einer Aufgaben-Nummer. Gleiche Nummer → gleiche Aufgabe.
export function generateRearrangeTask(ref: TaskRef): GeneratedRearrangeTask {
  const rng = createRng(`umstellen:${ref.level}:${ref.seed}`)
  const templates = rearrangeTemplatesForLevel(ref.level)
  if (templates.length === 0) throw new Error(`Für Stufe ${ref.level} gibt es noch keine Umstell-Aufgaben`)
  const shared = sharedPick(ref, templates)
  const regular = templates.filter((t) => t.share === undefined)
  for (;;) {
    const template = shared ?? rng.pick(regular)
    const kit = template.buildLabeled?.(rng)
    const t = kit ? kit.task : template.build(rng)
    if (isGood(t, ref.level, kit !== undefined, template.novel, template.narrow)) return { ref, template, task: t, label: kit?.label ?? template.label }
  }
}
