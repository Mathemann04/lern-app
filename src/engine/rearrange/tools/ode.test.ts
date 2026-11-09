import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { numericDerivative } from '../../check/numeric.ts'
import { derive } from '../../derive/derive.ts'
import { subterms } from '../../expr/compare.ts'
import { evaluate } from '../../expr/evaluate.ts'
import { equationToLatex, toLatex } from '../../expr/print.ts'
import { substitute } from '../../expr/substitute.ts'
import { type Expr, add, eq, mul, neg, num, pow, sqrt, sub, variable } from '../../expr/types.ts'
import { createRng } from '../../random/rng.ts'
import { rat } from '../../rational.ts'
import { generateRearrangeTask } from '../../tasks/rearrangeTerms.ts'
import { holds, samplePoints } from '../check.ts'
import { solveTask } from '../isolate.ts'
import { taskLatex } from '../task.ts'
import { ODE_MISTAKES, type OdeTool, odeSolution } from './ode.ts'
import { odeOf, toolsIn } from './tool.ts'

// Differentialgleichungen der Stufe 5 (Teil 7c). Die Gegenprobe in evaluate.ts löst die Gleichung
// numerisch (Runge-Kutta); hier wird sie gegen Formeln geprüft, die im Test selbst stehen. Die Lösungen
// der Engine werden eingesetzt und numerisch abgeleitet, wie im Plan verlangt.

const [a, b, f, k, y] = ['a', 'b', 'f', 'k', 'y'].map(variable)
const close = (u: number, v: number, tolerance: number) => Math.abs(u - v) <= tolerance * Math.max(1, Math.abs(u), Math.abs(v))
const toolOf = (e: Expr): OdeTool => {
  if (e.kind !== 'var' || e.tool?.kind !== 'ode') throw new Error('keine Differentialgleichung')
  return e.tool
}
const ksq = pow(k, num(2))

describe('Gegenprobe: Runge-Kutta gegen Formeln', () => {
  const growth = odeOf(mul(k, f), 1, [a])
  const decay = odeOf(neg(mul(k, f)), 1, [a])
  const cooling = odeOf(mul(k, sub(b, f)), 1, [a])
  const second = odeOf(mul(ksq, f), 2, [a, b])

  it.each([1e-3, 0.5, 3, 8, 20, 40])('Wachstum und Abnahme bei kx = %s', (kx) => {
    const env = { a: 1.7, k: 0.9, x: kx / 0.9 }
    expect(close(evaluate(growth, env), 1.7 * Math.exp(kx), 1e-9)).toBe(true)
    expect(close(evaluate(decay, env), 1.7 * Math.exp(-kx), 1e-9)).toBe(true)
  })

  it("Abkühlen, f'' = k^2 f mit beiden Anfangswerten, zufällige Stellen", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.3, max: 8, noNaN: true }),
        fc.double({ min: 0.3, max: 8, noNaN: true }),
        fc.double({ min: 0.3, max: 8, noNaN: true }),
        fc.double({ min: 0, max: 12, noNaN: true }),
        (av, bv, kv, kx) => {
          const env = { a: av, b: bv, k: kv, x: kx / kv }
          const cool = bv + (av - bv) * Math.exp(-kx)
          const hyperbolic = av * Math.cosh(kx) + (bv / kv) * Math.sinh(kx)
          return close(evaluate(cooling, env), cool, 1e-9) && close(evaluate(second, env), hyperbolic, 1e-9)
        },
      ),
      { numRuns: 200 },
    )
  })

  it('bei x = 0 genau der Anfangswert, im Gleichgewicht bleibt f stehen', () => {
    expect(evaluate(second, { a: 2.5, b: 1, k: 3, x: 0 })).toBe(2.5)
    expect(evaluate(cooling, { a: 2, b: 2, k: 1.3, x: 4 })).toBeCloseTo(2, 12)
  })

  it('Überlagerung und Skalierung: f(x) hängt nur von kx ab, die Anfangswerte addieren sich', () => {
    const env = { a: 1.2, b: 0.7, k: 1.5, x: 2.2 }
    const onlyA = odeOf(mul(ksq, f), 2, [a, num(0)])
    const onlyB = odeOf(mul(ksq, f), 2, [num(0), b])
    expect(close(evaluate(second, env), evaluate(onlyA, env) + evaluate(onlyB, env), 1e-12)).toBe(true)
    expect(close(evaluate(onlyA, env), evaluate(onlyA, { ...env, k: 3, x: 1.1 }), 1e-12)).toBe(true)
  })

  it('kein Wert, wo die Rechnung nichts mehr sagt', () => {
    // kx > 50, rechte Seite nicht linear, Anfangswert nicht definiert
    expect(evaluate(growth, { a: 1, k: 2, x: 30 })).toBeNaN()
    expect(evaluate(odeOf(pow(f, num(2)), 1, [a]), { a: 1, x: 0.5 })).toBeNaN()
    expect(evaluate(odeOf(mul(k, f), 1, [sqrt(neg(a))]), { a: 1, k: 1, x: 0.5 })).toBeNaN()
  })

  it('unterscheidet schon kleine Änderungen der Rate', () => {
    const env = { a: 1, k: 2, x: 2 }
    expect(Math.abs(evaluate(growth, env) - evaluate(growth, { ...env, k: 2 * (1 + 1e-5) }))).toBeGreaterThan(1e-7)
  })
})

// Zahlen für die Buchstaben, damit sich die Lösung allein in x ableiten lässt
const NUMBERS: Record<string, Expr> = { a: num(rat(7, 4)), b: num(rat(5, 3)), k: num(rat(6, 5)) }
const withNumbers = (e: Expr) => Object.entries(NUMBERS).reduce((acc, [name, value]) => substitute(acc, name, value), e)
const VALUES = { a: 7 / 4, b: 5 / 3, k: 6 / 5 }

// Die Lösung eingesetzt: Differentialgleichung (numerisch abgeleitet) und Anfangswerte
function check(tool: OdeTool, solution: Expr) {
  const F = withNumbers(solution)
  const rhs = (value: number) => evaluate(tool.body, { ...VALUES, [tool.v]: value })
  const ode: boolean[] = []
  for (let i = 1; i <= 20; i++) {
    const at = (i * 0.3) / VALUES.k
    const value = evaluate(F, { x: at })
    if (tool.order === 1) {
      const d = numericDerivative(F, at)
      ode.push(d !== null && close(d, rhs(value), 1e-7))
    } else {
      // symbolisch einmal, numerisch noch einmal abgeleitet, und rein numerisch mit dem zweiten Differenzenquotienten
      const d2 = numericDerivative(derive(F, 'x').result, at)
      const h = 1e-3
      const second = (evaluate(F, { x: at + h }) - 2 * value + evaluate(F, { x: at - h })) / (h * h)
      ode.push(d2 !== null && close(d2, rhs(value), 1e-7) && close(second, rhs(value), 1e-5))
    }
  }
  const start = [evaluate(F, { x: 0 }), numericDerivative(F, 0)]
  const initial = tool.initial.map((v, i) => {
    const s = start[i]
    return s !== null && close(s, evaluate(v, VALUES), 1e-7)
  })
  return { ode: ode.every(Boolean), initial: initial.every(Boolean) }
}

describe('Lösung der Engine: eingesetzt, numerisch abgeleitet', () => {
  const cases: Array<[string, Expr, string]> = [
    ["f' = kf", odeOf(mul(k, f), 1, [a]), 'ae^{kx}'],
    ["f' = -kf", odeOf(neg(mul(k, f)), 1, [a]), 'ae^{-kx}'],
    ["f' = -2f", odeOf(mul(num(-2), f), 1, [num(3)]), '3e^{-2x}'],
    ["f' = k(b - f)", odeOf(mul(k, sub(b, f)), 1, [a]), 'b + (a - b)e^{-kx}'],
    ["f'' = k^2 f, (a, 0)", odeOf(mul(ksq, f), 2, [a, num(0)]), '\\frac{a}{2}e^{kx} + \\frac{a}{2}e^{-kx}'],
    ["f'' = k^2 f, (0, b)", odeOf(mul(ksq, f), 2, [num(0), b]), '\\frac{b}{2k}e^{kx} - \\frac{b}{2k}e^{-kx}'],
    ["f'' = 4f, (3, 0)", odeOf(mul(num(4), f), 2, [num(3), num(0)]), '\\frac{3}{2}e^{2x} + \\frac{3}{2}e^{-2x}'],
    ["f'' = f, (0, b)", odeOf(f, 2, [num(0), b]), '\\frac{b}{2}e^{x} - \\frac{b}{2}e^{-x}'],
  ]

  it.each(cases)('%s', (_name, e, expected) => {
    const tool = toolOf(e)
    const solution = odeSolution(tool, null)!
    expect(toLatex(solution)).toBe(expected)
    expect(check(tool, solution)).toEqual({ ode: true, initial: true })
    // und gleich der Gegenprobe
    for (const at of [0.2, 1.1, 2.5]) expect(close(evaluate(solution, { ...VALUES, x: at }), evaluate(e, { ...VALUES, x: at }), 1e-9)).toBe(true)
  })

  it.each(cases)('%s: jeder typische Fehler verletzt die Gleichung oder einen Anfangswert', (_name, e) => {
    const tool = toolOf(e)
    const correct = odeSolution(tool, null)!
    for (const id of ODE_MISTAKES) {
      const wrong = odeSolution(tool, id)
      if (!wrong) continue
      expect(toLatex(wrong), id).not.toBe(toLatex(correct))
      const r = check(tool, wrong)
      expect(r.ode && r.initial, id).toBe(false)
    }
  })

  it('Fehler aus dem Plan: nur e^{kx} angesetzt erfüllt die Gleichung, aber nicht f\'(0) = 0', () => {
    const tool = toolOf(odeOf(mul(ksq, f), 2, [a, num(0)]))
    const wrong = odeSolution(tool, 'eq-ode-initial-unused')!
    expect(toLatex(wrong)).toBe('ae^{kx}')
    expect(check(tool, wrong)).toEqual({ ode: true, initial: false })
  })
})

describe('Beispiel aus dem Plan', () => {
  // f'' = k^2 f, f(0) = a, f'(0) = 0, f(x) = y ⇒ x = \frac{1}{k}\ln\frac{y + \sqrt{y^2 - a^2}}{a}
  const task = { equation: eq(odeOf(mul(ksq, f), 2, [a, num(0)]), y), target: 'x', conditions: [] }

  it('erst die Differentialgleichung, dann Substitution und pq-Formel', () => {
    const solution = solveTask(task)!
    expect(solution.steps[0].kind).toBe('ode')
    expect(equationToLatex(solution.steps[0].after)).toBe('\\frac{a}{2}e^{kx} + \\frac{a}{2}e^{-kx} = y')
    expect(solution.steps.map((s) => s.kind)).toContain('pq')
    expect(toLatex(solution.result)).toBe('\\frac{\\ln\\left(\\frac{y + \\sqrt{y^{2} - a^{2}}}{a}\\right)}{k}')
    for (const env of [{ a: 1, k: 2, y: 3 }, { a: 0.7, k: 0.4, y: 5 }]) {
      const value = evaluate(solution.result, env)
      expect(value).toBeCloseTo(Math.log((env.y + Math.sqrt(env.y ** 2 - env.a ** 2)) / env.a) / env.k, 12)
      expect(value).toBeCloseTo(Math.acosh(env.y / env.a) / env.k, 12)
    }
  })

  it('Gegenprobe mit der Differentialgleichung selbst (Runge-Kutta), nicht mit der Lösung', () => {
    const solution = solveTask(task)!
    const points = samplePoints(task, solution.result, createRng('plan'), 16, solution.requires)
    expect(points.length).toBeGreaterThanOrEqual(8)
    for (const point of points) expect(holds(task.equation, point)).toBe(true)
  })

  it('Die Aufgabe zeigt die Differentialgleichung über der Gleichung', () => {
    expect(taskLatex(task)).toBe("\\begin{gathered}f'' = k^{2}f,\\; f(0) = a,\\; f'(0) = 0 \\\\ f(x) = y\\end{gathered}")
  })
})

describe('Baukasten', () => {
  const generated = Array.from({ length: 300 }, (_, i) => generateRearrangeTask({ level: 5, seed: i + 1 })).filter((g) => g.template.id === 'baukasten-5-dgl')

  it('Differentialgleichungen stehen nie in einem anderen Werkzeug (Runge-Kutta ist nicht glatt genug zum Ableiten)', () => {
    expect(generated.length).toBeGreaterThan(20)
    for (const g of generated) {
      for (const tool of toolsIn(g.task.equation)) {
        if (tool.tool.kind === 'ode') continue
        expect(subterms(tool.tool.body).some((s) => s.kind === 'var' && s.tool?.kind === 'ode')).toBe(false)
      }
    }
  })

  it('beide Funktionen f und g mit derselben Rate, eine Zeile je Funktion', () => {
    const two = generated.filter((g) => toolsIn(g.task.equation).some((t) => t.tool.v === 'g'))
    expect(two.length).toBeGreaterThan(0)
    for (const g of two) expect(taskLatex(g.task)).toMatch(/^\\begin\{gathered\}f' = .* \\\\ g' = /)
  })

  it('alle Aufgaben: Gegenprobe an den Prüfstellen', () => {
    for (const g of generated) {
      const solution = solveTask(g.task)!
      const points = samplePoints(g.task, solution.result, createRng('dgl'), 16, solution.requires)
      expect(points.length, taskLatex(g.task)).toBeGreaterThanOrEqual(8)
      for (const point of points) expect(holds(g.task.equation, point), taskLatex(g.task)).toBe(true)
    }
  })

  it('Schreibweise: Malpunkt vor f(x), Klammern um f(x) im ln und in Potenzen', () => {
    const fx = odeOf(mul(k, f), 1, [a])
    expect(toLatex(mul(b, fx))).toBe('b \\cdot f(x)')
    expect(toLatex(mul(num(3), fx))).toBe('3f(x)')
    expect(toLatex(add(fx, b))).toBe('f(x) + b')
  })
})
