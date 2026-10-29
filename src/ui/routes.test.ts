import { describe, expect, it } from 'vitest'
import { areaHref, cardFolderHref, cardHref, courseHref, parseRoute, practiceHref, sectionOf, taskHref } from './routes.ts'

describe('parseRoute', () => {
  it('erkennt die Seiten', () => {
    expect(parseRoute('/')).toEqual({ page: 'home' })
    expect(parseRoute('/galerie')).toEqual({ page: 'gallery' })
    expect(parseRoute('/einstellungen')).toEqual({ page: 'settings' })
    expect(parseRoute('/fortschritt')).toEqual({ page: 'progress' })
    expect(parseRoute('/unbekannt')).toEqual({ page: 'home' })
  })

  it('erkennt Gebiete und Themen, aber nur spielbare', () => {
    expect(parseRoute('/gebiet/differentialrechnung')).toEqual({ page: 'area', id: 'differentialrechnung' })
    expect(parseRoute('/thema/ableiten')).toEqual({ page: 'course', id: 'ableiten' })
    // Integralrechnung kommt bald
    expect(parseRoute('/gebiet/integralrechnung')).toEqual({ page: 'home' })
    expect(parseRoute('/gebiet/gibt-es-nicht')).toEqual({ page: 'home' })
    expect(parseRoute('/thema/gibt-es-nicht')).toEqual({ page: 'home' })
    expect(areaHref('differentialrechnung')).toBe('#/gebiet/differentialrechnung')
    expect(courseHref('ableiten')).toBe('#/thema/ableiten')
  })

  it('erkennt die Lernkarten mit Ordnern, Unbekanntes führt eine Ebene höher', () => {
    expect(parseRoute('/karten')).toEqual({ page: 'cards' })
    expect(parseRoute('/karten/ableitungen')).toEqual({ page: 'cardTopic', topic: 'ableitungen' })
    expect(parseRoute('/karten/ableitungen/product')).toEqual({ page: 'card', id: 'product' })
    expect(parseRoute('/karten/ableitungen/gibt-es-nicht')).toEqual({ page: 'cardTopic', topic: 'ableitungen' })
    expect(parseRoute('/karten/gibt-es-nicht/product')).toEqual({ page: 'cards' })
    expect(parseRoute('/karten/gibt-es-nicht')).toEqual({ page: 'cards' })
    // ältere Adresse ohne Ordner
    expect(parseRoute('/karten/product')).toEqual({ page: 'card', id: 'product' })
    expect(cardHref('sin-cos')).toBe('#/karten/ableitungen/sin-cos')
    expect(cardFolderHref('ableitungen')).toBe('#/karten/ableitungen')
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

describe('sectionOf', () => {
  it('markiert den Bereich im Hauptmenü, Aufgaben und Galerie gehören zu keinem', () => {
    expect(sectionOf(parseRoute('/'))).toBe('home')
    expect(sectionOf(parseRoute('/gebiet/differentialrechnung'))).toBe('home')
    expect(sectionOf(parseRoute('/thema/ableiten'))).toBe('home')
    expect(sectionOf(parseRoute('/karten/ableitungen/product'))).toBe('cards')
    expect(sectionOf(parseRoute('/fortschritt'))).toBe('progress')
    expect(sectionOf(parseRoute('/einstellungen'))).toBe('settings')
    expect(sectionOf(parseRoute('/ueben/2-4'))).toBeNull()
    expect(sectionOf(parseRoute('/galerie'))).toBeNull()
  })
})
