import { type Rational, ONE, isOne, ratAbs, ratMul, ratNeg, ratSign } from '../rational.ts'
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

function displaySum(terms: readonly Expr[]): Expr {
  // Gruppen: 0 = Potenzen von x (nach fallendem Grad), 1 = Sonstiges, 2 = Zahl am Ende
  const items = terms.map((t, index) => {
    const d = degree(t)
    const group = t.kind === 'num' ? 2 : d ? 0 : 1
    return { display: toDisplayForm(t), group, degree: d, index }
  })
  // Bei Sonstigem zuerst die positiven Summanden: \cos x - 2\ln x statt -2\ln x + \cos x
  const isMinus = (e: Expr) => e.kind === 'neg' || (e.kind === 'num' && ratSign(e.value) < 0)
  items.sort((a, b) => {
    if (a.group !== b.group) return a.group - b.group
    if (a.group === 0) return ratSign({ n: b.degree!.n * a.degree!.d - a.degree!.n * b.degree!.d, d: 1n })
    return Number(isMinus(a.display)) - Number(isMinus(b.display)) || a.index - b.index
  })
  return { kind: 'add', terms: items.map((i) => i.display) }
}

// Reihenfolge der Faktoren: Zahl, Konstante (e, π), x-Potenzen, Klammern, Wurzeln,
// e^…, Funktionen, log
function rank(f: Expr): number {
  if (f.kind === 'num') return 0
  if (f.kind === 'const') return 1
  const base = f.kind === 'pow' ? f.base : f
  if (base.kind === 'var') return 2
  if (base.kind === 'add') return 3
  if (f.kind === 'root') return 4
  if (base.kind === 'const' || base.kind === 'num') return 5
  if (base.kind === 'fn') return 6
  if (base.kind === 'log') return 7
  return 8
}

function variableName(f: Expr): string {
  const base = f.kind === 'pow' ? f.base : f
  return base.kind === 'var' ? base.name : ''
}

function byDisplayOrder(a: Expr, b: Expr): number {
  return rank(a) - rank(b) || variableName(a).localeCompare(variableName(b))
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
