import type { Card } from '../cards.ts'

// Lernkarten des Ordners „Trends im Periodensystem“ (Chemie 1, S6d), in eigenen Worten. Messwerte der Beispiele wie in
// chem/trends.ts (geprüft in generators/trends.test.ts).

const r = String.raw

export const TRENDS_CARDS: readonly Card[] = [
  {
    id: 'tr-ueberblick',
    topic: 'chem-trends',
    title: 'Trends auf einen Blick',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Zwei Größen erklären fast alle Trends: die Kernladung und die Zahl der Schalen. In einer Periode wächst die Kernladung bei gleicher Zahl von Schalen; der Kern hält die Elektronen fester. In einer Gruppe kommt nach unten jedes Mal eine Schale dazu; die äußeren Elektronen sind weiter weg und stärker abgeschirmt.',
    note: 'Atomradius und Metallcharakter nehmen nach links unten zu. Ionisierungsenergie, Elektronegativität und (mit Ausnahmen) Elektronenaffinität nehmen nach rechts oben zu.',
    examples: [
      { chemTask: r`$\ce{Cs}$ (links unten)`, lines: [{ label: 'großes Atom, kleine Ionisierungsenergie, kleine Elektronegativität, stark metallisch' }] },
      { chemTask: r`$\ce{F}$ (rechts oben)`, lines: [{ label: 'kleines Atom, große Ionisierungsenergie, größte Elektronegativität' }] },
    ],
    errors: ['chem-tr-constant', 'chem-tr-order-middle', 'chem-mis-tr-constant', 'chem-mis-tr-shielding'],
    figures: ['pse-trend:en'],
  },
  {
    id: 'tr-atomradius',
    topic: 'chem-trends',
    title: 'Atomradius',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Der Atomradius nimmt in einer Periode von links nach rechts ab: Die Elektronen kommen in dieselbe Schale, die Kernladung wächst und zieht die Hülle zusammen. In einer Gruppe nimmt er nach unten zu, weil jedes Mal eine Schale dazukommt.',
    note: 'Gemessen wird der halbe Abstand zweier gebundener gleicher Atome (Kovalenzradius). Edelgase werden dabei nicht verglichen, weil sie kaum Bindungen eingehen.',
    examples: [
      { chemTask: r`$\ce{Na}$, $\ce{Mg}$, $\ce{Cl}$`, lines: [{ label: 'Kovalenzradien', latex: r`166\,\mathrm{pm} > 141\,\mathrm{pm} > 102\,\mathrm{pm}` }] },
      { chemTask: r`$\ce{Li}$, $\ce{Na}$, $\ce{K}$`, lines: [{ label: 'Kovalenzradien', latex: r`128\,\mathrm{pm} < 166\,\mathrm{pm} < 203\,\mathrm{pm}` }] },
    ],
    errors: ['chem-tr-radius-period', 'chem-tr-radius-group', 'chem-mis-tr-radius-electrons', 'chem-mis-tr-radius-protons', 'chem-mis-tr-radius-mass'],
    figures: ['pse-trend:radius'],
  },
  {
    id: 'tr-ionisierung',
    topic: 'chem-trends',
    title: 'Erste Ionisierungsenergie im Periodensystem',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Die erste Ionisierungsenergie nimmt in einer Periode nach rechts zu, weil die wachsende Kernladung die Valenzelektronen fester hält. In einer Gruppe nimmt sie nach unten ab: Die Valenzelektronen sitzen weiter außen und sind stärker abgeschirmt. Die Edelgase haben in ihrer Periode die größte, die Alkalimetalle die kleinste.',
    note: 'Es gibt kleine Ausnahmen in der Periode, etwa zwischen der II. und der III. Hauptgruppe; Reihen mit solchen Paaren werden hier nicht gefragt.',
    examples: [
      { chemTask: r`$\ce{Na}$, $\ce{Si}$, $\ce{Cl}$`, lines: [{ label: 'erste Ionisierungsenergie in kJ/mol', latex: r`496 < 787 < 1251` }] },
      { chemTask: r`$\ce{Li}$, $\ce{Na}$, $\ce{K}$`, lines: [{ label: 'erste Ionisierungsenergie in kJ/mol', latex: r`520 > 496 > 419` }] },
    ],
    errors: ['chem-tr-ie-period', 'chem-tr-ie-group', 'chem-mis-tr-ie-reversed', 'chem-mis-tr-ie-noble-low'],
    figures: ['pse-trend:ie'],
  },
  {
    id: 'tr-elektronegativitaet',
    topic: 'chem-trends',
    title: 'Elektronegativität',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Die Elektronegativität gibt an, wie stark ein Atom in einer Bindung die gemeinsamen Elektronen zu sich zieht. Sie ist eine Vergleichszahl ohne Einheit (Pauling-Skala). Sie nimmt in einer Periode nach rechts zu und in einer Gruppe nach unten ab. Fluor hat mit 3,98 den größten Wert.',
    note: 'Für Helium, Neon und Argon wird meist kein Wert angegeben, weil sie praktisch keine Bindungen bilden.',
    examples: [
      { chemTask: r`$\ce{F}$, $\ce{Cl}$, $\ce{Br}$, $\ce{I}$`, lines: [{ label: 'Pauling-Werte', latex: r`3{,}98 > 3{,}16 > 2{,}96 > 2{,}66` }] },
      { chemTask: r`$\ce{Li}$, $\ce{C}$, $\ce{F}$`, lines: [{ label: 'Pauling-Werte', latex: r`0{,}98 < 2{,}55 < 3{,}98` }] },
    ],
    errors: ['chem-tr-en-period', 'chem-tr-en-group', 'chem-mis-tr-en-max-cl', 'chem-mis-tr-noble-en'],
    figures: ['pse-trend:en'],
  },
  {
    id: 'tr-elektronenaffinitaet',
    topic: 'chem-trends',
    title: 'Elektronenaffinität',
    level: 2,
    rules: [],
    formulas: [r`\ce{X + e- -> X-}`],
    memo: 'Die Elektronenaffinität ist die Energie, die umgesetzt wird, wenn ein einzelnes Atom im Gaszustand ein Elektron aufnimmt. Bei vielen Nichtmetallen wird dabei Energie frei, bei den Halogenen besonders viel. Grob nimmt sie wie die Elektronegativität nach rechts oben zu, mit vielen Ausnahmen.',
    note: 'Unterschied zur Elektronegativität: Die Elektronenaffinität ist eine messbare Energie eines einzelnen Atoms; die Elektronegativität eine Vergleichszahl für Atome in einer Bindung.',
    examples: [
      { chemTask: 'Chlor nimmt ein Elektron auf', lines: [{ label: 'Es entsteht ein Chlorid-Ion mit Edelgaskonfiguration; dabei wird viel Energie frei.' }] },
      { chemTask: 'Natrium nimmt ein Elektron auf', lines: [{ label: 'Es wird nur wenig Energie frei; Natrium erreicht die Edelgaskonfiguration viel leichter, indem es sein Valenzelektron abgibt.' }] },
    ],
    errors: ['chem-mis-tr-en-ea-same', 'chem-mis-tr-ea-sign'],
  },
  {
    id: 'tr-metallcharakter',
    topic: 'chem-trends',
    title: 'Metallcharakter',
    level: 1,
    rules: [],
    formulas: [],
    memo: 'Ein Element ist umso metallischer, je leichter es seine Valenzelektronen abgibt. Der Metallcharakter nimmt deshalb nach links und nach unten zu, also genau entgegen der Ionisierungsenergie.',
    note: 'Unten links stehen die reaktivsten Metalle (Caesium), oben rechts die typischen Nichtmetalle (Fluor, Sauerstoff).',
    examples: [
      { chemTask: '3. Periode', lines: [{ label: 'Natrium und Magnesium sind Metalle, Silicium ein Halbmetall, Chlor ein Nichtmetall.' }] },
      { chemTask: 'I. Hauptgruppe', lines: [{ label: 'Von Lithium bis Caesium wird die Reaktion mit Wasser immer heftiger.' }] },
    ],
    errors: ['chem-mis-tr-metal-right'],
  },
  {
    id: 'tr-ionenradien',
    topic: 'chem-trends',
    title: 'Ionenradien',
    level: 2,
    rules: [],
    formulas: [r`\ce{Al^3+} < \ce{Mg^2+} < \ce{Na+} < \ce{F-} < \ce{O^2-}`],
    memo: 'Kationen sind kleiner als ihre Atome (die äußerste Schale fehlt), Anionen größer (mehr Elektronen bei gleicher Kernladung). Haben Ionen gleich viele Elektronen, ist das mit den meisten Protonen am kleinsten.',
    note: 'Alle Ionen der Reihe oben haben 10 Elektronen wie Neon. Ionenradien nach Shannon: 54, 72, 102, 133 und 140 pm.',
    examples: [
      { chemTask: r`$\ce{Na}$ und $\ce{Na+}$`, lines: [{ label: 'Das Ion hat eine Schale weniger und ist kleiner.' }] },
      { chemTask: r`$\ce{S^2-}$, $\ce{Cl-}$, $\ce{K+}$, $\ce{Ca^2+}$ (je 18 Elektronen)`, lines: [{ label: 'Radien in pm', latex: r`184 > 181 > 138 > 100` }] },
    ],
    errors: ['chem-tr-ion-reversed', 'chem-tr-ion-same', 'chem-mis-tr-cation-larger', 'chem-mis-tr-anion-smaller', 'chem-mis-tr-ion-protons'],
  },
]
