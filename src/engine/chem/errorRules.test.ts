import { describe, expect, it } from 'vitest'
import { findError } from '../errorCatalog.ts'
import { parseRichText } from '../explain/richText.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { formatText } from '../quantity/numberDe.ts'
import { parseDecimal, rat, ratAdd, ratDiv, ratMul, toDecimalString, type Rational } from '../rational.ts'
import type { Rng } from '../random/rng.ts'
import { elementBySymbol } from './elements.ts'
import { ANIONS, CATIONS, ionCe, saltFormula, saltIndices, saltName } from './ions.ts'
import { balance, coefficientsOf, equationCe, isBalanced, species, withCoefficients } from './equation.ts'
import { indexChanged, partly, probeStep, singleAtom } from './generators/gleichungen.ts'
import { parseFormula } from './formula.ts'
import { atomicNumberSum, molarMass } from './molarMass.ts'
import { CHEM_ERROR_RULES } from './errorRules.ts'
import { generatorsOf } from './generators/index.ts'
import { lightValues, rydbergValues } from './generators/light.ts'
import { type Field, type Particle, wrongValues } from './generators/particles.ts'
import type { GuidedStep } from '../guided/types.ts'
import { createRng } from '../random/rng.ts'
import { MOLECULE_STEPS, nameTask } from './generators/molekuele.ts'
import { LEWIS_VARIANTS, type LewisVariant, lewisFigure, lewisValid } from './lewis.ts'
import { compoundName } from './molNames.ts'
import { moleculeById } from './molecules.ts'

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

  // Rydberg-Formel: Sprung 4 → 2 (486 nm) und Lösen aus n = 2
  const jump = rydbergValues('wavelength', { upper: 4, lower: 2 })
  const freed = rydbergValues('ionization', { upper: null, lower: 2 })
  const rydberg = (values: typeof jump, rule: string) => formatText(values.wrong.find((w) => w.rule === rule)!.value)

  it('Quadrat vergessen: 4 → 2 ergibt 365 nm statt 486 nm, aus n = 2 gelöst 1,09 · 10⁻¹⁸ J', () => {
    expect(formatText(jump.correct)).toBe('486')
    expect(rydberg(jump, 'chem-rydberg-no-square')).toBe('365')
    expect(rydberg(freed, 'chem-rydberg-no-square')).toBe('1,09 · 10⁻¹⁸')
  })

  it('Kehrwert vergessen: 4 → 2 ergibt 2,06 · 10¹⁵ nm', () => {
    expect(rydberg(jump, 'chem-rydberg-not-inverted')).toBe('2,06 · 10¹⁵')
  })

  it('Niveaus vertauscht: 4 → 2 ergibt −486 nm', () => {
    expect(rydberg(jump, 'chem-rydberg-swapped')).toBe('-486')
  })

  it('Bis zum Grundzustand gerechnet: aus n = 2 gelöst 1,64 · 10⁻¹⁸ J statt 5,45 · 10⁻¹⁹ J', () => {
    expect(formatText(freed.correct)).toBe('5,45 · 10⁻¹⁹')
    expect(rydberg(freed, 'chem-rydberg-to-ground')).toBe('1,64 · 10⁻¹⁸')
  })

  it('Nanometer nicht umgerechnet bei der Rydberg-Formel: 4 → 2 ergibt 4,86 · 10⁻⁷', () => {
    expect(rydberg(jump, 'chem-light-nm')).toBe('4,86 · 10⁻⁷')
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

describe('Rechenfehler Ionenbindung und Salze: Katalogbeispiele', () => {
  const cat = (id: string) => CATIONS.find((i) => i.id === id)!
  const an = (id: string) => ANIONS.find((i) => i.id === id)!
  it('Ionen: P³⁺, O⁶⁻, SO₄⁻', () => {
    expect(ionCe(an('P'), 3)).toBe('P^3+')
    expect(ionCe(an('O'), -(8 + an('O').charge))).toBe('O^6-')
    expect(ionCe(an('SO4'), -1)).toBe('SO4^-')
  })
  it('Formeln: Mg₂S₂, Al₃O₂, AlO, CaNO₃₂, Fe₃Cl', () => {
    expect(saltFormula(cat('Mg'), an('S'))).toBe('MgS')
    expect(saltFormula(cat('Mg'), an('S'), { cation: 2, anion: 2 })).toBe('Mg2S2')
    expect(saltFormula(cat('Al'), an('O'))).toBe('Al2O3')
    expect(saltFormula(cat('Al'), an('O'), { cation: 3, anion: 2 })).toBe('Al3O2')
    expect(saltFormula(cat('Al'), an('O'), { cation: 1, anion: 1 })).toBe('AlO')
    expect(saltFormula(cat('Ca'), an('NO3'))).toBe('Ca(NO3)2')
    expect(saltFormula(cat('Ca'), an('NO3'), { cation: 1, anion: 2 }, false)).toBe('CaNO32')
    expect(saltFormula(cat('Fe3'), an('Cl'), { cation: 3, anion: 1 })).toBe('Fe3Cl')
  })
  it('Namen: Fe₂O₃ mit Fe²⁺ und als Eisen(II)-oxid, Eisenchlorid, Natriumsulfid', () => {
    expect(saltIndices(cat('Fe3'), an('O')).cation).toBe(2)
    expect(saltName(cat('Fe3'), an('O'))).toBe('Eisen(III)-oxid')
    expect(saltName(cat('Fe3'), an('O'), 'Eisen(II)')).toBe('Eisen(II)-oxid')
    expect(saltName(cat('Fe3'), an('Cl'), 'Eisen')).toBe('Eisenchlorid')
    expect(saltName(cat('Na'), an('S'))).toBe('Natriumsulfid')
    expect(saltFormula(cat('Na'), an('SO4'))).toBe('Na2SO4')
  })
  it('Zerfall: Ladungen von 2 Cl²⁻ gehen nicht auf', () => {
    expect(cat('Ca').charge + 2 * -2).not.toBe(0)
    expect(cat('Ca').charge + 2 * an('Cl').charge).toBe(0)
  })
  it('Born-Haber mit NaCl: +349, ganze Bindungsenergie, ohne Sublimation, falsch umgestellt', () => {
    const [sub, ie, d, ea, hf] = [107, 496, 242, -349, -411]
    const ions = sub + ie + d / 2 + ea
    expect(ions).toBe(375)
    expect(sub + ie + d / 2 - ea).toBe(1073)
    expect(sub + ie + d + ea).toBe(496)
    expect(ie + d / 2 + ea).toBe(268)
    const lattice = hf - ions
    expect(lattice).toBe(-786)
    expect(ions - hf).toBe(786)
    expect(hf + ions).toBe(-36)
    expect(ions - lattice).toBe(1161)
    expect(lattice - ions).toBe(-1161)
  })
})

describe('Rechenfehler Moleküle: Katalogbeispiele (S5b)', () => {
  const S = MOLECULE_STEPS
  const mol = (id: string) => moleculeById(id)!
  const rng = () => createRng('katalog')
  // Antwort eines Fehlers in einem Schritt (sicher dabei über focus)
  const wrongIn = (step: GuidedStep | null, rule: string) => step?.choices.find((c) => c.errorRuleId === rule)?.content

  it('Valenzelektronen: Index vergessen, alle Elektronen, Oktette gezählt', () => {
    expect(wrongIn(S.valenceStep(mol('NH3'), rng(), 'chem-lewis-index-ignored'), 'chem-lewis-index-ignored')).toBe('$6$')
    expect(wrongIn(S.valenceStep(mol('H2O'), rng(), 'chem-lewis-all-electrons'), 'chem-lewis-all-electrons')).toBe('$10$')
    expect(wrongIn(S.valenceStep(mol('CH4'), rng(), 'chem-lewis-octet-count'), 'chem-lewis-octet-count')).toBe('$16$')
  })

  it('Paare: nicht halbiert, nur Bindungen, Mehrfachbindung als ein Paar, ganzes Molekül statt Zentralatom', () => {
    expect(wrongIn(S.pairsStep(mol('NH3'), rng(), 'chem-lewis-pairs-not-halved'), 'chem-lewis-pairs-not-halved')).toBe('$8$')
    expect(wrongIn(S.pairsStep(mol('H2O'), rng(), 'chem-lewis-bonds-only'), 'chem-lewis-bonds-only')).toBe('$2$')
    expect(wrongIn(S.splitStep(mol('CO2'), rng(), 'chem-lewis-multiple-as-one'), 'chem-lewis-multiple-as-one')).toBe('2 bindende und 2 freie Paare')
    expect(wrongIn(S.splitStep(mol('PCl3'), rng(), 'chem-lewis-free-whole-molecule'), 'chem-lewis-free-whole-molecule')).toBe('3 bindende und 10 freie Paare')
    expect(S.splitStep(mol('PCl3'), rng())!.choices.find((c) => c.correct)!.content).toBe('3 bindende und 1 freies Paar')
    expect(wrongIn(S.splitStep(mol('NH3'), rng(), 'chem-lewis-pairs-missing'), 'chem-lewis-pairs-missing')).toBe('3 bindende und 0 freie Paare')
    expect(wrongIn(S.splitStep(mol('CH4'), rng(), 'chem-lewis-octet-exceeded'), 'chem-lewis-octet-exceeded')).toBe('4 bindende und 1 freies Paar')
  })

  it('Lewis-Bilder: jeder Fehler ergibt eine falsche Formel wie im Katalog', () => {
    const variant = (id: string, v: LewisVariant) => lewisFigure(mol(id), v)!
    expect(variant('NH3', 'ohne-paare-innen').atoms[0].pairs).toHaveLength(0)
    expect(variant('CCl4', 'ohne-paare-aussen').atoms.slice(1).every((a) => a.pairs.length === 0)).toBe(true)
    // O–C–O mit vollen Oktetts: 20 statt 16 Elektronen
    const co2 = variant('CO2', 'einfachbindungen')
    expect(co2.bonds.every(([, , o]) => o === 1)).toBe(true)
    expect(co2.bonds.length * 2 + co2.atoms.reduce((s, a) => s + 2 * a.pairs.length, 0)).toBe(20)
    expect(variant('CH4', 'paar-zu-viel').atoms[0].pairs).toHaveLength(1)
    expect(variant('H2O', 'wasserstoff-paar').atoms.find((a) => a.el === 'H' && a.pairs.length === 1)).toBeDefined()
    for (const v of Object.keys(LEWIS_VARIANTS) as LewisVariant[]) {
      const id = { 'ohne-paare-innen': 'NH3', 'ohne-paare-aussen': 'CCl4', einfachbindungen: 'CO2', 'paar-zu-viel': 'CH4', 'wasserstoff-paar': 'H2O' }[v]
      expect(lewisValid(mol(id), variant(id, v)), v).toBe(false)
      const step = S.lewisChoiceStep(mol(id), rng(), LEWIS_VARIANTS[v])!
      expect(step.choices.find((c) => c.errorRuleId === LEWIS_VARIANTS[v])?.figure, v).toBe(lewisFigure(mol(id), v)!.id)
    }
  })

  it('Partner und freie Paare: doppelt gezählt, Paare als Partner, Zentralatom mitgezählt, nicht halbiert, Valenzelektronen, alle Paare', () => {
    expect(wrongIn(S.partnerStep(mol('CO2'), rng(), 'chem-vsepr-double-counted'), 'chem-vsepr-double-counted')).toBe('$4$')
    expect(wrongIn(S.partnerStep(mol('NH3'), rng(), 'chem-vsepr-pairs-as-partners'), 'chem-vsepr-pairs-as-partners')).toBe('$4$')
    expect(wrongIn(S.partnerStep(mol('CH4'), rng(), 'chem-vsepr-all-atoms'), 'chem-vsepr-all-atoms')).toBe('$5$')
    expect(wrongIn(S.lonePairStep(mol('H2O'), rng(), 'chem-vsepr-pairs-not-halved'), 'chem-vsepr-pairs-not-halved')).toBe('$4$')
    expect(wrongIn(S.lonePairStep(mol('NH3'), rng(), 'chem-vsepr-valence-as-pairs'), 'chem-vsepr-valence-as-pairs')).toBe('$5$')
    expect(wrongIn(S.lonePairStep(mol('CCl4'), rng(), 'chem-vsepr-all-lone-pairs'), 'chem-vsepr-all-lone-pairs')).toBe('$12$')
    expect(wrongIn(S.typeStep(mol('CO2'), rng(), 'chem-vsepr-double-counted'), 'chem-vsepr-double-counted')).toBe(String.raw`$\mathrm{AX_{4}}$`)
  })

  it('Gestalt und Winkel: freie Paare vergessen, Anordnung, freies Paar angenommen, flach, idealer Winkel', () => {
    expect(wrongIn(S.shapeStep(mol('CO2'), rng(), 'chem-vsepr-double-counted'), 'chem-vsepr-double-counted')).toBe('tetraedrisch')
    expect(wrongIn(S.shapeStep(mol('NH3'), rng(), 'chem-vsepr-lone-pairs-forgotten'), 'chem-vsepr-lone-pairs-forgotten')).toBe('trigonal-planar')
    expect(wrongIn(S.shapeStep(mol('H2O'), rng(), 'chem-vsepr-lone-pairs-forgotten'), 'chem-vsepr-lone-pairs-forgotten')).toBe('linear')
    expect(wrongIn(S.shapeStep(mol('NH3'), rng(), 'chem-vsepr-arrangement'), 'chem-vsepr-arrangement')).toBe('tetraedrisch')
    expect(wrongIn(S.shapeStep(mol('CO2'), rng(), 'chem-vsepr-extra-pair'), 'chem-vsepr-extra-pair')).toBe('gewinkelt')
    expect(wrongIn(S.shapeStep(mol('CH4'), rng(), 'chem-vsepr-flat'), 'chem-vsepr-flat')).toBe('quadratisch-planar')
    expect(wrongIn(S.angleStep(mol('CH4'), rng(), 'chem-vsepr-flat'), 'chem-vsepr-flat')).toBe(String.raw`$90^\circ$`)
    expect(wrongIn(S.angleStep(mol('H2O'), rng(), 'chem-vsepr-angle-ideal'), 'chem-vsepr-angle-ideal')).toBe(String.raw`$109{,}5^\circ$`)
  })

  it('ΔEN, Bindungsart, Teilladungen: O–H 5,64 und 2,48 statt 1,24; H–Cl mit δ− am H', () => {
    expect(wrongIn(S.deltaStep(mol('H2O'), 'H', 'O', rng(), 'chem-en-added'), 'chem-en-added')).toBe(String.raw`$5{,}64$`)
    expect(wrongIn(S.deltaStep(mol('H2O'), 'H', 'O', rng(), 'chem-en-index'), 'chem-en-index')).toBe(String.raw`$2{,}48$`)
    expect(S.deltaStep(mol('H2O'), 'H', 'O', rng())!.choices.find((c) => c.correct)!.content).toBe(String.raw`$1{,}24$`)
    expect(S.bondTypeStep('H', 'O', rng())!.choices.filter((c) => c.errorRuleId === 'chem-en-bond-type').map((c) => c.content)).toContain('Ionenbindung')
    expect(wrongIn(S.partialStep('H', 'Cl', rng()), 'chem-en-partial-swapped')).toBe(String.raw`$\delta-$ am $\ce{H}$, $\delta+$ am $\ce{Cl}$`)
  })

  it('Dipol: CO₂ als Dipol, CH₄ als Dipol, H₂O unpolar wie CO₂, Bindungen von H₂O für unpolar gehalten', () => {
    const contentOf = (id: string, rule: string) => wrongIn(S.dipoleStep(mol(id), rng(), rule), rule)
    expect(contentOf('CO2', 'chem-dipole-polar-bond')).toMatch(/^Ja/)
    expect(contentOf('CH4', 'chem-dipole-unpolar-bonds')).toMatch(/^Ja/)
    expect(contentOf('H2O', 'chem-dipole-symmetry-assumed')).toMatch(/^Nein: Die Bindungen sind polar/)
    expect(contentOf('H2O', 'chem-dipole-unpolar-claimed')).toMatch(/^Nein: Alle Bindungen/)
  })

  it('Namen: N₂O als Stickstoffoxid und Stickstoffdioxid, N₂O₃ als Stickstofftrioxid', () => {
    const n2o = ['N', 2, 'O', 1] as const
    expect(compoundName(n2o)).toBe('Distickstoffmonoxid')
    expect(compoundName(n2o, { first: null, second: null })).toBe('Stickstoffoxid')
    expect(compoundName(n2o, { first: 1, second: 2 })).toBe('Stickstoffdioxid')
    expect(compoundName(['N', 2, 'O', 3], { first: null, second: 3 })).toBe('Stickstofftrioxid')
    // die Aufgabe nutzt genau diese Fehler
    let seen = 0
    for (let i = 0; i < 200 && seen < 3; i++) {
      const calc = nameTask(3, createRng(`name-${i}`), { level: 3, seed: 10000 + i }, 'chem-molname-first-prefix')
      if (calc?.task.steps[0].choices.some((c) => c.errorRuleId === 'chem-molname-first-prefix')) seen++
    }
    expect(seen).toBe(3)
  })
})
