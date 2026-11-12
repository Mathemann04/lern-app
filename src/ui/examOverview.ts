import type { ExamPracticeRecord } from '../state/examPractice.ts'
import type { MockRecord } from '../state/mockExam.ts'
import type { Area, Subject } from './catalog.ts'

// Klausur-Überblick (S11): je Klausuraufgabe, wie sicher sie sitzt, aus den letzten Versuchen („Klausuraufgabe N
// üben" und dieselbe Aufgabe in den Probeklausuren), dazu letzte und beste Probeklausur. Rein und ohne Engine und
// KaTeX: Startseite und Überblick kommen ohne beides aus.

// so viele der letzten Versuche zählen
export const CONFIDENCE_WINDOW = 3
// ab diesem Anteil der Punkte „fast sicher" bzw. „sicher"
export const ALMOST_SHARE = 0.5
export const SURE_SHARE = 0.8

export type Confidence = 'new' | 'unsure' | 'almost' | 'sure'

export const CONFIDENCE_LABEL: Readonly<Record<Confidence, string>> = {
  new: 'noch nicht geübt',
  unsure: 'unsicher',
  almost: 'fast sicher',
  sure: 'sicher',
}

// Ein Versuch einer Klausuraufgabe: geübt oder als Teil einer Probeklausur
export type ExamAttempt = { readonly points: number; readonly max: number; readonly at: number; readonly mock: boolean }

export type ExamTaskInfo = { readonly task: number; readonly points: number; readonly area: Area }

// Klausuraufgaben eines Fachs aus den Gebieten mit exam im Katalog, nach Nummer
export function examTasksOf(subject: Subject): ExamTaskInfo[] {
  return subject.areas.flatMap((area) => (area.exam ? [{ task: area.exam.task, points: area.exam.points, area }] : [])).sort((a, b) => a.task - b.task)
}

// Nummern der Aufgaben in der Reihenfolge der Probeklausur (MockRecord.tasks); ein Test vergleicht mit der Engine
export const mockTaskOrder = (subject: Subject): number[] => examTasksOf(subject).map((t) => t.task)

// Alle Versuche einer Klausuraufgabe, die neuesten zuerst
export function examAttempts(
  subject: Subject,
  task: number,
  practice: readonly ExamPracticeRecord[],
  history: readonly MockRecord[],
): ExamAttempt[] {
  const info = examTasksOf(subject).find((t) => t.task === task)
  if (!info) return []
  const order = mockTaskOrder(subject)
  const index = order.indexOf(task)
  const practiced = practice.filter((r) => r.subject === subject.id && r.task === task).map((r) => ({ points: r.points, max: r.max, at: r.at, mock: false }))
  const mocked = history
    // Ergebnisse mit unpassender Zahl von Aufgaben (älterer Aufbau) zählen nicht
    .filter((r) => r.subject === subject.id && r.tasks.length === order.length)
    .map((r) => ({ points: Math.min(r.tasks[index], info.points), max: info.points, at: r.at, mock: true }))
  return [...practiced, ...mocked].sort((a, b) => b.at - a.at)
}

export type TaskConfidence = {
  readonly level: Confidence
  // Anteil der Punkte in den letzten Versuchen (0 bis 1); null: noch nicht geübt
  readonly share: number | null
  // letzter Versuch
  readonly last: ExamAttempt | null
}

// Wie sicher: Anteil der Punkte in den letzten drei Versuchen
export function confidenceOf(attempts: readonly ExamAttempt[]): TaskConfidence {
  const recent = [...attempts].sort((a, b) => b.at - a.at).slice(0, CONFIDENCE_WINDOW)
  const max = recent.reduce((sum, a) => sum + a.max, 0)
  if (recent.length === 0 || max <= 0) return { level: 'new', share: null, last: null }
  const share = recent.reduce((sum, a) => sum + a.points, 0) / max
  const level: Confidence = share >= SURE_SHARE ? 'sure' : share >= ALMOST_SHARE ? 'almost' : 'unsure'
  return { level, share, last: recent[0] }
}

export type MockSummary = { readonly last: MockRecord | null; readonly best: MockRecord | null; readonly count: number }

// Letzte und beste Probeklausur eines Fachs (der Verlauf steht mit der neuesten zuerst)
export function mockSummary(subject: Subject, history: readonly MockRecord[]): MockSummary {
  const own = history.filter((r) => r.subject === subject.id)
  const best = own.reduce<MockRecord | null>((b, r) => (b === null || r.points > b.points ? r : b), null)
  return { last: own[0] ?? null, best, count: own.length }
}

// Datum kurz auf Deutsch, z. B. „12.11.2026"
export const shortDate = (at: number) => new Date(at).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' })

// Punkte mit Komma, z. B. „10,5"
export const pointsText = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')
