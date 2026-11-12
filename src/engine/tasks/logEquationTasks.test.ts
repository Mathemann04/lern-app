import { describe, expect, it } from 'vitest'
import { checkRearrangeAnswer, prepareRearrangeCheck } from '../check/rearrangeAnswer.ts'
import { parseRichText } from '../explain/richText.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { planRearrangeTask } from '../guided/rearrangePlan.ts'
import { createRng } from '../random/rng.ts'
import { holds, samplePoints } from '../rearrange/check.ts'
import { solveTask } from '../rearrange/isolate.ts'
import { conditionsText } from '../rearrange/task.ts'
import { LOG_EQUATION_KINDS, hasLogEquations, logEquationKind } from './logEquationKinds.ts'
import { LOG_EQUATION_BUILDERS } from './logEquationTasks.ts'
import { latexWidthEm } from './latexWidth.ts'
import { rearrangeTaskBlocks } from './rearrangeBlocks.ts'
import { REARRANGE_PLAYABLE_COMBOS } from './rearrangeFamilies.ts'
import { LOG_EQUATION_SHARE, nextRearrangeSeed, rearrangeSeedBlocks } from './rearrangePick.ts'
import { generateRearrangeTask } from './rearrangeTerms.ts'
import { type Level, blockSeed, formatTaskNumber, parseTaskNumber, seedBlock } from './taskNumber.ts'
import { formOfLatex } from './variety.ts'

// Logarithmen auf beiden Seiten, verschiedene Basen (M6 Schritt 4b-2): Nummern wie „logeq.2-4711"

const LOG_LEVELS = ([1, 2, 3, 4, 5] as Level[]).filter(hasLogEquations)
const refs = LOG_LEVELS.flatMap((level) => Array.from({ length: 25 }, (_, i) => ({ level, seed: blockSeed('logeq', i + 1) })))

describe('Logarithmen auf beiden Seiten', () => {
  it('jede Art hat einen Baukasten, Stufen 1 bis 4', () => {
    expect([...LOG_EQUATION_BUILDERS].sort()).toEqual(LOG_EQUATION_KINDS.map((k) => k.id).sort())
    expect(LOG_LEVELS).toEqual([1, 2, 3, 4])
  })

  it.each(refs)('$level $seed: Art und Bausteine stimmen, Lösung durch Einsetzen geprüft, passt aufs Handy', (ref) => {
    const label = formatTaskNumber(ref)
    const kind = logEquationKind(ref.level, seedBlock(ref.seed)!.s)!
    const { task } = generateRearrangeTask(ref)
    const solution = solveTask(task)
    expect(solution, label).not.toBeNull()
    expect(solution!.logPath, label).toBe(true)
    expect([...rearrangeTaskBlocks(task, solution!)].sort(), label).toEqual([...kind.blocks].sort())
    expect(rearrangeSeedBlocks(ref.level, ref.seed), label).toEqual(kind.blocks)
    const points = samplePoints(task, solution!.result, createRng(`logeq:${ref.seed}`), 16, solution!.requires)
    expect(points.length, label).toBeGreaterThanOrEqual(8)
    for (const point of points) expect(holds(task.equation, point), label).toBe(true)
    expect(latexWidthEm(equationToLatex(task.equation)), label).toBeLessThanOrEqual(16)
    for (const part of parseRichText(conditionsText(task)).flat()) if (part.kind === 'math') expect(latexProblem(part.latex), label).toBeNull()
  })

  it.each(refs.filter((_, i) => i % 3 === 0))('$level $seed: geführt durchspielbar, frei die Lösung erkannt', (ref) => {
    const label = formatTaskNumber(ref)
    const plan = planRearrangeTask(ref)
    expect(plan.steps.length, label).toBeGreaterThan(0)
    for (const step of plan.steps) {
      expect(step.choices.filter((c) => c.correct), `${label}: ${step.question}`).toHaveLength(1)
      expect(new Set(step.choices.map((c) => c.content)).size, `${label}: ${step.question}`).toBe(step.choices.length)
    }
    const { task } = generateRearrangeTask(ref)
    const context = prepareRearrangeCheck(task)
    const result = toLatex(context.solution.result)
    expect(checkRearrangeAnswer(context, result), `${label}: ${result}`).toEqual({ kind: 'correct' })
    for (const w of context.wrongs) {
      if (!w.result) continue
      expect(checkRearrangeAnswer(context, toLatex(w.result)).kind, `${label}: ${w.rule.id}`).not.toBe('correct')
    }
  })

  it.each(LOG_LEVELS)('Stufe %i: Abwechslung (200 Aufgaben, mindestens 100 Formen, keine öfter als 3 von 100)', (level) => {
    const forms = new Map<string, number>()
    for (let s = 1; s <= 200; s++) {
      const form = formOfLatex(equationToLatex(generateRearrangeTask({ level, seed: blockSeed('logeq', s) }).task.equation))
      forms.set(form, (forms.get(form) ?? 0) + 1)
    }
    expect(forms.size).toBeGreaterThanOrEqual(100)
    expect(Math.max(...forms.values())).toBeLessThanOrEqual(6)
  })

  it('alle neuen Schritte kommen vor', () => {
    const kinds = new Set<string>()
    for (const ref of refs) for (const step of solveTask(generateRearrangeTask(ref).task)!.steps) kinds.add(step.kind)
    for (const kind of ['logBase', 'logPower', 'logNumber', 'unlog']) expect(kinds).toContain(kind)
  })

  it('Nummern: „logeq.2-5“ schreiben und lesen; Stufe ohne solche Aufgaben baut die alte Nummer', () => {
    const ref = { level: 2 as Level, seed: blockSeed('logeq', 5) }
    expect(formatTaskNumber(ref)).toBe('logeq.2-5')
    expect(parseTaskNumber('logeq.2-5')).toEqual(ref)
    expect(generateRearrangeTask({ level: 5, seed: blockSeed('logeq', 5) }).task).toEqual(generateRearrangeTask({ level: 5, seed: 5 }).task)
    for (const level of LOG_LEVELS) for (const kind of LOG_EQUATION_KINDS.filter((k) => k.level === level)) expect(REARRANGE_PLAYABLE_COMBOS[level]).toContain(kind.blocks.join('+'))
  })

  it('kommen beim Ziehen dran, nur mit angekreuzten Bausteinen', () => {
    const rng = createRng('logarithmen-ziehen')
    const chosen = new Set(['log'])
    let logs = 0
    const draws = 400
    for (let i = 0; i < draws; i++) {
      const seed = nextRearrangeSeed(1, chosen, () => rng.next())
      for (const id of rearrangeSeedBlocks(1, seed)!) expect(chosen.has(id)).toBe(true)
      if (seedBlock(seed)?.block === 'logeq') logs++
    }
    expect(logs / draws).toBeGreaterThan(LOG_EQUATION_SHARE * 0.6)
    expect(logs / draws).toBeLessThan(LOG_EQUATION_SHARE * 1.4)
    // nur Logarithmus angekreuzt: in Stufe 3 keine Aufgabe, die danach quadratisch wird
    for (let i = 0; i < 200; i++) {
      const seed = nextRearrangeSeed(3, chosen, () => rng.next())
      expect(rearrangeSeedBlocks(3, seed)).not.toContain('quadratisch')
    }
  })
})
