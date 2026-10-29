import { allNodes, derive } from '../derive/derive.ts'
import { errorRule, wrongAnswers } from '../derive/errorRules.ts'
import type { Expr } from '../expr/types.ts'
import type { Rng } from '../random/rng.ts'
import { generateDerivativeTask } from './derivativeTerms.ts'
import { type Level, MAX_SEED, type TaskRef } from './taskNumber.ts'

// Gezieltes Üben: Aufgaben, in denen ein bestimmter typischer Fehler passieren kann.
// „Kann passieren" heißt: Die Fehlerregel liefert bei dieser Aufgabe ein eigenes falsches
// Ergebnis, das sich von der Lösung und den anderen typischen Fehlern unterscheidet.
// Dann zeigt der geführte Modus es sicher als Antwort (siehe focus im Schrittplaner).

export function errorPossible(expr: Expr, errorId: string): boolean {
  return check(expr, errorId) === 'possible'
}

// 'rule-missing': schnelle Vorprüfung gescheitert, die Regel des Fehlers kommt nicht vor
function check(expr: Expr, errorId: string): 'possible' | 'impossible' | 'rule-missing' {
  const { rule } = errorRule(errorId)
  const root = derive(expr)
  if (!allNodes(root).some((n) => n.rule === rule)) return 'rule-missing'
  return wrongAnswers(expr, root).some((w) => w.errorRule.id === errorId) ? 'possible' : 'impossible'
}

// Je Stufe viele Aufgaben würfeln (Ableiten ist schnell), aber nur wenige genau prüfen
// (alle falschen Ergebnisse ausrechnen dauert einige Millisekunden). So finden sich auch
// seltene Fehler wie beim Areakosinus, ohne dass die Suche spürbar dauert.
const TRIES_PER_LEVEL = 400
const CHECKS_PER_LEVEL = 40

// Sucht eine passende Aufgabe, zuerst in der ersten der genannten Stufen
export function findTaskWithError(errorId: string, levels: readonly Level[], rng: Rng): TaskRef | null {
  for (const level of levels) {
    let checks = 0
    for (let i = 0; i < TRIES_PER_LEVEL && checks < CHECKS_PER_LEVEL; i++) {
      const ref = { level, seed: rng.int(1, MAX_SEED) }
      const { task } = generateDerivativeTask(ref)
      if (task.kind !== 'function') continue
      const result = check(task.expr, errorId)
      if (result === 'possible') return ref
      if (result === 'impossible') checks++
    }
  }
  return null
}
