import { describe, expect, it } from 'vitest'
import { TOPICS, topicById } from '../engine/explain/cards.ts'
import { DERIVATIVES, SUBJECTS, areaById, courseById, isAreaAvailable } from './catalog.ts'

const areas = SUBJECTS.flatMap((s) => s.areas)
const courses = areas.flatMap((a) => a.courses)

describe('Aufbau der App (Fächer, Gebiete, Themen)', () => {
  it('hat eindeutige Ids', () => {
    const ids = [...SUBJECTS.map((s) => s.id), ...areas.map((a) => a.id), ...courses.map((c) => c.id)]
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('verbindet jedes Thema mit einem Ordner der Lernkarten und jeden Ordner mit einem Thema', () => {
    for (const course of courses) expect(topicById(course.cards), course.id).toBeDefined()
    expect(TOPICS.map((t) => t.id).sort()).toEqual(courses.map((c) => c.cards).sort())
  })

  it('findet Gebiete und Themen samt Fach', () => {
    expect(areaById('differentialrechnung')?.subject.title).toBe('Mathematik MB1')
    expect(isAreaAvailable(areaById('differentialrechnung')!.area)).toBe(true)
    expect(isAreaAvailable(areaById('integralrechnung')!.area)).toBe(false)
    expect(courseById(DERIVATIVES)?.area.id).toBe('differentialrechnung')
    expect(courseById('gibt-es-nicht')).toBeUndefined()
  })
})
