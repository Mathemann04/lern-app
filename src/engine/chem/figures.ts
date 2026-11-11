// Bilder zu Chemie-Fragen und Lernkarten (Wunsch des Nutzers, Plan M4 S5): aus Daten gezeichnet, nicht von
// Hand. Die Engine liefert die Lage der Teilchen; die Oberfläche (ui/chem/ChemFigure.tsx) zeichnet sie.

import { type BoxRow, boxRowsText, parseBoxFigureId, subshellName } from './electrons.ts'
import { type LewisFigure, lewisFigureById } from './lewis.ts'
import { type MolBond, type Molecule, moleculeById, vseprOf } from './molecules.ts'

// Ionengitter: Elementarzelle mit Kationen und Anionen in Koordinaten von 0 bis 1 (Würfelkante 1)
export type LatticeIon = { readonly x: number; readonly y: number; readonly z: number; readonly kind: 'cation' | 'anion' }

export type LatticeFigure = {
  readonly kind: 'lattice'
  readonly id: string
  // Beschreibung für Vorlesehilfen und unter dem Bild (Text mit Formeln)
  readonly caption: string
  // Ionen mit Ladung für mhchem, z. B. „Na+"
  readonly cation: string
  readonly anion: string
  // Größe der Kugeln im Verhältnis (ungefähr wie die Ionenradien)
  readonly cationRadius: number
  readonly anionRadius: number
  readonly ions: readonly LatticeIon[]
  // Linien zwischen nächsten Nachbarn (Indizes in ions)
  readonly bonds: readonly (readonly [number, number])[]
  // hervorgehobenes Ion mit seinen Nachbarn (Koordinationspolyeder)
  readonly center: number
}

// Räumlicher Bau eines Moleküls (Gestalt nach dem Elektronenpaar-Abstoßungsmodell): Zentralatom im Ursprung,
// Partner und freie Paare in den Richtungen des Modells (x nach rechts, y nach oben, z zum Betrachter)
export type ShapeFigure = {
  readonly kind: 'shape'
  readonly id: string
  readonly caption: string
  readonly atoms: readonly { readonly el: string; readonly x: number; readonly y: number; readonly z: number }[]
  // [Zentralatom 0, Partner, Bindungsordnung]
  readonly bonds: readonly MolBond[]
  // Richtungen der freien Paare am Zentralatom
  readonly lobes: readonly { readonly x: number; readonly y: number; readonly z: number }[]
}

// Kästchenschreibweise: je Unterschale eine Reihe Kästchen (Orbitale) mit Pfeilen (Elektronen und Spin), links
// der Edelgaskern; aus der Id gelesen (electrons.ts, boxFigureId), auch für falsche Besetzungen als Antworten
export type BoxFigure = {
  readonly kind: 'boxes'
  readonly id: string
  readonly caption: string
  // die Besetzung in Worten (für Vorlesehilfen)
  readonly description: string
  // Edelgaskern (Symbol) oder leer
  readonly core: string
  readonly rows: readonly BoxRow[]
}

export type ChemFigure = LatticeFigure | LewisFigure | ShapeFigure | BoxFigure

export function boxFigureById(id: string): BoxFigure | null {
  const parsed = parseBoxFigureId(id)
  if (!parsed) return null
  const shells = parsed.rows.map((r) => subshellName(r.shell)).join(', ')
  return {
    kind: 'boxes',
    id,
    caption: `Kästchenschreibweise${parsed.core ? String.raw` mit Edelgaskern $[\mathrm{${parsed.core}}]$` : ''}: ${shells}. Jedes Kästchen ist ein Orbital, jeder Pfeil ein Elektron.`,
    description: boxRowsText(parsed.core, parsed.rows),
    core: parsed.core,
    rows: parsed.rows,
  }
}

const distance = (a: LatticeIon, b: LatticeIon) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

// Linien zwischen Kation und Anion im kleinsten vorkommenden Abstand
function nearestBonds(ions: readonly LatticeIon[]): [number, number][] {
  let min = Infinity
  for (const [i, a] of ions.entries()) for (const b of ions.slice(i + 1)) if (a.kind !== b.kind) min = Math.min(min, distance(a, b))
  const bonds: [number, number][] = []
  for (const [i, a] of ions.entries())
    for (const [j, b] of ions.entries()) if (j > i && a.kind !== b.kind && Math.abs(distance(a, b) - min) < 1e-9) bonds.push([i, j])
  return bonds
}

const grid = (steps: readonly number[]) => steps.flatMap((x) => steps.flatMap((y) => steps.map((z) => ({ x, y, z }))))
const cornersAndFaces = grid([0, 0.5, 1]).filter((p) => [p.x, p.y, p.z].filter((v) => v === 0.5).length % 2 === 0 && [p.x, p.y, p.z].filter((v) => v === 0.5).length < 3)

function lattice(spec: Omit<LatticeFigure, 'kind' | 'bonds' | 'center'> & { centerAt: { x: number; y: number; z: number } }): LatticeFigure {
  const { centerAt, ...rest } = spec
  const center = spec.ions.findIndex((i) => i.x === centerAt.x && i.y === centerAt.y && i.z === centerAt.z)
  return { kind: 'lattice', ...rest, bonds: nearestBonds(spec.ions), center }
}

// Natriumchlorid: Chlorid auf Ecken und Flächenmitten, Natrium auf Kantenmitten und in der Mitte
const NACL = lattice({
  id: 'gitter-nacl',
  caption: String.raw`Elementarzelle von Natriumchlorid: kleine Kugeln $\ce{Na+}$, große Kugeln $\ce{Cl-}$. Das Natrium-Ion in der Mitte ist hervorgehoben.`,
  cation: 'Na+',
  anion: 'Cl-',
  cationRadius: 0.55,
  anionRadius: 1,
  ions: grid([0, 0.5, 1]).map((p) => ({ ...p, kind: ((p.x + p.y + p.z) * 2) % 2 === 1 ? ('cation' as const) : ('anion' as const) })),
  centerAt: { x: 0.5, y: 0.5, z: 0.5 },
})

// Caesiumchlorid: Chlorid auf den Ecken, Caesium in der Mitte
const CSCL = lattice({
  id: 'gitter-cscl',
  caption: String.raw`Elementarzelle von Caesiumchlorid: Kugel in der Mitte $\ce{Cs+}$, Kugeln auf den Ecken $\ce{Cl-}$.`,
  cation: 'Cs+',
  anion: 'Cl-',
  cationRadius: 0.9,
  anionRadius: 1,
  ions: [...grid([0, 1]).map((p) => ({ ...p, kind: 'anion' as const })), { x: 0.5, y: 0.5, z: 0.5, kind: 'cation' as const }],
  centerAt: { x: 0.5, y: 0.5, z: 0.5 },
})

// Zinkblende: Sulfid auf Ecken und Flächenmitten, Zink in vier der acht Achtelwürfel
const ZNS = lattice({
  id: 'gitter-zns',
  caption: String.raw`Elementarzelle von Zinkblende: kleine Kugeln $\ce{Zn^2+}$, große Kugeln $\ce{S^2-}$. Ein Zink-Ion ist hervorgehoben.`,
  cation: 'Zn^2+',
  anion: 'S^2-',
  cationRadius: 0.5,
  anionRadius: 1,
  ions: [
    ...cornersAndFaces.map((p) => ({ ...p, kind: 'anion' as const })),
    ...[
      [0.25, 0.25, 0.25],
      [0.75, 0.75, 0.25],
      [0.75, 0.25, 0.75],
      [0.25, 0.75, 0.75],
    ].map(([x, y, z]) => ({ x, y, z, kind: 'cation' as const })),
  ],
  centerAt: { x: 0.25, y: 0.25, z: 0.25 },
})

export const FIGURES: readonly ChemFigure[] = [NACL, CSCL, ZNS]

export function figureById(id: string): ChemFigure | undefined {
  if (id.startsWith('lewis:')) return lewisFigureById(id) ?? undefined
  if (id.startsWith('gestalt:')) return shapeFigureById(id) ?? undefined
  if (id.startsWith('kaestchen:')) return boxFigureById(id) ?? undefined
  return FIGURES.find((f) => f.id === id)
}

// ---------------------------------------------------------------- Gestalt der Moleküle

type Vec = { x: number; y: number; z: number }
const v = (x: number, y: number, z: number): Vec => ({ x, y, z })
const deg = (a: number) => (a * Math.PI) / 180
// Tetraeder mit einer Ecke oben: die übrigen drei unten, eine davon zum Betrachter
const TETRA_LOW = [90, 210, 330].map((p) => v((Math.sqrt(8) / 3) * Math.cos(deg(p)), -1 / 3, (Math.sqrt(8) / 3) * Math.sin(deg(p))))
// gewinkelt AX₂E₂: Partner in der Bildebene unten, freie Paare oben vorn und hinten (halber Winkel 54,75°)
const HALF = deg(109.47 / 2)
const PLANAR = [90, 210, 330].map((p) => v(Math.cos(deg(p)), -Math.sin(deg(p)), 0))

// Richtungen der Partner und der freien Paare je Typ AXₙEₘ
function directions(x: number, e: number): { ligands: Vec[]; lobes: Vec[] } {
  const key = `${x}:${e}`
  switch (key) {
    case '2:0':
      return { ligands: [v(-1, 0, 0), v(1, 0, 0)], lobes: [] }
    case '3:0':
      return { ligands: PLANAR, lobes: [] }
    case '2:1':
      return { ligands: PLANAR.slice(1), lobes: [PLANAR[0]] }
    case '4:0':
      return { ligands: [v(0, 1, 0), ...TETRA_LOW], lobes: [] }
    case '3:1':
      return { ligands: TETRA_LOW, lobes: [v(0, 1, 0)] }
    case '2:2':
      return {
        ligands: [v(-Math.sin(HALF), -Math.cos(HALF), 0), v(Math.sin(HALF), -Math.cos(HALF), 0)],
        lobes: [v(0, Math.cos(HALF), Math.sin(HALF)), v(0, Math.cos(HALF), -Math.sin(HALF))],
      }
    case '5:0':
      return { ligands: [v(0, 1, 0), v(0, -1, 0), ...[90, 210, 330].map((p) => v(Math.cos(deg(p)), 0, Math.sin(deg(p))))], lobes: [] }
    case '6:0':
      return { ligands: [v(0, 1, 0), v(0, -1, 0), v(-1, 0, 0), v(1, 0, 0), v(0, 0, 1), v(0, 0, -1)], lobes: [] }
  }
  throw new Error(`Typ AX${x}E${e} hat kein Bild`)
}

export const shapeId = (mol: Molecule) => `gestalt:${mol.id}`

export function shapeFigureById(id: string): ShapeFigure | null {
  const mol = moleculeById(id.slice('gestalt:'.length))
  if (!mol || mol.central === undefined) return null
  const { x, e } = vseprOf(mol)
  const { ligands, lobes } = directions(x, e)
  const partners = mol.bonds.filter(([a, b]) => a === mol.central || b === mol.central)
  const atoms = [{ el: mol.atoms[mol.central].el, x: 0, y: 0, z: 0 }]
  const bonds: MolBond[] = []
  for (const [k, [a, b, order]] of partners.entries()) {
    const other = a === mol.central ? b : a
    atoms.push({ el: mol.atoms[other].el, ...ligands[k] })
    bonds.push([0, k + 1, order])
  }
  return {
    kind: 'shape',
    id,
    caption: String.raw`Räumlicher Bau von $\ce{${mol.id}}$: Kugeln sind Atome, Keulen freie Elektronenpaare am Zentralatom.`,
    atoms,
    bonds,
    lobes,
  }
}

// Koordinationszahl des hervorgehobenen Ions: Zahl seiner nächsten Nachbarn
export const coordinationOf = (f: LatticeFigure) => f.bonds.filter(([a, b]) => a === f.center || b === f.center).length
