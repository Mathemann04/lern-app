import { type LatticeFigure, figureById } from '../../engine/chem/figures.ts'
import { RichText } from '../RichText.tsx'

// Bild zu einer Chemie-Frage oder Lernkarte (engine/chem/figures.ts), aus den Daten gezeichnet. Ionengitter
// schräg von vorn: x nach rechts, z nach oben, y nach hinten (verkürzt). Farben werden nie abgefragt.

const SIZE = 150
const DEPTH = { x: 0.45, y: -0.32 }
const PAD = 26

function project(x: number, y: number, z: number): [number, number] {
  return [PAD + x * SIZE + y * SIZE * DEPTH.x, PAD + SIZE * (1 - DEPTH.y) - z * SIZE + y * SIZE * DEPTH.y]
}

function Lattice({ figure }: { figure: LatticeFigure }) {
  const width = 2 * PAD + SIZE * (1 + DEPTH.x)
  const height = 2 * PAD + SIZE * (1 - DEPTH.y)
  const radius = (kind: 'cation' | 'anion') => 13 * (kind === 'cation' ? figure.cationRadius : figure.anionRadius)
  const neighbors = new Set(figure.bonds.filter(([a, b]) => a === figure.center || b === figure.center).flatMap(([a, b]) => [a, b]))
  // Würfelkanten
  const corners = [0, 1].flatMap((x) => [0, 1].flatMap((y) => [0, 1].map((z) => ({ x, y, z }))))
  const edges = corners.flatMap((a, i) => corners.slice(i + 1).filter((b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z) === 1).map((b) => [a, b] as const))
  // hinten zuerst zeichnen
  const order = figure.ions.map((ion, i) => ({ ion, i })).sort((a, b) => b.ion.y - a.ion.y || a.ion.z - b.ion.z)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block w-full max-w-xs" role="img" aria-label={figure.caption.replace(/\$\\ce\{([^}]*)\}\$/g, '$1')}>
      {edges.map(([a, b], k) => {
        const [x1, y1] = project(a.x, a.y, a.z)
        const [x2, y2] = project(b.x, b.y, b.z)
        return <line key={`e${k}`} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-zinc-300" strokeWidth={1} strokeDasharray="4 3" />
      })}
      {figure.bonds.map(([a, b], k) => {
        const [x1, y1] = project(figure.ions[a].x, figure.ions[a].y, figure.ions[a].z)
        const [x2, y2] = project(figure.ions[b].x, figure.ions[b].y, figure.ions[b].z)
        const strong = a === figure.center || b === figure.center
        return <line key={`b${k}`} x1={x1} y1={y1} x2={x2} y2={y2} className={strong ? 'stroke-accent-700' : 'stroke-zinc-400'} strokeWidth={strong ? 2.5 : 1.2} />
      })}
      {order.map(({ ion, i }) => {
        const [cx, cy] = project(ion.x, ion.y, ion.z)
        const highlighted = i === figure.center
        const near = neighbors.has(i) && !highlighted
        return (
          <circle
            key={`i${i}`}
            cx={cx}
            cy={cy}
            r={radius(ion.kind)}
            className={
              ion.kind === 'cation'
                ? highlighted
                  ? 'fill-accent-600 stroke-accent-800'
                  : 'fill-accent-200 stroke-accent-700'
                : near
                  ? 'fill-zinc-300 stroke-accent-700'
                  : 'fill-zinc-200 stroke-zinc-500'
            }
            strokeWidth={highlighted || near ? 2 : 1}
          />
        )
      })}
    </svg>
  )
}

export function ChemFigure({ id }: { id: string }) {
  const figure = figureById(id)
  if (!figure) return null
  return (
    <figure className="space-y-2 rounded-2xl bg-zinc-50 px-3 py-3" data-testid="chem-figure">
      <Lattice figure={figure} />
      <figcaption className="text-sm text-zinc-600 text-pretty">
        <RichText text={figure.caption} inline />
      </figcaption>
    </figure>
  )
}
