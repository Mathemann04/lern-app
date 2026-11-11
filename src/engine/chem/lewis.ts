import { type MolBond, type Molecule, VALENCE, lonePairsOf, moleculeById, partnersOf } from './molecules.ts'

// Lewis-Formeln als Bilder (Plan M4, S5b): aus den Moleküldaten gerechnet, richtig oder mit einem typischen Fehler.
// Bindende Paare sind Striche zwischen den Atomen, freie Paare Striche am Atom (deutsche Schreibweise). Die
// Oberfläche (ui/chem/ChemFigure.tsx) zeichnet sie; hier stehen Lage, Bindungen und die Richtungen der freien Paare.

export type LewisAtom = {
  readonly el: string
  readonly x: number
  readonly y: number
  // Richtungen der freien Paare in Grad (0 nach rechts, 90 nach unten)
  readonly pairs: readonly number[]
}

export type LewisFigure = {
  readonly kind: 'lewis'
  readonly id: string
  readonly caption: string
  readonly atoms: readonly LewisAtom[]
  readonly bonds: readonly MolBond[]
  // Beschreibung in Worten (für Vorlesehilfen und als Text der Antwort)
  readonly description: string
}

// Fehler, die eine falsche Lewis-Formel ergeben (Id des Rechenfehlers in errorRules.ts)
export const LEWIS_VARIANTS = {
  'ohne-paare-innen': 'chem-lewis-pairs-missing',
  'ohne-paare-aussen': 'chem-lewis-terminal-pairs',
  'einfachbindungen': 'chem-lewis-multiple-missing',
  'paar-zu-viel': 'chem-lewis-octet-exceeded',
  'wasserstoff-paar': 'chem-lewis-hydrogen',
} as const
export type LewisVariant = keyof typeof LEWIS_VARIANTS

type Structure = { bonds: MolBond[]; pairs: number[] }

const isInner = (mol: Molecule, i: number) => mol.atoms[i].el !== 'H' && partnersOf(mol, i) >= 2
const isOuter = (mol: Molecule, i: number) => mol.atoms[i].el !== 'H' && partnersOf(mol, i) === 1

const correctStructure = (mol: Molecule): Structure => ({ bonds: [...mol.bonds], pairs: mol.atoms.map((_, i) => lonePairsOf(mol, i)) })

// Struktur mit einem Fehler; null, wenn der Fehler bei diesem Molekül nichts ändert
function variantStructure(mol: Molecule, variant: LewisVariant): Structure | null {
  const s = correctStructure(mol)
  const inner = mol.atoms.map((_, i) => i).filter((i) => isInner(mol, i))
  // bei zweiatomigen Molekülen sind beide Atome „innen"
  const innerOrAll = inner.length > 0 ? inner : mol.atoms.map((_, i) => i).filter((i) => mol.atoms[i].el !== 'H')
  switch (variant) {
    case 'ohne-paare-innen': {
      if (innerOrAll.every((i) => s.pairs[i] === 0)) return null
      for (const i of innerOrAll) s.pairs[i] = 0
      return s
    }
    case 'ohne-paare-aussen': {
      const outer = inner.length > 0 ? mol.atoms.map((_, i) => i).filter((i) => isOuter(mol, i)) : []
      if (outer.every((i) => s.pairs[i] === 0)) return null
      for (const i of outer) s.pairs[i] = 0
      return s
    }
    case 'einfachbindungen': {
      if (mol.bonds.every(([, , order]) => order === 1)) return null
      s.bonds = mol.bonds.map(([a, b]) => [a, b, 1] as const)
      s.pairs = mol.atoms.map((a, i) => (a.el === 'H' ? 0 : 4 - partnersOf(mol, i)))
      return s
    }
    case 'paar-zu-viel': {
      const target = innerOrAll[0]
      if (target === undefined) return null
      s.pairs[target] += 1
      return s
    }
    case 'wasserstoff-paar': {
      const h = mol.atoms.findIndex((a) => a.el === 'H')
      if (h < 0) return null
      s.pairs[h] = 1
      return s
    }
  }
}

// kleinster Abstand zweier Richtungen in Grad
const gap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return Math.min(d, 360 - d)
}

const STEP = 15
const CANDIDATES = Array.from({ length: 360 / STEP }, (_, i) => i * STEP)

// Richtungen der freien Paare: so weit wie möglich von den Bindungen und voneinander entfernt
function pairDirections(bondAngles: readonly number[], count: number): number[] {
  if (count === 0) return []
  let best: number[] = []
  let bestScore: number[] = []
  const score = (pairs: readonly number[]) => {
    const all = [...bondAngles, ...pairs]
    const gaps: number[] = []
    for (const [i, a] of all.entries()) for (const b of all.slice(i + 1)) gaps.push(gap(a, b))
    return gaps.sort((x, y) => x - y)
  }
  const better = (a: number[], b: number[]) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] > b[i]
    return false
  }
  const search = (start: number, chosen: number[]) => {
    if (chosen.length === count) {
      const s = score(chosen)
      if (best.length === 0 || better(s, bestScore)) {
        best = [...chosen]
        bestScore = s
      }
      return
    }
    for (let k = start; k < CANDIDATES.length; k++) search(k + 1, [...chosen, CANDIDATES[k]])
  }
  search(0, [])
  return best
}

const angleTo = (from: { x: number; y: number }, to: { x: number; y: number }) => ((Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + 360) % 360

const pairWord = (n: number) => (n === 1 ? '1 freien Paar' : `${n} freien Paaren`)
const bondWord = (n: number) => (n === 1 ? '1 Bindungsstrich' : `${n} Bindungsstrichen`)

// Beschreibung in Worten, z. B. „N mit 3 Bindungsstrichen und 1 freien Paar; 3-mal H mit 1 Bindungsstrich"
function describe(mol: Molecule, s: Structure): string {
  const strokes = (i: number) => s.bonds.reduce((sum, [a, b, order]) => sum + (a === i || b === i ? order : 0), 0)
  const parts = new Map<string, number>()
  for (const [i, a] of mol.atoms.entries()) {
    const text = `${a.el} mit ${bondWord(strokes(i))}${s.pairs[i] > 0 ? ` und ${pairWord(s.pairs[i])}` : ''}`
    parts.set(text, (parts.get(text) ?? 0) + 1)
  }
  return [...parts].map(([text, n]) => (n === 1 ? text : `${n}-mal ${text}`)).join('; ')
}

function build(mol: Molecule, s: Structure, id: string): LewisFigure {
  const atoms = mol.atoms.map((a, i) => {
    const bondAngles = s.bonds.filter(([x, y]) => x === i || y === i).map(([x, y]) => angleTo(a, mol.atoms[x === i ? y : x]))
    return { el: a.el, x: a.x, y: a.y, pairs: pairDirections(bondAngles, s.pairs[i]) }
  })
  return {
    kind: 'lewis',
    id,
    caption: String.raw`Lewis-Formel von $\ce{${mol.id}}$: Striche zwischen den Atomen sind bindende Elektronenpaare, Striche am Atom freie Elektronenpaare.`,
    atoms,
    bonds: s.bonds,
    description: describe(mol, s),
  }
}

export const lewisId = (mol: Molecule, variant?: LewisVariant) => (variant ? `lewis:${mol.id}:${variant}` : `lewis:${mol.id}`)

const CACHE = new Map<string, LewisFigure | null>()

// Lewis-Formel eines Moleküls, richtig oder mit einem Fehler; null, wenn es sie so nicht gibt
export function lewisFigure(mol: Molecule, variant?: LewisVariant): LewisFigure | null {
  const id = lewisId(mol, variant)
  if (!CACHE.has(id)) {
    const s = variant ? variantStructure(mol, variant) : correctStructure(mol)
    CACHE.set(id, s ? build(mol, s, id) : null)
  }
  return CACHE.get(id)!
}

// Bild zu einer Id „lewis:H2O" oder „lewis:H2O:paar-zu-viel"
export function lewisFigureById(id: string): LewisFigure | null {
  const [, molId, variant] = id.split(':')
  const mol = moleculeById(molId)
  if (!mol || mol.expanded) return null
  if (variant !== undefined && !(variant in LEWIS_VARIANTS)) return null
  return lewisFigure(mol, variant as LewisVariant | undefined)
}

// Ist die gezeichnete Formel richtig? Elektronenzahl wie die Valenzelektronen, jedes Atom mit Oktett
// (Wasserstoff zwei Elektronen, Bor in den markierten Molekülen sechs)
export function lewisValid(mol: Molecule, fig: LewisFigure): boolean {
  const strokes = (i: number) => fig.bonds.reduce((sum, [a, b, order]) => sum + (a === i || b === i ? order : 0), 0)
  const total = fig.bonds.reduce((sum, [, , order]) => sum + 2 * order, 0) + fig.atoms.reduce((sum, a) => sum + 2 * a.pairs.length, 0)
  const valence = mol.atoms.reduce((sum, a) => sum + VALENCE[a.el], 0)
  if (total !== valence) return false
  return fig.atoms.every((a, i) => {
    const around = 2 * strokes(i) + 2 * a.pairs.length
    if (a.el === 'H') return around === 2
    if (a.el === 'B' && mol.sextet) return around === 6
    return around === 8
  })
}
