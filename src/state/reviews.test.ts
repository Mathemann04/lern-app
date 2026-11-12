import { describe, expect, it } from 'vitest'
import { questionSeed } from '../engine/quiz/numbers.ts'
import { MAX_REVIEWS, REVIEWS_KEY, clearReviews, dueReviewsOf, isInReview, parseReviews, recordReview, rememberTaskShown, reviewsOf, waitingReviewCount } from './reviews.ts'
import type { KeyValueStore } from './storage.ts'

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
}

describe('Wiederholung speichern', () => {
  it('merkt sich falsch beantwortete Fragen je Thema und bringt sie nach drei anderen Aufgaben', () => {
    const store = memoryStore()
    const seed = questionSeed(101, 3)
    rememberTaskShown('chem-atombau', 1, seed, store)
    recordReview('chem-atombau', seed, false, 0, store)
    expect(isInReview('chem-atombau', seed, store)).toBe(true)
    expect(isInReview('chem-atombau', questionSeed(101, 9), store)).toBe(true)
    expect(isInReview('chem-ionen', seed, store)).toBe(false)
    expect(reviewsOf('chem-atombau', 0, store).waiting).toEqual(new Set([101]))
    for (const s of [1, 2, 3]) rememberTaskShown('brueche', 1, s, store)
    expect(reviewsOf('chem-atombau', 0, store).due).toEqual([{ no: 101, variant: 3, answeredAt: 0 }])
    clearReviews(store)
    expect(reviewsOf('chem-atombau', 0, store).due).toEqual([])
  })

  it('übergeht Rechnungen (nur Wissensfragen kommen wieder)', () => {
    const store = memoryStore()
    recordReview('chem-atombau', 12345, false, 0, store)
    expect(store.data.has(REVIEWS_KEY)).toBe(false)
  })

  it('verträgt kaputten Inhalt und lässt Unlesbares einzeln weg', () => {
    expect(parseReviews('kaputt').items).toEqual({})
    expect(parseReviews('[1]').tick).toBe(0)
    const good = { box: 2, dueTick: 0, dueAt: 5, variant: 4, answeredAt: 1 }
    const parsed = parseReviews(
      JSON.stringify({ tick: 7, last: 'x', items: { 'chem-atombau:101': good, 'chem-atombau:102': { ...good, box: 9 }, '<script>:1': good, 'chem-x:3': { ...good, variant: 50 } } }),
    )
    expect(parsed).toEqual({ tick: 7, last: 'x', items: { 'chem-atombau:101': good } })
  })

  it('begrenzt die Zahl der gemerkten Fragen (die ältesten fallen weg)', () => {
    const store = memoryStore()
    for (let no = 1; no <= MAX_REVIEWS + 5; no++) recordReview('chem-atombau', no, false, no, store)
    const items = parseReviews(store.data.get(REVIEWS_KEY)!).items
    expect(Object.keys(items)).toHaveLength(MAX_REVIEWS)
    expect(items['chem-atombau:1']).toBeUndefined()
    expect(items[`chem-atombau:${MAX_REVIEWS + 5}`]).toBeDefined()
  })
})

describe('Wiederholung über alle Themen eines Fachs (S11)', () => {
  it('zählt fällige und wartende Fragen mehrerer Themen', () => {
    const store = memoryStore()
    recordReview('chem-atombau', questionSeed(101, 3), false, 10, store)
    recordReview('chem-ionen', questionSeed(7, 1), false, 5, store)
    const courses = ['chem-atombau', 'chem-ionen']
    expect(dueReviewsOf(courses, 20, store)).toEqual([])
    expect(waitingReviewCount(courses, 20, store)).toBe(2)
    for (const s of [1, 2, 3]) rememberTaskShown('brueche', 1, s, store)
    expect(dueReviewsOf(courses, 20, store).map((d) => [d.course, d.no])).toEqual([
      ['chem-ionen', 7],
      ['chem-atombau', 101],
    ])
    expect(dueReviewsOf(['chem-ionen'], 20, store)).toHaveLength(1)
    expect(waitingReviewCount(courses, 20, store)).toBe(0)
  })
})
