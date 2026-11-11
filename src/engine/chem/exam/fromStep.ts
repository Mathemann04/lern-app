import type { ExamItem, ExamOption } from '../../exam/types.ts'
import type { GuidedStep } from '../../guided/types.ts'

// Schritt einer Rechnung oder Wissensfrage → Frage einer Klausuraufgabe: Antworten wie im Schritt, mit Fehler,
// Bild und „Warum ist das falsch?"; die richtige Antwort ist erwartet und richtig (keine Folgefehler)
export function fromStep(step: GuidedStep, id: string, title: string, points: number, final = false, question = step.question): ExamItem {
  const options: ExamOption[] = step.choices.map((c) => ({
    id: c.content,
    content: c.content,
    ...(c.errorRuleId ? { errorRuleId: c.errorRuleId } : {}),
    ...(c.figure ? { figure: c.figure } : {}),
    ...(!c.correct && c.whyWrong ? { why: c.whyWrong } : {}),
  }))
  const right = step.choices.find((c) => c.correct)!.content
  return {
    id,
    title,
    question,
    points,
    dependsOn: [],
    ...(final ? { final: true } : {}),
    cards: step.cards,
    // Zahl als Antwort: im freien Modus eintippen (S8c)
    build: () => ({ options, expected: right, correct: right, explanation: step.explanation, ...(step.numeric ? { numeric: step.numeric } : {}) }),
  }
}
