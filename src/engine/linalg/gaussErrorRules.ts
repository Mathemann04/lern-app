import type { VectorErrorRule } from './errorRules.ts'

// Typische Fehler beim Gauß-Verfahren (M7 Schritt 10a, Katalog in docs/PLAN-M7.md). Vorsilbe „gauss-“. Der Text nennt
// den Fehler und die Regel, verrät aber nicht das Ergebnis des Schritts.

export const GAUSS_ERROR_RULES: readonly VectorErrorRule[] = [
  // ---------------------------------------------------------------- Tabelle aufstellen
  {
    id: 'gauss-setup-order',
    name: 'Zahlen in der Reihenfolge des Aufschreibens übernommen',
    wrongFormula: String.raw`2y + x = 5 \;\Rightarrow\; \begin{array}{rr|r} 2 & 1 & 5 \end{array}`,
    why: {
      detailed: String.raw`In der Tabelle hat jede Variable ihre **feste Spalte**, egal in welcher Reihenfolge die Glieder in der Gleichung stehen. Ordne jede Zahl der Spalte ihrer Variablen zu.`,
      short: String.raw`Jede Zahl in die Spalte ihrer Variablen.`,
    },
  },
  {
    id: 'gauss-setup-side',
    name: 'Vorzeichen beim Rüberbringen einer Variablen vergessen',
    wrongFormula: String.raw`x + y = 3 + z \;\Rightarrow\; \begin{array}{rrr|r} 1 & 1 & 1 & 3 \end{array}`,
    why: {
      detailed: String.raw`Links vom Strich stehen alle Variablen auf **einer** Seite. Ein Glied, das rechts vom Gleichheitszeichen steht, wechselt beim Rüberbringen sein **Vorzeichen**.`,
      short: String.raw`Glied von rechts nach links: Vorzeichen wechselt.`,
    },
  },
  {
    id: 'gauss-setup-const',
    name: 'Zahl von der linken Seite ohne Vorzeichenwechsel übernommen',
    wrongFormula: String.raw`x - y - 4 = 0 \;\Rightarrow\; \begin{array}{rr|r} 1 & -1 & -4 \end{array}`,
    why: {
      detailed: String.raw`Rechts vom Strich steht die Zahl, die allein auf der **rechten** Seite der Gleichung steht. Eine Zahl auf der linken Seite musst du erst hinüberbringen, und dabei wechselt ihr Vorzeichen.`,
      short: String.raw`Zahl nach rechts bringen: Vorzeichen wechselt.`,
    },
  },
  {
    id: 'gauss-setup-gap',
    name: 'Fehlende Variable nicht als 0 eingetragen',
    wrongFormula: String.raw`x + 3z = 2 \;\Rightarrow\; \begin{array}{rrr|r} 1 & 3 & 0 & 2 \end{array}`,
    why: {
      detailed: String.raw`Kommt eine Variable in einer Gleichung nicht vor, steht in ihrer Spalte eine **$0$**. Sonst rutschen die übrigen Zahlen in falsche Spalten.`,
      short: String.raw`Fehlende Variable: $0$ in ihrer Spalte.`,
    },
  },
  {
    id: 'gauss-setup-transposed',
    name: 'Zeilen und Spalten vertauscht',
    wrongFormula: String.raw`\text{Zeile} = \text{Zahlen vor } x \text{ aus allen Gleichungen}`,
    why: {
      detailed: String.raw`Jede **Gleichung** wird eine **Zeile**, jede **Variable** eine **Spalte**. Die Zahlen vor $x$ aus allen Gleichungen stehen also untereinander, nicht nebeneinander.`,
      short: String.raw`Gleichung = Zeile, Variable = Spalte.`,
    },
  },
  // ---------------------------------------------------------------- Nullen erzeugen
  {
    id: 'gauss-rhs',
    name: 'Rechte Seite nicht mit umgeformt',
    wrongFormula: String.raw`\text{II} - 2 \cdot \text{I}\text{, rechts bleibt die alte Zahl}`,
    why: {
      detailed: String.raw`Eine Zeile ist eine ganze Gleichung. Was du links rechnest, musst du **auch rechts vom Strich** rechnen, sonst ist es nicht mehr dieselbe Gleichung.`,
      short: String.raw`Rechte Seite immer mitrechnen.`,
    },
  },
  {
    id: 'gauss-rhs-multiple',
    name: 'Rechts das Vielfache vergessen',
    wrongFormula: String.raw`\text{II} - 2 \cdot \text{I}\text{: rechts } 5 - 3 \text{ statt } 5 - 2 \cdot 3`,
    why: {
      detailed: String.raw`Das Vielfache gilt für die **ganze** Zeile I, auch für die Zahl rechts vom Strich. Nimm sie genauso mal wie die Zahlen links.`,
      short: String.raw`Auch rechts das Vielfache der Zeile abziehen.`,
    },
  },
  {
    id: 'gauss-first-only',
    name: 'Vielfaches nur beim ersten Eintrag',
    wrongFormula: String.raw`\text{II} - 2 \cdot \text{I}\text{: hinten } a_{2j} - a_{1j} \text{ statt } a_{2j} - 2a_{1j}`,
    why: {
      detailed: String.raw`Die Zahl, mit der du Zeile I malnimmst, gilt für **jeden** Eintrag der Zeile, nicht nur für den, der $0$ werden soll. Rechne Eintrag für Eintrag: neue Zahl = alte Zahl minus Faktor mal Zahl aus der Stufenzeile.`,
      short: String.raw`Jeden Eintrag mit dem Faktor rechnen.`,
    },
  },
  {
    id: 'gauss-sign',
    name: 'Vorzeichenfehler beim Abziehen',
    wrongFormula: String.raw`3 - 2 \cdot (-1) = 1`,
    why: {
      detailed: String.raw`Beim Abziehen einer negativen Zahl wird **addiert**: $a - k \cdot (-b) = a + kb$. Rechne jeden Eintrag einzeln mit Klammern.`,
      short: String.raw`Minus mal Minus gibt Plus.`,
    },
  },
  {
    id: 'gauss-scale-first',
    name: 'Beim Malnehmen nur die erste Zahl verändert',
    wrongFormula: String.raw`10 \cdot (0{,}5x + 1{,}5y = 2) \;\Rightarrow\; 5x + 1{,}5y = 2`,
    why: {
      detailed: String.raw`Malnehmen ist erlaubt, aber nur mit der **ganzen** Gleichung: jedes Glied links und die Zahl rechts.`,
      short: String.raw`Jedes Glied malnehmen, auch rechts.`,
    },
  },
  {
    id: 'gauss-scale-decimals',
    name: 'Nur die Kommazahlen malgenommen',
    wrongFormula: String.raw`10 \cdot (0{,}5x + 2y = 3) \;\Rightarrow\; 5x + 2y = 3`,
    why: {
      detailed: String.raw`Auch die ganzen Zahlen der Gleichung werden mit dem Faktor malgenommen, sonst stimmt das Verhältnis der Glieder nicht mehr.`,
      short: String.raw`Alle Glieder malnehmen, nicht nur die Kommazahlen.`,
    },
  },
  // ---------------------------------------------------------------- 0 oben in der Spalte
  {
    id: 'gauss-zero-pivot-none',
    name: 'Bei einer 0 oben „keine Lösung“ geschlossen',
    wrongFormula: String.raw`\begin{array}{rrr|r} 0 & 2 & 1 & 3 \\ 1 & 1 & 0 & 2 \end{array} \;\Rightarrow\; \text{keine Lösung}`,
    why: {
      detailed: String.raw`Eine $0$ an der Stelle der Stufe sagt nichts über die Lösungen. Du darfst die **Zeilen tauschen** (die Reihenfolge der Gleichungen ist egal) und eine Zeile ohne $0$ nach oben holen.`,
      short: String.raw`Zeilen tauschen, dann weiter.`,
    },
  },
  {
    id: 'gauss-zero-pivot-zero',
    name: 'Bei einer 0 oben die Variable 0 gesetzt',
    wrongFormula: String.raw`\begin{array}{rr|r} 0 & 2 & 3 \\ 1 & 1 & 2 \end{array} \;\Rightarrow\; x = 0`,
    why: {
      detailed: String.raw`Dass $x$ in **einer** Gleichung fehlt, heißt nicht, dass $x = 0$ ist; in den anderen Gleichungen kommt $x$ ja vor. Tausch die Zeilen, damit oben keine $0$ steht.`,
      short: String.raw`Fehlt $x$ in einer Gleichung, ist $x$ nicht $0$.`,
    },
  },
  {
    id: 'gauss-zero-pivot-skip',
    name: 'Spalte übersprungen, obwohl darunter keine 0 steht',
    wrongFormula: String.raw`\begin{array}{rr|r} 0 & 2 & 3 \\ 1 & 1 & 2 \end{array} \;\Rightarrow\; \text{mit Spalte 2 weiter}`,
    why: {
      detailed: String.raw`Weiter zur nächsten Spalte geht es erst, wenn **unter** der Stufe überall $0$ steht. Steht weiter unten noch eine Zahl ungleich $0$, holst du diese Zeile durch Tauschen nach oben.`,
      short: String.raw`Erst tauschen, dann Nullen erzeugen.`,
    },
  },
  // ---------------------------------------------------------------- Stufenform deuten
  {
    id: 'gauss-unique-none',
    name: 'Keine Lösung gesehen, obwohl kein Widerspruch dasteht',
    wrongFormula: String.raw`\text{jede Variable hat eine Stufe} \;\Rightarrow\; \text{keine Lösung}`,
    why: {
      detailed: String.raw`Keine Lösung gibt es nur bei einer Zeile $0 = c$ mit $c \ne 0$ (links alles $0$, rechts nicht). Hat jede Variable eine Stufe und gibt es keinen Widerspruch, gibt es **genau eine** Lösung.`,
      short: String.raw`Nur $0 = c$ mit $c \ne 0$ heißt keine Lösung.`,
    },
  },
  {
    id: 'gauss-unique-inf',
    name: 'Unendlich viele Lösungen gesehen, obwohl jede Variable eine Stufe hat',
    wrongFormula: String.raw`\text{jede Variable hat eine Stufe} \;\Rightarrow\; \text{unendlich viele}`,
    why: {
      detailed: String.raw`Unendlich viele Lösungen gibt es nur, wenn eine Variable **keine Stufe** hat und frei wählbar ist. Zähl die Stufen: So viele wie Variablen heißt genau eine Lösung.`,
      short: String.raw`Stufen zählen: so viele wie Variablen.`,
    },
  },
  {
    id: 'gauss-zero-rhs-none',
    name: 'Eine 0 rechts als Widerspruch gedeutet',
    wrongFormula: String.raw`\begin{array}{rrr|r} 0 & 0 & 3 & 0 \end{array} \;\Rightarrow\; \text{keine Lösung}`,
    why: {
      detailed: String.raw`Die Zeile $0 \; 0 \; 3 \mid 0$ heißt $3z = 0$, also $z = 0$. Das ist eine ganz normale Lösung, kein Widerspruch. Widerspruch heißt: **links nur Nullen**, rechts nicht.`,
      short: String.raw`$3z = 0$ heißt $z = 0$, kein Widerspruch.`,
    },
  },
  {
    id: 'gauss-zero-row-inf',
    name: 'Jede Nullzeile als „unendlich viele Lösungen“ gedeutet',
    wrongFormula: String.raw`\text{Nullzeile } 0 = 0 \;\Rightarrow\; \text{unendlich viele}`,
    why: {
      detailed: String.raw`Eine Nullzeile $0 = 0$ fällt nur weg. Ob Variablen frei bleiben, entscheidet die **Zahl der Stufen**: Haben alle Variablen eine Stufe (etwa bei mehr Gleichungen als Variablen), gibt es trotzdem genau eine Lösung.`,
      short: String.raw`Nullzeile fällt weg; Stufen zählen.`,
    },
  },
  {
    id: 'gauss-contradiction-value',
    name: 'Widerspruchszeile als Wert einer Variablen gelesen',
    wrongFormula: String.raw`\begin{array}{rrr|r} 0 & 0 & 0 & 5 \end{array} \;\Rightarrow\; z = 5`,
    why: {
      detailed: String.raw`Steht links **nur** $0$, heißt die Zeile $0 \cdot x + 0 \cdot y + 0 \cdot z = 5$, also $0 = 5$. Das kann keine Wahl der Variablen erfüllen: Es ist ein Widerspruch.`,
      short: String.raw`$0 = 5$ ist ein Widerspruch.`,
    },
  },
  {
    id: 'gauss-contradiction-zero',
    name: 'Widerspruch mit einer Nullzeile verwechselt',
    wrongFormula: String.raw`\begin{array}{rrr|r} 0 & 0 & 0 & 5 \end{array} \;\Rightarrow\; \text{unendlich viele}`,
    why: {
      detailed: String.raw`Nur eine Zeile $0 = 0$ (auch rechts $0$) fällt harmlos weg. Steht rechts eine Zahl **ungleich** $0$, ist die Zeile ein Widerspruch, und das ganze System hat dann keine Lösung.`,
      short: String.raw`Rechts ungleich $0$: Widerspruch.`,
    },
  },
  {
    id: 'gauss-zero-row-none',
    name: 'Nullzeile als Widerspruch gedeutet',
    wrongFormula: String.raw`\begin{array}{rrr|r} 0 & 0 & 0 & 0 \end{array} \;\Rightarrow\; \text{keine Lösung}`,
    why: {
      detailed: String.raw`Die Zeile $0 = 0$ ist **immer wahr** und sagt nichts aus; sie fällt weg. Ein Widerspruch wäre $0 = c$ mit $c \ne 0$.`,
      short: String.raw`$0 = 0$ ist wahr und fällt weg.`,
    },
  },
  {
    id: 'gauss-under-none',
    name: 'Weniger Stufen als Variablen als „keine Lösung“ gedeutet',
    wrongFormula: String.raw`\begin{array}{rrr|r} 1 & 2 & 1 & 3 \\ 0 & 1 & -1 & 2 \end{array} \;\Rightarrow\; \text{keine Lösung}`,
    why: {
      detailed: String.raw`Dass eine Variable keine Stufe hat, heißt nicht, dass es keine Lösung gibt. Keine Lösung gibt es nur bei einem **Widerspruch** $0 = c$ mit $c \ne 0$. Ohne ihn ist die Variable ohne Stufe frei wählbar.`,
      short: String.raw`Ohne Zeile $0 = c$ kein Widerspruch.`,
    },
  },
  {
    id: 'gauss-free-missed',
    name: 'Freie Variable übersehen',
    wrongFormula: String.raw`\text{2 Stufen, 3 Variablen} \;\Rightarrow\; \text{genau eine Lösung}`,
    why: {
      detailed: String.raw`Gibt es weniger Stufen als Variablen (und keinen Widerspruch), bleibt mindestens eine Variable **frei wählbar**. Für jeden Wert gibt es eine Lösung, also unendlich viele.`,
      short: String.raw`Weniger Stufen als Variablen: frei wählbar.`,
    },
  },
  // ---------------------------------------------------------------- freie Variablen
  {
    id: 'gauss-free-pivot',
    name: 'Variable mit Stufe frei gewählt',
    wrongFormula: String.raw`\begin{array}{rrr|r} 1 & 2 & 1 & 3 \\ 0 & 0 & 1 & 2 \end{array} \;\Rightarrow\; z = t`,
    why: {
      detailed: String.raw`Frei wählen darfst du nur Variablen, die durch die Gleichungen nicht schon festgelegt sind. Am sichersten nimmst du die Spalten **ohne Stufe**; eine Variable, die eine Zeile allein bestimmt, kann nicht frei sein.`,
      short: String.raw`Frei sind die Spalten ohne Stufe.`,
    },
  },
  {
    id: 'gauss-free-none',
    name: 'Freie Variable übersehen (keine gewählt)',
    wrongFormula: String.raw`\text{2 Stufen, 3 Variablen} \;\Rightarrow\; \text{keine frei}`,
    why: {
      detailed: String.raw`Zahl der freien Variablen = Zahl der Variablen minus Zahl der Stufen. Fehlt eine Stufe, ist eine Variable frei, auch wenn keine Nullzeile dasteht (etwa bei weniger Gleichungen als Variablen).`,
      short: String.raw`Frei: Variablen minus Stufen.`,
    },
  },
  {
    id: 'gauss-free-count',
    name: 'Zu viele Variablen frei gewählt',
    wrongFormula: String.raw`\text{1 Variable ohne Stufe} \;\Rightarrow\; y = s,\; z = t`,
    why: {
      detailed: String.raw`Es sind genau so viele Variablen frei, wie Stufen fehlen (Variablen minus Stufen). Jede weitere ist durch eine Gleichung festgelegt.`,
      short: String.raw`Frei: Variablen minus Stufen.`,
    },
  },
  // ---------------------------------------------------------------- rückwärts einsetzen
  {
    id: 'gauss-backsub-sign',
    name: 'Vorzeichen beim Rüberbringen vergessen',
    wrongFormula: String.raw`y + 2z = 7,\; z = 3 \;\Rightarrow\; y = 7 + 6`,
    why: {
      detailed: String.raw`Bringst du ein Glied auf die andere Seite, wechselt es das Vorzeichen: aus $+2z$ links wird $-2z$ rechts.`,
      short: String.raw`Rüberbringen: Vorzeichen wechselt.`,
    },
  },
  {
    id: 'gauss-divide-forgot',
    name: 'Durch die Zahl vor der Variablen nicht geteilt',
    wrongFormula: String.raw`3y = 6 \;\Rightarrow\; y = 6`,
    why: {
      detailed: String.raw`Zum Schluss steht da „Zahl mal Variable = …“. Teile **beide Seiten** durch diese Zahl, damit die Variable allein steht.`,
      short: String.raw`Am Ende durch die Zahl vor der Variablen teilen.`,
    },
  },
  {
    id: 'gauss-backsub-coef',
    name: 'Beim Einsetzen die Zahl vor der Variablen vergessen',
    wrongFormula: String.raw`y + 2z = 7,\; z = 3 \;\Rightarrow\; y = 7 - 3`,
    why: {
      detailed: String.raw`Der bekannte Wert ersetzt nur die Variable; die Zahl davor bleibt stehen: $2z$ mit $z = 3$ wird $2 \cdot 3$.`,
      short: String.raw`Eingesetzt wird $2 \cdot 3$, nicht $3$.`,
    },
  },
  {
    id: 'gauss-divide-flip',
    name: 'Falsch herum geteilt',
    wrongFormula: String.raw`4z = 2 \;\Rightarrow\; z = \frac{4}{2}`,
    why: {
      detailed: String.raw`Aus $a \cdot z = b$ folgt $z = \frac{b}{a}$: Die rechte Seite kommt in den Zähler, die Zahl vor der Variablen in den Nenner.`,
      short: String.raw`$az = b$ heißt $z = \frac{b}{a}$.`,
    },
  },
  {
    id: 'gauss-divide-sub',
    name: 'Abgezogen statt geteilt',
    wrongFormula: String.raw`3z = 6 \;\Rightarrow\; z = 6 - 3`,
    why: {
      detailed: String.raw`$3z$ heißt $3$ **mal** $z$. Die Umkehrung von Malnehmen ist Teilen, nicht Abziehen.`,
      short: String.raw`$3z = 6$: durch $3$ teilen.`,
    },
  },
  {
    id: 'gauss-order',
    name: 'Reihenfolge der Variablen vertauscht',
    wrongFormula: String.raw`x = 1,\; y = 2,\; z = 3 \;\Rightarrow\; \vec x = \begin{pmatrix} 3 \\ 2 \\ 1 \end{pmatrix}`,
    why: {
      detailed: String.raw`Rückwärts einsetzen liefert die Werte von unten nach oben, aufgeschrieben wird die Lösung aber in der Reihenfolge der **Spalten**: erst $x$, dann $y$, dann $z$.`,
      short: String.raw`Lösung in der Reihenfolge der Spalten.`,
    },
  },
  // ---------------------------------------------------------------- Lösungsmenge mit Parametern
  {
    id: 'gauss-param-free-one',
    name: 'Die 1 der freien Variablen in der Richtung vergessen',
    wrongFormula: String.raw`z = t,\; y = 1 - t \;\Rightarrow\; \vec x = \dots + t\begin{pmatrix} \cdot \\ -1 \\ 0 \end{pmatrix}`,
    why: {
      detailed: String.raw`Auch die freie Variable gehört in den Vektor: Mit $z = t$ steht in der Richtung bei $z$ eine $1$ (und im Stützvektor eine $0$).`,
      short: String.raw`Freie Variable: $1$ in ihrer Richtung.`,
    },
  },
  {
    id: 'gauss-param-swap',
    name: 'Stützvektor und Richtung vertauscht',
    wrongFormula: String.raw`x = 2 + 3t \;\Rightarrow\; \vec x = \begin{pmatrix} 3 \\ \cdot \end{pmatrix} + t\begin{pmatrix} 2 \\ \cdot \end{pmatrix}`,
    why: {
      detailed: String.raw`Die Zahlen **ohne** Parameter bilden den Stützvektor, die Zahlen **vor** dem Parameter die Richtung.`,
      short: String.raw`Ohne Parameter: Stützvektor; vor dem Parameter: Richtung.`,
    },
  },
]
