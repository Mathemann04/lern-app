import type { RuleId } from '../derive/rules.ts'
import type { Explanation } from '../explain/texts.ts'
import type { Expr } from '../expr/types.ts'
import type { TaskRef } from '../tasks/taskNumber.ts'

// Geführter Modus, für alle Themen gleich: eine Aufgabe als Folge von Bildschirm-Schritten mit
// Auswahl-Antworten. Die Schrittplaner der Themen (plan.ts fürs Ableiten, fractionPlan.ts für
// Brüche) bauen sie; die Oberfläche kennt nur diese Typen. Texte mit Formeln im Format von
// richText.ts.

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

export type GuidedTask = {
  readonly ref: TaskRef
  // die Aufgabe als Term (Aufgabenform); beim impliziten Ableiten linke minus rechte Seite.
  // Lernkarten zeigen davon keine Teile als Beispiel.
  readonly expr: Expr
  // Aufgabe als LaTeX: f(x) = …, die Gleichung oder der Bruchterm
  readonly functionLatex: string
  // Arbeitsauftrag, z. B. „Leite ab"
  readonly instruction: string
  // Name des gesuchten Ergebnisses im freien Modus: f'(x) bzw. y'
  readonly answerLabel: string
  readonly steps: readonly GuidedStep[]
  // Tipp für die ganze Aufgabe (im freien Modus), z. B. welche Regel ganz außen
  readonly ruleHint: Explanation
  readonly result: Expr
  readonly resultLatex: string
  // Zusatz zum Ergebnis (Text mit Formeln), z. B. „Gilt für $x \neq 0$."
  readonly resultNote?: string
  // Lernkarten zu allen Regeln der Aufgabe, außen zuerst
  readonly cards: readonly string[]
}
