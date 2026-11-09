import { describe, expect, it } from 'vitest'
import { latexWidthEm } from './latexWidth.ts'

// Kalibrierung der Breitenschätzung: in Chromium gemessene Breiten (KaTeX wie in der App, \displaystyle,
// Aufgabe in text-2xl: 24 px Schrift, .katex 1,15em, also 27,6 px je em). Am Handy hat die Aufgabe 350 px
// Platz; die Grenze von 12 em im Baukasten (rearrangeTerms.ts) muss das sicher einhalten. Ändert sich die
// Schrift oder die Größe von .katex, stimmen die Messwerte nicht mehr: dann neu messen.
const PX_PER_EM = 27.6
const MEASURED: ReadonlyArray<readonly [string, number]> = [
  ['\\det\\begin{pmatrix} e^{x} & e^{-x} \\\\ a & b \\end{pmatrix} = y', 228],
  ['\\det\\begin{pmatrix} e^{x} & a \\\\ e^{-x} & b \\end{pmatrix} = y', 217.4],
  ['\\int_{0}^{x} e^{t}\\,\\mathrm{d}t = \\det\\begin{pmatrix} a & e^{x} \\\\ 1 & b \\end{pmatrix}', 283.6],
  ['\\det\\begin{pmatrix} x^{2} & a \\\\ x & b \\end{pmatrix} = y', 203.9],
  ['\\det\\begin{pmatrix} x + a & b \\\\ c & x - d \\end{pmatrix} = y', 290.4],
  ['\\det\\begin{pmatrix} \\cosh x & \\sinh x \\\\ a & b \\end{pmatrix} = y', 304.7],
  ['\\frac{\\det\\begin{pmatrix} e^{x} & a \\\\ e^{-x} & b \\end{pmatrix}}{c} = y', 224],
  ['c + 3\\det\\begin{pmatrix} e^{x} & a \\\\ e^{-x} & b \\end{pmatrix} = y', 281.4],
  ['\\sqrt{\\det\\begin{pmatrix} e^{x} & a \\\\ e^{-x} & b \\end{pmatrix}} = y', 245],
  ['\\ln\\left(\\det\\begin{pmatrix} e^{x} & a \\\\ e^{-x} & b \\end{pmatrix}\\right) = y', 285.6],
  ['\\ln\\left(\\det\\begin{pmatrix} x^{2} & a \\\\ x & b \\end{pmatrix}\\right) - c = y', 317.8],
  ['\\frac{\\det\\begin{pmatrix} e^{x} + a & b \\\\ c & e^{-x} \\end{pmatrix}}{d} - g = h', 332.2],
  ['\\det\\begin{pmatrix} 1 & x & x^{2} \\\\ 1 & a & a^{2} \\\\ 1 & b & b^{2} \\end{pmatrix} = y', 254.1],
  ['\\det\\begin{pmatrix} x & a & 0 \\\\ b & x & c \\\\ 0 & d & 1 \\end{pmatrix} = y', 243.1],
  ['\\det\\begin{pmatrix} e^{x} + a & b & 0 \\\\ c & e^{-x} & 1 \\\\ 1 & 0 & d \\end{pmatrix} = y', 326],
  ['\\frac{\\det\\begin{pmatrix} 1 & x & x^{2} \\\\ 1 & a & a^{2} \\\\ 1 & b & b^{2} \\end{pmatrix}}{c} - d = y', 308.8],
  ['\\ln\\left(\\det\\begin{pmatrix} e^{x} & a & 0 \\\\ b & e^{-x} & c \\\\ 0 & 1 & d \\end{pmatrix}\\right) = y', 353.5],
]
// Bruch in der Matrix: KaTeX setzt ihn dort kleiner, die Schätzung ist zu breit (auf der sicheren Seite)
const FRACTION_IN_MATRIX: ReadonlyArray<readonly [string, number]> = [
  ['\\det\\begin{pmatrix} \\frac{a}{x} & b \\\\ x & c \\end{pmatrix} = y', 192],
  ['\\det\\begin{pmatrix} \\frac{a}{x} & b \\\\ \\frac{c}{x + d} & 1 \\end{pmatrix} = y', 219],
]

describe('Breite einer Formel mit Matrix', () => {
  it.each(MEASURED)('%s: Schätzung auf 5 % genau', (latex, px) => {
    const ratio = px / (latexWidthEm(latex) * PX_PER_EM)
    expect(ratio).toBeGreaterThan(0.95)
    expect(ratio).toBeLessThan(1.05)
  })

  it.each(FRACTION_IN_MATRIX)('%s: Bruch in der Matrix eher zu breit geschätzt', (latex, px) => {
    const ratio = px / (latexWidthEm(latex) * PX_PER_EM)
    expect(ratio).toBeGreaterThan(0.85)
    expect(ratio).toBeLessThanOrEqual(1)
  })

  it('höchstens 12 em heißt: passt am Handy (350 px)', () => {
    for (const [latex, px] of [...MEASURED, ...FRACTION_IN_MATRIX]) if (latexWidthEm(latex) <= 12) expect(px, latex).toBeLessThanOrEqual(350)
    // die breiteste gemessene Formel fällt durch
    expect(latexWidthEm(MEASURED[MEASURED.length - 1][0])).toBeGreaterThan(12)
  })
})
