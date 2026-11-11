import { judgeNumber } from '../quantity/judge.ts'
import { formatLatex, readNumber } from '../quantity/numberDe.ts'
import { ratSign } from '../rational.ts'
import type { ExamAnswers, ExamItem, ExamItemBuild, ExamOption, ExamPart, ExamTask } from './types.ts'

// Ablauf und Bewertung einer Klausuraufgabe (Plan M4, „Bewertung"):
// - Eine Frage ist dran, sobald alle Fragen beantwortet sind, von denen sie abhängt.
// - Richtig ist die erwartete Antwort mit den eigenen früheren Antworten (Folgefehler) oder die ganz
//   richtige Antwort; beides gibt die vollen Punkte der Frage. Manche Antworten geben einen Teil der Punkte.
// - Ist das Ergebnis eines Teils (final) richtig, gibt es die vollen Punkte des Teils; sonst zählen die
//   Punkte der richtigen Zwischenschritte (Teilpunkte). Ein Folgefehler im Ergebnis gibt die vollen Punkte
//   des Teils nur, wenn der Fehler aus einem früheren Teil stammt (alle Fragen dieses Teils voll); ein
//   Fehler im selben Teil kostet die Punkte seines Zwischenschritts. Teile ohne final zählen jede Frage für sich.
// - Eine eingetippte Zahl knapp daneben (1 bis 4 %, „fast") gibt beim Üben die vollen Punkte, in der Probeklausur nur
//   den Anteil closeShare (GradeOptions).

export const itemsOf = (task: ExamTask): ExamItem[] => task.parts.flatMap((p) => p.items)
export const totalPoints = (task: ExamTask) => task.parts.reduce((sum, p) => sum + p.points, 0)

export type ItemState = {
  readonly item: ExamItem
  // null: Fragen davor sind noch offen
  readonly build: ExamItemBuild | null
  readonly chosen: ExamOption | null
  // eingetippte Zahl 1 bis 4 % neben der erwarteten: zählt wie richtig, mit Hinweis auf die Rundung
  readonly close?: boolean
}

// --- Eingetippte Zahlen (freier Modus, S8c) ---

export const NUMBER_PREFIX = 'zahl:'
export const numberAnswer = (input: string) => `${NUMBER_PREFIX}${input}`
// eingetippter Text einer Antwort; null bei einer gewählten Antwort
export const typedText = (answer: string | undefined) => (answer?.startsWith(NUMBER_PREFIX) ? answer.slice(NUMBER_PREFIX.length) : null)

// Eingetippte Zahl → Antwort: richtig (bis 1 % neben der erwarteten oder der ganz richtigen Zahl) oder „fast"
// (bis 4 %) ergibt die erwartete bzw. richtige Antwort; sonst eine eigene Antwort mit der Zahl als Wert (spätere
// Fragen rechnen damit weiter), bei einem typischen Fehler mit dessen Id. null: keine Zahl oder keine Zahlenfrage.
export function typedOption(build: ExamItemBuild, answer: string | undefined): { option: ExamOption; close: boolean } | null {
  const text = typedText(answer)
  const numeric = build.numeric
  if (text === null || !numeric) return null
  const value = readNumber(text)
  if (!value) return null
  const byId = (id: string) => build.options.find((o) => o.id === id)!
  if (build.correctValue && build.correct !== build.expected && judgeNumber(value, { ...numeric, value: build.correctValue, also: [] }).kind === 'correct')
    return { option: byId(build.correct), close: false }
  const verdict = judgeNumber(value, numeric)
  if (verdict.kind === 'correct' || verdict.kind === 'close') return { option: byId(build.expected), close: verdict.kind === 'close' }
  const content = `$${formatLatex(value, { significant: 12 })}${numeric.unit ? `\\,${numeric.unit}` : ''}$`
  const error = verdict.kind === 'error' ? numeric.wrongs.find((w) => w.rule === verdict.rule) : undefined
  // mit einer Null ließe sich nicht weiterrechnen (z. B. durch die Molmasse teilen): spätere Fragen rechnen dann mit
  // der erwarteten Zahl weiter
  const carried = ratSign(value) === 0 ? byId(build.expected).value : value
  return { option: { id: answer!, content, value: carried, ...(error ? { errorRuleId: error.rule, ...(error.why ? { why: error.why } : {}) } : {}) }, close: false }
}

// Antwort einer Frage mit diesen Antworten: gewählt oder eingetippt
function chosenOption(build: ExamItemBuild, answer: string | undefined): { option: ExamOption | null; close: boolean } {
  const typed = typedOption(build, answer)
  if (typed) return typed
  return { option: build.options.find((o) => o.id === answer) ?? null, close: false }
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
    const { option, close } = chosenOption(build, answers[item.id])
    if (option) chosenOf.set(item.id, option)
    return { item, build, chosen: option, ...(close ? { close } : {}) }
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
  // eingetippte Zahl knapp daneben (1 bis 4 %): volle Punkte, Hinweis auf die Rundung
  readonly close?: boolean
}

export type PartResult = { readonly part: ExamPart; readonly points: number; readonly items: readonly ItemResult[] }
export type ExamResult = { readonly points: number; readonly max: number; readonly parts: readonly PartResult[] }

export type GradeOptions = {
  // Anteil der Punkte für eine eingetippte Zahl knapp daneben (1 bis 4 %); 1 = volle Punkte (Üben)
  readonly closeShare?: number
}

export function gradeExam(task: ExamTask, answers: ExamAnswers, options: GradeOptions = {}): ExamResult {
  const closeShare = options.closeShare ?? 1
  const truthMap = truthOf(task)
  const states = new Map(examState(task, answers).map((s) => [s.item.id, s]))
  const parts = task.parts.map((part): PartResult => {
    // hit: richtig oder Folgefehler, auch wenn „fast" die Punkte kürzt
    const graded = part.items.map((item): { r: ItemResult; hit: 'richtig' | 'folgefehler' | null; cut: boolean } => {
      const { build, chosen, close } = states.get(item.id)!
      const truth = truthMap.get(item.id)!
      const base = { item, chosen, correct: truth.option, explanation: truth.build.explanation, ...(close ? { close } : {}) }
      if (!build || !chosen) return { r: { ...base, status: 'offen', points: 0, ownExplanation: null }, hit: null, cut: false }
      const hit = chosen.id === build.correct ? 'richtig' : chosen.id === build.expected ? 'folgefehler' : null
      const ownExplanation = hit === 'folgefehler' ? build.explanation : null
      if (hit && close && closeShare < 1) return { r: { ...base, status: 'teilweise', points: item.points * closeShare, ownExplanation }, hit, cut: true }
      if (hit) return { r: { ...base, status: hit, points: item.points, ownExplanation }, hit, cut: false }
      if (chosen.share) return { r: { ...base, status: 'teilweise', points: item.points * chosen.share.value, ownExplanation: null }, hit: null, cut: false }
      return { r: { ...base, status: 'falsch', points: 0, ownExplanation: build.expected === build.correct ? null : build.explanation }, hit: null, cut: false }
    })
    const items = graded.map((g) => g.r)
    const full = (r: ItemResult) => r.points === r.item.points
    const sum = items.reduce((s, r) => s + r.points, 0)
    let points = Math.min(part.points, sum)
    // Ergebnis des Teils richtig: volle Punkte des Teils (knapp daneben in der Probeklausur: der Anteil davon)
    const final = graded.find((g) => g.r.item.final && g.hit && (g.hit === 'richtig' || items.every((r) => r === g.r || full(r))))
    if (final) points = final.cut ? Math.max(points, part.points * closeShare) : part.points
    return { part, points, items }
  })
  return { points: parts.reduce((s, p) => s + p.points, 0), max: totalPoints(task), parts }
}
