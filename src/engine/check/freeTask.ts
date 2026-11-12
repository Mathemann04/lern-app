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
  // Eingabe in Kästchen (FreeTask.entries): je Teil und Eintrag, ob das Kästchen markiert wird (falsch, leer, nicht fertig)
  readonly marks?: readonly (readonly boolean[])[]
}

// Bildschirm-Tastatur: beim Ableiten alle Funktionen, bei Brüchen die Buchstaben der Aufgabe, bei
// Bausteinen e^x, ln, sin, cos, tan und bei Wurzeln √; beim Umstellen die Buchstaben der Aufgabe
// (bis zu sieben) und bei Wurzeln √
export type KeyboardSpec =
  | { readonly kind: 'derivative' }
  | { readonly kind: 'fraction'; readonly letters: readonly string[]; readonly blocks: boolean; readonly root: boolean; readonly imag?: boolean; readonly hyperbolic?: boolean }
  | { readonly kind: 'rearrange'; readonly letters: readonly string[]; readonly root: boolean; readonly exp?: boolean; readonly trig?: boolean; readonly pi?: boolean }
  // Vektoren (M7): Zahlen, Brüche, Wurzeln, Klammern, Komma
  | { readonly kind: 'vector' }

// Ein Teil des Ergebnisses, je Eintrag ein Kästchen (M7): Vektor als Spalte, Punkt als Zeile, eine Zahl, zwei Lösungen
// in beliebiger Reihenfolge. label ist LaTeX vor den Kästchen („\overrightarrow{AB} =", „Q", „t")
// Seit Schritt 2: choice (Auswahl unter options, eine Antwort) und inequality (Zeichen < oder > aus options, dann ein
// Kästchen); suffix steht hinter dem Kästchen einer Zahl (z. B. ^\circ)
export type EntryGroup = {
  readonly shape: 'vector' | 'point' | 'number' | 'solutions' | 'choice' | 'inequality'
  readonly label: string
  readonly count: number
  readonly options?: readonly string[]
  readonly suffix?: string
}

export type FreeTask = {
  // vor dem Eingabefeld, z. B. f'(x) = (LaTeX)
  readonly answerLabel: string
  // Name des Eingabefelds für Vorlesehilfen, z. B. „Deine Ableitung"
  readonly inputLabel: string
  readonly keyboard: KeyboardSpec
  check(latex: string): FreeVerdict
  // Gleichungen mit Zahlen (M6 Schritt 4b-3): Knopf „Keine Lösung", er prüft NO_SOLUTION_INPUT
  readonly noSolution?: true
  // Eingabe in Kästchen statt in einem Feld (M7, Vektoren): dann prüft checkEntries alle Kästchen zusammen
  readonly entries?: readonly EntryGroup[]
  checkEntries?(input: readonly (readonly string[])[]): FreeVerdict
}

// Eingabe des Knopfs „Keine Lösung" (leere Menge)
export const NO_SOLUTION_INPUT = '\\emptyset'
