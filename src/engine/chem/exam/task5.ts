import type { ExamItem, ExamPart, ExamTask } from '../../exam/types.ts'
import { VARIANTS, questionSeed } from '../../quiz/numbers.ts'
import { planQuestion } from '../../quiz/plan.ts'
import { type Rng, createRng } from '../../random/rng.ts'
import { chemTopic } from '../banks.ts'
import { EQUILIBRIA, equilibriumById, equilibriumCe } from '../equilibria.ts'
import { dhTask, gibbsTask, rangeTask } from '../generators/energie.ts'
import { dHLatex, expressionStep, leChatelierTask } from '../generators/mwg.ts'
import { thermoReactionById } from '../thermo.ts'
import { fromStep } from './fromStep.ts'

// „Klausuraufgabe 5 üben" (Plan M4, S7c; Bauplan Teil 1, Aufgabe 5 mit 10 Punkten): Gleichgewicht und Energie.
// a) Gleichgewicht und Katalysator: zwei Wissensfragen (2), b) Massenwirkungsgesetz (2), c) Le Chatelier (1),
// d) Reaktionsenthalpie aus Bildungsenthalpien (Summe der Produkte 1, ΔH 2), e) freiwillig oder nicht (ΔG und Urteil je 1,
// oder der Temperaturbereich 2). Die Fragen kommen aus den Wissensfragen und Rechnungen der Themen „Chemisches Gleichgewicht"
// und „Energie bei Reaktionen", mit denselben falschen Antworten, Denk- und Rechenfehlern. Die Teile hängen nicht voneinander
// ab (keine Folgefehler).

export const TASK5_POINTS = 10

const MWG = 'chem-mwg'

// Fragen je Teil a (Nummern der Sammlung „Chemisches Gleichgewicht"): dynamisches Gleichgewicht und Katalysator
export const EQUILIBRIUM_QUESTIONS = [102, 103, 104, 201, 202, 301]
export const CATALYST_QUESTIONS = [113, 114, 115, 218, 318]

function questionItem(no: number, id: string, rng: Rng): ExamItem {
  const topic = chemTopic(MWG)!
  const q = topic.bank.questions.find((x) => x.no === no)
  // nur Einfachauswahl: Klausurfragen haben vier Antworten, genau eine richtig
  if (q?.kind !== 'single') throw new Error(`Frage ${no} fehlt im Thema Chemisches Gleichgewicht oder ist keine Einfachauswahl`)
  const variant = rng.int(0, VARIANTS - 1)
  const seed = questionSeed(no, variant)
  const task = planQuestion(q, topic.misconceptions, { level: q.level, seed }, variant)
  return { ...fromStep(task.steps[0], id, q.title, 1), review: { course: MWG, seed } }
}

const ref = { level: 2 as const, seed: 10000 }

function mwgPart(rng: Rng): ExamPart | null {
  const e = rng.pick(EQUILIBRIA)
  const step = expressionStep(e, rng)
  if (!step) return null
  return {
    id: 'b',
    prompt: `Gleichgewicht: $${equilibriumCe(e)}$${e.process ? ` (${e.process})` : ''}.`,
    points: 2,
    items: [fromStep(step, 'mwg', 'Massenwirkungsgesetz', 2, true)],
  }
}

function chatelierPart(seed: string): ExamPart | null {
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
    items: [fromStep(step, 'richtung', 'Le Chatelier', 1, true)],
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
        items: [fromStep(dg, 'dg', 'Freie Enthalpie', 1), fromStep(verdict, 'freiwillig', 'Freiwillig?', 1)],
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
    items: [fromStep(calc.task.steps[0], 'bereich', 'Freiwillig?', 2, true)],
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
    const c = chatelierPart(key)
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
