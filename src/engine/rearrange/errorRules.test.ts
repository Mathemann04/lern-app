import { describe, expect, it } from 'vitest'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { type Expr, IMAG, PI, add, cos, div, eq, exp, mul, neg, num, pow, sin, sub, variable } from '../expr/types.ts'
import { parseLatex } from '../parse/latex.ts'
import { REARRANGE_ERROR_RULES, rearrangeWrongAnswers } from './errorRules.ts'
import { solveEquation, solveTask } from './isolate.ts'
import type { Condition } from './task.ts'
import { absOf, angleOf, argOf, derivativeOf, detOf, dotOf, integralOf, lengthOf, limitOf, odeOf, seriesOf, sumOf, theoremOf } from './tools/tool.ts'

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
  { id: 'eq-multiply-one-term', lhs: '\\frac{x}{a}', rhs: 'c-b', after: 'x = ac - b' },
  { id: 'eq-minus-bracket', lhs: 'a-c(x-d)', rhs: 'x', after: 'a - cx - cd = x' },
  { id: 'eq-factor-sign', lhs: 'ax-bx', rhs: 'c', after: 'x(a + b) = c' },
  { id: 'eq-square-halved', lhs: 'x^2', rhs: 'c', after: 'x = \\frac{c}{2}' },
  { id: 'eq-nested-root', lhs: 'y', rhs: '\\sqrt{a+\\sqrt{b+\\sqrt{x}}}', after: 'y^{2} = a + b + \\sqrt{x}' },
  { id: 'eq-ln-forgotten', lhs: 'e^{kx}', rhs: 'w', after: 'kx = w' },
  { id: 'eq-exp-forgotten', lhs: '\\ln(x+a)', rhs: 'b', after: 'x + a = b' },
  { id: 'eq-exp-minus-lost', lhs: 'e^{-kx}', rhs: 'w', after: 'kx = \\ln w' },
  { id: 'eq-ln-of-sum', lhs: 'e^{2x}', rhs: 'a+b', after: '2x = \\ln a + \\ln b' },
  { id: 'eq-exp-of-sum', lhs: '\\ln(x+a)', rhs: 'b+c', after: 'x + a = e^{b} + e^{c}' },
  { id: 'eq-log-base-forgotten', lhs: '2^{x}', rhs: 'c', after: 'x = \\ln c' },
  { id: 'eq-divide-inside-ln', lhs: 'e^{kx}', rhs: 'w', after: 'x = \\ln\\left(\\frac{w}{k}\\right)' },
  { id: 'eq-log-product', lhs: '3^{2x-1}', rhs: 'a\\cdot5^{x}', after: '(2x - 1)\\ln 3 = \\ln a \\cdot x\\ln 5' },
  { id: 'eq-log-sum', lhs: '\\ln(x+a)+\\ln(x-a)', rhs: 'b', after: '\\ln(2x) = b' },
  { id: 'eq-log-quotient', lhs: '\\ln(x+a)-\\ln x', rhs: 'b', after: '\\frac{\\ln(x + a)}{\\ln x} = b' },
  { id: 'eq-power-sum', lhs: 'a\\cdot2^{x+1}-b\\cdot2^{x}', rhs: 'c', after: 'a(2^{x} + 2) - b \\cdot 2^{x} = c' },
  // M6 Schritt 4b-2: Logarithmen auf beiden Seiten
  { id: 'eq-log-base-flipped', lhs: '\\log_{2}x', rhs: '\\log_{4}(x+a)', after: '\\log_{2} x = 2\\log_{2}(x + a)' },
  { id: 'eq-log-base-quotient', lhs: '\\ln(x+a)+\\log_{3}(x+a)', rhs: 'b', after: '\\ln(x + a) + \\ln\\left(\\frac{x + a}{3}\\right) = b' },
  { id: 'eq-log-power-factor', lhs: '2\\ln x', rhs: '\\ln(ax+b)', after: '\\ln(2x) = \\ln(ax + b)' },
  { id: 'eq-log-number-plain', lhs: '\\log_{2}(x+a)', rhs: '\\log_{2}x+3', after: '\\log_{2}(x + a) = \\log_{2} 3 + \\log_{2} x' },
  { id: 'eq-log-number-inside', lhs: '\\log_{2}(x+a)', rhs: '\\log_{2}x+3', after: '\\log_{2}(x + a) = \\log_{2}(x + 3)' },
  { id: 'eq-inverse-forgotten', lhs: '\\sin(kx)', rhs: 'w', after: 'kx = w' },
  { id: 'eq-inverse-reciprocal', lhs: '\\tan x', rhs: 'w', after: 'x = \\frac{1}{\\tan w}' },
  { id: 'eq-divide-inside-arc', lhs: '\\sin(kx)', rhs: 'w', after: 'x = \\arcsin\\left(\\frac{w}{k}\\right)' },
  { id: 'eq-pythagoras-square', lhs: 'y', rhs: 'a\\cos^2x+b\\sin^2x', after: 'y = a\\cos^{2} x + b(1 - \\cos x)' },
  { id: 'eq-hyperbolic-sign', lhs: 'a\\cosh^2x-b\\sinh^2x', rhs: 'y', after: 'a\\cosh^{2} x - b(1 - \\cosh^{2} x) = y' },
  { id: 'eq-tan-flipped', lhs: '\\frac{\\sin x+\\cos x}{\\sin x-\\cos x}', rhs: 'y', after: '\\frac{1 + \\tan x}{1 - \\tan x} = y' },
  { id: 'eq-divide-cos-partly', lhs: '\\frac{\\sin x+\\cos x}{\\sin x-\\cos x}', rhs: 'y', after: '\\frac{\\tan x + 1}{\\sin x - \\cos x} = y' },
  { id: 'eq-substitute-power', lhs: 'e^{2x}-ae^{x}', rhs: 'b', after: '2u - au = b' },
  { id: 'eq-substitute-reciprocal', lhs: 'e^{x}-e^{-x}', rhs: 'y', after: 'u - (-u) = y' },
  { id: 'eq-pq-sign', lhs: 'y', rhs: '\\frac{e^{x}-e^{-x}}{2}', after: 'u = -y + \\sqrt{y^{2} + 1}' },
  { id: 'eq-pq-q-sign', lhs: 'y', rhs: '\\frac{e^{x}-e^{-x}}{2}', after: 'u = y + \\sqrt{y^{2} - 1}' },
  { id: 'eq-pq-half', lhs: 'e^{2x}-ae^{x}', rhs: 'b', after: 'u = \\frac{a}{2} + \\sqrt{a^{2} + b}' },
  { id: 'eq-spurious-root', lhs: 'e^{2x}-ae^{x}', rhs: 'b', after: 'u = \\frac{a}{2} - \\sqrt{\\frac{a^{2}}{4} + b}' },
  { id: 'eq-not-resubstituted', lhs: 'y', rhs: '\\frac{e^{x}-e^{-x}}{2}', after: 'x = y + \\sqrt{y^{2} + 1}', result: 'y + \\sqrt{y^{2} + 1}' },
]

// Werkzeuge der Stufe 5 (Schritt 7a): Aufgaben mit Integral, falsche Gleichung nach dem Werkzeug-Schritt
const t = variable('t')
const [a, b, f, k, n, q, x] = ['a', 'b', 'f', 'k', 'n', 'q', 'x'].map(variable)
const below1: Condition[] = [{ lhs: x, rel: '<', rhs: num(1) }]
const planDet = detOf([
  [exp(x), exp(neg(x))],
  [a, b],
])
const columnDet = detOf([
  [num(0), a, x],
  [b, num(1), num(2)],
  [num(0), x, a],
])
// Schritt 8b: x + a\mathrm{i}, gespiegelte Vektoren (x, a) und (x, -a)
const xai = add(x, mul(a, IMAG))
const mirror = angleOf([x, a], [x, neg(a)])
const planDot = dotOf([x, a], [add(x, b), neg(variable('c'))])
// Schritt 8c: \cos(x + a) = y\sin x und \cos(2x) = y\sin x bzw. y\cos x, mit x < \frac{\pi}{2}
const acuteX: Condition[] = [{ lhs: x, rel: '<', rhs: div(PI, num(2)) }]
const cosSum = theoremOf(cos(add(x, a)))
const cosDouble = theoremOf(cos(mul(num(2), x)))
const ySin = mul(variable('y'), sin(x))
const yCos = mul(variable('y'), cos(x))

// rhs: andere Seite der Gleichung, sonst y
const TOOL_CATALOG: Array<{ id: string; lhs: Expr; rhs?: Expr; target?: string; conditions?: Condition[]; after: string }> = [
  {
    id: 'eq-partial-factor',
    lhs: integralOf(div(num(1), mul(t, add(t, variable('b')))), variable('a'), variable('x')),
    conditions: [{ lhs: variable('x'), rel: '>', rhs: variable('a') }],
    after: '\\int_{a}^{x} \\left(\\frac{1}{t} - \\frac{1}{t + b}\\right)\\,\\mathrm{d}t = y',
  },
  { id: 'eq-int-inner-factor', lhs: integralOf(div(t, add(pow(t, num(2)), pow(variable('a'), num(2)))), num(0), variable('x')), after: '\\left[\\ln(t^{2} + a^{2})\\right]_{0}^{x} = y' },
  { id: 'eq-int-derived', lhs: integralOf(exp(mul(num(2), t)), num(0), variable('x')), after: '\\left[2e^{2t}\\right]_{0}^{x} = y' },
  { id: 'eq-int-power', lhs: integralOf(pow(t, num(2)), num(0), variable('x')), after: '\\left[t^{3}\\right]_{0}^{x} = y' },
  { id: 'eq-int-sign', lhs: integralOf(sin(t), num(0), variable('x')), conditions: [{ lhs: variable('x'), rel: '<', rhs: PI }], after: '\\left[\\cos t\\right]_{0}^{x} = y' },
  {
    id: 'eq-int-bounds-swapped',
    lhs: integralOf(div(num(1), mul(t, add(t, variable('b')))), variable('a'), variable('x')),
    conditions: [{ lhs: variable('x'), rel: '>', rhs: variable('a') }],
    after: '\\frac{\\ln a - \\ln(a + b) - \\ln x + \\ln(x + b)}{b} = y',
  },
  { id: 'eq-int-lower-forgotten', lhs: integralOf(exp(t), num(0), variable('x')), after: 'e^{x} = y' },
  // Schritt 7b: Summen, Reihen, Grenzwerte
  { id: 'eq-sum-count', lhs: sumOf(pow(q, k), num(0), sub(n, num(1))), target: 'n', conditions: [{ lhs: q, rel: '>', rhs: num(1) }], after: '\\frac{q^{n + 1} - 1}{q - 1} = y' },
  { id: 'eq-series-start', lhs: seriesOf(mul(k, pow(x, k)), num(1)), conditions: below1, after: '\\frac{1}{(1 - x)^{2}} = y' },
  { id: 'eq-series-sign', lhs: seriesOf(pow(x, k), num(0)), conditions: below1, after: '\\frac{1}{x - 1} = y' },
  { id: 'eq-series-not-geometric', lhs: seriesOf(mul(k, pow(x, k)), num(1)), conditions: below1, after: '\\frac{x}{1 - x} = y' },
  { id: 'eq-lim-one', lhs: limitOf(pow(add(num(1), div(x, n)), n)), after: '1 = y' },
  { id: 'eq-lim-exponent', lhs: limitOf(pow(add(num(1), div(x, n)), mul(num(2), n))), after: 'e^{x} = y' },
  { id: 'eq-lim-denominator', lhs: limitOf(pow(div(add(n, x), sub(n, x)), n)), after: 'e^{x} = y' },
  // Schritt 7c: Differentialgleichungen (f'' = k^2 f mit f(0) = a, f'(0) = 0 wie im Plan)
  { id: 'eq-ode-initial-unused', lhs: odeOf(mul(pow(k, num(2)), f), 2, [a, num(0)]), after: 'ae^{kx} = y' },
  { id: 'eq-ode-not-halved', lhs: odeOf(mul(pow(k, num(2)), f), 2, [a, num(0)]), after: 'ae^{kx} + ae^{-kx} = y' },
  { id: 'eq-ode-inner-factor', lhs: odeOf(mul(pow(k, num(2)), f), 2, [num(0), b]), after: '\\frac{b}{2}e^{kx} - \\frac{b}{2}e^{-kx} = y' },
  { id: 'eq-ode-oscillation', lhs: odeOf(mul(pow(k, num(2)), f), 2, [a, num(0)]), after: 'a\\cos(kx) = y' },
  { id: 'eq-ode-root', lhs: odeOf(mul(num(4), f), 2, [a, num(0)]), after: '\\frac{a}{2}e^{4x} + \\frac{a}{2}e^{-4x} = y' },
  { id: 'eq-ode-constant-added', lhs: odeOf(mul(k, f), 1, [a]), after: 'e^{kx} + a - 1 = y' },
  { id: 'eq-ode-exp-sign', lhs: odeOf(neg(mul(k, f)), 1, [a]), after: 'ae^{kx} = y' },
  { id: 'eq-ode-constant-start', lhs: odeOf(mul(k, sub(b, f)), 1, [a]), conditions: [{ lhs: a, rel: '>', rhs: b }], after: 'b + ae^{-kx} = y' },
  // Schritt 8a: Determinanten (das Beispiel aus dem Plan, beim Entwickeln eine Spalte mit zwei Nullen)
  { id: 'eq-det-plus', lhs: planDet, after: 'be^{x} + ae^{-x} = y' },
  { id: 'eq-det-swapped', lhs: planDet, after: 'ae^{-x} - be^{x} = y' },
  // zeilenweise fiele x weg (e^{x} \cdot e^{-x} = 1), darum spaltenweise
  { id: 'eq-det-rows', lhs: planDet, after: 'ae^{x} - be^{-x} = y' },
  { id: 'eq-det-main', lhs: planDet, after: 'be^{x} = y' },
  { id: 'eq-det-checkerboard', lhs: columnDet, after: 'b\\det\\begin{pmatrix} a & x \\\\ x & a \\end{pmatrix} = y' },
  { id: 'eq-det-entry', lhs: columnDet, after: '-\\det\\begin{pmatrix} a & x \\\\ x & a \\end{pmatrix} = y' },
  // Schritt 8b: Betrag und Winkel komplexer Zahlen (das Beispiel aus dem Plan), Vektoren
  { id: 'eq-abs-termwise', lhs: absOf(div(xai, sub(x, mul(b, IMAG)))), after: '\\frac{x + a}{x - b} = y' },
  { id: 'eq-abs-root', lhs: absOf(div(xai, sub(x, mul(b, IMAG)))), after: '\\frac{x^{2} + a^{2}}{x^{2} + b^{2}} = y' },
  { id: 'eq-abs-imag-squared', lhs: absOf(xai), after: '\\sqrt{x^{2} - a^{2}} = y' },
  { id: 'eq-arg-power', lhs: argOf(pow(xai, num(2))), after: '\\arctan\\left(\\frac{a}{x}\\right) = y' },
  { id: 'eq-arg-swapped', lhs: argOf(pow(xai, num(2))), after: '2\\arctan\\left(\\frac{x}{a}\\right) = y' },
  { id: 'eq-arg-arctan-forgotten', lhs: argOf(pow(xai, num(2))), after: '\\frac{2a}{x} = y' },
  { id: 'eq-arg-quotient-sign', lhs: argOf(div(xai, add(num(1), IMAG))), after: '\\arctan\\left(\\frac{a}{x}\\right) + \\frac{\\pi}{4} = y' },
  { id: 'eq-vec-not-divided', lhs: mirror, after: '\\arccos(x^{2} - a^{2}) = y' },
  { id: 'eq-vec-one-length', lhs: mirror, after: '\\arccos\\left(\\frac{x^{2} - a^{2}}{\\sqrt{x^{2} + a^{2}}}\\right) = y' },
  { id: 'eq-vec-sine', lhs: mirror, after: '\\arcsin\\left(\\frac{x^{2} - a^{2}}{x^{2} + a^{2}}\\right) = y' },
  { id: 'eq-vec-dot-sign', lhs: planDot, after: 'x(x + b) + ac = y' },
  { id: 'eq-vec-dot-cross', lhs: planDot, after: 'a(x + b) - cx = y' },
  { id: 'eq-vec-length-root', lhs: lengthOf([variable('x'), variable('a'), variable('b')]), after: 'x^{2} + a^{2} + b^{2} = y' },
  { id: 'eq-vec-length-termwise', lhs: lengthOf([variable('x'), variable('a'), variable('b')]), after: 'x + a + b = y' },
  // Schritt 8c: Additionstheoreme und doppelter Winkel
  { id: 'eq-add-termwise', lhs: cosSum, rhs: ySin, conditions: acuteX, after: '\\cos x + \\cos a = y\\sin x' },
  { id: 'eq-add-sign', lhs: cosSum, rhs: ySin, conditions: acuteX, after: '\\cos x \\cdot \\cos a + \\sin x \\cdot \\sin a = y\\sin x' },
  { id: 'eq-add-partner', lhs: cosSum, rhs: ySin, conditions: acuteX, after: '\\cos x \\cdot \\sin a - \\sin x \\cdot \\cos a = y\\sin x' },
  { id: 'eq-double-factor', lhs: cosDouble, rhs: ySin, conditions: acuteX, after: '2\\cos x = y\\sin x' },
  { id: 'eq-double-two', lhs: cosDouble, rhs: ySin, conditions: acuteX, after: '1 - \\sin^{2} x = y\\sin x' },
  { id: 'eq-double-cos-plus', lhs: cosDouble, rhs: ySin, conditions: acuteX, after: '\\cos^{2} x + \\sin^{2} x = y\\sin x' },
  { id: 'eq-double-cos-sign', lhs: cosDouble, rhs: yCos, conditions: acuteX, after: '1 - 2\\cos^{2} x = y\\cos x' },
]

describe('Katalog der Fehlerregeln', () => {
  it('jede Regel hat ein Katalogbeispiel', () => {
    expect([...CATALOG, ...TOOL_CATALOG].map((c) => c.id).sort()).toEqual(REARRANGE_ERROR_RULES.map((r) => r.id).sort())
  })

  for (const c of TOOL_CATALOG) {
    it(`${c.id}: ${equationToLatex(eq(c.lhs, c.rhs ?? variable('y')))}`, () => {
      const task = { equation: eq(c.lhs, c.rhs ?? variable('y')), target: c.target ?? 'x', conditions: c.conditions ?? [] }
      const found = rearrangeWrongAnswers(task, solveTask(task)!).filter((w) => w.rule.id === c.id)
      expect(found.map((w) => equationToLatex(w.after))).toContain(c.after)
    })
  }

  it('spitzer Winkel als Buchstabe (Teil 8b): beim Ersetzen das Quadrat vergessen, \\frac{\\cos y}{\\sin y} als \\tan y geschrieben', () => {
    const [a, b, x, y] = ['a', 'b', 'x', 'y'].map(variable)
    const acute: Condition[] = [{ lhs: y, rel: '<', rhs: div(PI, num(2)) }]
    const wrongOf = (lhs: Expr, id: string) => {
      const task = { equation: eq(lhs, y), target: 'x', conditions: acute }
      return rearrangeWrongAnswers(task, solveTask(task)!).filter((w) => w.rule.id === id).map((w) => equationToLatex(w.after))
    }
    const space = angleOf([x, a, b], [num(1), num(0), num(0)])
    expect(wrongOf(space, 'eq-pythagoras-square')).toEqual(['x^{2}\\sin y = a^{2}\\cos^{2} y + b^{2}\\cos^{2} y'])
    expect(wrongOf(space, 'eq-tan-flipped')).toEqual(['x = \\sqrt{a^{2} + b^{2}}\\tan y'])
    // mit einer Vorzahl: 4 - 4\cos^2 y durch 4\sin y ersetzt, \frac{\sqrt{a^2 + b^2}\tan y}{2} statt \frac{\sqrt{a^2 + b^2}}{2\tan y}
    const twice = angleOf([mul(num(2), x), a, b], [num(1), num(0), num(0)])
    expect(wrongOf(twice, 'eq-pythagoras-square')).toEqual(['4x^{2}\\sin y = a^{2}\\cos^{2} y + b^{2}\\cos^{2} y'])
    expect(wrongOf(twice, 'eq-tan-flipped')).toEqual(['x = \\frac{\\sqrt{a^{2} + b^{2}}\\tan y}{2}'])
    // \sqrt{\left(\frac{a}{\cos y}\right)^2 - a^2} = a\tan y, falsch \frac{a}{\tan y}
    expect(wrongOf(angleOf([x, a], [num(0), num(1)]), 'eq-tan-flipped')).toEqual(['x = \\frac{a}{\\tan y}'])
    // ohne Bedingung an y (ältere Aufgaben) weder der Schritt noch die Fehler
    const old = { equation: eq(space, y), target: 'x', conditions: [] }
    const ids = rearrangeWrongAnswers(old, solveTask(old)!).map((w) => w.rule.id)
    expect(ids).not.toContain('eq-pythagoras-square')
    expect(ids).not.toContain('eq-tan-flipped')
  })

  it('Betrag, Winkel, Vektoren (Teil 8b): keine falsche Gleichung doppelt und keine, die für kein x definiert ist', () => {
    const [a, b, x, y] = ['a', 'b', 'x', 'y'].map(variable)
    const ids = (lhs: Expr, conditions: Condition[] = []) => {
      const task = { equation: eq(lhs, y), target: 'x', conditions }
      return rearrangeWrongAnswers(task, solveTask(task)!).filter((w) => w.stepIndex === 0).map((w) => w.rule.id)
    }
    // Winkel mit einer Achse in der Ebene: Sinus statt Kosinus und über Kreuz malgenommen ergeben dieselbe Gleichung
    // (\arcsin\frac{a}{\sqrt{a^2 + x^2}} = \arccos\frac{x}{\sqrt{a^2 + x^2}}), sie steht nur einmal da
    const axis = ids(angleOf([a, x], [num(1), num(0)]), [{ lhs: y, rel: '<', rhs: div(PI, num(2)) }])
    expect(axis).toContain('eq-vec-sine')
    expect(axis).not.toContain('eq-vec-dot-cross')
    // \sqrt{x^2 - (x + a)^2} ist für kein x definiert, \arccos\left(e^{2x}\right) auch nicht
    const both = ids(absOf(add(x, mul(add(x, a), IMAG))))
    expect(both).toContain('eq-abs-root')
    expect(both).not.toContain('eq-abs-imag-squared')
    const rotated = ids(angleOf([exp(x), a, b], [exp(x), b, neg(a)]))
    expect(rotated).toContain('eq-vec-sine')
    expect(rotated).not.toContain('eq-vec-not-divided')
    // in keiner falschen Gleichung spielt x keine Rolle mehr: x + a - x = y (gliedweise), y^2 = k^2 + m^2 (beim
    // Ausmultiplizieren nach der Euler-Form das Mittelglied vergessen)
    expect(ids(sub(absOf(add(x, mul(a, IMAG))), x))).not.toContain('eq-abs-termwise')
    const [k, m] = ['k', 'm'].map(variable)
    const euler = { equation: eq(absOf(add(k, mul(m, exp(mul(IMAG, x))))), y), target: 'x', conditions: [{ lhs: x, rel: '<' as const, rhs: PI }] }
    const wrong = rearrangeWrongAnswers(euler, solveTask(euler)!)
    expect(wrong.length).toBeGreaterThan(4)
    for (const w of wrong) expect(equationToLatex(w.after)).toContain('x')
  })

  it('beim Ableiten die Fehler aus „Ableiten" mit ihrer Stelle', () => {
    const task = { equation: eq(derivativeOf(div(pow(variable('x'), num(2)), add(variable('x'), variable('a')))), variable('y')), target: 'x', conditions: [] }
    const found = rearrangeWrongAnswers(task, solveTask(task)!).filter((w) => w.derive)
    expect(found.map((w) => w.rule.id)).toContain('quotient-denominator-not-squared')
    for (const w of found) expect(w.stepIndex).toBe(0)
  })

  for (const c of CATALOG) {
    it(`${c.id}: ${c.lhs} = ${c.rhs}`, () => {
      const found = wrongs(c.lhs, c.rhs, c.target).filter((w) => w.rule.id === c.id)
      expect(found.length, `${c.id} kommt nicht vor`).toBeGreaterThan(0)
      if (c.after) expect(found.map((w) => equationToLatex(w.after))).toContain(c.after)
      if (c.result) expect(found.map((w) => (w.result ? toLatex(w.result) : null))).toContain(c.result)
    })
  }

  it('mit dem Hauptnenner malgenommen, einen Summanden ohne Bruch vergessen', () => {
    const found = wrongs('\\frac{x+a}{2}-\\frac{x-b}{3}', 'c').filter((w) => w.rule.id === 'eq-multiply-one-term')
    expect(found.map((w) => equationToLatex(w.after))).toContain('3(x + a) - 2(x - b) = c')
  })

  it('beide Klammern einer Seite können falsch ausmultipliziert werden', () => {
    const ids = wrongs('a(x-b)-c(x+d)', 'x').map((w) => w.rule.id)
    expect(ids).toContain('eq-bracket-first-term')
    expect(ids).toContain('eq-minus-bracket')
  })

  it('Fehler beim Zusammenfassen kommen aus „Brüche"', () => {
    const ids = wrongs('y', '\\frac{3(x-a)}{b}+c').map((w) => w.rule.id)
    expect(ids).toContain('frac-whole-not-expanded')
  })

  it('zwei Wurzeln: beim zweiten Quadrieren das Mittelglied vergessen, Wurzel ohne Vorzeichenwechsel sortiert', () => {
    const found = wrongs('\\sqrt{x+a}+\\sqrt{x-a}', 'y')
    expect(found.filter((w) => w.rule.id === 'eq-square-middle').map((w) => equationToLatex(w.after))).toContain('x + a = y^{2} + x - a')
    expect(found.some((w) => w.rule.id === 'eq-sign-not-flipped' && w.stepIndex === 3)).toBe(true)
  })

  it('keine falsche Antwort, die doch stimmt oder keine Lösung hat', () => {
    const all = wrongs('\\frac{1}{x}+\\frac{1}{a}', '\\frac{1}{b}', 'a')
    expect(all.map((w) => equationToLatex(w.after))).not.toContain('\\frac{1}{a} = 0')
  })
})
