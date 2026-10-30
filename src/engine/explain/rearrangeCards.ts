import { type Expr, add, div, eq, mul, num, pow, sqrt, sub, variable } from '../expr/types.ts'
import type { Condition, RearrangeTask } from '../rearrange/task.ts'
import type { Card } from './cards.ts'

// Lernkarten im Ordner „Gleichungen umstellen". Die Beispiele sind Aufgaben der Umstell-Engine; den
// Rechenweg dazu rechnet sie selbst (rearrangeExample.ts). Welche Karte zu welchem Schritt gehört,
// entscheidet der Schrittplaner (guided/rearrangePlan.ts).

export const REARRANGE_CARD_IDS = {
  inverse: 'rearrange-inverse',
  move: 'rearrange-move',
  denominator: 'rearrange-denominator',
  collect: 'rearrange-collect',
  clear: 'rearrange-clear',
  reciprocal: 'rearrange-reciprocal',
  root: 'rearrange-root',
} as const

const [a, b, c, d, x, y] = ['a', 'b', 'c', 'd', 'x', 'y'].map(variable)
const n = (value: number) => num(value)
const task = (lhs: Expr, rhs: Expr, target = 'x', conditions: readonly Condition[] = []): RearrangeTask => ({ equation: eq(lhs, rhs), target, conditions })
const sq = (e: Expr) => pow(e, n(2))

export const REARRANGE_CARD_LIST: readonly Card[] = [
  {
    id: REARRANGE_CARD_IDS.inverse,
    topic: 'umstellen',
    title: 'Gegenrechnung auf beiden Seiten',
    level: 1,
    rules: [],
    formulas: ['a \\cdot x = c \\;\\Leftrightarrow\\; x = \\frac{c}{a}', '\\frac{x}{a} = c \\;\\Leftrightarrow\\; x = c \\cdot a'],
    memo: 'Mach die Rechnung um die Variable mit der Gegenrechnung rückgängig, immer auf beiden Seiten. Mal wird zu geteilt, geteilt wird zu mal.',
    note: 'Fang außen an: Was zuletzt gerechnet wurde, machst du zuerst rückgängig. Eine Gleichung ist wie eine Waage: Was auf einer Seite passiert, muss auch auf der anderen passieren.',
    when: 'Immer, wenn die Variable nur einmal vorkommt: Schale sie von außen nach innen frei.',
    examples: [task(y, mul(a, x)), task(y, div(mul(n(3), sub(x, a)), b)), task(add(mul(a, sub(mul(n(4), x), b)), c), d)],
    errors: ['eq-inverse-op', 'eq-divide-one-term', 'eq-fraction-flipped'],
  },
  {
    id: REARRANGE_CARD_IDS.move,
    topic: 'umstellen',
    title: 'Rüberbringen mit Vorzeichenwechsel',
    level: 1,
    rules: [],
    formulas: ['x + b = c \\;\\Leftrightarrow\\; x = c - b', 'x - b = c \\;\\Leftrightarrow\\; x = c + b'],
    memo: 'Ein Summand wechselt beim Rüberbringen auf die andere Seite sein Vorzeichen.',
    note: 'Rüberbringen ist nichts anderes als die Gegenrechnung auf beiden Seiten: Aus $+b$ wird auf beiden Seiten $-b$, auf der einen Seite hebt es sich weg.',
    when: 'Wenn neben dem Teil mit der Variable noch ein Summand steht.',
    examples: [task(y, add(x, b)), task(y, sub(a, div(sub(x, b), n(3)))), task(sub(div(x, a), div(b, c)), d)],
    errors: ['eq-sign-not-flipped'],
  },
  {
    id: REARRANGE_CARD_IDS.denominator,
    topic: 'umstellen',
    title: 'Variable im Nenner',
    level: 2,
    rules: [],
    formulas: ['\\frac{a}{x} = c \\;\\Leftrightarrow\\; a = c \\cdot x \\;\\Leftrightarrow\\; x = \\frac{a}{c}'],
    memo: 'Steht die Variable im Nenner, nimm beide Seiten mit dem ganzen Nenner mal. Dann steht sie oben.',
    note: 'Ist der Nenner eine Summe wie $b - x$, gehört er beim Malnehmen in Klammern.',
    when: 'Wenn die Variable unter einem Bruchstrich steht.',
    examples: [task(add(div(a, x), b), c), task(y, div(a, sub(b, x))), task(y, add(div(n(4), sub(x, a)), b))],
    errors: ['eq-denominator-bracket', 'eq-fraction-flipped'],
  },
  {
    id: REARRANGE_CARD_IDS.collect,
    topic: 'umstellen',
    title: 'Variable mehrfach: sortieren und ausklammern',
    level: 2,
    rules: [],
    formulas: ['ax + b = cx + d', '\\Leftrightarrow\\; ax - cx = d - b', '\\Leftrightarrow\\; x(a - c) = d - b', '\\Leftrightarrow\\; x = \\frac{d - b}{a - c}'],
    memo: 'Klammern ausmultiplizieren, alle Summanden mit der Variable auf eine Seite, die Variable ausklammern und durch die Klammer teilen.',
    note: 'Beim Ausklammern bleibt von einem Summanden, der nur $x$ ist, eine $1$ in der Klammer: $xy - x = x(y - 1)$.',
    when: 'Wenn die Variable auf beiden Seiten oder in mehreren Summanden steht.',
    examples: [task(add(mul(a, x), b), add(mul(c, x), d)), task(mul(a, add(x, b)), mul(c, sub(x, d))), task(sub(mul(n(2), x), a), mul(b, sub(c, x)))],
    errors: ['eq-sign-not-flipped', 'eq-bracket-first-term', 'eq-factor-one-lost', 'eq-divide-one-term'],
  },
  {
    id: REARRANGE_CARD_IDS.clear,
    topic: 'umstellen',
    title: 'Mit dem Hauptnenner malnehmen',
    level: 3,
    rules: [],
    formulas: ['\\frac{a}{x - b} = \\frac{c}{x + d}', '\\Leftrightarrow\\; a(x + d) = c(x - b)'],
    memo: 'Steht die Variable in mehreren Nennern oder oben und unten in einem Bruch, nimm beide Seiten mit dem Hauptnenner mal. Dann sind alle Brüche weg.',
    note: 'Bei je einem Bruch auf jeder Seite heißt das: über Kreuz malnehmen. Nenner, die Summen sind, gehören dabei in Klammern. Danach geht es weiter wie bei „Variable mehrfach": ausmultiplizieren, sortieren, ausklammern, teilen.',
    when: 'Wenn die Variable in Brüchen auf beiden Seiten oder in Zähler und Nenner steht.',
    examples: [task(y, div(add(mul(n(2), x), n(1)), sub(x, n(3)))), task(div(a, sub(x, b)), div(c, add(x, b))), task(div(x, add(x, a)), div(b, c))],
    errors: ['eq-denominator-bracket', 'eq-bracket-first-term'],
  },
  {
    id: REARRANGE_CARD_IDS.reciprocal,
    topic: 'umstellen',
    title: 'Kehrwert auf beiden Seiten',
    level: 3,
    rules: [],
    formulas: ['\\frac{1}{x} = \\frac{p}{q} \\;\\Leftrightarrow\\; x = \\frac{q}{p}'],
    memo: 'Steht die Variable allein unter einem Bruchstrich mit $1$ darüber, nimm auf beiden Seiten den Kehrwert. Vorher muss die andere Seite ein einziger Bruch sein.',
    note: 'Den Kehrwert einer Summe darfst du nicht Summand für Summand nehmen: Aus $\\frac{1}{x} = \\frac{1}{a} + \\frac{1}{b}$ folgt nicht $x = a + b$. Fasse erst zu einem Bruch zusammen.',
    when: 'Bei Kehrwert-Formeln wie $\\frac{1}{x} + \\frac{1}{a} = \\frac{1}{b}$.',
    examples: [task(div(n(1), x), add(div(n(1), a), div(n(1), b))), task(add(div(n(1), x), div(n(1), a)), div(n(1), b), 'a', [{ lhs: x, rel: '>', rhs: b }]), task(div(n(1), add(x, a)), b, 'x', [{ lhs: b, rel: '<', rhs: div(n(1), a) }])],
    errors: ['eq-reciprocal-termwise'],
  },
  {
    id: REARRANGE_CARD_IDS.root,
    topic: 'umstellen',
    title: 'Wurzel und Quadrat',
    level: 3,
    rules: [],
    formulas: ['\\sqrt{A} = B \\;\\Rightarrow\\; A = B^2', 'x^2 = A \\;\\Rightarrow\\; x = \\sqrt{A}', '(u + v)^2 = u^2 + 2uv + v^2'],
    memo: 'Gegen eine Wurzel hilft Quadrieren, gegen ein Quadrat die Wurzel, immer auf beiden Seiten und immer die ganze Seite. Steht die Wurzel nicht allein, stelle sie zuerst allein.',
    note: 'Quadrieren kann Scheinlösungen erzeugen: $\\sqrt{A} = B$ geht nur, wenn $B \\geq 0$ ist. Weil hier alle Buchstaben positiv sind, brauchst du beim Wurzelziehen kein $\\pm$.',
    when: 'Wenn die Variable unter einer Wurzel oder in einem Quadrat steht.',
    examples: [task(y, mul(a, sqrt(sub(sq(b), sq(x))))), task(y, sqrt(div(add(x, a), sub(x, a))), 'x', [{ lhs: x, rel: '>', rhs: a }]), task(y, sub(sqrt(add(x, a)), sqrt(x)))],
    errors: ['eq-root-termwise', 'eq-square-one-factor', 'eq-square-middle'],
  },
]
