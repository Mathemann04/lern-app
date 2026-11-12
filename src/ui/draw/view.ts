import { type VectorDrawing, drawingCoordinates } from '../../engine/linalg/figures.ts'

// Ausschnitt und Abbildung eines Vektor-Bilds auf die Zeichenfläche (M7, Zeichen-Grundlage für Vektoren und später M6b).
// Ebene: Gitter mit ganzzahligen Linien, y nach oben. Raum: Blick schräg von oben, z nach oben; yaw dreht um die
// senkrechte Achse, pitch kippt (0 von vorn, π/2 von oben). Ohne Bibliothek, damit es klein und offline bleibt.

export type View = {
  readonly width: number
  readonly height: number
  // Weltpunkt → Punkt der Zeichenfläche
  readonly project: (p: readonly number[]) => readonly [number, number]
  // Ebene: Gitter
  readonly grid?: { readonly xmin: number; readonly xmax: number; readonly ymin: number; readonly ymax: number; readonly step: number }
  // Raum: Länge der Achsen
  readonly axisLength?: number
}

const WIDTH = 320
const MAX_HEIGHT = 260

export function planeView(d: VectorDrawing): View {
  const coords = [[0, 0], ...drawingCoordinates(d)]
  const xs = coords.map((c) => c[0])
  const ys = coords.map((c) => c[1])
  const pad = 0.9
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
    grid: { xmin, xmax, ymin, ymax, step },
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
export function bestYaw(d: VectorDrawing): number {
  const candidates = [-0.62, -0.25, -1.0, 0.3, -1.4, 0.75, 2.2, -2.3]
  const arrows = d.arrows.filter((a) => !a.ghost)
  if (arrows.length === 0) return candidates[0]
  let best = { yaw: candidates[0], score: -1 }
  for (const yaw of candidates) {
    const view = spaceView(d, yaw, START_PITCH)
    const score = Math.min(
      ...arrows.map((a) => {
        const [x1, y1] = view.project(a.from)
        const [x2, y2] = view.project(a.to)
        return Math.hypot(x2 - x1, y2 - y1) / Math.max(1e-9, Math.hypot(...a.to.map((x, k) => x - a.from[k])))
      }),
    )
    if (score > best.score * 1.15) best = { yaw, score }
  }
  return best.yaw
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
