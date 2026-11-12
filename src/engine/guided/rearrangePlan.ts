import { FRACTION_CARD_IDS } from '../explain/fractionCards.ts'
import { explainFractionError } from '../explain/fractionTexts.ts'
import { REARRANGE_CARD_IDS } from '../explain/rearrangeCards.ts'
import {
  COMBINE_BEFORE_LOG_MOVES,
  COMBINE_BEFORE_MULTIPLY_MOVES,
  COMBINE_BEFORE_ROOT_MOVES,
  COMBINE_BEFORE_SQUARE_MOVES,
  COMBINE_MOVES,
  EXPAND_MOVES,
  EXTEND_MOVES,
  LOG_COMBINE_MOVES,
  LOG_LAW_MOVES,
  LOG_BASE_MOVES,
  LOG_NUMBER_MOVES,
  LOG_POWER_MOVES,
  UNLOG_MOVES,
  POWER_LAW_MOVES,
  REARRANGE_HINTS,
  ROOT_MOVES,
  SQUARE_MOVES,
  type WrongMove,
  addMoves,
  arcMoves,
  collectMoves,
  divideMoves,
  explainMove,
  explainRearrangeError,
  explainResult,
  explainChoose,
  explainOde,
  explainDet,
  explainExpand,
  explainAbs,
  explainArg,
  explainLength,
  explainDot,
  explainAngle,
  explainAcuteFinish,
  explainAddition,
  theoremErrorText,
  explainDouble,
  explainAcuteMove,
  explainAcutePythagoras,
  acutePythagorasMoves,
  expMoves,
  factorMoves,
  logMoves,
  moveMoves,
  multiplyMoves,
  negateMoves,
  normalizeMoves,
  pqMoves,
  pythagorasMoves,
  reciprocalMoves,
  rearrangeTaskHint,
  type TaskTool,
  resubstituteMoves,
  signed,
  substituteMoves,
  tanQuotientMoves,
  trigMoves,
  zeroMoves,
} from '../explain/rearrangeTexts.ts'
import { type Explanation, explainError } from '../explain/texts.ts'
import { cardIdsFor } from '../explain/cards.ts'
import { allNodes, derive } from '../derive/derive.ts'
import type { RuleId } from '../derive/rules.ts'
import { contains, subterms } from '../expr/compare.ts'
import { FN_LATEX, odeLatex, toLatex } from '../expr/print.ts'
import { type Equation, type Expr, asRational, fn, mul, num, pow, sub } from '../expr/types.ts'
import { readableLatex } from '../fraction/task.ts'
import { factorize } from '../fraction/factor.ts'
import { newAtoms, polyToExpr, toRat } from '../rearrange/algebra.ts'
import { type RearrangeWrong, rearrangeWrongAnswers } from '../rearrange/errorRules.ts'
import {
  ARC_OF,
  type RearrangeStep,
  type Side,
  type StepKind,
  type Substitution,
  TRIG_OF,
  acuteSquare,
  hasTargetRoot,
  isNegative,
  negated,
  solveTask,
  STEP_NAMES,
  stepEquationLatex,
  stepLabel,
} from '../rearrange/isolate.ts'
import { type RearrangeTask, conditionLatex, conditionsText, taskLatex } from '../rearrange/task.ts'
import { detWorkLatex, expandWork } from '../rearrange/tools/determinant.ts'
import { polarWork } from '../rearrange/tools/polar.ts'
import { theoremWork } from '../rearrange/tools/theorem.ts'
import { angleWork, dotWorkLatex, lengthWorkLatex } from '../rearrange/tools/vector.ts'
import { odeWork } from '../rearrange/tools/ode.ts'
import { activeTool } from '../rearrange/tools/tool.ts'
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
// nach der pq-Formel mit beiden Lösungen: u_{1,2} = … \pm …
const stepLatex = (kind: StepKind, e: Equation) => readableLatex(stepEquationLatex(kind, e))

export function planRearrange(task: RearrangeTask, ref: TaskRef, focus?: string): GuidedTask {
  const t = task.target
  const solution = solveTask(task)
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
    const after = stepLatex(step.kind, step.after)
    const rng = createRng(`umstellen-geführt:${ref.level}:${ref.seed}:${i}`)
    const resultWrongs = wrongs.filter((w) => w.stepIndex === i)
    // nach dem Substituieren wird nach u aufgelöst
    const st = step.unknown ?? t
    const move = ref.level <= ALL_MOVES_UNTIL_LEVEL || isJunction(step, st) ? moveQuestion(step, st, t) : null
    if (move) {
      push(moveStep(step, solution.steps[i - 1], move, st, steps.length, rng, resultWrongs.length === 0 ? [after] : []))
    }
    if (resultWrongs.length > 0) {
      push(resultStep(step, solution.steps[i - 1], resultWrongs, st, steps.length, rng, focus, { task, sub: solution.substitution }))
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
    ruleHint: rearrangeTaskHint(
      t,
      solution.steps.some((s) => s.kind === 'collect' || s.kind === 'expand'),
      solution.substitution ? toLatex(solution.substitution.expr) : null,
      solution.steps.some((s) => s.kind === 'pq'),
      TASK_TOOL[solution.steps[0]?.kind ?? 'finish'] ?? null,
    ),
    result,
    resultLatex: readableLatex(`${t} = ${toLatex(result)}`),
    ...resultNote(result),
    cards: [...new Set(steps.flatMap((s) => s.cards))],
  }
}

// Stufe 5: Schritte, die ein Werkzeug ausrechnen (Ableitung, Integral, Summe, Grenzwert). Sie werden nur
// als „Was kommt heraus?" gefragt, der erste als „Was steht da eigentlich?"
const TOOL_KINDS = new Set<StepKind | undefined>([
  'derive',
  'partial',
  'antiderivative',
  'bounds',
  'sumFormula',
  'series',
  'limit',
  'ode',
  'det',
  'detExpand',
  'abs',
  'arg',
  'length',
  'dot',
  'angle',
  'addition',
  'doubleAngle',
])

const TOOL_QUESTIONS: Partial<Record<StepKind, string>> = {
  derive: 'Rechne die Ableitung aus: Was kommt heraus?',
  partial: 'Zerlege den Bruch im Integral in Partialbrüche: Was kommt heraus?',
  antiderivative: 'Welche Stammfunktion gehört zum Integranden?',
  bounds: 'Setze die Grenzen ein: Was kommt heraus?',
  sumFormula: 'Rechne die Summe mit der Formel der geometrischen Summe aus: Was kommt heraus?',
  series: 'Rechne die Reihe aus: Was kommt heraus?',
  limit: 'Rechne den Grenzwert aus: Was kommt heraus?',
  ode: 'Löse die Differentialgleichung mit den Anfangswerten: Was kommt heraus?',
  det: 'Rechne die Determinante aus: Was kommt heraus?',
  detExpand: 'Entwickle nach der Zeile oder Spalte mit zwei Nullen: Was kommt heraus?',
  abs: 'Rechne den Betrag aus: Was kommt heraus?',
  arg: 'Rechne den Winkel aus: Was kommt heraus?',
  length: 'Rechne die Länge des Vektors aus: Was kommt heraus?',
  dot: 'Rechne das Skalarprodukt aus: Was kommt heraus?',
  angle: 'Rechne den Winkel zwischen den Vektoren aus: Was kommt heraus?',
  addition: 'Wende das Additionstheorem an: Was kommt heraus?',
  doubleAngle: 'Schreibe mit dem einfachen Winkel: Was kommt heraus?',
}

// Tipp zur ganzen Aufgabe nach dem ersten Werkzeug-Schritt
const TASK_TOOL: Partial<Record<StepKind, TaskTool>> = {
  derive: 'derivative',
  partial: 'integral',
  antiderivative: 'integral',
  bounds: 'integral',
  sumFormula: 'series',
  series: 'series',
  limit: 'limit',
  ode: 'ode',
  det: 'det',
  detExpand: 'det',
  abs: 'complex',
  arg: 'complex',
  length: 'vector',
  dot: 'vector',
  angle: 'vector',
  addition: 'theorem',
  doubleAngle: 'double',
}

// --- Weichen: Schritte, bei denen man wissen muss, was als Nächstes kommt ---

function isJunction(step: RearrangeStep, t: string): boolean {
  switch (step.kind) {
    case 'collect':
    case 'factor':
    case 'combine':
    case 'extend':
    case 'square':
    case 'exp':
    case 'log':
    case 'logCombine':
    case 'logLaw':
    case 'logBase':
    case 'logPower':
    case 'logNumber':
    case 'unlog':
    case 'powerLaw':
    case 'arc':
    case 'trig':
    case 'pythagoras':
    case 'tanQuotient':
    case 'substitute':
    case 'zero':
    case 'normalize':
    case 'pq':
    case 'resubstitute':
      return true
    case 'multiply':
      return !step.side || contains(denominatorOf(step) ?? step.operand!, t)
    default:
      return false
  }
}

// Die Unbekannte als LaTeX: √x, wenn sie in der Gleichung vorkommt (dann wird √x sortiert und
// ausgeklammert, wie in stepLabel), beim Sortieren mit einer Wurzel wie √(x − a) diese Wurzel, sonst x
const unknownOf = (step: RearrangeStep, t: string) =>
  (step.kind === 'collect' || step.kind === 'factor') && step.operand ? toLatex(step.operand) : hasTargetRoot(step.after, t) ? `\\sqrt{${t}}` : t

// Zusammenfassen vor dem Kehrwert (\frac{1}{x} = …) oder vor dem Malnehmen mit dem Nenner (\frac{b}{x - a} = …)
function combinesBeforeReciprocal(step: RearrangeStep): boolean {
  const s = step.side ? step.before[step.side] : null
  return s !== null && s.kind === 'div' && s.num.kind === 'num' && ratSign(s.num.value) > 0 && s.num.value.n === s.num.value.d
}

// Wozu wird zusammengefasst? Vor dem Kehrwert, dem Malnehmen mit dem Nenner, dem Wurzelziehen, dem
// Quadrieren oder dem Logarithmieren
type CombineContext = 'reciprocal' | 'multiply' | 'root' | 'square' | 'log'

function combineContext(step: RearrangeStep): CombineContext {
  const s = step.side ? step.before[step.side] : null
  if (s?.kind === 'pow') return asRational(s.exp) ? 'root' : 'log'
  if (s?.kind === 'root') return 'square'
  return combinesBeforeReciprocal(step) ? 'reciprocal' : 'multiply'
}

const COMBINE_EXPLANATION: Record<CombineContext, string> = {
  reciprocal: 'combine',
  multiply: 'combine-multiply',
  root: 'combine-root',
  square: 'combine-square',
  log: 'combine-log',
}

// Nenner, der beim Malnehmen beseitigt wird (beim Schälen)
function denominatorOf(step: RearrangeStep): Expr | null {
  if (!step.side) return null
  const s = step.before[step.side]
  return s.kind === 'div' ? s.den : null
}

// --- Was machst du als Nächstes? ---

// explanation: eigene Erklärung statt der Erklärung der Schrittart
type MoveQuestion = { readonly question: string; readonly wrong: readonly WrongMove[]; readonly hint: string; readonly explanation?: Explanation }

// t: die Unbekannte des Schritts (nach dem Substituieren u), target: die gesuchte Variable
function moveQuestion(step: RearrangeStep, t: string, target: string): MoveQuestion | null {
  const side = step.side
  switch (step.kind) {
    case 'substitute': {
      const sub = step.substitution
      if (!sub) return null
      const block = toLatex(sub.expr)
      const kind = substitutionKind(sub)
      const inverse = sub.expr.kind === 'fn' && ARC_OF[sub.expr.name] ? FN_LATEX[ARC_OF[sub.expr.name]!] : sub.expr.kind === 'fn' ? '\\exp' : '\\ln'
      return {
        question: `$${target}$ steckt in verschiedenen Potenzen von $${block}$. Was machst du zuerst?`,
        wrong: substituteMoves(block, kind, kind === 'power' || kind === 'trig' ? inverse : null),
        hint: REARRANGE_HINTS.substitute,
      }
    }
    case 'zero':
      return { question: `Die Gleichung ist quadratisch in $${t}$. Was machst du zuerst?`, wrong: zeroMoves(t), hint: REARRANGE_HINTS.zero }
    case 'normalize':
      return step.operand
        ? { question: `Vor $${t}^2$ steht $${toLatex(step.operand)}$. Was machst du vor der $pq$-Formel?`, wrong: normalizeMoves(t, toLatex(step.operand)), hint: REARRANGE_HINTS.normalize }
        : null
    case 'pq':
      return { question: `Die Gleichung hat die Form $${t}^2 + p${t} + q = 0$. Wie geht es weiter?`, wrong: pqMoves(t), hint: REARRANGE_HINTS.pq }
    case 'resubstitute':
      return step.substitution
        ? {
            question: `$${step.substitution.name}$ ist bekannt, gesucht ist aber $${target}$. Wie geht es weiter?`,
            wrong: resubstituteMoves(step.substitution.name, toLatex(step.substitution.expr), target),
            hint: REARRANGE_HINTS.resubstitute,
          }
        : null
    case 'choose':
    case 'derive':
    case 'partial':
    case 'antiderivative':
    case 'bounds':
    case 'sumFormula':
    case 'series':
    case 'limit':
    case 'ode':
    case 'det':
    case 'detExpand':
    case 'abs':
    case 'arg':
    case 'length':
    case 'dot':
    case 'angle':
    case 'addition':
    case 'doubleAngle':
      return null
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
      if (!side) return null
      switch (combineContext(step)) {
        case 'reciprocal':
          return { question: `Bevor du den Kehrwert nimmst: Was machst du mit der ${sideName(other(side))} Seite?`, wrong: COMBINE_MOVES, hint: REARRANGE_HINTS.combine }
        case 'multiply':
          return { question: `Bevor du mit dem Nenner malnimmst: Was machst du mit der ${sideName(other(side))} Seite?`, wrong: COMBINE_BEFORE_MULTIPLY_MOVES, hint: REARRANGE_HINTS.combineBeforeMultiply }
        case 'root':
          return { question: `Bevor du die Wurzel ziehst: Was machst du mit der ${sideName(other(side))} Seite?`, wrong: COMBINE_BEFORE_ROOT_MOVES, hint: REARRANGE_HINTS.combineBeforeRoot }
        case 'square':
          return { question: `Bevor du quadrierst: Was machst du mit der ${sideName(other(side))} Seite?`, wrong: COMBINE_BEFORE_SQUARE_MOVES, hint: REARRANGE_HINTS.combineBeforeSquare }
        case 'log':
          return { question: `Bevor du logarithmierst: Was machst du mit der ${sideName(other(side))} Seite?`, wrong: COMBINE_BEFORE_LOG_MOVES, hint: REARRANGE_HINTS.combineBeforeLog }
      }
    case 'exp': {
      if (!side || !step.operand) return null
      const base = toLatex(step.operand)
      const logLatex = base === 'e' ? '\\ln' : `\\log_{${base}}`
      return { question: `Wie wirst du den $${logLatex}$ los?`, wrong: expMoves(logLatex, base, side), hint: REARRANGE_HINTS.exp }
    }
    case 'log':
      return { question: `Wie holst du $${t}$ aus der Hochzahl?`, wrong: logMoves(side ?? null), hint: REARRANGE_HINTS.log }
    case 'logCombine':
      return { question: `$${t}$ steht in mehreren Logarithmen. Was machst du zuerst?`, wrong: LOG_COMBINE_MOVES, hint: REARRANGE_HINTS.logCombine }
    case 'logLaw':
      return { question: `Wie holst du die Hochzahl mit $${t}$ aus dem $\\ln$ heraus?`, wrong: LOG_LAW_MOVES, hint: REARRANGE_HINTS.logLaw }
    // Logarithmen auf beiden Seiten (M6 Schritt 4b-2)
    case 'logBase':
      return { question: 'Die Logarithmen haben verschiedene Basen. Was machst du zuerst?', wrong: LOG_BASE_MOVES, hint: REARRANGE_HINTS.logBase }
    case 'logPower':
      return { question: 'Vor einem Logarithmus steht ein Faktor. Was machst du mit ihm?', wrong: LOG_POWER_MOVES, hint: REARRANGE_HINTS.logPower }
    case 'logNumber':
      return { question: 'Neben den Logarithmen steht eine Zahl. Was machst du mit ihr?', wrong: LOG_NUMBER_MOVES, hint: REARRANGE_HINTS.logNumber }
    case 'unlog':
      return { question: 'Auf jeder Seite steht ein Logarithmus derselben Basis. Wie geht es weiter?', wrong: UNLOG_MOVES, hint: REARRANGE_HINTS.unlog }
    case 'powerLaw':
      return {
        question: step.operand ? `Wie bekommst du überall dieselbe Potenz $${toLatex(step.operand)}$?` : 'Wie bekommst du überall dieselbe Potenz?',
        wrong: POWER_LAW_MOVES,
        hint: REARRANGE_HINTS.powerLaw,
      }
    case 'arc': {
      // \sin u = w: der \sin soll weg, mit \arcsin
      const original = step.fn && TRIG_OF[step.fn]
      if (!side || !step.fn || !original) return null
      return { question: `Wie wirst du den $${FN_LATEX[original]}$ los?`, wrong: arcMoves(FN_LATEX[original], FN_LATEX[step.fn], side), hint: REARRANGE_HINTS.arc }
    }
    case 'trig': {
      // \arctan u = w: der \arctan soll weg, mit \tan
      const arc = step.fn && ARC_OF[step.fn]
      if (!side || !step.fn || !arc) return null
      return { question: `Wie wirst du den $${FN_LATEX[arc]}$ los?`, wrong: trigMoves(FN_LATEX[arc], FN_LATEX[step.fn], side), hint: REARRANGE_HINTS.trig }
    }
    case 'pythagoras': {
      const square = step.operand
      // spitzer Winkel als Buchstabe (Teil 8b): x^2\left(1 - \cos^2 y\right) = …
      if (square?.kind === 'add') return acuteQuestion(square)
      if (square?.kind !== 'pow' || square.base.kind !== 'fn') return null
      const f = square.base
      const hyperbolic = f.name === 'sinh' || f.name === 'cosh'
      const partnerName = f.name === 'sin' ? 'cos' : f.name === 'cos' ? 'sin' : f.name === 'sinh' ? 'cosh' : 'sinh'
      const partner = toLatex(fn(partnerName, f.arg))
      const partnerSquare = toLatex({ ...square, base: fn(partnerName, f.arg) })
      // der Partner steht im Quadrat (\cos^2 x und \sin^2 x) oder allein (\cos^2 x und \sin x, Schritt 6c)
      const squared = [step.before.lhs, step.before.rhs].flatMap((e) => subterms(e)).some((e) => toLatex(e) === partnerSquare)
      return {
        question: `In der Gleichung stehen $${squared ? partnerSquare : partner}$ und $${toLatex(square)}$. Wie bleibt nur eine Funktion übrig?`,
        wrong: pythagorasMoves(toLatex(square), partner, hyperbolic, !squared),
        hint: REARRANGE_HINTS.pythagoras,
      }
    }
    case 'tanQuotient': {
      const cos = step.operand
      if (cos?.kind !== 'fn') return null
      const hyperbolic = cos.name === 'cosh'
      const sin = toLatex(fn(hyperbolic ? 'sinh' : 'sin', cos.arg))
      const tan = toLatex(fn(hyperbolic ? 'tanh' : 'tan', cos.arg))
      const where = side ? 'Im Zähler und Nenner' : 'In der Gleichung'
      return {
        question: `${where} stehen $${sin}$ und $${toLatex(cos)}$. Wie bleibt nur eine Funktion übrig?`,
        wrong: tanQuotientMoves(sin, toLatex(cos), tan, side !== undefined),
        hint: REARRANGE_HINTS.tanQuotient,
      }
    }
    case 'expand':
      return { question: 'Was machst du mit den Klammern?', wrong: EXPAND_MOVES, hint: REARRANGE_HINTS.expand }
    case 'extend':
      return { question: 'Wie wirst du die Brüche im Bruch los?', wrong: EXTEND_MOVES, hint: REARRANGE_HINTS.extend }
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

// Spitzer Winkel als Buchstabe (Teil 8b): In der Klammer steht c\left(1 - \cos^2 y\right), richtig ist c\sin^2 y;
// Irrwege: c\sin y (Quadrat vergessen), c(1 - \cos y)^2 (binomische Formel), wieder ausmultiplizieren
function acuteQuestion(sum: Expr): MoveQuestion | null {
  const replaced = acuteSquare(sum)
  if (!replaced) return null
  const parts = replaced.kind === 'mul' ? replaced.factors : [replaced]
  const square = parts.at(-1)
  const f = subterms(sum).find((s) => s.kind === 'fn')
  if (square?.kind !== 'pow' || !f) return null
  const front = parts.slice(0, -1)
  return {
    question: `In der Klammer steht $${toLatex(sum)}$. Wie schreibst du das einfacher?`,
    wrong: acutePythagorasMoves(toLatex(sum), toLatex(mul(...front, square.base)), toLatex(mul(...front, pow(sub(num(1), f), num(2))))),
    hint: REARRANGE_HINTS.acutePythagoras,
    explanation: explainAcuteMove(toLatex(sum), toLatex(replaced)),
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
    // beim Zurück-Einsetzen ist der Platzhalter u (aus dem Schritt davor), nicht x
    explanation:
      q.explanation ??
      explainMove(step.kind === 'combine' ? COMBINE_EXPLANATION[combineContext(step)] : step.kind, label, t, step.kind === 'resubstitute' ? (previous?.unknown ?? 'u') : unknownOf(step, t)),
    established,
    cards: cardsOf(step, t, previous),
  }
}

// Art des Bausteins einer Substitution (für die Irrwege)
function substitutionKind(sub: Substitution): 'power' | 'root' | 'trig' | 'ln' | 'square' {
  const e = sub.expr
  if (e.kind === 'root') return 'root'
  if (e.kind === 'fn') return e.name === 'ln' ? 'ln' : 'trig'
  if (e.kind === 'pow' && e.base.kind === 'var') return 'square'
  return 'power'
}

// Warum die andere Lösung der pq-Formel wegfällt, als Satz
function rejectReason(step: RearrangeStep, t: string, context: ResultContext): string {
  const sub = context.sub
  const bound = context.task.conditions.map((c) => `$${conditionLatex(c)}$`).join(' und ')
  if (step.reason === 'negative') {
    if (!sub || sub.name !== t) return `Sie ist negativ, $${t}$ ist aber positiv wie alle Buchstaben.`
    const block = toLatex(sub.expr)
    switch (substitutionKind(sub)) {
      case 'power':
        return `Sie ist negativ, $${t} = ${block}$ ist aber immer positiv.`
      case 'root':
      case 'square':
        return `Sie ist negativ, $${t} = ${block}$ ist aber nie negativ.`
      default:
        return `Sie ist negativ, $${t} = ${block}$ ist aber positiv, weil $${context.task.target}$ positiv ist${bound ? ` und ${bound} gilt` : ''}.`
    }
  }
  if (step.reason === 'targetNegative') return `Mit ihr wäre $${context.task.target}$ negativ, alle Buchstaben sind aber positiv.`
  return bound ? `Mit ihr gilt ${bound} nicht.` : `Sie erfüllt die Gleichung der Aufgabe nicht.`
}

// --- Was kommt heraus? ---

// Tipps zu „Was kommt heraus?" bei Schritten mit eigener Regel
const RESULT_HINTS: Partial<Record<StepKind, string>> = {
  substitute: REARRANGE_HINTS.substitute,
  zero: 'Was die Seite wechselt, wechselt das Vorzeichen; rechts bleibt $0$.',
  normalize: 'Teile jeden Summanden durch die Zahl vor dem Quadrat.',
  pq: REARRANGE_HINTS.pq,
  choose: REARRANGE_HINTS.choose,
  resubstitute: REARRANGE_HINTS.resubstitute,
  derive: REARRANGE_HINTS.derive,
  partial: REARRANGE_HINTS.partial,
  antiderivative: REARRANGE_HINTS.antiderivative,
  bounds: REARRANGE_HINTS.bounds,
  sumFormula: REARRANGE_HINTS.sumFormula,
  series: REARRANGE_HINTS.series,
  limit: REARRANGE_HINTS.limit,
  ode: REARRANGE_HINTS.ode,
  det: REARRANGE_HINTS.det,
  detExpand: REARRANGE_HINTS.detExpand,
  abs: REARRANGE_HINTS.abs,
  arg: REARRANGE_HINTS.arg,
  length: REARRANGE_HINTS.length,
  dot: REARRANGE_HINTS.dot,
  angle: REARRANGE_HINTS.angle,
}

const spuriousWhy = (reason: string): Explanation => ({ detailed: `Diese Lösung ist eine Scheinlösung. ${reason}`, short: reason })

type ResultContext = { readonly task: RearrangeTask; readonly sub: Substitution | undefined }

function resultStep(
  step: RearrangeStep,
  previous: RearrangeStep | undefined,
  wrongs: readonly RearrangeWrong[],
  t: string,
  index: number,
  rng: Rng,
  focus: string | undefined,
  context: ResultContext,
): GuidedStep {
  const after = stepLatex(step.kind, step.after)
  const correct: Choice = { id: 'richtig', content: `$${after}$`, correct: true }
  const wrong = pickWrong(wrongs, after, rng, focus, step.kind).map(
    (w, i): Choice => ({
      id: `falsch-${i + 1}`,
      content: `$${stepLatex(step.kind, w.after)}$`,
      correct: false,
      errorRuleId: w.rule.id,
      // die Scheinlösung mit dem Grund dieser Aufgabe; beim Ableiten der Text aus „Ableiten"
      whyWrong: w.derive
        ? explainError(w.derive)
        : w.rule.id === 'eq-spurious-root' && step.kind === 'choose'
          ? spuriousWhy(rejectReason(step, t, context))
          : (theoremWhy(step, w.rule.id) ?? whyWrong(w.rule.id)),
    }),
  )
  const finish = step.kind === 'finish'
  // spitzer Winkel als Buchstabe (Teil 8b): Ergebnis mit \tan y
  const tan = finish && step.operand ? toLatex(step.operand) : null
  const choose = step.kind === 'choose'
  // das erste Werkzeug: „Was steht da eigentlich?"
  const tool = TOOL_QUESTIONS[step.kind]
  const firstTool = tool !== undefined && !TOOL_KINDS.has(previous?.kind)
  return {
    id: `${index + 1}-${step.kind}`,
    title: finish ? 'Zusammenfassen' : choose ? STEP_NAMES.choose : firstTool ? 'Was steht da eigentlich?' : stepLabel(step, t),
    question: finish
      ? tan
        ? `Schreibe mit $${tan}$: Was ist $${t}$?`
        : `Fasse zu einem Bruch zusammen: Was ist $${t}$?`
      : choose
        ? 'Welche der beiden Lösungen passt?'
        : (odeQuestion(step) ?? theoremQuestion(step) ?? tool ?? 'Was kommt heraus?'),
    choices: rng.shuffle([correct, ...wrong]),
    hint: finish
      ? tan
        ? REARRANGE_HINTS.acuteFinish
        : REARRANGE_HINTS.finish
      : step.kind === 'pythagoras' && step.operand?.kind === 'add'
        ? REARRANGE_HINTS.acutePythagoras
        : (polarHint(step) ?? theoremHint(step) ?? RESULT_HINTS[step.kind] ?? REARRANGE_HINTS.result),
    explanation:
      choose && step.operand
        ? explainChoose(toLatex(step.operand), rejectReason(step, t, context), after)
        : (odeExplanation(step) ?? detExplanation(step) ?? polarExplanation(step) ?? theoremExplanation(step) ?? acuteExplanation(step) ?? explainResult(step.kind, stepLatex(step.kind, step.before), after)),
    established: [after],
    cards: cardsOf(step, t, previous),
  }
}

// Spitzer Winkel als Buchstabe (Teil 8b): 1 - \cos^2 y = \sin^2 y einsetzen, Ergebnis mit \tan y
function acuteExplanation(step: RearrangeStep): Explanation | null {
  const acute = (step.kind === 'pythagoras' && step.operand?.kind === 'add') || (step.kind === 'finish' && step.operand !== undefined)
  if (!acute) return null
  const before = stepLatex(step.kind, step.before)
  const after = stepLatex(step.kind, step.after)
  return step.kind === 'finish' ? explainAcuteFinish(before, after) : explainAcutePythagoras(before, after)
}

// Determinante: die Produkte mit Malpunkt bzw. Linie, Eintrag und Vorzeichen beim Entwickeln
function detExplanation(step: RearrangeStep): Explanation | null {
  if (step.kind !== 'det' && step.kind !== 'detExpand') return null
  const tool = activeTool(step.before)?.tool.tool
  if (tool?.kind !== 'det') return null
  const before = stepLatex(step.kind, step.before)
  const after = stepLatex(step.kind, step.after)
  if (step.kind === 'det') {
    const work = detWorkLatex(tool)
    return work ? explainDet(work, before, after) : null
  }
  const work = expandWork(tool)
  return work ? explainExpand(work.line, work.entry, work.sign, before, after) : null
}

// Betrag in Euler-Form (e^{\mathrm{i}x} = \cos x + \mathrm{i}\sin x) und Winkel eines Produkts mit x in beiden Faktoren
// (erst ausmultiplizieren): eigene Tipps
function polarHint(step: RearrangeStep): string | null {
  if (step.kind !== 'abs' && step.kind !== 'arg') return null
  const tool = activeTool(step.before)?.tool.tool
  if (!tool || tool.kind !== step.kind) return null
  const work = polarWork(tool)
  if (tool.kind === 'abs' && work?.euler) return REARRANGE_HINTS.absEuler
  if (tool.kind === 'arg' && work?.multiplied) return REARRANGE_HINTS.argMultiplied
  return null
}

// Betrag und Winkel komplexer Zahlen, Vektoren (Teil 8b): Real- und Imaginärteil, Quadrate, Produkte der Einträge
function polarExplanation(step: RearrangeStep): Explanation | null {
  const tool = activeTool(step.before)?.tool.tool
  if (!tool || tool.kind !== step.kind) return null
  const before = stepLatex(step.kind, step.before)
  const after = stepLatex(step.kind, step.after)
  switch (tool.kind) {
    case 'abs':
    case 'arg': {
      const work = polarWork(tool)
      return work && (tool.kind === 'abs' ? explainAbs(work, before, after) : explainArg(work, before, after))
    }
    case 'length':
      return explainLength(lengthWorkLatex(tool.vector), before, after)
    case 'dot':
      return explainDot(dotWorkLatex(tool.left, tool.right), before, after)
    case 'angle': {
      const work = angleWork(tool)
      return work && explainAngle(work, before, after)
    }
    default:
      return null
  }
}

// Additionstheorem (Teil 8c): die Frage nennt die Funktion. Beim doppelten Winkel nennt sie nicht die Funktion, die
// danach allein dastehen soll: Sonst schiede „nur \sin x" zwei falsche Antworten (2\cos x, \cos^2 x + \sin^2 x) ohne
// jedes Wissen aus. Unter den Antworten steht ohnehin nur eine der gleichwertigen Formen; warum diese, sagt die Erklärung.
function theoremTool(step: RearrangeStep) {
  if (step.kind !== 'addition' && step.kind !== 'doubleAngle') return null
  const tool = activeTool(step.before)?.tool.tool
  return tool?.kind === 'theorem' ? tool : null
}

function theoremQuestion(step: RearrangeStep): string | null {
  const tool = theoremTool(step)
  const work = tool && theoremWork(tool, step.before)
  if (!work) return null
  if (work.kind === 'addition') return `Schreibe $${work.term}$ mit dem Additionstheorem aus: Was kommt heraus?`
  return `Schreibe $${work.term}$ mit dem einfachen Winkel: Was kommt heraus?`
}

// „Warum ist das falsch?" beim Additionstheorem mit der Regel genau dieser Funktion und dieses Vorzeichens
function theoremWhy(step: RearrangeStep, id: string): Explanation | null {
  const tool = theoremTool(step)
  const work = tool && theoremWork(tool, step.before)
  return work?.kind === 'addition' ? theoremErrorText(id, work.rule) : null
}

function theoremHint(step: RearrangeStep): string | null {
  const tool = theoremTool(step)
  const work = tool && theoremWork(tool, step.before)
  if (!work) return null
  if (work.kind === 'addition') return work.name === 'sin' ? REARRANGE_HINTS.additionSin : work.name === 'cos' ? REARRANGE_HINTS.additionCos : REARRANGE_HINTS.additionTan
  return work.name === 'cos' ? REARRANGE_HINTS.doubleCos : work.name === 'tan' ? REARRANGE_HINTS.doubleTan : REARRANGE_HINTS.doubleSin
}

function theoremExplanation(step: RearrangeStep): Explanation | null {
  const tool = theoremTool(step)
  const work = tool && theoremWork(tool, step.before)
  if (!work) return null
  const before = stepLatex(step.kind, step.before)
  const after = stepLatex(step.kind, step.after)
  return work.kind === 'addition' ? explainAddition(work.rule, work.alpha, work.beta, before, after) : explainDouble(work.name, work.form, work.alpha, work.other, before, after)
}

// Differentialgleichung: die Frage nennt die Funktion (bei f und g in einer Aufgabe wichtig)
function odeQuestion(step: RearrangeStep): string | null {
  if (step.kind !== 'ode') return null
  const tool = activeTool(step.before)?.tool.tool
  return tool?.kind === 'ode' ? `Löse die Differentialgleichung für $${tool.v}$ mit den Anfangswerten: Was kommt heraus?` : null
}

// Differentialgleichung: Ansatz und Konstanten aus den Anfangswerten
function odeExplanation(step: RearrangeStep): Explanation | null {
  if (step.kind !== 'ode') return null
  const tool = activeTool(step.before)?.tool.tool
  const work = tool?.kind === 'ode' ? odeWork(tool) : null
  return tool?.kind === 'ode' && work
    ? explainOde(odeLatex(tool), work.approach, work.constants, stepLatex(step.kind, step.before), stepLatex(step.kind, step.after), work.lambda)
    : null
}

const whyWrong = (id: string): Explanation => (id.startsWith('frac-') ? explainFractionError(id) : explainRearrangeError(id))

// Bis zu MAX_WRONG_CHOICES falsche Antworten, möglichst aus verschiedenen Fehlern, jede anders
// geschrieben als die richtige und die übrigen. Gezieltes Üben: der gesuchte Fehler zuerst.
function pickWrong(candidates: readonly RearrangeWrong[], correct: string, rng: Rng, focus: string | undefined, kind: StepKind): RearrangeWrong[] {
  const seen = new Set([correct])
  const unique = candidates.filter((c) => {
    const latex = stepLatex(kind, c.after)
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
  extend: [FRACTION_CARD_IDS.complex],
  expand: [REARRANGE_CARD_IDS.collect],
  collect: [REARRANGE_CARD_IDS.collect],
  factor: [REARRANGE_CARD_IDS.collect],
  square: [REARRANGE_CARD_IDS.root],
  root: [REARRANGE_CARD_IDS.root],
  exp: [REARRANGE_CARD_IDS.exp],
  log: [REARRANGE_CARD_IDS.exp],
  logCombine: [REARRANGE_CARD_IDS.laws],
  logLaw: [REARRANGE_CARD_IDS.laws],
  logBase: [REARRANGE_CARD_IDS.logEquation],
  logPower: [REARRANGE_CARD_IDS.logEquation],
  logNumber: [REARRANGE_CARD_IDS.logEquation],
  unlog: [REARRANGE_CARD_IDS.logEquation],
  powerLaw: [REARRANGE_CARD_IDS.laws],
  arc: [REARRANGE_CARD_IDS.arc],
  trig: [REARRANGE_CARD_IDS.arc],
  pythagoras: [REARRANGE_CARD_IDS.trig],
  tanQuotient: [REARRANGE_CARD_IDS.trig],
  substitute: [REARRANGE_CARD_IDS.substitution],
  zero: [REARRANGE_CARD_IDS.pq],
  normalize: [REARRANGE_CARD_IDS.pq],
  pq: [REARRANGE_CARD_IDS.pq],
  choose: [REARRANGE_CARD_IDS.pq],
  resubstitute: [REARRANGE_CARD_IDS.substitution],
  derive: [],
  partial: [REARRANGE_CARD_IDS.integral],
  antiderivative: [REARRANGE_CARD_IDS.integral],
  bounds: [REARRANGE_CARD_IDS.integral],
  sumFormula: [REARRANGE_CARD_IDS.series],
  series: [REARRANGE_CARD_IDS.series],
  limit: [REARRANGE_CARD_IDS.limit],
  ode: [REARRANGE_CARD_IDS.ode],
  det: [REARRANGE_CARD_IDS.det],
  detExpand: [REARRANGE_CARD_IDS.det],
  abs: [REARRANGE_CARD_IDS.complex],
  arg: [REARRANGE_CARD_IDS.complex],
  length: [REARRANGE_CARD_IDS.vector],
  dot: [REARRANGE_CARD_IDS.vector],
  angle: [REARRANGE_CARD_IDS.vector],
  addition: [REARRANGE_CARD_IDS.addition],
  doubleAngle: [REARRANGE_CARD_IDS.addition],
  finish: [FRACTION_CARD_IDS.add, FRACTION_CARD_IDS.expand],
}

// previous: der Schritt davor (Teilen nach dem Ausklammern gehört zur Karte „Variable mehrfach")
function cardsOf(step: RearrangeStep, t: string, previous: RearrangeStep | undefined): string[] {
  // Ableiten: die Karten aus „Ableiten" zu den Regeln, die vorkommen
  if (step.kind === 'derive' && step.operand) return derivativeCards(step.operand)
  if (step.kind === 'multiply') {
    const den = denominatorOf(step)
    // alle Nenner beseitigen bzw. Variable im Nenner
    if (!den) return [REARRANGE_CARD_IDS.clear]
    if (contains(den, t)) return [REARRANGE_CARD_IDS.denominator]
  }
  if ((step.kind === 'divide' || step.kind === 'negate') && (previous?.kind === 'factor' || previous?.kind === 'collect')) return [REARRANGE_CARD_IDS.collect]
  // Ergebnis mit \tan y beim spitzen Winkel (Teil 8b)
  if (step.kind === 'finish' && step.operand) return [REARRANGE_CARD_IDS.trig]
  if (step.kind === 'combine') {
    const context = combineContext(step)
    if (context === 'multiply') return [REARRANGE_CARD_IDS.denominator, FRACTION_CARD_IDS.add]
    if (context === 'log') return [REARRANGE_CARD_IDS.exp, FRACTION_CARD_IDS.add]
    if (context !== 'reciprocal') return [REARRANGE_CARD_IDS.root, FRACTION_CARD_IDS.add]
  }
  return [...CARDS_BY_KIND[step.kind]]
}

// Karten aus „Ableiten" zu den Regeln einer Ableitung (Produkt-, Quotienten-, Kettenregel, …), ohne die
// Grundregeln (Potenz, Faktor, Summe)
const BASIC_RULES = new Set<RuleId>(['constant', 'constantFactor', 'sum', 'power', 'rewrite'])

function derivativeCards(body: Expr): string[] {
  return cardIdsFor(allNodes(derive(body)).map((n) => n.rule).filter((rule) => !BASIC_RULES.has(rule)))
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

