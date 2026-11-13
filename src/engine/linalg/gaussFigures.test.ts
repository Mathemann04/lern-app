import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { type DrawColor, type VectorDrawing, drawingCoordinates, hasAnimation, withMistake } from './figures.ts'
import { distanceTo } from './gaussFigures.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 10b: Bilder zum Gauß-Verfahren. Unabhängig nachgeprüft: Jede Gerade bzw. Ebene im Bild liegt genau auf der
// Zeile ihrer Farbe (I blau, II orange, III blaugrün), vor der Umformung auf der alten, danach auf der neuen Zeile; die
// gedrehte geht durch den Schnitt mit der Stufenzeile; der rote Fehler liegt auf der Zeile mit unveränderter rechter
// Seite und nicht auf der richtigen. Beim Ergebnis liegt die Lösung auf allen Geraden bzw. Ebenen. Vor einer Antwort
// zeigt kein Schritt ein Bild (es verriete die Antwort).

const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask({ level, seed: blockSeed('gauss', i + 1) }))
type N = number[][]
const ROMAN = ['I', 'II', 'III', 'IV']
const ROW_OF: Partial<Record<DrawColor, number>> = { a: 0, b: 1, c: 2 }
const TOL = 1e-6

function system(task: VectorTask) {
  const [m, n] = [task.data.m[0], task.data.n[0]]
  return { m, n, T: Array.from({ length: m }, (_, i) => task.data.T.slice(i * (n + 1), (i + 1) * (n + 1))) }
}
function entry(text: string): number {
  const t = text.trim()
  const frac = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(t)
  if (frac) return (frac[1] ? -1 : 1) * (Number(frac[2]) / Number(frac[3]))
  return Number(t.replace('{,}', '.'))
}
function readTable(content: string, n: number): N | null {
  const m = /\\begin\{array\}\{c\|r+\|rl?\}(.*)\\end\{array\}/s.exec(content)
  if (!m) return null
  return m[1].split('\\\\').slice(1).map((r) => r.replace('\\hline', '').split('&').slice(1, n + 2).map(entry))
}
const flat = (row: readonly number[], n: number) => row.slice(0, n).every((x) => Math.abs(x) < 1e-9)
const on = (p: readonly number[], row: readonly number[], n: number) => !flat(row, n) && distanceTo(p, row, n) < TOL
// alle Punkte eines Teils (Strecke bzw. Fläche)
const pts = (e: { from?: unknown; to?: unknown; points?: readonly (readonly number[])[] }) =>
  e.points ? e.points : [e.from as readonly number[], e.to as readonly number[]]

function expectCaption(d: VectorDrawing, where: string) {
  for (const text of [d.caption, d.mistake?.caption ?? '']) {
    expect(text, where).not.toMatch(/undefined|NaN|\[object|null/)
    for (const seg of parseRichText(text).flat()) if (seg.kind === 'math') expect(latexProblem(seg.latex, { checkUgly: false }), `${where}: ${seg.latex}`).toBeNull()
  }
  expect(drawingCoordinates(d).every((p) => p.every(Number.isFinite)), where).toBe(true)
}

describe('Gauß-Verfahren: Bilder (Schritt 10b)', () => {
  it('nach „Nullen erzeugen“: Geraden bzw. Ebenen liegen auf den Zeilen, die umgeformten drehen sich um den Schnitt', () => {
    let rotations = 0
    let mistakes = 0
    let planes = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        const { m, n, T } = system(task)
        const context = `${level}-${task.ref.seed} ${task.form}`
        let prev: N = T
        for (const step of task.steps) {
          const where = `${context} ${step.id}`
          expect(step.drawing, where).toBeUndefined()
          const right = step.choices.find((c) => c.correct)!
          const swap = /^Zeilen (I+V?|IV) und (I+V?|IV) tauschen$/.exec(right.content)
          if (swap) {
            const [i, j] = [swap[1], swap[2]].map((x) => ROMAN.indexOf(x))
            prev = prev.map((r, k) => (k === i ? prev[j] : k === j ? prev[i] : r))
          }
          if (!step.id.startsWith('spalte-')) {
            expect(step.solvedDrawing, where).toBeUndefined()
            const R = readTable(right.content, n)
            if (R) prev = R
            continue
          }
          const R = readTable(right.content, n)!
          const d = step.solvedDrawing
          if (n > 3 || m > 3) {
            expect(d, where).toBeUndefined()
            prev = R
            continue
          }
          expect(d, where).toBeDefined()
          expect(d!.dim, where).toBe(n)
          expectCaption(d!, where)
          const pivotRow = ROMAN.indexOf(/in Zeile (I+V?|IV)/.exec(step.question)![1])
          const parts = [...d!.segments, ...d!.polygons]
          // jede Zeile mit Gerade bzw. Ebene kommt in ihrer Farbe vor, jedes farbige Teil liegt auf seiner neuen Zeile
          for (let i = 0; i < m; i++) if (!flat(R[i], n)) expect(parts.some((e) => ROW_OF[e.color] === i), `${where} Zeile ${i}`).toBe(true)
          for (const e of parts) {
            const i = ROW_OF[e.color]
            if (i === undefined) continue
            expect(pts(e).every((p) => on(p, R[i], n)), `${where} Farbe ${e.color}`).toBe(true)
            const from = 'slideFrom' in e ? e.slideFrom : 'from' in e && !('to' in e) ? e.from : undefined
            if (from) {
              // gleitet aus der alten Lage: auf der alten Zeile, durch den Schnitt mit der Stufenzeile
              rotations++
              expect(from.every((p) => on(p, prev[i], n)), `${where} alte Lage`).toBe(true)
              expect(i, where).not.toBe(pivotRow)
              const common = pts(e).length === 2 ? pts(e).map((p, k) => p.map((x, j) => (x + pts(e)[1 - k][j]) / 2))[0] : pts(e)[0].map((_, j) => pts(e).reduce((s, p) => s + p[j], 0) / 4)
              for (const row of [prev[i], prev[pivotRow], R[i]]) expect(on(common, row, n), `${where} Drehpunkt`).toBe(true)
              expect(e.phase, where).toBe(1)
            }
          }
          // Beschreibung: genannte Farben sind genau die farbigen Zeilen im Bild
          const named = [...d!.caption.matchAll(/\$\\text\{(I+)\}\$ (blau|orange|blaugrün)/g)].map((x) => ROMAN.indexOf(x[1])).sort()
          const drawn = [...new Set(parts.map((e) => ROW_OF[e.color]).filter((i) => i !== undefined))].sort()
          expect(named, `${where} Farben`).toEqual(drawn)
          // „Ohne x … parallel zur x-Achse“: Jede genannte Variable fehlt in jeder gedrehten Zeile
          const header = /\\begin\{array\}\{[^}]*\}(.*?)\\\\/s.exec(right.content)![1].split('&').slice(1, n + 1).map((v) => v.trim())
          const without = /Ohne (.*?) (?:ist|sind) die neuen? /.exec(d!.caption)
          const turned = parts.filter((e) => ('slideFrom' in e && e.slideFrom) || ('from' in e && !('to' in e) && e.from)).map((e) => ROW_OF[e.color]!)
          expect(!!without, where).toBe(turned.length > 0)
          if (without) {
            const vars = [...without[1].matchAll(/\$([^$]+)\$/g)].map((x) => x[1])
            expect(vars.length, where).toBeGreaterThan(0)
            for (const v of vars) for (const i of turned) expect(R[i][header.indexOf(v)], `${where} ohne ${v}`).toBe(0)
            for (const v of vars) expect(d!.caption, where).toContain(`$${v}$-`)
          }
          if (n === 3) planes++
          // blasse Teile: auf einer alten Zeile
          for (const e of parts.filter((x) => x.color === 'muted')) expect(pts(e).every((p) => prev.some((r) => on(p, r, n))), `${where} blass`).toBe(true)
          expect(hasAnimation(d!), where).toBe(parts.some((e) => e.phase === 1))
          // der rote Fehler: rechte Seite nicht umgeformt
          if (d!.mistake) {
            mistakes++
            const red = [...d!.mistake.segments, ...(d!.mistake.polygons ?? [])]
            expect(red.length, where).toBe(1)
            expect(red[0].color, where).toBe('bad')
            const fits = R.some((r, i) => i !== pivotRow && !flat(r, n) && pts(red[0]).every((p) => on(p, [...r.slice(0, n), prev[i][n]], n)) && !pts(red[0]).some((p) => on(p, r, n)))
            expect(fits, where).toBe(true)
            expect(withMistake(d!).caption, where).toBe(d!.mistake.caption)
          }
          prev = R
        }
      }
    }
    expect(rotations).toBeGreaterThan(300)
    expect(mistakes).toBeGreaterThan(150)
    expect(planes).toBeGreaterThan(100)
  })

  it('beim Ergebnis: jede Gleichung als Gerade bzw. Ebene, die Lösung liegt auf allen', () => {
    const seen = new Set<string>()
    let noneCuts = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        const { m, n, T } = system(task)
        const context = `${level}-${task.ref.seed} ${task.form}`
        const d = task.resultDrawing
        if (n > 3 || m > 3) {
          expect(d, context).toBeUndefined()
          continue
        }
        expect(d, context).toBeDefined()
        expectCaption(d!, context)
        const parts = [...d!.segments, ...d!.polygons]
        for (let i = 0; i < m; i++) {
          const mine = parts.filter((e) => ROW_OF[e.color] === i)
          expect(mine.length, `${context} Zeile ${i}`).toBe(1)
          expect(pts(mine[0]).every((p) => on(p, T[i], n)), `${context} Zeile ${i}`).toBe(true)
          expect(mine[0].phase, context).toBe(i + 1)
        }
        const kase = task.resultLatex!.includes('keine') ? 'none' : task.resultLatex!.includes('L\\colon') ? 'inf' : 'unique'
        seen.add(`${n}${kase}`)
        const solution = [...d!.points, ...d!.segments.filter((s) => s.color === 'r')]
        if (kase === 'none') {
          expect(solution.filter((e) => e.color === 'r').length, context).toBe(0)
          // blasse Schnittpunkte bzw. Schnittgeraden je zweier Zeilen liegen auf genau zwei Zeilen
          const cuts = [...d!.points.filter((p) => p.color === 'muted').map((p) => [p.at]), ...d!.segments.filter((s) => s.color === 'muted').map((s) => [s.from, s.to])]
          for (const c of cuts) expect(T.filter((r) => c.every((p) => on(p, r, n))).length, context).toBe(2)
          if (cuts.length > 0) noneCuts++
          expect(d!.caption, context).toContain('keine Lösung')
        } else if (kase === 'unique') {
          expect(d!.points.length, context).toBe(1)
          expect(d!.points[0].at, context).toEqual(task.answer)
          expect(T.every((r) => on(d!.points[0].at, r, n)), context).toBe(true)
          expect(d!.caption, context).toContain('genau')
        } else {
          for (const s of solution) for (const p of 'at' in s ? [s.at] : [s.from, s.to]) expect(T.every((r) => on(p, r, n)), context).toBe(true)
          // eine Gerade als Lösung im Raum ist violett eingezeichnet, sonst (dieselbe Gerade bzw. Ebene) keine Extra-Linie
          const params = task.data.free.length
          expect(d!.segments.filter((s) => s.color === 'r').length, context).toBe(n === 3 && params === 1 ? 1 : 0)
          expect(d!.caption, context).toContain('Jeder ihrer Punkte ist eine Lösung')
        }
      }
    }
    expect([...seen].sort()).toEqual(['2inf', '2none', '2unique', '3inf', '3none', '3unique'])
    expect(noneCuts).toBeGreaterThan(5)
  })
})

describe('Gauß-Verfahren: Bilder auf den Lernkarten', () => {
  it('jedes Beispiel hat ein Bild: zum Ergebnis oder (picture: step) die Drehung beim ersten Schritt', () => {
    for (const card of cardsInTopic('matrizen').filter((c) => c.id.startsWith('gauss-'))) {
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        const d = e.vector.picture === 'step' ? task.steps.find((s) => s.solvedDrawing)?.solvedDrawing : task.resultDrawing
        expect(d, card.id).toBeDefined()
        if (e.vector.picture === 'step') expect(hasAnimation(d!), card.id).toBe(true)
      }
    }
  })
})
