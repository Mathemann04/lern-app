import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Moleküle“: Name und falsche Aussage (klein, für Fehlerstatistik und Lernkarten). Die
// Erklärungen „Warum ist das falsch?“ stehen in molekueleWhy.ts und laden erst mit den Fragen. Nur als falsche
// Antworten; Regeln in docs/CHEMIE.md §8.

export const MOLEKUELE_MISCONCEPTIONS: readonly MisconceptionName[] = [
  // Elektronenpaarbindung
  {
    id: 'chem-mis-mo-bond-transfer',
    name: "Atombindung mit Ionenbindung verwechselt",
    wrongText: "In einer Atombindung gibt ein Atom seine Elektronen ganz an das andere ab.",
  },
  {
    id: 'chem-mis-mo-metal-partners',
    name: "Falsche Partner für die Atombindung",
    wrongText: "Atombindungen entstehen typischerweise zwischen einem Metall und einem Nichtmetall.",
  },
  {
    id: 'chem-mis-mo-octet-hydrogen',
    name: "Oktett auch für Wasserstoff",
    wrongText: "Auch Wasserstoff braucht in einem Molekül acht Elektronen um sich.",
  },
  {
    id: 'chem-mis-mo-shared-once',
    name: "Bindende Paare nur für ein Atom gezählt",
    wrongText: "Ein bindendes Elektronenpaar zählt beim Oktett nur für eines der beiden Atome.",
  },
  {
    id: 'chem-mis-mo-bonds-valence',
    name: "Zahl der Bindungen gleich Valenzelektronen",
    wrongText: "Ein Atom bildet so viele Bindungen, wie es Valenzelektronen hat.",
  },
  {
    id: 'chem-mis-mo-lewis-all',
    name: "Alle Elektronen in der Lewis-Formel",
    wrongText: "In einer Lewis-Formel stehen alle Elektronen eines Atoms, auch die inneren.",
  },
  // Mehrfachbindungen
  {
    id: 'chem-mis-mo-double-one-pair',
    name: "Doppelbindung als ein Paar",
    wrongText: "Eine Doppelbindung besteht aus einem einzigen, besonders starken Elektronenpaar.",
  },
  {
    id: 'chem-mis-mo-hydrogen-double',
    name: "Wasserstoff mit Mehrfachbindung",
    wrongText: "Wasserstoff kann Doppelbindungen bilden.",
  },
  // Gestalt
  {
    id: 'chem-mis-mo-shape-drawing',
    name: "Gestalt aus der flachen Formel abgelesen",
    wrongText: "Die Lewis-Formel zeigt den räumlichen Bau des Moleküls mit den richtigen Winkeln.",
  },
  {
    id: 'chem-mis-mo-shape-arrangement',
    name: "Gestalt mit Anordnung der Paare verwechselt",
    wrongText: "Die Gestalt eines Moleküls beschreibt die Lage aller Elektronenpaare, auch der freien.",
  },
  {
    id: 'chem-mis-mo-shape-formula',
    name: "Gestalt aus der Formel geraten",
    wrongText: "Moleküle aus drei Atomen sind alle gleich gebaut, entweder alle linear oder alle gewinkelt.",
  },
  {
    id: 'chem-mis-mo-multiple-domains',
    name: "Mehrfachbindung für die Gestalt mehrfach gezählt",
    wrongText: "Für die Gestalt zählt eine Doppelbindung wie zwei Bindungen.",
  },
  {
    id: 'chem-mis-mo-lone-small',
    name: "Freie Paare für klein gehalten",
    wrongText: "Freie Elektronenpaare brauchen weniger Platz als bindende und ändern die Gestalt nicht.",
  },
  {
    id: 'chem-mis-mo-pairs-attract',
    name: "Elektronenpaare ziehen sich an",
    wrongText: "Die Elektronenpaare um ein Zentralatom ziehen sich an und rücken möglichst eng zusammen.",
  },
  // Elektronegativität und Polarität
  {
    id: 'chem-mis-mo-en-meaning',
    name: "Elektronegativität falsch verstanden",
    wrongText: "Die Elektronegativität gibt an, wie viele Elektronen ein Atom abgeben kann.",
  },
  {
    id: 'chem-mis-mo-en-trend',
    name: "Trend der Elektronegativität umgedreht",
    wrongText: "Im Periodensystem nimmt die Elektronegativität nach rechts ab und nach unten zu.",
  },
  {
    id: 'chem-mis-mo-partial-swapped',
    name: "Teilladungen vertauscht",
    wrongText: "Das weniger elektronegative Atom trägt die negative Teilladung.",
  },
  {
    id: 'chem-mis-mo-partial-full',
    name: "Teilladung als ganze Ladung",
    wrongText: "Teilladungen in polaren Bindungen sind ganze Ladungen wie bei Ionen.",
  },
  {
    id: 'chem-mis-mo-same-atoms-polar',
    name: "Bindung gleicher Atome für polar gehalten",
    wrongText: "Auch eine Bindung zwischen zwei gleichen Atomen ist polar.",
  },
  {
    id: 'chem-mis-mo-polar-bond-molecule',
    name: "Polare Bindung gleich polares Molekül",
    wrongText: "Ein Molekül mit polaren Bindungen ist immer ein Dipol, egal welche Gestalt es hat.",
  },
  {
    id: 'chem-mis-mo-dipole-charged',
    name: "Dipol mit Gesamtladung verwechselt",
    wrongText: "Ein polares Molekül trägt insgesamt eine elektrische Ladung, wie ein Ion.",
  },
  {
    id: 'chem-mis-mo-en-boundaries',
    name: "Grenzen der Bindungsarten verwechselt",
    wrongText: "Schon ein kleiner Unterschied der Elektronegativität macht eine Bindung zur Ionenbindung.",
  },
  // Namen
  {
    id: 'chem-mis-mo-name-no-prefix',
    name: "Namen ohne Vorsilben",
    wrongText: "Bei Molekülverbindungen ergibt sich die Zusammensetzung wie bei Salzen aus den Ladungen; Vorsilben braucht man nicht.",
  },
  {
    id: 'chem-mis-mo-name-order',
    name: "Reihenfolge im Namen vertauscht",
    wrongText: "Im Namen steht das elektronegativere Element vorn.",
  },
  {
    id: 'chem-mis-mo-name-mono-first',
    name: "„mono“ am ersten Element",
    wrongText: "Auch am ersten Element steht immer eine Vorsilbe, bei einem Atom also „mono“.",
  },
  // ergänzt mit den Wissensfragen
  {
    id: 'chem-mis-mo-octet-molecule',
    name: "Oktett für das ganze Molekül",
    wrongText: "Die Oktettregel bedeutet, dass ein Molekül insgesamt acht Elektronen hat.",
  },
  {
    id: 'chem-mis-mo-lone-forgotten',
    name: "Freie Paare weggelassen",
    wrongText: "Elektronen, die keine Bindung bilden, kommen in der Lewis-Formel nicht vor.",
  },
  {
    id: 'chem-mis-mo-lone-whole-molecule',
    name: "Freie Paare des ganzen Moleküls dem Zentralatom zugerechnet",
    wrongText: "Zu den freien Paaren am Zentralatom zählen auch die freien Paare der äußeren Atome.",
  },
  {
    id: 'chem-mis-mo-pair-types',
    name: "Bindende und freie Paare verwechselt",
    wrongText: "Bindende und freie Elektronenpaare sind dasselbe; man kann sie beliebig zusammenzählen oder vertauschen.",
  },
  {
    id: 'chem-mis-mo-stroke-electron',
    name: "Strich als einzelnes Elektron",
    wrongText: "Ein Strich in der Lewis-Formel steht für ein einzelnes Elektron.",
  },
  {
    id: 'chem-mis-mo-electron-count',
    name: "Elektronenzahl nicht geprüft",
    wrongText: "Hauptsache, jedes Atom hat ein Oktett; ob die Zahl der Elektronen stimmt, ist egal.",
  },
  {
    id: 'chem-mis-mo-symmetry-assumed',
    name: "Symmetrie ohne gleiche Partner angenommen",
    wrongText: "Ein lineares oder tetraedrisches Molekül ist immer unpolar, auch wenn die Partner verschieden sind.",
  },
  {
    id: 'chem-mis-mo-name-prefix-swapped',
    name: "Vorsilben vertauscht",
    wrongText: "Die Vorsilbe im Namen gehört zum Element davor, wie der Index in der Formel.",
  },
  {
    id: 'chem-mis-mo-name-first-dropped',
    name: "Keine Vorsilbe am ersten Element",
    wrongText: "Am ersten Element einer Molekülverbindung steht nie eine Vorsilbe.",
  },
  // Ergänzt nach dem Abgleich mit den Skripten (11.11.2026)
  {
    id: 'chem-mis-mo-h-count',
    name: "Zahl der H-Atome nicht aus den Bindungen bestimmt",
    wrongText: "Schwefel bindet wie Stickstoff drei Wasserstoffatome: $\\ce{SH3}$.",
  },
  {
    id: 'chem-mis-mo-element-x2',
    name: "Zweiatomiges Element in der Verbindung",
    wrongText: "Chlor bleibt auch in Verbindungen ein $\\ce{Cl2}$-Molekül; Chlorwasserstoff ist deshalb $\\ce{H2Cl2}$.",
  },
  {
    id: 'chem-mis-mo-field-magnetic',
    name: "Elektrisches mit magnetischem Feld verwechselt",
    wrongText: "Dipolmoleküle richten sich in einem Magnetfeld aus, in einem elektrischen Feld nicht.",
  },
  {
    id: 'chem-mis-mo-dipole-scalar',
    name: "Bindungsdipole ohne Richtung addiert",
    wrongText: "Die Bindungsdipole addiert man als bloße Zahlen; zwei polare Bindungen ergeben immer ein Dipolmoment.",
  },
  {
    id: 'chem-mis-mo-en-unbonded',
    name: "Unterschied der Elektronegativität ohne Bindung",
    wrongText: "Man rechnet $\\Delta \\mathrm{EN}$ auch zwischen Atomen aus, die gar nicht miteinander verbunden sind, etwa in $\\ce{HCN}$ zwischen H und N.",
  },
]
