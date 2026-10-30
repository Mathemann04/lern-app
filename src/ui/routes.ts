import { type Level, type TaskRef, formatTaskNumber, parseTaskNumber } from '../engine/tasks/taskNumber.ts'
import type { PracticeMode } from '../state/storage.ts'
import { DERIVATIVES, areaById, courseById, isAreaAvailable, isCourseAvailable } from './catalog.ts'

// Seiten der App und ihre Adressen (Teil nach „#"). Absichtlich ohne Mathe-Engine, damit die
// Startseite schnell lädt: Ob es eine Lernkarte oder einen typischen Fehler gibt, prüfen erst die
// Seiten selbst (cards/cardRoute.ts, PracticePage.tsx).
export type Route =
  | { readonly page: 'home' }
  | { readonly page: 'gallery' }
  | { readonly page: 'settings' }
  | { readonly page: 'progress' }
  // Gebiet #/gebiet/grundlagen, Thema #/thema/brueche (Aufbau in catalog.ts)
  | { readonly page: 'area'; readonly id: string }
  | { readonly page: 'course'; readonly id: string }
  // Lernkarten: Ordner #/karten, ein Ordner #/karten/ableitungen, eine Karte #/karten/ableitungen/product
  | { readonly page: 'cards'; readonly folder: string | null; readonly card: string | null }
  // Üben: ohne Startwert wird eine neue Aufgabe gewürfelt; focus: gezielt einen typischen Fehler üben
  // (Id einer Fehlerregel, noch ungeprüft)
  | {
      readonly page: 'practice'
      readonly course: string
      readonly mode: PracticeMode
      readonly level: Level
      readonly seed: number | null
      readonly focus: string | null
    }

// Geführt: #/ueben/brueche/2-4711, frei: #/frei/ableiten/2-4711,
// gezielt: #/ueben/ableiten/2-4711?fokus=cos-sign. Ältere Adressen ohne Thema (#/ueben/2-4711)
// gehören zu Ableiten, dem ersten Thema.
const PREFIX: Record<PracticeMode, string> = { guided: 'ueben', free: 'frei' }

export function parseRoute(fullPath: string): Route {
  const [path, query = ''] = fullPath.split('?')
  if (path === '/galerie') return { page: 'gallery' }
  if (path === '/einstellungen') return { page: 'settings' }
  if (path === '/fortschritt') return { page: 'progress' }
  const catalog = /^\/(gebiet|thema)\/([^/]+)$/.exec(path)
  if (catalog) {
    const [, kind, id] = catalog
    if (kind === 'thema') {
      const found = courseById(id)
      return found && isCourseAvailable(found.course) ? { page: 'course', id } : { page: 'home' }
    }
    const found = areaById(id)
    return found && isAreaAvailable(found.area) ? { page: 'area', id } : { page: 'home' }
  }
  const cards = /^\/karten(?:\/([^/]+))?(?:\/([^/]+))?$/.exec(path)
  if (cards) return { page: 'cards', folder: cards[1] ?? null, card: cards[2] ?? null }
  const practice = /^\/(ueben|frei)\/(?:([a-z-]+)\/)?([^/]+)$/.exec(path)
  if (practice) {
    const [, prefix, course = DERIVATIVES, number] = practice
    const found = courseById(course)
    if (!found || !isCourseAvailable(found.course)) return { page: 'home' }
    const mode: PracticeMode = prefix === 'frei' ? 'free' : 'guided'
    const focus = new URLSearchParams(query).get('fokus') || null
    const ref = parseTaskNumber(number)
    if (ref) return { page: 'practice', course, mode, level: ref.level, seed: ref.seed, focus }
    if (/^[1-5]$/.test(number)) return { page: 'practice', course, mode, level: Number(number) as Level, seed: null, focus }
  }
  return { page: 'home' }
}

const focusQuery = (focus?: string | null) => (focus ? `?fokus=${focus}` : '')

export const practiceHref = (course: string, level: Level, mode: PracticeMode = 'guided', focus?: string | null) =>
  `#/${PREFIX[mode]}/${course}/${level}${focusQuery(focus)}`
export const taskHref = (course: string, ref: TaskRef, mode: PracticeMode = 'guided', focus?: string | null) =>
  `#/${PREFIX[mode]}/${course}/${formatTaskNumber(ref)}${focusQuery(focus)}`

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
