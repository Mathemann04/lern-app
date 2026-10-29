import { ERROR_RULES } from '../engine/derive/errorRules.ts'
import { createRng } from '../engine/random/rng.ts'
import { findTaskWithError } from '../engine/tasks/focus.ts'
import { type Level, randomSeed } from '../engine/tasks/taskNumber.ts'
import type { PracticeMode } from '../state/storage.ts'
import { taskHref } from './routes.ts'
import { derivativeLevels } from './samples.ts'

// Gezielt üben nur mit bekannten Fehlern; alles andere ist normales Üben
export const knownFocus = (focus: string | null) => (focus && ERROR_RULES.some((r) => r.id === focus) ? focus : null)

// Stufen für gezieltes Üben: zuerst die gewählte, dann die nächstgelegenen
function levelsNear(level: Level): Level[] {
  return derivativeLevels
    .filter((l) => l.available)
    .map((l) => l.level)
    .sort((a, b) => Math.abs(a - level) - Math.abs(b - level) || a - b)
}

// Adresse einer neuen Aufgabe
export function newTaskHref(mode: PracticeMode, level: Level, focus: string | null): string {
  // Gezielt üben: eine Aufgabe, in der genau dieser Fehler passieren kann
  const found = focus ? findTaskWithError(focus, levelsNear(level), createRng(String(Math.random()))) : null
  return taskHref(found ?? { level, seed: randomSeed() }, mode, found ? focus : null)
}
