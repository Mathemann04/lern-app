import { atomCounts, parseFormula } from './formula.ts'

// Moleküle für das Thema „Moleküle" (Plan M4, Thema 3.2): feste Daten mit Tests (molecules.test.ts). Je Molekül
// die Atome mit ihrer Lage für die Lewis-Formel (x nach rechts, y nach unten, Bindungslänge etwa 1) und die
// Bindungen mit Bindungsordnung. Freie Elektronenpaare, Elektronenzahl, Typ AXₙEₘ und Gestalt rechnet die
// Engine daraus; von Hand steht nur, was sich nicht rechnen lässt: Name, Stufe, ob das Molekül ein Dipol ist
// (CHEMIE.md §5: gespeicherter Wert) und markierte Ausnahmen.
//
// Nur Moleküle ohne Formalladungen: Freie Paare je Atom = (Valenzelektronen − Bindungen) / 2. Ausnahmen der
// Oktettregel sind markiert: Bor mit sechs Elektronen (BF₃, BCl₃), erweitertes Oktett (SO₂, PCl₅, SF₆; nur
// Gestalt und Polarität, keine Lewis-Formel, CHEMIE.md §6).

export type MolAtom = { readonly el: string; readonly x: number; readonly y: number }
// [Atom a, Atom b, Bindungsordnung]
export type MolBond = readonly [number, number, 1 | 2 | 3]

export type Molecule = {
  // fest, nie umbenennen: Summenformel wie in der Aufgabe (für mhchem und parseFormula)
  readonly id: string
  // Name (Text), z. B. „Wasser"; leer, wenn die Formel allein üblich ist
  readonly name: string
  // ab dieser Stufe kommt das Molekül vor
  readonly level: 1 | 2 | 3
  readonly atoms: readonly MolAtom[]
  readonly bonds: readonly MolBond[]
  // Zentralatom (Index) für die Gestalt; ohne Angabe keine Frage nach der Gestalt
  readonly central?: number
  // Dipolmolekül? null: wird nicht gefragt (kleine ΔEN, trotzdem Dipol, CHEMIE.md §6)
  readonly dipole: boolean | null
  // Bor mit sechs Elektronen: Die Aufgabe weist darauf hin
  readonly sextet?: true
  // erweitertes Oktett: keine Lewis-Formel abfragen
  readonly expanded?: true
}

export const VALENCE: Readonly<Record<string, number>> = { H: 1, B: 3, C: 4, N: 5, O: 6, F: 7, Si: 4, P: 5, S: 6, Cl: 7, Br: 7, I: 7 }

const W = 0.8
const H = 0.6
const SIN60 = 0.87

const m = (id: string, name: string, level: 1 | 2 | 3, atoms: [string, number, number][], bonds: MolBond[], extra: Partial<Molecule> & { dipole: boolean | null }): Molecule => ({
  id,
  name,
  level,
  atoms: atoms.map(([el, x, y]) => ({ el, x, y })),
  bonds,
  ...extra,
})

// Zweiatomig: a–b nebeneinander
const diatomic = (id: string, name: string, level: 1 | 2 | 3, a: string, b: string, order: 1 | 2 | 3, dipole: boolean | null) =>
  m(id, name, level, [[a, 0, 0], [b, 1, 0]], [[0, 1, order]], { dipole })

// Gewinkelt gezeichnet: Zentralatom oben, zwei Partner schräg darunter
const bent = (id: string, name: string, level: 1 | 2 | 3, c: string, l: string, r: string, dipole: boolean | null, orders: [1 | 2, 1 | 2] = [1, 1], extra: Partial<Molecule> = {}) =>
  m(id, name, level, [[c, 0, 0], [l, -W, H], [r, W, H]], [[0, 1, orders[0]], [0, 2, orders[1]]], { central: 0, dipole, ...extra })

// Drei Partner: links, rechts, unten (Paar oben)
const pyramid = (id: string, name: string, level: 1 | 2 | 3, c: string, x: string, dipole: boolean | null) =>
  m(id, name, level, [[c, 0, 0], [x, -1, 0], [x, 1, 0], [x, 0, 1]], [[0, 1, 1], [0, 2, 1], [0, 3, 1]], { central: 0, dipole })

// Vier Partner im Kreuz: oben, rechts, unten, links
const cross = (id: string, name: string, level: 1 | 2 | 3, c: string, ligands: [string, string, string, string], dipole: boolean | null) =>
  m(
    id,
    name,
    level,
    [[c, 0, 0], [ligands[0], 0, -1], [ligands[1], 1, 0], [ligands[2], 0, 1], [ligands[3], -1, 0]],
    [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
    { central: 0, dipole },
  )

// Drei Partner im Dreieck: oben, links unten, rechts unten
const trigonal = (id: string, name: string, level: 1 | 2 | 3, c: string, top: string, side: string, topOrder: 1 | 2, dipole: boolean | null, extra: Partial<Molecule> = {}) =>
  m(id, name, level, [[c, 0, 0], [top, 0, -1], [side, -SIN60, 0.5], [side, SIN60, 0.5]], [[0, 1, topOrder], [0, 2, 1], [0, 3, 1]], { central: 0, dipole, ...extra })

// Linear mit Zentralatom in der Mitte
const linear = (id: string, name: string, level: 1 | 2 | 3, l: string, c: string, r: string, orders: [1 | 2 | 3, 1 | 2 | 3], dipole: boolean | null) =>
  m(id, name, level, [[l, -1, 0], [c, 0, 0], [r, 1, 0]], [[1, 0, orders[0]], [1, 2, orders[1]]], { central: 1, dipole })

export const MOLECULES: readonly Molecule[] = [
  // ---------------------------------------------------------------- Grundlagen
  diatomic('H2', 'Wasserstoff', 1, 'H', 'H', 1, false),
  diatomic('F2', 'Fluor', 1, 'F', 'F', 1, false),
  diatomic('Cl2', 'Chlor', 1, 'Cl', 'Cl', 1, false),
  diatomic('Br2', 'Brom', 1, 'Br', 'Br', 1, false),
  diatomic('HF', 'Fluorwasserstoff', 1, 'H', 'F', 1, true),
  diatomic('HCl', 'Chlorwasserstoff', 1, 'H', 'Cl', 1, true),
  diatomic('HBr', 'Bromwasserstoff', 1, 'H', 'Br', 1, true),
  bent('H2O', 'Wasser', 1, 'O', 'H', 'H', true),
  bent('H2S', 'Schwefelwasserstoff', 1, 'S', 'H', 'H', null),
  pyramid('NH3', 'Ammoniak', 1, 'N', 'H', true),
  pyramid('PH3', 'Phosphan', 1, 'P', 'H', null),
  cross('CH4', 'Methan', 1, 'C', ['H', 'H', 'H', 'H'], false),
  cross('SiH4', 'Silan', 1, 'Si', ['H', 'H', 'H', 'H'], false),
  cross('CCl4', 'Tetrachlormethan', 1, 'C', ['Cl', 'Cl', 'Cl', 'Cl'], false),
  linear('CO2', 'Kohlenstoffdioxid', 1, 'O', 'C', 'O', [2, 2], false),

  // ---------------------------------------------------------------- Vertiefung
  diatomic('N2', 'Stickstoff', 2, 'N', 'N', 3, false),
  // O₂ steht im Skript Kovalente Bindung (Folie 4) bei den Mehrfachbindungen: O=O mit je zwei freien Paaren
  diatomic('O2', 'Sauerstoff', 2, 'O', 'O', 2, false),
  linear('CS2', 'Kohlenstoffdisulfid', 2, 'S', 'C', 'S', [2, 2], false),
  // HCN und NOCl: Mit Pauling-Werten sind alle Bindungen (nahezu) unpolar, die Moleküle trotzdem Dipole (CHEMIE.md §6)
  linear('HCN', 'Blausäure', 2, 'H', 'C', 'N', [1, 3], null),
  trigonal('CH2O', 'Formaldehyd', 2, 'C', 'O', 'H', 2, true),
  trigonal('COCl2', 'Phosgen', 2, 'C', 'O', 'Cl', 2, true),
  trigonal('BF3', 'Bortrifluorid', 2, 'B', 'F', 'F', 1, false, { sextet: true }),
  trigonal('BCl3', 'Bortrichlorid', 2, 'B', 'Cl', 'Cl', 1, false, { sextet: true }),
  pyramid('PCl3', 'Phosphortrichlorid', 1, 'P', 'Cl', true),
  pyramid('NF3', 'Stickstofftrifluorid', 1, 'N', 'F', true),
  pyramid('NCl3', 'Stickstofftrichlorid', 1, 'N', 'Cl', null),
  bent('OF2', 'Sauerstoffdifluorid', 1, 'O', 'F', 'F', null),
  bent('SCl2', 'Schwefeldichlorid', 1, 'S', 'Cl', 'Cl', null),
  bent('HOCl', 'Hypochlorige Säure', 1, 'O', 'H', 'Cl', true),
  bent('NOCl', 'Nitrosylchlorid', 2, 'N', 'Cl', 'O', null, [1, 2]),
  cross('CHCl3', 'Trichlormethan', 1, 'C', ['H', 'Cl', 'Cl', 'Cl'], true),
  cross('CH2Cl2', 'Dichlormethan', 1, 'C', ['H', 'Cl', 'H', 'Cl'], true),
  cross('CH3Cl', 'Chlormethan', 1, 'C', ['H', 'Cl', 'H', 'H'], true),
  cross('CF4', 'Tetrafluormethan', 1, 'C', ['F', 'F', 'F', 'F'], false),
  cross('SiCl4', 'Siliciumtetrachlorid', 1, 'Si', ['Cl', 'Cl', 'Cl', 'Cl'], false),
  // mehrere Zentren: nur Lewis-Formel und Paare, keine Frage nach der Gestalt
  m('C2H4', 'Ethen', 2, [['C', 0, 0], ['C', 1, 0], ['H', -0.7, -0.7], ['H', -0.7, 0.7], ['H', 1.7, -0.7], ['H', 1.7, 0.7]], [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]], { dipole: false }),
  m('C2H2', 'Ethin', 2, [['H', -1, 0], ['C', 0, 0], ['C', 1, 0], ['H', 2, 0]], [[0, 1, 1], [1, 2, 3], [2, 3, 1]], { dipole: false }),
  m('C2H6', 'Ethan', 1, [['C', 0, 0], ['C', 1, 0], ['H', -1, 0], ['H', 0, -1], ['H', 0, 1], ['H', 2, 0], ['H', 1, -1], ['H', 1, 1]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]], { dipole: false }),
  m('CH3OH', 'Methanol', 1, [['C', 0, 0], ['O', 1, 0], ['H', -1, 0], ['H', 0, -1], ['H', 0, 1], ['H', 1.7, 0.7]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1]], { dipole: true }),
  m('H2O2', 'Wasserstoffperoxid', 1, [['H', -1, 0], ['O', 0, 0], ['O', 1, 0], ['H', 2, 0]], [[0, 1, 1], [1, 2, 1], [2, 3, 1]], { dipole: true }),
  m('N2H4', 'Hydrazin', 2, [['N', 0, 0], ['N', 1, 0], ['H', -0.7, -0.7], ['H', -0.7, 0.7], ['H', 1.7, -0.7], ['H', 1.7, 0.7]], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]], { dipole: true }),

  // ---------------------------------------------------------------- Klausurniveau: erweitertes Oktett, nur Gestalt
  bent('SO2', 'Schwefeldioxid', 3, 'S', 'O', 'O', true, [2, 2], { expanded: true }),
  m(
    'PCl5',
    'Phosphorpentachlorid',
    3,
    [['P', 0, 0], ['Cl', 0, -1], ['Cl', 0, 1], ['Cl', -1, 0], ['Cl', 0.7, -0.5], ['Cl', 0.7, 0.5]],
    [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1]],
    { central: 0, dipole: false, expanded: true },
  ),
  m(
    'SF6',
    'Schwefelhexafluorid',
    3,
    [['S', 0, 0], ['F', 0, -1], ['F', 0, 1], ['F', -1, 0], ['F', 1, 0], ['F', -0.6, -0.6], ['F', 0.6, 0.6]],
    [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1]],
    { central: 0, dipole: false, expanded: true },
  ),
]

const BY_ID = new Map(MOLECULES.map((mol) => [mol.id, mol]))
export const moleculeById = (id: string): Molecule | undefined => BY_ID.get(id)

// Summe der Bindungsordnungen eines Atoms
export const bondsOf = (mol: Molecule, i: number) => mol.bonds.reduce((sum, [a, b, order]) => sum + (a === i || b === i ? order : 0), 0)

// Zahl der Bindungspartner eines Atoms (Doppelbindung zählt einmal)
export const partnersOf = (mol: Molecule, i: number) => mol.bonds.filter(([a, b]) => a === i || b === i).length

// Freie Elektronenpaare eines Atoms (ohne Formalladung)
export const lonePairsOf = (mol: Molecule, i: number) => (VALENCE[mol.atoms[i].el] - bondsOf(mol, i)) / 2

// Valenzelektronen des ganzen Moleküls
export const valenceElectrons = (mol: Molecule) => mol.atoms.reduce((sum, a) => sum + VALENCE[a.el], 0)

// bindende und freie Elektronenpaare im ganzen Molekül
export const bondingPairs = (mol: Molecule) => mol.bonds.reduce((sum, [, , order]) => sum + order, 0)
export const freePairs = (mol: Molecule) => mol.atoms.reduce((sum, _, i) => sum + lonePairsOf(mol, i), 0)

// Elektronen um ein Atom (bindende Paare zählen voll)
export const electronsAround = (mol: Molecule, i: number) => 2 * bondsOf(mol, i) + 2 * lonePairsOf(mol, i)

// Atome je Element, wie in der Summenformel
export const countsOf = (mol: Molecule) => {
  const counts = new Map<string, number>()
  for (const a of mol.atoms) counts.set(a.el, (counts.get(a.el) ?? 0) + 1)
  return counts
}
export const formulaCounts = (mol: Molecule) => atomCounts(parseFormula(mol.id))

// ---------------------------------------------------------------- Gestalt nach dem Elektronenpaar-Abstoßungsmodell

export type Shape = 'linear' | 'gewinkelt' | 'trigonal-planar' | 'trigonal-pyramidal' | 'tetraedrisch' | 'trigonal-bipyramidal' | 'oktaedrisch'

// Typ AXₙEₘ (n Bindungspartner, m freie Paare am Zentralatom) → Gestalt der Atome
export function shapeOf(x: number, e: number): Shape {
  const domains = x + e
  if (x <= 1) return 'linear'
  if (domains === 2) return 'linear'
  if (domains === 3) return e === 0 ? 'trigonal-planar' : 'gewinkelt'
  if (domains === 4) return e === 0 ? 'tetraedrisch' : e === 1 ? 'trigonal-pyramidal' : 'gewinkelt'
  if (domains === 5 && e === 0) return 'trigonal-bipyramidal'
  if (domains === 6 && e === 0) return 'oktaedrisch'
  throw new Error(`Typ AX${x}E${e} kommt nicht vor`)
}

// Anordnung aller Elektronenpaare (bindende und freie) um das Zentralatom
export function arrangementOf(x: number, e: number): Shape {
  return shapeOf(x + e, 0)
}

// Bindungswinkel als Text mit Formel; kleiner als der ideale Winkel, wenn freie Paare da sind. null: Typ ohne
// einfache Winkelangabe (ab fünf Paaren) oder ohne Gestalt
export function angleOf(x: number, e: number): string | null {
  const domains = x + e
  if (domains === 2) return '$180^\\circ$'
  if (domains === 3) return e === 0 ? '$120^\\circ$' : 'kleiner als $120^\\circ$'
  if (domains === 4) return e === 0 ? '$109{,}5^\\circ$' : 'kleiner als $109{,}5^\\circ$'
  return null
}

export const typeLatex = (x: number, e: number) => String.raw`\mathrm{AX${x === 1 ? '' : `_{${x}}`}${e === 0 ? '' : e === 1 ? 'E' : `E_{${e}}`}}`

// Typ des Moleküls am Zentralatom
export function vseprOf(mol: Molecule): { x: number; e: number; shape: Shape } {
  if (mol.central === undefined) throw new Error(`${mol.id} hat kein Zentralatom`)
  const x = partnersOf(mol, mol.central)
  const e = lonePairsOf(mol, mol.central)
  return { x, e, shape: shapeOf(x, e) }
}

export const moleculeCe = (mol: Molecule) => String.raw`\ce{${mol.id}}`
