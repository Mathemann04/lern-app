import { type Level, type TaskRef, formatTaskNumber, parseTaskNumber } from '../engine/tasks/taskNumber.ts'

// Seiten der App und ihre Adressen (Teil nach „#")
export type Route =
  | { readonly page: 'home' }
  | { readonly page: 'gallery' }
  | { readonly page: 'settings' }
  // Üben: ohne Startwert wird eine neue Aufgabe gewürfelt
  | { readonly page: 'practice'; readonly level: Level; readonly seed: number | null }

export function parseRoute(path: string): Route {
  if (path === '/galerie') return { page: 'gallery' }
  if (path === '/einstellungen') return { page: 'settings' }
  const practice = /^\/ueben\/(.+)$/.exec(path)
  if (practice) {
    const ref = parseTaskNumber(practice[1])
    if (ref) return { page: 'practice', level: ref.level, seed: ref.seed }
    if (/^[1-5]$/.test(practice[1])) return { page: 'practice', level: Number(practice[1]) as Level, seed: null }
  }
  return { page: 'home' }
}

export const practiceHref = (level: Level) => `#/ueben/${level}`
export const taskHref = (ref: TaskRef) => `#/ueben/${formatTaskNumber(ref)}`
