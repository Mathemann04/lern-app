import { explainError, explainSolveMistake } from '../explain/texts.ts'
import { generateDerivativeTask } from '../tasks/derivativeTerms.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'
import { type Verdict, checkAnswer, prepareAnswerCheck, prepareImplicitCheck } from './answer.ts'
import type { FreeTask, FreeVerdict } from './freeTask.ts'

// Freier Modus beim Ableiten: die Prüfung aus answer.ts mit den Rückmeldungen für die Oberfläche

export function derivativeFreeVerdict(v: Verdict): FreeVerdict {
  switch (v.kind) {
    case 'unreadable':
      return { kind: 'unreadable', title: 'Das kann ich noch nicht lesen.', message: v.message }
    case 'correct':
      return { kind: 'correct', title: 'Richtig!' }
    case 'knownError':
      return { kind: 'wrong', title: 'Nicht ganz.', error: { id: v.wrong.errorRule.id, name: v.wrong.errorRule.name, why: explainError(v.wrong) } }
    case 'functionItself':
      return { kind: 'wrong', title: 'Nicht ganz.', message: "Das ist die Funktion selbst. Gesucht ist ihre Ableitung $f'(x)$." }
    case 'wrongSign':
      return { kind: 'wrong', title: 'Fast!', message: 'Bis auf das Vorzeichen stimmt es. Prüfe, wo ein Minus hingehört.' }
    case 'wrongFactor':
      return { kind: 'wrong', title: 'Fast!', message: 'Bis auf einen Zahlenfaktor stimmt es. Prüfe die Zahlen vor den Termen.' }
    case 'solveMistake':
      return {
        kind: 'wrong',
        title: 'Fast!',
        message: 'Abgeleitet hast du richtig, aber beim Auflösen ist etwas schiefgegangen.',
        explanation: explainSolveMistake(v.mistake),
      }
    case 'keepY':
      return {
        kind: 'wrong',
        title: 'Nicht ganz.',
        message: "Lass $y$ im Ergebnis stehen. Beim impliziten Ableiten wird nicht nach $y$ aufgelöst: $y'$ darf $x$ und $y$ enthalten.",
      }
    case 'wrong':
      return {
        kind: 'wrong',
        title: 'Das stimmt noch nicht.',
        message: 'Rechne noch einmal nach. Wenn du nicht weiterkommst, helfen dir der Tipp, der Lösungsweg oder der geführte Modus.',
      }
  }
}

export function prepareDerivativeFree(ref: TaskRef): FreeTask {
  const { task } = generateDerivativeTask(ref)
  const context = task.kind === 'function' ? prepareAnswerCheck(task.expr) : prepareImplicitCheck(task.equation)
  return {
    answerLabel: task.kind === 'function' ? "f'(x) =" : "y' =",
    inputLabel: 'Deine Ableitung',
    keyboard: { kind: 'derivative' },
    check: (latex) => derivativeFreeVerdict(checkAnswer(context, latex)),
  }
}
