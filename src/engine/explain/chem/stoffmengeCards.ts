import type { Card } from '../cards.ts'

// Lernkarten des Ordners „Stoffmenge und Umsatz“ (Chemie 1), in eigenen Worten. Die Zahlen der Beispiele
// rechnet ein Test mit der Engine nach (cards.test.ts); Umsatz kommt mit S4.

export const STOFFMENGE_CARDS: readonly Card[] = [
  {
    id: 'stoffmenge-mol',
    topic: 'chem-stoffmenge',
    title: 'Stoffmenge und Avogadro-Konstante',
    level: 1,
    rules: [],
    formulas: [String.raw`N = n \cdot N_A`, String.raw`n = \frac{N}{N_A}`, String.raw`N_A = 6{,}022 \cdot 10^{23}\,\mathrm{mol^{-1}}`],
    memo: 'Die Stoffmenge zählt Teilchen in einer großen Einheit, dem Mol. Ein Mol sind immer gleich viele Teilchen, egal ob Atome, Moleküle oder Formeleinheiten eines Salzes: so viele, wie die Avogadro-Konstante angibt.',
    note: String.raw`Die Zahl ist so gewählt, dass zwölf Gramm des Kohlenstoffisotops $\ce{^{12}C}$ genau ein Mol Atome enthalten. Weil Teilchen so winzig sind, ist die Teilchenzahl einer Portion, die man wiegen kann, immer eine riesige Zahl.`,
    when: 'Wenn nach der Zahl der Teilchen gefragt ist oder eine Teilchenzahl gegeben ist.',
    examples: [
      {
        chemTask: String.raw`Wie viele Moleküle stecken in $0{,}5\,\mathrm{mol}$ Wasser?`,
        lines: [
          { label: 'Teilchenzahl', latex: String.raw`N = n \cdot N_A = 0{,}5\,\mathrm{mol} \cdot 6{,}022 \cdot 10^{23}\,\mathrm{mol^{-1}}` },
          { label: 'Ergebnis', latex: String.raw`N \approx 3{,}01 \cdot 10^{23}` },
        ],
      },
      {
        chemTask: String.raw`Welche Stoffmenge sind $1{,}2044 \cdot 10^{24}$ Eisenatome?`,
        lines: [
          { label: 'Stoffmenge', latex: String.raw`n = \frac{N}{N_A} = \frac{1{,}2044 \cdot 10^{24}}{6{,}022 \cdot 10^{23}\,\mathrm{mol^{-1}}}` },
          { label: 'Ergebnis', latex: String.raw`n = 2\,\mathrm{mol}` },
        ],
      },
    ],
    errors: ['chem-particles-divided'],
  },
  {
    id: 'stoffmenge-molmasse',
    topic: 'chem-stoffmenge',
    title: 'Molare Masse',
    level: 1,
    rules: [],
    formulas: [String.raw`M(\ce{H2O}) = 2 \cdot M(\ce{H}) + M(\ce{O})`],
    memo: 'Die molare Masse sagt, wie viel Gramm ein Mol eines Stoffes wiegt. Für ein Element steht sie im Periodensystem, für eine Verbindung zählst du die Molmassen aller Atome der Formel zusammen, jedes so oft, wie es vorkommt.',
    note: 'Einheit: g/mol. Im Periodensystem steht bei jedem Element neben der Ordnungszahl auch die Molmasse; für die Rechnung zählt nur die Molmasse.',
    when: 'Immer, wenn zwischen Masse und Stoffmenge umgerechnet wird.',
    examples: [
      {
        chemTask: String.raw`Molare Masse von Kohlenstoffdioxid $\ce{CO2}$ mit $M(\ce{C}) = 12$ und $M(\ce{O}) = 16\,\mathrm{g/mol}$`,
        lines: [
          { label: 'Atome: 1 C und 2 O', latex: String.raw`M(\ce{CO2}) = 12 + 2 \cdot 16` },
          { label: 'Ergebnis', latex: String.raw`M(\ce{CO2}) = 44\,\mathrm{g/mol}` },
        ],
      },
      {
        chemTask: String.raw`Molare Masse von Butan $\ce{C4H10}$ mit $M(\ce{C}) = 12$ und $M(\ce{H}) = 1\,\mathrm{g/mol}$`,
        lines: [
          { label: 'Atome: 4 C und 10 H', latex: String.raw`M(\ce{C4H10}) = 4 \cdot 12 + 10 \cdot 1` },
          { label: 'Ergebnis', latex: String.raw`M(\ce{C4H10}) = 58\,\mathrm{g/mol}` },
        ],
      },
    ],
    errors: ['chem-molar-index', 'chem-molar-atomic-number'],
  },
  {
    id: 'stoffmenge-n-m-m',
    topic: 'chem-stoffmenge',
    title: 'Masse, Stoffmenge und molare Masse',
    level: 1,
    rules: [],
    formulas: [String.raw`m = n \cdot M`, String.raw`n = \frac{m}{M}`, String.raw`M = \frac{m}{n}`],
    memo: 'Masse, Stoffmenge und molare Masse hängen über eine einzige Gleichung zusammen: Die Masse einer Portion ist ihre Stoffmenge mal die Masse eines Mols. Die anderen beiden Formen entstehen durch Umstellen.',
    note: 'Die Einheiten helfen beim Umstellen: Mol mal Gramm je Mol ergibt Gramm, Gramm geteilt durch Gramm je Mol ergibt Mol.',
    when: 'Wenn eine Masse in eine Stoffmenge umgerechnet werden soll oder umgekehrt.',
    examples: [
      {
        chemTask: String.raw`Welche Stoffmenge sind $5{,}8\,\mathrm{g}$ Butan ($M = 58\,\mathrm{g/mol}$)?`,
        lines: [
          { label: 'Stoffmenge', latex: String.raw`n = \frac{m}{M} = \frac{5{,}8\,\mathrm{g}}{58\,\mathrm{g/mol}}` },
          { label: 'Ergebnis', latex: String.raw`n = 0{,}1\,\mathrm{mol}` },
        ],
      },
      {
        chemTask: String.raw`Wie viel wiegen $0{,}5\,\mathrm{mol}$ Wasser ($M = 18\,\mathrm{g/mol}$)?`,
        lines: [
          { label: 'Masse', latex: String.raw`m = n \cdot M = 0{,}5\,\mathrm{mol} \cdot 18\,\mathrm{g/mol}` },
          { label: 'Ergebnis', latex: String.raw`m = 9\,\mathrm{g}` },
        ],
      },
    ],
    errors: ['chem-n-times', 'chem-n-inverted', 'chem-m-divided'],
  },
  {
    id: 'stoffmenge-formeln',
    topic: 'chem-stoffmenge',
    title: 'Formeln mit Klammern und Kristallwasser',
    level: 2,
    rules: [],
    formulas: [String.raw`\ce{Ca(OH)2}`, String.raw`\ce{CuSO4 * 5 H2O}`],
    memo: 'Ein Index hinter einer Klammer gilt für alles in der Klammer. Kristallwasser hinter dem Malpunkt gehört fest zur Formeleinheit; die Zahl davor gilt für das ganze Wassermolekül.',
    note: String.raw`$\ce{Ca(OH)2}$ enthält 1 Calcium-, 2 Sauerstoff- und 2 Wasserstoffatome. $\ce{Al2(SO4)3}$ enthält 2 Aluminium-, 3 Schwefel- und 12 Sauerstoffatome.`,
    when: 'Wenn in einer Formel Klammern oder ein Malpunkt stehen.',
    examples: [
      {
        chemTask: String.raw`Molare Masse von Calciumhydroxid $\ce{Ca(OH)2}$ (Werte aus dem PSE)`,
        lines: [
          { label: 'Atome: 1 Ca, 2 O, 2 H', latex: String.raw`M = 40{,}1 + 2 \cdot 16{,}0 + 2 \cdot 1{,}0` },
          { label: 'Ergebnis', latex: String.raw`M(\ce{Ca(OH)2}) = 74{,}1\,\mathrm{g/mol}` },
        ],
      },
      {
        chemTask: String.raw`Molare Masse von Kupfer(II)-sulfat-Pentahydrat $\ce{CuSO4 * 5 H2O}$ (Werte aus dem PSE)`,
        lines: [
          { label: 'Atome: 1 Cu, 1 S, 9 O, 10 H', latex: String.raw`M = 63{,}5 + 32{,}1 + 9 \cdot 16{,}0 + 10 \cdot 1{,}0` },
          { label: 'Ergebnis', latex: String.raw`M(\ce{CuSO4 * 5 H2O}) = 249{,}6\,\mathrm{g/mol}` },
        ],
      },
    ],
    errors: ['chem-molar-bracket', 'chem-molar-hydrate'],
  },
  {
    id: 'stoffmenge-atome',
    topic: 'chem-stoffmenge',
    title: 'Atome oder Moleküle?',
    level: 3,
    rules: [],
    formulas: [String.raw`N(\text{Atome}) = \text{Index} \cdot N(\text{Moleküle})`],
    memo: 'Die Stoffmenge zählt die Teilchen der Formel, also Moleküle oder Formeleinheiten. Wird nach den Atomen eines Elements gefragt, kommt noch der Index dazu: Jedes Molekül bringt so viele Atome mit, wie der Index sagt.',
    when: 'Wenn nach Atomen eines Elements in einem Stoff gefragt ist.',
    examples: [
      {
        chemTask: String.raw`Wie viele Wasserstoffatome stecken in $0{,}5\,\mathrm{mol}$ Wasser $\ce{H2O}$?`,
        lines: [
          { label: 'Moleküle', latex: String.raw`N = 0{,}5\,\mathrm{mol} \cdot 6{,}022 \cdot 10^{23}\,\mathrm{mol^{-1}} \approx 3{,}01 \cdot 10^{23}` },
          { label: 'Je Molekül 2 Wasserstoffatome', latex: String.raw`N(\ce{H}) = 2 \cdot 3{,}01 \cdot 10^{23} \approx 6{,}02 \cdot 10^{23}` },
        ],
      },
      {
        chemTask: String.raw`Wie viele Mol Sauerstoffatome sind in $1\,\mathrm{mol}$ Sauerstoff $\ce{O2}$?`,
        lines: [
          { label: 'Jedes Molekül enthält 2 Atome.' },
          { label: 'Ergebnis', latex: String.raw`n(\ce{O}) = 2\,\mathrm{mol}` },
        ],
      },
    ],
    errors: ['chem-atoms-molecules'],
  },
]
