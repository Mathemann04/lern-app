import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { toLatex } from '../expr/print.ts'
import { type Expr, add, cos, exp, mul, num, pow, sin, sqrt, sub, variable, x } from '../expr/types.ts'
import { FRACTION_ERROR_RULES, fractionWrongAnswers } from './errorRules.ts'
import { toFrac } from './frac.ts'
import { type Poly, polyDivideExact } from './poly.ts'
import { type BlockRule, type FractionShape, type FractionTask, type Part, binomialShown, expanded, minus, part, plus } from './task.ts'

const a = variable('a')
const b = variable('b')

function poly(e: Expr): Poly {
  const f = toFrac(e)!
  return polyDivideExact(f.num, f.den)!
}

// Bruch aus zwei Termen ohne Bruch; ascending: Zähler bzw. Nenner mit kleinstem Grad zuerst
const fr = (n: Expr, d: Expr = num(1), ascendingDen = false): Part => part(expanded(poly(n)), expanded(poly(d), ascendingDen))
const task = (s: FractionShape, rule?: BlockRule): FractionTask => ({ ...s, hints: [], ...(rule ? { rule } : {}) }) as FractionTask
const x2 = pow(x, num(2))

type Case = [id: string, task: FractionTask, what: 'step' | 'result', latex: string]

// Die Beispiele aus dem Fehlerkatalog in docs/PLAN-M2.md
const CASES: Case[] = [
  ['frac-add-across', task({ kind: 'sum', terms: [plus(fr(num(1), num(2))), plus(fr(num(1), num(3)))] }), 'result', '\\frac{2}{5}'],
  ['frac-expand-denominator-only', task({ kind: 'sum', terms: [plus(fr(num(1), num(2))), plus(fr(num(1), num(3)))] }), 'step', '\\frac{1}{6} + \\frac{1}{6}'],
  [
    'frac-minus-bracket',
    task({ kind: 'sum', terms: [plus(fr(num(3), sub(x, num(1)))), minus(fr(num(2), add(x, num(1))))] }),
    'step',
    '\\frac{x + 1}{(x - 1)(x + 1)}',
  ],
  ['frac-whole-not-expanded', task({ kind: 'sum', terms: [plus(fr(num(1))), plus(fr(num(2), x))] }), 'result', '\\frac{3}{x}'],
  ['frac-lcd-gcd', task({ kind: 'sum', terms: [plus(fr(num(1), num(4))), plus(fr(num(1), num(6)))] }), 'step', '2'],
  ['frac-lcd-sum', task({ kind: 'sum', terms: [plus(fr(num(1), sub(x, num(1)))), plus(fr(num(1), add(x, num(1))))] }), 'step', '2x'],
  ['frac-lcd-factor-missing', task({ kind: 'sum', terms: [plus(fr(num(1), x2)), plus(fr(num(1), add(x2, x)))] }), 'step', 'x(x + 1)'],
  [
    'frac-expand-own-denominator',
    task({ kind: 'sum', terms: [plus(fr(num(3), sub(x, num(1)))), minus(fr(num(2), add(x, num(1))))] }),
    'step',
    '\\frac{3(x - 1)}{(x - 1)(x + 1)} - \\frac{2(x + 1)}{(x - 1)(x + 1)}',
  ],
  // 3(x + 1) → 3x + 1 und 2(x − 1) → 2x − 1, zusammen 5x
  [
    'frac-distribute-first-only',
    task({ kind: 'sum', terms: [plus(fr(num(3), sub(x, num(1)))), plus(fr(num(2), add(x, num(1))))] }),
    'step',
    '\\frac{5x}{(x - 1)(x + 1)}',
  ],
  ['frac-number-times-both', task({ kind: 'product', left: fr(num(3)), right: fr(num(2), num(5)) }), 'step', '\\frac{3 \\cdot 2}{3 \\cdot 5}'],
  ['frac-reciprocal-forgotten', task({ kind: 'quotient', left: fr(num(3), num(4)), right: fr(num(2), num(5)) }), 'step', '\\frac{3}{4} \\cdot \\frac{2}{5}'],
  ['frac-reciprocal-first', task({ kind: 'quotient', left: fr(num(3), num(4)), right: fr(num(2), num(5)) }), 'step', '\\frac{4}{3} \\cdot \\frac{2}{5}'],
  [
    'frac-complex-times-denominator',
    task({ kind: 'complex', top: [plus(fr(num(1), num(2)))], bottom: [plus(fr(num(3), num(4)))] }),
    'step',
    '\\frac{1}{2} \\cdot \\frac{3}{4}',
  ],
  ['frac-complex-number-up', task({ kind: 'complex', top: [plus(fr(a, b))], bottom: [plus(fr(x))] }), 'result', '\\frac{ax}{b}'],
  ['frac-cancel-one-summand', task({ kind: 'reduce', part: fr(add(mul(num(2), x), num(6)), num(2)) }), 'result', 'x + 6'],
  ['frac-cancel-in-sum', task({ kind: 'reduce', part: fr(add(x2, num(1)), x) }), 'result', 'x + 1'],
  [
    'frac-cancel-forgot-one',
    task({ kind: 'reduce', part: fr(add(x, num(1)), mul(add(x, num(1)), sub(x, num(2)))) }),
    'result',
    'x - 2',
  ],
  ['frac-cancel-sign', task({ kind: 'reduce', part: fr(sub(x, num(1)), sub(num(1), x), true) }), 'result', '1'],
  ['frac-power-reversed', task({ kind: 'reduce', part: fr(x2, pow(x, num(5))) }), 'result', 'x^{3}'],
  ['frac-power-divided', task({ kind: 'reduce', part: fr(pow(x, num(6)), x2) }), 'result', 'x^{3}'],
  [
    'frac-factor-wrong',
    task({ kind: 'reduce', part: fr(sub(x2, num(9)), add(mul(num(2), x), num(6))) }),
    'step',
    '\\frac{(x + 3)(x - 3)}{2(x + 6)}',
  ],
  ['frac-binomial-confused', task({ kind: 'reduce', part: fr(sub(x2, num(9)), add(mul(num(2), x), num(6))) }), 'step', '\\frac{(x - 3)^{2}}{2x + 6}'],
  ['frac-vieta-sign', task({ kind: 'reduce', part: fr(sub(sub(x2, x), num(6)), sub(x2, num(9))) }), 'step', '\\frac{(x - 2)(x + 3)}{x^{2} - 9}'],
  ['frac-cancel-one-side', task({ kind: 'reduce', part: fr(num(14), num(12)) }), 'result', '\\frac{7}{12}'],
  ['frac-multiply-reciprocal', task({ kind: 'product', left: fr(num(3), num(4)), right: fr(num(2), num(5)) }), 'step', '\\frac{3 \\cdot 5}{4 \\cdot 2}'],
  // Stufe 5: 1 − cos² x = sin x statt sin² x
  [
    'frac-square-forgotten',
    task({ kind: 'reduce', part: part(expanded(poly(sub(num(1), pow(cos(x), num(2)))), true), expanded(poly(sin(x)))) }, { kind: 'trig', prefer: 'S', target: 'num' }),
    'step',
    '\\frac{\\sin x}{\\sin x}',
  ],
  // (√x + 1)² − 1 = x + 1 − 1 = x
  [
    'frac-binomial-middle',
    task({ kind: 'reduce', part: part(binomialShown(poly(add(sqrt(x), num(1))), poly(num(1))), expanded(poly(sqrt(x)))) }),
    'step',
    '\\frac{x}{\\sqrt{x}}',
  ],
  ['frac-cancel-inside', task({ kind: 'reduce', part: fr(exp(mul(num(2), x)), exp(x)) }), 'result', 'e^{2}'],
]

describe('Zähler und Nenner addiert', () => {
  it('im geführten Modus nach dem Erweitern, im freien Modus auch ohne Hauptnenner', () => {
    const wrong = fractionWrongAnswers(task({ kind: 'sum', terms: [plus(fr(num(3), num(4))), plus(fr(num(5), num(6)))] })).filter((w) => w.rule.id === 'frac-add-across')
    expect(wrong.map((w) => [toLatex(w.stepExpr), w.freeOnly ?? false])).toEqual([
      ['\\frac{19}{24}', false],
      ['\\frac{4}{5}', true],
    ])
  })
})

describe('Fehlerkatalog Brüche: Beispiele', () => {
  it.each(CASES)('%s', (id, t, what, latex) => {
    const wrong = fractionWrongAnswers(t).filter((w) => w.rule.id === id)
    const shown = wrong.map((w) => (what === 'step' ? toLatex(w.stepExpr) : w.result && toLatex(w.result)))
    expect(shown).toContain(latex)
  })

  it('hat für jede Fehlerregel ein Beispiel', () => {
    expect(FRACTION_ERROR_RULES.map((r) => r.id).sort()).toEqual([...new Set(CASES.map(([id]) => id))].sort())
  })

  it('setzt Namen und Katalogbeispiele sauber', () => {
    for (const rule of FRACTION_ERROR_RULES) {
      expect(latexProblem(rule.wrongFormula, { checkUgly: false }), rule.id).toBeNull()
      expect(rule.id.startsWith('frac-'), rule.id).toBe(true)
    }
  })
})
