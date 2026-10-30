import { describe, expect, it } from 'vitest'
import { TOPICS, topicById } from '../engine/explain/cards.ts'
import { ERRORS_BY_COURSE } from '../engine/errorCatalog.ts'
import { AVAILABLE_COURSES, DERIVATIVES, FRACTIONS, SUBJECTS, areaById, courseById, courseOfCards, isAreaAvailable, playableLevel } from './catalog.ts'
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
      expect(engine.planGuidedTask({ level, seed: 1 }).steps.length, course.id).toBeGreaterThan(0)
    }
  })

  it('hat je Thema fünf Stufen oder keine (kommt bald)', () => {
    for (const course of courses) expect([0, 5], course.id).toContain(course.levels.length)
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
    expect(playableLevel(fractions, 5)).toBe(1)
    expect(playableLevel(fractions, undefined)).toBe(1)
  })
})
