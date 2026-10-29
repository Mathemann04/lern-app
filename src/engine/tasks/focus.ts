import { allNodes, derive } from '../derive/derive.ts'
import { errorRule, wrongAnswers } from '../derive/errorRules.ts'
import { deriveImplicit, implicitWrongAnswers } from '../derive/implicit.ts'
import type { Equation, Expr } from '../expr/types.ts'
import type { Rng } from '../random/rng.ts'
import { type DerivativeTask, generateDerivativeTask } from './derivativeTerms.ts'
import { type Level, MAX_SEED, type TaskRef } from './taskNumber.ts'

// Gezieltes Üben: Aufgaben, in denen ein bestimmter typischer Fehler passieren kann.
// „Kann passieren" heißt: Die Fehlerregel liefert bei dieser Aufgabe ein eigenes falsches
// Ergebnis, das sich von der Lösung und den anderen typischen Fehlern unterscheidet.
// Dann zeigt der geführte Modus es sicher als Antwort (siehe focus im Schrittplaner).

export function errorPossible(expr: Expr, errorId: string): boolean {
  return check(expr, errorId) === 'possible'
}

// 'rule-missing': schnelle Vorprüfung gescheitert, die Regel des Fehlers kommt nicht vor
function checkTask(task: DerivativeTask, errorId: string): 'possible' | 'impossible' | 'rule-missing' {
  return task.kind === 'implicit' ? checkImplicit(task.equation, errorId) : check(task.expr, errorId)
}

// Implizit: Der Fehler erscheint beim Ableiten beider Seiten als Antwort
function checkImplicit(equation: Equation, errorId: string): 'possible' | 'impossible' | 'rule-missing' {
  const { rule } = errorRule(errorId)
  const d = deriveImplicit(equation)
  if (![d.left, d.right].flatMap(allNodes).some((n) => n.rule === rule)) return 'rule-missing'
  return implicitWrongAnswers(equation, d).some((w) => w.errorRule.id === errorId) ? 'possible' : 'impossible'
}

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
      const result = checkTask(task, errorId)
      if (result === 'possible') return ref
      if (result === 'impossible') checks++
    }
  }
  return null
}
