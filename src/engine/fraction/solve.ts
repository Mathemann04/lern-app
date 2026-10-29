import { type Expr, add, div, mul, mulDot, neg, num } from '../expr/types.ts'
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
} from './factor.ts'
import { type Frac, polyExpr, startsNegative } from './frac.ts'
import { type Poly, atomsOf, constValue, polyDivideExact, polyMul, polyNeg, polySum } from './poly.ts'
import {
  type FractionTask,
  type Part,
  type Shown,
  type Signed,
  isWhole,
  part,
  partExpr,
  partFrac,
  partsOf,
  shownExpr,
  shownPoly,
  signedFrac,
  taskFrac,
} from './task.ts'

// Rechenweg einer Bruchaufgabe wie im Skript: Hauptnenner, erweitern, Zähler zusammenfassen,
// zerlegen, kürzen, mit dem Kehrwert malnehmen, Doppelbruch auflösen. Jeder Schritt zeigt den
// ganzen Zwischenstand; alle Schritte haben denselben Wert wie die Aufgabe (Tests prüfen das).

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
}

export type FracStep = {
  readonly kind: StepKind
  // ganzer Zwischenstand nach dem Schritt; beim Hauptnenner null
  readonly expr: Expr | null
  // Hauptnenner, Zerlegung oder der gekürzte Faktor
  readonly detail?: Expr
  // beim Kürzen: Zähler und Nenner in Faktoren, bevor gekürzt wird
  readonly before?: Expr
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

// Summe so, dass sie möglichst mit Plus beginnt: 3 − x statt −x + 3
export function nicePolyExpr(p: Poly): Expr {
  if (p.length >= 2 && startsNegative(p) && !startsNegative([...p].reverse())) return polyExpr(p, 'ascending')
  return polyExpr(p)
}

// Bruch aus Zähler (ausmultipliziert) und Nenner in Faktoren; Nenner 1 → nur der Zähler
export function fractionExpr(numerator: Poly, den: Factored): Expr {
  if (isOneFactored(den) || numerator.length === 0) return nicePolyExpr(numerator)
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

function productSteps(left: Part, right: Part, hints: readonly Poly[]): { steps: FracStep[]; raw: Frac } {
  const nums = [left.num, right.num].map(shownExpr)
  const dens = [left, right].filter((p) => !isWhole(p)).map((p) => shownExpr(p.den))
  const multiplied = dens.length === 0 ? productExpr(nums) : div(productExpr(nums), productExpr(dens))
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
  if (side.work) return div(factoredExpr(side.work.lcd), nicePolyExpr(side.work.numerator))
  const den = constValue(side.frac.den)
  if (den && isOne(den)) return div(num(1), side.expr)
  return side.expr.kind === 'div' ? div(side.expr.den, side.expr.num) : div(num(1), side.expr)
}

export function solveFraction(t: FractionTask): FracSolution {
  const { hints } = t
  const value = taskFrac(t)
  const steps: FracStep[] = []
  let beforeCancel: Frac = value

  switch (t.kind) {
    case 'reduce': {
      const fd = factorize(shownPoly(t.part.den), hints)
      const fn = factorize(shownPoly(t.part.num), [...fd.factors.map((f) => f.poly), ...hints])
      let numExpr = shownExpr(t.part.num)
      let denExpr = shownExpr(t.part.den)
      if (t.part.num.form === 'expanded' && t.part.num.poly.length > 1 && splits(fn)) {
        numExpr = factoredExpr(fn)
        steps.push({ kind: 'factor-num', expr: div(numExpr, denExpr), detail: numExpr })
      }
      if (t.part.den.form === 'expanded' && t.part.den.poly.length > 1 && splits(fd)) {
        denExpr = factoredExpr(fd)
        steps.push({ kind: 'factor-den', expr: div(numExpr, denExpr), detail: denExpr })
      }
      beforeCancel = partFrac(t.part)
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
      const top = sideOf(t.top, hints)
      const bottom = sideOf(t.bottom, hints)
      if (top.combined) steps.push({ kind: 'inner-num', expr: div(top.expr, signedExprOf(t.bottom)) })
      if (bottom.combined) steps.push({ kind: 'inner-den', expr: div(top.expr, bottom.expr) })
      steps.push({ kind: 'reciprocal', expr: mulDot(top.expr, reciprocalExpr(bottom)) })
      beforeCancel = { num: polyMul(top.frac.num, bottom.frac.den), den: polyMul(top.frac.den, bottom.frac.num) }
      break
    }
  }
  return finish(t, value, steps, beforeCancel, false)
}

function signedExprOf(terms: readonly Signed[]): Expr {
  return signedSum(terms.map((t) => ({ sign: t.sign, expr: partExpr(t.part) })))
}

function finish(t: FractionTask, value: Frac, steps: FracStep[], beforeCancel: Frac, cancelDone: boolean): FracSolution {
  // Faktoren der Nenner in der Reihenfolge der Aufgabe, damit das Ergebnis sie genauso schreibt
  const order = partsOf(t).flatMap((p) => factorize(shownPoly(p.den), t.hints).factors.map((f) => f.poly))
  const hints = [...order, ...t.hints]
  const reduced = reduceFrac(value, hints)
  if (!cancelDone) {
    const cancel = cancelStep(beforeCancel, reduceFrac(beforeCancel, hints), hints)
    if (cancel) steps.push(cancel)
  }
  return { value, steps, reduced, result: reducedExpr(reduced), excluded: excludedValues(t), beforeCancel }
}

// --- Definitionsbereich ---

// Nullstellen eines Polynoms in x; null, wenn es andere Buchstaben enthält oder sich nicht
// in Linearfaktoren zerlegen lässt, aber Nullstellen hat
function zerosInX(p: Poly, hints: readonly Poly[]): Rational[] | null {
  if (atomsOf(p).some((a) => a !== 'x')) return null
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

export function excludedValues(t: FractionTask): Rational[] | null {
  const polys = partsOf(t).map((p) => shownPoly(p.den))
  if (t.kind === 'quotient') polys.push(shownPoly(t.right.num))
  if (t.kind === 'complex') polys.push(signedFrac(t.bottom).num)
  const all: Rational[] = []
  for (const p of polys) {
    const zeros = zerosInX(p, t.hints)
    if (zeros === null) return null
    all.push(...zeros)
  }
  return all.filter((r, i) => all.findIndex((o) => ratEq(o, r)) === i).sort(ratCmp)
}
