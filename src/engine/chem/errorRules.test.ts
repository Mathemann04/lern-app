import { describe, expect, it } from 'vitest'
import { findError } from '../errorCatalog.ts'
import { parseRichText } from '../explain/richText.ts'
import { latexProblem } from '../expr/latexChecks.ts'
import { formatText } from '../quantity/numberDe.ts'
import { elementBySymbol } from './elements.ts'
import { CHEM_ERROR_RULES } from './errorRules.ts'
import { generatorsOf } from './generators/index.ts'
import { lightValues } from './generators/light.ts'
import { type Field, type Particle, wrongValues } from './generators/particles.ts'

// Katalogbeispiele der Rechenfehler (docs/PLAN-M4.md, „Katalog der Rechenfehler"): Jeder Fehler ergibt
// genau den Wert aus dem Katalog; dazu Name, Formel und eigener Text „Warum ist das falsch?".

const cl37: Particle = { el: elementBySymbol('Cl')!, a: 37, q: -1 }
const cl37atom: Particle = { ...cl37, q: 0 }

// Wert eines Fehlers in einem Schritt; given: was in der Aufgabe steht
function valueOf(t: Particle, field: Field, given: readonly Field[], rule: string): string | undefined {
  return wrongValues(t, field, new Set(given)).find((w) => w.rule === rule)?.content
}

describe('Rechenfehler: Katalogbeispiele', () => {
  it('Neutronen gleich Massenzahl: ³⁷Cl⁻ mit 37 Neutronen', () => {
    expect(valueOf(cl37, 'n', ['element', 'a', 'q'], 'chem-neutrons-mass-number')).toBe('$37$')
  })

  it('Protonen und Neutronen vertauscht: ³⁷Cl⁻ mit 20 Protonen und 17 Neutronen', () => {
    expect(valueOf(cl37, 'p', ['element', 'a', 'q'], 'chem-protons-neutrons-swapped')).toBe('$20$')
    expect(valueOf(cl37, 'n', ['element', 'a', 'q'], 'chem-protons-neutrons-swapped')).toBe('$17$')
  })

  it('Ionenladung vergessen: ³⁷Cl⁻ mit 17 Elektronen', () => {
    expect(valueOf(cl37, 'e', ['element', 'a', 'q'], 'chem-ion-charge-ignored')).toBe('$17$')
  })

  it('Ladung mit falschem Vorzeichen: ³⁷Cl⁻ mit 16 Elektronen', () => {
    expect(valueOf(cl37, 'e', ['element', 'a', 'q'], 'chem-ion-charge-sign')).toBe('$16$')
  })

  it('Massenzahl als Ordnungszahl: A = 37, Z = 17 ergibt Rubidium statt Chlor', () => {
    expect(valueOf(cl37, 'element', ['p', 'a', 'q'], 'chem-element-from-mass')).toContain(String.raw`\ce{Rb}`)
  })

  it('Elektronen statt Protonen gezählt: ³⁷Cl⁻ mit N = 37 − 18 = 19', () => {
    expect(valueOf(cl37, 'n', ['element', 'a', 'e'], 'chem-electrons-as-protons')).toBe('$19$')
  })

  it('Elektronen zur Massenzahl gezählt: 17 Protonen und 20 Neutronen ergeben A = 54', () => {
    expect(valueOf(cl37atom, 'a', ['p', 'n', 'e'], 'chem-mass-number-electrons')).toBe('$54$')
  })

  it('Nanometer nicht umgerechnet: 500 nm ergibt 3,98 · 10⁻²⁸ J statt 3,98 · 10⁻¹⁹ J', () => {
    const { correct, wrong } = lightValues('energy', 500)
    expect(formatText(correct)).toBe('3,98 · 10⁻¹⁹')
    expect(formatText(wrong.find((w) => w.rule === 'chem-light-nm')!.value)).toBe('3,98 · 10⁻²⁸')
  })

  it('Formel falsch umgestellt: E = h · λ / c', () => {
    const { wrong } = lightValues('energy', 500)
    // 6,626 · 10⁻³⁴ · 5 · 10⁻⁷ / (3 · 10⁸) ≈ 1,10 · 10⁻⁴⁸
    expect(formatText(wrong.find((w) => w.rule === 'chem-light-formula')!.value)).toBe('1,1 · 10⁻⁴⁸')
  })
})

describe('Rechenfehler: Namen und Texte', () => {
  it('haben eindeutige Ids, stehen in der Fehlerstatistik und haben eigene Texte', () => {
    const ids = CHEM_ERROR_RULES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    const texts = new Set<string>()
    for (const rule of CHEM_ERROR_RULES) {
      expect(rule.id).toMatch(/^chem-(?!mis-)[a-z0-9-]+$/)
      expect(findError(rule.id)?.wrongFormula, rule.id).toBe(rule.wrongFormula)
      expect(latexProblem(rule.wrongFormula, { checkUgly: false }), rule.id).toBeNull()
      for (const text of [rule.name, rule.why.detailed, rule.why.short]) {
        for (const s of parseRichText(text).flat()) if (s.kind === 'math') expect(latexProblem(s.latex, { checkUgly: false }), rule.id).toBeNull()
      }
      expect(texts.has(rule.why.detailed), rule.id).toBe(false)
      texts.add(rule.why.detailed)
    }
  })

  it('kommen jeweils in einer Rechnung vor', () => {
    const used = new Set([1, 2, 3, 4, 5].flatMap((level) => generatorsOf('chem-atombau', level as 1).flatMap((g) => g.errors)))
    expect(CHEM_ERROR_RULES.map((r) => r.id).filter((id) => !used.has(id))).toEqual([])
  })
})
