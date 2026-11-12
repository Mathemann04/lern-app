import { describe, expect, it } from 'vitest'
import { MAX_ROUND, ROUNDS_KEY, clearRounds, forgetShown, parseRounds, rememberShown, shownInRound, startNewRound } from './questionRounds.ts'
import type { KeyValueStore } from './storage.ts'

// Speicher wie im Browser, nur im Arbeitsspeicher
function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
}

describe('Runden der Wissensfragen', () => {
  it('merkt sich je Thema und Stufe, welche Fragen dran waren, jede nur einmal', () => {
    const store = memoryStore()
    expect(shownInRound('chem-atombau', 1, store).size).toBe(0)
    rememberShown('chem-atombau', 1, 101, store)
    rememberShown('chem-atombau', 1, 105, store)
    // Neuladen derselben Aufgabe
    rememberShown('chem-atombau', 1, 101, store)
    rememberShown('chem-atombau', 2, 201, store)
    rememberShown('chem-andere', 1, 101, store)
    expect([...shownInRound('chem-atombau', 1, store)]).toEqual([101, 105])
    expect([...shownInRound('chem-atombau', 2, store)]).toEqual([201])
    expect([...shownInRound('chem-andere', 1, store)]).toEqual([101])
    expect(JSON.parse(store.data.get(ROUNDS_KEY)!)).toEqual({ 'chem-atombau:1': [101, 105], 'chem-atombau:2': [201], 'chem-andere:1': [101] })
  })

  it('nimmt eine übersprungene Frage aus der Runde, sonst bleibt alles', () => {
    const store = memoryStore()
    for (const no of [101, 102, 103]) rememberShown('chem-atombau', 1, no, store)
    rememberShown('chem-atombau', 2, 102, store)
    forgetShown('chem-atombau', 1, 102, store)
    expect([...shownInRound('chem-atombau', 1, store)]).toEqual([101, 103])
    expect([...shownInRound('chem-atombau', 2, store)]).toEqual([102])
    // nicht in der Runde oder kein Eintrag: nichts passiert
    const before = store.data.get(ROUNDS_KEY)
    forgetShown('chem-atombau', 1, 999, store)
    forgetShown('chem-andere', 3, 101, store)
    expect(store.data.get(ROUNDS_KEY)).toBe(before)
  })

  it('beginnt eine Runde von vorn, ohne die anderen anzurühren', () => {
    const store = memoryStore()
    for (const no of [101, 102, 103]) rememberShown('chem-atombau', 1, no, store)
    rememberShown('chem-atombau', 2, 201, store)
    startNewRound('chem-atombau', 1, undefined, store)
    expect(shownInRound('chem-atombau', 1, store).size).toBe(0)
    expect([...shownInRound('chem-atombau', 2, store)]).toEqual([201])
    rememberShown('chem-atombau', 1, 102, store)
    expect([...shownInRound('chem-atombau', 1, store)]).toEqual([102])
  })

  it('nimmt mit Nummern nur diese aus der Runde (angekreuzte Unterthemen), die übrigen bleiben gemerkt', () => {
    const store = memoryStore()
    for (const no of [101, 102, 103, 104]) rememberShown('chem-atombau', 1, no, store)
    rememberShown('chem-atombau', 2, 201, store)
    startNewRound('chem-atombau', 1, [102, 104, 999], store)
    expect([...shownInRound('chem-atombau', 1, store)]).toEqual([101, 103])
    expect([...shownInRound('chem-atombau', 2, store)]).toEqual([201])
    // auch als Menge; leere Nummernliste ändert nichts
    startNewRound('chem-atombau', 1, new Set([101]), store)
    expect([...shownInRound('chem-atombau', 1, store)]).toEqual([103])
    startNewRound('chem-atombau', 1, [], store)
    expect([...shownInRound('chem-atombau', 1, store)]).toEqual([103])
    // eine Runde, die es noch nicht gibt, entsteht dabei nicht
    startNewRound('chem-atombau', 3, [301], store)
    expect(JSON.parse(store.data.get(ROUNDS_KEY)!)).not.toHaveProperty('chem-atombau:3')
  })

  it('leert bei „Fortschritt löschen" alle Runden und lässt andere Einträge stehen', () => {
    const store = memoryStore({ 'rechenweg-meldungen': '[1]' })
    rememberShown('chem-atombau', 1, 101, store)
    clearRounds(store)
    expect(shownInRound('chem-atombau', 1, store).size).toBe(0)
    expect(store.data.get('rechenweg-meldungen')).toBe('[1]')
  })

  it('übersteht kaputten Inhalt und lässt Unlesbares einzeln weg', () => {
    for (const text of [null, '', '{', '42', '[1,2]', 'null', '"text"']) expect(parseRounds(text), String(text)).toEqual({})
    expect(parseRounds(JSON.stringify({ 'chem-atombau:1': [101, '102', 0, -3, 1.5, 10_000, 101, 103], 'chem-atombau:2': 'kaputt', x: null }))).toEqual({
      'chem-atombau:1': [101, 103],
    })
    const broken = memoryStore({ [ROUNDS_KEY]: '{kaputt' })
    expect(shownInRound('chem-atombau', 1, broken).size).toBe(0)
    // Weiterarbeiten überschreibt den kaputten Inhalt
    rememberShown('chem-atombau', 1, 101, broken)
    expect([...shownInRound('chem-atombau', 1, broken)]).toEqual([101])
    // ohne Speicher oder mit gesperrtem Speicher: kein Absturz, nur kein Gedächtnis
    expect(shownInRound('chem-atombau', 1, null).size).toBe(0)
    const locked: KeyValueStore = {
      getItem: () => {
        throw new Error('gesperrt')
      },
      setItem: () => {
        throw new Error('gesperrt')
      },
    }
    expect(shownInRound('chem-atombau', 1, locked).size).toBe(0)
    expect(() => rememberShown('chem-atombau', 1, 101, locked)).not.toThrow()
    expect(() => startNewRound('chem-atombau', 1, undefined, locked)).not.toThrow()
    expect(() => startNewRound('chem-atombau', 1, [101], locked)).not.toThrow()
    expect(() => clearRounds(locked)).not.toThrow()
  })

  it('behält je Runde höchstens die letzten Nummern', () => {
    const many = Array.from({ length: MAX_ROUND + 5 }, (_, i) => i + 1)
    const read = parseRounds(JSON.stringify({ 'chem-atombau:1': many }))['chem-atombau:1']
    expect(read).toHaveLength(MAX_ROUND)
    expect(read[0]).toBe(6)
  })
})
