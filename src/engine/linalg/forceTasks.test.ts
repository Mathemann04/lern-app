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
import { type VectorDrawing, anglePath, drawingCoordinates } from './figures.ts'
import { FORCE_KINDS_BY_LEVEL } from './forceTasks.ts'
import { readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 3b: Baustein „Kräfte". Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet (Winkelfunktionen aus
// Math, nicht aus der Engine), jede falsche Antwort stammt aus dem Katalog und ist nicht so viel wert wie die richtige,
// Bilder lassen sich zeichnen, Abwechslung wie überall.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('kraefte', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const rad = (d: number) => (d * Math.PI) / 180
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (v: readonly number[]) => Math.sqrt(dot(v, v))
const sub = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x - b[i])
const polar = (F: number, deg: number) => [F * Math.cos(rad(deg)), F * Math.sin(rad(deg))]
// Winkel ab der positiven x-Achse zwischen 0° und 360°
const angleOf = (v: readonly number[]) => ((Math.atan2(v[1], v[0]) * 180) / Math.PI + 360) % 360
const moment = (r: readonly number[], F: readonly number[]) => r[0] * F[1] - r[1] * F[0]
const expectClose = (a: number, b: number, context: string) => expect(close(a, b), `${context}: ${a} gegen ${b}`).toBe(true)

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null|Infinity/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind === 'math') expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
  }
}

// Unabhängige Gegenprobe je Art aus den gegebenen Größen
function check(task: VectorTask, context: string) {
  const d = task.data
  const ans = task.answer
  switch (task.kind) {
    case 'forceComponents': {
      const alpha = d.fromY[0] ? 90 - d.angle[0] : d.angle[0]
      const [x, y] = polar(d.F[0], alpha)
      expectClose(ans[0], x, context)
      expectClose(ans[1], y, context)
      return
    }
    case 'forcePolar':
      expectClose(ans[0], Math.hypot(d.Fx[0], d.Fy[0]), context)
      expectClose(ans[1], angleOf([d.Fx[0], d.Fy[0]]), context)
      expect(ans[1] >= 0 && ans[1] < 360, context).toBe(true)
      return
    case 'resultant': {
      let sum = [0, 0]
      for (const [key, v] of Object.entries(d)) {
        if (/^c\d$/.test(key)) sum = [sum[0] + v[0], sum[1] + v[1]]
        if (/^p\d$/.test(key)) {
          const f = polar(v[0], v[1])
          sum = [sum[0] + f[0], sum[1] + f[1]]
        }
      }
      const target = d.eq[0] ? [-sum[0], -sum[1]] : sum
      expectClose(ans[0], norm(target), context)
      expectClose(ans[1], angleOf(target), context)
      return
    }
    case 'incline': {
      const G = d.G[0]
      const alpha = d.alpha ? rad(d.alpha[0]) : Math.atan(Math.abs(d.d[1] / d.d[0]))
      if (d.hold) {
        // waagrechte Haltekraft F, Normalkraft N: Gleichgewicht als Vektoren nachrechnen
        const F = ans[0]
        const N = ans[1]
        expectClose(F * Math.cos(alpha), G * Math.sin(alpha), context)
        expectClose(N, G * Math.cos(alpha) + F * Math.sin(alpha), context)
      } else {
        expectClose(ans[0], G * Math.sin(alpha), context)
        expectClose(ans[1], G * Math.cos(alpha), context)
      }
      return
    }
    case 'work': {
      if (d.W && d.Fm && d.s) {
        expectClose(ans[0], (Math.acos(d.W[0] / (d.Fm[0] * d.s[0])) * 180) / Math.PI, context)
      } else if (d.W && d.Fm && d.phi) {
        expectClose(ans[0], d.W[0] / (d.Fm[0] * Math.cos(rad(d.phi[0]))), context)
      } else if (d.Fm) {
        expectClose(ans[0], d.Fm[0] * d.s[0] * Math.cos(rad(d.phi[0])), context)
      } else if (d.base) {
        const F2 = d.base.map((x, j) => (j === d.i[0] ? x + d.c[0] * ans[0] : x))
        const FR = d.F1.map((x, j) => x + F2[j])
        expectClose(dot(FR, sub(d.B, d.A)), d.W[0], context)
      } else if (d.A) {
        expectClose(ans[0], dot(d.F, sub(d.B, d.A)), context)
      } else {
        expectClose(ans[0], dot(d.F, d.s), context)
      }
      return
    }
    case 'torque': {
      let M = 0
      for (let i = 1; d[`P${i}`]; i++) M += moment(sub(d[`P${i}`], d.A), d[`F${i}`])
      if (d.e) {
        expect(ans[0], context).toBeGreaterThan(0)
        expectClose(M + moment(sub(d.B, d.A), d.e.map((x) => x * ans[0])), 0, context)
      } else {
        expectClose(ans[0], M, context)
      }
      return
    }
    case 'knot': {
      const eA = sub(d.A, d.K).map((x, _, v) => x / norm(v))
      const eB = sub(d.B, d.K).map((x, _, v) => x / norm(v))
      const [SA, SB] = ans
      expect(SA > 0 && SB > 0, context).toBe(true)
      expectClose(SA * eA[0] + SB * eB[0], 0, context)
      expectClose(SA * eA[1] + SB * eB[1], d.G[0], context)
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
  }
  expectRenderable(drawing.caption, context)
  for (const a of drawing.arrows) {
    expect(norm(sub(a.to, a.from)), `${context}: Pfeil ${a.label}`).toBeGreaterThan(0)
    if (a.label) expect(latexProblem(a.label, { checkUgly: false }), `${context}: ${a.label}`).toBeNull()
  }
}

describe('Vektoren: Kräfte', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      check(task, context)
      expect(FORCE_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
      // das Ergebnis lässt sich im freien Modus lesen und hat die Werte der Gegenprobe
      const parts = readResult(task.resultLatex!)
      expect(parts, `${context}: ${task.resultLatex}`).not.toBeNull()
      const values = parts!.flatMap((p) => p.values)
      expect(values.length, context).toBe(task.answer.length)
      for (const [i, v] of values.entries()) expectClose(v, task.answer[i], `${context}: ${i}`)
      for (const step of task.steps) {
        const where = `${context} ${step.id}`
        expect(step.choices.length, where).toBeGreaterThanOrEqual(3)
        expect(step.choices.filter((c) => c.correct).length, where).toBe(1)
        expect(new Set(step.choices.map((c) => c.content)).size, where).toBe(step.choices.length)
        for (const text of [step.title, step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) expectRenderable(text, where)
        for (const line of step.established ?? []) expect(latexProblem(line, { checkUgly: false }), `${where}: ${line}`).toBeNull()
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

  // Regel aus CLAUDE.md: falsche Antworten nie gleichwertig zur Lösung (Zahlen, Vektoren, Paare nach Wert); Gleichungen
  // mit Parameter: an vielen Stellen links minus rechts, kein Vielfaches der richtigen
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
              const ratios = [0.37, 1.91, -2.63, -7.41, 5.3, -12.7, 9.7, 17.3].map((x) => g(x) / f(x))
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
    expect(compared).toBeGreaterThan(3000)
    expect(equations).toBeGreaterThan(20)
  })

  // Fund der Prüfung: Kraft und Weg parallel gaben einen Winkelbogen aus NaN
  it('alle Bilder lassen sich zeichnen, auch bei vielen Nummern', () => {
    for (const level of LEVELS)
      for (let i = 1; i <= 1500; i++) {
        const task = buildVectorTask(ref(level, i))
        for (const d of [...task.steps.map((s) => s.drawing), task.resultDrawing])
          for (const a of d?.angles ?? []) for (const p of anglePath(a, 0.5).points) for (const x of p) expect(Number.isFinite(x), task.form).toBe(true)
      }
  })

  // Regel aus CLAUDE.md: „Warum ist das falsch?" verrät nicht das Ergebnis des Schritts
  it('kein Text zu einer falschen Antwort enthält die richtige Antwort', () => {
    for (const level of LEVELS)
      for (const task of tasks(level, 200))
        for (const step of task.steps) {
          const correct = step.choices.find((c) => c.correct)!.content.replace(/^\$|\$$/g, '')
          for (const c of step.choices.filter((c) => !c.correct))
            for (const text of [c.whyWrong!.detailed, c.whyWrong!.short]) expect(text.includes(correct), `${task.form} ${step.id}: ${c.errorRuleId}`).toBe(false)
        }
  })

  it('Winkel im Bild: über 180° läuft der Bogen gegen den Uhrzeigersinn über die andere Seite', () => {
    const a = { at: [0, 0], u: [1, 0], v: [1, -1], color: 'r' as const, ccw: true as const }
    const path = anglePath(a, 1).points
    // der Bogen geht über oben links unten: Ein Punkt liegt bei (−1, 0)
    expect(path.some((p) => Math.abs(p[0] + 1) < 0.05 && Math.abs(p[1]) < 0.1)).toBe(true)
    expect(close(path.at(-1)![0], Math.SQRT1_2) && close(path.at(-1)![1], -Math.SQRT1_2)).toBe(true)
  })

  it('nutzt jeden neuen Fehler des Schritts 3b', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 200)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    const fresh = VECTOR_ERROR_RULES.map((r) => r.id).filter((id) => /^vec-(force|incline|work|torque|knot)-/.test(id))
    expect(fresh.length).toBe(26)
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

describe('Vektoren: Lernkarten zu Kräften', () => {
  it('jedes Beispiel ist eine Aufgabe der genannten Art mit Bild, die Gegenprobe stimmt', () => {
    const kinds = new Set(Object.values(FORCE_KINDS_BY_LEVEL).flat())
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
    expect(examples).toBeGreaterThanOrEqual(10)
  })
})
