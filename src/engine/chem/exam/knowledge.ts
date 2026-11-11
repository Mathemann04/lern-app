import type { ExamItem } from '../../exam/types.ts'
import { VARIANTS, questionSeed } from '../../quiz/numbers.ts'
import { planQuestion } from '../../quiz/plan.ts'
import type { SingleChoice } from '../../quiz/types.ts'
import type { Rng } from '../../random/rng.ts'
import { chemTopic } from '../banks.ts'
import { fromStep } from './fromStep.ts'

// Wissensfrage aus der Sammlung eines Themas als Frage einer Klausuraufgabe: vier Antworten wie beim Üben (eine
// zufällige Fassung), mit Denkfehlern und „Warum ist das falsch?"; falsch beantwortet kommt sie in die Wiederholung
// (review). Nur Einfachauswahl: Klausurfragen haben genau eine richtige Antwort.

export function knowledgeQuestion(course: string, no: number): SingleChoice {
  const q = chemTopic(course)?.bank.questions.find((x) => x.no === no)
  if (q?.kind !== 'single') throw new Error(`Frage ${no} fehlt in ${course} oder ist keine Einfachauswahl`)
  return q
}

export function knowledgeItem(course: string, no: number, id: string, points: number, rng: Rng): ExamItem {
  const q = knowledgeQuestion(course, no)
  const variant = rng.int(0, VARIANTS - 1)
  const seed = questionSeed(no, variant)
  const task = planQuestion(q, chemTopic(course)!.misconceptions, { level: q.level, seed }, variant)
  return { ...fromStep(task.steps[0], id, q.title, points), review: { course, seed } }
}
