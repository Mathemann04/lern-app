import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type Settings } from '../state/storage.ts'
import { ATOMBAU, type Course, DERIVATIVES, courseById, subjectById } from './catalog.ts'
import {
  allPartsChecked,
  checkedParts,
  courseSummary,
  isMixCourseChecked,
  isPartChecked,
  isSelectionPlayable,
  joinTitles,
  levelPartCount,
  mixBlockedHint,
  mixChoiceOf,
  mixedCourses,
  selectedParts,
} from './selection.ts'

// Was drankommt (S1b): angekreuzte Unterthemen und Auswahl der Mischung aus den Einstellungen

const atombau = courseById(ATOMBAU)!.course
const derivatives = courseById(DERIVATIVES)!.course
const chemistry = subjectById('chemie')!
const withSkip = (skip: readonly string[], course = ATOMBAU): Settings => ({ ...DEFAULT_SETTINGS, skipParts: { [course]: skip } })
const ids = (set: ReadonlySet<string> | undefined) => (set ? [...set].sort() : set)

describe('Unterthemen ankreuzen', () => {
  it('hat ohne Angabe alles angekreuzt', () => {
    expect(checkedParts(atombau, DEFAULT_SETTINGS)).toEqual(['stoffe', 'teilchen', 'isotope-ionen', 'modelle', 'licht'])
    expect(allPartsChecked(atombau, DEFAULT_SETTINGS)).toBe(true)
    expect(selectedParts(atombau, DEFAULT_SETTINGS)).toBeUndefined()
    expect(selectedParts(atombau, DEFAULT_SETTINGS, 2)).toBeUndefined()
    // Themen ohne Unterthemen (Mathe)
    expect(checkedParts(derivatives, DEFAULT_SETTINGS)).toEqual([])
    expect(allPartsChecked(derivatives, DEFAULT_SETTINGS)).toBe(true)
    expect(selectedParts(derivatives, withSkip(['x'], DERIVATIVES), 1)).toBeUndefined()
    expect(isSelectionPlayable(derivatives, DEFAULT_SETTINGS, 5)).toBe(true)
  })

  it('liefert die angekreuzten Unterthemen in der Reihenfolge der Anzeige', () => {
    const settings = withSkip(['licht', 'stoffe', 'gibt-es-nicht'])
    expect(checkedParts(atombau, settings)).toEqual(['teilchen', 'isotope-ionen', 'modelle'])
    expect(isPartChecked(atombau, 'licht', settings)).toBe(false)
    expect(isPartChecked(atombau, 'modelle', settings)).toBe(true)
    expect(allPartsChecked(atombau, settings)).toBe(false)
    expect(ids(selectedParts(atombau, settings))).toEqual(['isotope-ionen', 'modelle', 'teilchen'])
    expect(ids(selectedParts(atombau, settings, 1))).toEqual(['isotope-ionen', 'modelle', 'teilchen'])
    // unbekannte Ids im Speicher ändern nichts daran, dass alles angekreuzt ist
    expect(allPartsChecked(atombau, withSkip(['gibt-es-nicht']))).toBe(true)
    expect(selectedParts(atombau, withSkip(['gibt-es-nicht']), 1)).toBeUndefined()
  })

  it('weiß, ob die Auswahl in einer Stufe Fragen hat, und fällt sonst auf alle zurück', () => {
    // nur Atommodelle: erst ab Vertiefung
    const onlyModels = withSkip(['stoffe', 'teilchen', 'isotope-ionen', 'licht'])
    expect(isSelectionPlayable(atombau, onlyModels, 1)).toBe(false)
    expect(isSelectionPlayable(atombau, onlyModels, 2)).toBe(true)
    expect(selectedParts(atombau, onlyModels, 1)).toBeUndefined()
    expect(ids(selectedParts(atombau, onlyModels, 2))).toEqual(['modelle'])
    // nichts angekreuzt: nirgends spielbar, die Engine bekommt alle
    const nothing = withSkip(atombau.parts!.map((p) => p.id))
    for (const level of [1, 2, 3] as const) {
      expect(isSelectionPlayable(atombau, nothing, level)).toBe(false)
      expect(selectedParts(atombau, nothing, level)).toBeUndefined()
    }
    expect(selectedParts(atombau, nothing)).toBeUndefined()
    // Stufe, die es nicht gibt
    expect(isSelectionPlayable(atombau, DEFAULT_SETTINGS, 4)).toBe(false)
  })
})

describe('Auswahl der Mischung', () => {
  const comingSoon = chemistry.areas.flatMap((a) => a.courses).find((c) => c.id === 'chem-elektronen')!

  it('beginnt mit Stufe 1 und allen Themen', () => {
    expect(mixChoiceOf(chemistry, DEFAULT_SETTINGS)).toEqual({ level: 1, skip: [] })
    expect(isMixCourseChecked(chemistry, atombau, DEFAULT_SETTINGS)).toBe(true)
    // seit S3a und S3b auch „Reaktionsgleichungen" und „Stoffmenge und Umsatz", seit S5a „Ionenbindung und Salze", seit S5b „Moleküle", seit S5c „Zwischenmolekulare Kräfte"
    expect(mixedCourses(chemistry, DEFAULT_SETTINGS).map((c) => c.id)).toEqual([ATOMBAU, 'chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-gleichungen', 'chem-stoffmenge', 'chem-loesungen'])
  })

  it('nimmt nur angekreuzte Themen, deren Stufe spielbar ist und deren Unterthemen dort Fragen haben', () => {
    const settings: Settings = { ...DEFAULT_SETTINGS, mix: { chemie: { level: 2, skip: [] } } }
    expect(mixChoiceOf(chemistry, settings).level).toBe(2)
    expect(mixedCourses(chemistry, settings).map((c) => c.id)).toEqual([ATOMBAU, 'chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-gleichungen', 'chem-stoffmenge', 'chem-loesungen'])
    // Atombau und Stoffmenge abgewählt
    const skipped: Settings = { ...settings, mix: { chemie: { level: 2, skip: [ATOMBAU, 'chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-gleichungen', 'chem-stoffmenge', 'chem-loesungen'] } } }
    expect(isMixCourseChecked(chemistry, atombau, skipped)).toBe(false)
    expect(mixedCourses(chemistry, skipped)).toEqual([])
    // Themen ohne spielbare Stufe kommen nie vor, auch angekreuzt
    expect(isMixCourseChecked(chemistry, comingSoon, settings)).toBe(true)
    expect(mixedCourses(chemistry, settings, 1).map((c) => c.id)).not.toContain(comingSoon.id)
    // nur Atommodelle angekreuzt: in Grundlagen nichts zu üben, in Vertiefung schon
    const onlyModels: Settings = { ...settings, skipParts: { [ATOMBAU]: ['stoffe', 'teilchen', 'isotope-ionen', 'licht'] } }
    expect(mixedCourses(chemistry, onlyModels, 1).map((c) => c.id)).toEqual(['chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-gleichungen', 'chem-stoffmenge', 'chem-loesungen'])
    expect(mixedCourses(chemistry, onlyModels, 2).map((c) => c.id)).toEqual([ATOMBAU, 'chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-gleichungen', 'chem-stoffmenge', 'chem-loesungen'])
  })

  it('hält die Reihenfolge der Startseite ein und übersteht eine Stufe, die das Fach nicht hat', () => {
    const second: Course = { ...atombau, id: 'chem-zweites' }
    const subject = { ...chemistry, areas: [{ ...chemistry.areas[0], courses: [second, atombau] }] }
    expect(mixedCourses(subject, DEFAULT_SETTINGS).map((c) => c.id)).toEqual(['chem-zweites', ATOMBAU])
    expect(mixChoiceOf(chemistry, { ...DEFAULT_SETTINGS, mix: { chemie: { level: 5, skip: ['x'] } } })).toEqual({ level: 1, skip: ['x'] })
  })
})

describe('Texte zur Auswahl', () => {
  it('zählt die angekreuzten Unterthemen nur unter denen der Stufe', () => {
    expect(levelPartCount(atombau, DEFAULT_SETTINGS, 1)).toBeNull()
    // Atommodelle sowie Licht und Spektren gibt es in Grundlagen nicht: dort ist alles angekreuzt
    const noModelsNoLight = withSkip(['modelle', 'licht'])
    expect(levelPartCount(atombau, noModelsNoLight, 1)).toBeNull()
    expect(levelPartCount(atombau, noModelsNoLight, 2)).toEqual({ checked: 2, total: 4 })
    expect(levelPartCount(atombau, noModelsNoLight, 3)).toEqual({ checked: 3, total: 5 })
    // nichts angekreuzt, das es in der Stufe gibt
    expect(levelPartCount(atombau, withSkip(['stoffe', 'teilchen', 'isotope-ionen', 'licht']), 1)).toEqual({ checked: 0, total: 3 })
    expect(levelPartCount(derivatives, withSkip(['x'], DERIVATIVES), 1)).toBeNull()
  })

  it('nennt ein Thema mit der Zahl der angekreuzten Unterthemen, wenn in der Stufe nicht alle angekreuzt sind', () => {
    expect(courseSummary(atombau, DEFAULT_SETTINGS, 2)).toBe('Atombau')
    expect(courseSummary(atombau, withSkip(['licht']), 3)).toBe('Atombau (4 von 5 Unterthemen)')
    expect(courseSummary(atombau, withSkip(['licht']), 2)).toBe('Atombau (3 von 4 Unterthemen)')
    // Stoffe gibt es in Vertiefung nicht
    expect(courseSummary(atombau, withSkip(['stoffe']), 2)).toBe('Atombau')
    expect(courseSummary(derivatives, withSkip(['x'], DERIVATIVES), 1)).toBe('Ableiten')
  })

  it('nennt im Hinweis der leeren Mischung den wahren Grund', () => {
    const onlyModels: Settings = { ...DEFAULT_SETTINGS, skipParts: { [ATOMBAU]: ['stoffe', 'teilchen', 'isotope-ionen', 'licht'] } }
    // Atombau ist angekreuzt, aber keins seiner Unterthemen gibt es in Grundlagen
    expect(mixBlockedHint(chemistry, onlyModels, 1)).toBe('Kreuze bei Atombau mindestens ein Unterthema an, das es in Grundlagen gibt.')
    expect(mixBlockedHint(chemistry, onlyModels, 1, true)).toBe('Kreuze unten bei Atombau mindestens ein Unterthema an, das es in Grundlagen gibt.')
    // kein Thema angekreuzt
    const noCourse: Settings = { ...onlyModels, mix: { chemie: { level: 1, skip: [ATOMBAU] } } }
    expect(mixBlockedHint(chemistry, noCourse, 1)).toBe('Kreuze mindestens ein Thema an, das es in Grundlagen gibt.')
    expect(mixBlockedHint(chemistry, noCourse, 2, true)).toBe('Kreuze unten mindestens ein Thema an, das es in Vertiefung gibt.')
  })

  it('zählt Themen auf', () => {
    expect(joinTitles([])).toBe('')
    expect(joinTitles(['Atombau'])).toBe('Atombau')
    expect(joinTitles(['Atombau', 'Elektronen'])).toBe('Atombau und Elektronen')
    expect(joinTitles(['Atombau', 'Elektronen', 'Trends'])).toBe('Atombau, Elektronen und Trends')
  })
})
