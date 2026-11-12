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
import { type VectorDrawing, anglePath, drawingCoordinates, withMistake } from './figures.ts'
import { PROJ_KINDS_BY_LEVEL } from './projTasks.ts'
import { readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 3a: Baustein „Projektion und Zerlegung". Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet (nicht
// mit der Engine), jede falsche Antwort stammt aus dem Katalog und ist nicht so viel wert wie die richtige, Bilder passen
// zur Aufgabe (Spitze des Schattens = Ergebnis, rechter Winkel am Lotfußpunkt, Lot senkrecht), Abwechslung wie überall.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('projektion', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (v: readonly number[]) => Math.sqrt(dot(v, v))
const sub = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x - b[i])
const add = (a: readonly number[], b: readonly number[]) => a.map((x, i) => x + b[i])
const scale = (k: number, a: readonly number[]) => a.map((x) => k * x)
// Schatten von a auf b, mit Kommazahlen
const shadow = (a: readonly number[], b: readonly number[]) => scale(dot(a, b) / dot(b, b), b)
const sameVec = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => close(x, b[i]))

// Formel lässt sich setzen und ist sauber (Fund der Prüfung): kein Faktor 1 vor einem Vektor oder Betrag, kein Zähler 0,
// kein „+ -“ oder „- -“. Das Skalarprodukt Eintrag für Eintrag (2 \cdot 1 + …) darf eine 1 enthalten.
const UGLY: readonly RegExp[] = [/(?<![\d.,}])(?:\(-1\)|-?1) \\cdot \\(?:begin|lvert|vec)/, /\\frac\{0\}/, /\+ -/, /- -|--/, /\(-?1\)\\,\\vec|(?<![\d.,}{])1\\,\\vec/]
function nice(latex: string): string | null {
  const problem = latexProblem(latex, { checkUgly: false })
  if (problem) return problem
  const ugly = UGLY.find((re) => re.test(latex))
  return ugly ? `unschön (${ugly.source}) in ${latex}` : null
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
    case 'projection':
      expect(sameVec(ans, shadow(d.a, d.b)), context).toBe(true)
      return
    case 'decompose': {
      const n = d.a.length
      const par = ans.slice(0, n)
      const perp = ans.slice(n, 2 * n)
      expect(sameVec(par, shadow(d.a, d.b)), context).toBe(true)
      expect(sameVec(add(par, perp), d.a), context).toBe(true)
      expect(close(dot(perp, d.b), 0), context).toBe(true)
      // parallel: par ist ein Vielfaches von b
      expect(close(Math.abs(dot(par, d.b)), norm(par) * norm(d.b)), context).toBe(true)
      if (ans.length > 2 * n) expect(close(ans[2 * n], norm(perp)), context).toBe(true)
      return
    }
    case 'shadowLength':
      expect(close(ans[0], Math.abs(dot(d.a, d.b)) / norm(d.b)), context).toBe(true)
      expect(close(ans[0], norm(shadow(d.a, d.b))), context).toBe(true)
      return
    case 'foot': {
      const n = d.A.length
      const f = ans.slice(0, n)
      // F liegt auf der Geraden und FP steht senkrecht auf v; F ist der Punkt der Geraden, der P am nächsten ist
      const t = dot(sub(f, d.A), d.v) / dot(d.v, d.v)
      expect(sameVec(f, add(d.A, scale(t, d.v))), context).toBe(true)
      expect(close(dot(sub(d.P, f), d.v), 0), context).toBe(true)
      for (const dt of [-0.3, 0.2]) expect(norm(sub(d.P, add(f, scale(dt, d.v)))) > norm(sub(d.P, f)), context).toBe(true)
      if (ans.length > n) expect(close(ans[n], norm(sub(d.P, f))), context).toBe(true)
      return
    }
    case 'projParam': {
      const at = (t: number) => d.p.map((x, j) => (j === d.i[0] ? x + d.s[0] * t : x))
      if (d.c) {
        expect(ans.length, context).toBe(1)
        expect(sameVec(shadow(at(ans[0]), d.b), d.c), context).toBe(true)
      } else {
        expect(ans.length, context).toBe(2)
        expect(ans[0], context).toBeLessThan(ans[1])
        for (const t of ans) expect(close(norm(shadow(at(t), d.b)), d.L[0]), `${context}: t = ${t}`).toBe(true)
        // keine weiteren Lösungen: die Länge des Schattens ist |linear in t| / |b|, also höchstens zwei
      }
      return
    }
    case 'spanProjection': {
      const n = d.a.length
      const aE = ans.slice(0, n)
      expect(close(dot(d.b, d.c), 0), context).toBe(true)
      const rest = sub(d.a, aE)
      // Rest senkrecht auf beiden, aE in der Ebene (Summe der Schatten, weil b ⊥ c)
      expect(close(dot(rest, d.b), 0) && close(dot(rest, d.c), 0), context).toBe(true)
      expect(sameVec(aE, add(shadow(d.a, d.b), shadow(d.a, d.c))), context).toBe(true)
      expect(close(ans[n], norm(rest)), context).toBe(true)
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
  if (drawing.mistake) expectRenderable(withMistake(drawing).caption, context)
  for (const a of drawing.arrows) if (a.label) expect(latexProblem(a.label, { checkUgly: false }), `${context}: ${a.label}`).toBeNull()
}

describe('Vektoren: Projektion und Zerlegung', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      check(task, context)
      expect(PROJ_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(nice(task.resultLatex!), context).toBeNull()
      // das Ergebnis lässt sich im freien Modus lesen und hat die Werte der Gegenprobe
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
      if (task.resultDrawing) checkDrawing(task.resultDrawing, context)
    }
  })

  it('Stufe 1 in der Ebene, Stufe 2 im Raum, jeweils mit Bild; vier und fünf Dimensionen ohne Bild mit Hinweis', () => {
    for (const task of tasks(1, 60)) expect(task.resultDrawing?.dim, task.form).toBe(2)
    for (const task of tasks(2, 60)) expect(task.resultDrawing?.dim, task.form).toBe(task.kind === 'foot' ? 2 : 3)
    for (const level of [4, 5] as const)
      for (const task of tasks(level, 60)) if (task.data.a?.length > 3) expect(task.resultDrawing === undefined && !!task.note, task.form).toBe(true)
  })

  it('Bild zum Ergebnis: Spitze des Schattens bzw. Lotfußpunkt wie im Ergebnis, Lot senkrecht, rechter Winkel', () => {
    let pictures = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 80)) {
        const d = task.resultDrawing
        if (!d) continue
        const r = d.arrows.find((a) => a.color === 'r')!
        expect(r.phase, task.form).toBeGreaterThan(0)
        expect(d.playLabel, task.form).toBe('Licht an')
        if (task.kind === 'projection' || task.kind === 'decompose') expect(sameVec(r.to, task.answer.slice(0, d.dim)), task.form).toBe(true)
        if (task.kind === 'foot') {
          expect(sameVec(r.to, task.answer.slice(0, d.dim)), task.form).toBe(true)
          expect(close(dot(sub(task.data.P, r.to), task.data.v), 0), task.form).toBe(true)
        }
        for (const a of d.angles ?? []) expect(close(dot(a.u, a.v), 0), task.form).toBe(true)
        // der typische Fehler ist ein anderer Schatten auf derselben Geraden
        if (d.mistake) {
          const bad = d.mistake.arrows[0]
          expect(bad.color, task.form).toBe('bad')
          expect(sameVec(bad.to, r.to), task.form).toBe(false)
          expect(close(Math.abs(dot(sub(bad.to, r.from), sub(r.to, r.from))), norm(sub(bad.to, r.from)) * norm(sub(r.to, r.from))), task.form).toBe(true)
        }
        pictures++
      }
    }
    expect(pictures).toBeGreaterThan(250)
  })

  it('vor dem Ergebnis verrät kein Bild den Schatten', () => {
    for (const level of LEVELS)
      for (const task of tasks(level, 80))
        for (const step of task.steps) if (step.drawing) expect(step.drawing.arrows.some((a) => a.color === 'r') || !!step.drawing.mistake, task.form).toBe(false)
  })

  // Regel aus CLAUDE.md: falsche Antworten nie gleichwertig zur Lösung. Zahlen, Vektoren, Punkte und Lösungen nach Wert;
  // Gleichungen mit Parameter (auch mit Betrag): an drei Stellen links minus rechts, kein Vielfaches der richtigen
  it('keine falsche Antwort ist so viel wert wie die richtige', () => {
    const values = (content: string) => readResult(content)?.flatMap((p) => p.values) ?? null
    const equation = (content: string) => {
      // Betrag als Wurzel aus dem Quadrat (der Leser der Eingabe kennt keine Betragsstriche)
      const body = content.replace(/^\$|\$$/g, '').replace(/\\left\\lvert (.*) \\right\\rvert/, '\\sqrt{\\left($1\\right)^2}')
      const sides = body.split(' = ')
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
              const ratios = [0.37, 1.91, -2.63, -7.41, 5.3, -12.7, 9.7, 17.3, -23.1, 31.9, 47.3, -51.7, 83.1, -97.3].map((x) => g(x) / f(x))
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

  it('nutzt jeden neuen Fehler des Schritts 3a', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 200)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    const fresh = VECTOR_ERROR_RULES.map((r) => r.id).filter((id) => /^vec-(proj|rest|shadow|foot|dist|span)-/.test(id))
    expect(fresh.length).toBe(15)
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

describe('Vektoren: Lernkarten zur Projektion', () => {
  it('jedes Beispiel ist eine Aufgabe der genannten Art mit Bild, die Gegenprobe stimmt', () => {
    const kinds = new Set(Object.values(PROJ_KINDS_BY_LEVEL).flat())
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
    expect(examples).toBe(8)
  })
})
