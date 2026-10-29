import { clearlyDifferent } from '../check/numeric.ts'
import { key } from '../expr/compare.ts'
import { evaluate } from '../expr/evaluate.ts'
import { samplePoints } from '../expr/sample.ts'
import { substitute } from '../expr/substitute.ts'
import {
  type Expr,
  add,
  asRational,
  cos,
  div,
  exp,
  fn,
  ln,
  mul,
  mulDot,
  neg,
  num,
  pow,
  sin,
  sqrt,
  sub,
  variable,
} from '../expr/types.ts'
import { createRng } from '../random/rng.ts'
import { isInteger, isOne, rat, ratAbs, ratAdd, ratSign, ratSub, ONE } from '../rational.ts'
import { type Derivation, PLACEHOLDER, allNodes, derive } from './derive.ts'
import type { RuleId } from './rules.ts'

// Fehlerregeln: typische Denkfehler als falsche Anwendung einer Regel an genau einer
// Stelle. Daraus entstehen die falschen Antwortoptionen und die Fehlerdiagnose.
// Katalog mit Beispielen: docs/PLAN-M1.md, „Katalog der Fehlerregeln".

export type ErrorRule = {
  readonly id: string
  readonly rule: RuleId
  // kurze Bezeichnung ohne Formel, z. B. „Ableitungen multipliziert"
  readonly name: string
  // der Fehler als Formel (LaTeX), z. B. (u \cdot v)' = u' \cdot v'
  readonly wrongFormula: string
  // falsches Ergebnis an diesem Knoten, oder null, wenn die Regel hier nicht passt
  apply(node: Derivation): Expr | null
}

const X = (node: Derivation) => variable(node.variable)
const childResult = (node: Derivation, index: number) => node.children[index].result

// Exponent der Potenzregel als Zahl
function powerExponent(node: Derivation) {
  return node.parts.exponent ? asRational(node.parts.exponent) : null
}

const POWER_ON_NAME = new Set(['sin', 'cos', 'tan', 'cot', 'sinh', 'cosh', 'tanh'])

export const ERROR_RULES: readonly ErrorRule[] = [
  {
    id: 'power-exponent-not-reduced',
    rule: 'power',
    name: 'Exponent nicht verringert',
    wrongFormula: "(x^n)' = n \\cdot x^n",
    apply(node) {
      // auch für x selbst: (x)' = x statt 1
      const r = powerExponent(node)
      if (!r || r.n === 0n) return null
      return mul(num(r), pow(node.parts.base!, num(r)))
    },
  },
  {
    id: 'power-negative-wrong-direction',
    rule: 'power',
    name: 'Bei negativem Exponenten in die falsche Richtung gezählt',
    wrongFormula: "(x^{-n})' = -n \\cdot x^{-n+1}",
    apply(node) {
      const r = powerExponent(node)
      if (!r || ratSign(r) >= 0) return null
      return mul(num(r), pow(node.parts.base!, num(ratAdd(r, ONE))))
    },
  },
  {
    id: 'power-sign-forgotten',
    rule: 'power',
    name: 'Vorzeichen des negativen Exponenten vergessen',
    wrongFormula: "(x^{-n})' = n \\cdot x^{-n-1}",
    apply(node) {
      const r = powerExponent(node)
      if (!r || ratSign(r) >= 0) return null
      return mul(num(ratAbs(r)), pow(node.parts.base!, num(ratSub(r, ONE))))
    },
  },
  {
    id: 'power-root-factor-forgotten',
    rule: 'power',
    name: 'Bei der Wurzel den Vorfaktor vergessen',
    wrongFormula: "(\\sqrt{x})' = \\frac{1}{\\sqrt{x}}",
    apply(node) {
      const r = powerExponent(node)
      if (!r || r.n !== 1n || r.d === 1n) return null
      return pow(node.parts.base!, num(ratSub(r, ONE)))
    },
  },
  {
    id: 'power-fraction-numerator-only',
    rule: 'power',
    name: 'Bei gebrochenem Exponenten 1 nur vom Zähler abgezogen',
    wrongFormula: "\\left(x^{\\frac{p}{q}}\\right)' = \\frac{p}{q} \\cdot x^{\\frac{p-1}{q}}",
    apply(node) {
      const r = powerExponent(node)
      if (!r || isInteger(r)) return null
      return mul(num(r), pow(node.parts.base!, num(rat(r.n - 1n, r.d))))
    },
  },
  {
    id: 'power-exponent-not-multiplied',
    rule: 'power',
    name: 'Exponent nicht als Faktor nach vorne geholt',
    wrongFormula: "(x^n)' = x^{n-1}",
    apply(node) {
      const r = powerExponent(node)
      if (!r || r.n === 0n || isOne(r)) return null
      return pow(node.parts.base!, num(ratSub(r, ONE)))
    },
  },
  {
    id: 'factor-forgotten',
    rule: 'constantFactor',
    name: 'Faktor vergessen',
    wrongFormula: "(c \\cdot u)' = u'",
    apply(node) {
      const c = node.parts.factor ? asRational(node.parts.factor) : null
      if (c && isOne(ratAbs(c))) return null
      return childResult(node, 0)
    },
  },
  {
    id: 'constant-summand-kept',
    rule: 'sum',
    name: 'Konstanter Summand bleibt stehen',
    wrongFormula: "(u + c)' = u' + c",
    apply(node) {
      const hasConstant = node.children.some((c) => c.rule === 'constant' && !(c.input.kind === 'num' && c.input.value.n === 0n))
      if (!hasConstant) return null
      return add(...node.children.map((c) => (c.rule === 'constant' ? c.input : c.result)))
    },
  },
  {
    id: 'exp-power-rule',
    rule: 'exp',
    name: 'Potenzregel auf die e-Funktion angewendet',
    wrongFormula: "(e^x)' = x \\cdot e^{x-1}",
    apply: (node) => mul(X(node), exp(sub(X(node), num(1)))),
  },
  {
    id: 'sin-sign',
    rule: 'sin',
    name: 'Vorzeichen beim Sinus falsch',
    wrongFormula: "(\\sin x)' = -\\cos x",
    apply: (node) => neg(cos(X(node))),
  },
  {
    id: 'cos-sign',
    rule: 'cos',
    name: 'Minuszeichen beim Kosinus vergessen',
    wrongFormula: "(\\cos x)' = \\sin x",
    apply: (node) => sin(X(node)),
  },
  {
    id: 'ln-like-exp',
    rule: 'ln',
    name: 'Wie die e-Funktion behandelt',
    wrongFormula: "(\\ln x)' = \\ln x",
    apply: (node) => ln(X(node)),
  },
  {
    id: 'ln-reciprocal-of-ln',
    rule: 'ln',
    name: 'Kehrwert des Logarithmus statt Kehrwert von x',
    wrongFormula: "(\\ln x)' = \\frac{1}{\\ln x}",
    apply: (node) => div(num(1), ln(X(node))),
  },
  {
    id: 'product-derivatives-multiplied',
    rule: 'product',
    name: 'Ableitungen der Faktoren multipliziert',
    wrongFormula: "(u \\cdot v)' = u' \\cdot v'",
    apply: (node) => mulDot(childResult(node, 0), childResult(node, 1)),
  },
  {
    id: 'product-second-summand-missing',
    rule: 'product',
    name: 'Zweiter Summand der Produktregel fehlt',
    wrongFormula: "(u \\cdot v)' = u' \\cdot v",
    apply: (node) => mulDot(childResult(node, 0), node.parts.v!),
  },
  {
    id: 'product-minus',
    rule: 'product',
    name: 'Minus statt Plus (mit Quotientenregel verwechselt)',
    wrongFormula: "(u \\cdot v)' = u' \\cdot v - u \\cdot v'",
    apply: (node) =>
      add(mulDot(childResult(node, 0), node.parts.v!), neg(mulDot(node.parts.u!, childResult(node, 1)))),
  },
  {
    id: 'quotient-numerator-swapped',
    rule: 'quotient',
    name: 'Reihenfolge im Zähler vertauscht',
    wrongFormula: "\\left(\\frac{u}{v}\\right)' = \\frac{u \\cdot v' - u' \\cdot v}{v^2}",
    apply: ({ parts, children }) =>
      div(add(mulDot(parts.u!, children[1].result), neg(mulDot(children[0].result, parts.v!))), pow(parts.v!, num(2))),
  },
  {
    id: 'quotient-denominator-not-squared',
    rule: 'quotient',
    name: 'Nenner nicht quadriert',
    wrongFormula: "\\left(\\frac{u}{v}\\right)' = \\frac{u' \\cdot v - u \\cdot v'}{v}",
    apply: ({ parts, children }) =>
      div(add(mulDot(children[0].result, parts.v!), neg(mulDot(parts.u!, children[1].result))), parts.v!),
  },
  {
    id: 'quotient-separately',
    rule: 'quotient',
    name: 'Zähler und Nenner einzeln abgeleitet',
    wrongFormula: "\\left(\\frac{u}{v}\\right)' = \\frac{u'}{v'}",
    apply: ({ children }) => div(children[0].result, children[1].result),
  },
  {
    id: 'chain-inner-forgotten',
    rule: 'chain',
    name: 'Innere Ableitung vergessen',
    wrongFormula: "\\bigl(f(g(x))\\bigr)' = f'(g(x))",
    apply: ({ parts, children }) => substitute(children[0].result, PLACEHOLDER, parts.inner!),
  },
  {
    id: 'chain-outer-wrong-argument',
    rule: 'chain',
    name: 'Äußere Ableitung an der falschen Stelle ausgewertet',
    wrongFormula: "\\bigl(f(g(x))\\bigr)' = f'(x) \\cdot g'(x)",
    apply: (node) => mulDot(substitute(childResult(node, 0), PLACEHOLDER, X(node)), childResult(node, 1)),
  },
  {
    id: 'chain-inner-derivative-substituted',
    rule: 'chain',
    name: 'Innere Ableitung in die äußere Ableitung eingesetzt',
    wrongFormula: "\\bigl(f(g(x))\\bigr)' = f'(g'(x))",
    apply: (node) => substitute(childResult(node, 0), PLACEHOLDER, childResult(node, 1)),
  },
  {
    id: 'chain-times-inner-function',
    rule: 'chain',
    name: 'Mit der inneren Funktion statt mit der inneren Ableitung multipliziert',
    wrongFormula: "\\bigl(f(g(x))\\bigr)' = f'(g(x)) \\cdot g(x)",
    apply: ({ parts, children }) => mulDot(substitute(children[0].result, PLACEHOLDER, parts.inner!), parts.inner!),
  },
  {
    id: 'notation-power-on-name',
    rule: 'chain',
    name: 'Potenz am Funktionsnamen als Potenz des Arguments gelesen',
    wrongFormula: "(\\sin^2 x)' = \\bigl(\\sin(x^2)\\bigr)'",
    apply(node) {
      const { input } = node
      if (input.kind !== 'pow' || input.base.kind !== 'fn' || !POWER_ON_NAME.has(input.base.name)) return null
      const n = asRational(input.exp)
      if (!n || !isInteger(n) || ratSign(n) <= 0) return null
      return derive(fn(input.base.name, pow(input.base.arg, input.exp)), node.variable).result
    },
  },
  {
    id: 'exp-base-power-rule',
    rule: 'expBase',
    name: 'Potenzregel auf die Exponentialfunktion angewendet',
    wrongFormula: "(a^x)' = x \\cdot a^{x-1}",
    apply: (node) => mul(X(node), pow(node.parts.base!, sub(X(node), num(1)))),
  },
  {
    id: 'exp-base-ln-forgotten',
    rule: 'expBase',
    name: 'Faktor ln a vergessen',
    wrongFormula: "(a^x)' = a^x",
    apply: (node) => pow(node.parts.base!, X(node)),
  },
  {
    id: 'log-base-ln-forgotten',
    rule: 'logBase',
    name: 'Faktor ln a im Nenner vergessen',
    wrongFormula: "(\\log_a x)' = \\frac{1}{x}",
    apply: (node) => div(num(1), X(node)),
  },
  {
    id: 'tan-sin-cos-swapped',
    rule: 'tan',
    name: 'Sinus und Kosinus im Nenner vertauscht',
    wrongFormula: "(\\tan x)' = \\frac{1}{\\sin^2 x}",
    apply: (node) => div(num(1), pow(sin(X(node)), num(2))),
  },
  {
    id: 'arctan-sign',
    rule: 'arctan',
    name: 'Vorzeichen im Nenner falsch',
    wrongFormula: "(\\arctan x)' = \\frac{1}{1 - x^2}",
    apply: (node) => div(num(1), sub(num(1), pow(X(node), num(2)))),
  },
  {
    id: 'arctan-arcsin',
    rule: 'arctan',
    name: 'Mit dem Arkussinus verwechselt',
    wrongFormula: "(\\arctan x)' = \\frac{1}{\\sqrt{1 - x^2}}",
    apply: (node) => div(num(1), sqrt(sub(num(1), pow(X(node), num(2))))),
  },
  {
    id: 'logarithmic-power-rule',
    rule: 'logarithmic',
    name: 'Potenzregel angewendet, obwohl der Exponent von x abhängt',
    wrongFormula: "(x^x)' = x \\cdot x^{x-1}",
    apply(node) {
      const { u, v } = node.parts
      return mulDot(v!, pow(u!, sub(v!, num(1))), derive(u!, node.variable).result)
    },
  },
  {
    id: 'logarithmic-as-exponential',
    rule: 'logarithmic',
    name: 'Wie eine Exponentialfunktion abgeleitet',
    wrongFormula: "(x^x)' = x^x \\cdot \\ln x",
    apply(node) {
      const { u, v } = node.parts
      return mulDot(pow(u!, v!), ln(u!), derive(v!, node.variable).result)
    },
  },
  {
    id: 'arccos-sign',
    rule: 'arccos',
    name: 'Minuszeichen beim Arkuskosinus vergessen',
    wrongFormula: "(\\arccos x)' = \\frac{1}{\\sqrt{1 - x^2}}",
    apply: (node) => div(num(1), sqrt(sub(num(1), pow(X(node), num(2))))),
  },
  {
    id: 'cosh-sign',
    rule: 'cosh',
    name: 'Minuszeichen wie beim Kosinus gesetzt',
    wrongFormula: "(\\cosh x)' = -\\sinh x",
    apply: (node) => neg(fn('sinh', X(node))),
  },
]

export function errorRule(id: string): ErrorRule {
  const found = ERROR_RULES.find((r) => r.id === id)
  if (!found) throw new Error(`Unbekannte Fehlerregel: ${id}`)
  return found
}

export type WrongAnswer = {
  readonly errorRule: ErrorRule
  // Stelle im richtigen Rechenweg, an der der Fehler passiert
  readonly node: Derivation
  // ganzer Rechenweg mit dem Fehler
  readonly derivation: Derivation
  // falsches Endergebnis
  readonly result: Expr
  // weitere Fehlerregeln, die zum selben Ergebnis führen
  readonly alsoMatches: readonly ErrorRule[]
}

// Alle typischen falschen Ergebnisse einer Aufgabe: je Fehlerregel und Stelle eins.
// Behalten werden nur Ergebnisse, die sich deutlich von der Lösung und voneinander
// unterscheiden. Eine falsche Option ist also nie zufällig doch richtig.
export function wrongAnswers(expr: Expr, correct: Derivation = derive(expr)): WrongAnswer[] {
  const points = samplePoints([expr, correct.result], createRng(`fehler:${key(expr)}`), 60, correct.variable)
  const kept: Array<WrongAnswer & { alsoMatches: ErrorRule[] }> = []

  for (const node of allNodes(correct)) {
    for (const rule of ERROR_RULES) {
      if (rule.rule !== node.rule) continue
      const target = node.path.join(',')
      let applied = false
      const derivation = derive(expr, correct.variable, (candidate) => {
        if (candidate.path.join(',') !== target) return null
        const formula = rule.apply(candidate)
        if (!formula) return null
        applied = true
        return { formula, errorId: rule.id }
      })
      if (!applied) continue

      const result = derivation.result
      // Irgendwo definiert sein muss das falsche Ergebnis; ein kleinerer Definitionsbereich
      // ist aber typisch, z. B. 1/\sqrt{1 - x^2} statt 1/(1 + x^2)
      const defined = points.filter((p) => !Number.isNaN(evaluate(result, p))).length
      if (defined < 3) continue
      if (!clearlyDifferent(correct.result, result, points)) continue
      const duplicate = kept.find((k) => !clearlyDifferent(k.result, result, points))
      if (duplicate) {
        if (duplicate.errorRule.id !== rule.id) duplicate.alsoMatches.push(rule)
        continue
      }
      kept.push({ errorRule: rule, node, derivation, result, alsoMatches: [] })
    }
  }
  return kept
}
