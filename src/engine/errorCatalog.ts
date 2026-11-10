import { MISCONCEPTIONS_BY_COURSE } from './chem/misconceptions/index.ts'
import { ERROR_RULES } from './derive/errorRules.ts'
import { FRACTION_ERROR_RULES } from './fraction/errorRules.ts'
import { REARRANGE_ERROR_RULES } from './rearrange/errorRules.ts'

// Typische Fehler aller Themen, mit Namen und Beispiel (für Fortschritt, Lernkarten und gezieltes
// Üben). Die Ids sind über alle Themen eindeutig (Brüche mit der Vorsilbe „frac-", Umstellen mit
// „eq-", Denkfehler bei Wissensfragen mit „chem-mis-"). Beim Umstellen kommen die Fehler beim
// Zusammenfassen zu einem Bruch aus „Brüche" dazu.

export type NamedError = {
  readonly id: string
  // Text mit $…$-Formeln
  readonly name: string
  // der Fehler als Formel (LaTeX) …
  readonly wrongFormula?: string
  // … oder als falsche Aussage (Text mit Formeln), bei Denkfehlern in Wissensfragen
  readonly wrongText?: string
}

// Je Thema (Id aus ui/catalog.ts)
export const ERRORS_BY_COURSE: Readonly<Record<string, readonly NamedError[]>> = {
  ableiten: ERROR_RULES,
  brueche: FRACTION_ERROR_RULES,
  umstellen: [...REARRANGE_ERROR_RULES, ...FRACTION_ERROR_RULES.filter((r) => r.step === 'combine' || r.step === 'expand')],
  ...Object.fromEntries(
    Object.entries(MISCONCEPTIONS_BY_COURSE).map(([course, list]) => [course, list.map(({ id, name, wrongText }) => ({ id, name, wrongText }))]),
  ),
}

const ALL = Object.values(ERRORS_BY_COURSE).flat()

export function findError(id: string): NamedError | undefined {
  return ALL.find((e) => e.id === id)
}

export const isErrorOf = (course: string, id: string) => ERRORS_BY_COURSE[course]?.some((e) => e.id === id) ?? false
