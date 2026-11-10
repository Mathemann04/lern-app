import { beforeEach, describe, expect, it } from 'vitest'
import { setLastMix, setMixCourseChecked, setMixLevel, setMixSkipped, setPartChecked, setSkippedParts } from './settings.ts'
import { DEFAULT_STATE } from './storage.ts'
import { getAppState, updateAppState } from './store.ts'

// Auswahl, was drankommt (S1b): Unterthemen je Thema, Mischung je Fach, zuletzt gemischt. In den Tests
// ohne Browser-Speicher: Der Zustand lebt nur im Arbeitsspeicher.

const settings = () => getAppState().settings

describe('Auswahl in den Einstellungen', () => {
  beforeEach(() => updateAppState(() => DEFAULT_STATE))

  it('merkt sich je Thema die nicht angekreuzten Unterthemen', () => {
    setPartChecked('chem-atombau', 'modelle', false)
    setPartChecked('chem-atombau', 'licht', false)
    // zweimal abwählen ändert nichts
    setPartChecked('chem-atombau', 'licht', false)
    setPartChecked('chem-andere', 'teil', false)
    expect(settings().skipParts).toEqual({ 'chem-atombau': ['modelle', 'licht'], 'chem-andere': ['teil'] })
    setPartChecked('chem-atombau', 'modelle', true)
    expect(settings().skipParts['chem-atombau']).toEqual(['licht'])
    // alles wieder angekreuzt: Der Eintrag verschwindet
    setPartChecked('chem-atombau', 'licht', true)
    expect(settings().skipParts).toEqual({ 'chem-andere': ['teil'] })
    setSkippedParts('chem-atombau', ['stoffe', 'stoffe', 'teilchen'])
    expect(settings().skipParts['chem-atombau']).toEqual(['stoffe', 'teilchen'])
    // „Alle wählen"
    setSkippedParts('chem-atombau', [])
    expect(settings().skipParts).toEqual({ 'chem-andere': ['teil'] })
  })

  it('merkt sich je Fach Stufe und nicht angekreuzte Themen der Mischung', () => {
    setMixLevel('chemie', 2)
    expect(settings().mix).toEqual({ chemie: { level: 2, skip: [] } })
    setMixCourseChecked('chemie', 'chem-atombau', false)
    setMixCourseChecked('chemie', 'chem-elektronen', false)
    setMixCourseChecked('chemie', 'chem-elektronen', false)
    expect(settings().mix.chemie).toEqual({ level: 2, skip: ['chem-atombau', 'chem-elektronen'] })
    setMixCourseChecked('chemie', 'chem-atombau', true)
    setMixLevel('chemie', 3)
    expect(settings().mix.chemie).toEqual({ level: 3, skip: ['chem-elektronen'] })
    setMixSkipped('chemie', [])
    expect(settings().mix.chemie).toEqual({ level: 3, skip: [] })
    // ein anderes Fach beginnt mit Stufe 1
    setMixCourseChecked('mathe', 'brueche', false)
    expect(settings().mix.mathe).toEqual({ level: 1, skip: ['brueche'] })
  })

  it('merkt sich das Fach der zuletzt geübten Mischung', () => {
    expect(settings().lastMix).toBeNull()
    setLastMix('chemie')
    expect(settings().lastMix).toBe('chemie')
    const before = getAppState()
    // gleicher Wert: kein neuer Zustand (kein unnötiges Neuzeichnen)
    setLastMix('chemie')
    expect(getAppState()).toBe(before)
    setLastMix(null)
    expect(settings().lastMix).toBeNull()
  })
})
