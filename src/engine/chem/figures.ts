// Bilder zu Chemie-Fragen und Lernkarten (Wunsch des Nutzers, Plan M4 S5): aus Daten gezeichnet, nicht von
// Hand. Die Engine liefert die Lage der Teilchen; die Oberfläche (ui/chem/ChemFigure.tsx) zeichnet sie.

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

export type ChemFigure = LatticeFigure

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

export const figureById = (id: string): ChemFigure | undefined => FIGURES.find((f) => f.id === id)

// Koordinationszahl des hervorgehobenen Ions: Zahl seiner nächsten Nachbarn
export const coordinationOf = (f: LatticeFigure) => f.bonds.filter(([a, b]) => a === f.center || b === f.center).length
