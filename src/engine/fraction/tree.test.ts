import { describe, expect, it } from 'vitest'
import { checkFractionAnswer, prepareFractionCheck } from '../check/fractionAnswer.ts'
import { toLatex } from '../expr/print.ts'
import { planFraction } from '../guided/fractionPlan.ts'
import { fractionWrongAnswers } from './errorRules.ts'
import { fracEquals, fracOf } from './frac.ts'
import { polyConst } from './poly.ts'
import { rat } from '../rational.ts'
import { isPlayableTree, solveTree } from './solve.ts'
import { type FractionTask, type TreeNode, expanded, leaf, part, productNode, quotientNode, sumNode, taskLatex, term } from './task.ts'

const n = (nu: number, de = 1) => leaf(part(expanded(polyConst(nu)), expanded(polyConst(de))))
const tree = (root: TreeNode): Extract<FractionTask, { kind: 'tree' }> => ({ kind: 'tree', root, hints: [] })
const value = (nu: number, de = 1) => fracOf(polyConst(rat(nu, de)))

// 3/4 + 2/3 · 9/8, (5/6 − 3/4) : 7/12, 1/2 − (1/3 − 1/4), 0,75 + 5/6 − 2, −2/5 · (1/4 − 3/2) + 1
const dotFirst = tree(sumNode(term(1, n(3, 4)), term(1, productNode(n(2, 3), n(9, 8)))))
const bracketDivided = tree(quotientNode(sumNode(term(1, n(5, 6)), term(-1, n(3, 4))), n(7, 12)))
const minusBracket = tree(sumNode(term(1, n(1, 2)), term(-1, sumNode(term(1, n(1, 3)), term(-1, n(1, 4))))))
const decimal = tree(sumNode(term(1, leaf(part(expanded(polyConst(3)), expanded(polyConst(4))), '0,75')), term(1, n(5, 6)), term(-1, n(2))))
const minusFront = tree(sumNode(term(-1, productNode(n(2, 5), sumNode(term(1, n(1, 4)), term(-1, n(3, 2))))), term(1, n(1))))
// −(1/4 − 3/2) · 2/5: Das Ergebnis bekäme erst nach dem letzten Teil sein Minus; solche Aufgaben baut
// der Baukasten nicht
const minusOutside = tree(sumNode(term(-1, productNode(sumNode(term(1, n(1, 4)), term(-1, n(3, 2))), n(2, 5)))))

describe('Rechenbaum: Schreibweise, Wert, Teile', () => {
  it('schreibt die Aufgabe wie gestellt', () => {
    expect(taskLatex(dotFirst)).toBe('\\frac{3}{4} + \\frac{2}{3} \\cdot \\frac{9}{8}')
    expect(taskLatex(bracketDivided)).toBe('\\left(\\frac{5}{6} - \\frac{3}{4}\\right) : \\frac{7}{12}')
    expect(taskLatex(minusBracket)).toBe('\\frac{1}{2} - \\left(\\frac{1}{3} - \\frac{1}{4}\\right)')
    expect(taskLatex(decimal)).toBe('0{,}75 + \\frac{5}{6} - 2')
    expect(taskLatex(minusFront)).toBe('-\\frac{2}{5} \\cdot \\left(\\frac{1}{4} - \\frac{3}{2}\\right) + 1')
  })

  it('rechnet Teil für Teil: Punkt vor Strich, Klammern zuerst', () => {
    const cases: Array<[Extract<FractionTask, { kind: 'tree' }>, string, number, number]> = [
      [dotFirst, '\\frac{3}{2}', 2, 0],
      [bracketDivided, '\\frac{1}{7}', 1, 0],
      [minusBracket, '\\frac{5}{12}', 2, 0],
      [decimal, '-\\frac{5}{12}', 1, 1],
      [minusFront, '\\frac{3}{2}', 3, 0],
    ]
    for (const [t, result, stages, decimals] of cases) {
      const s = solveTree(t)
      expect(toLatex(s.result), taskLatex(t)).toBe(result)
      expect(s.stages.length, taskLatex(t)).toBe(stages)
      expect(s.steps.filter((x) => x.kind === 'decimal').length).toBe(decimals)
    }
  })

  it('typische Fehler: Punkt vor Strich, Klammer, Minus vor der Klammer, Dezimalzahl', () => {
    const ids = (t: FractionTask) => new Set(fractionWrongAnswers(t).map((w) => w.rule.id))
    // (3/4 + 2/3) · 9/8 = 51/32
    const order = fractionWrongAnswers(dotFirst).find((w) => w.rule.id === 'frac-order')!
    expect(fracEquals(order.value!, value(51, 32))).toBe(true)
    // (5/6 − 3/4) : 7/12 als 5/6 − 3/4 : 7/12
    expect(ids(bracketDivided)).toContain('frac-bracket-ignored')
    // 1/2 − 1/3 − 1/4 = −1/12
    const minus = fractionWrongAnswers(minusBracket).find((w) => w.rule.id === 'frac-minus-before-bracket')!
    expect(fracEquals(minus.value!, value(-1, 12))).toBe(true)
    expect(ids(decimal)).toContain('frac-decimal-places')
    // Fehler in einem Teil wird weitergerechnet: Kehrwert vergessen im Teil (5/6 − 3/4) : 7/12
    expect(ids(bracketDivided)).toContain('frac-reciprocal-forgotten')
  })
})

describe('Rechenbaum: geführt und frei', () => {
  for (const t of [dotFirst, bracketDivided, minusBracket, decimal, minusFront]) {
    it(taskLatex(t), () => {
      const plan = planFraction(t, { level: 1, seed: 7 })
      expect(plan.steps.length).toBeGreaterThan(0)
      for (const step of plan.steps) {
        expect(step.choices.filter((c) => c.correct), step.question).toHaveLength(1)
        expect(step.choices.length, step.question).toBeGreaterThanOrEqual(2)
        expect(step.choices.length).toBeLessThanOrEqual(4)
        for (const c of step.choices.filter((x) => !x.correct)) expect(c.whyWrong, `${step.question}: ${c.content}`).toBeDefined()
      }
      expect(plan.steps.at(-1)!.choices.find((c) => c.correct)!.content).toBe(`$${toLatex(plan.result)}$`)
      const context = prepareFractionCheck(t)
      expect(checkFractionAnswer(context, toLatex(plan.result)).kind).toBe('correct')
    })
  }

  it('ein Minus, das erst nach dem letzten Teil dazukommt, ist nicht spielbar', () => {
    expect(isPlayableTree(minusOutside)).toBe(false)
    for (const t of [dotFirst, bracketDivided, minusBracket, decimal, minusFront]) expect(isPlayableTree(t)).toBe(true)
  })

  it('fragt nach der Reihenfolge, wenn Punkt vor Strich oder eine Klammer zählt', () => {
    const first = (t: FractionTask) => planFraction(t, { level: 1, seed: 1 }).steps[0]
    expect(first(dotFirst).question).toBe('Was rechnest du zuerst?')
    expect(first(dotFirst).choices.find((c) => c.correct)!.content).toBe('$\\frac{2}{3} \\cdot \\frac{9}{8}$')
    expect(first(dotFirst).choices.map((c) => c.content)).toContain('$\\frac{3}{4} + \\frac{2}{3}$')
    expect(first(minusBracket).question).toBe('Was rechnest du zuerst?')
    expect(first(minusBracket).choices.map((c) => c.content)).toContain('$\\frac{1}{2} - \\frac{1}{3}$')
    expect(first(bracketDivided).question).not.toBe('Was rechnest du zuerst?')
    expect(first(decimal).question).toBe('Schreibe $0{,}75$ als gekürzten Bruch.')
  })
})
