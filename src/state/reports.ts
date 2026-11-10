import { useSyncExternalStore } from 'react'
import { type KeyValueStore, browserStore } from './storage.ts'

// Gemeldete Fragen („Frage melden" bei Wissensfragen): eine Liste auf dem Gerät, im eigenen Eintrag
// neben dem Speicherstand. Der Nutzer kopiert sie in den Einstellungen und schickt sie in der
// nächsten Sitzung zur Prüfung. „Fortschritt löschen" lässt sie stehen; leeren geht nur über
// „Liste leeren". Kaputter Inhalt ergibt eine leere Liste statt eines Absturzes.

export const REPORTS_KEY = 'rechenweg-meldungen'
// Obergrenze, damit der Eintrag nicht unbegrenzt wächst (die ältesten fallen weg)
export const MAX_REPORTS = 200

export type Report = {
  // Id der Frage
  readonly id: string
  // Id des Themas
  readonly course: string
  // Nummer der Aufgabe, z. B. „1-500123"
  readonly ref: string
  // die Frage (Text mit Formeln)
  readonly prompt: string
  // Zeitpunkt in Millisekunden
  readonly at: number
}

const isText = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max

function readReport(value: unknown): Report | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  if (!isText(raw.id, 80) || !isText(raw.course, 80) || !isText(raw.ref, 20) || !isText(raw.prompt, 2000)) return null
  if (typeof raw.at !== 'number' || !Number.isFinite(raw.at)) return null
  return { id: raw.id, course: raw.course, ref: raw.ref, prompt: raw.prompt, at: raw.at }
}

// Liest die Liste aus dem gespeicherten Text; Unlesbares wird einzeln weggelassen
export function parseReports(text: string | null): Report[] {
  if (!text) return []
  try {
    const raw = JSON.parse(text) as unknown
    return Array.isArray(raw) ? raw.flatMap((r) => readReport(r) ?? []).slice(-MAX_REPORTS) : []
  } catch {
    return []
  }
}

export function loadReports(store: KeyValueStore | null = browserStore()): Report[] {
  try {
    return parseReports(store?.getItem(REPORTS_KEY) ?? null)
  } catch {
    return []
  }
}

function saveReports(list: readonly Report[], store: KeyValueStore | null = browserStore()) {
  try {
    store?.setItem(REPORTS_KEY, JSON.stringify(list))
  } catch {
    // Speicher voll oder gesperrt: Die App läuft trotzdem weiter
  }
}

const twoDigits = (n: number) => String(n).padStart(2, '0')
const dateOf = (at: number) => {
  const d = new Date(at)
  return `${twoDigits(d.getDate())}.${twoDigits(d.getMonth() + 1)}.${d.getFullYear()}`
}

// Die Liste als Text zum Einfügen in den Chat
export function reportsText(list: readonly Report[]): string {
  const lines = list.map((r, i) => `${i + 1}. ${r.course}, Aufgabe ${r.ref}, Frage ${r.id} (gemeldet am ${dateOf(r.at)}): ${r.prompt}`)
  return [`Gemeldete Fragen aus Rechenweg (${list.length}):`, ...lines].join('\n')
}

// --- gemeinsamer Zustand für die Oberfläche ---

let reports: Report[] | null = null
const listeners = new Set<() => void>()

function current(): Report[] {
  reports ??= loadReports()
  return reports
}

function update(list: Report[]) {
  reports = list
  saveReports(list)
  for (const listener of listeners) listener()
}

export const addReport = (report: Report) => update([...current(), report].slice(-MAX_REPORTS))
export const clearReports = () => update([])

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useReports(): readonly Report[] {
  return useSyncExternalStore(subscribe, current, current)
}
