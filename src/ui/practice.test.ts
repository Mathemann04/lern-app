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

  it('würfelt eine neue Aufgabe, beim gezielten Üben eine passende Stufe', () => {
    expect(newTaskHref('ableiten', 'free', 3, null)).toMatch(/^#\/frei\/ableiten\/3-\d+$/)
    expect(newTaskHref('brueche', 'guided', 2, null)).toMatch(/^#\/ueben\/brueche\/2-\d+$/)
    // Der Kosinus kommt erst ab Stufe 2 vor
    expect(newTaskHref('ableiten', 'guided', 1, 'cos-sign')).toMatch(/^#\/ueben\/ableiten\/2-\d+\?fokus=cos-sign$/)
    // Potenzen mit Buchstaben gibt es erst ab Stufe 2
    expect(newTaskHref('brueche', 'guided', 1, 'frac-power-reversed')).toMatch(/^#\/ueben\/brueche\/2-\d+\?fokus=frac-power-reversed$/)
  })
})
