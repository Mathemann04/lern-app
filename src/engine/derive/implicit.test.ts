import { describe, expect, it } from 'vitest'
import { numericImplicitDerivative } from '../check/curve.ts'
import { compareValues } from '../check/numeric.ts'
import { evaluate } from '../expr/evaluate.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { add, asRational, eq, exp, mul, num, pow, sin, x, y } from '../expr/types.ts'
import { generateDerivativeTask } from '../tasks/derivativeTerms.ts'
import { deriveImplicit, implicitCurvePoints, implicitResult, solveMistakes, sortedEquation } from './implicit.ts'

describe('Implizites Ableiten: Beispiele', () => {
  it.each([
    [eq(add(pow(x, num(2)), pow(y, num(2))), num(25)), "2x + 2yy' = 0", '-\\frac{x}{y}'],
    [eq(add(mul(x, y), exp(y)), num(1)), "y + xy' + y'e^{y} = 0", '-\\frac{y}{x + e^{y}}'],
    [eq(add(pow(x, num(3)), pow(y, num(3))), mul(num(3), x, y)), "3x^{2} + 3y^{2}y' = 3y + 3xy'", '\\frac{-x^{2} + y}{y^{2} - x}'],
    [eq(sin(mul(x, y)), x), "(y + xy')\\cos(xy) = 1", '\\frac{1 - y\\cos(xy)}{x\\cos(xy)}'],
  ])('%#: abgeleitet und nach y\' aufgelöst', (equation, differentiated, result) => {
    const d = deriveImplicit(equation)
    expect(equationToLatex(d.differentiated)).toBe(differentiated)
    expect(toLatex(implicitResult(d))).toBe(result)
  })

  it('sortiert für die Erklärung: y\' ausgeklammert auf einer Seite', () => {
    expect(equationToLatex(sortedEquation(deriveImplicit(eq(add(mul(x, y), exp(y)), num(1)))))).toBe("(x + e^{y})y' = -y")
  })
})

describe('Implizites Ableiten: alle Aufgaben', () => {
  const tasks = Array.from({ length: 300 }, (_, i) => i + 1).flatMap((seed) => {
    const { task } = generateDerivativeTask({ level: 5, seed })
    return task.kind === 'implicit' ? [{ seed, equation: task.equation }] : []
  })

  it('gibt es in Stufe 5', () => {
    expect(tasks.length).toBeGreaterThan(40)
  })

  it('Ergebnis stimmt auf der Kurve mit der numerischen Steigung überein', () => {
    for (const { seed, equation } of tasks) {
      const d = deriveImplicit(equation)
      const result = implicitResult(d)
      const context = `5-${seed}: ${equationToLatex(equation)} → y' = ${toLatex(result)}`
      expect(latexProblem(toLatex(result)), context).toBeNull()
      // keine ausgearteten Kurven wie (x + y)² = 4 mit y' = −1: y' hängt von x oder y ab
      expect(asRational(result), context).toBeNull()
      expect(latexProblem(equationToLatex(d.differentiated), { checkUgly: false }), context).toBeNull()
      let compared = 0
      for (const point of implicitCurvePoints(equation, `test:${seed}`, 25)) {
        const slope = numericImplicitDerivative(equation, point.x, point.y)
        if (slope === null) continue
        const exact = evaluate(result, point)
        expect(Math.abs(exact - slope), `${context} bei (${point.x}, ${point.y})`).toBeLessThanOrEqual(1e-5 * Math.max(1, Math.abs(exact)))
        compared++
      }
      expect(compared, context).toBeGreaterThanOrEqual(10)
    }
  })

  it('Fehler beim Auflösen unterscheiden sich auf der Kurve von der Lösung', () => {
    for (const { seed, equation } of tasks) {
      const d = deriveImplicit(equation)
      const points = implicitCurvePoints(equation, `test:${seed}`, 30)
      const mistakes = solveMistakes(d, points)
      expect(mistakes.map((m) => m.mistake), `5-${seed}`).toContain('sign')
      for (const { mistake, result } of mistakes) {
        const { compared, differing } = compareValues(implicitResult(d), result, points)
        expect(differing / compared, `5-${seed} ${mistake}`).toBeGreaterThanOrEqual(0.25)
      }
    }
  })
})
