import type { VectorErrorRule } from './errorRules.ts'

// Typische Fehler bei der Cramerschen Regel (M7 Schritt 11a, Katalog in docs/PLAN-M7.md). Vorsilbe „cramer-“. Der Text
// nennt den Fehler und die Regel, verrät aber nicht das Ergebnis des Schritts.

export const CRAMER_ERROR_RULES: readonly VectorErrorRule[] = [
  {
    id: 'cramer-row',
    name: 'Zeile statt Spalte durch die rechte Seite ersetzt',
    wrongFormula: String.raw`A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix},\; \vec b = \begin{pmatrix} 5 \\ 6 \end{pmatrix} \;\Rightarrow\; A_x = \begin{pmatrix} 5 & 6 \\ 3 & 4 \end{pmatrix}`,
    why: {
      detailed: String.raw`Jede Unbekannte gehört zu einer **Spalte** von $A$ (die Zahlen vor ihr in allen Gleichungen). In $A_k$ ersetzt du deshalb die Spalte der Unbekannten durch $\vec b$, nicht eine Zeile.`,
      short: String.raw`Die **Spalte** der Unbekannten durch $\vec b$ ersetzen.`,
    },
  },
  {
    id: 'cramer-col',
    name: 'Die Spalte einer anderen Unbekannten ersetzt',
    wrongFormula: String.raw`y = \frac{\det A_x}{\det A}`,
    why: {
      detailed: String.raw`Für $x$ ersetzt du die 1. Spalte, für $y$ die 2., für $z$ die 3. Hier steht $\vec b$ in der Spalte einer anderen Unbekannten.`,
      short: String.raw`Spalte passend zur gesuchten Unbekannten wählen.`,
    },
  },
  {
    id: 'cramer-flip',
    name: 'Bruch der Cramerschen Regel umgedreht',
    wrongFormula: String.raw`x = \frac{\det A}{\det A_x}`,
    why: {
      detailed: String.raw`In der Cramerschen Regel steht die Determinante mit **ersetzter** Spalte **oben**: $x_k = \frac{\det A_k}{\det A}$. Unten steht immer $\det A$, für jede Unbekannte dasselbe.`,
      short: String.raw`Oben $\det A_k$, unten $\det A$.`,
    },
  },
  {
    id: 'cramer-no-divide',
    name: 'Nicht durch det A geteilt',
    wrongFormula: String.raw`x = \det A_x`,
    why: {
      detailed: String.raw`$\det A_k$ allein ist noch nicht die Unbekannte. Die Cramersche Regel teilt sie durch $\det A$: $x_k = \frac{\det A_k}{\det A}$.`,
      short: String.raw`Noch durch $\det A$ teilen.`,
    },
  },
  {
    id: 'cramer-cond-flip',
    name: 'Bedingung umgedreht: anwendbar, wo det A = 0',
    wrongFormula: String.raw`\det A = 0 \text{ für } a = 2 \;\Rightarrow\; \text{anwendbar für } a = 2`,
    why: {
      detailed: String.raw`Die Nullstellen von $\det A$ sind die Werte, für die die Regel **nicht** gilt: Dort müsstest du durch $0$ teilen, und das System hat keine oder unendlich viele Lösungen. Anwendbar ist sie für alle **anderen** Werte.`,
      short: String.raw`Bei $\det A = 0$ ist die Regel nicht anwendbar.`,
    },
  },
  {
    id: 'cramer-cond-all',
    name: 'Nicht geprüft, wann det A = 0 ist',
    wrongFormula: String.raw`\det A = a - 2 \;\Rightarrow\; \text{anwendbar für alle } a`,
    why: {
      detailed: String.raw`Die Cramersche Regel teilt durch $\det A$. Hängt $\det A$ vom Parameter ab, gibt es Werte, für die sie $0$ wird. Diese Werte musst du ausschließen.`,
      short: String.raw`Werte mit $\det A = 0$ ausschließen.`,
    },
  },
  {
    id: 'cramer-excluded',
    name: 'Wert behalten, bei dem det A = 0 ist',
    wrongFormula: String.raw`\frac{a - 1}{(a - 1)(a + 2)} = 1 \;\Rightarrow\; a = 1 \text{ behalten}`,
    why: {
      detailed: String.raw`Beim Malnehmen mit dem Nenner $\det A$ können Werte dazukommen, für die $\det A = 0$ ist. Dort gilt die Cramersche Regel nicht, und das System hat keine eindeutige Lösung. Prüf jede Lösung: Ist dort $\det A \ne 0$?`,
      short: String.raw`Lösungen mit $\det A = 0$ fallen weg.`,
    },
  },
  {
    id: 'cramer-one-root',
    name: 'Nur eine Lösung der quadratischen Gleichung genommen',
    wrongFormula: String.raw`(a - 1)(a + 3) = 0 \;\Rightarrow\; a = 1`,
    why: {
      detailed: String.raw`Nach dem Malnehmen mit dem Nenner steht eine **quadratische** Gleichung in $a$ da. Sie kann zwei Lösungen haben, und beide gehören zur Antwort, solange dort $\det A \ne 0$ ist.`,
      short: String.raw`Quadratische Gleichung: beide Lösungen prüfen.`,
    },
  },
  {
    id: 'cramer-target-numerator',
    name: 'Nur den Zähler gleich dem Wert gesetzt',
    wrongFormula: String.raw`\frac{\det A_x}{\det A} = 2 \;\Rightarrow\; \det A_x = 2`,
    why: {
      detailed: String.raw`Der gesuchte Wert ist der ganze **Bruch**. Aus $\frac{\det A_k}{\det A} = c$ wird nach dem Malnehmen mit dem Nenner $\det A_k = c \cdot \det A$, der Nenner fällt nicht einfach weg.`,
      short: String.raw`Mit dem Nenner malnehmen: $\det A_k = c \cdot \det A$.`,
    },
  },
  {
    id: 'cramer-solve-sign',
    name: 'Vorzeichenfehler beim Auflösen nach a',
    wrongFormula: String.raw`3a + 6 = 0 \;\Rightarrow\; a = 2`,
    why: {
      detailed: String.raw`Bringst du die Zahl auf die andere Seite, wechselt ihr **Vorzeichen**. Danach teilst du durch die Zahl vor $a$.`,
      short: String.raw`Rüberbringen: Vorzeichen wechselt.`,
    },
  },
]
