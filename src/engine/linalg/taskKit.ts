import type { Choice, GuidedStep, GuidedTaskBase } from '../guided/types.ts'
import type { Explanation } from '../explain/texts.ts'
import type { Rng } from '../random/rng.ts'
import { isZero, ratAdd, ratSign } from '../rational.ts'
import { vectorErrorRule } from './errorRules.ts'
import { type VectorDrawing, emptyDrawing } from './figures.ts'
import { type Vec, arrowName, vec, vecAdd, vecLatex, vecNumbers, vecSub } from './vec.ts'

// Gemeinsame Teile der Vektor-Baukästen (M7): Typen, Schritt mit Auswahl, Zufallszahlen, Buchstaben, Bilder-Hilfen und
// der Verbindungsvektor. Genutzt von vectorTasks.ts (Rechnen und Länge), dotTasks.ts (Skalarprodukt und Winkel), projTasks.ts
// (Projektion und Zerlegung), forceTasks.ts (Kräfte), crossTasks.ts (Kreuzprodukt und Fläche), spatTasks.ts (Spatprodukt und Volumen) und basisTasks.ts
// (Linearkombination und Basis).

export type VectorKind =
  | 'connect'
  | 'combo'
  | 'length'
  | 'distance'
  | 'midpoint'
  | 'unit'
  | 'givenLength'
  | 'parallelogram'
  | 'equation'
  | 'paramLength'
  | 'paramDistance'
  // Skalarprodukt und Winkel (M7 Schritt 2, dotTasks.ts)
  | 'dot'
  | 'classify'
  | 'perp'
  | 'angle'
  | 'triangleAngle'
  | 'lengthAngle'
  | 'classifyParam'
  | 'rightParam'
  // Pfeil ziehen (M7 Schritt 2b, dragTasks.ts)
  | 'drag'
  // Projektion und Zerlegung (M7 Schritt 3a, projTasks.ts)
  | 'projection'
  | 'decompose'
  | 'shadowLength'
  | 'foot'
  | 'projParam'
  | 'spanProjection'
  // Kräfte (M7 Schritt 3b, forceTasks.ts)
  | 'forceComponents'
  | 'forcePolar'
  | 'resultant'
  | 'incline'
  | 'work'
  | 'torque'
  | 'knot'
  // Kreuzprodukt und Fläche (M7 Schritt 4a, crossTasks.ts)
  | 'cross'
  | 'crossArea'
  | 'crossNormal'
  | 'crossDistance'
  | 'crossParallel'
  | 'crossAreaParam'
  // Spatprodukt und Volumen (M7 Schritt 4b, spatTasks.ts)
  | 'spat'
  | 'spatVolume'
  | 'spatCoplanar'
  | 'spatHeight'
  | 'spatCoplanarParam'
  | 'spatVolumeParam'
  // Linearkombination und Basis (M7 Schritt 5, basisTasks.ts)
  | 'basisComb'
  | 'basisSpan'
  | 'basisIndep'
  | 'basisDim'
  | 'basisCoords'
  | 'basisSpanParam'
  | 'basisParam'
  // Geraden und Ebenen (M7 Schritt 6, lineTasks.ts und planeTasks.ts)
  | 'lineThrough'
  | 'linePoint'
  | 'lineContains'
  | 'lineTrace'
  | 'lineDistance'
  | 'planeContains'
  | 'planeCoord'
  | 'planeParam'
  | 'planeHesse'
  | 'planeTraces'
  // Lage (M7 Schritt 7a, posTasks.ts)
  | 'posLines'
  | 'meetLines'
  | 'posLinePlane'
  | 'meetLinePlane'
  | 'posPlanes'
  | 'meetPlanes'

export type VectorTask = GuidedTaskBase & {
  readonly kind: VectorKind
  // Form ohne Zahlen (Abwechslung, engine/tasks/variety.ts)
  readonly form: string
  // Zahlenwerte zur Gegenprobe in Tests: das Ergebnis als Zahlen (Vektor, Punkt, Länge oder Lösungen)
  readonly answer: readonly number[]
  // gegebene Größen als Zahlen, für die unabhängige Gegenprobe in Tests (je Art eigene Namen)
  readonly data: Readonly<Record<string, readonly number[]>>
  // Zieh-Aufgabe ohne eindeutiges Ergebnis: Im freien Modus wird gezogen und die Stelle geprüft (vectorFree.ts)
  readonly dragOnly?: true
}

// Lernkarten des Bausteins (vectorCards.ts)
export const CARD = {
  rechnen: 'vec-rechnen',
  verbindung: 'vec-verbindung',
  laenge: 'vec-laenge',
  mittelpunkt: 'vec-mittelpunkt',
  einheit: 'vec-einheit',
  parallelogramm: 'vec-parallelogramm',
  gleichung: 'vec-gleichung',
  parameter: 'vec-parameter',
  // Skalarprodukt und Winkel (M7 Schritt 2)
  skalar: 'vec-skalar',
  senkrecht: 'vec-senkrecht',
  winkel: 'vec-winkel',
  betragWinkel: 'vec-betrag-winkel',
  // Projektion und Zerlegung (M7 Schritt 3a)
  projektion: 'vec-projektion',
  zerlegung: 'vec-zerlegung',
  lot: 'vec-lot',
  // Kräfte (M7 Schritt 3b)
  kraft: 'vec-kraft',
  resultierende: 'vec-resultierende',
  schiefeEbene: 'vec-schiefe-ebene',
  arbeit: 'vec-arbeit',
  drehmoment: 'vec-drehmoment',
  // Kreuzprodukt und Fläche (M7 Schritt 4a)
  kreuz: 'vec-kreuz',
  flaeche: 'vec-flaeche',
  normale: 'vec-normale',
  abstandKreuz: 'vec-abstand-kreuz',
  // Spatprodukt und Volumen (M7 Schritt 4b)
  spat: 'vec-spat',
  volumen: 'vec-volumen',
  hoeheSpat: 'vec-hoehe-spat',
  // Linearkombination und Basis (M7 Schritt 5)
  linearkombination: 'vec-linearkombination',
  unabhaengig: 'vec-unabhaengig',
  basis: 'vec-basis',
} as const

// ------------------------------------------------------------------ Hilfen

export type Wrong = { readonly content: string; readonly rule: string; readonly why?: Explanation; readonly drawing?: VectorDrawing }

export type StepSpec = {
  readonly id: string
  readonly title: string
  readonly question: string
  // richtige Antwort (Text mit Formeln)
  readonly correct: string
  readonly correctDrawing?: VectorDrawing
  readonly wrongs: readonly Wrong[]
  readonly hint: string
  readonly explanation: Explanation
  readonly established?: readonly string[]
  readonly cards: readonly string[]
  readonly drawing?: VectorDrawing
}

export const math = (latex: string) => `$${latex}$`

// Ein Schritt mit Auswahl: falsche Antworten ohne Doppelte und ohne solche, die wie die richtige aussehen; höchstens drei
export function choiceStep(rng: Rng, s: StepSpec): GuidedStep {
  const seen = new Set([s.correct])
  const wrongs: Wrong[] = []
  for (const w of s.wrongs) {
    if (seen.has(w.content) || wrongs.length >= 3) continue
    seen.add(w.content)
    wrongs.push(w)
  }
  const choices: Choice[] = [
    { id: 'richtig', content: s.correct, correct: true, ...(s.correctDrawing ? { drawing: s.correctDrawing } : {}) },
    ...wrongs.map((w, i) => ({
      id: `falsch-${i + 1}`,
      content: w.content,
      correct: false,
      errorRuleId: w.rule,
      whyWrong: w.why ?? vectorErrorRule(w.rule).why,
      ...(w.drawing ? { drawing: w.drawing } : {}),
    })),
  ]
  return {
    id: s.id,
    title: s.title,
    question: s.question,
    choices: rng.shuffle(choices),
    hint: s.hint,
    explanation: s.explanation,
    ...(s.established ? { established: s.established } : {}),
    cards: s.cards,
    ...(s.drawing ? { drawing: s.drawing } : {}),
  }
}

export const ints = (rng: Rng, dim: number, lo: number, hi: number, nonzero = false): Vec =>
  vec(
    ...Array.from({ length: dim }, () => {
      let v = rng.int(lo, hi)
      while (nonzero && v === 0) v = rng.int(lo, hi)
      return v
    }),
  )

export const negCount = (v: Vec) => v.filter((x) => ratSign(x) < 0).length
export const zeroCount = (v: Vec) => v.filter((x) => isZero(x)).length
export const dimOf = (v: Vec) => v.length

// Muster der Vorzeichen für die Form: wie viele negative Einträge (0, 1, mehr) und ob eine Null dabei ist
export const signShape = (...vs: Vec[]) => vs.map((v) => `${negCount(v)}${zeroCount(v) > 0 ? 'z' : ''}`).join(',')

// Vektoren mit ganzzahliger Länge: Einträge (Beträge) und Länge
export const LENGTH_POOLS: Readonly<Record<number, readonly (readonly number[])[]>> = {
  2: [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]],
  3: [
    [1, 2, 2, 3],
    [2, 3, 6, 7],
    [1, 4, 8, 9],
    [2, 4, 4, 6],
    [2, 6, 9, 11],
    [6, 6, 7, 11],
    [3, 4, 12, 13],
    [2, 10, 11, 15],
    [4, 4, 7, 9],
    [2, 5, 14, 15],
    [3, 6, 6, 9],
  ],
  4: [[1, 2, 2, 4, 5], [2, 2, 4, 5, 7], [1, 3, 3, 9, 10], [2, 4, 5, 6, 9], [1, 1, 3, 5, 6], [1, 1, 7, 7, 10]],
  5: [[1, 1, 1, 2, 3, 4], [1, 1, 3, 3, 4, 6], [1, 2, 3, 5, 5, 8], [1, 1, 2, 3, 7, 8], [2, 2, 3, 4, 4, 7]],
}

// Vektor mit ganzzahliger Länge in dim Dimensionen: Einträge gemischt, Vorzeichen zufällig (mindestens eins negativ)
export function pythagorean(rng: Rng, dim: number): { readonly v: Vec; readonly length: number } {
  const row = rng.pick(LENGTH_POOLS[dim])
  const entries = rng.shuffle(row.slice(0, dim)).map((x) => (rng.chance(0.45) ? -x : x))
  if (!entries.some((x) => x < 0)) {
    const i = rng.int(0, dim - 1)
    entries[i] = -entries[i]
  }
  return { v: vec(...entries), length: row[dim] }
}

export const VEC_LETTERS = [
  ['a', 'b', 'c'],
  ['u', 'v', 'w'],
  ['p', 'q', 'r'],
] as const
export const POINT_LETTERS = [
  ['A', 'B'],
  ['P', 'Q'],
  ['R', 'S'],
] as const
export const PARAMS = ['t', 's', '\\lambda'] as const

// ------------------------------------------------------------------ Bilder

export const nums = vecNumbers
export const origin = (dim: number) => Array.from({ length: dim }, () => 0)
export const drawable = (dim: number): dim is 2 | 3 => dim === 2 || dim === 3

export function pointsDrawing(dim: 2 | 3, pts: readonly { name: string; at: Vec }[], caption: string, ghosts = true): VectorDrawing {
  const base = emptyDrawing(dim, caption)
  return {
    ...base,
    points: pts.map((p) => ({ at: nums(p.at), label: p.name })),
    arrows: ghosts ? pts.map((p) => ({ from: origin(dim), to: nums(p.at), color: 'muted' as const, ghost: true })) : [],
  }
}

// ------------------------------------------------------------------ Bausteine der Rechnung (je ein Schritt)

// Verbindungsvektor PQ = Q − P mit falschen Antworten
export function connectStep(rng: Rng, P: string, Q: string, p: Vec, q: Vec, drawing?: VectorDrawing): GuidedStep {
  const d = vecSub(q, p)
  const slip = p.findIndex((x) => ratSign(x) < 0)
  const wrongs: Wrong[] = [
    { content: math(vecLatex(vecSub(p, q))), rule: 'vec-reversed' },
    { content: math(vecLatex(vecAdd(p, q))), rule: 'vec-added-points' },
  ]
  if (slip >= 0) wrongs.push({ content: math(vecLatex(d.map((x, i) => (i === slip ? ratAdd(q[i], p[i]) : x)))), rule: 'vec-sign-slip' })
  const name = arrowName(P, Q)
  return choiceStep(rng, {
    id: 'verbindung',
    title: 'Verbindungsvektor',
    question: `Wie lautet ${math(name)}?`,
    correct: math(vecLatex(d)),
    wrongs,
    hint: `Spitze minus Fuß: Ortsvektor von $${Q}$ minus Ortsvektor von $${P}$, Eintrag für Eintrag.`,
    explanation: {
      detailed: `Der Pfeil beginnt beim Fuß $${P}$ und endet bei der Spitze $${Q}$. Deshalb rechnest du $${name} = ${vecLatex(q)} - ${vecLatex(p)}$, Eintrag für Eintrag.`,
      short: `$${name} = ${Q} - ${P}$: Spitze minus Fuß.`,
    },
    established: [`${name} = ${vecLatex(q)} - ${vecLatex(p)} = ${vecLatex(d)}`],
    cards: [CARD.verbindung],
    ...(drawing ? { drawing } : {}),
  })
}

export type Built = Omit<VectorTask, 'ref'>

export function letters(rng: Rng) {
  const i = rng.int(0, 2)
  return { vecs: VEC_LETTERS[i], points: POINT_LETTERS[rng.int(0, 2)], key: i }
}
