import { VARIANTS, decodeSeed } from '../engine/quiz/numbers.ts'
import {
  type CourseReviews,
  type DueAcross,
  EMPTY_REVIEWS,
  LAST_BOX,
  type ReviewItem,
  type ReviewState,
  afterAnswer,
  courseReviews,
  dueAcross,
  noteShown,
  reviewKey,
} from '../engine/quiz/schedule.ts'
import { type KeyValueStore, browserStore } from './storage.ts'

// Wiederholung falsch beantworteter Wissensfragen (S8a), im eigenen Eintrag neben dem Speicherstand. Die
// Regeln (Fächer, Pausen) stehen in engine/quiz/schedule.ts. „Fortschritt löschen" leert den Eintrag.
// Kaputter Inhalt ergibt eine leere Wiederholung statt eines Absturzes.

export const REVIEWS_KEY = 'rechenweg-wiederholung'
// Obergrenze der gemerkten Fragen (die am längsten nicht beantworteten fallen weg)
export const MAX_REVIEWS = 2000

const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0

function parseItem(raw: unknown): ReviewItem | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { box, dueTick, dueAt, variant, answeredAt } = raw as Record<string, unknown>
  if (!isCount(box) || box > LAST_BOX || !isCount(dueTick) || !isTime(dueAt) || !isCount(variant) || variant >= VARIANTS || !isTime(answeredAt)) return null
  return { box, dueTick, dueAt, variant, answeredAt }
}

// Liest die Wiederholung aus dem gespeicherten Text; Unlesbares wird einzeln weggelassen
export function parseReviews(text: string | null): ReviewState {
  if (!text) return EMPTY_REVIEWS
  try {
    const raw = JSON.parse(text) as unknown
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return EMPTY_REVIEWS
    const { tick, last, items } = raw as Record<string, unknown>
    const out: Record<string, ReviewItem> = {}
    if (typeof items === 'object' && items !== null && !Array.isArray(items)) {
      for (const [key, value] of Object.entries(items)) {
        const item = /^[a-z-]{1,40}:\d{1,4}$/.test(key) ? parseItem(value) : null
        if (item) out[key] = item
      }
    }
    return { tick: isCount(tick) ? tick : 0, last: typeof last === 'string' ? last : null, items: out }
  } catch {
    return EMPTY_REVIEWS
  }
}

function load(store: KeyValueStore | null): ReviewState {
  try {
    return parseReviews(store?.getItem(REVIEWS_KEY) ?? null)
  } catch {
    return EMPTY_REVIEWS
  }
}

function save(state: ReviewState, store: KeyValueStore | null) {
  const entries = Object.entries(state.items)
  const items =
    entries.length > MAX_REVIEWS ? Object.fromEntries(entries.sort((a, b) => b[1].answeredAt - a[1].answeredAt).slice(0, MAX_REVIEWS)) : state.items
  try {
    store?.setItem(REVIEWS_KEY, JSON.stringify({ ...state, items }))
  } catch {
    // Speicher voll oder gesperrt: Die App läuft trotzdem weiter, nur ohne Wiederholung
  }
}

// Eine Aufgabe wird gezeigt (jede, auch Mathe): zählt für „nach drei anderen Aufgaben"
export function rememberTaskShown(course: string, level: number, seed: number, store: KeyValueStore | null = browserStore()) {
  const state = load(store)
  const next = noteShown(state, `${course}:${level}:${seed}`)
  if (next !== state) save(next, store)
}

// Eine Aufgabe ist fertig: Bei Wissensfragen die Wiederholung nachführen (correct: ohne Fehlversuch)
export function recordReview(course: string, seed: number, correct: boolean, now = Date.now(), store: KeyValueStore | null = browserStore()) {
  const decoded = decodeSeed(seed)
  if (decoded?.kind !== 'question') return
  const state = load(store)
  const next = afterAnswer(state, reviewKey(course, decoded.no), correct, decoded.variant, now)
  if (next !== state) save(next, store)
}

// Fällige und wartende Fragen eines Themas
export function reviewsOf(course: string, now = Date.now(), store: KeyValueStore | null = browserStore()): CourseReviews {
  return courseReviews(load(store), course, now)
}

// Fällige Fragen mehrerer Themen (alle Themen eines Fachs), die am längsten fällige zuerst (S11)
export function dueReviewsOf(courses: readonly string[], now = Date.now(), store: KeyValueStore | null = browserStore()): DueAcross[] {
  return dueAcross(load(store), courses, now)
}

// Fragen dieser Themen, die noch warten (nach drei anderen Aufgaben oder an einem späteren Tag fällig)
export function waitingReviewCount(courses: readonly string[], now = Date.now(), store: KeyValueStore | null = browserStore()): number {
  const state = load(store)
  return courses.reduce((sum, course) => sum + courseReviews(state, course, now).waiting.size, 0)
}

// Ist diese Frage gerade in der Wiederholung (falsch beantwortet und noch nicht gelernt)?
export function isInReview(course: string, seed: number, store: KeyValueStore | null = browserStore()): boolean {
  const decoded = decodeSeed(seed)
  return decoded?.kind === 'question' && reviewKey(course, decoded.no) in load(store).items
}

// Für „Fortschritt löschen"
export function clearReviews(store: KeyValueStore | null = browserStore()) {
  save(EMPTY_REVIEWS, store)
}
