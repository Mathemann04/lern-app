import type { Settings } from './storage.ts'
import { updateAppState, useAppState } from './store.ts'

// Einstellungen für die ganze App

export function updateSettings(patch: Partial<Settings>) {
  updateAppState((state) => ({ ...state, settings: { ...state.settings, ...patch } }))
}

export function useSettings(): Settings {
  return useAppState((state) => state.settings)
}
