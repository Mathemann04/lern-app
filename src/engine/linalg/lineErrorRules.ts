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
  // ---------------------------------------------------------------- Lage (Schritt 7a)
  {
    id: 'gl-same-param',
    name: 'Gleicher Parameter für beide Geraden',
    wrongFormula: String.raw`\vec p + t\,\vec v = \vec q + t\,\vec w`,
    why: {
      detailed: String.raw`Jede Gerade hat ihren **eigenen** Parameter. Der Schnittpunkt kann auf $g$ zu einem ganz anderen Wert gehören als auf $h$. Mit demselben Buchstaben für beide verlangst du, dass beide Geraden gleichzeitig beim selben Wert dort sind, und übersiehst Schnittpunkte. Nimm $t$ für die eine und $s$ für die andere Gerade.`,
      short: String.raw`Zwei Geraden, zwei verschiedene Parameter: $t$ und $s$.`,
    },
  },
  {
    id: 'gl-move-sign',
    name: 'Beim Herüberbringen das Vorzeichen nicht gedreht',
    wrongFormula: String.raw`2 + 3t = 1 + s \;\Rightarrow\; 3t + s = 1 + 2`,
    why: {
      detailed: String.raw`Was du auf die andere Seite der Gleichung bringst, wechselt das Vorzeichen: Aus $+2$ links wird $-2$ rechts, aus $+s$ rechts wird $-s$ links. Das gilt für Zahlen genauso wie für Glieder mit einem Parameter.`,
      short: String.raw`Auf die andere Seite: Vorzeichen umdrehen, auch bei Gliedern mit Parameter.`,
    },
  },
  {
    id: 'gl-pos-dirs',
    name: 'Richtungen bzw. Normalen nicht verglichen',
    wrongFormula: String.raw`\vec v \nparallel \vec w \;\Rightarrow\; \text{parallel}`,
    why: {
      detailed: String.raw`Bei der Lage entscheiden zuerst die **Richtungen** (bei Ebenen die **Normalenvektoren**): Sind sie parallel, können die Geraden bzw. Ebenen nur parallel oder gleich sein. Sind sie nicht parallel, schneiden sich die Ebenen in einer Geraden, und Geraden schneiden sich oder sind windschief. Stützpunkte und rechte Seiten kommen erst danach.`,
      short: String.raw`Erst Richtungen bzw. Normalen vergleichen, dann den Rest.`,
    },
  },
  {
    id: 'gl-pos-same-parallel',
    name: 'Identisch und echt parallel verwechselt',
    wrongFormula: String.raw`\vec v \parallel \vec w \;\Rightarrow\; \text{immer identisch}`,
    why: {
      detailed: String.raw`Parallele Richtungen allein sagen noch nicht, ob es dieselbe Gerade ist. Prüfe, ob der Stützpunkt der einen Geraden auf der anderen liegt: ja heißt identisch, nein heißt echt parallel.`,
      short: String.raw`Bei parallelen Richtungen entscheidet die Punktprobe.`,
    },
  },
  {
    id: 'gl-pos-skew-hasty',
    name: 'Nicht parallel heißt nicht windschief',
    wrongFormula: String.raw`\vec v \nparallel \vec w \;\Rightarrow\; \text{windschief}`,
    why: {
      detailed: String.raw`Sind die Richtungen nicht parallel, gibt es zwei Möglichkeiten: Die Geraden schneiden sich, oder sie sind windschief. Das entscheidet erst das Gleichungssystem mit $t$ und $s$: Hat es eine Lösung, schneiden sie sich. In der Ebene gibt es kein windschief, dort schneiden sich nicht parallele Geraden immer.`,
      short: String.raw`Nicht parallel: Das Gleichungssystem entscheidet zwischen Schnittpunkt und windschief.`,
    },
  },
  {
    id: 'gl-pos-third-row',
    name: 'Dritte Gleichung nicht geprüft',
    wrongFormula: String.raw`\text{(I), (II)} \Rightarrow t, s \;\Rightarrow\; \text{Schnittpunkt}`,
    why: {
      detailed: String.raw`Im Raum hat das Gleichungssystem drei Gleichungen, aber nur zwei Unbekannte. Aus zwei Gleichungen bekommst du $t$ und $s$. Erst wenn diese Werte auch die **dritte** Gleichung erfüllen, haben die Geraden einen gemeinsamen Punkt; sonst sind sie windschief.`,
      short: String.raw`Die gefundenen $t$ und $s$ in die dritte Gleichung einsetzen.`,
    },
  },
  {
    id: 'gl-parallel-missed',
    name: 'Vielfaches nicht erkannt',
    wrongFormula: String.raw`\begin{pmatrix} 2 \\ -1 \end{pmatrix},\; \begin{pmatrix} -4 \\ 2 \end{pmatrix} \;\Rightarrow\; \text{nicht parallel}`,
    why: {
      detailed: String.raw`Parallel heißt nicht „gleiche Einträge“, sondern: Der eine Vektor ist ein Vielfaches des anderen, auch mit negativem Faktor oder einem Bruch. Teile in jeder Zeile den Eintrag des einen durch den des anderen. Kommt überall dieselbe Zahl heraus, sind sie parallel.`,
      short: String.raw`In jeder Zeile den Faktor ausrechnen; überall gleich heißt parallel.`,
    },
  },
  {
    id: 'gl-dir-one-row',
    name: 'Vielfaches nur in einer Zeile geprüft',
    wrongFormula: String.raw`\begin{pmatrix} 1 \\ 2 \\ 3 \end{pmatrix},\; \begin{pmatrix} 2 \\ 4 \\ 5 \end{pmatrix}:\; k = 2 \text{ (nur } x\text{)}`,
    why: {
      detailed: String.raw`Ein Faktor aus einer einzigen Zeile passt immer. Parallel sind die Vektoren erst, wenn **derselbe** Faktor in jeder Zeile stimmt. Prüfe ihn deshalb in allen Zeilen.`,
      short: String.raw`Den Faktor in jeder Zeile prüfen, nicht nur in einer.`,
    },
  },
  {
    id: 'gl-meet-wrong-line',
    name: 'Parameter in die falsche Gerade eingesetzt',
    wrongFormula: String.raw`t \text{ von } g \text{ in } h\colon \vec q + t\,\vec w`,
    why: {
      detailed: String.raw`Aus dem Gleichungssystem kommen zwei Werte: $t$ gehört zu der Geraden, die mit $t$ geschrieben ist, $s$ zu der mit $s$. Setzt du einen Wert in die andere Gerade ein, landest du an einem Punkt, der mit dem Schnittpunkt nichts zu tun hat. Probe: Beide Geraden müssen mit ihrem eigenen Wert denselben Punkt liefern.`,
      short: String.raw`$t$ in die Gerade mit $t$, $s$ in die mit $s$.`,
    },
  },
  {
    id: 'gl-insert-dirs-only',
    name: 'Stützvektor beim Einsetzen vergessen',
    wrongFormula: String.raw`2x - y + z = 4,\; \vec x = \vec p + t\,\vec v \;\Rightarrow\; \vec n \cdot \vec v\, t = 4`,
    why: {
      detailed: String.raw`Jede Zeile der Parameterform besteht aus dem Eintrag des Stützvektors **plus** dem Glied mit dem Parameter, z. B. $x = 1 + 3t$. Beim Einsetzen kommt beides in die Klammer. Lässt du den Stützvektor weg, setzt du eine Gerade bzw. Ebene durch den Ursprung ein, nicht die gegebene.`,
      short: String.raw`Ganze Zeile einsetzen: Stützvektor plus Parameter mal Richtung.`,
    },
  },
  {
    id: 'gl-lp-zero-equation',
    name: 'Liegt in der Ebene und parallel verwechselt',
    wrongFormula: String.raw`0 \cdot t + 3 = 3 \;\Rightarrow\; \text{keine Lösung}`,
    why: {
      detailed: String.raw`Fällt der Parameter weg, bleibt eine Gleichung ohne Unbekannte. Stimmt sie (wie $3 = 3$), erfüllt **jeder** Wert sie: Jeder Punkt der Geraden liegt in der Ebene. Ist sie falsch (wie $3 = 5$), erfüllt **kein** Wert sie: Die Gerade ist parallel zur Ebene. Genauso bei der Punktprobe: Liegt ein Punkt der Geraden in der Ebene, liegt die ganze Gerade drin.`,
      short: String.raw`Wahre Aussage: liegt drin; falsche Aussage: parallel.`,
    },
  },
  {
    id: 'gl-lp-normal',
    name: 'Richtung und Normale falsch gedeutet',
    wrongFormula: String.raw`\vec n \cdot \vec v = 0 \;\Rightarrow\; g \perp E`,
    why: {
      detailed: String.raw`Der Faktor vor dem Parameter nach dem Einsetzen ist $\vec n \cdot \vec v$. Ist er $0$, steht die Richtung senkrecht auf der **Normalen**, also läuft die Gerade parallel zur Ebene (oder liegt in ihr). Ist er nicht $0$, hat die Gleichung genau eine Lösung: Die Gerade durchstößt die Ebene in einem Punkt.`,
      short: String.raw`$\vec n \cdot \vec v = 0$: parallel oder drin; sonst genau ein Durchstoßpunkt.`,
    },
  },
  {
    id: 'gl-pp-rhs',
    name: 'Rechte Seite nicht verglichen',
    wrongFormula: String.raw`x + 2y = 3,\; 2x + 4y = 6 \;\Rightarrow\; \text{nur parallel}`,
    why: {
      detailed: String.raw`Sind die Normalenvektoren parallel, ist die linke Seite der einen Gleichung ein Vielfaches der anderen. Ob die Ebenen gleich oder nur parallel sind, entscheidet die rechte Seite: Geht sie mit **demselben Faktor** mit, ist es dieselbe Ebene, sonst sind die Ebenen echt parallel.`,
      short: String.raw`Gleich, wenn auch die rechte Seite mit demselben Faktor mitgeht.`,
    },
  },
  {
    id: 'gl-free-dropped',
    name: 'Frei gewählte Variable weggelassen',
    wrongFormula: String.raw`z = t \;\Rightarrow\; x + y = 3 \text{ (ohne } t\text{)}`,
    why: {
      detailed: String.raw`Setzt du eine Variable gleich $t$, bleibt $t$ in beiden Gleichungen stehen und kommt nach rechts. Lässt du es weg, rechnest du mit $z = 0$ und bekommst nur einen einzigen Punkt statt der ganzen Schnittgeraden.`,
      short: String.raw`$t$ bleibt stehen und wandert mit umgedrehtem Vorzeichen nach rechts.`,
    },
  },
  {
    id: 'gl-free-row',
    name: 'Zeile der frei gewählten Variable vergessen',
    wrongFormula: String.raw`x = 1 + 2t,\; y = 3 - t,\; z = t \;\Rightarrow\; \vec v = \begin{pmatrix} 2 \\ -1 \\ 0 \end{pmatrix}`,
    why: {
      detailed: String.raw`Auch die frei gewählte Variable gehört in die Parameterform: Aus $z = t$ wird die Zeile $z = 0 + 1 \cdot t$. Im Stützvektor steht dort eine $0$, im Richtungsvektor eine $1$.`,
      short: String.raw`$z = t$ heißt: Stützvektor $0$, Richtung $1$ in dieser Zeile.`,
    },
  },
  {
    id: 'gl-relation-partial',
    name: 'Beim Einsetzen nur einen Teil berücksichtigt',
    wrongFormula: String.raw`s = 2 - r \;\Rightarrow\; \vec x = \vec p + r\,(\vec u - \vec w)`,
    why: {
      detailed: String.raw`Setzt du $s = \alpha + \beta r$ in $\vec p + r\,\vec u + s\,\vec w$ ein, entstehen zwei Teile: $\alpha\,\vec w$ ohne $r$ gehört zum Stützvektor, $\beta r\,\vec w$ zur Richtung. Beides muss in die neue Gleichung: Stützvektor $\vec p + \alpha\,\vec w$, Richtung $\vec u + \beta\,\vec w$.`,
      short: String.raw`$\alpha\,\vec w$ zum Stützvektor, $\beta\,\vec w$ zur Richtung.`,
    },
  },
  {
    id: 'gl-normal-factor',
    name: 'Gleiche Einträge statt Vielfaches',
    wrongFormula: String.raw`\begin{pmatrix} 2 \\ 1 \\ -1 \end{pmatrix} \parallel \begin{pmatrix} 4 \\ a \\ -2 \end{pmatrix} \;\Rightarrow\; a = 1`,
    why: {
      detailed: String.raw`Parallele Normalenvektoren müssen nicht gleich sein, nur Vielfache voneinander. Bestimme den Faktor $k$ aus einer Zeile ohne Parameter; derselbe Faktor gilt in der Zeile mit dem Parameter.`,
      short: String.raw`Erst den Faktor $k$ bestimmen, dann gilt er in jeder Zeile.`,
    },
  },
  // ---------------------------------------------------------------- Abstände und Schnittwinkel (Schritt 7b)
  {
    id: 'gl-dist-abs',
    name: 'Betrag vergessen: Abstand negativ',
    wrongFormula: String.raw`d = \frac{\vec n \cdot \vec p - d_0}{\lvert \vec n \rvert} = -2`,
    why: {
      detailed: String.raw`Ein Abstand ist eine Länge und nie negativ. Das Vorzeichen von $\vec n \cdot \vec p - d$ sagt nur, auf welcher Seite der Ebene der Punkt liegt (auf der Seite, in die $\vec n$ zeigt, oder auf der anderen). Für den Abstand nimmst du deshalb den **Betrag**.`,
      short: String.raw`Abstand $= \frac{\lvert \ldots \rvert}{\lvert \vec n \rvert}$: immer mit Betrag.`,
    },
  },
  {
    id: 'gl-dist-rhs',
    name: 'Rechte Seite nicht abgezogen',
    wrongFormula: String.raw`E\colon 2x - y + 2z = 6 \;\Rightarrow\; d = \frac{\lvert 2p_1 - p_2 + 2p_3 \rvert}{3}`,
    why: {
      detailed: String.raw`In die Abstandsformel kommt die ganze Gleichung mit allem auf einer Seite: $\vec n \cdot \vec p - d$. Lässt du die rechte Seite weg, rechnest du den Abstand zu einer **anderen**, parallelen Ebene durch den Ursprung.`,
      short: String.raw`Erst alles auf eine Seite bringen: $\vec n \cdot \vec p - d$.`,
    },
  },
  {
    id: 'gl-dist-one-case',
    name: 'Beim Betrag nur einen Fall gerechnet',
    wrongFormula: String.raw`\lvert 2a - 1 \rvert = 6 \;\Rightarrow\; 2a - 1 = 6`,
    why: {
      detailed: String.raw`$\lvert u \rvert = c$ mit $c > 0$ hat zwei Lösungen: $u = c$ und $u = -c$. Beim Abstand heißt das: Auf **jeder Seite** der Ebene gibt es einen Punkt mit diesem Abstand. Rechne beide Fälle.`,
      short: String.raw`$\lvert u \rvert = c$: $u = c$ oder $u = -c$, zwei Fälle.`,
    },
  },
  {
    id: 'gl-foot-position',
    name: 'Ortsvektor statt Verbindungsvektor',
    wrongFormula: String.raw`\overrightarrow{PF_t} = \vec p + t\,\vec v`,
    why: {
      detailed: String.raw`$\vec p + t\,\vec v$ ist der **Ortsvektor** von $F_t$: der Pfeil vom Ursprung. Gesucht ist der Pfeil von $P$ nach $F_t$, also Spitze minus Fuß: $\vec p + t\,\vec v - \overrightarrow{OP}$. Nur dieser Pfeil muss im Lotfußpunkt senkrecht auf der Geraden stehen.`,
      short: String.raw`Von $P$ nach $F_t$: $F_t$ minus $P$.`,
    },
  },
  {
    id: 'gl-foot-support',
    name: 'Mit dem Stützvektor statt der Richtung malgenommen',
    wrongFormula: String.raw`\overrightarrow{PF_t} \cdot \vec p = 0`,
    why: {
      detailed: String.raw`Das Lot steht senkrecht auf der **Geraden**, also auf ihrem Richtungsvektor $\vec v$ (dem Vektor hinter dem Parameter). Der Stützvektor $\vec p$ zeigt vom Ursprung zur Geraden und hat mit ihrer Richtung nichts zu tun.`,
      short: String.raw`Bedingung: $\overrightarrow{PF_t} \cdot \vec v = 0$ mit der Richtung $\vec v$.`,
    },
  },
  {
    id: 'gl-foot-origin',
    name: 'Abstand vom Ursprung statt vom Punkt',
    wrongFormula: String.raw`d = \lvert \overrightarrow{OF} \rvert`,
    why: {
      detailed: String.raw`Der Abstand ist die Länge der Strecke vom Punkt $P$ zum Lotfußpunkt $F$, also $\lvert \overrightarrow{PF} \rvert$ mit $\overrightarrow{PF} = F - P$. Die Länge des Ortsvektors von $F$ ist nur der Abstand von $F$ zum Ursprung.`,
      short: String.raw`$d = \lvert \overrightarrow{PF} \rvert$, nicht $\lvert \overrightarrow{OF} \rvert$.`,
    },
  },
  {
    id: 'gl-mirror-foot',
    name: 'Lotfußpunkt statt Spiegelpunkt',
    wrongFormula: String.raw`P' = F`,
    why: {
      detailed: String.raw`Der Lotfußpunkt $F$ liegt genau in der **Mitte** zwischen $P$ und seinem Spiegelpunkt $P'$. Von $P$ aus gehst du den Weg $\overrightarrow{PF}$ also **zweimal**: $\overrightarrow{OP'} = \overrightarrow{OP} + 2\,\overrightarrow{PF}$.`,
      short: String.raw`$P' = P + 2\,\overrightarrow{PF}$: doppelt so weit wie bis $F$.`,
    },
  },
  {
    id: 'gl-mirror-side',
    name: 'Spiegelpunkt in die falsche Richtung abgetragen',
    wrongFormula: String.raw`\overrightarrow{OP'} = \overrightarrow{OP} - 2\,\overrightarrow{PF}`,
    why: {
      detailed: String.raw`Der Spiegelpunkt liegt auf der **anderen** Seite, hinter dem Lotfußpunkt. Du gehst von $P$ aus in Richtung $F$ weiter: $+2\,\overrightarrow{PF}$. Mit $-2\,\overrightarrow{PF}$ entfernst du dich von der Ebene bzw. Geraden.`,
      short: String.raw`Von $P$ aus Richtung $F$ weiter: $+2\,\overrightarrow{PF}$.`,
    },
  },
  {
    id: 'gl-skew-points',
    name: 'Abstand der Stützpunkte statt der Geraden',
    wrongFormula: String.raw`d(g, h) = \lvert \overrightarrow{PQ} \rvert`,
    why: {
      detailed: String.raw`Die Stützpunkte sind irgendwelche Punkte der Geraden, ihre Verbindung ist meist schräg. Der Abstand ist die **kürzeste** Verbindung, die auf beiden Geraden senkrecht steht, also in Richtung $\vec n = \vec v \times \vec w$. Deshalb zählt nur der Anteil von $\overrightarrow{PQ}$ in dieser Richtung: $\frac{\lvert \overrightarrow{PQ} \cdot \vec n \rvert}{\lvert \vec n \rvert}$.`,
      short: String.raw`Nur der Anteil in Richtung $\vec v \times \vec w$ zählt.`,
    },
  },
  {
    id: 'gl-planes-not-scaled',
    name: 'Rechte Seiten verglichen, ohne die Normalen gleich zu machen',
    wrongFormula: String.raw`E\colon \vec n \cdot \vec x = 3,\; F\colon 2\vec n \cdot \vec x = 10 \;\Rightarrow\; d = \frac{\lvert 10 - 3 \rvert}{\lvert \vec n \rvert}`,
    why: {
      detailed: String.raw`Die rechten Seiten darfst du nur vergleichen, wenn links **derselbe** Normalenvektor steht. Hier ist der von $F$ ein Vielfaches: Teil erst die Gleichung von $F$ durch den Faktor, oder setz einen Punkt von $F$ in die Gleichung von $E$ ein.`,
      short: String.raw`Erst die Normalen gleich machen, oder einen Punkt einsetzen.`,
    },
  },
  {
    id: 'gl-angle-abs',
    name: 'Betrag vergessen: Schnittwinkel stumpf',
    wrongFormula: String.raw`\cos\varphi = \frac{\vec v \cdot \vec w}{\lvert \vec v \rvert \, \lvert \vec w \rvert} = -\frac{1}{2} \;\Rightarrow\; \varphi = 120^\circ`,
    why: {
      detailed: String.raw`Zwei Geraden (oder Ebenen) bilden zwei Winkel, die sich zu $180^\circ$ ergänzen. Als **Schnittwinkel** gilt der spitze, höchstens $90^\circ$. Deshalb steht in der Formel der Betrag des Skalarprodukts: Dreht man eine Richtung um, ändert sich nur das Vorzeichen, nicht der Schnittwinkel.`,
      short: String.raw`Schnittwinkel liegen zwischen $0^\circ$ und $90^\circ$: Betrag nehmen.`,
    },
  },
  {
    id: 'gl-angle-plane-cos',
    name: 'Gerade und Ebene: cos statt sin',
    wrongFormula: String.raw`\cos\varphi = \frac{\lvert \vec n \cdot \vec v \rvert}{\lvert \vec n \rvert \, \lvert \vec v \rvert}`,
    why: {
      detailed: String.raw`Mit $\vec n$ und $\vec v$ rechnest du den Winkel zwischen der Geraden und der **Normalen**. Die Normale steht senkrecht auf der Ebene, deshalb ergänzen sich dieser Winkel und der gesuchte zu $90^\circ$. Aus $\cos(90^\circ - \varphi) = \sin\varphi$ folgt: Bei Gerade und Ebene steht $\sin\varphi$ in der Formel.`,
      short: String.raw`Gerade und Ebene: $\sin\varphi = \frac{\lvert \vec n \cdot \vec v \rvert}{\lvert \vec n \rvert \, \lvert \vec v \rvert}$.`,
    },
  },
  {
    id: 'gl-angle-support',
    name: 'Stützvektor statt Richtungsvektor',
    wrongFormula: String.raw`\cos\varphi = \frac{\lvert \vec p \cdot \vec q \rvert}{\lvert \vec p \rvert \, \lvert \vec q \rvert}`,
    why: {
      detailed: String.raw`Der Winkel hängt nur davon ab, **wohin** die Geraden laufen, also von den Richtungsvektoren hinter den Parametern. Die Stützvektoren führen vom Ursprung zu einem Punkt der Geraden; verschiebst du eine Gerade, ändern sie sich, der Winkel aber nicht.`,
      short: String.raw`Für Winkel nur die Richtungsvektoren (bzw. Normalen) nehmen.`,
    },
  },
  {
    id: 'gl-angle-plane-dirs',
    name: 'Richtung der Ebene statt Normalenvektor',
    wrongFormula: String.raw`\sin\varphi = \frac{\lvert \vec u \cdot \vec v \rvert}{\lvert \vec u \rvert \, \lvert \vec v \rvert}`,
    why: {
      detailed: String.raw`Eine Ebene hat unendlich viele Richtungen, und jede bildet mit der Geraden einen anderen Winkel. Eindeutig ist nur der **Normalenvektor**. Bestimme ihn bei einer Ebene in Parameterform mit dem Kreuzprodukt der beiden Richtungen und rechne mit ihm.`,
      short: String.raw`Bei Ebenen mit dem Normalenvektor rechnen (Kreuzprodukt der Richtungen).`,
    },
  },
]
