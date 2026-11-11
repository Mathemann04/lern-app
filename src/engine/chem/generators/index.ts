import { createRng } from '../../random/rng.ts'
import type { Level, TaskRef } from '../../tasks/taskNumber.ts'
import { GLEICHUNGEN_GENERATORS } from './gleichungen.ts'
import { LIGHT_GENERATORS } from './light.ts'
import { LOESUNGEN_GENERATORS } from './loesungen.ts'
import { MOLEKUELE_GENERATORS } from './molekuele.ts'
import { PARTICLE_GENERATORS } from './particles.ts'
import { SALZE_GENERATORS } from './salze.ts'
import { STOFFMENGE_GENERATORS } from './stoffmenge.ts'
import { UMSATZ_GENERATORS } from './umsatz.ts'
import { ZMK_GENERATORS } from './zmk.ts'
import type { ChemCalc, ChemGenerator } from './shared.ts'

// Erzeugte Rechnungen je Chemie-Thema (Aufgabennummern 10000 bis 499999, quiz/numbers.ts). Die Nummer
// wählt mit festem Zufall die Rechenart (nach ihrem Anteil in der Stufe) und die Aufgabe: gleiche
// Nummer, gleiche Aufgabe. Kommt in einer Stufe eine Rechenart dazu, können Nummern dieser Stufe eine
// andere Aufgabe ergeben; Nummern der übrigen Stufen bleiben.

const GENERATORS: Readonly<Record<string, readonly ChemGenerator[]>> = {
  'chem-atombau': [...PARTICLE_GENERATORS, ...LIGHT_GENERATORS],
  'chem-stoffmenge': [...STOFFMENGE_GENERATORS, ...UMSATZ_GENERATORS],
  'chem-gleichungen': GLEICHUNGEN_GENERATORS,
  'chem-loesungen': LOESUNGEN_GENERATORS,
  'chem-ionen': SALZE_GENERATORS,
  'chem-molekuele': MOLEKUELE_GENERATORS,
  'chem-zmk': ZMK_GENERATORS,
}

// Rechenarten eines Themas in einer Stufe
export function generatorsOf(course: string, level: Level): readonly ChemGenerator[] {
  return (GENERATORS[course] ?? []).filter((g) => (g.weights[level] ?? 0) > 0)
}

const rngOf = (course: string, ref: TaskRef) => createRng(`chem:${course}:${ref.level}:${ref.seed}`)

// Rechenart hinter einer Nummer (ohne die Aufgabe zu bauen); null, wenn die Stufe keine hat
export function generatorOf(course: string, ref: TaskRef): ChemGenerator | null {
  const list = generatorsOf(course, ref.level)
  if (list.length === 0) return null
  const total = list.reduce((sum, g) => sum + g.weights[ref.level]!, 0)
  let roll = rngOf(course, ref).next() * total
  for (const g of list) {
    roll -= g.weights[ref.level]!
    if (roll < 0) return g
  }
  return list[list.length - 1]
}

// Aufgabe hinter einer Nummer; null, wenn die Stufe keine Rechnung hat. focus: Dieser Rechenfehler
// steht sicher unter den Antworten, wo er vorkommt.
export function generatedCalc(course: string, ref: TaskRef, focus?: string): ChemCalc | null {
  const generator = generatorOf(course, ref)
  if (!generator) return null
  const rng = rngOf(course, ref)
  rng.next()
  for (let attempt = 0; attempt < 100; attempt++) {
    const calc = generator.generate(ref.level, rng, ref, focus)
    if (calc) return calc
  }
  throw new Error(`Keine Aufgabe zu ${ref.level}-${ref.seed} im Thema ${course}`)
}

// Form für die Abwechslung (tasks/variety.ts): Rechenart, Untertyp und Stoff, nicht die Zahlen; hinter
// „@" der Stoff, der nicht zweimal hintereinander kommt
export const calcForm = (calc: ChemCalc) => `c:${calc.form}:${calc.substance}@${calc.substance}`
