import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, DEFAULT_STATE, EMPTY_PROGRESS, type KeyValueStore, STORAGE_KEY, loadState, saveState } from './storage.ts'

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
    const settings = {
      explanations: false,
      detail: 'short',
      levels: { ableiten: 3, brueche: 2 },
      lastCourse: 'brueche',
      practiceMode: 'free',
      theme: 'dark',
    } as const
    saveState({ ...DEFAULT_STATE, settings }, store)
    expect(loadState(store).settings).toEqual(settings)
  })

  it('übersteht kaputten oder fremden Inhalt', () => {
    expect(loadState(memoryStore('{kaputt'))).toEqual(DEFAULT_STATE)
    expect(loadState(memoryStore('42'))).toEqual(DEFAULT_STATE)
    const broken = {
      version: 3,
      settings: { detail: 'riesig', explanations: 'ja', levels: { ableiten: 7, 'B R': 2 }, lastCourse: 42, practiceMode: 'schnell', theme: 'lila' },
    }
    expect(loadState(memoryStore(JSON.stringify(broken))).settings).toEqual(DEFAULT_SETTINGS)
  })

  it('behält gültige Teile, wenn andere fehlen', () => {
    expect(loadState(memoryStore('{"version":3,"settings":{"detail":"short","levels":{"brueche":2}}}')).settings).toEqual({
      ...DEFAULT_SETTINGS,
      detail: 'short',
      levels: { brueche: 2 },
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
  it('speichert und lädt gelöste Aufgaben und Fehler', () => {
    const store = memoryStore()
    const progress = {
      attempts: [
        { course: 'ableiten', level: 2, mode: 'free', clean: true, at: 1000 },
        { course: 'brueche', level: 1, mode: 'guided', clean: false, at: 2000 },
      ],
      errors: { 'cos-sign': 3, 'frac-add-across': 1 },
      suggestionDismissed: { ableiten: { 2: 10 }, brueche: { 1: 20 } },
    } as const
    saveState({ ...DEFAULT_STATE, progress }, store)
    expect(loadState(store).progress).toEqual(progress)
  })

  it('lässt kaputte Einträge einzeln weg', () => {
    const text = JSON.stringify({
      version: 3,
      progress: {
        attempts: [
          { course: 'brueche', level: 9, clean: true, at: 1 },
          { course: 'brueche', level: 1, clean: 'ja', at: 2 },
          { level: 1, mode: 'guided', clean: true, at: 3 },
          { course: 'brueche', level: 1, mode: 'guided', clean: false, at: 4 },
          42,
        ],
        errors: { 'cos-sign': 2, kaputt: -1, auchKaputt: 'viel' },
        suggestionDismissed: { brueche: { 1: 10, 7: 3, 2: 'x' }, ableiten: 'kaputt' },
      },
    })
    expect(loadState(memoryStore(text)).progress).toEqual({
      attempts: [{ course: 'brueche', level: 1, mode: 'guided', clean: false, at: 4 }],
      errors: { 'cos-sign': 2 },
      suggestionDismissed: { brueche: { 1: 10 }, ableiten: {} },
    })
  })
})

describe('Umzug alter Speicherstände', () => {
  it('übernimmt Einstellungen aus Version 1 und beginnt mit leerem Fortschritt', () => {
    const state = loadState(memoryStore('{"version":1,"settings":{"detail":"short","derivativeLevel":2}}'))
    expect(state.version).toBe(3)
    expect(state.settings).toEqual({ ...DEFAULT_SETTINGS, detail: 'short', levels: { ableiten: 2 } })
    expect(state.progress).toEqual(EMPTY_PROGRESS)
  })

  it('ordnet in Version 2 alles dem Ableiten zu, ohne etwas zu verlieren', () => {
    const v2 = {
      version: 2,
      settings: { explanations: false, detail: 'short', derivativeLevel: 4, practiceMode: 'free', theme: 'dark' },
      progress: {
        attempts: [
          { level: 4, mode: 'free', clean: true, at: 1 },
          { level: 3, mode: 'guided', clean: false, at: 2 },
        ],
        errors: { 'cos-sign': 2, 'chain-inner-forgotten': 1 },
        suggestionDismissed: { 3: 10 },
      },
    }
    expect(loadState(memoryStore(JSON.stringify(v2)))).toEqual({
      version: 3,
      settings: { explanations: false, detail: 'short', levels: { ableiten: 4 }, lastCourse: 'ableiten', practiceMode: 'free', theme: 'dark' },
      progress: {
        attempts: [
          { course: 'ableiten', level: 4, mode: 'free', clean: true, at: 1 },
          { course: 'ableiten', level: 3, mode: 'guided', clean: false, at: 2 },
        ],
        errors: { 'cos-sign': 2, 'chain-inner-forgotten': 1 },
        suggestionDismissed: { ableiten: { 3: 10 } },
      },
    })
  })

  it('übersteht kaputte Teile auch in Version 2', () => {
    const v2 = { version: 2, settings: { derivativeLevel: 9 }, progress: { attempts: [{ level: 2, clean: true, at: 5 }, 'x'], suggestionDismissed: 'x' } }
    const state = loadState(memoryStore(JSON.stringify(v2)))
    expect(state.settings.levels).toEqual({})
    expect(state.progress.attempts).toEqual([{ course: 'ableiten', level: 2, mode: 'guided', clean: true, at: 5 }])
    expect(state.progress.suggestionDismissed).toEqual({ ableiten: {} })
  })
})
