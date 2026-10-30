import { type Derivation, PLACEHOLDER, derive } from '../derive/derive.ts'
import { deriveImplicit, implicitResult, sortedEquation } from '../derive/implicit.ts'
import { RULES } from '../derive/rules.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { type Equation, type Expr, asRational, isEquation } from '../expr/types.ts'
import { type CardExample, isFractionExample } from './cards.ts'
import { chain, m, prime } from './format.ts'
import { fractionExample } from './fractionExample.ts'
import { BASIC_SENTENCE, exponentOf, powerRuleWithNumbers } from './texts.ts'

// Durchgerechnete Beispiele für die Lernkarten: der Rechenweg der Engine als Folge von Zeilen.
// Die Regel ganz außen wird ausführlich gezeigt, mit u und v wie in der Formel auf der Karte;
// Teile darunter (z. B. die Summanden einer Summe) stehen in je einer Zeile.

export type ExampleLine = {
  // kurzer Text vor der Formel (mit $…$), z. B. „Der Faktor $4$ bleibt stehen:"
  readonly label: string
  readonly latex: string
}

export type WorkedExample = {
  readonly functionLatex: string
  // Die letzte Zeile endet mit dem Ergebnis
  readonly lines: readonly ExampleLine[]
  readonly result: Expr
}

// Beispiel einer Lernkarte, beim Ableiten wie bei Brüchen
export function cardExample(e: CardExample): WorkedExample {
  return isFractionExample(e) ? fractionExample(e) : workedExample(e)
}

export function workedExample(f: Expr | Equation): WorkedExample {
  if (isEquation(f)) return implicitExample(f)
  const root = derive(f)
  return { functionLatex: `f(x) = ${toLatex(f)}`, lines: detailed(root, "f'(x)"), result: root.result }
}

// Implizites Ableiten: beide Seiten ableiten, y' ausklammern, teilen
function implicitExample(equation: Equation): WorkedExample {
  const d = deriveImplicit(equation)
  const result = implicitResult(d)
  const [differentiated, sorted] = [equationToLatex(d.differentiated), equationToLatex(sortedEquation(d))]
  return {
    functionLatex: equationToLatex(equation),
    lines: [
      { label: "Beide Seiten nach $x$ ableiten, jeder Term mit $y$ bekommt den Faktor $y'$:", latex: differentiated },
      ...(sorted === differentiated ? [] : [{ label: "Alle Terme mit $y'$ auf eine Seite, $y'$ ausklammern:", latex: sorted }]),
      { label: "Durch den Faktor vor $y'$ teilen:", latex: `y' = ${toLatex(result)}` },
    ],
    result,
  }
}

const isMinusOne = (e: Expr) => {
  const c = asRational(e)
  return c !== null && c.n === -1n && c.d === 1n
}

function factorLabel({ parts }: Derivation): string {
  if (isMinusOne(parts.factor!)) return 'Das Minuszeichen bleibt stehen:'
  if (parts.divisor) return `Durch ${m(parts.factor!)} wird nur geteilt, das bleibt stehen:`
  return `Der Faktor ${m(parts.factor!)} bleibt stehen:`
}

// Kurzer Satz zur Regel eines Knotens, als Beschriftung seiner Zeile
function ruleLabel(node: Derivation): string {
  switch (node.rule) {
    case 'constant':
      return `Eine Zahl ohne $${node.variable}$ fällt weg:`
    case 'power':
      return 'Potenzregel:'
    case 'rewrite':
      return 'Als Potenz schreiben, dann Potenzregel:'
    case 'constantFactor':
      return factorLabel(node)
    default:
      return BASIC_SENTENCE[node.rule] ?? `${RULES[node.rule].name}:`
  }
}

// Teilrechnung in einer Zeile: (5x)' = 5 \cdot 1 = 5
function compact(node: Derivation): ExampleLine {
  return { label: ruleLabel(node), latex: chain(prime(node.input), node.formula, node.result) }
}

// „Zusammengefasst" nur, wenn das Zusammenfassen etwas ändert
function summarized(node: Derivation, lhs: string): ExampleLine[] {
  return toLatex(node.formula) === toLatex(node.result) ? [] : [{ label: 'Zusammengefasst:', latex: chain(lhs, node.result) }]
}

// Rechnung eines Knotens ausführlich; lhs ist die linke Seite, z. B. f'(x) oder (x^3)'
function detailed(node: Derivation, lhs: string): ExampleLine[] {
  const { parts, children } = node
  switch (node.rule) {
    case 'constant':
      return [{ label: ruleLabel(node), latex: chain(lhs, '0') }]
    case 'power': {
      const n = exponentOf(node)
      if (node.input.kind === 'var') return [{ label: `$${node.variable}$ abgeleitet ergibt $1$:`, latex: chain(lhs, '1') }]
      if (!n) return [{ label: ruleLabel(node), latex: chain(lhs, node.result) }]
      return [
        {
          label: `Exponent ${m(parts.exponent!)} als Faktor nach vorne, dann $1$ abziehen:`,
          latex: chain(lhs, powerRuleWithNumbers(node, n), node.result),
        },
      ]
    }
    case 'rewrite':
      return [{ label: 'Erst als Potenz schreiben:', latex: chain(node.input, parts.rewritten!) }, ...detailed(children[0], lhs)]
    case 'constantFactor': {
      const [child] = children
      const rest = prime(child.input)
      const kept = isMinusOne(parts.factor!)
        ? `-${rest}`
        : parts.divisor
          ? String.raw`\frac{${rest}}{${toLatex(parts.factor!)}}`
          : String.raw`${toLatex(parts.factor!)} \cdot ${rest}`
      return [
        { label: factorLabel(node), latex: chain(lhs, kept) },
        ...detailed(child, rest),
        { label: 'Zusammen:', latex: chain(lhs, node.formula, node.result) },
      ]
    }
    case 'sum':
      return [
        { label: 'Jeden Summanden einzeln ableiten:', latex: chain(lhs, children.map((c) => prime(c.input)).join(' + ')) },
        ...children.map(compact),
        { label: 'Zusammen:', latex: chain(lhs, node.formula, node.result) },
      ]
    case 'product':
    case 'quotient': {
      const [du, dv] = children
      return [
        {
          label: node.rule === 'quotient' ? 'Oben steht $u$, unten $v$:' : 'Die beiden Faktoren:',
          latex: String.raw`u = ${toLatex(parts.u!)}, \quad v = ${toLatex(parts.v!)}`,
        },
        { label: 'Beide einzeln ableiten:', latex: String.raw`u' = ${toLatex(du.result)}, \quad v' = ${toLatex(dv.result)}` },
        { label: `In die ${RULES[node.rule].name} einsetzen:`, latex: chain(lhs, node.formula) },
        ...summarized(node, lhs),
      ]
    }
    case 'chain': {
      const [outer, inner] = children
      const u = PLACEHOLDER
      return [
        { label: 'Innen steckt:', latex: `${u} = ${toLatex(parts.inner!)}` },
        { label: `Äußere Funktion nach $${u}$ ableiten:`, latex: chain(prime(outer.input), outer.result) },
        { label: 'Innere Ableitung:', latex: `${u}' = ${chain(prime(parts.inner!), inner.result)}` },
        { label: `Äußere mal innere Ableitung, $${u}$ wieder eingesetzt:`, latex: chain(lhs, node.formula) },
        ...summarized(node, lhs),
      ]
    }
    case 'logarithmic': {
      const [inner] = children
      return [
        { label: 'Logarithmieren mit $\\ln(a^b) = b \\cdot \\ln a$:', latex: `\\ln f(x) = ${toLatex(inner.input)}` },
        { label: 'Beide Seiten ableiten, links nach der Kettenregel:', latex: `\\frac{f'(x)}{f(x)} = ${chain(prime(inner.input), inner.result)}` },
        { label: 'Mit $f(x)$ malnehmen:', latex: chain(lhs, node.formula) },
        ...summarized(node, lhs),
      ]
    }
    default:
      // Grundfunktionen wie e^x, ln x, sin x: eine Zeile
      return [{ label: ruleLabel(node), latex: chain(lhs, node.formula, node.result) }]
  }
}
