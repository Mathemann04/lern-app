// Aufbau der App wie bei Brilliant: Fächer (Überschriften auf der Startseite) → Gebiete
// (Kacheln mit eigener Seite) → Themen (eigene Seite mit Stufen und „Üben"). Gebiete ohne
// spielbares Thema stehen blass mit „kommt bald" da. Absichtlich ohne Mathe-Engine, damit die
// Startseite schnell lädt.

// Bild auf der Kachel eines Gebiets (AreaIcon.tsx)
export type AreaIcon = 'basics' | 'derivative' | 'integral' | 'units' | 'statics'

// Ein Thema, z. B. „Ableiten"
export type Course = {
  readonly id: string
  readonly title: string
  readonly description: string
  // Ordner der Lernkarten (Id in explain/cards.ts)
  readonly cards: string
}

// Ein Gebiet, z. B. „Differentialrechnung"
export type Area = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly icon: AreaIcon
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
        courses: [],
      },
      {
        id: 'differentialrechnung',
        title: 'Differentialrechnung',
        description: 'Ableiten, vom Einstieg bis zum Profi',
        icon: 'derivative',
        courses: [
          {
            id: 'ableiten',
            title: 'Ableiten',
            description: 'Fünf Stufen, von der Potenzregel bis zum impliziten Ableiten',
            cards: 'ableitungen',
          },
        ],
      },
      {
        id: 'integralrechnung',
        title: 'Integralrechnung',
        description: 'Stammfunktionen und Flächen',
        icon: 'integral',
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

// Zurzeit gibt es ein Thema; mit weiteren merkt sich die App das zuletzt geübte
export const DERIVATIVES = 'ableiten'
