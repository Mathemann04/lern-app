import { describe, expect, it } from 'vitest'
import { gradeExam, itemsOf, totalPoints, truthOf } from '../../exam/grade.ts'
import type { ExamTask } from '../../exam/types.ts'
import { parseRichText } from '../../explain/richText.ts'
import { latexProblem } from '../../expr/latexChecks.ts'
import { CHEM_ERROR_RULES } from '../errorRules.ts'
import { figureById } from '../figures.ts'
import { MISCONCEPTIONS_BY_COURSE } from '../misconceptions/index.ts'
import { TASK3_POINTS, ZMK_QUESTIONS, buildTask3 } from './task3.ts'

// Klausuraufgabe 3 (S5e): Aufbau, Punkte, saubere Texte, keine Stoffe der Altklausuren, Abwechslung

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1)
// Rechenfehler und Denkfehler der Wissensfragen
const RULES = new Set([...CHEM_ERROR_RULES.map((r) => r.id), ...Object.values(MISCONCEPTIONS_BY_COURSE).flat().map((m) => m.id)])
const truthAnswers = (task: ExamTask): Record<string, string> => Object.fromEntries([...truthOf(task)].map(([id, t]) => [id, t.option.id]))

describe('Klausuraufgabe 3: Aufbau', () => {
  it('12 Punkte in sechs Teilen, jede Frage mit zwei bis vier verschiedenen Antworten und genau einer richtigen', () => {
    for (const seed of SEEDS) {
      const task = buildTask3(seed)
      expect(totalPoints(task)).toBe(TASK3_POINTS)
      expect(task.parts.map((p) => [p.id, p.points])).toEqual([['a', 2], ['b', 3], ['c', 1], ['d', 2], ['e', 2], ['f', 2]])
      for (const part of task.parts) expect(part.items.reduce((s, i) => s + i.points, 0), `${seed} ${part.id}`).toBe(part.points)
      for (const [id, { build }] of truthOf(task)) {
        const ids = build.options.map((o) => o.id)
        expect(new Set(ids).size, `${seed} ${id}`).toBe(ids.length)
        expect(ids.length, `${seed} ${id}`).toBeGreaterThanOrEqual(2)
        expect(ids.length, `${seed} ${id}`).toBeLessThanOrEqual(4)
        expect(ids.filter((x) => x === build.correct), `${seed} ${id}`).toHaveLength(1)
        for (const o of build.options) {
          // typischer Fehler aus dem Katalog oder weitere Antwort ohne Fehler (extraOptions.ts) mit Erklärung
          if (o.id !== build.correct && o.errorRuleId) expect(RULES.has(o.errorRuleId), `${seed} ${id} ${o.errorRuleId}`).toBe(true)
          if (o.id !== build.correct && !o.errorRuleId) expect(o.why?.detailed, `${seed} ${id}`).toBeTruthy()
          if (o.figure) expect(figureById(o.figure), o.figure).toBeDefined()
        }
      }
    }
  })

  it('gibt für dieselbe Nummer dieselbe Aufgabe, alles richtig gibt 12 Punkte', () => {
    for (const seed of SEEDS.slice(0, 30)) {
      expect(JSON.stringify(buildTask3(seed))).toBe(JSON.stringify(buildTask3(seed)))
      const task = buildTask3(seed)
      expect(gradeExam(task, truthAnswers(task)).points).toBe(TASK3_POINTS)
    }
  })

  it('Texte und Formeln sind sauber', () => {
    for (const seed of SEEDS.slice(0, 80)) {
      const task = buildTask3(seed)
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

  it('Abgleich mit den Altklausuren: vier Antworten bei Ionen und Siedepunkten (drei Stoffe), selbst schreiben zuerst, Wissensfrage zu Kräften', () => {
    let knowledge = 0
    for (const seed of SEEDS) {
      const task = buildTask3(seed)
      const truth = truthOf(task)
      expect(truth.get('ionen')!.build.options, `${seed}`).toHaveLength(4)
      expect(truth.get('formel')!.build.options.length, `${seed}`).toBeGreaterThanOrEqual(3)
      expect(truth.get('sieden')!.build.options, `${seed}`).toHaveLength(4)
      expect(truth.get('sieden')!.option.content.split(' < '), `${seed}`).toHaveLength(3)
      const paper = itemsOf(task)
        .filter((i) => i.paperFirst)
        .map((i) => i.id)
      expect(paper).toEqual(['ionen', 'formel', 'lewis'])
      for (const item of itemsOf(task)) expect(item.final, `${seed} ${item.id}`).toBeUndefined()
      const d = task.parts[3].items[0]
      if (d.review) {
        knowledge++
        expect(ZMK_QUESTIONS).toContain(Math.floor((d.review.seed - 500_000) / 50))
      }
    }
    expect(knowledge).toBeGreaterThan(40)
    expect(knowledge).toBeLessThan(100)
  })

  it('Lewis-Formel, Paare und Gestalt zählen je 1 Punkt: die Gestalt allein gibt nicht die vollen Punkte', () => {
    for (const seed of SEEDS.slice(0, 20)) {
      const task = buildTask3(seed)
      const truth = truthOf(task)
      const wrong = (id: string) => truth.get(id)!.build.options.find((o) => o.id !== truth.get(id)!.build.correct)!.id
      const answers = { lewis: wrong('lewis'), paare: wrong('paare'), gestalt: truth.get('gestalt')!.option.id, ionen: wrong('ionen'), formel: truth.get('formel')!.option.id }
      const result = gradeExam(task, answers)
      expect(result.parts[1].points, `${seed}`).toBe(1)
      // Formel richtig, Ionen falsch: 1 von 2 Punkten
      expect(result.parts[0].points, `${seed}`).toBe(1)
    }
  })

  it('keine Stoffe der Altklausuren (Salz Al₂O₃ oder MgCl₂, Molekül NH₃ oder H₂O in Teil b), viel Abwechslung', () => {
    const salts = new Set<string>()
    const molecules = new Set<string>()
    for (const seed of SEEDS) {
      const task = buildTask3(seed)
      const a = task.parts[0]
      const b = task.parts[1]
      const salt = a.prompt + JSON.stringify(a.items.map((i) => i.build(() => null!, () => null!)))
      expect(salt).not.toMatch(/Al2O3|MgCl2/)
      // Salze des Übungsblatts (EXERCISE_SALTS): Calciumfluorid, Calciumphosphat
      expect(salt).not.toMatch(/Calciumfluorid|Calciumphosphat|CaF2|Ca3\(PO4\)2/)
      expect(b.prompt).not.toMatch(/\\ce\{(NH3|H2O)\}/)
      // Paare in der Lewis-Formel gezählt; bei Mehrfachbindung am Zentralatom sagt die Frage, wie
      const pairs = b.items.find((i) => i.id === 'paare')!
      expect(pairs.question, `${seed}`).toContain('in der Lewis-Formel')
      if (/CO2|CS2|HCN|CH2O|COCl2|NOCl/.test(b.prompt)) expect(pairs.question, `${seed}`).toContain('Doppelbindung sind dabei zwei bindende Paare')
      salts.add(a.prompt)
      molecules.add(b.prompt)
    }
    expect(salts.size).toBeGreaterThan(40)
    expect(molecules.size).toBeGreaterThan(15)
  })
})
