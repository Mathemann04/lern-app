import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Reaktionsgleichungen“: Name und falsche Aussage (klein, für
// Fehlerstatistik und Lernkarten). Die Erklärungen „Warum ist das falsch?“ stehen in gleichungenWhy.ts und laden
// erst mit den Fragen. Nur als falsche Antworten; Regeln in docs/CHEMIE.md §8.

export const GLEICHUNGEN_MISCONCEPTIONS: readonly MisconceptionName[] = [
  // Gleichungen lesen
  {
    id: 'chem-mis-gl-sides-swapped',
    name: 'Edukte und Produkte vertauscht',
    wrongText: 'Die Produkte einer Reaktion stehen links vom Pfeil, die Ausgangsstoffe rechts.',
  },
  {
    id: 'chem-mis-gl-atoms-transform',
    name: 'Atome wandeln sich um',
    wrongText: 'Bei einer chemischen Reaktion werden Atome eines Elements zu Atomen eines anderen Elements.',
  },
  {
    id: 'chem-mis-gl-molecules-conserved',
    name: 'Zahl der Moleküle für erhalten gehalten',
    wrongText: 'Links und rechts vom Pfeil müssen gleich viele Moleküle stehen; die Koeffizienten ergeben auf beiden Seiten dieselbe Summe.',
  },
  {
    id: 'chem-mis-gl-arrow',
    name: 'Reaktionspfeile verwechselt',
    wrongText: String.raw`Der Doppelpfeil $\rightleftharpoons$ bedeutet, dass eine Reaktion vollständig abläuft.`,
  },
  {
    id: 'chem-mis-gl-state-symbols',
    name: 'Zustandszeichen verwechselt',
    wrongText: '(aq) steht für einen flüssigen Stoff und (l) für einen in Wasser gelösten.',
  },
  {
    id: 'chem-mis-gl-mass-changes',
    name: 'Masse im geschlossenen Gefäß für veränderlich gehalten',
    wrongText: 'Bei einer Reaktion im geschlossenen Gefäß geht Masse verloren, weil Stoffe verbraucht werden.',
  },
  {
    id: 'chem-mis-gl-coef-index-swap',
    name: 'Koeffizient und Index verwechselt',
    wrongText: 'Die große Zahl vor einer Formel gibt an, wie viele Atome ein Teilchen enthält; die kleine Zahl in der Formel zählt die Teilchen.',
  },
  {
    id: 'chem-mis-gl-count-coef',
    name: 'Koeffizient nicht auf die ganze Formel bezogen',
    wrongText: 'Beim Zählen der Atome gilt der Koeffizient nur für das erste Symbol der Formel.',
  },
  {
    id: 'chem-mis-gl-count-index',
    name: 'Index falsch zugeordnet',
    wrongText: 'Ein Index gilt für die ganze Formel, nicht nur für das Symbol oder die Klammer davor.',
  },
  {
    id: 'chem-mis-gl-coef-added',
    name: 'Koeffizient und Index addiert',
    wrongText: 'Um die Atome eines Elements zu zählen, zählt man Koeffizient und Index zusammen.',
  },
  {
    id: 'chem-mis-gl-coef-one',
    name: 'Fehlenden Koeffizienten falsch gedeutet',
    wrongText: 'Steht vor einer Formel keine Zahl, nimmt dieser Stoff nicht an der Reaktion teil, oder seine Menge ist beliebig.',
  },
  {
    id: 'chem-mis-gl-ratio-mass',
    name: 'Koeffizienten als Massenverhältnis gelesen',
    wrongText: 'Die Koeffizienten geben an, in welchem Massenverhältnis die Stoffe reagieren.',
  },
  {
    id: 'chem-mis-gl-ratio-index',
    name: 'Verhältnis aus den Indizes gelesen',
    wrongText: 'Das Verhältnis, in dem zwei Stoffe reagieren, steht in den Indizes ihrer Formeln.',
  },
  {
    id: 'chem-mis-gl-ratio-fixed',
    name: 'Koeffizienten als feste Stückzahl gelesen',
    wrongText: 'Die Koeffizienten sind feste Stückzahlen; für andere Mengen gilt die Gleichung nicht.',
  },
  {
    id: 'chem-mis-gl-ratio-wrong',
    name: 'Verhältnis falsch angewendet',
    wrongText: 'Um von der Menge eines Stoffes auf die eines anderen zu kommen, nimmt man sie mit dessen Koeffizienten mal.',
  },
  // Ausgleichen
  {
    id: 'chem-mis-gl-index-changed',
    name: 'Index statt Koeffizient geändert',
    wrongText: String.raw`Beim Ausgleichen darf man die kleinen Zahlen in einer Formel ändern, etwa $\ce{MgO}$ zu $\ce{MgO2}$.`,
  },
  {
    id: 'chem-mis-gl-add-species',
    name: 'Fehlende Atome als neuen Stoff ergänzt',
    wrongText: 'Fehlen auf einer Seite Atome, schreibt man einfach ein passendes Atom oder einen passenden Stoff dazu.',
  },
  {
    id: 'chem-mis-gl-single-atom',
    name: 'Zweiatomiges Element als Einzelatom geschrieben',
    wrongText: String.raw`Wasserstoff, Stickstoff, Sauerstoff und die Halogene stehen in Gleichungen als einzelne Atome, etwa $\ce{O}$ oder $\ce{Cl}$.`,
  },
  {
    id: 'chem-mis-gl-diatomic-metal',
    name: 'Andere Elemente als zweiatomig geschrieben',
    wrongText: String.raw`Jedes Element steht in Gleichungen als Molekül aus zwei Atomen, auch Metalle wie Natrium ($\ce{Na2}$) oder Eisen ($\ce{Fe2}$).`,
  },
  {
    id: 'chem-mis-gl-skeleton-ok',
    name: 'Unausgeglichenes Gerüst für fertig gehalten',
    wrongText: 'Stehen die richtigen Formeln links und rechts, ist die Gleichung fertig; Zahlen davor braucht es nicht.',
  },
  {
    id: 'chem-mis-gl-not-recounted',
    name: 'Nach einer Änderung nicht neu gezählt',
    wrongText: 'Hat man ein Element mit einem Koeffizienten ausgeglichen, stimmen die übrigen Elemente von selbst.',
  },
  {
    id: 'chem-mis-gl-atoms-molecules',
    name: 'Atome und Moleküle verwechselt',
    wrongText: String.raw`Werden sechs Sauerstoffatome gebraucht, schreibt man $\ce{6 O2}$.`,
  },
  {
    id: 'chem-mis-gl-partly-doubled',
    name: 'Nur teilweise vervielfacht',
    wrongText: 'Um einen Bruch loszuwerden, nimmt man nur den Koeffizienten mit dem Bruch mal 2.',
  },
  {
    id: 'chem-mis-gl-fraction',
    name: 'Bruch im Ergebnis falsch behandelt',
    wrongText: 'Ein Bruch vor einer Formel darf in der fertigen Gleichung stehen bleiben oder auf eine ganze Zahl gerundet werden.',
  },
  {
    id: 'chem-mis-gl-not-smallest',
    name: 'Koeffizienten nicht gekürzt',
    wrongText: 'Ist eine Gleichung ausgeglichen, steht sie auch schon mit den kleinsten ganzen Zahlen da.',
  },
  {
    id: 'chem-mis-gl-multiple-wrong',
    name: 'Vielfaches einer Gleichung für falsch gehalten',
    wrongText: 'Nimmt man alle Koeffizienten einer ausgeglichenen Gleichung mal 2, ist sie nicht mehr richtig.',
  },
  {
    id: 'chem-mis-gl-formula-split',
    name: 'Summenformel in Elemente zerlegt',
    wrongText: String.raw`In einer Gleichung darf man einen Stoff in seine Elemente aufteilen, etwa $\ce{C6H12O6}$ in $\ce{C6 + H12 + O6}$.`,
  },
  // Verbrennung, Alkane und Alkohole
  {
    id: 'chem-mis-gl-combustion-products',
    name: 'Falsche Produkte der vollständigen Verbrennung',
    wrongText: 'Bei der vollständigen Verbrennung eines Kohlenwasserstoffs entstehen Kohlenstoffmonoxid und Wasserstoff.',
  },
  {
    id: 'chem-mis-gl-water-oxygen',
    name: 'Sauerstoff im Wasser vergessen',
    wrongText: 'Beim Ausgleichen einer Verbrennung zählt man nur den Sauerstoff im Kohlenstoffdioxid.',
  },
  {
    id: 'chem-mis-gl-h-per-water',
    name: 'Ein Wassermolekül je H-Atom',
    wrongText: 'Aus jedem Wasserstoffatom des Brennstoffs entsteht ein Wassermolekül.',
  },
  {
    id: 'chem-mis-gl-fuel-oxygen',
    name: 'Sauerstoff im Brennstoff falsch berücksichtigt',
    wrongText: 'Den Sauerstoff im Alkohol muss man beim Ausgleichen der Verbrennung nicht beachten.',
  },
  {
    id: 'chem-mis-gl-incomplete',
    name: 'Unvollständige Verbrennung falsch beschrieben',
    wrongText: 'Bei Sauerstoffmangel entstehen dieselben Produkte wie bei der vollständigen Verbrennung, nur weniger davon.',
  },
  {
    id: 'chem-mis-gl-incomplete-hydrogen',
    name: 'Wasserstoff bei Sauerstoffmangel für unverbrannt gehalten',
    wrongText: 'Bei Sauerstoffmangel bleibt der Wasserstoff des Brennstoffs als Gas übrig.',
  },
  {
    id: 'chem-mis-gl-alkane-formula',
    name: 'Allgemeine Formel der Alkane falsch',
    wrongText: String.raw`Ein Alkan mit $n$ Kohlenstoffatomen hat $n + 2$ Wasserstoffatome.`,
  },
  {
    id: 'chem-mis-gl-alkane-name',
    name: 'Name und Kettenlänge falsch zugeordnet',
    wrongText: 'Die Vorsilbe eines Alkannamens zählt die Kohlenstoffatome um eins verschoben: Pentan hat vier.',
  },
  {
    id: 'chem-mis-gl-alcohol-formula',
    name: 'Formel des Alkohols falsch',
    wrongText: 'Ein Alkohol entsteht, wenn man an ein Alkan zusätzlich eine OH-Gruppe hängt; alle H-Atome des Alkans bleiben.',
  },
]
