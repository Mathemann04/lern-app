import { describe, expect, it } from 'vitest'
import { cardById, isChemExample } from '../../explain/cards.ts'
import { GENERATED_MIN } from '../../quiz/numbers.ts'
import { ratAdd, ratEq, ratMul, ZERO } from '../../rational.ts'
import { balance } from '../equation.ts'
import { atomCounts, parseFormula } from '../formula.ts'
import { IUPAC } from '../iupac.testdata.ts'
import { molarMass } from '../molarMass.ts'
import { CO2, FUELS, H2O, O2, REACTIONS } from '../reactions.ts'
import { generatedCalc } from './index.ts'

// Umsatz (S4a): Ergebnis auf zweitem Weg (direkte Formel), Massenerhaltung, Katalogbeispiele, Lernkarte

const COURSE = 'chem-stoffmenge'
const numberOf = (latex: string) => {
  const m = /(-?\d+(?:\{,\}\d+)?)(?: \\cdot 10\^\{(-?\d+)\})?/.exec(latex)!
  return Number(m[1].replace('{,}', '.')) * 10 ** Number(m[2] ?? 0)
}
const lastNumber = (latex: string) => numberOf(latex.split(/=|\\approx/).at(-1)!)
const iupacMass = (formula: string) => [...atomCounts(parseFormula(formula))].reduce((sum, [symbol, n]) => sum + n * IUPAC[symbol], 0)

const ALL = [...REACTIONS.map((r) => balance(r.reactants, r.products)!), ...FUELS.map((f) => balance([f.species, O2], [CO2, H2O])!)]

describe('Umsatz: Massenerhaltung', () => {
  it.each(['pse', 'rounded'] as const)('Summe der Massen links = rechts (Werte %s)', (values) => {
    for (const eq of ALL) {
      const side = (s: typeof eq.reactants) => s.reduce((sum, t) => ratAdd(sum, ratMul(t.coefficient, molarMass(t.species.formula, values))), ZERO)
      expect(ratEq(side(eq.reactants), side(eq.products)), JSON.stringify(eq.reactants.map((t) => t.species.text))).toBe(true)
    }
  })
})

describe('Umsatz: Ergebnis auf zweitem Weg', () => {
  it.each([1, 2, 3] as const)('Stufe %i: m(gesucht) = m(gegeben) / M(gegeben) · ν(gesucht)/ν(gegeben) · M(gesucht)', (level) => {
    let seen = 0
    for (let i = 0; i < 600; i++) {
      const calc = generatedCalc(COURSE, { level, seed: GENERATED_MIN + i })!
      if (!calc.form.startsWith('umsatz:')) continue
      seen++
      const latex = calc.task.functionLatex!
      const eq = /\\ce\{(.*?) -> (.*?)\}/.exec(latex)!
      const terms = (side: string) =>
        side.split(' + ').map((t) => {
          const [, c = '1', f] = /^(?:(\d+) )?(.+)$/.exec(t)!
          return { c: Number(c), f }
        })
      const all = [...terms(eq[1]), ...terms(eq[2])]
      const [, givenF, givenM] = /m\(\\ce\{([^}]+)\}\) = ([\d{},]+)\\,\\mathrm\{g\}/.exec(latex)!
      const targetF = /\\qquad m\(\\ce\{([^}]+)\}\) = \\,\?/.exec(latex)![1]
      const nu = (f: string) => all.find((t) => t.f === f)!.c
      // mit den genaueren IUPAC-Werten: höchstens 1,5 % daneben (gerundete Werte und Zwischenwerte)
      const expected = (numberOf(givenM) / iupacMass(givenF)) * (nu(targetF) / nu(givenF)) * iupacMass(targetF)
      const shown = lastNumber(calc.task.resultLatex!)
      expect(Math.abs(shown / expected - 1), `${latex} → ${calc.task.resultLatex}`).toBeLessThan(0.015)
      // die Aufgabe nennt die Werte, mit denen sie rechnet
      expect(calc.task.note).toMatch(/M\(\\ce\{/)
    }
    expect(seen).toBeGreaterThan(80)
  })

  it('verwendet nie die Zahlen der Altklausuren (Ethan 6 g, Propan 4,4 g)', () => {
    for (const level of [1, 2, 3] as const) {
      for (let i = 0; i < 2000; i++) {
        const latex = generatedCalc(COURSE, { level, seed: GENERATED_MIN + i })!.task.functionLatex ?? ''
        expect(latex).not.toContain(String.raw`m(\ce{C2H6}) = 6\,\mathrm{g}`)
        expect(latex).not.toContain(String.raw`m(\ce{C3H8}) = 4{,}4\,\mathrm{g}`)
      }
    }
  })
})

describe('Umsatz: Lernkarte', () => {
  it('stimmen mit der Lernkarte überein', () => {
    const results = cardById('stoffmenge-umsatz')!
      .examples.filter(isChemExample)
      .map((e) => lastNumber(e.lines.at(-1)!.latex!))
    expect(results).toEqual([17.6, 16])
  })
})

describe('Umsatz: Verhältnis 1 : 1 kommt vor', () => {
  it('mit dem Koeffizienten eines anderen Stoffs als falscher Antwort', () => {
    let oneToOne = 0
    for (const level of [1, 2, 3] as const) {
      for (let i = 0; i < 1500; i++) {
        const calc = generatedCalc(COURSE, { level, seed: GENERATED_MIN + i })!
        const step = calc.task.steps.find((s) => s.id === 'verhaeltnis')
        if (!step || !/\\frac\{1\}\{1\}|\\frac\{(\d+)\}\{\1\}/.test(String(step.established))) continue
        oneToOne++
        expect(step.choices.some((c) => c.errorRuleId === 'chem-ratio-other-coefficient')).toBe(true)
      }
    }
    expect(oneToOne).toBeGreaterThan(20)
  })
})

