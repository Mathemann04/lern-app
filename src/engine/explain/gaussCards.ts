import type { Card } from './cards.ts'

// Lernkarten zum Gauß-Verfahren (M7 Schritt 10a) im Ordner „Matrizen und Gleichungssysteme“. Beispiele sind Aufgaben des
// Baukastens (linalg/gaussTasks.ts, Art, Stufe und Startwert); den Rechenweg rechnet die Engine. Jeder typische Fehler
// der Aufgaben steht auf einer Karte.

export const GAUSS_CARD_LIST: readonly Card[] = [
  {
    id: 'gauss-tabelle',
    topic: 'matrizen',
    title: 'Gauß-Verfahren: Tabelle und Stufenform',
    level: 1,
    rules: [],
    formulas: [
      String.raw`\begin{array}{rl} x + 2y = 5 \\ 3x - y = 1 \end{array} \;\Rightarrow\; \begin{array}{rr|r} 1 & 2 & 5 \\ 3 & -1 & 1 \end{array}`,
      String.raw`\text{II} - 3 \cdot \text{I}\colon\; \begin{array}{rr|r} 1 & 2 & 5 \\ 0 & -7 & -14 \end{array}`,
    ],
    memo: 'Jede Gleichung wird eine Zeile, jede Variable eine Spalte, rechts vom Strich steht die Zahl. Dann Spalte für Spalte: Zieh von den Zeilen darunter so ein Vielfaches der oberen Zeile ab, dass unter der Stufe Nullen stehen. Jede Zahl der Zeile wird mitgerechnet, auch rechts vom Strich.',
    note: 'Erlaubt sind drei Umformungen, sie ändern die Lösungen nicht: Zeilen tauschen, eine Zeile mit einer Zahl ungleich $0$ malnehmen, ein Vielfaches einer Zeile zu einer anderen addieren. Geht es nicht mit einem ganzzahligen Vielfachen, nimm über Kreuz mal, zum Beispiel $3 \\cdot \\text{II} - 2 \\cdot \\text{I}$. Am Ende steht die Stufenform: In jeder Zeile beginnt die erste Zahl ungleich $0$ weiter rechts als in der Zeile darüber.',
    when: 'Bei jedem linearen Gleichungssystem, auch beim Schnitt von Geraden und Ebenen und bei der Frage nach linear unabhängigen Vektoren.',
    examples: [
      { vector: { kind: 'gaussTwo', level: 1, seed: 1 } },
      { vector: { kind: 'gaussThree', level: 2, seed: 2 } },
    ],
    errors: ['gauss-setup-order', 'gauss-setup-side', 'gauss-setup-const', 'gauss-setup-gap', 'gauss-setup-transposed', 'gauss-rhs', 'gauss-rhs-multiple', 'gauss-first-only', 'gauss-sign'],
  },
  {
    id: 'gauss-faelle',
    topic: 'matrizen',
    title: 'Eine, keine oder unendlich viele Lösungen',
    level: 1,
    rules: [],
    formulas: [
      String.raw`\begin{array}{rrr|r} 0 & 0 & 0 & 5 \end{array} \;\Rightarrow\; 0 = 5\text{: keine Lösung}`,
      String.raw`\begin{array}{rrr|r} 0 & 0 & 0 & 0 \end{array} \;\Rightarrow\; 0 = 0\text{: fällt weg}`,
      String.raw`\text{frei} = \text{Variablen} - \text{Stufen}`,
    ],
    memo: 'Steht links nur noch $0$ und rechts eine Zahl ungleich $0$, ist das ein Widerspruch: keine Lösung. Eine Nullzeile $0 = 0$ ist immer wahr und fällt weg. Sonst Stufen zählen: so viele wie Variablen heißt genau eine Lösung, weniger heißt unendlich viele (freie Variablen).',
    note: 'Eine Zeile wie $0 \\; 0 \\; 3 \\mid 0$ ist kein Widerspruch: Sie heißt $3z = 0$, also $z = 0$. Auch eine Nullzeile heißt nicht automatisch „unendlich viele“: Bei mehr Gleichungen als Variablen kann trotzdem jede Variable eine Stufe haben. Im Bild sind es zwei Geraden in der Ebene (schneiden sich, parallel, gleich) bzw. Ebenen im Raum.',
    when: 'Immer, sobald die Stufenform erreicht ist, bevor du rückwärts einsetzt.',
    examples: [
      { vector: { kind: 'gaussThree', level: 2, seed: 3 } },
      { vector: { kind: 'gaussOver', level: 3, seed: 1 } },
    ],
    errors: ['gauss-unique-none', 'gauss-unique-inf', 'gauss-zero-rhs-none', 'gauss-zero-row-inf', 'gauss-contradiction-value', 'gauss-contradiction-zero', 'gauss-zero-row-none', 'gauss-under-none', 'gauss-free-missed'],
  },
  {
    id: 'gauss-rueckwaerts',
    topic: 'matrizen',
    title: 'Rückwärts einsetzen und Lösung mit Parametern',
    level: 2,
    rules: [],
    formulas: [String.raw`z = t,\quad y = 1 - 2t,\quad x = 3 + t`, String.raw`\vec x = \begin{pmatrix} 3 \\ 1 \\ 0 \end{pmatrix} + t \begin{pmatrix} 1 \\ -2 \\ 1 \end{pmatrix}`],
    memo: 'Von der untersten Stufe nach oben: In jeder Zeile ist nur noch eine Variable unbekannt. Bekannte Werte einsetzen, auf die andere Seite bringen (Vorzeichen wechselt), durch die Zahl vor der Variablen teilen. Variablen ohne Stufe sind frei: $z = t$.',
    note: 'Die Lösung schreibst du in der Reihenfolge der Spalten auf. Bei freien Variablen: jede Variable als Zahl plus Vielfache der Parameter; die Zahlen bilden den Stützvektor, die Faktoren vor $t$ die Richtung, bei der freien Variablen selbst steht in der Richtung eine $1$. Ein Parameter gibt eine Gerade, zwei geben eine Ebene.',
    when: 'Nach dem Deuten der Stufenform, wenn es eine oder unendlich viele Lösungen gibt.',
    examples: [
      { vector: { kind: 'gaussThree', level: 2, seed: 4 } },
      { vector: { kind: 'gaussUnder', level: 4, seed: 1 } },
    ],
    errors: ['gauss-backsub-sign', 'gauss-divide-forgot', 'gauss-backsub-coef', 'gauss-divide-flip', 'gauss-divide-sub', 'gauss-order', 'gauss-free-pivot', 'gauss-free-none', 'gauss-free-count', 'gauss-param-free-one', 'gauss-param-swap'],
  },
  {
    id: 'gauss-tricks',
    topic: 'matrizen',
    title: 'Zeilen tauschen, Kommazahlen, mehr oder weniger Gleichungen',
    level: 3,
    rules: [],
    formulas: [String.raw`\begin{array}{rr|r} 0 & 2 & 4 \\ 1 & 1 & 3 \end{array} \;\xrightarrow{\text{I} \leftrightarrow \text{II}}\; \begin{array}{rr|r} 1 & 1 & 3 \\ 0 & 2 & 4 \end{array}`, String.raw`10 \cdot (0{,}5x + 1{,}2y = 2) \;\Rightarrow\; 5x + 12y = 20`],
    memo: 'Steht oben in der Spalte eine $0$, darunter aber nicht: Zeilen tauschen. Kommazahlen schaffst du zuerst weg, indem du die ganze Gleichung mit $10$, $4$ oder $2$ malnimmst, jedes Glied und die rechte Seite.',
    note: 'Mehr Gleichungen als Variablen (überbestimmt): Am Ende bleiben Nullzeilen oder ein Widerspruch. Weniger Gleichungen als Variablen (unterbestimmt): Es gibt nie genau eine Lösung, sondern keine oder unendlich viele.',
    when: 'Wenn beim Gauß-Verfahren eine $0$ an der Stelle der Stufe steht, bei Kommazahlen und bei Systemen, die nicht quadratisch sind.',
    examples: [
      { vector: { kind: 'gaussPivot', level: 3, seed: 1 } },
      { vector: { kind: 'gaussDecimal', level: 4, seed: 2 } },
    ],
    errors: ['gauss-zero-pivot-none', 'gauss-zero-pivot-zero', 'gauss-zero-pivot-skip', 'gauss-scale-first', 'gauss-scale-decimals'],
  },
]
