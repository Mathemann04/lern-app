import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { createRng } from '../random/rng.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { varietyStats } from '../tasks/variety.ts'
import { type DragStep, dragPositions, judgeDrag, paramOf, reportLine, snapDrag } from './drag.ts'
import { DRAG_SHARE, DRAG_VARIANTS, buildDrag } from './dragTasks.ts'
import { VECTOR_ERROR_RULES } from './errorRules.ts'
import { drawingCoordinates } from './figures.ts'
import type { VectorTask } from './taskKit.ts'
import { checkVectorDrag, prepareVectorFreeTask } from './vectorFree.ts'
import { buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 2b: Pfeil ziehen. An jeder Stelle, an die man ziehen kann, urteilt die Engine genau so wie eine unabhängige
// Gegenprobe mit Kommazahlen aus den gegebenen Größen; typische Fehler greifen nie an einer richtigen Stelle; Start ist
// nie richtig und zählt nicht als Antwort; Texte und Bilder sind vollständig.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('skalar', s) })
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0)
const sub = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x - b[i])
const same = (a: readonly number[], b: readonly number[]) => a.every((x, i) => x === b[i])
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9

// Zieh-Aufgaben direkt aus dem Baukasten: je Art 40
function built(level: Level): VectorTask[] {
  return DRAG_VARIANTS[level].flatMap((v) => Array.from({ length: 40 }, (_, i) => ({ ...buildDrag(createRng(`ziehen-test:${v}:${i}`), level, v), ref: ref(level, i + 1) }) as VectorTask))
}

const variantOf = (task: VectorTask) => task.form.split('|')[1]

// Unabhängige Gegenprobe: Ist p richtig? (ohne Engine, nur aus den gegebenen Größen)
function expected(task: VectorTask, p: readonly number[]): boolean {
  const d = task.data
  const zero = p.every((x) => x === 0)
  switch (variantOf(task)) {
    case 'perp':
      return !zero && dot(d.a, p) === 0
    case 'acute':
      return dot(d.a, p) > 0
    case 'obtuse':
      return dot(d.a, p) < 0
    case 'dotValue':
      return dot(d.a, p) === d.k[0]
    case 'angle':
      return !zero && near((Math.acos(dot(d.a, p) / (Math.hypot(...d.a) * Math.hypot(...p))) * 180) / Math.PI, d.deg[0])
    case 'rightAt': {
      const [V, W] = d.at[0] === 0 ? [d.A, d.B] : [d.B, d.A]
      return !same(p, d.A) && !same(p, d.B) && dot(sub(W, V), sub(p, V)) === 0
    }
    case 'perpLength':
      return dot(d.a, p) === 0 && dot(p, p) === d.L2[0]
    case 'thales':
      return !same(p, d.A) && !same(p, d.B) && dot(sub(d.A, p), sub(d.B, p)) === 0
    case 'perpLine':
      return dot(d.pa, p) === 0 && !zero
    case 'acuteLine':
      return d.want[0] === 0 ? dot(d.a, p) > 0 : dot(d.a, p) < 0
    case 'rhombus':
      return !zero && !same(p, d.a) && !same(p, d.a.map((x) => -x)) && dot(p, p) === dot(d.a, d.a)
    case 'thalesVec':
      return !zero && !same(p, d.a) && dot(sub(d.a, p), p) === 0
    case 'twoDots':
      return dot(d.a, p) === 0 && dot(d.c, p) === d.k[0]
    default:
      throw new Error(`Unbekannte Art ${task.form}`)
  }
}

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind === 'math') expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
  }
}

function checkTask(task: VectorTask) {
  const context = task.form
  const step = task.steps[0]
  const drag = step.drag as DragStep
  expect(drag, context).toBeDefined()
  expect(step.drawing?.frame, context).toBeDefined()
  const frame = step.drawing!.frame!
  // jede Stelle liegt im Ausschnitt, Bild und Aufgabe passen zusammen (2 Einträge, Gegebenes im Ausschnitt)
  const positions = dragPositions(drag)
  for (const p of positions) expect(p[0] >= frame.xmin && p[0] <= frame.xmax && p[1] >= frame.ymin && p[1] <= frame.ymax, `${context}: ${p}`).toBe(true)
  for (const c of drawingCoordinates(step.drawing!)) expect(c.length, context).toBe(2)
  // Start: nie richtig, Prüfen dort zählt nicht
  expect(judgeDrag(drag, drag.start).kind, context).toBe('invalid')
  expect(expected(task, drag.start), `${context}: Start ${drag.start}`).toBe(false)
  // Lösung: richtig für Engine und Gegenprobe
  expect(judgeDrag(drag, drag.solution).kind, context).toBe('correct')
  expect(expected(task, drag.solution), context).toBe(true)
  // jede Stelle: Engine urteilt wie die Gegenprobe; typische Fehler nur an falschen Stellen
  let rights = 0
  for (const p of positions) {
    const v = judgeDrag(drag, p)
    if (v.kind === 'invalid') {
      expect(expected(task, p), `${context}: ${p} gesperrt, aber richtig`).toBe(false)
      continue
    }
    expect(v.kind === 'correct', `${context}: Stelle ${p}`).toBe(expected(task, p))
    if (v.kind === 'correct') rights++
    for (const line of v.lines) expect(latexProblem(line.latex, { checkUgly: false }), `${context}: ${line.latex}`).toBeNull()
  }
  expect(rights, context).toBeGreaterThan(0)
  for (const t of drag.traps) {
    expect(VECTOR_ERROR_RULES.some((r) => r.id === t.rule), t.rule).toBe(true)
    expect(drag.whys[t.rule], t.rule).toBeDefined()
  }
  // Texte
  for (const text of [task.instruction, step.question, step.hint, step.explanation.detailed, step.explanation.short, step.choices[0].content, ...drag.forbidden.map((f) => f.note)]) expectRenderable(text, context)
  expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
  expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
  expectRenderable(task.resultDrawing!.caption, context)
  // weitere Schritte (mit Parameter) wie sonst: drei bis vier Antworten, eine richtig
  for (const s of task.steps.slice(1)) {
    expect(s.choices.length, `${context} ${s.id}`).toBeGreaterThanOrEqual(3)
    expect(s.choices.filter((c) => c.correct).length).toBe(1)
  }
}

describe('Vektoren: Pfeil ziehen', () => {
  it.each(LEVELS.map((l) => [l] as const))('Stufe %i: jede Art, jede Stelle wie die Gegenprobe', (level) => {
    for (const task of built(level)) checkTask(task)
  })

  it.each(LEVELS.map((l) => [l] as const))('Stufe %i: Zieh-Aufgaben unter den Nummern, jede Art kommt vor', (level) => {
    const tasks = Array.from({ length: 300 }, (_, i) => buildVectorTask(ref(level, i + 1))).filter((t) => t.kind === 'drag')
    // Anteil ungefähr DRAG_SHARE
    expect(Math.abs(tasks.length / 300 - DRAG_SHARE)).toBeLessThan(0.08)
    for (const task of tasks.slice(0, 30)) checkTask(task)
    const variants = new Set(tasks.map((t) => t.form.split('|')[1]))
    for (const v of DRAG_VARIANTS[level]) expect(variants, v).toContain(v)
  })

  it.each(LEVELS.map((l) => [l] as const))('Stufe %i: Abwechslung unter den Zieh-Aufgaben', (level) => {
    const forms = Array.from({ length: 100 }, (_, i) => buildDrag(createRng(`ziehen-vielfalt:${level}:${i}`), level).form)
    const stats = varietyStats(forms)
    expect(stats.distinct, `${stats.distinct}`).toBeGreaterThanOrEqual(40)
    expect(stats.maxShare).toBeLessThanOrEqual(0.1)
  })

  it('jeder typische Fehler beim Ziehen wird an einer Stelle erkannt', () => {
    const found = new Set<string>()
    for (const level of LEVELS)
      for (const task of built(level)) {
        const drag = task.steps[0].drag!
        for (const p of dragPositions(drag)) {
          const v = judgeDrag(drag, p)
          if (v.kind === 'error') found.add(v.rule)
        }
      }
    const all = new Set(LEVELS.flatMap((l) => built(l).flatMap((t) => t.steps[0].drag!.traps.map((x) => x.rule))))
    expect([...all].filter((r) => !found.has(r))).toEqual([])
    for (const r of ['vec-perp-swap', 'vec-right-not-acute', 'vec-right-wrong-corner', 'vec-diagonals-sides', 'vec-angle-zero', 'vec-dot-cross']) expect(found, r).toContain(r)
  })

  it('Beispiele: senkrecht mit typischen Fehlern, Rechnung in der Rückmeldung', () => {
    const task = buildDrag(createRng('ziehen-beispiel'), 1, 'perp')
    const drag = task.steps[0].drag!
    const a = task.data.a
    expect(judgeDrag(drag, [-a[1], a[0]]).kind).toBe('correct')
    expect(judgeDrag(drag, [a[1], -a[0]]).kind).toBe('correct')
    const swapped = judgeDrag(drag, [a[1], a[0]])
    expect(swapped.kind === 'error' && swapped.rule).toBe('vec-perp-swap')
    const parallel = judgeDrag(drag, a)
    expect(parallel.kind === 'error' && parallel.rule).toBe('vec-angle-zero')
    expect(judgeDrag(drag, [0, 0]).kind).toBe('invalid')
    const line = reportLine(drag.conditions[0], [2, 1], [0, 0])
    expect(line.latex).toContain(`\\cdot 2`)
    expect(line.ok).toBe(dot(a, [2, 1]) === 0)
  })

  it('Einrasten: runden, im Ausschnitt halten, auf der Geraden ganze Werte des Parameters', () => {
    const task = buildDrag(createRng('ziehen-raster'), 1, 'acute')
    const drag = task.steps[0].drag!
    expect(snapDrag(drag, [1.4, -2.6])).toEqual([1, -3])
    expect(snapDrag(drag, [40, -40])).toEqual([drag.frame.xmax, drag.frame.ymin])
    const lineTask = buildDrag(createRng('ziehen-gerade'), 4, 'perpLine')
    const ld = lineTask.steps[0].drag!
    const line = ld.line!
    const p = snapDrag(ld, line.base.map((x, i) => x + 1.3 * line.dir[i] + 0.4))
    expect(Number.isInteger(paramOf(line, p))).toBe(true)
    expect(paramOf(line, p)).toBeGreaterThanOrEqual(line.tmin)
    expect(paramOf(line, p)).toBeLessThanOrEqual(line.tmax)
  })

  it('freier Modus: ohne Ergebnis wird gezogen, mit Parameter getippt (dazu das Bild zum Ausprobieren)', () => {
    for (const level of LEVELS)
      for (let s = 1; s <= 200; s++) {
        const task = buildVectorTask(ref(level, s))
        if (task.kind !== 'drag') continue
        const free = prepareVectorFreeTask(ref(level, s))
        const drag = task.steps[0].drag!
        if (task.dragOnly) {
          expect(free.drag, task.form).toBeDefined()
          expect(free.checkDrag!(drag.solution).kind).toBe('correct')
          expect(free.checkDrag!(drag.start).kind).toBe('unreadable')
          const wrong = dragPositions(drag).find((p) => judgeDrag(drag, p).kind === 'error')
          if (wrong) expect(free.checkDrag!(wrong).error?.id, task.form).toBeDefined()
        } else {
          expect(free.drag, task.form).toBeUndefined()
          expect(free.entries, task.form).toBeDefined()
        }
      }
    const task = buildDrag(createRng('ziehen-frei'), 2, 'rightAt')
    const v = checkVectorDrag(task.steps[0].drag!, task.steps[0].drag!.solution)
    expect(v.message).toContain('✓')
  })
})
