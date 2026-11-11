// Wissensfragen (Chemie, später Werkstoffkunde): Format der Fragensammlungen. Alle Texte in eigenen
// Worten, im Format von explain/richText.ts (Text mit $…$-Formeln; chemische Formeln mit mhchem, z. B.
// $\ce{H2O}$, $\ce{^{37}_{17}Cl^-}$; Stoffnamen außerhalb von \ce). Regeln in docs/CHEMIE.md.

// Erklärung in zwei Längen (wie explain/texts.ts, hier ohne Abhängigkeit von der Mathe-Engine)
export type Explanation = { readonly detailed: string; readonly short: string }

export type QuizOption = {
  // eindeutig innerhalb der Frage
  readonly id: string
  readonly text: string
}

export type WrongOption = QuizOption & {
  // Id des Denkfehlers (Misconception) hinter dieser Antwort
  readonly misconception: string
  // „Warum ist das falsch?" nur für diese Antwort; ohne Angabe gilt der Text des Denkfehlers
  readonly why?: Explanation
}

export type QuestionLevel = 1 | 2 | 3

// Einfachauswahl: eine richtige Antwort, gezeigt mit drei falschen aus einem Vorrat von mindestens vier
export type SingleChoice = {
  readonly kind: 'single'
  // fest, nie umbenennen: [a-z0-9-], höchstens 40 Zeichen, über alle Fächer eindeutig
  readonly id: string
  // feste Nummer im Thema (1 bis 9999), nie neu vergeben (gelöschte in RETIRED der Sammlung)
  readonly no: number
  readonly level: QuestionLevel
  // Fakt-Schlüssel: Fragen zum selben Fakt kommen nicht kurz hintereinander
  readonly fact: string
  // Unterthema (Id aus parts des Themas in ui/catalog.ts, z. B. „isotope-ionen"); jede Frage gehört zu
  // genau einem. Auf der Themenseite und in der Mischung lässt sich ankreuzen, welche drankommen.
  readonly part: string
  // kurze Überschrift im Schritt, z. B. „Isotope"
  readonly title: string
  // die Frage
  readonly prompt: string
  readonly correct: QuizOption
  readonly wrong: readonly WrongOption[]
  // Tipp, ohne die Antwort zu verraten
  readonly hint: string
  // warum die richtige Antwort stimmt
  readonly explanation: Explanation
  // passende Lernkarten (Ids)
  readonly cards: readonly string[]
  // Fundstelle zum Nachlesen, nur der Ort (z. B. „Skript Aufbau der Materie, Folie 7"), keine Personen
  readonly ref?: string
  // Bild zur Frage (Id aus engine/chem/figures.ts), gezeigt unter der Frage
  readonly figure?: string
}

// „Wähle alle richtigen“ (N1): Aussagen, von denen eine oder mehrere stimmen. Gezeigt werden vier bis sechs
// Aussagen aus dem Vorrat, davon eine bis vier richtige und mindestens eine falsche (quiz/plan.ts). Jede
// falsche Aussage ist ein typischer Denkfehler wie bei der Einfachauswahl. Im Vorrat mindestens zwei
// richtige und drei falsche, damit jede Fassung anders aussieht.
export type MultiChoice = Omit<SingleChoice, 'kind' | 'correct'> & {
  readonly kind: 'multi'
  readonly correct: readonly QuizOption[]
}

// Zuordnen (N1b): Paare aus einem linken Eintrag und dem passenden rechten, z. B. Molekül ↔ Gestalt. Gezeigt
// werden vier bis sechs Paare aus dem Vorrat; rechts stehen die rechten Einträge dieser Paare (gleiche nur einmal),
// man ordnet jeder Zeile einen zu (quiz/plan.ts). Mehrere Zeilen dürfen dasselbe Ziel haben.
export type MatchPair = {
  // eindeutig innerhalb der Frage
  readonly id: string
  readonly left: string
  readonly right: string
}

// Typische Verwechslung: Zeile pair bekommt das Ziel right (der rechte Eintrag eines anderen Paars) – ein Denkfehler
export type MatchTrap = {
  readonly pair: string
  readonly right: string
  readonly misconception: string
  // „Warum ist das falsch?" nur für diese Verwechslung; ohne Angabe gilt der Text des Denkfehlers
  readonly why?: Explanation
}

export type MatchQuestion = Omit<SingleChoice, 'kind' | 'correct' | 'wrong'> & {
  readonly kind: 'match'
  readonly pairs: readonly MatchPair[]
  readonly traps: readonly MatchTrap[]
}

export type Question = SingleChoice | MultiChoice | MatchQuestion

// richtige Antworten einer Frage mit Antworten zum Auswählen (bei der Einfachauswahl genau eine)
export const correctOptionsOf = (question: SingleChoice | MultiChoice): readonly QuizOption[] =>
  question.kind === 'multi' ? question.correct : [question.correct]

// Denkfehler, die in einer Frage vorkommen können (falsche Antworten oder Verwechslungen)
export const misconceptionsIn = (question: Question): readonly string[] =>
  question.kind === 'match' ? question.traps.map((t) => t.misconception) : question.wrong.map((w) => w.misconception)

// Typischer Denkfehler (Id „chem-mis-…"): falsche Aussage und warum sie falsch ist. Der Text nennt den
// Fehler und die Regel, verrät aber nicht die richtige Antwort einer bestimmten Frage.
export type Misconception = {
  readonly id: string
  // kurzer Name für Fortschritt und Lernkarten (Text mit Formeln)
  readonly name: string
  // die falsche Aussage, z. B. „Isotope unterscheiden sich in der Protonenzahl."
  readonly wrongText: string
  readonly why: Explanation
}

// Denkfehler ohne Erklärung: Name und falsche Aussage (klein, für Fehlerstatistik und Lernkarten, die
// keine Fragen laden)
export type MisconceptionName = Pick<Misconception, 'id' | 'name' | 'wrongText'>

// Fragensammlung eines Themas
export type QuestionBank = {
  // Thema (Id aus ui/catalog.ts)
  readonly course: string
  readonly questions: readonly Question[]
  // Nummern gelöschter Fragen, die nie neu vergeben werden
  readonly retired: readonly number[]
}
