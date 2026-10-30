// Alles, was die App auf dem Gerät speichert, in einem Eintrag mit Versionsnummer.
// Ändert sich das Format, wird alter Inhalt beim Laden umgezogen (migrate), nie verworfen,
// solange er lesbar ist. Kaputter Inhalt führt zu den Standardwerten statt zu einem Absturz.

import { LEVELS, type Level } from '../engine/tasks/taskNumber.ts'

export type ExplanationDetail = 'detailed' | 'short'
// geführt: Auswahl-Antworten Schritt für Schritt; frei: Ergebnis selbst eintippen
export type PracticeMode = 'guided' | 'free'
// Hell oder dunkel; system: wie das Gerät
export type ThemeChoice = 'system' | 'light' | 'dark'

// Bis Version 2 gab es nur das Thema Ableiten (Id in ui/catalog.ts); alter Fortschritt gehört dorthin
export const FIRST_COURSE = 'ableiten'

export type Settings = {
  // Erklärungen nach jedem Schritt automatisch zeigen
  readonly explanations: boolean
  readonly detail: ExplanationDetail
  // zuletzt gewählte Stufe je Thema (Id des Themas → Stufe); fehlt ein Thema, gilt Stufe 1
  readonly levels: Readonly<Record<string, Level>>
  // zuletzt geübtes Thema (für „Weitermachen")
  readonly lastCourse: string
  readonly practiceMode: PracticeMode
  readonly theme: ThemeChoice
}

// Eine fertig gelöste Aufgabe
export type Attempt = {
  // Id des Themas, z. B. „brueche"
  readonly course: string
  readonly level: Level
  readonly mode: PracticeMode
  // ohne falsche Antwort gelöst (ein Tipp zählt nicht als Fehler, der aufgedeckte Lösungsweg schon)
  readonly clean: boolean
  // Zeitpunkt in Millisekunden
  readonly at: number
}

// Stufe → so viele Aufgaben der Stufe waren gelöst, als „Eine Stufe höher?" weggeklickt wurde
export type Dismissed = Readonly<Partial<Record<Level, number>>>

export type Progress = {
  // gelöste Aufgaben, älteste zuerst (die letzten MAX_ATTEMPTS)
  readonly attempts: readonly Attempt[]
  // wie oft welcher typische Fehler passiert ist (Id der Fehlerregel → Anzahl); die Ids sind über
  // alle Themen eindeutig
  readonly errors: Readonly<Record<string, number>>
  // Vorschlag „Eine Stufe höher?" weggeklickt, je Thema
  readonly suggestionDismissed: Readonly<Record<string, Dismissed>>
}

export type AppState = {
  readonly version: 3
  readonly settings: Settings
  readonly progress: Progress
}

export const STORAGE_KEY = 'rechenweg'
export const MAX_ATTEMPTS = 1000

export const DEFAULT_SETTINGS: Settings = {
  explanations: true,
  detail: 'detailed',
  levels: {},
  lastCourse: FIRST_COURSE,
  practiceMode: 'guided',
  theme: 'system',
}
export const EMPTY_PROGRESS: Progress = { attempts: [], errors: {}, suggestionDismissed: {} }
export const DEFAULT_STATE: AppState = { version: 3, settings: DEFAULT_SETTINGS, progress: EMPTY_PROGRESS }

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

const isLevel = (value: unknown): value is Level => LEVELS.some((l) => l === value)
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0
const isId = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9-]{1,40}$/.test(value)
const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

// version: gelesene Version; bis Version 2 stand die Stufe in derivativeLevel
function readSettings(value: unknown, version: number): Settings {
  const raw = asRecord(value)
  const levels =
    version >= 3
      ? (Object.fromEntries(Object.entries(asRecord(raw.levels)).filter(([id, level]) => isId(id) && isLevel(level))) as Record<string, Level>)
      : isLevel(raw.derivativeLevel)
        ? { [FIRST_COURSE]: raw.derivativeLevel }
        : {}
  return {
    explanations: typeof raw.explanations === 'boolean' ? raw.explanations : DEFAULT_SETTINGS.explanations,
    detail: raw.detail === 'short' || raw.detail === 'detailed' ? raw.detail : DEFAULT_SETTINGS.detail,
    levels,
    lastCourse: isId(raw.lastCourse) ? raw.lastCourse : DEFAULT_SETTINGS.lastCourse,
    practiceMode: raw.practiceMode === 'free' || raw.practiceMode === 'guided' ? raw.practiceMode : DEFAULT_SETTINGS.practiceMode,
    theme: THEMES.find((t) => t === raw.theme) ?? DEFAULT_SETTINGS.theme,
  }
}

function readAttempt(value: unknown, version: number): Attempt | null {
  const raw = asRecord(value)
  if (!isLevel(raw.level) || typeof raw.clean !== 'boolean' || typeof raw.at !== 'number') return null
  const course = version >= 3 ? raw.course : FIRST_COURSE
  if (!isId(course)) return null
  const mode = raw.mode === 'free' ? 'free' : 'guided'
  return { course, level: raw.level, mode, clean: raw.clean, at: raw.at }
}

function readDismissed(value: unknown): Dismissed {
  return Object.fromEntries(Object.entries(asRecord(value)).filter(([level, n]) => isLevel(Number(level)) && isCount(n))) as Dismissed
}

// Liest den Fortschritt; Unlesbares wird einzeln weggelassen, nicht alles verworfen
function readProgress(value: unknown, version: number): Progress {
  if (typeof value !== 'object' || value === null) return EMPTY_PROGRESS
  const raw = value as Record<string, unknown>
  const attempts = Array.isArray(raw.attempts) ? raw.attempts.flatMap((a) => readAttempt(a, version) ?? []).slice(-MAX_ATTEMPTS) : []
  const errors = Object.fromEntries(Object.entries(asRecord(raw.errors)).filter(([, n]) => isCount(n) && n > 0)) as Record<string, number>
  const suggestionDismissed =
    version >= 3
      ? Object.fromEntries(Object.entries(asRecord(raw.suggestionDismissed)).filter(([id]) => isId(id)).map(([id, d]) => [id, readDismissed(d)]))
      : { [FIRST_COURSE]: readDismissed(raw.suggestionDismissed) }
  return { attempts, errors, suggestionDismissed }
}

// Bringt gelesenen Inhalt auf das aktuelle Format.
// Version 1 hatte nur Einstellungen; Version 2 brachte den Fortschritt (nur Ableiten); ab Version 3
// gehören Stufe, gelöste Aufgaben und „Eine Stufe höher?" zu einem Thema.
function migrate(raw: unknown): AppState {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_STATE
  const data = raw as Record<string, unknown>
  const version = typeof data.version === 'number' ? data.version : 1
  return { version: 3, settings: readSettings(data.settings, version), progress: readProgress(data.progress, version) }
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
