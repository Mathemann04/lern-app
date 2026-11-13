import type { VectorErrorRule } from './errorRules.ts'

// Typische Fehler beim Rechnen mit Matrizen (M7 Schritt 8a, Katalog in docs/PLAN-M7.md). Vorsilbe „mat-“. Der Text nennt
// den Fehler und die Regel, verrät aber nicht das Ergebnis des Schritts.

export const MATRIX_ERROR_RULES: readonly VectorErrorRule[] = [
  // ---------------------------------------------------------------- Format und Einträge
  {
    id: 'mat-format-swap',
    name: 'Zeilen und Spalten beim Format vertauscht',
    wrongFormula: String.raw`\begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \end{pmatrix} \in \mathbb{R}^{3 \times 2}`,
    why: {
      detailed: String.raw`Das Format nennt **zuerst die Zahl der Zeilen** (waagrecht), **dann die Zahl der Spalten** (senkrecht): $m \times n$ heißt $m$ Zeilen und $n$ Spalten. Merkhilfe: „Zeilen zuerst, Spalten später“.`,
      short: String.raw`Erst Zeilen, dann Spalten.`,
    },
  },
  {
    id: 'mat-format-count',
    name: 'Anzahl der Einträge statt Format',
    wrongFormula: String.raw`\begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \end{pmatrix}\colon\ \text{Format } 6`,
    why: {
      detailed: String.raw`Das Format ist kein einzelner Wert, sondern ein Paar: Zahl der Zeilen mal Zahl der Spalten, geschrieben $m \times n$. Das Produkt $m \cdot n$ zählt nur die Einträge; daraus lässt sich nicht ablesen, wie die Matrix aussieht.`,
      short: String.raw`Format: Zeilen $\times$ Spalten, nicht die Zahl der Einträge.`,
    },
  },
  {
    id: 'mat-index-swap',
    name: 'Zeile und Spalte beim Eintrag vertauscht',
    wrongFormula: String.raw`a_{ij} = 2i - j \;\Rightarrow\; a_{12} = 2 \cdot 2 - 1`,
    why: {
      detailed: String.raw`Beim Eintrag $a_{ij}$ ist $i$ die **Zeile** und $j$ die **Spalte**. In der Vorschrift setzt du für $i$ die Nummer der Zeile und für $j$ die Nummer der Spalte ein, in dieser Reihenfolge.`,
      short: String.raw`$a_{ij}$: $i$ ist die Zeile, $j$ die Spalte.`,
    },
  },
  // ---------------------------------------------------------------- Summe und Vielfache
  {
    id: 'mat-scalar-row',
    name: 'Zahl nur mit der ersten Zeile malgenommen',
    wrongFormula: String.raw`2 \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} = \begin{pmatrix} 2 & 4 \\ 3 & 4 \end{pmatrix}`,
    why: {
      detailed: String.raw`Eine Zahl vor einer Matrix wird mit **jedem** Eintrag malgenommen, in allen Zeilen. (Anders als bei der Determinante, wo ein Faktor nur aus einer Zeile herausgezogen wird.)`,
      short: String.raw`$\lambda A$: jeder Eintrag mal $\lambda$.`,
    },
  },
  {
    id: 'mat-scalar-added',
    name: 'Zahl addiert statt malgenommen',
    wrongFormula: String.raw`3 \begin{pmatrix} 1 & 2 \\ 0 & 4 \end{pmatrix} = \begin{pmatrix} 4 & 5 \\ 3 & 7 \end{pmatrix}`,
    why: {
      detailed: String.raw`$\lambda A$ heißt: jeden Eintrag von $A$ **mal** $\lambda$ nehmen. Eine Zahl zu einer Matrix zu addieren ist gar nicht erklärt.`,
      short: String.raw`$\lambda A$: malnehmen, nicht addieren.`,
    },
  },
  {
    id: 'mat-minus-first',
    name: 'Minus nur beim ersten Eintrag',
    wrongFormula: String.raw`\begin{pmatrix} 5 & 2 \\ 1 & 3 \end{pmatrix} - \begin{pmatrix} 1 & 1 \\ 2 & 1 \end{pmatrix} = \begin{pmatrix} 4 & 3 \\ 3 & 4 \end{pmatrix}`,
    why: {
      detailed: String.raw`Das Minus vor einer Matrix gilt für **alle** ihre Einträge: Du ziehst jeden Eintrag vom Eintrag an derselben Stelle ab, nicht nur den ersten.`,
      short: String.raw`Minus gilt für jeden Eintrag.`,
    },
  },
  {
    id: 'mat-sub-reversed',
    name: 'Falsch herum abgezogen',
    wrongFormula: String.raw`A - B = \begin{pmatrix} b_{11} - a_{11} & \dots \end{pmatrix}`,
    why: {
      detailed: String.raw`Bei $A - B$ steht der Eintrag von $A$ vorn: $a_{ij} - b_{ij}$. Falsch herum abgezogen ändert jedes Vorzeichen.`,
      short: String.raw`$A - B$: Eintrag von $A$ minus Eintrag von $B$.`,
    },
  },
  {
    id: 'mat-plus-minus',
    name: 'Plus und Minus verwechselt',
    wrongFormula: String.raw`A^{\mathsf T} + B = \begin{pmatrix} a_{11} - b_{11} & \dots \end{pmatrix}`,
    why: {
      detailed: String.raw`Schau auf das Rechenzeichen zwischen den Matrizen: Bei $+$ werden die Einträge an derselben Stelle addiert, bei $-$ abgezogen. Das Zeichen gilt für jeden Eintrag.`,
      short: String.raw`Das Rechenzeichen zwischen den Matrizen gilt für jeden Eintrag.`,
    },
  },
  {
    id: 'mat-sum-formats',
    name: 'Summe verschiedener Formate',
    wrongFormula: String.raw`A \in \mathbb{R}^{2 \times 3},\; B \in \mathbb{R}^{3 \times 2} \;\Rightarrow\; A + B \text{ definiert}`,
    why: {
      detailed: String.raw`Addieren und Abziehen geht nur bei **gleichem Format**: Jeder Eintrag braucht einen Partner an derselben Stelle. Bei verschiedenen Formaten fehlen Partner, die Summe ist nicht definiert.`,
      short: String.raw`$A + B$ nur bei gleichem Format.`,
    },
  },
  // ---------------------------------------------------------------- Transponieren
  {
    id: 'mat-transpose-anti',
    name: 'An der falschen Diagonale gespiegelt',
    wrongFormula: String.raw`\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}^{\mathsf T} = \begin{pmatrix} 4 & 2 \\ 3 & 1 \end{pmatrix}`,
    why: {
      detailed: String.raw`Beim Transponieren wird die $i$-te Zeile zur $i$-ten Spalte. Das ist eine Spiegelung an der **Hauptdiagonale** (von links oben nach rechts unten); die Einträge darauf bleiben stehen.`,
      short: String.raw`Zeilen werden zu Spalten, die Hauptdiagonale bleibt.`,
    },
  },
  {
    id: 'mat-transpose-reshape',
    name: 'Einträge nur ins neue Format umgefüllt',
    wrongFormula: String.raw`\begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \end{pmatrix}^{\mathsf T} = \begin{pmatrix} 1 & 2 \\ 3 & 4 \\ 5 & 6 \end{pmatrix}`,
    why: {
      detailed: String.raw`Transponieren heißt nicht, die Einträge in derselben Lesereihenfolge in das neue Format zu schreiben. Die erste **Zeile** von $A$ wird die erste **Spalte** von $A^{\mathsf T}$, die zweite Zeile die zweite Spalte und so weiter: $(A^{\mathsf T})_{ij} = a_{ji}$.`,
      short: String.raw`Erste Zeile wird erste Spalte: $(A^{\mathsf T})_{ij} = a_{ji}$.`,
    },
  },
  {
    id: 'mat-transpose-rule',
    name: 'Transponierte eines Produkts ohne Tausch',
    wrongFormula: String.raw`(AB)^{\mathsf T} = A^{\mathsf T} B^{\mathsf T}`,
    why: {
      detailed: String.raw`Beim Transponieren eines Produkts dreht sich die Reihenfolge um: $(AB)^{\mathsf T} = B^{\mathsf T} A^{\mathsf T}$. Schon die Formate zeigen es: Ist $A$ vom Format $m \times n$ und $B$ vom Format $n \times p$, passt $A^{\mathsf T} B^{\mathsf T}$ meist gar nicht zusammen.`,
      short: String.raw`$(AB)^{\mathsf T} = B^{\mathsf T} A^{\mathsf T}$: Reihenfolge umdrehen.`,
    },
  },
  {
    id: 'mat-transpose-order-only',
    name: 'Nur die Reihenfolge getauscht, nicht transponiert',
    wrongFormula: String.raw`(AB)^{\mathsf T} = BA`,
    why: {
      detailed: String.raw`Die Reihenfolge dreht sich um, **und** jeder Faktor wird transponiert: $(AB)^{\mathsf T} = B^{\mathsf T} A^{\mathsf T}$. $BA$ ist eine ganz andere Matrix, oft mit anderem Format.`,
      short: String.raw`Tauschen **und** transponieren: $B^{\mathsf T} A^{\mathsf T}$.`,
    },
  },
  {
    id: 'mat-transpose-ignored',
    name: 'Transponieren vergessen',
    wrongFormula: String.raw`A B^{\mathsf T} = A B`,
    why: {
      detailed: String.raw`Das $^{\mathsf T}$ gehört zur Rechnung: Erst wird die Matrix transponiert (Zeilen werden Spalten), dann wird mit ihr weitergerechnet. Dabei ändert sich auch ihr Format, und damit, was definiert ist.`,
      short: String.raw`Erst transponieren, dann rechnen.`,
    },
  },
  // ---------------------------------------------------------------- Produkt
  {
    id: 'mat-product-format',
    name: 'Format des Produkts aus den falschen Zahlen',
    wrongFormula: String.raw`(2 \times 3) \cdot (3 \times 4) = 3 \times 3`,
    why: {
      detailed: String.raw`Beim Produkt $(m \times n) \cdot (n \times p)$ müssen die **inneren** Zahlen gleich sein; sie fallen weg. Das Ergebnis hat die **äußeren** Zahlen: so viele Zeilen wie die linke Matrix, so viele Spalten wie die rechte.`,
      short: String.raw`Innen gleich, außen bleibt: $(m \times n)(n \times p) = m \times p$.`,
    },
  },
  {
    id: 'mat-falk-no-sum',
    name: 'Nur das erste Produkt, nicht aufsummiert',
    wrongFormula: String.raw`c_{11} = a_{11} b_{11}`,
    why: {
      detailed: String.raw`Ein Eintrag des Produkts ist das Skalarprodukt aus einer **ganzen Zeile** der linken und einer **ganzen Spalte** der rechten Matrix: erster mal erster plus zweiter mal zweiter plus … Alle Produkte werden addiert.`,
      short: String.raw`$c_{ij}$: Zeile $i$ mal Spalte $j$, alle Produkte addiert.`,
    },
  },
  {
    id: 'mat-falk-plus',
    name: 'Addiert statt malgenommen',
    wrongFormula: String.raw`c_{11} = (a_{11} + b_{11}) + (a_{12} + b_{21})`,
    why: {
      detailed: String.raw`Im Falk-Schema werden die Einträge von Zeile und Spalte paarweise **malgenommen** und erst die Produkte addiert, wie beim Skalarprodukt.`,
      short: String.raw`Paarweise malnehmen, dann addieren.`,
    },
  },
  {
    id: 'mat-row-row',
    name: 'Zeile mal Zeile statt Zeile mal Spalte',
    wrongFormula: String.raw`c_{12} = a_{11} b_{21} + a_{12} b_{22}`,
    why: {
      detailed: String.raw`Für $c_{ij}$ nimmst du die $i$-te **Zeile** der linken Matrix und die $j$-te **Spalte** der rechten. Im Falk-Schema steht die rechte Matrix oben: Ihre Spalte läuft senkrecht über dem Eintrag.`,
      short: String.raw`Zeile der linken mal **Spalte** der rechten Matrix.`,
    },
  },
  {
    id: 'mat-col-col',
    name: 'Spalte mal Spalte statt Zeile mal Spalte',
    wrongFormula: String.raw`c_{21} = a_{12} b_{11} + a_{22} b_{21}`,
    why: {
      detailed: String.raw`Von der **linken** Matrix nimmst du eine **Zeile**, von der rechten eine Spalte. Im Falk-Schema läuft die Zeile der linken Matrix waagrecht auf den Eintrag zu, die Spalte der rechten senkrecht.`,
      short: String.raw`Links eine **Zeile**, rechts eine Spalte.`,
    },
  },
  {
    id: 'mat-entrywise',
    name: 'Eintrag für Eintrag malgenommen',
    wrongFormula: String.raw`\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} \begin{pmatrix} 5 & 6 \\ 7 & 8 \end{pmatrix} = \begin{pmatrix} 5 & 12 \\ 21 & 32 \end{pmatrix}`,
    why: {
      detailed: String.raw`Matrizen werden nicht Eintrag für Eintrag malgenommen (das geht nur bei Summe und Differenz). Jeder Eintrag des Produkts ist Zeile mal Spalte: das Skalarprodukt einer Zeile der linken mit einer Spalte der rechten Matrix.`,
      short: String.raw`Produkt: Zeile mal Spalte, nicht Stelle mal Stelle.`,
    },
  },
  {
    id: 'mat-order-swap',
    name: 'Reihenfolge vertauscht',
    wrongFormula: String.raw`AB = BA`,
    why: {
      detailed: String.raw`Beim Matrizenprodukt zählt die Reihenfolge: Meist ist $AB \ne BA$, oft ist eins der beiden gar nicht definiert. Bei $AB$ kommen die Zeilen von $A$ und die Spalten von $B$.`,
      short: String.raw`$AB$: Zeilen von $A$, Spalten von $B$; meist $AB \ne BA$.`,
    },
  },
  {
    id: 'mat-product-undefined',
    name: 'Produkt mit unpassenden Formaten',
    wrongFormula: String.raw`A \in \mathbb{R}^{2 \times 3},\; B \in \mathbb{R}^{2 \times 3} \;\Rightarrow\; AB \text{ definiert}`,
    why: {
      detailed: String.raw`$AB$ ist nur definiert, wenn $A$ so viele **Spalten** hat wie $B$ **Zeilen**: Jede Zeile von $A$ muss genau so lang sein wie jede Spalte von $B$. Gleiches Format allein reicht nicht.`,
      short: String.raw`$AB$: Spalten von $A$ = Zeilen von $B$.`,
    },
  },
  {
    id: 'mat-outer-inner',
    name: 'Zeile mal Spalte und Spalte mal Zeile verwechselt',
    wrongFormula: String.raw`\vec u\,\vec v^{\mathsf T} = \vec u \cdot \vec v`,
    why: {
      detailed: String.raw`Die Formate entscheiden: $\vec u^{\mathsf T} \vec v$ ist $(1 \times n)(n \times 1) = 1 \times 1$, also eine **Zahl** (das Skalarprodukt). $\vec u\,\vec v^{\mathsf T}$ ist $(n \times 1)(1 \times n) = n \times n$, also eine **Matrix** mit den Einträgen $u_i v_j$.`,
      short: String.raw`Zeile mal Spalte: Zahl; Spalte mal Zeile: Matrix.`,
    },
  },
  {
    id: 'mat-col-row',
    name: 'Zeile statt Spalte genommen',
    wrongFormula: String.raw`A \vec e_1 = \text{erste Zeile von } A`,
    why: {
      detailed: String.raw`$A\vec x$ rechnest du Zeile mal Vektor: $x_1$ mal die erste **Spalte** plus $x_2$ mal die zweite **Spalte** und so weiter. Darum ist $A \vec e_1$ die erste Spalte von $A$: Die Spalten sind die Bilder der Einheitsvektoren.`,
      short: String.raw`$A\vec e_j$ ist die $j$-te **Spalte** von $A$.`,
    },
  },
  {
    id: 'mat-identity-all',
    name: 'Zahl von jedem Eintrag abgezogen statt nur auf der Diagonale',
    wrongFormula: String.raw`A - 2E = \begin{pmatrix} a_{11} - 2 & a_{12} - 2 \\ a_{21} - 2 & a_{22} - 2 \end{pmatrix}`,
    why: {
      detailed: String.raw`Die Einheitsmatrix $E$ hat Einsen nur auf der **Hauptdiagonale**, sonst Nullen. $kE$ hat also $k$ auf der Diagonale und $0$ daneben; abgezogen wird nur auf der Diagonale. Eine Zahl allein von einer Matrix abzuziehen, ist nicht erklärt.`,
      short: String.raw`$kE$: $k$ nur auf der Hauptdiagonale.`,
    },
  },
  // ---------------------------------------------------------------- Vertauschbar mit Parameter
  {
    id: 'mat-param-sign',
    name: 'Vorzeichen beim Auflösen',
    wrongFormula: String.raw`3a + 2 = a + 8 \;\Rightarrow\; 2a = -6`,
    why: {
      detailed: String.raw`Bringst du eine Zahl auf die andere Seite, dreht sich ihr Vorzeichen. Sammle alle Glieder mit $a$ auf einer Seite, die Zahlen auf der anderen, und teile erst dann durch die Zahl vor $a$.`,
      short: String.raw`Beim Herüberbringen dreht sich das Vorzeichen.`,
    },
  },
  {
    id: 'mat-commute',
    name: 'Angenommen, dass AB = BA immer gilt',
    wrongFormula: String.raw`AB = BA \text{ für jedes } a`,
    why: {
      detailed: String.raw`Matrizen sind beim Malnehmen im Allgemeinen **nicht vertauschbar**. Ob $AB = BA$ gilt, zeigt erst der Vergleich der Einträge; meist klappt es nur für einzelne Werte des Parameters.`,
      short: String.raw`$AB = BA$ gilt nicht von selbst: Einträge vergleichen.`,
    },
  },
]
