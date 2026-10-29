import { type Derivation, PLACEHOLDER, allNodes, derive } from '../derive/derive.ts'
import { type WrongAnswer, wrongAnswers } from '../derive/errorRules.ts'
import { RULES, type RuleId } from '../derive/rules.ts'
import { cardIdsFor } from '../explain/cards.ts'
import {
  type Explanation,
  EXTRA_RULE_OPTION,
  RULE_OPTIONS,
  explainAssembly,
  explainCalculation,
  explainConstantKept,
  explainError,
  explainRuleChoice,
  explainWrongRuleChoice,
  hintFor,
  hintForAssembly,
  keepFactorNote,
} from '../explain/texts.ts'
import { m, prime, tex } from '../explain/format.ts'
import { toLatex } from '../expr/print.ts'
import { type Expr, add, asRational, div, mulDot, neg, num, pow, variable } from '../expr/types.ts'
import { type Rng, createRng } from '../random/rng.ts'
import { isInteger } from '../rational.ts'
import { generateDerivativeTask } from '../tasks/derivativeTerms.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'

// Schrittplaner für den geführten Modus: macht aus dem Rechenweg der Engine eine Folge
// von Bildschirm-Schritten mit Auswahl-Antworten. Falsche Antworten stammen aus den
// Fehlerregeln, jede mit eigener Erklärung. Texte mit Formeln im Format von richText.ts.
//
// Ablauf: zuerst „Welche Regel?", dann je nach Hauptregel
// - Summe: je Summand ein Schritt
// - Produkt, Quotient: u' und v' einzeln, dann in die Regel einsetzen
// - Kette: äußere Ableitung (nach u), innere Ableitung, dann zusammensetzen;
//   ab Stufe 4 gröber: innere Ableitung, dann gleich zusammensetzen
// Die Ableitung eines Teils ist immer ein einzelner Schritt, auch wenn darin selbst
// wieder eine Regel steckt (z. B. u = e^{x^2} bei der Produktregel).

export type Choice = {
  readonly id: string
  // Inhalt der Antwort (Text mit Formeln), z. B. "$12x^{2}$" oder "Summenregel"
  readonly content: string
  // kleine Zusatzzeile, z. B. die Formel einer Regel
  readonly caption?: string
  readonly correct: boolean
  // bei Formel-Antworten: der Term (für Tests und spätere Auswertungen)
  readonly expr?: Expr
  // bei falschen Antworten: welcher typische Fehler dahintersteckt und warum er falsch ist
  readonly errorRuleId?: string
  readonly whyWrong?: Explanation
}

export type GuidedStep = {
  readonly id: string
  // kurze Überschrift, z. B. „Summand 2 von 3"
  readonly title: string
  readonly question: string
  readonly choices: readonly Choice[]
  readonly hint: string
  // bei Ableitungsschritten: Die richtige Antwort ist die Ableitung von subject nach variable
  readonly subject?: Expr
  readonly variable?: string
  // warum die richtige Antwort stimmt
  readonly explanation: Explanation
  // was nach dem Schritt feststeht, als LaTeX-Zeile, z. B. (4x^3)' = 12x^2
  readonly established?: string
  // passende Lernkarten (Ids aus cards.ts); bei der Regelwahl die Karten aller angebotenen Regeln
  readonly cards: readonly string[]
}

export type GuidedTask = {
  readonly ref: TaskRef
  // abzuleitende Funktion (Aufgabenform)
  readonly expr: Expr
  readonly functionLatex: string
  readonly steps: readonly GuidedStep[]
  // Welche Regel ganz außen? (auch, wenn die Frage danach entfällt; Tipp im freien Modus)
  readonly ruleHint: Explanation
  readonly result: Expr
  readonly resultLatex: string
  // Lernkarten zu allen Regeln der Aufgabe, außen zuerst
  readonly cards: readonly string[]
}

const MAX_WRONG_CHOICES = 3

// focus: Id einer Fehlerregel für gezieltes Üben; dieser Fehler erscheint sicher als Antwort,
// wo er passieren kann
export function planGuidedTask(ref: TaskRef, focus?: string): GuidedTask {
  const { task } = generateDerivativeTask(ref)
  if (task.kind !== 'function') throw new Error('Implizites Ableiten kommt in Schritt 11.')
  return planForExpression(task.expr, ref, focus)
}

// Feste Faktoren vor der Hauptregel (−3 bei −3x² sin x) und der Knoten dahinter
export function splitFactors(d: Derivation): { factors: Derivation[]; core: Derivation } {
  const factors: Derivation[] = []
  let core = d
  while (core.rule === 'constantFactor') {
    factors.push(core)
    core = core.children[0]
  }
  return { factors, core }
}

// Hauptregel: die äußerste Regel, Faktoren davor zählen nicht (−3x² sin x → Produktregel)
export function mainRule(d: Derivation): RuleId {
  return splitFactors(d).core.rule
}

// Ab dieser Stufe wird der Rechenweg gröber: Geübtes ist ein einzelner Schritt
const COARSE_FROM_LEVEL = 4

export function planForExpression(f: Expr, ref: TaskRef, focus?: string): GuidedTask {
  const root = derive(f)
  const rngFor = (step: number) => createRng(`geführt:${ref.level}:${ref.seed}:${step}`)
  const rule = ruleStep(root, rngFor(0))
  const coarse = ref.level >= COARSE_FROM_LEVEL
  const steps = [...(rule ? [rule] : []), ...partSteps(root, coarse).map((build, i) => build({ rng: rngFor(i + 1), focus }))]
  const { factors, core } = splitFactors(root)
  return {
    ref,
    expr: f,
    functionLatex: `f(x) = ${toLatex(f)}`,
    steps,
    ruleHint: explainRuleChoice(core.rule, factors),
    result: root.result,
    resultLatex: `f'(x) = ${toLatex(root.result)}`,
    cards: cardIdsFor(allNodes(root).map((n) => n.rule)),
  }
}

// Die Schritte nach der Regelwahl, je Hauptregel
function partSteps(root: Derivation, coarse: boolean): Array<(ctx: StepContext) => GuidedStep> {
  const { factors, core } = splitFactors(root)

  if (root.rule === 'sum') {
    return root.children.map((child, i) => (ctx: StepContext) =>
      derivativeStep(child, { title: `Summand ${i + 1} von ${root.children.length}`, question: `Leite den Summanden ${m(child.input)} ab.` }, ctx),
    )
  }

  if (core.rule === 'product' || core.rule === 'quotient') {
    const [du, dv] = core.children
    const u = toLatex(core.parts.u!)
    const v = toLatex(core.parts.v!)
    const isQuotient = core.rule === 'quotient'
    const names = isQuotient ? `Oben steht $u = ${u}$, unten $v = ${v}$.` : `Die Faktoren sind $u = ${u}$ und $v = ${v}$.`
    // Regel mit Platzhaltern und den Faktoren davor, z. B. -3 \cdot (u' \cdot v + u \cdot v')
    const [U, V, dU, dV] = ['u', 'v', "u'", "v'"].map(variable)
    const pattern = isQuotient ? div(add(mulDot(dU, V), neg(mulDot(U, dV))), pow(V, num(2))) : add(mulDot(dU, V), mulDot(U, dV))
    return [
      (ctx) => derivativeStep(du, { title: isQuotient ? 'Zähler ableiten' : 'Ersten Faktor ableiten', question: `${names} Was ist $u'$?`, name: "u'" }, ctx),
      (ctx) => derivativeStep(dv, { title: isQuotient ? 'Nenner ableiten' : 'Zweiten Faktor ableiten', question: `Was ist $v'$ für $v = ${v}$?`, name: "v'" }, ctx),
      (ctx) =>
        assembleStep(root, 'Einsetzen', `Setze in die ${RULES[core.rule].name} ein: $f'(x) = ${toLatex(withFactors(factors, pattern))}$`, ctx),
    ]
  }

  if (core.rule === 'chain') {
    const [outer, inner] = core.children
    const innerLatex = toLatex(core.parts.inner!)
    const factorNote = keepFactorNote(factors)
    const innerStep = (ctx: StepContext) =>
      derivativeStep(inner, { title: 'Innere Ableitung', question: `Leite die innere Funktion $${PLACEHOLDER} = ${innerLatex}$ ab.`, name: `${PLACEHOLDER}'` }, ctx)
    if (coarse) {
      return [
        innerStep,
        (ctx) =>
          assembleStep(
            root,
            'Zusammensetzen',
            `Die äußere Funktion ist ${m(core.parts.outer!)} mit $${PLACEHOLDER} = ${innerLatex}$. Kettenregel: äußere Ableitung mal innere Ableitung.${factorNote ? ` ${factorNote}` : ''} Was ist $f'(x)$?`,
            ctx,
            true,
          ),
      ]
    }
    return [
      (ctx) =>
        derivativeStep(
          outer,
          {
            title: 'Äußere Ableitung',
            question: `Setze $${PLACEHOLDER} = ${innerLatex}$. Die äußere Funktion ist dann ${m(core.parts.outer!)}. Leite sie nach $${PLACEHOLDER}$ ab.`,
          },
          ctx,
        ),
      innerStep,
      (ctx) =>
        assembleStep(
          root,
          'Zusammensetzen',
          `Kettenregel: äußere Ableitung mal innere Ableitung, dabei $${PLACEHOLDER} = ${innerLatex}$ wieder einsetzen.${factorNote ? ` ${factorNote}` : ''} Was ist $f'(x)$?`,
          ctx,
        ),
    ]
  }

  return [(ctx) => derivativeStep(root, { title: 'Ableitung', question: `Leite ${m(root.input)} ab.` }, ctx)]
}

// Regeln, die nach einem Umschreiben ebenfalls zum Ziel führen und deshalb nie als falsch gelten:
// u/v = u · v⁻¹ und sin² x = sin x · sin x gehen auch mit der Produktregel
function equivalentRules(core: Derivation): RuleId[] {
  if (core.rule === 'quotient') return ['product']
  const outer = core.parts.outer
  if (core.rule === 'chain' && outer?.kind === 'pow' && outer.base.kind === 'var') {
    const n = asRational(outer.exp)
    if (n && isInteger(n) && n.n >= 2n) return ['product']
  }
  return []
}

// „Welche Regel?" Ohne passende falsche Optionen entfällt der Schritt (null).
function ruleStep(root: Derivation, rng: Rng): GuidedStep | null {
  const { factors, core } = splitFactors(root)
  const correct = core.rule
  // Falsche Optionen nur aus Regeln, die im ganzen Rechenweg nirgends gebraucht werden
  const excluded = new Set<RuleId>([...allNodes(root).map((n) => n.rule), ...equivalentRules(core)])
  const wrong = RULE_OPTIONS.filter((r) => r !== correct && !excluded.has(r))
  // Bei verschachtelten Termen bleiben oft zu wenige: dann auch die Faktorregel, falls sie nirgends vorkommt
  if (wrong.length < 2 && !excluded.has(EXTRA_RULE_OPTION)) wrong.push(EXTRA_RULE_OPTION)
  if (wrong.length === 0) return null
  // Regel und Antwort gemeinsam mischen: Die Karten folgen der Reihenfolge der Antworten
  const options = rng.shuffle<{ rule: RuleId; choice: Choice }>([
    { rule: correct, choice: { id: 'regel-richtig', content: RULES[correct].name, caption: tex(RULES[correct].formula), correct: true } },
    ...wrong.map((r) => ({
      rule: r,
      choice: {
        id: `regel-${r}`,
        content: RULES[r].name,
        caption: tex(RULES[r].formula),
        correct: false,
        whyWrong: explainWrongRuleChoice(r, correct, root),
      },
    })),
  ])
  return {
    id: 'regel',
    title: 'Regel wählen',
    question: 'Welche Regel wendest du als Erstes an?',
    choices: options.map((o) => o.choice),
    hint: 'Schau, wie die Teile des ganzen Terms verbunden sind: mit $+$ oder $-$, mit $\\cdot$, als Bruch oder ineinander eingesetzt.',
    explanation: explainRuleChoice(correct, factors),
    // Karten aller angebotenen Regeln, damit die Karten die Antwort nicht verraten
    cards: cardIdsFor(options.map((o) => o.rule)),
  }
}

// Wählt bis zu MAX_WRONG_CHOICES falsche Antworten, möglichst aus verschiedenen Fehlerregeln
function pickWrong<T extends { readonly answer: WrongAnswer }>(candidates: readonly T[], rng: Rng, focus?: string): T[] {
  const byRule = new Map<string, T>()
  for (const c of candidates) if (!byRule.has(c.answer.errorRule.id)) byRule.set(c.answer.errorRule.id, c)
  const distinct = rng.shuffle([...byRule.values()])
  const rest = rng.shuffle(candidates.filter((c) => !distinct.includes(c)))
  const ordered = [...distinct, ...rest]
  // Gezieltes Üben: Der gesuchte Fehler kommt sicher mit (gleiche Zufallszüge, nur umsortiert)
  const focused = ordered.findIndex((c) => c.answer.errorRule.id === focus)
  if (focused > 0) ordered.unshift(...ordered.splice(focused, 1))
  return ordered.slice(0, MAX_WRONG_CHOICES)
}

// Was jeder Schritt-Bauer bekommt: eigenen Zufall und den Fehler für gezieltes Üben
type StepContext = {
  readonly rng: Rng
  readonly focus?: string
}

type StepText = {
  readonly title: string
  readonly question: string
  // Name des Ergebnisses für „Bisher", z. B. u'
  readonly name?: string
}

// Ein Teilterm wird in einem Schritt abgeleitet; die Antworten sind fertig zusammengefasst
function derivativeStep(node: Derivation, { title, question, name }: StepText, { rng, focus }: StepContext): GuidedStep {
  const local = derive(node.input, node.variable)
  const correct: Choice = { id: 'richtig', content: m(local.result), correct: true, expr: local.result }
  let wrongChoices: Choice[]
  if (local.rule === 'constant') {
    wrongChoices = [
      {
        id: 'falsch-1',
        content: m(node.input),
        correct: false,
        expr: node.input,
        errorRuleId: 'constant-summand-kept',
        whyWrong: explainConstantKept(node.input),
      },
    ]
  } else {
    const candidates = wrongAnswers(node.input, local).map((answer) => ({ answer }))
    wrongChoices = pickWrong(candidates, rng, focus).map(({ answer }, i) => ({
      id: `falsch-${i + 1}`,
      content: m(answer.result),
      correct: false,
      expr: answer.result,
      errorRuleId: answer.errorRule.id,
      whyWrong: explainError(answer),
    }))
  }
  const calculation = `${prime(node.input)} = ${toLatex(local.result)}`
  return {
    id: `ableitung-${title}`,
    title,
    question,
    choices: rng.shuffle([correct, ...wrongChoices]),
    hint: hintFor(local),
    subject: node.input,
    variable: node.variable,
    explanation: explainCalculation(local),
    established: name ? `${name} = ${calculation}` : calculation,
    cards: cardIdsFor(allNodes(local).map((n) => n.rule)),
  }
}

// Setzt die festen Faktoren wieder vor eine eingesetzte Formel, so wie derive es tut
function withFactors(factors: readonly Derivation[], formula: Expr): Expr {
  return factors.reduceRight((inner, node) => {
    const factor = node.parts.factor!
    if (node.parts.divisor) return div(inner, factor)
    const c = asRational(factor)
    return c && c.n === -1n && c.d === 1n ? neg(inner) : mulDot(factor, inner)
  }, formula)
}

const nodeAt = (d: Derivation, path: readonly number[]): Derivation => path.reduce((n, i) => n.children[i], d)

// Liegt der Knoten im Teilbaum unter `path` (oder ist er es selbst)?
const isWithin = (node: Derivation, path: readonly number[]) => path.every((i, k) => node.path[k] === i)

// Einsetzen in Produkt-, Quotienten- oder Kettenregel. Die Antworten zeigen die eingesetzte
// Formel vor dem Zusammenfassen; die falschen entstehen aus Fehlern an genau dieser Regel.
// withOuter: Bei der Kettenregel zählen auch Fehler beim Ableiten der äußeren Funktion
// (wenn die äußere Ableitung nicht vorher einzeln gefragt wurde).
function assembleStep(root: Derivation, title: string, question: string, { rng, focus }: StepContext, withOuter = false): GuidedStep {
  const { factors, core } = splitFactors(root)
  const formula = withFactors(factors, core.formula)
  const outerPath = [...core.path, 0]
  const candidates = wrongAnswers(root.input, root).flatMap((answer) => {
    if (answer.node === core || (withOuter && core.rule === 'chain' && isWithin(answer.node, outerPath))) {
      return [{ answer, formula: withFactors(factors, nodeAt(answer.derivation, core.path).formula) }]
    }
    if (factors.includes(answer.node) && answer.errorRule.id === 'factor-forgotten') {
      return [{ answer, formula: withFactors(factors.filter((f) => f !== answer.node), core.formula) }]
    }
    return []
  })
  const correct: Choice = { id: 'richtig', content: m(formula), correct: true, expr: formula }
  const wrongChoices = pickWrong(candidates, rng, focus).map(({ answer, formula: wrongFormula }, i) => ({
    id: `falsch-${i + 1}`,
    content: m(wrongFormula),
    correct: false,
    expr: wrongFormula,
    errorRuleId: answer.errorRule.id,
    whyWrong: explainError(answer),
  }))
  return {
    id: `einsetzen-${title}`,
    title,
    question,
    choices: rng.shuffle([correct, ...wrongChoices]),
    hint: hintForAssembly(core, withOuter),
    subject: root.input,
    variable: root.variable,
    explanation: explainAssembly(root, factors, core, formula),
    established: `f'(x) = ${toLatex(formula)}`,
    // Regel zum Einsetzen; ab Stufe 4 wird dabei auch die äußere Funktion abgeleitet
    cards: cardIdsFor([
      core.rule,
      ...(withOuter && core.rule === 'chain' ? allNodes(core.children[0]).map((n) => n.rule) : []),
      ...factors.map((f) => f.rule),
    ]),
  }
}
