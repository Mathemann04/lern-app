import { isErrorOf } from '../engine/errorCatalog.ts'
import { decodeSeed } from '../engine/quiz/numbers.ts'
import { type Rng, createRng } from '../engine/random/rng.ts'
import { type Level, type TaskRef, randomSeed } from '../engine/tasks/taskNumber.ts'
import { pickFresh } from '../engine/tasks/variety.ts'
import type { PracticeMode } from '../state/storage.ts'
import { type Course, DERIVATIVES, FRACTIONS, REARRANGE, courseById, isChemCourse } from './catalog.ts'
import type { CourseEngine } from './courseEngines.ts'
import { taskHref } from './routes.ts'

// Gezielt üben nur mit bekannten Fehlern des Themas, wenn es das dort schon gibt; alles andere ist
// normales Üben
export function knownFocus(course: string, focus: string | null): string | null {
  return focus && courseById(course)?.course.focus && isErrorOf(course, focus) ? focus : null
}

// Stufen für gezieltes Üben: zuerst die gewählte, dann die nächstgelegenen spielbaren
function levelsNear(course: Course, level: Level): Level[] {
  return course.levels
    .filter((l) => l.available)
    .map((l) => l.level)
    .sort((a, b) => Math.abs(a - level) - Math.abs(b - level) || a - b)
}

// Suche je Thema nach einer Aufgabe, in der der Fehler passieren kann; erst beim gezielten Üben geladen (die
// Suche braucht die Engine des Themas)
type Finder = (errorId: string, levels: readonly Level[], rng: Rng) => TaskRef | null
const FINDERS: Readonly<Record<string, () => Promise<Finder>>> = {
  [DERIVATIVES]: async () => (await import('../engine/tasks/focus.ts')).findTaskWithError,
  [FRACTIONS]: async () => (await import('../engine/tasks/fractionFocus.ts')).findFractionTaskWithError,
  [REARRANGE]: async () => (await import('../engine/tasks/rearrangeFocus.ts')).findRearrangeTaskWithError,
}

// Chemie: dieselbe Suche für alle Themen (Fragen und Rechnungen)
const chemFinder = (course: string) => async (): Promise<Finder> => {
  const { findChemTaskWithError } = await import('../engine/chem/focus.ts')
  return (errorId, levels, rng) => findChemTaskWithError(course, errorId, levels, rng)
}

// Adresse einer neuen Aufgabe
export async function newTaskHref(course: string, mode: PracticeMode, level: Level, focus: string | null): Promise<string> {
  // Gezielt üben: eine Aufgabe, in der genau dieser Fehler passieren kann
  const load = focus ? (FINDERS[course] ?? (isChemCourse(course) ? chemFinder(course) : undefined)) : undefined
  const find = load && (await load())
  const found = focus && find ? find(focus, levelsNear(courseById(course)!.course, level), createRng(String(Math.random()))) : null
  return taskHref(course, found ?? { level, seed: randomSeed() }, mode, found ? focus : null)
}

// Nummer der Wissensfrage hinter einer Aufgabe; null bei allem anderen (Mathe-Aufgaben, Rechnungen)
export function questionNoOf(engine: Pick<CourseEngine, 'nextSeed'>, seed: number): number | null {
  const decoded = engine.nextSeed ? decodeSeed(seed) : null
  return decoded?.kind === 'question' ? decoded.no : null
}

// Nummer einer neuen Aufgabe, deren Form nicht unter den letzten dieser Stufe ist (recent, pickFresh).
// Wissensfragen kommen dabei reihum: shown sind die Fragen, die in der laufenden Runde schon dran
// waren, die Engine wählt unter den übrigen. parts: angekreuzte Unterthemen (ui/selection.ts,
// selectedParts; ohne Angabe alle). newRound: Alle (der Auswahl) waren dran, die gewählte Frage beginnt
// eine neue Runde; dann startNewRound(course, level, engine.questionNos(level, parts)) aufrufen, damit nur
// die Fragen der Auswahl von vorn beginnen.
export function pickNewSeed(
  engine: Pick<CourseEngine, 'formOf' | 'nextSeed'>,
  level: Level,
  recent: readonly string[],
  shown: ReadonlySet<number>,
  parts?: ReadonlySet<string>,
): { seed: number; newRound: boolean } {
  const next = engine.nextSeed ? () => engine.nextSeed!(level, shown, parts) : randomSeed
  const seed = pickFresh((s) => engine.formOf({ level, seed: s }), recent, next)
  const no = questionNoOf(engine, seed)
  return { seed, newRound: no !== null && shown.has(no) }
}
