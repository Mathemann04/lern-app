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

export type VectorDrawing = {
  // 2: Ebene, 3: Raum
  readonly dim: 2 | 3
  readonly arrows: readonly DrawArrow[]
  readonly points: readonly DrawPoint[]
  readonly segments: readonly DrawSegment[]
  readonly polygons: readonly DrawPolygon[]
  // Beschreibung (Text mit Formeln) unter dem Bild und für Vorlesehilfen
  readonly caption: string
}

export const hasAnimation = (d: VectorDrawing): boolean =>
  [...d.arrows, ...d.points, ...d.segments, ...d.polygons].some((e) => (e.phase ?? 0) > 0)

// Alle Koordinaten eines Bildes (für Tests und den Ausschnitt)
export function drawingCoordinates(d: VectorDrawing): (readonly number[])[] {
  return [
    ...d.arrows.flatMap((a) => [a.from, a.to, ...(a.slideFrom ? [a.slideFrom] : [])]),
    ...d.points.map((p) => p.at),
    ...d.segments.flatMap((s) => [s.from, s.to]),
    ...d.polygons.flatMap((p) => p.points),
  ]
}

export const emptyDrawing = (dim: 2 | 3, caption: string): VectorDrawing => ({ dim, arrows: [], points: [], segments: [], polygons: [], caption })
