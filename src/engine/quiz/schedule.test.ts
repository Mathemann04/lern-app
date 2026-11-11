import { describe, expect, it } from 'vitest'
import { VARIANTS } from './numbers.ts'
import { EMPTY_REVIEWS, LAST_BOX, REVIEW_AFTER_TASKS, REVIEW_DAYS, type ReviewState, afterAnswer, courseReviews, noteShown, otherVariant, reviewKey } from './schedule.ts'

const DAY = 24 * 60 * 60 * 1000
const KEY = reviewKey('chem-atombau', 101)

// n andere Aufgaben zeigen
const showOthers = (state: ReviewState, n: number) => Array.from({ length: n }).reduce<ReviewState>((s, _, i) => noteShown(s, `andere:${s.tick}:${i}`), state)
const dueNos = (state: ReviewState, now: number) => courseReviews(state, 'chem-atombau', now).due.map((d) => d.no)

describe('Wiederholung der Wissensfragen', () => {
  it('zählt gezeigte Aufgaben, Neuladen derselben nicht', () => {
    let s = noteShown(EMPTY_REVIEWS, 'chem-atombau:1:500')
    s = noteShown(s, 'chem-atombau:1:500')
    expect(s.tick).toBe(1)
    s = noteShown(s, 'brueche:1:4711')
    expect(s.tick).toBe(2)
  })

  it('bringt eine falsche Frage nach drei anderen Aufgaben wieder, dann nach 1, 3, 7 und 21 Tagen', () => {
    const t0 = 1_000_000
    let s = noteShown(EMPTY_REVIEWS, 'chem-atombau:1:frage')
    s = afterAnswer(s, KEY, false, 7, t0)
    expect(courseReviews(s, 'chem-atombau', t0).waiting).toEqual(new Set([101]))
    s = showOthers(s, REVIEW_AFTER_TASKS - 1)
    expect(dueNos(s, t0)).toEqual([])
    s = showOthers(s, 1)
    expect(dueNos(s, t0)).toEqual([101])
    expect(courseReviews(s, 'chem-atombau', t0).due[0].variant).toBe(7)
    // richtig beantwortet: Fach für Fach eine längere Pause
    let now = t0
    for (let box = 1; box <= LAST_BOX; box++) {
      s = afterAnswer(s, KEY, true, 3, now)
      expect(s.items[KEY].box).toBe(box)
      const pause = REVIEW_DAYS[box - 1] * DAY
      expect(dueNos(s, now + pause - 1)).toEqual([])
      now += pause
      expect(dueNos(s, now)).toEqual([101])
    }
    // aus dem letzten Fach heraus gelernt
    s = afterAnswer(s, KEY, true, 3, now)
    expect(s.items[KEY]).toBeUndefined()
  })

  it('schickt eine Frage bei einem Fehler zurück in Fach 0 und ändert nichts, wenn sie vor der Zeit richtig kommt', () => {
    let s = afterAnswer(EMPTY_REVIEWS, KEY, false, 1, 0)
    s = showOthers(s, REVIEW_AFTER_TASKS)
    s = afterAnswer(s, KEY, true, 2, 0)
    expect(s.items[KEY].box).toBe(1)
    // vor der Zeit (z. B. Neuladen): bleibt
    expect(afterAnswer(s, KEY, true, 4, DAY / 2)).toBe(s)
    s = afterAnswer(s, KEY, false, 4, DAY)
    expect(s.items[KEY]).toMatchObject({ box: 0, dueTick: s.tick + REVIEW_AFTER_TASKS, variant: 4 })
    // nie falsch beantwortet: nichts zu wiederholen
    expect(afterAnswer(EMPTY_REVIEWS, KEY, true, 0, 0)).toBe(EMPTY_REVIEWS)
  })

  it('nennt fällige Fragen eines Themas, die am längsten fälligen zuerst', () => {
    let s = afterAnswer(EMPTY_REVIEWS, reviewKey('chem-atombau', 105), false, 0, 20)
    s = afterAnswer(s, reviewKey('chem-atombau', 102), false, 0, 10)
    s = afterAnswer(s, reviewKey('chem-anderes', 102), false, 0, 5)
    s = showOthers(s, REVIEW_AFTER_TASKS)
    expect(dueNos(s, 30)).toEqual([102, 105])
  })

  it('wählt beim Wiederkommen eine andere Fassung', () => {
    for (let v = 0; v < VARIANTS; v++) {
      for (const r of [0, 0.5, 0.9999]) {
        const other = otherVariant(v, () => r)
        expect(other).not.toBe(v)
        expect(other).toBeGreaterThanOrEqual(0)
        expect(other).toBeLessThan(VARIANTS)
      }
    }
  })
})
