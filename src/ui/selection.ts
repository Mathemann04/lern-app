import type { Level } from '../engine/tasks/taskNumber.ts'
import { DEFAULT_MIX, type MixChoice, type PracticeMode, type Settings } from '../state/storage.ts'
import { type Course, type Subject, isFreeAt, isLevelAvailable, levelName, mixCourses, partsAvailable, subjectLevelCount, subjectLevelName } from './catalog.ts'

// Was drankommt (S1b): angekreuzte Unterthemen eines Themas und die Auswahl der Mischung eines Fachs,
// gelesen aus den Einstellungen (state/storage.ts: skipParts, mix). Ohne Engine und ohne KaTeX, damit
// Startseite, Themenseite und Mischseite sie nutzen können. Die Wahl der Aufgabe selbst steht in
// practice.ts (pickNewSeed) und mix.ts (pickMixed).

type PartSettings = Pick<Settings, 'skipParts'>

// Art, mit der in der Stufe geübt wird: ohne freien Modus geführt (auch in Chemie-Stufen ohne Rechnung zum Eintippen)
export const modeAt = (course: Course, level: Level, chosen: PracticeMode): PracticeMode => (isFreeAt(course, level) ? chosen : 'guided')
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

// Gibt es in der Stufe Aufgaben zu diesen angekreuzten Unterthemen bzw. Bausteinen? Unterthemen (Chemie): mindestens ein
// angekreuztes hat dort Aufgaben. Bausteine (M6): Eine Aufgabe kommt nur dran, wenn alle ihre Bausteine angekreuzt sind;
// es muss also eine Menge aus blockCombos ganz angekreuzt sein.
function hasTasks(course: Course, checked: ReadonlySet<string>, level: Level): boolean {
  if (course.blockCombos) return (course.blockCombos[level] ?? []).some((combo) => combo.every((id) => checked.has(id)))
  return partsAvailable(course, level).some((part) => checked.has(part.id))
}

// Lässt sich das Thema in der Stufe mit dieser Auswahl üben? Die Stufe muss spielbar sein, und bei
// Themen mit Unterthemen oder Bausteinen muss es zur Auswahl in der Stufe Aufgaben geben (sonst ist der
// Knopf „Üben" nicht klickbar).
export function isSelectionPlayable(course: Course, settings: PartSettings, level: Level): boolean {
  if (!isLevelAvailable(course, level)) return false
  if (!course.parts) return true
  return hasTasks(course, new Set(checkedParts(course, settings)), level)
}

// Erlaubte Unterthemen für die Engine (nextSeed, questionNos, pickNewSeed): undefined heißt alle. Alle
// angekreuzt, nichts angekreuzt oder (mit Stufe) kein angekreuztes mit Aufgaben in der Stufe: Rückfall auf
// alle, wie in der Engine, damit „Weitermachen" nie hängt. Bausteine (M6) nie mit Rückfall: Eine Aufgabe mit nicht
// angekreuztem Baustein darf nicht kommen; ist die Auswahl in der Stufe nicht spielbar, zeigt die Übungsseite einen
// Hinweis statt einer Aufgabe (PracticePage.tsx), „Eine Stufe höher?" schlägt solche Stufen nicht vor.
export function selectedParts(course: Course, settings: PartSettings, level?: Level): ReadonlySet<string> | undefined {
  if (!course.parts || allPartsChecked(course, settings)) return undefined
  const checked = new Set(checkedParts(course, settings))
  if (course.blockCombos) return checked
  if (checked.size === 0) return undefined
  if (level !== undefined && !hasTasks(course, checked, level)) return undefined
  return checked
}

// Bausteine statt Unterthemen (M6): Wörter für Texte wie „3 von 5 Bausteinen"
export function partWords(course: Course): { readonly one: string; readonly a: string; readonly many: string; readonly dative: string } {
  return course.blockCombos
    ? { one: 'Baustein', a: 'einen Baustein', many: 'Bausteine', dative: 'Bausteinen' }
    : { one: 'Unterthema', a: 'ein Unterthema', many: 'Unterthemen', dative: 'Unterthemen' }
}

// Bausteine, die man dazu ankreuzen kann, damit es in der Stufe Aufgaben zur Auswahl gibt (M6): je einer, der mit
// angekreuzten eine Menge aus blockCombos vollständig macht, in der auch ein angekreuzter vorkommt (sonst kämen nur Aufgaben
// zum neuen Baustein, z. B. Lineare Gleichungen statt Determinanten); in der Reihenfolge der Liste, leer, wenn keiner reicht
export function missingBlocks(course: Course, settings: PartSettings, level: Level): readonly string[] {
  if (!course.blockCombos || !course.parts) return []
  const checked = new Set(checkedParts(course, settings))
  const combos = course.blockCombos[level] ?? []
  return course.parts
    .filter((part) => !checked.has(part.id))
    .filter((part) => combos.some((combo) => combo.includes(part.id) && combo.some((id) => checked.has(id)) && combo.every((id) => id === part.id || checked.has(id))))
    .map((part) => part.title)
}

// Stufen, in denen es zur Auswahl Aufgaben gibt (für den Knopf „Stufe 3 wählen")
export function playableLevels(course: Course, settings: PartSettings): readonly Level[] {
  return course.levels.filter((l) => isSelectionPlayable(course, settings, l.level)).map((l) => l.level)
}

// Aufzählung mit „oder": „A", „A oder B", „A, B oder C"
const orList = (titles: readonly string[]) => (titles.length > 1 ? `${titles.slice(0, -1).join(', ')} oder ${titles.at(-1)}` : (titles[0] ?? ''))

// Warum der Üben-Knopf gesperrt ist (Seite einer Tätigkeit, „Weitermachen", Übungsseite): nichts angekreuzt; sonst mit
// Bausteinen (M6), was hilft, und nur, was wirklich hilft: ein Baustein, der in dieser Stufe dazu reicht; sonst die Stufen,
// in denen es zur Auswahl Aufgaben gibt; sonst eine Stufe, in der ein Baustein mehr reicht
export function blockedHint(course: Course, settings: PartSettings, level: Level): string {
  const words = partWords(course)
  if (checkedParts(course, settings).length === 0) return `Kreuze mindestens ${words.a} an.`
  const where = levelName(course.id, level)
  if (!course.blockCombos) return `Kreuze mindestens ${words.a} an, das es in ${where} gibt.`
  const none = `Zu deiner Auswahl gibt es in ${where} keine Aufgaben.`
  const missing = missingBlocks(course, settings, level)
  if (missing.length > 0) return `${none} Kreuze dazu z. B. ${orList(missing.slice(0, 3))} an.`
  const elsewhere = playableLevels(course, settings).filter((l) => l !== level)
  if (elsewhere.length > 0) return `${none} In ${joinTitles(elsewhere.map((l) => levelName(course.id, l)))} gibt es welche.`
  const other = course.levels.map((l) => l.level).find((l) => l !== level && missingBlocks(course, settings, l).length > 0)
  if (other !== undefined) {
    return `${none} In ${levelName(course.id, other)} gibt es welche, wenn du z. B. ${orList(missingBlocks(course, settings, other).slice(0, 3))} dazu ankreuzt.`
  }
  return `${none} Kreuze mehr ${words.many} an.`
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
  return count ? `${course.title} (${count.checked} von ${count.total} ${partWords(course).dative})` : course.title
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
