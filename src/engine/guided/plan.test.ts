import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { compareValues, numericDerivative } from '../check/numeric.ts'
import { FALLBACK_MARKER } from '../explain/texts.ts'
import { parseRichText } from '../explain/richText.ts'
import { isStableAt } from '../expr/arbitraries.ts'
import { evaluate } from '../expr/evaluate.ts'
import { samplePoints } from '../expr/sample.ts'
import { add, div, mul, neg, num, pow, sqrt, x } from '../expr/types.ts'
import { createRng } from '../random/rng.ts'
import { type GuidedStep, type GuidedTask, planForExpression, planGuidedTask } from './plan.ts'

const correctChoice = (step: GuidedStep) => step.choices.find((c) => c.correct)!

// Alle Texte eines Schritts mit Formeln
function texts(step: GuidedStep): string[] {
  return [
    step.question,
    step.hint,
    step.explanation.detailed,
    step.explanation.short,
    ...step.choices.flatMap((c) => [c.content, c.caption ?? '', c.whyWrong?.detailed ?? '', c.whyWrong?.short ?? '']),
  ].filter((t) => t !== '')
}

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null/)
  for (const paragraph of parseRichText(text)) {
    for (const segment of paragraph) {
      if (segment.kind !== 'math') continue
      expect(
        () => katex.renderToString(segment.latex, { throwOnError: true, strict: 'error' }),
        `${context}: ${segment.latex}`,
      ).not.toThrow()
    }
  }
}

describe('Beispiel aus dem Plan: 4x³ − 2/x + √x', () => {
  const f = add(mul(num(4), pow(x, num(3))), neg(div(num(2), x)), sqrt(x))
  const plan = planForExpression(f, { level: 1, seed: 1 })

  it('fragt erst nach der Regel, dann nach jedem Summanden', () => {
    expect(plan.steps.map((s) => s.title)).toEqual(['Regel wählen', 'Summand 1 von 3', 'Summand 2 von 3', 'Summand 3 von 3'])
    expect(plan.steps[1].question).toBe('Leite den Summanden $4x^{3}$ ab.')
  })

  it('hat die richtigen Antworten', () => {
    expect(plan.steps.map((s) => correctChoice(s).content)).toEqual([
      'Summenregel',
      '$12x^{2}$',
      '$\\frac{2}{x^{2}}$',
      '$\\frac{1}{2\\sqrt{x}}$',
    ])
    expect(plan.resultLatex).toBe("f'(x) = 12x^{2} + \\frac{1}{2\\sqrt{x}} + \\frac{2}{x^{2}}")
  })

  it('bietet bei der Regelwahl Produkt-, Quotienten- und Kettenregel als falsch an', () => {
    expect(plan.steps[0].choices.filter((c) => !c.correct).map((c) => c.content).sort()).toEqual([
      'Kettenregel',
      'Produktregel',
      'Quotientenregel',
    ])
  })

  it('erklärt den Faktor und die Potenzregel', () => {
    expect(plan.steps[1].explanation.short).toContain('4 \\cdot 3x^{2}')
    expect(plan.steps[1].explanation.detailed).toContain('Faktorregel')
    expect(plan.steps[1].explanation.detailed).toContain('3 \\cdot x^{3 - 1}')
    expect(plan.steps[2].explanation.detailed).toContain('2x^{-1}')
  })

  it('erklärt einen vergessenen Faktor konkret', () => {
    const wrong = plan.steps[1].choices.find((c) => c.errorRuleId === 'factor-forgotten')
    expect(wrong?.content).toBe('$3x^{2}$')
    expect(wrong?.whyWrong?.short).toContain('Faktor $4$ vergessen')
  })
})

describe('alle Aufgaben der Stufe 1', () => {
  const plans: GuidedTask[] = Array.from({ length: 300 }, (_, i) => planGuidedTask({ level: 1, seed: i + 1 }))

  it('haben in jedem Schritt genau eine richtige und 1 bis 3 falsche Antworten', () => {
    for (const plan of plans) {
      for (const step of plan.steps) {
        const context = `1-${plan.ref.seed} ${step.title}`
        expect(step.choices.filter((c) => c.correct), context).toHaveLength(1)
        expect(step.choices.length, context).toBeGreaterThanOrEqual(2)
        expect(step.choices.length, context).toBeLessThanOrEqual(4)
        expect(new Set(step.choices.map((c) => c.id)).size, context).toBe(step.choices.length)
        expect(new Set(step.choices.map((c) => c.content)).size, context).toBe(step.choices.length)
      }
    }
  })

  it('richtige Antworten stimmen mit der numerischen Ableitung überein, falsche nicht', () => {
    for (const plan of plans) {
      for (const step of plan.steps.slice(1)) {
        const subject = step.subject!
        const correct = correctChoice(step).expr!
        const points = samplePoints([subject, correct], createRng(`plan:${plan.ref.seed}`), 30)
        for (const p of points) {
          if (!isStableAt(subject, p.x)) continue
          const approx = numericDerivative(subject, p.x)
          if (approx === null) continue
          const exact = evaluate(correct, p)
          expect(Math.abs(exact - approx), `1-${plan.ref.seed} ${step.title}`).toBeLessThanOrEqual(
            1e-5 * Math.max(1, Math.abs(exact)),
          )
        }
        for (const wrong of step.choices.filter((c) => !c.correct)) {
          const { compared, differing } = compareValues(correct, wrong.expr!, points)
          // Konstanten: Ableitung 0 ist überall gleich; dort zählt der Vergleich mit der Zahl selbst
          if (compared === 0) {
            expect(evaluate(wrong.expr!, {}), `1-${plan.ref.seed}`).not.toBe(0)
            continue
          }
          expect(differing / compared, `1-${plan.ref.seed} ${step.title} ${wrong.content}`).toBeGreaterThanOrEqual(0.25)
        }
      }
    }
  })

  it('haben setzbare Texte und zu jeder falschen Antwort eine eigene Erklärung', () => {
    for (const plan of plans) {
      for (const step of plan.steps) {
        for (const text of texts(step)) expectRenderable(text, `1-${plan.ref.seed} ${step.title}`)
        for (const wrong of step.choices.filter((c) => !c.correct)) {
          expect(wrong.whyWrong?.detailed, `1-${plan.ref.seed}`).toBeTruthy()
          expect(wrong.whyWrong?.short, `1-${plan.ref.seed}`).toBeTruthy()
          expect(wrong.whyWrong?.detailed, `1-${plan.ref.seed} ${wrong.errorRuleId}`).not.toContain(FALLBACK_MARKER)
        }
      }
    }
  })

  it('sind bei gleicher Nummer gleich (auch die Reihenfolge der Antworten)', () => {
    for (const plan of plans.slice(0, 30)) {
      const again = planGuidedTask(plan.ref)
      expect(again.steps.map((s) => s.choices.map((c) => c.content))).toEqual(plan.steps.map((s) => s.choices.map((c) => c.content)))
    }
  })

  it('stellen die richtige Antwort nicht immer an dieselbe Stelle', () => {
    const positions = new Set(plans.flatMap((p) => p.steps.map((s) => s.choices.findIndex((c) => c.correct))))
    expect(positions.size).toBeGreaterThanOrEqual(3)
  })
})

describe('Erklärung bei einem vergessenen Teiler', () => {
  it('zeigt die Faktorregel mit Bruch, ohne das Ergebnis zu verraten', () => {
    const plan = planForExpression(add(div(pow(x, num(2)), num(3)), x), { level: 1, seed: 2 })
    const wrong = plan.steps[1].choices.find((c) => c.errorRuleId === 'factor-forgotten')
    expect(wrong?.whyWrong?.short).toBe("Faktor $3$ vergessen: $\\left(\\frac{x^{2}}{3}\\right)' = \\frac{\\left(x^{2}\\right)'}{3}$.")
    expectRenderable(wrong!.whyWrong!.detailed, 'Teiler')
  })
})
