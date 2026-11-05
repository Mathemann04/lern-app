import { contains, key, subterms } from '../expr/compare.ts'
import { FN_LATEX, toLatex } from '../expr/print.ts'
import { type Equation, type Expr, type FnName, E, PI, add, asRational, div, eq, fn, log, mul, neg, num, pow, root, sqrt, variable } from '../expr/types.ts'
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
  BLOCK_ATOM,
  RADICAL_ATOM,
  ROOT_ATOM,
  blockAtoms,
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
  | 'exp'
  | 'log'
  | 'logCombine'
  | 'logLaw'
  | 'powerLaw'
  | 'arc'
  | 'trig'
  | 'pythagoras'
  | 'tanQuotient'
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
  exp: 'e hoch beide Seiten',
  log: 'Logarithmieren',
  logCombine: 'Logarithmen zusammenfassen',
  logLaw: 'Logarithmusgesetze anwenden',
  powerLaw: 'Potenzgesetz anwenden',
  arc: 'Umkehrfunktion auf beiden Seiten',
  trig: 'Funktion auf beiden Seiten',
  pythagoras: 'Quadrat ersetzen',
  tanQuotient: 'Durch den Kosinus teilen',
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
      // ohne Bruch im Ergebnis (\sqrt{a^2 + e^b}) wird nur zusammengefasst und geordnet
      if (step.swapOnly) return 'Seiten tauschen'
      return subterms(step.after.rhs).some((x) => x.kind === 'div') ? 'Zu einem Bruch zusammenfassen' : 'Zusammenfassen und ordnen'
    case 'expand':
      return 'Die Klammern ausmultiplizieren'
    case 'extend':
      return `Den Doppelbruch mit $${operand}$ erweitern`
    case 'exp':
      return `$${operand}$ hoch beide Seiten`
    case 'log':
      return '$\\ln$ auf beiden Seiten'
    case 'logCombine':
      return `Die Logarithmen zu einem $${step.operand && !isE(step.operand) ? `\\log_{${operand}}` : '\\ln'}$ zusammenfassen`
    case 'logLaw':
      return 'Logarithmusgesetze anwenden'
    case 'powerLaw':
      return 'Potenzgesetz $a^{m + n} = a^m \\cdot a^n$ anwenden'
    case 'arc':
    case 'trig':
      return `$${FN_LATEX[step.fn!]}$ auf beiden Seiten`
    case 'pythagoras':
      return `$${operand} = ${toLatex(pythagorasOf(step.operand as PowerNode))}$ einsetzen`
    case 'tanQuotient':
      return `${step.side ? 'Zähler und Nenner' : 'Beide Seiten'} durch $${operand}$ teilen`
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
  // beim Quadrieren einer Wurzel: Die andere Seite muss ≥ 0 sein, sonst gibt es keine Lösung; beim
  // Logarithmieren > 0; bei Umkehrfunktionen im Wertebereich (z. B. 1 - w^2 bei \arcsin w)
  readonly requires?: Expr
  // Funktion, die auf beide Seiten angewandt wird (\arcsin bei sin x = w, \tan bei \arctan u = w)
  readonly fn?: FnName
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
    // Minus vor dem Bruch: -\frac{1}{b} statt \frac{-1}{b}
    return add(...side.terms.map((x) => (isNegative(x) ? negated(dividedBy(negated(x), d)) : dividedBy(x, d))))
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
  // Zahl oder Buchstaben mal Klammer: (3(y + m))^2 → 9(y + m)^2
  if (e.kind === 'mul' && e.factors.every((f) => isMonomial(f) || f.kind === 'add') && e.factors.some((f) => f.kind === 'add')) {
    const monos = e.factors.filter(isMonomial)
    const front = monos.length > 0 ? squared(mul(...monos)) : num(1)
    const brackets = e.factors.filter((f) => f.kind === 'add').map((f) => pow(f, num(2)))
    return isOneExpr(front) ? mul(...brackets) : mul(front, ...brackets)
  }
  return pow(e, num(2))
}

// --- Endform ---

// Endform einer Seite ohne die gesuchte Variable: ein Bruch, gekürzt; Wurzel aus einem Bruch mit
// Quadrat im Nenner als \frac{\sqrt{…}}{a}; Quadrat eines Bruchs als \frac{(…)^2}{4y^2}
export function finalForm(e: Expr): Expr {
  if (alreadyFinal(e) || nestedSquare(e)) return e
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

// Quadrat einer Summe, in der wieder ein Quadrat einer Summe steht, ohne Bruch (Wurzeln in Wurzeln):
// ((y^2 - a)^2 - b)^2 bleibt so stehen
function nestedSquare(e: Expr): boolean {
  return e.kind === 'pow' && isSquare(e) && e.base.kind === 'add' && nestedSum(e.base)
}

function nestedSum(e: Expr): boolean {
  if (e.kind !== 'add') return false
  const squareOfSum = (x: Expr) => x.kind === 'pow' && isSquare(x) && x.base.kind === 'add'
  const plain = (x: Expr) => isMonomial(x) || (isNegative(x) && isMonomial(negated(x)))
  return (
    e.terms.some(squareOfSum) &&
    e.terms.every((x) => plain(x) || (squareOfSum(x) && (nestedSum((x as Extract<Expr, { kind: 'pow' }>).base) || plainSum((x as Extract<Expr, { kind: 'pow' }>).base))))
  )
}

// Summe aus Monomen ohne gleichartige Summanden (y^2 - a)
function plainSum(e: Expr): boolean {
  if (e.kind !== 'add' || !e.terms.every((x) => isMonomial(x) || (isNegative(x) && isMonomial(negated(x))))) return false
  const p = toPoly(e, anyAtoms())
  return p !== null && p.length === e.terms.length
}

const isSquare = (e: Extract<Expr, { kind: 'pow' }>) => {
  const k = asRational(e.exp)
  return k !== null && k.n === 2n && k.d === 1n
}
const isSquareOfSum = (e: Expr) => e.kind === 'pow' && e.base.kind === 'add' && isSquare(e)

// Gekürzt, mit denselben Atomen wie f (Teile wie e^b bleiben dieselben Zeichen)
function reduced(f: Frac, atoms: Atoms): { n: Poly; d: Poly } {
  const nice = niceFrac(f, atoms)
  const back = toRat(nice, atoms)!
  return { n: back.num, d: back.den }
}

function rootForm(f: Frac, atoms: Atoms): Expr {
  const { n, d } = reduced(f, atoms)
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
  const { n, d } = reduced(f, atoms)
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
  // auch mit einem Baustein wie \tan(2x) als Unbekannter: \tan(2x) = \frac{m - pq}{nq + 1}
  const block = draft.kind === 'divide' ? blockOf(draft.after, t) : null
  const unknown = (tPart.kind === 'var' && tPart.name === t) || (block !== null && key(block) === key(tPart))
  if (!unknown || !(isSingleFraction(other) || squareOfFraction)) return draft
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
      if (has(s.exp)) {
        if (has(s.base)) return null
        // erst zu einem Bruch, dann logarithmieren: \ln\frac{a - y}{by} statt \ln\left(\frac{a}{by} - \frac{1}{b}\right)
        if (isSumWithFraction(o)) return { kind: 'combine', side, after: at(side, s, finalForm(o)) }
        // \ln(e^F) = F gleich; bei einer anderen Basis folgt das Logarithmusgesetz als eigener Schritt
        return { kind: 'log', side, after: at(side, isE(s.base) ? s.exp : fn('ln', s), lnOf(o)), requires: o }
      }
      const k = asRational(s.exp)
      if (!k || !isInteger(k) || (k.n !== 2n && k.n !== 3n)) return null
      // erst zu einem Bruch, wenn danach noch weiter umgeformt wird: \sqrt{\frac{qr - s}{r}} statt
      // \sqrt{q - \frac{s}{r}} (bei x^2 = … macht das das Ergebnis)
      if (isSumWithFraction(o) && !isVar(s.base, t)) return { kind: 'combine', side, after: at(side, s, finalForm(o)) }
      return { kind: 'root', operand: num(k), side, after: at(side, s.base, k.n === 2n ? sqrt(o) : root(o, 3)) }
    }
    case 'root':
      if (s.index !== 2) return null
      if (isSumWithFraction(o) && !isVar(s.arg, t)) return { kind: 'combine', side, after: at(side, s, finalForm(o)) }
      return { kind: 'square', side, after: at(side, s.arg, squared(o)), requires: o }
    case 'fn': {
      // \ln u = w → u = e^w
      if (s.name === 'ln') return { kind: 'exp', operand: E, side, after: at(side, s.arg, powerOf(E, o)) }
      // \sin u = w → u = \arcsin w (erst zu einem Bruch: \arcsin\frac{y - ab}{a})
      const arc = ARC_OF[s.name]
      if (arc) {
        if (isSumWithFraction(o)) return { kind: 'combine', side, after: at(side, s, finalForm(o)) }
        const requires = arcRequires(arc, o)
        return { kind: 'arc', fn: arc, side, after: at(side, s.arg, fn(arc, o)), ...(requires ? { requires } : {}) }
      }
      // \arctan u = w → u = \tan w
      const trig = TRIG_OF[s.name]
      if (trig) {
        const requires = trigRequires(s.name, o)
        return { kind: 'trig', fn: trig, side, after: at(side, s.arg, fn(trig, o)), ...(requires ? { requires } : {}) }
      }
      return null
    }
    case 'log':
      // \log_a u = w → u = a^w
      if (has(s.base)) return null
      return { kind: 'exp', operand: s.base, side, after: at(side, s.arg, powerOf(s.base, o)) }
    default:
      return null
  }
}

export const isE = (e: Expr) => e.kind === 'const' && e.name === 'e'

// \ln w; \ln e^w = w
export function lnOf(o: Expr): Expr {
  if (o.kind === 'pow' && isE(o.base)) return o.exp
  return fn('ln', o)
}

// a^w; e^{\ln u} = u
export function powerOf(base: Expr, o: Expr): Expr {
  if (isE(base) && o.kind === 'fn' && o.name === 'ln') return o.arg
  if (o.kind === 'log' && key(o.base) === key(base)) return o.arg
  return pow(base, o)
}

// --- Winkel- und Hyperbelfunktionen, Umkehrfunktionen (Stufe 4, Schritt 6b) ---

// Umkehrfunktion: \sin u = w → u = \arcsin w. Die Aufgabe sorgt mit ihren Bedingungen dafür, dass u
// im Hauptwert liegt (z. B. 0 < x < \frac{\pi}{2}).
export const ARC_OF: Partial<Record<FnName, FnName>> = {
  sin: 'arcsin',
  cos: 'arccos',
  tan: 'arctan',
  sinh: 'arsinh',
  cosh: 'arcosh',
  tanh: 'artanh',
}

// und umgekehrt: \arctan u = w → u = \tan w
export const TRIG_OF: Partial<Record<FnName, FnName>> = {
  arcsin: 'sin',
  arccos: 'cos',
  arctan: 'tan',
  arsinh: 'sinh',
  arcosh: 'cosh',
  artanh: 'tanh',
}

const squareOf = (e: Expr) => pow(e, num(2))

// Damit es eine Lösung gibt, muss w im Definitionsbereich der Umkehrfunktion liegen (> 0 an den
// Prüfstellen): 1 - w^2 bei \arcsin, \arccos, \operatorname{artanh}; w - 1 bei \operatorname{arcosh}
function arcRequires(arc: FnName, w: Expr): Expr | null {
  if (arc === 'arcsin' || arc === 'arccos' || arc === 'artanh') return add(num(1), neg(squareOf(w)))
  if (arc === 'arcosh') return add(w, neg(num(1)))
  return null
}

// … bzw. im Wertebereich der Umkehrfunktion: |w| < \frac{\pi}{2} bei \arcsin und \arctan,
// 0 < w < \pi bei \arccos, w > 0 bei \operatorname{arcosh}
function trigRequires(arc: FnName, w: Expr): Expr | null {
  if (arc === 'arcsin' || arc === 'arctan') return add(div(squareOf(PI), num(4)), neg(squareOf(w)))
  if (arc === 'arccos') return mul(w, add(PI, neg(w)))
  if (arc === 'arcosh') return w
  return null
}

// Paare mit \sin^2 u + \cos^2 u = 1 bzw. \cosh^2 u - \sinh^2 u = 1, und ihr Quotient
const PAIRS: readonly { readonly sin: FnName; readonly cos: FnName; readonly tan: FnName }[] = [
  { sin: 'sin', cos: 'cos', tan: 'tan' },
  { sin: 'sinh', cos: 'cosh', tan: 'tanh' },
]

// Ersatz für ein Quadrat: \sin^2 u = 1 - \cos^2 u, \cos^2 u = 1 - \sin^2 u, \sinh^2 u = \cosh^2 u - 1,
// \cosh^2 u = 1 + \sinh^2 u. wrong: typische Fehler (Quadrat vergessen bzw. Vorzeichen wie bei sin)
export function pythagorasOf(square: PowerNode, wrong: 'square' | 'sign' | null = null): Expr {
  const f = square.base as Extract<Expr, { kind: 'fn' }>
  const pair = PAIRS.find((p) => p.sin === f.name || p.cos === f.name)!
  const partner = fn(f.name === pair.sin ? pair.cos : pair.sin, f.arg)
  const sq = wrong === 'square' ? partner : squareOf(partner)
  if (pair.sin === 'sin' || wrong === 'sign') return add(num(1), neg(sq))
  return f.name === 'sinh' ? add(sq, neg(num(1))) : add(num(1), sq)
}

// \ln(a^F) = F \ln a, \ln(e^F) = F
function lnOfPower(s: Extract<Expr, { kind: 'pow' }>): Expr {
  if (isE(s.base)) return s.exp
  return timesLn(s.exp, s.base)
}

// F · \ln a: x\ln 2, (2x - 1)\ln 3, -x\ln 2
export function timesLn(f: Expr, base: Expr): Expr {
  const l = fn('ln', base)
  if (isNegative(f)) return neg(timesLn(negated(f), base))
  return f.kind === 'mul' ? mul(...f.factors, l) : mul(f, l)
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
      return !has(s.exp) || !has(s.base)
    case 'fn':
      return s.name === 'ln' || ARC_OF[s.name] !== undefined || TRIG_OF[s.name] !== undefined
    case 'log':
      return !has(s.base)
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

// --- e-Funktion, Logarithmen und Potenzen mit der Variable in der Hochzahl (Stufe 4) ---

type PowerNode = Extract<Expr, { kind: 'pow' }>

// Potenz mit der Variable in der Hochzahl und ohne sie in der Basis: e^{2x}, 3^{x - 1}
const isTPower = (s: Expr, t: string): s is PowerNode => s.kind === 'pow' && contains(s.exp, t) && !contains(s.base, t)

// Logarithmus mit der Variable: \ln u (Basis e) oder \log_a u
function logParts(s: Expr, t: string): { base: Expr; arg: Expr } | null {
  if (s.kind === 'fn' && s.name === 'ln' && contains(s.arg, t)) return { base: E, arg: s.arg }
  if (s.kind === 'log' && contains(s.arg, t) && !contains(s.base, t)) return { base: s.base, arg: s.arg }
  return null
}

function children(e: Expr): readonly Expr[] {
  switch (e.kind) {
    case 'add':
      return e.terms
    case 'mul':
      return e.factors
    case 'neg':
    case 'root':
    case 'fn':
      return [e.arg]
    case 'div':
      return [e.num, e.den]
    case 'pow':
      return [e.base, e.exp]
    case 'log':
      return [e.base, e.arg]
    default:
      return []
  }
}

// Baustein, in dem die Variable steckt (e^x, 2^x, \ln x), wenn sie nur in Kopien davon vorkommt;
// sonst null. Mit ihm als Unbekannter wird sortiert, ausgeklammert und geteilt.
export function blockOf(e: Equation, t: string): Expr | null {
  const found = new Map<string, Expr>()
  let outside = false
  // Winkelfunktion nur im Quadrat (\sin^2 x): dann ist das Quadrat der Baustein
  let squared = false
  let plain = false
  const walk = (x: Expr): void => {
    if (!contains(x, t)) return
    if (x.kind === 'pow' && isTrigBlock(x.base, t) && isSquare(x)) {
      found.set(key(x.base), x.base)
      squared = true
      return
    }
    if (isTPower(x, t) || logParts(x, t) || isTrigBlock(x, t)) {
      found.set(key(x), x)
      if (isTrigBlock(x, t)) plain = true
      return
    }
    if (x.kind === 'var') outside = true
    for (const c of children(x)) walk(c)
  }
  walk(e.lhs)
  walk(e.rhs)
  if (outside || found.size !== 1) return null
  const block = [...found.values()][0]
  return squared && !plain ? squareOf(block) : block
}

// Winkel- oder Hyperbelfunktion mit der Variable: \sin x, \tan(2x), \cosh\frac{x}{a}
const isTrigBlock = (s: Expr, t: string) => s.kind === 'fn' && ARC_OF[s.name] !== undefined && contains(s.arg, t)

// \sin^2 u und \cos^2 u (bzw. \sinh^2 u und \cosh^2 u) in einer Gleichung: das zweite mit
// \sin^2 u + \cos^2 u = 1 ersetzen, damit nur noch eine Funktion übrig bleibt.
// y = a\cos^2 x + b\sin^2 x → y = a\cos^2 x + b\left(1 - \cos^2 x\right)
function pythagorasStep(e: Equation, t: string, wrong: 'square' | 'sign' | null = null): Draft | null {
  const squares = [e.lhs, e.rhs].flatMap((side) => subterms(side)).filter((s): s is PowerNode => s.kind === 'pow' && isSquare(s) && isTrigBlock(s.base, t))
  for (const first of squares) {
    const f = first.base as Extract<Expr, { kind: 'fn' }>
    const pair = PAIRS.find((p) => p.sin === f.name || p.cos === f.name)
    if (!pair) continue
    const partnerName = f.name === pair.sin ? pair.cos : pair.sin
    const second = squares.find((s) => s.base.kind === 'fn' && s.base.name === partnerName && key(s.base.arg) === key(f.arg))
    if (!second) continue
    const replace = new Map([[key(second), pythagorasOf(second, wrong)]])
    return { kind: 'pythagoras', operand: second, after: eq(substitute(e.lhs, replace), substitute(e.rhs, replace)) }
  }
  return null
}

// Typischer Fehler beim Ersetzen (Gleichung danach; null, wenn es nicht passt)
export function pythagorasWrong(e: Equation, t: string, wrong: 'square' | 'sign'): Equation | null {
  return pythagorasStep(e, t, wrong)?.after ?? null
}

// \sin u und \cos u (bzw. \sinh u und \cosh u) in jedem Summanden genau einmal, im Zähler und Nenner
// eines Bruchs oder auf beiden Seiten: durch \cos u teilen, dann steht nur noch \tan u da.
// \frac{\sin x + \cos x}{\sin x - \cos x} = y → \frac{\tan x + 1}{\tan x - 1} = y
// wrong: typische Fehler (durch \sin u geteilt und \tan u statt \cot u geschrieben; nur einen Teil geteilt)
function tanQuotientStep(e: Equation, t: string, wrong: 'flipped' | 'partly' | null = null): Draft | null {
  const fns = [e.lhs, e.rhs].flatMap((side) => subterms(side)).filter((s): s is Extract<Expr, { kind: 'fn' }> => isTrigBlock(s, t))
  for (const pair of PAIRS) {
    const sinF = fns.find((s) => s.name === pair.sin)
    const cosF = sinF && fns.find((s) => s.name === pair.cos && key(s.arg) === key(sinF.arg))
    if (!sinF || !cosF) continue
    const tanF = fn(pair.tan, sinF.arg)
    const [byF, keepF] = wrong === 'flipped' ? [sinF, cosF] : [cosF, sinF]
    const homogeneous = (x: Expr): boolean => {
      if (x.kind === 'neg') return homogeneous(x.arg)
      if (key(x) === key(sinF) || key(x) === key(cosF)) return true
      if (x.kind === 'add') return x.terms.every(homogeneous)
      if (x.kind === 'mul') {
        const withT = x.factors.filter((g) => contains(g, t))
        return withT.length === 1 && homogeneous(withT[0])
      }
      if (x.kind === 'div') return homogeneous(x.num) && !contains(x.den, t)
      return false
    }
    // geteilt durch \cos u (bei wrong = 'flipped' durch \sin u, aber \tan u geschrieben)
    const over = (x: Expr): Expr => {
      if (x.kind === 'neg') return neg(over(x.arg))
      if (key(x) === key(byF)) return num(1)
      if (key(x) === key(keepF)) return tanF
      if (x.kind === 'add') return add(...x.terms.map(over))
      if (x.kind === 'mul') {
        const factors = x.factors.map((g) => (contains(g, t) ? over(g) : g)).filter((g) => !isOneExpr(g))
        return factors.length === 0 ? num(1) : mul(...factors)
      }
      if (x.kind === 'div') return div(over(x.num), x.den)
      return x
    }
    for (const side of ['lhs', 'rhs'] as const) {
      const s = e[side]
      const o = side === 'lhs' ? e.rhs : e.lhs
      if (s.kind !== 'div' || contains(o, t) || !contains(s.num, t) || !contains(s.den, t) || !homogeneous(s.num) || !homogeneous(s.den)) continue
      const den = wrong === 'partly' ? s.den : over(s.den)
      return { kind: 'tanQuotient', operand: cosF, side, after: at(side, isOneExpr(den) ? over(s.num) : div(over(s.num), den), o) }
    }
    if (contains(e.lhs, t) && contains(e.rhs, t) && homogeneous(e.lhs) && homogeneous(e.rhs)) {
      return { kind: 'tanQuotient', operand: cosF, after: eq(over(e.lhs), wrong === 'partly' ? e.rhs : over(e.rhs)) }
    }
  }
  return null
}

// Typischer Fehler beim Teilen durch \cos u (Gleichung danach; null, wenn es nicht passt)
export function tanQuotientWrong(e: Equation, t: string, wrong: 'flipped' | 'partly'): Equation | null {
  return tanQuotientStep(e, t, wrong)?.after ?? null
}

// Unbekannte beim Sortieren, Ausklammern und Teilen: x, √x (mit x = (√x)²) oder ein Baustein wie e^x
export function unknownAtoms(e: Equation, t: string): { atoms: Atoms; u: string; uExpr: Expr; block: Expr | null } {
  const block = blockOf(e, t)
  if (block) return { atoms: blockAtoms(t, block), u: BLOCK_ATOM, uExpr: block, block }
  const rootUnknown = hasTargetRoot(e, t)
  return { atoms: newAtoms(t, rootUnknown), u: rootUnknown ? ROOT_ATOM : t, uExpr: rootUnknown ? sqrt(variable(t)) : variable(t), block: null }
}

// ±k · \ln u als Summand: Vorzeichen, Basis und u^k
export function signedLog(term: Expr, t: string): { sign: 1 | -1; base: Expr; arg: Expr } | null {
  let sign: 1 | -1 = 1
  let x = term
  if (x.kind === 'neg') {
    sign = -1
    x = x.arg
  }
  let k = 1n
  if (x.kind === 'mul' && x.factors.length === 2 && x.factors[0].kind === 'num' && isInteger(x.factors[0].value)) {
    k = x.factors[0].value.n
    x = x.factors[1]
    if (k < 0n) {
      sign = sign === 1 ? -1 : 1
      k = -k
    }
  }
  const p = logParts(x, t)
  if (!p) return null
  return { sign, base: p.base, arg: k === 1n ? p.arg : pow(p.arg, num(k)) }
}

// Mehrere Logarithmen mit der Variable in einer Summe zu einem zusammenfassen (Logarithmusgesetze):
// \ln(x + a) + \ln(x - a) = b → \ln((x + a)(x - a)) = b, \ln(x + a) - \ln x = b → \ln\frac{x + a}{x} = b
function logCombineStep(e: Equation, t: string): Draft | null {
  for (const side of ['lhs', 'rhs'] as const) {
    const s = e[side]
    if (s.kind !== 'add') continue
    const parsed = s.terms.map((term) => signedLog(term, t))
    const logs = parsed.filter((p) => p !== null)
    if (logs.length < 2 || logs.some((p) => key(p.base) !== key(logs[0].base))) continue
    const ups = logs.filter((p) => p.sign > 0).map((p) => p.arg)
    const downs = logs.filter((p) => p.sign < 0).map((p) => p.arg)
    if (ups.length === 0) continue
    const product = (xs: Expr[]) => (xs.length === 1 ? xs[0] : mul(...xs))
    const arg = downs.length > 0 ? div(product(ups), product(downs)) : product(ups)
    const combined = isE(logs[0].base) ? fn('ln', arg) : log(logs[0].base, arg)
    const first = parsed.findIndex((p) => p !== null)
    const terms = s.terms.flatMap((term, i) => (i === first ? [combined] : parsed[i] ? [] : [term]))
    return { kind: 'logCombine', operand: logs[0].base, side, after: at(side, sumOf(terms), side === 'lhs' ? e.rhs : e.lhs) }
  }
  return null
}

// Potenzen derselben Basis mit verschiedenen Hochzahlen auf eine gemeinsame Potenz bringen
// (a^{m + n} = a^m \cdot a^n): a \cdot 2^{x + 1} - b \cdot 2^x = c → 2a \cdot 2^x - b \cdot 2^x = c
function powerLawStep(e: Equation, t: string, asSum = false): Draft | null {
  const powers = [e.lhs, e.rhs].flatMap((side) => subterms(side)).filter((s): s is PowerNode => isTPower(s, t))
  const byBase = new Map<string, PowerNode[]>()
  for (const p of powers) byBase.set(key(p.base), [...(byBase.get(key(p.base)) ?? []), p])
  const atoms = newAtoms(t)
  const withT = (term: Poly[number]) => term.mono.some(([a]) => a === t)
  for (const group of byBase.values()) {
    const distinct = [...new Map(group.map((p) => [key(p.exp), p])).values()]
    if (distinct.length < 2) continue
    const parts = distinct.map((p) => {
      const q = toPoly(p.exp, atoms)
      return q && { p, tPart: q.filter(withT), rest: q.filter((term) => !withT(term)) }
    })
    if (parts.some((x) => x === null)) continue
    const split = parts as { p: PowerNode; tPart: Poly; rest: Poly }[]
    const tPart = split[0].tPart
    if (!split.every((x) => polyEquals(x.tPart, tPart))) continue
    const base = group[0].base
    const block = pow(base, polyToExpr(tPart, atoms))
    const replace = new Map<string, Expr>()
    for (const { p, rest } of split) {
      if (rest.length === 0) continue
      const r = rewrittenPower(base, rest, block, atoms, asSum)
      if (!r) return null
      replace.set(key(p), r)
    }
    const bAtoms = blockAtoms(t, block)
    const rewrite = (x: Expr) => tidy(substitute(x, replace), bAtoms)
    return { kind: 'powerLaw', operand: block, after: eq(rewrite(e.lhs), rewrite(e.rhs)) }
  }
  return null
}

// Typischer Fehler beim Potenzgesetz: 2^{x + 1} als 2^x + 2 (Gleichung danach; null, wenn es nicht passt)
export function powerLawSum(e: Equation, t: string): Equation | null {
  return powerLawStep(e, t, true)?.after ?? null
}

// a^{G + k} als a^k \cdot a^G (k > 0) bzw. \frac{a^G}{a^k}; e^{x + b} als e^b e^x. asSum: falsch als
// Summe a^G + a^k bzw. a^G - a^k
function rewrittenPower(base: Expr, rest: Poly, block: Expr, atoms: Atoms, asSum = false): Expr | null {
  const c = constValue(rest)
  if (c && !isInteger(c)) return null
  if (c) {
    const k = c.n < 0n ? -c.n : c.n
    const factor = base.kind === 'num' && isInteger(base.value) ? num(base.value.n ** k) : k === 1n ? base : pow(base, num(k))
    if (asSum) return c.n > 0n ? add(block, factor) : add(block, neg(factor))
    return c.n > 0n ? mul(factor, block) : div(block, factor)
  }
  const factor = pow(base, polyToExpr(rest, atoms))
  return asSum ? add(block, factor) : mul(factor, block)
}

// Teile ersetzen (nach Schlüssel)
function substitute(e: Expr, replace: ReadonlyMap<string, Expr>): Expr {
  const r = replace.get(key(e))
  if (r) return r
  switch (e.kind) {
    case 'add':
      return add(...e.terms.map((x) => substitute(x, replace)))
    case 'mul':
      return mul(...e.factors.map((x) => substitute(x, replace)))
    case 'neg':
      return neg(substitute(e.arg, replace))
    case 'div':
      return div(substitute(e.num, replace), substitute(e.den, replace))
    default:
      return e
  }
}

// Summanden aus Zahlen, Buchstaben und dem Baustein zusammenrechnen: a \cdot 2 \cdot 2^x → 2a \cdot 2^x
function tidy(e: Expr, atoms: Atoms): Expr {
  if (e.kind === 'add') return add(...e.terms.map((x) => tidy(x, atoms)))
  if (e.kind === 'div') return div(tidy(e.num, atoms), tidy(e.den, atoms))
  const p = toPoly(e, atoms)
  return p && p.length === 1 ? polyToExpr(p, atoms) : e
}

// Kommt die Variable nur in Hochzahlen vor (2^x, a \cdot 5^{x - 1})?
function onlyInExponents(e: Expr, t: string): boolean {
  if (!contains(e, t)) return true
  if (isTPower(e, t)) return true
  if (e.kind === 'var') return false
  return children(e).every((c) => onlyInExponents(c, t))
}

// Logarithmus eines Produkts aus Potenzen, nach den Logarithmusgesetzen auseinandergezogen:
// \ln\left(a \cdot 5^x\right) = \ln a + x\ln 5; null, wenn das nicht geht (z. B. bei einer Summe)
// forgetBase: typischer Fehler \ln\left(a^x\right) = x statt x\ln a
export function lnTerms(e: Expr, t: string, forgetBase = false): Expr[] | null {
  switch (e.kind) {
    case 'mul': {
      const parts = e.factors.map((f) => lnTerms(f, t, forgetBase))
      return parts.some((p) => p === null) ? null : (parts as Expr[][]).flat()
    }
    case 'div': {
      const n = lnTerms(e.num, t, forgetBase)
      const d = lnTerms(e.den, t, forgetBase)
      return n && d ? [...n, ...d.map(negated)] : null
    }
    case 'pow':
      if (contains(e.base, t)) return null
      return forgetBase && contains(e.exp, t) ? [e.exp] : [lnOfPower(e)]
    case 'num':
      if (ratSign(e.value) <= 0) return null
      return isOne(e.value) ? [] : [fn('ln', e)]
    case 'neg':
      return null
    default:
      return contains(e, t) ? null : [fn('ln', e)]
  }
}

// Potenzen verschiedener Basen mit der Variable in der Hochzahl, als Produkte: beide Seiten
// logarithmieren, 3^{2x - 1} = a \cdot 5^x → (2x - 1)\ln 3 = \ln a + x\ln 5
function logBothStep(e: Equation, t: string): Draft | null {
  if (!onlyInExponents(e.lhs, t) || !onlyInExponents(e.rhs, t)) return null
  const powers = new Set([e.lhs, e.rhs].flatMap((side) => subterms(side)).filter((s) => isTPower(s, t)).map(key))
  if (powers.size < 2) return null
  if ([e.lhs, e.rhs].some((side) => contains(side, t) && !lnTerms(side, t))) return null
  const free = [e.lhs, e.rhs].find((side) => !contains(side, t))
  return { kind: 'log', after: eq(lnOf(e.lhs), lnOf(e.rhs)), ...(free ? { requires: free } : {}) }
}

// Logarithmus eines Produkts aus Potenzen mit der Variable auseinanderziehen:
// \ln\left(a \cdot 5^x\right) = \ln a + x\ln 5, \ln\left(2^x\right) = x\ln 2
function logLawStep(e: Equation, t: string): Draft | null {
  const expanded = (side: Expr): Expr | null => {
    if (side.kind !== 'fn' || side.name !== 'ln' || !contains(side, t)) return null
    const terms = lnTerms(side.arg, t)
    return terms && !(terms.length === 1 && key(terms[0]) === key(side)) ? sumOf(terms) : null
  }
  const l = expanded(e.lhs)
  const r = expanded(e.rhs)
  if (!l && !r) return null
  return { kind: 'logLaw', after: eq(l ?? e.lhs, r ?? e.rhs) }
}

// Variable mehrfach: Wurzel allein stellen und quadrieren, Doppelbruch erweitern, Nenner beseitigen,
// ausmultiplizieren, sortieren, ausklammern, teilen
function rational(e: Equation, t: string): Draft | null {
  const r = complexRoot(e, t)
  if (r) return radicalStep(e, t, r)

  // \sin^2 und \cos^2, \sin und \cos: erst nur noch eine Funktion
  const replaced = pythagorasStep(e, t)
  if (replaced) return replaced
  const quotient = tanQuotientStep(e, t)
  if (quotient) return quotient

  const extended = extendStep(e, t)
  if (extended) return extended

  const powered = powerLawStep(e, t)
  if (powered) return powered
  const logged = logBothStep(e, t)
  if (logged) return logged

  const { atoms, u, uExpr, block } = unknownAtoms(e, t)
  // mit einem Baustein wie e^x: „Alles mit $e^x$ nach links", „$e^x$ ausklammern"
  const named = block ? { operand: block } : {}
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
      ...named,
      after: eq(polyToExpr(polyScale(uTerms, rat(sign)), atoms), polyToExpr(polyScale(rest, rat(-sign)), atoms)),
    }
  }

  // ausklammern
  if (coefficient.length >= 2 && !(e.lhs.kind === 'mul' && e.lhs.factors.some((f) => key(f) === key(uExpr)))) {
    return { kind: 'factor', ...named, after: eq(factoredOut(uExpr, polyToExpr(coefficient, atoms)), e.rhs) }
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

// Ausgeklammerte Unbekannte: x(a - c), e^{x}(y - a), aber (a - c)\ln x, (a - b)\sin^2 x
export const factoredOut = (u: Expr, coefficient: Expr): Expr =>
  u.kind === 'fn' || u.kind === 'log' || (u.kind === 'pow' && u.base.kind === 'fn') ? mul(coefficient, u) : mul(u, coefficient)

const hasFraction = (e: Equation) => subterms(e.lhs).concat(subterms(e.rhs)).some((s) => s.kind === 'div')

// Vorzeichen beim Sortieren: links nicht lauter Minus (-ax - bx), sonst rechts möglichst ohne Minus,
// sonst links mit Plus vorn
function collectSign(coefficient: Poly, rest: Poly): 1 | -1 {
  const negatives = (p: Poly) => p.filter((term) => ratSign(term.coef) < 0).length
  const leftNegative = negatives(coefficient)
  if (coefficient.length >= 2 && (leftNegative === 0 || leftNegative === coefficient.length)) return leftNegative === 0 ? 1 : -1
  const plus = negatives(polyScale(rest, rat(-1)))
  const minus = negatives(rest)
  if (plus !== minus) return plus < minus ? 1 : -1
  return ratSign(coefficient[0].coef) < 0 ? -1 : 1
}

// Nächster Schritt; null, wenn fertig. Wirft, wenn sich die Gleichung so nicht auflösen lässt.
function nextStep(e: Equation, t: string): Draft | null {
  const parts = split(e, t)
  if (parts === null) throw new Error('Die gesuchte Variable kommt nicht vor')
  const combinedLogs = logCombineStep(e, t)
  if (combinedLogs) return combinedLogs
  const law = logLawStep(e, t)
  if (law) return law
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
