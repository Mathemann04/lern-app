import type { Level } from '../engine/tasks/taskNumber.ts'

// Aufbau der App wie bei Brilliant: Fächer (Überschriften auf der Startseite) → Gebiete
// (Kacheln mit eigener Seite) → Themen (eigene Seite mit Stufen und „Üben"). Gebiete und Themen
// ohne spielbare Stufe stehen blass mit „kommt bald" da. Absichtlich ohne Mathe-Engine, damit die
// Startseite schnell lädt.

// Bild eines Gebiets oder Themas (AreaIcon.tsx); jedes Thema mit eigenem Bild, Chemie-Themen ohne
// eigenes (noch „kommt bald") nehmen das Bild ihres Gebiets
export type AreaIcon =
  | 'basics'
  | 'derivative'
  | 'integral'
  | 'units'
  | 'statics'
  | 'slope'
  | 'fraction'
  | 'rearrange'
  | 'powers'
  | 'atom'
  | 'nucleus'
  | 'orbitals'
  | 'periodic'
  | 'bond'
  | 'flask'
  | 'equilibrium'
  | 'ph'
  | 'redox'
  // Kachel „Themen mischen" (kein Gebiet, aber im selben Stil)
  | 'mix'

// Farbe eines Gebiets (Farbfamilie aus index.css, gesetzt über data-tone). Die App selbst ist Blaugrün.
// Nicht green, red, amber (richtig, falsch, Tipp) und nicht teal (App-Farbe).
export type Tone = 'orange' | 'blue' | 'violet' | 'pink' | 'cyan' | 'indigo' | 'sky' | 'fuchsia'

// Eine Stufe eines Themas mit Vorschau-Formeln (nur Aufgabenterme, keine Lösungen)
export type LevelPreview = {
  readonly level: Level
  readonly title: string
  readonly examples: readonly string[]
  // schon im geführten Modus spielbar
  readonly available: boolean
}

// Ein Unterthema eines Themas, z. B. „Isotope und Ionen" im Atombau. Auf der Themenseite und in der
// Mischung lässt sich ankreuzen, welche Unterthemen drankommen (gespeichert als die nicht angekreuzten,
// skipParts in state/storage.ts). Jede Frage (engine/quiz/types.ts, part) gehört zu genau einem.
export type CoursePart = {
  // fest, nie umbenennen: [a-z0-9-], eindeutig im Thema
  readonly id: string
  // reiner Text ohne Formeln (die Seiten mit Auswahl kommen ohne KaTeX aus)
  readonly title: string
  // Stufen, in denen es dazu Aufgaben gibt (ein Test vergleicht mit der Fragensammlung)
  readonly levels: readonly Level[]
}

// Ein Thema, z. B. „Ableiten"
export type Course = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly icon: AreaIcon
  // Ordner der Lernkarten (Id in explain/cards.ts); null: noch keiner
  readonly cards: string | null
  // leer: Thema kommt bald
  readonly levels: readonly LevelPreview[]
  // freier Modus (Ergebnis eintippen) schon da
  readonly free: boolean
  // gezieltes Üben der häufigsten Fehler schon da
  readonly focus: boolean
  // Unterthemen zum Ankreuzen, in der Reihenfolge der Anzeige; nur bei Themen, die welche haben
  // (bisher Chemie), sonst ohne Angabe
  readonly parts?: readonly CoursePart[]
}

// Ein Gebiet, z. B. „Differentialrechnung"
export type Area = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly icon: AreaIcon
  readonly tone: Tone
  // leer: Gebiet kommt bald
  readonly courses: readonly Course[]
  // Kachel „Klausuraufgabe N üben" (#/klausur/<fach>/aufgabe/<N>, engine/<fach>/exam/): Nummer der
  // Aufgabe in der Klausur und ihre Punkte (ein Test vergleicht mit der Engine)
  readonly exam?: { readonly task: number; readonly points: number }
}

// Ein Fach, z. B. „Mathematik MB1"
export type Subject = {
  readonly id: string
  readonly title: string
  // Namen der Stufen, z. B. „Grundlagen", „Vertiefung", „Klausurniveau"; ihre Zahl ist die Zahl der
  // Stufen. Ohne Angabe: fünf Stufen, genannt „Stufe 1" bis „Stufe 5".
  readonly levelNames?: readonly string[]
  // Kachel „Themen mischen" auf der Startseite: Themen des Fachs ankreuzen, Fragen kommen gemischt
  // (#/mischen/<fach>, ui/mix.ts)
  readonly mix?: boolean
  readonly areas: readonly Area[]
}

export const DERIVATIVES = 'ableiten'
export const FRACTIONS = 'brueche'
export const REARRANGE = 'umstellen'
export const ATOMBAU = 'chem-atombau'
export const STOFFMENGE = 'chem-stoffmenge'
export const GLEICHUNGEN = 'chem-gleichungen'
export const LOESUNGEN = 'chem-loesungen'
export const IONEN = 'chem-ionen'

// Chemie-Themen: Ids mit „chem-", Engine aus Wissensfragen (engine/chem/)
export const isChemCourse = (id: string) => id.startsWith('chem-')

// Themen mit Testseite in der Formel-Galerie (auch solche, die noch nicht spielbar sind); bei Chemie
// die Seite „Fragen durchsehen"
export const GALLERY_COURSES: readonly string[] = [DERIVATIVES, FRACTIONS, REARRANGE, ATOMBAU, GLEICHUNGEN, STOFFMENGE, LOESUNGEN, IONEN]

const derivativeLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Potenz-, Faktor- und Summenregel',
    examples: [String.raw`4x^3 - \frac{2}{x} + \sqrt{x}`],
  },
  {
    level: 2,
    available: true,
    title: 'Mit e-Funktion, ln, sin und cos',
    examples: [String.raw`x^2 e^x`, String.raw`\sin(3x)`],
  },
  {
    level: 3,
    available: true,
    title: 'Zwei Regeln kombiniert',
    examples: [String.raw`e^{x^2} \cos x`, String.raw`\frac{\ln x}{x^2}`],
  },
  {
    level: 4,
    available: true,
    title: 'Uni-Niveau: mehrere Regeln verschachtelt',
    examples: [String.raw`\frac{x^2 e^{-3x}}{\sqrt{1+x^2}}`, String.raw`\ln\left(\frac{x^2+1}{x-1}\right)`],
  },
  {
    level: 5,
    available: true,
    title: 'Profi: logarithmisch, implizit, Umkehr- und Hyperbelfunktionen',
    examples: [String.raw`x^{\sin x}`, String.raw`x^2 + y^2 = 25`, String.raw`\arcsin(2x)`, String.raw`\cosh(x^2)`],
  },
]

const fractionLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Zahlenbrüche: bis zu vier Brüche, Punkt vor Strich, Klammern, Dezimalzahlen',
    examples: [String.raw`\frac{3}{4} - \frac{2}{3} \cdot \frac{9}{8}`, String.raw`\left(\frac{5}{6} - 0{,}75\right) : \frac{7}{12}`, String.raw`\frac{\frac{3}{4} - \frac{1}{6}}{\frac{7}{8}}`],
  },
  {
    level: 2,
    available: true,
    title: 'Buchstaben in Produkten: Hauptnenner, über Kreuz kürzen, viele Buchstaben',
    examples: [String.raw`\frac{5}{6a^2b} - \frac{3}{4ab^3} + \frac{1}{3b}`, String.raw`\frac{12m^3n}{18mn^4} \cdot \frac{9n^2}{4m}`, String.raw`\frac{3x}{4y} : \frac{9x^2}{8y^3} - \frac{2}{3x}`],
  },
  {
    level: 3,
    available: true,
    title: 'Summen in Zähler und Nenner: ausklammern, binomische Formeln, vertauschte Differenzen',
    examples: [String.raw`\frac{a^2 - b^2}{ab - b^2}`, String.raw`\frac{3}{2x - 6} - \frac{x}{x^2 - 9}`, String.raw`\frac{x^2 - 4}{3x} \cdot \frac{6x^2}{x^2 + 4x + 4}`],
  },
  {
    level: 4,
    available: true,
    title: 'Zerlegen: Zahl vorn, zwei Buchstaben, in Gruppen; Doppelbrüche, e-Funktion, ln, sin',
    examples: [String.raw`\frac{2x^2 - x - 3}{x^2 - 1}`, String.raw`\frac{ax - ay + bx - by}{x^2 - y^2}`, String.raw`\frac{\frac{1}{a} - \frac{1}{b}}{\frac{1}{a^2} - \frac{1}{b^2}}`],
  },
  {
    level: 5,
    available: true,
    title: 'Profi: alles ineinander, Differenzenquotienten, dritte Potenzen, Wurzeln, Winkelfunktionen, e und ln, Partialbruchzerlegung, komplexe Zahlen, Grenzwerte, Teleskopsummen, Hyperbelfunktionen',
    examples: [String.raw`\frac{\sqrt{x+h} - \sqrt{x}}{h}`, String.raw`\frac{3 + 4\mathrm{i}}{1 - 2\mathrm{i}}`, String.raw`{\frac{2}{x^2 - 1} = \frac{1}{x - 1} - \frac{1}{x + 1}}`],
  },
]

// Gleichungen umstellen (Plan M3): Stufen 1 bis 5 geführt und frei spielbar (Stufe 5 wächst mit den
// Schritten 7a bis 8)
const rearrangeLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Mehrere Schritte, die Variable kommt einmal vor',
    examples: [String.raw`y = \frac{3(x - a)}{b} + c`, String.raw`y = m(x - a) + b \;\text{ nach } m`, String.raw`\frac{x}{a} - \frac{b}{c} = d`],
  },
  {
    level: 2,
    available: true,
    title: 'Die Variable kommt mehrfach vor oder steht im Nenner',
    examples: [String.raw`a(x + b) = c(x - d)`, String.raw`\frac{a}{x} + b = c`, String.raw`y = \frac{a}{b - x}`],
  },
  {
    level: 3,
    available: true,
    title: 'Brüche, Wurzeln und Quadrate ineinander',
    examples: [String.raw`b\sqrt{\frac{x + a}{x - a}} - c = y`, String.raw`\sqrt{x + a} + \sqrt{x - b} = y`, String.raw`\frac{a}{1 + \frac{b}{x}} = c`],
  },
  {
    level: 4,
    available: true,
    title: 'Verschachtelt: e-Funktion, ln, Wurzeln in Wurzeln, Potenz- und Logarithmusgesetze, Winkel- und Umkehrfunktionen, Substitution und pq-Formel',
    examples: [String.raw`y = \ln\left(1 + \sqrt{1 + e^{2x}}\right)`, String.raw`\frac{\sin x + \cos x}{\sin x - \cos x} = y`, String.raw`e^{2x} - a e^{x} = b`],
  },
  {
    level: 5,
    available: true,
    title: 'Quer durch die Mathematik: erst Ableitung, Integral, Summe, Reihe, Grenzwert, Differentialgleichung, Determinante, Betrag, Winkel oder Additionstheorem ausrechnen, dann umstellen',
    examples: [
      String.raw`\int_a^x \frac{\mathrm{d}t}{t(t + b)} = y`,
      String.raw`\sum_{k=1}^{\infty} k x^k = y`,
      String.raw`\lim_{n \to \infty}\left(\frac{n + x}{n - x}\right)^n = y`,
      String.raw`\begin{gathered}f'' = k^2 f \\ f(0) = a,\; f'(0) = 0 \\ f(x) = y\end{gathered}`,
      String.raw`\det\begin{pmatrix} e^{x} & e^{-x} \\ a & b \end{pmatrix} = y`,
      String.raw`\left\lvert \frac{x + a\mathrm{i}}{x - b\mathrm{i}} \right\rvert = y`,
      String.raw`b\sin(x + a) = y\cos x`,
    ],
  },
]

// Chemie 1 (Plan M4): Atombau mit Wissensfragen in drei Stufen (S1)
const atombauLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Stoffe, Elementarteilchen, Kernsymbol und Isotope',
    examples: [String.raw`\ce{^{12}_{6}C}`, String.raw`\ce{^{14}_{6}C}`],
  },
  {
    level: 2,
    available: true,
    title: 'Ionen, Größe von Kern und Atom, Atommodelle, Licht und Spektren',
    examples: [String.raw`\ce{^{37}_{17}Cl^-}`, String.raw`E = h \cdot f`],
  },
  {
    level: 3,
    available: true,
    title: 'Klausuraufgaben zum Atombau mit typischen Fallen',
    examples: [String.raw`\ce{^{40}_{20}Ca^{2+}}`],
  },
]

// Unterthemen des Atombaus (Zuordnung der Fragen in engine/chem/bank/atombau.ts, part)
const atombauParts: CoursePart[] = [
  { id: 'stoffe', title: 'Stoffe, Trennverfahren, Reaktionen', levels: [1, 3] },
  { id: 'teilchen', title: 'Kern, Hülle und ihre Teilchen', levels: [1, 2, 3] },
  { id: 'isotope-ionen', title: 'Isotope und Ionen', levels: [1, 2, 3] },
  { id: 'modelle', title: 'Atommodelle', levels: [2, 3] },
  { id: 'licht', title: 'Licht und Spektren', levels: [2, 3] },
]

const gleichungenLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Einfache Gleichungen ausgleichen, Koeffizient und Index, Methan, Propan und Ethanol verbrennen',
    examples: [String.raw`\ce{2 H2 + O2 -> 2 H2O}`],
  },
  {
    level: 2,
    available: true,
    title: 'Größere Gleichungen (Ammoniak, Rosten, Metalle mit Säure), Alkane und Alkohole verbrennen',
    examples: [String.raw`\ce{4 Fe + 3 O2 -> 2 Fe2O3}`],
  },
  {
    level: 3,
    available: true,
    title: 'Vollständige Verbrennung von Alkanen bis Decan und von Alkoholen, wie in der Klausur',
    examples: [String.raw`\ce{C8H18}`, String.raw`\ce{C3H7OH}`],
  },
]

// Unterthemen von „Reaktionsgleichungen" (Rechnungen in engine/chem/generators/gleichungen.ts, part)
const gleichungenParts: CoursePart[] = [
  { id: 'lesen', title: 'Reaktionsgleichungen lesen', levels: [1, 2, 3] },
  { id: 'ausgleichen', title: 'Gleichungen ausgleichen', levels: [1, 2, 3] },
  { id: 'verbrennung', title: 'Vollständige Verbrennung', levels: [1, 2, 3] },
]

const loesungenLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Konzentration, Massenanteil, molares Volumen bei Normbedingungen',
    examples: [String.raw`c = \frac{n}{V}`, String.raw`V_m = 22{,}4\,\mathrm{L/mol}`],
  },
  {
    level: 2,
    available: true,
    title: 'Lösung ansetzen, Massenkonzentration, ppm und ppb, Vol-%, Gasgesetz mit Einheiten',
    examples: [String.raw`m = c \cdot V \cdot M`, String.raw`p \cdot V = n \cdot R \cdot T`],
  },
  {
    level: 3,
    available: true,
    title: 'Lösung ansetzen wie in der Klausur, Gasvolumen aus einer Reaktion, Bedingungen erkennen',
    examples: [String.raw`\ce{CaCO3 -> CaO + CO2}`],
  },
]

const ionenLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Ionen aus Metall und Nichtmetall, Formeln und Namen einfacher Salze, Eigenschaften',
    examples: [String.raw`\ce{Al2O3}`, String.raw`\ce{CaF2}`],
  },
  {
    level: 2,
    available: true,
    title: 'Molekül-Ionen, römische Ziffern, Zerfall in Ionen, Ionengitter und Koordinationszahl',
    examples: [String.raw`\ce{Ca3(PO4)2}`, String.raw`\ce{Fe2(SO4)3}`],
  },
  {
    level: 3,
    available: true,
    title: 'Name und Formel in beide Richtungen, Schmelzpunkte begründen, Born-Haber-Kreisprozess',
    examples: [String.raw`\ce{Na(s) + 1/2 Cl2(g) -> NaCl(s)}`],
  },
]

// Unterthemen von „Ionenbindung und Salze" (Rechnungen in engine/chem/generators/salze.ts, part)
const ionenParts: CoursePart[] = [
  { id: 'formel', title: 'Ionen, Formeln und Namen', levels: [1, 2, 3] },
  { id: 'gitter', title: 'Ionengitter und Eigenschaften der Salze', levels: [1, 2, 3] },
  { id: 'zerfall', title: 'Lösen und Schmelzen, Zerfall in Ionen', levels: [1, 2, 3] },
  { id: 'energie', title: 'Gitterenergie und Born-Haber', levels: [2, 3] },
]

// Unterthemen von „Gase und Lösungen" (Rechnungen in engine/chem/generators/loesungen.ts, part)
const loesungenParts: CoursePart[] = [
  { id: 'konzentration', title: 'Konzentration und Lösung ansetzen', levels: [1, 2, 3] },
  { id: 'anteile', title: 'Massenanteil, Massenkonzentration, ppm und Vol-%', levels: [1, 2, 3] },
  { id: 'gase', title: 'Molares Volumen und Gasgesetz', levels: [1, 2, 3] },
]

const stoffmengeLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Molare Masse einfacher Formeln, Masse, Stoffmenge und Teilchenzahl',
    examples: [String.raw`M(\ce{CO2})`, String.raw`n = \frac{m}{M}`],
  },
  {
    level: 2,
    available: true,
    title: 'Formeln mit Klammern und Kristallwasser, Rechnungen in zwei Schritten',
    examples: [String.raw`\ce{Ca(OH)2}`, String.raw`\ce{CuSO4 * 5 H2O}`],
  },
  {
    level: 3,
    available: true,
    title: 'Masse, Stoffmenge, Teilchen und Atome am Stück, wie in der Klausur',
    examples: [String.raw`\ce{Al2(SO4)3}`, String.raw`N = n \cdot N_A`],
  },
]

// Unterthemen von „Stoffmenge und Umsatz" (Rechnungen in engine/chem/generators/stoffmenge.ts, part);
const stoffmengeParts: CoursePart[] = [
  { id: 'molmasse', title: 'Molare Masse', levels: [1, 2, 3] },
  { id: 'stoffmenge', title: 'Masse, Stoffmenge und Teilchenzahl', levels: [1, 2, 3] },
  { id: 'umsatz', title: 'Umsatz', levels: [1, 2, 3] },
]

// Thema, das noch kommt (blass mit „kommt bald")
const comingSoon = (id: string, title: string, description: string, icon: AreaIcon): Course => ({
  id,
  title,
  description,
  icon,
  cards: null,
  levels: [],
  free: false,
  focus: false,
})

export const SUBJECTS: readonly Subject[] = [
  {
    id: 'mathe',
    title: 'Mathematik MB1',
    areas: [
      {
        id: 'grundlagen',
        title: 'Grundlagen',
        description: 'Brüche, Gleichungen umstellen, Potenzen und Logarithmen',
        icon: 'basics',
        tone: 'orange',
        courses: [
          {
            id: FRACTIONS,
            title: 'Brüche',
            description: 'Fünf Stufen, vom Zahlenbruch bis zu Partialbrüchen, Grenzwerten und komplexen Zahlen',
            icon: 'fraction',
            cards: 'brueche',
            levels: fractionLevels,
            free: true,
            focus: true,
          },
          {
            id: REARRANGE,
            title: 'Gleichungen umstellen',
            description: 'Nach einer Variablen auflösen, von Brüchen und Wurzeln bis quer durch die Mathematik',
            icon: 'rearrange',
            cards: 'umstellen',
            levels: rearrangeLevels,
            free: true,
            focus: true,
          },
          {
            id: 'potenzen',
            title: 'Potenzen, Wurzeln, Logarithmen',
            description: 'Die Rechenregeln sicher anwenden',
            icon: 'powers',
            cards: null,
            levels: [],
            free: false,
            focus: false,
          },
        ],
      },
      {
        id: 'differentialrechnung',
        title: 'Differentialrechnung',
        description: 'Ableiten, vom Einstieg bis zum Profi',
        icon: 'derivative',
        tone: 'blue',
        courses: [
          {
            id: DERIVATIVES,
            title: 'Ableiten',
            description: 'Fünf Stufen, von der Potenzregel bis zum impliziten Ableiten',
            icon: 'slope',
            cards: 'ableitungen',
            levels: derivativeLevels,
            free: true,
            focus: true,
          },
        ],
      },
      {
        id: 'integralrechnung',
        title: 'Integralrechnung',
        description: 'Stammfunktionen und Flächen',
        icon: 'integral',
        tone: 'violet',
        courses: [],
      },
    ],
  },
  {
    id: 'chemie',
    title: 'Chemie 1',
    levelNames: ['Grundlagen', 'Vertiefung', 'Klausurniveau'],
    mix: true,
    areas: [
      {
        id: 'chem-materie',
        title: 'Aufbau der Materie',
        description: 'Atome, Isotope, Atommodelle und Elektronen',
        icon: 'atom',
        tone: 'indigo',
        courses: [
          {
            id: ATOMBAU,
            title: 'Atombau',
            description: 'Stoffe, Elementarteilchen, Kernsymbol, Isotope, Ionen, Atommodelle und Licht',
            icon: 'nucleus',
            cards: 'chem-atombau',
            levels: atombauLevels,
            free: false,
            focus: true,
            parts: atombauParts,
          },
          comingSoon('chem-elektronen', 'Elektronen', 'Quantenzahlen, Orbitale und Elektronenkonfiguration', 'orbitals'),
        ],
      },
      {
        id: 'chem-periodensystem',
        title: 'Periodensystem',
        description: 'Aufbau, Gruppen, Perioden und Trends',
        icon: 'periodic',
        tone: 'sky',
        courses: [
          comingSoon('chem-pse', 'Aufbau des Periodensystems', 'Perioden, Gruppen, Blöcke, Valenzelektronen und Ionenladung', 'periodic'),
          comingSoon('chem-trends', 'Trends im Periodensystem', 'Atomradius, Ionisierungsenergie, Elektronegativität und Metallcharakter', 'periodic'),
        ],
      },
      {
        id: 'chem-bindung',
        title: 'Chemische Bindung',
        description: 'Ionen, Moleküle, Metalle und zwischenmolekulare Kräfte',
        icon: 'bond',
        tone: 'violet',
        courses: [
          {
            id: IONEN,
            title: 'Ionenbindung und Salze',
            description: 'Formeln und Namen von Salzen, Ionengitter und ihre Eigenschaften',
            icon: 'bond',
            cards: 'chem-ionen',
            levels: ionenLevels,
            free: false,
            focus: true,
            parts: ionenParts,
          },
          comingSoon('chem-molekuele', 'Moleküle', 'Lewis-Formel, räumlicher Bau, Polarität und Namen', 'bond'),
          comingSoon('chem-zmk', 'Zwischenmolekulare Kräfte', 'Van-der-Waals-Kräfte, Dipol-Dipol-Kräfte und Wasserstoffbrücken', 'bond'),
          comingSoon('chem-metalle', 'Metallbindung und Hybridisierung', 'Elektronengas, Bändermodell, Halbleiter und Hybridorbitale', 'bond'),
        ],
      },
      {
        id: 'chem-stoechiometrie',
        title: 'Stöchiometrie',
        description: 'Gleichungen, Stoffmenge, Umsatz und Konzentration',
        icon: 'flask',
        tone: 'orange',
        exam: { task: 4, points: 14 },
        courses: [
          {
            id: GLEICHUNGEN,
            title: 'Reaktionsgleichungen',
            description: 'Aufstellen und ausgleichen, auch Verbrennungen',
            icon: 'flask',
            cards: 'chem-gleichungen',
            levels: gleichungenLevels,
            free: false,
            focus: true,
            parts: gleichungenParts,
          },
          {
            id: STOFFMENGE,
            title: 'Stoffmenge und Umsatz',
            description: 'Molare Masse, Stoffmenge, Teilchenzahl und Umsatzrechnung',
            icon: 'flask',
            cards: 'chem-stoffmenge',
            levels: stoffmengeLevels,
            free: false,
            focus: true,
            parts: stoffmengeParts,
          },
          {
            id: LOESUNGEN,
            title: 'Gase und Lösungen',
            description: 'Gasgesetz, molares Volumen, Konzentration und Anteile',
            icon: 'flask',
            cards: 'chem-loesungen',
            levels: loesungenLevels,
            free: false,
            focus: true,
            parts: loesungenParts,
          },
        ],
      },
      {
        id: 'chem-gleichgewicht',
        title: 'Gleichgewicht und Energie',
        description: 'Massenwirkungsgesetz, Le Chatelier, Enthalpie und Entropie',
        icon: 'equilibrium',
        tone: 'fuchsia',
        courses: [
          comingSoon('chem-mwg', 'Chemisches Gleichgewicht', 'Massenwirkungsgesetz, Le Chatelier und Katalysator', 'equilibrium'),
          comingSoon('chem-energie', 'Energie bei Reaktionen', 'Exotherm und endotherm, Enthalpie, Entropie und freie Enthalpie', 'equilibrium'),
        ],
      },
      {
        id: 'chem-saeure-base',
        title: 'Säuren und Basen',
        description: 'Brønsted, pH-Wert, Puffer und Titration',
        icon: 'ph',
        tone: 'pink',
        courses: [
          comingSoon('chem-broensted', 'Säuren und Basen nach Brønsted', 'Protonen abgeben und aufnehmen, korrespondierende Paare', 'ph'),
          comingSoon('chem-ph', 'pH-Wert', 'pH-Wert von Säuren und Basen berechnen', 'ph'),
          comingSoon('chem-puffer', 'Puffer und Titration', 'Pufferlösungen, Neutralisation und Äquivalenzpunkt', 'ph'),
        ],
      },
      {
        id: 'chem-redox',
        title: 'Redox und Elektrochemie',
        description: 'Oxidationszahlen, Redoxreaktionen, Zellen und Elektrolyse',
        icon: 'redox',
        tone: 'blue',
        courses: [
          comingSoon('chem-oxidationszahlen', 'Oxidationszahlen', 'Oxidationszahlen in Teilchen und Reaktionen bestimmen', 'redox'),
          comingSoon('chem-redoxreaktionen', 'Redoxreaktionen', 'Oxidation und Reduktion erkennen, Gleichungen aufstellen', 'redox'),
          comingSoon('chem-elektrochemie', 'Galvanische Zelle und Elektrolyse', 'Standardpotentiale, Zellspannung, Anode und Kathode', 'redox'),
        ],
      },
    ],
  },
  {
    id: 'physik',
    title: 'Physik',
    areas: [
      {
        id: 'einheiten',
        title: 'Formeln mit Einheiten',
        description: 'Physikalische Formeln umstellen und mit Einheiten rechnen',
        icon: 'units',
        tone: 'pink',
        courses: [],
      },
    ],
  },
  {
    id: 'mechanik',
    title: 'Technische Mechanik',
    areas: [
      {
        id: 'statik',
        title: 'Statik',
        description: 'Freischnitt, Gleichgewicht und Lagerkräfte',
        icon: 'statics',
        tone: 'cyan',
        courses: [],
      },
    ],
  },
]

export const isCourseAvailable = (course: Course) => course.levels.some((l) => l.available)
export const isAreaAvailable = (area: Area) => area.courses.some(isCourseAvailable)
export const isLevelAvailable = (course: Course, level: Level) => course.levels.some((l) => l.level === level && l.available)

const AREAS = SUBJECTS.flatMap((subject) => subject.areas.map((area) => ({ subject, area })))
const COURSES = AREAS.flatMap(({ subject, area }) => area.courses.map((course) => ({ subject, area, course })))

export function areaById(id: string): { subject: Subject; area: Area } | undefined {
  return AREAS.find((entry) => entry.area.id === id)
}

export function courseById(id: string): { subject: Subject; area: Area; course: Course } | undefined {
  return COURSES.find((entry) => entry.course.id === id)
}

// Spielbare Themen in der Reihenfolge der Startseite
export const AVAILABLE_COURSES: readonly Course[] = COURSES.map((entry) => entry.course).filter(isCourseAvailable)

// Thema und Gebiet, zu dem ein Lernkarten-Ordner gehört
export function courseOfCards(folder: string): { area: Area; course: Course } | undefined {
  return COURSES.find(({ course }) => course.cards === folder)
}

// Zahl der Stufen eines Fachs: bei Mathe fünf, bei Chemie drei
export const subjectLevelCount = (subject: Subject): number => subject.levelNames?.length ?? 5

// Name einer Stufe eines Fachs, z. B. „Stufe 3" in Mathe, „Vertiefung" in Chemie
export const subjectLevelName = (subject: Subject, level: Level): string => subject.levelNames?.[level - 1] ?? `Stufe ${level}`

// Zahl der Stufen eines Themas (aus seinem Fach): bei Mathe fünf, bei Chemie drei
export function levelCount(courseId: string): number {
  const found = courseById(courseId)
  return found ? subjectLevelCount(found.subject) : 5
}

// Name einer Stufe, z. B. „Stufe 3" in Mathe, „Vertiefung" in Chemie
export function levelName(courseId: string, level: Level): string {
  const found = courseById(courseId)
  return found ? subjectLevelName(found.subject, level) : `Stufe ${level}`
}

// Hat das Fach des Themas eigene Namen für die Stufen?
export const hasLevelNames = (courseId: string) => courseById(courseId)?.subject.levelNames !== undefined

// Stufe, mit der ein Thema geübt wird: die gemerkte, wenn sie spielbar ist, sonst die erste spielbare
export function playableLevel(course: Course, wanted: Level | undefined): Level {
  if (wanted !== undefined && isLevelAvailable(course, wanted)) return wanted
  return course.levels.find((l) => l.available)?.level ?? 1
}

// Unterthemen eines Themas, zu denen es in der Stufe Aufgaben gibt (Reihenfolge der Anzeige); leer bei
// Themen ohne Unterthemen
export function partsAvailable(course: Course, level: Level): readonly CoursePart[] {
  return (course.parts ?? []).filter((part) => part.levels.includes(level))
}

// Fach zu einer Id
export function subjectById(id: string): Subject | undefined {
  return SUBJECTS.find((subject) => subject.id === id)
}

// Alle Themen eines Fachs mit ihrem Gebiet, in der Reihenfolge der Startseite, auch die, die noch kommen
// (für die Liste der Mischseite)
export function mixCourses(subject: Subject): readonly { readonly area: Area; readonly course: Course }[] {
  return subject.areas.flatMap((area) => area.courses.map((course) => ({ area, course })))
}

// Hat das Fach die Kachel „Themen mischen" (mix) und mindestens ein spielbares Thema?
export const isMixAvailable = (subject: Subject): boolean => subject.mix === true && subject.areas.some(isAreaAvailable)

// Gebiet mit der Kachel „Klausuraufgabe N üben" in diesem Fach
export function examAreaOf(subjectId: string, task: number): { subject: Subject; area: Area } | undefined {
  const subject = subjectById(subjectId)
  const area = subject?.areas.find((a) => a.exam?.task === task)
  return subject && area ? { subject, area } : undefined
}
