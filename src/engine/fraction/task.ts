import { toLatex } from '../expr/print.ts'
import { type Expr, add, div, mul, mulDot, neg, num, pow, sub } from '../expr/types.ts'
import { type Factored, factoredExpr, factoredPoly } from './factor.ts'
import { type Frac, fracAdd, fracDiv, fracMul, fracNeg, fracOf, polyExpr, rootPoly } from './frac.ts'
import { isOne } from '../rational.ts'
import { type Poly, atomsOf, constValue, polyAtom, polyConst, polyMul, polySub, polySubstitute } from './poly.ts'

// Bruchaufgaben in Aufgabenform: welche Rechnung, und wie Zähler und Nenner geschrieben sind
// (ausmultipliziert wie x² − 9 oder in Faktoren wie 2(x + 3)).

// Ein Term der Aufgabe, so geschrieben wie gezeigt. ascending: kleinster Grad zuerst (3 − x).
// binomial: Quadrat einer Summe minus ein Term, z. B. (x + h)² − x² (Stufe 5: erst ausmultiplizieren)
export type Shown =
  | { readonly form: 'expanded'; readonly poly: Poly; readonly ascending?: boolean }
  | { readonly form: 'factored'; readonly factored: Factored }
  | { readonly form: 'binomial'; readonly base: Poly; readonly minus: Poly }

// Ein Bruch; mit Nenner 1 eine ganze Zahl oder ein Term ohne Bruch
export type Part = { readonly num: Shown; readonly den: Shown }
export type Signed = { readonly sign: 1 | -1; readonly part: Part }

// Doppelbruch im Doppelbruch: als letzter Summand oben (side 'top') oder unten angehängt
export type Inner = {
  readonly side: 'top' | 'bottom'
  readonly sign: 1 | -1
  readonly top: readonly Signed[]
  readonly bottom: readonly Signed[]
}

export type FractionShape =
  // Kürzen
  | { readonly kind: 'reduce'; readonly part: Part }
  // Plus und minus, auch mit ganzen Zahlen
  | { readonly kind: 'sum'; readonly terms: readonly Signed[] }
  | { readonly kind: 'product'; readonly left: Part; readonly right: Part }
  | { readonly kind: 'quotient'; readonly left: Part; readonly right: Part }
  // Doppelbruch: oben und unten je eine Summe
  | { readonly kind: 'complex'; readonly top: readonly Signed[]; readonly bottom: readonly Signed[] }
  // Mehrere Rechenarten: (Summe) mal bzw. geteilt durch (Summe), z. B. (1 + \frac{1}{x - 1}) \cdot \frac{x^2 - 1}{x}
  | { readonly kind: 'mixed'; readonly op: 'mul' | 'div'; readonly left: readonly Signed[]; readonly right: readonly Signed[] }
  // Verschachtelter Doppelbruch: im Zähler oder Nenner steckt noch ein Doppelbruch
  | { readonly kind: 'nested'; readonly top: readonly Signed[]; readonly bottom: readonly Signed[]; readonly inner: Inner }

// Regel eines Bausteins, die der Rechenweg in einem eigenen Schritt anwendet (Stufe 5):
// - trig: sin² x + cos² x = 1; prefer: welcher Baustein übrig bleibt (S: 1 − cos² x → sin² x),
//   target: im Zähler (bei Doppelbrüchen im oberen Bruch) oder im Nenner
// - root: (√x)² = x; der Nenner (√x − a)(√x + a) wird zu x − a²
export type BlockRule = { readonly kind: 'trig'; readonly prefer: 'S' | 'C'; readonly target: 'num' | 'den' } | { readonly kind: 'root' }

// hints: Faktoren, aus denen die Vorlage Zähler und Nenner gebaut hat (fürs Zerlegen)
export type FractionTask = FractionShape & { readonly hints: readonly Poly[]; readonly rule?: BlockRule }

// --- Bauhelfer ---

export const expanded = (poly: Poly, ascending = false): Shown => ({ form: 'expanded', poly, ascending })
export const factoredShown = (factored: Factored): Shown => ({ form: 'factored', factored })
export const binomialShown = (base: Poly, minus: Poly): Shown => ({ form: 'binomial', base, minus })
export const part = (num: Shown, den: Shown = expanded(polyConst(1))): Part => ({ num, den })
export const plus = (p: Part): Signed => ({ sign: 1, part: p })
export const minus = (p: Part): Signed => ({ sign: -1, part: p })

// --- Werte und Schreibweise ---

export function shownPoly(s: Shown): Poly {
  switch (s.form) {
    case 'expanded':
      return s.poly
    case 'factored':
      return factoredPoly(s.factored)
    case 'binomial':
      return polySub(polyMul(s.base, s.base), s.minus)
  }
}

export function shownExpr(s: Shown): Expr {
  switch (s.form) {
    case 'expanded':
      return polyExpr(s.poly, s.ascending ? 'ascending' : 'descending')
    case 'factored':
      return factoredExpr(s.factored)
    case 'binomial':
      return sub(pow(polyExpr(s.base), num(2)), polyExpr(s.minus))
  }
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

// Der innere Doppelbruch als eigene Aufgabe
export function innerTask(t: Extract<FractionShape, { kind: 'nested' }>, hints: readonly Poly[]): FractionTask {
  return { kind: 'complex', top: t.inner.top, bottom: t.inner.bottom, hints }
}

const innerFrac = (inner: Inner): Frac => fracDiv(signedFrac(inner.top), signedFrac(inner.bottom))
const innerExpr = (inner: Inner): Expr => div(signedExpr(inner.top), signedExpr(inner.bottom))

// Oben bzw. unten im verschachtelten Doppelbruch: die Summanden mit dem inneren Doppelbruch
function withInner(terms: readonly Signed[], inner: Inner, side: 'top' | 'bottom', value: Frac): Frac {
  const own = signedFrac(terms)
  if (inner.side !== side) return own
  return fracAdd(own, inner.sign < 0 ? fracNeg(value) : value)
}

function withInnerExpr(terms: readonly Signed[], inner: Inner, side: 'top' | 'bottom'): Expr {
  if (inner.side !== side) return signedExpr(terms)
  const e = innerExpr(inner)
  return add(...[...terms.map((t) => (t.sign < 0 ? neg(partExpr(t.part)) : partExpr(t.part))), inner.sign < 0 ? neg(e) : e])
}

// Doppelbruch, in dem der innere Doppelbruch durch einen Bruch (sein Ergebnis) ersetzt ist
export function replaceInner(t: Extract<FractionShape, { kind: 'nested' }>, result: Part, hints: readonly Poly[]): FractionTask {
  const add = (terms: readonly Signed[], side: 'top' | 'bottom') => (t.inner.side === side ? [...terms, { sign: t.inner.sign, part: result }] : terms)
  return { kind: 'complex', top: add(t.top, 'top'), bottom: add(t.bottom, 'bottom'), hints }
}

// Oberer bzw. unterer Teil eines (verschachtelten) Doppelbruchs als Bruch
export function topFrac(t: FractionShape): Frac | null {
  if (t.kind === 'complex') return signedFrac(t.top)
  if (t.kind === 'nested') return withInner(t.top, t.inner, 'top', innerFrac(t.inner))
  return null
}

export function bottomFrac(t: FractionShape): Frac | null {
  if (t.kind === 'complex') return signedFrac(t.bottom)
  if (t.kind === 'nested') return withInner(t.bottom, t.inner, 'bottom', innerFrac(t.inner))
  return null
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
    case 'mixed':
      return t.op === 'mul' ? fracMul(signedFrac(t.left), signedFrac(t.right)) : fracDiv(signedFrac(t.left), signedFrac(t.right))
    case 'nested': {
      const inner = innerFrac(t.inner)
      return fracDiv(withInner(t.top, t.inner, 'top', inner), withInner(t.bottom, t.inner, 'bottom', inner))
    }
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
    case 'mixed':
      return t.op === 'mul' ? mulDot(signedExpr(t.left), signedExpr(t.right)) : div(signedExpr(t.left), signedExpr(t.right))
    case 'nested':
      return div(withInnerExpr(t.top, t.inner, 'top'), withInnerExpr(t.bottom, t.inner, 'bottom'))
  }
}

// Summe in Klammern, einzelner Bruch ohne
function sideLatex(terms: readonly Signed[]): string {
  const latex = toLatex(signedExpr(terms))
  if (terms.length === 1 && terms[0].sign > 0) return latex
  return latex.includes('\\frac') ? `\\left(${latex}\\right)` : `(${latex})`
}

// Aufgabe als LaTeX, wie sie gestellt wird (geteilt mit Doppelpunkt). Im verschachtelten
// Doppelbruch alle Brüche in voller Größe (sonst wird der innerste am Handy zu klein)
export function taskLatex(t: FractionShape): string {
  if (t.kind === 'quotient') return `${toLatex(partExpr(t.left))} : ${toLatex(partExpr(t.right))}`
  if (t.kind === 'mixed' && t.op === 'div') return `${sideLatex(t.left)} : ${sideLatex(t.right)}`
  if (t.kind === 'nested') return toLatex(taskExpr(t)).replaceAll('\\frac', '\\dfrac')
  return toLatex(taskExpr(t))
}

// Kann die Mathe-Tastatur die Aufgabe so lesen? (Geteilt mit „:" nicht)
export const isReadableTask = (t: FractionShape) => t.kind !== 'quotient' && !(t.kind === 'mixed' && t.op === 'div')

export function instructionFor(t: FractionShape): string {
  switch (t.kind) {
    case 'reduce':
      return 'Kürze so weit wie möglich.'
    case 'sum':
      return 'Fasse zu einem Bruch zusammen und kürze so weit wie möglich.'
    case 'product':
    case 'quotient':
    case 'mixed':
      return 'Berechne und kürze so weit wie möglich.'
    case 'complex':
    case 'nested':
      return 'Vereinfache den Doppelbruch so weit wie möglich.'
  }
}

// Aufgabe mit Wurzel durchgehend in √x geschrieben: x wird zu (√x)², damit die Engine nur mit
// einem Baustein rechnet (für Aufgaben, die aus Termen gebaut werden, z. B. auf Lernkarten)
export function withRoots(t: FractionTask): FractionTask {
  if (!partsOf(t).some((p) => [shownPoly(p.num), shownPoly(p.den)].some((q) => atomsOf(q).includes('R')))) return t
  const toRoot = (q: Poly) => polySubstitute(q, 'x', polyAtom('R', 2))
  const shown = (s: Shown): Shown => {
    switch (s.form) {
      case 'expanded':
        return { ...s, poly: toRoot(s.poly) }
      case 'binomial':
        return { ...s, base: toRoot(s.base), minus: toRoot(s.minus) }
      case 'factored':
        return s
    }
  }
  const mapPart = (p: Part): Part => ({ num: shown(p.num), den: shown(p.den) })
  const mapSigned = (terms: readonly Signed[]) => terms.map((x) => ({ sign: x.sign, part: mapPart(x.part) }))
  const hints = t.hints.map(rootPoly)
  switch (t.kind) {
    case 'reduce':
      return { ...t, part: mapPart(t.part), hints }
    case 'sum':
      return { ...t, terms: mapSigned(t.terms), hints }
    case 'product':
    case 'quotient':
      return { ...t, left: mapPart(t.left), right: mapPart(t.right), hints }
    case 'complex':
      return { ...t, top: mapSigned(t.top), bottom: mapSigned(t.bottom), hints }
    case 'mixed':
      return { ...t, left: mapSigned(t.left), right: mapSigned(t.right), hints }
    case 'nested':
      return { ...t, top: mapSigned(t.top), bottom: mapSigned(t.bottom), inner: { ...t.inner, top: mapSigned(t.inner.top), bottom: mapSigned(t.inner.bottom) }, hints }
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
    case 'mixed':
      return [...t.left, ...t.right].map((s) => s.part)
    case 'nested':
      return [...t.top, ...t.bottom, ...t.inner.top, ...t.inner.bottom].map((s) => s.part)
  }
}
