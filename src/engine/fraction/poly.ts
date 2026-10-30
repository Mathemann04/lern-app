import { type Rational, ONE, isInteger, isOne, isZero, rat, ratAbs, ratAdd, ratDiv, ratMul, ratNeg, ratSign } from '../rational.ts'

// Polynome in mehreren Größen mit exakten Bruchzahlen als Vorzahlen, z. B. 3x² − 2xy + 1/2.
// Die Größen („Atome") sind Buchstaben wie x oder Bausteine wie e^x (siehe frac.ts); hier zählt
// nur ihr Name. Damit rechnet die Bruch-Engine exakt: gleichwertig, kürzen, Hauptnenner.

// Reihenfolge der Atome beim Sortieren und Schreiben: x vor y vor den übrigen Kleinbuchstaben
// (alphabetisch: a, b, c …), Bausteine danach. R = √x, e = die Eulersche Zahl (nur in falschen
// Ergebnissen wie e^2). Andere Namen (z. B. Teile, mit denen nur als Ganzes gerechnet wird) zuletzt.
const ATOM_ORDER = ['x', 'y', 'E', 'L', 'S', 'C', 'T', 'R', 'e']
const isLetter = (atom: string) => /^[a-z]$/.test(atom) && atom !== 'e'

const rank = (atom: string) => {
  if (atom === 'x' || atom === 'y') return ATOM_ORDER.indexOf(atom)
  if (isLetter(atom)) return 1.5
  const i = ATOM_ORDER.indexOf(atom)
  return i === -1 ? ATOM_ORDER.length : i
}

const compareAtoms = (a: string, b: string) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0)

// Hochzahl je Atom (nur Hochzahlen ≥ 1), sortiert nach ATOM_ORDER
export type Monomial = readonly (readonly [string, number])[]
export type Term = { readonly mono: Monomial; readonly coef: Rational }
// Summanden nach fallendem Grad sortiert (compareMonomials), ohne Nullen, jedes Monom einmal
export type Poly = readonly Term[]

// --- Monome ---

const monoKey = (m: Monomial) => m.map(([atom, e]) => `${atom}${e}`).join('.')

export const monoDegree = (m: Monomial) => m.reduce((sum, [, e]) => sum + e, 0)

const exponentOf = (m: Monomial, atom: string) => m.find(([a]) => a === atom)?.[1] ?? 0

function monoFromMap(map: ReadonlyMap<string, number>): Monomial {
  return [...map.entries()].filter(([, e]) => e > 0).sort(([a], [b]) => compareAtoms(a, b))
}

// Monom aus Atomen und Hochzahlen in beliebiger Reihenfolge (wird sortiert, Hochzahl 0 fällt weg)
export const monomial = (entries: Iterable<readonly [string, number]>): Monomial => monoFromMap(new Map(entries))

function monoMul(a: Monomial, b: Monomial): Monomial {
  const map = new Map(a)
  for (const [atom, e] of b) map.set(atom, (map.get(atom) ?? 0) + e)
  return monoFromMap(map)
}

// a / b, wenn b in a aufgeht; sonst null
export function monoDivide(a: Monomial, b: Monomial): Monomial | null {
  const map = new Map(a)
  for (const [atom, e] of b) {
    const rest = (map.get(atom) ?? 0) - e
    if (rest < 0) return null
    map.set(atom, rest)
  }
  return monoFromMap(map)
}

// Größter gemeinsamer Teiler zweier Monome: je Atom die kleinere Hochzahl
export function monoGcd(a: Monomial, b: Monomial): Monomial {
  return monoFromMap(new Map(a.map(([atom, e]) => [atom, Math.min(e, exponentOf(b, atom))])))
}

// Gradweise, dann lexikografisch nach ATOM_ORDER: x² vor xy vor y² vor x vor 1.
// Negativ, wenn a zuerst kommt. (Eine Monomordnung, nötig für die Division.)
export function compareMonomials(a: Monomial, b: Monomial): number {
  const byDegree = monoDegree(b) - monoDegree(a)
  if (byDegree !== 0) return byDegree
  const atoms = [...new Set([...a, ...b].map(([atom]) => atom))].sort(compareAtoms)
  for (const atom of atoms) {
    const diff = exponentOf(b, atom) - exponentOf(a, atom)
    if (diff !== 0) return diff
  }
  return 0
}

// --- Polynome bauen ---

function fromTerms(terms: Iterable<Term>): Poly {
  const byKey = new Map<string, Term>()
  for (const raw of terms) {
    // Monome immer sortiert, auch wenn sie von Hand gebaut wurden
    const t = { mono: monomial(raw.mono), coef: raw.coef }
    const k = monoKey(t.mono)
    const prev = byKey.get(k)
    byKey.set(k, prev ? { mono: t.mono, coef: ratAdd(prev.coef, t.coef) } : t)
  }
  return [...byKey.values()].filter((t) => !isZero(t.coef)).sort((a, b) => compareMonomials(a.mono, b.mono))
}

export const ZERO_POLY: Poly = []

export function polyConst(c: Rational | number): Poly {
  const value = typeof c === 'number' ? rat(c) : c
  return isZero(value) ? [] : [{ mono: [], coef: value }]
}

export const polyAtom = (atom: string, exponent = 1): Poly => [{ mono: [[atom, exponent]], coef: ONE }]

export const polyAdd = (p: Poly, q: Poly): Poly => fromTerms([...p, ...q])

export const polyNeg = (p: Poly): Poly => p.map((t) => ({ mono: t.mono, coef: ratNeg(t.coef) }))

export const polySub = (p: Poly, q: Poly): Poly => polyAdd(p, polyNeg(q))

export function polyScale(p: Poly, c: Rational): Poly {
  return isZero(c) ? [] : p.map((t) => ({ mono: t.mono, coef: ratMul(t.coef, c) }))
}

export function polyMul(p: Poly, q: Poly): Poly {
  const terms: Term[] = []
  for (const a of p) for (const b of q) terms.push({ mono: monoMul(a.mono, b.mono), coef: ratMul(a.coef, b.coef) })
  return fromTerms(terms)
}

export function polyPow(p: Poly, k: number): Poly {
  let result = polyConst(1)
  for (let i = 0; i < k; i++) result = polyMul(result, p)
  return result
}

export const polySum = (ps: readonly Poly[]): Poly => fromTerms(ps.flat())

// Setzt für ein Atom ein Polynom ein, z. B. x → (√x)²: jede Potenz atom^k wird zu q^k
export function polySubstitute(p: Poly, atom: string, q: Poly): Poly {
  return polySum(
    p.map((t) => {
      const k = exponentOf(t.mono, atom)
      const rest: Term = { mono: t.mono.filter(([a]) => a !== atom), coef: t.coef }
      return k === 0 ? [rest] : polyMul([rest], polyPow(q, k))
    }),
  )
}

export const polyProduct = (ps: readonly Poly[]): Poly => ps.reduce(polyMul, polyConst(1))

// --- Eigenschaften ---

export const isZeroPoly = (p: Poly) => p.length === 0

export const polyEquals = (p: Poly, q: Poly) => isZeroPoly(polySub(p, q))

// Wert einer Zahl ohne Atome; sonst null
export function constValue(p: Poly): Rational | null {
  if (p.length === 0) return rat(0)
  return p.length === 1 && p[0].mono.length === 0 ? p[0].coef : null
}

export const totalDegree = (p: Poly) => (p.length === 0 ? 0 : monoDegree(p[0].mono))

export function atomsOf(p: Poly): string[] {
  return [...new Set(p.flatMap((t) => t.mono.map(([atom]) => atom)))].sort(compareAtoms)
}

// Höchste Hochzahl eines Atoms
export const degreeIn = (p: Poly, atom: string) => Math.max(0, ...p.map((t) => exponentOf(t.mono, atom)))

export const leadingCoef = (p: Poly): Rational => p[0]?.coef ?? rat(0)

// --- Teilen ---

// f / g, wenn g in f aufgeht (Rest 0); sonst null. Mit nur einem Teiler ist der Rest eindeutig,
// deshalb funktioniert das auch bei mehreren Atomen.
export function polyDivideExact(f: Poly, g: Poly): Poly | null {
  if (isZeroPoly(g)) throw new RangeError('Teilen durch das Nullpolynom')
  let rest = f
  const quotient: Term[] = []
  const lead = g[0]
  while (!isZeroPoly(rest)) {
    const mono = monoDivide(rest[0].mono, lead.mono)
    if (!mono) return null
    const t: Term = { mono, coef: ratDiv(rest[0].coef, lead.coef) }
    quotient.push(t)
    rest = polySub(rest, polyMul([t], g))
  }
  return fromTerms(quotient)
}

// Division mit Rest bei Polynomen in (höchstens) einem Atom
function divRem(f: Poly, g: Poly, atom: string): { q: Poly; r: Poly } {
  let r = f
  let q: Poly = []
  const dg = degreeIn(g, atom)
  const lead = leadingCoef(g)
  while (!isZeroPoly(r) && degreeIn(r, atom) >= dg) {
    const t: Term = { mono: monoFromMap(new Map([[atom, degreeIn(r, atom) - dg]])), coef: ratDiv(leadingCoef(r), lead) }
    q = polyAdd(q, [t])
    r = polySub(r, polyMul([t], g))
  }
  return { q, r }
}

// Größter gemeinsamer Teiler zweier Polynome in demselben einen Atom (Euklid), normiert mit
// ganzzahligen, teilerfremden Vorzahlen und positivem ersten Summanden. null bei mehreren Atomen.
export function gcdUnivariate(f: Poly, g: Poly): Poly | null {
  const atoms = [...new Set([...atomsOf(f), ...atomsOf(g)])]
  if (atoms.length > 1) return null
  if (isZeroPoly(f)) return primitivePart(g)
  if (isZeroPoly(g)) return primitivePart(f)
  if (atoms.length === 0) return polyConst(1)
  let a = f
  let b = g
  while (!isZeroPoly(b)) [a, b] = [b, divRem(a, b, atoms[0]).r]
  return primitivePart(a)
}

// --- Inhalt ---

function gcdBig(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a
  b = b < 0n ? -b : b
  while (b !== 0n) [a, b] = [b, a % b]
  return a
}

export const lcmBig = (a: bigint, b: bigint): bigint => (a === 0n || b === 0n ? 0n : (a / gcdBig(a, b)) * b)

// 1 ± sin x bzw. 1 ± cos x: Hier steht die 1 vorn (1 − sin x statt −(sin x − 1)), wie im Skript
// bei 1 − sin² x = (1 − sin x)(1 + sin x)
export function isUnitTrigLinear(p: Poly): boolean {
  if (p.length !== 2) return false
  const [first, last] = p
  const block = first.mono.length === 1 && first.mono[0][1] === 1 && (first.mono[0][0] === 'S' || first.mono[0][0] === 'C')
  return block && last.mono.length === 0 && isOne(ratAbs(first.coef)) && isOne(ratAbs(last.coef))
}

// Zahl c mit dem Vorzeichen des ersten Summanden (bei 1 ± sin x: der 1), sodass p / c
// ganzzahlige, teilerfremde Vorzahlen hat, z. B. 4x + 6 → 2, −x/2 + 1 → −1/2, 1 − sin x → 1
export function polyContent(p: Poly): Rational {
  if (p.length === 0) return rat(1)
  const numerators = p.reduce((g, t) => gcdBig(g, t.coef.n), 0n)
  const denominators = p.reduce((l, t) => lcmBig(l, t.coef.d), 1n)
  const c = rat(numerators, denominators)
  const lead = isUnitTrigLinear(p) ? p[1].coef : leadingCoef(p)
  return ratSign(lead) < 0 ? ratNeg(c) : c
}

// p ohne Inhalt: ganzzahlig, teilerfremd, erster Summand positiv
export const primitivePart = (p: Poly): Poly => (p.length === 0 ? p : polyScale(p, ratDiv(rat(1), polyContent(p))))

// Gemeinsamer Monom-Faktor aller Summanden, z. B. 3x²y + 6xy² → xy
export function monomialContent(p: Poly): Monomial {
  return p.length === 0 ? [] : p.slice(1).reduce((m, t) => monoGcd(m, t.mono), p[0].mono)
}

export const hasIntegerCoefficients = (p: Poly) => p.every((t) => isInteger(t.coef))
