import type { MisconceptionName } from '../../quiz/types.ts'
import { ATOMBAU_MISCONCEPTIONS } from './atombau.ts'

// Denkfehler je Chemie-Thema (Id aus ui/catalog.ts), nur Name und falsche Aussage. Eigene kleine Liste,
// damit die Fehlerstatistik (errorCatalog.ts) sie kennt, ohne Fragen und Erklärungen zu laden (die stehen
// in <thema>Why.ts und kommen in chem/banks.ts dazu). Ein neues Thema braucht hier und in chem/banks.ts je
// eine Zeile.
export const MISCONCEPTIONS_BY_COURSE: Readonly<Record<string, readonly MisconceptionName[]>> = {
  'chem-atombau': ATOMBAU_MISCONCEPTIONS,
  // noch ohne Wissensfragen (kommen mit S3b); die Rechenfehler stehen in chem/errorRules.ts
  'chem-stoffmenge': [],
}
