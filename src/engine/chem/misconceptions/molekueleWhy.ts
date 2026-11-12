import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Moleküle“ (Ids wie in molekuele.ts)

export const MOLEKUELE_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-mo-bond-transfer': {
    detailed: "Ganz abgegebene Elektronen kennzeichnen die Ionenbindung. In einer Atombindung teilen sich zwei Atome ein oder mehrere Elektronenpaare; jedes Paar gehört beiden Atomen gemeinsam und hält sie zusammen.",
    short: "In der Atombindung werden Elektronenpaare geteilt, nicht abgegeben.",
  },
  'chem-mis-mo-metal-partners': {
    detailed: "Zwischen Metall und Nichtmetall entstehen Ionen, weil das Metall seine Elektronen leicht abgibt. Atombindungen bilden Nichtmetalle untereinander: Keines gibt gern Elektronen ab, also teilen sie sie.",
    short: "Atombindungen bilden Nichtmetalle untereinander.",
  },
  'chem-mis-mo-octet-hydrogen': {
    detailed: "Wasserstoff hat nur die erste Schale, und die fasst zwei Elektronen. Mit einer Bindung hat er schon zwei Elektronen um sich, so viel wie das Edelgas Helium. Mehr nimmt er nicht auf.",
    short: "Wasserstoff ist mit zwei Elektronen zufrieden.",
  },
  'chem-mis-mo-shared-once': {
    detailed: "Ein bindendes Paar liegt zwischen zwei Atomen und gehört beiden. Beim Zählen der Elektronen um ein Atom zählt es deshalb für jedes der beiden voll mit. Nur so erreichen zwei Chloratome mit einem einzigen gemeinsamen Paar beide ihr Oktett.",
    short: "Ein bindendes Paar zählt für beide Atome.",
  },
  'chem-mis-mo-bonds-valence': {
    detailed: "Ein Atom bildet so viele Bindungen, wie ihm Elektronen zum Oktett fehlen. Chlor hat sieben Valenzelektronen, ihm fehlt eines: Es bildet eine Bindung; die übrigen Elektronen bleiben als freie Paare.",
    short: "Zahl der Bindungen = Elektronen, die bis zum Oktett fehlen.",
  },
  'chem-mis-mo-lewis-all': {
    detailed: "Die Lewis-Formel zeigt nur die Valenzelektronen, also die der äußersten Schale. Nur sie nehmen an Bindungen teil; die inneren Elektronen bleiben beim Atom und werden nicht gezeichnet.",
    short: "Lewis-Formeln zeigen nur die Valenzelektronen.",
  },
  'chem-mis-mo-double-one-pair': {
    detailed: "Jeder Strich zwischen zwei Atomen ist ein eigenes Elektronenpaar. Eine Doppelbindung sind zwei gemeinsame Paare, also vier Elektronen; eine Dreifachbindung sind drei Paare.",
    short: "Doppelbindung: zwei gemeinsame Paare.",
  },
  'chem-mis-mo-hydrogen-double': {
    detailed: "Wasserstoff hat nur ein Elektron und fasst höchstens zwei. Mit einer einzigen Bindung ist er voll; für eine Doppelbindung bräuchte er vier Elektronen um sich.",
    short: "Wasserstoff bildet genau eine Bindung.",
  },
  'chem-mis-mo-shape-drawing': {
    detailed: "Die Lewis-Formel steht flach auf dem Papier und zeigt nur, welche Atome verbunden sind und wo freie Paare sitzen. Die Winkel darin sind beliebig gezeichnet. Den räumlichen Bau ergibt erst das VSEPR-Modell: Die Paare gehen im Raum so weit wie möglich auseinander.",
    short: "Die Lewis-Formel ist flach; die Gestalt folgt aus dem VSEPR-Modell.",
  },
  'chem-mis-mo-shape-arrangement': {
    detailed: "Man unterscheidet die Anordnung aller Paare um das Zentralatom und die Gestalt des Moleküls. Die Gestalt beschreibt nur die Lage der Atome. Ein freies Paar besetzt einen Platz, aber dort sitzt kein Atom; die Gestalt hat deshalb einen anderen Namen als die Anordnung der Paare.",
    short: "Gestalt = Lage der Atome; freie Paare sieht man darin nicht.",
  },
  'chem-mis-mo-shape-formula': {
    detailed: "Wie ein Molekül gebaut ist, folgt aus den Paaren am Zentralatom, nicht aus der Zahl der Atome. Zwei Formeln, die gleich aussehen, können verschiedene Gestalten haben: wenn das eine Zentralatom freie Paare trägt und das andere nicht.",
    short: "Die freien Paare am Zentralatom entscheiden, nicht die Formel.",
  },
  'chem-mis-mo-multiple-domains': {
    detailed: "Alle Paare einer Mehrfachbindung liegen zwischen denselben zwei Atomen und zeigen in dieselbe Richtung. Für die Gestalt zählt eine Mehrfachbindung deshalb wie eine einzige Bindung.",
    short: "Eine Mehrfachbindung zählt wie eine Bindung.",
  },
  'chem-mis-mo-lone-small': {
    detailed: "Ein freies Paar gehört nur dem Zentralatom und sitzt nahe an ihm. Es braucht deshalb sogar mehr Platz als ein bindendes Paar, drückt die Bindungen zusammen und macht die Winkel etwas kleiner.",
    short: "Freie Paare brauchen mehr Platz als bindende.",
  },
  'chem-mis-mo-pairs-attract': {
    detailed: "Elektronenpaare sind alle negativ geladen und stoßen sich deshalb ab. Sie gehen um das Zentralatom so weit wie möglich auseinander; darauf beruht das VSEPR-Modell.",
    short: "Elektronenpaare stoßen sich ab.",
  },
  'chem-mis-mo-en-meaning': {
    detailed: "Die Elektronegativität ist ein Maß dafür, wie stark ein Atom in einer Bindung das gemeinsame Elektronenpaar zu sich zieht. Mit der Zahl der abgegebenen Elektronen hat sie nichts zu tun; Atome mit hoher Elektronegativität ziehen Elektronen an, statt sie abzugeben.",
    short: "Elektronegativität = Zug am bindenden Paar.",
  },
  'chem-mis-mo-en-trend': {
    detailed: "In einer Periode nimmt die Kernladung nach rechts zu, die Atome werden kleiner und ziehen Elektronen stärker an. Nach unten werden die Atome größer, die äußeren Elektronen sind weiter weg. Deshalb steigt die Elektronegativität in einer Periode nach rechts und in einer Gruppe nach oben.",
    short: "Elektronegativität steigt nach rechts und nach oben.",
  },
  'chem-mis-mo-partial-swapped': {
    detailed: "Das elektronegativere Atom zieht das bindende Paar zu sich. Die Elektronen halten sich öfter bei ihm auf, also wird es etwas negativ; der Partner wird etwas positiv.",
    short: "Das elektronegativere Atom trägt die negative Teilladung.",
  },
  'chem-mis-mo-partial-full': {
    detailed: "In einer polaren Atombindung wird das Paar nur verschoben, nicht ganz übergeben. Es entstehen deshalb nur Teilladungen, kleiner als eine Elementarladung; man schreibt sie mit dem griechischen Delta. Ganze Ladungen haben erst Ionen.",
    short: "Teilladungen sind kleiner als eine ganze Ladung.",
  },
  'chem-mis-mo-same-atoms-polar': {
    detailed: "Zwei gleiche Atome ziehen gleich stark am gemeinsamen Paar. Der Unterschied der Elektronegativität beträgt 0, das Paar liegt genau in der Mitte: Die Bindung ist unpolar.",
    short: "Gleiche Atome: kein Unterschied, keine Polarität.",
  },
  'chem-mis-mo-polar-bond-molecule': {
    detailed: "Polare Bindungen sind nötig, reichen aber nicht. Die Gestalt entscheidet: Liegen gleiche polare Bindungen symmetrisch um das Zentralatom, heben sich ihre Wirkungen auf, und die Ladungsschwerpunkte fallen zusammen.",
    short: "Die Gestalt entscheidet, ob sich polare Bindungen aufheben.",
  },
  'chem-mis-mo-dipole-charged': {
    detailed: "Ein polares Molekül ist insgesamt neutral. Es hat nur eine Seite mit mehr negativer und eine mit mehr positiver Teilladung; die Ladungsschwerpunkte liegen an verschiedenen Stellen. Eine Gesamtladung haben nur Ionen.",
    short: "Ein Dipol ist insgesamt neutral.",
  },
  'chem-mis-mo-en-boundaries': {
    detailed: "Als Richtwerte gelten: Unter 0,5 ist eine Bindung (nahezu) unpolar, von 0,5 bis 1,8 polar, erst darüber eine Ionenbindung. Ein kleiner Unterschied verschiebt das Paar nur etwas.",
    short: "Ionenbindung erst über 1,8.",
  },
  'chem-mis-mo-name-no-prefix': {
    detailed: "In Molekülverbindungen gibt es keine Ionenladungen, aus denen sich die Formel ergäbe. Zwei Nichtmetalle bilden oft mehrere Verbindungen miteinander, etwa Kohlenstoffmonoxid und Kohlenstoffdioxid. Deshalb nennt der Name die Zahl der Atome mit Vorsilben.",
    short: "Molekülverbindungen brauchen Vorsilben für die Anzahlen.",
  },
  'chem-mis-mo-name-order': {
    detailed: "Vorn steht das Element mit der kleineren Elektronegativität, mit seinem deutschen Namen. Das elektronegativere Element kommt dahinter und bekommt die Endung -id, wie bei Salzen das Anion.",
    short: "Das weniger elektronegative Element steht vorn.",
  },
  'chem-mis-mo-name-mono-first': {
    detailed: "Am ersten Element lässt man „mono“ weg: Man sagt Schwefeltrioxid, nicht Monoschwefeltrioxid. Am zweiten Element bleibt „mono“ stehen, damit man die Verbindungen unterscheiden kann.",
    short: "„mono“ entfällt am ersten Element.",
  },
  'chem-mis-mo-octet-molecule': {
    detailed: "Die Oktettregel gilt für jedes einzelne Atom: Jedes Atom außer Wasserstoff hat in der Lewis-Formel vier Paare um sich, bindende mitgezählt. Wie viele Elektronen das ganze Molekül hat, hängt von seinen Atomen ab.",
    short: "Das Oktett gilt für jedes Atom einzeln.",
  },
  'chem-mis-mo-lone-forgotten': {
    detailed: "Die Lewis-Formel zeigt alle Valenzelektronen. Die nicht bindenden stehen als freie Paare am Atom; ohne sie stimmen weder die Elektronenzahl noch das Oktett, und man kann die Gestalt nicht bestimmen.",
    short: "Freie Paare gehören in die Lewis-Formel.",
  },
  'chem-mis-mo-lone-whole-molecule': {
    detailed: "Ein freies Paar gehört dem Atom, an dem es sitzt. Fragt man nach dem Zentralatom, zählen nur seine eigenen freien Paare; die freien Paare der äußeren Atome gehören diesen Atomen. Alle zusammen zählt man nur, wenn ausdrücklich nach dem ganzen Molekül gefragt ist.",
    short: "Nur die freien Paare, die am Zentralatom selbst sitzen.",
  },
  'chem-mis-mo-pair-types': {
    detailed: "Ein bindendes Paar liegt zwischen zwei Atomen und hält sie zusammen. Ein freies Paar gehört nur einem Atom und bildet keine Bindung. Beide zählen zu den Valenzelektronen, haben aber verschiedene Aufgaben.",
    short: "Bindende Paare verbinden Atome, freie Paare sitzen an einem Atom.",
  },
  'chem-mis-mo-stroke-electron': {
    detailed: "In der Lewis-Formel steht jeder Strich für ein Elektronenpaar, also für zwei Elektronen: zwischen zwei Atomen für ein bindendes, am Atom für ein freies Paar.",
    short: "Ein Strich = ein Paar = zwei Elektronen.",
  },
  'chem-mis-mo-electron-count': {
    detailed: "Eine Lewis-Formel muss genau die Valenzelektronen verteilen, die die Atome mitbringen. Erst wenn diese Zahl stimmt und jedes Atom sein Oktett hat, ist sie richtig. Fehlen Elektronen fürs Oktett, teilen sich Atome mehrere Paare.",
    short: "Elektronenzahl und Oktett müssen beide stimmen.",
  },
  'chem-mis-mo-symmetry-assumed': {
    detailed: "Eine lineare oder tetraedrische Gestalt hebt die Wirkung der Bindungen nur auf, wenn alle Partner am Zentralatom gleich sind. Sind sie verschieden, ziehen die Bindungen unterschiedlich stark, und die Ladungsschwerpunkte fallen nicht zusammen.",
    short: "Symmetrisch nur mit gleichen Partnern.",
  },
  'chem-mis-mo-name-prefix-swapped': {
    detailed: "In der Formel steht der Index hinter dem Element, im Namen die Vorsilbe davor. Die Vorsilbe zählt also die Atome des Elements, das direkt nach ihr kommt.",
    short: "Die Vorsilbe zählt das Element direkt dahinter.",
  },
  'chem-mis-mo-name-first-dropped': {
    detailed: "Nur „mono“ lässt man am ersten Element weg. Stehen vom ersten Element mehrere Atome in der Formel, bekommt auch es eine Vorsilbe, wie in Dischwefeldichlorid.",
    short: "Nur „mono“ entfällt am ersten Element.",
  },
  'chem-mis-mo-h-count': {
    detailed: "Wie viele H-Atome ein Nichtmetall bindet, folgt aus den Elektronen, die ihm zum Oktett fehlen: acht minus die Nummer seiner Hauptgruppe. Elemente derselben Hauptgruppe binden gleich viele H-Atome; prüfe, in welcher Gruppe das Element steht.",
    short: "Bindungen = acht minus Hauptgruppe.",
  },
  'chem-mis-mo-element-x2': {
    detailed: "Die Schreibweise $\\ce{Cl2}$ gilt nur für das Element selbst, in dem sich zwei Chloratome ein Paar teilen. In einer Verbindung zählt jedes Atom für sich: Ein Chloratom bildet eine Bindung, also gehört zu ihm ein H-Atom. Die Formel nennt das kleinste Verhältnis der Atome.",
    short: "In Verbindungen zählt jedes Atom einzeln.",
  },
  'chem-mis-mo-field-magnetic': {
    detailed: "Ein Dipol trägt an seinen Enden elektrische Teilladungen. Auf Ladungen wirkt ein elektrisches Feld, etwa zwischen zwei geladenen Platten: Es dreht das Molekül, bis sein negatives Ende zur positiven Seite zeigt. Ein Magnetfeld übt auf ruhende Ladungen keine Kraft aus.",
    short: "Teilladungen spüren das elektrische Feld.",
  },
  'chem-mis-mo-dipole-scalar': {
    detailed: "Jeder Bindungsdipol hat eine Richtung. Man addiert sie wie Pfeile (Vektoren): Zeigen zwei gleich große genau entgegengesetzt, heben sie sich ganz auf. Erst die Gestalt sagt, wie die Pfeile zueinander stehen.",
    short: "Bindungsdipole addiert man mit ihrer Richtung.",
  },
  'chem-mis-mo-en-unbonded': {
    detailed: "Der Unterschied der Elektronegativität beschreibt, wie ungleich zwei Atome ein gemeinsames Paar teilen. Das gibt es nur zwischen zwei Atomen, die direkt verbunden sind. Schau in der Lewis-Formel nach, welche Atome ein Strich verbindet.",
    short: "Nur direkt verbundene Atome teilen ein Paar.",
  },
}
