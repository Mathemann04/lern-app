import { ERROR_RULES } from '../engine/derive/errorRules.ts'
import { cardById, topicById } from '../engine/explain/cards.ts'
import { type Level, type TaskRef, formatTaskNumber, parseTaskNumber } from '../engine/tasks/taskNumber.ts'
import type { PracticeMode } from '../state/storage.ts'

// Seiten der App und ihre Adressen (Teil nach „#")
export type Route =
  | { readonly page: 'home' }
  | { readonly page: 'gallery' }
  | { readonly page: 'settings' }
  | { readonly page: 'progress' }
  // Lernkarten: Ordner #/karten, ein Ordner #/karten/ableitungen, eine Karte #/karten/ableitungen/product
  | { readonly page: 'cards' }
  | { readonly page: 'cardTopic'; readonly topic: string }
  | { readonly page: 'card'; readonly id: string }
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
  if (path === '/karten') return { page: 'cards' }
  const cards = /^\/karten\/([^/]+)(?:\/([^/]+))?$/.exec(path)
  if (cards) {
    const [, first, second] = cards
    if (second) return cardById(second)?.topic === first ? { page: 'card', id: second } : parseRoute(`/karten/${first}`)
    if (topicById(first)) return { page: 'cardTopic', topic: first }
    // ältere Adresse ohne Ordner, z. B. #/karten/product
    if (cardById(first)) return { page: 'card', id: first }
    return { page: 'cards' }
  }
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

export const topicHref = (topic: string) => `#/karten/${topic}`
export const cardHref = (id: string) => `${topicHref(cardById(id)!.topic)}/${id}`

// Bereiche des Hauptmenüs
export type Section = 'home' | 'cards' | 'progress' | 'settings'

// Bereich der Seite für die Markierung im Menü; null: Seite gehört zu keinem Bereich
export function sectionOf(route: Route): Section | null {
  switch (route.page) {
    case 'home':
      return 'home'
    case 'cards':
    case 'cardTopic':
    case 'card':
      return 'cards'
    case 'progress':
      return 'progress'
    case 'settings':
      return 'settings'
    default:
      return null
  }
}
