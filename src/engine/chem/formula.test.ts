import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { ratToNumber } from '../rational.ts'
import { FormulaError, atomCounts, formulaCe, parseFormula } from './formula.ts'
import { atomicNumberSum, molarMass } from './molarMass.ts'
import { SUBSTANCES } from './substances.ts'

// Summenformeln lesen und Molmassen (Plan M4, Teil B „Tests", Rechnungen und Daten)

const counts = (text: string, mode = {}) => Object.fromEntries(atomCounts(parseFormula(text), mode))

describe('Summenformeln lesen', () => {
  it('zählt Atome mit Indizes, Klammern und Kristallwasser', () => {
    expect(counts('H2O')).toEqual({ H: 2, O: 1 })
    expect(counts('C2H5OH')).toEqual({ C: 2, H: 6, O: 1 })
    expect(counts('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 })
    expect(counts('Al2(SO4)3')).toEqual({ Al: 2, S: 3, O: 12 })
    expect(counts('(NH4)2SO4')).toEqual({ N: 2, H: 8, S: 1, O: 4 })
    expect(counts('CuSO4*5H2O')).toEqual({ Cu: 1, S: 1, O: 9, H: 10 })
    expect(counts('Ca3(PO4)2')).toEqual({ Ca: 3, P: 2, O: 8 })
  })

  it('zählt wie die typischen Fehler', () => {
    expect(counts('CO2', { ignoreIndices: true })).toEqual({ C: 1, O: 1 })
    expect(counts('Ca(OH)2', { bracketOnLast: true })).toEqual({ Ca: 1, O: 1, H: 2 })
    expect(counts('Al2(SO4)3', { bracketOnLast: true })).toEqual({ Al: 2, S: 1, O: 12 })
    expect(counts('CuSO4*5H2O', { withoutAdducts: true })).toEqual({ Cu: 1, S: 1, O: 4 })
  })

  it('schreibt Formeln für mhchem', () => {
    expect(formulaCe(parseFormula('Ca(OH)2'))).toBe('Ca(OH)2')
    expect(formulaCe(parseFormula('CuSO4*5H2O'))).toBe('CuSO4 * 5 H2O')
    for (const s of SUBSTANCES) expect(latexProblem(String.raw`\ce{${formulaCe(s.formula)}}`, { checkUgly: false }), s.id).toBeNull()
  })

  it('meldet Fehler verständlich', () => {
    expect(() => parseFormula('h2o')).toThrow(/Großbuchstaben/)
    expect(() => parseFormula('Ca(OH2')).toThrow(FormulaError)
    expect(() => parseFormula('CaOH)2')).toThrow(/öffnende/)
    expect(() => parseFormula('Xy2')).toThrow(/gibt es nicht/)
    expect(() => parseFormula('')).toThrow(/leer/)
    expect(() => parseFormula('H0')).toThrow(/nie 0/)
  })
})

describe('Molmassen', () => {
  it('rechnet mit dem PSE der App und mit den Werten der Aufgabe', () => {
    const cases: [string, number, number][] = [
      // Formel, PSE der App, ganze Werte (Cl 35,5; Cu 63,5)
      ['H2O', 18.0, 18],
      ['CO2', 44.0, 44],
      ['C4H10', 58.0, 58],
      ['Ca(OH)2', 74.1, 74],
      ['Al2(SO4)3', 342.3, 342],
      ['(NH4)2SO4', 132.1, 132],
      ['CuSO4*5H2O', 249.6, 249.5],
      ['NaCl', 58.5, 58.5],
      ['C6H12O6', 180.0, 180],
    ]
    for (const [text, pse, rounded] of cases) {
      expect(ratToNumber(molarMass(parseFormula(text), 'pse')), text).toBeCloseTo(pse, 9)
      expect(ratToNumber(molarMass(parseFormula(text), 'rounded')), text).toBeCloseTo(rounded, 9)
    }
  })

  it('kennt die Werte der Fehler aus dem Katalog', () => {
    expect(ratToNumber(molarMass(parseFormula('CO2'), 'rounded', { ignoreIndices: true }))).toBe(28)
    expect(ratToNumber(molarMass(parseFormula('O2'), 'rounded', { ignoreIndices: true }))).toBe(16)
    expect(ratToNumber(atomicNumberSum(parseFormula('C4H10')))).toBe(34)
    expect(ratToNumber(molarMass(parseFormula('Ca(OH)2'), 'pse', { bracketOnLast: true }))).toBeCloseTo(58.1, 9)
    expect(ratToNumber(molarMass(parseFormula('CuSO4*5H2O'), 'pse', { withoutAdducts: true }))).toBeCloseTo(159.6, 9)
  })

  it('hat für jeden Stoff eine eindeutige Formel und einen Namen', () => {
    const ids = SUBSTANCES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of SUBSTANCES) {
      expect(s.name.trim(), s.id).not.toBe('')
      expect(s.kind === 'hydrate', s.id).toBe(s.formula.adducts.length > 0)
    }
  })
})
