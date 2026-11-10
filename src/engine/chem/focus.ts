import { GENERATED_MAX, GENERATED_MIN, VARIANTS, questionSeed } from '../quiz/numbers.ts'
import type { Rng } from '../random/rng.ts'
import type { Level, TaskRef } from '../tasks/taskNumber.ts'
import { chemTopic } from './banks.ts'
import { generatedCalc, generatorOf } from './generators/index.ts'

// Gezielt üben in Chemie (erst beim gezielten Üben geladen, ui/practice.ts): eine Aufgabe, in der der
// Fehler passieren kann. Denkfehler: eine Frage, unter deren falschen Antworten er steht (der Plan zeigt
// ihn dann sicher, quiz/plan.ts). Rechenfehler: eine erzeugte Rechnung, in der er als Antwort vorkommt.
// levels: zuerst die gewählte Stufe, dann die nächstgelegenen.

const ATTEMPTS = 80

export function findChemTaskWithError(course: string, errorId: string, levels: readonly Level[], rng: Rng): TaskRef | null {
  const topic = chemTopic(course)
  for (const level of levels) {
    const questions = (topic?.bank.questions ?? []).filter((q) => q.level === level && q.wrong.some((w) => w.misconception === errorId))
    if (questions.length > 0) return { level, seed: questionSeed(rng.pick(questions).no, rng.int(0, VARIANTS - 1)) }
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const ref = { level, seed: rng.int(GENERATED_MIN, GENERATED_MAX) }
      if (!generatorOf(course, ref)?.errors.includes(errorId)) continue
      const calc = generatedCalc(course, ref, errorId)
      if (calc?.task.steps.some((s) => s.choices.some((c) => c.errorRuleId === errorId))) return ref
    }
  }
  return null
}
