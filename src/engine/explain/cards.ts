import { RULES, type RuleId } from '../derive/rules.ts'
import { key, subterms } from '../expr/compare.ts'
import {
  type Equation,
  type Expr,
  add,
  eq,
  isEquation,
  cos,
  div,
  exp,
  fn,
  ln,
  log,
  mul,
  neg,
  num,
  pow,
  root,
  sin,
  sqrt,
  sub,
  tan,
  x,
  y,
} from '../expr/types.ts'
import type { Level } from '../tasks/taskNumber.ts'
import { WHEN_NEEDED } from './texts.ts'

// Lernkarten: je Regel die Formel, ein Merksatz, wann man sie braucht, Beispiele und die
// typischen Fehler dazu. Die Beispiele rechnet die Engine (example.ts), nicht die Karte.
// Texte mit Formeln im Format von richText.ts. Die Karten liegen in Ordnern nach Themen;
// spätere Themen (z. B. Formeln umstellen) bekommen eigene Ordner.

export type Topic = {
  // Teil der Adresse, z. B. #/karten/ableitungen
  readonly id: string
  readonly title: string
  readonly description: string
}

export const TOPICS: readonly Topic[] = [
  { id: 'ableitungen', title: 'Ableitungen', description: 'Von der Potenzregel bis zur Kettenregel' },
]

export type Card = {
  readonly id: string
  // Ordner (Id eines Themas)
  readonly topic: string
  // Text mit $…$-Formeln
  readonly title: string
  // ab dieser Stufe kommt die Regel in Aufgaben vor
  readonly level: Level
  // Regeln der Engine, die die Karte erklärt
  readonly rules: readonly RuleId[]
  // Formeln (LaTeX)
  readonly formulas: readonly string[]
  // Merksatz in einfachen Worten
  readonly memo: string
  // Zusatz, z. B. eine Merkhilfe oder woher die Regel kommt
  readonly note?: string
  // wann man die Regel braucht (bei Regeln für den Aufbau eines Terms)
  readonly when?: string
  // Beispielfunktionen in Aufgabenform (beim impliziten Ableiten Gleichungen); die erste ist
  // die einfachste
  readonly examples: readonly (Expr | Equation)[]
  // Ids der typischen Fehler (Fehlerregeln)
  readonly errors: readonly string[]
}

const [x2, x3] = [pow(x, num(2)), pow(x, num(3))]

export const CARDS: readonly Card[] = [
  {
    id: 'constant',
    topic: 'ableitungen',
    title: 'Konstante',
    level: 1,
    rules: ['constant'],
    formulas: [RULES.constant.formula],
    memo: 'Eine Zahl ohne $x$ ändert sich nicht, wenn sich $x$ ändert. Ihre Ableitung ist deshalb $0$.',
    examples: [num(7), sub(x3, num(4))],
    errors: ['constant-summand-kept'],
  },
  {
    id: 'power',
    topic: 'ableitungen',
    title: 'Potenzregel',
    level: 1,
    rules: ['power'],
    formulas: [RULES.power.formula],
    memo: 'Den Exponenten als Faktor nach vorne holen, dann vom Exponenten $1$ abziehen.',
    note: 'Das gilt für jede Zahl als Exponent, auch für negative Zahlen und Brüche.',
    examples: [pow(x, num(5)), pow(x, num(-2)), pow(x, num(3, 2))],
    errors: ['power-exponent-not-reduced', 'power-exponent-not-multiplied', 'power-negative-wrong-direction', 'power-sign-forgotten'],
  },
  {
    id: 'rewrite',
    topic: 'ableitungen',
    title: 'Wurzeln und Brüche',
    level: 1,
    rules: ['rewrite'],
    formulas: ['\\frac{1}{x^n} = x^{-n}', '\\sqrt{x} = x^{\\frac{1}{2}}', '\\sqrt[n]{x^m} = x^{\\frac{m}{n}}'],
    memo: 'Erst als Potenz schreiben, dann mit der Potenzregel ableiten.',
    note: 'Ein $x^n$ im Nenner bekommt einen negativen Exponenten, eine Wurzel einen Bruch als Exponenten.',
    examples: [div(num(1), x3), sqrt(x), root(x2, 3)],
    errors: ['power-root-factor-forgotten', 'power-fraction-numerator-only', 'power-sign-forgotten'],
  },
  {
    id: 'constant-factor',
    topic: 'ableitungen',
    title: 'Faktorregel',
    level: 1,
    rules: ['constantFactor'],
    formulas: [RULES.constantFactor.formula],
    memo: 'Eine feste Zahl als Faktor bleibt beim Ableiten einfach stehen. Abgeleitet wird nur der Rest.',
    when: WHEN_NEEDED.constantFactor,
    examples: [mul(num(4), x3), mul(num(-2), pow(x, num(5))), div(pow(x, num(4)), num(8))],
    errors: ['factor-forgotten'],
  },
  {
    id: 'sum',
    topic: 'ableitungen',
    title: 'Summenregel',
    level: 1,
    rules: ['sum'],
    formulas: [RULES.sum.formula, "(u - v)' = u' - v'"],
    memo: 'Jeden Summanden einzeln ableiten und die Ergebnisse wieder zusammenzählen. Eine Zahl ohne $x$ fällt dabei weg.',
    when: WHEN_NEEDED.sum,
    examples: [add(x3, mul(num(5), x), neg(num(2))), add(mul(num(2), pow(x, num(4))), neg(div(num(1), x)), num(3)), add(x2, sqrt(x))],
    errors: ['constant-summand-kept'],
  },
  {
    id: 'exp',
    topic: 'ableitungen',
    title: 'e-Funktion',
    level: 2,
    rules: ['exp'],
    formulas: [RULES.exp.formula],
    memo: 'Die e-Funktion ändert sich beim Ableiten nicht.',
    examples: [mul(num(3), exp(x)), add(exp(x), x2), exp(mul(num(-2), x))],
    errors: ['exp-power-rule'],
  },
  {
    id: 'ln',
    topic: 'ableitungen',
    title: 'Natürlicher Logarithmus',
    level: 2,
    rules: ['ln'],
    formulas: [RULES.ln.formula],
    memo: 'Die Ableitung von $\\ln x$ ist der Kehrwert von $x$.',
    note: 'Das gilt für $x > 0$, denn nur dort ist $\\ln x$ definiert.',
    examples: [mul(num(4), ln(x)), sub(x3, ln(x)), ln(mul(num(5), x))],
    errors: ['ln-like-exp', 'ln-reciprocal-of-ln'],
  },
  {
    id: 'sin-cos',
    topic: 'ableitungen',
    title: 'Sinus und Kosinus',
    level: 2,
    rules: ['sin', 'cos'],
    formulas: [RULES.sin.formula, RULES.cos.formula],
    memo: 'Sinus wird Kosinus, Kosinus wird minus Sinus.',
    note: 'Immer weiter abgeleitet, geht es im Kreis: $\\sin x \\to \\cos x \\to -\\sin x \\to -\\cos x \\to \\sin x$.',
    examples: [add(sin(x), cos(x)), mul(num(-5), cos(x)), cos(mul(num(3), x))],
    errors: ['sin-sign', 'cos-sign'],
  },
  {
    id: 'product',
    topic: 'ableitungen',
    title: 'Produktregel',
    level: 2,
    rules: ['product'],
    formulas: [RULES.product.formula],
    memo: 'Einmal den ersten Faktor ableiten, einmal den zweiten. Der andere Faktor bleibt jeweils unverändert, beides wird addiert.',
    when: WHEN_NEEDED.product,
    examples: [mul(x2, exp(x)), mul(x3, sin(x)), mul(x, ln(x))],
    errors: ['product-derivatives-multiplied', 'product-second-summand-missing', 'product-minus'],
  },
  {
    id: 'chain',
    topic: 'ableitungen',
    title: 'Kettenregel',
    level: 2,
    rules: ['chain'],
    formulas: [RULES.chain.formula],
    memo: 'Äußere Ableitung mal innere Ableitung. In der äußeren Ableitung bleibt die innere Funktion unverändert stehen.',
    note: 'In den Aufgaben heißt die innere Funktion $u$: Die äußere Funktion wird nach $u$ abgeleitet, dann wird mit $u\'$ malgenommen.',
    when: WHEN_NEEDED.chain,
    examples: [sin(mul(num(3), x)), exp(x2), pow(add(mul(num(2), x), num(1)), num(5)), ln(add(x2, num(1)))],
    errors: [
      'chain-inner-forgotten',
      'chain-outer-wrong-argument',
      'chain-inner-derivative-substituted',
      'chain-times-inner-function',
      'notation-power-on-name',
    ],
  },
  {
    id: 'quotient',
    topic: 'ableitungen',
    title: 'Quotientenregel',
    level: 3,
    rules: ['quotient'],
    formulas: [RULES.quotient.formula],
    memo: 'Ableitung oben mal unten, minus oben mal Ableitung unten, alles geteilt durch unten im Quadrat.',
    note: 'Merkhilfe „NAZ minus ZAN durch $N^2$": Nenner mal Ableitung des Zählers minus Zähler mal Ableitung des Nenners, geteilt durch den Nenner im Quadrat.',
    when: WHEN_NEEDED.quotient,
    examples: [div(sin(x), x), div(x2, add(x, num(1))), div(exp(x), x)],
    errors: ['quotient-numerator-swapped', 'quotient-denominator-not-squared', 'quotient-separately'],
  },
  {
    id: 'exp-base',
    topic: 'ableitungen',
    title: 'Exponentialfunktion $a^x$',
    level: 4,
    rules: ['expBase'],
    formulas: [RULES.expBase.formula],
    memo: 'Wie bei der e-Funktion, nur kommt der Faktor $\\ln a$ dazu.',
    note: 'Das folgt aus $a^x = e^{x \\ln a}$ mit der Kettenregel.',
    examples: [pow(num(2), x), mul(num(3), pow(num(5), x)), pow(num(2), mul(num(3), x))],
    errors: ['exp-base-power-rule', 'exp-base-ln-forgotten'],
  },
  {
    id: 'log-base',
    topic: 'ableitungen',
    title: 'Logarithmus $\\log_a x$',
    level: 4,
    rules: ['logBase'],
    formulas: [RULES.logBase.formula],
    memo: 'Wie beim natürlichen Logarithmus, nur kommt $\\ln a$ in den Nenner.',
    note: 'Das folgt aus $\\log_a x = \\frac{\\ln x}{\\ln a}$.',
    examples: [log(num(2), x), mul(num(3), log(num(10), x)), log(num(5), mul(num(2), x))],
    errors: ['log-base-ln-forgotten'],
  },
  {
    id: 'tan',
    topic: 'ableitungen',
    title: 'Tangens',
    level: 4,
    rules: ['tan'],
    formulas: [RULES.tan.formula],
    memo: 'Die Ableitung ist $1$ geteilt durch den Kosinus im Quadrat.',
    note: "Gleichwertig ist $(\\tan x)' = 1 + \\tan^2 x$. Beides folgt aus $\\tan x = \\frac{\\sin x}{\\cos x}$ mit der Quotientenregel.",
    examples: [mul(num(3), tan(x)), tan(mul(num(2), x))],
    errors: ['tan-sin-cos-swapped'],
  },
  {
    id: 'arctan',
    topic: 'ableitungen',
    title: 'Arkustangens',
    level: 4,
    rules: ['arctan'],
    formulas: [RULES.arctan.formula],
    memo: 'In der Ableitung steht keine Winkelfunktion mehr: $1$ geteilt durch $1 + x^2$.',
    examples: [mul(num(2), fn('arctan', x)), fn('arctan', mul(num(3), x))],
    errors: ['arctan-sign', 'arctan-arcsin'],
  },
  {
    id: 'logarithmic',
    topic: 'ableitungen',
    title: 'Logarithmisches Ableiten',
    level: 5,
    rules: ['logarithmic'],
    formulas: [RULES.logarithmic.formula],
    memo: 'Erst logarithmieren, dann beide Seiten ableiten, dann mit der Funktion malnehmen.',
    note: "Logarithmengesetz: $\\ln(a^b) = b \\cdot \\ln a$. Links ergibt das Ableiten $(\\ln f(x))' = \\frac{f'(x)}{f(x)}$ (Kettenregel).",
    when: 'Du brauchst es, wenn Basis und Exponent von $x$ abhängen, z. B. $x^x$ oder $x^{\\sin x}$. Dann passt weder die Potenzregel noch die Regel für $a^x$.',
    examples: [pow(x, x), pow(x, sin(x)), pow(add(x2, num(1)), x)],
    errors: ['logarithmic-power-rule', 'logarithmic-as-exponential', 'logarithmic-factor-forgotten'],
  },
  {
    id: 'arcsin-arccos',
    topic: 'ableitungen',
    title: 'Arkussinus und Arkuskosinus',
    level: 5,
    rules: ['arcsin', 'arccos'],
    formulas: [RULES.arcsin.formula, RULES.arccos.formula],
    memo: 'Beide haben $\\sqrt{1 - x^2}$ im Nenner. Beim Arkuskosinus steht ein Minus davor.',
    note: [
      'Das gilt für $-1 < x < 1$.',
      'Herleitung mit der Ableitung der Umkehrfunktion:',
      "$\\left(f^{-1}\\right)'(x) = \\frac{1}{f'\\left(f^{-1}(x)\\right)}$",
      'Der Arkussinus ist die Umkehrfunktion des Sinus. Mit $\\cos y = \\sqrt{1 - \\sin^2 y}$ für $-\\frac{\\pi}{2} \\le y \\le \\frac{\\pi}{2}$ folgt:',
      "$(\\arcsin x)' = \\frac{1}{\\cos(\\arcsin x)} = \\frac{1}{\\sqrt{1 - x^2}}$",
    ].join('\n'),
    examples: [mul(num(3), fn('arcsin', x)), fn('arccos', x2), mul(x, fn('arcsin', x))],
    errors: ['arcsin-arccos', 'arcsin-root-sign', 'arccos-sign'],
  },
  {
    id: 'hyperbolic',
    topic: 'ableitungen',
    title: 'Hyperbelfunktionen',
    level: 5,
    rules: ['sinh', 'cosh', 'tanh'],
    formulas: [RULES.sinh.formula, RULES.cosh.formula, RULES.tanh.formula],
    memo: 'Wie Sinus und Kosinus, aber ohne Minuszeichen: $\\sinh$ wird $\\cosh$, $\\cosh$ wird $\\sinh$.',
    note: "Definition: $\\sinh x = \\frac{e^x - e^{-x}}{2}$ und $\\cosh x = \\frac{e^x + e^{-x}}{2}$. Gleichwertig zur Formel oben: $(\\tanh x)' = 1 - \\tanh^2 x$.",
    examples: [fn('sinh', mul(num(3), x)), fn('cosh', x2), fn('tanh', mul(num(2), x))],
    errors: ['sinh-sign', 'cosh-sign', 'tanh-like-tan', 'tanh-sinh-cosh-swapped'],
  },
  {
    id: 'area',
    topic: 'ableitungen',
    title: 'Areafunktionen',
    level: 5,
    rules: ['arsinh', 'arcosh', 'artanh'],
    formulas: [RULES.arsinh.formula, RULES.arcosh.formula, RULES.artanh.formula],
    memo: 'Die Umkehrfunktionen der Hyperbelfunktionen. Ihre Ableitungen sind Brüche ohne Hyperbelfunktion.',
    note: 'Vorzeichen merken: $\\operatorname{arsinh}$ hat $x^2 + 1$ unter der Wurzel, $\\operatorname{arcosh}$ hat $x^2 - 1$ (für $x > 1$), $\\operatorname{artanh}$ hat $1 - x^2$ im Nenner (für $-1 < x < 1$).',
    examples: [fn('arsinh', mul(num(2), x)), fn('arcosh', x2), add(x, fn('artanh', x))],
    errors: ['arsinh-arcosh', 'arcosh-arsinh', 'artanh-arctan'],
  },
  {
    id: 'implicit',
    topic: 'ableitungen',
    title: 'Implizites Ableiten',
    level: 5,
    rules: ['dependent'],
    formulas: [RULES.dependent.formula, "(x \\cdot y)' = y + x \\cdot y'"],
    memo: "$y$ hängt von $x$ ab: Jeder Term mit $y$ bekommt beim Ableiten den Faktor $y'$. Danach löst du nach $y'$ auf.",
    note: [
      'So gehst du vor:',
      '1. Beide Seiten nach $x$ ableiten.',
      "2. Alle Terme mit $y'$ auf eine Seite bringen und $y'$ ausklammern.",
      "3. Durch den Faktor vor $y'$ teilen. Im Ergebnis darf $y$ stehen bleiben.",
    ].join('\n'),
    when: 'Du brauchst es, wenn eine Kurve als Gleichung in $x$ und $y$ gegeben ist, z. B. $x^2 + y^2 = 25$, und sich nicht gut nach $y$ auflösen lässt.',
    examples: [
      eq(add(x2, pow(y, num(2))), num(25)),
      eq(add(mul(x, y), exp(y)), num(2)),
      eq(pow(y, num(2)), sub(x3, mul(num(2), x))),
    ],
    errors: ['implicit-y-constant', 'implicit-y-prime-forgotten', 'implicit-x-as-constant', 'implicit-constant-side-kept'],
  },
]

export function topicById(id: string): Topic | undefined {
  return TOPICS.find((topic) => topic.id === id)
}

export const cardsInTopic = (topic: string) => CARDS.filter((card) => card.topic === topic)

export function cardById(id: string): Card | undefined {
  return CARDS.find((card) => card.id === id)
}

export function cardForRule(rule: RuleId): Card | undefined {
  return CARDS.find((card) => card.rules.includes(rule))
}

// Beispiele einer Karte. In einer Aufgabe ohne die, die dort als Teil vorkommen: Sonst verriete
// die Karte das Ergebnis eines Schritts (z. B. 4x³ in 4x³ − 2/x + √x).
// (Bei Gleichungen ist task linke minus rechte Seite.)
export function examplesFor(card: Card, task?: Expr): readonly (Expr | Equation)[] {
  if (!task) return card.examples
  const parts = new Set(subterms(task).map(key))
  const fresh = card.examples.filter((e) => !parts.has(key(isEquation(e) ? sub(e.lhs, e.rhs) : e)))
  return fresh.length > 0 ? fresh : card.examples
}

// Karten zu Regeln, jede einmal, in der Reihenfolge der Regeln; Regeln ohne Karte fallen weg
export function cardIdsFor(rules: Iterable<RuleId>): string[] {
  const ids: string[] = []
  for (const rule of rules) {
    const card = cardForRule(rule)
    if (card && !ids.includes(card.id)) ids.push(card.id)
  }
  return ids
}
