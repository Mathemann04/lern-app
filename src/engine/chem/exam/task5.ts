import type { ExamItem, ExamOption, ExamPart, ExamTask } from '../../exam/types.ts'
import { type Rational, ratSign } from '../../rational.ts'
import { type Rng, createRng } from '../../random/rng.ts'
import { EQUILIBRIA, equilibriumById, equilibriumCe } from '../equilibria.ts'
import { dhTask, gibbsTask, rangeTask } from '../generators/energie.ts'
import { dHLatex, expressionStep, leChatelierTask } from '../generators/mwg.ts'
import { thermoReactionById } from '../thermo.ts'
import { fromStep } from './fromStep.ts'
import { knowledgeItem } from './knowledge.ts'

// „Klausuraufgabe 5 üben" (Plan M4, S7c; Bauplan Teil 1, Aufgabe 5 mit 10 Punkten): Gleichgewicht und Energie.
// a) Gleichgewicht und Katalysator: zwei Wissensfragen (2), b) Massenwirkungsgesetz (2), c) Le Chatelier (1),
// d) Reaktionsenthalpie aus Bildungsenthalpien (Summe der Produkte 1, ΔH 2), e) freiwillig oder nicht (ΔG und Urteil je 1,
// oder der Temperaturbereich 2). Die Fragen kommen aus den Wissensfragen und Rechnungen der Themen „Chemisches Gleichgewicht"
// und „Energie bei Reaktionen", mit denselben falschen Antworten, Denk- und Rechenfehlern. Le Chatelier (c) ist eine Rechnung
// oder eine Wissensfrage. Die Teile hängen nicht voneinander ab. Innerhalb eines Teils: ΔH folgt aus der Summe der
// Produkte (d, Ergebnis des Teils), das Urteil „freiwillig?" aus dem eigenen ΔG (e, Folgefehler zählen nicht doppelt).
// Das Massenwirkungsgesetz schreibt man in der Klausur selbst: Seine Antworten erscheinen erst nach dem Lösen auf Papier.

export const TASK5_POINTS = 10

const MWG = 'chem-mwg'

// Fragen je Teil a (Nummern der Sammlung „Chemisches Gleichgewicht"): dynamisches Gleichgewicht und Katalysator
export const EQUILIBRIUM_QUESTIONS = [102, 103, 104, 201, 202, 301]
export const CATALYST_QUESTIONS = [113, 114, 115, 218, 318]
// Teil c als Wissensfrage zu Le Chatelier (Temperatur, Ausbeute), Anteil LE_CHATELIER_QUESTION_SHARE
export const LE_CHATELIER_QUESTIONS = [215, 310, 312]
export const LE_CHATELIER_QUESTION_SHARE = 1 / 3

const questionItem = (no: number, id: string, rng: Rng): ExamItem => knowledgeItem(MWG, no, id, 1, rng)

const ref = { level: 2 as const, seed: 10000 }

function mwgPart(rng: Rng): ExamPart | null {
  const e = rng.pick(EQUILIBRIA)
  const step = expressionStep(e, rng)
  if (!step) return null
  return {
    id: 'b',
    prompt: `Gleichgewicht: $${equilibriumCe(e)}$${e.process ? ` (${e.process})` : ''}.`,
    points: 2,
    items: [{ ...fromStep(step, 'mwg', 'Massenwirkungsgesetz', 2), paperFirst: true }],
  }
}

function chatelierPart(seed: string, rng: Rng): ExamPart | null {
  if (rng.chance(LE_CHATELIER_QUESTION_SHARE)) {
    return { id: 'c', prompt: 'Prinzip von Le Chatelier.', points: 1, items: [questionItem(rng.pick(LE_CHATELIER_QUESTIONS), 'le-chatelier', rng)] }
  }
  const calc = leChatelierTask(2, createRng(`${seed}:lc`), ref)
  if (!calc) return null
  const e = equilibriumById(calc.substance.split(':')[0])!
  const step = calc.task.steps[calc.task.steps.length - 1]
  const change = calc.task.note!.replace(/^.*?gasförmig\. /, '')
  const withDH = calc.form.includes(':t-')
  return {
    id: 'c',
    prompt: `Gleichgewicht: $${equilibriumCe(e)}$${withDH ? ` mit $${dHLatex(e)}$` : ''}; alle Stoffe gasförmig. ${change}`,
    points: 1,
    items: [fromStep(step, 'richtung', 'Le Chatelier', 1)],
  }
}

function enthalpyPart(seed: string): ExamPart | null {
  for (let i = 0; i < 30; i++) {
    const calc = dhTask(3, createRng(`${seed}:dh:${i}`), ref)
    if (!calc || thermoReactionById(calc.substance)?.formation) continue
    const products = calc.task.steps.find((s) => s.id === 'produkte')
    const dh = calc.task.steps.find((s) => s.id === 'dh')
    if (!dh) continue
    return {
      id: 'd',
      prompt: `Reaktionsenthalpie: $${calc.task.functionLatex!}$. ${calc.task.note!}`,
      points: 3,
      // ohne typischen Fehler bei der Summe der Produkte zählt nur das Ergebnis
      items: products ? [fromStep(products, 'produkte', 'Summe der Produkte', 1), fromStep(dh, 'dh', 'Reaktionsenthalpie', 2, true)] : [fromStep(dh, 'dh', 'Reaktionsenthalpie', 3, true)],
    }
  }
  return null
}

// Angaben untereinander (gathered) als einzelne Formeln im Text, damit sie am Handy umbrechen
const inline = (latex: string) =>
  latex
    .replace(/^\\begin\{gathered\} /, '')
    .replace(/ \\end\{gathered\}$/, '')
    .split(/ \\\\ | \\quad /)
    .map((x) => `$${x}$`)
    .join(', ')

// Vorzeichen eines gewählten oder eingetippten ΔG: eingetippt mit Zahl als Wert, gewählt aus dem Text („$-12{,}3\,…$")
export function dgSign(option: ExamOption): number {
  if (option.value !== undefined) return ratSign(option.value as Rational)
  return /^\$\s*[-−]/.test(option.content) ? -1 : 1
}

// „Freiwillig?" mit dem eigenen ΔG bewerten (Folgefehler): Wer mit einem falschen ΔG die dazu passende Folgerung zieht,
// verliert den Punkt nicht doppelt. Die Gegenantwort ist die mit dem Denkfehler „exergon und endergon verwechselt".
function verdictItem(item: ExamItem): ExamItem {
  return {
    ...item,
    dependsOn: ['dg'],
    build: (chosen, truth) => {
      const base = item.build(chosen, truth)
      const own = dgSign(chosen('dg'))
      if (own === 0 || own === dgSign(truth('dg'))) return base
      const opposite = base.options.find((o) => o.errorRuleId === 'chem-dg-exergonic')
      if (!opposite) return base
      return {
        ...base,
        expected: opposite.id,
        explanation: { detailed: `Mit deinem $\\Delta G$ (${own < 0 ? 'negativ' : 'positiv'}) folgt: ${opposite.content}`, short: opposite.content },
      }
    },
  }
}

function gibbsPart(seed: string, rng: Rng): ExamPart | null {
  if (rng.chance(0.5)) {
    for (let i = 0; i < 30; i++) {
      const calc = gibbsTask(2, createRng(`${seed}:dg:${i}`), ref)
      if (!calc) continue
      const dg = calc.task.steps.find((s) => s.id === 'dg')!
      const verdict = calc.task.steps.find((s) => s.id === 'freiwillig')!
      return {
        id: 'e',
        prompt: `Freie Enthalpie: ${inline(calc.task.functionLatex!)}. ${calc.task.note!}`,
        points: 2,
        items: [fromStep(dg, 'dg', 'Freie Enthalpie', 1), verdictItem(fromStep(verdict, 'freiwillig', 'Freiwillig?', 1))],
      }
    }
    return null
  }
  const calc = rangeTask(2, createRng(`${seed}:bereich`), ref)
  if (!calc) return null
  return {
    id: 'e',
    prompt: `Freiwillig oder nicht: ${inline(calc.task.functionLatex!)}. ${calc.task.note!}`,
    points: 2,
    items: [fromStep(calc.task.steps[0], 'bereich', 'Freiwillig?', 2)],
  }
}

export function buildTask5(seed: number): ExamTask {
  for (let attempt = 0; attempt < 50; attempt++) {
    const key = `aufgabe5:${seed}:${attempt}`
    const rng = createRng(key)
    const a: ExamPart = {
      id: 'a',
      prompt: 'Gleichgewicht und Katalysator.',
      points: 2,
      items: [questionItem(rng.pick(EQUILIBRIUM_QUESTIONS), 'gleichgewicht', rng), questionItem(rng.pick(CATALYST_QUESTIONS), 'katalysator', rng)],
    }
    const b = mwgPart(rng)
    const c = chatelierPart(key, rng)
    const d = enthalpyPart(key)
    const e = gibbsPart(key, rng)
    if (!b || !c || !d || !e) continue
    return {
      title: 'Aufgabe 5: Gleichgewicht und Energie',
      intro: 'Beantworte die Fragen zum chemischen Gleichgewicht, zur Reaktionsenthalpie und zur freien Enthalpie.',
      givenLatex: '',
      note: 'Bei jeder Frage ist genau eine Antwort richtig. Die Werte, mit denen du rechnest, stehen bei den Teilen.',
      parts: [a, b, c, d, e],
    }
  }
  throw new Error(`Keine Klausuraufgabe 5 zu Nummer ${seed}`)
}
