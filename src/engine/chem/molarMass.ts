import { type Rational, ZERO, parseDecimal, rat, ratAdd, ratMul } from '../rational.ts'
import { elementBySymbol } from './elements.ts'
import { type CountMode, type Formula, atomCounts } from './formula.ts'

// Molmassen (Plan M4, Teil B „Chemie-Engine", molarMass.ts; Werte nach docs/CHEMIE.md §4), exakt mit
// Brüchen. Zwei Sätze von Werten:
// - „pse": wie im PSE der App, eine Nachkommastelle (Vertiefung)
// - „rounded": wie in der Klausur in der Aufgabe genannt, ganze Zahlen, bei Chlor und Kupfer 35,5 und
//   63,5 (Grundlagen und Klausurniveau)

export type MassValues = 'pse' | 'rounded'

// Halbe Werte, die in Aufgaben üblich sind, statt auf ganze Zahlen zu runden
const HALF: Readonly<Record<string, string>> = { Cl: '35.5', Cu: '63.5' }

export function elementMolarMass(symbol: string, values: MassValues): Rational {
  const el = elementBySymbol(symbol)
  if (!el) throw new Error(`Unbekanntes Element ${symbol}`)
  const text = values === 'rounded' ? (HALF[symbol] ?? String(Math.round(Number(el.molarMass)))) : el.molarMass
  return parseDecimal(text)!
}

// Molmasse einer Formel; mode: so zählen, wie ein typischer Fehler zählt
export function molarMass(formula: Formula, values: MassValues, mode: CountMode = {}): Rational {
  let sum = ZERO
  for (const [symbol, count] of atomCounts(formula, mode)) sum = ratAdd(sum, ratMul(rat(count), elementMolarMass(symbol, values)))
  return sum
}

// „Ordnungszahlen statt Molmassen": Summe der Ordnungszahlen
export function atomicNumberSum(formula: Formula): Rational {
  let sum = 0
  for (const [symbol, count] of atomCounts(formula)) sum += count * elementBySymbol(symbol)!.z
  return rat(sum)
}
