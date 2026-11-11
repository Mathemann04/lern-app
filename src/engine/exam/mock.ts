import { type ExamResult, examState, gradeExam, totalPoints } from './grade.ts'
import type { ExamAnswers, ExamTask } from './types.ts'

// Probeklausur (Plan M4, „Probeklausur", S9): mehrere Klausuraufgaben am Stück, mit Uhr. Jede Aufgabe wird für
// sich bewertet (Folgefehler innerhalb einer Aufgabe wie beim Üben, grade.ts); die Punkte werden addiert.

export type MockTask = {
  // Nummer der Aufgabe in der Klausur (1 bis 5)
  readonly no: number
  // Nummer, aus der die Aufgabe entsteht (wie bei „Klausuraufgabe N üben")
  readonly seed: number
  readonly task: ExamTask
}

export type MockExam = {
  // Nummer der Probeklausur: dieselbe Nummer ergibt dieselben Aufgaben
  readonly id: number
  readonly minutes: number
  readonly tasks: readonly MockTask[]
}

// Antworten je Aufgabe (Schlüssel: Nummer der Aufgabe als Text)
export type MockAnswers = Readonly<Record<string, ExamAnswers>>

export type MockTaskResult = { readonly task: MockTask; readonly result: ExamResult }
export type MockResult = { readonly points: number; readonly max: number; readonly tasks: readonly MockTaskResult[] }

export const answersOf = (answers: MockAnswers, task: MockTask): ExamAnswers => answers[String(task.no)] ?? {}

export const mockMax = (exam: MockExam) => exam.tasks.reduce((sum, t) => sum + totalPoints(t.task), 0)

// offene Fragen je Aufgabe (auch die, die erst nach anderen drankommen)
export const openCountOf = (task: MockTask, answers: MockAnswers) => examState(task.task, answersOf(answers, task)).filter((s) => !s.chosen).length

// Eine eingetippte Zahl knapp daneben (1 bis 4 %) gibt in der Probeklausur nur die halben Punkte, mit Hinweis: In der
// Klausur kostet ungenaues Runden oft Punkte, und beim Üben (volle Punkte) soll der Hinweis nur aufmerksam machen
export const MOCK_CLOSE_SHARE = 0.5

export function gradeMock(exam: MockExam, answers: MockAnswers): MockResult {
  const tasks = exam.tasks.map((task) => ({ task, result: gradeExam(task.task, answersOf(answers, task), { closeShare: MOCK_CLOSE_SHARE }) }))
  return { points: tasks.reduce((sum, t) => sum + t.result.points, 0), max: mockMax(exam), tasks }
}

// verbleibende Zeit in Millisekunden (nie unter null); die Uhr läuft ab dem Start weiter, auch wenn die App zu ist
export const remainingMs = (startedAt: number, minutes: number, now: number) => Math.max(0, startedAt + minutes * 60_000 - now)

// Punkte, die im anderen Teil der Klausur noch zum Bestehen fehlen (nie unter null)
export const missingToPass = (points: number, passTotal: number) => Math.max(0, passTotal - points)

// „Das solltest du üben" (S9b): verlorene Punkte je Thema, die meisten zuerst. Das Thema einer Frage kommt von ihrer
// ersten Lernkarte (courseOfCard). Gibt das Ergebnis eines Teils die vollen Punkte, zählt dort nichts als verloren;
// sonst werden die verlorenen Punkte des Teils auf seine Fragen verteilt, so wie diese Punkte verloren haben.
export type PracticeHint = { readonly course: string; readonly lost: number }

export function practiceHints(result: MockResult, courseOfCard: (cardId: string) => string | undefined, limit = 3): PracticeHint[] {
  const lost = new Map<string, number>()
  for (const { result: task } of result.tasks) {
    for (const part of task.parts) {
      const partLost = part.part.points - part.points
      const items = part.items.map((r) => ({ r, lost: r.item.points - r.points })).filter((x) => x.lost > 0)
      const sum = items.reduce((s, x) => s + x.lost, 0)
      if (partLost <= 0 || sum === 0) continue
      for (const { r, lost: itemLost } of items) {
        const course = r.item.cards.map(courseOfCard).find((c) => c !== undefined)
        if (course) lost.set(course, (lost.get(course) ?? 0) + (itemLost * partLost) / sum)
      }
    }
  }
  return [...lost]
    .map(([course, points]) => ({ course, lost: Math.round(points * 2) / 2 }))
    .filter((h) => h.lost > 0)
    .sort((a, b) => b.lost - a.lost || a.course.localeCompare(b.course))
    .slice(0, limit)
}
