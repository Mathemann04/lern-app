import { describe, expect, it } from 'vitest'
import { evaluate } from '../../expr/evaluate.ts'
import { equationToLatex, toLatex } from '../../expr/print.ts'
import { E, type Expr, add, div, eq, mul, neg, num, pow, sub, variable } from '../../expr/types.ts'
import { parseLatex } from '../../parse/latex.ts'
import { createRng } from '../../random/rng.ts'
import { holds, samplePoints } from '../check.ts'
import { solveTask, stepEquationLatex } from '../isolate.ts'
import type { Condition } from '../task.ts'
import { geometricParts, limitParts, limitValue, seriesValue, sumValue } from './series.ts'
import { derivativeOf, integralOf, limitOf, seriesOf, sumOf } from './tool.ts'

// Summen, Reihen und Grenzwerte der Stufe 5 (Teil 7b): jede Formel gegen ihre unabhängige Gegenprobe.
// Summen Summand für Summand, Reihen über Teilsummen, Grenzwerte über große n (evaluate.ts).

const p = (latex: string): Expr => {
  const r = parseLatex(latex)
  if (!r.ok) throw new Error(r.message)
  return r.expr
}

const [a, k, n, q, t, x, y] = ['a', 'k', 'n', 'q', 't', 'x', 'y'].map(variable)
const close = (u: number, v: number, tolerance = 1e-9) => Math.abs(u - v) <= tolerance * Math.max(1, Math.abs(u), Math.abs(v))

// Summe Summand für Summand, ohne evaluate des Werkzeugs
const termwise = (body: Expr, from: number, to: number, env: Record<string, number>) => {
  let s = 0
  for (let i = from; i <= to; i++) s += evaluate(body, { ...env, k: i })
  return s
}

describe('Endliche geometrische Summe', () => {
  const cases: Array<[Expr, number, Expr, string]> = [
    [mul(a, pow(q, k)), 0, sub(n, num(1)), '\\frac{a(q^{n} - 1)}{q - 1}'],
    [mul(a, pow(num(2), k)), 1, n, '2a(2^{n} - 1)'],
    [pow(num(3), k), 0, n, '\\frac{3^{n + 1} - 1}{2}'],
    [pow(E, mul(a, k)), 1, n, '\\frac{e^{a}(e^{an} - 1)}{e^{a} - 1}'],
  ]
  it.each(cases)('%#: Formel gleich Summand für Summand', (body, from, upper, expected) => {
    const value = sumValue(geometricParts(body, 'k')!, from, upper)!
    expect(toLatex(value)).toBe(expected)
    for (const m of [3, 5, 8]) {
      const env = { a: 0.7, q: 1.6, n: m }
      const to = evaluate(upper, env)
      expect(close(evaluate(value, env), termwise(body, from, to, env))).toBe(true)
      // die Gegenprobe von evaluate rechnet genauso Summand für Summand
      expect(close(evaluate(sumOf(body, num(from), upper), env), termwise(body, from, to, env))).toBe(true)
    }
  })

  it('typische Fehler weichen ab: Anzahl verschoben, erster Summand, Vorzeichen', () => {
    const g = geometricParts(pow(q, k), 'k')!
    expect(toLatex(sumValue(g, 0, sub(n, num(1)), 'eq-sum-count')!)).toBe('\\frac{q^{n + 1} - 1}{q - 1}')
    expect(toLatex(sumValue(g, 0, sub(n, num(1)), 'eq-series-sign')!)).toBe('\\frac{q^{n} - 1}{1 - q}')
    expect(sumValue(g, 0, n, 'eq-series-start')).toBeNull()
    expect(toLatex(sumValue(g, 1, n, 'eq-series-start')!)).toBe('\\frac{q^{n} - 1}{q - 1}')
  })

  it('obere Grenze keine ganze Zahl (n aus dem Ergebnis): geometrisch fortgesetzt', () => {
    const tool = sumOf(mul(a, pow(q, k)), num(0), sub(n, num(1)))
    const env = { a: 1.3, q: 2.2, n: 4.37 }
    expect(close(evaluate(tool, env), (1.3 * (2.2 ** 4.37 - 1)) / 1.2)).toBe(true)
    // nicht geometrisch: kein Wert
    expect(evaluate(sumOf(mul(k, pow(q, k)), num(1), n), env)).toBeNaN()
  })
})

describe('Geometrische Reihe, auch abgeleitet und integriert', () => {
  const cases: Array<[string, number, string]> = [
    ['\\left(\\frac{x}{a}\\right)^k', 0, '\\frac{a}{a - x}'],
    ['\\left(\\frac{a}{x}\\right)^k', 1, '\\frac{a}{x - a}'],
    ['e^{-kx}', 0, '\\frac{1}{1 - e^{-x}}'],
    ['\\left(\\frac{x}{x+a}\\right)^k', 0, '\\frac{x + a}{a}'],
    ['3\\left(\\frac{x}{a}\\right)^k', 1, '\\frac{3x}{a - x}'],
    ['kx^k', 1, '\\frac{x}{(1 - x)^{2}}'],
    ['k\\left(\\frac{x}{a}\\right)^k', 1, '\\frac{ax}{(a - x)^{2}}'],
    ['\\frac{x^k}{k}', 1, '-\\ln(1 - x)'],
    ['\\frac{x^k}{ka^k}', 1, '-\\ln\\left(\\frac{a - x}{a}\\right)'],
  ]
  it.each(cases)('%s ab k = %i: Formel gleich den Teilsummen', (latex, from, expected) => {
    const body = p(latex)
    const value = seriesValue(geometricParts(body, 'k')!, from)!
    expect(toLatex(value)).toBe(expected)
    const tool = seriesOf(body, num(from))
    for (const env of [
      { a: 2, x: 0.7 },
      { a: 5, x: 1.3 },
      { a: 0.9, x: 0.4 },
    ]) {
      const qValue = evaluate(div(body, k), { ...env, k: 1 })
      if (!Number.isFinite(evaluate(value, env)) || !(Math.abs(qValue) < 1)) continue
      expect(close(evaluate(value, env), evaluate(tool, env)), `${latex} bei ${JSON.stringify(env)}`).toBe(true)
      expect(close(evaluate(value, env), termwise(body, from, from + 400, env), 1e-7)).toBe(true)
    }
  })

  it('typische Fehler weichen ab', () => {
    const derived = geometricParts(mul(k, pow(x, k)), 'k')!
    expect(toLatex(seriesValue(derived, 1, 'eq-series-start')!)).toBe('\\frac{1}{(1 - x)^{2}}')
    expect(toLatex(seriesValue(derived, 1, 'eq-series-not-geometric')!)).toBe('\\frac{x}{1 - x}')
    const plain = geometricParts(pow(x, k), 'k')!
    expect(toLatex(seriesValue(plain, 0, 'eq-series-sign')!)).toBe('\\frac{1}{x - 1}')
    expect(toLatex(seriesValue(plain, 0, 'eq-series-start')!)).toBe('\\frac{x}{1 - x}')
    expect(seriesValue(plain, 0, 'eq-series-not-geometric')).toBeNull()
  })

  it('ohne q^k kein geometrischer Summand', () => {
    expect(geometricParts(p('\\frac{1}{k^2}'), 'k')).toBeNull()
    expect(geometricParts(p('k^2x^k'), 'k')).toBeNull()
  })

  it('Unterlauf (x^k zu klein für den Rechner) gibt keinen falschen Wert', () => {
    const tool = seriesOf(div(pow(x, k), mul(k, pow(a, k))), num(1))
    expect(evaluate(tool, { a: 0.3848443113100562, x: 0.38100863343115215 })).toBeNaN()
  })
})

describe('Grenzwerte, die auf e^{□} führen', () => {
  const cases: Array<[string, string]> = [
    ['\\left(1+\\frac{x}{n}\\right)^n', 'e^{x}'],
    ['\\left(1+\\frac{x}{n}\\right)^{2n}', 'e^{2x}'],
    ['\\left(1-\\frac{x}{n}\\right)^n', 'e^{-x}'],
    ['\\left(1+\\frac{x}{an}\\right)^n', 'e^{\\frac{x}{a}}'],
    ['\\left(1+\\frac{a}{n}\\right)^{xn}', 'e^{ax}'],
    ['\\left(\\frac{n+x}{n-x}\\right)^n', 'e^{2x}'],
    ['\\left(\\frac{n+a}{n+x}\\right)^{3n}', 'e^{3a - 3x}'],
    ['\\left(\\frac{n}{n+x}\\right)^n', 'e^{-x}'],
  ]
  it.each(cases)('%s → %s, gleich dem Wert für große n', (latex, expected) => {
    const body = p(latex)
    const value = limitValue(limitParts(body, 'n')!)!
    expect(toLatex(value)).toBe(expected)
    for (const env of [
      { a: 2, x: 0.7 },
      { a: 0.5, x: 1.9 },
    ]) {
      expect(close(evaluate(value, env), evaluate(limitOf(body), env), 1e-8), `${latex} bei ${JSON.stringify(env)}`).toBe(true)
      // unabhängig von der Extrapolation: n = 10^6 eingesetzt, Fehler etwa \frac{1}{n}
      expect(close(evaluate(value, env), evaluate(body, { ...env, n: 1e6 }), 1e-4)).toBe(true)
    }
  })

  it('typische Fehler: 1, Faktor in der Hochzahl vergessen, Nenner nicht beachtet', () => {
    const parts = limitParts(p('\\left(\\frac{n+x}{n-x}\\right)^{3n}'), 'n')!
    expect(toLatex(limitValue(parts, 'eq-lim-one')!)).toBe('1')
    expect(toLatex(limitValue(parts, 'eq-lim-exponent')!)).toBe('e^{2x}')
    expect(toLatex(limitValue(parts, 'eq-lim-denominator')!)).toBe('e^{3x}')
    const plain = limitParts(p('\\left(1+\\frac{x}{n}\\right)^n'), 'n')!
    expect(limitValue(plain, 'eq-lim-exponent')).toBeNull()
    expect(limitValue(plain, 'eq-lim-denominator')).toBeNull()
  })
})

describe('Schreibweise', () => {
  it('Summe, Reihe, Grenzwert; danach noch etwas: in Klammern', () => {
    expect(toLatex(sumOf(mul(a, pow(q, k)), num(0), sub(n, num(1))))).toBe('\\sum_{k=0}^{n - 1} aq^{k}')
    expect(toLatex(seriesOf(mul(k, pow(x, k)), num(1)))).toBe('\\sum_{k=1}^{\\infty} kx^{k}')
    expect(toLatex(limitOf(pow(add(num(1), div(x, n)), n)))).toBe('\\lim_{n \\to \\infty} \\left(1 + \\frac{x}{n}\\right)^{n}')
    expect(toLatex(add(variable('b'), seriesOf(pow(x, k), num(0))))).toBe('b + \\sum_{k=0}^{\\infty} x^{k}')
    expect(toLatex(add(seriesOf(pow(x, k), num(0)), variable('b')))).toBe('\\left(\\sum_{k=0}^{\\infty} x^{k}\\right) + b')
    expect(toLatex(neg(limitOf(pow(add(num(1), div(x, n)), n))))).toBe('-\\lim_{n \\to \\infty} \\left(1 + \\frac{x}{n}\\right)^{n}')
  })
})

describe('Beispiele aus dem Plan (Tabelle „Stufe 5")', () => {
  const solve = (lhs: Expr, target = 'x', conditions: Condition[] = []) => {
    const task = { equation: eq(lhs, y), target, conditions }
    const solution = solveTask(task)!
    // Gegenprobe: das Ergebnis erfüllt die Aufgabe (Summe, Reihe, Grenzwert numerisch)
    const pts = samplePoints(task, solution.result, createRng(equationToLatex(task.equation)), 10, solution.requires)
    expect(pts.length).toBeGreaterThanOrEqual(8)
    for (const env of pts) expect(holds(task.equation, env)).toBe(true)
    return solution
  }
  const same = (e: Expr, latex: string, envs: Record<string, number>[]) => {
    for (const env of envs) expect(close(evaluate(e, env), evaluate(p(latex), env))).toBe(true)
  }

  it('\\sum_{k=0}^{n-1} aq^k = y nach n', () => {
    const s = solve(sumOf(mul(a, pow(q, k)), num(0), sub(n, num(1))), 'n', [{ lhs: q, rel: '>', rhs: num(1) }])
    expect(s.steps[0].kind).toBe('sumFormula')
    same(s.result, '\\frac{\\ln\\left(1+\\frac{(q-1)y}{a}\\right)}{\\ln q}', [{ a: 2, q: 1.5, y: 3 }])
  })

  it('\\sum_{k=1}^{\\infty} kx^k = y', () => {
    const s = solve(seriesOf(mul(k, pow(x, k)), num(1)), 'x', [{ lhs: x, rel: '<', rhs: num(1) }])
    expect(s.steps.some((step) => step.kind === 'pq')).toBe(true)
    same(s.result, '\\frac{2y+1-\\sqrt{4y+1}}{2y}', [{ y: 0.8 }, { y: 3 }])
  })

  it('\\lim_{n \\to \\infty}\\left(\\frac{n + x}{n - x}\\right)^n = y', () => {
    const s = solve(limitOf(pow(div(add(n, x), sub(n, x)), n)))
    expect(stepEquationLatex('limit', s.steps[0].after)).toBe('e^{2x} = y')
    same(s.result, '\\frac{1}{2}\\ln y', [{ y: 3 }])
  })

  it('\\frac{\\mathrm{d}}{\\mathrm{d}x}\\sum_{k=1}^{\\infty}\\frac{x^k}{k} = y: erst die Reihe, dann ableiten', () => {
    const s = solve(derivativeOf(seriesOf(div(pow(x, k), k), num(1))), 'x', [{ lhs: x, rel: '<', rhs: num(1) }])
    expect(s.steps.slice(0, 2).map((step) => step.kind)).toEqual(['series', 'derive'])
    same(s.result, '1-\\frac{1}{y}', [{ y: 2 }, { y: 7 }])
  })

  it('\\int_0^x \\sum_{k=0}^{\\infty} t^k\\,\\mathrm{d}t = y: erst die Reihe, dann integrieren', () => {
    const s = solve(integralOf(seriesOf(pow(t, k), num(0)), num(0), x), 'x', [{ lhs: x, rel: '<', rhs: num(1) }])
    expect(s.steps.slice(0, 3).map((step) => step.kind)).toEqual(['series', 'antiderivative', 'bounds'])
    expect(toLatex(s.result)).toBe('1 - e^{-y}')
  })
})
