import { describe, expect, it } from 'vitest'
import { chemTopic } from '../engine/chem/banks.ts'
import { chemCourseEngine } from '../engine/chem/engine.ts'
import { decodeSeed } from '../engine/quiz/numbers.ts'
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
  // Rechnungen (ab S2) kommen dazwischen: Sie zählen in den letzten Formen, aber nicht in der Runde
  const calcEngine = chemCourseEngine(ATOMBAU)
  function nextQuestion(draw: () => { seed: number; newRound: boolean }, level: 1 | 2 | 3, recent: string[]) {
    for (let i = 0; i < 100; i++) {
      const drawn = draw()
      if (questionNoOf(calcEngine, drawn.seed) !== null) return drawn
      expect(drawn.newRound).toBe(false)
      recent.push(calcEngine.formOf({ level, seed: drawn.seed }))
    }
    throw new Error('keine Frage')
  }

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
        const { seed, newRound } = nextQuestion(() => pickNewSeed(engine, level, recent.slice(-RECENT_FORMS), shownInRound(ATOMBAU, level, store)), level, recent)
        // Eine neue Runde beginnt genau dann, wenn alle dran waren
        expect(newRound, `Stufe ${level}, Zug ${i + 1}`).toBe(i === total)
        if (newRound) startNewRound(ATOMBAU, level, engine.questionNos(level), store)
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

  it('zieht mit angekreuzten Unterthemen nur deren Fragen und beginnt dann nur deren Runde neu', () => {
    const rng = createRng('unterthemen')
    const engine = chemCourseEngine(ATOMBAU, () => rng.next())
    const data = new Map<string, string>()
    const store: KeyValueStore = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
    const questions = chemTopic(ATOMBAU)!.bank.questions.filter((q) => q.level === 2)
    const parts = new Set(['modelle', 'licht'])
    const chosen = questions.filter((q) => parts.has(q.part)).map((q) => q.no)
    // eine Frage eines anderen Unterthemas ist schon in der Runde
    const other = questions.find((q) => !parts.has(q.part))!.no
    rememberShown(ATOMBAU, 2, other, store)
    const recent: string[] = []
    const seen = new Set<number>()
    for (let i = 0; i <= chosen.length; i++) {
      const { seed, newRound } = nextQuestion(() => pickNewSeed(engine, 2, recent.slice(-RECENT_FORMS), shownInRound(ATOMBAU, 2, store), parts), 2, recent)
      expect(newRound, `Zug ${i + 1}`).toBe(i === chosen.length)
      if (newRound) startNewRound(ATOMBAU, 2, engine.questionNos(2, parts), store)
      const no = questionNoOf(engine, seed)!
      expect(chosen).toContain(no)
      rememberShown(ATOMBAU, 2, no, store)
      recent.push(engine.formOf({ level: 2, seed }))
      seen.add(no)
    }
    expect(seen.size).toBe(chosen.length)
    // Die Frage des anderen Unterthemas bleibt in der Runde gemerkt
    expect(shownInRound(ATOMBAU, 2, store).has(other)).toBe(true)
  })

  it('kennt Fragennummern nur bei Wissensfragen', () => {
    const engine = chemCourseEngine(ATOMBAU)
    expect(questionNoOf(engine, 500_000 + 50 * 101 + 7)).toBe(101)
    expect(questionNoOf(engine, 101)).toBe(101)
    // Mathe-Engines ziehen ihre Nummern selbst: Die Zahl ist dort keine Frage
    expect(questionNoOf({}, 500_000 + 50 * 101 + 7)).toBeNull()
  })
})

describe('Wiederholung beim Ziehen (S8a)', () => {
  const rng = createRng('wiederholung')
  const engine = chemCourseEngine(ATOMBAU, () => rng.next())
  const nos1 = engine.questionNos(1)

  it('bringt eine fällige Frage der Auswahl zuerst, in einer anderen Fassung', () => {
    const due = [{ no: nos1[3], variant: 5, answeredAt: 1 }]
    for (let i = 0; i < 20; i++) {
      const picked = pickNewSeed(engine, 1, [], new Set(), undefined, { due, waiting: new Set() })
      expect(picked.review).toBe(true)
      expect(picked.newRound).toBe(false)
      const decoded = decodeSeed(picked.seed)
      expect(decoded).toMatchObject({ kind: 'question', no: nos1[3] })
      expect(decoded?.kind === 'question' && decoded.variant).not.toBe(5)
    }
    // fällig, aber aus einer anderen Stufe oder einem nicht angekreuzten Unterthema: normal weiter
    const other = engine.questionNos(2)[0]
    expect(pickNewSeed(engine, 1, [], new Set(), undefined, { due: [{ no: other, variant: 0, answeredAt: 1 }], waiting: new Set() }).review).toBe(false)
  })

  it('zieht wartende Fragen nicht, solange es andere gibt', () => {
    const waiting = new Set(nos1.slice(0, -1))
    for (let i = 0; i < 60; i++) {
      const picked = pickNewSeed(engine, 1, [], new Set(), undefined, { due: [], waiting })
      const no = questionNoOf(engine, picked.seed)
      if (no !== null) expect(no).toBe(nos1.at(-1))
    }
  })
})
