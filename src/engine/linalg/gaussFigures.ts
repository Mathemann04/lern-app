import { type DrawColor, type DrawMistake, type DrawPoint, type DrawPolygon, type DrawSegment, type VectorDrawing, emptyDrawing } from './figures.ts'

// Bilder zum Gauß-Verfahren (M7 Schritt 10b): Mit zwei Unbekannten ist jede Zeile der Tabelle eine Gerade in der Ebene,
// mit drei Unbekannten eine Ebene im Raum (mit vier gibt es kein Bild). Die Engine rechnet alles aus den Zeilen.
// - Nach jedem Schritt „Nullen erzeugen“ (`elimDrawing`): Die Umformung II − k · I dreht Gerade II um ihren Schnittpunkt
//   mit Gerade I (bzw. Ebene II um die Schnittgerade); beim Abspielen gleitet sie aus der alten Lage in die neue. Der
//   typische Fehler „rechte Seite vergessen“ verschiebt sie stattdessen (rot).
// - Beim Ergebnis (`systemDrawing`): die Geraden bzw. Ebenen der Aufgabe nacheinander, dann die Lösung (Punkt oder Gerade).
// Zeilen kommen als Zahlen (a_1, …, a_n | c).

type NRow = readonly number[]
type Pt = readonly number[]

const EPS = 1e-9
// Farben der Zeilen I, II, III (Pfeilfarben der Zeichen-Grundlage) und ihre Namen in der Beschreibung
const ROW_COLORS: readonly DrawColor[] = ['a', 'b', 'c']
const COLOR_WORDS = ['blau', 'orange', 'blaugrün']
const ROMAN = ['I', 'II', 'III', 'IV']
// halbe Länge einer Geraden, halbe Seite eines Ebenenstücks, halbe Länge der Lösungsgeraden (Einheiten der Achsen)
export const LINE_HALF = 4
export const PLANE_HALF = 3
const SOLUTION_HALF = 4.8
// typischer Fehler nur, wenn die verschobene Gerade bzw. Ebene nah genug liegt (sonst springt der Ausschnitt)
const MISTAKE_MAX = 6

const dot = (a: Pt, b: Pt) => a.reduce((s, x, i) => s + x * b[i], 0)
const add = (a: Pt, b: Pt) => a.map((x, i) => x + b[i])
const scale = (k: number, a: Pt) => a.map((x) => k * x)
const len = (a: Pt) => Math.hypot(...a)
const unit = (a: Pt) => scale(1 / len(a), a)
const cross = (a: Pt, b: Pt) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

const normalOf = (row: NRow, n: number) => row.slice(0, n)
const rhsOf = (row: NRow, n: number) => row[n]
// Zeile ohne Gerade bzw. Ebene: links nur Nullen (0 = c)
export const isFlat = (row: NRow, n: number) => normalOf(row, n).every((x) => Math.abs(x) < EPS)
// dieselbe Gerade bzw. Ebene (Zeilen sind Vielfache voneinander, auch rechts)
const sameRow = (a: NRow, b: NRow) => {
  const i = a.findIndex((x) => Math.abs(x) > EPS)
  if (i < 0 || Math.abs(b[i]) < EPS) return false
  const k = b[i] / a[i]
  return a.every((x, j) => Math.abs(k * x - b[j]) < 1e-7)
}
// gleiche Richtung der Normalen (parallel oder gleich)
const parallelRows = (a: NRow, b: NRow, n: number) => {
  const na = normalOf(a, n)
  const nb = normalOf(b, n)
  if (n === 2) return Math.abs(na[0] * nb[1] - na[1] * nb[0]) < 1e-7
  return len(cross(na, nb)) < 1e-7
}

// Lotfußpunkt von z auf der Geraden bzw. Ebene der Zeile
export function footOn(z: Pt, row: NRow, n: number): Pt {
  const nn = normalOf(row, n)
  return add(z, scale((rhsOf(row, n) - dot(nn, z)) / dot(nn, nn), nn))
}

// Abstand eines Punktes von der Geraden bzw. Ebene einer Zeile (für Tests und den typischen Fehler)
export const distanceTo = (p: Pt, row: NRow, n: number) => Math.abs(dot(normalOf(row, n), p) - rhsOf(row, n)) / len(normalOf(row, n))

// Richtung einer Geraden a x + b y = c
const lineDir = (row: NRow) => unit([-row[1], row[0]])

// zwei Richtungen in der Ebene der Zeile, fest aus der Normalen (gleiche Ebenen bekommen dieselben Ecken)
function planeBasis(row: NRow): [Pt, Pt] {
  const nn = unit(normalOf(row, 3))
  const k = [0, 1, 2].reduce((best, i) => (Math.abs(nn[i]) < Math.abs(nn[best]) ? i : best), 0)
  const axis = [0, 1, 2].map((i) => (i === k ? 1 : 0))
  const e1 = unit(cross(nn, axis))
  return [e1, unit(cross(nn, e1))]
}

const corners = (c: Pt, e1: Pt, e2: Pt, s: number): Pt[] => [
  add(add(c, scale(-s, e1)), scale(-s, e2)),
  add(add(c, scale(s, e1)), scale(-s, e2)),
  add(add(c, scale(s, e1)), scale(s, e2)),
  add(add(c, scale(-s, e1)), scale(s, e2)),
]

const rowName = (i: number) => `\\text{${ROMAN[i]}}`

// Gerade (Strecke um center) bzw. Ebenenstück (Quadrat um center) einer Zeile
function lineSegment(row: NRow, center: Pt, color: DrawColor, i: number, extra: Partial<DrawSegment> = {}): DrawSegment {
  const u = lineDir(row)
  return { from: add(center, scale(-LINE_HALF, u)), to: add(center, scale(LINE_HALF, u)), color, label: rowName(i), labelAt: LABEL_AT[i % 3], ...extra }
}
// Namen nicht alle an derselben Stelle (Geraden durch einen Punkt, gleiche Geraden)
const LABEL_AT = [0.9, 0.12, 0.72]
function planePatch(row: NRow, center: Pt, color: DrawColor, i: number, extra: Partial<DrawPolygon> = {}): DrawPolygon {
  const [e1, e2] = planeBasis(row)
  return { points: corners(center, e1, e2, PLANE_HALF), color, label: rowName(i), labelCorner: i % 4, ...extra }
}

// Mittelpunkt des Bildes: die Lösung (bzw. ein Punkt der Lösungsmenge, freie Variablen 0), ohne Lösung der Schwerpunkt
// der Lotfußpunkte des Ursprungs
export function sceneCenter(T: readonly NRow[], n: number): Pt {
  const p = particularSolution(T, n)
  if (p) return p
  const feet = T.filter((r) => !isFlat(r, n)).map((r) => footOn(Array(n).fill(0), r, n))
  return scale(1 / feet.length, feet.reduce((s, f) => add(s, f), Array(n).fill(0)))
}

// eine Lösung mit freien Variablen 0 (oder null, wenn es keine gibt), mit Kommazahlen gerechnet
function particularSolution(T: readonly NRow[], n: number): Pt | null {
  const M = T.map((r) => [...r])
  const pivots: number[] = []
  let r = 0
  for (let c = 0; c < n && r < M.length; c++) {
    let p = r
    for (let i = r + 1; i < M.length; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    if (Math.abs(M[p][c]) < 1e-9) continue
    ;[M[p], M[r]] = [M[r], M[p]]
    const piv = M[r][c]
    M[r] = M[r].map((x) => x / piv)
    for (let i = 0; i < M.length; i++) if (i !== r) M[i] = M[i].map((x, j) => x - M[i][c] * M[r][j])
    pivots.push(c)
    r++
  }
  if (M.slice(r).some((row) => Math.abs(row[n]) > 1e-7)) return null
  const x = Array(n).fill(0)
  pivots.forEach((c, i) => (x[c] = M[i][n]))
  return x
}

const nounOf = (n: number) => (n === 2 ? 'Gerade' : 'Ebene')
const nounsOf = (n: number) => (n === 2 ? 'Geraden' : 'Ebenen')
// Farben der Zeilen, die im Bild farbig sind (eine Zeile 0 = c ist nur grau)
const colorList = (rows: readonly number[], m: number, n: number, what = 'Zeile') => {
  const list = rows.map((i) => `$${rowName(i)}$ ${COLOR_WORDS[i]}`).join(', ')
  return rows.length === m ? `Jede ${what} ist eine ${nounOf(n)}: ${list}.` : `${rows.length === 1 ? nounOf(n) : nounsOf(n)} im Bild: ${list}.`
}
const words = (xs: readonly string[]) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} und ${xs[xs.length - 1]}`)

export type ElimInput = {
  readonly before: readonly NRow[]
  readonly after: readonly NRow[]
  // Zeile der Stufe, Spalte, umgeformte Zeilen mit dem Namen der Umformung (LaTeX)
  readonly row: number
  readonly targets: readonly { readonly target: number; readonly label: string }[]
  readonly n: number
  readonly vars: readonly string[]
  readonly center: Pt
}

// Drehpunkt (Ebene) bzw. Punkt auf der Schnittgeraden mit Richtung (Raum) von Stufenzeile und alter Zeile
function pivotOf(p: NRow, q: NRow, n: number, z: Pt): { at: Pt; dir?: Pt } | null {
  if (parallelRows(p, q, n)) return null
  if (n === 2) {
    const det = p[0] * q[1] - p[1] * q[0]
    return { at: [(p[2] * q[1] - p[1] * q[2]) / det, (p[0] * q[2] - p[2] * q[0]) / det] }
  }
  const d = cross(normalOf(p, 3), normalOf(q, 3))
  // Punkt der Schnittgeraden, der z am nächsten liegt: n_p · x = c_p, n_q · x = c_q, d · x = d · z (Cramer)
  const A = [normalOf(p, 3), normalOf(q, 3), d]
  const b = [p[3], q[3], dot(d, z)]
  const det3 = (M: readonly Pt[]) => dot(M[0], cross(M[1], M[2]))
  const D = det3(A)
  const at = [0, 1, 2].map((k) => det3(A.map((r, i) => r.map((x, j) => (j === k ? b[i] : x)))) / D)
  return { at, dir: unit(d) }
}

// Bild nach einem Schritt „Nullen erzeugen“: die Zeilen vorher, die umgeformten gleiten beim Abspielen in die neue Lage
export function elimDrawing(e: ElimInput): VectorDrawing | undefined {
  const { before, after, row, targets, n, vars, center } = e
  if (n !== 2 && n !== 3) return undefined
  const m = before.length
  if (m > 3) return undefined
  const segments: DrawSegment[] = []
  const polygons: DrawPolygon[] = []
  const points: DrawPoint[] = []
  const rotated: number[] = []
  const flat: string[] = []
  // Zeilen, die farbig im Bild sind (die Beschreibung nennt nur ihre Farben)
  const colored: number[] = []
  let mistake: DrawMistake | undefined
  for (let i = 0; i < m; i++) {
    const old = before[i]
    const t = targets.find((x) => x.target === i)
    if (isFlat(old, n)) continue
    if (!t) {
      colored.push(i)
      if (n === 2) segments.push(lineSegment(old, footOn(center, old, n), ROW_COLORS[i], i))
      else polygons.push(planePatch(old, footOn(center, old, n), ROW_COLORS[i], i))
      continue
    }
    const neu = after[i]
    const pv = pivotOf(before[row], old, n, center)
    if (!pv || isFlat(neu, n)) {
      // die Zeile wird zu 0 = c: alte Lage blass, nichts Neues
      if (n === 2) segments.push(lineSegment(old, footOn(center, old, n), 'muted', i, { dashed: true }))
      else polygons.push(planePatch(old, footOn(center, old, n), 'muted', i))
      flat.push(`Zeile ${ROMAN[i]} heißt jetzt $0 = ${fmt(neu[n])}$: Sie ist keine ${nounOf(n)} mehr (grau${n === 2 ? ' gestrichelt' : ''} ihre alte Lage).`)
      continue
    }
    rotated.push(i)
    colored.push(i)
    if (n === 2) {
      const uOld = lineDir(old)
      const uNew0 = lineDir(neu)
      const uNew = dot(uOld, uNew0) < 0 ? scale(-1, uNew0) : uNew0
      const at = pv.at
      segments.push({ from: add(at, scale(-LINE_HALF, uOld)), to: add(at, scale(LINE_HALF, uOld)), color: 'muted', dashed: true })
      segments.push({
        from: add(at, scale(-LINE_HALF, uNew)),
        to: add(at, scale(LINE_HALF, uNew)),
        color: ROW_COLORS[i],
        label: rowName(i),
        labelAt: LABEL_AT[i % 3],
        phase: 1,
        slideFrom: [add(at, scale(-LINE_HALF, uOld)), add(at, scale(LINE_HALF, uOld))],
      })
      points.push({ at, color: 'muted' })
    } else {
      const d = pv.dir!
      const wOld = unit(cross(normalOf(old, 3), d))
      const w0 = unit(cross(normalOf(neu, 3), d))
      const wNew = dot(wOld, w0) < 0 ? scale(-1, w0) : w0
      const from = corners(pv.at, d, wOld, PLANE_HALF)
      polygons.push({ points: corners(pv.at, d, wNew, PLANE_HALF), from, color: ROW_COLORS[i], label: rowName(i), labelCorner: i % 4, phase: 1 })
      segments.push({ from: add(pv.at, scale(-PLANE_HALF, d)), to: add(pv.at, scale(PLANE_HALF, d)), color: 'muted', dashed: true })
    }
    // typischer Fehler: rechte Seite nicht umgeformt (nur beim ersten gedrehten Ziel)
    if (!mistake) {
      const wrong = [...neu.slice(0, n), old[n]]
      const gap = distanceTo(pv.at, wrong, n)
      if (gap > 0.3 && gap <= MISTAKE_MAX) {
        const c = footOn(pv.at, wrong, n)
        const caption = `Rechte Seite nicht mitgerechnet: Die rote ${nounOf(n)} liegt parallel zur richtigen, aber verschoben. Sie geht nicht mehr durch ${n === 2 ? 'den Schnittpunkt' : 'die Schnittgerade'} – so kann die Umformung die Lösungen verändern.`
        if (n === 2) mistake = { arrows: [], segments: [lineSegment(wrong, c, 'bad', i, { label: undefined })], caption }
        else {
          const d = pv.dir!
          const w0 = unit(cross(normalOf(neu, 3), d))
          mistake = { arrows: [], segments: [], polygons: [{ points: corners(c, d, w0, PLANE_HALF), color: 'bad' }], caption }
        }
      }
    }
  }
  const t0 = targets.filter((x) => rotated.includes(x.target))
  // nur Variablen, die in allen gedrehten Zeilen fehlen: Zu deren Achsen sind alle neuen parallel
  const missing = t0.length > 0 ? vars.filter((_, j) => t0.every((x) => Math.abs(after[x.target][j]) < EPS)) : []
  const axes = missing.length === 1 ? `zur $${missing[0]}$-Achse` : `zur ${missing.slice(0, -1).map((v) => `$${v}$-`).join(', ')} und zur $${missing[missing.length - 1]}$-Achse`
  const turn =
    t0.length === 0
      ? ''
      : ` ${words(t0.map((x) => `$${x.label}$`))} ${t0.length === 1 ? 'dreht' : 'drehen'} ${t0.length === 1 ? `${nounOf(n)} ${ROMAN[t0[0].target]}` : `die ${nounsOf(n)} ${words(t0.map((x) => ROMAN[x.target]))}`} um ${n === 2 ? (t0.length === 1 ? 'ihren Schnittpunkt' : 'ihre Schnittpunkte') : t0.length === 1 ? 'ihre Schnittgerade' : 'ihre Schnittgeraden'} mit ${nounOf(n)} ${ROMAN[row]}: Was beide Gleichungen erfüllt, erfüllt auch die neue. Ohne ${words(missing.map((v) => `$${v}$`))} ${t0.length === 1 ? `ist die neue ${nounOf(n)}` : `sind die neuen ${nounsOf(n)}`} parallel ${axes}.`
  return {
    ...emptyDrawing(n, `${colorList(colored, m, n)}${turn}${flat.length > 0 ? ` ${flat.join(' ')}` : ''}`),
    segments,
    polygons,
    points,
    ...(mistake ? { mistake } : {}),
  }
}

const fmt = (x: number) => {
  const r = Math.round(x * 1000) / 1000
  return Number.isInteger(r) ? String(r) : String(r).replace('.', '{,}')
}
const pointLatex = (name: string, p: Pt) => `${name}(${p.map(fmt).join(' \\mid ')})`

export type SystemInput = {
  readonly T: readonly NRow[]
  readonly n: number
  // Lösung: ein Punkt bzw. Stützvektor und Richtungen (keine Richtung: genau eine Lösung); null: keine Lösung
  readonly solution: { readonly p: Pt; readonly dirs: readonly Pt[] } | null
}

// Bild zum Ergebnis: die Geraden bzw. Ebenen der Aufgabe nacheinander, dann die Lösung
export function systemDrawing(s: SystemInput): VectorDrawing | undefined {
  const { T, n, solution } = s
  const m = T.length
  if ((n !== 2 && n !== 3) || m > 3) return undefined
  const center = solution ? solution.p : sceneCenter(T, n)
  const segments: DrawSegment[] = []
  const polygons: DrawPolygon[] = []
  const points: DrawPoint[] = []
  T.forEach((row, i) => {
    const c = footOn(center, row, n)
    const twin = T.slice(0, i).some((r) => sameRow(r, row))
    if (n === 2) segments.push(lineSegment(row, c, ROW_COLORS[i], i, { phase: i + 1, ...(twin ? { dashed: true } : {}) }))
    else polygons.push(planePatch(row, c, ROW_COLORS[i], i, { phase: i + 1 }))
  })
  const Ns = nounsOf(n)
  const pairs: [number, number][] = []
  for (let i = 0; i < m; i++) for (let k = i + 1; k < m; k++) pairs.push([i, k])
  const same = pairs.filter(([i, k]) => sameRow(T[i], T[k]))
  const parallel = pairs.filter(([i, k]) => parallelRows(T[i], T[k], n) && !sameRow(T[i], T[k]))
  const pairWords = (ps: readonly [number, number][]) => words(ps.map(([i, k]) => `${ROMAN[i]} und ${ROMAN[k]}`))
  let tail: string
  if (!solution) {
    if (parallel.length === pairs.length) tail = m === 2 ? `Die ${Ns} sind parallel und verschieden: Kein Punkt liegt auf beiden, keine Lösung.` : `Alle ${Ns} sind parallel, aber nicht alle gleich: Kein Punkt liegt auf allen, keine Lösung.`
    else if (parallel.length > 0) tail = `Die ${Ns} ${pairWords(parallel)} sind parallel und verschieden: Kein Punkt liegt auf allen, keine Lösung.`
    else {
      // die Schnittpunkte bzw. Schnittgeraden je zweier Zeilen blass dazu: Sie fallen nicht zusammen
      for (const [i, k] of pairs) {
        const pv = pivotOf(T[i], T[k], n, center)!
        if (n === 2) points.push({ at: pv.at, color: 'muted', phase: m + 1 })
        else segments.push({ from: add(pv.at, scale(-SOLUTION_HALF, pv.dir!)), to: add(pv.at, scale(SOLUTION_HALF, pv.dir!)), color: 'muted', dashed: true, phase: m + 1 })
      }
      tail =
        n === 2
          ? 'Je zwei Geraden schneiden sich (graue Punkte), aber nicht alle drei im selben Punkt: keine Lösung.'
          : 'Je zwei Ebenen schneiden sich in einer Geraden (gestrichelt), aber die drei Schnittgeraden sind parallel: Kein Punkt liegt auf allen drei Ebenen, keine Lösung.'
    }
  } else if (solution.dirs.length === 0) {
    points.push({ at: solution.p, label: 'S', color: 'r', phase: m + 1 })
    tail = `${m === 2 ? `Die beiden ${Ns} schneiden sich in genau einem` : `Alle drei ${Ns} gehen durch genau einen`} Punkt $${pointLatex('S', solution.p)}$: die Lösung.`
  } else if (solution.dirs.length === n - 1) {
    tail = `${m === 2 ? 'Beide Gleichungen beschreiben' : 'Alle Gleichungen beschreiben'} dieselbe ${nounOf(n)}: Jeder ihrer Punkte ist eine Lösung.`
  } else {
    // eine Gerade als Lösung im Raum
    const r = unit(solution.dirs[0])
    segments.push({ from: add(solution.p, scale(-SOLUTION_HALF, r)), to: add(solution.p, scale(SOLUTION_HALF, r)), color: 'r', phase: m + 1 })
    tail = `${m === 2 ? 'Die beiden Ebenen schneiden sich' : 'Die Ebenen schneiden sich alle'} in einer Geraden (violett): Jeder ihrer Punkte ist eine Lösung.${same.length > 0 ? ` Die Ebenen ${pairWords(same)} sind gleich.` : ''}`
  }
  return { ...emptyDrawing(n, `${colorList(T.map((_, i) => i), m, n, 'Gleichung')} ${tail}`), segments, polygons, points }
}

// für Tests: Abstand eines Punktes von einer Zeile, unabhängig von der Darstellung
export const onRow = (p: Pt, row: NRow, n: number, tol = 1e-6) => distanceTo(p, row, n) < tol
