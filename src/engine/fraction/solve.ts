import { toLatex } from '../expr/print.ts'
import { type Expr, add, div, fn, mul, mulDot, neg, num, pow, tan, variable, x } from '../expr/types.ts'
import { type Rational, isOne, ratAbs, ratCmp, ratEq, ratNeg, rat, ratDiv, ratSign } from '../rational.ts'
import {
  type Factored,
  type Reduced,
  factorExprs,
  factorize,
  factoredExpr,
  factoredDivide,
  factoredLcm,
  factoredPoly,
  isOneFactored,
  reduceFrac,
  reducedExpr,
  reducedFrac,
} from './factor.ts'
import { type Frac, fracOf, isHyperbolicAtom, isRootAtom, partnerAtom, polyExpr, reduceImag, startsNegative, trigRewrite } from './frac.ts'
import { type Poly, atomsOf, constValue, isOneFirst, polyAdd, polyConst, polyContent, polyDivideExact, polyEquals, polyMul, polyNeg, polyScale, polySum, primitivePart } from './poly.ts'
import {
  type BlockRule,
  type FractionTask,
  type Part,
  type Shown,
  type Signed,
  type TreeNode,
  bottomFrac,
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
  limitedLatex,
  taskExpr,
  taskFrac,
  telescopePrefix,
  type TeleUpper,
  treeExpr,
  treeFrac,
  treeLatex,
} from './task.ts'
import { type TreeStage, hasDecimal, treeStages, withoutDecimals } from './tree.ts'
import { type PartialWork, ansatzExpr, dividedExpr, partialExpr, partialWorkOf } from './partial.ts'
import { type LimitTarget, dividedFracExpr, fracValueAt, highestPower, limitAtInfinity } from './limit.ts'
import { type TeleWork, bracketExpr, remainingExpr, splitExpr, teleValue, teleWorkOf } from './telescope.ts'
import { type ComplexParts, complexExpr, complexParts, complexReduced, complexValueExpr, conjugateFactor, hasImag, hasImagPower } from './complex.ts'

// Rechenweg einer Bruchaufgabe wie im Skript: Hauptnenner, erweitern, Zähler zusammenfassen,
// zerlegen, kürzen, mit dem Kehrwert malnehmen, Doppelbruch auflösen. Jeder Schritt zeigt den
// ganzen Zwischenstand; alle Schritte haben denselben Wert wie die Aufgabe (Tests prüfen das).
// Stufe 5: Klammern wie (x + h)² ausmultiplizieren, Regeln der Bausteine anwenden
// (sin² x + cos² x = 1, (√x)² = x), verschachtelte Doppelbrüche von innen nach außen, mehrere
// Rechenarten (erst jede Klammer zu einem Bruch), Partialbruchzerlegung (Polynomdivision, Nenner
// zerlegen, Ansatz und Zahlen: Ansatz und Zahlen haben keinen Zwischenstand, expr ist dort null),
// komplexe Zahlen teilen (Potenzen von i, mit dem konjugiert Komplexen erweitern,
// ausmultiplizieren, aufteilen), Grenzwerte (x → a: umformen wie beim Kürzen bzw. Zusammenfassen,
// dann einsetzen; n → ∞: durch die höchste Potenz teilen), Teleskopsummen (Summand in Partialbrüche
// zerlegen, ausschreiben, was übrig bleibt, zusammenfassen bzw. Grenzwert).

export type StepKind =
  | 'lcd'
  | 'expand'
  | 'combine'
  | 'factor-num'
  | 'factor-den'
  | 'cancel'
  | 'multiply'
  | 'reciprocal'
  | 'inner-num'
  | 'inner-den'
  | 'multiply-out'
  | 'identity'
  | 'inner-complex'
  | 'left'
  | 'right'
  | 'decimal'
  | 'order'
  | 'part'
  | 'conjugate'
  | 'divide'
  | 'ansatz'
  | 'coef'
  | 'imag-power'
  | 'imag-conjugate'
  | 'imag-multiply'
  | 'imag-split'
  | 'imag-sum'
  | 'limit-insert'
  | 'limit-divide'
  | 'limit-value'
  | 'tele-split'
  | 'tele-cancel'
  | 'tele-sum'
  | 'tele-limit'

export const STEP_NAMES: Record<StepKind, string> = {
  lcd: 'Hauptnenner',
  expand: 'Auf den Hauptnenner erweitern',
  combine: 'Zähler zusammenfassen',
  'factor-num': 'Zähler zerlegen',
  'factor-den': 'Nenner zerlegen',
  cancel: 'Kürzen',
  multiply: 'Zähler mal Zähler, Nenner mal Nenner',
  reciprocal: 'Mit dem Kehrwert malnehmen',
  'inner-num': 'Zähler zu einem Bruch',
  'inner-den': 'Nenner zu einem Bruch',
  'multiply-out': 'Ausmultiplizieren',
  identity: 'Regel des Bausteins anwenden',
  'inner-complex': 'Inneren Doppelbruch auflösen',
  left: 'Erste Klammer zu einem Bruch',
  right: 'Zweite Klammer zu einem Bruch',
  decimal: 'Dezimalzahl als Bruch',
  order: 'Was zuerst?',
  part: 'Teilergebnis einsetzen',
  conjugate: 'Mit dem Gegenstück erweitern',
  divide: 'Polynomdivision',
  ansatz: 'Ansatz',
  coef: 'Zahl bestimmen',
  'imag-power': 'Potenzen ausrechnen',
  'imag-conjugate': 'Mit dem konjugiert Komplexen erweitern',
  'imag-multiply': 'Ausmultiplizieren',
  'imag-split': 'In Realteil und Imaginärteil aufteilen',
  'imag-sum': 'Realteile und Imaginärteile zusammenfassen',
  'limit-insert': 'Einsetzen',
  'limit-divide': 'Durch die höchste Potenz teilen',
  'limit-value': 'Grenzwert bestimmen',
  'tele-split': 'In Partialbrüche zerlegen',
  'tele-cancel': 'Ausschreiben und wegheben',
  'tele-sum': 'Zusammenfassen',
  'tele-limit': 'Grenzwert bestimmen',
}

export type FracStep = {
  readonly kind: StepKind
  // ganzer Zwischenstand nach dem Schritt; beim Hauptnenner null
  readonly expr: Expr | null
  // Hauptnenner, Zerlegung oder der gekürzte Faktor
  readonly detail?: Expr
  // beim Kürzen: Zähler und Nenner in Faktoren, bevor gekürzt wird
  readonly before?: Expr
  // beim Ausmultiplizieren und bei einer Regel: der umgeformte Term vorher (detail: nachher)
  readonly from?: Expr
  // gefragt ist nur ein Teil, z. B. der Zähler des Doppelbruchs als ein Bruch oder der innere
  // Doppelbruch; sonst der ganze Zwischenstand
  readonly answer?: Expr
  // Zwischenstand als LaTeX, wenn er sich nicht als Term schreiben lässt (Rechenbaum mit „:")
  readonly latex?: string
  // Partialbrüche: die Zahl, die dieser Schritt bestimmt (detail: ihr Wert)
  readonly letter?: string
}

export type FracSolution = {
  readonly value: Frac
  readonly steps: readonly FracStep[]
  readonly reduced: Reduced
  readonly result: Expr
  // Zahlen, die x nicht sein darf (nur bei Aufgaben mit x allein); sonst null
  readonly excluded: readonly Rational[] | null
  // der Bruch direkt vor dem letzten Kürzen
  readonly beforeCancel: Frac
}

// --- Schreibweise ---

// Summe so, dass sie möglichst mit Plus beginnt: 3 − x statt −x + 3; 1 + \sin x mit der 1 vorn
export function nicePolyExpr(p: Poly): Expr {
  if (p.length >= 2 && startsNegative(p) && !startsNegative([...p].reverse())) return polyExpr(p, 'ascending')
  if (isOneFirst(p)) return polyExpr(p, 'ascending')
  return polyExpr(p)
}

// Bruch aus Zähler (ausmultipliziert) und Nenner in Faktoren; Nenner 1 → nur der Zähler. Ist der
// Zähler ganz negativ, steht das Minus vor dem Bruch: -\frac{3}{10}
export function fractionExpr(numerator: Poly, den: Factored): Expr {
  if (isOneFactored(den) || numerator.length === 0) return nicePolyExpr(numerator)
  const allNegative = startsNegative(numerator) && (numerator.length < 2 || startsNegative([...numerator].reverse()))
  if (allNegative) return neg(div(nicePolyExpr(polyNeg(numerator)), factoredExpr(den)))
  return div(nicePolyExpr(numerator), factoredExpr(den))
}

// Produkt mit Malpunkt; Faktoren 1 fallen weg (\frac{10}{11 \cdot 6} statt \frac{10 \cdot 1}{11 \cdot 6})
export function productExpr(factors: readonly Expr[]): Expr {
  const isOneLiteral = (e: Expr) => e.kind === 'num' && isOne(e.value)
  const rest = factors.filter((f) => !isOneLiteral(f))
  return rest.length === 0 ? num(1) : mulDot(...rest)
}

export function signedSum(items: ReadonlyArray<{ sign: 1 | -1; expr: Expr }>): Expr {
  return add(...items.map((t) => (t.sign < 0 ? neg(t.expr) : t.expr)))
}

// Zähler mal Erweiterungsfaktor, so wie man es hinschreibt: 9, 2x, 3(x + 1), 2(x + 2)(x − 1)
export function timesExpr(n: Shown, e: Factored): Expr {
  if (isOneFactored(e)) return shownExpr(n)
  const np = shownPoly(n)
  const product = polyMul(np, factoredPoly(e))
  if (product.length <= 1) return polyExpr(product)
  if (np.length === 1) return factoredExpr(factorize(product, e.factors.map((f) => f.poly)))
  return mul(...(isOne(e.coef) ? [] : [num(e.coef)]), shownExpr(n), ...factorExprs(e))
}

// --- Plus und minus ---

export type SumWork = {
  readonly terms: readonly Signed[]
  // Nenner je Summand in Faktoren
  readonly dens: readonly Factored[]
  readonly lcd: Factored
  // Erweiterungsfaktor je Summand
  readonly factorsUp: readonly Factored[]
  // Zähler mal Erweiterungsfaktor, ohne Vorzeichen
  readonly products: readonly Poly[]
  // alle Nenner schon gleich
  readonly sameDenominator: boolean
  // Summe der erweiterten Brüche
  readonly expandedExpr: Expr
  // Zähler nach dem Zusammenfassen (mit Vorzeichen)
  readonly numerator: Poly
}

export function workSum(terms: readonly Signed[], hints: readonly Poly[]): SumWork {
  const dens = terms.map((t) => factorize(shownPoly(t.part.den), hints))
  const lcd = factoredLcm(dens)
  const factorsUp = dens.map((d) => factoredDivide(lcd, d)!)
  const products = terms.map((t, i) => polyMul(shownPoly(t.part.num), factoredPoly(factorsUp[i])))
  const sameDenominator = factorsUp.every(isOneFactored)
  const lcdExpr = factoredExpr(lcd)
  const expandedExpr = signedSum(
    terms.map((t, i) => ({ sign: t.sign, expr: div(timesExpr(t.part.num, factorsUp[i]), lcdExpr) })),
  )
  const numerator = polySum(terms.map((t, i) => (t.sign < 0 ? polyNeg(products[i]) : products[i])))
  return { terms, dens, lcd, factorsUp, products, sameDenominator, expandedExpr, numerator }
}

export const combinedExpr = (w: SumWork): Expr => fractionExpr(w.numerator, w.lcd)

export const workFrac = (w: SumWork): Frac => ({ num: w.numerator, den: factoredPoly(w.lcd) })

// --- Kürzen ---

// Faktor, der beim Kürzen wegfällt (raw.den / gekürzter Nenner); null, wenn nichts wegfällt
export function cancelledFactor(raw: Frac, reduced: Reduced, hints: readonly Poly[]): Factored | null {
  const q = polyDivideExact(raw.den, factoredPoly(reduced.den))
  if (q === null) return null
  const c = constValue(q)
  if (c && isOne(ratAbs(c))) return null
  const f = factorize(q, hints)
  return ratSign(f.coef) < 0 ? { coef: ratNeg(f.coef), factors: f.factors } : f
}

function cancelStep(raw: Frac, reduced: Reduced, hints: readonly Poly[]): FracStep | null {
  const common = cancelledFactor(raw, reduced, hints)
  // Auch wenn sich nur das Vorzeichen ändert oder nichts wegfällt: kein eigener Schritt
  if (!common) return null
  const den = factorize(raw.den, hints)
  const numerator = factorize(raw.num, [...den.factors.map((f) => f.poly), ...hints])
  return {
    kind: 'cancel',
    expr: reducedExpr(reduced),
    detail: factoredExpr(common),
    before: div(factoredExpr(numerator), factoredExpr(den)),
  }
}

// Zerlegt etwas? (mehr als ein Faktor, eine Zahl davor, eine Hochzahl oder ein Minus)
const splits = (f: Factored) => f.factors.length >= 2 || !isOne(f.coef) || f.factors.some((g) => g.exp > 1)

// --- Rechenweg ---

// Zähler mal Zähler, Nenner mal Nenner, noch nicht ausgerechnet: \frac{3 \cdot 2}{10 \cdot 3}
export function multipliedExpr(left: Part, right: Part): Expr {
  const nums = [left.num, right.num].map(shownExpr)
  const dens = [left, right].filter((p) => !isWhole(p)).map((p) => shownExpr(p.den))
  return dens.length === 0 ? productExpr(nums) : div(productExpr(nums), productExpr(dens))
}

function productSteps(left: Part, right: Part, hints: readonly Poly[]): { steps: FracStep[]; raw: Frac } {
  const multiplied = multipliedExpr(left, right)
  const l = partFrac(left)
  const r = partFrac(right)
  const raw = { num: polyMul(l.num, r.num), den: polyMul(l.den, r.den) }
  const steps: FracStep[] = [{ kind: 'multiply', expr: multiplied }]
  const cancel = cancelStep(raw, reduceFrac(raw, hints), hints)
  if (cancel) steps.push(cancel)
  return { steps, raw }
}

export const reciprocalPart = (p: Part): Part => part(p.den, p.num)

// Ein Teil eines Doppelbruchs als ein Bruch: einzelner Bruch bleibt, Summe wird zusammengefasst
type Side = { readonly frac: Frac; readonly expr: Expr; readonly combined: boolean; readonly work?: SumWork }

export function sideOf(terms: readonly Signed[], hints: readonly Poly[]): Side {
  if (terms.length === 1 && terms[0].sign > 0) return { frac: partFrac(terms[0].part), expr: partExpr(terms[0].part), combined: false }
  const work = workSum(terms, hints)
  return { frac: workFrac(work), expr: combinedExpr(work), combined: true, work }
}

// Kehrwert einer Seite als Term: \frac{x^2}{x^2 - 1}
export function reciprocalExpr(side: Side): Expr {
  if (side.work) {
    const n = constValue(side.work.numerator)
    if (n && isOne(n)) return factoredExpr(side.work.lcd)
    return div(factoredExpr(side.work.lcd), nicePolyExpr(side.work.numerator))
  }
  const den = constValue(side.frac.den)
  if (den && isOne(den)) return div(num(1), side.expr)
  // \frac{1}{2} umgedreht ist 2, nicht \frac{2}{1}
  if (side.expr.kind === 'div' && side.expr.num.kind === 'num' && isOne(side.expr.num.value)) return side.expr.den
  return side.expr.kind === 'div' ? div(side.expr.den, side.expr.num) : div(num(1), side.expr)
}

// --- Regeln der Bausteine (Stufe 5) ---

// Ein Polynom nach der Regel umgeschrieben: sin² x + cos² x = 1 bzw. cosh² x − sinh² x = 1 (es
// bleibt der bevorzugte Baustein, z. B. 1 − cos² x → sin² x, cosh² x − 1 → sinh² x); bei √x ändert
// sich nur die Schreibweise
export function applyRule(p: Poly, rule: BlockRule): Poly {
  return rule.kind === 'trig' ? trigRewrite(p, partnerAtom(rule.prefer)) : p
}

// cosh² x − sinh² x = 1 angewandt (cosh² x → 1 + sinh² x): (cosh x − sinh x)(cosh x + sinh x) → 1
export const hyperbolicIdentity = (p: Poly): Poly => trigRewrite(p, 'CH')

// Polynom als Faktoren, wenn es eins ist (\cos^2 x), sonst ausmultipliziert (1 - \cos^2 x)
export const ruleExpr = (p: Poly): Expr => (p.length === 1 ? factoredExpr(factorize(p)) : nicePolyExpr(p))

// Doppelbruch: Zähler und Nenner je als ein Bruch, oben ggf. nach der Regel umgeschrieben
type RuledSide = Side & { readonly rule?: { readonly before: Expr; readonly after: Expr } }

export function ruledTop(top: Side, rule: BlockRule | undefined): RuledSide {
  if (rule?.kind !== 'trig' || rule.target !== 'num' || !top.work) return top
  const numerator = applyRule(top.work.numerator, rule)
  const frac = { num: numerator, den: top.frac.den }
  const work = { ...top.work, numerator }
  return { frac, expr: fractionExpr(numerator, top.work.lcd), combined: true, work, rule: { before: nicePolyExpr(top.work.numerator), after: ruleExpr(numerator) } }
}

export function solveFraction(t: FractionTask): FracSolution {
  if (t.kind === 'nested') return solveNested(t)
  if (t.kind === 'tree') return solveTree(t)
  if (t.kind === 'reduce' && t.rule?.kind === 'conjugate') return solveConjugate(t, t.rule.target)
  if (t.kind === 'partial') return solvePartial(t)
  if (t.kind === 'imaginary') return solveImaginary(t)
  if (t.kind === 'limit') return solveLimit(t)
  if (t.kind === 'telescope') return solveTelescope(t)
  const { hints } = t
  const value = taskFrac(t)
  const steps: FracStep[] = []
  let beforeCancel: Frac = value
  // Nach einer Regel mit sin² x + cos² x = 1 ist der Wert nur noch auf dem Einheitskreis gleich:
  // gekürzt wird dann der umgeschriebene Bruch
  let ruled: Frac | null = null

  switch (t.kind) {
    case 'reduce': {
      let num: Shown = t.part.num
      const denExpr0 = shownExpr(t.part.den)
      // (x + h)² − x² erst ausmultiplizieren und zusammenfassen
      if (num.form === 'binomial') {
        const multiplied = expanded(shownPoly(num))
        steps.push({ kind: 'multiply-out', expr: div(shownExpr(multiplied), denExpr0), from: shownExpr(num), detail: shownExpr(multiplied) })
        num = multiplied
      }
      if (t.rule?.kind === 'trig' && t.rule.target === 'num') {
        const after = applyRule(shownPoly(num), t.rule)
        steps.push({ kind: 'identity', expr: div(ruleExpr(after), denExpr0), from: shownExpr(num), detail: ruleExpr(after) })
        num = expanded(after)
        ruled = { num: after, den: shownPoly(t.part.den) }
      }
      const fd = factorize(shownPoly(t.part.den), hints)
      const fn = factorize(shownPoly(num), [...fd.factors.map((f) => f.poly), ...hints])
      let numExpr = shownExpr(num)
      let denExpr = denExpr0
      if (num.form === 'expanded' && num.poly.length > 1 && splits(fn)) {
        numExpr = factoredExpr(fn)
        steps.push({ kind: 'factor-num', expr: div(numExpr, denExpr), detail: numExpr })
      }
      if (t.part.den.form === 'expanded' && t.part.den.poly.length > 1 && splits(fd)) {
        denExpr = factoredExpr(fd)
        steps.push({ kind: 'factor-den', expr: div(numExpr, denExpr), detail: denExpr })
      }
      beforeCancel = { num: shownPoly(num), den: shownPoly(t.part.den) }
      break
    }
    case 'sum': {
      const w = workSum(t.terms, hints)
      if (!w.sameDenominator) {
        steps.push({ kind: 'lcd', expr: null, detail: factoredExpr(w.lcd) })
        steps.push({ kind: 'expand', expr: w.expandedExpr })
      }
      steps.push({ kind: 'combine', expr: combinedExpr(w) })
      beforeCancel = workFrac(w)
      const rule = t.rule
      if (rule?.kind === 'trig') {
        const lcdPoly = factoredPoly(w.lcd)
        if (rule.target === 'num') {
          const after = applyRule(w.numerator, rule)
          steps.push({ kind: 'identity', expr: fractionExpr(after, w.lcd), from: nicePolyExpr(w.numerator), detail: ruleExpr(after) })
          ruled = { num: after, den: lcdPoly }
        } else {
          const after = applyRule(lcdPoly, rule)
          const den = factorize(after, hints)
          steps.push({ kind: 'identity', expr: fractionExpr(w.numerator, den), from: factoredExpr(w.lcd), detail: factoredExpr(den) })
          ruled = { num: w.numerator, den: after }
        }
        beforeCancel = ruled
      }
      if (rule?.kind === 'root') {
        // (√x − 3)(√x + 3) = x − 9: derselbe Wert, nur ausmultipliziert geschrieben
        const lcdPoly = factoredPoly(w.lcd)
        steps.push({ kind: 'identity', expr: expandedDenExpr(w.numerator, lcdPoly), from: factoredExpr(w.lcd), detail: nicePolyExpr(lcdPoly) })
      }
      break
    }
    case 'product': {
      const p = productSteps(t.left, t.right, hints)
      steps.push(...p.steps)
      return finish(t, value, steps, p.raw, true)
    }
    case 'quotient': {
      const recip = reciprocalPart(t.right)
      steps.push({ kind: 'reciprocal', expr: mulDot(partExpr(t.left), partExpr(recip)) })
      const p = productSteps(t.left, recip, hints)
      steps.push(...p.steps)
      return finish(t, value, steps, p.raw, true)
    }
    case 'complex': {
      const combinedTop = sideOf(t.top, hints)
      const bottom = sideOf(t.bottom, hints)
      if (combinedTop.combined) steps.push({ kind: 'inner-num', expr: div(combinedTop.expr, signedExprOf(t.bottom)), answer: combinedTop.expr })
      const top = ruledTop(combinedTop, t.rule)
      if (top.rule) {
        steps.push({ kind: 'identity', expr: div(top.expr, signedExprOf(t.bottom)), from: top.rule.before, detail: top.rule.after, answer: top.expr })
      }
      if (bottom.combined) steps.push({ kind: 'inner-den', expr: div(top.expr, bottom.expr), answer: bottom.expr })
      steps.push({ kind: 'reciprocal', expr: mulDot(top.expr, reciprocalExpr(bottom)) })
      beforeCancel = { num: polyMul(top.frac.num, bottom.frac.den), den: polyMul(top.frac.den, bottom.frac.num) }
      if (top.rule) ruled = beforeCancel
      break
    }
    case 'mixed': {
      const left = sideOf(t.left, hints)
      if (t.op === 'div') {
        // Geteilt durch einen Bruch: erst mit dem Kehrwert malnehmen, dann die Klammer zu einem Bruch
        const recip = reciprocalPart(t.right[0].part)
        steps.push({ kind: 'reciprocal', expr: mulDot(signedExprOf(t.left), partExpr(recip)) })
        if (left.combined) steps.push({ kind: 'left', expr: mulDot(left.expr, partExpr(recip)), answer: left.expr })
        const p = productSteps(sidePart(left, t.left), recip, hints)
        steps.push(...p.steps)
        return finish(t, value, steps, p.raw, true)
      }
      const right = sideOf(t.right, hints)
      if (left.combined) steps.push({ kind: 'left', expr: mulDot(left.expr, signedExprOf(t.right)), answer: left.expr })
      if (right.combined) steps.push({ kind: 'right', expr: mulDot(left.expr, right.expr), answer: right.expr })
      const p = productSteps(sidePart(left, t.left), sidePart(right, t.right), hints)
      steps.push(...p.steps)
      return finish(t, value, steps, p.raw, true)
    }
  }
  return finish(t, value, steps, beforeCancel, false, ruled)
}

// Eine Seite als Bruch (Part): zusammengefasst mit dem Hauptnenner in Faktoren
export function sidePart(side: Side, terms: readonly Signed[]): Part {
  if (!side.work) return terms[0].part
  return part(expanded(side.work.numerator), factoredShown(side.work.lcd))
}

// Rechenbaum: Dezimalzahlen als Brüche, dann Teil für Teil wie eine gewohnte Aufgabe (fraction/tree.ts);
// nach jedem Teil steht der ganze Zwischenstand da
export type TreeSolution = FracSolution & { readonly stages: ReadonlyArray<TreeStage & { readonly solution: FracSolution }> }

export function solveTree(t: Extract<FractionTask, { kind: 'tree' }>): TreeSolution {
  const value = taskFrac(t)
  const steps: FracStep[] = []
  if (hasDecimal(t.root)) {
    const plain = withoutDecimals(t.root)
    steps.push({ kind: 'decimal', expr: treeExpr(plain), latex: treeLatex(plain) })
  }
  const solved = new Map<FractionTask, FracSolution>()
  const stages = treeStages(t.root, t.hints, (task) => {
    const solution = solveFraction(task)
    solved.set(task, solution)
    return solution.reduced
  }).map((stage) => ({ ...stage, solution: solved.get(stage.task)! }))
  stages.forEach((stage, i) => {
    steps.push(...stage.solution.steps)
    if (i < stages.length - 1) steps.push({ kind: 'part', expr: treeExpr(stage.after), latex: treeLatex(stage.after) })
  })
  // Ergebnis wie im letzten Teil geschrieben (dort wird der ganze Rest gerechnet); sonst gekürzt
  const last = stages.at(-1)
  if (last && last.node === last.before) {
    return { value, steps, reduced: last.solution.reduced, result: last.solution.result, excluded: excludedValues(t), beforeCancel: value, stages }
  }
  const hints = [...partsOf(t).flatMap((p) => factorize(shownPoly(p.den), t.hints).factors.map((f) => f.poly)), ...t.hints]
  const reduced = reduceFrac(value, hints)
  return { value, steps, reduced, result: resultExpr(reduced, t), excluded: excludedValues(t), beforeCancel: value, stages }
}

// Spielbar: Im letzten Teil wird der ganze Rest gerechnet. Sonst käme z. B. bei −(a − b) · c das
// Minus erst nach dem letzten Teil dazu, und die letzte Antwort wäre nicht das Ergebnis.
export function isPlayableTree(t: Extract<FractionTask, { kind: 'tree' }>): boolean {
  const last = solveTree(t).stages.at(-1)
  return last !== undefined && last.node === last.before
}

// Verschachtelter Doppelbruch: erst den inneren auflösen, dann weiter wie beim Doppelbruch
function solveNested(t: Extract<FractionTask, { kind: 'nested' }>): FracSolution {
  const inner = solveFraction(innerTask(t, t.hints))
  const replaced = replaceInner(t, innerResultPart(inner), t.hints)
  const outer = solveFraction(replaced)
  const step: FracStep = { kind: 'inner-complex', expr: taskExpr(replaced), answer: inner.result }
  return { ...outer, value: taskFrac(t), steps: [step, ...outer.steps], excluded: excludedValues(t) }
}

// Ergebnis des inneren Doppelbruchs als Bruch (ein Minus davor bleibt im Zähler)
export function innerResultPart(inner: FracSolution): Part {
  return part(expanded(inner.reduced.num), factoredShown(inner.reduced.den))
}

function signedExprOf(terms: readonly Signed[]): Expr {
  return signedSum(terms.map((t) => ({ sign: t.sign, expr: partExpr(t.part) })))
}

// Bruch mit ausmultipliziertem Nenner: \frac{2\sqrt{x}}{x - 9}
export function expandedDenExpr(numerator: Poly, den: Poly): Expr {
  const r: Reduced = { num: numerator, den: factorize(den) }
  const e = reducedExpr(r)
  const body = (x: Expr): Expr => (x.kind === 'div' ? div(x.num, nicePolyExpr(den)) : x)
  return e.kind === 'neg' ? neg(body(e.arg)) : body(e)
}

function finish(t: FractionTask, value: Frac, steps: FracStep[], beforeCancel: Frac, cancelDone: boolean, ruled: Frac | null = null): FracSolution {
  // Faktoren der Nenner in der Reihenfolge der Aufgabe, damit das Ergebnis sie genauso schreibt
  const order = partsOf(t).flatMap((p) => factorize(shownPoly(p.den), t.hints).factors.map((f) => f.poly))
  const hints = [...order, ...t.hints]
  const reduced = reduceFrac(ruled ?? value, hints)
  if (!cancelDone) {
    const cancel = cancelStep(beforeCancel, reduceFrac(beforeCancel, hints), hints)
    if (cancel) steps.push(cancel)
  }
  return { value, steps, reduced, result: resultExpr(reduced, t), excluded: excludedValues(t), beforeCancel }
}

// Schreibweise des Ergebnisses; bei √x mit ausmultipliziertem Nenner (x − 9 statt (√x − 3)(√x + 3)),
// sin x / cos x als tan x; Wurzel im Nenner beseitigt: \frac{\sqrt{x} + 2}{x - 4}
export function resultExpr(reduced: Reduced, t: { readonly rule?: BlockRule }): Expr {
  if (t.rule?.kind === 'conjugate' && t.rule.target === 'den') {
    const f = rationalizedFrac(reduced)
    if (f) return plainFractionExpr(f.num, f.den)
  }
  const expandDen = t.rule?.kind === 'root' || (t.rule?.kind === 'conjugate' && t.rule.target === 'den')
  if (expandDen && reduced.den.factors.length >= 2) return expandedDenExpr(reduced.num, factoredPoly(reduced.den))
  return tanExpr(reduced) ?? reducedExpr(reduced)
}

// --- Wurzel beseitigen: mit dem Gegenstück erweitern (Stufe 5) ---

// cosh x ± sinh x (auch mit einer Zahl davor): Das Produkt mit dem Gegenstück ist mit
// cosh² x − sinh² x = 1 eine Zahl
export function isHyperbolicPair(p: Poly): boolean {
  if (p.length !== 2 || !p.every((t) => t.mono.length === 1 && t.mono[0][1] === 1 && isHyperbolicAtom(t.mono[0][0]))) return false
  return p[0].mono[0][0] !== p[1].mono[0][0] && ratEq(ratAbs(p[0].coef), ratAbs(p[1].coef))
}

// Produkt einer Summe mit ihrem Gegenstück, bei cosh x ± sinh x schon mit cosh² x − sinh² x = 1
export function conjugateProduct(p: Poly, conj: Poly): Poly {
  const product = polyMul(p, conj)
  return isHyperbolicPair(p) ? hyperbolicIdentity(product) : product
}

// Gegenstück einer Summe aus zwei Teilen mit Wurzel (dritte binomische Formel): √x − 2 → √x + 2,
// √a + √b → √a − √b, √(x + h) − √x → √(x + h) + √x. Das Produkt hat keine Wurzel mehr. Ebenso
// cosh x − sinh x → cosh x + sinh x. null, wenn die Summe keine Wurzel enthält oder nicht aus zwei
// Teilen besteht.
export function conjugateOf(p: Poly): Poly | null {
  if (isHyperbolicPair(p)) return primitivePart(polyAdd([p[0]], polyNeg([p[1]])))
  if (p.length !== 2 || !atomsOf(p).some(isRootAtom)) return null
  if (p.some((term) => term.mono.some(([a, e]) => isRootAtom(a) && e > 1))) return null
  return primitivePart(polyAdd([p[0]], polyNeg([p[1]])))
}

// Gekürzter Bruch mit dem Gegenstück seines Nenners erweitert (Nenner ohne Wurzel), eine gemeinsame
// Zahl gekürzt; null, wenn der Nenner keine Summe mit Wurzel ist
export function rationalizedFrac(r: Reduced): Frac | null {
  const [f] = r.den.factors
  if (r.den.factors.length !== 1 || f.exp !== 1) return null
  const conj = conjugateOf(f.poly)
  if (!conj) return null
  const num = polyMul(r.num, conj)
  const den = polyScale(conjugateProduct(f.poly, conj), r.den.coef)
  const [cn, cd] = [polyContent(num), polyContent(den)]
  if (cn.d !== 1n || cd.d !== 1n) return { num, den }
  let g = cn.n < 0n ? -cn.n : cn.n
  for (let b = cd.n < 0n ? -cd.n : cd.n; b !== 0n; ) [g, b] = [b, g % b]
  const c = rat(cd.n < 0n ? -g : g)
  return { num: polyScale(num, ratDiv(rat(1), c)), den: polyScale(den, ratDiv(rat(1), c)) }
}

// Bruch aus zwei ausmultiplizierten Polynomen; ein Minus, das überall im Zähler steht, vor dem Bruch
export function plainFractionExpr(numerator: Poly, den: Poly): Expr {
  const d = constValue(den)
  if (d && isOne(d)) return nicePolyExpr(numerator)
  const allNegative = numerator.length > 0 && startsNegative(numerator) && (numerator.length < 2 || startsNegative([...numerator].reverse()))
  if (allNegative) return neg(div(nicePolyExpr(polyNeg(numerator)), nicePolyExpr(den)))
  return div(nicePolyExpr(numerator), nicePolyExpr(den))
}

// Erweitern mit dem Gegenstück: Nenner \frac{3}{\sqrt{x} - 2} = \frac{3(\sqrt{x} + 2)}{(\sqrt{x} - 2)(\sqrt{x} + 2)} =
// \frac{3\sqrt{x} + 6}{x - 4}; Zähler \frac{\sqrt{x + h} - \sqrt{x}}{h} = \frac{h}{h(\sqrt{x + h} + \sqrt{x})}, dann h kürzen
function solveConjugate(t: Extract<FractionTask, { kind: 'reduce' }>, target: 'num' | 'den'): FracSolution {
  const value = taskFrac(t)
  const [numP, denP] = [shownPoly(t.part.num), shownPoly(t.part.den)]
  const side = target === 'den' ? t.part.den : t.part.num
  const conj = conjugateOf(shownPoly(side))
  if (!conj) throw new Error('Keine Summe mit Wurzel zum Erweitern')
  const conjExpr = nicePolyExpr(conj)
  const up = (s: Shown) => (polyEquals(shownPoly(s), conj) ? pow(conjExpr, num(2)) : timesExpr(s, { coef: rat(1), factors: [{ poly: conj, exp: 1 }] }))
  const product = polyMul(shownPoly(side), conj)
  const steps: FracStep[] = [{ kind: 'conjugate', expr: div(up(t.part.num), up(t.part.den)), detail: conjExpr }]
  const from = mul(shownExpr(side), conjExpr)
  const reduced = reduceFrac(value, t.hints)
  const result = resultExpr(reduced, t)
  const excluded = excludedValues(t)
  if (target === 'den' && isHyperbolicPair(denP)) {
    // \frac{1}{\cosh x - \sinh x} = \frac{\cosh x + \sinh x}{\cosh^2 x - \sinh^2 x}, dann cosh² x − sinh² x = 1
    steps.push({ kind: 'multiply-out', expr: plainFractionExpr(polyMul(numP, conj), product), from, detail: nicePolyExpr(product) })
    steps.push({ kind: 'identity', expr: result, from: nicePolyExpr(product), detail: nicePolyExpr(hyperbolicIdentity(product)) })
    return { value, steps, reduced, result, excluded, beforeCancel: { num: polyMul(numP, conj), den: hyperbolicIdentity(product) } }
  }
  if (target === 'den') {
    steps.push({ kind: 'multiply-out', expr: result, from, detail: nicePolyExpr(product) })
    return { value, steps, reduced, result, excluded, beforeCancel: { num: polyMul(numP, conj), den: product } }
  }
  // Zähler ohne Wurzel; der Nenner der Aufgabe (beim Differenzenquotienten h) kürzt sich
  const after = div(nicePolyExpr(product), up(t.part.den))
  steps.push({ kind: 'multiply-out', expr: after, from, detail: nicePolyExpr(product) })
  steps.push({ kind: 'cancel', expr: result, detail: shownExpr(t.part.den), before: after })
  return { value, steps, reduced, result, excluded, beforeCancel: { num: product, den: polyMul(denP, conj) } }
}

// --- Partialbruchzerlegung (Stufe 5) ---

export function partialWork(t: Extract<FractionTask, { kind: 'partial' }>): PartialWork {
  const w = partialWorkOf(shownPoly(t.part.num), shownPoly(t.part.den), t.hints)
  if (!w) throw new Error('Der Nenner zerfällt nicht in Linearfaktoren')
  return w
}

// Wird der Nenner im Rechenweg zerlegt? (steht er als Summe da, die sich zerlegen lässt; x − 1 nicht)
export const partialFactorStep = (t: Extract<FractionTask, { kind: 'partial' }>) =>
  t.part.den.form === 'expanded' && t.part.den.poly.length >= 2 && splits(factorize(t.part.den.poly, t.hints))

// Polynomdivision, Nenner zerlegen, Ansatz, je Zahl ein Schritt; Ergebnis die Zerlegung
function solvePartial(t: Extract<FractionTask, { kind: 'partial' }>): FracSolution {
  const value = taskFrac(t)
  const w = partialWork(t)
  const steps: FracStep[] = []
  const denShown = shownExpr(t.part.den)
  if (w.divided) steps.push({ kind: 'divide', expr: dividedExpr(w, denShown), detail: nicePolyExpr(w.quotient) })
  if (partialFactorStep(t)) {
    const factoredDen = factoredExpr(w.factored)
    steps.push({ kind: 'factor-den', expr: dividedExpr(w, factoredDen), detail: factoredDen })
  }
  steps.push({ kind: 'ansatz', expr: null, detail: ansatzExpr(w.quotient, w.terms) })
  for (const f of w.findings) steps.push({ kind: 'coef', expr: null, detail: num(f.value), letter: f.letter })
  const reduced = reduceFrac(value, t.hints)
  return { value, steps, reduced, result: partialExpr(w.quotient, w.terms), excluded: excludedValues(t), beforeCancel: value }
}

// --- Komplexe Zahlen teilen (Stufe 5) ---

// Rechnung zu einer Aufgabe mit komplexen Zahlen: der Bruch mit i im Nenner (index), nach den
// Potenzen von i (num, den), erweitert mit dem konjugiert Komplexen conj, ausmultipliziert
// (product: Zähler und reeller Nenner) und sein Wert in der Form a + bi
export type ImagWork = {
  readonly index: number
  readonly terms: readonly Signed[]
  readonly powered: boolean
  readonly num: Shown
  readonly den: Shown
  readonly conj: Poly
  readonly product: { readonly num: Poly; readonly den: Poly }
  readonly parts: ComplexParts
}

// Steht im Term eine Potenz von i wie i² oder i³? (bei Faktoren je Faktor)
const shownHasImagPower = (s: Shown) => (s.form === 'factored' ? s.factored.factors.some((f) => hasImagPower(f.poly)) : hasImagPower(shownPoly(s)))
const withoutImagPowers = (s: Shown): Shown => (shownHasImagPower(s) && s.form !== 'factored' ? expanded(reduceImag(shownPoly(s))) : s)

export function imagWork(t: Extract<FractionTask, { kind: 'imaginary' }>): ImagWork {
  const index = t.terms.findIndex((s) => hasImag(reduceImag(shownPoly(s.part.den))))
  if (index < 0) throw new Error('Kein Bruch mit i im Nenner')
  const powered = t.terms.some((s) => shownHasImagPower(s.part.num) || shownHasImagPower(s.part.den))
  const terms = t.terms.map((s) => ({ sign: s.sign, part: part(withoutImagPowers(s.part.num), withoutImagPowers(s.part.den)) }))
  const { num: n, den: d } = terms[index].part
  const denPoly = shownPoly(d)
  const conj = conjugateFactor(denPoly)
  const product = { num: reduceImag(polyMul(shownPoly(n), conj)), den: reduceImag(polyMul(denPoly, conj)) }
  return { index, terms, powered, num: n, den: d, conj, product, parts: complexParts({ num: shownPoly(n), den: denPoly }) }
}

// Zähler bzw. Nenner mal das konjugiert Komplexe, so wie man es hinschreibt: (3 + 4i)(1 + 2i),
// 5(1 + 2i), 2i \cdot (-i); bei 1 nur der Faktor
export function imagTimesExpr(s: Shown, conj: Poly): Expr {
  const c = polyExpr(conj)
  const one = constValue(shownPoly(s))
  if (one !== null && isOne(one)) return c
  return mul(shownExpr(s), c)
}

// Ganzer Zwischenstand: der Bruch (index) ersetzt durch e, die übrigen Summanden wie gezeigt
export function imagStage(w: ImagWork, e: Expr): Expr {
  return signedSum(w.terms.map((s, i) => ({ sign: s.sign, expr: i === w.index ? e : partExpr(s.part) })))
}

// Potenzen von i, erweitern, ausmultiplizieren, aufteilen, bei mehreren Summanden zusammenfassen
function solveImaginary(t: Extract<FractionTask, { kind: 'imaginary' }>): FracSolution {
  const value = taskFrac(t)
  const w = imagWork(t)
  const steps: FracStep[] = []
  if (w.powered) steps.push({ kind: 'imag-power', expr: imagStage(w, partExpr(w.terms[w.index].part)) })
  const expandedFrac = div(imagTimesExpr(w.num, w.conj), imagTimesExpr(w.den, w.conj))
  steps.push({ kind: 'imag-conjugate', expr: imagStage(w, expandedFrac), detail: polyExpr(w.conj) })
  const multiplied = plainFractionExpr(w.product.num, w.product.den)
  steps.push({ kind: 'imag-multiply', expr: imagStage(w, multiplied), from: expandedFrac, detail: multiplied })
  const result = complexValueExpr(value, t.hints)
  const own = complexExpr(w.parts, t.hints)
  const denOne = constValue(w.product.den)
  // mit weiteren Summanden: aufteilen und zusammenfassen in einem Schritt; Nenner 1 (z. B. nach
  // i \cdot (-i)): nichts mehr aufzuteilen
  if (w.terms.length > 1) steps.push({ kind: 'imag-sum', expr: result, from: imagStage(w, multiplied), detail: own })
  else if (!(denOne !== null && isOne(denOne))) steps.push({ kind: 'imag-split', expr: result, from: multiplied, detail: own })
  return { value, steps, reduced: complexReduced(value, t.hints), result, excluded: null, beforeCancel: value }
}

// --- Grenzwerte (Stufe 5) ---

// Rechnung zu einem Grenzwert: der Rechenweg des Bruchs (x → a: bis er gekürzt ist; n → ∞: bis er
// ein Bruch ist), der Bruch frac, in den eingesetzt bzw. dessen höchste Potenzen verglichen werden,
// bei n → ∞ ausmultipliziert (expanded: aus Faktoren ausmultipliziert) und die Potenz power, durch die
// geteilt wird; value ist der Grenzwert
export type LimitWork = {
  readonly letter: string
  readonly to: LimitTarget
  readonly inner: FracSolution | null
  readonly frac: Frac
  readonly fracExpr: Expr
  readonly expanded: boolean
  readonly power: number
  readonly order: { readonly num: boolean; readonly den: boolean }
  readonly value: Rational
}

export function limitWork(t: Extract<FractionTask, { kind: 'limit' }>): LimitWork {
  const { inner, letter, to } = t
  if (to !== 'infinity') {
    const solution = solveFraction(inner)
    const frac = reducedFrac(solution.reduced)
    const value = fracValueAt(frac, letter, to)
    if (value === null) throw new Error('Kein Grenzwert: Der Nenner bleibt 0')
    return { letter, to, inner: solution, frac, fracExpr: solution.result, expanded: false, power: 0, order: { num: false, den: false }, value }
  }
  // n → ∞: eine Summe erst zu einem Bruch zusammenfassen, Faktoren ausmultiplizieren
  const solution = inner.kind === 'reduce' ? null : solveFraction(inner)
  const frac = solution ? { num: solution.reduced.num, den: factoredPoly(solution.reduced.den) } : taskFrac(inner)
  const shownForm = inner.kind === 'reduce' ? [inner.part.num, inner.part.den] : []
  const expandedNeeded = shownForm.some((s) => s.form !== 'expanded')
  const order = { num: shownForm[0]?.form === 'expanded' && !!shownForm[0].ascending, den: shownForm[1]?.form === 'expanded' && !!shownForm[1].ascending }
  const value = limitAtInfinity(frac, letter)
  if (value === null) throw new Error('Kein endlicher Grenzwert')
  const fracExpr = div(polyExpr(frac.num, order.num ? 'ascending' : 'descending'), polyExpr(frac.den, order.den ? 'ascending' : 'descending'))
  return { letter, to, inner: solution, frac, fracExpr, expanded: expandedNeeded, power: highestPower(frac.den, letter), order, value }
}

// Zähler und Nenner durch die höchste Potenz geteilt: \frac{3 - \frac{1}{n}}{2 + \frac{5}{n^2}}
export const limitDividedExpr = (w: LimitWork, side: 'both' | 'num' = 'both') => dividedFracExpr(w.frac, w.letter, w.power, w.order, side)

function solveLimit(t: Extract<FractionTask, { kind: 'limit' }>): FracSolution {
  const w = limitWork(t)
  const value = fracOf(polyConst(w.value))
  const result = num(w.value)
  const steps: FracStep[] = [...(w.inner?.steps ?? [])]
  if (t.to !== 'infinity') {
    steps.push({ kind: 'limit-insert', expr: result, from: w.fracExpr })
  } else {
    if (w.expanded) {
      const inner = t.inner as Extract<FractionTask, { kind: 'reduce' }>
      steps.push({ kind: 'multiply-out', expr: w.fracExpr, from: partExpr(inner.part), detail: w.fracExpr })
    }
    const power = w.power === 1 ? variable(w.letter) : pow(variable(w.letter), num(w.power))
    steps.push({ kind: 'limit-divide', expr: limitDividedExpr(w), from: w.fracExpr, detail: power })
    steps.push({ kind: 'limit-value', expr: result, from: limitDividedExpr(w) })
  }
  return { value, steps, reduced: reduceFrac(value), result, excluded: null, beforeCancel: value }
}

// --- Teleskopsummen (Stufe 5) ---

export function teleWork(t: Extract<FractionTask, { kind: 'telescope' }>): TeleWork {
  const w = teleWorkOf(partFrac(t.summand), t.index, t.from, t.upper, t.hints)
  if (!w) throw new Error('Der Summand ist keine Teleskopsumme')
  return w
}

// Steht der Nenner des Summanden als Summe da, die erst zerlegt wird?
export const teleFactorStep = (t: Extract<FractionTask, { kind: 'telescope' }>) => partialFactorStep({ kind: 'partial', part: t.summand, hints: t.hints })

// Summand mit dem Nenner in Faktoren
export const teleFactoredExpr = (w: TeleWork): Expr => dividedExpr(w.partial, factoredExpr(w.partial.factored))

// Zerlegt, mit der Zahl vor dem Summenzeichen: \frac{1}{2} \sum_{k=1}^{n} \left(\frac{1}{k} - \frac{1}{k + 2}\right)
export function teleSplitLatex(w: TeleWork, upper: TeleUpper = w.upper): string {
  const prefix = telescopePrefix(w.index, w.from, upper)
  const bracket = `\\left(${toLatex(bracketExpr(w))}\\right)`
  return isOne(w.factor) ? `${prefix} ${bracket}` : `${toLatex(num(w.factor))} ${prefix} ${bracket}`
}

// Zerlegen, ausschreiben und wegheben, dann zusammenfassen bzw. (Reihe) der Grenzwert der Teilsumme
function solveTelescope(t: Extract<FractionTask, { kind: 'telescope' }>): FracSolution {
  const w = teleWork(t)
  const prefix = telescopePrefix(t.index, t.from, t.upper)
  const steps: FracStep[] = []
  if (teleFactorStep(t)) {
    const factored = teleFactoredExpr(w)
    steps.push({ kind: 'factor-den', expr: factored, detail: factoredExpr(w.partial.factored), latex: `${prefix} ${toLatex(factored)}` })
  }
  steps.push({ kind: 'tele-split', expr: splitExpr(w), latex: teleSplitLatex(w) })
  const remaining = remainingExpr(w)
  // Reihe: der Grenzwert der Teilsumme
  const limited = t.upper.kind === 'infinity' ? { latex: limitedLatex(t.upper.letter, 'infinity', toLatex(remaining)) } : {}
  steps.push({ kind: 'tele-cancel', expr: remaining, ...limited })
  const value = teleValue(w)
  if (!value) throw new Error('Teleskopsumme ohne Wert')
  const reduced = reduceFrac(value)
  const result = resultExpr(reduced, {})
  steps.push({ kind: t.upper.kind === 'infinity' ? 'tele-limit' : 'tele-sum', expr: result })
  return { value, steps, reduced, result, excluded: null, beforeCancel: value }
}

// k \sin^n x / \cos^n x als k \tan^n x; sonst null
function tanExpr(r: Reduced): Expr | null {
  if (r.num.length !== 1 || r.den.factors.length !== 1 || !isOne(r.den.coef)) return null
  const [{ mono, coef }] = r.num
  const [{ poly, exp }] = r.den.factors
  // sin x / cos x = tan x, sinh x / cosh x = tanh x
  const den = poly.length === 1 && poly[0].mono.length === 1 && poly[0].mono[0][1] === 1 ? poly[0].mono[0][0] : null
  const pair = den === 'C' ? { top: 'S', name: tan(x) } : den === 'CH' ? { top: 'SH', name: fn('tanh', x) } : null
  if (!pair || mono.length !== 1 || mono[0][0] !== pair.top || mono[0][1] !== exp) return null
  const t = exp === 1 ? pair.name : pow(pair.name, num(exp))
  if (isOne(coef)) return t
  if (isOne(ratNeg(coef))) return neg(t)
  return ratSign(coef) < 0 ? neg(mul(num(ratNeg(coef)), t)) : mul(num(coef), t)
}

// --- Definitionsbereich ---

// Der eine Buchstabe der Aufgabe (x, a, t …), nach dem sich die verbotenen Zahlen richten; null bei
// mehreren Buchstaben oder Bausteinen wie e^x
export function taskLetter(t: FractionTask): string | null {
  const atoms = [...new Set(partsOf(t).flatMap((p) => [...atomsOf(shownPoly(p.num)), ...atomsOf(shownPoly(p.den))]))]
  if (atoms.length === 0) return 'x'
  return atoms.length === 1 && /^[a-z]$/.test(atoms[0]) && atoms[0] !== 'e' ? atoms[0] : null
}

// Nullstellen eines Polynoms im Buchstaben der Aufgabe; null, wenn es andere Buchstaben enthält
// oder sich nicht in Linearfaktoren zerlegen lässt, aber Nullstellen hat
function zerosIn(p: Poly, letter: string, hints: readonly Poly[]): Rational[] | null {
  if (atomsOf(p).some((a) => a !== letter)) return null
  if (constValue(p) !== null) return []
  const zeros: Rational[] = []
  for (const { poly } of factorize(p, hints).factors) {
    if (poly.length === 1) {
      zeros.push(rat(0))
      continue
    }
    const coefs = new Map(poly.map((term) => [term.mono[0]?.[1] ?? 0, term.coef]))
    const degree = Math.max(...coefs.keys())
    if (degree === 1) {
      zeros.push(ratNeg(ratDiv(coefs.get(0) ?? rat(0), coefs.get(1)!)))
      continue
    }
    // nicht zerlegbar, z. B. x² + 1: ohne Nullstellen nur, wenn die Diskriminante negativ ist
    if (degree === 2) {
      const [c0, c1, c2] = [0, 1, 2].map((k) => Number(coefs.get(k)?.n ?? 0n) / Number(coefs.get(k)?.d ?? 1n))
      if (c1 * c1 - 4 * c2 * c0 < 0) continue
    }
    return null
  }
  return zeros
}

// Nenner, die durch etwas geteilt werden (Rechenbaum): ihr Wert darf nicht 0 sein
function divisorsOf(n: TreeNode): Poly[] {
  switch (n.kind) {
    case 'leaf':
      return []
    case 'sum':
      return n.terms.flatMap((t) => divisorsOf(t.node))
    case 'product':
      return [...divisorsOf(n.left), ...divisorsOf(n.right)]
    default:
      return [treeFrac(n.right).num, ...divisorsOf(n.left), ...divisorsOf(n.right)]
  }
}

export function excludedValues(t: FractionTask): Rational[] | null {
  const polys = partsOf(t).map((p) => shownPoly(p.den))
  if (t.kind === 'tree') polys.push(...divisorsOf(t.root))
  if (t.kind === 'quotient') polys.push(shownPoly(t.right.num))
  if (t.kind === 'mixed' && t.op === 'div') polys.push(signedFrac(t.right).num)
  if (t.kind === 'nested') polys.push(signedFrac(t.inner.bottom).num)
  const bottom = bottomFrac(t)
  if (bottom) polys.push(bottom.num)
  const letter = taskLetter(t)
  if (!letter) return null
  const all: Rational[] = []
  for (const p of polys) {
    const zeros = zerosIn(p, letter, t.hints)
    if (zeros === null) return null
    all.push(...zeros)
  }
  return all.filter((r, i) => all.findIndex((o) => ratEq(o, r)) === i).sort(ratCmp)
}
