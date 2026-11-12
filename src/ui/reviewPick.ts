import { questionSeed } from '../engine/quiz/numbers.ts'
import { type DueAcross, otherVariant } from '../engine/quiz/schedule.ts'
import type { Level, TaskRef } from '../engine/tasks/taskNumber.ts'

// „Wiederholen" über alle Themen eines Fachs (S11): die am längsten fällige Frage, in einer anderen Fassung als beim
// letzten Mal. Die Stufe der Frage kennt nur die Engine ihres Themas (resolve; bei Wissensfragen legt die Nummer die
// Stufe fest). Gibt es eine Frage nicht mehr (resolve: null), kommt die nächste dran. Ohne Engine: die Seite
// ReviewPage.tsx lädt sie und reicht resolve herein.

export type ReviewResolve = (course: string, seed: number) => Promise<Level | null>

export async function pickReviewTask(
  due: readonly DueAcross[],
  resolve: ReviewResolve,
  random: () => number = Math.random,
): Promise<{ readonly course: string; readonly ref: TaskRef } | null> {
  for (const question of due) {
    const seed = questionSeed(question.no, otherVariant(question.variant, random))
    const level = await resolve(question.course, seed)
    if (level !== null) return { course: question.course, ref: { level, seed } }
  }
  return null
}
