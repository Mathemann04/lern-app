import { describe, expect, it } from 'vitest'
import { variablesOf } from '../check/answer.ts'
import { evaluate } from '../expr/evaluate.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseLatex } from '../parse/latex.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { VECTOR_ERROR_RULES } from './errorRules.ts'
import { type VectorDrawing, drawingCoordinates } from './figures.ts'
import { CROSS_KINDS_BY_LEVEL } from './crossTasks.ts'
import { readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 4a: Baustein „Kreuzprodukt und Fläche". Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet (nicht
// mit der Engine), jede falsche Antwort stammt aus dem Katalog und ist nicht so viel wert wie die richtige, Bilder passen
// zur Aufgabe (Normale senkrecht auf beiden Pfeilen, so lang wie die Fläche, Lotfußpunkt auf der Geraden), Abwechslung.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('kreuz', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (v: readonly number[]) => Math.sqrt(dot(v, v))
const sub = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x - b[i])
const add = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x + b[i])
const scale = (k: number, a: readonly number[]) => a.map((x) => k * x)
// Kreuzprodukt mit Kommazahlen, aus der Formel mit sin: unabhängig vom Schema der Engine über die Determinante
const crossN = (a: readonly number[], b: readonly number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
// Fläche des Parallelogramms aus Längen und Winkel: |a| |b| sin φ
const areaN = (a: readonly number[], b: readonly number[]) => {
  const c = dot(a, b) / (norm(a) * norm(b))
  return norm(a) * norm(b) * Math.sqrt(Math.max(0, 1 - c * c))
}
const sameVec = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => close(x, b[i]))
const withT = (v: readonly number[], j: number, t: number) => v.map((x, i) => (i === j ? t : x))

const UGLY: readonly RegExp[] = [/(?<![\d.,}])(?:\(-1\)|-?1) \\cdot \\(?:begin|lvert|vec)/, /\\frac\{0\}/, /\+ -/, /- -|--/, /(?<![\d.,}{\w])1(?:t|s|\\lambda)\b/, /(?<![\d.,}])-?1\\,\\vec/]
function nice(latex: string): string | null {
  const problem = latexProblem(latex, { checkUgly: false })
  if (problem) return problem
  const ugly = UGLY.find((re) => re.test(latex))
  if (ugly) return `unschön (${ugly.source}) in ${latex}`
  // Kette ohne doppeltes Glied (Fund der Prüfung): „a = a"
  const links = latex.split(' = ').map((x) => x.trim())
  return links.some((x, i) => i > 0 && x === links[i - 1]) ? `doppeltes Glied in ${latex}` : null
}

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind === 'math') expect(nice(segment.latex), `${context}: ${segment.latex}`).toBeNull()
  }
}

// Unabhängige Gegenprobe je Art aus den gegebenen Größen
function check(task: VectorTask, context: string) {
  const d = task.data
  const ans = task.answer
  switch (task.kind) {
    case 'cross': {
      const c = crossN(d.a, d.b)
      expect(sameVec(ans.slice(0, 3), c), context).toBe(true)
      expect(close(dot(c, d.a), 0) && close(dot(c, d.b), 0), context).toBe(true)
      expect(close(norm(c), areaN(d.a, d.b)), context).toBe(true)
      if (ans.length > 3) expect(sameVec(ans.slice(3), crossN(d.b, d.a)), context).toBe(true)
      return
    }
    case 'crossArea': {
      const area = ans.at(-1)!
      const full = areaN(d.a, d.b)
      expect(close(area, full) || close(area, full / 2), context).toBe(true)
      expect(close(area, task.form.includes('|tri|') ? full / 2 : full), context).toBe(true)
      if (ans.length > 1) expect(sameVec(ans.slice(0, 3), add(add(d.P, d.a), d.b)), context).toBe(true)
      return
    }
    case 'crossNormal': {
      const n1 = ans.slice(0, 3)
      expect(close(dot(n1, d.a), 0) && close(dot(n1, d.b), 0), context).toBe(true)
      expect(norm(n1) > 0, context).toBe(true)
      if (d.L) {
        expect(close(norm(n1), d.L[0]), context).toBe(true)
        expect(sameVec(ans.slice(3), scale(-1, n1)), context).toBe(true)
      } else if (task.form.includes('unit')) {
        expect(close(norm(n1), 1), context).toBe(true)
        expect(dot(n1, crossN(d.a, d.b)) > 0, context).toBe(true)
      } else expect(sameVec(n1, crossN(d.a, d.b)), context).toBe(true)
      return
    }
    case 'crossDistance': {
      // Abstand als kleinster Abstand zu Punkten der Geraden (Lotfußpunkt über die Projektion)
      const w = sub(d.Q, d.P)
      const foot = add(d.P, scale(dot(w, d.v) / dot(d.v, d.v), d.v))
      const dist = norm(sub(d.Q, foot))
      expect(close(ans.at(-1)!, dist), context).toBe(true)
      for (const dt of [-0.2, 0.3]) expect(norm(sub(d.Q, add(foot, scale(dt, d.v)))) > dist, context).toBe(true)
      if (ans.length > 1) expect(close(ans[0], areaN(d.v, w) / 2), context).toBe(true)
      return
    }
    case 'crossParallel': {
      const [j, inA] = [d.j[0], d.inA[0] === 1]
      const a = inA ? withT(d.a, j, ans[0]) : d.a
      const b = inA ? d.b : withT(d.b, j, ans[0])
      expect(norm(crossN(a, b)), context).toBeLessThan(1e-9)
      // kein anderer Wert: an einer anderen Stelle nicht parallel
      const a2 = inA ? withT(d.a, j, ans[0] + 0.7) : d.a
      const b2 = inA ? d.b : withT(d.b, j, ans[0] + 0.7)
      expect(norm(crossN(a2, b2)), context).toBeGreaterThan(1e-6)
      return
    }
    case 'crossAreaParam': {
      const j = d.j[0]
      const tri = d.tri[0] === 1
      const area = (t: number) => areaN(d.a, withT(d.b, j, t)) / (tri ? 2 : 1)
      if (d.A) {
        expect(ans[0], context).toBeLessThan(ans[1])
        for (const t of ans) expect(close(area(t), d.A[0]), `${context}: t = ${t}`).toBe(true)
      } else {
        expect(close(area(ans[0]), ans[1]), context).toBe(true)
        for (const dt of [-0.5, -0.01, 0.01, 0.5]) expect(area(ans[0] + dt), context).toBeGreaterThan(ans[1])
      }
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
  expectRenderable(drawing.caption, context)
  for (const a of drawing.arrows) if (a.label) expect(latexProblem(a.label, { checkUgly: false }), `${context}: ${a.label}`).toBeNull()
  for (const a of drawing.angles ?? []) expect(norm(a.u) > 0 && norm(a.v) > 0, context).toBe(true)
}

describe('Vektoren: Kreuzprodukt und Fläche', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      check(task, context)
      expect(CROSS_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(nice(task.resultLatex!), context).toBeNull()
      const parts = readResult(task.resultLatex!)
      expect(parts, context).not.toBeNull()
      const values = parts!.flatMap((p) => p.values)
      expect(values.length, context).toBe(task.answer.length)
      for (const [i, v] of values.entries()) expect(close(v, task.answer[i]), `${context}: ${i}`).toBe(true)
      for (const step of task.steps) {
        const where = `${context} ${step.id}`
        expect(step.choices.length, where).toBeGreaterThanOrEqual(3)
        expect(step.choices.filter((c) => c.correct).length, where).toBe(1)
        expect(new Set(step.choices.map((c) => c.content)).size, where).toBe(step.choices.length)
        for (const text of [step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) expectRenderable(text, where)
        for (const line of step.established ?? []) expect(nice(line), `${where}: ${line}`).toBeNull()
        for (const c of step.choices.filter((c) => !c.correct)) {
          expect(VECTOR_ERROR_RULES.some((r) => r.id === c.errorRuleId), `${where}: ${c.errorRuleId}`).toBe(true)
          expectRenderable(c.whyWrong!.detailed, where)
        }
        if (step.drawing) checkDrawing(step.drawing, where)
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
      expect(task.resultDrawing, context).toBeDefined()
      checkDrawing(task.resultDrawing!, context)
    }
  })

  it('Stufe 1 bei der Fläche in der Ebene, sonst im Raum', () => {
    for (const task of tasks(1, 80)) expect(task.resultDrawing!.dim, task.form).toBe(task.kind === 'crossArea' ? 2 : 3)
    for (const level of [2, 3, 4, 5] as const) for (const task of tasks(level, 60)) expect(task.resultDrawing!.dim, task.form).toBe(3)
  })

  it('Bild zum Ergebnis: Normale senkrecht auf beiden Pfeilen, so lang wie die Fläche oder verkürzt mit Hinweis; Lot auf der Geraden', () => {
    let normals = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 80)) {
        const d = task.resultDrawing!
        if (task.kind === 'crossDistance') {
          const [v, w] = [d.arrows[0], d.arrows[1]]
          const lot = d.segments.find((s) => s.color === 'r')!
          const dir = sub(v.to, v.from)
          // Lot senkrecht auf der Geraden, so lang wie der Abstand; Fußpunkt auf der Geraden
          expect(close(dot(sub(lot.from, lot.to), dir), 0), task.form).toBe(true)
          expect(close(norm(sub(lot.from, lot.to)), task.answer.at(-1)!), task.form).toBe(true)
          expect(sameVec(lot.from, w.to), task.form).toBe(true)
          expect(norm(crossN(sub(lot.to, v.from), dir)), task.form).toBeLessThan(1e-9)
          continue
        }
        const r = d.arrows.filter((a) => a.color === 'r')
        if (task.kind === 'crossParallel' || d.dim === 2) {
          expect(r.length, task.form).toBe(0)
          continue
        }
        const [a, b] = [d.arrows.find((x) => x.color === 'a')!, d.arrows.find((x) => x.color === 'b')!]
        const [u, v] = [sub(a.to, a.from), sub(b.to, b.from)]
        for (const n of r) {
          const nv = sub(n.to, n.from)
          expect(close(dot(nv, u), 0) && close(dot(nv, v), 0), task.form).toBe(true)
          expect(n.phase, task.form).toBeGreaterThan(0)
          normals++
        }
        // Normale gleich lang wie das Parallelogramm (Kreuzprodukt) oder verkürzt mit Hinweis
        if (task.kind === 'cross' || task.kind === 'crossArea') {
          const nv = sub(r[0].to, r[0].from)
          expect(close(norm(nv), areaN(u, v)) || d.caption.includes('verkürzt'), task.form).toBe(true)
          expect(dot(nv, crossN(u, v)), task.form).toBeGreaterThan(0)
        }
        expect(d.polygons.length, task.form).toBe(1)
        expect(d.polygons[0].phase, task.form).toBe(1)
      }
    }
    expect(normals).toBeGreaterThan(200)
  })

  it('vor dem Ergebnis zeigt kein Bild die Normale oder das Lot', () => {
    for (const level of LEVELS)
      for (const task of tasks(level, 80))
        for (const step of task.steps) if (step.drawing) expect(step.drawing.arrows.some((a) => a.color === 'r') || step.drawing.segments.some((s) => s.color === 'r'), task.form).toBe(false)
  })

  // Regel aus CLAUDE.md: falsche Antworten nie gleichwertig zur Lösung. Zahlen, Vektoren, Punkte und Lösungen nach Wert;
  // Gleichungen mit Parameter an vielen Stellen: links minus rechts, kein Vielfaches der richtigen
  it('keine falsche Antwort ist so viel wert wie die richtige', () => {
    const values = (content: string) => readResult(content)?.flatMap((p) => p.values) ?? null
    const equation = (content: string) => {
      const sides = content.replace(/^\$|\$$/g, '').split(' = ')
      if (sides.length !== 2) return null
      const parsed = parseLatex(`${sides[0]} - (${sides[1]})`)
      if (!parsed.ok) return null
      const names = [...variablesOf(parsed.expr)]
      if (names.length !== 1) return null
      return (x: number) => evaluate(parsed.expr, { [names[0]]: x })
    }
    let compared = 0
    let equations = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 150)) {
        for (const step of task.steps) {
          const correct = step.choices.find((c) => c.correct)!.content
          const f = equation(correct)
          const right = f ? null : values(correct)
          for (const c of step.choices.filter((c) => !c.correct)) {
            const g = equation(c.content)
            if (f && g) {
              const ratios = [0.37, 1.91, -2.63, -7.41, 5.3, -12.7, 9.7].map((x) => g(x) / f(x))
              expect(ratios.every((r) => close(r, ratios[0])), `${task.form} ${step.id}: ${c.content}`).toBe(false)
              equations++
              continue
            }
            const wrong = g ? null : values(c.content)
            if (right && wrong && wrong.length === right.length) {
              expect(wrong.every((x, i) => close(x, right[i])), `${task.form} ${step.id}: ${c.content}`).toBe(false)
              compared++
            }
          }
        }
      }
    }
    expect(compared).toBeGreaterThan(2000)
    expect(equations).toBeGreaterThan(50)
  })

  it('nutzt jeden neuen Fehler des Schritts 4a', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 200)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    const fresh = VECTOR_ERROR_RULES.map((r) => r.id).filter((id) => /^vec-(cross|area|normal|parallel|height)-/.test(id))
    expect(fresh.length).toBe(14)
    expect(fresh.filter((id) => !used.has(id))).toEqual([])
  })

  // Kennzahlen aus docs/PLAN-M2b.md: unter 200 Aufgaben mindestens 100 Formen, keine öfter als 3 von 100
  it.each(cells)('Stufe %i: mindestens 100 Formen unter 200, keine öfter als 3 %%', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('baut dieselbe Aufgabe zur selben Nummer', () => {
    expect(buildVectorTask(ref(5, 42))).toEqual(buildVectorTask(ref(5, 42)))
  })
})

describe('Vektoren: Lernkarten zum Kreuzprodukt', () => {
  it('jedes Beispiel ist eine Aufgabe der genannten Art mit Bild, die Gegenprobe stimmt', () => {
    const kinds = new Set(Object.values(CROSS_KINDS_BY_LEVEL).flat())
    let examples = 0
    for (const card of cardsInTopic('vektoren')) {
      for (const e of card.examples) {
        if (!isVectorExample(e) || !kinds.has(e.vector.kind)) continue
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        expect(task.resultDrawing, card.id).toBeDefined()
        check(task, card.id)
        examples++
      }
    }
    expect(examples).toBe(11)
  })
})
