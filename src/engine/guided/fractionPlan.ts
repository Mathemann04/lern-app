import { FRACTION_CARD_IDS } from '../explain/fractionCards.ts'
import {
  FRACTION_HINTS,
  explainCancel,
  explainCombine,
  explainConjugate,
  explainConjugateProduct,
  compareWhere,
  explainAnsatz,
  explainCompare,
  explainDivide,
  explainImagConjugate,
  explainImagMultiply,
  explainImagPower,
  explainImagSplit,
  explainImagSum,
  explainLimitDivide,
  explainLimitInsert,
  explainLimitValue,
  explainLimitZeroZero,
  explainInsert,
  explainDecimal,
  explainOrder,
  explainExpand,
  explainFactor,
  explainFractionError,
  explainInner,
  explainInnerComplex,
  explainLcd,
  explainMultiply,
  explainMultiplyOut,
  explainReciprocal,
  explainRule,
  explainSide,
  type FactorMethod,
  fractionTaskHint,
  listing,
} from '../explain/fractionTexts.ts'
import { m } from '../explain/format.ts'
import type { Explanation } from '../explain/texts.ts'
import { toLatex } from '../expr/print.ts'
import { type Expr, mul, num, pow, variable } from '../expr/types.ts'
import { type FracWrong, type PartialWrong, fractionErrorRule, fractionWrongAnswers, partialWrongs } from '../fraction/errorRules.ts'
import { ansatzExpr, dividedExpr, factorPowerExpr, findingEquation } from '../fraction/partial.ts'
import { factoredExpr, factoredPoly, factorize, groupFactor, isOneFactored, productFormExpr, reduceFrac } from '../fraction/factor.ts'
import { fracAtoms, isRootAtom, polyExpr } from '../fraction/frac.ts'
import { type Poly, atomsOf, constValue, polyAdd, polyEquals, polyNeg, polyPow, polyProduct, totalDegree } from '../fraction/poly.ts'
import {
  type FracSolution,
  type FracStep,
  STEP_NAMES,
  type StepKind,
  type SumWork,
  cancelledFactor,
  fractionExpr,
  imagWork,
  limitDividedExpr,
  limitWork,
  multipliedExpr,
  nicePolyExpr,
  innerResultPart,
  partialFactorStep,
  partialWork,
  reciprocalExpr,
  reciprocalPart,
  sideOf,
  signedSum,
  solveFraction,
  solveTree,
  taskLetter,
  workSum,
} from '../fraction/solve.ts'
import { type TreeStage, decimalLeaves, decimalMistakes, withoutDecimals } from '../fraction/tree.ts'
import {
  type FractionTask,
  type TreeNode,
  innerTask,
  instructionFor,
  isWhole,
  limitPrefix,
  limitedLatex,
  partExpr,
  partsOf,
  readableLatex,
  replaceInner,
  shownExpr,
  shownPoly,
  sumNode,
  taskExpr,
  taskLatex,
  term,
  treeLatex,
} from '../fraction/task.ts'
import { type Rng, createRng } from '../random/rng.ts'
import { isOne, ratAbs } from '../rational.ts'
import { generateFractionTask } from '../tasks/fractionTerms.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'
import type { Choice, GuidedStep, GuidedTask } from './types.ts'

// Schrittplaner für Brüche im geführten Modus: macht aus dem Rechenweg der Bruch-Engine
// (fraction/solve.ts) die Bildschirm-Schritte. Falsche Antworten kommen aus den typischen Fehlern
// (fraction/errorRules.ts), jede mit eigener Erklärung.
//
// Ablauf je Aufgabenform:
// - plus, minus: Hauptnenner, erweitern, Zähler zusammenfassen, kürzen (nur wenn möglich)
// - mal: Zähler mal Zähler und Nenner mal Nenner, gleich gekürzt
// - geteilt: mit dem Kehrwert malnehmen, dann wie mal
// - kürzen: Zähler und Nenner zerlegen (wenn nötig), kürzen
// - Doppelbruch: Zähler und Nenner je zu einem Bruch, mit dem Kehrwert malnehmen, kürzen
// - Stufe 5: verschachtelter Doppelbruch (erst der innere), mehrere Rechenarten (jede Klammer zu
//   einem Bruch, dann malnehmen und kürzen), Klammer ausmultiplizieren, Regel eines Bausteins
// Ein Schritt, zu dem kein typischer Fehler passt, wird nicht einzeln abgefragt: Der Hauptnenner
// steht dann in der Frage zum Erweitern, andere Schritte gehen im nächsten (beim letzten: im
// vorigen) auf. Im letzten Schritt ist die Antwort immer das fertige Ergebnis.
// Ab Stufe 4 ist der Weg gröber: Erweitern und Zusammenfassen sind ein Schritt.

const MAX_WRONG_CHOICES = 3
const COARSE_FROM_LEVEL = 4

export function planFractionTask(ref: TaskRef, focus?: string): GuidedTask {
  return planFraction(generateFractionTask(ref).task, ref, focus)
}

// Falsche Antwort im Entwurf: so angezeigt (shown) bzw. als Antwort auf die letzte Frage (final;
// ohne Angabe gekürzt wie das Ergebnis)
type DraftWrong = { readonly wrong: FracWrong; readonly shown: Expr; readonly final?: Expr }

// Ein Schritt im Entwurf; zusammengelegte Schritte haben mehrere Arten
type Draft = {
  readonly kinds: readonly StepKind[]
  readonly correct: Expr
  readonly wrongs: readonly DraftWrong[]
  // Zeilen für „Bisher"
  readonly lines: readonly string[]
  readonly explanations: readonly Explanation[]
}

export function planFraction(t: FractionTask, ref: TaskRef, focus?: string): GuidedTask {
  if (t.kind === 'tree') return planTree(t, ref, focus)
  if (t.kind === 'partial') return planPartial(t, ref, focus)
  if (t.kind === 'limit') return planLimit(t, ref, focus)
  const solution = solveFraction(t)
  const wrongs = fractionWrongAnswers(t, solution).filter((w) => !w.freeOnly)
  const facts = factsOf(t, solution, wrongs)
  const raw = rawDrafts(t, solution, wrongs, facts)
  const drafts = arrange(ref.level >= COARSE_FROM_LEVEL ? coarsen(raw, t) : raw, solution, t)
  const steps = drafts.map((d, i) => buildStep(d, i, facts, createRng(`brueche-geführt:${ref.level}:${ref.seed}:${i}`), focus))
  return {
    ref,
    expr: taskExpr(t),
    functionLatex: taskLatex(t),
    instruction: instructionFor(t).replace(/\.$/, ''),
    answerLabel: taskLatex(t),
    steps,
    ruleHint: fractionTaskHint(t),
    result: solution.result,
    resultLatex: `${taskLatex(t)} = ${toLatex(solution.result)}`,
    ...excludedNote(t, solution),
    cards: [...new Set(steps.flatMap((s) => s.cards))],
  }
}

// „Gilt für $x \neq 3$." mit dem Buchstaben der Aufgabe
function excludedNote(t: FractionTask, solution: FracSolution): { resultNote?: string } {
  const excluded = solution.excluded ?? []
  const letter = taskLetter(t) ?? 'x'
  return excluded.length > 0 ? { resultNote: `Gilt für ${listing(excluded.map((r) => `$${letter} \\neq ${toLatex(num(r))}$`))}.` } : {}
}

// --- Rechenbaum (M2b): Teil für Teil ---
//
// Erst Dezimalzahlen als Brüche, dann je Teil (fraction/tree.ts): „Was rechnest du zuerst?", wenn
// Punkt vor Strich oder eine Klammer zählt, danach der Teil wie eine eigene Aufgabe. Beim letzten
// Teil ist die Antwort das Ergebnis; Fehler in der Reihenfolge stehen dort als falsche Ergebnisse.

const ORDER_ERRORS = ['frac-order', 'frac-bracket-ignored', 'frac-minus-before-bracket']

function planTree(t: Extract<FractionTask, { kind: 'tree' }>, ref: TaskRef, focus?: string): GuidedTask {
  const solution = solveTree(t)
  const last = solution.stages.at(-1)
  if (!last || last.node !== last.before) throw new Error(`Rechenbaum nicht spielbar: ${taskLatex(t)}`)
  const steps: GuidedStep[] = []
  const rngOf = (key: string) => createRng(`brueche-geführt:${ref.level}:${ref.seed}:${key}`)
  // Zeilen für „Bisher" von Schritten, die wegfallen
  let pending: string[] = []
  const push = (step: GuidedStep) => {
    const lines = [...pending, ...[step.established ?? []].flat()]
    pending = []
    steps.push({ ...step, id: `${steps.length + 1}-${step.id}`, established: lines })
  }

  // Dezimalzahlen
  const decimals = decimalLeaves(t.root)
  const mistakes = decimalMistakes(t.root)
  decimals.forEach((d, i) => {
    const latex = toLatex(partExpr(d.part))
    const wrongs = mistakes
      .filter((mm) => mm.leaf === d)
      .map((mm, j): Choice => ({ id: `falsch-${j + 1}`, content: m(partExpr(mm.wrong)), correct: false, expr: partExpr(mm.wrong), errorRuleId: 'frac-decimal-places', whyWrong: explainFractionError('frac-decimal-places') }))
      .filter((c, j, all) => c.content !== `$${latex}$` && all.findIndex((o) => o.content === c.content) === j)
    push({
      id: 'decimal',
      title: 'Dezimalzahl',
      question: `Schreibe $${d.decimal!.replace(',', '{,}')}$ als gekürzten Bruch.`,
      choices: rngOf(`d${i}`).shuffle([{ id: 'richtig', content: `$${latex}$`, correct: true, expr: partExpr(d.part) }, ...wrongs]),
      hint: FRACTION_HINTS.decimal,
      explanation: explainDecimal(d.decimal!, latex),
      established: i === decimals.length - 1 ? [readableLatex(`= ${treeLatex(withoutDecimals(t.root))}`)] : [],
      cards: [FRACTION_CARD_IDS.decimal],
    })
  })

  // Fehler in der Reihenfolge als falsche Ergebnisse der letzten Frage; reicht das nicht, auch Fehler
  // aus früheren Teilen, mit dem Rest richtig weitergerechnet
  const treeWrongs = fractionWrongAnswers(t, solution).filter((w) => w.value && !w.freeOnly)
  const finalWrongs = [...treeWrongs.filter((w) => ORDER_ERRORS.includes(w.rule.id)), ...treeWrongs.filter((w) => !ORDER_ERRORS.includes(w.rule.id))]

  solution.stages.forEach((stage, i) => {
    const last = i === solution.stages.length - 1
    const order = orderChoices(stage)
    if (order.length > 0) {
      const correctLatex = treeLatex(stage.node)
      push({
        id: 'order',
        title: 'Reihenfolge',
        question: 'Was rechnest du zuerst?',
        choices: rngOf(`o${i}`).shuffle([
          // Doppelbrüche in voller Größe, sonst sind die inneren Brüche am Handy zu klein
          { id: 'richtig', content: `$${readableLatex(correctLatex)}$`, correct: true },
          ...order.map((o, j): Choice => ({ id: `falsch-${j + 1}`, content: `$${readableLatex(o.latex)}$`, correct: false, errorRuleId: o.rule, whyWrong: explainFractionError(o.rule) })),
        ]),
        hint: FRACTION_HINTS.order,
        explanation: explainOrder(stage.node.kind === 'sum' ? 'bracket' : 'dot', correctLatex),
        established: [],
        cards: [FRACTION_CARD_IDS.order],
      })
    }
    const sub = planFraction(stage.task, { level: ref.level, seed: ref.seed * 31 + i + 1 }, focus)
    const nodeLatex = treeLatex(stage.node)
    sub.steps.forEach((s, j) => {
      const lastSub = j === sub.steps.length - 1
      let step: GuidedStep = {
        ...s,
        title: last ? s.title : `Teilrechnung: $${nodeLatex}$`,
        established: last ? s.established : lastSub ? [readableLatex(`= ${treeLatex(stage.after)}`)] : [],
      }
      if (last && lastSub) step = withOrderWrongs(step, finalWrongs, t, rngOf('ende'), focus)
      // ohne falsche Antwort keine Frage: Die Zeilen stehen beim nächsten Schritt unter „Bisher"
      if (step.choices.length < 2 && !(last && lastSub)) pending.push(...[step.established ?? []].flat())
      else push(step)
    })
  })

  return {
    ref,
    expr: taskExpr(t),
    functionLatex: taskLatex(t),
    instruction: instructionFor(t).replace(/\.$/, ''),
    answerLabel: taskLatex(t),
    steps,
    ruleHint: fractionTaskHint(t),
    result: solution.result,
    resultLatex: `${taskLatex(t)} = ${toLatex(solution.result)}`,
    ...excludedNote(t, solution),
    cards: [...new Set(steps.flatMap((s) => s.cards))],
  }
}

type OrderChoice = { readonly latex: string; readonly rule: string }

// Falsche Antworten auf „Was rechnest du zuerst?": was man ohne Punkt vor Strich bzw. ohne die
// Klammer zuerst rechnen würde (der Summand davor mit dem ersten Teil des Knotens, oder der Teil
// des Knotens mit dem Summanden danach)
function orderChoices(stage: TreeStage): OrderChoice[] {
  const parent = parentOf(stage.before, stage.node)
  if (!parent || parent.kind !== 'sum') return []
  const i = parent.terms.findIndex((x) => x.node === stage.node)
  const rule = stage.node.kind === 'sum' ? 'frac-bracket-ignored' : 'frac-order'
  const firstOf = (n: TreeNode): TreeNode => {
    if (n.kind === 'product' || n.kind === 'quotient') return firstOf(n.left)
    if (n.kind === 'sum' && n.terms.length >= 2 && n.terms[0].sign > 0) return n.terms[0].node
    return n
  }
  const lastOf = (n: TreeNode): TreeNode => {
    if (n.kind === 'product' || n.kind === 'quotient') return n.right
    if (n.kind === 'sum' && n.terms.length >= 2) return n.terms[n.terms.length - 1].node
    return n
  }
  const out: OrderChoice[] = []
  const pair = (a: TreeNode, sign: 1 | -1, b: TreeNode, aSign: 1 | -1 = 1) => treeLatex(sumNode(term(aSign, a), term(sign, b)))
  const nodeSign = parent.terms[i].sign
  if (i > 0) {
    const before = parent.terms[i - 1]
    out.push({ latex: pair(lastOf(before.node), nodeSign, firstOf(stage.node), i - 1 === 0 ? before.sign : 1), rule })
  }
  const after = parent.terms[i + 1]
  if (after && stage.node.kind !== 'sum') out.push({ latex: pair(lastOf(stage.node), after.sign, firstOf(after.node)), rule })
  const correct = treeLatex(stage.node)
  return out.filter((o, j) => o.latex !== correct && out.findIndex((x) => x.latex === o.latex) === j)
}

function parentOf(n: TreeNode, target: TreeNode): TreeNode | null {
  const children = n.kind === 'leaf' ? [] : n.kind === 'sum' ? n.terms.map((x) => x.node) : [n.left, n.right]
  if (children.includes(target)) return n
  for (const c of children) {
    const found = parentOf(c, target)
    if (found) return found
  }
  return null
}

// Fehler in der Reihenfolge (und notfalls weitergerechnete Fehler früherer Teile) zusätzlich als
// falsche Ergebnisse, wenn Platz ist (gezieltes Üben: der gesuchte Fehler sicher). Weitergerechnete
// Fehler nur, solange die Frage sonst weniger als zwei falsche Antworten hätte.
function withOrderWrongs(step: GuidedStep, wrongs: readonly FracWrong[], t: FractionTask, rng: Rng, focus?: string): GuidedStep {
  const shown = new Set(step.choices.map((c) => c.content))
  const extra: Choice[] = []
  const own = step.choices.filter((c) => !c.correct).length
  for (const w of wrongs) {
    if (!ORDER_ERRORS.includes(w.rule.id) && w.rule.id !== focus && own + extra.length >= 2) continue
    const e = resultForm(w, t)
    const content = m(e)
    if (shown.has(content)) continue
    shown.add(content)
    extra.push({ id: `falsch-r${extra.length + 1}`, content, correct: false, expr: e, errorRuleId: w.rule.id, whyWrong: explainFractionError(w.rule.id) })
  }
  if (extra.length === 0) return step
  const wrong = [...step.choices.filter((c) => !c.correct), ...extra]
  const chosen = [...wrong.filter((c) => c.errorRuleId === focus), ...wrong.filter((c) => c.errorRuleId !== focus)].slice(0, MAX_WRONG_CHOICES)
  return { ...step, choices: rng.shuffle([...step.choices.filter((c) => c.correct), ...chosen]) }
}

// --- Partialbruchzerlegung (Stufe 5) ---
//
// Polynomdivision (wenn nötig), Nenner zerlegen (wenn er als Summe dasteht), Ansatz, dann je Zahl
// eine Frage; bei der letzten Zahl ist die Antwort die ganze Zerlegung. Ein Schritt ohne typischen
// Fehler wird nicht gefragt: Seine Zeilen und seine Erklärung kommen zum nächsten Schritt.

type AskCandidate = { readonly wrong: FracWrong; readonly shown: Expr; readonly content: string }

// Eine Frage mit selbst gebauten Antworten (Partialbrüche, Grenzwerte)
type Ask = {
  readonly key: string
  readonly title: string
  readonly question: string
  readonly correct: { readonly content: string; readonly expr: Expr; readonly key: string }
  readonly candidates: readonly AskCandidate[]
  readonly hint: string
  readonly explanation: Explanation
  readonly lines: readonly string[]
  readonly cards: readonly string[]
  readonly final?: boolean
}

// Sammelt Schritte: Eine Frage ohne falsche Antwort wird nicht gestellt, ihre Zeilen und ihre
// Erklärung kommen zur nächsten Frage
function createAsker(ref: TaskRef, focus?: string) {
  const steps: GuidedStep[] = []
  let pending: { lines: string[]; explanations: Explanation[] } = { lines: [], explanations: [] }
  const ask = (a: Ask) => {
    const rng = createRng(`brueche-geführt:${ref.level}:${ref.seed}:${a.key}`)
    const picked = pickWrong(a.candidates, a.correct.key, rng, focus)
    if (picked.length === 0 && !a.final) {
      pending = { lines: [...pending.lines, ...a.lines], explanations: [...pending.explanations, a.explanation] }
      return
    }
    const choices: Choice[] = [
      { id: 'richtig', content: a.correct.content, correct: true, expr: a.correct.expr },
      ...picked.map((c, i): Choice => ({ id: `falsch-${i + 1}`, content: c.content, correct: false, expr: c.shown, errorRuleId: c.wrong.rule.id, whyWrong: explainFractionError(c.wrong.rule.id) })),
    ]
    steps.push({
      id: `${steps.length + 1}-${a.key}`,
      title: a.title,
      question: a.question,
      choices: rng.shuffle(choices),
      hint: a.hint,
      explanation: joinExplanations([...pending.explanations, a.explanation]),
      established: [...pending.lines, ...a.lines].map(readableLatex),
      cards: [...a.cards],
    })
    pending = { lines: [], explanations: [] }
  }
  return { steps, ask }
}

function planPartial(t: Extract<FractionTask, { kind: 'partial' }>, ref: TaskRef, focus?: string): GuidedTask {
  const solution = solveFraction(t)
  const w = partialWork(t)
  const wrongs = partialWrongs(t, w)
  const ids = FRACTION_CARD_IDS
  const { steps, ask } = createAsker(ref, focus)
  const asWrong = (pw: PartialWrong): FracWrong => ({ rule: fractionErrorRule(pw.id), step: pw.step, stepExpr: pw.shown, value: pw.value, result: pw.result })
  const candidate = (pw: PartialWrong, shown: Expr, content = m(shown)): AskCandidate => ({ wrong: asWrong(pw), shown, content })

  // Polynomdivision
  const denShown = shownExpr(t.part.den)
  if (w.divided) {
    const after = dividedExpr(w, denShown)
    ask({
      key: 'divide',
      title: 'Polynomdivision',
      question: 'Der Zähler hat keinen kleineren Grad als der Nenner. Teile deshalb zuerst (Polynomdivision): Was kommt heraus?',
      correct: { content: m(after), expr: after, key: toLatex(after) },
      candidates: wrongs.filter((x) => x.step === 'divide').map((x) => candidate(x, x.shown)),
      hint: FRACTION_HINTS.divide,
      explanation: explainDivide(taskExpr(t), nicePolyExpr(w.quotient), nicePolyExpr(w.rest), after),
      lines: [`= ${toLatex(after)}`],
      cards: [ids.polyDivision],
    })
  }

  // Nenner zerlegen
  if (partialFactorStep(t)) {
    const factored = factoredExpr(w.factored)
    const methods = factorMethods(w.den, t.hints)
    ask({
      key: 'factor-den',
      title: 'Nenner zerlegen',
      question: `Zerlege den Nenner ${m(denShown)} in Faktoren.`,
      correct: { content: m(factored), expr: factored, key: toLatex(factored) },
      candidates: wrongs.filter((x) => x.step === 'factor-den').map((x) => candidate(x, x.shown)),
      hint: methods.length > 0 ? methodHint(methods) : FRACTION_HINTS.factor,
      explanation: explainFactor(denShown, factored, false, methods),
      lines: [`= ${toLatex(dividedExpr(w, factored))}`],
      cards: methods.length > 0 ? [...new Set(methods.map((k) => METHOD_CARDS[k]))] : [ids.sumCancel],
    })
  }

  // Ansatz
  const ansatz = ansatzExpr(w.quotient, w.terms)
  const equation: [Expr, Expr] = [nicePolyExpr(w.rest), w.equationRight]
  ask({
    key: 'ansatz',
    title: 'Ansatz',
    question: 'Welcher Ansatz passt?',
    correct: { content: m(ansatz), expr: ansatz, key: toLatex(ansatz) },
    candidates: wrongs.filter((x) => x.step === 'ansatz').map((x) => candidate(x, x.shown)),
    hint: FRACTION_HINTS.ansatz,
    explanation: explainAnsatz(ansatz, equation, w.factored.factors.some((f) => f.exp >= 2), w.divided),
    lines: [`= ${toLatex(ansatz)}`, `${toLatex(equation[0])} = ${toLatex(equation[1])}`],
    cards: [ids.partial],
  })

  // Zahlen bestimmen; bei der letzten die ganze Zerlegung
  const letter = w.letter
  const coefWrongs = wrongs.filter((x) => x.step === 'coef')
  w.findings.forEach((f, i) => {
    const final = i === w.findings.length - 1
    const value = num(f.value)
    const insertAt = f.kind === 'insert' ? `${letter} = ${toLatex(num(f.at))}` : ''
    const where = f.kind === 'compare' ? compareWhere(letter, f.power) : ''
    const equation = findingEquation(f)
    const explanation =
      f.kind === 'insert'
        ? explainInsert(insertAt, factorPowerExpr(f.factor, 1), equation, f.letter, value)
        : explainCompare(
            where,
            equation,
            f.others.map((o) => `${o.letter} = ${toLatex(num(o.value))}`),
            f.letter,
            value,
          )
    const how = f.kind === 'insert' ? `Setze $${insertAt}$ ein` : `Vergleiche die Zahlen ${where}`
    const own = coefWrongs.filter((x) => x.letter === f.letter)
    if (!final) {
      ask({
        key: `coef-${f.letter}`,
        title: `$${f.letter}$ bestimmen`,
        question: `${how}. Was ist $${f.letter}$?`,
        correct: { content: `$${f.letter} = ${toLatex(value)}$`, expr: value, key: toLatex(value) },
        candidates: own.map((x) => candidate(x, x.shown, `$${f.letter} = ${toLatex(x.shown)}$`)),
        hint: f.kind === 'insert' ? FRACTION_HINTS.insert : FRACTION_HINTS.compare,
        explanation,
        lines: [`${f.letter} = ${toLatex(value)}`],
        cards: [ids.partial],
      })
      return
    }
    // Letzte Zahl: falsche Zerlegungen aus Fehlern bei dieser Zahl; reicht das nicht, auch aus
    // früheren Fehlern, mit dem Rest richtig weitergerechnet
    const others = wrongs.filter((x) => x.result && !own.includes(x))
    const extra = others.filter((x, j) => x.id === focus || own.length + j < 2)
    ask({
      key: 'ergebnis',
      title: `$${f.letter}$ bestimmen`,
      question: `${how} und bestimme $${f.letter}$. Wie lautet die Zerlegung?`,
      correct: { content: m(solution.result), expr: solution.result, key: toLatex(solution.result) },
      candidates: [...own, ...extra].map((x) => candidate(x, x.result!)),
      hint: f.kind === 'insert' ? FRACTION_HINTS.insert : FRACTION_HINTS.compare,
      explanation,
      lines: [`${f.letter} = ${toLatex(value)}`],
      cards: [ids.partial],
      final: true,
    })
  })

  return {
    ref,
    expr: taskExpr(t),
    functionLatex: taskLatex(t),
    instruction: instructionFor(t).replace(/\.$/, ''),
    answerLabel: taskLatex(t),
    steps,
    ruleHint: fractionTaskHint(t),
    result: solution.result,
    resultLatex: `${taskLatex(t)} = ${toLatex(solution.result)}`,
    ...excludedNote(t, solution),
    cards: [...new Set(steps.flatMap((s) => s.cards))],
  }
}

// --- Grenzwerte (Stufe 5) ---
//
// x → a: Einsetzen ergibt 0/0. Der Bruch wird wie eine eigene Aufgabe umgeformt (zerlegen und kürzen
// bzw. zusammenfassen), in „Bisher" mit dem Limes davor; zuletzt „Setze x = a ein". n → ∞: eine
// Summe erst zusammenfassen, Faktoren ausmultiplizieren, durch die höchste Potenz des Nenners
// teilen, zuletzt der Grenzwert.

function planLimit(t: Extract<FractionTask, { kind: 'limit' }>, ref: TaskRef, focus?: string): GuidedTask {
  const solution = solveFraction(t)
  const w = limitWork(t)
  const wrongs = fractionWrongAnswers(t, solution).filter((x) => !x.freeOnly)
  const ids = FRACTION_CARD_IDS
  const prefix = limitPrefix(t.letter, t.to)
  const withLimit = (line: string) => (line.startsWith('= ') ? `= ${limitedLatex(t.letter, t.to, line.slice(2))}` : line)
  const { steps, ask } = createAsker(ref, focus)
  const candidate = (x: FracWrong, shown: Expr): AskCandidate => ({ wrong: x, shown, content: m(shown) })
  const at = t.to === 'infinity' ? '' : `${t.letter} = ${toLatex(num(t.to))}`

  // Der Bruch selbst: Schritte wie bei der eigenen Aufgabe (bei n → ∞ nur eine Summe)
  if (w.inner) {
    const inner = planFraction(t.inner, ref, focus)
    inner.steps.forEach((s, i) => {
      const first = i === 0 && t.to !== 'infinity'
      steps.push({
        ...s,
        id: `${steps.length + 1}-${s.id.replace(/^\d+-/, '')}`,
        question: first ? `${limitStart(t, at)} ${s.question}` : s.question,
        explanation: first ? joinExplanations([explainLimitZeroZero(at, t.inner.kind === 'sum'), s.explanation]) : s.explanation,
        established: (s.established === undefined ? [] : typeof s.established === 'string' ? [s.established] : s.established).map(withLimit),
        cards: [...new Set([...s.cards, ids.limit])],
      })
    })
  }
  const result = solution.result
  const resultKey = toLatex(result)
  const innerWrongs = wrongs.filter((x) => !x.step.startsWith('limit-') && x.result)

  if (t.to !== 'infinity') {
    const own = wrongs.filter((x) => x.step === 'limit-insert')
    // reicht das nicht: falsche Grenzwerte nach einem Fehler beim Umformen
    const extra = innerWrongs.filter((x, j) => x.rule.id === focus || own.length + j < 3)
    ask({
      key: 'einsetzen',
      title: 'Einsetzen',
      question: `Setze $${at}$ ein. Was ist der Grenzwert?`,
      correct: { content: m(result), expr: result, key: resultKey },
      candidates: [...own, ...extra].map((x) => candidate(x, x.result ?? x.stepExpr)),
      hint: FRACTION_HINTS.limitInsert,
      explanation: explainLimitInsert(at, w.fracExpr, result),
      lines: [`= ${resultKey}`],
      cards: [ids.limit],
      final: true,
    })
  } else {
    const n = t.letter
    if (w.expanded) {
      ask({
        key: 'ausmultiplizieren',
        title: 'Ausmultiplizieren',
        question: 'Multipliziere Zähler und Nenner aus.',
        correct: { content: m(w.fracExpr), expr: w.fracExpr, key: toLatex(w.fracExpr) },
        candidates: [],
        hint: FRACTION_HINTS.multiplyOut,
        explanation: { detailed: `Erst ausmultiplizieren, dann siehst du die höchsten Potenzen: $${toLatex(w.fracExpr)}$.`, short: `$${toLatex(w.fracExpr)}$` },
        lines: [`= ${prefix} ${toLatex(w.fracExpr)}`],
        cards: [ids.limit],
      })
    }
    const power = w.power === 1 ? variable(n) : pow(variable(n), num(w.power))
    const divided = limitDividedExpr(w)
    ask({
      key: 'teilen',
      title: 'Durch die höchste Potenz teilen',
      question: `Teile Zähler und Nenner durch die höchste Potenz $${toLatex(power)}$ des Nenners.`,
      correct: { content: m(divided), expr: divided, key: toLatex(divided) },
      candidates: wrongs.filter((x) => x.step === 'limit-divide').map((x) => candidate(x, x.stepExpr)),
      hint: FRACTION_HINTS.limitDivide,
      explanation: explainLimitDivide(power, w.fracExpr, divided),
      lines: [`= ${prefix} ${toLatex(divided)}`],
      cards: [ids.limit],
    })
    const own = wrongs.filter((x) => x.step === 'limit-value')
    const extra = innerWrongs.filter((x, j) => x.rule.id === focus || own.length + j < 3)
    ask({
      key: 'grenzwert',
      title: 'Grenzwert',
      question: `Was ist der Grenzwert für $${n} \\to \\infty$?`,
      correct: { content: m(result), expr: result, key: resultKey },
      candidates: [...own, ...extra].map((x) => candidate(x, x.result ?? x.stepExpr)),
      hint: FRACTION_HINTS.limitValue,
      explanation: explainLimitValue(n, divided, result),
      lines: [`= ${resultKey}`],
      cards: [ids.limit],
      final: true,
    })
  }

  return {
    ref,
    expr: taskExpr(t),
    functionLatex: taskLatex(t),
    instruction: instructionFor(t).replace(/\.$/, ''),
    answerLabel: taskLatex(t),
    steps,
    ruleHint: fractionTaskHint(t),
    result,
    resultLatex: `${taskLatex(t)} = ${resultKey}`,
    cards: [...new Set(steps.flatMap((s) => s.cards))],
  }
}

// Satz vor der ersten Frage: Einsetzen geht noch nicht
const limitStart = (t: Extract<FractionTask, { kind: 'limit' }>, at: string) =>
  t.inner.kind === 'sum' ? `Bei $${at}$ werden die Nenner $0$, einsetzen geht noch nicht.` : `Einsetzen von $${at}$ ergibt $\\frac{0}{0}$.`

// --- Was die Texte über die Aufgabe wissen müssen ---

type Facts = {
  // die Aufgabe; beim verschachtelten Doppelbruch der äußere mit dem Ergebnis des inneren
  readonly task: FractionTask
  readonly original: FractionTask
  readonly work: SumWork | null
  readonly lcd: Expr | null
  // beim Kürzen: Potenzen von Buchstaben fallen weg, eine Klammer wie (x + 3) fällt weg, ein Minus
  // aus einer vertauschten Differenz bleibt stehen
  readonly cancelPowers: boolean
  readonly cancelSums: boolean
  readonly minusKept: boolean
  // Nenner aus Summen (Hauptnenner mit Termen) bzw. Bausteine wie e^x
  readonly termDenominators: boolean
  readonly blocks: boolean
  // Wurzel √x (auch √a, √(x + h)) in der Aufgabe
  readonly root: boolean
  // komplexe Zahlen: Nenner des Bruchs mit i (nach den Potenzen von i), sonst null
  readonly imagDen: Expr | null
  // Wurzel beseitigen: Die Summe mit Wurzel steht im Zähler oder im Nenner (sonst null)
  readonly conjugate: 'num' | 'den' | null
  // Bausteine mit eigenen Regeln: √x, sin² x + cos² x = 1, Potenzen von e^x
  readonly blockRules: boolean
  // beim Kürzen: wie sich Zähler und Nenner der Aufgabe zerlegen lassen
  readonly numMethods: readonly FactorMethod[]
  readonly denMethods: readonly FactorMethod[]
  // wie sich die Zähler und Nenner aller Brüche der Aufgabe zerlegen lassen
  readonly partMethods: readonly FactorMethod[]
}

// Bausteine der Bruch-Engine (frac.ts): e^x, ln x, sin x, cos x, √x
const BLOCK_ATOMS = ['E', 'L', 'S', 'C']
const isBlock = (atom: string) => BLOCK_ATOMS.includes(atom) || isRootAtom(atom)

function factsOf(original: FractionTask, solution: FracSolution, wrongs: readonly FracWrong[]): Facts {
  const t = original.kind === 'nested' ? replaceInner(original, innerResultPart(solveFraction(innerTask(original, original.hints))), original.hints) : original
  const work = t.kind === 'sum' ? workSum(t.terms, t.hints) : null
  const common = cancelledFactor(solution.beforeCancel, solution.reduced, t.hints)
  const cancelPowers = common !== null && common.factors.some((f) => f.poly.length === 1 && atomsOf(f.poly).length > 0)
  const cancelSums = common !== null && common.factors.some((f) => f.poly.length >= 2)
  return {
    task: t,
    original,
    work,
    lcd: work ? factoredExpr(work.lcd) : null,
    cancelPowers,
    cancelSums,
    minusKept: wrongs.some((w) => w.rule.id === 'frac-cancel-sign'),
    termDenominators: partsOf(t).some((p) => factorize(shownPoly(p.den), t.hints).factors.some((f) => f.poly.length >= 2)),
    blocks: fracAtoms(solution.value).some(isBlock),
    root: fracAtoms(solution.value).some(isRootAtom),
    conjugate: original.rule?.kind === 'conjugate' ? original.rule.target : null,
    imagDen: t.kind === 'imaginary' ? shownExpr(imagWork(t).den) : null,
    blockRules: original.rule !== undefined || fracAtoms(solution.value).some(isRootAtom) || wrongs.some((w) => w.rule.id === 'frac-cancel-inside'),
    numMethods: t.kind === 'reduce' ? factorMethods(shownPoly(t.part.num), t.hints) : [],
    denMethods: t.kind === 'reduce' ? factorMethods(shownPoly(t.part.den), t.hints) : [],
    partMethods: partMethods(t),
  }
}

// Wie sich ein Term zerlegen lässt: ausklammern (Zahl, Buchstabe oder Minus vor der Klammer),
// in Gruppen ausklammern, binomische Formel ((a + b)(a − b), (a ± b)²) oder zwei verschiedene
// Klammern wie bei x² + px + q (mit Zahl vor x² bzw. mit zwei Buchstaben eigene Art), dritte
// Potenzen (a³ − b³ = (a − b)(a² + ab + b²))
export function factorMethods(p: Poly, hints: readonly Poly[]): FactorMethod[] {
  const f = factorize(p, hints)
  const linear = f.factors.filter((g) => g.poly.length === 2 && totalDegree(g.poly) === 1)
  const mirror = (g: Poly) => polyAdd([g[0]], polyNeg([g[1]]))
  const methods: FactorMethod[] = []
  if (!isOne(f.coef) || f.factors.some((g) => g.poly.length === 1)) methods.push('out')
  if (p.length === 2 && linear.length >= 1 && f.factors.some((g) => g.poly.length === 3 && totalDegree(g.poly) === 2)) methods.push('cubes')
  const grouped = groupFactor(p) !== null
  if (grouped) methods.push('grouping')
  const binomial = linear.some((g) => g.exp >= 2 || linear.some((h) => h !== g && polyEquals(h.poly, mirror(g.poly))))
  if (binomial) methods.push('binomial')
  else if (!grouped && linear.length >= 2) {
    if (linear.some((g) => !isOne(g.poly[0].coef))) methods.push('leading')
    else if (linear.some((g) => atomsOf(g.poly).length === 2)) methods.push('twoLetters')
    else methods.push('quadratic')
  }
  return methods
}

// Zerlege-Arten aller Zähler und Nenner der Aufgabe, die als Summe dastehen (für die Lernkarten
// beim Hauptnenner und beim Kürzen nach dem Malnehmen)
function partMethods(t: FractionTask): FactorMethod[] {
  const sums = partsOf(t)
    .flatMap((p) => [p.num, p.den])
    .flatMap((s) => (s.form === 'expanded' && s.poly.length >= 2 ? [s.poly] : []))
  return [...new Set(sums.flatMap((p) => factorMethods(p, t.hints)))]
}

// --- Entwürfe aus dem Rechenweg ---

function rawDrafts(t: FractionTask, solution: FracSolution, wrongs: readonly FracWrong[], facts: Facts): Draft[] {
  const wrongIn = (kinds: readonly StepKind[]) => wrongs.filter((w) => kinds.includes(w.step))
  // Fehler beim Erweitern und Zusammenfassen: als letzte Antwort zusammengefasst, aber nicht gekürzt
  // (so, wie man nach diesem Fehler weiterrechnet)
  const finalOf = (w: FracWrong): Expr | undefined => {
    if (w.step === 'combine') return w.stepExpr
    if (w.step === 'expand' && w.value && facts.work) return fractionExpr(w.value.num, facts.work.lcd)
    return undefined
  }
  const correctOf = (step: FracStep): Expr => {
    if (step.kind === 'lcd') return step.detail!
    // z. B. Doppelbruch: gefragt ist nur der Zähler bzw. Nenner als ein Bruch („Bisher" zeigt das Ganze)
    return step.answer ?? step.expr!
  }
  const draft = (step: FracStep): Draft => ({
    kinds: [step.kind],
    correct: correctOf(step),
    // Beim Kürzen ist die Antwort ein Ergebnis: Produkte aus Klammern bleiben stehen
    wrongs: wrongIn([step.kind]).map((w) => ({ wrong: w, shown: step.kind === 'cancel' ? resultForm(w, t) : w.stepExpr, final: finalOf(w) })),
    lines: [step.kind === 'lcd' ? `\\text{Hauptnenner: } ${toLatex(step.detail!)}` : `= ${toLatex(step.expr!)}`],
    explanations: [explainStep(step, solution, facts)],
  })

  if (t.kind !== 'product' && t.kind !== 'quotient' && t.kind !== 'mixed') return solution.steps.map(draft)

  // Mal und geteilt: Malnehmen und Kürzen sind ein Schritt mit dem fertigen Ergebnis als Antwort
  const before = solution.steps.filter((s) => s.kind !== 'multiply' && s.kind !== 'cancel').map(draft)
  const multiply = solution.steps.find((s) => s.kind === 'multiply')!
  const cancel = solution.steps.find((s) => s.kind === 'cancel')
  const product: Draft = {
    kinds: cancel ? ['multiply', 'cancel'] : ['multiply'],
    correct: solution.result,
    wrongs: wrongIn(['multiply', 'cancel']).map((w) => ({ wrong: w, shown: resultForm(w, t) })),
    lines: [`= ${toLatex(multiply.expr!)}`, `= ${toLatex(solution.result)}`],
    explanations: [explainStep(multiply, solution, facts), ...(cancel ? [explainStep(cancel, solution, facts)] : [])],
  }
  return [...before, product]
}

// Ab Stufe 4: Erweitern und Zusammenfassen als ein Schritt; die Fehler beim Erweitern erscheinen
// dann zusammengefasst, so wie man nach ihnen weiterrechnet
function coarsen(raw: readonly Draft[], task: FractionTask): Draft[] {
  const i = raw.findIndex((d) => d.kinds.length === 1 && d.kinds[0] === 'expand')
  const combine = raw[i + 1]
  if (i < 0 || !combine || combine.kinds[0] !== 'combine') return [...raw]
  const expand = raw[i]
  const merged: Draft = {
    kinds: ['expand', 'combine'],
    correct: combine.correct,
    wrongs: [
      ...expand.wrongs.flatMap((w) => {
        const shown = w.final ?? (w.wrong.value ? resultForm(w.wrong, task) : null)
        return shown ? [{ wrong: w.wrong, shown, final: w.final }] : []
      }),
      ...combine.wrongs,
    ],
    lines: [...expand.lines, ...combine.lines],
    explanations: [...expand.explanations, ...combine.explanations],
  }
  return [...raw.slice(0, i), merged, ...raw.slice(i + 2)]
}

// Falsches Ergebnis zum Anzeigen: gekürzt, ein Produkt aus Klammern bleibt stehen; mit einer
// Regel wie sin² x + cos² x = 1 so umgeschrieben wie das richtige Ergebnis; mit der Zahl e wie
// gerechnet (e^2 - 4, nicht zerlegt)
function resultForm(w: FracWrong, t: FractionTask): Expr {
  if (w.value && w.value.num.length === 0) return num(0)
  if (t.kind === 'imaginary') return w.result ?? w.stepExpr
  if (t.rule || (w.value && fracAtoms(w.value).includes('e'))) return w.result ?? w.stepExpr
  return w.value ? productFormExpr(reduceFrac(w.value, t.hints), t.hints) : w.stepExpr
}

// Legt Schritte ohne falsche Antworten zusammen; im letzten Schritt ist die Antwort das Ergebnis
function arrange(raw: readonly Draft[], solution: FracSolution, task: FractionTask): Draft[] {
  // Hauptnenner ohne typischen Fehler (z. B. bei ganzer Zahl plus Bruch): steht in der nächsten Frage
  const drafts = raw.filter((d) => !(d.kinds[0] === 'lcd' && d.wrongs.length === 0))
  const merged: Draft[] = []
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i]
    const next = drafts[i + 1]
    if (d.wrongs.length === 0 && next) {
      drafts[i + 1] = { ...next, kinds: [...d.kinds, ...next.kinds], lines: [...d.lines, ...next.lines], explanations: [...d.explanations, ...next.explanations] }
      continue
    }
    merged.push(d)
  }
  const last = merged.pop()
  if (!last) return []
  const previous = merged.at(-1)
  if (last.wrongs.length === 0 && previous) {
    merged[merged.length - 1] = finalDraft(
      { ...previous, kinds: [...previous.kinds, ...last.kinds], lines: [...previous.lines, ...last.lines], explanations: [...previous.explanations, ...last.explanations] },
      solution,
      task,
    )
    return merged
  }
  return [...merged, finalDraft(last, solution, task)]
}

// Letzter Schritt: richtige und falsche Antworten als fertige, gekürzte Ergebnisse
function finalDraft(d: Draft, solution: FracSolution, task: FractionTask): Draft {
  const result = `= ${toLatex(solution.result)}`
  const lines = d.lines.at(-1) === result ? d.lines : [...d.lines, result]
  return {
    ...d,
    correct: solution.result,
    wrongs: d.wrongs.flatMap((w) => {
      const shown = w.final ?? (w.wrong.value ? resultForm(w.wrong, task) : null)
      return shown ? [{ wrong: w.wrong, shown }] : []
    }),
    lines: lines.filter((line, i) => i === 0 || line !== lines[i - 1]),
  }
}

// --- Texte je Schritt ---

const TITLES: Record<StepKind, readonly [first: string, later: string]> = {
  lcd: ['Hauptnenner', 'Hauptnenner'],
  expand: ['Erweitern', 'erweitern'],
  combine: ['Zusammenfassen', 'zusammenfassen'],
  'factor-num': ['Zähler zerlegen', 'Zähler zerlegen'],
  'factor-den': ['Nenner zerlegen', 'Nenner zerlegen'],
  cancel: ['Kürzen', 'kürzen'],
  multiply: ['Malnehmen', 'malnehmen'],
  reciprocal: ['Kehrwert', 'Kehrwert'],
  'inner-num': ['Zähler als ein Bruch', 'Zähler als ein Bruch'],
  'inner-den': ['Nenner als ein Bruch', 'Nenner als ein Bruch'],
  'multiply-out': ['Ausmultiplizieren', 'ausmultiplizieren'],
  identity: ['Regel anwenden', 'Regel anwenden'],
  'inner-complex': ['Innerer Doppelbruch', 'innerer Doppelbruch'],
  left: ['Erste Klammer', 'erste Klammer'],
  right: ['Zweite Klammer', 'zweite Klammer'],
  decimal: ['Dezimalzahl', 'Dezimalzahl'],
  order: ['Reihenfolge', 'Reihenfolge'],
  part: ['Teilergebnis', 'Teilergebnis'],
  conjugate: ['Mit dem Gegenstück erweitern', 'mit dem Gegenstück erweitern'],
  divide: ['Polynomdivision', 'Polynomdivision'],
  ansatz: ['Ansatz', 'Ansatz'],
  coef: ['Zahl bestimmen', 'Zahl bestimmen'],
  'imag-power': ['Potenzen von $\\mathrm{i}$', 'Potenzen von $\\mathrm{i}$'],
  'imag-conjugate': ['Erweitern', 'erweitern'],
  'imag-multiply': ['Ausmultiplizieren', 'ausmultiplizieren'],
  'imag-split': ['Aufteilen', 'aufteilen'],
  'imag-sum': ['Zusammenfassen', 'zusammenfassen'],
  'limit-insert': ['Einsetzen', 'einsetzen'],
  'limit-divide': ['Durch die höchste Potenz teilen', 'durch die höchste Potenz teilen'],
  'limit-value': ['Grenzwert', 'Grenzwert'],
}

function titleOf(kinds: readonly StepKind[]): string {
  return listing(kinds.map((k, i) => TITLES[k][i === 0 ? 0 : 1]))
}

// Teilsätze der Frage, klein geschrieben; der erste wird groß geschrieben
function phrase(kind: StepKind, facts: Facts): string {
  const t = facts.task
  switch (kind) {
    case 'lcd':
      return 'bestimme den Hauptnenner'
    case 'expand': {
      const terms = t.kind === 'sum' ? t.terms : []
      const target = `auf den Hauptnenner ${m(facts.lcd!)}`
      if (terms.some((s) => isWhole(s.part))) return `schreibe ${terms.length === 2 ? 'beide Teile' : 'alle Teile'} als Brüche mit dem Hauptnenner ${m(facts.lcd!)}`
      return `erweitere ${terms.length === 2 ? 'beide Brüche' : 'alle Brüche'} ${target}`
    }
    case 'combine':
      return 'fasse die Zähler zusammen'
    case 'factor-num':
      return 'zerlege den Zähler in Faktoren'
    case 'factor-den':
      return 'zerlege den Nenner in Faktoren'
    case 'cancel':
      return 'kürze so weit wie möglich'
    case 'multiply':
      return 'nimm Zähler mal Zähler und Nenner mal Nenner'
    case 'reciprocal':
      return t.kind === 'complex' ? 'nimm den oberen Bruch mal den Kehrwert des unteren' : 'schreibe die Aufgabe als Malaufgabe mit dem Kehrwert'
    case 'inner-num':
      return 'fasse den Zähler zu einem Bruch zusammen'
    case 'inner-den':
      return 'fasse den Nenner zu einem Bruch zusammen'
    case 'multiply-out':
      if (facts.conjugate) return `multipliziere den ${facts.conjugate === 'den' ? 'Nenner' : 'Zähler'} mit der dritten binomischen Formel aus`
      return 'multipliziere die Klammer im Zähler aus und fasse zusammen'
    case 'conjugate':
      return `erweitere mit dem Gegenstück ${facts.conjugate === 'num' ? 'des Zählers' : 'des Nenners'}, damit die Wurzel verschwindet`
    case 'identity': {
      const rule = facts.original.rule
      if (rule?.kind === 'root') return 'multipliziere den Nenner mit $(\\sqrt{x})^2 = x$ aus'
      const where = rule?.kind === 'trig' && rule.target === 'den' ? 'den Nenner' : t.kind === 'complex' ? 'den Zähler des Doppelbruchs' : 'den Zähler'
      return `vereinfache ${where} mit $\\sin^2 x + \\cos^2 x = 1$`
    }
    case 'inner-complex': {
      const o = facts.original
      return o.kind === 'nested' ? `löse zuerst den inneren Doppelbruch ${m(taskExpr(innerTask(o, o.hints)))} auf` : 'löse zuerst den inneren Doppelbruch auf'
    }
    case 'left':
      return 'fasse die erste Klammer zu einem Bruch zusammen'
    case 'right':
      return 'fasse die zweite Klammer zu einem Bruch zusammen'
    case 'decimal':
      return 'schreibe die Dezimalzahl als Bruch'
    case 'order':
      return 'entscheide, was du zuerst rechnest'
    case 'part':
      return 'setze das Teilergebnis ein'
    case 'divide':
      return 'teile mit der Polynomdivision'
    case 'ansatz':
      return 'wähle den Ansatz'
    case 'coef':
      return 'bestimme die Zahl'
    case 'imag-power':
      return 'rechne die Potenzen von $\\mathrm{i}$ aus'
    case 'imag-conjugate':
      return 'erweitere mit dem konjugiert Komplexen des Nenners'
    case 'imag-multiply':
      return 'multipliziere aus und fasse zusammen'
    case 'imag-split':
      return 'teile in Realteil und Imaginärteil auf'
    case 'imag-sum':
      return 'teile auf und fasse Realteile und Imaginärteile zusammen'
    case 'limit-insert':
      return 'setze ein'
    case 'limit-divide':
      return 'teile Zähler und Nenner durch die höchste Potenz des Nenners'
    case 'limit-value':
      return 'bestimme den Grenzwert'
  }
}

function questionOf(kinds: readonly StepKind[], facts: Facts): string {
  if (kinds.length === 1 && kinds[0] === 'lcd') return 'Was ist der Hauptnenner?'
  const text = listing(kinds.map((k) => phrase(k, facts)))
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`
}

function hintOf(kind: StepKind, facts: Facts): string {
  switch (kind) {
    case 'lcd':
    case 'expand':
    case 'combine':
    case 'multiply':
    case 'reciprocal':
      return FRACTION_HINTS[kind]
    case 'cancel':
      return facts.cancelPowers ? FRACTION_HINTS.cancelPowers : FRACTION_HINTS.cancel
    case 'factor-num':
    case 'factor-den': {
      const methods = kind === 'factor-num' ? facts.numMethods : facts.denMethods
      if (facts.root && !methods.includes('cubes')) return FRACTION_HINTS.rootFactor
      return methods.length > 0 ? methodHint(methods) : FRACTION_HINTS.factor
    }
    case 'inner-num':
    case 'inner-den':
    case 'left':
    case 'right':
      return FRACTION_HINTS.inner
    case 'multiply-out':
      return facts.conjugate ? FRACTION_HINTS.conjugateProduct : FRACTION_HINTS.multiplyOut
    case 'conjugate':
      return FRACTION_HINTS.conjugate
    case 'identity':
      return facts.original.rule?.kind === 'root' ? FRACTION_HINTS.root : FRACTION_HINTS.trig
    case 'inner-complex':
      return FRACTION_HINTS.innerComplex
    case 'decimal':
    case 'order':
    case 'part':
    case 'divide':
    case 'ansatz':
      return FRACTION_HINTS[kind]
    case 'coef':
      return FRACTION_HINTS.insert
    case 'imag-power':
      return FRACTION_HINTS.imagPower
    case 'imag-conjugate':
      return FRACTION_HINTS.imagConjugate
    case 'imag-multiply':
      return FRACTION_HINTS.imagMultiply
    case 'imag-split':
      return FRACTION_HINTS.imagSplit
    case 'imag-sum':
      return FRACTION_HINTS.imagSum
    case 'limit-insert':
      return FRACTION_HINTS.limitInsert
    case 'limit-divide':
      return FRACTION_HINTS.limitDivide
    case 'limit-value':
      return FRACTION_HINTS.limitValue
  }
}

const METHOD_HINTS: Record<FactorMethod, string> = {
  out: FRACTION_HINTS.factorOut,
  binomial: FRACTION_HINTS.factorBinomial,
  quadratic: FRACTION_HINTS.factorQuadratic,
  leading: FRACTION_HINTS.factorLeading,
  twoLetters: FRACTION_HINTS.factorTwoLetters,
  grouping: FRACTION_HINTS.factorGrouping,
  cubes: FRACTION_HINTS.factorCubes,
}

const methodHint = (methods: readonly FactorMethod[]) => methods.map((k) => METHOD_HINTS[k]).join(' ')

const METHOD_CARDS: Record<FactorMethod, string> = {
  out: FRACTION_CARD_IDS.factorOut,
  binomial: FRACTION_CARD_IDS.binomial,
  quadratic: FRACTION_CARD_IDS.quadratic,
  leading: FRACTION_CARD_IDS.leading,
  twoLetters: FRACTION_CARD_IDS.quadratic,
  grouping: FRACTION_CARD_IDS.grouping,
  cubes: FRACTION_CARD_IDS.cubes,
}

// Karten der besonderen Zerlege-Arten (die einfachen Arten stehen schon auf den Karten zum Kürzen)
const SPECIAL_METHODS: readonly FactorMethod[] = ['binomial', 'quadratic', 'leading', 'twoLetters', 'grouping', 'cubes']
const specialCards = (methods: readonly FactorMethod[]) => methods.filter((k) => SPECIAL_METHODS.includes(k)).map((k) => METHOD_CARDS[k])

// Karten zu einem Schritt; bei Bausteinen wie e^x zusätzlich deren Karte
function cardsOf(kind: StepKind, facts: Facts): string[] {
  const ids = FRACTION_CARD_IDS
  const terms = facts.termDenominators ? [ids.lcdTerms] : []
  const own = ((): string[] => {
    switch (kind) {
      case 'lcd':
        return [ids.add, ...terms, ...specialCards(facts.partMethods)]
      case 'combine':
        return [ids.add, ...terms]
      case 'expand':
        return [ids.expand, ...terms]
      case 'inner-num':
      case 'inner-den':
        return [ids.complex, ids.add]
      case 'inner-complex':
        return [ids.complex]
      case 'left':
      case 'right':
        return [ids.add]
      case 'multiply-out':
        return facts.conjugate ? [ids.rootDenominator] : [ids.binomial]
      case 'conjugate':
        return [ids.rootDenominator]
      case 'identity':
        return [ids.blockRules]
      case 'cancel': {
        // nach dem Malnehmen wird beim Kürzen auch zerlegt
        const factored = facts.task.kind === 'reduce' ? [] : specialCards(facts.partMethods)
        return [ids.reduce, ...(facts.cancelPowers ? [ids.powers] : []), ...(facts.cancelSums ? [ids.sumCancel] : []), ...factored]
      }
      case 'multiply':
        return [ids.multiply]
      case 'reciprocal':
        return facts.task.kind === 'complex' ? [ids.complex] : [ids.divide]
      case 'factor-num':
      case 'factor-den': {
        const methods = kind === 'factor-num' ? facts.numMethods : facts.denMethods
        const byMethod = methods.length > 0 ? methods.map((k) => METHOD_CARDS[k]) : [ids.sumCancel]
        return facts.root ? [...byMethod, ids.blockRules] : byMethod
      }
      case 'decimal':
        return [ids.decimal]
      case 'order':
        return [ids.order]
      case 'part':
        return []
      case 'divide':
        return [ids.polyDivision]
      case 'ansatz':
      case 'coef':
        return [ids.partial]
      case 'imag-power':
      case 'imag-conjugate':
      case 'imag-multiply':
      case 'imag-split':
      case 'imag-sum':
        return [ids.imaginary]
      case 'limit-insert':
      case 'limit-divide':
      case 'limit-value':
        return [ids.limit]
    }
  })()
  // Bausteine wie e^x; mit eigenen Regeln (√x, sin² x + cos² x = 1, e^{2x} : e^x) deren Karte
  if (!facts.blocks) return own
  return [...new Set([...own, facts.blockRules ? ids.blockRules : ids.blocks])]
}

function explainStep(step: FracStep, solution: FracSolution, facts: Facts): Explanation {
  const t = facts.task
  const w = facts.work
  switch (step.kind) {
    case 'lcd': {
      const fractions = w!.terms.flatMap((term, i) => (isWhole(term.part) ? [] : [{ den: shownExpr(term.part.den), poly: factoredPoly(w!.dens[i]) }]))
      const product = polyProduct(fractions.map((f) => f.poly))
      const lcdPoly = factoredPoly(w!.lcd)
      const numbersOnly = fractions.every((f) => constValue(f.poly) !== null)
      const showProduct = fractions.length >= 2 && !polyEquals(product, lcdPoly)
      // Nenner wie x² − 9, die sich zerlegen lassen
      const factored = w!.terms.flatMap((term, i) => {
        const d = w!.dens[i]
        const zerlegt = term.part.den.form === 'expanded' && term.part.den.poly.length >= 2 && (d.factors.length >= 2 || !isOne(d.coef) || d.factors.some((f) => f.exp > 1))
        return zerlegt ? [[shownExpr(term.part.den), factoredExpr(d)] as const] : []
      })
      return explainLcd(
        fractions.map((f) => f.den),
        facts.lcd!,
        // Produkt so, wie man es aus den Nennern hinschreibt: (x² − 1)(x + 1), bei Zahlen und Potenzen ausgerechnet
        showProduct ? (fractions.some((f) => f.poly.length >= 2) ? mul(...fractions.map((f) => f.den)) : polyExpr(product)) : null,
        numbersOnly,
        factored,
      )
    }
    case 'expand':
      return explainExpand(
        w!.terms.map((term, i) => ({
          part: partExpr(term.part),
          factor: isOneFactored(w!.factorsUp[i]) ? null : factoredExpr(w!.factorsUp[i]),
          whole: isWhole(term.part),
        })),
        facts.lcd ?? factoredExpr(w!.lcd),
      )
    case 'combine': {
      const sum = signedSum(w!.terms.map((term, i) => ({ sign: term.sign, expr: polyExpr(w!.products[i]) })))
      const bracket = w!.terms.some((term, i) => term.sign < 0 && w!.products[i].length >= 2)
      return explainCombine(sum, nicePolyExpr(w!.numerator), factoredExpr(w!.lcd), bracket)
    }
    case 'cancel': {
      const before = solution.beforeCancel.num
      const rest = constValue(solution.reduced.num)
      const oneLeft = rest !== null && isOne(ratAbs(rest)) && !(constValue(before) !== null && isOne(ratAbs(constValue(before)!)))
      return explainCancel(step.detail!, facts.cancelPowers, oneLeft, facts.minusKept)
    }
    case 'multiply': {
      if (t.kind === 'product') return explainMultiply(multipliedExpr(t.left, t.right), isWhole(t.left) || isWhole(t.right))
      if (t.kind === 'quotient') return explainMultiply(multipliedExpr(t.left, reciprocalPart(t.right)), isWhole(t.left))
      return explainMultiply(step.expr!, false)
    }
    case 'reciprocal':
      if (t.kind === 'complex') {
        const bottom = sideOf(t.bottom, t.hints)
        return explainReciprocal(bottom.expr, reciprocalExpr(bottom), true)
      }
      if (t.kind === 'quotient') return explainReciprocal(partExpr(t.right), partExpr(reciprocalPart(t.right)), false)
      return explainReciprocal(step.expr!, step.expr!, false)
    case 'factor-num':
    case 'factor-den': {
      const isNum = step.kind === 'factor-num'
      const shown = t.kind === 'reduce' ? (isNum ? t.part.num : t.part.den) : null
      return explainFactor(shown ? shownExpr(shown) : step.detail!, step.detail!, isNum, isNum ? facts.numMethods : facts.denMethods)
    }
    case 'inner-num':
    case 'inner-den':
      return explainInner(step.kind === 'inner-num')
    case 'left':
    case 'right':
      return explainSide(step.kind === 'left')
    case 'inner-complex': {
      const o = facts.original
      return explainInnerComplex(o.kind === 'nested' ? taskExpr(innerTask(o, o.hints)) : step.expr!, step.answer!)
    }
    case 'multiply-out': {
      if (facts.conjugate) return explainConjugateProduct(step.from!, step.detail!, facts.conjugate === 'num')
      const o = facts.original
      const shown = o.kind === 'reduce' && o.part.num.form === 'binomial' ? o.part.num : null
      const power = shown?.power ?? 2
      const square: [Expr, Expr] = shown ? [pow(polyExpr(shown.base), num(power)), nicePolyExpr(polyPow(shown.base, power))] : [step.from!, step.detail!]
      return explainMultiplyOut(square, step.from!, step.detail!, power === 3)
    }
    case 'conjugate': {
      const o = facts.original
      const side = o.kind === 'reduce' ? (facts.conjugate === 'num' ? o.part.num : o.part.den) : null
      return explainConjugate(side ? shownExpr(side) : step.detail!, step.detail!, facts.conjugate === 'num')
    }
    case 'identity':
      return explainRule(facts.original.rule?.kind === 'root' ? 'root' : 'trig', step.from!, step.detail!)
    case 'imag-power':
      return explainImagPower(taskExpr(facts.original), step.expr!)
    case 'imag-conjugate':
      return explainImagConjugate(facts.imagDen ?? step.detail!, step.detail!)
    case 'imag-multiply':
      return explainImagMultiply(step.from!, step.detail!)
    case 'imag-split':
      return explainImagSplit(step.from!, step.detail!)
    case 'imag-sum':
      return explainImagSum(step.from!, step.expr!)
    case 'decimal':
    case 'order':
    case 'part':
    case 'divide':
    case 'ansatz':
    case 'coef':
    case 'limit-insert':
    case 'limit-divide':
    case 'limit-value':
      // Rechenbäume plant planTree, Partialbrüche planPartial; diese Schritte kommen hier nicht vor
      return { detailed: STEP_NAMES[step.kind], short: STEP_NAMES[step.kind] }
  }
}

// --- Bildschirm-Schritt ---

function joinExplanations(parts: readonly Explanation[]): Explanation {
  return { detailed: parts.map((p) => p.detailed).join('\n'), short: parts.map((p) => p.short).join(' ') }
}

function buildStep(d: Draft, index: number, facts: Facts, rng: Rng, focus?: string): GuidedStep {
  const correct: Choice = { id: 'richtig', content: m(d.correct), correct: true, expr: d.correct }
  const wrong = pickWrong(d.wrongs, toLatex(d.correct), rng, focus).map(
    ({ wrong: w, shown }, i): Choice => ({
      id: `falsch-${i + 1}`,
      content: m(shown),
      correct: false,
      expr: shown,
      errorRuleId: w.rule.id,
      whyWrong: explainFractionError(w.rule.id),
    }),
  )
  return {
    id: `${index + 1}-${d.kinds.join('-')}`,
    title: titleOf(d.kinds),
    question: questionOf(d.kinds, facts),
    choices: rng.shuffle([correct, ...wrong]),
    hint: hintOf(d.kinds[0], facts),
    explanation: joinExplanations(d.explanations),
    // Doppelbrüche in voller Größe, sonst sind die inneren Brüche am Handy zu klein
    established: d.lines.map(readableLatex),
    cards: [...new Set(d.kinds.flatMap((k) => cardsOf(k, facts)))],
  }
}

// Bis zu MAX_WRONG_CHOICES falsche Antworten, möglichst aus verschiedenen Fehlern, jede anders
// geschrieben als die richtige und die übrigen. Gezieltes Üben: der gesuchte Fehler zuerst.
function pickWrong<T extends { readonly wrong: FracWrong; readonly shown: Expr }>(candidates: readonly T[], correct: string, rng: Rng, focus?: string): T[] {
  const seen = new Set([correct])
  const unique = candidates.filter((c) => {
    const latex = toLatex(c.shown)
    if (seen.has(latex)) return false
    seen.add(latex)
    return true
  })
  const byRule = new Map<string, T>()
  for (const c of unique) if (!byRule.has(c.wrong.rule.id)) byRule.set(c.wrong.rule.id, c)
  const distinct = rng.shuffle([...byRule.values()])
  const rest = rng.shuffle(unique.filter((c) => !distinct.includes(c)))
  const ordered = [...distinct, ...rest]
  const focused = ordered.findIndex((c) => c.wrong.rule.id === focus)
  if (focused > 0) ordered.unshift(...ordered.splice(focused, 1))
  return ordered.slice(0, MAX_WRONG_CHOICES)
}
