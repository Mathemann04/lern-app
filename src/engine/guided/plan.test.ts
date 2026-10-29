import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { compareValues, numericDerivative } from '../check/numeric.ts'
import { derive } from '../derive/derive.ts'
import { cardById, cardForRule } from '../explain/cards.ts'
import { FALLBACK_MARKER } from '../explain/texts.ts'
import { parseRichText } from '../explain/richText.ts'
import { isStableAt } from '../expr/arbitraries.ts'
import { evaluate } from '../expr/evaluate.ts'
import { samplePoints } from '../expr/sample.ts'
import { substitute } from '../expr/substitute.ts'
import { type Expr, add, div, exp, fn, ln, mul, neg, num, pow, sin, sqrt, x } from '../expr/types.ts'
import { createRng } from '../random/rng.ts'
import { generateDerivativeTask } from '../tasks/derivativeTerms.ts'
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

  it('nennt zu jedem Schritt die passenden Lernkarten', () => {
    expect(plan.steps.map((s) => s.cards)).toEqual([
      plan.steps[0].choices.map((c) => cardForRule(c.rule!)!.id),
      ['constant-factor', 'power'],
      ['constant-factor', 'rewrite', 'power'],
      ['rewrite', 'power'],
    ])
    expect(plan.cards).toEqual(['sum', 'constant-factor', 'power', 'rewrite'])
  })

  it('erklärt einen vergessenen Faktor konkret', () => {
    const wrong = plan.steps[1].choices.find((c) => c.errorRuleId === 'factor-forgotten')
    expect(wrong?.content).toBe('$3x^{2}$')
    expect(wrong?.whyWrong?.short).toContain('Faktor $4$ vergessen')
  })
})

describe('Beispiel aus dem Plan: x² eˣ (Produktregel)', () => {
  const plan = planForExpression(mul(pow(x, num(2)), exp(x)), { level: 2, seed: 1 })

  it('fragt nach Regel, u\', v\' und dem Einsetzen', () => {
    expect(plan.steps.map((s) => s.title)).toEqual(['Regel wählen', 'Ersten Faktor ableiten', 'Zweiten Faktor ableiten', 'Einsetzen'])
    expect(plan.steps.map((s) => correctChoice(s).content)).toEqual([
      'Produktregel',
      '$2x$',
      '$e^{x}$',
      '$2x \\cdot e^{x} + x^{2} \\cdot e^{x}$',
    ])
    expect(plan.resultLatex).toBe("f'(x) = (x^{2} + 2x)e^{x}")
  })

  it('bietet beim Einsetzen die typischen Fehler der Produktregel an', () => {
    const wrong = plan.steps[3].choices.filter((c) => !c.correct)
    expect(wrong.map((c) => c.content).sort()).toEqual(['$2x \\cdot e^{x} - x^{2} \\cdot e^{x}$', '$2x \\cdot e^{x}$'])
    expect(plan.steps[3].explanation.detailed).toContain('Zusammengefasst')
    expect(plan.steps[3].established).toBe("f'(x) = 2x \\cdot e^{x} + x^{2} \\cdot e^{x}")
  })
})

describe('Kettenregel: sin(3x)', () => {
  const plan = planForExpression(sin(mul(num(3), x)), { level: 2, seed: 1 })

  it('fragt nach äußerer und innerer Ableitung, dann nach dem Zusammensetzen', () => {
    expect(plan.steps.map((s) => s.title)).toEqual(['Regel wählen', 'Äußere Ableitung', 'Innere Ableitung', 'Zusammensetzen'])
    expect(plan.steps.map((s) => correctChoice(s).content)).toEqual(['Kettenregel', '$\\cos u$', '$3$', '$\\cos(3x) \\cdot 3$'])
    expect(plan.steps[1].variable).toBe('u')
  })

  it('zeigt beim Zusammensetzen die Fehler der Kettenregel', () => {
    const ids = plan.steps[3].choices.filter((c) => !c.correct).map((c) => c.errorRuleId!)
    expect(ids).toHaveLength(3)
    for (const id of ids) expect(id).toMatch(/^chain-/)
  })

  it('nimmt einen Faktor davor in die eingesetzte Formel mit', () => {
    const withFactor = planForExpression(mul(num(4), sin(mul(num(3), x))), { level: 2, seed: 1 })
    const last = withFactor.steps.at(-1)!
    expect(last.question).toContain('Der Faktor $4$ davor bleibt stehen.')
    expect(correctChoice(last).content).toBe('$4 \\cdot \\cos(3x) \\cdot 3$')
    const ids = last.choices.filter((c) => !c.correct).map((c) => c.errorRuleId!)
    expect(ids).toHaveLength(3)
    for (const id of ids) expect(id).toMatch(/^(chain-|factor-forgotten)/)
  })
})

describe('Regelwahl: gleichwertige Wege gelten nie als falsch', () => {
  it('bietet beim Bruch die Produktregel nicht als falsch an', () => {
    const plan = planForExpression(div(ln(x), pow(x, num(2))), { level: 3, seed: 1 })
    expect(correctChoice(plan.steps[0]).content).toBe('Quotientenregel')
    expect(plan.steps[0].choices.map((c) => c.content)).not.toContain('Produktregel')
  })

  it('bietet bei sin² x die Produktregel nicht als falsch an', () => {
    const plan = planForExpression(pow(sin(x), num(2)), { level: 3, seed: 1 })
    expect(correctChoice(plan.steps[0]).content).toBe('Kettenregel')
    expect(plan.steps[0].choices.map((c) => c.content)).not.toContain('Produktregel')
  })

  it('zeigt bei −3x² sin x den Faktor in der Regel zum Einsetzen', () => {
    const plan = planForExpression(neg(mul(num(3), pow(x, num(2)), sin(x))), { level: 2, seed: 1 })
    expect(correctChoice(plan.steps[0]).content).toBe('Produktregel')
    expect(plan.steps[0].explanation.detailed).toContain('Der Faktor $-3$ davor bleibt stehen.')
    expect(plan.steps[3].question).toContain("-3 \\cdot (u' \\cdot v + u \\cdot v')")
  })
})

describe('Stufe 4: gröberer Rechenweg', () => {
  it('fragt bei der Kettenregel nur die innere Ableitung einzeln ab', () => {
    const task = fn('tan', add(pow(x, num(2)), num(1)))
    const plan = planForExpression(task, { level: 4, seed: 1 })
    expect(plan.steps.map((s) => s.title)).toEqual(['Regel wählen', 'Innere Ableitung', 'Zusammensetzen'])
    expect(plan.steps[2].question).toContain('Die äußere Funktion ist $\\tan u$')
    // Fehler der äußeren Ableitung erscheinen jetzt beim Zusammensetzen
    const ids = Array.from({ length: 20 }, (_, i) => planForExpression(task, { level: 4, seed: i + 1 }))
      .flatMap((p) => p.steps[2].choices.map((c) => c.errorRuleId))
    expect(ids).toContain('tan-sin-cos-swapped')
  })

  it('bietet die Faktorregel an, wenn sonst keine falsche Regel bleibt', () => {
    const plan = planForExpression(div(exp(pow(x, num(2))), add(x, num(3))), { level: 4, seed: 1 })
    expect(plan.steps[0].choices.map((c) => c.content).sort()).toEqual(['Faktorregel', 'Quotientenregel'])
  })

  it('verwendet in verschachtelten Schritten u nicht doppelt', () => {
    // Beispiel aus dem Plan: u ist der Zähler, also darf u im Nenner-Schritt nicht für etwas anderes stehen
    const f = div(mul(pow(x, num(2)), exp(mul(num(-3), x))), sqrt(add(pow(x, num(2)), num(1))))
    const plan = planForExpression(f, { level: 4, seed: 1 })
    const denominator = plan.steps.find((s) => s.title === 'Nenner ableiten')!
    const formulas = texts(denominator).flatMap((t) => parseRichText(t).flat().flatMap((seg) => (seg.kind === 'math' ? [seg.latex] : [])))
    for (const latex of formulas) expect(latex).not.toMatch(/(?<![a-zA-Z\\])u(?![a-zA-Z])/)
    expect(plan.resultLatex).toBe("f'(x) = \\frac{(-3x^{4} + x^{3} - 3x^{2} + 2x)e^{-3x}}{(x^{2} + 1)^{\\frac{3}{2}}}")
    expect(plan.ruleHint.short).toContain('Ein Bruch')
  })
})

// Ableitung von subject nach variable, an einer Stelle; als x geschrieben für die Prüfhilfen
const asX = (e: Expr, variable: string) => substitute(e, variable, x)

describe.each([1, 2, 3, 4, 5] as const)('alle Aufgaben der Stufe %i', (level) => {
  // implizites Ableiten (Stufe 5) kommt in Schritt 11
  const plans: GuidedTask[] = Array.from({ length: 200 }, (_, i) => ({ level, seed: i + 1 }))
    .filter((ref) => generateDerivativeTask(ref).task.kind === 'function')
    .map((ref) => planGuidedTask(ref))

  it('beginnen (fast immer) mit der Regelwahl', () => {
    const withRule = plans.filter((p) => p.steps[0].title === 'Regel wählen').length
    // Ab Stufe 4 kann sie fehlen, wenn jede Regel irgendwo im Term gebraucht wird
    expect(withRule / plans.length).toBeGreaterThanOrEqual(level < 4 ? 1 : 0.9)
  })

  it('haben in jedem Schritt eine richtige und 1 bis 3 falsche Antworten', () => {
    for (const plan of plans) {
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

  it('richtige Antworten stimmen mit der numerischen Ableitung überein, falsche nicht', () => {
    let checked = 0
    for (const plan of plans) {
      // Ableitungsschritte; das Logarithmieren prüft ein eigener Test
      for (const step of plan.steps.filter((s) => s.subject)) {
        const context = `${level}-${plan.ref.seed} ${step.title}`
        const variable = step.variable ?? 'x'
        const subject = asX(step.subject!, variable)
        const correct = asX(correctChoice(step).expr!, variable)
        const points = samplePoints([subject, correct], createRng(`plan:${plan.ref.seed}`), 30)
        for (const p of points) {
          if (!isStableAt(subject, p.x)) continue
          const approx = numericDerivative(subject, p.x)
          if (approx === null) continue
          checked++
          const exact = evaluate(correct, p)
          expect(Math.abs(exact - approx), context).toBeLessThanOrEqual(1e-5 * Math.max(1, Math.abs(exact)))
        }
        for (const wrong of step.choices.filter((c) => !c.correct)) {
          const { compared, differing } = compareValues(correct, asX(wrong.expr!, variable), points)
          // Konstanten: Ableitung 0 ist überall gleich; dort zählt der Vergleich mit der Zahl selbst
          if (compared === 0) {
            expect(evaluate(wrong.expr!, {}), context).not.toBe(0)
            continue
          }
          expect(differing / compared, `${context} ${wrong.content}`).toBeGreaterThanOrEqual(0.25)
        }
      }
    }
    expect(checked).toBeGreaterThan(plans.length * 20)
  })

  it('haben setzbare Texte und zu jeder falschen Antwort eine eigene Erklärung', () => {
    for (const plan of plans) {
      for (const step of plan.steps) {
        const context = `${level}-${plan.ref.seed} ${step.title}`
        for (const text of texts(step)) expectRenderable(text, context)
        if (step.established) expectRenderable(`$${step.established}$`, context)
        for (const wrong of step.choices.filter((c) => !c.correct)) {
          expect(wrong.whyWrong?.detailed, context).toBeTruthy()
          expect(wrong.whyWrong?.short, context).toBeTruthy()
          expect(wrong.whyWrong?.detailed, `${context} ${wrong.errorRuleId}`).not.toContain(FALLBACK_MARKER)
        }
      }
    }
  })

  it('verraten beim Einsetzen in „Warum ist das falsch?" weder die Lösung noch das Endergebnis', () => {
    for (const plan of plans) {
      const last = plan.steps.at(-1)!
      if (!last.id.startsWith('einsetzen')) continue
      const solution = correctChoice(last).content.slice(1, -1)
      const result = plan.resultLatex.replace("f'(x) = ", '')
      for (const wrong of last.choices.filter((c) => !c.correct)) {
        for (const text of [wrong.whyWrong!.detailed, wrong.whyWrong!.short]) {
          expect(text, `${level}-${plan.ref.seed} ${wrong.errorRuleId}`).not.toContain(solution)
          expect(text, `${level}-${plan.ref.seed} ${wrong.errorRuleId}`).not.toContain(`$${result}$`)
        }
      }
    }
  })

  it('zeigen in jedem Schritt passende Lernkarten, ohne bei der Regelwahl die Antwort zu verraten', () => {
    for (const plan of plans) {
      for (const step of plan.steps) {
        const context = `${level}-${plan.ref.seed} ${step.title}`
        expect(step.cards.length, context).toBeGreaterThan(0)
        for (const id of step.cards) expect(cardById(id), context).toBeDefined()
        if (step.id === 'regel') {
          // jede angebotene Regel hat ihre Karte, nicht nur die richtige
          expect(step.cards, context).toEqual(step.choices.map((c) => cardForRule(c.rule!)!.id))
        } else if (step.subject) {
          const rule = derive(step.subject!, step.variable).rule
          expect(step.cards, context).toContain(cardForRule(rule)!.id)
          // Die Aufgabe kennt alle Karten ihrer Schritte (außer den falschen Regeln der Regelwahl)
          expect(plan.cards, context).toEqual(expect.arrayContaining([...step.cards]))
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

describe('Stufe 5: logarithmisches Ableiten', () => {
  // f(x) = x^{sin x}
  const plan = planForExpression(pow(x, sin(x)), { level: 5, seed: 3 })

  it('fragt nach Regel, Logarithmieren, Ableiten der rechten Seite und Zusammensetzen', () => {
    expect(plan.steps.map((s) => s.title)).toEqual(['Regel wählen', 'Logarithmieren', 'Ableiten', 'Zusammensetzen'])
    expect(correctChoice(plan.steps[1]).content).toBe('$\\sin x \\cdot \\ln x$')
    expect(plan.resultLatex).toBe("f'(x) = x^{\\sin x}\\left(\\cos x \\cdot \\ln x + \\frac{\\sin x}{x}\\right)")
  })

  it('bietet bei der Regelwahl Potenzregel und die Regel für a^x als falsch an, nie die Kettenregel', () => {
    const wrong = plan.steps[0].choices.filter((c) => !c.correct).map((c) => c.rule)
    expect(wrong).toEqual(expect.arrayContaining(['power', 'expBase']))
    expect(wrong).not.toContain('chain')
    expect(correctChoice(plan.steps[0]).rule).toBe('logarithmic')
  })

  it('zeigt beim Zusammensetzen die typischen Fehler des logarithmischen Ableitens', () => {
    expect(plan.steps[3].choices.filter((c) => !c.correct).map((c) => c.errorRuleId).sort()).toEqual([
      'logarithmic-as-exponential',
      'logarithmic-factor-forgotten',
      'logarithmic-power-rule',
    ])
  })

  it('Logarithmieren: richtig ist ln f, die falschen Antworten unterscheiden sich davon', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const ref = { level: 5 as const, seed }
      const { task } = generateDerivativeTask(ref)
      if (task.kind !== 'function' || task.expr.kind !== 'pow') continue
      const step = planGuidedTask(ref).steps.find((s) => s.id === 'logarithmieren')
      if (!step) continue
      const lnF = ln(task.expr)
      const points = samplePoints([task.expr], createRng(`ln:${seed}`), 30)
      const right = compareValues(lnF, correctChoice(step).expr!, points)
      expect(right.compared, `5-${seed}`).toBeGreaterThanOrEqual(8)
      expect(right.differing, `5-${seed}`).toBe(0)
      expect(step.choices.length, `5-${seed}`).toBeGreaterThanOrEqual(3)
      for (const wrong of step.choices.filter((c) => !c.correct)) {
        const { compared, differing } = compareValues(lnF, wrong.expr!, points)
        expect(differing / compared, `5-${seed} ${wrong.content}`).toBeGreaterThanOrEqual(0.25)
      }
    }
  })
})
