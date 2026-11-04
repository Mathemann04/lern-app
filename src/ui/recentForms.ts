import { browserStore } from '../state/storage.ts'

// Formen der zuletzt gezeigten Aufgaben je Thema und Stufe (Abwechslung, engine/tasks/variety.ts).
// Eigener kleiner Eintrag neben dem Speicherstand; fehlt er oder ist er kaputt, fängt die Liste
// leer an. Nur für die Auswahl der nächsten Aufgabe, nicht für den Fortschritt.

const KEY = 'rechenweg-formen'
export const RECENT_FORMS = 10

type Recent = Record<string, string[]>

function load(): Recent {
  try {
    const raw = JSON.parse(browserStore()?.getItem(KEY) ?? '{}') as unknown
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
    const out: Recent = {}
    for (const [k, v] of Object.entries(raw)) if (Array.isArray(v)) out[k] = v.filter((f): f is string => typeof f === 'string').slice(-RECENT_FORMS)
    return out
  } catch {
    return {}
  }
}

const keyOf = (course: string, level: number) => `${course}:${level}`

export const recentForms = (course: string, level: number): readonly string[] => load()[keyOf(course, level)] ?? []

export function rememberForm(course: string, level: number, form: string) {
  const all = load()
  const list = [...(all[keyOf(course, level)] ?? []), form].slice(-RECENT_FORMS)
  try {
    browserStore()?.setItem(KEY, JSON.stringify({ ...all, [keyOf(course, level)]: list }))
  } catch {
    // Speichern verboten: dann eben ohne Gedächtnis
  }
}
