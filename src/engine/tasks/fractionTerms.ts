import { reduceFrac } from '../fraction/factor.ts'
import type { Frac } from '../fraction/frac.ts'
import {
  type Poly,
  atomsOf,
  polyAdd,
  polyAtom,
  polyConst,
  polyMul,
  polyScale,
  totalDegree,
} from '../fraction/poly.ts'
import {
  type BlockRule,
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
import {
  LEVEL1_KIT,
  bigReduce,
  blockPairTask,
  buildFromKit,
  buildLevel3,
  buildLevel4,
  buildLevel5Kit,
  cubeTask,
  differenceQuotient,
  level2Kit as level2Kit_,
  partialTask,
  imaginaryTask,
  limitTask,
  monomialReduce,
  rootTask,
  worldNested,
} from './fractionKit.ts'
import { rat } from '../rational.ts'
import type { Level, TaskRef } from './taskNumber.ts'

// Vorlagen für Bruchaufgaben je Stufe (siehe docs/PLAN-M2.md, „Stufen"). Jede Vorlage baut aus
// Zufallszahlen eine Aufgabe; Lösung und Rechenweg berechnet die Bruch-Engine.

export type FractionTemplate = {
  readonly id: string
  readonly level: Level
  readonly label: string
  // Anteil unter den Vorlagen der Stufe (ohne Angabe gleich oft)
  readonly weight?: number
  // fester Anteil, vorweg mit eigenem Zufall gewählt: für Vorlagen, die später dazukamen, damit die
  // übrigen Aufgaben-Nummern ihre bisherige Aufgabe behalten
  readonly share?: number
  // seltene typische Fehler, die vor allem in dieser Vorlage vorkommen (gezieltes Üben sucht hier)
  readonly focus?: readonly string[]
  build(rng: Rng): FractionTask
}

export type GeneratedFractionTask = {
  readonly ref: TaskRef
  readonly template: FractionTemplate
  readonly task: FractionTask
}

// --- kleine Bausteine ---

const c = (n: number) => polyConst(n)

const numberPart = (n: number, d = 1): Part => part(expanded(c(n)), expanded(c(d)))
const polyPart = (n: Poly, d: Poly = c(1)): Part => part(expanded(n), expanded(d))

const signed = (sign: 1 | -1, p: Part): Signed => (sign > 0 ? plus(p) : minus(p))
const anySign = (rng: Rng): 1 | -1 => (rng.chance(0.5) ? 1 : -1)
const nonZero = (rng: Rng, max: number) => (rng.chance(0.5) ? 1 : -1) * rng.int(1, max)

const shape = (s: FractionShape, hints: readonly Poly[] = [], rule?: BlockRule): FractionTask => ({ ...s, hints, ...(rule ? { rule } : {}) }) as FractionTask

// --- Stufen 1 und 2: Baukasten (M2b, tasks/fractionKit.ts) ---

const level1Kit: FractionTemplate = {
  id: 'baukasten-zahlen',
  level: 1,
  label: 'Baukasten: bis zu vier Zahlenbrüche, Punkt vor Strich, Klammern, Dezimalzahlen',
  build: (rng) => (rng.chance(0.025) ? bigReduce(rng) : buildFromKit(rng, LEVEL1_KIT, 1)),
}

const level2Kit: FractionTemplate = {
  id: 'baukasten-buchstaben',
  level: 2,
  label: 'Baukasten: Brüche mit Buchstaben in Produkten',
  build: (rng) => (rng.chance(0.06) ? monomialReduce(rng) : buildFromKit(rng, level2Kit_(rng), 2)),
}

// --- Stufen 3 und 4: Baukasten mit Summen (M2b, tasks/fractionKit.ts) ---

const level3Kit: FractionTemplate = {
  id: 'baukasten-summen',
  level: 3,
  label: 'Baukasten: Summen in Zähler und Nenner, ausklammern, binomische Formeln, vertauschte Differenzen',
  build: buildLevel3,
}

const level4Kit: FractionTemplate = {
  id: 'baukasten-zerlegen',
  level: 4,
  label: 'Baukasten: zerlegen (Zahl vorn, zwei Buchstaben, in Gruppen), drei Nenner, Doppelbrüche, Bausteine',
  build: buildLevel4,
}

// --- Stufe 5: Profi, quer durch das ganze Thema (M2b Schritt 3, tasks/fractionKit.ts) ---

const level5Kit: FractionTemplate = {
  id: 'alles-ineinander',
  level: 5,
  weight: 4,
  label: 'Alles ineinander: drei oder vier Brüche, mehrere Rechenarten, Doppelbruch im Inneren',
  build: buildLevel5Kit,
}

const level5Nested: FractionTemplate = {
  id: 'doppelbruch-im-doppelbruch',
  level: 5,
  weight: 1,
  label: 'Doppelbruch im Doppelbruch',
  build: worldNested,
}

const level5Difference: FractionTemplate = {
  id: 'differenzenquotient',
  level: 5,
  weight: 1.1,
  label: 'Differenzenquotienten $\\frac{f(x + h) - f(x)}{h}$',
  focus: ['frac-binomial-middle'],
  build: differenceQuotient,
}

const level5Cubes: FractionTemplate = {
  id: 'dritte-potenzen',
  level: 5,
  weight: 1,
  label: 'Dritte Potenzen: $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$',
  focus: ['frac-cube-as-square'],
  build: cubeTask,
}

const level5Roots: FractionTemplate = {
  id: 'wurzeln',
  level: 5,
  weight: 1.5,
  label: 'Wurzeln: kürzen, Wurzel im Nenner beseitigen, auch mit zwei Wurzeln',
  focus: ['frac-conjugate-one-side', 'frac-conjugate-sign', 'frac-conjugate-square'],
  build: rootTask,
}

// 1 − sin x, 1 + sin x (mit der 1 vorn geschrieben)
const unitLinear = (b: string, sign: 1 | -1): Poly => polyAdd(c(1), polyScale(polyAtom(b), rat(sign)))

const level5Trig: FractionTemplate = {
  id: 'winkelfunktionen',
  level: 5,
  weight: 0.7,
  label: 'Winkelfunktionen: $\\sin^2 x + \\cos^2 x = 1$',
  build(rng) {
    const b = rng.pick(['S', 'C'] as const)
    const other = b === 'S' ? 'C' : 'S'
    const B = polyAtom(b)
    const O = polyAtom(other)
    const hints = [unitLinear(b, 1), unitLinear(b, -1)]
    switch (rng.int(1, 5)) {
      case 1: {
        // \frac{1}{1 - \sin x} + \frac{1}{1 + \sin x} = \frac{2}{\cos^2 x}
        const k = rng.int(1, 3)
        return shape(
          { kind: 'sum', terms: [plus(part(expanded(c(k)), expanded(unitLinear(b, -1), true))), signed(anySign(rng), part(expanded(c(k)), expanded(unitLinear(b, 1), true)))] },
          hints,
          { kind: 'trig', prefer: other, target: 'den' },
        )
      }
      case 2:
        // \frac{\sin x}{\cos x} + \frac{\cos x}{\sin x} = \frac{1}{\sin x \cos x}
        return shape({ kind: 'sum', terms: [plus(polyPart(B, O)), plus(polyPart(O, B))] }, [], { kind: 'trig', prefer: 'S', target: 'num' })
      case 3:
        // \frac{1}{\cos^2 x} - 1 = \tan^2 x
        return shape({ kind: 'sum', terms: [plus(polyPart(c(1), polyAtom(b, 2))), minus(numberPart(1))] }, [], { kind: 'trig', prefer: other, target: 'num' })
      case 4:
        // \frac{\frac{1}{\cos x} - \cos x}{\sin x} = \tan x, auch umgekehrt \frac{\cos x - \frac{1}{\cos x}}{\sin x}
        return shape(
          { kind: 'complex', top: rng.chance(0.5) ? [plus(polyPart(c(1), B)), minus(polyPart(B))] : [plus(polyPart(B)), minus(polyPart(c(1), B))], bottom: [plus(polyPart(O))] },
          [],
          { kind: 'trig', prefer: other, target: 'num' },
        )
      default:
        if (rng.chance(0.5)) {
          // \frac{\sin^2 x}{1 - \cos x} = 1 + \cos x
          return shape({ kind: 'reduce', part: part(expanded(polyAtom(other, 2)), expanded(unitLinear(b, anySign(rng)), true)) }, hints, { kind: 'trig', prefer: b, target: 'num' })
        }
        // \frac{1 - \cos^2 x}{\sin x} = \sin x bzw. \frac{1 - \cos^2 x}{\sin x \cos x} = \tan x
        return shape(
          { kind: 'reduce', part: part(expanded(polyAdd(c(1), polyScale(polyAtom(b, 2), rat(-1))), true), expanded(rng.chance(0.5) ? O : polyMul(O, B))) },
          [],
          { kind: 'trig', prefer: other, target: 'num' },
        )
    }
  },
}

const level5Exp: FractionTemplate = {
  id: 'e-und-ln',
  level: 5,
  weight: 0.9,
  label: '$e^x$, $\\ln x$, $\\sin x$ und $\\cos x$ gemischt, $\\frac{e^{2x}}{e^x} = e^x$',
  focus: ['frac-cancel-inside'],
  build(rng) {
    if (rng.chance(0.5)) return blockPairTask(rng)
    const k = nonZero(rng, 5)
    const E = polyAtom('E')
    // \frac{e^{2x} - 3e^x}{e^x} bzw. \frac{e^{3x} + 2e^{2x}}{2e^x}
    if (rng.chance(0.5)) return shape({ kind: 'reduce', part: polyPart(polyAdd(polyAtom('E', 2), polyScale(E, rat(k))), E) })
    const m = rng.int(2, 3)
    return shape({ kind: 'reduce', part: polyPart(polyAdd(polyAtom('E', 3), polyScale(polyAtom('E', 2), rat(k))), polyScale(E, rat(m))) })
  },
}

const level5Partial: FractionTemplate = {
  id: 'partialbrueche',
  level: 5,
  share: 0.15,
  label: 'Partialbruchzerlegung, auch mit doppeltem Faktor und mit Polynomdivision vorweg',
  focus: ['frac-division-sign', 'frac-division-remainder', 'frac-partial-no-division', 'frac-partial-double-once', 'frac-partial-insert-sign', 'frac-partial-compare'],
  build: partialTask,
}

const level5Imaginary: FractionTemplate = {
  id: 'komplexe-zahlen',
  level: 5,
  share: 0.1,
  label: 'Komplexe Zahlen teilen: mit dem konjugiert Komplexen erweitern, Ergebnis $a + b\\,\\mathrm{i}$',
  focus: ['frac-imag-power', 'frac-imag-squared', 'frac-imag-cross', 'frac-imag-den', 'frac-imag-split', 'frac-imag-direct', 'frac-imag-minus'],
  build: imaginaryTask,
}

const level5Limits: FractionTemplate = {
  id: 'grenzwerte',
  level: 5,
  share: 0.1,
  label: 'Grenzwerte: $x \\to a$ mit $\\frac{0}{0}$ (zerlegen, kürzen, einsetzen) und $n \\to \\infty$ (durch die höchste Potenz teilen)',
  focus: ['frac-limit-zero-zero', 'frac-limit-insert-sign', 'frac-limit-divide-one-side', 'frac-limit-infinity-one', 'frac-limit-n-zero', 'frac-limit-degree', 'frac-limit-first-terms'],
  build: limitTask,
}

export const FRACTION_TEMPLATES: readonly FractionTemplate[] = [
  level1Kit,
  level2Kit,
  level3Kit,
  level4Kit,
  level5Kit,
  level5Nested,
  level5Difference,
  level5Cubes,
  level5Roots,
  level5Trig,
  level5Exp,
  level5Partial,
  level5Imaginary,
  level5Limits,
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

function pickWeighted(rng: Rng, templates: readonly FractionTemplate[]): FractionTemplate {
  const total = templates.reduce((sum, t) => sum + (t.weight ?? 1), 0)
  let r = rng.next() * total
  for (const t of templates) {
    r -= t.weight ?? 1
    if (r < 0) return t
  }
  return templates[templates.length - 1]
}

export const isFractionLevelAvailable = (level: Level) => fractionTemplatesForLevel(level).length > 0

const firstPick = (rng: Rng, templates: readonly FractionTemplate[]) =>
  templates.some((t) => t.weight !== undefined) ? pickWeighted(rng, templates) : rng.pick(templates)

// Vorlage mit festem Anteil (share), vorweg mit eigenem Zufall gewählt; sonst null
function sharedPick(ref: TaskRef, templates: readonly FractionTemplate[]): FractionTemplate | null {
  const rng = createRng(`brueche-anteil:${ref.level}:${ref.seed}`)
  return templates.find((t) => t.share !== undefined && rng.next() < t.share) ?? null
}

// Die Vorlage, die eine Aufgaben-Nummer zuerst wählt, ohne die Aufgabe zu bauen (schnell). Meist
// kommt die Aufgabe aus ihr; nur wenn die erste Aufgabe aussortiert wird, aus einer anderen.
export function likelyFractionTemplate(ref: TaskRef): FractionTemplate | null {
  const templates = fractionTemplatesForLevel(ref.level)
  if (templates.length === 0) return null
  return sharedPick(ref, templates) ?? firstPick(createRng(`brueche:${ref.level}:${ref.seed}`), templates.filter((t) => t.share === undefined))
}

// Erzeugt die Aufgabe zu einer Aufgaben-Nummer. Gleiche Nummer → gleiche Aufgabe.
export function generateFractionTask(ref: TaskRef): GeneratedFractionTask {
  const rng = createRng(`brueche:${ref.level}:${ref.seed}`)
  const templates = fractionTemplatesForLevel(ref.level)
  if (templates.length === 0) throw new Error(`Für Stufe ${ref.level} gibt es noch keine Bruchaufgaben`)
  const shared = sharedPick(ref, templates)
  const regular = templates.filter((t) => t.share === undefined)
  for (;;) {
    const template = shared ?? firstPick(rng, regular)
    const task = template.build(rng)
    if (isGood(task, ref.level)) return { ref, template, task }
  }
}
