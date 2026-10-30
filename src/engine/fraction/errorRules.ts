import { toLatex } from '../expr/print.ts'
import { type Expr, div, mulDot, num } from '../expr/types.ts'
import { isInteger, isOne, rat, ratAbs, ratDiv, ratMul } from '../rational.ts'
import { type Factored, factorize, factoredExpr, factoredPoly, isMultipleOf, reduceFrac } from './factor.ts'
import { type Frac, fracDiv, fracEquals, fracMul, fracNeg } from './frac.ts'
import {
  type Poly,
  type Term,
  constValue,
  isZeroPoly,
  monoDivide,
  monomial,
  polyAdd,
  polyContent,
  polyConst,
  polyDivideExact,
  polyEquals,
  polyMul,
  polyNeg,
  polyScale,
  polySub,
  polySum,
  totalDegree,
} from './poly.ts'
import {
  type FracSolution,
  type StepKind,
  type SumWork,
  applyRule,
  cancelledFactor,
  expandedDenExpr,
  fractionExpr,
  innerResultPart,
  multipliedExpr,
  nicePolyExpr,
  productExpr,
  reciprocalPart,
  resultExpr,
  ruleExpr,
  ruledTop,
  sideOf,
  signedSum,
  solveFraction,
  timesExpr,
  workSum,
} from './solve.ts'
import {
  type BlockRule,
  type FractionTask,
  type Part,
  type Shown,
  expanded,
  innerTask,
  isWhole,
  partExpr,
  partFrac,
  partsOf,
  replaceInner,
  shownExpr,
  shownPoly,
  signedFrac,
  taskFrac,
} from './task.ts'

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
  { id: 'frac-complex-times-denominator', step: 'reciprocal', name: 'Mit dem Nenner statt mit seinem Kehrwert malgenommen', wrongFormula: '\\frac{\\frac{1}{2}}{\\frac{3}{4}} = \\frac{1}{2} \\cdot \\frac{3}{4}' },
  { id: 'frac-complex-number-up', step: 'reciprocal', name: 'Den unteren Term in den Zähler statt in den Nenner geschrieben', wrongFormula: '\\frac{\\frac{a}{b}}{x} = \\frac{ax}{b}' },
  { id: 'frac-cancel-one-summand', step: 'cancel', name: 'Nur einen Summanden gekürzt', wrongFormula: '\\frac{2x + 6}{2} = x + 6' },
  { id: 'frac-cancel-in-sum', step: 'cancel', name: 'Aus einer Summe gekürzt', wrongFormula: '\\frac{x^2 + 1}{x} = x + 1' },
  { id: 'frac-cancel-forgot-one', step: 'cancel', name: 'Beim Kürzen die $1$ im Zähler vergessen', wrongFormula: '\\frac{x + 1}{(x + 1)(x - 2)} = x - 2' },
  { id: 'frac-cancel-sign', step: 'cancel', name: 'Vorzeichen bei vertauschter Differenz vergessen', wrongFormula: '\\frac{x - 1}{1 - x} = 1' },
  { id: 'frac-power-reversed', step: 'cancel', name: 'Hochzahlen falsch herum abgezogen', wrongFormula: '\\frac{x^2}{x^5} = x^3' },
  { id: 'frac-power-divided', step: 'cancel', name: 'Hochzahlen geteilt statt abgezogen', wrongFormula: '\\frac{x^6}{x^2} = x^3' },
  { id: 'frac-factor-wrong', step: 'factor-num', name: 'Falsch ausgeklammert', wrongFormula: '2x + 6 = 2(x + 6)' },
  { id: 'frac-binomial-confused', step: 'factor-num', name: 'Binomische Formeln verwechselt', wrongFormula: 'x^2 - 9 = (x - 3)^2' },
  { id: 'frac-vieta-sign', step: 'factor-num', name: 'Vorzeichen beim Zerlegen vertauscht', wrongFormula: 'x^2 - x - 6 = (x + 3)(x - 2)' },
  { id: 'frac-cancel-one-side', step: 'cancel', name: 'Nur den Zähler oder nur den Nenner gekürzt', wrongFormula: '\\frac{14}{12} = \\frac{7}{12}' },
  { id: 'frac-multiply-reciprocal', step: 'multiply', name: 'Beim Malnehmen den Kehrwert genommen', wrongFormula: '\\frac{3}{4} \\cdot \\frac{2}{5} = \\frac{3 \\cdot 5}{4 \\cdot 2}' },
  { id: 'frac-square-forgotten', step: 'identity', name: 'Quadrat vergessen', wrongFormula: '1 - \\cos^2 x = \\sin x' },
  { id: 'frac-binomial-middle', step: 'multiply-out', name: 'Beim Quadrieren das Mittelglied vergessen', wrongFormula: '(\\sqrt{x} + 1)^2 = x + 1' },
  { id: 'frac-cancel-inside', step: 'cancel', name: 'Im Inneren einer Funktion gekürzt', wrongFormula: '\\frac{e^{2x}}{e^x} = e^2' },
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

// Wert nach der Regel des Bausteins (wie im Rechenweg): sin² x + cos² x = 1 im Zähler bzw. Nenner
export function ruledFrac(value: Frac, rule: BlockRule | undefined): Frac {
  if (rule?.kind !== 'trig') return value
  return rule.target === 'num' ? { num: applyRule(value.num, rule), den: value.den } : { num: value.num, den: applyRule(value.den, rule) }
}

// Falsches Ergebnis so geschrieben wie das richtige: gekürzt, mit der Regel des Bausteins
function resultOf(value: Frac, t: FractionTask): Expr {
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
  const linear = f.factors.filter((g) => g.poly.length === 2 && totalDegree(g.poly) === 1 && constValue([g.poly[1]]) !== null)
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

  // (x + a)(x + b) mit vertauschten Vorzeichen: (x − a)(x − b)
  if (!negative && linear.length === 2 && linear.every((g) => g.exp === 1)) {
    const factors = f.factors.map((g) => (linear.includes(g) ? { poly: mirror(g.poly), exp: 1 } : g))
    out.push({ id: 'frac-vieta-sign', ...asFactored(factors) })
  }
  return out
}

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

// (u + v)² als u² + v²: \frac{(x + h)^2 - x^2}{h} = \frac{h^2}{h}
function multiplyOutMistakes(t: FractionTask): Candidate[] {
  if (t.kind !== 'reduce' || t.part.num.form !== 'binomial' || t.part.num.base.length !== 2) return []
  const { base, minus } = t.part.num
  const squares = polySum(base.map((term) => polyMul([term], [term])))
  const n = polySub(squares, minus)
  if (isZeroPoly(n)) return []
  return [{ id: 'frac-binomial-middle', stepExpr: div(nicePolyExpr(n), shownExpr(t.part.den)), value: { num: n, den: shownPoly(t.part.den) } }]
}

// Quadrat des Bausteins vergessen: sin² x → sin x, (√x)² → √x
function dropSquare(p: Poly, atom: string): Poly | null {
  if (!p.some((term) => (term.mono.find(([a]) => a === atom)?.[1] ?? 0) >= 2)) return null
  return polySum(p.map((term) => [{ mono: monomial(term.mono.map(([a, e]) => [a, a === atom && e >= 2 ? e - 1 : e] as const)), coef: term.coef }]))
}

function ruleMistakes(t: FractionTask, solution: FracSolution): Candidate[] {
  const rule = t.rule
  const step = solution.steps.find((s) => s.kind === 'identity')
  if (!rule || !step) return []
  const atom = rule.kind === 'root' ? 'R' : rule.prefer
  if (t.kind === 'sum') {
    const w = workSum(t.terms, t.hints)
    const lcdPoly = factoredPoly(w.lcd)
    if (rule.kind === 'root') {
      const den = dropSquare(lcdPoly, atom)
      return den ? [{ id: 'frac-square-forgotten', stepExpr: expandedDenExpr(w.numerator, den), value: { num: w.numerator, den } }] : []
    }
    if (rule.target === 'num') {
      const n = dropSquare(applyRule(w.numerator, rule), atom)
      return n ? [{ id: 'frac-square-forgotten', stepExpr: fractionExpr(n, w.lcd), value: { num: n, den: lcdPoly } }] : []
    }
    const den = dropSquare(applyRule(lcdPoly, rule), atom)
    return den ? [{ id: 'frac-square-forgotten', stepExpr: fractionExpr(w.numerator, factorize(den, t.hints)), value: { num: w.numerator, den } }] : []
  }
  if (t.kind === 'reduce' && rule.kind === 'trig') {
    const n = dropSquare(applyRule(shownPoly(t.part.num), rule), atom)
    return n ? [{ id: 'frac-square-forgotten', stepExpr: div(ruleExpr(n), shownExpr(t.part.den)), value: { num: n, den: shownPoly(t.part.den) } }] : []
  }
  if (t.kind === 'complex' && rule.kind === 'trig') {
    const top = sideOf(t.top, t.hints)
    if (!top.work) return []
    const n = dropSquare(applyRule(top.work.numerator, rule), atom)
    if (!n) return []
    const wrongTop = { num: n, den: top.frac.den }
    return [{ id: 'frac-square-forgotten', stepExpr: fractionExpr(n, top.work.lcd), value: fracDiv(wrongTop, signedFrac(t.bottom)) }]
  }
  return []
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

// --- Alle falschen Antworten einer Aufgabe ---

export function fractionWrongAnswers(t: FractionTask, solution: FracSolution = solveFraction(t)): FracWrong[] {
  const candidates: Candidate[] =
    t.kind === 'nested'
      ? nestedMistakes(t)
      : [
          ...(t.kind === 'sum' ? sumMistakes(workSum(t.terms, t.hints), t.hints) : []),
          ...operationMistakes(t),
          ...multiplyOutMistakes(t),
          ...factorStepMistakes(t, solution),
          ...ruleMistakes(t, solution),
          ...cancelMistakes(t, solution),
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

