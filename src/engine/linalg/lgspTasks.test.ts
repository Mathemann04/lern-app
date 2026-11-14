import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { evaluate } from '../expr/evaluate.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { parseLatex } from '../parse/latex.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { CRAMER_ERROR_RULES } from './cramerErrorRules.ts'
import { DET_ERROR_RULES } from './detErrorRules.ts'
import { GAUSS_ERROR_RULES } from './gaussErrorRules.ts'
import { LGSP_ERROR_RULES } from './lgspErrorRules.ts'
import { LGSP_CARD, LGSP_KINDS_BY_LEVEL } from './lgspTasks.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 11b: Baustein „Gleichungssysteme mit Parameter“. Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet
// (eigener Rang mit Spaltenpivot, nicht die Engine): Für jede ganze Zahl a von −30 bis 30 (und b von −20 bis 20) wird der
// Fall bestimmt; genau die angegebenen Werte haben den gefragten Fall bzw. den gefragten Wert der Unbekannten. Jede Tabelle
// im Rechenweg ist gleichwertig zur Aufgabe, jede falsche nicht; Bedingung und Ränge stimmen; Abwechslung; Fehler und
// Karten; freier Modus.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('lgsparam', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

type N = number[][]
const EPS = 1e-9
const close = (a: number, b: number) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a), Math.abs(b))

// Rang mit Spaltenpivot (relative Schranke)
function rank(rows: N): number {
  const M = rows.map((r) => [...r])
  const w = M[0]?.length ?? 0
  const scale = Math.max(1, ...M.flat().map(Math.abs))
  let r = 0
  for (let c = 0; c < w && r < M.length; c++) {
    let p = r
    for (let i = r + 1; i < M.length; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    if (Math.abs(M[p][c]) < 1e-9 * scale) continue
    ;[M[p], M[r]] = [M[r], M[p]]
    for (let i = r + 1; i < M.length; i++) {
      const f = M[i][c] / M[r][c]
      M[i] = M[i].map((x, k) => x - f * M[r][k])
    }
    r++
  }
  return r
}
// Lösung bei vollem Rang
function solve(T: N): number[] {
  const n = T.length
  const M = T.map((r) => [...r])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    ;[M[p], M[c]] = [M[c], M[p]]
    for (let i = c + 1; i < n; i++) {
      const f = M[i][c] / M[c][c]
      M[i] = M[i].map((x, k) => x - f * M[c][k])
    }
  }
  const x = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) x[i] = (M[i][n] - x.reduce((s, v, j) => (j > i ? s + M[i][j] * v : s), 0)) / M[i][i]
  return x
}
type Kase = 'unique' | 'none' | 'inf'
function kaseOf(T: N): Kase {
  const n = T[0].length - 1
  const ra = rank(T.map((r) => r.slice(0, n)))
  const rb = rank(T)
  return ra < rb ? 'none' : ra === n ? 'unique' : 'inf'
}
const KASES: readonly Kase[] = ['unique', 'none', 'inf']

// Tabelle der Aufgabe als Zahlen (Einträge c0 + c1·a + c2·a² + cb·b)
function system(task: VectorTask) {
  const n = task.data.n[0]
  const w = n + 1
  const { T0, T1, T2, TB } = task.data
  const at = (a: number, b = 0): N => Array.from({ length: n }, (_, i) => Array.from({ length: w }, (_, j) => T0[i * w + j] + T1[i * w + j] * a + T2[i * w + j] * a * a + TB[i * w + j] * b))
  return { n, at }
}

const valueOf = (latex: string, vars: Record<string, number>) => {
  const r = parseLatex(latex)
  if (!r.ok) throw new Error(latex)
  return evaluate(r.expr, vars)
}
// Tabelle aus LaTeX: Zeilen nach \hline, Zeilenname weg, Umformungen rechts weg
function readTable(latex: string, n: number, vars: Record<string, number>): N {
  const body = latex.slice(latex.indexOf('\\hline') + 6, latex.indexOf('\\end{array}'))
  return body.split('\\\\').map((row) => row.split('&').slice(1, n + 2).map((x) => valueOf(x.trim(), vars)))
}
const tableIn = (text: string) => /\\begin\{array\}\{c\|[^$]*\\end\{array\}/.exec(text)![0]
// gleichwertig: gleicher Zeilenraum der erweiterten Matrix
const sameSystem = (A: N, B: N) => rank(A) === rank(B) && rank([...A, ...B]) === rank(A)

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null|\+ -|- -/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind !== 'math') continue
    expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
    expect(segment.latex.replace(/\\text\{[^}]*\}/g, ''), `${context}: ${segment.latex}`).not.toMatch(/\b(oder|und|für|genau|kein|jedes)\b/)
  }
}

// unabhängige Gegenprobe des Ergebnisses
function verify(task: VectorTask, context: string) {
  const { n, at } = system(task)
  const ints = Array.from({ length: 61 }, (_, i) => i - 30)
  switch (task.kind) {
    case 'lgspRhs': {
      const found: number[][] = []
      for (let a = -15; a <= 15; a++) for (let b = -20; b <= 20; b++) if (kaseOf(at(a, b)) === 'inf') found.push([a, b])
      expect(found, context).toEqual([task.answer])
      return
    }
    case 'lgspTarget': {
      const k = task.data.k[0]
      const c = task.data.c[0]
      const good = ints.filter((a) => kaseOf(at(a)) === 'unique' && close(solve(at(a))[k], c))
      expect([...task.answer], context).toEqual(good)
      return
    }
    case 'lgspFull': {
      const r = task.data.inf[0]
      expect(ints.filter((a) => kaseOf(at(a)) === 'inf'), context).toEqual([r])
      expect(ints.filter((a) => kaseOf(at(a)) === 'none').length, context).toBe(1)
      const T = at(r)
      const p = task.answer.slice(0, n)
      const d = task.answer.slice(n)
      expect(d.some((x) => x !== 0), context).toBe(true)
      for (const row of T) {
        expect(close(row.slice(0, n).reduce((s, x, j) => s + x * p[j], 0), row[n]), context).toBe(true)
        expect(close(row.slice(0, n).reduce((s, x, j) => s + x * d[j], 0), 0), context).toBe(true)
      }
      expect(rank(T.map((row) => row.slice(0, n))), context).toBe(n - 1)
      return
    }
    default: {
      const ask = KASES[task.data.ask[0]]
      const good = ints.filter((a) => kaseOf(at(a)) === ask)
      expect([...task.answer], context).toEqual(good)
      expect(good.length, context).toBeGreaterThan(0)
    }
  }
}

describe('Gleichungssysteme mit Parameter', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 120)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      expect(LGSP_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      verify(task, context)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
      const parts = readResult(task.resultLatex!)
      expect(parts, context).not.toBeNull()
      expect(parts!.flatMap((p) => p.values), context).toEqual([...task.answer])
      expect(new Set(task.steps.map((s) => s.id)).size, context).toBe(task.steps.length)
      for (const step of task.steps) {
        const where = `${context} ${step.id}`
        expect(step.choices.length, where).toBe(4)
        expect(step.choices.filter((c) => c.correct).length, where).toBe(1)
        expect(new Set(step.choices.map((c) => c.content)).size, where).toBe(step.choices.length)
        for (const text of [step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) expectRenderable(text, where)
        for (const c of step.choices.filter((x) => !x.correct)) {
          const known = [...LGSP_ERROR_RULES, ...GAUSS_ERROR_RULES, ...DET_ERROR_RULES, ...CRAMER_ERROR_RULES].some((r) => r.id === c.errorRuleId)
          expect(known, `${where}: ${c.errorRuleId}`).toBe(true)
          expectRenderable(c.whyWrong!.detailed, where)
        }
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
    }
  })

  it('jede Tabelle beim Nullen erzeugen ist gleichwertig zur Aufgabe, keine falsche (an mehreren Stellen für a und b)', () => {
    let checked = 0
    const points = [
      { a: 0.37, b: 1.9 },
      { a: -1.6, b: -0.7 },
      { a: 2.45, b: 3.1 },
    ]
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        const { n, at } = system(task)
        for (const step of task.steps.filter((s) => s.id.startsWith('spalte-'))) {
          for (const c of step.choices) {
            const same = points.map(({ a, b }) => sameSystem(readTable(tableIn(c.content), n, { a, b }), at(a, b)))
            if (c.correct) expect(same.every(Boolean), `${task.form} ${step.id}`).toBe(true)
            else expect(same.every(Boolean), `${task.form} ${step.id} ${c.errorRuleId}`).toBe(false)
          }
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(300)
  })

  it('Stufenform beim Sonderwert (Determinante zuerst) gleichwertig, falsche nicht; Bedingung sind genau die Sonderwerte', () => {
    let tables = 0
    let conditions = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 80)) {
        const { n, at } = system(task)
        for (const step of task.steps.filter((s) => s.id.startsWith('stufenform-'))) {
          const a = Number(/a = (-?\d+)/.exec(step.question)![1])
          const kase = kaseOf(at(a))
          expect(kase, task.form).not.toBe('unique')
          const right = readTable(tableIn(step.choices.find((c) => c.correct)!.content), n, {})
          expect(sameSystem(right, at(a)), `${task.form} ${step.id}`).toBe(true)
          for (const c of step.choices.filter((x) => !x.correct)) {
            const W = readTable(tableIn(c.content), n, {})
            // ohne Lösung sind alle Tabellen ohne Lösung gleichwertig; dort zählt der Rechenfehler selbst (wie beim Gauß-Verfahren)
            if (kase === 'none') expect(W.flat().every((x, i) => x === right.flat()[i]), `${task.form} ${step.id} ${c.errorRuleId}`).toBe(false)
            else expect(sameSystem(W, at(a)), `${task.form} ${step.id} ${c.errorRuleId}`).toBe(false)
          }
          tables++
        }
        const cond = task.steps.find((s) => s.id === 'bedingung')!
        const right = cond.choices.find((c) => c.correct)!.content
        const excluded = [...right.matchAll(/a \\ne (-?\d+)/g)].map((m) => Number(m[1]))
        const zeros: number[] = []
        for (let a = -30; a <= 30; a++) if (rank(at(a, 0).map((r) => r.slice(0, n))) < n) zeros.push(a)
        expect(excluded, task.form).toEqual(zeros)
        for (const c of cond.choices.filter((x) => !x.correct && x.content.includes('\\ne'))) {
          const other = [...c.content.matchAll(/a \\ne (-?\d+)/g)].map((m) => Number(m[1])).sort((p, q) => p - q)
          expect(other, `${task.form} ${c.errorRuleId}`).not.toEqual(zeros)
        }
        conditions++
      }
    }
    expect(tables).toBeGreaterThan(50)
    expect(conditions).toBeGreaterThan(300)
  })

  it('Ränge stimmen mit der Tabelle und mit der Aufgabe beim Sonderwert', () => {
    let checked = 0
    for (const level of [3, 4, 5] as const) {
      for (const task of tasks(level, 80)) {
        const step = task.steps.find((s) => s.id === 'rang')
        if (!step) continue
        const { n, at } = system(task)
        const a = Number(/a = (-?\d+)/.exec(step.question)![1])
        const bm = /b = (-?\d+)/.exec(step.question)
        const T = at(a, bm ? Number(bm[1]) : 0)
        const shown = readTable(tableIn(step.question), n, {})
        expect(sameSystem(shown, T), task.form).toBe(true)
        const right = step.choices.find((c) => c.correct)!.content
        const [ra, rb] = [...right.matchAll(/= (\d)\$/g)].map((m) => Number(m[1]))
        expect([ra, rb], task.form).toEqual([rank(T.map((r) => r.slice(0, n))), rank(T)])
        expect(right.endsWith(kaseOf(T) === 'none' ? 'keine Lösung' : 'unendlich viele Lösungen'), task.form).toBe(true)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(100)
  })

  it('falsche Antworten bei Sonderwerten, b, vorgegebenem Wert und Lösungsmenge sind nie richtig; Zahlen der Erklärungen stimmen', () => {
    const counts: Record<string, number> = {}
    const setOf = (content: string) => [...content.matchAll(/a(?:_[12])? = (-?\d+)/g)].map((m) => Number(m[1])).sort((p, q) => p - q)
    const ints = Array.from({ length: 61 }, (_, i) => i - 30)
    for (const level of LEVELS) {
      for (const task of tasks(level, 100)) {
        const { n, at } = system(task)
        const sonder = task.steps.find((s) => s.id === 'sonderfall')
        if (sonder) {
          const ask = task.kind === 'lgspFull' ? 'none' : KASES[task.data.ask[0]]
          const good = ints.filter((a) => kaseOf(at(a)) === ask)
          expect(setOf(sonder.choices.find((c) => c.correct)!.content), task.form).toEqual(good)
          for (const c of sonder.choices.filter((x) => !x.correct && !x.content.includes('\\ne') && !x.content.includes('kein'))) expect(setOf(c.content), `${task.form} ${c.errorRuleId}`).not.toEqual(good)
          // je Sonderwert: rechts 0 genau bei unendlich vielen Lösungen
          const shown = [...sonder.explanation.detailed.matchAll(/Für \$a = (-?\d+)\$[^$]*\$0(?: \\cdot [a-z_0-9]+)? = (-?\d+)\$/g)]
          expect(shown.length, task.form).toBeGreaterThan(0)
          for (const m of shown) expect(Number(m[2]) === 0, task.form).toBe(kaseOf(at(Number(m[1]))) === 'inf')
          counts.sonderfall = (counts.sonderfall ?? 0) + 1
        }
        const vorgabe = task.steps.find((s) => s.id === 'vorgabe')
        if (vorgabe) {
          for (const c of vorgabe.choices.filter((x) => !x.correct)) expect(setOf(c.content), `${task.form} ${c.errorRuleId}`).not.toEqual([...task.answer])
          // die zusammengefasste Gleichung hat die Lösungen als Nullstellen
          const E = /Zusammengefasst: \$(.*?) = 0\$/.exec(vorgabe.explanation.detailed)![1]
          for (const a of task.answer) expect(close(valueOf(E, { a }), 0), task.form).toBe(true)
          counts.vorgabe = (counts.vorgabe ?? 0) + 1
        }
        const bStep = task.steps.find((s) => s.id === 'b-wert')
        if (bStep) {
          const [a] = task.answer
          for (const c of bStep.choices.filter((x) => !x.correct && x.content.includes('b ='))) expect(kaseOf(at(a, Number(/b = (-?\d+)/.exec(c.content)![1]))), `${task.form} ${c.errorRuleId}`).not.toBe('inf')
          counts.b = (counts.b ?? 0) + 1
        }
        const loesung = task.steps.find((s) => s.id === 'loesung')
        if (loesung) {
          const T = at(task.data.inf[0])
          for (const c of loesung.choices.filter((x) => !x.correct)) {
            const part = readResult(c.content)?.[0]
            if (!part || part.shape !== 'param') continue
            const p = part.values.slice(0, n)
            const d = part.values.slice(n)
            const solves = T.every((row) => close(row.slice(0, n).reduce((s, x, j) => s + x * p[j], 0), row[n]) && close(row.slice(0, n).reduce((s, x, j) => s + x * d[j], 0), 0))
            expect(solves && d.some((x) => x !== 0), `${task.form} ${c.errorRuleId}`).toBe(false)
          }
          counts.loesung = (counts.loesung ?? 0) + 1
        }
      }
    }
    for (const id of ['sonderfall', 'vorgabe', 'b', 'loesung']) expect(counts[id] ?? 0, id).toBeGreaterThan(20)
  })

  it.each(cells)('Stufe %i: Abwechslung (100 Formen unter 200, keine über 3 %)', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('jede Art kommt vor, beide Fälle kommen vor, und dieselbe Nummer baut dieselbe Aufgabe', () => {
    const seen = new Set<string>()
    const asked = new Set<number>()
    for (const level of LEVELS)
      for (const task of tasks(level, 60)) {
        seen.add(task.kind)
        if (task.data.ask) asked.add(task.data.ask[0])
      }
    expect([...seen].sort()).toEqual([...new Set(Object.values(LGSP_KINDS_BY_LEVEL).flat())].sort())
    expect([...asked].sort()).toEqual([1, 2])
    expect(buildVectorTask(ref(5, 42))).toEqual(buildVectorTask(ref(5, 42)))
  })
})

describe('Gleichungssysteme mit Parameter: Fehler und Lernkarten', () => {
  it('nutzt jeden Fehler, und jeder steht auf einer Karte des Ordners', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 120)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    expect(LGSP_ERROR_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
    const shown = new Set(cardsInTopic('matrizen').flatMap((c) => c.errors))
    for (const id of used) expect(shown.has(id), id).toBe(true)
    for (const rule of LGSP_ERROR_RULES) {
      expect(latexProblem(rule.wrongFormula, { checkUgly: false }), rule.id).toBeNull()
      // oxlint-disable-next-line no-control-regex
      for (const text of [rule.name, rule.wrongFormula, rule.why.detailed, rule.why.short]) expect(text, rule.id).not.toMatch(/[\u0000-\u001f]/)
    }
  })

  it('jede Karte der Aufgaben gibt es, und jedes Beispiel ist eine Aufgabe der genannten Art, die die Gegenprobe besteht', () => {
    for (const level of LEVELS) for (const task of tasks(level, 40)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(cardById(id)?.topic, id).toBe('matrizen')
    let examples = 0
    for (const id of Object.values(LGSP_CARD)) {
      const card = cardById(id)!
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        verify(task, card.id)
        examples++
      }
    }
    expect(examples).toBe(6)
  })
})

describe('Gleichungssysteme mit Parameter: freier Modus', () => {
  it('nimmt das Ergebnis an und erkennt typische Fehler', () => {
    const found = new Set<string>()
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        const check = prepareVectorCheck(task)
        const input = check.parts.map((p) => p.values.map(String))
        expect(checkVectorEntries(check, input).kind, task.form).toBe('correct')
        check.wrongs.forEach((ws, i) => {
          for (const w of ws) {
            const verdict = checkVectorEntries(
              check,
              check.parts.map((p, j) => (j === i ? w.values : p.values).map(String)),
            )
            expect(verdict.kind, task.form).toBe('wrong')
            if (verdict.kind === 'wrong' && verdict.error) found.add(verdict.error.id)
          }
        })
      }
    }
    for (const id of ['det-root-sign', 'lgsp-b-sign', 'lgsp-target-numerator', 'gauss-param-free-one', 'gauss-zero-row-none']) expect(found.has(id), id).toBe(true)
  })
})
