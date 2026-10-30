// Schreibweise-Beispiele für die Formel-Galerie, damit man sie mit dem Skript vergleichen kann.
// (Die Stufen der Themen mit ihren Vorschau-Formeln stehen in catalog.ts.)

export type NotationSample = {
  label: string
  tex: string
}

export type NotationGroup = {
  title: string
  // Hinweis unter der Überschrift (Text ohne Formeln)
  note?: string
  samples: NotationSample[]
}

export const notationGroups: NotationGroup[] = [
  {
    title: 'In den Aufgaben',
    samples: [
      { label: 'Bruch', tex: String.raw`\frac{x^2+1}{x-1}` },
      { label: 'Wurzeln', tex: String.raw`\sqrt{1+x^2}, \quad \sqrt[3]{x^2}` },
      { label: 'Exponenten', tex: String.raw`e^{-3x}, \quad x^{\frac{2}{3}}` },
      { label: 'Dezimalkomma und Malpunkt', tex: String.raw`1{,}5 \cdot 10^3` },
      { label: 'Logarithmen', tex: String.raw`\ln x, \quad \log_2 x` },
      { label: 'Ableitung', tex: String.raw`f'(x)` },
    ],
  },
  {
    title: 'Kommt mit Stufe 5 von „Gleichungen umstellen“',
    note: 'Diese Zeichen gibt es in Aufgaben erst ab Schritt 5 und 6 von Meilenstein 3. So werden sie dann gesetzt.',
    samples: [
      { label: 'Ableitung als Rechenzeichen', tex: String.raw`\frac{\mathrm{d}}{\mathrm{d}x}\left(x\sqrt{x^2 + a^2}\right)` },
      { label: 'Integral', tex: String.raw`\int_a^x \frac{\mathrm{d}t}{t(t + b)}` },
      { label: 'Summe und Reihe', tex: String.raw`\sum_{k=0}^{n-1} a q^k, \quad \sum_{k=1}^{\infty} k x^k` },
      { label: 'Grenzwert', tex: String.raw`\lim_{n \to \infty}\left(1 + \frac{x}{n}\right)^n` },
      { label: 'Komplexe Zahlen', tex: String.raw`\left\lvert x + a\,\mathrm{i} \right\rvert, \quad \arg z` },
      { label: 'Determinante', tex: String.raw`\det\begin{pmatrix} e^{x} & e^{-x} \\ a & b \end{pmatrix}` },
      { label: 'Vektor', tex: String.raw`\vec{u} = \begin{pmatrix} x \\ a \\ b \end{pmatrix}` },
      { label: 'Umkehrfunktionen', tex: String.raw`\arcsin x, \quad \arctan\frac{y + 1}{y - 1}` },
    ],
  },
]
