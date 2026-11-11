import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Metallbindung und Hybridisierung“ (Ids wie in metalle.ts). Die Texte
// nennen den Fehler und die Regel; wo eine Frage genau danach fragt, hat die Antwort einen eigenen Text.

export const METALLE_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-me-fixed': {
    detailed: "Metallatome geben ihre wenigen Valenzelektronen leicht ab. Im Metall gehören diese Elektronen keinem einzelnen Atom; sie bewegen sich zwischen den Atomrümpfen hin und her.",
    short: "Die Valenzelektronen gehören im Metall allen gemeinsam.",
  },
  'chem-mis-me-salt-like': {
    detailed: "In einem Metall gibt es keine Anionen. Die positiven Atomrümpfe werden von den beweglichen Valenzelektronen zusammengehalten; ein Salz dagegen besteht aus Kationen und Anionen eines Metalls und eines Nichtmetalls.",
    short: "Im Metall gibt es keine Anionen.",
  },
  'chem-mis-me-cores-move': {
    detailed: "Die Atomrümpfe sitzen an festen Plätzen im Gitter und schwingen nur. Den Strom tragen die beweglichen Valenzelektronen, die auf ein elektrisches Feld reagieren.",
    short: "Die Atomrümpfe bleiben an ihren Plätzen.",
  },
  'chem-mis-me-brittle': {
    detailed: "Im Metall sind alle Atomrümpfe positiv und von beweglichen Elektronen umgeben. Verschiebt man Schichten, ändert sich an dieser Umgebung nichts; es stehen sich keine abstoßenden Ladungen gegenüber.",
    short: "Im Metall trifft beim Verschieben nichts Abstoßendes aufeinander.",
  },
  'chem-mis-me-salt-deform': {
    detailed: "Verschiebt man in einem Salzkristall eine Schicht um ein Ion, stehen sich plötzlich gleich geladene Ionen gegenüber. Sie stoßen sich ab, und der Kristall bricht.",
    short: "Im Salz stoßen sich verschobene Ionen ab.",
  },
  'chem-mis-me-heat-metal': {
    detailed: "Beim Erwärmen schwingen die Atomrümpfe stärker. Die wandernden Elektronen stoßen öfter mit ihnen zusammen und werden gebremst: Der Widerstand eines Metalls steigt.",
    short: "Stärkere Schwingungen bremsen die Elektronen.",
  },
  'chem-mis-me-heat-semi': {
    detailed: "In einem Halbleiter müssen Elektronen erst die schmale verbotene Zone überwinden, um leiten zu können. Wärme liefert ihnen die Energie dafür; je wärmer, desto mehr bewegliche Ladungsträger.",
    short: "Wärme hebt Elektronen ins Leitungsband.",
  },
  'chem-mis-me-kz': {
    detailed: "In den dichtesten Kugelpackungen ist jedes Atom von sechs Nachbarn in der eigenen Schicht und je drei darüber und darunter umgeben. Die Koordinationszahl 8 gehört zum kubisch-raumzentrierten Gitter.",
    short: "Dichteste Packung: sechs in der Schicht, drei darüber, drei darunter.",
  },
  'chem-mis-me-no-electrons': {
    detailed: "Auch Isolatoren haben viele Elektronen. Sie sitzen aber in einem voll besetzten Valenzband, und bis zum leeren Leitungsband ist die verbotene Zone so breit, dass kein Elektron sie überwinden kann.",
    short: "Die Elektronen sind da, aber nicht beweglich.",
  },
  'chem-mis-me-gap': {
    detailed: "Bei Metallen ist das Valenzband nur teilweise besetzt oder überlappt mit dem Leitungsband; es gibt keine trennende Lücke. Bei Isolatoren trennt eine breite verbotene Zone das volle Valenzband vom leeren Leitungsband.",
    short: "Metalle: keine Lücke; Isolatoren: breite Lücke.",
  },
  'chem-mis-me-dope-charge': {
    detailed: "Jedes Fremdatom bringt genauso viele Protonen wie Elektronen mit. Der Kristall bleibt insgesamt neutral; es ändert sich nur die Zahl der beweglichen Ladungsträger.",
    short: "Dotiert, aber neutral.",
  },
  'chem-mis-me-dope-swap': {
    detailed: "Ein Fremdatom mit einem Valenzelektron mehr als die Gitteratome hat eines übrig: ein bewegliches negatives Elektron (n). Eines mit einem weniger hinterlässt eine Lücke: ein Loch, das sich wie eine positive Ladung bewegt (p).",
    short: "Mehr Elektronen: n; weniger: p.",
  },
  'chem-mis-me-hyb-partners': {
    detailed: "Gezählt werden die Richtungen um das Atom: Bindungspartner und freie Paare; eine Mehrfachbindung zählt einmal. So viele Richtungen, so viele Hybridorbitale.",
    short: "Richtungen zählen: Partner und freie Paare.",
  },

  'chem-mis-me-hyb-pi': {
    detailed: "Nur die σ-Bindung einer Mehrfachbindung liegt in einem Hybridorbital. Die π-Bindungen entstehen aus p-Orbitalen, die nicht an der Hybridisierung teilgenommen haben und seitlich überlappen.",
    short: "π-Bindungen kommen aus nicht hybridisierten p-Orbitalen.",
  },
  'chem-mis-me-two-sigma': {
    detailed: "Zwischen zwei Atomen kann es nur eine σ-Bindung geben, die frontal auf der Verbindungslinie liegt. Jede weitere Bindung zwischen denselben Atomen ist eine π-Bindung.",
    short: "Nur eine σ-Bindung zwischen zwei Atomen.",
  },
  'chem-mis-me-pi-alone': {
    detailed: "Eine π-Bindung entsteht durch seitliche Überlappung von p-Orbitalen, ober- und unterhalb der Verbindungslinie. Sie kommt nur zusätzlich zu einer σ-Bindung vor, die die Atome auf der Linie verbindet.",
    short: "π gibt es nur zusätzlich zu σ.",
  },
  'chem-mis-me-antibonding': {
    detailed: "Elektronen in antibindenden Orbitalen halten sich vor allem außerhalb des Raums zwischen den Kernen auf. Sie schwächen die Bindung und heben die Wirkung bindender Elektronen auf.",
    short: "Antibindende Elektronen schwächen.",
  },
  'chem-mis-me-mo-count': {
    detailed: "Aus jeder Kombination von Atomorbitalen entstehen ebenso viele Molekülorbitale: ein bindendes und ein antibindendes aus zwei Atomorbitalen.",
    short: "So viele Molekülorbitale wie Atomorbitale.",
  },
  'chem-mis-me-dense-hard': {
    detailed: "Die Härte hängt nicht davon ab, wie dicht die Kugeln liegen, sondern davon, wie leicht Gitterebenen aneinander abgleiten. Gerade die dichtesten Packungen wie bei Kupfer haben viele glatte Gleitebenen; das weniger dicht gepackte kubisch-raumzentrierte Gitter gehört zu den härtesten.",
    short: "Dicht gepackt heißt nicht hart; es kommt auf das Gleiten der Ebenen an.",
  },
  'chem-mis-me-hdp-like-kdp': {
    detailed: "Beide Packungen haben 12 Nachbarn und 74 % Raumerfüllung, aber eine andere Schichtfolge. Davon hängt ab, in wie vielen Richtungen Ebenen gleiten können: Die kubische Packung lässt sich leicht walzen und ziehen, die hexagonale kaum; dafür lässt sie sich gut gießen.",
    short: "Gleiche Dichte, andere Schichtfolge: Die hexagonale Packung ist schlecht formbar.",
  },
  'chem-mis-me-sinter-melt': {
    detailed: "Sintern geschieht bei hoher Temperatur, aber unterhalb des Schmelzpunkts. Die Pulverkörner bleiben fest und wachsen an ihren Berührungsstellen zusammen; je nach Verfahren bleiben dabei Poren zurück oder nicht.",
    short: "Sintern bleibt unter dem Schmelzpunkt.",
  },
  'chem-mis-me-interstitial-soft': {
    detailed: "Beim Verformen gleiten Gitterebenen aneinander vorbei. Kleine Atome in den Lücken stören dieses Gleiten; das Metall wird dadurch härter, nicht weicher.",
    short: "Eingelagerte Atome bremsen das Gleiten und härten.",
  },
  'chem-mis-me-h2-molecule': {
    detailed: String.raw`Das $\ce{H2}$-Molekül wird im Metall gespalten; einzelne Wasserstoffatome sind so klein, dass sie in die Lücken zwischen den Metallatomen passen. Erst beim Erwärmen finden sie wieder zu $\ce{H2}$ zusammen und entweichen.`,
    short: "Im Metall sitzen einzelne H-Atome, keine Moleküle.",
  },
  'chem-mis-me-full-band': {
    detailed: "In einem voll besetzten Band ist jedes Niveau belegt; ein Elektron kann seine Energie nicht ändern, weil kein freier Platz in Reichweite ist. Strom fließt erst, wenn ein Band nur teilweise besetzt ist oder mit einem freien Band überlappt.",
    short: "Ein volles Band ohne Überlappung leitet nicht.",
  },
  'chem-mis-me-levels-spread': {
    detailed: "Mit jedem Atom kommt ein Molekülorbital hinzu, doch alle bleiben in einem begrenzten Energiebereich. Mehr Niveaus im selben Bereich heißt: Sie rücken enger zusammen, bis sie bei sehr vielen Atomen ein Band bilden.",
    short: "Mehr Atome, dichter liegende Niveaus.",
  },
  'chem-mis-me-color-atoms': {
    detailed: "Ein Stoff ist farbig, wenn er einen Teil des sichtbaren Lichts aufnimmt. Das gelingt nur, wenn die Energie des Lichts genau reicht, um ein Elektron auf ein freies Niveau zu heben. Ob das so ist, hängt von den Abständen der Energieniveaus ab, nicht von der Masse oder davon, welche Atome für sich genommen beteiligt sind.",
    short: "Farbe hängt von den Abständen der Energieniveaus ab.",
  },
  'chem-mis-me-kryolith': {
    detailed: "Das Aluminium stammt aus dem Aluminiumoxid. Kryolith wird zugesetzt, weil das Gemisch viel niedriger schmilzt als reines Aluminiumoxid; das spart viel Energie.",
    short: "Kryolith senkt die Schmelztemperatur.",
  },
  'chem-mis-me-al-anode': {
    detailed: "Aluminium entsteht aus den positiven Aluminium-Ionen. Sie wandern zum negativen Pol, der Kathode, und nehmen dort Elektronen auf.",
    short: "Kationen wandern zur Kathode.",
  },
}
