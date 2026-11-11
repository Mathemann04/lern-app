import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Stoffmenge und Umsatz“ (Ids wie in stoffmenge.ts)

export const STOFFMENGE_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-st-n-times-m': {
    detailed: String.raw`Die Masse einer Portion ist ihre Stoffmenge mal die Masse eines Mols: $m = n \cdot M$. Für die Stoffmenge stellt man diese Gleichung um und teilt durch die molare Masse. Die Einheiten zeigen es: Gramm mal Gramm je Mol ergibt kein Mol, Gramm geteilt durch Gramm je Mol dagegen schon.`,
    short: String.raw`Aus $m = n \cdot M$ folgt für die Stoffmenge ein Bruch, kein Produkt; die Einheiten zeigen es.`,
  },
  'chem-mis-st-n-inverted': {
    detailed: String.raw`Beim Umstellen von $m = n \cdot M$ nach $n$ teilt man beide Seiten durch $M$; die Masse steht dann oben im Bruch. Steht sie unten, kommt als Einheit $\mathrm{1/mol}$ heraus statt $\mathrm{mol}$. Prüfe auch die Richtung: Eine schwerere Portion desselben Stoffes muss mehr Mol ergeben, nicht weniger.`,
    short: String.raw`Beim Umstellen nach $n$ steht die Masse im Zähler; die Einheit verrät die Verwechslung.`,
  },
  'chem-mis-st-m-divided': {
    detailed: String.raw`Ein Mol wiegt $M$ Gramm, also wiegen $n$ Mol $n$-mal so viel: $m = n \cdot M$. Wer durch die molare Masse teilt, erhält als Einheit $\mathrm{mol^2/g}$ statt Gramm. Für die Masse wird immer malgenommen, geteilt wird nur, wenn nach $n$ oder $M$ gefragt ist.`,
    short: String.raw`Die Masse ist Stoffmenge mal molare Masse: $m = n \cdot M$.`,
  },
  'chem-mis-st-avogadro-inverted': {
    detailed: String.raw`Ein Mol enthält $6{,}022 \cdot 10^{23}$ Teilchen, also enthalten $n$ Mol $n$-mal so viele: $N = n \cdot N_A$. Geteilt wird nur in der anderen Richtung, von der Teilchenzahl zur Stoffmenge: $n = \frac{N}{N_A}$. Eine Portion, die man sehen oder wiegen kann, enthält immer eine riesige Zahl von Teilchen, nie eine winzige.`,
    short: String.raw`Teilchenzahl ist Stoffmenge mal Avogadro-Konstante: $N = n \cdot N_A$.`,
  },
  'chem-mis-st-n-is-count': {
    detailed: String.raw`Das Mol ist eine Zähleinheit wie das Dutzend, nur viel größer: $1\,\mathrm{mol}$ steht für $6{,}022 \cdot 10^{23}$ Teilchen. Die Stoffmenge und die Teilchenzahl beschreiben also dieselbe Portion mit ganz verschiedenen Zahlen; dazwischen steht immer die Avogadro-Konstante.`,
    short: String.raw`Zwischen Stoffmenge und Teilchenzahl steht immer der Faktor $N_A$.`,
  },
  'chem-mis-st-n-is-mass': {
    detailed: String.raw`Masse, Volumen und Stoffmenge sind drei verschiedene Größen mit eigenen Einheiten: Gramm, Liter und Mol. Die Stoffmenge zählt Teilchen. Wie schwer diese Teilchen zusammen sind, hängt vom Stoff ab und steckt in der molaren Masse; erst mit ihr wird aus einer Masse eine Stoffmenge.`,
    short: "Die Stoffmenge zählt Teilchen; Masse und Volumen sind andere Größen.",
  },
  'chem-mis-st-mol-is-mass': {
    detailed: String.raw`Ein Mol ist eine feste Anzahl von Teilchen, keine feste Masse. Weil die Teilchen verschiedener Stoffe verschieden schwer sind, wiegt ein Mol bei jedem Stoff etwas anderes. Wie viel, sagt die molare Masse des Stoffes.`,
    short: "Ein Mol ist eine Anzahl; seine Masse hängt vom Stoff ab.",
  },
  'chem-mis-st-mol-count-varies': {
    detailed: String.raw`Die Zahl der Teilchen in einem Mol ist bei jedem Stoff gleich, nämlich die Avogadro-Konstante. Schwere Teilchen machen ein Mol schwerer, aber nicht ärmer an Teilchen. Genau deshalb lassen sich Stoffmengen verschiedener Stoffe direkt vergleichen.`,
    short: "Ein Mol enthält bei jedem Stoff gleich viele Teilchen.",
  },
  'chem-mis-st-mol-only-gas': {
    detailed: String.raw`Das Mol zählt Teilchen, und eine Anzahl ändert sich nicht, wenn sich Temperatur, Druck oder Aggregatzustand ändern. Ein Mol Eisen, ein Mol flüssiges Wasser und ein Mol Wasserdampf enthalten gleich viele Teilchen. Von Temperatur und Druck hängt nur das Volumen ab, besonders stark bei Gasen.`,
    short: "Eine Teilchenzahl hängt nicht von Temperatur, Druck oder Zustand ab, nur das Volumen.",
  },
  'chem-mis-st-na-estimate': {
    detailed: String.raw`Seit 2019 ist die Avogadro-Konstante als exakte Zahl festgelegt, und das Mol ist über sie definiert. Gemessen wird sie also nicht mehr; ungenau sein kann nur eine Messung an einer Probe. In Aufgaben rechnet man mit dem gerundeten Wert $6{,}022 \cdot 10^{23}\,\mathrm{mol^{-1}}$.`,
    short: "Seit 2019 ist die Avogadro-Konstante eine exakt festgelegte Zahl.",
  },
  'chem-mis-st-power': {
    detailed: String.raw`Die Avogadro-Konstante ist eine riesige Zahl mit positivem Exponenten: $6{,}022 \cdot 10^{23}$ Teilchen je Mol. Winzig ist die Masse eines einzelnen Teilchens, nicht die Zahl der Teilchen. Ein falscher Exponent verändert ein Ergebnis um viele Zehnerpotenzen; prüfe deshalb, ob die Größenordnung zur Portion passt.`,
    short: "Die Teilchenzahl einer wägbaren Portion ist riesig; auf den Exponenten kommt es an.",
  },
  'chem-mis-st-units': {
    detailed: String.raw`Jede Größe hat ihre eigene Einheit, und sie folgt aus der Bedeutung: Eine Masse misst man in Gramm, eine Stoffmenge zählt Teilchen in Mol. Die molare Masse ist eine Masse bezogen auf eine Stoffmenge; ihre Einheit setzt sich deshalb aus beiden zusammen. Mit den Einheiten lässt sich jede Rechnung prüfen.`,
    short: "Die Einheit einer Größe folgt aus ihrer Bedeutung.",
  },
  'chem-mis-st-atomic-number': {
    detailed: "Die Ordnungszahl zählt die Protonen im Kern; sie sagt nichts darüber, wie viel ein Mol wiegt. Im Periodensystem steht die molare Masse als eigene Zahl im Feld des Elements, meist mit Nachkommastelle und außer bei Wasserstoff deutlich größer als die Ordnungszahl.",
    short: "Die Ordnungszahl zählt Protonen; die molare Masse ist eine eigene Zahl im Periodensystem.",
  },
  'chem-mis-st-mass-number': {
    detailed: String.raw`Die Massenzahl eines einzelnen Isotops zählt dessen Protonen und Neutronen. Die molare Masse eines Elements ist dagegen ein Mittelwert über alle natürlich vorkommenden Isotope, gewichtet nach ihrer Häufigkeit; im Skript heißt diese Zahl im Periodensystem auch Massenzahl. Deshalb ist sie oft keine ganze Zahl: Bei Chlor liegt sie zwischen den Massenzahlen seiner zwei häufigen Isotope, näher am häufigeren. Nennt eine Aufgabe einen eigenen Wert, rechnet man mit diesem.`,
    short: "Die Massenzahl eines einzelnen Isotops ist nicht der Mittelwert über alle Isotope.",
  },
  'chem-mis-st-index-ignored': {
    detailed: "Der Index unten rechts sagt, wie viele Atome des Elements direkt davor in einem Teilchen stecken. Jedes dieser Atome bringt seine molare Masse mit; deshalb zählt jedes Element so oft, wie sein Index angibt. Ohne Index ist es genau ein Atom.",
    short: "Jedes Element zählt so oft, wie sein Index angibt.",
  },
  'chem-mis-st-atom-for-molecule': {
    detailed: String.raw`Einige Elemente, nämlich Wasserstoff, Stickstoff, Sauerstoff und die Halogene, kommen als Moleküle aus zwei Atomen vor. Gefragt ist dann die molare Masse des Moleküls, also beide Atome zusammen. Die Zahl im Periodensystem gilt für ein Mol einzelner Atome.`,
    short: "Bei zweiatomigen Elementen zählen beide Atome des Moleküls.",
  },
  'chem-mis-st-bracket': {
    detailed: String.raw`Ein Index hinter einer Klammer gilt für alles, was in der Klammer steht. In einer Formel wie $\ce{Mg(NO3)2}$ kommt die ganze Nitratgruppe zweimal vor: Jedes Atom darin wird mit dem Index der Klammer malgenommen, auch die, die schon einen eigenen Index haben. Das Atom vor der Klammer zählt dagegen nur einmal.`,
    short: "Der Index hinter der Klammer gilt für jedes Atom in der Klammer.",
  },
  'chem-mis-st-hydrate-forgotten': {
    detailed: String.raw`Bei Salzen mit Kristallwasser sind die Wassermoleküle fest in den Kristall eingebaut und gehören zur Formeleinheit. Wer ein solches Salz abwiegt, wiegt das Wasser mit. Deshalb zählt der Teil hinter dem Malpunkt bei der molaren Masse voll mit.`,
    short: "Kristallwasser gehört zur Formeleinheit und zählt bei der molaren Masse mit.",
  },
  'chem-mis-st-hydrate-factor': {
    detailed: String.raw`Der Malpunkt in einer Formel mit Kristallwasser heißt „verbunden mit“, nicht „malnehmen“: Die Massen beider Teile werden addiert. Die Zahl vor dem Wasser gilt für das ganze Wassermolekül, also für die Wasserstoff- und die Sauerstoffatome darin.`,
    short: "Teile am Malpunkt werden addiert; die Zahl davor gilt für das ganze Wassermolekül.",
  },
  'chem-mis-st-atoms-molecules': {
    detailed: String.raw`Die Stoffmenge zählt die Teilchen, die die Formel beschreibt: bei $\ce{O2}$ Moleküle, bei einem Salz Formeleinheiten. Jedes dieser Teilchen besteht aus mehreren Atomen. Fragt man nach Atomen, muss man die Zahl der Teilchen noch mit der Zahl der Atome je Teilchen malnehmen.`,
    short: "Nach Atomen gefragt: Teilchenzahl mal Atome je Teilchen.",
  },
  'chem-mis-st-atoms-all': {
    detailed: "Ist nach den Atomen eines bestimmten Elements gefragt, zählt nur dessen Index in der Formel, nicht die Summe aller Atome im Teilchen. Bei Klammern und Kristallwasser wird dieser Index noch mit der Zahl davor oder dahinter malgenommen.",
    short: "Nach einem Element gefragt: nur dessen Atome zählen.",
  },
  'chem-mis-st-same-mass-same-n': {
    detailed: String.raw`Gleich schwer heißt nicht gleich viele Teilchen. Wie viele Teilchen eine Portion enthält, hängt auch davon ab, wie schwer jedes einzelne ist: $n = \frac{m}{M}$. Verschiedene Stoffe haben verschieden schwere Teilchen.`,
    short: String.raw`Die Stoffmenge hängt auch von der molaren Masse ab: $n = \frac{m}{M}$.`,
  },
  'chem-mis-st-heavier-more': {
    detailed: String.raw`Schwere Teilchen füllen eine Waage schneller. Bei gleicher Masse passen deshalb weniger schwere Teilchen in die Portion als leichte. Aus $n = \frac{m}{M}$ folgt: Je größer die molare Masse, desto kleiner die Stoffmenge bei gleicher Masse.`,
    short: "Bei gleicher Masse gilt: größere molare Masse, weniger Teilchen.",
  },
  'chem-mis-st-n-decides-mass': {
    detailed: String.raw`Die Masse einer Portion hängt von zwei Dingen ab: wie viele Teilchen sie enthält und wie schwer jedes ist, $m = n \cdot M$. Gleiche Stoffmengen verschiedener Stoffe sind deshalb verschieden schwer, und eine Portion mit mehr Mol leichter Teilchen kann leichter sein als eine mit weniger Mol schwerer Teilchen.`,
    short: String.raw`Die Masse hängt von $n$ und von $M$ ab: $m = n \cdot M$.`,
  },
  'chem-mis-st-m-ignores-n': {
    detailed: String.raw`Die molare Masse sagt nur, wie viel ein Mol wiegt. Wie schwer eine Portion ist, hängt zusätzlich davon ab, wie viele Mol sie enthält: $m = n \cdot M$. Viele leichte Teilchen können zusammen mehr wiegen als wenige schwere.`,
    short: String.raw`Für die Masse zählt auch die Stoffmenge: $m = n \cdot M$.`,
  },
  'chem-mis-st-molar-mass-portion': {
    detailed: String.raw`Die molare Masse ist eine Eigenschaft des Stoffes: so viel wiegt ein Mol, egal wie groß die Portion ist. Wird eine Portion kleiner, sinken Masse und Stoffmenge im selben Verhältnis, und ihr Quotient $M = \frac{m}{n}$ bleibt gleich.`,
    short: "Die molare Masse gehört zum Stoff, nicht zur Portion.",
  },
  'chem-mis-st-particle-mass': {
    detailed: String.raw`Die molare Masse ist die Masse von $6{,}022 \cdot 10^{23}$ Teilchen, nicht von einem. Ein einzelnes Teilchen wiegt deshalb nur einen winzigen Bruchteil eines Gramms: die molare Masse geteilt durch die Avogadro-Konstante.`,
    short: String.raw`Ein Teilchen wiegt die molare Masse geteilt durch $N_A$, also winzig wenig.`,
  },
  'chem-mis-st-decimal': {
    detailed: String.raw`Ein verrutschtes Komma macht das Ergebnis zehnmal zu groß oder zu klein. Die molare Masse einer Verbindung ist die Summe der molaren Massen ihrer Atome, also mindestens so groß wie der größte Summand. Ein Überschlag im Kopf deckt den Fehler auf.`,
    short: "Überschlage: Die molare Masse ist mindestens so groß wie ihr größter Summand.",
  },
  'chem-mis-st-formula-split': {
    detailed: String.raw`Eine Summenformel beschreibt ein Teilchen eines einzigen Stoffes: In $\ce{C6H12O6}$ sind die Atome zu einem Molekül verbunden. Die Indizes zählen nur, wie viele Atome jedes Elements darin stecken. Man darf die Formel weder in einzelne Stoffe aufteilen noch so in eine Reaktionsgleichung schreiben.`,
    short: "Eine Summenformel steht für einen Stoff; die Indizes zählen nur die Atome darin.",
  },
  'chem-mis-st-formula-reduced': {
    detailed: String.raw`Die Indizes einer Summenformel geben die tatsächliche Zahl der Atome im Molekül an. Kürzt man sie, beschreibt die Formel ein anderes, kleineres Molekül mit einer anderen molaren Masse und anderen Eigenschaften. Das gekürzte Verhältnis heißt Verhältnisformel und ist keine Summenformel.`,
    short: "Gekürzte Indizes beschreiben ein anderes Molekül.",
  },
  'chem-mis-st-index-coefficient': {
    detailed: String.raw`Ein Index steht klein unten rechts und gehört zur Formel: Er zählt Atome oder Gruppen in einem Teilchen. Ein Koeffizient steht groß vor der Formel und zählt ganze Teilchen, zum Beispiel in einer Reaktionsgleichung. Den Index darf man nicht verändern, ohne den Stoff zu verändern.`,
    short: "Der Index zählt Atome in einem Teilchen, der Koeffizient zählt ganze Teilchen.",
  },
  'chem-mis-st-same-m-same-stoff': {
    detailed: String.raw`Die molare Masse ist nur eine Zahl; verschiedene Stoffe können sie zufällig teilen. Stickstoff $\ce{N2}$ und Kohlenstoffmonoxid $\ce{CO}$ sind ganz verschiedene Stoffe: Stickstoff ist reaktionsträge, Kohlenstoffmonoxid brennt und ist giftig. Aus dieser einen Zahl lässt sich nicht auf Bau und Verhalten eines Stoffes schließen.`,
    short: "Verschiedene Stoffe können zufällig dieselbe molare Masse haben.",
  },
  'chem-mis-st-salt-molecule': {
    detailed: String.raw`Salze bestehen nicht aus Molekülen, sondern aus Ionen, die in einem Gitter angeordnet sind. Die Formel $\ce{NaCl}$ gibt nur das Zahlenverhältnis an; die kleinste Einheit mit diesem Verhältnis heißt Formeleinheit. Die Stoffmenge eines Salzes zählt Formeleinheiten, und jede davon enthält mehrere Ionen.`,
    short: "Salze bestehen aus Ionen; gezählt werden Formeleinheiten.",
  },
  'chem-mis-st-prefix': {
    detailed: String.raw`Die Vorsilbe milli bedeutet ein Tausendstel: $1\,\mathrm{mmol} = 0{,}001\,\mathrm{mol}$, genau wie $1\,\mathrm{mg} = 0{,}001\,\mathrm{g}$. Wer sie weglässt, rechnet tausendmal zu viel. Am sichersten rechnet man erst in Mol um und setzt dann ein.`,
    short: String.raw`milli heißt ein Tausendstel: $1\,\mathrm{mmol} = 0{,}001\,\mathrm{mol}$.`,
  },
  'chem-mis-st-magnitude': {
    detailed: String.raw`Ein Mol ist keine Obergrenze. Schon ein Glas Wasser enthält mehr als zehn Mol Wassermoleküle. Ob ein Ergebnis stimmt, zeigt nicht seine Größe allein; prüfe dafür den Rechenweg.`,
    short: "Stoffmengen über ein Mol sind ganz normal.",
  },
}
