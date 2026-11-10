import { describe, expect, it } from 'vitest'
import { TOPICS, topicById } from '../engine/explain/cards.ts'
import { ERRORS_BY_COURSE } from '../engine/errorCatalog.ts'
import { toLatex } from '../engine/expr/print.ts'
import { isMathTask } from '../engine/guided/types.ts'
import {
  ATOMBAU,
  AVAILABLE_COURSES,
  DERIVATIVES,
  FRACTIONS,
  SUBJECTS,
  areaById,
  courseById,
  courseOfCards,
  isAreaAvailable,
  isChemCourse,
  isMixAvailable,
  levelCount,
  levelName,
  mixCourses,
  partsAvailable,
  playableLevel,
  subjectById,
  subjectLevelCount,
  subjectLevelName,
} from './catalog.ts'
import { loadCourseEngine } from './courseEngines.ts'

const areas = SUBJECTS.flatMap((s) => s.areas)
const courses = areas.flatMap((a) => a.courses)

describe('Aufbau der App (Fächer, Gebiete, Themen)', () => {
  it('hat eindeutige Ids', () => {
    const ids = [...SUBJECTS.map((s) => s.id), ...areas.map((a) => a.id), ...courses.map((c) => c.id)]
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('verbindet jedes spielbare Thema mit einem Ordner der Lernkarten und jeden Ordner mit einem Thema', () => {
    for (const course of AVAILABLE_COURSES) expect(topicById(course.cards ?? ''), course.id).toBeDefined()
    expect(TOPICS.map((t) => t.id).sort()).toEqual(courses.flatMap((c) => (c.cards ? [c.cards] : [])).sort())
    expect(courseOfCards('brueche')?.course.id).toBe(FRACTIONS)
  })

  it('kennt zu jedem spielbaren Thema Engine und typische Fehler', async () => {
    for (const course of AVAILABLE_COURSES) {
      expect(ERRORS_BY_COURSE[course.id]?.length, course.id).toBeGreaterThan(0)
      const engine = await loadCourseEngine(course.id)
      const level = course.levels.find((l) => l.available)!.level
      // Wissensfragen: eine Nummer, die es in der Stufe gibt
      const seed = engine.nextSeed ? engine.nextSeed(level) : 1
      const plan = engine.planGuidedTask({ level, seed })
      expect(plan.steps.length, course.id).toBeGreaterThan(0)
      // freier Modus: das Ergebnis des geführten Modus (Mathe-Engine) gilt als richtig
      if (course.free) {
        if (!isMathTask(plan)) throw new Error(`${course.id}: freier Modus ohne Ergebnis als Term`)
        expect(engine.prepareFree({ level, seed }).check(toLatex(plan.result)).kind, course.id).toBe('correct')
      }
    }
  })

  it('hat je Thema so viele Stufen wie sein Fach (levelNames) oder keine (kommt bald)', () => {
    for (const subject of SUBJECTS) {
      const count = subject.levelNames?.length ?? 5
      for (const course of subject.areas.flatMap((a) => a.courses)) {
        expect([0, count], course.id).toContain(course.levels.length)
        expect(course.levels.map((l) => l.level), course.id).toEqual(Array.from({ length: course.levels.length }, (_, i) => i + 1))
        expect(levelCount(course.id)).toBe(count)
      }
    }
  })

  it('nennt die Stufen in Chemie mit Namen, in Mathe mit Nummer', () => {
    expect(levelName(DERIVATIVES, 3)).toBe('Stufe 3')
    expect([1, 2, 3].map((l) => levelName(ATOMBAU, l as 1 | 2 | 3))).toEqual(['Grundlagen', 'Vertiefung', 'Klausurniveau'])
    expect(levelCount(ATOMBAU)).toBe(3)
    expect(levelCount(FRACTIONS)).toBe(5)
  })

  it('hat Chemie als zweites Fach mit Ids nach den Regeln (chem-, a bis z und Bindestriche, höchstens 40 Zeichen)', () => {
    const chemistry = SUBJECTS[1]
    expect(chemistry.title).toBe('Chemie 1')
    const chemIds = chemistry.areas.flatMap((a) => [a.id, ...a.courses.map((c) => c.id)])
    for (const id of chemIds) {
      expect(id).toMatch(/^chem-[a-z-]{1,35}$/)
      expect(isChemCourse(id)).toBe(true)
    }
    // Gebiets-Ids sind keine Themen-Ids
    const areaIds = new Set(chemistry.areas.map((a) => a.id))
    for (const course of chemistry.areas.flatMap((a) => a.courses)) expect(areaIds.has(course.id), course.id).toBe(false)
    // Säuren und Basen sowie Redox stehen schon als „kommt bald" da
    expect(isAreaAvailable(areaById('chem-saeure-base')!.area)).toBe(false)
    expect(isAreaAvailable(areaById('chem-redox')!.area)).toBe(false)
    expect(isAreaAvailable(areaById('chem-materie')!.area)).toBe(true)
    expect(courseById(ATOMBAU)?.area.id).toBe('chem-materie')
  })

  it('findet Gebiete und Themen samt Fach', () => {
    expect(areaById('differentialrechnung')?.subject.title).toBe('Mathematik MB1')
    expect(isAreaAvailable(areaById('differentialrechnung')!.area)).toBe(true)
    expect(isAreaAvailable(areaById('grundlagen')!.area)).toBe(true)
    expect(isAreaAvailable(areaById('integralrechnung')!.area)).toBe(false)
    expect(courseById(DERIVATIVES)?.area.id).toBe('differentialrechnung')
    expect(courseById(FRACTIONS)?.area.id).toBe('grundlagen')
    expect(courseById('gibt-es-nicht')).toBeUndefined()
  })

  it('übt eine gemerkte Stufe nur, wenn sie spielbar ist', () => {
    const fractions = courseById(FRACTIONS)!.course
    expect(playableLevel(fractions, 2)).toBe(2)
    expect(playableLevel(fractions, 5)).toBe(5)
    expect(playableLevel(fractions, undefined)).toBe(1)
    // Stufe 5 noch gesperrt: zurück zur ersten spielbaren
    const withoutFive = { ...fractions, levels: fractions.levels.map((l) => (l.level === 5 ? { ...l, available: false } : l)) }
    expect(playableLevel(withoutFive, 5)).toBe(1)
  })
})

describe('Unterthemen und Mischung im Katalog (S1b)', () => {
  it('hat Unterthemen nur mit eindeutigen Ids und Stufen des Themas', () => {
    for (const course of courses) {
      if (!course.parts) continue
      const ids = course.parts.map((p) => p.id)
      expect(new Set(ids).size, course.id).toBe(ids.length)
      for (const part of course.parts) {
        expect(part.id, course.id).toMatch(/^[a-z0-9-]{1,40}$/)
        expect(part.title.trim(), part.id).not.toBe('')
        expect(part.levels.length, part.id).toBeGreaterThan(0)
        expect([...part.levels].sort(), part.id).toEqual([...part.levels])
        for (const level of part.levels) expect(course.levels.map((l) => l.level), part.id).toContain(level)
      }
    }
    // Mathe-Themen haben (noch) keine Unterthemen
    expect(courseById(DERIVATIVES)!.course.parts).toBeUndefined()
  })

  it('kennt die Unterthemen des Atombaus je Stufe', () => {
    const atombau = courseById(ATOMBAU)!.course
    expect(partsAvailable(atombau, 1).map((p) => p.id)).toEqual(['stoffe', 'teilchen', 'isotope-ionen'])
    expect(partsAvailable(atombau, 2).map((p) => p.id)).toEqual(['teilchen', 'isotope-ionen', 'modelle', 'licht'])
    expect(partsAvailable(atombau, 3)).toHaveLength(5)
    expect(partsAvailable(courseById(FRACTIONS)!.course, 1)).toEqual([])
  })

  it('hat die Mischung in Chemie 1 (nicht in Mathe) und findet Fächer und ihre Themen', () => {
    const chemistry = subjectById('chemie')!
    expect(chemistry.title).toBe('Chemie 1')
    expect(isMixAvailable(chemistry)).toBe(true)
    expect(isMixAvailable(subjectById('mathe')!)).toBe(false)
    expect(isMixAvailable(subjectById('physik')!)).toBe(false)
    expect(isMixAvailable({ ...chemistry, areas: chemistry.areas.map((a) => ({ ...a, courses: [] })) })).toBe(false)
    expect(subjectById('gibt-es-nicht')).toBeUndefined()
    const all = mixCourses(chemistry)
    expect(all.map(({ course }) => course.id)).toEqual(chemistry.areas.flatMap((a) => a.courses.map((c) => c.id)))
    expect(all[0]).toMatchObject({ area: { id: 'chem-materie' }, course: { id: ATOMBAU } })
    expect(subjectLevelCount(chemistry)).toBe(3)
    expect(subjectLevelName(chemistry, 2)).toBe('Vertiefung')
    expect(subjectLevelCount(subjectById('mathe')!)).toBe(5)
    expect(subjectLevelName(subjectById('mathe')!, 4)).toBe('Stufe 4')
  })
})
