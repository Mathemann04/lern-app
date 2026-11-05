import { contains, key, subterms } from '../expr/compare.ts'
import { toLatex } from '../expr/print.ts'
import { type Equation, type Expr, add, asRational, div, eq, mul, neg, num, pow, root, sqrt, variable } from '../expr/types.ts'
import { type Factored, factoredDivide, factoredLcm, factoredPoly, factorize, reduceFrac } from '../fraction/factor.ts'
import type { Frac } from '../fraction/frac.ts'
import {
  type Poly,
  constValue,
  degreeIn,
  polyAdd,
  polyAtom,
  polyDivideExact,
  polyEquals,
  polyMul,
  polyPow,
  polyScale,
} from '../fraction/poly.ts'
import { isInteger, isOne, isZero, rat, ratEq, ratNeg, ratSign } from '../rational.ts'
import {
  type Atoms,
  RADICAL_ATOM,
  ROOT_ATOM,
  contentExpr,
  monomialSqrt,
  newAtoms,
  niceFrac,
  polyToExpr,
  radicalAtoms,
  toPoly,
  toRat,
} from './algebra.ts'

// Rechenweg beim Umstellen: Schritt für Schritt nach der gesuchten Variable auflösen, wie im Skript.
//
// Kommt die Variable in nur einem Teil einer Seite vor, werden die Rechnungen um sie herum von außen
// nach innen rückgängig gemacht („schälen"): Summanden rüberbringen, durch Faktoren teilen, mit
// Nennern malnehmen, Kehrwert, Wurzel ziehen, quadrieren. Sonst (Variable mehrfach, z. B. in
// Zähler und Nenner oder auf beiden Seiten): eine Wurzel mit der Variable allein stellen und
// quadrieren, mit dem Hauptnenner malnehmen, ausmultiplizieren, alles mit der Variable nach links,
// ausklammern, teilen. Kommt √x vor, ist √x die Unbekannte (x = (√x)²).
// Jeder Schritt zeigt die ganze Gleichung danach in Aufgabenform; alle Gleichungen haben an den
// erlaubten Stellen dieselbe Lösung (Tests prüfen das durch Einsetzen).

export type StepKind =
  | 'add'
  | 'move'
  | 'multiply'
  | 'divide'
  | 'negate'
  | 'reciprocal'
  | 'square'
  | 'root'
  | 'combine'
  | 'extend'
  | 'expand'
  | 'collect'
  | 'factor'
  | 'finish'

export const STEP_NAMES: Record<StepKind, string> = {
  add: 'Auf beiden Seiten addieren',
  move: 'Summand auf die andere Seite',
  multiply: 'Beide Seiten malnehmen',
  divide: 'Beide Seiten teilen',
  negate: 'Beide Seiten mal (−1)',
  reciprocal: 'Kehrwert auf beiden Seiten',
  square: 'Beide Seiten quadrieren',
  root: 'Wurzel ziehen',
  combine: 'Zu einem Bruch zusammenfassen',
  extend: 'Doppelbruch erweitern',
  expand: 'Ausmultiplizieren',
  collect: 'Variable nach links, Rest nach rechts',
  factor: 'Ausklammern',
  finish: 'Ergebnis',
}

// Beschreibung eines Schritts als Text mit Formeln, z. B. „Auf beiden Seiten $-c$", „Beide Seiten
// durch $(y - 2)$"
export function stepLabel(step: RearrangeStep, target: string): string {
  const operand = step.operand ? toLatex(step.operand) : ''
  const factor = step.operand && (step.operand.kind === 'add' || isNegative(step.operand)) ? `(${operand})` : operand
  // mit √x als Unbekannter wird √x sortiert und ausgeklammert
  const unknown = hasTargetRoot(step.after, target) ? `$\\sqrt{${target}}$` : `$${target}$`
  switch (step.kind) {
    case 'add':
      return `Auf beiden Seiten $${isNegative(firstTerm(step.operand!)) ? '' : '+'}${operand}$`
    case 'move':
      return `$${operand}$ auf die andere Seite bringen`
    case 'multiply':
      return `Beide Seiten mal $${factor}$`
    case 'divide':
      return `Beide Seiten durch $${factor}$`
    case 'negate':
      return 'Beide Seiten mal $(-1)$'
    case 'root':
      return step.operand && toLatex(step.operand) === '3' ? 'Dritte Wurzel ziehen' : 'Wurzel ziehen'
    case 'collect':
      // mit einer Wurzel wie √(x − a): die Wurzel nach links
      return `Alles mit ${step.operand ? `$${operand}$` : unknown} nach links, den Rest nach rechts`
    case 'factor':
      // mit einer Wurzel wie √(x − a): die Wurzel ausklammern
      return `${step.operand ? `$${operand}$` : unknown} ausklammern`
    case 'finish':
      return step.swapOnly ? 'Seiten tauschen' : 'Zu einem Bruch zusammenfassen'
    case 'expand':
      return 'Die Klammern ausmultiplizieren'
    case 'extend':
      return `Den Doppelbruch mit $${operand}$ erweitern`
    case 'combine':
      return `Die ${step.side === 'rhs' ? 'linke' : 'rechte'} Seite zu einem Bruch zusammenfassen`
    default:
      return STEP_NAMES[step.kind]
  }
}

export type Side = 'lhs' | 'rhs'

export type RearrangeStep = {
  readonly kind: StepKind
  // was auf beiden Seiten addiert, womit malgenommen bzw. wodurch geteilt wird; beim Rüberbringen
  // der Summand mit der Variable; beim Wurzelziehen die Wurzel-Stufe
  readonly operand?: Expr
  readonly before: Equation
  readonly after: Equation
  // Seite mit der gesuchten Variable vor dem Schritt, wenn nur sie geschält wird
  readonly side?: Side
  // nur die Seiten getauscht (Ergebnis stand schon fertig da)
  readonly swapOnly?: boolean
  // beim Quadrieren einer Wurzel: Die andere Seite muss ≥ 0 sein, sonst gibt es keine Lösung
  readonly requires?: Expr
}

export type RearrangeSolution = {
  readonly target: string
  readonly steps: readonly RearrangeStep[]
  // rechte Seite von „x = …" in Endform
  readonly result: Expr
  // Terme, die ≥ 0 sein müssen, damit es eine Lösung gibt (aus dem Quadrieren von Wurzeln)
  readonly requires: readonly Expr[]
}

const MAX_STEPS = 30

// --- Schreibweise der Zwischenstände ---

const isZeroExpr = (e: Expr) => e.kind === 'num' && isZero(e.value)
const isOneExpr = (e: Expr) => e.kind === 'num' && isOne(e.value)

// Beginnt der Term mit einem Minus?
export function isNegative(e: Expr): boolean {
  if (e.kind === 'neg') return true
  if (e.kind === 'num') return ratSign(e.value) < 0
  return e.kind === 'mul' && e.factors[0]?.kind === 'num' && ratSign(e.factors[0].value) < 0
}

const termsOf = (e: Expr): readonly Expr[] => (e.kind === 'add' ? e.terms : [e])
const firstTerm = (e: Expr): Expr => (e.kind === 'add' ? e.terms[0] : e)

function sumOf(terms: readonly Expr[]): Expr {
  const kept = terms.filter((t) => !isZeroExpr(t))
  if (kept.length === 0) return num(0)
  return kept.length === 1 ? kept[0] : add(...kept)
}

// −e, schön geschrieben: −(a/y − b) → b − a/y
export function negated(e: Expr): Expr {
  switch (e.kind) {
    case 'num':
      return num(ratNeg(e.value))
    case 'neg':
      return e.arg
    case 'add': {
      const terms = e.terms.map(negated)
      return add(...terms.filter((t) => !isNegative(t)), ...terms.filter(isNegative))
    }
    case 'mul': {
      const [first, ...rest] = e.factors
      if (first.kind === 'num' && ratSign(first.value) < 0) {
        const abs = ratNeg(first.value)
        return isOne(abs) ? mul(...rest) : mul(num(abs), ...rest)
      }
      return neg(e)
    }
    default:
      return neg(e)
  }
}

const sameTerm = (a: Expr, b: Expr) => {
  if (key(a) === key(b)) return true
  const ra = asRational(a)
  const rb = asRational(b)
  return ra !== null && rb !== null && ratEq(ra, rb)
}

// side + term; hebt sich der Summand weg, verschwindet er: (y − c) + c → y
export function plusTerm(side: Expr, term: Expr): Expr {
  const opposite = negated(term)
  const terms = termsOf(side)
  const i = terms.findIndex((t) => sameTerm(t, opposite))
  if (i >= 0) return sumOf(terms.filter((_, j) => j !== i))
  if (isZeroExpr(side)) return term
  return add(...terms, term)
}

// Produkt aus Zahlen und Buchstaben-Potenzen?
function isMonomial(e: Expr): boolean {
  switch (e.kind) {
    case 'num':
    case 'var':
      return true
    case 'pow': {
      const k = asRational(e.exp)
      return e.base.kind === 'var' && k !== null && isInteger(k) && ratSign(k) > 0
    }
    case 'mul':
      return e.factors.every(isMonomial)
    default:
      return false
  }
}

const anyAtoms = () => newAtoms('')

function monomialProduct(a: Expr, b: Expr): Expr {
  const atoms = anyAtoms()
  return polyToExpr(polyMul(toPoly(a, atoms)!, toPoly(b, atoms)!), atoms)
}

// side · f, wie man es hinschreibt: b(y − c), y(x − 3), \frac{a}{b} · b → a
export function timesFactor(side: Expr, f: Expr): Expr {
  if (isOneExpr(f)) return side
  if (isOneExpr(side)) return f
  if (side.kind === 'neg') return negated(timesFactor(side.arg, f))
  if (side.kind === 'div') {
    if (key(side.den) === key(f)) return side.num
    if (side.den.kind === 'mul' && side.den.factors.some((g) => key(g) === key(f))) {
      const rest = side.den.factors.filter((g) => key(g) !== key(f))
      return div(side.num, mul(...rest))
    }
    if (isMonomial(side.den) && isMonomial(f)) {
      const atoms = anyAtoms()
      const q = polyDivideExact(toPoly(f, atoms)!, toPoly(side.den, atoms)!)
      if (q && q.length === 1) return timesFactor(side.num, polyToExpr(q, atoms))
    }
    return div(timesFactor(side.num, f), side.den)
  }
  if (isMonomial(side) && isMonomial(f)) return monomialProduct(side, f)
  // Produkte aus Buchstaben und Klammern: Buchstaben vorn zusammen, y · b(x + c) → by(x + c)
  const merged = mergedProduct(side, f)
  if (merged) return merged
  if (isMonomial(f)) return mul(f, side)
  return mul(side, f)
}

const factorsOf = (e: Expr): readonly Expr[] => (e.kind === 'mul' ? e.factors : [e])
const isBracket = (e: Expr) => e.kind === 'add' || (e.kind === 'pow' && e.base.kind === 'add')

function mergedProduct(side: Expr, f: Expr): Expr | null {
  const all = [...factorsOf(side), ...factorsOf(f)]
  if (!all.every((g) => isMonomial(g) || isBracket(g))) return null
  const monos = all.filter(isMonomial)
  const brackets = all.filter((g) => !isMonomial(g))
  if (monos.length === 0 || brackets.length === 0) return null
  const front = monos.reduce((acc, g) => monomialProduct(acc, g))
  return isOneExpr(front) ? mul(...brackets) : mul(front, ...brackets)
}

// side / d: Faktor streichen, wenn er dasteht (b(y − c) : b → y − c), sonst als Bruch
export function dividedBy(side: Expr, d: Expr): Expr {
  if (isOneExpr(d)) return side
  if (side.kind === 'neg') return negated(dividedBy(side.arg, d))
  if (key(side) === key(d)) return num(1)
  if (side.kind === 'mul') {
    const i = side.factors.findIndex((g) => key(g) === key(d))
    if (i >= 0) return mul(...side.factors.filter((_, j) => j !== i))
    // a\left(d - \frac{b}{c}\right) : 8 → \frac{a}{8}\left(d - \frac{b}{c}\right) statt Bruch im Bruch
    const monos = side.factors.filter(isMonomial)
    const rest = side.factors.filter((g) => !isMonomial(g))
    if (monos.length > 0 && isMonomial(d) && rest.some((g) => subterms(g).some((h) => h.kind === 'div'))) {
      return mul(finalForm(div(mul(...monos), d)), ...rest)
    }
  }
  // Summe mit Brüchen: jeden Summanden teilen (\frac{d + c}{5a} + \frac{b}{5})
  if (side.kind === 'add' && side.terms.some((x) => x.kind === 'div' || (x.kind === 'neg' && x.arg.kind === 'div'))) {
    return add(...side.terms.map((x) => dividedBy(x, d)))
  }
  if (isMonomial(side) && isMonomial(d)) {
    const atoms = anyAtoms()
    const q = polyDivideExact(toPoly(side, atoms)!, toPoly(d, atoms)!)
    if (q && q.length === 1) return polyToExpr(q, atoms)
  }
  if (side.kind === 'div') return div(side.num, timesFactor(side.den, d))
  return div(side, d)
}

// Kehrwert einer Seite: \frac{x - b}{bx} → \frac{bx}{x - b}, w → \frac{1}{w}
function reciprocal(e: Expr): Expr {
  if (e.kind === 'div') return isOneExpr(e.num) ? e.den : div(e.den, e.num)
  return div(num(1), e)
}

// Quadrat einer Seite: Monome und Brüche aus Monomen ausgerechnet (\frac{y^2}{a^2}), sonst mit Klammer
export function squared(e: Expr): Expr {
  const atoms = anyAtoms()
  if (isMonomial(e)) return monomialProduct(e, e)
  if (e.kind === 'div' && isMonomial(e.den)) {
    const d = toPoly(e.den, atoms)!
    return div(squared(e.num), polyToExpr(polyMul(d, d), atoms))
  }
  return pow(e, num(2))
}

// --- Endform ---

// Endform einer Seite ohne die gesuchte Variable: ein Bruch, gekürzt; Wurzel aus einem Bruch mit
// Quadrat im Nenner als \frac{\sqrt{…}}{a}; Quadrat eines Bruchs als \frac{(…)^2}{4y^2}
export function finalForm(e: Expr): Expr {
  if (alreadyFinal(e)) return e
  const atoms = anyAtoms()
  if (e.kind === 'root' && e.index === 2) {
    const f = toRat(e.arg, atoms)
    if (f) return rootForm(f, atoms)
  }
  if (e.kind === 'pow' && isSquare(e) && !isMonomial(e.base)) {
    const f = toRat(e.base, atoms)
    if (f) return squareForm(f, atoms)
  }
  if (e.kind === 'div' && isSquareOfSum(e.num)) {
    const rd = monomialSqrt(toPoly(e.den, atoms) ?? [])
    const base = (e.num as Extract<Expr, { kind: 'pow' }>).base
    const f = rd && toRat(div(base, polyToExpr(rd, atoms)), atoms)
    if (f) return squareForm(f, atoms)
  }
  const f = toRat(e, atoms)
  return f ? niceFrac(f, atoms) : e
}

const isSquare = (e: Extract<Expr, { kind: 'pow' }>) => {
  const k = asRational(e.exp)
  return k !== null && k.n === 2n && k.d === 1n
}
const isSquareOfSum = (e: Expr) => e.kind === 'pow' && e.base.kind === 'add' && isSquare(e)

function reduced(f: Frac): { n: Poly; d: Poly } {
  const atoms = anyAtoms()
  const nice = niceFrac(f, atoms)
  const back = toRat(nice, atoms)!
  return { n: back.num, d: back.den }
}

function rootForm(f: Frac, atoms: Atoms): Expr {
  const { n, d } = reduced(f)
  const rn = monomialSqrt(n)
  const rd = monomialSqrt(d)
  const dOne = constValue(d) !== null && isOne(constValue(d)!)
  if (rn && rd) return niceFrac({ num: rn, den: rd }, atoms)
  if (dOne) return sqrt(contentExpr(n, atoms))
  if (rd) return div(sqrt(polyToExpr(n, atoms)), polyToExpr(rd, atoms))
  return sqrt(niceFrac(f, atoms))
}

function squarePart(p: Poly, atoms: Atoms): Expr {
  if (p.length === 1) return polyToExpr(polyMul(p, p), atoms)
  return pow(polyToExpr(p, atoms), num(2))
}

// Quadrat eines Bruchs: \frac{(a - y^2)^2}{4y^2}, mit einer Summe im Nenner als Ganzes:
// \left(\frac{by + a}{y - 1}\right)^2
function squareForm(f: Frac, atoms: Atoms): Expr {
  const { n, d } = reduced(f)
  const dConst = constValue(d)
  if (dConst && isOne(dConst)) return squarePart(n, atoms)
  if (d.length > 1) return pow(niceFrac(f, atoms), num(2))
  return div(squarePart(n, atoms), squarePart(d, atoms))
}

// --- Schritte ---

type Draft = Omit<RearrangeStep, 'before'>

const at = (side: Side, tPart: Expr, other: Expr): Equation => (side === 'lhs' ? eq(tPart, other) : eq(other, tPart))

const isTargetRoot = (e: Expr, t: string) => e.kind === 'root' && e.index === 2 && e.arg.kind === 'var' && e.arg.name === t

// Kommt √t vor? Dann ist √t die Unbekannte
export const hasTargetRoot = (e: Equation, t: string) => subterms(e.lhs).concat(subterms(e.rhs)).some((s) => isTargetRoot(s, t))

// Schälen: die äußerste Rechnung um die Variable auf beiden Seiten rückgängig machen. Steht die
// Variable danach allein und die andere Seite ist ein einzelner Bruch, steht er gleich gekürzt da.
function peel(s: Expr, o: Expr, side: Side, t: string): Draft | null {
  const draft = peelRaw(s, o, side, t)
  if (!draft || !draft.side || draft.kind === 'move') return draft
  const tPart = draft.after[draft.side]
  const other = draft.side === 'lhs' ? draft.after.rhs : draft.after.lhs
  const squareOfFraction = other.kind === 'pow' && isSingleFraction(other.base)
  if (tPart.kind !== 'var' || tPart.name !== t || !(isSingleFraction(other) || squareOfFraction)) return draft
  return { ...draft, after: at(draft.side, tPart, finalForm(other)) }
}

// Bruch aus zwei Termen ohne weitere Brüche
const isSingleFraction = (e: Expr) => e.kind === 'div' && !subterms(e.num).some((x) => x.kind === 'div') && !subterms(e.den).some((x) => x.kind === 'div')

function peelRaw(s: Expr, o: Expr, side: Side, t: string): Draft | null {
  const has = (e: Expr) => contains(e, t)
  switch (s.kind) {
    case 'add': {
      const withT = s.terms.filter(has)
      if (withT.length !== 1) return null
      const [term] = withT
      const others = s.terms.filter((x) => !has(x))
      if (isNegative(term)) {
        // b − x = w → b − w = x: Summand mit der Variable rüber, die andere Seite herüber
        const moved = negated(term)
        const rest = sumOf([...others, ...termsOf(o).map(negated)])
        return { kind: 'move', operand: moved, side, after: side === 'rhs' ? eq(moved, rest) : eq(rest, moved) }
      }
      const operand = others.length === 1 ? negated(others[0]) : sumOf(others.map(negated))
      const other = others.reduce((acc, k) => plusTerm(acc, negated(k)), o)
      return { kind: 'add', operand, side, after: at(side, term, other) }
    }
    case 'neg':
      return { kind: 'negate', side, after: at(side, s.arg, negated(o)) }
    case 'mul': {
      const withT = s.factors.filter(has)
      if (withT.length !== 1) return null
      const rest = s.factors.filter((f) => !has(f))
      const d = mul(...rest)
      return { kind: 'divide', operand: d, side, after: at(side, withT[0], dividedBy(o, d)) }
    }
    case 'div': {
      const inNum = has(s.num)
      const inDen = has(s.den)
      if (inNum && inDen) return null
      if (inNum) return { kind: 'multiply', operand: s.den, side, after: at(side, s.num, timesFactor(o, s.den)) }
      if (isOneExpr(s.num)) {
        // 1/D = O: erst O zu einem Bruch, dann Kehrwert
        if (o.kind === 'add') return { kind: 'combine', side, after: at(side, s, finalForm(o)) }
        return { kind: 'reciprocal', side, after: at(side, s.den, reciprocal(o)) }
      }
      // N/D = O mit Brüchen in O: erst O zu einem Bruch, sonst entsteht später ein Doppelbruch
      if (o.kind === 'add' && subterms(o).some((x) => x.kind === 'div')) return { kind: 'combine', side, after: at(side, s, finalForm(o)) }
      return { kind: 'multiply', operand: s.den, side, after: at(side, s.num, timesFactor(o, s.den)) }
    }
    case 'pow': {
      const k = asRational(s.exp)
      if (has(s.exp) || !k || !isInteger(k) || (k.n !== 2n && k.n !== 3n)) return null
      // erst zu einem Bruch, wenn danach noch weiter umgeformt wird: \sqrt{\frac{qr - s}{r}} statt
      // \sqrt{q - \frac{s}{r}} (bei x^2 = … macht das das Ergebnis)
      if (isSumWithFraction(o) && !isVar(s.base, t)) return { kind: 'combine', side, after: at(side, s, finalForm(o)) }
      return { kind: 'root', operand: num(k), side, after: at(side, s.base, k.n === 2n ? sqrt(o) : root(o, 3)) }
    }
    case 'root':
      if (s.index !== 2) return null
      if (isSumWithFraction(o) && !isVar(s.arg, t)) return { kind: 'combine', side, after: at(side, s, finalForm(o)) }
      return { kind: 'square', side, after: at(side, s.arg, squared(o)), requires: o }
    default:
      return null
  }
}

const isSumWithFraction = (o: Expr) => o.kind === 'add' && subterms(o).some((x) => x.kind === 'div')
const isVar = (e: Expr, t: string) => e.kind === 'var' && e.name === t

// Teilt die Seiten in die mit der Variable (s) und die andere (o)
function split(e: Equation, t: string): { s: Expr; o: Expr; side: Side } | 'both' | null {
  const l = contains(e.lhs, t)
  const r = contains(e.rhs, t)
  if (l && r) return 'both'
  if (l) return { s: e.lhs, o: e.rhs, side: 'lhs' }
  if (r) return { s: e.rhs, o: e.lhs, side: 'rhs' }
  return null
}

// Hat der Knoten die Variable in genau einem Teil (dann lässt er sich schälen)?
function peelable(s: Expr, t: string): boolean {
  const has = (e: Expr) => contains(e, t)
  switch (s.kind) {
    case 'add':
      return s.terms.filter(has).length === 1
    case 'mul':
      return s.factors.filter(has).length === 1
    case 'div':
      return has(s.num) !== has(s.den)
    case 'neg':
    case 'root':
      return true
    case 'pow':
      return !has(s.exp)
    default:
      return false
  }
}

// Wurzel, in der die Variable steckt, außer √x selbst (z. B. √(x + a))
// Bei zwei Wurzeln zuerst die, die schon allein auf einer Seite steht (die wird quadriert)
export function complexRoot(e: Equation, t: string): Expr | null {
  const roots = [e.lhs, e.rhs].flatMap((side) => subterms(side)).filter((s) => s.kind === 'root' && contains(s.arg, t) && !isTargetRoot(s, t))
  return roots.find((r) => key(r) === key(e.lhs) || key(r) === key(e.rhs)) ?? roots[0] ?? null
}

const hasBracket = (e: Expr): boolean =>
  subterms(e).some(
    (s) => (s.kind === 'mul' && s.factors.some((f) => f.kind === 'add')) || (s.kind === 'pow' && s.base.kind === 'add') || (s.kind === 'neg' && s.arg.kind === 'add'),
  )

// (N/D) · lcd, wie man es hinschreibt: N mal den Rest des Hauptnenners
function termTimes(term: Expr, lcd: Factored, atoms: Atoms, written: readonly Expr[] = []): Expr {
  // −\frac{x - b}{3} · 6 → −2(x - b), bei einer Summe mit Klammer: −(x - b)
  if (term.kind === 'neg') {
    const inner = termTimes(term.arg, lcd, atoms, written)
    return inner.kind === 'add' ? neg(inner) : negated(inner)
  }
  if (term.kind === 'div') {
    const d = toPoly(term.den, atoms)
    const k = d && factoredDivide(lcd, factorize(d, lcd.factors.map((f) => f.poly)))
    if (k) return spread(term.num, factoredDisplay(k, atoms, written))
  }
  return spread(term, factoredDisplay(lcd, atoms, written))
}

// Faktoren als Produkt: Zahl und Buchstaben vorn, Klammern dahinter, z. B. 2b(x + b)(x - b);
// Klammern, die so in der Aufgabe stehen (written), wie geschrieben: (\sqrt{x} + a) statt (a + \sqrt{x})
function factoredDisplay(f: Factored, atoms: Atoms, written: readonly Expr[] = []): Expr {
  const monomials = f.factors.filter((g) => g.poly.length === 1)
  const brackets = f.factors.filter((g) => g.poly.length > 1)
  const front = monomials.reduce<Poly>((acc, g) => polyMul(acc, polyPow(g.poly, g.exp)), [{ mono: [], coef: f.coef }])
  const display = (poly: Poly) => written.find((w) => w.kind === 'add' && polyEquals(toPoly(w, atoms) ?? [], poly)) ?? polyToExpr(poly, atoms)
  const parts = brackets.map(({ poly, exp }) => (exp === 1 ? display(poly) : pow(display(poly), num(exp))))
  const c = constValue(front)
  if (parts.length === 0) return polyToExpr(front, atoms)
  return c && isOne(c) ? mul(...parts) : mul(polyToExpr(front, atoms), ...parts)
}

// Wurzel mit der Variable (nicht √x): allein stellen und quadrieren. Steckt sie in einer Klammer
// (nach dem ersten Quadrieren bei zwei Wurzeln), wird mit (√…)² = … ausmultipliziert und die Wurzel
// allein gestellt.
function radicalStep(e: Equation, t: string, r: Expr): Draft | null {
  const inner = r.kind === 'root' ? r.arg : r
  if (key(e.lhs) === key(r)) return { kind: 'square', side: 'lhs', after: eq(inner, squared(e.rhs)), requires: e.rhs }
  if (key(e.rhs) === key(r)) return { kind: 'square', side: 'rhs', after: eq(squared(e.lhs), inner), requires: e.lhs }
  const hasR = (x: Expr) => subterms(x).some((y) => key(y) === key(r))
  const atoms = radicalAtoms(t, r)
  const polysOf = () => {
    const l = atoms && toPoly(e.lhs, atoms)
    const p = atoms && toPoly(e.rhs, atoms)
    return l && p ? { l, r: p } : null
  }
  // mehrere Summanden mit der Wurzel auf einer Seite, auf der anderen keine Variable: ausklammern,
  // 2n\sqrt{x + m} + 2p\sqrt{x + m} = … → \sqrt{x + m}(2n + 2p) = …
  for (const side of ['lhs', 'rhs'] as const) {
    const s = e[side]
    const o = side === 'lhs' ? e.rhs : e.lhs
    if (!atoms || s.kind !== 'add' || !s.terms.every(hasR) || contains(o, t)) continue
    const p = toPoly(s, atoms)
    const c = p && polyDivideExact(p, polyAtom(RADICAL_ATOM))
    if (!c || c.length < 2 || c.some((term) => term.mono.some(([a]) => a === RADICAL_ATOM || a === t))) continue
    return { kind: 'factor', operand: r, side, after: at(side, mul(r, polyToExpr(c, atoms)), o) }
  }
  // Klammer mit der Wurzel ausmultiplizieren: (y - \sqrt{x - a})^2 = y^2 - 2y\sqrt{x - a} + x - a
  const inBracket = (x: Expr) => x.kind === 'add' && hasR(x)
  const bracketWithR = (side: Expr) =>
    subterms(side).some((x) => (x.kind === 'pow' && inBracket(x.base)) || (x.kind === 'mul' && x.factors.some(inBracket)) || (x.kind === 'neg' && inBracket(x.arg)))
  if (atoms && (bracketWithR(e.lhs) || bracketWithR(e.rhs))) {
    const p = polysOf()
    if (p) return { kind: 'expand', after: eq(polyToExpr(p.l, atoms), polyToExpr(p.r, atoms)) }
  }
  for (const side of ['lhs', 'rhs'] as const) {
    const s = e[side]
    const o = side === 'lhs' ? e.rhs : e.lhs
    if (s.kind !== 'add' || hasR(o)) continue
    const withR = s.terms.filter(hasR)
    if (withR.length !== 1) continue
    const others = s.terms.filter((x) => !hasR(x))
    // die Variable auch außerhalb der Wurzel auf beiden Seiten: sortieren (Wurzel nach links, Rest
    // nach rechts, gleiche Summanden zusammengefasst)
    const p = contains(o, t) && others.some((x) => contains(x, t)) ? polysOf() : null
    if (p) {
      const diff = polyAdd(p.l, polyScale(p.r, rat(-1)))
      const rTerms = diff.filter((term) => term.mono.some(([a]) => a === RADICAL_ATOM))
      const rest = diff.filter((term) => !term.mono.some(([a]) => a === RADICAL_ATOM))
      if (rTerms.length === 0) return null
      const sign = rat(ratSign(rTerms[0].coef) < 0 ? -1 : 1)
      return { kind: 'collect', operand: r, after: eq(polyToExpr(polyScale(rTerms, sign), atoms!), polyToExpr(polyScale(rest, ratNeg(sign)), atoms!)) }
    }
    const operand = others.length === 1 ? negated(others[0]) : sumOf(others.map(negated))
    const other = others.reduce((acc, k) => plusTerm(acc, negated(k)), o)
    return { kind: 'add', operand, side, after: at(side, withR[0], other) }
  }
  // auf beiden Seiten etwas mit der Wurzel, oder die Variable auch außerhalb: sortieren
  if (contains(e.lhs, t) && contains(e.rhs, t)) {
    const p = polysOf()
    if (p) {
      const diff = polyAdd(p.l, polyScale(p.r, rat(-1)))
      const rTerms = diff.filter((term) => term.mono.some(([a]) => a === RADICAL_ATOM))
      const rest = diff.filter((term) => !term.mono.some(([a]) => a === RADICAL_ATOM))
      if (rTerms.length === 0) return null
      const sign = rat(ratSign(rTerms[0].coef) < 0 ? -1 : 1)
      return { kind: 'collect', operand: r, after: eq(polyToExpr(polyScale(rTerms, sign), atoms!), polyToExpr(polyScale(rest, ratNeg(sign)), atoms!)) }
    }
  }
  return null
}

// Doppelbruch mit Brüchen im Nenner: mit dem Hauptnenner der inneren Brüche erweitern,
// \frac{a + \frac{b}{x}}{c - \frac{d}{x}} → \frac{ax + b}{cx - d}
function extendStep(e: Equation, t: string): Draft | null {
  for (const side of ['lhs', 'rhs'] as const) {
    const s = e[side]
    if (s.kind !== 'div' || !contains(s, t) || !innerFractions(s.den).length) continue
    const atoms = newAtoms(t)
    const dens = [...innerFractions(s.num), ...innerFractions(s.den)].map((d) => toPoly(d, atoms))
    if (dens.some((d) => !d || constValue(d) !== null)) continue
    const lcd = factoredDisplay(factoredLcm(dens.map((d) => factorize(d!))), atoms)
    const n = spread(s.num, lcd)
    const d = spread(s.den, lcd)
    if (subterms(n).some((x) => x.kind === 'div') || subterms(d).some((x) => x.kind === 'div')) continue
    const after = side === 'lhs' ? eq(div(n, d), e.rhs) : eq(e.lhs, div(n, d))
    return { kind: 'extend', operand: lcd, side, after }
  }
  return null
}

// Nenner der Brüche in einer Summe (oder der Bruch selbst), ohne die Bruchstriche darin
function innerFractions(e: Expr): Expr[] {
  const positive = (x: Expr) => (x.kind === 'neg' ? x.arg : x)
  return termsOf(e)
    .map(positive)
    .filter((x) => x.kind === 'div')
    .map((x) => (x as Extract<Expr, { kind: 'div' }>).den)
}

// e · f mit f in jeden Summanden, die Brüche haben: (x - \frac{a}{b}) · b → bx - a
function spread(e: Expr, f: Expr): Expr {
  if (e.kind === 'add' && e.terms.some((x) => subterms(x).some((y) => y.kind === 'div'))) return sumOf(e.terms.map((x) => spread(x, f)))
  if (e.kind === 'neg') return negated(spread(e.arg, f))
  return timesFactor(e, f)
}

// Nenner, wie sie in der Gleichung stehen
const writtenDenominators = (e: Equation): Expr[] =>
  [e.lhs, e.rhs].flatMap((side) => subterms(side)).flatMap((x) => (x.kind === 'div' ? [x.den] : []))

// Hauptnenner mit den Klammern so, wie sie in der Aufgabe stehen: (\sqrt{x} - b) statt (b - \sqrt{x})
function oriented(lcd: Factored, e: Equation, atoms: Atoms): Factored {
  const written = writtenDenominators(e)
    .map((d) => toPoly(d, atoms))
    .filter((p): p is Poly => p !== null)
  return {
    coef: lcd.coef,
    factors: lcd.factors.map((g) => {
      const flipped = polyScale(g.poly, rat(-1))
      return written.some((w) => polyEquals(w, flipped)) && !written.some((w) => polyEquals(w, g.poly)) ? { ...g, poly: flipped } : g
    }),
  }
}

// Variable mehrfach: Wurzel allein stellen und quadrieren, Doppelbruch erweitern, Nenner beseitigen,
// ausmultiplizieren, sortieren, ausklammern, teilen
function rational(e: Equation, t: string): Draft | null {
  const r = complexRoot(e, t)
  if (r) return radicalStep(e, t, r)

  const extended = extendStep(e, t)
  if (extended) return extended

  const rootUnknown = hasTargetRoot(e, t)
  const atoms = newAtoms(t, rootUnknown)
  const u = rootUnknown ? ROOT_ATOM : t
  const uExpr = rootUnknown ? sqrt(variable(t)) : variable(t)
  const raw = [toRat(e.lhs, atoms), toRat(e.rhs, atoms)]
  if (!raw[0] || !raw[1]) return null
  // gekürzt: b\left(x - \frac{a}{b}\right) hat keinen Nenner mehr
  const [left, right] = raw.map((f) => {
    const r = reduceFrac(f!)
    return { num: r.num, den: factoredPoly(r.den) }
  })

  // Nenner beseitigen: beide Seiten mit dem Hauptnenner malnehmen
  const dl = constValue(left.den)
  const dr = constValue(right.den)
  if (!(dl && isOne(dl) && dr && isOne(dr)) && (e.lhs.kind === 'div' || e.rhs.kind === 'div' || hasFraction(e))) {
    const lcd = oriented(factoredLcm([factorize(left.den), factorize(right.den)]), e, atoms)
    const written = writtenDenominators(e)
    // Seite ohne Bruch als Ganzes malnehmen: (y - b)(\sqrt{x} + a)
    const sideTimes = (side: Expr) =>
      subterms(side).some((x) => x.kind === 'div') ? sumOf(termsOf(side).map((x) => termTimes(x, lcd, atoms, written))) : termTimes(side, lcd, atoms, written)
    return { kind: 'multiply', operand: factoredDisplay(lcd, atoms, written), after: eq(sideTimes(e.lhs), sideTimes(e.rhs)) }
  }
  const pl = polyDivideExact(left.num, left.den)
  const pr = polyDivideExact(right.num, right.den)
  if (!pl || !pr) return null

  // Klammern ausmultiplizieren
  if (hasBracket(e.lhs) || hasBracket(e.rhs)) {
    const after = eq(polyToExpr(pl, atoms), polyToExpr(pr, atoms))
    if (key(after.lhs) !== key(e.lhs) || key(after.rhs) !== key(e.rhs)) return { kind: 'expand', after }
  }

  const diff = polyAdd(pl, polyScale(pr, rat(-1)))
  if (degreeIn(diff, u) !== 1) return null
  const uTerms = diff.filter((term) => term.mono.some(([a]) => a === u))
  const rest = diff.filter((term) => !term.mono.some(([a]) => a === u))
  const coefficient = polyDivideExact(uTerms, polyAtom(u))!

  // alles mit der Variable nach links, den Rest nach rechts
  const collected = pl.every((term) => term.mono.some(([a]) => a === u)) && !contains(e.rhs, t)
  if (!collected) {
    const sign = collectSign(coefficient, rest)
    return {
      kind: 'collect',
      after: eq(polyToExpr(polyScale(uTerms, rat(sign)), atoms), polyToExpr(polyScale(rest, rat(-sign)), atoms)),
    }
  }

  // ausklammern
  if (coefficient.length >= 2 && !(e.lhs.kind === 'mul' && e.lhs.factors.some((f) => key(f) === key(uExpr)))) {
    return { kind: 'factor', after: eq(mul(uExpr, polyToExpr(coefficient, atoms)), e.rhs) }
  }

  // teilen
  const c = constValue(coefficient)
  if (c && ratEq(c, rat(-1))) return { kind: 'negate', side: 'lhs', after: eq(uExpr, polyToExpr(polyScale(pr, rat(-1)), atoms)) }
  if (c && isOne(c)) return null
  return {
    kind: 'divide',
    operand: polyToExpr(coefficient, atoms),
    side: 'lhs',
    after: eq(uExpr, niceFrac({ num: pr, den: coefficient }, atoms)),
  }
}

const hasFraction = (e: Equation) => subterms(e.lhs).concat(subterms(e.rhs)).some((s) => s.kind === 'div')

// Vorzeichen beim Sortieren: rechts möglichst ohne Minus, sonst links mit Plus vorn
function collectSign(coefficient: Poly, rest: Poly): 1 | -1 {
  const negatives = (p: Poly) => p.filter((term) => ratSign(term.coef) < 0).length
  const plus = negatives(polyScale(rest, rat(-1)))
  const minus = negatives(rest)
  if (plus !== minus) return plus < minus ? 1 : -1
  return ratSign(coefficient[0].coef) < 0 ? -1 : 1
}

// Nächster Schritt; null, wenn fertig. Wirft, wenn sich die Gleichung so nicht auflösen lässt.
function nextStep(e: Equation, t: string): Draft | null {
  const parts = split(e, t)
  if (parts === null) throw new Error('Die gesuchte Variable kommt nicht vor')
  if (parts === 'both') return mustStep(rational(e, t))
  const { s, o, side } = parts
  if (s.kind === 'var') {
    const result = finalForm(o)
    if (side === 'lhs' && key(result) === key(o)) return null
    return { kind: 'finish', after: eq(s, result), swapOnly: key(result) === key(o) }
  }
  if (complexRoot(e, t) && !(s.kind === 'root' && !isTargetRoot(s, t))) {
    const draft = rational(e, t)
    if (draft) return draft
  }
  if (peelable(s, t) && !(s.kind === 'add' && complexRoot(e, t))) return mustStep(peel(s, o, side, t))
  return mustStep(rational(e, t))
}

// Summe ohne Brüche, in der sich nichts zusammenfassen lässt (b + \sqrt{\frac{y}{a}}): schon fertig
function alreadyFinal(o: Expr): boolean {
  if (o.kind !== 'add' || !subterms(o).some((x) => x.kind === 'root') || subterms(o).some((x) => x.kind === 'div' && !insideRoot(o, x))) return false
  const atoms = anyAtoms()
  const p = toPoly(o, atoms)
  return p !== null && p.length === o.terms.length
}

// Steht der Teil unter einer Wurzel (dann zählt er als ein Zeichen)?
const insideRoot = (e: Expr, part: Expr): boolean => subterms(e).some((x) => x.kind === 'root' && x !== part && subterms(x.arg).includes(part))

function mustStep(d: Draft | null): Draft {
  if (!d) throw new Error('Diese Gleichung lässt sich so nicht auflösen')
  return d
}

// Löst die Gleichung nach t auf; null, wenn das mit diesen Schritten nicht geht
export function solveEquation(equation: Equation, target: string): RearrangeSolution | null {
  const steps: RearrangeStep[] = []
  let current = equation
  try {
    for (let i = 0; i < MAX_STEPS; i++) {
      const draft = nextStep(current, target)
      if (!draft) return { target, steps, result: current.rhs, requires: steps.flatMap((x) => (x.requires ? [x.requires] : [])) }
      steps.push({ ...draft, before: current })
      current = draft.after
    }
  } catch {
    return null
  }
  return null
}
