import { type Rational, ONE, isOne, ratAbs, ratMul, ratNeg, ratSign, ratToNumber } from '../rational.ts'
import { normalize } from './normalize.ts'
import { type Expr, div, fn, log, mul, neg, num, pow, root } from './types.ts'

// Wandelt eine Normalform in eine schöne Schreibweise wie im Skript um:
// negative Exponenten → Bruch, Exponent 1/n → Wurzel, negative Faktoren → Minus,
// Summanden nach fallendem Grad, Faktoren in gewohnter Reihenfolge (2x² e^x \sin x).
// Erwartet eine Normalform; andere Terme werden vorher normalisiert.
export function toDisplayForm(e: Expr): Expr {
  switch (e.kind) {
    case 'num':
    case 'const':
    case 'var':
      return e
    case 'add':
      return displaySum(e.terms)
    case 'mul':
      return displayProduct(e.factors)
    case 'pow':
      return displayProduct([e])
    case 'fn':
      return fn(e.name, toDisplayForm(e.arg))
    case 'log':
      return log(toDisplayForm(e.base), toDisplayForm(e.arg))
    default:
      return toDisplayForm(normalize(e))
  }
}

// Vereinfachen = Normalform bilden und schön aufschreiben
export function simplify(e: Expr): Expr {
  return toDisplayForm(normalize(e))
}

// Grad eines Summanden der Form c · x^r (sonst null)
function degree(term: Expr): Rational | null {
  const rest = term.kind === 'mul' && term.factors[0].kind === 'num' ? term.factors.slice(1) : [term]
  if (rest.length !== 1) return null
  const [f] = rest
  if (f.kind === 'var') return ONE
  if (f.kind === 'pow' && f.base.kind === 'var' && f.exp.kind === 'num') return f.exp.value
  return null
}

// Summe der Exponenten von Variablen-Potenzen in einem Summanden: 2x² \cos x → 2
function variableDegree(term: Expr): number {
  const factors = term.kind === 'mul' ? term.factors : [term]
  let total = 0
  for (const f of factors) {
    if (f.kind === 'var') total += 1
    else if (f.kind === 'pow' && f.base.kind === 'var' && f.exp.kind === 'num') total += ratToNumber(f.exp.value)
  }
  return total
}

function displaySum(terms: readonly Expr[]): Expr {
  // Gruppen: 0 = Potenzen von x (nach fallendem Grad), 1 = Sonstiges (ebenfalls nach dem
  // Grad des x-Anteils: x\sin x + 2\cos x), 2 = Zahl am Ende
  const items = terms.map((t, index) => {
    const d = degree(t)
    const group = t.kind === 'num' ? 2 : d ? 0 : 1
    return { display: toDisplayForm(t), group, degree: d, variableDegree: variableDegree(t), index }
  })
  items.sort((a, b) => {
    if (a.group !== b.group) return a.group - b.group
    if (a.group === 0) return ratSign({ n: b.degree!.n * a.degree!.d - a.degree!.n * b.degree!.d, d: 1n })
    return b.variableDegree - a.variableDegree || a.index - b.index
  })

  const isMinus = (e: Expr) => e.kind === 'neg' || (e.kind === 'num' && ratSign(e.value) < 0)
  let ordered = items.map((i) => i.display)
  if (items.some((i) => i.group === 1)) {
    // Mit Funktionen: positive Summanden zuerst, z. B. 1 - 2\ln x statt -2\ln x + 1
    ordered = [...ordered.filter((d) => !isMinus(d)), ...ordered.filter(isMinus)]
  } else if (isMinus(ordered[0]) && items.some((i) => i.group === 2 && !isMinus(i.display))) {
    // Reines Polynom mit negativem Leitglied und positiver Zahl: aufsteigend, z. B. 1 - 2x^2
    ordered = ordered.reverse()
  }
  return { kind: 'add', terms: ordered }
}

// Hängt der Faktor von keiner Variablen ab (z. B. \ln 5)?
function isConstantValued(e: Expr): boolean {
  switch (e.kind) {
    case 'num':
    case 'const':
      return true
    case 'var':
      return false
    case 'add':
      return e.terms.every(isConstantValued)
    case 'mul':
      return e.factors.every(isConstantValued)
    case 'neg':
    case 'root':
    case 'fn':
      return isConstantValued(e.arg)
    case 'div':
      return isConstantValued(e.num) && isConstantValued(e.den)
    case 'pow':
    case 'log':
      return isConstantValued(e.base) && isConstantValued(e.kind === 'pow' ? e.exp : e.arg)
  }
}

// Reihenfolge der Faktoren: Zahl, Konstante (e, π), x-Potenzen, feste Werte wie \ln 5,
// Klammern, Wurzeln, e^…, Funktionen, zuletzt Logarithmen: 4x\ln 5 \cdot 5^x \sin(2x)\ln x
function rank(f: Expr): number {
  if (f.kind === 'num') return 0
  if (f.kind === 'const') return 1
  const base = f.kind === 'pow' ? f.base : f
  if (base.kind === 'var') return 2
  if (isConstantValued(f)) return 3
  if (base.kind === 'add') return 4
  if (f.kind === 'root') return 5
  if (base.kind === 'const' || base.kind === 'num') return 6
  if (base.kind === 'fn' && base.name !== 'ln') return 7
  if (base.kind === 'fn' || base.kind === 'log') return 8
  return 9
}

function variableName(f: Expr): string {
  const base = f.kind === 'pow' ? f.base : f
  return base.kind === 'var' ? base.name : ''
}

// Funktionen in gewohnter Reihenfolge: 2\sin x \cos x
const FUNCTION_ORDER = ['sin', 'cos', 'tan', 'cot', 'sinh', 'cosh', 'tanh']
function functionOrder(f: Expr): number {
  const base = f.kind === 'pow' ? f.base : f
  const index = base.kind === 'fn' ? FUNCTION_ORDER.indexOf(base.name) : -1
  return index === -1 ? FUNCTION_ORDER.length : index
}

function byDisplayOrder(a: Expr, b: Expr): number {
  return (
    rank(a) - rank(b) || variableName(a).localeCompare(variableName(b)) || functionOrder(a) - functionOrder(b)
  )
}

// base^r mit positivem rationalem r: Exponent 1/n wird zur Wurzel
function displayPower(base: Expr, r: Rational): Expr {
  const b = toDisplayForm(base)
  if (isOne(r)) return b
  if (r.n === 1n && r.d <= 10n) return root(b, Number(r.d))
  return pow(b, num(r))
}

function displayProduct(factors: readonly Expr[]): Expr {
  let coef = ONE
  const numerator: Expr[] = []
  const denominator: Expr[] = []
  for (const f of factors) {
    if (f.kind === 'num') {
      coef = ratMul(coef, f.value)
      continue
    }
    if (f.kind === 'pow' && f.exp.kind === 'num') {
      const r = f.exp.value
      if (ratSign(r) < 0) denominator.push(displayPower(f.base, ratNeg(r)))
      else numerator.push(displayPower(f.base, r))
      continue
    }
    numerator.push(f.kind === 'pow' ? pow(toDisplayForm(f.base), toDisplayForm(f.exp)) : toDisplayForm(f))
  }
  numerator.sort(byDisplayOrder)
  denominator.sort(byDisplayOrder)

  const negative = ratSign(coef) < 0
  const abs = ratAbs(coef)
  let body: Expr
  if (denominator.length === 0) {
    const parts = isOne(abs) ? numerator : [num(abs), ...numerator]
    body = parts.length === 0 ? num(1) : mul(...parts)
  } else {
    const top = abs.n === 1n ? numerator : [num(abs.n), ...numerator]
    const bottom = abs.d === 1n ? denominator : [num(abs.d), ...denominator]
    body = div(top.length === 0 ? num(1) : mul(...top), mul(...bottom))
  }
  return negative ? neg(body) : body
}
