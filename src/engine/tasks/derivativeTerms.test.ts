import { describe, expect, it } from 'vitest'
import { closeEnough } from '../expr/arbitraries.ts'
import { contains } from '../expr/compare.ts'
import { simplify } from '../expr/display.ts'
import { evaluate } from '../expr/evaluate.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { normalize } from '../expr/normalize.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { samplePoints } from '../expr/sample.ts'
import { createRng } from '../random/rng.ts'
import { type DerivativeTask, generateDerivativeTask, templatesForLevel } from './derivativeTerms.ts'
import { LEVELS, formatTaskNumber, parseTaskNumber } from './taskNumber.ts'

const SEEDS_PER_LEVEL = 400

function latexOf(task: DerivativeTask): string {
  return task.kind === 'function' ? toLatex(task.expr) : equationToLatex(task.equation)
}

function expectCleanLatex(latex: string, context: string) {
  expect(latexProblem(latex), context).toBeNull()
}

describe.each(LEVELS)('Stufe %i', (level) => {
  const generated = Array.from({ length: SEEDS_PER_LEVEL }, (_, i) => generateDerivativeTask({ level, seed: i + 1 }))

  it('setzt jede Aufgabe sauber', () => {
    for (const g of generated) expectCleanLatex(latexOf(g.task), formatTaskNumber(g.ref))
  })

  it('erzeugt bei gleicher Nummer dieselbe Aufgabe', () => {
    for (const g of generated.slice(0, 50)) {
      expect(latexOf(generateDerivativeTask(g.ref).task)).toBe(latexOf(g.task))
    }
  })

  it('ist abwechslungsreich und nutzt alle Vorlagen', () => {
    const distinct = new Set(generated.map((g) => latexOf(g.task)))
    // Profi-Aufgaben (x^x, arcsin …) haben von Natur aus weniger sinnvolle Formen
    const minShare = level === 5 ? 0.4 : 0.5
    expect(distinct.size).toBeGreaterThan(SEEDS_PER_LEVEL * minShare)
    const usedTemplates = new Set(generated.map((g) => g.template.id))
    expect([...usedTemplates].sort()).toEqual(templatesForLevel(level).map((t) => t.id).sort())
  })

  const functions = generated.flatMap((g) => (g.task.kind === 'function' ? [{ ...g, expr: g.task.expr }] : []))

  it('hängt von x ab und ist auf einem echten Bereich definiert', () => {
    for (const g of functions) {
      expect(contains(g.expr, 'x'), formatTaskNumber(g.ref)).toBe(true)
      const points = samplePoints([g.expr], createRng(g.ref.seed), 20)
      expect(points.length, `${formatTaskNumber(g.ref)}: ${toLatex(g.expr)}`).toBe(20)
    }
  })

  it('Vereinfachen ändert den Wert nicht und sieht sauber aus', () => {
    for (const g of functions) {
      const n = normalize(g.expr)
      const pretty = simplify(g.expr)
      expectCleanLatex(toLatex(pretty), `vereinfacht ${formatTaskNumber(g.ref)}`)
      for (const point of samplePoints([g.expr], createRng(g.ref.seed + 7), 10)) {
        const original = evaluate(g.expr, point)
        expect(closeEnough(original, evaluate(n, point)), `${toLatex(g.expr)} bei ${point.x}`).toBe(true)
        expect(closeEnough(original, evaluate(pretty, point)), `${toLatex(pretty)} bei ${point.x}`).toBe(true)
      }
    }
  })
})

describe('Aufgaben-Nummer', () => {
  it('liest und schreibt Nummern', () => {
    expect(formatTaskNumber({ level: 3, seed: 48213 })).toBe('3-48213')
    expect(parseTaskNumber(' 3-48213 ')).toEqual({ level: 3, seed: 48213 })
    expect(parseTaskNumber('4–7')).toEqual({ level: 4, seed: 7 })
  })

  it('lehnt ungültige Nummern ab', () => {
    for (const text of ['', '6-1', '3-', '3-0', '3-1234567', 'abc', '3 48213']) {
      expect(parseTaskNumber(text), text).toBeNull()
    }
  })
})
