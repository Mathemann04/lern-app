import type { ExamResult } from '../../engine/exam/grade.ts'
import { formatLatex, readNumber } from '../../engine/quantity/numberDe.ts'
import { recordError } from '../../state/progress.ts'

// Texte und Hilfen der Klausurseiten (ExamTaskPage.tsx, MockExamPage.tsx, ExamParts.tsx)

// eingetippte Zahl mit Einheit als Text mit Formel, z. B. „$1{,}85\,\mathrm{g}$"
export function typedContent(text: string, unit: string): string {
  const value = readNumber(text)
  return value ? `$${formatLatex(value, { significant: 12 })}${unit ? `\\,${unit}` : ''}$` : text
}

export const decimal = (n: number) => String(n).replace('.', ',')
export const points = (n: number) => `${decimal(n)} ${n === 1 ? 'Punkt' : 'Punkte'}`
// „1 von 2 Punkten", „1 von 1 Punkt"
export const pointsOf = (earned: number, max: number) => `${decimal(earned)} von ${decimal(max)} ${max === 1 ? 'Punkt' : 'Punkten'}`

// Erkannte Fehler zählen in die Fehlerstatistik
export function recordExamErrors(result: ExamResult) {
  for (const part of result.parts) for (const r of part.items) if (r.status === 'falsch' && r.chosen?.errorRuleId) recordError(r.chosen.errorRuleId)
}

