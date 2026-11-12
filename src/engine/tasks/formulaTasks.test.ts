import { describe, expect, it } from 'vitest'
import { prepareRearrangeCheck, checkRearrangeAnswer } from '../check/rearrangeAnswer.ts'
import { parseRichText } from '../explain/richText.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { planRearrangeTask } from '../guided/rearrangePlan.ts'
import { createRng } from '../random/rng.ts'
import { holds, samplePoints } from '../rearrange/check.ts'
import { solveTask } from '../rearrange/isolate.ts'
import { conditionsText, taskVariables } from '../rearrange/task.ts'
import { FORMULAS, FORMULA_TASKS } from './formulas.ts'
import { formulaLevel, formulaRearrangeTask, formulaTaskAt } from './formulaTasks.ts'
import { latexWidthEm } from './latexWidth.ts'
import { rearrangeTaskBlocks } from './rearrangeBlocks.ts'
import { FORMULA_SHARE, nextRearrangeSeed, rearrangeSeedBlocks } from './rearrangePick.ts'
import { generateRearrangeTask } from './rearrangeTerms.ts'
import { type Level, blockSeed, formatTaskNumber, parseTaskNumber, seedBlock } from './taskNumber.ts'

// Formeln aus Technik und Physik (M6 Schritt 4b): feste Aufgaben mit Nummern wie „formel.2-7"

const refs = FORMULA_TASKS.map((task, i) => ({ level: task.level, seed: blockSeed('formel', i + 1) }))

describe('Formelsammlung', () => {
  it('Ids eindeutig, jedes Zeichen der Formel erklärt, jede Größe kommt vor', () => {
    expect(new Set(FORMULAS.map((f) => f.id)).size).toBe(FORMULAS.length)
    for (const formula of FORMULAS) {
      const symbols = formula.quantities.map(([symbol]) => symbol)
      const task = formulaRearrangeTask(formula, symbols[0])
      expect(taskVariables(task).sort(), formula.id).toEqual([...symbols].sort())
      expect(latexProblem(formula.latex), formula.id).toBeNull()
    }
  })

  it('jede Aufgabe: Formel und Größe gibt es, keine doppelt', () => {
    const keys = FORMULA_TASKS.map((t) => `${t.formula}:${t.target}`)
    expect(new Set(keys).size).toBe(keys.length)
    for (const entry of FORMULA_TASKS) {
      const formula = FORMULAS.find((f) => f.id === entry.formula)
      expect(formula, entry.formula).toBeDefined()
      expect(formula!.quantities.map(([s]) => s), `${entry.formula}: ${entry.target}`).toContain(entry.target)
    }
  })

  // Stufe und Bausteine stehen als Daten fest (für die Seiten ohne Engine); die Engine rechnet sie nach
  it.each(refs)('$level $seed: Stufe und Bausteine stimmen, Lösung durch Einsetzen geprüft, passt aufs Handy', (ref) => {
    const entry = FORMULA_TASKS[seedBlock(ref.seed)!.s - 1]
    const label = `${formatTaskNumber(ref)} (${entry.formula} nach ${entry.target})`
    const { task } = generateRearrangeTask(ref)
    const solution = solveTask(task)
    expect(solution, label).not.toBeNull()
    expect(formulaLevel(solution!), label).toBe(entry.level)
    expect(rearrangeTaskBlocks(task, solution!), label).toEqual(entry.blocks)
    expect(solution!.steps.length, label).toBeGreaterThanOrEqual(2)
    const points = samplePoints(task, solution!.result, createRng(`formel:${ref.seed}`), 16, solution!.requires)
    expect(points.length, label).toBeGreaterThanOrEqual(8)
    for (const point of points) expect(holds(task.equation, point), label).toBe(true)
    expect(latexWidthEm(equationToLatex(task.equation)), label).toBeLessThanOrEqual(16)
    expect(toLatex(solution!.result).length, label).toBeLessThanOrEqual(90)
    // unter der Aufgabe: Name, Zeichen mit Bedeutung, „Alle Größen sind positiv"
    const note = conditionsText(task)
    expect(note, label).toMatch(/Alle Größen sind positiv/)
    for (const part of parseRichText(note).flat()) if (part.kind === 'math') expect(latexProblem(part.latex), label).toBeNull()
  })

  it.each(refs)('$level $seed: geführt durchspielbar, frei die Lösung erkannt', (ref) => {
    const label = formatTaskNumber(ref)
    const plan = planRearrangeTask(ref)
    expect(plan.steps.length, label).toBeGreaterThan(0)
    for (const step of plan.steps) {
      expect(step.choices.filter((c) => c.correct), `${label}: ${step.question}`).toHaveLength(1)
      expect(new Set(step.choices.map((c) => c.content)).size, `${label}: ${step.question}`).toBe(step.choices.length)
    }
    expect(plan.note, label).toMatch(/Alle Größen sind positiv/)
    const { task } = generateRearrangeTask(ref)
    const context = prepareRearrangeCheck(task)
    const result = toLatex(context.solution.result)
    expect(checkRearrangeAnswer(context, result), `${label}: ${result}`).toEqual({ kind: 'correct' })
    for (const w of context.wrongs) {
      if (!w.result) continue
      expect(checkRearrangeAnswer(context, toLatex(w.result)).kind, `${label}: ${w.rule.id}`).not.toBe('correct')
    }
  })

  it('Nummern: „formel.2-1“ schreiben und lesen, falsche Stufe baut die alte Nummer', () => {
    const first = FORMULA_TASKS[0]
    const ref = { level: first.level, seed: blockSeed('formel', 1) }
    expect(formatTaskNumber(ref)).toBe(`formel.${first.level}-1`)
    expect(parseTaskNumber(`formel.${first.level}-1`)).toEqual(ref)
    expect(formulaTaskAt(first.level, 1)).not.toBeNull()
    const other = ((first.level % 5) + 1) as Level
    expect(formulaTaskAt(other, 1)).toBeNull()
    expect(generateRearrangeTask({ level: other, seed: blockSeed('formel', 1) }).task).toEqual(generateRearrangeTask({ level: other, seed: 1 }).task)
    expect(formulaTaskAt(1, FORMULA_TASKS.length + 1)).toBeNull()
  })

  it('kommen beim Ziehen dran, nur mit angekreuzten Bausteinen', () => {
    const rng = createRng('formeln-ziehen')
    const chosen = new Set(['potenzen', 'brueche'])
    let formulas = 0
    const draws = 500
    for (let i = 0; i < draws; i++) {
      const seed = nextRearrangeSeed(1, chosen, () => rng.next())
      for (const id of rearrangeSeedBlocks(1, seed)!) expect(chosen.has(id)).toBe(true)
      if (seedBlock(seed)?.block === 'formel') formulas++
    }
    expect(formulas / draws).toBeGreaterThan(FORMULA_SHARE * 0.6)
    expect(formulas / draws).toBeLessThan(FORMULA_SHARE * 1.4)
  })
})
