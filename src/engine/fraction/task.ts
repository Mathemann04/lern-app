import { toLatex } from '../expr/print.ts'
import { type Expr, add, div, mul, neg } from '../expr/types.ts'
import { type Factored, factoredExpr, factoredPoly } from './factor.ts'
import { type Frac, fracAdd, fracDiv, fracMul, fracNeg, fracOf, polyExpr } from './frac.ts'
import { isOne } from '../rational.ts'
import { type Poly, constValue, polyConst } from './poly.ts'

// Bruchaufgaben in Aufgabenform: welche Rechnung, und wie Zähler und Nenner geschrieben sind
// (ausmultipliziert wie x² − 9 oder in Faktoren wie 2(x + 3)).

// Ein Term der Aufgabe, so geschrieben wie gezeigt. ascending: kleinster Grad zuerst (3 − x).
export type Shown =
  | { readonly form: 'expanded'; readonly poly: Poly; readonly ascending?: boolean }
  | { readonly form: 'factored'; readonly factored: Factored }

// Ein Bruch; mit Nenner 1 eine ganze Zahl oder ein Term ohne Bruch
export type Part = { readonly num: Shown; readonly den: Shown }
export type Signed = { readonly sign: 1 | -1; readonly part: Part }

export type FractionShape =
  // Kürzen
  | { readonly kind: 'reduce'; readonly part: Part }
  // Plus und minus, auch mit ganzen Zahlen
  | { readonly kind: 'sum'; readonly terms: readonly Signed[] }
  | { readonly kind: 'product'; readonly left: Part; readonly right: Part }
  | { readonly kind: 'quotient'; readonly left: Part; readonly right: Part }
  // Doppelbruch: oben und unten je eine Summe
  | { readonly kind: 'complex'; readonly top: readonly Signed[]; readonly bottom: readonly Signed[] }

// hints: Faktoren, aus denen die Vorlage Zähler und Nenner gebaut hat (fürs Zerlegen)
export type FractionTask = FractionShape & { readonly hints: readonly Poly[] }

// --- Bauhelfer ---

export const expanded = (poly: Poly, ascending = false): Shown => ({ form: 'expanded', poly, ascending })
export const factoredShown = (factored: Factored): Shown => ({ form: 'factored', factored })
export const part = (num: Shown, den: Shown = expanded(polyConst(1))): Part => ({ num, den })
export const plus = (p: Part): Signed => ({ sign: 1, part: p })
export const minus = (p: Part): Signed => ({ sign: -1, part: p })

// --- Werte und Schreibweise ---

export const shownPoly = (s: Shown): Poly => (s.form === 'expanded' ? s.poly : factoredPoly(s.factored))

export function shownExpr(s: Shown): Expr {
  return s.form === 'expanded' ? polyExpr(s.poly, s.ascending ? 'ascending' : 'descending') : factoredExpr(s.factored)
}

// Nenner 1: ganze Zahl oder Term ohne Bruch
export function isWhole(p: Part): boolean {
  const den = constValue(shownPoly(p.den))
  return den !== null && isOne(den)
}

export const partFrac = (p: Part): Frac => ({ num: shownPoly(p.num), den: shownPoly(p.den) })

export const partExpr = (p: Part): Expr => (isWhole(p) ? shownExpr(p.num) : div(shownExpr(p.num), shownExpr(p.den)))

export function signedExpr(terms: readonly Signed[]): Expr {
  return add(...terms.map((t) => (t.sign < 0 ? neg(partExpr(t.part)) : partExpr(t.part))))
}

export function signedFrac(terms: readonly Signed[]): Frac {
  return terms.reduce((sum, t) => fracAdd(sum, t.sign < 0 ? fracNeg(partFrac(t.part)) : partFrac(t.part)), fracOf([]))
}

// Wert der Aufgabe als Bruch aus Polynomen
export function taskFrac(t: FractionShape): Frac {
  switch (t.kind) {
    case 'reduce':
      return partFrac(t.part)
    case 'sum':
      return signedFrac(t.terms)
    case 'product':
      return fracMul(partFrac(t.left), partFrac(t.right))
    case 'quotient':
      return fracDiv(partFrac(t.left), partFrac(t.right))
    case 'complex':
      return fracDiv(signedFrac(t.top), signedFrac(t.bottom))
  }
}

// Aufgabe als Term (bei „geteilt durch" als Bruch, gleicher Wert); für Werte und Prüfstellen
export function taskExpr(t: FractionShape): Expr {
  switch (t.kind) {
    case 'reduce':
      return partExpr(t.part)
    case 'sum':
      return signedExpr(t.terms)
    case 'product':
      return mul(partExpr(t.left), partExpr(t.right))
    case 'quotient':
      return div(partExpr(t.left), partExpr(t.right))
    case 'complex':
      return div(signedExpr(t.top), signedExpr(t.bottom))
  }
}

// Aufgabe als LaTeX, wie sie gestellt wird (geteilt mit Doppelpunkt)
export function taskLatex(t: FractionShape): string {
  if (t.kind === 'quotient') return `${toLatex(partExpr(t.left))} : ${toLatex(partExpr(t.right))}`
  return toLatex(taskExpr(t))
}

export function instructionFor(t: FractionShape): string {
  switch (t.kind) {
    case 'reduce':
      return 'Kürze so weit wie möglich.'
    case 'sum':
      return 'Fasse zu einem Bruch zusammen und kürze so weit wie möglich.'
    case 'product':
    case 'quotient':
      return 'Berechne und kürze so weit wie möglich.'
    case 'complex':
      return 'Vereinfache den Doppelbruch so weit wie möglich.'
  }
}

// Alle Brüche der Aufgabe (für Nenner und Definitionsbereich)
export function partsOf(t: FractionShape): Part[] {
  switch (t.kind) {
    case 'reduce':
      return [t.part]
    case 'sum':
      return t.terms.map((s) => s.part)
    case 'product':
    case 'quotient':
      return [t.left, t.right]
    case 'complex':
      return [...t.top, ...t.bottom].map((s) => s.part)
  }
}
