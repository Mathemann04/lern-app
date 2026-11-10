import type { Explanation, Misconception, QuestionBank } from '../quiz/types.ts'
import { ATOMBAU_BANK } from './bank/atombau.ts'
import { STOFFMENGE_BANK } from './bank/stoffmenge.ts'
import { ATOMBAU_WHY } from './misconceptions/atombauWhy.ts'
import { MISCONCEPTIONS_BY_COURSE } from './misconceptions/index.ts'

// Fragensammlungen der Chemie-Themen mit den Erklärungen ihrer Denkfehler. Ein neues Thema braucht hier
// eine Zeile (und eine in misconceptions/index.ts für Name und falsche Aussage seiner Denkfehler).
const BANKS: readonly { readonly bank: QuestionBank; readonly why: Readonly<Record<string, Explanation>> }[] = [
  { bank: ATOMBAU_BANK, why: ATOMBAU_WHY },
  { bank: STOFFMENGE_BANK, why: {} },
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
