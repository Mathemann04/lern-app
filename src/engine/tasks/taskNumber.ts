// Aufgaben-Nummer: Stufe und Startwert, z. B. „3-48213".
// Dieselbe Nummer erzeugt immer dieselbe Aufgabe.

export type Level = 1 | 2 | 3 | 4 | 5
export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5]

export type TaskRef = { readonly level: Level; readonly seed: number }

export const MAX_SEED = 999_999

export function formatTaskNumber(ref: TaskRef): string {
  return `${ref.level}-${ref.seed}`
}

export function parseTaskNumber(text: string): TaskRef | null {
  const match = /^\s*([1-5])\s*[-–]\s*(\d{1,6})\s*$/.exec(text)
  if (!match) return null
  const seed = Number(match[2])
  if (seed < 1) return null
  return { level: Number(match[1]) as Level, seed }
}

export function randomSeed(): number {
  return 1 + Math.floor(Math.random() * MAX_SEED)
}
