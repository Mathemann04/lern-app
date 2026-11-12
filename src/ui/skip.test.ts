import { describe, expect, it } from 'vitest'
import { avoidedQuestion, showsSkipNotice, skipTask, skippedQuestion, taskShown } from './skip.ts'

describe('Überspringen (M6 Schritt 2)', () => {
  it('meidet die Frage und zeigt den Hinweis, bis eine andere Aufgabe da ist', () => {
    skipTask({ course: 'chem-atombau', level: 1, seed: 500_123, question: 101 })
    expect(avoidedQuestion('chem-atombau', 1)).toBe(101)
    // andere Stufe oder anderes Thema: nichts zu meiden
    expect(avoidedQuestion('chem-atombau', 2)).toBeNull()
    expect(avoidedQuestion('chem-pse', 1)).toBeNull()
    expect(skippedQuestion()).toEqual({ course: 'chem-atombau', no: 101 })
    // dieselbe Aufgabe neu geladen: kein Hinweis, das Überspringen gilt weiter
    expect(showsSkipNotice('chem-atombau', 500_123)).toBe(false)
    taskShown('chem-atombau', 500_123)
    expect(avoidedQuestion('chem-atombau', 1)).toBe(101)
    // die nächste Aufgabe zeigt den Hinweis; sobald sie gezeigt ist, ist alles erledigt
    expect(showsSkipNotice('chem-atombau', 500_456)).toBe(true)
    taskShown('chem-atombau', 500_456)
    expect(avoidedQuestion('chem-atombau', 1)).toBeNull()
    expect(skippedQuestion()).toBeNull()
    expect(showsSkipNotice('chem-atombau', 500_789)).toBe(false)
  })

  it('merkt sich bei Mathe-Aufgaben und Rechnungen keine Frage', () => {
    skipTask({ course: 'ableiten', level: 2, seed: 4711, question: null })
    expect(avoidedQuestion('ableiten', 2)).toBeNull()
    expect(skippedQuestion()).toBeNull()
    expect(showsSkipNotice('ableiten', 4712)).toBe(true)
    taskShown('ableiten', 4712)
  })
})
