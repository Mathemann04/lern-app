import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Chemisches Gleichgewicht“ (Ids wie in mwg.ts). Die Texte nennen den Fehler
// und die Regel, aber nicht die Antwort einer Frage; meist als Frage zum Weiterdenken. Wo eine Frage genau danach fragt, hat
// die Antwort einen eigenen Text.

export const MWG_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-gg-stopped': {
    detailed: 'Von außen wirkt ein Gleichgewicht ruhig. Überlege, ob die einzelnen Teilchen deshalb wirklich aufhören zu reagieren, oder ob sich nur nichts mehr sichtbar ändert.',
    short: 'Ruhig von außen, aber im Kleinen?',
  },
  'chem-mis-gg-equal-conc': {
    detailed: 'Gleiche Mengen von Edukten und Produkten verlangt das Gleichgewicht nicht. Wie viel von jedem Stoff vorliegt, hängt von der Reaktion und den Bedingungen ab.',
    short: 'Gleiche Mengen sind nicht verlangt.',
  },
  'chem-mis-gg-complete': {
    detailed: 'Vollständig läuft eine Reaktion nur ab, wenn nichts zurückreagiert. Prüfe, ob das bei einer Gleichgewichtsreaktion der Fall ist.',
    short: 'Reagiert etwas zurück?',
  },
  'chem-mis-gg-forward-faster': {
    detailed: 'Wäre eine Richtung schneller, würden sich die Konzentrationen weiter ändern. Im Gleichgewicht bleiben sie gleich; überlege, was das für die beiden Geschwindigkeiten heißt.',
    short: 'Was heißt „Konzentrationen bleiben gleich“?',
  },
  'chem-mis-gg-mwg-educts-top': {
    detailed: 'Zähler und Nenner sind vertauscht. Ein großes $K_{\\mathrm{GG}}$ soll bedeuten, dass die Reaktion weit nach rechts abläuft; überlege, welche Stoffe dafür oben stehen müssen.',
    short: 'Zähler und Nenner vertauscht.',
  },
  'chem-mis-gg-mwg-coef': {
    detailed: 'Der Koeffizient zählt, wie oft ein Teilchen an der Reaktion beteiligt ist. Überlege, wie man in einem Produkt ausdrückt, dass ein Faktor mehrmals vorkommt.',
    short: 'Wie geht „mehrmals“ ein?',
  },
  'chem-mis-gg-mwg-sum': {
    detailed: 'Im Massenwirkungsgesetz werden Konzentrationen nicht zusammengezählt oder abgezogen. Überlege, welche Rechenart ausdrückt, dass alle Teilchen zugleich zusammentreffen müssen.',
    short: 'Nicht zusammenzählen.',
  },
  'chem-mis-gg-k-large': {
    detailed: 'Die Produkte stehen im Zähler von $K_{\\mathrm{GG}}$. Überlege, wie groß der Bruch wird, wenn im Zähler viel und im Nenner wenig steht.',
    short: 'Produkte stehen im Zähler.',
  },
  'chem-mis-gg-k-speed': {
    detailed: 'Die Gleichgewichtskonstante beschreibt den Zustand am Ende, nicht den Weg dorthin. Wie schnell eine Reaktion läuft, hängt von anderen Größen ab, etwa der Aktivierungsenergie.',
    short: 'K beschreibt das Ende, nicht das Tempo.',
  },
  'chem-mis-gg-k-changes': {
    detailed: 'Das Zugeben oder Entfernen eines Stoffs gehört nicht zu den Größen, von denen die Gleichgewichtskonstante abhängt. Überlege, welche Bedingung das ist und was sich beim Zugeben stattdessen ändert.',
    short: 'Wovon hängt K ab?',
  },
  'chem-mis-gg-rate-const': {
    detailed: 'Die Geschwindigkeit hängt von den Konzentrationen ab, und die ändern sich im Lauf der Reaktion. Überlege, in welche Richtung.',
    short: 'Die Konzentrationen ändern sich.',
  },
  'chem-mis-gg-rate-conc': {
    detailed: 'Überlege, wie oft Teilchen zusammenstoßen, wenn mehr oder weniger von ihnen im selben Volumen sind.',
    short: 'Wie oft stoßen Teilchen zusammen?',
  },
  'chem-mis-gg-k-rates': {
    detailed: 'Setze $v_{\\text{hin}} = v_{\\text{rück}}$ an und stelle sorgfältig um. Prüfe, welche Konstante dabei auf dieselbe Seite wie die Konzentrationen der Produkte kommt.',
    short: 'Sorgfältig umstellen.',
  },
  'chem-mis-gg-cat-shift': {
    detailed: 'Die Lage könnte ein Katalysator nur verschieben, wenn er eine Richtung bevorzugt. Prüfe, ob er das tut.',
    short: 'Bevorzugt er eine Richtung?',
  },
  'chem-mis-gg-cat-used': {
    detailed: 'Ein Katalysator nimmt an Zwischenschritten teil. Überlege, warum trotzdem winzige Mengen über lange Zeit ausreichen.',
    short: 'Warum reichen kleine Mengen?',
  },
  'chem-mis-gg-cat-dh': {
    detailed: 'Die Reaktionsenthalpie hängt nur davon ab, wo Edukte und Produkte energetisch liegen. Prüfe, ob ein Katalysator Edukte oder Produkte verändert.',
    short: 'Ändert er Edukte oder Produkte?',
  },
  'chem-mis-gg-cat-one-way': {
    detailed: 'Hin- und Rückreaktion laufen über denselben Übergangszustand. Überlege, was es für die andere Richtung bedeutet, wenn dieser Gipfel niedriger wird.',
    short: 'Derselbe Gipfel für beide Richtungen.',
  },
  'chem-mis-gg-cat-energy': {
    detailed: 'Ein Katalysator ist kein Energielieferant und macht den Start nicht schwerer. Überlege, was er stattdessen zwischen Edukten und Produkten verändert.',
    short: 'Kein Energielieferant.',
  },
  'chem-mis-gg-exo-endo': {
    detailed: 'Exotherm und endotherm sind vertauscht. „Exo“ heißt „hinaus“, „endo“ heißt „hinein“; das Vorzeichen von $\\Delta H$ zählt aus Sicht der reagierenden Stoffe.',
    short: '„Exo“: hinaus, „endo“: hinein.',
  },
  'chem-mis-gg-ea-dh': {
    detailed: 'Aktivierungsenergie und Reaktionsenthalpie sind verschiedene Größen. Die Reaktionsenthalpie ist der Höhenunterschied zwischen Edukten und Produkten; die Aktivierungsenergie misst etwas anderes im Energiediagramm.',
    short: 'Zwei verschiedene Größen.',
  },
  'chem-mis-gg-exo-no-ea': {
    detailed: 'Auch exotherme Reaktionen müssen erst über einen Energieberg. Deshalb brennt Holz nicht von selbst, sondern erst nach dem Anzünden.',
    short: 'Auch exotherme Reaktionen brauchen einen Anstoß.',
  },
  'chem-mis-gg-heat-products': {
    detailed: 'Wärme bevorzugt keine Seite, nur weil sie rechts steht. Überlege, welche Richtung zugeführte Wärme aufnehmen kann; das verrät das Vorzeichen von $\\Delta H$.',
    short: 'Welche Richtung nimmt Wärme auf?',
  },
  'chem-mis-gg-pressure-more': {
    detailed: 'Ein Gleichgewicht verstärkt einen Zwang nicht, es weicht ihm aus. Überlege, auf welcher Seite die Gase den Druck wieder senken könnten.',
    short: 'Ausweichen, nicht verstärken.',
  },
  'chem-mis-gg-pressure-count': {
    detailed: 'Für den Druck zählen die Gasteilchen laut Gleichung. Jeder Koeffizient sagt, wie viele Teilchen eines Stoffs es sind.',
    short: 'Koeffizienten mitzählen.',
  },
  'chem-mis-gg-conc-side': {
    detailed: 'Ein Gleichgewicht verstärkt einen Zwang nicht. Überlege, wie es einen zusätzlichen Stoff wieder loswerden oder einen fehlenden ersetzen kann.',
    short: 'Den Zwang nicht verstärken.',
  },
  'chem-mis-gg-temp-rate-only': {
    detailed: 'Die Temperatur wirkt nicht nur auf das Tempo. Überlege, ob Hin- und Rückreaktion gleich stark auf Wärme reagieren, wenn eine von ihnen Wärme abgibt und die andere Wärme aufnimmt.',
    short: 'Nicht nur das Tempo.',
  },
}
