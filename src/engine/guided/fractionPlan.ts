import { FRACTION_CARD_IDS } from '../explain/fractionCards.ts'
import {
  FRACTION_HINTS,
  explainCancel,
  explainCombine,
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
import { type Expr, mul, num, pow } from '../expr/types.ts'
import { type FracWrong, fractionWrongAnswers } from '../fraction/errorRules.ts'
import { factoredExpr, factoredPoly, factorize, isOneFactored, productFormExpr, reduceFrac } from '../fraction/factor.ts'
import { fracAtoms, polyExpr } from '../fraction/frac.ts'
import { type Poly, atomsOf, constValue, polyAdd, polyEquals, polyMul, polyNeg, polyProduct, totalDegree } from '../fraction/poly.ts'
import {
  type FracSolution,
  type FracStep,
  type StepKind,
  type SumWork,
  cancelledFactor,
  fractionExpr,
  multipliedExpr,
  nicePolyExpr,
  innerResultPart,
  reciprocalExpr,
  reciprocalPart,
  sideOf,
  signedSum,
  solveFraction,
  workSum,
} from '../fraction/solve.ts'
import {
  type FractionTask,
  innerTask,
  instructionFor,
  isWhole,
  partExpr,
  partsOf,
  replaceInner,
  shownExpr,
  shownPoly,
  taskExpr,
  taskLatex,
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
  const solution = solveFraction(t)
  const wrongs = fractionWrongAnswers(t, solution).filter((w) => !w.freeOnly)
  const facts = factsOf(t, solution, wrongs)
  const raw = rawDrafts(t, solution, wrongs, facts)
  const drafts = arrange(ref.level >= COARSE_FROM_LEVEL ? coarsen(raw, t) : raw, solution, t)
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
  // Wurzel √x in der Aufgabe
  readonly root: boolean
  // Bausteine mit eigenen Regeln: √x, sin² x + cos² x = 1, Potenzen von e^x
  readonly blockRules: boolean
  // beim Kürzen: wie sich Zähler und Nenner der Aufgabe zerlegen lassen
  readonly numMethods: readonly FactorMethod[]
  readonly denMethods: readonly FactorMethod[]
}

// Bausteine der Bruch-Engine (frac.ts): e^x, ln x, sin x, cos x, √x
const BLOCK_ATOMS = ['E', 'L', 'S', 'C', 'R']

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
    blocks: fracAtoms(solution.value).some((atom) => BLOCK_ATOMS.includes(atom)),
    root: fracAtoms(solution.value).includes('R'),
    blockRules: original.rule !== undefined || fracAtoms(solution.value).includes('R') || wrongs.some((w) => w.rule.id === 'frac-cancel-inside'),
    numMethods: t.kind === 'reduce' ? factorMethods(shownPoly(t.part.num), t.hints) : [],
    denMethods: t.kind === 'reduce' ? factorMethods(shownPoly(t.part.den), t.hints) : [],
  }
}

// Wie sich ein Term zerlegen lässt: ausklammern (Zahl, Buchstabe oder Minus vor der Klammer),
// binomische Formel ((a + b)(a − b), (a ± b)²) oder zwei verschiedene Klammern wie bei x² + px + q
export function factorMethods(p: Poly, hints: readonly Poly[]): FactorMethod[] {
  const f = factorize(p, hints)
  const linear = f.factors.filter((g) => g.poly.length === 2 && totalDegree(g.poly) === 1)
  const mirror = (g: Poly) => polyAdd([g[0]], polyNeg([g[1]]))
  const methods: FactorMethod[] = []
  if (!isOne(f.coef) || f.factors.some((g) => g.poly.length === 1)) methods.push('out')
  const binomial = linear.some((g) => g.exp >= 2 || linear.some((h) => h !== g && polyEquals(h.poly, mirror(g.poly))))
  if (binomial) methods.push('binomial')
  else if (linear.length >= 2) methods.push('quadratic')
  return methods
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
      return 'multipliziere die Klammer im Zähler aus und fasse zusammen'
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
      if (facts.root) return FRACTION_HINTS.rootFactor
      const methods = kind === 'factor-num' ? facts.numMethods : facts.denMethods
      const hints = { out: FRACTION_HINTS.factorOut, binomial: FRACTION_HINTS.factorBinomial, quadratic: FRACTION_HINTS.factorQuadratic }
      return methods.length > 0 ? methods.map((k) => hints[k]).join(' ') : FRACTION_HINTS.factor
    }
    case 'inner-num':
    case 'inner-den':
    case 'left':
    case 'right':
      return FRACTION_HINTS.inner
    case 'multiply-out':
      return FRACTION_HINTS.multiplyOut
    case 'identity':
      return facts.original.rule?.kind === 'root' ? FRACTION_HINTS.root : FRACTION_HINTS.trig
    case 'inner-complex':
      return FRACTION_HINTS.innerComplex
  }
}

const METHOD_CARDS: Record<FactorMethod, string> = {
  out: FRACTION_CARD_IDS.factorOut,
  binomial: FRACTION_CARD_IDS.binomial,
  quadratic: FRACTION_CARD_IDS.quadratic,
}

// Karten zu einem Schritt; bei Bausteinen wie e^x zusätzlich deren Karte
function cardsOf(kind: StepKind, facts: Facts): string[] {
  const ids = FRACTION_CARD_IDS
  const terms = facts.termDenominators ? [ids.lcdTerms] : []
  const own = ((): string[] => {
    switch (kind) {
      case 'lcd':
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
        return [ids.binomial]
      case 'identity':
        return [ids.blockRules]
      case 'cancel':
        return [ids.reduce, ...(facts.cancelPowers ? [ids.powers] : []), ...(facts.cancelSums ? [ids.sumCancel] : [])]
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
      const o = facts.original
      const base = o.kind === 'reduce' && o.part.num.form === 'binomial' ? o.part.num.base : null
      const square: [Expr, Expr] = base ? [pow(polyExpr(base), num(2)), nicePolyExpr(polyMul(base, base))] : [step.from!, step.detail!]
      return explainMultiplyOut(square, step.from!, step.detail!)
    }
    case 'identity':
      return explainRule(facts.original.rule?.kind === 'root' ? 'root' : 'trig', step.from!, step.detail!)
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
