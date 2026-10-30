import { describe, expect, it } from 'vitest'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { type Expr, eq } from '../expr/types.ts'
import { parseLatex } from '../parse/latex.ts'
import { REARRANGE_ERROR_RULES, rearrangeWrongAnswers } from './errorRules.ts'
import { solveEquation } from './isolate.ts'

const p = (latex: string): Expr => {
  const r = parseLatex(latex)
  if (!r.ok) throw new Error(r.message)
  return r.expr
}

function wrongs(lhs: string, rhs: string, target = 'x') {
  const task = { equation: eq(p(lhs), p(rhs)), target, conditions: [] }
  return rearrangeWrongAnswers(task, solveEquation(task.equation, target)!)
}

// Katalogbeispiele (docs/PLAN-M3.md): Aufgabe, Fehlerregel, falsche Gleichung nach dem Schritt bzw.
// falsches Ergebnis. Die Engine muss genau das Beispiel liefern.
const CATALOG: Array<{ id: string; lhs: string; rhs: string; target?: string; after?: string; result?: string }> = [
  { id: 'eq-sign-not-flipped', lhs: 'y', rhs: 'x+b', result: 'y + b' },
  { id: 'eq-inverse-op', lhs: 'y', rhs: 'ax', result: 'ay' },
  { id: 'eq-divide-one-term', lhs: 'ax', rhs: 'y+b', after: 'x = \\frac{y}{a} + b' },
  { id: 'eq-fraction-flipped', lhs: 'y', rhs: '\\frac{a}{x}', result: '\\frac{y}{a}' },
  { id: 'eq-denominator-bracket', lhs: 'y', rhs: '\\frac{2x+1}{x-3}', after: 'xy - 3 = 2x + 1' },
  { id: 'eq-bracket-first-term', lhs: 'a(x+b)', rhs: 'c(x-d)', after: 'ax + b = cx - cd' },
  { id: 'eq-factor-one-lost', lhs: 'xy-x', rhs: '3y+1', after: 'xy = 3y + 1' },
  { id: 'eq-reciprocal-termwise', lhs: '\\frac{1}{x}+\\frac{1}{a}', rhs: '\\frac{1}{b}', target: 'a', after: 'a = b - x' },
  { id: 'eq-root-termwise', lhs: 'x^2', rhs: 'b^2-\\frac{y^2}{a^2}', after: 'x = b - \\frac{y}{a}' },
  { id: 'eq-square-one-factor', lhs: '\\frac{y}{a}', rhs: '\\sqrt{b^2-x^2}', after: '\\frac{y^{2}}{a} = b^{2} - x^{2}' },
  { id: 'eq-square-middle', lhs: '\\left(y+\\sqrt{x}\\right)^2', rhs: 'x+a', after: 'y^{2} + x = x + a' },
]

describe('Katalog der Fehlerregeln', () => {
  it('jede Regel hat ein Katalogbeispiel', () => {
    expect(CATALOG.map((c) => c.id).sort()).toEqual(REARRANGE_ERROR_RULES.map((r) => r.id).sort())
  })

  for (const c of CATALOG) {
    it(`${c.id}: ${c.lhs} = ${c.rhs}`, () => {
      const found = wrongs(c.lhs, c.rhs, c.target).filter((w) => w.rule.id === c.id)
      expect(found.length, `${c.id} kommt nicht vor`).toBeGreaterThan(0)
      if (c.after) expect(found.map((w) => equationToLatex(w.after))).toContain(c.after)
      if (c.result) expect(found.map((w) => (w.result ? toLatex(w.result) : null))).toContain(c.result)
    })
  }

  it('Fehler beim Zusammenfassen kommen aus „Brüche"', () => {
    const ids = wrongs('y', '\\frac{3(x-a)}{b}+c').map((w) => w.rule.id)
    expect(ids).toContain('frac-whole-not-expanded')
  })

  it('keine falsche Antwort, die doch stimmt oder keine Lösung hat', () => {
    const all = wrongs('\\frac{1}{x}+\\frac{1}{a}', '\\frac{1}{b}', 'a')
    expect(all.map((w) => equationToLatex(w.after))).not.toContain('\\frac{1}{a} = 0')
  })
})
