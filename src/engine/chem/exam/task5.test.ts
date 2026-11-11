import { describe, expect, it } from 'vitest'
import { examState, gradeExam, itemsOf, totalPoints, truthOf } from '../../exam/grade.ts'
import type { ExamTask } from '../../exam/types.ts'
import { parseRichText } from '../../explain/richText.ts'
import { latexProblem } from '../../expr/latexChecks.ts'
import { chemTopic } from '../banks.ts'
import { CHEM_ERROR_RULES } from '../errorRules.ts'
import { MISCONCEPTIONS_BY_COURSE } from '../misconceptions/index.ts'
import { CATALYST_QUESTIONS, EQUILIBRIUM_QUESTIONS, LE_CHATELIER_QUESTIONS, TASK5_POINTS, buildTask5, dgSign } from './task5.ts'

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
          if (o.errorRuleId) expect(RULES.has(o.errorRuleId), `${seed} ${id} ${o.errorRuleId}`).toBe(true)
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

  it('„freiwillig?" mit dem eigenen ΔG: die zum falschen ΔG passende Folgerung ist ein Folgefehler, kein zweiter Fehler', () => {
    let checked = 0
    for (const seed of SEEDS) {
      const task = buildTask5(seed)
      const truth = truthOf(task)
      if (!truth.has('freiwillig')) continue
      const dg = truth.get('dg')!
      const wrongSign = dg.build.options.find((o) => o.id !== dg.build.correct && dgSign(o) !== dgSign(dg.option))
      if (!wrongSign) continue
      const answersFor = (verdict: (ids: { expected: string; correct: string }) => string) => {
        const state = examState(task, { dg: wrongSign.id }).find((s) => s.item.id === 'freiwillig')!
        return { dg: wrongSign.id, freiwillig: verdict({ expected: state.build!.expected, correct: state.build!.correct }) }
      }
      // zum eigenen ΔG passend: Folgefehler, der Punkt für „freiwillig?" bleibt
      const consistent = gradeExam(task, answersFor((x) => x.expected))
      const e = consistent.parts.find((p) => p.part.id === 'e')!
      expect(e.items.find((r) => r.item.id === 'freiwillig')!.status, `${seed}`).toBe('folgefehler')
      expect(e.points, `${seed}`).toBe(1)
      // die richtige Folgerung zum wahren ΔG zählt weiter
      expect(gradeExam(task, answersFor((x) => x.correct)).parts.find((p) => p.part.id === 'e')!.points, `${seed}`).toBe(1)
      expect(truth.get('freiwillig')!.build.expected).toBe(truth.get('freiwillig')!.build.correct)
      checked++
    }
    expect(checked).toBeGreaterThan(10)
  })

  it('Abgleich mit den Altklausuren: Massenwirkungsgesetz erst auf Papier, Le Chatelier auch als Wissensfrage, nur ΔH als Ergebnis des Teils', () => {
    let knowledge = 0
    for (const seed of SEEDS) {
      const task = buildTask5(seed)
      expect(itemsOf(task).filter((i) => i.paperFirst).map((i) => i.id)).toEqual(['mwg'])
      for (const item of itemsOf(task)) if (item.id !== 'dh') expect(item.final, `${seed} ${item.id}`).toBeUndefined()
      const c = task.parts[2].items[0]
      if (c.review) {
        knowledge++
        expect(LE_CHATELIER_QUESTIONS).toContain(Math.floor((c.review.seed - 500_000) / 50))
      }
    }
    expect(knowledge).toBeGreaterThan(40)
    expect(knowledge).toBeLessThan(100)
    const bank = chemTopic('chem-mwg')!.bank.questions
    for (const no of LE_CHATELIER_QUESTIONS) expect(bank.find((q) => q.no === no)?.kind, String(no)).toBe('single')
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
