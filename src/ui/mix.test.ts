import { describe, expect, it } from 'vitest'
import { chemTopic } from '../engine/chem/banks.ts'
import { topicEngine } from '../engine/chem/engine.ts'
import { decodeSeed } from '../engine/quiz/numbers.ts'
import type { QuestionBank } from '../engine/quiz/types.ts'
import { createRng } from '../engine/random/rng.ts'
import type { Level } from '../engine/tasks/taskNumber.ts'
import { rememberShown, shownInRound, startNewRound } from '../state/questionRounds.ts'
import type { KeyValueStore } from '../state/storage.ts'
import { ATOMBAU, type Course, FRACTIONS, courseById } from './catalog.ts'
import { CALC_ONLY_WEIGHT, type MixEngine, type MixInput, mixWeights, pickMixed } from './mix.ts'

// Themen mischen (S1b): Wahl des Themas nach der Zahl der Fragen seiner Auswahl, Runden je Thema,
// Ausschluss. Neben dem echten
// Atombau zwei ausgedachte Themen aus seinen Fragen: „B" mit wenigen Fragen und ohne Klausurniveau,
// „C" kommt bald (keine spielbare Stufe).

const seeded = (seed: string) => {
  const rng = createRng(seed)
  return () => rng.next()
}

const topic = chemTopic(ATOMBAU)!
const atombau = courseById(ATOMBAU)!.course
const B = 'chem-b'
const C = 'chem-c'
// B: je Stufe die ersten fünf Fragen des Atombaus
const bankB: QuestionBank = {
  course: B,
  questions: [1, 2].flatMap((level) => topic.bank.questions.filter((q) => q.level === level).slice(0, 5)),
  retired: [],
}
const courseB: Course = { ...atombau, id: B, levels: atombau.levels.map((l) => (l.level === 3 ? { ...l, available: false } : l)) }
const courseC: Course = { ...atombau, id: C, levels: [] }

const levelCount = (bank: QuestionBank, level: Level) => bank.questions.filter((q) => q.level === level).length

// Engines, Runden (im Arbeitsspeicher) und Auswahl wie auf der Übungsseite
function setup(seed: string, parts: Readonly<Record<string, ReadonlySet<string>>> = {}) {
  const engines: Record<string, MixEngine> = {
    [ATOMBAU]: topicEngine(topic, seeded(`${seed}-a`)),
    [B]: topicEngine({ bank: bankB, misconceptions: topic.misconceptions }, seeded(`${seed}-b`)),
    [C]: topicEngine(topic, seeded(`${seed}-c`)),
  }
  const data = new Map<string, string>()
  const store: KeyValueStore = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
  const mixRandom = seeded(`${seed}-mix`)
  const input = (level: Level, courses: readonly Course[] = [atombau, courseB, courseC], random = mixRandom): MixInput => ({
    courses,
    level,
    engineOf: (course) => engines[course],
    shownOf: (course) => shownInRound(course, level, store),
    recentOf: () => [],
    partsOf: (course) => parts[course],
    random,
  })
  // eine Aufgabe ziehen und wie die Übungsseite in die Runde eintragen
  const draw = (level: Level, courses?: readonly Course[], random?: () => number) => {
    const picked = pickMixed(input(level, courses, random))
    if (!picked) return null
    if (picked.newRound) startNewRound(picked.course, level, picked.nos, store)
    const decoded = decodeSeed(picked.seed)
    // Rechnungen (ab S2) kommen dazwischen; sie zählen beim Thema, aber nicht in seiner Runde
    if (decoded?.kind === 'generated') return { ...picked, no: null }
    if (decoded?.kind !== 'question') throw new Error('keine Frage')
    rememberShown(picked.course, level, decoded.no, store)
    return { ...picked, no: decoded.no }
  }
  return { input, draw, store, engines }
}

describe('Themen mischen: Wahl des Themas', () => {
  it('gewichtet nach der Zahl der Fragen der Auswahl', () => {
    const { input } = setup('gewicht')
    const total = levelCount(topic.bank, 1)
    expect(mixWeights(input(1))).toEqual([
      { course: ATOMBAU, weight: total },
      { course: B, weight: 5 },
    ])
    // ohne Gedächtnis gezogen: etwa im Verhältnis der Gewichte
    const random = seeded('gewicht-zufall')
    let a = 0
    const n = 2000
    for (let i = 0; i < n; i++) if (pickMixed(input(1, undefined, random))!.course === ATOMBAU) a++
    expect(a / n).toBeGreaterThan(total / (total + 5) - 0.04)
    expect(a / n).toBeLessThan(total / (total + 5) + 0.04)
  })

  it('zeigt in jedem Thema jede Frage einmal, bevor seine Runde neu beginnt', () => {
    for (const level of [1, 2] as const) {
      const { draw } = setup(`runde-${level}`)
      const nosOf: Record<string, number[]> = {
        [ATOMBAU]: topic.bank.questions.filter((q) => q.level === level).map((q) => q.no),
        [B]: bankB.questions.filter((q) => q.level === level).map((q) => q.no),
      }
      // Fragen der laufenden Runde je Thema
      const round: Record<string, Set<number>> = { [ATOMBAU]: new Set(), [B]: new Set() }
      let rounds = 0
      for (let i = 0; i < 300; i++) {
        const picked = draw(level)!
        if (picked.no === null) continue
        const seen = round[picked.course]
        if (picked.newRound) {
          // neue Runde erst, wenn alle Fragen des Themas dran waren, mit den Nummern seiner Auswahl
          expect(seen.size, `Stufe ${level}, Zug ${i + 1}`).toBe(nosOf[picked.course].length)
          expect(picked.nos).toEqual(nosOf[picked.course])
          seen.clear()
          rounds++
        }
        expect(seen.has(picked.no), `Stufe ${level}, Zug ${i + 1}: ${picked.course}:${picked.no} doppelt`).toBe(false)
        seen.add(picked.no)
      }
      expect(rounds).toBeGreaterThan(5)
    }
  })

  it('bleibt auch nach der ersten Runde gemischt, statt die Themen am Stück zu bringen', () => {
    const { draw } = setup('gemischt')
    const nA = levelCount(topic.bank, 1)
    const nB = levelCount(bankB, 1)
    const sequence = Array.from({ length: 1200 }, () => (draw(1)!.course === ATOMBAU ? 'A' : 'B')).join('')
    // In jedem Abschnitt von zwei vollen Durchgängen kommen beide Themen vor
    const window = 2 * (nA + nB)
    for (let i = 0; i + window <= sequence.length; i += 5) {
      const part = sequence.slice(i, i + window)
      expect(part, `Züge ${i + 1} bis ${i + window}`).toContain('A')
      expect(part, `Züge ${i + 1} bis ${i + window}`).toContain('B')
    }
    // Auf Dauer kommt jede Frage etwa gleich oft dran: B so oft, wie es Fragen hat
    const later = sequence.slice(nA + nB)
    const shareB = later.split('').filter((c) => c === 'B').length / later.length
    expect(shareB).toBeGreaterThan(nB / (nA + nB) - 0.06)
    expect(shareB).toBeLessThan(nB / (nA + nB) + 0.06)
  })

  it('lässt ein Thema, dessen Runde durch ist, in der Mischung (auch nach Üben ohne Mischung)', () => {
    const { input, store } = setup('durch')
    const nosA = topic.bank.questions.filter((q) => q.level === 1).map((q) => q.no)
    const expected = [
      { course: ATOMBAU, weight: nosA.length },
      { course: B, weight: 5 },
    ]
    // fast durch und ganz durch (Atombau allein geübt): Die Gewichte bleiben
    for (const no of nosA.slice(0, -3)) rememberShown(ATOMBAU, 1, no, store)
    expect(mixWeights(input(1))).toEqual(expected)
    for (const no of nosA.slice(-3)) rememberShown(ATOMBAU, 1, no, store)
    expect(mixWeights(input(1))).toEqual(expected)
    // Wird das durchgeübte Thema gewählt, beginnt dort eine neue Runde
    const random = seeded('durch-zufall')
    const picked = Array.from({ length: 50 }, () => pickMixed(input(1, undefined, random))!)
    expect(picked.some((p) => p.course === ATOMBAU)).toBe(true)
    for (const p of picked.filter((p) => p.course === ATOMBAU && decodeSeed(p.seed)?.kind === 'question')) {
      expect(p.newRound).toBe(true)
      expect(p.nos).toEqual(nosA)
    }
    for (const p of picked.filter((p) => p.course === B)) expect(p.newRound).toBe(false)
  })

  it('wählt nie ein nicht angekreuztes Thema und nie eines ohne spielbare Stufe', () => {
    const { input } = setup('ausschluss')
    const random = seeded('ausschluss-zufall')
    // C hat keine spielbare Stufe, B kein Klausurniveau
    for (let i = 0; i < 200; i++) {
      expect(pickMixed(input(1, undefined, random))!.course).not.toBe(C)
      expect(pickMixed(input(3, undefined, random))!.course).toBe(ATOMBAU)
      // nur B angekreuzt
      expect(pickMixed(input(2, [courseB], random))!.course).toBe(B)
    }
    expect(mixWeights(input(3))).toEqual([{ course: ATOMBAU, weight: levelCount(topic.bank, 3) }])
    // nichts zu üben
    expect(pickMixed(input(1, []))).toBeNull()
    expect(pickMixed(input(1, [courseC]))).toBeNull()
    expect(pickMixed(input(3, [courseB, courseC]))).toBeNull()
  })

  it('zieht im Thema nur Fragen der angekreuzten Unterthemen und zählt nur sie', () => {
    const modelle = topic.bank.questions.filter((q) => q.level === 2 && q.part === 'modelle').map((q) => q.no)
    const { draw, input } = setup('unterthemen', { [ATOMBAU]: new Set(['modelle']) })
    expect(mixWeights(input(2, [atombau]))).toEqual([{ course: ATOMBAU, weight: modelle.length }])
    const seen = new Set<number>()
    for (let i = 0; i < modelle.length; i++) {
      const picked = draw(2, [atombau])!
      expect(modelle).toContain(picked.no)
      expect(picked.newRound).toBe(false)
      seen.add(picked.no!)
    }
    expect(seen.size).toBe(modelle.length)
    const again = draw(2, [atombau])!
    expect(again.newRound).toBe(true)
    expect(again.nos).toEqual(modelle)
    // In Grundlagen gibt es keine Atommodelle: alle Fragen der Stufe (wie die Engine)
    expect(mixWeights(input(1, [atombau]))).toEqual([{ course: ATOMBAU, weight: levelCount(topic.bank, 1) }])
  })

  it('kommt mit Engines ohne Wissensfragen zurecht (Gewicht 1, keine Runde)', () => {
    const fractions = courseById(FRACTIONS)!.course
    const math: MixEngine = { formOf: ({ seed }) => `form-${seed % 3}` }
    const { engines, input } = setup('mathe')
    engines[FRACTIONS] = math
    expect(mixWeights(input(1, [atombau, fractions]))).toEqual([
      { course: ATOMBAU, weight: levelCount(topic.bank, 1) },
      { course: FRACTIONS, weight: 1 },
    ])
    const random = seeded('mathe-zufall')
    const picked = Array.from({ length: 300 }, () => pickMixed(input(1, [fractions], random))!)
    for (const p of picked) {
      expect(p.course).toBe(FRACTIONS)
      expect(p.newRound).toBe(false)
      expect(p.nos).toBeUndefined()
      expect(Number.isInteger(p.seed)).toBe(true)
    }
    // Atombau ganz durch: Mathe zählt weiter 1, Atombau mit allen Fragen (neue Runde)
    const { input: doneInput, draw } = setup('mathe-durch')
    for (let done = 0; done < levelCount(topic.bank, 1); ) if (draw(1, [atombau])!.no !== null) done++
    const done = { ...doneInput(1, [atombau, fractions]), engineOf: (course: string) => (course === FRACTIONS ? math : topicEngine(topic)) }
    expect(mixWeights(done)).toEqual([
      { course: ATOMBAU, weight: levelCount(topic.bank, 1) },
      { course: FRACTIONS, weight: 1 },
    ])
  })
})

describe('Themen mischen: Wiederholung (S8a)', () => {
  it('bringt die am längsten fällige Frage zuerst, auch aus dem kleineren Thema', () => {
    const { input } = setup('wiederholung')
    const noB = bankB.questions.find((q) => q.level === 1)!.no
    const noA = topic.bank.questions.find((q) => q.level === 1)!.no
    const reviews: Record<string, { due: { no: number; variant: number; answeredAt: number }[]; waiting: Set<number> }> = {
      [ATOMBAU]: { due: [{ no: noA, variant: 0, answeredAt: 20 }], waiting: new Set() },
      [B]: { due: [{ no: noB, variant: 0, answeredAt: 10 }], waiting: new Set() },
    }
    for (let i = 0; i < 20; i++) {
      const picked = pickMixed({ ...input(1), reviewOf: (course) => reviews[course] })!
      expect(picked.course).toBe(B)
      expect(decodeSeed(picked.seed)).toMatchObject({ kind: 'question', no: noB })
    }
    // B nicht angekreuzt: die fällige Frage aus dem Atombau
    const picked = pickMixed({ ...input(1, [atombau, courseC]), reviewOf: (course) => reviews[course] })!
    expect(decodeSeed(picked.seed)).toMatchObject({ kind: 'question', no: noA })
  })

  it('bringt nach dem Überspringen der fälligen Frage zuerst die nächste fällige (M6 Schritt 2)', () => {
    const { input } = setup('wiederholung-ueberspringen')
    const noB = bankB.questions.find((q) => q.level === 1)!.no
    const noA = topic.bank.questions.find((q) => q.level === 1)!.no
    const reviews: Record<string, { due: { no: number; variant: number; answeredAt: number }[]; waiting: Set<number> }> = {
      [ATOMBAU]: { due: [{ no: noA, variant: 0, answeredAt: 20 }], waiting: new Set() },
      [B]: { due: [{ no: noB, variant: 0, answeredAt: 10 }], waiting: new Set() },
    }
    for (let i = 0; i < 20; i++) {
      const picked = pickMixed({ ...input(1), reviewOf: (course) => reviews[course], avoidOf: (course) => (course === B ? noB : null) })!
      expect(picked.course).toBe(ATOMBAU)
      expect(decodeSeed(picked.seed)).toMatchObject({ kind: 'question', no: noA })
    }
  })
})

describe('Themen mischen: Thema nur mit Rechnungen (S3a)', () => {
  it('zählt wie ein Thema mit der Mindestzahl an Fragen und kommt mit Rechnungen dran', () => {
    const stoffmenge = courseById('chem-stoffmenge')!.course
    const engines: Record<string, MixEngine> = {
      [ATOMBAU]: topicEngine(chemTopic(ATOMBAU)!, seeded('rechnungen-a')),
      // Stoffmenge ohne seine Fragen: nur Rechnungen (so war es zwischen S3a und S3c)
      'chem-stoffmenge': topicEngine({ ...chemTopic('chem-stoffmenge')!, bank: { ...chemTopic('chem-stoffmenge')!.bank, questions: [] } }, seeded('rechnungen-s')),
    }
    const input: MixInput = {
      courses: [atombau, stoffmenge],
      level: 1,
      engineOf: (course) => engines[course],
      shownOf: () => new Set(),
      recentOf: () => [],
      partsOf: () => undefined,
      random: seeded('rechnungen-zufall'),
    }
    expect(mixWeights(input)).toContainEqual({ course: 'chem-stoffmenge', weight: CALC_ONLY_WEIGHT })
    const picked = Array.from({ length: 200 }, () => pickMixed(input)!)
    const fromStoffmenge = picked.filter((p) => p.course === 'chem-stoffmenge')
    expect(fromStoffmenge.length).toBeGreaterThan(20)
    for (const p of fromStoffmenge) {
      expect(decodeSeed(p.seed)?.kind).toBe('generated')
      expect(p.newRound).toBe(false)
    }
  })
})
