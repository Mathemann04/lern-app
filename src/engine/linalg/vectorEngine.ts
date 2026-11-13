import type { FreeTask } from '../check/freeTask.ts'
import type { GuidedTaskBase } from '../guided/types.ts'
import { type Level, type TaskRef, blockSeed, randomSeed } from '../tasks/taskNumber.ts'
import { prepareVectorFreeTask } from './vectorFree.ts'
import { buildVectorTask } from './vectorTasks.ts'

// Engine der Tätigkeit „Vektoren" für die Oberfläche (ui/courseEngines.ts): Aufgaben aus dem Baukasten (vectorTasks.ts),
// Nummern mit Baustein („rechnen.1-4711", „skalar.1-4711", Schritt 2, „projektion.1-4711", Schritt 3a, „kraefte.1-4711", Schritt 3b, „kreuz.1-4711", Schritt 4a, „spat.1-4711", Schritt 4b, „basis.1-4711", Schritt 5); freier Modus mit Eingabe je Eintrag (vectorFree.ts, Schritt 1b).

export const VECTOR_BLOCK_IDS = ['rechnen', 'skalar', 'projektion', 'kraefte', 'kreuz', 'spat', 'basis'] as const

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

export const prepareVectorFree = (ref: TaskRef): FreeTask => prepareVectorFreeTask(ref)

// Tätigkeit „Geraden und Ebenen“ (M7 Schritt 6): dieselbe Engine, eigene Bausteine
export const LINE_BLOCK_IDS = ['gerade', 'ebene', 'lage', 'abstand', 'schnittwinkel'] as const

export function nextLineSeed(_level: Level, parts?: ReadonlySet<string>): number {
  const chosen = LINE_BLOCK_IDS.filter((id) => !parts || parts.has(id))
  const block = chosen.length > 0 ? chosen[Math.floor(Math.random() * chosen.length)] : LINE_BLOCK_IDS[0]
  return blockSeed(block, randomSeed())
}
