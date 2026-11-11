import { describe, expect, it } from 'vitest'
import { GENERATED_MIN } from '../../quiz/numbers.ts'
import type { Level } from '../../tasks/taskNumber.ts'
import { elementBySymbol } from '../elements.ts'
import { generatedCalc } from './index.ts'
import { EXAM_PARTICLES, isExamParticle } from './particles.ts'

// Teilchen der Altklausuren und des Übungsblatts (docs/CHEMIE.md §9) kommen in keiner Form vor: nicht als
// Kernsymbol, nicht in der Tabelle mit Lücken, nicht als eines von zwei Teilchen

const COURSE = 'chem-atombau'
const LEVELS: readonly Level[] = [1, 2, 3]
// „$\ce{^{37}_{17}Cl^-}$: 17 Protonen, …" → Massenzahl, Symbol, Ladung
const LINE = /^\$\\ce\{\^\{(\d+)\}_\{\d+\}([A-Z][a-z]?)(?:\^(?:\{(\d)([+-])\}|([+-])))?\}\$:/

describe('Protonen, Neutronen, Elektronen: keine Teilchen aus Altklausuren und Übungsblatt', () => {
  it('kennt die vier Teilchen', () => {
    expect(EXAM_PARTICLES).toHaveLength(4)
    const t = (symbol: string, a: number, q: number) => ({ el: elementBySymbol(symbol)!, a, q })
    expect(isExamParticle(t('Fe', 56, 0))).toBe(true)
    expect(isExamParticle(t('Cl', 35, 0))).toBe(true)
    expect(isExamParticle(t('Na', 23, 0))).toBe(true)
    expect(isExamParticle(t('Cl', 35, -1))).toBe(true)
    // andere Isotope und Ladungen bleiben erlaubt
    expect(isExamParticle(t('Fe', 56, 2))).toBe(false)
    expect(isExamParticle(t('Cl', 37, -1))).toBe(false)
    expect(isExamParticle(t('Na', 23, 1))).toBe(false)
  })

  it.each(LEVELS)('Stufe %i: erzeugt keines davon', (level) => {
    let lines = 0
    for (let i = 0; i < 3000; i++) {
      const calc = generatedCalc(COURSE, { level, seed: GENERATED_MIN + i })!
      if (!calc.form.startsWith('pne:')) continue
      for (const line of calc.task.resultText!.split('\n')) {
        const m = LINE.exec(line)
        expect(m, line).not.toBeNull()
        const [, a, symbol, size, sign, single] = m!
        const q = sign ? Number(size) * (sign === '+' ? 1 : -1) : single ? (single === '+' ? 1 : -1) : 0
        expect(isExamParticle({ el: elementBySymbol(symbol)!, a: Number(a), q }), line).toBe(false)
        lines++
      }
    }
    expect(lines).toBeGreaterThan(300)
  })
})
