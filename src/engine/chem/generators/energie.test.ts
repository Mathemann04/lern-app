import { describe, expect, it } from 'vitest'
import { GENERATED_MIN } from '../../quiz/numbers.ts'
import { createRng } from '../../random/rng.ts'
import type { Level } from '../../tasks/taskNumber.ts'
import { EQUILIBRIA } from '../equilibria.ts'
import { atomCounts, parseFormula } from '../formula.ts'
import { THERMO, THERMO_REACTIONS, type Term, thermoByKey, thermoReactionById } from '../thermo.ts'
import { dhTask, gasDsTask, gibbsTask, kTask, limitTask, phaseTask, rangeTask } from './energie.ts'
import { generatedCalc } from './index.ts'
import type { ChemCalc } from './shared.ts'
import { ENERGIE_BANK } from '../bank/energie.ts'
import { ENERGIE_MISCONCEPTIONS } from '../misconceptions/energie.ts'
import { ENERGIE_WHY } from '../misconceptions/energieWhy.ts'
import { ENERGIE_CARDS } from '../../explain/chem/energieCards.ts'

// Rechnungen „Energie bei Reaktionen" (S7b): Tabellenwerte gegen eine zweite Liste, Ergebnisse auf zweitem Weg (Gleitkomma),
// Katalogbeispiele der Rechenfehler

// Zweite, unabhängig eingetragene Liste (CODATA-Schlüsselwerte bzw. NIST): ΔfH° in kJ/mol, S° in J/(mol · K)
const SECOND: Readonly<Record<string, readonly [number, number]>> = {
  'H2O(l)': [-285.83, 69.95],
  'H2O(g)': [-241.83, 188.84],
  'CO2(g)': [-393.51, 213.79],
  'CO(g)': [-110.53, 197.66],
  'NH3(g)': [-45.94, 192.77],
  'CH4(g)': [-74.87, 186.25],
  'SO2(g)': [-296.84, 248.22],
  'SO3(g)': [-395.77, 256.77],
  'HCl(g)': [-92.31, 186.9],
  'NaCl(s)': [-411.12, 72.11],
  'MgO(s)': [-601.6, 26.95],
  'Al2O3(s)': [-1675.7, 50.92],
  'CaO(s)': [-634.92, 38.1],
  'O2(g)': [0, 205.15],
  'H2(g)': [0, 130.68],
  'N2(g)': [0, 191.61],
  'C(s)': [0, 5.74],
}

const num = (x: string) => Number(x)
const sumOf = (side: readonly Term[], f: (key: string) => number) => side.reduce((s, [c, k]) => s + c * f(k), 0)
const dfh = (k: string) => num(thermoByKey(k)!.dfh)
const s0 = (k: string) => num(thermoByKey(k)!.s)
const atoms = (side: readonly Term[]) => {
  const total = new Map<string, number>()
  for (const [c, k] of side) for (const [el, n] of atomCounts(parseFormula(thermoByKey(k)!.ce))) total.set(el, (total.get(el) ?? 0) + n * c)
  return [...total.entries()].sort()
}

// Zahl aus der LaTeX-Schreibweise, z. B. „-890{,}2" oder „3{,}06 \cdot 10^{-19}"
function numberOf(latex: string): number {
  const match = /(-?\d+(?:\{,\}\d+)?)(?: \\cdot 10\^\{(-?\d+)\})?/.exec(latex)
  if (!match) throw new Error(latex)
  return Number(match[1].replace('{,}', '.')) * 10 ** Number(match[2] ?? 0)
}

const rightIn = (calc: ChemCalc, step: string) => calc.task.steps.find((s) => s.id === step)!.choices.find((c) => c.correct)!.content
const wrongIn = (calc: ChemCalc | null, step: string, rule: string) => calc?.task.steps.find((s) => s.id === step)?.choices.find((c) => c.errorRuleId === rule)?.content
const ref = (level: Level, i: number) => ({ level, seed: GENERATED_MIN + i })
function findTask(make: (i: number) => ChemCalc | null, ok: (c: ChemCalc) => boolean): ChemCalc {
  for (let i = 0; i < 4000; i++) {
    const calc = make(i)
    if (calc && ok(calc)) return calc
  }
  throw new Error('keine passende Aufgabe')
}

describe('Daten Energie bei Reaktionen', () => {
  it('Tabellenwerte passen zur zweiten Liste (höchstens 1 kJ/mol bzw. 1 J/(mol · K) daneben)', () => {
    for (const [key, [h, s]] of Object.entries(SECOND)) {
      expect(thermoByKey(key), key).toBeDefined()
      expect(Math.abs(dfh(key) - h), key).toBeLessThanOrEqual(1)
      expect(Math.abs(s0(key) - s), key).toBeLessThanOrEqual(1)
    }
    // Elemente im Standardzustand mit 0, alle Entropien positiv, eindeutige Schlüssel
    for (const x of THERMO) {
      if (x.element) expect(x.dfh, x.key).toBe('0')
      expect(num(x.s), x.key).toBeGreaterThan(0)
    }
    expect(new Set(THERMO.map((x) => x.key)).size).toBe(THERMO.length)
  })

  it('jede Gleichung ist ausgeglichen; Bildungen nur aus Elementen; Ids eindeutig', () => {
    expect(new Set(THERMO_REACTIONS.map((x) => x.id)).size).toBe(THERMO_REACTIONS.length)
    for (const x of THERMO_REACTIONS) {
      expect(atoms(x.left), x.id).toEqual(atoms(x.right))
      expect(x.formation === true, x.id).toBe(x.left.every(([, k]) => thermoByKey(k)!.element === true))
    }
    expect(THERMO_REACTIONS.filter((x) => x.formation).length).toBeGreaterThanOrEqual(25)
  })

  it('stimmt mit den Reaktionsenthalpien der Gleichgewichte (S7a) überein, höchstens 2 kJ daneben', () => {
    let checked = 0
    for (const e of EQUILIBRIA) {
      const keys = [...e.left, ...e.right].map((x) => `${x.ce}(g)`)
      if (e.dH === null || keys.some((k) => !thermoByKey(k) && !['H2(g)', 'O2(g)', 'N2(g)', 'Cl2(g)'].includes(k))) continue
      const value = (k: string) => (thermoByKey(k) ? dfh(k) : 0)
      const dh = e.right.reduce((s, x) => s + x.coef * value(`${x.ce}(g)`), 0) - e.left.reduce((s, x) => s + x.coef * value(`${x.ce}(g)`), 0)
      expect(Math.abs(dh - e.dH), e.id).toBeLessThanOrEqual(2)
      checked++
    }
    expect(checked).toBeGreaterThanOrEqual(10)
  })
})

describe('Ergebnisse auf zweitem Weg', () => {
  it.each([1, 2, 3] as const)('Stufe %i: Reaktionsenthalpie, freie Enthalpie, Grenztemperatur, K, Bereich', (level) => {
    const seen = new Set<string>()
    for (let i = 0; i < 400; i++) {
      const calc = generatedCalc('chem-energie', ref(level, i))!
      const kind = calc.form.split(':')[0]
      seen.add(kind)
      const x = thermoReactionById(calc.substance)
      if (kind === 'dh') {
        if (level === 1) expect(x!.formation, calc.substance).toBe(true)
        const dh = sumOf(x!.right, dfh) - sumOf(x!.left, dfh)
        expect(Math.abs(numberOf(rightIn(calc, 'dh')) - dh), calc.substance).toBeLessThan(0.051)
      }
      if (kind === 'gibbs') {
        const theta = Number(/\\vartheta = (\d+)/.exec(calc.task.functionLatex!)![1])
        const dg = sumOf(x!.right, dfh) - sumOf(x!.left, dfh) - ((theta + 273.15) * (sumOf(x!.right, s0) - sumOf(x!.left, s0))) / 1000
        expect(Math.abs(numberOf(rightIn(calc, 'dg')) / dg - 1), calc.substance).toBeLessThan(0.006)
        expect(rightIn(calc, 'freiwillig'), calc.substance).toContain(dg < 0 ? 'läuft freiwillig ab' : 'läuft nicht freiwillig ab')
      }
      if (kind === 'grenze') {
        const t = (1000 * (sumOf(x!.right, dfh) - sumOf(x!.left, dfh))) / (sumOf(x!.right, s0) - sumOf(x!.left, s0))
        expect(Math.abs(numberOf(rightIn(calc, 'grenze')) / t - 1), calc.substance).toBeLessThan(0.006)
        expect(rightIn(calc, 'bereich')).toContain(sumOf(x!.right, dfh) > sumOf(x!.left, dfh) ? 'Oberhalb' : 'Unterhalb')
      }
      if (kind === 'dg-k') {
        const dg = Number(calc.substance.slice(2))
        const k = Math.exp((-dg * 1000) / (8.314 * 298.15))
        expect(Math.abs(numberOf(rightIn(calc, 'k')) / k - 1), calc.substance).toBeLessThan(0.006)
      }
      if (kind === 'bereich') {
        const dh = sumOf(x!.right, dfh) - sumOf(x!.left, dfh)
        const ds = sumOf(x!.right, s0) - sumOf(x!.left, s0)
        const expected = dh < 0 && ds > 0 ? 'jeder' : dh > 0 && ds < 0 ? 'keiner' : dh > 0 ? 'oberhalb' : 'unterhalb'
        expect(rightIn(calc, 'bereich'), calc.substance).toContain(expected)
      }
    }
    const expected = { 1: ['dh', 'phase'], 2: ['dh', 'phase', 'gas-ds', 'gibbs', 'bereich'], 3: ['dh', 'gibbs', 'bereich', 'grenze', 'dg-k'] }[level]
    for (const kind of expected) expect(seen, kind).toContain(kind)
  })
})

describe('Rechenfehler Energie bei Reaktionen: Katalogbeispiele', () => {
  const methane = (rule: string) => findTask((i) => dhTask(2, createRng(`${rule}${i}`), ref(2, i), rule), (c) => c.substance === 'ch4-verbrennung')

  it('Reaktionsenthalpie der Methanverbrennung: umgedreht, ohne Koeffizienten, mit Wasserdampf', () => {
    expect(wrongIn(methane('chem-dh-reversed'), 'dh', 'chem-dh-reversed')).toBe(String.raw`$890{,}2\,\mathrm{kJ}$`)
    expect(wrongIn(methane('chem-dh-coefficients'), 'dh', 'chem-dh-coefficients')).toBe(String.raw`$-604{,}4\,\mathrm{kJ}$`)
    expect(wrongIn(methane('chem-dh-water-gas'), 'dh', 'chem-dh-water-gas')).toBe(String.raw`$-802{,}2\,\mathrm{kJ}$`)
    expect(rightIn(methane('chem-dh-reversed'), 'dh')).toBe(String.raw`$-890{,}2\,\mathrm{kJ}$`)
  })

  it('Vorzeichen: ΔH und ΔS beim Verdampfen, Gasteilchen ohne Koeffizienten', () => {
    const evaporate = findTask((i) => phaseTask(1, createRng(`p${i}`), ref(1, i), 'chem-ds-sign'), (c) => c.substance === 'H2O:verdampfen')
    expect(wrongIn(evaporate, 'dh', 'chem-dh-phase')).toContain('abgegeben')
    expect(wrongIn(evaporate, 'ds', 'chem-ds-sign')).toContain('nimmt ab')
    const nh3 = findTask((i) => gasDsTask(2, createRng(`g${i}`), ref(2, i), 'chem-ds-count'), (c) => c.substance === 'nh3')
    expect(wrongIn(nh3, 'gas', 'chem-ds-count')).toBe('links $2$ mol, rechts $1$ mol Gas')
    expect(rightIn(nh3, 'gas')).toBe('links $4$ mol, rechts $2$ mol Gas')
  })

  it('Grenztemperatur der Ammoniaksynthese: Elemente mit Entropie 0, J und kJ, 273,15 zu viel abgezogen', () => {
    const nh3 = findTask((i) => limitTask(3, createRng(`l${i}`), ref(3, i), 'chem-ds-element-zero'), (c) => c.substance === 'nh3')
    expect(wrongIn(nh3, 'ds', 'chem-ds-element-zero')).toBe(String.raw`$385{,}6\,\mathrm{J/K}$`)
    expect(rightIn(nh3, 'ds')).toBe(String.raw`$-198{,}1\,\mathrm{J/K}$`)
    expect(rightIn(nh3, 'grenze')).toBe(String.raw`$463\,\mathrm{K}$`)
    const units = findTask((i) => limitTask(3, createRng(`u${i}`), ref(3, i), 'chem-dg-units'), (c) => c.substance === 'nh3')
    expect(wrongIn(units, 'grenze', 'chem-dg-units')).toBe(String.raw`$0{,}463\,\mathrm{K}$`)
    const twice = findTask((i) => limitTask(3, createRng(`c${i}`), ref(3, i), 'chem-dg-kelvin-twice'), (c) => c.substance === 'nh3')
    expect(wrongIn(twice, 'grenze', 'chem-dg-kelvin-twice')).toBe(String.raw`$190\,\mathrm{K}$`)
  })

  it('freie Enthalpie: 25 statt 298,15 K, ΔS nicht in kJ/K, Vorzeichen, ΔG > 0 für freiwillig, nur ΔH', () => {
    const calc = findTask((i) => gibbsTask(2, createRng(`d${i}`), ref(2, i), 'chem-dg-celsius'), (c) => /vartheta = 25\\/.test(c.task.functionLatex!))
    expect(wrongIn(calc, 'kelvin', 'chem-dg-celsius')).toBe(String.raw`$25\,\mathrm{K}$`)
    const kalk = findTask((i) => gibbsTask(2, createRng(`k${i}`), ref(2, i), 'chem-dg-units'), (c) => c.substance === 'kalkbrennen')
    expect(wrongIn(kalk, 'ds-kj', 'chem-dg-units')).toBe(String.raw`$160{,}2\,\mathrm{kJ/K}$`)
    expect(rightIn(kalk, 'ds-kj')).toBe(String.raw`$0{,}1602\,\mathrm{kJ/K}$`)
    // ΔH < 0, ΔS > 0: freiwillig bei jeder Temperatur; Vorzeichenfehler ergibt „nur unterhalb", ΔG > 0 „bei keiner"
    const h2o2 = findTask((i) => rangeTask(2, createRng(`b${i}`), ref(2, i)), (c) => c.substance === 'h2o2')
    expect(rightIn(h2o2, 'bereich')).toBe('bei jeder Temperatur')
    expect(wrongIn(h2o2, 'bereich', 'chem-dg-sign')).toBe('nur unterhalb einer bestimmten Temperatur')
    expect(wrongIn(h2o2, 'bereich', 'chem-dg-exergonic')).toBe('bei keiner Temperatur')
    const lime = findTask((i) => rangeTask(2, createRng(`e${i}`), ref(2, i)), (c) => c.substance === 'kalkbrennen')
    expect(wrongIn(lime, 'bereich', 'chem-dg-enthalpy-only')).toBe('bei keiner Temperatur')
  })

  it('K aus ΔG⁰: Zehnerpotenz statt e-Funktion', () => {
    const calc = findTask((i) => kTask(3, createRng(`k${i}`), ref(3, i), 'chem-dg-lg'), (c) => c.substance === 'dg-11.4')
    expect(numberOf(rightIn(calc, 'k'))).toBeCloseTo(99.4, 1)
    expect(numberOf(wrongIn(calc, 'k', 'chem-dg-lg')!)).toBeCloseTo(39700, -2)
  })
})

// Skript Gleichgewicht (Folie 9) und docs/CHEMIE.md §3: Die Gleichgewichtskonstante heißt auch im Thema Energie K_GG
// skip: Schlüssel, deren Texte aus chem/energieRules.ts stammen (dort nicht Teil dieser Prüfung)
const strings = (x: unknown, skip: readonly string[] = []): string[] =>
  typeof x === 'string'
    ? [x]
    : Array.isArray(x)
      ? x.flatMap((y) => strings(y, skip))
      : x && typeof x === 'object'
        ? Object.entries(x).flatMap(([key, y]) => (skip.includes(key) ? [] : strings(y, skip)))
        : []
// ein K, das weder K_GG noch die Einheit Kelvin ist (\mathrm{K}, J/(mol · K), „0 K“)
const bareK = (text: string) => /(?<![\p{L}{\\/_\d])(?<!\d )K(?![\p{L}_})\d])/u.test(text.replace(/\\mathrm\{[^}]*\}/g, ''))

describe('Thema Energie: Gleichgewichtskonstante und Fundstellen', () => {
  it('schreibt die Gleichgewichtskonstante überall als K_GG (Fragen, Karten, Denkfehler, Rechnung dg-k)', () => {
    const tasks = Array.from({ length: 60 }, (_, i) => kTask(3, createRng(`kgg${i}`), ref(3, i))).filter((c) => c !== null)
    expect(tasks.length).toBeGreaterThan(30)
    const texts = [...strings([ENERGIE_BANK.questions, ENERGIE_CARDS, ENERGIE_MISCONCEPTIONS, ENERGIE_WHY]), ...strings(tasks.map((c) => c.task), ['whyWrong', 'why'])]
    expect(texts.filter(bareK)).toEqual([])
    expect(texts.filter((t) => t.includes(String.raw`K_{\mathrm{GG}}`)).length).toBeGreaterThan(40)
  })

  it('jede Frage nennt das Skript Gleichgewicht mit einer Folie zwischen 7 und 10', () => {
    for (const q of ENERGIE_BANK.questions) expect(q.ref, q.id).toMatch(/^Skript Gleichgewicht, Folie ([7-9]|10)$/)
  })
})
