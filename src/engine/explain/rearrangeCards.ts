import { type Expr, add, div, eq, mul, num, sub, variable } from '../expr/types.ts'
import type { RearrangeTask } from '../rearrange/task.ts'
import type { Card } from './cards.ts'

// Lernkarten im Ordner „Gleichungen umstellen". Die Beispiele sind Aufgaben der Umstell-Engine; den
// Rechenweg dazu rechnet sie selbst (rearrangeExample.ts). Welche Karte zu welchem Schritt gehört,
// entscheidet der Schrittplaner (guided/rearrangePlan.ts).

export const REARRANGE_CARD_IDS = {
  inverse: 'rearrange-inverse',
  move: 'rearrange-move',
  denominator: 'rearrange-denominator',
  collect: 'rearrange-collect',
} as const

const [a, b, c, d, x, y] = ['a', 'b', 'c', 'd', 'x', 'y'].map(variable)
const n = (value: number) => num(value)
const task = (lhs: Expr, rhs: Expr, target = 'x'): RearrangeTask => ({ equation: eq(lhs, rhs), target, conditions: [] })

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
]
