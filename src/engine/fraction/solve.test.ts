import { describe, expect, it } from 'vitest'
import { toLatex } from '../expr/print.ts'
import { type Expr, add, exp, mul, num, pow, sub, x } from '../expr/types.ts'
import { ratToNumber } from '../rational.ts'
import { toFrac } from './frac.ts'
import { type Poly, polyDivideExact } from './poly.ts'
import { STEP_NAMES, solveFraction } from './solve.ts'
import { type FractionShape, type FractionTask, type Part, expanded, minus, part, plus, taskLatex } from './task.ts'

function poly(e: Expr): Poly {
  const f = toFrac(e)!
  return polyDivideExact(f.num, f.den)!
}

const fr = (n: Expr, d: Expr = num(1)): Part => part(expanded(poly(n)), expanded(poly(d)))
const task = (s: FractionShape): FractionTask => ({ ...s, hints: [] }) as FractionTask

// Rechenweg als lesbare Zeilen „Schritt: Term"
function lines(t: FractionTask): string[] {
  return solveFraction(t).steps.map((s) => `${STEP_NAMES[s.kind]}: ${toLatex((s.expr ?? s.detail)!)}`)
}

describe('Rechenweg', () => {
  it('plus und minus wie im Beispiel des Plans', () => {
    const t = task({ kind: 'sum', terms: [plus(fr(num(3), sub(x, num(1)))), minus(fr(num(2), add(x, num(1))))] })
    expect(taskLatex(t)).toBe('\\frac{3}{x - 1} - \\frac{2}{x + 1}')
    expect(lines(t)).toEqual([
      'Hauptnenner: (x - 1)(x + 1)',
      'Auf den Hauptnenner erweitern: \\frac{3(x + 1)}{(x - 1)(x + 1)} - \\frac{2(x - 1)}{(x - 1)(x + 1)}',
      'Zähler zusammenfassen: \\frac{x + 5}{(x - 1)(x + 1)}',
    ])
    const solution = solveFraction(t)
    expect(toLatex(solution.result)).toBe('\\frac{x + 5}{(x - 1)(x + 1)}')
    expect(solution.excluded?.map(ratToNumber)).toEqual([-1, 1])
  })

  it('Zahlenbrüche mit Kürzen am Ende', () => {
    const t = task({ kind: 'sum', terms: [plus(fr(num(3), num(4))), plus(fr(num(5), num(12)))] })
    expect(lines(t)).toEqual([
      'Hauptnenner: 12',
      'Auf den Hauptnenner erweitern: \\frac{9}{12} + \\frac{5}{12}',
      'Zähler zusammenfassen: \\frac{14}{12}',
      'Kürzen: \\frac{7}{6}',
    ])
  })

  it('Kürzen nach dem Zerlegen', () => {
    const t = task({ kind: 'reduce', part: fr(sub(pow(x, num(2)), num(9)), add(mul(num(2), x), num(6))) })
    expect(lines(t)).toEqual([
      'Zähler zerlegen: \\frac{(x + 3)(x - 3)}{2x + 6}',
      'Nenner zerlegen: \\frac{(x + 3)(x - 3)}{2(x + 3)}',
      'Kürzen: \\frac{x - 3}{2}',
    ])
    expect(toLatex(solveFraction(t).steps[2].detail!)).toBe('x + 3')
    expect(solveFraction(t).excluded?.map(ratToNumber)).toEqual([-3])
  })

  it('geteilt: mit dem Kehrwert malnehmen', () => {
    const t = task({ kind: 'quotient', left: fr(num(3), num(4)), right: fr(num(2), num(5)) })
    expect(taskLatex(t)).toBe('\\frac{3}{4} : \\frac{2}{5}')
    expect(lines(t)).toEqual([
      'Mit dem Kehrwert malnehmen: \\frac{3}{4} \\cdot \\frac{5}{2}',
      'Zähler mal Zähler, Nenner mal Nenner: \\frac{3 \\cdot 5}{4 \\cdot 2}',
    ])
    expect(toLatex(solveFraction(t).result)).toBe('\\frac{15}{8}')
  })

  it('Doppelbruch', () => {
    const t = task({
      kind: 'complex',
      top: [plus(fr(num(1))), plus(fr(num(1), x))],
      bottom: [plus(fr(num(1))), minus(fr(num(1), pow(x, num(2))))],
    })
    expect(taskLatex(t)).toBe('\\frac{1 + \\frac{1}{x}}{1 - \\frac{1}{x^{2}}}')
    expect(lines(t)).toEqual([
      'Zähler zu einem Bruch: \\frac{\\frac{x + 1}{x}}{1 - \\frac{1}{x^{2}}}',
      'Nenner zu einem Bruch: \\frac{\\frac{x + 1}{x}}{\\frac{x^{2} - 1}{x^{2}}}',
      'Mit dem Kehrwert malnehmen: \\frac{x + 1}{x} \\cdot \\frac{x^{2}}{x^{2} - 1}',
      'Kürzen: \\frac{x}{x - 1}',
    ])
    // auch die Nullstellen des unteren Terms sind verboten
    expect(solveFraction(t).excluded?.map(ratToNumber)).toEqual([-1, 0, 1])
  })

  it('Bausteine wie e^x', () => {
    const t = task({ kind: 'reduce', part: fr(sub(exp(mul(num(2), x)), num(1)), add(exp(x), num(1))) })
    expect(toLatex(solveFraction(t).result)).toBe('e^{x} - 1')
    // bei Bausteinen keine Liste verbotener Zahlen
    expect(solveFraction(t).excluded).toBeNull()
  })
})
