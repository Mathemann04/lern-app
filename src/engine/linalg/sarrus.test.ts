import { describe, expect, it } from 'vitest'
import { latexProblem } from '../expr/latexChecks.ts'
import { cardsInTopic, isVectorExample } from '../explain/cards.ts'
import { LEVELS, blockSeed } from '../tasks/taskNumber.ts'
import { SARRUS_MINUS, SARRUS_PLUS, type SarrusFigure, sarrusProducts } from './sarrus.ts'
import { readResult } from './vectorFree.ts'
import { buildVectorTask } from './vectorTasks.ts'

// M7 Schritt 9b: Sarrus als Bild zum Abspielen. Jeder Schritt mit Sarrus (Determinanten, Spatprodukt, Linearkombination
// und Basis) hat ein Schema; die Diagonalen des Bildes laufen durch die richtigen Felder (nachgerechnet mit Kommazahlen
// gegen Laplace, nicht mit der Rechnung der Engine), die Rechnung im Bild ist die der Erklärung, und alles lässt sich setzen.

const BLOCKS = ['determinante', 'spat', 'basis'] as const
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
const laplace3 = (A: number[][]) =>
  A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])

// Zahl aus einem Eintrag (ganze Zahl oder Bruch), sonst NaN (Parameter)
function value(tex: string): number {
  const f = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(tex)
  if (f) return (f[1] ? -1 : 1) * (Number(f[2]) / Number(f[3]))
  return /^-?\d+$/.test(tex) ? Number(tex) : Number.NaN
}

function sarrusSteps() {
  const out: { form: string; title: string; detailed: string; correct: string; sarrus: SarrusFigure }[] = []
  let withoutFigure = 0
  for (const block of BLOCKS)
    for (const level of LEVELS)
      for (let s = 1; s <= 80; s++) {
        const task = buildVectorTask({ level, seed: blockSeed(block, s) })
        for (const step of task.steps) {
          const isSarrus = step.title.includes('Sarrus')
          if (isSarrus && !step.sarrus) withoutFigure++
          if (!isSarrus) expect(step.sarrus, `${task.form} ${step.id}`).toBeUndefined()
          if (step.sarrus) out.push({ form: task.form, title: step.title, detailed: step.explanation.detailed, correct: step.choices.find((c) => c.correct)!.content, sarrus: step.sarrus })
        }
      }
  return { out, withoutFigure }
}

describe('Sarrus als Bild (M7 Schritt 9b)', () => {
  const { out, withoutFigure } = sarrusSteps()

  it('jeder Schritt mit Sarrus hat ein Schema, und es gibt genug davon in allen drei Bausteinen', () => {
    expect(withoutFigure).toBe(0)
    expect(out.length).toBeGreaterThan(300)
    for (const prefix of ['det', 'spat', 'basis']) expect(out.some((o) => o.form.replace(/^\d:/, '').startsWith(prefix)), prefix).toBe(true)
  })

  it('Diagonalen: sechs, je drei Felder aus verschiedenen Zeilen, jede Spalte der Matrix genau einmal', () => {
    for (const d of [...SARRUS_PLUS, ...SARRUS_MINUS]) {
      expect(d.map(([r]) => r)).toEqual([0, 1, 2])
      expect(d.map(([, c]) => c % 3).sort()).toEqual([0, 1, 2])
      for (const [, c] of d) expect(c >= 0 && c < 5).toBe(true)
    }
    // nach rechts unten bzw. links unten
    for (const d of SARRUS_PLUS) expect(d[2][1] - d[0][1]).toBe(2)
    for (const d of SARRUS_MINUS) expect(d[2][1] - d[0][1]).toBe(-2)
  })

  it('ohne Parameter: Plus minus Minus entlang der Diagonalen des Bildes ist die Determinante (Laplace) und die richtige Antwort', () => {
    let checked = 0
    for (const o of out) {
      const A = o.sarrus.matrix.map((r) => r.map(value))
      if (A.flat().some(Number.isNaN)) continue
      const along = (d: readonly (readonly [number, number])[]) => d.reduce((p, [r, c]) => p * A[r][c % 3], 1)
      const pictured = SARRUS_PLUS.reduce((s, d) => s + along(d), 0) - SARRUS_MINUS.reduce((s, d) => s + along(d), 0)
      expect(close(pictured, laplace3(A)), o.form).toBe(true)
      expect(close(pictured, readResult(o.correct)![0].values[0]), o.form).toBe(true)
      expect(close(pictured, value(o.sarrus.result)), o.form).toBe(true)
      checked++
    }
    expect(checked).toBeGreaterThan(200)
  })

  it('die Rechnung im Bild steht so in der Erklärung, und jede Zeile lässt sich setzen', () => {
    for (const o of out) {
      const f = o.sarrus
      expect(o.detailed, o.form).toContain(`${f.name} = ${sarrusProducts(f)}${f.values === '' ? '' : ` = ${f.values}`} = ${f.result}`)
      expect(o.correct, o.form).toContain(f.result)
      for (const tex of [...f.matrix.flat(), `${f.name} = ${sarrusProducts(f)}`, `= ${f.values === '' ? '' : `${f.values} = `}${f.result}`]) expect(latexProblem(tex, { checkUgly: false }), o.form).toBeNull()
      // mit Parameter keine ausgerechneten Produkte (die Erklärung zeigt dort auch keine)
      if (f.matrix.flat().some((x) => Number.isNaN(value(x)))) expect(f.values, o.form).toBe('')
    }
  })

  it('Lernkarten: das Beispiel der Karte „Sarrus“ zeigt ein Schema', () => {
    const card = cardsInTopic('matrizen').find((c) => c.id === 'det-sarrus')!
    expect(card).toBeDefined()
    const ex = card.examples.find(isVectorExample)!
    const task = buildVectorTask({ level: ex.vector.level, seed: blockSeed('rechnen', ex.vector.seed) }, ex.vector.kind)
    expect(task.steps.filter((s) => s.sarrus)).toHaveLength(1)
  })
})
