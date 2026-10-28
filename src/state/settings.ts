import { useSyncExternalStore } from 'react'
import { type AppState, type Settings, loadState, saveState } from './storage.ts'

// Einstellungen für die ganze App: gelesen beim Start, gespeichert bei jeder Änderung

let state: AppState = loadState()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function updateSettings(patch: Partial<Settings>) {
  state = { ...state, settings: { ...state.settings, ...patch } }
  saveState(state)
  for (const listener of listeners) listener()
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    subscribe,
    () => state.settings,
    () => state.settings,
  )
}
