import type { ExamItem, ExamOption, ExamPart, ExamTask } from '../../exam/types.ts'
import { VARIANTS, questionSeed } from '../../quiz/numbers.ts'
import { planQuestion } from '../../quiz/plan.ts'
import type { SingleChoice } from '../../quiz/types.ts'
import { type Rng, createRng } from '../../random/rng.ts'
import { chemTopic } from '../banks.ts'
import { chemErrorRule } from '../errorRules.ts'
import { type Element, ELEMENTS } from '../elements.ts'
import { valenceTask } from '../generators/elektronen.ts'
import { LIGHT_GENERATORS } from '../generators/light.ts'
import { type Particle, isExamParticle, symbolLatex } from '../generators/particles.ts'
import { type ExtraOption, withExtraOptions } from './extraOptions.ts'
import { fromStep } from './fromStep.ts'

// „Klausuraufgabe 1 üben" (Plan M4, S6b; Bauplan Teil 1, Aufgabe 1 mit 8 Punkten): Aufbau der Materie.
// a) Ladungen der Elementarteilchen (1), b) zwei Begriffsfragen (2), c) Protonen, Neutronen und Elektronen aus einem
// Kernsymbol eines Atoms oder Ions (1), d) Valenzelektronen oder die Frage, was ein Valenzelektron ist, und die
// Valenzkonfiguration (2), e) Atommodell (zwei Fragen) oder Energie des Lichts (2). Die Fragen kommen aus den
// Wissensfragen und Rechnungen der Themen Atombau und Elektronen, mit denselben falschen Antworten, Denk- und
// Rechenfehlern. Die Teile hängen nicht voneinander ab (keine Folgefehler); jede Frage zählt für sich.

export const TASK1_POINTS = 8

const ATOMBAU = 'chem-atombau'
const ELEKTRONEN = 'chem-elektronen'

// Fragen je Teil (Nummern der Sammlung Atombau): a) Teilchen und Ladung, b) Begriffe, e) Atommodelle. In Teil a kommt
// die Zuordnung der Ladungen (CHARGE_ASSIGNMENT) in jeder zweiten Aufgabe, wie in beiden Altklausuren.
export const CHARGE_ASSIGNMENT = 111
export const CHARGE_QUESTIONS = [111, 113, 115, 307]
export const TERM_QUESTIONS = [102, 116, 117, 118, 119, 120, 201, 202, 301, 302, 303, 308]
// Was ist ein Valenzelektron? (Sammlung Elektronen), in Teil d statt der Zahl der Valenzelektronen
export const VALENCE_QUESTION = 113
export const MODEL_QUESTIONS = [206, 207, 208, 209, 210, 211, 212, 306, 311, 312, 313, 314]

// nur Einfachauswahl: Klausurfragen haben vier Antworten, genau eine richtig
function question(no: number, course = ATOMBAU): SingleChoice {
  const q = chemTopic(course)!.bank.questions.find((x) => x.no === no)
  if (q?.kind !== 'single') throw new Error(`Frage ${no} fehlt in ${course} oder ist keine Einfachauswahl`)
  return q
}

// Wissensfrage als Frage der Klausuraufgabe (vier Antworten wie beim Üben)
function questionItem(no: number, id: string, points: number, rng: Rng, course = ATOMBAU): ExamItem {
  const q = question(no, course)
  const variant = rng.int(0, VARIANTS - 1)
  const seed = questionSeed(no, variant)
  const task = planQuestion(q, chemTopic(course)!.misconceptions, { level: q.level, seed }, variant)
  return { ...fromStep(task.steps[0], id, q.title, points), review: { course, seed } }
}

// --- c) Kernsymbol ---

// Elemente mit Isotopen und typischen Ionen (ohne Wasserstoff: H⁺ hat kein Elektron)
const WITH_IONS: readonly Element[] = ELEMENTS.filter((el) => el.z > 1 && el.isotopes.length > 0 && el.ions.length > 0)
// Anteil der ungeladenen Atome in Teil c (die Altklausuren fragen beides)
export const NEUTRAL_SHARE = 0.4
// ungeladene Atome: Isotope mit anderer Neutronen- als Protonenzahl (sonst fielen die vertauschten Zahlen weg)
const neutralIsotopes = (el: Element) => el.isotopes.filter((a) => a - el.z !== el.z)
const NEUTRAL: readonly Element[] = ELEMENTS.filter((el) => el.z > 1 && neutralIsotopes(el).length > 0)

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
  // beim ungeladenen Atom fallen die Fehler der Ladung weg: dafür Elektronen wie Neutronen gezählt (ohne typischen Fehler)
  const neutralWrong = pne(z, n, n)
  if (t.q === 0 && options.length < 4 && !seen.has(neutralWrong))
    options.push({
      id: neutralWrong,
      content: neutralWrong,
      why: {
        detailed: 'Die Zahl der Elektronen hängt an der Ladung des Kerns: Ein ungeladenes Atom hat so viele Elektronen, wie der Kern Protonen hat. Die Neutronen tragen keine Ladung und zählen dafür nicht.',
        short: 'Ungeladen: Elektronen gleich Protonen.',
      },
    })
  const charge = t.q === 0 ? 'Das Atom ist ungeladen' : `Die Ladung ${t.q > 0 ? '+' : '−'}${Math.abs(t.q)} heißt: ${Math.abs(t.q)} ${Math.abs(t.q) === 1 ? 'Elektron' : 'Elektronen'} ${t.q > 0 ? 'abgegeben' : 'aufgenommen'}`
  return {
    id: 'teilchen',
    title: 'Protonen, Neutronen, Elektronen',
    question: `Bestimme die Zahl der Protonen, Neutronen und Elektronen von $${symbolLatex(t)}$.`,
    points: 1,
    dependsOn: [],
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

// Teilchen der Altklausuren und Übungsblätter (isExamParticle, docs/CHEMIE.md §9) kommen nicht vor
function particlePart(rng: Rng): ExamPart {
  const neutral = rng.chance(NEUTRAL_SHARE)
  for (;;) {
    let t: Particle
    if (neutral) {
      const el = rng.pick(NEUTRAL)
      t = { el, a: rng.pick(neutralIsotopes(el)), q: 0 }
    } else {
      const el = rng.pick(WITH_IONS)
      t = { el, a: rng.pick(el.isotopes), q: rng.pick(el.ions) }
    }
    if (!isExamParticle(t)) return { id: 'c', prompt: 'Kernsymbol.', points: 1, items: [particleItem(t)] }
  }
}

// --- d) Valenzelektronen ---

// Sauerstoff (eine Altklausur fragte seine Valenzkonfiguration fast mit denselben Antworten) und Chlor (dort als
// Kernsymbol) kommen in Teil d nicht vor (docs/CHEMIE.md §9)
export const EXAM_VALENCE_ELEMENTS = ['O', 'Cl']
// Anteil der Aufgaben, in denen Teil d fragt, was ein Valenzelektron ist (statt wie viele es sind)
export const VALENCE_QUESTION_SHARE = 0.5

const COUNT_WHY: ExtraOption['why'] = {
  detailed: 'Valenzelektronen sind die Elektronen der äußersten Schale. Bei Hauptgruppenelementen sagt die römische Nummer der Hauptgruppe, wie viele es sind.',
  short: 'Die Hauptgruppe sagt die Zahl der Valenzelektronen.',
}

// weitere Zahlen neben der richtigen, damit die Frage vier Antworten hat
const countExtras = (right: number): ExtraOption[] =>
  [right + 1, right - 1, right + 2, right - 2].filter((x) => x >= 1 && x <= 8).map((x) => ({ content: `$${x}$`, why: COUNT_WHY }))

function valencePart(seed: string, rng: Rng): ExamPart | null {
  for (let i = 0; i < 30; i++) {
    const calc = valenceTask(2, createRng(`${seed}:valenz:${i}`), { level: 2, seed: 10000 })
    if (!calc || EXAM_VALENCE_ELEMENTS.includes(calc.substance ?? '')) continue
    const [count, config] = calc.task.steps
    const right = Number(count.choices.find((c) => c.correct)!.content.replaceAll('$', ''))
    const first = rng.chance(VALENCE_QUESTION_SHARE)
      ? questionItem(VALENCE_QUESTION, 'valenzelektron', 1, rng, ELEKTRONEN)
      : withExtraOptions(fromStep(count, 'valenzelektronen', 'Valenzelektronen', 1), countExtras(right), rng)
    return {
      id: 'd',
      prompt: calc.task.note!,
      points: 2,
      items: [first, fromStep(config, 'valenzkonfiguration', 'Valenzkonfiguration', 1)],
    }
  }
  return null
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
      items: [fromStep(step, 'licht', step.title, 2)],
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
    const charge = rng.chance(0.5) ? CHARGE_ASSIGNMENT : rng.pick(CHARGE_QUESTIONS.filter((no) => no !== CHARGE_ASSIGNMENT))
    const [t1, t2] = rng.shuffle(TERM_QUESTIONS.filter((no) => question(no).fact !== question(charge).fact)).filter((no, i, list) => i === 0 || question(no).fact !== question(list[0]).fact)
    const a: ExamPart = { id: 'a', prompt: 'Elementarteilchen.', points: 1, items: [questionItem(charge, 'ladung', 1, rng)] }
    const b: ExamPart = { id: 'b', prompt: 'Begriffe.', points: 2, items: [questionItem(t1, 'begriff-1', 1, rng), questionItem(t2, 'begriff-2', 1, rng)] }
    const c = particlePart(rng)
    const d = valencePart(key, rng)
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
