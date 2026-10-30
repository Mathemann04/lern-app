import { planFractionTask } from '../guided/fractionPlan.ts'
import type { Rng } from '../random/rng.ts'
import { type Level, MAX_SEED, type TaskRef } from './taskNumber.ts'

// Gezieltes Üben bei Brüchen: eine Aufgabe, in der ein bestimmter typischer Fehler im geführten
// Modus als Antwort erscheint (der Schrittplaner zeigt ihn mit focus sicher, wo er passieren kann)

const TRIES_PER_LEVEL = 60

export function findFractionTaskWithError(errorId: string, levels: readonly Level[], rng: Rng): TaskRef | null {
  for (const level of levels) {
    for (let i = 0; i < TRIES_PER_LEVEL; i++) {
      const ref = { level, seed: rng.int(1, MAX_SEED) }
      if (planFractionTask(ref, errorId).steps.some((s) => s.choices.some((c) => c.errorRuleId === errorId))) return ref
    }
  }
  return null
}
