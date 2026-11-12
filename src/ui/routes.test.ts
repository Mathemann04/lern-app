import { describe, expect, it } from 'vitest'
import { ATOMBAU } from './catalog.ts'
import { areaHref, cardFolderHref, subjectHref, courseHref, examOverviewHref, examTaskHref, mixHref, mockHref, mixPracticeHref, parseRoute, practiceHref, reviewHref, sectionOf, taskHref } from './routes.ts'

describe('parseRoute', () => {
  it('erkennt die Seiten', () => {
    expect(parseRoute('/')).toEqual({ page: 'home' })
    expect(parseRoute('/galerie')).toEqual({ page: 'gallery', course: null })
    expect(parseRoute('/galerie/brueche')).toEqual({ page: 'gallery', course: 'brueche' })
    expect(parseRoute('/galerie/umstellen')).toEqual({ page: 'gallery', course: 'umstellen' })
    expect(parseRoute('/galerie/gibtsnicht')).toEqual({ page: 'gallery', course: null })
    expect(parseRoute('/einstellungen')).toEqual({ page: 'settings' })
    expect(parseRoute('/fortschritt')).toEqual({ page: 'progress' })
    expect(parseRoute('/unbekannt')).toEqual({ page: 'home' })
  })

  it('erkennt Fächer, aber nur solche mit spielbarem Gebiet', () => {
    expect(parseRoute('/fach/mathe')).toEqual({ page: 'subject', id: 'mathe' })
    expect(parseRoute('/fach/chemie')).toEqual({ page: 'subject', id: 'chemie' })
    // Werkstoffkunde, Physik und Mechanik kommen noch
    expect(parseRoute('/fach/werkstoffkunde')).toEqual({ page: 'home' })
    expect(parseRoute('/fach/physik')).toEqual({ page: 'home' })
    expect(parseRoute('/fach/gibtsnicht')).toEqual({ page: 'home' })
    expect(subjectHref('chemie')).toBe('#/fach/chemie')
    expect(sectionOf(parseRoute('/fach/mathe'))).toBe('home')
  })

  it('erkennt Gebiete und Themen, aber nur spielbare', () => {
    expect(parseRoute('/gebiet/differentialrechnung')).toEqual({ page: 'area', id: 'differentialrechnung' })
    expect(parseRoute('/gebiet/grundlagen')).toEqual({ page: 'area', id: 'grundlagen' })
    expect(parseRoute('/thema/ableiten')).toEqual({ page: 'course', id: 'ableiten' })
    expect(parseRoute('/thema/brueche')).toEqual({ page: 'course', id: 'brueche' })
    expect(parseRoute('/thema/umstellen')).toEqual({ page: 'course', id: 'umstellen' })
    // Potenzen kommen bald
    expect(parseRoute('/thema/potenzen')).toEqual({ page: 'home' })
    // Integralrechnung kommt bald
    expect(parseRoute('/gebiet/integralrechnung')).toEqual({ page: 'home' })
    expect(parseRoute('/gebiet/gibt-es-nicht')).toEqual({ page: 'home' })
    expect(parseRoute('/thema/gibt-es-nicht')).toEqual({ page: 'home' })
    expect(areaHref('differentialrechnung')).toBe('#/gebiet/differentialrechnung')
    expect(courseHref('ableiten')).toBe('#/thema/ableiten')
  })

  it('erkennt die Lernkarten-Adressen (welche Karte gemeint ist, klärt cardRoute.ts)', () => {
    expect(parseRoute('/karten')).toEqual({ page: 'cards', folder: null, card: null })
    expect(parseRoute('/karten/ableitungen')).toEqual({ page: 'cards', folder: 'ableitungen', card: null })
    expect(parseRoute('/karten/ableitungen/product')).toEqual({ page: 'cards', folder: 'ableitungen', card: 'product' })
    expect(parseRoute('/karten/a/b/c')).toEqual({ page: 'home' })
    expect(cardFolderHref('ableitungen')).toBe('#/karten/ableitungen')
  })

  it('erkennt Übungsaufgaben mit und ohne Nummer, je Thema', () => {
    expect(parseRoute('/ueben/brueche/1')).toEqual({ page: 'practice', course: 'brueche', mode: 'guided', level: 1, seed: null, focus: null, mix: null, review: null })
    expect(parseRoute('/ueben/brueche/1-4711')).toEqual({ page: 'practice', course: 'brueche', mode: 'guided', level: 1, seed: 4711, focus: null, mix: null, review: null })
    expect(parseRoute('/ueben/ableiten/3-17')).toEqual({ page: 'practice', course: 'ableiten', mode: 'guided', level: 3, seed: 17, focus: null, mix: null, review: null })
    expect(parseRoute('/ueben/brueche/9')).toEqual({ page: 'home' })
    expect(parseRoute('/ueben/gibt-es-nicht/1')).toEqual({ page: 'home' })
    expect(parseRoute('/ueben/umstellen/2-5')).toEqual({ page: 'practice', course: 'umstellen', mode: 'guided', level: 2, seed: 5, focus: null, mix: null, review: null })
    expect(parseRoute('/ueben/potenzen/1')).toEqual({ page: 'home' })
    expect(taskHref('brueche', { level: 1, seed: 4711 })).toBe('#/ueben/brueche/1-4711')
    expect(practiceHref('brueche', 2)).toBe('#/ueben/brueche/2')
  })

  it('führt ältere Adressen ohne Thema zum Ableiten', () => {
    expect(parseRoute('/ueben/1')).toEqual({ page: 'practice', course: 'ableiten', mode: 'guided', level: 1, seed: null, focus: null, mix: null, review: null })
    expect(parseRoute('/ueben/1-4711')).toEqual({ page: 'practice', course: 'ableiten', mode: 'guided', level: 1, seed: 4711, focus: null, mix: null, review: null })
    expect(parseRoute('/frei/2-17')).toEqual({ page: 'practice', course: 'ableiten', mode: 'free', level: 2, seed: 17, focus: null, mix: null, review: null })
    expect(parseRoute('/ueben/9')).toEqual({ page: 'home' })
  })

  it('unterscheidet geführt und frei', () => {
    expect(parseRoute('/frei/ableiten/2')).toEqual({ page: 'practice', course: 'ableiten', mode: 'free', level: 2, seed: null, focus: null, mix: null, review: null })
    expect(parseRoute('/frei/ableiten/2-17')).toEqual({ page: 'practice', course: 'ableiten', mode: 'free', level: 2, seed: 17, focus: null, mix: null, review: null })
    expect(practiceHref('ableiten', 3, 'free')).toBe('#/frei/ableiten/3')
    expect(taskHref('ableiten', { level: 2, seed: 17 }, 'free')).toBe('#/frei/ableiten/2-17')
  })

  it('liest den Fehler für gezieltes Üben (ob es ihn gibt, prüft die Übungsseite)', () => {
    expect(parseRoute('/ueben/ableiten/2-17?fokus=cos-sign')).toEqual({
      page: 'practice',
      course: 'ableiten',
      mode: 'guided',
      level: 2,
      seed: 17,
      focus: 'cos-sign',
      mix: null,
      review: null,
    })
    expect(parseRoute('/ueben/2-17?fokus=cos-sign')).toMatchObject({ course: 'ableiten', seed: 17, focus: 'cos-sign' })
    expect(parseRoute('/frei/ableiten/3?fokus=')).toEqual({ page: 'practice', course: 'ableiten', mode: 'free', level: 3, seed: null, focus: null, mix: null, review: null })
    expect(practiceHref('ableiten', 2, 'guided', 'cos-sign')).toBe('#/ueben/ableiten/2?fokus=cos-sign')
    expect(taskHref('ableiten', { level: 2, seed: 17 }, 'free', 'cos-sign')).toBe('#/frei/ableiten/2-17?fokus=cos-sign')
  })
})

describe('Themen mischen', () => {
  it('erkennt die Mischseite und die gemischte Aufgabe, nur bei Fächern mit Mischung', () => {
    expect(parseRoute('/mischen/chemie')).toEqual({ page: 'mix', subject: 'chemie' })
    expect(parseRoute('/mischen/chemie/1')).toEqual({ page: 'mixPractice', subject: 'chemie', level: 1 })
    expect(parseRoute('/mischen/chemie/3')).toEqual({ page: 'mixPractice', subject: 'chemie', level: 3 })
    // Chemie hat drei Stufen: höhere oder unlesbare Stufen führen zur Auswahl
    expect(parseRoute('/mischen/chemie/4')).toEqual({ page: 'mix', subject: 'chemie' })
    expect(parseRoute('/mischen/chemie/x')).toEqual({ page: 'mix', subject: 'chemie' })
    expect(parseRoute('/mischen/chemie/1-500')).toEqual({ page: 'mix', subject: 'chemie' })
    // Mathe hat (noch) keine Mischung, Physik keine spielbaren Themen, andere gibt es nicht
    expect(parseRoute('/mischen/mathe')).toEqual({ page: 'home' })
    expect(parseRoute('/mischen/mathe/1')).toEqual({ page: 'home' })
    expect(parseRoute('/mischen/physik')).toEqual({ page: 'home' })
    expect(parseRoute('/mischen/gibt-es-nicht')).toEqual({ page: 'home' })
    expect(parseRoute('/mischen')).toEqual({ page: 'home' })
    expect(parseRoute('/mischen/chemie/1/2')).toEqual({ page: 'home' })
    expect(mixHref('chemie')).toBe('#/mischen/chemie')
    expect(mixPracticeHref('chemie', 2)).toBe('#/mischen/chemie/2')
  })

  it('liest die Mischung an Aufgaben, nur passend zum Fach des Themas; gezielt üben gewinnt', () => {
    expect(parseRoute(`/ueben/${ATOMBAU}/2-500123?mischen=chemie`)).toEqual({
      page: 'practice',
      course: ATOMBAU,
      mode: 'guided',
      level: 2,
      seed: 500_123,
      focus: null,
      mix: 'chemie',
      review: null,
    })
    expect(parseRoute(`/ueben/${ATOMBAU}/2?mischen=chemie`)).toMatchObject({ page: 'practice', seed: null, mix: 'chemie' })
    expect(parseRoute(`/frei/${ATOMBAU}/1-101?mischen=chemie`)).toMatchObject({ mode: 'free', mix: 'chemie' })
    // falsches Fach, Fach ohne Mischung, unbekannt oder leer: ohne Mischung
    expect(parseRoute('/ueben/brueche/1-4711?mischen=chemie')).toMatchObject({ course: 'brueche', mix: null, review: null })
    expect(parseRoute('/ueben/brueche/1-4711?mischen=mathe')).toMatchObject({ course: 'brueche', mix: null, review: null })
    expect(parseRoute(`/ueben/${ATOMBAU}/1-101?mischen=gibt-es-nicht`)).toMatchObject({ mix: null, review: null })
    expect(parseRoute(`/ueben/${ATOMBAU}/1-101?mischen=`)).toMatchObject({ mix: null, review: null })
    // gezielt üben und Mischung zusammen: nur gezielt
    expect(parseRoute(`/ueben/${ATOMBAU}/1-101?fokus=chem-mis-x&mischen=chemie`)).toMatchObject({ focus: 'chem-mis-x', mix: null, review: null })
    expect(parseRoute(`/ueben/${ATOMBAU}/1-101?mischen=chemie&fokus=chem-mis-x`)).toMatchObject({ focus: 'chem-mis-x', mix: null, review: null })
  })

  it('schreibt die Mischung in Aufgabenadressen, gezielt üben gewinnt', () => {
    expect(taskHref(ATOMBAU, { level: 2, seed: 500_123 }, 'guided', null, 'chemie')).toBe(`#/ueben/${ATOMBAU}/2-500123?mischen=chemie`)
    expect(practiceHref(ATOMBAU, 3, 'guided', null, 'chemie')).toBe(`#/ueben/${ATOMBAU}/3?mischen=chemie`)
    expect(taskHref(ATOMBAU, { level: 2, seed: 101 }, 'guided', 'chem-mis-x', 'chemie')).toBe(`#/ueben/${ATOMBAU}/2-101?fokus=chem-mis-x`)
    expect(taskHref(ATOMBAU, { level: 2, seed: 101 }, 'guided', null, null)).toBe(`#/ueben/${ATOMBAU}/2-101`)
    // hin und zurück
    const href = taskHref(ATOMBAU, { level: 1, seed: 500_000 + 50 * 101 + 3 }, 'guided', null, 'chemie')
    expect(parseRoute(href.slice(1))).toMatchObject({ course: ATOMBAU, level: 1, seed: 505_053, mix: 'chemie' })
    expect(parseRoute(mixPracticeHref('chemie', 2).slice(1))).toEqual({ page: 'mixPractice', subject: 'chemie', level: 2 })
    expect(parseRoute(mixHref('chemie').slice(1))).toEqual({ page: 'mix', subject: 'chemie' })
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
    expect(sectionOf(parseRoute('/ueben/brueche/2-4'))).toBeNull()
    expect(sectionOf(parseRoute('/galerie'))).toBeNull()
    // Mischseite gehört zum Start, die gemischte Aufgabe zu keinem Bereich
    expect(sectionOf(parseRoute('/mischen/chemie'))).toBe('home')
    expect(sectionOf(parseRoute('/mischen/chemie/2'))).toBeNull()
    expect(sectionOf(parseRoute(`/ueben/${ATOMBAU}/2-101?mischen=chemie`))).toBeNull()
  })
})

describe('Klausuraufgabe üben (S4c)', () => {
  it('erkennt die Adressen, nur für Aufgaben mit Kachel im Katalog', () => {
    expect(parseRoute('/klausur/chemie/aufgabe/4')).toEqual({ page: 'examTask', subject: 'chemie', task: 4, seed: null })
    expect(parseRoute('/klausur/chemie/aufgabe/4/123')).toEqual({ page: 'examTask', subject: 'chemie', task: 4, seed: 123 })
    expect(parseRoute('/klausur/chemie/aufgabe/9')).toEqual({ page: 'home' })
    expect(parseRoute('/klausur/mathe/aufgabe/4')).toEqual({ page: 'home' })
    expect(parseRoute('/klausur/chemie/aufgabe/4/x')).toEqual({ page: 'home' })
    expect(examTaskHref('chemie', 4)).toBe('#/klausur/chemie/aufgabe/4')
    expect(examTaskHref('chemie', 4, 7)).toBe('#/klausur/chemie/aufgabe/4/7')
    expect(sectionOf({ page: 'examTask', subject: 'chemie', task: 4, seed: 1 })).toBeNull()
  })
})


describe('Probeklausur (S9)', () => {
  it('erkennt Deckblatt und Klausur, nur für Fächer mit Probeklausur', () => {
    expect(parseRoute('/probeklausur/chemie')).toEqual({ page: 'mock', subject: 'chemie', id: null })
    expect(parseRoute('/probeklausur/chemie/4711')).toEqual({ page: 'mock', subject: 'chemie', id: 4711 })
    expect(parseRoute('/probeklausur/chemie/0')).toEqual({ page: 'mock', subject: 'chemie', id: null })
    expect(parseRoute('/probeklausur/mathe')).toEqual({ page: 'home' })
    expect(parseRoute('/probeklausur/chemie/123456')).toEqual({ page: 'home' })
    expect(parseRoute('/probeklausur/chemie/x')).toEqual({ page: 'home' })
    expect(mockHref('chemie')).toBe('#/probeklausur/chemie')
    expect(mockHref('chemie', 7)).toBe('#/probeklausur/chemie/7')
    expect(sectionOf(parseRoute('/probeklausur/chemie'))).toBe('home')
    expect(sectionOf(parseRoute('/probeklausur/chemie/7'))).toBeNull()
  })
})

describe('Klausur-Start (S11)', () => {
  it('erkennt den Klausur-Überblick, nur für Fächer mit Probeklausur', () => {
    expect(parseRoute('/klausur/chemie')).toEqual({ page: 'examOverview', subject: 'chemie' })
    expect(parseRoute('/klausur/mathe')).toEqual({ page: 'home' })
    expect(parseRoute('/klausur/gibtsnicht')).toEqual({ page: 'home' })
    expect(parseRoute('/klausur/chemie/aufgabe')).toEqual({ page: 'home' })
    expect(examOverviewHref('chemie')).toBe('#/klausur/chemie')
    expect(parseRoute(examOverviewHref('chemie').slice(1))).toEqual({ page: 'examOverview', subject: 'chemie' })
    expect(sectionOf(parseRoute('/klausur/chemie'))).toBe('home')
  })

  it('erkennt „Wiederholen" eines Fachs mit spielbaren Themen', () => {
    expect(parseRoute('/wiederholen/chemie')).toEqual({ page: 'review', subject: 'chemie' })
    expect(parseRoute('/wiederholen/mathe')).toEqual({ page: 'review', subject: 'mathe' })
    expect(parseRoute('/wiederholen/physik')).toEqual({ page: 'home' })
    expect(parseRoute('/wiederholen/gibtsnicht')).toEqual({ page: 'home' })
    expect(parseRoute('/wiederholen')).toEqual({ page: 'home' })
    expect(reviewHref('chemie')).toBe('#/wiederholen/chemie')
    expect(sectionOf(parseRoute('/wiederholen/chemie'))).toBe('home')
  })

  it('liest und schreibt die Wiederholung an Aufgaben, nur passend zum Fach; gezielt üben und Mischung gewinnen', () => {
    const href = taskHref(ATOMBAU, { level: 2, seed: 505_053 }, 'guided', null, null, 'chemie')
    expect(href).toBe(`#/ueben/${ATOMBAU}/2-505053?wiederholen=chemie`)
    expect(parseRoute(href.slice(1))).toEqual({ page: 'practice', course: ATOMBAU, mode: 'guided', level: 2, seed: 505_053, focus: null, mix: null, review: 'chemie' })
    expect(practiceHref(ATOMBAU, 1, 'guided', null, null, 'chemie')).toBe(`#/ueben/${ATOMBAU}/1?wiederholen=chemie`)
    expect(taskHref(ATOMBAU, { level: 2, seed: 101 }, 'guided', null, 'chemie', 'chemie')).toBe(`#/ueben/${ATOMBAU}/2-101?mischen=chemie`)
    expect(parseRoute('/ueben/brueche/1-4711?wiederholen=chemie')).toMatchObject({ review: null })
    expect(parseRoute(`/ueben/${ATOMBAU}/1-101?wiederholen=mathe`)).toMatchObject({ review: null })
    expect(parseRoute(`/ueben/${ATOMBAU}/1-101?wiederholen=chemie&mischen=chemie`)).toMatchObject({ mix: 'chemie', review: null })
    expect(parseRoute(`/ueben/${ATOMBAU}/1-101?wiederholen=chemie&fokus=chem-mis-x`)).toMatchObject({ focus: 'chem-mis-x', review: null })
    expect(sectionOf(parseRoute(href.slice(1)))).toBeNull()
  })
})
