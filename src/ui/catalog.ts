import { type Block, REARRANGE_BLOCKS, VECTOR_BLOCKS, VECTOR_PLAYABLE_COMBOS } from '../engine/tasks/blocks.ts'
import { REARRANGE_PLAYABLE_COMBOS } from '../engine/tasks/rearrangeFamilies.ts'
import { LEVELS, type Level } from '../engine/tasks/taskNumber.ts'

// Aufbau der App wie bei Brilliant: Fächer (große Kacheln auf der Startseite, eigene Seite) → Gebiete
// (Kacheln mit eigener Seite) → Themen (eigene Seite mit Stufen und „Üben"). In Mathe heißen die Themen seit M6
// Tätigkeiten und stehen direkt auf der Seite des Fachs (activities). Absichtlich ohne Mathe-Engine, damit die
// Startseite schnell lädt (blocks.ts und rearrangeCombos.ts sind reine Daten).

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
  // Vektoren (M7): zwei Pfeile aneinandergehängt
  | 'vectors'
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
  // Kachel „Probeklausur": Blatt mit Zeilen und Uhr
  | 'exam'
  // Fach Werkstoffkunde (kommt noch): Kristallgitter
  | 'material'

// Farbe eines Gebiets (Farbfamilie aus index.css, gesetzt über data-tone). Die App selbst ist Blaugrün.
// Nicht green, red, amber (richtig, falsch, Tipp) und nicht teal (App-Farbe).
export type Tone = 'orange' | 'blue' | 'violet' | 'pink' | 'cyan' | 'indigo' | 'sky' | 'fuchsia'

// Eine Stufe eines Themas mit Vorschau-Formeln (nur Aufgabenterme, keine Lösungen)
export type LevelPreview = {
  readonly level: Level
  // Kurzname der Stufe für die Wahl „Wie verschachtelt?" (Tätigkeiten mit Bausteinen, M6), z. B. „Einstieg"; steht
  // auch vorn im Titel
  readonly name?: string
  readonly title: string
  readonly examples: readonly string[]
  // schon im geführten Modus spielbar
  readonly available: boolean
  // freier Modus in dieser Stufe (ohne Angabe: wie Course.free); false z. B. in Chemie-Stufen ohne Rechnung
  // mit Zahlen (ein Test vergleicht mit der Engine). „Frei" geht dort geführt weiter, mit Hinweis.
  readonly free?: boolean
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
  // Bausteine (M6): Gruppe (Id aus BLOCK_GROUPS in engine/tasks/blocks.ts) und kurzer Zusatz unter dem Titel
  readonly group?: string
  readonly note?: string
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
  // (Chemie, und seit M6 die Bausteine der Mathe-Tätigkeiten), sonst ohne Angabe
  readonly parts?: readonly CoursePart[]
  // Bausteine statt Unterthemen (M6): je Stufe die Mengen von Bausteinen, die zusammen in einer Aufgabe vorkommen (aus der
  // Engine erzeugt, z. B. rearrangeCombos.ts). Eine Auswahl lässt sich üben, wenn eine dieser Mengen ganz angekreuzt ist;
  // die Seite heißt dann „Seite einer Tätigkeit" (ActivityScreen.tsx)
  readonly blockCombos?: Readonly<Partial<Record<Level, readonly (readonly string[])[]>>>
  // eigene Farbe (sonst die des Gebiets), z. B. bei den Mathe-Tätigkeiten
  readonly tone?: Tone
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

// Ein Fach, z. B. „Mathematik MB1". Auf der Startseite stehen nur die Fächer als große Kacheln
// (#/fach/<id>, M6 Schritt 1); Fächer ohne spielbares Gebiet stehen dort in der Zeile „Demnächst".
export type Subject = {
  readonly id: string
  readonly title: string
  // Untertitel der Kachel auf der Startseite (reiner Text)
  readonly description: string
  // Bild und Farbe der Kachel und der Seite des Fachs
  readonly icon: AreaIcon
  readonly tone: Tone
  // Namen der Stufen, z. B. „Grundlagen", „Vertiefung", „Klausurniveau"; ihre Zahl ist die Zahl der
  // Stufen. Ohne Angabe: fünf Stufen, genannt „Stufe 1" bis „Stufe 5".
  readonly levelNames?: readonly string[]
  // Kachel „Themen mischen" auf der Startseite: Themen des Fachs ankreuzen, Fragen kommen gemischt
  // (#/mischen/<fach>, ui/mix.ts)
  readonly mix?: boolean
  // Kachel „Probeklausur" auf der Startseite (#/probeklausur/<fach>, S9): Zeit, Punkte und Zahl der Aufgaben,
  // Teil der Klausur (ein Test vergleicht mit der Engine)
  readonly mock?: { readonly minutes: number; readonly points: number; readonly tasks: number; readonly part: number }
  // Seite des Fachs zeigt die Themen als Tätigkeiten (M6, Mathe: Vereinfachen, Gleichungen umstellen, Ableiten) statt
  // der Gebiete; die Gebiete bleiben für alte Adressen
  readonly activities?: boolean
  // „Demnächst" auf der Seite des Fachs (sonst die Gebiete ohne spielbares Thema)
  readonly soon?: readonly string[]
  readonly areas: readonly Area[]
}

export const DERIVATIVES = 'ableiten'
export const FRACTIONS = 'brueche'
export const REARRANGE = 'umstellen'
export const VECTORS = 'vektoren'
export const ATOMBAU = 'chem-atombau'
export const STOFFMENGE = 'chem-stoffmenge'
export const GLEICHUNGEN = 'chem-gleichungen'
export const LOESUNGEN = 'chem-loesungen'
export const IONEN = 'chem-ionen'
export const MOLEKUELE = 'chem-molekuele'
export const ZMK = 'chem-zmk'
export const METALLE = 'chem-metalle'
export const ELEKTRONEN = 'chem-elektronen'
export const PSE = 'chem-pse'
export const TRENDS = 'chem-trends'
export const MWG = 'chem-mwg'
export const ENERGIE = 'chem-energie'

// Chemie-Themen: Ids mit „chem-", Engine aus Wissensfragen (engine/chem/)
export const isChemCourse = (id: string) => id.startsWith('chem-')

// Themen mit Testseite in der Formel-Galerie (auch solche, die noch nicht spielbar sind); bei Chemie
// die Seite „Fragen durchsehen"
export const GALLERY_COURSES: readonly string[] = [DERIVATIVES, FRACTIONS, REARRANGE, ATOMBAU, GLEICHUNGEN, STOFFMENGE, LOESUNGEN, IONEN, MOLEKUELE, ZMK, METALLE, ELEKTRONEN, PSE, TRENDS, MWG, ENERGIE]

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

// Gleichungen umstellen (Plan M3): Stufen 1 bis 5 geführt und frei spielbar. Seit M6 (Schritt 3) heißt die Stufe nur
// noch „wie verschachtelt"; was drankommt, sagen die angekreuzten Bausteine. Die Beispiele zeigt die Galerie, die Seite
// der Tätigkeit zieht ein Beispiel aus der Auswahl.
const rearrangeLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    name: 'Einstieg',
    title: 'Einstieg – ein Baustein, wenige Schritte',
    examples: [String.raw`y = \frac{3(x - a)}{b} + c`, String.raw`y = m(x - a) + b \;\text{ nach } m`, String.raw`\frac{x}{a} - \frac{b}{c} = d`],
  },
  {
    level: 2,
    available: true,
    name: 'Grundlagen',
    title: 'Grundlagen – ein Baustein, mehrere Schritte',
    examples: [String.raw`a(x + b) = c(x - d)`, String.raw`\frac{a}{x} + b = c`, String.raw`y = \frac{a}{b - x}`],
  },
  {
    level: 3,
    available: true,
    name: 'Kombiniert',
    title: 'Kombiniert – zwei Bausteine ineinander oder nebeneinander',
    examples: [String.raw`b\sqrt{\frac{x + a}{x - a}} - c = y`, String.raw`\sqrt{x + a} + \sqrt{x - b} = y`, String.raw`\frac{a}{1 + \frac{b}{x}} = c`],
  },
  {
    level: 4,
    available: true,
    name: 'Klausur',
    title: 'Klausur – mehrere Bausteine verschachtelt',
    examples: [String.raw`y = \ln\left(1 + \sqrt{1 + e^{2x}}\right)`, String.raw`\frac{\sin x + \cos x}{\sin x - \cos x} = y`, String.raw`e^{2x} - a e^{x} = b`],
  },
  {
    level: 5,
    available: true,
    name: 'Profi',
    title: 'Profi – alles ineinander, quer durch die Mathematik',
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

// Vektoren (M7, docs/PLAN-M7.md): Stufen wie bei den anderen Tätigkeiten; Stufe 1 in der Ebene, Stufe 2 im Raum, Stufe 4
// mit Parameter wie in der Klausur
const vectorLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    name: 'Einstieg',
    title: 'Einstieg – in der Ebene, ein bis zwei Schritte',
    examples: [
      String.raw`\overrightarrow{AB} \text{ für } A(1 \mid -2),\; B(4 \mid 3)`,
      String.raw`\left\lvert \begin{pmatrix} 3 \\ -4 \end{pmatrix} \right\rvert`,
      String.raw`\begin{pmatrix} 3 \\ 5 \end{pmatrix} \cdot \begin{pmatrix} -3 \\ 2 \end{pmatrix}`,
    ],
  },
  {
    level: 2,
    available: true,
    name: 'Grundlagen',
    title: 'Grundlagen – im Raum, mehrere Schritte',
    examples: [String.raw`2\vec a - 3\vec b`, String.raw`\vec a^{\,0} \text{ für } \vec a = \begin{pmatrix} 2 \\ -1 \\ 2 \end{pmatrix}`],
  },
  {
    level: 3,
    available: true,
    name: 'Kombiniert',
    title: 'Kombiniert – zwei Rechnungen zusammen',
    examples: [String.raw`3\vec x - \vec a = \vec b`, String.raw`\text{Parallelogramm } ABCD`, String.raw`\lvert \vec a + 2\vec b \rvert \text{ bei } \varphi = 60^\circ`, String.raw`\text{Lotfußpunkt } F \text{ und Abstand}`],
  },
  {
    level: 4,
    available: true,
    name: 'Klausur',
    title: 'Klausur – mit Parameter oder in mehr Dimensionen',
    examples: [String.raw`\left\lvert \begin{pmatrix} 2t \\ 1 \\ -2 \end{pmatrix} \right\rvert = 3`, String.raw`\begin{pmatrix} 3 \\ -5 \end{pmatrix} \cdot \begin{pmatrix} 3t \\ 3 \end{pmatrix} < 0`],
  },
  {
    level: 5,
    available: true,
    name: 'Profi',
    title: 'Profi – alles ineinander',
    examples: [String.raw`\lvert \overrightarrow{AB} \rvert = 9 \text{ für } B(t \mid 2 \mid 5)`, String.raw`\overrightarrow{CA} \perp \overrightarrow{CB} \text{ für } C(t \mid 0 \mid -2)`],
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
    free: false,
    title: 'Ionen aus Metall und Nichtmetall, Formeln und Namen einfacher Salze, Eigenschaften',
    examples: [String.raw`\ce{Mg3N2}`, String.raw`\ce{K2S}`],
  },
  {
    level: 2,
    available: true,
    free: false,
    title: 'Molekül-Ionen, römische Ziffern, Zerfall in Ionen, Ionengitter und Koordinationszahl',
    examples: [String.raw`\ce{Mg3(PO4)2}`, String.raw`\ce{Fe2(SO4)3}`],
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

const molekueleLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Elektronenpaarbindung, Lewis-Formeln mit Einfachbindungen, Gestalt einfacher Moleküle',
    examples: [String.raw`\ce{NH3}`, String.raw`\ce{CH4}`],
  },
  {
    level: 2,
    available: true,
    title: 'Mehrfachbindungen, Molekültyp und Bindungswinkel, Elektronegativität und Teilladungen, Namen mit Vorsilben',
    examples: [String.raw`\ce{HCN}`, String.raw`\ce{COCl2}`],
  },
  {
    level: 3,
    available: true,
    title: 'Lewis-Formel, Paare und Gestalt wie in der Klausur, polare Moleküle erkennen',
    examples: [String.raw`\ce{PCl3}`, String.raw`\ce{SO2}`],
  },
]

const elektronenLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Quantenzahlen, Orbitale, Pauli und Hund, Konfiguration bis Argon, Valenzelektronen',
    examples: [String.raw`\ce{O}\text{: } 1\mathrm{s}^{2}\,2\mathrm{s}^{2}\,2\mathrm{p}^{4}`],
  },
  {
    level: 2,
    available: true,
    title: 'Konfiguration bis Krypton mit Edelgaskern, 4s vor 3d, Chrom und Kupfer, Ionen',
    examples: [String.raw`\ce{Fe^2+}\text{: } [\mathrm{Ar}]\,3\mathrm{d}^{6}`],
  },
  {
    level: 3,
    available: true,
    title: 'Erlaubte Quantenzahlen, Besetzungen beurteilen, Element aus der Valenzkonfiguration',
    examples: [String.raw`4\mathrm{s}^{2}\,4\mathrm{p}^{3}\text{: } \ce{As}`],
  },
]

// Unterthemen von „Elektronen" (Rechnungen in engine/chem/generators/elektronen.ts, part)
const elektronenParts: CoursePart[] = [
  { id: 'quantenzahlen', title: 'Quantenzahlen und Orbitale', levels: [1, 2, 3] },
  { id: 'besetzung', title: 'Pauli, Hund und Elektronenkonfiguration', levels: [1, 2, 3] },
  { id: 'ionen', title: 'Konfiguration von Ionen', levels: [2, 3] },
  { id: 'valenz', title: 'Valenzelektronen', levels: [1, 2, 3] },
]

const trendsLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Richtung der Trends in Periode und Gruppe, zwei Elemente vergleichen',
    examples: [String.raw`r(\ce{Na}) > r(\ce{Cl})`],
  },
  {
    level: 2,
    available: true,
    title: 'Drei Elemente ordnen, Begründungen, Ionenradien, Elektronenaffinität',
    examples: [String.raw`\ce{Mg^2+} < \ce{Na+} < \ce{F-}`],
  },
  {
    level: 3,
    available: true,
    title: 'Vier Elemente ordnen, Ausnahmen erklären, alles gemischt',
    examples: [String.raw`\ce{I} < \ce{Br} < \ce{Cl} < \ce{F}`],
  },
]

// Unterthemen von „Trends im Periodensystem" (Rechnungen in engine/chem/generators/trends.ts, part)
const trendsParts: CoursePart[] = [
  { id: 'atomradius', title: 'Atomradius', levels: [1, 2, 3] },
  { id: 'ionisierung', title: 'Ionisierungsenergie', levels: [1, 2, 3] },
  { id: 'elektronegativitaet', title: 'Elektronegativität', levels: [1, 2, 3] },
  { id: 'affinitaet-metall', title: 'Elektronenaffinität und Metallcharakter', levels: [1, 2, 3] },
  { id: 'ionenradien', title: 'Ionenradien', levels: [2, 3] },
]

const mwgLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    free: false,
    title: 'Dynamisches Gleichgewicht, Massenwirkungsgesetz aufstellen, exotherm und endotherm, Katalysator',
    examples: [String.raw`K_{\mathrm{GG}} = \frac{c^{2}(\ce{HI})}{c(\ce{H2}) \cdot c(\ce{I2})}`],
  },
  {
    level: 2,
    available: true,
    title: 'K berechnen und deuten, Geschwindigkeit und K, Le Chatelier bei Druck, Temperatur und Konzentration',
    examples: [String.raw`K_{\mathrm{GG}} = \frac{k_{\text{hin}}}{k_{\text{rück}}}`],
  },
  {
    level: 3,
    available: true,
    title: 'Bedingungen für eine große Ausbeute, Energiediagramme lesen, alles gemischt',
    examples: [String.raw`\ce{N2 + 3 H2 <=> 2 NH3}`],
  },
]

// Unterthemen von „Chemisches Gleichgewicht" (Rechnungen in engine/chem/generators/mwg.ts, part)
const mwgParts: CoursePart[] = [
  { id: 'gleichgewicht', title: 'Dynamisches Gleichgewicht', levels: [1, 2, 3] },
  { id: 'mwg', title: 'Massenwirkungsgesetz', levels: [1, 2, 3] },
  { id: 'geschwindigkeit', title: 'Reaktionsgeschwindigkeit und K', levels: [1, 2, 3] },
  { id: 'le-chatelier', title: 'Prinzip von Le Chatelier', levels: [1, 2, 3] },
  { id: 'katalysator', title: 'Exotherm, Aktivierungsenergie und Katalysator', levels: [1, 2, 3] },
]

const energieLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Exotherm und endotherm, Bildungsenthalpie, Reaktionsenthalpie einfacher Bildungen, Hauptsätze, Entropie beim Schmelzen und Verdampfen',
    examples: [String.raw`\Delta H^{0} = 2 \cdot (-285{,}8) = -571{,}6\,\mathrm{kJ}`],
  },
  {
    level: 2,
    available: true,
    title: 'Reaktionsenthalpie beliebiger Reaktionen, Entropie von Gasreaktionen, freie Enthalpie und freiwillige Reaktionen',
    examples: [String.raw`\Delta G = \Delta H - T \cdot \Delta S`],
  },
  {
    level: 3,
    available: true,
    title: 'Temperatur, ab der eine Reaktion freiwillig abläuft, Gleichgewichtskonstante aus der freien Enthalpie, alles gemischt',
    examples: [String.raw`\Delta G^{0} = -R \cdot T \cdot \ln K_{\mathrm{GG}}`],
  },
]

// Unterthemen von „Energie bei Reaktionen" (Rechnungen in engine/chem/generators/energie.ts, part)
const energieParts: CoursePart[] = [
  { id: 'enthalpie', title: 'Exotherm, endotherm und Bildungsenthalpie', levels: [1, 2, 3] },
  { id: 'reaktionsenthalpie', title: 'Reaktionsenthalpie berechnen', levels: [1, 2, 3] },
  { id: 'entropie', title: 'Hauptsätze und Entropie', levels: [1, 2, 3] },
  { id: 'freie-enthalpie', title: 'Freie Enthalpie und freiwillige Reaktionen', levels: [2, 3] },
]

const pseLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Perioden und Hauptgruppen, Metalle und Nichtmetalle, Edelgasregel, Ionenladung',
    examples: [String.raw`\ce{S}\text{: 3. Periode, VI. Hauptgruppe}`],
  },
  {
    level: 2,
    available: true,
    title: 'Blöcke und Nebengruppen, Element aus dem Steckbrief, Ionisierungsenergie und ihr Sprung',
    examples: [String.raw`\ce{Mg}\text{: } I_{2} \to I_{3} \text{ Sprung}`],
  },
  {
    level: 3,
    available: true,
    title: 'Element aus den Ionisierungsenergien, Teilchen mit gleicher Konfiguration, alles gemischt',
    examples: [String.raw`\ce{S^2-},\ \ce{Cl-},\ \ce{K+},\ \ce{Ca^2+}`],
  },
]

// Unterthemen von „Aufbau des Periodensystems" (Rechnungen in engine/chem/generators/pse.ts, part)
const pseParts: CoursePart[] = [
  { id: 'aufbau', title: 'Perioden, Gruppen und Blöcke', levels: [1, 2, 3] },
  { id: 'metalle', title: 'Metalle, Halbmetalle, Nichtmetalle', levels: [1, 2, 3] },
  { id: 'ionen', title: 'Edelgasregel und Ionenladung', levels: [1, 2, 3] },
  { id: 'ionisierung', title: 'Ionisierungsenergie', levels: [2, 3] },
]

const metalleLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Elektronengas und Eigenschaften der Metalle, Leiter und Isolator, Hybridisierung',
    examples: [String.raw`\ce{CH4}\text{: }\mathrm{sp^{3}}`],
  },
  {
    level: 2,
    available: true,
    title: 'Metallgitter, verformbar oder spröde, Bändermodell, Dotierung, σ- und π-Bindungen',
    examples: [String.raw`\ce{C2H4}\text{: } 5\,\sigma,\ 1\,\pi`],
  },
  {
    level: 3,
    available: true,
    title: 'Leitfähigkeit beim Erwärmen, Schmelzflusselektrolyse von Aluminium, Bindungsordnung',
    examples: [String.raw`\text{BO} = \tfrac{1}{2}(8 - 4) = 2`],
  },
]

// Unterthemen von „Metallbindung und Hybridisierung" (Rechnungen in engine/chem/generators/metalle.ts, part)
const metalleParts: CoursePart[] = [
  { id: 'metallbindung', title: 'Metallbindung und Metallgitter', levels: [1, 2, 3] },
  { id: 'halbleiter', title: 'Bändermodell, Leiter und Halbleiter', levels: [1, 2, 3] },
  { id: 'hybrid', title: 'Hybridisierung, σ- und π-Bindungen', levels: [1, 2, 3] },
  { id: 'mo', title: 'Molekülorbitale und Bindungsordnung', levels: [3] },
]

const zmkLevels: LevelPreview[] = [
  {
    level: 1,
    available: true,
    title: 'Die drei Kräfte, Wasserstoffbrücken erkennen, Besonderheiten des Wassers',
    examples: [String.raw`\ce{H2O}`, String.raw`\ce{CH4}`],
  },
  {
    level: 2,
    available: true,
    title: 'Siedepunkte ordnen, Größe der Moleküle, Gleiches löst sich in Gleichem',
    examples: [String.raw`\ce{F2} < \ce{Cl2} < \ce{Br2}`],
  },
  {
    level: 3,
    available: true,
    title: 'Siedepunkte begründen, Mischbarkeit, was beim Sieden überwunden wird',
    examples: [String.raw`\ce{C3H8} < \ce{CH3CHO} < \ce{C2H5OH}`],
  },
]

// Unterthemen von „Zwischenmolekulare Kräfte" (Rechnungen in engine/chem/generators/zmk.ts, part)
const zmkParts: CoursePart[] = [
  { id: 'kraefte', title: 'Die drei Kräfte und Wasserstoffbrückenbindungen', levels: [1, 2, 3] },
  { id: 'wasser', title: 'Wasser ist besonders', levels: [1, 2, 3] },
  { id: 'siedepunkte', title: 'Siedepunkte vergleichen', levels: [2, 3] },
  { id: 'loesen', title: 'Gleiches löst sich in Gleichem', levels: [2, 3] },
]

// Unterthemen von „Moleküle" (Rechnungen in engine/chem/generators/molekuele.ts, part)
const molekueleParts: CoursePart[] = [
  { id: 'lewis', title: 'Elektronenpaarbindung und Lewis-Formeln', levels: [1, 2, 3] },
  { id: 'gestalt', title: 'Räumlicher Bau (VSEPR-Modell)', levels: [1, 2, 3] },
  { id: 'polaritaet', title: 'Elektronegativität und polare Moleküle', levels: [2, 3] },
  { id: 'namen', title: 'Namen von Molekülverbindungen', levels: [2, 3] },
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

// Bausteine einer Tätigkeit als Kästchen: je Baustein die Stufen, in denen er in einer Aufgabe vorkommt
function blockParts(blocks: readonly Block[], combos: Readonly<Record<Level, readonly string[]>>): CoursePart[] {
  return blocks.map((block) => ({
    id: block.id,
    title: block.title,
    note: block.note,
    group: block.group,
    levels: LEVELS.filter((level) => combos[level].some((combo) => combo.split('+').includes(block.id))),
  }))
}

const splitCombos = (combos: Readonly<Record<Level, readonly string[]>>) =>
  Object.fromEntries(LEVELS.map((level) => [level, combos[level].map((combo) => combo.split('+'))])) as Record<Level, string[][]>

export const SUBJECTS: readonly Subject[] = [
  {
    id: 'mathe',
    title: 'Mathematik MB1',
    description: 'Vereinfachen, Gleichungen umstellen, Ableiten und Vektoren',
    icon: 'derivative',
    tone: 'blue',
    activities: true,
    soon: ['Geraden und Ebenen', 'Matrizen und Gleichungssysteme', 'Mathe mischen', 'Integrieren'],
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
            // Tätigkeit „Vereinfachen" (M6); bis Schritt 6 mit den Stufen der Brüche
            title: 'Vereinfachen',
            description: 'Brüche und Terme kürzen, zusammenfassen und zerlegen, vom Zahlenbruch bis zu Partialbrüchen und komplexen Zahlen',
            icon: 'fraction',
            cards: 'brueche',
            levels: fractionLevels,
            free: true,
            focus: true,
          },
          {
            id: REARRANGE,
            title: 'Gleichungen umstellen',
            description: 'Nach einer Variablen auflösen: Bausteine ankreuzen, von Brüchen und Wurzeln bis quer durch die Mathematik',
            icon: 'rearrange',
            tone: 'blue',
            cards: 'umstellen',
            levels: rearrangeLevels,
            free: true,
            focus: true,
            parts: blockParts(REARRANGE_BLOCKS, REARRANGE_PLAYABLE_COMBOS),
            blockCombos: splitCombos(REARRANGE_PLAYABLE_COMBOS),
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
            tone: 'violet',
            cards: 'ableitungen',
            levels: derivativeLevels,
            free: true,
            focus: true,
          },
        ],
      },
      {
        id: 'lineare-algebra',
        title: 'Vektoren und Matrizen',
        description: 'Vektoren, Geraden und Ebenen, Matrizen und Gleichungssysteme',
        icon: 'vectors',
        tone: 'cyan',
        courses: [
          {
            id: VECTORS,
            title: 'Vektoren',
            description: 'Mit Pfeilen rechnen, Längen, Skalarprodukt und Winkel, Projektion und Zerlegung, mit Bildern zum Abspielen und Drehen',
            icon: 'vectors',
            tone: 'cyan',
            cards: 'vektoren',
            levels: vectorLevels,
            free: true,
            focus: false,
            parts: blockParts(VECTOR_BLOCKS, VECTOR_PLAYABLE_COMBOS),
            blockCombos: splitCombos(VECTOR_PLAYABLE_COMBOS),
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
    description: 'Atombau, Periodensystem, Bindung, Stöchiometrie, Gleichgewicht und Energie',
    icon: 'atom',
    tone: 'indigo',
    levelNames: ['Grundlagen', 'Vertiefung', 'Klausurniveau'],
    mix: true,
    mock: { minutes: 45, points: 50, tasks: 5, part: 1 },
    areas: [
      {
        id: 'chem-materie',
        title: 'Aufbau der Materie',
        description: 'Atome, Isotope, Atommodelle und Elektronen',
        icon: 'atom',
        tone: 'indigo',
        exam: { task: 1, points: 8 },
        courses: [
          {
            id: ATOMBAU,
            title: 'Atombau',
            description: 'Stoffe, Elementarteilchen, Kernsymbol, Isotope, Ionen, Atommodelle und Licht',
            icon: 'nucleus',
            cards: 'chem-atombau',
            levels: atombauLevels,
            free: true,
            focus: true,
            parts: atombauParts,
          },
          {
            id: ELEKTRONEN,
            title: 'Elektronen',
            description: 'Quantenzahlen, Orbitale, Pauli und Hund, Elektronenkonfiguration und Valenzelektronen',
            icon: 'orbitals',
            cards: 'chem-elektronen',
            levels: elektronenLevels,
            free: false,
            focus: true,
            parts: elektronenParts,
          },
        ],
      },
      {
        id: 'chem-periodensystem',
        title: 'Periodensystem',
        description: 'Aufbau, Gruppen, Perioden und Trends',
        icon: 'periodic',
        tone: 'sky',
        exam: { task: 2, points: 6 },
        courses: [
          {
            id: PSE,
            title: 'Aufbau des Periodensystems',
            description: 'Perioden, Gruppen, Blöcke, Metalle und Nichtmetalle, Edelgasregel, Ionenladung und Ionisierungsenergie',
            icon: 'periodic',
            cards: 'chem-pse',
            levels: pseLevels,
            free: false,
            focus: true,
            parts: pseParts,
          },
          {
            id: TRENDS,
            title: 'Trends im Periodensystem',
            description: 'Atomradius, Ionisierungsenergie, Elektronegativität, Elektronenaffinität, Metallcharakter und Ionenradien',
            icon: 'periodic',
            cards: 'chem-trends',
            levels: trendsLevels,
            free: false,
            focus: true,
            parts: trendsParts,
          },
        ],
      },
      {
        id: 'chem-bindung',
        title: 'Chemische Bindung',
        description: 'Ionen, Moleküle, Metalle und zwischenmolekulare Kräfte',
        icon: 'bond',
        tone: 'violet',
        exam: { task: 3, points: 12 },
        courses: [
          {
            id: IONEN,
            title: 'Ionenbindung und Salze',
            description: 'Formeln und Namen von Salzen, Ionengitter und ihre Eigenschaften',
            icon: 'bond',
            cards: 'chem-ionen',
            levels: ionenLevels,
            free: true,
            focus: true,
            parts: ionenParts,
          },
          {
            id: MOLEKUELE,
            title: 'Moleküle',
            description: 'Lewis-Formel, räumlicher Bau, Polarität und Namen',
            icon: 'bond',
            cards: 'chem-molekuele',
            levels: molekueleLevels,
            free: false,
            focus: true,
            parts: molekueleParts,
          },
          {
            id: ZMK,
            title: 'Zwischenmolekulare Kräfte',
            description: 'Van-der-Waals-Kräfte, Dipol-Dipol-Wechselwirkungen und Wasserstoffbrückenbindungen, Siedepunkte und Löslichkeit',
            icon: 'bond',
            cards: 'chem-zmk',
            levels: zmkLevels,
            free: false,
            focus: true,
            parts: zmkParts,
          },
          {
            id: METALLE,
            title: 'Metallbindung und Hybridisierung',
            description: 'Elektronengas, Metallgitter, Bändermodell, Halbleiter, Hybridorbitale und Molekülorbitale',
            icon: 'bond',
            cards: 'chem-metalle',
            levels: metalleLevels,
            free: false,
            focus: true,
            parts: metalleParts,
          },
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
            free: true,
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
            free: true,
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
        exam: { task: 5, points: 10 },
        courses: [
          {
            id: MWG,
            title: 'Chemisches Gleichgewicht',
            description: 'Dynamisches Gleichgewicht, Massenwirkungsgesetz, Le Chatelier, Aktivierungsenergie und Katalysator',
            icon: 'equilibrium',
            cards: 'chem-mwg',
            levels: mwgLevels,
            free: true,
            focus: true,
            parts: mwgParts,
          },
          {
            id: ENERGIE,
            title: 'Energie bei Reaktionen',
            description: 'Exotherm und endotherm, Reaktionsenthalpie, Hauptsätze, Entropie und freie Enthalpie',
            icon: 'equilibrium',
            cards: 'chem-energie',
            levels: energieLevels,
            free: true,
            focus: true,
            parts: energieParts,
          },
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
    id: 'werkstoffkunde',
    title: 'Werkstoffkunde',
    description: 'Aufbau und Eigenschaften der Werkstoffe',
    icon: 'material',
    tone: 'cyan',
    areas: [],
  },
  {
    id: 'physik',
    title: 'Physik',
    description: 'Formeln mit Einheiten',
    icon: 'units',
    tone: 'pink',
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
    description: 'Statik',
    icon: 'statics',
    tone: 'cyan',
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
// Tätigkeit mit Bausteinen (M6): eigene Seite „Was soll drankommen? / Wie verschachtelt?" (ActivityScreen.tsx)
export const hasBlocks = (course: Course) => course.blockCombos !== undefined
export const isAreaAvailable = (area: Area) => area.courses.some(isCourseAvailable)
// Fach mit mindestens einem spielbaren Gebiet: eigene Kachel und Seite; sonst „Demnächst"
export const isSubjectAvailable = (subject: Subject) => subject.areas.some(isAreaAvailable)
export const isLevelAvailable = (course: Course, level: Level) => course.levels.some((l) => l.level === level && l.available)

// Gibt es in dieser Stufe den freien Modus?
export const isFreeAt = (course: Course, level: Level) => course.free && (course.levels.find((l) => l.level === level)?.free ?? true)

const AREAS = SUBJECTS.flatMap((subject) => subject.areas.map((area) => ({ subject, area })))
const COURSES = AREAS.flatMap(({ subject, area }) => area.courses.map((course) => ({ subject, area, course })))

export function areaById(id: string): { subject: Subject; area: Area } | undefined {
  return AREAS.find((entry) => entry.area.id === id)
}

export function courseById(id: string): { subject: Subject; area: Area; course: Course } | undefined {
  return COURSES.find((entry) => entry.course.id === id)
}

// Farbe eines Themas: seine eigene, sonst die seines Gebiets
export function courseTone(id: string): Tone | undefined {
  const found = courseById(id)
  return found ? (found.course.tone ?? found.area.tone) : undefined
}

// Spielbare Themen eines Fachs mit Gebiet, in der Reihenfolge der Seite des Fachs (Tätigkeiten in Mathe)
export function subjectCourses(subject: Subject): readonly { readonly area: Area; readonly course: Course }[] {
  return subject.areas.flatMap((area) => area.courses.filter(isCourseAvailable).map((course) => ({ area, course })))
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

// Fach mit der Kachel „Probeklausur"
export function mockSubjectOf(subjectId: string): Subject | undefined {
  const subject = subjectById(subjectId)
  return subject?.mock ? subject : undefined
}

// Spielbare Themen eines Fachs (Ids), z. B. für „Wiederholen" über alle Themen (S11)
export function subjectCourseIds(subject: Subject): string[] {
  return subject.areas.flatMap((area) => area.courses.filter(isCourseAvailable).map((course) => course.id))
}
