import { describe, expect, it } from 'vitest'
import { chemTopic } from '../engine/chem/banks.ts'
import { chemCourseEngine } from '../engine/chem/engine.ts'
import { createRng } from '../engine/random/rng.ts'
import { rememberShown, shownInRound, startNewRound } from '../state/questionRounds.ts'
import type { KeyValueStore } from '../state/storage.ts'
import { ATOMBAU } from './catalog.ts'
import { knownFocus, newTaskHref, pickNewSeed, questionNoOf } from './practice.ts'
import { RECENT_FORMS } from './recentForms.ts'

describe('Üben', () => {
  it('übt gezielt nur bekannte Fehler des Themas', () => {
    expect(knownFocus('ableiten', 'cos-sign')).toBe('cos-sign')
    expect(knownFocus('brueche', 'frac-add-across')).toBe('frac-add-across')
    expect(knownFocus('brueche', 'cos-sign')).toBeNull()
    expect(knownFocus('ableiten', 'gibt-es-nicht')).toBeNull()
    expect(knownFocus('ableiten', null)).toBeNull()
  })

  it('würfelt eine neue Aufgabe, beim gezielten Üben eine passende Stufe', async () => {
    expect(await newTaskHref('ableiten', 'free', 3, null)).toMatch(/^#\/frei\/ableiten\/3-\d+$/)
    expect(await newTaskHref('brueche', 'guided', 2, null)).toMatch(/^#\/ueben\/brueche\/2-\d+$/)
    // Der Kosinus kommt erst ab Stufe 2 vor. Gesucht wird reihum mit Zufall (zuerst die nächste Stufe): Meist
    // kommt Stufe 2 heraus, manchmal eine höhere, in der der Fehler auch vorkommt, nie Stufe 1
    expect(await newTaskHref('ableiten', 'guided', 1, 'cos-sign')).toMatch(/^#\/ueben\/ableiten\/[2-5]-\d+\?fokus=cos-sign$/)
    // Potenzen mit Buchstaben gibt es erst ab Stufe 2
    expect(await newTaskHref('brueche', 'guided', 1, 'frac-power-reversed')).toMatch(/^#\/ueben\/brueche\/[2-5]-\d+\?fokus=frac-power-reversed$/)
    // Umstellen (M3, Schritt 9): Fehler beim Betrag gibt es nur in Stufe 5
    expect(await newTaskHref('umstellen', 'guided', 2, 'eq-abs-root')).toMatch(/^#\/ueben\/umstellen\/5-\d+\?fokus=eq-abs-root$/)
    expect(knownFocus('umstellen', 'eq-sign-not-flipped')).toBe('eq-sign-not-flipped')
  })
})

describe('Neue Wissensfrage ziehen (wie PickNewTask)', () => {
  it('zeigt jede Frage der Stufe einmal, bevor eine doppelt kommt, und meidet die Fakten der letzten zehn', () => {
    const rng = createRng('runde')
    const engine = chemCourseEngine(ATOMBAU, () => rng.next())
    const data = new Map<string, string>()
    const store: KeyValueStore = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
    for (const level of [1, 2, 3] as const) {
      const recent: string[] = []
      const seen: number[] = []
      const total = chemTopic(ATOMBAU)!.bank.questions.filter((q) => q.level === level).length
      for (let i = 0; i < 2 * total; i++) {
        const { seed, newRound } = pickNewSeed(engine, level, recent.slice(-RECENT_FORMS), shownInRound(ATOMBAU, level, store))
        // Eine neue Runde beginnt genau dann, wenn alle dran waren
        expect(newRound, `Stufe ${level}, Zug ${i + 1}`).toBe(i === total)
        if (newRound) startNewRound(ATOMBAU, level, store)
        const no = questionNoOf(engine, seed)!
        const form = engine.formOf({ level, seed })
        expect(recent.slice(-RECENT_FORMS), `Stufe ${level}, Zug ${i + 1}: Fakt der letzten zehn`).not.toContain(form)
        rememberShown(ATOMBAU, level, no, store)
        recent.push(form)
        seen.push(no)
      }
      // erste Runde: so viele Züge wie Fragen, alle verschieden (bei 20 Fragen 20 verschiedene); zweite ebenso
      expect(new Set(seen.slice(0, total)).size).toBe(total)
      expect(new Set(seen.slice(total)).size).toBe(total)
    }
  })

  it('kennt Fragennummern nur bei Wissensfragen', () => {
    const engine = chemCourseEngine(ATOMBAU)
    expect(questionNoOf(engine, 500_000 + 50 * 101 + 7)).toBe(101)
    expect(questionNoOf(engine, 101)).toBe(101)
    // Mathe-Engines ziehen ihre Nummern selbst: Die Zahl ist dort keine Frage
    expect(questionNoOf({}, 500_000 + 50 * 101 + 7)).toBeNull()
  })
})
