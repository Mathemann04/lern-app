import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Energie bei Reaktionen“ (Ids wie in energie.ts). Die Texte nennen den Fehler
// und die Regel, aber nicht die Antwort einer Frage; meist als Frage zum Weiterdenken. Wo eine Frage genau danach fragt, hat die
// Antwort einen eigenen Text.

export const ENERGIE_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-en-sign': {
    detailed: 'Das Vorzeichen von $\\Delta H$ zählt aus Sicht der reagierenden Stoffe. Überlege, ob sie Energie gewinnen oder verlieren, wenn Wärme in die Umgebung geht.',
    short: 'Aus Sicht der Stoffe zählen.',
  },
  'chem-mis-en-formation-def': {
    detailed: 'Die Bildungsenthalpie bezieht sich auf die Bildung eines Stoffs aus seinen Elementen, nicht auf eine Verbrennung oder ein Zerlegen in Atome.',
    short: 'Bildung aus den Elementen.',
  },
  'chem-mis-en-element-nonzero': {
    detailed: 'Die Bildungsenthalpien sind so festgelegt, dass Elemente in ihrem Standardzustand einen festen Bezugswert haben. Überlege, welcher Wert sich dafür anbietet.',
    short: 'Elemente sind der Bezugspunkt.',
  },
  'chem-mis-en-element-any-form': {
    detailed: 'Den Bezugswert hat nur der Standardzustand eines Elements, meist seine stabilste Form bei 25 °C und 1013 hPa. Andere Formen weichen davon ab.',
    short: 'Nur der Standardzustand ist der Bezugspunkt.',
  },
  'chem-mis-en-standard-state': {
    detailed: 'Der Standardzustand ist der Zustand bei 25 °C und 1013 hPa. Überlege, wie Brom und Iod bei Raumtemperatur aussehen.',
    short: 'Wie sieht der Stoff bei 25 °C aus?',
  },
  'chem-mis-en-reversed': {
    detailed: 'Eine Änderung rechnet man als „nachher minus vorher“. Überlege, welche Stoffe am Ende der Reaktion vorliegen.',
    short: 'Nachher minus vorher.',
  },
  'chem-mis-en-coef': {
    detailed: 'Tabellenwerte gelten für 1 mol. Ein Koeffizient sagt, wie viel Mol eines Stoffs an der Reaktion beteiligt sind.',
    short: 'Werte gelten für 1 mol.',
  },
  'chem-mis-en-state': {
    detailed: 'Flüssiges Wasser und Wasserdampf unterscheiden sich in ihrer Energie: Zum Verdampfen braucht man Wärme. Deshalb hat jeder Zustand seinen eigenen Tabellenwert.',
    short: 'Jeder Zustand hat seinen Wert.',
  },
  'chem-mis-en-reverse-reaction': {
    detailed: 'Die Rückreaktion führt von den Produkten zurück zu den Edukten. Überlege, was dabei mit „nachher minus vorher“ passiert.',
    short: 'Vorher und nachher tauschen.',
  },
  'chem-mis-en-first-law': {
    detailed: 'Nach dem ersten Hauptsatz kann Energie weder entstehen noch verschwinden; sie wird nur umgewandelt oder übertragen.',
    short: 'Energie bleibt erhalten.',
  },
  'chem-mis-en-second-law': {
    detailed: 'Der zweite Hauptsatz macht eine Aussage darüber, in welche Richtung sich die Entropie eines abgeschlossenen Systems von selbst ändern kann. Überlege, welche Richtung das ist.',
    short: 'Was sagt der zweite Hauptsatz?',
  },
  'chem-mis-en-third-law': {
    detailed: 'Der dritte Hauptsatz macht eine Aussage über den absoluten Nullpunkt der Temperatur. Prüfe, was er über das Erreichen dieser Temperatur sagt.',
    short: 'Was sagt der dritte Hauptsatz?',
  },
  'chem-mis-en-entropy-order': {
    detailed: 'Vergleiche einen perfekten Kristall mit einem Gas: Welcher hat mehr Möglichkeiten, seine Teilchen anzuordnen und zu bewegen?',
    short: 'Kristall oder Gas?',
  },
  'chem-mis-en-phase-ds': {
    detailed: 'Beim Schmelzen und Verdampfen werden die Teilchen beweglicher. Überlege, was das für die Unordnung bedeutet.',
    short: 'Die Teilchen werden beweglicher.',
  },
  'chem-mis-en-phase-dh': {
    detailed: 'Überlege für den genannten Vorgang, ob die Teilchen auseinanderrücken und dafür Anziehungskräfte überwinden müssen oder ob sie zusammenrücken und Kräfte wirksam werden. Was bedeutet das jeweils für die Wärme?',
    short: 'Rücken die Teilchen auseinander oder zusammen?',
  },
  'chem-mis-en-s-element': {
    detailed: 'Bei der Bildungsenthalpie ist der Wert 0 für Elemente eine Festlegung. Prüfe, ob es bei der Entropie eine solche Festlegung gibt.',
    short: 'Gibt es dieselbe Festlegung bei der Entropie?',
  },
  'chem-mis-en-gas-count': {
    detailed: 'Für die Entropie zählen die Gasteilchen laut Gleichung, also die Koeffizienten der gasförmigen Stoffe, nicht die Zahl der Stoffe.',
    short: 'Gasteilchen mit Koeffizienten zählen.',
  },
  'chem-mis-en-exergonic-exotherm': {
    detailed: 'Exotherm beschreibt die Wärme ($\\Delta H$), exergonisch die freie Enthalpie ($\\Delta G$). Beide hängen über $T \\cdot \\Delta S$ zusammen, sind aber nicht dasselbe.',
    short: 'ΔH und ΔG sind verschiedene Größen.',
  },
  'chem-mis-en-exergonic-sign': {
    detailed: 'Exergonisch und endergonisch sind vertauscht. Überlege, ob das System bei einer freiwilligen Reaktion freie Enthalpie gewinnt oder verliert.',
    short: 'Gewinnt oder verliert das System?',
  },
  'chem-mis-en-gibbs-sign': {
    detailed: 'Prüfe das Vorzeichen des Entropie-Terms: Mehr Unordnung soll eine Reaktion begünstigen, also $\\Delta G$ kleiner machen. Tut dein Term das?',
    short: 'Vorzeichen des Entropie-Terms prüfen.',
  },
  'chem-mis-en-spont-fast': {
    detailed: 'Prüfe, ob $\\Delta G$ überhaupt etwas über die Zeit aussagt, die eine Reaktion braucht.',
    short: 'Sagt ΔG etwas über die Zeit?',
  },
  'chem-mis-en-exo-always': {
    detailed: 'Ob eine Reaktion freiwillig abläuft, entscheidet $\\Delta G$, nicht $\\Delta H$ allein. Prüfe, wie sich der Entropie-Beitrag $-T \\cdot \\Delta S$ auswirkt.',
    short: 'Es entscheidet ΔG.',
  },
  'chem-mis-en-endo-never': {
    detailed: 'Ob eine Reaktion freiwillig abläuft, entscheidet $\\Delta G$, nicht $\\Delta H$ allein. Prüfe, wie sich der Entropie-Beitrag $-T \\cdot \\Delta S$ auswirkt.',
    short: 'Es entscheidet ΔG.',
  },
  'chem-mis-en-dg-temp': {
    detailed: 'Sieh dir die Gibbs-Helmholtz-Gleichung genau an: Kommt die Temperatur darin vor?',
    short: 'Kommt T in der Gleichung vor?',
  },
  'chem-mis-en-celsius': {
    detailed: 'Thermodynamische Formeln brauchen die absolute Temperatur in Kelvin: $T = \\vartheta + 273{,}15$.',
    short: 'Temperatur in Kelvin.',
  },
  'chem-mis-en-units': {
    detailed: 'Enthalpien stehen meist in kJ, Entropien in J/K. Vor dem Verrechnen müssen sie in dieselbe Einheit gebracht werden: $1\\,\\mathrm{kJ} = 1000\\,\\mathrm{J}$.',
    short: 'Einheiten angleichen.',
  },
  'chem-mis-en-k-sign': {
    detailed: 'Überlege, was ein negatives $\\Delta G^{0}$ für die Lage des Gleichgewichts bedeutet: Ist die Reaktion dann unter Standardbedingungen freiwillig, und was folgt daraus für $K_{\\mathrm{GG}}$?',
    short: 'Was bedeutet ein negatives $\\Delta G^{0}$ für die Lage?',
  },
  'chem-mis-en-lg': {
    detailed: 'In der Beziehung zwischen freier Standardenthalpie und Gleichgewichtskonstante steht der natürliche Logarithmus, passend zu $R \\cdot T$.',
    short: 'Natürlicher Logarithmus.',
  },
  'chem-mis-en-cat-dg': {
    detailed: 'Ein Katalysator liegt am Ende unverändert vor und gehört weder zu den Edukten noch zu den Produkten. Überlege, ob er dann $\\Delta G$ beeinflussen kann.',
    short: 'Gehört er zu Edukten oder Produkten?',
  },
}
