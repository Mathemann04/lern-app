import type { Level } from '../engine/tasks/taskNumber.ts'
import type { Settings } from './storage.ts'
import { updateAppState, useAppState } from './store.ts'

// Einstellungen für die ganze App

export function updateSettings(patch: Partial<Settings>) {
  updateAppState((state) => ({ ...state, settings: { ...state.settings, ...patch } }))
}

// Stufe eines Themas merken
export function setCourseLevel(course: string, level: Level) {
  updateAppState((state) => ({ ...state, settings: { ...state.settings, levels: { ...state.settings.levels, [course]: level } } }))
}

export function useSettings(): Settings {
  return useAppState((state) => state.settings)
}
