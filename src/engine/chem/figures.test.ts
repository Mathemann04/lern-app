import { describe, expect, it } from 'vitest'
import { CARDS } from '../explain/cards.ts'
import { CHEM_TOPICS } from './banks.ts'
import { FIGURES, coordinationOf, figureById } from './figures.ts'

// Bilder (S5a): aus den Daten gezählt wie in Skript und Lernkarte; jede Frage und Karte zeigt nur Bilder, die es gibt

describe('Ionengitter', () => {
  it('Koordinationszahl des hervorgehobenen Ions: NaCl 6, CsCl 8, ZnS 4', () => {
    expect(coordinationOf(figureById('gitter-nacl')!)).toBe(6)
    expect(coordinationOf(figureById('gitter-cscl')!)).toBe(8)
    expect(coordinationOf(figureById('gitter-zns')!)).toBe(4)
  })
  it('Verhältnis der Ionen in der Elementarzelle wie in der Formel (Ecke 1/8, Kante 1/4, Fläche 1/2, innen 1)', () => {
    const share = (v: number) => (v === 0 || v === 1 ? 0.5 : 1)
    const count = (id: string, kind: 'cation' | 'anion') =>
      figureById(id)!.ions.filter((i) => i.kind === kind).reduce((sum, i) => sum + share(i.x) * share(i.y) * share(i.z), 0)
    for (const id of ['gitter-nacl', 'gitter-cscl', 'gitter-zns']) expect(count(id, 'cation'), id).toBe(count(id, 'anion'))
    expect(count('gitter-nacl', 'cation')).toBe(4)
    expect(count('gitter-cscl', 'cation')).toBe(1)
    expect(count('gitter-zns', 'cation')).toBe(4)
  })
  it('Fragen und Karten nennen nur vorhandene Bilder', () => {
    const ids = new Set(FIGURES.map((f) => f.id))
    for (const topic of CHEM_TOPICS) for (const q of topic.bank.questions) if (q.figure) expect(ids.has(q.figure), q.id).toBe(true)
    for (const card of CARDS) for (const f of card.figures ?? []) expect(ids.has(f), card.id).toBe(true)
  })
})
