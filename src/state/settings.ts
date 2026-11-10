import type { Level } from '../engine/tasks/taskNumber.ts'
import { DEFAULT_MIX, type Settings } from './storage.ts'
import { getAppState, updateAppState, useAppState } from './store.ts'

// Einstellungen für die ganze App

export function updateSettings(patch: Partial<Settings>) {
  updateAppState((state) => ({ ...state, settings: { ...state.settings, ...patch } }))
}

// Stufe eines Themas merken
export function setCourseLevel(course: string, level: Level) {
  updateAppState((state) => ({ ...state, settings: { ...state.settings, levels: { ...state.settings.levels, [course]: level } } }))
}

// Unterthemen eines Themas, die nicht drankommen sollen (alle übrigen sind angekreuzt); leer: alle
// angekreuzt („Alle wählen")
export function setSkippedParts(course: string, ids: readonly string[]) {
  updateAppState((state) => ({ ...state, settings: { ...state.settings, skipParts: withList(state.settings.skipParts, course, ids) } }))
}

// Ein Unterthema eines Themas an- oder abwählen (Kästchen auf der Themen- und der Mischseite)
export function setPartChecked(course: string, part: string, checked: boolean) {
  updateAppState((state) => {
    const skip = state.settings.skipParts[course] ?? []
    return { ...state, settings: { ...state.settings, skipParts: withList(state.settings.skipParts, course, toggled(skip, part, !checked)) } }
  })
}

// Stufe der Mischung eines Fachs („Themen mischen")
export function setMixLevel(subject: string, level: Level) {
  updateAppState((state) => {
    const choice = state.settings.mix[subject] ?? DEFAULT_MIX
    return { ...state, settings: { ...state.settings, mix: { ...state.settings.mix, [subject]: { ...choice, level } } } }
  })
}

// Themen der Mischung eines Fachs, die nicht drankommen sollen (alle übrigen sind angekreuzt)
export function setMixSkipped(subject: string, ids: readonly string[]) {
  updateAppState((state) => {
    const choice = state.settings.mix[subject] ?? DEFAULT_MIX
    return { ...state, settings: { ...state.settings, mix: { ...state.settings.mix, [subject]: { ...choice, skip: [...new Set(ids)] } } } }
  })
}

// Ein Thema der Mischung an- oder abwählen
export function setMixCourseChecked(subject: string, course: string, checked: boolean) {
  const choice = getAppState().settings.mix[subject] ?? DEFAULT_MIX
  setMixSkipped(subject, toggled(choice.skip, course, !checked))
}

// Zuletzt geübt: eine Mischung dieses Fachs, oder null für ein einzelnes Thema (für „Weitermachen")
export function setLastMix(subject: string | null) {
  if (getAppState().settings.lastMix !== subject) updateSettings({ lastMix: subject })
}

// Liste mit bzw. ohne die Id, ohne doppelte
function toggled(ids: readonly string[], id: string, present: boolean): string[] {
  const without = ids.filter((other) => other !== id)
  return present ? [...without, id] : without
}

// Eintrag einer Liste je Id setzen; eine leere Liste entfernt den Eintrag (alles angekreuzt)
function withList(lists: Readonly<Record<string, readonly string[]>>, key: string, ids: readonly string[]): Record<string, readonly string[]> {
  const rest = Object.fromEntries(Object.entries(lists).filter(([id]) => id !== key))
  return ids.length > 0 ? { ...rest, [key]: [...new Set(ids)] } : rest
}

export function useSettings(): Settings {
  return useAppState((state) => state.settings)
}
