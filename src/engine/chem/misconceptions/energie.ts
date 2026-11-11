import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Energie bei Reaktionen“: Name und falsche Aussage (klein, für Fehlerstatistik und Lernkarten).
// Die Erklärungen stehen in energieWhy.ts. Regeln in docs/CHEMIE.md §8.

export const ENERGIE_MISCONCEPTIONS: readonly MisconceptionName[] = [
  { id: 'chem-mis-en-sign', name: 'Vorzeichen von ΔH vertauscht', wrongText: 'Bei einer exothermen Reaktion ist $\\Delta H$ positiv.' },
  { id: 'chem-mis-en-formation-def', name: 'Bildungsenthalpie falsch verstanden', wrongText: 'Die Bildungsenthalpie ist die Wärme, die beim Verbrennen eines Stoffs frei wird.' },
  { id: 'chem-mis-en-element-nonzero', name: 'Element mit Bildungsenthalpie', wrongText: 'Auch Elemente in ihrem Standardzustand, etwa $\\ce{O2(g)}$, haben eine Bildungsenthalpie ungleich 0.' },
  { id: 'chem-mis-en-element-any-form', name: 'Jede Form eines Elements zählt 0', wrongText: 'Jede Form eines Elements, etwa $\\ce{Br2(g)}$ oder Diamant, hat die Bildungsenthalpie 0.' },
  { id: 'chem-mis-en-standard-state', name: 'Standardzustand falsch', wrongText: 'Unter Standardbedingungen ist Brom gasförmig und Iod flüssig.' },
  { id: 'chem-mis-en-reversed', name: 'Edukte minus Produkte', wrongText: 'Die Reaktionsenthalpie ist die Summe der Edukte minus die Summe der Produkte.' },
  { id: 'chem-mis-en-coef', name: 'Koeffizienten ignoriert', wrongText: 'Die Bildungsenthalpie jedes Stoffs zählt genau einmal, egal welcher Koeffizient davorsteht.' },
  { id: 'chem-mis-en-state', name: 'Zustand egal', wrongText: 'Für Wasser ist es gleich, ob man den Wert für flüssiges Wasser oder für Wasserdampf nimmt.' },
  { id: 'chem-mis-en-reverse-reaction', name: 'Rückreaktion mit gleichem ΔH', wrongText: 'Die Rückreaktion hat dieselbe Reaktionsenthalpie wie die Hinreaktion.' },
  { id: 'chem-mis-en-first-law', name: 'Energie entsteht oder verschwindet', wrongText: 'Bei einer exothermen Reaktion entsteht Energie neu.' },
  { id: 'chem-mis-en-second-law', name: 'Entropie nimmt von selbst ab', wrongText: 'In einem abgeschlossenen System kann die Entropie von selbst abnehmen.' },
  { id: 'chem-mis-en-third-law', name: 'Absoluter Nullpunkt erreichbar', wrongText: 'Mit genug Aufwand lässt sich der absolute Nullpunkt erreichen.' },
  { id: 'chem-mis-en-entropy-order', name: 'Entropie als Ordnung', wrongText: 'Die Entropie ist ein Maß für die Ordnung: Je geordneter, desto größer.' },
  { id: 'chem-mis-en-phase-ds', name: 'Entropie beim Schmelzen und Verdampfen', wrongText: 'Beim Schmelzen und Verdampfen nimmt die Entropie ab.' },
  { id: 'chem-mis-en-phase-dh', name: 'Wärme beim Schmelzen und Verdampfen', wrongText: 'Beim Schmelzen und Verdampfen wird Wärme frei.' },
  { id: 'chem-mis-en-s-element', name: 'Elemente ohne Entropie', wrongText: 'Elemente im Standardzustand haben die Standardentropie 0.' },
  { id: 'chem-mis-en-gas-count', name: 'Stoffe statt Gasteilchen', wrongText: 'Für die Entropie zählt, wie viele verschiedene Stoffe auf einer Seite stehen.' },
  { id: 'chem-mis-en-exergonic-exotherm', name: 'Exergonisch heißt exotherm', wrongText: 'Exergonisch und exotherm bedeuten dasselbe.' },
  { id: 'chem-mis-en-exergonic-sign', name: 'Vorzeichen von ΔG vertauscht', wrongText: 'Eine Reaktion mit $\\Delta G > 0$ läuft freiwillig ab.' },
  { id: 'chem-mis-en-gibbs-sign', name: 'Gibbs-Helmholtz-Gleichung falsch', wrongText: 'Es gilt $\\Delta G = \\Delta H + T \\cdot \\Delta S$.' },
  { id: 'chem-mis-en-spont-fast', name: 'Freiwillig heißt schnell', wrongText: 'Eine freiwillig ablaufende Reaktion läuft auch schnell ab.' },
  { id: 'chem-mis-en-exo-always', name: 'Exotherm heißt freiwillig', wrongText: 'Jede exotherme Reaktion läuft freiwillig ab.' },
  { id: 'chem-mis-en-endo-never', name: 'Endotherm heißt nie freiwillig', wrongText: 'Eine endotherme Reaktion kann nie freiwillig ablaufen.' },
  { id: 'chem-mis-en-dg-temp', name: 'ΔG ohne Temperatur', wrongText: 'Die freie Enthalpie einer Reaktion hängt nicht von der Temperatur ab.' },
  { id: 'chem-mis-en-celsius', name: 'Temperatur in °C eingesetzt', wrongText: 'In $\\Delta G = \\Delta H - T \\cdot \\Delta S$ setzt man die Temperatur in °C ein.' },
  { id: 'chem-mis-en-units', name: 'kJ und J gemischt', wrongText: '$\\Delta H$ in kJ und $\\Delta S$ in J/K darf man direkt miteinander verrechnen.' },
  { id: 'chem-mis-en-k-sign', name: 'Negatives $\\Delta G^{0}$, kleines $K_{\\mathrm{GG}}$', wrongText: 'Ist $\\Delta G^{0}$ negativ, ist $K_{\\mathrm{GG}}$ kleiner als 1.' },
  { id: 'chem-mis-en-lg', name: 'Zehnerlogarithmus statt ln', wrongText: 'Es gilt $\\Delta G^{0} = -R \\cdot T \\cdot \\lg K_{\\mathrm{GG}}$.' },
  { id: 'chem-mis-en-cat-dg', name: 'Katalysator macht freiwillig', wrongText: 'Ein Katalysator kann eine Reaktion mit $\\Delta G > 0$ freiwillig machen.' },
]
