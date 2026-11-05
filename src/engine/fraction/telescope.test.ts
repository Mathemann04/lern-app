import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { toLatex } from '../expr/print.ts'
import { createRng } from '../random/rng.ts'
import { rat, ratToNumber } from '../rational.ts'
import { telescopeTask } from '../tasks/fractionKit.ts'
import { fractionWrongAnswers, teleMistakes } from './errorRules.ts'
import { fracEquals, fracOf, toFrac } from './frac.ts'
import { constValue, polyConst, polySubstitute } from './poly.ts'
import { solveFraction, teleWork } from './solve.ts'
import { type FractionTask, partFrac, taskLatex } from './task.ts'
import { partialSumDirect, remainingExpr, remainingFrac, splitExpr, writtenLatex } from './telescope.ts'

// Teleskopsummen: Gegenprobe durch Teilsummen. Die Summanden werden einzeln exakt addiert und mit der
// Formel aus dem Wegheben verglichen; bei einer Reihe mit einer langen Teilsumme.

const tasks: Array<Extract<FractionTask, { kind: 'telescope' }>> = Array.from({ length: 150 }, (_, i) => {
  const t = telescopeTask(createRng(`teleskop-test:${i}`))
  if (t.kind !== 'telescope') throw new Error('keine Teleskopsumme')
  return t
})

// Wert eines Bruchs in n an der Stelle n = N
function valueAt(f: ReturnType<typeof partFrac>, letter: string, N: number) {
  const at = (p: typeof f.num) => constValue(polySubstitute(p, letter, polyConst(N)))!
  return { num: polyConst(at(f.num)), den: polyConst(at(f.den)) }
}

describe('Teleskopsummen', () => {
  it('Teilsummen einzeln addiert ergeben, was nach dem Wegheben übrig bleibt', () => {
    for (const t of tasks) {
      const w = teleWork(t)
      const summand = partFrac(t.summand)
      if (t.upper.kind === 'number') {
        const direct = partialSumDirect(summand, t.index, t.from, t.upper.value)!
        expect(fracEquals(solveFraction(t).value, fracOf(polyConst(direct))), taskLatex(t)).toBe(true)
        continue
      }
      const s = remainingFrac(w)!
      for (let N = t.from; N <= t.from + 6; N++) {
        const direct = partialSumDirect(summand, t.index, t.from, N)!
        expect(fracEquals(valueAt(s, t.upper.letter, N), fracOf(polyConst(direct))), `${taskLatex(t)} bis ${N}`).toBe(true)
      }
    }
  })

  it('Reihe: eine lange Teilsumme liegt nahe am Wert', () => {
    for (const t of tasks.filter((x) => x.upper.kind === 'infinity').slice(0, 30)) {
      const direct = ratToNumber(partialSumDirect(partFrac(t.summand), t.index, t.from, 4000)!)
      const value = ratToNumber(constValue(solveFraction(t).value.num) ?? rat(0))
      expect(Math.abs(direct - value), taskLatex(t)).toBeLessThan(2e-3)
    }
  })

  it('Zerlegung und Anzeige haben denselben Wert wie die Rechnung, auch mit Fehlern', () => {
    for (const t of tasks) {
      const w = teleWork(t)
      expect(fracEquals(toFrac(splitExpr(w))!, partFrac(t.summand)), taskLatex(t)).toBe(true)
      for (const v of [{}, ...teleMistakes(t, w).map((x) => x.variant)]) {
        const shown = toFrac(remainingExpr(w, v))!
        expect(fracEquals(shown, remainingFrac(w, v)!), `${taskLatex(t)} ${toLatex(remainingExpr(w, v))}`).toBe(true)
      }
      expect(latexProblem(writtenLatex(w), { checkUgly: false }), writtenLatex(w)).toBeNull()
    }
  })

  it('falsche Ergebnisse sind nie richtig, und es gibt immer mindestens zwei', () => {
    for (const t of tasks) {
      const solution = solveFraction(t)
      const wrongs = fractionWrongAnswers(t, solution)
      for (const w of wrongs) if (w.value) expect(fracEquals(w.value, solution.value), `${taskLatex(t)} ${w.rule.id}`).toBe(false)
      expect(wrongs.filter((w) => w.result).length, taskLatex(t)).toBeGreaterThanOrEqual(2)
    }
  })

  it('bringt alle Arten: bis n, bis zu einer Zahl, Reihe; Abstand 1 und 2, Quadrate, Start später', () => {
    const kinds = new Set(tasks.map((t) => t.upper.kind))
    expect([...kinds].sort()).toEqual(['infinity', 'letter', 'number'])
    const shifts = new Set(tasks.map((t) => teleWork(t).shift))
    expect([...shifts].sort()).toEqual([1, 2])
    expect(tasks.some((t) => teleWork(t).power === 2)).toBe(true)
    expect(tasks.some((t) => teleMistakes(t).some((x) => x.id === 'frac-tele-start'))).toBe(true)
  })
})
