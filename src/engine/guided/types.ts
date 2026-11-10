import type { RuleId } from '../derive/rules.ts'
import type { Explanation } from '../explain/texts.ts'
import type { Expr } from '../expr/types.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'

// Geführter Modus, für alle Themen gleich: eine Aufgabe als Folge von Bildschirm-Schritten mit
// Auswahl-Antworten. Die Schrittplaner der Themen (plan.ts fürs Ableiten, fractionPlan.ts für
// Brüche, quiz/plan.ts für Wissensfragen) bauen sie; die Oberfläche kennt nur diese Typen. Texte
// mit Formeln im Format von richText.ts.

export type Choice = {
  readonly id: string
  // Inhalt der Antwort (Text mit Formeln), z. B. "$12x^{2}$" oder "Summenregel"
  readonly content: string
  // kleine Zusatzzeile, z. B. die Formel einer Regel
  readonly caption?: string
  readonly correct: boolean
  // bei Formel-Antworten: der Term (für Tests und spätere Auswertungen)
  readonly expr?: Expr
  // beim Ableiten, bei der Regelwahl: die Regel dieser Antwort
  readonly rule?: RuleId
  // bei falschen Antworten: welcher typische Fehler dahintersteckt und warum er falsch ist
  readonly errorRuleId?: string
  readonly whyWrong?: Explanation
}

export type GuidedStep = {
  readonly id: string
  // kurze Überschrift, z. B. „Summand 2 von 3" oder „Hauptnenner"
  readonly title: string
  readonly question: string
  readonly choices: readonly Choice[]
  readonly hint: string
  // bei Ableitungsschritten: Die richtige Antwort ist die Ableitung von subject nach variable
  readonly subject?: Expr
  readonly variable?: string
  // warum die richtige Antwort stimmt
  readonly explanation: Explanation
  // was nach dem Schritt feststeht, als LaTeX-Zeilen, z. B. (4x^3)' = 12x^2 oder = \frac{7}{6}
  readonly established?: string | readonly string[]
  // passende Lernkarten (Ids aus cards.ts); bei der Regelwahl die Karten aller angebotenen Regeln
  readonly cards: readonly string[]
}

// Gemeinsame Basis aller geführten Aufgaben: Mathe-Aufgaben mit Term (GuidedTask) und Wissensfragen
// ohne Term (Chemie, engine/quiz/plan.ts). Die Oberfläche (TaskScreen) kennt nur diese Basis; der
// freie Modus braucht die Mathe-Felder (isMathTask).
export type GuidedTaskBase = {
  readonly ref: TaskRef
  // Arbeitsauftrag, z. B. „Leite ab" oder „Wähle die richtige Antwort" (Text mit Formeln)
  readonly instruction: string
  // Zusatz unter der Aufgabe (Text mit Formeln), z. B. „Alle Buchstaben stehen für positive Zahlen."
  readonly note?: string
  readonly steps: readonly GuidedStep[]
  // Lernkarten zu allen Regeln der Aufgabe, außen zuerst
  readonly cards: readonly string[]
  // Aufgabe als LaTeX (große Formel über den Schritten); ohne Angabe keine Formel
  readonly functionLatex?: string
  // die Aufgabe als Term; Lernkarten zeigen davon keine Teile als Beispiel
  readonly expr?: Expr
  // Ergebnis als Formel (LaTeX) …
  readonly resultLatex?: string
  // … oder als Text mit Formeln (bei Fragen: die richtige Antwort)
  readonly resultText?: string
  // bei Fragen: die Frage selbst (Text mit Formeln), über der richtigen Antwort; ohne sie stünde eine
  // Antwort, die nur ein Satzteil ist, ohne Zusammenhang da
  readonly resultQuestion?: string
  // Zusatz zum Ergebnis (Text mit Formeln), z. B. „Gilt für $x \neq 0$."
  readonly resultNote?: string
  // Tipp für die ganze Aufgabe (im freien Modus)
  readonly ruleHint?: Explanation
  // Name des gesuchten Ergebnisses im freien Modus
  readonly answerLabel?: string
  // bei Wissensfragen: Id der Frage (für „Frage melden")
  readonly questionId?: string
}

// Mathe-Aufgabe: mit Term, Formel und Ergebnis
export type GuidedTask = GuidedTaskBase & {
  // die Aufgabe als Term (Aufgabenform); beim impliziten Ableiten linke minus rechte Seite.
  // Lernkarten zeigen davon keine Teile als Beispiel.
  readonly expr: Expr
  // Aufgabe als LaTeX: f(x) = …, die Gleichung oder der Bruchterm
  readonly functionLatex: string
  // Name des gesuchten Ergebnisses im freien Modus: f'(x) bzw. y'
  readonly answerLabel: string
  // Tipp für die ganze Aufgabe (im freien Modus), z. B. welche Regel ganz außen
  readonly ruleHint: Explanation
  readonly result: Expr
  readonly resultLatex: string
}

// Hat die Aufgabe alles, was der freie Modus der Mathe-Themen braucht?
export const isMathTask = (task: GuidedTaskBase): task is GuidedTask =>
  'result' in task && task.expr !== undefined && task.functionLatex !== undefined && task.resultLatex !== undefined
