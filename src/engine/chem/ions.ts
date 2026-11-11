// Ionen für Salz-Aufgaben (Plan M4, Thema 3.1): Kationen und Anionen mit Namen, Ladung und Formel, dazu
// welche Salze die Erzeuger bilden dürfen. Nur Salze, die es als Stoff gibt (keine Formel nach der
// Wertigkeitsregel ohne echten Stoff dahinter, docs/CHEMIE.md §6: kein Pb, Bi, Po, Sn), und nur
// Hauptgruppen-Ionen sowie die üblichen Nebengruppen-Ionen mit römischer Ziffer.

export type Ion = {
  readonly id: string
  // Formel ohne Ladung, wie in mhchem: „Na", „SO4", „NH4"
  readonly formula: string
  // mit Vorzeichen
  readonly charge: number
  // Kation: Name im Salz („Natrium", „Eisen(III)"); Anion: Endung („chlorid", „sulfat")
  readonly name: string
  // aus mehreren Atomen (Molekül-Ion): braucht im Salz Klammern, wenn mehr als eines darin steckt
  readonly polyatomic: boolean
  // ab dieser Stufe in Aufgaben
  readonly level: 1 | 2
}

const ion = (id: string, formula: string, charge: number, name: string, level: 1 | 2, polyatomic = false): Ion => ({ id, formula, charge, name, level, polyatomic })

export const CATIONS: readonly Ion[] = [
  ion('Li', 'Li', 1, 'Lithium', 1),
  ion('Na', 'Na', 1, 'Natrium', 1),
  ion('K', 'K', 1, 'Kalium', 1),
  ion('Mg', 'Mg', 2, 'Magnesium', 1),
  ion('Ca', 'Ca', 2, 'Calcium', 1),
  ion('Sr', 'Sr', 2, 'Strontium', 1),
  ion('Ba', 'Ba', 2, 'Barium', 1),
  ion('Rb', 'Rb', 1, 'Rubidium', 1),
  ion('Cs', 'Cs', 1, 'Caesium', 1),
  ion('Al', 'Al', 3, 'Aluminium', 1),
  ion('Zn', 'Zn', 2, 'Zink', 1),
  ion('Ag', 'Ag', 1, 'Silber', 2),
  ion('NH4', 'NH4', 1, 'Ammonium', 2, true),
  ion('Fe2', 'Fe', 2, 'Eisen(II)', 2),
  ion('Fe3', 'Fe', 3, 'Eisen(III)', 2),
  ion('Cu1', 'Cu', 1, 'Kupfer(I)', 2),
  ion('Cu2', 'Cu', 2, 'Kupfer(II)', 2),
  ion('Cr3', 'Cr', 3, 'Chrom(III)', 2),
  ion('Mn2', 'Mn', 2, 'Mangan(II)', 2),
]

export const ANIONS: readonly Ion[] = [
  ion('F', 'F', -1, 'fluorid', 1),
  ion('Cl', 'Cl', -1, 'chlorid', 1),
  ion('Br', 'Br', -1, 'bromid', 1),
  ion('I', 'I', -1, 'iodid', 1),
  ion('O', 'O', -2, 'oxid', 1),
  ion('S', 'S', -2, 'sulfid', 1),
  ion('N', 'N', -3, 'nitrid', 1),
  ion('P', 'P', -3, 'phosphid', 1),
  ion('OH', 'OH', -1, 'hydroxid', 2, true),
  ion('NO3', 'NO3', -1, 'nitrat', 2, true),
  ion('NO2', 'NO2', -1, 'nitrit', 2, true),
  ion('SO4', 'SO4', -2, 'sulfat', 2, true),
  ion('SO3', 'SO3', -2, 'sulfit', 2, true),
  ion('CO3', 'CO3', -2, 'carbonat', 2, true),
  ion('HCO3', 'HCO3', -1, 'hydrogencarbonat', 2, true),
  ion('PO4', 'PO4', -3, 'phosphat', 2, true),
]

// Anion → Kationen, mit denen es ein echtes, bekanntes Salz bildet (Ausschlüsse mit Grund: Kupfer(I) nur
// mit Halogeniden außer Fluorid sowie Oxid und Sulfid; FeI₃, CuI₂, Fe₂S₃, Cr₂S₃ gibt es nicht als
// beständige Stoffe; Nitride und Phosphide nur der leichten Hauptgruppenmetalle (Zink- und Aluminiumphosphid
// sind eher Halbleiter mit Atombindung; Aluminiumnitrid wie im Skript); Hydrogencarbonate fest nur von
// Alkalimetallen und Ammonium; Ammonium nicht mit Oxid, Hydroxid, Sulfid, Nitrid, Phosphid, Nitrit und
// Phosphat (gibt Ammoniak ab); kein Caesiumphosphid Cs3P)
const ALLOWED: Readonly<Record<string, readonly string[]>> = {
  F: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Zn', 'Ag', 'NH4', 'Fe2', 'Fe3', 'Cu2', 'Cr3', 'Mn2'],
  Cl: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Zn', 'Ag', 'NH4', 'Fe2', 'Fe3', 'Cu1', 'Cu2', 'Cr3', 'Mn2'],
  Br: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Zn', 'Ag', 'NH4', 'Fe2', 'Fe3', 'Cu1', 'Cu2', 'Cr3', 'Mn2'],
  I: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Zn', 'Ag', 'NH4', 'Fe2', 'Cu1', 'Cr3', 'Mn2'],
  O: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Zn', 'Ag', 'Fe2', 'Fe3', 'Cu1', 'Cu2', 'Cr3', 'Mn2'],
  S: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Zn', 'Ag', 'Fe2', 'Cu1', 'Cu2', 'Mn2'],
  N: ['Li', 'Mg', 'Ca', 'Sr', 'Ba', 'Al'],
  P: ['Li', 'Na', 'K', 'Mg', 'Ca', 'Sr'],
  OH: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Zn', 'Fe2', 'Fe3', 'Cu2', 'Cr3', 'Mn2'],
  NO3: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Zn', 'Ag', 'NH4', 'Fe2', 'Fe3', 'Cu2', 'Cr3', 'Mn2'],
  NO2: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Ag'],
  SO4: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Zn', 'Ag', 'NH4', 'Fe2', 'Fe3', 'Cu2', 'Cr3', 'Mn2'],
  SO3: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Zn', 'NH4'],
  CO3: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Zn', 'Ag', 'NH4', 'Fe2', 'Mn2'],
  HCO3: ['Na', 'K', 'Rb', 'Cs', 'NH4'],
  PO4: ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Al', 'Zn', 'Ag', 'Fe2', 'Fe3', 'Cu2', 'Cr3', 'Mn2'],
}

export const isAllowedSalt = (cation: Ion, anion: Ion) => ALLOWED[anion.id]?.includes(cation.id) ?? false

// In Wasser gut löslich (für „in Wasser gelöst"): Salze der Alkalimetalle und des Ammoniums, alle Nitrate;
// Chloride, Bromide und Iodide außer Silber und Kupfer(I); Sulfate außer Barium, Strontium, Calcium und Silber;
// Hydroxide von Barium und Strontium. Oxide, Nitride, Phosphide und Sulfide reagieren mit Wasser (S2- wird zu
// HS-) und kommen hier nie vor; Aluminium nur als Nitrat und Sulfat (die Halogenide reagieren heftig).
export function isSoluble(cation: Ion, anion: Ion): boolean {
  if (['O', 'N', 'P', 'S'].includes(anion.id)) return false
  if (cation.id === 'Al') return ['NO3', 'SO4'].includes(anion.id)
  if (['Li', 'Na', 'K', 'Rb', 'Cs', 'NH4'].includes(cation.id)) return !(cation.id === 'Li' && ['F', 'CO3', 'PO4'].includes(anion.id))
  if (anion.id === 'NO3') return true
  if (['Cl', 'Br', 'I'].includes(anion.id)) return !['Ag', 'Cu1'].includes(cation.id)
  if (anion.id === 'SO4') return !['Ba', 'Sr', 'Ca', 'Ag'].includes(cation.id)
  if (anion.id === 'OH') return ['Ba', 'Sr'].includes(cation.id)
  return false
}

// Schmelzflusselektrolyse und Schmelzen ohne Zersetzung: Halogenide der Alkali- und Erdalkalimetalle, Oxide
// von Lithium, Natrium und den Erdalkalimetallen (K2O, Rb2O und Cs2O zersetzen sich vor dem Schmelzen), dazu
// Aluminiumoxid (gelöst in Kryolith, wie in der Technik)
export function meltsAsIons(cation: Ion, anion: Ion): boolean {
  if (cation.id === 'Al') return anion.id === 'O'
  if (anion.id === 'O' && ['K', 'Rb', 'Cs'].includes(cation.id)) return false
  return ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba'].includes(cation.id) && ['F', 'Cl', 'Br', 'I', 'O'].includes(anion.id)
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

// Indizes des Salzes: kleinstes gemeinsames Vielfaches der Ladungen
export function saltIndices(cation: Ion, anion: Ion): { cation: number; anion: number } {
  const g = gcd(cation.charge, -anion.charge)
  return { cation: -anion.charge / g, anion: cation.charge / g }
}

// Teil einer Formel mit Index; Molekül-Ionen mit mehr als einem in Klammern (bracket: false wie der Fehler
// „Klammer vergessen")
export function part(i: Ion, count: number, bracket = true): string {
  if (count === 1) return i.formula
  return i.polyatomic && bracket ? `(${i.formula})${count}` : `${i.formula}${count}`
}

export const saltFormula = (cation: Ion, anion: Ion, counts = saltIndices(cation, anion), bracket = true) =>
  `${part(cation, counts.cation, bracket)}${part(anion, counts.anion, bracket)}`

// Name des Salzes: „Natriumchlorid", „Eisen(III)-chlorid" (mit römischer Ziffer ein Bindestrich)
export const saltName = (cation: Ion, anion: Ion, cationName = cation.name) => (cationName.endsWith(')') ? `${cationName}-${anion.name}` : `${cationName}${anion.name}`)

// Ion mit Ladung für mhchem: „Al^3+", „SO4^2-", „Na+"
export function ionCe(i: Ion, charge = i.charge): string {
  const size = Math.abs(charge)
  const sign = charge > 0 ? '+' : '-'
  return `${i.formula}^${size === 1 ? '' : size}${sign}`
}

export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
