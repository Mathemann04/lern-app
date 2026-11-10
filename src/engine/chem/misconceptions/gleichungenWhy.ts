import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Reaktionsgleichungen“ (Ids wie in gleichungen.ts)

export const GLEICHUNGEN_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-gl-sides-swapped': {
    detailed: 'Eine Reaktionsgleichung liest man wie einen Satz von links nach rechts. Links stehen die Stoffe, die man einsetzt und die miteinander reagieren (Edukte); der Pfeil heißt „reagieren zu“; rechts stehen die Stoffe, die dabei neu entstehen (Produkte).',
    short: 'Edukte links, Produkte rechts; der Pfeil zeigt zu den Produkten.',
  },
  'chem-mis-gl-atoms-transform': {
    detailed: 'Bei einer chemischen Reaktion lösen sich Bindungen zwischen Atomen, und neue Bindungen entstehen. Die Atome selbst bleiben, was sie sind: Aus einem Eisenatom wird nie ein Atom eines anderen Elements. Deshalb stehen links und rechts dieselben Elemente, und zwar jedes gleich oft.',
    short: 'Atome werden nur neu verbunden, nie in andere Atome umgewandelt.',
  },
  'chem-mis-gl-molecules-conserved': {
    detailed: String.raw`Erhalten bleiben die Atome jedes Elements, nicht die Zahl der Moleküle. Bei $\ce{2 CO + O2 -> 2 CO2}$ stehen links drei Moleküle und rechts nur zwei, und trotzdem ist die Gleichung ausgeglichen: Auf beiden Seiten sind es 2 C-Atome und 4 O-Atome.`,
    short: 'Erhalten bleiben die Atome, nicht die Zahl der Moleküle.',
  },
  'chem-mis-gl-arrow': {
    detailed: String.raw`Der einfache Pfeil $\rightarrow$ steht für eine Reaktion, die vollständig zu den Produkten abläuft. Der Doppelpfeil $\rightleftharpoons$ steht für ein Gleichgewicht: Hin- und Rückreaktion laufen beide, und am Ende liegen Edukte und Produkte nebeneinander vor. Ein Reaktionspfeil ist auch kein Gleichheitszeichen, denn links und rechts stehen verschiedene Stoffe.`,
    short: String.raw`$\rightarrow$ läuft vollständig ab, $\rightleftharpoons$ ist ein Gleichgewicht.`,
  },
  'chem-mis-gl-state-symbols': {
    detailed: 'Die Zeichen stammen aus dem Lateinischen und Englischen: (s) für fest, (l) für flüssig, (g) für gasförmig und (aq) von aqua, Wasser, für einen in Wasser gelösten Stoff. Geschmolzenes Salz bekommt also (l), Salz in Wasser gelöst dagegen (aq).',
    short: '(l) heißt flüssig, (aq) heißt in Wasser gelöst.',
  },
  'chem-mis-gl-mass-changes': {
    detailed: 'Bei einer Reaktion werden Atome nur neu verknüpft; keines verschwindet, und keines kommt hinzu. In einem geschlossenen Gefäß bleibt die Gesamtmasse deshalb gleich (Erhaltung der Masse). Ändert sich die Masse einer Probe, war das Gefäß offen: Dann ist etwas hinzugekommen, etwa Sauerstoff aus der Luft, oder ein entstandenes Gas ist entwichen.',
    short: 'Atome bleiben erhalten; im geschlossenen Gefäß ändert sich die Masse nicht.',
  },
  'chem-mis-gl-coef-index-swap': {
    detailed: 'Der Koeffizient steht groß vor der Formel und zählt die Teilchen des Stoffes, also wie viele Moleküle oder Formeleinheiten reagieren. Der Index steht klein unten rechts an einem Symbol und gehört zum Stoff selbst: Er sagt, wie viele Atome dieser Sorte in einem einzigen Teilchen stecken.',
    short: 'Koeffizient vorn: Zahl der Teilchen. Index unten: Atome in einem Teilchen.',
  },
  'chem-mis-gl-count-coef': {
    detailed: String.raw`Ein Koeffizient vervielfacht die ganze Formel, also jedes Atom darin. In $\ce{4 NO2}$ stecken deshalb $4 \cdot 1 = 4$ Stickstoffatome und $4 \cdot 2 = 8$ Sauerstoffatome. Für jedes Element rechnet man Koeffizient mal Index.`,
    short: 'Koeffizient mal Index, für jedes Element der Formel.',
  },
  'chem-mis-gl-count-index': {
    detailed: String.raw`Ein Index gehört nur zu dem Symbol, hinter dem er steht. Steht er hinter einer Klammer, gilt er für alles in der Klammer. In $\ce{Mg(NO3)2}$ stecken also 1 Magnesiumatom, $1 \cdot 2 = 2$ Stickstoffatome und $3 \cdot 2 = 6$ Sauerstoffatome.`,
    short: 'Ein Index gilt nur für das Symbol oder die Klammer direkt davor.',
  },
  'chem-mis-gl-coef-added': {
    detailed: String.raw`Der Koeffizient sagt, wie oft die ganze Formel vorkommt, und jede dieser Kopien enthält so viele Atome, wie der Index angibt. Deshalb wird malgenommen, nicht addiert: In $\ce{4 NO2}$ stecken $4 \cdot 2 = 8$ Sauerstoffatome, nicht $4 + 2 = 6$.`,
    short: 'Koeffizient und Index werden malgenommen, nicht addiert.',
  },
  'chem-mis-gl-coef-one': {
    detailed: String.raw`Jeder Stoff in einer Gleichung nimmt an der Reaktion teil, und die Gleichung legt das Verhältnis aller Stoffe fest. Den Koeffizienten 1 schreibt man nur nicht hin, so wie man in der Mathematik $1 \cdot x$ kurz als $x$ schreibt.`,
    short: 'Ohne Zahl davor ist der Koeffizient 1.',
  },
  'chem-mis-gl-ratio-mass': {
    detailed: String.raw`Koeffizienten zählen Teilchen und damit auch Stoffmengen in mol. Die Massen stehen in einem anderen Verhältnis, weil die Teilchen verschieden schwer sind. Um von Teilchen auf Gramm zu kommen, braucht man die molaren Massen: $m = n \cdot M$.`,
    short: 'Koeffizienten geben Teilchen- und Stoffmengenverhältnisse an, keine Massenverhältnisse.',
  },
  'chem-mis-gl-ratio-index': {
    detailed: 'Indizes beschreiben den Aufbau eines einzelnen Teilchens. Wie viele Teilchen verschiedener Stoffe miteinander reagieren, sagen allein die Koeffizienten vor den Formeln.',
    short: 'Das Teilchenverhältnis steht in den Koeffizienten, nicht in den Indizes.',
  },
  'chem-mis-gl-ratio-fixed': {
    detailed: 'Die Koeffizienten geben ein Verhältnis an, keine feste Stückzahl. Nimmt man doppelt so viel von einem Stoff, braucht man auch doppelt so viel von den anderen, und es entsteht doppelt so viel Produkt. So rechnet man mit Molekülen genauso wie mit Stoffmengen in mol.',
    short: 'Koeffizienten sind ein Verhältnis: mehr von einem Stoff, im selben Verhältnis mehr von den anderen.',
  },
  'chem-mis-gl-ratio-wrong': {
    detailed: String.raw`Gegeben ist die Menge eines Stoffes A, gesucht die eines Stoffes B. Dann gilt $n(\mathrm{B}) = n(\mathrm{A}) \cdot \frac{k_\mathrm{B}}{k_\mathrm{A}}$, wobei $k$ die Koeffizienten der beiden Stoffe sind. Es zählen nur die Koeffizienten dieser beiden Stoffe, und der des gesuchten Stoffes steht oben im Bruch.`,
    short: String.raw`$n(\mathrm{B}) = n(\mathrm{A}) \cdot \frac{k_\mathrm{B}}{k_\mathrm{A}}$, mit den Koeffizienten genau dieser beiden Stoffe.`,
  },
  'chem-mis-gl-index-changed': {
    detailed: String.raw`Die Indizes legen fest, um welchen Stoff es geht. Ändert man sie, steht dort ein anderer Stoff oder einer, den es gar nicht gibt: $\ce{CO2}$ ist ein anderes Gas als $\ce{CO}$. Beim Ausgleichen ändert man deshalb nur die Koeffizienten vor den Formeln.`,
    short: 'Indizes bleiben unverändert; ausgeglichen wird nur mit Koeffizienten.',
  },
  'chem-mis-gl-add-species': {
    detailed: 'Welche Stoffe reagieren und welche entstehen, legt die Reaktion fest, nicht das Ausgleichen. Ein Stoff oder ein einzelnes Atom, das bei der Reaktion gar nicht vorkommt, gehört nicht in die Gleichung, nur damit die Bilanz stimmt. Fehlen Atome, ändert man die Koeffizienten der Stoffe, die schon dastehen.',
    short: 'Nur die beteiligten Stoffe; Lücken in der Bilanz schließen die Koeffizienten.',
  },
  'chem-mis-gl-single-atom': {
    detailed: String.raw`Wasserstoff, Stickstoff, Sauerstoff, Fluor, Chlor, Brom und Iod kommen als Moleküle aus zwei fest gebundenen Atomen vor. Eine Gleichung beschreibt die Teilchen, die wirklich reagieren; deshalb stehen diese Elemente immer als $\ce{H2}$, $\ce{N2}$, $\ce{O2}$, $\ce{F2}$, $\ce{Cl2}$, $\ce{Br2}$ und $\ce{I2}$ darin.`,
    short: 'H, N, O und die Halogene stehen in Gleichungen immer mit einer 2.',
  },
  'chem-mis-gl-diatomic-metal': {
    detailed: 'Nur sieben Elemente kommen als Moleküle aus zwei Atomen vor: Wasserstoff, Stickstoff, Sauerstoff und die Halogene Fluor, Chlor, Brom und Iod. Metalle stehen als einzelnes Symbol in der Gleichung, ebenso Kohlenstoff, Schwefel und Phosphor.',
    short: 'Zweiatomig sind nur Wasserstoff, Stickstoff, Sauerstoff und die Halogene.',
  },
  'chem-mis-gl-skeleton-ok': {
    detailed: 'Die Formeln allein sagen nur, welche Stoffe beteiligt sind. Erst passende Koeffizienten sorgen dafür, dass von jedem Element links und rechts gleich viele Atome stehen. Zähle deshalb jedes Element auf beiden Seiten, bevor du eine Gleichung für fertig hältst.',
    short: 'Fertig ist eine Gleichung erst, wenn jedes Element links und rechts gleich oft vorkommt.',
  },
  'chem-mis-gl-not-recounted': {
    detailed: 'Ein Koeffizient vervielfacht alle Atome einer Formel, nicht nur das Element, um das es gerade ging. Nach jeder Änderung muss man deshalb jedes Element neu zählen und, wo es nicht mehr passt, weiter ausgleichen.',
    short: 'Nach jeder Änderung alle Elemente neu zählen.',
  },
  'chem-mis-gl-atoms-molecules': {
    detailed: String.raw`Ein Molekül $\ce{O2}$ bringt zwei Sauerstoffatome mit. Die Zahl der benötigten O-Atome teilt man deshalb durch 2, um den Koeffizienten vor $\ce{O2}$ zu erhalten; genauso bei $\ce{H2}$, $\ce{N2}$ und $\ce{Cl2}$. Umgekehrt gilt: Wer Atome zählen soll, nimmt die Zahl solcher Moleküle mal 2.`,
    short: String.raw`Ein $\ce{O2}$ enthält zwei O-Atome: Atome durch 2 teilen, um die Moleküle zu erhalten.`,
  },
  'chem-mis-gl-partly-doubled': {
    detailed: 'Eine Gleichung bleibt nur ausgeglichen, wenn man alle Koeffizienten mit derselben Zahl malnimmt; sonst verschiebt sich die Atombilanz. Nach dem Malnehmen lohnt es sich, jedes Element noch einmal zu zählen.',
    short: 'Alle Koeffizienten mit derselben Zahl malnehmen.',
  },
  'chem-mis-gl-fraction': {
    detailed: String.raw`Ein Bruch wie $\frac{7}{2}$ ist beim Ausgleichen ein erlaubter Zwischenschritt. In der fertigen Gleichung stehen aber üblicherweise die kleinsten ganzen Zahlen; dazu nimmt man alle Koeffizienten mit dem Nenner mal. Runden ist nie erlaubt, denn es zerstört die Atombilanz.`,
    short: 'Brüche nicht stehen lassen und nicht runden, sondern alles mit dem Nenner malnehmen.',
  },
  'chem-mis-gl-not-smallest': {
    detailed: 'Lassen sich alle Koeffizienten einer Gleichung durch dieselbe Zahl teilen, ist sie zwar ausgeglichen, aber nicht in der üblichen Form. Man teilt dann alle Koeffizienten durch ihren größten gemeinsamen Teiler.',
    short: 'Haben alle Koeffizienten einen gemeinsamen Teiler, wird noch gekürzt.',
  },
  'chem-mis-gl-multiple-wrong': {
    detailed: 'Nimmt man alle Koeffizienten mit derselben Zahl mal, wird jedes Element links und rechts gleich vervielfacht: Die Atombilanz stimmt weiter, und auch die Verhältnisse der Teilchen bleiben gleich. Es ist dieselbe Reaktion, nur für eine größere Menge aufgeschrieben. Üblich ist trotzdem die Form mit den kleinsten ganzen Zahlen.',
    short: 'Ein Vielfaches ist chemisch richtig, nur nicht die übliche Form.',
  },
  'chem-mis-gl-formula-split': {
    detailed: 'Eine Summenformel steht für einen einzigen Stoff, dessen Atome fest miteinander verbunden sind. Schreibt man die Elemente einzeln, behauptet die Gleichung, es reagierten freie Kohlenstoff-, Wasserstoff- und Sauerstoffteilchen; das wäre eine andere Reaktion. Die Formel bleibt deshalb als Ganzes stehen, mit einem Koeffizienten davor.',
    short: 'Eine Summenformel ist ein Stoff und bleibt als Ganzes stehen.',
  },
  'chem-mis-gl-combustion-products': {
    detailed: 'Vollständig heißt: Es ist genug Sauerstoff da, und Kohlenstoff und Wasserstoff werden so weit wie möglich oxidiert. Kohlenstoffmonoxid oder Ruß entstehen nur, wenn Sauerstoff fehlt. Freier Wasserstoff bleibt bei einer Verbrennung nicht übrig, denn er reagiert bereitwillig mit Sauerstoff.',
    short: 'Bei genug Sauerstoff wird alles vollständig oxidiert; nichts bleibt halb oder gar nicht verbrannt.',
  },
  'chem-mis-gl-water-oxygen': {
    detailed: String.raw`Bei einer Verbrennung landet Sauerstoff in beiden Produkten: im Kohlenstoffdioxid und im Wasser. Zähle deshalb die O-Atome in $\ce{CO2}$ und in $\ce{H2O}$ zusammen, bevor du den Koeffizienten vor $\ce{O2}$ bestimmst.`,
    short: 'Die O-Atome rechts stecken im Kohlenstoffdioxid und im Wasser.',
  },
  'chem-mis-gl-h-per-water': {
    detailed: String.raw`Ein Wassermolekül $\ce{H2O}$ enthält zwei Wasserstoffatome. Die Zahl der H-Atome im Brennstoff teilt man deshalb durch 2, um die Zahl der Wassermoleküle zu erhalten.`,
    short: String.raw`Je zwei H-Atome ergeben ein $\ce{H2O}$.`,
  },
  'chem-mis-gl-fuel-oxygen': {
    detailed: String.raw`Ein Alkohol bringt in seiner OH-Gruppe schon ein Sauerstoffatom mit. Von den O-Atomen, die rechts gebraucht werden, zieht man den Sauerstoff im Brennstoff ab; nur der Rest muss aus $\ce{O2}$ kommen. Dazuzählen wäre falsch, denn der Brennstoff liefert diesen Sauerstoff, er braucht ihn nicht zusätzlich.`,
    short: 'Den Sauerstoff im Brennstoff von den benötigten O-Atomen abziehen.',
  },
  'chem-mis-gl-incomplete': {
    detailed: 'Reicht der Sauerstoff nicht, wird der Kohlenstoff nicht vollständig oxidiert, und es entstehen andere Kohlenstoffverbindungen als bei genug Sauerstoff. Der Wasserstoff reagiert dagegen auch dann noch zu Wasser. Für die Gleichung zählt man den Sauerstoff rechts jedes Mal neu, denn die Produkte enthalten weniger O-Atome als bei der vollständigen Verbrennung.',
    short: 'Bei Sauerstoffmangel entstehen andere Kohlenstoffprodukte; den Sauerstoff neu zählen.',
  },
  'chem-mis-gl-alkane-formula': {
    detailed: String.raw`Alkane haben die allgemeine Formel $\ce{C_nH_{2n+2}}$: Jedes C-Atom der Kette trägt zwei H-Atome, dazu kommt an jedem Ende noch eines. Methan $\ce{CH4}$ ist das kleinste Beispiel: $2 \cdot 1 + 2 = 4$.`,
    short: String.raw`Alkane: $\ce{C_nH_{2n+2}}$.`,
  },
  'chem-mis-gl-alkane-name': {
    detailed: String.raw`Die Vorsilbe zählt die Kohlenstoffatome: Meth- 1, Eth- 2, Prop- 3, But- 4, danach die griechischen Zahlwörter Pent- 5, Hex- 6, Hept- 7, Oct- 8, Non- 9, Dec- 10. Die Zahl der Wasserstoffatome steckt nicht im Namen; sie folgt aus $\ce{C_nH_{2n+2}}$.`,
    short: 'Die Vorsilbe zählt die C-Atome, von Meth- für 1 bis Dec- für 10.',
  },
  'chem-mis-gl-alcohol-formula': {
    detailed: String.raw`In einem Alkohol ersetzt die OH-Gruppe ein Wasserstoffatom des Alkans; die allgemeine Formel ist $\ce{C_nH_{2n+1}OH}$. Aus Methan $\ce{CH4}$ wird so Methanol $\ce{CH3OH}$. Der Name endet auf -ol, die Vorsilbe zählt die C-Atome wie beim Alkan.`,
    short: String.raw`Die OH-Gruppe ersetzt ein H-Atom: $\ce{C_nH_{2n+1}OH}$.`,
  },
}
