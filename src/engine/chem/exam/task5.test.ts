import { describe, expect, it } from 'vitest'
import { gradeExam, itemsOf, totalPoints, truthOf } from '../../exam/grade.ts'
import type { ExamTask } from '../../exam/types.ts'
import { parseRichText } from '../../explain/richText.ts'
import { latexProblem } from '../../expr/latexChecks.ts'
import { chemTopic } from '../banks.ts'
import { CHEM_ERROR_RULES } from '../errorRules.ts'
import { MISCONCEPTIONS_BY_COURSE } from '../misconceptions/index.ts'
import { CATALYST_QUESTIONS, EQUILIBRIUM_QUESTIONS, TASK5_POINTS, buildTask5 } from './task5.ts'

// Klausuraufgabe 5 (S7c): Aufbau, Punkte, saubere Texte, Abwechslung

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1)
// Rechenfehler und Denkfehler der Wissensfragen
const RULES = new Set([...CHEM_ERROR_RULES.map((r) => r.id), ...Object.values(MISCONCEPTIONS_BY_COURSE).flat().map((m) => m.id)])
const truthAnswers = (task: ExamTask): Record<string, string> => Object.fromEntries([...truthOf(task)].map(([id, t]) => [id, t.option.id]))

describe('Klausuraufgabe 5: Aufbau', () => {
  it('nimmt für Teil a Fragen zum Gleichgewicht und zum Katalysator', () => {
    const bank = chemTopic('chem-mwg')!.bank.questions
    for (const no of EQUILIBRIUM_QUESTIONS) expect(bank.find((q) => q.no === no)?.part, String(no)).toBe('gleichgewicht')
    for (const no of CATALYST_QUESTIONS) {
      const q = bank.find((x) => x.no === no)
      expect(q?.part, String(no)).toBe('katalysator')
      expect(q?.figure, String(no)).toBeUndefined()
    }
  })

  it('10 Punkte in fünf Teilen, jede Frage mit zwei bis vier verschiedenen Antworten und genau einer richtigen', () => {
    for (const seed of SEEDS) {
      const task = buildTask5(seed)
      expect(totalPoints(task)).toBe(TASK5_POINTS)
      expect(task.parts.map((p) => [p.id, p.points])).toEqual([['a', 2], ['b', 2], ['c', 1], ['d', 3], ['e', 2]])
      for (const part of task.parts) expect(part.items.reduce((s, i) => s + i.points, 0), `${seed} ${part.id}`).toBe(part.points)
      for (const [id, { build }] of truthOf(task)) {
        const ids = build.options.map((o) => o.id)
        expect(new Set(ids).size, `${seed} ${id}`).toBe(ids.length)
        expect(ids.length, `${seed} ${id}`).toBeGreaterThanOrEqual(2)
        expect(ids.length, `${seed} ${id}`).toBeLessThanOrEqual(4)
        expect(ids.filter((x) => x === build.correct), `${seed} ${id}`).toHaveLength(1)
        for (const o of build.options) {
          if (o.id === build.correct) continue
          expect(RULES.has(o.errorRuleId ?? ''), `${seed} ${id} ${o.errorRuleId}`).toBe(true)
          expect(o.why?.detailed, `${seed} ${id}`).toBeTruthy()
        }
      }
    }
  })

  it('gibt für dieselbe Nummer dieselbe Aufgabe, alles richtig gibt 10 Punkte', () => {
    for (const seed of SEEDS.slice(0, 30)) {
      expect(JSON.stringify(buildTask5(seed))).toBe(JSON.stringify(buildTask5(seed)))
      const task = buildTask5(seed)
      expect(gradeExam(task, truthAnswers(task)).points).toBe(TASK5_POINTS)
    }
  })

  it('Texte und Formeln sind sauber', () => {
    for (const seed of SEEDS.slice(0, 80)) {
      const task = buildTask5(seed)
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

  it('viel Abwechslung: verschiedene Gleichgewichte und Reaktionen, beide Formen von Teil e', () => {
    const mwg = new Set<string>()
    const dh = new Set<string>()
    let range = 0
    for (const seed of SEEDS) {
      const task = buildTask5(seed)
      mwg.add(task.parts[1].prompt)
      dh.add(task.parts[3].prompt)
      if (task.parts[4].items[0].id === 'bereich') range++
    }
    expect(mwg.size).toBeGreaterThanOrEqual(15)
    expect(dh.size).toBeGreaterThanOrEqual(15)
    expect(range).toBeGreaterThan(60)
    expect(range).toBeLessThan(140)
  })
})
