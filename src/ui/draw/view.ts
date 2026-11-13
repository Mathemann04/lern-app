import { type VectorDrawing, drawingCoordinates } from '../../engine/linalg/figures.ts'

// Ausschnitt und Abbildung eines Vektor-Bilds auf die Zeichenfläche (M7, Zeichen-Grundlage für Vektoren und später M6b).
// Ebene: Gitter mit ganzzahligen Linien, y nach oben. Raum: Blick schräg von oben, z nach oben; yaw dreht um die
// senkrechte Achse, pitch kippt (0 von vorn, π/2 von oben). Ohne Bibliothek, damit es klein und offline bleibt.

export type View = {
  readonly width: number
  readonly height: number
  // Weltpunkt → Punkt der Zeichenfläche
  readonly project: (p: readonly number[]) => readonly [number, number]
  // Ebene: Punkt der Zeichenfläche → Weltpunkt (Ziehen, Schritt 2b)
  readonly unproject?: (x: number, y: number) => readonly [number, number]
  // Ebene: Gitter
  readonly grid?: { readonly xmin: number; readonly xmax: number; readonly ymin: number; readonly ymax: number; readonly step: number }
  // Raum: Länge der Achsen
  readonly axisLength?: number
}

const WIDTH = 320
const MAX_HEIGHT = 260

export function planeView(d: VectorDrawing): View {
  if (d.frame) return frameView(d.frame)
  const coords = [...(d.scene ? [] : [[0, 0]]), ...drawingCoordinates(d)]
  const xs = coords.map((c) => c[0])
  const ys = coords.map((c) => c[1])
  // Rand: ein knappes Kästchen, bei großen Zahlen (Kräfte in Newton, Schritt 3b) ein Anteil der Größe
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
  const pad = Math.max(0.9, 0.08 * size)
  let xmin = Math.floor(Math.min(...xs) - pad)
  let xmax = Math.ceil(Math.max(...xs) + pad)
  let ymin = Math.floor(Math.min(...ys) - pad)
  let ymax = Math.ceil(Math.max(...ys) + pad)
  // nicht zu schmal: mindestens 5 Einheiten je Richtung
  const widen = (lo: number, hi: number) => {
    const missing = Math.max(0, 5 - (hi - lo))
    return [lo - Math.floor(missing / 2), hi + Math.ceil(missing / 2)] as const
  }
  ;[xmin, xmax] = widen(xmin, xmax)
  ;[ymin, ymax] = widen(ymin, ymax)
  const unit = Math.min(WIDTH / (xmax - xmin), MAX_HEIGHT / (ymax - ymin))
  const range = Math.max(xmax - xmin, ymax - ymin)
  const step = range > 26 ? 5 : range > 13 ? 2 : 1
  return {
    width: (xmax - xmin) * unit,
    height: (ymax - ymin) * unit,
    project: (p) => [(p[0] - xmin) * unit, (ymax - p[1]) * unit],
    ...(d.scene ? {} : { grid: { xmin, xmax, ymin, ymax, step } }),
  }
}

// Fester Ausschnitt (Zieh-Aufgaben): ein halbes Kästchen Rand, damit Punkte am Rand ganz zu sehen sind
function frameView(f: NonNullable<VectorDrawing['frame']>): View {
  const [xmin, xmax, ymin, ymax] = [f.xmin - 0.6, f.xmax + 0.6, f.ymin - 0.6, f.ymax + 0.6]
  const unit = Math.min(WIDTH / (xmax - xmin), MAX_HEIGHT * 1.25 / (ymax - ymin))
  const range = Math.max(f.xmax - f.xmin, f.ymax - f.ymin)
  return {
    width: (xmax - xmin) * unit,
    height: (ymax - ymin) * unit,
    project: (p) => [(p[0] - xmin) * unit, (ymax - p[1]) * unit],
    unproject: (x, y) => [x / unit + xmin, ymax - y / unit],
    grid: { xmin, xmax, ymin, ymax, step: range > 26 ? 5 : range > 13 ? 2 : 1 },
  }
}

export function spaceView(d: VectorDrawing, yaw: number, pitch: number): View {
  // Mitte des Inhalts (mit Ursprung) als Drehpunkt, damit das Bild den Platz füllt
  const coords = [[0, 0, 0], ...drawingCoordinates(d)]
  const center = [0, 1, 2].map((k) => (Math.min(...coords.map((c) => c[k])) + Math.max(...coords.map((c) => c[k]))) / 2)
  const radius = Math.max(1, ...coords.map((c) => Math.hypot(c[0] - center[0], c[1] - center[1], c[2] - center[2]))) * 1.08
  const reach = Math.max(1, ...coords.map((c) => Math.hypot(...c)))
  const size = 300
  const scale = (size / 2 - 18) / radius
  const [cy, sy, cp, sp] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)]
  return {
    width: size,
    height: size,
    project: (p) => {
      const [x, y, z] = [p[0] - center[0], p[1] - center[1], p[2] - center[2]]
      const xr = x * cy - y * sy
      const yr = x * sy + y * cy
      return [size / 2 + scale * xr, size / 2 - scale * (yr * sp + z * cp)]
    },
    axisLength: Math.min(reach, radius * 1.4) * 0.8,
  }
}

// Blickwinkel zu Beginn: der, unter dem der kürzeste sichtbare Pfeil am längsten erscheint (kein Pfeil zeigt auf den
// Betrachter); gleich gut: der erste der Liste
export const START_PITCH = 0.42
// Mit Winkeln (Skalarprodukt, M7 Schritt 2) zählt auch, wie unverzerrt der Winkel erscheint: Bogen und Pfeile sollen
// nicht zu einem Strich zusammenfallen.
export function bestYaw(d: VectorDrawing): number {
  const angles = d.angles ?? []
  const candidates = [-0.62, -0.25, -1.0, 0.3, -1.4, 0.75, 2.2, -2.3, ...(angles.length > 0 ? [1.2, -1.8, 1.7, -2.8, 2.7, 0.0] : [])]
  const arrows = d.arrows.filter((a) => !a.ghost)
  if (arrows.length === 0 && angles.length === 0) return candidates[0]
  let best = { yaw: candidates[0], score: -1 }
  for (const yaw of candidates) {
    const view = spaceView(d, yaw, START_PITCH)
    const lengths = Math.min(
      1e9,
      ...arrows.map((a) => {
        const [x1, y1] = view.project(a.from)
        const [x2, y2] = view.project(a.to)
        return Math.hypot(x2 - x1, y2 - y1) / Math.max(1e-9, Math.hypot(...a.to.map((x, k) => x - a.from[k])))
      }),
    )
    const score = (lengths === 1e9 ? 1 : lengths) * Math.pow(angleFidelity(view, angles), 2) * Math.sqrt(faceFidelity(d, yaw))
    if (score > best.score * 1.15) best = { yaw, score }
  }
  return best.yaw
}

// Grundfläche (erste Fläche ohne Bewegung, M7 Schritt 4b): 1, wenn man senkrecht draufschaut, klein, wenn man sie von der
// Kante sieht (sonst zeigt z. B. das Bild „komplanar" alle Pfeile auf einem Strich)
function faceFidelity(d: VectorDrawing, yaw: number): number {
  const face = d.dim === 3 ? d.polygons.find((p) => p.points.length >= 3 && !p.from) : undefined
  if (!face) return 1
  const [p, q, r] = face.points
  const u = q.map((x, i) => x - p[i])
  const v = r.map((x, i) => x - p[i])
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const length = Math.hypot(...n)
  if (length < 1e-9) return 1
  // Blickrichtung der Ansicht (senkrecht zu beiden Achsen des Bildschirms, siehe spaceView)
  const [cy, sy, cp, sp] = [Math.cos(yaw), Math.sin(yaw), Math.cos(START_PITCH), Math.sin(START_PITCH)]
  const look = [-sy * cp, -cy * cp, sp]
  return Math.max(0.2, Math.abs(n.reduce((s, x, i) => s + x * look[i], 0)) / length)
}

// 1, wenn alle Winkel im Bild so groß erscheinen wie in Wirklichkeit; kleiner, je mehr sie verzerrt sind
function angleFidelity(view: View, angles: NonNullable<VectorDrawing['angles']>): number {
  const clamp = (x: number) => Math.max(-1, Math.min(1, x))
  const between = (u: readonly number[], v: readonly number[]) => Math.acos(clamp(u.reduce((s, x, i) => s + x * v[i], 0) / Math.max(1e-12, Math.hypot(...u) * Math.hypot(...v))))
  return Math.min(
    1,
    ...angles.map((a) => {
      const [ox, oy] = view.project(a.at)
      const screen = (k: readonly number[]) => {
        const [x, y] = view.project(a.at.map((x0, i) => x0 + k[i]))
        return [x - ox, y - oy]
      }
      const shown = between(screen(a.u), screen(a.v))
      const real = between(a.u, a.v)
      return Math.min(shown, real) / Math.max(shown, real, 1e-9)
    }),
  )
}

// Spitze eines Pfeils: Dreieck an der Spitze, Linie endet davor
export function arrowGeometry(x1: number, y1: number, x2: number, y2: number, head = 15) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy)
  if (length < 1) return null
  const ux = dx / length
  const uy = dy / length
  const hl = Math.min(head, length * 0.55)
  const hw = hl * 0.6
  const bx = x2 - ux * hl
  const by = y2 - uy * hl
  return {
    line: { x1, y1, x2: bx + ux * 2, y2: by + uy * 2 },
    head: `M${x2},${y2}L${bx - uy * hw},${by + ux * hw}L${bx + uy * hw},${by - ux * hw}Z`,
    // Platz für den Namen: neben der Mitte, links der Laufrichtung
    label: { x: (x1 + x2) / 2 + uy * 16, y: (y1 + y2) / 2 - ux * 16 },
  }
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerpPoint = (a: readonly number[], b: readonly number[], t: number) => a.map((x, i) => lerp(x, b[i], t))
