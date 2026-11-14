import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { evaluate } from '../expr/evaluate.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardById, cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { parseLatex } from '../parse/latex.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { EQS_ERROR_RULES } from './eqsErrorRules.ts'
import { EQS_CARD, EQS_KINDS_BY_LEVEL } from './eqsTasks.ts'
import { GAUSS_ERROR_RULES } from './gaussErrorRules.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 10c: Baustein „Einsetzen, Gleichsetzen, Addieren“. Jede Aufgabe wird unabhängig mit Kommazahlen
// nachgerechnet (eigenes Gauß-Verfahren mit Rang): genau eine Lösung stimmt, „keine Lösung“ ist widersprüchlich, die
// Lösungsmenge liegt in der Lösung; mit Parameter hat jede ganze Zahl von −30 bis 30 außer dem Sonderwert genau eine
// Lösung. Jede Gleichung im Rechenweg (geordnet, nach dem Einsetzen) wird von der Lösung erfüllt, keine falsche ist
// gleichwertig; jeder Fehler kommt vor und steht auf einer Karte; Abwechslung; Bilder; freier Modus.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('einsetzen', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

type N = number[][]
const EPS = 1e-9
const close = (a: number, b: number) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a), Math.abs(b))
const VARS = ['x', 'y', 'z']

// Rang mit Spaltenpivot und eine Lösung (freie Variablen 0)
function gauss(M0: N, n: number) {
  const M = M0.map((r) => [...r])
  const piv: number[] = []
  let row = 0
  for (let c = 0; c < n && row < M.length; c++) {
    let p = row
    for (let i = row + 1; i < M.length; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    if (Math.abs(M[p][c]) < 1e-9) continue
    ;[M[p], M[row]] = [M[row], M[p]]
    for (let i = 0; i < M.length; i++) {
      if (i === row) continue
      const f = M[i][c] / M[row][c]
      M[i] = M[i].map((x, k) => x - f * M[row][k])
    }
    piv.push(c)
    row++
  }
  const consistent = M.slice(row).every((r) => Math.abs(r[n]) < 1e-9)
  const x = Array(n).fill(0)
  piv.forEach((c, i) => (x[c] = M[i][n] / M[i][c]))
  return { rank: piv.length, consistent, x }
}

function rowsOf(task: VectorTask, key = 'rows'): N {
  const n = task.data.n[0]
  const flat = task.data[key]
  return Array.from({ length: flat.length / (n + 1) }, (_, i) => flat.slice(i * (n + 1), (i + 1) * (n + 1)))
}

// unabhängige Gegenprobe des Ergebnisses
function verify(task: VectorTask, context: string) {
  const n = task.data.n[0]
  const M = rowsOf(task)
  if (task.kind === 'eqsParam') {
    const M1 = rowsOf(task, 'A1')
    const at = (a: number) => M.map((r, i) => r.map((x, j) => x + a * (M1[i][j] - x)))
    const special = task.answer[0]
    for (let a = -30; a <= 30; a++) {
      const g = gauss(at(a), n)
      if (a === special) {
        expect(g.rank, context).toBe(1)
        expect(g.consistent ? 2 : 1, context).toBe(task.answer[1])
      } else expect(g.rank, `${context} a=${a}`).toBe(2)
    }
    return
  }
  const g = gauss(M, n)
  if (task.kind === 'eqsRecip') {
    expect(g.rank, context).toBe(2)
    task.answer.forEach((v, j) => expect(close(v, 1 / g.x[j]), context).toBe(true))
    return
  }
  const parts = readResult(task.resultLatex!)!
  if (parts[0].shape === 'choice') {
    expect(g.consistent, context).toBe(false)
    return
  }
  expect(g.consistent, context).toBe(true)
  if (parts[0].shape === 'param') {
    expect(g.rank, context).toBe(n - 1)
    const [p, r] = [task.answer.slice(0, n), task.answer.slice(n)]
    for (const row of M) {
      expect(close(row.slice(0, n).reduce((s, a, j) => s + a * p[j], 0), row[n]), context).toBe(true)
      expect(close(row.slice(0, n).reduce((s, a, j) => s + a * r[j], 0), 0), context).toBe(true)
    }
    expect(r.some((x) => x !== 0), context).toBe(true)
    return
  }
  expect(g.rank, context).toBe(n)
  task.answer.forEach((v, j) => expect(close(v, g.x[j]), `${context}: ${task.answer} gegen ${g.x}`).toBe(true))
}

function expectRenderable(text: string, context: string) {
  expect(text, context).not.toMatch(/undefined|NaN|\[object|null|\+ -|- -|\+ \+/)
  for (const segment of parseRichText(text).flat()) {
    if (segment.kind !== 'math') continue
    expect(latexProblem(segment.latex, { checkUgly: false }), `${context}: ${segment.latex}`).toBeNull()
    expect(segment.latex.replace(/\\text\{[^}]*\}/g, ''), `${context}: ${segment.latex}`).not.toMatch(/\b(oder|und|für|genau)\b/)
  }
}

// lineare Gleichung in x, y, z aus LaTeX: Zahlen vor den Unbekannten und rechte Seite (null: nicht lesbar)
function equationOf(latex: string): number[] | null {
  const body = latex.replace(/^\$/, '').replace(/\$$/, '')
  const sides = body.split(' = ')
  if (sides.length !== 2) return null
  const parsed = parseLatex(`${sides[0]} - (${sides[1]})`)
  if (!parsed.ok) return null
  const f = (x: number, y: number, z: number) => evaluate(parsed.expr, { x, y, z })
  const c = f(0, 0, 0)
  return [f(1, 0, 0) - c, f(0, 1, 0) - c, f(0, 0, 1) - c, -c]
}
const proportional = (p: readonly number[], q: readonly number[]) => {
  const s = Math.max(...p.map(Math.abs), ...q.map(Math.abs), 1)
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (Math.abs(p[i] * q[j] - p[j] * q[i]) > 1e-9 * s * s) return false
  return true
}

describe('Einsetzen, Gleichsetzen, Addieren', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      expect(EQS_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      verify(task, context)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(latexProblem(task.resultLatex!, { checkUgly: false }), context).toBeNull()
      const parts = readResult(task.resultLatex!)
      expect(parts, context).not.toBeNull()
      expect(parts!.flatMap((p) => p.values), context).toEqual(task.answer)
      expect(new Set(task.steps.map((s) => s.id)).size, context).toBe(task.steps.length)
      for (const step of task.steps) {
        const where = `${context} ${step.id}`
        expect(step.choices.length, where).toBe(step.id === 'deuten' ? 3 : 4)
        expect(step.choices.filter((c) => c.correct).length, where).toBe(1)
        expect(new Set(step.choices.map((c) => c.content)).size, where).toBe(step.choices.length)
        for (const text of [step.question, step.hint, step.explanation.detailed, step.explanation.short, ...step.choices.map((c) => c.content)]) expectRenderable(text, where)
        for (const c of step.choices.filter((c) => !c.correct)) {
          const known = [...EQS_ERROR_RULES, ...GAUSS_ERROR_RULES].some((r) => r.id === c.errorRuleId)
          expect(known, `${where}: ${c.errorRuleId}`).toBe(true)
          expectRenderable(c.whyWrong!.detailed, where)
        }
        expect(step.cards.length, where).toBeGreaterThan(0)
      }
    }
  })

  it('jede geordnete Gleichung und jede nach dem Einsetzen wird von der Lösung erfüllt, keine falsche ist gleichwertig', () => {
    let checked = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 80)) {
        if (task.kind === 'eqsRecip' || task.kind === 'eqsParam') continue
        const parts = readResult(task.resultLatex!)!
        const unique = parts.every((p) => p.shape === 'number')
        const sol = unique ? [...task.answer, 0, 0].slice(0, 3) : null
        for (const step of task.steps.filter((s) => /^(ordnen|einsetzen|teil-einsetzen)/.test(s.id))) {
          const right = equationOf(step.choices.find((c) => c.correct)!.content)
          expect(right, `${task.form} ${step.id}`).not.toBeNull()
          if (sol) expect(close(right![0] * sol[0] + right![1] * sol[1] + right![2] * sol[2], right![3]), `${task.form} ${step.id}`).toBe(true)
          for (const c of step.choices.filter((x) => !x.correct)) {
            const w = equationOf(c.content)!
            const flat = (e: number[]) => e.slice(0, 3).every((x) => Math.abs(x) < 1e-12)
            const same = flat(w) || flat(right!) ? flat(w) && flat(right!) && Math.abs(w[3]) < 1e-12 === Math.abs(right![3]) < 1e-12 : proportional(w, right!)
            expect(same, `${task.form} ${step.id} ${c.errorRuleId}: ${c.content}`).toBe(false)
          }
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(250)
  })

  it('Werte im Rechenweg stimmen: jede Antwort „x = …“ passt zur Lösung, falsche Werte sind andere', () => {
    let checked = 0
    for (const level of [1, 2, 3, 4] as const) {
      for (const task of tasks(level, 80)) {
        if (task.kind === 'eqsRecip') continue
        const parts = readResult(task.resultLatex!)!
        if (!parts.every((p) => p.shape === 'number')) continue
        for (const step of task.steps.filter((s) => s.id.startsWith('wert-'))) {
          const v = VARS.indexOf(step.id.slice(5))
          const value = (content: string) => Number(evaluate((parseLatex(content.replace(/^\$/, '').replace(/\$$/, '').split(' = ')[1]) as { ok: true; expr: never }).expr, {}))
          expect(close(value(step.choices.find((c) => c.correct)!.content), task.answer[v]), `${task.form} ${step.id}`).toBe(true)
          for (const c of step.choices.filter((x) => !x.correct)) expect(close(value(c.content), task.answer[v]), `${task.form} ${step.id} ${c.errorRuleId}`).toBe(false)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(200)
  })

  it('Fälle und Verfahren: keine und unendlich viele Lösungen in Stufe 3, „Welches Verfahren?“ in Stufe 2, Bilder', () => {
    const forms = tasks(3, 150).map((t) => readResult(t.resultLatex!)![0].shape)
    expect(forms.filter((s) => s === 'choice').length).toBeGreaterThan(10)
    expect(forms.filter((s) => s === 'param').length).toBeGreaterThan(10)
    const level2 = tasks(2, 100)
    expect(level2.filter((t) => t.steps[0].id === 'verfahren').length).toBeGreaterThan(25)
    let pictures = 0
    for (const level of [1, 2, 3] as const) {
      for (const task of tasks(level, 60)) {
        expect(task.resultDrawing, task.form).toBeDefined()
        if (task.steps.some((s) => s.solvedDrawing)) pictures++
        for (const s of task.steps) expect(s.drawing, task.form).toBeUndefined()
      }
    }
    expect(pictures).toBeGreaterThan(150)
  })

  it.each(cells)('Stufe %i: Abwechslung (100 Formen unter 200, keine über 3 %)', (level) => {
    const stats = varietyStats(tasks(level, 200).map((t) => t.form))
    expect(stats.distinct).toBeGreaterThanOrEqual(100)
    expect(stats.maxShare).toBeLessThanOrEqual(0.03)
  })

  it('jede Art kommt vor, und dieselbe Nummer baut dieselbe Aufgabe', () => {
    const seen = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 60)) seen.add(task.kind)
    expect([...seen].sort()).toEqual([...new Set(Object.values(EQS_KINDS_BY_LEVEL).flat())].sort())
    expect(buildVectorTask(ref(5, 42))).toEqual(buildVectorTask(ref(5, 42)))
  })
})

// Gleichung in beliebigen Unbekannten: Zahlen vor ihnen und rechte Seite; mit festen Werten weiterer Buchstaben (a)
const ALL = ['x', 'y', 'z', 'u', 'v']
function coeffs(eq: string, fixed: Record<string, number> = {}): number[] {
  const sides = eq.replace(/^\$/, '').replace(/\$$/, '').split(' = ')
  const parsed = parseLatex(`${sides[0]} - (${sides[1]})`)
  if (!parsed.ok || sides.length !== 2) throw new Error(eq)
  const f = (k: number) => evaluate(parsed.expr, { ...fixed, ...Object.fromEntries(ALL.map((v, j) => [v, j === k ? 1 : 0])) })
  const c = f(-1)
  return [...ALL.map((_, k) => f(k) - c), -c]
}
// Gleichungen eines Systems \begin{array}{ll} \text{I}\colon & … \\ … \end{array} nach Namen (mit Strich: II')
function systemOf(latex: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const m of latex.matchAll(/\\text\{([IV]+)\}('?)\\colon & (.*?)(?= \\\\ | \\end\{array\})/g)) out.set(m[1] + m[2], m[3])
  return out
}
const holds = (c: readonly number[], x: Record<string, number>) => close(ALL.reduce((s, v, j) => s + c[j] * (x[v] ?? 0), 0), c[ALL.length])

describe('Einsetzen, Gleichsetzen, Addieren: einzelne Schritte', () => {
  it('Auflösen: die richtige Form ist dieselbe Gleichung, keine falsche', () => {
    let checked = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 80)) {
        for (const step of task.steps.filter((s) => s.id.includes('aufloesen'))) {
          const given = coeffs(/\$([^$]*)\$$/.exec(step.question)![1])
          for (const c of step.choices) expect(proportional(coeffs(c.content), given), `${task.form} ${step.id} ${c.content}`).toBe(c.correct)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(200)
  })

  it('Womit malnehmen: mit der richtigen Rechnung fällt die Unbekannte weg, mit keiner falschen', () => {
    let checked = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 80)) {
        for (const step of task.steps.filter((s) => s.id === 'faktoren')) {
          const rows = systemOf(step.question)
          const e = ALL.indexOf(/fällt \$([a-z])\$ weg/.exec(step.question)![1])
          // mit Parameter: an einer Stelle a; die Unbekannte, die wegfällt, hat dort keinen
          const at = { a: 1.7 }
          for (const c of step.choices) {
            let sum = 0
            for (const m of c.content.matchAll(/(^\$|[+-]) ?(?:(\d+) \\cdot )?\\text\{([IV]+)\}('?)/g)) {
              const k = (m[1] === '-' ? -1 : 1) * Number(m[2] ?? 1)
              sum += k * coeffs(rows.get(m[3] + m[4])!, at)[e]
            }
            expect(Math.abs(sum) < 1e-9, `${task.form} ${c.content}`).toBe(c.correct)
          }
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(150)
  })

  it('Lösungsmenge: die richtige liegt auf allen Gleichungen, keine falsche beschreibt dieselbe Gerade', () => {
    let checked = 0
    for (const task of tasks(3, 200)) {
      const step = task.steps.find((s) => s.id === 'loesung' && s.choices.some((c) => c.content.includes('colon')))
      if (!step) continue
      const M = rowsOf(task)
      for (const c of step.choices) {
        const [part] = readResult(c.content)!
        const [p, r] = [part.values.slice(0, 2), part.values.slice(2)]
        const ok = r.some((x) => x !== 0) && M.every((row) => close(row[0] * p[0] + row[1] * p[1], row[2]) && close(row[0] * r[0] + row[1] * r[1], 0))
        expect(ok, `${task.form} ${c.content}`).toBe(c.correct)
      }
      checked++
    }
    expect(checked).toBeGreaterThan(15)
  })

  it('mit Parameter: die Gleichung nach dem Addieren gilt für die Lösung bei jedem a, keine falsche', () => {
    let checked = 0
    for (const task of tasks(5, 150).filter((t) => t.kind === 'eqsParam')) {
      const M0 = rowsOf(task)
      const M1 = rowsOf(task, 'A1')
      const step = task.steps.find((s) => s.id === 'addieren')!
      const sol = (a: number) => gauss(M0.map((r, i) => r.map((x, j) => x + a * (M1[i][j] - x))), 2).x
      const fits = (content: string) =>
        [-2.5, 0.5, 1.7, 7.25].every((a) => {
          const [x, y] = sol(a)
          return holds(coeffs(content, { a }), { x, y })
        })
      // bei 0 rechts erfüllt jede Gleichung (…) · x = 0 die Lösung: dann muss die falsche beim Sonderwert noch eine Unbekannte haben
      const special = task.data.special[0]
      const keepsUnknown = (content: string) => coeffs(content, { a: special }).slice(0, 2).some((x) => Math.abs(x) > 1e-9)
      for (const c of step.choices) {
        if (c.correct) expect(fits(c.content) && !keepsUnknown(c.content), `${task.form} ${c.content}`).toBe(true)
        else expect(!fits(c.content) || keepsUnknown(c.content), `${task.form} ${c.content}`).toBe(true)
      }
      checked++
    }
    expect(checked).toBeGreaterThan(30)
  })

  it('Unbekannte im Nenner: das System in u und v gilt für u = 1/x, v = 1/y, keine falsche', () => {
    let checked = 0
    for (const level of [4, 5] as const) {
      for (const task of tasks(level, 100).filter((t) => t.kind === 'eqsRecip')) {
        const step = task.steps.find((s) => s.id === 'substitution')!
        const at = { u: 1 / task.answer[0], v: 1 / task.answer[1] }
        for (const c of step.choices) expect([...systemOf(c.content).values()].every((eq) => holds(coeffs(eq), at)), `${task.form} ${c.content}`).toBe(c.correct)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(50)
  })
})

describe('Einsetzen, Gleichsetzen, Addieren: Fehler und Lernkarten', () => {
  it('nutzt jeden Fehler, und jeder steht auf einer Karte des Ordners', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 150)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    expect(EQS_ERROR_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
    const shown = new Set(cardsInTopic('matrizen').flatMap((c) => c.errors))
    for (const id of used) expect(shown.has(id), id).toBe(true)
    for (const rule of EQS_ERROR_RULES) {
      expect(latexProblem(rule.wrongFormula, { checkUgly: false }), rule.id).toBeNull()
      // oxlint-disable-next-line no-control-regex
      for (const text of [rule.name, rule.wrongFormula, rule.why.detailed, rule.why.short]) expect(text, rule.id).not.toMatch(/[\u0000-\u001f]/)
    }
  })

  it('jede Karte der Aufgaben gibt es, und jedes Beispiel ist eine Aufgabe der genannten Art, die die Gegenprobe besteht', () => {
    for (const level of LEVELS) for (const task of tasks(level, 40)) for (const id of [...task.cards, ...task.steps.flatMap((s) => s.cards)]) expect(cardById(id)?.topic, id).toBe('matrizen')
    let examples = 0
    for (const id of Object.values(EQS_CARD)) {
      const card = cardById(id)!
      for (const e of card.examples) {
        if (!isVectorExample(e)) throw new Error(card.id)
        const task = buildVectorTask({ level: e.vector.level, seed: blockSeed('rechnen', e.vector.seed) }, e.vector.kind)
        expect(task.kind, card.id).toBe(e.vector.kind)
        verify(task, card.id)
        if (e.vector.picture === 'step') expect(task.steps.some((s) => s.solvedDrawing), card.id).toBe(true)
        examples++
      }
    }
    expect(examples).toBe(11)
  })
})

const latexOf = (x: number) => {
  if (Number.isInteger(x)) return String(x)
  for (let den = 2; den <= 400; den++) {
    const num = Math.round(x * den)
    if (Math.abs(num / den - x) < 1e-12) return `${num < 0 ? '-' : ''}\\frac{${Math.abs(num)}}{${den}}`
  }
  return String(x)
}

describe('Einsetzen, Gleichsetzen, Addieren: freier Modus', () => {
  it('nimmt das Ergebnis an und erkennt typische Fehler', () => {
    const found = new Set<string>()
    for (const level of LEVELS) {
      for (const task of tasks(level, 60)) {
        const check = prepareVectorCheck(task)
        const input = check.parts.map((p) => (p.shape === 'choice' ? [p.options![p.values[0]]] : p.values.map(latexOf)))
        expect(checkVectorEntries(check, input).kind, task.form).toBe('correct')
        check.wrongs.forEach((ws, i) => {
          for (const w of ws) {
            if (check.parts[i].shape === 'choice') continue
            const verdict = checkVectorEntries(
              check,
              check.parts.map((p, j) => (p.shape === 'choice' ? [p.options![p.values[0]]] : (j === i ? w.values : p.values).map(latexOf))),
            )
            expect(verdict.kind, task.form).toBe('wrong')
            if (verdict.kind === 'wrong' && verdict.error) found.add(verdict.error.id)
          }
        })
      }
    }
    for (const id of ['gauss-backsub-sign', 'eqs-swap-values', 'eqs-recip-back']) expect(found.has(id), id).toBe(true)
  })
})
