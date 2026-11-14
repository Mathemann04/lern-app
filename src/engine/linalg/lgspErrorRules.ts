import type { VectorErrorRule } from './errorRules.ts'

// Typische Fehler bei Gleichungssystemen mit Parameter (M7 Schritt 11b, Katalog in docs/PLAN-M7.md). Vorsilbe „lgsp-“.
// Der Text nennt den Fehler und die Regel, verrät aber nicht das Ergebnis des Schritts.

export const LGSP_ERROR_RULES: readonly VectorErrorRule[] = [
  {
    id: 'lgsp-cond-flip',
    name: 'Bedingung umgedreht: genau eine Lösung bei den Sonderwerten',
    wrongFormula: String.raw`(a - 2)\,z = 3 \;\Rightarrow\; \text{genau eine Lösung für } a = 2`,
    why: {
      detailed: String.raw`Die Sonderwerte sind die Werte von $a$, bei denen in der Stufenform eine Stufe wegfällt (dort ist auch $\det A = 0$). Genau dort gibt es **nicht** genau eine Lösung, sondern keine oder unendlich viele. Genau eine Lösung gibt es für alle **anderen** Werte.`,
      short: String.raw`Bei den Sonderwerten gibt es nicht genau eine Lösung.`,
    },
  },
  {
    id: 'lgsp-cond-all',
    name: 'Sonderfälle übersehen: genau eine Lösung für alle a',
    wrongFormula: String.raw`(a - 2)\,z = 3 \;\Rightarrow\; z = \frac{3}{a - 2} \text{ für alle } a`,
    why: {
      detailed: String.raw`Durch einen Ausdruck mit $a$ darfst du nur teilen, wenn er nicht $0$ ist. Wird die Zahl vor der letzten Unbekannten (oder $\det A$) für ein $a$ zu $0$, fällt dort eine Stufe weg, und es gibt keine oder unendlich viele Lösungen. Diese Werte musst du ausschließen.`,
      short: String.raw`Werte, für die der Ausdruck vor der Unbekannten $0$ wird, ausschließen.`,
    },
  },
  {
    id: 'lgsp-cond-rhs',
    name: 'Nullstelle der rechten Seite statt der linken genommen',
    wrongFormula: String.raw`(a - 2)\,z = a + 1 \;\Rightarrow\; \text{Sonderfall bei } a = -1`,
    why: {
      detailed: String.raw`Ob es eine Stufe gibt, entscheidet die Zahl **vor** der Unbekannten, also links vom Strich. Die rechte Seite entscheidet erst danach, bei den Sonderwerten, zwischen keiner und unendlich vielen Lösungen.`,
      short: String.raw`Sonderwerte kommen von der linken Seite.`,
    },
  },
  {
    id: 'lgsp-one-root',
    name: 'Nur eine Lösung der quadratischen Gleichung beachtet',
    wrongFormula: String.raw`(a - 1)(a + 3) = 0 \;\Rightarrow\; a = 1`,
    why: {
      detailed: String.raw`Eine quadratische Gleichung in $a$ hat oft zwei Lösungen: $(a - 1)(a + 3)$ ist für $a = 1$ **und** für $a = -3$ gleich $0$, denn ein Produkt ist $0$, sobald ein Faktor $0$ ist. Beide Werte gehören zur Antwort, solange keiner wegfällt.`,
      short: String.raw`Beide Lösungen der quadratischen Gleichung beachten.`,
    },
  },
  {
    id: 'lgsp-special-missed',
    name: 'Sonderfall übersehen: für kein a',
    wrongFormula: String.raw`(a - 2)\,z = 3 \;\Rightarrow\; \text{für kein } a \text{ keine Lösung}`,
    why: {
      detailed: String.raw`Setz jeden Sonderwert einzeln in die Stufenform ein. Wird die letzte Zeile zu $0 = c$ mit $c \ne 0$, hat das System dort keine Lösung; wird sie zu $0 = 0$, unendlich viele. Jeder Sonderwert führt zu einem dieser beiden Fälle.`,
      short: String.raw`Jeden Sonderwert einsetzen und die letzte Zeile ansehen.`,
    },
  },
  {
    id: 'lgsp-rank-augmented',
    name: 'Widerspruchszeile auch beim Rang von A gezählt',
    wrongFormula: String.raw`0 \;\; 0 \;\; 0 \mid 5 \;\Rightarrow\; \operatorname{rg}(A) = 3`,
    why: {
      detailed: String.raw`Beim Rang von $A$ zählen nur die Zahlen **links** vom Strich. Eine Zeile $0 \; \ldots \; 0 \mid c$ ist links eine Nullzeile; sie zählt nur beim Rang der erweiterten Matrix $(A \mid \vec b)$.`,
      short: String.raw`Für $\operatorname{rg}(A)$ nur links vom Strich zählen.`,
    },
  },
  {
    id: 'lgsp-rank-rhs',
    name: 'Rechte Seite beim Rang der erweiterten Matrix übersehen',
    wrongFormula: String.raw`0 \;\; 0 \;\; 0 \mid 5 \;\Rightarrow\; \operatorname{rg}(A \mid \vec b) = \operatorname{rg}(A)`,
    why: {
      detailed: String.raw`Zur erweiterten Matrix $(A \mid \vec b)$ gehört auch die rechte Seite. Eine Zeile $0 \; \ldots \; 0 \mid c$ mit $c \ne 0$ ist dort keine Nullzeile und zählt mit, auch wenn links nur Nullen stehen.`,
      short: String.raw`Bei $(A \mid \vec b)$ zählt die rechte Seite mit.`,
    },
  },
  {
    id: 'lgsp-rank-unequal',
    name: 'Verschiedene Ränge als lösbar gedeutet',
    wrongFormula: String.raw`\operatorname{rg}(A) = 2,\; \operatorname{rg}(A \mid \vec b) = 3 \;\Rightarrow\; \text{unendlich viele Lösungen}`,
    why: {
      detailed: String.raw`Lösbar ist ein System genau dann, wenn $\operatorname{rg}(A) = \operatorname{rg}(A \mid \vec b)$ ist. Ist der Rang der erweiterten Matrix größer, steckt in der Stufenform eine Zeile $0 = c$ mit $c \ne 0$, ein Widerspruch.`,
      short: String.raw`Lösbar nur bei gleichen Rängen.`,
    },
  },
  {
    id: 'lgsp-rank-full',
    name: 'Gleiche Ränge als genau eine Lösung gedeutet',
    wrongFormula: String.raw`\operatorname{rg}(A) = \operatorname{rg}(A \mid \vec b) = 2 < 3 \;\Rightarrow\; \text{genau eine Lösung}`,
    why: {
      detailed: String.raw`Gleiche Ränge heißen nur: Das System ist lösbar. Genau eine Lösung gibt es erst, wenn der Rang auch gleich der Zahl $n$ der Unbekannten ist. Ist er kleiner, sind $n - \operatorname{rg}(A)$ Unbekannte frei wählbar.`,
      short: String.raw`Genau eine Lösung nur bei Rang gleich Zahl der Unbekannten.`,
    },
  },
  {
    id: 'lgsp-rank-zero-row',
    name: 'Nullzeile bei der erweiterten Matrix mitgezählt',
    wrongFormula: String.raw`0 \;\; 0 \;\; 0 \mid 0 \;\Rightarrow\; \operatorname{rg}(A \mid \vec b) = 3`,
    why: {
      detailed: String.raw`Eine Zeile, in der auch rechts $0$ steht, ist eine Nullzeile und zählt bei **keinem** Rang. Bei $(A \mid \vec b)$ zählt nur eine Zeile $0 \; \ldots \; 0 \mid c$ mit $c \ne 0$ zusätzlich.`,
      short: String.raw`Nullzeilen zählen bei keinem Rang.`,
    },
  },
  {
    id: 'lgsp-rank-rows',
    name: 'Rang als Zahl der Zeilen gezählt',
    wrongFormula: String.raw`3 \text{ Zeilen} \;\Rightarrow\; \operatorname{rg}(A) = 3`,
    why: {
      detailed: String.raw`Der Rang ist die Zahl der Stufen in der Stufenform, also der Zeilen, die **nicht** nur aus Nullen bestehen. Eine Nullzeile zählt nicht, auch wenn sie in der Tabelle steht.`,
      short: String.raw`Rang = Zahl der Zeilen, die nicht nur Nullen haben.`,
    },
  },
  {
    id: 'lgsp-b-sign',
    name: 'Vorzeichenfehler beim Auflösen nach b',
    wrongFormula: String.raw`0 = b + 3 \;\Rightarrow\; b = 3`,
    why: {
      detailed: String.raw`Die rechte Seite soll $0$ werden. Bringst du die Zahl auf die andere Seite, wechselt ihr **Vorzeichen**; danach teilst du durch die Zahl vor $b$. Mach die Probe durch Einsetzen.`,
      short: String.raw`Rüberbringen: Vorzeichen wechselt.`,
    },
  },
  {
    id: 'lgsp-b-divide',
    name: 'Nicht durch die Zahl vor b geteilt',
    wrongFormula: String.raw`0 = 2b - 6 \;\Rightarrow\; b = 6`,
    why: {
      detailed: String.raw`Steht vor $b$ eine Zahl, teilst du am Ende noch durch sie. Mach die Probe: Mit deinem Wert muss die rechte Seite genau $0$ ergeben.`,
      short: String.raw`Noch durch die Zahl vor $b$ teilen.`,
    },
  },
  {
    id: 'lgsp-b-ignored',
    name: 'Parameter rechts übersehen: für jedes b',
    wrongFormula: String.raw`0 = b - 3 \;\Rightarrow\; \text{unendlich viele Lösungen für jedes } b`,
    why: {
      detailed: String.raw`Beim Sonderwert von $a$ steht in der letzten Zeile links nur noch $0$. Ob sie $0 = 0$ ist (unendlich viele Lösungen) oder ein Widerspruch (keine Lösung), entscheidet die rechte Seite, und die hängt von $b$ ab. Sie ist nur für ein einziges $b$ gleich $0$.`,
      short: String.raw`Die rechte Seite hängt von $b$ ab.`,
    },
  },
  {
    id: 'lgsp-b-none',
    name: 'Zeile mit b für jedes b als Widerspruch gelesen',
    wrongFormula: String.raw`0 = b - 3 \;\Rightarrow\; \text{für kein } b`,
    why: {
      detailed: String.raw`Ein Widerspruch ist $0 = c$ mit einer Zahl $c \ne 0$. Steht rechts ein Ausdruck mit $b$, kann er $0$ werden: Dann heißt die Zeile $0 = 0$ und fällt weg. Setz die rechte Seite gleich $0$ und löse nach $b$.`,
      short: String.raw`Rechte Seite gleich $0$ setzen und nach $b$ lösen.`,
    },
  },
  {
    id: 'lgsp-excluded',
    name: 'Wert behalten, bei dem die letzte Stufe wegfällt',
    wrongFormula: String.raw`(a - 1)(a + 2)\,z = a - 1,\; z = \frac{1}{3} \;\Rightarrow\; a = 1 \text{ behalten}`,
    why: {
      detailed: String.raw`Beim Malnehmen mit dem Ausdruck vor der Unbekannten können Werte dazukommen, für die dieser Ausdruck $0$ ist. Dort fällt die letzte Stufe weg: Das System hat keine oder unendlich viele Lösungen, also keine eindeutige mit dem gesuchten Wert. Prüf jede Lösung.`,
      short: String.raw`Werte, bei denen der Ausdruck vor der Unbekannten $0$ ist, fallen weg.`,
    },
  },
  {
    id: 'lgsp-target-numerator',
    name: 'Nur die rechte Seite gleich dem Wert gesetzt',
    wrongFormula: String.raw`(a + 2)\,z = a,\; z = 3 \;\Rightarrow\; a = 3`,
    why: {
      detailed: String.raw`Aus der letzten Zeile $q(a)\,z = s(a)$ folgt $z = \frac{s(a)}{q(a)}$. Soll die Unbekannte den Wert $c$ haben, heißt das $s(a) = c \cdot q(a)$. Der Ausdruck vor der Unbekannten fällt nicht einfach weg.`,
      short: String.raw`Mit dem Ausdruck vor der Unbekannten malnehmen.`,
    },
  },
  {
    id: 'lgsp-target-flip',
    name: 'Bruch für die Unbekannte umgedreht',
    wrongFormula: String.raw`(a + 2)\,z = a \;\Rightarrow\; z = \frac{a + 2}{a}`,
    why: {
      detailed: String.raw`Du teilst durch den Ausdruck **vor** der Unbekannten: Aus $q(a)\,z = s(a)$ wird $z = \frac{s(a)}{q(a)}$. Die rechte Seite steht oben.`,
      short: String.raw`Rechte Seite oben, Ausdruck vor der Unbekannten unten.`,
    },
  },
  {
    id: 'lgsp-general-formula',
    name: 'Allgemeine Lösung auf den Sonderfall angewandt',
    wrongFormula: String.raw`z = \frac{a - 1}{(a - 1)(a + 2)} = \frac{1}{a + 2} \;\Rightarrow\; \text{bei } a = 1 \text{ nur } z = \frac{1}{3}`,
    why: {
      detailed: String.raw`Die Formel für den allgemeinen Fall entsteht durch Teilen durch einen Ausdruck mit $a$; beim Sonderwert ist er $0$, dort gilt sie nicht. Setz den Sonderwert in die Stufenform ein: Eine Nullzeile heißt, eine Unbekannte ist frei wählbar. Dann gibt es unendlich viele Lösungen, nicht nur eine.`,
      short: String.raw`Sonderwert in die Stufenform einsetzen, nicht in die allgemeine Formel.`,
    },
  },
]
