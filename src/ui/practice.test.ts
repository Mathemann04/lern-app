import { describe, expect, it } from 'vitest'
import { knownFocus, newTaskHref } from './practice.ts'

describe('Üben', () => {
  it('übt gezielt nur bekannte Fehler', () => {
    expect(knownFocus('cos-sign')).toBe('cos-sign')
    expect(knownFocus('gibt-es-nicht')).toBeNull()
    expect(knownFocus(null)).toBeNull()
  })

  it('würfelt eine neue Aufgabe, beim gezielten Üben eine passende Stufe', () => {
    expect(newTaskHref('free', 3, null)).toMatch(/^#\/frei\/3-\d+$/)
    // Der Kosinus kommt erst ab Stufe 2 vor
    expect(newTaskHref('guided', 1, 'cos-sign')).toMatch(/^#\/ueben\/2-\d+\?fokus=cos-sign$/)
  })
})
