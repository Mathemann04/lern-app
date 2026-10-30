import { ERROR_RULES } from './derive/errorRules.ts'
import { FRACTION_ERROR_RULES } from './fraction/errorRules.ts'

// Typische Fehler aller Themen, mit Namen und Beispiel (für Fortschritt, Lernkarten und gezieltes
// Üben). Die Ids sind über alle Themen eindeutig (Brüche mit der Vorsilbe „frac-").

export type NamedError = {
  readonly id: string
  // Text mit $…$-Formeln
  readonly name: string
  // der Fehler als Formel (LaTeX)
  readonly wrongFormula: string
}

// Je Thema (Id aus ui/catalog.ts)
export const ERRORS_BY_COURSE: Readonly<Record<string, readonly NamedError[]>> = {
  ableiten: ERROR_RULES,
  brueche: FRACTION_ERROR_RULES,
}

const ALL = Object.values(ERRORS_BY_COURSE).flat()

export function findError(id: string): NamedError | undefined {
  return ALL.find((e) => e.id === id)
}

export const isErrorOf = (course: string, id: string) => ERRORS_BY_COURSE[course]?.some((e) => e.id === id) ?? false
