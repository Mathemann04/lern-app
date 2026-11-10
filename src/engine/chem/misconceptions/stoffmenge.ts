import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Stoffmenge und Umsatz“: Name und falsche Aussage (klein, für
// Fehlerstatistik und Lernkarten). Die Erklärungen „Warum ist das falsch?“ stehen in stoffmengeWhy.ts und laden
// erst mit den Fragen. Nur als falsche Antworten; Regeln in docs/CHEMIE.md §8.

export const STOFFMENGE_MISCONCEPTIONS: readonly MisconceptionName[] = [
  {
    id: 'chem-mis-st-n-times-m',
    name: "Stoffmenge als Masse mal molare Masse",
    wrongText: String.raw`Die Stoffmenge erhält man, indem man die Masse mit der molaren Masse malnimmt: $n = m \cdot M$.`,
  },
  {
    id: 'chem-mis-st-n-inverted',
    name: "Molare Masse durch Masse geteilt",
    wrongText: String.raw`Die Stoffmenge ist die molare Masse geteilt durch die Masse: $n = \frac{M}{m}$.`,
  },
  {
    id: 'chem-mis-st-m-divided',
    name: "Masse als Stoffmenge durch molare Masse",
    wrongText: String.raw`Die Masse einer Portion ist ihre Stoffmenge geteilt durch die molare Masse: $m = \frac{n}{M}$.`,
  },
  {
    id: 'chem-mis-st-avogadro-inverted',
    name: "Avogadro-Konstante falsch herum verwendet",
    wrongText: String.raw`Die Teilchenzahl erhält man, indem man die Stoffmenge durch die Avogadro-Konstante teilt: $N = \frac{n}{N_A}$.`,
  },
  {
    id: 'chem-mis-st-n-is-count',
    name: "Stoffmenge und Teilchenzahl gleichgesetzt",
    wrongText: "Die Stoffmenge in Mol ist dieselbe Zahl wie die Zahl der Teilchen in der Portion.",
  },
  {
    id: 'chem-mis-st-n-is-mass',
    name: "Stoffmenge mit Masse oder Volumen gleichgesetzt",
    wrongText: String.raw`Die Stoffmenge ist ein anderes Wort für die Masse: $10\,\mathrm{g}$ eines Stoffes sind $10\,\mathrm{mol}$.`,
  },
  {
    id: 'chem-mis-st-mol-is-mass',
    name: "Ein Mol für eine feste Masse gehalten",
    wrongText: String.raw`Ein Mol jedes Stoffes wiegt gleich viel, zum Beispiel $1\,\mathrm{g}$.`,
  },
  {
    id: 'chem-mis-st-mol-count-varies',
    name: "Teilchenzahl je Mol vom Stoff abhängig",
    wrongText: "Ein Mol eines Stoffes mit schweren Teilchen enthält weniger Teilchen als ein Mol eines Stoffes mit leichten Teilchen.",
  },
  {
    id: 'chem-mis-st-mol-only-gas',
    name: "Mol an Gase oder Bedingungen gebunden",
    wrongText: String.raw`Ein Mol enthält nur bei einem Gas unter Normbedingungen $6{,}022 \cdot 10^{23}$ Teilchen; Temperatur und Druck ändern diese Zahl.`,
  },
  {
    id: 'chem-mis-st-na-estimate',
    name: "Avogadro-Konstante für einen Schätzwert gehalten",
    wrongText: "Die Avogadro-Konstante ist nur ein ungefährer Messwert, weil sich Teilchen nicht genau zählen lassen.",
  },
  {
    id: 'chem-mis-st-power',
    name: "Zehnerpotenz falsch gesetzt",
    wrongText: String.raw`Die Avogadro-Konstante beträgt $6{,}022 \cdot 10^{-23}\,\mathrm{mol^{-1}}$, weil Teilchen so winzig sind.`,
  },
  {
    id: 'chem-mis-st-units',
    name: "Einheiten von Masse, Stoffmenge und molarer Masse verwechselt",
    wrongText: "Die molare Masse hat die Einheit Gramm, die Stoffmenge die Einheit Gramm je Mol.",
  },
  {
    id: 'chem-mis-st-atomic-number',
    name: "Ordnungszahl statt molarer Masse",
    wrongText: String.raw`Die molare Masse eines Elements ist seine Ordnungszahl in $\mathrm{g/mol}$.`,
  },
  {
    id: 'chem-mis-st-mass-number',
    name: "Molare Masse mit der Massenzahl gleichgesetzt",
    wrongText: String.raw`Die molare Masse eines Elements ist die Massenzahl eines seiner Isotope und deshalb immer ganzzahlig, für Chlor also $35$ oder $37\,\mathrm{g/mol}$.`,
  },
  {
    id: 'chem-mis-st-index-ignored',
    name: "Index übersehen oder falsch zugeordnet",
    wrongText: String.raw`In $\ce{NH3}$ zählt jedes Element einmal; der kleine Index ändert an der molaren Masse nichts.`,
  },
  {
    id: 'chem-mis-st-atom-for-molecule',
    name: "Atom statt Molekül",
    wrongText: String.raw`Stickstoff $\ce{N2}$ hat dieselbe molare Masse wie ein einzelnes Stickstoffatom.`,
  },
  {
    id: 'chem-mis-st-bracket',
    name: "Klammer nicht malgenommen",
    wrongText: String.raw`In $\ce{Ca(OH)2}$ gilt die 2 nur für das Wasserstoffatom direkt davor.`,
  },
  {
    id: 'chem-mis-st-hydrate-forgotten',
    name: "Kristallwasser vergessen",
    wrongText: String.raw`Das Wasser hinter dem Malpunkt in $\ce{CuSO4 * 5 H2O}$ zählt bei der molaren Masse nicht mit.`,
  },
  {
    id: 'chem-mis-st-hydrate-factor',
    name: "Zahl vor dem Kristallwasser falsch angewendet",
    wrongText: String.raw`In $\ce{CuSO4 * 5 H2O}$ gilt die 5 nur für den Wasserstoff, und der Malpunkt bedeutet malnehmen.`,
  },
  {
    id: 'chem-mis-st-atoms-molecules',
    name: "Atome und Moleküle verwechselt",
    wrongText: String.raw`$1\,\mathrm{mol}$ Sauerstoff $\ce{O2}$ enthält $6{,}022 \cdot 10^{23}$ Sauerstoffatome.`,
  },
  {
    id: 'chem-mis-st-atoms-all',
    name: "Alle Atome statt der Atome eines Elements gezählt",
    wrongText: String.raw`Nach den Wasserstoffatomen in $\ce{H2O}$ gefragt, zählt man alle drei Atome des Moleküls.`,
  },
  {
    id: 'chem-mis-st-same-mass-same-n',
    name: "Gleiche Masse für gleiche Stoffmenge gehalten",
    wrongText: "Zwei gleich schwere Portionen verschiedener Stoffe enthalten gleich viele Teilchen.",
  },
  {
    id: 'chem-mis-st-heavier-more',
    name: "Schwere Teilchen für viele Teilchen gehalten",
    wrongText: "Bei gleicher Masse enthält die Portion des Stoffes mit der größeren molaren Masse mehr Teilchen.",
  },
  {
    id: 'chem-mis-st-n-decides-mass',
    name: "Masse nur nach der Stoffmenge beurteilt",
    wrongText: "Gleiche Stoffmengen sind gleich schwer, und die Portion mit mehr Mol ist immer die schwerere.",
  },
  {
    id: 'chem-mis-st-m-ignores-n',
    name: "Masse nur nach der molaren Masse beurteilt",
    wrongText: "Eine Portion des Stoffes mit der größeren molaren Masse ist immer schwerer, egal wie viel Mol es sind.",
  },
  {
    id: 'chem-mis-st-molar-mass-portion',
    name: "Molare Masse für die Masse der Portion gehalten",
    wrongText: "Die molare Masse ändert sich mit der Größe der Portion: Halbiert man die Portion, halbiert sie sich auch.",
  },
  {
    id: 'chem-mis-st-particle-mass',
    name: "Masse eines Teilchens mit der molaren Masse verwechselt",
    wrongText: String.raw`Ein einzelnes Wassermolekül wiegt $18\,\mathrm{g}$.`,
  },
  {
    id: 'chem-mis-st-decimal',
    name: "Komma verrutscht",
    wrongText: String.raw`Ob eine molare Masse $4{,}4$, $44$ oder $440\,\mathrm{g/mol}$ beträgt, merkt man beim Rechnen ohnehin nicht.`,
  },
  {
    id: 'chem-mis-st-formula-split',
    name: "Summenformel in einzelne Elemente zerlegt",
    wrongText: String.raw`Glucose $\ce{C6H12O6}$ besteht aus drei Stoffen, $\ce{C6}$, $\ce{H12}$ und $\ce{O6}$, die man auch einzeln hinschreiben darf.`,
  },
  {
    id: 'chem-mis-st-formula-reduced',
    name: "Indizes einer Summenformel gekürzt",
    wrongText: String.raw`$\ce{C6H12O6}$ und $\ce{CH2O}$ beschreiben denselben Stoff; die Indizes darf man kürzen wie einen Bruch.`,
  },
  {
    id: 'chem-mis-st-index-coefficient',
    name: "Index und Koeffizient verwechselt",
    wrongText: String.raw`Die 2 in $\ce{Ca(OH)2}$ bedeutet, dass zwei Formeleinheiten Calciumhydroxid vorliegen.`,
  },
  {
    id: 'chem-mis-st-same-m-same-stoff',
    name: "Gleiche molare Masse für denselben Stoff gehalten",
    wrongText: "Zwei Stoffe mit derselben molaren Masse sind derselbe Stoff oder verhalten sich zumindest chemisch gleich.",
  },
  {
    id: 'chem-mis-st-salt-molecule',
    name: "Salz als Molekülverbindung gezählt",
    wrongText: String.raw`Kochsalz besteht aus $\ce{NaCl}$-Molekülen, so wie Wasser aus $\ce{H2O}$-Molekülen.`,
  },
  {
    id: 'chem-mis-st-prefix',
    name: "Vorsilbe milli falsch umgerechnet",
    wrongText: String.raw`$5\,\mathrm{mmol}$ sind dasselbe wie $5\,\mathrm{mol}$; die Vorsilbe darf man beim Rechnen weglassen.`,
  },
  {
    id: 'chem-mis-st-magnitude',
    name: "Größenordnung falsch beurteilt",
    wrongText: String.raw`Eine Stoffmenge über $1\,\mathrm{mol}$ gibt es nicht; ein solches Ergebnis ist immer falsch.`,
  },
]
