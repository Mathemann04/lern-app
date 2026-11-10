import { ONE, type Rational, ZERO, isZero, rat, ratAdd, ratDiv, ratEq, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import { type Formula, atomCounts, formulaCe, parseFormula } from './formula.ts'

// Reaktionsgleichungen (Plan M4, Teil B „Chemie-Engine", equation.ts und balance.ts): Stoffe mit
// Koeffizienten, Atombilanz, Ausgleichen über das Gleichungssystem der Atombilanz mit exakten Brüchen.
// Ausgeglichen wird mit den kleinsten ganzen Zahlen (docs/CHEMIE.md §3). Gleichungen mit mehr als einer
// unabhängigen Lösung haben keine eindeutigen Koeffizienten (balance gibt null).

export type Species = { readonly text: string; readonly formula: Formula }
export const species = (text: string): Species => ({ text, formula: parseFormula(text) })

export type Side = readonly { readonly species: Species; readonly coefficient: Rational }[]
export type Equation = { readonly reactants: Side; readonly products: Side }

// Atome je Element auf einer Seite (mit Koeffizienten)
export function sideCounts(side: Side): Map<string, Rational> {
  const counts = new Map<string, Rational>()
  for (const { species: s, coefficient } of side) {
    for (const [symbol, n] of atomCounts(s.formula)) counts.set(symbol, ratAdd(counts.get(symbol) ?? ZERO, ratMul(coefficient, rat(n))))
  }
  return counts
}

// Stimmt die Atombilanz für jedes Element?
export function isBalanced(eq: Equation): boolean {
  const left = sideCounts(eq.reactants)
  const right = sideCounts(eq.products)
  const symbols = new Set([...left.keys(), ...right.keys()])
  return [...symbols].every((s) => ratEq(left.get(s) ?? ZERO, right.get(s) ?? ZERO))
}

// Elemente in der Reihenfolge ihres ersten Auftretens
function elementsOf(list: readonly Species[]): string[] {
  const seen: string[] = []
  for (const s of list) for (const symbol of atomCounts(s.formula).keys()) if (!seen.includes(symbol)) seen.push(symbol)
  return seen
}

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b))

// Koeffizienten als kleinste ganze Zahlen, alle positiv; null, wenn es keine oder keine eindeutige
// Lösung gibt (Lösungsraum nicht eindimensional) oder ein Koeffizient nicht positiv wäre
export function balance(reactants: readonly Species[], products: readonly Species[]): Equation | null {
  const all = [...reactants, ...products]
  const symbols = elementsOf(all)
  // Matrix: Zeile je Element, Spalte je Stoff; Edukte positiv, Produkte negativ
  const rows: Rational[][] = symbols.map((symbol) =>
    all.map((s, j) => {
      const n = rat(atomCounts(s.formula).get(symbol) ?? 0)
      return j < reactants.length ? n : ratNeg(n)
    }),
  )
  const columns = all.length
  // reduzierte Stufenform
  const pivots: number[] = []
  let row = 0
  for (let col = 0; col < columns && row < rows.length; col++) {
    const found = rows.findIndex((r, i) => i >= row && !isZero(r[col]))
    if (found === -1) continue
    ;[rows[row], rows[found]] = [rows[found], rows[row]]
    const pivot = rows[row][col]
    rows[row] = rows[row].map((x) => ratDiv(x, pivot))
    for (let i = 0; i < rows.length; i++) {
      if (i === row || isZero(rows[i][col])) continue
      const factor = rows[i][col]
      rows[i] = rows[i].map((x, k) => ratSub(x, ratMul(factor, rows[row][k])))
    }
    pivots.push(col)
    row++
  }
  const free = [...Array(columns).keys()].filter((c) => !pivots.includes(c))
  if (free.length !== 1) return null
  // freie Variable = 1, die übrigen aus den Zeilen
  const solution: Rational[] = Array.from({ length: columns }, () => ZERO)
  solution[free[0]] = ONE
  pivots.forEach((col, i) => {
    solution[col] = ratNeg(rows[i][free[0]])
  })
  // die freie Variable ist 1: Ein Stoff mit Koeffizient 0 oder negativ hieße, er gehört nicht dazu bzw.
  // auf die andere Seite
  if (solution.some((x) => ratSign(x) <= 0)) return null
  // auf kleinste ganze Zahlen bringen
  const lcmDen = solution.reduce((l, x) => (l * x.d) / gcd(l, x.d), 1n)
  const ints = solution.map((x) => (x.n * lcmDen) / x.d)
  const g = ints.reduce((a, b) => gcd(a, b))
  const coefficients = ints.map((n) => rat(n / g))
  return {
    reactants: reactants.map((s, i) => ({ species: s, coefficient: coefficients[i] })),
    products: products.map((s, i) => ({ species: s, coefficient: coefficients[reactants.length + i] })),
  }
}

// Gleichung mit anderen Koeffizienten (gleiche Stoffe)
export function withCoefficients(eq: Equation, coefficients: readonly Rational[]): Equation {
  const r = eq.reactants.length
  return {
    reactants: eq.reactants.map((t, i) => ({ ...t, coefficient: coefficients[i] })),
    products: eq.products.map((t, i) => ({ ...t, coefficient: coefficients[r + i] })),
  }
}

export const coefficientsOf = (eq: Equation): Rational[] => [...eq.reactants, ...eq.products].map((t) => t.coefficient)

// Koeffizient für mhchem: 1 weggelassen, Brüche als a/b
export const coefficientCe = (c: Rational) => (ratEq(c, ONE) ? '' : c.d === 1n ? `${c.n} ` : `${c.n}/${c.d} `)

const sideCe = (side: Side) => side.map((t) => `${coefficientCe(t.coefficient)}${formulaCe(t.species.formula)}`).join(' + ')

// Inhalt für \ce{…}: „2 H2 + O2 -> 2 H2O"
export const equationCe = (eq: Equation) => `${sideCe(eq.reactants)} -> ${sideCe(eq.products)}`
export const equationLatex = (eq: Equation) => String.raw`\ce{${equationCe(eq)}}`
// Teil einer Seite, z. B. „3 CO2 + 4 H2O"
export const termsLatex = (side: Side) => String.raw`\ce{${sideCe(side)}}`

// Gleichung ohne Koeffizienten (alle 1), wie sie vor dem Ausgleichen dasteht
export const skeleton = (reactants: readonly Species[], products: readonly Species[]): Equation => ({
  reactants: reactants.map((s) => ({ species: s, coefficient: ONE })),
  products: products.map((s) => ({ species: s, coefficient: ONE })),
})

// Sind zwei Gleichungen gleich (gleiche Stoffe, gleiche Koeffizienten)?
export const sameEquation = (a: Equation, b: Equation) => equationCe(a) === equationCe(b)
