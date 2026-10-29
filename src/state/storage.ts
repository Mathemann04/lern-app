// Alles, was die App auf dem Gerät speichert, in einem Eintrag mit Versionsnummer.
// Ändert sich das Format, wird alter Inhalt beim Laden umgezogen (migrate), nie verworfen,
// solange er lesbar ist. Kaputter Inhalt führt zu den Standardwerten statt zu einem Absturz.

import { LEVELS, type Level } from '../engine/tasks/taskNumber.ts'

export type ExplanationDetail = 'detailed' | 'short'
// geführt: Auswahl-Antworten Schritt für Schritt; frei: Ableitung selbst eintippen
export type PracticeMode = 'guided' | 'free'

export type Settings = {
  // Erklärungen nach jeder Antwort automatisch zeigen
  readonly explanations: boolean
  readonly detail: ExplanationDetail
  // zuletzt gewählte Stufe beim Thema Ableitungen
  readonly derivativeLevel: Level
  readonly practiceMode: PracticeMode
}

export type AppState = {
  readonly version: 1
  readonly settings: Settings
}

export const STORAGE_KEY = 'rechenweg'

export const DEFAULT_SETTINGS: Settings = { explanations: true, detail: 'detailed', derivativeLevel: 1, practiceMode: 'guided' }
export const DEFAULT_STATE: AppState = { version: 1, settings: DEFAULT_SETTINGS }

// Was von localStorage gebraucht wird (in Tests durch einen Ersatz austauschbar)
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>

export function browserStore(): KeyValueStore | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    // z. B. wenn der Browser Speichern verbietet
    return null
  }
}

function readSettings(value: unknown): Settings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  return {
    explanations: typeof raw.explanations === 'boolean' ? raw.explanations : DEFAULT_SETTINGS.explanations,
    detail: raw.detail === 'short' || raw.detail === 'detailed' ? raw.detail : DEFAULT_SETTINGS.detail,
    derivativeLevel: LEVELS.find((l) => l === raw.derivativeLevel) ?? DEFAULT_SETTINGS.derivativeLevel,
    practiceMode: raw.practiceMode === 'free' || raw.practiceMode === 'guided' ? raw.practiceMode : DEFAULT_SETTINGS.practiceMode,
  }
}

// Bringt gelesenen Inhalt auf das aktuelle Format
function migrate(raw: unknown): AppState {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_STATE
  const data = raw as Record<string, unknown>
  // Version 1 ist die erste; spätere Versionen ergänzen hier ihren Umzug
  return { version: 1, settings: readSettings(data.settings) }
}

export function loadState(store: KeyValueStore | null = browserStore()): AppState {
  if (!store) return DEFAULT_STATE
  try {
    const text = store.getItem(STORAGE_KEY)
    return text ? migrate(JSON.parse(text)) : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

export function saveState(state: AppState, store: KeyValueStore | null = browserStore()): void {
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Speicher voll oder gesperrt: Die App läuft trotzdem weiter
  }
}
