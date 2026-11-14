import type { VectorErrorRule } from './errorRules.ts'

// Typische Fehler bei Matrizengleichungen (M7 Schritt 12b, Katalog in docs/PLAN-M7.md). Vorsilbe „mgl-“. Der Text nennt
// den Fehler und die Regel, verrät aber nicht das Ergebnis des Schritts.

export const MGL_ERROR_RULES: readonly VectorErrorRule[] = [
  // ---------------------------------------------------------------- allgemein auflösen
  {
    id: 'mgl-move-sign',
    name: 'Beim Rüberbringen das Vorzeichen nicht gewechselt',
    wrongFormula: String.raw`AX = 2X + B \;\Rightarrow\; AX + 2X = B`,
    why: {
      detailed: String.raw`Bringst du ein Glied auf die andere Seite, ziehst du es auf beiden Seiten ab (oder addierst es). Dabei **wechselt es sein Vorzeichen**, genau wie bei Gleichungen mit Zahlen. Das gilt für die Glieder mit $X$ und für die gegebenen Matrizen.`,
      short: String.raw`Seite gewechselt, Vorzeichen gewechselt.`,
    },
  },
  {
    id: 'mgl-no-e',
    name: 'Zahl ohne Einheitsmatrix ausgeklammert',
    wrongFormula: String.raw`AX - 2X = (A - 2)X`,
    why: {
      detailed: String.raw`$A - 2$ ist nicht erklärt: Eine Zahl kann man nicht von einer Matrix abziehen. Schreib zuerst $2X = 2EX$ (denn $EX = X$), dann lässt sich $X$ ausklammern, und in der Klammer steht $2E$: eine Matrix mit $2$ auf der Hauptdiagonale.`,
      short: String.raw`Zahl als Vielfaches von $E$ schreiben: $2X = 2EX$.`,
    },
  },
  {
    id: 'mgl-factor-side',
    name: 'X auf der falschen Seite ausgeklammert',
    wrongFormula: String.raw`AX + 3X = X(A + 3E)`,
    why: {
      detailed: String.raw`Matrizen darf man nicht vertauschen, darum bleibt $X$ beim Ausklammern auf **seiner** Seite: Steht es in $AX$ rechts von $A$, wird es nach rechts ausgeklammert, $(\dots)X$; steht es in $XA$ links, nach links, $X(\dots)$.`,
      short: String.raw`$X$ bleibt auf seiner Seite: $AX + kX = (A + kE)X$.`,
    },
  },
  {
    id: 'mgl-mult-side',
    name: 'Von der falschen Seite mit der Inversen malgenommen',
    wrongFormula: String.raw`MX = B \;\Rightarrow\; X = BM^{-1}`,
    why: {
      detailed: String.raw`$M^{-1}$ hebt $M$ nur auf, wenn es direkt neben $M$ steht. Steht $M$ links von $X$, nimmst du beide Seiten **von links** mit $M^{-1}$ mal: $M^{-1}MX = X$. Steht $M$ rechts von $X$, von rechts. Weil Matrizen nicht vertauschbar sind, ist $BM^{-1}$ meist etwas anderes als $M^{-1}B$.`,
      short: String.raw`Von der Seite malnehmen, auf der $M$ steht.`,
    },
  },
  {
    id: 'mgl-mult-part',
    name: 'Nur einen Teil der rechten Seite malgenommen',
    wrongFormula: String.raw`MX = B - C \;\Rightarrow\; X = M^{-1}B - C`,
    why: {
      detailed: String.raw`Mit $M^{-1}$ wird die **ganze** andere Seite malgenommen, also $M^{-1}(B - C)$ bzw. $(B - C)M^{-1}$. Wie bei Zahlen gehört sie dabei in eine Klammer; sonst bleibt ein Glied stehen, das gar nicht malgenommen wurde.`,
      short: String.raw`Die ganze rechte Seite in Klammern malnehmen.`,
    },
  },
  {
    id: 'mgl-inverse-sum',
    name: 'Inverse einer Summe gliedweise gebildet',
    wrongFormula: String.raw`(A + 2E)^{-1} = A^{-1} + \frac{1}{2}E`,
    why: {
      detailed: String.raw`Die Inverse einer Summe ist **nicht** die Summe der Inversen, auch bei Zahlen nicht: $\frac{1}{3 + 2} \ne \frac{1}{3} + \frac{1}{2}$. Die Klammer wird als eine Matrix $M$ ausgerechnet, und von ihr bildest du die Inverse.`,
      short: String.raw`Erst die Klammer ausrechnen, dann invertieren.`,
    },
  },
  {
    id: 'mgl-mult-inverse',
    name: 'Mit der Inversen statt mit der Matrix selbst malgenommen',
    wrongFormula: String.raw`A^{-1}X = B \;\Rightarrow\; X = A^{-1}B`,
    why: {
      detailed: String.raw`Steht schon $A^{-1}$ neben $X$, macht $A$ sie rückgängig, denn $AA^{-1} = A^{-1}A = E$. Nimmst du noch einmal mit $A^{-1}$ mal, steht $A^{-1}A^{-1}X$ bzw. $XA^{-1}A^{-1}$ da, und $X$ ist nicht frei.`,
      short: String.raw`$A^{-1}$ hebt man mit $A$ auf.`,
    },
  },
  // ---------------------------------------------------------------- Transponierte und Inverse
  {
    id: 'mgl-transpose-twice',
    name: 'Doppelt transponiert nicht aufgehoben',
    wrongFormula: String.raw`(X^{\mathsf T}A)^{\mathsf T} = A^{\mathsf T}X^{\mathsf T}`,
    why: {
      detailed: String.raw`Beim Transponieren eines Produkts wird **jeder** Faktor transponiert, auch $X^{\mathsf T}$, und zweimal transponieren hebt sich auf: $(X^{\mathsf T})^{\mathsf T} = X$.`,
      short: String.raw`$(X^{\mathsf T})^{\mathsf T} = X$.`,
    },
  },
  {
    id: 'mgl-cancel',
    name: 'A und die Inverse um X herum weggekürzt',
    wrongFormula: String.raw`AXA^{-1} = B \;\Rightarrow\; X = B`,
    why: {
      detailed: String.raw`$A$ und $A^{-1}$ heben sich nur auf, wenn sie **direkt nebeneinander** stehen. Hier steht $X$ dazwischen, und Matrizen darf man nicht vertauschen. Du musst von links und von rechts mit der passenden Inversen malnehmen, auch auf der anderen Seite.`,
      short: String.raw`Nicht kürzen: von links und rechts malnehmen.`,
    },
  },
  {
    id: 'mgl-conj-same',
    name: 'Von beiden Seiten mit derselben Matrix malgenommen',
    wrongFormula: String.raw`AXA^{-1} = B \;\Rightarrow\; X = A^{-1}BA^{-1}`,
    why: {
      detailed: String.raw`Links und rechts von $X$ stehen verschiedene Matrizen, $A$ und $A^{-1}$. Jede hebst du mit **ihrer eigenen** Inversen auf: Die Inverse von $A$ ist $A^{-1}$, die Inverse von $A^{-1}$ ist $A$. Mit derselben Matrix auf beiden Seiten hebt sich nur eine der beiden auf.`,
      short: String.raw`Jede Matrix mit ihrer eigenen Inversen aufheben.`,
    },
  },
  // ---------------------------------------------------------------- einsetzen
  {
    id: 'mgl-e-all',
    name: 'Zahl zu jedem Eintrag addiert statt nur auf der Diagonale',
    wrongFormula: String.raw`A + 2E = \begin{pmatrix} a_{11} + 2 & a_{12} + 2 \\ a_{21} + 2 & a_{22} + 2 \end{pmatrix}`,
    why: {
      detailed: String.raw`Die Einheitsmatrix $E$ hat Einsen nur auf der **Hauptdiagonale**, sonst Nullen. $kE$ hat also $k$ auf der Diagonale und $0$ daneben; dazugezählt wird nur auf der Diagonale.`,
      short: String.raw`$kE$: $k$ nur auf der Hauptdiagonale.`,
    },
  },
  {
    id: 'mgl-e-anti',
    name: 'Zahl auf der Nebendiagonale eingetragen',
    wrongFormula: String.raw`A - 3E = \begin{pmatrix} a_{11} & a_{12} - 3 \\ a_{21} - 3 & a_{22} \end{pmatrix}`,
    why: {
      detailed: String.raw`Die Einsen der Einheitsmatrix stehen auf der **Hauptdiagonale**, von oben links nach unten rechts. Die Nebendiagonale (oben rechts nach unten links) bleibt bei $kE$ frei.`,
      short: String.raw`$E$: Einsen von oben links nach unten rechts.`,
    },
  },
]
