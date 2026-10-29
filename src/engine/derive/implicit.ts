import { clearlyDifferent } from '../check/numeric.ts'
import { curvePoints } from '../check/curve.ts'
import { key } from '../expr/compare.ts'
import { type Env, evaluate } from '../expr/evaluate.ts'
import { finalForm } from '../expr/finalForm.ts'
import { normalize } from '../expr/normalize.ts'
import { equationToLatex } from '../expr/print.ts'
import { sampleEnvs } from '../expr/sample.ts'
import { substitute } from '../expr/substitute.ts'
import { type Equation, type Expr, asRational, div, eq, mul, neg, num, sub, variable } from '../expr/types.ts'
import { createRng } from '../random/rng.ts'
import { type Derivation, type Override, allNodes, derive, primeOf } from './derive.ts'
import { ERROR_RULES, type ErrorRule, type WrongAnswer } from './errorRules.ts'

// Implizites Ableiten: Eine Gleichung in x und y (z. B. x² + y² = 25) beschreibt eine Kurve;
// y hängt dort von x ab. Beide Seiten werden nach x abgeleitet (jeder Term mit y bekommt nach
// der Kettenregel den Faktor y'), dann wird nach y' aufgelöst. Das Ergebnis enthält x und y.

export const DEPENDENT = 'y'
export const Y_PRIME = primeOf(DEPENDENT)

export type ImplicitDerivation = {
  readonly equation: Equation
  // Ableitung der linken und der rechten Seite
  readonly left: Derivation
  readonly right: Derivation
  // abgeleitete Gleichung, z. B. 2x + 2yy' = 0
  readonly differentiated: Equation
  // alles auf die linke Seite gebracht: coefficient · y' + rest = 0
  readonly coefficient: Expr
  readonly rest: Expr
  // y' = −rest / coefficient; null, wenn y' beim Ableiten verschwunden ist (nur bei Fehlern)
  readonly result: Expr | null
}

// Ableitung beider Seiten; overrides: Fehler auf genau einer Seite (für typische Fehler)
export function deriveImplicit(equation: Equation, overrides: { left?: Override; right?: Override } = {}): ImplicitDerivation {
  const left = derive(equation.lhs, 'x', overrides.left, DEPENDENT)
  const right = derive(equation.rhs, 'x', overrides.right, DEPENDENT)
  // Die abgeleitete Gleichung ist in y' linear: Werte bei y' = 0 und y' = 1 liefern beide Teile
  const difference = sub(left.result, right.result)
  const at = (value: number) => substitute(difference, Y_PRIME, num(value))
  const rest = finalForm(at(0))
  const coefficient = finalForm(sub(at(1), at(0)))
  // y' verschwunden (nur bei Fehlern) oder nicht linear (z. B. (y')² bei einem Fehler): kein Ergebnis
  const solvable = asRational(coefficient)?.n !== 0n && isLinear(at, coefficient, rest)
  return {
    equation,
    left,
    right,
    differentiated: eq(left.result, right.result),
    coefficient,
    rest,
    result: solvable ? solved(rest, coefficient) : null,
  }
}

// y' = −rest / coefficient, gemeinsame Zahlfaktoren gekürzt: −(3x² − 3y)/(3y² − 3x) → (−x² + y)/(y² − x)
function solved(rest: Expr, coefficient: Expr): Expr {
  const numerator = finalForm(neg(rest))
  const g = gcd(integerContent(numerator), integerContent(coefficient))
  const shrink = (e: Expr) => (g > 1n ? finalForm(mul(num(1n, g), e)) : e)
  return finalForm(div(shrink(numerator), shrink(coefficient)))
}

function gcd(a: bigint, b: bigint): bigint {
  return b === 0n ? a : gcd(b, a % b)
}

// Größter gemeinsamer ganzzahliger Faktor aller Summanden (1, wenn es keinen gibt)
function integerContent(e: Expr): bigint {
  const n = normalize(e)
  const terms = n.kind === 'add' ? n.terms : [n]
  let content = 0n
  for (const term of terms) {
    const factors = term.kind === 'mul' ? term.factors : [term]
    const c = factors.find((f) => f.kind === 'num')
    const value = c?.kind === 'num' ? c.value : { n: 1n, d: 1n }
    if (value.d !== 1n) return 1n
    content = gcd(value.n < 0n ? -value.n : value.n, content)
  }
  return content === 0n ? 1n : content
}

// Stellen (x, y) für die Probe, ob die abgeleitete Gleichung linear in y' ist
const PROBES: readonly Env[] = [
  { x: 0.37, y: 1.21 },
  { x: -1.13, y: 0.58 },
  { x: 1.71, y: -0.83 },
]

// A · y' + B für y' = 2 muss mit dem Wert der Gleichung bei y' = 2 übereinstimmen
function isLinear(at: (value: number) => Expr, coefficient: Expr, rest: Expr): boolean {
  return PROBES.every((point) => {
    const actual = evaluate(at(2), point)
    const linear = 2 * evaluate(coefficient, point) + evaluate(rest, point)
    if (Number.isNaN(actual) || Number.isNaN(linear)) return true
    return Math.abs(actual - linear) <= 1e-9 * Math.max(1, Math.abs(actual))
  })
}

export const implicitResult = (d: ImplicitDerivation): Expr => {
  if (!d.result) throw new Error(`Nicht nach y' auflösbar: ${equationToLatex(d.equation)}`)
  return d.result
}

// Zufällige Stellen (x, y, y'), unabhängig voneinander: zum Vergleichen abgeleiteter Gleichungen
export function implicitEnvs(equation: Equation, extra: readonly Expr[] = []): Env[] {
  return sampleEnvs([equation.lhs, equation.rhs, ...extra], createRng(`implizit:${key(equation.lhs)}=${key(equation.rhs)}`), 60, [
    'x',
    DEPENDENT,
    Y_PRIME,
  ])
}

// Punkte auf der Kurve: Dort zählt, ob zwei Ergebnisse für y' gleich sind
export function implicitCurvePoints(equation: Equation, seed: string, count = 40): Env[] {
  return curvePoints(equation, createRng(`kurve:${seed}:${key(equation.lhs)}=${key(equation.rhs)}`), count)
}

const differenceOf = (e: Equation) => sub(e.lhs, e.rhs)

export type ImplicitWrongAnswer = WrongAnswer & {
  readonly side: 'left' | 'right'
  // abgeleitete Gleichung mit dem Fehler
  readonly differentiated: Equation
  // y' daraus, oder null, wenn y' verschwunden ist
  readonly solved: Expr | null
}

// Typische Fehler beim Ableiten der beiden Seiten: je Fehlerregel und Stelle eine falsche
// abgeleitete Gleichung, die sich von der richtigen und den anderen deutlich unterscheidet
export function implicitWrongAnswers(equation: Equation, correct = deriveImplicit(equation)): ImplicitWrongAnswer[] {
  const right = differenceOf(correct.differentiated)
  const points = implicitEnvs(equation, [right])
  const kept: Array<ImplicitWrongAnswer & { alsoMatches: ErrorRule[] }> = []
  for (const side of ['left', 'right'] as const) {
    for (const node of allNodes(correct[side])) {
      for (const rule of ERROR_RULES) {
        if (rule.rule !== node.rule) continue
        const target = node.path.join(',')
        let applied = false
        const override: Override = (candidate) => {
          if (candidate.path.join(',') !== target) return null
          const formula = rule.apply(candidate)
          if (!formula) return null
          applied = true
          return { formula, errorId: rule.id }
        }
        const wrong = deriveImplicit(equation, { [side]: override })
        if (!applied) continue
        // unrealistisch: y' nicht mehr linear, z. B. (y')² durch eingesetzte innere Ableitung
        if (!wrong.result && asRational(wrong.coefficient)?.n !== 0n) continue
        const difference = differenceOf(wrong.differentiated)
        if (!clearlyDifferent(right, difference, points)) continue
        const duplicate = kept.find((k) => !clearlyDifferent(differenceOf(k.differentiated), difference, points))
        if (duplicate) {
          if (duplicate.errorRule.id !== rule.id) duplicate.alsoMatches.push(rule)
          continue
        }
        kept.push({
          errorRule: rule,
          node,
          derivation: wrong[side],
          result: wrong.result ?? difference,
          alsoMatches: [],
          side,
          differentiated: wrong.differentiated,
          solved: wrong.result,
        })
      }
    }
  }
  return kept
}

// Typische Fehler beim Auflösen nach y' (die abgeleitete Gleichung stimmt):
// sign: Vorzeichen beim Umstellen vergessen; reciprocal: durch die falsche Seite geteilt;
// partial: nicht alle Terme mit y' gesammelt (nur durch den ersten Faktor geteilt)
export type SolveMistake = 'sign' | 'reciprocal' | 'partial'

export function solveMistakes(d: ImplicitDerivation, points: readonly Env[]): Array<{ mistake: SolveMistake; result: Expr }> {
  const correct = implicitResult(d)
  const candidates: Array<{ mistake: SolveMistake; result: Expr }> = [
    { mistake: 'sign', result: finalForm(div(d.rest, d.coefficient)) },
    { mistake: 'reciprocal', result: finalForm(div(neg(d.coefficient), d.rest)) },
  ]
  if (d.coefficient.kind === 'add' && d.coefficient.terms.length >= 2) {
    candidates.push({ mistake: 'partial', result: finalForm(div(neg(d.rest), d.coefficient.terms[0])) })
  }
  const kept: Array<{ mistake: SolveMistake; result: Expr }> = []
  const differ = (a: Expr, b: Expr) => clearlyDifferent(a, b, points) || clearlyDifferent(b, a, points)
  for (const candidate of candidates) {
    if (!differ(correct, candidate.result)) continue
    if (kept.some((k) => !differ(k.result, candidate.result))) continue
    kept.push(candidate)
  }
  return kept
}

// Sortiert, y' ausgeklammert, für Erklärungen: (Faktor) · y' = Rest
export const sortedEquation = (d: ImplicitDerivation): Equation => eq(mul(d.coefficient, variable(Y_PRIME)), finalForm(neg(d.rest)))
