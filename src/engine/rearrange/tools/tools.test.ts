import { describe, expect, it } from 'vitest'
import { derive } from '../../derive/derive.ts'
import { evaluate } from '../../expr/evaluate.ts'
import { equationToLatex, toLatex } from '../../expr/print.ts'
import { type Expr, add, div, eq, exp, mul, num, pow, sqrt, variable } from '../../expr/types.ts'
import { parseLatex } from '../../parse/latex.ts'
import { createRng } from '../../random/rng.ts'
import { holds, samplePoints } from '../check.ts'
import { solveTask, stepEquationLatex } from '../isolate.ts'
import { antiderivative, antiderivativeExpr, partialFractions } from './integrate.ts'
import { boundsValue } from './steps.ts'
import { derivativeOf, integralOf } from './tool.ts'

// Werkzeuge der Stufe 5 (docs/PLAN-M3.md, „Stufe 5: erst ausrechnen, dann umstellen"): jedes Ergebnis
// gegen seine unabhängige Gegenprobe. Stammfunktion abgeleitet ergibt den Integranden, Partialbrüche
// zusammen den Bruch, das Integral numerisch F(oben) - F(unten), die Ableitung numerisch die der Engine.

const p = (latex: string): Expr => {
  const r = parseLatex(latex)
  if (!r.ok) throw new Error(r.message)
  return r.expr
}

const [a, b, t, x, y] = ['a', 'b', 't', 'x', 'y'].map(variable)

// Stellen mit positiven Buchstaben, an denen alle Terme definiert sind
function points(exprs: readonly Expr[], letters: readonly string[], seed: string, count = 20) {
  const rng = createRng(seed)
  const out: Record<string, number>[] = []
  for (let i = 0; i < count * 50 && out.length < count; i++) {
    const env: Record<string, number> = {}
    for (const name of letters) env[name] = 0.3 + 4 * rng.next()
    if (exprs.every((e) => Number.isFinite(evaluate(e, env)))) out.push(env)
  }
  return out
}

const close = (u: number, v: number, tolerance = 1e-8) => Math.abs(u - v) <= tolerance * Math.max(1, Math.abs(u), Math.abs(v))

const INTEGRANDS = [
  'e^{2t}',
  'e^{-3t}',
  '3e^{t}',
  '\\frac{t}{t^2+a^2}',
  '\\frac{t}{t^2+a}',
  '\\frac{1}{t+a}',
  '\\frac{b}{2t+a}',
  '\\frac{a}{t}',
  '\\frac{1}{\\sqrt{t+a^2}}',
  '\\frac{t}{\\sqrt{t^2+a^2}}',
  'te^{t^2}',
  '\\frac{1}{t^2+a^2}',
  '\\sin(2t)',
  '\\cos(3t)',
  '\\cosh(2t)',
  't+a',
  '2t+a',
  '3t^2+a',
  '4t^2',
]

describe('Stammfunktionen aus der Tafel', () => {
  it.each(INTEGRANDS)('%s: abgeleitet ergibt sich der Integrand', (latex) => {
    const body = p(latex)
    const f = antiderivative(body, 't')
    expect(f, latex).not.toBeNull()
    const F = antiderivativeExpr(f!, 't')
    const dF = derive(F, 't').result
    const pts = points([body, dF], ['a', 'b', 't'], latex)
    expect(pts.length).toBeGreaterThanOrEqual(10)
    for (const env of pts) expect(close(evaluate(dF, env), evaluate(body, env)), `${toLatex(F)} bei ${JSON.stringify(env)}`).toBe(true)
  })

  it('typische Fehler weichen ab (Faktor oder Vorzeichen)', () => {
    const body = p('\\frac{t}{t^2+a^2}')
    const wrong = antiderivative(body, 't', { id: 'eq-int-inner-factor', index: 0 })
    expect(toLatex(antiderivativeExpr(wrong!, 't'))).toBe('\\ln(t^{2} + a^{2})')
    expect(antiderivative(p('e^{t}'), 't', { id: 'eq-int-inner-factor', index: 0 })).toBeNull()
  })
})

describe('Partialbrüche über die Bruch-Engine', () => {
  const cases: Array<[string, string]> = [
    ['\\frac{1}{t(t+b)}', '\\frac{1}{b}\\left(\\frac{1}{t} - \\frac{1}{t + b}\\right)'],
    ['\\frac{1}{t^2-a^2}', '\\frac{1}{2a}\\left(\\frac{1}{t - a} - \\frac{1}{t + a}\\right)'],
    ['\\frac{2t+a+b}{(t+a)(t+b)}', '\\frac{1}{t + a} + \\frac{1}{t + b}'],
    ['\\frac{3}{(t+1)(t+4)}', '\\frac{1}{t + 1} - \\frac{1}{t + 4}'],
  ]
  it.each(cases)('%s = %s, zusammen wieder der Bruch', (latex, expected) => {
    const body = p(latex)
    const pf = partialFractions(body, 't')
    expect(toLatex(pf!)).toBe(expected)
    for (const env of points([body, pf!], ['a', 'b', 't'], latex)) expect(close(evaluate(pf!, env), evaluate(body, env))).toBe(true)
  })

  it('ohne zwei Linearfaktoren im Nenner keine Zerlegung', () => {
    expect(partialFractions(p('\\frac{1}{t^2+a^2}'), 't')).toBeNull()
    expect(partialFractions(p('\\frac{t}{t^2+a^2}'), 't')).toBeNull()
  })
})

describe('Werkzeuge numerisch (Gegenprobe)', () => {
  it('Integral: numerisch gleich F(oben) - F(unten)', () => {
    for (const latex of INTEGRANDS) {
      const body = p(latex)
      const F = antiderivativeExpr(antiderivative(body, 't')!, 't')
      const tool = integralOf(body, num(0), x)
      const value = boundsValue(F, 't', num(0), x, null)
      for (const env of points([value], ['a', 'b', 'x'], latex, 8)) {
        // bei \sin und \cos nicht über die erste Nullstelle hinaus
        if (/sin|cos/.test(latex) && env.x > 0.5) continue
        expect(close(evaluate(tool, env), evaluate(value, env), 1e-9), `${latex} bei ${JSON.stringify(env)}`).toBe(true)
      }
    }
  })

  it('Ableitung: numerisch gleich der Ableitung der Engine', () => {
    for (const latex of ['\\frac{x^2}{x+a}', '\\sqrt{x^2+a}', '\\ln(e^{2x}+a)', '\\arctan\\frac{x}{a}', 'x\\ln x', '\\cosh(3x)']) {
      const body = p(latex)
      const tool = derivativeOf(body)
      const d = derive(body, 'x').result
      for (const env of points([d], ['a', 'x'], latex, 8)) expect(close(evaluate(tool, env), evaluate(d, env)), latex).toBe(true)
    }
  })

  it('Schreibweise der Werkzeuge', () => {
    expect(toLatex(integralOf(div(num(1), mul(t, add(t, b))), a, x))).toBe('\\int_{a}^{x} \\frac{\\mathrm{d}t}{t(t + b)}')
    expect(toLatex(integralOf(exp(mul(num(2), t)), num(0), x))).toBe('\\int_{0}^{x} e^{2t}\\,\\mathrm{d}t')
    expect(toLatex(derivativeOf(sqrt(add(pow(x, num(2)), a))))).toBe('\\frac{\\mathrm{d}}{\\mathrm{d}x}\\left(\\sqrt{x^{2} + a}\\right)')
    // zwei Werkzeuge in einer Summe, im Bruch
    expect(toLatex(div(integralOf(exp(t), num(0), x), add(exp(x), a)))).toBe('\\frac{\\int_{0}^{x} e^{t}\\,\\mathrm{d}t}{e^{x} + a}')
  })
})

describe('Beispiele aus dem Plan (Tabelle „Stufe 5")', () => {
  const solve = (lhs: Expr, conditions = [] as { lhs: Expr; rel: '<' | '>'; rhs: Expr }[]) => {
    const task = { equation: eq(lhs, y), target: 'x', conditions }
    const solution = solveTask(task)!
    // Gegenprobe: das Ergebnis erfüllt die Aufgabe (mit dem Werkzeug numerisch ausgewertet)
    const pts = samplePoints(task, solution.result, createRng(equationToLatex(task.equation)), 12, solution.requires)
    expect(pts.length).toBeGreaterThanOrEqual(8)
    for (const env of pts) expect(holds(task.equation, env)).toBe(true)
    return solution
  }

  it('\\int_a^x \\frac{\\mathrm{d}t}{t(t + b)} = y: Partialbrüche, Stammfunktion, Grenzen, dann umstellen', () => {
    const s = solve(integralOf(div(num(1), mul(t, add(t, b))), a, x), [{ lhs: x, rel: '>', rhs: a }])
    expect(s.steps.slice(0, 3).map((step) => step.kind)).toEqual(['partial', 'antiderivative', 'bounds'])
    expect(stepEquationLatex('bounds', s.steps[2].after)).toBe('\\frac{\\ln x - \\ln(x + b) - \\ln a + \\ln(a + b)}{b} = y')
    expect(toLatex(s.result)).toBe('\\frac{abe^{by}}{a + b - ae^{by}}')
  })

  it('\\frac{\\mathrm{d}}{\\mathrm{d}x}\\left(\\frac{x^2}{x + a}\\right) = y: Ableitung, danach quadratisch', () => {
    const s = solve(derivativeOf(div(pow(x, num(2)), add(x, a))))
    expect(s.steps[0].kind).toBe('derive')
    expect(s.steps.some((step) => step.kind === 'pq')).toBe(true)
    // gleichwertig zu \frac{a}{\sqrt{1 - y}} - a
    const plan = p('\\frac{a}{\\sqrt{1-y}}-a')
    for (const env of [{ a: 2, y: 0.5 }, { a: 0.7, y: 0.2 }]) expect(close(evaluate(s.result, env), evaluate(plan, env))).toBe(true)
  })

  it('\\int_0^x \\frac{t}{t^2 + a^2}\\,\\mathrm{d}t = y', () => {
    const s = solve(integralOf(div(t, add(pow(t, num(2)), pow(a, num(2)))), num(0), x))
    const plan = p('a\\sqrt{e^{2y}-1}')
    for (const env of [{ a: 2, y: 0.5 }, { a: 0.7, y: 1.2 }]) expect(close(evaluate(s.result, env), evaluate(plan, env))).toBe(true)
  })
})
