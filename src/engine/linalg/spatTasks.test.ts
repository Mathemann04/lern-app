import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { VECTOR_ERROR_RULES } from './errorRules.ts'
import { type VectorDrawing, drawingCoordinates } from './figures.ts'
import { ORIENTATIONS, SPAT_KINDS_BY_LEVEL } from './spatTasks.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 4b: Baustein „Spatprodukt und Volumen". Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet (Determinante
// nach der ersten Zeile entwickelt, nicht mit Sarrus oder dem Kreuzprodukt der Engine), jede falsche Antwort stammt aus dem
// Katalog und ist nicht so viel wert wie die richtige, Bilder passen zur Aufgabe (Deckel = Grundfläche + c, Höhe senkrecht
// auf der Grundfläche und so lang wie die Lösung), Abwechslung.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('spat', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (v: readonly number[]) => Math.sqrt(dot(v, v))
const sub = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x - b[i])
const add = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x + b[i])
const withT = (v: readonly number[], j: number, t: number) => v.map((x, i) => (i === j ? t : x))
// Determinante der Matrix mit den Zeilen a, b, c, nach der ersten Zeile entwickelt (gleich der mit den Spalten a, b, c)
const det = (a: readonly number[], b: readonly number[], c: readonly number[]) =>
  a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])
// Fläche des Parallelogramms aus Längen und Winkel: |a| |b| sin φ
const areaN = (a: readonly number[], b: readonly number[]) => {
  const c = dot(a, b) / (norm(a) * norm(b))
  return norm(a) * norm(b) * Math.sqrt(Math.max(0, 1 - c * c))
}
const FACTOR = [1, 1 / 2, 1 / 3, 1 / 6]
const orient = (s: number) => (Math.abs(s) < 1e-9 ? 2 : s > 0 ? 0 : 1)

const UGLY: readonly RegExp[] = [/\\frac\{0\}/, /\+ -/, /- -|--/, /(?<![\d.,}{\w])1(?:t|s|\\lambda)\b/, /(?<![\d.,}])-?1\\,\\vec/, /\\frac\{1\}\{1\}/]
function nice(latex: string): string | null {
  const problem = latexProblem(latex, { checkUgly: false })
  if (problem) return problem
  const ugly = UGLY.find((re) => re.test(latex))
  if (ugly) return `unschön (${ugly.source}) in ${latex}`
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
    case 'spat':
    case 'spatCoplanar': {
      const s = det(d.a, d.b, d.c)
      expect(close(ans[0], s), context).toBe(true)
      if (ans.length > 1) expect(ans[1], context).toBe(orient(s))
      if (task.form.includes('|flat|')) expect(Math.abs(s), context).toBeLessThan(1e-9)
      return
    }
    case 'spatVolume': {
      expect(close(ans[0], FACTOR[d.body[0]] * Math.abs(det(d.a, d.b, d.c))), context).toBe(true)
      // Spat: Grundfläche mal Höhe (Abstand der Spitze von c von der Ebene aus a und b, über die Projektion)
      const h = Math.abs(det(d.a, d.b, d.c)) / areaN(d.a, d.b)
      expect(close(ans[0], FACTOR[d.body[0]] * areaN(d.a, d.b) * h), context).toBe(true)
      return
    }
    case 'spatHeight': {
      // Höhe: kleinster Abstand der Spitze zu Punkten der Ebene, hier über die Gram-Schmidt-Zerlegung von c
      const [a, b, c] = [d.a, d.b, d.c]
      const e1 = a.map((x) => x / norm(a))
      const b2 = sub(b, e1.map((x) => x * dot(b, e1)))
      const e2 = b2.map((x) => x / norm(b2))
      const rest = sub(sub(c, e1.map((x) => x * dot(c, e1))), e2.map((x) => x * dot(c, e2)))
      expect(close(ans.at(-1)!, norm(rest)), context).toBe(true)
      if (ans.length === 3) {
        expect(close(ans[0], areaN(a, b) / 2), context).toBe(true)
        expect(close(ans[1], Math.abs(det(a, b, c)) / 6), context).toBe(true)
        // Tetraeder: V = A h / 3
        expect(close(ans[1], (ans[0] * ans[2]) / 3), context).toBe(true)
      }
      return
    }
    case 'spatCoplanarParam': {
      const jc = d.jc[0]
      const at = (t: number) => (d.ja.length ? withT(d.a, d.ja[0], t) : d.a)
      for (const t of ans) expect(Math.abs(det(at(t), d.b, withT(d.c, jc, t))), `${context}: t = ${t}`).toBeLessThan(1e-9)
      for (const t of ans) expect(Math.abs(det(at(t + 0.37), d.b, withT(d.c, jc, t + 0.37))), context).toBeGreaterThan(1e-6)
      // an jeder Lösung paarweise nicht parallel
      const cr = (u: readonly number[], v: readonly number[]) => norm([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]])
      for (const t of ans) for (const [u, v] of [[at(t), d.b], [d.b, withT(d.c, jc, t)], [at(t), withT(d.c, jc, t)]]) expect(cr(u, v), context).toBeGreaterThan(1e-9)
      if (ans.length === 2) expect(ans[0], context).toBeLessThan(ans[1])
      return
    }
    case 'spatVolumeParam': {
      const j = d.j[0]
      const c = (t: number) => d.c.map((x, i) => (i === j ? x + t : x))
      expect(ans[0], context).toBeLessThan(ans[1])
      for (const t of ans) expect(close(FACTOR[d.body[0]] * Math.abs(det(d.a, d.b, c(t))), d.V[0]), `${context}: t = ${t}`).toBe(true)
      return
    }
    default:
      throw new Error(`Unerwartete Art ${task.kind}`)
  }
}

function checkDrawing(drawing: VectorDrawing, context: string) {
  expect(drawing.dim, context).toBe(3)
  for (const c of drawingCoordinates(drawing)) {
    expect(c.length, context).toBe(3)
    for (const x of c) expect(Number.isFinite(x), context).toBe(true)
  }
  for (const p of drawing.polygons) if (p.from) expect(p.from.length, context).toBe(p.points.length)
  expectRenderable(drawing.caption, context)
  for (const a of drawing.arrows) if (a.label) expect(latexProblem(a.label, { checkUgly: false }), `${context}: ${a.label}`).toBeNull()
  for (const a of drawing.angles ?? []) expect(norm(a.u) > 0 && norm(a.v) > 0, context).toBe(true)
}

describe('Vektoren: Spatprodukt und Volumen', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      check(task, context)
      expect(SPAT_KINDS_BY_LEVEL[level], context).toContain(task.kind)
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

  it('Bild zum Ergebnis: Körper zieht sich aus der Grundfläche auf, Deckel = Grundfläche + c, Höhe senkrecht und so lang wie h', () => {
    let bodies = 0
    let heights = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 100)) {
        const d = task.resultDrawing!
        const [a, b, c] = ['a', 'b', 'c'].map((col) => d.arrows.find((x) => x.color === col)!)
        const [u, v, w] = [a, b, c].map((x) => sub(x.to, x.from))
        const flat = Math.abs(det(u, v, w)) < 1e-9
        const base = d.polygons[0]
        expect(base.phase, task.form).toBe(1)
        expect(sameVec(base.points[0], a.from) && sameVec(base.points[1], a.to), task.form).toBe(true)
        if (flat) {
          expect(d.polygons.length, task.form).toBe(1)
          continue
        }
        const body = d.polygons.slice(1)
        expect(body.length, task.form).toBeGreaterThanOrEqual(3)
        for (const p of body) {
          expect(p.phase, task.form).toBe(2)
          expect(p.from, task.form).toBeDefined()
          // vor dem Aufziehen liegt jede Fläche in der Ebene der Grundfläche
          for (const q of p.from!) expect(Math.abs(det(u, v, sub(q, a.from))), task.form).toBeLessThan(1e-9)
        }
        // Spat und Prisma: Deckel ist die verschobene Grundfläche; Pyramide und Tetraeder: Spitze am Ende von c
        const top = body.find((p) => p.points.length === base.points.length && p.points.every((q, i) => sameVec(q, add(base.points[i], w))))
        const apex = body.every((p) => p.points.some((q) => sameVec(q, c.to)))
        expect(!!top || apex, task.form).toBe(true)
        bodies++
        const h = d.segments.find((s) => s.color === 'r')
        if (task.kind === 'spatHeight') {
          expect(h, task.form).toBeDefined()
          const hv = sub(h!.from, h!.to)
          expect(close(dot(hv, u), 0) && close(dot(hv, v), 0), task.form).toBe(true)
          expect(close(norm(hv), task.answer.at(-1)!), task.form).toBe(true)
          expect(sameVec(h!.from, c.to), task.form).toBe(true)
          heights++
        } else expect(h, task.form).toBeUndefined()
      }
    }
    expect(bodies).toBeGreaterThan(300)
    expect(heights).toBeGreaterThan(60)
  })

  it('vor dem Ergebnis zeigt kein Bild den Körper oder die Höhe', () => {
    for (const level of LEVELS)
      for (const task of tasks(level, 80))
        for (const step of task.steps)
          if (step.drawing) {
            expect(step.drawing.polygons.length, task.form).toBe(1)
            expect(step.drawing.segments.some((s) => s.color === 'r'), task.form).toBe(false)
          }
  })

  // Funde der unabhängigen Prüfung (Schritt 4b): Das Bild vor dem Ergebnis verrät weder „komplanar“ noch die Lage noch
  // eine Lösung; mit Parameter keine falsche Antwort, die über −s auf dieselben Lösungen führt
  it('Bild vor dem Ergebnis: ohne c bei Rechtssystem und komplanar, mit Parameter weder flach noch an einer Lösung', () => {
    let hidden = 0
    let shown = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 150)) {
        const first = task.steps.find((st) => st.drawing)?.drawing
        if (!first) continue
        const arrows = first.arrows
        if (task.steps.some((st) => st.id === 'lage')) {
          expect(arrows.some((a) => a.color === 'c'), task.form).toBe(false)
          expect(first.points.length, task.form).toBeLessThanOrEqual(3)
          hidden++
        }
        if (task.kind === 'spatCoplanarParam' || task.kind === 'spatVolumeParam') {
          const [u, v, w] = ['a', 'b', 'c'].map((col) => {
            const a = arrows.find((x) => x.color === col)!
            return sub(a.to, a.from)
          })
          expect(Math.abs(det(u, v, w)), task.form).toBeGreaterThan(1e-9)
          const t = Number(/= (-?\d+)\$/.exec(first.caption)?.[1] ?? /= (-?\d+)\$;/.exec(first.caption)?.[1])
          expect(Number.isFinite(t), `${task.form} ${first.caption}`).toBe(true)
          for (const x of task.answer) expect(close(x, t), task.form).toBe(false)
          shown++
        }
      }
    }
    expect(hidden).toBeGreaterThan(100)
    expect(shown).toBeGreaterThan(100)
  })

  it('mit Parameter weder „Diagonalen vertauscht“ noch „Reihenfolge vertauscht“', () => {
    for (const level of [4, 5] as const)
      for (const task of tasks(level, 200))
        if (task.kind === 'spatCoplanarParam' || task.kind === 'spatVolumeParam')
          for (const step of task.steps) for (const c of step.choices) expect(['vec-sarrus-swap', 'vec-cross-order'], task.form).not.toContain(c.errorRuleId)
  })

  // Regel aus CLAUDE.md: falsche Antworten nie gleichwertig zur Lösung. Zahlen, Vektoren und Lösungen nach Wert; Ausdrücke
  // mit Parameter an vielen Stellen
  it('keine falsche Antwort ist so viel wert wie die richtige', () => {
    const values = (content: string) => readResult(content)?.flatMap((p) => p.values) ?? null
    let compared = 0
    let texts = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 150)) {
        for (const step of task.steps) {
          const correct = step.choices.find((c) => c.correct)!.content
          const right = values(correct)
          for (const c of step.choices.filter((c) => !c.correct)) {
            expect(c.content, `${task.form} ${step.id}`).not.toBe(correct)
            // Gleichungen mit Betrag: rechts dieselbe Zahl; ob sie gleich viel wert sind, zeigen die Lösungen im nächsten Schritt
            if (step.id === 'gleichung') continue
            if (step.id === 'lage') {
              texts++
              continue
            }
            const wrong = values(c.content)
            if (right && wrong && wrong.length === right.length) {
              expect(wrong.every((x, i) => close(x, right[i])), `${task.form} ${step.id}: ${c.content}`).toBe(false)
              compared++
            }
          }
        }
      }
    }
    expect(compared).toBeGreaterThan(2000)
    expect(texts).toBeGreaterThan(100)
  })

  it('nutzt jeden neuen Fehler des Schritts 4b', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 200)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    const fresh = VECTOR_ERROR_RULES.map((r) => r.id).filter((id) => /^vec-(sarrus|spat|volume)-/.test(id))
    expect(fresh.length).toBe(14)
    expect(fresh.filter((id) => !used.has(id))).toEqual([])
  })

  it('freier Modus: Rechtssystem, Linkssystem oder komplanar zum Antippen, Verwechslung als typischer Fehler', () => {
    const task = tasks(2, 60).find((t) => t.kind === 'spatCoplanar' && t.answer[1] === 0)!
    const check = prepareVectorCheck(task)
    expect(check.parts[1].options).toEqual(ORIENTATIONS)
    const s = String(task.answer[0])
    expect(checkVectorEntries(check, [[s], ['Rechtssystem']]).kind).toBe('correct')
    const swapped = checkVectorEntries(check, [[s], ['Linkssystem']])
    expect(swapped.kind).toBe('wrong')
    expect(swapped.error?.id).toBe('vec-spat-orientation')
    expect(checkVectorEntries(check, [[s], ['komplanar']]).error?.id).toBe('vec-spat-coplanar')
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

const sameVec = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => close(x, b[i]))

describe('Vektoren: Lernkarten zum Spatprodukt', () => {
  it('jedes Beispiel ist eine Aufgabe der genannten Art mit Bild, die Gegenprobe stimmt', () => {
    const kinds = new Set(Object.values(SPAT_KINDS_BY_LEVEL).flat())
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
    expect(examples).toBe(9)
  })
})
