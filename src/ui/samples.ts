// Schreibweise-Beispiele für die Formel-Galerie, damit man sie mit dem Skript vergleichen kann.
// (Die Stufen der Themen mit ihren Vorschau-Formeln stehen in catalog.ts.)

export type NotationSample = {
  label: string
  tex: string
}

export const notationSamples: NotationSample[] = [
  { label: 'Bruch', tex: String.raw`\frac{x^2+1}{x-1}` },
  { label: 'Wurzeln', tex: String.raw`\sqrt{1+x^2}, \quad \sqrt[3]{x^2}` },
  { label: 'Exponenten', tex: String.raw`e^{-3x}, \quad x^{\frac{2}{3}}` },
  { label: 'Dezimalkomma und Malpunkt', tex: String.raw`1{,}5 \cdot 10^3` },
  { label: 'Logarithmen', tex: String.raw`\ln x, \quad \log_2 x` },
  { label: 'Ableitung', tex: String.raw`f'(x)` },
]
