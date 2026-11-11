import type { Choice, GuidedTaskBase } from '../guided/types.ts'
import { createRng } from '../random/rng.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'
import type { Rng } from '../random/rng.ts'
import type { MultiChoice, Misconception, Question, QuizOption, SingleChoice, WrongOption } from './types.ts'

// Wissensfrage → geführte Aufgabe mit einem Schritt: die Frage mit vier Antworten, der richtigen und
// drei falschen aus dem Vorrat; bei „Wähle alle richtigen“ (N1) vier bis sechs Aussagen (planMulti). Die Fassung (variant, 0 bis 49) wählt mit festem Zufall, welche
// falschen Antworten gezeigt werden und in welcher Reihenfolge: dieselbe Nummer zeigt immer dieselbe
// Aufgabe. Jede falsche Antwort trägt ihren Denkfehler (für die Fehlerstatistik) und den Text
// „Warum ist das falsch?".

export const QUIZ_INSTRUCTION = 'Wähle die richtige Antwort'
export const MULTI_INSTRUCTION = 'Wähle alle richtigen Aussagen'
// so viele falsche Antworten stehen neben der richtigen
export const SHOWN_WRONG = 3
// „Wähle alle richtigen“: so viele Aussagen stehen da, davon so viele richtige (Plan M4, „Aufgabenarten“)
export const MULTI_SHOWN = { min: 4, max: 6 } as const
export const MULTI_CORRECT = { min: 1, max: 4 } as const

// focus: Id eines Denkfehlers, dessen Antwort sicher dabei ist (gezieltes Üben); kommt er in der Frage
// nicht vor, zählt er nicht
export function planQuestion(
  question: Question,
  misconceptions: readonly Misconception[],
  ref: TaskRef,
  variant: number,
  focus?: string,
): GuidedTaskBase {
  const rng = createRng(`quiz:${question.id}:${variant}`)
  const byId = new Map(misconceptions.map((m) => [m.id, m]))
  const wrongChoice = (option: WrongOption): Choice => {
    const why = option.why ?? byId.get(option.misconception)?.why
    if (!why) throw new Error(`Frage ${question.id}: Denkfehler ${option.misconception} ist unbekannt`)
    return { id: option.id, content: option.text, correct: false, errorRuleId: option.misconception, whyWrong: why }
  }
  const correctChoice = (option: QuizOption): Choice => ({ id: option.id, content: option.text, correct: true })
  return question.kind === 'multi'
    ? planMulti(question, ref, rng, wrongChoice, correctChoice, focus)
    : planSingle(question, ref, rng, wrongChoice, correctChoice, focus)
}

// Antworten des gezielt geübten Denkfehlers (eine davon kommt sicher dran)
const forcedWrong = (wrong: readonly WrongOption[], rng: Rng, focus?: string): WrongOption[] => {
  const forced = focus ? wrong.filter((o) => o.misconception === focus) : []
  return forced.length > 0 ? [rng.pick(forced)] : []
}

type ToChoice<T> = (option: T) => Choice

function planSingle(
  question: SingleChoice,
  ref: TaskRef,
  rng: Rng,
  wrongChoice: ToChoice<WrongOption>,
  correctChoice: ToChoice<QuizOption>,
  focus?: string,
): GuidedTaskBase {
  const first = forcedWrong(question.wrong, rng, focus)
  const others = rng.shuffle(question.wrong.filter((o) => !first.includes(o))).slice(0, SHOWN_WRONG - first.length)
  const choices = rng.shuffle([correctChoice(question.correct), ...[...first, ...others].map(wrongChoice)])
  return taskOf(question, ref, QUIZ_INSTRUCTION, choices, question.correct.text, false)
}

// „Wähle alle richtigen“: vier bis sechs Aussagen, davon eine bis vier richtig und mindestens eine falsch;
// die Fassung wählt Zahl, Auswahl und Reihenfolge
function planMulti(
  question: MultiChoice,
  ref: TaskRef,
  rng: Rng,
  wrongChoice: ToChoice<WrongOption>,
  correctChoice: ToChoice<QuizOption>,
  focus?: string,
): GuidedTaskBase {
  const right = question.correct.length
  const wrong = question.wrong.length
  const shown = rng.int(MULTI_SHOWN.min, Math.min(MULTI_SHOWN.max, Math.min(right, MULTI_CORRECT.max) + wrong))
  const rightCount = rng.int(Math.max(MULTI_CORRECT.min, shown - wrong), Math.min(MULTI_CORRECT.max, right, shown - 1))
  const first = forcedWrong(question.wrong, rng, focus)
  const others = rng.shuffle(question.wrong.filter((o) => !first.includes(o))).slice(0, shown - rightCount - first.length)
  const rights = rng.shuffle(question.correct).slice(0, rightCount)
  const choices = rng.shuffle([...rights.map(correctChoice), ...[...first, ...others].map(wrongChoice)])
  // im Ergebnis die richtigen Aussagen dieser Fassung, in der gezeigten Reihenfolge
  const result = choices.filter((c) => c.correct).map((c) => c.content).join('\n')
  return taskOf(question, ref, MULTI_INSTRUCTION, choices, result, true)
}

function taskOf(question: Question, ref: TaskRef, instruction: string, choices: readonly Choice[], resultText: string, multi: boolean): GuidedTaskBase {
  return {
    ref,
    instruction,
    steps: [
      {
        id: 'frage',
        title: question.title,
        question: question.prompt,
        choices,
        hint: question.hint,
        explanation: question.explanation,
        cards: question.cards,
        ...(question.figure ? { figure: question.figure } : {}),
        ...(multi ? { multi: true } : {}),
      },
    ],
    cards: question.cards,
    resultText,
    resultQuestion: question.prompt,
    questionId: question.id,
  }
}
