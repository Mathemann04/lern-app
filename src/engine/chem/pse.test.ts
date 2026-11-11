import { describe, expect, it } from 'vitest'
import { ELEMENTS, elementBySymbol } from './elements.ts'
import { pseFigureById } from './figures.ts'
import { PSE_BANK } from './bank/pse.ts'
import { IONIZATION, jumpAfter, kindOf, mainGroupName, placeOf, valenceOf } from './pse.ts'

// Aufbau des Periodensystems (S6c): Plätze gegen eine zweite, von Hand eingetragene Liste (Periode, Gruppe 1 bis 18),
// Sprung der Ionisierungsenergie passt zur Hauptgruppe

const PLACES: Readonly<Record<string, [number, number]>> = {
  H: [1, 1], He: [1, 18], Li: [2, 1], Be: [2, 2], B: [2, 13], C: [2, 14], N: [2, 15], O: [2, 16], F: [2, 17], Ne: [2, 18],
  Na: [3, 1], Al: [3, 13], P: [3, 15], Cl: [3, 17], Ar: [3, 18], K: [4, 1], Ca: [4, 2], Sc: [4, 3], Ti: [4, 4], V: [4, 5],
  Cr: [4, 6], Mn: [4, 7], Fe: [4, 8], Co: [4, 9], Ni: [4, 10], Cu: [4, 11], Zn: [4, 12], Ga: [4, 13], Br: [4, 17], Kr: [4, 18],
  Rb: [5, 1], Y: [5, 3], Nb: [5, 5], Mo: [5, 6], Ru: [5, 8], Rh: [5, 9], Pd: [5, 10], Ag: [5, 11], Cd: [5, 12], Sn: [5, 14],
  I: [5, 17], Xe: [5, 18], Cs: [6, 1], Ba: [6, 2], Pt: [6, 10], Au: [6, 11], Hg: [6, 12], Pb: [6, 14], Bi: [6, 15],
}

describe('Aufbau des Periodensystems', () => {
  it('Periode und Gruppe wie in der zweiten Liste, Blöcke passend', () => {
    for (const [symbol, [period, group]] of Object.entries(PLACES)) {
      const place = placeOf(elementBySymbol(symbol)!)
      expect([place.period, place.group], symbol).toEqual([period, group])
      expect(place.block, symbol).toBe(symbol === 'He' || group <= 2 ? 's' : group >= 13 ? 'p' : 'd')
    }
    // jedes Feld höchstens einmal
    const keys = ELEMENTS.map((el) => `${placeOf(el).period}-${placeOf(el).group}`)
    expect(new Set(keys).size).toBe(keys.length)
    expect(mainGroupName(16)).toBe('VI. Hauptgruppe (Gruppe 16)')
    expect(valenceOf(placeOf(elementBySymbol('He')!))).toBe(2)
  })

  it('Metalle, Halbmetalle, Nichtmetalle', () => {
    expect(kindOf(elementBySymbol('B')!)).toBe('halbmetall')
    expect(kindOf(elementBySymbol('Si')!)).toBe('halbmetall')
    expect(kindOf(elementBySymbol('Al')!)).toBe('metall')
    expect(kindOf(elementBySymbol('S')!)).toBe('nichtmetall')
    expect(kindOf(elementBySymbol('Fe')!)).toBe('metall')
  })

  it('Ionisierungsenergien steigen, der größte Sprung liegt nach so vielen Elektronen, wie die Hauptgruppe angibt', () => {
    for (const [symbol, energies] of Object.entries(IONIZATION)) {
      for (let i = 1; i < energies.length; i++) expect(energies[i], symbol).toBeGreaterThan(energies[i - 1])
      const el = elementBySymbol(symbol)!
      expect(jumpAfter(energies), symbol).toBe(valenceOf(placeOf(el)))
      // auch der größte Unterschied (nicht nur das Verhältnis) liegt dort
      const diffs = energies.slice(1).map((e, i) => e - energies[i])
      expect(diffs.indexOf(Math.max(...diffs)) + 1, symbol).toBe(jumpAfter(energies))
    }
    // Stichproben aus dem Tabellenwerk (kJ/mol)
    expect(IONIZATION.Na[0]).toBe(496)
    expect(IONIZATION.Mg[2]).toBe(7733)
    expect(IONIZATION.Al[3]).toBe(11577)
  })

  it('Ausschnitt des Periodensystems', () => {
    const s = pseFigureById('pse:S')!
    expect(s.main).toBe(true)
    expect(s.cells.find((c) => c.period === 3 && c.group === 16)?.symbol).toBe('S')
    expect(s.cells.filter((c) => c.period === 1).map((c) => c.symbol)).toEqual(['H', 'He'])
    const fe = pseFigureById('pse:Fe')!
    expect(fe.main).toBe(false)
    expect(fe.cells.find((c) => c.period === 4 && c.group === 8)?.symbol).toBe('Fe')
    expect(pseFigureById('pse:Xx')).toBeNull()
  })
})

// Ordnen (N1c): Elemente nach der Ordnungszahl; die Frage lebt davon, dass Argon schwerer ist als Kalium
describe('Ordnen-Frage zur Ordnungszahl', () => {
  it('folgt der Ordnungszahl, und Argon ist schwerer als Kalium', () => {
    const q = PSE_BANK.questions.find((x) => x.id === 'pse-v-ordnen-ordnungszahl')
    if (q?.kind !== 'order') throw new Error('Frage fehlt')
    const zs = q.items.map((i) => elementBySymbol(i.id)!.z)
    expect(zs).toEqual([...zs].sort((a, b) => a - b))
    expect(new Set(zs).size).toBe(zs.length)
    expect(Number(elementBySymbol('Ar')!.molarMass.replace(',', '.'))).toBeGreaterThan(Number(elementBySymbol('K')!.molarMass.replace(',', '.')))
    const ids = q.items.map((i) => i.id)
    expect(ids.indexOf('Ar')).toBeLessThan(ids.indexOf('K'))
  })
})
