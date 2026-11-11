import type { ChemErrorRule } from './errorRules.ts'

// Rechenfehler zum Thema „Chemisches Gleichgewicht" (S7a), Teil von CHEM_ERROR_RULES in errorRules.ts. Katalog in
// docs/PLAN-M4.md, „Katalog der Rechenfehler"; Katalogbeispiele in generators/mwg.test.ts. Die Texte nennen den Fehler und die
// Regel, aber nicht das Ergebnis des Schritts.

const C = 'chem-mwg'
const r = String.raw

export const MWG_ERROR_RULES: readonly ChemErrorRule[] = [
  {
    id: 'chem-mwg-exponent',
    course: C,
    name: 'Exponent passt nicht zum Koeffizienten',
    wrongFormula: r`\ce{N2 + 3 H2 <=> 2 NH3}:\ c(\ce{H2})\ \text{statt}\ c^{3}(\ce{H2})`,
    why: {
      detailed: 'Im Massenwirkungsgesetz wird jede Konzentration mit dem Koeffizienten ihres Stoffs aus der Gleichung potenziert. Prüfe für jeden Stoff, welche Zahl vor ihm steht.',
      short: 'Koeffizient wird zum Exponenten.',
    },
  },
  {
    id: 'chem-mwg-swapped',
    course: C,
    name: 'Zähler und Nenner vertauscht',
    wrongFormula: r`K_{\mathrm{GG}} = \frac{c(\ce{N2}) \cdot c^{3}(\ce{H2})}{c^{2}(\ce{NH3})}`,
    why: {
      detailed: 'Zähler und Nenner sind vertauscht. Ein großes $K_{\\mathrm{GG}}$ soll bedeuten, dass die Reaktion weit nach rechts abläuft; überlege, welche Stoffe dafür oben stehen müssen.',
      short: 'Zähler und Nenner vertauscht.',
    },
  },
  {
    id: 'chem-mwg-factor',
    course: C,
    name: 'Koeffizient als Faktor geschrieben',
    wrongFormula: r`2 \cdot c(\ce{NH3})\ \text{statt}\ c^{2}(\ce{NH3})`,
    why: {
      detailed: 'Ein Koeffizient zählt, wie oft ein Teilchen an der Reaktion beteiligt ist. Im Massenwirkungsgesetz wird seine Konzentration deshalb so oft malgenommen, nicht mit dem Koeffizienten multipliziert.',
      short: 'Koeffizient als Exponent, nicht als Faktor.',
    },
  },
  {
    id: 'chem-mwg-sum',
    course: C,
    name: 'Konzentrationen addiert statt multipliziert',
    wrongFormula: r`c(\ce{N2}) + c^{3}(\ce{H2})\ \text{im Nenner}`,
    why: {
      detailed: 'Im Massenwirkungsgesetz werden die Konzentrationen einer Seite miteinander multipliziert, nicht addiert.',
      short: 'Konzentrationen einer Seite malnehmen.',
    },
  },
  {
    id: 'chem-k-rates',
    course: C,
    name: 'Geschwindigkeitskonstanten falsch herum geteilt',
    wrongFormula: r`K_{\mathrm{GG}} = \frac{k_{\text{rück}}}{k_{\text{hin}}}`,
    why: {
      detailed: 'Die Konstanten stehen falsch herum im Bruch. Setze $v_{\\text{hin}} = v_{\\text{rück}}$ an und stelle sorgfältig so um, dass die Konstanten auf einer Seite stehen; prüfe dann, welche oben steht.',
      short: 'Sorgfältig umstellen.',
    },
  },
  {
    id: 'chem-k-product',
    course: C,
    name: 'Geschwindigkeitskonstanten multipliziert',
    wrongFormula: r`K_{\mathrm{GG}} = k_{\text{hin}} \cdot k_{\text{rück}}`,
    why: {
      detailed: 'Aus $v_{\\text{hin}} = v_{\\text{rück}}$ folgt durch Umstellen ein Quotient der beiden Geschwindigkeitskonstanten, kein Produkt.',
      short: 'Quotient, kein Produkt.',
    },
  },
  {
    id: 'chem-rate-products',
    course: C,
    name: 'Produkte in die Geschwindigkeit der Hinreaktion eingesetzt',
    wrongFormula: r`\ce{A + B <=> C}:\ v_{\text{hin}} = k_{\text{hin}} \cdot c(\ce{C})`,
    why: {
      detailed: 'Die Hinreaktion verbraucht die Stoffe links vom Doppelpfeil. Wie schnell sie läuft, hängt von deren Konzentrationen ab.',
      short: 'Hinreaktion: Konzentrationen der Edukte.',
    },
  },
  {
    id: 'chem-lc-pressure',
    course: C,
    name: 'Druck begünstige die Seite mit mehr Gasteilchen',
    wrongFormula: r`\ce{N2 + 3 H2 <=> 2 NH3}:\ \text{Druck erhöhen} \Rightarrow \text{Edukte}`,
    why: {
      detailed: 'Ein Gleichgewicht verstärkt eine Druckänderung nicht, es weicht ihr aus. Überlege, welche Seite den Druck in die Gegenrichtung ändern würde; gezählt werden die Gasteilchen.',
      short: 'Ausweichen, nicht verstärken.',
    },
  },
  {
    id: 'chem-lc-heat',
    course: C,
    name: 'Erwärmen helfe immer den Produkten',
    wrongFormula: r`\text{exotherme Reaktion: Erwärmen} \Rightarrow \text{Produkte}`,
    why: {
      detailed: 'Wärme bevorzugt nicht automatisch die Produkte und Kälte nicht automatisch die Edukte. Entscheidend ist, welche Richtung Wärme aufnimmt und welche Wärme abgibt; das verrät das Vorzeichen von $\\Delta H$.',
      short: 'Es zählt, welche Richtung Wärme aufnimmt.',
    },
  },
  {
    id: 'chem-lc-count',
    course: C,
    name: 'Koeffizienten beim Zählen der Gasteilchen vergessen',
    wrongFormula: r`\ce{H2 + I2 <=> 2 HI}:\ \text{Druck erhöhen} \Rightarrow \text{Produkte}`,
    why: {
      detailed: 'Gezählt werden nicht die Stoffe, sondern die Gasteilchen laut Gleichung: Jeder Koeffizient sagt, wie viele Teilchen eines Stoffs es sind.',
      short: 'Koeffizienten mitzählen.',
    },
  },
  {
    id: 'chem-lc-conc',
    course: C,
    name: 'Ausweichen zur Seite des zugegebenen Stoffs',
    wrongFormula: r`\ce{N2 + 3 H2 <=> 2 NH3}:\ \ce{N2}\ \text{zugeben} \Rightarrow \text{Edukte}`,
    why: {
      detailed: 'Ein Gleichgewicht verstärkt einen Zwang nicht, es weicht ihm aus. Überlege, wie es den Zwang verkleinern kann.',
      short: 'Ausweichen, nicht verstärken.',
    },
  },
  {
    id: 'chem-lc-exo-endo',
    course: C,
    name: 'Exotherm und endotherm verwechselt',
    wrongFormula: r`\Delta H < 0:\ \text{endotherm}`,
    why: {
      detailed: 'Exotherm heißt: Die Reaktion gibt Wärme ab, $\\Delta H$ ist negativ. Endotherm heißt: Sie nimmt Wärme auf, $\\Delta H$ ist positiv.',
      short: '$\\Delta H < 0$: exotherm, $\\Delta H > 0$: endotherm.',
    },
  },
  {
    id: 'chem-lc-no-shift',
    course: C,
    name: 'Zwang für wirkungslos gehalten',
    wrongFormula: r`\text{Temperatur ändern} \Rightarrow \text{Lage bleibt gleich}`,
    why: {
      detailed: 'Ein Zwang verschiebt die Lage des Gleichgewichts, wenn eine Richtung ihn verkleinern kann: mehr oder weniger Gasteilchen beim Druck, Wärme aufnehmen oder abgeben bei der Temperatur, einen Stoff verbrauchen oder bilden bei der Konzentration.',
      short: 'Kann eine Richtung den Zwang verkleinern?',
    },
  },
  {
    id: 'chem-lc-catalyst',
    course: C,
    name: 'Katalysator für eine bessere Ausbeute gehalten',
    wrongFormula: r`\text{Katalysator} \Rightarrow \text{mehr Produkt im Gleichgewicht}`,
    why: {
      detailed: 'Ein Katalysator beschleunigt Hin- und Rückreaktion gleichermaßen. Das Gleichgewicht stellt sich schneller ein, seine Lage bleibt aber dieselbe.',
      short: 'Schneller, aber gleiche Lage.',
    },
  },
]
