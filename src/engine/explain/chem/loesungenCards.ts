import type { Card } from '../cards.ts'

// Lernkarten des Ordners „Gase und Lösungen“ (Chemie 1), in eigenen Worten. Die Zahlen der Beispiele
// rechnet ein Test nach (generators/loesungen.test.ts).

export const LOESUNGEN_CARDS: readonly Card[] = [
  {
    id: 'loesungen-konzentration',
    topic: 'chem-loesungen',
    title: 'Stoffmengenkonzentration',
    level: 1,
    rules: [],
    formulas: [String.raw`c = \frac{n}{V}`, String.raw`n = c \cdot V`],
    memo: 'Die Stoffmengenkonzentration (im Skript: molare Konzentration) sagt, wie viel Mol eines gelösten Stoffs in einem Liter Lösung stecken. Sie ist in der Chemie die wichtigste Konzentrationsangabe, weil bei Reaktionen die Zahl der Teilchen zählt.',
    note: String.raw`Einheit: $\mathrm{mol/L}$; eine Lösung mit $1\,\mathrm{mol/L}$ heißt auch „1-molar“. Das Volumen ist das der fertigen Lösung, nicht das des Wassers. Volumen in Millilitern vorher in Liter umrechnen: $1\,\mathrm{mL} = 0{,}001\,\mathrm{L}$.`,
    when: 'Wenn Stoffmenge und Volumen einer Lösung zusammenhängen.',
    examples: [
      {
        chemTask: String.raw`$0{,}1\,\mathrm{mol}$ Kochsalz sind in $200\,\mathrm{mL}$ Lösung gelöst. Wie groß ist die Konzentration?`,
        lines: [
          { label: 'Volumen in Liter', latex: String.raw`V = 200\,\mathrm{mL} = 0{,}2\,\mathrm{L}` },
          { label: 'Ergebnis', latex: String.raw`c = \frac{0{,}1\,\mathrm{mol}}{0{,}2\,\mathrm{L}} = 0{,}5\,\mathrm{mol/L}` },
        ],
      },
      {
        chemTask: String.raw`Wie viel Mol stecken in $2\,\mathrm{L}$ einer Lösung mit $c = 0{,}25\,\mathrm{mol/L}$?`,
        lines: [{ label: 'Ergebnis', latex: String.raw`n = c \cdot V = 0{,}25\,\mathrm{mol/L} \cdot 2\,\mathrm{L} = 0{,}5\,\mathrm{mol}` }],
      },
    ],
    errors: ['chem-ml-not-l', 'chem-c-inverted', 'chem-mis-lo-v-not-solution', 'chem-mis-lo-c-mixup', 'chem-mis-lo-c-portion', 'chem-mis-lo-c-times', 'chem-mis-lo-c-inverted', 'chem-mis-lo-milli', 'chem-mis-lo-share-is-amount', 'chem-mis-lo-dilution-n', 'chem-mis-lo-dilution-direct', 'chem-mis-lo-water-no-effect', 'chem-mis-lo-most-important'],
  },
  {
    id: 'loesungen-ansetzen',
    topic: 'chem-loesungen',
    title: 'Lösung ansetzen',
    level: 2,
    rules: [],
    formulas: [String.raw`m = c \cdot V \cdot M`],
    memo: 'Um eine Lösung mit bestimmter Konzentration herzustellen, rechnest du erst die nötige Stoffmenge aus, dann die Masse, die du abwiegst. Danach wird der Stoff in wenig Wasser gelöst und im Maßkolben (auch Messkolben genannt) bis zur Marke aufgefüllt.',
    note: 'Zwei Schritte: n = c · V, dann m = n · M. Die molare Masse ist die der ganzen Formel, mit allen Atomen und gegebenenfalls mit Kristallwasser. Bei einem Hydrat gilt die Konzentration für das wasserfreie Salz; abgewogen wird das Hydrat, und jede seiner Formeleinheiten bringt eine Formeleinheit Salz mit. Abgewogen werden feste Stoffe; Flüssigkeiten wie Säuren oder Alkohole misst man ab.',
    when: 'Wenn eine Lösung bestimmter Konzentration angesetzt werden soll.',
    examples: [
      {
        chemTask: String.raw`$250\,\mathrm{mL}$ Kochsalzlösung mit $c = 0{,}2\,\mathrm{mol/L}$, $M(\ce{NaCl}) = 58{,}5\,\mathrm{g/mol}$`,
        lines: [
          { label: 'Stoffmenge', latex: String.raw`n = 0{,}2\,\mathrm{mol/L} \cdot 0{,}25\,\mathrm{L} = 0{,}05\,\mathrm{mol}` },
          { label: 'Ergebnis', latex: String.raw`m = 0{,}05\,\mathrm{mol} \cdot 58{,}5\,\mathrm{g/mol} \approx 2{,}93\,\mathrm{g}` },
        ],
      },
      {
        chemTask: String.raw`$100\,\mathrm{mL}$ Natronlauge mit $c = 1\,\mathrm{mol/L}$, $M(\ce{NaOH}) = 40\,\mathrm{g/mol}$`,
        lines: [
          { label: 'Stoffmenge', latex: String.raw`n = 1\,\mathrm{mol/L} \cdot 0{,}1\,\mathrm{L} = 0{,}1\,\mathrm{mol}` },
          { label: 'Ergebnis', latex: String.raw`m = 0{,}1\,\mathrm{mol} \cdot 40\,\mathrm{g/mol} = 4\,\mathrm{g}` },
        ],
      },
    ],
    errors: ['chem-molar-incomplete', 'chem-ml-not-l', 'chem-mis-lo-mol-as-gram', 'chem-mis-lo-m-incomplete', 'chem-mis-lo-reference'],
  },
  {
    id: 'loesungen-massenanteil',
    topic: 'chem-loesungen',
    title: 'Massenanteil',
    level: 1,
    rules: [],
    formulas: [String.raw`w = \frac{m(\text{Stoff})}{m(\text{Lösung})} \cdot 100\,\%`],
    memo: 'Der Massenanteil sagt, wie viel Prozent der Masse einer Lösung auf den gelösten Stoff entfallen. Im Nenner steht die Masse der ganzen Lösung, also gelöster Stoff und Wasser zusammen.',
    note: 'Andere Schreibweisen: Massenprozent, % (m/m), w/w-%.',
    when: 'Wenn eine Zusammensetzung in Prozent der Masse angegeben oder gesucht ist.',
    examples: [
      {
        chemTask: String.raw`$10\,\mathrm{g}$ Salz werden in $90\,\mathrm{g}$ Wasser gelöst.`,
        lines: [
          { label: 'Masse der Lösung', latex: String.raw`10\,\mathrm{g} + 90\,\mathrm{g} = 100\,\mathrm{g}` },
          { label: 'Ergebnis', latex: String.raw`w = \frac{10\,\mathrm{g}}{100\,\mathrm{g}} \cdot 100\,\% = 10\,\%` },
        ],
      },
      {
        chemTask: String.raw`$4\,\mathrm{g}$ Zucker in $196\,\mathrm{g}$ Wasser`,
        lines: [{ label: 'Ergebnis', latex: String.raw`w = \frac{4\,\mathrm{g}}{200\,\mathrm{g}} \cdot 100\,\% = 2\,\%` }],
      },
    ],
    errors: ['chem-fraction-solvent', 'chem-percent-not-times', 'chem-vol-percent', 'chem-mis-lo-share-solvent', 'chem-mis-lo-percent-factor', 'chem-mis-lo-w-volume'],
  },
  {
    id: 'loesungen-massenkonzentration',
    topic: 'chem-loesungen',
    title: 'Massenkonzentration und Dichte',
    level: 2,
    rules: [],
    formulas: [String.raw`\beta = \frac{m(\text{Stoff})}{V(\text{Lösung})}`],
    memo: 'Die Massenkonzentration gibt an, wie viel Gramm eines gelösten Stoffs in einem Liter Lösung stecken. Sie sieht aus wie eine Dichte, ist aber etwas anderes: Die Dichte bezieht die Masse der ganzen Lösung auf ihr Volumen.',
    note: String.raw`Einheit $\mathrm{g/L}$. Im Skript steht dafür auch das Zeichen $\rho$; in der App heißt sie $\beta$, damit sie nicht mit der Dichte verwechselt wird. Wasser hat eine Dichte von etwa $1000\,\mathrm{g/L}$, eine Lösung mit $\beta = 20\,\mathrm{g/L}$ enthält aber nur 20 g gelösten Stoff je Liter.`,
    when: 'Wenn eine Masse je Volumen gefragt ist.',
    examples: [
      {
        chemTask: String.raw`$5\,\mathrm{g}$ Salz in $250\,\mathrm{mL}$ Lösung`,
        lines: [{ label: 'Ergebnis', latex: String.raw`\beta = \frac{5\,\mathrm{g}}{0{,}25\,\mathrm{L}} = 20\,\mathrm{g/L}` }],
      },
      {
        chemTask: String.raw`Wie viel Gramm sind in $0{,}5\,\mathrm{L}$ einer Lösung mit $\beta = 9\,\mathrm{g/L}$?`,
        lines: [{ label: 'Ergebnis', latex: String.raw`m = \beta \cdot V = 9\,\mathrm{g/L} \cdot 0{,}5\,\mathrm{L} = 4{,}5\,\mathrm{g}` }],
      },
    ],
    errors: ['chem-mass-conc-inverted', 'chem-ml-not-l', 'chem-mis-lo-beta-density'],
  },
  {
    id: 'loesungen-ppm',
    topic: 'chem-loesungen',
    title: 'ppm, ppb und ppt',
    level: 2,
    rules: [],
    formulas: [String.raw`1\,\mathrm{ppm} = 10^{-6},\ 1\,\mathrm{ppb} = 10^{-9},\ 1\,\mathrm{ppt} = 10^{-12}`],
    memo: 'Für sehr kleine Anteile gibt man an, wie viele Teile auf eine Million (ppm), eine Milliarde (ppb) oder eine Billion (ppt) kommen. Bei Massen heißt 1 ppm: 1 mg je kg, 1 ppb: 1 µg je kg, 1 ppt: 1 ng je kg.',
    note: String.raw`Die englischen Wörter täuschen: „billion“ ist die deutsche Milliarde ($10^{9}$), „trillion“ die deutsche Billion ($10^{12}$).`,
    when: 'Bei Spuren, etwa Schadstoffen im Wasser oder Boden.',
    examples: [
      {
        chemTask: String.raw`$0{,}02\,\mathrm{mg}$ Blei in $4\,\mathrm{kg}$ Wasser: wie viel ppb?`,
        lines: [
          { label: 'je Kilogramm', latex: String.raw`\frac{0{,}02\,\mathrm{mg}}{4\,\mathrm{kg}} = 0{,}005\,\mathrm{mg/kg} = 5\,\mathrm{\mu g/kg}` },
          { label: 'Ergebnis', latex: String.raw`5\,\mathrm{ppb}` },
        ],
      },
      {
        chemTask: String.raw`Wie viel Milligramm sind $50\,\mathrm{ppm}$ von $2\,\mathrm{kg}$?`,
        lines: [{ label: 'Ergebnis', latex: String.raw`m = 50 \cdot 10^{-6} \cdot 2000\,\mathrm{g} = 0{,}1\,\mathrm{g} = 100\,\mathrm{mg}` }],
      },
    ],
    errors: ['chem-ppb', 'chem-mis-lo-ppm-factor', 'chem-mis-lo-billion'],
  },
  {
    id: 'loesungen-volumenanteil',
    topic: 'chem-loesungen',
    title: 'Volumenanteil',
    level: 2,
    rules: [],
    formulas: [String.raw`\varphi = \frac{V(\text{Stoff})}{V(\text{gesamt})} \cdot 100\,\%`],
    memo: 'Der Volumenanteil in Vol-% sagt, wie viel Prozent des Volumens einer Mischung auf einen Bestandteil entfallen, etwa beim Alkoholgehalt von Getränken.',
    note: 'Beim Mischen von Flüssigkeiten addieren sich die Volumina oft nicht genau: Ethanol und Wasser zusammen nehmen etwas weniger Platz ein als beide einzeln (Volumenkontraktion). Bei Vol-% wie beim Alkoholgehalt von Getränken bezieht man den Anteil deshalb auf das Volumen der fertigen Mischung.',
    when: 'Wenn ein Anteil in Vol-% angegeben ist.',
    examples: [
      {
        chemTask: String.raw`Wie viel Ethanol enthalten $0{,}7\,\mathrm{L}$ Wein mit $12\,\mathrm{Vol}\text{-}\%$?`,
        lines: [{ label: 'Ergebnis', latex: String.raw`V = \frac{12}{100} \cdot 0{,}7\,\mathrm{L} = 0{,}084\,\mathrm{L} = 84\,\mathrm{mL}` }],
      },
      {
        chemTask: String.raw`$0{,}5\,\mathrm{L}$ einer Mischung mit $40\,\mathrm{Vol}\text{-}\%$ Ethanol`,
        lines: [{ label: 'Ergebnis', latex: String.raw`V = \frac{40}{100} \cdot 0{,}5\,\mathrm{L} = 0{,}2\,\mathrm{L}` }],
      },
    ],
    errors: ['chem-vol-percent', 'chem-percent-not-times', 'chem-mis-lo-vol-mass', 'chem-mis-lo-volume-conserved', 'chem-mis-lo-contraction-loss'],
  },
  {
    id: 'loesungen-molvolumen',
    topic: 'chem-loesungen',
    title: 'Molares Volumen',
    level: 1,
    rules: [],
    formulas: [String.raw`V = n \cdot V_m`, String.raw`V_m = 22{,}4\,\mathrm{L/mol}\ \text{bei}\ 0\,^{\circ}\mathrm{C},\ 1013\,\mathrm{hPa}`],
    memo: 'Ein Mol eines idealen Gases nimmt bei gleichem Druck und gleicher Temperatur immer dasselbe Volumen ein, egal um welches Gas es sich handelt. Bei 0 °C und 1013 hPa (Normbedingungen, im Skript Normalbedingungen) sind das 22,4 Liter.',
    note: String.raw`Der Wert gilt nur für Gase und nur bei diesen Bedingungen; bei $25\,^{\circ}\mathrm{C}$ und $1013\,\mathrm{hPa}$ sind es etwa $24{,}5\,\mathrm{L/mol}$. Für Flüssigkeiten und Feststoffe gilt er nicht.`,
    when: 'Wenn Stoffmenge und Volumen eines Gases bei Normbedingungen zusammenhängen.',
    examples: [
      {
        chemTask: String.raw`Welches Volumen nehmen $0{,}5\,\mathrm{mol}$ Stickstoff bei Normbedingungen ein?`,
        lines: [{ label: 'Ergebnis', latex: String.raw`V = 0{,}5\,\mathrm{mol} \cdot 22{,}4\,\mathrm{L/mol} = 11{,}2\,\mathrm{L}` }],
      },
      {
        chemTask: String.raw`Wie viel Mol sind $44{,}8\,\mathrm{L}$ Kohlenstoffdioxid bei Normbedingungen?`,
        lines: [{ label: 'Ergebnis', latex: String.raw`n = \frac{44{,}8\,\mathrm{L}}{22{,}4\,\mathrm{L/mol}} = 2\,\mathrm{mol}` }],
      },
    ],
    errors: ['chem-vm-conditions', 'chem-vm-inverted', 'chem-mis-lo-vm-everything', 'chem-mis-lo-vm-any-condition', 'chem-mis-lo-vm-gas-specific', 'chem-mis-lo-vm-inverted', 'chem-mis-lo-atoms-count', 'chem-mis-lo-avogadro-mass'],
  },
  {
    id: 'loesungen-gasgesetz',
    topic: 'chem-loesungen',
    title: 'Ideales Gasgesetz',
    level: 2,
    rules: [],
    formulas: [String.raw`p \cdot V = n \cdot R \cdot T`, String.raw`R = 8{,}314\,\mathrm{J/(mol \cdot K)}`],
    memo: String.raw`Für ideale Gase hängen Druck, Volumen, Stoffmenge und Temperatur über eine Gleichung zusammen. Gerechnet wird in SI-Einheiten: Druck in Pa, Volumen in $\mathrm{m^3}$, Temperatur in Kelvin.`,
    note: String.raw`Umrechnen: $1\,\mathrm{hPa} = 100\,\mathrm{Pa}$, $1\,\mathrm{bar} = 10^{5}\,\mathrm{Pa}$, $1\,\mathrm{m^3} = 1000\,\mathrm{L}$, $T$ in Kelvin $= \vartheta$ in $^{\circ}\mathrm{C} + 273{,}15$. Ideal heißt: Die Gasteilchen ziehen sich nicht an, und ihr eigenes Volumen ist vernachlässigbar.`,
    when: 'Wenn ein Gas nicht bei Normbedingungen vorliegt oder Druck oder Temperatur gesucht sind.',
    examples: [
      {
        chemTask: String.raw`Volumen von $1\,\mathrm{mol}$ Gas bei $25\,^{\circ}\mathrm{C}$ und $1013\,\mathrm{hPa}$`,
        lines: [
          { label: 'Einheiten', latex: String.raw`T = 298{,}15\,\mathrm{K},\ p = 101\,300\,\mathrm{Pa}` },
          { label: 'Ergebnis', latex: String.raw`V = \frac{n R T}{p} \approx 0{,}0245\,\mathrm{m^3} = 24{,}5\,\mathrm{L}` },
        ],
      },
      {
        chemTask: String.raw`Volumen von $2\,\mathrm{mol}$ Gas bei $100\,^{\circ}\mathrm{C}$ und $2\,\mathrm{bar}$`,
        lines: [
          { label: 'Einheiten', latex: String.raw`T = 373{,}15\,\mathrm{K},\ p = 200\,000\,\mathrm{Pa}` },
          { label: 'Ergebnis', latex: String.raw`V = \frac{n R T}{p} \approx 0{,}031\,\mathrm{m^3} = 31\,\mathrm{L}` },
        ],
      },
    ],
    errors: ['chem-celsius', 'chem-hpa', 'chem-mis-lo-ideal-model', 'chem-mis-lo-celsius', 'chem-mis-lo-si-units', 'chem-mis-lo-gas-direction', 'chem-mis-lo-gas-fixed', 'chem-mis-lo-heat-more-particles'],
  },
]
