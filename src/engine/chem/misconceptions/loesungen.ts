import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Gase und Lösungen“: Name und falsche Aussage (klein, für Fehlerstatistik und
// Lernkarten). Die Erklärungen „Warum ist das falsch?“ stehen in loesungenWhy.ts und laden erst mit den
// Fragen. Nur als falsche Antworten; Regeln in docs/CHEMIE.md §8.

export const LOESUNGEN_MISCONCEPTIONS: readonly MisconceptionName[] = [
  // Konzentration und Lösung ansetzen
  {
    id: 'chem-mis-lo-v-not-solution',
    name: "Volumen eines Bestandteils statt der ganzen Lösung",
    wrongText: String.raw`In $c = \frac{n}{V}$ ist $V$ das Volumen des Wassers, in dem man den Stoff löst, nicht das der fertigen Lösung.`,
  },
  {
    id: 'chem-mis-lo-mol-as-gram',
    name: "Mol und Gramm gleichgesetzt",
    wrongText: String.raw`Ein Mol eines Stoffes ist ein Gramm davon: $0{,}5\,\mathrm{mol}$ abwiegen heißt $0{,}5\,\mathrm{g}$ abwiegen.`,
  },
  {
    id: 'chem-mis-lo-c-mixup',
    name: "Konzentrationsangaben verwechselt",
    wrongText: String.raw`Stoffmengenkonzentration, Massenkonzentration und Massenanteil sind nur verschiedene Namen für dieselbe Angabe; gleiche Gramm je Liter heißen auch gleiche Mol je Liter.`,
  },
  {
    id: 'chem-mis-lo-c-portion',
    name: "Konzentration hängt von der Größe der Probe ab",
    wrongText: "Gießt man einen Teil einer Lösung ab, hat dieser Teil eine kleinere Konzentration als die ganze Lösung.",
  },
  {
    id: 'chem-mis-lo-c-times',
    name: "Gehaltsangabe als Produkt",
    wrongText: String.raw`Eine Konzentration erhält man, indem man die Menge des gelösten Stoffs mit dem Volumen malnimmt: $c = n \cdot V$.`,
  },
  {
    id: 'chem-mis-lo-c-inverted',
    name: "Gehaltsangabe falsch herum gebildet",
    wrongText: String.raw`Bei einer Konzentration steht das Volumen im Zähler und die Menge des gelösten Stoffs im Nenner: $c = \frac{V}{n}$.`,
  },
  {
    id: 'chem-mis-lo-milli',
    name: "Vorsilbe Milli übersehen",
    wrongText: String.raw`Milliliter und Millimol darf man wie Liter und Mol in die Formeln einsetzen: $250\,\mathrm{mL}$ zählen als $250\,\mathrm{L}$.`,
  },
  {
    id: 'chem-mis-lo-share-is-amount',
    name: "Gehalt mit Menge verwechselt",
    wrongText: "Eine Konzentration oder ein Anteil sagt dasselbe wie die Menge des gelösten Stoffs: Die Lösung mit der höchsten Konzentration enthält auch am meisten Stoff.",
  },
  {
    id: 'chem-mis-lo-dilution-n',
    name: "Beim Verdünnen ändert sich die Stoffmenge",
    wrongText: "Verdünnt man eine Lösung mit Wasser, wird auch die Stoffmenge des gelösten Stoffs kleiner.",
  },
  {
    id: 'chem-mis-lo-dilution-direct',
    name: "Verdünnen: Konzentration wächst mit dem Volumen",
    wrongText: String.raw`Beim Verdünnen wächst die Konzentration mit dem Volumen: $c_1 \cdot V_2 = c_2 \cdot V_1$.`,
  },
  {
    id: 'chem-mis-lo-water-no-effect',
    name: "Wasser ändert die Konzentration nicht",
    wrongText: "Gibt man zu einer Lösung nur Wasser, bleibt ihre Konzentration gleich, weil kein gelöster Stoff dazukommt.",
  },
  {
    id: 'chem-mis-lo-m-incomplete',
    name: "Molare Masse nicht aus der ganzen Formel",
    wrongText: String.raw`Beim Ansetzen mit einem Hydrat wie $\ce{CuSO4 * 5 H2O}$ zählt nur die molare Masse des Salzes ohne Kristallwasser.`,
  },
  {
    id: 'chem-mis-lo-reference',
    name: "Bezugsmenge nicht beachtet",
    wrongText: "Eine Angabe je Liter, je Kilogramm oder je 100 Gramm gilt gleich für die ganze Portion, egal wie groß sie ist.",
  },
  {
    id: 'chem-mis-lo-most-important',
    name: "Teilchenzahl für unwichtig gehalten",
    wrongText: "In der Chemie zählt vor allem, wie viel Masse oder Volumen eines Stoffes in einer Lösung steckt; die Zahl der Teilchen ist für Reaktionen unwichtig.",
  },
  // Anteile
  {
    id: 'chem-mis-lo-share-solvent',
    name: "Anteil auf das Lösungsmittel bezogen",
    wrongText: "Beim Massen- oder Volumenanteil teilt man durch die Menge des Wassers, nicht durch die der ganzen Lösung.",
  },
  {
    id: 'chem-mis-lo-percent-factor',
    name: "Anteil nicht richtig in Prozent umgerechnet",
    wrongText: String.raw`Ein Anteil als Dezimalzahl ist schon die Prozentzahl: $0{,}05$ sind $0{,}05\,\%$.`,
  },
  {
    id: 'chem-mis-lo-w-volume',
    name: "Massenanteil auf das Volumen bezogen",
    wrongText: String.raw`Ein Massenanteil von $10\,\%$ heißt: $10\,\mathrm{g}$ Stoff in $100\,\mathrm{mL}$ Lösung.`,
  },
  {
    id: 'chem-mis-lo-beta-density',
    name: "Massenkonzentration mit Dichte verwechselt",
    wrongText: "Die Massenkonzentration einer Lösung in g/L ist dasselbe wie ihre Dichte.",
  },
  {
    id: 'chem-mis-lo-ppm-factor',
    name: "Zehnerpotenz bei ppm, ppb oder ppt falsch",
    wrongText: String.raw`$1\,\mathrm{ppm}$ ist ein Tausendstel, also dasselbe wie ein Promille.`,
  },
  {
    id: 'chem-mis-lo-billion',
    name: "Englisches billion als Billion übersetzt",
    wrongText: String.raw`Das b in ppb steht für die deutsche Billion, also ein Teil auf $10^{12}$ Teile.`,
  },
  {
    id: 'chem-mis-lo-vol-mass',
    name: "Volumenanteil und Massenanteil gleichgesetzt",
    wrongText: String.raw`Vol-% und Massenprozent sind dasselbe: $40\,\mathrm{Vol}\text{-}\%$ Ethanol heißen $40\,\mathrm{g}$ Ethanol in $100\,\mathrm{g}$ Mischung.`,
  },
  {
    id: 'chem-mis-lo-volume-conserved',
    name: "Volumen wie die Masse erhalten",
    wrongText: "Volumen bleibt wie die Masse immer erhalten: Beim Mischen addieren sich die Volumina genau, und bei Gasreaktionen ist das Gesamtvolumen vorher und nachher gleich.",
  },
  {
    id: 'chem-mis-lo-contraction-loss',
    name: "Volumenkontraktion als Stoffverlust gedeutet",
    wrongText: "Wird das Volumen beim Mischen zweier Flüssigkeiten kleiner, muss Stoff verdunstet oder bei einer Reaktion verbraucht worden sein.",
  },
  // Gase
  {
    id: 'chem-mis-lo-vm-everything',
    name: "Molares Volumen der Gase für jeden Stoff",
    wrongText: String.raw`Ein Mol jedes Stoffes nimmt $22{,}4\,\mathrm{L}$ ein, auch ein Mol einer Flüssigkeit oder eines Feststoffs.`,
  },
  {
    id: 'chem-mis-lo-vm-any-condition',
    name: "Molares Volumen bei allen Bedingungen gleich",
    wrongText: String.raw`Ein Mol Gas nimmt immer $22{,}4\,\mathrm{L}$ ein, egal bei welcher Temperatur und welchem Druck.`,
  },
  {
    id: 'chem-mis-lo-vm-gas-specific',
    name: "Gasvolumen hängt von der Art des Gases ab",
    wrongText: "Bei gleichem Druck und gleicher Temperatur nimmt ein Mol eines schweren Gases mehr Raum ein als ein Mol eines leichten.",
  },
  {
    id: 'chem-mis-lo-vm-inverted',
    name: "Molares Volumen falsch herum gedeutet",
    wrongText: String.raw`Das molare Volumen gibt an, wie viel Mol in einem Liter Gas stecken; man rechnet $V = \frac{n}{V_m}$.`,
  },
  {
    id: 'chem-mis-lo-atoms-count',
    name: "Atome statt Teilchen gezählt",
    wrongText: String.raw`Für Stoffmenge und Gasvolumen zählen die Atome, nicht die Teilchen: Ein Mol $\ce{O2}$ nimmt doppelt so viel Raum ein wie ein Mol $\ce{He}$.`,
  },
  {
    id: 'chem-mis-lo-avogadro-mass',
    name: "Gleiches Gasvolumen heißt gleiche Masse",
    wrongText: "Gleich große Volumina verschiedener Gase enthalten bei gleichem Druck und gleicher Temperatur dieselbe Masse.",
  },
  {
    id: 'chem-mis-lo-ideal-model',
    name: "Modell des idealen Gases falsch verstanden",
    wrongText: "Ein ideales Gas ist ein besonders reines Gas, dessen Teilchen sich stark anziehen und viel Raum ausfüllen.",
  },
  {
    id: 'chem-mis-lo-celsius',
    name: "Temperatur in Grad Celsius statt in Kelvin",
    wrongText: String.raw`Im Gasgesetz darf die Temperatur in $^{\circ}\mathrm{C}$ stehen; verdoppelt sich die Temperatur in $^{\circ}\mathrm{C}$, verdoppelt sich auch das Volumen.`,
  },
  {
    id: 'chem-mis-lo-si-units',
    name: "Druck und Volumen nicht in SI-Einheiten",
    wrongText: String.raw`Mit $R = 8{,}314\,\mathrm{J/(mol \cdot K)}$ darf man Druck und Volumen in gewohnten Einheiten wie $\mathrm{hPa}$, $\mathrm{bar}$ und $\mathrm{L}$ einsetzen.`,
  },
  {
    id: 'chem-mis-lo-gas-direction',
    name: "Zusammenhang der Gasgrößen falsch herum",
    wrongText: "Ein Gas, das man zusammendrückt, hat danach weniger Druck, und ein Gas, das man bei gleichem Druck erwärmt, braucht weniger Platz.",
  },
  {
    id: 'chem-mis-lo-gas-fixed',
    name: "Gasgrößen für unabhängig gehalten",
    wrongText: "Druck, Volumen und Temperatur eines Gases hängen nicht zusammen: Ändert man eine Größe, bleiben die anderen gleich.",
  },
  {
    id: 'chem-mis-lo-heat-more-particles',
    name: "Erwärmen erzeugt mehr Teilchen",
    wrongText: "Erwärmt man ein Gas, entstehen zusätzliche Gasteilchen; deshalb dehnt es sich aus.",
  },
]
