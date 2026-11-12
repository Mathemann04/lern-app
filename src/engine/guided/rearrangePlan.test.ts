import { describe, expect, it } from 'vitest'
import { REARRANGE_ERROR_TEXTS } from '../explain/rearrangeTexts.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById } from '../explain/cards.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { toLatex } from '../expr/print.ts'
import { type Expr, IMAG, PI, add, div, eq, exp, mul, neg, num, pow, sub, variable } from '../expr/types.ts'
import { absOf, angleOf, argOf, derivativeOf, detOf, dotOf, integralOf, limitOf, odeOf, seriesOf, sumOf } from '../rearrange/tools/tool.ts'
import { parseLatex } from '../parse/latex.ts'
import { REARRANGE_ERROR_RULES } from '../rearrange/errorRules.ts'
import { FORMULA_TASKS } from '../tasks/formulas.ts'
import { hasNumberEquations } from '../tasks/numberEquationKinds.ts'
import { hasLogEquations } from '../tasks/logEquationKinds.ts'
import { familyBlocks } from '../tasks/rearrangeFamilies.ts'
import { type Level, blockSeed, formatTaskNumber } from '../tasks/taskNumber.ts'
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
      // dazu je Baustein mit eigenen Aufgaben (M6 Schritt 4) und alle Formeln der Stufe (4b-1) zehn Nummern wie „exp.1-4711"
      const seeds = [...Array.from({ length: 200 }, (_, i) => i + 1), ...familyBlocks(level).flatMap((block) => Array.from({ length: 10 }, (_, i) => blockSeed(block, i + 1))), ...FORMULA_TASKS.flatMap((task, i) => (task.level === level ? [blockSeed('formel', i + 1)] : [])), ...(hasLogEquations(level) ? Array.from({ length: 8 }, (_, i) => blockSeed('logeq', i + 1)) : []), ...(hasNumberEquations(level) ? Array.from({ length: 12 }, (_, i) => blockSeed('zahlen', i + 1)) : [])]
      for (const seed of seeds) {
        const task = planRearrangeTask({ level, seed })
        const label = `${formatTaskNumber({ level, seed })}: ${task.functionLatex}`
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

  it('Differentialgleichung (Teil 7c): Lösung als erster Schritt, Ansatz und Konstanten in der Erklärung, dann pq-Formel', () => {
    const [a, b, f, g, k, x, y] = ['a', 'b', 'f', 'g', 'k', 'x', 'y'].map(variable)
    const plan = planRearrange({ equation: eq(odeOf(mul(pow(k, num(2)), f), 2, [a, num(0)]), y), target: 'x', conditions: [] }, { level: 5, seed: 1 })
    expect(plan.functionLatex).toBe("\\begin{gathered}f'' = k^{2}f \\\\ f(0) = a,\\; f'(0) = 0 \\\\ f(x) = y\\end{gathered}")
    const first = plan.steps[0]
    expect(first.title).toBe('Was steht da eigentlich?')
    expect(first.question).toBe('Löse die Differentialgleichung für $f$ mit den Anfangswerten: Was kommt heraus?')
    expect(first.choices.find((c) => c.correct)?.content).toBe('$\\frac{a}{2}e^{kx} + \\frac{a}{2}e^{-kx} = y$')
    // drei der vier typischen Fehler: nur e^{kx}, nicht halbiert, Schwingung, Wurzel nicht gezogen
    const ids = first.choices.map((c) => c.errorRuleId).filter(Boolean)
    expect(ids).toHaveLength(3)
    for (const id of ids) expect(['eq-ode-initial-unused', 'eq-ode-not-halved', 'eq-ode-oscillation', 'eq-ode-root']).toContain(id)
    expect(first.explanation.detailed).toContain('C_1 + C_2 = a')
    expect(first.explanation.detailed).toContain('\\lambda^2 = k^{2} \\Rightarrow \\lambda = \\pm k')
    expect(first.cards).toEqual(['rearrange-ode'])
    expect(plan.ruleHint.detailed).toContain('Differentialgleichung')
    expect(plan.steps.map((s) => s.id.replace(/^\d+-/, ''))).toContain('pq')
    expectRenderable(first.explanation.detailed, 'Erklärung')

    // zwei Funktionen: die zweite ohne „Was steht da eigentlich?"
    const two = planRearrange(
      { equation: eq(sub(odeOf(mul(k, f), 1, [a]), odeOf(mul(num(-1), mul(k, g)), 1, [b], 'g')), y), target: 'x', conditions: [] },
      { level: 5, seed: 1 },
    )
    expect(two.functionLatex).toContain("g' = ")
    expect(two.steps[0].title).toBe('Was steht da eigentlich?')
    expect(two.steps[1].title).toBe('Differentialgleichung lösen')
    expect(two.steps[1].question).toContain('für $g$')
    expect(x.name).toBe('x')
  })

  it('Determinante (Teil 8a): erst ausrechnen, bei 3 × 3 vorher entwickeln; Produkte und Schachbrett in der Erklärung', () => {
    const [a, b, x, y] = ['a', 'b', 'x', 'y'].map(variable)
    const plan = planRearrange({ equation: eq(detOf([[exp(x), exp(neg(x))], [a, b]]), y), target: 'x', conditions: [] }, { level: 5, seed: 1 })
    const first = plan.steps[0]
    expect(first.title).toBe('Was steht da eigentlich?')
    expect(first.question).toBe('Rechne die Determinante aus: Was kommt heraus?')
    expect(first.choices.find((c) => c.correct)?.content).toBe('$be^{x} - ae^{-x} = y$')
    // drei der vier typischen Fehler: Plus statt Minus, vertauscht, in Zeilen oder Spalten, nur die Hauptdiagonale
    const ids = first.choices.map((c) => c.errorRuleId).filter(Boolean)
    expect(ids).toHaveLength(3)
    for (const id of ids) expect(['eq-det-plus', 'eq-det-swapped', 'eq-det-rows', 'eq-det-main']).toContain(id)
    expect(first.explanation.detailed).toContain('e^{x} \\cdot b - e^{-x} \\cdot a')
    expect(first.cards).toEqual(['rearrange-det'])
    expect(plan.ruleHint.detailed).toContain('Determinante')
    expectRenderable(first.explanation.detailed, 'Erklärung')

    const three = planRearrange(
      {
        equation: eq(
          detOf([
            [num(0), a, x],
            [b, num(1), num(2)],
            [num(0), x, a],
          ]),
          y,
        ),
        target: 'x',
        conditions: [],
      },
      { level: 5, seed: 1 },
    )
    expect(three.steps[0].question).toBe('Entwickle nach der Zeile oder Spalte mit zwei Nullen: Was kommt heraus?')
    expect(three.steps[0].choices.find((c) => c.correct)?.content).toBe('$-b\\det\\begin{pmatrix} a & x \\\\ x & a \\end{pmatrix} = y$')
    expect(three.steps[0].choices.map((c) => c.errorRuleId).filter(Boolean).sort()).toEqual(['eq-det-checkerboard', 'eq-det-entry'])
    expect(three.steps[0].explanation.detailed).toContain('In der 1. Spalte steht nur $b$')
    expect(three.steps[0].explanation.detailed).toContain('($-$)')
    // die Unterdeterminante danach ohne „Was steht da eigentlich?"
    expect(three.steps[1].title).toBe('Determinante ausrechnen')
    expectRenderable(three.steps[0].explanation.detailed, 'Erklärung')
  })

  it('Betrag und Winkel (Teil 8b): Real- und Imaginärteil in der Erklärung, Fehler aus den Regeln für Betrag und Winkel', () => {
    const [a, b, x, y] = ['a', 'b', 'x', 'y'].map(variable)
    const task = (lhs: Expr, conditions: { lhs: Expr; rel: '<' | '>'; rhs: Expr }[] = []) => planRearrange({ equation: eq(lhs, y), target: 'x', conditions }, { level: 5, seed: 1 })
    const abs = task(absOf(div(add(x, mul(a, IMAG)), sub(x, mul(b, IMAG)))))
    const first = abs.steps[0]
    expect(first.title).toBe('Was steht da eigentlich?')
    expect(first.question).toBe('Rechne den Betrag aus: Was kommt heraus?')
    expect(first.choices.find((c) => c.correct)?.content).toBe('$\\sqrt{\\frac{x^{2} + a^{2}}{x^{2} + b^{2}}} = y$')
    expect(first.choices.map((c) => c.errorRuleId).filter(Boolean).sort()).toEqual(['eq-abs-imag-squared', 'eq-abs-root', 'eq-abs-termwise'])
    expect(first.explanation.detailed).toContain('Realteil $x$, Imaginärteil $a$')
    expect(first.explanation.detailed).toContain('Betrag oben durch Betrag unten')
    expect(first.cards).toEqual(['rearrange-complex'])
    expect(abs.ruleHint.detailed).toContain('komplexen Zahl')
    expectRenderable(first.explanation.detailed, 'Erklärung')

    const arg = task(argOf(pow(add(x, mul(a, IMAG)), num(2)))).steps[0]
    expect(arg.question).toBe('Rechne den Winkel aus: Was kommt heraus?')
    expect(arg.choices.find((c) => c.correct)?.content).toBe('$2\\arctan\\left(\\frac{a}{x}\\right) = y$')
    expect(arg.choices.map((c) => c.errorRuleId).filter(Boolean).sort()).toEqual(['eq-arg-arctan-forgotten', 'eq-arg-power', 'eq-arg-swapped'])
    expect(arg.explanation.detailed).toContain('verdoppelt sich der Winkel')

    const angle = task(angleOf([x, a, b], [num(1), num(0), num(0)]), [{ lhs: y, rel: '<', rhs: div(PI, num(2)) }])
    expect(angle.steps[0].question).toBe('Rechne den Winkel zwischen den Vektoren aus: Was kommt heraus?')
    expect(angle.steps[0].choices.find((c) => c.correct)?.content).toBe('$\\arccos\\left(\\frac{x}{\\sqrt{x^{2} + a^{2} + b^{2}}}\\right) = y$')
    // mit einem Vektor der Länge 1 kein „nur durch eine Länge geteilt“ (es stimmte zufällig)
    expect(angle.steps[0].choices.map((c) => c.errorRuleId)).not.toContain('eq-vec-one-length')
    expect(angle.steps[0].explanation.detailed).toContain('Skalarprodukt')
    expect(angle.steps[0].cards).toEqual(['rearrange-vector'])
    expect(angle.ruleHint.detailed).toContain('Vektoren')
    expectRenderable(angle.steps[0].explanation.detailed, 'Erklärung')

    const dot = task(dotOf([x, a], [add(x, b), neg(variable('c'))])).steps[0]
    expect(dot.choices.map((c) => c.errorRuleId).filter(Boolean).sort()).toEqual(['eq-vec-dot-cross', 'eq-vec-dot-sign'])
    expect(dot.explanation.detailed).toContain('x \\cdot (x + b) + a \\cdot (-c)')

    // Euler-Form: Tipp und Erklärung nennen e^{\mathrm{i}x} = \cos x + \mathrm{i}\sin x
    const [k, m] = ['k', 'm'].map(variable)
    const euler = task(absOf(add(k, mul(m, exp(mul(IMAG, x))))), [{ lhs: x, rel: '<', rhs: PI }]).steps[0]
    expect(euler.hint).toContain('e^{\\mathrm{i}x} = \\cos x + \\mathrm{i}\\sin x')
    expect(euler.explanation.detailed.startsWith('Mit $e^{\\mathrm{i}x} = \\cos x + \\mathrm{i}\\sin x$: Realteil $k + m\\cos x$')).toBe(true)
    expectRenderable(euler.explanation.detailed, 'Erklärung')
    // zwei Faktoren mit x: erst ausmultiplizieren (Tipp und Erklärung)
    const product = task(argOf(mul(add(x, mul(a, IMAG)), sub(a, mul(x, IMAG))))).steps[0]
    expect(product.hint).toContain('multipliziere erst aus')
    expect(product.explanation.detailed).toContain('Erst ausmultiplizieren')
    // fester Faktor mit \lvert 1 + 2\mathrm{i}\rvert = \sqrt{5}: die Wurzeln kommen unter eine
    const merged = task(absOf(mul(add(num(1), mul(num(2), IMAG)), add(x, mul(a, IMAG))))).steps[0]
    expect(merged.choices.find((c) => c.correct)?.content).toBe('$\\sqrt{5(x^{2} + a^{2})} = y$')
    expect(merged.explanation.detailed).toContain('Die Wurzeln kommen unter eine')

    // Betrag eines Bruchs aus Quadraten: ohne Wurzel, also nicht „zusammen unter eine Wurzel“
    const squares = task(absOf(div(pow(add(x, mul(a, IMAG)), num(2)), pow(sub(x, mul(b, IMAG)), num(2))))).steps[0]
    expect(squares.choices.find((c) => c.correct)?.content).toBe('$\\frac{x^{2} + a^{2}}{x^{2} + b^{2}} = y$')
    expect(squares.explanation.detailed).toContain('Betrag oben durch Betrag unten.')
    expect(squares.explanation.detailed).not.toContain('unter eine Wurzel')
    expect(first.explanation.detailed).toContain('zusammen unter eine Wurzel')
  })

  it('spitzer Winkel (Teil 8b): 1 - cos²y = sin²y als Frage mit Irrwegen und typischem Fehler, das Ergebnis mit tan y', () => {
    const [a, b, x, y] = ['a', 'b', 'x', 'y'].map(variable)
    const angle = planRearrange(
      { equation: eq(angleOf([x, a, b], [num(1), num(0), num(0)]), y), target: 'x', conditions: [{ lhs: y, rel: '<', rhs: div(PI, num(2)) }] },
      { level: 5, seed: 1 },
    )
    const move = angle.steps.find((s) => s.id.endsWith('-pythagoras-plan'))
    expect(move?.question).toBe('In der Klammer steht $1 - \\cos^{2} y$. Wie schreibst du das einfacher?')
    expect(move?.choices.find((c) => c.correct)?.content).toBe('$1 - \\cos^{2} y = \\sin^{2} y$ einsetzen')
    expect(move?.choices.find((c) => c.content === '$1 - \\cos^{2} y$ durch $\\sin y$ ersetzen')?.whyWrong).toEqual(REARRANGE_ERROR_TEXTS['eq-pythagoras-square'])
    expect(move?.choices.map((c) => c.content)).toContain('$1 - \\cos^{2} y$ als $(1 - \\cos y)^{2}$ schreiben')
    expect(move?.cards).toEqual(['rearrange-trig'])
    const square = angle.steps.find((s) => s.id.endsWith('-pythagoras'))
    expect(square?.choices.find((c) => c.errorRuleId === 'eq-pythagoras-square')?.content).toBe('$x^{2}\\sin y = a^{2}\\cos^{2} y + b^{2}\\cos^{2} y$')
    const finish = angle.steps.at(-1)
    expect(finish?.question).toBe('Schreibe mit $\\tan y$: Was ist $x$?')
    expect(finish?.choices.find((c) => c.correct)?.content).toBe('$x = \\frac{\\sqrt{a^{2} + b^{2}}}{\\tan y}$')
    expect(finish?.choices.find((c) => c.errorRuleId === 'eq-tan-flipped')?.content).toBe('$x = \\sqrt{a^{2} + b^{2}}\\tan y$')
    expect(finish?.cards).toEqual(['rearrange-trig'])
    for (const step of [move, square, finish]) {
      expect(step).toBeDefined()
      if (!step) continue
      expectRenderable(step.explanation.detailed, 'Erklärung')
      expectRenderable(step.hint, 'Tipp')
      expect(step.hint).not.toContain('\\tan y}')
      for (const choice of step.choices) if (choice.whyWrong) expectRenderable(choice.whyWrong.detailed, 'Warum falsch')
    }
    // die Lernkarte „Winkel- und Hyperbelfunktionen“ gehört jetzt zur Aufgabe
    expect(angle.steps.flatMap((s) => s.cards)).toContain('rearrange-trig')
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
