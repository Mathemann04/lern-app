import { explainFractionError, listing } from '../explain/fractionTexts.ts'
import { explainRearrangeError } from '../explain/rearrangeTexts.ts'
import { contains, subterms } from '../expr/compare.ts'
import { type Env, evaluate } from '../expr/evaluate.ts'
import { equationToLatex } from '../expr/print.ts'
import { type Equation, type Expr, eq, mul, variable } from '../expr/types.ts'
import { factoredPoly, reduceFrac } from '../fraction/factor.ts'
import type { Frac } from '../fraction/frac.ts'
import { isZeroPoly, polyContent, polyMul, polySub, totalDegree } from '../fraction/poly.ts'
import { parseLatexEquation } from '../parse/latex.ts'
import { createRng } from '../random/rng.ts'
import { newAtoms, toRat } from '../rearrange/algebra.ts'
import { samplePoints } from '../rearrange/check.ts'
import { type RearrangeWrong, rearrangeWrongAnswers } from '../rearrange/errorRules.ts'
import { type RearrangeSolution, solveEquation } from '../rearrange/isolate.ts'
import { type RearrangeTask, taskVariables } from '../rearrange/task.ts'
import { isInteger, ratAbs } from '../rational.ts'
import { generateRearrangeTask } from '../tasks/rearrangeTerms.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'
import { variablesOf } from './answer.ts'
import type { FreeTask, FreeVerdict } from './freeTask.ts'

// Prüft ein frei eingegebenes Ergebnis beim Umstellen (docs/PLAN-M3.md, „Wann ist ein Ergebnis
// fertig?"). Eingabe: die rechte Seite von „x = …" oder eine ganze Gleichung.
// - Steht die gesuchte Variable noch auf beiden Seiten (oder nicht allein), aber die Gleichung gilt
//   für die Lösung: noch nicht aufgelöst (zählt nicht als Fehler).
// - Gleicher Wert wie die Lösung (an Prüfstellen im erlaubten Bereich): fertig? Ein Bruch ohne Bruch
//   im Zähler oder Nenner (auch unter einer Wurzel oder in einem Quadrat), Zähler und Nenner
//   zusammengefasst, gekürzt.
// - Sonst Vergleich mit den falschen Ergebnissen der typischen Fehler.

export type RearrangeCheckContext = {
  readonly task: RearrangeTask
  readonly solution: RearrangeSolution
  readonly wrongs: readonly RearrangeWrong[]
  // Buchstaben der Aufgabe
  readonly letters: readonly string[]
  // Prüfstellen: Buchstaben positiv, die gesuchte Variable aus der Lösung, Bedingungen erfüllt
  readonly points: readonly Env[]
}

// Warum ein Ergebnis noch nicht fertig ist
export type NotDone = 'not-isolated' | 'several' | 'nested' | 'numerator' | 'denominator' | 'not-reduced'

export type RearrangeVerdict =
  | { readonly kind: 'unreadable'; readonly message: string }
  | { readonly kind: 'correct' }
  | { readonly kind: 'unfinished'; readonly reason: NotDone }
  | { readonly kind: 'knownError'; readonly wrong: RearrangeWrong }
  | { readonly kind: 'wrongSign' }
  | { readonly kind: 'wrong' }

const POINTS = 24

export function prepareRearrangeCheck(task: RearrangeTask): RearrangeCheckContext {
  const solution = solveEquation(task.equation, task.target)
  if (!solution) throw new Error(`Die Aufgabe ${equationToLatex(task.equation)} lässt sich nicht auflösen`)
  const points = samplePoints(task, solution.result, createRng(`umstellen-frei:${equationToLatex(task.equation)}`), POINTS, solution.requires)
  return { task, solution, wrongs: rearrangeWrongAnswers(task, solution), letters: taskVariables(task), points }
}

export function checkRearrangeAnswer(context: RearrangeCheckContext, latex: string): RearrangeVerdict {
  const parsed = parseLatexEquation(latex)
  if (!parsed.ok) return { kind: 'unreadable', message: parsed.message }
  const t = context.task.target
  const sides = parsed.lhs ? [parsed.lhs, parsed.rhs] : [parsed.rhs]

  const unknown = [...new Set(sides.flatMap((s) => [...variablesOf(s)]))].filter((name) => !context.letters.includes(name))
  if (unknown.length > 0) {
    const name = unknown[0]
    const capital = context.letters.find((l) => l.toUpperCase() === name)
    if (capital) return { kind: 'unreadable', message: `Schreibe $${capital}$ bitte klein.` }
    const which = listing(context.letters.map((l) => `$${l}$`))
    return { kind: 'unreadable', message: `In der Aufgabe kommen nur ${which} vor. Was soll $${name}$ bedeuten?` }
  }

  // „x = …", „… = x" oder nur die rechte Seite
  const isTarget = (e: Expr) => e.kind === 'var' && e.name === t
  let answer: Expr
  if (!parsed.lhs || isTarget(parsed.lhs)) answer = parsed.rhs
  else if (isTarget(parsed.rhs)) answer = parsed.lhs
  else return notIsolated(eq(parsed.lhs, parsed.rhs), context)
  if (contains(answer, t)) return notIsolated(eq(variable(t), answer), context)

  const { points } = context
  if (agrees(answer, (p) => p[t], points)) {
    const reason = notDone(answer, context.solution.result)
    return reason ? { kind: 'unfinished', reason } : { kind: 'correct' }
  }
  // falsche Ergebnisse sind oft nur an wenigen Stellen definiert (z. B. \sqrt{a^2 - 4y^2})
  const wrong = context.wrongs.find((w) => w.result && agrees(answer, (p) => evaluate(w.result!, p), points, MIN_COMPARED_WRONG))
  if (wrong) return { kind: 'knownError', wrong }
  if (agrees(answer, (p) => -p[t], points)) return { kind: 'wrongSign' }
  return { kind: 'wrong' }
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b))

const MIN_COMPARED_WRONG = 3

// Hat der Term an den Prüfstellen den erwarteten Wert? Verglichen wird, wo beides auswertbar ist; das
// muss mindestens an der Hälfte der Stellen gehen (bzw. an minimum Stellen).
function agrees(e: Expr, expected: (p: Env) => number, points: readonly Env[], minimum = points.length / 2): boolean {
  const pairs = points.map((p) => [evaluate(e, p), expected(p)] as const).filter(([v, w]) => Number.isFinite(v) && Number.isFinite(w))
  return pairs.length > 0 && pairs.length >= minimum && pairs.every(([v, w]) => close(v, w))
}

// Eine Gleichung, in der die gesuchte Variable noch nicht allein steht: Gilt sie für die Lösung (und
// nicht einfach immer), ist richtig umgeformt, aber noch nicht aufgelöst
function notIsolated(e: Equation, context: RearrangeCheckContext): RearrangeVerdict {
  const t = context.task.target
  const gap = (p: Env) => evaluate(e.lhs, p) - evaluate(e.rhs, p)
  const atSolution = context.points.map((p) => [evaluate(e.lhs, p), evaluate(e.rhs, p)] as const).filter(([l, r]) => Number.isFinite(l) && Number.isFinite(r))
  const solves = atSolution.length >= context.points.length / 2 && atSolution.length > 0 && atSolution.every(([l, r]) => close(l, r))
  // daneben (gesuchte Variable verschoben) darf sie nicht mehr gelten
  const shifted = context.points.map((p) => gap({ ...p, [t]: p[t] * 1.37 + 0.11 })).filter(Number.isFinite)
  const informative = shifted.some((g) => Math.abs(g) > 1e-6)
  return solves && informative ? { kind: 'unfinished', reason: 'not-isolated' } : { kind: 'wrong' }
}

// --- Ist ein gleichwertiges Ergebnis fertig? ---

// Kommt ein Bruch vor? Hochzahlen zählen nicht (x^{\frac{1}{2}} ist kein Bruch)
function hasFraction(e: Expr): boolean {
  switch (e.kind) {
    case 'div':
      return true
    case 'add':
      return e.terms.some(hasFraction)
    case 'mul':
      return e.factors.some(hasFraction)
    case 'neg':
    case 'root':
    case 'fn':
      return hasFraction(e.arg)
    case 'pow':
      return hasFraction(e.base)
    case 'log':
      return hasFraction(e.base) || hasFraction(e.arg)
    default:
      return false
  }
}

const stripMinus = (e: Expr): Expr => (e.kind === 'neg' ? stripMinus(e.arg) : e)

// Zähler und Nenner der Eingabe; sonst, warum es kein einzelner Bruch ist. Eine Wurzel oder ein
// Quadrat um einen Bruch zählt wie der Bruch: \sqrt{\frac{…}{…}}, \left(\frac{…}{…}\right)^2.
function parts(answer: Expr): { num: Expr; den: Expr | null } | NotDone {
  let core = stripMinus(answer)
  if ((core.kind === 'root' || (core.kind === 'pow' && !hasFraction(core.exp))) && hasFraction(core)) {
    core = stripMinus(core.kind === 'root' ? core.arg : core.base)
  }
  if (core.kind === 'div') return hasFraction(core.num) || hasFraction(core.den) ? 'nested' : { num: core.num, den: core.den }
  if (!hasFraction(core)) return { num: core, den: null }
  // Bruch mal Term ohne Bruch, z. B. \frac{1}{3}(by - bc + 3a): wie ein Bruch
  if (core.kind === 'mul') {
    const fractions = core.factors.filter((f) => f.kind === 'div')
    const rest = core.factors.filter((f) => f.kind !== 'div')
    if (fractions.length === 1 && !rest.some(hasFraction)) {
      const [f] = fractions
      if (f.kind === 'div' && !hasFraction(f.num) && !hasFraction(f.den)) return { num: mul(f.num, ...rest), den: f.den }
    }
  }
  return 'several'
}

// Klammer mit Summe außerhalb von Wurzeln, z. B. a(y - c) oder (y + 1)^2
function hasBracket(e: Expr): boolean {
  switch (e.kind) {
    case 'add':
      return true
    case 'mul':
      return e.factors.some(hasBracket)
    case 'neg':
      return hasBracket(e.arg)
    case 'pow':
      return hasBracket(e.base)
    default:
      return false
  }
}

// Eine Summe ist zusammengefasst, wenn kein Summand eine Klammer mit Summe enthält und keine zwei
// gleichartig sind (3y + 2y, 4 + 1). In Produkten zählt jede Klammer für sich, unter einer Wurzel
// der Term darunter.
function isCombined(e: Expr): boolean {
  const core = stripMinus(e)
  switch (core.kind) {
    case 'add': {
      if (core.terms.some(hasBracket) || !core.terms.every(isCombined)) return false
      const atoms = newAtoms('')
      const seen = new Set<string>()
      for (const term of core.terms) {
        const f = toRat(term, atoms)
        if (!f || f.num.length !== 1 || f.den.length !== 1 || f.den[0].mono.length > 0) continue
        const like = JSON.stringify(f.num[0].mono)
        if (seen.has(like)) return false
        seen.add(like)
      }
      return true
    }
    case 'mul':
      return core.factors.every(isCombined)
    case 'pow':
      return isCombined(core.base)
    case 'root':
      return isCombined(core.arg)
    default:
      return true
  }
}

function notDone(answer: Expr, result: Expr): NotDone | null {
  const shape = parts(answer)
  if (typeof shape === 'string') return shape
  if (!isCombined(shape.num)) return 'numerator'
  if (shape.den && !isCombined(shape.den)) return 'denominator'
  // Gekürzt: Ist die Eingabe als Bruch aus Polynomen genau die Lösung, hat ihr Nenner denselben Grad
  // wie der gekürzte, und die Zahlen vor Zähler und Nenner haben keinen gemeinsamen Teiler
  const atoms = newAtoms('')
  const value = toRat(answer, atoms)
  const correct = toRat(result, atoms)
  if (!value || !correct || !sameFrac(value, correct)) return null
  if (totalDegree(value.den) > totalDegree(factoredPoly(reduceFrac(correct).den))) return 'not-reduced'
  const [cn, cd] = [polyContent(value.num), polyContent(value.den)]
  if (!isInteger(cn) || !isInteger(cd)) return 'not-reduced'
  let g = ratAbs(cn).n
  for (let b = ratAbs(cd).n; b !== 0n; ) [g, b] = [b, g % b]
  return g === 1n ? null : 'not-reduced'
}

const sameFrac = (a: Frac, b: Frac) => isZeroPoly(polySub(polyMul(a.num, b.den), polyMul(b.num, a.den)))

// --- Für die Oberfläche ---

export function notDoneText(reason: NotDone, target: string): string {
  switch (reason) {
    case 'not-isolated':
      return `Noch nicht aufgelöst: $${target}$ muss allein auf einer Seite stehen und darf auf der anderen nicht mehr vorkommen.`
    case 'several':
      return 'Fasse noch zu einem einzigen Bruch zusammen.'
    case 'nested':
      return 'Im Bruch steht noch ein Bruch. Löse den Doppelbruch auf.'
    case 'numerator':
      return 'Fasse den Zähler noch zusammen: Klammern ausmultiplizieren und gleichartige Summanden zusammenrechnen. Einen gemeinsamen Faktor wie in $a(y - c)$ darfst du ausklammern.'
    case 'denominator':
      return 'Fasse den Nenner noch zusammen: Klammern in einer Summe ausmultiplizieren und gleichartige Summanden zusammenrechnen.'
    case 'not-reduced':
      return 'Noch nicht vollständig gekürzt. Zerlege Zähler und Nenner in Faktoren und kürze, was oben und unten steht.'
  }
}

export function rearrangeFreeVerdict(v: RearrangeVerdict, target: string): FreeVerdict {
  switch (v.kind) {
    case 'unreadable':
      return { kind: 'unreadable', title: 'Das kann ich noch nicht lesen.', message: v.message }
    case 'correct':
      return { kind: 'correct', title: 'Richtig!' }
    case 'unfinished':
      return { kind: 'unfinished', title: v.reason === 'not-isolated' ? 'Richtig umgeformt, aber noch nicht fertig.' : 'Richtig gerechnet, aber noch nicht fertig.', message: notDoneText(v.reason, target) }
    case 'knownError': {
      const { id, name } = v.wrong.rule
      return { kind: 'wrong', title: 'Nicht ganz.', error: { id, name, why: id.startsWith('frac-') ? explainFractionError(id) : explainRearrangeError(id) } }
    }
    case 'wrongSign':
      return { kind: 'wrong', title: 'Fast!', message: 'Bis auf das Vorzeichen stimmt es. Prüfe, wo ein Minus hingehört.' }
    case 'wrong':
      return {
        kind: 'wrong',
        title: 'Das stimmt noch nicht.',
        message: 'Rechne noch einmal nach. Wenn du nicht weiterkommst, helfen dir der Tipp, der Lösungsweg oder der geführte Modus.',
      }
  }
}

// Wurzel-Taste, wenn in der Aufgabe oder im Ergebnis eine Wurzel steht
const hasRoot = (...exprs: readonly Expr[]) => exprs.some((e) => subterms(e).some((s) => s.kind === 'root'))

export function prepareRearrangeFree(ref: TaskRef): FreeTask {
  const context = prepareRearrangeCheck(generateRearrangeTask(ref).task)
  const { equation, target } = context.task
  return {
    answerLabel: `${target} =`,
    inputLabel: 'Dein Ergebnis',
    keyboard: { kind: 'rearrange', letters: context.letters, root: hasRoot(equation.lhs, equation.rhs, context.solution.result) },
    check: (latex) => rearrangeFreeVerdict(checkRearrangeAnswer(context, latex), target),
  }
}
