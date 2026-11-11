import { describe, expect, it } from 'vitest'
import { gradeExam, itemsOf, totalPoints, truthOf } from '../../exam/grade.ts'
import type { ExamTask } from '../../exam/types.ts'
import { parseRichText } from '../../explain/richText.ts'
import { latexProblem } from '../../expr/latexChecks.ts'
import { CHEM_ERROR_RULES } from '../errorRules.ts'
import { MISCONCEPTIONS_BY_COURSE } from '../misconceptions/index.ts'
import { figureById } from '../figures.ts'
import { chemTopic } from '../banks.ts'
import { elementByZ } from '../elements.ts'
import { placeOf } from '../pse.ts'
import { KNOWLEDGE_QUESTIONS, TASK2_POINTS, buildTask2 } from './task2.ts'

// Klausuraufgabe 2 (S6e): Aufbau, Punkte, saubere Texte, Abwechslung

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1)
// Rechenfehler und Denkfehler der Wissensfragen
const RULES = new Set([...CHEM_ERROR_RULES.map((r) => r.id), ...Object.values(MISCONCEPTIONS_BY_COURSE).flat().map((m) => m.id)])
const truthAnswers = (task: ExamTask): Record<string, string> => Object.fromEntries([...truthOf(task)].map(([id, t]) => [id, t.option.id]))

describe('Klausuraufgabe 2: Aufbau', () => {
  it('6 Punkte in drei Teilen, jede Frage mit drei oder vier verschiedenen Antworten und genau einer richtigen', () => {
    for (const seed of SEEDS) {
      const task = buildTask2(seed)
      expect(totalPoints(task)).toBe(TASK2_POINTS)
      expect(task.parts.map((p) => [p.id, p.points])).toEqual([['a', 3], ['b', 1], ['c', 2]])
      for (const part of task.parts) expect(part.items.reduce((s, i) => s + i.points, 0), `${seed} ${part.id}`).toBe(part.points)
      for (const [id, { build }] of truthOf(task)) {
        const ids = build.options.map((o) => o.id)
        expect(new Set(ids).size, `${seed} ${id}`).toBe(ids.length)
        expect(ids.length, `${seed} ${id}`).toBeGreaterThanOrEqual(3)
        expect(ids.length, `${seed} ${id}`).toBeLessThanOrEqual(4)
        expect(ids.filter((x) => x === build.correct), `${seed} ${id}`).toHaveLength(1)
        for (const o of build.options) {
          if (o.id !== build.correct) {
            // typischer Fehler aus dem Katalog oder weitere Antwort ohne Fehler (extraOptions.ts), immer mit Erklärung
            if (o.errorRuleId) expect(RULES.has(o.errorRuleId), `${seed} ${id} ${o.errorRuleId}`).toBe(true)
            expect(o.why?.detailed, `${seed} ${id}`).toBeTruthy()
          }
          if (o.figure) expect(figureById(o.figure), o.figure).toBeDefined()
        }
      }
    }
  })

  it('gibt für dieselbe Nummer dieselbe Aufgabe, alles richtig gibt 6 Punkte', () => {
    for (const seed of SEEDS.slice(0, 30)) {
      expect(JSON.stringify(buildTask2(seed))).toBe(JSON.stringify(buildTask2(seed)))
      const task = buildTask2(seed)
      expect(gradeExam(task, truthAnswers(task)).points).toBe(TASK2_POINTS)
    }
  })

  it('Texte und Formeln sind sauber', () => {
    for (const seed of SEEDS.slice(0, 80)) {
      const task = buildTask2(seed)
      const texts = [task.intro, task.note, ...task.parts.map((p) => p.prompt), ...itemsOf(task).map((i) => i.question)]
      for (const [, { build }] of truthOf(task)) texts.push(...build.options.map((o) => o.content), build.explanation.detailed)
      for (const text of texts) {
        expect(text, `${seed}`).not.toMatch(/undefined|NaN(?![A-Z0-9])|\[object|null/)
        for (const seg of parseRichText(text).flat()) {
          if (seg.kind === 'math') expect(latexProblem(seg.latex, { checkUgly: false }), `${seed}: ${seg.latex}`).toBeNull()
          else expect(seg.text, `${seed}: Unicode-Index außerhalb von $…$`).not.toMatch(/[₀-₉⁰-⁹⁺⁻]/)
        }
      }
    }
  })

  it('Abgleich mit den Altklausuren: meist Hauptgruppen, vier Antworten zum Platz, Wissensfragen wechselnd, jede Frage zählt für sich', () => {
    let main = 0
    const kinds = new Set<string>()
    const questions = new Set<string>()
    for (const seed of SEEDS) {
      const task = buildTask2(seed)
      const [a, b, c] = task.parts
      const z = Number(/Z = (\d+)/.exec(a.prompt)![1])
      if (placeOf(elementByZ(z)!).main) main++
      for (const [id, { build }] of truthOf(task)) if (['periode', 'gruppe', 'block', 'weg', 'ladung', 'wissen'].includes(id)) expect(build.options, `${seed} ${id}`).toHaveLength(4)
      // Block: alle vier zur Auswahl
      const block = truthOf(task).get('block')!.build
      expect(block.options.map((o) => o.content[0]).sort()).toEqual(['d', 'f', 'p', 's'])
      // Wissensfrage zur Richtung eines Trends nur, wenn Teil c keinen Trend fragt
      const review = b.items[0].review!
      kinds.add(review.course)
      questions.add(`${review.course}:${Math.floor((review.seed - 500_000) / 50)}`)
      if (c.items[0].id === 'richtung') expect(review.course).toBe('chem-pse')
      // die Wissensfrage verrät die Antworten von Teil a nicht (Block der Gruppen 1 und 2, Alkalimetalle, Halogene, Nebengruppen)
      const place = placeOf(elementByZ(z)!)
      const no = Math.floor((review.seed - 500_000) / 50)
      if (review.course === 'chem-pse') {
        if (place.block === 's') expect(no, `${seed}`).not.toBe(114)
        if (!place.main) expect(no, `${seed}`).not.toBe(115)
        if (place.group === 1) expect(no, `${seed}`).not.toBe(104)
        if (place.group === 17) expect(no, `${seed}`).not.toBe(211)
      }
      // die Frage nach dem Edelgas nennt das Ion nicht (es wäre die Antwort der Frage davor)
      for (const item of c.items) if (item.id === 'edelgas') expect(item.question).not.toMatch(/\^/)
      for (const item of itemsOf(task)) expect(item.final, `${seed} ${item.id}`).toBeUndefined()
    }
    expect(main).toBeGreaterThan(150)
    expect(main).toBeLessThan(195)
    expect(kinds).toEqual(new Set(['chem-pse', 'chem-trends']))
    expect(questions.size).toBeGreaterThanOrEqual(9)
    for (const { course, no } of Object.values(KNOWLEDGE_QUESTIONS).flat()) expect(questions.has(`${course}:${no}`), `${course} ${no}`).toBe(true)
  })

  it('Wissensfragen sind Einfachauswahl ohne Bild', () => {
    for (const { course, no } of Object.values(KNOWLEDGE_QUESTIONS).flat()) {
      const q = chemTopic(course)!.bank.questions.find((x) => x.no === no)
      expect(q?.kind, `${course} ${no}`).toBe('single')
      expect(q?.figure, `${course} ${no}`).toBeUndefined()
    }
  })

  it('viel Abwechslung: verschiedene Elemente, Trend oder Ionenladung etwa je zur Hälfte', () => {
    const places = new Set<string>()
    let trend = 0
    for (const seed of SEEDS) {
      const task = buildTask2(seed)
      places.add(task.parts[0].prompt)
      if (task.parts[2].items[0].id === 'richtung') trend++
    }
    expect(places.size).toBeGreaterThan(25)
    expect(trend).toBeGreaterThan(60)
    expect(trend).toBeLessThan(140)
  })
})
