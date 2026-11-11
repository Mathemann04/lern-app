import type { Explanation } from '../../explain/texts.ts'
import type { ExamTask } from '../../exam/types.ts'
import { CHEM_ERROR_RULES } from '../errorRules.ts'
import { MISCONCEPTIONS_BY_COURSE } from '../misconceptions/index.ts'
import { buildTask1 } from './task1.ts'
import { buildTask2 } from './task2.ts'
import { buildTask3 } from './task3.ts'
import { buildTask4 } from './task4.ts'

// Klausuraufgaben der Chemie zum Üben (#/klausur/chemie/aufgabe/<N>); die Nummern stehen im Katalog
// (ui/catalog.ts, exam am Gebiet)
const TASKS: Readonly<Record<number, (seed: number) => ExamTask>> = { 1: buildTask1, 2: buildTask2, 3: buildTask3, 4: buildTask4 }

export const chemExamTask = (task: number, seed: number): ExamTask | null => TASKS[task]?.(seed) ?? null

const MISCONCEPTIONS = Object.values(MISCONCEPTIONS_BY_COURSE).flat()

// Name und „Warum ist das falsch?" eines Rechenfehlers für die Auswertung; bei einem Denkfehler einer
// Wissensfrage nur der Name (die Erklärung steht an der Antwort, ExamOption.why)
export function chemErrorInfo(id: string): { name: string; why?: Explanation } | null {
  const rule = CHEM_ERROR_RULES.find((r) => r.id === id)
  if (rule) return { name: rule.name, why: rule.why }
  const mis = MISCONCEPTIONS.find((m) => m.id === id)
  return mis ? { name: mis.name } : null
}
