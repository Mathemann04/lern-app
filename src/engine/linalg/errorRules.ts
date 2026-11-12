import type { Explanation } from '../explain/texts.ts'

// Typische Fehler beim Rechnen mit Vektoren (M7, Katalog in docs/PLAN-M7.md, „Typische Fehler"). Jeder Fehler rechnet
// einen Schritt falsch weiter (vectorTasks.ts); hier stehen Name, Katalogbeispiel als Formel und „Warum ist das falsch?".
// Der Text nennt den Fehler und die Regel, verrät aber nicht das Ergebnis des Schritts.

export type VectorErrorRule = {
  readonly id: string
  // kurzer Name (Text mit Formeln)
  readonly name: string
  // Katalogbeispiel als Formel (LaTeX)
  readonly wrongFormula: string
  readonly why: Explanation
}

const col = (...xs: readonly (string | number)[]) => `\\begin{pmatrix} ${xs.join(' \\\\ ')} \\end{pmatrix}`

export const VECTOR_ERROR_RULES: readonly VectorErrorRule[] = [
  {
    id: 'vec-reversed',
    name: 'Falsch herum abgezogen',
    wrongFormula: String.raw`\overrightarrow{AB} = A - B`,
    why: {
      detailed: String.raw`Beim Abziehen zählt die Reihenfolge: $\vec a - \vec b$ zeigt genau entgegengesetzt zu $\vec b - \vec a$. Der Pfeil von $A$ nach $B$ beginnt bei $A$ und endet bei $B$. Merke: **Spitze minus Fuß**, also Ortsvektor des Endpunkts minus Ortsvektor des Anfangspunkts.`,
      short: String.raw`Spitze minus Fuß: Endpunkt minus Anfangspunkt, die Reihenfolge zählt.`,
    },
  },
  {
    id: 'vec-added-points',
    name: 'Punkte addiert statt abgezogen',
    wrongFormula: String.raw`\overrightarrow{AB} = A + B`,
    why: {
      detailed: String.raw`Der Verbindungsvektor ist der Weg von $A$ nach $B$. Um ihn zu bekommen, ziehst du ab, was beide gemeinsam haben: Endpunkt **minus** Anfangspunkt. Die Summe der Ortsvektoren führt zu einem ganz anderen Punkt.`,
      short: String.raw`Verbindungsvektor: Endpunkt minus Anfangspunkt, nicht plus.`,
    },
  },
  {
    id: 'vec-position-vector',
    name: 'Ortsvektor statt Verbindungsvektor',
    wrongFormula: String.raw`\overrightarrow{AB} = \overrightarrow{OB}`,
    why: {
      detailed: String.raw`Dieser Pfeil beginnt im Ursprung $O$. Das ist der Ortsvektor des Endpunkts. Der Verbindungsvektor beginnt aber beim Anfangspunkt der Strecke.`,
      short: String.raw`Ein Ortsvektor beginnt im Ursprung, der Verbindungsvektor beim Anfangspunkt.`,
    },
  },
  {
    id: 'vec-sign-slip',
    name: 'Vorzeichen übersehen',
    wrongFormula: String.raw`${col(2, 1)} - ${col(-3, 1)} = ${col(-1, 0)}`,
    why: {
      detailed: String.raw`Rechne Eintrag für Eintrag und achte auf negative Zahlen: Minus mal Minus ergibt Plus, z. B. $2 - (-3) = 2 + 3$, und Plus eine negative Zahl ist Minus, z. B. $2 + (-3) = 2 - 3$.`,
      short: String.raw`Eintrag für Eintrag rechnen: $2 - (-3) = 2 + 3$.`,
    },
  },
  {
    id: 'vec-scale-first',
    name: 'Nur einen Eintrag vervielfacht',
    wrongFormula: String.raw`3 ${col(2, -1)} = ${col(6, -1)}`,
    why: {
      detailed: String.raw`Eine Zahl vor einem Vektor streckt den ganzen Pfeil. Deshalb wird **jeder** Eintrag mit ihr malgenommen, nicht nur einer.`,
      short: String.raw`Jeder Eintrag wird mit der Zahl malgenommen.`,
    },
  },
  {
    id: 'vec-length-no-root',
    name: 'Wurzel vergessen',
    wrongFormula: String.raw`\left\lvert ${col(3, 4)} \right\rvert = 3^2 + 4^2`,
    why: {
      detailed: String.raw`Nach Pythagoras ist die Summe der Quadrate das **Quadrat** der Länge. Die Länge selbst ist die Wurzel daraus: $\lvert \vec a \rvert = \sqrt{a_1^2 + a_2^2 + a_3^2}$. Genauso gilt bei $t^2 = c$: $t = \pm\sqrt{c}$.`,
      short: String.raw`Die Summe der Quadrate ist das Quadrat der Länge: Wurzel ziehen.`,
    },
  },
  {
    id: 'vec-length-abs-sum',
    name: 'Einträge einfach addiert',
    wrongFormula: String.raw`\left\lvert ${col(3, 4)} \right\rvert = 3 + 4`,
    why: {
      detailed: String.raw`Die Länge ist die Hypotenuse im rechtwinkligen Dreieck aus den Einträgen. Sie ist kürzer als die beiden Wege zusammen: $\sqrt{a^2 + b^2}$ ist nicht $a + b$. Erst quadrieren, dann addieren, dann die Wurzel ziehen.`,
      short: String.raw`$\sqrt{a^2 + b^2} \ne a + b$: erst quadrieren, dann addieren, dann Wurzel.`,
    },
  },
  {
    id: 'vec-square-sign',
    name: 'Quadrat einer negativen Zahl negativ',
    wrongFormula: String.raw`(-3)^2 = -9`,
    why: {
      detailed: String.raw`Ein Quadrat ist nie negativ: $(-3)^2 = (-3) \cdot (-3)$, und Minus mal Minus ergibt Plus. In der Längenformel zählt jeder Eintrag positiv, egal in welche Richtung der Pfeil zeigt.`,
      short: String.raw`$(-3)^2 = (-3) \cdot (-3)$ ist positiv.`,
    },
  },
  {
    id: 'vec-square-double',
    name: 'Quadrat mit Verdoppeln verwechselt',
    wrongFormula: String.raw`3^2 = 6`,
    why: {
      detailed: String.raw`Hoch 2 heißt: die Zahl mit sich selbst malnehmen, $3^2 = 3 \cdot 3$. Verdoppeln wäre $2 \cdot 3$.`,
      short: String.raw`$3^2 = 3 \cdot 3$, nicht $2 \cdot 3$.`,
    },
  },
  {
    id: 'vec-midpoint-half-diff',
    name: 'Halber Verbindungsvektor als Mittelpunkt',
    wrongFormula: String.raw`M = \tfrac{1}{2}(B - A)`,
    why: {
      detailed: String.raw`$\tfrac{1}{2}\,\overrightarrow{AB}$ ist nur der halbe **Weg** von $A$ nach $B$. Der Mittelpunkt liegt dort, wo dieser Weg ankommt, wenn er bei $A$ beginnt: $M = A + \tfrac{1}{2}(B - A) = \tfrac{1}{2}(A + B)$, der Durchschnitt der beiden Punkte.`,
      short: String.raw`Der Mittelpunkt ist der Durchschnitt: $M = \tfrac{1}{2}(A + B)$.`,
    },
  },
  {
    id: 'vec-midpoint-no-half',
    name: 'Halbieren vergessen',
    wrongFormula: String.raw`M = A + B`,
    why: {
      detailed: String.raw`Der Mittelpunkt ist der Durchschnitt der beiden Punkte: addieren **und** durch $2$ teilen, Eintrag für Eintrag.`,
      short: String.raw`Durchschnitt: addieren und durch $2$ teilen.`,
    },
  },
  {
    id: 'vec-unit-squared',
    name: 'Durch das Quadrat der Länge geteilt',
    wrongFormula: String.raw`\vec a^{\,0} = \frac{1}{\lvert \vec a \rvert^2}\,\vec a`,
    why: {
      detailed: String.raw`Ein Einheitsvektor hat die Länge $1$. Teilst du einen Vektor durch eine Zahl, wird seine Länge durch dieselbe Zahl geteilt. Damit genau $1$ herauskommt, teilst du durch die Länge selbst, nicht durch ihr Quadrat.`,
      short: String.raw`Durch die Länge teilen: $\vec a^{\,0} = \frac{1}{\lvert\vec a\rvert}\,\vec a$.`,
    },
  },
  {
    id: 'vec-unit-times',
    name: 'Mit der Länge malgenommen statt geteilt',
    wrongFormula: String.raw`\vec a^{\,0} = \lvert \vec a \rvert \cdot \vec a`,
    why: {
      detailed: String.raw`Malnehmen mit der Länge macht den Pfeil noch länger. Für die Länge $1$ teilst du durch die Länge: Jeder Eintrag wird durch $\lvert\vec a\rvert$ geteilt.`,
      short: String.raw`Durch die Länge teilen, nicht malnehmen.`,
    },
  },
  {
    id: 'vec-not-normalized',
    name: 'Ohne Normieren gestreckt',
    wrongFormula: String.raw`\vec v = 6\,\vec a`,
    why: {
      detailed: String.raw`$6\,\vec a$ ist sechsmal so lang wie $\vec a$, nicht $6$ lang. Erst den Vektor auf die Länge $1$ bringen (durch $\lvert\vec a\rvert$ teilen), dann mit der gewünschten Länge malnehmen.`,
      short: String.raw`Erst normieren (durch $\lvert\vec a\rvert$), dann mit der Länge malnehmen.`,
    },
  },
  {
    id: 'vec-direction-sign',
    name: 'Gleichsinnig und gegensinnig verwechselt',
    wrongFormula: String.raw`\text{gegensinnig: } \vec v = +6\,\vec a^{\,0}`,
    why: {
      detailed: String.raw`Gleichsinnig heißt: in dieselbe Richtung, also ein positiver Faktor. Gegensinnig heißt: in die Gegenrichtung, also ein negativer Faktor vor dem Einheitsvektor.`,
      short: String.raw`Gegensinnig: negativer Faktor, gleichsinnig: positiver.`,
    },
  },
  {
    id: 'vec-one-solution',
    name: 'Zweite Lösung vergessen',
    wrongFormula: String.raw`t^2 = 4 \;\Rightarrow\; t = 2`,
    why: {
      detailed: String.raw`Eine quadratische Gleichung hat oft zwei Lösungen, und gesucht sind alle. Bei $u^2 = c$ mit $c > 0$ sind es $u = \sqrt{c}$ und $u = -\sqrt{c}$, denn $2^2 = (-2)^2$. Bei $t^2 + pt + q = 0$ liefert die pq-Formel mit $\pm$ beide. Prüfe jede Lösung durch Einsetzen.`,
      short: String.raw`Quadratische Gleichungen haben oft zwei Lösungen: beide angeben.`,
    },
  },
  {
    id: 'vec-length-target-not-squared',
    name: 'Gewünschte Länge nicht quadriert',
    wrongFormula: String.raw`t^2 + 8 = 3`,
    why: {
      detailed: String.raw`Die Summe der Quadrate ist das **Quadrat** der Länge. Setze sie deshalb gleich dem Quadrat der gewünschten Länge (oder ziehe auf der anderen Seite die Wurzel).`,
      short: String.raw`Summe der Quadrate = Länge im Quadrat.`,
    },
  },
  {
    id: 'vec-param-square',
    name: 'Nur den Buchstaben quadriert',
    wrongFormula: String.raw`(7t)^2 = 7t^2`,
    why: {
      detailed: String.raw`Das Quadrat gilt für den ganzen Eintrag, also auch für die Zahl davor: $(7t)^2 = 7t \cdot 7t = 49t^2$.`,
      short: String.raw`$(7t)^2 = 49t^2$: Zahl und Buchstabe quadrieren.`,
    },
  },
  {
    id: 'vec-parallelogram-corner',
    name: 'Ecken des Parallelogramms vertauscht',
    wrongFormula: String.raw`D = A + B - C`,
    why: {
      detailed: String.raw`Im Parallelogramm $ABCD$ folgen die Ecken im Kreis aufeinander, gegenüberliegende Seiten sind gleich lang und parallel: $\overrightarrow{AD} = \overrightarrow{BC}$ und $\overrightarrow{AB} = \overrightarrow{DC}$. Der fehlende Punkt liegt schräg gegenüber der mittleren der drei gegebenen Ecken. Mit einer anderen Reihenfolge entsteht zwar auch ein Parallelogramm, aber nicht das mit dieser Reihenfolge der Ecken.`,
      short: String.raw`Gegenüberliegende Seiten sind gleich: $\overrightarrow{AD} = \overrightarrow{BC}$.`,
    },
  },
  {
    id: 'vec-divide-by-vector',
    name: 'Durch einen Vektor geteilt',
    wrongFormula: String.raw`\vec x = \frac{\vec b}{\vec a}`,
    why: {
      detailed: String.raw`Durch einen Vektor kann man nicht teilen, das ist nicht erklärt. Vektoren bringst du mit Plus und Minus auf die andere Seite; teilen darfst du nur durch eine Zahl, die vor $\vec x$ steht.`,
      short: String.raw`Nie durch einen Vektor teilen, nur durch eine Zahl.`,
    },
  },
  {
    id: 'vec-equation-partial-divide',
    name: 'Nur einen Teil geteilt',
    wrongFormula: String.raw`2\vec x = \vec b - \vec a \;\Rightarrow\; \vec x = \tfrac{1}{2}\vec b - \vec a`,
    why: {
      detailed: String.raw`Teilst du eine Seite durch eine Zahl, wird jeder Summand dieser Seite geteilt, nicht nur einer.`,
      short: String.raw`Beim Teilen jeden Summanden teilen.`,
    },
  },
  {
    id: 'vec-equation-no-divide',
    name: 'Zahl vor dem Vektor vergessen',
    wrongFormula: String.raw`2\vec x = \vec b - \vec a \;\Rightarrow\; \vec x = \vec b - \vec a`,
    why: {
      detailed: String.raw`Vor $\vec x$ steht noch eine Zahl. Erst wenn du die ganze rechte Seite durch sie teilst, steht $\vec x$ allein da.`,
      short: String.raw`Noch durch die Zahl vor $\vec x$ teilen.`,
    },
  },
  // ---------------------------------------------------------------- Skalarprodukt und Winkel (M7 Schritt 2)
  {
    id: 'vec-dot-vector',
    name: 'Skalarprodukt als Vektor',
    wrongFormula: String.raw`${col(1, 2)} \cdot ${col(3, 4)} = ${col(3, 8)}`,
    why: {
      detailed: String.raw`Das Skalarprodukt ist eine **Zahl**, kein Vektor: Nimm die Einträge an derselben Stelle mal und **addiere** die Produkte, $\vec a \cdot \vec b = a_1 b_1 + a_2 b_2 + a_3 b_3$.`,
      short: String.raw`Produkte der Einträge addieren: Das Ergebnis ist eine Zahl.`,
    },
  },
  {
    id: 'vec-dot-sign',
    name: 'Vorzeichen im Produkt falsch',
    wrongFormula: String.raw`(-2) \cdot (-3) = -6`,
    why: {
      detailed: String.raw`Achte bei jedem Produkt auf die Vorzeichen: Minus mal Minus ergibt Plus, Minus mal Plus ergibt Minus. Setze negative Einträge in Klammern, dann passiert das seltener. Dasselbe gilt, wenn du ausmultiplizierst und zusammenfasst.`,
      short: String.raw`Minus mal Minus ist Plus, Minus mal Plus ist Minus.`,
    },
  },
  {
    id: 'vec-dot-cross',
    name: 'Über Kreuz multipliziert',
    wrongFormula: String.raw`${col(1, 2)} \cdot ${col(3, 4)} = 1 \cdot 4 + 2 \cdot 3`,
    why: {
      detailed: String.raw`Beim Skalarprodukt gehören immer die Einträge **an derselben Stelle** zusammen: der erste mit dem ersten, der zweite mit dem zweiten. Über Kreuz rechnet man erst beim Kreuzprodukt.`,
      short: String.raw`Erster mal erster, zweiter mal zweiter, …`,
    },
  },
  {
    id: 'vec-dot-sum',
    name: 'Addiert statt malgenommen',
    wrongFormula: String.raw`${col(1, 2)} \cdot ${col(3, 4)} = (1 + 3) + (2 + 4)`,
    why: {
      detailed: String.raw`Beim Skalarprodukt werden die Einträge an derselben Stelle **malgenommen**, erst die Produkte werden addiert: $a_1 b_1 + a_2 b_2 + \ldots$`,
      short: String.raw`Erst malnehmen, dann die Produkte addieren.`,
    },
  },
  {
    id: 'vec-angle-sign',
    name: 'Spitz und stumpf verwechselt',
    wrongFormula: String.raw`\vec a \cdot \vec b > 0 \;\Rightarrow\; \text{stumpf}`,
    why: {
      detailed: String.raw`Das Vorzeichen des Skalarprodukts ist das Vorzeichen von $\cos\varphi$, denn die Längen sind positiv. $\cos\varphi > 0$ heißt $\varphi < 90^\circ$ (spitz), $\cos\varphi < 0$ heißt $\varphi > 90^\circ$ (stumpf).`,
      short: String.raw`Skalarprodukt positiv: spitz; negativ: stumpf.`,
    },
  },
  {
    id: 'vec-angle-zero',
    name: 'Senkrecht falsch erkannt',
    wrongFormula: String.raw`\vec a \cdot \vec b = 0 \;\Rightarrow\; \vec a \parallel \vec b`,
    why: {
      detailed: String.raw`Zwei Vektoren (beide nicht der Nullvektor) stehen **genau dann** senkrecht aufeinander, wenn ihr Skalarprodukt $0$ ist, denn $\cos 90^\circ = 0$. Ist es nicht $0$, sind sie nicht senkrecht; parallele Vektoren haben dagegen das größtmögliche Skalarprodukt (dem Betrag nach).`,
      short: String.raw`Senkrecht heißt genau: Skalarprodukt $0$.`,
    },
  },
  {
    id: 'vec-cos-squared',
    name: 'Längen ohne Wurzel im Nenner',
    wrongFormula: String.raw`\cos\varphi = \frac{\vec a \cdot \vec b}{\lvert \vec a \rvert^2 \, \lvert \vec b \rvert^2}`,
    why: {
      detailed: String.raw`Im Nenner stehen die **Längen** selbst, nicht ihre Quadrate: $\cos\varphi = \frac{\vec a \cdot \vec b}{\lvert \vec a \rvert \cdot \lvert \vec b \rvert}$. Die Summe der Quadrate der Einträge ist erst das Quadrat der Länge; zieh die Wurzel.`,
      short: String.raw`Durch die Längen teilen, nicht durch ihre Quadrate.`,
    },
  },
  {
    id: 'vec-cos-one-length',
    name: 'Nur durch eine Länge geteilt',
    wrongFormula: String.raw`\cos\varphi = \frac{\vec a \cdot \vec b}{\lvert \vec a \rvert}`,
    why: {
      detailed: String.raw`Das Skalarprodukt enthält **beide** Längen: $\vec a \cdot \vec b = \lvert \vec a \rvert \, \lvert \vec b \rvert \cos\varphi$. Für $\cos\varphi$ teilst du deshalb durch das Produkt beider Längen.`,
      short: String.raw`Durch $\lvert \vec a \rvert \cdot \lvert \vec b \rvert$ teilen.`,
    },
  },
  {
    id: 'vec-angle-supplement',
    name: 'Winkel und Nebenwinkel verwechselt',
    wrongFormula: String.raw`\cos\varphi = -\tfrac{1}{2} \;\Rightarrow\; \varphi = 60^\circ`,
    why: {
      detailed: String.raw`Das Vorzeichen von $\cos\varphi$ entscheidet: positiv heißt spitz (unter $90^\circ$), negativ heißt stumpf (über $90^\circ$). Ein Winkel und sein Nebenwinkel haben Kosinuswerte mit entgegengesetztem Vorzeichen, $\cos(180^\circ - \alpha) = -\cos\alpha$. Prüfe, ob dein Winkel zum Vorzeichen passt.`,
      short: String.raw`Vorzeichen von $\cos\varphi$: positiv spitz, negativ stumpf.`,
    },
  },
  {
    id: 'vec-angle-arcsin',
    name: 'Sinus und Kosinus verwechselt',
    wrongFormula: String.raw`\cos\varphi = \tfrac{1}{2} \;\Rightarrow\; \varphi = 30^\circ`,
    why: {
      detailed: String.raw`Im Skalarprodukt steckt der **Kosinus** des Winkels: $\vec a \cdot \vec b = \lvert \vec a \rvert \, \lvert \vec b \rvert \cos\varphi$. Vom Winkel zum Skalarprodukt nimmst du also $\cos$, zurück zum Winkel $\arccos$, nie $\sin$ oder $\arcsin$. Merke: $\cos 0^\circ = 1$ (gleiche Richtung), $\cos 90^\circ = 0$ (senkrecht).`,
      short: String.raw`Im Skalarprodukt steckt $\cos\varphi$, nicht $\sin\varphi$.`,
    },
  },
  {
    id: 'vec-angle-table',
    name: 'Besondere Werte verwechselt',
    wrongFormula: String.raw`\cos\varphi = \tfrac{\sqrt{2}}{2} \;\Rightarrow\; \varphi = 60^\circ`,
    why: {
      detailed: String.raw`Präge dir die Tabelle ein: $\cos 30^\circ = \frac{\sqrt{3}}{2}$, $\cos 45^\circ = \frac{\sqrt{2}}{2}$, $\cos 60^\circ = \frac{1}{2}$, $\cos 90^\circ = 0$; bei negativem Kosinus der Nebenwinkel $180^\circ - \alpha$. Je größer der Winkel, desto kleiner der Kosinus.`,
      short: String.raw`$\cos 30^\circ = \frac{\sqrt{3}}{2}$, $\cos 45^\circ = \frac{\sqrt{2}}{2}$, $\cos 60^\circ = \frac{1}{2}$.`,
    },
  },
  {
    id: 'vec-angle-direction',
    name: 'Pfeil nicht am Scheitel begonnen',
    wrongFormula: String.raw`\angle B: \; \overrightarrow{AB} \cdot \overrightarrow{BC}`,
    why: {
      detailed: String.raw`Der Winkel an einer Ecke liegt zwischen zwei Pfeilen, die **beide an dieser Ecke beginnen**, bei $B$ also $\overrightarrow{BA}$ und $\overrightarrow{BC}$. Zeigt einer zur Ecke hin, kippt das Vorzeichen des Skalarprodukts und damit das von $\cos\varphi$.`,
      short: String.raw`Beide Pfeile beginnen am Scheitel des Winkels.`,
    },
  },
  {
    id: 'vec-perp-one',
    name: 'Skalarprodukt gleich 1 gesetzt',
    wrongFormula: String.raw`\vec a \perp \vec b \;\Rightarrow\; \vec a \cdot \vec b = 1`,
    why: {
      detailed: String.raw`Senkrecht heißt Winkel $90^\circ$, und $\cos 90^\circ = 0$. Deshalb gilt $\vec a \perp \vec b$ genau dann, wenn $\vec a \cdot \vec b = 0$. Die $1$ gehört zu Einheitsvektoren in gleicher Richtung.`,
      short: String.raw`Senkrecht: Skalarprodukt gleich $0$.`,
    },
  },
  {
    id: 'vec-param-solve',
    name: 'Falsch nach dem Parameter aufgelöst',
    wrongFormula: String.raw`3t - 6 = 0 \;\Rightarrow\; t = -2`,
    why: {
      detailed: String.raw`Bring die Zahl ohne Parameter mit der Gegenrechnung auf die andere Seite (dabei wechselt ihr Vorzeichen) und teile dann durch die Zahl vor dem Parameter, nicht umgekehrt. Bei $t^2 + pt + q = 0$: $t_{1,2} = -\frac{p}{2} \pm \sqrt{\left(\frac{p}{2}\right)^2 - q}$. Probe: Einsetzen muss $0$ ergeben.`,
      short: String.raw`Gegenrechnung, dann durch die Zahl vor dem Parameter teilen; Probe machen.`,
    },
  },
  {
    id: 'vec-ineq-flip',
    name: 'Ungleichung falsch umgedreht',
    wrongFormula: String.raw`-2t > 6 \;\Rightarrow\; t > -3`,
    why: {
      detailed: String.raw`Teilst du eine Ungleichung durch eine **negative** Zahl, dreht sich das Zeichen um: aus $>$ wird $<$. Bei einer positiven Zahl bleibt es, wie es ist. Probe mit einem Wert: Setze eine Zahl aus deinem Bereich ein und prüfe das Vorzeichen des Skalarprodukts.`,
      short: String.raw`Nur beim Teilen durch eine negative Zahl dreht sich das Zeichen um.`,
    },
  },
  {
    id: 'vec-binomial-middle',
    name: 'Mittelglied vergessen',
    wrongFormula: String.raw`\lvert \vec a + \vec b \rvert^2 = \lvert \vec a \rvert^2 + \lvert \vec b \rvert^2`,
    why: {
      detailed: String.raw`Rechne wie bei einer binomischen Formel: $(\vec a + \vec b) \cdot (\vec a + \vec b) = \vec a \cdot \vec a + 2\,\vec a \cdot \vec b + \vec b \cdot \vec b$. Das Mittelglied $2\,\vec a \cdot \vec b$ fällt nur weg, wenn die Vektoren senkrecht stehen (Pythagoras).`,
      short: String.raw`$\lvert \vec a + \vec b \rvert^2 = \lvert \vec a \rvert^2 + 2\,\vec a \cdot \vec b + \lvert \vec b \rvert^2$.`,
    },
  },
  {
    id: 'vec-dot-no-cos',
    name: 'Kosinus vergessen',
    wrongFormula: String.raw`\vec a \cdot \vec b = \lvert \vec a \rvert \, \lvert \vec b \rvert`,
    why: {
      detailed: String.raw`Aus Längen und Winkel gilt $\vec a \cdot \vec b = \lvert \vec a \rvert \, \lvert \vec b \rvert \cos\varphi$. Ohne den Kosinus stimmt das nur, wenn beide Vektoren in dieselbe Richtung zeigen.`,
      short: String.raw`$\vec a \cdot \vec b = \lvert \vec a \rvert \, \lvert \vec b \rvert \cos\varphi$.`,
    },
  },
  {
    id: 'vec-coef-not-squared',
    name: 'Zahl vor dem Vektor nicht quadriert',
    wrongFormula: String.raw`\lvert 2\vec a \rvert^2 = 2\lvert \vec a \rvert^2`,
    why: {
      detailed: String.raw`$(k\,\vec a) \cdot (k\,\vec a) = k^2 \, \vec a \cdot \vec a$: Die Zahl kommt aus beiden Faktoren, also im Quadrat. Im Mittelglied stehen die beiden Zahlen einmal: $2 k m \, \vec a \cdot \vec b$.`,
      short: String.raw`$\lvert k\,\vec a \rvert^2 = k^2 \lvert \vec a \rvert^2$.`,
    },
  },
  // Zieh-Aufgaben (M7 Schritt 2b)
  {
    id: 'vec-perp-swap',
    name: 'Nur vertauscht oder nur ein Vorzeichen geändert',
    wrongFormula: String.raw`\vec a = ${col(2, 3)} \;\Rightarrow\; \vec b = ${col(3, 2)} \text{ oder } ${col(2, -3)} \perp \vec a`,
    why: {
      detailed: String.raw`Für einen senkrechten Pfeil in der Ebene brauchst du **beides**: die Einträge von $\vec a$ vertauschen **und** bei einem das Vorzeichen ändern. Machst du nur eins davon, stehen im Skalarprodukt zwei Produkte, die sich nicht aufheben. Prüfe immer mit dem Skalarprodukt: Es muss $0$ sein.`,
      short: String.raw`Vertauschen **und** ein Vorzeichen ändern; Probe: Skalarprodukt $0$.`,
    },
  },
  {
    id: 'vec-right-not-acute',
    name: 'Rechter Winkel als spitz oder stumpf gezählt',
    wrongFormula: String.raw`\vec a \cdot \vec b = 0 \;\Rightarrow\; \text{spitz}`,
    why: {
      detailed: String.raw`Ein rechter Winkel ist weder spitz noch stumpf. Spitz heißt unter $90^\circ$, also Skalarprodukt **größer** als $0$; stumpf heißt über $90^\circ$, also Skalarprodukt **kleiner** als $0$. Bei genau $0$ stehen die Pfeile senkrecht.`,
      short: String.raw`Skalarprodukt $0$ heißt rechter Winkel, nicht spitz und nicht stumpf.`,
    },
  },
  {
    id: 'vec-right-wrong-corner',
    name: 'Rechter Winkel an der falschen Ecke',
    wrongFormula: String.raw`\angle A = 90^\circ: \; \overrightarrow{CA} \cdot \overrightarrow{CB} = 0`,
    why: {
      detailed: String.raw`Der rechte Winkel liegt an der Ecke, an der **beide** Pfeile beginnen. Für einen rechten Winkel bei $A$ prüfst du $\overrightarrow{AB} \cdot \overrightarrow{AC} = 0$, für einen bei $C$ dagegen $\overrightarrow{CA} \cdot \overrightarrow{CB} = 0$. Lies genau, an welcher Ecke er sein soll.`,
      short: String.raw`Beide Pfeile beginnen an der Ecke mit dem rechten Winkel.`,
    },
  },
  {
    id: 'vec-diagonals-sides',
    name: 'Seiten statt Diagonalen senkrecht',
    wrongFormula: String.raw`(\vec a + \vec b) \perp (\vec a - \vec b) \;\Rightarrow\; \vec a \perp \vec b`,
    why: {
      detailed: String.raw`$\vec a + \vec b$ und $\vec a - \vec b$ sind die **Diagonalen** des Parallelogramms aus $\vec a$ und $\vec b$, nicht seine Seiten. Multipliziere aus: $(\vec a + \vec b) \cdot (\vec a - \vec b) = \lvert \vec a \rvert^2 - \lvert \vec b \rvert^2$. Die Diagonalen stehen also senkrecht, wenn beide Pfeile **gleich lang** sind (eine Raute), nicht wenn die Seiten senkrecht sind.`,
      short: String.raw`$(\vec a + \vec b) \cdot (\vec a - \vec b) = \lvert \vec a \rvert^2 - \lvert \vec b \rvert^2$: gleich lang, nicht senkrecht.`,
    },
  },
]

export const vectorErrorRule = (id: string): VectorErrorRule => {
  const rule = VECTOR_ERROR_RULES.find((r) => r.id === id)
  if (!rule) throw new Error(`Unbekannter Fehler ${id}`)
  return rule
}
