import type { VectorErrorRule } from './errorRules.ts'

// Typische Fehler bei Geraden und Ebenen (M7 Schritt 6, Katalog in docs/PLAN-M7.md). Vorsilbe „gl-". Der Text nennt den
// Fehler und die Regel, verrät aber nicht das Ergebnis des Schritts.

export const LINE_ERROR_RULES: readonly VectorErrorRule[] = [
  // ---------------------------------------------------------------- Geraden
  {
    id: 'gl-support-swapped',
    name: 'Stützvektor und Richtungsvektor vertauscht',
    wrongFormula: String.raw`g\colon \vec x = \overrightarrow{AB} + t\,\vec a`,
    why: {
      detailed: String.raw`Vorn steht der **Stützvektor**: der Ortsvektor eines Punkts, der auf der Geraden liegt. Hinter dem Parameter steht der **Richtungsvektor**: der Pfeil, in dessen Richtung die Gerade läuft. Vertauscht beschreibt die Gleichung eine ganz andere Gerade.`,
      short: String.raw`Vorn ein Punkt der Geraden, hinter dem Parameter die Richtung.`,
    },
  },
  {
    id: 'gl-position-direction',
    name: 'Ortsvektor statt Richtungsvektor',
    wrongFormula: String.raw`g\colon \vec x = \vec a + t\,\vec b`,
    why: {
      detailed: String.raw`Der Ortsvektor eines Punkts zeigt vom Ursprung zum Punkt, nicht in Richtung der Geraden. Die Richtung ist der Pfeil **zwischen** zwei Punkten der Geraden (bzw. der Ebene): Spitze minus Fuß.`,
      short: String.raw`Richtung: Pfeil zwischen zwei Punkten, nicht der Ortsvektor.`,
    },
  },
  {
    id: 'gl-other-support',
    name: 'Stützpunkt der gegebenen Geraden genommen',
    wrongFormula: String.raw`g \parallel h,\; P \in g \;\Rightarrow\; g\colon \vec x = \vec q + t\,\vec w`,
    why: {
      detailed: String.raw`Die Richtung übernimmst du von der parallelen Geraden, den Stützpunkt aber nicht: Die neue Gerade muss durch den **gegebenen Punkt** gehen. Mit dem Stützpunkt der anderen Geraden schreibst du nur diese noch einmal auf.`,
      short: String.raw`Richtung von der parallelen Geraden, Stützpunkt ist der gegebene Punkt.`,
    },
  },
  {
    id: 'gl-support-as-direction',
    name: 'Stützvektor der anderen Geraden als Richtung',
    wrongFormula: String.raw`h\colon \vec x = \vec q + s\,\vec w \;\Rightarrow\; g\colon \vec x = \vec p + t\,\vec q`,
    why: {
      detailed: String.raw`Parallele Geraden haben denselben **Richtungsvektor**, das ist der Vektor hinter dem Parameter. Der Stützvektor vorn sagt nur, wo die Gerade liegt, nicht, wohin sie läuft.`,
      short: String.raw`Parallel heißt: gleicher Richtungsvektor (hinter dem Parameter).`,
    },
  },
  {
    id: 'gl-param-forgotten',
    name: 'Parameterwert nicht eingesetzt',
    wrongFormula: String.raw`t = 3:\; \vec p + \vec v`,
    why: {
      detailed: String.raw`Der Parameter sagt, wie oft du den Richtungsvektor anhängst. Für $t = 3$ also dreimal: Stützvektor plus $3$-mal Richtungsvektor. Ohne den Faktor landest du bei $t = 1$.`,
      short: String.raw`Stützvektor plus $t$-mal Richtungsvektor, den Faktor nicht vergessen.`,
    },
  },
  {
    id: 'gl-param-on-support',
    name: 'Parameter mal Stützvektor',
    wrongFormula: String.raw`t = 3:\; 3\vec p + \vec v`,
    why: {
      detailed: String.raw`Der Parameter steht nur vor dem **Richtungsvektor**: $\vec x = \vec p + t\,\vec v$. Der Stützvektor bleibt, wie er ist; er führt zum Startpunkt, von dort gehst du $t$-mal in Richtung $\vec v$.`,
      short: String.raw`Nur der Richtungsvektor wird mit $t$ malgenommen.`,
    },
  },
  {
    id: 'gl-solve-sign',
    name: 'Vorzeichen beim Auflösen nach dem Parameter',
    wrongFormula: String.raw`5 = 1 + 2t \;\Rightarrow\; t = \frac{5 + 1}{2}`,
    why: {
      detailed: String.raw`Bringst du die Zahl auf die andere Seite, ändert sich ihr Vorzeichen: aus $+1$ links wird $-1$ rechts. Erst danach teilst du durch den Faktor vor dem Parameter.`,
      short: String.raw`Zahl rüber mit umgedrehtem Vorzeichen, dann durch den Faktor teilen.`,
    },
  },
  {
    id: 'gl-solve-multiply',
    name: 'Mit dem Faktor malgenommen statt geteilt',
    wrongFormula: String.raw`2t = 4 \;\Rightarrow\; t = 4 \cdot 2`,
    why: {
      detailed: String.raw`Steht vor dem Parameter ein Faktor, wird er mit **Teilen** aufgehoben: aus $2t = 4$ folgt $t = \frac{4}{2}$. Malnehmen verdoppelt den Fehler statt ihn aufzuheben.`,
      short: String.raw`Faktor vor dem Parameter: durch ihn teilen.`,
    },
  },
  {
    id: 'gl-check-one',
    name: 'Nur eine Zeile geprüft',
    wrongFormula: String.raw`t = 2 \text{ aus der ersten Zeile} \;\Rightarrow\; P \in g`,
    why: {
      detailed: String.raw`Ein Punkt liegt nur dann auf der Geraden, wenn **ein und derselbe** Wert des Parameters alle Zeilen zugleich erfüllt. Rechne in jeder Zeile $t$ aus und vergleiche. Liefert eine Zeile einen anderen Wert, liegt der Punkt nicht drauf.`,
      short: String.raw`Jede Zeile muss denselben Parameterwert liefern.`,
    },
  },
  {
    id: 'gl-probe-misread',
    name: 'Ergebnis der Punktprobe falsch gedeutet',
    wrongFormula: String.raw`t = 2 \text{ in jeder Zeile} \;\Rightarrow\; P \notin g`,
    why: {
      detailed: String.raw`Punktprobe bei einer Geraden: Liefern alle Zeilen denselben Parameterwert, liegt der Punkt drauf. Bei einer Ebene in Koordinatenform: Ergibt das Einsetzen genau die Zahl rechts, liegt der Punkt drin, sonst nicht.`,
      short: String.raw`Gleicher Parameter in allen Zeilen bzw. gleiche Zahl rechts: Der Punkt liegt drauf.`,
    },
  },
  {
    id: 'gl-only-support',
    name: 'Nur der Stützpunkt zählt',
    wrongFormula: String.raw`P \ne \text{Stützpunkt} \;\Rightarrow\; P \notin g`,
    why: {
      detailed: String.raw`Auf einer Geraden liegen unendlich viele Punkte, für jeden Wert des Parameters einer. Der Stützpunkt ist nur der Punkt zu $t = 0$. Ob ein anderer Punkt drauf liegt, zeigt die Punktprobe.`,
      short: String.raw`Jeder Parameterwert gibt einen Punkt der Geraden, nicht nur $t = 0$.`,
    },
  },
  {
    id: 'gl-trace-wrong-coord',
    name: 'Falsche Koordinate gleich 0 gesetzt',
    wrongFormula: String.raw`S_{xy}:\; x = 0`,
    why: {
      detailed: String.raw`In der $x$-$y$-Ebene ist $z = 0$ (die Koordinate, die im Namen **fehlt**). Auf der $x$-Achse sind $y = 0$ und $z = 0$. Setz die passende Zeile der Geraden gleich $0$ und löse nach dem Parameter auf.`,
      short: String.raw`In der $x$-$y$-Ebene ist $z = 0$, auf der $x$-Achse $y = 0$ (und $z = 0$).`,
    },
  },
  {
    id: 'gl-distance-not-normed',
    name: 'Richtung nicht auf Länge 1 gebracht',
    wrongFormula: String.raw`\lvert \overrightarrow{PQ} \rvert = 6 \;\Rightarrow\; t = \pm 6`,
    why: {
      detailed: String.raw`Ein Schritt $t = 1$ ist so lang wie der Richtungsvektor, nicht $1$. Für den Abstand $L$ brauchst du darum $\lvert t \rvert \cdot \lvert \vec v \rvert = L$, also $t = \pm\frac{L}{\lvert \vec v \rvert}$.`,
      short: String.raw`$\lvert t \rvert \cdot \lvert \vec v \rvert = L$: durch die Länge der Richtung teilen.`,
    },
  },
  // ---------------------------------------------------------------- Ebenen
  {
    id: 'gl-d-sign',
    name: 'Vorzeichen der rechten Seite',
    wrongFormula: String.raw`\vec n \cdot (\vec x - \vec p) = 0 \;\Rightarrow\; \vec n \cdot \vec x = -\vec n \cdot \vec p`,
    why: {
      detailed: String.raw`Aus $\vec n \cdot (\vec x - \vec p) = 0$ wird $\vec n \cdot \vec x - \vec n \cdot \vec p = 0$. Bringst du $\vec n \cdot \vec p$ nach rechts, ändert es das Vorzeichen: $\vec n \cdot \vec x = \vec n \cdot \vec p$. Probe: Der Punkt $P$ muss die Gleichung erfüllen.`,
      short: String.raw`$d = \vec n \cdot \vec p$; Probe mit dem Punkt.`,
    },
  },
  {
    id: 'gl-normal-point-swapped',
    name: 'Normalenvektor und Punkt vertauscht',
    wrongFormula: String.raw`p_1 x + p_2 y + p_3 z = \vec n \cdot \vec p`,
    why: {
      detailed: String.raw`Vor $x$, $y$ und $z$ stehen die Einträge des **Normalenvektors**, denn er legt fest, wie die Ebene im Raum steht. Der Punkt kommt nur rechts ins Spiel: Eingesetzt liefert er die Zahl $d$.`,
      short: String.raw`Links die Einträge von $\vec n$, rechts $d = \vec n \cdot \vec p$.`,
    },
  },
  {
    id: 'gl-insert-no-coef',
    name: 'Zahlen vor x, y, z vergessen',
    wrongFormula: String.raw`2x - y + 3z \text{ bei } (1 \mid 2 \mid 4):\; 1 + 2 + 4`,
    why: {
      detailed: String.raw`Beim Einsetzen ersetzt jede Koordinate ihren Buchstaben, die Zahl davor bleibt stehen: $2x$ wird $2 \cdot x_P$. Nur die Koordinaten zu addieren lässt den Normalenvektor weg.`,
      short: String.raw`Einsetzen: $a \cdot x_P + b \cdot y_P + c \cdot z_P$.`,
    },
  },
  {
    id: 'gl-insert-swapped',
    name: 'Koordinaten an der falschen Stelle eingesetzt',
    wrongFormula: String.raw`2x - y + 3z \text{ bei } (1 \mid 2 \mid 4):\; 2 \cdot 2 - 4 + 3 \cdot 1`,
    why: {
      detailed: String.raw`Die erste Koordinate gehört zu $x$, die zweite zu $y$, die dritte zu $z$. Schreib dir die Zuordnung hin, bevor du einsetzt.`,
      short: String.raw`Erste Koordinate für $x$, zweite für $y$, dritte für $z$.`,
    },
  },
  {
    id: 'gl-direction-as-normal',
    name: 'Richtungsvektor als Normalenvektor',
    wrongFormula: String.raw`\vec x = \vec p + r\,\vec u + s\,\vec v \;\Rightarrow\; \vec n = \vec u`,
    why: {
      detailed: String.raw`Die Richtungsvektoren liegen **in** der Ebene, der Normalenvektor steht **senkrecht** auf ihr. Ihn bekommst du aus beiden Richtungen mit dem Kreuzprodukt $\vec u \times \vec v$.`,
      short: String.raw`Normale senkrecht auf beiden Richtungen: $\vec n = \vec u \times \vec v$.`,
    },
  },
  {
    id: 'gl-same-direction',
    name: 'Zweimal dieselbe Richtung',
    wrongFormula: String.raw`\vec x = \vec a + r\,\overrightarrow{AB} + s\,\overrightarrow{BA}`,
    why: {
      detailed: String.raw`$\overrightarrow{AB}$ und $\overrightarrow{BA}$ sind parallel, sie zeigen nur entgegengesetzt. Zwei parallele Richtungen spannen keine Ebene auf, nur eine Gerade. Nimm zwei Pfeile, die nicht parallel sind, z. B. $\overrightarrow{AB}$ und $\overrightarrow{AC}$.`,
      short: String.raw`Die Richtungen einer Ebene dürfen nicht parallel sein.`,
    },
  },
  {
    id: 'gl-coord-param-sign',
    name: 'Vorzeichen beim Auflösen nach einer Koordinate',
    wrongFormula: String.raw`2x - y + z = 4 \;\Rightarrow\; z = 4 + 2x - y`,
    why: {
      detailed: String.raw`Bringst du die anderen Glieder nach rechts, ändert jedes sein Vorzeichen: aus $2x$ links wird $-2x$ rechts. Probe: Setz einen Punkt der Parameterform in die Koordinatenform ein.`,
      short: String.raw`Glieder auf die andere Seite: Vorzeichen drehen.`,
    },
  },
  {
    id: 'gl-coord-param-support',
    name: 'Stützvektor vergessen',
    wrongFormula: String.raw`z = 4 - 2x + y \;\Rightarrow\; \vec x = r\,\vec u + s\,\vec v`,
    why: {
      detailed: String.raw`Die Zahl, die beim Auflösen allein stehen bleibt, gehört in den **Stützvektor**. Ohne ihn geht die Ebene durch den Ursprung, und das stimmt nur, wenn rechts in der Koordinatenform $0$ steht.`,
      short: String.raw`Die Zahl ohne Parameter bildet den Stützvektor.`,
    },
  },
  {
    id: 'gl-normal-as-direction',
    name: 'Normalenvektor als Richtung',
    wrongFormula: String.raw`ax + by + cz = d \;\Rightarrow\; \vec x = \vec p + r \begin{pmatrix} a \\ b \\ c \end{pmatrix} + \ldots`,
    why: {
      detailed: String.raw`Die Zahlen vor $x$, $y$, $z$ bilden den Normalenvektor, er steht **senkrecht** auf der Ebene. Als Richtung taugt er nicht: Richtungen liegen in der Ebene, ihr Skalarprodukt mit $\vec n$ ist $0$.`,
      short: String.raw`Richtungen liegen in der Ebene: $\vec u \cdot \vec n = 0$.`,
    },
  },
  {
    id: 'gl-intercept-reciprocal',
    name: 'Achsenabschnitte als Zahlen vor x, y, z',
    wrongFormula: String.raw`S_x(2 \mid 0 \mid 0), \ldots \;\Rightarrow\; 2x + \ldots = 1`,
    why: {
      detailed: String.raw`In der Achsenabschnittsform stehen die Schnittstellen im **Nenner**: $\frac{x}{a} + \frac{y}{b} + \frac{z}{c} = 1$. Probe: $S_x(a \mid 0 \mid 0)$ eingesetzt gibt $\frac{a}{a} = 1$.`,
      short: String.raw`$\frac{x}{a} + \frac{y}{b} + \frac{z}{c} = 1$, die Schnittstellen im Nenner.`,
    },
  },
  {
    id: 'gl-intercept-rhs',
    name: 'Rechte Seite nicht mit malgenommen',
    wrongFormula: String.raw`\frac{x}{2} + \frac{y}{3} + \frac{z}{6} = 1 \;\Rightarrow\; 3x + 2y + z = 1`,
    why: {
      detailed: String.raw`Malnehmen mit dem Hauptnenner gilt für **beide** Seiten. Links fallen die Brüche weg, rechts wird aus der $1$ der Hauptnenner.`,
      short: String.raw`Beide Seiten mit dem Hauptnenner malnehmen.`,
    },
  },
  {
    id: 'gl-hesse-not-normed',
    name: 'Nicht normiert',
    wrongFormula: String.raw`2x - y + 2z = 6 \text{ als Hessesche Normalform}`,
    why: {
      detailed: String.raw`In der Hesseschen Normalform hat der Normalenvektor die Länge $1$. Teile darum die ganze Gleichung durch $\lvert \vec n \rvert$. Erst dann steht rechts der Abstand der Ebene vom Ursprung.`,
      short: String.raw`Durch $\lvert \vec n \rvert$ teilen, damit die Normale Länge $1$ hat.`,
    },
  },
  {
    id: 'gl-hesse-d-sign',
    name: 'Rechte Seite negativ gelassen',
    wrongFormula: String.raw`\frac{1}{3}(2x - y + 2z) = -2`,
    why: {
      detailed: String.raw`In der Hesseschen Normalform steht rechts eine Zahl $\ge 0$, der Abstand vom Ursprung. Ist sie negativ, multiplizierst du die ganze Gleichung mit $-1$; der Normalenvektor zeigt dann in die andere Richtung.`,
      short: String.raw`Rechts muss $d \ge 0$ stehen, sonst mal $-1$.`,
    },
  },
  {
    id: 'gl-hesse-square',
    name: 'Durch das Quadrat der Länge geteilt',
    wrongFormula: String.raw`\frac{1}{\lvert \vec n \rvert^2}(\vec n \cdot \vec x) = \frac{d}{\lvert \vec n \rvert^2}`,
    why: {
      detailed: String.raw`Normieren heißt durch die Länge $\lvert \vec n \rvert = \sqrt{n_1^2 + n_2^2 + n_3^2}$ teilen, nicht durch die Summe der Quadrate. Sonst hat der Normalenvektor nicht die Länge $1$.`,
      short: String.raw`Durch $\lvert \vec n \rvert$ teilen, nicht durch $\lvert \vec n \rvert^2$.`,
    },
  },
  {
    id: 'gl-hesse-only-lhs',
    name: 'Nur die linke Seite geteilt',
    wrongFormula: String.raw`\frac{1}{3}(2x - y + 2z) = 6`,
    why: {
      detailed: String.raw`Eine Gleichung bleibt nur richtig, wenn du **beide** Seiten durch dieselbe Zahl teilst. Teilst du nur links, beschreibt sie eine andere Ebene.`,
      short: String.raw`Beide Seiten durch $\lvert \vec n \rvert$ teilen.`,
    },
  },
  {
    id: 'gl-trace-flipped',
    name: 'Bruch umgedreht',
    wrongFormula: String.raw`2x = 6 \;\Rightarrow\; x = \frac{2}{6}`,
    why: {
      detailed: String.raw`Aus $a\,x = d$ folgt $x = \frac{d}{a}$: Die Zahl rechts kommt in den Zähler, der Faktor vor $x$ in den Nenner.`,
      short: String.raw`$a\,x = d \;\Rightarrow\; x = \frac{d}{a}$.`,
    },
  },
  {
    id: 'gl-trace-no-divide',
    name: 'Nicht durch den Faktor geteilt',
    wrongFormula: String.raw`2x = 6 \;\Rightarrow\; x = 6`,
    why: {
      detailed: String.raw`Auf der Achse bleibt nur ein Glied übrig, z. B. $2x = 6$. Damit $x$ allein steht, teilst du noch durch den Faktor davor.`,
      short: String.raw`Zum Schluss durch den Faktor vor der Koordinate teilen.`,
    },
  },
  {
    id: 'gl-trace-sign',
    name: 'Vorzeichen beim Spurpunkt',
    wrongFormula: String.raw`2x = 6 \;\Rightarrow\; x = -3`,
    why: {
      detailed: String.raw`Aus $a\,x = d$ folgt $x = \frac{d}{a}$, mit den Vorzeichen von $d$ **und** $a$: Sind beide positiv oder beide negativ, ist $x$ positiv, sonst negativ. Probe: Setz den Punkt in die Gleichung ein, links muss genau $d$ herauskommen.`,
      short: String.raw`$x = \frac{d}{a}$ mit beiden Vorzeichen; Probe durch Einsetzen.`,
    },
  },
  {
    id: 'gl-trace-axis',
    name: 'Auf der falschen Achse eingetragen',
    wrongFormula: String.raw`x = 3 \;\Rightarrow\; S_x(0 \mid 3 \mid 0)`,
    why: {
      detailed: String.raw`Der Spurpunkt auf der $x$-Achse hat die Form $S_x(\,\cdot \mid 0 \mid 0)$: Nur die erste Koordinate ist ungleich $0$. Der Wert, den du für $x$ ausgerechnet hast, gehört an diese Stelle.`,
      short: String.raw`Auf der $x$-Achse: $S_x(x \mid 0 \mid 0)$.`,
    },
  },
  {
    id: 'gl-probe-zero',
    name: 'Mit 0 statt der rechten Seite verglichen',
    wrongFormula: String.raw`2x - y + 3z = 7:\; \text{Einsetzen ergibt } 7 \ne 0 \;\Rightarrow\; P \notin E`,
    why: {
      detailed: String.raw`Ein Punkt liegt in der Ebene, wenn er die **ganze Gleichung** erfüllt: Eingesetzt muss links genau das herauskommen, was rechts steht. Mit $0$ vergleichst du nur, wenn rechts $0$ steht.`,
      short: String.raw`Eingesetzt mit der rechten Seite vergleichen, nicht mit $0$.`,
    },
  },
]
