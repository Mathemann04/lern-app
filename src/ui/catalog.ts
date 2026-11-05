import type { Level } from '../engine/tasks/taskNumber.ts'

// Aufbau der App wie bei Brilliant: Fächer (Überschriften auf der Startseite) → Gebiete
// (Kacheln mit eigener Seite) → Themen (eigene Seite mit Stufen und „Üben"). Gebiete und Themen
// ohne spielbare Stufe stehen blass mit „kommt bald" da. Absichtlich ohne Mathe-Engine, damit die
// Startseite schnell lädt.

// Bild eines Gebiets oder Themas (AreaIcon.tsx)
export type AreaIcon = 'basics' | 'derivative' | 'integral' | 'units' | 'statics' | 'slope' | 'fraction' | 'rearrange' | 'powers'

// Farbe eines Gebiets (Farbfamilie aus index.css, gesetzt über data-tone). Die App selbst ist Blaugrün.
export type Tone = 'orange' | 'blue' | 'violet' | 'pink' | 'cyan'

// Eine Stufe eines Themas mit Vorschau-Formeln (nur Aufgabenterme, keine Lösungen)
export type LevelPreview = {
  readonly level: Level
  readonly title: string
  readonly examples: readonly string[]
  // schon im geführten Modus spielbar
  readonly available: boolean
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
}

// Ein Fach, z. B. „Mathematik MB1"
export type Subject = {
  readonly id: string
  readonly title: string
  readonly areas: readonly Area[]
}

export const DERIVATIVES = 'ableiten'
export const FRACTIONS = 'brueche'
export const REARRANGE = 'umstellen'

// Themen mit Testseite in der Formel-Galerie (auch solche, die noch nicht spielbar sind)
export const GALLERY_COURSES: readonly string[] = [DERIVATIVES, FRACTIONS, REARRANGE]

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
    title: 'Profi: alles ineinander, Differenzenquotienten, dritte Potenzen, Wurzeln, Winkelfunktionen, e und ln, Partialbruchzerlegung, komplexe Zahlen',
    examples: [String.raw`\frac{\sqrt{x+h} - \sqrt{x}}{h}`, String.raw`\frac{3 + 4\mathrm{i}}{1 - 2\mathrm{i}}`, String.raw`{\frac{2}{x^2 - 1} = \frac{1}{x - 1} - \frac{1}{x + 1}}`],
  },
]

// Gleichungen umstellen (Plan M3): Stufen 1 bis 3 geführt und frei spielbar, die übrigen folgen
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
    title: 'Brüche und Wurzeln, die Variable kommt mehrfach vor',
    examples: [String.raw`y = \frac{2x + 1}{x - 3}`, String.raw`\frac{1}{x} + \frac{1}{a} = \frac{1}{b}`, String.raw`y = \sqrt{x + a} - \sqrt{x}`],
  },
  {
    level: 4,
    available: false,
    title: 'Verschachtelt: e-Funktion, ln, Wurzeln in Wurzeln, Winkelfunktionen',
    examples: [String.raw`y = \ln\left(1 + \sqrt{1 + e^{2x}}\right)`, String.raw`\log_a x + \log_a(x + b) = c`, String.raw`y = \frac{e^x - e^{-x}}{2}`],
  },
  {
    level: 5,
    available: false,
    title: 'Quer durch die Mathematik: Ableitung, Integral, Reihe, Grenzwert, Determinante',
    examples: [String.raw`\int_a^x \frac{\mathrm{d}t}{t(t + b)} = y`, String.raw`\sum_{k=1}^{\infty} k x^k = y`, String.raw`\det\begin{pmatrix} e^{x} & e^{-x} \\ a & b \end{pmatrix} = y`],
  },
]

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
            description: 'Fünf Stufen, vom Zahlenbruch bis zum Doppelbruch mit Winkelfunktionen',
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
            focus: false,
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

// Stufe, mit der ein Thema geübt wird: die gemerkte, wenn sie spielbar ist, sonst die erste spielbare
export function playableLevel(course: Course, wanted: Level | undefined): Level {
  if (wanted !== undefined && isLevelAvailable(course, wanted)) return wanted
  return course.levels.find((l) => l.available)?.level ?? 1
}
