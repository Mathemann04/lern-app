import { describe, expect, it } from 'vitest'
import { latexProblem } from '../engine/expr/latexChecks.ts'
import { renderFormula } from './renderFormula.ts'
import { SUBJECTS } from './catalog.ts'
import { notationGroups } from './samples.ts'

// Vorschau-Formeln aller Stufen aller Themen und die Schreibweise-Beispiele der Galerie
const allSamples = [
  ...SUBJECTS.flatMap((s) => s.areas.flatMap((a) => a.courses.flatMap((c) => c.levels.flatMap((level) => level.examples)))),
  ...notationGroups.flatMap((group) => group.samples.map((sample) => sample.tex)),
]

describe('renderFormula', () => {
  it.each(allSamples)('setzt %s ohne Fehler', (tex) => {
    expect(renderFormula(tex)).toContain('class="katex"')
  })

  it('setzt chemische Formeln mit mhchem im strengen Modus', () => {
    for (const tex of [
      String.raw`\ce{^{14}_{6}C}`,
      String.raw`\ce{^{37}_{17}Cl^-}`,
      String.raw`\ce{^{40}_{20}Ca^{2+}}`,
      String.raw`\ce{SO4^2-}`,
      String.raw`\ce{CuSO4 * 5 H2O}`,
      String.raw`\ce{2 H2 + O2 -> 2 H2O}`,
      String.raw`\ce{N2 + 3 H2 <=> 2 NH3}`,
      String.raw`\pu{6,022e23 mol-1}`,
    ]) {
      expect(renderFormula(tex), tex).toContain('class="katex"')
      expect(latexProblem(tex, { checkUgly: false }), tex).toBeNull()
    }
  })

  it('meldet fehlerhaftes LaTeX, statt es still zu verschlucken', () => {
    expect(() => renderFormula(String.raw`\frac{1}{`)).toThrow()
  })
})

describe('Schreibweise der Vorschau-Formeln', () => {
  it.each(allSamples)('%s nutzt das Dezimalkomma ohne Leerraum ({,})', (tex) => {
    // Ein nacktes Komma zwischen Ziffern würde KaTeX mit Abstand setzen: „1, 5"
    expect(tex).not.toMatch(/\d,\d/)
  })

  it.each(allSamples)('%s nutzt den Malpunkt statt ×', (tex) => {
    expect(tex).not.toMatch(/\\times|×/)
  })
})
