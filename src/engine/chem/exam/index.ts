import type { Explanation } from '../../explain/texts.ts'
import type { ExamTask } from '../../exam/types.ts'
import { CHEM_ERROR_RULES } from '../errorRules.ts'
import { buildTask3 } from './task3.ts'
import { buildTask4 } from './task4.ts'

// Klausuraufgaben der Chemie zum Üben (#/klausur/chemie/aufgabe/<N>); die Nummern stehen im Katalog
// (ui/catalog.ts, exam am Gebiet)
const TASKS: Readonly<Record<number, (seed: number) => ExamTask>> = { 3: buildTask3, 4: buildTask4 }

export const chemExamTask = (task: number, seed: number): ExamTask | null => TASKS[task]?.(seed) ?? null

// Name und „Warum ist das falsch?" eines Rechenfehlers für die Auswertung
export function chemErrorInfo(id: string): { name: string; why: Explanation } | null {
  const rule = CHEM_ERROR_RULES.find((r) => r.id === id)
  return rule ? { name: rule.name, why: rule.why } : null
}
