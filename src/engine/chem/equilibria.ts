// Gasgleichgewichte für das Thema „Chemisches Gleichgewicht" (S7a, Plan M4 Thema 5.1). Alle Stoffe gasförmig (g); Gleichgewichte
// mit Feststoffen kommen vorerst nicht vor (docs/CHEMIE.md §6). Die Engine rechnet daraus Massenwirkungsgesetz, Zahl der
// Gasteilchen und die Richtung nach Le Chatelier.
//
// Reaktionsenthalpie ΔH in kJ für die Gleichung, wie sie dasteht: aus Standardbildungsenthalpien bei 298 K (NIST-JANAF-Tabellen
// bzw. NIST Chemistry WebBook), auf ganze kJ gerundet; Gegenprobe mit einer zweiten Liste in generators/mwg.test.ts.
// null: nie nach der Temperatur fragen, H₂ + I₂ ⇌ 2 HI wegen §6 (das Vorzeichen hängt vom Zustand des Iods ab), bei den übrigen
// gehen die Werte der Tabellenwerke zu weit auseinander.

export type EqSpecies = { readonly ce: string; readonly name: string; readonly coef: number }

export type Equilibrium = {
  // fest, nie umbenennen (steckt in den Formen der letzten Aufgaben)
  readonly id: string
  readonly left: readonly EqSpecies[]
  readonly right: readonly EqSpecies[]
  readonly dH: number | null
  // Name des Verfahrens, falls üblich
  readonly process?: string
}

const s = (coef: number, ce: string, name: string): EqSpecies => ({ ce, name, coef })

export const EQUILIBRIA: readonly Equilibrium[] = [
  { id: 'nh3', left: [s(1, 'N2', 'Stickstoff'), s(3, 'H2', 'Wasserstoff')], right: [s(2, 'NH3', 'Ammoniak')], dH: -92, process: 'Ammoniaksynthese' },
  { id: 'nh3-zerfall', left: [s(2, 'NH3', 'Ammoniak')], right: [s(1, 'N2', 'Stickstoff'), s(3, 'H2', 'Wasserstoff')], dH: 92 },
  { id: 'so3', left: [s(2, 'SO2', 'Schwefeldioxid'), s(1, 'O2', 'Sauerstoff')], right: [s(2, 'SO3', 'Schwefeltrioxid')], dH: -198 },
  { id: 'so3-zerfall', left: [s(2, 'SO3', 'Schwefeltrioxid')], right: [s(2, 'SO2', 'Schwefeldioxid'), s(1, 'O2', 'Sauerstoff')], dH: 198 },
  { id: 'hi', left: [s(1, 'H2', 'Wasserstoff'), s(1, 'I2', 'Iod')], right: [s(2, 'HI', 'Iodwasserstoff')], dH: null },
  { id: 'n2o4', left: [s(1, 'N2O4', 'Distickstofftetraoxid')], right: [s(2, 'NO2', 'Stickstoffdioxid')], dH: 57 },
  { id: 'no2-dimer', left: [s(2, 'NO2', 'Stickstoffdioxid')], right: [s(1, 'N2O4', 'Distickstofftetraoxid')], dH: -57 },
  { id: 'no', left: [s(1, 'N2', 'Stickstoff'), s(1, 'O2', 'Sauerstoff')], right: [s(2, 'NO', 'Stickstoffmonoxid')], dH: 181 },
  { id: 'no2', left: [s(2, 'NO', 'Stickstoffmonoxid'), s(1, 'O2', 'Sauerstoff')], right: [s(2, 'NO2', 'Stickstoffdioxid')], dH: -114 },
  { id: 'shift', left: [s(1, 'CO', 'Kohlenstoffmonoxid'), s(1, 'H2O', 'Wasserdampf')], right: [s(1, 'CO2', 'Kohlenstoffdioxid'), s(1, 'H2', 'Wasserstoff')], dH: -41 },
  { id: 'shift-rueck', left: [s(1, 'CO2', 'Kohlenstoffdioxid'), s(1, 'H2', 'Wasserstoff')], right: [s(1, 'CO', 'Kohlenstoffmonoxid'), s(1, 'H2O', 'Wasserdampf')], dH: 41 },
  { id: 'methanol', left: [s(1, 'CO', 'Kohlenstoffmonoxid'), s(2, 'H2', 'Wasserstoff')], right: [s(1, 'CH3OH', 'Methanol')], dH: -91, process: 'Methanolsynthese' },
  { id: 'reforming', left: [s(1, 'CH4', 'Methan'), s(1, 'H2O', 'Wasserdampf')], right: [s(1, 'CO', 'Kohlenstoffmonoxid'), s(3, 'H2', 'Wasserstoff')], dH: 206, process: 'Dampfreformierung' },
  { id: 'deacon', left: [s(4, 'HCl', 'Chlorwasserstoff'), s(1, 'O2', 'Sauerstoff')], right: [s(2, 'Cl2', 'Chlor'), s(2, 'H2O', 'Wasserdampf')], dH: -114, process: 'Deacon-Verfahren' },
  { id: 'ethan', left: [s(1, 'C2H4', 'Ethen'), s(1, 'H2', 'Wasserstoff')], right: [s(1, 'C2H6', 'Ethan')], dH: -136 },
  { id: 'ethen', left: [s(1, 'C2H6', 'Ethan')], right: [s(1, 'C2H4', 'Ethen'), s(1, 'H2', 'Wasserstoff')], dH: 136 },
  { id: 'propen', left: [s(1, 'C3H8', 'Propan')], right: [s(1, 'C3H6', 'Propen'), s(1, 'H2', 'Wasserstoff')], dH: 125 },
  { id: 'pcl5', left: [s(1, 'PCl5', 'Phosphorpentachlorid')], right: [s(1, 'PCl3', 'Phosphortrichlorid'), s(1, 'Cl2', 'Chlor')], dH: null },
  { id: 'cocl2', left: [s(1, 'CO', 'Kohlenstoffmonoxid'), s(1, 'Cl2', 'Chlor')], right: [s(1, 'COCl2', 'Phosgen')], dH: null },
  { id: 'nocl', left: [s(2, 'NO', 'Stickstoffmonoxid'), s(1, 'Cl2', 'Chlor')], right: [s(2, 'NOCl', 'Nitrosylchlorid')], dH: null },
]

export const equilibriumById = (id: string) => EQUILIBRIA.find((e) => e.id === id)

// Zahl der Gasteilchen einer Seite laut Koeffizienten bzw. (Fehler) als Zahl der Stoffe
export const gasCount = (side: readonly EqSpecies[]) => side.reduce((sum, x) => sum + x.coef, 0)
export const speciesCount = (side: readonly EqSpecies[]) => side.length

// Gleichung mit Zuständen und Doppelpfeil, z. B. „\ce{N2(g) + 3 H2(g) <=> 2 NH3(g)}"
const sideCe = (side: readonly EqSpecies[]) => side.map((x) => `${x.coef > 1 ? `${x.coef} ` : ''}${x.ce}(g)`).join(' + ')
export const equilibriumCe = (e: Equilibrium) => String.raw`\ce{${sideCe(e.left)} <=> ${sideCe(e.right)}}`

// Richtung, in die sich das Gleichgewicht verschiebt
export type Shift = 'right' | 'left' | 'none'
export const opposite = (d: Shift): Shift => (d === 'right' ? 'left' : d === 'left' ? 'right' : 'none')

// Druck erhöhen (up) oder senken: zur Seite mit weniger bzw. mehr Gasteilchen; count zählt die Teilchen (Fehler: Stoffe)
export function pressureShift(e: Equilibrium, up: boolean, count: (side: readonly EqSpecies[]) => number = gasCount): Shift {
  const l = count(e.left)
  const r = count(e.right)
  if (l === r) return 'none'
  const fewer: Shift = r < l ? 'right' : 'left'
  return up ? fewer : opposite(fewer)
}

// Temperatur erhöhen (up) oder senken: Erwärmen begünstigt die endotherme Richtung
export function temperatureShift(e: Equilibrium, up: boolean): Shift {
  if (e.dH === null) throw new Error(`keine Reaktionsenthalpie für ${e.id}`)
  const endo: Shift = e.dH > 0 ? 'right' : 'left'
  return up ? endo : opposite(endo)
}

// Konzentration eines Stoffs erhöhen (add) oder senken: Das Gleichgewicht weicht so aus, dass der Zwang kleiner wird
export function concentrationShift(e: Equilibrium, ce: string, add: boolean): Shift {
  const onLeft = e.left.some((x) => x.ce === ce)
  const away: Shift = onLeft ? 'right' : 'left'
  return add ? away : opposite(away)
}
