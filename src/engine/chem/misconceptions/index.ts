import type { Misconception } from '../../quiz/types.ts'
import { ATOMBAU_MISCONCEPTIONS } from './atombau.ts'

// Denkfehler je Chemie-Thema (Id aus ui/catalog.ts). Eigene kleine Liste, damit die Fehlerstatistik
// (errorCatalog.ts) sie kennt, ohne die Fragensammlungen zu laden. Ein neues Thema braucht hier und in
// chem/banks.ts je eine Zeile.
export const MISCONCEPTIONS_BY_COURSE: Readonly<Record<string, readonly Misconception[]>> = {
  'chem-atombau': ATOMBAU_MISCONCEPTIONS,
}
