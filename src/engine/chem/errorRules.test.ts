import { describe, expect, it } from 'vitest'
import { findError } from '../errorCatalog.ts'
import { parseRichText } from '../explain/richText.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { formatText } from '../quantity/numberDe.ts'
import { parseDecimal, rat, ratAdd, ratDiv, ratMul, toDecimalString, type Rational } from '../rational.ts'
import type { Rng } from '../random/rng.ts'
import { elementBySymbol } from './elements.ts'
import { balance, coefficientsOf, equationCe, isBalanced, species, withCoefficients } from './equation.ts'
import { indexChanged, partly, probeStep, singleAtom } from './generators/gleichungen.ts'
import { parseFormula } from './formula.ts'
import { atomicNumberSum, molarMass } from './molarMass.ts'
import { CHEM_ERROR_RULES } from './errorRules.ts'
import { generatorsOf } from './generators/index.ts'
import { lightValues } from './generators/light.ts'
import { type Field, type Particle, wrongValues } from './generators/particles.ts'

// Katalogbeispiele der Rechenfehler (docs/PLAN-M4.md, „Katalog der Rechenfehler"): Jeder Fehler ergibt
// genau den Wert aus dem Katalog; dazu Name, Formel und eigener Text „Warum ist das falsch?".

const cl37: Particle = { el: elementBySymbol('Cl')!, a: 37, q: -1 }
const cl37atom: Particle = { ...cl37, q: 0 }

// Wert eines Fehlers in einem Schritt; given: was in der Aufgabe steht
function valueOf(t: Particle, field: Field, given: readonly Field[], rule: string): string | undefined {
  return wrongValues(t, field, new Set(given)).find((w) => w.rule === rule)?.content
}

describe('Rechenfehler: Katalogbeispiele', () => {
  it('Neutronen gleich Massenzahl: ³⁷Cl⁻ mit 37 Neutronen', () => {
    expect(valueOf(cl37, 'n', ['element', 'a', 'q'], 'chem-neutrons-mass-number')).toBe('$37$')
  })

  it('Protonen und Neutronen vertauscht: ³⁷Cl⁻ mit 20 Protonen und 17 Neutronen', () => {
    expect(valueOf(cl37, 'p', ['element', 'a', 'q'], 'chem-protons-neutrons-swapped')).toBe('$20$')
    expect(valueOf(cl37, 'n', ['element', 'a', 'q'], 'chem-protons-neutrons-swapped')).toBe('$17$')
  })

  it('Ionenladung vergessen: ³⁷Cl⁻ mit 17 Elektronen', () => {
    expect(valueOf(cl37, 'e', ['element', 'a', 'q'], 'chem-ion-charge-ignored')).toBe('$17$')
  })

  it('Ladung mit falschem Vorzeichen: ³⁷Cl⁻ mit 16 Elektronen', () => {
    expect(valueOf(cl37, 'e', ['element', 'a', 'q'], 'chem-ion-charge-sign')).toBe('$16$')
  })

  it('Massenzahl als Ordnungszahl: A = 37, Z = 17 ergibt Rubidium statt Chlor', () => {
    expect(valueOf(cl37, 'element', ['p', 'a', 'q'], 'chem-element-from-mass')).toContain(String.raw`\ce{Rb}`)
  })

  it('Elektronen statt Protonen gezählt: ³⁷Cl⁻ mit N = 37 − 18 = 19', () => {
    expect(valueOf(cl37, 'n', ['element', 'a', 'e'], 'chem-electrons-as-protons')).toBe('$19$')
  })

  it('Elektronen zur Massenzahl gezählt: 17 Protonen und 20 Neutronen ergeben A = 54', () => {
    expect(valueOf(cl37atom, 'a', ['p', 'n', 'e'], 'chem-mass-number-electrons')).toBe('$54$')
  })

  it('Nanometer nicht umgerechnet: 500 nm ergibt 3,98 · 10⁻²⁸ J statt 3,98 · 10⁻¹⁹ J', () => {
    const { correct, wrong } = lightValues('energy', 500)
    expect(formatText(correct)).toBe('3,98 · 10⁻¹⁹')
    expect(formatText(wrong.find((w) => w.rule === 'chem-light-nm')!.value)).toBe('3,98 · 10⁻²⁸')
  })

  it('Formel falsch umgestellt: E = h · λ / c', () => {
    const { wrong } = lightValues('energy', 500)
    // 6,626 · 10⁻³⁴ · 5 · 10⁻⁷ / (3 · 10⁸) ≈ 1,10 · 10⁻⁴⁸
    expect(formatText(wrong.find((w) => w.rule === 'chem-light-formula')!.value)).toBe('1,1 · 10⁻⁴⁸')
  })
})

describe('Rechenfehler Stoffmenge: Katalogbeispiele', () => {
  const f = (text: string) => parseFormula(text)
  const m = (r: Rational) => formatText(r)

  it('Index vergessen: M(CO₂) = 28 statt 44, M(O₂) = 16 statt 32 g/mol', () => {
    expect(m(molarMass(f('CO2'), 'rounded', { ignoreIndices: true }))).toBe('28')
    expect(m(molarMass(f('O2'), 'rounded', { ignoreIndices: true }))).toBe('16')
  })

  it('Koeffizient mitgerechnet: 2 C₄H₁₀ ergibt 116 statt 58 g/mol', () => {
    expect(m(ratMul(rat(2), molarMass(f('C4H10'), 'rounded')))).toBe('116')
  })

  it('Ordnungszahlen statt Molmassen: M(C₄H₁₀) = 34 g/mol', () => {
    expect(m(atomicNumberSum(f('C4H10')))).toBe('34')
  })

  it('Klammer nicht malgenommen: M(Ca(OH)₂) = 58,1 statt 74,1 g/mol', () => {
    expect(m(molarMass(f('Ca(OH)2'), 'pse', { bracketOnLast: true }))).toBe('58,1')
    expect(m(molarMass(f('Ca(OH)2'), 'pse'))).toBe('74,1')
  })

  it('Kristallwasser vergessen: M(CuSO₄ · 5 H₂O) = 159,6 statt 249,6 g/mol', () => {
    expect(m(molarMass(f('CuSO4*5H2O'), 'pse', { withoutAdducts: true }))).toBe('160')
    expect(toDecimalString(molarMass(f('CuSO4*5H2O'), 'pse', { withoutAdducts: true }))).toBe('159,6')
    expect(toDecimalString(molarMass(f('CuSO4*5H2O'), 'pse'))).toBe('249,6')
  })

  it('n = m · M und n = M : m: 5,8 g Butan ergibt 336 mol bzw. 10 mol statt 0,1 mol', () => {
    const butane = molarMass(f('C4H10'), 'rounded')
    const mass = rat(58, 10)
    expect(m(ratMul(mass, butane))).toBe('336')
    expect(m(ratDiv(butane, mass))).toBe('10')
    expect(m(ratDiv(mass, butane))).toBe('0,1')
  })

  it('m = n : M: 0,5 mol Wasser ergibt 0,0278 g statt 9 g', () => {
    const water = molarMass(f('H2O'), 'rounded')
    expect(m(ratDiv(rat(1, 2), water))).toBe('0,0278')
    expect(m(ratMul(rat(1, 2), water))).toBe('9')
  })

  it('N = n : N_A: 0,5 mol ergibt 8,3 · 10⁻²⁵; Moleküle statt Atome: 3,01 · 10²³ statt 6,02 · 10²³ H-Atome', () => {
    const na = rat(6022n * 10n ** 20n)
    expect(m(ratDiv(rat(1, 2), na))).toBe('8,3 · 10⁻²⁵')
    expect(m(ratMul(rat(1, 2), na))).toBe('3,01 · 10²³')
    expect(m(ratMul(rat(1), na))).toBe('6,02 · 10²³')
  })
})

describe('Rechenfehler Reaktionsgleichungen: Katalogbeispiele', () => {
  // Zufall, der immer das erste nimmt (für feste Beispiele)
  const first: Rng = { next: () => 0, int: (min) => min, pick: (items) => items[0], chance: () => false, shuffle: (items) => [...items] }
  const fuel = (text: string) => balance([species(text), species('O2')], [species('CO2'), species('H2O')])!

  it('Index statt Koeffizient: Mg + O₂ → MgO₂, H₂ + O₂ → H₂O₂', () => {
    expect(equationCe(indexChanged({ reactants: [species('Mg'), species('O2')], products: [species('MgO')] })!)).toBe('Mg + O2 -> MgO2')
    expect(equationCe(indexChanged({ reactants: [species('H2'), species('O2')], products: [species('H2O')] })!)).toBe('H2 + O2 -> H2O2')
  })

  it('Einzelatom statt X₂: H₂ + O → H₂O bzw. 4 H + O₂ → 2 H₂O', () => {
    const water = { reactants: [species('H2'), species('O2')], products: [species('H2O')] }
    expect(equationCe(singleAtom(water, { ...first, pick: (items) => items[1] })!)).toBe('H2 + O -> H2O')
    expect(equationCe(singleAtom(water, first)!)).toBe('4 H + O2 -> 2 H2O')
  })

  it('Nur teilweise ausgeglichen: 2 C₂H₆ + 7 O₂ → 2 CO₂ + 6 H₂O', () => {
    const correct = fuel('C2H6')
    const cs = coefficientsOf(correct)
    const eq = withCoefficients(correct, cs.map((c, i) => (i === 2 ? rat(2) : c)))
    expect(equationCe(eq)).toBe('2 C2H6 + 7 O2 -> 2 CO2 + 6 H2O')
    expect(isBalanced(eq)).toBe(false)
    expect(isBalanced(partly(correct, first)!)).toBe(false)
  })

  it('Sauerstoff falsch gezählt und Sauerstoff im Wasser vergessen', () => {
    // Butan: rechts 2 · 4 + 5 = 13 Sauerstoffatome; nicht halbiert 13 O₂ statt 13/2 O₂
    expect(equationCe(fuel('C4H10'))).toBe('2 C4H10 + 13 O2 -> 8 CO2 + 10 H2O')
    // Propan: nur der Sauerstoff im CO₂ gezählt: 6 Atome, 3 O₂ statt 5 O₂
    const propane = fuel('C3H8')
    expect(equationCe(propane)).toBe('C3H8 + 5 O2 -> 3 CO2 + 4 H2O')
    expect(isBalanced(withCoefficients(propane, coefficientsOf(propane).map((c, i) => (i === 1 ? rat(3) : c))))).toBe(false)
  })

  it('CO statt CO₂: 2 CH₄ + 3 O₂ → 2 CO + 4 H₂O', () => {
    expect(equationCe(balance([species('CH4'), species('O2')], [species('CO'), species('H2O')])!)).toBe('2 CH4 + 3 O2 -> 2 CO + 4 H2O')
  })

  it('Koeffizient bzw. Index beim Zählen vergessen: 4 Fe + 3 O₂ hat links 6, nicht 2 oder 3 O-Atome', () => {
    const rust = balance([species('Fe'), species('O2')], [species('Fe2O3')])!
    const step = probeStep(rust, first)!
    const byRule = Object.fromEntries(step.choices.map((c) => [c.errorRuleId ?? 'richtig', c.content]))
    expect(byRule).toEqual({ richtig: '$6$', 'chem-balance-count-coefficient': '$2$', 'chem-balance-count-index': '$3$' })
  })
})

describe('Rechenfehler Umsatz: Katalogbeispiele (5,8 g Butan → CO₂)', () => {
  const butane = molarMass(parseFormula('C4H10'), 'rounded')
  const co2 = molarMass(parseFormula('CO2'), 'rounded')
  const n = ratDiv(rat(58, 10), butane)
  it('richtig 0,4 mol und 17,6 g; Fehler 0,1 / 0,025 / 0,8 mol, 23,2 g, 11,2 g, 0,00909 g', () => {
    const nCO2 = ratMul(n, rat(8, 2))
    expect(formatText(nCO2)).toBe('0,4')
    expect(formatText(ratMul(nCO2, co2))).toBe('17,6')
    expect(formatText(n)).toBe('0,1')
    expect(formatText(ratMul(n, rat(2, 8)))).toBe('0,025')
    expect(formatText(ratMul(n, rat(8)))).toBe('0,8')
    expect(formatText(ratMul(nCO2, butane))).toBe('23,2')
    expect(formatText(ratMul(nCO2, molarMass(parseFormula('CO'), 'rounded')))).toBe('11,2')
    expect(formatText(ratDiv(nCO2, co2))).toBe('9,09 · 10⁻³')
  })
})

describe('Rechenfehler Umsatz: Koeffizient eines anderen Stoffs (CH₄ → CO₂, 1 : 1)', () => {
  it('ergibt 2 · n statt n, weil die 2 vor O₂ bzw. H₂O steht', () => {
    const n = rat(1, 4)
    expect(formatText(ratMul(n, rat(2)))).toBe('0,5')
    expect(formatText(n)).toBe('0,25')
  })
})

describe('Rechenfehler Gase und Lösungen: Katalogbeispiele', () => {
  const t = formatText
  it('mL statt L, c = V/n, unvollständige Molmasse', () => {
    expect(t(ratDiv(rat(1, 10), rat(200)))).toBe('5 · 10⁻⁴')
    expect(t(ratDiv(rat(1, 5), rat(1, 10)))).toBe('2')
    // NH4Cl ohne die H: 14 + 35,5
    expect(t(ratAdd(rat(14), parseDecimal('35.5')!))).toBe('49,5')
  })
  it('°C statt K und hPa statt Pa im Gasgesetz', () => {
    const v = (temp: number, pa: number) => ratMul(ratDiv(ratMul(parseDecimal('8.314')!, parseDecimal(String(temp))!), rat(pa)), rat(1000))
    expect(t(v(298.15, 101300))).toBe('24,5')
    expect(Number(t(v(25, 101300)).replace(',', '.'))).toBeCloseTo(2.05, 2)
    expect(t(v(298.15, 1013))).toBe('2450')
  })
  it('22,4 L/mol außerhalb der Normbedingungen, Massenanteil durch das Wasser, ppb, Vol-%', () => {
    expect(t(ratMul(rat(1), parseDecimal('22.4')!))).toBe('22,4')
    expect(t(ratMul(ratDiv(rat(10), rat(90)), rat(100)))).toBe('11,1')
    expect(t(ratDiv(rat(3), parseDecimal('0.1')!))).toBe('30')
    expect(t(ratDiv(parseDecimal('0.1')!, rat(3)))).toBe('0,0333')
    expect(t(ratMul(rat(40), parseDecimal('0.5')!))).toBe('20')
    expect(t(ratMul(rat(40, 100), parseDecimal('0.5')!))).toBe('0,2')
    expect(t(ratDiv(parseDecimal('0.5')!, parseDecimal('22.4')!))).toBe('0,0223')
    // Anteil nicht mit 100 % malgenommen: 10 g in 200 g
    expect(t(ratDiv(rat(10), rat(200)))).toBe('0,05')
  })
})

describe('Rechenfehler: Namen und Texte', () => {
  it('haben eindeutige Ids, stehen in der Fehlerstatistik und haben eigene Texte', () => {
    const ids = CHEM_ERROR_RULES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    const texts = new Set<string>()
    for (const rule of CHEM_ERROR_RULES) {
      expect(rule.id).toMatch(/^chem-(?!mis-)[a-z0-9-]+$/)
      expect(findError(rule.id)?.wrongFormula, rule.id).toBe(rule.wrongFormula)
      expect(latexProblem(rule.wrongFormula, { checkUgly: false }), rule.id).toBeNull()
      for (const text of [rule.name, rule.why.detailed, rule.why.short]) {
        for (const s of parseRichText(text).flat()) if (s.kind === 'math') expect(latexProblem(s.latex, { checkUgly: false }), rule.id).toBeNull()
      }
      expect(texts.has(rule.why.detailed), rule.id).toBe(false)
      texts.add(rule.why.detailed)
    }
  })

  it('kommen jeweils in einer Rechnung vor', () => {
    for (const rule of CHEM_ERROR_RULES) {
      const used = new Set([1, 2, 3].flatMap((level) => generatorsOf(rule.course, level as 1).flatMap((g) => g.errors)))
      expect(used.has(rule.id), rule.id).toBe(true)
    }
  })
})
