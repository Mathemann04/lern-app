// Ratefallen (Chemie S12): Ist die richtige Antwort zu oft die längste (oder die kürzeste), kommt man durch Raten weit.
// Hier wird gezählt, wie lang eine Antwort sichtbar ist, und wie oft die richtige die längste bzw. kürzeste ist.

// sichtbare Länge eines Textes mit $…$-Formeln: Text je Zeichen; in Formeln zählt der Inhalt (Befehle wie \ce, \text,
// \frac fallen weg, andere Befehle wie \alpha zählen als ein Zeichen, Klammern, ^, _ und Leerzeichen gar nicht)
export function visibleLength(text: string): number {
  const formula = (f: string) =>
    f
      .replace(/\\(ce|text|mathrm|mathit|pu|frac|dfrac|left|right|,|;|:|!|quad|qquad)(?![a-zA-Z])/g, '')
      .replace(/\\[a-zA-Z]+/g, 'x')
      .replace(/[{}^_\s\\]/g, '')
  return text.replace(/\$([^$]*)\$/g, (_, f: string) => formula(f)).replace(/\*\*/g, '').length
}

// Antworten unter dieser Länge (die längste) zählen nicht: kurze Antworten wie Zahlen oder Formeln verraten nichts
export const MIN_LONGEST = 30

export type LengthStat = { readonly count: number; readonly longest: number; readonly shortest: number; readonly chance: number }

// Anteile über viele Auswahlen (je eine richtige): richtige ist die längste bzw. kürzeste (bei Gleichstand anteilig),
// dazu der Wert bei Zufall (1 durch die Zahl der Antworten, gemittelt). Nur Auswahlen mit mindestens drei Antworten.
export function lengthStat(choiceSets: readonly (readonly { readonly content: string; readonly correct: boolean }[])[]): LengthStat {
  let count = 0
  let longest = 0
  let shortest = 0
  let chance = 0
  for (const choices of choiceSets) {
    if (choices.length < 3 || choices.filter((c) => c.correct).length !== 1) continue
    const lengths = choices.map((c) => visibleLength(c.content))
    const max = Math.max(...lengths)
    if (max < MIN_LONGEST) continue
    const min = Math.min(...lengths)
    const right = lengths[choices.findIndex((c) => c.correct)]
    count++
    if (right === max) longest += 1 / lengths.filter((l) => l === max).length
    if (right === min) shortest += 1 / lengths.filter((l) => l === min).length
    chance += 1 / choices.length
  }
  return count === 0 ? { count, longest: 0, shortest: 0, chance: 0 } : { count, longest: longest / count, shortest: shortest / count, chance: chance / count }
}

// erlaubt: höchstens der Wert bei Zufall plus 10 Prozentpunkte
export const GUESS_MARGIN = 0.1
// und mindestens der Wert bei Zufall minus 15 Prozentpunkte: Ist die richtige fast nie die längste und fast nie die
// kürzeste, streicht man beide und rät aus der Mitte (auch das ist eine Ratefalle)
export const GUESS_LOWER = 0.15
