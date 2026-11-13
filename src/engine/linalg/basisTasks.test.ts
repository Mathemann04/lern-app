import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { parseRichText } from '../explain/richText.ts'
import { cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { varietyStats } from '../tasks/variety.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { VECTOR_ERROR_RULES } from './errorRules.ts'
import { type VectorDrawing, drawingCoordinates } from './figures.ts'
import { BASIS_KINDS_BY_LEVEL, INDEPENDENCE, SPAN_ANSWERS } from './basisTasks.ts'
import { checkVectorEntries, prepareVectorCheck, readResult } from './vectorFree.ts'
import { type VectorTask, buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 5: Baustein „Linearkombination und Basis". Jede Aufgabe wird unabhängig mit Kommazahlen nachgerechnet
// (Rang mit dem Gauß-Verfahren mit Spaltenpivot, Abstand zum Spann über die Projektion, Determinante nach der ersten Zeile
// entwickelt), jede falsche Antwort stammt aus dem Katalog und ist nicht so viel wert wie die richtige, Bilder passen zur
// Aufgabe (die Vielfachen treffen das Ziel oder verfehlen es, die Ebene enthält die Pfeile), Abwechslung.

const ref = (level: Level, s: number) => ({ level, seed: blockSeed('basis', s) })
const tasks = (level: Level, n: number) => Array.from({ length: n }, (_, i) => buildVectorTask(ref(level, i + 1)))

type V = readonly number[]
const EPS = 1e-9
const close = (a: number, b: number) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a), Math.abs(b))
const dot = (a: V, b: V) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (v: V) => Math.sqrt(dot(v, v))
const sub = (a: V, b: V) => a.map((x, i) => x - b[i])
const add = (a: V, b: V) => a.map((x, i) => x + b[i])
const scale = (k: number, a: V) => a.map((x) => k * x)
const sameVec = (a: V, b: V) => a.length === b.length && a.every((x, i) => close(x, b[i]))
const det3 = (a: V, b: V, c: V) => a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])

// Rang mit Gauß und Spaltenpivot (Zeilen = Vektoren)
function rank(vs: readonly V[]): number {
  const M = vs.map((v) => [...v])
  let r = 0
  for (let col = 0; col < M[0].length && r < M.length; col++) {
    let best = r
    for (let i = r; i < M.length; i++) if (Math.abs(M[i][col]) > Math.abs(M[best][col])) best = i
    if (Math.abs(M[best][col]) < 1e-9) continue
    ;[M[r], M[best]] = [M[best], M[r]]
    for (let i = 0; i < M.length; i++)
      if (i !== r) {
        const f = M[i][col] / M[r][col]
        M[i] = M[i].map((x, j) => x - f * M[r][j])
      }
    r++
  }
  return r
}

// Abstand von x zum Spann von a und b (Gram-Schmidt)
function distToSpan(a: V, b: V, x: V): number {
  const e1 = scale(1 / norm(a), a)
  const b2 = sub(b, scale(dot(b, e1), e1))
  const e2 = scale(1 / norm(b2), b2)
  return norm(sub(sub(x, scale(dot(x, e1), e1)), scale(dot(x, e2), e2)))
}

const UGLY: readonly RegExp[] = [/\\frac\{0\}/, /\+ -/, /- -|--/, /(?<![\d.,}{\w])1(?:t|k|\\lambda|\\mu|\\alpha|\\beta)\b/, /(?<![\d.,}])-?1\\,\\vec/, /\\frac\{1\}\{1\}/]
function nice(latex: string): string | null {
  const problem = latexProblem(latex, { checkUgly: false })
  if (problem) return problem
  const ugly = UGLY.find((re) => re.test(latex))
  if (ugly) return `unschön (${ugly.source}) in ${latex}`
  const links = latex.split(' = ').map((x) => x.trim())
  return links.some((x, i) => i > 0 && x === links[i - 1]) ? `doppeltes Glied in ${latex}` : null
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
    case 'basisComb':
      expect(sameVec(add(scale(ans[0], d.a), scale(ans[1], d.b)), d.v), context).toBe(true)
      return
    case 'basisSpan': {
      const inSpan = distToSpan(d.a, d.b, d.v) < 1e-9
      expect(ans[0], context).toBe(inSpan ? 0 : 1)
      return
    }
    case 'basisIndep': {
      const vs = [d.v0, d.v1, ...(d.v2 ? [d.v2] : [])]
      const D = vs.length === 2 ? vs[0][0] * vs[1][1] - vs[0][1] * vs[1][0] : det3(vs[0], vs[1], vs[2])
      expect(close(ans[0], D), context).toBe(true)
      expect(ans[1], context).toBe(rank(vs) < vs.length ? 1 : 0)
      return
    }
    case 'basisDim': {
      const vs = [d.v0, d.v1, d.v2, ...(d.v3 ? [d.v3] : [])]
      expect(ans[0], context).toBe(rank(vs))
      return
    }
    case 'basisCoords':
      expect(sameVec(add(add(scale(ans[0], d.a), scale(ans[1], d.b)), scale(ans[2], d.c)), d.v), context).toBe(true)
      expect(Math.abs(det3(d.a, d.b, d.c)), context).toBeGreaterThan(0.5)
      return
    case 'basisSpanParam': {
      const v = (t: number) => add(d.base, scale(t, d.slope))
      expect(distToSpan(d.a, d.b, v(ans[0])), context).toBeLessThan(1e-9)
      expect(distToSpan(d.a, d.b, v(ans[0] + 0.37)), context).toBeGreaterThan(1e-6)
      return
    }
    case 'basisParam': {
      const c = (t: number) => d.c.map((x, i) => (i === d.j[0] ? x + t : x))
      expect(Math.abs(det3(d.a, d.b, c(ans[0]))), context).toBeLessThan(1e-9)
      expect(Math.abs(det3(d.a, d.b, c(ans[0] + 0.37))), context).toBeGreaterThan(1e-6)
      if (ans.length === 3) expect(sameVec(add(scale(ans[1], d.a), scale(ans[2], d.b)), c(ans[0])), context).toBe(true)
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
  expectRenderable(drawing.caption, context)
  for (const a of drawing.arrows) if (a.label) expect(nice(a.label), `${context}: ${a.label}`).toBeNull()
}

// Gleichungssystem aus einer Antwort: Zeilen „… = …" mit den Unbekannten; erfüllen die Werte xs alle Zeilen?
function satisfies(content: string, unk: readonly string[], xs: readonly number[], t?: { name: string; value: number }): boolean | null {
  const body = /\\begin\{array\}\{ll\} (.*) \\end\{array\}/.exec(content)?.[1]
  if (!body) return null
  return body.split(' \\\\ ').every((line) => {
    const [lhs, rhs] = line.replace(/^\\text\{[^}]*\} & /, '').split(' = ')
    const value = (side: string, names: readonly string[], vals: readonly number[]) => {
      let s = side.replace(/ /g, '')
      names.forEach((n, i) => {
        s = s.replaceAll(new RegExp(`(\\d*)${n.replace('\\', '\\\\')}(?![a-z])`, 'g'), (_, k: string) => `+(${k === '' ? 1 : k})*(${vals[i]})`)
      })
      s = s.replace(/\+\+/g, '+').replace(/-\+/g, '-').replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '($1/$2)')
      return Function(`return (${s})`)() as number
    }
    const names = t ? [...unk, t.name] : unk
    const vals = t ? [...xs, t.value] : xs
    return close(value(lhs, names, vals), value(rhs, names, vals))
  })
}

describe('Vektoren: Linearkombination und Basis', () => {
  const cells = LEVELS.map((level) => [level] as const)

  it.each(cells)('Stufe %i: Ergebnis stimmt mit der Gegenprobe, Schritte und Antworten sind vollständig', (level) => {
    for (const task of tasks(level, 150)) {
      const context = `${level}-${task.ref.seed} ${task.form}`
      check(task, context)
      expect(BASIS_KINDS_BY_LEVEL[level], context).toContain(task.kind)
      expectRenderable(task.instruction, context)
      expect(latexProblem(task.functionLatex!, { checkUgly: false }), context).toBeNull()
      expect(nice(task.resultLatex!), context).toBeNull()
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
      const dim = Math.max(...Object.values(task.data).map((v) => v.length))
      if (dim <= 3) expect(task.resultDrawing, context).toBeDefined()
      if (task.resultDrawing) checkDrawing(task.resultDrawing, context)
    }
  })

  it('Bild zum Ergebnis: Die Vielfachen hängen aneinander und treffen das Ziel (oder verfehlen es rot), die Ebene enthält die Pfeile', () => {
    let chains = 0
    let misses = 0
    let planes = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 100)) {
        const d = task.resultDrawing
        if (!d) continue
        const links = d.arrows.filter((a) => (a.phase ?? 0) > 0)
        const target = d.arrows.find((a) => a.color === 'r')
        if (links.length && target) {
          // jedes Glied beginnt an der Spitze des vorigen
          links.forEach((a, i) => expect(sameVec(a.from, i === 0 ? target.from : links[i - 1].to), task.form).toBe(true))
          const end = links.at(-1)!.to
          const miss = d.segments.find((s) => s.color === 'bad')
          if (task.kind === 'basisSpan' && task.answer[0] === 1) {
            expect(miss, task.form).toBeDefined()
            expect(sameVec(end, target.to), task.form).toBe(false)
            misses++
          } else {
            expect(miss, task.form).toBeUndefined()
            expect(sameVec(end, target.to), task.form).toBe(true)
          }
          chains++
        }
        const plane = d.polygons.find((p) => p.color === 'muted' && p.points.length === 4 && !p.phase)
        if (plane && d.dim === 3 && task.kind !== 'basisIndep' && task.kind !== 'basisDim') {
          const [p0, p1, p2] = plane.points
          const [u, w] = [sub(p1, p0), sub(p2, p0)]
          // alle Pfeile außer dem verfehlten Ziel liegen in der Ebene (sie geht durch den Ursprung)
          for (const a of d.arrows) if (!(task.kind === 'basisSpan' && task.answer[0] === 1 && a.color === 'r')) expect(Math.abs(det3(u, w, a.to)), task.form).toBeLessThan(1e-6)
          planes++
        }
      }
    }
    expect(chains).toBeGreaterThan(250)
    expect(misses).toBeGreaterThan(10)
    expect(planes).toBeGreaterThan(150)
  })

  it('vor dem Ergebnis verrät kein Bild die Antwort', () => {
    let hidden = 0
    for (const level of LEVELS)
      for (const task of tasks(level, 100))
        for (const step of task.steps) {
          const d = step.drawing
          if (!d) continue
          expect(d.arrows.some((a) => (a.phase ?? 0) > 0), task.form).toBe(false)
          if (['basisSpan', 'basisSpanParam', 'basisParam'].includes(task.kind)) {
            expect(d.arrows.length, task.form).toBe(2)
            hidden++
          }
          if (task.kind === 'basisIndep') {
            // in der Ebene gar kein Bild (zwei Pfeile auf einer Geraden verrieten „abhängig“), im Raum ohne den dritten
            expect(d.dim, task.form).toBe(3)
            expect(d.arrows.some((a) => a.color === 'c'), task.form).toBe(false)
          }
          expect(d.segments.some((s) => s.color === 'bad'), task.form).toBe(false)
        }
    expect(hidden).toBeGreaterThan(100)
  })

  // Regel aus CLAUDE.md: falsche Antworten nie gleichwertig zur Lösung. Zahlen nach Wert; Gleichungssysteme: Die Lösung
  // erfüllt kein falsches System
  it('keine falsche Antwort ist so viel wert wie die richtige', () => {
    const values = (content: string) => readResult(content)?.flatMap((p) => p.values) ?? null
    let compared = 0
    let systems = 0
    for (const level of LEVELS) {
      for (const task of tasks(level, 150)) {
        const unkMatch = /\$([^$]+?) \\vec \w \+ ([^$]+?) \\vec/.exec(task.instruction)
        for (const step of task.steps) {
          const correct = step.choices.find((c) => c.correct)!.content
          if (step.id === 'system' || step.id === 'eliminieren') {
            // Werte der Unbekannten aus dem Ergebnis (bei Parametern dazu t)
            const parts = readResult(task.resultLatex!)!
            const unk = parts.filter((p) => !/^[tk] =$/.test(p.label)).map((p) => p.label.replace(/ =$/, ''))
            const xs = parts.filter((p) => !/^[tk] =$/.test(p.label)).map((p) => p.values[0])
            const tPart = parts.find((p) => /^[tk] =$/.test(p.label))
            if (task.kind === 'basisSpan' || !unkMatch) continue
            const t = tPart ? { name: tPart.label[0], value: tPart.values[0] } : undefined
            const inner = task.kind === 'basisParam' ? null : satisfies(correct, unk, xs, t)
            if (inner === null) continue
            expect(inner, `${task.form} ${step.id}: richtig`).toBe(true)
            for (const c of step.choices.filter((c) => !c.correct)) expect(satisfies(c.content, unk, xs, t), `${task.form} ${step.id}: ${c.content}`).toBe(false)
            systems++
            continue
          }
          // Antworten mit Begründung als Text: Werte darin sind keine Ergebnisse
          if (['unabhaengig', 'probe', 'faustregel', 'basis'].includes(step.id)) continue
          const right = values(correct)
          for (const c of step.choices.filter((c) => !c.correct)) {
            expect(c.content, `${task.form} ${step.id}`).not.toBe(correct)
            const wrong = values(c.content)
            if (right && wrong && wrong.length === right.length) {
              expect(wrong.every((x, i) => close(x, right[i])), `${task.form} ${step.id}: ${c.content}`).toBe(false)
              compared++
            }
          }
        }
      }
    }
    expect(compared).toBeGreaterThan(1500)
    expect(systems).toBeGreaterThan(200)
  })

  // Fund der unabhängigen Prüfung (Schritt 5): vertauschte Werte bei gleichen Faktoren gaben dieselbe, also richtige Probe
  it('Probe: jede falsche Antwort hat einen anderen Wert oder einen anderen Schluss', () => {
    const numbers = (text: string) => [...text.matchAll(/= (-?\d+)(?: \\ne|\$)/g)].map((x) => Number(x[1]))
    const verdicts = (text: string) => [...text.matchAll(/stimmt( nicht)?/g)].map((x) => !!x[1])
    const end = (text: string) => /(nicht )?im Spann\.$|keine Lösung\.$/.exec(text)?.[0] ?? ''
    let probes = 0
    for (const level of LEVELS)
      for (const task of tasks(level, 200))
        for (const step of task.steps.filter((st) => st.id === 'probe')) {
          const right = step.choices.find((c) => c.correct)!.content
          for (const c of step.choices.filter((c) => !c.correct)) {
            const same = JSON.stringify(numbers(c.content)) === JSON.stringify(numbers(right)) && JSON.stringify(verdicts(c.content)) === JSON.stringify(verdicts(right)) && end(c.content) === end(right)
            if (c.errorRuleId !== 'vec-lc-span-denied' && c.errorRuleId !== 'vec-lc-no-check') expect(same, `${task.form}: ${c.content}`).toBe(false)
            else expect(end(c.content) === end(right) && c.content.endsWith(right.slice(-12)), `${task.form}: ${c.content}`).toBe(false)
          }
          probes++
        }
    expect(probes).toBeGreaterThan(250)
  })

  it('nutzt jeden neuen Fehler des Schritts 5', () => {
    const used = new Set<string>()
    for (const level of LEVELS) for (const task of tasks(level, 200)) for (const step of task.steps) for (const c of step.choices) if (c.errorRuleId) used.add(c.errorRuleId)
    const fresh = VECTOR_ERROR_RULES.map((r) => r.id).filter((id) => /^vec-(lc|gauss|backsub|indep|dim|det2)-/.test(id))
    expect(fresh.length).toBe(20)
    expect(fresh.filter((id) => !used.has(id))).toEqual([])
  })

  it('freier Modus: unabhängig oder abhängig und im Spann oder nicht zum Antippen, Zahlen je Kästchen', () => {
    const indep = tasks(1, 80).find((t) => t.kind === 'basisIndep' && t.answer[1] === 0)!
    const ci = prepareVectorCheck(indep)
    expect(ci.parts[1].options).toEqual(INDEPENDENCE)
    const D = String(indep.answer[0])
    expect(checkVectorEntries(ci, [[D], ['linear unabhängig']]).kind).toBe('correct')
    const swapped = checkVectorEntries(ci, [[D], ['linear abhängig']])
    expect(swapped.kind).toBe('wrong')
    expect(swapped.error?.id).toBe('vec-indep-swapped')

    const span = tasks(2, 80).find((t) => t.kind === 'basisSpan' && t.answer[0] === 1)!
    const cs = prepareVectorCheck(span)
    expect(cs.parts[0].options).toEqual(SPAN_ANSWERS)
    expect(checkVectorEntries(cs, [['nicht im Spann']]).kind).toBe('correct')
    expect(checkVectorEntries(cs, [['im Spann']]).error?.id).toBe('vec-lc-no-check')
    const inside = prepareVectorCheck(tasks(2, 80).find((t) => t.kind === 'basisSpan' && t.answer[0] === 0)!)
    expect(checkVectorEntries(inside, [['nicht im Spann']]).error?.id).toBe('vec-lc-span-denied')

    const comb = tasks(1, 80).find((t) => t.kind === 'basisComb')!
    const cc = prepareVectorCheck(comb)
    expect(cc.parts.map((p) => p.shape)).toEqual(['number', 'number'])
    expect(checkVectorEntries(cc, comb.answer.map((x) => [String(x)])).kind).toBe('correct')
    // vertauscht: typischer Fehler aus dem Schritt, der λ liefert
    const swappedComb = checkVectorEntries(cc, [[String(comb.answer[1])], [String(comb.answer[0])]])
    expect(swappedComb.kind).toBe('wrong')
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

describe('Vektoren: Lernkarten zu Linearkombination und Basis', () => {
  it('jedes Beispiel ist eine Aufgabe der genannten Art, die Gegenprobe stimmt', () => {
    const kinds = new Set(Object.values(BASIS_KINDS_BY_LEVEL).flat())
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
    expect(examples).toBe(10)
  })
})
