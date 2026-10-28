import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { CHECK_POINTS, arbExpr, closeEnough, reliableValue } from './arbitraries.ts'
import { key } from './compare.ts'
import { evaluate } from './evaluate.ts'
import { finalForm } from './finalForm.ts'
import { normalize } from './normalize.ts'
import { toLatex } from './print.ts'
import { type Expr, add, cos, div, exp, ln, mul, neg, num, pow, sin, sub, x } from './types.ts'

const x2 = pow(x, num(2))

describe('Endform: feste Beispiele', () => {
  it.each<[string, Expr, string]>([
    ['klammert e^x aus', add(mul(num(2), x, exp(x)), mul(x2, exp(x))), '(x^{2} + 2x)e^{x}'],
    ['klammert x² aus, wenn eine Zahl übrig bleibt', add(mul(num(3), x2, ln(x)), x2), 'x^{2}(3\\ln x + 1)'],
    ['lässt 2x sin x + x² cos x stehen', add(mul(num(2), x, sin(x)), mul(x2, cos(x))), 'x^{2}\\cos x + 2x\\sin x'],
    [
      'klammert bei reinen Potenzen nichts aus',
      sub(mul(num(3, 2), x), mul(num(5), pow(x, num(1, 4)))),
      '\\frac{3}{2}x - 5\\sqrt[4]{x}',
    ],
    ['multipliziert Zahl mal Klammer aus', mul(num(-3), sub(mul(num(3), x2, cos(x)), mul(pow(x, num(3)), sin(x)))), '3x^{3}\\sin x - 9x^{2}\\cos x'],
    [
      'multipliziert nach dem Ausklammern aus',
      sub(mul(num(2), x, exp(x2), add(x, num(3))), exp(x2)),
      '(2x^{2} + 6x - 1)e^{x^{2}}',
    ],
    [
      'klammert e^(x²) aus',
      sub(mul(num(2), x, exp(x2), cos(x)), mul(exp(x2), sin(x))),
      '(2x\\cos x - \\sin x)e^{x^{2}}',
    ],
    [
      'kürzt x gegen den Nenner',
      div(sub(mul(div(num(1), x), x2), mul(ln(x), num(2), x)), pow(x2, num(2))),
      '\\frac{1 - 2\\ln x}{x^{3}}',
    ],
    [
      'multipliziert Polynome im Zähler aus',
      div(sub(mul(num(3), x2, add(x2, num(9))), mul(pow(x, num(3)), num(2), x)), pow(add(x2, num(9)), num(2))),
      '\\frac{x^{4} + 27x^{2}}{(x^{2} + 9)^{2}}',
    ],
    ['klammert reine Polynome nicht aus', add(mul(num(12), x2), mul(num(4), x)), '12x^{2} + 4x'],
    [
      'zieht Minus vor den Bruch',
      div(sub(neg(mul(sin(x), x2)), mul(cos(x), num(2), x)), pow(x2, num(2))),
      '-\\frac{x\\sin x + 2\\cos x}{x^{3}}',
    ],
    ['schreibt 1 - 2x² statt -2x² + 1', mul(sub(num(1), mul(num(2), x2)), exp(neg(x2))), '(1 - 2x^{2})e^{-x^{2}}'],
    ['lässt Polynom mit negativer Zahl absteigend', sub(neg(x2), num(3)), '-x^{2} - 3'],
    ['ln x + 1 ausgeklammert', add(mul(pow(x, x), ln(x)), pow(x, x)), 'x^{x}(\\ln x + 1)'],
  ])('%s', (_name, expr, expected) => {
    expect(toLatex(finalForm(expr))).toBe(expected)
  })
})

describe('Endform: Eigenschaften für zufällige Terme', () => {
  it('ändert den Wert nicht', () => {
    fc.assert(
      fc.property(arbExpr, (e) => {
        const f = finalForm(e)
        for (const value of CHECK_POINTS) {
          const original = reliableValue(e, value)
          if (original === null) continue
          const result = evaluate(f, { x: value })
          if (!closeEnough(original, result)) {
            throw new Error(`x = ${value}: ${toLatex(e)} = ${original}, Endform ${toLatex(f)} = ${result}`)
          }
        }
      }),
      { numRuns: 3000 },
    )
  })

  it('ist beim zweiten Mal schon fertig', () => {
    fc.assert(
      fc.property(arbExpr, (e) => {
        fc.pre(CHECK_POINTS.some((value) => !Number.isNaN(evaluate(e, { x: value }))))
        const once = finalForm(e)
        expect(key(normalize(finalForm(once)))).toBe(key(normalize(once)))
      }),
      { numRuns: 2000 },
    )
  })
})
