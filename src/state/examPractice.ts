import { useSyncExternalStore } from 'react'
import { type KeyValueStore, browserStore } from './storage.ts'

// Ergebnisse von „Klausuraufgabe N üben" (S11), im eigenen Eintrag neben dem Speicherstand, die neuesten zuerst.
// Daraus und aus dem Verlauf der Probeklausuren (mockExam.ts) zeigt der Klausur-Überblick, wie sicher eine
// Klausuraufgabe sitzt (ui/examOverview.ts). „Fortschritt löschen" leert den Eintrag. Kaputter Inhalt wird
// einzeln weggelassen statt abzustürzen.

export const EXAM_PRACTICE_KEY = 'rechenweg-klausuraufgaben'
// Obergrenze (die ältesten fallen weg)
export const MAX_EXAM_PRACTICE = 200

export type ExamPracticeRecord = {
  // Fach, z. B. „chemie"
  readonly subject: string
  // Nummer der Klausuraufgabe
  readonly task: number
  // erreichte und mögliche Punkte (wie nach der Abgabe angezeigt)
  readonly points: number
  readonly max: number
  // Abgabe in Millisekunden
  readonly at: number
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isPoints = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

function readRecord(raw: unknown): ExamPracticeRecord | null {
  if (!isRecord(raw)) return null
  const { subject, task, points, max, at } = raw
  if (typeof subject !== 'string' || !/^[a-z-]{1,40}$/.test(subject)) return null
  if (!Number.isInteger(task) || (task as number) < 1 || (task as number) > 20) return null
  if (!isPoints(points) || !isPoints(max) || max === 0 || points > max || !isTime(at)) return null
  return { subject, task: task as number, points, max, at }
}

// Liest den Verlauf aus dem gespeicherten Text; Unlesbares wird einzeln weggelassen
export function parseExamPractice(text: string | null): ExamPracticeRecord[] {
  if (!text) return []
  try {
    const raw = JSON.parse(text) as unknown
    return Array.isArray(raw) ? raw.flatMap((r) => readRecord(r) ?? []).slice(0, MAX_EXAM_PRACTICE) : []
  } catch {
    return []
  }
}

export function loadExamPractice(store: KeyValueStore | null = browserStore()): ExamPracticeRecord[] {
  try {
    return parseExamPractice(store?.getItem(EXAM_PRACTICE_KEY) ?? null)
  } catch {
    return []
  }
}

// --- gemeinsamer Zustand für die Oberfläche ---

let records: ExamPracticeRecord[] | undefined
const listeners = new Set<() => void>()

function current(): ExamPracticeRecord[] {
  if (records === undefined) records = loadExamPractice()
  return records
}

function update(next: ExamPracticeRecord[], store: KeyValueStore | null = browserStore()) {
  records = next.slice(0, MAX_EXAM_PRACTICE)
  try {
    store?.setItem(EXAM_PRACTICE_KEY, JSON.stringify(records))
  } catch {
    // Speicher voll oder gesperrt: Das Ergebnis fehlt dann nur im Überblick
  }
  for (const listener of listeners) listener()
}

// Nach der Abgabe einer Klausuraufgabe
export function addExamPractice(record: ExamPracticeRecord) {
  const checked = readRecord(record)
  if (checked) update([checked, ...current()])
}

// Für „Fortschritt löschen"
export const clearExamPractice = () => update([])

export function useExamPractice(): readonly ExamPracticeRecord[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    current,
    current,
  )
}
