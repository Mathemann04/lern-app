import { REARRANGE_BLOCKS } from './blocks.ts'
import { FORMULA_TASKS } from './formulas.ts'
import { REARRANGE_COMBOS } from './rearrangeCombos.ts'
import { hasRearrangeFamily } from './rearrangeFamilies.ts'
import { REARRANGE_INDEX_CODES, REARRANGE_INDEX_WIDTH } from './rearrangeIndex.ts'
import { INDEX_ALPHABET } from './rearrangeIndexFormat.ts'
import { type Level, MAX_SEED, blockSeed, randomSeed, seedBlock } from './taskNumber.ts'

// Neue Umstell-Aufgabe zu angekreuzten Bausteinen (M6 Schritte 3 und 4): aus dem Verzeichnis (rearrangeIndex.ts, erzeugt
// von scripts/rearrange-index.ts) die Nummern, deren Bausteine alle angekreuzt sind, dazu die Aufgaben einzelner Bausteine
// (Nummern wie „exp.1-4711", rearrangeFamilies.ts). Die Aufgaben selbst kommen aus generateRearrangeTask; das Verzeichnis
// sagt nur, welche Nummer welche Bausteine hat.

const ALL_BLOCKS: ReadonlySet<string> = new Set(REARRANGE_BLOCKS.map((block) => block.id))

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

// Nummern aus dem Verzeichnis mit dem Baustein main, deren übrige Bausteine alle in blocks stehen. Hat main in der Stufe
// eigene Aufgaben, fehlen die Nummern mit main allein (die kommen dann aus den eigenen Aufgaben).
const mainPools = new Map<string, readonly number[]>()

function mainPool(level: Level, blocks: ReadonlySet<string>, main: string): readonly number[] {
  const key = `${level}:${main}:${[...blocks].sort().join('+')}`
  let pool = mainPools.get(key)
  if (!pool) {
    const own = hasRearrangeFamily(main, level)
    const allowed = REARRANGE_COMBOS[level].map((combo) => {
      const ids = combo.split('+')
      return ids.includes(main) && ids.every((id) => blocks.has(id)) && !(own && ids.length === 1)
    })
    const positions = comboPositions(level)
    const seeds: number[] = []
    for (let i = 0; i < positions.length; i++) if (allowed[positions[i]]) seeds.push(i + 1)
    pool = seeds
    mainPools.set(key, pool)
  }
  return pool
}

// Anteil der eigenen Aufgaben eines Bausteins, wenn es auch Aufgaben mit ihm und anderen angekreuzten gibt
export const FAMILY_SHARE = 0.5

// Anteil der Formeln aus Technik und Physik (formulas.ts), wo es zum Baustein welche gibt
export const FORMULA_SHARE = 0.2

// Nummern der Formel-Aufgaben (ab 1) der Stufe mit dem Baustein main, deren Bausteine alle in blocks stehen
export function formulaPool(level: Level, blocks: ReadonlySet<string>, main: string): number[] {
  return FORMULA_TASKS.flatMap((task, i) => (task.level === level && task.blocks.includes(main) && task.blocks.every((id) => blocks.has(id)) ? [i + 1] : []))
}

// Bausteine der Auswahl, zu denen es in der Stufe Aufgaben gibt (in der Reihenfolge der Liste)
export function rearrangeMains(level: Level, blocks: ReadonlySet<string> = ALL_BLOCKS): string[] {
  return REARRANGE_BLOCKS.map((block) => block.id).filter(
    (id) => blocks.has(id) && (hasRearrangeFamily(id, level) || mainPool(level, blocks, id).length > 0 || formulaPool(level, blocks, id).length > 0),
  )
}

// Nummer einer neuen Aufgabe: erst einen angekreuzten Baustein wählen (jeder gleich oft, ohne Auswahl alle), dann eine
// Aufgabe mit ihm, deren Bausteine alle angekreuzt sind: etwa jede fünfte eine Formel aus Technik und Physik (wo es zum
// Baustein in der Stufe welche gibt), sonst halb eigene Aufgaben des Bausteins (wo es sie gibt), halb aus dem
// Verzeichnis. Gibt es zur Auswahl in der Stufe keine Aufgabe, eine beliebige alte Nummer (die Seiten sperren den
// Üben-Knopf vorher).
export function nextRearrangeSeed(level: Level, blocks?: ReadonlySet<string>, random: () => number = Math.random): number {
  const chosen = blocks ?? ALL_BLOCKS
  const mains = rearrangeMains(level, chosen)
  if (mains.length === 0) return randomSeed()
  const main = mains[Math.floor(random() * mains.length)]
  const formulas = formulaPool(level, chosen, main)
  const pool = mainPool(level, chosen, main)
  const own = hasRearrangeFamily(main, level)
  if (formulas.length > 0 && ((!own && pool.length === 0) || random() < FORMULA_SHARE)) return blockSeed('formel', formulas[Math.floor(random() * formulas.length)])
  if (own && (pool.length === 0 || random() < FAMILY_SHARE)) return blockSeed(main, 1 + Math.floor(random() * MAX_SEED))
  return pool[Math.floor(random() * pool.length)]
}

// Bausteine einer Nummer ohne die Aufgabe zu bauen: bei eigenen Aufgaben eines Bausteins dieser, sonst laut Verzeichnis
// (null außerhalb des Verzeichnisses)
export function rearrangeSeedBlocks(level: Level, seed: number): readonly string[] | null {
  const own = seedBlock(seed)
  if (own?.block === 'formel') {
    const task = FORMULA_TASKS[own.s - 1]
    return task && task.level === level ? task.blocks : indexedBlocks(level, own.s)
  }
  if (own) return hasRearrangeFamily(own.block, level) ? [own.block] : indexedBlocks(level, own.s)
  return indexedBlocks(level, seed)
}
