import type { MisconceptionName } from '../../quiz/types.ts'

// Typische Denkfehler zum Thema „Metallbindung und Hybridisierung“: Name und falsche Aussage (klein, für
// Fehlerstatistik und Lernkarten). Die Erklärungen stehen in metalleWhy.ts. Regeln in docs/CHEMIE.md §8.

export const METALLE_MISCONCEPTIONS: readonly MisconceptionName[] = [
  { id: 'chem-mis-me-fixed', name: "Elektronen im Metall fest an den Atomen", wrongText: "In einem Metall sitzen die Valenzelektronen fest an ihren Atomen, wie in einer Atombindung." },
  { id: 'chem-mis-me-salt-like', name: "Metall wie ein Salz", wrongText: "Ein Metall besteht aus positiven und negativen Ionen, wie ein Salz." },
  { id: 'chem-mis-me-cores-move', name: "Atomrümpfe tragen den Strom", wrongText: "Metalle leiten Strom, weil die Atomrümpfe durch das Gitter wandern." },
  { id: 'chem-mis-me-brittle', name: "Metalle für spröde gehalten", wrongText: "Metalle brechen beim Verformen, weil sich gleich geladene Teilchen gegenüberstehen." },
  { id: 'chem-mis-me-salt-deform', name: "Salze für verformbar gehalten", wrongText: "Salze lassen sich verformen wie Metalle, weil ihre Ionen ebenfalls gleiten können." },
  { id: 'chem-mis-me-heat-metal', name: "Metall leitet warm besser", wrongText: "Metalle leiten den Strom besser, wenn man sie erwärmt." },
  { id: 'chem-mis-me-heat-semi', name: "Halbleiter leitet warm schlechter", wrongText: "Halbleiter leiten den Strom schlechter, wenn man sie erwärmt." },
  { id: 'chem-mis-me-kz', name: "Koordinationszahl der Metallgitter verwechselt", wrongText: "In den dichtesten Kugelpackungen hat jedes Atom acht nächste Nachbarn." },
  { id: 'chem-mis-me-dense-hard', name: "Dichteste Packung für die härteste gehalten", wrongText: "Je dichter die Atome eines Metalls gepackt sind, desto härter und spröder ist das Metall." },
  { id: 'chem-mis-me-hdp-like-kdp', name: "Beide dichtesten Packungen gleich verformbar", wrongText: "Hexagonal und kubisch dicht gepackte Metalle lassen sich gleich gut verformen, weil beide dichteste Packungen sind." },
  { id: 'chem-mis-me-sinter-melt', name: "Sintern für Schmelzen gehalten", wrongText: "Beim Sintern wird das Pulver ganz geschmolzen und dann in eine Form gegossen." },
  { id: 'chem-mis-me-interstitial-soft', name: "Einlagerungen machen weicher", wrongText: "Kleine Atome in den Lücken eines Metallgitters machen das Metall weicher." },
  { id: 'chem-mis-me-h2-molecule', name: "Wasserstoff als Molekül im Metall", wrongText: String.raw`Ein Metall speichert Wasserstoff als ganze $\ce{H2}$-Moleküle in den Lücken seines Gitters.` },
  { id: 'chem-mis-me-no-electrons', name: "Isolatoren ohne Elektronen", wrongText: "Isolatoren leiten nicht, weil sie keine Elektronen haben." },
  { id: 'chem-mis-me-gap', name: "Bandlücke falsch zugeordnet", wrongText: "Metalle haben eine breite verbotene Zone, Isolatoren keine." },
  { id: 'chem-mis-me-full-band', name: "Volles Band für leitend gehalten", wrongText: "Ein voll besetztes Band leitet den Strom auch ohne Überlappung mit einem freien Band, weil seine Elektronen beweglich sind." },
  { id: 'chem-mis-me-dope-charge', name: "Dotierter Halbleiter für geladen gehalten", wrongText: "Ein dotierter Halbleiter ist elektrisch geladen." },
  { id: 'chem-mis-me-dope-swap', name: "n- und p-Dotierung vertauscht", wrongText: "Fremdatome mit fünf Valenzelektronen erzeugen Löcher, solche mit drei freie Elektronen." },
  { id: 'chem-mis-me-hyb-partners', name: "Richtungen falsch gezählt", wrongText: "Für die Hybridisierung zählt man nur die Bindungspartner, die Bindungsstriche oder die Hochzahl, nicht die Richtungen um das Atom." },
  { id: 'chem-mis-me-hyb-pi', name: "π-Bindungen in Hybridorbitalen", wrongText: "Auch die π-Bindungen einer Doppelbindung sitzen in Hybridorbitalen." },
  { id: 'chem-mis-me-two-sigma', name: "Doppelbindung aus zwei σ-Bindungen", wrongText: "Eine Doppelbindung besteht aus zwei σ-Bindungen." },
  { id: 'chem-mis-me-pi-alone', name: "π-Bindung ohne σ-Bindung", wrongText: "Zwei Atome können allein über eine π-Bindung verbunden sein." },
  { id: 'chem-mis-me-antibonding', name: "Antibindende Elektronen verstärken", wrongText: "Antibindende Elektronen verstärken die Bindung wie bindende." },
  { id: 'chem-mis-me-mo-count', name: "Zahl der Molekülorbitale falsch", wrongText: "Aus zwei Atomorbitalen entsteht nur ein Molekülorbital." },
  { id: 'chem-mis-me-levels-spread', name: "Mehr Atome, weitere Abstände", wrongText: "Je mehr Atome an einer Mehrzentrenbindung beteiligt sind, desto weiter liegen die Energieniveaus auseinander." },
  { id: 'chem-mis-me-color-atoms', name: "Farbe ohne die Elektronen erklärt", wrongText: "Die Farbe eines Stoffs kommt von seinen Atomen selbst oder von seiner Masse, nicht von den Energieniveaus seiner Elektronen." },
  { id: 'chem-mis-me-kryolith', name: "Rolle des Kryoliths verwechselt", wrongText: "Kryolith liefert bei der Aluminiumherstellung das Aluminium." },
  { id: 'chem-mis-me-al-anode', name: "Aluminium an der Anode", wrongText: "Bei der Schmelzflusselektrolyse entsteht Aluminium an der Anode." },
]
