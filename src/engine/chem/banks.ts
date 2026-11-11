import type { Explanation, Misconception, QuestionBank } from '../quiz/types.ts'
import { ATOMBAU_BANK } from './bank/atombau.ts'
import { GLEICHUNGEN_BANK } from './bank/gleichungen.ts'
import { IONEN_BANK } from './bank/ionen.ts'
import { LOESUNGEN_BANK } from './bank/loesungen.ts'
import { MOLEKUELE_BANK } from './bank/molekuele.ts'
import { ZMK_BANK } from './bank/zmk.ts'
import { METALLE_BANK } from './bank/metalle.ts'
import { ELEKTRONEN_BANK } from './bank/elektronen.ts'
import { PSE_BANK } from './bank/pse.ts'
import { TRENDS_BANK } from './bank/trends.ts'
import { STOFFMENGE_BANK } from './bank/stoffmenge.ts'
import { ATOMBAU_WHY } from './misconceptions/atombauWhy.ts'
import { GLEICHUNGEN_WHY } from './misconceptions/gleichungenWhy.ts'
import { IONEN_WHY } from './misconceptions/ionenWhy.ts'
import { LOESUNGEN_WHY } from './misconceptions/loesungenWhy.ts'
import { MOLEKUELE_WHY } from './misconceptions/molekueleWhy.ts'
import { ZMK_WHY } from './misconceptions/zmkWhy.ts'
import { METALLE_WHY } from './misconceptions/metalleWhy.ts'
import { ELEKTRONEN_WHY } from './misconceptions/elektronenWhy.ts'
import { PSE_WHY } from './misconceptions/pseWhy.ts'
import { TRENDS_WHY } from './misconceptions/trendsWhy.ts'
import { STOFFMENGE_WHY } from './misconceptions/stoffmengeWhy.ts'
import { MISCONCEPTIONS_BY_COURSE } from './misconceptions/index.ts'

// Fragensammlungen der Chemie-Themen mit den Erklärungen ihrer Denkfehler. Ein neues Thema braucht hier
// eine Zeile (und eine in misconceptions/index.ts für Name und falsche Aussage seiner Denkfehler).
const BANKS: readonly { readonly bank: QuestionBank; readonly why: Readonly<Record<string, Explanation>> }[] = [
  { bank: ATOMBAU_BANK, why: ATOMBAU_WHY },
  { bank: STOFFMENGE_BANK, why: STOFFMENGE_WHY },
  { bank: GLEICHUNGEN_BANK, why: GLEICHUNGEN_WHY },
  { bank: LOESUNGEN_BANK, why: LOESUNGEN_WHY },
  { bank: IONEN_BANK, why: IONEN_WHY },
  { bank: MOLEKUELE_BANK, why: MOLEKUELE_WHY },
  { bank: ZMK_BANK, why: ZMK_WHY },
  { bank: METALLE_BANK, why: METALLE_WHY },
  { bank: ELEKTRONEN_BANK, why: ELEKTRONEN_WHY },
  { bank: PSE_BANK, why: PSE_WHY },
  { bank: TRENDS_BANK, why: TRENDS_WHY },
]

export type ChemTopic = { readonly bank: QuestionBank; readonly misconceptions: readonly Misconception[] }

export const CHEM_TOPICS: readonly ChemTopic[] = BANKS.map(({ bank, why }) => ({
  bank,
  misconceptions: (MISCONCEPTIONS_BY_COURSE[bank.course] ?? []).map((m) => ({ ...m, why: why[m.id] ?? { detailed: '', short: '' } })),
}))

// Sammlung und Denkfehler eines Themas; undefined, wenn es (noch) keine Fragen hat
export function chemTopic(course: string): ChemTopic | undefined {
  return CHEM_TOPICS.find((topic) => topic.bank.course === course)
}
