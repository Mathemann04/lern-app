import { describe, expect, it } from 'vitest'
import { parseLatex } from '../parse/latex.ts'
import { LEVELS, type Level, blockSeed } from '../tasks/taskNumber.ts'
import { VECTOR_ERROR_RULES } from './errorRules.ts'
import { type ResultPart, checkVectorEntries, isFinishedNumber, prepareVectorCheck, prepareVectorFreeTask, readResult } from './vectorFree.ts'
import { buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 1b: freier Modus mit Eingabe je Eintrag. Das gelesene Ergebnis passt zur Gegenprobe der Aufgabe (answer),
// die richtige Eingabe zählt, jede falsche Antwort eines Schritts wird als ihr typischer Fehler erkannt, falsche
// Einträge werden einzeln markiert.

// alle Bausteine: Nummern 1 bis 999 „Rechnen und Länge", ab 1000 „Skalarprodukt und Winkel" (Schritt 2), ab 2000
// „Projektion und Zerlegung" (Schritt 3a)
const ref = (level: Level, s: number) =>
  s < 1000 ? { level, seed: blockSeed('rechnen', s) } : s < 2000 ? { level, seed: blockSeed('skalar', s - 999) } : { level, seed: blockSeed('projektion', s - 1999) }
const SEEDS = (n: number) => [...Array.from({ length: n }, (_, i) => i + 1), ...Array.from({ length: n }, (_, i) => 1000 + i), ...Array.from({ length: n }, (_, i) => 2000 + i)]
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))

// Zahl als LaTeX, wie sie jemand eintippt: ganze Zahl, Bruch oder Kommazahl mit sechs Stellen (nur für falsche Werte)
function typed(x: number): string {
  if (Number.isInteger(x)) return String(x)
  for (let d = 2; d <= 60; d++) {
    const n = Math.round(x * d)
    if (close(n / d, x)) {
      const g = gcd(Math.abs(n), d)
      return `${n < 0 ? '-' : ''}\\frac{${Math.abs(n) / g}}{${d / g}}`
    }
  }
  return null as never
}
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

// Eingabe zu Werten eines Teils: Auswahl als Wort, Zeichen der Ungleichung, sonst Zahlen
const inputOf = (p: ResultPart, values: readonly number[]) =>
  p.shape === 'choice' ? [p.options![values[0]]] : p.shape === 'inequality' ? [values[0] > 0 ? '>' : '<', typed(values[1])] : values.map(typed)

// Einträge des richtigen Ergebnisses so, wie die Engine sie schreibt (Spalte, Punkt, Zahl, Lösungen)
function exactEntries(resultLatex: string): string[][] {
  return resultLatex.split(',\\;').flatMap((piece) => {
    const word = /^\s*\\text\{(\w+)\}\s*$/.exec(piece)
    if (word) return [[word[1]]]
    const ineq = /^\s*([a-z]|\\lambda) ([<>]) (.+)$/.exec(piece)
    if (ineq) return [[ineq[2], ineq[3].trim()]]
    const point = /\((.*)\)$/s.exec(piece.trim())
    if (point && !piece.includes('=')) return [point[1].split('\\mid').map((s) => s.trim())]
    const rhs = piece.slice(piece.indexOf(' = ') + 3).trim()
    const begin = rhs.indexOf('\\begin{pmatrix}')
    if (begin >= 0) {
      const prefix = rhs.slice(0, begin).trim()
      const entries = rhs.slice(begin + 15, rhs.indexOf('\\end{pmatrix}')).split('\\\\').map((s) => s.trim())
      return [prefix ? entries.map((e) => `${prefix}\\cdot ${e}`) : entries]
    }
    if (rhs.startsWith('\\pm')) return [[`-${rhs.slice(3).trim()}`, rhs.slice(3).trim()]]
    return [[rhs.replace('^\\circ', '')]]
  })
}

describe('Ergebnis lesen', () => {
  it('liest Vektor, Punkt, Zahl und Lösungen', () => {
    expect(readResult('\\overrightarrow{AB} = \\begin{pmatrix} 1 \\\\ -\\frac{1}{2} \\end{pmatrix}')).toEqual([{ shape: 'vector', label: '\\overrightarrow{AB} =', values: [1, -0.5] }])
    expect(readResult('Q(1 \\mid -2 \\mid 3)')).toEqual([{ shape: 'point', label: 'Q', values: [1, -2, 3] }])
    expect(readResult('\\lvert \\vec a \\rvert = 3\\sqrt{2}')![0].values[0]).toBeCloseTo(3 * Math.SQRT2)
    expect(readResult('t_1 = -3,\\; t_2 = 3')).toEqual([{ shape: 'solutions', label: 't', values: [-3, 3] }])
    expect(readResult('t_{1,2} = \\pm 2')).toEqual([{ shape: 'solutions', label: 't', values: [-2, 2] }])
    expect(readResult('\\vec a^{\\,0} = \\frac{1}{5}\\begin{pmatrix} 3 \\\\ 4 \\end{pmatrix}')![0].values.map((x) => Math.round(x * 1e9) / 1e9)).toEqual([0.6, 0.8])
    expect(readResult('Pfeil von $A$ nach $B$')).toBeNull()
  })

  it.each(LEVELS)('Stufe %i: das gelesene Ergebnis ist die Gegenprobe der Aufgabe', (level) => {
    for (const s of SEEDS(150)) {
      const task = buildVectorTask(ref(level, s))
      // Zieh-Aufgaben ohne eindeutiges Ergebnis prüft dragTasks.test.ts
      if (task.dragOnly) continue
      const parts = readResult(task.resultLatex!)
      expect(parts, task.resultLatex).not.toBeNull()
      const values = parts!.flatMap((p) => p.values)
      expect(values.length, task.resultLatex).toBe(task.answer.length)
      values.forEach((v, i) => expect(close(v, task.answer[i]), `${task.resultLatex}: ${values} gegen ${task.answer}`).toBe(true))
    }
  })
})

describe('fertig?', () => {
  const finished = (latex: string) => {
    const p = parseLatex(latex)
    if (!p.ok) throw new Error(latex)
    return isFinishedNumber(p.expr)
  }
  it('ganze Zahlen, gekürzte Brüche, Wurzeln ohne Quadrat sind fertig', () => {
    for (const s of ['3', '-3', '0', '0,5', '\\frac{1}{2}', '-\\frac{3}{4}', '\\frac{-3}{4}', '3\\sqrt{2}', '\\sqrt{14}', '\\frac{3}{\\sqrt{14}}', '\\frac{3\\sqrt{14}}{14}', '-\\frac{\\sqrt{2}}{2}'])
      expect(finished(s), s).toBe(true)
  })
  it('Rechnungen, ungekürzte Brüche und Wurzeln mit Quadrat sind nicht fertig', () => {
    for (const s of ['3-1', '\\frac{4}{2}', '\\frac{2}{4}', '\\sqrt{8}', '\\sqrt{4}', '\\frac{\\sqrt{2}}{\\sqrt{3}}', '\\frac{3}{1}', '1\\sqrt{2}', '--3', '2\\cdot 3', '\\frac{6\\sqrt{2}}{4}', '\\frac{2}{\\sqrt{2}}', '\\frac{3}{\\sqrt{6}}'])
      expect(finished(s), s).toBe(false)
  })
})

describe('prüfen', () => {
  it.each(LEVELS)('Stufe %i: die Einträge der Engine sind richtig, ein falscher Eintrag wird markiert', (level) => {
    for (const s of SEEDS(120)) {
      const task = buildVectorTask(ref(level, s))
      // Zieh-Aufgaben ohne eindeutiges Ergebnis prüft dragTasks.test.ts
      if (task.dragOnly) continue
      const free = prepareVectorFreeTask(ref(level, s))
      // t_1 und t_2 stehen im Ergebnis getrennt, im freien Modus in einem Teil: nach den Kästchen neu aufteilen
      const flat = exactEntries(task.resultLatex!).flat()
      const counts = free.entries!.map((g) => g.count)
      expect(flat.length, task.resultLatex).toBe(counts.reduce((a, b) => a + b, 0))
      const exact = counts.map((c, i) => flat.slice(counts.slice(0, i).reduce((a, b) => a + b, 0), counts.slice(0, i).reduce((a, b) => a + b, 0) + c))
      // so wie im Ergebnis (mit Faktor davor ausgeschrieben) ist es richtig, aber beim Einheitsvektor nicht fertig
      const plain = free.checkEntries!(exact)
      expect(['correct', 'unfinished'], `${task.resultLatex}: ${plain.title}`).toContain(plain.kind)
      if (!task.resultLatex!.includes('}\\begin{pmatrix}')) expect(plain.kind, task.resultLatex).toBe('correct')
      // ein Eintrag um 1 daneben: falsch, genau dieser markiert (der erste, der eine Zahl ist)
      const j0 = free.entries![0].shape === 'inequality' ? 1 : 0
      const wrongInput = exact.map((row, i) => row.map((e, j) => (i === 0 && j === j0 ? `${e}+1` : e)))
      const v = free.checkEntries!(wrongInput)
      expect(v.kind, task.resultLatex).toBe('wrong')
      if (free.entries![0].shape !== 'solutions') expect(v.marks![0], task.resultLatex).toEqual(exact[0].map((_, j) => j === j0))
    }
  })

  it.each(LEVELS)('Stufe %i: falsche Antworten des letzten Schritts werden als ihr typischer Fehler erkannt', (level) => {
    let found = 0
    for (const s of SEEDS(120)) {
      const task = buildVectorTask(ref(level, s))
      // Zieh-Aufgaben ohne eindeutiges Ergebnis prüft dragTasks.test.ts
      if (task.dragOnly) continue
      const check = prepareVectorCheck(task)
      check.parts.forEach((part, i) => {
        for (const w of check.wrongs[i]) {
          const input = check.parts.map((p, k) => inputOf(p, k === i ? w.values : p.values))
          if (input.flat().some((x) => x === null)) continue
          const v = checkVectorEntries(check, input)
          expect(v.kind, `${task.resultLatex}: ${input}`).toBe('wrong')
          // passt die Eingabe zu mehreren Fehlern, wird der erste genannt
          const first = check.wrongs[i].find((x) => x.values.every((y, j) => close(y, w.values[j])))!
          expect(v.error?.id, `${task.resultLatex}: ${input}`).toBe(first.rule)
          found++
          void part
        }
      })
    }
    expect(found).toBeGreaterThan(50)
  })

  it('zwei Lösungen: Reihenfolge egal, eine vergessen ist ein typischer Fehler', () => {
    const check = { parts: [{ shape: 'solutions' as const, label: 't', values: [-3, 3] }], wrongs: [[]] }
    expect(checkVectorEntries(check, [['3', '-3']]).kind).toBe('correct')
    const one = checkVectorEntries(check, [['3', '']])
    expect(one.error?.id).toBe('vec-one-solution')
    expect(one.marks).toEqual([[false, true]])
    expect(checkVectorEntries(check, [['3', '3']]).marks).toEqual([[false, true]])
  })

  it('Winkel in Grad, Art des Winkels und Ungleichung (Schritt 2)', () => {
    expect(readResult('\\varphi = 135^\\circ')).toEqual([{ shape: 'number', label: '\\varphi =', values: [135], suffix: '^\\circ' }])
    const angle = { parts: readResult('\\varphi = 60^\\circ')!, wrongs: [[]] }
    expect(checkVectorEntries(angle, [['60']]).kind).toBe('correct')
    expect(checkVectorEntries(angle, [['60^{\\circ}']]).kind).toBe('correct')
    const kind = prepareVectorCheck({ ...buildVectorTask(ref(1, 1)), resultLatex: '\\vec a \\cdot \\vec b = 5,\\; \\text{spitz}' })
    expect(kind.parts[1]).toMatchObject({ shape: 'choice', values: [0] })
    expect(checkVectorEntries(kind, [['5'], ['spitz']]).kind).toBe('correct')
    expect(checkVectorEntries(kind, [['5'], ['stumpf']]).error?.id).toBe('vec-angle-sign')
    expect(checkVectorEntries(kind, [['5'], ['rechtwinklig']]).error?.id).toBe('vec-angle-zero')
    expect(checkVectorEntries(kind, [['5'], ['']]).marks).toEqual([[false], [true]])
    const ineq = { parts: readResult('t > \\frac{3}{2}')!, wrongs: [[]] }
    expect(ineq.parts[0]).toMatchObject({ shape: 'inequality', label: 't', values: [1, 1.5] })
    expect(checkVectorEntries(ineq, [['>', '\\frac{3}{2}']]).kind).toBe('correct')
    expect(checkVectorEntries(ineq, [['<', '\\frac{3}{2}']]).marks).toEqual([[true, false]])
    expect(checkVectorEntries(ineq, [['>', '\\frac{6}{4}']]).kind).toBe('unfinished')
  })

  it('leer, unlesbar, gerundet, nicht fertig', () => {
    const check = { parts: [{ shape: 'vector' as const, label: '\\vec x =', values: [1 / 3, Math.SQRT2] }], wrongs: [[]] }
    expect(checkVectorEntries(check, [['', '']]).kind).toBe('unreadable')
    const missing = checkVectorEntries(check, [['\\frac{1}{3}', '']])
    expect(missing.kind).toBe('unreadable')
    expect(missing.marks).toEqual([[false, true]])
    expect(checkVectorEntries(check, [['x', '\\sqrt{2}']]).message).toContain('$x$')
    expect(checkVectorEntries(check, [['0,33', '\\sqrt{2}']]).kind).toBe('unfinished')
    const open = checkVectorEntries(check, [['\\frac{2}{6}', '\\sqrt{2}']])
    expect(open.kind).toBe('unfinished')
    expect(open.marks).toEqual([[true, false]])
    expect(checkVectorEntries(check, [['\\frac{1}{3}', '\\frac{2}{\\sqrt{2}}']]).kind).toBe('unfinished')
    expect(checkVectorEntries(check, [['\\frac{1}{3}', '\\sqrt{2}']]).kind).toBe('correct')
  })

  it('jeder Fehler, den der freie Modus erkennt, steht im Katalog', () => {
    const ids = new Set(VECTOR_ERROR_RULES.map((r) => r.id))
    for (const level of LEVELS)
      for (const s of SEEDS(60)) for (const ws of buildVectorTask(ref(level, s)).dragOnly ? [] : prepareVectorCheck(buildVectorTask(ref(level, s))).wrongs) for (const w of ws) expect(ids.has(w.rule), w.rule).toBe(true)
  })
})
