import { type Expr, mul, num, pow, variable, x } from '../expr/types.ts'
import { toFrac } from '../fraction/frac.ts'
import { type Poly, polyDivideExact } from '../fraction/poly.ts'
import { type FractionShape, type FractionTask, type Part, expanded, minus, part, plus } from '../fraction/task.ts'
import type { Card } from './cards.ts'

// Lernkarten im Ordner „Brüche". Die Beispiele sind Aufgaben der Bruch-Engine; den Rechenweg dazu
// rechnet sie selbst (fractionExample.ts). Welche Karte zu welchem Schritt gehört, entscheidet der
// Schrittplaner (guided/fractionPlan.ts).

export const FRACTION_CARD_IDS = {
  reduce: 'fraction-reduce',
  expand: 'fraction-expand',
  add: 'fraction-add',
  multiply: 'fraction-multiply',
  divide: 'fraction-divide',
  powers: 'fraction-powers',
} as const

// --- Beispiele bauen ---

function poly(e: Expr): Poly {
  const f = toFrac(e)!
  return polyDivideExact(f.num, f.den)!
}

// Bruch aus Zähler und Nenner (Terme ohne Bruch)
const fr = (n: Expr, d: Expr = num(1)): Part => part(expanded(poly(n)), expanded(poly(d)))
const task = (s: FractionShape): FractionTask => ({ ...s, hints: [] }) as FractionTask
const [a, b, y] = ['a', 'b', 'y'].map(variable)
const n = (value: number) => num(value)

export const FRACTION_CARD_LIST: readonly Card[] = [
  {
    id: FRACTION_CARD_IDS.reduce,
    topic: 'brueche',
    title: 'Kürzen',
    level: 1,
    rules: [],
    formulas: ['\\frac{a \\cdot k}{b \\cdot k} = \\frac{a}{b}'],
    memo: 'Zähler und Nenner durch denselben Faktor teilen. Der Wert des Bruchs bleibt gleich.',
    note: 'Vollständig gekürzt ist ein Bruch, wenn Zähler und Nenner keinen gemeinsamen Faktor mehr haben. Kürzt sich der ganze Zähler weg, bleibt dort eine $1$.',
    when: 'Am Ende jeder Rechnung mit Brüchen: Das Ergebnis wird so weit wie möglich gekürzt.',
    examples: [task({ kind: 'reduce', part: fr(n(18), n(24)) }), task({ kind: 'reduce', part: fr(n(35), n(14)) }), task({ kind: 'reduce', part: fr(n(12), n(36)) })],
    errors: ['frac-cancel-one-side', 'frac-cancel-forgot-one'],
  },
  {
    id: FRACTION_CARD_IDS.expand,
    topic: 'brueche',
    title: 'Erweitern',
    level: 1,
    rules: [],
    formulas: ['\\frac{a}{b} = \\frac{a \\cdot k}{b \\cdot k}', 'n = \\frac{n \\cdot k}{k}'],
    memo: 'Zähler und Nenner mit demselben Faktor malnehmen. Der Wert bleibt gleich, nur Zähler und Nenner werden größer.',
    note: 'Den Faktor findest du so: Hauptnenner geteilt durch den Nenner des Bruchs. Eine ganze Zahl ist ein Bruch mit dem Nenner $1$.',
    when: 'Vor dem Addieren und Subtrahieren: Alle Brüche bekommen denselben Nenner, den Hauptnenner.',
    examples: [
      task({ kind: 'sum', terms: [plus(fr(n(1), n(3))), plus(fr(n(1), n(6)))] }),
      task({ kind: 'sum', terms: [plus(fr(n(2))), minus(fr(n(3), n(5)))] }),
      task({ kind: 'sum', terms: [plus(fr(n(3), n(4))), minus(fr(n(1), n(6)))] }),
    ],
    errors: ['frac-expand-denominator-only', 'frac-expand-own-denominator', 'frac-whole-not-expanded'],
  },
  {
    id: FRACTION_CARD_IDS.add,
    topic: 'brueche',
    title: 'Plus und minus',
    level: 1,
    rules: [],
    formulas: ['\\frac{a}{n} + \\frac{b}{n} = \\frac{a + b}{n}', '\\frac{a}{n} - \\frac{b}{n} = \\frac{a - b}{n}'],
    memo: 'Erst alle Brüche auf den Hauptnenner bringen, dann nur die Zähler zusammenrechnen. Der Nenner bleibt.',
    note: [
      'So gehst du vor:',
      '1. Hauptnenner bestimmen: der kleinste Nenner, durch den jeder Nenner teilbar ist (das kleinste gemeinsame Vielfache).',
      '2. Jeden Bruch auf den Hauptnenner erweitern.',
      '3. Zähler zusammenfassen, Nenner abschreiben. Nach einem Minus gilt das Minus für den ganzen Zähler.',
      '4. Kürzen, wenn möglich.',
    ].join('\n'),
    examples: [
      task({ kind: 'sum', terms: [plus(fr(n(3), n(4))), plus(fr(n(5), n(6)))] }),
      task({ kind: 'sum', terms: [plus(fr(n(5), n(6))), minus(fr(n(1), n(4)))] }),
      task({ kind: 'sum', terms: [plus(fr(n(2), x)), minus(fr(n(1), pow(x, n(2))))] }),
    ],
    // Klammer nach dem Minus und Ausmultiplizieren kommen mit Stufe 3 dazu (Summen im Zähler)
    errors: ['frac-lcd-gcd', 'frac-lcd-sum', 'frac-lcd-factor-missing', 'frac-add-across'],
  },
  {
    id: FRACTION_CARD_IDS.multiply,
    topic: 'brueche',
    title: 'Malnehmen',
    level: 1,
    rules: [],
    formulas: ['\\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{a \\cdot c}{b \\cdot d}', 'n \\cdot \\frac{a}{b} = \\frac{n \\cdot a}{b}'],
    memo: 'Zähler mal Zähler, Nenner mal Nenner. Einen Hauptnenner brauchst du dafür nicht.',
    note: 'Kürze am besten vor dem Ausrechnen, auch über Kreuz: einen Zähler gegen den Nenner des anderen Bruchs.',
    examples: [
      task({ kind: 'product', left: fr(n(3), n(10)), right: fr(n(2), n(3)) }),
      task({ kind: 'product', left: fr(n(4)), right: fr(n(5), n(6)) }),
      task({ kind: 'product', left: fr(mul(n(3), a), mul(n(4), b)), right: fr(mul(n(8), pow(b, n(2))), mul(n(9), a)) }),
    ],
    errors: ['frac-number-times-both', 'frac-multiply-reciprocal'],
  },
  {
    id: FRACTION_CARD_IDS.divide,
    topic: 'brueche',
    title: 'Teilen',
    level: 1,
    rules: [],
    formulas: ['\\frac{a}{b} : \\frac{c}{d} = \\frac{a}{b} \\cdot \\frac{d}{c}'],
    memo: 'Durch einen Bruch teilst du, indem du mit seinem Kehrwert malnimmst. Den Kehrwert bekommst du, wenn du Zähler und Nenner vertauschst.',
    note: 'Umgedreht wird nur der Bruch, durch den du teilst, also der zweite.',
    examples: [
      task({ kind: 'quotient', left: fr(n(3), n(4)), right: fr(n(2), n(5)) }),
      task({ kind: 'quotient', left: fr(n(5), n(6)), right: fr(n(10), n(9)) }),
      task({ kind: 'quotient', left: fr(n(2), n(3)), right: fr(n(4)) }),
    ],
    errors: ['frac-reciprocal-forgotten', 'frac-reciprocal-first'],
  },
  {
    id: FRACTION_CARD_IDS.powers,
    topic: 'brueche',
    title: 'Potenzen kürzen',
    level: 2,
    rules: [],
    formulas: ['\\frac{x^m}{x^n} = x^{m - n}', '\\frac{x^m}{x^n} = \\frac{1}{x^{n - m}} \\quad (n > m)'],
    memo: 'Gleiche Buchstaben oben und unten kürzen sich: Die Hochzahlen werden abgezogen. Der Rest bleibt dort, wo die höhere Hochzahl stand.',
    note: 'Zahlen und Buchstaben kürzt du getrennt: erst die Zahlen, dann jeden Buchstaben für sich.',
    examples: [
      task({ kind: 'reduce', part: fr(mul(n(6), pow(x, n(2)), y), mul(n(9), x, pow(y, n(3)))) }),
      task({ kind: 'reduce', part: fr(mul(n(4), pow(a, n(5))), mul(n(10), pow(a, n(2)), b)) }),
      task({ kind: 'reduce', part: fr(pow(x, n(3)), mul(n(2), pow(x, n(4)))) }),
    ],
    errors: ['frac-power-reversed', 'frac-power-divided'],
  },
]
