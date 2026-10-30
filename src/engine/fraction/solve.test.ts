import { describe, expect, it } from 'vitest'
import { toLatex } from '../expr/print.ts'
import { type Expr, add, cos, exp, mul, num, pow, sin, sqrt, sub, variable, x } from '../expr/types.ts'
import { ratToNumber } from '../rational.ts'
import { toFrac } from './frac.ts'
import { type Poly, polyDivideExact } from './poly.ts'
import { STEP_NAMES, solveFraction } from './solve.ts'
import { type BlockRule, type FractionShape, type FractionTask, type Part, binomialShown, expanded, minus, part, plus, taskLatex, withRoots } from './task.ts'

function poly(e: Expr): Poly {
  const f = toFrac(e)!
  return polyDivideExact(f.num, f.den)!
}

const fr = (n: Expr, d: Expr = num(1)): Part => part(expanded(poly(n)), expanded(poly(d)))
const task = (s: FractionShape, rule?: BlockRule): FractionTask => withRoots({ ...s, hints: [], ...(rule ? { rule } : {}) } as FractionTask)
const frAscending = (n: Expr, d: Expr): Part => part(expanded(poly(n), true), expanded(poly(d), true))

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

describe('Rechenweg Stufe 5', () => {
  const h = variable('h')

  it('sin² x + cos² x = 1 im Nenner', () => {
    const t = task({ kind: 'sum', terms: [plus(frAscending(num(1), sub(num(1), sin(x)))), plus(frAscending(num(1), add(num(1), sin(x))))] }, { kind: 'trig', prefer: 'C', target: 'den' })
    expect(taskLatex(t)).toBe('\\frac{1}{1 - \\sin x} + \\frac{1}{1 + \\sin x}')
    expect(lines(t)).toEqual([
      'Hauptnenner: (1 - \\sin x)(1 + \\sin x)',
      'Auf den Hauptnenner erweitern: \\frac{1 + \\sin x}{(1 - \\sin x)(1 + \\sin x)} + \\frac{1 - \\sin x}{(1 - \\sin x)(1 + \\sin x)}',
      'Zähler zusammenfassen: \\frac{2}{(1 - \\sin x)(1 + \\sin x)}',
      'Regel des Bausteins anwenden: \\frac{2}{\\cos^{2} x}',
    ])
    expect(toLatex(solveFraction(t).result)).toBe('\\frac{2}{\\cos^{2} x}')
  })

  it('Doppelbruch mit Winkelfunktionen: Ergebnis als tan x', () => {
    const t = task({ kind: 'complex', top: [plus(fr(num(1), cos(x))), minus(fr(cos(x)))], bottom: [plus(fr(sin(x)))] }, { kind: 'trig', prefer: 'S', target: 'num' })
    expect(lines(t)).toEqual([
      'Zähler zu einem Bruch: \\frac{\\frac{1 - \\cos^{2} x}{\\cos x}}{\\sin x}',
      'Regel des Bausteins anwenden: \\frac{\\frac{\\sin^{2} x}{\\cos x}}{\\sin x}',
      'Mit dem Kehrwert malnehmen: \\frac{\\sin^{2} x}{\\cos x} \\cdot \\frac{1}{\\sin x}',
      'Kürzen: \\frac{\\sin x}{\\cos x}',
    ])
    expect(toLatex(solveFraction(t).result)).toBe('\\tan x')
  })

  it('(√x)² = x: Zähler zerlegen bzw. Nenner ausmultiplizieren', () => {
    const reduce = task({ kind: 'reduce', part: fr(sub(x, num(9)), sub(sqrt(x), num(3))) })
    expect(lines(reduce)).toEqual(['Zähler zerlegen: \\frac{(\\sqrt{x} - 3)(\\sqrt{x} + 3)}{\\sqrt{x} - 3}', 'Kürzen: \\sqrt{x} + 3'])
    const sum = task({ kind: 'sum', terms: [plus(fr(num(1), sub(sqrt(x), num(3)))), plus(fr(num(1), add(sqrt(x), num(3))))] }, { kind: 'root' })
    expect(lines(sum).at(-1)).toBe('Regel des Bausteins anwenden: \\frac{2\\sqrt{x}}{x - 9}')
    expect(toLatex(solveFraction(sum).result)).toBe('\\frac{2\\sqrt{x}}{x - 9}')
  })

  it('Klammer quadrieren: (x + h)² − x² erst ausmultiplizieren', () => {
    const t = task({ kind: 'reduce', part: part(binomialShown(poly(add(x, h)), poly(pow(x, num(2)))), expanded(poly(h))) })
    expect(taskLatex(t)).toBe('\\frac{(x + h)^{2} - x^{2}}{h}')
    expect(lines(t)).toEqual(['Ausmultiplizieren: \\frac{2hx + h^{2}}{h}', 'Zähler zerlegen: \\frac{h(2x + h)}{h}', 'Kürzen: 2x + h'])
  })

  it('verschachtelter Doppelbruch: von innen nach außen', () => {
    const one = fr(num(1))
    const t = task({ kind: 'nested', top: [plus(one)], bottom: [plus(one)], inner: { side: 'bottom', sign: 1, top: [plus(one)], bottom: [plus(one), plus(fr(num(1), x))] } })
    expect(taskLatex(t)).toBe('\\dfrac{1}{1 + \\dfrac{1}{1 + \\dfrac{1}{x}}}')
    expect(lines(t)).toEqual([
      'Inneren Doppelbruch auflösen: \\frac{1}{1 + \\frac{x}{x + 1}}',
      'Nenner zu einem Bruch: \\frac{1}{\\frac{2x + 1}{x + 1}}',
      'Mit dem Kehrwert malnehmen: 1 \\cdot \\frac{x + 1}{2x + 1}',
    ])
    const solution = solveFraction(t)
    expect(toLatex(solution.result)).toBe('\\frac{x + 1}{2x + 1}')
    // verboten: x = 0 (innerster Nenner), x = −1 (innerer Doppelbruch), x = −1/2 (äußerer)
    expect(solution.excluded?.map(ratToNumber)).toEqual([-1, -0.5, 0])
  })

  it('mehrere Rechenarten: erst mit dem Kehrwert malnehmen, dann die Klammer', () => {
    const t = task({ kind: 'mixed', op: 'div', left: [plus(fr(num(1))), minus(fr(num(3), x))], right: [plus(fr(sub(pow(x, num(2)), num(9)), pow(x, num(2))))] })
    expect(taskLatex(t)).toBe('\\left(1 - \\frac{3}{x}\\right) : \\frac{x^{2} - 9}{x^{2}}')
    expect(lines(t)).toEqual([
      'Mit dem Kehrwert malnehmen: \\left(1 - \\frac{3}{x}\\right) \\cdot \\frac{x^{2}}{x^{2} - 9}',
      'Erste Klammer zu einem Bruch: \\frac{x - 3}{x} \\cdot \\frac{x^{2}}{x^{2} - 9}',
      'Zähler mal Zähler, Nenner mal Nenner: \\frac{(x - 3) \\cdot x^{2}}{x \\cdot (x^{2} - 9)}',
      'Kürzen: \\frac{x}{x + 3}',
    ])
    expect(solveFraction(t).excluded?.map(ratToNumber)).toEqual([-3, 0, 3])
  })
})
