import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, EMPTY_PROGRESS, type KeyValueStore, STORAGE_KEY, loadState, saveState } from './storage.ts'

function memoryStore(initial?: string): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  if (initial !== undefined) data.set(STORAGE_KEY, initial)
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  }
}

describe('Speicher', () => {
  it('liefert Standardwerte, wenn noch nichts gespeichert ist', () => {
    expect(loadState(memoryStore())).toEqual(DEFAULT_STATE)
    expect(loadState(null)).toEqual(DEFAULT_STATE)
  })

  it('speichert und lädt Einstellungen', () => {
    const store = memoryStore()
    const settings = { explanations: false, detail: 'short', derivativeLevel: 3, practiceMode: 'free', theme: 'dark' } as const
    saveState({ ...DEFAULT_STATE, settings }, store)
    expect(loadState(store).settings).toEqual(settings)
  })

  it('übersteht kaputten oder fremden Inhalt', () => {
    expect(loadState(memoryStore('{kaputt'))).toEqual(DEFAULT_STATE)
    expect(loadState(memoryStore('42'))).toEqual(DEFAULT_STATE)
    expect(loadState(memoryStore('{"settings":{"detail":"riesig","explanations":"ja","derivativeLevel":7,"practiceMode":"schnell","theme":"lila"}}')).settings).toEqual(
      DEFAULT_STATE.settings,
    )
  })

  it('behält gültige Teile, wenn andere fehlen', () => {
    expect(loadState(memoryStore('{"settings":{"detail":"short"}}')).settings).toEqual({
      explanations: true,
      detail: 'short',
      derivativeLevel: 1,
      practiceMode: 'guided',
      theme: 'system',
    })
  })

  it('stürzt nicht ab, wenn der Speicher gesperrt ist', () => {
    const locked: KeyValueStore = {
      getItem: () => {
        throw new Error('gesperrt')
      },
      setItem: () => {
        throw new Error('gesperrt')
      },
    }
    expect(loadState(locked)).toEqual(DEFAULT_STATE)
    expect(() => saveState(DEFAULT_STATE, locked)).not.toThrow()
  })
})

describe('Fortschritt im Speicher', () => {
  it('übernimmt Einstellungen aus Version 1 und beginnt mit leerem Fortschritt', () => {
    const old = memoryStore('{"version":1,"settings":{"detail":"short","derivativeLevel":2}}')
    const state = loadState(old)
    expect(state.version).toBe(2)
    expect(state.settings.detail).toBe('short')
    expect(state.settings.derivativeLevel).toBe(2)
    expect(state.progress).toEqual(EMPTY_PROGRESS)
  })

  it('speichert und lädt gelöste Aufgaben und Fehler', () => {
    const store = memoryStore()
    const progress = {
      attempts: [{ level: 2, mode: 'free', clean: true, at: 1000 }],
      errors: { 'cos-sign': 3 },
      suggestionDismissed: { 2: 10 },
    } as const
    saveState({ ...DEFAULT_STATE, progress }, store)
    expect(loadState(store).progress).toEqual(progress)
  })

  it('lässt kaputte Einträge einzeln weg', () => {
    const text = JSON.stringify({
      version: 2,
      progress: {
        attempts: [{ level: 9, clean: true, at: 1 }, { level: 1, clean: 'ja', at: 2 }, { level: 1, mode: 'guided', clean: false, at: 3 }, 42],
        errors: { 'cos-sign': 2, kaputt: -1, auchKaputt: 'viel' },
        suggestionDismissed: { 1: 10, 7: 3, 2: 'x' },
      },
    })
    expect(loadState(memoryStore(text)).progress).toEqual({
      attempts: [{ level: 1, mode: 'guided', clean: false, at: 3 }],
      errors: { 'cos-sign': 2 },
      suggestionDismissed: { 1: 10 },
    })
  })
})
