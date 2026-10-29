import type { PracticeMode } from '../state/storage.ts'
import { type Level, type TaskRef, formatTaskNumber, parseTaskNumber } from '../engine/tasks/taskNumber.ts'

// Seiten der App und ihre Adressen (Teil nach „#")
export type Route =
  | { readonly page: 'home' }
  | { readonly page: 'gallery' }
  | { readonly page: 'settings' }
  // Üben: ohne Startwert wird eine neue Aufgabe gewürfelt
  | { readonly page: 'practice'; readonly mode: PracticeMode; readonly level: Level; readonly seed: number | null }

// Geführt: #/ueben/2-4711, frei: #/frei/2-4711
const PREFIX: Record<PracticeMode, string> = { guided: 'ueben', free: 'frei' }

export function parseRoute(path: string): Route {
  if (path === '/galerie') return { page: 'gallery' }
  if (path === '/einstellungen') return { page: 'settings' }
  const practice = /^\/(ueben|frei)\/(.+)$/.exec(path)
  if (practice) {
    const mode: PracticeMode = practice[1] === 'frei' ? 'free' : 'guided'
    const ref = parseTaskNumber(practice[2])
    if (ref) return { page: 'practice', mode, level: ref.level, seed: ref.seed }
    if (/^[1-5]$/.test(practice[2])) return { page: 'practice', mode, level: Number(practice[2]) as Level, seed: null }
  }
  return { page: 'home' }
}

export const practiceHref = (level: Level, mode: PracticeMode = 'guided') => `#/${PREFIX[mode]}/${level}`
export const taskHref = (ref: TaskRef, mode: PracticeMode = 'guided') => `#/${PREFIX[mode]}/${formatTaskNumber(ref)}`
