import type { VectorErrorRule } from './errorRules.ts'

// Typische Fehler bei Determinanten (M7 Schritt 9a, Katalog in docs/PLAN-M7.md). Vorsilbe „det-“. Der Text nennt den
// Fehler und die Regel, verrät aber nicht das Ergebnis des Schritts.

export const DET_ERROR_RULES: readonly VectorErrorRule[] = [
  // ---------------------------------------------------------------- 2 × 2 und Sarrus
  {
    id: 'det-2-plus',
    name: 'Plus statt Minus bei der 2 × 2-Determinante',
    wrongFormula: String.raw`\begin{vmatrix} 2 & 3 \\ 1 & 4 \end{vmatrix} = 2 \cdot 4 + 3 \cdot 1`,
    why: {
      detailed: String.raw`Bei einer $2 \times 2$-Matrix gilt $\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc$: Hauptdiagonale **minus** Nebendiagonale. Mit Plus kommt etwas anderes heraus.`,
      short: String.raw`$ad - bc$, nicht $ad + bc$.`,
    },
  },
  {
    id: 'det-2-swap',
    name: 'Diagonalen vertauscht',
    wrongFormula: String.raw`\begin{vmatrix} 2 & 3 \\ 1 & 4 \end{vmatrix} = 3 \cdot 1 - 2 \cdot 4`,
    why: {
      detailed: String.raw`Zuerst kommt die **Hauptdiagonale** (oben links nach unten rechts), davon wird die Nebendiagonale abgezogen: $ad - bc$. Umgekehrt dreht sich das Vorzeichen.`,
      short: String.raw`Hauptdiagonale minus Nebendiagonale.`,
    },
  },
  {
    id: 'det-2-rows',
    name: 'Zeilen statt Diagonalen malgenommen',
    wrongFormula: String.raw`\begin{vmatrix} 2 & 3 \\ 1 & 4 \end{vmatrix} = 2 \cdot 3 - 1 \cdot 4`,
    why: {
      detailed: String.raw`Malgenommen werden die Einträge **über Kreuz**, entlang der Diagonalen: oben links mal unten rechts, oben rechts mal unten links. Die Einträge einer Zeile gehören nicht zusammen.`,
      short: String.raw`Über Kreuz malnehmen: $ad - bc$.`,
    },
  },
  {
    id: 'det-sarrus-plus',
    name: 'Nebendiagonalen addiert',
    wrongFormula: String.raw`\det A = a_{11}a_{22}a_{33} + \dots + a_{13}a_{22}a_{31} + \dots`,
    why: {
      detailed: String.raw`Bei Sarrus zählen nur die drei Diagonalen nach rechts unten positiv; die drei nach **links unten** werden **abgezogen**.`,
      short: String.raw`Diagonalen nach links unten mit Minus.`,
    },
  },
  {
    id: 'det-sarrus-one',
    name: 'Nur eine Diagonale je Richtung',
    wrongFormula: String.raw`\det A = a_{11}a_{22}a_{33} - a_{13}a_{22}a_{31}`,
    why: {
      detailed: String.raw`Bei einer $3 \times 3$-Matrix reicht nicht je eine Diagonale wie bei $2 \times 2$. Schreib die ersten beiden Spalten noch einmal daneben: Dann gibt es **drei** Diagonalen nach rechts unten und **drei** nach links unten, zusammen sechs Produkte.`,
      short: String.raw`Sarrus: sechs Produkte, drei plus, drei minus.`,
    },
  },
  {
    id: 'det-sarrus-swap',
    name: 'Haupt- und Nebendiagonalen vertauscht',
    wrongFormula: String.raw`\det A = a_{13}a_{22}a_{31} + \dots - a_{11}a_{22}a_{33} - \dots`,
    why: {
      detailed: String.raw`Positiv zählen die Diagonalen nach **rechts unten** (wie die Hauptdiagonale), negativ die nach links unten. Vertauscht dreht sich das Vorzeichen der Determinante.`,
      short: String.raw`Rechts unten plus, links unten minus.`,
    },
  },
  {
    id: 'det-triangle-not',
    name: 'Nur die Hauptdiagonale malgenommen',
    wrongFormula: String.raw`\begin{vmatrix} 1 & 2 & 0 \\ 3 & 1 & 1 \\ 0 & 2 & 2 \end{vmatrix} = 1 \cdot 1 \cdot 2`,
    why: {
      detailed: String.raw`Das Produkt der Hauptdiagonale ist nur bei einer **Dreiecksmatrix** die Determinante, also wenn unter (oder über) der Diagonale nur Nullen stehen. Sonst brauchst du Sarrus, eine Entwicklung oder zuerst Umformungen.`,
      short: String.raw`Diagonale allein nur bei Dreiecksmatrizen.`,
    },
  },
  {
    id: 'det-sarrus-big',
    name: 'Sarrus bei einer großen Matrix',
    wrongFormula: String.raw`\det A_{4 \times 4} = a_{11}a_{22}a_{33}a_{44} + \dots \;(\text{Sarrus})`,
    why: {
      detailed: String.raw`Die Regel von Sarrus gilt **nur für $3 \times 3$**. Eine $4 \times 4$-Determinante hat 24 Produkte, Sarrus erfasst nur 8 davon. Entwickle nach einer Zeile oder Spalte (am besten mit vielen Nullen) oder forme vorher um.`,
      short: String.raw`Sarrus nur für $3 \times 3$.`,
    },
  },
  // ---------------------------------------------------------------- Fläche und Volumen
  {
    id: 'det-abs',
    name: 'Betrag vergessen (Fläche oder Volumen negativ)',
    wrongFormula: String.raw`\det A = -6 \;\Rightarrow\; F = -6`,
    why: {
      detailed: String.raw`Eine Fläche oder ein Volumen ist nie negativ. Es ist der **Betrag** der Determinante; ihr Vorzeichen sagt nur, wie die Spalten zueinander liegen (Orientierung).`,
      short: String.raw`Fläche und Volumen: $\lvert\det A\rvert$.`,
    },
  },
  {
    id: 'det-area-half',
    name: 'Halbiert (Dreieck statt Parallelogramm)',
    wrongFormula: String.raw`F_{\text{Parallelogramm}} = \tfrac{1}{2}\lvert\det A\rvert`,
    why: {
      detailed: String.raw`Die Spalten spannen ein **Parallelogramm** auf, seine Fläche ist $\lvert\det A\rvert$. Die Hälfte davon wäre das Dreieck aus den beiden Spalten.`,
      short: String.raw`Parallelogramm: ganz, Dreieck: halb.`,
    },
  },
  {
    id: 'det-volume-factor',
    name: 'Faktor eines anderen Körpers genommen',
    wrongFormula: String.raw`V_{\text{Spat}} = \tfrac{1}{6}\lvert\det A\rvert`,
    why: {
      detailed: String.raw`Gefragt ist der **Spat** aus den drei Spalten, sein Volumen ist $\lvert\det A\rvert$ ohne Faktor. $\frac{1}{2}$ gehört zum Prisma, $\frac{1}{3}$ zur Pyramide, $\frac{1}{6}$ zum Tetraeder.`,
      short: String.raw`Spat: $\lvert\det A\rvert$ ohne Faktor.`,
    },
  },
  // ---------------------------------------------------------------- Dreiecksmatrix
  {
    id: 'det-triangle-sum',
    name: 'Diagonale addiert statt malgenommen',
    wrongFormula: String.raw`\begin{vmatrix} 2 & 5 \\ 0 & 3 \end{vmatrix} = 2 + 3`,
    why: {
      detailed: String.raw`Bei einer Dreiecksmatrix ist die Determinante das **Produkt** der Einträge auf der Hauptdiagonale. Die Summe der Diagonale heißt Spur und ist etwas anderes.`,
      short: String.raw`Dreiecksmatrix: Diagonale **malnehmen**.`,
    },
  },
  {
    id: 'det-triangle-anti',
    name: 'Gegendiagonale statt Hauptdiagonale',
    wrongFormula: String.raw`\begin{vmatrix} 2 & 5 \\ 0 & 3 \end{vmatrix} = 5 \cdot 0`,
    why: {
      detailed: String.raw`Es zählt die **Hauptdiagonale** von oben links nach unten rechts. Bei einer Dreiecksmatrix stehen die Nullen auf einer Seite dieser Diagonale.`,
      short: String.raw`Hauptdiagonale: oben links nach unten rechts.`,
    },
  },
  {
    id: 'det-zero-row',
    name: 'Determinante 0, obwohl keine Zeile ganz 0 ist',
    wrongFormula: String.raw`\begin{vmatrix} 1 & 2 & 3 \\ 0 & 0 & 4 \\ 5 & 1 & 2 \end{vmatrix} = 0`,
    why: {
      detailed: String.raw`Die Determinante ist sicher $0$, wenn eine **ganze** Zeile oder Spalte aus Nullen besteht. Einzelne Nullen machen sie nicht $0$; sie machen das Rechnen nur leichter, weil Summanden wegfallen.`,
      short: String.raw`Nur eine ganze Nullzeile gibt sicher $0$.`,
    },
  },
  // ---------------------------------------------------------------- Entwickeln
  {
    id: 'det-checker-ignored',
    name: 'Vorzeichen aus dem Schachbrett vergessen',
    wrongFormula: String.raw`\det A = a_{21}\det A_{21} + a_{22}\det A_{22} + a_{23}\det A_{23}`,
    why: {
      detailed: String.raw`Beim Entwickeln bekommt jeder Summand das Vorzeichen $(-1)^{i+j}$, wie auf einem **Schachbrett**: oben links $+$, daneben $-$, dann wieder $+$ … In der zweiten Zeile beginnt es mit $-$.`,
      short: String.raw`Vorzeichen $(-1)^{i+j}$ aus dem Schachbrett.`,
    },
  },
  {
    id: 'det-checker-shift',
    name: 'Schachbrett falsch angesetzt',
    wrongFormula: String.raw`\det A = -a_{11}\det A_{11} + a_{12}\det A_{12} - a_{13}\det A_{13}`,
    why: {
      detailed: String.raw`Das Schachbrett der Vorzeichen beginnt **oben links mit $+$**: Das Vorzeichen an der Stelle (Zeile $i$, Spalte $j$) ist $(-1)^{i+j}$. Wer bei der falschen Farbe anfängt, dreht alle Vorzeichen und damit das Ergebnis.`,
      short: String.raw`Oben links steht $+$.`,
    },
  },
  {
    id: 'det-minor-wrong',
    name: 'Falsche Zeile oder Spalte gestrichen',
    wrongFormula: String.raw`a_{12}\det A_{13} \;\text{statt}\; a_{12}\det A_{12}`,
    why: {
      detailed: String.raw`Zum Eintrag $a_{ij}$ gehört die Unterdeterminante $\det A_{ij}$: Streiche genau **seine** Zeile $i$ und **seine** Spalte $j$, nicht die daneben.`,
      short: String.raw`Zeile und Spalte des Eintrags streichen.`,
    },
  },
  {
    id: 'det-expand-factor',
    name: 'Eintrag vor der Unterdeterminante vergessen',
    wrongFormula: String.raw`\det A = \det A_{11} - \det A_{12} + \det A_{13}`,
    why: {
      detailed: String.raw`Jeder Summand ist **Eintrag mal Unterdeterminante** mit Vorzeichen: $(-1)^{i+j}\, a_{ij} \det A_{ij}$. Ohne den Eintrag fehlt ein Faktor.`,
      short: String.raw`$(-1)^{i+j}\,a_{ij}\det A_{ij}$.`,
    },
  },
  // ---------------------------------------------------------------- Umformungen
  {
    id: 'det-swap-sign',
    name: 'Vorzeichen beim Vertauschen nicht beachtet',
    wrongFormula: String.raw`\det(\vec z_2, \vec z_1, \vec z_3) = \det(\vec z_1, \vec z_2, \vec z_3)`,
    why: {
      detailed: String.raw`**Jede** Vertauschung zweier Zeilen dreht das Vorzeichen der Determinante. Zähl, wie viele Vertauschungen die Zeilen in die ursprüngliche Reihenfolge bringen: gerade Anzahl $+$, ungerade Anzahl $-$.`,
      short: String.raw`Jeder Tausch: Vorzeichen dreht sich.`,
    },
  },
  {
    id: 'det-row-scale-forgot',
    name: 'Faktor in einer Zeile vergessen',
    wrongFormula: String.raw`\det(2\vec z_1, \vec z_2, \vec z_3) = \det(\vec z_1, \vec z_2, \vec z_3)`,
    why: {
      detailed: String.raw`Die Determinante ist in jeder Zeile linear: Wird eine Zeile mit $k$ malgenommen, wird die Determinante **$k$-mal so groß**. Der Faktor kommt vor die Determinante.`,
      short: String.raw`Faktor einer Zeile vorziehen.`,
    },
  },
  {
    id: 'det-row-scale-all',
    name: 'Faktor einer Zeile hoch n genommen',
    wrongFormula: String.raw`\det(2\vec z_1, \vec z_2, \vec z_3) = 2^3 \det(\vec z_1, \vec z_2, \vec z_3)`,
    why: {
      detailed: String.raw`$\lambda^n$ gehört zu $\det(\lambda A)$, wo **jede** der $n$ Zeilen den Faktor trägt. Steht der Faktor nur in **einer** Zeile, kommt er nur **einmal** heraus.`,
      short: String.raw`Eine Zeile: Faktor einmal.`,
    },
  },
  {
    id: 'det-row-scale-inverse',
    name: 'Durch den Faktor geteilt',
    wrongFormula: String.raw`\det(2\vec z_1, \vec z_2, \vec z_3) = \tfrac{1}{2}\det(\vec z_1, \vec z_2, \vec z_3)`,
    why: {
      detailed: String.raw`Steht in einer Zeile das $k$-Fache, ist die Determinante $k$-mal **so groß**, nicht $k$-mal so klein. Der Faktor kommt malgenommen vor die Determinante.`,
      short: String.raw`Faktor malnehmen, nicht teilen.`,
    },
  },
  {
    id: 'det-add-changes',
    name: 'Vielfaches addieren verändert die Determinante',
    wrongFormula: String.raw`\det(\vec z_1, \vec z_2 + 3\vec z_1, \vec z_3) = 3\det(\vec z_1, \vec z_2, \vec z_3)`,
    why: {
      detailed: String.raw`Addiert man zu einer Zeile das Vielfache einer **anderen** Zeile, **bleibt** die Determinante gleich. (Zerlegt man die Zeile, entsteht eine zweite Determinante mit zwei parallelen Zeilen, und die ist $0$.) Darauf beruht das Rechnen mit Umformungen.`,
      short: String.raw`Vielfaches einer anderen Zeile addieren: Determinante bleibt.`,
    },
  },
  {
    id: 'det-add-zero',
    name: 'Determinante 0, weil eine Zeile ein Vielfaches enthält',
    wrongFormula: String.raw`\det(\vec z_1, \vec z_2 + 3\vec z_1, \vec z_3) = 0`,
    why: {
      detailed: String.raw`Die Determinante ist $0$, wenn die Zeilen **linear abhängig** sind, z. B. eine Zeile ein Vielfaches einer anderen **ist**. Enthält eine Zeile nur zusätzlich ein Vielfaches, ändert sich die Determinante gar nicht.`,
      short: String.raw`Vielfaches dazu: Determinante bleibt, wird nicht $0$.`,
    },
  },
  {
    id: 'det-elim-sign',
    name: 'Vielfaches addiert statt abgezogen',
    wrongFormula: String.raw`\begin{pmatrix} 1 & 2 \\ 3 & 1 \end{pmatrix} \to \begin{pmatrix} 1 & 2 \\ 6 & 7 \end{pmatrix}`,
    why: {
      detailed: String.raw`Um unter dem ersten Eintrag eine $0$ zu erzeugen, ziehst du das passende Vielfache der ersten Zeile **ab**: Zeile $i$ minus (erster Eintrag der Zeile $i$) mal Zeile 1, wenn oben links $1$ steht. Mit Plus verdoppelt sich der Eintrag statt zu verschwinden.`,
      short: String.raw`Abziehen, damit eine $0$ entsteht.`,
    },
  },
  {
    id: 'det-elim-first',
    name: 'Nur den ersten Eintrag der Zeile verändert',
    wrongFormula: String.raw`\begin{pmatrix} 1 & 2 \\ 3 & 1 \end{pmatrix} \to \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}`,
    why: {
      detailed: String.raw`Eine Zeilenumformung gilt für die **ganze** Zeile: Jeder Eintrag der Zeile $i$ bekommt das Vielfache des Eintrags darüber abgezogen, nicht nur der erste.`,
      short: String.raw`Die ganze Zeile umformen.`,
    },
  },
  {
    id: 'det-elim-reversed',
    name: 'Falsch herum abgezogen',
    wrongFormula: String.raw`\vec z_2 \to 3\vec z_1 - \vec z_2`,
    why: {
      detailed: String.raw`Erlaubt ist Zeile $i$ **minus** ein Vielfaches einer anderen Zeile. „Vielfaches minus Zeile $i$“ nimmt die Zeile $i$ zusätzlich mit $-1$ mal, und das dreht jedes Mal das Vorzeichen der Determinante.`,
      short: String.raw`Zeile $i$ minus Vielfaches, nicht umgekehrt.`,
    },
  },
  // ---------------------------------------------------------------- Regeln
  {
    id: 'det-scalar-power',
    name: 'λ statt λⁿ vor der Determinante',
    wrongFormula: String.raw`\det(2A) = 2\det A \quad (A \in \mathbb{R}^{3 \times 3})`,
    why: {
      detailed: String.raw`In $\lambda A$ ist **jede** Zeile mit $\lambda$ malgenommen. Aus jeder der $n$ Zeilen kommt der Faktor einmal heraus: $\det(\lambda A) = \lambda^n \det A$.`,
      short: String.raw`$\det(\lambda A) = \lambda^n \det A$.`,
    },
  },
  {
    id: 'det-transpose',
    name: 'Transponieren verändert die Determinante',
    wrongFormula: String.raw`\det A^{\mathsf T} = -\det A`,
    why: {
      detailed: String.raw`Transponieren ändert die Determinante **nicht**: $\det A^{\mathsf T} = \det A$. (Darum gelten alle Regeln für Zeilen genauso für Spalten.)`,
      short: String.raw`$\det A^{\mathsf T} = \det A$.`,
    },
  },
  {
    id: 'det-inverse',
    name: 'Kehrwert bei der Inversen vergessen',
    wrongFormula: String.raw`\det(A^{-1}) = -\det A`,
    why: {
      detailed: String.raw`Aus $A A^{-1} = E$ folgt $\det A \cdot \det(A^{-1}) = \det E = 1$. Also ist $\det(A^{-1}) = \frac{1}{\det A}$, der **Kehrwert**.`,
      short: String.raw`$\det(A^{-1}) = \frac{1}{\det A}$.`,
    },
  },
  {
    id: 'det-power',
    name: 'Potenz als Faktor genommen',
    wrongFormula: String.raw`\det(A^3) = 3\det A`,
    why: {
      detailed: String.raw`$A^k$ ist das Produkt $A \cdot A \cdots A$ mit $k$ Faktoren. Weil die Determinante eines Produkts das Produkt der Determinanten ist, gilt $\det(A^k) = (\det A)^k$.`,
      short: String.raw`$\det(A^k) = (\det A)^k$.`,
    },
  },
  {
    id: 'det-product-sum',
    name: 'Summe statt Produkt der Determinanten',
    wrongFormula: String.raw`\det(AB) = \det A + \det B`,
    why: {
      detailed: String.raw`Für das Produkt zweier quadratischer Matrizen gilt $\det(AB) = \det A \cdot \det B$: Die Determinanten werden **malgenommen**. (Für eine Summe $A + B$ gibt es keine einfache Regel.)`,
      short: String.raw`$\det(AB) = \det A \cdot \det B$.`,
    },
  },
  // ---------------------------------------------------------------- mit Parameter
  {
    id: 'det-invertible-flip',
    name: 'Invertierbar und nicht invertierbar verwechselt',
    wrongFormula: String.raw`A \text{ nicht invertierbar} \iff \det A \ne 0`,
    why: {
      detailed: String.raw`Eine quadratische Matrix ist **invertierbar genau dann, wenn $\det A \ne 0$**. Nicht invertierbar (Spalten oder Zeilen linear abhängig, $A\vec x = \vec 0$ hat mehr als eine Lösung) heißt also $\det A = 0$.`,
      short: String.raw`Nicht invertierbar: $\det A = 0$.`,
    },
  },
  {
    id: 'det-invertible-one',
    name: 'Determinante 1 statt 0 gefordert',
    wrongFormula: String.raw`A \text{ nicht invertierbar} \iff \det A = 1`,
    why: {
      detailed: String.raw`Entscheidend ist, ob die Determinante **$0$** ist. Bei $\det A = 1$ ist $A$ sehr wohl invertierbar (wie jede Matrix mit $\det A \ne 0$).`,
      short: String.raw`Es kommt auf $\det A = 0$ an.`,
    },
  },
  {
    id: 'det-root-sign',
    name: 'Vorzeichen der Nullstellen falsch abgelesen',
    wrongFormula: String.raw`(a - 2)(a + 3) = 0 \;\Rightarrow\; a = -2 \text{ oder } a = 3`,
    why: {
      detailed: String.raw`Ein Faktor $(a - r)$ ist $0$ für $a = r$: Das Vorzeichen in der Klammer dreht sich beim Ablesen um. Mach die Probe durch Einsetzen.`,
      short: String.raw`$(a - r) = 0$ heißt $a = r$.`,
    },
  },
]
