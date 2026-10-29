// Aufbau der App wie bei Brilliant: Fächer (Überschriften auf der Startseite) → Gebiete
// (Kacheln mit eigener Seite) → Themen (eigene Seite mit Stufen und „Üben"). Gebiete ohne
// spielbares Thema stehen blass mit „kommt bald" da. Absichtlich ohne Mathe-Engine, damit die
// Startseite schnell lädt.

// Bild eines Gebiets oder Themas (AreaIcon.tsx)
export type AreaIcon = 'basics' | 'derivative' | 'integral' | 'units' | 'statics' | 'slope'

// Farbe eines Gebiets (Farbfamilie aus index.css, gesetzt über data-tone). Die App selbst ist Blaugrün.
export type Tone = 'orange' | 'blue' | 'violet' | 'pink' | 'cyan'

// Ein Thema, z. B. „Ableiten"
export type Course = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly icon: AreaIcon
  // Ordner der Lernkarten (Id in explain/cards.ts)
  readonly cards: string
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
        courses: [],
      },
      {
        id: 'differentialrechnung',
        title: 'Differentialrechnung',
        description: 'Ableiten, vom Einstieg bis zum Profi',
        icon: 'derivative',
        tone: 'blue',
        courses: [
          {
            id: 'ableiten',
            title: 'Ableiten',
            description: 'Fünf Stufen, von der Potenzregel bis zum impliziten Ableiten',
            icon: 'slope',
            cards: 'ableitungen',
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

export const isAreaAvailable = (area: Area) => area.courses.length > 0

const AREAS = SUBJECTS.flatMap((subject) => subject.areas.map((area) => ({ subject, area })))

export function areaById(id: string): { subject: Subject; area: Area } | undefined {
  return AREAS.find((entry) => entry.area.id === id)
}

export function courseById(id: string): { subject: Subject; area: Area; course: Course } | undefined {
  for (const { subject, area } of AREAS) {
    const course = area.courses.find((c) => c.id === id)
    if (course) return { subject, area, course }
  }
  return undefined
}

// Gebiet, zu dem ein Lernkarten-Ordner gehört (über das Thema mit diesem Ordner)
export function areaOfCards(folder: string): Area | undefined {
  return AREAS.find(({ area }) => area.courses.some((course) => course.cards === folder))?.area
}

// Zurzeit gibt es ein Thema; mit weiteren merkt sich die App das zuletzt geübte
export const DERIVATIVES = 'ableiten'
