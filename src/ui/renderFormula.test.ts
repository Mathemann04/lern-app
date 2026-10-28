import { describe, expect, it } from 'vitest'
import { renderFormula } from './renderFormula.ts'
import { derivativeLevels, notationSamples } from './samples.ts'

const allSamples = [
  ...derivativeLevels.flatMap((level) => level.examples),
  ...notationSamples.map((sample) => sample.tex),
]

describe('renderFormula', () => {
  it.each(allSamples)('setzt %s ohne Fehler', (tex) => {
    expect(renderFormula(tex)).toContain('class="katex"')
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
