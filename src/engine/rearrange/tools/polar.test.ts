import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { contains, key } from '../../expr/compare.ts'
import { evaluate } from '../../expr/evaluate.ts'
import { latexProblem } from '../../expr/latexChecks.ts'
import { equationToLatex, toLatex } from '../../expr/print.ts'
import { type Expr, E, IMAG, PI, add, div, eq, ln, mul, neg, num, pow, sqrt, sub, variable } from '../../expr/types.ts'
import { checkRearrangeAnswer, prepareRearrangeCheck, prepareRearrangeFree } from '../../check/rearrangeAnswer.ts'
import { createRng } from '../../random/rng.ts'
import { latexWidthEm } from '../../tasks/latexWidth.ts'
import { generateRearrangeTask } from '../../tasks/rearrangeTerms.ts'
import { holds, samplePoints } from '../check.ts'
import { rearrangeWrongAnswers } from '../errorRules.ts'
import { hasNestedFraction } from '../finished.ts'
import { solveTask, stepEquationLatex } from '../isolate.ts'
import { taskLatex, taskVariables } from '../task.ts'
import { ABS_MISTAKES, ARG_MISTAKES, type AbsTool, type ArgTool, absValue, argValue, complexFactors } from './polar.ts'
import { absOf, angleOf, argOf, dotOf, lengthOf, toolsIn } from './tool.ts'
import { ANGLE_MISTAKES, DOT_MISTAKES, LENGTH_MISTAKES, angleValue, dotValue, lengthValue } from './vector.ts'

// Betrag und Winkel komplexer Zahlen, Länge, Skalarprodukt und Winkel von Vektoren (Stufe 5, Teil 8b). Die
// Gegenprobe in evaluate.ts rechnet mit komplexen Zahlen bzw. Zahlen; hier wird sie gegen Formeln geprüft, die
// im Test selbst stehen, und der Rechenweg der Engine (polar.ts, vector.ts) gegen die Gegenprobe.

const [a, b, c, x, y] = ['a', 'b', 'c', 'x', 'y'].map(variable)
const close = (u: number, v: number) => Math.abs(u - v) <= 1e-9 * Math.max(1, Math.abs(u), Math.abs(v))
const z = (re: Expr, im: Expr) => add(re, mul(im, IMAG))
const zbar = (re: Expr, im: Expr) => sub(re, mul(im, IMAG))
const one = num(1)
const value = (e: Expr, env: Record<string, number>) => evaluate(e, env)
const acute = [{ lhs: y, rel: '<' as const, rhs: div(PI, num(2)) }]
const toolOf = (e: Expr) => {
  if (e.kind !== 'var' || !e.tool) throw new Error('kein Werkzeug')
  return e.tool
}

describe('Gegenprobe: Betrag und Winkel mit komplexen Zahlen gerechnet', () => {
  it('Betrag: Pythagoras, Bruch, Quadrat und Euler-Form', () => {
    expect(value(absOf(z(num(3), num(4))), {})).toBe(5)
    const env = { x: 1.3, a: 0.7, b: 2.1 }
    expect(close(value(absOf(z(x, a)), env), Math.hypot(1.3, 0.7))).toBe(true)
    expect(close(value(absOf(div(z(x, a), zbar(x, b))), env), Math.hypot(1.3, 0.7) / Math.hypot(1.3, 2.1))).toBe(true)
    expect(close(value(absOf(pow(z(x, a), num(2))), env), 1.3 ** 2 + 0.7 ** 2)).toBe(true)
    // \lvert a + e^{\mathrm{i}x}\rvert^2 = a^2 + 2a\cos x + 1 (Kosinussatz)
    expect(close(value(absOf(add(a, pow(E, mul(IMAG, x)))), env), Math.sqrt(0.49 + 1.4 * Math.cos(1.3) + 1))).toBe(true)
  })

  it('Winkel: Hauptwert zwischen -π und π', () => {
    expect(close(value(argOf(add(one, IMAG)), {}), Math.PI / 4)).toBe(true)
    expect(close(value(argOf(IMAG), {}), Math.PI / 2)).toBe(true)
    expect(close(value(argOf(neg(one)), {}), Math.PI)).toBe(true)
    expect(close(value(argOf(sub(one, IMAG)), {}), -Math.PI / 4)).toBe(true)
    expect(Number.isNaN(value(argOf(mul(num(0), IMAG)), {}))).toBe(true)
    const env = { x: 0.9, a: 1.7 }
    expect(close(value(argOf(pow(z(x, a), num(2))), env), 2 * Math.atan(1.7 / 0.9))).toBe(true)
    expect(close(value(argOf(mul(add(one, IMAG), z(x, a))), env), Math.atan(1.7 / 0.9) + Math.PI / 4)).toBe(true)
  })

  it('Betrag und Winkel eines Produkts (Zufallszahlen): Beträge malgenommen, Winkel addiert', () => {
    const part = fc.double({ min: -5, max: 5, noNaN: true }).filter((v) => Math.abs(v) > 0.1)
    fc.assert(
      fc.property(part, part, part, part, (p, q, r, s) => {
        const env = { p, q, r, s }
        const [P, Q, R, S] = ['p', 'q', 'r', 's'].map(variable)
        const w = mul(z(P, Q), z(R, S))
        expect(close(value(absOf(w), env), Math.hypot(p, q) * Math.hypot(r, s))).toBe(true)
        // Winkel bis auf Vielfache von 2π
        const d = value(argOf(w), env) - Math.atan2(q, p) - Math.atan2(s, r)
        expect(close(Math.cos(d), 1)).toBe(true)
      }),
    )
  })

  it('Vektoren: Länge, Skalarprodukt, Winkel; der Nullvektor hat keinen Winkel', () => {
    expect(value(lengthOf([num(3), num(4)]), {})).toBe(5)
    expect(value(dotOf([one, num(2), num(3)], [num(4), num(-5), num(6)]), {})).toBe(12)
    expect(close(value(angleOf([one, num(0)], [num(0), one]), {}), Math.PI / 2)).toBe(true)
    expect(value(angleOf([num(2), num(3)], [num(4), num(6)]), {})).toBe(0)
    expect(close(value(angleOf([one, num(0)], [num(-1), num(0)]), {}), Math.PI)).toBe(true)
    expect(Number.isNaN(value(angleOf([num(0), num(0)], [one, num(0)]), {}))).toBe(true)
  })
})

// Werkzeuge mit x, wie sie im Baukasten vorkommen
const ABS_BODIES: readonly Expr[] = [
  z(x, a),
  div(z(x, a), zbar(x, b)),
  add(x, mul(add(x, a), IMAG)),
  pow(z(x, a), num(2)),
  mul(z(num(3), num(4)), z(x, a)),
  mul(add(one, IMAG), z(x, a)),
  div(z(x, a), z(one, num(2))),
  sub(mul(b, pow(E, mul(IMAG, x))), a),
  add(a, mul(IMAG, sqrt(x))),
]
const ARG_BODIES: readonly Expr[] = [
  z(x, a),
  pow(z(x, a), num(2)),
  mul(add(one, IMAG), z(x, a)),
  div(z(x, a), add(one, IMAG)),
  mul(zbar(one, one), pow(z(x, a), num(2))),
  add(x, mul(add(x, a), IMAG)),
  mul(z(x, a), zbar(a, x)),
  z(pow(E, x), a),
]
const VECTORS: readonly (readonly [readonly Expr[], readonly Expr[]])[] = [
  [
    [x, a, b],
    [one, num(0), num(0)],
  ],
  [
    [x, a],
    [x, neg(a)],
  ],
  [
    [x, a, b],
    [x, b, neg(a)],
  ],
  [
    [a, x],
    [one, num(0)],
  ],
  [
    [x, a],
    [add(x, b), neg(c)],
  ],
]

// Stellen mit x und den Buchstaben positiv, der Realteil damit positiv
function envs(seed: string, count = 16) {
  const rng = createRng(seed)
  return Array.from({ length: count }, () => ({ x: 0.2 + 2 * rng.next(), a: 0.3 + 3 * rng.next(), b: 0.3 + 3 * rng.next(), c: 0.3 + 3 * rng.next() }))
}

describe('Rechenweg', () => {
  it('Betrag: der Wert stimmt mit der Gegenprobe überein; ein Bruch steht unter einer Wurzel, ein Quadrat ohne Wurzel', () => {
    for (const body of ABS_BODIES) {
      const t = toolOf(absOf(body)) as AbsTool
      const v = absValue(t, null)!
      for (const env of envs(toLatex(body))) expect(close(value(v, env), value(absOf(body), env)), toLatex(body)).toBe(true)
    }
    const latex = (body: Expr) => toLatex(absValue(toolOf(absOf(body)) as AbsTool, null)!)
    expect(latex(div(z(x, a), zbar(x, b)))).toBe('\\sqrt{\\frac{x^{2} + a^{2}}{x^{2} + b^{2}}}')
    expect(latex(pow(z(x, a), num(2)))).toBe('x^{2} + a^{2}')
    expect(latex(mul(z(num(3), num(4)), z(x, a)))).toBe('5\\sqrt{x^{2} + a^{2}}')
    expect(latex(mul(add(one, IMAG), z(x, a)))).toBe('\\sqrt{2(x^{2} + a^{2})}')
    expect(latex(sub(mul(b, pow(E, mul(IMAG, x))), a))).toBe('\\sqrt{(b\\cos x - a)^{2} + b^{2}\\sin^{2} x}')
    expect(latex(add(x, mul(add(x, a), IMAG)))).toBe('\\sqrt{x^{2} + (x + a)^{2}}')
  })

  it('Winkel: \\arctan von Imaginärteil durch Realteil, beim Quadrieren doppelt, feste Faktoren mit ihrem Winkel', () => {
    for (const body of ARG_BODIES) {
      const t = toolOf(argOf(body)) as ArgTool
      const v = argValue(t, null)!
      for (const env of envs(toLatex(body))) expect(close(value(v, env), value(argOf(body), env)), toLatex(body)).toBe(true)
    }
    const latex = (body: Expr) => toLatex(argValue(toolOf(argOf(body)) as ArgTool, null)!)
    expect(latex(pow(z(x, a), num(2)))).toBe('2\\arctan\\left(\\frac{a}{x}\\right)')
    expect(latex(div(z(x, a), add(one, IMAG)))).toBe('\\arctan\\left(\\frac{a}{x}\\right) - \\frac{\\pi}{4}')
    // zwei Faktoren mit x: erst ausmultiplizieren, dann ein \arctan
    expect(latex(mul(z(x, a), zbar(a, x)))).toBe('\\arctan\\left(\\frac{a^{2} - x^{2}}{2ax}\\right)')
    // Realteil nicht sicher positiv: kein \arctan
    expect(argValue(toolOf(argOf(zbar(sub(x, a), b))) as ArgTool, null)).toBeNull()
  })

  it('Vektoren: Skalarprodukt mit Vorzeichen, gleich lange Vektoren ohne Wurzel, die Länge 1 fällt weg', () => {
    for (const [u, v] of VECTORS) {
      const angle = angleOf(u, v)
      const w = angleValue(u, v, null)!
      for (const env of envs(toLatex(angle))) {
        expect(close(value(w, env), value(angle, env)), toLatex(angle)).toBe(true)
        expect(close(value(dotValue(u, v, null)!, env), value(dotOf(u, v), env)), toLatex(angle)).toBe(true)
        expect(close(value(lengthValue(u, null)!, env), value(lengthOf(u), env)), toLatex(angle)).toBe(true)
      }
    }
    expect(toLatex(angleValue([x, a, b], [one, num(0), num(0)], null)!)).toBe('\\arccos\\left(\\frac{x}{\\sqrt{x^{2} + a^{2} + b^{2}}}\\right)')
    expect(toLatex(angleValue([x, a], [x, neg(a)], null)!)).toBe('\\arccos\\left(\\frac{x^{2} - a^{2}}{x^{2} + a^{2}}\\right)')
    expect(toLatex(dotValue([x, a], [add(x, b), neg(c)], null)!)).toBe('x(x + b) - ac')
    expect(toLatex(lengthValue([num(1), num(2), num(2)], null)!)).toBe('3')
  })

  it('jeder typische Fehler ergibt einen anderen Wert, keiner doppelt; ohne passende Stelle kein Fehler', () => {
    const differs = (right: Expr, wrong: Expr, seed: string) => envs(seed).some((env) => !close(value(right, env), value(wrong, env)))
    const check = (right: Expr, wrongs: readonly (Expr | null)[], label: string) => {
      const found = wrongs.filter((w): w is Expr => w !== null)
      expect(new Set([right, ...found].map(key)).size, label).toBe(found.length + 1)
      for (const w of found) if (contains(w, 'x')) expect(differs(right, w, label), `${label}: ${toLatex(w)}`).toBe(true)
    }
    for (const body of ABS_BODIES) {
      const t = toolOf(absOf(body)) as AbsTool
      check(absValue(t, null)!, ABS_MISTAKES.map((id) => absValue(t, id)), toLatex(body))
    }
    for (const body of ARG_BODIES) {
      const t = toolOf(argOf(body)) as ArgTool
      check(argValue(t, null)!, ARG_MISTAKES.map((id) => argValue(t, id)), toLatex(body))
    }
    for (const [u, v] of VECTORS) {
      check(angleValue(u, v, null)!, ANGLE_MISTAKES.map((id) => angleValue(u, v, id)), toLatex(angleOf(u, v)))
      check(dotValue(u, v, null)!, DOT_MISTAKES.map((id) => dotValue(u, v, id)), toLatex(dotOf(u, v)))
      check(lengthValue(u, null)!, LENGTH_MISTAKES.map((id) => lengthValue(u, id)), toLatex(lengthOf(u)))
    }
    // ohne Potenz kein „nicht verdoppelt“, ohne Bruch kein „beim Teilen addiert“, ohne Minus kein Vorzeichenfehler,
    // mit einem Vektor der Länge 1 kein „nur durch eine Länge“
    const plain = toolOf(argOf(z(x, a))) as ArgTool
    expect(argValue(plain, 'eq-arg-power')).toBeNull()
    expect(argValue(plain, 'eq-arg-quotient-sign')).toBeNull()
    expect(dotValue([x, a], [b, c], 'eq-vec-dot-sign')).toBeNull()
    expect(angleValue([x, a, b], [one, num(0), num(0)], 'eq-vec-one-length')).toBeNull()
    expect(absValue(toolOf(absOf(pow(z(x, a), num(2)))) as AbsTool, 'eq-abs-root')).toBeNull()
  })

  it('Faktoren des Rumpfs: Bruch, Produkt, Quadrat, Euler-Form', () => {
    expect(complexFactors(div(z(x, a), zbar(x, b)))!.map((f) => f.power)).toEqual([1, -1])
    expect(complexFactors(mul(zbar(one, one), pow(z(x, a), num(2))))!.map((f) => f.power)).toEqual([1, 2])
    const [euler] = complexFactors(sub(mul(b, pow(E, mul(IMAG, x))), a))!
    expect([toLatex(euler.re), toLatex(euler.im)]).toEqual(['b\\cos x - a', 'b\\sin x'])
  })
})

describe('Beispiele aus dem Plan', () => {
  it('Betrag eines Bruchs: eine Wurzel, danach quadrieren', () => {
    const task = { equation: eq(absOf(div(z(x, a), zbar(x, b))), y), target: 'x', conditions: [] }
    const s = solveTask(task)!
    expect(s.steps[0].kind).toBe('abs')
    expect(equationToLatex(s.steps[0].after)).toBe('\\sqrt{\\frac{x^{2} + a^{2}}{x^{2} + b^{2}}} = y')
    expect(toLatex(s.result)).toBe('\\sqrt{\\frac{a^{2} - b^{2}y^{2}}{y^{2} - 1}}')
    const points = samplePoints(task, s.result, createRng('plan'), 12, s.requires)
    expect(points.length).toBe(12)
    for (const p of points) expect(holds(task.equation, p)).toBe(true)
  })

  it('Winkel eines Quadrats: doppelter \\arctan, dann \\tan', () => {
    const task = { equation: eq(argOf(pow(z(x, a), num(2))), y), target: 'x', conditions: [] }
    const s = solveTask(task)!
    expect(equationToLatex(s.steps[0].after)).toBe('2\\arctan\\left(\\frac{a}{x}\\right) = y')
    expect(toLatex(s.result)).toBe('\\frac{a}{\\tan\\left(\\frac{y}{2}\\right)}')
  })

  it('Winkel mit der x-Achse (spitz): 1 - \\cos^2 y = \\sin^2 y und das Ergebnis mit \\tan y', () => {
    const task = { equation: eq(angleOf([x, a, b], [one, num(0), num(0)]), y), target: 'x', conditions: acute }
    const s = solveTask(task)!
    expect(s.steps.map((step) => step.kind)).toEqual(['angle', 'trig', 'multiply', 'square', 'expand', 'collect', 'factor', 'pythagoras', 'divide', 'root', 'finish'])
    expect(stepEquationLatex('pythagoras', s.steps[7].after)).toBe('x^{2}\\sin^{2} y = a^{2}\\cos^{2} y + b^{2}\\cos^{2} y')
    expect(toLatex(s.result)).toBe('\\frac{\\sqrt{a^{2} + b^{2}}}{\\tan y}')
    const points = samplePoints(task, s.result, createRng('achse'), 12, s.requires)
    expect(points.length).toBe(12)
    for (const p of points) expect(holds(task.equation, p)).toBe(true)
  })

  it('Schreibweise: Striche, \\arg mit Klammern, ∢ mit zwei Spalten; im \\ln ohne Klammern um den Betrag', () => {
    expect(toLatex(absOf(z(x, a)))).toBe('\\left\\lvert x + a\\mathrm{i} \\right\\rvert')
    expect(toLatex(argOf(pow(z(x, a), num(2))))).toBe('\\arg\\left((x + a\\mathrm{i})^{2}\\right)')
    expect(toLatex(angleOf([x, a], [one, num(0)]))).toBe('\\sphericalangle\\left(\\begin{pmatrix} x \\\\ a \\end{pmatrix}, \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}\\right)')
    expect(toLatex(dotOf([x, a], [b, c]))).toBe('\\begin{pmatrix} x \\\\ a \\end{pmatrix} \\cdot \\begin{pmatrix} b \\\\ c \\end{pmatrix}')
    expect(toLatex(ln(lengthOf([x, a])))).toBe('\\ln \\left\\lvert \\begin{pmatrix} x \\\\ a \\end{pmatrix} \\right\\rvert')
    // die Buchstaben der Einträge gehören zur Aufgabe, \mathrm{i} nicht
    expect(taskVariables({ equation: eq(absOf(z(x, a)), y), target: 'x', conditions: [] })).toEqual(['a', 'x', 'y'])
    expect(taskVariables({ equation: eq(angleOf([x, a], [b, c]), y), target: 'x', conditions: [] })).toEqual(['a', 'b', 'c', 'x', 'y'])
  })
})

describe('Baukasten (Nummern 1 bis 1000 der Stufe 5)', () => {
  const generated = Array.from({ length: 1000 }, (_, i) => generateRearrangeTask({ level: 5, seed: i + 1 })).filter((g) => g.template.id === 'baukasten-5-betrag-winkel')
  const tools = generated.flatMap((g) => toolsIn(g.task.equation))

  it('genug Aufgaben, komplexe Zahlen und Vektoren, alle fünf Werkzeuge', () => {
    expect(generated.length).toBeGreaterThanOrEqual(60)
    expect(new Set(tools.map((t) => t.tool.kind))).toEqual(new Set(['abs', 'arg', 'length', 'dot', 'angle']))
  })

  it('Gegenprobe an den Prüfstellen; Aufgabe und Ergebnis passen am Handy in eine Zeile, ohne Doppelbruch im Ergebnis', () => {
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

  it('der freie Modus nimmt das Ergebnis der Engine als richtig und fertig an, mit π-Taste, wenn π im Ergebnis steht', () => {
    for (const g of generated) {
      const c = prepareRearrangeCheck(g.task, true)
      expect(checkRearrangeAnswer(c, toLatex(c.solution.result)), taskLatex(g.task)).toEqual({ kind: 'correct' })
      const keyboard = prepareRearrangeFree(g.ref).keyboard
      expect(keyboard.kind === 'rearrange' && keyboard.pi === toLatex(c.solution.result).includes('\\pi'), taskLatex(g.task)).toBe(true)
    }
  })

  it('jeder Faktor mit x hat Real- und Imaginärteil; beim Winkel ist der Realteil positiv; nie zwei Vektoren der Länge 1', () => {
    for (const t of tools) {
      const tool = t.tool
      if (tool.kind === 'abs' || tool.kind === 'arg') {
        for (const f of complexFactors(tool.body)!) {
          if (!contains(f.re, 'x') && !contains(f.im, 'x')) continue
          expect(toLatex(f.re) !== '0' && toLatex(f.im) !== '0', toLatex(t)).toBe(true)
        }
        if (tool.kind === 'arg') expect(argValue(tool, null), toLatex(t)).not.toBeNull()
      }
      if (tool.kind === 'angle') {
        const unit = (v: readonly Expr[]) => toLatex(lengthValue(v, null)!) === '1'
        expect(unit(tool.left) && unit(tool.right), toLatex(t)).toBe(false)
      }
      // zwei Einträge: nie zweimal derselbe (sonst stimmte „über Kreuz“ zufällig)
      if (tool.kind === 'dot' || tool.kind === 'angle') {
        for (const v of [tool.left, tool.right]) if (v.length === 2) expect(key(v[0]) === key(v[1]), toLatex(t)).toBe(false)
      }
    }
  })

  it('in jeder Aufgabe eine Frage zum Werkzeug (mindestens ein typischer Fehler im Schritt), meist mehrere', () => {
    let several = 0
    for (const g of generated) {
      const s = solveTask(g.task)!
      const wrong = rearrangeWrongAnswers(g.task, s).filter((w) => w.stepIndex === 0)
      expect(wrong.length, taskLatex(g.task)).toBeGreaterThan(0)
      if (wrong.length >= 2) several++
    }
    expect(several / generated.length).toBeGreaterThan(0.9)
  })
})
