import { describe, expect, it } from 'vitest'
import { planFractionTask } from '../guided/fractionPlan.ts'
import { createRng } from '../random/rng.ts'
import { findFractionTaskWithError } from './fractionFocus.ts'

describe('Gezieltes Üben bei Brüchen', () => {
  // alle Fehler, die in den spielbaren Stufen 1 bis 5 vorkommen
  const seen = new Set<string>()
  for (const level of [1, 2, 3, 4, 5] as const) {
    for (let seed = 1; seed <= 200; seed++) {
      for (const step of planFractionTask({ level, seed }).steps) for (const c of step.choices) if (c.errorRuleId) seen.add(c.errorRuleId)
    }
  }

  it.each([...seen].sort())('%s', (id) => {
    const ref = findFractionTaskWithError(id, [1, 2, 3, 4, 5], createRng(`test:${id}`))
    expect(ref, id).not.toBeNull()
    const plan = planFractionTask(ref!, id)
    expect(plan.steps.some((s) => s.choices.some((c) => c.errorRuleId === id)), `${id} in ${ref!.level}-${ref!.seed}`).toBe(true)
  })

  // Seltene Fehler der Stufe 5 sucht die Engine in ihrer Vorlage: Das klappt mit jedem Zufall
  it.each([
    'frac-conjugate-square',
    'frac-conjugate-sign',
    'frac-cube-as-square',
    'frac-cancel-inside',
    'frac-binomial-middle',
    'frac-division-sign',
    'frac-division-remainder',
    'frac-partial-no-division',
    'frac-partial-double-once',
    'frac-partial-insert-sign',
    'frac-partial-compare',
    'frac-imag-power',
    'frac-imag-squared',
    'frac-imag-cross',
    'frac-imag-den',
    'frac-imag-split',
    'frac-imag-direct',
    'frac-imag-minus',
    'frac-limit-zero-zero',
    'frac-limit-insert-sign',
    'frac-limit-divide-one-side',
    'frac-limit-infinity-one',
    'frac-limit-n-zero',
    'frac-limit-degree',
    'frac-limit-first-terms',
    'frac-tele-factor',
    'frac-tele-swap',
    'frac-tele-only-ends',
    'frac-tele-last',
    'frac-tele-start',
    'frac-tele-head',
    'frac-hyp-trig-sign',
    'frac-hyp-swapped',
  ])(
    '%s: findet ihn in Stufe 5 mit jedem Zufall',
    (id) => {
      for (let run = 0; run < 15; run++) expect(findFractionTaskWithError(id, [5], createRng(`zuverlässig:${id}:${run}`)), `${id} Lauf ${run}`).not.toBeNull()
    },
    120_000,
  )

  it('findet nichts zu Fehlern, die es in diesen Stufen nicht gibt', () => {
    expect(findFractionTaskWithError('frac-vieta-sign', [1], createRng('test'))).toBeNull()
  })
})
