import { type Level, type TaskRef, formatTaskNumber, parseTaskNumber } from '../engine/tasks/taskNumber.ts'
import type { PracticeMode } from '../state/storage.ts'
import { areaById, courseById, isAreaAvailable } from './catalog.ts'

// Seiten der App und ihre Adressen (Teil nach „#"). Absichtlich ohne Mathe-Engine, damit die
// Startseite schnell lädt: Ob es eine Lernkarte oder einen typischen Fehler gibt, prüfen erst die
// Seiten selbst (cards/cardRoute.ts, PracticePage.tsx).
export type Route =
  | { readonly page: 'home' }
  | { readonly page: 'gallery' }
  | { readonly page: 'settings' }
  | { readonly page: 'progress' }
  // Gebiet #/gebiet/differentialrechnung, Thema #/thema/ableiten (Aufbau in catalog.ts)
  | { readonly page: 'area'; readonly id: string }
  | { readonly page: 'course'; readonly id: string }
  // Lernkarten: Ordner #/karten, ein Ordner #/karten/ableitungen, eine Karte #/karten/ableitungen/product
  | { readonly page: 'cards'; readonly folder: string | null; readonly card: string | null }
  // Üben: ohne Startwert wird eine neue Aufgabe gewürfelt; focus: gezielt einen typischen Fehler üben
  // (Id einer Fehlerregel, noch ungeprüft)
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
  const catalog = /^\/(gebiet|thema)\/([^/]+)$/.exec(path)
  if (catalog) {
    const [, kind, id] = catalog
    if (kind === 'thema') return courseById(id) ? { page: 'course', id } : { page: 'home' }
    const found = areaById(id)
    return found && isAreaAvailable(found.area) ? { page: 'area', id } : { page: 'home' }
  }
  const cards = /^\/karten(?:\/([^/]+))?(?:\/([^/]+))?$/.exec(path)
  if (cards) return { page: 'cards', folder: cards[1] ?? null, card: cards[2] ?? null }
  const practice = /^\/(ueben|frei)\/(.+)$/.exec(path)
  if (practice) {
    const mode: PracticeMode = practice[1] === 'frei' ? 'free' : 'guided'
    const focus = new URLSearchParams(query).get('fokus') || null
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

export const areaHref = (id: string) => `#/gebiet/${id}`
export const courseHref = (id: string) => `#/thema/${id}`

// Ordner der Lernkarten (in explain/cards.ts „topic"); eine Karte: cardHref in cards/cardRoute.ts
export const cardFolderHref = (topic: string) => `#/karten/${topic}`

// Bereiche des Hauptmenüs
export type Section = 'home' | 'cards' | 'progress' | 'settings'

// Bereich der Seite für die Markierung im Menü; null: Seite gehört zu keinem Bereich
export function sectionOf(route: Route): Section | null {
  switch (route.page) {
    case 'home':
    case 'area':
    case 'course':
      return 'home'
    case 'cards':
      return 'cards'
    case 'progress':
      return 'progress'
    case 'settings':
      return 'settings'
    default:
      return null
  }
}
