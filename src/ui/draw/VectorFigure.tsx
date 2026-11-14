import { type PointerEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { type DragStep, snapDrag } from '../../engine/linalg/drag.ts'
import { type DrawAngle, type DrawArrow, type DrawColor, type DrawPoint, type DrawSegment, type DrawSlider, type VectorDrawing, anglePath, hasAnimation, withMistake } from '../../engine/linalg/figures.ts'
import { Formula } from '../Formula.tsx'
import { RichText } from '../RichText.tsx'
import { START_PITCH, type View, arrowGeometry, bestYaw, lerpPoint, planeView, spaceView } from './view.ts'

// Bild zu einer Vektor-Aufgabe (M7): Gitter in der Ebene, im Raum eine Ansicht zum Drehen (mit dem Finger ziehen).
// „Abspielen" lässt die Teile mit phase > 0 nacheinander erscheinen; ohne Abspielen ist alles da. Bei „Bewegung
// reduzieren" gibt es keine Bewegung. Namen an Pfeilen und Punkten setzt KaTeX über dem Bild. Hat das Bild einen
// typischen Fehler (Schritt 3a), blendet „Typischen Fehler zeigen" ihn rot ein; der Knopf zum Abspielen kann anders
// heißen (playLabel, z. B. „Licht an").
// compact: kleines Bild ohne Knöpfe und Unterschrift (als Antwort bei „Bild wählen")
// drag (Schritt 2b): Zieh-Aufgabe in der Ebene; at ist die Stelle, onMove bekommt die eingerastete neue Stelle (ohne
// onMove steht sie fest, z. B. nach dem Prüfen). Mitlaufende Teile (Pfeil, Strecken, Winkelbogen) kommen aus DragStep.

const COLOR: Readonly<Record<DrawColor, string>> = {
  a: 'var(--vec-a)',
  b: 'var(--vec-b)',
  r: 'var(--vec-r)',
  c: 'var(--vec-c)',
  muted: 'var(--vec-muted)',
  bad: 'var(--vec-bad)',
}

const PHASE_MS = 900
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
// höchste Höhe eines Bildes: ein Drittel des Bildschirms, höchstens 260 px
const FIGURE_MAX_HEIGHT = 'min(260px, 32dvh)'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export type FigureDrag = { readonly step: DragStep; readonly at: readonly number[]; readonly onMove?: (at: readonly number[]) => void }

type Props = { drawing: VectorDrawing; compact?: boolean; label?: string; drag?: FigureDrag }

// Das Bild mit den mitlaufenden Teilen einer Zieh-Aufgabe an der Stelle at
function withDrag(drawing: VectorDrawing, step: DragStep, at: readonly number[]): VectorDrawing {
  const v = at.map((x, i) => x - step.from[i])
  const moved = v.some((x) => x !== 0)
  const arrows: DrawArrow[] = []
  const segments: DrawSegment[] = []
  const points: DrawPoint[] = []
  const angles: DrawAngle[] = []
  if (step.liveSum && moved) {
    const sum = step.liveSum.map((x, i) => x + v[i])
    arrows.push({ from: step.from, to: sum, color: 'r' })
    segments.push({ from: step.liveSum, to: sum, color: 'muted', dashed: true }, { from: at, to: sum, color: 'muted', dashed: true })
  }
  if (step.liveDiff && moved && step.liveDiff.some((x, i) => x !== at[i])) arrows.push({ from: at, to: step.liveDiff, color: 'c' })
  if (step.mode === 'arrow') {
    if (moved) arrows.push({ from: step.from, to: at, color: step.color, label: step.name })
  } else {
    for (const l of step.links ?? []) if (l.some((x, i) => x !== at[i])) segments.push({ from: l, to: at, color: step.color })
    points.push({ at, label: step.name, color: step.color })
  }
  if (step.liveAngle && moved) {
    const w = step.liveAngle
    const cos = (w[0] * v[0] + w[1] * v[1]) / (Math.hypot(...w) * Math.hypot(...v))
    if (Math.abs(cos) < 0.999) angles.push({ at: step.from, u: w, v, color: 'r' })
  }
  return {
    ...drawing,
    arrows: [...drawing.arrows, ...arrows],
    segments: [...drawing.segments, ...segments],
    points: [...drawing.points, ...points],
    angles: [...(drawing.angles ?? []), ...angles],
  }
}

export function VectorFigure({ drawing: given, compact = false, label, drag: dragged }: Props) {
  // typischer Fehler eingeblendet (Schritt 3): rote Teile dazu, Erklärung statt der Beschreibung
  const [showMistake, setShowMistake] = useState(false)
  // Schieberegler (Schritt 11c): gewählte Stelle, das Bild dazu kommt fertig aus der Engine
  const slider = given.slider
  const [pos, setPos] = useState(slider?.start ?? 0)
  // neue Aufgabe im selben Bild: wieder beim Startwert anfangen
  const [seen, setSeen] = useState(slider)
  if (seen !== slider) {
    setSeen(slider)
    setPos(slider?.start ?? 0)
  }
  const source = slider ? (slider.frames[pos] ?? given) : given
  const drawing = useMemo(() => {
    const base = dragged ? withDrag(source, dragged.step, dragged.at) : source
    return showMistake ? withMistake(base) : base
  }, [source, dragged, showMistake])
  const maxPhase = useMemo(() => Math.max(0, ...[...drawing.arrows, ...drawing.points, ...drawing.segments, ...drawing.polygons, ...(drawing.angles ?? [])].map((e) => e.phase ?? 0)), [drawing])
  const [time, setTime] = useState(maxPhase)
  const [angles, setAngles] = useState(() => ({ yaw: drawing.dim === 3 ? bestYaw(drawing) : 0, pitch: START_PITCH }))
  const frame = useRef<number | null>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
  }, [])

  function play() {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    if (reducedMotion()) {
      setTime(maxPhase)
      return
    }
    const start = performance.now() + 250
    setTime(0)
    const tick = (now: number) => {
      const t = Math.max(0, (now - start) / PHASE_MS)
      setTime(Math.min(maxPhase, t))
      frame.current = t < maxPhase ? requestAnimationFrame(tick) : null
    }
    frame.current = requestAnimationFrame(tick)
  }

  const space = drawing.dim === 3
  const view: View = space ? spaceView(drawing, angles.yaw, angles.pitch) : planeView(drawing)
  const progress = (phase: number | undefined) => ((phase ?? 0) <= 0 ? 1 : ease(Math.min(1, Math.max(0, time - (phase! - 1)))))

  const rotate = {
    onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
      drag.current = { x: e.clientX, y: e.clientY }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove: (e: PointerEvent<SVGSVGElement>) => {
      if (!drag.current) return
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      drag.current = { x: e.clientX, y: e.clientY }
      setAngles((a) => ({ yaw: a.yaw - dx * 0.012, pitch: Math.max(-0.15, Math.min(Math.PI / 2, a.pitch + dy * 0.012)) }))
    },
    onPointerUp: () => (drag.current = null),
    onPointerCancel: () => (drag.current = null),
  }

  // Zieh-Aufgabe: Stelle unter dem Finger, eingerastet
  const svgRef = useRef<SVGSVGElement>(null)
  // Beschriftungen, die sich überdecken, rücken nach jedem Zeichnen an eine freie Stelle daneben (M7 Schritt 13)
  const labelBox = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => spreadLabels(labelBox.current))
  const pulling = useRef(false)
  const canPull = !!dragged?.onMove && !space && !!view.unproject
  function pullTo(e: PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || !dragged?.onMove || !view.unproject) return
    const world = view.unproject(((e.clientX - rect.left) / rect.width) * view.width, ((e.clientY - rect.top) / rect.height) * view.height)
    const next = snapDrag(dragged.step, world)
    if (next.some((x, i) => x !== dragged.at[i])) dragged.onMove(next)
  }
  const pull = {
    onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
      pulling.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      pullTo(e)
    },
    onPointerMove: (e: PointerEvent<SVGSVGElement>) => {
      if (pulling.current) pullTo(e)
    },
    onPointerUp: () => (pulling.current = false),
    onPointerCancel: () => (pulling.current = false),
  }

  const labels: { key: string; x: number; y: number; tex: string; color: string }[] = []
  const project = view.project

  const svg = (
    <svg
      viewBox={`0 0 ${view.width} ${view.height}`}
      ref={svgRef}
      className={`block w-full select-none ${(space && !compact) || canPull ? 'cursor-grab touch-none' : ''}`}
      role={compact ? undefined : 'img'}
      aria-hidden={compact ? true : undefined}
      aria-label={compact ? undefined : stripMath(drawing.caption)}
      {...(space && !compact ? rotate : canPull ? pull : {})}
      data-testid={canPull ? 'drag-surface' : undefined}
    >
      {view.grid && <Grid view={view} compact={compact} />}
      {space && <Axes view={view} />}
      {drawing.polygons.map((poly, i) => {
        const q = progress(poly.phase)
        if (q <= 0) return null
        const corners = poly.from ? poly.points.map((p, k) => lerpPoint(poly.from![k], p, q)) : poly.points
        const shown = poly.from ? 1 : q
        if (poly.label && q > 0.95 && !compact) {
          // Name nahe einer Ecke, etwas nach innen gerückt (Schritt 10b)
          const mid = corners.reduce((s, p) => s.map((x, k) => x + p[k] / corners.length), corners[0].map(() => 0))
          const [lx, ly] = project(lerpPoint(mid, corners[(poly.labelCorner ?? 2) % corners.length], 0.82))
          labels.push({ key: `f${i}`, x: lx, y: ly, tex: poly.label, color: COLOR[poly.color] })
        }
        return <polygon key={`poly${i}`} points={corners.map((p) => project(p).join(',')).join(' ')} style={{ fill: COLOR[poly.color], fillOpacity: 0.14 * shown, stroke: COLOR[poly.color], strokeOpacity: 0.5 * shown }} strokeWidth={1.5} />
      })}
      {drawing.segments.map((seg, i) => {
        const q = progress(seg.phase)
        if (q <= 0) return null
        // gleitende Strecke (Schritt 10b): ganz da, die Enden wandern von slideFrom an ihren Platz
        const [x1, y1] = project(seg.slideFrom ? lerpPoint(seg.slideFrom[0], seg.from, q) : seg.from)
        const [x2, y2] = project(seg.slideFrom ? lerpPoint(seg.slideFrom[1], seg.to, q) : lerpPoint(seg.from, seg.to, q))
        const at = seg.labelAt ?? 0.5
        if (seg.label && q > 0.95)
          labels.push({ key: `s${i}`, x: x1 + (x2 - x1) * at + (y2 - y1 === 0 ? 0 : 12), y: y1 + (y2 - y1) * at + (y2 - y1 === 0 ? -13 : 0), tex: seg.label, color: seg.labelAt === undefined ? COLOR.muted : COLOR[seg.color] })
        return <line key={`seg${i}`} x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: COLOR[seg.color] }} strokeWidth={seg.dashed ? 1.6 : 2} strokeDasharray={seg.dashed ? '5 5' : undefined} strokeLinecap="round" />
      })}
      {(drawing.angles ?? []).map((angle, i) => {
        const q = progress(angle.phase)
        if (q <= 0) return null
        // Radius: etwa 22 Pixel, höchstens ein Drittel des kürzeren Schenkels
        const [ax, ay] = project(angle.at)
        const unitPx = (k: readonly number[]) => {
          const l = Math.hypot(...k)
          const [bx, by] = project(angle.at.map((x, j) => x + k[j] / l))
          return Math.max(1e-6, Math.hypot(bx - ax, by - ay))
        }
        const r = Math.min(0.34 * Math.min(Math.hypot(...angle.u), Math.hypot(...angle.v)), (compact ? 15 : 22) / Math.min(unitPx(angle.u), unitPx(angle.v)))
        const path = anglePath(angle, r)
        const pts = path.points.map((pt) => project(pt))
        const d = path.right ? `M${pts[0].join(',')}L${pts[1].join(',')}L${pts[2].join(',')}` : `M${ax},${ay}L${pts.map((pt) => pt.join(',')).join('L')}Z`
        if (angle.label && q > 0.95 && !compact) {
          const [lx, ly] = project(path.labelAt)
          labels.push({ key: `w${i}`, x: lx, y: ly, tex: angle.label, color: COLOR[angle.color] })
        }
        return (
          <path
            key={`angle${i}`}
            d={d}
            style={{ fill: path.right ? 'none' : COLOR[angle.color], fillOpacity: 0.18 * q, stroke: COLOR[angle.color], opacity: q }}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )
      })}
      {drawing.arrows.map((arrow, i) => {
        const q = progress(arrow.phase)
        if (q <= 0) return null
        let from = arrow.from
        let to = lerpPoint(arrow.from, arrow.to, q)
        if (arrow.slideFrom) {
          const start = lerpPoint(arrow.slideFrom, arrow.from, q)
          from = start
          to = arrow.to.map((x, k) => x + start[k] - arrow.from[k])
        }
        const [x1, y1] = project(from)
        const [x2, y2] = project(to)
        const g = arrowGeometry(x1, y1, x2, y2, compact ? 11 : 15)
        if (!g) return null
        if (arrow.label && q > 0.95 && !compact) labels.push({ key: `a${i}`, x: g.label.x, y: g.label.y, tex: arrow.label, color: COLOR[arrow.color] })
        const color = COLOR[arrow.color]
        return (
          <g key={`arrow${i}`} style={{ opacity: arrow.ghost ? 0.45 : 1 }}>
            <line {...g.line} style={{ stroke: color }} strokeWidth={arrow.ghost ? 2 : compact ? 3.5 : 4.5} strokeLinecap="round" strokeDasharray={arrow.ghost ? '2 6' : undefined} />
            {!arrow.ghost && <path d={g.head} style={{ fill: color, stroke: color }} strokeWidth={2} strokeLinejoin="round" />}
          </g>
        )
      })}
      {drawing.points.map((point, i) => {
        const q = progress(point.phase)
        if (q <= 0) return null
        const [x, y] = project(point.at)
        const off = compact ? 2.2 : 1
        if (point.label) labels.push({ key: `p${i}`, x: x - 12 * off, y: y - 14 * off, tex: point.label, color: point.color ? COLOR[point.color] : 'currentColor' })
        return <circle key={`pt${i}`} cx={x} cy={y} r={compact ? 3.5 : 5} style={{ fill: point.color ? COLOR[point.color] : 'currentColor', opacity: q }} />
      })}
      {dragged && (
        <circle
          cx={project(dragged.at)[0]}
          cy={project(dragged.at)[1]}
          r={canPull ? 13 : 8}
          style={{ fill: COLOR[dragged.step.color], fillOpacity: 0.22, stroke: COLOR[dragged.step.color] }}
          strokeWidth={2}
          strokeDasharray={canPull ? '4 3' : undefined}
        />
      )}
    </svg>
  )

  // Höhe begrenzt (M7 Schritt 13): Große Bilder schoben am Handy die Antworten unter den Bildschirmrand. Das Bild wird
  // dann schmaler und bleibt mittig; Antwort-Bilder (compact) bleiben, wie sie sind
  const picture = (
    <div ref={labelBox} className={`relative text-zinc-900 ${compact ? '' : 'mx-auto'}`} style={compact ? undefined : { maxWidth: `calc(${FIGURE_MAX_HEIGHT} * ${view.width / view.height})` }}>
      {svg}
      {labels.map((l) => (
        <span
          key={l.key}
          className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-surface/80 px-0.5 leading-none ${compact ? 'text-xs' : 'text-sm'}`}
          data-label
          style={{ left: `${(l.x / view.width) * 100}%`, top: `${(l.y / view.height) * 100}%`, color: l.color }}
        >
          <Formula tex={l.tex} />
        </span>
      ))}
    </div>
  )

  if (compact)
    return (
      <span className="block" aria-label={label}>
        {picture}
      </span>
    )

  return (
    <figure className="space-y-2 rounded-2xl border border-zinc-200 bg-surface px-3 py-3" data-testid="vector-figure">
      <div className="mx-auto max-w-sm">{picture}</div>
      <figcaption className="space-y-2">
        {(hasAnimation(drawing) || space || canPull || given.mistake) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {hasAnimation(drawing) && (
              <button
                type="button"
                onClick={play}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-zinc-300 px-4 font-medium shadow-[0_3px_0_var(--color-zinc-300)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-zinc-300)]"
              >
                <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                  <path d="M2 1.2v9.6L10.4 6z" fill="currentColor" />
                </svg>
                {drawing.playLabel ?? 'Abspielen'}
              </button>
            )}
            {given.mistake && !compact && (
              <button
                type="button"
                aria-pressed={showMistake}
                onClick={() => setShowMistake((v) => !v)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl border-2 px-4 font-medium shadow-[0_3px_0_var(--color-zinc-300)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-zinc-300)] ${showMistake ? 'border-red-400 text-red-700' : 'border-zinc-300'}`}
              >
                {showMistake ? 'Fehler ausblenden' : 'Typischen Fehler zeigen'}
              </button>
            )}
            {space && <span className="text-sm text-zinc-600">Zum Drehen im Bild ziehen</span>}
            {canPull && <span className="text-sm text-zinc-600">Ziehen oder ins Gitter tippen</span>}
          </div>
        )}
        {slider && <SliderControls slider={slider} pos={pos} onChange={setPos} />}
        <RichText text={drawing.caption} className="block text-sm text-zinc-600 text-pretty" inline />
      </figcaption>
    </figure>
  )
}

// Zahl mit Dezimalkomma (LaTeX und Text für Vorlesehilfen)
const valueLatex = (x: number) => String(Math.round(x * 1000) / 1000).replace('.', '{,}')
const valueText = (x: number) => String(Math.round(x * 1000) / 1000).replace('.', ',').replace(/^-/, 'minus ')

// Schieberegler für den Parameter (Schritt 11c): Regler über alle Stellen, Knöpfe für die besonderen Stellen
function SliderControls({ slider, pos, onChange }: { slider: DrawSlider; pos: number; onChange: (pos: number) => void }) {
  const value = slider.values[pos]
  return (
    <div className="space-y-2" data-testid="param-slider">
      <label className="flex min-h-11 items-center gap-3">
        <span className="w-20 shrink-0 whitespace-nowrap" data-testid="param-value">
          <Formula tex={`${slider.name} = ${valueLatex(value)}`} />
        </span>
        <input
          type="range"
          min={0}
          max={slider.values.length - 1}
          step={1}
          value={pos}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`Wert von ${slider.name}`}
          aria-valuetext={`${slider.name} gleich ${valueText(value)}`}
          className="h-11 w-full cursor-pointer accent-[var(--color-accent-600)]"
        />
      </label>
      {slider.marks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slider.marks.map((m) => (
            <button
              key={m.index}
              type="button"
              aria-pressed={pos === m.index}
              onClick={() => onChange(m.index)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border-2 px-3 text-sm ${pos === m.index ? 'border-accent-600 bg-accent-50' : 'border-zinc-300'}`}
            >
              <Formula tex={`${slider.name} = ${valueLatex(slider.values[m.index])}`} />
              <RichText text={m.note} className="text-zinc-600" inline />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Grid({ view, compact }: { view: View; compact: boolean }) {
  const g = view.grid!
  const [ox, oy] = view.project([0, 0])
  const lines = []
  for (let x = Math.ceil(g.xmin); x <= g.xmax; x++) {
    if (x === 0 || x % g.step !== 0) continue
    const [px] = view.project([x, 0])
    lines.push(<line key={`x${x}`} x1={px} x2={px} y1={0} y2={view.height} style={{ stroke: 'var(--vec-grid)' }} strokeWidth={1} />)
    if (!compact && x > g.xmin && x < g.xmax) lines.push(<text key={`tx${x}`} x={px} y={oy + 13} textAnchor="middle" className="fill-zinc-500 text-[10px]">{String(x).replace('-', '−')}</text>)
  }
  for (let y = Math.ceil(g.ymin); y <= g.ymax; y++) {
    if (y === 0 || y % g.step !== 0) continue
    const [, py] = view.project([0, y])
    lines.push(<line key={`y${y}`} y1={py} y2={py} x1={0} x2={view.width} style={{ stroke: 'var(--vec-grid)' }} strokeWidth={1} />)
    if (!compact && y > g.ymin && y < g.ymax) lines.push(<text key={`ty${y}`} x={ox - 5} y={py + 3.5} textAnchor="end" className="fill-zinc-500 text-[10px]">{String(y).replace('-', '−')}</text>)
  }
  return (
    <g>
      {lines}
      <line x1={ox} x2={ox} y1={0} y2={view.height} style={{ stroke: 'var(--vec-axis)' }} strokeWidth={1.4} />
      <line y1={oy} y2={oy} x1={0} x2={view.width} style={{ stroke: 'var(--vec-axis)' }} strokeWidth={1.4} />
    </g>
  )
}

function Axes({ view }: { view: View }) {
  const len = view.axisLength!
  const names = ['x', 'y', 'z']
  return (
    <g>
      {names.map((name, i) => {
        const end = [0, 0, 0].map((_, k) => (k === i ? len : 0))
        const start = [0, 0, 0].map((_, k) => (k === i ? -len * 0.35 : 0))
        const tip = [0, 0, 0].map((_, k) => (k === i ? len * 1.09 : 0))
        const [x1, y1] = view.project(start)
        const [x2, y2] = view.project(end)
        const [tx, ty] = view.project(tip)
        return (
          <g key={name}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: 'var(--vec-axis)' }} strokeWidth={1.4} />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" className="fill-zinc-500 text-[12px] italic">
              {name}
            </text>
          </g>
        )
      })}
    </g>
  )
}

// Beschreibung ohne Formelzeichen für Vorlesehilfen
const stripMath = (text: string) => text.replace(/\$([^$]*)\$/g, (_, tex: string) => tex.replace(/\\[a-zA-Z]+|[{}]/g, ' ').replace(/\s+/g, ' ').trim())

// Beschriftungen nacheinander setzen: Überdeckt eine eine schon gesetzte, rückt sie über, unter oder neben ihren Platz,
// je an die erste freie Stelle (über den Rand, nicht über das CSS-Verschieben, das die Mitte setzt)
function spreadLabels(box: HTMLElement | null) {
  if (!box) return
  const spans = [...box.querySelectorAll<HTMLElement>('[data-label]')]
  for (const span of spans) {
    span.style.marginLeft = ''
    span.style.marginTop = ''
  }
  type Box = { left: number; top: number; right: number; bottom: number }
  const placed: Box[] = []
  const hits = (q: Box) => placed.some((p) => q.left < p.right - 1 && q.right > p.left + 1 && q.top < p.bottom - 1 && q.bottom > p.top + 1)
  for (const span of spans) {
    const r = span.getBoundingClientRect()
    let best: Box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
    if (hits(best)) {
      const [w, h] = [r.width, r.height]
      const moves = [
        [0, -h],
        [0, h],
        [0.7 * w, 0],
        [-0.7 * w, 0],
        [0.7 * w, -h],
        [-0.7 * w, -h],
        [0.7 * w, h],
        [-0.7 * w, h],
        [0, -2 * h],
        [0, 2 * h],
      ]
      for (const [dx, dy] of moves) {
        const q = { left: r.left + dx, top: r.top + dy, right: r.right + dx, bottom: r.bottom + dy }
        if (hits(q)) continue
        span.style.marginLeft = `${dx}px`
        span.style.marginTop = `${dy}px`
        best = q
        break
      }
    }
    placed.push(best)
  }
}
