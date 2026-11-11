import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Ionenbindung und Salze“: Name und falsche Aussage (klein, für Fehlerstatistik und
// Lernkarten). Die Erklärungen „Warum ist das falsch?“ stehen in ionenWhy.ts und laden erst mit den Fragen. Nur
// als falsche Antworten; Regeln in docs/CHEMIE.md §8.

export const IONEN_MISCONCEPTIONS: readonly MisconceptionName[] = [
  // Ionenbindung: wer gibt, wer nimmt, was hält zusammen
  {
    id: 'chem-mis-io-metal-anion',
    name: "Metall und Nichtmetall vertauscht",
    wrongText: "In einem Salz gibt das Nichtmetall Elektronen ab und wird positiv; das Metall nimmt sie auf und wird negativ.",
  },
  {
    id: 'chem-mis-io-electron-sign',
    name: "Ladung beim Abgeben von Elektronen verwechselt",
    wrongText: "Gibt ein Atom Elektronen ab, wird es negativ geladen; nimmt es welche auf, wird es positiv.",
  },
  {
    id: 'chem-mis-io-proton-charge',
    name: "Ionen durch Protonen statt Elektronen",
    wrongText: "Ionen entstehen, indem Atome Protonen aufnehmen oder abgeben.",
  },
  {
    id: 'chem-mis-io-bond-mixup',
    name: "Bindungsarten verwechselt",
    wrongText: "In einer Ionenbindung teilen sich die Atome Elektronenpaare wie in einer Atombindung, oder die Elektronen bewegen sich frei wie in einem Metall.",
  },
  {
    id: 'chem-mis-io-molecule',
    name: "Salz als Molekül",
    wrongText: String.raw`Ein Salz besteht aus einzelnen Molekülen, etwa $\ce{NaCl}$-Paaren, die beim Lösen oder Schmelzen als Ganzes erhalten bleiben.`,
  },
  {
    id: 'chem-mis-io-ions-form-late',
    name: "Ionen erst beim Lösen oder Schmelzen",
    wrongText: "Ein festes Salz besteht aus neutralen Atomen; Ionen entstehen erst, wenn man es löst oder schmilzt.",
  },
  // Ladungen und Formeln
  {
    id: 'chem-mis-io-anion-positive',
    name: "Anion mit positiver Ladung",
    wrongText: String.raw`Auch Nichtmetalle bilden in Salzen positive Ionen, etwa Phosphor in Natriumphosphid ein $\ce{P^3+}$.`,
  },
  {
    id: 'chem-mis-io-charge-valence',
    name: "Ladung gleich Zahl der Valenzelektronen",
    wrongText: "Ein Ion trägt so viele Ladungen, wie das Atom Valenzelektronen hat, auch bei Nichtmetallen.",
  },
  {
    id: 'chem-mis-io-charge-always-one',
    name: "Alle Ionen einfach geladen",
    wrongText: String.raw`Jedes Ion trägt die Ladung $+1$ oder $-1$, egal aus welcher Gruppe das Element stammt.`,
  },
  {
    id: 'chem-mis-io-fixed-ratio',
    name: "Verhältnis der Ionen ohne die Ladungen festgelegt",
    wrongText: String.raw`Das Zahlenverhältnis der Ionen in einem Salz liegt fest, zum Beispiel immer $1 : 1$, und hängt nicht von ihren Ladungen ab.`,
  },
  {
    id: 'chem-mis-io-index-is-charge',
    name: "Index als Ladung gelesen",
    wrongText: String.raw`Der Index hinter einem Ion in der Formel gibt seine Ladung an: In $\ce{Na2S}$ ist Natrium zweifach positiv.`,
  },
  {
    id: 'chem-mis-io-element-formula',
    name: "Indizes aus den Formeln der Elemente",
    wrongText: String.raw`In der Formel eines Salzes stehen dieselben Indizes wie in den Formeln der Elemente, etwa die 2 aus $\ce{O2}$ oder $\ce{Cl2}$.`,
  },
  {
    id: 'chem-mis-io-index-swap',
    name: "Ladung als eigener Index",
    wrongText: String.raw`Die Ladung eines Ions wird sein eigener Index: Calcium mit der Ladung $+2$ bekommt in der Formel die 2.`,
  },
  {
    id: 'chem-mis-io-not-neutral',
    name: "Salz nicht neutral",
    wrongText: "Die Ladungen von Kationen und Anionen müssen sich in einem Salz nicht aufheben; ein Salz darf insgesamt geladen sein.",
  },
  // Namen
  {
    id: 'chem-mis-io-greek-prefix',
    name: "Zahlwörter im Namen eines Salzes",
    wrongText: String.raw`Salze benennt man mit Zahlwörtern wie Moleküle: $\ce{CaCl2}$ heißt Calciumdichlorid.`,
  },
  {
    id: 'chem-mis-io-numeral-always',
    name: "Römische Ziffer bei jedem Metall",
    wrongText: "Jedes Metall braucht im Namen eines Salzes eine römische Ziffer, auch Natrium oder Magnesium.",
  },
  {
    id: 'chem-mis-io-name-order',
    name: "Reihenfolge im Namen vertauscht",
    wrongText: "Im Namen eines Salzes steht das Anion vorn und das Metall hinten.",
  },
  {
    id: 'chem-mis-io-ending-mixup',
    name: "Endungen -id, -it und -at verwechselt",
    wrongText: "Die Endung des Anions ist beliebig: Sulfid, Sulfit und Sulfat oder Chlor und Chlorid meinen dasselbe Ion.",
  },
  {
    id: 'chem-mis-io-numeral-count',
    name: "Römische Ziffer als Anzahl gelesen",
    wrongText: "Die römische Ziffer im Namen gibt an, wie viele Metall-Ionen oder Anionen in der Formel stehen.",
  },
  {
    id: 'chem-mis-io-numeral-group',
    name: "Römische Ziffer als Gruppe gelesen",
    wrongText: "Die römische Ziffer im Namen eines Salzes gibt die Gruppe des Metalls im Periodensystem an.",
  },
  {
    id: 'chem-mis-io-numeral-from-index',
    name: "Ziffer, sobald ein Index steht",
    wrongText: "Eine römische Ziffer gehört immer dann in den Namen, wenn in der Formel ein Index größer als 1 steht.",
  },
  // Molekül-Ionen
  {
    id: 'chem-mis-io-poly-charge',
    name: "Ladung eines Molekül-Ions falsch",
    wrongText: String.raw`Molekül-Ionen haben keine festen Ladungen: Phosphat ist $\ce{PO4^2-}$, und Ammonium ist negativ wie die anderen.`,
  },
  {
    id: 'chem-mis-io-bracket',
    name: "Klammer um ein Molekül-Ion weggelassen",
    wrongText: String.raw`Klammern um Molekül-Ionen sind nur Schreibweise; $\ce{CaOH2}$ bedeutet dasselbe wie $\ce{Ca(OH)2}$.`,
  },
  {
    id: 'chem-mis-io-poly-split',
    name: "Molekül-Ion in einzelne Atome zerlegt",
    wrongText: "Ein Molekül-Ion ist keine Einheit: Sulfat oder Nitrat bestehen im Salz aus einzelnen Ionen der Elemente und zerfallen beim Lösen in diese.",
  },
  // Eigenschaften der Salze
  {
    id: 'chem-mis-io-solid-conducts',
    name: "Fester Salzkristall leitet",
    wrongText: "Ein fester Salzkristall leitet den Strom, weil er aus geladenen Teilchen besteht.",
  },
  {
    id: 'chem-mis-io-electrons-conduct',
    name: "Strom in Salzen durch Elektronen",
    wrongText: "Salzschmelzen und Salzlösungen leiten den Strom über freie Elektronen, so wie ein Metall.",
  },
  {
    id: 'chem-mis-io-state-decides',
    name: "Leitfähigkeit nur nach dem Aggregatzustand",
    wrongText: "Ob ein Stoff leitet, hängt nur davon ab, ob er flüssig ist: Flüssigkeiten leiten, Feststoffe nie.",
  },
  {
    id: 'chem-mis-io-ductile',
    name: "Salze verformbar wie Metalle",
    wrongText: "Salzkristalle lassen sich wie Metalle biegen und hämmern, ohne zu brechen.",
  },
  {
    id: 'chem-mis-io-weak-forces',
    name: "Schwache Kräfte zwischen Ionen",
    wrongText: "Zwischen den Ionen eines Salzes wirken nur schwache Kräfte; Salze schmelzen deshalb leicht.",
  },
  {
    id: 'chem-mis-io-mass-decides',
    name: "Masse statt Ladung und Abstand",
    wrongText: "Wie stark Ionen zusammenhalten, hängt vor allem von ihrer Masse ab: Schwerere Ionen ergeben höhere Schmelzpunkte.",
  },
  {
    id: 'chem-mis-io-distance',
    name: "Größerer Abstand, stärkere Anziehung",
    wrongText: "Je größer die Ionen und je weiter sie auseinanderliegen, desto stärker ziehen sie sich an.",
  },
  {
    id: 'chem-mis-io-charge-irrelevant',
    name: "Größe der Ladung übersehen",
    wrongText: "Für die Anziehung zwischen Ionen zählt nur das Vorzeichen; ob ein Ion einfach oder mehrfach geladen ist, spielt keine Rolle.",
  },
  {
    id: 'chem-mis-io-amorphous',
    name: "Kristallin und amorph verwechselt",
    wrongText: "Kristalline Stoffe sind ungeordnet und erweichen langsam; amorphe Stoffe wie Glas haben ein regelmäßiges Gitter.",
  },
  {
    id: 'chem-mis-io-crystal-look',
    name: "Kristallin nach dem Aussehen beurteilt",
    wrongText: "Ob ein Stoff kristallin ist, erkennt man daran, dass er glänzt oder durchsichtig ist.",
  },
  // Ionengitter
  {
    id: 'chem-mis-io-cell-is-unit',
    name: "Elementarzelle gleich Formeleinheit",
    wrongText: "Eine Elementarzelle enthält genau eine Formeleinheit, also so viele Ionen, wie die Formel angibt.",
  },
  {
    id: 'chem-mis-io-cell-is-polyhedron',
    name: "Elementarzelle und Koordinationspolyeder verwechselt",
    wrongText: "Die Elementarzelle und das Polyeder der Nachbarn eines Ions sind dasselbe; die Nachbarn bilden immer die Form der Zelle.",
  },
  {
    id: 'chem-mis-io-cn-count-all',
    name: "Alle Ionen statt der nächsten Nachbarn gezählt",
    wrongText: "Die Koordinationszahl ist die Zahl aller Ionen der Gegensorte, die man in der Elementarzelle sieht.",
  },
  {
    id: 'chem-mis-io-cn-same-charge',
    name: "Gleich geladene Ionen als Nachbarn gezählt",
    wrongText: "Zur Koordinationszahl zählen die nächsten Ionen derselben Sorte, also Kationen um ein Kation.",
  },
  {
    id: 'chem-mis-io-cn-from-formula',
    name: "Koordinationszahl aus Formel oder Ladung",
    wrongText: String.raw`Die Koordinationszahl lässt sich aus der Formel oder der Ladung ablesen; bei einem Salz mit dem Verhältnis $1 : 1$ hat jedes Ion einen Nachbarn.`,
  },
  {
    id: 'chem-mis-io-all-like-nacl',
    name: "Jedes Salz im Kochsalzgitter",
    wrongText: "Alle Salze mit der Formel MX haben dasselbe Gitter wie Kochsalz, mit denselben Nachbarn und denselben Eigenschaften.",
  },
  {
    id: 'chem-mis-io-polyhedron-mixup',
    name: "Polyeder passt nicht zur Zahl der Nachbarn",
    wrongText: "Koordinationszahl und Polyeder passen beliebig zusammen; sechs Nachbarn können zum Beispiel einen Würfel bilden.",
  },
  {
    id: 'chem-mis-io-cn-size',
    name: "Kleines Kation, viele Nachbarn",
    wrongText: "Je kleiner ein Kation ist, desto mehr Anionen finden um es herum Platz.",
  },
  {
    id: 'chem-mis-io-cell-count-all',
    name: "Geteilte Ionen voll gezählt",
    wrongText: "Jedes Ion, das man in der Elementarzelle sieht, gehört ganz zu ihr, auch auf Ecken, Kanten und Flächen.",
  },
  {
    id: 'chem-mis-io-cn-vs-units',
    name: "Koordinationszahl mit Formeleinheiten verwechselt",
    wrongText: "Die Zahl der Formeleinheiten in einer Elementarzelle ist gleich der Koordinationszahl.",
  },
  {
    id: 'chem-mis-io-ion-is-unit',
    name: "Ion und Formeleinheit verwechselt",
    wrongText: "Jedes Ion in der Zelle ist eine Formeleinheit; zwei Ionen sind zwei Formeleinheiten.",
  },
  // Lösen und Schmelzen, Zerfall in Ionen
  {
    id: 'chem-mis-io-dissolve-atoms',
    name: "Salz zerfällt in Atome",
    wrongText: "Beim Lösen oder Schmelzen zerfällt ein Salz in neutrale Atome oder in seine Elemente.",
  },
  {
    id: 'chem-mis-io-dissolve-reacts',
    name: "Lösen als Reaktion zu neuen Stoffen",
    wrongText: "Beim Lösen reagiert ein Salz mit Wasser zu neuen Stoffen; das gelöste Salz ist ein anderer Stoff.",
  },
  {
    id: 'chem-mis-io-no-coefficients',
    name: "Koeffizienten der Ionen vergessen",
    wrongText: String.raw`Beim Zerfall in Ionen entsteht von jeder Sorte genau ein Ion: $\ce{Al2O3}$ zerfällt in $\ce{Al^3+}$ und $\ce{O^2-}$.`,
  },
  {
    id: 'chem-mis-io-index-in-ion',
    name: "Index als Teil des Ions",
    wrongText: String.raw`Der Index gehört beim Zerfall zum Ion: $\ce{CaCl2}$ zerfällt in $\ce{Ca^2+}$ und ein $\ce{Cl2^2-}$.`,
  },
  {
    id: 'chem-mis-io-melt-lattice-stays',
    name: "Gitter bleibt beim Schmelzen erhalten",
    wrongText: "Beim Schmelzen bleibt das Ionengitter erhalten; die Ionen bleiben auf ihren Plätzen, nur alles wird weicher.",
  },
  {
    id: 'chem-mis-io-dissolve-is-melting',
    name: "Lösen und Schmelzen gleichgesetzt",
    wrongText: "Lösen und Schmelzen sind derselbe Vorgang: Ein Salz schmilzt im Wasser.",
  },
  // Salze lösen: warm oder kalt
  {
    id: 'chem-mis-io-water-orientation',
    name: "Wassermoleküle falsch herum angelagert",
    wrongText: "Wassermoleküle wenden einem Kation ihre Wasserstoffatome zu und einem Anion ihr Sauerstoffatom.",
  },
  {
    id: 'chem-mis-io-water-nonpolar',
    name: "Wasser als unpolar angesehen",
    wrongText: "Wassermoleküle sind unpolar; sie lagern sich ohne bestimmte Richtung an die Ionen an.",
  },
  {
    id: 'chem-mis-io-dissolve-always-same',
    name: "Alle Salze lösen sich gleich warm oder kalt",
    wrongText: "Beim Lösen verhalten sich alle Salze gleich: Entweder wärmen alle das Wasser, oder alle kühlen es.",
  },
  {
    id: 'chem-mis-io-balance-reversed',
    name: "Energiebilanz beim Lösen vertauscht",
    wrongText: "Ist die Gitterenergie größer als die Hydratationsenergie, wird beim Lösen Wärme frei.",
  },
  {
    id: 'chem-mis-io-dissolve-no-energy',
    name: "Lösen ohne Energieumsatz",
    wrongText: "Beim Lösen eines Salzes wird keine Energie umgesetzt, weil dabei kein neuer Stoff entsteht.",
  },
  {
    id: 'chem-mis-io-exo-endo-mixup',
    name: "Exotherm und endotherm verwechselt",
    wrongText: "Ein Vorgang, bei dem es warm wird, ist endotherm; ein Vorgang, bei dem es kalt wird, ist exotherm.",
  },
  // Gitterenergie und Born-Haber
  {
    id: 'chem-mis-io-lattice-is-force',
    name: "Gitterenergie als Kraft",
    wrongText: "Die Gitterenergie ist eine Kraft, mit der sich die Ionen anziehen, gemessen in Newton.",
  },
  {
    id: 'chem-mis-io-lattice-sign',
    name: "Richtung der Gitterenergie verwechselt",
    wrongText: "Beim Bilden eines Ionengitters aus gasförmigen Ionen wird Energie aufgenommen; beim Aufbrechen des Gitters wird Energie frei.",
  },
  {
    id: 'chem-mis-io-lattice-mixup',
    name: "Gitterenergie mit anderer Energie verwechselt",
    wrongText: "Die Gitterenergie ist dasselbe wie die Bildungsenthalpie des Salzes oder die Energie, die man zum Schmelzen braucht.",
  },
  {
    id: 'chem-mis-io-bh-real-path',
    name: "Kreisprozess als echter Herstellungsweg",
    wrongText: "Der Born-Haber-Kreisprozess beschreibt, wie ein Salz in Wirklichkeit Schritt für Schritt entsteht.",
  },
  {
    id: 'chem-mis-io-bh-path-dependent',
    name: "Energie hängt vom Weg ab",
    wrongText: "Im Born-Haber-Kreisprozess liefert der Umweg über die Ionen eine andere Energie als der direkte Weg von den Elementen zum Salz.",
  },
  {
    id: 'chem-mis-io-ionization-releases',
    name: "Ionisieren setzt Energie frei",
    wrongText: "Wenn ein Metallatom ein Elektron abgibt und die Edelgaskonfiguration erreicht, wird Energie frei.",
  },
  {
    id: 'chem-mis-io-ea-compensates',
    name: "Elektronenaffinität deckt die Ionisierung",
    wrongText: "Die Energie, die frei wird, wenn das Nichtmetall ein Elektron aufnimmt, deckt die Ionisierung des Metalls schon ganz.",
  },
  {
    id: 'chem-mis-io-bh-full-bond',
    name: "Ganzes statt halbes Halogenmolekül",
    wrongText: String.raw`Für eine Formeleinheit $\ce{MX}$ spaltet man im Born-Haber-Kreisprozess ein ganzes $\ce{X2}$-Molekül.`,
  },
  {
    id: 'chem-mis-io-bh-step-missing',
    name: "Schritt im Kreisprozess ausgelassen",
    wrongText: "Im Born-Haber-Kreisprozess kann man Schritte weglassen, etwa das Verdampfen des Metalls oder das Spalten des Nichtmetall-Moleküls.",
  },
  {
    id: 'chem-mis-io-neutral-no-force',
    name: "Neutrales Salz ohne innere Anziehung",
    wrongText: "Weil ein Salz nach außen neutral ist, heben sich die Kräfte zwischen seinen Ionen auf, und im Gitter steckt keine Energie.",
  },
]
