import type { FreeTask } from '../engine/check/freeTask.ts'
import type { GuidedTask } from '../engine/guided/types.ts'
import type { TaskRef } from '../engine/tasks/taskNumber.ts'
import { DERIVATIVES, FRACTIONS } from './catalog.ts'

// Mathe-Engine je Thema für den geführten und den freien Modus, erst bei Bedarf geladen (Ladezeit;
// offline liegt sie ohnehin schon auf dem Gerät)

export type CourseEngine = {
  // focus: Id einer Fehlerregel für gezieltes Üben
  planGuidedTask(ref: TaskRef, focus?: string): GuidedTask
  // Aufgabe im freien Modus: Eingabe prüfen, Tastatur
  prepareFree(ref: TaskRef): FreeTask
}

const LOADERS: Readonly<Record<string, () => Promise<CourseEngine>>> = {
  [DERIVATIVES]: async () => {
    const [plan, free] = await Promise.all([import('../engine/guided/plan.ts'), import('../engine/check/derivativeFree.ts')])
    return { planGuidedTask: plan.planGuidedTask, prepareFree: free.prepareDerivativeFree }
  },
  [FRACTIONS]: async () => {
    const [plan, free] = await Promise.all([import('../engine/guided/fractionPlan.ts'), import('../engine/check/fractionAnswer.ts')])
    return { planGuidedTask: plan.planFractionTask, prepareFree: free.prepareFractionFree }
  },
}

const loaded = new Map<string, Promise<CourseEngine>>()

// Immer dasselbe Versprechen je Thema (für use() in React)
export function loadCourseEngine(course: string): Promise<CourseEngine> {
  let engine = loaded.get(course)
  if (!engine) {
    const load = LOADERS[course]
    if (!load) throw new Error(`Keine Engine für das Thema ${course}`)
    engine = load()
    loaded.set(course, engine)
  }
  return engine
}
