import { describe, expect, it } from 'vitest'
import { solveTask } from '../rearrange/isolate.ts'
import { REARRANGE_BLOCKS } from './blocks.ts'
import { rearrangeForm } from './forms.ts'
import { rearrangeTaskBlocks } from './rearrangeBlocks.ts'
import { REARRANGE_COMBOS } from './rearrangeCombos.ts'
import { REARRANGE_INDEX_CODES, REARRANGE_INDEX_WIDTH } from './rearrangeIndex.ts'
import { INDEX_ALPHABET, REARRANGE_INDEX_LEVELS } from './rearrangeIndexFormat.ts'
import { indexSize, indexedBlocks, nextRearrangeSeed, rearrangePool } from './rearrangePick.ts'
import { generateRearrangeTask } from './rearrangeTerms.ts'
import { LEVELS } from './taskNumber.ts'
import { varietyStats } from './variety.ts'

// Verzeichnis der Umstell-Aufgaben nach Bausteinen (M6 Schritt 3, scripts/rearrange-index.ts)

const BLOCK_IDS = new Set(REARRANGE_BLOCKS.map((block) => block.id))
const STALE = 'Verzeichnis veraltet: node scripts/rearrange-index.ts laufen lassen'

describe('Verzeichnis der Umstell-Aufgaben nach Bausteinen', () => {
  it('ist vollständig und lesbar: je Stufe so viele Nummern wie vorgesehen, nur bekannte Bausteine, jede Kombination genutzt', () => {
    for (const level of LEVELS) {
      const combos = REARRANGE_COMBOS[level]
      expect(new Set(combos).size, `Stufe ${level}`).toBe(combos.length)
      for (const combo of combos) {
        const ids = combo.split('+')
        expect(ids.length).toBeGreaterThan(0)
        for (const id of ids) expect(BLOCK_IDS.has(id), `${combo}`).toBe(true)
      }
      const width = REARRANGE_INDEX_WIDTH[level]
      expect(REARRANGE_INDEX_CODES[level].length, STALE).toBe(REARRANGE_INDEX_LEVELS[level] * width)
      expect([...REARRANGE_INDEX_CODES[level]].every((ch) => INDEX_ALPHABET.includes(ch))).toBe(true)
      expect(indexSize(level)).toBe(REARRANGE_INDEX_LEVELS[level])
      const used = new Set(Array.from({ length: indexSize(level) }, (_, i) => indexedBlocks(level, i + 1)!.join('+')))
      expect([...used].sort(), `Stufe ${level}`).toEqual([...combos].sort())
    }
    expect(indexedBlocks(1, 0)).toBeNull()
    expect(indexedBlocks(1, REARRANGE_INDEX_LEVELS[1] + 1)).toBeNull()
  })

  // Stichprobe: Ändert sich der Baukasten oder die Engine, passt das Verzeichnis nicht mehr
  it.each(LEVELS)('stimmt in Stufe %i mit den Aufgaben überein (Stichprobe)', (level) => {
    const step = Math.ceil(REARRANGE_INDEX_LEVELS[level] / 120)
    for (let seed = 1; seed <= REARRANGE_INDEX_LEVELS[level]; seed += step) {
      const { task } = generateRearrangeTask({ level, seed })
      expect(rearrangeTaskBlocks(task, solveTask(task)!), `${STALE} (${level}-${seed})`).toEqual(indexedBlocks(level, seed))
    }
  })
})

describe('Neue Umstell-Aufgabe zu angekreuzten Bausteinen', () => {
  it('nimmt nur Aufgaben, deren Bausteine alle angekreuzt sind', () => {
    const chosen = new Set(['det'])
    for (let i = 0; i < 40; i++) {
      const seed = nextRearrangeSeed(5, chosen)
      expect(indexedBlocks(5, seed)).toEqual(['det'])
    }
    const pair = new Set(['wurzeln', 'brueche'])
    for (let i = 0; i < 40; i++) {
      const seed = nextRearrangeSeed(3, pair)
      for (const id of indexedBlocks(3, seed)!) expect(pair.has(id)).toBe(true)
    }
    // die Aufgabe selbst hat diese Bausteine (nicht nur das Verzeichnis)
    const seed = nextRearrangeSeed(5, chosen)
    const { task } = generateRearrangeTask({ level: 5, seed })
    expect(rearrangeTaskBlocks(task, solveTask(task)!)).toEqual(['det'])
  })

  it('ohne Auswahl eine beliebige Nummer wie bisher, ohne passende Aufgabe ebenfalls', () => {
    const seeds = Array.from({ length: 30 }, () => nextRearrangeSeed(4))
    expect(seeds.some((seed) => seed > REARRANGE_INDEX_LEVELS[4])).toBe(true)
    // Ableitungen gibt es in Stufe 5 (noch) nicht allein, Determinanten in Stufe 1 nicht
    expect(rearrangePool(5, new Set(['ableitung']))).toEqual([])
    expect(rearrangePool(1, new Set(['det']))).toEqual([])
    expect(Number.isInteger(nextRearrangeSeed(1, new Set(['det'])))).toBe(true)
  })

  // Abwechslung je Baustein allein (Mindestmaß für Schritt 3; die Schritte 4 und 5 bringen leichte Aufgaben je Baustein und
  // heben es an): unter bis zu 100 Aufgaben mindestens 20 Formen (bei weniger Aufgaben alle verschieden bis auf ein Fünftel),
  // keine Form öfter als 15 von 100. Für „Alle" gelten die Kennzahlen je Stufe (rearrangeTerms.test.ts).
  it.each(LEVELS)('bringt in Stufe %i auch mit nur einem Baustein genug verschiedene Formen', (level) => {
    for (const block of REARRANGE_BLOCKS) {
      const pool = rearrangePool(level, new Set([block.id]))
      if (pool.length === 0) continue
      const sample = pool.slice(0, 100)
      const stats = varietyStats(sample.map((seed) => rearrangeForm({ level, seed })))
      expect(stats.distinct, `${block.id}: Formen`).toBeGreaterThanOrEqual(Math.min(20, Math.ceil(sample.length * 0.8)))
      expect(stats.maxShare, `${block.id}: häufigste Form`).toBeLessThanOrEqual(0.15)
    }
  })
})
