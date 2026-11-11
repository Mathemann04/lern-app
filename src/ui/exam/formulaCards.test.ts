import { describe, expect, it } from 'vitest'
import { cardById } from '../../engine/explain/cards.ts'
import { latexProblem } from '../../engine/expr/latexChecks.ts'
import { courseById } from '../catalog.ts'
import { FORMULA_CARDS } from './formulaCards.ts'

// Formelsammlung der Probeklausur (S9b)
describe('Formelsammlung', () => {
  it('jede Karte gibt es, sie hat Formeln, die sich setzen lassen, und gehört zu einem Chemie-Thema', () => {
    expect(new Set(FORMULA_CARDS).size).toBe(FORMULA_CARDS.length)
    for (const id of FORMULA_CARDS) {
      const card = cardById(id)
      expect(card, id).toBeDefined()
      expect(card!.formulas.length, id).toBeGreaterThan(0)
      for (const tex of card!.formulas) expect(latexProblem(tex, { checkUgly: false }), `${id}: ${tex}`).toBeNull()
      expect(courseById(card!.topic)?.subject.id, id).toBe('chemie')
    }
  })
})
