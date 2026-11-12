import { equationToLatex, toLatex } from '../expr/print.ts'
import { contains, subterms } from '../expr/compare.ts'
import { type Env, evaluate } from '../expr/evaluate.ts'
import type { Expr } from '../expr/types.ts'
import { holds, samplePoints } from '../rearrange/check.ts'
import { rearrangeWrongAnswers } from '../rearrange/errorRules.ts'
import { hasNestedFraction as hasNestedResult } from '../rearrange/finished.ts'
import { type RearrangeSolution, solveTask, stepEquationLatex } from '../rearrange/isolate.ts'
import { type RearrangeTask, givenLatex, taskVariables } from '../rearrange/task.ts'
import { type Rng, createRng } from '../random/rng.ts'
import { REARRANGE_BLOCKS } from './blocks.ts'
import { latexWidthEm } from './latexWidth.ts'
import { formulaTaskAt } from './formulaTasks.ts'
import { type LogEquationKind, logEquationKind } from './logEquationKinds.ts'
import { buildLogEquation } from './logEquationTasks.ts'
import { type NumberEquationKind, numberEquationKind } from './numberEquationKinds.ts'
import { buildNumberEquation } from './numberEquationTasks.ts'
import { buildFamilyTask } from './rearrangeBlockKit.ts'
import { rearrangeTaskBlocks } from './rearrangeBlocks.ts'
import { hasRearrangeFamily } from './rearrangeFamilies.ts'
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
  buildLevel5Polar, buildLevel5Theorem,
  buildLevel5Series,
  buildLevel5Tools,
} from './rearrangeKit.ts'
import { type Level, type TaskRef, seedBlock } from './taskNumber.ts'

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
  // typische Fehler, die vor allem in dieser Vorlage vorkommen: Gezielt üben sucht sie zuerst hier
  // (rearrangeFocus.ts)
  readonly focus?: readonly string[]
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
  // gezielt üben: hier zuerst gesucht (rearrangeFocus.ts)
  focus: ['frac-distribute-first-only'],
}

// --- Stufe 3: Brüche, Wurzeln und Quadrate, Kerne ineinander (Baukasten) ---

const level3Kit: RearrangeTemplate = {
  id: 'baukasten-3',
  level: 3,
  label: 'Baukasten: Kerne ineinander, gegeneinander oder in einer Summe',
  build: (rng) => buildLevel3(rng).task,
  buildLabeled: buildLevel3,
  // gezielt üben: hier zuerst gesucht (rearrangeFocus.ts)
  focus: ['eq-reciprocal-termwise', 'eq-square-middle', 'frac-distribute-first-only'],
}

// --- Stufe 4: verschachtelt mit e-Funktion, Logarithmus, Wurzeln in Wurzeln (Baukasten, Teil 6a) ---

const level4Kit: RearrangeTemplate = {
  id: 'baukasten-4',
  level: 4,
  label: 'Baukasten: e-Funktion, Logarithmus, Wurzeln in Wurzeln, Potenz- und Logarithmusgesetze',
  build: (rng) => buildLevel4(rng).task,
  buildLabeled: buildLevel4,
  // gezielt üben: hier zuerst gesucht (rearrangeFocus.ts)
  focus: ['eq-nested-root', 'eq-power-sum', 'eq-log-product', 'eq-log-sum', 'eq-log-quotient'],
}

// Teil 6b: Winkel- und Hyperbelfunktionen, Umkehrfunktionen
const level4Trig: RearrangeTemplate = {
  id: 'baukasten-4-winkel',
  level: 4,
  label: 'Baukasten: Winkel- und Hyperbelfunktionen, Umkehrfunktionen',
  build: (rng) => buildLevel4Trig(rng).task,
  buildLabeled: buildLevel4Trig,
  share: 0.35,
  // gezielt üben: hier zuerst gesucht (rearrangeFocus.ts)
  focus: ['eq-inverse-forgotten', 'eq-inverse-reciprocal', 'eq-divide-inside-arc', 'eq-pythagoras-square', 'eq-hyperbolic-sign', 'eq-tan-flipped', 'eq-divide-cos-partly'],
}

// Teil 6c: Substitution und pq-Formel; der Anteil gilt unter den Nummern, die nicht schon zu 6b gehören
const level4Quadratic: RearrangeTemplate = {
  id: 'baukasten-4-quadratisch',
  level: 4,
  label: 'Baukasten: Substitution und pq-Formel',
  build: (rng) => buildLevel4Quadratic(rng).task,
  buildLabeled: buildLevel4Quadratic,
  share: 0.4,
  // gezielt üben: hier zuerst gesucht (rearrangeFocus.ts)
  focus: ['eq-substitute-power', 'eq-substitute-reciprocal', 'eq-pq-sign', 'eq-pq-q-sign', 'eq-pq-half', 'eq-spurious-root', 'eq-not-resubstituted'],
}

// --- Stufe 5: quer durch die Mathematik, erst das Werkzeug ausrechnen (Teil 7a: Ableitungen, Integrale) ---

const level5Tools: RearrangeTemplate = {
  id: 'baukasten-5-analysis',
  level: 5,
  label: 'Baukasten: Ableitungen und Integrale',
  build: (rng) => buildLevel5Tools(rng).task,
  buildLabeled: buildLevel5Tools,
  // gezielt üben: hier zuerst gesucht (rearrangeFocus.ts)
  focus: ['eq-partial-factor', 'eq-int-inner-factor', 'eq-int-derived', 'eq-int-power', 'eq-int-sign', 'eq-int-bounds-swapped', 'eq-int-lower-forgotten'],
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
  // gezielt üben: hier zuerst gesucht (rearrangeFocus.ts)
  focus: ['eq-sum-count', 'eq-series-start', 'eq-series-sign', 'eq-series-not-geometric', 'eq-lim-one', 'eq-lim-exponent', 'eq-lim-denominator'],
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
  // gezielt üben: hier zuerst gesucht (rearrangeFocus.ts)
  focus: ['eq-ode-initial-unused', 'eq-ode-not-halved', 'eq-ode-inner-factor', 'eq-ode-oscillation', 'eq-ode-root', 'eq-ode-constant-added', 'eq-ode-exp-sign', 'eq-ode-constant-start', 'eq-substitute-reciprocal'],
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
  // gezielt üben: hier zuerst gesucht (rearrangeFocus.ts)
  focus: ['eq-det-plus', 'eq-det-swapped', 'eq-det-rows', 'eq-det-main', 'eq-det-checkerboard', 'eq-det-entry'],
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
  // gezielt üben: hier zuerst gesucht (rearrangeFocus.ts)
  focus: ['eq-abs-termwise', 'eq-abs-root', 'eq-abs-imag-squared', 'eq-arg-power', 'eq-arg-swapped', 'eq-arg-arctan-forgotten', 'eq-arg-quotient-sign', 'eq-vec-not-divided', 'eq-vec-one-length', 'eq-vec-sine', 'eq-vec-dot-sign', 'eq-vec-dot-cross', 'eq-vec-length-termwise', 'eq-vec-length-root', 'eq-root-termwise'],
}

// Teil 8c: Additionstheoreme; der Anteil gilt unter den Nummern, die zu keiner späteren Vorlage gehören (also zu 7a)
const level5Theorem: RearrangeTemplate = {
  id: 'baukasten-5-additionstheoreme',
  level: 5,
  label: 'Baukasten: Additionstheoreme',
  build: (rng) => buildLevel5Theorem(rng).task,
  buildLabeled: buildLevel5Theorem,
  share: 0.35,
  novel: true,
  narrow: true,
  // gezielt üben: hier zuerst gesucht (rearrangeFocus.ts)
  focus: ['eq-add-termwise', 'eq-add-sign', 'eq-add-partner', 'eq-double-factor', 'eq-double-two', 'eq-double-cos-plus', 'eq-double-cos-sign', 'eq-inverse-forgotten', 'eq-inverse-reciprocal', 'eq-tan-flipped', 'eq-divide-cos-partly'],
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
  level5Theorem,
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
// und Additionstheoreme (8c)
const WIDE_TOOLS = new Set(['det', 'abs', 'arg', 'length', 'dot', 'angle', 'theorem'])
const hasDet = (t: RearrangeTask) =>
  [t.equation.lhs, t.equation.rhs].flatMap((side) => subterms(side)).some((s) => s.kind === 'var' && s.tool !== undefined && WIDE_TOOLS.has(s.tool.kind))
// Additionstheoreme (8c): Ausgeschrieben werden die Gleichungen lang (vier Produkte wie \sin x \cdot \cos a). Jede
// Gleichung des Rechenwegs und jede falsche Antwort muss am Handy in eine Zeile passen; am Browser gemessen passen
// in den Antworten etwa 23 em, 20 em sicher
const MAX_THEOREM_STEP_WIDTH = 21
const hasTheorem = (t: RearrangeTask) =>
  [t.equation.lhs, t.equation.rhs].flatMap((side) => subterms(side)).some((s) => s.kind === 'var' && s.tool?.kind === 'theorem')

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
  // Logarithmen auf beiden Seiten (M6 Schritt 4b-2) nur in ihrer eigenen Sammlung (die älteren Vorlagen behalten ihre Aufgaben)
  if (solution.logPath) return false
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
  if (points.length < 8 || !points.every((p) => holds(t.equation, p) === true)) return false
  // mit Additionstheorem: kein Schritt und keine falsche Antwort zu breit fürs Handy; kein Minus, das sich
  // herausziehen ließe, direkt unter der Wurzel oder in der Klammer (\sqrt{-\frac{a}{y - 2a + b}})
  if (level === 5 && hasTheorem(t)) {
    if (/\\sqrt\{-|\\left\(-/.test(toLatex(solution.result))) return false
    // nicht nur winzige x (sonst ist \sin x fast x, und falsche Antworten stimmen an vielen Prüfstellen)
    if (!points.some((p) => p[t.target] > 0.2)) return false
    const wide = (latex: string) => latexWidthEm(latex) > MAX_THEOREM_STEP_WIDTH
    if (solution.steps.some((s) => wide(stepEquationLatex(s.kind, s.after)))) return false
    if (rearrangeWrongAnswers(t, solution).some((w) => wide(equationToLatex(w.after)))) return false
  }
  return true
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

// Vorlage, die eine Nummer sehr wahrscheinlich nimmt, ohne die Aufgabe zu bauen (schnell): die mit festem Anteil
// oder die erste Wahl unter den übrigen. Passt deren Aufgabe nicht, wählt generateRearrangeTask neu.
export function likelyRearrangeTemplate(ref: TaskRef): RearrangeTemplate | null {
  const own = seedBlock(ref.seed)
  if (own?.block === 'formel' && formulaTaskAt(ref.level, own.s)) return FORMULA_TEMPLATE
  if (own?.block === 'logeq' && logEquationKind(ref.level, own.s)) return LOG_EQUATION_TEMPLATE
  if (own?.block === 'zahlen' && numberEquationKind(ref.level, own.s)) return NUMBER_EQUATION_TEMPLATE
  if (own) return hasRearrangeFamily(own.block, ref.level) ? familyTemplate(own.block, ref.level) : likelyRearrangeTemplate({ level: ref.level, seed: own.s })
  const templates = rearrangeTemplatesForLevel(ref.level)
  if (templates.length === 0) return null
  const regular = templates.filter((t) => t.share === undefined)
  return sharedPick(ref, templates) ?? createRng(`umstellen:${ref.level}:${ref.seed}`).pick(regular)
}

// --- Aufgaben eines einzelnen Bausteins (M6 Schritt 4, rearrangeBlockKit.ts), Nummern wie „exp.1-4711" ---

// Mindestzahl der Umformungen je Stufe (Stufe 1: z. B. e^{2x} = y → \ln, durch 2)
const FAMILY_MIN_STEPS: Record<Level, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
// lineare Gleichungen brauchen auch tief geschachtelt nur wenige Umformungen (ausmultiplizieren, sortieren, teilen)
const LINEAR_MIN_STEPS: Record<Level, number> = { 1: 2, 2: 3, 3: 3, 4: 4, 5: 5 }

// Vorlage je Baustein und Stufe (für Galerie und Beschreibung)
const familyTemplates = new Map<string, RearrangeTemplate>()
export function familyTemplate(block: string, level: Level): RearrangeTemplate {
  const key = `${block}:${level}`
  let template = familyTemplates.get(key)
  if (!template) {
    const title = REARRANGE_BLOCKS.find((b) => b.id === block)?.title ?? block
    template = {
      id: `baustein-${block}-${level}`,
      level,
      label: `Baustein ${title}`,
      build: (rng) => buildFamilyTask(rng, block, level).task,
      buildLabeled: (rng) => buildFamilyTask(rng, block, level),
      novel: true,
      narrow: true,
    }
    familyTemplates.set(key, template)
  }
  return template
}

// Brauchbar wie im Baukasten, dazu: genau dieser Baustein, Ergebnis in einer Zeile am Handy, in Stufe 1 die Variable
// einmal (außer bei quadratischen Gleichungen)
// Breiteste Aufgabe eines einzelnen Bausteins in em (latexWidth.ts): Am Handy passen etwa 12 em in eine Zeile, die Aufgabe
// darf bis auf 70 % kleiner werden (FitWidth in TaskParts.tsx)
const MAX_FAMILY_TASK_WIDTH = 16

function isGoodFamily(t: RearrangeTask, level: Level, block: string): boolean {
  const letters = taskVariables(t).length
  const latex = equationToLatex(t.equation)
  if (latex.length > MAX_TASK_LATEX || letters > 7 || letters < 2 || latexWidthEm(latex) > MAX_FAMILY_TASK_WIDTH) return false
  if (level === 1 && block !== 'quadratisch' && occurrences(t).count !== 1) return false
  if (level <= 2 && hasNestedFraction(t)) return false
  const solution = solveTask(t)
  if (!solution || contains(solution.result, t.target) || solution.logPath) return false
  if (solution.steps.length < (block === 'linear' ? LINEAR_MIN_STEPS : FAMILY_MIN_STEPS)[level]) return false
  if (toLatex(solution.result).length > MAX_RESULT_LATEX[level] || !fitsOneLine(solution.result)) return false
  const blocks = rearrangeTaskBlocks(t, solution)
  if (blocks.length !== 1 || blocks[0] !== block) return false
  if (level === 5 && subterms(solution.result).some((s) => s.kind === 'root' && s.arg.kind === 'add' && subterms(s.arg).some((p) => p.kind === 'div'))) return false
  return robust(t, solution)
}

// Gegenprobe an viel mehr Stellen als im Baukasten (achtmal 16 mit eigenem Zufall): genug erlaubte Stellen und keine, an
// der die Rechnung numerisch kippt (z. B. \ln x + a fast 0 in einem Logarithmus)
function robust(t: RearrangeTask, solution: RearrangeSolution): boolean {
  const sums = [t.equation.lhs, t.equation.rhs].flatMap((side) => subterms(side)).filter((e) => e.kind === 'add' && contains(e, t.target))
  for (let i = 1; i <= 8; i++) {
    const seed = i === 1 ? 'brauchbar' : `brauchbar-${i}`
    const points = samplePoints(t, solution.result, createRng(seed), 16, solution.requires)
    if (points.length < 16 || !points.every((p) => holds(t.equation, p) === true && !cancels(sums, p))) return false
  }
  return true
}

// Logarithmen auf beiden Seiten (M6 Schritt 4b-2): wie bei einem Baustein, aber mit den Bausteinen der Art und nur über
// die neuen Wege der Engine (sonst wäre es eine Aufgabe, die es schon gibt)
function isGoodLogEquation(t: RearrangeTask, level: Level, kind: LogEquationKind): boolean {
  const letters = taskVariables(t).length
  const latex = equationToLatex(t.equation)
  if (latex.length > MAX_TASK_LATEX || letters > 7 || letters < 2 || latexWidthEm(latex) > MAX_FAMILY_TASK_WIDTH) return false
  const solution = solveTask(t)
  if (!solution || contains(solution.result, t.target) || !solution.logPath) return false
  if (solution.steps.length < FAMILY_MIN_STEPS[level]) return false
  if (toLatex(solution.result).length > MAX_RESULT_LATEX[level] || !fitsOneLine(solution.result)) return false
  const blocks = rearrangeTaskBlocks(t, solution)
  if (blocks.length !== kind.blocks.length || !kind.blocks.every((b) => blocks.includes(b))) return false
  return robust(t, solution)
}

// Nummern wie „logeq.2-4711": Art vorab fest (logEquationKinds.ts), dann so lange gewürfelt, bis die Aufgabe taugt
function generateLogEquationTask(ref: TaskRef, kind: LogEquationKind, s: number): GeneratedRearrangeTask {
  const rng = createRng(`umstellen-logeq:${ref.level}:${s}`)
  for (let i = 0; i < FAMILY_ATTEMPTS; i++) {
    const kit = buildLogEquation(rng, kind)
    if (isGoodLogEquation(kit.task, ref.level, kind)) return { ref, template: LOG_EQUATION_TEMPLATE, task: kit.task, label: `Logarithmen: ${kit.label}` }
  }
  throw new Error(`Keine Aufgabe für logeq.${ref.level}-${s}`)
}

const LOG_EQUATION_TEMPLATE: RearrangeTemplate = {
  id: 'logarithmen',
  level: 1,
  label: 'Logarithmen auf beiden Seiten',
  build: () => {
    throw new Error('Logarithmus-Aufgaben haben eigene Nummern (logEquationTasks.ts)')
  },
}

// Gleichungen mit Zahlen (M6 Schritt 4b-3): Bausteine der Art, Lösung wie gewollt (eine Zahl oder keine Lösung), die Zahl
// eine ganze Zahl oder ein einfacher Bruch, Logarithmus als \ln einer ganzen Zahl, nicht zu breit; nie zwei Lösungen (dann
// liefert die Engine keinen Weg)
const MIN_NUMBER_STEPS: Record<Level, number> = { 1: 2, 2: 5, 3: 5, 4: 6, 5: 6 }
function isGoodNumberEquation(t: RearrangeTask, level: Level, kind: NumberEquationKind, none: boolean): boolean {
  const latex = equationToLatex(t.equation)
  if (taskVariables(t).length !== 1 || latex.length > MAX_TASK_LATEX || latexWidthEm(latex) > MAX_FAMILY_TASK_WIDTH) return false
  const solution = solveTask(t)
  if (!solution || (solution.none === true) !== none || solution.steps.length < MIN_NUMBER_STEPS[level]) return false
  // nach der pq-Formel bzw. der Probe soll auch etwas wegfallen (Scheinlösung, Definitionsbereich oder u < 0)
  if (kind.blocks.includes('quadratisch') && !solution.steps.some((s) => s.reason !== undefined)) return false
  // Normalform ohne Brüche (sonst rechnet die pq-Formel mit Neunteln)
  if (solution.steps.some((s) => s.kind === 'normalize' && subterms(s.after.lhs).some((x) => x.kind === 'div'))) return false
  if (!none) {
    const value = solution.result
    const plain = value.kind === 'num' || (value.kind === 'neg' && value.arg.kind === 'num') || (value.kind === 'div' && value.num.kind === 'num' && value.den.kind === 'num')
    const ln = value.kind === 'fn' && value.name === 'ln' && value.arg.kind === 'num'
    const x = evaluate(value, {})
    if (!(plain || ln) || !Number.isFinite(x) || Math.abs(x) > 60 || toLatex(value).length > 14) return false
    if (holds(t.equation, { [t.target]: x }) !== true) return false
  }
  const blocks = rearrangeTaskBlocks(t, solution)
  return blocks.length === kind.blocks.length && kind.blocks.every((b) => blocks.includes(b))
}

// Nummern wie „zahlen.2-4711": Art vorab fest (numberEquationKinds.ts), dann so lange gewürfelt, bis die Aufgabe taugt
function generateNumberEquationTask(ref: TaskRef, kind: NumberEquationKind, s: number): GeneratedRearrangeTask {
  const rng = createRng(`umstellen-zahlen:${ref.level}:${s}`)
  for (let i = 0; i < FAMILY_ATTEMPTS; i++) {
    const kit = buildNumberEquation(rng, kind)
    if (kit && isGoodNumberEquation(kit.task, ref.level, kind, kit.none)) return { ref, template: NUMBER_EQUATION_TEMPLATE, task: kit.task, label: `Zahlen: ${kit.label}` }
  }
  throw new Error(`Keine Aufgabe für zahlen.${ref.level}-${s}`)
}

const NUMBER_EQUATION_TEMPLATE: RearrangeTemplate = {
  id: 'zahlen',
  level: 1,
  label: 'Gleichungen mit Zahlen',
  build: () => {
    throw new Error('Gleichungen mit Zahlen haben eigene Nummern (numberEquationTasks.ts)')
  },
}

// Hebt sich an der Stelle eine Summe mit der Variable fast auf (\ln(4x) + 2a nahe 0)? Dann kippt die Gegenprobe dort
// durch Rundung, auch wenn die Lösung stimmt; solche Aufgaben haben empfindliche Bereiche und werden nicht genommen.
const CANCEL_LIMIT = 1e5
function cancels(sums: readonly Expr[], env: Env): boolean {
  return sums.some((sum) => {
    if (sum.kind !== 'add') return false
    const size = sum.terms.reduce((total, term) => total + Math.abs(evaluate(term, env)), 0)
    const value = Math.abs(evaluate(sum, env))
    return Number.isFinite(size) && size > 0 && value * CANCEL_LIMIT < size
  })
}

// Formeln aus Technik und Physik (M6 Schritt 4b, formulas.ts): feste Aufgaben, Nummern wie „formel.2-1"
const FORMULA_TEMPLATE: RearrangeTemplate = {
  id: 'formeln',
  level: 1,
  label: 'Formel aus Technik und Physik',
  build: () => {
    throw new Error('Formel-Aufgaben haben feste Nummern (formulaTasks.ts)')
  },
}

// Höchstens so viele Versuche je Nummer (die Baukästen treffen meist nach wenigen)
const FAMILY_ATTEMPTS = 3000

function generateFamilyTask(ref: TaskRef, block: string, s: number): GeneratedRearrangeTask {
  const rng = createRng(`umstellen-baustein:${block}:${ref.level}:${s}`)
  // Art der Aufgabe vorab fest, danach nur innerhalb dieser Art neu gewürfelt
  const variant = createRng(`umstellen-baustein-art:${block}:${ref.level}:${s}`).next()
  const template = familyTemplate(block, ref.level)
  for (let i = 0; i < FAMILY_ATTEMPTS; i++) {
    const kit = buildFamilyTask(rng, block, ref.level, variant)
    if (isGoodFamily(kit.task, ref.level, block)) return { ref, template, task: kit.task, label: kit.label }
  }
  throw new Error(`Keine Aufgabe für ${block}.${ref.level}-${s}`)
}

// Erzeugt die Aufgabe zu einer Aufgaben-Nummer. Gleiche Nummer → gleiche Aufgabe. Nummern mit Baustein („exp.1-4711")
// bauen eine Aufgabe nur dieses Bausteins; hat er in der Stufe keine eigenen Aufgaben, die alte Nummer ohne Baustein.
export function generateRearrangeTask(ref: TaskRef): GeneratedRearrangeTask {
  const own = seedBlock(ref.seed)
  if (own) {
    if (own.block === 'formel') {
      const found = formulaTaskAt(ref.level, own.s)
      if (found) return { ref, template: FORMULA_TEMPLATE, task: found.task, label: `Formel: ${found.task.context ?? ''}` }
      return { ...generateRearrangeTask({ level: ref.level, seed: own.s }), ref }
    }
    if (own.block === 'logeq') {
      const kind = logEquationKind(ref.level, own.s)
      if (kind) return generateLogEquationTask(ref, kind, own.s)
      return { ...generateRearrangeTask({ level: ref.level, seed: own.s }), ref }
    }
    if (own.block === 'zahlen') {
      const kind = numberEquationKind(ref.level, own.s)
      if (kind) return generateNumberEquationTask(ref, kind, own.s)
      return { ...generateRearrangeTask({ level: ref.level, seed: own.s }), ref }
    }
    if (hasRearrangeFamily(own.block, ref.level)) return generateFamilyTask(ref, own.block, own.s)
    return { ...generateRearrangeTask({ level: ref.level, seed: own.s }), ref }
  }
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
