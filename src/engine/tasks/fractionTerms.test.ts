import { describe, expect, it } from 'vitest'
import { type Env, evaluate } from '../expr/evaluate.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { toLatex } from '../expr/print.ts'
import { sampleEnvs, samplePoints } from '../expr/sample.ts'
import type { Expr } from '../expr/types.ts'
import { FRACTION_ERROR_RULES, fractionWrongAnswers } from '../fraction/errorRules.ts'
import { factoredPoly, reducedFrac } from '../fraction/factor.ts'
import { fracAtoms, fracEquals, toFrac } from '../fraction/frac.ts'
import { atomsOf, gcdUnivariate, polyContent, polyDivideExact, totalDegree } from '../fraction/poly.ts'
import { solveFraction } from '../fraction/solve.ts'
import { taskExpr, taskLatex } from '../fraction/task.ts'
import { createRng } from '../random/rng.ts'
import { ratToNumber } from '../rational.ts'
import { fractionTemplatesForLevel, generateFractionTask } from './fractionTerms.ts'
import { formatTaskNumber, type Level } from './taskNumber.ts'

// Für gründlichere Läufe vorübergehend erhöhen (mit 3000 je Stufe geprüft)
const SEEDS_PER_LEVEL = 300
const LEVELS_SO_FAR: Level[] = [1, 2, 3, 4]
const LETTERS = ['x', 'y', 'a', 'b', 'h']

// Stellen zum Vergleichen: bei x allein (auch e^x, ln x, sin x) wie beim Ableiten, sonst je
// Buchstabe eine Zufallszahl
function pointsFor(exprs: Expr[], atoms: string[], seed: string): Env[] {
  const letters = [...new Set(atoms.map((a) => (LETTERS.includes(a) ? a : 'x')))]
  if (letters.length <= 1) return samplePoints(exprs, createRng(seed), 20, letters[0] ?? 'x')
  return sampleEnvs(exprs, createRng(seed), 20, letters)
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))

describe.each(LEVELS_SO_FAR)('Brüche Stufe %i', (level) => {
  const generated = Array.from({ length: SEEDS_PER_LEVEL }, (_, i) => generateFractionTask({ level, seed: i + 1 }))
  const solved = generated.map((g) => ({ ...g, solution: solveFraction(g.task) }))

  it('setzt Aufgabe, Rechenweg und Ergebnis sauber', () => {
    for (const { task, solution, ref } of solved) {
      const context = `${formatTaskNumber(ref)}: ${taskLatex(task)}`
      expect(latexProblem(taskLatex(task)), context).toBeNull()
      expect(latexProblem(toLatex(solution.result)), context).toBeNull()
      for (const step of solution.steps) {
        for (const e of [step.expr, step.detail, step.before]) if (e) expect(latexProblem(toLatex(e)), `${context} (${step.kind})`).toBeNull()
      }
    }
  })

  it('erzeugt bei gleicher Nummer dieselbe Aufgabe', () => {
    for (const g of generated.slice(0, 50)) expect(taskLatex(generateFractionTask(g.ref).task)).toBe(taskLatex(g.task))
  })

  it('ist abwechslungsreich und nutzt alle Vorlagen', () => {
    const distinct = new Set(generated.map((g) => taskLatex(g.task)))
    expect(distinct.size).toBeGreaterThan(SEEDS_PER_LEVEL * 0.4)
    const used = new Set(generated.map((g) => g.template.id))
    expect([...used].sort()).toEqual(fractionTemplatesForLevel(level).map((t) => t.id).sort())
  })

  it('Ergebnis ist exakt gleichwertig zur Aufgabe und stimmt an Zahlenstellen', () => {
    for (const { task, solution, ref } of solved) {
      const context = `${formatTaskNumber(ref)}: ${taskLatex(task)} = ${toLatex(solution.result)}`
      expect(fracEquals(reducedFrac(solution.reduced), solution.value), context).toBe(true)
      // unabhängige Gegenprobe: Werte des Aufgabenterms gegen Werte des Ergebnisses
      const expr = taskExpr(task)
      const points = pointsFor([expr, solution.result], fracAtoms(solution.value), `prüfen:${ref.seed}`)
      expect(points.length, context).toBeGreaterThan(5)
      for (const env of points) expect(close(evaluate(expr, env), evaluate(solution.result, env)), `${context} bei ${JSON.stringify(env)}`).toBe(true)
    }
  })

  it('jeder Schritt hat denselben Wert wie die Aufgabe', () => {
    for (const { solution, ref } of solved) {
      for (const step of solution.steps) {
        for (const e of [step.expr, step.before]) {
          if (!e) continue
          const f = toFrac(e)
          expect(f && fracEquals(f, solution.value), `${formatTaskNumber(ref)} ${step.kind}: ${toLatex(e)}`).toBe(true)
        }
      }
    }
  })

  it('Ergebnis ist vollständig gekürzt', () => {
    for (const { task, solution, ref } of solved) {
      const context = `${formatTaskNumber(ref)}: ${taskLatex(task)} = ${toLatex(solution.result)}`
      const { num, den } = solution.reduced
      const denPoly = factoredPoly(den)
      const atoms = [...new Set([...atomsOf(num), ...atomsOf(denPoly)])]
      if (atoms.length <= 1) {
        expect(totalDegree(gcdUnivariate(num, denPoly)!), context).toBe(0)
      } else {
        for (const f of den.factors) expect(polyDivideExact(num, f.poly), context).toBeNull()
      }
      // keine gemeinsame Zahl in Zähler und Nenner
      let g = polyContent(num).n
      for (let b = den.coef.n; b !== 0n; ) [g, b] = [b, g % b]
      expect(g < 0n ? -g : g, context).toBe(1n)
    }
  })

  it('falsche Antworten sind nie richtig und sauber gesetzt', () => {
    for (const { task, solution, ref } of solved) {
      const context = `${formatTaskNumber(ref)}: ${taskLatex(task)}`
      const wrong = fractionWrongAnswers(task, solution)
      for (const w of wrong) {
        expect(latexProblem(toLatex(w.stepExpr)), `${context} ${w.rule.id}`).toBeNull()
        if (!w.value || !w.result) continue
        expect(fracEquals(w.value, solution.value), `${context} ${w.rule.id}`).toBe(false)
        expect(latexProblem(toLatex(w.result)), `${context} ${w.rule.id}`).toBeNull()
        // unabhängige Gegenprobe: an mindestens einer Stelle verschieden
        const points = pointsFor([taskExpr(task), w.result], fracAtoms(solution.value), `falsch:${ref.seed}`)
        const differs = points.some((env) => !close(evaluate(taskExpr(task), env), evaluate(w.result!, env)))
        expect(differs, `${context} ${w.rule.id}: ${toLatex(w.result)}`).toBe(true)
      }
      // im selben Schritt keine doppelten Antworten
      const keys = wrong.map((w) => `${w.step}|${toLatex(w.stepExpr)}`)
      expect(new Set(keys).size, context).toBe(keys.length)
    }
  })

  it('verbotene Zahlen machen die Aufgabe wirklich undefiniert', () => {
    for (const { task, solution, ref } of solved) {
      if (!solution.excluded) continue
      for (const r of solution.excluded) {
        expect(Number.isNaN(evaluate(taskExpr(task), { x: ratToNumber(r) })), `${formatTaskNumber(ref)}: x = ${ratToNumber(r)}`).toBe(true)
      }
    }
  })
})

it('jeder typische Fehler kommt in Aufgaben der Stufen 1 bis 4 vor', () => {
  const seen = new Set<string>()
  for (const level of LEVELS_SO_FAR) {
    for (let seed = 1; seed <= SEEDS_PER_LEVEL; seed++) {
      const { task } = generateFractionTask({ level, seed })
      for (const w of fractionWrongAnswers(task)) seen.add(w.rule.id)
    }
  }
  expect(FRACTION_ERROR_RULES.map((r) => r.id).filter((id) => !seen.has(id))).toEqual([])
})
