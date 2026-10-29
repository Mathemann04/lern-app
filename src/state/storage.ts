// Alles, was die App auf dem Gerät speichert, in einem Eintrag mit Versionsnummer.
// Ändert sich das Format, wird alter Inhalt beim Laden umgezogen (migrate), nie verworfen,
// solange er lesbar ist. Kaputter Inhalt führt zu den Standardwerten statt zu einem Absturz.

import { LEVELS, type Level } from '../engine/tasks/taskNumber.ts'

export type ExplanationDetail = 'detailed' | 'short'
// geführt: Auswahl-Antworten Schritt für Schritt; frei: Ableitung selbst eintippen
export type PracticeMode = 'guided' | 'free'
// Hell oder dunkel; system: wie das Gerät
export type ThemeChoice = 'system' | 'light' | 'dark'

export type Settings = {
  // Erklärungen nach jeder Antwort automatisch zeigen
  readonly explanations: boolean
  readonly detail: ExplanationDetail
  // zuletzt gewählte Stufe beim Thema Ableitungen
  readonly derivativeLevel: Level
  readonly practiceMode: PracticeMode
  readonly theme: ThemeChoice
}

// Eine fertig gelöste Aufgabe
export type Attempt = {
  readonly level: Level
  readonly mode: PracticeMode
  // ohne falsche Antwort gelöst (ein Tipp zählt nicht als Fehler, der aufgedeckte Lösungsweg schon)
  readonly clean: boolean
  // Zeitpunkt in Millisekunden
  readonly at: number
}

export type Progress = {
  // gelöste Aufgaben, älteste zuerst (die letzten MAX_ATTEMPTS)
  readonly attempts: readonly Attempt[]
  // wie oft welcher typische Fehler passiert ist (Id der Fehlerregel → Anzahl)
  readonly errors: Readonly<Record<string, number>>
  // Vorschlag „Eine Stufe höher?" weggeklickt: so viele Aufgaben der Stufe waren da gelöst
  readonly suggestionDismissed: Readonly<Partial<Record<Level, number>>>
}

export type AppState = {
  readonly version: 2
  readonly settings: Settings
  readonly progress: Progress
}

export const STORAGE_KEY = 'rechenweg'
export const MAX_ATTEMPTS = 1000

export const DEFAULT_SETTINGS: Settings = { explanations: true, detail: 'detailed', derivativeLevel: 1, practiceMode: 'guided', theme: 'system' }
export const EMPTY_PROGRESS: Progress = { attempts: [], errors: {}, suggestionDismissed: {} }
export const DEFAULT_STATE: AppState = { version: 2, settings: DEFAULT_SETTINGS, progress: EMPTY_PROGRESS }

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

const THEMES: readonly ThemeChoice[] = ['system', 'light', 'dark']

function readSettings(value: unknown): Settings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  return {
    explanations: typeof raw.explanations === 'boolean' ? raw.explanations : DEFAULT_SETTINGS.explanations,
    detail: raw.detail === 'short' || raw.detail === 'detailed' ? raw.detail : DEFAULT_SETTINGS.detail,
    derivativeLevel: LEVELS.find((l) => l === raw.derivativeLevel) ?? DEFAULT_SETTINGS.derivativeLevel,
    practiceMode: raw.practiceMode === 'free' || raw.practiceMode === 'guided' ? raw.practiceMode : DEFAULT_SETTINGS.practiceMode,
    theme: THEMES.find((t) => t === raw.theme) ?? DEFAULT_SETTINGS.theme,
  }
}

const isLevel = (value: unknown): value is Level => LEVELS.some((l) => l === value)
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0

function readAttempt(value: unknown): Attempt | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  if (!isLevel(raw.level) || typeof raw.clean !== 'boolean' || typeof raw.at !== 'number') return null
  const mode = raw.mode === 'free' ? 'free' : 'guided'
  return { level: raw.level, mode, clean: raw.clean, at: raw.at }
}

// Liest den Fortschritt; Unlesbares wird einzeln weggelassen, nicht alles verworfen
function readProgress(value: unknown): Progress {
  if (typeof value !== 'object' || value === null) return EMPTY_PROGRESS
  const raw = value as Record<string, unknown>
  const attempts = Array.isArray(raw.attempts) ? raw.attempts.flatMap((a) => readAttempt(a) ?? []).slice(-MAX_ATTEMPTS) : []
  const errorsRaw = typeof raw.errors === 'object' && raw.errors !== null ? (raw.errors as Record<string, unknown>) : {}
  const errors = Object.fromEntries(Object.entries(errorsRaw).filter(([, n]) => isCount(n) && n > 0)) as Record<string, number>
  const dismissedRaw =
    typeof raw.suggestionDismissed === 'object' && raw.suggestionDismissed !== null
      ? (raw.suggestionDismissed as Record<string, unknown>)
      : {}
  const suggestionDismissed = Object.fromEntries(
    Object.entries(dismissedRaw).filter(([level, n]) => isLevel(Number(level)) && isCount(n)),
  ) as Partial<Record<Level, number>>
  return { attempts, errors, suggestionDismissed }
}

// Bringt gelesenen Inhalt auf das aktuelle Format.
// Version 1 hatte nur Einstellungen; ab Version 2 kommt der Fortschritt dazu.
function migrate(raw: unknown): AppState {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_STATE
  const data = raw as Record<string, unknown>
  return { version: 2, settings: readSettings(data.settings), progress: readProgress(data.progress) }
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
