import { type Rational, isZero, rat, ratDiv, ratMul, ratNeg, ratSign, ratSub } from '../rational.ts'
import type { Rng } from '../random/rng.ts'
import { termsLatex } from './crossTasks.ts'
import { type DrawArrow, type DrawPoint, type DrawPolygon, type DrawSegment, type VectorDrawing, emptyDrawing } from './figures.ts'
import { nums } from './taskKit.ts'
import { type Vec, ratLatex, vec, vecAdd, vecDot, vecIsZero, vecLatex, vecScale, vecSub } from './vec.ts'

// Gemeinsame Teile der Tätigkeit „Geraden und Ebenen" (M7 Schritt 6): Schreibweisen der Formen (Parameterform,
// Normalenform, Koordinatenform), gekürzte Normalenvektoren und die Bilder (Gerade als Strecke durchs Bild, Ebene als
// Stück mit Normale, Spurpunkte und Spurdreieck). Genutzt von lineTasks.ts und planeTasks.ts.

export const COORDS = ['x', 'y', 'z'] as const
// Namen der Koordinatenebenen und Achsen (Spurpunkte)
export const PLANE_OF: readonly string[] = ['y\\text{-}z', 'x\\text{-}z', 'x\\text{-}y']
export const AXIS_OF: readonly string[] = ['x', 'y', 'z']

const m = ratMul

// ------------------------------------------------------------------ LaTeX der Formen

// Parameterform: g\colon \vec x = (p) + t (v) [+ s (w)]; dirs: [Parameter, Richtung]
export const paramFormLatex = (name: string, p: Vec, dirs: readonly (readonly [string, Vec])[]): string =>
  `${name}\\colon \\vec x = ${vecLatex(p)}${dirs.map(([t, v]) => ` + ${t} ${vecLatex(v)}`).join('')}`

// Koordinatenform: E\colon 2x - y + 3z = 6 (in der Ebene: g\colon 2x - y = 3)
export const coordLatex = (name: string, n: Vec, d: Rational): string =>
  `${name}\\colon ${termsLatex(n.map((c, i) => [c, COORDS[i]] as const))} = ${ratLatex(d)}`

// linke Seite allein (für Rechnungen): 2x - y + 3z
export const lhsLatex = (n: Vec): string => termsLatex(n.map((c, i) => [c, COORDS[i]] as const))

// Normalenform: E\colon \vec n \cdot (\vec x - \vec p) = 0
export const normalFormLatex = (name: string, n: Vec, p: Vec): string => `${name}\\colon ${vecLatex(n)} \\cdot \\left(\\vec x - ${vecLatex(p)}\\right) = 0`

// Punkt in die linke Seite eingesetzt: 2 \cdot 1 - 1 \cdot (-2) + 3 \cdot 4 (Faktoren 0 fallen weg)
export function insertLatex(n: Vec, p: Vec): string {
  const parts = n
    .map((c, i) => [c, p[i]] as const)
    .filter(([c]) => !isZero(c))
    .map(([c, x], i) => {
      const abs = ratSign(c) < 0 ? ratNeg(c) : c
      const val = ratSign(x) < 0 ? `(${ratLatex(x)})` : ratLatex(x)
      const sign = ratSign(c) < 0 ? (i === 0 ? '-' : ' - ') : i === 0 ? '' : ' + '
      return `${sign}${ratLatex(abs)} \\cdot ${val}`
    })
  return parts.length ? parts.join('') : '0'
}

// ------------------------------------------------------------------ Zahlen

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b))

// Kleinster ganzzahliger Vektor in derselben Richtung (gekürzt), Vorzeichen bleibt
export function primitive(v: Vec): Vec {
  const lcm = v.reduce((l, x) => (l * x.d) / gcd(l, x.d), 1n)
  const ints = v.map((x) => (x.n * lcm) / x.d)
  const g = ints.reduce((acc, x) => gcd(acc, x), 0n)
  return g === 0n ? v : ints.map((x) => rat(x / g))
}

// Faktor, um den v gekürzt wurde (v = k · primitive(v))
export const shrinkFactor = (v: Vec): Rational => {
  const p = primitive(v)
  const i = p.findIndex((x) => !isZero(x))
  return ratDiv(v[i], p[i])
}

// Zwei Vektoren parallel (alle 2 × 2-Unterdeterminanten 0)
export function isParallel(u: Vec, v: Vec): boolean {
  for (let i = 0; i < u.length; i++) for (let j = i + 1; j < u.length; j++) if (!isZero(ratSub(m(u[i], v[j]), m(u[j], v[i])))) return false
  return true
}

// Ganzzahliger Vektor mit Einträgen in [-R, R], nicht der Nullvektor, höchstens zmax Nullen
export function pickDir(rng: Rng, dim: number, R: number, zmax = 0): Vec {
  for (;;) {
    const v = vec(...Array.from({ length: dim }, () => rng.int(-R, R)))
    if (vecIsZero(v) || v.filter(isZero).length > zmax) continue
    // gekürzt, damit die Richtung nicht schon ein Vielfaches ist
    if (primitive(v).every((x, i) => x.n === v[i].n)) return v
  }
}

// Punkt mit kleinen ganzen Koordinaten
export const pickPoint = (rng: Rng, dim: number, R: number): Vec => vec(...Array.from({ length: dim }, () => rng.int(-R, R)))

export const at = (p: Vec, v: Vec, t: Rational): Vec => vecAdd(p, vecScale(t, v))
export const dOf = (n: Vec, p: Vec): Rational => vecDot(n, p)

// ------------------------------------------------------------------ Bilder

const add = (p: readonly number[], q: readonly number[]) => p.map((x, i) => x + q[i])
const scale = (k: number, p: readonly number[]) => p.map((x) => k * x)
const len = (v: readonly number[]) => Math.hypot(...v)

// Strecke einer Geraden durchs Bild: so lang, dass alle wichtigen Punkte darauf liegen, mit etwas Rand
export function lineSegment(p: Vec, v: Vec, ts: readonly number[]): { readonly from: readonly number[]; readonly to: readonly number[] } {
  const lo = Math.min(-1, ...ts)
  const hi = Math.max(1.6, ...ts)
  const pad = 0.5
  const [pn, vn] = [nums(p), nums(v)]
  return { from: add(pn, scale(lo - pad, vn)), to: add(pn, scale(hi + pad, vn)) }
}

export type LineFigureOpts = {
  readonly name: string
  readonly p: Vec
  readonly v: Vec
  // Name des Stützpunkts (sonst ohne Namen)
  readonly pName?: string
  // weitere Punkte (mit Farbe und Phase)
  readonly points?: readonly DrawPoint[]
  // Parameterwerte, die ins Bild sollen
  readonly ts?: readonly number[]
  // mit Ablauf: Stützvektor, Richtung, Gerade nacheinander
  readonly play?: boolean
  readonly caption: string
}

// Gerade mit Stützvektor (blass vom Ursprung), Richtungsvektor (orange) und der Geraden selbst (gestrichelt)
export function lineFigure(o: LineFigureOpts): VectorDrawing {
  const dim = o.p.length as 2 | 3
  const [pn, vn] = [nums(o.p), nums(o.v)]
  const phase = (k: number) => (o.play ? { phase: k } : {})
  const seg = lineSegment(o.p, o.v, o.ts ?? [])
  const arrows: DrawArrow[] = [
    { from: pn.map(() => 0), to: pn, color: 'a', ghost: true, label: '\\vec p', ...phase(1) },
    { from: pn, to: add(pn, vn), color: 'b', label: '\\vec v', ...phase(2) },
  ]
  const segments: DrawSegment[] = [{ ...seg, color: 'r', dashed: true, label: o.name, ...phase(3) }]
  const points: DrawPoint[] = [{ at: pn, ...(o.pName ? { label: o.pName } : {}), color: 'a', ...phase(1) }, ...(o.points ?? [])]
  return { ...emptyDrawing(dim, o.caption), arrows, segments, points }
}

// Zwei Richtungen in einer Ebene mit Normale n (ganzzahlig, senkrecht auf n, nicht parallel)
export function planeDirections(n: Vec): readonly [Vec, Vec] {
  const e = [vec(1, 0, 0), vec(0, 1, 0), vec(0, 0, 1)]
  const cands = e.map((ei) => primitive(crossVec(n, ei))).filter((x) => !vecIsZero(x))
  const u = cands[0]
  const w = cands.find((x) => !isParallel(x, u))!
  return [u, w]
}

export const crossVec = (a: Vec, b: Vec): Vec => [ratSub(m(a[1], b[2]), m(a[2], b[1])), ratSub(m(a[2], b[0]), m(a[0], b[2])), ratSub(m(a[0], b[1]), m(a[1], b[0]))]

export type PlaneFigureOpts = {
  readonly p: Vec
  readonly u: Vec
  readonly w: Vec
  readonly name: string
  // Normale (nur mit Ergebnis oder wenn gegeben)
  readonly n?: Vec
  // Namen und Lage von Punkten
  readonly points?: readonly DrawPoint[]
  // Richtungen als Pfeile zeigen (Parameterform)
  readonly showDirs?: boolean
  readonly play?: boolean
  readonly caption: string
}

// Ebene als Parallelogramm um den Stützpunkt, Richtungen als Pfeile, Normale am Stützpunkt
export function planeFigure(o: PlaneFigureOpts): VectorDrawing {
  const [pn, un, wn] = [nums(o.p), nums(o.u), nums(o.w)]
  const phase = (k: number) => (o.play ? { phase: k } : {})
  const corner = (a: number, b: number) => add(add(pn, scale(a, un)), scale(b, wn))
  const polygons: DrawPolygon[] = [{ points: [corner(-0.6, -0.6), corner(1.4, -0.6), corner(1.4, 1.4), corner(-0.6, 1.4)], color: 'c', ...phase(1) }]
  const arrows: DrawArrow[] = [{ from: [0, 0, 0], to: pn, color: 'a', ghost: true, label: '\\vec p' }]
  if (o.showDirs)
    arrows.push({ from: pn, to: add(pn, un), color: 'b', label: '\\vec u', ...phase(1) }, { from: pn, to: add(pn, wn), color: 'b', label: '\\vec v', ...phase(1) })
  if (o.n) {
    const nn = nums(o.n)
    // Normale etwa so lang wie die Richtungen
    const k = Math.max(len(un), len(wn)) / len(nn)
    arrows.push({ from: pn, to: add(pn, scale(Math.min(1, k * 0.9), nn)), color: 'r', label: '\\vec n', ...phase(2) })
  }
  const points: DrawPoint[] = [{ at: pn, color: 'a' }, ...(o.points ?? [])]
  return { ...emptyDrawing(3, o.caption), arrows, polygons, points, segments: [] }
}

// Spurdreieck einer Ebene mit drei Spurpunkten auf den Achsen (Koordinatenform ohne Null)
export function traceFigure(n: Vec, d: Rational, caption: string, play = true): VectorDrawing {
  const pts = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? Number(ratDiv(d, n[i]).n) / Number(ratDiv(d, n[i]).d) : 0)))
  const phase = (k: number) => (play ? { phase: k } : {})
  const points: DrawPoint[] = pts.map((at, i) => ({ at, label: `S_${AXIS_OF[i]}`, color: 'r' as const, ...phase(i + 1) }))
  // Achsen bis zu den Spurpunkten verlängert, damit jeder Punkt sichtbar auf seiner Achse liegt
  const axes: DrawSegment[] = pts.map((to) => ({ from: [0, 0, 0], to, color: 'muted' as const, dashed: true }))
  const segments: DrawSegment[] = [...axes, ...[0, 1, 2].map((i) => ({ from: pts[i], to: pts[(i + 1) % 3], color: 'c' as const, ...phase(4) }))]
  const polygons: DrawPolygon[] = [{ points: pts, color: 'c', ...phase(4) }]
  return { ...emptyDrawing(3, caption), points, segments, polygons }
}

// ------------------------------------------------------------------ gleich?

// Dieselbe Gerade: Richtungen parallel und der Stützpunkt der einen liegt auf der anderen
export const sameLine = (p: Vec, v: Vec, q: Vec, w: Vec): boolean => !vecIsZero(w) && isParallel(v, w) && isParallel(vecSub(q, p), v)
// Dieselbe Ebene in Parameterform (gleiche Normale, Stützpunkt in der Ebene)
export function samePlane(p: Vec, u: Vec, v: Vec, q: Vec, a: Vec, b: Vec): boolean {
  const n = crossVec(u, v)
  const n2 = crossVec(a, b)
  return !vecIsZero(n2) && isParallel(n, n2) && isZero(vecDot(n, vecSub(q, p)))
}
// Dieselbe Ebene in Koordinatenform: (n, d) Vielfaches von (m, e)
export const sameCoord = (n: Vec, d: Rational, m2: Vec, e: Rational): boolean => !vecIsZero(m2) && isParallel([...n, d], [...m2, e])
