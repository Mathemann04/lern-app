import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { VECTOR_ERROR_RULES } from './errorRules.ts'
import { type VectorDrawing, drawingCoordinates } from './figures.ts'
import { LINE_ERROR_RULES } from './lineErrorRules.ts'
import { LAGE_KINDS_BY_LEVEL, LINE_PAIR_RULES, LINE_PLANE_RULES, PLANE_PAIR_RULES } from './posTasks.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 7a: Baustein „Lage“ der Tätigkeit „Geraden und Ebenen“. Jede Aufgabe wird unabhängig mit Kommazahlen
// nachgerechnet: Lage zweier Geraden über Kreuz- und Spatprodukt, Schnitt- und Durchstoßpunkte liegen auf beiden,
// Schnittgeraden in beiden Ebenen; dazu Texte, Antworten, Bilder, Abwechslung, freier Modus und Lernkarten.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('lage', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

type V = readonly number[]
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const dot = (a: V, b: V) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (v: V) => Math.sqrt(dot(v, v))
const sub = (a: V, b: V) => a.map((x, i) => x - b[i])
const crossN = (a: V, b: V) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const parallel = (a: V, b: V) => norm(a) === 0 || norm(b) === 0 || close(Math.abs(dot(a, b)), norm(a) * norm(b))
const onLine = (x: V, p: V, v: V) => parallel(sub(x, p), v)
const inPlane = (x: V, n: V, d: number) => close(dot(n, x), d)
const split = (vals: V, k: number) => {
  const dim = vals.length / k
  return Array.from({ length: k }, (_, c) => vals.slice(c * dim, (c + 1) * dim))
}
const hasChoice = (task: VectorTask) => task.resultLatex!.includes('\\text{')

function check(task: VectorTask, context: string) {
  const d = task.data
  const ans = task.answer
  switch (task.kind) {
    case 'posLines': {
      const { p, v, q, w } = d
      let truth: number
      if (parallel(v, w)) truth = onLine(q, p, v) ? 0 : 1
      else if (p.length === 2) truth = 2
      else truth = close(dot(sub(q, p), crossN(v, w)), 0) ? 2 : 3
      expect(ans, context).toEqual([truth])
      return
    }
    case 'meetLines': {
      const S = ans.slice(-d.p.length)
      expect(parallel(d.v, d.w), context).toBe(false)
      expect(onLine(S, d.p, d.v) && onLine(S, d.q, d.w), context).toBe(true)
      if (d.k) expect(close(d.q[d.k[0]], ans[0]), context).toBe(true)
      return
    }
    case 'posLinePlane': {
      const { n, p, v } = d
      const dd = d.d[0]
      const truth = !close(dot(n, v), 0) ? 2 : inPlane(p, n, dd) ? 0 : 1
      if (!task.resultLatex!.startsWith('a = ')) expect(ans, context).toEqual([truth])
      else {
        expect(truth, context).toBeLessThan(2)
        expect(v.some((x) => close(x, ans[0])), context).toBe(true)
        if (hasChoice(task)) expect(ans[1], context).toBe(truth)
        else {
          expect(truth, context).toBe(0)
          expect(p.some((x) => close(x, ans[1])), context).toBe(true)
        }
      }
      return
    }
    case 'meetLinePlane':
      expect(close(dot(d.n, d.v), 0), context).toBe(false)
      expect(onLine(ans, d.p, d.v) && inPlane(ans, d.n, d.d[0]), context).toBe(true)
      return
    case 'posPlanes': {
      const { n, m } = d
      const [dd, e] = [d.d[0], d.e[0]]
      const truth = !parallel(n, m) ? 2 : parallel([...n, dd], [...m, e]) ? 0 : 1
      if (!task.resultLatex!.startsWith('a = ')) expect(ans, context).toEqual([truth])
      else {
        expect(m.some((x) => close(x, ans[0])), context).toBe(true)
        if (hasChoice(task)) expect(ans[1], context).toBe(truth)
        else {
          expect(truth, context).toBe(0)
          expect(close(ans[1], e), context).toBe(true)
        }
      }
      return
    }
    case 'meetPlanes': {
      const [P, u] = split(ans, 2)
      expect(norm(u), context).toBeGreaterThan(0)
      expect(inPlane(P, d.n, d.d[0]) && inPlane(P, d.m, d.e[0]), context).toBe(true)
      expect(close(dot(u, d.n), 0) && close(dot(u, d.m), 0), context).toBe(true)
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
const cells = LEVELS.map((level) => [level] as const)

describe('Geraden und Ebenen: Baustein lage', () => {
  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `lage ${level}-${task.ref.seed} ${task.form}`
      check(task, context)
      expect(LAGE_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
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
        for (const c of step.choices.filter((c) => !c.correct)) {
          expect(ALL_RULES.some((r) => r.id === c.errorRuleId), `${where}: ${c.errorRuleId}`).toBe(true)
          expectRenderable(c.whyWrong!.detailed, where)
        }
        if (step.drawing) checkDrawing(step.drawing, where)
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
      checkDrawing(task.resultDrawing!, context)
    }
  })

  it('jede Lage kommt vor, und ohne Ergebnis verrät kein Bild die Lage', () => {
    const seen = new Set<string>()
    for (const level of LEVELS)
      for (const task of tasks(level, 150)) {
        if (task.kind.startsWith('pos') && hasChoice(task)) seen.add(`${task.kind}:${task.answer.at(-1)}`)
        if (task.kind.startsWith('pos')) for (const step of task.steps) expect(step.drawing, `${task.form} ${step.id}`).toBeUndefined()
      }
    expect([...seen].sort()).toEqual(['posLinePlane:0', 'posLinePlane:1', 'posLinePlane:2', 'posLines:0', 'posLines:1', 'posLines:2', 'posLines:3', 'posPlanes:0', 'posPlanes:1', 'posPlanes:2'])
  })

  it('Schnittpunkt und Schnittgerade im Bild liegen richtig', () => {
    for (const level of LEVELS)
      for (const task of tasks(level, 80)) {
        const S = task.resultDrawing!.points.find((p) => p.label === 'S')
        if (task.kind === 'meetLines' || task.kind === 'meetLinePlane') expect(S && S.at.every((x, i) => close(x, task.answer.slice(-S.at.length)[i])), task.form).toBe(true)
        if (task.kind === 'meetPlanes') {
          const seg = task.resultDrawing!.segments[0]
          for (const x of [seg.from, seg.to]) expect(Math.abs(dot(task.data.n, x) - task.data.d[0]) < 1e-6 && Math.abs(dot(task.data.m, x) - task.data.e[0]) < 1e-6, task.form).toBe(true)
        }
      }
  })

  it('keine falsche Antwort beschreibt dieselbe Gerade oder dieselbe Zahl wie die richtige', () => {
    let compared = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 100)) {
        for (const step of task.steps) {
          const right = readResult(step.choices.find((c) => c.correct)!.content)
          if (!right) continue
          for (const c of step.choices.filter((c) => !c.correct)) {
            const wrong = readResult(c.content)
            if (!wrong || wrong.length !== right.length) continue
            const same = right.every((r, i) => {
              const w = wrong[i]
              if (w.shape !== r.shape || w.values.length !== r.values.length) return false
              // „-6t + 29 = 1“ liest sich als Zahl mit Namen: andere linke Seite heißt andere Gleichung
              if (r.shape === 'number' && r.label !== w.label) return false
              if (r.shape === 'param') {
                const [p, v] = split(r.values, 2)
                const [q, wv] = split(w.values, 2)
                return norm(wv) > 0 && parallel(v, wv) && onLine(q, p, v)
              }
              if (r.shape === 'equation') return parallel(r.values, w.values)
              return r.values.every((x, j) => close(x, w.values[j]))
            })
            expect(same, `${task.form} ${step.id}: ${c.content}`).toBe(false)
            compared++
          }
        }
      }
    }
    expect(compared).toBeGreaterThan(300)
  })

  it.each(cells)('Stufe %i: mindestens 100 Formen unter 200, keine öfter als 3 %%', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  // Funde der unabhängigen Prüfung
  it('kein Punktname doppelt: der Stützpunkt von h heißt anders als die Punkte von g', () => {
    let checked = 0
    for (const task of tasks(3, 300).filter((t) => t.kind === 'posLines')) {
      const given = new Set([...task.functionLatex!.matchAll(/([A-Z])\(/g)].map((m) => m[1]))
      const probe = task.steps.find((s) => s.id === 'probe' && s.question.startsWith('Liegt der Stützpunkt'))
      if (!probe) continue
      const name = /\$([A-Z])\(/.exec(probe.question)![1]
      expect(given.has(name), task.form).toBe(false)
      checked++
    }
    expect(checked).toBeGreaterThan(30)
  })

  it('Durchstoßpunkt aus der Parameterform ist nicht ihr Stützpunkt (sonst stünde das Ergebnis schon da)', () => {
    const level3 = tasks(3, 200).filter((t) => t.kind === 'meetLinePlane')
    expect(level3.length).toBeGreaterThan(20)
    for (const task of level3) expect(task.answer.every((x, i) => close(x, task.data.P0[i])), task.form).toBe(false)
  })

  it('Punktprobe nach dem Parameter nur mit rechter Seite ungleich 0 (sonst wäre eine falsche Antwort richtig)', () => {
    let checked = 0
    for (const task of tasks(4, 300).filter((t) => t.kind === 'posLinePlane')) {
      expect(task.data.d[0], task.form).not.toBe(0)
      checked++
    }
    expect(checked).toBeGreaterThan(30)
  })

  it('baut dieselbe Aufgabe zur selben Nummer', () => {
    expect(buildVectorTask(ref(5, 42))).toEqual(buildVectorTask(ref(5, 42)))
  })
})

// Zahlen als LaTeX für den freien Modus
const entry = (x: number) => {
  if (Number.isInteger(x)) return String(x)
  for (let den = 2; den <= 400; den++) {
    const num = Math.round(x * den)
    if (Math.abs(num / den - x) < 1e-12) return `${num < 0 ? '-' : ''}\\frac{${Math.abs(num)}}{${den}}`
  }
  return String(x)
}

describe('Lage: freier Modus', () => {
  it('nimmt das Ergebnis an, auch eine andere Gleichung derselben Schnittgeraden', () => {
    let lines = 0
    for (const level of LEVELS)
      for (const task of tasks(level, 40)) {
        const check = prepareVectorCheck(task)
        const input = check.parts.map((p) => (p.shape === 'choice' ? [p.options![p.values[0]]] : p.values.map(entry)))
        expect(checkVectorEntries(check, input).kind, task.form).toBe('correct')
        const i = check.parts.findIndex((p) => p.shape === 'param')
        if (i < 0) continue
        const [p, v] = split(check.parts[i].values, 2)
        const other = [...p.map((x, j) => x - v[j]), ...v.map((x) => 2 * x)]
        expect(checkVectorEntries(check, input.map((row, j) => (j === i ? other.map(entry) : row))).kind, task.form).toBe('correct')
        lines++
      }
    expect(lines).toBeGreaterThan(10)
  })

  it('falsche Lage nennt den typischen Fehler aus der Tabelle', () => {
    const tables: Readonly<Record<string, readonly (readonly string[])[]>> = { posLines: LINE_PAIR_RULES, posLinePlane: LINE_PLANE_RULES, posPlanes: PLANE_PAIR_RULES }
    let checked = 0
    for (const level of LEVELS)
      for (const task of tasks(level, 60).filter((t) => t.kind in tables && hasChoice(t))) {
        const check = prepareVectorCheck(task)
        const i = check.parts.findIndex((p) => p.shape === 'choice')
        const part = check.parts[i]
        const truth = part.values[0]
        for (const [j, option] of part.options!.entries()) {
          if (j === truth) continue
          const input = check.parts.map((p, k) => (k === i ? [option] : p.shape === 'choice' ? [p.options![p.values[0]]] : p.values.map(entry)))
          const verdict = checkVectorEntries(check, input)
          expect(verdict.kind === 'wrong' && verdict.error?.id, task.form).toBe(tables[task.kind][truth][j])
          checked++
        }
      }
    expect(checked).toBeGreaterThan(60)
  })

  it('Schnittpunkt mit dem Parameter der falschen Geraden wird erkannt', () => {
    let found = 0
    for (const level of LEVELS)
      for (const task of tasks(level, 60).filter((t) => t.kind === 'meetLines')) {
        const step = task.steps.find((s) => s.id === 'schnittpunkt')!
        const wrong = step.choices.find((c) => c.errorRuleId === 'gl-meet-wrong-line')!
        const values = readResult(wrong.content)![0].values
        const check = prepareVectorCheck(task)
        const input = check.parts.map((p) => (p.shape === 'point' ? values.map(entry) : p.values.map(entry)))
        const verdict = checkVectorEntries(check, input)
        expect(verdict.kind === 'wrong' && verdict.error?.id, task.form).toBe('gl-meet-wrong-line')
        found++
      }
    expect(found).toBeGreaterThan(20)
  })
})

describe('Lage: Fehler und Lernkarten', () => {
  const NEW_RULES = LINE_ERROR_RULES.slice(33, 50)

  it('nutzt jeden neuen Fehler, und jeder steht auf einer Karte des Ordners', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 150)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    expect(NEW_RULES.length).toBe(17)
    expect(NEW_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
    const shown = new Set(cardsInTopic('geraden').flatMap((c) => c.errors))
    for (const id of used) if (id.startsWith('gl-')) expect(shown.has(id), id).toBe(true)
  })

  it('jede Karte der Aufgaben gibt es, und jedes Beispiel der neuen Karten besteht die Gegenprobe', () => {
    for (const level of LEVELS) for (const task of tasks(level, 40)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(['geraden', 'vektoren'], id).toContain(cardById(id)?.topic)
    let examples = 0
    for (const card of cardsInTopic('geraden').filter((c) => c.id.startsWith('gl-lage'))) {
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        check(task, card.id)
        examples++
      }
    }
    expect(examples).toBe(12)
  })
})
