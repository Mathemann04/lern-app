import { describe, expect, it } from 'vitest'
import { cardById, cardsInTopic, isChemExample } from '../../explain/cards.ts'
import { GENERATED_MIN } from '../../quiz/numbers.ts'
import { atomCounts, parseFormula } from '../formula.ts'
import { IUPAC } from '../iupac.testdata.ts'
import { generatedCalc } from './index.ts'

// Gase und Lösungen (S4b): Ergebnisse auf zweitem Weg (Gleitkommazahlen, IUPAC-Werte), Katalogbeispiele,
// Zahlen der Lernkarten

const COURSE = 'chem-loesungen'
const numberOf = (latex: string) => {
  const m = /(-?\d+(?:\{,\}\d+)?)(?: \\cdot 10\^\{(-?\d+)\})?/.exec(latex)!
  return Number(m[1].replace('{,}', '.')) * 10 ** Number(m[2] ?? 0)
}
const lastNumber = (latex: string) => numberOf(latex.split(/=|\\approx/).at(-1)!)
const iupacMass = (formula: string) => [...atomCounts(parseFormula(formula))].reduce((sum, [symbol, n]) => sum + n * IUPAC[symbol], 0)
const tasks = (level: 1 | 2 | 3, count = 600) => Array.from({ length: count }, (_, i) => generatedCalc(COURSE, { level, seed: GENERATED_MIN + i })!)
const close = (a: number, b: number, tol: number, context: string) => expect(Math.abs(a / b - 1), `${context}: ${a} statt ${b}`).toBeLessThan(tol)

describe('Gase und Lösungen: auf zweitem Weg', () => {
  it('Gasgesetz: V = n R T / p mit T = ϑ + 273,15 und p in Pascal', () => {
    let seen = 0
    for (const level of [2, 3] as const) {
      for (const calc of tasks(level).filter((c) => c.form.includes(':gesetz-'))) {
        seen++
        const f = calc.task.functionLatex!
        const n = numberOf(/= ([\d{},]+)\\,\\mathrm\{mol\}/.exec(f)![1])
        const celsius = Number(/\\vartheta = (\d+)/.exec(f)![1])
        const [, p, u] = /p = ([\d{},]+)\\,\\mathrm\{(hPa|bar)\}/.exec(f)!
        const pa = numberOf(p) * (u === 'bar' ? 1e5 : 100)
        close(lastNumber(calc.task.resultLatex!), ((n * 8.314 * (celsius + 273.15)) / pa) * 1000, 0.006, f)
      }
    }
    expect(seen).toBeGreaterThan(50)
  })

  it('Lösung ansetzen: m = c · V · M, mit IUPAC-Werten höchstens 1,5 % daneben', () => {
    let seen = 0
    for (const level of [2, 3] as const) {
      for (const calc of tasks(level).filter((c) => c.form.startsWith('ansetzen:'))) {
        seen++
        const f = calc.task.functionLatex!
        const vMl = Number(/V = (\d+)\\,\\mathrm\{mL\}/.exec(f)![1])
        const c = numberOf(/c\(\\ce\{[^}]+\}\) = ([\d{},]+)/.exec(f)![1])
        close(lastNumber(calc.task.resultLatex!), c * (vMl / 1000) * iupacMass(calc.substance), 0.015, f)
      }
    }
    expect(seen).toBeGreaterThan(50)
  })

  it('Konzentration, molares Volumen und Gas aus einer Reaktion passen zu den Angaben', () => {
    for (const level of [1, 2, 3] as const) {
      for (const calc of tasks(level)) {
        const f = calc.task.functionLatex!
        const result = lastNumber(calc.task.resultLatex!)
        if (calc.form.endsWith(':c')) {
          const n = numberOf(/= ([\d{},]+)\\,\\mathrm\{mol\}/.exec(f)![1])
          const v = Number(/V = (\d+)\\,\\mathrm\{mL\}/.exec(f)![1]) / 1000
          close(result, n / v, 0.006, f)
        }
        if (calc.form.endsWith(':vm-v')) close(result, numberOf(/= ([\d{},]+)\\,\\mathrm\{mol\}/.exec(f)![1]) * 22.4, 0.006, f)
        if (calc.form.endsWith(':reaktion')) {
          // V = m / M · ν(Gas)/ν(gegeben) · 22,4 mit IUPAC-Werten
          const eq = /\\ce\{(.*?) -> (.*?)\}/.exec(f)!
          const terms = [...eq[1].split(' + '), ...eq[2].split(' + ')].map((t) => {
            const [, k = '1', formula] = /^(?:(\d+) )?(.+)$/.exec(t)!
            return { k: Number(k), formula }
          })
          const [, given, grams] = /m\(\\ce\{([^}]+)\}\) = ([\d{},]+)/.exec(f)!
          const gas = /V\(\\ce\{([^}]+)\}\)/.exec(calc.task.resultLatex!)![1]
          const nu = (x: string) => terms.find((t) => t.formula === x)!.k
          close(result, (numberOf(grams) / iupacMass(given)) * (nu(gas) / nu(given)) * 22.4, 0.015, f)
        }
      }
    }
  })
})

describe('Lernkarten „Gase und Lösungen": Zahlen wie gerechnet', () => {
  it('haben je Karte Beispiele, und die Ergebnisse stimmen', () => {
    expect(cardsInTopic(COURSE).length).toBe(8)
    const result = (id: string, i: number) => lastNumber(cardById(id)!.examples.filter(isChemExample)[i].lines.at(-1)!.latex!)
    expect(result('loesungen-konzentration', 0)).toBeCloseTo(0.5)
    expect(result('loesungen-konzentration', 1)).toBeCloseTo(0.5)
    expect(result('loesungen-ansetzen', 0)).toBeCloseTo(2.93, 2)
    expect(result('loesungen-ansetzen', 1)).toBeCloseTo(4)
    expect(result('loesungen-massenanteil', 0)).toBeCloseTo(10)
    expect(result('loesungen-massenanteil', 1)).toBeCloseTo(2)
    expect(result('loesungen-massenkonzentration', 0)).toBeCloseTo(20)
    expect(result('loesungen-massenkonzentration', 1)).toBeCloseTo(4.5)
    expect(result('loesungen-ppm', 1)).toBeCloseTo(100)
    expect(result('loesungen-volumenanteil', 0)).toBeCloseTo(84)
    expect(result('loesungen-volumenanteil', 1)).toBeCloseTo(0.2)
    expect(result('loesungen-molvolumen', 0)).toBeCloseTo(11.2)
    expect(result('loesungen-molvolumen', 1)).toBeCloseTo(2)
    expect(result('loesungen-gasgesetz', 0)).toBeCloseTo((8.314 * 298.15) / 101.3, 1)
    expect(result('loesungen-gasgesetz', 1)).toBeCloseTo((2 * 8.314 * 373.15) / 200, 0)
    // NaCl: 0,05 mol · 58,5 g/mol
    expect(0.05 * 58.5).toBeCloseTo(2.925)
  })
})
