import { describe, expect, it } from 'vitest'
import { createRng } from '../../random/rng.ts'
import { EQUILIBRIA, type EqSpecies, equilibriumById } from '../equilibria.ts'
import { atomCounts, parseFormula } from '../formula.ts'
import { GENERATED_MIN } from '../../quiz/numbers.ts'
import type { Level } from '../../tasks/taskNumber.ts'
import { generatedCalc } from './index.ts'
import { expressionStep, kValueTask, leChatelierTask, rateTask, yieldTask } from './mwg.ts'
import type { ChemCalc } from './shared.ts'

// Rechnungen „Chemisches Gleichgewicht" (S7a): Daten gegen eine zweite Liste, Richtung nach Le Chatelier auf eigenem Weg,
// K auf zweitem Weg, Katalogbeispiele der Rechenfehler

// Zweite, unabhängig eingetragene Liste: Standardbildungsenthalpien in kJ/mol bei 298 K (NIST Chemistry WebBook bzw.
// Lehrbuchtabellen; Elemente 0)
const DFH: Readonly<Record<string, number>> = {
  N2: 0, H2: 0, O2: 0, Cl2: 0,
  NH3: -45.9, SO2: -296.8, SO3: -395.7, NO: 90.3, NO2: 33.2, N2O4: 9.2, CO: -110.5, CO2: -393.5, H2O: -241.8,
  CH3OH: -201.0, CH4: -74.8, HCl: -92.3, C2H4: 52.5, C2H6: -84.0, C3H8: -104.7, C3H6: 20.4,
}

const sumOf = (side: readonly EqSpecies[], f: (x: EqSpecies) => number) => side.reduce((s, x) => s + f(x), 0)
const atoms = (side: readonly EqSpecies[]) => {
  const total = new Map<string, number>()
  for (const x of side) for (const [el, n] of atomCounts(parseFormula(x.ce))) total.set(el, (total.get(el) ?? 0) + n * x.coef)
  return [...total.entries()].sort()
}

// Zahl aus der LaTeX-Schreibweise, z. B. „3{,}06 \cdot 10^{-19}"
function numberOf(latex: string): number {
  const match = /(-?\d+(?:\{,\}\d+)?)(?: \\cdot 10\^\{(-?\d+)\})?/.exec(latex)
  if (!match) throw new Error(latex)
  return Number(match[1].replace('{,}', '.')) * 10 ** Number(match[2] ?? 0)
}

const wrongIn = (calc: ChemCalc | null, step: string, rule: string) => calc?.task.steps.find((s) => s.id === step)?.choices.find((c) => c.errorRuleId === rule)?.content
const rightIn = (calc: ChemCalc, step: string) => calc.task.steps.find((s) => s.id === step)!.choices.find((c) => c.correct)!.content

// erste Aufgabe, die eine Bedingung erfüllt
function findTask(make: (i: number) => ChemCalc | null, ok: (c: ChemCalc) => boolean): ChemCalc {
  for (let i = 0; i < 4000; i++) {
    const calc = make(i)
    if (calc && ok(calc)) return calc
  }
  throw new Error('keine passende Aufgabe')
}
const ref = (level: Level, i: number) => ({ level, seed: GENERATED_MIN + i })

describe('Daten Chemisches Gleichgewicht', () => {
  it('jede Gleichung ist ausgeglichen, alle Ids eindeutig', () => {
    expect(new Set(EQUILIBRIA.map((e) => e.id)).size).toBe(EQUILIBRIA.length)
    for (const e of EQUILIBRIA) expect(atoms(e.left), e.id).toEqual(atoms(e.right))
  })

  it('Reaktionsenthalpien passen zur zweiten Liste (höchstens 2 kJ daneben), Rückreaktionen mit umgekehrtem Vorzeichen', () => {
    let checked = 0
    for (const e of EQUILIBRIA) {
      if (e.dH === null) continue
      const dH = sumOf(e.right, (x) => x.coef * DFH[x.ce]) - sumOf(e.left, (x) => x.coef * DFH[x.ce])
      expect(Number.isNaN(dH), e.id).toBe(false)
      expect(Math.abs(dH - e.dH), `${e.id}: ${dH}`).toBeLessThanOrEqual(2)
      checked++
    }
    expect(checked).toBeGreaterThanOrEqual(15)
    for (const [a, b] of [['nh3', 'nh3-zerfall'], ['so3', 'so3-zerfall'], ['n2o4', 'no2-dimer'], ['shift', 'shift-rueck'], ['ethan', 'ethen']]) {
      expect(equilibriumById(a)!.dH, a).toBe(-equilibriumById(b)!.dH!)
    }
    // H₂ + I₂ ⇌ 2 HI nie mit Temperatur (docs/CHEMIE.md §6)
    expect(equilibriumById('hi')!.dH).toBeNull()
  })
})

describe('Le Chatelier: Richtung auf eigenem Weg', () => {
  const sideOf = (id: string, ce: string) => (equilibriumById(id)!.left.some((x) => x.ce === ce) ? 'left' : 'right')
  const TEXT = { right: 'zu den Produkten', left: 'zu den Edukten', none: 'ändert sich nicht' }

  it.each([2, 3] as const)('Stufe %i: Druck, Temperatur und Konzentration', (level) => {
    let seen = 0
    for (let i = 0; i < 300; i++) {
      const calc = generatedCalc('chem-mwg', ref(level, i))!
      if (!calc.form.startsWith('le-chatelier:')) continue
      seen++
      const kind = calc.form.split(':')[2]
      const [id, ce] = calc.substance.split(':')
      const e = equilibriumById(id)!
      let expected: 'right' | 'left' | 'none'
      if (kind.startsWith('p')) {
        const l = sumOf(e.left, (x) => x.coef)
        const r = sumOf(e.right, (x) => x.coef)
        const toFewer = r < l ? 'right' : 'left'
        expected = l === r ? 'none' : kind === 'p-up' ? toFewer : toFewer === 'right' ? 'left' : 'right'
      } else if (kind.startsWith('t')) {
        // Erwärmen begünstigt die endotherme Richtung
        const endo = e.dH! > 0 ? 'right' : 'left'
        expected = kind === 't-up' ? endo : endo === 'right' ? 'left' : 'right'
      } else {
        // zugegebener Stoff wird verbraucht, entfernter nachgebildet
        const away = sideOf(id, ce) === 'left' ? 'right' : 'left'
        expected = kind === 'c-add' ? away : away === 'right' ? 'left' : 'right'
      }
      expect(rightIn(calc, 'richtung'), `${calc.form} ${calc.substance}`).toContain(TEXT[expected])
    }
    expect(seen).toBeGreaterThan(30)
  })

  it('Ausbeute: Druck und Temperatur wie im Lehrbuch (Ammoniak, Schwefeltrioxid, Dampfreformierung)', () => {
    const make = (id: string, x: string) => findTask((i) => yieldTask(3, createRng(`y${id}${i}`), ref(3, i)), (c) => c.substance === `${id}:${x}`)
    expect(rightIn(make('nh3', 'NH3'), 'massnahmen')).toBe('Hoher Druck und niedrige Temperatur')
    expect(rightIn(make('so3', 'SO3'), 'massnahmen')).toBe('Hoher Druck und niedrige Temperatur')
    expect(rightIn(make('reforming', 'H2'), 'massnahmen')).toBe('Niedriger Druck und hohe Temperatur')
    // gleich viele Gasteilchen: Der Druck spielt keine Rolle
    expect(rightIn(make('no', 'NO'), 'druck')).toBe('Der Druck spielt keine Rolle.')
  })
})

describe('Gleichgewichtskonstante auf zweitem Weg', () => {
  it.each([2, 3] as const)('Stufe %i: K aus den Konzentrationen und aus den Geschwindigkeitskonstanten', (level) => {
    let values = 0
    let rates = 0
    for (let i = 0; i < 400; i++) {
      const calc = generatedCalc('chem-mwg', ref(level, i))!
      const given = calc.task.functionLatex ?? ''
      if (calc.form.startsWith('k-wert:')) {
        values++
        const e = equilibriumById(calc.substance)!
        const c = (x: EqSpecies) => {
          const m = new RegExp(String.raw`c\(\\ce\{${x.ce}\}\) = ([\d{},]+)\\,`).exec(given)
          return Number(m![1].replace('{,}', '.'))
        }
        const k = e.right.reduce((p, x) => p * c(x) ** x.coef, 1) / e.left.reduce((p, x) => p * c(x) ** x.coef, 1)
        expect(Math.abs(numberOf(rightIn(calc, 'wert')) / k - 1), given).toBeLessThan(0.006)
      }
      if (calc.form.startsWith('k-raten:')) {
        rates++
        const hin = numberOf(/k_\{\\text\{hin\}\} = ([^\\]+(?:\\cdot 10\^\{-?\d+\})?)/.exec(given)![1])
        const back = numberOf(/k_\{\\text\{rück\}\} = ([^\\]+(?:\\cdot 10\^\{-?\d+\})?)/.exec(given)![1])
        expect(Math.abs(numberOf(rightIn(calc, 'k')) / (hin / back) - 1), given).toBeLessThan(1e-9)
      }
    }
    expect(values).toBeGreaterThan(30)
    expect(rates).toBeGreaterThan(20)
  })
})

describe('Rechenfehler Chemisches Gleichgewicht: Katalogbeispiele', () => {
  const nh3 = equilibriumById('nh3')!
  const expr = (rule: string) => expressionStep(nh3, createRng(rule), rule)!.choices.find((c) => c.errorRuleId === rule)?.content

  it('Massenwirkungsgesetz der Ammoniaksynthese: Exponent, vertauscht, Faktor, Summe', () => {
    expect(expr('chem-mwg-exponent')).toBe(String.raw`$K_{\mathrm{GG}} = \frac{c(\ce{NH3})}{c(\ce{N2}) \cdot c(\ce{H2})}$`)
    expect(expr('chem-mwg-swapped')).toBe(String.raw`$K_{\mathrm{GG}} = \frac{c(\ce{N2}) \cdot c^{3}(\ce{H2})}{c^{2}(\ce{NH3})}$`)
    expect(expr('chem-mwg-factor')).toContain(String.raw`2 \cdot c(\ce{NH3})`)
    expect(expr('chem-mwg-sum')).toContain(String.raw`c(\ce{N2}) + c^{3}(\ce{H2})`)
  })

  it('K aus Geschwindigkeiten: Kehrwert und Produkt', () => {
    const calc = findTask((i) => rateTask(2, createRng(`r${i}`), ref(2, i), 'chem-k-rates'), () => true)
    const right = numberOf(rightIn(calc, 'k'))
    expect(numberOf(wrongIn(calc, 'k', 'chem-k-rates')!) * right).toBeCloseTo(1, 6)
    const product = findTask((i) => rateTask(2, createRng(`p${i}`), ref(2, i), 'chem-k-product'), (c) => wrongIn(c, 'k', 'chem-k-product') !== undefined)
    expect(numberOf(wrongIn(product, 'k', 'chem-k-product')!)).toBeLessThan(right)
    // v_hin mit den Produkten
    const products = findTask((i) => rateTask(2, createRng(`v${i}`), ref(2, i), 'chem-rate-products'), (c) => c.substance === 'generisch-0')
    expect(wrongIn(products, 'v-hin', 'chem-rate-products')).toBe(String.raw`$v_{\text{hin}} = k_{\text{hin}} \cdot c(\ce{C})$`)
  })

  const lc = (rule: string, id: string, kind: string, level: Level = 2) =>
    findTask((i) => leChatelierTask(level, createRng(`${rule}${i}`), ref(level, i), rule), (c) => c.substance.split(':')[0] === id && c.form.endsWith(`:${kind}`))

  it('Le Chatelier: Druck zur Seite mit mehr Teilchen, Erwärmen hilft den Produkten, Koeffizienten vergessen', () => {
    expect(wrongIn(lc('chem-lc-pressure', 'nh3', 'p-up'), 'richtung', 'chem-lc-pressure')).toContain('zu den Edukten')
    expect(wrongIn(lc('chem-lc-heat', 'nh3', 't-up'), 'richtung', 'chem-lc-heat')).toContain('zu den Produkten')
    expect(wrongIn(lc('chem-lc-count', 'hi', 'p-up'), 'richtung', 'chem-lc-count')).toContain('zu den Produkten')
    expect(wrongIn(lc('chem-lc-count', 'hi', 'p-up'), 'teilchen', 'chem-lc-count')).toBe('links $2$, rechts $1$')
  })

  it('Le Chatelier: zugegebener Stoff, exotherm und endotherm, keine Verschiebung', () => {
    const conc = findTask((i) => leChatelierTask(2, createRng(`c${i}`), ref(2, i), 'chem-lc-conc'), (c) => c.substance === 'nh3:N2' && c.form.endsWith(':c-add'))
    expect(wrongIn(conc, 'richtung', 'chem-lc-conc')).toContain('zu den Edukten')
    const exo = lc('chem-lc-exo-endo', 'nh3', 't-down')
    expect(wrongIn(exo, 'enthalpie', 'chem-lc-exo-endo')).toContain('endotherm')
    expect(wrongIn(lc('chem-lc-no-shift', 'nh3', 't-up'), 'richtung', 'chem-lc-no-shift')).toContain('ändert sich nicht')
  })

  it('Ausbeute: Katalysator als Falle', () => {
    const calc = findTask((i) => yieldTask(3, createRng(`k${i}`), ref(3, i), 'chem-lc-catalyst'), () => true)
    expect(wrongIn(calc, 'massnahmen', 'chem-lc-catalyst')).toContain('Katalysator')
  })

  it('K aus Konzentrationen: Kehrwert bei vertauschtem Bruch', () => {
    const calc = findTask((i) => kValueTask(2, createRng(`w${i}`), ref(2, i), 'chem-mwg-swapped'), (c) => wrongIn(c, 'wert', 'chem-mwg-swapped') !== undefined)
    expect(numberOf(wrongIn(calc, 'wert', 'chem-mwg-swapped')!) * numberOf(rightIn(calc, 'wert'))).toBeCloseTo(1, 1)
  })
})
