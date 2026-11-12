import { type Rational, ONE, ZERO, isInteger, rat, ratAdd, ratDiv, ratMul, ratNeg, ratSign, ratSub, isZero } from '../rational.ts'

// Vektoren mit exakten Einträgen (M7): Brüche aus rational.ts, Längen als Vielfaches einer Wurzel (Surd). Reines
// TypeScript ohne Oberfläche. LaTeX in deutscher Schreibweise (Spaltenvektoren, Punkte als A(1 | 2 | 3)).

export type Vec = readonly Rational[]

export const vec = (...xs: readonly (number | Rational)[]): Vec => xs.map((x) => (typeof x === 'number' ? rat(x) : x))
export const vecAdd = (a: Vec, b: Vec): Vec => a.map((x, i) => ratAdd(x, b[i]))
export const vecSub = (a: Vec, b: Vec): Vec => a.map((x, i) => ratSub(x, b[i]))
export const vecScale = (k: Rational, a: Vec): Vec => a.map((x) => ratMul(k, x))
export const vecNeg = (a: Vec): Vec => a.map(ratNeg)
export const vecDot = (a: Vec, b: Vec): Rational => a.reduce((s, x, i) => ratAdd(s, ratMul(x, b[i])), ZERO)
export const vecEq = (a: Vec, b: Vec): boolean => a.length === b.length && a.every((x, i) => x.n === b[i].n && x.d === b[i].d)
export const vecIsZero = (a: Vec): boolean => a.every(isZero)
export const vecNumbers = (a: Vec): number[] => a.map((x) => Number(x.n) / Number(x.d))
// Summe der Quadrate der Einträge (Quadrat der Länge)
export const vecNorm2 = (a: Vec): Rational => vecDot(a, a)

// ------------------------------------------------------------------ Wurzeln

// coef · √rad mit quadratfreiem rad ≥ 1 (rad = 1: eine rationale Zahl)
export type Surd = { readonly coef: Rational; readonly rad: bigint }

function squareFree(n: bigint): { readonly out: bigint; readonly rest: bigint } {
  let out = 1n
  let rest = n
  for (let p = 2n; p * p <= rest; p++) {
    while (rest % (p * p) === 0n) {
      rest /= p * p
      out *= p
    }
  }
  return { out, rest }
}

// √q für eine Zahl q ≥ 0, so weit wie möglich vereinfacht: √(18) = 3√2, √(9/2) = 3/2·√2
export function sqrtRat(q: Rational): Surd {
  if (ratSign(q) < 0) throw new RangeError('Wurzel aus einer negativen Zahl')
  if (isZero(q)) return { coef: ZERO, rad: 1n }
  // √(n/d) = √(n·d)/d
  const { out, rest } = squareFree(q.n * q.d)
  return { coef: rat(out, q.d), rad: rest }
}

export const surdValue = (s: Surd): number => (Number(s.coef.n) / Number(s.coef.d)) * Math.sqrt(Number(s.rad))
export const surdEq = (a: Surd, b: Surd): boolean => a.rad === b.rad && a.coef.n === b.coef.n && a.coef.d === b.coef.d
export const surdIsRational = (s: Surd): boolean => s.rad === 1n || isZero(s.coef)

// Länge eines Vektors
export const vecLength = (a: Vec): Surd => sqrtRat(vecNorm2(a))

// ------------------------------------------------------------------ LaTeX

export function ratLatex(r: Rational): string {
  if (isInteger(r)) return r.n.toString()
  const sign = r.n < 0n ? '-' : ''
  const n = r.n < 0n ? -r.n : r.n
  return `${sign}\\frac{${n}}{${r.d}}`
}

// Zahl als Faktor in einer Rechnung: negative in Klammern
export const ratFactorLatex = (r: Rational): string => (ratSign(r) < 0 ? `(${ratLatex(r)})` : ratLatex(r))

export function surdLatex(s: Surd): string {
  if (s.rad === 1n || isZero(s.coef)) return ratLatex(s.coef)
  const root = `\\sqrt{${s.rad}}`
  const sign = s.coef.n < 0n ? '-' : ''
  const n = s.coef.n < 0n ? -s.coef.n : s.coef.n
  const top = n === 1n ? root : `${n}${root}`
  return s.coef.d === 1n ? `${sign}${top}` : `${sign}\\frac{${top}}{${s.coef.d}}`
}

export const columnLatex = (entries: readonly string[]): string => `\\begin{pmatrix} ${entries.join(' \\\\ ')} \\end{pmatrix}`
export const vecLatex = (a: Vec): string => columnLatex(a.map(ratLatex))
export const pointLatex = (name: string, p: Vec): string => `${name}(${p.map(ratLatex).join(' \\mid ')})`

// Vektor mal Wurzel: Einträge a_i · √rad (z. B. ein Einheitsvektor nach dem Rationalmachen)
export const surdVecLatex = (a: Vec, rad: bigint): string => columnLatex(a.map((x) => surdLatex({ coef: x, rad })))

// Name eines Vektors: \vec a, Verbindungsvektor \overrightarrow{AB}
export const vecName = (letter: string): string => `\\vec ${letter}`
export const arrowName = (from: string, to: string): string => `\\overrightarrow{${from}${to}}`

// Faktor vor einem Vektor: 1 fällt weg, −1 wird zum Minus
export function coefLatex(k: Rational, first: boolean): string {
  const sign = ratSign(k) < 0 ? '-' : first ? '' : '+'
  const abs = ratSign(k) < 0 ? ratNeg(k) : k
  const body = abs.n === 1n && abs.d === 1n ? '' : ratLatex(abs)
  return `${sign}${body}`
}

export const ratHalf = (r: Rational): Rational => ratDiv(r, rat(2))
export { ONE, ZERO }
