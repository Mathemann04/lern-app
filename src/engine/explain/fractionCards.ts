import { type Expr, add, cos, exp, ln, mul, num, pow, sin, sqrt, sub, variable, x } from '../expr/types.ts'
import { toFrac } from '../fraction/frac.ts'
import { type Poly, polyDivideExact } from '../fraction/poly.ts'
import { type BlockRule, type FractionShape, type FractionTask, type Part, expanded, minus, part, plus, withRoots } from '../fraction/task.ts'
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
  factorOut: 'fraction-factor-out',
  binomial: 'fraction-binomial',
  quadratic: 'fraction-quadratic',
  lcdTerms: 'fraction-lcd-terms',
  sumCancel: 'fraction-sum-cancel',
  complex: 'fraction-complex',
  blocks: 'fraction-blocks',
  blockRules: 'fraction-block-rules',
} as const

// --- Beispiele bauen ---

function poly(e: Expr): Poly {
  const f = toFrac(e)!
  return polyDivideExact(f.num, f.den)!
}

// Bruch aus Zähler und Nenner (Terme ohne Bruch); frAscending: Zähler mit der Zahl zuerst (2 − x)
const fr = (n: Expr, d: Expr = num(1)): Part => part(expanded(poly(n)), expanded(poly(d)))
const frAscending = (n: Expr, d: Expr): Part => part(expanded(poly(n), true), expanded(poly(d)))
const task = (s: FractionShape, rule?: BlockRule): FractionTask => withRoots({ ...s, hints: [], ...(rule ? { rule } : {}) } as FractionTask)
// 1 − sin x: die 1 vorn
const frUnit = (n: Expr, d: Expr): Part => part(expanded(poly(n)), expanded(poly(d), true))
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
    errors: ['frac-lcd-gcd', 'frac-lcd-sum', 'frac-lcd-factor-missing', 'frac-add-across', 'frac-minus-bracket', 'frac-distribute-first-only'],
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
  {
    id: FRACTION_CARD_IDS.factorOut,
    topic: 'brueche',
    title: 'Ausklammern',
    level: 3,
    rules: [],
    formulas: ['k \\cdot a + k \\cdot b = k(a + b)', 'b - a = -(a - b)'],
    memo: 'Was in jedem Summanden steckt, kommt vor die Klammer. In der Klammer bleibt, was beim Teilen übrig ist.',
    note: 'Probe: Ausmultiplizieren muss wieder genau den Term von vorher ergeben. Auch ein Minus lässt sich ausklammern, so wird aus $2 - x$ der Term $-(x - 2)$.',
    when: 'Vor dem Kürzen: Kürzen darfst du nur Faktoren, also muss eine Summe erst zum Produkt werden.',
    examples: [
      task({ kind: 'reduce', part: fr(add(mul(n(3), x), n(6)), add(pow(x, n(2)), mul(n(2), x))) }),
      task({ kind: 'reduce', part: fr(sub(pow(x, n(2)), mul(n(5), x)), sub(mul(n(2), x), n(10))) }),
      task({ kind: 'reduce', part: fr(add(mul(n(4), x), n(8)), add(mul(n(6), x), n(12))) }),
    ],
    errors: ['frac-factor-wrong'],
  },
  {
    id: FRACTION_CARD_IDS.binomial,
    topic: 'brueche',
    title: 'Binomische Formeln',
    level: 3,
    rules: [],
    formulas: ['a^2 + 2ab + b^2 = (a + b)^2', 'a^2 - 2ab + b^2 = (a - b)^2', 'a^2 - b^2 = (a + b)(a - b)'],
    memo: 'Rückwärts gelesen zerlegen die binomischen Formeln: Zwei Quadrate mit Minus dazwischen ergeben $(a + b)(a - b)$, mit passendem Mittelglied ein Quadrat.',
    note: 'Prüfe das Mittelglied: Bei $x^2 + 10x + 25$ ist $2 \\cdot x \\cdot 5 = 10x$, also ist es $(x + 5)^2$. Vorwärts gilt dasselbe: Wer $(x + h)^2$ ausmultipliziert, darf das Mittelglied $2xh$ nicht vergessen.',
    when: 'Wenn im Zähler oder Nenner Quadrate stehen, z. B. $x^2 - 9$ oder $x^2 + 6x + 9$.',
    examples: [
      task({ kind: 'reduce', part: fr(sub(pow(x, n(2)), n(9)), add(mul(n(2), x), n(6))) }),
      task({ kind: 'reduce', part: fr(add(pow(x, n(2)), mul(n(6), x), n(9)), sub(pow(x, n(2)), n(9))) }),
      task({ kind: 'reduce', part: fr(add(pow(x, n(2)), mul(n(-4), x), n(4)), sub(pow(x, n(2)), n(4))) }),
    ],
    errors: ['frac-binomial-confused', 'frac-binomial-middle'],
  },
  {
    id: FRACTION_CARD_IDS.lcdTerms,
    topic: 'brueche',
    title: 'Hauptnenner mit Termen',
    level: 3,
    rules: [],
    formulas: ['\\frac{a}{u} + \\frac{b}{v} = \\frac{a \\cdot v + b \\cdot u}{u \\cdot v}'],
    memo: 'Zerlege alle Nenner in Faktoren. Der Hauptnenner enthält jeden Faktor so oft, wie er in einem Nenner höchstens vorkommt.',
    note: 'Haben die Nenner keinen gemeinsamen Faktor, ist der Hauptnenner ihr Produkt, z. B. $(x - 1)(x + 1)$. Lass ihn in Klammern stehen: So siehst du beim Erweitern, welcher Faktor fehlt, und am Ende, ob sich etwas kürzen lässt. Nach einem Minus gehört der Zähler in Klammern.',
    examples: [
      task({ kind: 'sum', terms: [plus(fr(n(3), sub(x, n(1)))), minus(fr(n(2), add(x, n(1))))] }),
      task({ kind: 'sum', terms: [plus(fr(x, sub(pow(x, n(2)), n(1)))), minus(fr(n(1), add(x, n(1))))] }),
      task({ kind: 'sum', terms: [plus(fr(n(5), add(pow(x, n(2)), x))), minus(fr(n(2), x))] }),
    ],
    errors: ['frac-lcd-sum', 'frac-lcd-factor-missing', 'frac-minus-bracket', 'frac-distribute-first-only'],
  },
  {
    id: FRACTION_CARD_IDS.sumCancel,
    topic: 'brueche',
    title: 'Kürzen bei Summen',
    level: 3,
    rules: [],
    formulas: ['\\frac{(a + b) \\cdot c}{(a + b) \\cdot d} = \\frac{c}{d}', '\\frac{a - b}{b - a} = -1'],
    memo: 'Kürzen darfst du nur Faktoren, nie einzelne Summanden. Zerlege Zähler und Nenner zuerst in Faktoren, dann kürze ganze Klammern.',
    note: 'Vertauschte Differenzen unterscheiden sich nur im Vorzeichen: $b - a = -(a - b)$. Beim Kürzen bleibt dieses Minus stehen.',
    examples: [
      task({ kind: 'reduce', part: frAscending(sub(n(2), x), sub(pow(x, n(2)), n(4))) }),
      task({ kind: 'reduce', part: fr(add(mul(n(2), x), n(6)), add(pow(x, n(2)), mul(n(3), x))) }),
      task({ kind: 'reduce', part: fr(sub(pow(x, n(2)), n(1)), add(pow(x, n(2)), mul(n(-2), x), n(1))) }),
    ],
    errors: ['frac-cancel-in-sum', 'frac-cancel-one-summand', 'frac-cancel-sign', 'frac-cancel-forgot-one'],
  },
  {
    id: FRACTION_CARD_IDS.quadratic,
    topic: 'brueche',
    title: '$x^2 + px + q$ zerlegen',
    level: 4,
    rules: [],
    formulas: ['x^2 + px + q = (x + a)(x + b)', 'a \\cdot b = q, \\quad a + b = p'],
    memo: 'Suche zwei Zahlen $a$ und $b$, deren Produkt $q$ und deren Summe $p$ ist. Dann ist $x^2 + px + q = (x + a)(x + b)$.',
    note: 'Findest du keine passenden Zahlen, helfen die Nullstellen: $x_{1,2} = -\\frac{p}{2} \\pm \\sqrt{\\left(\\frac{p}{2}\\right)^2 - q}$, dann ist $x^2 + px + q = (x - x_1)(x - x_2)$.',
    examples: [
      task({ kind: 'reduce', part: fr(sub(sub(pow(x, n(2)), x), n(6)), sub(pow(x, n(2)), n(9))) }),
      task({ kind: 'reduce', part: fr(add(pow(x, n(2)), mul(n(5), x), n(6)), add(pow(x, n(2)), mul(n(3), x))) }),
      task({ kind: 'reduce', part: fr(sub(sub(pow(x, n(2)), mul(n(2), x)), n(8)), sub(x, n(4))) }),
    ],
    errors: ['frac-vieta-sign'],
  },
  {
    id: FRACTION_CARD_IDS.complex,
    topic: 'brueche',
    title: 'Doppelbrüche',
    level: 4,
    rules: [],
    formulas: ['\\dfrac{\\dfrac{a}{b}}{\\dfrac{c}{d}} = \\frac{a}{b} \\cdot \\frac{d}{c}', '\\dfrac{\\dfrac{a}{b}}{c} = \\frac{a}{b \\cdot c}'],
    memo: 'Ein Doppelbruch ist eine Division: oberer Bruch geteilt durch unteren Bruch. Also wird mit dem Kehrwert des unteren Bruchs malgenommen.',
    note: [
      'So gehst du vor:',
      '1. Zähler und Nenner je zu einem Bruch zusammenfassen.',
      '2. Mit dem Kehrwert des unteren Bruchs malnehmen.',
      '3. Kürzen.',
      'Steckt im Doppelbruch noch ein Doppelbruch, fängst du innen an und arbeitest dich nach außen vor.',
    ].join('\n'),
    examples: [
      task({ kind: 'complex', top: [plus(fr(n(1))), plus(fr(n(1), x))], bottom: [plus(fr(n(1))), minus(fr(n(1), pow(x, n(2))))] }),
      task({ kind: 'complex', top: [plus(fr(x)), minus(fr(n(9), x))], bottom: [plus(fr(n(1))), plus(fr(n(3), x))] }),
      task({ kind: 'complex', top: [plus(fr(n(1), x)), plus(fr(n(1), n(4)))], bottom: [plus(fr(add(x, n(4))))] }),
    ],
    errors: ['frac-complex-times-denominator', 'frac-complex-number-up'],
  },
  {
    id: FRACTION_CARD_IDS.blocks,
    topic: 'brueche',
    title: 'Bausteine wie $e^x$',
    level: 4,
    rules: [],
    formulas: ['e^{2x} = \\left(e^x\\right)^2', '\\sin^2 x = (\\sin x)^2'],
    memo: 'Behandle $e^x$, $\\ln x$ oder $\\sin x$ wie einen einzigen Buchstaben. Dann rechnest du genau wie mit $x$.',
    note: 'Es hilft, den Baustein kurz umzubenennen, z. B. $u = e^x$: Aus $e^{2x} - 9$ wird $u^2 - 9 = (u + 3)(u - 3)$.',
    examples: [
      task({ kind: 'reduce', part: fr(sub(exp(mul(n(2), x)), n(1)), add(exp(x), n(1))) }),
      task({ kind: 'sum', terms: [plus(fr(n(2), sin(x))), minus(fr(n(1), pow(sin(x), n(2))))] }),
      task({ kind: 'reduce', part: fr(sub(pow(ln(x), n(2)), n(4)), add(ln(x), n(2))) }),
    ],
    errors: [],
  },
  {
    id: FRACTION_CARD_IDS.blockRules,
    topic: 'brueche',
    title: 'Bausteine mit eigenen Regeln',
    level: 5,
    rules: [],
    formulas: ['(\\sqrt{x})^2 = x', '\\sin^2 x + \\cos^2 x = 1', '\\tan x = \\frac{\\sin x}{\\cos x}', '\\frac{e^{2x}}{e^x} = e^{2x - x} = e^x'],
    memo: 'Manche Bausteine haben eigene Regeln. Mit ihnen lässt sich weiter zerlegen und kürzen, als es mit einem einzelnen Buchstaben ginge.',
    note: [
      'Typische Umformungen:',
      '1. $x - 9 = (\\sqrt{x} - 3)(\\sqrt{x} + 3)$, weil $x = (\\sqrt{x})^2$.',
      '2. $1 - \\cos^2 x = \\sin^2 x$ und $1 - \\sin^2 x = \\cos^2 x$, umgestellt aus $\\sin^2 x + \\cos^2 x = 1$.',
      '3. $\\frac{\\sin x}{\\cos x} = \\tan x$.',
      'Das Quadrat bleibt bei allen Umformungen erhalten.',
    ].join('\n'),
    when: 'In Aufgaben mit $\\sqrt{x}$, mit $\\sin x$ und $\\cos x$ oder mit Potenzen von $e^x$.',
    examples: [
      task({ kind: 'reduce', part: fr(sub(x, n(9)), sub(sqrt(x), n(3))) }),
      task({ kind: 'sum', terms: [plus(frUnit(n(1), sub(n(1), sin(x)))), plus(frUnit(n(1), add(n(1), sin(x))))] }, { kind: 'trig', prefer: 'C', target: 'den' }),
      task({ kind: 'complex', top: [plus(fr(n(1), cos(x))), minus(fr(cos(x)))], bottom: [plus(fr(sin(x)))] }, { kind: 'trig', prefer: 'S', target: 'num' }),
    ],
    errors: ['frac-square-forgotten', 'frac-cancel-inside'],
  },
]
