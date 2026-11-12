import { REARRANGE_COMBOS } from './rearrangeCombos.ts'
import { REARRANGE_INDEX_CODES, REARRANGE_INDEX_WIDTH } from './rearrangeIndex.ts'
import { INDEX_ALPHABET } from './rearrangeIndexFormat.ts'
import { type Level, randomSeed } from './taskNumber.ts'

// Neue Umstell-Aufgabe zu angekreuzten Bausteinen (M6 Schritt 3): aus dem Verzeichnis (rearrangeIndex.ts, erzeugt von
// scripts/rearrange-index.ts) die Nummern, deren Bausteine alle angekreuzt sind. Die Aufgaben selbst kommen unverändert
// aus generateRearrangeTask; das Verzeichnis sagt nur, welche Nummer welche Bausteine hat.

// Stelle der Kombination (in REARRANGE_COMBOS) je Nummer: Nummer n steht an Stelle n − 1
const decoded = new Map<Level, Uint16Array>()

function comboPositions(level: Level): Uint16Array {
  let positions = decoded.get(level)
  if (!positions) {
    const codes = REARRANGE_INDEX_CODES[level]
    const width = REARRANGE_INDEX_WIDTH[level]
    const base = INDEX_ALPHABET.length
    positions = new Uint16Array(codes.length / width)
    for (let i = 0; i < positions.length; i++) {
      const at = i * width
      positions[i] = width === 1 ? INDEX_ALPHABET.indexOf(codes[at]) : INDEX_ALPHABET.indexOf(codes[at]) * base + INDEX_ALPHABET.indexOf(codes[at + 1])
    }
    decoded.set(level, positions)
  }
  return positions
}

// Zahl der Nummern im Verzeichnis einer Stufe
export const indexSize = (level: Level) => comboPositions(level).length

// Bausteine der Aufgabe laut Verzeichnis; null, wenn die Nummer nicht darin steht
export function indexedBlocks(level: Level, seed: number): readonly string[] | null {
  const positions = comboPositions(level)
  if (!Number.isInteger(seed) || seed < 1 || seed > positions.length) return null
  return REARRANGE_COMBOS[level][positions[seed - 1]].split('+')
}

// Nummern der Stufe, deren Bausteine alle in blocks stehen (je Auswahl zwischengespeichert)
const pools = new Map<string, readonly number[]>()

export function rearrangePool(level: Level, blocks: ReadonlySet<string>): readonly number[] {
  const key = `${level}:${[...blocks].sort().join('+')}`
  let pool = pools.get(key)
  if (!pool) {
    const allowed = REARRANGE_COMBOS[level].map((combo) => combo.split('+').every((id) => blocks.has(id)))
    const positions = comboPositions(level)
    const seeds: number[] = []
    for (let i = 0; i < positions.length; i++) if (allowed[positions[i]]) seeds.push(i + 1)
    pool = seeds
    pools.set(key, pool)
  }
  return pool
}

// Nummer einer neuen Aufgabe: ohne Auswahl (undefined: alle Bausteine) eine beliebige wie bisher; sonst eine aus dem
// Verzeichnis, deren Bausteine alle angekreuzt sind. Gibt es keine, eine beliebige (wie bei den Unterthemen der Chemie:
// passt nichts, gelten alle; die Seiten sperren den Üben-Knopf vorher).
export function nextRearrangeSeed(level: Level, blocks?: ReadonlySet<string>, random: () => number = Math.random): number {
  if (!blocks) return randomSeed()
  const pool = rearrangePool(level, blocks)
  return pool.length > 0 ? pool[Math.floor(random() * pool.length)] : randomSeed()
}
