import { QUESTION_NO_MAX } from '../engine/quiz/numbers.ts'
import { type KeyValueStore, browserStore } from './storage.ts'

// Runde der Wissensfragen je Thema und Stufe (Plan M4 „Abwechslung": keine Frage kommt doppelt, bevor
// alle dran waren). Gemerkt werden die Nummern der Fragen, die in der laufenden Runde schon gezeigt
// wurden, im eigenen Eintrag neben dem Speicherstand. Die Engine des Themas (engine/chem/engine.ts,
// nextSeed) wählt nur Fragen, die noch nicht dran waren; sind alle durch, beginnt eine neue Runde.
// „Fortschritt löschen" leert den Eintrag, die gemeldeten Fragen (reports.ts) bleiben. Kaputter Inhalt
// ergibt leere Runden statt eines Absturzes.

export const ROUNDS_KEY = 'rechenweg-fragen'
// Obergrenze je Thema und Stufe, damit der Eintrag nicht unbegrenzt wächst (die ältesten fallen weg)
export const MAX_ROUND = 1000

// „Thema:Stufe" → Nummern der Fragen dieser Runde, in der Reihenfolge, in der sie gezeigt wurden
export type Rounds = Readonly<Record<string, readonly number[]>>

const isQuestionNo = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= QUESTION_NO_MAX

// Liest die Runden aus dem gespeicherten Text; Unlesbares wird einzeln weggelassen
export function parseRounds(text: string | null): Rounds {
  if (!text) return {}
  try {
    const raw = JSON.parse(text) as unknown
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
    const out: Record<string, number[]> = {}
    for (const [key, value] of Object.entries(raw)) {
      if (!Array.isArray(value)) continue
      out[key] = [...new Set(value.filter(isQuestionNo))].slice(-MAX_ROUND)
    }
    return out
  } catch {
    return {}
  }
}

function load(store: KeyValueStore | null): Rounds {
  try {
    return parseRounds(store?.getItem(ROUNDS_KEY) ?? null)
  } catch {
    return {}
  }
}

function save(rounds: Rounds, store: KeyValueStore | null) {
  try {
    store?.setItem(ROUNDS_KEY, JSON.stringify(rounds))
  } catch {
    // Speicher voll oder gesperrt: Die App läuft trotzdem weiter, nur ohne Gedächtnis
  }
}

const keyOf = (course: string, level: number) => `${course}:${level}`

// Nummern der Fragen, die in der laufenden Runde dieser Stufe schon dran waren
export function shownInRound(course: string, level: number, store: KeyValueStore | null = browserStore()): ReadonlySet<number> {
  return new Set(load(store)[keyOf(course, level)] ?? [])
}

// Eine gezeigte Frage in die Runde eintragen (Neuladen derselben Aufgabe zählt nicht doppelt)
export function rememberShown(course: string, level: number, no: number, store: KeyValueStore | null = browserStore()) {
  if (!isQuestionNo(no)) return
  const all = load(store)
  const round = all[keyOf(course, level)] ?? []
  if (round.includes(no)) return
  save({ ...all, [keyOf(course, level)]: [...round, no].slice(-MAX_ROUND) }, store)
}

// Eine übersprungene Frage (M6 Schritt 2) aus der Runde nehmen: Sie kommt später in derselben Runde wieder
export function forgetShown(course: string, level: number, no: number, store: KeyValueStore | null = browserStore()) {
  const all = load(store)
  const key = keyOf(course, level)
  if (!all[key]?.includes(no)) return
  save({ ...all, [key]: all[key].filter((shown) => shown !== no) }, store)
}

// Alle Fragen der Stufe waren dran: Die Runde beginnt von vorn. nos: nur diese Nummern aus der Runde
// nehmen (die Fragen der angekreuzten Unterthemen, engine.questionNos); die übrigen bleiben gemerkt,
// damit sie nach einer Änderung der Auswahl nicht gleich wiederkommen. Ohne nos: die ganze Runde leeren.
export function startNewRound(course: string, level: number, nos?: Iterable<number>, store: KeyValueStore | null = browserStore()) {
  const all = load(store)
  const key = keyOf(course, level)
  if (!(key in all)) return
  const remove = nos ? new Set(nos) : null
  save({ ...all, [key]: remove ? all[key].filter((no) => !remove.has(no)) : [] }, store)
}

// Für „Fortschritt löschen": alle Runden aller Themen leeren
export function clearRounds(store: KeyValueStore | null = browserStore()) {
  save({}, store)
}
