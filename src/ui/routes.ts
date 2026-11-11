import { type Level, type TaskRef, formatTaskNumber, parseTaskNumber } from '../engine/tasks/taskNumber.ts'
import type { PracticeMode } from '../state/storage.ts'
import {
  DERIVATIVES,
  GALLERY_COURSES,
  areaById,
  courseById,
  examAreaOf,
  mockSubjectOf,
  isAreaAvailable,
  isCourseAvailable,
  isMixAvailable,
  subjectById,
  subjectLevelCount,
} from './catalog.ts'

// Seiten der App und ihre Adressen (Teil nach „#"). Absichtlich ohne Mathe-Engine, damit die
// Startseite schnell lädt: Ob es eine Lernkarte oder einen typischen Fehler gibt, prüfen erst die
// Seiten selbst (cards/cardRoute.ts, PracticePage.tsx).
export type Route =
  | { readonly page: 'home' }
  // Formel-Galerie: Übersicht #/galerie, ein Thema #/galerie/brueche
  | { readonly page: 'gallery'; readonly course: string | null }
  | { readonly page: 'settings' }
  | { readonly page: 'progress' }
  // Gebiet #/gebiet/grundlagen, Thema #/thema/brueche (Aufbau in catalog.ts)
  | { readonly page: 'area'; readonly id: string }
  | { readonly page: 'course'; readonly id: string }
  // Lernkarten: Ordner #/karten, ein Ordner #/karten/ableitungen, eine Karte #/karten/ableitungen/product
  | { readonly page: 'cards'; readonly folder: string | null; readonly card: string | null }
  // Üben: ohne Startwert wird eine neue Aufgabe gewürfelt; focus: gezielt einen typischen Fehler üben
  // (Id einer Fehlerregel, noch ungeprüft); mix: Aufgabe aus der Mischung dieses Fachs (Id, geprüft:
  // Fach mit Mischung, das das Thema enthält; mit focus immer null)
  | {
      readonly page: 'practice'
      readonly course: string
      readonly mode: PracticeMode
      readonly level: Level
      readonly seed: number | null
      readonly focus: string | null
      readonly mix: string | null
    }
  // Themen mischen (Fächer mit mix im Katalog): Auswahl #/mischen/chemie
  | { readonly page: 'mix'; readonly subject: string }
  // neue gemischte Aufgabe #/mischen/chemie/2: würfelt Thema und Aufgabe und leitet zur Aufgabe weiter
  // (taskHref mit mix), damit Neuladen dieselbe Aufgabe zeigt
  | { readonly page: 'mixPractice'; readonly subject: string; readonly level: Level }
  // Klausuraufgabe N üben: #/klausur/chemie/aufgabe/4 würfelt eine Nummer und leitet weiter auf
  // #/klausur/chemie/aufgabe/4/123, damit Neuladen dieselbe Aufgabe zeigt
  | { readonly page: 'examTask'; readonly subject: string; readonly task: number; readonly seed: number | null }
  // Probeklausur (S9): Deckblatt #/probeklausur/chemie, eine Klausur #/probeklausur/chemie/4711 (schreiben, solange sie
  // läuft, danach die Auswertung; ist sie nicht die gespeicherte, das Deckblatt dieser Nummer)
  | { readonly page: 'mock'; readonly subject: string; readonly id: number | null }

// Geführt: #/ueben/brueche/2-4711, frei: #/frei/ableiten/2-4711,
// gezielt: #/ueben/ableiten/2-4711?fokus=cos-sign, in der Mischung:
// #/ueben/chem-atombau/2-500123?mischen=chemie. Ältere Adressen ohne Thema (#/ueben/2-4711)
// gehören zu Ableiten, dem ersten Thema.
const PREFIX: Record<PracticeMode, string> = { guided: 'ueben', free: 'frei' }

// Fach der Mischung aus der Adresse: nur ein Fach mit Mischung, zu dem das Thema gehört
function mixOf(id: string | null, course: string): string | null {
  const subject = id ? subjectById(id) : undefined
  return subject && isMixAvailable(subject) && courseById(course)?.subject.id === subject.id ? subject.id : null
}

export function parseRoute(fullPath: string): Route {
  const [path, query = ''] = fullPath.split('?')
  const gallery = /^\/galerie(?:\/([^/]+))?$/.exec(path)
  if (gallery) return { page: 'gallery', course: gallery[1] && GALLERY_COURSES.includes(gallery[1]) ? gallery[1] : null }
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
  const mix = /^\/mischen\/([^/]+)(?:\/([^/]+))?$/.exec(path)
  if (mix) {
    const subject = subjectById(mix[1])
    if (!subject || !isMixAvailable(subject)) return { page: 'home' }
    const level = mix[2]
    if (level !== undefined && /^[1-5]$/.test(level) && Number(level) <= subjectLevelCount(subject)) {
      return { page: 'mixPractice', subject: subject.id, level: Number(level) as Level }
    }
    // ohne oder mit unbekannter Stufe: zur Auswahl
    return { page: 'mix', subject: subject.id }
  }
  const exam = /^\/klausur\/([a-z]+)\/aufgabe\/(\d)(?:\/(\d{1,9}))?$/.exec(path)
  if (exam) {
    const found = examAreaOf(exam[1], Number(exam[2]))
    if (!found) return { page: 'home' }
    return { page: 'examTask', subject: found.subject.id, task: Number(exam[2]), seed: exam[3] ? Number(exam[3]) : null }
  }
  const mock = /^\/probeklausur\/([a-z]+)(?:\/(\d{1,5}))?$/.exec(path)
  if (mock) {
    const subject = mockSubjectOf(mock[1])
    if (!subject) return { page: 'home' }
    const id = mock[2] ? Number(mock[2]) : null
    return { page: 'mock', subject: subject.id, id: id === 0 ? null : id }
  }
  const cards = /^\/karten(?:\/([^/]+))?(?:\/([^/]+))?$/.exec(path)
  if (cards) return { page: 'cards', folder: cards[1] ?? null, card: cards[2] ?? null }
  const practice = /^\/(ueben|frei)\/(?:([a-z-]+)\/)?([^/]+)$/.exec(path)
  if (practice) {
    const [, prefix, course = DERIVATIVES, number] = practice
    const found = courseById(course)
    if (!found || !isCourseAvailable(found.course)) return { page: 'home' }
    const mode: PracticeMode = prefix === 'frei' ? 'free' : 'guided'
    const params = new URLSearchParams(query)
    const focus = params.get('fokus') || null
    // gezielt üben und Mischung zusammen: gezielt üben gewinnt
    const mix = focus ? null : mixOf(params.get('mischen'), course)
    const ref = parseTaskNumber(number)
    if (ref) return { page: 'practice', course, mode, level: ref.level, seed: ref.seed, focus, mix }
    if (/^[1-5]$/.test(number)) return { page: 'practice', course, mode, level: Number(number) as Level, seed: null, focus, mix }
  }
  return { page: 'home' }
}

// Zusatz einer Aufgabenadresse: gezielt üben (?fokus=) oder Mischung (?mischen=); gezielt üben gewinnt
const practiceQuery = (focus?: string | null, mix?: string | null) => (focus ? `?fokus=${focus}` : mix ? `?mischen=${mix}` : '')

// mix: Id des Fachs, wenn die Aufgabe aus der Mischung kommt
export const practiceHref = (course: string, level: Level, mode: PracticeMode = 'guided', focus?: string | null, mix?: string | null) =>
  `#/${PREFIX[mode]}/${course}/${level}${practiceQuery(focus, mix)}`
export const taskHref = (course: string, ref: TaskRef, mode: PracticeMode = 'guided', focus?: string | null, mix?: string | null) =>
  `#/${PREFIX[mode]}/${course}/${formatTaskNumber(ref)}${practiceQuery(focus, mix)}`

// Themen mischen: Auswahl eines Fachs und neue gemischte Aufgabe in einer Stufe
export const mixHref = (subject: string) => `#/mischen/${subject}`
export const mixPracticeHref = (subject: string, level: Level) => `#/mischen/${subject}/${level}`

export const areaHref = (id: string) => `#/gebiet/${id}`
export const examTaskHref = (subject: string, task: number, seed?: number) => `#/klausur/${subject}/aufgabe/${task}${seed === undefined ? '' : `/${seed}`}`
export const mockHref = (subject: string, id?: number) => `#/probeklausur/${subject}${id === undefined ? '' : `/${id}`}`
export const galleryHref = (course?: string) => (course ? `#/galerie/${course}` : '#/galerie')
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
    case 'mix':
      return 'home'
    // Deckblatt der Probeklausur zum Start, die Klausur selbst zu keinem Bereich
    case 'mock':
      return route.id === null ? 'home' : null
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
