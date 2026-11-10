import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Atombau“: Name und falsche Aussage (klein, für Fehlerstatistik und
// Lernkarten). Die Erklärungen „Warum ist das falsch?“ stehen in atombauWhy.ts und laden erst mit den
// Fragen. Nur als falsche Antworten; Regeln in docs/CHEMIE.md §8.

export const ATOMBAU_MISCONCEPTIONS: readonly MisconceptionName[] = [
  {
    id: 'chem-mis-compound-is-mixture',
    name: "Verbindung für ein Gemisch gehalten",
    wrongText: "Eine Verbindung ist ein Gemisch aus Elementen, das sich durch Filtrieren oder Destillieren wieder in die Elemente trennen lässt.",
  },
  {
    id: 'chem-mis-pure-means-element',
    name: "Reinstoff mit Element gleichgesetzt",
    wrongText: "Reinstoffe sind immer Elemente; eine Verbindung wie Wasser ist kein Reinstoff.",
  },
  {
    id: 'chem-mis-element-compound-swap',
    name: "Verbindung und Element verwechselt",
    wrongText: "Wasser ist ein Element, weil es ein einheitlicher Stoff mit einer eigenen Formel ist.",
  },
  {
    id: 'chem-mis-mixture-as-pure',
    name: "Einheitliches Gemisch für einen Reinstoff gehalten",
    wrongText: "Luft, Salzwasser und Bronze sind Reinstoffe, denn sie sehen durch und durch gleich aus.",
  },
  {
    id: 'chem-mis-separation-principle',
    name: "Trennverfahren und Trennprinzip verwechselt",
    wrongText: "Beim Destillieren trennen sich zwei Flüssigkeiten nach ihrer Dichte: Die schwerere bleibt im Kolben zurück.",
  },
  {
    id: 'chem-mis-dissolved-like-solid',
    name: "Gelösten Stoff wie einen ungelösten behandelt",
    wrongText: "Gelöstes Salz lässt sich aus Salzwasser abfiltrieren oder absetzen lassen wie Sand.",
  },
  {
    id: 'chem-mis-physical-as-chemical',
    name: "Physikalischen Vorgang für eine Reaktion gehalten",
    wrongText: "Schmelzen, Zucker in Wasser lösen oder Glühen ist eine chemische Reaktion, weil sich der Stoff sichtbar verändert und Energie aufnimmt.",
  },
  {
    id: 'chem-mis-chemical-as-physical',
    name: "Reaktion für einen physikalischen Vorgang gehalten",
    wrongText: "Beim Rosten und beim Verbrennen ändert sich nur das Aussehen; der Stoff bleibt derselbe.",
  },
  {
    id: 'chem-mis-mass-lost',
    name: "Masse geht bei einer Reaktion verloren",
    wrongText: "Bei einer chemischen Reaktion in einem geschlossenen Gefäß wird der Inhalt leichter, weil Stoff verbraucht wird.",
  },
  {
    id: 'chem-mis-particle-charges',
    name: "Ladungen der Elementarteilchen vertauscht",
    wrongText: "Das Proton ist negativ geladen, das Elektron positiv.",
  },
  {
    id: 'chem-mis-electron-mass',
    name: "Masse der Elektronen überschätzt",
    wrongText: "Ein Elektron ist etwa so schwer wie ein Proton und trägt viel zur Masse des Atoms bei.",
  },
  {
    id: 'chem-mis-particle-place',
    name: "Teilchen am falschen Ort vermutet",
    wrongText: "Im Atomkern sitzen Protonen und Elektronen; die Neutronen bewegen sich in der Hülle.",
  },
  {
    id: 'chem-mis-neutron-balances-charge',
    name: "Neutronen als Ladungsausgleich gesehen",
    wrongText: "Neutronen sorgen dafür, dass sich die Ladung der Protonen aufhebt; ein ungeladenes Atom hat deshalb gleich viele Neutronen wie Protonen.",
  },
  {
    id: 'chem-mis-neutrons-equal-a',
    name: "Massenzahl für die Neutronenzahl gehalten",
    wrongText: "Die Massenzahl gibt an, wie viele Neutronen im Kern sind.",
  },
  {
    id: 'chem-mis-z-meaning',
    name: "Bedeutung der Ordnungszahl verwechselt",
    wrongText: "Die Ordnungszahl gibt die Zahl der Neutronen oder die Zahl aller Teilchen im Kern an.",
  },
  {
    id: 'chem-mis-a-without-neutrons',
    name: "Massenzahl ohne Neutronen gezählt",
    wrongText: "Die Massenzahl gibt die Zahl der Protonen oder die Zahl der Elektronen an.",
  },
  {
    id: 'chem-mis-element-not-by-protons',
    name: "Element nicht über die Protonenzahl bestimmt",
    wrongText: "Welches Element vorliegt, erkennt man an der Massenzahl oder an der Zahl der Elektronen.",
  },
  {
    id: 'chem-mis-isotope-protons',
    name: "Isotope mit verschiedener Protonenzahl",
    wrongText: "Isotope eines Elements unterscheiden sich in der Zahl ihrer Protonen.",
  },
  {
    id: 'chem-mis-isotope-more-neutrons',
    name: "Isotop heißt „mehr Neutronen als Protonen“",
    wrongText: "Ein Isotop ist ein Atom, das mehr Neutronen als Protonen hat.",
  },
  {
    id: 'chem-mis-isotope-electrons',
    name: "Isotop mit Ion verwechselt",
    wrongText: "Isotope eines Elements unterscheiden sich in der Zahl ihrer Elektronen.",
  },
  {
    id: 'chem-mis-isotope-same-a',
    name: "Isotope mit gleicher Massenzahl",
    wrongText: "Isotope haben dieselbe Massenzahl, aber eine verschiedene Neutronenzahl.",
  },
  {
    id: 'chem-mis-isotope-chemistry-differs',
    name: "Isotope als chemisch verschieden angesehen",
    wrongText: "Isotope eines Elements verhalten sich chemisch völlig verschieden, weil ihre Kerne verschieden schwer sind.",
  },
  {
    id: 'chem-mis-ion-changes-nucleus',
    name: "Ionenbildung im Kern vermutet",
    wrongText: "Ein positives Ion entsteht, wenn ein Atom ein zusätzliches Proton aufnimmt.",
  },
  {
    id: 'chem-mis-ion-sign-reversed',
    name: "Vorzeichen der Ionenladung verdreht",
    wrongText: "Ein negativ geladenes Ion hat weniger Elektronen als das ungeladene Atom.",
  },
  {
    id: 'chem-mis-ion-charge-ignored',
    name: "Ionenladung beim Zählen vergessen",
    wrongText: "Auch ein Ion hat immer genauso viele Elektronen wie Protonen.",
  },
  {
    id: 'chem-mis-nucleus-large',
    name: "Atomkern viel zu groß gedacht",
    wrongText: "Der Atomkern füllt einen großen Teil des Atoms aus; er ist nur etwa zehnmal kleiner als das ganze Atom.",
  },
  {
    id: 'chem-mis-model-mixup',
    name: "Aussagen der Atommodelle verwechselt",
    wrongText: "Schon im Modell von Thomson gab es einen kleinen, positiv geladenen Atomkern.",
  },
  {
    id: 'chem-mis-model-explains-too-much',
    name: "Einem Atommodell zu viel zugetraut",
    wrongText: "Das Kern-Hülle-Modell von Rutherford erklärt, warum Atome nur Licht ganz bestimmter Wellenlängen aussenden.",
  },
  {
    id: 'chem-mis-scatter-misread',
    name: "Streuversuch falsch gedeutet",
    wrongText: "Beim Streuversuch wurden die meisten Alpha-Teilchen von der Goldfolie abgelenkt; das Atom ist also dicht mit Masse gefüllt.",
  },
  {
    id: 'chem-mis-orbital-is-path',
    name: "Orbital für eine Bahn gehalten",
    wrongText: "Ein Orbital ist die feste Kreisbahn, auf der ein Elektron um den Kern läuft.",
  },
  {
    id: 'chem-mis-uncertainty-instrument',
    name: "Unschärfe als Messfehler gedeutet",
    wrongText: "Ort und Geschwindigkeit eines Elektrons lassen sich nur deshalb nicht zugleich genau bestimmen, weil die Messgeräte zu ungenau sind.",
  },
  {
    id: 'chem-mis-longer-wavelength-more-energy',
    name: "Energie und Wellenlänge falsch verknüpft",
    wrongText: "Je länger die Wellenlänge, desto mehr Energie trägt das Licht; rotes Licht ist also energiereicher als violettes.",
  },
  {
    id: 'chem-mis-line-spectrum-continuous',
    name: "Linienspektrum für ein lückenloses Spektrum gehalten",
    wrongText: "Ein leuchtendes Gas eines Elements sendet alle Farben aus, so dass ein lückenloses Farbband entsteht.",
  },
  {
    id: 'chem-mis-emission-on-excitation',
    name: "Aufnahme und Abgabe von Energie vertauscht",
    wrongText: "Wenn ein Elektron auf ein höheres Energieniveau springt, sendet das Atom Licht aus.",
  },
  {
    id: 'chem-mis-wave-or-particle-only',
    name: "Nur Welle oder nur Teilchen",
    wrongText: "Licht ist nur eine Welle und ein Elektron nur ein Teilchen.",
  },
  {
    id: 'chem-mis-de-broglie-c',
    name: "Lichtgeschwindigkeit in der Wellenlänge eines Teilchens",
    wrongText: String.raw`Für jedes bewegte Teilchen gilt $\lambda = \frac{h}{m \cdot c}$ mit der Lichtgeschwindigkeit $c$.`,
  },
  {
    id: 'chem-mis-molecule-is-compound',
    name: "Molekül mit Verbindung gleichgesetzt",
    wrongText: String.raw`Sauerstoff $\ce{O2}$ ist eine Verbindung, weil in jedem Teilchen zwei Atome aneinander gebunden sind.`,
  },
  {
    id: 'chem-mis-mass-gained',
    name: "Masse kommt bei einer Reaktion hinzu",
    wrongText: "Bei einer Reaktion in einem geschlossenen Gefäß wird der Inhalt schwerer, wenn ein Stoff Sauerstoff bindet.",
  },
  {
    id: 'chem-mis-nucleus-all-positive',
    name: "Alle Kernteilchen für positiv gehalten",
    wrongText: "Weil der Atomkern positiv geladen ist, trägt jedes Teilchen im Kern eine positive Ladung.",
  },
  {
    id: 'chem-mis-proton-neutron-swap',
    name: "Proton und Neutron verwechselt",
    wrongText: "Das Neutron ist das positiv geladene Kernteilchen, das Proton ist ungeladen.",
  },
  {
    id: 'chem-mis-neutron-light',
    name: "Neutron für viel leichter gehalten",
    wrongText: "Das Neutron ist viel leichter als das Proton, weil es keine Ladung trägt.",
  },
  {
    id: 'chem-mis-u-gram-kilogram',
    name: "Gramm und Kilogramm bei der Masseneinheit verwechselt",
    wrongText: String.raw`Die atomare Masseneinheit beträgt $1\,\mathrm{u} = 1{,}66 \cdot 10^{-27}\,\mathrm{g}$.`,
  },
  {
    id: 'chem-mis-charge-as-mass',
    name: "Elementarladung für eine Masse gehalten",
    wrongText: String.raw`Die Zahl $1{,}602 \cdot 10^{-19}$ gibt die Masse eines Protons in Gramm an.`,
  },
  {
    id: 'chem-mis-neutral-no-charges',
    name: "Ungeladen mit „ohne geladene Teilchen“ verwechselt",
    wrongText: "Ein ungeladenes Atom enthält überhaupt keine geladenen Teilchen.",
  },
  {
    id: 'chem-mis-pse-by-mass',
    name: "Ordnungszahl als Platz nach der Atommasse",
    wrongText: "Die Ordnungszahl ist der Platz eines Elements, wenn man alle Elemente nach ihrer Atommasse sortiert.",
  },
  {
    id: 'chem-mis-isotope-radioactive',
    name: "Isotop mit „radioaktiv“ gleichgesetzt",
    wrongText: "Isotope sind die radioaktiven Atome eines Elements; ein stabiles Atom ist kein Isotop.",
  },
  {
    id: 'chem-mis-size-means-mass',
    name: "Größe mit Masse gleichgesetzt",
    wrongText: "Was im Atom die meiste Masse trägt, nimmt auch den meisten Raum ein; ein winziger Teil kann nicht fast die ganze Masse haben.",
  },
  {
    id: 'chem-mis-model-limit-swap',
    name: "Stärke eines Modells für seine Grenze gehalten",
    wrongText: "Das Modell von Rutherford kann nicht erklären, warum fast alle Alpha-Teilchen eine Goldfolie durchfliegen.",
  },
  {
    id: 'chem-mis-electron-radiates',
    name: "Ständige Abstrahlung der Elektronen angenommen",
    wrongText: "Ein Elektron im Atom gibt auf seinem Weg um den Kern ständig Energie als Licht ab.",
  },
  {
    id: 'chem-mis-scatter-gaps',
    name: "Durchflug durch Lücken zwischen den Atomen",
    wrongText: "Beim Streuversuch fliegen die Alpha-Teilchen durch Lücken zwischen den Goldatomen, nicht durch die Atome selbst.",
  },
  {
    id: 'chem-mis-alpha-neutral',
    name: "Ladung der Alpha-Teilchen übersehen",
    wrongText: "Alpha-Teilchen sind ungeladen; deshalb fliegen sie durch Materie, ohne etwas von ihr zu spüren.",
  },
  {
    id: 'chem-mis-light-same-energy',
    name: "Gleich schnell, also gleiche Frequenz und Energie",
    wrongText: "Weil alles Licht gleich schnell ist, haben alle Farben dieselbe Frequenz, und jede Lichtportion trägt dieselbe Energie.",
  },
  {
    id: 'chem-mis-wavelength-frequency-same',
    name: "Zusammenhang von Wellenlänge und Frequenz verkannt",
    wrongText: "Bei Licht wächst die Frequenz mit der Wellenlänge, oder die beiden hängen gar nicht zusammen.",
  },
  {
    id: 'chem-mis-light-energy-square',
    name: "Energie des Lichts mit dem Quadrat verknüpft",
    wrongText: "Die Energie einer Lichtportion hängt vom Quadrat der Wellenlänge ab: Halbe Wellenlänge heißt viermal so viel Energie.",
  },
  {
    id: 'chem-mis-brightness-photon-energy',
    name: "Helligkeit mit der Energie einer Portion verwechselt",
    wrongText: "Helleres Licht besteht aus energiereicheren Lichtportionen.",
  },
  {
    id: 'chem-mis-lines-per-electron',
    name: "Eine Spektrallinie je Elektron",
    wrongText: "Jedes Elektron eines Atoms liefert genau eine Spektrallinie; ein Atom mit einem Elektron zeigt also eine Linie.",
  },
  {
    id: 'chem-mis-light-from-nucleus',
    name: "Licht aus dem Atomkern vermutet",
    wrongText: "Das Licht eines Linienspektrums entsteht im Atomkern, wenn dieser Energie aufnimmt und wieder abgibt.",
  },
  {
    id: 'chem-mis-excitation-is-ionization',
    name: "Anregung mit Ionisierung verwechselt",
    wrongText: "Springt ein Elektron auf ein höheres Energieniveau, verlässt es das Atom, und es entsteht ein Ion.",
  },
  {
    id: 'chem-mis-absorption-other-lines',
    name: "Absorption und Emission bei verschiedenen Wellenlängen vermutet",
    wrongText: "Ein Element schluckt Licht bei anderen Wellenlängen als denen, bei denen es selbst leuchtet.",
  },
  {
    id: 'chem-mis-particle-sign-as-wave',
    name: "Teilcheneigenschaft als Zeichen einer Welle gedeutet",
    wrongText: "Dass Elektronen eine Masse und eine Ladung haben und im elektrischen Feld abgelenkt werden, zeigt ihre Wellennatur.",
  },
  {
    id: 'chem-mis-heavy-long-wave',
    name: "Größere Masse, längere Welle",
    wrongText: "Je schwerer und je schneller ein Teilchen ist, desto größer ist seine Wellenlänge.",
  },
  {
    id: 'chem-mis-matter-wave-only-small',
    name: "Wellenlänge nur für Licht und winzige Teilchen",
    wrongText: "Eine Wellenlänge haben nur Licht und winzige Teilchen wie Elektronen; ein Ball oder ein Auto hat keine.",
  },
  {
    id: 'chem-mis-element-fixed-neutrons',
    name: "Neutronenzahl für ein Element als fest angesehen",
    wrongText: "Alle Atome eines Elements haben gleich viele Neutronen und damit dieselbe Massenzahl.",
  },
  {
    id: 'chem-mis-nucleus-no-repulsion',
    name: "Abstoßung im Kern übersehen",
    wrongText: "Im Atomkern stoßen sich die Protonen nicht ab, weil sie so dicht beieinander sitzen.",
  },
  {
    id: 'chem-mis-alpha-hit-electrons',
    name: "Ablenkung im Streuversuch den Elektronen zugeschrieben",
    wrongText: "Im Streuversuch prallen die Alpha-Teilchen an den Elektronen der Goldatome ab.",
  },
  {
    id: 'chem-mis-spectra-all-same',
    name: "Gleiche Spektrallinien für alle Elemente angenommen",
    wrongText: "Alle Elemente haben Spektrallinien bei denselben Wellenlängen; sie unterscheiden sich nur in der Helligkeit.",
  },
  {
    id: 'chem-mis-uncertainty-reversed',
    name: "Unschärferelation umgedreht",
    wrongText: "Je genauer der Ort eines Elektrons feststeht, desto genauer kennt man auch seine Geschwindigkeit.",
  },
  {
    id: 'chem-mis-de-broglie-speed-only',
    name: "Wellenlänge nur von der Geschwindigkeit abhängig gedacht",
    wrongText: "Die Wellenlänge eines Teilchens hängt nur von seiner Geschwindigkeit ab; gleich schnelle Teilchen haben dieselbe Wellenlänge.",
  },
]
