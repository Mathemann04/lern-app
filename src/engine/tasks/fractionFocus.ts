import { planFractionTask } from '../guided/fractionPlan.ts'
import type { Rng } from '../random/rng.ts'
import { fractionTemplatesForLevel, likelyFractionTemplate } from './fractionTerms.ts'
import { type Level, MAX_SEED, type TaskRef } from './taskNumber.ts'

// Gezieltes Üben bei Brüchen: eine Aufgabe, in der ein bestimmter typischer Fehler im geführten
// Modus als Antwort erscheint (der Schrittplaner zeigt ihn mit focus sicher, wo er passieren kann).
// Seltene Fehler stecken vor allem in einer Vorlage (`focus` der Vorlage, z. B. „Wurzeln"): Dann
// werden nur Nummern ausprobiert, die diese Vorlage wählen. Das Wählen ist schnell, nur das
// Durchrechnen kostet Zeit.

// Versuche reihum in kleinen Portionen, zuerst die gewählte Stufe, dann die nächstgelegenen: Die
// meisten Fehler finden sich in der ersten Runde. Kommt ein Fehler nur in einer anderen Stufe vor
// oder ist er selten, geht so keine Zeit in Stufen verloren, in denen er gar nicht vorkommt.
const TRIES_PER_ROUND = 12
const TRIES_PER_LEVEL = 200
const DRAWS_PER_TRY = 200

export function findFractionTaskWithError(errorId: string, levels: readonly Level[], rng: Rng): TaskRef | null {
  const searches = levels.map((level) => {
    const home = fractionTemplatesForLevel(level).filter((t) => t.focus?.includes(errorId))
    const nextRef = (): TaskRef => {
      for (let draw = 0; draw < DRAWS_PER_TRY; draw++) {
        const ref = { level, seed: rng.int(1, MAX_SEED) }
        if (home.length === 0 || home.includes(likelyFractionTemplate(ref)!)) return ref
      }
      return { level, seed: rng.int(1, MAX_SEED) }
    }
    return nextRef
  })
  for (let done = 0; done < TRIES_PER_LEVEL; done += TRIES_PER_ROUND) {
    for (const nextRef of searches) {
      for (let i = 0; i < TRIES_PER_ROUND; i++) {
        const ref = nextRef()
        if (planFractionTask(ref, errorId).steps.some((s) => s.choices.some((c) => c.errorRuleId === errorId))) return ref
      }
    }
  }
  return null
}
