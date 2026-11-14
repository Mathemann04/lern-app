import type { Card } from './cards.ts'

// Lernkarten zu Matrizengleichungen (M7 Schritt 12b) im Ordner „Matrizen und Gleichungssysteme“. Beispiele sind Aufgaben
// des Baukastens (linalg/mglTasks.ts, Art, Stufe und Startwert); den Rechenweg rechnet die Engine. Jeder typische Fehler
// der Aufgaben steht auf einer Karte.

export const MGL_CARD_LIST: readonly Card[] = [
  {
    id: 'mgl-aufloesen',
    topic: 'matrizen',
    title: 'Matrizengleichung nach $X$ auflösen',
    level: 1,
    rules: [],
    formulas: [String.raw`AX = B \;\Rightarrow\; X = A^{-1}B`, String.raw`XA = B \;\Rightarrow\; X = BA^{-1}`, String.raw`AX + 2X = AX + 2EX = (A + 2E)X`],
    memo: 'Erst allgemein auflösen, dann rechnen: Glieder mit $X$ nach links, die übrigen nach rechts. Eine Zahl vor $X$ als Vielfaches von $E$ schreiben, $X$ auf seiner Seite ausklammern und beide Seiten von derselben Seite mit der Inversen der Klammer malnehmen.',
    note: 'Wie beim Umstellen mit Zahlen, mit zwei Unterschieden: Durch eine Matrix teilt man nicht, man nimmt mit der Inversen mal. Und weil Matrizen nicht vertauschbar sind, zählt die Seite: Steht die Matrix links von $X$, nimmst du von links mal, steht sie rechts, von rechts. Die Zahl in der Klammer braucht ihr $E$, denn $A - 2$ ist nicht erklärt; $2E$ hat die $2$ nur auf der Hauptdiagonale. Erst dann einsetzen: Klammer ausrechnen, rechte Seite ausrechnen, Inverse, Produkt.',
    when: 'Wenn eine Gleichung mit einer unbekannten Matrix $X$ gelöst werden soll.',
    examples: [{ vector: { kind: 'mglBasic', level: 1, seed: 2 } }, { vector: { kind: 'mglFactor', level: 3, seed: 1 } }],
    errors: ['mgl-move-sign', 'mgl-no-e', 'mgl-factor-side', 'mgl-mult-side', 'mgl-mult-part', 'mgl-inverse-sum', 'mgl-e-all', 'mgl-e-anti'],
  },
  {
    id: 'mgl-umformen',
    topic: 'matrizen',
    title: 'Transponierte und Inverse in Matrizengleichungen',
    level: 3,
    rules: [],
    formulas: [String.raw`(X^{\mathsf T}A)^{\mathsf T} = A^{\mathsf T}X`, String.raw`(X^{-1}A)^{-1} = A^{-1}X`, String.raw`AXA^{-1} = B \;\Rightarrow\; X = A^{-1}BA`],
    memo: 'Steht $X$ in einer Transponierten oder Inversen, löst du sie zuerst mit den Regeln auf: Reihenfolge umdrehen, jeden Faktor transponieren bzw. invertieren, und zweimal hebt sich auf. Steht $X$ nur transponiert da, transponierst du die ganze Gleichung.',
    note: 'Die Matrizen links und rechts von $X$ hebst du jeweils mit ihrer eigenen Inverse auf, von ihrer Seite: Bei $AXA^{-1}$ von links mit $A^{-1}$ und von rechts mit $A$. Kürzen geht nicht, weil $X$ dazwischen steht. Steht schon $A^{-1}$ neben $X$, nimmst du mit $A$ mal und brauchst gar keine Inverse auszurechnen.',
    when: 'Wenn in der Gleichung $X^{\\mathsf T}$, $X^{-1}$ oder eine Matrix auf beiden Seiten von $X$ vorkommt.',
    examples: [{ vector: { kind: 'mglWrap', level: 3, seed: 1 } }, { vector: { kind: 'mglWrap', level: 4, seed: 3 } }],
    errors: ['mgl-transpose-twice', 'mgl-cancel', 'mgl-conj-same', 'mgl-mult-inverse'],
  },
  {
    id: 'mgl-parameter',
    topic: 'matrizen',
    title: 'Matrizengleichung mit Parameter',
    level: 4,
    rules: [],
    formulas: [String.raw`MX = R \text{ eindeutig lösbar} \;\Leftrightarrow\; \det M \ne 0`],
    memo: 'Steht ein Parameter $a$ in der Gleichung, steht er nach dem Ausklammern in der Klammer $M$. Die Gleichung hat genau eine Lösung $X = M^{-1}R$, wenn $\\det M \\ne 0$ ist.',
    note: 'Zuerst allgemein auflösen, dann $\\det M$ als Ausdruck in $a$ aufstellen und seine Nullstellen bestimmen: Für diese $a$ gibt es $M^{-1}$ nicht. Für einen erlaubten Wert setzt du ihn ein und rechnest $X$ mit Zahlen aus.',
    when: 'Wenn gefragt ist, für welche Werte eines Parameters eine Matrizengleichung eindeutig lösbar ist.',
    examples: [{ vector: { kind: 'mglParam', level: 4, seed: 1 } }, { vector: { kind: 'mglParam', level: 5, seed: 1 } }],
    errors: [],
  },
]
