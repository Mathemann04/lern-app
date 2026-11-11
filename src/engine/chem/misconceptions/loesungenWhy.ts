import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Gase und Lösungen“ (Ids wie in loesungen.ts)

export const LOESUNGEN_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-lo-v-not-solution': {
    detailed: "Eine Konzentration beschreibt die fertige Lösung, also gelösten Stoff und Wasser zusammen. Beim Lösen kann sich das Volumen ändern, und auch zugegebenes Wasser ist nur ein Teil des Ganzen. Deshalb zählt immer das Volumen der ganzen Lösung, wie man es am Ende im Gefäß misst.",
    short: "Es zählt das Volumen der ganzen, fertigen Lösung.",
  },
  'chem-mis-lo-mol-as-gram': {
    detailed: String.raw`Mol zählt Teilchen, Gramm misst eine Masse. Wie viel ein Mol wiegt, hängt vom Stoff ab und steht in seiner molaren Masse $M$. Von der Stoffmenge zur Masse kommt man nur über $m = n \cdot M$.`,
    short: String.raw`Mol und Gramm verbindet die molare Masse: $m = n \cdot M$.`,
  },
  'chem-mis-lo-c-mixup': {
    detailed: String.raw`Die Angaben messen Verschiedenes: Die Stoffmengenkonzentration zählt Mol je Liter Lösung ($\mathrm{mol/L}$), die Massenkonzentration Gramm je Liter ($\mathrm{g/L}$), der Massenanteil Gramm je 100 Gramm Lösung ($\%$). Zwischen Gramm und Mol steht immer die molare Masse des Stoffs, und die ist von Stoff zu Stoff verschieden.`,
    short: "Mol je Liter, Gramm je Liter und Prozent der Masse sind verschiedene Angaben.",
  },
  'chem-mis-lo-c-portion': {
    detailed: "Eine Lösung ist überall gleich zusammengesetzt. Nimmt man einen Teil davon, nimmt man gelösten Stoff und Wasser im selben Verhältnis heraus. Das Verhältnis, also die Konzentration, bleibt dabei gleich; nur die Menge wird kleiner.",
    short: "Ein Teil einer Lösung hat dieselbe Zusammensetzung wie das Ganze.",
  },
  'chem-mis-lo-c-times': {
    detailed: String.raw`Eine Konzentration sagt, wie viel Stoff auf einen Liter kommt; dafür teilt man die Stoffmenge durch das Volumen: $c = \frac{n}{V}$. Ein Produkt würde wachsen, wenn man denselben Stoff in mehr Wasser verteilt, die Lösung wird dabei aber dünner. Auch die Einheit verrät es: $\mathrm{mol} \cdot \mathrm{L}$ ist keine Konzentration.`,
    short: String.raw`Konzentration ist Menge geteilt durch Volumen, kein Produkt.`,
  },
  'chem-mis-lo-c-inverted': {
    detailed: String.raw`Bei einer Gehaltsangabe steht die Menge des gelösten Stoffs im Zähler und die Bezugsgröße im Nenner, etwa $c = \frac{n}{V}$ oder $\beta = \frac{m}{V}$. Falsch herum kommt als Einheit $\mathrm{L/mol}$ oder $\mathrm{L/g}$ heraus. Prüfe auch die Richtung: Mehr gelöster Stoff im selben Volumen muss eine größere Konzentration ergeben.`,
    short: "Die Menge des gelösten Stoffs gehört in den Zähler; die Einheit verrät die Verwechslung.",
  },
  'chem-mis-lo-milli': {
    detailed: String.raw`Milli heißt ein Tausendstel: $1\,\mathrm{mL} = 0{,}001\,\mathrm{L}$ und $1\,\mathrm{mmol} = 0{,}001\,\mathrm{mol}$. Wer Milliliter wie Liter einsetzt, liegt um den Faktor 1000 daneben. Rechne Volumina vor dem Einsetzen in Liter um, oder kürze Milli gegen Milli: $\mathrm{mmol/mL}$ ist dasselbe wie $\mathrm{mol/L}$.`,
    short: String.raw`$1\,\mathrm{mL} = 0{,}001\,\mathrm{L}$; vor dem Einsetzen umrechnen.`,
  },
  'chem-mis-lo-share-is-amount': {
    detailed: String.raw`Eine Konzentration oder ein Anteil sagt, wie dicht der Stoff verteilt ist, nicht wie viel davon insgesamt da ist. Wie viel Stoff eine Portion enthält, hängt zusätzlich von ihrer Größe ab: $n = c \cdot V$. Eine kleine, starke Lösung kann weniger Stoff enthalten als eine große, schwache.`,
    short: String.raw`Die Menge ist Konzentration mal Volumen: $n = c \cdot V$.`,
  },
  'chem-mis-lo-dilution-n': {
    detailed: String.raw`Beim Verdünnen kommt nur Wasser dazu; kein gelöstes Teilchen geht verloren. Die Stoffmenge vorher und nachher ist gleich, daher $c_1 \cdot V_1 = c_2 \cdot V_2$. Kleiner wird nur die Konzentration, weil sich dieselben Teilchen auf mehr Volumen verteilen.`,
    short: String.raw`Beim Verdünnen bleibt die Stoffmenge gleich: $c_1 \cdot V_1 = c_2 \cdot V_2$.`,
  },
  'chem-mis-lo-dilution-direct': {
    detailed: String.raw`Beim Verdünnen verteilt sich dieselbe Stoffmenge auf mehr Volumen; die Lösung wird dünner, nicht stärker. Aus der gleichen Stoffmenge folgt $c_1 \cdot V_1 = c_2 \cdot V_2$: Je größer das Volumen, desto kleiner die Konzentration. Wer die Volumina vertauscht, bekommt eine Konzentration, die beim Verdünnen steigt.`,
    short: "Mehr Volumen bei gleicher Stoffmenge heißt kleinere Konzentration.",
  },
  'chem-mis-lo-water-no-effect': {
    detailed: String.raw`Die Konzentration ist ein Verhältnis: Stoffmenge je Liter Lösung. Kommt Wasser dazu, bleibt die Stoffmenge gleich, aber das Volumen wird größer. Damit ändert sich das Verhältnis, auch wenn kein Stoff dazukommt oder verschwindet.`,
    short: "Mehr Wasser ändert das Verhältnis aus Stoffmenge und Volumen.",
  },
  'chem-mis-lo-m-incomplete': {
    detailed: String.raw`Was man abwiegt, ist das Hydrat mit seinem Kristallwasser. Ein Mol davon wiegt so viel wie die ganze Formel, also das Salz und alle Wassermoleküle zusammen; der Koeffizient vor $\ce{H2O}$ gilt für das ganze Wassermolekül. Wer das Kristallwasser weglässt, wiegt zu wenig Salz ab.`,
    short: "Die molare Masse des Hydrats enthält das Kristallwasser mit.",
  },
  'chem-mis-lo-reference': {
    detailed: String.raw`Eine Angabe wie $\mathrm{g/L}$, $\mathrm{mol/L}$, ppm oder $\%$ bezieht sich auf eine feste Menge: einen Liter, ein Kilogramm, 100 Gramm. Für eine Portion anderer Größe muss man umrechnen, also mit ihrem Volumen oder ihrer Masse malnehmen oder durch sie teilen.`,
    short: "Eine Angabe je Liter oder je Kilogramm muss man auf die Portion umrechnen.",
  },
  'chem-mis-lo-most-important': {
    detailed: "Bei einer Reaktion treffen einzelne Teilchen aufeinander, und die Reaktionsgleichung nennt, wie viele Teilchen jedes Stoffs zusammenkommen. Masse und Volumen sagen darüber erst etwas, wenn man sie in Teilchen umrechnet. Deshalb braucht man eine Angabe, die die Teilchen in einem Volumen zählt.",
    short: "Bei Reaktionen zählen die Teilchen, nicht Masse oder Volumen.",
  },
  'chem-mis-lo-share-solvent': {
    detailed: String.raw`Ein Anteil bezieht sich auf das Ganze. Beim Massenanteil steht im Nenner die Masse der ganzen Lösung, also gelöster Stoff plus Wasser; beim Volumenanteil das Volumen der ganzen Mischung. Wer nur durch das Wasser teilt, bekommt einen zu großen Anteil.`,
    short: "Im Nenner steht die ganze Lösung, nicht nur das Wasser.",
  },
  'chem-mis-lo-percent-factor': {
    detailed: String.raw`Prozent heißt Hundertstel: Ein Anteil als Dezimalzahl wird mit 100 malgenommen, um ihn in Prozent anzugeben. Umgekehrt ist $1\,\%$ der Anteil $0{,}01$. Wer den Faktor 100 vergisst oder doppelt nimmt, liegt um das Hundertfache daneben.`,
    short: String.raw`Anteil mal 100 ergibt Prozent; $1\,\% = 0{,}01$.`,
  },
  'chem-mis-lo-w-volume': {
    detailed: "Der Massenanteil teilt eine Masse durch eine Masse: Gramm Stoff je 100 Gramm Lösung. Ein Volumen kommt darin nicht vor. Wie viel Gramm in einem Milliliter oder Liter stecken, ist eine andere Angabe, die Massenkonzentration; dafür braucht man die Dichte der Lösung.",
    short: "Der Massenanteil ist Masse durch Masse, ohne Volumen.",
  },
  'chem-mis-lo-beta-density': {
    detailed: String.raw`Beide haben die Einheit $\mathrm{g/L}$, messen aber Verschiedenes. Die Dichte $\rho$ teilt die Masse der ganzen Lösung durch ihr Volumen; Wasser hat etwa $1000\,\mathrm{g/L}$. Die Massenkonzentration $\beta$ zählt nur die Gramm des gelösten Stoffs je Liter Lösung und ist meist viel kleiner.`,
    short: String.raw`Die Dichte zählt die ganze Lösung, $\beta$ nur den gelösten Stoff.`,
  },
  'chem-mis-lo-ppm-factor': {
    detailed: String.raw`Die Buchstaben verraten die Zehnerpotenz: per million ist ein Teil auf eine Million ($10^{6}$), per billion auf eine Milliarde ($10^{9}$), per trillion auf eine Billion ($10^{12}$). Ein Promille ist ein Teil auf tausend und damit viel mehr. Bei Massen hilft es, die Vorsilben nachzuzählen: Zwischen mg und kg, µg und kg, ng und kg liegen verschieden viele Tausenderschritte.`,
    short: "Million, Milliarde, Billion: Jede Stufe ist tausendmal kleiner.",
  },
  'chem-mis-lo-billion': {
    detailed: String.raw`Die Abkürzungen kommen aus dem Englischen, und dort heißt „billion“ etwas anderes als bei uns. Das englische billion ist die deutsche Milliarde ($10^{9}$), das englische trillion die deutsche Billion ($10^{12}$). Wer wörtlich übersetzt, liegt um den Faktor 1000 daneben.`,
    short: "Englisch billion ist die deutsche Milliarde.",
  },
  'chem-mis-lo-vol-mass': {
    detailed: String.raw`Vol-% teilt ein Volumen durch ein Volumen, Massenprozent eine Masse durch eine Masse. Weil die Bestandteile verschiedene Dichten haben, ergeben sich verschiedene Zahlen: Ethanol ist leichter als Wasser, ein Milliliter davon wiegt nur etwa $0{,}79\,\mathrm{g}$.`,
    short: "Volumenanteil und Massenanteil ergeben verschiedene Zahlen.",
  },
  'chem-mis-lo-volume-conserved': {
    detailed: "Erhalten bleiben bei Mischungen und Reaktionen die Masse und die Atome, nicht das Volumen. Beim Mischen von Flüssigkeiten können die Teilchen dichter zusammenrücken, sodass das Gemisch weniger Platz braucht. Bei Gasen hängt das Volumen von der Zahl der Teilchen ab, und die kann sich bei einer Reaktion ändern.",
    short: "Erhalten bleibt die Masse, nicht das Volumen.",
  },
  'chem-mis-lo-contraction-loss': {
    detailed: "Beim Mischen geht nichts verloren und es entsteht kein neuer Stoff: Die Masse bleibt gleich. Kleiner wird nur der Platz, den die Teilchen zusammen brauchen, weil verschieden große Moleküle sich beim Mischen dichter anordnen können.",
    short: "Die Masse bleibt gleich; nur die Teilchen rücken dichter zusammen.",
  },
  'chem-mis-lo-vm-everything': {
    detailed: "Ein festes Volumen je Mol gilt nur für Gase: Dort sind die Teilchen weit voneinander entfernt, und ihr eigenes Volumen spielt keine Rolle. In Flüssigkeiten und Feststoffen liegen die Teilchen dicht an dicht; wie viel Platz ein Mol braucht, hängt dort von Molmasse und Dichte des Stoffs ab.",
    short: "Ein festes molares Volumen gibt es nur für Gase.",
  },
  'chem-mis-lo-vm-any-condition': {
    detailed: "Das Volumen eines Gases hängt von Temperatur und Druck ab: Wärmer heißt mehr Volumen, mehr Druck heißt weniger Volumen. Der bekannte Wert für das molare Volumen gehört deshalb zu ganz bestimmten Bedingungen, den Normbedingungen. Bei anderen Bedingungen rechnet man mit dem Gasgesetz.",
    short: "Das molare Volumen gehört zu festen Bedingungen; sonst gilt das Gasgesetz.",
  },
  'chem-mis-lo-vm-gas-specific': {
    detailed: "Bei einem idealen Gas spielt das Eigenvolumen der Teilchen keine Rolle; der Raum zwischen ihnen ist viel größer. Deshalb hängt das Volumen nur von der Zahl der Teilchen, vom Druck und von der Temperatur ab, nicht davon, wie schwer oder groß die Teilchen sind (Gesetz von Avogadro).",
    short: "Das Gasvolumen hängt von der Teilchenzahl ab, nicht von der Art des Gases.",
  },
  'chem-mis-lo-vm-inverted': {
    detailed: String.raw`Das molare Volumen hat die Einheit $\mathrm{L/mol}$: Es sagt, wie viele Liter auf ein Mol kommen. Das Volumen einer Gasportion ist deshalb ihre Stoffmenge mal das molare Volumen, $V = n \cdot V_m$. Geteilt wird nur in der Gegenrichtung, vom Volumen zur Stoffmenge.`,
    short: String.raw`$V_m$ in $\mathrm{L/mol}$: $V = n \cdot V_m$.`,
  },
  'chem-mis-lo-atoms-count': {
    detailed: String.raw`Ein Mol zählt Teilchen, und bei einem Gas aus Molekülen ist jedes Molekül ein Teilchen, egal aus wie vielen Atomen es besteht. Ein Mol $\ce{O2}$ sind $6{,}022 \cdot 10^{23}$ Moleküle; für das Gasvolumen zählt jedes davon einmal.`,
    short: "Gezählt werden die Teilchen (Moleküle), nicht ihre Atome.",
  },
  'chem-mis-lo-avogadro-mass': {
    detailed: "Gleich große Gasvolumina bei gleichem Druck und gleicher Temperatur enthalten gleich viele Teilchen (Avogadro). Wie schwer diese Teilchen sind, hängt vom Gas ab; die Masse ist darum je nach Gas verschieden.",
    short: "Gleiches Gasvolumen heißt gleiche Teilchenzahl, nicht gleiche Masse.",
  },
  'chem-mis-lo-ideal-model': {
    detailed: "Ideal heißt nicht rein. Das ideale Gas ist ein Modell mit zwei Vereinfachungen: Zwischen den Teilchen wirken keine Anziehungskräfte, und ihr eigenes Volumen ist gegenüber dem Gasvolumen so klein, dass man es weglassen kann. Echte Gase verhalten sich bei niedrigem Druck und nicht zu tiefer Temperatur fast so.",
    short: "Ideal heißt: keine Anziehung, vernachlässigbares Eigenvolumen.",
  },
  'chem-mis-lo-celsius': {
    detailed: String.raw`Das Gasgesetz braucht die absolute Temperatur in Kelvin: $T = \vartheta + 273{,}15$. Die Celsius-Skala hat ihren Nullpunkt willkürlich am Gefrierpunkt des Wassers, deshalb sind Verhältnisse in $^{\circ}\mathrm{C}$ sinnlos: Doppelt so viele Grad Celsius heißen nicht doppelt so warm.`,
    short: String.raw`Im Gasgesetz immer Kelvin: $T = \vartheta + 273{,}15$.`,
  },
  'chem-mis-lo-si-units': {
    detailed: String.raw`Die Gaskonstante $R = 8{,}314\,\mathrm{J/(mol \cdot K)}$ passt nur zu SI-Einheiten: Druck in Pascal, Volumen in Kubikmetern, Temperatur in Kelvin. Umrechnen: $1\,\mathrm{hPa} = 100\,\mathrm{Pa}$, $1\,\mathrm{bar} = 10^{5}\,\mathrm{Pa}$, $1\,\mathrm{m^3} = 1000\,\mathrm{L}$.`,
    short: String.raw`Mit $R = 8{,}314$: Pa, $\mathrm{m^3}$ und K.`,
  },
  'chem-mis-lo-gas-direction': {
    detailed: String.raw`Aus $p \cdot V = n \cdot R \cdot T$ folgt: Bei gleicher Temperatur und Stoffmenge ist das Produkt $p \cdot V$ fest, kleineres Volumen heißt also größerer Druck (Boyle). Bei gleichem Druck wächst das Volumen mit der Temperatur in Kelvin (Charles).`,
    short: "Kleineres Volumen heißt mehr Druck; wärmer heißt mehr Volumen.",
  },
  'chem-mis-lo-gas-fixed': {
    detailed: String.raw`Druck, Volumen, Stoffmenge und Temperatur hängen über $p \cdot V = n \cdot R \cdot T$ zusammen. Ändert man eine Größe, muss sich mindestens eine andere mit ändern, damit die Gleichung weiter stimmt. Welche, hängt davon ab, was festgehalten wird.`,
    short: String.raw`Die Größen hängen zusammen: $p \cdot V = n \cdot R \cdot T$.`,
  },
  'chem-mis-lo-heat-more-particles': {
    detailed: "Beim Erwärmen entstehen keine neuen Teilchen; die Stoffmenge bleibt gleich. Ändern sich Druck oder Volumen, liegt das an den vorhandenen Teilchen, nicht an zusätzlichen.",
    short: "Erwärmen erzeugt keine neuen Teilchen.",
  },
}
