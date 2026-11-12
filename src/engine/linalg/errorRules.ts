import type { Explanation } from '../explain/texts.ts'

// Typische Fehler beim Rechnen mit Vektoren (M7, Katalog in docs/PLAN-M7.md, „Typische Fehler"). Jeder Fehler rechnet
// einen Schritt falsch weiter (vectorTasks.ts); hier stehen Name, Katalogbeispiel als Formel und „Warum ist das falsch?".
// Der Text nennt den Fehler und die Regel, verrät aber nicht das Ergebnis des Schritts.

export type VectorErrorRule = {
  readonly id: string
  // kurzer Name (Text mit Formeln)
  readonly name: string
  // Katalogbeispiel als Formel (LaTeX)
  readonly wrongFormula: string
  readonly why: Explanation
}

const col = (...xs: readonly (string | number)[]) => `\\begin{pmatrix} ${xs.join(' \\\\ ')} \\end{pmatrix}`

export const VECTOR_ERROR_RULES: readonly VectorErrorRule[] = [
  {
    id: 'vec-reversed',
    name: 'Falsch herum abgezogen',
    wrongFormula: String.raw`\overrightarrow{AB} = A - B`,
    why: {
      detailed: String.raw`Beim Abziehen zählt die Reihenfolge: $\vec a - \vec b$ zeigt genau entgegengesetzt zu $\vec b - \vec a$. Der Pfeil von $A$ nach $B$ beginnt bei $A$ und endet bei $B$. Merke: **Spitze minus Fuß**, also Ortsvektor des Endpunkts minus Ortsvektor des Anfangspunkts.`,
      short: String.raw`Spitze minus Fuß: Endpunkt minus Anfangspunkt, die Reihenfolge zählt.`,
    },
  },
  {
    id: 'vec-added-points',
    name: 'Punkte addiert statt abgezogen',
    wrongFormula: String.raw`\overrightarrow{AB} = A + B`,
    why: {
      detailed: String.raw`Der Verbindungsvektor ist der Weg von $A$ nach $B$. Um ihn zu bekommen, ziehst du ab, was beide gemeinsam haben: Endpunkt **minus** Anfangspunkt. Die Summe der Ortsvektoren führt zu einem ganz anderen Punkt.`,
      short: String.raw`Verbindungsvektor: Endpunkt minus Anfangspunkt, nicht plus.`,
    },
  },
  {
    id: 'vec-position-vector',
    name: 'Ortsvektor statt Verbindungsvektor',
    wrongFormula: String.raw`\overrightarrow{AB} = \overrightarrow{OB}`,
    why: {
      detailed: String.raw`Dieser Pfeil beginnt im Ursprung $O$. Das ist der Ortsvektor des Endpunkts. Der Verbindungsvektor beginnt aber beim Anfangspunkt der Strecke.`,
      short: String.raw`Ein Ortsvektor beginnt im Ursprung, der Verbindungsvektor beim Anfangspunkt.`,
    },
  },
  {
    id: 'vec-sign-slip',
    name: 'Vorzeichen übersehen',
    wrongFormula: String.raw`${col(2, 1)} - ${col(-3, 1)} = ${col(-1, 0)}`,
    why: {
      detailed: String.raw`Rechne Eintrag für Eintrag und achte auf negative Zahlen: Minus mal Minus ergibt Plus, z. B. $2 - (-3) = 2 + 3$, und Plus eine negative Zahl ist Minus, z. B. $2 + (-3) = 2 - 3$.`,
      short: String.raw`Eintrag für Eintrag rechnen: $2 - (-3) = 2 + 3$.`,
    },
  },
  {
    id: 'vec-scale-first',
    name: 'Nur einen Eintrag vervielfacht',
    wrongFormula: String.raw`3 ${col(2, -1)} = ${col(6, -1)}`,
    why: {
      detailed: String.raw`Eine Zahl vor einem Vektor streckt den ganzen Pfeil. Deshalb wird **jeder** Eintrag mit ihr malgenommen, nicht nur der erste.`,
      short: String.raw`Jeder Eintrag wird mit der Zahl malgenommen.`,
    },
  },
  {
    id: 'vec-length-no-root',
    name: 'Wurzel vergessen',
    wrongFormula: String.raw`\left\lvert ${col(3, 4)} \right\rvert = 3^2 + 4^2`,
    why: {
      detailed: String.raw`Nach Pythagoras ist die Summe der Quadrate das **Quadrat** der Länge. Die Länge selbst ist die Wurzel daraus: $\lvert \vec a \rvert = \sqrt{a_1^2 + a_2^2 + a_3^2}$. Genauso gilt bei $t^2 = c$: $t = \pm\sqrt{c}$.`,
      short: String.raw`Die Summe der Quadrate ist das Quadrat der Länge: Wurzel ziehen.`,
    },
  },
  {
    id: 'vec-length-abs-sum',
    name: 'Einträge einfach addiert',
    wrongFormula: String.raw`\left\lvert ${col(3, 4)} \right\rvert = 3 + 4`,
    why: {
      detailed: String.raw`Die Länge ist die Hypotenuse im rechtwinkligen Dreieck aus den Einträgen. Sie ist kürzer als die beiden Wege zusammen: $\sqrt{a^2 + b^2}$ ist nicht $a + b$. Erst quadrieren, dann addieren, dann die Wurzel ziehen.`,
      short: String.raw`$\sqrt{a^2 + b^2} \ne a + b$: erst quadrieren, dann addieren, dann Wurzel.`,
    },
  },
  {
    id: 'vec-square-sign',
    name: 'Quadrat einer negativen Zahl negativ',
    wrongFormula: String.raw`(-3)^2 = -9`,
    why: {
      detailed: String.raw`Ein Quadrat ist nie negativ: $(-3)^2 = (-3) \cdot (-3)$, und Minus mal Minus ergibt Plus. In der Längenformel zählt jeder Eintrag positiv, egal in welche Richtung der Pfeil zeigt.`,
      short: String.raw`$(-3)^2 = (-3) \cdot (-3)$ ist positiv.`,
    },
  },
  {
    id: 'vec-square-double',
    name: 'Quadrat mit Verdoppeln verwechselt',
    wrongFormula: String.raw`3^2 = 6`,
    why: {
      detailed: String.raw`Hoch 2 heißt: die Zahl mit sich selbst malnehmen, $3^2 = 3 \cdot 3$. Verdoppeln wäre $2 \cdot 3$.`,
      short: String.raw`$3^2 = 3 \cdot 3$, nicht $2 \cdot 3$.`,
    },
  },
  {
    id: 'vec-midpoint-half-diff',
    name: 'Halber Verbindungsvektor als Mittelpunkt',
    wrongFormula: String.raw`M = \tfrac{1}{2}(B - A)`,
    why: {
      detailed: String.raw`$\tfrac{1}{2}\,\overrightarrow{AB}$ ist nur der halbe **Weg** von $A$ nach $B$. Der Mittelpunkt liegt dort, wo dieser Weg ankommt, wenn er bei $A$ beginnt: $M = A + \tfrac{1}{2}(B - A) = \tfrac{1}{2}(A + B)$, der Durchschnitt der beiden Punkte.`,
      short: String.raw`Der Mittelpunkt ist der Durchschnitt: $M = \tfrac{1}{2}(A + B)$.`,
    },
  },
  {
    id: 'vec-midpoint-no-half',
    name: 'Halbieren vergessen',
    wrongFormula: String.raw`M = A + B`,
    why: {
      detailed: String.raw`Der Mittelpunkt ist der Durchschnitt der beiden Punkte: addieren **und** durch $2$ teilen, Eintrag für Eintrag.`,
      short: String.raw`Durchschnitt: addieren und durch $2$ teilen.`,
    },
  },
  {
    id: 'vec-unit-squared',
    name: 'Durch das Quadrat der Länge geteilt',
    wrongFormula: String.raw`\vec a^{\,0} = \frac{1}{\lvert \vec a \rvert^2}\,\vec a`,
    why: {
      detailed: String.raw`Ein Einheitsvektor hat die Länge $1$. Teilst du einen Vektor durch eine Zahl, wird seine Länge durch dieselbe Zahl geteilt. Damit genau $1$ herauskommt, teilst du durch die Länge selbst, nicht durch ihr Quadrat.`,
      short: String.raw`Durch die Länge teilen: $\vec a^{\,0} = \frac{1}{\lvert\vec a\rvert}\,\vec a$.`,
    },
  },
  {
    id: 'vec-unit-times',
    name: 'Mit der Länge malgenommen statt geteilt',
    wrongFormula: String.raw`\vec a^{\,0} = \lvert \vec a \rvert \cdot \vec a`,
    why: {
      detailed: String.raw`Malnehmen mit der Länge macht den Pfeil noch länger. Für die Länge $1$ teilst du durch die Länge: Jeder Eintrag wird durch $\lvert\vec a\rvert$ geteilt.`,
      short: String.raw`Durch die Länge teilen, nicht malnehmen.`,
    },
  },
  {
    id: 'vec-not-normalized',
    name: 'Ohne Normieren gestreckt',
    wrongFormula: String.raw`\vec v = 6\,\vec a`,
    why: {
      detailed: String.raw`$6\,\vec a$ ist sechsmal so lang wie $\vec a$, nicht $6$ lang. Erst den Vektor auf die Länge $1$ bringen (durch $\lvert\vec a\rvert$ teilen), dann mit der gewünschten Länge malnehmen.`,
      short: String.raw`Erst normieren (durch $\lvert\vec a\rvert$), dann mit der Länge malnehmen.`,
    },
  },
  {
    id: 'vec-direction-sign',
    name: 'Gleichsinnig und gegensinnig verwechselt',
    wrongFormula: String.raw`\text{gegensinnig: } \vec v = +6\,\vec a^{\,0}`,
    why: {
      detailed: String.raw`Gleichsinnig heißt: in dieselbe Richtung, also ein positiver Faktor. Gegensinnig heißt: in die Gegenrichtung, also ein negativer Faktor vor dem Einheitsvektor.`,
      short: String.raw`Gegensinnig: negativer Faktor, gleichsinnig: positiver.`,
    },
  },
  {
    id: 'vec-one-solution',
    name: 'Zweite Lösung vergessen',
    wrongFormula: String.raw`t^2 = 4 \;\Rightarrow\; t = 2`,
    why: {
      detailed: String.raw`Ein Quadrat ist für eine Zahl und ihre Gegenzahl gleich: $2^2 = (-2)^2$. Deshalb hat $u^2 = c$ mit $c > 0$ zwei Lösungen, $u = \sqrt{c}$ und $u = -\sqrt{c}$. Beide Vektoren haben die gesuchte Länge.`,
      short: String.raw`$u^2 = c > 0$ hat zwei Lösungen: $u = \pm\sqrt{c}$.`,
    },
  },
  {
    id: 'vec-length-target-not-squared',
    name: 'Gewünschte Länge nicht quadriert',
    wrongFormula: String.raw`t^2 + 8 = 3`,
    why: {
      detailed: String.raw`Die Summe der Quadrate ist das **Quadrat** der Länge. Setze sie deshalb gleich dem Quadrat der gewünschten Länge (oder ziehe auf der anderen Seite die Wurzel).`,
      short: String.raw`Summe der Quadrate = Länge im Quadrat.`,
    },
  },
  {
    id: 'vec-param-square',
    name: 'Nur den Buchstaben quadriert',
    wrongFormula: String.raw`(7t)^2 = 7t^2`,
    why: {
      detailed: String.raw`Das Quadrat gilt für den ganzen Eintrag, also auch für die Zahl davor: $(7t)^2 = 7t \cdot 7t = 49t^2$.`,
      short: String.raw`$(7t)^2 = 49t^2$: Zahl und Buchstabe quadrieren.`,
    },
  },
  {
    id: 'vec-parallelogram-corner',
    name: 'Ecken des Parallelogramms vertauscht',
    wrongFormula: String.raw`D = A + B - C`,
    why: {
      detailed: String.raw`Im Parallelogramm $ABCD$ folgen die Ecken im Kreis aufeinander, gegenüberliegende Seiten sind gleich lang und parallel: $\overrightarrow{AD} = \overrightarrow{BC}$ und $\overrightarrow{AB} = \overrightarrow{DC}$. Der fehlende Punkt liegt schräg gegenüber der mittleren der drei gegebenen Ecken. Mit einer anderen Reihenfolge entsteht zwar auch ein Parallelogramm, aber nicht das mit dieser Reihenfolge der Ecken.`,
      short: String.raw`Gegenüberliegende Seiten sind gleich: $\overrightarrow{AD} = \overrightarrow{BC}$.`,
    },
  },
  {
    id: 'vec-divide-by-vector',
    name: 'Durch einen Vektor geteilt',
    wrongFormula: String.raw`\vec x = \frac{\vec b}{\vec a}`,
    why: {
      detailed: String.raw`Durch einen Vektor kann man nicht teilen, das ist nicht erklärt. Vektoren bringst du mit Plus und Minus auf die andere Seite; teilen darfst du nur durch eine Zahl, die vor $\vec x$ steht.`,
      short: String.raw`Nie durch einen Vektor teilen, nur durch eine Zahl.`,
    },
  },
  {
    id: 'vec-equation-partial-divide',
    name: 'Nur einen Teil geteilt',
    wrongFormula: String.raw`2\vec x = \vec b - \vec a \;\Rightarrow\; \vec x = \tfrac{1}{2}\vec b - \vec a`,
    why: {
      detailed: String.raw`Teilst du eine Seite durch eine Zahl, wird jeder Summand dieser Seite geteilt, nicht nur der erste.`,
      short: String.raw`Beim Teilen jeden Summanden teilen.`,
    },
  },
  {
    id: 'vec-equation-no-divide',
    name: 'Zahl vor dem Vektor vergessen',
    wrongFormula: String.raw`2\vec x = \vec b - \vec a \;\Rightarrow\; \vec x = \vec b - \vec a`,
    why: {
      detailed: String.raw`Vor $\vec x$ steht noch eine Zahl. Erst wenn du die ganze rechte Seite durch sie teilst, steht $\vec x$ allein da.`,
      short: String.raw`Noch durch die Zahl vor $\vec x$ teilen.`,
    },
  },
]

export const vectorErrorRule = (id: string): VectorErrorRule => {
  const rule = VECTOR_ERROR_RULES.find((r) => r.id === id)
  if (!rule) throw new Error(`Unbekannter Fehler ${id}`)
  return rule
}
