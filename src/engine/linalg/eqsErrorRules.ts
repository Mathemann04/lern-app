import type { VectorErrorRule } from './errorRules.ts'

// Typische Fehler bei Einsetzen, Gleichsetzen und Addieren (M7 Schritt 10c, Katalog in docs/PLAN-M7.md). Vorsilbe „eqs-“.
// Dazu nutzt der Baustein Fehler des Gauß-Verfahrens (Rüberbringen, Teilen, Lösungsmenge). Der Text nennt den Fehler und
// die Regel, verrät aber nicht das Ergebnis des Schritts.

export const EQS_ERROR_RULES: readonly VectorErrorRule[] = [
  // ---------------------------------------------------------------- Auflösen
  {
    id: 'eqs-solve-sign',
    name: 'Beim Auflösen das Vorzeichen nicht gewechselt',
    wrongFormula: String.raw`2x + y = 7 \;\Rightarrow\; y = 7 + 2x`,
    why: {
      detailed: String.raw`Bringst du ein Glied auf die andere Seite, wechselt sein Vorzeichen: aus $+2x$ links wird $-2x$ rechts. Was schon auf der richtigen Seite steht, behält sein Vorzeichen.`,
      short: String.raw`Seite wechseln heißt Vorzeichen wechseln.`,
    },
  },
  {
    id: 'eqs-solve-divide',
    name: 'Beim Auflösen nur ein Glied geteilt',
    wrongFormula: String.raw`3y = 6 - 2x \;\Rightarrow\; y = 2 - 2x`,
    why: {
      detailed: String.raw`Teilst du durch die Zahl vor der Unbekannten, dann die **ganze** rechte Seite: jedes Glied, die Zahl und die andere Unbekannte.`,
      short: String.raw`Jedes Glied rechts teilen.`,
    },
  },
  {
    id: 'eqs-solve-minus',
    name: 'Vorzeichen der Zahl vor der Unbekannten beim Teilen falsch',
    wrongFormula: String.raw`-y = 3 - 2x \;\Rightarrow\; y = 3 - 2x`,
    why: {
      detailed: String.raw`Zum Schluss teilst du durch die Zahl vor der Unbekannten **mit ihrem Vorzeichen**. Steht dort $-1$, wechselt jedes Glied rechts sein Vorzeichen; steht dort eine positive Zahl, wechselt keins.`,
      short: String.raw`Durch die Zahl samt Vorzeichen teilen.`,
    },
  },
  // ---------------------------------------------------------------- Einsetzen
  {
    id: 'eqs-bracket-partial',
    name: 'Klammer vergessen: nur das erste Glied malgenommen',
    wrongFormula: String.raw`3(2x - 4) \;\Rightarrow\; 6x - 4`,
    why: {
      detailed: String.raw`Setzt du einen Term für eine Unbekannte ein, gehört er **in Klammern**. Die Zahl davor nimmt dann jedes Glied in der Klammer mal, nicht nur das erste.`,
      short: String.raw`Term in Klammern einsetzen, jedes Glied malnehmen.`,
    },
  },
  {
    id: 'eqs-bracket-sign',
    name: 'Minus vor der Klammer nur beim ersten Glied beachtet',
    wrongFormula: String.raw`-2(3 - y) \;\Rightarrow\; -6 - 2y`,
    why: {
      detailed: String.raw`Ein Minus vor der Klammer dreht **jedes** Vorzeichen in der Klammer um: $-2 \cdot (-y) = +2y$. Rechne Glied für Glied mit Vorzeichen.`,
      short: String.raw`Minus mal Minus gibt Plus, für jedes Glied.`,
    },
  },
  {
    id: 'eqs-same-equation',
    name: 'In dieselbe Gleichung eingesetzt',
    wrongFormula: String.raw`\text{I nach } y \text{ aufgelöst, in I eingesetzt} \;\Rightarrow\; 0 = 0`,
    why: {
      detailed: String.raw`Der Term für die Unbekannte kommt aus einer Gleichung. Setzt du ihn in **dieselbe** Gleichung zurück, bleibt nur $0 = 0$ übrig und du lernst nichts. Setz ihn in die **andere** Gleichung ein.`,
      short: String.raw`In die andere Gleichung einsetzen.`,
    },
  },
  // ---------------------------------------------------------------- Gleichsetzen
  {
    id: 'eqs-equate-sign',
    name: 'Beim Gleichsetzen die Unbekannte ohne Vorzeichenwechsel herübergebracht',
    wrongFormula: String.raw`2x + 1 = -x + 7 \;\Rightarrow\; x = 6`,
    why: {
      detailed: String.raw`Bringst du das Glied mit der Unbekannten von der einen Seite auf die andere, wechselt sein Vorzeichen: aus $-x$ rechts wird $+x$ links. Dann erst zusammenfassen.`,
      short: String.raw`Auch die Unbekannte wechselt beim Rüberbringen das Vorzeichen.`,
    },
  },
  // ---------------------------------------------------------------- Addieren
  {
    id: 'eqs-add-sign',
    name: 'Mit dem falschen Vorzeichen zusammengerechnet: die Unbekannte fällt nicht weg',
    wrongFormula: String.raw`3x \text{ in I}, \; 3x \text{ in II} \;\Rightarrow\; \text{I} + \text{II}`,
    why: {
      detailed: String.raw`Eine Unbekannte fällt nur weg, wenn vor ihr nach dem Malnehmen **entgegengesetzte** Zahlen stehen. Stehen gleiche Zahlen davor, ziehst du ab statt zu addieren (oder nimmst eine Gleichung mit einer negativen Zahl mal).`,
      short: String.raw`Gleiche Zahlen: abziehen; entgegengesetzte: addieren.`,
    },
  },
  {
    id: 'eqs-factor-swap',
    name: 'Die Faktoren vertauscht',
    wrongFormula: String.raw`2x \text{ in I}, \; 3x \text{ in II} \;\Rightarrow\; 2 \cdot \text{I} - 3 \cdot \text{II}`,
    why: {
      detailed: String.raw`Jede Gleichung nimmst du mit der Zahl **der anderen** Gleichung mal: Vor $x$ stehen dann in beiden dieselben Zahlen, hier das kleinste gemeinsame Vielfache.`,
      short: String.raw`Mit der Zahl der jeweils anderen Gleichung malnehmen.`,
    },
  },
  {
    id: 'eqs-factor-one',
    name: 'Nur eine Gleichung malgenommen',
    wrongFormula: String.raw`2x \text{ in I}, \; 3x \text{ in II} \;\Rightarrow\; \text{I} - 3 \cdot \text{II}`,
    why: {
      detailed: String.raw`Oft muss man **beide** Gleichungen malnehmen, damit vor der Unbekannten dieselbe Zahl steht. Prüf das: Zahl in I mal Faktor von I muss die Zahl in II mal Faktor von II aufheben.`,
      short: String.raw`Prüfen, ob die Zahlen sich wirklich aufheben.`,
    },
  },
  {
    id: 'eqs-one-side',
    name: 'Die Zahl auf der rechten Seite nicht malgenommen',
    wrongFormula: String.raw`3 \cdot (x + 2y = 4) \;\Rightarrow\; 3x + 6y = 4`,
    why: {
      detailed: String.raw`Malnehmen gilt für die **ganze** Gleichung: jedes Glied mit Unbekannter und auch die Zahl auf der rechten Seite. Sonst ist es nicht mehr dieselbe Gleichung.`,
      short: String.raw`Auch die Zahl rechts malnehmen.`,
    },
  },
  {
    id: 'eqs-factor-term',
    name: 'Den Ausdruck mit dem Parameter nicht malgenommen',
    wrongFormula: String.raw`3 \cdot \big((2a - 2)\,y\big) \;\Rightarrow\; (2a - 6)\,y`,
    why: {
      detailed: String.raw`Der Faktor gilt für **jedes** Glied der Gleichung, auch für den Ausdruck mit $a$ vor der Unbekannten: Er wird als Ganzes malgenommen, Glied für Glied in der Klammer.`,
      short: String.raw`Auch den Ausdruck mit $a$ ganz malnehmen.`,
    },
  },
  {
    id: 'eqs-sub-sign',
    name: 'Vorzeichenfehler beim Abziehen',
    wrongFormula: String.raw`(4y = 9) - (-2y = 3) \;\Rightarrow\; 2y = 6`,
    why: {
      detailed: String.raw`Ziehst du eine Gleichung ab, wechselt **jedes** ihrer Glieder das Vorzeichen, auch die rechte Seite: $4y - (-2y) = 6y$. Rechne Glied für Glied mit Klammern.`,
      short: String.raw`Abziehen: jedes Vorzeichen der zweiten Gleichung umdrehen.`,
    },
  },
  // ---------------------------------------------------------------- Ergebnis
  {
    id: 'eqs-second-missing',
    name: 'Nicht alle Unbekannten ausgerechnet',
    wrongFormula: String.raw`x = 2 \;\Rightarrow\; \text{fertig}`,
    why: {
      detailed: String.raw`Die Lösung eines Gleichungssystems besteht aus Werten für **alle** Unbekannten. Setz den gefundenen Wert in eine Gleichung ein und rechne die übrige aus.`,
      short: String.raw`Alle Unbekannten angeben.`,
    },
  },
  {
    id: 'eqs-insert-sign',
    name: 'Vorzeichen beim Einsetzen verloren',
    wrongFormula: String.raw`x = -2y + 1,\; y = -3 \;\Rightarrow\; x = -6 + 1`,
    why: {
      detailed: String.raw`Setz den bekannten Wert **in Klammern** ein und rechne das Produkt mit Vorzeichen aus: $-2 \cdot (-3) = +6$. Ein Minus vor der Zahl und ein Minus im Wert ergeben Plus.`,
      short: String.raw`Wert in Klammern einsetzen, Vorzeichen mitrechnen.`,
    },
  },
  {
    id: 'eqs-swap-values',
    name: 'Die Werte der Unbekannten vertauscht',
    wrongFormula: String.raw`x = 3,\; y = -1 \;\Rightarrow\; x = -1,\; y = 3`,
    why: {
      detailed: String.raw`Achte darauf, welche Unbekannte du gerade ausgerechnet hast: Jeder Wert gehört zu seiner Unbekannten.`,
      short: String.raw`Jeder Wert zu seiner Unbekannten.`,
    },
  },
  // ---------------------------------------------------------------- keine oder unendlich viele Lösungen
  {
    id: 'eqs-zero-none',
    name: '0 = 0 als „keine Lösung“ gedeutet',
    wrongFormula: String.raw`0 = 0 \;\Rightarrow\; \text{keine Lösung}`,
    why: {
      detailed: String.raw`Dass die Unbekannten wegfallen, heißt nicht „keine Lösung“. Es kommt auf die Aussage an, die übrig bleibt: $0 = 0$ ist **immer wahr**, beide Gleichungen sagen dasselbe.`,
      short: String.raw`$0 = 0$ ist immer wahr.`,
    },
  },
  {
    id: 'eqs-zero-unique',
    name: '0 = 0 als eine Lösung gedeutet',
    wrongFormula: String.raw`0 = 0 \;\Rightarrow\; y = 0`,
    why: {
      detailed: String.raw`In $0 = 0$ steht keine Unbekannte mehr: Es legt keinen Wert fest. Die Aussage ist immer wahr, also schränkt die zweite Gleichung nichts ein.`,
      short: String.raw`$0 = 0$ legt keinen Wert fest.`,
    },
  },
  {
    id: 'eqs-contradiction-inf',
    name: 'Widerspruch als „unendlich viele Lösungen“ gedeutet',
    wrongFormula: String.raw`0 = 5 \;\Rightarrow\; \text{unendlich viele}`,
    why: {
      detailed: String.raw`Bleibt nach dem Wegfallen der Unbekannten eine **falsche** Aussage wie $0 = 5$, gibt es keinen Wert, der beide Gleichungen erfüllt. Nur $0 = 0$ bedeutet unendlich viele Lösungen.`,
      short: String.raw`$0 = 5$ ist nie wahr.`,
    },
  },
  {
    id: 'eqs-contradiction-value',
    name: 'Widerspruch als Wert einer Unbekannten gelesen',
    wrongFormula: String.raw`0 = 5 \;\Rightarrow\; y = 5`,
    why: {
      detailed: String.raw`In $0 = 5$ steht keine Unbekannte mehr; es ist eine falsche Aussage, kein Wert. Das System hat dann keine Lösung.`,
      short: String.raw`$0 = 5$ ist ein Widerspruch, kein Wert.`,
    },
  },
  // ---------------------------------------------------------------- Ordnen
  {
    id: 'eqs-order-side',
    name: 'Glied mit Unbekannter ohne Vorzeichenwechsel nach links gebracht',
    wrongFormula: String.raw`2x = 5 - 3y \;\Rightarrow\; 2x - 3y = 5`,
    why: {
      detailed: String.raw`In der Form $ax + by = c$ stehen alle Unbekannten links. Ein Glied, das rechts steht, wechselt beim Rüberbringen sein **Vorzeichen**: aus $-3y$ rechts wird $+3y$ links.`,
      short: String.raw`Glied von rechts nach links: Vorzeichen wechselt.`,
    },
  },
  {
    id: 'eqs-order-const',
    name: 'Zahl ohne Vorzeichenwechsel nach rechts gebracht',
    wrongFormula: String.raw`2x + 3 = y + 7 \;\Rightarrow\; 2x - y = 10`,
    why: {
      detailed: String.raw`In der Form $ax + by = c$ steht die Zahl allein rechts. Eine Zahl auf der linken Seite bringst du hinüber, dabei wechselt ihr **Vorzeichen**: aus $+3$ links wird $-3$ rechts.`,
      short: String.raw`Zahl von links nach rechts: Vorzeichen wechselt.`,
    },
  },
  {
    id: 'eqs-fraction-drop',
    name: 'Nenner einfach weggelassen',
    wrongFormula: String.raw`\frac{x}{2} + \frac{y}{3} = 1 \;\Rightarrow\; x + y = 1`,
    why: {
      detailed: String.raw`Brüche verschwinden nur, wenn du die **ganze** Gleichung mit dem Hauptnenner malnimmst. Dabei wird jeder Zähler mit einer anderen Zahl malgenommen, und die rechte Seite auch.`,
      short: String.raw`Mit dem Hauptnenner malnehmen, nicht die Nenner streichen.`,
    },
  },
  {
    id: 'eqs-method',
    name: 'Ein umständliches Verfahren gewählt',
    wrongFormula: String.raw`y = 2x - 1,\; 3x + 2y = 5 \;\Rightarrow\; \text{Gleichsetzen}`,
    why: {
      detailed: String.raw`Alle Verfahren führen zum Ziel, aber eines passt meist am besten: Steht eine Unbekannte allein, setzt du ein; sind beide nach derselben aufgelöst, setzt du gleich; steht keine allein, aber vor einer Unbekannten gleiche oder entgegengesetzte Zahlen, addierst du.`,
      short: String.raw`Auf die Form der Gleichungen achten.`,
    },
  },
  // ---------------------------------------------------------------- Unbekannte im Nenner und Parameter
  {
    id: 'eqs-set-point',
    name: 'Stützvektor ist kein Punkt der Lösung',
    wrongFormula: String.raw`x + 2y = 4 \;\Rightarrow\; \vec x = \begin{pmatrix} -4 \\ 0 \end{pmatrix} + t \begin{pmatrix} -2 \\ 1 \end{pmatrix}`,
    why: {
      detailed: String.raw`Mit $t = 0$ muss der Stützvektor selbst eine Lösung sein. Mach die Probe: Setz seine Einträge in die Gleichung ein; es muss die rechte Seite herauskommen, mit ihrem Vorzeichen.`,
      short: String.raw`Probe mit $t = 0$: Stützvektor erfüllt die Gleichung.`,
    },
  },
  {
    id: 'eqs-recip-rhs',
    name: 'Auch die rechte Seite umgedreht',
    wrongFormula: String.raw`\frac{2}{x} + \frac{3}{y} = 4 \;\Rightarrow\; 2u + 3v = \frac{1}{4}`,
    why: {
      detailed: String.raw`Die Substitution $u = \frac{1}{x}$ ersetzt nur die Brüche mit der Unbekannten. Die Zahl auf der rechten Seite bleibt, wie sie ist.`,
      short: String.raw`Rechte Seite bleibt.`,
    },
  },
  {
    id: 'eqs-recip-coef',
    name: 'Die Zahl im Zähler mit umgedreht',
    wrongFormula: String.raw`\frac{2}{x} \;\Rightarrow\; \frac{1}{2}u`,
    why: {
      detailed: String.raw`$\frac{2}{x} = 2 \cdot \frac{1}{x} = 2u$: Die Zahl im Zähler bleibt als Faktor vor $u$ stehen, nur die Unbekannte wird ersetzt.`,
      short: String.raw`$\frac{k}{x} = k\,u$.`,
    },
  },
  {
    id: 'eqs-recip-back',
    name: 'Rücksubstitution vergessen',
    wrongFormula: String.raw`u = \frac{1}{2} \;\Rightarrow\; x = \frac{1}{2}`,
    why: {
      detailed: String.raw`$u$ und $v$ sind nur Hilfsgrößen. Gesucht sind $x$ und $y$: Aus $u = \frac{1}{x}$ folgt $x = \frac{1}{u}$, also der Kehrwert.`,
      short: String.raw`Am Ende $x = \frac{1}{u}$, $y = \frac{1}{v}$.`,
    },
  },
  {
    id: 'eqs-param-zero',
    name: 'Den Sonderwert bei a = 0 gesucht',
    wrongFormula: String.raw`(2a - 6)\,x = 4 \;\Rightarrow\; \text{kritisch bei } a = 0`,
    why: {
      detailed: String.raw`Kritisch ist nicht $a = 0$, sondern der Wert, für den die **ganze** Zahl vor der Unbekannten $0$ wird. Setz den Ausdruck mit $a$ gleich $0$ und löse nach $a$ auf.`,
      short: String.raw`Ausdruck vor der Unbekannten gleich $0$ setzen.`,
    },
  },
  {
    id: 'eqs-param-sign',
    name: 'Vorzeichen beim Auflösen nach a',
    wrongFormula: String.raw`2a - 6 = 0 \;\Rightarrow\; a = -3`,
    why: {
      detailed: String.raw`Bringst du die Zahl auf die andere Seite, wechselt ihr Vorzeichen: $2a - 6 = 0$ heißt $2a = 6$. Mach die Probe: Setz deinen Wert ein, es muss $0$ herauskommen.`,
      short: String.raw`Probe: Ausdruck muss $0$ werden.`,
    },
  },
]
