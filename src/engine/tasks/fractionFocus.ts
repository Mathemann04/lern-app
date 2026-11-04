import { planFractionTask } from '../guided/fractionPlan.ts'
import type { Rng } from '../random/rng.ts'
import { fractionTemplatesForLevel, likelyFractionTemplate } from './fractionTerms.ts'
import { type Level, MAX_SEED, type TaskRef } from './taskNumber.ts'

// Gezieltes Üben bei Brüchen: eine Aufgabe, in der ein bestimmter typischer Fehler im geführten
// Modus als Antwort erscheint (der Schrittplaner zeigt ihn mit focus sicher, wo er passieren kann).
// Seltene Fehler stecken vor allem in einer Vorlage (`focus` der Vorlage, z. B. „Wurzeln"): Dann
// werden nur Nummern ausprobiert, die diese Vorlage wählen. Das Wählen ist schnell, nur das
// Durchrechnen kostet Zeit.

const TRIES_PER_LEVEL = 80
const DRAWS_PER_TRY = 200

export function findFractionTaskWithError(errorId: string, levels: readonly Level[], rng: Rng): TaskRef | null {
  for (const level of levels) {
    const home = fractionTemplatesForLevel(level).filter((t) => t.focus?.includes(errorId))
    const nextRef = (): TaskRef => {
      for (let draw = 0; draw < DRAWS_PER_TRY; draw++) {
        const ref = { level, seed: rng.int(1, MAX_SEED) }
        if (home.length === 0 || home.includes(likelyFractionTemplate(ref)!)) return ref
      }
      return { level, seed: rng.int(1, MAX_SEED) }
    }
    for (let i = 0; i < TRIES_PER_LEVEL; i++) {
      const ref = nextRef()
      if (planFractionTask(ref, errorId).steps.some((s) => s.choices.some((c) => c.errorRuleId === errorId))) return ref
    }
  }
  return null
}
