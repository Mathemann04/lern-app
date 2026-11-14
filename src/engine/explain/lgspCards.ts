import type { Card } from './cards.ts'

// Lernkarten zu Gleichungssystemen mit Parameter (M7 Schritt 11b) im Ordner „Matrizen und Gleichungssysteme“. Beispiele
// sind Aufgaben des Baukastens (linalg/lgspTasks.ts, Art, Stufe und Startwert); den Rechenweg rechnet die Engine. Jeder
// typische Fehler der Aufgaben steht auf einer Karte.

export const LGSP_CARD_LIST: readonly Card[] = [
  {
    id: 'lgsp-gauss',
    topic: 'matrizen',
    title: 'Gleichungssystem mit Parameter',
    level: 1,
    rules: [],
    formulas: [
      String.raw`q(a)\,z = s(a)`,
      String.raw`q(a) \ne 0\colon \text{ genau eine Lösung}`,
      String.raw`q(a) = 0,\; s(a) \ne 0\colon \text{ keine Lösung}`,
      String.raw`q(a) = 0,\; s(a) = 0\colon \text{ unendlich viele}`,
    ],
    memo: 'Bring das System mit dem Gauß-Verfahren auf Stufenform und rechne die Einträge mit $a$ einfach mit. Die letzte Zeile heißt dann $q(a)\\,z = s(a)$. Wo $q(a) \\ne 0$ ist, gibt es genau eine Lösung. Die Nullstellen von $q$ sind die Sonderwerte: Setz jeden einzeln ein. Wird die Zeile $0 = c$ mit $c \\ne 0$, gibt es keine Lösung; wird sie $0 = 0$, unendlich viele.',
    note: 'Steht $a$ an Stellen, die das Gauß-Verfahren schwer machen, rechnest du zuerst $\\det A$ als Polynom in $a$: Seine Nullstellen sind dieselben Sonderwerte. Für sie bringst du die Tabelle mit Zahlen auf Stufenform. Teile nie durch einen Ausdruck mit $a$, ohne zu prüfen, ob er $0$ sein kann; die Formel für den allgemeinen Fall gilt beim Sonderwert nicht.',
    when: 'Bei jedem Gleichungssystem, in dem ein Parameter steht und gefragt ist, wann es genau eine, keine oder unendlich viele Lösungen gibt.',
    examples: [{ vector: { kind: 'lgspTwo', level: 1, seed: 1 } }, { vector: { kind: 'lgspDet', level: 3, seed: 2 } }],
    errors: ['lgsp-cond-flip', 'lgsp-cond-all', 'lgsp-cond-rhs', 'lgsp-one-root', 'lgsp-special-missed', 'lgsp-special-swapped', 'lgsp-general-formula', 'lgsp-divide-param', 'lgsp-multiply-param', 'lgsp-fix-param'],
  },
  {
    id: 'lgsp-rang',
    topic: 'matrizen',
    title: 'Rang und Lösbarkeit',
    level: 3,
    rules: [],
    formulas: [
      String.raw`\operatorname{rg}(A) < \operatorname{rg}(A \mid \vec b)\colon \text{ keine Lösung}`,
      String.raw`\operatorname{rg}(A) = \operatorname{rg}(A \mid \vec b) = n\colon \text{ genau eine}`,
      String.raw`\operatorname{rg}(A) = \operatorname{rg}(A \mid \vec b) < n\colon \text{ unendlich viele}`,
    ],
    memo: 'Der Rang ist die Zahl der Stufen, also der Zeilen der Stufenform, die nicht nur aus Nullen bestehen. Für $\\operatorname{rg}(A)$ zählst du nur links vom Strich, für $\\operatorname{rg}(A \\mid \\vec b)$ auch rechts. Lösbar ist das System genau dann, wenn beide Ränge gleich sind.',
    note: 'Eine Zeile $0 \\; \\ldots \\; 0 \\mid c$ mit $c \\ne 0$ zählt nur bei $(A \\mid \\vec b)$: Dann ist dieser Rang größer, und es gibt keine Lösung. Bei gleichen Rängen ist $n - \\operatorname{rg}(A)$ die Zahl der frei wählbaren Unbekannten ($n$ = Zahl der Unbekannten).',
    when: 'Wenn nach dem Rang gefragt ist oder du begründen sollst, warum ein System lösbar ist oder nicht.',
    examples: [{ vector: { kind: 'lgspThree', level: 3, seed: 1 } }, { vector: { kind: 'lgspDet', level: 4, seed: 3 } }],
    errors: ['lgsp-rank-augmented', 'lgsp-rank-rhs', 'lgsp-rank-unequal', 'lgsp-rank-full', 'lgsp-rank-zero-row', 'lgsp-rank-rows'],
  },
  {
    id: 'lgsp-rechts',
    topic: 'matrizen',
    title: 'Parameter rechts und vorgegebener Wert',
    level: 4,
    rules: [],
    formulas: [String.raw`0 = s(a_0) + \beta\,b \;\Rightarrow\; b = -\frac{s(a_0)}{\beta}`, String.raw`z = \frac{s(a)}{q(a)} = c \;\Rightarrow\; s(a) = c \cdot q(a)`],
    memo: 'Steht ein zweiter Parameter $b$ auf der rechten Seite, hängt beim Sonderwert $a_0$ die letzte Zeile $0 = s(a_0) + \\beta\\,b$ von $b$ ab: Für genau ein $b$ ist sie $0 = 0$ (unendlich viele Lösungen), für alle anderen ein Widerspruch.',
    note: 'Soll eine Unbekannte einen bestimmten Wert $c$ haben, setzt du ihren Bruch gleich $c$ und nimmst mit dem Nenner mal. Danach prüfst du jede Lösung: Ist sie ein Sonderwert, fällt sie weg, denn dort gibt es keine eindeutige Lösung.',
    when: 'Bei Fragen wie „Für welche $a$ und $b$ gibt es unendlich viele Lösungen?“ oder „Für welches $a$ ist $z = 2$?“.',
    examples: [{ vector: { kind: 'lgspRhs', level: 4, seed: 1 } }, { vector: { kind: 'lgspTarget', level: 5, seed: 2 } }],
    errors: ['lgsp-b-sign', 'lgsp-b-divide', 'lgsp-b-ignored', 'lgsp-b-none', 'lgsp-excluded', 'lgsp-target-numerator', 'lgsp-target-flip'],
  },
]
