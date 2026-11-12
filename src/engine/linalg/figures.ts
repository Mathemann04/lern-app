// Bilder zu Vektor-Aufgaben (M7): reine Daten, aus der Aufgabe gerechnet; die Oberfläche (ui/draw/) zeichnet sie.
// In der Ebene (zwei Einträge) als Gitter mit Achsen, im Raum (drei Einträge) als Ansicht zum Drehen. Elemente mit
// phase > 0 erscheinen beim „Abspielen" nacheinander (Phase 1 zuerst); ohne Abspielen ist alles da.

// Farben der Pfeile: a erster gegebener Vektor (blau), b zweiter (orange), r Ergebnis (violett), c dritter oder Hilfe
// (blaugrün), muted Hilfslinien (grau), bad ein falsches Ergebnis (rot, nur bei „Bild wählen")
export type DrawColor = 'a' | 'b' | 'r' | 'c' | 'muted' | 'bad'

export type DrawArrow = {
  readonly from: readonly number[]
  readonly to: readonly number[]
  readonly color: DrawColor
  // Name am Pfeil (LaTeX ohne $), z. B. \vec a oder \overrightarrow{AB}
  readonly label?: string
  // gestrichelt und blass (z. B. Ortsvektoren)
  readonly ghost?: boolean
  readonly phase?: number
  // beim Abspielen: der Pfeil gleitet von hier (Fuß) an seinen Platz, z. B. b an die Spitze von a
  readonly slideFrom?: readonly number[]
}

export type DrawPoint = {
  readonly at: readonly number[]
  // Name (LaTeX ohne $), z. B. A oder M
  readonly label?: string
  readonly color?: DrawColor
  readonly phase?: number
}

// Strecke ohne Spitze, z. B. Kanten eines Quaders oder Seiten eines Parallelogramms
export type DrawSegment = {
  readonly from: readonly number[]
  readonly to: readonly number[]
  readonly color: DrawColor
  readonly dashed?: boolean
  readonly phase?: number
  // Beschriftung an der Mitte (LaTeX ohne $), z. B. die Länge einer Kathete
  readonly label?: string
}

export type DrawPolygon = {
  readonly points: readonly (readonly number[])[]
  readonly color: DrawColor
  readonly phase?: number
}

// Winkel zwischen zwei Pfeilen am Scheitel at (Richtungen u und v): als Bogen, bei 90° als kleines Quadrat
export type DrawAngle = {
  readonly at: readonly number[]
  readonly u: readonly number[]
  readonly v: readonly number[]
  readonly color: DrawColor
  // Beschriftung (LaTeX ohne $), z. B. \varphi oder 60^\circ
  readonly label?: string
  readonly phase?: number
}

export type VectorDrawing = {
  // 2: Ebene, 3: Raum
  readonly dim: 2 | 3
  readonly arrows: readonly DrawArrow[]
  readonly points: readonly DrawPoint[]
  readonly segments: readonly DrawSegment[]
  readonly polygons: readonly DrawPolygon[]
  // Winkelbögen und rechte Winkel (Skalarprodukt und Winkel, M7 Schritt 2)
  readonly angles?: readonly DrawAngle[]
  // Beschreibung (Text mit Formeln) unter dem Bild und für Vorlesehilfen
  readonly caption: string
  // fester Ausschnitt der Ebene (Zieh-Aufgaben, Schritt 2b): Das Bild springt beim Ziehen nicht
  readonly frame?: { readonly xmin: number; readonly xmax: number; readonly ymin: number; readonly ymax: number }
}

export const hasAnimation = (d: VectorDrawing): boolean =>
  [...d.arrows, ...d.points, ...d.segments, ...d.polygons, ...(d.angles ?? [])].some((e) => (e.phase ?? 0) > 0)

// Alle Koordinaten eines Bildes (für Tests und den Ausschnitt)
export function drawingCoordinates(d: VectorDrawing): (readonly number[])[] {
  return [
    ...d.arrows.flatMap((a) => [a.from, a.to, ...(a.slideFrom ? [a.slideFrom] : [])]),
    ...d.points.map((p) => p.at),
    ...d.segments.flatMap((s) => [s.from, s.to]),
    ...d.polygons.flatMap((p) => p.points),
    ...(d.angles ?? []).map((a) => a.at),
  ]
}

export const emptyDrawing = (dim: 2 | 3, caption: string): VectorDrawing => ({ dim, arrows: [], points: [], segments: [], polygons: [], caption })

// Punkte eines Winkelbogens (oder des Quadrats beim rechten Winkel) mit Radius r, dazu die Stelle für die Beschriftung.
// Rechnet in der Ebene und im Raum gleich: Bogen in der Ebene, die u und v aufspannen.
export function anglePath(a: DrawAngle, r: number): { readonly points: readonly (readonly number[])[]; readonly right: boolean; readonly labelAt: readonly number[] } {
  const len = (x: readonly number[]) => Math.hypot(...x)
  const dot = (x: readonly number[], y: readonly number[]) => x.reduce((s, xi, i) => s + xi * y[i], 0)
  const e1 = a.u.map((x) => x / len(a.u))
  const vn = a.v.map((x) => x / len(a.v))
  const c = Math.max(-1, Math.min(1, dot(e1, vn)))
  const theta = Math.acos(c)
  const at = (k: readonly number[], s: number) => a.at.map((x, i) => x + s * k[i])
  const bis = e1.map((x, i) => x + vn[i])
  const bisector = len(bis) < 1e-9 ? e1 : bis.map((x) => x / len(bis))
  if (Math.abs(c) < 1e-9) {
    const corner = e1.map((x, i) => x + vn[i])
    return { points: [at(e1, r), at(corner, r), at(vn, r)], right: true, labelAt: at(bisector, r * 2.2) }
  }
  const perp = vn.map((x, i) => x - c * e1[i])
  const e2 = perp.map((x) => x / len(perp))
  const n = Math.max(6, Math.ceil(theta / 0.12))
  const points = Array.from({ length: n + 1 }, (_, k) => {
    const t = (theta * k) / n
    return a.at.map((x, i) => x + r * (Math.cos(t) * e1[i] + Math.sin(t) * e2[i]))
  })
  return { points, right: false, labelAt: at(bisector, r * 2.3) }
}
