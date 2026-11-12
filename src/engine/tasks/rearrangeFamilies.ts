import { FORMULA_TASKS } from './formulas.ts'
import { REARRANGE_COMBOS } from './rearrangeCombos.ts'
import type { Level } from './taskNumber.ts'

// Aufgaben eines einzelnen Bausteins beim Umstellen (M6 Schritt 4): je Baustein die Stufen, in denen er eigene Aufgaben
// hat (Nummern wie „exp.1-4711", gebaut in rearrangeBlockKit.ts). Dort, wo die älteren Vorlagen genug Aufgaben mit nur
// diesem Baustein haben (laut Verzeichnis rearrangeIndex.ts), kommen sie von dort. Reine Daten ohne Engine, damit die
// Seiten ohne Mathe-Engine wissen, welche Bausteine in welcher Stufe allein gehen.
export const REARRANGE_FAMILY_LEVELS: Readonly<Record<string, readonly Level[]>> = {
  linear: [3, 4, 5],
  brueche: [1, 4, 5],
  wurzeln: [1, 2, 3, 4, 5],
  potenzen: [1, 2, 3, 4, 5],
  exp: [1, 2, 3, 5],
  log: [1, 2, 3, 5],
  quadratisch: [1, 2, 3, 4, 5],
  winkel: [1, 2, 3, 5],
  hyperbel: [1, 2, 3, 4, 5],
}

export const hasRearrangeFamily = (block: string, level: Level) => REARRANGE_FAMILY_LEVELS[block]?.includes(level) ?? false

// Bausteine mit eigenen Aufgaben in einer Stufe
export const familyBlocks = (level: Level): string[] => Object.keys(REARRANGE_FAMILY_LEVELS).filter((block) => hasRearrangeFamily(block, level))

// Mengen von Bausteinen, die in einer Stufe zusammen in einer Aufgabe vorkommen: aus dem Verzeichnis, je Baustein mit
// eigenen Aufgaben dieser allein und aus der Formelsammlung (für die Seiten: welche Auswahl spielbar ist)
const formulaCombos = (level: Level) => FORMULA_TASKS.filter((task) => task.level === level).map((task) => task.blocks.join('+'))
const playable = (level: Level): readonly string[] => [...new Set([...REARRANGE_COMBOS[level], ...familyBlocks(level), ...formulaCombos(level)])]
export const REARRANGE_PLAYABLE_COMBOS: Readonly<Record<Level, readonly string[]>> = {
  1: playable(1),
  2: playable(2),
  3: playable(3),
  4: playable(4),
  5: playable(5),
}
