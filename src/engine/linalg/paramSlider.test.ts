import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { type Level, blockSeed } from '../tasks/taskNumber.ts'
import { AREA_SPAN } from './cramerTasks.ts'
import { type DrawColor, type VectorDrawing, drawingCoordinates, hasAnimation } from './figures.ts'
import { distanceTo, sliderValues } from './gaussFigures.ts'
import type { VectorKind } from './taskKit.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 11c: Schieberegler für den Parameter und Cramer als Flächen. Unabhängig nachgeprüft: An jeder Stelle des
// Reglers liegen die Geraden bzw. Ebenen auf den Zeilen der Aufgabe (aus den Daten der Aufgabe neu eingesetzt), die
// Beschreibung nennt den Fall, den ein eigener Rang mit Kommazahlen ergibt, und an den Sonderwerten und gesuchten Werten
// steht ein Knopf mit dem richtigen Text. Beim Flächenbild sind die Flächen |det A| und |det A_k|, ihr Verhältnis mit
// Vorzeichen ist die Lösung.

type Rows = (a: number) => number[][]
const ROW_OF: Partial<Record<DrawColor, number>> = { a: 0, b: 1, c: 2 }
const TOL = 1e-6

// Zeilen der Aufgabe an der Stelle a, nur aus task.data (unabhängig vom Bild gerechnet)
function rowsOf(task: VectorTask): { rowsAt: Rows; n: number } {
  const d = task.data
  if (task.kind.startsWith('lgsp')) {
    const m = d.n[0]
    const cols = d.T0.length / m
    const b = task.kind === 'lgspRhs' ? task.answer[1] : 0
    const rowsAt: Rows = (a) => Array.from({ length: m }, (_, i) => Array.from({ length: cols }, (_, j) => {
      const k = i * cols + j
      return d.T0[k] + d.T1[k] * a + d.T2[k] * a * a + d.TB[k] * b
    }))
    return { rowsAt, n: cols - 1 }
  }
  if (task.kind.startsWith('cramer')) {
    const n = d.n[0]
    return { rowsAt: (a) => Array.from({ length: n }, (_, i) => [...Array.from({ length: n }, (_, j) => d.A0[i * n + j] + a * (d.A1[i * n + j] - d.A0[i * n + j])), d.b[i]]), n }
  }
  const [m, n] = [d.m[0], d.n[0]]
  return { rowsAt: (a) => Array.from({ length: m }, (_, i) => Array.from({ length: n + 1 }, (_, j) => d.rows[i * (n + 1) + j] + a * (d.A1[i * (n + 1) + j] - d.rows[i * (n + 1) + j]))), n }
}

// eigener Rang (Zeilenstufenform mit größtem Element, Toleranz relativ zur Größe der Zahlen)
function rank(M: readonly (readonly number[])[], cols: number): number {
  const A = M.map((r) => r.slice(0, cols))
  const tol = 1e-8 * Math.max(1, ...A.flat().map(Math.abs))
  let r = 0
  for (let c = 0; c < cols && r < A.length; c++) {
    let best = r
    for (let i = r; i < A.length; i++) if (Math.abs(A[i][c]) > Math.abs(A[best][c])) best = i
    if (Math.abs(A[best][c]) <= tol) continue
    ;[A[r], A[best]] = [A[best], A[r]]
    for (let i = r + 1; i < A.length; i++) {
      const f = A[i][c] / A[r][c]
      A[i] = A[i].map((x, j) => x - f * A[r][j])
    }
    r++
  }
  return r
}
const caseOf = (T: number[][], n: number) => {
  const ra = rank(T, n)
  if (ra !== rank(T, n + 1)) return 'keine Lösung'
  return ra === n ? 'genau eine Lösung' : 'unendlich viele Lösungen'
}
const CASES = ['keine Lösung', 'genau eine Lösung', 'unendlich viele Lösungen']
const flat = (row: readonly number[], n: number) => row.slice(0, n).every((x) => Math.abs(x) < 1e-9)
const on = (p: readonly number[], row: readonly number[], n: number) => !flat(row, n) && distanceTo(p, row, n) < TOL
const fmt = (x: number) => {
  const r = Math.round(x * 1000) / 1000
  return String(r).replace('.', '{,}')
}

function expectCaption(d: VectorDrawing, where: string) {
  expect(d.caption, where).not.toMatch(/undefined|NaN|\[object|null/)
  for (const seg of parseRichText(d.caption).flat()) if (seg.kind === 'math') expect(latexProblem(seg.latex, { checkUgly: false }), `${where}: ${seg.latex}`).toBeNull()
  expect(drawingCoordinates(d).every((p) => p.every(Number.isFinite)), where).toBe(true)
}

const SLIDER_KINDS: readonly [VectorKind, Level][] = [
  ['lgspTwo', 1], ['lgspTwo', 2], ['lgspThree', 2], ['lgspThree', 3], ['lgspDet', 2], ['lgspDet', 4], ['lgspRhs', 4], ['lgspTarget', 4], ['lgspTarget', 5], ['lgspFull', 5],
  ['cramerParam', 4], ['cramerParam', 5], ['cramerParamThree', 5], ['eqsParam', 5],
]

describe('Schieberegler für den Parameter (Schritt 11c)', () => {
  it('sliderValues: Viertel um die besonderen Stellen, diese genau, aufsteigend ohne Doppelte', () => {
    const v = sliderValues([2, 1 / 3])
    expect(v).toContain(2)
    expect(v).toContain(1 / 3)
    expect(v[0]).toBe(-3)
    expect(v.at(-1)).toBe(5)
    expect(v.every((x, i) => i === 0 || x > v[i - 1] + 0.05)).toBe(true)
  })

  it('an jeder Stelle: Geraden bzw. Ebenen auf den Zeilen, Fall wie mit eigenem Rang, gleicher Ausschnitt', () => {
    const notes = new Set<string>()
    let frames = 0
    for (const [kind, level] of SLIDER_KINDS) {
      for (let seed = 1; seed <= 12; seed++) {
        const task = buildVectorTask({ level, seed: blockSeed('rechnen', seed) }, kind)
        const where = `${kind} ${level}-${seed}`
        const d = task.resultDrawing
        expect(d?.slider, where).toBeDefined()
        const s = d!.slider!
        const { rowsAt, n } = rowsOf(task)
        expect(s.frames.length, where).toBe(s.values.length)
        expect(s.values.every((x, i) => i === 0 || x > s.values[i - 1]), where).toBe(true)
        expect(d!.caption, where).toBe(s.frames[s.start].caption)
        const ex = d!.extent!
        for (const [i, a] of s.values.entries()) {
          const f = s.frames[i]
          const at = `${where} a = ${a}`
          frames++
          expectCaption(f, at)
          expect(hasAnimation(f), at).toBe(false)
          expect(f.extent, at).toEqual(ex)
          // alles im gemeinsamen Ausschnitt
          for (const p of drawingCoordinates(f)) p.forEach((x, k) => expect(x >= ex[0][k] - 1e-9 && x <= ex[1][k] + 1e-9, at).toBe(true))
          expect(f.caption, at).toContain(`$a = ${fmt(a)}$`)
          const T = rowsAt(a)
          const kase = caseOf(T, n)
          expect(f.caption, at).toContain(kase === 'unendlich viele Lösungen' ? 'unendlich viele' : kase)
          for (const other of CASES.filter((c) => c !== kase)) expect(f.caption.includes(other), `${at}: ${other}`).toBe(false)
          // jede farbige Gerade bzw. Ebene liegt ganz auf ihrer Zeile; fehlt eine, sagt die Beschreibung warum
          const parts = [...f.segments, ...f.polygons].filter((e) => ROW_OF[e.color] !== undefined)
          for (const e of parts) {
            const points = 'points' in e ? e.points : [e.from, e.to]
            expect(points.every((p) => on(p, T[ROW_OF[e.color]!], n)), at).toBe(true)
          }
          const drawn = new Set(parts.map((e) => ROW_OF[e.color]))
          if (drawn.size < T.length) expect(f.caption, at).toMatch(/außerhalb des Bildes|keine (Gerade|Ebene)/)
          // Lösung (Punkt S, violette Gerade) auf allen Zeilen
          for (const p of [...f.points.filter((x) => x.color === 'r').map((x) => x.at), ...f.segments.filter((x) => x.color === 'r').flatMap((x) => [x.from, x.to])])
            expect(T.every((r) => flat(r, n) || on(p, r, n)), at).toBe(true)
        }
        // Knöpfe: Sonderwerte mit ihrem Fall, gesuchte Werte mit dem Wert der Unbekannten
        for (const m of s.marks) {
          notes.add(m.note)
          const kase = caseOf(rowsAt(s.values[m.index]), n)
          if (m.note.startsWith('$')) expect(kase, where).toBe('genau eine Lösung')
          else expect(m.note, where).toBe(kase)
        }
        const markAt = (a: number) => s.marks.find((m) => Math.abs(s.values[m.index] - a) < 1e-9)
        if (task.data.ask) for (const a of task.answer) expect(markAt(a)?.note, where).toBe(CASES[[1, 0, 2][task.data.ask[0]]])
        if (task.data.single) expect(markAt(task.answer[0])?.note, where).toBe(CASES[[1, 0, 2][task.answer[1]]])
        if (task.kind.startsWith('cramer') || task.kind === 'lgspTarget') {
          for (const a of task.answer) expect(markAt(a)?.note, where).toMatch(/^\$[xyz](_\d)? = -?\d+\$$/)
          // beim Startwert (erster gesuchter Wert) liegt S in der Mitte und hat den gesuchten Wert
          const S = s.frames[s.start].points.find((p) => p.label === 'S')
          expect(S, where).toBeDefined()
          expect(S!.at[task.data.k[0]], where).toBeCloseTo(task.data.c[0], 6)
        }
        if (task.kind === 'lgspFull') expect(s.values[s.start], where).toBe(task.data.inf[0])
      }
    }
    expect([...notes].filter((x) => !x.startsWith('$')).sort()).toEqual(['keine Lösung', 'unendlich viele Lösungen'])
    expect(frames).toBeGreaterThan(3000)
  })

  it('Lernkarten mit Parameter zeigen den Schieberegler', () => {
    for (const card of cardsInTopic('matrizen').filter((c) => c.id.startsWith('lgsp-') || c.id === 'cramer-parameter')) {
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.resultDrawing?.slider, `${card.id} ${e.vector.kind}`).toBeDefined()
      }
    }
  })
})

describe('Cramer als Flächen (Schritt 11c)', () => {
  const area = (p: readonly (readonly number[])[]) => p[1][0] * p[3][1] - p[1][1] * p[3][0]
  it('Flächen |det A| und |det A_k|, Verhältnis mit Vorzeichen = Lösung, Strecken und Scheren', () => {
    let shown = 0
    let total = 0
    for (const level of [1, 2] as const) {
      for (let seed = 1; seed <= 80; seed++) {
        const task = buildVectorTask({ level, seed: blockSeed('rechnen', seed) }, 'cramerTwo')
        const where = `${level}-${seed}`
        const A = [[task.data.A0[0], task.data.A0[1]], [task.data.A0[2], task.data.A0[3]]]
        const b = task.data.b
        const D = A[0][0] * A[1][1] - A[0][1] * A[1][0]
        for (const step of task.steps) {
          const k = step.id === 'wert-x' ? 0 : step.id === 'loesung' ? 1 : -1
          const d = step.solvedDrawing
          if (k < 0) {
            expect(d, where).toBeUndefined()
            continue
          }
          total++
          if (!d) continue
          shown++
          expectCaption(d, where)
          expect(step.drawing, where).toBeUndefined()
          const u = [A[0][k], A[1][k]]
          const w = [A[0][1 - k], A[1][1 - k]]
          const Dk = k === 0 ? b[0] * A[1][1] - A[0][1] * b[1] : A[0][0] * b[1] - b[0] * A[1][0]
          const x = task.answer[k]
          const [base, stretched, sheared] = d.polygons
          expect(Math.abs(area(base.points)), where).toBeCloseTo(Math.abs(D), 9)
          expect(Math.abs(area(sheared.points)), where).toBeCloseTo(Math.abs(Dk), 9)
          expect(area(sheared.points) / area(base.points), where).toBeCloseTo(x, 9)
          expect(area(stretched.points), where).toBeCloseTo(area(sheared.points), 9)
          expect(base.points[1], where).toEqual(u)
          expect(sheared.points[1], where).toEqual(b)
          stretched.points[1].forEach((c, i) => expect(c, where).toBeCloseTo(x * u[i], 9))
          expect(stretched.from, where).toEqual(base.points)
          expect(sheared.from, where).toEqual(stretched.points)
          // Scheren: die Ecke wandert parallel zur anderen Spalte
          const shift = b.map((c, i) => c - x * u[i])
          expect(shift[0] * w[1] - shift[1] * w[0], where).toBeCloseTo(0, 9)
          expect(hasAnimation(d), where).toBe(true)
          const xs = drawingCoordinates(d)
          for (const c of [0, 1]) expect(Math.max(0, ...xs.map((p) => p[c])) - Math.min(0, ...xs.map((p) => p[c])), where).toBeLessThanOrEqual(AREA_SPAN)
          expect(d.caption, where).toContain(`|\\det A| = `)
        }
      }
    }
    expect(shown / total).toBeGreaterThan(0.5)
  })

  it('die Karte „Cramersche Regel“ zeigt das Flächenbild', () => {
    const card = cardsInTopic('matrizen').find((c) => c.id === 'cramer-regel')!
    const e = card.examples[0]
    if (!isVectorExample(e)) throw new Error(card.id)
    expect(e.vector.picture).toBe('step')
    const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
    expect(task.steps.find((s) => s.solvedDrawing)?.solvedDrawing?.polygons.length).toBe(3)
  })
})
