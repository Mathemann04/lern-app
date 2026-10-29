import { type Derivation, PLACEHOLDER, allNodes } from '../derive/derive.ts'
import type { WrongAnswer } from '../derive/errorRules.ts'
import { RULES, type RuleId } from '../derive/rules.ts'
import { finalForm } from '../expr/finalForm.ts'
import { toLatex } from '../expr/print.ts'
import { substitute } from '../expr/substitute.ts'
import { type Expr, asRational, fn, num, pow } from '../expr/types.ts'
import { type Rational, ONE, isInteger, ratSign, ratSub } from '../rational.ts'
import { chain, m, prime, tex } from './format.ts'

// Textbausteine für Erklärungen, Tipps und „Warum ist das falsch?".
// Zwei Stufen: ausführlich (einfache Sprache, Fachbegriffe erklärt) und kurz (nur die Rechnung).
// Alle Formeln kommen aus der Engine, eingesetzt mit den Termen der Aufgabe.

export type Explanation = { readonly detailed: string; readonly short: string }

const numLatex = (r: Rational) => toLatex(num(r))
// Zahl als Faktor vor einem Malpunkt: negative in Klammern
const factorLatex = (r: Rational) => (ratSign(r) < 0 ? `(${numLatex(r)})` : numLatex(r))

export const exponentOf = (node: Derivation) => (node.parts.exponent ? asRational(node.parts.exponent) : null)

const isMinusOne = (e: Expr) => {
  const c = asRational(e)
  return c !== null && c.n === -1n && c.d === 1n
}

// Knoten ohne feste Faktoren davor: bei 4\cos x der Kosinus
function withoutFactors(node: Derivation): Derivation {
  return node.rule === 'constantFactor' ? withoutFactors(node.children[0]) : node
}

// Potenzregel mit eingesetzten Zahlen: 3 \cdot x^{3 - 1}
export function powerRuleWithNumbers(node: Derivation, n: Rational): string {
  const base = toLatex(node.parts.base!)
  return String.raw`${factorLatex(n)} \cdot ${base}^{${numLatex(n)} - 1}`
}

// --- Rechnung eines Teilbaums erklären ---

export const BASIC_SENTENCE: Partial<Record<RuleId, string>> = {
  exp: 'Die e-Funktion ändert sich beim Ableiten nicht:',
  ln: 'Die Ableitung des natürlichen Logarithmus ist der Kehrwert:',
  sin: 'Die Ableitung des Sinus ist der Kosinus:',
  cos: 'Die Ableitung des Kosinus ist der Sinus mit Minuszeichen:',
  expBase: 'Bei einer Exponentialfunktion mit einer anderen Basis als $e$ kommt der Faktor $\\ln a$ dazu:',
  logBase: 'Beim Logarithmus zu einer anderen Basis als $e$ kommt $\\ln a$ in den Nenner:',
  tan: 'Die Ableitung des Tangens hat den Kosinus im Quadrat im Nenner:',
  arctan: 'Die Ableitung des Arkustangens ist ein Bruch ohne Winkelfunktion:',
}

function factorSentence(node: Derivation): string {
  const { factor, rest, divisor } = node.parts
  if (isMinusOne(factor!)) return `Das Minuszeichen vor ${m(rest!)} bleibt beim Ableiten einfach stehen.`
  if (divisor) return `Durch ${m(factor!)} wird nur geteilt. Diese feste Zahl bleibt beim Ableiten stehen (Faktorregel).`
  return `Die Zahl ${m(factor!)} ist ein Faktor: Sie wird mit ${m(rest!)} malgenommen. Nach der Faktorregel bleibt ein solcher Faktor beim Ableiten einfach stehen, abgeleitet wird nur ${m(rest!)}.`
}

function describe(node: Derivation): string[] {
  const { parts } = node
  switch (node.rule) {
    case 'constant':
      return [
        `Eine Zahl ohne $x$ (eine Konstante) ändert sich nicht, wenn sich $x$ ändert. Deshalb ist ihre Ableitung $0$: ${tex(chain(prime(node.input), '0'))}.`,
      ]
    case 'constantFactor':
      return [factorSentence(node), ...node.children.flatMap(describe)]
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
    case 'sum':
      // ohne die Formel (u + v)' = u' + v': u steht bei der Kettenregel schon für die innere Funktion
      return ['Summenregel: Du leitest jeden Summanden einzeln ab.', ...node.children.flatMap(describe)]
    case 'exp':
    case 'ln':
    case 'sin':
    case 'cos':
    case 'expBase':
    case 'logBase':
    case 'tan':
    case 'arctan':
      return [`${BASIC_SENTENCE[node.rule]} ${tex(chain(prime(node.input), node.result))}.`]
    case 'chain': {
      // Ohne den Platzhalter u: Der steht bei der Produktregel schon für den ersten Faktor
      const inner = parts.inner!
      const [outer, innerDerivative] = node.children
      const outerAtInner = substitute(outer.result, PLACEHOLDER, inner)
      return [
        `Kettenregel: Innen steckt ${m(inner)}. Du leitest die äußere Funktion ab und lässt ${m(inner)} darin unverändert stehen: ${m(outerAtInner)}. Dann nimmst du mit der inneren Ableitung ${tex(chain(prime(inner), innerDerivative.result))} mal.`,
        `Eingesetzt: ${tex(chain(prime(node.input), node.formula))}.`,
      ]
    }
    case 'product':
    case 'quotient': {
      // Ohne die Buchstaben u und v: Die sind in verschachtelten Aufgaben oft schon vergeben
      const [a, b] = [toLatex(parts.u!), toLatex(parts.v!)]
      const [da, db] = node.children.map((c) => toLatex(c.result))
      const pattern =
        node.rule === 'product'
          ? `\\left(${a}\\right)' \\cdot ${b} + ${a} \\cdot \\left(${b}\\right)'`
          : `\\frac{\\left(${a}\\right)' \\cdot ${b} - ${a} \\cdot \\left(${b}\\right)'}{\\left(${b}\\right)^2}`
      const how =
        node.rule === 'product'
          ? 'Produktregel: Einmal wird der erste Faktor abgeleitet, einmal der zweite.'
          : 'Quotientenregel: Ableitung von oben mal unten, minus oben mal Ableitung von unten, geteilt durch unten im Quadrat.'
      return [
        `${how} ${tex(chain(prime(node.input), pattern))}.`,
        `Mit ${tex(`\\left(${a}\\right)' = ${da}`)} und ${tex(`\\left(${b}\\right)' = ${db}`)}: ${tex(chain(prime(node.input), node.formula))}.`,
      ]
    }
    default:
      return [`${RULES[node.rule].name}: ${tex(RULES[node.rule].formula)}.`, ...node.children.flatMap(describe)]
  }
}

function shortLines(node: Derivation): string[] {
  // Rechnungen mit dem Platzhalter u (äußere Funktion der Kettenregel) nur, wenn sie selbst gefragt sind
  const visible = (n: Derivation) => n.variable === node.variable
  const rewrites = allNodes(node)
    .filter((n) => n.rule === 'rewrite' && visible(n))
    .map((n) => tex(chain(n.input, n.parts.rewritten!)))
  const calculations: string[] = []
  const visit = (n: Derivation) => {
    if (!visible(n)) return
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

// Satz zu festen Faktoren vor der Hauptregel, z. B. „Der Faktor −3 davor bleibt stehen."
export function keepFactorNote(factors: readonly Derivation[]): string {
  return factors
    .map(({ parts }) => {
      if (isMinusOne(parts.factor!)) return 'Das Minuszeichen davor bleibt stehen.'
      if (parts.divisor) return `Der Teiler ${m(parts.factor!)} bleibt stehen.`
      return `Der Faktor ${m(parts.factor!)} davor bleibt stehen.`
    })
    .join(' ')
}

// Einsetzen in Produkt-, Quotienten- oder Kettenregel: warum die eingesetzte Formel stimmt
export function explainAssembly(root: Derivation, factors: readonly Derivation[], core: Derivation, formula: Expr): Explanation {
  const formulaLatex = toLatex(formula)
  const resultLatex = toLatex(root.result)
  let rule: string
  if (core.rule === 'chain') {
    const [outer, innerDerivative] = core.children
    const inner = core.parts.inner!
    rule = `Kettenregel: äußere Ableitung mal innere Ableitung. In die äußere Ableitung ${m(outer.result)} setzt du $u = ${toLatex(inner)}$ ein: ${m(substitute(outer.result, PLACEHOLDER, inner))}. Dann nimmst du mit der inneren Ableitung ${m(innerDerivative.result)} mal.`
  } else if (core.rule === 'quotient') {
    rule = `Quotientenregel: ${tex(RULES.quotient.formula)}. Im Zähler steht zuerst $u' \\cdot v$, davon wird $u \\cdot v'$ abgezogen. Der Nenner wird quadriert.`
  } else {
    rule = `Produktregel: ${tex(RULES.product.formula)}. Du leitest jeweils einen Faktor ab, lässt den anderen unverändert und zählst beides zusammen.`
  }
  const lines = [rule, keepFactorNote(factors), `Eingesetzt: ${tex(`f'(x) = ${formulaLatex}`)}.`]
  if (resultLatex !== formulaLatex) lines.push(`Zusammengefasst: ${tex(`f'(x) = ${resultLatex}`)}.`)
  return {
    detailed: lines.filter((line) => line !== '').join('\n'),
    short: tex(chain("f'(x)", formulaLatex, resultLatex)),
  }
}

// --- Tipps (vor dem Antworten) ---

export function hintFor(node: Derivation): string {
  if (node.rule === 'constant') return 'Ändert sich eine Zahl ohne $x$, wenn sich $x$ ändert?'
  const core = withoutFactors(node)
  const factor = core === node ? '' : isMinusOne(node.parts.factor!) ? ' Das Minuszeichen davor bleibt einfach stehen.' : ' Ein Faktor davor bleibt einfach stehen.'
  switch (core.rule) {
    case 'rewrite':
      return core.input.kind === 'root'
        ? 'Schreibe die Wurzel zuerst als Potenz: $\\sqrt[n]{x^m} = x^{\\frac{m}{n}}$. Dann hilft die Potenzregel.'
        : 'Schreibe den Bruch zuerst als Potenz: $\\frac{1}{x^n} = x^{-n}$. Dann hilft die Potenzregel.'
    case 'power':
      if (core.input.kind === 'var') return `Schreibe $${core.variable}$ als $${core.variable}^1$ und nutze die Potenzregel.${factor}`
      return `Potenzregel: ${tex(RULES.power.formula)}.${factor}`
    case 'exp':
      return `Die e-Funktion hat beim Ableiten eine besondere Eigenschaft.${factor}`
    case 'ln':
      return `Die Ableitung des natürlichen Logarithmus ist ein Bruch.${factor}`
    case 'sin':
    case 'cos':
      return `Sinus und Kosinus gehen beim Ableiten ineinander über. Überlege, wo dabei ein Minuszeichen entsteht.${factor}`
    case 'expBase':
      return `Hier steht $x$ oben im Exponenten, die Basis ist eine Zahl. Was ist anders als bei der e-Funktion?${factor}`
    case 'logBase':
      return `Vergleiche mit $(\\ln x)' = \\frac{1}{x}$. Was kommt bei einer anderen Basis dazu?${factor}`
    case 'tan':
      return `Denk an $\\tan x = \\frac{\\sin x}{\\cos x}$.${factor}`
    case 'arctan':
      return `Die Ableitung des Arkustangens enthält keine Winkelfunktion mehr, sondern einen Bruch.${factor}`
    case 'sum': {
      const hasConstant = core.children.some((c) => c.rule === 'constant')
      return `Leite jeden Summanden einzeln ab.${hasConstant ? ' Was passiert mit einer Zahl ohne $x$?' : ''}${factor}`
    }
    case 'chain':
      return `Kettenregel: äußere Ableitung mal innere Ableitung. Innen steckt ${m(core.parts.inner!)}.${factor}`
    default:
      return `Denk an die ${RULES[core.rule].name}: ${tex(RULES[core.rule].formula)}.${factor}`
  }
}

// Tipp zum Einsetzen in Produkt-, Quotienten- oder Kettenregel.
// coarse: Die äußere Ableitung wurde vorher nicht einzeln gefragt (ab Stufe 4).
export function hintForAssembly(core: Derivation, coarse = false): string {
  if (core.rule === 'chain') {
    const inner = toLatex(core.parts.inner!)
    if (coarse) {
      return `Leite die äußere Funktion ${m(core.parts.outer!)} nach $u$ ab, setze darin $u = ${inner}$ ein und multipliziere mit der inneren Ableitung von oben.`
    }
    return `Nimm die äußere Ableitung, setze darin $u = ${inner}$ ein und multipliziere mit der inneren Ableitung. Beide stehen oben unter „Bisher".`
  }
  const order = core.rule === 'quotient' ? ' Achte auf die Reihenfolge im Zähler.' : ''
  return `Setze $u$, $u'$, $v$ und $v'$ in die ${RULES[core.rule].name} ein. Die Ableitungen stehen oben unter „Bisher".${order}`
}

// --- „Welche Regel brauchst du?" ---

export type RuleOption = 'sum' | 'product' | 'quotient' | 'chain' | 'constantFactor'
// Die vier Regeln, die bestimmen, wie ein Term aufgebaut ist
export const RULE_OPTIONS: readonly RuleOption[] = ['sum', 'product', 'quotient', 'chain']
// Ersatz, wenn von den vier zu wenige als falsche Antwort taugen
export const EXTRA_RULE_OPTION: RuleOption = 'constantFactor'

const STRUCTURE: Record<RuleOption, string> = {
  sum: 'eine Summe: Seine Teile (die Summanden) sind mit $+$ oder $-$ verbunden',
  product: 'ein Produkt: Zwei Teile, die beide $x$ enthalten, werden malgenommen',
  quotient: 'ein Bruch, bei dem oben und unten $x$ vorkommt',
  chain: 'eine Verkettung: Eine Funktion ist in eine andere eingesetzt',
  constantFactor: 'eine feste Zahl mal einem Term',
}

const STRUCTURE_SHORT: Record<RuleOption, string> = {
  sum: 'eine Summe',
  product: 'ein Produkt',
  quotient: 'ein Bruch',
  chain: 'eine Verkettung',
  constantFactor: 'eine Zahl mal Term',
}

const NOT_SHORT: Record<RuleOption, string> = {
  sum: 'keine Summe',
  product: 'kein Produkt',
  quotient: 'kein Bruch',
  chain: 'keine Verkettung',
  constantFactor: 'keine Zahl mal Term',
}

export const WHEN_NEEDED: Record<RuleOption, string> = {
  sum: 'Die Summenregel brauchst du, wenn der ganze Term eine Summe ist, z. B. $x^2 + \\sin x$.',
  product:
    'Die Produktregel brauchst du, wenn zwei Teile, die beide $x$ enthalten, malgenommen werden, z. B. $x^2 \\cdot \\sin x$.',
  quotient:
    'Die Quotientenregel brauchst du, wenn der ganze Term ein Bruch ist, bei dem oben und unten $x$ vorkommt, z. B. $\\frac{\\sin x}{x}$.',
  chain:
    'Die Kettenregel brauchst du, wenn eine Funktion in eine andere eingesetzt ist, z. B. $\\sin(3x)$: Dort steckt $3x$ im Sinus.',
  constantFactor:
    'Die Faktorregel brauchst du, wenn eine feste Zahl mit einem Term malgenommen wird, z. B. $4x^3$. Die Zahl bleibt dann einfach stehen.',
}

const isRuleOption = (rule: RuleId): rule is RuleOption => (RULE_OPTIONS as readonly string[]).includes(rule) || rule === EXTRA_RULE_OPTION

export function explainRuleChoice(correct: RuleId, factors: readonly Derivation[] = []): Explanation {
  const rule = RULES[correct]
  if (!isRuleOption(correct)) return { detailed: `${rule.name}: ${tex(rule.formula)}.`, short: tex(rule.formula) }
  const extra = correct === 'sum' ? ' Du leitest jeden Summanden einzeln ab und zählst die Ergebnisse wieder zusammen.' : ''
  const factor = factors.length > 0 ? `\n${keepFactorNote(factors)} Das regelt die Faktorregel, dafür brauchst du keine eigene Regel.` : ''
  return {
    detailed: `Richtig erkannt: Dein Term ist ${STRUCTURE[correct]}. Dafür gibt es die ${rule.name}: ${tex(rule.formula)}.${extra}${factor}`,
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

// Kennzeichen des allgemeinen Rückfalltexts (für Tests: geübte Stufen brauchen eigene Texte)
export const FALLBACK_MARKER = 'Typischer Fehler:'

type ErrorContext = {
  readonly node: Derivation
  readonly input: Expr
  readonly correct: Expr
  readonly wrong: Expr
  readonly n: Rational | null
  // Rechnet die Fehlerstelle mit derselben Variablen wie der Schritt? Nein, wenn sie in der
  // äußeren Funktion einer Kettenregel liegt (Platzhalter u), der Schritt aber nach x fragt
  readonly local: boolean
  // „ Richtig ist (x³)' = 3x²." bzw. leer, wenn die Fehlerstelle nicht local ist
  readonly rightIs: string
  // (x³)' = 3x² bzw. die allgemeine Potenzregel
  readonly rightShort: string
}

// Teile von Produkt und Quotient benennen: „Hier ist u = x² und v = eˣ."
// Ohne die Buchstaben u und v: In verschachtelten Aufgaben stehen sie schon für etwas anderes
function partsSentence({ parts, rule }: Derivation): string {
  const [a, b] = [toLatex(parts.u!), toLatex(parts.v!)]
  return rule === 'quotient' ? `Hier steht oben $${a}$ und unten $${b}$.` : `Hier sind die Faktoren $${a}$ und $${b}$.`
}

const PRODUCT_RULE = tex(RULES.product.formula)
const QUOTIENT_RULE = tex(RULES.quotient.formula)
const CHAIN_RULE = tex(RULES.chain.formula)

const ERROR_TEXTS: Record<string, (c: ErrorContext) => Explanation> = {
  'power-exponent-not-reduced': ({ rightIs, rightShort }) => ({
    detailed: `Du hast den Exponenten stehen lassen. Bei der Potenzregel holst du den Exponenten nach vorne und verringerst ihn danach um $1$.${rightIs}`,
    short: `Exponent nicht verringert: ${rightShort}.`,
  }),
  'power-negative-wrong-direction': ({ n, rightIs }) => {
    const step = tex(`${numLatex(n!)} - 1 = ${numLatex(ratSub(n!, ONE))}`)
    return {
      detailed: `Bei einem negativen Exponenten heißt „$1$ abziehen", dass er kleiner wird: ${step}. Du hast in die andere Richtung gezählt.${rightIs}`,
      short: `Der Exponent wird kleiner: ${step}.`,
    }
  },
  'power-sign-forgotten': ({ n, rightIs, rightShort }) => ({
    detailed: `Der Exponent ${tex(numLatex(n!))} kommt mit seinem Minuszeichen nach vorne.${rightIs}`,
    short: `Minuszeichen vergessen: ${rightShort}.`,
  }),
  'power-root-factor-forgotten': ({ node, input, correct, n, local }) => ({
    detailed: `Auch ein Bruch als Exponent kommt bei der Potenzregel als Faktor nach vorne. Du hast den Faktor ${tex(numLatex(n!))} weggelassen.${local ? ` Richtig ist ${tex(chain(prime(input), powerRuleWithNumbers(node, n!), correct))}.` : ''}`,
    short: `Faktor ${tex(numLatex(n!))} vergessen.`,
  }),
  'power-fraction-numerator-only': ({ n, rightIs }) => {
    const step = tex(`${numLatex(n!)} - 1 = ${numLatex(ratSub(n!, ONE))}`)
    return {
      detailed: `Vom Exponenten ziehst du $1$ als ganze Zahl ab: ${step}. Du hast die $1$ nur vom Zähler abgezogen.${rightIs}`,
      short: `$1$ ganz abziehen: ${step}.`,
    }
  },
  'power-exponent-not-multiplied': ({ n, rightIs }) => ({
    detailed: `Du hast nur $1$ vom Exponenten abgezogen. Bei der Potenzregel kommt der Exponent ${tex(numLatex(n!))} vorher als Faktor nach vorne.${rightIs}`,
    short: `Exponent ${tex(numLatex(n!))} als Faktor vergessen.`,
  }),
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
  'constant-summand-kept': ({ node }) => {
    const constants = node.children.filter((c) => c.rule === 'constant').map((c) => c.input)
    const rules = constants.map((c) => tex(chain(prime(c), '0'))).join(' und ')
    return {
      detailed: `Eine Zahl ohne $x$ (eine Konstante) ändert sich nicht, wenn sich $x$ ändert. Beim Ableiten fällt sie deshalb weg: ${rules}.`,
      short: `Konstante fällt weg: ${rules}.`,
    }
  },
  'exp-power-rule': () => ({
    detailed:
      "Die Potenzregel gilt nur, wenn $x$ unten in der Basis steht, z. B. bei $x^3$. Bei der e-Funktion steht $x$ oben im Exponenten. Für sie gilt eine eigene Regel: $(e^x)' = e^x$.",
    short: "Potenzregel passt hier nicht: $(e^x)' = e^x$.",
  }),
  'sin-sign': () => ({
    detailed: "Beim Ableiten des Sinus entsteht kein Minuszeichen: $(\\sin x)' = \\cos x$. Das Minus gehört zur Ableitung des Kosinus: $(\\cos x)' = -\\sin x$.",
    short: "Ohne Minus: $(\\sin x)' = \\cos x$.",
  }),
  'cos-sign': () => ({
    detailed: "Beim Ableiten des Kosinus entsteht ein Minuszeichen: $(\\cos x)' = -\\sin x$. Nur beim Sinus fehlt es: $(\\sin x)' = \\cos x$.",
    short: "Minuszeichen vergessen: $(\\cos x)' = -\\sin x$.",
  }),
  'ln-like-exp': () => ({
    detailed: "Nur die e-Funktion bleibt beim Ableiten unverändert. Der natürliche Logarithmus hat eine andere Ableitung: $(\\ln x)' = \\frac{1}{x}$.",
    short: "$(\\ln x)' = \\frac{1}{x}$, nicht $\\ln x$.",
  }),
  'ln-reciprocal-of-ln': () => ({
    detailed: "Die Ableitung des natürlichen Logarithmus ist der Kehrwert von $x$, nicht der Kehrwert von $\\ln x$: $(\\ln x)' = \\frac{1}{x}$.",
    short: "Kehrwert von $x$: $(\\ln x)' = \\frac{1}{x}$.",
  }),
  'exp-base-power-rule': () => ({
    detailed:
      "Die Potenzregel gilt nur, wenn $x$ unten in der Basis steht, z. B. bei $x^3$. Bei $a^x$ steht $x$ oben im Exponenten. Dafür gilt eine eigene Regel: $(a^x)' = a^x \\cdot \\ln a$.",
    short: "Potenzregel passt hier nicht: $(a^x)' = a^x \\cdot \\ln a$.",
  }),
  'exp-base-ln-forgotten': () => ({
    detailed:
      "Nur die e-Funktion bleibt beim Ableiten unverändert. Bei einer anderen Basis kommt der Faktor $\\ln a$ dazu: $(a^x)' = a^x \\cdot \\ln a$.",
    short: "Faktor $\\ln a$ vergessen: $(a^x)' = a^x \\cdot \\ln a$.",
  }),
  'log-base-ln-forgotten': () => ({
    detailed:
      "Nur beim natürlichen Logarithmus ist die Ableitung einfach $\\frac{1}{x}$. Bei einer anderen Basis kommt $\\ln a$ in den Nenner: $(\\log_a x)' = \\frac{1}{x \\cdot \\ln a}$.",
    short: "$\\ln a$ im Nenner vergessen: $(\\log_a x)' = \\frac{1}{x \\cdot \\ln a}$.",
  }),
  'tan-sin-cos-swapped': () => ({
    detailed:
      "Beim Tangens steht der Kosinus im Nenner, nicht der Sinus: $(\\tan x)' = \\frac{1}{\\cos^2 x}$. Das folgt aus $\\tan x = \\frac{\\sin x}{\\cos x}$ mit der Quotientenregel.",
    short: "Kosinus im Nenner: $(\\tan x)' = \\frac{1}{\\cos^2 x}$.",
  }),
  'arctan-sign': () => ({
    detailed: "Im Nenner steht ein Plus, kein Minus: $(\\arctan x)' = \\frac{1}{1 + x^2}$.",
    short: "Plus im Nenner: $(\\arctan x)' = \\frac{1}{1 + x^2}$.",
  }),
  'arctan-arcsin': () => ({
    detailed:
      "Das ist die Ableitung des Arkussinus: $(\\arcsin x)' = \\frac{1}{\\sqrt{1 - x^2}}$. Beim Arkustangens gibt es keine Wurzel: $(\\arctan x)' = \\frac{1}{1 + x^2}$.",
    short: "Verwechselt mit $\\arcsin$: $(\\arctan x)' = \\frac{1}{1 + x^2}$.",
  }),
  'product-derivatives-multiplied': ({ node }) => ({
    detailed: `Bei der Produktregel werden nicht einfach die beiden Ableitungen malgenommen. Jeder Summand enthält eine Ableitung und einen unveränderten Faktor: ${PRODUCT_RULE}. ${partsSentence(node)}`,
    short: `Nicht $u' \\cdot v'$, sondern ${PRODUCT_RULE}.`,
  }),
  'product-second-summand-missing': ({ node }) => ({
    detailed: `Dir fehlt der zweite Summand $u \\cdot v'$. Die Produktregel hat zwei Summanden: Einmal wird $u$ abgeleitet, einmal $v$: ${PRODUCT_RULE}. ${partsSentence(node)}`,
    short: `Es fehlt $u \\cdot v'$: ${PRODUCT_RULE}.`,
  }),
  'product-minus': ({ node }) => ({
    detailed: `In der Produktregel steht ein Plus, kein Minus: ${PRODUCT_RULE}. Das Minus gehört zur Quotientenregel. ${partsSentence(node)}`,
    short: `Plus statt Minus: ${PRODUCT_RULE}.`,
  }),
  'quotient-numerator-swapped': ({ node }) => ({
    detailed: `Im Zähler kommt zuerst $u' \\cdot v$, erst dann wird $u \\cdot v'$ abgezogen. Wegen des Minuszeichens ist die Reihenfolge wichtig: ${QUOTIENT_RULE}. ${partsSentence(node)}`,
    short: `Zuerst $u' \\cdot v$: ${QUOTIENT_RULE}.`,
  }),
  'quotient-denominator-not-squared': ({ node }) => ({
    detailed: `Der Nenner wird quadriert, unten steht also $v^2$ und nicht nur $v$. Quotientenregel: ${QUOTIENT_RULE}. ${partsSentence(node)}`,
    short: `Nenner quadrieren: ${QUOTIENT_RULE}.`,
  }),
  'quotient-separately': ({ node }) => ({
    detailed: `Einen Bruch darfst du nicht oben und unten einzeln ableiten. Dafür gibt es die Quotientenregel: ${QUOTIENT_RULE}. ${partsSentence(node)}`,
    short: `Nicht $\\frac{u'}{v'}$, sondern ${QUOTIENT_RULE}.`,
  }),
  'chain-inner-forgotten': ({ node }) => ({
    detailed: `Du hast die innere Ableitung vergessen. Die Kettenregel heißt: äußere Ableitung mal innere Ableitung, ${CHAIN_RULE}. Innen steckt hier ${m(node.parts.inner!)}. Mit der Ableitung davon musst du noch malnehmen.`,
    short: `Innere Ableitung fehlt: noch mal ${tex(prime(node.parts.inner!))}.`,
  }),
  'chain-outer-wrong-argument': ({ node }) => ({
    detailed: `In der äußeren Ableitung muss die innere Funktion ${m(node.parts.inner!)} stehen bleiben. Du hast dort stattdessen nur $x$ eingesetzt. Kettenregel: ${CHAIN_RULE}.`,
    short: `In der äußeren Ableitung steht ${m(node.parts.inner!)}, nicht $x$.`,
  }),
  'chain-inner-derivative-substituted': ({ node }) => ({
    detailed: `Du hast die innere Ableitung in die äußere Ableitung eingesetzt. In der äußeren Ableitung bleibt aber die innere Funktion ${m(node.parts.inner!)} stehen; mit der inneren Ableitung wird danach malgenommen: ${CHAIN_RULE}.`,
    short: `Innere Ableitung malnehmen, nicht einsetzen: ${CHAIN_RULE}.`,
  }),
  'chain-times-inner-function': ({ node }) => ({
    detailed: `Du hast mit der inneren Funktion ${m(node.parts.inner!)} malgenommen statt mit ihrer Ableitung. Kettenregel: ${CHAIN_RULE}. Am Ende steht $g'(x)$, nicht $g(x)$.`,
    short: `Mal ${tex(prime(node.parts.inner!))}, nicht mal ${m(node.parts.inner!)}.`,
  }),
  'notation-power-on-name': ({ input }) => {
    // \sin^2 x bedeutet (\sin x)^2: außen die Potenz, innen der Sinus
    if (input.kind !== 'pow' || input.base.kind !== 'fn') throw new Error('notation-power-on-name erwartet z. B. sin² x')
    const written = toLatex(input)
    const meant = `\\left(${toLatex(input.base)}\\right)^{${toLatex(input.exp)}}`
    const misread = fn(input.base.name, pow(input.base.arg, input.exp))
    return {
      detailed: `Achtung, Schreibweise: ${tex(`${written} = ${meant}`)}. Außen steht also die Potenz, innen ${m(input.base)}. Das ist etwas anderes als ${m(misread)}.`,
      short: `${tex(`${written} = ${meant}`)}: außen die Potenz.`,
    }
  },
}

// Erklärung zu einem falschen Ergebnis: Was genau ist an der Fehlerstelle schiefgegangen?
// Das Endergebnis des ganzen Schritts wird nicht verraten, das rechnet man danach selbst.
export function explainError(wrongAnswer: WrongAnswer): Explanation {
  const { node, errorRule } = wrongAnswer
  const formula = errorRule.apply(node)
  const local = node.variable === wrongAnswer.derivation.variable
  const right = tex(chain(prime(node.input), node.result))
  const context: ErrorContext = {
    node,
    input: node.input,
    correct: node.result,
    wrong: formula ? finalForm(formula) : wrongAnswer.result,
    n: exponentOf(node),
    local,
    rightIs: local ? ` Richtig ist ${right}.` : '',
    rightShort: local ? right : tex(RULES.power.formula),
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
