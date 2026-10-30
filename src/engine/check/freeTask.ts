import type { Explanation } from '../explain/texts.ts'

// Freier Modus, für alle Themen gleich: Die Engine eines Themas bereitet eine Aufgabe vor und
// prüft jede Eingabe; die Oberfläche (ui/free/) kennt nur diese Typen. Texte mit $…$-Formeln.

export type FreeVerdict = {
  // correct: richtig und fertig; unfinished: richtig gerechnet, aber noch nicht fertig (zählt nicht
  // als Fehler); unreadable: nicht lesbar (zählt nicht); wrong: falsch
  readonly kind: 'correct' | 'unfinished' | 'unreadable' | 'wrong'
  readonly title: string
  readonly message?: string
  // erkannter typischer Fehler, „Warum ist das falsch?" auf Knopfdruck
  readonly error?: { readonly id: string; readonly name: string; readonly why: Explanation }
  // Erklärung, die gleich zu sehen ist
  readonly explanation?: Explanation
}

// Bildschirm-Tastatur: beim Ableiten alle Funktionen, bei Brüchen die Buchstaben der Aufgabe, bei
// Bausteinen e^x, ln, sin, cos, tan und bei Wurzeln √; beim Umstellen die Buchstaben der Aufgabe
// (bis zu sieben) und bei Wurzeln √
export type KeyboardSpec =
  | { readonly kind: 'derivative' }
  | { readonly kind: 'fraction'; readonly letters: readonly string[]; readonly blocks: boolean; readonly root: boolean }
  | { readonly kind: 'rearrange'; readonly letters: readonly string[]; readonly root: boolean }

export type FreeTask = {
  // vor dem Eingabefeld, z. B. f'(x) = (LaTeX)
  readonly answerLabel: string
  // Name des Eingabefelds für Vorlesehilfen, z. B. „Deine Ableitung"
  readonly inputLabel: string
  readonly keyboard: KeyboardSpec
  check(latex: string): FreeVerdict
}
