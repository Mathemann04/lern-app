import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { ABSTAND_KINDS_BY_LEVEL } from './distTasks.ts'
import { WINKEL_KINDS_BY_LEVEL } from './cutAngleTasks.ts'
import { VECTOR_ERROR_RULES } from './errorRules.ts'
import { type VectorDrawing, drawingCoordinates } from './figures.ts'
import { LINE_ERROR_RULES } from './lineErrorRules.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'
import { evaluate } from '../expr/evaluate.ts'
import { parseLatex } from '../parse/latex.ts'

// M7 Schritt 7b: Bausteine „Abstände“ und „Schnittwinkel“ der Tätigkeit „Geraden und Ebenen“. Jede Aufgabe wird
// unabhängig mit Kommazahlen nachgerechnet (Abstand über den Lotfußpunkt bzw. das Kreuzprodukt, Winkel mit acos und asin);
// dazu Texte, Antworten, Bilder, Abwechslung, freier Modus und Lernkarten.

type Block = 'abstand' | 'schnittwinkel'
const ref = (block: Block, level: Level, s: number) => ({ level, seed: blockSeed(block, s) })
const tasks = (block: Block, level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(block, level, i + 1)))

type V = readonly number[]
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const dot = (a: V, b: V) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (v: V) => Math.sqrt(dot(v, v))
const sub = (a: V, b: V) => a.map((x, i) => x - b[i])
const crossN = (a: V, b: V) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const parallel = (a: V, b: V) => close(Math.abs(dot(a, b)), norm(a) * norm(b))
const planeDist = (P: V, n: V, d: number) => Math.abs(dot(n, P) - d) / norm(n)
// Abstand Punkt–Gerade über die Fläche (unabhängig vom Lotfußpunkt)
const lineDist = (P: V, p: V, v: V) => {
  const r = sub(P, p)
  if (v.length === 2) return Math.abs(r[0] * v[1] - r[1] * v[0]) / norm(v)
  return norm(crossN(r, v)) / norm(v)
}
const degOf = (x: number) => (x * 180) / Math.PI
const cutCos = (a: V, b: V) => Math.abs(dot(a, b)) / (norm(a) * norm(b))

function check(task: VectorTask, context: string) {
  const d = task.data
  const ans = task.answer
  const res = task.resultLatex!
  switch (task.kind) {
    case 'distPointPlane': {
      const dd = d.d[0]
      if (res.startsWith('d = ')) expect(close(ans[0], planeDist(d.P, d.n, dd)), context).toBe(true)
      else if (res.startsWith('a_1')) {
        expect(ans[0], context).toBeLessThan(ans[1])
        for (const a of ans) expect(close(planeDist(d.P.map((x, i) => (i === d.j[0] ? a : x)), d.n, dd), d.D[0]), `${context}: ${a}`).toBe(true)
      } else {
        const F = ans.slice(0, 3)
        const P2 = ans.slice(3)
        expect(close(dot(d.n, F), dd), context).toBe(true)
        expect(parallel(sub(F, d.P), d.n), context).toBe(true)
        expect(P2.every((x, i) => close(x, 2 * F[i] - d.P[i])), context).toBe(true)
      }
      return
    }
    case 'distPointLine': {
      const dim = d.p.length
      const F = ans.slice(0, dim)
      expect(close(lineDist(F, d.p, d.v), 0), context).toBe(true)
      expect(close(dot(sub(F, d.P), d.v), 0), context).toBe(true)
      if (res.includes('d = ')) expect(close(ans[dim], lineDist(d.P, d.p, d.v)), context).toBe(true)
      else expect(ans.slice(dim).every((x, i) => close(x, 2 * F[i] - d.P[i])), context).toBe(true)
      return
    }
    case 'distLines': {
      const { p, v, q, w } = d
      const expected = parallel(v, w) ? lineDist(q, p, v) : Math.abs(dot(sub(q, p), crossN(v, w))) / norm(crossN(v, w))
      expect(expected, context).toBeGreaterThan(0)
      expect(close(ans[0], expected), context).toBe(true)
      return
    }
    case 'distParallel': {
      if (d.m) {
        expect(parallel(d.n, d.m), context).toBe(true)
        // ein Punkt von F: Lotfußpunkt des Ursprungs
        const Q = d.m.map((x) => (x * d.e[0]) / dot(d.m, d.m))
        expect(close(ans[0], planeDist(Q, d.n, d.d[0])), context).toBe(true)
      } else {
        expect(close(dot(d.n, d.v), 0), context).toBe(true)
        expect(close(ans[0], planeDist(d.p, d.n, d.d[0])), context).toBe(true)
      }
      expect(ans[0], context).toBeGreaterThan(0)
      return
    }
    case 'angleLines':
    case 'anglePlanes': {
      const [a, b] = task.kind === 'angleLines' ? [d.v, d.w] : [d.n, d.m]
      if (res.startsWith('a = ')) {
        expect(close(dot(a, b), 0), context).toBe(true)
        expect(close(a[d.j[0]], ans[0]), context).toBe(true)
      } else if (res.startsWith('\\cos')) expect(close(ans[0], cutCos(a, b)), context).toBe(true)
      else expect(close(ans[0], degOf(Math.acos(cutCos(a, b)))), context).toBe(true)
      return
    }
    case 'angleLinePlane': {
      const { n, v } = d
      if (res.startsWith('a = ')) {
        expect(parallel(n, v), context).toBe(true)
        expect(close(v[d.j[0]], ans[0]), context).toBe(true)
      } else if (res.startsWith('\\sin')) expect(close(ans[0], cutCos(n, v)), context).toBe(true)
      else expect(close(ans[0], degOf(Math.asin(cutCos(n, v)))), context).toBe(true)
      return
    }
    default:
      throw new Error(`Unerwartete Art ${task.kind}`)
  }
}

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null|\+ -|- -/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind === 'math') expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
  }
}

function checkDrawing(drawing: VectorDrawing, context: string) {
  for (const c of drawingCoordinates(drawing)) {
    expect(c.length, context).toBe(drawing.dim)
    for (const x of c) expect(Number.isFinite(x), context).toBe(true)
  }
  expectRenderable(drawing.caption, context)
}

const ALL_RULES = [...LINE_ERROR_RULES, ...VECTOR_ERROR_RULES]
const BLOCKS: readonly Block[] = ['abstand', 'schnittwinkel']
const KINDS = { abstand: ABSTAND_KINDS_BY_LEVEL, schnittwinkel: WINKEL_KINDS_BY_LEVEL }
const cells = BLOCKS.flatMap((b) => LEVELS.map((level) => [b, level] as const))

describe('Geraden und Ebenen: Abstände und Schnittwinkel', () => {
  it.each(cells)('%s Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (block, level) => {
    for (const task of tasks(block, level, 150)) {
      const context = `${block} ${level}-${task.ref.seed} ${task.form}`
      check(task, context)
      expect(KINDS[block][level], context).toContain(task.kind)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
      const parts = readResult(task.resultLatex!)
      expect(parts, context).not.toBeNull()
      const values = parts!.flatMap((p) => p.values)
      expect(values.length, context).toBe(task.answer.length)
      for (const [i, v] of values.entries()) expect(close(v, task.answer[i]), `${context}: ${i}`).toBe(true)
      expect(new Set(task.steps.map((s) => s.id)).size, context).toBe(task.steps.length)
      for (const step of task.steps) {
        const where = `${context} ${step.id}`
        expect(step.choices.length, where).toBeGreaterThanOrEqual(3)
        expect(step.choices.filter((c) => c.correct).length, where).toBe(1)
        expect(new Set(step.choices.map((c) => c.content)).size, where).toBe(step.choices.length)
        for (const text of [step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) expectRenderable(text, where)
        for (const c of step.choices.filter((c) => !c.correct)) {
          expect(ALL_RULES.some((r) => r.id === c.errorRuleId), `${where}: ${c.errorRuleId}`).toBe(true)
          expectRenderable(c.whyWrong!.detailed, where)
        }
        if (step.drawing) checkDrawing(step.drawing, where)
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
      checkDrawing(task.resultDrawing!, context)
      // das erste Bild zeigt die Aufgabe ohne Lot bzw. ohne Winkelwert
      expect(task.steps[0].drawing, context).toBeDefined()
    }
  })

  it('keine falsche Antwort hat denselben Wert wie die richtige', () => {
    let compared = 0
    for (const block of BLOCKS)
      for (const level of LEVELS)
        for (const task of tasks(block, level, 80))
          for (const step of task.steps) {
            const right = readResult(step.choices.find((c) => c.correct)!.content)
            if (!right) continue
            for (const c of step.choices.filter((c) => !c.correct)) {
              const wrong = readResult(c.content)
              if (!wrong || wrong.length !== right.length) continue
              const same = right.every((r, i) => {
                const w = wrong[i]
                if (w.shape !== r.shape || w.values.length !== r.values.length || w.label !== r.label) return false
                if (r.shape === 'param') return false
                return r.values.every((x, j) => close(x, w.values[j]))
              })
              expect(same, `${task.form} ${step.id}: ${c.content}`).toBe(false)
              compared++
            }
          }
    expect(compared).toBeGreaterThan(1000)
  })

  it('Lotfußpunkt und Winkel im Bild liegen richtig', () => {
    for (const level of LEVELS)
      for (const task of tasks('abstand', level, 60)) {
        const F = task.resultDrawing!.points.find((p) => p.label === 'F')
        if (!F) continue
        if (task.kind === 'distPointPlane') expect(close(dot(task.data.n, F.at), task.data.d[0]), task.form).toBe(true)
        if (task.kind === 'distPointLine') expect(close(lineDist(F.at, task.data.p, task.data.v), 0), task.form).toBe(true)
      }
    for (const level of LEVELS)
      for (const task of tasks('schnittwinkel', level, 60)) {
        const arc = task.resultDrawing!.angles![0]
        const c = dot(arc.u, arc.v) / (norm(arc.u) * norm(arc.v))
        const shown = degOf(Math.acos(Math.min(1, Math.max(-1, c))))
        expect(shown, task.form).toBeLessThanOrEqual(90 + 1e-6)
        if (task.resultLatex!.startsWith('\\varphi')) expect(Math.abs(shown - task.answer[0]) < 1e-6, task.form).toBe(true)
      }
  })

  // Funde der unabhängigen Prüfung
  it('die Bedingung für den Lotfußpunkt: jede falsche Gleichung hat eine andere Lösung', () => {
    // lineare Gleichung „… = c“ in t: Lösung über zwei Werte der linken Seite
    const solve = (latex: string, t: string) => {
      const [lhs, rhs] = latex.replace(/^\$|\$$/g, '').split(' = ')
      const e = parseLatex(lhs)
      if (!e.ok) throw new Error(latex)
      const name = t.replace('\\', '')
      const at = (x: number) => evaluate(e.expr, { [name]: x })
      return (Number(rhs) - at(0)) / (at(1) - at(0))
    }
    let checked = 0
    for (const level of LEVELS)
      for (const task of tasks('abstand', level, 150)) {
        const step = task.steps.find((s) => s.id === 'bedingung')
        if (!step) continue
        const t = /F_(\\?[a-z]+)\}/.exec(step.question)![1]
        const right = solve(step.choices.find((c) => c.correct)!.content, t)
        for (const c of step.choices.filter((c) => !c.correct)) expect(close(solve(c.content, t), right), `${task.form}: ${c.content}`).toBe(false)
        checked++
      }
    expect(checked).toBeGreaterThan(100)
  })

  it('kein Name doppelt: Ebene und Lotfußpunkt, gegebener Punkt und Stützpunkt', () => {
    for (const level of LEVELS)
      for (const task of tasks('abstand', level, 150)) {
        expect(task.instruction, task.form).not.toMatch(/Ebene \$F\$/)
        const named = [...task.functionLatex!.matchAll(/([A-Z])\(/g)].map((m) => m[1])
        for (const step of task.steps.filter((s) => s.id === 'koordinatenform')) {
          const own = [...`${step.hint} ${step.explanation.detailed}`.matchAll(/([A-Z])\(/g)].map((m) => m[1])
          expect(own.some((x) => named.includes(x) && x !== 'A'), task.form).toBe(false)
        }
      }
  })

  it('Winkel zur Koordinatenebene: der Punkt im Bild liegt in ihr', () => {
    let checked = 0
    for (const task of tasks('schnittwinkel', 3, 200).filter((t) => t.form.includes('|axis'))) {
      const axis = Number(/\|axis(\d)/.exec(task.form)![1])
      const X = task.resultDrawing!.points[0].at
      expect(close(X[axis], 0), task.form).toBe(true)
      checked++
    }
    expect(checked).toBeGreaterThan(10)
  })

  it.each(cells)('%s Stufe %i: mindestens 100 Formen unter 200, keine öfter als 3 %%', (block, level) => {
    const stats = varietyStats(tasks(block, level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('baut dieselbe Aufgabe zur selben Nummer', () => {
    expect(buildVectorTask(ref('abstand', 5, 42))).toEqual(buildVectorTask(ref('abstand', 5, 42)))
    expect(buildVectorTask(ref('schnittwinkel', 3, 7))).toEqual(buildVectorTask(ref('schnittwinkel', 3, 7)))
  })
})

// Zahlen als LaTeX für den freien Modus
const entry = (x: number) => {
  if (Number.isInteger(x)) return String(x)
  for (let den = 2; den <= 400; den++) {
    const num = Math.round(x * den)
    if (Math.abs(num / den - x) < 1e-12) return `${num < 0 ? '-' : ''}\\frac{${Math.abs(num)}}{${den}}`
  }
  return null
}

describe('Abstände und Schnittwinkel: freier Modus', () => {
  it('nimmt das Ergebnis an (Wurzeln als Wurzel getippt)', () => {
    let checked = 0
    for (const block of BLOCKS)
      for (const level of LEVELS)
        for (const task of tasks(block, level, 30)) {
          const check = prepareVectorCheck(task)
          // Wurzeln stehen im Ergebnis; getippt wird der Ausdruck aus dem Ergebnis selbst
          const latexParts = task.resultLatex!.split(',\\; ')
          const input = check.parts.map((p, i) => {
            if (p.shape === 'number') return [latexParts[i].split(' = ').at(-1)!.replace('^\\circ', '')]
            return p.values.map((x) => entry(x) ?? String(x))
          })
          expect(checkVectorEntries(check, input).kind, `${task.form}: ${JSON.stringify(input)}`).toBe('correct')
          checked++
        }
    expect(checked).toBe(300)
  })

  it('erkennt typische Fehler beim Abstand und beim Winkel', () => {
    const found = new Set<string>()
    for (const block of BLOCKS)
      for (const level of LEVELS)
        for (const task of tasks(block, level, 40)) {
          const last = task.steps.at(-1)!
          const check = prepareVectorCheck(task)
          if (check.parts.length !== 1 || check.parts[0].shape !== 'number') continue
          for (const c of last.choices.filter((x) => !x.correct)) {
            const latex = c.content.replace(/^\$|\$$/g, '').split(' = ').at(-1)!.replace('^\\circ', '')
            const verdict = checkVectorEntries(check, [[latex]])
            expect(verdict.kind, `${task.form}: ${c.content}`).toBe('wrong')
            if (verdict.kind === 'wrong' && verdict.error?.id === c.errorRuleId) found.add(c.errorRuleId!)
          }
        }
    for (const id of ['gl-dist-abs', 'gl-hesse-not-normed', 'gl-angle-abs', 'gl-skew-points']) expect(found.has(id), id).toBe(true)
  })

  it('Spiegelpunkt: Lotfußpunkt statt Spiegelpunkt wird erkannt', () => {
    let checked = 0
    for (const task of tasks('abstand', 5, 60).filter((t) => t.resultLatex!.includes("'("))) {
      const check = prepareVectorCheck(task)
      const F = check.parts[0].values
      const verdict = checkVectorEntries(check, [F.map((x) => entry(x)!), F.map((x) => entry(x)!)])
      expect(verdict.kind === 'wrong' && verdict.error?.id, task.form).toBe('gl-mirror-foot')
      checked++
    }
    expect(checked).toBeGreaterThan(10)
  })
})

describe('Abstände und Schnittwinkel: Fehler und Lernkarten', () => {
  const NEW_RULES = LINE_ERROR_RULES.slice(50)

  it('nutzt jeden neuen Fehler, und jeder steht auf einer Karte des Ordners', () => {
    const used = new Set<string>()
    for (const block of BLOCKS) for (const level of LEVELS) for (const task of tasks(block, level, 150)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    expect(NEW_RULES.length).toBe(14)
    expect(NEW_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
    const shown = new Set(cardsInTopic('geraden').flatMap((c) => c.errors))
    for (const id of used) if (id.startsWith('gl-')) expect(shown.has(id), id).toBe(true)
  })

  it('jede Karte der Aufgaben gibt es, und jedes Beispiel der neuen Karten besteht die Gegenprobe', () => {
    for (const block of BLOCKS)
      for (const level of LEVELS) for (const task of tasks(block, level, 40)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(['geraden', 'vektoren'], id).toContain(cardById(id)?.topic)
    let examples = 0
    for (const card of cardsInTopic('geraden').filter((c) => c.id.startsWith('gl-abstand') || c.id === 'gl-schnittwinkel')) {
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        check(task, card.id)
        examples++
      }
    }
    expect(examples).toBe(14)
  })
})
