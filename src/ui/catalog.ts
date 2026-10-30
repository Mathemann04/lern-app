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
    title: 'Zahlenbrüche: erweitern, kürzen, plus, minus, mal, geteilt',
    examples: [String.raw`\frac{3}{4} + \frac{5}{6}`, String.raw`2 - \frac{3}{5}`, String.raw`\frac{3}{4} : \frac{2}{5}`],
  },
  {
    level: 2,
    available: true,
    title: 'Buchstaben in Produkten: Potenzen kürzen, Hauptnenner',
    examples: [String.raw`\frac{6x^2y}{9xy^3}`, String.raw`\frac{2}{x} - \frac{1}{x^2}`, String.raw`\frac{3a}{4b} \cdot \frac{8b^2}{9a}`],
  },
  {
    level: 3,
    available: true,
    title: 'Summen in Zähler und Nenner: ausklammern, binomische Formeln',
    examples: [String.raw`\frac{x^2-9}{2x+6}`, String.raw`\frac{1}{x-1} + \frac{2}{x+1}`],
  },
  {
    level: 4,
    available: true,
    title: 'Uni-Niveau: Hauptnenner aus Faktoren, Doppelbrüche, e-Funktion, ln, sin',
    examples: [String.raw`\frac{x}{x^2-1} - \frac{1}{x+1}`, String.raw`\frac{1 + \frac{1}{x}}{1 - \frac{1}{x^2}}`, String.raw`\frac{e^{2x}-1}{e^x+1}`],
  },
  {
    level: 5,
    available: true,
    title: 'Profi: mehrere Rechenarten, zwei Variablen, Wurzeln und Winkelfunktionen',
    examples: [String.raw`\frac{\frac{1}{x+h} - \frac{1}{x}}{h}`, String.raw`\frac{x-1}{\sqrt{x}-1}`, String.raw`\frac{1}{1-\sin x} + \frac{1}{1+\sin x}`],
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
        description: 'Brüche, Formeln umstellen, Potenzen und Logarithmen',
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
            id: 'umstellen',
            title: 'Formeln umstellen',
            description: 'Nach einer Größe auflösen, auch mit Brüchen und Wurzeln',
            icon: 'rearrange',
            cards: null,
            levels: [],
            free: false,
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
