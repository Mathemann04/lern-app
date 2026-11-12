import { VARIANTS } from './numbers.ts'

// Wiederholung der Wissensfragen (Plan M4, „Aufgabenarten"; S8a): Eine falsch beantwortete Frage kommt
// wieder, erst nach drei anderen Aufgaben, dann nach einem Tag, drei Tagen, einer Woche und drei Wochen.
// Fächer 0 bis 4: Fach 0 wartet auf drei andere Aufgaben, Fach k (1 bis 4) auf REVIEW_DAYS[k − 1] Tage.
// Richtig beantwortet, wenn sie fällig war: ein Fach weiter (aus Fach 4 heraus ist sie gelernt und fällt
// aus der Wiederholung). Falsch beantwortet, egal wann: zurück in Fach 0. Richtig beantwortet, bevor sie
// fällig war (z. B. nach Neuladen): bleibt, wie sie ist. Reine Funktionen ohne Speicher (state/reviews.ts
// speichert, ui/practice.ts wählt fällige Fragen zuerst).

// so viele andere Aufgaben, bevor eine falsch beantwortete Frage wiederkommt
export const REVIEW_AFTER_TASKS = 3
// Pausen der Fächer 1 bis 4 in Tagen
export const REVIEW_DAYS: readonly number[] = [1, 3, 7, 21]
export const LAST_BOX = REVIEW_DAYS.length
const DAY_MS = 24 * 60 * 60 * 1000

export type ReviewItem = {
  // Fach 0 bis 4
  readonly box: number
  // fällig ab dieser gezeigten Aufgabe (Zähler tick) …
  readonly dueTick: number
  // … und ab diesem Zeitpunkt (Millisekunden seit 1970)
  readonly dueAt: number
  // Fassung, in der die Frage zuletzt beantwortet wurde (das nächste Mal kommt eine andere)
  readonly variant: number
  // wann sie zuletzt beantwortet wurde: Fällige kommen in dieser Reihenfolge (älteste zuerst)
  readonly answeredAt: number
}

export type ReviewState = {
  // Zahl der gezeigten Aufgaben (alle Themen, auch Mathe und Rechnungen)
  readonly tick: number
  // zuletzt gezeigte Aufgabe („Thema:Stufe:Nummer"): Neuladen zählt nicht als neue Aufgabe
  readonly last: string | null
  // „Thema:Fragennummer" → Stand der Frage
  readonly items: Readonly<Record<string, ReviewItem>>
}

export const EMPTY_REVIEWS: ReviewState = { tick: 0, last: null, items: {} }

export const reviewKey = (course: string, no: number) => `${course}:${no}`

// Eine Aufgabe wird gezeigt: Zähler weiter, außer es ist dieselbe wie zuletzt
export function noteShown(state: ReviewState, shown: string): ReviewState {
  return shown === state.last ? state : { ...state, tick: state.tick + 1, last: shown }
}

export const isDue = (item: ReviewItem, tick: number, now: number) => tick >= item.dueTick && now >= item.dueAt

// Eine Frage wurde fertig beantwortet; correct: ohne Fehlversuch
export function afterAnswer(state: ReviewState, key: string, correct: boolean, variant: number, now: number): ReviewState {
  const item = state.items[key]
  if (!correct) {
    const next: ReviewItem = { box: 0, dueTick: state.tick + REVIEW_AFTER_TASKS, dueAt: now, variant, answeredAt: now }
    return { ...state, items: { ...state.items, [key]: next } }
  }
  if (!item || !isDue(item, state.tick, now)) return state
  if (item.box >= LAST_BOX) {
    const { [key]: _done, ...rest } = state.items
    return { ...state, items: rest }
  }
  const box = item.box + 1
  const next: ReviewItem = { box, dueTick: 0, dueAt: now + REVIEW_DAYS[box - 1] * DAY_MS, variant, answeredAt: now }
  return { ...state, items: { ...state.items, [key]: next } }
}

export type DueQuestion = { readonly no: number; readonly variant: number; readonly answeredAt: number }

// Wiederholung eines Themas: fällige Fragen (älteste zuerst) und solche, die noch warten (die kommen
// nicht dran, bevor sie fällig sind)
export type CourseReviews = { readonly due: readonly DueQuestion[]; readonly waiting: ReadonlySet<number> }

export function courseReviews(state: ReviewState, course: string, now: number): CourseReviews {
  const due: DueQuestion[] = []
  const waiting = new Set<number>()
  const prefix = `${course}:`
  for (const [key, item] of Object.entries(state.items)) {
    if (!key.startsWith(prefix)) continue
    const no = Number(key.slice(prefix.length))
    if (isDue(item, state.tick, now)) due.push({ no, variant: item.variant, answeredAt: item.answeredAt })
    else waiting.add(no)
  }
  due.sort((a, b) => a.answeredAt - b.answeredAt || a.no - b.no)
  return { due, waiting }
}

// Fällige Fragen mehrerer Themen (z. B. aller Themen eines Fachs, „Wiederholen" auf der Startseite, S11), die am
// längsten fällige zuerst (zuletzt beantwortet am längsten her); bei Gleichstand nach Thema und Nummer
export type DueAcross = DueQuestion & { readonly course: string }

export function dueAcross(state: ReviewState, courses: readonly string[], now: number): DueAcross[] {
  return courses
    .flatMap((course) => courseReviews(state, course, now).due.map((d) => ({ ...d, course })))
    .sort((a, b) => a.answeredAt - b.answeredAt || a.course.localeCompare(b.course) || a.no - b.no)
}

// Andere Fassung als beim letzten Mal (andere falsche Antworten und Reihenfolge)
export function otherVariant(variant: number, random: () => number = Math.random): number {
  return (variant + 1 + Math.floor(random() * (VARIANTS - 1))) % VARIANTS
}
