import { BLOCK_CODES } from './blocks.ts'

// Aufgaben-Nummer: Stufe und Startwert, z. B. „3-48213". Dieselbe Nummer erzeugt immer dieselbe Aufgabe.
// Aufgaben eines einzelnen Bausteins (M6 Schritt 4) tragen ihn vorn: „exp.1-4711". Intern steckt der Baustein im
// Startwert (feste Nummer aus BLOCK_CODES mal BLOCK_SEED_BASE plus Startwert), damit Speicher, Adressen und Ziehen
// weiter mit einer Zahl auskommen.

export type Level = 1 | 2 | 3 | 4 | 5
export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5]

export type TaskRef = { readonly level: Level; readonly seed: number }

export const MAX_SEED = 999_999
export const BLOCK_SEED_BASE = 1_000_000

const BLOCK_IDS = new Map(Object.entries(BLOCK_CODES).map(([id, code]) => [code, id]))

// Startwert einer Aufgabe des Bausteins block (s von 1 bis MAX_SEED)
export function blockSeed(block: string, s: number): number {
  const code = BLOCK_CODES[block]
  if (code === undefined) throw new Error(`Unbekannter Baustein ${block}`)
  return code * BLOCK_SEED_BASE + s
}

// Baustein und eigentlicher Startwert einer Nummer; null bei Nummern ohne Baustein
export function seedBlock(seed: number): { readonly block: string; readonly s: number } | null {
  if (seed <= MAX_SEED) return null
  const block = BLOCK_IDS.get(Math.floor(seed / BLOCK_SEED_BASE))
  const s = seed % BLOCK_SEED_BASE
  return block && s >= 1 ? { block, s } : null
}

export function formatTaskNumber(ref: TaskRef): string {
  const own = seedBlock(ref.seed)
  return own ? `${own.block}.${ref.level}-${own.s}` : `${ref.level}-${ref.seed}`
}

export function parseTaskNumber(text: string): TaskRef | null {
  const match = /^\s*(?:([a-z]+)\.)?([1-5])\s*[-–]\s*(\d{1,6})\s*$/.exec(text)
  if (!match) return null
  const s = Number(match[3])
  if (s < 1) return null
  const level = Number(match[2]) as Level
  if (!match[1]) return { level, seed: s }
  return BLOCK_CODES[match[1]] === undefined ? null : { level, seed: blockSeed(match[1], s) }
}

export function randomSeed(): number {
  return 1 + Math.floor(Math.random() * MAX_SEED)
}
