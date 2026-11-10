import { describe, expect, it } from 'vitest'
import { key, subterms } from '../../expr/compare.ts'
import { type Env, evaluate } from '../../expr/evaluate.ts'
import { equationToLatex, toLatex } from '../../expr/print.ts'
import { type Equation, type Expr, PI, add, cos, div, eq, mul, num, pow, sin, sub, tan, variable } from '../../expr/types.ts'
import { checkRearrangeAnswer, prepareRearrangeCheck, prepareRearrangeFree } from '../../check/rearrangeAnswer.ts'
import { planRearrange } from '../../guided/rearrangePlan.ts'
import { createRng } from '../../random/rng.ts'
import { latexWidthEm } from '../../tasks/latexWidth.ts'
import { generateRearrangeTask } from '../../tasks/rearrangeTerms.ts'
import { definedSomewhere, dependsOn, holds, samplePoints } from '../check.ts'
import { rearrangeWrongAnswers } from '../errorRules.ts'
import { solveTask, stepEquationLatex } from '../isolate.ts'
import { taskLatex, taskVariables } from '../task.ts'
import { ADDITION_MISTAKES, DOUBLE_MISTAKES, type TheoremTool, theoremParts, theoremValue } from './theorem.ts'
import { theoremOf, toolsIn } from './tool.ts'

// Additionstheoreme und doppelter Winkel (Stufe 5, Teil 8c). Die Gegenprobe in evaluate.ts rechnet die Funktion
// selbst aus (\sin(x + a)); der Rechenweg der Engine (theorem.ts) wird gegen sie geprüft.

const [a, b, x, y] = ['a', 'b', 'x', 'y'].map(variable)
const close = (u: number, v: number) => Math.abs(u - v) <= 1e-9 * Math.max(1, Math.abs(u), Math.abs(v))
const value = (e: Expr, env: Env) => evaluate(e, env)
const twoX = mul(num(2), x)
const acute = [{ lhs: x, rel: '<' as const, rhs: div(PI, num(2)) }]
const toolOf = (e: Expr): TheoremTool => {
  if (e.kind !== 'var' || e.tool?.kind !== 'theorem') throw new Error('kein Additionstheorem')
  return e.tool
}
// Gleichungen, die die Form von \cos(2x) festlegen: sonst \sin x bzw. \cos x
const withSin = (t: Expr): Equation => eq(t, mul(y, sin(x)))
const withCos = (t: Expr): Equation => eq(t, mul(y, cos(x)))

// x und a zwischen 0,1 und 0,7: alle Winkel unter \frac{\pi}{2}, kein Pol beim Tangens
function envs(seed: string, count = 16): Env[] {
  const rng = createRng(seed)
  return Array.from({ length: count }, () => ({ x: 0.1 + 0.6 * rng.next(), a: 0.1 + 0.6 * rng.next(), y: 0.3 + 2 * rng.next() }))
}

const BODIES: readonly Expr[] = [
  sin(add(x, a)),
  sin(sub(x, a)),
  cos(add(x, a)),
  cos(sub(x, a)),
  tan(add(x, a)),
  tan(sub(x, a)),
  sin(twoX),
  cos(twoX),
  tan(twoX),
]

describe('Gegenprobe und Schreibweise', () => {
  it('das Werkzeug zählt wie die Funktion selbst und sieht aus wie sie, auch im Quadrat und mit Faktor', () => {
    for (const body of BODIES) {
      for (const env of envs(toLatex(body))) expect(close(value(theoremOf(body), env), value(body, env)), toLatex(body)).toBe(true)
      expect(toLatex(theoremOf(body))).toBe(toLatex(body))
      expect(toLatex(pow(theoremOf(body), num(2)))).toBe(toLatex(pow(body, num(2))))
      expect(toLatex(mul(b, theoremOf(body)))).toBe(toLatex(mul(b, body)))
    }
    expect(toLatex(pow(theoremOf(sin(add(x, a))), num(2)))).toBe('\\sin^{2}(x + a)')
    expect(taskVariables({ equation: eq(theoremOf(sin(add(x, a))), y), target: 'x', conditions: [] })).toEqual(['a', 'x', 'y'])
  })

  it('Teile: Summe oder Differenz zweier Winkel, doppelter Winkel; sonst kein Additionstheorem', () => {
    expect(theoremParts(sin(add(x, a)))).toMatchObject({ kind: 'addition', name: 'sin', minus: false })
    expect(theoremParts(cos(sub(x, a)))).toMatchObject({ kind: 'addition', name: 'cos', minus: true })
    expect(theoremParts(cos(twoX))).toMatchObject({ kind: 'double', name: 'cos' })
    expect(theoremParts(sin(x))).toBeNull()
    expect(theoremParts(sin(mul(num(3), x)))).toBeNull()
    expect(theoremParts(add(x, a))).toBeNull()
  })
})

describe('Rechenweg', () => {
  it('der Wert stimmt mit der Gegenprobe überein, für jede Funktion, Plus und Minus, doppelten Winkel', () => {
    for (const body of BODIES) {
      const t = toolOf(theoremOf(body))
      for (const e of [withSin(theoremOf(body)), withCos(theoremOf(body))]) {
        const v = theoremValue(t, null, e)!
        for (const env of envs(toLatex(body))) expect(close(value(v, env), value(body, env)), `${toLatex(body)}: ${toLatex(v)}`).toBe(true)
      }
    }
    const latex = (body: Expr, e: Equation = withSin(theoremOf(body))) => toLatex(theoremValue(toolOf(theoremOf(body)), null, e)!)
    expect(latex(sin(add(x, a)))).toBe('\\sin x \\cdot \\cos a + \\cos x \\cdot \\sin a')
    expect(latex(sin(sub(x, a)))).toBe('\\sin x \\cdot \\cos a - \\cos x \\cdot \\sin a')
    expect(latex(cos(add(x, a)))).toBe('\\cos x \\cdot \\cos a - \\sin x \\cdot \\sin a')
    expect(latex(cos(sub(x, a)))).toBe('\\cos x \\cdot \\cos a + \\sin x \\cdot \\sin a')
    expect(latex(tan(add(x, a)))).toBe('\\frac{\\tan x + \\tan a}{1 - \\tan x \\cdot \\tan a}')
    expect(latex(sin(twoX))).toBe('2\\sin x \\cdot \\cos x')
    expect(latex(tan(twoX))).toBe('\\frac{2\\tan x}{1 - \\tan^{2} x}')
  })

  it('\\cos(2x) in der Form, nach der nur noch eine Funktion dasteht; stehen beide oder keine da, kein Wert', () => {
    const t = theoremOf(cos(twoX))
    const form = (e: Equation) => {
      const v = theoremValue(toolOf(t), null, e)
      return v && toLatex(v)
    }
    expect(form(withSin(t))).toBe('1 - 2\\sin^{2} x')
    expect(form(withCos(t))).toBe('2\\cos^{2} x - 1')
    expect(form(eq(add(t, sin(x)), mul(y, cos(x))))).toBeNull()
    expect(form(eq(t, y))).toBeNull()
    // \sin^2 x zählt auch
    expect(form(eq(div(t, pow(sin(x), num(2))), y))).toBe('1 - 2\\sin^{2} x')
  })

  it('jeder typische Fehler ergibt einen anderen Wert, keiner doppelt; ohne passende Stelle kein Fehler', () => {
    for (const body of BODIES) {
      const t = toolOf(theoremOf(body))
      for (const e of [withSin(theoremOf(body)), withCos(theoremOf(body))]) {
        const right = theoremValue(t, null, e)!
        const label = `${toLatex(body)} in ${equationToLatex(e)}`
        const wrong = [...ADDITION_MISTAKES, ...DOUBLE_MISTAKES].map((id) => theoremValue(t, id, e)).filter((w): w is Expr => w !== null)
        expect(wrong.length, label).toBeGreaterThan(0)
        expect(new Set([right, ...wrong].map(key)).size, label).toBe(wrong.length + 1)
        for (const w of wrong) expect(envs(label).some((env) => !close(value(w, env), value(right, env))), `${label}: ${toLatex(w)}`).toBe(true)
      }
    }
    // Fehler der Summe nicht beim doppelten Winkel und umgekehrt; beim Tangens kein falsches Paar, keine vergessene 2
    const sum = toolOf(theoremOf(sin(add(x, a))))
    for (const id of DOUBLE_MISTAKES) expect(theoremValue(sum, id, withSin(theoremOf(sin(add(x, a))))), id).toBeNull()
    const double = toolOf(theoremOf(cos(twoX)))
    for (const id of ADDITION_MISTAKES) expect(theoremValue(double, id, withSin(theoremOf(cos(twoX)))), id).toBeNull()
    expect(theoremValue(toolOf(theoremOf(tan(add(x, a)))), 'eq-add-partner', withSin(theoremOf(tan(add(x, a)))))).toBeNull()
    expect(theoremValue(toolOf(theoremOf(tan(twoX))), 'eq-double-two', withSin(theoremOf(tan(twoX))))).toBeNull()
    // die Formen von \cos(2x) verwechselt: 2\sin^2 x - 1 bzw. 1 - 2\cos^2 x
    expect(toLatex(theoremValue(double, 'eq-double-cos-sign', withSin(theoremOf(cos(twoX))))!)).toBe('2\\sin^{2} x - 1')
    expect(toLatex(theoremValue(double, 'eq-double-cos-sign', withCos(theoremOf(cos(twoX))))!)).toBe('1 - 2\\cos^{2} x')
  })
})

describe('Beispiele aus dem Plan', () => {
  it('b\\sin(x + a) = y\\cos x: Additionstheorem, durch \\cos x teilen, dann \\arctan', () => {
    const task = { equation: eq(mul(b, theoremOf(sin(add(x, a)))), mul(y, cos(x))), target: 'x', conditions: acute }
    const s = solveTask(task)!
    expect(s.steps.map((step) => step.kind)).toEqual(['addition', 'tanQuotient', 'divide', 'add', 'divide', 'combine', 'arc'])
    expect(equationToLatex(s.steps[0].after)).toBe('b(\\sin x \\cdot \\cos a + \\cos x \\cdot \\sin a) = y\\cos x')
    expect(toLatex(s.result)).toBe('\\arctan\\left(\\frac{y - b\\sin a}{b\\cos a}\\right)')
    const points = samplePoints(task, s.result, createRng('plan'), 12, s.requires)
    expect(points.length).toBe(12)
    for (const p of points) expect(holds(task.equation, p)).toBe(true)
    // geführt: die Frage nennt die Funktion, die falschen Antworten sind die drei typischen Fehler
    const step = planRearrange(task, { level: 5, seed: 1 }).steps[0]
    expect(step.title).toBe('Was steht da eigentlich?')
    expect(step.question).toBe('Schreibe $\\sin(x + a)$ mit dem Additionstheorem aus: Was kommt heraus?')
    expect(step.cards).toEqual(['rearrange-addition'])
    expect(step.choices.filter((c) => !c.correct).map((c) => c.errorRuleId).sort()).toEqual(['eq-add-partner', 'eq-add-sign', 'eq-add-termwise'])
  })

  it('\\cos(2x) = y\\sin x: doppelter Winkel mit \\sin^2 x, danach substituieren und pq-Formel', () => {
    const task = { equation: eq(theoremOf(cos(twoX)), mul(y, sin(x))), target: 'x', conditions: acute }
    const s = solveTask(task)!
    expect(s.steps.map((step) => step.kind)).toEqual(['doubleAngle', 'substitute', 'zero', 'normalize', 'pq', 'choose', 'resubstitute', 'combine', 'arc'])
    expect(stepEquationLatex('doubleAngle', s.steps[0].after)).toBe('1 - 2\\sin^{2} x = y\\sin x')
    expect(toLatex(s.result)).toBe('\\arcsin\\left(\\frac{\\sqrt{y^{2} + 8} - y}{4}\\right)')
    const points = samplePoints(task, s.result, createRng('doppelt'), 12, s.requires)
    expect(points.length).toBe(12)
    for (const p of points) expect(holds(task.equation, p)).toBe(true)
    const step = planRearrange(task, { level: 5, seed: 1 }).steps[0]
    // ohne „nur \sin x": das verriete zwei falsche Antworten
    expect(step.question).toBe('Schreibe $\\cos(2x)$ mit dem einfachen Winkel: Was kommt heraus?')
    // drei der vier Fehler zum doppelten Winkel
    const ids = step.choices.filter((c) => !c.correct).map((c) => c.errorRuleId ?? '')
    expect(ids.length).toBe(3)
    for (const id of ids) expect(DOUBLE_MISTAKES as readonly string[]).toContain(id)
  })

  it('Tangens: Frage, Tipp und Erklärung passen zur Funktion (im Baukasten noch nicht, in der Engine schon)', () => {
    const first = (body: Expr) => planRearrange({ equation: eq(theoremOf(body), y), target: 'x', conditions: acute }, { level: 5, seed: 1 }).steps[0]
    const tan2 = first(tan(twoX))
    expect(tan2.question).toBe('Schreibe $\\tan(2x)$ mit dem einfachen Winkel: Was kommt heraus?')
    expect(tan2.hint).toContain('Additionstheorem des Tangens')
    const tanSum = first(tan(add(x, a)))
    expect(tanSum.question).toBe('Schreibe $\\tan(x + a)$ mit dem Additionstheorem aus: Was kommt heraus?')
    expect(tanSum.explanation.detailed).toContain('\\tan(\\alpha + \\beta)')
  })

  it('in keiner falschen Gleichung kürzt sich x als gemeinsamer Faktor weg (2\\cos x = y\\cos x)', () => {
    const task = { equation: eq(theoremOf(cos(twoX)), mul(y, cos(x))), target: 'x', conditions: acute }
    const ids = rearrangeWrongAnswers(task, solveTask(task)!).filter((w) => w.stepIndex === 0).map((w) => w.rule.id)
    expect(ids).toContain('eq-double-cos-sign')
    expect(ids).not.toContain('eq-double-factor')
  })
})

describe('Baukasten (Nummern 1 bis 1000 der Stufe 5)', () => {
  const generated = Array.from({ length: 1000 }, (_, i) => generateRearrangeTask({ level: 5, seed: i + 1 })).filter((g) => g.template.id === 'baukasten-5-additionstheoreme')

  it('genug Aufgaben, Additionstheorem und doppelter Winkel, Sinus und Kosinus, alle Arten', () => {
    expect(generated.length).toBeGreaterThanOrEqual(60)
    const bodies = generated.flatMap((g) => toolsIn(g.task.equation)).map((t) => theoremParts(toolOf(t).body)!)
    expect(new Set(bodies.map((p) => `${p.kind} ${p.name}`))).toEqual(new Set(['addition sin', 'addition cos', 'double cos']))
    expect(new Set(generated.map((g) => g.label)).size).toBeGreaterThanOrEqual(8)
  })

  it('Gegenprobe an den Prüfstellen, immer mit x < \\frac{\\pi}{2}; x steckt nicht nur in einem einzigen Additionstheorem', () => {
    for (const g of generated) {
      const s = solveTask(g.task)!
      const label = taskLatex(g.task)
      expect(g.task.conditions.some((c) => c.rel === '<' && toLatex(c.rhs) === '\\frac{\\pi}{2}'), label).toBe(true)
      const points = samplePoints(g.task, s.result, createRng('gegenprobe'), 8, s.requires)
      expect(points.length, label).toBe(8)
      for (const p of points) expect(holds(g.task.equation, p), label).toBe(true)
      // sonst ginge es gleich mit \arcsin bzw. \arccos (subterms geht nicht in Werkzeuge hinein)
      const outside = [g.task.equation.lhs, g.task.equation.rhs].flatMap((side) => subterms(side)).some((t) => t.kind === 'var' && t.name === 'x' && !t.tool)
      expect(outside || toolsIn(g.task.equation).length >= 2, label).toBe(true)
      // nie \frac{\sin(x + a)}{\cos(x + a)}: das wäre \tan(x + a)
      for (const d of [g.task.equation.lhs, g.task.equation.rhs].flatMap((side) => subterms(side)))
        if (d.kind === 'div' && d.num.kind === 'var' && d.den.kind === 'var' && d.num.tool?.kind === 'theorem' && d.den.tool?.kind === 'theorem')
          expect(key((d.num.tool.body as { arg: Expr }).arg) === key((d.den.tool.body as { arg: Expr }).arg), label).toBe(false)
    }
  })

  it('am Handy in einer Zeile: Aufgabe höchstens 12 em, Ergebnis 16,5 em, jede Gleichung des Rechenwegs und jede falsche Antwort 21 em; nicht nur winzige x', () => {
    for (const g of generated) {
      const s = solveTask(g.task)!
      const label = taskLatex(g.task)
      expect(latexWidthEm(equationToLatex(g.task.equation)), label).toBeLessThanOrEqual(12)
      expect(latexWidthEm(`x = ${toLatex(s.result)}`), label).toBeLessThanOrEqual(16.5)
      for (const step of s.steps) expect(latexWidthEm(stepEquationLatex(step.kind, step.after)), `${label}: ${step.kind}`).toBeLessThanOrEqual(21)
      for (const w of rearrangeWrongAnswers(g.task, s)) expect(latexWidthEm(equationToLatex(w.after)), `${label}: ${w.rule.id}`).toBeLessThanOrEqual(21)
      // kein Minus, das sich herausziehen ließe, direkt unter der Wurzel oder in der Klammer
      expect(toLatex(s.result), label).not.toMatch(/\\sqrt\{-|\\left\(-/)
      const points = samplePoints(g.task, s.result, createRng('brauchbar'), 8, s.requires)
      expect(points.some((p) => p.x > 0.2), label).toBe(true)
    }
  })

  it('der freie Modus nimmt das Ergebnis der Engine als richtig und fertig an, mit Funktionstasten', () => {
    for (const g of generated) {
      const c = prepareRearrangeCheck(g.task, true)
      expect(checkRearrangeAnswer(c, toLatex(c.solution.result)), taskLatex(g.task)).toEqual({ kind: 'correct' })
      const keyboard = prepareRearrangeFree(g.ref).keyboard
      expect(keyboard.kind === 'rearrange' && keyboard.trig, taskLatex(g.task)).toBe(true)
    }
  })

  it('in jeder Aufgabe eine Frage zum Werkzeug, meist mehrere falsche Antworten; keine doppelt, keine ohne Lösung, keine ohne x', () => {
    let several = 0
    const diff = (e: Equation, env: Env) => evaluate(e.lhs, env) - evaluate(e.rhs, env)
    for (const g of generated) {
      const s = solveTask(g.task)!
      const wrong = rearrangeWrongAnswers(g.task, s).filter((w) => w.stepIndex === 0)
      expect(wrong.length, taskLatex(g.task)).toBeGreaterThan(0)
      if (wrong.length >= 2) several++
      const points = samplePoints(g.task, s.result, createRng('doppelt'), 8, s.requires)
      wrong.forEach((w, i) => {
        const label = `${taskLatex(g.task)}: ${equationToLatex(w.after)}`
        // definiert im Bereich der Aufgabe (x < \frac{\pi}{2}), nicht nur irgendwo
        expect(definedSomewhere(w.after, createRng(`irgendwo:${label}`), 400, g.task.conditions), label).toBe(true)
        // keine Seite, die nur noch 0 ist
        for (const side of [w.after.lhs, w.after.rhs]) if (side.kind !== 'num') expect(points.every((p) => Math.abs(evaluate(side, p)) < 1e-9), label).toBe(false)
        // x spielt eine Rolle, im Bereich der Aufgabe (wie in errorRules.ts)
        expect(dependsOn(w.after, 'x', createRng(`abhängig:${label}`), 400, g.task.conditions), label).toBe(true)
        for (const other of wrong.slice(0, i)) expect(points.every((p) => close(diff(w.after, p), diff(other.after, p))), `${label} wie ${equationToLatex(other.after)}`).toBe(false)
      })
    }
    expect(several / generated.length).toBeGreaterThan(0.9)
  })
})
