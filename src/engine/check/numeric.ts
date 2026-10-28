import { type Env, evaluate } from '../expr/evaluate.ts'
import type { Expr } from '../expr/types.ts'

// Numerische Vergleiche an Prüfstellen. Unabhängig von der symbolischen Rechnung.

const RELATIVE_TOLERANCE = 1e-7
// Nur Stellen mit aussagekräftigen Werten zählen: Bei winzigen Werten (e^(5x) für x = −10
// ist etwa 10^(−22)) oder riesigen Werten sagt ein Vergleich nichts aus.
const SMALLEST_INFORMATIVE = 1e-6
const LARGEST_INFORMATIVE = 1e12

export type Comparison = { readonly compared: number; readonly differing: number }

// Vergleicht `candidate` mit `reference` an allen Stellen, an denen `reference` einen
// aussagekräftigen Wert hat. Nicht definiert zählt als verschieden.
export function compareValues(reference: Expr, candidate: Expr, points: readonly Env[]): Comparison {
  let compared = 0
  let differing = 0
  for (const point of points) {
    const a = evaluate(reference, point)
    const size = Math.abs(a)
    if (Number.isNaN(a) || size < SMALLEST_INFORMATIVE || size > LARGEST_INFORMATIVE) continue
    compared++
    const b = evaluate(candidate, point)
    if (Number.isNaN(b) || Math.abs(a - b) > RELATIVE_TOLERANCE * Math.max(size, Math.abs(b))) differing++
  }
  return { compared, differing }
}

// Mindestzahl verglichener Stellen, damit ein Urteil zählt
const MIN_COMPARED = 8

// Deutlich verschieden: an mindestens der Hälfte der aussagekräftigen Stellen verschieden.
// Bei zu wenigen Vergleichsstellen lieber „nicht sicher verschieden".
export function clearlyDifferent(reference: Expr, candidate: Expr, points: readonly Env[]): boolean {
  const { compared, differing } = compareValues(reference, candidate, points)
  return compared >= MIN_COMPARED && differing >= compared / 2
}

// Ableitung durch Zahlen genähert (zentraler Differenzenquotient mit Richardson-Verbesserung,
// mit zwei Schrittweiten gegengeprüft). Unabhängige Gegenprobe für die Engine.
// null an unruhigen Stellen (z. B. nahe einer Polstelle), wo die Näherung unzuverlässig ist.
export function numericDerivative(f: Expr, at: number, variable = 'x'): number | null {
  const value = (t: number) => evaluate(f, { [variable]: t })
  const richardson = (h: number) => {
    const quotient = (step: number) => (value(at + step) - value(at - step)) / (2 * step)
    return (4 * quotient(h / 2) - quotient(h)) / 3
  }
  const h = 1e-4 * Math.sqrt(Math.max(1, Math.abs(at)))
  const coarse = richardson(h)
  const fine = richardson(h / 4)
  if (!Number.isFinite(coarse) || !Number.isFinite(fine)) return null
  if (Math.abs(coarse - fine) > 1e-7 * Math.max(1, Math.abs(fine))) return null
  return fine
}
