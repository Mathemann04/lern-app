import type { Explanation } from '../quiz/types.ts'

// Typische Rechenfehler der Chemie-Rechnungen (Ids „chem-…", Katalog in docs/PLAN-M4.md, „Katalog der
// Rechenfehler"). Jeder Fehler rechnet die Aufgabe falsch weiter (generators/*); hier stehen Name,
// Katalogbeispiel als Formel und „Warum ist das falsch?". Der Text nennt den Fehler und die Regel, aber
// nicht das Ergebnis des Schritts. Die Denkfehler der Wissensfragen (chem-mis-…) stehen in
// misconceptions/.

export type ChemErrorRule = {
  readonly id: string
  // Thema (Id aus ui/catalog.ts)
  readonly course: string
  // kurzer Name (Text mit Formeln)
  readonly name: string
  // Katalogbeispiel als Formel (LaTeX), wie im Plan
  readonly wrongFormula: string
  readonly why: Explanation
}

const ATOMBAU = 'chem-atombau'
const STOFFMENGE = 'chem-stoffmenge'
const GLEICHUNGEN = 'chem-gleichungen'
const LOESUNGEN = 'chem-loesungen'
const IONEN = 'chem-ionen'

export const CHEM_ERROR_RULES: readonly ChemErrorRule[] = [
  {
    id: 'chem-neutrons-mass-number',
    course: ATOMBAU,
    name: 'Massenzahl und Neutronenzahl gleichgesetzt',
    wrongFormula: String.raw`\ce{^{37}_{17}Cl^-}\text{: } 37 \text{ Neutronen}`,
    why: {
      detailed: String.raw`Die Massenzahl $A$ zählt alle Teilchen im Kern, Protonen und Neutronen zusammen. Die Neutronen allein sind deshalb weniger: $N = A - Z$. Umgekehrt ist die Massenzahl die Summe $A = Z + N$.`,
      short: String.raw`Die Massenzahl zählt Protonen und Neutronen zusammen: $A = Z + N$.`,
    },
  },
  {
    id: 'chem-protons-neutrons-swapped',
    course: ATOMBAU,
    name: 'Protonen und Neutronen vertauscht',
    wrongFormula: String.raw`\ce{^{37}_{17}Cl^-}\text{: } 20 \text{ Protonen, } 17 \text{ Neutronen}`,
    why: {
      detailed: String.raw`Die Ordnungszahl $Z$ (unten links im Kernsymbol) zählt die Protonen und legt das Element fest. Die Neutronen sind der Rest bis zur Massenzahl, $N = A - Z$. Im ungeladenen Atom gibt es so viele Elektronen wie Protonen, nicht wie Neutronen.`,
      short: String.raw`Die Ordnungszahl $Z$ zählt die Protonen; Neutronen: $N = A - Z$.`,
    },
  },
  {
    id: 'chem-ion-charge-ignored',
    course: ATOMBAU,
    name: 'Ionenladung vergessen',
    wrongFormula: String.raw`\ce{^{37}_{17}Cl^-}\text{: } 17 \text{ Elektronen}`,
    why: {
      detailed: String.raw`Nur im ungeladenen Atom gibt es gleich viele Elektronen wie Protonen. Ein Ion hat Elektronen abgegeben oder aufgenommen; die Ladung $q$ oben rechts sagt, wie viele. Es gilt Elektronen $= Z - q$ und umgekehrt $q = Z - \text{Elektronen}$.`,
      short: String.raw`Beim Ion zählt die Ladung mit: Elektronen $= Z - q$.`,
    },
  },
  {
    id: 'chem-ion-charge-sign',
    course: ATOMBAU,
    name: 'Ladung mit falschem Vorzeichen verrechnet',
    wrongFormula: String.raw`\ce{^{37}_{17}Cl^-}\text{: } 16 \text{ Elektronen}`,
    why: {
      detailed: String.raw`Elektronen sind negativ geladen. Ein negatives Ion hat also Elektronen aufgenommen (mehr Elektronen als Protonen), ein positives hat welche abgegeben (weniger). Rechne mit dem Vorzeichen: Elektronen $= Z - q$, Ladung $q = Z - \text{Elektronen}$.`,
      short: String.raw`Negatives Ion: mehr Elektronen als Protonen; positives Ion: weniger.`,
    },
  },
  {
    id: 'chem-element-from-mass',
    course: ATOMBAU,
    name: 'Massenzahl als Ordnungszahl genommen',
    wrongFormula: String.raw`A = 37,\ Z = 17\text{: } \ce{Rb} \text{ statt } \ce{Cl}`,
    why: {
      detailed: String.raw`Das Element und damit die Ordnungszahl legt allein die Zahl der Protonen fest. Die Massenzahl zählt auch die Neutronen mit und ist von Isotop zu Isotop verschieden; über sie lässt sich das Element nicht bestimmen.`,
      short: 'Das Element legt allein die Protonenzahl fest, nicht die Massenzahl.',
    },
  },
  {
    id: 'chem-electrons-as-protons',
    course: ATOMBAU,
    name: 'Elektronen statt Protonen gezählt',
    wrongFormula: String.raw`\ce{^{37}_{17}Cl^-}\text{: } N = 37 - 18`,
    why: {
      detailed: String.raw`Beim Ion stimmen Elektronen- und Protonenzahl nicht überein. Element, Neutronen und Massenzahl hängen nur am Kern, also an den Protonen: Ordnungszahl $=$ Protonenzahl, $N = A - Z$, $A = Z + N$. Die Elektronen in der Hülle ändern daran nichts.`,
      short: 'Element, Neutronen und Massenzahl hängen an den Protonen, nicht an den Elektronen.',
    },
  },
  {
    id: 'chem-mass-number-electrons',
    course: ATOMBAU,
    name: 'Elektronen zur Massenzahl gezählt',
    wrongFormula: String.raw`\ce{^{37}_{17}Cl}\text{: } A = 17 + 20 + 17`,
    why: {
      detailed: String.raw`Die Massenzahl zählt nur die Teilchen im Kern: Protonen und Neutronen, $A = Z + N$. Elektronen gehören zur Hülle; sie sind fast 2000-mal leichter als ein Proton und zählen nicht mit.`,
      short: String.raw`Die Massenzahl zählt nur Protonen und Neutronen: $A = Z + N$.`,
    },
  },
  {
    id: 'chem-light-nm',
    course: ATOMBAU,
    name: 'Nanometer nicht in Meter umgerechnet',
    wrongFormula: String.raw`500\,\mathrm{nm}\text{: } E = 3{,}98 \cdot 10^{-28}\,\mathrm{J}`,
    why: {
      detailed: String.raw`Die Konstanten rechnen in Meter und Sekunde: $h$ in $\mathrm{J \cdot s}$, $c$ in $\mathrm{m/s}$. Eine Wellenlänge in Nanometer muss deshalb vor dem Einsetzen in Meter umgerechnet werden, und eine Wellenlänge, die die Formel in Meter liefert, für die Antwort in Nanometer zurück: $1\,\mathrm{nm} = 10^{-9}\,\mathrm{m}$.`,
      short: String.raw`Mit $h$ und $c$ nur in Meter rechnen: $1\,\mathrm{nm} = 10^{-9}\,\mathrm{m}$.`,
    },
  },
  {
    id: 'chem-light-formula',
    course: ATOMBAU,
    name: 'Formel falsch umgestellt',
    wrongFormula: String.raw`E = \frac{h \cdot \lambda}{c}`,
    why: {
      detailed: String.raw`Die Energie eines Photons wächst mit der Frequenz und sinkt mit der Wellenlänge: $E = h \cdot f$ und $c = \lambda \cdot f$. Stelle nach der gesuchten Größe um und prüfe die Einheit: Am Ende muss bei einer Energie $\mathrm{J}$ stehen, bei einer Frequenz $\mathrm{s^{-1}}$, bei einer Wellenlänge $\mathrm{m}$.`,
      short: String.raw`$E = h \cdot f$ und $c = \lambda \cdot f$; die Einheit zeigt, ob richtig umgestellt ist.`,
    },
  },
  // Stoffmenge und Umsatz (S3a)
  {
    id: 'chem-molar-index',
    course: STOFFMENGE,
    name: 'Index vergessen (auch Atom statt Molekül)',
    wrongFormula: String.raw`M(\ce{CO2}) = 12 + 16 = 28\,\mathrm{g/mol}`,
    why: {
      detailed: String.raw`Ein Index sagt, wie oft das Atom davor in der Formel vorkommt; jedes dieser Atome bringt seine Molmasse mit. Auch Elemente wie Sauerstoff kommen als Moleküle vor: $\ce{O2}$ enthält zwei Atome. Die Molmasse eines Atoms muss also so oft gezählt werden, wie der Index sagt.`,
      short: String.raw`Jedes Atom zählt so oft, wie der Index sagt, auch in $\ce{O2}$ oder $\ce{H2}$.`,
    },
  },
  {
    id: 'chem-molar-coefficient',
    course: STOFFMENGE,
    name: 'Koeffizient in die Molmasse mitgerechnet',
    wrongFormula: String.raw`\ce{2 C4H10}\text{: } M = 2 \cdot 58 = 116\ \text{statt}\ 58\,\mathrm{g/mol}`,
    why: {
      detailed: 'Die molare Masse gehört zum Stoff und ist die Masse von einem Mol davon, egal, was in der Gleichung davor steht. Der Koeffizient sagt nur, wie viele Teilchen miteinander reagieren; er kommt erst beim Verhältnis der Stoffmengen ins Spiel.',
      short: 'Die Molmasse gehört zum Stoff; der Koeffizient zählt erst beim Verhältnis.',
    },
  },
  {
    id: 'chem-molar-atomic-number',
    course: STOFFMENGE,
    name: 'Ordnungszahlen statt Molmassen',
    wrongFormula: String.raw`M(\ce{C4H10}) = 4 \cdot 6 + 10 \cdot 1 = 34\,\mathrm{g/mol}`,
    why: {
      detailed: 'Im Periodensystem stehen bei jedem Element zwei Zahlen. Die Ordnungszahl zählt nur die Protonen; die Molmasse gibt an, wie viel Gramm ein Mol des Elements wiegt, und berücksichtigt auch die Neutronen. Für die molare Masse zählen die Molmassen.',
      short: 'Für die molare Masse zählen die Molmassen der Elemente, nicht die Ordnungszahlen.',
    },
  },
  {
    id: 'chem-molar-bracket',
    course: STOFFMENGE,
    name: 'Klammer nicht malgenommen',
    wrongFormula: String.raw`M(\ce{Ca(OH)2}) = 40{,}1 + 16{,}0 + 2 \cdot 1{,}0 = 58{,}1\,\mathrm{g/mol}`,
    why: {
      detailed: String.raw`Ein Index hinter einer Klammer gilt für alles, was in der Klammer steht. Jedes Atom in der Klammer kommt also so oft vor, wie der Index sagt, nicht nur das letzte.`,
      short: 'Der Index hinter einer Klammer gilt für jedes Atom in der Klammer.',
    },
  },
  {
    id: 'chem-molar-hydrate',
    course: STOFFMENGE,
    name: 'Kristallwasser vergessen',
    wrongFormula: String.raw`M(\ce{CuSO4 * 5 H2O}) = 159{,}6\,\mathrm{g/mol}`,
    why: {
      detailed: String.raw`Das Wasser hinter dem Malpunkt ist fest im Kristall eingebaut und gehört zur Formeleinheit. Seine Masse zählt deshalb mit, und zwar so oft, wie die Zahl vor $\ce{H2O}$ sagt.`,
      short: String.raw`Kristallwasser gehört zur Formel; die Zahl davor gilt für das ganze $\ce{H2O}$.`,
    },
  },
  {
    id: 'chem-n-times',
    course: STOFFMENGE,
    name: 'Masse mal molare Masse statt geteilt',
    wrongFormula: String.raw`5{,}8\,\mathrm{g}\ \ce{C4H10}\text{: } n = 5{,}8 \cdot 58 = 336\,\mathrm{mol}`,
    why: {
      detailed: String.raw`Die molare Masse sagt, wie viel Gramm ein Mol wiegt. Wie viele Mol in einer Portion stecken, erfährst du, indem du ihre Masse durch die Masse eines Mols teilst: $n = \frac{m}{M}$. Die Einheiten zeigen es: $\mathrm{g} : \frac{\mathrm{g}}{\mathrm{mol}} = \mathrm{mol}$.`,
      short: String.raw`$n = \frac{m}{M}$; Gramm geteilt durch Gramm je Mol ergibt Mol.`,
    },
  },
  {
    id: 'chem-n-inverted',
    course: STOFFMENGE,
    name: 'Molare Masse durch Masse geteilt',
    wrongFormula: String.raw`5{,}8\,\mathrm{g}\ \ce{C4H10}\text{: } n = \frac{58}{5{,}8} = 10\,\mathrm{mol}`,
    why: {
      detailed: String.raw`In $n = \frac{m}{M}$ steht die Masse der Portion oben und die molare Masse unten. Umgekehrt ergibt sich als Einheit $\frac{1}{\mathrm{mol}}$, keine Stoffmenge. Prüfe: Eine kleine Portion enthält wenig Mol.`,
      short: String.raw`$n = \frac{m}{M}$: die Masse der Portion oben, die molare Masse unten.`,
    },
  },
  {
    id: 'chem-m-divided',
    course: STOFFMENGE,
    name: 'Stoffmenge und molare Masse geteilt statt malgenommen',
    wrongFormula: String.raw`0{,}5\,\mathrm{mol}\ \ce{H2O}\text{: } m = \frac{0{,}5}{18} = 0{,}0278\,\mathrm{g}`,
    why: {
      detailed: String.raw`Ein Mol wiegt so viel Gramm, wie die molare Masse angibt; mehrere Mol wiegen entsprechend mehr. Die Masse ist deshalb das Produkt $m = n \cdot M$; die Einheiten zeigen es: $\mathrm{mol} \cdot \frac{\mathrm{g}}{\mathrm{mol}} = \mathrm{g}$.`,
      short: String.raw`$m = n \cdot M$; Mol mal Gramm je Mol ergibt Gramm.`,
    },
  },
  {
    id: 'chem-particles-divided',
    course: STOFFMENGE,
    name: 'Avogadro-Konstante falsch herum verrechnet',
    wrongFormula: String.raw`0{,}5\,\mathrm{mol}\text{: } N = \frac{0{,}5}{6{,}022 \cdot 10^{23}} = 8{,}3 \cdot 10^{-25}`,
    why: {
      detailed: String.raw`Ein Mol enthält $N_A = 6{,}022 \cdot 10^{23}$ Teilchen. Die Zahl der Teilchen ist deshalb immer riesig groß: $N = n \cdot N_A$. Umgekehrt ist die Stoffmenge $n = \frac{N}{N_A}$. Eine Teilchenzahl unter 1 ist ein sicheres Zeichen für einen Fehler.`,
      short: String.raw`$N = n \cdot N_A$ und $n = \frac{N}{N_A}$.`,
    },
  },
  {
    id: 'chem-atoms-molecules',
    course: STOFFMENGE,
    name: 'Moleküle statt Atome gezählt',
    wrongFormula: String.raw`0{,}5\,\mathrm{mol}\ \ce{H2O}\text{: } 3{,}01 \cdot 10^{23}\ \ce{H}\text{-Atome}`,
    why: {
      detailed: String.raw`$N = n \cdot N_A$ zählt die Teilchen der Formel, also Moleküle oder Formeleinheiten. Enthält jedes davon mehrere Atome des gesuchten Elements, musst du noch mit dieser Zahl malnehmen: dem Index, bei einer Klammer oder bei Kristallwasser malgenommen.`,
      short: 'Noch mit der Zahl der Atome je Molekül bzw. Formeleinheit malnehmen.',
    },
  },
  // Reaktionsgleichungen (S3b)
  {
    id: 'chem-balance-index',
    course: GLEICHUNGEN,
    name: 'Index statt Koeffizient geändert',
    wrongFormula: String.raw`\ce{Mg + O2 -> MgO2}`,
    why: {
      detailed: String.raw`Ein Index gehört zur Formel des Stoffes: Ändert man ihn, entsteht ein anderer Stoff ($\ce{H2O2}$ ist Wasserstoffperoxid, kein Wasser). Ausgleichen darf man nur mit den Koeffizienten vor den Formeln; sie sagen, wie viele Teilchen eines Stoffes reagieren.`,
      short: 'Nur die Zahlen vor den Formeln ändern, nie die Indizes.',
    },
  },
  {
    id: 'chem-balance-single-atom',
    course: GLEICHUNGEN,
    name: String.raw`Einzelatom statt $\mathrm{X_2}$`,
    wrongFormula: String.raw`\ce{H2 + O -> H2O}`,
    why: {
      detailed: String.raw`Wasserstoff, Sauerstoff, Stickstoff und die Halogene kommen als Elemente nicht als einzelne Atome vor, sondern als zweiatomige Moleküle: $\ce{H2}$, $\ce{O2}$, $\ce{N2}$, $\ce{F2}$, $\ce{Cl2}$, $\ce{Br2}$, $\ce{I2}$. So stehen sie auch in der Gleichung.`,
      short: String.raw`Diese Elemente immer als Moleküle: $\ce{H2}$, $\ce{O2}$, $\ce{N2}$, $\ce{Cl2}$ usw.`,
    },
  },
  {
    id: 'chem-balance-partly-doubled',
    course: GLEICHUNGEN,
    name: 'Nur teilweise ausgeglichen',
    wrongFormula: String.raw`\ce{2 C2H6 + 7 O2 -> 2 CO2 + 6 H2O}`,
    why: {
      detailed: 'Ändert sich ein Koeffizient, ändert sich die Zahl der Atome aller Elemente in diesem Stoff. Deshalb muss nach jedem Schritt jedes Element noch einmal gezählt werden; beim Ganzzahlig-Machen werden alle Koeffizienten mit derselben Zahl malgenommen.',
      short: 'Alle Koeffizienten anpassen und zum Schluss jedes Element zählen.',
    },
  },
  {
    id: 'chem-balance-oxygen',
    course: GLEICHUNGEN,
    name: 'Sauerstoffatome falsch gezählt',
    wrongFormula: String.raw`\ce{C4H10 + 13 O2 -> 4 CO2 + 5 H2O}`,
    why: {
      detailed: String.raw`Jedes $\ce{O2}$ bringt zwei Sauerstoffatome mit. Die Zahl vor $\ce{O2}$ ist deshalb die Hälfte der Sauerstoffatome, die noch fehlen; Sauerstoff, der schon im Brennstoff steckt (bei Alkoholen), wird vorher abgezogen.`,
      short: String.raw`Fehlende O-Atome zählen, durch 2 teilen: Jedes $\ce{O2}$ bringt zwei mit.`,
    },
  },
  {
    id: 'chem-balance-water-oxygen',
    course: GLEICHUNGEN,
    name: 'Sauerstoff im Wasser vergessen',
    wrongFormula: String.raw`\ce{C3H8 + 3 O2 -> 3 CO2 + 4 H2O}`,
    why: {
      detailed: String.raw`Bei der Verbrennung landet Sauerstoff an zwei Stellen: im $\ce{CO2}$ und im $\ce{H2O}$. Beim Zählen der Sauerstoffatome rechts müssen beide Produkte mitzählen.`,
      short: String.raw`Auch jedes $\ce{H2O}$ enthält ein Sauerstoffatom.`,
    },
  },
  {
    id: 'chem-balance-co',
    course: GLEICHUNGEN,
    name: String.raw`$\ce{CO}$ statt $\ce{CO2}$`,
    wrongFormula: String.raw`\ce{2 CH4 + 3 O2 -> 2 CO + 4 H2O}`,
    why: {
      detailed: String.raw`Bei einer vollständigen Verbrennung reagiert der Kohlenstoff ganz zu Kohlenstoffdioxid $\ce{CO2}$. Kohlenstoffmonoxid $\ce{CO}$ entsteht nur, wenn zu wenig Sauerstoff da ist (unvollständige Verbrennung).`,
      short: String.raw`Vollständige Verbrennung: Kohlenstoff wird zu $\ce{CO2}$.`,
    },
  },
  {
    id: 'chem-balance-count-coefficient',
    course: GLEICHUNGEN,
    name: 'Koeffizient beim Zählen vergessen',
    wrongFormula: String.raw`\ce{4 Fe + 3 O2 -> 2 Fe2O3}\text{: links } 2 \text{ O-Atome}`,
    why: {
      detailed: 'Der Koeffizient gilt für die ganze Formel dahinter: Zwei Moleküle bringen doppelt so viele Atome mit wie eines. Die Atome eines Elements in einem Stoff sind deshalb Koeffizient mal Index.',
      short: 'Atome eines Stoffes: Koeffizient mal Index.',
    },
  },
  {
    id: 'chem-balance-count-index',
    course: GLEICHUNGEN,
    name: 'Index beim Zählen vergessen',
    wrongFormula: String.raw`\ce{4 Fe + 3 O2 -> 2 Fe2O3}\text{: links } 3 \text{ O-Atome}`,
    why: {
      detailed: 'Der Index zählt, wie oft ein Atom in einem einzigen Teilchen vorkommt. Wie viele Atome ein Stoff in die Gleichung bringt, ist deshalb Koeffizient mal Index, nicht der Koeffizient allein.',
      short: 'Atome eines Stoffes: Koeffizient mal Index, nicht der Koeffizient allein.',
    },
  },
  // Umsatz (S4a)
  {
    id: 'chem-ratio-one',
    course: STOFFMENGE,
    name: 'Stoffmengen im Verhältnis 1 : 1 gesetzt',
    wrongFormula: String.raw`\ce{2 C4H10 + 13 O2 -> 8 CO2 + 10 H2O}\text{: } n(\ce{CO2}) = 0{,}1\,\mathrm{mol}`,
    why: {
      detailed: 'Die Koeffizienten der Gleichung sagen, wie viele Teilchen der Stoffe zusammengehören. Nur wenn beide Koeffizienten gleich sind, sind auch die Stoffmengen gleich; sonst muss das Verhältnis der Koeffizienten berücksichtigt werden.',
      short: 'Die Stoffmengen stehen im Verhältnis der Koeffizienten, nicht 1 : 1.',
    },
  },
  {
    id: 'chem-ratio-swapped',
    course: STOFFMENGE,
    name: 'Verhältnis der Koeffizienten umgedreht',
    wrongFormula: String.raw`\ce{2 C4H10 + 13 O2 -> 8 CO2 + 10 H2O}\text{: } n(\ce{CO2}) = 0{,}1 \cdot \frac{2}{8}\,\mathrm{mol}`,
    why: {
      detailed: String.raw`Gesucht ist die Stoffmenge des anderen Stoffs. Der Koeffizient des gesuchten Stoffs gehört deshalb in den Zähler, der des gegebenen in den Nenner: $n(\text{gesucht}) = n(\text{gegeben}) \cdot \frac{\nu(\text{gesucht})}{\nu(\text{gegeben})}$. Prüfe: Steht vor dem gesuchten Stoff die größere Zahl, muss auch seine Stoffmenge größer sein.`,
      short: String.raw`$n(\text{gesucht}) = n(\text{gegeben}) \cdot \frac{\nu(\text{gesucht})}{\nu(\text{gegeben})}$`,
    },
  },
  {
    id: 'chem-ratio-product-only',
    course: STOFFMENGE,
    name: 'Nur mit dem Koeffizienten des gesuchten Stoffs malgenommen',
    wrongFormula: String.raw`\ce{2 C4H10 + 13 O2 -> 8 CO2 + 10 H2O}\text{: } n(\ce{CO2}) = 0{,}1 \cdot 8\,\mathrm{mol}`,
    why: {
      detailed: 'Es zählt das Verhältnis beider Koeffizienten. Steht vor dem gegebenen Stoff eine Zahl größer 1, muss durch sie geteilt werden; der Koeffizient des gesuchten Stoffs allein reicht nicht.',
      short: 'Durch den Koeffizienten des gegebenen Stoffs teilen, nicht nur malnehmen.',
    },
  },
  {
    id: 'chem-ratio-wrong-molar-mass',
    course: STOFFMENGE,
    name: 'Molmasse des gegebenen Stoffs für den gesuchten (oder Massen ins Verhältnis gesetzt)',
    wrongFormula: String.raw`5{,}8\,\mathrm{g}\ \ce{C4H10} \rightarrow m(\ce{CO2}) = 0{,}4 \cdot 58 = 23{,}2\,\mathrm{g}`,
    why: {
      detailed: 'Am Ende wird die Stoffmenge des gesuchten Stoffs mit seiner eigenen molaren Masse malgenommen. Massen selbst stehen nicht im Verhältnis der Koeffizienten, nur Stoffmengen; wer die Massen ins Verhältnis setzt, rechnet versehentlich mit der Molmasse des gegebenen Stoffs.',
      short: 'Die Masse des gesuchten Stoffs mit seiner eigenen molaren Masse berechnen.',
    },
  },
  {
    id: 'chem-similar-molar-mass',
    course: STOFFMENGE,
    name: 'Molmasse eines ähnlichen Stoffs genommen',
    wrongFormula: String.raw`m(\ce{CO2}) = 0{,}4 \cdot M(\ce{CO}) = 11{,}2\,\mathrm{g}`,
    why: {
      detailed: String.raw`Ähnliche Formeln wie $\ce{CO}$ und $\ce{CO2}$ haben verschiedene molare Massen. Nimm die Formel des gesuchten Stoffs genau so, wie sie in der Gleichung steht.`,
      short: 'Die Formel des gesuchten Stoffs genau aus der Gleichung nehmen.',
    },
  },
  {
    id: 'chem-ratio-other-coefficient',
    course: STOFFMENGE,
    name: 'Koeffizient eines anderen Stoffs genommen',
    wrongFormula: String.raw`\ce{CH4 + 2 O2 -> CO2 + 2 H2O}\text{: } n(\ce{CO2}) = n(\ce{CH4}) \cdot 2`,
    why: {
      detailed: 'Für das Verhältnis zählen nur die Koeffizienten der beiden Stoffe, um die es geht: des gegebenen und des gesuchten. Die Zahlen vor den übrigen Stoffen der Gleichung spielen dafür keine Rolle.',
      short: 'Nur die Koeffizienten des gegebenen und des gesuchten Stoffs zählen.',
    },
  },
  // Gase und Lösungen (S4b)
  {
    id: 'chem-ml-not-l',
    course: LOESUNGEN,
    name: 'Milliliter nicht in Liter umgerechnet',
    wrongFormula: String.raw`0{,}1\,\mathrm{mol}\ \text{in}\ 200\,\mathrm{mL}\text{: } c = \frac{0{,}1}{200} = 0{,}0005\,\mathrm{mol/L}`,
    why: {
      detailed: String.raw`Konzentrationen in $\mathrm{mol/L}$ oder $\mathrm{g/L}$ beziehen sich auf Liter. Ein Volumen in Millilitern muss deshalb vorher umgerechnet werden: $1\,\mathrm{mL} = 0{,}001\,\mathrm{L}$. Sonst liegt das Ergebnis um den Faktor 1000 daneben.`,
      short: String.raw`Erst in Liter umrechnen: $1\,\mathrm{mL} = 0{,}001\,\mathrm{L}$.`,
    },
  },
  {
    id: 'chem-c-inverted',
    course: LOESUNGEN,
    name: 'Formel der Konzentration falsch herum',
    wrongFormula: String.raw`c = \frac{V}{n} = 2\,\mathrm{L/mol}`,
    why: {
      detailed: String.raw`Die Konzentration ist Stoffmenge je Volumen: $c = \frac{n}{V}$, in $\mathrm{mol/L}$. Umgestellt gilt $n = c \cdot V$ und $V = \frac{n}{c}$. Die Einheit zeigt, ob richtig umgestellt ist.`,
      short: String.raw`$c = \frac{n}{V}$; die Einheit $\mathrm{mol/L}$ prüft das Umstellen.`,
    },
  },
  {
    id: 'chem-molar-incomplete',
    course: LOESUNGEN,
    name: 'Molmasse unvollständig',
    wrongFormula: String.raw`M(\ce{NH4Cl}) = 14 + 35{,}5 = 49{,}5\,\mathrm{g/mol}`,
    why: {
      detailed: 'Abgewogen wird der ganze Stoff, also zählt die molare Masse der ganzen Formel: jedes Atom so oft, wie es vorkommt, auch die Wasserstoffatome und gegebenenfalls das Kristallwasser.',
      short: 'Die molare Masse der ganzen Formel nehmen, mit allen Atomen.',
    },
  },
  {
    id: 'chem-celsius',
    course: LOESUNGEN,
    name: String.raw`Temperatur in $^{\circ}\mathrm{C}$ statt in Kelvin eingesetzt`,
    wrongFormula: String.raw`T = 25\ \text{statt}\ 298{,}15\,\mathrm{K}`,
    why: {
      detailed: String.raw`Im Gasgesetz steht die absolute Temperatur in Kelvin; sie beginnt beim absoluten Nullpunkt. Umrechnen: $T = \vartheta + 273{,}15$. Mit Grad Celsius gerechnet, käme bei $0\,^{\circ}\mathrm{C}$ sogar das Volumen null heraus.`,
      short: String.raw`Im Gasgesetz $T$ in Kelvin: $T = \vartheta + 273{,}15$.`,
    },
  },
  {
    id: 'chem-hpa',
    course: LOESUNGEN,
    name: 'Druck nicht in Pascal umgerechnet',
    wrongFormula: String.raw`p = 1013\ \text{statt}\ 101\,300\,\mathrm{Pa}`,
    why: {
      detailed: String.raw`Mit $R = 8{,}314\,\mathrm{J/(mol \cdot K)}$ wird in SI-Einheiten gerechnet: Druck in Pascal, Volumen in Kubikmetern. $1\,\mathrm{hPa} = 100\,\mathrm{Pa}$, $1\,\mathrm{bar} = 10^{5}\,\mathrm{Pa}$.`,
      short: String.raw`Druck in Pascal: $1\,\mathrm{hPa} = 100\,\mathrm{Pa}$.`,
    },
  },
  {
    id: 'chem-vm-conditions',
    course: LOESUNGEN,
    name: 'Molares Volumen anderer Bedingungen verwendet',
    wrongFormula: String.raw`1\,\mathrm{mol}\ \text{bei}\ 25\,^{\circ}\mathrm{C}\text{: } 22{,}4\ \text{statt}\ 24{,}5\,\mathrm{L}`,
    why: {
      detailed: String.raw`Das molare Volumen hängt von Temperatur und Druck ab: $22{,}4\,\mathrm{L/mol}$ gilt bei $0\,^{\circ}\mathrm{C}$ und $1013\,\mathrm{hPa}$, bei $25\,^{\circ}\mathrm{C}$ sind es etwa $24{,}5\,\mathrm{L/mol}$. Unter anderen Bedingungen rechnet man mit dem Gasgesetz $p \cdot V = n \cdot R \cdot T$.`,
      short: 'Das molare Volumen gilt nur für seine Temperatur und seinen Druck.',
    },
  },
  {
    id: 'chem-vm-inverted',
    course: LOESUNGEN,
    name: 'Durch das molare Volumen geteilt statt malgenommen (oder umgekehrt)',
    wrongFormula: String.raw`0{,}5\,\mathrm{mol}\text{: } V = \frac{0{,}5}{22{,}4} = 0{,}0223\,\mathrm{L}`,
    why: {
      detailed: String.raw`Das molare Volumen ist das Volumen eines Mols. Mehrere Mol nehmen entsprechend mehr Platz ein: $V = n \cdot V_m$, umgekehrt $n = \frac{V}{V_m}$. Die Einheiten zeigen es: $\mathrm{mol} \cdot \mathrm{L/mol} = \mathrm{L}$.`,
      short: String.raw`$V = n \cdot V_m$ und $n = \frac{V}{V_m}$.`,
    },
  },
  {
    id: 'chem-fraction-solvent',
    course: LOESUNGEN,
    name: 'Durch die Masse des Wassers statt der Lösung geteilt',
    wrongFormula: String.raw`10\,\mathrm{g}\ \text{Salz in}\ 90\,\mathrm{g}\ \text{Wasser: } w = 11{,}1\,\%`,
    why: {
      detailed: 'Der Massenanteil bezieht den gelösten Stoff auf die ganze Lösung. Im Nenner steht deshalb die Masse von gelöstem Stoff und Wasser zusammen, nicht die des Wassers allein.',
      short: 'Im Nenner die Masse der ganzen Lösung: Stoff plus Wasser.',
    },
  },
  {
    id: 'chem-mass-conc-inverted',
    course: LOESUNGEN,
    name: 'Massenkonzentration als Volumen durch Masse',
    wrongFormula: String.raw`3\,\mathrm{g}\ \text{in}\ 100\,\mathrm{mL}\text{: } 0{,}0333\,\mathrm{L/g}`,
    why: {
      detailed: String.raw`Die Massenkonzentration ist Masse je Volumen, $\beta = \frac{m}{V}$ in $\mathrm{g/L}$. Steht am Ende eine Einheit wie $\mathrm{L/g}$, ist die Formel falsch herum.`,
      short: String.raw`$\beta = \frac{m}{V}$ in $\mathrm{g/L}$.`,
    },
  },
  {
    id: 'chem-ppb',
    course: LOESUNGEN,
    name: 'ppm, ppb und ppt verwechselt',
    wrongFormula: String.raw`5\,\mathrm{ppb}\ \text{als}\ 5 \cdot 10^{-12}`,
    why: {
      detailed: String.raw`ppm steht für Millionstel ($10^{-6}$), ppb für Milliardstel ($10^{-9}$), ppt für Billionstel ($10^{-12}$). Das englische „billion“ ist die deutsche Milliarde.`,
      short: String.raw`ppm $= 10^{-6}$, ppb $= 10^{-9}$, ppt $= 10^{-12}$.`,
    },
  },
  {
    id: 'chem-vol-percent',
    course: LOESUNGEN,
    name: 'Prozentangabe nicht durch 100 geteilt',
    wrongFormula: String.raw`40\,\mathrm{Vol}\text{-}\%\ \text{von}\ 0{,}5\,\mathrm{L}\text{: } 20\ \text{statt}\ 0{,}2\,\mathrm{L}`,
    why: {
      detailed: String.raw`Prozent heißt „von hundert“: $40\,\%$ sind $\frac{40}{100} = 0{,}4$. Ein Anteil kann nie mehr sein als das Ganze; ein Ergebnis größer als die ganze Menge ist ein sicheres Zeichen für diesen Fehler.`,
      short: String.raw`$40\,\% = 0{,}4$: durch 100 teilen.`,
    },
  },
  {
    id: 'chem-percent-not-times',
    course: LOESUNGEN,
    name: 'Anteil nicht mit 100 % malgenommen',
    wrongFormula: String.raw`\frac{10\,\mathrm{g}}{200\,\mathrm{g}} = 0{,}05\,\%\ \text{statt}\ 5\,\%`,
    why: {
      detailed: String.raw`Teil geteilt durch Ganzes ergibt eine Dezimalzahl wie $0{,}05$. In Prozent wird daraus erst durch Malnehmen mit $100\,\%$: $0{,}05 = 5\,\%$. Ohne diesen Schritt ist der Anteil hundertmal zu klein.`,
      short: String.raw`Dezimalzahl mal $100\,\%$ ergibt Prozent.`,
    },
  },
  // Ionenbindung und Salze (S5a)
  {
    id: 'chem-salt-anion-positive',
    course: IONEN,
    name: 'Nichtmetall als Kation',
    wrongFormula: String.raw`\ce{Na3P}\text{: } \ce{P^3+}\ \text{statt}\ \ce{P^3-}`,
    why: {
      detailed: 'Nichtmetalle nehmen Elektronen auf, bis sie die Edelgaskonfiguration erreichen; dabei werden sie negativ geladen. Positive Ionen bilden die Metalle, die Elektronen abgeben.',
      short: 'Nichtmetalle nehmen Elektronen auf und werden zu Anionen.',
    },
  },
  {
    id: 'chem-salt-anion-valence',
    course: IONEN,
    name: 'Ladung des Anions aus den Valenzelektronen',
    wrongFormula: String.raw`\ce{O^6-}\ \text{statt}\ \ce{O^2-}`,
    why: {
      detailed: 'Die Ladung eines einatomigen Anions ist die Zahl der Elektronen, die es aufnimmt, nicht die Zahl seiner Valenzelektronen. Aufgenommen werden so viele, wie bis acht Valenzelektronen fehlen.',
      short: 'Ladung = Zahl der aufgenommenen Elektronen, bis acht fehlen.',
    },
  },
  {
    id: 'chem-salt-polyatomic-charge',
    course: IONEN,
    name: 'Molekül-Ion mit falscher Ladung',
    wrongFormula: String.raw`\ce{SO4^-}\ \text{statt}\ \ce{SO4^2-}`,
    why: {
      detailed: 'Molekül-Ionen wie Sulfat, Nitrat, Carbonat oder Phosphat haben eine feste Ladung, die man nicht aus der Formel ablesen kann. Sie muss man kennen; die Lernkarte zu den Molekül-Ionen listet sie auf.',
      short: 'Die Ladungen der Molekül-Ionen muss man kennen.',
    },
  },
  {
    id: 'chem-salt-not-reduced',
    course: IONEN,
    name: 'Indizes nicht gekürzt',
    wrongFormula: String.raw`\ce{Mg2S2}\ \text{statt}\ \ce{MgS}`,
    why: {
      detailed: 'Die Formel eines Salzes gibt das kleinste ganzzahlige Verhältnis der Ionen an. Über Kreuz genommene Ladungen müssen deshalb noch gekürzt werden, wenn sie einen gemeinsamen Teiler haben.',
      short: 'Salzformeln mit dem kleinsten ganzzahligen Verhältnis.',
    },
  },
  {
    id: 'chem-salt-indices-swapped',
    course: IONEN,
    name: 'Indizes vertauscht',
    wrongFormula: String.raw`\ce{Al3O2}\ \text{statt}\ \ce{Al2O3}`,
    why: {
      detailed: 'Der Index eines Ions sagt, wie viele davon nötig sind, damit sich die Ladungen aufheben. Die Ladung des Kations bestimmt also, wie viele Anionen gebraucht werden, und umgekehrt. Probe: Index mal Ladung muss für beide Ionen gleich groß sein.',
      short: 'Probe: Index mal Ladung ist für Kation und Anion gleich.',
    },
  },
  {
    id: 'chem-salt-one-to-one',
    course: IONEN,
    name: 'Ionen 1 : 1 kombiniert',
    wrongFormula: String.raw`\ce{AlO}\ \text{statt}\ \ce{Al2O3}`,
    why: {
      detailed: 'Ein Salz ist nach außen neutral. Haben Kation und Anion verschieden große Ladungen, heben sich ein Kation und ein Anion nicht auf; es braucht mehr von der Sorte mit der kleineren Ladung.',
      short: 'Die Ladungen müssen sich aufheben.',
    },
  },
  {
    id: 'chem-salt-bracket',
    course: IONEN,
    name: 'Klammer um das Molekül-Ion vergessen',
    wrongFormula: String.raw`\ce{CaNO32}\ \text{statt}\ \ce{Ca(NO3)2}`,
    why: {
      detailed: 'Kommt ein Molekül-Ion mehrmals vor, steht es in Klammern und der Index dahinter gilt für die ganze Gruppe. Ohne Klammer würde der Index zur letzten Atomsorte gehören und die Formel einen anderen Stoff beschreiben.',
      short: 'Mehrere Molekül-Ionen: in Klammern, Index dahinter.',
    },
  },
  {
    id: 'chem-salt-numeral-count',
    course: IONEN,
    name: 'Römische Ziffer als Anzahl gelesen',
    wrongFormula: String.raw`\text{Eisen(III)-chlorid: } \ce{Fe3Cl}\ \text{statt}\ \ce{FeCl3}`,
    why: {
      detailed: 'Die römische Ziffer im Namen ist die Ladung des Metall-Ions, nicht die Zahl der Metall-Atome in der Formel. Aus der Ladung folgt erst über den Ladungsausgleich, wie viele Ionen jeder Sorte nötig sind.',
      short: 'Die römische Ziffer ist die Ladung des Kations.',
    },
  },
  {
    id: 'chem-salt-charge-from-index',
    course: IONEN,
    name: 'Index als Ladung gelesen',
    wrongFormula: String.raw`\ce{Fe2O3}\text{: } \ce{Fe^2+}\ \text{statt}\ \ce{Fe^3+}`,
    why: {
      detailed: 'Der Index in der Formel zählt die Ionen, er ist nicht ihre Ladung. Die Ladung des Kations folgt aus der Gesamtladung der Anionen, verteilt auf die Kationen.',
      short: 'Index = Anzahl, nicht Ladung.',
    },
  },
  {
    id: 'chem-salt-anion-name',
    course: IONEN,
    name: 'Anion falsch benannt',
    wrongFormula: String.raw`\ce{Na2SO4}\text{: Natriumsulfid statt Natriumsulfat}`,
    why: {
      detailed: 'Die Endung verrät das Anion: -id steht für das einatomige Anion (Sulfid, Nitrid, Chlorid), -it und -at für Molekül-Ionen mit Sauerstoff, -at mit mehr Sauerstoff als -it (Sulfit, Sulfat). Hydrogen- zeigt ein zusätzliches H an.',
      short: '-id ohne Sauerstoff, -it und -at mit Sauerstoff.',
    },
  },
  {
    id: 'chem-salt-numeral-index',
    course: IONEN,
    name: 'Index statt Ladung in der Klammer',
    wrongFormula: String.raw`\ce{Fe2O3}\text{: Eisen(II)-oxid statt Eisen(III)-oxid}`,
    why: {
      detailed: 'Die römische Ziffer im Namen gibt die Ladung des Metall-Ions an, nicht wie oft es in der Formel steht. Die Ladung ergibt sich aus dem Ausgleich mit den Anionen.',
      short: 'In die Klammer gehört die Ladung, nicht der Index.',
    },
  },
  {
    id: 'chem-salt-numeral-missing',
    course: IONEN,
    name: 'Römische Ziffer weggelassen',
    wrongFormula: String.raw`\ce{FeCl3}\text{: Eisenchlorid statt Eisen(III)-chlorid}`,
    why: {
      detailed: 'Metalle wie Eisen, Kupfer, Chrom oder Mangan bilden Ionen mit verschiedenen Ladungen. Erst die römische Ziffer sagt, welches Ion gemeint ist; ohne sie passt der Name zu mehreren Salzen.',
      short: 'Bei Metallen mit mehreren Ladungen gehört die Ziffer dazu.',
    },
  },
  {
    id: 'chem-dissociation-coefficients',
    course: IONEN,
    name: 'Koeffizienten der Ionen vergessen',
    wrongFormula: String.raw`\ce{Al2O3 -> Al^3+ + O^2-}`,
    why: {
      detailed: 'Beim Zerfall wird jedes Ion der Formeleinheit frei. Steht ein Ion mit Index in der Formel, entstehen so viele Ionen davon; das zeigt der Koeffizient vor dem Ion. Probe: Die Ladungen rechts heben sich auf.',
      short: 'So viele Ionen, wie der Index sagt; Ladungen rechts heben sich auf.',
    },
  },
  {
    id: 'chem-dissociation-index-ion',
    course: IONEN,
    name: 'Index als Teil des Ions',
    wrongFormula: String.raw`\ce{Al2O3 -> Al2^3+ + 3 O^2-}`,
    why: {
      detailed: 'Die Ionen eines Salzes sind einzelne Teilchen; ein Index in der Formel zählt nur, wie viele davon vorkommen. Beim Zerfall wird aus dem Index ein Koeffizient vor dem einzelnen Ion.',
      short: 'Der Index wird zum Koeffizienten vor dem Ion.',
    },
  },
  {
    id: 'chem-dissociation-charge',
    course: IONEN,
    name: 'Ladungen gehen nicht auf',
    wrongFormula: String.raw`\ce{CaCl2 -> Ca^2+ + 2 Cl^2-}`,
    why: {
      detailed: 'Jedes Ion behält beim Zerfall seine eigene Ladung. Probe: Rechts müssen sich die Ladungen aufheben, weil das Salz links neutral ist.',
      short: 'Jedes Ion behält seine Ladung; zusammen heben sie sich auf.',
    },
  },
  {
    id: 'chem-dissociation-atoms',
    course: IONEN,
    name: 'Zerfall in Atome statt Ionen',
    wrongFormula: String.raw`\ce{NaCl -> Na + Cl}`,
    why: {
      detailed: 'Ein Salz besteht schon aus Ionen. Beim Lösen oder Schmelzen werden diese Ionen beweglich; sie geben dabei keine Elektronen zurück. Deshalb tragen sie rechts ihre Ladungen.',
      short: 'Salze bestehen aus Ionen und zerfallen in Ionen.',
    },
  },
  {
    id: 'chem-bh-ea-sign',
    course: IONEN,
    name: 'Vorzeichen der Elektronenaffinität',
    wrongFormula: String.raw`+349\ \text{statt}\ -349\,\mathrm{kJ/mol}\ \text{für}\ \ce{Cl -> Cl^-}`,
    why: {
      detailed: 'Wenn ein Halogen-Atom ein Elektron aufnimmt, wird Energie frei; die Elektronenaffinität ist dann negativ und senkt die Summe. Im Kreisprozess geht jeder Schritt mit dem Vorzeichen in die Summe ein, das er in Richtung des Kreises hat.',
      short: 'Elektronenaufnahme beim Halogen setzt Energie frei: negatives Vorzeichen.',
    },
  },
  {
    id: 'chem-bh-full-bond',
    course: IONEN,
    name: 'Ganze statt halbe Bindungsenergie',
    wrongFormula: String.raw`242\ \text{statt}\ \tfrac{1}{2} \cdot 242\,\mathrm{kJ/mol}\ \text{für}\ \ce{Cl}`,
    why: {
      detailed: 'Die Bindungsenergie gilt für das Spalten eines ganzen Moleküls in zwei Atome. Für eine Formeleinheit MX wird nur ein Halogen-Atom gebraucht, also ein halbes Molekül und die halbe Bindungsenergie.',
      short: String.raw`Ein Atom $\ce{X}$ braucht nur ein halbes $\ce{X2}$.`,
    },
  },
  {
    id: 'chem-bh-step-missing',
    course: IONEN,
    name: 'Sublimation vergessen',
    wrongFormula: String.raw`\ce{Na(s) -> Na^+(g)}\ \text{ohne}\ \ce{Na(s) -> Na(g)}`,
    why: {
      detailed: 'Ionisiert werden kann nur ein freies Atom im Gas. Das feste Metall muss deshalb zuerst verdampft werden; dieser Schritt kostet Energie und gehört in den Kreisprozess.',
      short: 'Erst verdampfen, dann ionisieren.',
    },
  },
  {
    id: 'chem-bh-subtracted-wrong',
    course: IONEN,
    name: 'Kreisprozess falsch herum umgestellt',
    wrongFormula: String.raw`\Delta H_G = \Delta H_{\text{Ionen}} - \Delta H_f`,
    why: {
      detailed: 'Beide Wege von den Elementen zum Salz liefern dieselbe Energie: Bildungsenthalpie = Weg zu den Ionen + Gitterenthalpie. Diese Gleichung wird nach der gesuchten Größe umgestellt; dabei bleibt jedes Vorzeichen erhalten. Probe: Beim Aufbau eines Gitters wird Energie frei.',
      short: String.raw`$\Delta H_f = \Delta H_{\text{Ionen}} + \Delta H_G$ richtig umstellen.`,
    },
  },
  {
    id: 'chem-bh-added',
    course: IONEN,
    name: 'Addiert statt abgezogen',
    wrongFormula: String.raw`\Delta H_G = \Delta H_f + \Delta H_{\text{Ionen}}`,
    why: {
      detailed: 'Die Bildungsenthalpie ist die Summe aus dem Weg zu den Ionen und der Gitterenthalpie. Wer die Gitterenthalpie sucht, muss den Weg zu den Ionen auf die andere Seite bringen, also abziehen.',
      short: String.raw`Nach $\Delta H_G$ umstellen: abziehen.`,
    },
  },
  {
    id: 'chem-bh-lattice-sign',
    course: IONEN,
    name: 'Gitterenthalpie mit falschem Vorzeichen',
    wrongFormula: String.raw`\Delta H_f = \Delta H_{\text{Ionen}} - \Delta H_G`,
    why: {
      detailed: 'Die Gitterenthalpie ist schon negativ angegeben, weil beim Aufbau des Gitters Energie frei wird. Sie wird mit ihrem Vorzeichen zum Weg zu den Ionen addiert; zieht man sie ab, wird aus der frei werdenden Energie eine aufgewendete.',
      short: 'Die Gitterenthalpie mit ihrem Vorzeichen addieren.',
    },
  },
]

const BY_ID = new Map(CHEM_ERROR_RULES.map((r) => [r.id, r]))

export function chemErrorRule(id: string): ChemErrorRule {
  const rule = BY_ID.get(id)
  if (!rule) throw new Error(`Unbekannter Rechenfehler ${id}`)
  return rule
}

// Rechenfehler eines Themas
export const chemErrorRulesOf = (course: string) => CHEM_ERROR_RULES.filter((r) => r.course === course)
