import type { ExamPart, ExamTask } from '../../exam/types.ts'
import { type Rng, createRng } from '../../random/rng.ts'
import { lewisFigure } from '../lewis.ts'
import { MOLECULES, type Molecule, vseprOf } from '../molecules.ts'
import { dopeTask, hybridTask } from '../generators/metalle.ts'
import { MOLECULE_STEPS } from '../generators/molekuele.ts'
import { EXAM_SALTS, formulaStep, ionsStep, pickSalt } from '../generators/salze.ts'
import { saltFormula } from '../ions.ts'
import { UNCLEAR, ZMK_STEPS, boilTask } from '../generators/zmk.ts'
import { ZMK_SUBSTANCES } from '../zmk.ts'
import { fromStep } from './fromStep.ts'

// „Klausuraufgabe 3 üben" (Plan M4, S5e; Bauplan Teil 1, Aufgabe 3 mit 12 Punkten): Bindungen.
// a) Ionen und Formel eines Salzes (2), b) Lewis-Formel, Paare, Gestalt (3), c) Polarität (1),
// d) zwischenmolekulare Kräfte (2), e) Halbleiter (2), f) Hybridisierung (2).
// Die Fragen kommen aus den Rechnungen der Themen (generators/*), mit denselben falschen Antworten und Rechenfehlern.
// Die Teile hängen nicht voneinander ab; Folgefehler gibt es deshalb hier nicht. Stoffe der Altklausuren
// (Aluminiumoxid, Magnesiumchlorid; Ammoniak, Wasser in Teil b) kommen nicht vor.

export const TASK3_POINTS = 12

// Moleküle der Altklausuren für „Lewis-Formel, Paare, Gestalt"
const EXAM_MOLECULES = ['NH3', 'H2O']

const ce = (text: string) => String.raw`\ce{${text}}`

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
    items: [fromStep(ions, 'ionen', 'Ionen', 1), fromStep(formula, 'formel', 'Formel', 1, true)],
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
      fromStep(lewis, 'lewis', 'Lewis-Formel', 1, false, 'Welche Lewis-Formel ist richtig?'),
      fromStep(split, 'paare', 'Paare', 1, false, 'Wie viele bindende und freie Elektronenpaare hat das Molekül?'),
      fromStep(shape, 'gestalt', 'Gestalt', 1, true, 'Welche Gestalt hat das Molekül?'),
    ],
  }
}

function polarityPart(mol: Molecule, rng: Rng): ExamPart | null {
  // ein Molekül, dessen Polarität gefragt werden darf (CHEMIE.md §6), möglichst das aus Teil b
  const target = mol.dipole !== null ? mol : rng.pick(MOLECULES.filter((m) => m.dipole !== null && m.level <= 2 && m.atoms.length > 2))
  const step = MOLECULE_STEPS.dipoleStep(target, rng)
  if (!step) return null
  return { id: 'c', prompt: 'Polarität.', points: 1, items: [fromStep(step, 'dipol', 'Polares Molekül', 1, true)] }
}

function forcesPart(seed: string, rng: Rng): ExamPart | null {
  const x = rng.pick(ZMK_SUBSTANCES.filter((s) => s.level <= 2 && !UNCLEAR.has(s.id) && s.id.length > 2))
  const force = ZMK_STEPS.forceStep(x, rng)
  const boil = boilTask(2, createRng(`${seed}:sieden`), { level: 2, seed: 10000 })
  if (!force || !boil) return null
  const order = boil.task.steps[0]
  const substances = boil.task.note!.replace(/^Stoffe: /, '').replace(/\. Molmassen: .*$/, '').replace(/\.$/, '')
  return {
    id: 'd',
    prompt: 'Zwischenmolekulare Kräfte und Siedepunkte.',
    points: 2,
    items: [fromStep(force, 'kraft', 'Stärkste Kraft', 1), fromStep(order, 'sieden', 'Siedepunkte', 1, false, `Ordne nach steigendem Siedepunkt: ${substances}.`)],
  }
}

function semiconductorPart(seed: string): ExamPart | null {
  const calc = dopeTask(2, createRng(`${seed}:dotierung`), { level: 2, seed: 10000 })
  if (!calc) return null
  const [valence, type] = calc.task.steps
  return {
    id: 'e',
    prompt: calc.task.note!,
    points: 2,
    items: [fromStep(valence, 'valenz', 'Valenzelektronen', 1), fromStep(type, 'typ', 'Art der Dotierung', 1, true)],
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
      items: [fromStep(domains, 'richtungen', 'Richtungen', 1), fromStep(hybrid, 'hybrid', 'Hybridisierung', 1, true)],
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
