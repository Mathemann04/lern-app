import { key } from '../../expr/compare.ts'
import { type Expr, add, asRational, mul, neg, num, pow } from '../../expr/types.ts'
import { type Rational, isOne, isZero, ratAdd, ratMul, ratNeg, ratSign } from '../../rational.ts'
import { product } from './determinant.ts'

// Aufräumen beim Ausrechnen von Betrag, Winkel, Länge und Skalarprodukt (Teil 8b): Quadrate und Produkte
// von Einträgen wie man sie hinschreibt (product aus determinant.ts), Summen mit zusammengefassten
// gleichen Summanden. Der Wert ändert sich nie.

const isZeroExpr = (e: Expr) => e.kind === 'num' && e.value.n === 0n

// Vorzeichen und Rest: -a → (-1, a), -3 → (-1, 3), -2x → (-1, 2x)
export function signedPart(e: Expr): { readonly sign: 1 | -1; readonly magnitude: Expr } {
  if (e.kind === 'neg') {
    const inner = signedPart(e.arg)
    return { sign: inner.sign === 1 ? -1 : 1, magnitude: inner.magnitude }
  }
  const r = asRational(e)
  if (r && ratSign(r) < 0) return { sign: -1, magnitude: num(ratNeg(r)) }
  if (e.kind === 'mul' && e.factors.length >= 2) {
    const r0 = asRational(e.factors[0])
    if (r0 && ratSign(r0) < 0) {
      const rest = e.factors.slice(1)
      return { sign: -1, magnitude: isOne(ratNeg(r0)) ? (rest.length === 1 ? rest[0] : mul(...rest)) : mul(num(ratNeg(r0)), ...rest) }
    }
  }
  return { sign: 1, magnitude: e }
}

const negated = (e: Expr): Expr => {
  const r = asRational(e)
  return r ? num(ratNeg(r)) : e.kind === 'neg' ? e.arg : neg(e)
}

// Quadrat eines Eintrags: (-a)^2 = a^2, (2x)^2 = 4x^2, \left(e^{x}\right)^2 = e^{2x}, \left(\sqrt{x}\right)^2 = x,
// (b\sin x)^2 = b^2\sin^2 x; eine Summe bleibt als Klammer stehen: (x + a)^2
export function squareOf(e: Expr): Expr {
  const { magnitude } = signedPart(e)
  if (magnitude.kind === 'root' && magnitude.index === 2) return magnitude.arg
  if (magnitude.kind === 'add') return pow(magnitude, num(2))
  return product(magnitude, magnitude)
}

// Produkt zweier Einträge: Vorzeichen davor, \sqrt{x} \cdot \sqrt{x} = x, sonst wie product; keepSign = false:
// ein Minus geht verloren (typischer Fehler)
export function entryProduct(p: Expr, q: Expr, keepSign = true): Expr {
  const a = signedPart(p)
  const b = signedPart(q)
  const m =
    a.magnitude.kind === 'root' && a.magnitude.index === 2 && key(a.magnitude) === key(b.magnitude)
      ? a.magnitude.arg
      : product(a.magnitude, b.magnitude)
  if (isZeroExpr(m)) return num(0)
  return keepSign && a.sign * b.sign < 0 ? negated(m) : m
}

// Summe aufgeräumt: gleiche Summanden zusammengefasst (x^2 + x^2 = 2x^2, ab - ab = 0), Zahlen addiert und
// hinten, eine Summe als Summand ohne Klammer, möglichst mit Plus vorn (a^2 - x^2 statt -x^2 + a^2)
export function tidySum(terms: readonly Expr[]): Expr {
  const flat = terms.flatMap((t) => (t.kind === 'add' ? t.terms : [t])).filter((t) => !isZeroExpr(t))
  let constant: Rational = { n: 0n, d: 1n }
  const collected: { term: Expr; count: Rational }[] = []
  for (const t of flat) {
    const r = asRational(t)
    if (r) {
      constant = ratAdd(constant, r)
      continue
    }
    const { sign, magnitude } = signedPart(t)
    // Zahl vor dem Summanden: 2x^2 → (2, x^2)
    let count: Rational = { n: BigInt(sign), d: 1n }
    let base = magnitude
    if (magnitude.kind === 'mul' && magnitude.factors.length >= 2) {
      const r0 = asRational(magnitude.factors[0])
      if (r0) {
        count = ratMul(count, r0)
        base = magnitude.factors.length === 2 ? magnitude.factors[1] : mul(...magnitude.factors.slice(1))
      }
    }
    const same = collected.find((c) => key(c.term) === key(base))
    if (same) same.count = ratAdd(same.count, count)
    else collected.push({ term: base, count })
  }
  const kept = collected
    .filter((c) => !isZero(c.count))
    .map(({ term, count }) => {
      const positive = ratSign(count) > 0
      const size = positive ? count : ratNeg(count)
      const value = isOne(size) ? term : product(num(size), term)
      return positive ? value : negated(value)
    })
  if (!isZero(constant)) kept.push(num(constant))
  if (kept.length === 0) return num(0)
  const first = kept.findIndex((t) => signedPart(t).sign > 0)
  if (first > 0) kept.unshift(...kept.splice(first, 1))
  return kept.length === 1 ? kept[0] : add(...kept)
}

// Ganze Zahl, deren Quadrat r ist (25 → 5); sonst null
export function squareRootOf(r: Rational): bigint | null {
  if (ratSign(r) < 0 || r.d !== 1n) return null
  const root = BigInt(Math.round(Math.sqrt(Number(r.n))))
  return root * root === r.n ? root : null
}
