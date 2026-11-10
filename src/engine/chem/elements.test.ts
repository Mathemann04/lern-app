import { describe, expect, it } from 'vitest'
import { ELEMENTS, elementBySymbol, elementByZ } from './elements.ts'

// Gegenprobe der Elemente-Tabelle (Plan M4, Teil B „Tests", Daten). Die Werte hier sind unabhängig von
// elements.ts eingetragen.

// Standard-Atomgewichte nach IUPAC (2021), genauer als in der App
const IUPAC: Readonly<Record<string, number>> = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.18,
  Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078,
  Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38,
  Ga: 69.723, Ge: 72.63, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224,
  Nb: 92.906, Mo: 95.95, Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71,
  Sb: 121.76, Te: 127.6, I: 126.9, Xe: 131.29, Cs: 132.91, Ba: 137.33, Pt: 195.08, Au: 196.97, Hg: 200.59, Pb: 207.2,
  Bi: 208.98,
}

// Zweite, unabhängig eingetragene Liste: Stichproben aus Symbol, Ordnungszahl und Name
const SAMPLES: readonly [string, number, string][] = [
  ['H', 1, 'Wasserstoff'], ['C', 6, 'Kohlenstoff'], ['O', 8, 'Sauerstoff'], ['Na', 11, 'Natrium'], ['Si', 14, 'Silicium'],
  ['Cl', 17, 'Chlor'], ['K', 19, 'Kalium'], ['Fe', 26, 'Eisen'], ['Cu', 29, 'Kupfer'], ['Br', 35, 'Brom'],
  ['Rb', 37, 'Rubidium'], ['Ag', 47, 'Silber'], ['Sn', 50, 'Zinn'], ['I', 53, 'Iod'], ['Ba', 56, 'Barium'],
  ['Pt', 78, 'Platin'], ['Au', 79, 'Gold'], ['Hg', 80, 'Quecksilber'], ['Pb', 82, 'Blei'], ['Bi', 83, 'Bismut'],
]

// Die gerundeten Werte aus docs/CHEMIE.md §4
const CHEMIE_MD: Readonly<Record<string, string>> = {
  H: '1.0', He: '4.0', Li: '6.9', C: '12.0', N: '14.0', O: '16.0', F: '19.0', Na: '23.0', Mg: '24.3', Al: '27.0',
  Si: '28.1', P: '31.0', S: '32.1', Cl: '35.5', K: '39.1', Ca: '40.1', Fe: '55.8', Cu: '63.5', Zn: '65.4',
}

describe('Elemente-Tabelle', () => {
  it('enthält Z 1 bis 56 sowie Pt, Au, Hg, Pb, Bi, je einmal', () => {
    const zs = ELEMENTS.map((el) => el.z)
    expect(zs).toEqual([...Array.from({ length: 56 }, (_, i) => i + 1), 78, 79, 80, 82, 83])
    const symbols = ELEMENTS.map((el) => el.symbol)
    expect(new Set(symbols).size).toBe(symbols.length)
    for (const s of symbols) expect(s).toMatch(/^[A-Z][a-z]?$/)
  })

  it('stimmt mit der zweiten Liste überein', () => {
    for (const [symbol, z, name] of SAMPLES) {
      expect(elementBySymbol(symbol)?.z, symbol).toBe(z)
      expect(elementByZ(z)?.name, symbol).toBe(name)
    }
  })

  it('hat Molmassen mit einer Nachkommastelle, gerundet aus den IUPAC-Werten', () => {
    for (const el of ELEMENTS) {
      if (el.symbol === 'Tc') {
        expect(el.molarMass).toBe('98')
        continue
      }
      expect(el.molarMass, el.symbol).toMatch(/^\d+\.\d$/)
      expect(Math.abs(Number(el.molarMass) - IUPAC[el.symbol]), el.symbol).toBeLessThanOrEqual(0.05 + 1e-9)
    }
    for (const [symbol, value] of Object.entries(CHEMIE_MD)) expect(elementBySymbol(symbol)?.molarMass, symbol).toBe(value)
  })

  it('hat Isotope mit mehr Nukleonen als Protonen, aufsteigend, nahe der Molmasse', () => {
    for (const el of ELEMENTS) {
      expect([...el.isotopes].sort((a, b) => a - b), el.symbol).toEqual(el.isotopes)
      expect(new Set(el.isotopes).size).toBe(el.isotopes.length)
      for (const a of el.isotopes) {
        expect(a, el.symbol).toBeGreaterThanOrEqual(el.z)
        // kein Isotop weit weg von der mittleren Masse (Tippfehler)
        expect(Math.abs(a - Number(el.molarMass)), `${el.symbol}-${a}`).toBeLessThanOrEqual(el.z < 10 ? 3 : 9)
      }
    }
    expect(elementBySymbol('Tc')?.isotopes).toEqual([])
    expect(elementBySymbol('Cl')?.isotopes).toEqual([35, 37])
  })

  it('hat Ionenladungen passend zur Hauptgruppe', () => {
    const expected: Readonly<Record<string, readonly number[]>> = {
      Li: [1], Na: [1], K: [1], Rb: [1], Cs: [1], Be: [2], Mg: [2], Ca: [2], Sr: [2], Ba: [2], Al: [3], Ga: [3], In: [3],
      N: [-3], P: [-3], O: [-2], S: [-2], Se: [-2], Te: [-2], F: [-1], Cl: [-1], Br: [-1], I: [-1],
      He: [], Ne: [], Ar: [], Kr: [], Xe: [],
    }
    for (const [symbol, ions] of Object.entries(expected)) expect(elementBySymbol(symbol)?.ions, symbol).toEqual(ions)
    for (const el of ELEMENTS) for (const q of el.ions) {
      expect(q, el.symbol).not.toBe(0)
      // ein Ion hat nie weniger als null Elektronen
      expect(el.z - q, el.symbol).toBeGreaterThanOrEqual(0)
    }
  })
})
