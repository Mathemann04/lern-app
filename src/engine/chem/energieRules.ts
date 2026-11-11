import type { ChemErrorRule } from './errorRules.ts'

// Rechenfehler zum Thema „Energie bei Reaktionen" (S7b), Teil von CHEM_ERROR_RULES in errorRules.ts. Katalog in docs/PLAN-M4.md,
// „Katalog der Rechenfehler"; Katalogbeispiele in generators/energie.test.ts. Die Texte nennen den Fehler und die Regel, aber
// nicht das Ergebnis des Schritts.

const C = 'chem-energie'
const r = String.raw

export const ENERGIE_ERROR_RULES: readonly ChemErrorRule[] = [
  {
    id: 'chem-dh-reversed',
    course: C,
    name: 'Edukte minus Produkte gerechnet',
    wrongFormula: r`\Delta H = \textstyle\sum (\text{Edukte}) - \sum (\text{Produkte})`,
    why: {
      detailed: 'Eine Änderung rechnet man immer als „nachher minus vorher“. Nachher, das sind die Produkte; abgezogen werden die Edukte. Das gilt für die Enthalpie wie für die Entropie.',
      short: 'Nachher minus vorher.',
    },
  },
  {
    id: 'chem-dh-coefficients',
    course: C,
    name: 'Koeffizienten vergessen',
    wrongFormula: r`\ce{2 H2O}:\ \Delta_f H^{0}\ \text{nur einmal gezählt}`,
    why: {
      detailed: 'Tabellenwerte gelten für 1 mol eines Stoffs. Steht ein Koeffizient vor dem Stoff, wird sein Wert so oft gezählt.',
      short: 'Wert mal Koeffizient.',
    },
  },
  {
    id: 'chem-dh-water-gas',
    course: C,
    name: 'Wert für Wasserdampf statt flüssiges Wasser genommen',
    wrongFormula: r`\ce{H2O(l)}:\ -241{,}8\ \text{statt}\ -285{,}8\,\mathrm{kJ/mol}`,
    why: {
      detailed: 'Wasser steht in der Gleichung mit seinem Zustand. Flüssiges Wasser und Wasserdampf haben verschiedene Bildungsenthalpien; nimm die Zeile, deren Zustand zur Gleichung passt.',
      short: 'Auf den Zustand achten.',
    },
  },
  {
    id: 'chem-dh-sign',
    course: C,
    name: 'Vorzeichen von ΔH falsch gedeutet',
    wrongFormula: r`\Delta H < 0:\ \text{Wärme wird aufgenommen}`,
    why: {
      detailed: 'Exotherm und endotherm sind vertauscht. Überlege, ob die Stoffe Energie gewinnen oder verlieren, wenn Wärme in die Umgebung geht, und welches Vorzeichen dazu passt.',
      short: 'Gewinnen oder verlieren die Stoffe Energie?',
    },
  },
  {
    id: 'chem-dh-phase',
    course: C,
    name: 'Wärme beim Wechsel des Aggregatzustands falsch eingeschätzt',
    wrongFormula: r`\text{Schmelzen}:\ \text{Wärme wird abgegeben}`,
    why: {
      detailed: 'Überlege, ob die Teilchen beim Übergang auseinanderrücken und dafür Anziehungskräfte überwinden müssen oder ob sie zusammenrücken und Kräfte wirksam werden. Was bedeutet das jeweils für die Wärme?',
      short: 'Rücken die Teilchen auseinander oder zusammen?',
    },
  },
  {
    id: 'chem-ds-sign',
    course: C,
    name: 'Vorzeichen von ΔS falsch eingeschätzt',
    wrongFormula: r`\text{Verdampfen}:\ \Delta S < 0`,
    why: {
      detailed: 'Die Entropie ist ein Maß für die Unordnung. Überlege, ob die Teilchen danach freier beweglich sind (fest, flüssig, gasförmig) und ob mehr oder weniger Gasteilchen vorliegen.',
      short: 'Wird es ungeordneter?',
    },
  },
  {
    id: 'chem-ds-count',
    course: C,
    name: 'Gasteilchen ohne Koeffizienten gezählt',
    wrongFormula: r`\ce{N2 + 3 H2 -> 2 NH3}:\ \text{links 2, rechts 1}`,
    why: {
      detailed: 'Gezählt wird die Stoffmenge an Gas laut Gleichung. Jeder Koeffizient sagt, wie viele Mol eines Stoffs es sind; Feststoffe und Flüssigkeiten zählen nicht mit.',
      short: 'Koeffizienten mitzählen.',
    },
  },
  {
    id: 'chem-ds-element-zero',
    course: C,
    name: 'Elementen die Entropie 0 gegeben',
    wrongFormula: r`S^{0}(\ce{O2}) = 0`,
    why: {
      detailed: 'Bei der Bildungsenthalpie haben Elemente im Standardzustand den Wert 0, bei der Entropie nicht: Auch ein Element hat bei 25 °C Unordnung. Erst am absoluten Nullpunkt wäre sie 0.',
      short: 'Auch Elemente haben Entropie.',
    },
  },
  {
    id: 'chem-dg-celsius',
    course: C,
    name: '°C statt K eingesetzt',
    wrongFormula: r`T = 25\ \text{statt}\ 298{,}15\,\mathrm{K}`,
    why: {
      detailed: 'In thermodynamischen Formeln steht die absolute Temperatur in Kelvin: $T = \\vartheta + 273{,}15$.',
      short: 'Temperatur in Kelvin.',
    },
  },
  {
    id: 'chem-dg-kelvin-twice',
    course: C,
    name: '273,15 abgezogen, obwohl das Ergebnis schon in Kelvin ist',
    wrongFormula: r`T = 463 - 273{,}15 = 190\,\mathrm{K}`,
    why: {
      detailed: 'Setzt man $\\Delta H$ in J und $\\Delta S$ in J/K ein, ergibt $T = \\Delta H/\\Delta S$ direkt eine Temperatur in Kelvin. Eine weitere Umrechnung ist nicht nötig.',
      short: 'Das Ergebnis ist schon in Kelvin.',
    },
  },
  {
    id: 'chem-dg-units',
    course: C,
    name: 'J und kJ nicht angeglichen',
    wrongFormula: r`\Delta H\ \text{in kJ},\ \Delta S\ \text{in J/K verrechnet}`,
    why: {
      detailed: 'Entropien stehen meist in J/K, Enthalpien in kJ; auch $R$ ist in J/(mol · K) angegeben. Bevor man sie verrechnet, müssen beide in derselben Einheit stehen: $1\\,\\mathrm{kJ} = 1000\\,\\mathrm{J}$.',
      short: 'Einheiten angleichen.',
    },
  },
  {
    id: 'chem-dg-lg',
    course: C,
    name: 'Zehnerpotenz statt e-Funktion',
    wrongFormula: r`K = 10^{\ln K}\ \text{statt}\ K = e^{\ln K}`,
    why: {
      detailed: 'In $\\Delta G^{0} = -R \\cdot T \\cdot \\ln K$ steht der natürliche Logarithmus. Sein Gegenstück ist die e-Funktion, nicht die Zehnerpotenz.',
      short: 'Zu ln gehört die e-Funktion.',
    },
  },
  {
    id: 'chem-dg-sign',
    course: C,
    name: 'Vorzeichen in der Gibbs-Helmholtz-Gleichung vertauscht',
    wrongFormula: r`\Delta G = \Delta H + T \cdot \Delta S`,
    why: {
      detailed: 'In $\\Delta G = \\Delta H - T \\cdot \\Delta S$ wird der Entropie-Term abgezogen; in $\\Delta G^{0} = -R \\cdot T \\cdot \\ln K$ steht ein Minus. Prüfe das Vorzeichen jedes Terms.',
      short: 'Vorzeichen prüfen.',
    },
  },
  {
    id: 'chem-dg-exergonic',
    course: C,
    name: 'ΔG > 0 für freiwillig gehalten',
    wrongFormula: r`\Delta G > 0:\ \text{freiwillig}`,
    why: {
      detailed: 'Exergonisch und endergonisch sind vertauscht. Überlege, ob das System bei einer freiwilligen Reaktion freie Enthalpie gewinnt oder verliert, und was das für das Vorzeichen bedeutet.',
      short: 'Gewinnt oder verliert das System?',
    },
  },
  {
    id: 'chem-dg-enthalpy-only',
    course: C,
    name: 'Nur ΔH beachtet, die Entropie vergessen',
    wrongFormula: r`\Delta H < 0 \Rightarrow \text{immer freiwillig}`,
    why: {
      detailed: 'Ob eine Reaktion freiwillig abläuft, entscheidet $\\Delta G$, nicht $\\Delta H$ allein. Der Term $T \\cdot \\Delta S$ kann das Vorzeichen umdrehen, je nach Temperatur.',
      short: 'ΔG entscheidet, nicht ΔH allein.',
    },
  },
]
