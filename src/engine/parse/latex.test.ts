import { describe, expect, it } from 'vitest'
import { derive, allNodes } from '../derive/derive.ts'
import { wrongAnswers } from '../derive/errorRules.ts'
import { closeEnough } from '../expr/arbitraries.ts'
import { evaluate } from '../expr/evaluate.ts'
import { toLatex } from '../expr/print.ts'
import { samplePoints } from '../expr/sample.ts'
import { type Expr, E, PI, add, cos, div, exp, fn, ln, log, mul, neg, num, pow, root, sin, sqrt, x } from '../expr/types.ts'
import { createRng } from '../random/rng.ts'
import { generateDerivativeTask } from '../tasks/derivativeTerms.ts'
import { LEVELS } from '../tasks/taskNumber.ts'
import { parseLatex } from './latex.ts'

function parsed(latex: string): Expr {
  const result = parseLatex(latex)
  if (!result.ok) throw new Error(`${latex}: ${result.message}`)
  return result.expr
}

// Gleicher Wert an einigen Stellen, an denen beide definiert sind
function expectSameValue(actual: Expr, expected: Expr, context: string) {
  const points = samplePoints([expected], createRng(context), 12)
  expect(points.length, context).toBeGreaterThan(0)
  for (const p of points) {
    const a = evaluate(actual, p)
    const b = evaluate(expected, p)
    expect(closeEnough(a, b), `${context} bei x = ${p.x}: ${a} statt ${b}`).toBe(true)
  }
}

describe('Leser für die Mathe-Tastatur', () => {
  it.each<[string, Expr]>([
    // Ausgaben von MathLive beim Tippen
    ['2x^2+3x', add(mul(num(2), pow(x, num(2))), mul(num(3), x))],
    ['\\sin\\left(3x\\right)', sin(mul(num(3), x))],
    ['\\sin x', sin(x)],
    ['e^{-3x}', exp(mul(num(-3), x))],
    ['\\frac{1}{x}', div(num(1), x)],
    ['\\sqrt{\\left(x\\right)}', sqrt(x)],
    ['0{,}5x', mul(num(1, 2), x)],
    ['0.5x', mul(num(1, 2), x)],
    ['\\ln\\left(x^2+1\\right)', ln(add(pow(x, num(2)), num(1)))],
    ['2\\cdot x', mul(num(2), x)],
    ['2\\times x', mul(num(2), x)],
    ['\\left(x+1\\right)\\left(x-1\\right)', mul(add(x, num(1)), add(x, num(-1)))],
    ['x^{\\left(\\frac12\\right)}', sqrt(x)],
    ['\\cos\\left(x\\right)^2', pow(cos(x), num(2))],
    ['\\pi x', mul(PI, x)],
    ['\\arctan\\left(x\\right)', fn('arctan', x)],
    ['x^3-\\frac{2}{x}', add(pow(x, num(3)), neg(div(num(2), x)))],
    ['3e^{\\left(2x\\right)}', mul(num(3), exp(mul(num(2), x)))],
    ['\\mleft(x+1\\mright)^2', pow(add(x, num(1)), num(2))],
    // Funktionen ohne Klammer, wie im Skript
    ['\\sin 3x', sin(mul(num(3), x))],
    ['\\sin x^2', sin(pow(x, num(2)))],
    ['\\sin^2 x', pow(sin(x), num(2))],
    ['\\sin^{2}\\left(3x\\right)', pow(sin(mul(num(3), x)), num(2))],
    ['x\\sin x\\cos x', mul(x, sin(x), cos(x))],
    ['\\ln x+1', add(ln(x), num(1))],
    ['\\sin\\frac{x}{2}', sin(div(x, num(2)))],
    // Brüche, Wurzeln, Logarithmen
    ['\\frac12x', mul(num(1, 2), x)],
    ['\\sqrt[3]{x^2}', root(pow(x, num(2)), 3)],
    ['\\log_2 x', log(num(2), x)],
    ['\\log_{10}\\left(x^2+1\\right)', log(num(10), add(pow(x, num(2)), num(1)))],
    ['\\lg x', log(num(10), x)],
    ['\\operatorname{arsinh}\\left(2x\\right)', fn('arsinh', mul(num(2), x))],
    ['\\mathrm{e}^x', exp(x)],
    ['\\exponentialE^{x}', exp(x)],
    // Vorzeichen und Rechenzeichen
    ['-x^2', neg(pow(x, num(2)))],
    ['-2x+5', add(neg(mul(num(2), x)), num(5))],
    ['2\\cdot-3x', mul(num(2), neg(num(3)), x)],
    ['1/x', div(num(1), x)],
    ['6x \\div 2', div(mul(num(6), x), num(2))],
    ['x^{-2}', pow(x, num(-2))],
    ['x^-2', pow(x, num(-2))],
    ['2,5x^{1{,}5}', mul(num(5, 2), pow(x, num(3, 2)))],
    ['E', E],
    // „f'(x) =" davor ist erlaubt
    ["f'(x)=2x", mul(num(2), x)],
    ["f^{\\prime}\\left(x\\right)=2x", mul(num(2), x)],
    ["y' = \\cos x", cos(x)],
  ])('%s', (latex, expected) => {
    // „E" ist ein Großbuchstabe, also eine Variable, keine eulersche Zahl
    if (latex === 'E') {
      expect(parsed(latex)).toEqual({ kind: 'var', name: 'E' })
      return
    }
    expectSameValue(parsed(latex), expected, latex)
  })

  it('merkt sich Dezimalzahlen als Dezimalzahlen', () => {
    expect(parsed('0{,}25')).toEqual({ kind: 'num', value: { n: 1n, d: 4n }, decimal: true })
  })

  it.each<[string, RegExp]>([
    ['', /Gib zuerst/],
    ['   ', /Gib zuerst/],
    ['2x+', /Nach „\+" fehlt/],
    ['2x-', /Nach „−" fehlt/],
    ['2\\cdot', /Nach \$\\cdot\$ fehlt/],
    ['\\left(x+1', /Klammer ist nicht geschlossen/],
    ['x+1)', /Klammer zu viel/],
    // so tippt MathLive „(…)/(…)" manchmal: die schließende Klammer bleibt im Zähler
    ['\\frac{-\\sin\\left(x\\right)\\cdot2x)}{\\left(x^2\\right)^2}', /Klammer zu viel/],
    ['()', /Klammer ist leer/],
    ['\\frac{1}{\\placeholder{}}', /Feld ist noch leer/],
    ['x^{}', /Feld ist noch leer/],
    ['\\sin', /fehlt das Argument/],
    ['\\sin+x', /fehlt das Argument/],
    ['\\sin^{-1}x', /arcsin/],
    ['\\log x', /\\ln/],
    ['|x|', /Betragsstriche/],
    ['\\alpha x', /kenne ich nicht/],
    ['2x=3', /nach \$f'\(x\) =\$/],
    ["f''(x)'", /Ableitungsstriche/],
    [',5', /Vor dem Komma/],
  ])('meldet verständlich: %s', (latex, message) => {
    const result = parseLatex(latex)
    expect(result.ok, latex).toBe(false)
    if (!result.ok) expect(result.message).toMatch(message)
  })
})

describe('Rundreise: eigene Ausgabe wieder einlesen', () => {
  // Alles, was die App anzeigt (Aufgaben, Lösungen, eingesetzte Formeln, falsche Ergebnisse),
  // muss sich wieder einlesen lassen und denselben Wert haben
  it.each(LEVELS)('Stufe %i', (level) => {
    for (let seed = 1; seed <= 60; seed++) {
      const { task } = generateDerivativeTask({ level, seed })
      if (task.kind !== 'function') continue
      const root = derive(task.expr)
      const terms = [
        task.expr,
        root.result,
        ...allNodes(root).filter((n) => n.variable === 'x').map((n) => n.formula),
        ...wrongAnswers(task.expr, root).map((w) => w.result),
      ]
      for (const term of terms) {
        const latex = toLatex(term)
        expectSameValue(parsed(latex), term, `${level}-${seed}: ${latex}`)
      }
    }
  })
})
