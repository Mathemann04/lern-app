import { FRACTION_CARD_IDS } from '../explain/fractionCards.ts'
import {
  FRACTION_HINTS,
  explainCancel,
  explainCombine,
  explainExpand,
  explainFactor,
  explainFractionError,
  explainInner,
  explainLcd,
  explainMultiply,
  explainReciprocal,
  fractionTaskHint,
  listing,
} from '../explain/fractionTexts.ts'
import { m } from '../explain/format.ts'
import type { Explanation } from '../explain/texts.ts'
import { toLatex } from '../expr/print.ts'
import { type Expr, num } from '../expr/types.ts'
import { type FracWrong, fractionWrongAnswers } from '../fraction/errorRules.ts'
import { factoredExpr, factoredPoly, isOneFactored } from '../fraction/factor.ts'
import { polyExpr } from '../fraction/frac.ts'
import { atomsOf, constValue, polyEquals, polyProduct } from '../fraction/poly.ts'
import {
  type FracSolution,
  type FracStep,
  type StepKind,
  type SumWork,
  cancelledFactor,
  fractionExpr,
  multipliedExpr,
  nicePolyExpr,
  reciprocalExpr,
  reciprocalPart,
  sideOf,
  signedSum,
  solveFraction,
  workSum,
} from '../fraction/solve.ts'
import { type FractionTask, instructionFor, isWhole, partExpr, shownExpr, shownPoly, taskExpr, taskLatex } from '../fraction/task.ts'
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
// Ein Schritt, zu dem kein typischer Fehler passt, wird nicht einzeln abgefragt: Der Hauptnenner
// steht dann in der Frage zum Erweitern, andere Schritte gehen im nächsten (beim letzten: im
// vorigen) auf. Im letzten Schritt ist die Antwort immer das fertige Ergebnis.

const MAX_WRONG_CHOICES = 3

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
  const solution = solveFraction(t)
  const wrongs = fractionWrongAnswers(t, solution).filter((w) => !w.freeOnly)
  const facts = factsOf(t, solution)
  const drafts = arrange(rawDrafts(t, solution, wrongs, facts), solution)
  const steps = drafts.map((d, i) => buildStep(d, i, facts, createRng(`brueche-geführt:${ref.level}:${ref.seed}:${i}`), focus))
  const excluded = solution.excluded ?? []
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
    ...(excluded.length > 0 ? { resultNote: `Gilt für ${listing(excluded.map((r) => `$x \\neq ${toLatex(num(r))}$`))}.` } : {}),
    cards: [...new Set(steps.flatMap((s) => s.cards))],
  }
}

// --- Was die Texte über die Aufgabe wissen müssen ---

type Facts = {
  readonly task: FractionTask
  readonly work: SumWork | null
  readonly lcd: Expr | null
  // beim Kürzen: Potenzen von Buchstaben fallen weg
  readonly cancelPowers: boolean
}

function factsOf(t: FractionTask, solution: FracSolution): Facts {
  const work = t.kind === 'sum' ? workSum(t.terms, t.hints) : null
  const common = cancelledFactor(solution.beforeCancel, solution.reduced, t.hints)
  const cancelPowers = common !== null && common.factors.some((f) => f.poly.length === 1 && atomsOf(f.poly).length > 0)
  return { task: t, work, lcd: work ? factoredExpr(work.lcd) : null, cancelPowers }
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
  const draft = (step: FracStep): Draft => ({
    kinds: [step.kind],
    correct: step.kind === 'lcd' ? step.detail! : step.expr!,
    wrongs: wrongIn([step.kind]).map((w) => ({ wrong: w, shown: w.stepExpr, final: finalOf(w) })),
    lines: [step.kind === 'lcd' ? `\\text{Hauptnenner: } ${toLatex(step.detail!)}` : `= ${toLatex(step.expr!)}`],
    explanations: [explainStep(step, solution, facts)],
  })

  if (t.kind !== 'product' && t.kind !== 'quotient') return solution.steps.map(draft)

  // Mal und geteilt: Malnehmen und Kürzen sind ein Schritt mit dem fertigen Ergebnis als Antwort
  const reciprocal = solution.steps.filter((s) => s.kind === 'reciprocal').map(draft)
  const multiply = solution.steps.find((s) => s.kind === 'multiply')!
  const cancel = solution.steps.find((s) => s.kind === 'cancel')
  const product: Draft = {
    kinds: cancel ? ['multiply', 'cancel'] : ['multiply'],
    correct: solution.result,
    wrongs: [
      ...wrongIn(['multiply']).flatMap((w) => (w.result ? [{ wrong: w, shown: w.result }] : [])),
      ...wrongIn(['cancel']).map((w) => ({ wrong: w, shown: w.stepExpr })),
    ],
    lines: [`= ${toLatex(multiply.expr!)}`, `= ${toLatex(solution.result)}`],
    explanations: [explainStep(multiply, solution, facts), ...(cancel ? [explainStep(cancel, solution, facts)] : [])],
  }
  return [...reciprocal, product]
}

// Legt Schritte ohne falsche Antworten zusammen; im letzten Schritt ist die Antwort das Ergebnis
function arrange(raw: readonly Draft[], solution: FracSolution): Draft[] {
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
    )
    return merged
  }
  return [...merged, finalDraft(last, solution)]
}

// Letzter Schritt: richtige und falsche Antworten als fertige, gekürzte Ergebnisse
function finalDraft(d: Draft, solution: FracSolution): Draft {
  const result = `= ${toLatex(solution.result)}`
  const lines = d.lines.at(-1) === result ? d.lines : [...d.lines, result]
  return {
    ...d,
    correct: solution.result,
    wrongs: d.wrongs.flatMap((w) => {
      const shown = w.final ?? w.wrong.result
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
    case 'factor-den':
      return FRACTION_HINTS.factor
    case 'inner-num':
    case 'inner-den':
      return FRACTION_HINTS.inner
  }
}

function cardsOf(kind: StepKind, facts: Facts): string[] {
  switch (kind) {
    case 'lcd':
    case 'combine':
    case 'inner-num':
    case 'inner-den':
      return [FRACTION_CARD_IDS.add]
    case 'expand':
      return [FRACTION_CARD_IDS.expand]
    case 'cancel':
      return facts.cancelPowers ? [FRACTION_CARD_IDS.reduce, FRACTION_CARD_IDS.powers] : [FRACTION_CARD_IDS.reduce]
    case 'multiply':
      return [FRACTION_CARD_IDS.multiply]
    case 'reciprocal':
      return [FRACTION_CARD_IDS.divide]
    case 'factor-num':
    case 'factor-den':
      return [FRACTION_CARD_IDS.reduce]
  }
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
      return explainLcd(
        fractions.map((f) => f.den),
        facts.lcd!,
        showProduct ? polyExpr(product) : null,
        numbersOnly,
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
      return explainCancel(step.detail!, facts.cancelPowers, oneLeft)
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
      return explainFactor(shown ? polyExpr(shownPoly(shown)) : step.detail!, step.detail!, isNum)
    }
    case 'inner-num':
    case 'inner-den':
      return explainInner(step.kind === 'inner-num')
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
    established: d.lines,
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
