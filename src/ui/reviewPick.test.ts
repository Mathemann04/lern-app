import { describe, expect, it } from 'vitest'
import { chemCourseEngine } from '../engine/chem/engine.ts'
import { decodeSeed, questionSeed } from '../engine/quiz/numbers.ts'
import { EMPTY_REVIEWS, afterAnswer, dueAcross, noteShown } from '../engine/quiz/schedule.ts'
import { ATOMBAU, IONEN } from './catalog.ts'
import { pickReviewTask } from './reviewPick.ts'

// „Wiederholen" über alle Themen eines Fachs (S11)

describe('Wiederholen: welche Aufgabe kommt', () => {
  it('nimmt die am längsten fällige Frage in einer anderen Fassung, mit ihrer Stufe', async () => {
    const due = [
      { course: 'a', no: 7, variant: 3, answeredAt: 1 },
      { course: 'b', no: 2, variant: 0, answeredAt: 2 },
    ]
    const asked: string[] = []
    const picked = await pickReviewTask(due, async (course) => {
      asked.push(course)
      return 2
    })
    expect(asked).toEqual(['a'])
    expect(picked?.course).toBe('a')
    expect(picked?.ref.level).toBe(2)
    const decoded = decodeSeed(picked!.ref.seed)
    expect(decoded).toMatchObject({ kind: 'question', no: 7 })
    expect(decoded?.kind === 'question' && decoded.variant).not.toBe(3)
  })

  it('überspringt Fragen, die es nicht mehr gibt; ohne fällige Frage nichts', async () => {
    const due = [
      { course: 'a', no: 9999, variant: 0, answeredAt: 1 },
      { course: 'b', no: 2, variant: 0, answeredAt: 2 },
    ]
    const picked = await pickReviewTask(due, async (course) => (course === 'a' ? null : 3))
    expect(picked).toMatchObject({ course: 'b', ref: { level: 3 } })
    expect(await pickReviewTask(due, async () => null)).toBeNull()
    expect(await pickReviewTask([], async () => 1)).toBeNull()
  })

  it('findet mit den echten Engines die Stufe der Fragen aus mehreren Themen', async () => {
    const engines = { [ATOMBAU]: chemCourseEngine(ATOMBAU), [IONEN]: chemCourseEngine(IONEN) }
    // je Thema eine Frage der höchsten Stufe, falsch beantwortet, danach drei andere Aufgaben
    const atombau = engines[ATOMBAU].questionNos!(3)[0]
    const ionen = engines[IONEN].questionNos!(1)[0]
    let state = afterAnswer(EMPTY_REVIEWS, `${IONEN}:${ionen}`, false, 0, 10)
    state = afterAnswer(state, `${ATOMBAU}:${atombau}`, false, 0, 20)
    for (const s of ['x:1:1', 'x:1:2', 'x:1:3']) state = noteShown(state, s)
    const due = dueAcross(state, [ATOMBAU, IONEN], 100)
    const resolve = async (course: string, seed: number) => engines[course as keyof typeof engines].resolve({ level: 1, seed })
    const first = await pickReviewTask(due, resolve)
    expect(first).toMatchObject({ course: IONEN, ref: { level: 1 } })
    const second = await pickReviewTask(due.slice(1), resolve)
    expect(second).toMatchObject({ course: ATOMBAU, ref: { level: 3 } })
    expect(engines[ATOMBAU].resolve(second!.ref)).toBe(3)
    expect(second!.ref.seed).not.toBe(questionSeed(atombau, 0))
  })
})
