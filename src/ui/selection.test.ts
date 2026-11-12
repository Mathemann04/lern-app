import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type Settings } from '../state/storage.ts'
import { ATOMBAU, type Course, DERIVATIVES, REARRANGE, courseById, partsAvailable, subjectById } from './catalog.ts'
import {
  allPartsChecked,
  blockedHint,
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
  missingBlocks,
  partWords,
  playableLevels,
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
  const comingSoon = chemistry.areas.flatMap((a) => a.courses).find((c) => c.id === 'chem-broensted')!

  it('beginnt mit Stufe 1 und allen Themen', () => {
    expect(mixChoiceOf(chemistry, DEFAULT_SETTINGS)).toEqual({ level: 1, skip: [] })
    expect(isMixCourseChecked(chemistry, atombau, DEFAULT_SETTINGS)).toBe(true)
    // seit S3a und S3b auch „Reaktionsgleichungen" und „Stoffmenge und Umsatz", seit S5a „Ionenbindung und Salze", seit S5b „Moleküle", seit S5c „Zwischenmolekulare Kräfte", seit S5d „Metallbindung und Hybridisierung", seit S6a „Elektronen", seit S6c „Aufbau des Periodensystems", seit S6d „Trends im Periodensystem", seit S7a „Chemisches Gleichgewicht", seit S7b „Energie bei Reaktionen"
    expect(mixedCourses(chemistry, DEFAULT_SETTINGS).map((c) => c.id)).toEqual([ATOMBAU, 'chem-elektronen', 'chem-pse', 'chem-trends', 'chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-metalle', 'chem-gleichungen', 'chem-stoffmenge', 'chem-loesungen', 'chem-mwg', 'chem-energie'])
  })

  it('nimmt nur angekreuzte Themen, deren Stufe spielbar ist und deren Unterthemen dort Fragen haben', () => {
    const settings: Settings = { ...DEFAULT_SETTINGS, mix: { chemie: { level: 2, skip: [] } } }
    expect(mixChoiceOf(chemistry, settings).level).toBe(2)
    expect(mixedCourses(chemistry, settings).map((c) => c.id)).toEqual([ATOMBAU, 'chem-elektronen', 'chem-pse', 'chem-trends', 'chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-metalle', 'chem-gleichungen', 'chem-stoffmenge', 'chem-loesungen', 'chem-mwg', 'chem-energie'])
    // Atombau und Stoffmenge abgewählt
    const skipped: Settings = { ...settings, mix: { chemie: { level: 2, skip: [ATOMBAU, 'chem-elektronen', 'chem-pse', 'chem-trends', 'chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-metalle', 'chem-gleichungen', 'chem-stoffmenge', 'chem-loesungen', 'chem-mwg', 'chem-energie'] } } }
    expect(isMixCourseChecked(chemistry, atombau, skipped)).toBe(false)
    expect(mixedCourses(chemistry, skipped)).toEqual([])
    // Themen ohne spielbare Stufe kommen nie vor, auch angekreuzt
    expect(isMixCourseChecked(chemistry, comingSoon, settings)).toBe(true)
    expect(mixedCourses(chemistry, settings, 1).map((c) => c.id)).not.toContain(comingSoon.id)
    // nur Atommodelle angekreuzt: in Grundlagen nichts zu üben, in Vertiefung schon
    const onlyModels: Settings = { ...settings, skipParts: { [ATOMBAU]: ['stoffe', 'teilchen', 'isotope-ionen', 'licht'] } }
    expect(mixedCourses(chemistry, onlyModels, 1).map((c) => c.id)).toEqual(['chem-elektronen', 'chem-pse', 'chem-trends', 'chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-metalle', 'chem-gleichungen', 'chem-stoffmenge', 'chem-loesungen', 'chem-mwg', 'chem-energie'])
    expect(mixedCourses(chemistry, onlyModels, 2).map((c) => c.id)).toEqual([ATOMBAU, 'chem-elektronen', 'chem-pse', 'chem-trends', 'chem-ionen', 'chem-molekuele', 'chem-zmk', 'chem-metalle', 'chem-gleichungen', 'chem-stoffmenge', 'chem-loesungen', 'chem-mwg', 'chem-energie'])
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

describe('Bausteine ankreuzen (M6 Schritt 3, Gleichungen umstellen)', () => {
  const rearrange = courseById(REARRANGE)!.course
  const all = rearrange.parts!.map((part) => part.id)
  // nur diese Bausteine angekreuzt
  const only = (...keep: string[]): Settings => withSkip(all.filter((id) => !keep.includes(id)), REARRANGE)

  it('kennt Bausteine mit Gruppen und je Stufe die Mengen, die zusammen vorkommen', () => {
    expect(all).toHaveLength(17)
    expect(new Set(rearrange.parts!.map((part) => part.group))).toEqual(new Set(['grundlagen', 'funktionen', 'spaeter']))
    expect(partWords(rearrange).many).toBe('Bausteine')
    expect(partWords(atombau).many).toBe('Unterthemen')
    // in Stufe 1 gibt es nur lineare Gleichungen
    expect(partsAvailable(rearrange, 1).map((part) => part.id)).toEqual(['linear'])
  })

  it('ist spielbar, wenn eine Menge der Stufe ganz angekreuzt ist, sonst nicht', () => {
    expect(isSelectionPlayable(rearrange, DEFAULT_SETTINGS, 5)).toBe(true)
    expect(isSelectionPlayable(rearrange, only('det'), 5)).toBe(true)
    expect(isSelectionPlayable(rearrange, only('det'), 1)).toBe(false)
    // Ableitungen gibt es in Stufe 5 nur zusammen mit anderen Bausteinen
    expect(isSelectionPlayable(rearrange, only('ableitung'), 5)).toBe(false)
    expect(isSelectionPlayable(rearrange, only('ableitung', 'winkel'), 5)).toBe(true)
    // Quadratische Gleichungen gibt es in Stufe 3 nur mit Wurzeln, allein nur in Stufe 4 (in Stufe 5 steckt in jeder
    // Aufgabe ein Werkzeug)
    expect(playableLevels(rearrange, only('quadratisch'))).toEqual([4])
    expect(isSelectionPlayable(rearrange, only(), 1)).toBe(false)
  })

  it('fällt nie auf alle Bausteine zurück (keine Aufgabe mit nicht angekreuztem Baustein)', () => {
    expect(selectedParts(rearrange, DEFAULT_SETTINGS, 3)).toBeUndefined()
    expect(ids(selectedParts(rearrange, only('det'), 1))).toEqual(['det'])
    expect(ids(selectedParts(rearrange, only('brueche'), 4))).toEqual(['brueche'])
    expect(ids(selectedParts(rearrange, only(), 2))).toEqual([])
  })

  it('schlägt nur Bausteine vor, die mit den angekreuzten eine Aufgabe ergeben', () => {
    // nur Ableitungen in Stufe 5: jeder Vorschlag macht die Auswahl spielbar
    const missing = missingBlocks(rearrange, only('ableitung'), 5)
    expect(missing.length).toBeGreaterThan(0)
    for (const title of missing) {
      const id = rearrange.parts!.find((part) => part.title === title)!.id
      expect(isSelectionPlayable(rearrange, only('ableitung', id), 5), title).toBe(true)
    }
    // nur Determinanten in Stufe 1: Lineare Gleichungen ergäben Aufgaben, aber keine mit Determinanten
    expect(missingBlocks(rearrange, only('det'), 1)).toEqual([])
  })

  it('nennt im Hinweis nur Stufen und Bausteine, mit denen es wirklich Aufgaben gibt', () => {
    expect(blockedHint(rearrange, only(), 3)).toBe('Kreuze mindestens einen Baustein an.')
    expect(blockedHint(rearrange, only('det'), 1)).toBe('Zu deiner Auswahl gibt es in Stufe 1 keine Aufgaben. In Stufe 5 gibt es welche.')
    expect(blockedHint(rearrange, only('quadratisch'), 1)).toBe('Zu deiner Auswahl gibt es in Stufe 1 keine Aufgaben. In Stufe 4 gibt es welche.')
    expect(blockedHint(rearrange, only('det', 'dgl'), 3)).toBe('Zu deiner Auswahl gibt es in Stufe 3 keine Aufgaben. In Stufe 5 gibt es welche.')
    expect(blockedHint(rearrange, only('ableitung'), 5)).toMatch(/^Zu deiner Auswahl gibt es in Stufe 5 keine Aufgaben\. Kreuze dazu z\. B\. .+ an\.$/)
    expect(blockedHint(rearrange, only('ableitung'), 2)).toMatch(/^Zu deiner Auswahl gibt es in Stufe 2 keine Aufgaben\. In Stufe 5 gibt es welche, wenn du z\. B\. .+ dazu ankreuzt\.$/)
    // Chemie wie bisher
    expect(blockedHint(atombau, withSkip(['teilchen', 'isotope-ionen', 'modelle', 'licht']), 2)).toBe('Kreuze mindestens ein Unterthema an, das es in Vertiefung gibt.')
  })
})
