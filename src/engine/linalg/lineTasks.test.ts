import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { VECTOR_ERROR_RULES } from './errorRules.ts'
import { type VectorDrawing, drawingCoordinates } from './figures.ts'
import { LINE_ERROR_RULES } from './lineErrorRules.ts'
import { LINE_KINDS_BY_LEVEL } from './lineTasks.ts'
import { PLANE_KINDS_BY_LEVEL } from './planeTasks.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 6: Tätigkeit „Geraden und Ebenen" mit den Bausteinen „Geraden" und „Ebenen". Jede Aufgabe wird unabhängig mit
// Kommazahlen nachgerechnet (nicht mit der Engine): Punkte liegen auf der Geraden bzw. in der Ebene, Normalen stehen
// senkrecht, falsche Antworten beschreiben nie dieselbe Gerade oder Ebene, jeder Fehler kommt vor und steht auf einer
// Karte, Abwechslung je Baustein und Stufe, der freie Modus erkennt gleichwertige Formen.

const BLOCKS = ['gerade', 'ebene'] as const
type BlockId = (typeof BLOCKS)[number]
const ref = (block: BlockId, level: Level, s: number) => ({ level, seed: blockSeed(block, s) })
const tasks = (block: BlockId, level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(block, level, i + 1)))
const KINDS: Readonly<Record<BlockId, typeof LINE_KINDS_BY_LEVEL>> = { gerade: LINE_KINDS_BY_LEVEL, ebene: PLANE_KINDS_BY_LEVEL }

type V = readonly number[]
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const dot = (a: V, b: V) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (v: V) => Math.sqrt(dot(v, v))
const sub = (a: V, b: V) => a.map((x, i) => x - b[i])
const add = (a: V, b: V) => a.map((x, i) => x + b[i])
const scale = (k: number, a: V) => a.map((x) => k * x)
const crossN = (a: V, b: V) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
// parallel über den Winkel: |a · b| = |a| |b| (unabhängig von den Unterdeterminanten der Engine)
const parallel = (a: V, b: V) => norm(a) === 0 || norm(b) === 0 || close(Math.abs(dot(a, b)), norm(a) * norm(b))
const onLine = (x: V, p: V, v: V) => parallel(sub(x, p), v)
const sameVec = (a: V, b: V) => a.length === b.length && a.every((x, i) => close(x, b[i]))
const split = (vals: V, k: number) => {
  const dim = vals.length / k
  return Array.from({ length: k }, (_, c) => vals.slice(c * dim, (c + 1) * dim))
}
// Koordinatenform (a, b, c, d) gegen Normale und Punkt
const inPlane = (x: V, n: V, d: number) => close(dot(n, x), d)

function check(task: VectorTask, context: string) {
  const d = task.data
  const ans = task.answer
  switch (task.kind) {
    case 'lineThrough': {
      const [p, v] = split(ans, 2)
      expect(norm(v), context).toBeGreaterThan(0)
      if (d.A) {
        expect(onLine(d.A, p, v) && onLine(d.B, p, v), context).toBe(true)
      } else {
        expect(onLine(d.P, p, v) && parallel(v, d.w), context).toBe(true)
      }
      return
    }
    case 'linePoint':
      expect(onLine(ans, d.p, d.v), context).toBe(true)
      expect(sameVec(ans, add(d.p, scale(d.k[0], d.v))), context).toBe(true)
      return
    case 'lineContains': {
      if (d.P) {
        expect(ans[0], context).toBe(onLine(d.P, d.p, d.v) ? 0 : 1)
        return
      }
      const P = [0, 0, 0]
      P[d.known[0]] = d.known[1]
      P[d.idx[0]] = ans[0]
      P[d.idx[1]] = ans[1]
      expect(onLine(P, d.p, d.v), context).toBe(true)
      return
    }
    case 'lineTrace': {
      const dim = d.p.length
      const pts = split(ans.slice(0, d.zeros.length * dim), d.zeros.length)
      pts.forEach((x, i) => {
        expect(onLine(x, d.p, d.v), context).toBe(true)
        expect(close(x[d.zeros[i]], 0), context).toBe(true)
      })
      if (ans.length > d.zeros.length * dim) expect(close(ans.at(-1)!, norm(sub(pts[1], pts[0]))), context).toBe(true)
      return
    }
    case 'lineDistance': {
      const [q1, q2] = split(ans, 2)
      for (const q of [q1, q2]) {
        expect(onLine(q, d.p, d.v), context).toBe(true)
        expect(close(norm(sub(q, d.p)), d.L[0]), context).toBe(true)
      }
      expect(sameVec(q1, q2), context).toBe(false)
      return
    }
    case 'planeContains':
      expect(ans[0], context).toBe(inPlane(d.P, d.n, d.d[0]) ? 0 : 1)
      return
    case 'planeCoord': {
      if (d.S) {
        const n = ans.slice(0, 3)
        d.S.forEach((x, i) => expect(close(n[i] * x, ans[3]), context).toBe(true))
        return
      }
      const n = crossN(d.u, d.w)
      expect(parallel(n, d.n), context).toBe(true)
      expect(inPlane(d.p, d.n, d.d[0]), context).toBe(true)
      if (ans.length === 4) {
        expect(parallel(ans.slice(0, 3), n), context).toBe(true)
        expect(inPlane(d.p, ans.slice(0, 3), ans[3]), context).toBe(true)
      } else {
        const X = [...d.X]
        X[d.j[0]] = ans[0]
        expect(inPlane(X, d.n, d.d[0]), context).toBe(true)
        expect(close(ans[0], d.X[d.j[0]]), context).toBe(true)
      }
      return
    }
    case 'planeParam': {
      const [p, u, w] = split(ans, 3)
      const n = crossN(u, w)
      expect(norm(n), context).toBeGreaterThan(0)
      const pts = d.A ? [d.A, d.B, d.C] : [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? 1 : 0)))
      if (d.A) for (const x of pts) expect(close(dot(n, sub(x, p)), 0), context).toBe(true)
      else for (const [r, s] of [[0, 0], [1.3, -0.7], [-2.1, 4.2]]) expect(inPlane(add(add(p, scale(r, u)), scale(s, w)), d.n, d.d[0]), context).toBe(true)
      return
    }
    case 'planeHesse': {
      const n0 = ans.slice(0, 3)
      expect(close(norm(n0), 1), context).toBe(true)
      expect(ans[3], context).toBeGreaterThanOrEqual(0)
      expect(parallel(n0, d.n), context).toBe(true)
      expect(inPlane(d.p, n0, ans[3]), context).toBe(true)
      // Abstand des Ursprungs: |d| / |n|
      expect(close(ans[3], Math.abs(d.d[0]) / norm(d.n)), context).toBe(true)
      return
    }
    case 'planeTraces': {
      const pts = split(ans, 3)
      pts.forEach((x, i) => {
        expect(inPlane(x, d.n, d.d[0]), context).toBe(true)
        x.forEach((c, j) => expect(j === i || c === 0, context).toBe(true))
      })
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

describe.each(BLOCKS)('Geraden und Ebenen: Baustein %s', (block) => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(block, level, 120)) {
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

  it('keine falsche Antwort beschreibt dieselbe Gerade, Ebene oder Zahl wie die richtige', () => {
    let compared = 0
    for (const level of LEVELS) {
      for (const task of tasks(block, level, 100)) {
        for (const step of task.steps) {
          const right = readResult(step.choices.find((c) => c.correct)!.content)
          if (!right) continue
          for (const c of step.choices.filter((c) => !c.correct)) {
            const wrong = readResult(c.content)
            if (!wrong || wrong.length !== right.length) continue
            const same = right.every((r, i) => {
              const w = wrong[i]
              if (w.shape !== r.shape || w.values.length !== r.values.length) return false
              if (r.shape === 'param') {
                const k = (r.params?.length ?? 0) + 1
                const [p, ...dirs] = split(r.values, k)
                const [q, ...wd] = split(w.values, k)
                if (k === 2) return parallel(dirs[0], wd[0]) && onLine(q, p, dirs[0])
                const n = crossN(dirs[0], dirs[1])
                const m = crossN(wd[0], wd[1])
                return norm(m) > 0 && parallel(n, m) && close(dot(n, sub(q, p)), 0)
              }
              // Koordinatenform: Vielfaches; Hessesche Normalform nur genau gleich
              if (r.shape === 'equation' && task.kind !== 'planeHesse') return parallel(r.values, w.values)
              return sameVec(r.values, w.values)
            })
            expect(same, `${task.form} ${step.id}: ${c.content}`).toBe(false)
            compared++
          }
        }
      }
    }
    expect(compared).toBeGreaterThan(400)
  })

  it.each(cells)('Stufe %i: mindestens 100 Formen unter 200, keine öfter als 3 %%', (level) => {
    const stats = varietyStats(tasks(block, level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('baut dieselbe Aufgabe zur selben Nummer', () => {
    expect(buildVectorTask(ref(block, 5, 42))).toEqual(buildVectorTask(ref(block, 5, 42)))
  })
})

describe('Geraden und Ebenen: Funde der Prüfung', () => {
  it('Hessesche Normalform: die Form als Bruch beschreibt dieselbe Ebene', () => {
    let fractions = 0
    for (const level of LEVELS)
      for (const task of tasks('ebene', level, 120).filter((t) => t.kind === 'planeHesse')) {
        const step = task.steps.find((s) => s.id === 'hesse')!
        const lines = (step.established as readonly string[]).filter((l) => l.includes('\\frac{') && l.endsWith('= 0'))
        expect(lines.length, task.form).toBe(1)
        const part = readResult(lines[0])![0]
        expect(parallel(part.values, task.answer), `${task.form}: ${lines[0]}`).toBe(true)
        // gleiche Richtung: rechts d ≥ 0 wie im Ergebnis
        expect(dot(part.values, task.answer), task.form).toBeGreaterThan(0)
        fractions++
      }
    expect(fractions).toBeGreaterThan(80)
  })

  it('Punktprobe in der Ebene nur mit rechter Seite ungleich 0 (sonst wäre eine falsche Antwort richtig)', () => {
    for (const level of LEVELS) for (const task of tasks('ebene', level, 200).filter((t) => t.kind === 'planeContains')) expect(task.data.d[0], task.form).not.toBe(0)
  })

  it('freier Modus: falsche Ebene ohne passenden Fehler wird nicht als „zweimal dieselbe Richtung“ gemeldet; Hesse durch das Quadrat geteilt wird erkannt', () => {
    let planes = 0
    let squares = 0
    for (const level of LEVELS) {
      for (const task of tasks('ebene', level, 120)) {
        const check = prepareVectorCheck(task)
        if (task.kind === 'planeParam') {
          const p = split(task.answer, 3)[0]
          const n = crossN(split(task.answer, 3)[1], split(task.answer, 3)[2])
          if (parallel(n, [0, 0, 1])) continue
          const verdict = checkVectorEntries(check, [[...p, 1, 0, 0, 0, 1, 0].map(entry)])
          expect(verdict.kind, task.form).toBe('wrong')
          expect(verdict.kind === 'wrong' && verdict.error?.id, task.form).not.toBe('gl-same-direction')
          planes++
        }
        if (task.kind === 'planeHesse') {
          const L = norm(task.data.n)
          const verdict = checkVectorEntries(check, [task.answer.map((x) => entry(x / L))])
          expect(verdict.kind === 'wrong' && verdict.error?.id, task.form).toBe('gl-hesse-square')
          squares++
        }
      }
    }
    expect(planes).toBeGreaterThan(20)
    expect(squares).toBeGreaterThan(40)
  })
})

describe('Geraden und Ebenen: Fehler und Lernkarten', () => {
  it('nutzt jeden neuen Fehler, und jeder steht auf einer Karte des Ordners', () => {
    const used = new Set<string>()
    for (const block of BLOCKS) for (const level of LEVELS) for (const task of tasks(block, level, 150)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    // die ersten 33 gehören zu Schritt 6, die übrigen zur Lage (posTasks.test.ts)
    expect(LINE_ERROR_RULES.length).toBe(50)
    expect(LINE_ERROR_RULES.slice(0, 33).map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
    const shown = new Set(cardsInTopic('geraden').flatMap((c) => c.errors))
    for (const rule of LINE_ERROR_RULES) expect(shown.has(rule.id), rule.id).toBe(true)
  })

  it('jede Karte der Aufgaben gibt es, und jedes Beispiel ist eine Aufgabe der genannten Art, die die Gegenprobe besteht', () => {
    for (const block of BLOCKS)
      for (const level of LEVELS)
        for (const task of tasks(block, level, 40)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(['geraden', 'vektoren'], id).toContain(cardById(id)?.topic)
    let examples = 0
    for (const card of cardsInTopic('geraden').filter((c) => !c.id.startsWith('gl-lage'))) {
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        expect(task.resultDrawing, card.id).toBeDefined()
        check(task, card.id)
        examples++
      }
    }
    expect(examples).toBe(19)
  })
})

// Zahlen als LaTeX für den freien Modus (Brüche exakt genug für den Vergleich)
const entry = (x: number) => {
  if (Number.isInteger(x)) return String(x)
  for (let den = 2; den <= 400; den++) {
    const num = Math.round(x * den)
    if (Math.abs(num / den - x) < 1e-12) return `${num < 0 ? '-' : ''}\\frac{${Math.abs(num)}}{${den}}`
  }
  return String(x)
}

describe('Geraden und Ebenen: freier Modus', () => {
  it('nimmt das Ergebnis und gleichwertige Formen an (andere Stützpunkte, Vielfache), bei Hesse nur genau diese', () => {
    let forms = 0
    for (const block of BLOCKS) {
      for (const level of LEVELS) {
        for (const task of tasks(block, level, 40)) {
          const context = `${task.form}`
          const check = prepareVectorCheck(task)
          const input = check.parts.map((p) => (p.shape === 'choice' ? [p.options![p.values[0]]] : p.values.map(entry)))
          expect(checkVectorEntries(check, input).kind, context).toBe('correct')
          const i = check.parts.findIndex((p) => p.shape === 'param' || p.shape === 'equation')
          if (i < 0) continue
          const part = check.parts[i]
          let other: number[]
          // Koordinatenform: Vielfaches; Hesse: nur das Vorzeichen gedreht
          if (part.shape === 'equation') other = part.values.map((x) => (task.kind === 'planeHesse' ? -x : -2 * x))
          else {
            const k = (part.params?.length ?? 0) + 1
            const cols = split(part.values, k)
            // Stützpunkt um eine Richtung verschoben, Richtungen vervielfacht bzw. gemischt
            const p2 = add(cols[0], scale(2, cols[1]))
            const dirs = k === 2 ? [scale(-3, cols[1])] : [add(cols[1], cols[2]), scale(2, cols[2])]
            other = [...p2, ...dirs.flat()]
          }
          const changed = input.map((row, j) => (j === i ? other.map(entry) : row))
          const verdict = checkVectorEntries(check, changed)
          if (task.kind === 'planeHesse') {
            expect(verdict.kind, context).toBe('wrong')
            expect(verdict.kind === 'wrong' && verdict.error?.id, context).toBe('gl-hesse-d-sign')
          } else expect(verdict.kind, `${context}: ${changed[i].join(', ')}`).toBe('correct')
          forms++
        }
      }
    }
    expect(forms).toBeGreaterThan(80)
  })

  it('erkennt typische Fehler und markiert die falsche Spalte', () => {
    let found = 0
    for (const level of LEVELS) {
      for (const task of tasks('gerade', level, 60).filter((t) => t.kind === 'lineThrough')) {
        const check = prepareVectorCheck(task)
        const [p] = split(check.parts[0].values, 2)
        // Ortsvektor von B statt AB als Richtung: Stützpunkt richtig, Richtung falsch markiert
        if (!task.data.B) continue
        const verdict = checkVectorEntries(check, [[...p, ...task.data.B].map(entry)])
        expect(verdict.kind, task.form).toBe('wrong')
        expect(verdict.marks![0].slice(0, p.length).some(Boolean), task.form).toBe(false)
        expect(verdict.marks![0].slice(p.length).every(Boolean), task.form).toBe(true)
        if (verdict.kind === 'wrong' && verdict.error?.id === 'gl-position-direction') found++
      }
    }
    expect(found).toBeGreaterThan(5)
  })
})

