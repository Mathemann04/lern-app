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
]

const BY_ID = new Map(CHEM_ERROR_RULES.map((r) => [r.id, r]))

export function chemErrorRule(id: string): ChemErrorRule {
  const rule = BY_ID.get(id)
  if (!rule) throw new Error(`Unbekannter Rechenfehler ${id}`)
  return rule
}

// Rechenfehler eines Themas
export const chemErrorRulesOf = (course: string) => CHEM_ERROR_RULES.filter((r) => r.course === course)
