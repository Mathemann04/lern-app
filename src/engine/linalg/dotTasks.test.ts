import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { DOT_KINDS_BY_LEVEL } from './dotTasks.ts'
import { VECTOR_ERROR_RULES } from './errorRules.ts'
import { type VectorDrawing, anglePath, drawingCoordinates } from './figures.ts'
import { cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { variablesOf } from '../check/answer.ts'
import { evaluate } from '../expr/evaluate.ts'
import { parseLatex } from '../parse/latex.ts'
import { readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 2: Baustein „Skalarprodukt und Winkel". Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet (nicht
// mit der Engine), jede falsche Antwort stammt aus dem Katalog, Bilder passen zur Aufgabe (rechter Winkel, wo
// senkrecht), Abwechslung wie überall.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('skalar', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (v: readonly number[]) => Math.sqrt(dot(v, v))
const sub = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x - b[i])
const angleDeg = (a: readonly number[], b: readonly number[]) => (Math.acos(dot(a, b) / (norm(a) * norm(b))) * 180) / Math.PI
const typeOf = (d: number) => (Math.abs(d) < 1e-9 ? 1 : d > 0 ? 0 : 2)

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind === 'math') expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
  }
}

// Unabhängige Gegenprobe je Art aus den gegebenen Größen
function check(task: VectorTask, context: string) {
  const d = task.data
  const ans = task.answer
  switch (task.kind) {
    case 'dot': {
      if (d.c) {
        const comb = (x: readonly number[], y: readonly number[]) => x.map((v, i) => v + d.k[0] * y[i])
        const want = d.left[0] ? dot(comb(d.a, d.b), d.c) : dot(d.a, comb(d.b, d.c))
        expect(close(ans[0], want), context).toBe(true)
      } else expect(close(ans[0], dot(d.a, d.b)), context).toBe(true)
      return
    }
    case 'classify':
      expect(close(ans[0], dot(d.a, d.b)), context).toBe(true)
      expect(ans[1], context).toBe(typeOf(dot(d.a, d.b)))
      return
    case 'perp': {
      expect(ans.length === 1 || ans.length === 2, context).toBe(true)
      for (const t of ans) {
        const a = d.pa.map((x, i) => x + d.qa[i] * t)
        const b = d.pb.map((x, i) => x + d.qb[i] * t)
        expect(close(dot(a, b), 0), `${context}: t = ${t}`).toBe(true)
        expect(norm(a) > 0 && norm(b) > 0, context).toBe(true)
      }
      if (ans.length === 2) expect(ans[0], context).toBeLessThan(ans[1])
      return
    }
    case 'angle':
      if (ans.length === 1) expect(close(ans[0], angleDeg(d.a, d.b)), `${context}: ${ans[0]} gegen ${angleDeg(d.a, d.b)}`).toBe(true)
      else {
        expect(close(ans[0], dot(d.a, d.b) / (norm(d.a) * norm(d.b))), context).toBe(true)
        expect(ans[1], context).toBe(typeOf(dot(d.a, d.b)))
      }
      return
    case 'triangleAngle': {
      const pts = [d.P0, d.P1, d.P2]
      const v = pts[d.v[0]]
      const [p, q] = pts.filter((_, i) => i !== d.v[0])
      expect(close(ans[0], angleDeg(sub(p, v), sub(q, v))), context).toBe(true)
      return
    }
    case 'lengthAngle': {
      const c = Math.cos(0)
      expect(c).toBe(1)
      if (d.S) {
        // rückwärts: |a ± b|² = p² ± 2 p |b| cos φ + |b|²
        const phi = (ans[0] * Math.PI) / 180
        const S = d.p[0] ** 2 + 2 * d.sg[0] * d.p[0] * d.b[0] * Math.cos(phi) + d.b[0] ** 2
        expect(close(S, d.S[0]), context).toBe(true)
        expect([45, 60, 120, 135], context).toContain(ans[0])
      } else {
        const [k, m, p, b] = [d.k[0], d.m[0], d.p[0], d.b[0]]
        const phi = (d.phi[0] * Math.PI) / 180
        expect(close(ans[0], Math.sqrt(k * k * p * p + 2 * k * m * p * b * Math.cos(phi) + m * m * b * b)), context).toBe(true)
      }
      return
    }
    case 'classifyParam': {
      // Werte knapp über und unter der Grenze: das Vorzeichen des Skalarprodukts passt zur Antwort
      const [rel, t0] = ans
      const at = (t: number) => dot(d.a, d.b.map((x, j) => (j === d.i[0] ? d.s[0] * t + x : x)))
      expect(close(at(t0), 0), context).toBe(true)
      const inside = at(t0 + rel * 0.5)
      const outside = at(t0 - rel * 0.5)
      if (d.want[0] === 0) expect(inside > 0 && outside < 0, context).toBe(true)
      else expect(inside < 0 && outside > 0, context).toBe(true)
      return
    }
    case 'rightParam': {
      for (const t of ans) {
        const c = d.C.map((x, j) => (j === d.i[0] ? t : x))
        expect(close(dot(sub(d.A, c), sub(d.B, c)), 0), `${context}: t = ${t}`).toBe(true)
      }
      expect(ans[0], context).toBeLessThan(ans[1])
      return
    }
    default:
      throw new Error(`Unerwartete Art ${task.kind}`)
  }
}

function checkDrawing(drawing: VectorDrawing, context: string) {
  for (const c of drawingCoordinates(drawing)) {
    expect(c.length, context).toBe(drawing.dim)
    for (const x of c) expect(Number.isFinite(x), context).toBe(true)
  }
  for (const a of drawing.angles ?? []) {
    expect(norm(a.u) > 0 && norm(a.v) > 0, context).toBe(true)
    for (const p of anglePath(a, 0.5).points) for (const x of p) expect(Number.isFinite(x), context).toBe(true)
    if (a.label) expect(latexProblem(a.label, { checkUgly: false }), context).toBeNull()
  }
  expectRenderable(drawing.caption, context)
  for (const a of drawing.arrows) if (a.label) expect(latexProblem(a.label, { checkUgly: false }), `${context}: ${a.label}`).toBeNull()
}

describe('Vektoren: Skalarprodukt und Winkel', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      // Zieh-Aufgaben (Schritt 2b) prüft dragTasks.test.ts
      if (task.kind === 'drag') continue
      check(task, context)
      expect(DOT_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
      for (const step of task.steps) {
        const where = `${context} ${step.id}`
        expect(step.choices.length, where).toBeGreaterThanOrEqual(3)
        expect(step.choices.filter((c) => c.correct).length, where).toBe(1)
        expect(new Set(step.choices.map((c) => c.content)).size, where).toBe(step.choices.length)
        for (const text of [step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) expectRenderable(text, where)
        for (const line of step.established ?? []) expect(latexProblem(line, { checkUgly: false }), `${where}: ${line}`).toBeNull()
        for (const c of step.choices.filter((c) => !c.correct)) {
          expect(VECTOR_ERROR_RULES.some((r) => r.id === c.errorRuleId), `${where}: ${c.errorRuleId}`).toBe(true)
          expectRenderable(c.whyWrong!.detailed, where)
        }
        if (step.drawing) checkDrawing(step.drawing, where)
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
      if (task.resultDrawing) checkDrawing(task.resultDrawing, context)
    }
  })

  it('Stufe 1 in der Ebene, Stufe 2 im Raum, jeweils mit Bild', () => {
    for (const task of tasks(1, 60)) expect(task.resultDrawing?.dim, task.form).toBe(2)
    // gezogen wird nur in der Ebene
    for (const task of tasks(2, 60)) expect(task.resultDrawing?.dim, task.form).toBe(task.kind === 'drag' ? 2 : 3)
  })

  it('besondere Winkel: der Winkel im Bild ist der gesuchte; senkrecht heißt rechter Winkel im Bild', () => {
    for (const level of LEVELS) {
      for (const task of tasks(level, 80)) {
        if (!task.resultDrawing) continue
        const angles = task.resultDrawing.angles ?? []
        if ((task.kind === 'angle' && task.answer.length === 1) || task.kind === 'triangleAngle') {
          expect(close(angleDeg(angles[0].u, angles[0].v), task.answer[0]), task.form).toBe(true)
        }
        if (task.kind === 'perp' || task.kind === 'rightParam' || task.kind === 'classifyParam')
          for (const a of angles) expect(close(dot(a.u, a.v), 0), task.form).toBe(true)
      }
    }
  })

  it('der Kosinus ist richtig vereinfacht: Wert der Antwort gleich dem Wert aus dem Skalarprodukt', () => {
    for (const level of [2, 3, 4] as const) {
      for (const task of tasks(level, 80).filter((t) => t.kind === 'angle')) {
        const step = task.steps.find((s) => s.id === 'kosinus')!
        const cos = dot(task.data.a, task.data.b) / (norm(task.data.a) * norm(task.data.b))
        const correct = step.choices.find((c) => c.correct)!.content
        expect(correct, task.form).toMatch(/^\$/)
        if (task.answer.length === 2) expect(close(task.answer[0], cos), task.form).toBe(true)
      }
    }
  })

  it('bei spitz oder stumpf zeigt kein Schritt vor dem Ergebnis ein Bild', () => {
    for (const level of LEVELS)
      for (const task of tasks(level, 100))
        if (task.kind === 'classify' || (task.kind === 'angle' && task.answer.length === 2))
          for (const step of task.steps) expect(step.drawing, task.form).toBeUndefined()
  })

  // Regel aus CLAUDE.md: falsche Antworten nie gleichwertig zur Lösung. Zahlen, Vektoren und Lösungen nach Wert;
  // Gleichungen mit Parameter: links minus rechts darf kein Vielfaches der richtigen Gleichung sein
  it('keine falsche Antwort ist so viel wert wie die richtige', () => {
    const values = (content: string) => readResult(content)?.flatMap((p) => p.values) ?? null
    const equation = (content: string) => {
      const body = content.replace(/^\$|\$$/g, '')
      const sides = body.split(' = ')
      if (sides.length !== 2) return null
      const parsed = parseLatex(`${sides[0]} - (${sides[1]})`)
      if (!parsed.ok) return null
      const names = [...variablesOf(parsed.expr)]
      if (names.length !== 1) return null
      return (x: number) => evaluate(parsed.expr, { [names[0]]: x })
    }
    let compared = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 150)) {
        for (const step of task.steps) {
          const correct = step.choices.find((c) => c.correct)!.content
          const f = equation(correct)
          const right = f ? null : values(correct)
          for (const c of step.choices.filter((c) => !c.correct)) {
            const wrong = equation(c.content) ? null : values(c.content)
            if (right && wrong && right.length === wrong.length) {
              expect(wrong.every((x, i) => close(x, right[i])), `${task.form} ${step.id}: ${c.content}`).toBe(false)
              compared++
            }
            const g = equation(c.content)
            if (f && g) {
              const ratios = [0.37, 1.91, -2.63].map((x) => g(x) / f(x))
              expect(ratios.every((r) => close(r, ratios[0])), `${task.form} ${step.id}: ${c.content}`).toBe(false)
              compared++
            }
          }
        }
      }
    }
    expect(compared).toBeGreaterThan(1000)
  })

  // Kennzahlen aus docs/PLAN-M2b.md: unter 200 Aufgaben mindestens 100 Formen, keine öfter als 3 von 100
  it.each(cells)('Stufe %i: mindestens 100 Formen unter 200, keine öfter als 3 %%', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('baut dieselbe Aufgabe zur selben Nummer', () => {
    expect(buildVectorTask(ref(4, 42))).toEqual(buildVectorTask(ref(4, 42)))
  })
})

describe('Vektoren: Lernkarten zum Skalarprodukt', () => {
  it('jedes Beispiel ist eine Aufgabe der genannten Art mit Bild, die Gegenprobe stimmt', () => {
    const kinds = new Set(Object.values(DOT_KINDS_BY_LEVEL).flat())
    for (const card of cardsInTopic('vektoren')) {
      for (const e of card.examples) {
        if (!isVectorExample(e) || !kinds.has(e.vector.kind)) continue
        const task = buildVectorTask(ref(e.vector.level, e.vector.seed), e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        expect(task.resultDrawing, card.id).toBeDefined()
        check(task, card.id)
      }
    }
  })
})
