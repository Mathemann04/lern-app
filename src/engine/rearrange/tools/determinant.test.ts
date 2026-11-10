import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { contains, key } from '../../expr/compare.ts'
import { evaluate } from '../../expr/evaluate.ts'
import { latexProblem } from '../../expr/latexChecks.ts'
import { equationToLatex, toLatex } from '../../expr/print.ts'
import { type Expr, add, cos, div, eq, exp, ln, mul, neg, num, pow, sin, sqrt, variable } from '../../expr/types.ts'
import { checkRearrangeAnswer, prepareRearrangeCheck } from '../../check/rearrangeAnswer.ts'
import { createRng } from '../../random/rng.ts'
import { latexWidthEm } from '../../tasks/latexWidth.ts'
import { generateRearrangeTask } from '../../tasks/rearrangeTerms.ts'
import { holds, samplePoints } from '../check.ts'
import { hasNestedFraction } from '../finished.ts'
import { STEP_NAMES, solveTask, stepEquationLatex } from '../isolate.ts'
import { taskLatex, taskVariables } from '../task.ts'
import { DET_MISTAKES, type DetTool, EXPAND_MISTAKES, detValue, expandValue, expansionLine, product } from './determinant.ts'
import { detOf, integralOf, toolsIn } from './tool.ts'

// Determinanten der Stufe 5 (Teil 8a). Die Gegenprobe in evaluate.ts rechnet mit dem Gauß-Verfahren; hier
// wird sie gegen Formeln geprüft, die im Test selbst stehen (2 × 2, Sarrus), und der Rechenweg der Engine
// (Hauptdiagonale minus Nebendiagonale, Entwickeln) gegen die Gegenprobe.

const [a, b, x, y] = ['a', 'b', 'x', 'y'].map(variable)
const NAMES = ['p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'z']
const close = (u: number, v: number, scale = 1) => Math.abs(u - v) <= 1e-9 * Math.max(1, scale, Math.abs(u), Math.abs(v))
const toolOf = (e: Expr): DetTool => {
  if (e.kind !== 'var' || e.tool?.kind !== 'det') throw new Error('keine Determinante')
  return e.tool
}
// n × n aus Buchstaben p, q, r, …; Werte über env
const letters = (n: number): Expr[][] => Array.from({ length: n }, (_, i) => NAMES.slice(i * n, i * n + n).map(variable))
const det = (rows: readonly (readonly number[])[]) => {
  const env = Object.fromEntries(rows.flat().map((v, i) => [NAMES[i], v]))
  return evaluate(detOf(letters(rows.length)), env)
}
const entry = fc.double({ min: -10, max: 10, noNaN: true })
const matrix = (n: number) => fc.array(fc.array(entry, { minLength: n, maxLength: n }), { minLength: n, maxLength: n })

describe('Gegenprobe: Gauß-Verfahren gegen Formeln', () => {
  it('2 × 2: ps - qr, 3 × 3: Sarrus (Summe der Beträge als Maßstab für die Auslöschung)', () => {
    fc.assert(
      fc.property(matrix(2), matrix(3), ([[p, q], [r, s]], m) => {
        const [[a1, a2, a3], [b1, b2, b3], [c1, c2, c3]] = m
        const products = [a1 * b2 * c3, a2 * b3 * c1, a3 * b1 * c2, -a3 * b2 * c1, -a1 * b3 * c2, -a2 * b1 * c3]
        const sarrus = products.reduce((sum, v) => sum + v, 0)
        const scale = products.reduce((sum, v) => sum + Math.abs(v), 0)
        return close(det([[p, q], [r, s]]), p * s - q * r, Math.abs(p * s) + Math.abs(q * r)) && close(det(m), sarrus, scale)
      }),
      { numRuns: 500 },
    )
  })

  it('gespiegelt gleich, zwei Zeilen getauscht mit anderem Vorzeichen, Zeile mal c gibt c mal', () => {
    fc.assert(
      fc.property(matrix(3), fc.double({ min: -5, max: 5, noNaN: true }), (m, c) => {
        const scale = m.flat().reduce((s, v) => s * Math.max(1, Math.abs(v)), 6)
        const transposed = m.map((row, i) => row.map((_, j) => m[j][i]))
        const swapped = [m[1], m[0], m[2]]
        const scaled = [m[0].map((v) => c * v), m[1], m[2]]
        return close(det(transposed), det(m), scale) && close(det(swapped), -det(m), scale) && close(det(scaled), c * det(m), scale * Math.max(1, Math.abs(c)))
      }),
      { numRuns: 300 },
    )
  })

  it('Dreiecksmatrix: Produkt der Diagonale; Einheitsmatrix 1; eine Spalte aus Nullen genau 0; Pivot 0 ganz oben', () => {
    expect(det([[2, 7, -1], [0, 3, 5], [0, 0, -4]])).toBeCloseTo(-24, 12)
    expect(det([[1, 0, 0], [0, 1, 0], [0, 0, 1]])).toBe(1)
    expect(det([[0, 3, 1], [0, 2, 5], [0, 7, 4]])).toBe(0)
    // ohne Zeilentausch geteilt durch 0
    expect(det([[0, 1, 2], [3, 4, 5], [6, 7, 9]])).toBeCloseTo(-3, 12)
    expect(det([[1e-12, 1], [1, 1]])).toBeCloseTo(-1, 9)
  })

  it('kein Wert, sobald ein Eintrag nicht definiert ist, auch neben einer Spalte aus Nullen', () => {
    const d = detOf([
      [num(0), ln(x)],
      [num(0), a],
    ])
    expect(evaluate(d, { x: 2, a: 3 })).toBe(0)
    expect(evaluate(d, { x: -1, a: 3 })).toBeNaN()
    expect(evaluate(detOf([[exp(x), a], [b, exp(x)]]), { x: 800, a: 1, b: 1 })).toBeNaN()
  })

  it('unterscheidet schon kleine Änderungen eines Eintrags', () => {
    const base = det([[3, 1, 2], [1, 4, 1], [2, 1, 5]])
    expect(Math.abs(det([[3, 1, 2], [1, 4.00001, 1], [2, 1, 5]]) - base)).toBeGreaterThan(1e-5)
  })
})

describe('Rechenweg', () => {
  it('Produkte aufgeräumt, der Wert bleibt: Zahl vorn, Buchstaben sortiert, gleiche Faktoren zusammengefasst', () => {
    const pool: Expr[] = [x, pow(x, num(2)), sqrt(x), div(num(1), x), exp(x), exp(neg(x)), exp(mul(num(2), x)), sin(x), cos(x), ln(x), a, b, num(3), neg(a), add(x, a)]
    const rng = createRng('produkte')
    for (let i = 0; i < 400; i++) {
      const factors = Array.from({ length: rng.int(2, 4) }, () => rng.pick(pool))
      const env = { x: 0.2 + 3 * rng.next(), a: 0.3 + 4 * rng.next(), b: 0.3 + 4 * rng.next() }
      const tidy = product(...factors)
      expect(close(evaluate(tidy, env), evaluate(mul(...factors), env)), `${factors.map(toLatex).join(' · ')} = ${toLatex(tidy)}`).toBe(true)
    }
    expect(toLatex(product(exp(x), b))).toBe('be^{x}')
    expect(toLatex(product(exp(x), exp(neg(x))))).toBe('1')
    expect(toLatex(product(exp(x), exp(x)))).toBe('e^{2x}')
    expect(toLatex(product(sin(x), sin(x)))).toBe('\\sin^{2} x')
    expect(toLatex(product(a, div(num(1), x)))).toBe('\\frac{a}{x}')
    expect(toLatex(product(x, div(num(1), x)))).toBe('1')
    expect(toLatex(product(pow(x, num(2)), div(num(1), x), b))).toBe('bx')
    expect(toLatex(product(x, pow(x, num(2)), b))).toBe('bx^{3}')
    expect(key(product(sin(x), cos(x)))).toBe(key(product(cos(x), sin(x))))
  })

  it('in Zeilen oder Spalten: die Variante, in der x bleibt (zeilenweise wäre x \\cdot \\frac{1}{x} = 1)', () => {
    const t = toolOf(detOf([[x, div(num(1), x)], [a, b]]))
    expect(toLatex(detValue(t, 'eq-det-rows')!)).toBe('ax - \\frac{b}{x}')
    expect(toLatex(detValue(t, null)!)).toBe('bx - \\frac{a}{x}')
  })

  it('Entwickeln nach der Zeile oder Spalte mit zwei Nullen: Zeilen vor Spalten, oben vor unten', () => {
    const z = num(0)
    expect(expansionLine([[a, z, z], [b, a, b], [b, b, a]])).toEqual({ row: true, i: 0, j: 0 })
    expect(expansionLine([[a, b, z], [b, a, a], [z, a, b]])).toBeNull()
    expect(expansionLine([[a, b, z], [b, a, a], [b, a, z]])).toEqual({ row: false, i: 1, j: 2 })
    expect(expansionLine([[a, b, a], [z, a, b], [z, b, a]])).toEqual({ row: false, i: 0, j: 0 })
  })
})

describe('Beispiele aus dem Plan', () => {
  it('2 × 2 mit e^{x} und e^{-x}: Determinante ausrechnen, dann Substitution und pq-Formel', () => {
    for (const rows of [
      [
        [exp(x), exp(neg(x))],
        [a, b],
      ],
      [
        [exp(x), a],
        [exp(neg(x)), b],
      ],
    ]) {
      const task = { equation: eq(detOf(rows), y), target: 'x', conditions: [] }
      const s = solveTask(task)!
      expect(s.steps[0].kind).toBe('det')
      expect(equationToLatex(s.steps[0].after)).toBe('be^{x} - ae^{-x} = y')
      expect(toLatex(s.result)).toBe('\\ln\\left(\\frac{y + \\sqrt{y^{2} + 4ab}}{2b}\\right)')
      expect(s.steps.length).toBe(10)
      // Gegenprobe mit der Determinante selbst (Gauß), nicht mit dem Rechenweg
      const points = samplePoints(task, s.result, createRng('plan'), 12, s.requires)
      expect(points.length).toBe(12)
      for (const p of points) expect(holds(task.equation, p)).toBe(true)
    }
  })

  it('3 × 3 mit einer Zeile mit zwei Nullen: erst entwickeln (Minus aus dem Schachbrett), dann ausrechnen', () => {
    const task = {
      equation: eq(
        detOf([
          [num(1), x, pow(x, num(2))],
          [num(1), num(0), num(0)],
          [num(1), a, pow(a, num(2))],
        ]),
        y,
      ),
      target: 'x',
      conditions: [],
    }
    const s = solveTask(task)!
    expect(s.steps.slice(0, 2).map((step) => stepEquationLatex(step.kind, step.after))).toEqual([
      '-\\det\\begin{pmatrix} x & x^{2} \\\\ a & a^{2} \\end{pmatrix} = y',
      '-(a^{2}x - ax^{2}) = y',
    ])
    expect(s.steps.map((step) => STEP_NAMES[step.kind]).slice(0, 2)).toEqual(['Determinante entwickeln', 'Determinante ausrechnen'])
    expect(toLatex(s.result)).toBe('\\frac{a^{2} + \\sqrt{a^{4} + 4ay}}{2a}')
    const points = samplePoints(task, s.result, createRng('plan'), 12, s.requires)
    expect(points.length).toBe(12)
    for (const p of points) expect(holds(task.equation, p)).toBe(true)
  })

  it('Integral gleich Determinante', () => {
    const task = { equation: eq(integralOf(exp(variable('t')), num(0), x), detOf([[a, exp(x)], [num(1), b]])), target: 'x', conditions: [] }
    expect(toLatex(solveTask(task)!.result)).toBe('\\ln\\left(\\frac{ab + 1}{2}\\right)')
  })

  it('Schreibweise: \\det mit runden Klammern, die Buchstaben der Einträge gehören zur Aufgabe', () => {
    const d = detOf([
      [x, a],
      [b, add(x, num(2))],
    ])
    expect(toLatex(d)).toBe('\\det\\begin{pmatrix} x & a \\\\ b & x + 2 \\end{pmatrix}')
    expect(contains(d, 'x')).toBe(true)
    expect(taskVariables({ equation: eq(d, y), target: 'x', conditions: [] })).toEqual(['a', 'b', 'x', 'y'])
    // große Klammern um die Matrix im \ln und in Potenzen
    expect(toLatex(ln(d))).toBe('\\ln\\left(\\det\\begin{pmatrix} x & a \\\\ b & x + 2 \\end{pmatrix}\\right)')
  })
})

describe('Baukasten (Nummern 1 bis 600 der Stufe 5)', () => {
  const generated = Array.from({ length: 600 }, (_, i) => generateRearrangeTask({ level: 5, seed: i + 1 })).filter((g) => g.template.id === 'baukasten-5-determinante')
  const dets = generated.flatMap((g) => toolsIn(g.task.equation).filter((t) => t.tool.kind === 'det'))

  it('genug Aufgaben, 2 × 2 und 3 × 3, auch Integral gleich Determinante', () => {
    expect(generated.length).toBeGreaterThanOrEqual(40)
    expect(dets.some((d) => toolOf(d).rows.length === 3)).toBe(true)
    expect(generated.some((g) => g.label.startsWith('Integral gleich Determinante'))).toBe(true)
  })

  it('Gegenprobe an den Prüfstellen; Aufgabe und Ergebnis passen am Handy in eine Zeile, das Ergebnis ohne Doppelbruch', () => {
    for (const g of generated) {
      const s = solveTask(g.task)!
      const points = samplePoints(g.task, s.result, createRng('gegenprobe'), 8, s.requires)
      expect(points.length, taskLatex(g.task)).toBe(8)
      for (const p of points) expect(holds(g.task.equation, p), taskLatex(g.task)).toBe(true)
      expect(latexWidthEm(taskLatex(g.task)), taskLatex(g.task)).toBeLessThanOrEqual(12)
      expect(latexProblem(taskLatex(g.task)), taskLatex(g.task)).toBeNull()
      expect(latexWidthEm(`x = ${toLatex(s.result)}`), toLatex(s.result)).toBeLessThanOrEqual(16.5)
      expect(hasNestedFraction(s.result), toLatex(s.result)).toBe(false)
    }
  })

  it('ohne den Filter für das Ergebnis hätten 5-1237 (Doppelbruch in der Hochzahl) und 5-1742 (zu breit) eine andere Aufgabe', () => {
    for (const seed of [1237, 1742]) {
      const g = generateRearrangeTask({ level: 5, seed })
      expect(g.template.id).toBe('baukasten-5-determinante')
      const s = solveTask(g.task)!
      expect(latexWidthEm(`x = ${toLatex(s.result)}`)).toBeLessThanOrEqual(16.5)
      expect(hasNestedFraction(s.result)).toBe(false)
    }
    expect(taskLatex(generateRearrangeTask({ level: 5, seed: 1237 }).task)).toBe('\\det\\begin{pmatrix} e^{x} & e^{-x} \\\\ a & b \\end{pmatrix} = \\frac{c}{d}')
    expect(taskLatex(generateRearrangeTask({ level: 5, seed: 1742 }).task)).toBe('c\\det\\begin{pmatrix} \\tan x & a \\\\ 1 & b \\end{pmatrix} - \\frac{d}{g} = y')
  })

  it('der freie Modus nimmt das Ergebnis der Engine als richtig und fertig an', () => {
    for (const g of generated) {
      const c = prepareRearrangeCheck(g.task, true)
      expect(checkRearrangeAnswer(c, toLatex(c.solution.result)), taskLatex(g.task)).toEqual({ kind: 'correct' })
    }
  })

  it('2 × 2 ohne 0 und ohne Minus vor einem Eintrag, nie zweimal derselbe Eintrag in einer Spalte; 3 × 3 mit genau einer Linie mit zwei Nullen, ihr Eintrag nicht 1', () => {
    for (const d of dets) {
      const m = toolOf(d).rows
      if (m.length === 2) {
        for (const e of m.flat()) expect(e.kind === 'neg' || (e.kind === 'num' && e.value.n <= 0n), toLatex(d)).toBe(false)
        for (const j of [0, 1]) expect(key(m[0][j]) === key(m[1][j]), toLatex(d)).toBe(false)
        continue
      }
      const line = expansionLine(m)!
      expect(line, toLatex(d)).not.toBeNull()
      expect(toLatex(m[line.i][line.j])).not.toBe('1')
      const zeros = m.flat().filter((e) => e.kind === 'num' && e.value.n === 0n).length
      expect(zeros, toLatex(d)).toBe(2)
    }
  })

  it('Rechenweg gleich Gegenprobe; jeder Fehler ergibt einen anderen Wert, keiner doppelt', () => {
    const rng = createRng('rechenweg')
    for (const d of dets) {
      const t = toolOf(d)
      const three = t.rows.length === 3
      const right = three ? expandValue(t, null)! : detValue(t, null)!
      const wrong = (three ? EXPAND_MISTAKES.map((id) => expandValue(t, id)) : DET_MISTAKES.map((id) => detValue(t, id))).filter((w) => w !== null)
      expect(new Set([right, ...wrong].map(key)).size, toLatex(d)).toBe(wrong.length + 1)
      const envs = Array.from({ length: 12 }, () => Object.fromEntries([...taskVariables({ equation: eq(d, d), target: 'x', conditions: [] })].map((n) => [n, n === 'x' ? 0.1 + 1.4 * rng.next() : 0.3 + 4 * rng.next()])))
      for (const env of envs) expect(close(evaluate(right, env), evaluate(d, env)), `${toLatex(d)} = ${toLatex(right)}`).toBe(true)
      for (const w of wrong) {
        if (!contains(w, 'x')) continue
        expect(envs.some((env) => !close(evaluate(w, env), evaluate(d, env))), `${toLatex(d)}: ${toLatex(w)}`).toBe(true)
      }
    }
  })

  it('in jeder Aufgabe eine Frage zur Determinante (mindestens ein typischer Fehler im Schritt)', async () => {
    const { rearrangeWrongAnswers } = await import('../errorRules.ts')
    for (const g of generated) {
      const s = solveTask(g.task)!
      const steps = new Set(s.steps.flatMap((step, i) => (step.kind === 'det' || step.kind === 'detExpand' ? [i] : [])))
      const wrong = rearrangeWrongAnswers(g.task, s).filter((w) => steps.has(w.stepIndex))
      expect(wrong.length, taskLatex(g.task)).toBeGreaterThan(0)
    }
  })
})
