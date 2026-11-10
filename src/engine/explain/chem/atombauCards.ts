import type { Card } from '../cards.ts'

// Lernkarten des Ordners „Atombau“ (Chemie 1), in eigenen Worten; Beispiele als Text

export const ATOMBAU_CARDS: readonly Card[] = [
  {
    id: 'atombau-stoffe',
    topic: 'chem-atombau',
    title: "Stoffe einteilen",
    level: 1,
    rules: [],
    formulas: [],
    memo: "Ein Reinstoff enthält nur einen Stoff und hat feste Kennwerte wie Siede- und Schmelztemperatur. Reinstoffe sind entweder Elemente (eine Atomsorte) oder Verbindungen (mehrere Elemente, chemisch gebunden). Ein Gemisch enthält mehrere Stoffe, die sich mit physikalischen Verfahren trennen lassen.",
    note: String.raw`Element: lässt sich durch keine chemische Reaktion weiter zerlegen und steht im Periodensystem.
Verbindung: feste Zusammensetzung und eigene Eigenschaften; zerlegen lässt sie sich nur durch eine chemische Reaktion.
Gemisch: Die Anteile können schwanken. Es kann einheitlich aussehen (Salzwasser, Luft, Messing) oder nicht (Sand in Wasser).
Auch Sauerstoff $\ce{O2}$ und Stickstoff $\ce{N2}$ sind Elemente: In ihren Molekülen sind nur Atome einer einzigen Sorte gebunden.`,
    when: "Wenn du einen Stoff einordnen sollst: Frag zuerst, ob nur ein Stoff vorliegt, dann, ob er sich chemisch weiter zerlegen lässt.",
    examples: [
      {
        chemTask: "Ordne ein: Kupfer, Wasser, Messing.",
        lines: [
          { label: "Kupfer: Element", latex: String.raw`\ce{Cu}` },
          { label: "Wasser: Verbindung aus Wasserstoff und Sauerstoff", latex: String.raw`\ce{H2O}` },
          { label: "Messing: Gemisch (Legierung) aus Kupfer und Zink" },
        ],
      },
      {
        chemTask: "Ist Salzwasser ein Reinstoff?",
        lines: [
          { label: "Es enthält zwei Stoffe: Wasser und gelöstes Kochsalz." },
          { label: "Der Salzanteil kann schwanken, je nachdem, wie viel Salz gelöst wurde." },
          { label: "Ergebnis: einheitlich aussehendes (homogenes) Gemisch, kein Reinstoff" },
        ],
      },
      {
        chemTask: "Was unterscheidet Wasser von einem Gemisch aus Wasserstoff und Sauerstoff?",
        lines: [
          { label: "Gemisch: zwei Gase nebeneinander, Anteile beliebig, bei passenden Anteilen mit einem Funken explosiv" },
          { label: "Wasser: die Elemente chemisch gebunden, immer zwei H-Atome je O-Atom", latex: String.raw`\ce{H2O}` },
          { label: "Wasser brennt nicht; es hat ganz andere Eigenschaften als seine Elemente." },
        ],
      },
    ],
    errors: ['chem-mis-compound-is-mixture', 'chem-mis-pure-means-element', 'chem-mis-element-compound-swap', 'chem-mis-mixture-as-pure', 'chem-mis-molecule-is-compound'],
  },
  {
    id: 'atombau-trennen',
    topic: 'chem-atombau',
    title: "Trennverfahren",
    level: 1,
    rules: [],
    formulas: [],
    memo: "Ein Gemisch trennt man, indem man einen Unterschied zwischen seinen Stoffen ausnutzt: Dichte, Teilchengröße, Löslichkeit, Siedetemperatur oder wie gut ein Stoff an einer Oberfläche haftet. Dabei entsteht kein neuer Stoff.",
    note: "Sedimentieren: Der Stoff mit der größeren Dichte sinkt nach unten und setzt sich ab (Dichte).\nDekantieren: Danach wird die Flüssigkeit darüber vorsichtig abgegossen (Dichte).\nZentrifugieren: Schnelles Drehen beschleunigt das Absetzen (Dichte).\nFiltrieren: Der Filter hält Teilchen zurück, die größer sind als seine Poren (Teilchengröße).\nExtrahieren: Ein Lösemittel löst einen Stoff heraus, die anderen bleiben zurück (Löslichkeit).\nEindampfen und Destillieren: Ein Stoff verdampft früher als der andere (Siedetemperatur).\nAdsorbieren und Chromatografieren: Stoffe haften verschieden stark an einer Oberfläche wie Aktivkohle oder Papier (Anhaften).",
    when: "Wenn ein Stoff aus einem Gemisch gewonnen werden soll: Frag zuerst, worin sich die Stoffe unterscheiden.",
    examples: [
      {
        chemTask: "Wie trennst du Sand von Wasser?",
        lines: [
          { label: "Die Sandkörner sind größer als die Poren im Filterpapier." },
          { label: "Filtrieren: Der Sand bleibt im Filter, das Wasser läuft hindurch." },
          { label: "Genutzter Unterschied: Teilchengröße" },
        ],
      },
      {
        chemTask: "Wie gewinnst du das Salz aus Salzwasser?",
        lines: [
          { label: "Gelöstes Salz geht durch jeden Filter." },
          { label: "Eindampfen: Das Wasser verdampft, das Salz bleibt zurück." },
          { label: "Genutzter Unterschied: Siedetemperatur" },
        ],
      },
      {
        chemTask: "Wie reicherst du Alkohol aus einem Gemisch mit Wasser an?",
        lines: [
          { label: "Ethanol siedet bei etwa 78 °C, Wasser erst bei 100 °C." },
          { label: "Destillieren: Beim Erhitzen geht vor allem Ethanol in den Dampf über; der Kühler macht ihn wieder flüssig." },
          { label: "Genutzter Unterschied: Siedetemperatur" },
        ],
      },
    ],
    errors: ['chem-mis-separation-principle', 'chem-mis-dissolved-like-solid'],
  },
  {
    id: 'atombau-vorgaenge',
    topic: 'chem-atombau',
    title: "Physikalisch oder chemisch",
    level: 1,
    rules: [],
    formulas: [],
    memo: "Bei einem physikalischen Vorgang bleibt der Stoff derselbe, nur sein Zustand ändert sich. Bei einer chemischen Reaktion entsteht ein neuer Stoff mit neuen Eigenschaften. Die Gesamtmasse bleibt dabei erhalten, denn die Atome werden nur neu verknüpft.",
    note: "Physikalisch: schmelzen, verdampfen, kondensieren, Zucker in Wasser lösen, ein Draht glüht im Stromkreis.\nChemisch: verbrennen, rosten, eine Brausetablette in Wasser (es entsteht ein Gas, das vorher nicht da war).\nLicht, Wärme oder eine Farbänderung allein beweisen keine Reaktion; entscheidend ist der neue Stoff.",
    examples: [
      {
        chemTask: "Der Draht einer Glühlampe leuchtet hell. Physikalisch oder chemisch?",
        lines: [
          { label: "Der Strom macht den Draht heiß, und er gibt Licht ab." },
          { label: "Nach dem Ausschalten ist es derselbe Draht wie vorher." },
          { label: "Ergebnis: physikalischer Vorgang, es entsteht kein neuer Stoff" },
        ],
      },
      {
        chemTask: "Holzkohle verbrennt im Grill und wird dabei immer weniger. Physikalisch oder chemisch?",
        lines: [
          { label: "Der Kohlenstoff reagiert mit Sauerstoff aus der Luft.", latex: String.raw`\ce{C + O2 -> CO2}` },
          { label: "Kohlenstoffdioxid ist ein neuer Stoff, ein unsichtbares Gas, das entweicht." },
          { label: "Ergebnis: chemische Reaktion. Die Kohle wird leichter, weil das Gas entweicht; die Gesamtmasse bleibt erhalten." },
        ],
      },
      {
        chemTask: "In einem fest verschlossenen Kolben auf einer Waage reagieren zwei Stoffe. Was zeigt die Waage?",
        lines: [
          { label: "Die Atome werden nur neu verknüpft, keines geht verloren." },
          { label: "Kein Gas kann entweichen und keines von außen hinzukommen." },
          { label: "Die Masse vorher und nachher ist gleich." },
        ],
      },
    ],
    errors: ['chem-mis-physical-as-chemical', 'chem-mis-chemical-as-physical', 'chem-mis-mass-lost', 'chem-mis-mass-gained'],
  },
  {
    id: 'atombau-teilchen',
    topic: 'chem-atombau',
    title: "Elementarteilchen",
    level: 1,
    rules: [],
    formulas: [String.raw`m(\ce{p+}) \approx m(\ce{n^0}) \approx 1\,\mathrm{u}`, String.raw`m(\ce{e-}) \approx \frac{m(\ce{p+})}{1836}`, String.raw`1\,\mathrm{u} \approx 1{,}66 \cdot 10^{-24}\,\mathrm{g}`],
    memo: String.raw`Proton: positiv geladen, etwa $1\,\mathrm{u}$, im Kern. Neutron: ungeladen, etwa $1\,\mathrm{u}$, im Kern. Elektron: negativ geladen, rund 1800-mal leichter als ein Proton, in der Hülle. Proton und Elektron tragen gleich große Ladungen mit entgegengesetztem Vorzeichen.`,
    note: String.raw`Jedes Proton trägt genau eine Elementarladung, $e = 1{,}602 \cdot 10^{-19}\,\mathrm{C}$; jedes Ion trägt ein ganzzahliges Vielfaches davon. Das Neutron ist ein klein wenig schwerer als das Proton. Ein Atom ist nach außen ungeladen, wenn es gleich viele Elektronen wie Protonen hat. Protonen und Neutronen sind aus noch kleineren Bausteinen aufgebaut (Quarks), das Elektron nicht.`,
    examples: [
      {
        chemTask: "Ordne Ladung und Ort zu: Proton, Neutron, Elektron.",
        lines: [
          { label: "Proton: positiv, im Kern", latex: String.raw`\ce{p+}` },
          { label: "Neutron: ungeladen, im Kern", latex: String.raw`\ce{n^0}` },
          { label: "Elektron: negativ, in der Hülle", latex: String.raw`\ce{e-}` },
        ],
      },
      {
        chemTask: String.raw`Welchen Anteil an der Masse eines Wasserstoffatoms $\ce{^{1}_{1}H}$ hat sein Elektron?`,
        lines: [
          { label: "Das Proton ist rund 1836-mal schwerer als das Elektron.", latex: String.raw`m(\ce{p+}) \approx 1836 \cdot m(\ce{e-})` },
          { label: "Anteil des Elektrons", latex: String.raw`\frac{1}{1837} \approx 0{,}05\,\%` },
          { label: "Selbst hier trägt das Elektron praktisch nichts zur Masse bei." },
        ],
      },
      {
        chemTask: "Ein Atom hat 9 Protonen und ist nach außen ungeladen. Wie viele Elektronen hat es?",
        lines: [
          { label: "Ungeladen heißt: Positive und negative Ladungen heben sich auf." },
          { label: "Jedes Elektron gleicht genau ein Proton aus." },
          { label: "Ergebnis: 9 Elektronen (es ist ein Fluoratom)" },
        ],
      },
    ],
    errors: ['chem-mis-particle-charges', 'chem-mis-electron-mass', 'chem-mis-particle-place', 'chem-mis-neutron-balances-charge', 'chem-mis-nucleus-all-positive', 'chem-mis-proton-neutron-swap', 'chem-mis-neutron-light', 'chem-mis-u-gram-kilogram', 'chem-mis-charge-as-mass', 'chem-mis-neutral-no-charges'],
  },
  {
    id: 'atombau-kernsymbol',
    topic: 'chem-atombau',
    title: "Kernsymbol lesen",
    level: 1,
    rules: [],
    formulas: [String.raw`\ce{^{A}_{Z}X}`, "A = Z + N", "N = A - Z"],
    memo: "Unten links steht die Ordnungszahl $Z$, die Zahl der Protonen; sie legt das Element fest. Oben links steht die Massenzahl $A$, die Zahl der Protonen und Neutronen zusammen. Die Neutronenzahl ist die Differenz $N = A - Z$. Im ungeladenen Atom gibt es so viele Elektronen wie Protonen.",
    note: "Ordnungszahl, Protonenzahl und Kernladungszahl sind drei Namen für dieselbe Zahl. Sie gehört fest zum Element und steht im Periodensystem; die Massenzahl gehört dagegen zu einem bestimmten Isotop.\nDas Periodensystem ist nach der Ordnungszahl geordnet, nicht nach der Masse: Argon (18) steht vor Kalium (19), obwohl ein Argonatom im Mittel schwerer ist.",
    examples: [
      {
        chemTask: String.raw`Lies das Kernsymbol $\ce{^{27}_{13}Al}$.`,
        lines: [
          { label: "Protonen", latex: "Z = 13" },
          { label: "Neutronen", latex: "N = 27 - 13 = 14" },
          { label: "Elektronen im ungeladenen Atom", latex: "13" },
        ],
      },
      {
        chemTask: "Ein Atom hat 16 Protonen und 18 Neutronen. Wie lautet sein Kernsymbol?",
        lines: [
          { label: "Ordnungszahl 16: Schwefel", latex: "Z = 16" },
          { label: "Massenzahl", latex: "A = 16 + 18 = 34" },
          { label: "Kernsymbol", latex: String.raw`\ce{^{34}_{16}S}` },
        ],
      },
      {
        chemTask: String.raw`Welches Element verbirgt sich hinter $\ce{^{40}_{20}X}$?`,
        lines: [
          { label: "Entscheidend ist die untere Zahl, die Protonenzahl.", latex: "Z = 20" },
          { label: "Ordnungszahl 20 im Periodensystem: Calcium", latex: String.raw`\ce{^{40}_{20}Ca}` },
          { label: "Die obere Zahl ist die Massenzahl; sie verrät das Element nicht." },
        ],
      },
    ],
    errors: ['chem-mis-neutrons-equal-a', 'chem-mis-z-meaning', 'chem-mis-a-without-neutrons', 'chem-mis-element-not-by-protons', 'chem-mis-pse-by-mass'],
  },
  {
    id: 'atombau-isotope',
    topic: 'chem-atombau',
    title: "Isotope",
    level: 1,
    rules: [],
    formulas: [String.raw`\ce{^{1}_{1}H},\ \ce{^{2}_{1}H},\ \ce{^{3}_{1}H}`, String.raw`\ce{^{12}_{6}C},\ \ce{^{13}_{6}C},\ \ce{^{14}_{6}C}`],
    memo: "Isotope sind Atome desselben Elements mit verschieden vielen Neutronen. Sie haben dieselbe Ordnungszahl, aber verschiedene Massenzahlen. Weil ihre Elektronenhülle gleich ist, verhalten sie sich chemisch nahezu gleich.",
    note: String.raw`Viele Elemente kommen in der Natur als Gemisch mehrerer Isotope vor. Manche Isotope sind stabil, andere zerfallen radioaktiv, etwa $\ce{^{14}_{6}C}$ und $\ce{^{3}_{1}H}$. Die drei Isotope des Wasserstoffs haben eigene Namen: Protium, Deuterium und Tritium.`,
    examples: [
      {
        chemTask: String.raw`Sind $\ce{^{24}_{12}Mg}$ und $\ce{^{26}_{12}Mg}$ Isotope?`,
        lines: [
          { label: "Gleiche Ordnungszahl, beide sind Magnesium", latex: "Z = 12" },
          { label: "Verschiedene Neutronenzahlen", latex: String.raw`N = 12 \text{ und } N = 14` },
          { label: "Ergebnis: ja, zwei Isotope des Magnesiums" },
        ],
      },
      {
        chemTask: String.raw`Sind $\ce{^{40}_{18}Ar}$ und $\ce{^{40}_{20}Ca}$ Isotope?`,
        lines: [
          { label: "Gleiche Massenzahl", latex: "A = 40" },
          { label: "Verschiedene Ordnungszahlen", latex: String.raw`Z = 18 \text{ und } Z = 20` },
          { label: "Ergebnis: nein, das sind zwei verschiedene Elemente" },
        ],
      },
      {
        chemTask: "Warum reagiert Wasser aus Deuterium fast genauso wie gewöhnliches Wasser?",
        lines: [
          { label: "Deuterium hat ein Neutron mehr im Kern als gewöhnlicher Wasserstoff.", latex: String.raw`\ce{^{2}_{1}H}` },
          { label: "Die Hülle ist dieselbe: ein Elektron." },
          { label: "Das chemische Verhalten bestimmt die Hülle, darum reagieren beide fast gleich." },
        ],
      },
    ],
    errors: ['chem-mis-isotope-protons', 'chem-mis-isotope-more-neutrons', 'chem-mis-isotope-electrons', 'chem-mis-isotope-same-a', 'chem-mis-isotope-chemistry-differs', 'chem-mis-isotope-radioactive', 'chem-mis-element-fixed-neutrons'],
  },
  {
    id: 'atombau-ionen',
    topic: 'chem-atombau',
    title: "Ionen",
    level: 2,
    rules: [],
    formulas: [String.raw`\text{Elektronen} = Z - q`],
    memo: "Ein Ion ist ein Atom oder eine Atomgruppe mit Ladung. Es entsteht, wenn Elektronen abgegeben oder aufgenommen werden; der Kern bleibt dabei unverändert. Wer Elektronen abgibt, wird zum positiven Ion (Kation), wer welche aufnimmt, zum negativen Ion (Anion).",
    note: String.raw`Die Ladungszahl $q$ steht oben rechts, mit Vorzeichen: $\ce{Mg^2+}$ hat $q = +2$, $\ce{Cl-}$ hat $q = -1$. Ein Ion kann genauso viele Elektronen haben wie ein Atom eines anderen Elements, etwa $\ce{Cl-}$ und $\ce{K+}$ je 18 wie Argon. Welches Element es ist, sagt trotzdem allein die Protonenzahl.`,
    when: "Wenn ein Kernsymbol eine Ladung trägt: Protonen und Neutronen wie beim Atom, nur die Elektronenzahl ändert sich.",
    examples: [
      {
        chemTask: String.raw`Lies $\ce{^{37}_{17}Cl^-}$.`,
        lines: [
          { label: "Protonen", latex: "Z = 17" },
          { label: "Neutronen", latex: "N = 37 - 17 = 20" },
          { label: "Elektronen: eins mehr als Protonen", latex: "17 - (-1) = 18" },
        ],
      },
      {
        chemTask: String.raw`Was ändert sich, wenn aus dem Atom $\ce{^{24}_{12}Mg}$ das Ion $\ce{Mg^2+}$ wird?`,
        lines: [
          { label: "Zwei Elektronen werden abgegeben.", latex: "12 - 2 = 10" },
          { label: "Protonen und Neutronen bleiben: je 12." },
          { label: "Die Massenzahl bleibt 24, das Element bleibt Magnesium." },
        ],
      },
      {
        chemTask: String.raw`Was haben $\ce{F-}$ und $\ce{Al^3+}$ gemeinsam?`,
        lines: [
          { label: "Fluor: 9 Protonen, ein Elektron aufgenommen", latex: "9 + 1 = 10" },
          { label: "Aluminium: 13 Protonen, drei Elektronen abgegeben", latex: "13 - 3 = 10" },
          { label: "Beide haben 10 Elektronen wie ein Neonatom, bleiben aber Fluor und Aluminium." },
        ],
      },
    ],
    errors: ['chem-mis-ion-changes-nucleus', 'chem-mis-ion-sign-reversed', 'chem-mis-ion-charge-ignored', 'chem-mis-element-not-by-protons'],
  },
  {
    id: 'atombau-kern-huelle',
    topic: 'chem-atombau',
    title: "Kern und Hülle",
    level: 2,
    rules: [],
    formulas: [String.raw`d_{\mathrm{Kern}} \approx 10^{-15}\ \text{bis}\ 10^{-14}\,\mathrm{m}`, String.raw`d_{\mathrm{Atom}} \approx 10^{-10}\,\mathrm{m}`],
    memo: String.raw`Der Kern ist winzig: rund $10^{-15}$ bis $10^{-14}\,\mathrm{m}$ gegen $10^{-10}\,\mathrm{m}$ für das ganze Atom, also etwa zehntausend- bis hunderttausendmal kleiner. Trotzdem steckt in ihm mehr als 99,9 Prozent der Masse. Die Hülle aus den leichten Elektronen nimmt fast den ganzen Raum ein und ist doch nahezu leer.`,
    note: "Vergleich: Wäre der Kern so groß wie eine Kirsche von einem Zentimeter, hätte das Atom einen Durchmesser von einigen hundert Metern bis zu einem Kilometer. Die Protonen im Kern stoßen sich elektrisch ab; zusammengehalten werden Protonen und Neutronen von der starken Kernkraft, die nur über sehr kurze Abstände wirkt.\nAlpha-Teilchen sind Heliumkerne aus zwei Protonen und zwei Neutronen, also zweifach positiv geladen. Eine Goldfolie ist viele hundert Atomlagen dick; jedes Alpha-Teilchen muss durch sehr viele Atome hindurch.",
    examples: [
      {
        chemTask: "Wie viel größer ist ein Atom als sein Kern?",
        lines: [
          { label: "Verhältnis der Durchmesser", latex: String.raw`\frac{10^{-10}\,\mathrm{m}}{10^{-15}\,\mathrm{m}} = 10^{5}` },
          { label: "Das Atom ist rund hunderttausendmal größer als sein Kern." },
        ],
      },
      {
        chemTask: String.raw`Wo steckt die Masse des Atoms $\ce{^{12}_{6}C}$?`,
        lines: [
          { label: "Kern: 6 Protonen und 6 Neutronen, je etwa 1 u", latex: String.raw`\approx 12\,\mathrm{u}` },
          { label: "Hülle: 6 Elektronen", latex: String.raw`\frac{6}{1836}\,\mathrm{u} \approx 0{,}003\,\mathrm{u}` },
          { label: "Fast die ganze Masse sitzt im winzigen Kern." },
        ],
      },
      {
        chemTask: "Warum fliegen fast alle Alpha-Teilchen durch eine dünne Goldfolie?",
        lines: [
          { label: "Ein Atom besteht fast nur aus der Hülle mit den leichten Elektronen." },
          { label: "Die Elektronen sind viel zu leicht, um ein Alpha-Teilchen merklich abzulenken." },
          { label: "Nur wer dem winzigen, positiv geladenen Kern sehr nahe kommt, wird stark abgestoßen." },
        ],
      },
    ],
    errors: ['chem-mis-nucleus-large', 'chem-mis-electron-mass', 'chem-mis-scatter-misread', 'chem-mis-size-means-mass', 'chem-mis-scatter-gaps', 'chem-mis-alpha-neutral', 'chem-mis-alpha-hit-electrons', 'chem-mis-nucleus-no-repulsion'],
  },
  {
    id: 'atombau-modelle',
    topic: 'chem-atombau',
    title: "Atommodelle",
    level: 2,
    rules: [],
    formulas: [],
    memo: "Jedes Atommodell erklärt die Versuche seiner Zeit und wurde abgelöst, als neue Beobachtungen nicht mehr dazu passten. Die Reihenfolge: Dalton, Thomson, Rutherford, Bohr, Orbitalmodell.",
    note: "Dalton (Anfang des 19. Jahrhunderts): Atome sind unteilbare Kugeln, für jedes Element eine eigene Sorte. Grenze: kein innerer Aufbau, keine Ladungen.\nThomson (um 1900): Elektronen stecken in einer gleichmäßig positiv geladenen Kugel. Grenze: kein Kern, die Rückstreuung im Streuversuch bleibt unerklärt.\nRutherford (1911): winziger positiver Kern mit fast der ganzen Masse, um ihn herum eine große, fast leere Hülle mit den Elektronen. Grenze: erklärt weder die Linienspektren noch, warum die kreisenden Elektronen nicht in den Kern fallen.\nBohr (1913): Elektronen auf Bahnen mit festen Energien; beim Sprung zwischen zwei Bahnen wird Energie aufgenommen oder als Licht abgegeben. Grenze: stimmt genau nur für Teilchen mit einem einzigen Elektron wie das Wasserstoffatom und erklärt nicht, wie sich Spektrallinien im Magnetfeld aufspalten.\nOrbitalmodell (Schrödinger, 1926): Die Elektronen werden als stehende Wellen beschrieben; ein Orbital ist ein Raumbereich, in dem das Elektron wahrscheinlich anzutreffen ist, keine Bahn.",
    examples: [
      {
        chemTask: "Welche Beobachtung passte nicht mehr zum Modell von Thomson?",
        lines: [
          { label: "Im Streuversuch prallten einige Alpha-Teilchen von der Goldfolie zurück." },
          { label: "Eine gleichmäßig verteilte positive Ladung könnte sie so stark nicht abstoßen." },
          { label: "Folgerung von Rutherford: Die positive Ladung sitzt in einem winzigen Kern." },
        ],
      },
      {
        chemTask: "Warum führte Bohr Bahnen mit festen Energien ein?",
        lines: [
          { label: "Wasserstoff sendet nur Licht einzelner Wellenlängen aus (Linienspektrum)." },
          { label: "Wären beliebige Energien erlaubt, wäre das Spektrum lückenlos." },
          { label: "Feste Energiestufen erklären die Linien: Jede Linie gehört zu einem Sprung zwischen zwei Stufen." },
        ],
      },
      {
        chemTask: "Bringe in die zeitliche Reihenfolge: Bohr, Dalton, Rutherford, Thomson.",
        lines: [
          { label: "1. Dalton: Atome als unteilbare Kugeln" },
          { label: "2. Thomson: positiv geladene Kugel mit eingebetteten Elektronen" },
          { label: "3. Rutherford: Kern aus dem Streuversuch" },
          { label: "4. Bohr: feste Energiestufen aus den Linienspektren" },
        ],
      },
    ],
    errors: ['chem-mis-model-mixup', 'chem-mis-model-explains-too-much', 'chem-mis-scatter-misread', 'chem-mis-orbital-is-path', 'chem-mis-model-limit-swap', 'chem-mis-electron-radiates', 'chem-mis-scatter-gaps', 'chem-mis-alpha-hit-electrons'],
  },
  {
    id: 'atombau-licht',
    topic: 'chem-atombau',
    title: "Energie des Lichts",
    level: 2,
    rules: [],
    formulas: [String.raw`E = h \cdot f = \frac{h \cdot c}{\lambda}`, String.raw`c = \lambda \cdot f`],
    memo: String.raw`Licht trägt seine Energie in Portionen (Photonen). Die Energie einer Portion wächst mit der Frequenz $f$ und sinkt mit der Wellenlänge $\lambda$: Kurzwelliges violettes Licht ist energiereicher als langwelliges rotes.`,
    note: String.raw`Werte: $h = 6{,}626 \cdot 10^{-34}\,\mathrm{J \cdot s}$ (Planck-Konstante), $c = 3{,}00 \cdot 10^{8}\,\mathrm{m/s}$ (Lichtgeschwindigkeit). Wellenlängen in nm vor dem Einsetzen in m umrechnen: $1\,\mathrm{nm} = 10^{-9}\,\mathrm{m}$. Sichtbares Licht reicht etwa von $400\,\mathrm{nm}$ (violett) bis $750\,\mathrm{nm}$ (rot).
Im Vakuum ist Licht jeder Farbe gleich schnell; die Farben unterscheiden sich in Wellenlänge und Frequenz. Wie hell Licht ist, hängt davon ab, wie viele Photonen je Sekunde ankommen; die Energie eines einzelnen Photons legt allein seine Frequenz fest.`,
    when: "Wenn Energie, Frequenz oder Wellenlänge von Licht gefragt sind, oder welches Licht energiereicher ist.",
    examples: [
      {
        chemTask: String.raw`Welche Energie hat eine Portion grünes Licht mit $\lambda = 500\,\mathrm{nm}$?`,
        lines: [
          { label: "Wellenlänge in Meter", latex: String.raw`\lambda = 5{,}00 \cdot 10^{-7}\,\mathrm{m}` },
          { label: "Frequenz", latex: String.raw`f = \frac{c}{\lambda} = 6{,}00 \cdot 10^{14}\,\mathrm{s}^{-1}` },
          { label: "Energie", latex: String.raw`E = h \cdot f \approx 3{,}98 \cdot 10^{-19}\,\mathrm{J}` },
        ],
      },
      {
        chemTask: String.raw`Licht A hat $\lambda = 400\,\mathrm{nm}$ (violett), Licht B $\lambda = 800\,\mathrm{nm}$ (nahes Infrarot). Welches ist energiereicher?`,
        lines: [
          { label: "Die Energie ist umgekehrt proportional zur Wellenlänge.", latex: String.raw`E \sim \frac{1}{\lambda}` },
          { label: "Halbe Wellenlänge heißt doppelte Energie.", latex: String.raw`E_{\mathrm{A}} = 2 \cdot E_{\mathrm{B}}` },
          { label: "Licht A ist energiereicher." },
        ],
      },
      {
        chemTask: String.raw`Eine helle rote Lampe ($700\,\mathrm{nm}$) und eine schwache violette ($400\,\mathrm{nm}$): Welche sendet die energiereicheren Photonen aus?`,
        lines: [
          { label: "Die Helligkeit sagt nur, wie viele Photonen in jeder Sekunde ankommen." },
          { label: "Die Energie eines einzelnen Photons hängt nur von der Wellenlänge ab.", latex: String.raw`E = \frac{h \cdot c}{\lambda}` },
          { label: "Verhältnis der Energien je Photon", latex: String.raw`\frac{E_{\mathrm{violett}}}{E_{\mathrm{rot}}} = \frac{700\,\mathrm{nm}}{400\,\mathrm{nm}} = 1{,}75` },
          { label: "Jedes violette Photon trägt mehr Energie, auch wenn die rote Lampe heller ist." },
        ],
      },
    ],
    errors: ['chem-mis-longer-wavelength-more-energy', 'chem-mis-wave-or-particle-only', 'chem-mis-light-same-energy', 'chem-mis-wavelength-frequency-same', 'chem-mis-light-energy-square', 'chem-mis-brightness-photon-energy'],
  },
  {
    id: 'atombau-spektren',
    topic: 'chem-atombau',
    title: "Linienspektrum",
    level: 2,
    rules: [],
    formulas: [String.raw`\Delta E = E_{\mathrm{oben}} - E_{\mathrm{unten}} = \frac{h \cdot c}{\lambda}`, String.raw`\frac{1}{\lambda} = R_{\mathrm{H}} \cdot \left(\frac{1}{n^2} - \frac{1}{m^2}\right)`],
    memo: "Ein Elektron im Atom kann nur bestimmte Energien haben. Fällt es auf ein niedrigeres Niveau, gibt das Atom genau die Energiedifferenz als Licht einer bestimmten Wellenlänge ab (Emission); für den Sprung nach oben muss es genau diese Energie aufnehmen (Absorption). Darum zeigt jedes Element einzelne Linien, die nur für dieses Element typisch sind.",
    note: String.raw`Emissionsspektrum: helle Linien auf dunklem Grund. Absorptionsspektrum: dunkle Linien in einem sonst lückenlosen Spektrum, bei Wellenlängen, bei denen das Element auch Licht aussendet. Lückenlos ist zum Beispiel das Licht einer Glühlampe im Prisma. Weil jedes Element eigene Linien hat, lassen sich Elemente an ihrem Spektrum erkennen (Atomemissions- und Atomabsorptionsspektroskopie). In der Rydberg-Formel für Wasserstoff ist $R_{\mathrm{H}} = 1{,}097 \cdot 10^{7}\,\mathrm{m}^{-1}$, $n$ das untere und $m$ das obere Niveau.
Beim Anregen bleibt das Elektron im Atom; erst wenn es ganz vom Kern gelöst wird, entsteht ein Ion. Das Licht stammt aus der Hülle, der Kern bleibt in Flamme und Gasröhre unverändert.`,
    examples: [
      {
        chemTask: "Welche Wellenlänge hat das Licht, wenn im Wasserstoffatom ein Elektron vom vierten auf das zweite Niveau fällt?",
        lines: [
          { label: "Rydberg-Formel, unteres Niveau 2, oberes Niveau 4", latex: String.raw`\frac{1}{\lambda} = 1{,}097 \cdot 10^{7}\,\mathrm{m}^{-1} \cdot \left(\frac{1}{4} - \frac{1}{16}\right) \approx 2{,}057 \cdot 10^{6}\,\mathrm{m}^{-1}` },
          { label: "Kehrwert", latex: String.raw`\lambda \approx 4{,}86 \cdot 10^{-7}\,\mathrm{m} = 486\,\mathrm{nm}` },
          { label: "Das ist eine blaugrüne Linie im sichtbaren Spektrum des Wasserstoffs." },
        ],
      },
      {
        chemTask: String.raw`Natriumdampf leuchtet gelb bei $589\,\mathrm{nm}$. Wo liegt seine dunkle Linie im Absorptionsspektrum?`,
        lines: [
          { label: "Die gelbe Linie gehört zum Sprung zwischen dem untersten und dem nächsthöheren Niveau." },
          { label: "Nach oben und nach unten geht es um dieselbe Energiedifferenz, also um dieselbe Wellenlänge." },
          { label: "Die dunkle Linie liegt ebenfalls bei", latex: String.raw`589\,\mathrm{nm}` },
        ],
      },
      {
        chemTask: "Warum zeigt Wasserstoff im sichtbaren Bereich nur wenige einzelne Linien?",
        lines: [
          { label: "Die Elektronen können nur feste Energieniveaus besetzen." },
          { label: "Jeder Sprung hat seine feste Energie und damit seine feste Wellenlänge." },
          { label: "Sichtbares Licht liefern nur Sprünge auf das zweite Niveau, und davon nur wenige." },
        ],
      },
    ],
    errors: ['chem-mis-line-spectrum-continuous', 'chem-mis-emission-on-excitation', 'chem-mis-lines-per-electron', 'chem-mis-light-from-nucleus', 'chem-mis-excitation-is-ionization', 'chem-mis-absorption-other-lines', 'chem-mis-spectra-all-same', 'chem-mis-electron-radiates'],
  },
  {
    id: 'atombau-welle-teilchen',
    topic: 'chem-atombau',
    title: "Welle und Teilchen",
    level: 2,
    rules: [],
    formulas: [String.raw`\lambda = \frac{h}{m \cdot v}`, String.raw`\Delta x \cdot \Delta(m \cdot v) \geq \frac{h}{4\pi}`],
    memo: "Licht und Elektronen haben Eigenschaften von Wellen und von Teilchen (Welle-Teilchen-Dualismus). Jedes bewegte Teilchen hat eine Wellenlänge, die mit Masse und Geschwindigkeit kleiner wird. Ort und Impuls eines Elektrons lassen sich nie zugleich genau angeben; darum beschreibt ein Orbital nur, wo das Elektron wahrscheinlich ist.",
    note: String.raw`In $\lambda = \frac{h}{m \cdot v}$ (nach de Broglie) steht die Geschwindigkeit $v$ des Teilchens selbst, die Masse in kg. Wellenverhalten zeigt sich, wenn die Wellenlänge etwa so groß ist wie die Hindernisse, zum Beispiel die Abstände der Atome in einem Kristall; bei Gegenständen aus dem Alltag ist sie unmessbar klein.
Kennzeichen einer Welle ist die Interferenz, etwa helle und dunkle Streifen hinter einem Doppelspalt. Masse, Ladung und die Ablenkung im elektrischen Feld zeigen dagegen, dass sich Elektronen auch wie Teilchen verhalten.`,
    examples: [
      {
        chemTask: String.raw`Ein Elektron mit $m = 9{,}109 \cdot 10^{-31}\,\mathrm{kg}$ fliegt mit $v = 1{,}0 \cdot 10^{6}\,\mathrm{m/s}$. Welche Wellenlänge hat es?`,
        lines: [
          { label: "Einsetzen", latex: String.raw`\lambda = \frac{6{,}626 \cdot 10^{-34}\,\mathrm{J \cdot s}}{9{,}109 \cdot 10^{-31}\,\mathrm{kg} \cdot 1{,}0 \cdot 10^{6}\,\mathrm{m/s}}` },
          { label: "Ergebnis", latex: String.raw`\lambda \approx 7{,}3 \cdot 10^{-10}\,\mathrm{m}` },
          { label: "Das ist etwa so groß wie ein Atom; darum zeigen Elektronen Wellenverhalten." },
        ],
      },
      {
        chemTask: String.raw`Welche Wellenlänge hat ein Tennisball mit $58\,\mathrm{g}$ und $50\,\mathrm{m/s}$?`,
        lines: [
          { label: "Masse in kg", latex: String.raw`m = 0{,}058\,\mathrm{kg}` },
          { label: "Ergebnis", latex: String.raw`\lambda = \frac{6{,}626 \cdot 10^{-34}\,\mathrm{J \cdot s}}{0{,}058\,\mathrm{kg} \cdot 50\,\mathrm{m/s}} \approx 2{,}3 \cdot 10^{-34}\,\mathrm{m}` },
          { label: "Viel zu klein, um sie je zu beobachten" },
        ],
      },
      {
        chemTask: String.raw`Ein Elektron ist auf $\Delta x = 10^{-10}\,\mathrm{m}$ eingegrenzt. Wie genau ist seine Geschwindigkeit bekannt?`,
        lines: [
          { label: "Unschärfe des Impulses", latex: String.raw`\Delta(m \cdot v) \geq \frac{6{,}626 \cdot 10^{-34}\,\mathrm{J \cdot s}}{4\pi \cdot 10^{-10}\,\mathrm{m}} \approx 5{,}3 \cdot 10^{-25}\,\mathrm{kg \cdot m/s}` },
          { label: "Durch die Masse des Elektrons geteilt", latex: String.raw`\Delta v \geq 5{,}8 \cdot 10^{5}\,\mathrm{m/s}` },
          { label: "So unscharf, dass sich keine Bahn angeben lässt." },
        ],
      },
    ],
    errors: ['chem-mis-wave-or-particle-only', 'chem-mis-de-broglie-c', 'chem-mis-uncertainty-instrument', 'chem-mis-orbital-is-path', 'chem-mis-particle-sign-as-wave', 'chem-mis-heavy-long-wave', 'chem-mis-matter-wave-only-small', 'chem-mis-uncertainty-reversed', 'chem-mis-de-broglie-speed-only'],
  },
]
