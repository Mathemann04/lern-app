import type { ExamPart, ExamTask } from '../../exam/types.ts'
import { type Rng, createRng } from '../../random/rng.ts'
import { lewisFigure } from '../lewis.ts'
import { MOLECULES, type Molecule, vseprOf } from '../molecules.ts'
import { dopeTask, hybridTask } from '../generators/metalle.ts'
import { MOLECULE_STEPS } from '../generators/molekuele.ts'
import { EXAM_SALTS, type Salt, formulaStep, ionsStep, pickSalt } from '../generators/salze.ts'
import { ionCe, saltFormula, saltIndices } from '../ions.ts'
import { UNCLEAR, ZMK_STEPS, boilTask } from '../generators/zmk.ts'
import { ZMK_SUBSTANCES } from '../zmk.ts'
import { type ExtraOption, withExtraOptions } from './extraOptions.ts'
import { fromStep } from './fromStep.ts'
import { knowledgeItem } from './knowledge.ts'

// „Klausuraufgabe 3 üben" (Plan M4, S5e; Bauplan Teil 1, Aufgabe 3 mit 12 Punkten): Bindungen.
// a) Ionen und Formel eines Salzes (2), b) Lewis-Formel, Paare, Gestalt (3), c) Polarität (1),
// d) zwischenmolekulare Kräfte: stärkste Kraft oder eine Wissensfrage, Siedepunkte dreier Stoffe ordnen (2),
// e) Halbleiter (2), f) Hybridisierung (2).
// Die Fragen kommen aus den Rechnungen der Themen (generators/*), mit denselben falschen Antworten und Rechenfehlern;
// wo eine Rechnung weniger als vier Antworten liefert, kommen sinnvolle weitere dazu (extraOptions.ts). Die Teile hängen
// nicht voneinander ab; Folgefehler gibt es deshalb hier nicht, jede Frage zählt für sich (Lewis-Formel, Paare und
// Gestalt je 1 Punkt wie in der Klausur). Salzformel und Lewis-Formel schreibt man in der Klausur selbst: Ihre
// Antworten erscheinen erst nach dem Lösen auf Papier (paperFirst). Stoffe der Altklausuren (Aluminiumoxid,
// Magnesiumchlorid; Ammoniak, Wasser in Teil b) kommen nicht vor.

export const TASK3_POINTS = 12

// Moleküle der Altklausuren für „Lewis-Formel, Paare, Gestalt"
const EXAM_MOLECULES = ['NH3', 'H2O']

const ce = (text: string) => String.raw`\ce{${text}}`

// Wissensfragen zu zwischenmolekularen Kräften (Sammlung „Zwischenmolekulare Kräfte") für Teil d, statt der stärksten
// Kraft eines Stoffs (Anteil ZMK_QUESTION_SHARE)
const ZMK = 'chem-zmk'
export const ZMK_QUESTIONS = [102, 104, 106, 107, 302]
export const ZMK_QUESTION_SHARE = 1 / 3

const IONS_WHY: ExtraOption['why'] = {
  detailed:
    'Metalle geben ihre Valenzelektronen ab und werden zu Kationen; Nichtmetalle nehmen Elektronen bis zum Oktett auf und werden zu Anionen. Eine römische Ziffer im Namen gibt die Ladung des Kations an, Molekül-Ionen haben eine feste Ladung. Jede Ladung hängt nur am eigenen Ion, nicht am Partner.',
  short: 'Jede Ladung folgt aus dem eigenen Ion.',
}

// weitere Paare von Ionen: Ladungen vertauscht, Vorzeichen vertauscht, andere Ladung des Kations oder des Molekül-Ions
function ionExtras(s: Salt): ExtraOption[] {
  const pair = (qc: number, qa: number) => `$${ce(ionCe(s.cation, qc))}$ und $${ce(ionCe(s.anion, qa))}$`
  const qc = s.cation.charge
  const qa = s.anion.charge
  const pairs = [
    pair(-qa, -qc),
    pair(-qc, -qa),
    ...(s.anion.polyatomic ? [-1, -2, -3].filter((x) => x !== qa).map((x) => pair(qc, x)) : []),
    pair(qc + 1, qa),
    ...(qc > 1 ? [pair(qc - 1, qa)] : []),
  ]
  return pairs.map((content) => ({ content, why: IONS_WHY }))
}

const FORMULA_WHY: ExtraOption['why'] = {
  detailed: 'Ein Salz ist nach außen neutral: Die positiven und negativen Ladungen müssen sich genau aufheben, mit den kleinsten ganzen Zahlen.',
  short: 'Die Ladungen müssen sich aufheben.',
}

// weitere Formeln mit einem Ion zu viel (nie neutral)
function formulaExtras(s: Salt): ExtraOption[] {
  const { cation: x, anion: y } = saltIndices(s.cation, s.anion)
  return [
    { cation: x + 1, anion: y },
    { cation: x, anion: y + 1 },
  ].map((counts) => ({ content: `$${ce(saltFormula(s.cation, s.anion, counts))}$`, why: FORMULA_WHY }))
}

function saltPart(rng: Rng): ExamPart | null {
  const s = pickSalt(2, rng)
  if (!s || EXAM_SALTS.includes(saltFormula(s.cation, s.anion))) return null
  const ions = ionsStep(s, rng)
  const formula = formulaStep(s, rng)
  if (!ions || !formula) return null
  return {
    id: 'a',
    prompt: `Ein Metall reagiert mit einem Nichtmetall zu einem ionisch aufgebauten Salz. ${formula.question.replace(/^Wie lautet die Formel von /, 'Es handelt sich um ').replace(/\?$/, '.')}`,
    points: 2,
    items: [
      { ...withExtraOptions(fromStep(ions, 'ionen', 'Ionen', 1), ionExtras(s), rng), paperFirst: true },
      { ...withExtraOptions(fromStep(formula, 'formel', 'Formel', 1), formulaExtras(s), rng), paperFirst: true },
    ],
  }
}

// Molekül mit Zentralatom, Lewis-Formel mit mindestens zwei falschen Formeln, Gestalt mit falschen Antworten
function pickMolecule(rng: Rng): Molecule | null {
  const pool = MOLECULES.filter((m) => m.central !== undefined && !m.expanded && !m.sextet && m.level <= 2 && !EXAM_MOLECULES.includes(m.id) && vseprOf(m).x + vseprOf(m).e <= 4)
  const mol = rng.pick(pool)
  return lewisFigure(mol) ? mol : null
}

function moleculePart(mol: Molecule, rng: Rng): ExamPart | null {
  const lewis = MOLECULE_STEPS.lewisChoiceStep(mol, rng)
  const split = MOLECULE_STEPS.splitStep(mol, rng)
  const shape = MOLECULE_STEPS.shapeStep(mol, rng)
  if (!lewis || !split || !shape) return null
  return {
    id: 'b',
    prompt: `Betrachte das Molekül $${ce(mol.id)}$${mol.name ? ` (${mol.name})` : ''}.`,
    points: 3,
    items: [
      { ...fromStep(lewis, 'lewis', 'Lewis-Formel', 1, false, 'Welche Lewis-Formel ist richtig?'), paperFirst: true },
      fromStep(split, 'paare', 'Paare am Zentralatom', 1, false, `Wie viele bindende und wie viele freie Elektronenpaare hat das Zentralatom $${ce(mol.atoms[mol.central!].el)}$?`),
      fromStep(shape, 'gestalt', 'Gestalt', 1, false, 'Welche Gestalt hat das Molekül?'),
    ],
  }
}

function polarityPart(mol: Molecule, rng: Rng): ExamPart | null {
  // ein Molekül, dessen Polarität gefragt werden darf (CHEMIE.md §6), möglichst das aus Teil b
  const target = mol.dipole !== null ? mol : rng.pick(MOLECULES.filter((m) => m.dipole !== null && m.level <= 2 && m.atoms.length > 2))
  const step = MOLECULE_STEPS.dipoleStep(target, rng)
  if (!step) return null
  return { id: 'c', prompt: 'Polarität.', points: 1, items: [fromStep(step, 'dipol', 'Polares Molekül', 1)] }
}

const BOIL_WHY: ExtraOption['why'] = {
  detailed:
    'Zuerst die Art der stärksten Kraft vergleichen: Wasserstoffbrücken sind stärker als Dipol-Dipol-Kräfte, diese stärker als Van-der-Waals-Kräfte. Bei gleicher Art siedet der Stoff mit den größeren Molekülen höher.',
  short: 'Erst die Art der Kraft, dann die Größe der Moleküle.',
}

// Siedepunkte dreier Stoffe ordnen (wie in der Klausur; zwei Stoffe hätten nur zwei Reihenfolgen); weitere Reihenfolgen
// zuerst mit zwei benachbarten Stoffen vertauscht
function boilItem(seed: string, rng: Rng) {
  for (let i = 0; i < 40; i++) {
    const boil = boilTask(2, createRng(`${seed}:sieden:${i}`), { level: 2, seed: 10000 })
    if (!boil) continue
    const order = boil.task.steps[0]
    const right = order.choices.find((c) => c.correct)!.content.split(' < ')
    if (right.length !== 3) continue
    const [a, b, c] = right
    const others = [
      [b, a, c],
      [a, c, b],
      [c, a, b],
      [b, c, a],
    ].map((list) => ({ content: list.join(' < '), why: BOIL_WHY }))
    const substances = boil.task.note!.replace(/^Stoffe: /, '').replace(/\. Molmassen: .*$/, '').replace(/\.$/, '')
    return withExtraOptions(fromStep(order, 'sieden', 'Siedepunkte', 1, false, `Ordne nach steigendem Siedepunkt: ${substances}.`), others, rng)
  }
  return null
}

function forcesPart(seed: string, rng: Rng): ExamPart | null {
  const boil = boilItem(seed, rng)
  if (!boil) return null
  if (rng.chance(ZMK_QUESTION_SHARE)) {
    return { id: 'd', prompt: 'Zwischenmolekulare Kräfte und Siedepunkte.', points: 2, items: [knowledgeItem(ZMK, rng.pick(ZMK_QUESTIONS), 'kraefte', 1, rng), boil] }
  }
  const x = rng.pick(ZMK_SUBSTANCES.filter((s) => s.level <= 2 && !UNCLEAR.has(s.id) && s.id.length > 2))
  const force = ZMK_STEPS.forceStep(x, rng)
  if (!force) return null
  return { id: 'd', prompt: 'Zwischenmolekulare Kräfte und Siedepunkte.', points: 2, items: [fromStep(force, 'kraft', 'Stärkste Art der Kraft', 1), boil] }
}

function semiconductorPart(seed: string): ExamPart | null {
  const calc = dopeTask(2, createRng(`${seed}:dotierung`), { level: 2, seed: 10000 })
  if (!calc) return null
  const [valence, type] = calc.task.steps
  return {
    id: 'e',
    prompt: calc.task.note!,
    points: 2,
    items: [fromStep(valence, 'valenz', 'Valenzelektronen', 1), fromStep(type, 'typ', 'Art der Dotierung', 1)],
  }
}

function hybridPart(seed: string, exclude: string): ExamPart | null {
  for (let i = 0; i < 20; i++) {
    const calc = hybridTask(2, createRng(`${seed}:hybrid:${i}`), { level: 2, seed: 10000 })
    if (!calc || calc.substance.startsWith(`${exclude}:`)) continue
    const [domains, hybrid] = calc.task.steps
    return {
      id: 'f',
      prompt: calc.task.note!,
      points: 2,
      items: [fromStep(domains, 'richtungen', 'Richtungen', 1), fromStep(hybrid, 'hybrid', 'Hybridisierung', 1)],
    }
  }
  return null
}

export function buildTask3(seed: number): ExamTask {
  for (let attempt = 0; attempt < 50; attempt++) {
    const key = `aufgabe3:${seed}:${attempt}`
    const rng = createRng(key)
    const a = saltPart(rng)
    const mol = pickMolecule(rng)
    if (!a || !mol) continue
    const b = moleculePart(mol, rng)
    const c = polarityPart(mol, rng)
    const d = forcesPart(key, rng)
    const e = semiconductorPart(key)
    const f = hybridPart(key, mol.id)
    if (!b || !c || !d || !e || !f) continue
    return {
      title: 'Aufgabe 3: Chemische Bindung',
      intro: 'Beantworte die Fragen zu Ionen, Molekülen, zwischenmolekularen Kräften, Halbleitern und Hybridisierung.',
      givenLatex: '',
      note: 'Bei jeder Frage ist genau eine Antwort richtig.',
      parts: [a, b, c, d, e, f],
    }
  }
  throw new Error(`Keine Klausuraufgabe 3 zu Nummer ${seed}`)
}
