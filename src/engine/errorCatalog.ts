import { CHEM_ERROR_RULES } from './chem/errorRules.ts'
import { MISCONCEPTIONS_BY_COURSE } from './chem/misconceptions/index.ts'
import { ERROR_RULES } from './derive/errorRules.ts'
import { FRACTION_ERROR_RULES } from './fraction/errorRules.ts'
import { REARRANGE_ERROR_RULES } from './rearrange/errorRules.ts'
import { VECTOR_ERROR_RULES } from './linalg/errorRules.ts'
import { LINE_ERROR_RULES } from './linalg/lineErrorRules.ts'
import { MATRIX_ERROR_RULES } from './linalg/matrixErrorRules.ts'
import { DET_ERROR_RULES } from './linalg/detErrorRules.ts'
import { GAUSS_ERROR_RULES } from './linalg/gaussErrorRules.ts'

// Typische Fehler aller Themen, mit Namen und Beispiel (für Fortschritt, Lernkarten und gezieltes
// Üben). Die Ids sind über alle Themen eindeutig (Brüche mit der Vorsilbe „frac-", Umstellen mit
// „eq-", Denkfehler bei Wissensfragen mit „chem-mis-", Rechenfehler in Chemie mit „chem-"). Beim Umstellen kommen die Fehler beim
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
  vektoren: VECTOR_ERROR_RULES.map(({ id, name, wrongFormula }) => ({ id, name, wrongFormula })),
  // Geraden und Ebenen (M7 Schritt 6): eigene Fehler und die aus „Vektoren“, die dort mitrechnen (Verbindungsvektor, Kreuzprodukt, Länge)
  geraden: [...LINE_ERROR_RULES, ...VECTOR_ERROR_RULES].map(({ id, name, wrongFormula }) => ({ id, name, wrongFormula })),
  // Matrizen und Gleichungssysteme (M7 Schritt 8a): eigene Fehler mit Vorsilbe „mat-“, seit Schritt 9a die Determinanten mit „det-“, seit 10a Gauß mit „gauss-“
  matrizen: [...MATRIX_ERROR_RULES, ...DET_ERROR_RULES, ...GAUSS_ERROR_RULES].map(({ id, name, wrongFormula }) => ({ id, name, wrongFormula })),
  umstellen: [...REARRANGE_ERROR_RULES, ...FRACTION_ERROR_RULES.filter((r) => r.step === 'combine' || r.step === 'expand')],
  // Chemie: Denkfehler der Wissensfragen (als Aussage) und Rechenfehler (als Formel)
  ...Object.fromEntries(
    Object.entries(MISCONCEPTIONS_BY_COURSE).map(([course, list]) => [
      course,
      [
        ...list.map(({ id, name, wrongText }) => ({ id, name, wrongText })),
        ...CHEM_ERROR_RULES.filter((r) => r.course === course).map(({ id, name, wrongFormula }) => ({ id, name, wrongFormula })),
      ],
    ]),
  ),
}

const ALL = Object.values(ERRORS_BY_COURSE).flat()

export function findError(id: string): NamedError | undefined {
  return ALL.find((e) => e.id === id)
}

export const isErrorOf = (course: string, id: string) => ERRORS_BY_COURSE[course]?.some((e) => e.id === id) ?? false
