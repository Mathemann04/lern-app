import { planRearrangeTask } from '../guided/rearrangePlan.ts'
import type { Rng } from '../random/rng.ts'
import { REARRANGE_TEMPLATES, likelyRearrangeTemplate } from './rearrangeTerms.ts'
import { hasLogEquations } from './logEquationKinds.ts'
import { hasNumberEquations } from './numberEquationKinds.ts'
import { type Level, MAX_SEED, type TaskRef, blockSeed } from './taskNumber.ts'

// Gezieltes Üben beim Umstellen (M3, Schritt 9): eine Aufgabe, in der ein bestimmter typischer Fehler im
// geführten Modus als Antwort erscheint (der Schrittplaner zeigt ihn mit focus sicher, wo er passieren kann).
// Wie bei den Brüchen: Fehler, die vor allem in einer Vorlage vorkommen (`focus` der Vorlage, z. B. die
// Fehler beim Betrag in „Betrag und Winkel"), werden nur dort gesucht, und nur in den Stufen dieser Vorlagen.
// Das Wählen einer Nummer ist schnell (likelyRearrangeTemplate), nur das Durchrechnen kostet Zeit (in Stufe 5
// etwa 20 bis 90 Millisekunden je Aufgabe).

// Versuche reihum in kleinen Portionen, zuerst die gewählte Stufe, dann die nächstgelegenen
const TRIES_PER_ROUND = 8
const TRIES_PER_LEVEL = 400
const DRAWS_PER_TRY = 400

const shows = (ref: TaskRef, errorId: string) => planRearrangeTask(ref, errorId).steps.some((s) => s.choices.some((c) => c.errorRuleId === errorId))

// Fehler, die nur bei Logarithmen auf beiden Seiten vorkommen (M6 Schritt 4b-2): nur unter Nummern wie „logeq.2-4711“
export const LOG_EQUATION_ERRORS: ReadonlySet<string> = new Set(['eq-log-base-flipped', 'eq-log-base-quotient', 'eq-log-power-factor', 'eq-log-number-plain', 'eq-log-number-inside'])

// Fehler, die nur bei Gleichungen mit Zahlen vorkommen (M6 Schritt 4b-3): nur unter Nummern wie „zahlen.1-4711“
export const NUMBER_EQUATION_ERRORS: ReadonlySet<string> = new Set(['eq-root-negative-squared', 'eq-cube-root-sign'])

export function findRearrangeTaskWithError(errorId: string, levels: readonly Level[], rng: Rng): TaskRef | null {
  if (NUMBER_EQUATION_ERRORS.has(errorId)) {
    const numberLevels = levels.filter(hasNumberEquations)
    return search(numberLevels.map((level) => () => ({ level, seed: blockSeed('zahlen', rng.int(1, MAX_SEED)) })), errorId)
  }
  if (LOG_EQUATION_ERRORS.has(errorId)) {
    const logLevels = levels.filter(hasLogEquations)
    return search(logLevels.map((level) => () => ({ level, seed: blockSeed('logeq', rng.int(1, MAX_SEED)) })), errorId)
  }
  const homes = REARRANGE_TEMPLATES.filter((t) => t.focus?.includes(errorId))
  // mit eigener Vorlage nur in deren Stufen, sonst in allen genannten
  const searched = homes.length > 0 ? levels.filter((level) => homes.some((h) => h.level === level)) : levels
  const searches = searched.map((level) => {
    const home = homes.filter((h) => h.level === level)
    return (): TaskRef => {
      for (let draw = 0; draw < DRAWS_PER_TRY; draw++) {
        const ref = { level, seed: rng.int(1, MAX_SEED) }
        if (home.length === 0 || home.includes(likelyRearrangeTemplate(ref)!)) return ref
      }
      return { level, seed: rng.int(1, MAX_SEED) }
    }
  })
  return search(searches, errorId)
}

function search(searches: readonly (() => TaskRef)[], errorId: string): TaskRef | null {
  for (let done = 0; done < TRIES_PER_LEVEL; done += TRIES_PER_ROUND) {
    for (const nextRef of searches) {
      for (let i = 0; i < TRIES_PER_ROUND; i++) {
        const ref = nextRef()
        if (shows(ref, errorId)) return ref
      }
    }
  }
  return null
}
