import { describe, expect, it } from 'vitest'
import { knownFocus, newTaskHref } from './practice.ts'

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
