import type { ChemErrorRule } from './errorRules.ts'

// Rechenfehler zum Thema „Elektronen" (S6a), Teil von CHEM_ERROR_RULES in errorRules.ts. Katalog in docs/PLAN-M4.md,
// „Katalog der Rechenfehler"; Katalogbeispiele in generators/elektronen.test.ts. Die Texte nennen den Fehler und
// die Regel, aber nicht das Ergebnis des Schritts.

const C = 'chem-elektronen'
const r = String.raw

export const ELEKTRONEN_ERROR_RULES: readonly ChemErrorRule[] = [
  // --- Konfiguration ---
  {
    id: 'chem-el-3d-first',
    course: C,
    name: '3d vor 4s besetzt',
    wrongFormula: r`\ce{K}\text{: } [\mathrm{Ar}]\,3\mathrm{d}^{1}`,
    why: {
      detailed: r`Die Unterschalen werden nach ihrer Energie besetzt, nicht nach der Nummer der Schale. 4s liegt beim Auffüllen tiefer als 3d; deshalb kommt 4s zuerst dran und 3d erst ab Scandium.`,
      short: '4s wird vor 3d besetzt.',
    },
  },
  {
    id: 'chem-el-overfilled',
    course: C,
    name: 'Unterschale überfüllt',
    wrongFormula: r`\ce{Na}\text{: } 1\mathrm{s}^{2}\,2\mathrm{s}^{2}\,2\mathrm{p}^{7}`,
    why: {
      detailed: r`Jedes Orbital fasst höchstens zwei Elektronen (Pauli-Prinzip). Eine s-Unterschale hat ein Orbital, also höchstens 2 Elektronen; eine p-Unterschale hat drei, also höchstens 6. Was darüber hinausgeht, kommt in die nächste Unterschale.`,
      short: 's fasst 2, p 6, d 10 Elektronen.',
    },
  },
  {
    id: 'chem-el-count',
    course: C,
    name: 'Elektronen falsch gezählt',
    wrongFormula: r`\ce{P}\text{: } [\mathrm{Ne}]\,3\mathrm{s}^{2}\,3\mathrm{p}^{4}`,
    why: {
      detailed: r`Zähle zur Probe alle Hochzahlen zusammen (beim Edelgaskern dessen Elektronen dazu). Im ungeladenen Atom muss die Summe gleich der Ordnungszahl sein.`,
      short: 'Die Summe der Hochzahlen ist die Ordnungszahl.',
    },
  },
  {
    id: 'chem-el-d-skipped',
    course: C,
    name: '3d übersprungen',
    wrongFormula: r`\ce{Ga}\text{: } [\mathrm{Ar}]\,4\mathrm{s}^{2}\,4\mathrm{p}^{1}`,
    why: {
      detailed: r`Ab der 4. Periode liegt zwischen 4s und 4p die 3d-Unterschale, und sie wird vorher ganz aufgefüllt (Scandium bis Zink). Ein Element nach Zink hat deshalb zehn d-Elektronen mehr, als die Zahl der Valenzelektronen vermuten lässt.`,
      short: 'Vor 4p kommt 3d mit zehn Elektronen.',
    },
  },
  {
    id: 'chem-el-exception',
    course: C,
    name: 'Ausnahme bei Chrom oder Kupfer übersehen',
    wrongFormula: r`\ce{Cr}\text{: } [\mathrm{Ar}]\,4\mathrm{s}^{2}\,3\mathrm{d}^{4}`,
    why: {
      detailed: r`Chrom und Kupfer weichen von der einfachen Besetzungsreihenfolge ab, weil bestimmte Besetzungen der d-Unterschale besonders günstig sind. Überlege, welche Besetzung von 3d hier erreicht werden kann.`,
      short: 'Chrom und Kupfer sind Ausnahmen der Reihenfolge.',
    },
  },
  {
    id: 'chem-el-charge-ignored',
    course: C,
    name: 'Ladung des Ions nicht beachtet',
    wrongFormula: r`\ce{Fe^2+}\text{: } 26 \text{ Elektronen}`,
    why: {
      detailed: r`Ein Ion hat nicht mehr so viele Elektronen wie Protonen. Die Ladung sagt, wie viele Elektronen abgegeben (positiv) oder aufgenommen (negativ) wurden; die Konfiguration beschreibt das Ion, nicht das Atom.`,
      short: 'Beim Ion zählt die Ladung mit.',
    },
  },
  {
    id: 'chem-el-charge-sign',
    course: C,
    name: 'Ladung in die falsche Richtung gerechnet',
    wrongFormula: r`\ce{O^2-}\text{: } 6 \text{ Elektronen}`,
    why: {
      detailed: r`Elektronen sind negativ. Ein Kation ist positiv, weil ihm Elektronen fehlen; ein Anion ist negativ, weil es zusätzliche Elektronen hat. Bei positiver Ladung also abziehen, bei negativer dazuzählen.`,
      short: 'Positiv heißt weniger Elektronen, negativ mehr.',
    },
  },
  {
    id: 'chem-el-ion-3d',
    course: C,
    name: 'Bei Kationen zuerst 3d geleert',
    wrongFormula: r`\ce{Fe^2+}\text{: } [\mathrm{Ar}]\,4\mathrm{s}^{2}\,3\mathrm{d}^{4}`,
    why: {
      detailed: r`Ein Kation gibt die Elektronen der äußersten Schale ab, also die mit dem größten $n$. Bei den Übergangsmetallen ist das 4s, auch wenn 3d zuletzt aufgefüllt wurde.`,
      short: 'Kationen geben zuerst die Elektronen mit dem größten n ab.',
    },
  },
  // --- Kästchen und ungepaarte Elektronen ---
  {
    id: 'chem-el-hund',
    course: C,
    name: 'Paare vor der Einzelbesetzung (Hund verletzt)',
    wrongFormula: r`\ce{N}\text{: } 2\mathrm{p}\ \ \uparrow\downarrow\ \ \uparrow\ \ \square`,
    why: {
      detailed: r`Nach der Hund'schen Regel bekommen energiegleiche Orbitale einer Unterschale zuerst je ein Elektron. Erst wenn jedes Orbital einfach besetzt ist, bilden sich Paare.`,
      short: 'Erst einzeln besetzen, dann paaren.',
    },
  },
  {
    id: 'chem-el-hund-spin',
    course: C,
    name: 'Einzelne Elektronen mit entgegengesetztem Spin',
    wrongFormula: r`\ce{N}\text{: } 2\mathrm{p}\ \ \uparrow\ \ \downarrow\ \ \uparrow`,
    why: {
      detailed: r`Zur Hund'schen Regel gehört auch der Spin: Die einzeln sitzenden Elektronen einer Unterschale haben alle denselben Spin. Entgegengesetzte Spins gibt es erst innerhalb eines Paars.`,
      short: 'Einzelne Elektronen haben gleichen Spin.',
    },
  },
  {
    id: 'chem-el-pauli',
    course: C,
    name: 'Zwei Elektronen mit gleichem Spin in einem Orbital',
    wrongFormula: r`\ce{He}\text{: } 1\mathrm{s}\ \ \uparrow\uparrow`,
    why: {
      detailed: r`Nach dem Pauli-Prinzip unterscheiden sich zwei Elektronen eines Atoms in mindestens einer Quantenzahl. Im selben Orbital stimmen $n$, $l$ und $m$ überein; also muss der Spin verschieden sein.`,
      short: 'Ein Paar hat entgegengesetzte Spins.',
    },
  },
  {
    id: 'chem-el-unpaired-paired-first',
    course: C,
    name: 'Ungepaarte Elektronen ohne Hund gezählt',
    wrongFormula: r`\ce{O}\text{: } 0 \text{ ungepaarte Elektronen}`,
    why: {
      detailed: r`Wer zuerst Paare bildet, findet zu wenige ungepaarte Elektronen. Nach Hund bekommt in einer teilweise besetzten Unterschale erst jedes Orbital ein Elektron; gepaart wird erst danach.`,
      short: 'Nach Hund erst einzeln besetzen.',
    },
  },
  {
    id: 'chem-el-unpaired-all',
    course: C,
    name: 'Alle Elektronen der letzten Unterschale als ungepaart gezählt',
    wrongFormula: r`\ce{O}\text{: } 4 \text{ ungepaarte Elektronen}`,
    why: {
      detailed: r`Ungepaart ist nur ein Elektron, das allein in seinem Orbital sitzt. Sind mehr Elektronen als Orbitale in der Unterschale, bilden die übrigen Paare.`,
      short: 'Mehr Elektronen als Orbitale heißt: Paare.',
    },
  },
  // --- Valenzelektronen ---
  {
    id: 'chem-val-group-number',
    course: C,
    name: 'Gruppennummer 13 bis 18 als Zahl der Valenzelektronen',
    wrongFormula: r`\ce{Al}\text{: } 13 \text{ Valenzelektronen}`,
    why: {
      detailed: r`In der Zählung 1 bis 18 stecken auch die zehn Nebengruppen. Für die Valenzelektronen der Hauptgruppen zählt die römische Nummer; bei den Gruppen 13 bis 18 zieht man zehn ab.`,
      short: 'Die Nummern 13 bis 18 enthalten die zehn Nebengruppen.',
    },
  },
  {
    id: 'chem-val-period',
    course: C,
    name: 'Periode als Zahl der Valenzelektronen',
    wrongFormula: r`\ce{S}\text{: } 3 \text{ Valenzelektronen}`,
    why: {
      detailed: r`Die Periode gibt die Nummer der äußersten Schale an, nicht wie viele Elektronen darin sitzen. Die Zahl der Valenzelektronen liest man an der Hauptgruppe ab.`,
      short: 'Periode = Schale, Hauptgruppe = Valenzelektronen.',
    },
  },
  {
    id: 'chem-val-all-electrons',
    course: C,
    name: 'Alle Elektronen als Valenzelektronen gezählt',
    wrongFormula: r`\ce{Se}\text{: } 34 \text{ Valenzelektronen}`,
    why: {
      detailed: r`Valenzelektronen sind nur die Elektronen der äußersten Schale; sie bestimmen, wie ein Atom Bindungen eingeht. Die inneren Elektronen gehören zum Atomrumpf.`,
      short: 'Nur die äußerste Schale zählt.',
    },
  },
  {
    id: 'chem-val-wrong-shell',
    course: C,
    name: 'Valenzelektronen in der falschen Schale',
    wrongFormula: r`\ce{S}\text{: } 4\mathrm{s}^{2}\,4\mathrm{p}^{4}`,
    why: {
      detailed: r`Die äußerste Schale eines Atoms hat die Nummer seiner Periode. Ein Element der 3. Periode hat seine Valenzelektronen in 3s und 3p, nicht in der nächsten Schale.`,
      short: 'Nummer der Schale = Periode.',
    },
  },
  {
    id: 'chem-val-core',
    course: C,
    name: 'Innere Elektronen zur Valenzkonfiguration gezählt',
    wrongFormula: r`\ce{Se}\text{: } 4\mathrm{s}^{2}\,3\mathrm{d}^{10}\,4\mathrm{p}^{4}`,
    why: {
      detailed: r`Zur Valenzkonfiguration eines Hauptgruppenelements gehören nur s und p der äußersten Schale. Volle Unterschalen weiter innen, auch ein volles 3d, zählen zum Rumpf.`,
      short: 'Bei Hauptgruppen nur ns und np.',
    },
  },
  {
    id: 'chem-val-ion',
    course: C,
    name: 'Valenzkonfiguration des Ions statt des Atoms',
    wrongFormula: r`\ce{S}\text{: } 3\mathrm{s}^{2}\,3\mathrm{p}^{6}`,
    why: {
      detailed: r`Gefragt ist das ungeladene Atom. Die Edelgaskonfiguration erreicht es erst, wenn es Elektronen abgibt oder aufnimmt und zum Ion wird.`,
      short: 'Gefragt ist das Atom, nicht das Ion.',
    },
  },
  {
    id: 'chem-val-s-missing',
    course: C,
    name: 'Alle Valenzelektronen in p gesetzt',
    wrongFormula: r`\ce{S}\text{: } 3\mathrm{p}^{6}`,
    why: {
      detailed: r`Auch in der äußersten Schale wird zuerst die s-Unterschale gefüllt. Bei den Elementen der III. bis VIII. Hauptgruppe sitzen davon immer zwei Elektronen in s, erst der Rest in p.`,
      short: 'Zuerst ns², dann np.',
    },
  },
  {
    id: 'chem-val-rev-period',
    course: C,
    name: 'Periode aus der Valenzkonfiguration falsch abgelesen',
    wrongFormula: r`4\mathrm{s}^{2}\,4\mathrm{p}^{3}\text{: } \ce{P}`,
    why: {
      detailed: r`Die Zahl vor s und p ist die Nummer der äußersten Schale, und sie ist gleich der Periode. Gezählt werden nicht nur die vollen inneren Schalen.`,
      short: 'Die Nummer der äußersten Schale ist die Periode.',
    },
  },
  {
    id: 'chem-val-rev-z',
    course: C,
    name: 'Zahl der Valenzelektronen als Ordnungszahl',
    wrongFormula: r`4\mathrm{s}^{2}\,4\mathrm{p}^{3}\text{: } \ce{B}`,
    why: {
      detailed: r`Die Valenzkonfiguration zeigt nur die äußersten Elektronen. Die Ordnungszahl zählt alle Elektronen, auch die inneren; die Zahl der Valenzelektronen ergibt nur die Hauptgruppe.`,
      short: 'Valenzelektronen geben die Gruppe, nicht die Ordnungszahl.',
    },
  },
  {
    id: 'chem-val-rev-p-only',
    course: C,
    name: 'Nur die p-Elektronen gezählt',
    wrongFormula: r`4\mathrm{s}^{2}\,4\mathrm{p}^{3}\text{: } \ce{Ga}`,
    why: {
      detailed: r`Zu den Valenzelektronen gehören die s- und die p-Elektronen der äußersten Schale. Erst ihre Summe ergibt die Nummer der Hauptgruppe.`,
      short: 's und p zusammen zählen.',
    },
  },
  // --- Quantenzahlen ---
  {
    id: 'chem-qn-l-to-n',
    course: C,
    name: 'Nebenquantenzahl bis n statt bis n − 1',
    wrongFormula: r`n = 3\text{: } l = 0,\ 1,\ 2,\ 3`,
    why: {
      detailed: r`Die Nebenquantenzahl beginnt bei $0$ und bleibt immer kleiner als die Hauptquantenzahl: $l = 0, 1, \dots, n - 1$. Zu $n$ gehören deshalb genau $n$ Unterschalen.`,
      short: r`$l$ geht von $0$ bis $n - 1$.`,
    },
  },
  {
    id: 'chem-qn-l-from-1',
    course: C,
    name: 'Nebenquantenzahl ab 1 gezählt',
    wrongFormula: r`n = 3\text{: } l = 1,\ 2,\ 3`,
    why: {
      detailed: r`Die Nebenquantenzahl beginnt bei $0$; $l = 0$ ist die s-Unterschale, die es in jeder Schale gibt. Der größte Wert ist $n - 1$.`,
      short: r`$l$ beginnt bei $0$.`,
    },
  },
  {
    id: 'chem-qn-2n',
    course: C,
    name: '2n statt 2n² Elektronen je Schale',
    wrongFormula: r`n = 3\text{: } 6 \text{ Elektronen}`,
    why: {
      detailed: r`Eine Schale hat nicht $n$, sondern $n^2$ Orbitale (ein s, drei p, fünf d …). Mit zwei Elektronen je Orbital fasst sie $2n^2$ Elektronen.`,
      short: r`Eine Schale hat $n^2$ Orbitale.`,
    },
  },
  {
    id: 'chem-qn-n-squared',
    course: C,
    name: 'Orbitale statt Elektronen gezählt',
    wrongFormula: r`n = 3\text{: } 9 \text{ Elektronen}`,
    why: {
      detailed: r`$n^2$ ist die Zahl der Orbitale einer Schale. In jedes Orbital passen zwei Elektronen mit entgegengesetztem Spin; die Zahl der Elektronen ist also doppelt so groß.`,
      short: 'Jedes Orbital fasst zwei Elektronen.',
    },
  },
  {
    id: 'chem-qn-octet',
    course: C,
    name: 'Acht Elektronen für jede Schale angenommen',
    wrongFormula: r`n = 3\text{: } 8 \text{ Elektronen}`,
    why: {
      detailed: r`Acht Elektronen sind das Oktett der äußersten Schale, keine Grenze jeder Schale. Höhere Schalen haben mehr Orbitale (auch d und f) und fassen mehr Elektronen.`,
      short: 'Das Oktett ist keine Grenze der Schale.',
    },
  },
  {
    id: 'chem-qn-letter-shift',
    course: C,
    name: 'Buchstabe und Nebenquantenzahl um eins verschoben',
    wrongFormula: r`3\mathrm{d}\text{: } l = 3`,
    why: {
      detailed: r`Die Buchstaben s, p, d, f stehen der Reihe nach für die Werte der Nebenquantenzahl. Die Zählung beginnt dabei bei $0$, nicht bei $1$.`,
      short: r`Die Zählung beginnt bei $0$.`,
    },
  },
  {
    id: 'chem-qn-l-is-n',
    course: C,
    name: 'Hauptquantenzahl als Nebenquantenzahl genommen',
    wrongFormula: r`4\mathrm{p}\text{: } l = 4`,
    why: {
      detailed: r`Die Zahl vor dem Buchstaben ist die Hauptquantenzahl $n$ (die Schale). Die Nebenquantenzahl steckt im Buchstaben und ist immer kleiner als $n$.`,
      short: r`Die Zahl ist $n$, der Buchstabe gibt $l$.`,
    },
  },
  {
    id: 'chem-qn-m-positive',
    course: C,
    name: 'Negative Werte der Magnetquantenzahl vergessen',
    wrongFormula: r`l = 2\text{: } m = 0,\ 1,\ 2`,
    why: {
      detailed: r`Die Magnetquantenzahl läuft von $-l$ bis $+l$; zu jedem positiven Wert gibt es den negativen. Deshalb hat eine Unterschale $2l + 1$ Orbitale.`,
      short: r`$m$ läuft von $-l$ bis $+l$.`,
    },
  },
  {
    id: 'chem-qn-m-beyond-l',
    course: C,
    name: 'Magnetquantenzahl größer als l',
    wrongFormula: r`l = 1\text{: } m = -2`,
    why: {
      detailed: r`Der Betrag der Magnetquantenzahl ist höchstens so groß wie die Nebenquantenzahl: $-l \le m \le +l$. Größere Werte gibt es in dieser Unterschale nicht.`,
      short: r`$m$ liegt zwischen $-l$ und $+l$.`,
    },
  },
  {
    id: 'chem-qn-one-per-orbital',
    course: C,
    name: 'Ein Elektron je Orbital gezählt',
    wrongFormula: r`3\mathrm{d}\text{: } 5 \text{ Elektronen}`,
    why: {
      detailed: r`$2l + 1$ ist die Zahl der Orbitale. Jedes Orbital fasst zwei Elektronen mit entgegengesetztem Spin, die Unterschale also doppelt so viele.`,
      short: 'Zwei Elektronen je Orbital.',
    },
  },
  {
    id: 'chem-qn-subshell-as-shell',
    course: C,
    name: 'Plätze der ganzen Schale für die Unterschale genommen',
    wrongFormula: r`3\mathrm{d}\text{: } 18 \text{ Elektronen}`,
    why: {
      detailed: r`$2n^2$ gilt für die ganze Schale mit allen ihren Unterschalen. Eine einzelne Unterschale fasst nur so viele Elektronen, wie ihre eigenen Orbitale Platz bieten.`,
      short: 'Gefragt ist nur die Unterschale, nicht die ganze Schale.',
    },
  },
  {
    id: 'chem-qn-spin',
    course: C,
    name: 'Unmöglicher Wert des Spins',
    wrongFormula: r`s = 1`,
    why: {
      detailed: r`Die Spinquantenzahl hat nur zwei Werte, $+\tfrac{1}{2}$ und $-\tfrac{1}{2}$. Andere Werte gibt es für ein Elektron nicht.`,
      short: r`Spin nur $\pm\tfrac{1}{2}$.`,
    },
  },
  {
    id: 'chem-qn-m-as-l',
    course: C,
    name: 'Magnetquantenzahl für die Unterschale genommen',
    wrongFormula: r`n = 3,\ l = 2,\ m = 1\text{: } 3\mathrm{p}`,
    why: {
      detailed: r`Die Unterschale legen $n$ und $l$ fest. Die Magnetquantenzahl $m$ sagt nur, welches Orbital innerhalb dieser Unterschale gemeint ist.`,
      short: r`Die Unterschale kommt aus $n$ und $l$.`,
    },
  },
]
