import { type Derivation, allNodes, derive } from '../derive/derive.ts'
import { type WrongAnswer, wrongAnswers } from '../derive/errorRules.ts'
import { RULES, type RuleId } from '../derive/rules.ts'
import {
  type Explanation,
  RULE_OPTIONS,
  explainCalculation,
  explainConstantKept,
  explainError,
  explainRuleChoice,
  explainWrongRuleChoice,
  hintFor,
} from '../explain/texts.ts'
import { m, prime, tex } from '../explain/format.ts'
import { toLatex } from '../expr/print.ts'
import type { Expr } from '../expr/types.ts'
import { type Rng, createRng } from '../random/rng.ts'
import { generateDerivativeTask } from '../tasks/derivativeTerms.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'

// Schrittplaner für den geführten Modus: macht aus dem Rechenweg der Engine eine Folge
// von Bildschirm-Schritten mit Auswahl-Antworten. Falsche Antworten stammen aus den
// Fehlerregeln, jede mit eigener Erklärung. Texte mit Formeln im Format von richText.ts.

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
  // der Term, um den es in diesem Schritt geht (bei Ableitungsschritten)
  readonly subject?: Expr
  // warum die richtige Antwort stimmt
  readonly explanation: Explanation
  // was nach dem Schritt feststeht, als LaTeX-Zeile, z. B. (4x^3)' = 12x^2
  readonly established?: string
}

export type GuidedTask = {
  readonly ref: TaskRef
  readonly functionLatex: string
  readonly steps: readonly GuidedStep[]
  readonly result: Expr
  readonly resultLatex: string
}

const MAX_WRONG_CHOICES = 3

export function planGuidedTask(ref: TaskRef): GuidedTask {
  const { task } = generateDerivativeTask(ref)
  if (task.kind !== 'function') throw new Error('Implizites Ableiten kommt in Schritt 11.')
  return planForExpression(task.expr, ref)
}

// Hauptregel: die äußerste Regel, Faktoren davor zählen nicht (−3x² sin x → Produktregel)
export function mainRule(d: Derivation): RuleId {
  return d.rule === 'constantFactor' ? mainRule(d.children[0]) : d.rule
}

export function planForExpression(f: Expr, ref: TaskRef): GuidedTask {
  const root = derive(f)
  const rngFor = (step: number) => createRng(`geführt:${ref.level}:${ref.seed}:${step}`)
  const steps: GuidedStep[] = [ruleStep(root, rngFor(0))]
  if (root.rule === 'sum') {
    root.children.forEach((child, i) => {
      steps.push(derivativeStep(child, `Summand ${i + 1} von ${root.children.length}`, `Leite den Summanden ${m(child.input)} ab.`, rngFor(i + 1)))
    })
  } else {
    steps.push(derivativeStep(root, 'Ableitung', `Leite ${m(f)} ab.`, rngFor(1)))
  }
  return {
    ref,
    functionLatex: `f(x) = ${toLatex(f)}`,
    steps,
    result: root.result,
    resultLatex: `f'(x) = ${toLatex(root.result)}`,
  }
}

function ruleStep(root: Derivation, rng: Rng): GuidedStep {
  const correct = mainRule(root)
  // Falsche Optionen nur aus Regeln, die im ganzen Rechenweg nirgends gebraucht werden
  const used = new Set(allNodes(root).map((n) => n.rule))
  const wrong = RULE_OPTIONS.filter((r) => r !== correct && !used.has(r))
  const choices: Choice[] = [
    { id: 'regel-richtig', content: RULES[correct].name, caption: tex(RULES[correct].formula), correct: true },
    ...wrong.map((r) => ({
      id: `regel-${r}`,
      content: RULES[r].name,
      caption: tex(RULES[r].formula),
      correct: false,
      whyWrong: explainWrongRuleChoice(r, correct, root),
    })),
  ]
  return {
    id: 'regel',
    title: 'Regel wählen',
    question: 'Welche Regel wendest du als Erstes an?',
    choices: rng.shuffle(choices),
    hint: 'Schau, wie die Teile des ganzen Terms verbunden sind: mit $+$ oder $-$, mit $\\cdot$, als Bruch oder ineinander eingesetzt.',
    explanation: explainRuleChoice(correct),
  }
}

// Wählt bis zu MAX_WRONG_CHOICES falsche Ergebnisse, möglichst aus verschiedenen Fehlerregeln
function pickWrongAnswers(answers: readonly WrongAnswer[], rng: Rng): WrongAnswer[] {
  const byRule = new Map<string, WrongAnswer>()
  for (const w of answers) if (!byRule.has(w.errorRule.id)) byRule.set(w.errorRule.id, w)
  const distinct = rng.shuffle([...byRule.values()])
  const rest = rng.shuffle(answers.filter((w) => !distinct.includes(w)))
  return [...distinct, ...rest].slice(0, MAX_WRONG_CHOICES)
}

function derivativeStep(node: Derivation, title: string, question: string, rng: Rng): GuidedStep {
  const local = derive(node.input)
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
    wrongChoices = pickWrongAnswers(wrongAnswers(node.input, local), rng).map((w, i) => ({
      id: `falsch-${i + 1}`,
      content: m(w.result),
      correct: false,
      expr: w.result,
      errorRuleId: w.errorRule.id,
      whyWrong: explainError(w),
    }))
  }
  return {
    id: `ableitung-${title}`,
    title,
    question,
    choices: rng.shuffle([correct, ...wrongChoices]),
    hint: hintFor(local),
    subject: node.input,
    explanation: explainCalculation(local),
    established: `${prime(node.input)} = ${toLatex(local.result)}`,
  }
}

