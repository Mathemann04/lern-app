import { key, subterms } from '../../expr/compare.ts'
import { type Expr, type Tool, add, asRational, mul, mulDot, neg, num, pow, sub } from '../../expr/types.ts'
import { toLatex } from '../../expr/print.ts'
import { type Rational, isOne, isZero, ratAdd, ratMul, ratNeg, ratSign } from '../../rational.ts'
import { toolExpr } from './tool.ts'

// Determinanten der Stufe 5 (docs/PLAN-M3.md, Teil 8a): 2 × 2 in einem Schritt (Hauptdiagonale minus
// Nebendiagonale), 3 × 3 nur mit einer Zeile oder Spalte, in der zwei Nullen stehen: Dann wird nach ihr
// entwickelt (Vorzeichen aus dem Schachbrett mal Eintrag mal Unterdeterminante), danach steht eine
// 2 × 2-Determinante da, die der nächste Schritt ausrechnet. Die Gegenprobe (evaluate.ts) rechnet mit
// dem Gauß-Verfahren, unabhängig davon.

export type DetTool = Extract<Tool, { kind: 'det' }>

export type DetMistake = 'eq-det-plus' | 'eq-det-swapped' | 'eq-det-rows' | 'eq-det-main'
export const DET_MISTAKES: readonly DetMistake[] = ['eq-det-plus', 'eq-det-swapped', 'eq-det-rows', 'eq-det-main']
export type ExpandMistake = 'eq-det-checkerboard' | 'eq-det-entry'
export const EXPAND_MISTAKES: readonly ExpandMistake[] = ['eq-det-checkerboard', 'eq-det-entry']

// --- Produkte aufräumen ---

// Basis einer Potenz mit Zahl als Hochzahl (x^2 → x), sonst der Faktor selbst
const baseOf = (e: Expr): Expr => (e.kind === 'pow' && asRational(e.exp) ? e.base : e)
const exponentOf = (e: Expr): Rational => (e.kind === 'pow' && asRational(e.exp)) || { n: 1n, d: 1n }
const isE = (e: Expr): e is Extract<Expr, { kind: 'pow' }> => e.kind === 'pow' && e.base.kind === 'const' && e.base.name === 'e'

// Reihenfolge im Produkt: Buchstaben (alphabetisch, auch als Potenz), dann x, dann Wurzeln, dann
// Bausteine (e-Potenzen, Funktionen), Klammern und Werkzeuge
function rank(e: Expr): number {
  const b = baseOf(e)
  if (b.kind === 'var' && !b.tool) return b.name === 'x' ? 1 : 0
  if (b.kind === 'root') return 2
  return 3
}

// Hochzahl als c · u (u ohne Zahl davor): 2x → (2, x), -x → (-1, x), kx → (1, kx), 3 → (3, null)
function scaledPart(e: Expr): { c: Rational; u: Expr | null } {
  const r = asRational(e)
  if (r) return { c: r, u: null }
  if (e.kind === 'neg') {
    const inner = scaledPart(e.arg)
    return { c: ratNeg(inner.c), u: inner.u }
  }
  if (e.kind === 'mul' && e.factors.length >= 2) {
    const r0 = asRational(e.factors[0])
    if (r0) return { c: r0, u: e.factors.length === 2 ? e.factors[1] : mul(...e.factors.slice(1)) }
  }
  return { c: { n: 1n, d: 1n }, u: e }
}

function scaled(c: Rational, u: Expr): Expr {
  if (isOne(c)) return u
  if (isOne(ratNeg(c))) return neg(u)
  return ratSign(c) < 0 ? neg(mul(num(ratNeg(c)), u)) : mul(num(c), u)
}

// Produkt der Einträge, wie man es hinschreibt: Zahl vorn, Buchstaben alphabetisch, dann x, dann
// Bausteine; gleiche Faktoren zusammengefasst (x \cdot x = x^2, \sin x \cdot \sin x = \sin^2 x,
// e^{x} \cdot e^{-x} = 1, e^{x} \cdot e^{x} = e^{2x}), c \cdot \frac{1}{x} = \frac{c}{x}. Der Wert ändert sich nie.
export function product(...factors: Expr[]): Expr {
  let c: Rational = { n: 1n, d: 1n }
  const rest: Expr[] = []
  const dens: Expr[] = []
  for (const f of factors.flatMap((x) => (x.kind === 'mul' && !x.explicit ? x.factors : [x]))) {
    const r = asRational(f)
    if (r) c = ratMul(c, r)
    else if (f.kind === 'neg') {
      c = ratNeg(c)
      rest.push(f.arg)
    } else if (f.kind === 'div' && asRational(f.num) && isOne(asRational(f.num)!)) dens.push(f.den)
    else rest.push(f)
  }
  if (isZero(c)) return num(0)
  const merged: Expr[] = []
  for (const f of rest) {
    if (isE(f)) {
      const a = scaledPart(f.exp)
      const i = merged.findIndex((g) => isE(g) && key(scaledPart(g.exp).u ?? num(1)) === key(a.u ?? num(1)))
      if (i < 0) {
        merged.push(f)
        continue
      }
      const g = merged[i] as Extract<Expr, { kind: 'pow' }>
      const total = ratAdd(scaledPart(g.exp).c, a.c)
      if (isZero(total)) merged.splice(i, 1)
      else merged[i] = pow(f.base, a.u ? scaled(total, a.u) : num(total))
      continue
    }
    const base = baseOf(f)
    const i = merged.findIndex((g) => !isE(g) && key(baseOf(g)) === key(base))
    if (i < 0) {
      merged.push(f)
      continue
    }
    const total = ratAdd(exponentOf(merged[i]), exponentOf(f))
    if (isZero(total)) merged.splice(i, 1)
    else merged[i] = isOne(total) ? base : pow(base, num(total))
  }
  // feste Reihenfolge, damit gleiche Produkte gleich aussehen (\sin x \cdot \cos x = \cos x \cdot \sin x)
  merged.sort((p, q) => rank(p) - rank(q) || key(baseOf(p)).localeCompare(key(baseOf(q))))
  const negative = ratSign(c) < 0
  const abs = negative ? ratNeg(c) : c
  let body = merged.length === 0 ? num(abs) : isOne(abs) ? (merged.length === 1 ? merged[0] : mul(...merged)) : mul(num(abs), ...merged)
  if (dens.length > 0) body = { kind: 'div', num: body, den: dens.length === 1 ? dens[0] : product(...dens) }
  return negative ? neg(body) : body
}

const isZeroExpr = (e: Expr) => e.kind === 'num' && e.value.n === 0n

// Summe ohne Nullen; ein Summand, der selbst eine Summe ist, steht ohne Klammer da
function sum(...terms: Expr[]): Expr {
  const kept = terms.filter((t) => !isZeroExpr(t)).flatMap((t) => (t.kind === 'add' ? t.terms : [t]))
  return kept.length === 0 ? num(0) : kept.length === 1 ? kept[0] : add(...kept)
}

const minus = (e: Expr): Expr => (e.kind === 'neg' ? e.arg : isZeroExpr(e) ? e : e.kind === 'num' ? num(ratNeg(e.value)) : neg(e))

// Buchstaben eines Terms (die Einträge enthalten keine Werkzeuge)
const lettersOf = (e: Expr): Set<string> => new Set(subterms(e).flatMap((s) => (s.kind === 'var' ? [s.name] : [])))

// --- 2 × 2 ---

// \det\begin{pmatrix} p & q \\ r & s \end{pmatrix} = ps - qr, mit einem typischen Fehler; null, wenn der Fehler
// hier nichts ändert oder nicht passt
function det2(p: Expr, q: Expr, r: Expr, s: Expr, mistake: DetMistake | null): Expr | null {
  const main = product(p, s)
  const side = product(q, r)
  switch (mistake) {
    case null:
      return sum(main, minus(side))
    case 'eq-det-plus':
      return sum(main, side)
    case 'eq-det-swapped':
      return sum(side, minus(main))
    case 'eq-det-main':
      return main
    case 'eq-det-rows': {
      // die Formel „ps - qr" zeilenweise gelesen (pq - rs) oder spaltenweise (pr - qs): ohne gleiche Produkte,
      // lieber die Variante, in der alle Buchstaben bleiben (bei e^{x} \cdot e^{-x} = 1 fiele x weg)
      const all = lettersOf(sum(main, minus(side)))
      const variants = [
        [product(p, q), product(r, s)],
        [product(p, r), product(q, s)],
      ].filter(([u, v]) => key(u) !== key(v))
      const kept = variants.find(([u, v]) => [...all].every((l) => lettersOf(u).has(l) || lettersOf(v).has(l))) ?? variants[0]
      return kept ? sum(kept[0], minus(kept[1])) : null
    }
  }
}

export function detValue(t: DetTool, mistake: DetMistake | null): Expr | null {
  const m = t.rows
  return m.length === 2 ? det2(m[0][0], m[0][1], m[1][0], m[1][1], mistake) : null
}

// --- 3 × 3: Entwickeln nach der Zeile oder Spalte mit zwei Nullen ---

// Linie mit genau einem Eintrag ungleich 0 (Zeilen vor Spalten, oben vor unten): Stelle des Eintrags
export function expansionLine(m: readonly (readonly Expr[])[]): { readonly row: boolean; readonly i: number; readonly j: number } | null {
  for (let i = 0; i < 3; i++) {
    const others = [0, 1, 2].filter((j) => !isZeroExpr(m[i][j]))
    if (others.length === 1) return { row: true, i, j: others[0] }
  }
  for (let j = 0; j < 3; j++) {
    const others = [0, 1, 2].filter((i) => !isZeroExpr(m[i][j]))
    if (others.length === 1) return { row: false, i: others[0], j }
  }
  return null
}

// Unterdeterminante zum Eintrag (i, j): Zeile i und Spalte j streichen
export const minorOf = (m: readonly (readonly Expr[])[], i: number, j: number): DetTool => ({
  kind: 'det',
  rows: [0, 1, 2].filter((r) => r !== i).map((r) => [0, 1, 2].filter((c) => c !== j).map((c) => m[r][c])),
})

// ±Eintrag · Unterdeterminante, mit einem typischen Fehler (Vorzeichen aus dem Schachbrett vertauscht,
// Eintrag vergessen); null ohne Linie mit zwei Nullen oder wenn der Fehler nichts ändert
export function expandValue(t: DetTool, mistake: ExpandMistake | null): Expr | null {
  const m = t.rows
  if (m.length !== 3) return null
  const line = expansionLine(m)
  if (!line) return null
  const { i, j } = line
  const minor = toolExpr(minorOf(m, i, j))
  const sign = (i + j) % 2 === 0 ? 1 : -1
  const entry = m[i][j]
  const entryValue = asRational(entry)
  if (mistake === 'eq-det-entry' && entryValue && isOne(entryValue)) return null
  const used = mistake === 'eq-det-checkerboard' ? -sign : sign
  const value = mistake === 'eq-det-entry' ? minor : product(entry, minor)
  return used === 1 ? value : minus(value)
}

// --- Rechenweg für die Erklärung ---

// 2 × 2: die Produkte mit Malpunkt, z. B. e^{x} \cdot b - e^{-x} \cdot a
export function detWorkLatex(t: DetTool): string | null {
  const m = t.rows
  return m.length === 2 ? toLatex(sub(mulDot(m[0][0], m[1][1]), mulDot(m[0][1], m[1][0]))) : null
}

// 3 × 3: nach welcher Linie entwickelt wird, Stelle (von 1 an gezählt) und Vorzeichen aus dem Schachbrett
export function expandWork(t: DetTool): { readonly line: string; readonly entry: string; readonly sign: '+' | '-' } | null {
  const line = t.rows.length === 3 ? expansionLine(t.rows) : null
  if (!line) return null
  const where = line.row ? `${line.i + 1}. Zeile` : `${line.j + 1}. Spalte`
  return { line: where, entry: toLatex(t.rows[line.i][line.j]), sign: (line.i + line.j) % 2 === 0 ? '+' : '-' }
}
