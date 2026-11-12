import { contains, key, subterms } from '../expr/compare.ts'
import { type Env, evaluate } from '../expr/evaluate.ts'
import { FN_LATEX, equationToLatex, toLatex } from '../expr/print.ts'
import { type Equation, type Expr, type FnName, E, PI, add, asRational, div, eq, fn, log, mul, neg, num, pow, root, sqrt, variable } from '../expr/types.ts'
import { type Factored, factoredDivide, factoredLcm, factoredPoly, factorize, reduceFrac } from '../fraction/factor.ts'
import { type Frac, fracAdd, fracDiv, fracMul, fracNeg, fracOf, fracScale } from '../fraction/frac.ts'
import { createRng } from '../random/rng.ts'
import { conditionsHold, holds } from './check.ts'
import { nextToolStep } from './tools/steps.ts'
import { hasTool } from './tools/tool.ts'
import { type Condition, variablesOf } from './task.ts'
import {
  type Poly,
  constValue,
  degreeIn,
  polyAdd,
  polyAtom,
  polyConst,
  polyDivideExact,
  polyEquals,
  polyMul,
  polyPow,
  polyScale,
  polySum,
  totalDegree,
} from '../fraction/poly.ts'
import { type Rational, isInteger, isOne, isZero, rat, ratAbs, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
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
  // M6 Schritt 4b-2: Logarithmen auf beiden Seiten
  | 'logBase'
  | 'logPower'
  | 'logNumber'
  | 'unlog'
  | 'powerLaw'
  | 'arc'
  | 'trig'
  | 'pythagoras'
  | 'tanQuotient'
  | 'substitute'
  | 'zero'
  | 'normalize'
  | 'pq'
  | 'choose'
  | 'resubstitute'
  // Stufe 5: Werkzeug ausrechnen (tools/steps.ts)
  | 'derive'
  | 'partial'
  | 'antiderivative'
  | 'bounds'
  | 'sumFormula'
  | 'series'
  | 'limit'
  | 'ode'
  | 'det'
  | 'detExpand'
  | 'abs'
  | 'arg'
  | 'length'
  | 'dot'
  | 'angle'
  | 'addition'
  | 'doubleAngle'
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
  logBase: 'Basiswechsel',
  logPower: 'Faktor als Hochzahl',
  logNumber: 'Zahl als Logarithmus schreiben',
  unlog: 'Entlogarithmieren',
  powerLaw: 'Potenzgesetz anwenden',
  arc: 'Umkehrfunktion auf beiden Seiten',
  trig: 'Funktion auf beiden Seiten',
  pythagoras: 'Quadrat ersetzen',
  tanQuotient: 'Durch den Kosinus teilen',
  substitute: 'Substituieren',
  zero: 'Alles auf eine Seite',
  normalize: 'Normalform herstellen',
  pq: 'pq-Formel anwenden',
  choose: 'Passende Lösung wählen',
  resubstitute: 'Zurück einsetzen',
  derive: 'Ableiten',
  partial: 'In Partialbrüche zerlegen',
  antiderivative: 'Stammfunktion bilden',
  bounds: 'Grenzen einsetzen',
  sumFormula: 'Summenformel anwenden',
  series: 'Reihe ausrechnen',
  limit: 'Grenzwert bilden',
  ode: 'Differentialgleichung lösen',
  det: 'Determinante ausrechnen',
  detExpand: 'Determinante entwickeln',
  abs: 'Betrag ausrechnen',
  arg: 'Winkel ausrechnen',
  length: 'Länge ausrechnen',
  dot: 'Skalarprodukt ausrechnen',
  angle: 'Winkel zwischen den Vektoren ausrechnen',
  addition: 'Additionstheorem anwenden',
  doubleAngle: 'Doppelten Winkel auflösen',
  finish: 'Ergebnis',
}

// Beschreibung eines Schritts als Text mit Formeln, z. B. „Auf beiden Seiten $-c$", „Beide Seiten
// durch $(y - 2)$"
export function stepLabel(step: RearrangeStep, taskTarget: string): string {
  // nach dem Substituieren wird nach u aufgelöst
  const target = step.unknown ?? taskTarget
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
      // spitzer Winkel als Buchstabe (Teil 8b): mit \tan y geschrieben
      if (step.operand?.kind === 'fn' && step.operand.name === 'tan') {
        const angle = step.operand.arg
        const tan = `$${operand} = ${toLatex(div(fn('sin', angle), fn('cos', angle)))}$`
        // steht noch kein \sin y da (x nur in der Länge), braucht es auch 1 - \cos^2 y = \sin^2 y
        const sine = [step.before.lhs, step.before.rhs].some((side) => subterms(side).some((s) => s.kind === 'fn' && s.name === 'sin'))
        if (sine) return `Mit ${tan} zusammenfassen`
        return `Mit $${toLatex(add(num(1), neg(pow(fn('cos', angle), num(2)))))} = ${toLatex(pow(fn('sin', angle), num(2)))}$ und ${tan} zusammenfassen`
      }
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
    // M6 Schritt 4b-2, ohne das Ergebnis zu verraten
    case 'logBase':
      return `Basiswechsel: alle Logarithmen zur Basis $${step.operand && !isE(step.operand) ? operand : 'e'}$`
    case 'logPower':
      return 'Faktor vor dem Logarithmus als Hochzahl hineinziehen'
    case 'logNumber':
      return `Zahlen als $${step.operand && !isE(step.operand) ? `\\log_{${operand}}` : '\\ln'}$ schreiben`
    case 'unlog':
      return 'Entlogarithmieren: die Argumente gleichsetzen'
    case 'powerLaw':
      return 'Potenzgesetz $a^{m + n} = a^m \\cdot a^n$ anwenden'
    case 'arc':
    case 'trig':
      return `$${FN_LATEX[step.fn!]}$ auf beiden Seiten`
    case 'pythagoras':
      // spitzer Winkel als Buchstabe (Teil 8b): die Summe 1 - \cos^2 y wird ersetzt
      if (step.operand?.kind === 'add') return `$${operand} = ${toLatex(acuteSquare(step.operand) ?? step.after.lhs)}$ einsetzen`
      return `$${operand} = ${toLatex(pythagorasOf(step.operand as PowerNode))}$ einsetzen`
    case 'tanQuotient':
      return `${step.side ? 'Zähler und Nenner' : 'Beide Seiten'} durch $${operand}$ teilen`
    case 'substitute':
      return `Substituieren: $${step.substitution!.name} = ${toLatex(step.substitution!.expr)}$`
    case 'zero':
      return 'Alles auf die linke Seite bringen'
    // Teil 8c: ohne das Ergebnis zu verraten (die Beschriftung ist auch Titel einer späteren Frage)
    case 'addition':
      return `Additionstheorem für $${operand}$ anwenden`
    case 'doubleAngle':
      return `$${operand}$ mit dem einfachen Winkel schreiben`
    case 'normalize':
      return `Beide Seiten durch $${factor}$ teilen`
    case 'pq':
      return '$pq$-Formel anwenden'
    case 'choose':
      // u_1 mit Plus vor der Wurzel, u_2 mit Minus
      return `Die Lösung $${target}_${termsOf(step.operand!).at(-1)?.kind === 'neg' ? 2 : 1} = ${operand}$ verwerfen`
    case 'resubstitute':
      return `Zurück einsetzen: $${step.substitution!.name} = ${toLatex(step.substitution!.expr)}$`
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
  // beim Substituieren und Zurück-Einsetzen: u = e^x
  readonly substitution?: Substitution
  // nach dem Substituieren: die Unbekannte, nach der gerade aufgelöst wird (u)
  readonly unknown?: string
  // bei der pq-Formel und beim Wählen: warum die andere Lösung (operand) wegfällt
  readonly reason?: RejectReason
}

// Substitution: u steht für den Baustein expr (e^x, \sqrt{x}, \sin x, \ln x, x^2)
export type Substitution = { readonly name: string; readonly expr: Expr }

// Warum die zweite Lösung der pq-Formel wegfällt: u₂ ist negativ, kann es aber nicht sein (u = e^x);
// mit u₂ wird x negativ; u₂ verletzt eine Bedingung der Aufgabe
export type RejectReason = 'negative' | 'targetNegative' | 'condition'

export type RearrangeSolution = {
  readonly target: string
  readonly steps: readonly RearrangeStep[]
  // rechte Seite von „x = …" in Endform
  readonly result: Expr
  // Terme, die ≥ 0 sein müssen, damit es eine Lösung gibt (aus dem Quadrieren von Wurzeln)
  readonly requires: readonly Expr[]
  // Substitution im Rechenweg (dann stehen Gleichungen in u dazwischen)
  readonly substitution?: Substitution
  // mit Wegen, die die Engine erst seit Teil 7b geht (siehe novelPaths)
  readonly novel?: true
  // mit Logarithmen auf beiden Seiten oder verschiedenen Basen (M6 Schritt 4b-2, siehe logPaths)
  readonly logPath?: true
}

// Was das Lösen über die Aufgabe wissen muss: Bedingungen (welche Lösung der pq-Formel passt) und,
// beim Weiterrechnen ab einer Gleichung in u, die Substitution
export type SolveOptions = { readonly conditions?: readonly Condition[]; readonly substitution?: Substitution }

type Context = {
  readonly original: Equation
  readonly target: string
  readonly conditions: readonly Condition[]
  readonly sub?: Substitution
  // Buchstaben, die nach den Bedingungen spitze Winkel sind (Teil 8b, acuteLetters)
  readonly acute: ReadonlySet<string>
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
  // Buchstaben vorn: e^{y} · a(x + b) → ae^{y}(x + b)
  if (f.kind === 'mul' && isMonomial(f.factors[0]) && (side.kind === 'pow' || side.kind === 'fn' || side.kind === 'root' || side.kind === 'log') && !isMonomial(side)) {
    const monos = f.factors.filter(isMonomial)
    return mul(...monos, side, ...f.factors.filter((g) => !isMonomial(g)))
  }
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
  // \sqrt{\frac{a^2}{4} + b} als \frac{\sqrt{a^2 + 4b}}{2} (nach der pq-Formel)
  const roots = simplerRoots(e)
  if (roots !== e) return finalForm(roots)
  if (alreadyFinal(e)) return plusFirst(e)
  if (nestedSquare(e)) return e
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

// Wurzel aus einer Summe mit Brüchen, deren Hauptnenner ein Quadrat ist, als Bruch:
// \sqrt{\frac{a^2}{4} + b} = \frac{\sqrt{a^2 + 4b}}{2}; sonst derselbe Term
// Ganz außen nur, wenn der Nenner schon ein Quadrat ist (\sqrt{\frac{k}{5} - …} bleibt so), innen auch
// mit Erweitern (nach der pq-Formel: -\frac{7}{2} + \sqrt{\frac{49}{4} + \frac{y}{3}})
function simplerRoots(e: Expr, outside = true): Expr {
  if (e.kind === 'root') {
    // innen zuerst: \sqrt{\frac{a}{2} + \sqrt{\frac{a^2}{4} + b}}
    const arg = simplerRoots(e.arg, false)
    const same = arg === e.arg ? e : { ...e, arg }
    if (e.index !== 2 || arg.kind !== 'add' || !subterms(arg).some((x) => x.kind === 'div')) return same
    const atoms = anyAtoms()
    const f = toRat(arg, atoms)
    // Zähler ein Quadrat, Nenner eine Summe: \sqrt{a^2 + \frac{a^2y}{1 - y}} = \frac{a}{\sqrt{1 - y}}
    const r = f && reduceFrac(f)
    if (r && factoredPoly(r.den).length > 1) {
      const den = factoredPoly(r.den)
      // Vorzeichen so, dass der Zähler ein Quadrat ist: \frac{-a^2}{y - 1} = \frac{a^2}{1 - y}
      const flip = r.num.length === 1 && ratSign(r.num[0].coef) < 0
      const top = monomialSqrt(flip ? polyScale(r.num, rat(-1)) : r.num)
      if (top) return div(polyToExpr(top, atoms), sqrt(polyToExpr(flip ? polyScale(den, rat(-1)) : den, atoms)))
    }
    const form = f && squareDenominatorRoot(f, atoms, !outside)
    return form ?? same
  }
  if (e.kind !== 'add' && e.kind !== 'mul' && e.kind !== 'neg' && e.kind !== 'div' && e.kind !== 'pow') return e
  const parts = e.kind === 'pow' ? [e.base] : children(e)
  const changed = parts.map((x) => simplerRoots(x, false))
  if (changed.every((x, i) => x === parts[i])) return e
  return e.kind === 'pow' ? pow(changed[0], e.exp) : rebuilt(e, (x) => changed[parts.indexOf(x)])!
}

// Wurzel aus einem Bruch mit einem Monom im Nenner als \frac{\sqrt{…}}{…}: Zähler und Nenner so
// erweitert, dass der Nenner ein Quadrat ist (\sqrt{\frac{147 + 4y}{12}} = \frac{\sqrt{441 + 12y}}{6});
// null, wenn der Nenner 1 oder kein Monom ist
function squareDenominatorRoot(f: Frac, atoms: Atoms, extend: boolean): Expr | null {
  const r = reduceFrac(f)
  const d = factoredPoly(r.den)
  if (d.length !== 1 || constValue(d) !== null && isOne(constValue(d)!)) return null
  const [{ mono, coef }] = d
  if (ratSign(coef) <= 0 || coef.d !== 1n) return null
  // fehlender Faktor zum Quadrat: Primzahlen und Buchstaben mit ungerader Hochzahl
  let rest = coef.n
  let missing = 1n
  for (let p = 2n; p * p <= rest; p++) {
    let k = 0
    while (rest % p === 0n) {
      rest /= p
      k++
    }
    if (k % 2 === 1) missing *= p
  }
  missing *= rest
  if (!extend && (missing !== 1n || mono.some(([, k]) => k % 2 === 1))) return null
  const m: Poly = [{ mono: mono.filter(([, k]) => k % 2 === 1).map(([a]) => [a, 1] as const), coef: rat(missing) }]
  const rd = monomialSqrt(polyMul(d, m))
  if (!rd) return null
  return div(sqrt(polyToExpr(polyMul(r.num, m), atoms)), polyToExpr(rd, atoms))
}

// Summe, die mit Minus beginnt, mit Plus vorn: -3 + \sqrt{9 + a} → \sqrt{9 + a} - 3
function plusFirst(e: Expr): Expr {
  if (e.kind !== 'add' || !isNegative(e.terms[0]) || e.terms.every(isNegative)) return e
  return add(...e.terms.filter((x) => !isNegative(x)), ...e.terms.filter(isNegative))
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
      // \frac{1}{b}(…) = w: mal b statt durch \frac{1}{b} (bei \frac{2}{b} bleibt die 2 stehen)
      if (d.kind === 'div') {
        const kept = isOneExpr(d.num) ? withT[0] : timesFactor(withT[0], d.num)
        return { kind: 'multiply', operand: d.den, side, after: at(side, kept, timesFactor(o, d.den)) }
      }
      return { kind: 'divide', operand: d, side, after: at(side, withT[0], dividedBy(o, d)) }
    }
    case 'div': {
      const inNum = has(s.num)
      const inDen = has(s.den)
      if (inNum && inDen) return null
      if (inNum) return { kind: 'multiply', operand: s.den, side, after: at(side, s.num, timesFactor(o, s.den)) }
      if (isOneExpr(s.num)) {
        // 1/D = O: erst O zu einem Bruch, dann Kehrwert
        if (o.kind === 'add') {
          const f = combined(o)
          if (f) return { kind: 'combine', side, after: at(side, s, f) }
        }
        return { kind: 'reciprocal', side, after: at(side, s.den, reciprocal(o)) }
      }
      // N/D = O mit Brüchen in O: erst O zu einem Bruch, sonst entsteht später ein Doppelbruch
      if (o.kind === 'add' && subterms(o).some((x) => x.kind === 'div')) {
        const f = combined(o)
        if (f) return { kind: 'combine', side, after: at(side, s, f) }
      }
      return { kind: 'multiply', operand: s.den, side, after: at(side, s.num, timesFactor(o, s.den)) }
    }
    case 'pow': {
      if (has(s.exp)) {
        if (has(s.base)) return null
        // erst zu einem Bruch, dann logarithmieren: \ln\frac{a - y}{by} statt \ln\left(\frac{a}{by} - \frac{1}{b}\right)
        if (isSumWithFraction(o)) {
          const f = combined(o)
          if (f) return { kind: 'combine', side, after: at(side, s, f) }
        }
        // \ln(e^F) = F gleich; bei einer anderen Basis folgt das Logarithmusgesetz als eigener Schritt
        return { kind: 'log', side, after: at(side, isE(s.base) ? s.exp : fn('ln', s), lnOf(o)), requires: o }
      }
      const k = asRational(s.exp)
      if (!k || !isInteger(k) || (k.n !== 2n && k.n !== 3n)) return null
      // erst zu einem Bruch, wenn danach noch weiter umgeformt wird: \sqrt{\frac{qr - s}{r}} statt
      // \sqrt{q - \frac{s}{r}} (bei x^2 = … macht das das Ergebnis)
      if (isSumWithFraction(o) && !isVar(s.base, t)) {
        const f = combined(o)
        if (f) return { kind: 'combine', side, after: at(side, s, f) }
      }
      return { kind: 'root', operand: num(k), side, after: at(side, s.base, k.n === 2n ? sqrt(o) : root(o, 3)) }
    }
    case 'root':
      if (s.index !== 2) return null
      if (isSumWithFraction(o) && !isVar(s.arg, t)) {
        const f = combined(o)
        if (f) return { kind: 'combine', side, after: at(side, s, f) }
      }
      return { kind: 'square', side, after: at(side, s.arg, squared(o)), requires: o }
    case 'fn': {
      // \ln u = w → u = e^w
      if (s.name === 'ln') {
        // nach der pq-Formel erst zu einem Bruch: e^{\frac{a + \sqrt{a^2 + 4b}}{2}}
        if (isSumWithFraction(o) && subterms(o).some((x) => x.kind === 'root')) {
          const f = combined(o)
          if (f) return { kind: 'combine', side, after: at(side, s, f) }
        }
        return { kind: 'exp', operand: E, side, after: at(side, s.arg, powerOf(E, o)) }
      }
      // \sin u = w → u = \arcsin w (erst zu einem Bruch: \arcsin\frac{y - ab}{a})
      const arc = ARC_OF[s.name]
      if (arc) {
        if (isSumWithFraction(o)) {
          const f = combined(o)
          if (f) return { kind: 'combine', side, after: at(side, s, f) }
        }
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
  if (isOneExpr(o)) return base
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
  // Bruch als Vorzahl: \frac{a}{2}u · 2u → au^2 (nicht 2u \cdot \frac{a}{2}u)
  if (term.kind === 'mul') {
    const fractions = term.factors.filter((f) => f.kind === 'div' && (f.den.kind === 'num' || isMonomial(f.den)))
    if (fractions.length === 1 && fractions[0].kind === 'div') {
      const f = fractions[0]
      const rest = term.factors.filter((g) => g !== f)
      return termTimes(div(mul(f.num, ...rest), f.den), lcd, atoms, written)
    }
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
  // Faktor mal Wurzel, auf der anderen Seite keine Wurzel: gleich quadrieren, x = y\sqrt{x^2 + a} →
  // x^2 = y^2(x^2 + a)
  for (const side of ['lhs', 'rhs'] as const) {
    const s = e[side]
    const o = side === 'lhs' ? e.rhs : e.lhs
    if (s.kind !== 'mul' || hasR(o) || o.kind === 'add' || !contains(o, t)) continue
    const rest = s.factors.filter((f) => key(f) !== key(r))
    if (rest.length !== s.factors.length - 1 || rest.some((f) => contains(f, t))) continue
    return { kind: 'square', side, after: at(side, mul(squared(mul(...rest)), inner), squared(o)), requires: o }
  }
  // Bruch mit der Variable im Nenner, die andere Seite ohne sie: mit dem Nenner malnehmen,
  // \frac{x}{\sqrt{x^2 + a}} = y → x = y\sqrt{x^2 + a}
  for (const side of ['lhs', 'rhs'] as const) {
    const s = e[side]
    const o = side === 'lhs' ? e.rhs : e.lhs
    if (s.kind !== 'div' || !contains(s.den, t) || contains(o, t)) continue
    return { kind: 'multiply', operand: s.den, side, after: at(side, s.num, timesFactor(o, s.den)) }
  }
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
// constant: auch Logarithmen ohne die Variable (\ln a)
function logParts(s: Expr, t: string, constant = false): { base: Expr; arg: Expr } | null {
  if (s.kind === 'fn' && s.name === 'ln' && (constant || contains(s.arg, t))) return { base: E, arg: s.arg }
  if (s.kind === 'log' && (constant || contains(s.arg, t)) && !contains(s.base, t)) return { base: s.base, arg: s.arg }
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
  // \cos^2 u und \sin u: das Quadrat ersetzen, dann steht nur noch \sin u da (quadratisch, Schritt 6c)
  const all = [e.lhs, e.rhs].flatMap((side) => subterms(side))
  for (const square of squares) {
    const f = square.base as Extract<Expr, { kind: 'fn' }>
    const pair = PAIRS.find((p) => p.sin === f.name || p.cos === f.name)
    if (!pair) continue
    const partnerName = f.name === pair.sin ? pair.cos : pair.sin
    const plain = all.some((s) => s.kind === 'fn' && s.name === partnerName && key(s.arg) === key(f.arg))
    if (!plain) continue
    const replace = new Map([[key(square), pythagorasOf(square, wrong)]])
    return { kind: 'pythagoras', operand: square, after: eq(substitute(e.lhs, replace), substitute(e.rhs, replace)) }
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

// --- Spitzer Winkel als Buchstabe (Stufe 5, Teil 8b) ---
//
// Beim Winkel zwischen Vektoren ist der Winkel ein Buchstabe: \arccos\frac{x}{\sqrt{x^2 + a^2 + b^2}} = y mit
// der Bedingung y < \frac{\pi}{2}. Für so einen spitzen Winkel sind \sin y, \cos y und \tan y positiv. Dann
// ersetzt die Engine nach dem Ausklammern 1 - \cos^2 y durch \sin^2 y (eigener Schritt) und schreibt das
// Ergebnis mit \tan y: x = \frac{\sqrt{a^2 + b^2}}{\tan y}. Nur Aufgaben mit so einer Bedingung an einen
// Buchstaben rechnen so; in allen anderen gelten Bedingungen mit \pi nur für die gesuchte Variable, ihr
// Rechenweg bleibt derselbe.

// Buchstaben p (nicht die gesuchte Variable) mit einer Winkelbedingung wie p < \frac{\pi}{2} oder p < \frac{\pi}{3}:
// Schranke mit \pi, ohne Buchstaben, höchstens \frac{\pi}{2}
function acuteLetters(conditions: readonly Condition[], target: string): ReadonlySet<string> {
  const out = new Set<string>()
  for (const c of conditions) {
    if (c.lhs.kind !== 'var' || c.lhs.name === target || c.rel !== '<' || variablesOf(c.rhs).length > 0) continue
    if (!subterms(c.rhs).some((s) => key(s) === key(PI))) continue
    const bound = evaluate(c.rhs, {})
    if (bound > 0 && bound <= Math.PI / 2 + 1e-12) out.add(c.lhs.name)
  }
  return out
}

// c\left(1 - \cos^2 p\right) als c\sin^2 p, c\left(1 - \sin^2 p\right) als c\cos^2 p (c eine Zahl oder Buchstaben mit
// Plus wie 4 oder b^2, p ein Buchstabe, mit letters einer von diesen); sonst null
export function acuteSquare(s: Expr, letters?: ReadonlySet<string>): Expr | null {
  if (s.kind !== 'add') return null
  const atoms = anyAtoms()
  const p = toPoly(s, atoms)
  if (!p || p.length !== 2) return null
  for (const f of [...atoms.opaque.values()]) {
    if (f.kind !== 'fn' || (f.name !== 'sin' && f.name !== 'cos') || f.arg.kind !== 'var' || (letters && !letters.has(f.arg.name))) continue
    const atom = atoms.names.get(key(f))
    const c = p.filter((term) => !term.mono.some(([a]) => a === atom))
    if (c.length !== 1 || ratSign(c[0].coef) <= 0) continue
    if (!polyEquals(p, polyMul(c, toPoly(add(num(1), neg(squareOf(f))), atoms)!))) continue
    const square = squareOf(fn(f.name === 'cos' ? 'sin' : 'cos', f.arg))
    const front = polyToExpr(c, atoms)
    return isOneExpr(front) ? square : mul(...factorsOf(front), square)
  }
  return null
}

// Faktor neben der Unbekannten ersetzen, die Vorzahl nach vorn: x^2\left(1 - \cos^2 y\right) = … → x^2\sin^2 y = …,
// x^2\left(4 - 4\cos^2 y\right) = … → 4x^2\sin^2 y = … (y ein spitzer Winkel); mit forget der typische Fehler,
// das Quadrat zu vergessen (x^2\sin y = …)
function acutePythagorasStep(e: Equation, t: string, acute: ReadonlySet<string>, forget = false): Draft | null {
  if (acute.size === 0) return null
  for (const s of [e.lhs, e.rhs].flatMap((side) => subterms(side))) {
    if (s.kind !== 'mul' || !s.factors.some((f) => contains(f, t))) continue
    for (const f of s.factors) {
      const square = contains(f, t) ? null : acuteSquare(f, acute)
      if (!square) continue
      const parts = factorsOf(square)
      const last = parts[parts.length - 1]
      const product = mul(...parts.slice(0, -1), ...s.factors.filter((g) => g !== f), forget && last.kind === 'pow' ? last.base : last)
      const replace = new Map([[key(s), product]])
      return { kind: 'pythagoras', operand: f, after: eq(substitute(e.lhs, replace), substitute(e.rhs, replace)) }
    }
  }
  return null
}

// Buchstaben der Winkel in einer Summe wie 1 - \cos^2 y
const angleLetters = (e: Expr): ReadonlySet<string> =>
  new Set(subterms(e).flatMap((s) => (s.kind === 'fn' && s.arg.kind === 'var' ? [s.arg.name] : [])))

// Typischer Fehler beim spitzen Winkel: 1 - \cos^2 y durch \sin y ersetzt, das Quadrat vergessen
export function acutePythagorasWrong(step: RearrangeStep, t: string): Equation | null {
  if (step.kind !== 'pythagoras' || step.operand?.kind !== 'add') return null
  return acutePythagorasStep(step.before, t, angleLetters(step.operand), true)?.after ?? null
}

// Typischer Fehler beim Ergebnis mit \tan y: \frac{\cos y}{\sin y} als \tan y geschrieben, also \tan y und
// \frac{1}{\tan y} vertauscht: x = \sqrt{a^2 + b^2}\tan y statt \frac{\sqrt{a^2 + b^2}}{\tan y},
// \frac{\sqrt{a^2 + b^2}\tan y}{2} statt \frac{\sqrt{a^2 + b^2}}{2\tan y}, \frac{a}{\tan y} statt a\tan y
export function acuteTanWrong(step: RearrangeStep, t: string): Equation | null {
  const tan = step.operand
  if (step.kind !== 'finish' || tan?.kind !== 'fn' || tan.name !== 'tan') return null
  const without = (fs: readonly Expr[]) => {
    const i = fs.findIndex((f) => key(f) === key(tan))
    return i < 0 ? null : [...fs.slice(0, i), ...fs.slice(i + 1)]
  }
  const r = step.after.rhs
  let flipped: Expr | null = null
  if (r.kind === 'div') {
    const den = without(factorsOf(r.den))
    const top = den ? null : without(factorsOf(r.num))
    if (den) flipped = den.length === 0 ? mul(...factorsOf(r.num), tan) : div(mul(...factorsOf(r.num), tan), mul(...den))
    else if (top) flipped = div(top.length === 0 ? num(1) : mul(...top), mul(...factorsOf(r.den), tan))
  } else {
    const rest = without(factorsOf(r))
    if (rest) flipped = div(rest.length === 0 ? num(1) : mul(...rest), tan)
  }
  // \tan y nicht als Faktor, etwa im Quadrat unter der Wurzel: \sqrt{a^2\tan^2 y - b^2} → \sqrt{\frac{a^2}{\tan^2 y} - b^2}
  if (!flipped) {
    const flip = (e: Expr): Expr => {
      if (key(e) === key(tan)) return div(num(1), tan)
      switch (e.kind) {
        case 'add':
          return add(...e.terms.map(flip))
        case 'mul':
          return mul(...e.factors.map(flip))
        case 'neg':
          return neg(flip(e.arg))
        case 'div':
          return div(flip(e.num), flip(e.den))
        case 'root':
          return { ...e, arg: flip(e.arg) }
        case 'pow':
          return pow(flip(e.base), e.exp)
        default:
          return e
      }
    }
    const wrong = finalForm(flip(r))
    if (key(wrong) !== key(r)) flipped = wrong
  }
  return flipped && eq(variable(t), flipped)
}

// Endform mit spitzen Winkeln: Stehen \sin p und \cos p nur in geraden Potenzen da (auch unter der Wurzel),
// bleibt mit \sin^2 p = \frac{\tan^2 p}{1 + \tan^2 p} und \cos^2 p = \frac{1}{1 + \tan^2 p} nur \tan p übrig:
// \sqrt{\frac{a^2\cos^2 y + b^2\cos^2 y}{\sin^2 y}} = \frac{\sqrt{a^2 + b^2}}{\tan y}, \sqrt{\frac{a^2}{\cos^2 y} - a^2} = a\tan y.
// null, wenn das nicht geht, danach noch 1 + \tan^2 p dasteht oder der Bruch mehr Summanden hätte als vorher;
// sonst Ergebnis und \tan p (für den Text)
function acuteForm(o: Expr, acute: ReadonlySet<string>): { result: Expr; tan: Expr } | null {
  if (acute.size === 0) return null
  const inRoot = o.kind === 'root' && o.index === 2
  const atoms = anyAtoms()
  const original = toRat(inRoot ? o.arg : o, atoms)
  let f = original
  let tan: Expr | null = null
  for (const p of acute) {
    const [c, s] = (['cos', 'sin'] as const).map((name) => atoms.names.get(key(fn(name, variable(p)))))
    if (!f || (!c && !s)) continue
    const half = (term: Poly[number], atom: string | undefined) => (term.mono.find(([a]) => a === atom)?.[1] ?? 0) / 2
    const terms = [...f.num, ...f.den]
    if (terms.some((term) => !Number.isInteger(half(term, c)) || !Number.isInteger(half(term, s)))) return null
    const tanP = fn('tan', variable(p))
    const tanSquare = polyPow(toPoly(tanP, atoms)!, 2)
    const onePlus = polyAdd(polyConst(1), tanSquare)
    const k = Math.max(...terms.map((term) => half(term, c) + half(term, s)))
    // \cos^{2i} p \sin^{2j} p = \frac{\tan^{2j} p}{(1 + \tan^2 p)^{i + j}}; Zähler und Nenner mal (1 + \tan^2 p)^k
    const rewrite = (q: Poly): Poly =>
      polySum(
        q.map((term) => {
          const rest: Poly = [{ mono: term.mono.filter(([a]) => a !== c && a !== s), coef: term.coef }]
          return polyMul(polyMul(rest, polyPow(tanSquare, half(term, s))), polyPow(onePlus, k - half(term, c) - half(term, s)))
        }),
      )
    f = { num: rewrite(f.num), den: rewrite(f.den) }
    const r = reduceFrac(f)
    if (polyDivideExact(r.num, onePlus) || polyDivideExact(factoredPoly(r.den), onePlus)) return null
    tan = tanP
  }
  // nie länger als vorher (z. B. mit (\sqrt{2})^2, das die Engine nicht ausrechnet)
  const size = (g: Frac) => {
    const r = reduceFrac(g)
    return r.num.length + factoredPoly(r.den).length
  }
  if (!f || !original || !tan || size(f) > size(original)) return null
  return { result: inRoot ? acuteRoot(f, atoms) : niceFrac(f, atoms), tan }
}

// Wurzel wie rootForm, aber mit einer Zahl im Nenner, die kein Quadrat ist, als eigene Wurzel:
// \sqrt{\frac{a^2}{2\tan^2 y}} = \frac{a}{\sqrt{2}\tan y}
function acuteRoot(f: Frac, atoms: Atoms): Expr {
  const { n, d } = reduced(f, atoms)
  const rn = monomialSqrt(n)
  const c = d.length === 1 && isInteger(d[0].coef) && ratSign(d[0].coef) > 0 && !monomialSqrt(polyConst(d[0].coef)) ? d[0].coef : null
  const rest = c && monomialSqrt([{ mono: d[0].mono, coef: rat(1) }])
  if (!rn || !c || !rest) return rootForm(f, atoms)
  const m = polyToExpr(rest, atoms)
  return div(polyToExpr(rn, atoms), isOneExpr(m) ? sqrt(num(c)) : mul(sqrt(num(c)), m))
}

// Unbekannte beim Sortieren, Ausklammern und Teilen: x, √x (mit x = (√x)²) oder ein Baustein wie e^x
export function unknownAtoms(e: Equation, t: string): { atoms: Atoms; u: string; uExpr: Expr; block: Expr | null } {
  const block = blockOf(e, t)
  if (block) return { atoms: blockAtoms(t, block), u: BLOCK_ATOM, uExpr: block, block }
  const rootUnknown = hasTargetRoot(e, t)
  return { atoms: newAtoms(t, rootUnknown), u: rootUnknown ? ROOT_ATOM : t, uExpr: rootUnknown ? sqrt(variable(t)) : variable(t), block: null }
}

// ±k · \ln u als Summand: Vorzeichen, Basis und u^k
export function signedLog(term: Expr, t: string, constant = false): { sign: 1 | -1; base: Expr; arg: Expr } | null {
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
  const p = logParts(x, t, constant)
  if (!p) return null
  return { sign, base: p.base, arg: k === 1n ? p.arg : pow(p.arg, num(k)) }
}

// Mehrere Logarithmen mit der Variable in einer Summe zu einem zusammenfassen (Logarithmusgesetze):
// \ln(x + a) + \ln(x - a) = b → \ln((x + a)(x - a)) = b, \ln(x + a) - \ln x = b → \ln\frac{x + a}{x} = b
function logCombineStep(e: Equation, t: string): Draft | null {
  for (const side of ['lhs', 'rhs'] as const) {
    const s = e[side]
    if (s.kind !== 'add') continue
    // nur Logarithmen (auch ohne die Variable, z. B. nach dem Einsetzen der Grenzen eines Integrals):
    // alle zusammen, \ln x - \ln(x + b) - \ln a + \ln(a + b) → \ln\frac{x(a + b)}{a(x + b)}
    const all = s.terms.map((term) => signedLog(term, t, true))
    const onlyLogs = all.every((p) => p !== null) && s.terms.some((term) => !contains(term, t)) && s.terms.some((term) => contains(term, t))
    const parsed = onlyLogs ? all : s.terms.map((term) => signedLog(term, t))
    const logs = parsed.filter((p) => p !== null)
    if (logs.length < 2 || logs.some((p) => key(p.base) !== key(logs[0].base))) continue
    const ups = logs.filter((p) => p.sign > 0).map((p) => p.arg)
    const downs = logs.filter((p) => p.sign < 0).map((p) => p.arg)
    if (ups.length === 0) continue
    // Buchstaben vor Klammern: a(x + b)
    const product = (xs: Expr[]) => (xs.length === 1 ? xs[0] : mul(...[...xs.filter(isMonomial), ...xs.filter((x) => !isMonomial(x))]))
    const written = downs.length > 0 ? div(product(ups), product(downs)) : product(ups)
    // mit Logarithmen ohne die Variable gekürzt: \frac{3a(x - a)}{a(x + a)} → \frac{3(x - a)}{x + a}
    const raw = onlyLogs ? toRat(written, newAtoms(t)) : null
    const cancels = raw !== null && totalDegree(factoredPoly(reduceFrac(raw).den)) < totalDegree(raw.den)
    const arg = raw && cancels ? niceFrac(raw, newAtoms(t)) : written
    const combined = isE(logs[0].base) ? fn('ln', arg) : log(logs[0].base, arg)
    const first = parsed.findIndex((p) => p !== null)
    const terms = s.terms.flatMap((term, i) => (i === first ? [combined] : parsed[i] ? [] : [term]))
    return { kind: 'logCombine', operand: logs[0].base, side, after: at(side, sumOf(terms), side === 'lhs' ? e.rhs : e.lhs) }
  }
  return null
}

// --- Logarithmen auf beiden Seiten (M6 Schritt 4b-2) ---
//
// Steht die Variable nur in Logarithmen, und zwar in verschiedenen Logarithmen auf beiden Seiten
// (\log_2(x - a) = \log_2(b - x) + 1, 2\ln x = \ln(ax + b)), geht es wie im Skript: verschiedene Basen
// zuerst auf eine bringen (Basiswechsel), Brüche wegmultiplizieren, Faktoren als Hochzahl hineinziehen,
// Zahlen als Logarithmus derselben Basis schreiben, je Seite zusammenfassen (logCombineStep),
// entlogarithmieren. Danach ist die Gleichung linear oder quadratisch. Zusammenfassen und Faktoren
// hineinziehen vergrößern den Definitionsbereich; die Bedingungen der Aufgabe sorgen für die passende
// Lösung, bei der pq-Formel die Probe mit der Gleichung vom Anfang (chooseRoot).
// Verschiedene Basen auf einer Seite mit demselben Argument (\ln(x + a) + \log_3(x + a) = b) gehen nach
// dem Basiswechsel über den Baustein \ln(x + a) weiter.

// Summand als Faktor mal Logarithmus: \log_2 u, -2\ln u, \frac{\log_2 u}{2}; null sonst
export type LogTerm = { readonly coef: Rational; readonly base: Expr; readonly arg: Expr }

function logTerm(term: Expr, t: string): LogTerm | null {
  let x = term
  let coef = rat(1)
  if (x.kind === 'neg') {
    coef = ratNeg(coef)
    x = x.arg
  }
  if (x.kind === 'div' && x.den.kind === 'num' && isInteger(x.den.value) && x.den.value.n > 0n) {
    coef = ratDiv(coef, x.den.value)
    x = x.num
  }
  if (x.kind === 'mul' && x.factors.length === 2 && x.factors[0].kind === 'num') {
    coef = ratMul(coef, x.factors[0].value)
    x = x.factors[1]
  }
  const p = logParts(x, t, true)
  return p && !contains(p.base, t) ? { coef, base: p.base, arg: p.arg } : null
}

const logExpr = (base: Expr, arg: Expr): Expr => (isE(base) ? fn('ln', arg) : log(base, arg))

// Faktor mal Logarithmus als Summand: 2\log_2 u, -\ln u, \frac{\log_2 u}{2}
export function logTermExpr(coef: Rational, base: Expr, arg: Expr): Expr {
  const L = logExpr(base, arg)
  const a = ratAbs(coef)
  const top = a.n === 1n ? L : mul(num(a.n), L)
  const body = a.d === 1n ? top : div(top, num(a.d))
  return ratSign(coef) < 0 ? neg(body) : body
}

// Ganzzahlige Basis als Potenz der kleinsten möglichen Basis: 8 = 2^3, 9 = 3^2, 6 = 6^1
function smallestBase(b: Expr): { g: bigint; m: bigint } | null {
  if (b.kind !== 'num' || !isInteger(b.value) || b.value.n < 2n) return null
  const n = b.value.n
  for (let g = 2n; g <= n; g++) {
    let p = g
    let m = 1n
    while (p < n) {
      p *= g
      m++
    }
    if (p === n) return { g, m }
  }
  return null
}

// Zahl ohne die Variable als Logarithmus der Basis: 1 = \log_2 2, 3 = \log_2 8, 2 = \log_a\left(a^2\right),
// c = \log_2\left(2^c\right), 1 = \ln e; null, wenn das nicht glatt geht
export function numberAsLog(c: Expr, base: Expr): Expr | null {
  const value = c.kind === 'num' ? c.value : null
  if (value && !isInteger(value)) return null
  if (value && base.kind === 'num' && isInteger(base.value)) {
    const k = value.n
    const power = base.value.n ** (k < 0n ? -k : k)
    if (power > 10000n) return logExpr(base, pow(base, c))
    return logExpr(base, k < 0n ? num(1n, power) : num(power))
  }
  if (value && isOne(value)) return logExpr(base, base)
  if (!value && !(c.kind === 'var' || (c.kind === 'mul' && c.factors.every((f) => f.kind === 'var' || f.kind === 'num')))) return null
  return logExpr(base, pow(base, c))
}

// Logarithmen eines Summanden ohne die Variable, die schon zur Basis passen (\log_2 3): bleiben stehen
const isLogOf = (term: Expr, base: Expr, t: string) => {
  const lt = logTerm(term, t)
  return lt !== null && key(lt.base) === key(base) && isInteger(lt.coef)
}

// Wege mit Logarithmen auf beiden Seiten oder verschiedenen Basen (M6 Schritt 4b-2): Die Engine ging sie vorher nicht;
// ältere Vorlagen nehmen solche Aufgaben nicht, damit ihre Nummern dieselbe Aufgabe behalten (solution.logPath)
let logPaths = 0

function logEquationStep(e: Equation, t: string): Draft | null {
  const draft = logEquationDraft(e, t)
  if (draft) logPaths++
  return draft
}

function logEquationDraft(e: Equation, t: string): Draft | null {
  const sides = [termsOf(e.lhs), termsOf(e.rhs)] as const
  const parsed = sides.map((terms) => terms.map((term) => logTerm(term, t)))
  // die Variable nur in Logarithmen, die selbst Summanden sind
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < sides[i].length; j++) {
      if (!contains(sides[i][j], t)) continue
      const lt = parsed[i][j]
      if (!lt || !contains(lt.arg, t)) return null
      // nicht nach dem Logarithmieren (\ln\left(3^{2x - 1}\right) = \ln\left(a \cdot 5^x\right)) und nicht \ln vom \ln
      if (subterms(lt.arg).some((s) => isTPower(s, t) || logParts(s, t) !== null)) return null
    }
  }
  const tLogs = parsed.flatMap((ps, i) => ps.filter((p, j): p is LogTerm => p !== null && contains(sides[i][j], t)))
  if (tLogs.length < 2) return null
  const bases = [...new Map(tLogs.map((p) => [key(p.base), p.base])).values()]
  const both = sides.every((terms) => terms.some((term) => contains(term, t)))
  if (bases.length > 1) return baseChangeDraft(bases, sides, parsed)
  // ein einziger Logarithmus (auch auf beiden Seiten): als Baustein (blockOf)
  if (new Set(tLogs.map((p) => key(p.arg))).size < 2 || !both) return null
  const base = bases[0]
  // Brüche aus dem Basiswechsel: beide Seiten mit dem Hauptnenner malnehmen
  const dens = parsed.flat().filter((p): p is LogTerm => p !== null && key(p.base) === key(base)).map((p) => p.coef.d)
  const lcm = dens.reduce((a, d) => (a * d) / gcd(a, d), 1n)
  if (lcm > 1n) {
    const times = (terms: readonly Expr[], ps: readonly (LogTerm | null)[]) =>
      sumOf(terms.map((term, j) => {
        const p = ps[j]
        return p && key(p.base) === key(base) ? logTermExpr(ratMul(p.coef, rat(lcm)), p.base, p.arg) : timesFactor(term, num(lcm))
      }))
    return { kind: 'multiply', operand: num(lcm), after: eq(times(sides[0], parsed[0]), times(sides[1], parsed[1])) }
  }
  // Faktor vor einem Logarithmus mit der Variable als Hochzahl hineinziehen: 2\log_2 x = \log_2\left(x^2\right)
  if (tLogs.some((p) => !ratEq(ratAbs(p.coef), rat(1)))) {
    const inside = (terms: readonly Expr[], ps: readonly (LogTerm | null)[]) =>
      sumOf(terms.map((term, j) => {
        const p = ps[j]
        if (!p || !contains(term, t) || ratEq(ratAbs(p.coef), rat(1))) return term
        return logTermExpr(rat(ratSign(p.coef)), p.base, powerOfArg(p.arg, ratAbs(p.coef).n))
      }))
    return { kind: 'logPower', operand: base, after: eq(inside(sides[0], parsed[0]), inside(sides[1], parsed[1])) }
  }
  // Zahlen als Logarithmus derselben Basis schreiben: 1 = \log_2 2
  const constants = sides.flatMap((terms) => terms.filter((term) => !contains(term, t) && !isLogOf(term, base, t)))
  if (constants.length > 0) {
    // die neuen Logarithmen vorn, damit beim Zusammenfassen die Zahl vorn steht: \log_2 8 + \log_2 x = \log_2(8x)
    const asLogs = (terms: readonly Expr[]): Expr | null => {
      const front: Expr[] = []
      const rest: Expr[] = []
      for (const term of terms) {
        if (contains(term, t) || isLogOf(term, base, t)) {
          rest.push(term)
          continue
        }
        const { minus, size } = unsigned(term)
        const l = numberAsLog(size, base)
        if (!l) return null
        front.push(minus ? neg(l) : l)
      }
      // ein Minus nicht vorn: \log_2 x - \log_2 2 statt -\log_2 2 + \log_2 x
      return sumOf(front.some((x) => x.kind === 'neg') ? [...rest, ...front] : [...front, ...rest])
    }
    const l = asLogs(sides[0])
    const r = asLogs(sides[1])
    return l && r ? { kind: 'logNumber', operand: base, after: eq(l, r) } : null
  }
  // je Seite ein Logarithmus derselben Basis: entlogarithmieren (mehrere fasst vorher logCombineStep zusammen)
  if (sides.every((terms) => terms.length === 1)) {
    const [l, r] = [parsed[0][0], parsed[1][0]]
    if (l && r && isOne(l.coef) && isOne(r.coef)) return { kind: 'unlog', operand: base, after: eq(l.arg, r.arg) }
  }
  return null
}

// Zahl ohne Vorzeichen: -c und die negative Zahl -2 (nach dem Malnehmen) als Minus vor c bzw. 2
export function unsigned(term: Expr): { minus: boolean; size: Expr } {
  if (term.kind === 'neg') return { minus: true, size: term.arg }
  if (term.kind === 'num' && ratSign(term.value) < 0) return { minus: true, size: num(ratNeg(term.value)) }
  return { minus: false, size: term }
}

// Argument hoch k: x^2, ein Produkt wie 4x ausgerechnet (16x^2), eine Summe in Klammern ((x + a)^2)
export function powerOfArg(arg: Expr, k: bigint): Expr {
  const atoms = anyAtoms()
  const p = toPoly(arg, atoms)
  if (p && p.length === 1 && !(arg.kind === 'var')) return polyToExpr(polyPow(p, Number(k)), atoms)
  return pow(arg, num(k))
}

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b))

// Basiswechsel: alle Logarithmen mit der Variable auf eine Basis. Sind die Basen Potenzen derselben Zahl (2, 4, 8), auf
// diese: \log_4 u = \frac{\log_2 u}{2}; sonst auf e: \log_3 u = \frac{\ln u}{\ln 3}
// wrong: typische Fehler, falsch herum (\log_4 u = 2\log_2 u, \log_3 u = \ln 3 \cdot \ln u) bzw. als Logarithmus des
// Quotienten (\log_4 u = \log_2\frac{u}{4}, \log_3 u = \ln\frac{u}{3})
type BaseMistake = 'flipped' | 'quotient'

function baseChangeDraft(
  bases: readonly Expr[],
  sides: readonly (readonly Expr[])[],
  parsed: readonly (readonly (LogTerm | null)[])[],
  wrong: BaseMistake | null = null,
): Draft | null {
  const powers = bases.map(smallestBase)
  const common = powers.every((p) => p !== null && p.g === powers[0]!.g) ? num(powers[0]!.g) : E
  const rewrite = (terms: readonly Expr[], ps: readonly (LogTerm | null)[]): Expr | null => {
    const out: Expr[] = []
    for (let j = 0; j < terms.length; j++) {
      const p = ps[j]
      // auch Logarithmen ohne die Variable (\log_4 b), wenn sich ihre Basis umrechnen lässt
      const convertible = p !== null && (common === E || smallestBase(p.base)?.g === (common as Extract<Expr, { kind: 'num' }>).value.n)
      if (!p || !convertible || key(p.base) === key(common)) {
        out.push(terms[j])
        continue
      }
      if (common !== E) {
        const m = smallestBase(p.base)!.m
        if (wrong === 'quotient') out.push(logTermExpr(p.coef, common, div(p.arg, p.base)))
        else out.push(logTermExpr(wrong === 'flipped' ? ratMul(p.coef, rat(m)) : ratDiv(p.coef, rat(m)), common, p.arg))
        continue
      }
      if (!isInteger(p.coef)) return null
      if (wrong === 'quotient') {
        out.push(logTermExpr(p.coef, E, div(p.arg, p.base)))
        continue
      }
      const k = p.coef.n < 0n ? -p.coef.n : p.coef.n
      const top = k === 1n ? fn('ln', p.arg) : mul(num(k), fn('ln', p.arg))
      const body = wrong === 'flipped' ? mul(fn('ln', p.base), fn('ln', p.arg)) : div(top, fn('ln', p.base))
      const scaled = wrong === 'flipped' && k !== 1n ? mul(num(k), body) : body
      out.push(p.coef.n < 0n ? neg(scaled) : scaled)
    }
    return sumOf(out)
  }
  const l = rewrite(sides[0], parsed[0])
  const r = rewrite(sides[1], parsed[1])
  return l && r ? { kind: 'logBase', operand: common, after: eq(l, r) } : null
}

// Typische Fehler beim Basiswechsel (Gleichung danach; null, wenn es nicht passt)
export function logBaseWrong(e: Equation, t: string, wrong: BaseMistake): Equation | null {
  const sides = [termsOf(e.lhs), termsOf(e.rhs)] as const
  const parsed = sides.map((terms) => terms.map((term) => logTerm(term, t)))
  const tLogs = parsed.flat().filter((p): p is LogTerm => p !== null && contains(p.arg, t))
  const bases = [...new Map(tLogs.map((p) => [key(p.base), p.base])).values()]
  if (bases.length < 2) return null
  return baseChangeDraft(bases, sides, parsed, wrong)?.after ?? null
}

// Summanden einer Seite als Logarithmen (für die typischen Fehler): null, wenn ein Summand mit der Variable keiner ist
export type SideLogTerm = { readonly term: Expr; readonly log: LogTerm | null }
export function sideLogTerms(side: Expr, t: string): SideLogTerm[] | null {
  const out = termsOf(side).map((term) => ({ term, log: logTerm(term, t) }))
  return out.every((x) => !contains(x.term, t) || (x.log && contains(x.log.arg, t))) ? out : null
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

// --- Substitution und pq-Formel (Stufe 4, Schritt 6c) ---
//
// Kommt die Variable in verschiedenen Formen vor, die Potenzen eines Bausteins sind (e^{2x} und e^x,
// e^x und e^{-x}, x und √x, \sin^2 x und \sin x), und wird die Gleichung damit quadratisch, steht
// zuerst u für den Baustein. Die Gleichung in u wird wie gewohnt umgeformt, bis sie quadratisch ist:
// alles nach links, Normalform u^2 + pu + q = 0, pq-Formel. Von den zwei Lösungen passt eine nicht
// (Scheinlösung: u = e^x ist nie negativ, x muss positiv sein, eine Bedingung der Aufgabe gilt nicht);
// die andere wird für u zurück eingesetzt. Ohne Substitution (\ln x + \ln(x + b) = c) gilt dasselbe
// für x selbst.

// Buchstaben für u: der erste, der in der Gleichung nicht vorkommt
const SUBSTITUTE_NAMES = ['u', 'z', 'w', 'v']

// Art des Bausteins: Potenz mit der Variable in der Hochzahl (e^x), √x, Winkel- oder
// Hyperbelfunktion, \ln, x^2
type BlockKind = 'power' | 'root' | 'trig' | 'ln' | 'square'

// Baustein und, für jeden Teil mit der Variable, die Potenz von u (null: Teil passt nicht)
type SubPlan = { readonly kind: BlockKind; readonly block: Expr; readonly power: (x: Expr) => number | null }

// Typische Fehler beim Ersetzen: e^{2x} = 2u statt u^2 (bei √x: x = u statt u^2), e^{-x} = -u statt \frac{1}{u}
export type SubstituteMistake = 'power' | 'reciprocal'

const integerExponent = (x: Expr): number | null => {
  if (x.kind !== 'pow') return null
  const k = asRational(x.exp)
  return k && isInteger(k) && k.n >= 2n ? Number(k.n) : null
}

// Mögliche Bausteine der Gleichung, in dieser Reihenfolge
function substitutionPlans(e: Equation, t: string): SubPlan[] {
  const all = [e.lhs, e.rhs].flatMap((side) => subterms(side))
  const plans: SubPlan[] = []

  // Potenzen derselben Basis, Hochzahlen Vielfache von einem Teil mit x: e^{2x}, e^{x}, e^{-x}
  const powers = all.filter((s) => isTPower(s, t))
  if (powers.length > 0 && new Set(powers.map((s) => key(s.base))).size === 1) {
    const atoms = newAtoms(t)
    const parsed = powers.map((s) => {
      const p = toPoly(s.exp, atoms)
      if (!p || p.length !== 1 || (p[0].mono.find(([a]) => a === t)?.[1] ?? 0) !== 1) return null
      return { node: s, coef: p[0].coef, rest: key(polyToExpr([{ mono: p[0].mono, coef: rat(1) }], atoms)) }
    })
    if (parsed.every((x) => x !== null) && new Set(parsed.map((x) => x!.rest)).size === 1) {
      const smallest = parsed.map((x) => x!.coef).reduce((m, c) => (ratLess(ratAbs(c), ratAbs(m)) ? c : m))
      const g = ratAbs(smallest)
      const ns = new Map(parsed.map((x) => [key(x!.node), ratDiv(x!.coef, g)] as const))
      if ([...ns.values()].every(isInteger)) {
        const first = parsed.find((x) => ratEq(x!.coef, g))
        const p0 = toPoly(powers[0].exp, atoms)!
        const exp = first ? first.node.exp : polyToExpr([{ mono: p0[0].mono, coef: g }], atoms)
        const base = powers[0].base
        plans.push({
          kind: 'power',
          block: pow(base, exp),
          power: (x) => (isTPower(x, t) && key(x.base) === key(base) && ns.has(key(x)) ? Number(ns.get(key(x))!.n) : null),
        })
      }
    }
  }

  // Winkel- oder Hyperbelfunktion bzw. \ln, auch im Quadrat: \sin x und \sin^2 x
  for (const [kind, test] of [
    ['trig', (s: Expr) => isTrigBlock(s, t)],
    ['ln', (s: Expr) => s.kind === 'fn' && s.name === 'ln' && contains(s.arg, t)],
  ] as const) {
    const fns = all.filter(test)
    if (fns.length === 0 || new Set(fns.map(key)).size !== 1) continue
    const block = fns[0]
    plans.push({
      kind,
      block,
      power: (x) => (key(x) === key(block) ? 1 : x.kind === 'pow' && key(x.base) === key(block) ? integerExponent(x) : null),
    })
  }

  // √x und x: x = u^2
  if (hasTargetRoot(e, t)) {
    plans.push({
      kind: 'root',
      block: sqrt(variable(t)),
      power: (x) => (isTargetRoot(x, t) ? 1 : isVar(x, t) ? 2 : x.kind === 'pow' && isVar(x.base, t) && integerExponent(x) ? 2 * integerExponent(x)! : null),
    })
  }

  // nur gerade Potenzen von x: x^4 und x^2
  const xs = all.filter((s) => isVar(s, t))
  const evenPowers = all.filter((s) => s.kind === 'pow' && isVar(s.base, t) && (integerExponent(s) ?? 1) % 2 === 0)
  if (evenPowers.length > 0 && evenPowers.length === xs.length) {
    plans.push({
      kind: 'square',
      block: pow(variable(t), num(2)),
      power: (x) => (x.kind === 'pow' && isVar(x.base, t) && integerExponent(x) ? integerExponent(x)! / 2 : null),
    })
  }
  return plans
}

const ratLess = (a: Rational, b: Rational) => ratSign(ratSub(a, b)) < 0

// u^n, wie es nach dem Ersetzen dasteht
function uPower(u: Expr, n: number, kind: BlockKind, wrong: SubstituteMistake | null): Expr {
  if (n === 1) return u
  if (n === 0) return num(1)
  if (n >= 2) {
    if (wrong === 'power') return kind === 'root' && n === 2 ? u : mul(num(n), u)
    return pow(u, num(n))
  }
  const down = n === -1 ? u : pow(u, num(-n))
  return wrong === 'reciprocal' ? neg(down) : div(num(1), down)
}

// Teil für Teil ersetzen; null, wenn die Variable auch anders vorkommt
function replaced(e: Expr, t: string, plan: SubPlan, u: Expr, wrong: SubstituteMistake | null): Expr | null {
  if (!contains(e, t)) return e
  const n = plan.power(e)
  if (n !== null) return uPower(u, n, plan.kind, wrong)
  const f = (x: Expr) => replaced(x, t, plan, u, wrong)
  const r = rebuilt(e, f)
  return r && reciprocalFolded(r)
}

// Anzeige nach dem Substituieren: a \cdot \frac{1}{u} als \frac{a}{u} (aus ae^{-x}), sonst stünde nach dem Malnehmen
// mit u noch ua \cdot \frac{1}{u} da
function reciprocalFolded(e: Expr): Expr {
  if (e.kind !== 'mul') return e
  const reciprocals = e.factors.filter((f) => f.kind === 'div' && f.num.kind === 'num' && isOne(f.num.value))
  if (reciprocals.length !== 1 || reciprocals[0].kind !== 'div') return e
  const rest = e.factors.filter((f) => f !== reciprocals[0])
  const den = reciprocals[0].den
  // \frac{a}{2} \cdot \frac{1}{u} als \frac{a}{2u}, nicht als Doppelbruch
  if (rest.length === 1 && rest[0].kind === 'div') return div(rest[0].num, mul(rest[0].den, den))
  return div(rest.length === 1 ? rest[0] : mul(...rest), den)
}

// Knoten mit neuen Kindern; null, wenn ein Kind null ist
function rebuilt(e: Expr, f: (x: Expr) => Expr | null): Expr | null {
  const all = (xs: readonly Expr[]) => {
    const out = xs.map(f)
    return out.some((x) => x === null) ? null : (out as Expr[])
  }
  switch (e.kind) {
    case 'add': {
      const terms = all(e.terms)
      return terms && add(...terms)
    }
    case 'mul': {
      const factors = all(e.factors)
      return factors && { ...e, factors }
    }
    case 'neg': {
      const arg = f(e.arg)
      return arg && neg(arg)
    }
    case 'div': {
      const parts = all([e.num, e.den])
      return parts && div(parts[0], parts[1])
    }
    case 'pow': {
      const parts = all([e.base, e.exp])
      return parts && pow(parts[0], parts[1])
    }
    case 'root': {
      const arg = f(e.arg)
      return arg && { ...e, arg }
    }
    case 'fn': {
      const arg = f(e.arg)
      return arg && fn(e.name, arg)
    }
    case 'log': {
      const parts = all([e.base, e.arg])
      return parts && log(parts[0], parts[1])
    }
    default:
      return null
  }
}

// Koeffizient von u^k (Polynom in den übrigen Buchstaben)
function coefficientOf(p: Poly, u: string, k: number): Poly {
  return p.filter((term) => (term.mono.find(([a]) => a === u)?.[1] ?? 0) === k).map((term) => ({ mono: term.mono.filter(([a]) => a !== u), coef: term.coef }))
}

// Zähler von Seite minus Seite als Polynom in u (gekürzt); null, wenn das nicht geht
function zeroPoly(e: Equation, u: string): { n: Poly; atoms: Atoms } | null {
  const atoms = newAtoms(u)
  const l = toRat(e.lhs, atoms)
  const r = toRat(e.rhs, atoms)
  if (!l || !r) return null
  return { n: reduceFrac(fracAdd(l, fracNeg(r))).num, atoms }
}

// Ist die Gleichung quadratisch in u, mit u und einer Zahl bzw. einem Teil ohne u (u^2 - au - b)?
function isQuadratic(e: Equation, u: string): boolean {
  const z = zeroPoly(e, u)
  return z !== null && degreeIn(z.n, u) === 2 && coefficientOf(z.n, u, 1).length > 0 && coefficientOf(z.n, u, 0).length > 0
}

function substituteDraft(e: Equation, t: string, wrong: SubstituteMistake | null): Draft | null {
  const used = variablesOf(e.lhs, e.rhs)
  const name = SUBSTITUTE_NAMES.find((n) => n !== t && !used.includes(n))
  if (!name) return null
  const u = variable(name)
  for (const plan of substitutionPlans(e, t)) {
    const l = replaced(e.lhs, t, plan, u, null)
    const r = replaced(e.rhs, t, plan, u, null)
    if (!l || !r || !isQuadratic(eq(l, r), name)) continue
    const substitution = { name, expr: plan.block }
    if (!wrong) return { kind: 'substitute', substitution, operand: plan.block, after: eq(l, r) }
    const wl = replaced(e.lhs, t, plan, u, wrong)
    const wr = replaced(e.rhs, t, plan, u, wrong)
    if (!wl || !wr || (key(wl) === key(l) && key(wr) === key(r))) return null
    return { kind: 'substitute', substitution, operand: plan.block, after: eq(mergedNumbers(wl), mergedNumbers(wr)) }
  }
  return null
}

// Zahlen in Produkten zusammenfassen: 2 \cdot 2u → 4u (nach einem Fehler beim Ersetzen)
function mergedNumbers(e: Expr): Expr {
  const r = rebuilt(e, mergedNumbers) ?? e
  if (r.kind !== 'mul') return r
  const flat = r.factors.flatMap((f) => (f.kind === 'mul' ? f.factors : [f]))
  const numbers = flat.filter((f): f is Extract<Expr, { kind: 'num' }> => f.kind === 'num')
  if (numbers.length < 2) return flat.length === r.factors.length ? r : mul(...flat)
  const product = numbers.reduce((acc, f) => ratMul(acc, f.value), rat(1))
  return mul(num(product), ...flat.filter((f) => f.kind !== 'num'))
}

// Typischer Fehler beim Substituieren (Gleichung danach; null, wenn es nicht passt)
export function substituteWrong(e: Equation, t: string, wrong: SubstituteMistake): Equation | null {
  return substituteDraft(e, t, wrong)?.after ?? null
}

// u = … nach der pq-Formel: zurück einsetzen, e^x = …
function resubstituteDraft(e: Equation, sub: Substitution): Draft | null {
  const isU = (x: Expr) => isVar(x, sub.name)
  if (isU(e.lhs) && !contains(e.rhs, sub.name)) return { kind: 'resubstitute', substitution: sub, after: eq(sub.expr, e.rhs) }
  if (isU(e.rhs) && !contains(e.lhs, sub.name)) return { kind: 'resubstitute', substitution: sub, after: eq(sub.expr, e.lhs) }
  return null
}

// Koeffizient mal Potenz der Unbekannten: 2yu, -\frac{b}{a}u, (a + b)x
function timesUnknown(c: Expr, power: Expr): Expr {
  if (isOneExpr(c)) return power
  if (c.kind === 'neg') return neg(timesUnknown(c.arg, power))
  if (c.kind === 'num' && ratSign(c.value) < 0) return neg(timesUnknown(num(ratNeg(c.value)), power))
  if (c.kind === 'add' && c.terms.every(isNegative)) return neg(mul(add(...c.terms.map(negated)), power))
  if (c.kind === 'mul') return mul(...c.factors, power)
  return mul(c, power)
}

// a u^2 + b u + c (Summanden mit Vorzeichen)
function quadraticExpr(a: Expr, b: Expr, c: Expr, u: Expr): Expr {
  return add(timesUnknown(a, pow(u, num(2))), timesUnknown(b, u), ...termsOf(c))
}

// Steht die Normalform u^2 + pu + q = 0 schon da (vorn u^2 mit der Zahl 1)?
function isNormalized(e: Equation, u: string): boolean {
  return isZeroExpr(e.rhs) && e.lhs.kind === 'add' && key(e.lhs.terms[0]) === key(pow(variable(u), num(2))) && isQuadratic(e, u)
}

// p und q der Normalform (Gleichung = 0 bzw. irgendeine quadratische Gleichung, durch die Zahl vor u^2 geteilt)
function pqParts(e: Equation, u: string): { p: Frac; q: Frac; atoms: Atoms } | null {
  const z = zeroPoly(e, u)
  if (!z || degreeIn(z.n, u) !== 2) return null
  const a = fracOf(coefficientOf(z.n, u, 2))
  const b = coefficientOf(z.n, u, 1)
  const c = coefficientOf(z.n, u, 0)
  if (b.length === 0 || c.length === 0) return null
  return { p: fracDiv(fracOf(b), a), q: fracDiv(fracOf(c), a), atoms: z.atoms }
}

// Typische Fehler bei der pq-Formel: Vorzeichen von p nicht gewechselt, -q mit falschem Vorzeichen,
// unter der Wurzel p^2 statt \left(\frac{p}{2}\right)^2
export type PqMistake = 'sign' | 'q' | 'half'

const isSquareNumber = (n: bigint) => {
  if (n < 0n) return false
  const r = BigInt(Math.round(Math.sqrt(Number(n))))
  return r * r === n
}

// Ist der Bruch ein Quadrat (dann ist die Wurzel kein Wurzelausdruck mehr)?
function isPerfectSquare(f: Frac): boolean {
  const r = reduceFrac(f)
  const n = factorize(r.num)
  const even = (x: Factored) => isSquareNumber(x.coef.n < 0n ? -1n : x.coef.n) && isSquareNumber(x.coef.d) && x.factors.every((g) => g.exp % 2 === 0)
  return ratSign(n.coef) > 0 && even(n) && even(r.den)
}

// Beide Lösungen -\frac{p}{2} \pm \sqrt{\left(\frac{p}{2}\right)^2 - q}, die Wurzel als Summe
// \frac{a^2}{4} + b; null, wenn die Wurzel aufgeht
function pqRoots(parts: { p: Frac; q: Frac; atoms: Atoms }, wrong: PqMistake | null): { plus: Expr; minus: Expr; radicand: Expr } | null {
  const { p, q, atoms } = parts
  const h = fracScale(p, rat(1, 2))
  const center = niceFrac(wrong === 'sign' ? h : fracNeg(h), atoms)
  const half = wrong === 'half' ? p : h
  const square = fracMul(half, half)
  const minusQ = wrong === 'q' ? q : fracNeg(q)
  if (!wrong && isPerfectSquare(fracAdd(square, minusQ))) return null
  // \left(\frac{p}{2}\right)^2 ausgerechnet (\frac{a^2}{4}), mit einer Summe als Potenz: \left(\frac{a + b}{2}\right)^2
  const halfExpr = niceFrac(half, atoms)
  const sum = subterms(halfExpr).some((x) => x.kind === 'add')
  const squareExpr = sum ? pow(isNegative(halfExpr) ? negated(halfExpr) : halfExpr, num(2)) : niceFrac(square, atoms)
  const radicand = add(squareExpr, ...termsOf(niceFrac(minusQ, atoms)))
  const r = sqrt(radicand)
  return { plus: add(...termsOf(center), r), minus: add(...termsOf(center), neg(r)), radicand }
}

// Umgebung mit dem Wert der Variable und, bei einer Substitution, dem von u
function withValue(env: Env, target: string, value: number, sub: Substitution | undefined): Env {
  const out: Record<string, number> = { ...env, [target]: value }
  if (sub) out[sub.name] = evaluate(sub.expr, out)
  return out
}

// Welche der beiden Lösungen passt? Zahlen für die Buchstaben zufällig wählen, aus jeder Lösung x
// ausrechnen (bei einer Substitution zurück eingesetzt) und prüfen: x positiv, Bedingungen der
// Aufgabe erfüllt, die Gleichung vom Anfang gilt. Passt immer genau eine, ist sie es; sonst null.
function chooseRoot(roots: readonly [Expr, Expr], u: string, ctx: Context): { index: 0 | 1; reason: RejectReason } | null {
  const targetOf = (r: Expr): Expr | null => {
    if (u === ctx.target) return r
    if (!ctx.sub || u !== ctx.sub.name) return null
    const back = solveEquation(eq(ctx.sub.expr, r), ctx.target)
    return back && !contains(back.result, ctx.target) ? back.result : null
  }
  const xs = roots.map(targetOf)
  const letters = variablesOf(ctx.original.lhs, ctx.original.rhs, ...roots).filter((n) => n !== ctx.target && n !== ctx.sub?.name)
  const rng = createRng(`pq:${equationToLatex(ctx.original)}:${toLatex(roots[0])}`)
  const valid = [0, 0]
  const negativeRoot = [0, 0]
  const negativeTarget = [0, 0]
  let decisive = 0
  for (let attempt = 0; attempt < 160 && decisive < 12; attempt++) {
    const env: Record<string, number> = {}
    for (const name of letters) env[name] = 0.3 * (8 / 0.3) ** rng.next()
    const status = roots.map((root, i) => {
      const r = evaluate(root, env)
      const x = xs[i] ? evaluate(xs[i]!, env) : Number.NaN
      const ok =
        Number.isFinite(x) &&
        x > 1e-9 &&
        conditionsHold(ctx.conditions, withValue(env, ctx.target, x, ctx.sub)) &&
        holds(ctx.original, withValue(env, ctx.target, x, ctx.sub)) === true
      return { r, x, ok }
    })
    // keine reelle Lösung (unter der Wurzel negativ) oder keine passt: sagt nichts
    if (status.some((s) => !Number.isFinite(s.r)) || !status.some((s) => s.ok)) continue
    decisive++
    status.forEach((s, i) => {
      if (s.ok) valid[i]++
      if (s.r < 0) negativeRoot[i]++
      if (Number.isFinite(s.x) && s.x <= 1e-9) negativeTarget[i]++
    })
  }
  if (decisive === 0) return null
  const index = valid[0] === decisive && valid[1] === 0 ? 0 : valid[1] === decisive && valid[0] === 0 ? 1 : null
  if (index === null) return null
  const other = 1 - index
  const reason: RejectReason =
    negativeRoot[other] === decisive && negativeRoot[index] === 0 ? 'negative' : negativeTarget[other] === decisive ? 'targetNegative' : 'condition'
  return { index, reason }
}

// pq-Formel auf u^2 + pu + q = 0: beide Lösungen, die passende steht in der Gleichung danach, die
// andere als operand
function pqDraft(e: Equation, u: string, ctx: Context): Draft | null {
  const parts = pqParts(e, u)
  const roots = parts && pqRoots(parts, null)
  if (!roots) return null
  const choice = chooseRoot([roots.plus, roots.minus], u, ctx)
  if (!choice) return null
  const [chosen, rejected] = choice.index === 0 ? [roots.plus, roots.minus] : [roots.minus, roots.plus]
  return { kind: 'pq', operand: rejected, reason: choice.reason, after: eq(variable(u), chosen), requires: roots.radicand }
}

// Typischer Fehler bei der pq-Formel (Gleichung danach, mit demselben Vorzeichen vor der Wurzel wie
// die passende Lösung; null, wenn es nicht passt)
export function pqWrong(step: RearrangeStep, wrong: PqMistake): Equation | null {
  if (step.kind !== 'pq' || step.after.lhs.kind !== 'var') return null
  const u = step.after.lhs.name
  const parts = pqParts(step.before, u)
  const roots = parts && pqRoots(parts, wrong)
  if (!roots) return null
  const last = termsOf(step.after.rhs).at(-1)
  return eq(variable(u), last?.kind === 'neg' ? roots.minus : roots.plus)
}

// Gleichung nach der pq-Formel als LaTeX: u_{1,2} = \frac{a}{2} \pm \sqrt{…} (die Gleichung selbst
// enthält die passende Lösung); sonst wie gewohnt
export function stepEquationLatex(kind: StepKind, e: Equation): string {
  if (kind !== 'pq' || e.lhs.kind !== 'var' || e.rhs.kind !== 'add') return equationToLatex(e)
  const terms = e.rhs.terms
  const last = terms[terms.length - 1]
  const radical = last.kind === 'neg' ? last.arg : last
  return `${e.lhs.name}_{1,2} = ${toLatex(add(...terms.slice(0, -1)))} \\pm ${toLatex(radical)}`
}

// Quadratische Gleichung in der Unbekannten t (keine Wurzel, kein Baustein): alles nach links,
// durch die Zahl vor t^2 teilen, pq-Formel
function quadraticStep(e: Equation, t: string, diff: Poly, atoms: Atoms, ctx: Context): Draft | null {
  const zero = zeroForm(diff, t, atoms)
  if (!zero) return null
  const { a, b, c } = zero
  if (!(isZeroExpr(e.rhs) && key(e.lhs) === key(zero.equation.lhs))) return { kind: 'zero', after: zero.equation }
  const lead = constValue(a)
  if (!(lead && isOne(lead))) {
    const p = fracDiv(fracOf(b), fracOf(a))
    const q = fracDiv(fracOf(c), fracOf(a))
    return { kind: 'normalize', operand: polyToExpr(a, atoms), after: eq(quadraticExpr(num(1), minusOutside(niceFrac(p, atoms)), minusOutside(niceFrac(q, atoms)), variable(t)), num(0)) }
  }
  return pqDraft(e, t, ctx)
}

// Minus aus dem Nenner vor den Bruch: \frac{2y + 1}{-y} → -\frac{2y + 1}{y}
function minusOutside(e: Expr): Expr {
  if (e.kind !== 'div') return e
  const d = e.den
  if (d.kind === 'neg') return neg(div(e.num, d.arg))
  if (d.kind === 'mul' && d.factors[0]?.kind === 'num' && ratSign(d.factors[0].value) < 0) {
    const [first, ...rest] = d.factors
    const abs = ratNeg((first as Extract<Expr, { kind: 'num' }>).value)
    const factors = isOne(abs) ? rest : [num(abs), ...rest]
    return neg(div(e.num, factors.length === 1 ? factors[0] : mul(...factors)))
  }
  return e
}

// au^2 + bu + c = 0 aus dem Polynom (vorn mit Plus); null, wenn es keine solche Gleichung ist
function zeroForm(diff: Poly, u: string, atoms: Atoms): { a: Poly; b: Poly; c: Poly; equation: Equation } | null {
  let a = coefficientOf(diff, u, 2)
  let b = coefficientOf(diff, u, 1)
  let c = coefficientOf(diff, u, 0)
  if (degreeIn(diff, u) !== 2 || b.length === 0 || c.length === 0) return null
  // vor u^2 ein Monom mit Plus, eine Summe mit Plus vor der Zahl: (1 - y)x^2
  const constant = a.find((term) => term.mono.length === 0)
  if (ratSign((a.length === 1 ? a[0] : (constant ?? a[0])).coef) < 0) [a, b, c] = [a, b, c].map((p) => polyScale(p, rat(-1)))
  // Summen vor u^2 und u mit ausgeklammertem Faktor: 2a(1 - y)u
  const coefficient = (p: Poly) => (a.length > 1 ? contentExpr(p, atoms) : polyToExpr(p, atoms))
  return { a, b, c, equation: eq(quadraticExpr(coefficient(a), coefficient(b), polyToExpr(c, atoms), variable(u)), num(0)) }
}

// Typische Fehler auf dem Weg zur Normalform: beim Bringen auf eine Seite das Vorzeichen nicht
// gewechselt (u^2 - au = b → u^2 - au + b = 0), beim Teilen nur u^2 geteilt
// (2u^2 - 3yu - 2 = 0 → u^2 - 3yu - 2 = 0); null, wenn es nicht passt
export function quadraticWrong(step: RearrangeStep, t: string): Equation | null {
  const u = step.unknown ?? t
  const atoms = newAtoms(u)
  if (step.kind === 'zero') {
    const l = toPoly(step.before.lhs, atoms)
    const r = toPoly(step.before.rhs, atoms)
    if (!l || !r || r.length === 0) return null
    return zeroForm(polyAdd(l, r), u, atoms)?.equation ?? null
  }
  if (step.kind === 'normalize') {
    const z = toPoly(step.before.lhs, atoms)
    if (!z) return null
    return eq(quadraticExpr(num(1), polyToExpr(coefficientOf(z, u, 1), atoms), polyToExpr(coefficientOf(z, u, 0), atoms), variable(u)), num(0))
  }
  return null
}

// Variable mehrfach: Wurzel allein stellen und quadrieren, Doppelbruch erweitern, Nenner beseitigen,
// ausmultiplizieren, sortieren, ausklammern, teilen
function rational(e: Equation, t: string, ctx: Context): Draft | null {
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

  // Normalform u^2 + pu + q = 0 (auch mit Brüchen wie \frac{b}{a}u): pq-Formel
  // Normalform u^2 + pu + q = 0: pq-Formel; passt keine Lösung eindeutig, geht es nicht weiter (sonst
  // würde wieder mit dem Nenner malgenommen und von vorn begonnen)
  if (isNormalized(e, t)) return pqDraft(e, t, ctx)

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

  // Klammern ausmultiplizieren (nicht in der Gleichung au^2 + bu + c = 0 mit einer Summe vor u^2 oder u)
  const zero = isZeroExpr(e.rhs) ? zeroForm(polyAdd(pl, polyScale(pr, rat(-1))), t, atoms) : null
  const already = zero !== null && key(zero.equation.lhs) === key(e.lhs)
  const zeroAlready = already && (zero.a.length > 1 || zero.b.length > 1)
  if (hasBracket(e.lhs) || hasBracket(e.rhs)) {
    if (zeroAlready) {
      // nur mit einer Summe vor u: erst seit Teil 7b
      if (zero.a.length <= 1) novelPaths++
    } else {
      const after = eq(polyToExpr(pl, atoms), polyToExpr(pr, atoms))
      if (key(after.lhs) !== key(e.lhs) || key(after.rhs) !== key(e.rhs)) return { kind: 'expand', after }
    }
  }

  const diff = polyAdd(pl, polyScale(pr, rat(-1)))
  if (degreeIn(diff, u) === 2 && u === t) {
    // nur x^2, kein x: nach x^2 auflösen wie nach einer Unbekannten (x^2 - yx^2 = a → x^2(1 - y) = a)
    const square = coefficientOf(diff, t, 1).length === 0 ? squareUnknown(pl, pr, t, atoms) : null
    if (square) return linearSteps(e, t, square.pl, square.pr, square.atoms, SQUARE_ATOM, pow(variable(t), num(2)), { operand: pow(variable(t), num(2)) })
    // quadratisch: alles nach links, Normalform, pq-Formel
    return quadraticStep(e, t, diff, atoms, ctx)
  }
  return linearSteps(e, t, pl, pr, atoms, u, uExpr, named)
}

const SQUARE_ATOM = '~q'

// Polynome in x^2 statt x (x kommt nur als x^2 vor); null sonst
function squareUnknown(pl: Poly, pr: Poly, t: string, atoms: Atoms): { pl: Poly; pr: Poly; atoms: Atoms } | null {
  const ok = (p: Poly) => p.every((term) => term.mono.every(([a, k]) => a !== t || k === 2))
  if (!ok(pl) || !ok(pr)) return null
  const swap = (p: Poly): Poly =>
    p.map((term) => ({ coef: term.coef, mono: term.mono.map(([a, k]) => (a === t ? ([SQUARE_ATOM, 1] as const) : ([a, k] as const))).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)) }))
  const square: Atoms = { ...atoms, opaque: new Map(atoms.opaque), names: new Map(atoms.names) }
  square.opaque.set(SQUARE_ATOM, pow(variable(t), num(2)))
  return { pl: swap(pl), pr: swap(pr), atoms: square }
}

// Gleichung, linear in der Unbekannten u (uExpr): alles mit u nach links, ausklammern, teilen
function linearSteps(e: Equation, t: string, pl: Poly, pr: Poly, atoms: Atoms, u: string, uExpr: Expr, named: { operand?: Expr }): Draft | null {
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
function nextStep(e: Equation, t: string, ctx: Context): Draft | null {
  const parts = split(e, t)
  if (parts === null) throw new Error('Die gesuchte Variable kommt nicht vor')
  // verschiedene Formen eines Bausteins (e^{2x} und e^x), quadratisch: substituieren (nur einmal)
  if (!ctx.sub) {
    const substituted = substituteDraft(e, t, null)
    if (substituted) return substituted
  }
  // Logarithmen auf beiden Seiten, verschiedene Basen (M6 Schritt 4b-2)
  const logEquation = logEquationStep(e, t)
  if (logEquation) return logEquation
  const combinedLogs = logCombineStep(e, t)
  if (combinedLogs) return combinedLogs
  const law = logLawStep(e, t)
  if (law) return law
  // spitzer Winkel als Buchstabe (Teil 8b): 1 - \cos^2 y durch \sin^2 y ersetzen
  const acuteSquared = acutePythagorasStep(e, t, ctx.acute)
  if (acuteSquared) return acuteSquared
  if (parts === 'both') return mustStep(rational(e, t, ctx))
  const { s, o, side } = parts
  if (s.kind === 'var') {
    // mit spitzen Winkeln: Wurzel aus \sin^2 y und \cos^2 y, geschrieben mit \tan y
    const acute = acuteForm(o, ctx.acute)
    if (acute) return { kind: 'finish', operand: acute.tan, after: eq(s, acute.result) }
    const result = finalForm(o)
    if (side === 'lhs' && key(result) === key(o)) return null
    return { kind: 'finish', after: eq(s, result), swapOnly: key(result) === key(o) }
  }
  if (complexRoot(e, t) && !(s.kind === 'root' && !isTargetRoot(s, t))) {
    const draft = rational(e, t, ctx)
    if (draft) return draft
  }
  if (peelable(s, t) && !(s.kind === 'add' && complexRoot(e, t))) return mustStep(peel(s, o, side, t))
  return mustStep(rational(e, t, ctx))
}

// Summe ohne Brüche, in der sich nichts zusammenfassen lässt (b + \sqrt{\frac{y}{a}}): schon fertig
function alreadyFinal(o: Expr): boolean {
  if (o.kind !== 'add' || !subterms(o).some((x) => x.kind === 'root') || subterms(o).some((x) => x.kind === 'div' && !insideRoot(o, x))) return false
  const atoms = anyAtoms()
  const p = toPoly(o, atoms)
  return p !== null && p.length === o.terms.length
}

// Seite zu einem Bruch zusammengefasst; null, wenn sich dabei nichts ändert (b + c, 1 - e^{\frac{a}{b}}),
// sonst käme der Schritt immer wieder
function combined(o: Expr): Expr | null {
  const f = finalForm(o)
  if (key(f) !== key(o)) return f
  novelPaths++
  return null
}

// Wege, die die Engine erst seit Teil 7b geht (an diesen Gleichungen blieb sie vorher hängen). Der
// Baukasten nimmt Aufgaben mit solchen Wegen nur in Vorlagen ab 7b, damit die Nummern der älteren
// Vorlagen dieselbe Aufgabe behalten (rearrangeTerms.ts, solution.novel).
let novelPaths = 0

// Steht der Teil unter einer Wurzel (dann zählt er als ein Zeichen)?
const insideRoot = (e: Expr, part: Expr): boolean => subterms(e).some((x) => x.kind === 'root' && x !== part && subterms(x.arg).includes(part))

function mustStep(d: Draft | null): Draft {
  if (!d) throw new Error('Diese Gleichung lässt sich so nicht auflösen')
  return d
}

// Löst eine Aufgabe (mit ihren Bedingungen)
export const solveTask = (task: { readonly equation: Equation; readonly target: string; readonly conditions: readonly Condition[] }) =>
  solveEquation(task.equation, task.target, { conditions: task.conditions })

// Löst die Gleichung nach t auf; null, wenn das mit diesen Schritten nicht geht. Mit den Bedingungen
// der Aufgabe wird die passende Lösung der pq-Formel gewählt; mit einer Substitution geht es ab einer
// Gleichung in u weiter (beim Weiterrechnen mit einem typischen Fehler).
export function solveEquation(equation: Equation, target: string, options: SolveOptions = {}): RearrangeSolution | null {
  const startPaths = novelPaths
  const startLogPaths = logPaths
  const steps: RearrangeStep[] = []
  let current = equation
  let sub = options.substitution
  const conditions = options.conditions ?? []
  const acute = acuteLetters(conditions, target)
  try {
    // Stufe 5: erst die Werkzeuge ausrechnen (Ableitung, Integral, …), dann umstellen
    for (let i = 0; hasTool(current); i++) {
      const draft = i < MAX_STEPS ? nextToolStep(current) : null
      if (!draft) return null
      steps.push({ ...draft, before: current })
      current = draft.after
    }
    const original = current
    for (let i = 0; i < MAX_STEPS; i++) {
      // nach dem Substituieren: nach u auflösen, dann zurück einsetzen
      const inU = sub !== undefined && (contains(current.lhs, sub.name) || contains(current.rhs, sub.name))
      const t = inU ? sub!.name : target
      const ctx: Context = { original, target, conditions, sub, acute }
      const draft = (inU ? resubstituteDraft(current, sub!) : null) ?? nextStep(current, t, ctx)
      if (!draft) {
        return {
          target,
          steps,
          result: current.rhs,
          requires: steps.flatMap((x) => (x.requires ? [x.requires] : [])),
          ...(sub ? { substitution: sub } : {}),
          ...(novelPaths > startPaths ? { novel: true as const } : {}),
          ...(logPaths > startLogPaths ? { logPath: true as const } : {}),
        }
      }
      const unknown = inU && draft.kind !== 'resubstitute' ? { unknown: sub!.name } : {}
      steps.push({ ...draft, ...unknown, before: current })
      if (draft.kind === 'substitute') sub = draft.substitution
      // nach der pq-Formel: die passende Lösung wählen
      if (draft.kind === 'pq') steps.push({ kind: 'choose', operand: draft.operand, reason: draft.reason, ...unknown, before: draft.after, after: draft.after })
      current = draft.after
    }
  } catch {
    return null
  }
  return null
}
