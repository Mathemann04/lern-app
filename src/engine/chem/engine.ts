import type { FreeTask } from '../check/freeTask.ts'
import type { GuidedTaskBase } from '../guided/types.ts'
import { planQuestion } from '../quiz/plan.ts'
import { GENERATED_MAX, GENERATED_MIN, VARIANTS, decodeSeed, questionSeed } from '../quiz/numbers.ts'
import type { Question } from '../quiz/types.ts'
import { LEVELS, type Level, type TaskRef } from '../tasks/taskNumber.ts'
import { type ChemTopic, chemTopic } from './banks.ts'
import { calcForm, generatedCalc, generatorOf, generatorsOf } from './generators/index.ts'

// Engine eines Chemie-Themas für den geführten Modus (dieselbe Form wie die Mathe-Engines in
// ui/courseEngines.ts). Die Nummer einer Aufgabe nennt eine Wissensfrage und ihre Fassung oder eine
// erzeugte Rechnung (quiz/numbers.ts, Rechnungen in generators/).
// Unterthemen (S1b): Jede Frage und jede Rechenart gehört zu einem Unterthema (part, Ids aus parts des
// Themas in ui/catalog.ts); nextSeed und questionNos wählen nur unter den angekreuzten.

// Anteil der Rechnungen an neuen Aufgaben, wenn eine Stufe (in der Auswahl) Fragen und Rechnungen hat
export const CALC_SHARE = 0.35

export type ChemCourseEngine = {
  planGuidedTask(ref: TaskRef, focus?: string): GuidedTaskBase
  prepareFree(ref: TaskRef): FreeTask
  // Form für die Abwechslung: Fragen zum selben Fakt zählen als dieselbe Form
  formOf(ref: TaskRef): string
  // zufällige Nummer einer Frage dieser Stufe in zufälliger Fassung oder einer Rechnung (Anteil
  // CALC_SHARE). shown: Nummern der Fragen, die in
  // der laufenden Runde schon dran waren (state/questionRounds.ts); gewählt wird nur unter den übrigen,
  // sind alle durch, wieder unter allen (neue Runde). parts: erlaubte Unterthemen (ohne Angabe alle);
  // gibt es dazu in der Stufe weder Frage noch Rechnung, gelten alle der Stufe (nie ein Absturz).
  // free: freier Modus (S8b), nur Rechnungen mit Zahlen zum Eintippen (ChemGenerator.free); gibt es davon in
  // der Auswahl keine, die der ganzen Stufe; hat die Stufe keine, wie geführt
  nextSeed(level: Level, shown?: ReadonlySet<number>, parts?: ReadonlySet<string>, free?: boolean): number
  // Gibt es in der Stufe Rechnungen für den freien Modus?
  hasFree(level: Level): boolean
  // Nummern der Fragen, unter denen nextSeed mit diesen Unterthemen wählt (dieselbe Rückfall-Regel), in
  // der Reihenfolge der Sammlung: für die Runde (nur sie beginnen von vorn) und für die Mischung; leer,
  // wenn die Stufe keine Fragen hat
  questionNos(level: Level, parts?: ReadonlySet<string>): readonly number[]
  // Stufe, zu der die Nummer gehört; null, wenn es dazu keine Aufgabe (mehr) gibt
  resolve(ref: TaskRef): Level | null
}

// Engine eines Themas aus der Liste in banks.ts; random: Zufall für neue Nummern (in Tests fest)
export function chemCourseEngine(course: string, random: () => number = Math.random): ChemCourseEngine {
  const topic = chemTopic(course)
  if (!topic) throw new Error(`Keine Fragensammlung für das Thema ${course}`)
  return topicEngine(topic, random)
}

// Engine zu einer Sammlung mit ihren Denkfehlern
export function topicEngine({ bank, misconceptions }: ChemTopic, random: () => number = Math.random): ChemCourseEngine {
  const course = bank.course
  const retired = new Set(bank.retired)

  // Frage und Fassung hinter einer Nummer; gelöschte Fragen gibt es nicht mehr
  function questionOf(seed: number): { question: Question; variant: number } | null {
    const decoded = decodeSeed(seed)
    if (decoded?.kind !== 'question' || retired.has(decoded.no)) return null
    const question = bank.questions.find((q) => q.no === decoded.no)
    return question ? { question, variant: decoded.variant } : null
  }

  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]

  // Rechenarten der Stufe mit erlaubtem Unterthema
  const generatorsIn = (level: Level, parts?: ReadonlySet<string>) => generatorsOf(course, level).filter((g) => !parts || parts.has(g.part))

  // Fragen, unter denen gewählt wird: die der Stufe (ohne gelöschte) mit erlaubtem Unterthema; gibt es
  // in der Auswahl weder Fragen noch Rechnungen (sie kommt in der Stufe nicht vor), alle der Stufe. Hat die
  // Auswahl nur Rechnungen (z. B. nur „Umsatz"), gibt es keine Fragen.
  function candidatesOf(level: Level, parts?: ReadonlySet<string>): readonly Question[] {
    const inLevel = bank.questions.filter((q) => q.level === level && !retired.has(q.no))
    if (!parts) return inLevel
    const chosen = inLevel.filter((q) => parts.has(q.part))
    if (chosen.length > 0 || generatorsIn(level, parts).length > 0) return chosen
    return inLevel
  }

  const isGenerated = (seed: number) => decodeSeed(seed)?.kind === 'generated'


  // Nummer einer Rechnung, deren Rechenart erlaubt ist
  const randomCalcSeed = () => GENERATED_MIN + Math.floor(random() * (GENERATED_MAX - GENERATED_MIN + 1))
  function calcSeed(level: Level, kinds: ReadonlySet<string>): number {
    for (let attempt = 0; attempt < 2000; attempt++) {
      const seed = randomCalcSeed()
      if (kinds.has(generatorOf(course, { level, seed })?.kind ?? '')) return seed
    }
    return randomCalcSeed()
  }

  return {
    planGuidedTask(ref, focus) {
      if (isGenerated(ref.seed)) {
        const calc = generatedCalc(course, ref, focus)
        if (!calc) throw new Error(`Aufgabe ${ref.level}-${ref.seed} gibt es im Thema ${course} nicht`)
        return calc.task
      }
      const found = questionOf(ref.seed)
      if (!found) throw new Error(`Aufgabe ${ref.level}-${ref.seed} gibt es im Thema ${course} nicht`)
      return planQuestion(found.question, misconceptions, ref, found.variant, focus)
    },
    prepareFree() {
      throw new Error(`Das Thema ${course} hat noch keinen freien Modus`)
    },
    formOf(ref) {
      if (isGenerated(ref.seed)) {
        const calc = generatedCalc(course, ref)
        return calc ? calcForm(calc) : 'c:?'
      }
      const found = questionOf(ref.seed)
      return found ? `q:${found.question.fact}` : 'q:?'
    },
    hasFree(level) {
      return generatorsOf(course, level).some((g) => g.free)
    },
    nextSeed(level, shown, parts, free) {
      // Frei: nur Rechnungen mit Zahlen, erst der Auswahl, sonst der ganzen Stufe
      if (free) {
        const chosen = generatorsIn(level, parts).filter((g) => g.free)
        const kinds = chosen.length > 0 ? chosen : generatorsOf(course, level).filter((g) => g.free)
        if (kinds.length > 0) return calcSeed(level, new Set(kinds.map((g) => g.kind)))
      }
      // Auswahl: Fragen und Rechenarten der angekreuzten Unterthemen; gibt es davon keine, alle der Stufe
      let questions: readonly Question[] = bank.questions.filter((q) => q.level === level && !retired.has(q.no) && (!parts || parts.has(q.part)))
      let generators = generatorsIn(level, parts)
      if (questions.length === 0 && generators.length === 0) {
        questions = candidatesOf(level)
        generators = generatorsIn(level)
      }
      const calc = generators.length > 0 && (questions.length === 0 || random() < CALC_SHARE)
      if (calc) return calcSeed(level, new Set(generators.map((g) => g.kind)))
      const allowed = questions
      if (allowed.length === 0) throw new Error(`Keine Fragen in Stufe ${level} des Themas ${course}`)
      // Keine Frage doppelt, bevor alle (der Auswahl) dran waren
      const unseen = shown ? allowed.filter((q) => !shown.has(q.no)) : allowed
      const candidates = unseen.length > 0 ? unseen : allowed
      return questionSeed(pick(candidates).no, Math.floor(random() * VARIANTS))
    },
    questionNos(level, parts) {
      return candidatesOf(level, parts).map((q) => q.no)
    },
    resolve(ref) {
      if (isGenerated(ref.seed)) return generatorOf(course, ref) ? ref.level : null
      const level = questionOf(ref.seed)?.question.level
      return LEVELS.find((l) => l === level) ?? null
    },
  }
}
