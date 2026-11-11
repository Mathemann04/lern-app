import type { Card } from '../cards.ts'

// Lernkarten des Ordners „Moleküle“ (Chemie 1), in eigenen Worten. Zahlen, Typen und Gestalten der Beispiele prüft
// ein Test gegen die Engine (generators/molekuele.test.ts); die Bilder zeichnet die App aus den Moleküldaten.

export const MOLEKUELE_CARDS: readonly Card[] = [
  {
    id: 'mol-paarbindung',
    topic: 'chem-molekuele',
    title: 'Elektronenpaarbindung',
    level: 1,
    rules: [],
    formulas: [String.raw`\ce{H + H -> H-H}`],
    memo: 'Nichtmetalle geben ungern Elektronen ab. Stattdessen teilen sich zwei Atome ein Elektronenpaar, das zu beiden gehört. So erreichen beide eine Edelgaskonfiguration: meist acht Elektronen um sich (Oktett), Wasserstoff zwei.',
    note: 'Andere Namen: Atombindung oder kovalente Bindung. Ein Atom bildet so viele Bindungen, wie ihm Elektronen bis zum Oktett fehlen: H und die Halogene eine, O zwei, N drei, C vier.',
    when: 'Wenn sich Nichtmetalle miteinander verbinden.',
    examples: [
      {
        chemTask: 'Zwei Chloratome bilden ein Chlormolekül.',
        lines: [
          { label: 'Jedes Chloratom hat sieben Valenzelektronen, ihm fehlt eines.' },
          { label: 'Ein gemeinsames Paar, das für beide zählt', latex: String.raw`\ce{Cl-Cl}` },
        ],
      },
      {
        chemTask: 'Sauerstoff bindet zwei Wasserstoffatome.',
        lines: [
          { label: 'Sauerstoff fehlen zwei Elektronen: zwei Bindungen.' },
          { label: 'Wasser', latex: String.raw`\ce{H-O-H}` },
        ],
      },
    ],
    errors: ['chem-mis-mo-bond-transfer', 'chem-mis-mo-metal-partners', 'chem-mis-mo-octet-hydrogen', 'chem-mis-mo-shared-once', 'chem-mis-mo-bonds-valence', 'chem-mis-mo-octet-molecule'],
  },
  {
    id: 'mol-lewis',
    topic: 'chem-molekuele',
    title: 'Lewis-Formel in vier Schritten',
    level: 1,
    rules: [],
    formulas: [String.raw`\text{Paare} = \frac{\text{Valenzelektronen aller Atome}}{2}`],
    memo: '1. Valenzelektronen aller Atome zusammenzählen. 2. Durch zwei teilen: So viele Paare sind zu verteilen. 3. Atome mit Einfachbindungen verbinden, das Zentralatom in die Mitte. 4. Die übrigen Paare als freie Paare so verteilen, dass jedes Atom ein Oktett hat, Wasserstoff zwei Elektronen.',
    note: 'Bindende Paare sind Striche zwischen den Atomen, freie Paare Striche am Atom. Probe: Jedes Atom hat vier Paare um sich (Wasserstoff eines), und alle Paare zusammen ergeben die Zahl aus Schritt 2.',
    when: 'Wenn die Lewis-Formel (Valenzstrichformel) eines Moleküls gefragt ist.',
    examples: [
      {
        chemTask: String.raw`$\ce{NH3}$ (Ammoniak)`,
        lines: [
          { label: 'Valenzelektronen', latex: String.raw`5 + 3 \cdot 1 = 8` },
          { label: 'Paare', latex: String.raw`8 : 2 = 4` },
          { label: 'Drei Bindungen zu den H-Atomen, das vierte Paar bleibt frei am N.' },
        ],
      },
      {
        chemTask: String.raw`$\ce{PCl3}$ (Phosphortrichlorid)`,
        lines: [
          { label: 'Valenzelektronen', latex: String.raw`5 + 3 \cdot 7 = 26` },
          { label: 'Paare', latex: String.raw`26 : 2 = 13` },
          { label: 'Drei bindende Paare; je drei freie Paare an jedem Cl und ein freies Paar am P: zusammen 10 freie.' },
        ],
      },
    ],
    errors: [
      'chem-lewis-index-ignored',
      'chem-lewis-all-electrons',
      'chem-lewis-octet-count',
      'chem-lewis-pairs-not-halved',
      'chem-lewis-bonds-only',
      'chem-lewis-free-central-only',
      'chem-lewis-pairs-missing',
      'chem-lewis-terminal-pairs',
      'chem-lewis-octet-exceeded',
      'chem-lewis-hydrogen',
      'chem-mis-mo-lewis-all',
      'chem-mis-mo-lone-forgotten',
      'chem-mis-mo-pair-types',
      'chem-mis-mo-stroke-electron',
    ],
    figures: ['lewis:NH3'],
  },
  {
    id: 'mol-mehrfach',
    topic: 'chem-molekuele',
    title: 'Mehrfachbindungen',
    level: 2,
    rules: [],
    formulas: [String.raw`\ce{O=C=O}`, String.raw`\ce{N#N}`],
    memo: 'Reichen die Elektronen nicht, damit mit Einfachbindungen jedes Atom ein Oktett hat, teilen sich zwei Atome ein zweites oder drittes Paar. Eine Doppelbindung sind zwei gemeinsame Paare, eine Dreifachbindung drei.',
    note: 'Wasserstoff und die Halogene bilden nur Einfachbindungen. Doppelbindungen findet man oft bei C, N, O und S.',
    examples: [
      {
        chemTask: String.raw`$\ce{CO2}$ (Kohlenstoffdioxid)`,
        lines: [
          { label: 'Paare', latex: String.raw`(4 + 2 \cdot 6) : 2 = 8` },
          { label: 'Zwei Doppelbindungen: vier bindende Paare, dazu zwei freie an jedem O.' },
        ],
      },
      {
        chemTask: String.raw`$\ce{HCN}$ (Blausäure)`,
        lines: [
          { label: 'Paare', latex: String.raw`(1 + 4 + 5) : 2 = 5` },
          { label: 'Eine Einfach- und eine Dreifachbindung: vier bindende Paare, ein freies am N.' },
        ],
      },
    ],
    errors: ['chem-lewis-multiple-as-one', 'chem-lewis-multiple-missing', 'chem-mis-mo-double-one-pair', 'chem-mis-mo-hydrogen-double', 'chem-mis-mo-electron-count'],
    figures: ['lewis:CO2', 'lewis:HCN'],
  },
  {
    id: 'mol-gestalt',
    topic: 'chem-molekuele',
    title: 'Gestalt der Moleküle (VSEPR-Modell)',
    level: 1,
    rules: [],
    formulas: [String.raw`\mathrm{AX_nE_m}`],
    memo: 'Alle Elektronenpaare um das Zentralatom stoßen sich ab und gehen im Raum so weit wie möglich auseinander. Man zählt die Bindungspartner (X) und die freien Paare am Zentralatom (E); eine Mehrfachbindung zählt wie eine Bindung. Die Gestalt beschreibt nur, wo die Atome sitzen.',
    note: 'VSEPR heißt: Abstoßung der Valenzelektronenpaare. A ist das Zentralatom. Die Lewis-Formel ist flach gezeichnet; ihre Winkel zeigen nicht den Raum.',
    when: 'Wenn nach dem räumlichen Bau eines Moleküls gefragt ist.',
    examples: [
      {
        chemTask: 'Gestalten nach dem Typ',
        lines: [
          { label: 'linear', latex: String.raw`\mathrm{AX_2}\text{, z. B. } \ce{CO2}` },
          { label: 'trigonal-planar', latex: String.raw`\mathrm{AX_3}\text{, z. B. } \ce{BF3}` },
          { label: 'tetraedrisch', latex: String.raw`\mathrm{AX_4}\text{, z. B. } \ce{CH4}` },
          { label: 'trigonal-pyramidal', latex: String.raw`\mathrm{AX_3E}\text{, z. B. } \ce{NH3}` },
          { label: 'gewinkelt', latex: String.raw`\mathrm{AX_2E_2}\text{, z. B. } \ce{H2O}\text{; } \mathrm{AX_2E}\text{, z. B. } \ce{SO2}` },
        ],
      },
      {
        chemTask: String.raw`$\ce{NH3}$ (Ammoniak)`,
        lines: [
          { label: 'Drei Partner, ein freies Paar am N', latex: String.raw`\mathrm{AX_3E}` },
          { label: 'Vier Paare liegen tetraedrisch; ohne das freie Paar bleibt eine Pyramide: trigonal-pyramidal.' },
        ],
      },
    ],
    errors: [
      'chem-vsepr-double-counted',
      'chem-vsepr-pairs-as-partners',
      'chem-vsepr-all-atoms',
      'chem-vsepr-lone-pairs-forgotten',
      'chem-vsepr-pairs-not-halved',
      'chem-vsepr-valence-as-pairs',
      'chem-vsepr-all-lone-pairs',
      'chem-vsepr-extra-pair',
      'chem-vsepr-flat',
      'chem-mis-mo-shape-drawing',
      'chem-mis-mo-shape-formula',
      'chem-mis-mo-multiple-domains',
      'chem-mis-mo-pairs-attract',
    ],
    figures: ['gestalt:CH4', 'gestalt:NH3', 'gestalt:H2O'],
  },
  {
    id: 'mol-freie-paare',
    topic: 'chem-molekuele',
    title: 'Freie Paare brauchen Platz',
    level: 2,
    rules: [],
    formulas: [String.raw`\ce{CH4}\ 109{,}5^\circ,\quad \ce{NH3},\ \ce{H2O} < 109{,}5^\circ`],
    memo: 'Ein freies Paar gehört nur dem Zentralatom und sitzt dicht an ihm. Es braucht mehr Platz als ein bindendes Paar und drückt die Bindungen etwas zusammen: Die Bindungswinkel werden kleiner als im idealen Körper.',
    note: 'Gemessen: etwa 107° bei Ammoniak und 104,5° bei Wasser. Die Anordnung aller Paare (hier tetraedrisch) ist nicht die Gestalt des Moleküls.',
    examples: [
      {
        chemTask: String.raw`$\ce{H2O}$ (Wasser)`,
        lines: [
          { label: 'Typ', latex: String.raw`\mathrm{AX_2E_2}` },
          { label: 'Paare tetraedrisch angeordnet, Gestalt gewinkelt, Winkel kleiner als 109,5°.' },
        ],
      },
      {
        chemTask: String.raw`$\ce{BF3}$ und $\ce{NH3}$`,
        lines: [
          { label: 'Bortrifluorid ohne freies Paar: trigonal-planar mit 120°.' },
          { label: 'Ammoniak mit freiem Paar: trigonal-pyramidal, Winkel kleiner als 109,5°.' },
        ],
      },
    ],
    errors: ['chem-vsepr-arrangement', 'chem-vsepr-angle-ideal', 'chem-mis-mo-shape-arrangement', 'chem-mis-mo-lone-small'],
    figures: ['gestalt:NH3'],
  },
  {
    id: 'mol-en',
    topic: 'chem-molekuele',
    title: 'Elektronegativität und Bindungsart',
    level: 2,
    rules: [],
    formulas: [String.raw`\Delta \mathrm{EN} = \mathrm{EN}_{\text{größer}} - \mathrm{EN}_{\text{kleiner}}`],
    memo: String.raw`Die Elektronegativität (EN) misst, wie stark ein Atom das bindende Paar zu sich zieht. Sie steigt im Periodensystem nach rechts und nach oben; Fluor hat den höchsten Wert. Der Unterschied $\Delta \mathrm{EN}$ der beiden Partner entscheidet über die Bindungsart.`,
    note: String.raw`Richtwerte: $\Delta \mathrm{EN}$ unter 0,5 (nahezu) unpolare Atombindung, 0,5 bis 1,8 polare Atombindung, über 1,8 Ionenbindung. Die Grenzen sind fließend. Die App rechnet mit Pauling-Werten (H 2,20; C 2,55; N 3,04; O 3,44; F 3,98; Cl 3,16); ältere Tabellen runden (C 2,5; O 3,5).`,
    examples: [
      {
        chemTask: String.raw`Bindung $\ce{O-H}$`,
        lines: [
          { label: 'Unterschied', latex: String.raw`\Delta \mathrm{EN} = 3{,}44 - 2{,}20 = 1{,}24` },
          { label: 'Zwischen 0,5 und 1,8: polare Atombindung.' },
        ],
      },
      {
        chemTask: String.raw`Bindung $\ce{C-H}$`,
        lines: [
          { label: 'Unterschied', latex: String.raw`\Delta \mathrm{EN} = 2{,}55 - 2{,}20 = 0{,}35` },
          { label: 'Unter 0,5: (nahezu) unpolare Atombindung.' },
        ],
      },
    ],
    errors: ['chem-en-added', 'chem-en-index', 'chem-en-bond-type', 'chem-dipole-unpolar-claimed', 'chem-mis-mo-en-meaning', 'chem-mis-mo-en-trend', 'chem-mis-mo-same-atoms-polar', 'chem-mis-mo-en-boundaries'],
  },
  {
    id: 'mol-teilladung',
    topic: 'chem-molekuele',
    title: 'Teilladungen',
    level: 2,
    rules: [],
    formulas: [String.raw`\overset{\delta+}{\ce{H}}-\overset{\delta-}{\ce{Cl}}`],
    memo: String.raw`In einer polaren Bindung zieht das elektronegativere Atom das bindende Paar zu sich. Es bekommt eine negative Teilladung $\delta-$, der Partner eine positive Teilladung $\delta+$.`,
    note: 'Teilladungen sind kleiner als eine ganze Ladung: Das Paar wird nur verschoben, nicht übergeben. Ganze Ladungen haben erst Ionen.',
    examples: [
      {
        chemTask: String.raw`Bindung $\ce{H-Cl}$`,
        lines: [{ label: 'Chlor ist elektronegativer', latex: String.raw`\overset{\delta+}{\ce{H}}-\overset{\delta-}{\ce{Cl}}` }],
      },
      {
        chemTask: String.raw`Bindung $\ce{C=O}$`,
        lines: [{ label: 'Sauerstoff ist elektronegativer', latex: String.raw`\overset{\delta+}{\ce{C}}=\overset{\delta-}{\ce{O}}` }],
      },
    ],
    errors: ['chem-en-partial-swapped', 'chem-mis-mo-partial-swapped', 'chem-mis-mo-partial-full'],
  },
  {
    id: 'mol-dipol',
    topic: 'chem-molekuele',
    title: 'Polare Moleküle (Dipole)',
    level: 2,
    rules: [],
    formulas: [],
    memo: 'Ein Molekül ist polar (ein Dipol), wenn es polare Bindungen hat und die Schwerpunkte der positiven und negativen Teilladungen wegen der Gestalt nicht zusammenfallen. Die Gestalt entscheidet: Liegen gleiche polare Bindungen symmetrisch, heben sie sich auf.',
    note: String.raw`Ein Dipol ist insgesamt neutral. Wo ein Pfeil das Dipolmoment zeigt, geht er in der Vorlesung wie in der Physik von $\delta-$ nach $\delta+$; manche Bücher zeichnen ihn andersherum. Die App fragt nicht nach der Pfeilrichtung.`,
    examples: [
      {
        chemTask: String.raw`$\ce{CO2}$ und $\ce{H2O}$`,
        lines: [
          { label: 'Kohlenstoffdioxid ist linear: Die beiden polaren Bindungen heben sich auf, das Molekül ist unpolar.' },
          { label: 'Wasser ist gewinkelt: Die Wirkungen heben sich nicht auf, das Molekül ist polar.' },
        ],
      },
      {
        chemTask: String.raw`$\ce{CCl4}$ und $\ce{CH3Cl}$`,
        lines: [
          { label: 'Tetrachlormethan: vier gleiche polare Bindungen, tetraedrisch und symmetrisch: unpolar.' },
          { label: 'Chlormethan: eine andere Bindung im Tetraeder: polar.' },
        ],
      },
    ],
    errors: ['chem-dipole-polar-bond', 'chem-dipole-unpolar-bonds', 'chem-dipole-symmetry-assumed', 'chem-mis-mo-polar-bond-molecule', 'chem-mis-mo-dipole-charged', 'chem-mis-mo-symmetry-assumed'],
    figures: ['gestalt:CO2', 'gestalt:H2O'],
  },
  {
    id: 'mol-namen',
    topic: 'chem-molekuele',
    title: 'Namen von Molekülverbindungen',
    level: 2,
    rules: [],
    formulas: [],
    memo: 'Vorn steht das weniger elektronegative Element mit seinem deutschen Namen, dahinter das andere mit der Endung -id. Vorsilben zählen die Atome: mono 1, di 2, tri 3, tetra 4, penta 5, hexa 6, hepta 7, deca 10. Am ersten Element entfällt „mono“.',
    note: 'Vor „oxid“ wird aus „mono“ kurz „mon“: Kohlenstoffmonoxid. Bekannte Stoffe haben oft eigene Namen: Wasser, Ammoniak, Methan.',
    examples: [
      {
        chemTask: String.raw`$\ce{N2O}$`,
        lines: [{ label: 'zwei N, ein O: Distickstoffmonoxid' }],
      },
      {
        chemTask: String.raw`$\ce{PCl5}$`,
        lines: [{ label: 'ein P, fünf Cl: Phosphorpentachlorid' }],
      },
    ],
    errors: ['chem-molname-no-prefix', 'chem-molname-swapped', 'chem-molname-first-prefix', 'chem-mis-mo-name-no-prefix', 'chem-mis-mo-name-order', 'chem-mis-mo-name-mono-first', 'chem-mis-mo-name-prefix-swapped', 'chem-mis-mo-name-first-dropped'],
  },
]
