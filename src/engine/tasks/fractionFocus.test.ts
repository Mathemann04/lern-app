import { describe, expect, it } from 'vitest'
import { planFractionTask } from '../guided/fractionPlan.ts'
import { createRng } from '../random/rng.ts'
import { findFractionTaskWithError } from './fractionFocus.ts'

describe('Gezieltes Üben bei Brüchen', () => {
  // alle Fehler, die in den spielbaren Stufen 1 und 2 vorkommen
  const seen = new Set<string>()
  for (const level of [1, 2] as const) {
    for (let seed = 1; seed <= 200; seed++) {
      for (const step of planFractionTask({ level, seed }).steps) for (const c of step.choices) if (c.errorRuleId) seen.add(c.errorRuleId)
    }
  }

  it.each([...seen].sort())('%s', (id) => {
    const ref = findFractionTaskWithError(id, [1, 2], createRng(`test:${id}`))
    expect(ref, id).not.toBeNull()
    const plan = planFractionTask(ref!, id)
    expect(plan.steps.some((s) => s.choices.some((c) => c.errorRuleId === id)), `${id} in ${ref!.level}-${ref!.seed}`).toBe(true)
  })

  it('findet nichts zu Fehlern, die es in diesen Stufen nicht gibt', () => {
    expect(findFractionTaskWithError('frac-vieta-sign', [1], createRng('test'))).toBeNull()
  })
})
