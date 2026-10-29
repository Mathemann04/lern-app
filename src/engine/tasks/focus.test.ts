import { describe, expect, it } from 'vitest'
import { ERROR_RULES } from '../derive/errorRules.ts'
import { add, cos, mul, num, pow, x } from '../expr/types.ts'
import { planGuidedTask } from '../guided/plan.ts'
import { createRng } from '../random/rng.ts'
import { errorPossible, findTaskWithError } from './focus.ts'
import type { Level } from './taskNumber.ts'

describe('Gezieltes Üben', () => {
  it('erkennt, ob ein Fehler in einer Aufgabe passieren kann', () => {
    expect(errorPossible(cos(mul(num(3), x)), 'cos-sign')).toBe(true)
    expect(errorPossible(add(pow(x, num(2)), mul(num(3), x)), 'cos-sign')).toBe(false)
    expect(errorPossible(add(pow(x, num(2)), num(5)), 'constant-summand-kept')).toBe(true)
  })

  // Jede Fehlerregel lässt sich in mindestens einer Stufe üben, und der geführte Modus zeigt
  // den Fehler dann sicher als Antwort
  it.each(ERROR_RULES.map((r) => r.id))('%s', (id) => {
    const levels: Level[] = [1, 2, 3, 4, 5]
    const ref = findTaskWithError(id, levels, createRng(`test:${id}`))
    expect(ref, id).not.toBeNull()
    const plan = planGuidedTask(ref!, id)
    expect(plan.steps.some((s) => s.choices.some((c) => c.errorRuleId === id)), `${id} in ${ref!.level}-${ref!.seed}`).toBe(true)
  })

  it('ändert ohne Fokus nichts am Schrittplan', () => {
    const ref = { level: 2 as const, seed: 4 }
    const plain = planGuidedTask(ref)
    const focused = planGuidedTask(ref, 'gibt-es-nicht')
    expect(focused.steps.map((s) => s.choices.map((c) => c.content))).toEqual(plain.steps.map((s) => s.choices.map((c) => c.content)))
  })
})
