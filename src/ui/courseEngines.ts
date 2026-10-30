import type { GuidedTask } from '../engine/guided/types.ts'
import type { TaskRef } from '../engine/tasks/taskNumber.ts'
import { DERIVATIVES, FRACTIONS } from './catalog.ts'

// Mathe-Engine je Thema für den geführten Modus, erst bei Bedarf geladen (Ladezeit; offline liegt
// sie ohnehin schon auf dem Gerät). Der freie Modus kommt für Brüche in einem späteren Schritt.

export type CourseEngine = {
  // focus: Id einer Fehlerregel für gezieltes Üben
  planGuidedTask(ref: TaskRef, focus?: string): GuidedTask
}

const LOADERS: Readonly<Record<string, () => Promise<CourseEngine>>> = {
  [DERIVATIVES]: () => import('../engine/guided/plan.ts').then((m) => ({ planGuidedTask: m.planGuidedTask })),
  [FRACTIONS]: () => import('../engine/guided/fractionPlan.ts').then((m) => ({ planGuidedTask: m.planFractionTask })),
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
