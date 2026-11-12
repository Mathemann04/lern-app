import { describe, expect, it } from 'vitest'
import { contains, subterms } from '../expr/compare.ts'
import { evaluate } from '../expr/evaluate.ts'
import { createRng } from '../random/rng.ts'
import { conditionsHold, samplePoints } from '../rearrange/check.ts'
import { solveTask } from '../rearrange/isolate.ts'
import { BLOCK_CODES, REARRANGE_BLOCKS } from './blocks.ts'
import { rearrangeForm } from './forms.ts'
import { hasFamilyBuilder } from './rearrangeBlockKit.ts'
import { rearrangeTaskBlocks } from './rearrangeBlocks.ts'
import { REARRANGE_FAMILY_LEVELS, REARRANGE_PLAYABLE_COMBOS, hasRearrangeFamily } from './rearrangeFamilies.ts'
import { FAMILY_SHARE, indexedBlocks, nextRearrangeSeed, rearrangeMains, rearrangePool, rearrangeSeedBlocks } from './rearrangePick.ts'
import { generateRearrangeTask, likelyRearrangeTemplate } from './rearrangeTerms.ts'
import { LEVELS, type Level, MAX_SEED, blockSeed, formatTaskNumber, parseTaskNumber, seedBlock } from './taskNumber.ts'
import { pickFresh, varietyStats } from './variety.ts'

// Aufgaben einzelner Bausteine beim Umstellen (M6 Schritt 4): Nummern wie „exp.1-4711", je Baustein und Stufe genug
// verschiedene Aufgaben, das Ziehen nach Bausteinen

const GROUNDWORK = REARRANGE_BLOCKS.filter((block) => block.group !== 'spaeter').map((block) => block.id)
const familyCells = Object.entries(REARRANGE_FAMILY_LEVELS).flatMap(([block, levels]) => levels.map((level) => [block, level] as const))

describe('Aufgabennummer mit Baustein', () => {
  it('schreibt und liest „exp.1-4711", alte Nummern bleiben, wie sie sind', () => {
    const ref = { level: 1 as Level, seed: blockSeed('exp', 4711) }
    expect(formatTaskNumber(ref)).toBe('exp.1-4711')
    expect(parseTaskNumber('exp.1-4711')).toEqual(ref)
    expect(seedBlock(ref.seed)).toEqual({ block: 'exp', s: 4711 })
    expect(parseTaskNumber('3-48213')).toEqual({ level: 3, seed: 48213 })
    expect(formatTaskNumber({ level: 3, seed: 48213 })).toBe('3-48213')
    expect(seedBlock(MAX_SEED)).toBeNull()
    expect(parseTaskNumber('quatsch.1-5')).toBeNull()
    expect(parseTaskNumber('constructor.1-5')).toBeNull()
    expect(parseTaskNumber('exp.1-0')).toBeNull()
    expect(parseTaskNumber('exp.6-5')).toBeNull()
  })

  it('jeder Baustein hat eine eigene feste Nummer', () => {
    const codes = Object.values(BLOCK_CODES)
    expect(new Set(codes).size).toBe(codes.length)
    for (const block of REARRANGE_BLOCKS) expect(BLOCK_CODES[block.id], block.id).toBeGreaterThan(0)
    for (const block of REARRANGE_BLOCKS) expect(seedBlock(blockSeed(block.id, MAX_SEED))).toEqual({ block: block.id, s: MAX_SEED })
  })

  it('gleiche Nummer, gleiche Aufgabe; Vorlage ohne die Aufgabe zu bauen', () => {
    const a = generateRearrangeTask({ level: 2, seed: blockSeed('log', 99) })
    const b = generateRearrangeTask({ level: 2, seed: blockSeed('log', 99) })
    expect(a.task).toEqual(b.task)
    expect(a.ref).toEqual({ level: 2, seed: blockSeed('log', 99) })
    expect(likelyRearrangeTemplate(a.ref)).toBe(a.template)
    expect(a.template.id).toBe('baustein-log-2')
  })

  it('ohne eigene Aufgaben in der Stufe: die alte Nummer ohne Baustein (die Adresse bleibt)', () => {
    const generated = generateRearrangeTask({ level: 1, seed: blockSeed('det', 17) })
    expect(generated.task).toEqual(generateRearrangeTask({ level: 1, seed: 17 }).task)
    expect(generated.ref.seed).toBe(blockSeed('det', 17))
  })
})

describe('Aufgaben einzelner Bausteine', () => {
  it('jeder Eintrag der Tabelle hat einen Baukasten', () => {
    for (const block of Object.keys(REARRANGE_FAMILY_LEVELS)) expect(hasFamilyBuilder(block), block).toBe(true)
  })

  it('jeder Baustein aus „Grundlagen" und „Funktionen" lässt sich in jeder Stufe allein üben', () => {
    for (const level of LEVELS) {
      for (const block of GROUNDWORK) {
        expect(REARRANGE_PLAYABLE_COMBOS[level], `${block} in Stufe ${level}`).toContain(block)
        expect(rearrangeMains(level, new Set([block])), `${block} in Stufe ${level}`).toEqual([block])
      }
    }
  })

  // Kennzahlen aus docs/PLAN-M2b.md: unter 200 Aufgaben mindestens 100 Formen, keine öfter als 3 von 100; dazu genau dieser
  // Baustein (an Aufgabe und Rechenweg abgelesen)
  it.each(familyCells)('%s in Stufe %i: genau dieser Baustein, mindestens 100 Formen unter 200, keine öfter als 3 %%', (block, level) => {
    const forms: string[] = []
    for (let s = 1; s <= 200; s++) {
      const ref = { level, seed: blockSeed(block, s) }
      forms.push(rearrangeForm(ref))
      if (s <= 40) {
        const { task } = generateRearrangeTask(ref)
        expect(rearrangeTaskBlocks(task, solveTask(task)!), formatTaskNumber(ref)).toEqual([block])
      }
    }
    const stats = varietyStats(forms)
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  }, 60_000)

  // Eine Potenz mit x und fester Hochzahl braucht eine positive Basis, und zwar für alle x, die die Bedingungen der Aufgabe
  // erfüllen (nicht nur an der Lösung): sonst hat eine gerade Hochzahl eine zweite Lösung, und bei einer ungeraden stünde
  // eine dritte Wurzel aus einer negativen Zahl da (bei Buchstaben nicht gewollt, rearrangeBlockKit.ts). Geprüft für x von einem Hundertstel bis zum
  // Hundertfachen der Lösung.
  it.each(familyCells)('%s in Stufe %i: jede Potenz mit x hat für alle erlaubten x eine positive Basis', (block, level) => {
    for (let s = 1; s <= 30; s++) {
      const ref = { level, seed: blockSeed(block, s) }
      const { task } = generateRearrangeTask(ref)
      const solution = solveTask(task)!
      const bases = [task.equation.lhs, task.equation.rhs]
        .flatMap((side) => subterms(side))
        .flatMap((e) => (e.kind === 'pow' && e.exp.kind === 'num' && contains(e.base, task.target) ? [e.base] : []))
      if (bases.length === 0) continue
      for (const point of samplePoints(task, solution.result, createRng(`basis:${s}`), 6, solution.requires)) {
        const x = point[task.target]
        for (let i = 0; i <= 40; i++) {
          const env = { ...point, [task.target]: x * 10 ** (-2 + i / 10) }
          if (!conditionsHold(task.conditions, env)) continue
          for (const base of bases) expect(evaluate(base, env), `${formatTaskNumber(ref)} bei ${task.target} = ${env[task.target]}`).toBeGreaterThan(0)
        }
      }
    }
  })

  // Wo ein Baustein in einer Stufe keine eigenen Aufgaben hat, kommen sie aus dem Verzeichnis: dieselben Kennzahlen unter den
  // ersten 200 Aufgaben mit nur diesem Baustein
  it('Bausteine ohne eigene Aufgaben in einer Stufe: genug Aufgaben im Verzeichnis', () => {
    for (const level of LEVELS) {
      for (const block of GROUNDWORK.filter((id) => !hasRearrangeFamily(id, level))) {
        const pool = rearrangePool(level, new Set([block])).slice(0, 200)
        expect(pool.length, `${block} in Stufe ${level}`).toBe(200)
        const stats = varietyStats(pool.map((seed) => rearrangeForm({ level, seed })))
        expect(stats.distinct, `${block} in Stufe ${level}: Formen`).toBeGreaterThanOrEqual(100)
        expect(stats.maxShare, `${block} in Stufe ${level}: häufigste Form`).toBeLessThanOrEqual(0.03)
      }
    }
  }, 120_000)
})

describe('Neue Aufgabe nach Bausteinen ziehen', () => {
  it('ein Baustein allein: nur seine Aufgaben, zehn nacheinander ohne doppelte Form', () => {
    for (const [block, level] of [['exp', 1], ['winkel', 3], ['quadratisch', 5], ['wurzeln', 3]] as const) {
      const rng = createRng(`ziehen-baustein:${block}:${level}`)
      const recent: string[] = []
      for (let i = 0; i < 10; i++) {
        const seed = pickFresh((s) => rearrangeForm({ level, seed: s }), recent, () => nextRearrangeSeed(level, new Set([block]), () => rng.next()))
        expect(rearrangeSeedBlocks(level, seed), `${block} ${formatTaskNumber({ level, seed })}`).toEqual([block])
        recent.push(rearrangeForm({ level, seed }))
      }
      expect(new Set(recent).size, `${block} in Stufe ${level}`).toBe(10)
    }
  })

  it('jeder angekreuzte Baustein kommt etwa gleich oft dran, eigene Aufgaben und Aufgaben mit anderen gemischt', () => {
    const rng = createRng('ziehen-mehrere')
    const chosen = new Set(['brueche', 'exp', 'winkel'])
    const main = new Map<string, number>()
    let own = 0
    const draws = 600
    for (let i = 0; i < draws; i++) {
      const seed = nextRearrangeSeed(4, chosen, () => rng.next())
      const blocks = rearrangeSeedBlocks(4, seed)!
      for (const id of blocks) expect(chosen.has(id), formatTaskNumber({ level: 4, seed })).toBe(true)
      if (seedBlock(seed)) own++
      for (const id of blocks) main.set(id, (main.get(id) ?? 0) + 1)
    }
    // Brüche haben in Stufe 4 eigene Aufgaben (halb so oft wie Brüche drankommen), e-Funktion und Winkel nicht
    expect(own / draws).toBeGreaterThan((FAMILY_SHARE / 3) * 0.7)
    expect(own / draws).toBeLessThan((FAMILY_SHARE / 3) * 1.3)
    for (const id of chosen) expect(main.get(id) ?? 0, id).toBeGreaterThan(draws / 4)
  })

  it('ohne Auswahl alle Bausteine: in Stufe 1 auch e-Funktion, Logarithmus und Winkelfunktionen', () => {
    const rng = createRng('ziehen-alle')
    const seen = new Set<string>()
    for (let i = 0; i < 300; i++) for (const id of rearrangeSeedBlocks(1, nextRearrangeSeed(1, undefined, () => rng.next()))!) seen.add(id)
    expect([...seen].sort()).toEqual([...GROUNDWORK].sort())
  })

  it('Verzeichnis und eigene Aufgaben: Nummern ohne Baustein laut Verzeichnis', () => {
    expect(rearrangeSeedBlocks(5, 1)).toEqual(indexedBlocks(5, 1))
    expect(rearrangeSeedBlocks(2, blockSeed('hyperbel', 3))).toEqual(['hyperbel'])
  })
})
