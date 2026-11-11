import type { Explanation } from '../explain/texts.ts'

// Klausuraufgaben mit Punkten (Plan M4, „Probeklausur", Bewertung): Eine Aufgabe besteht aus Teilen (a, b,
// c …), jeder Teil aus Fragen mit Antworten zur Auswahl. Bis zur Abgabe sagt die App nicht, was stimmt.
// Folgefehler zählen nicht doppelt: Die Antworten einer Frage und die erwartete Antwort hängen von den
// früheren Antworten ab (build), auch über Teile hinweg.

export type ExamOption = {
  // gleich dem angezeigten Wert (zwei Antworten mit demselben Wert gibt es nicht)
  readonly id: string
  // Text mit Formeln
  readonly content: string
  // Wert für spätere Fragen, z. B. eine Zahl (Rational) oder eine Gleichung
  readonly value?: unknown
  // typischer Fehler hinter einer falschen Antwort
  readonly errorRuleId?: string
  // Anteil der Punkte für eine nicht ganz richtige Antwort (z. B. 0,5 für eine ausgeglichene Gleichung,
  // die nicht mit den kleinsten ganzen Zahlen geschrieben ist), mit kurzem Grund
  readonly share?: { readonly value: number; readonly reason: string }
  // Antwort als Bild (Id aus engine/chem/figures.ts), z. B. eine Lewis-Formel; content beschreibt es in Worten
  readonly figure?: string
}

export type ExamItemBuild = {
  readonly options: readonly ExamOption[]
  // richtig mit den bisherigen Antworten (Folgefehler)
  readonly expected: string
  // richtig, wenn alle früheren Antworten richtig sind
  readonly correct: string
  // Lösungsweg mit den bisherigen Antworten
  readonly explanation: Explanation
}

// gewählte Antwort einer früheren Frage
export type Chosen = (itemId: string) => ExamOption

export type ExamItem = {
  // eindeutig in der Aufgabe
  readonly id: string
  readonly title: string
  readonly question: string
  readonly points: number
  // Fragen, deren Antworten hier gebraucht werden (stehen in der Aufgabe weiter vorn)
  readonly dependsOn: readonly string[]
  // Ergebnis des Teils: richtig (auch als Folgefehler) gibt die vollen Punkte des Teils
  readonly final?: boolean
  readonly cards: readonly string[]
  // chosen: Antworten auf diesem Weg; truth: die richtigen Antworten
  build(chosen: Chosen, truth: Chosen): ExamItemBuild
}

export type ExamPart = {
  // „a", „b" …
  readonly id: string
  // Aufgabe des Teils (Text mit Formeln)
  readonly prompt: string
  readonly points: number
  readonly items: readonly ExamItem[]
}

export type ExamTask = {
  readonly title: string
  // Ausgangslage (Text mit Formeln) und Angaben als Formel (leer: keine Formel)
  readonly intro: string
  readonly givenLatex: string
  // Werte, mit denen gerechnet wird
  readonly note: string
  readonly parts: readonly ExamPart[]
}

// Antworten: Frage → gewählte Antwort
export type ExamAnswers = Readonly<Record<string, string>>
