import type { Card } from './cards.ts'

// Lernkarten zur Cramerschen Regel (M7 Schritt 11a) im Ordner „Matrizen und Gleichungssysteme“. Beispiele sind Aufgaben
// des Baukastens (linalg/cramerTasks.ts, Art, Stufe und Startwert); den Rechenweg rechnet die Engine. Jeder typische
// Fehler der Aufgaben steht auf einer Karte.

export const CRAMER_CARD_LIST: readonly Card[] = [
  {
    id: 'cramer-regel',
    topic: 'matrizen',
    title: 'Cramersche Regel',
    level: 1,
    rules: [],
    formulas: [
      String.raw`x_k = \frac{\det A_k}{\det A}`,
      String.raw`A = \begin{pmatrix} 2 & 1 \\ 1 & 3 \end{pmatrix},\; \vec b = \begin{pmatrix} 5 \\ 5 \end{pmatrix}\colon\; A_x = \begin{pmatrix} 5 & 1 \\ 5 & 3 \end{pmatrix},\; A_y = \begin{pmatrix} 2 & 5 \\ 1 & 5 \end{pmatrix}`,
    ],
    memo: 'Für die Unbekannte $x_k$ ersetzt du in $A$ ihre Spalte durch die rechte Seite $\\vec b$ und erhältst $A_k$. Dann ist $x_k$ die Determinante von $A_k$ geteilt durch die Determinante von $A$. Unten steht für jede Unbekannte dasselbe $\\det A$.',
    note: 'Die Regel gilt nur für quadratische Systeme (so viele Gleichungen wie Unbekannte) mit $\\det A \\ne 0$; dann gibt es genau eine Lösung. Praktisch ist sie, wenn nur eine Unbekannte gefragt ist: Du brauchst zwei Determinanten statt des ganzen Gauß-Verfahrens. Kennst du schon zwei Unbekannte, bekommst du die dritte schneller durch Einsetzen in eine Gleichung.',
    when: 'Bei $2 \\times 2$- und $3 \\times 3$-Systemen mit $\\det A \\ne 0$, vor allem wenn nur eine Unbekannte gefragt ist oder Parameter in der Matrix stehen.',
    examples: [{ vector: { kind: 'cramerTwo', level: 1, seed: 1 } }, { vector: { kind: 'cramerThree', level: 2, seed: 2 } }],
    errors: ['cramer-row', 'cramer-col', 'cramer-flip', 'cramer-no-divide'],
  },
  {
    id: 'cramer-parameter',
    topic: 'matrizen',
    title: 'Cramersche Regel mit Parameter',
    level: 4,
    rules: [],
    formulas: [String.raw`\det A \ne 0`, String.raw`\frac{\det A_k}{\det A} = c \;\Rightarrow\; \det A_k = c \cdot \det A`],
    memo: 'Steht ein Parameter $a$ in der Matrix, ist $\\det A$ ein Polynom in $a$. Die Regel gilt für alle $a$ außer den Nullstellen von $\\det A$. Die Unbekannte ist dann ein Bruch in $a$.',
    note: 'Soll die Unbekannte einen bestimmten Wert $c$ haben, setzt du den Bruch gleich $c$ und nimmst mit dem Nenner mal: $\\det A_k = c \\cdot \\det A$. Danach prüfst du jede Lösung: Ist dort $\\det A = 0$, fällt sie weg, denn dort hat das System keine eindeutige Lösung (das Malnehmen mit dem Nenner hat sie erst hereingebracht).',
    when: 'Bei Gleichungssystemen mit Parameter in der Matrix, wenn gefragt ist, wann es genau eine Lösung gibt und wie sie von $a$ abhängt.',
    examples: [{ vector: { kind: 'cramerParam', level: 4, seed: 1 } }, { vector: { kind: 'cramerParamThree', level: 5, seed: 2 } }],
    errors: ['cramer-cond-flip', 'cramer-cond-all', 'cramer-excluded', 'cramer-one-root', 'cramer-target-numerator', 'cramer-solve-sign'],
  },
]
