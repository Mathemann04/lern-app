import type { Choice, GuidedTaskBase } from '../guided/types.ts'
import { createRng } from '../random/rng.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'
import type { Misconception, Question, WrongOption } from './types.ts'

// Wissensfrage → geführte Aufgabe mit einem Schritt: die Frage mit vier Antworten, der richtigen und
// drei falschen aus dem Vorrat. Die Fassung (variant, 0 bis 49) wählt mit festem Zufall, welche
// falschen Antworten gezeigt werden und in welcher Reihenfolge: dieselbe Nummer zeigt immer dieselbe
// Aufgabe. Jede falsche Antwort trägt ihren Denkfehler (für die Fehlerstatistik) und den Text
// „Warum ist das falsch?".

export const QUIZ_INSTRUCTION = 'Wähle die richtige Antwort'
// so viele falsche Antworten stehen neben der richtigen
export const SHOWN_WRONG = 3

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
  const forced = focus ? question.wrong.filter((o) => o.misconception === focus) : []
  const first = forced.length > 0 ? [rng.pick(forced)] : []
  const others = rng.shuffle(question.wrong.filter((o) => !first.includes(o))).slice(0, SHOWN_WRONG - first.length)
  const byId = new Map(misconceptions.map((m) => [m.id, m]))

  const wrongChoice = (option: WrongOption): Choice => {
    const why = option.why ?? byId.get(option.misconception)?.why
    if (!why) throw new Error(`Frage ${question.id}: Denkfehler ${option.misconception} ist unbekannt`)
    return { id: option.id, content: option.text, correct: false, errorRuleId: option.misconception, whyWrong: why }
  }
  const correct: Choice = { id: question.correct.id, content: question.correct.text, correct: true }
  const choices = rng.shuffle([correct, ...[...first, ...others].map(wrongChoice)])

  return {
    ref,
    instruction: QUIZ_INSTRUCTION,
    steps: [
      {
        id: 'frage',
        title: question.title,
        question: question.prompt,
        choices,
        hint: question.hint,
        explanation: question.explanation,
        cards: question.cards,
      },
    ],
    cards: question.cards,
    resultText: question.correct.text,
    resultQuestion: question.prompt,
    questionId: question.id,
  }
}
