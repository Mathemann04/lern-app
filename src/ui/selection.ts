import type { Level } from '../engine/tasks/taskNumber.ts'
import { DEFAULT_MIX, type MixChoice, type Settings } from '../state/storage.ts'
import { type Course, type Subject, isLevelAvailable, mixCourses, partsAvailable, subjectLevelCount, subjectLevelName } from './catalog.ts'

// Was drankommt (S1b): angekreuzte Unterthemen eines Themas und die Auswahl der Mischung eines Fachs,
// gelesen aus den Einstellungen (state/storage.ts: skipParts, mix). Ohne Engine und ohne KaTeX, damit
// Startseite, Themenseite und Mischseite sie nutzen können. Die Wahl der Aufgabe selbst steht in
// practice.ts (pickNewSeed) und mix.ts (pickMixed).

type PartSettings = Pick<Settings, 'skipParts'>
type MixSettings = Pick<Settings, 'skipParts' | 'mix'>

// Ids der angekreuzten Unterthemen eines Themas in der Reihenfolge der Anzeige, ohne Rückfall (für die
// Kästchen und „3 von 5 Unterthemen"); leer bei Themen ohne Unterthemen
export function checkedParts(course: Course, settings: PartSettings): readonly string[] {
  const skip = settings.skipParts[course.id] ?? []
  return (course.parts ?? []).filter((part) => !skip.includes(part.id)).map((part) => part.id)
}

// Ist das Unterthema angekreuzt? (Unbekannte Ids im Speicher stören nicht.)
export function isPartChecked(course: Course, part: string, settings: PartSettings): boolean {
  return !(settings.skipParts[course.id] ?? []).includes(part)
}

// Sind alle Unterthemen angekreuzt? Auch wahr bei Themen ohne Unterthemen.
export function allPartsChecked(course: Course, settings: PartSettings): boolean {
  return checkedParts(course, settings).length === (course.parts ?? []).length
}

// Lässt sich das Thema in der Stufe mit dieser Auswahl üben? Die Stufe muss spielbar sein, und bei
// Themen mit Unterthemen muss mindestens ein angekreuztes in der Stufe Aufgaben haben (sonst ist der
// Knopf „Üben" nicht klickbar).
export function isSelectionPlayable(course: Course, settings: PartSettings, level: Level): boolean {
  if (!isLevelAvailable(course, level)) return false
  if (!course.parts) return true
  const checked = new Set(checkedParts(course, settings))
  return partsAvailable(course, level).some((part) => checked.has(part.id))
}

// Erlaubte Unterthemen für die Engine (nextSeed, questionNos, pickNewSeed): undefined heißt alle. Alle
// angekreuzt, nichts angekreuzt oder (mit Stufe) kein angekreuztes mit Aufgaben in der Stufe: Rückfall auf
// alle, wie in der Engine, damit „Weitermachen" nie hängt.
export function selectedParts(course: Course, settings: PartSettings, level?: Level): ReadonlySet<string> | undefined {
  if (!course.parts || allPartsChecked(course, settings)) return undefined
  const checked = new Set(checkedParts(course, settings))
  if (checked.size === 0) return undefined
  if (level !== undefined && !partsAvailable(course, level).some((part) => checked.has(part.id))) return undefined
  return checked
}

// Auswahl der Mischung eines Fachs: die gemerkte, sonst Stufe 1 mit allen Themen. Eine Stufe, die das
// Fach nicht hat, wird Stufe 1.
export function mixChoiceOf(subject: Subject, settings: Pick<Settings, 'mix'>): MixChoice {
  const choice = settings.mix[subject.id] ?? DEFAULT_MIX
  return choice.level <= subjectLevelCount(subject) ? choice : { ...choice, level: DEFAULT_MIX.level }
}

// Ist das Thema in der Mischung des Fachs angekreuzt?
export function isMixCourseChecked(subject: Subject, course: Course, settings: Pick<Settings, 'mix'>): boolean {
  return !mixChoiceOf(subject, settings).skip.includes(course.id)
}

// Themen, die in der Mischung drankommen, in der Reihenfolge der Startseite: angekreuzt, in der Stufe
// spielbar und mit Aufgaben zu den angekreuzten Unterthemen (isSelectionPlayable). Ohne Stufe die der
// Mischung. Leer: Es gibt nichts zu üben („Gemischt üben" nicht klickbar, Übungsseite mit Hinweis).
export function mixedCourses(subject: Subject, settings: MixSettings, level: Level = mixChoiceOf(subject, settings).level): readonly Course[] {
  return mixCourses(subject)
    .map(({ course }) => course)
    .filter((course) => isMixCourseChecked(subject, course, settings) && isSelectionPlayable(course, settings, level))
}

// Angekreuzte Unterthemen unter denen, die es in der Stufe gibt: „2 von 3" (Themenseite, „Weitermachen",
// Mischung). Gezählt wird nur in der Stufe, denn Unterthemen anderer Stufen kommen dort ohnehin nicht dran.
// null: Dort ist alles angekreuzt (oder das Thema hat keine Unterthemen).
export function levelPartCount(course: Course, settings: PartSettings, level: Level): { readonly checked: number; readonly total: number } | null {
  const inLevel = partsAvailable(course, level)
  const checked = inLevel.filter((part) => isPartChecked(course, part.id, settings)).length
  return checked < inLevel.length ? { checked, total: inLevel.length } : null
}

// Name eines Themas mit seiner Auswahl in der Stufe, z. B. „Atombau (2 von 4 Unterthemen)"; ohne
// Zusatz, wenn dort alle Unterthemen angekreuzt sind (Mischseite, „Weitermachen")
export function courseSummary(course: Course, settings: PartSettings, level: Level): string {
  const count = levelPartCount(course, settings, level)
  return count ? `${course.title} (${count.checked} von ${count.total} Unterthemen)` : course.title
}

// Hinweis, wenn in der Mischung nichts drankommt (mixedCourses leer): Liegt es an den Unterthemen eines
// angekreuzten Themas, das es in der Stufe gibt, nennt er dieses Thema, sonst fehlt ein Thema. below:
// Die Kästchen stehen auf derselben Seite weiter unten (Mischseite).
export function mixBlockedHint(subject: Subject, settings: MixSettings, level: Level, below = false): string {
  const levelTitle = subjectLevelName(subject, level)
  const where = below ? 'unten ' : ''
  const blocked = mixCourses(subject)
    .map(({ course }) => course)
    .filter((course) => isMixCourseChecked(subject, course, settings) && isLevelAvailable(course, level) && !isSelectionPlayable(course, settings, level))
  return blocked.length > 0
    ? `Kreuze ${where}bei ${joinTitles(blocked.map((course) => course.title))} mindestens ein Unterthema an, das es in ${levelTitle} gibt.`
    : `Kreuze ${where}mindestens ein Thema an, das es in ${levelTitle} gibt.`
}

// Aufzählung: „A", „A und B", „A, B und C"
export function joinTitles(titles: readonly string[]): string {
  if (titles.length <= 1) return titles.join('')
  return `${titles.slice(0, -1).join(', ')} und ${titles[titles.length - 1]}`
}
