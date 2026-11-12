import type { FreeTask } from '../check/freeTask.ts'
import type { GuidedTaskBase } from '../guided/types.ts'
import { type Level, type TaskRef, blockSeed, randomSeed } from '../tasks/taskNumber.ts'
import { buildVectorTask } from './vectorTasks.ts'

// Engine der Tätigkeit „Vektoren" für die Oberfläche (ui/courseEngines.ts): Aufgaben aus dem Baukasten (vectorTasks.ts),
// Nummern mit Baustein („rechnen.1-4711"). Den freien Modus mit Eingabe eines Vektors bringt ein späterer Schritt.

export const VECTOR_BLOCK_IDS = ['rechnen'] as const

export function planVectorTask(ref: TaskRef): GuidedTaskBase {
  return buildVectorTask(ref)
}

export const vectorForm = (ref: TaskRef): string => buildVectorTask(ref).form

// Nummer einer neuen Aufgabe: ein angekreuzter Baustein (jeder gleich oft), dann ein Startwert
export function nextVectorSeed(_level: Level, parts?: ReadonlySet<string>): number {
  const chosen = VECTOR_BLOCK_IDS.filter((id) => !parts || parts.has(id))
  const block = chosen.length > 0 ? chosen[Math.floor(Math.random() * chosen.length)] : VECTOR_BLOCK_IDS[0]
  return blockSeed(block, randomSeed())
}

export const vectorExampleLatex = (ref: TaskRef): string => buildVectorTask(ref).functionLatex ?? ''

export function prepareVectorFree(): FreeTask {
  throw new Error('Vektoren haben noch keinen freien Modus')
}
