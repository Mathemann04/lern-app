import type { MockExam } from '../../exam/mock.ts'
import { createRng } from '../../random/rng.ts'
import { chemExamTask } from './index.ts'

// Probeklausur Chemie 1, Teil 1 (Plan M4, „Probeklausur", Bauplan Teil 1): die Klausuraufgaben 1 bis 5 mit
// zusammen 50 Punkten in 45 Minuten. Die Klausur hat zwei Teile mit je 50 Punkten; bestanden ist sie mit zusammen
// 40 von 100 Punkten. Teil 2 (Säure-Base und Redox) folgt mit N4.
export const CHEM_MOCK = { minutes: 45, tasks: [1, 2, 3, 4, 5], points: 50, passTotal: 40, total: 100 } as const

// größte Nummer einer Probeklausur
export const MOCK_ID_MAX = 99_999

export function chemMockExam(id: number): MockExam {
  const rng = createRng(`probeklausur:${id}`)
  const tasks = CHEM_MOCK.tasks.map((no) => {
    const seed = rng.int(1, 999_999)
    return { no, seed, task: chemExamTask(no, seed)! }
  })
  return { id, minutes: CHEM_MOCK.minutes, tasks }
}
