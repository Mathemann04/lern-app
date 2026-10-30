import { contains, key } from '../expr/compare.ts'
import { evaluate } from '../expr/evaluate.ts'
import { equationToLatex } from '../expr/print.ts'
import { type Equation, type Expr, add, div, eq, mul, variable } from '../expr/types.ts'
import { FRACTION_ERROR_RULES, fractionWrongAnswers } from '../fraction/errorRules.ts'
import { type Signed, expanded, minus, part, plus } from '../fraction/task.ts'
import {
  type Poly,
  polyAdd,
  polyAtom,
  polyConst,
  polyDivideExact,
  polyMul,
} from '../fraction/poly.ts'
import { createRng } from '../random/rng.ts'
import { isOne, rat, ratAbs, ratSign } from '../rational.ts'
import { type Atoms, ROOT_ATOM, monomialSqrt, newAtoms, niceFrac, polyToExpr, toPoly, toRat } from './algebra.ts'
import { clearlyFails, differsFromTarget, samplePoints } from './check.ts'
import {
  type RearrangeSolution,
  type RearrangeStep,
  type Side,
  dividedBy,
  hasTargetRoot,
  negated,
  plusTerm,
  solveEquation,
  squared,
  timesFactor,
} from './isolate.ts'
import type { RearrangeTask } from './task.ts'

// Typische Fehler beim Umstellen (Katalog in docs/PLAN-M3.md). Jeder Fehler steckt in genau einem
// Schritt des Rechenwegs: Dieser Schritt wird falsch ausgeführt, danach wird richtig weitergerechnet.
// Daraus entstehen die falschen Antworten im geführten Modus und die Fehlerdiagnose im freien Modus.
// Beim Zusammenfassen zu einem Bruch kommen die Fehler aus „Brüche" dazu (Ids frac-…).

export type EqErrorRule = {
  readonly id: string
  // Name des Fehlers (Text mit $…$-Formeln)
  readonly name: string
  // Beispiel aus dem Fehlerkatalog
  readonly wrongFormula: string
}

export const REARRANGE_ERROR_RULES: readonly EqErrorRule[] = [
  { id: 'eq-sign-not-flipped', name: 'Beim Rüberbringen das Vorzeichen nicht gewechselt', wrongFormula: 'y = x + b \\Rightarrow x = y + b' },
  { id: 'eq-inverse-op', name: 'Malgenommen statt geteilt (oder umgekehrt)', wrongFormula: 'y = ax \\Rightarrow x = ay' },
  { id: 'eq-divide-one-term', name: 'Nur einen Summanden geteilt', wrongFormula: 'ax = y + b \\Rightarrow x = \\frac{y}{a} + b' },
  { id: 'eq-fraction-flipped', name: 'Bruch auf den Kopf gestellt', wrongFormula: 'y = \\frac{a}{x} \\Rightarrow x = \\frac{y}{a}' },
  { id: 'eq-denominator-bracket', name: 'Klammer um den Nenner vergessen', wrongFormula: 'y = \\frac{2x + 1}{x - 3} \\Rightarrow xy - 3 = 2x + 1' },
  { id: 'eq-bracket-first-term', name: 'Beim Ausmultiplizieren nur den ersten Summanden malgenommen', wrongFormula: 'a(x + b) = ax + b' },
  { id: 'eq-factor-one-lost', name: 'Beim Ausklammern die $1$ vergessen', wrongFormula: 'xy - x = 3y + 1 \\Rightarrow xy = 3y + 1' },
  { id: 'eq-reciprocal-termwise', name: 'Kehrwert von jedem Summanden einzeln genommen', wrongFormula: '\\frac{1}{a} = \\frac{1}{b} - \\frac{1}{x} \\Rightarrow a = b - x' },
  { id: 'eq-root-termwise', name: 'Wurzel aus jedem Summanden einzeln gezogen', wrongFormula: 'x^2 = b^2 - \\frac{y^2}{a^2} \\Rightarrow x = b - \\frac{y}{a}' },
  { id: 'eq-square-one-factor', name: 'Nur einen Teil quadriert', wrongFormula: '\\frac{y}{a} = \\sqrt{b^2 - x^2} \\Rightarrow \\frac{y^2}{a} = b^2 - x^2' },
  { id: 'eq-square-middle', name: 'Beim Quadrieren das Mittelglied vergessen', wrongFormula: '\\left(y + \\sqrt{x}\\right)^2 = y^2 + x' },
]

export function rearrangeErrorRule(id: string): EqErrorRule {
  const found = REARRANGE_ERROR_RULES.find((r) => r.id === id) ?? FRACTION_ERROR_RULES.find((r) => r.id === id)
  if (!found) throw new Error(`Unbekannte Fehlerregel: ${id}`)
  return found
}

export type RearrangeWrong = {
  readonly rule: EqErrorRule
  // Schritt, in dem der Fehler passiert
  readonly stepIndex: number
  // falsche Gleichung nach diesem Schritt
  readonly after: Equation
  // falsches Endergebnis (rechte Seite von „x = …"), wenn man damit richtig weiterrechnen kann
  readonly result: Expr | null
}

type Candidate = { readonly id: string; readonly after: Equation }

// --- Hilfen ---

const termsOf = (e: Expr): readonly Expr[] => (e.kind === 'add' ? e.terms : [e])
const other = (side: Side): Side => (side === 'lhs' ? 'rhs' : 'lhs')
const withSide = (e: Equation, side: Side, value: Expr): Equation => (side === 'lhs' ? eq(value, e.rhs) : eq(e.lhs, value))

function isNegative(e: Expr): boolean {
  if (e.kind === 'neg') return true
  if (e.kind === 'num') return ratSign(e.value) < 0
  return e.kind === 'mul' && e.factors[0]?.kind === 'num' && ratSign(e.factors[0].value) < 0
}

const sum = (terms: readonly Expr[]): Expr => (terms.length === 1 ? terms[0] : add(...terms))

function reciprocalOf(e: Expr): Expr {
  if (e.kind === 'div') return e.num.kind === 'num' && isOne(e.num.value) ? e.den : div(e.den, e.num)
  return div({ kind: 'num', value: rat(1) }, e)
}

// Polynom beider Seiten in der Unbekannten (x bzw. √x)
function polys(e: Equation, atoms: Atoms): { l: Poly; r: Poly } | null {
  const l = toPoly(e.lhs, atoms)
  const r = toPoly(e.rhs, atoms)
  return l && r ? { l, r } : null
}

const hasAtom = (u: string) => (term: Poly[number]) => term.mono.some(([a]) => a === u)

function unknownOf(e: Equation, t: string): { atoms: Atoms; u: string } {
  const rootUnknown = hasTargetRoot(e, t)
  return { atoms: newAtoms(t, rootUnknown), u: rootUnknown ? ROOT_ATOM : t }
}

// --- Fehler je Schritt ---

function signNotFlipped(step: RearrangeStep, t: string): Candidate[] {
  const { before, side, operand } = step
  if (step.kind === 'add' && side && operand) {
    const o = before[other(side)]
    return [{ id: 'eq-sign-not-flipped', after: withSide(step.after, other(side), plusTerm(o, negated(operand))) }]
  }
  if (step.kind === 'move' && side && operand) {
    const s = before[side]
    const o = before[other(side)]
    const rest = termsOf(s).filter((x) => !contains(x, t))
    const wrong = sum([...rest, ...termsOf(o)])
    return [{ id: 'eq-sign-not-flipped', after: side === 'rhs' ? eq(operand, wrong) : eq(wrong, operand) }]
  }
  if (step.kind === 'collect') {
    // Summanden, die die Seite wechseln, behalten ihr Vorzeichen
    const { atoms, u } = unknownOf(before, t)
    const p = polys(before, atoms)
    if (!p) return []
    const not = (term: Poly[number]) => !hasAtom(u)(term)
    const left = polyAdd(p.l.filter(hasAtom(u)), p.r.filter(hasAtom(u)))
    const right = polyAdd(p.l.filter(not), p.r.filter(not))
    return [{ id: 'eq-sign-not-flipped', after: eq(polyToExpr(left, atoms), polyToExpr(right, atoms)) }]
  }
  return []
}

function divideMistakes(step: RearrangeStep): Candidate[] {
  const { before, side, operand } = step
  if (!side || !operand) return []
  const o = before[other(side)]
  const tPart = step.after[side]
  const out: Candidate[] = []
  if (step.kind === 'divide') {
    out.push({ id: 'eq-inverse-op', after: withSide(step.after, other(side), timesFactor(o, operand)) })
    if (o.kind === 'add') {
      const [first, ...rest] = o.terms
      out.push({ id: 'eq-divide-one-term', after: withSide(step.after, other(side), add(dividedBy(first, operand), ...rest)) })
    }
    if (tPart.kind === 'var') out.push({ id: 'eq-fraction-flipped', after: withSide(step.after, other(side), reciprocalOf(step.after[other(side)])) })
  }
  if (step.kind === 'multiply') {
    out.push({ id: 'eq-inverse-op', after: withSide(step.after, other(side), dividedBy(o, operand)) })
  }
  return out
}

// w · (d₁ + d₂) als w·d₁ + d₂
function bracketForgotten(w: Expr, d: Poly, atoms: Atoms): Expr | null {
  const wp = toPoly(w, atoms)
  if (!wp || w.kind === 'add' || w.kind === 'div' || d.length < 2) return null
  const [first, ...rest] = d
  return polyToExpr(polyAdd(polyMul(wp, [first]), rest), atoms)
}

function denominatorBracket(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'multiply' || !step.operand || step.operand.kind !== 'add') return []
  const atoms = newAtoms(t)
  const d = toPoly(step.operand, atoms)
  if (!d) return []
  const sides: Side[] = step.side ? [other(step.side)] : ['lhs', 'rhs']
  for (const side of sides) {
    const wrong = bracketForgotten(step.before[side], d, atoms)
    if (wrong) return [{ id: 'eq-denominator-bracket', after: withSide(step.after, side, wrong) }]
  }
  return []
}

// Klammern ausmultiplizieren: nur den ersten Summanden malgenommen, Mittelglied vergessen
function expandMistakes(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'expand') return []
  const { atoms } = unknownOf(step.before, t)
  const out: Candidate[] = []
  for (const side of ['lhs', 'rhs'] as const) {
    const terms = termsOf(step.before[side])
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i]
      const others = terms.filter((_, j) => j !== i)
      const restPoly = others.length ? toPoly(sum(others), atoms) : polyConst(0)
      if (!restPoly) continue
      let wrong: Poly | null = null
      let id = ''
      if (term.kind === 'mul' && term.factors.filter((f) => f.kind === 'add').length === 1) {
        const bracket = term.factors.find((f) => f.kind === 'add')!
        const c = toPoly(mul(...term.factors.filter((f) => f !== bracket)), atoms)
        const b = toPoly(bracket, atoms)
        if (c && b && b.length >= 2) {
          const [first, ...rest] = (bracket as Extract<Expr, { kind: 'add' }>).terms
          const fp = toPoly(first, atoms)
          const rp = toPoly(sum(rest), atoms)
          if (fp && rp) {
            wrong = polyAdd(polyMul(c, fp), rp)
            id = 'eq-bracket-first-term'
          }
        }
      }
      if (term.kind === 'pow' && term.base.kind === 'add' && term.base.terms.length === 2 && key(term.exp) === key({ kind: 'num', value: rat(2) })) {
        const [a, b] = term.base.terms.map((x) => toPoly(x, atoms))
        if (a && b) {
          wrong = polyAdd(polyMul(a, a), polyMul(b, b))
          id = 'eq-square-middle'
        }
      }
      if (wrong) {
        const otherSide = toPoly(step.before[other(side)], atoms)
        if (!otherSide) continue
        const wrongSide = polyToExpr(polyAdd(wrong, restPoly), atoms)
        out.push({ id, after: side === 'lhs' ? eq(wrongSide, polyToExpr(otherSide, atoms)) : eq(polyToExpr(otherSide, atoms), wrongSide) })
        break
      }
    }
  }
  return out
}

function factorOneLost(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'factor') return []
  const { atoms, u } = unknownOf(step.before, t)
  const l = toPoly(step.before.lhs, atoms)
  const coefficient = l && polyDivideExact(l, polyAtom(u))
  if (!coefficient) return []
  const one = coefficient.find((term) => term.mono.length === 0 && isOne(ratAbs(term.coef)))
  if (!one || coefficient.length < 2) return []
  const wrong = polyMul(coefficient.filter((term) => term !== one), polyAtom(u))
  return [{ id: 'eq-factor-one-lost', after: eq(polyToExpr(wrong, atoms), step.before.rhs) }]
}

function reciprocalTermwise(step: RearrangeStep, previous: RearrangeStep | undefined): Candidate[] {
  if (step.kind !== 'reciprocal' || !step.side || previous?.kind !== 'combine') return []
  const o = previous.before[other(step.side)]
  if (o.kind !== 'add') return []
  const termwise = sum(o.terms.map((x) => (isNegative(x) ? negated(reciprocalOf(negated(x))) : reciprocalOf(x))))
  return [{ id: 'eq-reciprocal-termwise', after: withSide(step.after, other(step.side), termwise) }]
}

// Wurzel aus einem Monom oder einem Bruch aus Monomen: \frac{y^2}{a^2} → \frac{y}{a}
function termRoot(e: Expr, atoms: Atoms): Expr | null {
  const f = toRat(e, atoms)
  const n = f && monomialSqrt(f.num)
  const d = f && monomialSqrt(f.den)
  return n && d ? niceFrac({ num: n, den: d }, atoms) : null
}

function rootTermwise(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'root' || !step.side) return []
  const o = step.before[other(step.side)]
  if (o.kind !== 'add') return []
  const atoms = newAtoms(t)
  const roots = o.terms.map((x) => {
    const r = termRoot(isNegative(x) ? negated(x) : x, atoms)
    return r && (isNegative(x) ? negated(r) : r)
  })
  if (roots.some((r) => r === null)) return []
  return [{ id: 'eq-root-termwise', after: withSide(step.after, other(step.side), sum(roots as Expr[])) }]
}

function squareOneFactor(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'square' || !step.side) return []
  const o = step.before[other(step.side)]
  let wrong: Expr | null = null
  if (o.kind === 'div' && !contains(o, t)) wrong = div(squared(o.num), o.den)
  if (o.kind === 'mul' && o.factors[0].kind === 'num' && o.factors.length >= 2) wrong = mul(o.factors[0], squared(mul(...o.factors.slice(1))))
  return wrong ? [{ id: 'eq-square-one-factor', after: withSide(step.after, other(step.side), wrong) }] : []
}

// Zusammenfassen zu einem Bruch (auch im Ergebnis-Schritt): Fehler aus „Brüche"
function fractionMistakes(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'combine' && step.kind !== 'finish') return []
  const tSide: Side = step.side ?? (contains(step.before.lhs, t) ? 'lhs' : 'rhs')
  const o = step.before[other(tSide)]
  const positive = (x: Expr) => (isNegative(x) ? negated(x) : x)
  if (o.kind !== 'add' || contains(o, t) || !o.terms.some((x) => positive(x).kind === 'div')) return []
  const atoms = newAtoms(t)
  const terms: Signed[] = []
  for (const x of o.terms) {
    const y = positive(x)
    const n = toPoly(y.kind === 'div' ? y.num : y, atoms)
    const d = y.kind === 'div' ? toPoly(y.den, atoms) : polyConst(1)
    if (!n || !d) return []
    const p = part(expanded(n), expanded(d))
    terms.push(isNegative(x) ? minus(p) : plus(p))
  }
  let wrongs
  try {
    wrongs = fractionWrongAnswers({ kind: 'sum', terms, hints: [] })
  } catch {
    return []
  }
  return wrongs
    .filter((w) => w.value && !w.freeOnly && (w.step === 'combine' || w.step === 'expand'))
    .map((w) => {
      const wrongSide = niceFrac(w.value!, atoms)
      return { id: w.rule.id, after: step.kind === 'finish' ? eq(variable(t), wrongSide) : withSide(step.after, other(tSide), wrongSide) }
    })
}

function candidatesFor(steps: readonly RearrangeStep[], i: number, t: string): Candidate[] {
  const step = steps[i]
  return [
    ...signNotFlipped(step, t),
    ...divideMistakes(step),
    ...denominatorBracket(step, t),
    ...expandMistakes(step, t),
    ...factorOneLost(step, t),
    ...reciprocalTermwise(step, steps[i - 1]),
    ...rootTermwise(step, t),
    ...squareOneFactor(step, t),
    ...fractionMistakes(step, t),
  ]
}

// --- Alle falschen Antworten einer Aufgabe ---

export function rearrangeWrongAnswers(task: RearrangeTask, solution: RearrangeSolution): RearrangeWrong[] {
  const t = task.target
  const points = samplePoints(task, solution.result, createRng(`umstellen:${equationToLatex(task.equation)}`), 24, solution.requires)
  const out: RearrangeWrong[] = []
  solution.steps.forEach((_, i) => {
    for (const c of candidatesFor(solution.steps, i, t)) {
      // keine Gleichung ohne Lösung (z. B. \frac{1}{a} = 0) und keine, die doch stimmt
      if (isZeroSide(c.after, t) || !clearlyFails(c.after, points)) continue
      const latex = equationToLatex(c.after)
      if (out.some((w) => w.stepIndex === i && equationToLatex(w.after) === latex)) continue
      out.push({ rule: rearrangeErrorRule(c.id), stepIndex: i, after: c.after, result: wrongResult(c.after, t, points) })
    }
  })
  return out
}

const isZeroSide = (e: Equation, t: string) =>
  [e.lhs, e.rhs].some((side) => !contains(side, t) && side.kind === 'num' && side.value.n === 0n)

// Mit der falschen Gleichung richtig weitergerechnet; null, wenn das nicht geht, das Ergebnis an den
// Prüfstellen nicht definiert ist oder doch das richtige Ergebnis herauskommt
function wrongResult(after: Equation, t: string, points: Parameters<typeof differsFromTarget>[2]): Expr | null {
  const continued = solveEquation(after, t)
  if (!continued || contains(continued.result, t)) return null
  const defined = points.filter((p) => !Number.isNaN(evaluate(continued.result, p))).length
  if (defined < points.length / 2) return null
  return differsFromTarget(continued.result, t, points) ? continued.result : null
}
