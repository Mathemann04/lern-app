import { useSyncExternalStore } from 'react'
import { type KeyValueStore, browserStore } from './storage.ts'

// Laufende oder zuletzt abgegebene Probeklausur (S9), im eigenen Eintrag neben dem Speicherstand: Neu laden oder
// eine andere App öffnen verliert nichts, die Uhr läuft ab dem Start weiter (Startzeit gespeichert). Es gibt
// höchstens eine; eine neue ersetzt sie. „Fortschritt löschen" leert den Eintrag. Kaputter Inhalt ergibt keine
// Klausur statt eines Absturzes.

export const MOCK_KEY = 'rechenweg-probeklausur'

export type MockSession = {
  // Fach, z. B. „chemie"
  readonly subject: string
  // Nummer der Probeklausur
  readonly id: number
  // Start in Millisekunden
  readonly startedAt: number
  // false: ohne Zeitdruck
  readonly timed: boolean
  // Antworten je Aufgabe (Nummer als Text) und Frage
  readonly answers: Readonly<Record<string, Readonly<Record<string, string>>>>
  // gerade gezeigte Aufgabe (Nummer)
  readonly current: number
  // Abgabe in Millisekunden; null: läuft noch
  readonly submittedAt: number | null
  // von der Uhr abgegeben, weil die Zeit um war
  readonly timeUp: boolean
}

const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
const isNo = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 999_999
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function readAnswers(raw: unknown): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {}
  if (!isRecord(raw)) return out
  for (const [task, items] of Object.entries(raw)) {
    if (!/^\d{1,2}$/.test(task) || !isRecord(items)) continue
    const answers: Record<string, string> = {}
    for (const [item, answer] of Object.entries(items)) {
      if (item.length <= 80 && typeof answer === 'string' && answer.length <= 200) answers[item] = answer
    }
    out[task] = answers
  }
  return out
}

// Liest die Klausur aus dem gespeicherten Text; null bei nichts oder Unlesbarem
export function parseMockSession(text: string | null): MockSession | null {
  if (!text) return null
  try {
    const raw = JSON.parse(text) as unknown
    if (!isRecord(raw)) return null
    const { subject, id, startedAt, timed, answers, current, submittedAt, timeUp } = raw
    if (typeof subject !== 'string' || !/^[a-z-]{1,40}$/.test(subject) || !isNo(id) || !isTime(startedAt) || typeof timed !== 'boolean') return null
    return {
      subject,
      id,
      startedAt,
      timed,
      answers: readAnswers(answers),
      current: isNo(current) ? current : 1,
      submittedAt: isTime(submittedAt) ? submittedAt : null,
      timeUp: timeUp === true,
    }
  } catch {
    return null
  }
}

export function loadMockSession(store: KeyValueStore | null = browserStore()): MockSession | null {
  try {
    return parseMockSession(store?.getItem(MOCK_KEY) ?? null)
  } catch {
    return null
  }
}

function saveMockSession(session: MockSession | null, store: KeyValueStore | null = browserStore()) {
  try {
    store?.setItem(MOCK_KEY, session ? JSON.stringify(session) : '')
  } catch {
    // Speicher voll oder gesperrt: Die Klausur läuft trotzdem weiter, nur ohne Neuladen
  }
}

// --- gemeinsamer Zustand für die Oberfläche ---

let session: MockSession | null | undefined
const listeners = new Set<() => void>()

function current(): MockSession | null {
  if (session === undefined) session = loadMockSession()
  return session
}

function update(next: MockSession | null) {
  session = next
  saveMockSession(next)
  for (const listener of listeners) listener()
}

export function startMockSession(subject: string, id: number, timed: boolean, firstTask: number, now = Date.now()) {
  update({ subject, id, startedAt: now, timed, answers: {}, current: firstTask, submittedAt: null, timeUp: false })
}

// Antworten einer Aufgabe ersetzen (nur solange die Klausur läuft)
export function setMockAnswers(task: number, answers: Readonly<Record<string, string>>) {
  const s = current()
  if (!s || s.submittedAt !== null) return
  update({ ...s, answers: { ...s.answers, [String(task)]: answers } })
}

export function showMockTask(task: number) {
  const s = current()
  if (s && s.current !== task) update({ ...s, current: task })
}

// Abgeben; true, wenn die Klausur dadurch abgegeben wurde (nicht schon vorher)
export function submitMockSession(timeUp: boolean, now = Date.now()): boolean {
  const s = current()
  if (!s || s.submittedAt !== null) return false
  update({ ...s, submittedAt: now, timeUp })
  return true
}

// Für „Fortschritt löschen"
export const clearMockSession = () => update(null)

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useMockSession(): MockSession | null {
  return useSyncExternalStore(subscribe, current, current)
}

// --- Verlauf (S9b): Ergebnisse abgegebener Probeklausuren, die neueste zuerst ---

export const MOCK_HISTORY_KEY = 'rechenweg-probeklausuren'
// Obergrenze (die ältesten fallen weg)
export const MAX_MOCK_HISTORY = 100

export type MockRecord = {
  readonly subject: string
  readonly id: number
  // Abgabe in Millisekunden
  readonly at: number
  readonly points: number
  readonly max: number
  // Punkte je Aufgabe, in der Reihenfolge der Klausur
  readonly tasks: readonly number[]
  readonly timed: boolean
  // gebrauchte Zeit in Minuten (gerundet)
  readonly minutes: number
  readonly timeUp: boolean
}

const isPoints = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000

function readRecord(raw: unknown): MockRecord | null {
  if (!isRecord(raw)) return null
  const { subject, id, at, points, max, tasks, timed, minutes, timeUp } = raw
  if (typeof subject !== 'string' || !/^[a-z-]{1,40}$/.test(subject) || !isNo(id) || !isTime(at) || !isPoints(points) || !isPoints(max)) return null
  if (!Array.isArray(tasks) || tasks.length > 20 || !tasks.every(isPoints) || typeof timed !== 'boolean' || !isPoints(minutes)) return null
  return { subject, id, at, points, max, tasks: [...tasks], timed, minutes, timeUp: timeUp === true }
}

export function parseMockHistory(text: string | null): MockRecord[] {
  if (!text) return []
  try {
    const raw = JSON.parse(text) as unknown
    return Array.isArray(raw) ? raw.flatMap((r) => readRecord(r) ?? []).slice(0, MAX_MOCK_HISTORY) : []
  } catch {
    return []
  }
}

export function loadMockHistory(store: KeyValueStore | null = browserStore()): MockRecord[] {
  try {
    return parseMockHistory(store?.getItem(MOCK_HISTORY_KEY) ?? null)
  } catch {
    return []
  }
}

let history: MockRecord[] | undefined
const historyListeners = new Set<() => void>()

function currentHistory(): MockRecord[] {
  if (history === undefined) history = loadMockHistory()
  return history
}

function updateHistory(next: MockRecord[], store: KeyValueStore | null = browserStore()) {
  history = next.slice(0, MAX_MOCK_HISTORY)
  try {
    store?.setItem(MOCK_HISTORY_KEY, JSON.stringify(history))
  } catch {
    // Speicher voll oder gesperrt: Der Verlauf fehlt dann nur
  }
  for (const listener of historyListeners) listener()
}

export const addMockRecord = (record: MockRecord) => updateHistory([record, ...currentHistory()])
// Nummern der letzten Probeklausuren eines Fachs, die neueste zuerst
export const recentMockIds = (subject: string) => currentHistory().filter((r) => r.subject === subject).map((r) => r.id)
// Für „Fortschritt löschen"
export const clearMockHistory = () => updateHistory([])

export function useMockHistory(): readonly MockRecord[] {
  return useSyncExternalStore(
    (listener) => {
      historyListeners.add(listener)
      return () => historyListeners.delete(listener)
    },
    currentHistory,
    currentHistory,
  )
}
