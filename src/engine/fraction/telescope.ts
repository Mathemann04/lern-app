import { toLatex } from '../expr/print.ts'
import { type Expr, add, div, mul, neg, num } from '../expr/types.ts'
import { type Rational, isOne, isZero, rat, ratAbs, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import { type Frac, fracAdd, fracNeg, fracOf, fracScale } from './frac.ts'
import { type PartialWork, factorPowerExpr, partialWorkOf } from './partial.ts'
import { type Poly, constValue, degreeIn, polyAdd, polyAtom, polyConst, polyPow, polySubstitute } from './poly.ts'
import type { TeleUpper } from './task.ts'

// Teleskopsummen (Stufe 5, Kapitel 4 des Lehrbuchs). Der Summand zerfällt in Partialbrüche
// A · (g(k) − g(k + d)) mit g(k) = 1/f(k)^p (f linear, p = 1 oder 2). Schreibt man die Summe aus,
// hebt sich jedes −g(k + d) mit dem g(k + d) d Summanden später weg; übrig bleiben die ersten d und
// die letzten d Brüche:
//   Σ_{k=m}^{n} A(g(k) − g(k + d)) = A(g(m) + … + g(m + d − 1) − g(n + 1) − … − g(n + d)).
// Das gilt für jedes n ≥ m − 1. Für n → ∞ gehen die hinteren Brüche gegen 0 (Reihe). Gerechnet wird
// exakt; der Test addiert zur Gegenprobe die Summanden einzeln (Teilsummen).

export type TeleWork = {
  readonly index: string
  readonly from: number
  readonly upper: TeleUpper
  // Zerlegung des Summanden (Nenner in Faktoren, Zahlen der Partialbrüche)
  readonly partial: PartialWork
  // Zahl vor der Klammer
  readonly factor: Rational
  // g(k) = 1 / base^power
  readonly base: Poly
  readonly power: number
  // Abstand d: der zweite Bruch ist g(k + d)
  readonly shift: number
}

// Rechnung mit einem typischen Fehler (ohne Angabe richtig):
// - factor: andere Zahl vor der Klammer; swap: die Brüche vertauscht, A(g(k + d) − g(k))
// - headFrom, headCount: welche vorderen Brüche bleiben; tailOffset, tailCount: welche hinteren
//   (g(n + tailOffset), …)
export type TeleVariant = {
  readonly factor?: Rational
  readonly swap?: boolean
  readonly headFrom?: number
  readonly headCount?: number
  readonly tailOffset?: number
  readonly tailCount?: number
}

// Zahl vor index^1 bzw. ohne index
const coefAt = (p: Poly, index: string, power: number): Rational => p.find((t) => degreeIn([t], index) === power)?.coef ?? rat(0)

// Ist g = f(k + d) für eine ganze Zahl d ≥ 1? Dann d, sonst null
function shiftBetween(f: Poly, g: Poly, index: string): number | null {
  const alpha = coefAt(f, index, 1)
  if (isZero(alpha) || !ratEq(alpha, coefAt(g, index, 1))) return null
  const d = ratDiv(ratSub(coefAt(g, index, 0), coefAt(f, index, 0)), alpha)
  if (d.d !== 1n || ratSign(d) <= 0) return null
  return Number(d.n)
}

// Zerlegt den Summanden; null, wenn er sich nicht als A(g(k) − g(k + d)) schreiben lässt
export function teleWorkOf(summand: Frac, index: string, from: number, upper: TeleUpper, hints: readonly Poly[] = []): TeleWork | null {
  const partial = partialWorkOf(summand.num, summand.den, hints)
  if (!partial || partial.divided || partial.letter !== index) return null
  const terms = partial.terms.filter((t) => !isZero(t.value))
  if (terms.length !== 2) return null
  const [a, b] = terms
  if (a.power !== b.power || !ratEq(a.value, ratNeg(b.value))) return null
  const forward = shiftBetween(a.factor, b.factor, index)
  const backward = forward === null ? shiftBetween(b.factor, a.factor, index) : null
  if (forward !== null) return { index, from, upper, partial, factor: a.value, base: a.factor, power: a.power, shift: forward }
  if (backward !== null) return { index, from, upper, partial, factor: b.value, base: b.factor, power: b.power, shift: backward }
  return null
}

// --- Werte ---

// Die obere Grenze als Polynom: n bzw. die Zahl
export const upperPoly = (u: TeleUpper): Poly => (u.kind === 'number' ? polyConst(u.value) : polyAtom(u.letter))

// f an der Stelle k (Zahl oder Polynom in n)
export const baseAt = (w: TeleWork, k: Poly | number): Poly => polySubstitute(w.base, w.index, typeof k === 'number' ? polyConst(k) : k)

// g(k) als Bruch
export const gFrac = (w: TeleWork, k: Poly | number): Frac => ({ num: polyConst(1), den: polyPow(baseAt(w, k), w.power) })

// g(k) als Zahl; null, wenn f(k) = 0
export function gValue(w: TeleWork, k: number): Rational | null {
  const f = constValue(baseAt(w, k)) ?? rat(0)
  if (isZero(f)) return null
  let v = rat(1)
  for (let i = 0; i < w.power; i++) v = ratDiv(v, f)
  return v
}

const shifted = (n: Poly, j: number): Poly => polyAdd(n, polyConst(j))

type Resolved = { readonly factor: Rational; readonly swap: boolean; readonly heads: readonly number[]; readonly tails: readonly number[] }

function resolve(w: TeleWork, v: TeleVariant): Resolved {
  const headFrom = v.headFrom ?? w.from
  const headCount = v.headCount ?? w.shift
  const tailOffset = v.tailOffset ?? 1
  const tailCount = v.tailCount ?? w.shift
  return {
    factor: v.factor ?? w.factor,
    swap: v.swap ?? false,
    heads: Array.from({ length: headCount }, (_, i) => headFrom + i),
    tails: Array.from({ length: tailCount }, (_, i) => tailOffset + i),
  }
}

// Was übrig bleibt, als Bruch in n (bei einer Zahl als obere Grenze eine Zahl); null, wenn ein
// Nenner 0 wird
export function remainingFrac(w: TeleWork, v: TeleVariant = {}): Frac | null {
  const r = resolve(w, v)
  const n = upperPoly(w.upper)
  let sum = fracOf([])
  for (const k of r.heads) {
    const g = gValue(w, k)
    if (!g) return null
    sum = fracAdd(sum, fracOf(polyConst(g)))
  }
  for (const j of r.tails) {
    const g = gFrac(w, shifted(n, j))
    const c = constValue(g.den)
    if (g.den.length === 0 || (c !== null && isZero(c))) return null
    sum = fracAdd(sum, fracNeg(g))
  }
  return fracScale(r.swap ? fracNeg(sum) : sum, r.factor)
}

// Grenzwert für n → ∞: die hinteren Brüche gehen gegen 0
export function remainingLimit(w: TeleWork, v: TeleVariant = {}): Rational | null {
  const r = resolve(w, v)
  let sum = rat(0)
  for (const k of r.heads) {
    const g = gValue(w, k)
    if (!g) return null
    sum = ratAdd(sum, g)
  }
  return ratMul(r.swap ? ratNeg(sum) : sum, r.factor)
}

// Ergebnis der Aufgabe: die Summe als Bruch in n, als Zahl, bzw. der Wert der Reihe; null, wenn sich
// mit dem Fehler nicht rechnen lässt
export function teleValue(w: TeleWork, v: TeleVariant = {}): Frac | null {
  if (w.upper.kind === 'infinity') {
    const l = remainingLimit(w, v)
    return l === null ? null : fracOf(polyConst(l))
  }
  return remainingFrac(w, v)
}

// Summe der Summanden von from bis to, einzeln addiert (Gegenprobe in den Tests)
export function partialSumDirect(summand: Frac, index: string, from: number, to: number): Rational | null {
  let sum = rat(0)
  for (let k = from; k <= to; k++) {
    const at = (p: Poly) => constValue(polySubstitute(p, index, polyConst(k))) ?? rat(0)
    const d = at(summand.den)
    if (isZero(d)) return null
    sum = ratAdd(sum, ratDiv(at(summand.num), d))
  }
  return sum
}

// --- Schreibweise ---

// g an einer Stelle: \frac{1}{3}, 1, \frac{1}{n + 1}, \frac{1}{(k + 2)^2}
export function gExpr(w: TeleWork, k: Poly | number): Expr {
  const f = baseAt(w, k)
  const c = constValue(f)
  if (c === null) return div(num(1), factorPowerExpr(f, w.power))
  let v = isZero(c) ? rat(0) : rat(1)
  for (let i = 0; i < w.power && !isZero(c); i++) v = ratDiv(v, c)
  return num(v)
}

// c · g an einer Stelle als ein Bruch: -\frac{3}{n + 2}, \frac{3}{2}
function scaledAt(w: TeleWork, c: Rational, k: Poly | number): Expr {
  const f = baseAt(w, k)
  const value = constValue(f)
  if (value === null) return scaledG(w, c, f)
  let v = c
  for (let i = 0; i < w.power; i++) v = ratDiv(v, value)
  return num(v)
}

const kPoly = (w: TeleWork, j = 0): Poly => shifted(polyAtom(w.index), j)

// Zahl vor einer Klammer: \frac{1}{2}\left(…\right); bei 1 ohne
function withFactor(c: Rational, inner: Expr): Expr {
  if (isOne(c)) return inner
  if (isOne(ratNeg(c))) return neg(inner)
  return ratSign(c) < 0 ? neg(mul(num(ratNeg(c)), inner)) : mul(num(c), inner)
}

// Ein Bruch mit Zahl: a / f^p, z. B. -\frac{1}{3(k + 1)} (f: der Nenner ohne Potenz)
function scaledG(w: TeleWork, a: Rational, f: Poly): Expr {
  const abs = ratAbs(a)
  const den = factorPowerExpr(f, w.power)
  const body = div(num(abs.n), abs.d === 1n ? den : mul(num(abs.d), den))
  return ratSign(a) < 0 ? neg(body) : body
}

// Zerlegung des Summanden mit den Zahlen a (bei g(k)) und b (bei g(k + d)): Bei gleichem Betrag steht
// die Zahl vor der Klammer, \frac{1}{2}\left(\frac{1}{k} - \frac{1}{k + 2}\right), sonst einzeln
export function pairExpr(w: TeleWork, a: Rational, b: Rational): Expr {
  const [first, second] = [kPoly(w), kPoly(w, w.shift)]
  if (ratEq(ratAbs(a), ratAbs(b))) {
    const c = ratAbs(a)
    const one = (s: Rational, k: Poly) => (ratSign(s) < 0 ? neg(gExpr(w, k)) : gExpr(w, k))
    // erst der Bruch mit Plus: \frac{1}{k + 2} - \frac{1}{k} statt -\frac{1}{k} + \frac{1}{k + 2}
    const terms = ratSign(a) < 0 && ratSign(b) > 0 ? [one(b, second), one(a, first)] : [one(a, first), one(b, second)]
    return withFactor(c, add(...terms))
  }
  return add(scaledG(w, a, baseAt(w, first)), scaledG(w, b, baseAt(w, second)))
}

// Zerlegung, wie sie in der Summe steht: A(g(k) − g(k + d)), mit einem Fehler
export function splitExpr(w: TeleWork, v: TeleVariant = {}): Expr {
  const c = v.factor ?? w.factor
  return v.swap ? pairExpr(w, ratNeg(c), c) : pairExpr(w, c, ratNeg(c))
}

// Die Klammer allein: g(k) − g(k + d) (die Zahl davor steht vor dem Summenzeichen)
export const bracketExpr = (w: TeleWork): Expr => add(gExpr(w, kPoly(w)), neg(gExpr(w, kPoly(w, w.shift))))

// Was übrig bleibt: A(g(m) + … − g(n + 1) − …)
export function remainingExpr(w: TeleWork, v: TeleVariant = {}): Expr {
  const r = resolve(w, v)
  const n = upperPoly(w.upper)
  const flip = r.swap ? -1 : 1
  const items = [...r.heads.map((k) => ({ sign: flip, at: k as Poly | number })), ...r.tails.map((j) => ({ sign: -flip, at: shifted(n, j) as Poly | number }))]
  // erst die Brüche mit Plus
  const ordered = [...items.filter((x) => x.sign > 0), ...items.filter((x) => x.sign < 0)]
  if (ordered.length === 0) return num(0)
  // ein einziger Bruch: die Zahl davor gleich hinein, -\frac{3}{n + 2} statt 3 \cdot \left(-\frac{1}{n + 2}\right)
  if (ordered.length === 1) return scaledAt(w, ordered[0].sign < 0 ? ratNeg(r.factor) : r.factor, ordered[0].at)
  return withFactor(r.factor, add(...ordered.map((x) => (x.sign < 0 ? neg(gExpr(w, x.at)) : gExpr(w, x.at)))))
}

// Die ausgeschriebene Summe: die ersten d + 1 Klammern, Pünktchen, die letzten d Klammern; mit der
// Zahl davor in eckigen Klammern. Auf Zeilen mit höchstens zwei Klammern verteilt, damit sie am Handy
// lesbar bleibt; jede weitere Zeile beginnt mit Plus
export function writtenLines(w: TeleWork): string[] {
  const n = upperPoly(w.upper)
  const pair = (k: Poly | number) => {
    const second = typeof k === 'number' ? k + w.shift : shifted(k, w.shift)
    return `\\left(${toLatex(add(gExpr(w, k), neg(gExpr(w, second))))}\\right)`
  }
  const front = Array.from({ length: w.shift + 1 }, (_, i) => pair(w.from + i))
  const back = Array.from({ length: w.shift }, (_, i) => {
    const j = i - w.shift + 1
    const c = constValue(n)
    return pair(c !== null ? Number(c.n) + j : shifted(n, j))
  })
  const pairs = (xs: readonly string[]) => Array.from({ length: Math.ceil(xs.length / 2) }, (_, i) => xs.slice(2 * i, 2 * i + 2))
  const frontLines = pairs(front)
  frontLines[frontLines.length - 1] = [...frontLines[frontLines.length - 1], '\\dots']
  const groups = [...frontLines, ...pairs(back)].map((g) => g.join(' + '))
  const factor = isOne(w.factor) ? null : toLatex(num(w.factor))
  return groups.map((g, i) => {
    const open = i === 0 ? (factor ? `${factor}\\Bigg[` : '') : '+ '
    const close = factor && i === groups.length - 1 ? '\\Bigg]' : ''
    return `${open}${g}${close}`
  })
}

// Dieselbe Summe in einer Zeile
export const writtenLatex = (w: TeleWork): string => writtenLines(w).join(' ')
