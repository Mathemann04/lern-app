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

// --- Stoffe wechseln (Plan M4: was in den letzten drei Probeklausuren vorkam, wird gemieden) ---

// Stoffe, die zu jeder Verbrennung gehören (Aufgabe 4), zählen nicht
const COMMON = new Set(['O2', 'CO2', 'H2O'])

// ein Teilchen aus \ce{…}: ohne Kernsymbol-Zahlen, Ladung, Zustand und Koeffizient
function speciesKey(text: string): string {
  return text
    .replace(/^\^\{\d+\}_\{\d+\}/, '')
    .replace(/\((?:g|l|s|aq)\)$/, '')
    .replace(/\^.*$/, '')
    .replace(/[+-]$/, '')
    .replace(/^\d+(?:\/\d+)?\s*/, '')
    .trim()
}

// Verbindung (mindestens zwei Atome), kein einzelnes Element: einzelne Elemente kommen in vielen Fragen nebenbei vor
const isCompound = (key: string) => /\d|[A-Z][a-z]?.*[A-Z]/.test(key)

// Stoffe einer Klausur: alle Verbindungen in Formeln $\ce{…}$ der Aufgabentexte und Fragen (nicht der Antworten),
// Reaktionen in ihre Teilchen zerlegt, dazu die Elemente, um die sich ein Teil dreht („Element: …"), das Salz und die
// Lichtquelle (beide nur als Wort genannt)
export function mockSubstances(exam: MockExam): string[] {
  const texts = exam.tasks.flatMap((t) => [t.task.intro, t.task.givenLatex, ...t.task.parts.flatMap((p) => [p.prompt, ...p.items.map((i) => i.question)])])
  const keys = new Set<string>()
  for (const text of texts) {
    for (const [, ce] of text.matchAll(/\\ce\{((?:[^{}]|\{[^{}]*\})*)\}/g)) {
      for (const part of ce.split(/\s*(?:->|<=>|\s\+\s)\s*/)) {
        const key = speciesKey(part)
        if (key && isCompound(key) && !COMMON.has(key)) keys.add(key)
      }
    }
    for (const [, name] of text.matchAll(/Element: ([^ (,.]+)/g)) keys.add(name)
    for (const [, name] of text.matchAll(/Es handelt sich um ([^.]+)\./g)) keys.add(name)
    for (const [, name] of text.matchAll(/Gegeben: ([^.$]+)\./g)) keys.add(name)
  }
  return [...keys].sort()
}

// Neue Nummer: unter einigen zufälligen die mit den wenigsten Stoffen aus den letzten Probeklausuren (recent: Nummern,
// die neueste zuerst; nur die ersten drei zählen)
export function pickMockId(recent: readonly number[], random: () => number = Math.random, candidates = 40): number {
  const used = new Set(recent.slice(0, 3).flatMap((id) => mockSubstances(chemMockExam(id))))
  let best = { id: 1 + Math.floor(random() * MOCK_ID_MAX), overlap: Infinity }
  for (let i = 0; i < candidates && best.overlap > 0; i++) {
    const id = 1 + Math.floor(random() * MOCK_ID_MAX)
    if (recent.includes(id)) continue
    const overlap = mockSubstances(chemMockExam(id)).filter((s) => used.has(s)).length
    if (overlap < best.overlap) best = { id, overlap }
  }
  return best.id
}
