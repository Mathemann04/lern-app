import { key, subterms } from '../../expr/compare.ts'
import { toLatex } from '../../expr/print.ts'
import { type Expr, type Tool, asRational, div, fn, mul, mulDot, num, pow, sqrt } from '../../expr/types.ts'
import { isOne } from '../../rational.ts'
import { entryProduct, signedPart, squareOf, squareRootOf, tidySum } from './tidy.ts'

// Vektoren (Stufe 5, Teil 8b): Länge, Skalarprodukt und Winkel zwischen zwei Vektoren, als Spalten geschrieben.
// - Länge: Wurzel aus der Summe der Quadrate der Einträge (aufgeräumt: (-a)^2 = a^2, \left(e^{x}\right)^2 = e^{2x});
//   eine Quadratzahl als Zahl (\lvert(1, 2, 2)\rvert = 3).
// - Skalarprodukt: Einträge paarweise malnehmen und addieren, aufgeräumt (x(x + b) - ac).
// - Winkel: \arccos\frac{\vec u \cdot \vec v}{\lvert\vec u\rvert \cdot \lvert\vec v\rvert}; die Länge 1 fällt weg, gleich lange
//   Vektoren geben \lvert\vec u\rvert \cdot \lvert\vec v\rvert = \lvert\vec u\rvert^2 ohne Wurzel.
// Die Gegenprobe (evaluate.ts) rechnet mit Zahlen, unabhängig davon.

export type LengthTool = Extract<Tool, { kind: 'length' }>
export type DotTool = Extract<Tool, { kind: 'dot' }>
export type AngleTool = Extract<Tool, { kind: 'angle' }>

export type LengthMistake = 'eq-vec-length-root' | 'eq-vec-length-termwise'
export const LENGTH_MISTAKES: readonly LengthMistake[] = ['eq-vec-length-root', 'eq-vec-length-termwise']
export type DotMistake = 'eq-vec-dot-sign' | 'eq-vec-dot-cross'
export const DOT_MISTAKES: readonly DotMistake[] = ['eq-vec-dot-sign', 'eq-vec-dot-cross']
export type AngleMistake = 'eq-vec-not-divided' | 'eq-vec-one-length' | 'eq-vec-sine' | 'eq-vec-length-root' | DotMistake
export const ANGLE_MISTAKES: readonly AngleMistake[] = ['eq-vec-not-divided', 'eq-vec-one-length', 'eq-vec-sine', 'eq-vec-length-root', 'eq-vec-dot-sign', 'eq-vec-dot-cross']

const hasLetter = (e: Expr) => subterms(e).some((s) => s.kind === 'var')
const isZeroExpr = (e: Expr) => e.kind === 'num' && e.value.n === 0n
const isOneExpr = (e: Expr) => e.kind === 'num' && isOne(e.value)
const hasMinus = (entries: readonly Expr[]) => entries.some((e) => signedPart(e).sign < 0)

// \vec u \cdot \vec v mit einem typischen Fehler (ein Minus verloren, bei zwei Einträgen über Kreuz malgenommen);
// null, wenn der Fehler hier nichts ändert
export function dotValue(left: readonly Expr[], right: readonly Expr[], mistake: DotMistake | null): Expr | null {
  if (left.length !== right.length) return null
  if (mistake === 'eq-vec-dot-cross') {
    if (left.length !== 2) return null
    return tidySum([entryProduct(left[0], right[1]), entryProduct(left[1], right[0])])
  }
  if (mistake === 'eq-vec-dot-sign' && !hasMinus(left) && !hasMinus(right)) return null
  return tidySum(left.map((e, i) => entryProduct(e, right[i], mistake !== 'eq-vec-dot-sign')))
}

// Summe der Quadrate der Einträge
const squares = (vector: readonly Expr[]) => tidySum(vector.map(squareOf))

// \lvert\vec u\rvert mit einem typischen Fehler (Wurzel vergessen, Einträge addiert); null, wenn er nichts ändert
export function lengthValue(vector: readonly Expr[], mistake: LengthMistake | null): Expr | null {
  if (mistake === 'eq-vec-length-termwise') {
    // nur ein Eintrag: \lvert\vec u\rvert ist dieser Eintrag, gliedweise ändert nichts
    if (vector.filter((e) => !(e.kind === 'num' && e.value.n === 0n)).length < 2) return null
    return tidySum(vector.map((e) => signedPart(e).magnitude))
  }
  const s = squares(vector)
  const r = asRational(s)
  const root = r && squareRootOf(r)
  if (mistake === 'eq-vec-length-root') return root === 1n ? null : s
  return root !== null ? num(root) : sqrt(s)
}

// Summanden einer Summe, unabhängig von der Reihenfolge (x^2 + a^2 + b^2 und x^2 + b^2 + a^2)
const termKeys = (e: Expr) => (e.kind === 'add' ? e.terms : [e]).map(key).sort().join('|')

// \lvert\vec u\rvert \cdot \lvert\vec v\rvert: die Länge 1 fällt weg, gleiche Wurzeln geben den Term darunter, sonst
// eine Wurzel aus dem Produkt (\sqrt{2(x^2 + a^2)}), Zahlen vorn
function lengthProduct(lu: Expr, lv: Expr): Expr {
  if (lu.kind === 'root' && lv.kind === 'root' && termKeys(lu.arg) === termKeys(lv.arg)) return lu.arg
  if (termKeys(lu) === termKeys(lv)) return squareOf(lu)
  const parts = [lu, lv].filter((l) => !isOneExpr(l))
  if (parts.length === 0) return num(1)
  if (parts.length === 1) return parts[0]
  const numbers = parts.filter((p) => p.kind === 'num')
  const roots = parts.filter((p) => p.kind === 'root')
  // zwei Wurzeln: unter eine Wurzel (die Engine rechnet mit \left(\sqrt{2}\right)^2 nicht weiter)
  if (roots.length === 2) return sqrt(mul(...roots.map((r) => (r.kind === 'root' ? r.arg : r))))
  return mul(...numbers, ...parts.filter((p) => p.kind !== 'num'))
}

// \cos\varphi = \frac{\vec u \cdot \vec v}{\lvert\vec u\rvert \cdot \lvert\vec v\rvert} mit einem typischen Fehler; null, wenn er
// nichts ändert oder danach kein x mehr dasteht
export function cosineValue(left: readonly Expr[], right: readonly Expr[], mistake: AngleMistake | null): Expr | null {
  const dot = dotValue(left, right, mistake === 'eq-vec-dot-sign' || mistake === 'eq-vec-dot-cross' ? mistake : null)
  const root = mistake === 'eq-vec-length-root'
  const lu = lengthValue(left, null)
  const lv = lengthValue(right, null)
  if (!dot || !lu || !lv) return null
  if (mistake === 'eq-vec-not-divided') return isOneExpr(lu) && isOneExpr(lv) ? null : dot
  if (mistake === 'eq-vec-one-length') {
    // durch die Länge des Vektors mit x geteilt; ist die andere Länge 1, stimmt es zufällig
    if (isOneExpr(lu) || isOneExpr(lv)) return null
    return div(dot, hasLetter(lu) || !hasLetter(lv) ? lu : lv)
  }
  let den: Expr
  if (root) {
    // die Längen ohne Wurzel (also ihre Quadrate)
    const su = lengthValue(left, 'eq-vec-length-root')
    const sv = lengthValue(right, 'eq-vec-length-root')
    if (!su && !sv) return null
    den = lengthProduct(su ?? lu, sv ?? lv)
    if (den.kind === 'root') return null
  } else den = lengthProduct(lu, lv)
  // ein Fehler, nach dem der Bruch 0 oder 1 ist, ließe kein x übrig (bei gleich langen Vektoren)
  if (isZeroExpr(dot) || termKeys(dot) === termKeys(den)) return null
  return isOneExpr(den) ? dot : div(dot, den)
}

// \sphericalangle(\vec u, \vec v) als \arccos(…), mit dem Fehler „Sinus statt Kosinus" als \arcsin(…)
export function angleValue(left: readonly Expr[], right: readonly Expr[], mistake: AngleMistake | null): Expr | null {
  const c = cosineValue(left, right, mistake === 'eq-vec-sine' ? null : mistake)
  if (!c || (mistake !== null && mistake !== 'eq-vec-sine' && key(c) === key(cosineValue(left, right, null) ?? c))) return null
  return fn(mistake === 'eq-vec-sine' ? 'arcsin' : 'arccos', c)
}

// --- Rechenweg für die Erklärung ---

// Skalarprodukt mit Malpunkt (x \cdot x + a \cdot (-a)), Längen als Wurzel aus der Summe der Quadrate
export function dotWorkLatex(left: readonly Expr[], right: readonly Expr[]): string {
  return toLatex(tidyFree(left.map((e, i) => mulDot(e, right[i]))))
}

// Summe ohne Aufräumen: die Produkte stehen so da, wie man sie aufschreibt
function tidyFree(terms: readonly Expr[]): Expr {
  return terms.length === 1 ? terms[0] : { kind: 'add', terms }
}

export function lengthWorkLatex(vector: readonly Expr[]): string {
  const raw = `\\sqrt{${toLatex(tidyFree(vector.map((e) => pow(e, num(2)))))}}`
  const value = lengthValue(vector, null)
  const tidy = value ? toLatex(value) : raw
  return tidy === raw ? raw : `${raw} = ${tidy}`
}

// Winkel: Skalarprodukt, beide Längen und ihr Produkt
export function angleWork(t: AngleTool): { readonly dot: string; readonly dotValue: string; readonly lengths: readonly string[]; readonly product: string } | null {
  const dot = dotValue(t.left, t.right, null)
  const lu = lengthValue(t.left, null)
  const lv = lengthValue(t.right, null)
  if (!dot || !lu || !lv) return null
  return {
    dot: dotWorkLatex(t.left, t.right),
    dotValue: toLatex(dot),
    lengths: [lengthWorkLatex(t.left), lengthWorkLatex(t.right)],
    product: toLatex(lengthProduct(lu, lv)),
  }
}
