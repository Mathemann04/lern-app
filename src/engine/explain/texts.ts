import { type Derivation, allNodes } from '../derive/derive.ts'
import type { WrongAnswer } from '../derive/errorRules.ts'
import { RULES, type RuleId } from '../derive/rules.ts'
import { finalForm } from '../expr/finalForm.ts'
import { toLatex } from '../expr/print.ts'
import { type Expr, asRational, num } from '../expr/types.ts'
import { type Rational, ONE, isInteger, ratSign, ratSub } from '../rational.ts'
import { chain, m, prime, tex } from './format.ts'

// Textbausteine für Erklärungen, Tipps und „Warum ist das falsch?".
// Zwei Stufen: ausführlich (einfache Sprache, Fachbegriffe erklärt) und kurz (nur die Rechnung).
// Alle Formeln kommen aus der Engine, eingesetzt mit den Termen der Aufgabe.

export type Explanation = { readonly detailed: string; readonly short: string }

const numLatex = (r: Rational) => toLatex(num(r))
// Zahl als Faktor vor einem Malpunkt: negative in Klammern
const factorLatex = (r: Rational) => (ratSign(r) < 0 ? `(${numLatex(r)})` : numLatex(r))

const exponentOf = (node: Derivation) => (node.parts.exponent ? asRational(node.parts.exponent) : null)

// Potenzregel mit eingesetzten Zahlen: 3 \cdot x^{3 - 1}
function powerRuleWithNumbers(node: Derivation, n: Rational): string {
  const base = toLatex(node.parts.base!)
  return String.raw`${factorLatex(n)} \cdot ${base}^{${numLatex(n)} - 1}`
}

// --- Rechnung eines Teilbaums erklären ---

function describe(node: Derivation): string[] {
  const { parts } = node
  switch (node.rule) {
    case 'constant':
      return [
        `Eine Zahl ohne $x$ (eine Konstante) ändert sich nicht, wenn sich $x$ ändert. Deshalb ist ihre Ableitung $0$: ${tex(chain(prime(node.input), '0'))}.`,
      ]
    case 'constantFactor': {
      const c = parts.factor ? asRational(parts.factor) : null
      let sentence: string
      if (c && c.n === -1n && c.d === 1n) {
        sentence = `Das Minuszeichen vor ${m(parts.rest!)} bleibt beim Ableiten einfach stehen.`
      } else if (parts.divisor) {
        sentence = `Durch ${m(parts.factor!)} wird nur geteilt. Diese feste Zahl bleibt beim Ableiten stehen (Faktorregel).`
      } else {
        sentence = `Die Zahl ${m(parts.factor!)} ist ein Faktor: Sie wird mit ${m(parts.rest!)} malgenommen. Nach der Faktorregel bleibt ein solcher Faktor beim Ableiten einfach stehen, abgeleitet wird nur ${m(parts.rest!)}.`
      }
      return [sentence, ...node.children.flatMap(describe)]
    }
    case 'rewrite': {
      const equation = tex(chain(node.input, parts.rewritten!))
      const sentence =
        node.input.kind === 'root'
          ? `Schreibe die Wurzel zuerst als Potenz: ${equation}. Eine Wurzel ist eine Potenz mit einem Bruch als Exponent: $\\sqrt[n]{x^m} = x^{\\frac{m}{n}}$.`
          : `Schreibe ${m(node.input)} zuerst als Potenz: ${equation}. Ein $x^n$ im Nenner wird zu $x^{-n}$, also zu einer Potenz mit negativem Exponenten.`
      return [sentence, ...node.children.flatMap(describe)]
    }
    case 'power': {
      const n = exponentOf(node)
      if (node.input.kind === 'var') return [`Die Ableitung von ${m(node.input)} ist $1$.`]
      if (!n) return [`Potenzregel: ${tex(RULES.power.formula)}.`]
      const sentences = [
        `Potenzregel: Du holst den Exponenten (die Hochzahl) ${tex(numLatex(n))} als Faktor nach vorne und ziehst vom Exponenten $1$ ab: ${tex(chain(prime(node.input), powerRuleWithNumbers(node, n), node.result))}.`,
      ]
      const lowered = numLatex(ratSub(n, ONE))
      if (ratSign(n) < 0) {
        sentences.push(
          `Vorsicht beim negativen Exponenten: Durch das Abziehen wird er kleiner, ${tex(`${numLatex(n)} - 1 = ${lowered}`)}.`,
        )
      } else if (!isInteger(n)) {
        sentences.push(`Mit Brüchen gerechnet: ${tex(`${numLatex(n)} - 1 = ${lowered}`)}.`)
      }
      return sentences
    }
    default:
      return [`${RULES[node.rule].name}: ${tex(RULES[node.rule].formula)}.`, ...node.children.flatMap(describe)]
  }
}

function shortLines(node: Derivation): string[] {
  const rewrites = allNodes(node)
    .filter((n) => n.rule === 'rewrite')
    .map((n) => tex(chain(n.input, n.parts.rewritten!)))
  const calculations: string[] = []
  const visit = (n: Derivation) => {
    n.children.forEach(visit)
    if (n.rule === 'rewrite' || (n.rule === 'power' && n.input.kind === 'var' && n !== node)) return
    calculations.push(tex(chain(prime(n.input), n.formula, n.result)))
  }
  visit(node)
  const last = tex(chain(prime(node.input), node.result))
  const lines = [...rewrites, ...calculations]
  if (!lines.at(-1)?.startsWith(`$${prime(node.input)}`)) lines.push(last)
  return lines
}

// Warum stimmt das Ergebnis dieses Teilbaums?
export function explainCalculation(node: Derivation): Explanation {
  // „Zusammen" nur, wenn mehrere Regeln beteiligt waren; sonst wiederholt es nur den Satz davor
  const summary = allNodes(node).length > 1 ? [`Zusammen: ${tex(chain(prime(node.input), node.result))}.`] : []
  return {
    detailed: [...describe(node), ...summary].join('\n'),
    short: shortLines(node).join('\n'),
  }
}

// --- Tipps (vor dem Antworten) ---

export function hintFor(node: Derivation): string {
  if (node.rule === 'constant') return 'Ändert sich eine Zahl ohne $x$, wenn sich $x$ ändert?'
  const nodes = allNodes(node)
  const rewrite = nodes.find((n) => n.rule === 'rewrite')
  if (rewrite?.input.kind === 'div') {
    return 'Schreibe den Bruch zuerst als Potenz: $\\frac{1}{x^n} = x^{-n}$. Dann hilft die Potenzregel.'
  }
  if (rewrite?.input.kind === 'root') {
    return 'Schreibe die Wurzel zuerst als Potenz: $\\sqrt[n]{x^m} = x^{\\frac{m}{n}}$. Dann hilft die Potenzregel.'
  }
  if (nodes.some((n) => n.rule === 'power' && n.input.kind !== 'var')) {
    return `Potenzregel: ${tex(RULES.power.formula)}. Ein Faktor davor bleibt einfach stehen.`
  }
  if (nodes.some((n) => n.rule === 'power')) return 'Schreibe $x$ als $x^1$ und nutze die Potenzregel.'
  return `Denk an die ${RULES[node.rule].name}: ${tex(RULES[node.rule].formula)}.`
}

// --- „Welche Regel brauchst du?" ---

export type RuleOption = 'sum' | 'product' | 'quotient' | 'chain'
export const RULE_OPTIONS: readonly RuleOption[] = ['sum', 'product', 'quotient', 'chain']

const STRUCTURE: Record<RuleOption, string> = {
  sum: 'eine Summe: Seine Teile (die Summanden) sind mit $+$ oder $-$ verbunden',
  product: 'ein Produkt: Zwei Teile, die beide $x$ enthalten, werden malgenommen',
  quotient: 'ein Bruch, bei dem oben und unten $x$ vorkommt',
  chain: 'eine Verkettung: Eine Funktion ist in eine andere eingesetzt',
}

const STRUCTURE_SHORT: Record<RuleOption, string> = {
  sum: 'eine Summe',
  product: 'ein Produkt',
  quotient: 'ein Bruch',
  chain: 'eine Verkettung',
}

const NOT_SHORT: Record<RuleOption, string> = {
  sum: 'keine Summe',
  product: 'kein Produkt',
  quotient: 'kein Bruch',
  chain: 'keine Verkettung',
}

const WHEN_NEEDED: Record<RuleOption, string> = {
  sum: 'Die Summenregel brauchst du, wenn der ganze Term eine Summe ist, z. B. $x^2 + \\sin x$.',
  product:
    'Die Produktregel brauchst du, wenn zwei Teile, die beide $x$ enthalten, malgenommen werden, z. B. $x^2 \\cdot \\sin x$.',
  quotient:
    'Die Quotientenregel brauchst du, wenn der ganze Term ein Bruch ist, bei dem oben und unten $x$ vorkommt, z. B. $\\frac{\\sin x}{x}$.',
  chain:
    'Die Kettenregel brauchst du, wenn eine Funktion in eine andere eingesetzt ist, z. B. $\\sin(3x)$: Dort steckt $3x$ im Sinus.',
}

const isRuleOption = (rule: RuleId): rule is RuleOption => (RULE_OPTIONS as readonly string[]).includes(rule)

export function explainRuleChoice(correct: RuleId): Explanation {
  const rule = RULES[correct]
  if (!isRuleOption(correct)) return { detailed: `${rule.name}: ${tex(rule.formula)}.`, short: tex(rule.formula) }
  const extra = correct === 'sum' ? ' Du leitest jeden Summanden einzeln ab und zählst die Ergebnisse wieder zusammen.' : ''
  return {
    detailed: `Richtig erkannt: Dein Term ist ${STRUCTURE[correct]}. Dafür gibt es die ${rule.name}: ${tex(rule.formula)}.${extra}`,
    short: `${STRUCTURE_SHORT[correct].replace(/^\w/, (c) => c.toUpperCase())}: ${tex(rule.formula)}.`,
  }
}

export function explainWrongRuleChoice(chosen: RuleOption, correct: RuleId, root: Derivation): Explanation {
  const correctName = RULES[correct].name
  if (!isRuleOption(correct)) {
    return {
      detailed: `${WHEN_NEEDED[chosen]} Hier passt sie nicht; du brauchst zuerst die ${correctName}.`,
      short: `Hier passt zuerst die ${correctName}.`,
    }
  }
  const notes: string[] = []
  const nodes = allNodes(root)
  if (chosen === 'product' && nodes.some((n) => n.rule === 'constantFactor' && n.parts.factor?.kind === 'num')) {
    notes.push('Eine Zahl vor einem Term, z. B. $4x^3$, ist kein Fall für die Produktregel. Dafür gibt es die einfachere Faktorregel.')
  }
  const innerFraction = nodes.find((n) => n !== root && n.input.kind === 'div')
  if (chosen === 'quotient' && innerFraction) {
    notes.push(`Der Bruch ${m(innerFraction.input)} ist nur ein Teil des Terms. Den leitest du später einzeln ab.`)
  }
  return {
    detailed: [
      `${WHEN_NEEDED[chosen]} Dein Term ist aber ${STRUCTURE[correct]}. Deshalb brauchst du zuerst die ${correctName}.`,
      ...notes,
    ].join('\n'),
    short: `Der ganze Term ist ${STRUCTURE_SHORT[correct]}, ${NOT_SHORT[chosen]}.`,
  }
}

// --- „Warum ist das falsch?" ---

// Kennzeichen des allgemeinen Rückfalltexts (für Tests: Stufe 1 braucht eigene Texte)
export const FALLBACK_MARKER = 'Typischer Fehler:'

type ErrorContext = {
  readonly node: Derivation
  readonly input: Expr
  readonly correct: Expr
  readonly wrong: Expr
  readonly n: Rational | null
}

const ERROR_TEXTS: Record<string, (c: ErrorContext) => Explanation> = {
  'power-exponent-not-reduced': ({ input, correct, wrong }) => ({
    detailed: `Du hast den Exponenten stehen lassen. Bei der Potenzregel holst du den Exponenten nach vorne und verringerst ihn danach um $1$. Richtig ist ${tex(chain(prime(input), correct))}, nicht ${m(wrong)}.`,
    short: `Exponent nicht verringert: ${tex(chain(prime(input), correct))}.`,
  }),
  'power-negative-wrong-direction': ({ input, correct, n }) => {
    const step = tex(`${numLatex(n!)} - 1 = ${numLatex(ratSub(n!, ONE))}`)
    return {
      detailed: `Bei einem negativen Exponenten heißt „$1$ abziehen", dass er kleiner wird: ${step}. Du hast in die andere Richtung gezählt. Richtig ist ${tex(chain(prime(input), correct))}.`,
      short: `${step}, also ${tex(chain(prime(input), correct))}.`,
    }
  },
  'power-sign-forgotten': ({ input, correct, wrong, n }) => ({
    detailed: `Der Exponent ${tex(numLatex(n!))} kommt mit seinem Minuszeichen nach vorne. Richtig ist ${tex(chain(prime(input), correct))}, nicht ${m(wrong)}.`,
    short: `Minuszeichen vergessen: ${tex(chain(prime(input), correct))}.`,
  }),
  'power-root-factor-forgotten': ({ node, input, correct, n }) => ({
    detailed: `Auch ein Bruch als Exponent kommt bei der Potenzregel als Faktor nach vorne. Du hast den Faktor ${tex(numLatex(n!))} weggelassen. Richtig ist ${tex(chain(prime(input), powerRuleWithNumbers(node, n!), correct))}.`,
    short: `Faktor ${tex(numLatex(n!))} vergessen: ${tex(chain(prime(input), correct))}.`,
  }),
  'power-fraction-numerator-only': ({ input, correct, n }) => {
    const step = tex(`${numLatex(n!)} - 1 = ${numLatex(ratSub(n!, ONE))}`)
    return {
      detailed: `Vom Exponenten ziehst du $1$ als ganze Zahl ab: ${step}. Du hast die $1$ nur vom Zähler abgezogen. Richtig ist ${tex(chain(prime(input), correct))}.`,
      short: `${step}, also ${tex(chain(prime(input), correct))}.`,
    }
  },
  'factor-forgotten': ({ node, input }) => {
    const { factor, rest, divisor } = node.parts
    // Regel mit den Termen der Aufgabe, ohne das Ergebnis vorwegzunehmen
    const rule = divisor
      ? String.raw`${prime(input)} = \frac{${prime(rest!)}}{${toLatex(factor!)}}`
      : String.raw`${prime(input)} = ${toLatex(factor!)} \cdot ${prime(rest!)}`
    return {
      detailed: `Der Faktor ${m(factor!)} ist beim Ableiten verloren gegangen. Nach der Faktorregel bleibt er stehen: ${tex(rule)}.`,
      short: `Faktor ${m(factor!)} vergessen: ${tex(rule)}.`,
    }
  },
}

// Erklärung zu einem falschen Ergebnis: Was genau ist an der Fehlerstelle schiefgegangen?
// Das Endergebnis des ganzen Schritts wird nicht verraten, das rechnet man danach selbst.
export function explainError(wrongAnswer: WrongAnswer): Explanation {
  const { node, errorRule } = wrongAnswer
  const formula = errorRule.apply(node)
  const context: ErrorContext = {
    node,
    input: node.input,
    correct: node.result,
    wrong: formula ? finalForm(formula) : wrongAnswer.result,
    n: exponentOf(node),
  }
  const specific = ERROR_TEXTS[errorRule.id]?.(context)
  return (
    specific ?? {
      detailed: `${FALLBACK_MARKER} ${errorRule.name}. So sieht er allgemein aus: ${tex(errorRule.wrongFormula)}. Richtig ist hier ${tex(chain(prime(node.input), node.result))}.`,
      short: `${errorRule.name}. Richtig: ${tex(chain(prime(node.input), node.result))}.`,
    }
  )
}

// Erklärung, wenn eine Konstante beim Ableiten stehen gelassen wurde
export function explainConstantKept(constant: Expr): Explanation {
  return {
    detailed: `Eine Zahl ohne $x$ (eine Konstante) fällt beim Ableiten weg, sie bleibt nicht stehen. Ihre Ableitung ist $0$: ${tex(chain(prime(constant), '0'))}.`,
    short: `Konstante: ${tex(chain(prime(constant), '0'))}.`,
  }
}


