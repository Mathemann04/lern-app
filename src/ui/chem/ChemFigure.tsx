import { type ChemFigure as Figure, type LatticeFigure, type ShapeFigure, figureById } from '../../engine/chem/figures.ts'
import type { LewisFigure } from '../../engine/chem/lewis.ts'
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

// Lewis-Formel: Elementsymbole, Bindungsstriche (doppelt, dreifach parallel) und freie Paare als Striche am Atom
const UNIT = 46
// Abstand der Bindungsstriche vom Mittelpunkt des Symbols (zweibuchstabige Symbole sind breiter, vor allem waagrecht)
const atomGap = (el: string, ux: number) => (el.length > 1 ? 11 + 5 * Math.abs(ux) : 11)

function Lewis({ figure, label }: { figure: LewisFigure; label: string }) {
  const xs = figure.atoms.map((a) => a.x)
  const ys = figure.atoms.map((a) => a.y)
  const pad = 30
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const width = (Math.max(...xs) - minX) * UNIT + 2 * pad
  const height = (Math.max(...ys) - minY) * UNIT + 2 * pad
  const pos = (a: { x: number; y: number }) => [pad + (a.x - minX) * UNIT, pad + (a.y - minY) * UNIT] as const
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block h-auto" style={{ width: Math.min(width * 1.15, 260), maxWidth: '100%' }} role="img" aria-label={label}>
      {figure.bonds.map(([a, b, order], k) => {
        const [x1, y1] = pos(figure.atoms[a])
        const [x2, y2] = pos(figure.atoms[b])
        const len = Math.hypot(x2 - x1, y2 - y1)
        const [ux, uy] = [(x2 - x1) / len, (y2 - y1) / len]
        const offsets = order === 1 ? [0] : order === 2 ? [-3, 3] : [-5, 0, 5]
        return offsets.map((o) => (
          <line
            key={`b${k}${o}`}
            x1={x1 + ux * atomGap(figure.atoms[a].el, ux) - uy * o}
            y1={y1 + uy * atomGap(figure.atoms[a].el, ux) + ux * o}
            x2={x2 - ux * atomGap(figure.atoms[b].el, ux) - uy * o}
            y2={y2 - uy * atomGap(figure.atoms[b].el, ux) + ux * o}
            className="stroke-zinc-800"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        ))
      })}
      {figure.atoms.map((a, i) => {
        const [cx, cy] = pos(a)
        return (
          <g key={`a${i}`}>
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="fill-zinc-800" fontSize={17} fontWeight={600}>
              {a.el}
            </text>
            {a.pairs.map((angle) => {
              const [dx, dy] = [Math.cos((angle * Math.PI) / 180), Math.sin((angle * Math.PI) / 180)]
              const r = a.el.length > 1 ? 15.5 : 13
              const half = 4.5
              return (
                <line
                  key={`p${angle}`}
                  x1={cx + dx * r - dy * half}
                  y1={cy + dy * r + dx * half}
                  x2={cx + dx * r + dy * half}
                  y2={cy + dy * r - dx * half}
                  className="stroke-accent-700"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

// Räumlicher Bau: etwas gedreht, damit die Tiefe sichtbar wird; hinten zuerst gezeichnet, vorne größer
const TURN_Y = (-28 * Math.PI) / 180
const TURN_X = (14 * Math.PI) / 180

function turn(p: { x: number; y: number; z: number }) {
  const x1 = p.x * Math.cos(TURN_Y) + p.z * Math.sin(TURN_Y)
  const z1 = -p.x * Math.sin(TURN_Y) + p.z * Math.cos(TURN_Y)
  const y2 = p.y * Math.cos(TURN_X) - z1 * Math.sin(TURN_X)
  const z2 = p.y * Math.sin(TURN_X) + z1 * Math.cos(TURN_X)
  return { x: x1, y: y2, z: z2 }
}

function Shape({ figure }: { figure: ShapeFigure }) {
  const size = 200
  const scale = 62
  const c = size / 2
  const at = (p: { x: number; y: number; z: number }) => {
    const t = turn(p)
    return { x: c + t.x * scale, y: c - t.y * scale, z: t.z }
  }
  const atoms = figure.atoms.map((a, i) => ({ ...at(a), el: a.el, i }))
  const items = [
    ...figure.lobes.map((l, k) => ({ kind: 'lobe' as const, k, ...at({ x: l.x * 0.75, y: l.y * 0.75, z: l.z * 0.75 }) })),
    ...atoms.map((a) => ({ kind: 'atom' as const, ...a })),
  ].sort((a, b) => a.z - b.z)
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block w-full max-w-[15rem]" role="img" aria-label={figure.caption.replace(/\$\\ce\{([^}]*)\}\$/g, '$1')}>
      {figure.bonds.map(([a, b, order], k) => {
        const p = atoms[a]
        const q = atoms[b]
        const len = Math.hypot(q.x - p.x, q.y - p.y) || 1
        const [nx, ny] = [-(q.y - p.y) / len, (q.x - p.x) / len]
        const offsets = order === 1 ? [0] : order === 2 ? [-3.5, 3.5] : [-6, 0, 6]
        return offsets.map((o) => (
          <line key={`b${k}${o}`} x1={p.x + nx * o} y1={p.y + ny * o} x2={q.x + nx * o} y2={q.y + ny * o} className="stroke-zinc-500" strokeWidth={3} strokeLinecap="round" />
        ))
      })}
      {items.map((item) => {
        const grow = 1 + item.z * 0.12
        if (item.kind === 'lobe') {
          const angle = (Math.atan2(item.y - c, item.x - c) * 180) / Math.PI
          const mid = { x: (item.x + c) / 2 + (item.x - c) * 0.35, y: (item.y + c) / 2 + (item.y - c) * 0.35 }
          return (
            <ellipse
              key={`l${item.k}`}
              cx={mid.x}
              cy={mid.y}
              rx={Math.max(14, Math.hypot(item.x - c, item.y - c) * 0.62)}
              ry={11 * grow}
              transform={`rotate(${angle} ${mid.x} ${mid.y})`}
              className="fill-accent-200 stroke-accent-700"
              fillOpacity={0.75}
              strokeWidth={1.2}
              strokeDasharray="3 2"
            />
          )
        }
        const central = item.i === 0
        const r = (central ? 17 : item.el === 'H' ? 10 : 14) * grow
        return (
          <g key={`a${item.i}`}>
            <circle cx={item.x} cy={item.y} r={r} className={central ? 'fill-accent-600 stroke-accent-800' : 'fill-zinc-200 stroke-zinc-500'} strokeWidth={1.5} />
            <text x={item.x} y={item.y} textAnchor="middle" dominantBaseline="central" className={central ? 'fill-on-accent' : 'fill-zinc-800'} fontSize={item.el.length > 1 ? 11 : 13} fontWeight={600}>
              {item.el}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// nur die Zeichnung, ohne Rahmen und Unterschrift (z. B. als Antwort zur Auswahl)
export function FigureDrawing({ figure, label }: { figure: Figure; label?: string }) {
  if (figure.kind === 'lattice') return <Lattice figure={figure} />
  if (figure.kind === 'lewis') return <Lewis figure={figure} label={label ?? figure.description} />
  return <Shape figure={figure} />
}

export function ChemFigure({ id }: { id: string }) {
  const figure = figureById(id)
  if (!figure) return null
  return (
    <figure className="space-y-2 rounded-2xl bg-zinc-50 px-3 py-3" data-testid="chem-figure">
      <FigureDrawing figure={figure} />
      <figcaption className="text-sm text-zinc-600 text-pretty">
        <RichText text={figure.caption} inline />
      </figcaption>
    </figure>
  )
}
