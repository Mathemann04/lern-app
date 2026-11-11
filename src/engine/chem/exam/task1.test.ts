import { describe, expect, it } from 'vitest'
import { gradeExam, itemsOf, totalPoints, truthOf } from '../../exam/grade.ts'
import type { ExamTask } from '../../exam/types.ts'
import { parseRichText } from '../../explain/richText.ts'
import { latexProblem } from '../../expr/latexChecks.ts'
import { CHEM_ERROR_RULES } from '../errorRules.ts'
import { elementBySymbol } from '../elements.ts'
import { MISCONCEPTIONS_BY_COURSE } from '../misconceptions/index.ts'
import { figureById } from '../figures.ts'
import { CHARGE_ASSIGNMENT, TASK1_POINTS, buildTask1, particleItem } from './task1.ts'

// Klausuraufgabe 1 (S6b): Aufbau, Punkte, saubere Texte, Teilchenzahlen richtig, Abwechslung

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1)
// Rechenfehler und Denkfehler der Wissensfragen
const RULES = new Set([...CHEM_ERROR_RULES.map((r) => r.id), ...Object.values(MISCONCEPTIONS_BY_COURSE).flat().map((m) => m.id)])
const truthAnswers = (task: ExamTask): Record<string, string> => Object.fromEntries([...truthOf(task)].map(([id, t]) => [id, t.option.id]))

describe('Klausuraufgabe 1: Aufbau', () => {
  it('8 Punkte in fünf Teilen, jede Frage mit zwei bis vier verschiedenen Antworten und genau einer richtigen', () => {
    for (const seed of SEEDS) {
      const task = buildTask1(seed)
      expect(totalPoints(task)).toBe(TASK1_POINTS)
      expect(task.parts.map((p) => [p.id, p.points])).toEqual([['a', 1], ['b', 2], ['c', 1], ['d', 2], ['e', 2]])
      for (const part of task.parts) expect(part.items.reduce((s, i) => s + i.points, 0), `${seed} ${part.id}`).toBe(part.points)
      for (const [id, { build }] of truthOf(task)) {
        const ids = build.options.map((o) => o.id)
        expect(new Set(ids).size, `${seed} ${id}`).toBe(ids.length)
        expect(ids.length, `${seed} ${id}`).toBeGreaterThanOrEqual(2)
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

  it('gibt für dieselbe Nummer dieselbe Aufgabe, alles richtig gibt 8 Punkte', () => {
    for (const seed of SEEDS.slice(0, 30)) {
      expect(JSON.stringify(buildTask1(seed))).toBe(JSON.stringify(buildTask1(seed)))
      const task = buildTask1(seed)
      expect(gradeExam(task, truthAnswers(task)).points).toBe(TASK1_POINTS)
    }
  })

  it('Texte und Formeln sind sauber', () => {
    for (const seed of SEEDS.slice(0, 80)) {
      const task = buildTask1(seed)
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

  it('Teilchenzahlen aus dem Kernsymbol: richtig und je Fehler wie im Katalog', () => {
    const cl = particleItem({ el: elementBySymbol('Cl')!, a: 37, q: -1 }).build(() => null!, () => null!)
    expect(cl.correct).toBe('$17$ Protonen, $20$ Neutronen, $18$ Elektronen')
    const byRule = Object.fromEntries(cl.options.filter((o) => o.errorRuleId).map((o) => [o.errorRuleId, o.content]))
    expect(byRule['chem-neutrons-mass-number']).toBe('$17$ Protonen, $37$ Neutronen, $18$ Elektronen')
    expect(byRule['chem-ion-charge-ignored']).toBe('$17$ Protonen, $20$ Neutronen, $17$ Elektronen')
  })

  it('ungeladenes Atom im Kernsymbol: vier Antworten, Elektronen gleich Protonen', () => {
    const c = particleItem({ el: elementBySymbol('C')!, a: 13, q: 0 }).build(() => null!, () => null!)
    expect(c.correct).toBe('$6$ Protonen, $7$ Neutronen, $6$ Elektronen')
    expect(c.options).toHaveLength(4)
    for (const o of c.options) if (o.id !== c.correct) expect(o.why?.detailed).toBeTruthy()
  })

  it('Abgleich mit den Altklausuren: eigener Wortlaut, Atome und Ionen, Ladungen zuordnen oft, kein O und Cl in Teil d, jede Frage zählt für sich', () => {
    let neutral = 0
    let assignment = 0
    let valenceQuestion = 0
    for (const seed of SEEDS) {
      const task = buildTask1(seed)
      const [a, , c, d] = task.parts
      expect(c.items[0].question).toMatch(/^Bestimme die Zahl der Protonen, Neutronen und Elektronen von /)
      if (!/\^\{?[0-9]*[+-]/.test(c.items[0].question.replace(/\^\{\d+\}_\{\d+\}/, ''))) neutral++
      const no = Math.floor((a.items[0].review!.seed - 500_000) / 50)
      if (no === CHARGE_ASSIGNMENT) assignment++
      expect(d.prompt, `${seed}`).not.toMatch(/\(\$\\ce\{(O|Cl)\}\$\)/)
      if (d.items[0].id === 'valenzelektron') valenceQuestion++
      for (const item of itemsOf(task)) expect(item.final, `${seed} ${item.id}`).toBeUndefined()
      // jede Frage mit drei oder vier Antworten
      for (const [id, { build }] of truthOf(task)) expect(build.options.length, `${seed} ${id}`).toBeGreaterThanOrEqual(3)
    }
    expect(neutral).toBeGreaterThan(50)
    expect(neutral).toBeLessThan(120)
    expect(assignment).toBeGreaterThan(70)
    expect(valenceQuestion).toBeGreaterThan(60)
    expect(valenceQuestion).toBeLessThan(140)
  })

  it('viel Abwechslung: verschiedene Teilchen, Begriffsfragen, Elemente, Modell oder Licht', () => {
    const particles = new Set<string>()
    const terms = new Set<string>()
    const valence = new Set<string>()
    let light = 0
    for (const seed of SEEDS) {
      const task = buildTask1(seed)
      particles.add(task.parts[2].items[0].question)
      terms.add(task.parts[1].items.map((i) => i.question).join('|'))
      valence.add(task.parts[3].prompt)
      if (task.parts[4].items[0].id === 'licht') light++
    }
    expect(particles.size).toBeGreaterThan(60)
    expect(terms.size).toBeGreaterThan(50)
    expect(valence.size).toBeGreaterThan(15)
    expect(light).toBeGreaterThan(60)
    expect(light).toBeLessThan(140)
  })
})
