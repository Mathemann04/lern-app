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

export function gradeMock(exam: MockExam, answers: MockAnswers): MockResult {
  const tasks = exam.tasks.map((task) => ({ task, result: gradeExam(task.task, answersOf(answers, task)) }))
  return { points: tasks.reduce((sum, t) => sum + t.result.points, 0), max: mockMax(exam), tasks }
}

// verbleibende Zeit in Millisekunden (nie unter null); die Uhr läuft ab dem Start weiter, auch wenn die App zu ist
export const remainingMs = (startedAt: number, minutes: number, now: number) => Math.max(0, startedAt + minutes * 60_000 - now)

// Punkte, die im anderen Teil der Klausur noch zum Bestehen fehlen (nie unter null)
export const missingToPass = (points: number, passTotal: number) => Math.max(0, passTotal - points)
