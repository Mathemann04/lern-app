import { describe, expect, it } from 'vitest'
import { subterms } from '../expr/compare.ts'
import { IMAG, PI, type Expr, add, cos, div, eq, exp, mul, num, pow, sin, variable } from '../expr/types.ts'
import { parseLatex } from '../parse/latex.ts'
import { solveTask } from '../rearrange/isolate.ts'
import type { Condition, RearrangeTask } from '../rearrange/task.ts'
import { absOf, derivativeOf, detOf, integralOf, lengthOf, limitOf, odeOf, seriesOf, theoremOf } from '../rearrange/tools/tool.ts'
import { REARRANGE_BLOCKS } from './blocks.ts'
import { rearrangeTaskBlocks } from './rearrangeBlocks.ts'
import { generateRearrangeTask } from './rearrangeTerms.ts'
import { LEVELS } from './taskNumber.ts'

// Bausteine einer Umstell-Aufgabe (M6 Schritt 3): abgelesen an der Aufgabe und am Rechenweg

const p = (latex: string): Expr => {
  const r = parseLatex(latex)
  if (!r.ok) throw new Error(r.message)
  return r.expr
}
const x = variable('x')
const t = variable('t')
const k = variable('k')
const a = variable('a')
const b = variable('b')
const c = variable('c')
const y = variable('y')
const n = variable('n')
const f = variable('f')

function blocksOf(lhs: Expr, rhs: Expr, conditions: readonly Condition[] = []): string[] {
  const task: RearrangeTask = { equation: eq(lhs, rhs), target: 'x', conditions }
  const solution = solveTask(task)
  if (!solution) throw new Error('nicht gelöst')
  return rearrangeTaskBlocks(task, solution)
}
const latex = (lhs: string, rhs: string, conditions: readonly Condition[] = []) => blocksOf(p(lhs), p(rhs), conditions)
const below = (rhs: Expr): Condition => ({ lhs: x, rel: '<', rhs })
const above = (rhs: Expr): Condition => ({ lhs: x, rel: '>', rhs })

describe('Bausteine einer Umstell-Aufgabe', () => {
  it('ohne Baustein: Lineare Gleichungen (Klammern, Variable mehrfach)', () => {
    expect(latex('y', '\\frac{3(x-a)}{b}+c')).toEqual(['linear'])
    expect(latex('a(x+b)', 'c(x-d)')).toEqual(['linear'])
  })

  it('Brüche: Variable im Nenner oder Doppelbruch; Wurzel ziehen gehört zu Quadrate und Potenzen', () => {
    expect(latex('\\frac{a}{x}+b', 'c')).toEqual(['brueche'])
    expect(latex('y', '\\frac{q}{p+\\frac{7}{x}}')).toEqual(['brueche'])
    // x/a = b/x: über Kreuz malnehmen, dann x² = ab und Wurzel ziehen
    expect(latex('\\frac{x}{a}', '\\frac{b}{x}')).toEqual(['brueche', 'potenzen'])
  })

  it('Wurzeln, Quadrate, e-Funktion, Logarithmus', () => {
    expect(latex('\\sqrt{x+a}', 'y')).toEqual(['wurzeln'])
    expect(latex('(x-a)^{2}', 'y', [above(a)])).toEqual(['potenzen'])
    expect(latex('e^{2x}', 'y')).toEqual(['exp'])
    expect(latex('5\\cdot 2^{x}', 'y')).toEqual(['exp'])
    expect(latex('\\ln(x+a)', 'y')).toEqual(['log'])
  })

  it('Quadratische Gleichungen: Substitution und pq-Formel im Rechenweg; ein Quadrat, das die pq-Formel löst, gehört dazu', () => {
    expect(latex('e^{2x}-ae^{x}', 'b')).toEqual(['exp', 'quadratisch'])
    expect(latex('x^{2}+ax', 'y')).toEqual(['quadratisch'])
    expect(latex('x(x+a)', 'y')).toEqual(['quadratisch'])
    // x^4 und x^2: nach der Substitution noch Wurzel ziehen
    expect(latex('x^{4}-ax^{2}', 'b')).toEqual(['potenzen', 'quadratisch'])
  })

  it('Winkel- und Hyperbelfunktionen', () => {
    expect(latex('\\sin(x)', 'y', [below(div(PI, num(2)))])).toEqual(['winkel'])
    expect(latex('\\sinh(2x)', 'y')).toEqual(['hyperbel'])
  })

  it('Werkzeuge: ihr Baustein, dazu nur, was mit der Variable in ihnen steht (nicht, was beim Ausrechnen herauskommt)', () => {
    expect(blocksOf(detOf([[x, a], [b, c]]), y)).toEqual(['det'])
    // geometrische Reihe in x: kein Baustein „Quadrate und Potenzen" für x^k und keiner „Brüche" für 1/(1 - x)
    expect(blocksOf(seriesOf(pow(x, k), num(0)), y, [below(num(1))])).toEqual(['reihen'])
    // Integral von e^t: das e gehört zum Integral (gebundene Variable t)
    expect(blocksOf(integralOf(exp(t), num(0), x), y)).toEqual(['integral'])
    // Länge eines Vektors: die Wurzel der Länge gehört zum Baustein Vektoren
    expect(blocksOf(lengthOf([x, a]), y, [above(num(0))])).toEqual(['vektoren'])
    // Ableitung: was abgeleitet wird, steht mit x da
    expect(blocksOf(derivativeOf(exp(mul(num(2), x))), y)).toEqual(['exp', 'ableitung'])
  })

  it('Logarithmus zu anderen Basen, komplexe Zahlen, Grenzwerte, Differentialgleichungen, Additionstheoreme', () => {
    expect(latex('\\log_{2}(x+a)', 'y')).toEqual(['log'])
    // Betrag einer komplexen Zahl, mit x im Nenner zusätzlich Brüche
    expect(blocksOf(absOf(add(x, mul(a, IMAG))), y, [above(num(0))])).toEqual(['komplex'])
    expect(blocksOf(absOf(div(num(1), add(x, IMAG))), y, [above(num(0))])).toEqual(['brueche', 'komplex'])
    // Grenzwert (1 + x/n)^n: die Hochzahl n ist gebunden
    expect(blocksOf(limitOf(pow(add(num(1), div(x, n)), n)), y)).toEqual(['grenzwert'])
    // Differentialgleichung f' = kf, f(0) = a, an der Stelle x
    expect(blocksOf(odeOf(mul(k, f), 1, [a]), y)).toEqual(['dgl'])
    // Additionstheorem gegen den Kosinus (Beispiel aus dem Plan): Winkelfunktionen
    expect(blocksOf(mul(b, theoremOf(sin(add(x, a)))), mul(y, cos(x)), [below(div(PI, num(2)))])).toEqual(['winkel'])
  })

  it('jede Aufgabe hat mindestens einen Baustein aus der Liste, in der Reihenfolge der Liste', () => {
    const order = REARRANGE_BLOCKS.map((block) => block.id)
    for (const level of LEVELS) {
      for (let seed = 1; seed <= 12; seed++) {
        const { task } = generateRearrangeTask({ level, seed })
        const blocks = rearrangeTaskBlocks(task, solveTask(task)!)
        expect(blocks.length, `${level}-${seed}`).toBeGreaterThan(0)
        expect([...blocks].sort((m, n) => order.indexOf(m) - order.indexOf(n)), `${level}-${seed}`).toEqual(blocks)
        // ein Werkzeug in der Aufgabe heißt sein Baustein (Stufe 5)
        const tools = [task.equation.lhs, task.equation.rhs].flatMap((side) => subterms(side)).filter((s) => s.kind === 'var' && s.tool)
        if (level === 5) expect(tools.length, `${level}-${seed}`).toBeGreaterThan(0)
      }
    }
  })
})
