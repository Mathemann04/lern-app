import type { FreeTask } from '../engine/check/freeTask.ts'
import type { GuidedTaskBase } from '../engine/guided/types.ts'
import type { Level, TaskRef } from '../engine/tasks/taskNumber.ts'
import { DERIVATIVES, FRACTIONS, REARRANGE, isChemCourse } from './catalog.ts'

// Engine je Thema für den geführten und den freien Modus, erst bei Bedarf geladen (Ladezeit;
// offline liegt sie ohnehin schon auf dem Gerät): Mathe-Engines und für alle Chemie-Themen die
// Fragen-Engine (engine/chem/engine.ts, eigener Teil)

export type CourseEngine = {
  // focus: Id einer Fehlerregel bzw. eines Denkfehlers für gezieltes Üben
  planGuidedTask(ref: TaskRef, focus?: string): GuidedTaskBase
  // Aufgabe im freien Modus: Eingabe prüfen, Tastatur (nur Mathe; Aufgaben mit isMathTask)
  prepareFree(ref: TaskRef): FreeTask
  // Form der Aufgabe ohne Zahlen (Abwechslung, engine/tasks/variety.ts)
  formOf(ref: TaskRef): string
  // Nummer einer neuen Aufgabe dieser Stufe; ohne Angabe eine zufällige (randomSeed). Wissensfragen:
  // shown sind die Fragen, die in der laufenden Runde schon dran waren (state/questionRounds.ts); parts
  // die angekreuzten Unterthemen (ohne Angabe alle; kommen sie in der Stufe nicht vor, gelten alle)
  // free: freier Modus (Chemie, S8b): nur Rechnungen mit Zahlen zum Eintippen
  nextSeed?(level: Level, shown?: ReadonlySet<number>, parts?: ReadonlySet<string>, free?: boolean): number
  // Nur Wissensfragen: Nummern der Fragen, unter denen nextSeed mit diesen Unterthemen wählt (für die
  // Runde und die Mischung, ui/mix.ts)
  questionNos?(level: Level, parts?: ReadonlySet<string>): readonly number[]
  // Stufe, zu der eine Nummer gehört, null: Die Aufgabe gibt es nicht (mehr); ohne Angabe passt jede
  // Nummer zu jeder Stufe
  resolve?(ref: TaskRef): Level | null
  // Die Aufgabe als Formel, z. B. als Beispiel aus der Auswahl auf der Seite einer Tätigkeit (M6); ohne Angabe kein Beispiel
  exampleLatex?(ref: TaskRef): string
}

const LOADERS: Readonly<Record<string, () => Promise<CourseEngine>>> = {
  [DERIVATIVES]: async () => {
    const [plan, free, forms] = await Promise.all([import('../engine/guided/plan.ts'), import('../engine/check/derivativeFree.ts'), import('../engine/tasks/forms.ts')])
    return { planGuidedTask: plan.planGuidedTask, prepareFree: free.prepareDerivativeFree, formOf: forms.derivativeForm }
  },
  [FRACTIONS]: async () => {
    const [plan, free, forms] = await Promise.all([import('../engine/guided/fractionPlan.ts'), import('../engine/check/fractionAnswer.ts'), import('../engine/tasks/forms.ts')])
    return { planGuidedTask: plan.planFractionTask, prepareFree: free.prepareFractionFree, formOf: forms.fractionForm }
  },
  [REARRANGE]: async () => {
    const [plan, free, forms, pick, terms, task] = await Promise.all([
      import('../engine/guided/rearrangePlan.ts'),
      import('../engine/check/rearrangeAnswer.ts'),
      import('../engine/tasks/forms.ts'),
      import('../engine/tasks/rearrangePick.ts'),
      import('../engine/tasks/rearrangeTerms.ts'),
      import('../engine/rearrange/task.ts'),
    ])
    return {
      planGuidedTask: plan.planRearrangeTask,
      prepareFree: free.prepareRearrangeFree,
      formOf: forms.rearrangeForm,
      // Bausteine (M6 Schritt 3): parts sind die angekreuzten Bausteine, ohne Angabe alle
      nextSeed: (level, _shown, parts) => pick.nextRearrangeSeed(level, parts),
      exampleLatex: (ref) => task.taskLatex(terms.generateRearrangeTask(ref).task),
    }
  },
}

const loaded = new Map<string, Promise<CourseEngine>>()

// Immer dasselbe Versprechen je Thema (für use() in React)
export function loadCourseEngine(course: string): Promise<CourseEngine> {
  let engine = loaded.get(course)
  if (!engine) {
    const load = LOADERS[course]
    const chem = isChemCourse(course) ? async () => (await import('../engine/chem/engine.ts')).chemCourseEngine(course) : undefined
    const loader = load ?? chem
    if (!loader) throw new Error(`Keine Engine für das Thema ${course}`)
    engine = loader()
    loaded.set(course, engine)
  }
  return engine
}
