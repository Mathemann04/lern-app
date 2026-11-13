import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { VECTOR_ERROR_RULES } from './errorRules.ts'
import { type VectorDrawing, drawingCoordinates } from './figures.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { KINDS_BY_LEVEL, type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 1: Baukasten „Rechnen und Länge". Jede Aufgabe wird unabhängig nachgerechnet (mit Kommazahlen aus den
// gegebenen Größen, nicht mit der Engine), jede falsche Antwort stammt aus einem Fehler des Katalogs, Bilder passen zur
// Aufgabe, und die Abwechslung erfüllt die Kennzahlen aus docs/PLAN-M2b.md.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('rechnen', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const norm = (v: readonly number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0))
const sub = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x - b[i])
const add = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x + b[i])
const scale = (k: number, a: readonly number[]) => a.map((x) => k * x)
const expectVec = (got: readonly number[], want: readonly number[], context: string) => {
  expect(got.length, context).toBe(want.length)
  got.forEach((x, i) => expect(close(x, want[i]), `${context}: ${got} gegen ${want}`).toBe(true))
}

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
    case 'connect':
      // Verbindungsvektor oder Endpunkt
      if (task.form.includes('endpoint')) expectVec(ans, add(d.p, d.d), context)
      else expectVec(ans, sub(d.q, d.p), context)
      return
    case 'combo': {
      const vs = d.coefs.map((_, i) => d[`v${i}`])
      expectVec(ans, vs.reduce((acc, v, i) => add(acc, scale(d.coefs[i], v)), vs[0].map(() => 0)), context)
      return
    }
    case 'length':
      // Länge einer Summe oder Differenz: aus den gegebenen Vektoren
      expect(close(ans[0], norm(d.v ?? add(d.a, scale(d.sign[0], d.b)))), context).toBe(true)
      return
    case 'distance':
      expect(close(ans[0], norm(sub(d.q, d.p))), context).toBe(true)
      return
    case 'midpoint':
      expectVec(ans, scale(0.5, add(d.p, d.q)), context)
      return
    case 'unit':
      expect(close(norm(ans), 1), context).toBe(true)
      expectVec(scale(norm(d.v), ans), d.v, context)
      return
    case 'givenLength':
      // aus zwei Punkten: der Richtungsvektor ist ihr Verbindungsvektor
      if (d.p) expectVec(sub(d.q, d.p), d.a, context)
      expect(close(norm(ans), d.target[0]), context).toBe(true)
      // gleichsinnig: Skalarprodukt positiv, gegensinnig negativ, und parallel
      expect(Math.sign(ans.reduce((s, x, i) => s + x * d.a[i], 0)), context).toBe(d.sign[0])
      expectVec(scale(norm(d.a) / norm(ans) * d.sign[0], ans), d.a, context)
      return
    case 'parallelogram': {
      // gegenüberliegende Seiten gleich: A + C = B + D, und der gesuchte Punkt ist der fehlende
      expectVec(add(d.A, d.C), add(d.B, d.D), context)
      const missing = [d.A, d.B, d.C, d.D][d.missing[0]]
      expectVec(ans.slice(0, missing.length), missing, context)
      if (ans.length > missing.length) expect(close(ans.at(-1)!, norm(sub(missing, [d.A, d.B, d.C, d.D][(d.missing[0] + 2) % 4]))), context).toBe(true)
      return
    }
    case 'equation': {
      // k·x + sa·a = b
      expectVec(add(scale(d.k[0], ans), scale(d.sa[0], d.a)), d.b, context)
      return
    }
    case 'paramLength': {
      expect(ans.length, context).toBe(2)
      for (const t of ans) {
        const v = d.v.map((x, j) => (j === d.i[0] ? d.c[0] * t : x))
        expect(close(norm(v), d.L[0]), `${context}: ${task.ref.seed} t = ${t}`).toBe(true)
      }
      expect(ans[0], context).not.toBe(ans[1])
      return
    }
    case 'paramDistance': {
      expect(ans.length, context).toBe(2)
      for (const t of ans) {
        const q = d.q.map((x, j) => (j === d.i[0] ? t : x))
        expect(close(norm(sub(q, d.p)), d.L[0]), `${context}: t = ${t}`).toBe(true)
      }
      expect(ans[0], context).not.toBe(ans[1])
      return
    }
  }
}

function checkDrawing(drawing: VectorDrawing, context: string) {
  for (const c of drawingCoordinates(drawing)) {
    expect(c.length, context).toBe(drawing.dim)
    for (const x of c) expect(Number.isFinite(x), context).toBe(true)
  }
  expectRenderable(drawing.caption, context)
  for (const a of drawing.arrows) if (a.label) expect(latexProblem(a.label, { checkUgly: false }), `${context}: ${a.label}`).toBeNull()
}

describe('Vektoren: Rechnen und Länge', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      check(task, context)
      expect(KINDS_BY_LEVEL[level], context).toContain(task.kind)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
      expect(task.steps.length, context).toBeGreaterThan(0)
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
        for (const c of step.choices) if (c.drawing) checkDrawing(c.drawing, where)
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
      if (task.resultDrawing) checkDrawing(task.resultDrawing, context)
    }
  })

  it('Stufe 1 in der Ebene, Stufe 2 im Raum, Stufe 4 mit Parameter oder in mehr Dimensionen; mit Bild, wo es eins gibt', () => {
    for (const task of tasks(1, 60)) expect(task.resultDrawing?.dim, task.form).toBe(2)
    for (const task of tasks(2, 60)) expect(task.resultDrawing?.dim, task.form).toBe(3)
    for (const task of tasks(4, 60)) expect(task.kind === 'paramLength' || task.form.match(/\|[45]\|/) !== null, task.form).toBe(true)
  })

  it('Bilder passen zur Aufgabe: Ergebnispfeil endet beim Ergebnis', () => {
    for (const level of [1, 2] as const) {
      for (const task of tasks(level, 80)) {
        const d = task.resultDrawing!
        const r = d.arrows.find((a) => a.color === 'r')
        if (task.kind === 'combo' || (task.kind === 'connect' && !task.form.includes('endpoint'))) {
          expectVec(sub(r!.to, r!.from), task.answer, task.form)
        }
        if (task.kind === 'midpoint') expectVec(d.points.find((p) => p.label === 'M')!.at, task.answer, task.form)
        if (task.kind === 'unit') expect(close(norm(sub(r!.to, r!.from)), 1), task.form).toBe(true)
        if (task.kind === 'length' && !task.form.includes('scaled')) expect(close(norm(sub(d.arrows[0].to, d.arrows[0].from)), task.answer[0]), task.form).toBe(true)
      }
    }
  })

  it('nutzt jeden Fehler des Katalogs in mindestens einer Stufe', () => {
    const used = new Set<string>()
    // alle Bausteine: Rechnen und Länge, Skalarprodukt und Winkel (Schritt 2), Projektion und Zerlegung (Schritt 3a), Kräfte (3b), Kreuzprodukt (4a), Spatprodukt (4b), Linearkombination und Basis (5)
    const other = (level: Level, block: string) => Array.from({ length: 200 }, (_, i) => buildVectorTask({ level, seed: blockSeed(block, i + 1) }))
    const both = (level: Level) => [...tasks(level, 200), ...other(level, 'skalar'), ...other(level, 'projektion'), ...other(level, 'kraefte'), ...other(level, 'kreuz'), ...other(level, 'spat'), ...other(level, 'basis')]
    for (const level of LEVELS)
      for (const task of both(level))
        for (const step of task.steps) {
          for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
          // Zieh-Aufgaben (Schritt 2b): typische Fehler beim Ziehen
          for (const t of step.drag?.traps ?? []) used.add(t.rule)
        }
    expect(VECTOR_ERROR_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
  })

  // Kennzahlen aus docs/PLAN-M2b.md: unter 200 Aufgaben mindestens 100 Formen, keine öfter als 3 von 100
  it.each(cells)('Stufe %i: mindestens 100 Formen unter 200, keine öfter als 3 %%', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('baut dieselbe Aufgabe zur selben Nummer', () => {
    expect(buildVectorTask(ref(3, 42))).toEqual(buildVectorTask(ref(3, 42)))
  })
})

describe('Vektoren: Lernkarten', () => {
  const cards = cardsInTopic('vektoren')

  it('jedes Beispiel ist eine Aufgabe der genannten Art mit Bild, die Gegenprobe stimmt', () => {
    for (const card of cards) {
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask(ref(e.vector.level, e.vector.seed), e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        expect(task.resultDrawing, card.id).toBeDefined()
        check(task, card.id)
      }
    }
  })

  it('jede Karte der Aufgaben gibt es, und jeder Fehler steht auf einer Karte des Ordners', () => {
    const shown = new Set(cards.flatMap((c) => c.errors))
    for (const rule of VECTOR_ERROR_RULES) expect(shown.has(rule.id), rule.id).toBe(true)
    for (const level of LEVELS) for (const task of tasks(level, 60)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(cardById(id)?.topic, id).toBe('vektoren')
  })
})
