import { useSyncExternalStore } from 'react'
import { type AppState, loadState, saveState } from './storage.ts'

// Gemeinsamer Zustand der App: gelesen beim Start, gespeichert bei jeder Änderung

let state: AppState = loadState()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAppState(): AppState {
  return state
}

export function updateAppState(change: (current: AppState) => AppState) {
  state = change(state)
  saveState(state)
  for (const listener of listeners) listener()
}

export function useAppState<T>(select: (current: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(state),
  )
}
