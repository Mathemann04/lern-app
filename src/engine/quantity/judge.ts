import type { Explanation } from '../explain/texts.ts'
import { type Rational, ratAbs, ratDiv, ratEq, ratSign, ratSub, ratToNumber } from '../rational.ts'

// Urteil über eine eingegebene Zahl im freien Modus (docs/CHEMIE.md §7), allgemein (Chemie, später
// Werkstoffkunde und Physik). Reihenfolge: richtig (höchstens 1 % daneben), typischer Fehler (höchstens 1 %
// neben seinem Wert), fast (1 bis 4 % daneben: „Prüfe deine Rundung", zählt nicht als Fehler), sonst falsch.
// Genaue Werte (Teilchenzahlen, Ladungen, Koeffizienten) müssen genau stimmen, ein „fast" gibt es dort nicht.

export const TOLERANCE = 0.01
export const CLOSE = 0.04

export type NumericAnswer = {
  // genauer Wert (mit den Werten der Aufgabe gerechnet)
  readonly value: Rational
  // Einheit als LaTeX hinter dem Feld, z. B. „\mathrm{g/mol}"; leer ohne Einheit
  readonly unit: string
  // genau stimmen (ganze Zahlen wie Protonen oder Ladung) statt Toleranz
  readonly exact?: boolean
  // Werte typischer Fehler (bei Toleranz schon mindestens 6 % neben der Lösung und 3 % auseinander), mit
  // „Warum ist das falsch?"
  readonly wrongs: readonly { readonly rule: string; readonly value: Rational; readonly why?: Explanation }[]
  // kurzer Hinweis unter dem Feld (Text mit Formeln), z. B. „Ladung als Zahl mit Vorzeichen"
  readonly note?: string
  // ebenfalls richtig, z. B. mit dem gerundeten Zwischenergebnis weitergerechnet (e hoch ln K)
  readonly also?: readonly Rational[]
}

export type Verdict =
  | { readonly kind: 'correct' }
  | { readonly kind: 'error'; readonly rule: string }
  | { readonly kind: 'close' }
  | { readonly kind: 'wrong' }

// relativer Abstand |a − b| / |b|; b = 0: 0 nur bei a = 0, sonst unendlich
function distance(a: Rational, b: Rational): number {
  if (ratSign(b) === 0) return ratSign(a) === 0 ? 0 : Infinity
  return ratToNumber(ratAbs(ratDiv(ratSub(a, b), b)))
}

const near = (input: Rational, target: Rational, exact: boolean | undefined, share: number) => (exact ? ratEq(input, target) : distance(input, target) <= share + 1e-12)

export function judgeNumber(input: Rational, answer: NumericAnswer): Verdict {
  if ([answer.value, ...(answer.also ?? [])].some((v) => near(input, v, answer.exact, TOLERANCE))) return { kind: 'correct' }
  // liegen zwei Fehlerwerte nah beieinander, gewinnt der nächste (bei gleichem Abstand der erste)
  const errors = answer.wrongs.filter((w) => near(input, w.value, answer.exact, TOLERANCE))
  const error = errors.reduce<(typeof errors)[number] | undefined>((best, w) => (!best || distance(input, w.value) < distance(input, best.value) ? w : best), undefined)
  if (error) return { kind: 'error', rule: error.rule }
  if (!answer.exact && near(input, answer.value, false, CLOSE)) return { kind: 'close' }
  return { kind: 'wrong' }
}
