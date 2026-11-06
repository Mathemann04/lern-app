import { describe, expect, it } from 'vitest'
import { REARRANGE_ERROR_TEXTS } from '../explain/rearrangeTexts.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById } from '../explain/cards.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { toLatex } from '../expr/print.ts'
import { type Expr, add, div, eq, mul, num, pow, sub, variable } from '../expr/types.ts'
import { derivativeOf, integralOf, limitOf, seriesOf, sumOf } from '../rearrange/tools/tool.ts'
import { parseLatex } from '../parse/latex.ts'
import { REARRANGE_ERROR_RULES } from '../rearrange/errorRules.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { planRearrange, planRearrangeTask } from './rearrangePlan.ts'
import type { GuidedTask } from './types.ts'

const p = (latex: string): Expr => {
  const r = parseLatex(latex)
  if (!r.ok) throw new Error(r.message)
  return r.expr
}

const plan = (lhs: string, rhs: string, level: Level = 1, target = 'x') =>
  planRearrange({ equation: eq(p(lhs), p(rhs)), target, conditions: [] }, { level, seed: 1 })

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind === 'math') expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
  }
}

// Fragen und richtige Antworten der Reihe nach
const walk = (task: GuidedTask) => task.steps.map((s) => `${s.question} → ${s.choices.find((c) => c.correct)!.content}`)

describe('Geführt umstellen: Ablauf', () => {
  it('Stufe 1: je Umformung erst die Umformung wählen, dann das Ergebnis', () => {
    expect(walk(plan('y', '\\frac{3(x-a)}{b}+c'))).toEqual([
      'Wie wirst du $+c$ auf der rechten Seite los? → Auf beiden Seiten $-c$',
      'Was kommt heraus? → $y - c = \\frac{3(x - a)}{b}$',
      'Wie wirst du den Nenner $b$ los? → Beide Seiten mal $b$',
      'Was kommt heraus? → $b(y - c) = 3(x - a)$',
      'Wie wirst du den Faktor $3$ los? → Beide Seiten durch $3$',
      'Was kommt heraus? → $\\frac{b(y - c)}{3} = x - a$',
      'Wie wirst du $-a$ auf der rechten Seite los? → Auf beiden Seiten $+a$',
      'Was kommt heraus? → $\\frac{b(y - c)}{3} + a = x$',
      'Fasse zu einem Bruch zusammen: Was ist $x$? → $x = \\frac{by - bc + 3a}{3}$',
    ])
  })

  it('Stufe 2: x auf beiden Seiten', () => {
    expect(walk(plan('a(x+b)', 'c(x-d)', 2))).toEqual([
      'Was machst du mit den Klammern? → Die Klammern ausmultiplizieren',
      'Was kommt heraus? → $ax + ab = cx - cd$',
      '$x$ steht in mehreren Summanden. Was machst du zuerst? → Alles mit $x$ nach links, den Rest nach rechts',
      'Was kommt heraus? → $cx - ax = ab + cd$',
      'Wie machst du aus den Summanden mit $x$ einen einzigen Faktor $x$? → $x$ ausklammern',
      'Was kommt heraus? → $x(c - a) = ab + cd$',
      'Wie bekommst du $x$ allein? → Beide Seiten durch $(c - a)$',
      'Was kommt heraus? → $x = \\frac{ab + cd}{c - a}$',
    ])
  })

  it('ohne typischen Fehler steht die Gleichung gleich unter „Bisher"', () => {
    // x(a + b): kein Minus, das beim Ausklammern verloren gehen kann, keine 1
    const task = plan('ax+bx', 'c', 2)
    const factor = task.steps.find((s) => s.question.startsWith('Wie machst du aus den Summanden'))!
    expect(factor.established).toEqual(['x(a + b) = c'])
  })

  it('Ergebnis mit Bedingung für den Nenner', () => {
    const task = plan('a(x+b)', 'c(x-d)', 2)
    expect(task.resultLatex).toBe('x = \\frac{ab + cd}{c - a}')
    expect(task.resultNote).toBe('Gilt für $a \\neq c$.')
    expect(plan('y', '\\frac{2x+1}{x-3}', 2).resultNote).toBe('Gilt für $y \\neq 2$.')
    expect(plan('y', 'x+b').resultNote).toBeUndefined()
  })

  it('Arbeitsauftrag und Bedingungen als Text mit Formeln', () => {
    const task = plan('y', 'm(x-a)+b', 1, 'm')
    expect(task.instruction).toBe('Löse nach $m$ auf')
    expect(task.note).toBe('Alle Buchstaben stehen für positive Zahlen.')
    expect(task.answerLabel).toBe('m')
  })

  it('gezieltes Üben: der gesuchte Fehler kommt unter den Antworten vor', () => {
    const task = planRearrange({ equation: eq(p('y'), p('\\frac{3(x-a)}{b}+c')), target: 'x', conditions: [] }, { level: 1, seed: 1 }, 'frac-whole-not-expanded')
    expect(task.steps.at(-1)!.choices.some((c) => c.errorRuleId === 'frac-whole-not-expanded')).toBe(true)
  })
})

describe('Geführt umstellen: Zufallsaufgaben der Stufen 1 bis 5', () => {
  for (const level of [1, 2, 3, 4, 5] as const) {
    it(`Stufe ${level}: jede Aufgabe lässt sich sauber durchspielen`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const task = planRearrangeTask({ level, seed })
        const label = `${level}-${seed}: ${task.functionLatex}`
        expect(task.steps.length, label).toBeGreaterThan(0)
        for (const step of task.steps) {
          const context = `${label}, ${step.question}`
          expect(step.choices.filter((c) => c.correct), context).toHaveLength(1)
          expect(step.choices.length, context).toBeGreaterThanOrEqual(2)
          expect(step.choices.length, context).toBeLessThanOrEqual(4)
          expect(new Set(step.choices.map((c) => c.content)).size, context).toBe(step.choices.length)
          for (const text of [step.title, step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) {
            expectRenderable(text, context)
          }
          for (const line of step.established ?? []) expect(latexProblem(line), context).toBeNull()
          for (const id of step.cards) expect(cardById(id), context).toBeDefined()
          const correct = step.choices.find((c) => c.correct)!.content
          for (const wrong of step.choices.filter((c) => !c.correct)) {
            expect(wrong.whyWrong, context).toBeDefined()
            expectRenderable(wrong.whyWrong!.detailed, context)
            // „Warum ist das falsch?" verrät nicht die richtige Antwort
            if (correct.startsWith('$')) expect(wrong.whyWrong!.detailed, context).not.toContain(correct.slice(1, -1))
          }
        }
        // Am Ende steht das Ergebnis unter „Bisher"
        const lines = task.steps.flatMap((s) => s.established ?? [])
        expect(lines.at(-1), label).toBe(task.resultLatex)
      }
    }, 60_000)
  }
})

describe('Geführt umstellen: Stufe 5 (Werkzeuge)', () => {
  it('das Werkzeug zuerst: „Was steht da eigentlich?", mit den typischen Fehlern des Gebiets', () => {
    const integral = planRearrange(
      { equation: eq(integralOf(div(num(1), mul(variable('t'), add(variable('t'), variable('b')))), variable('a'), variable('x')), variable('y')), target: 'x', conditions: [{ lhs: variable('x'), rel: '>', rhs: variable('a') }] },
      { level: 5, seed: 1 },
    )
    expect(integral.steps[0].title).toBe('Was steht da eigentlich?')
    expect(integral.steps.slice(0, 3).map((s) => s.id.replace(/^\d+-/, ''))).toEqual(['partial', 'antiderivative', 'bounds'])
    const ids = integral.steps.slice(0, 3).flatMap((s) => s.choices.map((c) => c.errorRuleId))
    for (const id of ['eq-partial-factor', 'eq-int-sign', 'eq-int-bounds-swapped']) expect(ids).toContain(id)
    expect(integral.steps[0].cards).toContain('rearrange-integral')
    expect(integral.ruleHint.detailed).toContain('Integral')

    const derivative = planRearrange({ equation: eq(derivativeOf(div(pow(variable('x'), num(2)), add(variable('x'), variable('a')))), variable('y')), target: 'x', conditions: [] }, { level: 5, seed: 1 })
    const first = derivative.steps[0]
    expect(first.title).toBe('Was steht da eigentlich?')
    // die Fehler aus „Ableiten" mit ihrem Text, die Karte zur Quotientenregel
    const wrong = first.choices.filter((c) => !c.correct)
    expect(wrong.length).toBeGreaterThan(0)
    for (const c of wrong) expect(c.whyWrong?.detailed.length).toBeGreaterThan(0)
    expect(first.cards).toContain('quotient')
  })

  it('Summe, Reihe, Grenzwert (Teil 7b): Formel als erster Schritt, mit den typischen Fehlern und der Lernkarte', () => {
    const [k, n, q, x, y] = ['k', 'n', 'q', 'x', 'y'].map(variable)
    const sum = planRearrange({ equation: eq(sumOf(pow(q, k), num(0), sub(n, num(1))), y), target: 'n', conditions: [{ lhs: q, rel: '>', rhs: num(1) }] }, { level: 5, seed: 1 })
    expect(sum.steps[0].title).toBe('Was steht da eigentlich?')
    expect(sum.steps[0].question).toContain('geometrischen Summe')
    expect(sum.steps[0].choices.map((c) => c.errorRuleId)).toContain('eq-sum-count')
    expect(sum.steps[0].cards).toEqual(['rearrange-series'])
    expect(sum.instruction).toBe('Löse nach $n$ auf')

    const series = planRearrange({ equation: eq(seriesOf(mul(k, pow(x, k)), num(1)), y), target: 'x', conditions: [{ lhs: x, rel: '<', rhs: num(1) }] }, { level: 5, seed: 1 })
    const ids = series.steps[0].choices.map((c) => c.errorRuleId)
    expect(ids).toContain('eq-series-start')
    expect(ids).toContain('eq-series-not-geometric')
    expect(series.ruleHint.detailed).toContain('geometrischen')

    // „1 hoch unendlich": die falsche Gleichung ohne x ist hier gerade der typische Fehler
    const limit = planRearrange({ equation: eq(limitOf(pow(add(num(1), div(x, n)), mul(num(2), n))), y), target: 'x', conditions: [] }, { level: 5, seed: 1 })
    const choices = limit.steps[0].choices
    expect(choices.find((c) => c.correct)?.content).toBe('$e^{2x} = y$')
    expect(choices.map((c) => c.errorRuleId).sort()).toEqual([undefined, 'eq-lim-exponent', 'eq-lim-one'].sort())
    expect(limit.steps[0].cards).toEqual(['rearrange-limit'])

    // Reihe in einer Ableitung: erst die Reihe, dann ableiten
    const nested = planRearrange({ equation: eq(derivativeOf(seriesOf(div(pow(x, k), k), num(1))), y), target: 'x', conditions: [{ lhs: x, rel: '<', rhs: num(1) }] }, { level: 5, seed: 1 })
    expect(nested.steps.slice(0, 2).map((s) => s.id.replace(/^\d+-/, ''))).toEqual(['series', 'derive'])
    expect(nested.steps[1].title).toBe('Ableiten')
  })
})

describe('Geführt umstellen: Texte', () => {
  it('jede Fehlerregel hat einen eigenen Text für „Warum ist das falsch?"', () => {
    for (const rule of REARRANGE_ERROR_RULES) {
      expect(REARRANGE_ERROR_TEXTS[rule.id], rule.id).toBeDefined()
      expectRenderable(REARRANGE_ERROR_TEXTS[rule.id].detailed, rule.id)
      expectRenderable(REARRANGE_ERROR_TEXTS[rule.id].short, rule.id)
    }
    expect(Object.keys(REARRANGE_ERROR_TEXTS).sort()).toEqual(REARRANGE_ERROR_RULES.map((r) => r.id).sort())
  })

  it('das Ergebnis der Aufgabe steht in keinem Tipp', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const task = planRearrangeTask({ level: 2, seed })
      for (const step of task.steps) expect(step.hint, task.functionLatex).not.toContain(toLatex(task.result))
    }
  })
})
