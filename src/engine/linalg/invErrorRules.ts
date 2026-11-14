import type { VectorErrorRule } from './errorRules.ts'

// Typische Fehler bei der Inversen (M7 Schritt 12a, Katalog in docs/PLAN-M7.md). Vorsilbe „inv-“. Der Text nennt den
// Fehler und die Regel, verrät aber nicht das Ergebnis des Schritts.

export const INV_ERROR_RULES: readonly VectorErrorRule[] = [
  // ---------------------------------------------------------------- 2 × 2 mit der Formel
  {
    id: 'inv-reciprocal',
    name: 'Kehrwert jedes Eintrags genommen',
    wrongFormula: String.raw`\begin{pmatrix} 2 & 1 \\ 3 & 4 \end{pmatrix}^{-1} = \begin{pmatrix} \frac{1}{2} & 1 \\ \frac{1}{3} & \frac{1}{4} \end{pmatrix}`,
    why: {
      detailed: String.raw`Die Inverse ist die Matrix mit $A \cdot A^{-1} = E$, nicht die Matrix der Kehrwerte. Weil beim Malnehmen Zeile mal Spalte gerechnet wird, hilft es nicht, jeden Eintrag einzeln umzudrehen. Bei $2 \times 2$ gilt $A^{-1} = \frac{1}{\det A} \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$.`,
      short: String.raw`Nicht Eintrag für Eintrag umdrehen: Formel mit $\det A$.`,
    },
  },
  {
    id: 'inv-2-no-swap',
    name: 'Hauptdiagonale nicht getauscht',
    wrongFormula: String.raw`\begin{pmatrix} a & b \\ c & d \end{pmatrix}^{-1} = \frac{1}{\det A} \begin{pmatrix} a & -b \\ -c & d \end{pmatrix}`,
    why: {
      detailed: String.raw`Auf der **Hauptdiagonale** (oben links, unten rechts) tauschen die beiden Zahlen ihre Plätze. Nur auf der Nebendiagonale bleiben sie stehen und wechseln das Vorzeichen.`,
      short: String.raw`Hauptdiagonale: Zahlen tauschen.`,
    },
  },
  {
    id: 'inv-2-sign',
    name: 'Minus an der falschen Diagonale',
    wrongFormula: String.raw`\begin{pmatrix} a & b \\ c & d \end{pmatrix}^{-1} = \frac{1}{\det A} \begin{pmatrix} -d & b \\ c & -a \end{pmatrix}`,
    why: {
      detailed: String.raw`Das Minus gehört an die **Nebendiagonale** (oben rechts, unten links): $\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$. Die getauschten Zahlen der Hauptdiagonale behalten ihr Vorzeichen.`,
      short: String.raw`Minus nur an die Nebendiagonale.`,
    },
  },
  {
    id: 'inv-2-no-divide',
    name: 'Nicht durch det A geteilt',
    wrongFormula: String.raw`\begin{pmatrix} 2 & 1 \\ 3 & 4 \end{pmatrix}^{-1} = \begin{pmatrix} 4 & -1 \\ -3 & 2 \end{pmatrix}`,
    why: {
      detailed: String.raw`Tauschen und Vorzeichen wechseln ist erst die halbe Formel. Danach wird jeder Eintrag durch $\det A$ geteilt: $A^{-1} = \frac{1}{\det A} \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$. Probe: $A \cdot A^{-1}$ muss $E$ ergeben.`,
      short: String.raw`Noch durch $\det A$ teilen.`,
    },
  },
  {
    id: 'inv-2-times-det',
    name: 'Mit det A malgenommen statt geteilt',
    wrongFormula: String.raw`A^{-1} = \det A \cdot \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}`,
    why: {
      detailed: String.raw`Vor der Matrix steht $\frac{1}{\det A}$, also wird jeder Eintrag durch die Determinante **geteilt**, nicht mit ihr malgenommen.`,
      short: String.raw`Durch $\det A$ teilen, nicht malnehmen.`,
    },
  },
  {
    id: 'inv-det-main',
    name: 'Bei der Determinante nur die Hauptdiagonale',
    wrongFormula: String.raw`\begin{vmatrix} 2 & 4 \\ 1 & 2 \end{vmatrix} = 2 \cdot 2`,
    why: {
      detailed: String.raw`Bei $2 \times 2$ ist die Determinante Hauptdiagonale **minus** Nebendiagonale: $\det A = ad - bc$. Das zweite Produkt gehört immer dazu.`,
      short: String.raw`$\det A = ad - bc$, beide Produkte.`,
    },
  },
  // ---------------------------------------------------------------- nicht invertierbar
  {
    id: 'inv-singular-formula',
    name: 'Formel trotz det A = 0 benutzt',
    wrongFormula: String.raw`\det A = 0 \;\Rightarrow\; A^{-1} = \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}`,
    why: {
      detailed: String.raw`Die Formel teilt durch $\det A$. Ist $\det A = 0$, geht das nicht, und es gibt keine Inverse. Die Matrix $\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$ allein ist keine Inverse: $A$ mal diese Matrix ergibt $\det A \cdot E$, hier also die Nullmatrix.`,
      short: String.raw`Bei $\det A = 0$ gibt es keine Inverse.`,
    },
  },
  {
    id: 'inv-singular-rows',
    name: 'Ohne Nullzeile für invertierbar gehalten',
    wrongFormula: String.raw`\begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix} \;\Rightarrow\; \text{invertierbar}`,
    why: {
      detailed: String.raw`Eine Nullzeile ist nicht nötig, damit eine Matrix nicht invertierbar ist. Es reicht, dass eine Zeile ein Vielfaches der anderen ist (oder eine Spalte ein Vielfaches der anderen). Entscheidend ist $\det A$: Bei $\det A = 0$ gibt es keine Inverse.`,
      short: String.raw`Entscheidend ist $\det A \ne 0$, nicht eine Nullzeile.`,
    },
  },
  {
    id: 'inv-singular-zero',
    name: 'Nullmatrix als Inverse',
    wrongFormula: String.raw`\det A = 0 \;\Rightarrow\; A^{-1} = 0`,
    why: {
      detailed: String.raw`Die Nullmatrix ist nie eine Inverse, denn $A \cdot 0 = 0 \ne E$. Gibt es keine Matrix mit $A \cdot A^{-1} = E$, ist $A$ eben **nicht invertierbar**; $A^{-1}$ gibt es dann gar nicht.`,
      short: String.raw`Keine Inverse heißt nicht Nullmatrix.`,
    },
  },
  {
    id: 'inv-singular-right',
    name: 'Für invertierbar gehalten, obwohl links keine Einheitsmatrix entstehen kann',
    wrongFormula: String.raw`\left(\begin{array}{rr|rr} 1 & 2 & 1 & 0 \\ 0 & 0 & -2 & 1 \end{array}\right) \;\Rightarrow\; \text{invertierbar}`,
    why: {
      detailed: String.raw`Ob eine Matrix invertierbar ist, entscheidet nur die **linke** Seite: Entsteht dort eine Nullzeile, wird links nie $E$, und es gilt $\det A = 0$. Rechts vom Strich steht nie eine Nullzeile, weil dort die Zeilen von $E$ umgeformt werden; das sagt nichts.`,
      short: String.raw`Nur links zählt: Nullzeile heißt nicht invertierbar.`,
    },
  },
  {
    id: 'inv-singular-swap',
    name: 'Nullzeile durch Tauschen wegschaffen wollen',
    wrongFormula: String.raw`\text{Nullzeile links} \;\Rightarrow\; \text{tauschen und weiter}`,
    why: {
      detailed: String.raw`Tauschen ändert nur die Reihenfolge der Zeilen; die Nullzeile bleibt eine Nullzeile. Weil alle Umformungen die Zeilen nur kombinieren, entsteht aus ihr nie eine Zeile von $E$. Die Matrix ist nicht invertierbar.`,
      short: String.raw`Tauschen hilft nicht: Nullzeile bleibt.`,
    },
  },
  // ---------------------------------------------------------------- Gauß-Jordan
  {
    id: 'inv-start-swap',
    name: 'Starttabelle verkehrt herum',
    wrongFormula: String.raw`(E \mid A) \;\text{statt}\; (A \mid E)`,
    why: {
      detailed: String.raw`Links steht die Matrix, deren Inverse du suchst, rechts die Einheitsmatrix. Am Ende soll **links** $E$ stehen; dann steht rechts die Inverse.`,
      short: String.raw`Start: $(A \mid E)$.`,
    },
  },
  {
    id: 'inv-start-zero',
    name: 'Rechts Nullen statt der Einheitsmatrix',
    wrongFormula: String.raw`(A \mid 0) \;\text{statt}\; (A \mid E)`,
    why: {
      detailed: String.raw`Rechts vom Strich steht die **Einheitsmatrix** (Einsen auf der Diagonale). Sie zeichnet alle Umformungen auf; mit Nullen bliebe rechts immer alles $0$.`,
      short: String.raw`Rechts steht $E$, nicht $0$.`,
    },
  },
  {
    id: 'inv-start-transpose',
    name: 'Matrix gespiegelt eingetragen',
    wrongFormula: String.raw`(A^{\mathsf T} \mid E) \;\text{statt}\; (A \mid E)`,
    why: {
      detailed: String.raw`Die Matrix wird so abgeschrieben, wie sie dasteht: Zeile für Zeile. Werden Zeilen und Spalten vertauscht, rechnest du die Inverse von $A^{\mathsf T}$ aus.`,
      short: String.raw`Zeilen von $A$ bleiben Zeilen.`,
    },
  },
  {
    id: 'inv-right-forgot',
    name: 'Rechte Hälfte nicht mit umgeformt',
    wrongFormula: String.raw`\left(\begin{array}{rr|rr} 2 & 1 & 1 & 0 \\ 0 & 1 & 0 & 1 \end{array}\right) \quad \text{II} - 2 \cdot \text{I}\colon\; \text{rechts unverändert}`,
    why: {
      detailed: String.raw`Jede Umformung wirkt auf die **ganze** Zeile, links und rechts vom Strich. Nur so zeichnet die rechte Hälfte auf, was mit $A$ geschieht, und am Ende steht dort $A^{-1}$.`,
      short: String.raw`Auch rechts vom Strich mitrechnen.`,
    },
  },
  {
    id: 'inv-zero-pivot',
    name: 'Bei einer 0 auf der Diagonale abgebrochen',
    wrongFormula: String.raw`a_{11} = 0 \;\Rightarrow\; \text{nicht invertierbar}`,
    why: {
      detailed: String.raw`Eine $0$ auf der Diagonale heißt noch nicht, dass die Matrix nicht invertierbar ist. Steht darunter eine Zahl ungleich $0$, **tauschst** du die Zeilen und rechnest weiter.`,
      short: String.raw`Erst tauschen, dann entscheiden.`,
    },
  },
  {
    id: 'inv-scale-forgot',
    name: 'Diagonale nicht auf 1 gebracht',
    wrongFormula: String.raw`\left(\begin{array}{rr|rr} 2 & 0 & 4 & -2 \\ 0 & 3 & -3 & 6 \end{array}\right) \;\Rightarrow\; A^{-1} = \begin{pmatrix} 4 & -2 \\ -3 & 6 \end{pmatrix}`,
    why: {
      detailed: String.raw`Ablesen darfst du erst, wenn links genau $E$ steht. Steht auf der Diagonale noch eine andere Zahl, teilst du die ganze Zeile durch sie, auch rechts vom Strich.`,
      short: String.raw`Erst jede Zeile durch ihre Diagonalzahl teilen.`,
    },
  },
  {
    id: 'inv-scale-multiply',
    name: 'Mit der Zahl auf der Diagonale malgenommen',
    wrongFormula: String.raw`\text{Zeile} \cdot 2 \;\text{statt}\; \text{Zeile} : 2`,
    why: {
      detailed: String.raw`Aus der Zahl $d$ auf der Diagonale soll eine $1$ werden. Dafür teilst du die Zeile durch $d$; malnehmen macht daraus $d^2$.`,
      short: String.raw`Durch die Diagonalzahl teilen.`,
    },
  },
  {
    id: 'inv-read-transpose',
    name: 'Rechte Hälfte gespiegelt abgelesen',
    wrongFormula: String.raw`\left(\begin{array}{rr|rr} 1 & 0 & 1 & 2 \\ 0 & 1 & 3 & 4 \end{array}\right) \;\Rightarrow\; A^{-1} = \begin{pmatrix} 1 & 3 \\ 2 & 4 \end{pmatrix}`,
    why: {
      detailed: String.raw`Die rechte Hälfte **ist** die Inverse, so wie sie dasteht: Zeile I der Tabelle ist die erste Zeile von $A^{-1}$. Zeilen und Spalten werden nicht getauscht.`,
      short: String.raw`Rechts Zeile für Zeile ablesen.`,
    },
  },
  {
    id: 'inv-scale-det',
    name: 'Alles durch det A geteilt',
    wrongFormula: String.raw`A^{-1} = \frac{1}{\det A} \cdot (\text{rechte Hälfte})`,
    why: {
      detailed: String.raw`Teilen durch $\det A$ gehört zur Formel bei $2 \times 2$. Beim Gauß-Jordan-Verfahren teilst du stattdessen **jede Zeile durch ihre eigene Zahl** auf der Diagonale, damit links $E$ entsteht.`,
      short: String.raw`Jede Zeile durch ihre Diagonalzahl, nicht durch $\det A$.`,
    },
  },
  // ---------------------------------------------------------------- Regeln
  {
    id: 'inv-order',
    name: 'Reihenfolge beim Invertieren eines Produkts beibehalten',
    wrongFormula: String.raw`(AB)^{-1} = A^{-1}B^{-1}`,
    why: {
      detailed: String.raw`Beim Invertieren eines Produkts **dreht sich die Reihenfolge um**: $(AB)^{-1} = B^{-1}A^{-1}$. Probe: $AB \cdot B^{-1}A^{-1} = A\,E\,A^{-1} = E$. Weil Matrizen nicht vertauschbar sind, ist $A^{-1}B^{-1}$ meist etwas anderes.`,
      short: String.raw`$(AB)^{-1} = B^{-1}A^{-1}$.`,
    },
  },
  {
    id: 'inv-factor',
    name: 'Zahl vor der Matrix nicht umgedreht',
    wrongFormula: String.raw`(2A)^{-1} = 2A^{-1}`,
    why: {
      detailed: String.raw`Eine Zahl vor der Matrix wird beim Invertieren zum **Kehrwert**: $(\lambda A)^{-1} = \frac{1}{\lambda}A^{-1}$. Probe: $\lambda A \cdot \frac{1}{\lambda}A^{-1} = E$.`,
      short: String.raw`$(\lambda A)^{-1} = \frac{1}{\lambda}A^{-1}$.`,
    },
  },
  {
    id: 'inv-transpose-drop',
    name: 'Transponieren vergessen',
    wrongFormula: String.raw`(A^{\mathsf T})^{-1} = A^{-1}`,
    why: {
      detailed: String.raw`Das Transponieren bleibt erhalten, es tauscht nur den Platz mit dem Invertieren: $(A^{\mathsf T})^{-1} = (A^{-1})^{\mathsf T}$.`,
      short: String.raw`$(A^{\mathsf T})^{-1} = (A^{-1})^{\mathsf T}$.`,
    },
  },
  {
    id: 'inv-inverse-twice',
    name: 'Inverse der Inversen nicht aufgehoben',
    wrongFormula: String.raw`(A^{-1}B)^{-1} = B^{-1}A^{-1}`,
    why: {
      detailed: String.raw`Zweimal invertieren hebt sich auf: $(A^{-1})^{-1} = A$. Steht im Produkt schon eine Inverse, wird sie beim Invertieren wieder zur Matrix selbst.`,
      short: String.raw`$(A^{-1})^{-1} = A$.`,
    },
  },
  // ---------------------------------------------------------------- Gleichungssystem über die Inverse
  {
    id: 'inv-side',
    name: 'Von der falschen Seite malgenommen',
    wrongFormula: String.raw`A\vec x = \vec b \;\Rightarrow\; \vec x = \vec b\,A^{-1}`,
    why: {
      detailed: String.raw`$A$ steht **links** von $\vec x$, also nimmst du beide Seiten von links mit $A^{-1}$ mal: $A^{-1}A\vec x = A^{-1}\vec b$. Matrizen darf man nicht vertauschen; $\vec b\,A^{-1}$ ist nicht einmal definiert.`,
      short: String.raw`Von links mit $A^{-1}$ malnehmen.`,
    },
  },
  {
    id: 'inv-not-inverted',
    name: 'Mit A statt mit der Inversen malgenommen',
    wrongFormula: String.raw`A\vec x = \vec b \;\Rightarrow\; \vec x = A\vec b`,
    why: {
      detailed: String.raw`Um $A$ loszuwerden, brauchst du die Matrix, die $A$ rückgängig macht: $A^{-1}A = E$. Mit $A$ selbst malzunehmen ergibt $A^2\vec x$, nicht $\vec x$.`,
      short: String.raw`Mit $A^{-1}$ malnehmen, nicht mit $A$.`,
    },
  },
  {
    id: 'inv-divide',
    name: 'Durch eine Matrix geteilt',
    wrongFormula: String.raw`\vec x = \frac{\vec b}{A}`,
    why: {
      detailed: String.raw`Durch eine Matrix kann man nicht teilen. Stattdessen nimmst du mit der Inversen mal, und zwar von derselben Seite, auf der $A$ steht: $\vec x = A^{-1}\vec b$.`,
      short: String.raw`Nicht teilen: mit $A^{-1}$ malnehmen.`,
    },
  },
  // ---------------------------------------------------------------- mit Parameter
  {
    id: 'inv-cond-flip',
    name: 'Bedingung umgedreht',
    wrongFormula: String.raw`\det A = 0 \text{ für } a = 2 \;\Rightarrow\; \text{invertierbar für } a = 2`,
    why: {
      detailed: String.raw`Die Nullstellen von $\det A$ sind genau die Werte, für die $A$ **nicht** invertierbar ist. Invertierbar ist $A$ für alle anderen $a$.`,
      short: String.raw`Bei $\det A = 0$ nicht invertierbar.`,
    },
  },
  {
    id: 'inv-cond-all',
    name: 'Für jedes a invertierbar',
    wrongFormula: String.raw`A = \begin{pmatrix} a & 2 \\ 1 & 1 \end{pmatrix} \;\Rightarrow\; \text{invertierbar für alle } a`,
    why: {
      detailed: String.raw`Steht $a$ in der Matrix, ist $\det A$ ein Ausdruck in $a$, und der kann $0$ werden. Für diese Werte gibt es keine Inverse; prüfe die Nullstellen von $\det A$.`,
      short: String.raw`Nullstellen von $\det A$ prüfen.`,
    },
  },
]
