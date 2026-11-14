import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { evaluate } from '../expr/evaluate.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { parseLatex } from '../parse/latex.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { GAUSS_ERROR_RULES } from './gaussErrorRules.ts'
import { GAUSS_CARD, GAUSS_KINDS_BY_LEVEL, LGS_CASES } from './gaussTasks.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 10a: Baustein „Gauß-Verfahren“. Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet (eigenes
// Eliminieren mit Spaltenpivot, nicht der Rechenweg der Engine): Lösung erfüllt das System, Zahl der Lösungen stimmt;
// jede Tabelle im Rechenweg folgt aus der vorigen durch erlaubte Umformungen, keine falsche ist gleichwertig; die
// angezeigten Gleichungen passen zur Tabelle; jeder Fehler kommt vor und steht auf einer Karte; Abwechslung; freier Modus.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('gauss', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

type N = number[][]
const EPS = 1e-9
const close = (a: number, b: number) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a), Math.abs(b))
const sameFlat = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => close(x, b[i]))

// Rang mit Spaltenpivot (Kommazahlen)
function rank(rows: N): number {
  const M = rows.map((r) => [...r])
  if (M.length === 0) return 0
  const w = M[0].length
  let r = 0
  for (let c = 0; c < w && r < M.length; c++) {
    let p = r
    for (let i = r + 1; i < M.length; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    if (Math.abs(M[p][c]) < 1e-9) continue
    ;[M[p], M[r]] = [M[r], M[p]]
    for (let i = r + 1; i < M.length; i++) {
      const f = M[i][c] / M[r][c]
      M[i] = M[i].map((x, k) => x - f * M[r][k])
    }
    r++
  }
  return r
}
const sameRowSpace = (A: N, B: N) => rank(A) === rank(B) && rank([...A, ...B]) === rank(A)

function system(task: VectorTask) {
  const [m, n] = [task.data.m[0], task.data.n[0]]
  const T = Array.from({ length: m }, (_, i) => task.data.T.slice(i * (n + 1), (i + 1) * (n + 1)))
  return { m, n, T, A: T.map((r) => r.slice(0, n)) }
}
const residual = (T: N, x: readonly number[], hom = false) => T.map((r) => r.slice(0, -1).reduce((s, a, j) => s + a * x[j], 0) - (hom ? 0 : r[r.length - 1]))

// Zahl in einer Tabelle: -3, \frac{1}{2}, -\frac{1}{2}, 0{,}5
function entry(text: string): number {
  const t = text.trim()
  const frac = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(t)
  if (frac) return (frac[1] ? -1 : 1) * (Number(frac[2]) / Number(frac[3]))
  const v = Number(t.replace('{,}', '.'))
  if (!Number.isFinite(v) || t === '') throw new Error(`keine Zahl: ${t}`)
  return v
}
// Tabelle aus einer Antwort lesen (ohne Kopfzeile, Zeilennamen und Umformungen)
function readTable(content: string, n: number): N | null {
  const m = /\\begin\{array\}\{c\|r+\|rl?\}(.*)\\end\{array\}/s.exec(content)
  if (!m) return null
  const rows = m[1].split('\\\\').slice(1)
  return rows.map((r) => r.replace('\\hline', '').split('&').slice(1, n + 2).map(entry))
}

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null|\+ -|- -/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind === 'math') expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
  }
}

// unabhängige Gegenprobe: Fall und Lösung
function verify(task: VectorTask, context: string) {
  const { n, T, A } = system(task)
  // jede Unbekannte steht in mindestens einer Gleichung (sonst sähe man sie in der Aufgabe nicht)
  for (let j = 0; j < n; j++) expect(A.some((row) => row[j] !== 0), `${context}: Unbekannte ${j + 1} kommt nicht vor`).toBe(true)
  const rA = rank(A)
  const rT = rank(T)
  const parts = readResult(task.resultLatex!)!
  if (rA < rT) {
    expect(task.resultLatex, context).toBe(`\\text{${LGS_CASES[1]}}`)
    return 'none'
  }
  if (rA === n) {
    expect(parts[0].shape, context).toBe('vector')
    expect(residual(T, task.answer).every((x) => Math.abs(x) < EPS), context).toBe(true)
    return 'unique'
  }
  // unendlich viele: Stützvektor erfüllt das System, Richtungen lösen das homogene, so viele wie frei und unabhängig
  const part = parts[0]
  expect(part.shape, context).toBe('param')
  const k = part.params!.length
  const cols = Array.from({ length: k + 1 }, (_, c) => task.answer.slice(c * n, (c + 1) * n))
  expect(residual(T, cols[0]).every((x) => Math.abs(x) < EPS), context).toBe(true)
  for (const d of cols.slice(1)) expect(residual(T, d, true).every((x) => Math.abs(x) < EPS), context).toBe(true)
  expect(k, context).toBe(n - rA)
  expect(rank(cols.slice(1)), context).toBe(k)
  return 'inf'
}

describe('Gauß-Verfahren', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      expect(GAUSS_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      verify(task, context)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
      const parts = readResult(task.resultLatex!)
      expect(parts, context).not.toBeNull()
      expect(sameFlat(parts!.flatMap((p) => p.values), task.answer), context).toBe(true)
      expect(new Set(task.steps.map((s) => s.id)).size, context).toBe(task.steps.length)
      expect(task.steps.some((s) => s.id === 'deuten'), context).toBe(true)
      for (const step of task.steps) {
        const where = `${context} ${step.id}`
        expect(step.choices.length, where).toBeGreaterThanOrEqual(3)
        expect(step.choices.filter((c) => c.correct).length, where).toBe(1)
        expect(new Set(step.choices.map((c) => c.content)).size, where).toBe(step.choices.length)
        for (const text of [step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) expectRenderable(text, where)
        for (const c of step.choices.filter((c) => !c.correct)) {
          expect(GAUSS_ERROR_RULES.some((r) => r.id === c.errorRuleId), `${where}: ${c.errorRuleId}`).toBe(true)
          expectRenderable(c.whyWrong!.detailed, where)
        }
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
    }
  })

  it('der Rechenweg: jede Tabelle folgt aus der vorigen, Nullen unter der Stufe, keine falsche Tabelle ist gleichwertig', () => {
    let tables = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 80)) {
        const { n, T } = system(task)
        const context = `${level}-${task.ref.seed} ${task.form}`
        let prev = T
        for (const step of task.steps) {
          const right = step.choices.find((c) => c.correct)!
          const swap = /^Zeilen (I+V?|IV) und (I+V?|IV) tauschen$/.exec(right.content)
          if (swap) {
            const [i, j] = [swap[1], swap[2]].map((x) => ['I', 'II', 'III', 'IV'].indexOf(x))
            prev = prev.map((r, k) => (k === i ? prev[j] : k === j ? prev[i] : r))
          }
          const R = readTable(right.content, n)
          if (!R) continue
          tables++
          // gleiche Lösungen wie die Aufgabe (Umformungen ändern nichts); Kommazahlen: die Aufgabe hat dieselben Zeilen bis auf Faktoren
          expect(sameRowSpace(R, T), `${context} ${step.id}`).toBe(true)
          if (step.id.startsWith('spalte-')) {
            const col = Number(/Spalte (\d+)/.exec(step.title)![1]) - 1
            const row = ['I', 'II', 'III', 'IV'].indexOf(/in Zeile (I+V?|IV)/.exec(step.question)![1])
            for (let i = row + 1; i < R.length; i++) expect(R[i][col], `${context} ${step.id}`).toBe(0)
            // nur die Zeilen darunter ändern sich
            for (let i = 0; i <= row; i++) expect(sameFlat(R[i], prev[i]), `${context} ${step.id}`).toBe(true)
          }
          for (const c of step.choices.filter((x) => !x.correct)) {
            const W = readTable(c.content, n)!
            const inconsistent = rank(W.map((r) => r.slice(0, n))) < rank(W)
            if (inconsistent) expect(sameFlat(W.flat(), R.flat()), `${context} ${step.id} ${c.errorRuleId}`).toBe(false)
            else expect(sameRowSpace(W, R), `${context} ${step.id} ${c.errorRuleId}`).toBe(false)
          }
          prev = R
        }
      }
    }
    expect(tables).toBeGreaterThan(800)
  })

  it('die angezeigten Gleichungen passen zur Tabelle (auch mit Gliedern rechts und Kommazahlen)', () => {
    let checked = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        if (!task.functionLatex!.startsWith('\\begin{array}{ll}')) continue
        const { n, T } = system(task)
        const vars = task.functionLatex!.includes('x_') ? ['x_1', 'x_2', 'x_3', 'x_4'].slice(0, n) : ['x', 'y', 'z'].slice(0, n)
        const lines = /\\begin\{array\}\{ll\} (.*) \\end\{array\}/s.exec(task.functionLatex!)![1].split(' \\\\ ')
        const scaled = task.steps[0].id === 'skalieren'
        lines.forEach((line, i) => {
          const [lhs, rhs] = line.split(' & ')[1].split(' = ')
          const f = (side: string) => parseLatex(side.replace(/\{,\}/g, '.'))
          const l = f(lhs)
          const r = f(rhs)
          expect(l.ok && r.ok, `${task.form}: ${line}`).toBe(true)
          if (!l.ok || !r.ok) return
          const points = [[1.3, -0.7, 2.1, 0.4], [-2, 0.5, 1, -1.5], [0.3, 2.2, -1.1, 0.9]]
          const pairs = points.map((point) => {
            const env = Object.fromEntries(vars.map((v, j) => [v, point[j]]))
            return [evaluate(l.expr, env) - evaluate(r.expr, env), T[i].slice(0, n).reduce((s, a, j) => s + a * point[j], 0) - T[i][n]] as const
          })
          // beim Wegskalieren ist die Tabellenzeile ein Vielfaches der Gleichung
          const factors = scaled ? [1, 2, 4, 5, 10] : [1]
          expect(factors.some((k) => pairs.every(([shown, want]) => close(k * shown, want))), `${task.form}: ${line}`).toBe(true)
          checked++
        })
      }
    }
    expect(checked).toBeGreaterThan(150)
  })

  it('falsche Lösungen erfüllen das System nicht, falsche Lösungsmengen sind andere Mengen', () => {
    let compared = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 100)) {
        const step = task.steps.find((s) => s.id === 'loesung')
        if (!step) continue
        const { n, T, A } = system(task)
        for (const c of step.choices.filter((x) => !x.correct)) {
          const parts = readResult(c.content)!
          const p = parts[0]
          if (p.shape === 'vector') expect(residual(T, p.values).every((x) => Math.abs(x) < EPS), `${task.form} ${c.errorRuleId}`).toBe(false)
          else {
            const cols = Array.from({ length: p.params!.length + 1 }, (_, k) => p.values.slice(k * n, (k + 1) * n))
            const supportOk = residual(T, cols[0]).every((x) => Math.abs(x) < EPS)
            const dirsOk = cols.slice(1).every((d) => residual(T, d, true).every((x) => Math.abs(x) < EPS)) && rank(cols.slice(1)) === n - rank(A)
            expect(supportOk && dirsOk, `${task.form} ${c.errorRuleId}`).toBe(false)
          }
          compared++
        }
      }
    }
    expect(compared).toBeGreaterThan(500)
  })

  it('rückwärts einsetzen: jede Variable mit Stufe wird ausgerechnet (eigener Schritt oder in der Lösung genannt)', () => {
    let checked = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 100)) {
        const step = task.steps.find((s) => s.id === 'loesung')
        if (!step) continue
        const { n } = system(task)
        const vars = task.functionLatex!.includes('x_') ? ['x_1', 'x_2', 'x_3', 'x_4'].slice(0, n) : ['x', 'y', 'z'].slice(0, n)
        const free = task.data.free ?? []
        // Frage ohne den Teil „Mit $z = t$:“ vorweg
        const asked = step.question.split(': ').at(-1)!
        vars.forEach((v, j) => {
          if (free.includes(j)) return
          const own = task.steps.some((s) => s.id === `wert-${j}`)
          const named = asked.includes(`$${v}$`)
          // genau eins von beiden; ohne eigenen Schritt steht der Wert in der Erklärung der Lösung
          expect(own !== named, `${task.form} ${v}: ${step.question}`).toBe(true)
          if (!own) expect(step.explanation.detailed, `${task.form} ${v}`).toContain(`$${v} = `)
          checked++
        })
      }
    }
    expect(checked).toBeGreaterThan(500)
  })

  it('Zeilen tauschen nur, wo oben noch eine Variable steht; Fehler beim Deuten passen zur Tabelle', () => {
    let swaps = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 150)) {
        const { n } = system(task)
        for (const step of task.steps.filter((s) => s.id.startsWith('tausch-'))) {
          const row = ['I', 'II', 'III', 'IV'].indexOf(/in Zeile (I+V?|IV) eine/.exec(step.question)![1])
          const table = readTable(step.question, n)!
          expect(table[row].slice(0, n).some((x) => x !== 0), `${task.form} ${step.id}`).toBe(true)
          // „Spalte überspringen“ nennt nie die rechte Seite als Spalte
          for (const c of step.choices) expect(c.content, task.form).not.toContain(`Spalte ${n + 1}`)
          swaps++
        }
        const deuten = task.steps.find((s) => s.id === 'deuten')!
        const F = readTable(deuten.question, n)!
        const zeroRows = F.filter((r) => r.every((x) => x === 0)).length
        const rules = deuten.choices.filter((c) => !c.correct).map((c) => c.errorRuleId)
        if (zeroRows === 0) for (const r of ['gauss-zero-row-none', 'gauss-zero-row-inf']) expect(rules, task.form).not.toContain(r)
      }
    }
    expect(swaps).toBeGreaterThan(30)
  })

  // Wunsch des Nutzers (14.11.2026): nicht fast immer eine 1 oben links, Umformungen auch über Kreuz
  it.each(cells)('Stufe %i: Zahlen nicht zu einfach (selten 1 oben links und in der ersten Spalte, oft über Kreuz)', (level) => {
    let top = 0
    let col = 0
    let rows = 0
    let cross = 0
    const list = tasks(level, 200)
    for (const task of list) {
      const w = task.data.n[0] + 1
      if (Math.abs(task.data.T[0]) === 1) top++
      for (let i = 0; i < task.data.m[0]; i++) {
        rows++
        if (Math.abs(task.data.T[i * w]) === 1) col++
      }
      if (task.steps.some((s) => /\\quad \d+ \\cdot \\text\{I/.test(s.choices.find((c) => c.correct)!.content))) cross++
    }
    expect(top / list.length, 'oben links').toBeLessThanOrEqual(0.35)
    expect(col / rows, 'erste Spalte').toBeLessThanOrEqual(0.3)
    expect(cross / list.length, 'über Kreuz').toBeGreaterThanOrEqual(0.3)
  })

  it.each(cells)('Stufe %i: Abwechslung (100 Formen unter 200, keine über 3 %)', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('jede Art und jeder Fall kommt vor, und dieselbe Nummer baut dieselbe Aufgabe', () => {
    const seen = new Set<string>()
    const cases = new Set<string>()
    for (const level of LEVELS)
      for (const task of tasks(level, 100)) {
        seen.add(task.kind)
        cases.add(`${task.kind}:${verify(task, task.form)}`)
      }
    expect([...seen].sort()).toEqual([...new Set(Object.values(GAUSS_KINDS_BY_LEVEL).flat())].sort())
    for (const c of ['gaussTwo:unique', 'gaussTwo:none', 'gaussTwo:inf', 'gaussThree:none', 'gaussThree:inf', 'gaussPivot:unique', 'gaussOver:none', 'gaussUnder:inf', 'gaussPlane:inf', 'gaussDecimal:none', 'gaussBig:inf'])
      expect(cases.has(c), c).toBe(true)
    expect(buildVectorTask(ref(5, 42))).toEqual(buildVectorTask(ref(5, 42)))
  })
})

describe('Gauß-Verfahren: Fehler und Lernkarten', () => {
  it('nutzt jeden Fehler, und jeder steht auf einer Karte des Ordners', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 150)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    expect(GAUSS_ERROR_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
    const shown = new Set(cardsInTopic('matrizen').flatMap((c) => c.errors))
    for (const rule of GAUSS_ERROR_RULES) expect(shown.has(rule.id), rule.id).toBe(true)
    for (const rule of GAUSS_ERROR_RULES) expect(latexProblem(rule.wrongFormula, { checkUgly: false }), rule.id).toBeNull()
  })

  it('jede Karte der Aufgaben gibt es, und jedes Beispiel ist eine Aufgabe der genannten Art, die die Gegenprobe besteht', () => {
    for (const level of LEVELS) for (const task of tasks(level, 40)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(cardById(id)?.topic, id).toBe('matrizen')
    let examples = 0
    for (const id of Object.values(GAUSS_CARD)) {
      const card = cardById(id)!
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        verify(task, card.id)
        examples++
      }
    }
    expect(examples).toBe(8)
  })
})

// Zahlen als LaTeX für den freien Modus
const latexOf = (x: number) => {
  if (Number.isInteger(x)) return String(x)
  for (let den = 2; den <= 400; den++) {
    const num = Math.round(x * den)
    if (Math.abs(num / den - x) < 1e-12) return `${num < 0 ? '-' : ''}\\frac{${Math.abs(num)}}{${den}}`
  }
  return String(x)
}

describe('Gauß-Verfahren: freier Modus', () => {
  it('nimmt das Ergebnis an (auch eine andere Darstellung der Lösungsmenge) und erkennt typische Fehler', () => {
    const found = new Set<string>()
    let other = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        const check = prepareVectorCheck(task)
        const entries = (p: (typeof check.parts)[number], values: readonly number[]) => (p.shape === 'choice' ? values.map((v) => p.options![v]) : values.map(latexOf))
        const input = check.parts.map((p) => entries(p, p.values))
        expect(checkVectorEntries(check, input).kind, task.form).toBe('correct')
        const part = check.parts[0]
        if (part.shape === 'param') {
          // anderer Stützpunkt (Stützvektor plus Richtung) und doppelte Richtung
          const n = system(task).n
          const cols = Array.from({ length: part.params!.length + 1 }, (_, k) => part.values.slice(k * n, (k + 1) * n))
          const moved = [cols[0].map((x, i) => x + cols[1][i]), cols[1].map((x) => 2 * x), ...cols.slice(2)]
          expect(checkVectorEntries(check, [moved.flat().map(latexOf)]).kind, task.form).toBe('correct')
          other++
        }
        check.wrongs.forEach((ws, i) => {
          for (const w of ws) {
            const verdict = checkVectorEntries(
              check,
              check.parts.map((p, j) => entries(p, j === i ? w.values : p.values)),
            )
            expect(verdict.kind, task.form).toBe('wrong')
            if (verdict.kind === 'wrong' && verdict.error) found.add(verdict.error.id)
          }
        })
      }
    }
    expect(other).toBeGreaterThan(20)
    for (const id of ['gauss-backsub-sign', 'gauss-order', 'gauss-param-free-one', 'gauss-contradiction-zero', 'gauss-contradiction-value']) expect(found.has(id), id).toBe(true)
  })
})
