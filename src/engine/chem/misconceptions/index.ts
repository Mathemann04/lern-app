import type { MisconceptionName } from '../../quiz/types.ts'
import { ATOMBAU_MISCONCEPTIONS } from './atombau.ts'
import { GLEICHUNGEN_MISCONCEPTIONS } from './gleichungen.ts'
import { IONEN_MISCONCEPTIONS } from './ionen.ts'
import { LOESUNGEN_MISCONCEPTIONS } from './loesungen.ts'
import { MOLEKUELE_MISCONCEPTIONS } from './molekuele.ts'
import { ZMK_MISCONCEPTIONS } from './zmk.ts'
import { METALLE_MISCONCEPTIONS } from './metalle.ts'
import { ELEKTRONEN_MISCONCEPTIONS } from './elektronen.ts'
import { STOFFMENGE_MISCONCEPTIONS } from './stoffmenge.ts'

// Denkfehler je Chemie-Thema (Id aus ui/catalog.ts), nur Name und falsche Aussage. Eigene kleine Liste,
// damit die Fehlerstatistik (errorCatalog.ts) sie kennt, ohne Fragen und Erklärungen zu laden (die stehen
// in <thema>Why.ts und kommen in chem/banks.ts dazu). Ein neues Thema braucht hier und in chem/banks.ts je
// eine Zeile.
export const MISCONCEPTIONS_BY_COURSE: Readonly<Record<string, readonly MisconceptionName[]>> = {
  'chem-atombau': ATOMBAU_MISCONCEPTIONS,
  'chem-stoffmenge': STOFFMENGE_MISCONCEPTIONS,
  'chem-gleichungen': GLEICHUNGEN_MISCONCEPTIONS,
  'chem-loesungen': LOESUNGEN_MISCONCEPTIONS,
  'chem-ionen': IONEN_MISCONCEPTIONS,
  'chem-molekuele': MOLEKUELE_MISCONCEPTIONS,
  'chem-zmk': ZMK_MISCONCEPTIONS,
  'chem-metalle': METALLE_MISCONCEPTIONS,
  'chem-elektronen': ELEKTRONEN_MISCONCEPTIONS,
}
