import { contains, key, subterms } from '../expr/compare.ts'
import { evaluate } from '../expr/evaluate.ts'
import { equationToLatex } from '../expr/print.ts'
import { type Equation, type Expr, add, div, eq, fn, log, mul, num, pow, variable } from '../expr/types.ts'
import { ERROR_RULES, type WrongAnswer } from '../derive/errorRules.ts'
import { FRACTION_ERROR_RULES, fractionWrongAnswers } from '../fraction/errorRules.ts'
import { type Signed, expanded, minus, part, plus } from '../fraction/task.ts'
import {
  type Poly,
  polyAdd,
  polyAtom,
  polyConst,
  polyDivideExact,
  polyMul,
  polyScale,
} from '../fraction/poly.ts'
import { createRng } from '../random/rng.ts'
import { isOne, rat, ratAbs, ratSign } from '../rational.ts'
import { type Atoms, RADICAL_ATOM, monomialSqrt, newAtoms, niceFrac, polyToExpr, radicalAtoms, toPoly, toRat } from './algebra.ts'
import { clearlyFails, differsFromTarget, samplePoints, withSubstitution } from './check.ts'
import {
  type RearrangeSolution,
  type RearrangeStep,
  type SolveOptions,
  type Side,
  complexRoot,
  dividedBy,
  factoredOut,
  isE,
  lnOf,
  lnTerms,
  negated,
  plusTerm,
  TRIG_OF,
  powerLawSum,
  powerOf,
  pqWrong,
  pythagorasWrong,
  quadraticWrong,
  signedLog,
  substituteWrong,
  solveEquation,
  squared,
  tanQuotientWrong,
  timesFactor,
  unknownAtoms,
} from './isolate.ts'
import type { RearrangeTask } from './task.ts'
import { type ToolStepKind, toolMistakes } from './tools/steps.ts'

const TOOL_STEPS = new Set<string>(['derive', 'partial', 'antiderivative', 'bounds', 'sumFormula', 'series', 'limit', 'ode', 'det', 'detExpand'])
// Schritt, der ein Werkzeug der Stufe 5 ausrechnet (Ableitung, Integral, …, Determinante)
export const isToolStep = (kind: string) => TOOL_STEPS.has(kind)

// Typische Fehler beim Umstellen (Katalog in docs/PLAN-M3.md). Jeder Fehler steckt in genau einem
// Schritt des Rechenwegs: Dieser Schritt wird falsch ausgeführt, danach wird richtig weitergerechnet.
// Daraus entstehen die falschen Antworten im geführten Modus und die Fehlerdiagnose im freien Modus.
// Beim Zusammenfassen zu einem Bruch kommen die Fehler aus „Brüche" dazu (Ids frac-…).

export type EqErrorRule = {
  readonly id: string
  // Name des Fehlers (Text mit $…$-Formeln)
  readonly name: string
  // Beispiel aus dem Fehlerkatalog
  readonly wrongFormula: string
}

export const REARRANGE_ERROR_RULES: readonly EqErrorRule[] = [
  { id: 'eq-sign-not-flipped', name: 'Beim Rüberbringen das Vorzeichen nicht gewechselt', wrongFormula: 'y = x + b \\Rightarrow x = y + b' },
  { id: 'eq-inverse-op', name: 'Malgenommen statt geteilt (oder umgekehrt)', wrongFormula: 'y = ax \\Rightarrow x = ay' },
  { id: 'eq-divide-one-term', name: 'Nur einen Summanden geteilt', wrongFormula: 'ax = y + b \\Rightarrow x = \\frac{y}{a} + b' },
  { id: 'eq-fraction-flipped', name: 'Bruch auf den Kopf gestellt', wrongFormula: 'y = \\frac{a}{x} \\Rightarrow x = \\frac{y}{a}' },
  { id: 'eq-denominator-bracket', name: 'Klammer um den Nenner vergessen', wrongFormula: 'y = \\frac{2x + 1}{x - 3} \\Rightarrow xy - 3 = 2x + 1' },
  { id: 'eq-bracket-first-term', name: 'Beim Ausmultiplizieren nur den ersten Summanden malgenommen', wrongFormula: 'a(x + b) = ax + b' },
  { id: 'eq-factor-one-lost', name: 'Beim Ausklammern die $1$ vergessen', wrongFormula: 'xy - x = 3y + 1 \\Rightarrow xy = 3y + 1' },
  { id: 'eq-reciprocal-termwise', name: 'Kehrwert von jedem Summanden einzeln genommen', wrongFormula: '\\frac{1}{a} = \\frac{1}{b} - \\frac{1}{x} \\Rightarrow a = b - x' },
  { id: 'eq-root-termwise', name: 'Wurzel aus jedem Summanden einzeln gezogen', wrongFormula: 'x^2 = b^2 - \\frac{y^2}{a^2} \\Rightarrow x = b - \\frac{y}{a}' },
  { id: 'eq-square-one-factor', name: 'Nur einen Teil quadriert', wrongFormula: '\\frac{y}{a} = \\sqrt{b^2 - x^2} \\Rightarrow \\frac{y^2}{a} = b^2 - x^2' },
  { id: 'eq-square-middle', name: 'Beim Quadrieren das Mittelglied vergessen', wrongFormula: '\\left(y + \\sqrt{x}\\right)^2 = y^2 + x' },
  { id: 'eq-multiply-one-term', name: 'Beim Malnehmen nicht jeden Summanden malgenommen', wrongFormula: '\\frac{x}{a} = c - b \\Rightarrow x = ac - b' },
  { id: 'eq-minus-bracket', name: 'Minus vor der Klammer nur beim ersten Summanden beachtet', wrongFormula: 'a - c(x - d) = a - cx - cd' },
  { id: 'eq-factor-sign', name: 'Beim Ausklammern das Minus verloren', wrongFormula: 'ax - bx = c \\Rightarrow x(a + b) = c' },
  { id: 'eq-square-halved', name: 'Beim Quadrat halbiert statt die Wurzel gezogen', wrongFormula: 'x^2 = c \\Rightarrow x = \\frac{c}{2}' },
  { id: 'eq-nested-root', name: 'Die innere Wurzel gleich mit aufgelöst', wrongFormula: 'y = \\sqrt{a + \\sqrt{b + \\sqrt{x}}} \\Rightarrow y^2 = a + b + \\sqrt{x}' },
  // e-Funktion, Logarithmen, Potenzen (ab Stufe 4)
  { id: 'eq-ln-forgotten', name: 'Beim Logarithmieren den $\\ln$ auf der anderen Seite vergessen', wrongFormula: 'e^{kx} = w \\Rightarrow kx = w' },
  { id: 'eq-exp-forgotten', name: 'Beim $e$ hoch die andere Seite nicht hochgenommen', wrongFormula: '\\ln u = b \\Rightarrow u = b' },
  { id: 'eq-exp-minus-lost', name: 'Das Minus in der Hochzahl verloren', wrongFormula: 'e^{-kx} = w \\Rightarrow kx = \\ln w' },
  { id: 'eq-ln-of-sum', name: '$\\ln$ einer Summe gliedweise genommen', wrongFormula: 'e^{2x} = a + b \\Rightarrow 2x = \\ln a + \\ln b' },
  { id: 'eq-exp-of-sum', name: '$e$ hoch eine Summe gliedweise genommen', wrongFormula: '\\ln u = a + b \\Rightarrow u = e^a + e^b' },
  { id: 'eq-log-base-forgotten', name: 'Beim Logarithmieren den Faktor $\\ln a$ vergessen', wrongFormula: '2^x = c \\Rightarrow x = \\ln c' },
  { id: 'eq-divide-inside-ln', name: 'Im $\\ln$ geteilt statt den ganzen $\\ln$', wrongFormula: 'kx = \\ln w \\Rightarrow x = \\ln\\frac{w}{k}' },
  { id: 'eq-log-product', name: 'Logarithmus eines Produkts als Produkt der Logarithmen', wrongFormula: '\\ln\\left(a \\cdot 5^x\\right) = \\ln a \\cdot x\\ln 5' },
  { id: 'eq-log-sum', name: 'Summe der Logarithmen als Logarithmus der Summe', wrongFormula: '\\ln u + \\ln v = \\ln(u + v)' },
  { id: 'eq-log-quotient', name: 'Differenz der Logarithmen als Quotient', wrongFormula: '\\ln u - \\ln v = \\frac{\\ln u}{\\ln v}' },
  { id: 'eq-power-sum', name: 'Potenz mit Summe in der Hochzahl als Summe geschrieben', wrongFormula: '2^{x + 1} = 2^x + 2' },
  // Winkel- und Hyperbelfunktionen, Umkehrfunktionen (ab Stufe 4, Schritt 6b)
  { id: 'eq-inverse-forgotten', name: 'Die Umkehrfunktion auf der anderen Seite vergessen', wrongFormula: '\\sin(kx) = w \\Rightarrow kx = w' },
  { id: 'eq-inverse-reciprocal', name: 'Umkehrfunktion mit dem Kehrwert verwechselt', wrongFormula: '\\tan x = w \\Rightarrow x = \\frac{1}{\\tan w}' },
  { id: 'eq-divide-inside-arc', name: 'In der Umkehrfunktion geteilt statt die ganze Umkehrfunktion', wrongFormula: 'kx = \\arcsin w \\Rightarrow x = \\arcsin\\frac{w}{k}' },
  { id: 'eq-pythagoras-square', name: 'Beim Ersetzen mit $\\sin^2 x + \\cos^2 x = 1$ das Quadrat vergessen', wrongFormula: '\\sin^2 x = 1 - \\cos x' },
  { id: 'eq-hyperbolic-sign', name: '$\\sinh^2 x$ wie $\\sin^2 x$ ersetzt (falsches Vorzeichen)', wrongFormula: '\\sinh^2 x = 1 - \\cosh^2 x' },
  { id: 'eq-tan-flipped', name: '$\\frac{\\cos x}{\\sin x}$ als $\\tan x$ geschrieben', wrongFormula: '\\frac{\\cos x}{\\sin x} = \\tan x' },
  { id: 'eq-divide-cos-partly', name: 'Nur einen Teil durch $\\cos x$ geteilt', wrongFormula: '\\frac{\\sin x + \\cos x}{\\sin x - \\cos x} = \\frac{\\tan x + 1}{\\sin x - \\cos x}' },
  // Substitution und pq-Formel (ab Stufe 4, Schritt 6c)
  { id: 'eq-substitute-power', name: 'Beim Substituieren die Potenz falsch übersetzt', wrongFormula: 'u = e^x: e^{2x} = 2u' },
  { id: 'eq-substitute-reciprocal', name: 'Beim Substituieren $e^{-x}$ als $-u$ geschrieben', wrongFormula: 'u = e^x: e^{-x} = -u' },
  { id: 'eq-pq-sign', name: 'Bei der $pq$-Formel das Vorzeichen von $p$ nicht gewechselt', wrongFormula: 'u^2 - 2yu - 1 = 0 \\Rightarrow u_{1,2} = -y \\pm \\sqrt{y^2 + 1}' },
  { id: 'eq-pq-q-sign', name: 'Bei der $pq$-Formel unter der Wurzel $+q$ statt $-q$', wrongFormula: 'u^2 - 2yu - 1 = 0 \\Rightarrow u_{1,2} = y \\pm \\sqrt{y^2 - 1}' },
  { id: 'eq-pq-half', name: 'Bei der $pq$-Formel unter der Wurzel $p^2$ statt $\\left(\\frac{p}{2}\\right)^2$', wrongFormula: 'u^2 - au - b = 0 \\Rightarrow u_{1,2} = \\frac{a}{2} \\pm \\sqrt{a^2 + b}' },
  { id: 'eq-spurious-root', name: 'Die Lösung genommen, die nicht passt (Scheinlösung)', wrongFormula: 'u = e^x: u = \\frac{a}{2} - \\sqrt{\\frac{a^2}{4} + b}' },
  { id: 'eq-not-resubstituted', name: 'Nach der Substitution nicht zurückgerechnet', wrongFormula: 'u = e^x = y + \\sqrt{y^2 + 1} \\Rightarrow x = y + \\sqrt{y^2 + 1}' },
  // Werkzeuge der Stufe 5 (Schritt 7a): Integrale; beim Ableiten die Fehler aus „Ableiten"
  { id: 'eq-partial-factor', name: 'Bei den Partialbrüchen den Faktor vergessen', wrongFormula: '\\frac{1}{t(t + b)} = \\frac{1}{t} - \\frac{1}{t + b}' },
  { id: 'eq-int-inner-factor', name: 'Beim Integrieren nicht durch die innere Ableitung geteilt', wrongFormula: '\\int \\frac{t}{t^2 + a^2}\\,\\mathrm{d}t = \\ln\\left(t^2 + a^2\\right)' },
  { id: 'eq-int-derived', name: 'Abgeleitet statt integriert', wrongFormula: '\\int e^{2t}\\,\\mathrm{d}t = 2e^{2t}' },
  { id: 'eq-int-power', name: 'Bei der Potenzregel nicht durch den neuen Exponenten geteilt', wrongFormula: '\\int t^2\\,\\mathrm{d}t = t^3' },
  { id: 'eq-int-sign', name: 'Beim Integrieren das Vorzeichen verloren', wrongFormula: '\\int \\sin t\\,\\mathrm{d}t = \\cos t' },
  { id: 'eq-int-bounds-swapped', name: 'Die Grenzen vertauscht', wrongFormula: '\\int_a^x f(t)\\,\\mathrm{d}t = F(a) - F(x)' },
  { id: 'eq-int-lower-forgotten', name: 'Die untere Grenze nicht eingesetzt', wrongFormula: '\\int_0^x e^{t}\\,\\mathrm{d}t = e^{x}' },
  // Werkzeuge der Stufe 5 (Schritt 7b): Summen, Reihen, Grenzwerte
  { id: 'eq-sum-count', name: 'Bei der geometrischen Summe die Anzahl der Summanden um eins verschoben', wrongFormula: '\\sum_{k=0}^{n-1} q^k = \\frac{q^{n+1} - 1}{q - 1}' },
  { id: 'eq-series-start', name: 'Nicht beachtet, mit welchem Summanden die Summe beginnt', wrongFormula: '\\sum_{k=1}^{\\infty} kx^k = \\frac{1}{(1 - x)^2}' },
  { id: 'eq-series-sign', name: 'Bei der geometrischen Reihe das Vorzeichen im Nenner vertauscht', wrongFormula: '\\sum_{k=0}^{\\infty} q^k = \\frac{1}{q - 1}' },
  { id: 'eq-series-not-geometric', name: 'Wie eine geometrische Reihe gerechnet, obwohl $k$ im Summanden steht', wrongFormula: '\\sum_{k=1}^{\\infty} kx^k = \\frac{x}{1 - x}' },
  { id: 'eq-lim-one', name: '„1 hoch unendlich ist 1" gerechnet', wrongFormula: '\\lim_{n \\to \\infty}\\left(1 + \\frac{x}{n}\\right)^n = 1' },
  { id: 'eq-lim-exponent', name: 'Beim Grenzwert den Faktor in der Hochzahl vergessen', wrongFormula: '\\lim_{n \\to \\infty}\\left(1 + \\frac{x}{n}\\right)^{2n} = e^{x}' },
  { id: 'eq-lim-denominator', name: 'Beim Grenzwert den Nenner nicht beachtet', wrongFormula: '\\lim_{n \\to \\infty}\\left(\\frac{n + x}{n - x}\\right)^n = e^{x}' },
  // Werkzeuge der Stufe 5 (Schritt 7c): Differentialgleichungen
  { id: 'eq-ode-initial-unused', name: 'Einen Anfangswert nicht genutzt', wrongFormula: "f'' = k^2 f,\\; f(0) = a,\\; f'(0) = 0: f(x) = ae^{kx}" },
  { id: 'eq-ode-not-halved', name: 'Bei $f\'\' = k^2 f$ die Konstanten nicht halbiert', wrongFormula: "f'' = k^2 f,\\; f(0) = a,\\; f'(0) = 0: f(x) = ae^{kx} + ae^{-kx}" },
  { id: 'eq-ode-inner-factor', name: 'Bei $f\'(0)$ den Faktor $k$ aus der Ableitung von $e^{kx}$ vergessen', wrongFormula: "f'' = k^2 f,\\; f(0) = 0,\\; f'(0) = b: f(x) = \\frac{b}{2}e^{kx} - \\frac{b}{2}e^{-kx}" },
  { id: 'eq-ode-oscillation', name: 'Mit der Schwingung $f\'\' = -k^2 f$ verwechselt', wrongFormula: "f'' = k^2 f,\\; f(0) = a,\\; f'(0) = 0: f(x) = a\\cos(kx)" },
  { id: 'eq-ode-root', name: 'Aus $\\lambda^2 = k^2$ die Wurzel nicht gezogen', wrongFormula: "f'' = 4f,\\; f(0) = a,\\; f'(0) = 0: f(x) = \\frac{a}{2}e^{4x} + \\frac{a}{2}e^{-4x}" },
  { id: 'eq-ode-constant-added', name: 'Die Konstante addiert statt malgenommen', wrongFormula: "f' = kf,\\; f(0) = a: f(x) = e^{kx} + a - 1" },
  { id: 'eq-ode-exp-sign', name: 'Das Vorzeichen in der Hochzahl vertauscht', wrongFormula: "f' = -kf,\\; f(0) = a: f(x) = ae^{kx}" },
  { id: 'eq-ode-constant-start', name: 'Beim Abkühlen die Konstante gleich dem Anfangswert gesetzt', wrongFormula: "f' = k(b - f),\\; f(0) = a: f(x) = b + ae^{-kx}" },
  // Werkzeuge der Stufe 5 (Schritt 8a): Determinanten
  { id: 'eq-det-plus', name: 'Bei der Determinante Plus statt Minus gerechnet', wrongFormula: '\\det\\begin{pmatrix} p & q \\\\ r & s \\end{pmatrix} = ps + qr' },
  { id: 'eq-det-swapped', name: 'Haupt- und Nebendiagonale vertauscht', wrongFormula: '\\det\\begin{pmatrix} p & q \\\\ r & s \\end{pmatrix} = qr - ps' },
  { id: 'eq-det-rows', name: 'In Zeilen oder Spalten statt über Kreuz malgenommen', wrongFormula: '\\det\\begin{pmatrix} p & q \\\\ r & s \\end{pmatrix} = pq - rs' },
  { id: 'eq-det-main', name: 'Nur die Hauptdiagonale malgenommen', wrongFormula: '\\det\\begin{pmatrix} p & q \\\\ r & s \\end{pmatrix} = ps' },
  { id: 'eq-det-checkerboard', name: 'Beim Entwickeln das Vorzeichen aus dem Schachbrett vertauscht', wrongFormula: '\\det\\begin{pmatrix} 0 & p & q \\\\ a & 1 & 2 \\\\ 0 & r & s \\end{pmatrix} = a\\det\\begin{pmatrix} p & q \\\\ r & s \\end{pmatrix}' },
  { id: 'eq-det-entry', name: 'Beim Entwickeln den Eintrag vor der Unterdeterminante vergessen', wrongFormula: '\\det\\begin{pmatrix} 0 & p & q \\\\ a & 1 & 2 \\\\ 0 & r & s \\end{pmatrix} = -\\det\\begin{pmatrix} p & q \\\\ r & s \\end{pmatrix}' },
]

export function rearrangeErrorRule(id: string): EqErrorRule {
  const found = REARRANGE_ERROR_RULES.find((r) => r.id === id) ?? FRACTION_ERROR_RULES.find((r) => r.id === id) ?? ERROR_RULES.find((r) => r.id === id)
  if (!found) throw new Error(`Unbekannte Fehlerregel: ${id}`)
  return found
}

export type RearrangeWrong = {
  readonly rule: EqErrorRule
  // Schritt, in dem der Fehler passiert
  readonly stepIndex: number
  // falsche Gleichung nach diesem Schritt
  readonly after: Equation
  // falsches Endergebnis (rechte Seite von „x = …"), wenn man damit richtig weiterrechnen kann
  readonly result: Expr | null
  // beim Ableiten (Stufe 5): der Fehler aus „Ableiten" mit seiner Stelle
  readonly derive?: WrongAnswer
}

// zeroForm: Gleichung der Form … = 0 auf dem Weg zur pq-Formel (die 0 ist dort richtig)
type Candidate = { readonly id: string; readonly after: Equation; readonly zeroForm?: boolean; readonly derive?: WrongAnswer }

// --- Hilfen ---

const termsOf = (e: Expr): readonly Expr[] => (e.kind === 'add' ? e.terms : [e])
const other = (side: Side): Side => (side === 'lhs' ? 'rhs' : 'lhs')
const withSide = (e: Equation, side: Side, value: Expr): Equation => (side === 'lhs' ? eq(value, e.rhs) : eq(e.lhs, value))

function isNegative(e: Expr): boolean {
  if (e.kind === 'neg') return true
  if (e.kind === 'num') return ratSign(e.value) < 0
  return e.kind === 'mul' && e.factors[0]?.kind === 'num' && ratSign(e.factors[0].value) < 0
}

const sum = (terms: readonly Expr[]): Expr => (terms.length === 1 ? terms[0] : add(...terms))

function reciprocalOf(e: Expr): Expr {
  if (e.kind === 'div') return e.num.kind === 'num' && isOne(e.num.value) ? e.den : div(e.den, e.num)
  return div({ kind: 'num', value: rat(1) }, e)
}

// Polynom beider Seiten in der Unbekannten (x bzw. √x)
function polys(e: Equation, atoms: Atoms): { l: Poly; r: Poly } | null {
  const l = toPoly(e.lhs, atoms)
  const r = toPoly(e.rhs, atoms)
  return l && r ? { l, r } : null
}

const hasAtom = (u: string) => (term: Poly[number]) => term.mono.some(([a]) => a === u)

// x, √x oder ein Baustein wie e^x
function unknownOf(e: Equation, t: string): { atoms: Atoms; u: string } {
  const { atoms, u } = unknownAtoms(e, t)
  return { atoms, u }
}

// Mit einer Wurzel wie √(x − a) als eigenem Zeichen (zwei Wurzeln: nach dem ersten Quadrieren)
function radicalOf(e: Equation, t: string): Atoms | null {
  const r = complexRoot(e, t)
  return r && radicalAtoms(t, r)
}

// --- Fehler je Schritt ---

function signNotFlipped(step: RearrangeStep, t: string): Candidate[] {
  const { before, side, operand } = step
  if (step.kind === 'add' && side && operand) {
    const o = before[other(side)]
    return [{ id: 'eq-sign-not-flipped', after: withSide(step.after, other(side), plusTerm(o, negated(operand))) }]
  }
  if (step.kind === 'move' && side && operand) {
    const s = before[side]
    const o = before[other(side)]
    const rest = termsOf(s).filter((x) => !contains(x, t))
    const wrong = sum([...rest, ...termsOf(o)])
    return [{ id: 'eq-sign-not-flipped', after: side === 'rhs' ? eq(operand, wrong) : eq(wrong, operand) }]
  }
  if (step.kind === 'collect') {
    // Summanden, die die Seite wechseln, behalten ihr Vorzeichen
    const radical = step.operand ? radicalOf(before, t) : null
    const { atoms, u } = radical ? { atoms: radical, u: RADICAL_ATOM } : unknownOf(before, t)
    const p = polys(before, atoms)
    if (!p) return []
    const not = (term: Poly[number]) => !hasAtom(u)(term)
    const left = polyAdd(p.l.filter(hasAtom(u)), p.r.filter(hasAtom(u)))
    const right = polyAdd(p.l.filter(not), p.r.filter(not))
    return [{ id: 'eq-sign-not-flipped', after: eq(polyToExpr(left, atoms), polyToExpr(right, atoms)) }]
  }
  return []
}

function divideMistakes(step: RearrangeStep): Candidate[] {
  const { before, side, operand } = step
  if (!side || !operand) return []
  const o = before[other(side)]
  const tPart = step.after[side]
  const out: Candidate[] = []
  if (step.kind === 'divide') {
    out.push({ id: 'eq-inverse-op', after: withSide(step.after, other(side), timesFactor(o, operand)) })
    if (o.kind === 'add') {
      const [first, ...rest] = o.terms
      out.push({ id: 'eq-divide-one-term', after: withSide(step.after, other(side), add(dividedBy(first, operand), ...rest)) })
    }
    if (tPart.kind === 'var') out.push({ id: 'eq-fraction-flipped', after: withSide(step.after, other(side), reciprocalOf(step.after[other(side)])) })
  }
  if (step.kind === 'multiply') {
    out.push({ id: 'eq-inverse-op', after: withSide(step.after, other(side), dividedBy(o, operand)) })
    // nur den ersten Summanden der anderen Seite malgenommen: \frac{x}{a} = c - b → x = ac - b
    if (o.kind === 'add') {
      const [first, ...rest] = o.terms
      out.push({ id: 'eq-multiply-one-term', after: withSide(step.after, other(side), add(timesFactor(first, operand), ...rest)) })
    }
  }
  return out
}

// Mit dem Hauptnenner malgenommen, aber einen Summanden ohne Bruch vergessen:
// \frac{x + a}{2} - \frac{x - b}{3} = c → 3(x + a) - 2(x - b) = c
function multiplyNotAll(step: RearrangeStep): Candidate[] {
  if (step.kind !== 'multiply' || step.side) return []
  for (const side of ['lhs', 'rhs'] as const) {
    const before = termsOf(step.before[side])
    const after = termsOf(step.after[side])
    if (before.length !== after.length) continue
    const plain = (x: Expr) => !subterms(isNegative(x) ? negated(x) : x).some((s) => s.kind === 'div')
    const i = before.findIndex((x) => plain(x) && !(x.kind === 'num' && x.value.n === 0n))
    if (i < 0 || key(before[i]) === key(after[i])) continue
    const wrong = sum(after.map((x, j) => (j === i ? before[i] : x)))
    return [{ id: 'eq-multiply-one-term', after: withSide(step.after, side, wrong) }]
  }
  return []
}

// w · (d₁ + d₂) als w·d₁ + d₂
function bracketForgotten(w: Expr, d: Poly, atoms: Atoms): Expr | null {
  const wp = toPoly(w, atoms)
  if (!wp || w.kind === 'add' || w.kind === 'div' || d.length < 2) return null
  const [first, ...rest] = d
  return polyToExpr(polyAdd(polyMul(wp, [first]), rest), atoms)
}

function denominatorBracket(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'multiply' || !step.operand || step.operand.kind !== 'add') return []
  const atoms = newAtoms(t)
  const d = toPoly(step.operand, atoms)
  if (!d) return []
  const sides: Side[] = step.side ? [other(step.side)] : ['lhs', 'rhs']
  for (const side of sides) {
    const wrong = bracketForgotten(step.before[side], d, atoms)
    if (wrong) return [{ id: 'eq-denominator-bracket', after: withSide(step.after, side, wrong) }]
  }
  return []
}

// −c · (d₁ + d₂ + …) als Summand: c·d₁ und c·(d₂ + …), sonst null
function minusBracketParts(term: Expr, atoms: Atoms): { first: Poly; rest: Poly } | null {
  let inner: Expr
  if (term.kind === 'neg') inner = term.arg
  else if (term.kind === 'mul' && isNegative(term)) inner = negated(term)
  else return null
  const factors = inner.kind === 'mul' ? inner.factors : [inner]
  const brackets = factors.filter((f) => f.kind === 'add')
  if (brackets.length !== 1) return null
  const bracket = brackets[0] as Extract<Expr, { kind: 'add' }>
  const c = toPoly(mul(...factors.filter((f) => f !== bracket).concat(factors.length === 1 ? [{ kind: 'num', value: rat(1) }] : [])), atoms)
  const [first, ...rest] = bracket.terms
  const fp = toPoly(first, atoms)
  const rp = toPoly(sum(rest), atoms)
  if (!c || !fp || !rp || rest.length === 0) return null
  return { first: polyMul(c, fp), rest: polyMul(c, rp) }
}

// Klammern ausmultiplizieren: nur den ersten Summanden malgenommen, Mittelglied vergessen
function expandMistakes(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'expand') return []
  const atoms = radicalOf(step.before, t) ?? unknownOf(step.before, t).atoms
  const out: Candidate[] = []
  for (const side of ['lhs', 'rhs'] as const) {
    const terms = termsOf(step.before[side])
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i]
      const others = terms.filter((_, j) => j !== i)
      const restPoly = others.length ? toPoly(sum(others), atoms) : polyConst(0)
      if (!restPoly) continue
      let wrong: Poly | null = null
      let id = ''
      // −c(x − d) als −cx − cd: das Minus nur beim ersten Summanden der Klammer
      const minusBracket = minusBracketParts(term, atoms)
      if (minusBracket) {
        wrong = polyAdd(polyScale(minusBracket.first, rat(-1)), minusBracket.rest)
        id = 'eq-minus-bracket'
      } else if (term.kind === 'mul' && term.factors.filter((f) => f.kind === 'add').length === 1) {
        const bracket = term.factors.find((f) => f.kind === 'add')!
        const c = toPoly(mul(...term.factors.filter((f) => f !== bracket)), atoms)
        const b = toPoly(bracket, atoms)
        if (c && b && b.length >= 2) {
          const [first, ...rest] = (bracket as Extract<Expr, { kind: 'add' }>).terms
          const fp = toPoly(first, atoms)
          const rp = toPoly(sum(rest), atoms)
          if (fp && rp) {
            wrong = polyAdd(polyMul(c, fp), rp)
            id = 'eq-bracket-first-term'
          }
        }
      }
      if (term.kind === 'pow' && term.base.kind === 'add' && term.base.terms.length === 2 && key(term.exp) === key({ kind: 'num', value: rat(2) })) {
        // (y - \sqrt{x - a})^2 = y^2 + x - a: über toPoly, damit (\sqrt{x - a})^2 zu x - a wird
        const [a, b] = term.base.terms
        const squares = toPoly(add(pow(a, num(2)), pow(b, num(2))), atoms)
        if (squares) {
          wrong = squares
          id = 'eq-square-middle'
        }
      }
      if (wrong) {
        const otherSide = toPoly(step.before[other(side)], atoms)
        if (!otherSide) continue
        const wrongSide = polyToExpr(polyAdd(wrong, restPoly), atoms)
        // je Klammer ein Fehler (z. B. bei a(x − b) − c(x + d) beide)
        out.push({ id, after: side === 'lhs' ? eq(wrongSide, polyToExpr(otherSide, atoms)) : eq(polyToExpr(otherSide, atoms), wrongSide) })
      }
    }
  }
  return out
}

function factorOneLost(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'factor') return []
  const { atoms, u } = unknownOf(step.before, t)
  const l = toPoly(step.before.lhs, atoms)
  const coefficient = l && polyDivideExact(l, polyAtom(u))
  if (!coefficient) return []
  const one = coefficient.find((term) => term.mono.length === 0 && isOne(ratAbs(term.coef)))
  if (!one || coefficient.length < 2) return []
  const wrong = polyMul(coefficient.filter((term) => term !== one), polyAtom(u))
  return [{ id: 'eq-factor-one-lost', after: eq(polyToExpr(wrong, atoms), step.before.rhs) }]
}

// ax − bx = c → x(a + b) = c: die Minus in der Klammer verloren
function factorSign(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'factor') return []
  const { atoms, u } = unknownOf(step.before, t)
  const l = toPoly(step.before.lhs, atoms)
  const coefficient = l && polyDivideExact(l, polyAtom(u))
  if (!coefficient || coefficient.length < 2 || !coefficient.some((term) => ratSign(term.coef) < 0)) return []
  const wrong = coefficient.map((term) => ({ ...term, coef: ratAbs(term.coef) }))
  return [{ id: 'eq-factor-sign', after: eq(factoredOut(unknownAtoms(step.before, t).uExpr, polyToExpr(wrong, atoms)), step.before.rhs) }]
}

function reciprocalTermwise(step: RearrangeStep, previous: RearrangeStep | undefined): Candidate[] {
  if (step.kind !== 'reciprocal' || !step.side || previous?.kind !== 'combine') return []
  const o = previous.before[other(step.side)]
  if (o.kind !== 'add') return []
  const termwise = sum(o.terms.map((x) => (isNegative(x) ? negated(reciprocalOf(negated(x))) : reciprocalOf(x))))
  return [{ id: 'eq-reciprocal-termwise', after: withSide(step.after, other(step.side), termwise) }]
}

// Wurzel aus einem Monom oder einem Bruch aus Monomen: \frac{y^2}{a^2} → \frac{y}{a}
function termRoot(e: Expr, atoms: Atoms): Expr | null {
  const f = toRat(e, atoms)
  const n = f && monomialSqrt(f.num)
  const d = f && monomialSqrt(f.den)
  return n && d ? niceFrac({ num: n, den: d }, atoms) : null
}

function rootTermwise(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'root' || !step.side) return []
  const o = step.before[other(step.side)]
  if (o.kind !== 'add') return []
  const atoms = newAtoms(t)
  const roots = o.terms.map((x) => {
    const r = termRoot(isNegative(x) ? negated(x) : x, atoms)
    return r && (isNegative(x) ? negated(r) : r)
  })
  if (roots.some((r) => r === null)) return []
  return [{ id: 'eq-root-termwise', after: withSide(step.after, other(step.side), sum(roots as Expr[])) }]
}

// x^2 = c → x = \frac{c}{2}: halbiert statt die Wurzel gezogen
function squareHalved(step: RearrangeStep): Candidate[] {
  const k = step.operand
  if (step.kind !== 'root' || !step.side || k?.kind !== 'num' || k.value.n !== 2n || k.value.d !== 1n) return []
  const o = step.before[other(step.side)]
  return [{ id: 'eq-square-halved', after: withSide(step.after, other(step.side), dividedBy(o, num(2))) }]
}

function squareOneFactor(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'square' || !step.side) return []
  const o = step.before[other(step.side)]
  let wrong: Expr | null = null
  if (o.kind === 'div' && !contains(o, t)) wrong = div(squared(o.num), o.den)
  if (o.kind === 'mul' && o.factors[0].kind === 'num' && o.factors.length >= 2) wrong = mul(o.factors[0], squared(mul(...o.factors.slice(1))))
  return wrong ? [{ id: 'eq-square-one-factor', after: withSide(step.after, other(step.side), wrong) }] : []
}

// y = \sqrt{a + \sqrt{b + \sqrt{x}}} → y^2 = a + b + \sqrt{x}: die innere Wurzel gleich mit weggelassen
function nestedRoot(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'square' || !step.side) return []
  const s = step.after[step.side]
  if (s.kind !== 'add') return []
  const i = s.terms.findIndex((x) => x.kind === 'root' && x.index === 2 && contains(x, t))
  if (i < 0) return []
  const inner = (s.terms[i] as Extract<Expr, { kind: 'root' }>).arg
  const wrong = sum(s.terms.flatMap((x, j) => (j === i ? termsOf(inner) : [x])))
  return [{ id: 'eq-nested-root', after: withSide(step.after, step.side, wrong) }]
}

// e hoch beide Seiten und logarithmieren: Gegenrechnung nur auf einer Seite, gliedweise, Minus vergessen
function expLogMistakes(step: RearrangeStep): Candidate[] {
  const { before, side } = step
  const out: Candidate[] = []
  if (step.kind === 'exp' && side && step.operand) {
    const base = step.operand
    const o = before[other(side)]
    out.push({ id: 'eq-exp-forgotten', after: withSide(step.after, other(side), o) })
    if (o.kind === 'add') {
      const powers = o.terms.map((x) => (isNegative(x) ? negated(powerOf(base, negated(x))) : powerOf(base, x)))
      out.push({ id: 'eq-exp-of-sum', after: withSide(step.after, other(side), sum(powers)) })
    }
  }
  if (step.kind === 'log' && side) {
    const o = before[other(side)]
    const tPart = step.after[side]
    out.push({ id: 'eq-ln-forgotten', after: withSide(step.after, other(side), o) })
    if (isNegative(tPart)) out.push({ id: 'eq-exp-minus-lost', after: withSide(step.after, side, negated(tPart)) })
    if (o.kind === 'add') {
      const lns = o.terms.map((x) => (isNegative(x) ? negated(lnOf(negated(x))) : lnOf(x)))
      out.push({ id: 'eq-ln-of-sum', after: withSide(step.after, other(side), sum(lns)) })
    }
  }
  return out
}

// Logarithmusgesetze: \ln(u \cdot v) = \ln u \cdot \ln v, \ln\frac{u}{v} = \frac{\ln u}{\ln v}, \ln\left(a^x\right) = x
function logLawMistakes(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'logLaw') return []
  const out: Candidate[] = []
  for (const sd of ['lhs', 'rhs'] as const) {
    const s = step.before[sd]
    if (s.kind !== 'fn' || s.name !== 'ln' || !contains(s, t)) continue
    const arg = s.arg
    const terms = lnTerms(arg, t)
    if (arg.kind === 'mul' && terms && terms.length >= 2) out.push({ id: 'eq-log-product', after: withSide(step.after, sd, mul(...terms)) })
    if (arg.kind === 'div') {
      const n = lnTerms(arg.num, t)
      const d = lnTerms(arg.den, t)
      if (n && d && n.length > 0 && d.length > 0) out.push({ id: 'eq-log-quotient', after: withSide(step.after, sd, div(sum(n), sum(d))) })
    }
    const forgotten = lnTerms(arg, t, true)
    if (forgotten && subterms(arg).some((x) => x.kind === 'pow' && contains(x.exp, t) && !isE(x.base))) {
      out.push({ id: 'eq-log-base-forgotten', after: withSide(step.after, sd, sum(forgotten.length > 0 ? forgotten.flatMap(termsOf) : [num(0)])) })
    }
  }
  return out
}

// kx = \ln w → x = \ln\frac{w}{k}: nur im \ln geteilt
function divideInsideLn(step: RearrangeStep): Candidate[] {
  if (step.kind !== 'divide' || !step.side || !step.operand) return []
  const o = step.before[other(step.side)]
  const inner = o.kind === 'neg' ? o.arg : o
  if (inner.kind !== 'fn' || inner.name !== 'ln') return []
  const wrong = fn('ln', dividedBy(inner.arg, step.operand))
  return [{ id: 'eq-divide-inside-ln', after: withSide(step.after, other(step.side), o.kind === 'neg' ? negated(wrong) : wrong) }]
}

// Logarithmen zusammenfassen: \ln u + \ln v = \ln(u + v), \ln u - \ln v = \frac{\ln u}{\ln v}
function logCombineMistakes(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'logCombine' || !step.side || !step.operand) return []
  const base = step.operand
  const s = step.before[step.side]
  if (s.kind !== 'add') return []
  const parsed = s.terms.map((x) => signedLog(x, t))
  const ups = parsed.filter((p) => p !== null && p.sign > 0).map((p) => p!.arg)
  const downs = parsed.filter((p) => p !== null && p.sign < 0).map((p) => p!.arg)
  const logOf = (arg: Expr) => (isE(base) ? fn('ln', arg) : log(base, arg))
  const product = (xs: Expr[]) => (xs.length === 1 ? xs[0] : mul(...xs))
  const first = parsed.findIndex((p) => p !== null)
  const rebuild = (combined: Expr) => sum(s.terms.flatMap((x, i) => (i === first ? [combined] : parsed[i] ? [] : [x])))
  const out: Candidate[] = []
  if (downs.length === 0 && ups.length >= 2) {
    const atoms = newAtoms(t)
    const p = toPoly(add(...ups), atoms)
    out.push({ id: 'eq-log-sum', after: withSide(step.after, step.side, rebuild(logOf(p ? polyToExpr(p, atoms) : add(...ups)))) })
  }
  if (downs.length > 0 && ups.length > 0) {
    out.push({ id: 'eq-log-quotient', after: withSide(step.after, step.side, rebuild(div(logOf(product(ups)), logOf(product(downs))))) })
  }
  return out
}

// 2^{x + 1} als 2^x + 2
function powerSum(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'powerLaw') return []
  const wrong = powerLawSum(step.before, t)
  return wrong ? [{ id: 'eq-power-sum', after: wrong }] : []
}

// Umkehrfunktionen: auf der anderen Seite vergessen (\sin u = w → u = w), \arcsin mit
// \frac{1}{\sin} verwechselt (\tan x = w → x = \frac{1}{\tan w})
function inverseMistakes(step: RearrangeStep): Candidate[] {
  const { before, side } = step
  if ((step.kind !== 'arc' && step.kind !== 'trig') || !side || !step.fn) return []
  const o = before[other(side)]
  const out: Candidate[] = [{ id: 'eq-inverse-forgotten', after: withSide(step.after, other(side), o) }]
  const original = TRIG_OF[step.fn]
  if (step.kind === 'arc' && original) out.push({ id: 'eq-inverse-reciprocal', after: withSide(step.after, other(side), div(num(1), fn(original, o))) })
  return out
}

// kx = \arcsin w → x = \arcsin\frac{w}{k}: nur in der Umkehrfunktion geteilt
function divideInsideArc(step: RearrangeStep): Candidate[] {
  if (step.kind !== 'divide' || !step.side || !step.operand) return []
  const o = step.before[other(step.side)]
  const inner = o.kind === 'neg' ? o.arg : o
  if (inner.kind !== 'fn' || !TRIG_OF[inner.name]) return []
  const wrong = fn(inner.name, dividedBy(inner.arg, step.operand))
  return [{ id: 'eq-divide-inside-arc', after: withSide(step.after, other(step.side), o.kind === 'neg' ? negated(wrong) : wrong) }]
}

// \sin^2 x + \cos^2 x = 1: Quadrat vergessen (\sin^2 x = 1 - \cos x); bei \sinh und \cosh auch das
// Vorzeichen wie bei \sin und \cos (\sinh^2 x = 1 - \cosh^2 x)
function pythagorasMistakes(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'pythagoras' || step.operand?.kind !== 'pow' || step.operand.base.kind !== 'fn') return []
  const hyperbolic = step.operand.base.name === 'sinh' || step.operand.base.name === 'cosh'
  const out: Candidate[] = []
  const square = pythagorasWrong(step.before, t, 'square')
  if (square) out.push({ id: 'eq-pythagoras-square', after: square })
  const sign = hyperbolic ? pythagorasWrong(step.before, t, 'sign') : null
  if (sign) out.push({ id: 'eq-hyperbolic-sign', after: sign })
  return out
}

// Durch \cos x teilen: durch \sin x geteilt und \tan x statt \cot x geschrieben, nur einen Teil geteilt
function tanQuotientMistakes(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'tanQuotient') return []
  const out: Candidate[] = []
  const flipped = tanQuotientWrong(step.before, t, 'flipped')
  if (flipped) out.push({ id: 'eq-tan-flipped', after: flipped })
  const partly = tanQuotientWrong(step.before, t, 'partly')
  if (partly) out.push({ id: 'eq-divide-cos-partly', after: partly })
  return out
}

// Substituieren: e^{2x} = 2u statt u^2, e^{-x} = -u statt \frac{1}{u}
function substituteMistakes(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'substitute') return []
  const out: Candidate[] = []
  const power = substituteWrong(step.before, t, 'power')
  if (power) out.push({ id: 'eq-substitute-power', after: power })
  const reciprocal = substituteWrong(step.before, t, 'reciprocal')
  if (reciprocal) out.push({ id: 'eq-substitute-reciprocal', after: reciprocal })
  return out
}

// Auf die Normalform bringen: Vorzeichen nicht gewechselt, nur u^2 geteilt
function quadraticMistakes(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'zero' && step.kind !== 'normalize') return []
  const wrong = quadraticWrong(step, t)
  return wrong ? [{ id: step.kind === 'zero' ? 'eq-sign-not-flipped' : 'eq-divide-one-term', after: wrong, zeroForm: true }] : []
}

// pq-Formel: Vorzeichen von p, -q, \left(\frac{p}{2}\right)^2; die falsche Lösung gewählt; nicht zurückgerechnet
function pqMistakes(step: RearrangeStep, t: string): Candidate[] {
  const out: Candidate[] = []
  if (step.kind === 'pq') {
    for (const [mistake, id] of [
      ['sign', 'eq-pq-sign'],
      ['q', 'eq-pq-q-sign'],
      ['half', 'eq-pq-half'],
    ] as const) {
      const wrong = pqWrong(step, mistake)
      if (wrong) out.push({ id, after: wrong })
    }
  }
  if (step.kind === 'choose' && step.operand) out.push({ id: 'eq-spurious-root', after: eq(step.after.lhs, step.operand) })
  if (step.kind === 'resubstitute' && step.substitution) {
    const value = key(step.after.lhs) === key(step.substitution.expr) ? step.after.rhs : step.after.lhs
    out.push({ id: 'eq-not-resubstituted', after: eq(variable(t), value) })
  }
  return out
}

// Zusammenfassen zu einem Bruch (auch im Ergebnis-Schritt): Fehler aus „Brüche"
function fractionMistakes(step: RearrangeStep, t: string): Candidate[] {
  if (step.kind !== 'combine' && step.kind !== 'finish') return []
  const tSide: Side = step.side ?? (contains(step.before.lhs, t) ? 'lhs' : 'rhs')
  const o = step.before[other(tSide)]
  const positive = (x: Expr) => (isNegative(x) ? negated(x) : x)
  if (o.kind !== 'add' || contains(o, t) || !o.terms.some((x) => positive(x).kind === 'div')) return []
  const atoms = newAtoms(t)
  const terms: Signed[] = []
  for (const x of o.terms) {
    const y = positive(x)
    const n = toPoly(y.kind === 'div' ? y.num : y, atoms)
    const d = y.kind === 'div' ? toPoly(y.den, atoms) : polyConst(1)
    if (!n || !d) return []
    const p = part(expanded(n), expanded(d))
    terms.push(isNegative(x) ? minus(p) : plus(p))
  }
  let wrongs
  try {
    wrongs = fractionWrongAnswers({ kind: 'sum', terms, hints: [] })
  } catch {
    return []
  }
  return wrongs
    .filter((w) => w.value && !w.freeOnly && (w.step === 'combine' || w.step === 'expand'))
    .map((w) => {
      const wrongSide = niceFrac(w.value!, atoms)
      return { id: w.rule.id, after: step.kind === 'finish' ? eq(variable(t), wrongSide) : withSide(step.after, other(tSide), wrongSide) }
    })
}

function candidatesFor(steps: readonly RearrangeStep[], i: number, target: string): Candidate[] {
  const step = steps[i]
  // nach dem Substituieren wird nach u aufgelöst
  const t = step.unknown ?? target
  return [
    ...signNotFlipped(step, t),
    ...divideMistakes(step),
    ...multiplyNotAll(step),
    ...denominatorBracket(step, t),
    ...expandMistakes(step, t),
    ...factorOneLost(step, t),
    ...factorSign(step, t),
    ...reciprocalTermwise(step, steps[i - 1]),
    ...rootTermwise(step, t),
    ...squareHalved(step),
    ...squareOneFactor(step, t),
    ...nestedRoot(step, t),
    ...expLogMistakes(step),
    ...logLawMistakes(step, t),
    ...divideInsideLn(step),
    ...logCombineMistakes(step, t),
    ...powerSum(step, t),
    ...inverseMistakes(step),
    ...divideInsideArc(step),
    ...pythagorasMistakes(step, t),
    ...tanQuotientMistakes(step, t),
    ...substituteMistakes(step, t),
    ...quadraticMistakes(step, t),
    ...pqMistakes(step, target),
    ...fractionMistakes(step, t),
    // ohne die Variable wäre es keine Gleichung mehr zum Umstellen (\frac{\mathrm{d}}{\mathrm{d}x}(…) falsch als 1);
    // nur beim Grenzwert ist gerade das der typische Fehler („1 hoch unendlich ist 1")
    ...(TOOL_STEPS.has(step.kind)
      ? toolMistakes(step.kind as ToolStepKind, step.before).filter((c) => step.kind === 'limit' || contains(c.after.lhs, t) || contains(c.after.rhs, t))
      : []),
  ]
}

// --- Alle falschen Antworten einer Aufgabe ---

export function rearrangeWrongAnswers(task: RearrangeTask, solution: RearrangeSolution): RearrangeWrong[] {
  const t = task.target
  const sub = solution.substitution
  const points = withSubstitution(samplePoints(task, solution.result, createRng(`umstellen:${equationToLatex(task.equation)}`), 24, solution.requires), sub)
  const options = { conditions: task.conditions, ...(sub ? { substitution: sub } : {}) }
  // weitergerechnet mit der Substitution nur, wo u schon dasteht; ein Fehler davor (z. B. beim Lösen einer
  // Differentialgleichung) steht noch in x und wird mit eigener Substitution gelöst
  const optionsFor = (e: Equation) => (sub && (contains(e.lhs, sub.name) || contains(e.rhs, sub.name)) ? options : { conditions: task.conditions })
  const out: RearrangeWrong[] = []
  solution.steps.forEach((step, i) => {
    for (const c of candidatesFor(solution.steps, i, t)) {
      // keine Gleichung ohne Lösung (z. B. \frac{1}{a} = 0) und keine, die doch stimmt
      if ((!c.zeroForm && isZeroSide(c.after, step.unknown ?? t)) || !clearlyFails(c.after, points)) continue
      const latex = equationToLatex(c.after)
      if (out.some((w) => w.stepIndex === i && equationToLatex(w.after) === latex)) continue
      out.push({ rule: rearrangeErrorRule(c.id), stepIndex: i, after: c.after, result: wrongResult(c.after, t, points, optionsFor(c.after)), ...(c.derive ? { derive: c.derive } : {}) })
    }
  })
  return out
}

const isZeroSide = (e: Equation, t: string) =>
  [e.lhs, e.rhs].some((side) => !contains(side, t) && side.kind === 'num' && side.value.n === 0n)

// Mit der falschen Gleichung richtig weitergerechnet; null, wenn das nicht geht, das Ergebnis an den
// Prüfstellen nicht definiert ist oder doch das richtige Ergebnis herauskommt
function wrongResult(after: Equation, t: string, points: Parameters<typeof differsFromTarget>[2], options: SolveOptions): Expr | null {
  const continued = solveEquation(after, t, options)
  if (!continued || contains(continued.result, t)) return null
  const defined = points.filter((p) => !Number.isNaN(evaluate(continued.result, p))).length
  if (defined < points.length / 2) return null
  return differsFromTarget(continued.result, t, points) ? continued.result : null
}
