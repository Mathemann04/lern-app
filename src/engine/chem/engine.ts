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
// Unterthemen (S1b): Jede Frage gehört zu einem Unterthema (part, Ids aus parts des Themas in
// ui/catalog.ts); nextSeed und questionNos wählen nur unter den angekreuzten. Ab S2 bekommt auch jeder
// Erzeuger von Rechnungen ein Unterthema und zählt hier mit.

export type ChemCourseEngine = {
  planGuidedTask(ref: TaskRef, focus?: string): GuidedTaskBase
  prepareFree(ref: TaskRef): FreeTask
  // Form für die Abwechslung: Fragen zum selben Fakt zählen als dieselbe Form
  formOf(ref: TaskRef): string
  // zufällige Nummer einer Frage dieser Stufe in zufälliger Fassung. shown: Nummern der Fragen, die in
  // der laufenden Runde schon dran waren (state/questionRounds.ts); gewählt wird nur unter den übrigen,
  // sind alle durch, wieder unter allen (neue Runde). parts: erlaubte Unterthemen (ohne Angabe alle);
  // gibt es dazu in der Stufe keine Frage, gelten alle Fragen der Stufe (nie ein Absturz)
  nextSeed(level: Level, shown?: ReadonlySet<number>, parts?: ReadonlySet<string>): number
  // Nummern der Fragen, unter denen nextSeed mit diesen Unterthemen wählt (dieselbe Rückfall-Regel), in
  // der Reihenfolge der Sammlung: für die Runde (nur sie beginnen von vorn) und für die Mischung; leer,
  // wenn die Stufe keine Fragen hat
  questionNos(level: Level, parts?: ReadonlySet<string>): readonly number[]
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

  // Fragen, unter denen gewählt wird: die der Stufe (ohne gelöschte) mit erlaubtem Unterthema; gibt es
  // davon keine (die Auswahl kommt in der Stufe nicht vor), alle der Stufe
  function candidatesOf(level: Level, parts?: ReadonlySet<string>): readonly Question[] {
    const inLevel = bank.questions.filter((q) => q.level === level && !retired.has(q.no))
    if (!parts) return inLevel
    const chosen = inLevel.filter((q) => parts.has(q.part))
    return chosen.length > 0 ? chosen : inLevel
  }

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
    nextSeed(level, shown, parts) {
      const allowed = candidatesOf(level, parts)
      if (allowed.length === 0) throw new Error(`Keine Fragen in Stufe ${level} des Themas ${course}`)
      // Keine Frage doppelt, bevor alle (der Auswahl) dran waren
      const unseen = shown ? allowed.filter((q) => !shown.has(q.no)) : allowed
      const candidates = unseen.length > 0 ? unseen : allowed
      return questionSeed(pick(candidates).no, Math.floor(random() * VARIANTS))
    },
    questionNos(level, parts) {
      return candidatesOf(level, parts).map((q) => q.no)
    },
    resolve(ref) {
      const level = questionOf(ref.seed)?.question.level
      return LEVELS.find((l) => l === level) ?? null
    },
  }
}
