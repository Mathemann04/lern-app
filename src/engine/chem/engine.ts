import type { FreeTask } from '../check/freeTask.ts'
import type { GuidedTaskBase } from '../guided/types.ts'
import { planQuestion } from '../quiz/plan.ts'
import { VARIANTS, decodeSeed, questionSeed } from '../quiz/numbers.ts'
import type { Question } from '../quiz/types.ts'
import { LEVELS, type Level, type TaskRef } from '../tasks/taskNumber.ts'
import { type ChemTopic, chemTopic } from './banks.ts'

// Engine eines Chemie-Themas für den geführten Modus (dieselbe Form wie die Mathe-Engines in
// ui/courseEngines.ts). In S1 gibt es nur Wissensfragen: Die Nummer einer Aufgabe nennt die Frage und
// ihre Fassung (quiz/numbers.ts); erzeugte Rechnungen kommen ab S2 dazu.

export type ChemCourseEngine = {
  planGuidedTask(ref: TaskRef, focus?: string): GuidedTaskBase
  prepareFree(ref: TaskRef): FreeTask
  // Form für die Abwechslung: Fragen zum selben Fakt zählen als dieselbe Form
  formOf(ref: TaskRef): string
  // zufällige Nummer einer Frage dieser Stufe in zufälliger Fassung
  nextSeed(level: Level): number
  // Stufe, zu der die Nummer gehört; null, wenn es dazu keine Aufgabe (mehr) gibt
  resolve(ref: TaskRef): Level | null
}

// Engine eines Themas aus der Liste in banks.ts; random: Zufall für neue Nummern (in Tests fest)
export function chemCourseEngine(course: string, random: () => number = Math.random): ChemCourseEngine {
  const topic = chemTopic(course)
  if (!topic) throw new Error(`Keine Fragensammlung für das Thema ${course}`)
  return topicEngine(topic, random)
}

// Engine zu einer Sammlung mit ihren Denkfehlern
export function topicEngine({ bank, misconceptions }: ChemTopic, random: () => number = Math.random): ChemCourseEngine {
  const course = bank.course
  const retired = new Set(bank.retired)

  // Frage und Fassung hinter einer Nummer; gelöschte Fragen gibt es nicht mehr
  function questionOf(seed: number): { question: Question; variant: number } | null {
    const decoded = decodeSeed(seed)
    if (decoded?.kind !== 'question' || retired.has(decoded.no)) return null
    const question = bank.questions.find((q) => q.no === decoded.no)
    return question ? { question, variant: decoded.variant } : null
  }

  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]

  return {
    planGuidedTask(ref, focus) {
      const found = questionOf(ref.seed)
      if (!found) throw new Error(`Aufgabe ${ref.level}-${ref.seed} gibt es im Thema ${course} nicht`)
      return planQuestion(found.question, misconceptions, ref, found.variant, focus)
    },
    prepareFree() {
      throw new Error(`Das Thema ${course} hat noch keinen freien Modus`)
    },
    formOf(ref) {
      const found = questionOf(ref.seed)
      return found ? `q:${found.question.fact}` : 'q:?'
    },
    nextSeed(level) {
      const candidates = bank.questions.filter((q) => q.level === level && !retired.has(q.no))
      if (candidates.length === 0) throw new Error(`Keine Fragen in Stufe ${level} des Themas ${course}`)
      return questionSeed(pick(candidates).no, Math.floor(random() * VARIANTS))
    },
    resolve(ref) {
      const level = questionOf(ref.seed)?.question.level
      return LEVELS.find((l) => l === level) ?? null
    },
  }
}
