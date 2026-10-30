import { describe, expect, it } from 'vitest'
import { numericImplicitDerivative } from '../check/curve.ts'
import { numericDerivative } from '../check/numeric.ts'
import { ERROR_RULES } from '../derive/errorRules.ts'
import { allNodes, derive } from '../derive/derive.ts'
import { deriveImplicit, implicitCurvePoints, implicitResult } from '../derive/implicit.ts'
import type { RuleId } from '../derive/rules.ts'
import { CHECK_POINTS, isStableAt } from '../expr/arbitraries.ts'
import { evaluate } from '../expr/evaluate.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { type Equation, type Expr, E, add, cos, div, exp, fn, isEquation, ln, log, mul, neg, num, pow, sin, sqrt, sub, tan, x } from '../expr/types.ts'
import { generateDerivativeTask } from '../tasks/derivativeTerms.ts'
import { FRACTION_ERROR_RULES } from '../fraction/errorRules.ts'
import { fracEquals, toFrac } from '../fraction/frac.ts'
import { solveFraction } from '../fraction/solve.ts'
import { taskExpr as toExprOf, taskLatex } from '../fraction/task.ts'
import { planFractionTask } from '../guided/fractionPlan.ts'
import { CARDS, type CardExample, TOPICS, cardById, cardForRule, cardIdsFor, cardsInTopic, examplesFor, isFractionExample, topicById } from './cards.ts'
import { cardExample, workedExample } from './example.ts'
import { parseRichText } from './richText.ts'

const latexOf = (e: CardExample) => (isFractionExample(e) ? taskLatex(e) : isEquation(e) ? equationToLatex(e) : toLatex(e))

// Karten zum Ableiten (Beispiele sind Funktionen bzw. Gleichungen) und zu Brüchen
const DERIVATIVE_CARDS = cardsInTopic('ableitungen')
const FRACTION_CARDS = cardsInTopic('brueche')
const derivativeExample = (e: CardExample): Expr | Equation => {
  if (isFractionExample(e)) throw new Error('Bruchaufgabe auf einer Karte zum Ableiten')
  return e
}

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind === 'math') expect(latexProblem(segment.latex, { checkUgly: false }), context).toBeNull()
  }
}

// Stimmen zwei Terme an den Prüfstellen überein? Liefert die Zahl der verglichenen Stellen.
function compareAt(a: (at: number) => number | null, b: (at: number) => number | null): number {
  let compared = 0
  for (const at of CHECK_POINTS) {
    const [va, vb] = [a(at), b(at)]
    if (va === null || vb === null || !Number.isFinite(va) || !Number.isFinite(vb)) continue
    expect(Math.abs(va - vb), `x = ${at}: ${va} gegen ${vb}`).toBeLessThanOrEqual(1e-6 * Math.max(1, Math.abs(va)))
    compared++
  }
  return compared
}

const valueOf = (e: Expr) => (at: number) => (isStableAt(e, at) ? evaluate(e, { x: at }) : null)

describe('Lernkarten: Katalog', () => {
  it('hat eindeutige Ids und findet jede Karte wieder', () => {
    const ids = CARDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(cardById(id)?.id).toBe(id)
    expect(cardById('gibt-es-nicht')).toBeUndefined()
  })

  it('legt jede Karte in einen bestehenden Ordner, keine Ordner-Id ist auch eine Karten-Id', () => {
    for (const card of CARDS) expect(topicById(card.topic), card.id).toBeDefined()
    for (const topic of TOPICS) {
      expect(cardsInTopic(topic.id).length, topic.id).toBeGreaterThan(0)
      expect(cardById(topic.id)).toBeUndefined()
    }
    expect(DERIVATIVE_CARDS.length + FRACTION_CARDS.length).toBe(CARDS.length)
  })

  it.each(CARDS.map((c) => [c.id, c] as const))('%s: alle Texte und Formeln lassen sich setzen', (id, card) => {
    for (const text of [card.title, card.memo, card.note ?? '', card.when ?? '']) expectRenderable(text, id)
    for (const formula of card.formulas) expect(latexProblem(formula, { checkUgly: false }), id).toBeNull()
    expect(card.formulas.length).toBeGreaterThan(0)
  })

  it('kennt nur bestehende typische Fehler', () => {
    const known = new Set([...ERROR_RULES, ...FRACTION_ERROR_RULES].map((r) => r.id))
    for (const card of CARDS) for (const id of card.errors) expect(known.has(id), `${card.id}: ${id}`).toBe(true)
  })

  it('zeigt jeden typischen Fehler zu einer Regel mit Karte auf mindestens einer Karte', () => {
    const shown = new Set(CARDS.flatMap((c) => c.errors))
    const missing = ERROR_RULES.filter((r) => cardForRule(r.rule) && !shown.has(r.id)).map((r) => r.id)
    expect(missing).toEqual([])
  })

  it('hat für jede Regel aus den Aufgaben eine Karte, spätestens ab dieser Stufe', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      for (let seed = 1; seed <= 150; seed++) {
        const { task } = generateDerivativeTask({ level, seed })
        const trees = task.kind === 'function' ? [derive(task.expr)] : (({ left, right }) => [left, right])(deriveImplicit(task.equation))
        for (const node of trees.flatMap(allNodes)) {
          const card = cardForRule(node.rule)
          expect(card, `Stufe ${level}, Aufgabe ${seed}: ${node.rule}`).toBeDefined()
          expect(card!.level, `${card!.id} kommt schon in Stufe ${level} vor`).toBeLessThanOrEqual(level)
        }
      }
    }
  })

  it('verrät in einer Aufgabe kein Ergebnis: Beispiele, die Teil der Aufgabe sind, fallen weg', () => {
    const factorCard = cardById('constant-factor')!
    const task = add(mul(num(4), pow(x, num(3))), neg(div(num(2), x)))
    expect(examplesFor(factorCard, task).map(latexOf)).toEqual(['-2x^{5}', '\\frac{x^{4}}{8}'])
    expect(examplesFor(factorCard)).toBe(factorCard.examples)
    // Für jede Karte bleibt mindestens ein Beispiel
    expect(examplesFor(cardById('tan')!, add(mul(num(3), tan(x)), tan(mul(num(2), x)))).length).toBeGreaterThan(0)
  })

  it('ordnet Regeln Karten zu, jede einmal, in der Reihenfolge der Regeln', () => {
    // cot kommt in keiner Aufgabe vor und hat keine Karte
    const rules: RuleId[] = ['product', 'power', 'sin', 'cos', 'power', 'cot', 'constantFactor']
    expect(cardIdsFor(rules)).toEqual(['product', 'power', 'sin-cos', 'constant-factor'])
  })
})

describe('Lernkarten: durchgerechnete Beispiele', () => {
  const examples = DERIVATIVE_CARDS.flatMap((card) => card.examples.map((e) => [card.id, latexOf(e), card, derivativeExample(e)] as const))

  it('hat je Karte mindestens zwei verschiedene Beispiele', () => {
    for (const card of CARDS) {
      expect(card.examples.length, card.id).toBeGreaterThanOrEqual(2)
      expect(new Set(card.examples.map(latexOf)).size, card.id).toBe(card.examples.length)
    }
  })

  it.each(examples)('%s: %s', (_id, _latex, card, f) => {
    const example = workedExample(f)
    if (isEquation(f)) {
      // Implizit: Regel der Karte auf einer der Seiten, Ergebnis gegen die Steigung auf der Kurve
      const d = deriveImplicit(f)
      expect([d.left, d.right].flatMap(allNodes).some((n) => card.rules.includes(n.rule))).toBe(true)
      let compared = 0
      for (const point of implicitCurvePoints(f, 'karte', 20)) {
        const slope = numericImplicitDerivative(f, point.x, point.y)
        if (slope === null) continue
        const exact = evaluate(example.result, point)
        expect(Math.abs(exact - slope)).toBeLessThanOrEqual(1e-5 * Math.max(1, Math.abs(exact)))
        compared++
      }
      expect(compared).toBeGreaterThanOrEqual(5)
      expect(example.lines.at(-1)!.latex).toBe(`y' = ${toLatex(implicitResult(d))}`)
    } else {
      const d = derive(f)
      // Das Beispiel braucht die Regel der Karte
      expect(allNodes(d).some((n) => card.rules.includes(n.rule))).toBe(true)
      // Ergebnis gegen die numerische Ableitung
      const compared = compareAt(valueOf(example.result), (at) => (isStableAt(f, at) ? numericDerivative(f, at) : null))
      expect(compared).toBeGreaterThanOrEqual(3)
      // Die letzte Zeile endet mit dem Ergebnis
      expect(example.lines.at(-1)!.latex.endsWith(` = ${toLatex(d.result)}`)).toBe(true)
    }
    // Alles lässt sich setzen
    expect(latexProblem(example.functionLatex, { checkUgly: false })).toBeNull()
    for (const line of example.lines) {
      expectRenderable(line.label, card.id)
      expect(latexProblem(line.latex, { checkUgly: false }), line.latex).toBeNull()
    }
  })

  it('zeigt Produkt und Kette mit u und v wie in der Formel', () => {
    const product = workedExample(mul(pow(x, num(2)), exp(x)))
    expect(product.lines.map((l) => l.latex)).toEqual([
      'u = x^{2}, \\quad v = e^{x}',
      "u' = 2x, \\quad v' = e^{x}",
      "f'(x) = 2x \\cdot e^{x} + x^{2} \\cdot e^{x}",
      "f'(x) = (x^{2} + 2x)e^{x}",
    ])
    const chain = workedExample(sin(mul(num(3), x)))
    expect(chain.lines.map((l) => l.latex)).toEqual([
      'u = 3x',
      "\\left(\\sin u\\right)' = \\cos u",
      "u' = \\left(3x\\right)' = 3",
      "f'(x) = \\cos(3x) \\cdot 3",
      "f'(x) = 3\\cos(3x)",
    ])
  })

  it('zeigt bei der Potenzregel den eingesetzten Exponenten', () => {
    expect(workedExample(pow(x, num(5))).lines).toEqual([
      { label: 'Exponent $5$ als Faktor nach vorne, dann $1$ abziehen:', latex: "f'(x) = 5 \\cdot x^{5 - 1} = 5x^{4}" },
    ])
  })
})

describe('Lernkarten: Zusätze stimmen', () => {
  const derivativeOf = (f: Expr) => valueOf(derive(f).result)

  it('Tangens: 1/cos² x = 1 + tan² x', () => {
    expect(compareAt(derivativeOf(tan(x)), valueOf(add(num(1), pow(tan(x), num(2)))))).toBeGreaterThanOrEqual(5)
  })

  it('a^x = e^{x ln a} und log_a x = ln x / ln a', () => {
    expect(compareAt(valueOf(pow(num(5), x)), valueOf(pow(E, mul(x, ln(num(5))))))).toBeGreaterThanOrEqual(5)
    expect(compareAt(valueOf(log(num(5), x)), valueOf(div(ln(x), ln(num(5)))))).toBeGreaterThanOrEqual(3)
  })

  it('Sinus und Kosinus: abgeleitet geht es im Kreis', () => {
    const circle = [sin(x), cos(x), neg(sin(x)), neg(cos(x)), sin(x)]
    for (let i = 0; i < 4; i++) expect(compareAt(derivativeOf(circle[i]), valueOf(circle[i + 1]))).toBeGreaterThanOrEqual(5)
  })

  it('Umkehrfunktion: cos(arcsin x) = √(1 − x²)', () => {
    expect(compareAt(valueOf(cos(fn('arcsin', x))), valueOf(sqrt(sub(num(1), pow(x, num(2))))))).toBeGreaterThanOrEqual(3)
  })

  it('Hyperbelfunktionen: Definition über e^x und (tanh x)\' = 1 − tanh² x', () => {
    const half = (e: Expr) => div(e, num(2))
    expect(compareAt(valueOf(fn('sinh', x)), valueOf(half(sub(exp(x), exp(neg(x))))))).toBeGreaterThanOrEqual(5)
    expect(compareAt(valueOf(fn('cosh', x)), valueOf(half(add(exp(x), exp(neg(x))))))).toBeGreaterThanOrEqual(5)
    expect(compareAt(derivativeOf(fn('tanh', x)), valueOf(sub(num(1), pow(fn('tanh', x), num(2)))))).toBeGreaterThanOrEqual(5)
  })

  it('Arkustangens: Die Ableitung enthält keine Winkelfunktion', () => {
    expect(toLatex(derive(fn('arctan', x)).result)).not.toMatch(/\\(sin|cos|tan)/)
  })
})

describe('Lernkarten: Brüche', () => {
  const examples = FRACTION_CARDS.flatMap((card) => card.examples.map((e) => [card.id, latexOf(e), card, e] as const))

  it('nutzt nur Bruchaufgaben als Beispiele', () => {
    for (const card of FRACTION_CARDS) for (const e of card.examples) expect(isFractionExample(e), card.id).toBe(true)
    for (const card of DERIVATIVE_CARDS) for (const e of card.examples) expect(isFractionExample(e), card.id).toBe(false)
  })

  it.each(examples)('%s: %s', (id, _latex, _card, e) => {
    const example = cardExample(e)
    if (!isFractionExample(e)) throw new Error(id)
    const solution = solveFraction(e)
    expect(example.result).toEqual(solution.result)
    expect(example.lines.at(-1)!.latex).toBe(`= ${toLatex(solution.result)}`)
    // jede Zeile hat den Wert der Aufgabe (außer dem Hauptnenner)
    for (const line of example.lines.filter((l) => l.latex.startsWith('= '))) {
      expect(latexProblem(line.latex, { checkUgly: false }), line.latex).toBeNull()
      expectRenderable(line.label, id)
    }
    expect(latexProblem(example.functionLatex, { checkUgly: false })).toBeNull()
    for (const step of solution.steps) if (step.expr) expect(fracEquals(toFrac(step.expr)!, solution.value), id).toBe(true)
  })

  it('zeigt jeden typischen Fehler aus den spielbaren Stufen 1 bis 4 auf einer Karte im Ordner Brüche', () => {
    const shown = new Set(FRACTION_CARDS.flatMap((c) => c.errors))
    const used = new Set<string>()
    for (const level of [1, 2, 3, 4] as const) {
      for (let seed = 1; seed <= 300; seed++) {
        for (const step of planFractionTask({ level, seed }).steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
      }
    }
    expect([...used].filter((id) => !shown.has(id))).toEqual([])
    // und umgekehrt: Jeder Fehler auf einer Karte lässt sich dort gezielt üben
    expect([...shown].filter((id) => !used.has(id))).toEqual([])
  })

  it('verrät in einer Aufgabe kein Ergebnis: dieselbe Aufgabe kommt nicht als Beispiel', () => {
    const card = cardById('fraction-add')!
    const [first] = card.examples
    if (!isFractionExample(first)) throw new Error('kein Bruch')
    expect(examplesFor(card, toExprOf(first)).map(latexOf)).not.toContain(latexOf(first))
  })
})
