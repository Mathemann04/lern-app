import { describe, expect, it } from 'vitest'
import { key } from '../expr/compare.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { type Expr, eq } from '../expr/types.ts'
import { parseLatex } from '../parse/latex.ts'
import { createRng } from '../random/rng.ts'
import { generateRearrangeTask, isRearrangeLevelAvailable } from '../tasks/rearrangeTerms.ts'
import { LEVELS } from '../tasks/taskNumber.ts'
import { holds, samplePoints } from './check.ts'
import { rearrangeWrongAnswers } from './errorRules.ts'
import { STEP_NAMES, finalForm, solveEquation } from './isolate.ts'

const p = (latex: string): Expr => {
  const r = parseLatex(latex)
  if (!r.ok) throw new Error(r.message)
  return r.expr
}

// Rechenweg als lesbare Zeilen „Schritt: Gleichung"
function lines(lhs: string, rhs: string, target = 'x'): string[] {
  const solution = solveEquation(eq(p(lhs), p(rhs)), target)
  if (!solution) throw new Error('nicht gelöst')
  return solution.steps.map((s) => `${STEP_NAMES[s.kind]}: ${equationToLatex(s.after)}`)
}

describe('Rechenweg', () => {
  it('Stufe 1: von außen nach innen schälen, am Ende zu einem Bruch', () => {
    expect(lines('y', '\\frac{3(x-a)}{b}+c')).toEqual([
      'Auf beiden Seiten addieren: y - c = \\frac{3(x - a)}{b}',
      'Beide Seiten malnehmen: b(y - c) = 3(x - a)',
      'Beide Seiten teilen: \\frac{b(y - c)}{3} = x - a',
      'Auf beiden Seiten addieren: \\frac{b(y - c)}{3} + a = x',
      'Ergebnis: x = \\frac{by - bc + 3a}{3}',
    ])
  })

  it('Stufe 1: nach einem Buchstaben auflösen', () => {
    expect(lines('y', 'm(x-a)+b', 'm')).toEqual([
      'Auf beiden Seiten addieren: y - b = m(x - a)',
      'Beide Seiten teilen: \\frac{y - b}{x - a} = m',
      'Ergebnis: m = \\frac{y - b}{x - a}',
    ])
  })

  it('Stufe 2: x auf beiden Seiten', () => {
    expect(lines('a(x+b)', 'c(x-d)')).toEqual([
      'Ausmultiplizieren: ax + ab = cx - cd',
      'Variable nach links, Rest nach rechts: cx - ax = ab + cd',
      'Ausklammern: x(c - a) = ab + cd',
      'Beide Seiten teilen: x = \\frac{ab + cd}{c - a}',
    ])
  })

  it('Stufe 2: x im Nenner', () => {
    expect(lines('y', '\\frac{a}{b-x}')).toEqual([
      'Beide Seiten malnehmen: y(b - x) = a',
      'Beide Seiten teilen: b - x = \\frac{a}{y}',
      'Summand auf die andere Seite: b - \\frac{a}{y} = x',
      'Ergebnis: x = \\frac{by - a}{y}',
    ])
  })

  it('Stufe 3: x in Zähler und Nenner', () => {
    expect(lines('y', '\\frac{2x+1}{x-3}')).toEqual([
      'Beide Seiten malnehmen: y(x - 3) = 2x + 1',
      'Ausmultiplizieren: xy - 3y = 2x + 1',
      'Variable nach links, Rest nach rechts: xy - 2x = 3y + 1',
      'Ausklammern: x(y - 2) = 3y + 1',
      'Beide Seiten teilen: x = \\frac{3y + 1}{y - 2}',
    ])
  })

  it('Stufe 3: Kehrwert erst nach dem Zusammenfassen', () => {
    expect(lines('\\frac{1}{x}+\\frac{1}{a}', '\\frac{1}{b}', 'a')).toEqual([
      'Auf beiden Seiten addieren: \\frac{1}{a} = \\frac{1}{b} - \\frac{1}{x}',
      'Zu einem Bruch zusammenfassen: \\frac{1}{a} = \\frac{x - b}{bx}',
      'Kehrwert auf beiden Seiten: a = \\frac{bx}{x - b}',
    ])
  })

  it('Stufe 3: Hauptnenner in Faktoren', () => {
    expect(lines('\\frac{a}{x+b}', '\\frac{c}{x-b}')[0]).toBe('Beide Seiten malnehmen: a(x - b) = c(x + b)')
    const solution = solveEquation(eq(p('\\frac{a}{x+b}'), p('\\frac{c}{x-b}')), 'x')!
    expect(toLatex(solution.steps[0].operand!)).toBe('(x + b)(x - b)')
    expect(toLatex(solution.result)).toBe('\\frac{b(a + c)}{a - c}')
  })

  it('Stufe 3: Wurzeln', () => {
    expect(lines('y', 'a\\sqrt{b^2-x^2}')).toEqual([
      'Beide Seiten teilen: \\frac{y}{a} = \\sqrt{b^{2} - x^{2}}',
      'Beide Seiten quadrieren: \\frac{y^{2}}{a^{2}} = b^{2} - x^{2}',
      'Summand auf die andere Seite: x^{2} = b^{2} - \\frac{y^{2}}{a^{2}}',
      'Wurzel ziehen: x = \\sqrt{b^{2} - \\frac{y^{2}}{a^{2}}}',
      'Ergebnis: x = \\frac{\\sqrt{a^{2}b^{2} - y^{2}}}{a}',
    ])
    expect(lines('y', '\\sqrt{x+a}-\\sqrt{x}')).toEqual([
      'Auf beiden Seiten addieren: y + \\sqrt{x} = \\sqrt{x + a}',
      'Beide Seiten quadrieren: (y + \\sqrt{x})^{2} = x + a',
      'Ausmultiplizieren: y^{2} + 2y\\sqrt{x} + x = x + a',
      'Variable nach links, Rest nach rechts: 2y\\sqrt{x} = a - y^{2}',
      'Beide Seiten teilen: \\sqrt{x} = \\frac{a - y^{2}}{2y}',
      'Beide Seiten quadrieren: x = \\frac{(a - y^{2})^{2}}{4y^{2}}',
    ])
  })

  it('merkt sich beim Quadrieren, wann es eine Lösung gibt', () => {
    const solution = solveEquation(eq(p('y'), p('\\sqrt{x+a}-\\sqrt{x}')), 'x')!
    expect(solution.requires.map(toLatex)).toContain('\\frac{a - y^{2}}{2y}')
  })

  it('gibt auf, wenn sich die Gleichung so nicht auflösen lässt', () => {
    expect(solveEquation(eq(p('y'), p('x^2+x')), 'x')).toBeNull()
    expect(solveEquation(eq(p('y'), p('a')), 'x')).toBeNull()
  })
})

describe('Endform', () => {
  const form = (latex: string) => toLatex(finalForm(p(latex)))

  it('ein Bruch, gekürzt, Buchstaben-Faktor ausgeklammert', () => {
    expect(form('\\frac{ay^2+a}{y^2-1}')).toBe('\\frac{a(y^{2} + 1)}{y^{2} - 1}')
    expect(form('\\frac{-ab-cd}{a-c}')).toBe('\\frac{ab + cd}{c - a}')
    expect(form('a\\left(d+\\frac{b}{c}\\right)')).toBe('\\frac{a(cd + b)}{c}')
    expect(form('\\frac{a}{y}-b')).toBe('\\frac{a - by}{y}')
    expect(form('\\frac{a(1-b)}{b+3}')).toBe('\\frac{a(1 - b)}{b + 3}')
  })

  it('Wurzel und Quadrat eines Bruchs', () => {
    expect(form('\\sqrt{b^2-\\frac{y^2}{a^2}}')).toBe('\\frac{\\sqrt{a^{2}b^{2} - y^{2}}}{a}')
    expect(form('\\left(\\frac{a-y^2}{2y}\\right)^2')).toBe('\\frac{(a - y^{2})^{2}}{4y^{2}}')
  })

  it('bleibt, wie es ist, wenn es schon fertig ist', () => {
    for (const latex of ['\\frac{a(y^{2} + 1)}{y^{2} - 1}', '\\frac{\\sqrt{a^{2}b^{2} - y^{2}}}{a}', '\\frac{(a - y^{2})^{2}}{4y^{2}}', 'y - b']) {
      expect(form(latex)).toBe(latex)
    }
  })
})

describe('Zufallsaufgaben je Stufe', () => {
  const levels = LEVELS.filter(isRearrangeLevelAvailable)

  it('Stufen 1 bis 3 gibt es', () => {
    expect(levels).toEqual([1, 2, 3])
  })

  for (const level of levels) {
    it(`Stufe ${level}: Lösung und jeder Schritt durch Einsetzen geprüft, Endform fertig, falsche Antworten falsch`, () => {
      const seen = new Set<string>()
      for (let seed = 1; seed <= 300; seed++) {
        const { task } = generateRearrangeTask({ level, seed })
        const label = `${level}-${seed}: ${equationToLatex(task.equation)} nach ${task.target}`
        seen.add(label.slice(label.indexOf(':')))
        const solution = solveEquation(task.equation, task.target)
        expect(solution, label).not.toBeNull()
        const points = samplePoints(task, solution!.result, createRng(`test:${seed}`), 16, solution!.requires)
        expect(points.length, label).toBeGreaterThanOrEqual(8)
        for (const point of points) expect(holds(task.equation, point), label).toBe(true)
        for (const step of solution!.steps) {
          for (const point of points) expect(holds(step.after, point), `${label}, ${STEP_NAMES[step.kind]}`).toBe(true)
          expect(latexProblem(equationToLatex(step.after)), label).toBeNull()
        }
        expect(key(finalForm(solution!.result)), label).toBe(key(solution!.result))
        for (const wrong of rearrangeWrongAnswers(task, solution!)) {
          const wrongLabel = `${label}, ${wrong.rule.id}: ${equationToLatex(wrong.after)}`
          expect(points.filter((pt) => holds(wrong.after, pt) === true).length, wrongLabel).toBeLessThan(points.length / 2)
          expect(latexProblem(equationToLatex(wrong.after)), wrongLabel).toBeNull()
        }
      }
      expect(seen.size).toBeGreaterThanOrEqual(90)
    }, 60_000)
  }

  it('gleiche Nummer, gleiche Aufgabe', () => {
    const a = generateRearrangeTask({ level: 3, seed: 4711 })
    const b = generateRearrangeTask({ level: 3, seed: 4711 })
    expect(equationToLatex(a.task.equation)).toBe(equationToLatex(b.task.equation))
  })
})
