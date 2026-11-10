import type { Misconception, QuestionBank } from '../quiz/types.ts'
import { ATOMBAU_BANK } from './bank/atombau.ts'
import { MISCONCEPTIONS_BY_COURSE } from './misconceptions/index.ts'

// Fragensammlungen der Chemie-Themen. Ein neues Thema braucht hier eine Zeile (und eine in
// misconceptions/index.ts für seine Denkfehler).
const BANKS: readonly QuestionBank[] = [ATOMBAU_BANK]

export type ChemTopic = { readonly bank: QuestionBank; readonly misconceptions: readonly Misconception[] }

export const CHEM_TOPICS: readonly ChemTopic[] = BANKS.map((bank) => ({ bank, misconceptions: MISCONCEPTIONS_BY_COURSE[bank.course] ?? [] }))

// Sammlung und Denkfehler eines Themas; undefined, wenn es (noch) keine Fragen hat
export function chemTopic(course: string): ChemTopic | undefined {
  return CHEM_TOPICS.find((topic) => topic.bank.course === course)
}
