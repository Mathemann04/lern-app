import { describe, expect, it } from 'vitest'
import { evaluate } from '../expr/evaluate.ts'
import { toLatex } from '../expr/print.ts'
import { type Expr, add, exp, fn, mul, num, pow, sub, x } from '../expr/types.ts'
import { parseLatex } from '../parse/latex.ts'
import { createRng } from '../random/rng.ts'
import { hyperbolicTask } from '../tasks/fractionTerms.ts'
import { fractionWrongAnswers } from './errorRules.ts'
import { fracEquals, hyperbolicToExp, polyExpr, toFrac } from './frac.ts'
import { polyAtom, polyEquals } from './poly.ts'
import { solveFraction } from './solve.ts'
import { type BlockRule, type FractionTask, expanded, part, taskExpr, taskFrac, taskLatex } from './task.ts'

// Hyperbelfunktionen (M2b Schritt 5d): sinh x und cosh x als Bausteine mit cosh² x − sinh² x = 1

const sinh = fn('sinh', x)
const cosh = fn('cosh', x)
const value = (latex: string) => {
  const parsed = parseLatex(latex)
  if (!parsed.ok) throw new Error(latex)
  return toFrac(parsed.expr)!
}
const same = (a: string, b: string) => fracEquals(value(a), value(b))
const reduce = (n: Expr, d: Expr, rule: BlockRule): FractionTask => ({ kind: 'reduce', part: part(expanded(toFrac(n)!.num), expanded(toFrac(d)!.num)), hints: [], rule })

// Unabhängige Gegenprobe mit Math.sinh und Math.cosh, nur bei |x| ≤ 3 (für große x sind
// cosh x − sinh x und Ähnliches am Rechner ungenau)
const STELLEN = [-2.7, -1.3, -0.4, 0.35, 0.9, 1.6, 2.4, 3]
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const sameAt = (a: Expr, b: Expr) => STELLEN.every((v) => close(evaluate(a, { x: v }), evaluate(b, { x: v })))

describe('Hyperbelfunktionen: Vergleich', () => {
  it('kennt cosh² x − sinh² x = 1, tanh x = sinh x / cosh x und cosh x ± sinh x = e^{±x}', () => {
    expect(same('\\cosh^2 x - \\sinh^2 x', '1')).toBe(true)
    expect(same('\\cosh^2 x - 1', '\\sinh^2 x')).toBe(true)
    expect(same('\\tanh x', '\\frac{\\sinh x}{\\cosh x}')).toBe(true)
    expect(same('\\cosh x + \\sinh x', 'e^x')).toBe(true)
    expect(same('\\cosh x - \\sinh x', 'e^{-x}')).toBe(true)
    expect(same('\\frac{1}{\\cosh x - \\sinh x}', '\\cosh x + \\sinh x')).toBe(true)
  })

  it('verwechselt nichts', () => {
    expect(same('\\cosh^2 x + \\sinh^2 x', '1')).toBe(false)
    expect(same('\\cosh x', '\\sinh x')).toBe(false)
    expect(same('\\cosh x - \\sinh x', 'e^x')).toBe(false)
    expect(same('\\sinh x', '\\sin x')).toBe(false)
    expect(same('\\cosh^2 x - \\sinh^2 x', '-1')).toBe(false)
  })

  it('lässt Polynome ohne sinh und cosh unverändert', () => {
    const p = toFrac(add(pow(fn('sin', x), num(2)), exp(x)))!.num
    expect(polyEquals(hyperbolicToExp(p), p)).toBe(true)
    expect(polyEquals(hyperbolicToExp(polyAtom('x')), polyAtom('x'))).toBe(true)
  })

  it('schreibt sinh und cosh wie im Lehrbuch', () => {
    const shown = (e: Expr) => toLatex(polyExpr(toFrac(e)!.num))
    expect(shown(sub(cosh, sinh))).toBe('\\cosh x - \\sinh x')
    expect(shown(sub(pow(cosh, num(2)), pow(sinh, num(2))))).toBe('\\cosh^{2} x - \\sinh^{2} x')
    expect(shown(mul(cosh, sinh))).toBe('\\sinh x \\cdot \\cosh x')
    expect(toLatex(solveFraction(reduce(sub(pow(cosh, num(2)), num(1)), mul(sinh, cosh), { kind: 'trig', prefer: 'SH', target: 'num' })).result)).toBe('\\tanh x')
  })
})

describe('Hyperbelfunktionen: Aufgaben der Vorlage', () => {
  const tasks = Array.from({ length: 160 }, (_, i) => hyperbolicTask(createRng(`hyperbel-test:${i}`)))

  it('kommen in allen Arten vor', () => {
    const latex = tasks.map(taskLatex)
    expect(latex.some((l) => /^\\frac\{\d\}\{\\cosh x [+-] \\sinh x\}$/.test(l))).toBe(true)
    expect(latex.some((l) => l.includes('\\cosh x - 1') && l.includes('\\cosh x + 1'))).toBe(true)
    expect(latex.some((l) => l.includes('\\frac{1}{\\cosh^{2} x}'))).toBe(true)
    expect(latex.some((l) => l.includes('\\sinh^{2} x}{\\cosh x'))).toBe(true)
    expect(latex.some((l) => l.includes('\\frac{\\cosh x}{\\sinh x}') || l.includes('\\frac{\\sinh x}{\\cosh x}'))).toBe(true)
    expect(tasks.some((t) => t.kind === 'complex')).toBe(true)
  })

  it('Ergebnis gleichwertig zur Aufgabe, gegengeprüft mit Math.sinh und Math.cosh', () => {
    for (const t of tasks) {
      const s = solveFraction(t)
      expect(fracEquals(taskFrac(t), s.value), taskLatex(t)).toBe(true)
      expect(sameAt(taskExpr(t), s.result), `${taskLatex(t)} = ${toLatex(s.result)}`).toBe(true)
      // jeder Schritt hat denselben Wert
      for (const step of s.steps) if (step.expr) expect(sameAt(taskExpr(t), step.expr), `${taskLatex(t)}: ${step.kind}`).toBe(true)
    }
  })

  it('falsche Antworten sind nie gleichwertig zur Lösung; die Fehler der Hyperbelfunktionen kommen vor', () => {
    const ids = new Set<string>()
    for (const t of tasks) {
      const s = solveFraction(t)
      for (const w of fractionWrongAnswers(t, s)) {
        ids.add(w.rule.id)
        if (!w.value) continue
        expect(fracEquals(w.value, s.value), `${taskLatex(t)}: ${w.rule.id}`).toBe(false)
        if (w.result) expect(sameAt(taskExpr(t), w.result), `${taskLatex(t)}: ${w.rule.id}`).toBe(false)
      }
    }
    expect(ids).toContain('frac-hyp-trig-sign')
    expect(ids).toContain('frac-hyp-swapped')
    expect(ids).toContain('frac-conjugate-one-side')
    expect(ids).toContain('frac-square-forgotten')
  })

  it('\\frac{1}{\\cosh x - \\sinh x}: mit dem Gegenstück erweitern, ausmultiplizieren, cosh² x − sinh² x = 1', () => {
    const s = solveFraction(reduce(num(1), sub(cosh, sinh), { kind: 'conjugate', target: 'den' }))
    expect(s.steps.map((step) => step.kind)).toEqual(['conjugate', 'multiply-out', 'identity'])
    expect(s.steps.map((step) => toLatex(step.expr!))).toEqual([
      '\\frac{\\cosh x + \\sinh x}{(\\cosh x - \\sinh x)(\\cosh x + \\sinh x)}',
      '\\frac{\\cosh x + \\sinh x}{\\cosh^{2} x - \\sinh^{2} x}',
      '\\cosh x + \\sinh x',
    ])
  })
})
