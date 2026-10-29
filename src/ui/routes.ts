import { ERROR_RULES } from '../engine/derive/errorRules.ts'
import { type Level, type TaskRef, formatTaskNumber, parseTaskNumber } from '../engine/tasks/taskNumber.ts'
import type { PracticeMode } from '../state/storage.ts'

// Seiten der App und ihre Adressen (Teil nach „#")
export type Route =
  | { readonly page: 'home' }
  | { readonly page: 'gallery' }
  | { readonly page: 'settings' }
  | { readonly page: 'progress' }
  // Üben: ohne Startwert wird eine neue Aufgabe gewürfelt; focus: gezielt einen typischen Fehler üben
  | {
      readonly page: 'practice'
      readonly mode: PracticeMode
      readonly level: Level
      readonly seed: number | null
      readonly focus: string | null
    }

// Geführt: #/ueben/2-4711, frei: #/frei/2-4711, gezielt: #/ueben/2-4711?fokus=cos-sign
const PREFIX: Record<PracticeMode, string> = { guided: 'ueben', free: 'frei' }

export function parseRoute(fullPath: string): Route {
  const [path, query = ''] = fullPath.split('?')
  if (path === '/galerie') return { page: 'gallery' }
  if (path === '/einstellungen') return { page: 'settings' }
  if (path === '/fortschritt') return { page: 'progress' }
  const practice = /^\/(ueben|frei)\/(.+)$/.exec(path)
  if (practice) {
    const mode: PracticeMode = practice[1] === 'frei' ? 'free' : 'guided'
    const wanted = new URLSearchParams(query).get('fokus')
    const focus = wanted && ERROR_RULES.some((r) => r.id === wanted) ? wanted : null
    const ref = parseTaskNumber(practice[2])
    if (ref) return { page: 'practice', mode, level: ref.level, seed: ref.seed, focus }
    if (/^[1-5]$/.test(practice[2])) return { page: 'practice', mode, level: Number(practice[2]) as Level, seed: null, focus }
  }
  return { page: 'home' }
}

const focusQuery = (focus?: string | null) => (focus ? `?fokus=${focus}` : '')

export const practiceHref = (level: Level, mode: PracticeMode = 'guided', focus?: string | null) =>
  `#/${PREFIX[mode]}/${level}${focusQuery(focus)}`
export const taskHref = (ref: TaskRef, mode: PracticeMode = 'guided', focus?: string | null) =>
  `#/${PREFIX[mode]}/${formatTaskNumber(ref)}${focusQuery(focus)}`
