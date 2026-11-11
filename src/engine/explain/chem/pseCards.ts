import type { Card } from '../cards.ts'

// Lernkarten des Ordners „Aufbau des Periodensystems“ (Chemie 1, S6c), in eigenen Worten. Plätze, Ionen und
// Ionisierungsenergien der Beispiele rechnet die Engine nach (generators/pse.test.ts).

const r = String.raw

export const PSE_CARDS: readonly Card[] = [
  {
    id: 'pse-aufbau',
    topic: 'chem-pse',
    title: 'Aufbau des Periodensystems',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Die Elemente stehen nach steigender Ordnungszahl, also nach der Zahl ihrer Protonen. Eine Zeile heißt Periode: Ihre Nummer ist die Nummer der äußersten Schale. Eine Spalte heißt Gruppe: Elemente einer Hauptgruppe haben gleich viele Valenzelektronen und deshalb ähnliche Eigenschaften.',
    note: 'Die Hauptgruppen werden römisch gezählt (I bis VIII), alle Gruppen zusammen auch von 1 bis 18. Dazwischen stehen die zehn Nebengruppen (Gruppen 3 bis 12).',
    examples: [
      { chemTask: r`Schwefel ($\ce{S}$, $Z = 16$)`, lines: [{ label: '3. Periode, VI. Hauptgruppe (Gruppe 16)' }] },
      { chemTask: r`Lithium, Natrium, Kalium`, lines: [{ label: 'alle in der I. Hauptgruppe: je ein Valenzelektron, ähnlich heftige Reaktionen mit Wasser' }] },
    ],
    errors: ['chem-pse-period-valence', 'chem-pse-period-shells', 'chem-pse-group-period', 'chem-mis-pse-mass-order', 'chem-mis-pse-period-similar', 'chem-mis-pse-z-meaning', 'chem-mis-pse-row-column'],
    figures: ['pse:S'],
  },
  {
    id: 'pse-bloecke',
    topic: 'chem-pse',
    title: 'Blöcke, Haupt- und Nebengruppen',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Welche Unterschale beim Element zuletzt aufgefüllt wird, bestimmt seinen Block. Die I. und II. Hauptgruppe bilden den s-Block, die III. bis VIII. den p-Block. Dazwischen liegt der d-Block mit den Nebengruppenelementen (Übergangsmetallen); bei ihnen wird eine d-Unterschale aufgefüllt.',
    note: r`Die Nummer einer Nebengruppe zählt die s- und d-Elektronen der beiden äußersten Schalen: Eisen mit $4\mathrm{s}^{2}\,3\mathrm{d}^{6}$ steht in Gruppe 8.`,
    examples: [
      { chemTask: r`Eisen ($\ce{Fe}$)`, lines: [{ label: '4. Periode, Nebengruppe (Gruppe 8), d-Block' }] },
      { chemTask: r`Kalium ($\ce{K}$)`, lines: [{ label: '4. Periode, I. Hauptgruppe, s-Block' }] },
    ],
    errors: ['chem-pse-transition-main', 'chem-pse-transition-s', 'chem-pse-block-outer-s', 'chem-pse-block-period4', 'chem-mis-pse-block', 'chem-mis-pse-fe-main'],
    figures: ['pse:Fe'],
  },
  {
    id: 'pse-valenz',
    topic: 'chem-pse',
    title: 'Valenzelektronen und Hauptgruppe',
    level: 1,
    rules: [],
    formulas: [r`\text{Valenzelektronen} = \text{römische Nummer der Hauptgruppe}`],
    memo: 'Bei Hauptgruppenelementen ist die Zahl der Valenzelektronen die römische Nummer der Hauptgruppe; die Periode ist die Schale, in der sie sitzen. Aus Periode und Zahl der Valenzelektronen lässt sich das Element also im Periodensystem finden.',
    note: 'In der Zählung 1 bis 18 haben die Gruppen 13 bis 18 zehn mehr als die Zahl der Valenzelektronen.',
    examples: [
      { chemTask: '3. Periode, 5 Valenzelektronen', lines: [{ label: r`V. Hauptgruppe, 3. Zeile: Phosphor ($\ce{P}$)` }] },
      { chemTask: r`Aluminium ($\ce{Al}$, Gruppe 13)`, lines: [{ label: '3 Valenzelektronen' }] },
    ],
    errors: ['chem-pse-group-number-valence', 'chem-pse-rev-swapped', 'chem-pse-rev-group-number', 'chem-pse-rev-period-shift', 'chem-mis-pse-group-number'],
  },
  {
    id: 'pse-metalle',
    topic: 'chem-pse',
    title: 'Metalle, Halbmetalle, Nichtmetalle',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Die meisten Elemente sind Metalle; sie stehen links und in der Mitte des Periodensystems. Die Nichtmetalle stehen rechts oben. Dazwischen verläuft eine Treppe aus Halbmetallen wie Bor, Silicium, Germanium, Arsen, Antimon und Tellur, deren Eigenschaften zwischen beiden liegen.',
    note: 'Wasserstoff steht in der I. Hauptgruppe, ist aber ein Nichtmetall. Innerhalb einer Hauptgruppe nimmt der Metallcharakter nach unten zu.',
    examples: [
      { chemTask: 'IV. Hauptgruppe von oben nach unten', lines: [{ label: 'Kohlenstoff (Nichtmetall), Silicium und Germanium (Halbmetalle), Zinn und Blei (Metalle)' }] },
      { chemTask: 'Silicium', lines: [{ label: 'Halbmetall: glänzt wie ein Metall, leitet aber nur schwach (Halbleiter)' }] },
    ],
    errors: ['chem-mis-pse-boron-metal', 'chem-mis-pse-hydrogen-metal', 'chem-mis-pse-metal-right', 'chem-mis-pse-li-reactive'],
  },
  {
    id: 'pse-edelgasregel',
    topic: 'chem-pse',
    title: 'Edelgasregel',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Edelgase haben eine voll besetzte äußerste Schale (bis auf Helium acht Elektronen, das Oktett) und reagieren kaum. Andere Atome erreichen diese Konfiguration, indem sie Elektronen abgeben, aufnehmen oder teilen, und zwar auf dem kürzesten Weg.',
    note: 'Kationen erreichen die Konfiguration des Edelgases vor ihnen (Ende der vorherigen Periode), Anionen die des Edelgases am Ende ihrer eigenen Periode.',
    examples: [
      { chemTask: r`$\ce{Na+}$ und $\ce{O^2-}$`, lines: [{ label: 'beide 10 Elektronen: Konfiguration von Neon' }] },
      { chemTask: r`$\ce{Cl-}$`, lines: [{ label: '18 Elektronen: Konfiguration von Argon' }] },
    ],
    errors: ['chem-pse-noble-own-period', 'chem-pse-noble-previous', 'chem-pse-ion-take', 'chem-pse-ion-give', 'chem-mis-pse-noble-reactive', 'chem-mis-pse-octet-all', 'chem-mis-pse-noble-own', 'chem-mis-pse-helium-all'],
  },
  {
    id: 'pse-ionen',
    topic: 'chem-pse',
    title: 'Ionenladung aus der Hauptgruppe',
    level: 1,
    rules: [],
    formulas: [r`\text{I: } +1 \quad \text{II: } +2 \quad \text{III: } +3 \quad \text{V: } -3 \quad \text{VI: } -2 \quad \text{VII: } -1`],
    memo: 'Metalle der I. bis III. Hauptgruppe geben ihre Valenzelektronen ab und werden positiv. Nichtmetalle der V. bis VII. Hauptgruppe nehmen die fehlenden Elektronen bis zum Oktett auf und werden negativ. Die Ladung ist die Zahl der abgegebenen bzw. aufgenommenen Elektronen.',
    note: 'Elemente der IV. Hauptgruppe wie Kohlenstoff und Silicium bilden kaum einfache Ionen; sie teilen Elektronen in Atombindungen.',
    examples: [
      { chemTask: r`Magnesium ($\ce{Mg}$, II. Hauptgruppe)`, lines: [{ label: 'gibt 2 Elektronen ab', latex: r`\ce{Mg^2+}` }] },
      { chemTask: r`Stickstoff ($\ce{N}$, V. Hauptgruppe)`, lines: [{ label: 'nimmt 3 Elektronen auf', latex: r`\ce{N^3-}` }] },
    ],
    errors: ['chem-pse-charge-sign', 'chem-pse-charge-group-number', 'chem-pse-charge-valence', 'chem-pse-charge-octet', 'chem-mis-pse-charge-sign', 'chem-mis-pse-charge-count'],
  },
  {
    id: 'pse-ionisierung',
    topic: 'chem-pse',
    title: 'Ionisierungsenergie',
    level: 2,
    rules: [],
    formulas: [r`\ce{X -> X+ + e-}\quad I_{1},\qquad \ce{X+ -> X^2+ + e-}\quad I_{2}`],
    memo: 'Die Ionisierungsenergie ist die Energie, die man braucht, um einem Atom (oder Ion) im Gaszustand ein Elektron zu entreißen. Jede weitere ist größer, weil das Teilchen schon positiv ist. Einen großen Sprung gibt es, wenn das nächste Elektron aus einer inneren, voll besetzten Schale kommt.',
    note: 'Die Zahl der Elektronen vor dem großen Sprung ist die Zahl der Valenzelektronen, also die Hauptgruppe.',
    examples: [
      { chemTask: r`Magnesium: $I_{1} = 738$, $I_{2} = 1451$, $I_{3} = 7733$ kJ/mol`, lines: [{ label: 'Sprung nach dem 2. Elektron: II. Hauptgruppe' }] },
      { chemTask: r`Natrium: $I_{1} = 496$, $I_{2} = 4562$ kJ/mol`, lines: [{ label: 'Sprung nach dem 1. Elektron: I. Hauptgruppe' }] },
    ],
    errors: ['chem-pse-ie-largest', 'chem-pse-ie-first', 'chem-pse-ie-count-after', 'chem-pse-ie-count-all', 'chem-mis-pse-ie-decrease', 'chem-mis-pse-ie-definition', 'chem-mis-pse-ie-count'],
  },
]
