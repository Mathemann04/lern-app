import type { Level } from '../engine/tasks/taskNumber.ts'
import { type Attempt, EMPTY_PROGRESS, MAX_ATTEMPTS, type Progress } from './storage.ts'
import { updateAppState, useAppState } from './store.ts'

// Fortschritt und Fehlerstatistik: was gelöst wurde, wie oft welcher typische Fehler passiert ist
// und wann „Eine Stufe höher?" vorgeschlagen wird. Die Rechnungen sind reine Funktionen (testbar),
// die Hooks und update-Funktionen verbinden sie mit dem gespeicherten Zustand.

// „8 von 10": Vorschlag, wenn von den letzten 10 Aufgaben einer Stufe mindestens 8 ohne Fehler waren
export const SUGGEST_WINDOW = 10
export const SUGGEST_MIN_CLEAN = 8

export function addAttempt(progress: Progress, attempt: Attempt): Progress {
  return { ...progress, attempts: [...progress.attempts, attempt].slice(-MAX_ATTEMPTS) }
}

export function addError(progress: Progress, errorId: string): Progress {
  return { ...progress, errors: { ...progress.errors, [errorId]: (progress.errors[errorId] ?? 0) + 1 } }
}

export type LevelSummary = {
  readonly solved: number
  // die letzten bis zu 10 gelösten Aufgaben, älteste zuerst
  readonly recent: readonly Attempt[]
  readonly recentClean: number
}

export function levelSummary(progress: Progress, level: Level): LevelSummary {
  const all = progress.attempts.filter((a) => a.level === level)
  const recent = all.slice(-SUGGEST_WINDOW)
  return { solved: all.length, recent, recentClean: recent.filter((a) => a.clean).length }
}

// Nie automatisch wechseln, nur vorschlagen; nach „Später" erst wieder nach 10 weiteren Aufgaben
export function shouldSuggestLevelUp(progress: Progress, level: Level): boolean {
  const { solved, recent, recentClean } = levelSummary(progress, level)
  if (recent.length < SUGGEST_WINDOW || recentClean < SUGGEST_MIN_CLEAN) return false
  const dismissedAt = progress.suggestionDismissed[level]
  return dismissedAt === undefined || solved >= dismissedAt + SUGGEST_WINDOW
}

// Häufigste Fehler zuerst; bei Gleichstand in fester Reihenfolge (nach Id). known: nur Fehler, die
// es (noch) gibt; gespeichert sein kann auch eine Id aus einer älteren Version.
export function topErrors(
  progress: Progress,
  count: number,
  known: (id: string) => boolean = () => true,
): Array<{ id: string; times: number }> {
  return Object.entries(progress.errors)
    .filter(([id]) => known(id))
    .map(([id, times]) => ({ id, times }))
    .sort((a, b) => b.times - a.times || a.id.localeCompare(b.id))
    .slice(0, count)
}

// --- Verbindung zum gespeicherten Zustand ---

const updateProgress = (change: (progress: Progress) => Progress) =>
  updateAppState((state) => ({ ...state, progress: change(state.progress) }))

export const recordAttempt = (attempt: Omit<Attempt, 'at'>) => updateProgress((p) => addAttempt(p, { ...attempt, at: Date.now() }))
export const recordError = (errorId: string) => updateProgress((p) => addError(p, errorId))
export const dismissSuggestion = (level: Level) =>
  updateProgress((p) => ({ ...p, suggestionDismissed: { ...p.suggestionDismissed, [level]: levelSummary(p, level).solved } }))
export const resetProgress = () => updateProgress(() => EMPTY_PROGRESS)

export function useProgress(): Progress {
  return useAppState((state) => state.progress)
}
