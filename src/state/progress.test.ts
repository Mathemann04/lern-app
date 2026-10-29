import { describe, expect, it } from 'vitest'
import { addAttempt, addError, levelSummary, shouldSuggestLevelUp, topErrors } from './progress.ts'
import { type Attempt, EMPTY_PROGRESS, MAX_ATTEMPTS, type Progress } from './storage.ts'

const attempt = (level: Attempt['level'], clean: boolean): Attempt => ({ level, mode: 'guided', clean, at: 0 })
const withAttempts = (list: Attempt[], base: Progress = EMPTY_PROGRESS) => list.reduce(addAttempt, base)

describe('Fortschritt je Stufe', () => {
  it('zählt gelöste Aufgaben und die letzten 10', () => {
    const p = withAttempts([...Array.from({ length: 12 }, () => attempt(1, true)), attempt(2, false), attempt(1, false)])
    const s = levelSummary(p, 1)
    expect(s.solved).toBe(13)
    expect(s.recent).toHaveLength(10)
    expect(s.recentClean).toBe(9)
    expect(levelSummary(p, 2)).toMatchObject({ solved: 1, recentClean: 0 })
  })

  it('behält höchstens die letzten Aufgaben', () => {
    const p = withAttempts(Array.from({ length: MAX_ATTEMPTS + 5 }, () => attempt(1, true)))
    expect(p.attempts).toHaveLength(MAX_ATTEMPTS)
  })
})

describe('Vorschlag „Eine Stufe höher?"', () => {
  it('kommt erst bei 8 von 10 ohne Fehler', () => {
    // Die älteste Aufgabe fällt beim nächsten Lösen aus dem Fenster der letzten 10
    const seven = withAttempts([...Array.from({ length: 3 }, () => attempt(2, false)), ...Array.from({ length: 7 }, () => attempt(2, true))])
    expect(shouldSuggestLevelUp(seven, 2)).toBe(false)
    const eight = addAttempt(seven, attempt(2, true))
    expect(shouldSuggestLevelUp(eight, 2)).toBe(true)
    expect(shouldSuggestLevelUp(eight, 3)).toBe(false)
  })

  it('braucht mindestens 10 Aufgaben', () => {
    expect(shouldSuggestLevelUp(withAttempts(Array.from({ length: 9 }, () => attempt(1, true))), 1)).toBe(false)
  })

  it('meldet sich nach „Später" erst nach 10 weiteren Aufgaben wieder', () => {
    let p = withAttempts(Array.from({ length: 10 }, () => attempt(1, true)))
    p = { ...p, suggestionDismissed: { 1: 10 } }
    expect(shouldSuggestLevelUp(p, 1)).toBe(false)
    p = withAttempts(Array.from({ length: 9 }, () => attempt(1, true)), p)
    expect(shouldSuggestLevelUp(p, 1)).toBe(false)
    p = addAttempt(p, attempt(1, true))
    expect(shouldSuggestLevelUp(p, 1)).toBe(true)
  })
})

describe('Häufigste Fehler', () => {
  it('sortiert nach Anzahl', () => {
    let p = EMPTY_PROGRESS
    for (const id of ['cos-sign', 'chain-inner-forgotten', 'chain-inner-forgotten', 'sin-sign', 'chain-inner-forgotten', 'sin-sign']) {
      p = addError(p, id)
    }
    expect(topErrors(p, 2)).toEqual([
      { id: 'chain-inner-forgotten', times: 3 },
      { id: 'sin-sign', times: 2 },
    ])
  })

  it('lässt Fehler weg, die es nicht mehr gibt', () => {
    const p = addError(addError(addError(EMPTY_PROGRESS, 'alter-fehler'), 'alter-fehler'), 'cos-sign')
    expect(topErrors(p, 5, (id) => id !== 'alter-fehler')).toEqual([{ id: 'cos-sign', times: 1 }])
  })
})
