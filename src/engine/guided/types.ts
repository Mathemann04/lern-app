import type { RuleId } from '../derive/rules.ts'
import type { Explanation } from '../explain/texts.ts'
import type { Expr } from '../expr/types.ts'
import type { DragStep } from '../linalg/drag.ts'
import type { FalkFigure } from '../linalg/falk.ts'
import type { JordanFigure } from '../linalg/jordan.ts'
import type { SarrusFigure } from '../linalg/sarrus.ts'
import type { VectorDrawing } from '../linalg/figures.ts'
import type { NumericAnswer } from '../quantity/judge.ts'
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
  // Antwort als Bild (Id aus engine/chem/figures.ts), z. B. eine Lewis-Formel; content beschreibt es in Worten
  readonly figure?: string
  // Antwort als Vektor-Bild (M7, „Bild wählen“); content beschreibt es in Worten
  readonly drawing?: VectorDrawing
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
  // Bild unter der Frage (Id aus engine/chem/figures.ts), z. B. ein Ionengitter
  readonly figure?: string
  // Vektor-Bild unter der Frage (M7, engine/linalg/figures.ts)
  readonly drawing?: VectorDrawing
  // Vektor-Bild, das erst nach der Antwort erscheint (statt drawing), z. B. die gedrehte Gerade beim Gauß-Verfahren
  // (M7 Schritt 10b): Vorher verriete es die Antwort
  readonly solvedDrawing?: VectorDrawing
  // Falk-Schema unter der Frage (M7 Schritt 8b); abspielen lässt es sich erst nach der Antwort
  readonly falk?: FalkFigure
  // Sarrus-Schema unter der Frage (M7 Schritt 9b); abspielen lässt es sich erst nach der Antwort
  readonly sarrus?: SarrusFigure
  // Gauß-Jordan zum Abspielen (M7 Schritt 12c): erscheint erst nach der Antwort, am letzten Schritt des Verfahrens
  readonly jordan?: JordanFigure
  // Zahl als Ergebnis: Im freien Modus (Chemie, S8b) tippt man sie selbst ein, statt auszuwählen
  readonly numeric?: NumericAnswer
  // „Wähle alle richtigen“ (N1): mehrere Antworten können richtig sein; man kreuzt an und prüft einmal,
  // danach steht bei jeder Aussage, ob sie richtig gewählt, zu Unrecht gewählt oder vergessen ist
  readonly multi?: boolean
  // Zuordnen (N1b): jeder Zeile ein Ziel zuordnen und einmal prüfen; choices ist dann leer
  readonly match?: MatchStep
  // Ordnen (N1c): Glieder mit Pfeilknöpfen in die richtige Reihenfolge bringen und einmal prüfen; choices ist leer
  readonly order?: OrderStep
  // Orbital-Kästchen zum Antippen (N2a): im geführten Bildschirm statt der Auswahl; die Auswahl (choices) bleibt für
  // Klausuraufgaben und Galerie
  readonly boxes?: BoxInputStep
  // Pfeil ziehen (M7 Schritt 2b): Spitze oder Punkt im Bild ziehen (oder Koordinaten einstellen) und einmal prüfen
  // lassen; engine/linalg/drag.ts prüft. drawing zeigt das Gegebene, choices enthält nur eine richtige Stelle als Text
  // (für „Lösung zeigen“ und den Lösungsweg)
  readonly drag?: DragStep
}

// Kästchen-Eingabe: je Unterschale eine Zeile; Tippen schaltet leer → ↑ → ↓ → ↑↓ (engine/chem/boxInput.ts prüft)
export type BoxInputStep = {
  // Edelgaskern vor den Kästchen („Ar“) oder leer
  readonly core: string
  // Unterschalen in der gezeigten Reihenfolge, z. B. „4s“, mit der Zahl der Orbitale und der richtigen Zahl der Elektronen
  readonly rows: readonly { readonly shell: string; readonly orbitals: number; readonly count: number }[]
  // typische falsche Verteilungen der Elektronen auf die Unterschalen (z. B. 3d vor 4s), je Zeile die Zahl
  readonly alternatives: readonly { readonly rule: string; readonly counts: readonly number[] }[]
  // „Warum ist das falsch?" je Rechenfehler, der vorkommen kann
  readonly whys: Readonly<Record<string, Explanation>>
}

export type OrderStep = {
  // in der richtigen Reihenfolge, von first nach last
  readonly items: readonly { readonly id: string; readonly content: string }[]
  // Reihenfolge am Anfang (Ids), nie schon die richtige
  readonly start: readonly string[]
  readonly first: string
  readonly last: string
  // typische falsche Reihenfolgen dieser Fassung (nur solche, deren Glieder dastehen)
  readonly traps: readonly OrderStepTrap[]
}

export type OrderStepTrap = (
  | { readonly kind: 'reversed' }
  | { readonly kind: 'swap'; readonly before: string; readonly after: string }
) & { readonly errorRuleId: string; readonly whyWrong: Explanation }

export type MatchStep = {
  readonly rows: readonly MatchRow[]
  readonly targets: readonly { readonly id: string; readonly content: string }[]
}

export type MatchRow = {
  readonly id: string
  // linker Eintrag (Text mit Formeln)
  readonly content: string
  // Id des richtigen Ziels
  readonly answer: string
  // typische Verwechslungen dieser Zeile: Ziel, Denkfehler und warum das falsch ist
  readonly traps: readonly { readonly target: string; readonly errorRuleId: string; readonly whyWrong: Explanation }[]
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
  // Bild zum Ergebnis (Id aus engine/chem/figures.ts), z. B. der räumliche Bau eines Moleküls
  readonly resultFigure?: string
  // Vektor-Bild zum Ergebnis (M7), mit „Abspielen“
  readonly resultDrawing?: VectorDrawing
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
