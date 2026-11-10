import type { Card } from '../cards.ts'

// Lernkarten des Ordners „Reaktionsgleichungen“ (Chemie 1), in eigenen Worten. Die Gleichungen der
// Beispiele gleicht ein Test mit der Engine nach (cards.test.ts).

export const GLEICHUNGEN_CARDS: readonly Card[] = [
  {
    id: 'gleichungen-lesen',
    topic: 'chem-gleichungen',
    title: 'Reaktionsgleichung lesen',
    level: 1,
    rules: [],
    formulas: [String.raw`\ce{2 H2 + O2 -> 2 H2O}`],
    memo: 'Links stehen die Ausgangsstoffe (Edukte), rechts die Produkte, dazwischen der Reaktionspfeil. Die Zahl vor einer Formel (Koeffizient) sagt, wie viele Teilchen reagieren; die kleine Zahl in der Formel (Index) gehört zum Stoff selbst.',
    note: String.raw`Der einfache Pfeil $\rightarrow$ steht für eine Reaktion, die vollständig abläuft, der Doppelpfeil $\rightleftharpoons$ für ein Gleichgewicht. Zustände stehen in Klammern dahinter: (s) fest, (l) flüssig, (g) gasförmig, (aq) in Wasser gelöst. Bei einer Reaktion gehen keine Atome verloren und keine entstehen neu; deshalb bleibt die Masse erhalten.`,
    when: 'Immer, wenn eine Reaktionsgleichung gelesen oder geprüft wird.',
    examples: [
      {
        chemTask: String.raw`Wie viele Wasserstoffatome stehen links in $\ce{2 H2 + O2 -> 2 H2O}$?`,
        lines: [
          { label: 'Koeffizient mal Index', latex: String.raw`2 \cdot 2 = 4` },
          { label: 'Rechts genauso: zwei Wassermoleküle mit je zwei H-Atomen', latex: String.raw`2 \cdot 2 = 4` },
        ],
      },
      {
        chemTask: String.raw`Was bedeuten die Zahlen in $\ce{3 CO2}$?`,
        lines: [
          { label: 'Koeffizient 3: drei Moleküle Kohlenstoffdioxid' },
          { label: 'Index 2: jedes Molekül enthält zwei Sauerstoffatome' },
          { label: 'zusammen 3 C-Atome und 6 O-Atome', latex: String.raw`3 \cdot 2 = 6` },
        ],
      },
    ],
    errors: ['chem-balance-count-coefficient', 'chem-balance-count-index'],
  },
  {
    id: 'gleichungen-ausgleichen',
    topic: 'chem-gleichungen',
    title: 'Ausgleichen Schritt für Schritt',
    level: 1,
    rules: [],
    formulas: [String.raw`\ce{4 Fe + 3 O2 -> 2 Fe2O3}`],
    memo: 'Ausgleichen heißt: die Koeffizienten so wählen, dass von jedem Element links und rechts gleich viele Atome stehen. Die Formeln selbst bleiben, wie sie sind. Am Ende stehen die kleinsten ganzen Zahlen.',
    note: 'Bewährte Reihenfolge: zuerst ein Element, das links und rechts in nur je einem Stoff vorkommt, Wasserstoff und Sauerstoff zum Schluss. Nach jeder Änderung neu zählen. Steht am Ende ein Bruch, alles mit dem Nenner malnehmen.',
    when: 'Wenn eine Reaktionsgleichung aufgestellt oder geprüft wird.',
    examples: [
      {
        chemTask: String.raw`Gleiche aus: $\ce{Mg + O2 -> MgO}$`,
        lines: [
          { label: 'Sauerstoff: links 2, rechts 1, also 2 MgO', latex: String.raw`\ce{Mg + O2 -> 2 MgO}` },
          { label: 'Magnesium: rechts jetzt 2, also 2 Mg', latex: String.raw`\ce{2 Mg + O2 -> 2 MgO}` },
        ],
      },
      {
        chemTask: String.raw`Gleiche aus: $\ce{Fe + O2 -> Fe2O3}$`,
        lines: [
          { label: 'Sauerstoff: links 2, rechts 3; gemeinsames Vielfaches 6', latex: String.raw`\ce{Fe + 3 O2 -> 2 Fe2O3}` },
          { label: 'Eisen: rechts 4, also 4 Fe', latex: String.raw`\ce{4 Fe + 3 O2 -> 2 Fe2O3}` },
        ],
      },
    ],
    errors: ['chem-balance-index', 'chem-balance-partly-doubled'],
  },
  {
    id: 'gleichungen-zweiatomig',
    topic: 'chem-gleichungen',
    title: 'Zweiatomige Elemente',
    level: 1,
    rules: [],
    formulas: [String.raw`\ce{H2}, \ce{N2}, \ce{O2}, \ce{F2}, \ce{Cl2}, \ce{Br2}, \ce{I2}`],
    memo: 'Sieben Elemente kommen nicht als einzelne Atome vor, sondern als Moleküle aus zwei Atomen: Wasserstoff, Stickstoff, Sauerstoff und die Halogene Fluor, Chlor, Brom und Iod. In Gleichungen stehen sie deshalb immer mit der 2.',
    note: 'Metalle wie Natrium, Eisen oder Magnesium stehen dagegen als einzelnes Symbol in der Gleichung, ebenso Kohlenstoff, Schwefel und Phosphor.',
    when: 'Wenn eines dieser Elemente als Stoff in einer Gleichung vorkommt.',
    examples: [
      {
        chemTask: 'Wasserstoff verbrennt zu Wasser.',
        lines: [
          { label: 'Wasserstoff und Sauerstoff als Moleküle', latex: String.raw`\ce{H2 + O2 -> H2O}` },
          { label: 'ausgeglichen', latex: String.raw`\ce{2 H2 + O2 -> 2 H2O}` },
        ],
      },
      {
        chemTask: 'Natrium reagiert mit Chlor.',
        lines: [
          { label: 'Natrium als Atom, Chlor als Molekül', latex: String.raw`\ce{Na + Cl2 -> NaCl}` },
          { label: 'ausgeglichen', latex: String.raw`\ce{2 Na + Cl2 -> 2 NaCl}` },
        ],
      },
    ],
    errors: ['chem-balance-single-atom'],
  },
  {
    id: 'gleichungen-verbrennung',
    topic: 'chem-gleichungen',
    title: 'Vollständige Verbrennung',
    level: 1,
    rules: [],
    formulas: [String.raw`\ce{C_xH_y + O2 -> CO2 + H2O}`],
    memo: 'Bei der vollständigen Verbrennung eines Stoffes aus Kohlenstoff und Wasserstoff (auch mit Sauerstoff, wie bei Alkoholen) entstehen nur Kohlenstoffdioxid und Wasser. Ausgleichen in dieser Reihenfolge: Kohlenstoff, Wasserstoff, Sauerstoff, zum Schluss ganzzahlig machen.',
    note: String.raw`Jedes C-Atom wird zu einem $\ce{CO2}$, je zwei H-Atome zu einem $\ce{H2O}$. Dann die O-Atome rechts zählen, den Sauerstoff im Brennstoff abziehen und durch 2 teilen. Ist das ein Bruch, alles mit 2 malnehmen.`,
    when: 'Wenn ein Alkan oder Alkohol vollständig verbrennt.',
    examples: [
      {
        chemTask: String.raw`Propan $\ce{C3H8}$ verbrennt vollständig.`,
        lines: [
          { label: 'C und H', latex: String.raw`\ce{C3H8} + {?}\,\ce{O2} \rightarrow \ce{3 CO2 + 4 H2O}` },
          { label: 'Sauerstoff rechts: 6 + 4 = 10 Atome, also 5 Moleküle', latex: String.raw`\ce{C3H8 + 5 O2 -> 3 CO2 + 4 H2O}` },
        ],
      },
      {
        chemTask: String.raw`Butan $\ce{C4H10}$ verbrennt vollständig.`,
        lines: [
          { label: 'C und H', latex: String.raw`\ce{C4H10} + {?}\,\ce{O2} \rightarrow \ce{4 CO2 + 5 H2O}` },
          { label: 'Sauerstoff rechts: 8 + 5 = 13 Atome', latex: String.raw`\ce{C4H10 + 13/2 O2 -> 4 CO2 + 5 H2O}` },
          { label: 'alles mal 2', latex: String.raw`\ce{2 C4H10 + 13 O2 -> 8 CO2 + 10 H2O}` },
        ],
      },
    ],
    errors: ['chem-balance-water-oxygen', 'chem-balance-oxygen', 'chem-balance-co', 'chem-balance-partly-doubled', 'chem-balance-count-index'],
  },
  {
    id: 'gleichungen-alkane',
    topic: 'chem-gleichungen',
    title: 'Alkane und Alkohole',
    level: 2,
    rules: [],
    formulas: [String.raw`\ce{C_nH_{2n+2}}`, String.raw`\ce{C_nH_{2n+1}OH}`],
    memo: 'Alkane sind Kohlenwasserstoffe mit nur Einfachbindungen; zu n Kohlenstoffatomen gehören 2n + 2 Wasserstoffatome. Ein Alkohol hat statt eines H-Atoms eine OH-Gruppe.',
    note: String.raw`Methan $\ce{CH4}$, Ethan $\ce{C2H6}$, Propan $\ce{C3H8}$, Butan $\ce{C4H10}$, Pentan $\ce{C5H12}$, Hexan $\ce{C6H14}$, Heptan $\ce{C7H16}$, Octan $\ce{C8H18}$, Nonan $\ce{C9H20}$, Decan $\ce{C10H22}$. Alkohole: Methanol $\ce{CH3OH}$, Ethanol $\ce{C2H5OH}$, Propanol $\ce{C3H7OH}$, Butanol $\ce{C4H9OH}$.`,
    when: 'Wenn nur der Name eines Alkans oder Alkohols gegeben ist.',
    examples: [
      {
        chemTask: 'Welche Formel hat Heptan?',
        lines: [
          { label: 'Hept- steht für 7 Kohlenstoffatome', latex: 'n = 7' },
          { label: 'Wasserstoff: 2 · 7 + 2 = 16', latex: String.raw`\ce{C7H16}` },
        ],
      },
      {
        chemTask: 'Welche Formel hat Ethanol?',
        lines: [
          { label: 'Eth- steht für 2 Kohlenstoffatome; Ethan ist $\\ce{C2H6}$' },
          { label: 'ein H-Atom durch OH ersetzt', latex: String.raw`\ce{C2H5OH}` },
        ],
      },
    ],
    errors: [],
  },
]
