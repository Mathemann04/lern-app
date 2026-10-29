import { describe, expect, it } from 'vitest'
import { toLatex } from '../expr/print.ts'
import { type Expr, add, div, exp, mul, neg, num, pow, sin, sub, variable, x } from '../expr/types.ts'
import { rat } from '../rational.ts'
import { type Frac, fracEquals, polyExpr, toFrac } from './frac.ts'
import { factorize, factoredExpr, factoredLcm, isMultipleOf, reduceFrac, reducedExpr, reducedFrac } from './factor.ts'
import { type Poly, gcdUnivariate, polyAtom, polyConst, polyDivideExact, polyEquals, polyMul, polySub } from './poly.ts'

const a = variable('a')
const b = variable('b')

// Polynom aus einem Term (nur für Tests: Term ohne Bruch)
function poly(e: Expr): Poly {
  const f = toFrac(e)!
  return polyDivideExact(f.num, f.den)!
}

const frac = (e: Expr): Frac => toFrac(e)!

describe('Polynome', () => {
  it('rechnen exakt und sortieren nach fallendem Grad', () => {
    const p = polyMul(poly(add(x, num(3))), poly(sub(x, num(3))))
    expect(toLatex(polyExpr(p))).toBe('x^{2} - 9')
    expect(toLatex(polyExpr(poly(sub(num(9), pow(x, num(2)))), 'ascending'))).toBe('9 - x^{2}')
    expect(toLatex(polyExpr(poly(add(pow(b, num(2)), mul(a, b), pow(a, num(2))))))).toBe('a^{2} + ab + b^{2}')
  })

  it('teilen genau, auch mit mehreren Buchstaben', () => {
    const q = polyDivideExact(poly(sub(pow(a, num(2)), pow(b, num(2)))), poly(add(a, b)))
    expect(q && toLatex(polyExpr(q))).toBe('a - b')
    expect(polyDivideExact(poly(add(pow(x, num(2)), num(1))), poly(add(x, num(1))))).toBeNull()
  })

  it('finden den größten gemeinsamen Teiler bei einem Buchstaben', () => {
    const g = gcdUnivariate(poly(sub(pow(x, num(2)), num(1))), poly(add(pow(x, num(2)), mul(num(2), x), num(1))))
    expect(g && toLatex(polyExpr(g))).toBe('x + 1')
  })
})

describe('Zerlegen', () => {
  it.each<[string, Expr, string]>([
    ['dritte binomische Formel', sub(pow(x, num(2)), num(9)), '(x + 3)(x - 3)'],
    ['Zahl ausklammern', add(mul(num(2), x), num(6)), '2(x + 3)'],
    ['Zahl und x ausklammern', add(mul(num(3), pow(x, num(2))), mul(num(6), x)), '3x(x + 2)'],
    ['x² + px + q', sub(sub(pow(x, num(2)), x), num(6)), '(x + 2)(x - 3)'],
    ['erste binomische Formel', add(pow(x, num(2)), mul(num(6), x), num(9)), '(x + 3)^{2}'],
    ['mit Vorzahl vor x', sub(mul(num(4), pow(x, num(2))), num(1)), '(2x + 1)(2x - 1)'],
    ['vertauschte Differenz', sub(num(9), pow(x, num(2))), '-(x + 3)(x - 3)'],
    ['nicht zerlegbar', add(pow(x, num(2)), num(1)), 'x^{2} + 1'],
    ['Baustein e^x', sub(exp(mul(num(2), x)), num(4)), '(e^{x} + 2)(e^{x} - 2)'],
    ['Baustein sin x', add(mul(num(2), sin(x)), pow(sin(x), num(2))), '\\sin x \\cdot (\\sin x + 2)'],
  ])('%s', (_, e, expected) => {
    const f = factorize(poly(e))
    expect(toLatex(factoredExpr(f))).toBe(expected)
  })

  it('nutzt bekannte Faktoren bei mehreren Buchstaben', () => {
    const f = factorize(poly(sub(pow(a, num(2)), pow(b, num(2)))), [poly(add(a, b))])
    expect(toLatex(factoredExpr(f))).toBe('(a + b)(a - b)')
  })

  it('bildet den Hauptnenner', () => {
    const lcm = factoredLcm([factorize(poly(sub(pow(x, num(2)), num(1)))), factorize(poly(add(x, num(1)))), factorize(polyConst(4))])
    expect(toLatex(factoredExpr(lcm))).toBe('4(x + 1)(x - 1)')
    expect(toLatex(factoredExpr(factoredLcm([factorize(polyConst(4)), factorize(polyConst(6))])))).toBe('12')
  })

  it('erkennt gemeinsame Nenner', () => {
    expect(isMultipleOf(polyConst(12), polyConst(4))).toBe(true)
    expect(isMultipleOf(polyConst(10), polyConst(4))).toBe(false)
    expect(isMultipleOf(poly(mul(num(2), x)), poly(sub(x, num(1))))).toBe(false)
    expect(isMultipleOf(poly(sub(pow(x, num(2)), num(1))), poly(add(x, num(1))))).toBe(true)
  })
})

describe('Kürzen', () => {
  it.each<[string, Expr, string]>([
    ['binomische Formel', div(sub(pow(x, num(2)), num(9)), add(mul(num(2), x), num(6))), '\\frac{x - 3}{2}'],
    ['Zahlen', div(num(18), num(24)), '\\frac{3}{4}'],
    ['Potenzen', div(mul(num(6), pow(x, num(2)), variable('y')), mul(num(9), x, pow(variable('y'), num(3)))), '\\frac{2x}{3y^{2}}'],
    ['nichts zu kürzen', div(add(x, num(5)), sub(pow(x, num(2)), num(1))), '\\frac{x + 5}{(x + 1)(x - 1)}'],
    ['Nenner kürzt sich weg', div(sub(pow(a, num(2)), pow(b, num(2))), add(a, b)), 'a - b'],
    ['vertauschte Differenz', div(sub(num(3), x), sub(pow(x, num(2)), num(9))), '-\\frac{1}{x + 3}'],
    ['Baustein', div(sub(exp(mul(num(2), x)), num(1)), add(exp(x), num(1))), 'e^{x} - 1'],
    ['Minus vorne', div(neg(mul(num(2), x)), num(4)), '-\\frac{x}{2}'],
  ])('%s', (_, e, expected) => {
    const f = frac(e)
    const reduced = reduceFrac(f, [poly(add(a, b))])
    expect(toLatex(reducedExpr(reduced))).toBe(expected)
    expect(fracEquals(reducedFrac(reduced), f)).toBe(true)
  })

  it('ändert den Wert nicht, auch bei Vorzahlen als Bruch', () => {
    const f: Frac = { num: polySub(polyMul(polyAtom('x'), polyConst(rat(1, 2))), polyConst(3)), den: polyConst(rat(3, 4)) }
    const reduced = reduceFrac(f)
    expect(polyEquals(reducedFrac(reduced).num, reduced.num)).toBe(true)
    expect(fracEquals(reducedFrac(reduced), f)).toBe(true)
    expect(toLatex(reducedExpr(reduced))).toBe('\\frac{2x - 12}{3}')
  })
})
