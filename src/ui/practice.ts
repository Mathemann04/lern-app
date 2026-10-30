import { isErrorOf } from '../engine/errorCatalog.ts'
import { type Rng, createRng } from '../engine/random/rng.ts'
import { findFractionTaskWithError } from '../engine/tasks/fractionFocus.ts'
import { findTaskWithError } from '../engine/tasks/focus.ts'
import { type Level, type TaskRef, randomSeed } from '../engine/tasks/taskNumber.ts'
import type { PracticeMode } from '../state/storage.ts'
import { type Course, DERIVATIVES, FRACTIONS, courseById } from './catalog.ts'
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

// Suche je Thema nach einer Aufgabe, in der der Fehler passieren kann
const FINDERS: Readonly<Record<string, (errorId: string, levels: readonly Level[], rng: Rng) => TaskRef | null>> = {
  [DERIVATIVES]: findTaskWithError,
  [FRACTIONS]: findFractionTaskWithError,
}

// Adresse einer neuen Aufgabe
export function newTaskHref(course: string, mode: PracticeMode, level: Level, focus: string | null): string {
  // Gezielt üben: eine Aufgabe, in der genau dieser Fehler passieren kann
  const find = FINDERS[course]
  const found = focus && find ? find(focus, levelsNear(courseById(course)!.course, level), createRng(String(Math.random()))) : null
  return taskHref(course, found ?? { level, seed: randomSeed() }, mode, found ? focus : null)
}
