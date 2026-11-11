import type { ExamItem, ExamOption, ExamPart, ExamTask } from '../../exam/types.ts'
import { VARIANTS, questionSeed } from '../../quiz/numbers.ts'
import { planQuestion } from '../../quiz/plan.ts'
import type { Question } from '../../quiz/types.ts'
import { type Rng, createRng } from '../../random/rng.ts'
import { chemTopic } from '../banks.ts'
import { chemErrorRule } from '../errorRules.ts'
import { type Element, ELEMENTS } from '../elements.ts'
import { valenceTask } from '../generators/elektronen.ts'
import { LIGHT_GENERATORS } from '../generators/light.ts'
import { type Particle, symbolLatex } from '../generators/particles.ts'
import { fromStep } from './fromStep.ts'

// „Klausuraufgabe 1 üben" (Plan M4, S6b; Bauplan Teil 1, Aufgabe 1 mit 8 Punkten): Aufbau der Materie.
// a) Ladungen der Elementarteilchen (1), b) zwei Begriffsfragen (2), c) Protonen, Neutronen und Elektronen aus einem
// Kernsymbol (1), d) Valenzelektronen und Valenzkonfiguration (2), e) Atommodell (zwei Fragen) oder Energie des
// Lichts (2). Die Fragen kommen aus den Wissensfragen und Rechnungen der Themen Atombau und Elektronen, mit denselben
// falschen Antworten, Denk- und Rechenfehlern. Die Teile hängen nicht voneinander ab (keine Folgefehler).

export const TASK1_POINTS = 8

const ATOMBAU = 'chem-atombau'

// Fragen je Teil (Nummern der Sammlung Atombau): a) Teilchen und Ladung, b) Begriffe, e) Atommodelle
export const CHARGE_QUESTIONS = [111, 113, 115, 307]
export const TERM_QUESTIONS = [102, 116, 117, 118, 119, 120, 201, 202, 301, 302, 303, 308]
export const MODEL_QUESTIONS = [206, 207, 208, 209, 210, 211, 212, 306, 311, 312, 313, 314]

function question(no: number): Question {
  const q = chemTopic(ATOMBAU)!.bank.questions.find((x) => x.no === no)
  if (!q) throw new Error(`Frage ${no} fehlt im Atombau`)
  return q
}

// Wissensfrage als Frage der Klausuraufgabe (vier Antworten wie beim Üben)
function questionItem(no: number, id: string, points: number, rng: Rng, final = false): ExamItem {
  const q = question(no)
  const variant = rng.int(0, VARIANTS - 1)
  const seed = questionSeed(no, variant)
  const task = planQuestion(q, chemTopic(ATOMBAU)!.misconceptions, { level: q.level, seed }, variant)
  return { ...fromStep(task.steps[0], id, q.title, points, final), review: { course: ATOMBAU, seed } }
}

// --- c) Kernsymbol ---

// Elemente mit Isotopen und typischen Ionen (ohne Wasserstoff: H⁺ hat kein Elektron)
const WITH_IONS: readonly Element[] = ELEMENTS.filter((el) => el.z > 1 && el.isotopes.length > 0 && el.ions.length > 0)

const pne = (p: number, n: number, e: number) => `$${p}$ Protonen, $${n}$ Neutronen, $${e}$ ${e === 1 ? 'Elektron' : 'Elektronen'}`

export function particleItem(t: Particle): ExamItem {
  const z = t.el.z
  const n = t.a - z
  const e = z - t.q
  const right = pne(z, n, e)
  const wrong: [string, string][] = [
    ['chem-neutrons-mass-number', pne(z, t.a, e)],
    ['chem-protons-neutrons-swapped', pne(n, z, e)],
    ['chem-ion-charge-ignored', pne(z, n, z)],
    ['chem-ion-charge-sign', pne(z, n, z + t.q)],
  ]
  const seen = new Set([right])
  const options: ExamOption[] = [{ id: right, content: right }]
  for (const [rule, content] of wrong) {
    if (seen.has(content) || options.length >= 4) continue
    seen.add(content)
    options.push({ id: content, content, errorRuleId: rule, why: chemErrorRule(rule).why })
  }
  const charge = t.q === 0 ? 'Das Atom ist ungeladen' : `Die Ladung ${t.q > 0 ? '+' : '−'}${Math.abs(t.q)} heißt: ${Math.abs(t.q)} ${Math.abs(t.q) === 1 ? 'Elektron' : 'Elektronen'} ${t.q > 0 ? 'abgegeben' : 'aufgenommen'}`
  return {
    id: 'teilchen',
    title: 'Protonen, Neutronen, Elektronen',
    question: `Wie viele Protonen, Neutronen und Elektronen hat $${symbolLatex(t)}$?`,
    points: 1,
    dependsOn: [],
    final: true,
    cards: ['atombau-kernsymbol', ...(t.q === 0 ? [] : ['atombau-ionen'])],
    build: () => ({
      options,
      expected: right,
      correct: right,
      explanation: {
        detailed: `Unten links steht die Ordnungszahl: $${z}$ Protonen. Oben links die Massenzahl: $N = ${t.a} - ${z} = ${n}$ Neutronen. ${charge}: $${z} ${t.q > 0 ? '-' : '+'} ${Math.abs(t.q)} = ${e}$ Elektronen.`,
        short: right,
      },
    }),
  }
}

function particlePart(rng: Rng): ExamPart {
  const el = rng.pick(WITH_IONS)
  const t: Particle = { el, a: rng.pick(el.isotopes), q: rng.pick(el.ions) }
  return { id: 'c', prompt: 'Kernsymbol.', points: 1, items: [particleItem(t)] }
}

// --- d) Valenzelektronen ---

function valencePart(seed: string): ExamPart | null {
  const calc = valenceTask(2, createRng(`${seed}:valenz`), { level: 2, seed: 10000 })
  if (!calc) return null
  const [count, config] = calc.task.steps
  return {
    id: 'd',
    prompt: calc.task.note!,
    points: 2,
    items: [fromStep(count, 'valenzelektronen', 'Valenzelektronen', 1), fromStep(config, 'valenzkonfiguration', 'Valenzkonfiguration', 1, true)],
  }
}

// --- e) Atommodell oder Energie des Lichts ---

function lastPart(seed: string, rng: Rng): ExamPart | null {
  if (rng.chance(0.5)) {
    const calc = LIGHT_GENERATORS[0].generate(2, createRng(`${seed}:licht`), { level: 2, seed: 10000 })
    if (!calc) return null
    const [step] = calc.task.steps
    return {
      id: 'e',
      prompt: `${calc.task.instruction}. ${calc.task.note!} Gegeben: $${calc.task.functionLatex!}$.`,
      points: 2,
      items: [fromStep(step, 'licht', step.title, 2, true)],
    }
  }
  const [first, second] = rng.shuffle(MODEL_QUESTIONS).filter((no, i, list) => i === 0 || question(no).fact !== question(list[0]).fact)
  return {
    id: 'e',
    prompt: 'Atommodelle.',
    points: 2,
    items: [questionItem(first, 'modell-1', 1, rng), questionItem(second, 'modell-2', 1, rng)],
  }
}

export function buildTask1(seed: number): ExamTask {
  for (let attempt = 0; attempt < 50; attempt++) {
    const key = `aufgabe1:${seed}:${attempt}`
    const rng = createRng(key)
    const charge = rng.pick(CHARGE_QUESTIONS)
    const [t1, t2] = rng.shuffle(TERM_QUESTIONS.filter((no) => question(no).fact !== question(charge).fact)).filter((no, i, list) => i === 0 || question(no).fact !== question(list[0]).fact)
    const a: ExamPart = { id: 'a', prompt: 'Elementarteilchen.', points: 1, items: [questionItem(charge, 'ladung', 1, rng, true)] }
    const b: ExamPart = { id: 'b', prompt: 'Begriffe.', points: 2, items: [questionItem(t1, 'begriff-1', 1, rng), questionItem(t2, 'begriff-2', 1, rng)] }
    const c = particlePart(rng)
    const d = valencePart(key)
    const e = lastPart(key, rng)
    if (!d || !e) continue
    return {
      title: 'Aufgabe 1: Aufbau der Materie',
      intro: 'Beantworte die Fragen zu Elementarteilchen, Atomen, Ionen, Valenzelektronen und Atommodellen bzw. Licht.',
      givenLatex: '',
      note: 'Bei jeder Frage ist genau eine Antwort richtig.',
      parts: [a, b, c, d, e],
    }
  }
  throw new Error(`Keine Klausuraufgabe 1 zu Nummer ${seed}`)
}
