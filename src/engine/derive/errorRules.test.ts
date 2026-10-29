import { describe, expect, it } from 'vitest'
import { compareValues } from '../check/numeric.ts'
import { parseRichText } from '../explain/richText.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { sampleEnvs, samplePoints } from '../expr/sample.ts'
import {
  type Equation,
  type Expr,
  add,
  eq,
  cos,
  div,
  exp,
  fn,
  ln,
  log,
  mul,
  num,
  pow,
  sin,
  sqrt,
  sub,
  tan,
  x,
  y,
} from '../expr/types.ts'
import { createRng } from '../random/rng.ts'
import { generateDerivativeTask } from '../tasks/derivativeTerms.ts'
import { LEVELS } from '../tasks/taskNumber.ts'
import { allNodes, derive } from './derive.ts'
import { deriveImplicit, implicitWrongAnswers } from './implicit.ts'
import { ERROR_RULES, wrongAnswers } from './errorRules.ts'

const x2 = pow(x, num(2))

// Die Beispiele aus dem Fehlerkatalog in docs/PLAN-M1.md
describe('Fehlerkatalog: Beispiele', () => {
  it.each<[string, Expr, string]>([
    ['power-exponent-not-reduced', pow(x, num(3)), '3x^{3}'],
    ['power-negative-wrong-direction', pow(x, num(-2)), '-\\frac{2}{x}'],
    ['power-sign-forgotten', div(num(1), x), '\\frac{1}{x^{2}}'],
    ['power-root-factor-forgotten', sqrt(x), '\\frac{1}{\\sqrt{x}}'],
    ['power-fraction-numerator-only', pow(x, num(2, 3)), '\\frac{2}{3}\\sqrt[3]{x}'],
    ['power-exponent-not-multiplied', pow(x, num(3)), 'x^{2}'],
    ['factor-forgotten', mul(num(5), pow(x, num(3))), '3x^{2}'],
    ['constant-summand-kept', add(x2, num(5)), '2x + 5'],
    ['exp-power-rule', exp(x), 'xe^{x - 1}'],
    ['sin-sign', sin(x), '-\\cos x'],
    ['cos-sign', cos(x), '\\sin x'],
    ['ln-like-exp', ln(x), '\\ln x'],
    ['ln-reciprocal-of-ln', ln(x), '\\frac{1}{\\ln x}'],
    ['product-derivatives-multiplied', mul(x2, exp(x)), '2xe^{x}'],
    ['product-second-summand-missing', mul(x2, sin(x)), '2x\\sin x'],
    ['product-minus', mul(x2, exp(x)), '(-x^{2} + 2x)e^{x}'],
    ['quotient-numerator-swapped', div(sin(x), x), '\\frac{\\sin x - x\\cos x}{x^{2}}'],
    ['quotient-denominator-not-squared', div(sin(x), x), '\\frac{x\\cos x - \\sin x}{x}'],
    ['quotient-separately', div(sin(x), x), '\\cos x'],
    ['chain-inner-forgotten', sin(mul(num(3), x)), '\\cos(3x)'],
    ['chain-outer-wrong-argument', sin(mul(num(3), x)), '3\\cos x'],
    ['chain-inner-derivative-substituted', sin(x2), '\\cos(2x)'],
    ['chain-times-inner-function', exp(x2), 'x^{2}e^{x^{2}}'],
    ['notation-power-on-name', pow(sin(x), num(2)), '2x\\cos(x^{2})'],
    ['exp-base-power-rule', pow(num(2), x), 'x \\cdot 2^{x - 1}'],
    ['exp-base-ln-forgotten', pow(num(2), x), '2^{x}'],
    ['log-base-ln-forgotten', log(num(2), x), '\\frac{1}{x}'],
    ['tan-sin-cos-swapped', tan(x), '\\frac{1}{\\sin^{2} x}'],
    ['arctan-sign', fn('arctan', x), '\\frac{1}{1 - x^{2}}'],
    ['arctan-arcsin', fn('arctan', x), '\\frac{1}{\\sqrt{1 - x^{2}}}'],
    ['logarithmic-power-rule', pow(x, x), 'x^{x}'],
    ['logarithmic-as-exponential', pow(x, x), 'x^{x}\\ln x'],
    ['arccos-sign', fn('arccos', x), '\\frac{1}{\\sqrt{1 - x^{2}}}'],
    ['cosh-sign', fn('cosh', x), '-\\sinh x'],
    ['logarithmic-factor-forgotten', pow(x, x), '\\ln x + 1'],
    ['sinh-sign', fn('sinh', x), '-\\cosh x'],
    ['tanh-like-tan', fn('tanh', x), '\\frac{1}{\\cos^{2} x}'],
    ['tanh-sinh-cosh-swapped', fn('tanh', x), '\\frac{1}{\\sinh^{2} x}'],
    ['arcsin-arccos', fn('arcsin', x), '-\\frac{1}{\\sqrt{1 - x^{2}}}'],
    ['arcsin-root-sign', fn('arcsin', x), '\\frac{1}{\\sqrt{x^{2} + 1}}'],
    ['arsinh-arcosh', fn('arsinh', x), '\\frac{1}{\\sqrt{x^{2} - 1}}'],
    ['arcosh-arsinh', fn('arcosh', x), '\\frac{1}{\\sqrt{x^{2} + 1}}'],
    ['artanh-arctan', fn('artanh', x), '\\frac{1}{x^{2} + 1}'],
  ])('%s', (id, expr, expected) => {
    const answers = wrongAnswers(expr).filter((w) => w.errorRule.id === id || w.alsoMatches.some((r) => r.id === id))
    expect(answers.map((w) => toLatex(w.result))).toContain(expected)
  })

  // Implizites Ableiten: die abgeleitete Gleichung mit dem Fehler
  it.each<[string, Equation, string]>([
    ['implicit-y-constant', eq(add(x2, pow(y, num(2))), num(4)), '2x = 0'],
    ['implicit-y-prime-forgotten', eq(add(mul(x, y), exp(y)), num(5)), "x + y + y'e^{y} = 0"],
    ['implicit-x-as-constant', eq(add(mul(x, y), exp(y)), num(5)), "xy' + y'e^{y} = 0"],
    ['implicit-constant-side-kept', eq(add(x2, pow(y, num(2))), num(4)), "2x + 2yy' = 4"],
  ])('%s', (id, equation, expected) => {
    const answers = implicitWrongAnswers(equation).filter((w) => w.errorRule.id === id || w.alsoMatches.some((r) => r.id === id))
    expect(answers.map((w) => equationToLatex(w.differentiated))).toContain(expected)
  })

  it('deckt jede Fehlerregel mit einem Beispiel ab', () => {
    // Schutz davor, eine neue Regel ohne Beispiel hinzuzufügen
    expect(ERROR_RULES.length).toBe(47)
  })

  it('setzt Zeichen in den Namen als Formel: kein einzelnes x, y oder „ln a" als Text', () => {
    for (const rule of ERROR_RULES) {
      for (const segment of parseRichText(rule.name).flat()) {
        if (segment.kind === 'math') expect(latexProblem(segment.latex, { checkUgly: false }), rule.id).toBeNull()
        else expect(segment.text, rule.id).not.toMatch(/(^|\s)([xy]|ln)(\s|$)/)
      }
    }
  })
})

describe('falsche Ergebnisse aller Aufgaben', () => {
  const seen = new Set<string>()

  describe.each(LEVELS)('Stufe %i', (level) => {
    it('sind nie zufällig richtig, untereinander verschieden und meist zahlreich', () => {
      let tasks = 0
      let withTwoOrMore = 0
      for (let seed = 1; seed <= 150; seed++) {
        const { task } = generateDerivativeTask({ level, seed })
        if (task.kind !== 'function') continue
        tasks++
        const correct = derive(task.expr)
        const answers = wrongAnswers(task.expr, correct)
        // Ergebnisse sauber gesetzt; eingesetzte Formeln dürfen „+ 0" oder „1 · …" zeigen
        for (const r of [correct.result, ...answers.map((w) => w.result)]) {
          expect(latexProblem(toLatex(r)), `${level}-${seed}`).toBeNull()
        }
        for (const node of allNodes(correct)) {
          expect(latexProblem(toLatex(node.formula), { checkUgly: false }), `${level}-${seed}`).toBeNull()
        }
        if (answers.length >= 2) withTwoOrMore++
        // Gegenprobe mit eigenen, unabhängigen Prüfstellen
        const points = samplePoints([task.expr, correct.result], createRng(`gegenprobe:${seed}`), 60)
        for (const [i, w] of answers.entries()) {
          seen.add(w.errorRule.id)
          for (const r of w.alsoMatches) seen.add(r.id)
          const vsCorrect = compareValues(correct.result, w.result, points)
          const context = `${level}-${seed}: ${toLatex(task.expr)} → ${toLatex(w.result)} (${w.errorRule.id})`
          expect(vsCorrect.compared, context).toBeGreaterThanOrEqual(8)
          expect(vsCorrect.differing / vsCorrect.compared, context).toBeGreaterThanOrEqual(0.25)
          for (const other of answers.slice(i + 1)) {
            const vsOther = compareValues(w.result, other.result, points)
            expect(vsOther.differing, `${context} gleicht ${toLatex(other.result)}`).toBeGreaterThan(0)
          }
        }
      }
      expect(withTwoOrMore / tasks).toBeGreaterThanOrEqual(0.9)
    })
  })

  it('implizites Ableiten: falsche abgeleitete Gleichungen unterscheiden sich von der richtigen', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { task } = generateDerivativeTask({ level: 5, seed })
      if (task.kind !== 'implicit') continue
      const correct = deriveImplicit(task.equation)
      const answers = implicitWrongAnswers(task.equation, correct)
      expect(answers.length, `5-${seed}`).toBeGreaterThanOrEqual(3)
      const points = sampleEnvs([task.equation.lhs, task.equation.rhs], createRng(`gegenprobe:${seed}`), 40, ['x', 'y', "y'"])
      const difference = (e: Equation) => sub(e.lhs, e.rhs)
      for (const w of answers) {
        seen.add(w.errorRule.id)
        for (const r of w.alsoMatches) seen.add(r.id)
        const context = `5-${seed}: ${equationToLatex(w.differentiated)} (${w.errorRule.id})`
        expect(latexProblem(equationToLatex(w.differentiated), { checkUgly: false }), context).toBeNull()
        const vsCorrect = compareValues(difference(correct.differentiated), difference(w.differentiated), points)
        expect(vsCorrect.differing / vsCorrect.compared, context).toBeGreaterThanOrEqual(0.25)
      }
    }
  })

  it('nutzt jede Fehlerregel in mindestens einer Aufgabe', () => {
    const unused = ERROR_RULES.map((r) => r.id).filter((id) => !seen.has(id))
    expect(unused).toEqual([])
  })
})
