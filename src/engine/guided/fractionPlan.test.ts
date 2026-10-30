import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { cardById } from '../explain/cards.ts'
import { FRACTION_ERROR_TEXTS } from '../explain/fractionTexts.ts'
import { parseRichText } from '../explain/richText.ts'
import { type Env, evaluate } from '../expr/evaluate.ts'
import { toLatex } from '../expr/print.ts'
import { samplePoints } from '../expr/sample.ts'
import { type Expr, add, num, sub, x } from '../expr/types.ts'
import { FRACTION_ERROR_RULES } from '../fraction/errorRules.ts'
import { fracEquals, toFrac } from '../fraction/frac.ts'
import { isMultipleOf } from '../fraction/factor.ts'
import { type Poly, polyDivideExact } from '../fraction/poly.ts'
import { solveFraction } from '../fraction/solve.ts'
import { type FractionShape, type FractionTask, type Part, bottomFrac, expanded, innerTask, minus, part, partsOf, plus, shownPoly, signedFrac, taskExpr, taskFrac, topFrac } from '../fraction/task.ts'
import type { Frac } from '../fraction/frac.ts'
import { createRng } from '../random/rng.ts'
import { generateFractionTask } from '../tasks/fractionTerms.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { planFraction, planFractionTask } from './fractionPlan.ts'
import type { GuidedStep, GuidedTask } from './types.ts'

function poly(e: Expr): Poly {
  const f = toFrac(e)!
  return polyDivideExact(f.num, f.den)!
}

const fr = (n: Expr, d: Expr = num(1)): Part => part(expanded(poly(n)), expanded(poly(d)))
const task = (s: FractionShape): FractionTask => ({ ...s, hints: [] }) as FractionTask
const ref = { level: 1, seed: 1 } as const

const correctOf = (step: GuidedStep) => step.choices.find((c) => c.correct)!
const contents = (step: GuidedStep, correct: boolean) => step.choices.filter((c) => c.correct === correct).map((c) => c.content)
const isLcdStep = (step: GuidedStep) => step.id.endsWith('-lcd')

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null/)
  for (const paragraph of parseRichText(text)) {
    for (const segment of paragraph) {
      if (segment.kind !== 'math') continue
      expect(() => katex.renderToString(segment.latex, { throwOnError: true, strict: 'error' }), `${context}: ${segment.latex}`).not.toThrow()
    }
  }
}

describe('Beispiel aus dem Plan: 3/(x − 1) − 2/(x + 1)', () => {
  const plan = planFraction(task({ kind: 'sum', terms: [plus(fr(num(3), sub(x, num(1)))), minus(fr(num(2), add(x, num(1))))] }), ref)

  it('fragt nach Hauptnenner, Erweitern und Zusammenfassen', () => {
    expect(plan.steps.map((s) => s.title)).toEqual(['Hauptnenner', 'Erweitern', 'Zusammenfassen'])
    expect(plan.steps[0].question).toBe('Was ist der Hauptnenner?')
  })

  it('bietet die typischen Fehler als falsche Antworten an', () => {
    const [lcd, expand, combine] = plan.steps
    expect(correctOf(lcd).content).toBe('$(x - 1)(x + 1)$')
    expect(contents(lcd, false)).toContain('$2x$')
    expect(correctOf(expand).content).toBe('$\\frac{3(x + 1)}{(x - 1)(x + 1)} - \\frac{2(x - 1)}{(x - 1)(x + 1)}$')
    expect(contents(expand, false)).toContain('$\\frac{3}{(x - 1)(x + 1)} - \\frac{2}{(x - 1)(x + 1)}$')
    expect(contents(expand, false)).toContain('$\\frac{3(x - 1)}{(x - 1)(x + 1)} - \\frac{2(x + 1)}{(x - 1)(x + 1)}$')
    expect(correctOf(combine).content).toBe('$\\frac{x + 5}{(x - 1)(x + 1)}$')
    expect(combine.choices.find((c) => c.errorRuleId === 'frac-minus-bracket')?.content).toBe('$\\frac{x + 1}{(x - 1)(x + 1)}$')
  })

  it('nennt die verbotenen Zahlen beim Ergebnis', () => {
    expect(plan.resultLatex).toBe('\\frac{3}{x - 1} - \\frac{2}{x + 1} = \\frac{x + 5}{(x - 1)(x + 1)}')
    expect(plan.resultNote).toBe('Gilt für $x \\neq -1$ und $x \\neq 1$.')
  })
})

describe('Zahlenbrüche', () => {
  it('plus: Hauptnenner mit größtem gemeinsamen Teiler und Summe der Nenner als Fehler', () => {
    const plan = planFraction(task({ kind: 'sum', terms: [plus(fr(num(3), num(4))), plus(fr(num(5), num(6)))] }), ref)
    expect(plan.steps.map((s) => s.title)).toEqual(['Hauptnenner', 'Erweitern', 'Zusammenfassen'])
    expect(contents(plan.steps[0], true)).toEqual(['$12$'])
    expect(contents(plan.steps[0], false)).toEqual(expect.arrayContaining(['$2$', '$10$']))
    // Das Produkt der Nenner ist kein Fehler, nur unnötig groß
    expect(contents(plan.steps[0], false)).not.toContain('$24$')
    expect(plan.steps[0].explanation.detailed).toContain('$24$')
    expect(contents(plan.steps[2], false)).toContain('$\\frac{19}{24}$')
    expect(correctOf(plan.steps[2]).content).toBe('$\\frac{19}{12}$')
    expect(plan.resultNote).toBeUndefined()
  })

  it('ganze Zahl minus Bruch: ohne eigene Frage nach dem Hauptnenner', () => {
    const plan = planFraction(task({ kind: 'sum', terms: [plus(fr(num(2))), minus(fr(num(3), num(5)))] }), ref)
    expect(plan.steps.map((s) => s.title)).toEqual(['Erweitern und zusammenfassen'])
    expect(plan.steps[0].question).toBe('Schreibe beide Teile als Brüche mit dem Hauptnenner $5$ und fasse die Zähler zusammen.')
    expect(correctOf(plan.steps[0]).content).toBe('$\\frac{7}{5}$')
    expect(contents(plan.steps[0], false)).toEqual(['$-\\frac{1}{5}$'])
    expect(plan.steps[0].established).toEqual(['= \\frac{10}{5} - \\frac{3}{5}', '= \\frac{7}{5}'])
  })

  it('mal: Malnehmen und Kürzen in einem Schritt', () => {
    const plan = planFraction(task({ kind: 'product', left: fr(num(3), num(10)), right: fr(num(2), num(3)) }), ref)
    expect(plan.steps.map((s) => s.title)).toEqual(['Malnehmen und kürzen'])
    expect(correctOf(plan.steps[0]).content).toBe('$\\frac{1}{5}$')
    expect(plan.steps[0].choices.find((c) => c.errorRuleId === 'frac-multiply-reciprocal')?.content).toBe('$\\frac{9}{20}$')
    expect(plan.steps[0].established).toEqual(['= \\frac{3 \\cdot 2}{10 \\cdot 3}', '= \\frac{1}{5}'])
  })

  it('geteilt ohne Kürzen: Kehrwert und Malnehmen in einem Schritt', () => {
    const plan = planFraction(task({ kind: 'quotient', left: fr(num(3), num(4)), right: fr(num(2), num(5)) }), ref)
    expect(plan.steps.map((s) => s.title)).toEqual(['Kehrwert und malnehmen'])
    expect(correctOf(plan.steps[0]).content).toBe('$\\frac{15}{8}$')
    expect(contents(plan.steps[0], false).sort()).toEqual(['$\\frac{3}{10}$', '$\\frac{8}{15}$'])
  })

  it('geteilt mit Kürzen: erst der Kehrwert, dann Malnehmen und Kürzen', () => {
    const plan = planFraction(task({ kind: 'quotient', left: fr(num(3), num(4)), right: fr(num(1), num(6)) }), ref)
    expect(plan.steps.map((s) => s.title)).toEqual(['Kehrwert', 'Malnehmen und kürzen'])
    expect(correctOf(plan.steps[0]).content).toBe('$\\frac{3}{4} \\cdot 6$')
    expect(correctOf(plan.steps[1]).content).toBe('$\\frac{9}{2}$')
  })
})

// Hauptnenner der Aufgabe: Vielfaches jedes Nenners eines Bruchs?
function isCommonDenominator(t: FractionTask, e: Expr): boolean {
  const p = poly(e)
  return partsOf(t).every((p2) => isMultipleOf(p, shownPoly(p2.den)))
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))

// Wert der Antwort eines Schritts: bei Teilschritten (Zähler des Doppelbruchs als ein Bruch, eine
// Klammer, der innere Doppelbruch) der Wert dieses Teils, sonst der Wert der Aufgabe
function targetOf(t: FractionTask, step: GuidedStep, value: Frac): Frac {
  const ends = (kind: string) => step.id.endsWith(`-${kind}`)
  if (ends('inner-num') || (ends('identity') && t.kind === 'complex')) return topFrac(t)!
  if (ends('inner-den')) return bottomFrac(t)!
  if (t.kind === 'mixed' && ends('left')) return signedFrac(t.left)
  if (t.kind === 'mixed' && ends('right')) return signedFrac(t.right)
  if (t.kind === 'nested' && ends('inner-complex')) return taskFrac(innerTask(t, t.hints))
  return value
}

describe.each([1, 2, 3, 4, 5] as Level[])('Brüche geführt, Stufe %i', (level) => {
  const plans: Array<{ plan: GuidedTask; t: FractionTask }> = Array.from({ length: 300 }, (_, i) => ({
    plan: planFractionTask({ level, seed: i + 1 }),
    t: generateFractionTask({ level, seed: i + 1 }).task,
  }))

  it('haben in jedem Schritt eine richtige und 1 bis 3 falsche Antworten, alle verschieden', () => {
    for (const { plan } of plans) {
      expect(plan.steps.length, `${level}-${plan.ref.seed}`).toBeGreaterThan(0)
      for (const step of plan.steps) {
        const context = `${level}-${plan.ref.seed} ${step.title}`
        expect(step.choices.filter((c) => c.correct), context).toHaveLength(1)
        expect(step.choices.length, context).toBeGreaterThanOrEqual(2)
        expect(step.choices.length, context).toBeLessThanOrEqual(4)
        expect(new Set(step.choices.map((c) => c.id)).size, context).toBe(step.choices.length)
        expect(new Set(step.choices.map((c) => c.content)).size, context).toBe(step.choices.length)
      }
    }
  })

  it('richtige Antworten haben den Wert der Aufgabe, falsche nie', () => {
    for (const { plan, t } of plans) {
      const value = solveFraction(t).value
      for (const step of plan.steps) {
        const context = `${level}-${plan.ref.seed} ${step.title}`
        if (isLcdStep(step)) {
          expect(isCommonDenominator(t, correctOf(step).expr!), context).toBe(true)
          // Ein anderer gemeinsamer Nenner (z. B. das Produkt) wäre nicht falsch, nur unnötig groß
          for (const c of step.choices.filter((c) => !c.correct)) expect(isCommonDenominator(t, c.expr!), `${context} ${c.content}`).toBe(false)
          continue
        }
        // Doppelbruch: gefragt ist erst der Zähler bzw. Nenner als ein Bruch
        const target = targetOf(t, step, value)
        for (const c of step.choices) {
          const f = toFrac(c.expr!)
          expect(f, `${context} ${c.content}`).not.toBeNull()
          expect(fracEquals(f!, target), `${context} ${c.content}`).toBe(c.correct)
        }
      }
    }
  })

  it('enden mit dem fertigen Ergebnis, auch an Zahlenstellen gegengeprüft', () => {
    for (const { plan, t } of plans) {
      const context = `${level}-${plan.ref.seed}`
      const last = correctOf(plan.steps.at(-1)!)
      expect(last.content, context).toBe(`$${toLatex(solveFraction(t).result)}$`)
      expect(plan.resultLatex.endsWith(`= ${toLatex(plan.result)}`), context).toBe(true)
      const letter = ['x', 'a', 'y', 'b'].find((v) => plan.functionLatex.includes(v)) ?? 'x'
      const points: Env[] = samplePoints([taskExpr(t), plan.result], createRng(`geführt:${context}`), 12, letter)
      for (const env of points) {
        // bei zwei Buchstaben den zweiten fest wählen
        const full = { a: 1.7, b: -2.3, x: 1.3, y: 0.6, h: 0.4, ...env }
        expect(close(evaluate(taskExpr(t), full), evaluate(plan.result, full)), `${context} ${JSON.stringify(full)}`).toBe(true)
      }
    }
  })

  it('haben setzbare Texte und zu jeder falschen Antwort eine eigene Erklärung, die das Ergebnis nicht verrät', () => {
    for (const { plan } of plans) {
      expectRenderable(`$${plan.functionLatex}$`, `${level}-${plan.ref.seed}`)
      expectRenderable(`$${plan.resultLatex}$`, `${level}-${plan.ref.seed}`)
      if (plan.resultNote) expectRenderable(plan.resultNote, `${level}-${plan.ref.seed}`)
      for (const step of plan.steps) {
        const context = `${level}-${plan.ref.seed} ${step.title}`
        for (const text of [step.title, step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) {
          expectRenderable(text, context)
        }
        for (const line of [step.established ?? []].flat()) expectRenderable(`$${line}$`, context)
        const answer = correctOf(step).content
        for (const wrong of step.choices.filter((c) => !c.correct)) {
          expect(wrong.errorRuleId, context).toBeTruthy()
          for (const text of [wrong.whyWrong!.detailed, wrong.whyWrong!.short]) {
            expectRenderable(text, `${context} ${wrong.errorRuleId}`)
            if (answer.length > 5) expect(text, `${context} ${wrong.errorRuleId}`).not.toContain(answer)
          }
        }
      }
    }
  })

  it('zeigen in jedem Schritt passende Lernkarten', () => {
    for (const { plan } of plans) {
      for (const step of plan.steps) {
        const context = `${level}-${plan.ref.seed} ${step.title}`
        expect(step.cards.length, context).toBeGreaterThan(0)
        for (const id of step.cards) expect(cardById(id)?.topic, `${context} ${id}`).toBe('brueche')
        expect(plan.cards, context).toEqual(expect.arrayContaining([...step.cards]))
      }
    }
  })

  it('sind bei gleicher Nummer gleich, die richtige Antwort steht nicht immer an derselben Stelle', () => {
    for (const { plan } of plans.slice(0, 30)) {
      expect(planFractionTask(plan.ref)).toEqual(plan)
    }
    const positions = new Set(plans.flatMap(({ plan }) => plan.steps.map((s) => s.choices.findIndex((c) => c.correct))))
    expect(positions.size).toBeGreaterThanOrEqual(3)
  })
})

it('hat zu jedem typischen Fehler beim Bruchrechnen einen eigenen Text', () => {
  expect(FRACTION_ERROR_RULES.map((r) => r.id).filter((id) => !FRACTION_ERROR_TEXTS[id])).toEqual([])
  expect(Object.keys(FRACTION_ERROR_TEXTS).filter((id) => !FRACTION_ERROR_RULES.some((r) => r.id === id))).toEqual([])
})
