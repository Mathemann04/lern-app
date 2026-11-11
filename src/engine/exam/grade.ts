import type { ExamAnswers, ExamItem, ExamItemBuild, ExamOption, ExamPart, ExamTask } from './types.ts'

// Ablauf und Bewertung einer Klausuraufgabe (Plan M4, „Bewertung"):
// - Eine Frage ist dran, sobald alle Fragen beantwortet sind, von denen sie abhängt.
// - Richtig ist die erwartete Antwort mit den eigenen früheren Antworten (Folgefehler) oder die ganz
//   richtige Antwort; beides gibt die vollen Punkte der Frage. Manche Antworten geben einen Teil der Punkte.
// - Ist das Ergebnis eines Teils (final) richtig, gibt es die vollen Punkte des Teils; sonst zählen die
//   Punkte der richtigen Zwischenschritte (Teilpunkte).

export const itemsOf = (task: ExamTask): ExamItem[] => task.parts.flatMap((p) => p.items)
export const totalPoints = (task: ExamTask) => task.parts.reduce((sum, p) => sum + p.points, 0)

export type ItemState = {
  readonly item: ExamItem
  // null: Fragen davor sind noch offen
  readonly build: ExamItemBuild | null
  readonly chosen: ExamOption | null
}

// Lösungsweg mit lauter richtigen Antworten
export function truthOf(task: ExamTask): Map<string, { build: ExamItemBuild; option: ExamOption }> {
  const result = new Map<string, { build: ExamItemBuild; option: ExamOption }>()
  const truth = (id: string) => {
    const found = result.get(id)
    if (!found) throw new Error(`Frage ${id} steht nicht vor der Frage, die sie braucht`)
    return found.option
  }
  for (const item of itemsOf(task)) {
    const build = item.build(truth, truth)
    const option = build.options.find((o) => o.id === build.correct)
    if (!option) throw new Error(`Frage ${item.id}: die richtige Antwort fehlt`)
    result.set(item.id, { build, option })
  }
  return result
}

// Stand jeder Frage mit diesen Antworten
export function examState(task: ExamTask, answers: ExamAnswers): ItemState[] {
  const truthMap = truthOf(task)
  const truth = (id: string) => truthMap.get(id)!.option
  const chosenOf = new Map<string, ExamOption>()
  const chosen = (id: string) => {
    const found = chosenOf.get(id)
    if (!found) throw new Error(`Frage ${id} ist noch offen`)
    return found
  }
  return itemsOf(task).map((item) => {
    if (!item.dependsOn.every((id) => chosenOf.has(id))) return { item, build: null, chosen: null }
    const build = item.build(chosen, truth)
    const option = build.options.find((o) => o.id === answers[item.id]) ?? null
    if (option) chosenOf.set(item.id, option)
    return { item, build, chosen: option }
  })
}

// Neue Antwort; Antworten, die (auch über Umwege) davon abhängen, werden gelöscht, weil sich ihre
// Auswahl ändern kann
export function withAnswer(task: ExamTask, answers: ExamAnswers, itemId: string, optionId: string): ExamAnswers {
  if (answers[itemId] === optionId) return answers
  const cleared = new Set([itemId])
  for (const item of itemsOf(task)) if (item.dependsOn.some((id) => cleared.has(id))) cleared.add(item.id)
  const next: Record<string, string> = {}
  for (const [id, value] of Object.entries(answers)) if (!cleared.has(id)) next[id] = value
  next[itemId] = optionId
  return next
}

export type ItemStatus = 'richtig' | 'folgefehler' | 'teilweise' | 'falsch' | 'offen'

export type ItemResult = {
  readonly item: ExamItem
  readonly chosen: ExamOption | null
  readonly status: ItemStatus
  readonly points: number
  // richtige Antwort und Lösungsweg mit lauter richtigen Antworten
  readonly correct: ExamOption
  readonly explanation: ExamItemBuild['explanation']
  // Lösungsweg mit den eigenen früheren Antworten (bei Folgefehlern)
  readonly ownExplanation: ExamItemBuild['explanation'] | null
}

export type PartResult = { readonly part: ExamPart; readonly points: number; readonly items: readonly ItemResult[] }
export type ExamResult = { readonly points: number; readonly max: number; readonly parts: readonly PartResult[] }

export function gradeExam(task: ExamTask, answers: ExamAnswers): ExamResult {
  const truthMap = truthOf(task)
  const states = new Map(examState(task, answers).map((s) => [s.item.id, s]))
  const parts = task.parts.map((part): PartResult => {
    const items = part.items.map((item): ItemResult => {
      const { build, chosen } = states.get(item.id)!
      const truth = truthMap.get(item.id)!
      const base = { item, chosen, correct: truth.option, explanation: truth.build.explanation }
      if (!build || !chosen) return { ...base, status: 'offen', points: 0, ownExplanation: null }
      if (chosen.id === build.correct) return { ...base, status: 'richtig', points: item.points, ownExplanation: null }
      if (chosen.id === build.expected) return { ...base, status: 'folgefehler', points: item.points, ownExplanation: build.explanation }
      if (chosen.share) return { ...base, status: 'teilweise', points: item.points * chosen.share.value, ownExplanation: null }
      return { ...base, status: 'falsch', points: 0, ownExplanation: build.expected === build.correct ? null : build.explanation }
    })
    const finalFull = items.some((r) => r.item.final && r.points === r.item.points && r.points > 0)
    const sum = items.reduce((s, r) => s + r.points, 0)
    return { part, points: finalFull ? part.points : Math.min(part.points, sum), items }
  })
  return { points: parts.reduce((s, p) => s + p.points, 0), max: totalPoints(task), parts }
}
