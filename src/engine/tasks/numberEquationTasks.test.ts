import { describe, expect, it } from 'vitest'
import { checkRearrangeAnswer, prepareRearrangeCheck } from '../check/rearrangeAnswer.ts'
import { NO_SOLUTION_INPUT } from '../check/freeTask.ts'
import { parseRichText } from '../explain/richText.ts'
import { rearrangeExample } from '../explain/rearrangeExample.ts'
import { evaluate } from '../expr/evaluate.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import type { Equation } from '../expr/types.ts'
import { planRearrangeTask } from '../guided/rearrangePlan.ts'
import { parseLatexEquation } from '../parse/latex.ts'
import { createRng } from '../random/rng.ts'
import { holds } from '../rearrange/check.ts'
import { solveEquation, solveTask } from '../rearrange/isolate.ts'
import { probeLatex, probeOf } from '../rearrange/probe.ts'
import { conditionsText } from '../rearrange/task.ts'
import { latexWidthEm } from './latexWidth.ts'
import { NUMBER_EQUATION_KINDS, hasNumberEquations, numberEquationKind } from './numberEquationKinds.ts'
import { NUMBER_EQUATION_BUILDERS } from './numberEquationTasks.ts'
import { rearrangeTaskBlocks } from './rearrangeBlocks.ts'
import { REARRANGE_PLAYABLE_COMBOS } from './rearrangeFamilies.ts'
import { NUMBER_EQUATION_SHARE, nextRearrangeSeed, rearrangeSeedBlocks } from './rearrangePick.ts'
import { generateRearrangeTask } from './rearrangeTerms.ts'
import { type Level, blockSeed, formatTaskNumber, parseTaskNumber, seedBlock } from './taskNumber.ts'
import { formOfLatex } from './variety.ts'

// Gleichungen mit Zahlen (M6 Schritt 4b-3): Nummern wie „zahlen.2-4711", Ergebnis eine Zahl oder keine Lösung

const LEVELS = ([1, 2, 3, 4, 5] as Level[]).filter(hasNumberEquations)
const refs = LEVELS.flatMap((level) => Array.from({ length: 30 }, (_, i) => ({ level, seed: blockSeed('zahlen', i + 1) })))

// Unabhängige Gegenprobe: alle Lösungen zwischen -200 und 200 numerisch (Vorzeichenwechsel ohne Pol und Nullstellen auf dem
// Raster der Hundertstel)
function scanRoots(e: Equation): number[] {
  const f = (x: number) => evaluate(e.lhs, { x }) - evaluate(e.rhs, { x })
  const roots: number[] = []
  let prev = f(-200)
  for (let i = -19999; i <= 20000; i++) {
    const x = i / 100
    const v = f(x)
    if (!Number.isFinite(v)) {
      prev = v
      continue
    }
    if (Math.abs(v) < 1e-9) roots.push(x)
    else if (Number.isFinite(prev) && prev !== 0 && Math.sign(v) !== Math.sign(prev)) {
      let [a, b] = [x - 0.01, x]
      for (let k = 0; k < 60; k++) {
        const m = (a + b) / 2
        if (Math.sign(f(m)) === Math.sign(f(a))) a = m
        else b = m
      }
      if (Math.abs(f(a)) < 1e-6) roots.push(a)
    }
    prev = v
  }
  return roots.filter((r, i) => roots.findIndex((s) => Math.abs(s - r) < 1e-6) === i)
}

describe('Gleichungen mit Zahlen: Engine', () => {
  const solve = (latex: string) => {
    const p = parseLatexEquation(latex)
    if (!p.ok || !p.lhs) throw new Error(latex)
    return solveEquation({ lhs: p.lhs, rhs: p.rhs }, 'x', { numeric: true })
  }

  it('Wurzel gleich negativer Zahl: keine Lösung, ohne zu quadrieren', () => {
    const s = solve('2\\sqrt{x+3}+7=3')!
    expect(s.none).toBe(true)
    expect(s.steps.map((step) => step.kind)).toEqual(['add', 'divide', 'rootNegative'])
    expect(equationToLatex(s.steps[1].after)).toBe('\\sqrt{x + 3} = -2')
  })

  it('Scheinlösung nach dem Quadrieren: Probe mit beiden Lösungen der pq-Formel', () => {
    const s = solve('\\sqrt{2x+1}=x-1')!
    expect(toLatex(s.result)).toBe('4')
    const probes = s.steps.filter((step) => step.kind === 'probe')
    expect(probes.map((step) => [toLatex(step.operand!), step.reason ?? null])).toEqual([
      ['4', null],
      ['0', 'probe'],
    ])
  })

  it('Lösung außerhalb des Definitionsbereichs: Nenner 0 bzw. Logarithmus', () => {
    expect(solve('\\frac{2x}{x-1}=\\frac{2}{x-1}+3')!.none).toBe(true)
    const log = solve('\\log_2 x+\\log_2(x-2)=3')!
    expect(toLatex(log.result)).toBe('4')
    expect(log.steps.find((step) => step.reason === 'domain')?.operand).toBeDefined()
  })

  it('Zahlen werden gleich ausgerechnet, kein zweites Ergebnis bei x^2 = 9 (zwei Lösungen gibt es noch nicht)', () => {
    expect(equationToLatex(solve('\\sqrt{x+5}=4')!.steps[1].after)).toBe('x = 11')
    expect(solve('x^2=9')).toBeNull()
  })

  it('Probe als Rechenzeile', () => {
    const p = parseLatexEquation('\\sqrt{2x+1}=x-1')
    if (!p.ok || !p.lhs) throw new Error()
    const e = { lhs: p.lhs, rhs: p.rhs }
    const ok = probeLatex(probeOf(e, 'x', { kind: 'num', value: { n: 4n, d: 1n } }))
    expect(ok).toContain('3 = 3')
    expect(latexProblem(ok)).toBeNull()
    expect(probeLatex(probeOf(e, 'x', { kind: 'num', value: { n: 0n, d: 1n } }))).toContain('1 \\neq -1')
  })
})

describe('Gleichungen mit Zahlen: Aufgaben', () => {
  it('jede Art hat einen Baukasten, Stufen 1 bis 4', () => {
    expect([...NUMBER_EQUATION_BUILDERS].sort()).toEqual(NUMBER_EQUATION_KINDS.map((k) => k.id).sort())
    expect(LEVELS).toEqual([1, 2, 3, 4])
  })

  it.each(refs)('$level $seed: Art und Bausteine, Lösung durch unabhängige Gegenprobe, passt aufs Handy', (ref) => {
    const label = formatTaskNumber(ref)
    const kind = numberEquationKind(ref.level, seedBlock(ref.seed)!.s)!
    const { task } = generateRearrangeTask(ref)
    expect(task.numeric, label).toBe(true)
    const solution = solveTask(task)
    expect(solution, label).not.toBeNull()
    expect([...rearrangeTaskBlocks(task, solution!)].sort(), label).toEqual([...kind.blocks].sort())
    expect(rearrangeSeedBlocks(ref.level, ref.seed), label).toEqual(kind.blocks)
    const roots = scanRoots(task.equation)
    if (solution!.none) expect(roots, label).toEqual([])
    else {
      const x = evaluate(solution!.result, {})
      expect(holds(task.equation, { x }), label).toBe(true)
      expect(roots.length, `${label}: ${roots.join(', ')}`).toBe(1)
      expect(Math.abs(roots[0] - x), label).toBeLessThan(1e-6)
    }
    // jede verworfene Zahl besteht die Probe wirklich nicht
    for (const step of solution!.steps) {
      if (step.kind === 'probe' && step.reason) expect(holds(task.equation, { x: evaluate(step.operand!, {}) }), label).not.toBe(true)
    }
    expect(latexWidthEm(equationToLatex(task.equation)), label).toBeLessThanOrEqual(16)
    for (const part of parseRichText(conditionsText(task)).flat()) if (part.kind === 'math') expect(latexProblem(part.latex), label).toBeNull()
  })

  it.each(refs.filter((_, i) => i % 3 === 0))('$level $seed: geführt durchspielbar, frei erkannt (Zahl bzw. „Keine Lösung")', (ref) => {
    const label = formatTaskNumber(ref)
    const plan = planRearrangeTask(ref)
    expect(plan.steps.length, label).toBeGreaterThan(0)
    for (const step of plan.steps) {
      expect(step.choices.filter((c) => c.correct), `${label}: ${step.question}`).toHaveLength(1)
      expect(new Set(step.choices.map((c) => c.content)).size, `${label}: ${step.question}`).toBe(step.choices.length)
      for (const c of step.choices) for (const part of parseRichText(c.content).flat()) if (part.kind === 'math') expect(latexProblem(part.latex), label).toBeNull()
    }
    const { task } = generateRearrangeTask(ref)
    const context = prepareRearrangeCheck(task)
    if (context.solution.none) {
      expect(plan.resultLatex, label).toBe('\\mathbb{L} = \\{\\,\\}')
      expect(checkRearrangeAnswer(context, NO_SOLUTION_INPUT), label).toEqual({ kind: 'correct' })
    } else {
      const result = toLatex(context.solution.result)
      expect(checkRearrangeAnswer(context, result), `${label}: ${result}`).toEqual({ kind: 'correct' })
      expect(checkRearrangeAnswer(context, NO_SOLUTION_INPUT).kind, label).toBe('hasSolution')
    }
    for (const w of context.wrongs) {
      if (!w.result) continue
      expect(checkRearrangeAnswer(context, toLatex(w.result)).kind, `${label}: ${w.rule.id}`).not.toBe('correct')
    }
    // eine verworfene Zahl eingegeben: Scheinlösung behalten
    for (const step of context.solution.steps) {
      if (step.kind !== 'probe' || !step.reason) continue
      const verdict = checkRearrangeAnswer(context, toLatex(step.operand!))
      expect(verdict.kind === 'knownError' && verdict.wrong.rule.id, label).toBe('eq-spurious-root')
    }
    // Rechenweg für die Lernkarten
    for (const line of rearrangeExample(task).lines) expect(latexProblem(line.latex, line.label.startsWith('Probe') ? { checkUgly: false } : undefined), label).toBeNull()
  })

  it('ohne Zahl in der Normalform (x^2 - 7x = 0) sind Ausklammern und Teilen durch x keine Irrwege; „Warum falsch?" verrät nicht „keine Lösung"', () => {
    let checked = 0
    for (const level of [2, 4] as Level[]) {
      for (let s = 1; s <= 80; s++) {
        const ref = { level, seed: blockSeed('zahlen', s) }
        const solution = solveTask(generateRearrangeTask(ref).task)!
        const pq = solution.steps.find((step) => step.kind === 'pq')
        const plan = planRearrangeTask(ref)
        for (const step of plan.steps) {
          for (const c of step.choices) if (!c.correct && c.whyWrong) expect(c.whyWrong.detailed.toLowerCase(), formatTaskNumber(ref)).not.toContain('keine lösung')
        }
        if (!pq || !(pq.before.lhs.kind === 'add' && pq.before.lhs.terms.every((term) => term.kind !== 'num' && !(term.kind === 'neg' && term.arg.kind === 'num')))) continue
        checked++
        const wrongMoves = plan.steps.flatMap((step) => step.choices.filter((c) => !c.correct).map((c) => c.content))
        expect(wrongMoves.filter((c) => c.includes('ausklammern') || c.includes('durch $x$ teilen')), formatTaskNumber(ref)).toEqual([])
      }
    }
    expect(checked).toBeGreaterThan(0)
  })

  it.each(LEVELS)('Stufe %i: Abwechslung (200 Aufgaben, mindestens 100 Formen, keine öfter als 3 von 100)', (level) => {
    const forms = new Map<string, number>()
    for (let s = 1; s <= 200; s++) {
      const form = formOfLatex(equationToLatex(generateRearrangeTask({ level, seed: blockSeed('zahlen', s) }).task.equation))
      forms.set(form, (forms.get(form) ?? 0) + 1)
    }
    expect(forms.size).toBeGreaterThanOrEqual(100)
    expect(Math.max(...forms.values())).toBeLessThanOrEqual(6)
  })

  it('je Stufe Aufgaben ohne Lösung, verworfene Zahlen aus beiden Gründen, Wurzel gleich negativer Zahl', () => {
    const reasons = new Set<string>()
    const kinds = new Set<string>()
    for (const level of LEVELS) {
      let none = 0
      for (let s = 1; s <= 60; s++) {
        const solution = solveTask(generateRearrangeTask({ level, seed: blockSeed('zahlen', s) }).task)!
        if (solution.none) none++
        for (const step of solution.steps) {
          kinds.add(step.kind)
          if (step.reason) reasons.add(step.reason)
        }
      }
      expect(none, `Stufe ${level}`).toBeGreaterThan(0)
    }
    expect([...reasons].sort()).toEqual(['domain', 'negative', 'probe'])
    for (const kind of ['probe', 'rootNegative', 'pq', 'choose', 'substitute']) expect(kinds).toContain(kind)
  })

  it('Nummern: „zahlen.2-5" schreiben und lesen; Stufe ohne solche Aufgaben baut die alte Nummer', () => {
    const ref = { level: 2 as Level, seed: blockSeed('zahlen', 5) }
    expect(formatTaskNumber(ref)).toBe('zahlen.2-5')
    expect(parseTaskNumber('zahlen.2-5')).toEqual(ref)
    expect(generateRearrangeTask({ level: 5, seed: blockSeed('zahlen', 5) }).task).toEqual(generateRearrangeTask({ level: 5, seed: 5 }).task)
    for (const level of LEVELS) for (const kind of NUMBER_EQUATION_KINDS.filter((k) => k.level === level)) expect(REARRANGE_PLAYABLE_COMBOS[level]).toContain(kind.blocks.join('+'))
  })

  it('kommen beim Ziehen dran, nur mit angekreuzten Bausteinen', () => {
    const rng = createRng('zahlen-ziehen')
    const chosen = new Set(['wurzeln'])
    let numbers = 0
    const draws = 400
    for (let i = 0; i < draws; i++) {
      const seed = nextRearrangeSeed(1, chosen, () => rng.next())
      for (const id of rearrangeSeedBlocks(1, seed)!) expect(chosen.has(id)).toBe(true)
      if (seedBlock(seed)?.block === 'zahlen') numbers++
    }
    expect(numbers / draws).toBeGreaterThan(NUMBER_EQUATION_SHARE * 0.5)
    expect(numbers / draws).toBeLessThan(NUMBER_EQUATION_SHARE * 1.5)
  })
})
