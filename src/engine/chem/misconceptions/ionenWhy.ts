import type { Explanation } from '../../quiz/types.ts'

// „Warum ist das falsch?“ je Denkfehler zum Thema „Ionenbindung und Salze“ (Ids wie in ionen.ts)

export const IONEN_WHY: Readonly<Record<string, Explanation>> = {
  'chem-mis-io-metal-anion': {
    detailed: "Metallatome haben nur wenige, schwach gebundene Außenelektronen; sie geben sie ab. Nichtmetallatomen fehlen nur wenige Elektronen bis zur vollen Schale; sie nehmen welche auf. Deshalb ist in einem Salz das Metall-Ion immer das Kation und das Nichtmetall-Ion das Anion.",
    short: "Metalle geben Elektronen ab, Nichtmetalle nehmen sie auf.",
  },
  'chem-mis-io-electron-sign': {
    detailed: "Elektronen sind die negativ geladenen Teilchen. Verliert ein Atom eines, fehlt ihm eine negative Ladung, und die positiven Ladungen im Kern überwiegen. Nimmt es eines auf, kommt eine negative Ladung hinzu.",
    short: "Elektronen sind negativ: Abgeben macht positiv, Aufnehmen negativ.",
  },
  'chem-mis-io-proton-charge': {
    detailed: "Protonen sitzen fest im Atomkern; ihre Zahl legt fest, um welches Element es sich handelt. Bei chemischen Reaktionen ändert sich nur die Elektronenhülle. Ein Ion entsteht, wenn ein Atom Elektronen abgibt oder aufnimmt; Natrium bleibt dabei Natrium.",
    short: "Bei Reaktionen wechseln nur Elektronen; der Kern bleibt, wie er ist.",
  },
  'chem-mis-io-bond-mixup': {
    detailed: "Gemeinsame Elektronenpaare kennzeichnen die Atombindung zwischen Nichtmetallen, frei bewegliche Elektronen zwischen Atomrümpfen die Metallbindung. Bei der Ionenbindung teilt niemand Elektronen: Sie wechseln ganz zu einem der Partner, und die entstandenen Ionen halten durch ihre entgegengesetzten Ladungen zusammen.",
    short: "Geteilte Paare sind Atombindung, freie Elektronen Metallbindung; Ionen halten über ihre Ladungen zusammen.",
  },
  'chem-mis-io-molecule': {
    detailed: String.raw`Die Anziehung zwischen Ionen wirkt in alle Richtungen gleich. Jedes Ion zieht deshalb mehrere Gegenionen an, und es entsteht ein Gitter aus sehr vielen Ionen, kein abgeschlossenes Molekül. Die Formel $\ce{NaCl}$ nennt nur das Zahlenverhältnis der Ionen, die Formeleinheit.`,
    short: "Ionen bilden Gitter, keine Moleküle; die Formel gibt nur das Verhältnis an.",
  },
  'chem-mis-io-ions-form-late': {
    detailed: "Die Ionen entstehen schon, wenn das Salz aus Metall und Nichtmetall gebildet wird. Der feste Kristall besteht bereits aus Kationen und Anionen; nur ihre gegenseitige Anziehung hält ihn zusammen. Neutrale Atome hätten diesen Zusammenhalt gar nicht.",
    short: "Ein Salz besteht schon als Feststoff aus Ionen.",
  },
  'chem-mis-io-anion-positive': {
    detailed: "In einem Salz gibt das Metall Elektronen ab und wird positiv. Diese Elektronen nimmt das Nichtmetall auf, es wird negativ. Zwei positive Ionen würden sich abstoßen und könnten kein Salz bilden.",
    short: "Das Nichtmetall nimmt Elektronen auf; sein Ion ist negativ.",
  },
  'chem-mis-io-charge-valence': {
    detailed: "Nur Metalle geben ihre Valenzelektronen ab; bei ihnen entspricht die Ladung deren Zahl. Nichtmetalle nehmen dagegen so viele Elektronen auf, wie ihnen bis zum Oktett fehlen. Die Zahl ihrer Valenzelektronen ist also nicht die Ladung, sondern sagt nur, wie viele noch fehlen.",
    short: "Nichtmetalle nehmen auf, was ihnen bis zum Oktett fehlt.",
  },
  'chem-mis-io-charge-always-one': {
    detailed: String.raw`Die Ladung folgt aus der Stellung im Periodensystem: Ein Atom gibt so viele Elektronen ab oder nimmt so viele auf, wie es bis zur Edelgaskonfiguration braucht. Das kann eines sein, aber genauso zwei oder drei, wie bei $\ce{Mg^2+}$ oder $\ce{Al^3+}$.`,
    short: "Die Ladung hängt von der Gruppe ab; zwei- und dreifach geladene Ionen sind häufig.",
  },
  'chem-mis-io-fixed-ratio': {
    detailed: "Ein Salz ist nach außen neutral. Man nimmt deshalb von jedem Ion genau so viele, dass sich positive und negative Ladungen aufheben, mit den kleinsten ganzen Zahlen. Das Verhältnis ergibt sich also aus den Ladungen; Probe: Index mal Ladung ist für Kation und Anion gleich groß.",
    short: "Das Verhältnis folgt aus den Ladungen; zusammen müssen sie sich aufheben.",
  },
  'chem-mis-io-index-is-charge': {
    detailed: String.raw`Der tiefgestellte Index zählt, wie viele Ionen dieser Sorte in einer Formeleinheit stecken. Die Ladung steht hochgestellt am Ion, etwa bei $\ce{Na+}$; sie folgt aus dem Periodensystem, aus der Liste der Molekül-Ionen oder aus dem Ladungsausgleich, nicht aus dem Index.`,
    short: "Der Index zählt Ionen; die Ladung steht hochgestellt am Ion.",
  },
  'chem-mis-io-element-formula': {
    detailed: String.raw`Bei der Reaktion zum Salz werden die Moleküle der Elemente zerlegt. Im Salz zählt nur noch, wie viele Ionen jeder Sorte nötig sind, damit sich die Ladungen aufheben. Dass Sauerstoff als Gas $\ce{O2}$ vorliegt, sagt darüber nichts.`,
    short: "Die Indizes im Salz kommen aus dem Ladungsausgleich, nicht aus den Formeln der Elemente.",
  },
  'chem-mis-io-index-swap': {
    detailed: "Beim Ausgleich wird die Ladung des einen Ions zum Index des anderen (über Kreuz), danach kürzt man. Steht die Ladung beim eigenen Ion, heben sich die Ladungen meist nicht auf. Probe: Index mal Ladung muss für Kation und Anion gleich groß sein.",
    short: "Probe: Index mal Ladung muss für beide Ionen gleich groß sein.",
  },
  'chem-mis-io-not-neutral': {
    detailed: "Ein Salz ist ein Stoff, den man anfassen kann, und nach außen ungeladen. Deshalb muss die Summe aller Ladungen einer Formeleinheit, und damit auch einer Elementarzelle, Null ergeben. Prüfe immer: Anzahl mal Ladung für alle Ionen zusammenzählen.",
    short: "Die Ladungen in einem Salz heben sich zusammen auf.",
  },
  'chem-mis-io-greek-prefix': {
    detailed: "Zahlwörter wie di- und tri- verwendet man bei Molekülverbindungen aus Nichtmetallen, etwa Kohlenstoffdioxid. Bei Salzen folgen die Anzahlen aus den Ladungen und stehen deshalb nicht im Namen.",
    short: "Salznamen haben keine Zahlwörter; die Anzahlen folgen aus den Ladungen.",
  },
  'chem-mis-io-numeral-always': {
    detailed: "Die Ziffer klärt nur, welches Ion gemeint ist, wenn ein Metall Ionen mit verschiedenen Ladungen bilden kann, etwa Eisen oder Mangan. Alkali- und Erdalkalimetalle sowie Aluminium bilden nur ein Ion; bei ihnen ist die Ladung klar, und die Ziffer entfällt.",
    short: "Die Ziffer steht nur bei Metallen mit mehreren möglichen Ladungen.",
  },
  'chem-mis-io-name-order': {
    detailed: String.raw`Wie in der Formel kommt auch im Namen zuerst das Kation, meist das Metall, und danach das Anion. So wird aus $\ce{NaCl}$ der Name Natriumchlorid.`,
    short: "Zuerst das Kation, dann das Anion.",
  },
  'chem-mis-io-ending-mixup': {
    detailed: String.raw`Die Endung legt fest, welches Ion gemeint ist. -id steht meist für ein einatomiges Anion, etwa Nitrid $\ce{N^3-}$ oder Oxid $\ce{O^2-}$ (Ausnahme: Hydroxid $\ce{OH-}$). -at und -it stehen für Molekül-Ionen mit Sauerstoff, -at mit mehr Sauerstoff als -it: Nitrat $\ce{NO3-}$, Nitrit $\ce{NO2-}$. Der bloße Name des Elements bezeichnet gar kein Ion.`,
    short: "Die Endung legt das Ion fest: -id meist einatomig, -it und -at Molekül-Ionen mit Sauerstoff.",
  },
  'chem-mis-io-numeral-count': {
    detailed: String.raw`Die Ziffer ist keine Anzahl in der Formel: Eisen(III)-chlorid $\ce{FeCl3}$ enthält ein Eisen-Ion, Kupfer(I)-oxid $\ce{Cu2O}$ dagegen zwei Kupfer-Ionen. Wie viele Ionen jeder Sorte in der Formel stehen, folgt erst aus dem Ladungsausgleich.`,
    short: "Die Ziffer zählt keine Ionen; die Anzahlen folgen aus dem Ladungsausgleich.",
  },
  'chem-mis-io-numeral-group': {
    detailed: "Die Gruppe eines Metalls steht nicht im Namen seiner Salze. Kupfer zum Beispiel steht in Gruppe 11 und bildet trotzdem Verbindungen mit der Ziffer I und mit der Ziffer II; die Ziffer muss also etwas anderes angeben.",
    short: "Dasselbe Metall kann verschiedene Ziffern tragen; die Gruppe ist es also nicht.",
  },
  'chem-mis-io-numeral-from-index': {
    detailed: String.raw`Ob eine Ziffer nötig ist, hängt vom Metall ab, nicht von der Formel: Nur Metalle, die Ionen mit verschiedenen Ladungen bilden, brauchen sie. Aluminiumoxid $\ce{Al2O3}$ hat Indizes und trotzdem keine Ziffer, weil Aluminium nur $\ce{Al^3+}$ bildet.`,
    short: "Die Ziffer hängt vom Metall ab, nicht von den Indizes.",
  },
  'chem-mis-io-poly-charge': {
    detailed: "Die Ladungen der häufigen Molekül-Ionen sind fest und müssen gelernt werden; sie ergeben sich nicht aus der Zahl der Sauerstoffatome. Die wichtigsten, von Hydroxid bis Ammonium, stehen mit Ladung auf der Lernkarte „Molekül-Ionen“.",
    short: "Die Ladungen der Molekül-Ionen sind fest; sie stehen auf der Lernkarte.",
  },
  'chem-mis-io-bracket': {
    detailed: String.raw`Ein Index gilt nur für das Zeichen direkt davor. $\ce{CaOH2}$ hieße: ein Sauerstoff- und zwei Wasserstoffatome je Calcium. Soll der Index für ein ganzes Molekül-Ion gelten, muss es in Klammern stehen.`,
    short: "Ohne Klammer gilt der Index nur für das letzte Atom.",
  },
  'chem-mis-io-poly-split': {
    detailed: "In einem Molekül-Ion halten die Atome durch Atombindungen fest zusammen; nur die Gruppe als Ganzes trägt eine Ladung. Beim Lösen oder Schmelzen trennt sich das Molekül-Ion von seinem Gegenion, bleibt selbst aber ganz. In Formeln und Gleichungen steht es deshalb immer als Einheit.",
    short: "Molekül-Ionen bleiben beim Lösen ganz.",
  },
  'chem-mis-io-solid-conducts': {
    detailed: "Für Strom müssen sich Ladungsträger bewegen können. Im festen Kristall sitzen die Ionen fest auf ihren Gitterplätzen und können nicht wandern, freie Elektronen gibt es nicht. Geladene Teilchen allein reichen also nicht.",
    short: "Strom braucht bewegliche Ladungen; im Kristall sitzen die Ionen fest.",
  },
  'chem-mis-io-electrons-conduct': {
    detailed: "In einem Salz sind die Elektronen fest an die Ionen gebunden; ein Elektronengas wie in einem Metall gibt es dort nicht, auch nicht nach dem Schmelzen oder Lösen. Wenn eine Schmelze oder Lösung leitet, muss also ein anderes geladenes Teilchen den Strom tragen, das sich dort frei bewegen kann.",
    short: "In Salzen gibt es keine freien Elektronen; andere Teilchen tragen den Strom.",
  },
  'chem-mis-io-state-decides': {
    detailed: "Metalle leiten schon als Feststoff sehr gut, reines Wasser oder Öl dagegen kaum. Entscheidend ist, ob es bewegliche geladene Teilchen gibt, nicht der Aggregatzustand allein.",
    short: "Es zählen bewegliche Ladungsträger, nicht ob der Stoff flüssig ist.",
  },
  'chem-mis-io-ductile': {
    detailed: "Metalle halten über ein Elektronengas zusammen, das sich beim Verformen einfach mit verschiebt. Ein Ionengitter hat diesen Ausgleich nicht: Verschiebt man eine Schicht, ändern sich die Nachbarn jedes Ions. Überlege, welche Ladungen dann nebeneinanderliegen.",
    short: "Im Ionengitter ändert jede Verschiebung die Nachbarn der Ionen.",
  },
  'chem-mis-io-weak-forces': {
    detailed: "Kationen und Anionen ziehen sich elektrostatisch stark an, und jedes Ion hat mehrere Gegenionen als Nachbarn. Um sie voneinander zu lösen, braucht es viel Energie; Kochsalz schmilzt zum Beispiel erst bei rund 800 Grad Celsius.",
    short: "Die Anziehung zwischen Ionen ist stark und wirkt in alle Richtungen.",
  },
  'chem-mis-io-mass-decides': {
    detailed: "Die Kraft zwischen Ionen ist eine elektrische Kraft. Sie hängt von den Ladungen und vom Abstand ab; die Masse spielt dafür keine Rolle. Schwere Ionen sind oft auch große Ionen, deren Ladungen weit auseinanderliegen.",
    short: "Es zählen Ladung und Abstand, nicht die Masse.",
  },
  'chem-mis-io-distance': {
    detailed: "Die Coulomb-Kraft nimmt mit dem Abstand ab, ungefähr mit seinem Quadrat. Große Ionen halten ihre Ladungen weiter voneinander entfernt und ziehen sich deshalb schwächer an als kleine Ionen mit gleicher Ladung.",
    short: "Die Anziehung wird mit wachsendem Abstand schwächer.",
  },
  'chem-mis-io-charge-irrelevant': {
    detailed: "Die Coulomb-Kraft ist proportional zum Produkt der beiden Ladungen. Zwei doppelt geladene Ionen ziehen sich bei gleichem Abstand viermal so stark an wie zwei einfach geladene. Die Ladung ist deshalb meist der wichtigste Faktor.",
    short: "Die Kraft wächst mit dem Produkt der Ladungen.",
  },
  'chem-mis-io-amorphous': {
    detailed: "Kristallin heißt: Die Teilchen sitzen in einem Gitter, dessen Muster sich über große Strecken wiederholt; solche Stoffe haben eine feste Schmelztemperatur. Amorph heißt: ohne diese Fernordnung, wie bei Glas oder vielen Kunststoffen; sie werden beim Erhitzen allmählich weich.",
    short: "Kristallin heißt regelmäßiges Gitter, amorph heißt ohne Fernordnung.",
  },
  'chem-mis-io-crystal-look': {
    detailed: "Kristallin beschreibt den inneren Aufbau, nicht das Aussehen. Glas ist durchsichtig und trotzdem amorph, ein Metall ist undurchsichtig und trotzdem kristallin. Entscheidend ist, ob die Teilchen regelmäßig in einem Gitter angeordnet sind.",
    short: "Kristallin betrifft die Anordnung der Teilchen, nicht das Aussehen.",
  },
  'chem-mis-io-cell-is-unit': {
    detailed: "Die Elementarzelle ist das kleinste Stück, aus dem sich das Gitter durch Aneinanderreihen aufbauen lässt. Wie viele Formeleinheiten sie enthält, hängt vom Gittertyp ab. Man zählt es aus, indem man jedes Ion nach seinem Anteil an der Zelle gewichtet.",
    short: "Wie viele Formeleinheiten eine Zelle enthält, muss man auszählen.",
  },
  'chem-mis-io-cell-is-polyhedron': {
    detailed: "Das Koordinationspolyeder beschreibt nur die Umgebung eines einzelnen Ions: Man verbindet die Mittelpunkte seiner nächsten Nachbarn. Die Elementarzelle ist der Baustein des ganzen Gitters. Eine würfelförmige Zelle kann ganz verschiedene Polyeder enthalten.",
    short: "Polyeder: Umgebung eines Ions; Elementarzelle: Baustein des Gitters.",
  },
  'chem-mis-io-cn-count-all': {
    detailed: "Die Koordinationszahl zählt nur die nächsten Nachbarn eines Ions mit entgegengesetzter Ladung, also die Gegenionen im kleinsten vorkommenden Abstand. Weiter entfernte Ionen gehören nicht dazu, auch wenn sie in derselben Zelle liegen, und das Ion selbst zählt nie mit.",
    short: "Nur die nächsten Gegenionen zählen.",
  },
  'chem-mis-io-cn-same-charge': {
    detailed: "Die Koordinationszahl eines Ions zählt die direkt benachbarten Ionen mit entgegengesetzter Ladung; sie sind es, die das Ion anziehen. Gleich geladene Ionen stoßen sich ab und liegen weiter weg.",
    short: "Es zählen die nächsten Ionen mit entgegengesetzter Ladung.",
  },
  'chem-mis-io-cn-from-formula': {
    detailed: "Die Formel nennt nur das Zahlenverhältnis der Ionen im ganzen Kristall, die Ladung nur die Stärke der Anziehung. Wie viele Nachbarn ein Ion hat, hängt von der Anordnung im Gitter ab, vor allem vom Größenverhältnis der Ionen. Man muss die Nachbarn im Gitter abzählen.",
    short: "Die Koordinationszahl steht nicht in der Formel; man zählt sie im Gitter ab.",
  },
  'chem-mis-io-all-like-nacl': {
    detailed: "Salze vom Typ MX kristallisieren in verschiedenen Gittern, etwa im Kochsalz-, Caesiumchlorid- oder Zinkblende-Typ. Welches entsteht, hängt vor allem vom Größenverhältnis der Ionen ab. Auch Salze mit gleichem Gitter unterscheiden sich, zum Beispiel im Schmelzpunkt. Man muss das Gitter also ansehen, statt es vorauszusetzen.",
    short: "Salze vom Typ MX bilden verschiedene Gitter.",
  },
  'chem-mis-io-polyhedron-mixup': {
    detailed: "Jeder nächste Nachbar ist eine Ecke des Koordinationspolyeders. Ein Polyeder hat deshalb genau so viele Ecken, wie das Ion Nachbarn hat, und die Nachbarn liegen räumlich um das Ion herum, nicht in einer Ebene. Zähle die Nachbarn und vergleiche mit der Zahl der Ecken.",
    short: "Das Polyeder hat so viele Ecken, wie das Ion Nachbarn hat.",
  },
  'chem-mis-io-cn-size': {
    detailed: "Stell dir große Kugeln vor, die du um eine Kugel in der Mitte legst, ohne dass sie sich überlappen. Überlege, um welche mittlere Kugel mehr davon passen: um eine kleine oder um eine große.",
    short: "Wie viele Anionen Platz finden, hängt von der Größe des Kations ab.",
  },
  'chem-mis-io-cell-count-all': {
    detailed: "Ein Ion auf einer Ecke gehört zugleich zu acht Zellen, eines auf einer Kante zu vier, eines auf einer Fläche zu zwei; nur Ionen im Inneren gehören ganz zur Zelle. Zählt man alle voll, zählt man die geteilten mehrfach. Gewichte deshalb jedes Ion mit seinem Anteil.",
    short: "Ecke ein Achtel, Kante ein Viertel, Fläche die Hälfte, innen ganz.",
  },
  'chem-mis-io-cn-vs-units': {
    detailed: "Die Koordinationszahl zählt die Nachbarn eines einzelnen Ions. Die Zahl der Formeleinheiten sagt, wie viele Ionengruppen nach der Formel zur ganzen Zelle gehören. Das sind zwei verschiedene Fragen mit meist verschiedenen Antworten.",
    short: "Nachbarn eines Ions und Formeleinheiten einer Zelle sind zweierlei.",
  },
  'chem-mis-io-ion-is-unit': {
    detailed: String.raw`Eine Formeleinheit enthält so viele Ionen, wie die Formel angibt; bei $\ce{NaCl}$ sind das ein Kation und ein Anion zusammen. Man zählt also zuerst die Ionen jeder Sorte und fasst sie dann nach dem Verhältnis der Formel zusammen.`,
    short: "Eine Formeleinheit besteht aus allen Ionen der Formel zusammen.",
  },
  'chem-mis-io-dissolve-atoms': {
    detailed: "Die Ionen behalten beim Lösen und Schmelzen ihre Ladungen; kein Elektron wandert zurück. Ein Salz in seine Elemente zu zerlegen braucht eine chemische Reaktion mit viel Energie, etwa eine Elektrolyse. Aus gelöstem Kochsalz entstehen deshalb weder Natrium noch Chlor.",
    short: "Die Ionen behalten ihre Ladung; Elemente entstehen erst bei einer Elektrolyse.",
  },
  'chem-mis-io-dissolve-reacts': {
    detailed: "Beim Lösen werden die Ionen nur aus dem Gitter herausgelöst und von Wassermolekülen umhüllt; neue Stoffe entstehen nicht. Dampft man das Wasser ab, bekommt man das Salz unverändert zurück.",
    short: "Beim Lösen entsteht kein neuer Stoff; Eindampfen liefert das Salz zurück.",
  },
  'chem-mis-io-no-coefficients': {
    detailed: "Der Index in der Formel zählt, wie viele Ionen jeder Sorte in einer Formeleinheit stecken. Beim Zerfall werden aus diesen Indizes die Koeffizienten vor den Ionen. Probe: Die Ladungen auf der rechten Seite müssen sich zusammen aufheben.",
    short: "Der Index wird zum Koeffizienten; die Ladungen rechts heben sich auf.",
  },
  'chem-mis-io-index-in-ion': {
    detailed: "Einfache Ionen bestehen aus einem einzigen Atom; zwei Chlorid-Ionen sind zwei getrennte Teilchen, die sich im Wasser unabhängig bewegen. Der Index wird beim Zerfall zum Koeffizienten vor dem Ion. Nur Molekül-Ionen bestehen aus mehreren Atomen, und nur ihr eigener Index, etwa die 4 in Sulfat, bleibt im Ion.",
    short: "Der Index zählt getrennte Ionen und wird zum Koeffizienten.",
  },
  'chem-mis-io-melt-lattice-stays': {
    detailed: "Schmelzen heißt, die feste Ordnung geht verloren: Die Ionen bekommen so viel Bewegungsenergie, dass sie ihre Gitterplätze verlassen und aneinander vorbeigleiten. Ein erhaltenes Gitter wäre weiterhin fest.",
    short: "Beim Schmelzen verlassen die Ionen ihre Gitterplätze.",
  },
  'chem-mis-io-dissolve-is-melting': {
    detailed: "Zum Schmelzen braucht ein Salz sehr hohe Temperaturen; in Wasser löst es sich oft schon bei Raumtemperatur. Die beiden Vorgänge unterscheiden sich darin, woher die Energie zum Aufbrechen des Gitters kommt und was die Ionen danach umgibt.",
    short: "Schmelzen braucht Hitze, Lösen braucht Wasser; die Vorgänge sind verschieden.",
  },
  'chem-mis-io-water-orientation': {
    detailed: "Im Wassermolekül trägt das Sauerstoffatom eine negative, die Wasserstoffatome tragen positive Teilladungen. Entgegengesetzte Ladungen ziehen sich an, gleiche stoßen sich ab. Überlege daher, welche Seite des Moleküls zu einem positiven und welche zu einem negativen Ion zeigt.",
    short: "Entgegengesetzte Ladungen ziehen sich an; achte auf die Teilladungen im Wassermolekül.",
  },
  'chem-mis-io-water-nonpolar': {
    detailed: "Wasser ist ein Dipol: Das Sauerstoffatom zieht die Bindungselektronen stärker an und trägt eine negative Teilladung, die Wasserstoffatome tragen positive. Wegen der gewinkelten Gestalt fallen die Ladungsschwerpunkte nicht zusammen. Deshalb werden Wassermoleküle von Ionen angezogen und richten sich an ihnen aus.",
    short: "Wasser ist ein Dipol und richtet sich an Ionen aus.",
  },
  'chem-mis-io-dissolve-always-same': {
    detailed: "Ob eine Lösung warm oder kalt wird, hängt vom Salz ab: von der Gitterenergie, die das Lösen kostet, und von der Hydratationsenergie, die es freisetzt. Je nachdem, welche größer ist, wird Wärme frei oder aus der Umgebung aufgenommen. Es gibt Salze beider Art.",
    short: "Manche Salze wärmen beim Lösen, andere kühlen; es hängt von den Energien ab.",
  },
  'chem-mis-io-balance-reversed': {
    detailed: "Die Gitterenergie muss aufgebracht werden, um die Ionen aus dem Gitter zu lösen; die Hydratationsenergie wird frei, wenn Wasser die Ionen umhüllt. Wärme wird nur frei, wenn mehr Energie herauskommt, als hineingesteckt wird. Vergleiche also, welcher der beiden Beträge der größere ist.",
    short: "Wärme wird frei, wenn mehr Energie frei wird, als das Gitter kostet.",
  },
  'chem-mis-io-dissolve-no-energy': {
    detailed: "Auch ohne neuen Stoff ändert sich beim Lösen viel: Das Gitter bricht auf, und Wassermoleküle lagern sich an die Ionen an. Beides ist mit Energie verbunden, und die beiden Beträge heben sich fast nie genau auf.",
    short: "Gitter aufbrechen und Ionen umhüllen sind mit Energie verbunden.",
  },
  'chem-mis-io-exo-endo-mixup': {
    detailed: String.raw`Exotherm heißt: Der Vorgang gibt Energie als Wärme an die Umgebung ab, sie wird warm, $\Delta H < 0$. Endotherm heißt: Er nimmt Wärme aus der Umgebung auf, sie kühlt ab, $\Delta H > 0$. Merkhilfe: exo heißt hinaus, endo heißt hinein.`,
    short: "Exotherm gibt Wärme ab, endotherm nimmt Wärme auf.",
  },
  'chem-mis-io-lattice-is-force': {
    detailed: String.raw`Die Gitterenergie ist eine Energie mit der Einheit $\mathrm{kJ/mol}$, keine Kraft in Newton. Sie entsteht zwar aus der Anziehung zwischen den Ionen, ist aber selbst eine Energiemenge je Mol Salz.`,
    short: "Gitterenergie ist eine Energie in kJ/mol, keine Kraft.",
  },
  'chem-mis-io-lattice-sign': {
    detailed: "Kationen und Anionen ziehen sich an. Teilchen, die sich anziehen, auseinanderzuziehen kostet Energie, so wie man Energie braucht, um einen Stein hochzuheben. Rücken sie zusammen, läuft es umgekehrt.",
    short: "Sich anziehende Teilchen zu trennen kostet Energie.",
  },
  'chem-mis-io-lattice-mixup': {
    detailed: "Die Gitterenergie gehört zu genau einem Schritt: zwischen den einzelnen Ionen im Gaszustand und dem fertigen Kristall. Die Bildungsenthalpie geht dagegen von den Elementen aus und umfasst alle Schritte des Born-Haber-Kreisprozesses. Beim Schmelzen werden die Ionen nur beweglich, aber nicht in einzelne Gasteilchen getrennt.",
    short: "Gitterenergie: gasförmige Ionen und Kristall; Bildungsenthalpie: Elemente und Salz.",
  },
  'chem-mis-io-bh-real-path': {
    detailed: "Der Kreisprozess ist ein gedachter Umweg. Natrium und Chlor reagieren in Wirklichkeit direkt miteinander, ohne dass jemand das Natrium erst verdampft oder einzelne Ionen in den Gasraum bringt. Der Umweg ist ein Rechenhilfsmittel, kein Bericht darüber, was im Reaktionsgefäß geschieht.",
    short: "Der Kreisprozess ist ein gedachter Umweg zum Rechnen.",
  },
  'chem-mis-io-bh-path-dependent': {
    detailed: "Wäre die Energie auf zwei Wegen zwischen denselben Stoffen verschieden, könnte man auf dem einen Weg hin- und auf dem anderen zurückgehen und so Energie aus dem Nichts gewinnen. Das widerspricht der Energieerhaltung.",
    short: "Sonst ließe sich Energie aus dem Nichts gewinnen.",
  },
  'chem-mis-io-ionization-releases': {
    detailed: "Das Außenelektron wird vom positiv geladenen Kern angezogen. Um es abzulösen, muss man Energie aufwenden, die Ionisierungsenergie; sie ist immer positiv. Die Edelgaskonfiguration erklärt, welche Ladung ein Ion bevorzugt, nicht, dass seine Bildung Energie liefert.",
    short: "Ein Elektron abzulösen kostet immer Energie.",
  },
  'chem-mis-io-ea-compensates': {
    detailed: String.raw`Bei Natrium und Chlor kostet die Ionisierung rund $496\,\mathrm{kJ/mol}$, die Elektronenaffinität des Chlors bringt nur rund $349\,\mathrm{kJ/mol}$ zurück. Der Elektronenübergang allein kostet also Energie, dazu kommen Verdampfen und Spalten. Ohne einen weiteren, stark exothermen Schritt wäre die Bildung des Salzes endotherm.`,
    short: "Die Elektronenaffinität gleicht die Ionisierung nur zum Teil aus.",
  },
  'chem-mis-io-bh-full-bond': {
    detailed: String.raw`Ein Molekül $\ce{X2}$ liefert zwei Atome und damit zwei Anionen. Für eine Formeleinheit $\ce{MX}$ braucht man aber nur eines, also ein halbes Molekül. Deshalb geht nur die halbe Bindungsenergie in den Kreisprozess ein.`,
    short: String.raw`Für $\ce{MX}$ braucht man nur ein halbes $\ce{X2}$.`,
  },
  'chem-mis-io-bh-step-missing': {
    detailed: "Ionisieren und Elektronenaufnahme gelten für einzelne Atome im Gaszustand. Bevor man ein Metall ionisieren kann, muss es verdampft werden; bevor ein Nichtmetall ein Elektron aufnimmt, muss sein Molekül in Atome gespalten sein. Fehlt ein Schritt, stimmt die Bilanz nicht.",
    short: "Erst verdampfen und spalten, dann ionisieren und Elektronen anlagern.",
  },
  'chem-mis-io-neutral-no-force': {
    detailed: "Nach außen gleichen sich die Ladungen aus, aber im Inneren sitzt jedes Ion direkt neben Gegenionen, die es stark anziehen. Diese Anziehungen machen den Zusammenhalt des Kristalls aus; ohne sie wäre ein Salz nicht fest.",
    short: "Im Gitter ziehen sich benachbarte Ionen stark an, auch wenn das Salz neutral ist.",
  },
}
