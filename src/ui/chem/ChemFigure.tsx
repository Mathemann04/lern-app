import { type BoxFigure, type ChemFigure as Figure, type LatticeFigure, type PseFigure, type ShapeFigure, figureById } from '../../engine/chem/figures.ts'
import { LETTERS } from '../../engine/chem/electrons.ts'
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

// Kästchenschreibweise: je Unterschale eine Gruppe Kästchen nebeneinander, darunter ihr Name; Pfeile für Elektronen.
// Breite fest je Kästchen, damit alle Antworten einer Frage gleich groß wirken.
const BOX = 26
const GAP = 10

function Arrow({ x, y, up, shift }: { x: number; y: number; up: boolean; shift: number }) {
  const top = y + 5
  const bottom = y + BOX - 5
  const cx = x + BOX / 2 + shift
  const [from, to] = up ? [bottom, top] : [top, bottom]
  const head = up ? 1 : -1
  return (
    <g className="stroke-zinc-800" strokeWidth={1.8} strokeLinecap="round" fill="none">
      <line x1={cx} y1={from} x2={cx} y2={to} />
      <polyline points={`${cx - 3.5},${to + head * 4.5} ${cx},${to} ${cx + 3.5},${to + head * 4.5}`} />
    </g>
  )
}

function Boxes({ figure, label }: { figure: BoxFigure; label: string }) {
  const coreWidth = figure.core ? 44 : 0
  const groups = figure.rows.map((r) => r.boxes.length)
  const width = coreWidth + groups.reduce((sum, k) => sum + k * BOX, 0) + GAP * (groups.length - 1) + 8
  const height = BOX + 26
  // linker Rand jeder Gruppe
  const starts = groups.map((_, k) => coreWidth + 4 + groups.slice(0, k).reduce((sum, n) => sum + n * BOX + GAP, 0))
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block h-auto" style={{ width: Math.min(width * 1.25, 340), maxWidth: '100%' }} role="img" aria-label={label}>
      {figure.core && (
        <text x={coreWidth / 2} y={4 + BOX / 2} textAnchor="middle" dominantBaseline="central" className="fill-zinc-700" fontSize={14} fontWeight={600}>
          [{figure.core}]
        </text>
      )}
      {figure.rows.map((row, k) => {
        const start = starts[k]
        return (
          <g key={k}>
            {row.boxes.map((b, i) => {
              const bx = start + i * BOX
              return (
                <g key={i}>
                  <rect x={bx} y={4} width={BOX} height={BOX} className="fill-surface stroke-zinc-500" strokeWidth={1.2} />
                  {(b === 'u' || b === 'd') && <Arrow x={bx} y={4} up={b === 'u'} shift={0} />}
                  {b === '2' && (
                    <>
                      <Arrow x={bx} y={4} up shift={-4.5} />
                      <Arrow x={bx} y={4} up={false} shift={4.5} />
                    </>
                  )}
                  {b === 'x' && (
                    <>
                      <Arrow x={bx} y={4} up shift={-4.5} />
                      <Arrow x={bx} y={4} up shift={4.5} />
                    </>
                  )}
                </g>
              )
            })}
            <text x={start + (row.boxes.length * BOX) / 2} y={BOX + 18} textAnchor="middle" className="fill-zinc-600" fontSize={12}>
              {`${row.shell.n}${LETTERS[row.shell.l]}`}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// Ausschnitt des Periodensystems: Felder mit Symbol, oben die Gruppen, links die Perioden; das gefragte Element farbig
const ROMAN_HEAD = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
function Pse({ figure }: { figure: PseFigure }) {
  const cell = 34
  const left = 22
  const top = 20
  const arrows = figure.arrows
  const right = arrows ? 24 : 2
  const bottom = arrows ? 30 : 2
  const tableWidth = figure.groups.length * cell
  const tableHeight = figure.periods.length * cell
  const width = left + tableWidth + right
  const height = top + tableHeight + bottom
  const x = (group: number) => left + figure.groups.indexOf(group) * cell
  const y = (period: number) => top + figure.periods.indexOf(period) * cell
  const head = (group: number) => (figure.main ? ROMAN_HEAD[(group <= 2 ? group : group - 10) - 1] : String(group))
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block h-auto" style={{ width: Math.min(width * 1.1, 360), maxWidth: '100%' }} role="img" aria-label={figure.caption}>
      {figure.groups.map((g) => (
        <text key={`g${g}`} x={x(g) + cell / 2} y={13} textAnchor="middle" className="fill-zinc-600" fontSize={10}>
          {head(g)}
        </text>
      ))}
      {figure.periods.map((p) => (
        <text key={`p${p}`} x={left / 2} y={y(p) + cell / 2} textAnchor="middle" dominantBaseline="central" className="fill-zinc-600" fontSize={10}>
          {p}
        </text>
      ))}
      {figure.cells.map((c) => {
        const marked = c.symbol !== null && figure.marks.includes(c.symbol)
        return (
          <g key={`${c.period}-${c.group}`}>
            <rect
              x={x(c.group) + 1}
              y={y(c.period) + 1}
              width={cell - 2}
              height={cell - 2}
              rx={3}
              className={marked ? 'fill-accent-600 stroke-accent-800' : c.symbol ? 'fill-surface stroke-zinc-400' : 'fill-zinc-100 stroke-zinc-300'}
              strokeWidth={marked ? 2 : 1}
            />
            {c.symbol && (
              <text x={x(c.group) + cell / 2} y={y(c.period) + cell / 2} textAnchor="middle" dominantBaseline="central" className={marked ? 'fill-on-accent' : 'fill-zinc-800'} fontSize={12} fontWeight={marked ? 700 : 500}>
                {c.symbol}
              </text>
            )}
          </g>
        )
      })}
      {arrows && <TrendArrows arrows={arrows} x0={left} y0={top} w={tableWidth} h={tableHeight} />}
    </svg>
  )
}

// Pfeile unter und rechts neben dem Ausschnitt: in Richtung der Zunahme
function TrendArrows({ arrows, x0, y0, w, h }: { arrows: NonNullable<PseFigure['arrows']>; x0: number; y0: number; w: number; h: number }) {
  const yh = y0 + h + 12
  const [hx1, hx2] = arrows.period === 1 ? [x0 + 8, x0 + w - 8] : [x0 + w - 8, x0 + 8]
  const xv = x0 + w + 12
  const [vy1, vy2] = arrows.group === 1 ? [y0 + 8, y0 + h - 8] : [y0 + h - 8, y0 + 8]
  const head = (x: number, y: number, dx: number, dy: number) => `${x - dx * 7 - dy * 5},${y - dy * 7 - dx * 5} ${x},${y} ${x - dx * 7 + dy * 5},${y - dy * 7 + dx * 5}`
  return (
    <g className="stroke-accent-700" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={hx1} y1={yh} x2={hx2} y2={yh} />
      <polyline points={head(hx2, yh, Math.sign(hx2 - hx1), 0)} />
      <line x1={xv} y1={vy1} x2={xv} y2={vy2} />
      <polyline points={head(xv, vy2, 0, Math.sign(vy2 - vy1))} />
      <text x={x0 + w / 2} y={yh + 14} textAnchor="middle" className="fill-zinc-700 stroke-none" fontSize={10}>
        {`${arrows.label} nimmt zu`}
      </text>
    </g>
  )
}

// nur die Zeichnung, ohne Rahmen und Unterschrift (z. B. als Antwort zur Auswahl)
export function FigureDrawing({ figure, label }: { figure: Figure; label?: string }) {
  if (figure.kind === 'lattice') return <Lattice figure={figure} />
  if (figure.kind === 'lewis') return <Lewis figure={figure} label={label ?? figure.description} />
  if (figure.kind === 'boxes') return <Boxes figure={figure} label={label ?? figure.description} />
  if (figure.kind === 'pse') return <Pse figure={figure} />
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
