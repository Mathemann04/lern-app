import type { Level } from '../engine/tasks/taskNumber.ts'
import { type Course, isLevelAvailable } from './catalog.ts'
import type { CourseEngine } from './courseEngines.ts'
import { pickNewSeed } from './practice.ts'

// „Themen mischen" (S1b): Aus den angekreuzten Themen eines Fachs kommt die nächste Aufgabe gemischt.
// Reine Funktion ohne React, erst auf der Übungsseite geladen (sie braucht practice.ts); was angekreuzt
// ist, liest selection.ts (mixedCourses, selectedParts) aus den Einstellungen.

// Was von der Engine eines Themas gebraucht wird (loadCourseEngine)
export type MixEngine = Pick<CourseEngine, 'formOf' | 'nextSeed' | 'questionNos'>

export type MixInput = {
  // angekreuzte Themen (selection.ts, mixedCourses); Themen, deren Stufe nicht spielbar ist, kommen nie dran
  readonly courses: readonly Course[]
  readonly level: Level
  // geladene Engine je Thema (Id des Themas)
  readonly engineOf: (course: string) => MixEngine
  // Fragen der laufenden Runde des Themas in der Stufe (state/questionRounds.ts, shownInRound)
  readonly shownOf: (course: string) => ReadonlySet<number>
  // Formen der letzten Aufgaben des Themas in der Stufe (recentForms.ts, recentForms)
  readonly recentOf: (course: string) => readonly string[]
  // angekreuzte Unterthemen des Themas (selection.ts, selectedParts mit der Stufe); undefined: alle
  readonly partsOf: (course: string) => ReadonlySet<string> | undefined
  // Zufall für die Wahl des Themas (in Tests fest)
  readonly random?: () => number
}

export type MixPick = {
  // Id des gewählten Themas
  readonly course: string
  // Nummer der Aufgabe im Thema (taskHref(course, { level, seed }, mode, null, subject))
  readonly seed: number
  // Die Frage beginnt im Thema eine neue Runde: startNewRound(course, level, nos)
  readonly newRound: boolean
  // Nummern der Fragen der Auswahl im Thema (engine.questionNos); undefined bei Engines ohne
  // Wissensfragen (Mathe)
  readonly nos: readonly number[] | undefined
}

// Gewicht eines Chemie-Themas ohne Fragen in der Stufe (nur Rechnungen): so viel wie die Mindestzahl an
// Fragen je Stufe (Plan M4, „Abwechslung")
export const CALC_ONLY_WEIGHT = 15

// Gewicht eines Themas bei der Wahl
type Weighted = { readonly course: Course; readonly nos: readonly number[] | undefined; readonly weight: number }

// Gewichte der Themen: die Zahl der Fragen ihrer Auswahl (Stufe und angekreuzte Unterthemen). So kommt
// auf Dauer jede Frage gleich oft dran, egal wie groß ihr Thema ist, und die Themen bleiben immer
// gemischt. Die Runden laufen je Thema (pickNewSeed): Im gewählten Thema kommt zuerst eine Frage, die in
// seiner Runde noch nicht dran war; sind dort alle durch, beginnt seine Runde neu. (Nach den offenen
// Fragen zu gewichten hieße: Ein Thema, das durch ist, fiele aus der Mischung, bis alle anderen auch
// durch sind, und danach kämen die Themen am Stück.) Engines ohne Wissensfragen (Mathe) zählen 1, Chemie-Themen
// ohne Fragen in der Stufe (nur Rechnungen, z. B. „Stoffmenge und Umsatz" bis S3b) so viel wie ein Thema mit der
// Mindestzahl an Fragen (CALC_ONLY_WEIGHT).
export function mixWeights(input: Omit<MixInput, 'shownOf' | 'recentOf' | 'random'>): readonly { readonly course: string; readonly weight: number }[] {
  return weighted(input).map(({ course, weight }) => ({ course: course.id, weight }))
}

function weighted({ courses, level, engineOf, partsOf }: Omit<MixInput, 'shownOf' | 'recentOf' | 'random'>): Weighted[] {
  return courses
    .filter((course) => isLevelAvailable(course, level))
    .map((course) => {
      const nos = engineOf(course.id).questionNos?.(level, partsOf(course.id))
      return { course, nos, weight: nos ? nos.length || CALC_ONLY_WEIGHT : 1 }
    })
}

// Nächste Aufgabe der Mischung: Thema gewichtet nach mixWeights, dann eine Aufgabe darin wie beim Üben
// eines einzelnen Themas (pickNewSeed mit seinen Unterthemen). null: Es gibt nichts zu üben (keine
// spielbaren Themen oder keine Fragen).
export function pickMixed(input: MixInput): MixPick | null {
  const { level, engineOf, shownOf, recentOf, partsOf, random = Math.random } = input
  const choices = weighted(input).filter(({ weight }) => weight > 0)
  const sum = choices.reduce((total, { weight }) => total + weight, 0)
  if (sum === 0) return null
  // Zufallszahl in [0, sum): das Thema, in dessen Abschnitt sie fällt
  let rest = random() * sum
  let chosen = choices[choices.length - 1]
  for (const choice of choices) {
    if (rest < choice.weight) {
      chosen = choice
      break
    }
    rest -= choice.weight
  }
  const id = chosen.course.id
  const parts = partsOf(id)
  const { seed, newRound } = pickNewSeed(engineOf(id), level, recentOf(id), shownOf(id), parts)
  return { course: id, seed, newRound, nos: chosen.nos }
}
