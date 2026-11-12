import { describe, expect, it } from 'vitest'
import { key } from '../expr/compare.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { equationToLatex, toLatex } from '../expr/print.ts'
import { type Expr, PI, div, eq, num, variable } from '../expr/types.ts'
import { parseLatex } from '../parse/latex.ts'
import { createRng } from '../random/rng.ts'
import { generateRearrangeTask, isRearrangeLevelAvailable } from '../tasks/rearrangeTerms.ts'
import { FORMULA_TASKS } from '../tasks/formulas.ts'
import { familyBlocks } from '../tasks/rearrangeFamilies.ts'
import { LEVELS, blockSeed, formatTaskNumber } from '../tasks/taskNumber.ts'
import { holds, samplePoints, withSubstitution } from './check.ts'
import { rearrangeWrongAnswers } from './errorRules.ts'
import { STEP_NAMES, finalForm, solveEquation, solveTask, stepEquationLatex, stepLabel } from './isolate.ts'
import type { Condition } from './task.ts'

const p = (latex: string): Expr => {
  const r = parseLatex(latex)
  if (!r.ok) throw new Error(r.message)
  return r.expr
}

// Rechenweg als lesbare Zeilen „Schritt: Gleichung"
function lines(lhs: string, rhs: string, target = 'x', conditions: readonly Condition[] = []): string[] {
  const solution = solveEquation(eq(p(lhs), p(rhs)), target, { conditions })
  if (!solution) throw new Error('nicht gelöst')
  return solution.steps.map((s) => `${STEP_NAMES[s.kind]}: ${stepEquationLatex(s.kind, s.after)}`)
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
    expect(solveEquation(eq(p('y'), p('x^3+x')), 'x')).toBeNull()
    expect(solveEquation(eq(p('y'), p('a')), 'x')).toBeNull()
  })
})

const half: Condition[] = [{ lhs: variable('x'), rel: '<', rhs: div(PI, num(2)) }]

describe('Rechenweg Stufe 4, Teil 6c: Substitution und pq-Formel', () => {
  it('e^{2x} und e^x: substituieren, alles nach links, pq-Formel, Scheinlösung verwerfen, zurück einsetzen', () => {
    expect(lines('e^{2x}-ae^{x}', 'b')).toEqual([
      'Substituieren: u^{2} - au = b',
      'Alles auf eine Seite: u^{2} - au - b = 0',
      'pq-Formel anwenden: u_{1,2} = \\frac{a}{2} \\pm \\sqrt{\\frac{a^{2}}{4} + b}',
      'Passende Lösung wählen: u = \\frac{a}{2} + \\sqrt{\\frac{a^{2}}{4} + b}',
      'Zurück einsetzen: e^{x} = \\frac{a}{2} + \\sqrt{\\frac{a^{2}}{4} + b}',
      'Zu einem Bruch zusammenfassen: e^{x} = \\frac{a + \\sqrt{a^{2} + 4b}}{2}',
      'Logarithmieren: x = \\ln\\left(\\frac{a + \\sqrt{a^{2} + 4b}}{2}\\right)',
    ])
  })

  it('Anzeige nach dem Substituieren (Schritt 9): \\frac{a}{u} statt a \\cdot \\frac{1}{u}, nach dem Malnehmen gekürzt', () => {
    expect(lines('e^{x}-ae^{-x}', 'y').slice(0, 3)).toEqual(['Substituieren: u - \\frac{a}{u} = y', 'Beide Seiten malnehmen: u^{2} - a = uy', 'Alles auf eine Seite: u^{2} - yu - a = 0'])
    // Bruch als Vorzahl: \frac{a}{2}e^{-x} wird \frac{a}{2u}, nach dem Malnehmen mit 2u steht au^2 da
    const half = lines('\\frac{a}{2}e^{x}+\\frac{a}{2}e^{-x}', 'y')
    expect(half[0]).toBe('Substituieren: \\frac{a}{2}u + \\frac{a}{2u} = y')
    expect(half[1]).toBe('Beide Seiten malnehmen: au^{2} + a = 2uy')
  })

  it('e^x und e^{-x}: mit u malnehmen; die negative Lösung fällt weg, weil e^x positiv ist', () => {
    const solution = solveEquation(eq(p('y'), p('\\frac{e^{x}-e^{-x}}{2}')), 'x')!
    expect(toLatex(solution.result)).toBe('\\ln(y + \\sqrt{y^{2} + 1})')
    expect(solution.substitution?.name).toBe('u')
    const choose = solution.steps.find((s) => s.kind === 'choose')!
    expect(choose.reason).toBe('negative')
    expect(toLatex(choose.operand!)).toBe('y - \\sqrt{y^{2} + 1}')
    expect(solution.requires.map(toLatex)).toContain('y^{2} + 1')
  })

  it('e^x + e^{-x}: beide Lösungen positiv, x > 0 entscheidet', () => {
    const solution = solveEquation(eq(p('\\frac{e^{x}+e^{-x}}{2}'), p('y')), 'x')!
    expect(toLatex(solution.result)).toBe('\\ln(y + \\sqrt{y^{2} - 1})')
    expect(solution.steps.find((s) => s.kind === 'choose')!.reason).toBe('targetNegative')
  })

  it('zwei Logarithmen: danach quadratisch in x, ohne Substitution', () => {
    expect(lines('\\log_{a}x+\\log_{a}(x+b)', 'c')).toEqual([
      'Logarithmen zusammenfassen: \\log_{a}(x(x + b)) = c',
      'e hoch beide Seiten: x(x + b) = a^{c}',
      'Ausmultiplizieren: x^{2} + bx = a^{c}',
      'Alles auf eine Seite: x^{2} + bx - a^{c} = 0',
      'pq-Formel anwenden: x_{1,2} = -\\frac{b}{2} \\pm \\sqrt{\\frac{b^{2}}{4} + a^{c}}',
      'Passende Lösung wählen: x = -\\frac{b}{2} + \\sqrt{\\frac{b^{2}}{4} + a^{c}}',
      'Ergebnis: x = \\frac{\\sqrt{b^{2} + 4a^{c}} - b}{2}',
    ])
  })

  it('Zahl vor u^2: erst durch sie teilen (Normalform)', () => {
    expect(lines('2e^{2x}-3ye^{x}', '2').slice(1, 4)).toEqual([
      'Alles auf eine Seite: 2u^{2} - 3yu - 2 = 0',
      'Normalform herstellen: u^{2} - \\frac{3y}{2}u - 1 = 0',
      'pq-Formel anwenden: u_{1,2} = \\frac{3y}{4} \\pm \\sqrt{\\frac{9y^{2}}{16} + 1}',
    ])
  })

  it('x und √x, x^4 und x^2, cos^2 x und sin x', () => {
    expect(toLatex(solveEquation(eq(p('x-a\\sqrt{x}'), p('b')), 'x')!.result)).toBe('\\frac{(a + \\sqrt{a^{2} + 4b})^{2}}{4}')
    expect(toLatex(solveEquation(eq(p('x^4-ax^2'), p('b')), 'x')!.result)).toBe('\\sqrt{\\frac{a + \\sqrt{a^{2} + 4b}}{2}}')
    const trig = lines('\\cos^2x', 'a\\sin x', 'x', half)
    expect(trig[0]).toBe('Quadrat ersetzen: 1 - \\sin^{2} x = a\\sin x')
    expect(trig[1]).toBe('Substituieren: 1 - u^{2} = au')
    expect(trig.at(-1)).toBe('Umkehrfunktion auf beiden Seiten: x = \\arcsin\\left(\\frac{\\sqrt{a^{2} + 4} - a}{2}\\right)')
  })

  it('Wurzel mit Zahl im Nenner: so erweitert, dass der Nenner ein Quadrat ist', () => {
    expect(toLatex(solveEquation(eq(p('y'), p('3x(x+7)')), 'x')!.result)).toBe('\\frac{\\sqrt{12y + 441} - 21}{6}')
  })
})

describe('Rechenweg Stufe 4, Teil 6b: Winkel- und Hyperbelfunktionen, Umkehrfunktionen', () => {
  it('sin x und cos x in Zähler und Nenner: durch cos x teilen, nach tan x auflösen', () => {
    expect(lines('\\frac{\\sin x+\\cos x}{\\sin x-\\cos x}', 'y')).toEqual([
      'Durch den Kosinus teilen: \\frac{\\tan x + 1}{\\tan x - 1} = y',
      'Beide Seiten malnehmen: \\tan x + 1 = y(\\tan x - 1)',
      'Ausmultiplizieren: \\tan x + 1 = y\\tan x - y',
      'Variable nach links, Rest nach rechts: y\\tan x - \\tan x = y + 1',
      'Ausklammern: (y - 1)\\tan x = y + 1',
      'Beide Seiten teilen: \\tan x = \\frac{y + 1}{y - 1}',
      'Umkehrfunktion auf beiden Seiten: x = \\arctan\\left(\\frac{y + 1}{y - 1}\\right)',
    ])
  })

  it('sin² x und cos² x: ein Quadrat mit sin² x + cos² x = 1 ersetzen, dann Wurzel und Umkehrfunktion', () => {
    const steps = lines('y', 'a\\cos^2x+b\\sin^2x')
    expect(steps[0]).toBe('Quadrat ersetzen: y = a\\cos^{2} x + b(1 - \\cos^{2} x)')
    expect(steps.slice(-3)).toEqual([
      'Beide Seiten teilen: \\cos^{2} x = \\frac{y - b}{a - b}',
      'Wurzel ziehen: \\cos x = \\sqrt{\\frac{y - b}{a - b}}',
      'Umkehrfunktion auf beiden Seiten: x = \\arccos\\left(\\sqrt{\\frac{y - b}{a - b}}\\right)',
    ])
  })

  it('Hyperbelfunktionen: cosh² x = 1 + sinh² x, cosh x = a sinh x wird tanh x', () => {
    expect(lines('a\\cosh^2x-b\\sinh^2x', 'y')[0]).toBe('Quadrat ersetzen: a\\cosh^{2} x - b(\\cosh^{2} x - 1) = y')
    expect(lines('\\cosh x', 'a\\sinh x')).toEqual([
      'Durch den Kosinus teilen: 1 = a\\tanh x',
      'Beide Seiten teilen: \\frac{1}{a} = \\tanh x',
      'Umkehrfunktion auf beiden Seiten: \\operatorname{artanh}\\left(\\frac{1}{a}\\right) = x',
      'Ergebnis: x = \\operatorname{artanh}\\left(\\frac{1}{a}\\right)',
    ])
  })

  it('Umkehrfunktion um einen Kern: tan auf beiden Seiten, dann x in Zähler und Nenner', () => {
    const steps = lines('\\arctan\\left(\\frac{x+a}{x-b}\\right)', 'c')
    expect(steps[0]).toBe('Funktion auf beiden Seiten: \\frac{x + a}{x - b} = \\tan c')
    expect(steps.at(-1)).toBe('Beide Seiten teilen: x = \\frac{b\\tan c + a}{\\tan c - 1}')
  })

  it('kx in der Funktion: erst die Umkehrfunktion, dann teilen; die andere Seite vorher zu einem Bruch', () => {
    expect(lines('\\sin(2x)', '\\frac{y}{a}-b')).toEqual([
      'Zu einem Bruch zusammenfassen: \\sin(2x) = \\frac{y - ab}{a}',
      'Umkehrfunktion auf beiden Seiten: 2x = \\arcsin\\left(\\frac{y - ab}{a}\\right)',
      'Beide Seiten teilen: x = \\frac{\\arcsin\\left(\\frac{y - ab}{a}\\right)}{2}',
    ])
  })
})

// Winkel y zwischen Vektoren: spitz, also y < \frac{\pi}{2}
const acute: Condition[] = [{ lhs: variable('y'), rel: '<', rhs: div(PI, num(2)) }]

describe('Rechenweg Stufe 5, Teil 8b: Winkel zwischen Vektoren (spitzer Winkel als Buchstabe)', () => {
  const solveAcute = (lhs: string) => solveEquation(eq(p(lhs), p('y')), 'x', { conditions: acute })!

  it('nach dem Ausklammern 1 - cos² y durch sin² y ersetzen, das Ergebnis mit tan y', () => {
    expect(lines('\\arccos\\left(\\frac{x}{\\sqrt{x^2+a^2+b^2}}\\right)', 'y', 'x', acute)).toEqual([
      'Funktion auf beiden Seiten: \\frac{x}{\\sqrt{x^{2} + a^{2} + b^{2}}} = \\cos y',
      'Beide Seiten malnehmen: x = \\cos y \\cdot \\sqrt{x^{2} + a^{2} + b^{2}}',
      'Beide Seiten quadrieren: x^{2} = \\cos^{2} y \\cdot (x^{2} + a^{2} + b^{2})',
      'Ausmultiplizieren: x^{2} = x^{2}\\cos^{2} y + a^{2}\\cos^{2} y + b^{2}\\cos^{2} y',
      'Variable nach links, Rest nach rechts: x^{2} - \\cos^{2} y \\cdot x^{2} = a^{2}\\cos^{2} y + b^{2}\\cos^{2} y',
      'Ausklammern: x^{2}(1 - \\cos^{2} y) = a^{2}\\cos^{2} y + b^{2}\\cos^{2} y',
      'Quadrat ersetzen: x^{2}\\sin^{2} y = a^{2}\\cos^{2} y + b^{2}\\cos^{2} y',
      'Beide Seiten teilen: x^{2} = \\frac{a^{2}\\cos^{2} y + b^{2}\\cos^{2} y}{\\sin^{2} y}',
      'Wurzel ziehen: x = \\sqrt{\\frac{a^{2}\\cos^{2} y + b^{2}\\cos^{2} y}{\\sin^{2} y}}',
      'Ergebnis: x = \\frac{\\sqrt{a^{2} + b^{2}}}{\\tan y}',
    ])
  })

  it('andere Vektoren: zwei Einträge, 2x, Länge mit √2, arcsin, x nur im Nenner', () => {
    expect(toLatex(solveAcute('\\arccos\\left(\\frac{x}{\\sqrt{x^2+a^2}}\\right)').result)).toBe('\\frac{a}{\\tan y}')
    expect(toLatex(solveAcute('\\arccos\\left(\\frac{2x}{\\sqrt{4x^2+a^2}}\\right)').result)).toBe('\\frac{a}{2\\tan y}')
    expect(toLatex(solveAcute('\\arccos\\left(\\frac{2x}{\\sqrt{4x^2+2a^2}}\\right)').result)).toBe('\\frac{a}{\\sqrt{2}\\tan y}')
    expect(toLatex(solveAcute('\\arcsin\\left(\\frac{x}{\\sqrt{x^2+a^2}}\\right)').result)).toBe('a\\tan y')
    expect(toLatex(solveAcute('\\arccos\\left(\\frac{a}{\\sqrt{x^2+a^2}}\\right)').result)).toBe('a\\tan y')
  })

  it('Texte: die Vorzahl steht vorn', () => {
    const s = solveAcute('\\arccos\\left(\\frac{2x}{\\sqrt{4x^2+a^2}}\\right)')
    const step = (kind: string) => s.steps.find((x) => x.kind === kind)!
    expect(stepEquationLatex('pythagoras', step('pythagoras').after)).toBe('4x^{2}\\sin^{2} y = a^{2}\\cos^{2} y')
    expect(stepLabel(step('pythagoras'), 'x')).toBe('$4 - 4\\cos^{2} y = 4\\sin^{2} y$ einsetzen')
    expect(stepLabel(step('finish'), 'x')).toBe('Mit $\\tan y = \\frac{\\sin y}{\\cos y}$ zusammenfassen')
  })

  it('jeder Schritt durch Einsetzen geprüft', () => {
    for (const lhs of ['\\arccos\\left(\\frac{x}{\\sqrt{x^2+a^2+b^2}}\\right)', '\\arccos\\left(\\frac{2x}{\\sqrt{4x^2+2a^2}}\\right)', '\\arccos\\left(\\frac{a}{\\sqrt{x^2+a^2}}\\right)']) {
      const task = { equation: eq(p(lhs), p('y')), target: 'x', conditions: acute }
      const solution = solveTask(task)!
      const points = samplePoints(task, solution.result, createRng(`spitz:${lhs}`), 24, solution.requires)
      expect(points.length, lhs).toBeGreaterThanOrEqual(16)
      for (const step of [{ after: task.equation }, ...solution.steps]) for (const point of points) expect(holds(step.after, point), lhs).toBe(true)
    }
  })

  it('ohne die Bedingung y < π/2 bleibt der Rechenweg wie bisher', () => {
    const steps = lines('\\arccos\\left(\\frac{x}{\\sqrt{x^2+a^2}}\\right)', 'y')
    expect(steps.some((line) => line.startsWith('Quadrat ersetzen'))).toBe(false)
    expect(steps.at(-1)).toBe('Wurzel ziehen: x = \\sqrt{\\frac{a^{2}\\cos^{2} y}{1 - \\cos^{2} y}}')
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

  it('Stufen 1 bis 5 gibt es', () => {
    expect(levels).toEqual([1, 2, 3, 4, 5])
  })

  for (const level of levels) {
    it(`Stufe ${level}: Lösung und jeder Schritt durch Einsetzen geprüft, Endform fertig, falsche Antworten falsch`, () => {
      const seen = new Set<string>()
      // dazu je Baustein mit eigenen Aufgaben (M6 Schritt 4) und alle Formeln der Stufe (4b-1) zwölf Nummern wie „exp.1-4711"
      const seeds = [...Array.from({ length: 300 }, (_, i) => i + 1), ...familyBlocks(level).flatMap((block) => Array.from({ length: 12 }, (_, i) => blockSeed(block, i + 1))), ...FORMULA_TASKS.flatMap((task, i) => (task.level === level ? [blockSeed('formel', i + 1)] : []))]
      for (const seed of seeds) {
        const { task } = generateRearrangeTask({ level, seed })
        const label = `${formatTaskNumber({ level, seed })}: ${equationToLatex(task.equation)} nach ${task.target}`
        seen.add(label.slice(label.indexOf(':')))
        const solution = solveTask(task)
        expect(solution, label).not.toBeNull()
        // nach einer Substitution stehen Gleichungen in u dazwischen: Prüfstellen mit u = e^x
        const points = withSubstitution(samplePoints(task, solution!.result, createRng(`test:${seed}`), 16, solution!.requires), solution!.substitution)
        expect(points.length, label).toBeGreaterThanOrEqual(8)
        for (const point of points) expect(holds(task.equation, point), label).toBe(true)
        for (const step of solution!.steps) {
          for (const point of points) expect(holds(step.after, point), `${label}, ${STEP_NAMES[step.kind]}`).toBe(true)
          expect(latexProblem(stepEquationLatex(step.kind, step.after)), label).toBeNull()
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
