import { describe, expect, it } from 'vitest'
import { parseRoute, practiceHref, taskHref } from './routes.ts'

describe('parseRoute', () => {
  it('erkennt die Seiten', () => {
    expect(parseRoute('/')).toEqual({ page: 'home' })
    expect(parseRoute('/galerie')).toEqual({ page: 'gallery' })
    expect(parseRoute('/einstellungen')).toEqual({ page: 'settings' })
    expect(parseRoute('/fortschritt')).toEqual({ page: 'progress' })
    expect(parseRoute('/unbekannt')).toEqual({ page: 'home' })
  })

  it('erkennt Übungsaufgaben mit und ohne Nummer', () => {
    expect(parseRoute('/ueben/1')).toEqual({ page: 'practice', mode: 'guided', level: 1, seed: null, focus: null })
    expect(parseRoute('/ueben/1-4711')).toEqual({ page: 'practice', mode: 'guided', level: 1, seed: 4711, focus: null })
    expect(parseRoute('/ueben/9')).toEqual({ page: 'home' })
    expect(taskHref({ level: 1, seed: 4711 })).toBe('#/ueben/1-4711')
  })

  it('unterscheidet geführt und frei', () => {
    expect(parseRoute('/frei/2')).toEqual({ page: 'practice', mode: 'free', level: 2, seed: null, focus: null })
    expect(parseRoute('/frei/2-17')).toEqual({ page: 'practice', mode: 'free', level: 2, seed: 17, focus: null })
    expect(practiceHref(3, 'free')).toBe('#/frei/3')
    expect(taskHref({ level: 2, seed: 17 }, 'free')).toBe('#/frei/2-17')
  })

  it('liest den Fehler für gezieltes Üben, aber nur bekannte', () => {
    expect(parseRoute('/ueben/2-17?fokus=cos-sign')).toEqual({ page: 'practice', mode: 'guided', level: 2, seed: 17, focus: 'cos-sign' })
    expect(parseRoute('/frei/3?fokus=gibt-es-nicht')).toEqual({ page: 'practice', mode: 'free', level: 3, seed: null, focus: null })
    expect(practiceHref(2, 'guided', 'cos-sign')).toBe('#/ueben/2?fokus=cos-sign')
    expect(taskHref({ level: 2, seed: 17 }, 'free', 'cos-sign')).toBe('#/frei/2-17?fokus=cos-sign')
  })
})
