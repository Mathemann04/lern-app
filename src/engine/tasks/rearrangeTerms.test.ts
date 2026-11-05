import { describe, expect, it } from 'vitest'
import { contains, subterms } from '../expr/compare.ts'
import { solveEquation } from '../rearrange/isolate.ts'
import { createRng } from '../random/rng.ts'
import { rearrangeForm } from './forms.ts'
import { generateRearrangeTask } from './rearrangeTerms.ts'
import { type Level, MAX_SEED } from './taskNumber.ts'
import { pickFresh, varietyStats } from './variety.ts'

// Abwechslung beim Umstellen (docs/PLAN-M3.md, 4. Fassung): Die Stufen aus dem Baukasten haben je
// Stufe viele Formen, keine zu häufig, und beim Ziehen keine Wiederholung.
const KIT_LEVELS: Level[] = [1, 2]

describe.each(KIT_LEVELS)('Abwechslung Stufe %i', (level) => {
  it('mindestens 100 Formen unter 200 Aufgaben, keine öfter als 3 von 100', () => {
    const stats = varietyStats(Array.from({ length: 200 }, (_, i) => rearrangeForm({ level, seed: i + 1 })))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('zehn neue Aufgaben nacheinander ohne doppelte Form', () => {
    const rng = createRng(`ziehen-umstellen:${level}`)
    const recent: string[] = []
    for (let i = 0; i < 10; i++) {
      const seed = pickFresh((s) => rearrangeForm({ level, seed: s }), recent, () => rng.int(1, MAX_SEED))
      recent.push(rearrangeForm({ level, seed }))
    }
    expect(new Set(recent).size).toBe(10)
  })
})

describe('Baukasten der Stufen 1 und 2', () => {
  const tasks = (level: Level) => Array.from({ length: 200 }, (_, i) => generateRearrangeTask({ level, seed: i + 1 }).task)
  const count = (side: Parameters<typeof subterms>[0], t: string) => subterms(side).filter((s) => s.kind === 'var' && s.name === t).length

  it('Stufe 1: die gesuchte Variable kommt genau einmal vor, mindestens drei Umformungen', () => {
    for (const t of tasks(1)) {
      expect(count(t.equation.lhs, t.target) + count(t.equation.rhs, t.target)).toBe(1)
      expect(solveEquation(t.equation, t.target)!.steps.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('Stufe 2: die gesuchte Variable kommt mehrfach vor oder steht im Nenner', () => {
    for (const t of tasks(2)) {
      const times = count(t.equation.lhs, t.target) + count(t.equation.rhs, t.target)
      const inDenominator = [t.equation.lhs, t.equation.rhs].some((side) => subterms(side).some((s) => s.kind === 'div' && contains(s.den, t.target)))
      expect(times >= 2 || inDenominator).toBe(true)
    }
  })

  it.each([1, 2] as Level[])('Stufe %i: meist nach x, manchmal nach einem anderen Buchstaben', (level) => {
    const letters = tasks(level).filter((t) => t.target !== 'x').length
    expect(letters).toBeGreaterThanOrEqual(20)
    expect(letters).toBeLessThanOrEqual(80)
  })
})
