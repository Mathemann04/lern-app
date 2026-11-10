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
    note: String.raw`Die Zahl wurde ursprünglich so gewählt, dass zwölf Gramm des Kohlenstoffisotops $\ce{^{12}C}$ ein Mol Atome enthalten; seit 2019 ist sie als feste Zahl festgelegt. Weil Teilchen so winzig sind, ist die Teilchenzahl einer Portion, die man wiegen kann, immer eine riesige Zahl.`,
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
    errors: ['chem-particles-divided', 'chem-mis-st-avogadro-inverted', 'chem-mis-st-n-is-count', 'chem-mis-st-mol-is-mass', 'chem-mis-st-mol-count-varies', 'chem-mis-st-mol-only-gas', 'chem-mis-st-na-estimate', 'chem-mis-st-power', 'chem-mis-st-n-is-mass'],
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
    errors: ['chem-molar-index', 'chem-molar-atomic-number', 'chem-mis-st-units', 'chem-mis-st-atomic-number', 'chem-mis-st-mass-number', 'chem-mis-st-index-ignored', 'chem-mis-st-atom-for-molecule', 'chem-mis-st-decimal', 'chem-mis-st-molar-mass-portion', 'chem-mis-st-particle-mass', 'chem-mis-st-same-m-same-stoff', 'chem-mis-st-formula-split', 'chem-mis-st-formula-reduced'],
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
    errors: ['chem-n-times', 'chem-n-inverted', 'chem-m-divided', 'chem-mis-st-n-times-m', 'chem-mis-st-n-inverted', 'chem-mis-st-m-divided', 'chem-mis-st-same-mass-same-n', 'chem-mis-st-heavier-more', 'chem-mis-st-n-decides-mass', 'chem-mis-st-m-ignores-n', 'chem-mis-st-prefix', 'chem-mis-st-magnitude'],
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
    errors: ['chem-molar-bracket', 'chem-molar-hydrate', 'chem-mis-st-bracket', 'chem-mis-st-hydrate-forgotten', 'chem-mis-st-hydrate-factor', 'chem-mis-st-index-coefficient'],
  },
  {
    id: 'stoffmenge-atome',
    topic: 'chem-stoffmenge',
    title: 'Atome oder Moleküle?',
    level: 3,
    rules: [],
    formulas: [String.raw`N(\text{Atome}) = (\text{Atome je Teilchen}) \cdot N(\text{Teilchen})`],
    memo: 'Die Stoffmenge zählt die Teilchen der Formel, also Moleküle oder Formeleinheiten. Wird nach den Atomen eines Elements gefragt, kommt noch ein Faktor dazu: so viele Atome des Elements, wie in einem Teilchen stecken. Das ist der Index, bei einer Klammer oder bei Kristallwasser malgenommen.',
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
    errors: ['chem-atoms-molecules', 'chem-mis-st-atoms-molecules', 'chem-mis-st-atoms-all', 'chem-mis-st-salt-molecule'],
  },
  {
    id: 'stoffmenge-umsatz',
    topic: 'chem-stoffmenge',
    title: 'Umsatz in drei Schritten',
    level: 1,
    rules: [],
    formulas: [String.raw`n(\text{gesucht}) = n(\text{gegeben}) \cdot \frac{\nu(\text{gesucht})}{\nu(\text{gegeben})}`],
    memo: 'Wie viel von einem Stoff entsteht oder gebraucht wird, rechnest du immer über die Stoffmengen: Masse des gegebenen Stoffs in Mol umrechnen, mit dem Verhältnis der Koeffizienten auf den gesuchten Stoff übertragen, zurück in Gramm.',
    note: String.raw`Die Koeffizienten $\nu$ (sprich „nü“) gelten für Teilchen und damit für Stoffmengen, nie für Massen. Jeder Stoff hat seine eigene molare Masse. Eine Tabelle mit den Zeilen $n$, $M$ und $m$ je Stoff hilft, den Überblick zu behalten.`,
    when: 'Wenn aus der Masse eines Stoffs die Masse eines anderen Stoffs derselben Reaktion gesucht ist.',
    examples: [
      {
        chemTask: String.raw`Welche Masse $\ce{CO2}$ entsteht aus $5{,}8\,\mathrm{g}$ Butan? $\ce{2 C4H10 + 13 O2 -> 8 CO2 + 10 H2O}$, mit $M(\ce{C4H10}) = 58$ und $M(\ce{CO2}) = 44\,\mathrm{g/mol}$`,
        lines: [
          { label: 'Stoffmenge Butan', latex: String.raw`n = \frac{5{,}8\,\mathrm{g}}{58\,\mathrm{g/mol}} = 0{,}1\,\mathrm{mol}` },
          { label: 'Verhältnis 8 : 2', latex: String.raw`n(\ce{CO2}) = 0{,}1\,\mathrm{mol} \cdot \frac{8}{2} = 0{,}4\,\mathrm{mol}` },
          { label: 'Ergebnis', latex: String.raw`m(\ce{CO2}) = 0{,}4\,\mathrm{mol} \cdot 44\,\mathrm{g/mol} = 17{,}6\,\mathrm{g}` },
        ],
      },
      {
        chemTask: String.raw`Wie viel Sauerstoff braucht man für $4\,\mathrm{g}$ Methan? $\ce{CH4 + 2 O2 -> CO2 + 2 H2O}$, mit $M(\ce{CH4}) = 16$ und $M(\ce{O2}) = 32\,\mathrm{g/mol}$`,
        lines: [
          { label: 'Stoffmenge Methan', latex: String.raw`n = \frac{4\,\mathrm{g}}{16\,\mathrm{g/mol}} = 0{,}25\,\mathrm{mol}` },
          { label: 'Verhältnis 2 : 1', latex: String.raw`n(\ce{O2}) = 0{,}25\,\mathrm{mol} \cdot \frac{2}{1} = 0{,}5\,\mathrm{mol}` },
          { label: 'Ergebnis', latex: String.raw`m(\ce{O2}) = 0{,}5\,\mathrm{mol} \cdot 32\,\mathrm{g/mol} = 16\,\mathrm{g}` },
        ],
      },
    ],
    errors: ['chem-ratio-one', 'chem-ratio-swapped', 'chem-ratio-product-only', 'chem-ratio-wrong-molar-mass', 'chem-similar-molar-mass'],
  },
]
