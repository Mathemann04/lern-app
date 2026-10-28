import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, type KeyValueStore, STORAGE_KEY, loadState, saveState } from './storage.ts'

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
    saveState({ version: 1, settings: { explanations: false, detail: 'short' } }, store)
    expect(loadState(store).settings).toEqual({ explanations: false, detail: 'short' })
  })

  it('übersteht kaputten oder fremden Inhalt', () => {
    expect(loadState(memoryStore('{kaputt'))).toEqual(DEFAULT_STATE)
    expect(loadState(memoryStore('42'))).toEqual(DEFAULT_STATE)
    expect(loadState(memoryStore('{"settings":{"detail":"riesig","explanations":"ja"}}')).settings).toEqual(
      DEFAULT_STATE.settings,
    )
  })

  it('behält gültige Teile, wenn andere fehlen', () => {
    expect(loadState(memoryStore('{"settings":{"detail":"short"}}')).settings).toEqual({
      explanations: true,
      detail: 'short',
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
