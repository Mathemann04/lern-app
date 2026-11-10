import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Atombau“ (Ids wie in atombau.ts)

export const ATOMBAU_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-compound-is-mixture': {
    detailed: "In einer Verbindung sind die Atome verschiedener Elemente chemisch aneinander gebunden, immer im selben Zahlenverhältnis. Deshalb hat sie eigene Eigenschaften: Wasser löscht Feuer, Wasserstoff dagegen ist ein brennbares Gas. Trennverfahren wie Filtrieren oder Destillieren lösen keine Bindungen; zerlegen lässt sich eine Verbindung nur durch eine chemische Reaktion.",
    short: "In einer Verbindung sind die Atome chemisch gebunden; Trennverfahren lösen das nicht.",
  },
  'chem-mis-pure-means-element': {
    detailed: String.raw`Ein Reinstoff enthält nur einen einzigen Stoff und hat feste Kennwerte, zum Beispiel eine bestimmte Siedetemperatur. Das gilt für Elemente, aber genauso für Verbindungen: Reines Wasser siedet bei Normaldruck immer bei $100\,^{\circ}\mathrm{C}$. Ob ein Reinstoff aus einer oder aus mehreren Atomsorten aufgebaut ist, ist eine zweite, getrennte Frage.`,
    short: "Auch eine Verbindung ist ein Reinstoff, wenn nur dieser eine Stoff vorliegt.",
  },
  'chem-mis-element-compound-swap': {
    detailed: String.raw`Ein Element besteht aus nur einer Atomsorte und steht mit einem eigenen Symbol im Periodensystem. Stehen in der Formel zwei oder mehr verschiedene Elementsymbole, wie bei $\ce{H2O}$, ist der Stoff eine Verbindung. Eine Verbindung lässt sich durch eine chemische Reaktion in Elemente zerlegen, ein Element nicht.`,
    short: "Mehrere verschiedene Elementsymbole in der Formel: Das ist eine Verbindung.",
  },
  'chem-mis-mixture-as-pure': {
    detailed: "Auch ein Gemisch kann überall gleich aussehen, wenn die Stoffe sehr fein verteilt sind (homogenes Gemisch). Entscheidend ist, ob nur ein Stoff enthalten ist: Luft besteht aus Stickstoff, Sauerstoff und weiteren Gasen, Bronze ist eine Legierung, also ein Gemisch aus Kupfer und Zinn. In einem Gemisch können die Anteile schwanken, in einem Reinstoff nicht.",
    short: "Gleiches Aussehen beweist keinen Reinstoff; es zählt, wie viele Stoffe enthalten sind.",
  },
  'chem-mis-separation-principle': {
    detailed: "Die Dichte nutzen nur Verfahren, bei denen sich etwas absetzt: Sedimentieren, Dekantieren und Zentrifugieren. Beim Destillieren setzt sich nichts ab; das Gemisch wird erhitzt, und was in den Dampf übergeht, wird im Kühler wieder flüssig. Frag dich bei jedem Verfahren, was mit den Stoffen geschieht; daraus folgt der Unterschied, den es nutzt.",
    short: "Jedes Verfahren nutzt den Unterschied, der beim Vorgang selbst zählt; beim Destillieren setzt sich nichts ab.",
  },
  'chem-mis-dissolved-like-solid': {
    detailed: "In einer Lösung ist der Stoff in winzige Teilchen zerteilt und gleichmäßig im Wasser verteilt. Diese Teilchen passen durch jede Pore eines Filterpapiers und setzen sich auch in einer Zentrifuge nicht ab. Filtrieren, Sedimentieren und Zentrifugieren trennen nur ungelöste Feststoffe ab.",
    short: "Gelöste Teilchen gehen durch jeden Filter und setzen sich nicht ab.",
  },
  'chem-mis-physical-as-chemical': {
    detailed: String.raw`Eine chemische Reaktion erkennt man daran, dass ein neuer Stoff mit anderen Eigenschaften entsteht. Beim Schmelzen, Verdampfen oder Lösen bleibt der Stoff derselbe: Eis und flüssiges Wasser sind beide $\ce{H2O}$, und aus Zuckerwasser bekommt man den Zucker durch Eindampfen zurück. Auch Licht oder Wärme allein beweisen nichts, denn ein glühender Draht bleibt derselbe Draht.`,
    short: "Ohne neuen Stoff keine Reaktion, auch wenn sich Aussehen oder Energie ändern.",
  },
  'chem-mis-chemical-as-physical': {
    detailed: "Rost ist ein anderer Stoff als Eisen: rotbraun und bröckelig statt grau glänzend und fest, entstanden aus Eisen, Sauerstoff und Wasser. Beim Verbrennen von Kerzenwachs entstehen Kohlenstoffdioxid und Wasser. Durch bloßes Abkühlen oder Eindampfen bekommt man den Ausgangsstoff in beiden Fällen nicht zurück.",
    short: "Rost und Verbrennungsgase sind neue Stoffe mit neuen Eigenschaften.",
  },
  'chem-mis-mass-lost': {
    detailed: "Bei einer Reaktion werden die Atome nur neu verknüpft; keines verschwindet und keines kommt hinzu. In einem geschlossenen Gefäß bleibt die Gesamtmasse deshalb gleich (Gesetz von der Erhaltung der Masse). Leichter wird etwas nur in einem offenen Gefäß, wenn ein entstehendes Gas entweicht.",
    short: "Atome werden nur umgeordnet; im geschlossenen Gefäß bleibt die Masse gleich.",
  },
  'chem-mis-particle-charges': {
    detailed: "Die Ladungen zeigen sich im Versuch: Ein Strahl aus Elektronen wird zur positiv geladenen Platte hin abgelenkt, die Elektronen sind also negativ. Gibt ein Atom Elektronen ab, bleibt ein positiv geladener Rest; die positive Ladung steckt also im Kern bei den Protonen. Proton und Elektron tragen gleich große Ladungen mit entgegengesetztem Vorzeichen.",
    short: "Elektronen werden zur Plusseite abgelenkt, sind also negativ; die Protonen im Kern sind positiv.",
  },
  'chem-mis-electron-mass': {
    detailed: String.raw`Proton und Neutron haben je etwa die Masse $1\,\mathrm{u}$, ein Elektron ist dagegen etwa 1836-mal leichter als ein Proton. Selbst alle Elektronen eines Atoms zusammen machen weniger als ein Promille seiner Masse aus. Dass die Hülle viel größer ist als der Kern, ändert daran nichts: Groß heißt nicht schwer.`,
    short: "Ein Elektron ist rund 1800-mal leichter als ein Proton; die Masse steckt im Kern.",
  },
  'chem-mis-particle-place': {
    detailed: "Der Atomkern besteht aus den schweren Teilchen, die dort dicht gepackt sind. Die leichten Elektronen bilden die Hülle um den Kern. Bei chemischen Vorgängen werden nur Elektronen der Hülle abgegeben, aufgenommen oder geteilt; der Kern bleibt unberührt.",
    short: "Im Kern sitzen die schweren Teilchen, die leichten Elektronen bilden die Hülle.",
  },
  'chem-mis-neutron-balances-charge': {
    detailed: String.raw`Neutronen sind elektrisch neutral, daher ihr Name, und ein ungeladenes Teilchen kann keine Ladung ausgleichen. Ein Atom ist nach außen ungeladen, weil sich die positiven Ladungen im Kern und die negativen Ladungen in der Hülle aufheben. Die Neutronenzahl hängt davon nicht ab: $\ce{^{1}_{1}H}$ hat kein Neutron, $\ce{^{238}_{92}U}$ hat 146.`,
    short: "Neutronen sind ungeladen; den Ausgleich schaffen die negativen Teilchen der Hülle.",
  },
  'chem-mis-neutrons-equal-a': {
    detailed: String.raw`Würde die Massenzahl nur die Neutronen zählen, hätte gewöhnlicher Wasserstoff $\ce{^{1}_{1}H}$ ein Neutron. Sein Kern besteht aber aus einem einzigen Proton. Die Masse eines Kerns kommt von allen schweren Kernteilchen, nicht nur von den Neutronen.`,
    short: "Auch die Protonen im Kern tragen zur Massenzahl bei.",
  },
  'chem-mis-z-meaning': {
    detailed: "Die Ordnungszahl ist für alle Atome eines Elements gleich und steht fest im Periodensystem. Neutronenzahl und Zahl der Kernteilchen schwanken dagegen von Isotop zu Isotop: Kohlenstoff gibt es mit 6, 7 und 8 Neutronen. Eine Zahl, die sich innerhalb eines Elements ändert, kann nicht seine feste Nummer sein.",
    short: "Die Ordnungszahl ist für ein Element fest; Neutronenzahl und Massenzahl schwanken.",
  },
  'chem-mis-a-without-neutrons': {
    detailed: String.raw`Elektronen sind so leicht, dass sie zur Masse fast nichts beitragen; mit ihnen hat die Massenzahl nichts zu tun. Die Protonenzahl allein reicht auch nicht: Atome desselben Elements haben gleich viele Protonen, aber verschiedene Massenzahlen, etwa $\ce{^{24}_{12}Mg}$ und $\ce{^{26}_{12}Mg}$.`,
    short: "Gleiche Protonenzahl, verschiedene Massenzahl: Es zählen noch andere Kernteilchen mit.",
  },
  'chem-mis-element-not-by-protons': {
    detailed: String.raw`Die Massenzahl taugt dafür nicht: $\ce{^{40}_{18}Ar}$, $\ce{^{40}_{19}K}$ und $\ce{^{40}_{20}Ca}$ haben dieselbe Massenzahl und sind drei verschiedene Elemente. Die Elektronenzahl taugt auch nicht, denn sie ändert sich, wenn ein Atom zum Ion wird: $\ce{Cl-}$ hat so viele Elektronen wie ein Argonatom und ist trotzdem Chlor.`,
    short: "Gleiche Massenzahl oder gleiche Elektronenzahl heißt nicht gleiches Element.",
  },
  'chem-mis-isotope-protons': {
    detailed: "Die Protonenzahl legt fest, um welches Element es sich handelt. Hätten zwei Atome verschieden viele Protonen, wären sie Atome verschiedener Elemente und damit keine Isotope desselben Elements. Isotope haben deshalb auch dieselbe Ordnungszahl und dieselbe Kernladung.",
    short: "Andere Protonenzahl heißt anderes Element.",
  },
  'chem-mis-isotope-more-neutrons': {
    detailed: String.raw`„Isotop“ beschreibt eine Beziehung zwischen Atomen desselben Elements, keine Eigenschaft eines einzelnen Atoms. Wie viele Neutronen im Vergleich zu den Protonen vorliegen, spielt dafür keine Rolle. Gewöhnlicher Wasserstoff $\ce{^{1}_{1}H}$ hat gar kein Neutron und ist trotzdem ein Isotop des Wasserstoffs, ebenso $\ce{^{12}_{6}C}$ mit gleich vielen Neutronen wie Protonen.`,
    short: "Auch Atome mit weniger oder gleich vielen Neutronen wie Protonen sind Isotope.",
  },
  'chem-mis-isotope-electrons': {
    detailed: "Eine andere Elektronenzahl als Protonenzahl hat ein Ion; das unterscheidet ein Ion vom ungeladenen Atom, nicht zwei Isotope voneinander. Isotope eines Elements haben gleich viele Protonen und als ungeladene Atome deshalb auch gleich viele Elektronen. Der Unterschied zwischen Isotopen steckt im Kern.",
    short: "Eine andere Elektronenzahl macht ein Ion, kein Isotop.",
  },
  'chem-mis-isotope-same-a': {
    detailed: String.raw`Die Massenzahl ist die Summe aus Protonen und Neutronen. Ändert sich die Neutronenzahl, während die Massenzahl gleich bleibt, muss sich die Protonenzahl genau entgegengesetzt ändern. Dann liegen Atome verschiedener Elemente vor, wie $\ce{^{40}_{18}Ar}$ und $\ce{^{40}_{20}Ca}$, und keine Isotope eines Elements.`,
    short: "Gleiche Massenzahl bei anderer Neutronenzahl heißt andere Protonenzahl, also anderes Element.",
  },
  'chem-mis-isotope-chemistry-differs': {
    detailed: String.raw`Das chemische Verhalten bestimmen die Elektronen der Hülle, denn nur sie werden bei Reaktionen abgegeben, aufgenommen oder geteilt. Isotope eines Elements haben dieselbe Elektronenhülle und reagieren deshalb nahezu gleich: $\ce{^{12}C}$ und $\ce{^{13}C}$ verbrennen beide zu $\ce{CO2}$. Kleine Unterschiede, etwa in der Geschwindigkeit einer Reaktion, merkt man fast nur beim Wasserstoff, dessen Isotope sich in der Masse stark unterscheiden.`,
    short: "Gleiche Elektronenhülle, nahezu gleiches chemisches Verhalten.",
  },
  'chem-mis-ion-changes-nucleus': {
    detailed: "Bei chemischen Vorgängen bleibt der Atomkern unverändert: Protonen- und Neutronenzahl ändern sich nicht. Bekäme ein Atom ein Proton hinzu, wäre es ein Atom eines anderen Elements und kein Ion. Ionen entstehen durch Vorgänge in der Hülle.",
    short: "Der Kern bleibt bei der Ionenbildung gleich; ein Proton mehr wäre ein anderes Element.",
  },
  'chem-mis-ion-sign-reversed': {
    detailed: "Elektronen tragen negative Ladung. Ein Teilchen mit weniger negativen als positiven Ladungen kann nach außen nicht negativ geladen sein. Das Vorzeichen der Ionenladung sagt, welche Ladungsart überwiegt.",
    short: "Wer negative Elektronen verliert, wird nicht negativ.",
  },
  'chem-mis-ion-charge-ignored': {
    detailed: String.raw`Gleich viele Elektronen wie Protonen hat nur ein ungeladenes Atom; dann heben sich die Ladungen genau auf. Ein Ion trägt eine Ladung, und genau die zeigt, dass Elektronen- und Protonenzahl verschieden sind. Die Ladungszahl am Symbol, etwa die 2 in $\ce{Mg^2+}$, sagt, um wie viele.`,
    short: "Die Ladung eines Ions zeigt, dass Elektronen- und Protonenzahl verschieden sind.",
  },
  'chem-mis-nucleus-large': {
    detailed: "Das passt nicht zum Streuversuch: Fast alle Alpha-Teilchen fliegen ungehindert durch eine Goldfolie, nur sehr wenige treffen auf etwas, das sie stark ablenkt. Wäre der Kern so groß, würden viel mehr Teilchen abgelenkt. Sein Durchmesser ist um mehrere Zehnerpotenzen kleiner als der des Atoms.",
    short: "Im Streuversuch fliegen fast alle Teilchen durch: Der Kern ist winzig.",
  },
  'chem-mis-model-mixup': {
    detailed: "Jedes Atommodell enthält nur, was die Versuche bis dahin zeigten. Thomson kannte die Elektronen und wusste, dass ein Atom insgesamt ungeladen ist; die positive Ladung stellte er sich gleichmäßig über das ganze Atom verteilt vor. Dass sie in einem winzigen Kern steckt, zeigte erst ein späterer Versuch.",
    short: "Jedes Modell enthält nur, was die Versuche seiner Zeit zeigten; bei Thomson gibt es keinen Kern.",
  },
  'chem-mis-model-explains-too-much': {
    detailed: "Im Modell von Rutherford kreisen die Elektronen irgendwo in der Hülle; eine Regel für ihre Energie gibt es dort nicht, und daraus folgt kein Linienspektrum. Das Modell erklärt nicht einmal, warum ein kreisendes Elektron nicht ständig Energie abstrahlt und in den Kern stürzt. Gerade diese Lücken waren der Anlass für ein neues Modell.",
    short: "Rutherfords Modell kennt keine festen Energien der Elektronen und erklärt keine Spektrallinien.",
  },
  'chem-mis-scatter-misread': {
    detailed: "Würden die meisten Teilchen abgelenkt, müsste fast überall in der Folie etwas Schweres im Weg sein. Der Leuchtschirm hinter der Folie zeigte ein anderes Bild, und daraus folgte, dass ein Atom zum allergrößten Teil leer ist. Nur wer dem winzigen, positiv geladenen Kern sehr nahe kommt, wird stark abgestoßen.",
    short: "Fast alle Teilchen flogen ungehindert durch: Das Atom ist größtenteils leer.",
  },
  'chem-mis-orbital-is-path': {
    detailed: "Für eine Bahn müsste man zu jedem Zeitpunkt Ort und Geschwindigkeit des Elektrons kennen. Beides zugleich genau festzulegen, ist nach der Unschärferelation grundsätzlich unmöglich. Ein Orbital gibt deshalb nur an, in welchem Raumbereich sich das Elektron mit hoher Wahrscheinlichkeit aufhält; feste Kreisbahnen gehören zum älteren Modell von Bohr.",
    short: "Ein Orbital ist ein Bereich, in dem das Elektron wahrscheinlich ist, keine Bahn.",
  },
  'chem-mis-uncertainty-instrument': {
    detailed: String.raw`Die Unschärfe liegt nicht am Messgerät, sondern daran, dass sich das Elektron auch wie eine Welle verhält, und eine Welle hat keinen scharf begrenzten Ort. Je genauer der Ort festliegt, desto unbestimmter wird der Impuls $m \cdot v$. Auch ein perfektes Messgerät kommt nicht unter die Grenze $\Delta x \cdot \Delta(m \cdot v) \geq \frac{h}{4\pi}$.`,
    short: "Die Unschärfe ist eine Grenze der Natur, kein Fehler der Geräte.",
  },
  'chem-mis-longer-wavelength-more-energy': {
    detailed: String.raw`In $E = \frac{h \cdot c}{\lambda}$ steht die Wellenlänge im Nenner: Wird $\lambda$ größer, wird $E$ kleiner; doppelte Wellenlänge heißt halbe Energie. Bei der Frequenz ist es umgekehrt, denn nach $E = h \cdot f$ wächst die Energie mit $f$.`,
    short: String.raw`$\lambda$ steht im Nenner: Längere Wellenlänge heißt weniger Energie.`,
  },
  'chem-mis-line-spectrum-continuous': {
    detailed: "Elektronen im Atom können nur bestimmte Energien haben. Fällt ein Elektron von einem höheren auf ein niedrigeres Niveau, gibt das Atom genau die Differenz als Licht einer Wellenlänge ab; weil es nur wenige solche Differenzen gibt, entstehen einzelne Linien. Ein lückenloses Farbband liefern glühende Feststoffe wie der Draht einer Glühlampe.",
    short: "Feste Energieniveaus erlauben nur einzelne Wellenlängen: Linien statt Band.",
  },
  'chem-mis-emission-on-excitation': {
    detailed: "Für einen Sprung nach oben braucht das Elektron Energie, etwa aus einer Flamme oder aus Licht, das es dabei aufnimmt (Absorption). Licht aussenden (Emission) kann das Atom erst, wenn das Elektron wieder auf ein niedrigeres Niveau zurückfällt. Die abgegebene Energie entspricht dem Abstand der beiden Niveaus.",
    short: "Nach oben kostet Energie (Absorption), nach unten wird Energie frei (Emission).",
  },
  'chem-mis-wave-or-particle-only': {
    detailed: String.raw`Beide zeigen je nach Versuch beide Seiten (Welle-Teilchen-Dualismus). Licht wird nur in Portionen der Energie $E = h \cdot f$ aufgenommen und abgegeben; so verhalten sich Teilchen. Elektronen erzeugen hinter einem Doppelspalt ein Muster aus hellen und dunklen Streifen (Interferenz), wie es nur Wellen tun.`,
    short: "Licht und Elektronen zeigen beide Wellen- und Teilcheneigenschaften.",
  },
  'chem-mis-de-broglie-c': {
    detailed: "Ein Elektron oder ein anderes Teilchen mit Masse ist immer langsamer als Licht. In die Wellenlänge nach de Broglie gehört deshalb seine eigene Geschwindigkeit, nicht die des Lichts. Mit $c$ bekäme man für ein langsames Teilchen eine viel zu kleine Wellenlänge.",
    short: "Ein Teilchen mit Masse ist nie so schnell wie Licht: Es zählt seine eigene Geschwindigkeit.",
  },
  'chem-mis-molecule-is-compound': {
    detailed: String.raw`Ob ein Stoff ein Element oder eine Verbindung ist, hängt davon ab, wie viele Atomsorten er enthält, nicht wie viele Atome ein Teilchen hat. In $\ce{O2}$ sind zwei Atome derselben Sorte gebunden, also ist Sauerstoff ein Element. Umgekehrt besteht Kochsalz $\ce{NaCl}$ nicht aus Molekülen und ist trotzdem eine Verbindung.`,
    short: "Es zählt die Zahl der Atomsorten, nicht die Zahl der Atome in einem Teilchen.",
  },
  'chem-mis-mass-gained': {
    detailed: "Der Sauerstoff, den ein Stoff bei der Reaktion bindet, war vorher schon als Gas im Gefäß und wurde mitgewogen. Durch die Wand eines geschlossenen Gefäßes kommt kein Atom hinzu. Schwerer wird eine Probe nur in einem offenen Gefäß, in das zum Beispiel Sauerstoff aus der Luft nachströmen kann.",
    short: "Der gebundene Sauerstoff war schon im Gefäß und wurde mitgewogen.",
  },
  'chem-mis-nucleus-all-positive': {
    detailed: String.raw`Der Kern ist positiv, aber nur ein Teil seiner Teilchen trägt diese Ladung. Wäre jedes Kernteilchen positiv, müsste die Kernladung mit der Massenzahl wachsen. Tatsächlich haben $\ce{^{12}_{6}C}$ und $\ce{^{14}_{6}C}$ dieselbe Kernladung, obwohl der zweite Kern zwei Teilchen mehr hat.`,
    short: "Gleiche Kernladung bei verschieden vielen Kernteilchen: Nicht jedes Kernteilchen ist geladen.",
  },
  'chem-mis-proton-neutron-swap': {
    detailed: "Hier sind die beiden Kernteilchen vertauscht. Der Name des ungeladenen Teilchens leitet sich von „neutral“ ab. Die Ordnungszahl heißt auch Kernladungszahl, weil sie die geladenen Teilchen im Kern zählt.",
    short: "Der Name „Neutron“ kommt von neutral.",
  },
  'chem-mis-neutron-light': {
    detailed: "Ladung und Masse sind zwei verschiedene Eigenschaften; ob ein Teilchen geladen ist, sagt nichts über sein Gewicht. Gemessen ist das Neutron sogar ein wenig schwerer als das Proton.",
    short: "Ladung und Masse hängen nicht zusammen.",
  },
  'chem-mis-u-gram-kilogram': {
    detailed: "Der Exponent $-27$ gehört zur Einheit Kilogramm. Ein Kilogramm sind tausend Gramm; rechnet man in die kleinere Einheit Gramm um, muss die Maßzahl größer werden.",
    short: "Mit $10^{-27}$ ist die Masse in Kilogramm angegeben, nicht in Gramm.",
  },
  'chem-mis-charge-as-mass': {
    detailed: String.raw`Die Zahl $1{,}602 \cdot 10^{-19}$ gehört zur Elementarladung, also zur Ladung eines Protons in Coulomb. Ladung und Masse sind verschiedene Größen mit verschiedenen Einheiten; der Wert der einen ist nie ein Wert der anderen.`,
    short: String.raw`$1{,}602 \cdot 10^{-19}\,\mathrm{C}$ ist eine Ladung, keine Masse.`,
  },
  'chem-mis-neutral-no-charges': {
    detailed: String.raw`Nach außen ungeladen heißt nur, dass sich die Ladungen im Inneren genau aufheben. Ein Atom ganz ohne geladene Teilchen gibt es nicht; schon das einfachste, $\ce{^{1}_{1}H}$, besteht aus zwei geladenen Teilchen.`,
    short: "Ungeladen heißt: Die Ladungen heben sich auf, nicht: Es gibt keine.",
  },
  'chem-mis-pse-by-mass': {
    detailed: String.raw`Nach der Atommasse sortiert stünde Kalium ($39{,}1\,\mathrm{u}$) vor Argon ($39{,}9\,\mathrm{u}$); im Periodensystem kommt aber Argon mit der Ordnungszahl 18 zuerst. Die Ordnungszahl richtet sich nach einer Teilchenzahl im Kern, nicht nach der Masse.`,
    short: "Argon ist schwerer als Kalium und steht trotzdem vor ihm.",
  },
  'chem-mis-isotope-radioactive': {
    detailed: String.raw`„Isotop“ sagt nur, dass Atome dieselbe Protonenzahl, aber verschiedene Neutronenzahlen haben. Ob ein Kern stabil ist oder zerfällt, ist eine andere Frage: Kohlenstoff hat die stabilen Isotope $\ce{^{12}_{6}C}$ und $\ce{^{13}_{6}C}$ und das radioaktive $\ce{^{14}_{6}C}$.`,
    short: "Auch stabile Atome sind Isotope ihres Elements.",
  },
  'chem-mis-size-means-mass': {
    detailed: "Aus der Größe eines Teils folgt nicht seine Masse, und aus der Masse nicht seine Größe. Wie viel Raum ein Teil des Atoms einnimmt, zeigt der Streuversuch; wie viel Masse er trägt, zeigen die Massen der Teilchen, aus denen er besteht.",
    short: "Schwer heißt nicht groß, und klein heißt nicht leicht.",
  },
  'chem-mis-model-limit-swap': {
    detailed: "Ein Atommodell wird gerade so gebaut, dass es die Versuche erklärt, aus denen es entstanden ist; darin liegt seine Stärke. Seine Grenzen sind Beobachtungen, die es offenlässt, meist aus anderen Versuchen. Frag dich also, ob das Modell für diese Beobachtung entwickelt wurde.",
    short: "Was ein Modell begründen sollte, erklärt es auch; seine Grenzen liegen woanders.",
  },
  'chem-mis-electron-radiates': {
    detailed: "Gäbe ein Elektron im Atom ständig Energie ab, geriete es immer weiter nach innen und stürzte schließlich in den Kern. Dann wären Atome nicht beständig; sie bleiben aber über lange Zeit unverändert. Licht gibt ein Atom nur ab, wenn ein Elektron von einem höheren auf ein niedrigeres Energieniveau wechselt.",
    short: "Ständige Abstrahlung ließe das Elektron in den Kern stürzen; Licht entsteht nur beim Wechsel des Niveaus.",
  },
  'chem-mis-scatter-gaps': {
    detailed: "In einem Metall liegen die Atome dicht an dicht, und selbst eine dünne Folie ist viele hundert Atomlagen dick. Einen Weg, der an allen Atomen vorbeiführt, gibt es darin nicht; jedes Teilchen muss durch sehr viele Atome hindurch.",
    short: "Die Atome liegen dicht an dicht; jedes Teilchen muss durch viele Atome hindurch.",
  },
  'chem-mis-alpha-neutral': {
    detailed: "Ein Alpha-Teilchen ist der Kern eines Heliumatoms aus zwei Protonen und zwei Neutronen; es trägt also die Ladung $+2$. Kommt es einem positiv geladenen Kern sehr nahe, wird es stark abgestoßen. Gerade wegen ihrer Ladung eignen sich Alpha-Teilchen, um die Ladung im Atom abzutasten.",
    short: "Alpha-Teilchen sind Heliumkerne mit der Ladung $+2$.",
  },
  'chem-mis-light-same-energy': {
    detailed: String.raw`Die Lichtgeschwindigkeit $c$ ist im Vakuum für alle Farben gleich; sie steht als feste Zahl in den Formeln. Was sich von Farbe zu Farbe ändert, sind Wellenlänge und Frequenz, und von ihnen hängt die Energie einer Portion ab: $E = h \cdot f = \frac{h \cdot c}{\lambda}$.`,
    short: String.raw`Gleiche Geschwindigkeit heißt nicht gleiche Frequenz; die Farben unterscheiden sich in $\lambda$ und $f$.`,
  },
  'chem-mis-wavelength-frequency-same': {
    detailed: String.raw`Für Licht gilt im Vakuum $c = \lambda \cdot f$, und die Geschwindigkeit $c$ ist dort für alle Farben gleich. Das Produkt aus Wellenlänge und Frequenz liegt also fest: Mit der einen Größe liegt auch die andere fest, und beide können nicht gemeinsam wachsen.`,
    short: String.raw`Das Produkt $\lambda \cdot f = c$ liegt fest: Beide hängen zusammen und wachsen nie gemeinsam.`,
  },
  'chem-mis-light-energy-square': {
    detailed: String.raw`In $E = \frac{h \cdot c}{\lambda}$ steht die Wellenlänge im Nenner, aber ohne Quadrat. Quadrate kommen in der Rydberg-Formel vor; dort gehören sie zu den Nummern der Energieniveaus, nicht zur Wellenlänge.`,
    short: String.raw`In $E = \frac{h \cdot c}{\lambda}$ steht $\lambda$ ohne Quadrat.`,
  },
  'chem-mis-brightness-photon-energy': {
    detailed: String.raw`Bei Licht einer Farbe heißt heller: Es kommen in jeder Sekunde mehr Lichtportionen an. Wie viel Energie eine einzelne Portion trägt, legt allein ihre Frequenz fest, nach $E = h \cdot f$.`,
    short: "Die Helligkeit zählt die Portionen; die Energie je Portion hängt nur von der Frequenz ab.",
  },
  'chem-mis-lines-per-electron': {
    detailed: "Eine Spektrallinie gehört nicht zu einem bestimmten Elektron, sondern zu einem Sprung zwischen zwei Energieniveaus. Schon das eine Elektron des Wasserstoffatoms kann zwischen vielen Niveaus wechseln; deshalb zeigt Wasserstoff allein im sichtbaren Bereich mehrere Linien.",
    short: "Eine Linie gehört zu einem Sprung zwischen zwei Niveaus, nicht zu einem Elektron.",
  },
  'chem-mis-light-from-nucleus': {
    detailed: "In einer Flamme oder einer leuchtenden Gasröhre reicht die Energie bei weitem nicht, um am Kern etwas zu ändern; er bleibt, wie er ist. Licht dieser Art entsteht in der Hülle, wenn ein Elektron seinen Zustand wechselt.",
    short: "Der Kern bleibt in der Flamme unverändert; das Licht stammt aus der Hülle.",
  },
  'chem-mis-excitation-is-ionization': {
    detailed: "Beim Anregen bleibt das Elektron im Atom, nur auf einem höheren Niveau, und das Atom bleibt ungeladen. Erst wenn die zugeführte Energie reicht, das Elektron ganz vom Kern zu lösen, entsteht ein positives Ion; diese Energie heißt Ionisierungsenergie.",
    short: "Angeregt bleibt das Elektron im Atom; ein Ion entsteht erst, wenn es ganz abgelöst wird.",
  },
  'chem-mis-absorption-other-lines': {
    detailed: String.raw`Aufnahme und Abgabe von Licht gehören zu Sprüngen zwischen denselben Energieniveaus, einmal nach oben und einmal nach unten. Für beide Richtungen ist die Energiedifferenz gleich groß, nach $\Delta E = \frac{h \cdot c}{\lambda}$ also auch die Wellenlänge.`,
    short: "Hin- und Rücksprung zwischen denselben Niveaus haben dieselbe Energie, also dieselbe Wellenlänge.",
  },
  'chem-mis-particle-sign-as-wave': {
    detailed: "Masse, Ladung, einzelne Treffer auf einem Schirm oder eine Ablenkung im Feld zeigen, dass sich Elektronen wie Teilchen verhalten; eine geladene Kugel täte dasselbe. Für eine Welle braucht es ein Verhalten, das kein Kügelchen zeigen kann.",
    short: "Masse, Ladung und Ablenkung im Feld sind Kennzeichen von Teilchen, nicht von Wellen.",
  },
  'chem-mis-heavy-long-wave': {
    detailed: String.raw`In $\lambda = \frac{h}{m \cdot v}$ stehen Masse und Geschwindigkeit im Nenner. Wird einer von beiden größer, wird der Bruch kleiner, nicht größer.`,
    short: String.raw`Masse und Geschwindigkeit stehen im Nenner von $\lambda = \frac{h}{m \cdot v}$.`,
  },
  'chem-mis-matter-wave-only-small': {
    detailed: "Nach de Broglie gehört zu jedem bewegten Körper eine Wellenlänge, ganz gleich, wie groß er ist. Ob man von dieser Welle etwas bemerkt, ist eine andere Frage als die, ob es sie gibt.",
    short: "Nach de Broglie hat jeder bewegte Körper eine Wellenlänge.",
  },
  'chem-mis-element-fixed-neutrons': {
    detailed: "Fest ist für ein Element nur die Protonenzahl; sie legt fest, um welches Element es sich handelt. Die Neutronenzahl kann von Atom zu Atom verschieden sein: Magnesium kommt in der Natur mit 12, 13 und 14 Neutronen vor. Solche Atome heißen Isotope; man erkennt sie an verschiedenen Massenzahlen.",
    short: "Atome eines Elements können verschieden viele Neutronen haben; das zeigt die Massenzahl.",
  },
  'chem-mis-nucleus-no-repulsion': {
    detailed: "Die elektrische Kraft zwischen zwei Ladungen wird größer, je kleiner ihr Abstand ist. Gleich geladene Teilchen stoßen sich deshalb umso stärker ab, je näher sie einander kommen; im winzigen Kern ist die Abstoßung zwischen den Protonen besonders groß.",
    short: "Je näher sich gleiche Ladungen sind, desto stärker stoßen sie sich ab.",
  },
  'chem-mis-alpha-hit-electrons': {
    detailed: "Ein Alpha-Teilchen ist rund 7000-mal schwerer als ein Elektron. So wenig, wie ein Tischtennisball eine rollende Bowlingkugel zurückwirft, kann ein Elektron ein Alpha-Teilchen merklich ablenken.",
    short: "Elektronen sind viel zu leicht, um ein Alpha-Teilchen zurückzuwerfen.",
  },
  'chem-mis-spectra-all-same': {
    detailed: "Die Energieniveaus der Elektronen hängen von der Kernladung und der Zahl der Elektronen ab, und die sind bei jedem Element anders. Damit unterscheiden sich auch die Energiedifferenzen und so die Wellenlängen der Linien. Das Spektrum eines Elements ist deshalb so eindeutig wie ein Fingerabdruck; darauf beruhen Nachweise mit Atomspektroskopie.",
    short: "Jedes Element hat eigene Energieniveaus und damit eigene Linien.",
  },
  'chem-mis-uncertainty-reversed': {
    detailed: String.raw`In $\Delta x \cdot \Delta(m \cdot v) \geq \frac{h}{4\pi}$ steht ein Produkt aus zwei Unschärfen, das eine feste Grenze nicht unterschreiten kann. Ort und Impuls lassen sich deshalb nie beide zugleich beliebig genau festlegen; ein genauer bekannter Ort macht die Geschwindigkeit nicht ebenfalls genauer.`,
    short: "Das Produkt der beiden Unschärfen hat eine feste Untergrenze.",
  },
  'chem-mis-de-broglie-speed-only': {
    detailed: String.raw`In $\lambda = \frac{h}{m \cdot v}$ steht im Nenner das Produkt aus Masse und Geschwindigkeit, der Impuls. Zwei gleich schnelle Teilchen mit verschiedener Masse haben deshalb verschiedene Wellenlängen; die Masse zählt genauso wie die Geschwindigkeit.`,
    short: String.raw`Im Nenner steht $m \cdot v$: Die Masse zählt genauso wie die Geschwindigkeit.`,
  },
}
