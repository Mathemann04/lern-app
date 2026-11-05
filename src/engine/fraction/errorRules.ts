import { toLatex } from '../expr/print.ts'
import { type Expr, div, mul, mulDot, neg, num } from '../expr/types.ts'
import { type Rational, isInteger, isOne, isZero, rat, ratAbs, ratDiv, ratEq, ratMul, ratNeg, ratSign } from '../rational.ts'
import { type Factored, factorize, factoredExpr, factoredPoly, groupFactor, isMultipleOf, reduceFrac } from './factor.ts'
import {
  type Frac,
  type SquareAtom,
  type SquareRule,
  fracAdd,
  fracDiv,
  fracEquals,
  fracMul,
  fracNeg,
  fracOf,
  fracScale,
  isHyperbolicAtom,
  partnerAtom,
  reduceImag,
  startsNegative,
  trigRewrite,
} from './frac.ts'
import {
  type Poly,
  type Term,
  constValue,
  degreeIn,
  divRem,
  isZeroPoly,
  monoDivide,
  monomial,
  polyAdd,
  polyAtom,
  polyContent,
  polyConst,
  polyDivideExact,
  polyEquals,
  polyMul,
  polyNeg,
  polyPow,
  primitivePart,
  polyScale,
  polySub,
  polySum,
  totalDegree,
} from './poly.ts'
import {
  type FracSolution,
  type StepKind,
  type TreeSolution,
  type SumWork,
  applyRule,
  cancelledFactor,
  conjugateOf,
  expandedDenExpr,
  hyperbolicIdentity,
  isHyperbolicPair,
  fractionExpr,
  imagStage,
  imagTimesExpr,
  imagWork,
  innerResultPart,
  limitDividedExpr,
  limitWork,
  multipliedExpr,
  nicePolyExpr,
  partialFactorStep,
  partialWork,
  plainFractionExpr,
  productExpr,
  reciprocalPart,
  resultExpr,
  ruleExpr,
  ruledTop,
  sideOf,
  signedSum,
  solveFraction,
  teleFactorStep,
  teleWork,
  timesExpr,
  workSum,
} from './solve.ts'
import {
  type BlockRule,
  type FractionTask,
  type Part,
  type Shown,
  type Signed,
  expanded,
  factoredShown,
  innerTask,
  isWhole,
  part,
  partExpr,
  partFrac,
  partsOf,
  replaceInner,
  shownExpr,
  shownPoly,
  signedFrac,
  taskFrac,
  type TreeNode,
  treeFrac,
} from './task.ts'
import { complexExpr, complexValueExpr, imagParts, reduceImagWrong } from './complex.ts'
import { constantOf, fracValueAt, leadingOf, limitOf } from './limit.ts'
import { type TeleVariant, type TeleWork, baseAt, gValue, pairExpr, remainingExpr, remainingFrac, splitExpr, teleValue, upperPoly } from './telescope.ts'
import { type PartialTerm, type PartialWork, PARTIAL_LETTERS, ansatzExpr, cofactor, dividedExpr, multiplicityOf, partialExpr, partialFrac, partialResultOf, polyValueAt, termsWith } from './partial.ts'
import { bracketIgnoredMistakes, decimalMistakes, leafOfFrac, leftToRight, minusBracketMistakes, normalize, replaceNode, withoutDecimals } from './tree.ts'

// Typische Fehler beim Bruchrechnen (Katalog in docs/PLAN-M2.md). Jeder Fehler steckt in genau
// einem Schritt des Rechenwegs; der Rest wird richtig gerechnet. Daraus entstehen die falschen
// Antworten im geführten Modus und die Fehlerdiagnose im freien Modus.

export type FracErrorRule = {
  readonly id: string
  readonly step: StepKind
  // Name des Fehlers (Text mit $…$-Formeln)
  readonly name: string
  // Beispiel aus dem Fehlerkatalog
  readonly wrongFormula: string
}

export const FRACTION_ERROR_RULES: readonly FracErrorRule[] = [
  { id: 'frac-add-across', step: 'combine', name: 'Zähler plus Zähler und Nenner plus Nenner gerechnet', wrongFormula: '\\frac{1}{2} + \\frac{1}{3} = \\frac{2}{5}' },
  { id: 'frac-expand-denominator-only', step: 'expand', name: 'Nur die Nenner erweitert, die Zähler nicht', wrongFormula: '\\frac{1}{2} + \\frac{1}{3} = \\frac{2}{6}' },
  { id: 'frac-minus-bracket', step: 'combine', name: 'Klammer nach dem Minus vergessen', wrongFormula: '3(x + 1) - 2(x - 1) = 3x + 3 - 2x - 2' },
  { id: 'frac-whole-not-expanded', step: 'expand', name: 'Ganze Zahl nicht auf den Hauptnenner erweitert', wrongFormula: '1 + \\frac{2}{x} = \\frac{3}{x}' },
  { id: 'frac-lcd-gcd', step: 'lcd', name: 'Größten gemeinsamen Teiler statt kleinstem gemeinsamen Vielfachen genommen', wrongFormula: '\\text{Hauptnenner von } \\frac{1}{4} \\text{ und } \\frac{1}{6}\\text{: } 2' },
  { id: 'frac-lcd-sum', step: 'lcd', name: 'Nenner addiert statt malgenommen', wrongFormula: '\\text{Hauptnenner von } \\frac{1}{x - 1} \\text{ und } \\frac{1}{x + 1}\\text{: } 2x' },
  { id: 'frac-lcd-factor-missing', step: 'lcd', name: 'Einen Faktor im Hauptnenner vergessen', wrongFormula: '\\text{Hauptnenner von } \\frac{1}{x^2} \\text{ und } \\frac{1}{x(x + 1)}\\text{: } x(x + 1)' },
  { id: 'frac-expand-own-denominator', step: 'expand', name: 'Mit dem eigenen Nenner erweitert', wrongFormula: '\\frac{3}{x - 1} = \\frac{3(x - 1)}{(x - 1)(x + 1)}' },
  { id: 'frac-distribute-first-only', step: 'combine', name: 'Beim Ausmultiplizieren nur den ersten Summanden malgenommen', wrongFormula: '3(x + 1) = 3x + 1' },
  { id: 'frac-number-times-both', step: 'multiply', name: 'Zahl mit Zähler und Nenner malgenommen', wrongFormula: '3 \\cdot \\frac{2}{5} = \\frac{6}{15}' },
  { id: 'frac-reciprocal-forgotten', step: 'reciprocal', name: 'Kehrwert vergessen', wrongFormula: '\\frac{3}{4} : \\frac{2}{5} = \\frac{3}{4} \\cdot \\frac{2}{5}' },
  { id: 'frac-reciprocal-first', step: 'reciprocal', name: 'Kehrwert vom ersten statt vom zweiten Bruch genommen', wrongFormula: '\\frac{3}{4} : \\frac{2}{5} = \\frac{4}{3} \\cdot \\frac{2}{5}' },
  { id: 'frac-complex-times-denominator', step: 'reciprocal', name: 'Mit dem Nenner statt mit seinem Kehrwert malgenommen', wrongFormula: '\\dfrac{\\dfrac{1}{2}}{\\dfrac{3}{4}} = \\frac{1}{2} \\cdot \\frac{3}{4}' },
  { id: 'frac-complex-number-up', step: 'reciprocal', name: 'Den unteren Term in den Zähler statt in den Nenner geschrieben', wrongFormula: '\\dfrac{\\dfrac{a}{b}}{x} = \\frac{ax}{b}' },
  { id: 'frac-cancel-one-summand', step: 'cancel', name: 'Nur einen Summanden gekürzt', wrongFormula: '\\frac{2x + 6}{2} = x + 6' },
  { id: 'frac-cancel-in-sum', step: 'cancel', name: 'Aus einer Summe gekürzt', wrongFormula: '\\frac{x^2 + 1}{x} = x + 1' },
  { id: 'frac-cancel-forgot-one', step: 'cancel', name: 'Beim Kürzen die $1$ im Zähler vergessen', wrongFormula: '\\frac{x + 1}{(x + 1)(x - 2)} = x - 2' },
  { id: 'frac-cancel-sign', step: 'cancel', name: 'Vorzeichen bei vertauschter Differenz vergessen', wrongFormula: '\\frac{x - 1}{1 - x} = 1' },
  { id: 'frac-power-reversed', step: 'cancel', name: 'Hochzahlen falsch herum abgezogen', wrongFormula: '\\frac{x^2}{x^5} = x^3' },
  { id: 'frac-power-divided', step: 'cancel', name: 'Hochzahlen geteilt statt abgezogen', wrongFormula: '\\frac{x^6}{x^2} = x^3' },
  { id: 'frac-factor-wrong', step: 'factor-num', name: 'Falsch ausgeklammert', wrongFormula: '2x + 6 = 2(x + 6)' },
  { id: 'frac-binomial-confused', step: 'factor-num', name: 'Binomische Formeln verwechselt', wrongFormula: 'x^2 - 9 = (x - 3)^2' },
  { id: 'frac-vieta-sign', step: 'factor-num', name: 'Vorzeichen beim Zerlegen vertauscht', wrongFormula: 'x^2 - x - 6 = (x + 3)(x - 2)' },
  { id: 'frac-leading-forgotten', step: 'factor-num', name: 'Zahl vor $x^2$ beim Zerlegen vergessen', wrongFormula: '2x^2 - x - 3 = (x + 1)\\left(x - \\frac{3}{2}\\right)' },
  { id: 'frac-group-sign', step: 'factor-num', name: 'Vorzeichen beim Ausklammern in Gruppen vertauscht', wrongFormula: 'ax - ay - bx + by = (a - b)(x + y)' },
  { id: 'frac-cancel-one-side', step: 'cancel', name: 'Nur den Zähler oder nur den Nenner gekürzt', wrongFormula: '\\frac{14}{12} = \\frac{7}{12}' },
  { id: 'frac-multiply-reciprocal', step: 'multiply', name: 'Beim Malnehmen den Kehrwert genommen', wrongFormula: '\\frac{3}{4} \\cdot \\frac{2}{5} = \\frac{3 \\cdot 5}{4 \\cdot 2}' },
  { id: 'frac-square-forgotten', step: 'identity', name: 'Quadrat vergessen', wrongFormula: '1 - \\cos^2 x = \\sin x' },
  { id: 'frac-binomial-middle', step: 'multiply-out', name: 'Beim Ausmultiplizieren einer Potenz die Mittelglieder vergessen', wrongFormula: '(\\sqrt{x} + 1)^2 = x + 1' },
  { id: 'frac-cancel-inside', step: 'cancel', name: 'Im Inneren einer Funktion gekürzt', wrongFormula: '\\frac{e^{2x}}{e^x} = e^2' },
  { id: 'frac-order', step: 'order', name: 'Punkt vor Strich nicht beachtet', wrongFormula: '\\frac{1}{2} + \\frac{1}{2} \\cdot \\frac{2}{3} = 1 \\cdot \\frac{2}{3}' },
  { id: 'frac-bracket-ignored', step: 'order', name: 'Klammer übersehen', wrongFormula: '\\left(\\frac{1}{2} - \\frac{1}{3}\\right) : 2 = \\frac{1}{2} - \\frac{1}{3} : 2' },
  { id: 'frac-minus-before-bracket', step: 'order', name: 'Minus vor der Klammer nur auf den ersten Bruch angewandt', wrongFormula: '\\frac{1}{2} - \\left(\\frac{1}{3} - \\frac{1}{4}\\right) = \\frac{1}{2} - \\frac{1}{3} - \\frac{1}{4}' },
  { id: 'frac-decimal-places', step: 'decimal', name: 'Dezimalzahl mit falsch gezählten Stellen umgewandelt', wrongFormula: '0{,}75 = \\frac{75}{10}' },
  { id: 'frac-cube-as-square', step: 'factor-num', name: 'Dritte Potenz wie ein Quadrat zerlegt', wrongFormula: 'a^3 - b^3 = (a - b)(a^2 + b^2)' },
  { id: 'frac-conjugate-one-side', step: 'conjugate', name: 'Beim Erweitern mit dem Gegenstück nur Zähler oder nur Nenner malgenommen', wrongFormula: '\\frac{1}{\\sqrt{x} - 2} = \\frac{1}{(\\sqrt{x} - 2)(\\sqrt{x} + 2)}' },
  { id: 'frac-conjugate-sign', step: 'multiply-out', name: 'Mit derselben Summe statt mit dem Gegenstück erweitert', wrongFormula: '\\frac{1}{\\sqrt{x} - 2} = \\frac{\\sqrt{x} - 2}{x - 4}' },
  { id: 'frac-conjugate-square', step: 'multiply-out', name: 'Beim Erweitern mit dem Gegenstück die Zahl nicht quadriert', wrongFormula: '\\frac{1}{\\sqrt{x} - 2} = \\frac{\\sqrt{x} + 2}{x - 2}' },
  { id: 'frac-division-sign', step: 'divide', name: 'Bei der Polynomdivision beim Abziehen das Vorzeichen falsch', wrongFormula: '(x^2 + 3x + 1) - (x^2 - x) = 2x + 1' },
  { id: 'frac-division-remainder', step: 'divide', name: 'Den Rest der Polynomdivision vergessen', wrongFormula: '\\frac{x^2 + 1}{x - 1} = x + 1' },
  { id: 'frac-partial-no-division', step: 'ansatz', name: 'Polynomdivision vor der Partialbruchzerlegung vergessen', wrongFormula: '\\frac{x^3 + 1}{x^2 - 4} = \\frac{A}{x - 2} + \\frac{B}{x + 2}' },
  { id: 'frac-partial-double-once', step: 'ansatz', name: 'Doppelten Faktor im Ansatz nur einmal angesetzt', wrongFormula: '\\frac{1}{(x - 1)^2(x + 1)} = \\frac{A}{x - 1} + \\frac{B}{x + 1}' },
  { id: 'frac-partial-insert-sign', step: 'coef', name: 'Beim Einsetzen der Nullstelle das Vorzeichen verloren', wrongFormula: '5x - 1 = A(x + 1) + B(x - 2),\\; x = 2\\text{: } A = \\frac{9}{2 - 1}' },
  { id: 'frac-partial-compare', step: 'coef', name: 'Beim Koeffizientenvergleich einen Summanden vergessen', wrongFormula: 'x^2 + 1 = A(x - 1)(x + 2) + B(x + 2) + C(x - 1)^2\\text{: } A = 1' },
  { id: 'frac-imag-power', step: 'imag-power', name: 'Potenz von $\\mathrm{i}$ mit falschem Vorzeichen', wrongFormula: '\\mathrm{i}^3 = \\mathrm{i}' },
  { id: 'frac-imag-squared', step: 'imag-multiply', name: 'Beim Ausmultiplizieren $\\mathrm{i}^2 = 1$ statt $-1$ gerechnet', wrongFormula: '(3 + 4\\mathrm{i})(1 + 2\\mathrm{i}) = 3 + 10\\mathrm{i} + 8' },
  { id: 'frac-imag-cross', step: 'imag-multiply', name: 'Beim Ausmultiplizieren die gemischten Summanden vergessen', wrongFormula: '(3 + 4\\mathrm{i})(1 + 2\\mathrm{i}) = 3 + 8\\mathrm{i}^2' },
  { id: 'frac-imag-den', step: 'imag-multiply', name: 'Im Nenner $c^2 - d^2$ statt $c^2 + d^2$ gerechnet', wrongFormula: '(1 - 2\\mathrm{i})(1 + 2\\mathrm{i}) = 1 - 4' },
  { id: 'frac-imag-split', step: 'imag-split', name: 'Beim Aufteilen nur den Realteil durch den Nenner geteilt', wrongFormula: '\\frac{-5 + 10\\mathrm{i}}{5} = -1 + 10\\mathrm{i}' },
  { id: 'frac-imag-direct', step: 'imag-split', name: 'Realteil durch Realteil und Imaginärteil durch Imaginärteil geteilt', wrongFormula: '\\frac{3 + 4\\mathrm{i}}{1 - 2\\mathrm{i}} = 3 - 2\\mathrm{i}' },
  { id: 'frac-limit-zero-zero', step: 'limit-insert', name: 'Den Ausdruck $\\frac{0}{0}$ als Zahl genommen', wrongFormula: '\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2} = \\frac{0}{0} = 0' },
  { id: 'frac-limit-insert-sign', step: 'limit-insert', name: 'Beim Einsetzen das Vorzeichen der Stelle verwechselt', wrongFormula: '\\lim_{x \\to -2} (x - 1) = 1' },
  { id: 'frac-limit-divide-one-side', step: 'limit-divide', name: 'Nur den Zähler durch die höchste Potenz geteilt', wrongFormula: '\\frac{3n^2 - n}{2n^2 + 5} = \\frac{3 - \\frac{1}{n}}{2n^2 + 5}' },
  { id: 'frac-limit-infinity-one', step: 'limit-value', name: '$\\frac{\\infty}{\\infty}$ als $1$ genommen', wrongFormula: '\\lim_{n \\to \\infty} \\frac{3n^2 - n}{2n^2 + 5} = 1' },
  { id: 'frac-limit-n-zero', step: 'limit-value', name: '$n = 0$ eingesetzt statt $n$ gegen unendlich', wrongFormula: '\\lim_{n \\to \\infty} \\frac{3n^2 - n + 2}{2n^2 + 5} = \\frac{2}{5}' },
  { id: 'frac-limit-degree', step: 'limit-value', name: 'Die Zahlen vor den höchsten Potenzen geteilt, obwohl der Grad verschieden ist', wrongFormula: '\\lim_{n \\to \\infty} \\frac{2n + 1}{n^2 + 3} = 2' },
  { id: 'frac-limit-first-terms', step: 'limit-value', name: 'Die vorderen Zahlen statt der Zahlen vor der höchsten Potenz genommen', wrongFormula: '\\lim_{n \\to \\infty} \\frac{3 - 2n^2}{4n^2 + 1} = \\frac{3}{4}' },
  { id: 'frac-imag-minus', step: 'imag-sum', name: 'Minus vor der Klammer nur auf den Realteil angewandt', wrongFormula: '2 - (1 + 3\\mathrm{i}) = 1 + 3\\mathrm{i}' },
  { id: 'frac-tele-factor', step: 'tele-split', name: 'Beim Zerlegen die Zahl vor der Klammer vergessen', wrongFormula: '\\frac{1}{k(k + 2)} = \\frac{1}{k} - \\frac{1}{k + 2}' },
  { id: 'frac-tele-swap', step: 'tele-split', name: 'Beim Zerlegen die beiden Brüche vertauscht', wrongFormula: '\\frac{1}{k(k + 1)} = \\frac{1}{k + 1} - \\frac{1}{k}' },
  { id: 'frac-tele-only-ends', step: 'tele-cancel', name: 'Vorn und hinten nur je einen Bruch behalten, obwohl sich die Brüche erst mit Abstand $2$ wegheben', wrongFormula: '\\sum_{k=1}^{n} \\left(\\frac{1}{k} - \\frac{1}{k + 2}\\right) = 1 - \\frac{1}{n + 2}' },
  { id: 'frac-tele-last', step: 'tele-cancel', name: 'Am Ende den falschen Bruch behalten', wrongFormula: '\\sum_{k=1}^{n} \\left(\\frac{1}{k} - \\frac{1}{k + 1}\\right) = 1 - \\frac{1}{n}' },
  { id: 'frac-tele-start', step: 'tele-cancel', name: 'Bei $k = 1$ angefangen, obwohl die Summe später beginnt', wrongFormula: '\\sum_{k=2}^{n} \\left(\\frac{1}{k} - \\frac{1}{k + 1}\\right) = 1 - \\frac{1}{n + 1}' },
  { id: 'frac-tele-head', step: 'tele-cancel', name: 'Die vorderen Brüche mit weggestrichen', wrongFormula: '\\sum_{k=1}^{n} \\left(\\frac{1}{k} - \\frac{1}{k + 1}\\right) = -\\frac{1}{n + 1}' },
  { id: 'frac-hyp-trig-sign', step: 'identity', name: 'Mit $\\cosh^2 x + \\sinh^2 x = 1$ gerechnet, wie bei $\\sin$ und $\\cos$', wrongFormula: '\\cosh^2 x - 1 = -\\sinh^2 x' },
  { id: 'frac-hyp-swapped', step: 'identity', name: 'Die Regel verdreht: $\\sinh^2 x - \\cosh^2 x = 1$', wrongFormula: '\\cosh^2 x - \\sinh^2 x = -1' },
]

export function fractionErrorRule(id: string): FracErrorRule {
  const found = FRACTION_ERROR_RULES.find((r) => r.id === id)
  if (!found) throw new Error(`Unbekannte Fehlerregel: ${id}`)
  return found
}

export type FracWrong = {
  readonly rule: FracErrorRule
  // Schritt, in dem der Fehler passiert (bei Doppelbrüchen ggf. „Zähler zu einem Bruch")
  readonly step: StepKind
  // falsche Antwort in diesem Schritt
  readonly stepExpr: Expr
  // Wert, mit dem man weiterrechnet; null, wenn man damit nicht weiterrechnen kann (falscher Hauptnenner)
  readonly value: Frac | null
  // daraus vollständig gekürzt
  readonly result: Expr | null
  // nur für die Diagnose im freien Modus: Im geführten Modus passt die Antwort nicht zum
  // Zwischenstand davor (z. B. Zähler und Nenner der ursprünglichen Brüche addiert, obwohl schon
  // erweitert ist)
  readonly freeOnly?: boolean
}

type Candidate = {
  readonly id: string
  readonly step?: StepKind
  readonly stepExpr: Expr
  readonly value: Frac | null
  readonly freeOnly?: boolean
}

// --- Hilfen ---

const signed = (sign: 1 | -1, p: Poly) => (sign < 0 ? polyNeg(p) : p)

// Summanden in der Reihenfolge, wie man sie hinschreibt
const termsInOrder = (p: Poly, ascending = false): Term[] => (ascending ? [...p].reverse() : [...p])

// Erster Summand mal c, Rest unverändert: 3(x + 1) → 3x + 1
function firstOnly(c: Poly, q: Poly): Poly {
  const [first, ...rest] = termsInOrder(q)
  return polyAdd(polyMul(c, [first]), rest)
}

function reduced(value: Frac, hints: readonly Poly[]): Expr {
  return resultExpr(reduceFrac(value, hints), {})
}

// Wert nach der Regel des Bausteins (wie im Rechenweg): sin² x + cos² x = 1 im Zähler bzw. Nenner;
// nach dem Erweitern von \frac{1}{\cosh x - \sinh x} cosh² x − sinh² x = 1 im Nenner
export function ruledFrac(value: Frac, rule: BlockRule | undefined): Frac {
  if (rule?.kind === 'conjugate' && rule.target === 'den') return { num: value.num, den: hyperbolicIdentity(value.den) }
  if (rule?.kind !== 'trig') return value
  return rule.target === 'num' ? { num: applyRule(value.num, rule), den: value.den } : { num: value.num, den: applyRule(value.den, rule) }
}

// Falsches Ergebnis so geschrieben wie das richtige: gekürzt, mit der Regel des Bausteins;
// bei Partialbrüchen zerlegt, bei komplexen Zahlen in der Form a + bi
function resultOf(value: Frac, t: FractionTask): Expr {
  if (t.kind === 'limit' || t.kind === 'telescope') return reduced(value, [])
  if (t.kind === 'partial') return partialResultOf(value, t.hints) ?? reduced(value, t.hints)
  if (t.kind === 'imaginary') return complexValueExpr(value, t.hints)
  return resultExpr(reduceFrac(ruledFrac(value, t.rule), t.hints), t)
}

// Wert der Aufgabe, wenn ein Teil anders geschrieben (falsch umgeformt) wäre (nur Kürzen)
function withPart(t: FractionTask, target: Part, replaced: Part): Frac {
  return t.kind === 'reduce' && t.part === target ? taskFrac({ kind: 'reduce', part: replaced }) : taskFrac(t)
}

// --- Plus und minus ---

function sumMistakes(w: SumWork, hints: readonly Poly[]): Candidate[] {
  const out: Candidate[] = []
  const fractions = w.terms.filter((t) => !isWhole(t.part))
  const wholes = w.terms.filter((t) => isWhole(t.part))
  const lcdExpr = factoredExpr(w.lcd)
  const lcdPoly = factoredPoly(w.lcd)

  // Nach dem Erweitern auch die gleichen Nenner addiert: \frac{9}{12} + \frac{10}{12} = \frac{19}{24}
  if (w.terms.length >= 2 && w.terms.every((t) => t.sign > 0)) {
    const doubled: Factored = { coef: ratMul(w.lcd.coef, rat(w.terms.length)), factors: w.lcd.factors }
    out.push({ id: 'frac-add-across', stepExpr: fractionExpr(w.numerator, doubled), value: { num: w.numerator, den: factoredPoly(doubled) } })
  }

  // Ohne Hauptnenner Zähler und Nenner der Brüche addiert: \frac{1}{2} + \frac{1}{3} = \frac{2}{5}
  if (wholes.length === 0 && w.terms.length >= 2 && !w.sameDenominator) {
    const n = polySum(w.terms.map((t) => signed(t.sign, shownPoly(t.part.num))))
    const d = polySum(w.terms.map((t) => signed(t.sign, shownPoly(t.part.den))))
    if (!isZeroPoly(d) && !isZeroPoly(n)) {
      const value = { num: n, den: d }
      out.push({ id: 'frac-add-across', stepExpr: reduced(value, hints), value, freeOnly: true })
    }
  }

  if (wholes.length === 0 && !w.sameDenominator) {
    const n = polySum(w.terms.map((t) => signed(t.sign, shownPoly(t.part.num))))
    const stepExpr = signedSum(w.terms.map((t) => ({ sign: t.sign, expr: div(shownExpr(t.part.num), lcdExpr) })))
    out.push({ id: 'frac-expand-denominator-only', stepExpr, value: { num: n, den: lcdPoly } })
  }

  if (wholes.length > 0 && fractions.length > 0) {
    const n = polySum(w.terms.map((t, i) => signed(t.sign, isWhole(t.part) ? shownPoly(t.part.num) : w.products[i])))
    const stepExpr = signedSum(
      w.terms.map((t, i) => ({
        sign: t.sign,
        expr: div(isWhole(t.part) ? shownExpr(t.part.num) : timesExpr(t.part.num, w.factorsUp[i]), lcdExpr),
      })),
    )
    out.push({ id: 'frac-whole-not-expanded', stepExpr, value: { num: n, den: lcdPoly } })
  }

  if (wholes.length === 0 && fractions.length >= 2 && !w.sameDenominator) {
    const n = polySum(w.terms.map((t, i) => signed(t.sign, polyMul(shownPoly(t.part.num), factoredPoly(w.dens[i])))))
    const stepExpr = signedSum(
      w.terms.map((t, i) => ({ sign: t.sign, expr: div(timesExpr(t.part.num, w.dens[i]), lcdExpr) })),
    )
    out.push({ id: 'frac-expand-own-denominator', stepExpr, value: { num: n, den: lcdPoly } })
  }

  // Minus nur vor dem ersten Summanden des ausmultiplizierten Zählers
  if (w.terms.some((t, i) => t.sign < 0 && w.products[i].length >= 2)) {
    const n = polySum(
      w.terms.map((t, i) => {
        const p = w.products[i]
        if (t.sign > 0) return p
        if (p.length < 2) return polyNeg(p)
        const ascending = t.part.num.form === 'expanded' && t.part.num.ascending === true && isOne(w.factorsUp[i].coef) && w.factorsUp[i].factors.length === 0
        const [first, ...rest] = termsInOrder(p, ascending)
        return polyAdd(polyNeg([first]), rest)
      }),
    )
    out.push({ id: 'frac-minus-bracket', stepExpr: fractionExpr(n, w.lcd), value: { num: n, den: lcdPoly } })
  }

  // Zahl mal Klammer: nur der erste Summand wird malgenommen
  const distributed = w.terms.map((t, i) => {
    const n = shownPoly(t.part.num)
    const up = w.factorsUp[i]
    const c = constValue(n)
    if (c && !isOne(ratAbs(c)) && up.factors.length === 1 && up.factors[0].exp === 1 && isOne(up.coef) && up.factors[0].poly.length >= 2) {
      return firstOnly(n, up.factors[0].poly)
    }
    if (n.length >= 2 && up.factors.length === 0 && !isOne(up.coef)) return firstOnly(polyConst(up.coef), n)
    return null
  })
  if (distributed.some((d) => d !== null)) {
    const n = polySum(w.terms.map((t, i) => signed(t.sign, distributed[i] ?? w.products[i])))
    out.push({ id: 'frac-distribute-first-only', stepExpr: fractionExpr(n, w.lcd), value: { num: n, den: lcdPoly } })
  }

  // Falsche Hauptnenner (nur im geführten Modus: damit kann man nicht weiterrechnen)
  const fractionDens = w.terms.flatMap((t, i) => (isWhole(t.part) ? [] : [w.dens[i]]))
  const isCommon = (h: Poly) => fractionDens.every((d) => isMultipleOf(h, factoredPoly(d)))
  if (fractionDens.length >= 2 && fractionDens.every((d) => d.factors.length === 0)) {
    const values = fractionDens.map((d) => ratAbs(d.coef).n)
    const g = values.reduce((a, b) => {
      while (b !== 0n) [a, b] = [b, a % b]
      return a
    })
    if (g > 1n && !isCommon(polyConst(rat(g)))) out.push({ id: 'frac-lcd-gcd', step: 'lcd', stepExpr: num(g), value: null })
  }
  if (fractionDens.length >= 2) {
    const s = polySum(fractionDens.map(factoredPoly))
    if (!isZeroPoly(s) && !isCommon(s)) out.push({ id: 'frac-lcd-sum', step: 'lcd', stepExpr: nicePolyExpr(s), value: null })
    const tooSmall = fractionDens
      .filter((d) => !isCommon(factoredPoly(d)))
      .sort((a, b) => b.factors.length - a.factors.length || totalDegree(factoredPoly(b)) - totalDegree(factoredPoly(a)) || Number(b.coef.n - a.coef.n))
    if (tooSmall.length > 0) out.push({ id: 'frac-lcd-factor-missing', step: 'lcd', stepExpr: factoredExpr(tooSmall[0]), value: null })
  }
  return out
}

// --- Kürzen ---

function cancelMistakes(t: FractionTask, solution: FracSolution): Candidate[] {
  const out: Candidate[] = []
  const raw = solution.beforeCancel
  const { hints } = t

  // Gemeinsame Zahl nur aus dem ersten Summanden gekürzt
  const cn = polyContent(raw.num)
  const cd = polyContent(raw.den)
  if (raw.num.length >= 2 && isInteger(cn) && isInteger(cd)) {
    let g = ratAbs(cn).n
    for (let b = ratAbs(cd).n; b !== 0n; ) [g, b] = [b, g % b]
    if (g > 1n) {
      const [first, ...rest] = raw.num
      const value = { num: polyAdd(polyScale([first], rat(1n, g)), rest), den: polyScale(raw.den, rat(1n, g)) }
      out.push({ id: 'frac-cancel-one-summand', stepExpr: reduced(value, hints), value })
    }
  }

  // Aus einer Summe gekürzt: gleicher Summand oben und unten, oder ein Summand gegen ein Monom
  const n = solution.reduced.num
  const d = factoredPoly(solution.reduced.den)
  if (n.length >= 2 && d.length >= 2) {
    const shared = n.find((a) => d.some((b) => polyEquals([a], [b])))
    if (shared) {
      const value = { num: polySub(n, [shared]), den: polySub(d, [shared]) }
      if (!isZeroPoly(value.den)) out.push({ id: 'frac-cancel-in-sum', stepExpr: reduced(value, hints), value })
    }
  } else if (n.length >= 2 && d.length === 1 && d[0].mono.length > 0) {
    const m = d[0].mono
    if (n.some((a) => monoDivide(a.mono, m) !== null)) {
      const parts = n.map((a) => {
        const q = monoDivide(a.mono, m)
        return q ? { mono: q, coef: ratDiv(a.coef, d[0].coef) } : a
      })
      const value = { num: polySum(parts.map((p) => [p])), den: polyConst(1) }
      out.push({ id: 'frac-cancel-in-sum', stepExpr: reduced(value, hints), value })
    }
  }

  // Vertauschte Differenz (3 − x) gegen (x − 3) gekürzt, ohne das Minus
  const shown: Shown[] = partsOf(t).flatMap((p) => [p.num, p.den])
  if (t.kind === 'reduce' && !t.rule && shown.some((s) => s.form === 'expanded' && s.ascending && s.poly.length >= 2 && polyContent(s.poly).n < 0n)) {
    const value = fracNeg(solution.value)
    out.push({ id: 'frac-cancel-sign', stepExpr: reduced(value, hints), value })
  }

  // Potenzen kürzen (Zähler und Nenner je ein Produkt)
  if (raw.num.length === 1 && raw.den.length === 1) {
    const [a] = raw.num
    const [b] = raw.den
    const atoms = [...new Set([...a.mono, ...b.mono].map(([atom]) => atom))]
    const expOf = (m: Term['mono'], atom: string) => m.find(([x]) => x === atom)?.[1] ?? 0
    const coef = ratDiv(a.coef, b.coef)
    // Potenzen, die oben und unten stehen, landen alle oben: \frac{x^2}{x^5} = x^3
    const shared = (atom: string) => expOf(a.mono, atom) > 0 && expOf(b.mono, atom) > 0
    if (atoms.some((atom) => shared(atom) && expOf(b.mono, atom) > expOf(a.mono, atom))) {
      const up = monomial(atoms.map((atom) => [atom, shared(atom) ? Math.abs(expOf(a.mono, atom) - expOf(b.mono, atom)) : expOf(a.mono, atom)] as const))
      const down = monomial(atoms.map((atom) => [atom, shared(atom) ? 0 : expOf(b.mono, atom)] as const))
      const value = { num: [{ mono: up, coef }], den: [{ mono: down, coef: rat(1) }] }
      out.push({ id: 'frac-power-reversed', stepExpr: reduced(value, hints), value })
    }
    const divisible = (atom: string) => {
      const [ea, eb] = [expOf(a.mono, atom), expOf(b.mono, atom)]
      return eb >= 2 && ea >= eb && ea % eb === 0 && ea / eb !== ea - eb
    }
    if (atoms.some(divisible)) {
      let value: Frac = { num: [{ mono: [], coef }], den: polyConst(1) }
      for (const atom of atoms) {
        const [ea, eb] = [expOf(a.mono, atom), expOf(b.mono, atom)]
        const e = divisible(atom) ? ea / eb : ea - eb
        const p = [{ mono: [[atom, Math.abs(e)] as const], coef: rat(1) }]
        if (e > 0) value = fracMul(value, { num: p, den: polyConst(1) })
        if (e < 0) value = fracMul(value, { num: polyConst(1), den: p })
      }
      out.push({ id: 'frac-power-divided', stepExpr: reduced(value, hints), value })
    }
  }
  // Nur Zähler oder nur Nenner durch den gemeinsamen Faktor geteilt; steckt darin eine Zahl, nur
  // durch die Zahl (die Buchstaben richtig gekürzt): \frac{6x^2}{9x} = \frac{2x}{9}
  const common = cancelledFactor(raw, solution.reduced, hints)
  if (common) {
    const g = ratAbs(common.coef).n > 1n && isInteger(common.coef) ? polyConst(ratAbs(common.coef)) : factoredPoly(common)
    const [numDiv, denDiv] = [polyDivideExact(raw.num, g), polyDivideExact(raw.den, g)]
    if (numDiv && denDiv) {
      for (const value of [
        { num: numDiv, den: raw.den },
        { num: raw.num, den: denDiv },
      ]) {
        out.push({ id: 'frac-cancel-one-side', stepExpr: reduced(value, hints), value })
      }
    }
  }

  // e^{2x} : e^x im Exponenten gekürzt: \frac{e^{2x} - 3e^x}{e^x} = e^2 - 3
  if (raw.den.length === 1 && raw.den[0].mono.length === 1 && raw.den[0].mono[0][0] === 'E' && raw.den[0].mono[0][1] === 1) {
    const [d0] = raw.den
    const highE = (term: Term) => (term.mono.find(([atom]) => atom === 'E')?.[1] ?? 0) >= 2
    if (raw.num.some(highE) && raw.num.every((term) => (term.mono.find(([atom]) => atom === 'E')?.[1] ?? 0) >= 1)) {
      const parts = raw.num.map((term): Term => {
        const k = term.mono.find(([atom]) => atom === 'E')![1]
        const rest = term.mono.filter(([atom]) => atom !== 'E')
        const mono = highE(term) ? monomial([...rest, ['e', k] as const]) : monomial([...rest, ['E', k - 1] as const])
        return { mono, coef: ratDiv(term.coef, d0.coef) }
      })
      const value = { num: polySum(parts.map((q) => [q])), den: polyConst(1) }
      out.push({ id: 'frac-cancel-inside', stepExpr: reduced(value, hints), value })
    }
  }

  // Nach dem Kürzen bleibt im Zähler 1 stehen, nicht nichts
  const rest = constValue(n)
  if (rest && isOne(ratAbs(rest)) && totalDegree(raw.num) > 0 && totalDegree(d) > 0) {
    const value = { num: polyScale(d, rest), den: polyConst(1) }
    out.push({ id: 'frac-cancel-forgot-one', stepExpr: reduced(value, hints), value })
  }

  return out
}

// --- Zerlegen ---

// Falsche Zerlegungen eines Polynoms: [Fehler, falsch zerlegt als Term, falscher Wert]
function factorMistakes(p: Poly, hints: readonly Poly[]): Array<{ id: string; expr: Expr; poly: Poly }> {
  const out: Array<{ id: string; expr: Expr; poly: Poly }> = []
  const f = factorize(p, hints)
  // Klammern wie (x + 3), (2x − 3) oder (a − 2b)
  const linear = f.factors.filter((g) => g.poly.length === 2 && totalDegree(g.poly) === 1)
  const asFactored = (factors: Factored['factors']): { expr: Expr; poly: Poly } => {
    const wrong: Factored = { coef: f.coef, factors }
    return { expr: factoredExpr(wrong), poly: factoredPoly(wrong) }
  }

  // Zahl ausklammern, aber nur aus dem ersten Summanden: 2x + 6 = 2(x + 6)
  if (isInteger(f.coef) && !isOne(ratAbs(f.coef)) && f.factors.length === 1 && f.factors[0].exp === 1 && f.factors[0].poly.length >= 2) {
    const [first, ...rest] = f.factors[0].poly
    const inner = polyAdd([first], polyScale(rest, f.coef))
    const wrong: Factored = { coef: f.coef, factors: [{ poly: inner, exp: 1 }] }
    out.push({ id: 'frac-factor-wrong', expr: factoredExpr(wrong), poly: factoredPoly(wrong) })
  }

  // (u + v)(u − v) ↔ (u − v)² bzw. (u + v)² ↔ (u + v)(u − v)
  const mirror = (g: Poly) => polyAdd([g[0]], polyNeg([g[1]]))
  const negative = linear.find((g) => polyContent([g.poly[1]]).n < 0n && linear.some((h) => polyEquals(h.poly, mirror(g.poly))))
  if (negative) {
    const other = linear.find((h) => polyEquals(h.poly, mirror(negative.poly)))!
    const factors = f.factors.filter((g) => g !== other).map((g) => (g === negative ? { poly: g.poly, exp: g.exp + other.exp } : g))
    out.push({ id: 'frac-binomial-confused', ...asFactored(factors) })
  }
  const squared = linear.find((g) => g.exp === 2)
  if (squared) {
    const factors = f.factors.flatMap((g) => (g === squared ? [{ poly: g.poly, exp: 1 }, { poly: mirror(g.poly), exp: 1 }] : [g]))
    out.push({ id: 'frac-binomial-confused', ...asFactored(factors) })
  }

  // (x + a)(x + b) mit vertauschten Vorzeichen: (x − a)(x − b); beide Klammern beginnen mit
  // demselben Buchstaben (nicht bei Gruppen wie (x − y)(a + b))
  const sameStart = linear.length === 2 && monoKeyOf(linear[0].poly[0].mono) === monoKeyOf(linear[1].poly[0].mono)
  if (!negative && sameStart && linear.every((g) => g.exp === 1)) {
    const factors = f.factors.map((g) => (linear.includes(g) ? { poly: mirror(g.poly), exp: 1 } : g))
    out.push({ id: 'frac-vieta-sign', ...asFactored(factors) })
  }

  // Zahl vor x² vergessen: Nullstellen gefunden, aber (2x − 3) als (x − 3/2) geschrieben
  if (sameStart && !negative && !squared && isOne(ratAbs(f.coef))) {
    const leading = linear.find((g) => !isOne(g.poly[0].coef))
    if (leading) {
      const factors = f.factors.map((g) => (g === leading ? { poly: polyScale(g.poly, ratDiv(rat(1), g.poly[0].coef)), exp: g.exp } : g))
      out.push({ id: 'frac-leading-forgotten', ...asFactored(factors) })
    }
  }

  // Dritte Potenz wie ein Quadrat zerlegt: a³ − b³ = (a − b)(a² + b²) statt (a − b)(a² + ab + b²)
  const companion = f.factors.find((g) => g.poly.length === 3 && totalDegree(g.poly) === 2 && g.exp === 1)
  if (p.length === 2 && linear.length >= 1 && companion) {
    const factors = f.factors.map((g) => (g === companion ? { poly: polyAdd([g.poly[0]], [g.poly[2]]), exp: 1 } : g))
    out.push({ id: 'frac-cube-as-square', ...asFactored(factors) })
  }

  // In Gruppen: beim Ausklammern aus der zweiten Gruppe das Vorzeichen in der Klammer vertauscht,
  // ax − ay − bx + by = (x − y)(a + b) statt (x − y)(a − b)
  const group = groupFactor(p)
  if (group) {
    const quotient = polyDivideExact(p, group)!
    const flipped = [quotient[0], ...polyNeg(quotient.slice(1))]
    if (quotient.length >= 2 && !polyEquals(flipped, polyNeg(quotient))) {
      const wrong = polyMul(group, flipped)
      out.push({ id: 'frac-group-sign', expr: factoredExpr(factorize(wrong, [group])), poly: wrong })
    }
  }
  return out
}

const monoKeyOf = (m: Term['mono']) => m.map(([atom]) => atom).join('.')

function factorStepMistakes(t: FractionTask, solution: FracSolution): Candidate[] {
  if (t.kind !== 'reduce') return []
  const out: Candidate[] = []
  const factored = (s: Shown) => (s.form === 'expanded' ? factoredExpr(factorize(s.poly, t.hints)) : shownExpr(s))
  for (const step of solution.steps) {
    if (step.kind !== 'factor-num' && step.kind !== 'factor-den') continue
    const isNum = step.kind === 'factor-num'
    const shown = isNum ? t.part.num : t.part.den
    for (const m of factorMistakes(shownPoly(shown), t.hints)) {
      const replaced = isNum ? { num: expanded(m.poly), den: t.part.den } : { num: t.part.num, den: expanded(m.poly) }
      const other = isNum
        ? shownExpr(t.part.den)
        : solution.steps.some((s) => s.kind === 'factor-num')
          ? factored(t.part.num)
          : shownExpr(t.part.num)
      const stepExpr = isNum ? div(m.expr, other) : div(other, m.expr)
      let value: Frac | null = null
      try {
        value = withPart(t, t.part, replaced)
      } catch {
        value = null
      }
      out.push({ id: m.id, step: step.kind, stepExpr, value })
    }
  }
  return out
}

// --- Mal, geteilt, Doppelbruch ---

function operationMistakes(t: FractionTask): Candidate[] {
  const out: Candidate[] = []
  const { hints } = t
  if (t.kind === 'product') {
    for (const [whole, other] of [
      [t.left, t.right],
      [t.right, t.left],
    ] as const) {
      const n = constValue(shownPoly(whole.num))
      if (!isWhole(whole) || isWhole(other) || !n || isOne(ratAbs(n))) continue
      const value = { num: polyMul(shownPoly(whole.num), shownPoly(other.num)), den: polyMul(shownPoly(whole.num), shownPoly(other.den)) }
      const stepExpr = div(productExpr([shownExpr(whole.num), shownExpr(other.num)]), productExpr([shownExpr(whole.num), shownExpr(other.den)]))
      out.push({ id: 'frac-number-times-both', stepExpr, value })
    }
  }
  // Wie beim Teilen den zweiten Bruch umgedreht
  if (t.kind === 'product' && !isWhole(t.left) && !isWhole(t.right)) {
    const value = fracMul(partFrac(t.left), partFrac(reciprocalPart(t.right)))
    out.push({ id: 'frac-multiply-reciprocal', stepExpr: multipliedExpr(t.left, reciprocalPart(t.right)), value })
  }
  if (t.kind === 'quotient') {
    const l = { num: shownPoly(t.left.num), den: shownPoly(t.left.den) }
    const r = { num: shownPoly(t.right.num), den: shownPoly(t.right.den) }
    out.push({ id: 'frac-reciprocal-forgotten', stepExpr: mulDot(partExpr(t.left), partExpr(t.right)), value: fracMul(l, r) })
    out.push({
      id: 'frac-reciprocal-first',
      stepExpr: mulDot(partExpr(reciprocalPart(t.left)), partExpr(t.right)),
      value: fracMul({ num: l.den, den: l.num }, r),
    })
  }
  if (t.kind === 'complex') {
    const top = ruledTop(sideOf(t.top, hints), t.rule)
    const bottom = sideOf(t.bottom, hints)
    const bottomWhole = !bottom.combined && isWhole(t.bottom[0].part)
    out.push({
      id: bottomWhole ? 'frac-complex-number-up' : 'frac-complex-times-denominator',
      stepExpr: mulDot(top.expr, bottom.expr),
      value: fracMul(top.frac, bottom.frac),
    })
    // Fehler beim Zusammenfassen oben oder unten
    for (const [side, step] of [
      [top, 'inner-num'],
      [bottom, 'inner-den'],
    ] as const) {
      if (!side.work) continue
      // Zähler bzw. Nenner wird in einem Schritt zusammengefasst: Zähler und Nenner addiert heißt
      // hier ohne Hauptnenner (\frac{1}{x} + \frac{1}{4} = \frac{2}{x + 4}), wenn es das gibt
      const candidates = sumMistakes(side.work, hints)
      const withoutLcd = candidates.some((c) => c.id === 'frac-add-across' && c.freeOnly)
      for (const c of candidates) {
        if (!c.value || isZeroPoly(c.value.num)) continue
        if (c.id === 'frac-add-across' && withoutLcd && !c.freeOnly) continue
        const value = side === top ? fracDiv(c.value, bottom.frac) : fracDiv(top.frac, c.value)
        out.push({ id: c.id, step, stepExpr: reduced(c.value, hints), value })
      }
    }
  }
  if (t.kind === 'mixed') out.push(...mixedMistakes(t))
  return out
}

// Mehrere Rechenarten: Fehler beim Zusammenfassen einer Klammer, beim Teilen der Kehrwert vergessen
function mixedMistakes(t: Extract<FractionTask, { kind: 'mixed' }>): Candidate[] {
  const out: Candidate[] = []
  const { hints } = t
  const left = sideOf(t.left, hints)
  const right = t.op === 'div' ? { frac: partFrac(reciprocalPart(t.right[0].part)), work: undefined } : sideOf(t.right, hints)
  if (t.op === 'div') {
    const rightPart = t.right[0].part
    const stepExpr = mulDot(signedSum(t.left.map((s) => ({ sign: s.sign, expr: partExpr(s.part) }))), partExpr(rightPart))
    out.push({ id: 'frac-reciprocal-forgotten', stepExpr, value: fracMul(signedFrac(t.left), partFrac(rightPart)) })
  }
  for (const [side, other, step] of [
    [left, right, 'left'],
    [right, left, 'right'],
  ] as const) {
    if (!side.work) continue
    const candidates = sumMistakes(side.work, hints)
    const withoutLcd = candidates.some((c) => c.id === 'frac-add-across' && c.freeOnly)
    for (const c of candidates) {
      if (!c.value || isZeroPoly(c.value.num)) continue
      if (c.id === 'frac-add-across' && withoutLcd && !c.freeOnly) continue
      out.push({ id: c.id, step, stepExpr: reduced(c.value, hints), value: fracMul(c.value, other.frac) })
    }
  }
  return out
}

// --- Stufe 5: Ausmultiplizieren und Regeln der Bausteine ---

// (u + v)² als u² + v²: \frac{(x + h)^2 - x^2}{h} = \frac{h^2}{h}; ebenso (u + v)³ als u³ + v³
function multiplyOutMistakes(t: FractionTask): Candidate[] {
  if (t.kind !== 'reduce' || t.part.num.form !== 'binomial' || t.part.num.base.length !== 2) return []
  const { base, minus, power = 2 } = t.part.num
  const squares = polySum(base.map((term) => polyPow([term], power)))
  const n = polySub(squares, minus)
  if (isZeroPoly(n)) return []
  return [{ id: 'frac-binomial-middle', stepExpr: div(nicePolyExpr(n), shownExpr(t.part.den)), value: { num: n, den: shownPoly(t.part.den) } }]
}

// Quadrat des Bausteins vergessen: sin² x → sin x, (√x)² → √x
function dropSquare(p: Poly, atom: string): Poly | null {
  if (!p.some((term) => (term.mono.find(([a]) => a === atom)?.[1] ?? 0) >= 2)) return null
  return polySum(p.map((term) => [{ mono: monomial(term.mono.map(([a, e]) => [a, a === atom && e >= 2 ? e - 1 : e] as const)), coef: term.coef }]))
}

// Falsche Regeln bei den Hyperbelfunktionen, je Baustein, der ersetzt wird:
// - frac-hyp-trig-sign: cosh² x + sinh² x = 1 wie bei sin und cos (cosh² x → 1 − sinh² x, sinh² x → 1 − cosh² x)
// - frac-hyp-swapped: sinh² x − cosh² x = 1 (cosh² x → sinh² x − 1, sinh² x → cosh² x + 1)
const WRONG_HYPERBOLIC: readonly { readonly id: string; readonly rules: Readonly<Record<'SH' | 'CH', SquareRule>> }[] = [
  { id: 'frac-hyp-trig-sign', rules: { CH: { unit: 1, sign: -1 }, SH: { unit: 1, sign: -1 } } },
  { id: 'frac-hyp-swapped', rules: { CH: { unit: -1, sign: 1 }, SH: { unit: 1, sign: 1 } } },
]

// Ein Polynom mit einer falschen Regel der Hyperbelfunktionen umgeschrieben (atom wird ersetzt).
// Nur, wenn dabei genauso viele Summanden entstehen wie mit der richtigen Regel (so sieht die
// falsche Antwort aus wie eine richtige, z. B. −sinh² x statt sinh² x); sonst null.
function wrongHyperbolic(p: Poly, atom: SquareAtom, rule: SquareRule): Poly | null {
  const right = trigRewrite(p, atom)
  const wrong = trigRewrite(p, atom, rule)
  return wrong.length === right.length && !polyEquals(wrong, right) ? wrong : null
}

// Bruch mit dem Minus vorn statt im Nenner: \frac{4\cosh x}{-\sinh^2 x} → -\frac{4\cosh x}{\sinh^2 x},
// \frac{2\sinh x}{-1} → -2\sinh x
function minusFirst(numerator: Poly, den: Poly, hints: readonly Poly[]): Expr {
  const flip = startsNegative(den)
  return fractionExpr(flip ? polyNeg(numerator) : numerator, factorize(flip ? polyNeg(den) : den, hints))
}

// Zähler (ein Produkt oder eine Summe) über dem Nenner der Aufgabe, ein Minus vor dem ganzen Bruch:
// -\frac{\sinh^2 x}{\sinh x}
function ruledOver(n: Poly, den: Expr): Expr {
  return n.length === 1 && startsNegative(n) ? neg(div(ruleExpr(polyNeg(n)), den)) : div(ruleExpr(n), den)
}

// Falsch umgeschriebene Teile beim Anwenden der Regel: Quadrat vergessen (sin² x → sin x), bei den
// Hyperbelfunktionen die falschen Regeln
function ruleVariants(rule: Extract<BlockRule, { kind: 'trig' }>): { readonly id: string; readonly rewrite: (p: Poly) => Poly | null }[] {
  const square = { id: 'frac-square-forgotten', rewrite: (p: Poly) => dropSquare(applyRule(p, rule), rule.prefer) }
  if (!isHyperbolicAtom(rule.prefer)) return [square]
  const atom = partnerAtom(rule.prefer)
  return [square, ...WRONG_HYPERBOLIC.map((w) => ({ id: w.id, rewrite: (p: Poly) => wrongHyperbolic(p, atom, w.rules[atom as 'SH' | 'CH']) }))]
}

function ruleMistakes(t: FractionTask, solution: FracSolution): Candidate[] {
  const rule = t.rule
  const step = solution.steps.find((s) => s.kind === 'identity')
  if (!rule || !step) return []
  if (rule.kind === 'conjugate') return []
  if (t.kind === 'sum') {
    const w = workSum(t.terms, t.hints)
    const lcdPoly = factoredPoly(w.lcd)
    if (rule.kind === 'root') {
      const den = dropSquare(lcdPoly, 'R')
      return den ? [{ id: 'frac-square-forgotten', stepExpr: expandedDenExpr(w.numerator, den), value: { num: w.numerator, den } }] : []
    }
    return ruleVariants(rule).flatMap(({ id, rewrite }): Candidate[] => {
      if (rule.target === 'num') {
        const n = rewrite(w.numerator)
        return n ? [{ id, stepExpr: fractionExpr(n, w.lcd), value: { num: n, den: lcdPoly } }] : []
      }
      const den = rewrite(lcdPoly)
      return den ? [{ id, stepExpr: minusFirst(w.numerator, den, t.hints), value: { num: w.numerator, den } }] : []
    })
  }
  if (rule.kind !== 'trig') return []
  if (t.kind === 'reduce') {
    return ruleVariants(rule).flatMap(({ id, rewrite }): Candidate[] => {
      const n = rewrite(shownPoly(t.part.num))
      return n ? [{ id, stepExpr: ruledOver(n, shownExpr(t.part.den)), value: { num: n, den: shownPoly(t.part.den) } }] : []
    })
  }
  if (t.kind === 'complex') {
    const top = sideOf(t.top, t.hints)
    if (!top.work) return []
    const work = top.work
    return ruleVariants(rule).flatMap(({ id, rewrite }): Candidate[] => {
      const n = rewrite(work.numerator)
      if (!n) return []
      const wrongTop = { num: n, den: top.frac.den }
      return [{ id, stepExpr: fractionExpr(n, work.lcd), value: fracDiv(wrongTop, signedFrac(t.bottom)) }]
    })
  }
  return []
}

// --- Wurzel beseitigen: mit dem Gegenstück erweitern ---

function conjugateMistakes(t: FractionTask, solution: FracSolution): Candidate[] {
  if (t.kind !== 'reduce' || t.rule?.kind !== 'conjugate') return []
  const target = t.rule.target
  const [numP, denP] = [shownPoly(t.part.num), shownPoly(t.part.den)]
  const sideP = target === 'den' ? denP : numP
  const conj = conjugateOf(sideP)
  const up = solution.steps.find((s) => s.kind === 'conjugate')?.expr
  if (!conj || up?.kind !== 'div') return []
  const out: Candidate[] = []
  // \frac{1}{\cosh x - \sinh x}: Nenner (cosh x − sinh x)(cosh x + sinh x) mit einer falschen Regel
  if (target === 'den' && isHyperbolicPair(denP)) {
    const n = polyMul(numP, conj)
    for (const w of WRONG_HYPERBOLIC) {
      const den = wrongHyperbolic(polyMul(denP, conj), 'CH', w.rules.CH)
      if (den) out.push({ id: w.id, step: 'identity', stepExpr: minusFirst(n, den, t.hints), value: { num: n, den } })
    }
  }
  // Nur Nenner bzw. nur Zähler malgenommen: \frac{1}{(\sqrt{x} - 2)(\sqrt{x} + 2)}
  if (target === 'den') out.push({ id: 'frac-conjugate-one-side', stepExpr: div(shownExpr(t.part.num), up.den), value: { num: numP, den: polyMul(denP, conj) } })
  else out.push({ id: 'frac-conjugate-one-side', stepExpr: div(up.num, shownExpr(t.part.den)), value: { num: polyMul(numP, conj), den: denP } })
  // Mit derselben Summe statt mit dem Gegenstück erweitert und trotzdem a² − b² gerechnet:
  // \frac{1}{\sqrt{x} - 2} = \frac{\sqrt{x} - 2}{x - 4}
  const product = polyMul(sideP, conj)
  const same = primitivePart(sideP)
  if (target === 'den') {
    const n = polyMul(numP, same)
    out.push({ id: 'frac-conjugate-sign', stepExpr: plainFractionExpr(n, product), value: { num: n, den: product } })
  } else {
    out.push({ id: 'frac-conjugate-sign', stepExpr: div(nicePolyExpr(product), mul(shownExpr(t.part.den), nicePolyExpr(same))), value: { num: product, den: polyMul(denP, same) } })
  }
  // Zahl nicht quadriert: (a\sqrt{x} + b)(a\sqrt{x} - b) = a^2x - b^2, aber mit b statt b² bzw. a statt a²
  // (nur wenn das Gegenstück genau die Summe mit anderem Vorzeichen ist)
  if (!polyEquals(conj, polyAdd([sideP[0]], polyNeg([sideP[1]])))) return out
  sideP.forEach((term, i) => {
    const c = ratAbs(term.coef)
    if (!isInteger(c) || isOne(c)) return
    const square = polyMul([term], [term])
    const wrongSquare = polyScale(square, ratDiv(rat(1), c))
    const wrong = polyAdd(product, i === 0 ? polySub(wrongSquare, square) : polySub(square, wrongSquare))
    if (isZeroPoly(wrong)) return
    if (target === 'den') {
      const n = polyMul(numP, conj)
      out.push({ id: 'frac-conjugate-square', stepExpr: plainFractionExpr(n, wrong), value: { num: n, den: wrong } })
    } else {
      out.push({ id: 'frac-conjugate-square', stepExpr: div(nicePolyExpr(wrong), up.den), value: { num: wrong, den: polyMul(denP, conj) } })
    }
  })
  return out
}

// --- Partialbruchzerlegung (Stufe 5) ---

export type PartialWrong = {
  readonly id: string
  readonly step: 'divide' | 'factor-den' | 'ansatz' | 'coef'
  // die falsche Antwort in diesem Schritt (bei einer Zahl: ihr Wert)
  readonly shown: Expr
  // bei einer Zahl: welche
  readonly letter?: string
  // Wert, mit dem man richtig weiterrechnet; null, wenn es damit nicht weitergeht (falscher Ansatz)
  readonly value: Frac | null
  // daraus die Zerlegung, so wie man sie am Ende hinschreibt
  readonly result: Expr | null
  // bei einer Zahl: alle Zahlen der Zerlegung mit dem Fehler
  readonly terms?: readonly PartialTerm[]
}

// Klammer mit umgedrehtem Vorzeichen der Zahl: x + 1 → x − 1, 2x − 1 → 2x + 1 (x bleibt)
const flipConstant = (f: Poly): Poly => f.map((t) => (t.mono.length === 0 ? { mono: t.mono, coef: ratNeg(t.coef) } : t))

export function partialWrongs(t: Extract<FractionTask, { kind: 'partial' }>, w: PartialWork = partialWork(t)): PartialWrong[] {
  const out: PartialWrong[] = []
  const value = taskFrac(t)
  const denShown = shownExpr(t.part.den)
  const decomposed = (v: Frac) => partialResultOf(v, t.hints)

  // Polynomdivision
  if (w.divided) {
    // Beim Abziehen das Vorzeichen falsch: Nur die höchste Potenz wird richtig abgezogen, die
    // übrigen Summanden des Produkts mit dem falschen Vorzeichen, als würde man durch x² + x + 2 statt
    // durch x² − x − 2 teilen
    const flipped = polyAdd([w.den[0]], polyNeg(w.den.slice(1)))
    const { q, r } = divRem(w.num, flipped, w.letter)
    const wrong = fracAdd(fracOf(q), { num: r, den: w.den })
    if (!fracEquals(wrong, value)) {
      const shown = isZeroPoly(r) ? nicePolyExpr(q) : dividedExpr({ ...w, quotient: q, rest: r }, denShown)
      out.push({ id: 'frac-division-sign', step: 'divide', shown, value: wrong, result: decomposed(wrong) })
    }
    // Rest vergessen: nur der ganze Teil
    out.push({ id: 'frac-division-remainder', step: 'divide', shown: nicePolyExpr(w.quotient), value: fracOf(w.quotient), result: nicePolyExpr(w.quotient) })
  }

  // Nenner zerlegen: falsch zerlegt und damit weitergerechnet
  if (partialFactorStep(t)) {
    for (const m of factorMistakes(w.den, t.hints)) {
      const wrong = fracAdd(fracOf(w.quotient), { num: w.rest, den: m.poly })
      out.push({ id: m.id, step: 'factor-den', shown: m.expr, value: wrong, result: decomposed(wrong) })
    }
  }

  // Ansatz: ohne den ganzen Teil aus der Polynomdivision
  if (w.divided) {
    out.push({ id: 'frac-partial-no-division', step: 'ansatz', shown: ansatzExpr([], w.terms), value: { num: w.rest, den: w.den }, result: partialExpr([], w.terms) })
  }
  // Doppelter Faktor nur einmal: nur mit (x − a) oder nur mit (x − a)²
  for (const d of w.factored.factors.filter((f) => f.exp === 2)) {
    for (const drop of [2, 1]) {
      const kept = w.terms.filter((x) => !(polyEquals(x.factor, d.poly) && x.power === drop)).map((x, i) => ({ ...x, letter: PARTIAL_LETTERS[i] }))
      out.push({ id: 'frac-partial-double-once', step: 'ansatz', shown: ansatzExpr(w.quotient, kept), value: null, result: null })
    }
  }

  // Zahlen bestimmen
  for (const f of w.findings) {
    let wrong: Rational | null = null
    let id = ''
    if (f.kind === 'insert') {
      // Vorzeichen verloren: in den übrigen Klammern mit dem falschen Vorzeichen gerechnet, z. B. bei
      // x = 2 die Klammer x + 1 als 2 − 1
      const co = cofactor(w.factored, f.factor, multiplicityOf(w, f.factor))
      const flippedCo = factoredPoly({ coef: co.coef, factors: co.factors.map((g) => ({ poly: flipConstant(g.poly), exp: g.exp })) })
      const others = polyValueAt(flippedCo, w.letter, f.at)
      if (ratSign(others) !== 0 && !ratEq(others, f.others)) {
        wrong = ratDiv(f.restAt, others)
        id = 'frac-partial-insert-sign'
      }
    } else if (f.others.length > 0) {
      // Koeffizientenvergleich: die Beiträge der anderen Zahlen vergessen
      wrong = ratDiv(f.restCoef, f.own)
      id = 'frac-partial-compare'
    }
    if (!wrong || ratEq(wrong, f.value)) continue
    const terms = termsWith(w, f.letter, wrong)
    const wrongValue = partialFrac(w.quotient, terms)
    if (fracEquals(wrongValue, value)) continue
    out.push({ id, step: 'coef', shown: num(wrong), letter: f.letter, value: wrongValue, result: partialExpr(w.quotient, terms), terms })
  }
  return out
}

function partialCandidates(t: Extract<FractionTask, { kind: 'partial' }>): Candidate[] {
  // Bei einer Zahl unterscheidet erst die ganze Zerlegung (A = 1 und B = 1 sind verschiedene Fehler)
  return partialWrongs(t).map((w) => ({ id: w.id, step: w.step, stepExpr: w.step === 'coef' && w.result ? w.result : w.shown, value: w.value }))
}

// --- Komplexe Zahlen ---

// Hat ein Polynom mit i den Wert 0?
const isZeroImag = (p: Poly) => isZeroPoly(reduceImag(p))

// Fehler bei den Potenzen von i: jede Potenz ab i² als −1 gerechnet (i³ = −1, i⁴ = −1)
const minusOnePowers = (p: Poly): Poly =>
  polySum(p.map((term) => ((term.mono.find(([a]) => a === 'i')?.[1] ?? 0) < 2 ? [term] : [{ mono: term.mono.filter(([a]) => a !== 'i'), coef: ratNeg(term.coef) }])))

// Wert einer komplexen Zahl als Bruch: re + im·i
const imagFrac = (re: Frac, im: Frac): Frac => fracAdd(re, fracMul(im, fracOf(polyAtomI)))
const polyAtomI: Poly = [{ mono: [['i', 1]], coef: rat(1) }]

function imaginaryMistakes(t: Extract<FractionTask, { kind: 'imaginary' }>): Candidate[] {
  const w = imagWork(t)
  const out: Candidate[] = []
  const sign = w.terms[w.index].sign
  const others = signedFrac(w.terms.filter((_, i) => i !== w.index))
  // Wert der ganzen Aufgabe, wenn der Bruch den Wert f hätte
  const whole = (f: Frac): Frac => fracAdd(others, sign < 0 ? fracNeg(f) : f)
  const [n, d] = [shownPoly(w.num), shownPoly(w.den)]
  const { num: pn, den: pd } = w.product

  // Potenzen von i falsch: mit falschem Vorzeichen (i² = 1, i³ = i) oder jede als −1 (i³ = −1)
  if (w.powered) {
    for (const wrong of [reduceImagWrong, minusOnePowers]) {
      const shown = (s: Shown): Shown => (s.form === 'factored' ? s : expanded(wrong(shownPoly(s))))
      const terms: Signed[] = t.terms.map((s) => ({ sign: s.sign, part: part(shown(s.part.num), shown(s.part.den)) }))
      if (terms.some((s) => isZeroImag(shownPoly(s.part.den)))) continue
      out.push({ id: 'frac-imag-power', step: 'imag-power', stepExpr: signedSum(terms.map((s) => ({ sign: s.sign, expr: partExpr(s.part) }))), value: signedFrac(terms) })
    }
  }
  // nur den Nenner bzw. nur den Zähler mit dem konjugiert Komplexen malgenommen
  out.push({ id: 'frac-conjugate-one-side', step: 'imag-conjugate', stepExpr: imagStage(w, div(shownExpr(w.num), imagTimesExpr(w.den, w.conj))), value: whole({ num: n, den: polyMul(d, w.conj) }) })
  out.push({ id: 'frac-conjugate-one-side', step: 'imag-conjugate', stepExpr: imagStage(w, div(imagTimesExpr(w.num, w.conj), shownExpr(w.den))), value: whole({ num: polyMul(n, w.conj), den: d }) })
  // i² = 1 im Zähler
  const squared = reduceImagWrong(polyMul(n, w.conj))
  if (!polyEquals(squared, pn)) out.push({ id: 'frac-imag-squared', step: 'imag-multiply', stepExpr: imagStage(w, plainFractionExpr(squared, pd)), value: whole({ num: squared, den: pd }) })
  // im Zähler nur Realteil mal Realteil und Imaginärteil mal Imaginärteil (die gemischten fehlen)
  if (w.num.form === 'expanded' && n.length === 2) {
    const [a, b] = [imagParts(n), imagParts(w.conj)]
    const cross = reduceImag(polyAdd(polyMul(a.re, b.re), polyMul(polyMul(a.im, b.im), polyConst(-1))))
    if (a.re.length > 0 && a.im.length > 0 && !isZeroPoly(cross)) out.push({ id: 'frac-imag-cross', step: 'imag-multiply', stepExpr: imagStage(w, plainFractionExpr(cross, pd)), value: whole({ num: cross, den: pd }) })
  }
  // Nenner c² − d²
  const den = reduceImagWrong(polyMul(d, w.conj))
  if (!polyEquals(den, pd) && !isZeroPoly(den)) out.push({ id: 'frac-imag-den', step: 'imag-multiply', stepExpr: imagStage(w, plainFractionExpr(pn, den)), value: whole({ num: pn, den }) })
  // Aufteilen: nur der Realteil durch den Nenner. Mit weiteren Summanden geschieht das Aufteilen im
  // letzten Schritt beim Zusammenfassen; die Antwort ist dann das Ergebnis.
  const last: StepKind = w.terms.length > 1 ? 'imag-sum' : 'imag-split'
  const lastExpr = (value: Frac, own: Expr) => (last === 'imag-sum' ? complexValueExpr(value, t.hints) : imagStage(w, own))
  const parts = imagParts(pn)
  const denOne = constValue(pd)
  if (parts.re.length > 0 && parts.im.length > 0 && !(denOne !== null && isOne(ratAbs(denOne)))) {
    const re = { num: parts.re, den: pd }
    const im = fracOf(parts.im)
    const value = whole(imagFrac(re, im))
    out.push({ id: 'frac-imag-split', step: last, stepExpr: lastExpr(value, complexExpr({ re, im }, t.hints)), value })
  }
  // Realteil durch Realteil, Imaginärteil durch Imaginärteil
  const [top, bottom] = [imagParts(n), imagParts(d)]
  if ([top.re, top.im, bottom.re, bottom.im].every((p) => p.length > 0)) {
    const re = { num: top.re, den: bottom.re }
    const im = { num: top.im, den: bottom.im }
    const value = whole(imagFrac(re, im))
    out.push({ id: 'frac-imag-direct', step: last, stepExpr: lastExpr(value, complexExpr({ re, im }, t.hints)), value })
  }
  // Minus vor einer komplexen Zahl nur auf den Realteil
  if (w.terms.length > 1) {
    w.terms.forEach((s, i) => {
      if (s.sign > 0) return
      const v = i === w.index ? { num: pn, den: pd } : partFrac(s.part)
      const p = imagParts(v.num)
      if (p.re.length === 0 || p.im.length === 0) return
      // −(a + bi) als −a + bi gerechnet: das Minus fehlt beim Imaginärteil
      const value = fracAdd(signedFrac(w.terms), fracMul({ num: polyMul(p.im, polyAtomI), den: v.den }, fracOf(polyConst(2))))
      out.push({ id: 'frac-imag-minus', step: 'imag-sum', stepExpr: complexValueExpr(value, t.hints), value })
    })
  }
  return out
}

// --- Grenzwerte ---

const numberFrac = (r: Rational): Frac => fracOf(polyConst(r))

function limitMistakes(t: Extract<FractionTask, { kind: 'limit' }>): Candidate[] {
  const w = limitWork(t)
  const out: Candidate[] = []
  // Fehler beim Umformen des Bruchs (zerlegen, kürzen, zusammenfassen), richtig weitergerechnet;
  // sie kommen nach den eigenen Fehlern des Grenzwerts (im freien Modus zählt der erste passende)
  const inner: Candidate[] = []
  if (w.inner) {
    for (const wrong of fractionWrongAnswers(t.inner, w.inner)) {
      if (!wrong.value) continue
      const v = limitOf(wrong.value, t.letter, t.to)
      if (v !== null) inner.push({ id: wrong.rule.id, step: wrong.step, stepExpr: wrong.stepExpr, value: numberFrac(v), ...(wrong.freeOnly ? { freeOnly: true } : {}) })
    }
  }
  if (t.to !== 'infinity') {
    // 0/0 als 0 oder als 1
    for (const r of [rat(0), rat(1)]) out.push({ id: 'frac-limit-zero-zero', step: 'limit-insert', stepExpr: num(r), value: numberFrac(r) })
    // −a statt a eingesetzt
    if (ratSign(t.to) !== 0) {
      const v = fracValueAt(w.frac, t.letter, ratNeg(t.to))
      if (v !== null) out.push({ id: 'frac-limit-insert-sign', step: 'limit-insert', stepExpr: num(v), value: numberFrac(v) })
    }
    return [...out, ...inner]
  }
  const { num: p, den: q } = w.frac
  const letter = t.letter
  // nur der Zähler geteilt: Der Nenner wächst weiter, der Bruch geht gegen 0
  out.push({ id: 'frac-limit-divide-one-side', step: 'limit-divide', stepExpr: limitDividedExpr(w, 'num'), value: numberFrac(rat(0)) })
  out.push({ id: 'frac-limit-infinity-one', step: 'limit-value', stepExpr: num(1), value: numberFrac(rat(1)) })
  // n = 0 eingesetzt
  const c = constantOf(q, letter)
  if (ratSign(c) !== 0) {
    const v = ratDiv(constantOf(p, letter), c)
    out.push({ id: 'frac-limit-n-zero', step: 'limit-value', stepExpr: num(v), value: numberFrac(v) })
  }
  // kleinerer Grad im Zähler, aber die höchsten Zahlen geteilt
  if (degreeIn(p, letter) < degreeIn(q, letter)) {
    const v = ratDiv(leadingOf(p, letter), leadingOf(q, letter))
    out.push({ id: 'frac-limit-degree', step: 'limit-value', stepExpr: num(v), value: numberFrac(v) })
  }
  // vorne geschriebene Zahlen statt der Zahlen vor der höchsten Potenz
  if (w.order.num || w.order.den) {
    const first = (poly: Poly, ascending: boolean) => (ascending ? poly[poly.length - 1].coef : poly[0].coef)
    const v = ratDiv(first(p, w.order.num), first(q, w.order.den))
    out.push({ id: 'frac-limit-first-terms', step: 'limit-value', stepExpr: num(v), value: numberFrac(v) })
  }
  return [...out, ...inner]
}

// --- Teleskopsummen ---

// Fehler beim Zerlegen und beim Wegheben als abgewandelte Rechnung (telescope.ts)
export type TeleMistake = { readonly id: string; readonly step: 'tele-split' | 'tele-cancel'; readonly variant: TeleVariant }

export function teleMistakes(t: Extract<FractionTask, { kind: 'telescope' }>, w: TeleWork = teleWork(t)): TeleMistake[] {
  const out: TeleMistake[] = []
  // Zahl vor der Klammer vergessen: 1/(f(f + αd)) = 1/f − 1/(f + αd) statt 1/(αd) · (…)
  if (w.power === 1) {
    const gap = ratMul(w.base.find((term) => term.mono.length > 0)?.coef ?? rat(1), rat(w.shift))
    if (!isOne(ratAbs(gap))) out.push({ id: 'frac-tele-factor', step: 'tele-split', variant: { factor: ratMul(w.factor, gap) } })
  }
  out.push({ id: 'frac-tele-swap', step: 'tele-split', variant: { swap: true } })
  if (w.shift >= 2) out.push({ id: 'frac-tele-only-ends', step: 'tele-cancel', variant: { headCount: 1, tailOffset: w.shift, tailCount: 1 } })
  out.push({ id: 'frac-tele-last', step: 'tele-cancel', variant: { tailOffset: 0 } })
  if (t.from >= 2) out.push({ id: 'frac-tele-start', step: 'tele-cancel', variant: { headFrom: 1 } })
  out.push({ id: 'frac-tele-head', step: 'tele-cancel', variant: { headCount: 0 } })
  // nur, wenn sich damit rechnen lässt (bei k = 1 ist der Nenner nicht 0)
  return out.filter((x) => remainingFrac(w, x.variant) !== null)
}

// Was übrig bleibt, als Summe von Brüchen (ohne die Zahl davor): fürs Zusammenfassen
export function teleRemainingTask(w: TeleWork): Extract<FractionTask, { kind: 'sum' }> {
  const n = upperPoly(w.upper)
  const numberPart = (r: Rational) => part(expanded(polyConst(rat(r.n))), expanded(polyConst(rat(r.d))))
  const heads = Array.from({ length: w.shift }, (_, i) => ({ sign: 1 as const, part: numberPart(gValue(w, w.from + i)!) }))
  const tailBases = Array.from({ length: w.shift }, (_, i) => baseAt(w, polyAdd(n, polyConst(i + 1))))
  const tails = tailBases.map((f, i) => {
    if (w.upper.kind === 'number') return { sign: -1 as const, part: numberPart(gValue(w, w.upper.value + i + 1)!) }
    const den = w.power === 1 ? expanded(f) : factoredShown({ coef: rat(1), factors: [{ poly: f, exp: w.power }] })
    return { sign: -1 as const, part: part(expanded(polyConst(1)), den) }
  })
  return { kind: 'sum', terms: [...heads, ...tails], hints: w.upper.kind === 'number' ? [] : tailBases }
}

function telescopeCandidates(t: Extract<FractionTask, { kind: 'telescope' }>): Candidate[] {
  const w = teleWork(t)
  const out: Candidate[] = []
  const summandTask = { kind: 'partial' as const, part: t.summand, hints: t.hints }
  // Nenner des Summanden falsch zerlegt (damit lässt sich nicht weiterrechnen)
  if (teleFactorStep(t)) {
    for (const m of factorMistakes(w.partial.den, t.hints)) out.push({ id: m.id, step: 'factor-den', stepExpr: m.expr, value: null })
  }
  // Beim Zerlegen und Wegheben
  for (const x of teleMistakes(t, w)) {
    const stepExpr = x.step === 'tele-split' ? splitExpr(w, x.variant) : remainingExpr(w, x.variant)
    out.push({ id: x.id, step: x.step, stepExpr, value: teleValue(w, x.variant) })
  }
  // Partialbrüche: beim Einsetzen der Nullstelle das Vorzeichen verloren (dann hebt sich nichts weg)
  for (const pw of partialWrongs(summandTask, w.partial)) {
    if (pw.step !== 'coef' || !pw.terms) continue
    const nonzero = pw.terms.filter((x) => !isZero(x.value))
    const on = (f: Poly) => nonzero.find((x) => x.power === w.power && polyEquals(x.factor, f))?.value
    const [a, b] = [on(w.base), on(baseAt(w, polyAdd(polyAtom(t.index), polyConst(w.shift))))]
    // nur, wenn die falsche Zerlegung aus denselben zwei Brüchen besteht (bei Quadraten nicht)
    if (nonzero.length === 2 && a && b) out.push({ id: pw.id, step: 'tele-split', stepExpr: pairExpr(w, a, b), value: null })
  }
  // Beim Zusammenfassen (nicht bei der Reihe): Fehler der Summe, mal die Zahl davor
  if (t.upper.kind !== 'infinity') {
    const sum = teleRemainingTask(w)
    for (const wrong of fractionWrongAnswers(sum)) {
      if (!wrong.value || isZeroPoly(wrong.value.num) || wrong.step === 'lcd') continue
      const value = fracScale(wrong.value, w.factor)
      out.push({ id: wrong.rule.id, step: 'tele-sum', stepExpr: reduced(value, []), value, ...(wrong.freeOnly ? { freeOnly: true } : {}) })
    }
  }
  return out
}

// --- Verschachtelter Doppelbruch ---

// Fehler im inneren Doppelbruch (als dessen Ergebnis) und danach wie beim Doppelbruch
function nestedMistakes(t: Extract<FractionTask, { kind: 'nested' }>): Candidate[] {
  const inner = innerTask(t, t.hints)
  const innerSolution = solveFraction(inner)
  const out: Candidate[] = []
  for (const w of fractionWrongAnswers(inner, innerSolution)) {
    if (!w.value || isZeroPoly(w.value.num)) continue
    let value: Frac
    try {
      value = taskFrac(replaceInner(t, { num: expanded(w.value.num), den: expanded(w.value.den) }, t.hints))
    } catch {
      continue
    }
    out.push({ id: w.rule.id, step: 'inner-complex', stepExpr: w.result!, value, ...(w.freeOnly ? { freeOnly: true } : {}) })
  }
  const replaced = replaceInner(t, innerResultPart(innerSolution), t.hints)
  for (const w of fractionWrongAnswers(replaced)) {
    out.push({ id: w.rule.id, step: w.step, stepExpr: w.stepExpr, value: w.value, ...(w.freeOnly ? { freeOnly: true } : {}) })
  }
  return out
}

// --- Rechenbaum ---

// Fehler in der Reihenfolge (Punkt vor Strich, Klammern), bei Dezimalzahlen und in jedem Teil;
// ein Fehler in einem Teil wird mit dem Rest richtig weitergerechnet
function treeMistakes(t: Extract<FractionTask, { kind: 'tree' }>, solution: TreeSolution): Candidate[] {
  const out: Candidate[] = []
  // Wert eines falsch gerechneten Baums; 0 und Teilen durch 0 zählen nicht als Antwort
  const value = (tree: TreeNode): Frac | null => {
    try {
      const v = treeFrac(tree)
      return isZeroPoly(v.num) || isZeroPoly(v.den) ? null : v
    } catch {
      return null
    }
  }
  for (const m of decimalMistakes(t.root)) out.push({ id: 'frac-decimal-places', stepExpr: partExpr(m.wrong), value: value(m.tree) })
  const start = normalize(withoutDecimals(t.root))
  const order = leftToRight(start)
  if (order && !isZeroPoly(order.num)) out.push({ id: 'frac-order', stepExpr: reduced(order, t.hints), value: order })
  for (const tree of bracketIgnoredMistakes(start)) {
    const v = value(tree)
    if (v) out.push({ id: 'frac-bracket-ignored', stepExpr: reduced(v, t.hints), value: v })
  }
  for (const tree of minusBracketMistakes(start)) {
    const v = value(tree)
    if (v) out.push({ id: 'frac-minus-before-bracket', stepExpr: reduced(v, t.hints), value: v })
  }
  for (const stage of solution.stages) {
    for (const w of fractionWrongAnswers(stage.task, stage.solution)) {
      if (!w.value) continue
      const v = isZeroPoly(w.value.den) ? null : value(normalize(replaceNode(stage.before, stage.node, leafOfFrac(w.value, t.hints))))
      if (v) out.push({ id: w.rule.id, step: w.step, stepExpr: w.stepExpr, value: v, ...(w.freeOnly ? { freeOnly: true } : {}) })
    }
  }
  return out
}

// --- Alle falschen Antworten einer Aufgabe ---

export function fractionWrongAnswers(t: FractionTask, solution: FracSolution = solveFraction(t)): FracWrong[] {
  const candidates: Candidate[] =
    t.kind === 'tree'
      ? treeMistakes(t, solution as TreeSolution)
      : t.kind === 'partial'
      ? partialCandidates(t)
      : t.kind === 'imaginary'
      ? imaginaryMistakes(t)
      : t.kind === 'limit'
      ? limitMistakes(t)
      : t.kind === 'telescope'
      ? telescopeCandidates(t)
      : t.kind === 'nested'
      ? nestedMistakes(t)
      : [
          ...(t.kind === 'sum' ? sumMistakes(workSum(t.terms, t.hints), t.hints) : []),
          ...operationMistakes(t),
          ...multiplyOutMistakes(t),
          ...factorStepMistakes(t, solution),
          ...ruleMistakes(t, solution),
          ...conjugateMistakes(t, solution),
          // Nenner ohne Wurzel: danach wird nicht mehr gekürzt
          ...(t.rule?.kind === 'conjugate' && t.rule.target === 'den' ? [] : cancelMistakes(t, solution)),
        ]
  const result: FracWrong[] = []
  for (const c of candidates) {
    const rule = fractionErrorRule(c.id)
    const step = c.step ?? rule.step
    if (c.value) {
      if (isZeroPoly(c.value.den) || fracEquals(c.value, solution.value)) continue
      // im selben Schritt jede falsche Antwort nur einmal (im freien Modus zählt die erste)
      if (result.some((r) => r.step === step && r.value && fracEquals(r.value, c.value!))) continue
      result.push({ rule, step, stepExpr: c.stepExpr, value: c.value, result: resultOf(c.value, t), ...(c.freeOnly ? { freeOnly: true } : {}) })
    } else {
      const latex = toLatex(c.stepExpr)
      if (result.some((r) => r.step === step && toLatex(r.stepExpr) === latex)) continue
      result.push({ rule, step, stepExpr: c.stepExpr, value: null, result: null })
    }
  }
  return result
}

