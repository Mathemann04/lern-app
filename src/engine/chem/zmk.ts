import { ratToNumber } from '../rational.ts'
import { parseFormula } from './formula.ts'
import { molarMass } from './molarMass.ts'

// Stoffe für das Thema „Zwischenmolekulare Kräfte" (Plan M4, Thema 3.3): feste Daten mit Tests (zmk.test.ts).
// Je Stoff: ob das Molekül polar ist (Dipol) und ob es Wasserstoffbrücken bilden kann (H direkt an N, O oder F);
// daraus folgt die stärkste zwischenmolekulare Kraft. Siedepunkte bei 1013 hPa in °C, ganzzahlig gerundet.
//
// Quelle der Siedepunkte (abgerufen 11.11.2026): PubChem, „Boiling Point" (Werte bei Normaldruck), abgeglichen mit
// dem CRC Handbook of Chemistry and Physics. Verglichen werden nur Stoffe mit mindestens 10 K Abstand (CHEMIE.md
// §5); Kohlenstoffdioxid (sublimiert) kommt nicht vor.

export type Force = 'van-der-waals' | 'dipol-dipol' | 'wasserstoffbruecken'

export const FORCE_RANK: Readonly<Record<Force, number>> = { 'van-der-waals': 1, 'dipol-dipol': 2, wasserstoffbruecken: 3 }

// Namen wie im Skript und in den Klausuren
export const FORCE_NAME: Readonly<Record<Force, string>> = {
  'van-der-waals': 'Van-der-Waals-Kräfte',
  'dipol-dipol': 'Dipol-Dipol-Wechselwirkungen',
  wasserstoffbruecken: 'Wasserstoffbrückenbindungen',
}

export type ZmkSubstance = {
  // Formel wie in der Aufgabe (für mhchem und parseFormula)
  readonly id: string
  readonly name: string
  // ab dieser Stufe
  readonly level: 1 | 2 | 3
  readonly polar: boolean
  // H direkt an N, O oder F
  readonly hBond: boolean
  // Siedepunkt in °C bei 1013 hPa
  readonly boil: number
  // Wasserstoffatome am Molekül (für den Fehler „jedes H bildet Brücken")
  readonly hasH: boolean
  // Halogen- oder andere H-Verbindung mit H an einem elektronegativen Atom, das keine Brücken bildet (Cl, S, Br, I)
  readonly hOnOther?: true
  // Hinweis auf den Bau, wo die Summenformel Polarität oder Wasserstoffbrücken nicht zeigt (Klausurniveau)
  readonly structure?: string
}

const s = (id: string, name: string, level: 1 | 2 | 3, polar: boolean, hBond: boolean, boil: number, hOnOther = false): ZmkSubstance => ({
  id,
  name,
  level,
  polar,
  hBond,
  boil,
  hasH: /H(?![a-z])/.test(id),
  ...(hOnOther ? { hOnOther: true as const } : {}),
})

const STRUCTURE_CO = String.raw`polare $\ce{C=O}$-Gruppe, alle H am C`

export const ZMK_SUBSTANCES: readonly ZmkSubstance[] = [
  // Edelgase und Elemente
  s('He', 'Helium', 1, false, false, -269),
  s('Ne', 'Neon', 1, false, false, -246),
  s('Ar', 'Argon', 1, false, false, -186),
  s('Kr', 'Krypton', 1, false, false, -153),
  s('Xe', 'Xenon', 1, false, false, -108),
  s('H2', 'Wasserstoff', 1, false, false, -253),
  s('N2', 'Stickstoff', 1, false, false, -196),
  s('O2', 'Sauerstoff', 1, false, false, -183),
  s('F2', 'Fluor', 1, false, false, -188),
  s('Cl2', 'Chlor', 1, false, false, -34),
  s('Br2', 'Brom', 1, false, false, 59),
  s('I2', 'Iod', 1, false, false, 184),
  // Wasserstoffverbindungen
  s('CH4', 'Methan', 1, false, false, -162),
  s('SiH4', 'Silan', 1, false, false, -112),
  s('NH3', 'Ammoniak', 1, true, true, -33),
  s('H2O', 'Wasser', 1, true, true, 100),
  s('H2S', 'Schwefelwasserstoff', 2, true, false, -60, true),
  s('HF', 'Fluorwasserstoff', 1, true, true, 20),
  s('HCl', 'Chlorwasserstoff', 1, true, false, -85, true),
  s('HBr', 'Bromwasserstoff', 1, true, false, -67, true),
  s('HI', 'Iodwasserstoff', 1, true, false, -35, true),
  // Alkane
  s('C2H6', 'Ethan', 1, false, false, -89),
  s('C3H8', 'Propan', 1, false, false, -42),
  s('C4H10', 'Butan', 1, false, false, -1),
  s('C5H12', 'Pentan', 1, false, false, 36),
  s('C6H14', 'Hexan', 1, false, false, 69),
  s('C7H16', 'Heptan', 1, false, false, 98),
  s('C8H18', 'Octan', 1, false, false, 126),
  // Alkohole
  s('CH3OH', 'Methanol', 1, true, true, 65),
  s('C2H5OH', 'Ethanol', 1, true, true, 78),
  s('C3H7OH', 'Propan-1-ol', 1, true, true, 97),
  s('C4H9OH', 'Butan-1-ol', 1, true, true, 118),
  // weitere polare Stoffe ohne Wasserstoffbrücken untereinander
  s('CH3Cl', 'Chlormethan', 1, true, false, -24),
  s('CH2Cl2', 'Dichlormethan', 1, true, false, 40),
  s('CHCl3', 'Trichlormethan', 1, true, false, 61),
  s('CCl4', 'Tetrachlormethan', 1, false, false, 77),
  { ...s('CH2O', 'Formaldehyd', 3, true, false, -19), structure: STRUCTURE_CO },
  { ...s('CH3CHO', 'Acetaldehyd', 3, true, false, 20), structure: STRUCTURE_CO },
  { ...s('CH3COCH3', 'Aceton', 3, true, false, 56), structure: STRUCTURE_CO },
  { ...s('CH3OCH3', 'Dimethylether', 3, true, false, -24), structure: String.raw`O zwischen zwei C-Atomen, ohne H daran` },
]

const BY_ID = new Map(ZMK_SUBSTANCES.map((x) => [x.id, x]))
export const zmkById = (id: string): ZmkSubstance => {
  const x = BY_ID.get(id)
  if (!x) throw new Error(`Unbekannter Stoff ${id}`)
  return x
}

export const forceOf = (x: ZmkSubstance): Force => (x.hBond ? 'wasserstoffbruecken' : x.polar ? 'dipol-dipol' : 'van-der-waals')

// Schmelzpunkte in °C bei 1013 hPa, ganzzahlig gerundet, nur für die Stoffe der Frage „Zustand bei Raumtemperatur"
// (Quelle wie bei den Siedepunkten: PubChem „Melting Point", abgeglichen mit dem CRC Handbook; Gegenprobe in
// zmk.test.ts)
export const MELT: Readonly<Record<string, number>> = {
  F2: -220, Cl2: -101, Br2: -7, I2: 114,
  CH4: -182, C2H6: -183, C3H8: -188, C4H10: -138, C5H12: -130, C6H14: -95, C7H16: -91, C8H18: -57,
}

// Zustand bei Raumtemperatur (20 bis 25 °C) und Normaldruck; null, wenn Siede- oder Schmelzpunkt näher als 10 K
// an diesem Bereich liegt oder der Schmelzpunkt fehlt
export type RoomState = 'gasförmig' | 'flüssig' | 'fest'
export const ROOM_MIN = 20
export const ROOM_MAX = 25
export function roomStateOf(id: string): RoomState | null {
  const x = zmkById(id)
  const melt = MELT[id]
  if (melt === undefined) return null
  const near = (t: number) => t > ROOM_MIN - 10 && t < ROOM_MAX + 10
  if (near(x.boil) || near(melt)) return null
  if (x.boil < ROOM_MIN) return 'gasförmig'
  return melt > ROOM_MAX ? 'fest' : 'flüssig'
}

// Molmasse mit den Werten des PSE der App (eine Nachkommastelle), als Zahl
export const molarMassOf = (x: ZmkSubstance) => ratToNumber(molarMass(parseFormula(x.id), 'pse'))

// Vergleichsgruppen für „Siedepunkte ordnen": nur Gruppen, deren Reihenfolge eine Regel erklärt.
// - mass: gleiche Art der stärksten Kraft, größere Moleküle sieden höher
// - force: ähnliche Molmasse, die stärkere Kraft siedet höher
// - force-then-mass: erst die Art der Kraft (Wasserstoffbrücken), dann die Größe
export type BoilRule = 'mass' | 'force' | 'force-then-mass'

export type BoilGroup = { readonly ids: readonly string[]; readonly rule: BoilRule; readonly level: 2 | 3 }

export const BOIL_GROUPS: readonly BoilGroup[] = [
  { ids: ['He', 'Ne', 'Ar', 'Kr', 'Xe'], rule: 'mass', level: 2 },
  { ids: ['F2', 'Cl2', 'Br2', 'I2'], rule: 'mass', level: 2 },
  { ids: ['CH4', 'C2H6', 'C3H8', 'C4H10', 'C5H12', 'C6H14', 'C7H16', 'C8H18'], rule: 'mass', level: 2 },
  { ids: ['CH3OH', 'C2H5OH', 'C3H7OH', 'C4H9OH'], rule: 'mass', level: 2 },
  { ids: ['HCl', 'HBr', 'HI'], rule: 'mass', level: 2 },
  { ids: ['CH3Cl', 'CH2Cl2', 'CHCl3'], rule: 'mass', level: 2 },
  { ids: ['CH4', 'SiH4'], rule: 'mass', level: 2 },
  { ids: ['C2H6', 'CH2O', 'CH3OH'], rule: 'force', level: 3 },
  { ids: ['C3H8', 'CH3CHO', 'C2H5OH'], rule: 'force', level: 3 },
  { ids: ['C4H10', 'CH3COCH3', 'C3H7OH'], rule: 'force', level: 3 },
  { ids: ['C3H8', 'CH3OCH3', 'C2H5OH'], rule: 'force', level: 3 },
  { ids: ['CH4', 'NH3'], rule: 'force', level: 2 },
  { ids: ['F2', 'HCl'], rule: 'force', level: 2 },
  { ids: ['H2O', 'H2S'], rule: 'force-then-mass', level: 2 },
  { ids: ['HF', 'HCl', 'HBr', 'HI'], rule: 'force-then-mass', level: 3 },
]

// Reihenfolge nach der Regel der Gruppe (aufsteigend)
export function orderByRule(ids: readonly string[], rule: BoilRule): string[] {
  const subs = ids.map(zmkById)
  const byMass = (a: ZmkSubstance, b: ZmkSubstance) => molarMassOf(a) - molarMassOf(b)
  const byForce = (a: ZmkSubstance, b: ZmkSubstance) => FORCE_RANK[forceOf(a)] - FORCE_RANK[forceOf(b)]
  const sorted = [...subs].sort(rule === 'mass' ? byMass : rule === 'force' ? byForce : (a, b) => byForce(a, b) || byMass(a, b))
  return sorted.map((x) => x.id)
}

// Reihenfolge nach den Siedepunkten (aufsteigend)
export const orderByBoil = (ids: readonly string[]) => [...ids].sort((a, b) => zmkById(a).boil - zmkById(b).boil)
