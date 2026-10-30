import { FRACTION_CARD_IDS } from '../explain/fractionCards.ts'
import { explainFractionError } from '../explain/fractionTexts.ts'
import { REARRANGE_CARD_IDS } from '../explain/rearrangeCards.ts'
import {
  COMBINE_MOVES,
  EXPAND_MOVES,
  REARRANGE_HINTS,
  ROOT_MOVES,
  SQUARE_MOVES,
  type WrongMove,
  addMoves,
  collectMoves,
  divideMoves,
  explainMove,
  explainRearrangeError,
  explainResult,
  factorMoves,
  moveMoves,
  multiplyMoves,
  negateMoves,
  reciprocalMoves,
  rearrangeTaskHint,
  signed,
} from '../explain/rearrangeTexts.ts'
import type { Explanation } from '../explain/texts.ts'
import { contains, subterms } from '../expr/compare.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { type Equation, type Expr, sub } from '../expr/types.ts'
import { readableLatex } from '../fraction/task.ts'
import { factorize } from '../fraction/factor.ts'
import { newAtoms, polyToExpr, toRat } from '../rearrange/algebra.ts'
import { type RearrangeWrong, rearrangeWrongAnswers } from '../rearrange/errorRules.ts'
import { type RearrangeStep, type Side, type StepKind, hasTargetRoot, isNegative, negated, solveEquation, stepLabel } from '../rearrange/isolate.ts'
import { type RearrangeTask, conditionsText, taskLatex } from '../rearrange/task.ts'
import { type Rng, createRng } from '../random/rng.ts'
import { ratSign } from '../rational.ts'
import { generateRearrangeTask } from '../tasks/rearrangeTerms.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'
import type { Choice, GuidedStep, GuidedTask } from './types.ts'

// Schrittplaner fürs Umstellen im geführten Modus: macht aus dem Rechenweg der Umstell-Engine
// (rearrange/isolate.ts) die Bildschirm-Schritte. Je Umformung zwei Fragen:
// - „Was machst du als Nächstes?", gefragt nach dem Ziel (z. B. „Wie wirst du $+c$ los?"). Die
//   falschen Antworten sind Umformungen, die dieses Ziel nicht erreichen (rearrangeTexts.ts).
// - „Was kommt heraus?": die Gleichung nach der Umformung. Die falschen Antworten kommen aus den
//   typischen Fehlern (rearrange/errorRules.ts); ohne passenden Fehler entfällt die Frage, die
//   Gleichung steht dann gleich unter „Bisher".
// Ab Stufe 3 kommt „Was machst du als Nächstes?" nur noch an den Weichen (Nenner beseitigen,
// sortieren, ausklammern, quadrieren, zusammenfassen vor dem Kehrwert).

const MAX_WRONG_CHOICES = 3
const ALL_MOVES_UNTIL_LEVEL = 2

export function planRearrangeTask(ref: TaskRef, focus?: string): GuidedTask {
  return planRearrange(generateRearrangeTask(ref).task, ref, focus)
}

const sideName = (side: Side) => (side === 'lhs' ? 'linken' : 'rechten')
const other = (side: Side): Side => (side === 'lhs' ? 'rhs' : 'lhs')
const equationLatex = (e: Equation) => readableLatex(equationToLatex(e))

export function planRearrange(task: RearrangeTask, ref: TaskRef, focus?: string): GuidedTask {
  const t = task.target
  const solution = solveEquation(task.equation, t)
  if (!solution) throw new Error(`Die Aufgabe ${taskLatex(task)} lässt sich nicht nach ${t} auflösen`)
  const wrongs = rearrangeWrongAnswers(task, solution)
  const steps: GuidedStep[] = []
  // Zeilen für „Bisher", die noch an keinem Bildschirm-Schritt hängen
  let pending: string[] = []
  const push = (step: GuidedStep) => {
    steps.push(pending.length > 0 ? { ...step, established: [...pending, ...(step.established ?? [])] } : step)
    pending = []
  }

  solution.steps.forEach((step, i) => {
    const after = equationLatex(step.after)
    const rng = createRng(`umstellen-geführt:${ref.level}:${ref.seed}:${i}`)
    const resultWrongs = wrongs.filter((w) => w.stepIndex === i)
    const move = ref.level <= ALL_MOVES_UNTIL_LEVEL || isJunction(step, t) ? moveQuestion(step, t) : null
    if (move) {
      push(moveStep(step, solution.steps[i - 1], move, t, steps.length, rng, resultWrongs.length === 0 ? [after] : []))
    }
    if (resultWrongs.length > 0) {
      push(resultStep(step, solution.steps[i - 1], resultWrongs, t, steps.length, rng, focus))
    } else if (!move) {
      // nur Seiten getauscht oder ohne typischen Fehler: steht gleich unter „Bisher"
      const last = steps.at(-1)
      if (last) steps[steps.length - 1] = { ...last, established: [...(last.established ?? []), after] }
      else pending.push(after)
    }
  })

  const result = solution.result
  return {
    ref,
    expr: sub(task.equation.lhs, task.equation.rhs),
    functionLatex: taskLatex(task),
    instruction: `Löse nach $${t}$ auf`,
    note: conditionsText(task),
    answerLabel: t,
    steps,
    ruleHint: rearrangeTaskHint(t, solution.steps.some((s) => s.kind === 'collect' || s.kind === 'expand')),
    result,
    resultLatex: `${t} = ${toLatex(result)}`,
    ...resultNote(result),
    cards: [...new Set(steps.flatMap((s) => s.cards))],
  }
}

// --- Weichen: Schritte, bei denen man wissen muss, was als Nächstes kommt ---

function isJunction(step: RearrangeStep, t: string): boolean {
  switch (step.kind) {
    case 'collect':
    case 'factor':
    case 'combine':
    case 'square':
      return true
    case 'multiply':
      return !step.side || contains(denominatorOf(step) ?? step.operand!, t)
    default:
      return false
  }
}

// Die Unbekannte als LaTeX: √x, wenn sie in der Gleichung vorkommt (dann wird √x sortiert und
// ausgeklammert, wie in stepLabel), sonst x
const unknownOf = (step: RearrangeStep, t: string) => (hasTargetRoot(step.after, t) ? `\\sqrt{${t}}` : t)

// Nenner, der beim Malnehmen beseitigt wird (beim Schälen)
function denominatorOf(step: RearrangeStep): Expr | null {
  if (!step.side) return null
  const s = step.before[step.side]
  return s.kind === 'div' ? s.den : null
}

// --- Was machst du als Nächstes? ---

type MoveQuestion = { readonly question: string; readonly wrong: readonly WrongMove[]; readonly hint: string }

function moveQuestion(step: RearrangeStep, t: string): MoveQuestion | null {
  const side = step.side
  switch (step.kind) {
    case 'add': {
      if (!side || !step.operand) return null
      const removed = negated(step.operand)
      const removedText = isNegative(removed) ? signed(negated(removed), true) : signed(removed, false)
      const operandText = isNegative(step.operand) ? signed(negated(step.operand), true) : signed(step.operand, false)
      const divisor = removed.kind === 'add' ? null : isNegative(removed) ? negated(removed) : removed
      return {
        question: `Wie wirst du ${removedText} auf der ${sideName(side)} Seite los?`,
        wrong: addMoves(removedText, operandText, side, divisor),
        hint: REARRANGE_HINTS.add,
      }
    }
    case 'move':
      if (!side || !step.operand) return null
      return { question: `Wie wirst du das Minus vor $${toLatex(step.operand)}$ los?`, wrong: moveMoves(step.operand, side), hint: REARRANGE_HINTS.move }
    case 'divide': {
      if (!step.operand) return null
      const question = step.after.lhs.kind === 'var' || step.after.rhs.kind === 'var' ? `Wie bekommst du $${t}$ allein?` : `Wie wirst du den Faktor $${toLatex(step.operand)}$ los?`
      return { question, wrong: divideMoves(step.operand, side ?? null), hint: REARRANGE_HINTS.divide }
    }
    case 'multiply': {
      if (!step.operand) return null
      const den = denominatorOf(step)
      if (!side || !den) {
        const fractions = [step.before.lhs, step.before.rhs].flatMap((e) => subterms(e)).filter((e) => e.kind === 'div')
        const cancelInside = fractions.some((f) => f.kind === 'div' && contains(f.num, t) && contains(f.den, t))
        return {
          question: fractions.length > 1 ? 'Wie wirst du die Brüche los?' : 'Wie wirst du den Bruch los?',
          wrong: multiplyMoves(step.operand, null, cancelInside),
          hint: REARRANGE_HINTS.clear,
        }
      }
      const inDenominator = contains(den, t)
      return {
        question: inDenominator ? `Wie holst du $${t}$ aus dem Nenner?` : `Wie wirst du den Nenner $${toLatex(den)}$ los?`,
        wrong: multiplyMoves(den, side, false),
        hint: inDenominator ? REARRANGE_HINTS.denominator : REARRANGE_HINTS.multiply,
      }
    }
    case 'negate':
      return side ? { question: `Wie wirst du das Minus vor $${t}$ los?`, wrong: negateMoves(side), hint: REARRANGE_HINTS.negate } : null
    case 'reciprocal':
      return side ? { question: `Wie holst du $${t}$ aus dem Nenner?`, wrong: reciprocalMoves(t, side), hint: REARRANGE_HINTS.reciprocal } : null
    case 'combine':
      return side ? { question: `Bevor du den Kehrwert nimmst: Was machst du mit der ${sideName(other(side))} Seite?`, wrong: COMBINE_MOVES, hint: REARRANGE_HINTS.combine } : null
    case 'expand':
      return { question: 'Was machst du mit den Klammern?', wrong: EXPAND_MOVES, hint: REARRANGE_HINTS.expand }
    case 'collect': {
      const u = unknownOf(step, t)
      const question = u === t ? `$${t}$ steht in mehreren Summanden. Was machst du zuerst?` : `Wie bekommst du den Summanden mit $${u}$ allein auf eine Seite?`
      return { question, wrong: collectMoves(t, u), hint: REARRANGE_HINTS.collect }
    }
    case 'factor': {
      const u = unknownOf(step, t)
      return { question: `Wie machst du aus den Summanden mit $${u}$ einen einzigen Faktor $${u}$?`, wrong: factorMoves(u), hint: REARRANGE_HINTS.factor }
    }
    case 'square':
      return { question: 'Wie wirst du die Wurzel los?', wrong: SQUARE_MOVES, hint: REARRANGE_HINTS.square }
    case 'root':
      return { question: 'Wie wirst du das Quadrat los?', wrong: ROOT_MOVES, hint: REARRANGE_HINTS.root }
    case 'finish':
      return null
  }
}

function moveStep(step: RearrangeStep, previous: RearrangeStep | undefined, q: MoveQuestion, t: string, index: number, rng: Rng, established: string[]): GuidedStep {
  const label = stepLabel(step, t)
  const correct: Choice = { id: 'richtig', content: label, correct: true }
  const wrong = rng.shuffle([...q.wrong]).slice(0, MAX_WRONG_CHOICES).map(
    (w, i): Choice => ({ id: `falsch-${i + 1}`, content: w.label, correct: false, whyWrong: w.why }),
  )
  return {
    id: `${index + 1}-${step.kind}-plan`,
    title: 'Was machst du als Nächstes?',
    question: q.question,
    choices: rng.shuffle([correct, ...wrong]),
    hint: q.hint,
    explanation: explainMove(step.kind, label, t, unknownOf(step, t)),
    established,
    cards: cardsOf(step, t, previous),
  }
}

// --- Was kommt heraus? ---

function resultStep(step: RearrangeStep, previous: RearrangeStep | undefined, wrongs: readonly RearrangeWrong[], t: string, index: number, rng: Rng, focus?: string): GuidedStep {
  const after = equationLatex(step.after)
  const correct: Choice = { id: 'richtig', content: `$${after}$`, correct: true }
  const wrong = pickWrong(wrongs, after, rng, focus).map(
    (w, i): Choice => ({
      id: `falsch-${i + 1}`,
      content: `$${equationLatex(w.after)}$`,
      correct: false,
      errorRuleId: w.rule.id,
      whyWrong: whyWrong(w.rule.id),
    }),
  )
  const finish = step.kind === 'finish'
  return {
    id: `${index + 1}-${step.kind}`,
    title: finish ? 'Zusammenfassen' : stepLabel(step, t),
    question: finish ? `Fasse zu einem Bruch zusammen: Was ist $${t}$?` : 'Was kommt heraus?',
    choices: rng.shuffle([correct, ...wrong]),
    hint: finish ? REARRANGE_HINTS.finish : REARRANGE_HINTS.result,
    explanation: explainResult(step.kind, equationLatex(step.before), after),
    established: [after],
    cards: cardsOf(step, t, previous),
  }
}

const whyWrong = (id: string): Explanation => (id.startsWith('frac-') ? explainFractionError(id) : explainRearrangeError(id))

// Bis zu MAX_WRONG_CHOICES falsche Antworten, möglichst aus verschiedenen Fehlern, jede anders
// geschrieben als die richtige und die übrigen. Gezieltes Üben: der gesuchte Fehler zuerst.
function pickWrong(candidates: readonly RearrangeWrong[], correct: string, rng: Rng, focus?: string): RearrangeWrong[] {
  const seen = new Set([correct])
  const unique = candidates.filter((c) => {
    const latex = equationLatex(c.after)
    if (seen.has(latex)) return false
    seen.add(latex)
    return true
  })
  const byRule = new Map<string, RearrangeWrong>()
  for (const c of unique) if (!byRule.has(c.rule.id)) byRule.set(c.rule.id, c)
  const distinct = rng.shuffle([...byRule.values()])
  const rest = rng.shuffle(unique.filter((c) => !distinct.includes(c)))
  const ordered = [...distinct, ...rest]
  const focused = ordered.findIndex((c) => c.rule.id === focus)
  if (focused > 0) ordered.unshift(...ordered.splice(focused, 1))
  return ordered.slice(0, MAX_WRONG_CHOICES)
}

// --- Lernkarten je Schritt ---

const CARDS_BY_KIND: Record<StepKind, readonly string[]> = {
  add: [REARRANGE_CARD_IDS.move],
  move: [REARRANGE_CARD_IDS.move],
  divide: [REARRANGE_CARD_IDS.inverse],
  multiply: [REARRANGE_CARD_IDS.inverse],
  negate: [REARRANGE_CARD_IDS.inverse],
  reciprocal: [REARRANGE_CARD_IDS.reciprocal],
  combine: [REARRANGE_CARD_IDS.reciprocal, FRACTION_CARD_IDS.add],
  expand: [REARRANGE_CARD_IDS.collect],
  collect: [REARRANGE_CARD_IDS.collect],
  factor: [REARRANGE_CARD_IDS.collect],
  square: [REARRANGE_CARD_IDS.root],
  root: [REARRANGE_CARD_IDS.root],
  finish: [FRACTION_CARD_IDS.add, FRACTION_CARD_IDS.expand],
}

// previous: der Schritt davor (Teilen nach dem Ausklammern gehört zur Karte „Variable mehrfach")
function cardsOf(step: RearrangeStep, t: string, previous: RearrangeStep | undefined): string[] {
  if (step.kind === 'multiply') {
    const den = denominatorOf(step)
    // alle Nenner beseitigen bzw. Variable im Nenner
    if (!den) return [REARRANGE_CARD_IDS.clear]
    if (contains(den, t)) return [REARRANGE_CARD_IDS.denominator]
  }
  if ((step.kind === 'divide' || step.kind === 'negate') && (previous?.kind === 'factor' || previous?.kind === 'collect')) return [REARRANGE_CARD_IDS.collect]
  return [...CARDS_BY_KIND[step.kind]]
}

// --- Ergebnis ---

// „Gilt für $y \neq 2$.": Faktoren des Nenners, die für positive Buchstaben 0 werden können
function resultNote(result: Expr): { resultNote?: string } {
  if (result.kind !== 'div' && !(result.kind === 'neg' && result.arg.kind === 'div')) return {}
  const atoms = newAtoms('')
  const f = toRat(result, atoms)
  if (!f || f.den.some((term) => term.mono.some(([atom]) => atom.startsWith('~')))) return {}
  const parts: string[] = []
  for (const factor of factorize(f.den).factors) {
    const p = factor.poly
    const positive = p.filter((term) => ratSign(term.coef) > 0)
    const negative = p.filter((term) => ratSign(term.coef) < 0)
    if (positive.length === 0 || negative.length === 0) continue
    if (p.length === 2) {
      const [pos] = positive
      const [neg] = negative
      parts.push(`$${toLatex(polyToExpr([pos], atoms))} \\neq ${toLatex(polyToExpr([{ ...neg, coef: { n: -neg.coef.n, d: neg.coef.d } }], atoms))}$`)
    } else parts.push(`$${toLatex(polyToExpr(p, atoms))} \\neq 0$`)
  }
  if (parts.length === 0) return {}
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} und ${parts.at(-1)}`
  return { resultNote: `Gilt für ${list}.` }
}

