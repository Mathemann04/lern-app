import { describe, expect, it } from 'vitest'
import { gradeExam, itemsOf, totalPoints, truthOf } from '../../exam/grade.ts'
import type { ExamTask } from '../../exam/types.ts'
import { parseRichText } from '../../explain/richText.ts'
import { latexProblem } from '../../expr/latexChecks.ts'
import { CHEM_ERROR_RULES } from '../errorRules.ts'
import { MISCONCEPTIONS_BY_COURSE } from '../misconceptions/index.ts'
import { figureById } from '../figures.ts'
import { TASK2_POINTS, buildTask2 } from './task2.ts'

// Klausuraufgabe 2 (S6e): Aufbau, Punkte, saubere Texte, Abwechslung

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1)
// Rechenfehler und Denkfehler der Wissensfragen
const RULES = new Set([...CHEM_ERROR_RULES.map((r) => r.id), ...Object.values(MISCONCEPTIONS_BY_COURSE).flat().map((m) => m.id)])
const truthAnswers = (task: ExamTask): Record<string, string> => Object.fromEntries([...truthOf(task)].map(([id, t]) => [id, t.option.id]))

describe('Klausuraufgabe 2: Aufbau', () => {
  it('6 Punkte in zwei Teilen, jede Frage mit zwei bis vier verschiedenen Antworten und genau einer richtigen', () => {
    for (const seed of SEEDS) {
      const task = buildTask2(seed)
      expect(totalPoints(task)).toBe(TASK2_POINTS)
      expect(task.parts.map((p) => [p.id, p.points])).toEqual([['a', 3], ['b', 3]])
      for (const part of task.parts) expect(part.items.reduce((s, i) => s + i.points, 0), `${seed} ${part.id}`).toBe(part.points)
      for (const [id, { build }] of truthOf(task)) {
        const ids = build.options.map((o) => o.id)
        expect(new Set(ids).size, `${seed} ${id}`).toBe(ids.length)
        expect(ids.length, `${seed} ${id}`).toBeGreaterThanOrEqual(2)
        expect(ids.length, `${seed} ${id}`).toBeLessThanOrEqual(4)
        expect(ids.filter((x) => x === build.correct), `${seed} ${id}`).toHaveLength(1)
        for (const o of build.options) {
          if (o.id !== build.correct) {
            expect(RULES.has(o.errorRuleId ?? ''), `${seed} ${id} ${o.errorRuleId}`).toBe(true)
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

  it('viel Abwechslung: verschiedene Elemente, Trend oder Ionenladung etwa je zur Hälfte', () => {
    const places = new Set<string>()
    let trend = 0
    for (const seed of SEEDS) {
      const task = buildTask2(seed)
      places.add(task.parts[0].prompt)
      if (task.parts[1].items[0].id === 'richtung') trend++
    }
    expect(places.size).toBeGreaterThan(25)
    expect(trend).toBeGreaterThan(60)
    expect(trend).toBeLessThan(140)
  })
})
