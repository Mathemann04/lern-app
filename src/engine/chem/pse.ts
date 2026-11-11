import { atomConfig, mainGroupOf } from './electrons.ts'
import { type Element, ELEMENTS, elementBySymbol } from './elements.ts'

// Aufbau des Periodensystems (Plan M4, Thema 2.1): Platz eines Elements (Periode, Gruppe 1 bis 18, Block) aus seiner
// Elektronenkonfiguration gerechnet, Metalle und Nichtmetalle, aufeinanderfolgende Ionisierungsenergien.
//
// Quellen (abgerufen 11.11.2026):
// - Metalle, Halbmetalle, Nichtmetalle: übliche Einteilung der Lehrbücher; Halbmetalle B, Si, Ge, As, Sb, Te. Selen
//   steht je nach Buch bei den Nichtmetallen oder Halbmetallen und wird deshalb nicht danach gefragt.
// - Ionisierungsenergien: NIST Atomic Spectra Database (Ionization Energies), in kJ/mol umgerechnet und auf ganze
//   Zahlen gerundet. Gegenprobe in pse.test.ts.

export type Block = 's' | 'p' | 'd' | 'f'

export type Place = {
  readonly period: number
  // Gruppe 1 bis 18
  readonly group: number
  readonly block: Block
  // Hauptgruppenelement (Gruppen 1, 2, 13 bis 18)
  readonly main: boolean
}

// Platz im Periodensystem: Periode = größte Hauptquantenzahl; Hauptgruppen nach den Valenzelektronen, Nebengruppen
// nach s- und d-Elektronen der beiden äußersten Schalen
export function placeOf(el: Element): Place {
  const config = atomConfig(el.z)
  // d-Elektronen gehören zur Periode n + 1, f-Elektronen zu n + 2 (Palladium hat kein 5s-Elektron)
  const period = Math.max(...config.map((o) => o.n + (o.l === 2 ? 1 : o.l === 3 ? 2 : 0)))
  if (el.z === 1) return { period: 1, group: 1, block: 's', main: true }
  if (el.z === 2) return { period: 1, group: 18, block: 's', main: true }
  const mg = mainGroupOf(el)
  if (mg) return { period, group: mg.group, block: mg.group <= 2 ? 's' : 'p', main: true }
  const s = config.find((o) => o.n === period && o.l === 0)?.count ?? 0
  const d = config.find((o) => o.n === period - 1 && o.l === 2)?.count ?? 0
  return { period, group: s + d, block: 'd', main: false }
}

// Zahl der Valenzelektronen eines Hauptgruppenelements (He: 2)
export const valenceOf = (place: Place) => (place.group <= 2 ? place.group : place.group === 18 && place.period === 1 ? 2 : place.group - 10)

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'] as const
// „VI. Hauptgruppe (Gruppe 16)" (docs/CHEMIE.md §3)
export const mainGroupName = (group: number) => `${ROMAN[(group <= 2 ? group : group - 10) - 1]}. Hauptgruppe (Gruppe ${group})`

export const elementAt = (period: number, group: number): Element | undefined => ELEMENTS.find((el) => placeOf(el).period === period && placeOf(el).group === group)

// --- Metalle und Nichtmetalle ---

export type Kind = 'metall' | 'halbmetall' | 'nichtmetall'
const NONMETALS = new Set(['H', 'He', 'C', 'N', 'O', 'F', 'Ne', 'P', 'S', 'Cl', 'Ar', 'Se', 'Br', 'Kr', 'I', 'Xe'])
const SEMIMETALS = new Set(['B', 'Si', 'Ge', 'As', 'Sb', 'Te'])
// je nach Lehrbuch verschieden eingeordnet: nicht danach fragen
export const UNCLEAR_KIND = new Set(['Se'])
export const kindOf = (el: Element): Kind => (SEMIMETALS.has(el.symbol) ? 'halbmetall' : NONMETALS.has(el.symbol) ? 'nichtmetall' : 'metall')

// --- Ionisierungsenergien ---

// aufeinanderfolgende Ionisierungsenergien in kJ/mol (die ersten, bis nach dem großen Sprung)
export const IONIZATION: Readonly<Record<string, readonly number[]>> = {
  Li: [520, 7298, 11815],
  Be: [900, 1757, 14849, 21007],
  B: [801, 2427, 3660, 25026],
  C: [1086, 2353, 4620, 6223, 37831],
  Na: [496, 4562, 6910, 9546],
  Mg: [738, 1451, 7733, 10543],
  Al: [578, 1817, 2745, 11577],
  Si: [787, 1577, 3232, 4356, 16091],
  K: [419, 3051, 4419, 5877],
  Ca: [590, 1145, 4912, 6491],
}

// größter Sprung: nach dem wievielten Elektron (Verhältnis zweier aufeinanderfolgender Energien am größten)
export function jumpAfter(energies: readonly number[]): number {
  let best = 1
  for (let i = 1; i < energies.length; i++) if (energies[i] / energies[i - 1] > energies[best] / energies[best - 1]) best = i
  return best
}

export const ionizationElements = () => Object.keys(IONIZATION).map((s) => elementBySymbol(s)!)
