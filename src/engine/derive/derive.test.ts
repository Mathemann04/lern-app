import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { numericDerivative } from '../check/numeric.ts'
import { CHECK_POINTS, arbExpr, isStableAt } from '../expr/arbitraries.ts'
import { evaluate } from '../expr/evaluate.ts'
import { toLatex } from '../expr/print.ts'
import { samplePoints } from '../expr/sample.ts'
import {
  type Expr,
  PI,
  add,
  cos,
  div,
  exp,
  fn,
  ln,
  log,
  mul,
  neg,
  num,
  pow,
  root,
  sin,
  sqrt,
  sub,
  tan,
  x,
} from '../expr/types.ts'
import { createRng } from '../random/rng.ts'
import { generateDerivativeTask } from '../tasks/derivativeTerms.ts'
import { LEVELS } from '../tasks/taskNumber.ts'
import { type Derivation, derive } from './derive.ts'

const x2 = pow(x, num(2))

let checkedPoints = 0

// Stimmt die Ableitung an der Stelle mit der numerischen Näherung überein?
function checkAt(f: Expr, derivative: Expr, at: number): string | null {
  if (!isStableAt(f, at)) return null
  const exact = evaluate(derivative, { x: at })
  const approx = numericDerivative(f, at)
  if (approx === null || Number.isNaN(exact)) return null
  checkedPoints++
  const scale = Math.max(1, Math.abs(exact), 1e-3 * Math.abs(evaluate(f, { x: at })))
  if (Math.abs(exact - approx) <= 1e-5 * scale) return null
  return `x = ${at}: (${toLatex(f)})' = ${toLatex(derivative)} = ${exact}, numerisch ${approx}`
}

describe('derive: feste Beispiele (Endform)', () => {
  it.each<[string, Expr, string]>([
    ['Summe, Bruch, Wurzel', add(mul(num(4), pow(x, num(3))), neg(div(num(2), x)), sqrt(x)), '12x^{2} + \\frac{1}{2\\sqrt{x}} + \\frac{2}{x^{2}}'],
    ['Produkt', mul(x2, exp(x)), '(x^{2} + 2x)e^{x}'],
    ['Kette linear', sin(mul(num(3), x)), '3\\cos(3x)'],
    ['Produkt mit Kette', mul(exp(x2), cos(x)), '(2x\\cos x - \\sin x)e^{x^{2}}'],
    ['Quotient', div(ln(x), x2), '\\frac{1 - 2\\ln x}{x^{3}}'],
    ['Quotient mit konstantem Zähler', div(num(1), add(x2, num(1))), '-\\frac{2x}{(x^{2} + 1)^{2}}'],
    ['logarithmisches Ableiten', pow(x, x), 'x^{x}(\\ln x + 1)'],
    ['Logarithmus eines Quotienten', ln(div(add(x2, num(1)), sub(x, num(1)))), '\\frac{x^{2} - 2x - 1}{(x - 1)(x^{2} + 1)}'],
    ['Tangens', tan(x), '\\frac{1}{\\cos^{2} x}'],
    ['Arkustangens', fn('arctan', x), '\\frac{1}{x^{2} + 1}'],
    ['a hoch x', pow(num(2), x), '\\ln 2 \\cdot 2^{x}'],
    ['Logarithmus zur Basis 2', log(num(2), x), '\\frac{1}{x\\ln 2}'],
    ['Arkussinus mit Kette', fn('arcsin', mul(num(2), x)), '\\frac{2}{\\sqrt{1 - 4x^{2}}}'],
    ['Potenz einer Klammer', pow(add(mul(num(2), x), num(1)), num(5)), '10(2x + 1)^{4}'],
    ['Wurzel einer Summe', sqrt(add(x2, num(1))), '\\frac{x}{\\sqrt{x^{2} + 1}}'],
    ['Quadrat des Sinus', pow(sin(x), num(2)), '2\\sin x \\cdot \\cos x'],
    ['dritte Wurzel aus x²', root(x2, 3), '\\frac{2}{3\\sqrt[3]{x}}'],
    ['Wurzel aus x² bleibt Kette (wäre |x|)', sqrt(x2), '\\frac{x}{\\sqrt{x^{2}}}'],
    ['x² mal ln x', mul(x2, ln(x)), 'x(2\\ln x + 1)'],
    ['Konstante', num(5), '0'],
    ['Konstante mal x', mul(PI, x), '\\pi'],
    ['Minus vor Produkt', neg(mul(num(3), pow(x, num(3)), cos(x))), '3x^{3}\\sin x - 9x^{2}\\cos x'],
  ])('%s', (_name, expr, expected) => {
    expect(toLatex(derive(expr).result)).toBe(expected)
  })
})

describe('derive: Protokoll', () => {
  it('hält bei der Produktregel u, v und die Teil-Ableitungen fest', () => {
    const d = derive(mul(x2, exp(x)))
    expect(d.rule).toBe('product')
    expect(toLatex(d.parts.u!)).toBe('x^{2}')
    expect(toLatex(d.parts.v!)).toBe('e^{x}')
    expect(d.children.map((c) => c.rule)).toEqual(['power', 'exp'])
    expect(toLatex(d.formula)).toBe('2x \\cdot e^{x} + x^{2} \\cdot e^{x}')
  })

  it('hält bei der Kettenregel äußere und innere Funktion fest', () => {
    const d = derive(sin(mul(num(3), x)))
    expect(d.rule).toBe('chain')
    expect(toLatex(d.parts.outer!)).toBe('\\sin u')
    expect(toLatex(d.parts.inner!)).toBe('3x')
    expect(toLatex(d.children[0].result)).toBe('\\cos u')
    expect(toLatex(d.formula)).toBe('\\cos(3x) \\cdot 3')
  })

  it('schreibt Brüche und Wurzeln vorher als Potenz', () => {
    const d = derive(div(num(2), x))
    expect(d.rule).toBe('rewrite')
    expect(toLatex(d.parts.rewritten!)).toBe('2x^{-1}')
    expect(toLatex(d.result)).toBe('-\\frac{2}{x^{2}}')
  })

  it('behandelt −3 · u als einen Faktor', () => {
    const d = derive(neg(mul(num(3), x2)))
    expect(d.rule).toBe('constantFactor')
    expect(toLatex(d.parts.factor!)).toBe('-3')
  })
})

describe('derive: numerische Gegenprobe', () => {
  it('erkennt eine falsche Ableitung', () => {
    expect(checkAt(x2, mul(num(3), x), 1.3)).not.toBeNull()
    expect(checkAt(sin(x), neg(cos(x)), 0.7)).not.toBeNull()
  })

  it('stimmt für zufällige Terme', () => {
    fc.assert(
      fc.property(arbExpr, (f) => {
        const d = derive(f).result
        for (const at of CHECK_POINTS) {
          const problem = checkAt(f, d, at)
          if (problem) throw new Error(problem)
        }
      }),
      { numRuns: 1500 },
    )
  })

  describe.each(LEVELS)('Stufe %i', (level) => {
    it('stimmt für alle Aufgaben und ist auf dem Definitionsbereich definiert', () => {
      let sampled = 0
      let checkedTotal = 0
      for (let seed = 1; seed <= 200; seed++) {
        const { task } = generateDerivativeTask({ level, seed })
        if (task.kind !== 'function') continue
        const f = task.expr
        const derivation = derive(f)
        const rng = createRng(seed)
        checkedPoints = 0
        const points = samplePoints([f, derivation.result], rng, 15)
        for (const point of points) {
          const problem = checkAt(f, derivation.result, point.x)
          if (problem) throw new Error(`${level}-${seed}: ${problem}`)
        }
        // Die Gegenprobe darf nicht zu oft aussetzen. Einzelne Aufgaben wie \cos^2(e^{-4x})
        // schwanken für große |x| so schnell, dass dort keine Zahlenrechnung verlässlich ist.
        expect(checkedPoints, `${level}-${seed}: nur ${checkedPoints} Stellen geprüft`).toBeGreaterThanOrEqual(5)
        sampled += points.length
        checkedTotal += checkedPoints
        // Die Ableitung muss auf einem großen Teil des Definitionsbereichs existieren.
        // (Nur ein Teil, weil z. B. \sqrt[3]{x^2} = x^{2/3} wie im Skript nur für x ≥ 0 abgeleitet wird.)
        const fPoints = samplePoints([f], rng, 40)
        const defined = fPoints.filter((p) => !Number.isNaN(evaluate(derivation.result, p))).length
        expect(defined, `${level}-${seed}: ${toLatex(f)}`).toBeGreaterThanOrEqual(fPoints.length * 0.3)
      }
      expect(checkedTotal / sampled).toBeGreaterThanOrEqual(0.85)
    })
  })
})

describe('derive: Hauptregel passt zur Vorlage', () => {
  const mainRule = (d: Derivation): string => (d.rule === 'constantFactor' ? mainRule(d.children[0]) : d.rule)
  const expected: Record<string, string[]> = {
    'l1-summe': ['sum'],
    'l2-grundfunktionen': ['sum'],
    'l2-produkt': ['product'],
    'l2-kette-linear': ['chain'],
    'l3-produkt-kette': ['product'],
    'l3-quotient': ['quotient'],
    'l3-kette': ['chain'],
    'l3-potenz-funktion': ['chain'],
    'l5-log-ableiten': ['logarithmic'],
  }
  it.each(Object.entries(expected))('%s', (templateId, rules) => {
    let found = 0
    for (const level of LEVELS) {
      for (let seed = 1; seed <= 300; seed++) {
        const g = generateDerivativeTask({ level, seed })
        if (g.template.id !== templateId || g.task.kind !== 'function') continue
        found++
        expect(rules, `${level}-${seed}: ${toLatex(g.task.expr)}`).toContain(mainRule(derive(g.task.expr)))
      }
    }
    expect(found).toBeGreaterThan(0)
  })
})
