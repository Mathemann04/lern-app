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
  // Projektion und Zerlegung (M7 Schritt 3)
  {
    id: 'vec-proj-not-squared',
    name: 'Durch die Länge statt durch ihr Quadrat geteilt',
    wrongFormula: String.raw`\vec a_{\parallel} = \frac{\vec a \cdot \vec b}{\lvert \vec b \rvert} \, \vec b`,
    why: {
      detailed: String.raw`Im Schatten $\vec a_{\parallel} = \frac{\vec a \cdot \vec b}{\lvert \vec b \rvert^2} \, \vec b$ steht die Länge von $\vec b$ **im Quadrat**: Einmal teilst du durch $\lvert \vec b \rvert$, um aus dem Skalarprodukt die Länge des Schattens zu machen, und noch einmal, weil $\vec b$ selbst schon die Länge $\lvert \vec b \rvert$ mitbringt. Bequem: $\lvert \vec b \rvert^2 = \vec b \cdot \vec b$ ist die Summe der Quadrate der Einträge, ganz ohne Wurzel.`,
      short: String.raw`Im Nenner steht $\lvert \vec b \rvert^2 = \vec b \cdot \vec b$, ohne Wurzel.`,
    },
  },
  {
    id: 'vec-proj-swapped',
    name: 'Auf den falschen Vektor projiziert',
    wrongFormula: String.raw`\vec a_{\parallel} = \frac{\vec a \cdot \vec b}{\lvert \vec a \rvert^2} \, \vec a`,
    why: {
      detailed: String.raw`Der Schatten von $\vec a$ auf $\vec b$ liegt auf der Geraden von $\vec b$. Deshalb kommt im Nenner und am Ende **der Vektor, auf den projiziert wird**, vor: $\frac{\vec a \cdot \vec b}{\lvert \vec b \rvert^2} \, \vec b$. Mit $\vec a$ an diesen Stellen bekommst du den Schatten von $\vec b$ auf $\vec a$, also etwas anderes.`,
      short: String.raw`Nenner und Richtung kommen vom Vektor, auf den projiziert wird.`,
    },
  },
  {
    id: 'vec-proj-inverted',
    name: 'Bruch umgedreht',
    wrongFormula: String.raw`k = \frac{\lvert \vec b \rvert^2}{\vec a \cdot \vec b}`,
    why: {
      detailed: String.raw`Der Faktor vor $\vec b$ ist **Skalarprodukt durch Längenquadrat**, $k = \frac{\vec a \cdot \vec b}{\lvert \vec b \rvert^2}$. Probe: Ist $\vec a$ selbst schon ein Vielfaches von $\vec b$, muss genau diese Zahl herauskommen.`,
      short: String.raw`$k = \frac{\vec a \cdot \vec b}{\lvert \vec b \rvert^2}$: Skalarprodukt oben.`,
    },
  },
  {
    id: 'vec-proj-times-a',
    name: 'Faktor mal den falschen Vektor',
    wrongFormula: String.raw`\vec a_{\parallel} = k\,\vec a`,
    why: {
      detailed: String.raw`Der Schatten liegt auf der Geraden von $\vec b$, also ist er ein Vielfaches von $\vec b$: $\vec a_{\parallel} = k\,\vec b$. Ein Vielfaches von $\vec a$ zeigt in die Richtung von $\vec a$ und ist deshalb kein Schatten auf $\vec b$.`,
      short: String.raw`Der Schatten ist ein Vielfaches von $\vec b$.`,
    },
  },
  {
    id: 'vec-rest-reversed',
    name: 'Rest falsch herum abgezogen',
    wrongFormula: String.raw`\vec a_{\perp} = \vec a_{\parallel} - \vec a`,
    why: {
      detailed: String.raw`Die beiden Teile ergeben zusammen wieder $\vec a$: $\vec a = \vec a_{\parallel} + \vec a_{\perp}$. Stellst du nach $\vec a_{\perp}$ um, steht $\vec a$ vorn. Andersherum zeigt der Rest genau in die Gegenrichtung. Probe: $\vec a_{\parallel} + \vec a_{\perp}$ muss $\vec a$ ergeben.`,
      short: String.raw`$\vec a_{\perp} = \vec a - \vec a_{\parallel}$; Probe: Summe gleich $\vec a$.`,
    },
  },
  {
    id: 'vec-rest-added',
    name: 'Schatten addiert statt abgezogen',
    wrongFormula: String.raw`\vec a_{\perp} = \vec a + \vec a_{\parallel}`,
    why: {
      detailed: String.raw`Der senkrechte Teil ist das, was von $\vec a$ **übrig bleibt**, wenn du den Schatten wegnimmst. Aus $\vec a = \vec a_{\parallel} + \vec a_{\perp}$ folgt, dass du den Schatten abziehst. Probe: $\vec a_{\perp} \cdot \vec b$ muss $0$ sein.`,
      short: String.raw`Den Schatten abziehen; Probe: $\vec a_{\perp} \cdot \vec b = 0$.`,
    },
  },
  {
    id: 'vec-rest-minus-b',
    name: 'Ganzen Vektor statt Schatten abgezogen',
    wrongFormula: String.raw`\vec a_{\perp} = \vec a - \vec b`,
    why: {
      detailed: String.raw`Abgezogen wird der **Schatten** $\vec a_{\parallel}$, nicht der Vektor $\vec b$, auf den projiziert wird. $\vec b$ gibt nur die Richtung vor; wie lang der Schatten ist, hängt von $\vec a$ ab. Probe: Der Rest muss senkrecht auf $\vec b$ stehen.`,
      short: String.raw`$\vec a_{\perp} = \vec a - \vec a_{\parallel}$, nicht $\vec a - \vec b$.`,
    },
  },
  {
    id: 'vec-shadow-squared',
    name: 'Länge des Schattens durch das Quadrat geteilt',
    wrongFormula: String.raw`\lvert \vec a_{\parallel} \rvert = \frac{\lvert \vec a \cdot \vec b \rvert}{\lvert \vec b \rvert^2}`,
    why: {
      detailed: String.raw`Das Quadrat im Nenner gehört nur zum Faktor **vor dem Vektor** $\vec b$, weil $\vec b$ selbst noch die Länge $\lvert \vec b \rvert$ mitbringt. Für die Länge des Schattens als Zahl teilst du nur einmal: $\lvert \vec a_{\parallel} \rvert = \frac{\lvert \vec a \cdot \vec b \rvert}{\lvert \vec b \rvert}$.`,
      short: String.raw`Länge des Schattens: einmal durch $\lvert \vec b \rvert$ teilen.`,
    },
  },
  {
    id: 'vec-shadow-no-abs',
    name: 'Betrag vergessen',
    wrongFormula: String.raw`\lvert \vec a_{\parallel} \rvert = \frac{\vec a \cdot \vec b}{\lvert \vec b \rvert} < 0`,
    why: {
      detailed: String.raw`Eine Länge ist nie negativ. Ist das Skalarprodukt negativ, zeigt der Schatten nur entgegen $\vec b$; seine Länge ist der **Betrag** $\frac{\lvert \vec a \cdot \vec b \rvert}{\lvert \vec b \rvert}$.`,
      short: String.raw`Längen sind positiv: Betrag des Skalarprodukts nehmen.`,
    },
  },
  {
    id: 'vec-proj-no-denominator',
    name: 'Durch das Längenquadrat teilen vergessen',
    wrongFormula: String.raw`\vec a_{\parallel} = 2\,\vec b \;\Rightarrow\; \vec a \cdot \vec b = 2`,
    why: {
      detailed: String.raw`Der Faktor vor $\vec b$ ist nicht das Skalarprodukt selbst, sondern $\frac{\vec a \cdot \vec b}{\lvert \vec b \rvert^2}$. Aus $\vec a_{\parallel} = k\,\vec b$ folgt deshalb $\vec a \cdot \vec b = k \, \lvert \vec b \rvert^2$.`,
      short: String.raw`$\vec a_{\parallel} = k\,\vec b \;\Leftrightarrow\; \vec a \cdot \vec b = k\,\lvert \vec b \rvert^2$.`,
    },
  },
  {
    id: 'vec-foot-no-start',
    name: 'Stützpunkt vergessen',
    wrongFormula: String.raw`F = k\,\vec v`,
    why: {
      detailed: String.raw`Die Gerade beginnt nicht im Ursprung, sondern beim Punkt $A$. Der Schatten $k\,\vec v$ ist nur der Weg **von $A$ aus** entlang der Geraden; den Lotfußpunkt bekommst du mit $F = A + k\,\vec v$.`,
      short: String.raw`$F = A + k\,\vec v$: vom Stützpunkt aus abtragen.`,
    },
  },
  {
    id: 'vec-foot-from-p',
    name: 'Vom falschen Punkt aus abgetragen',
    wrongFormula: String.raw`F = P + k\,\vec v`,
    why: {
      detailed: String.raw`Der Lotfußpunkt liegt **auf der Geraden**. Du projizierst $\overrightarrow{AP}$ auf die Richtung $\vec v$ und gehst diesen Schatten vom Punkt $A$ der Geraden aus: $F = A + k\,\vec v$. Vom Punkt $P$ aus landest du neben der Geraden.`,
      short: String.raw`$F$ liegt auf der Geraden: $F = A + k\,\vec v$.`,
    },
  },
  {
    id: 'vec-dist-shadow',
    name: 'Falsche Strecke gemessen',
    wrongFormula: String.raw`d = \lvert \vec a_{\parallel} \rvert`,
    why: {
      detailed: String.raw`Der Abstand ist die Länge des **Lots**, also des senkrechten Teils $\vec a_{\perp}$, der vom Schatten zur Spitze führt. Der Schatten selbst oder der ganze Pfeil sind länger oder liegen in der falschen Richtung. Im Bild ist es die Strecke mit dem rechten Winkel.`,
      short: String.raw`Abstand = Länge des Lots $\lvert \vec a_{\perp} \rvert$.`,
    },
  },
  {
    id: 'vec-span-one-part',
    name: 'Nur auf einen Vektor projiziert',
    wrongFormula: String.raw`\vec a_E = \frac{\vec a \cdot \vec b}{\lvert \vec b \rvert^2} \, \vec b`,
    why: {
      detailed: String.raw`Die Ebene wird von **zwei** Vektoren aufgespannt. Stehen sie senkrecht aufeinander, ist der Schatten auf die Ebene die Summe der Schatten auf beide: $\vec a_E = \frac{\vec a \cdot \vec b}{\lvert \vec b \rvert^2} \, \vec b + \frac{\vec a \cdot \vec c}{\lvert \vec c \rvert^2} \, \vec c$.`,
      short: String.raw`Auf beide Vektoren projizieren und die Schatten addieren.`,
    },
  },
  {
    id: 'vec-span-factors-swapped',
    name: 'Faktoren vertauscht',
    wrongFormula: String.raw`\vec a_E = k_c\,\vec b + k_b\,\vec c`,
    why: {
      detailed: String.raw`Jeder Faktor gehört zu dem Vektor, mit dem er gerechnet wurde: $k_b = \frac{\vec a \cdot \vec b}{\lvert \vec b \rvert^2}$ steht vor $\vec b$, $k_c$ vor $\vec c$. Probe: $\vec a - \vec a_E$ muss auf $\vec b$ **und** auf $\vec c$ senkrecht stehen.`,
      short: String.raw`$k_b$ vor $\vec b$, $k_c$ vor $\vec c$.`,
    },
  },
  // Kräfte (M7 Schritt 3b)
  {
    id: 'vec-force-sin-cos',
    name: 'Sinus und Kosinus vertauscht',
    wrongFormula: String.raw`F_x = F \sin\alpha`,
    why: {
      detailed: String.raw`Welche Winkelfunktion zu welcher Komponente gehört, hängt davon ab, **wo der Winkel gemessen wird**. Wird $\alpha$ ab der $x$-Achse gemessen, liegt $F_x$ am Winkel an (Ankathete): $F_x = F\cos\alpha$, $F_y = F\sin\alpha$. Wird der Winkel ab der $y$-Achse gemessen, ist es genau andersherum. Zeichne das rechtwinklige Dreieck aus $F_x$, $F_y$ und $\vec F$ und schau, welche Seite am Winkel anliegt.`,
      short: String.raw`Ankathete am Winkel: mit $\cos$; Gegenkathete: mit $\sin$.`,
    },
  },
  {
    id: 'vec-force-sign',
    name: 'Vorzeichen nicht aus dem Quadranten',
    wrongFormula: String.raw`\vec F \text{ zeigt nach links, aber } F_x > 0`,
    why: {
      detailed: String.raw`Eine Komponente ist negativ, wenn der Pfeil entgegen der Achse zeigt: nach links heißt $F_x < 0$, nach unten heißt $F_y < 0$. Mit dem Winkel ab der positiven $x$-Achse liefern $\cos\alpha$ und $\sin\alpha$ das Vorzeichen von selbst, z. B. $\cos 120^\circ = -\cos 60^\circ$. Prüfe am Bild, in welchen Quadranten der Pfeil zeigt.`,
      short: String.raw`Zeigt der Pfeil nach links oder unten, ist die Komponente negativ.`,
    },
  },
  {
    id: 'vec-force-no-magnitude',
    name: 'Betrag der Kraft vergessen',
    wrongFormula: String.raw`F_x = \cos\alpha`,
    why: {
      detailed: String.raw`$\cos\alpha$ und $\sin\alpha$ sind nur die Anteile eines Pfeils der Länge 1. Die Komponenten einer Kraft bekommst du, wenn du diese Anteile **mit dem Betrag** $F$ malnimmst: $F_x = F\cos\alpha$, $F_y = F\sin\alpha$.`,
      short: String.raw`$F_x = F\cos\alpha$: mit dem Betrag malnehmen.`,
    },
  },
  {
    id: 'vec-force-tan-inverted',
    name: 'Bruch im Tangens umgedreht',
    wrongFormula: String.raw`\tan\alpha' = \frac{\lvert F_x \rvert}{\lvert F_y \rvert}`,
    why: {
      detailed: String.raw`Der Tangens ist **Gegenkathete durch Ankathete**. Für den Winkel an der $x$-Achse liegt $F_x$ an und $F_y$ gegenüber: $\tan\alpha' = \frac{\lvert F_y \rvert}{\lvert F_x \rvert}$. Mit dem umgedrehten Bruch bekommst du den Winkel zur $y$-Achse, also den Rest zu $90^\circ$.`,
      short: String.raw`$\tan\alpha' = \frac{\lvert F_y \rvert}{\lvert F_x \rvert}$: Gegenkathete durch Ankathete.`,
    },
  },
  {
    id: 'vec-force-arctan',
    name: 'Wert des Taschenrechners ungeprüft übernommen',
    wrongFormula: String.raw`\alpha = \arctan\frac{F_y}{F_x}`,
    why: {
      detailed: String.raw`Der $\arctan$ liefert nur Winkel zwischen $-90^\circ$ und $90^\circ$, also nur Richtungen nach rechts. Zeigt die Kraft nach links ($F_x < 0$), liegt der Winkel im 2. oder 3. Quadranten. Darum rechnest du erst den spitzen Hilfswinkel $\alpha'$ mit Beträgen aus und legst ihn dann in den richtigen Quadranten.`,
      short: String.raw`$\arctan$ kennt nur rechts; bei $F_x < 0$ in den richtigen Quadranten legen.`,
    },
  },
  {
    id: 'vec-force-quadrant',
    name: 'Falscher Quadrant',
    wrongFormula: String.raw`F_x < 0,\; F_y < 0:\; \alpha = 180^\circ - \alpha'`,
    why: {
      detailed: String.raw`Die Vorzeichen der Komponenten sagen, wohin der Pfeil zeigt: rechts oben $\alpha = \alpha'$, links oben $\alpha = 180^\circ - \alpha'$, links unten $\alpha = 180^\circ + \alpha'$, rechts unten $\alpha = 360^\circ - \alpha'$. Gemessen wird immer gegen den Uhrzeigersinn ab der positiven $x$-Achse.`,
      short: String.raw`Vorzeichen von $F_x$ und $F_y$ bestimmen den Quadranten.`,
    },
  },
  {
    id: 'vec-force-add-magnitudes',
    name: 'Beträge addiert statt Vektoren',
    wrongFormula: String.raw`F_R = F_1 + F_2`,
    why: {
      detailed: String.raw`Kräfte sind Vektoren: Sie heben sich teilweise auf, wenn sie in verschiedene Richtungen zeigen. Deshalb addierst du die **Komponenten** (Pfeile aneinanderhängen) und rechnest erst danach den Betrag aus. Die Summe der Beträge stimmt nur, wenn alle Kräfte in dieselbe Richtung zeigen.`,
      short: String.raw`Erst die Vektoren addieren, dann den Betrag bilden.`,
    },
  },
  {
    id: 'vec-force-subtracted',
    name: 'Abgezogen statt addiert',
    wrongFormula: String.raw`\vec F_R = \vec F_1 - \vec F_2`,
    why: {
      detailed: String.raw`Alle Kräfte wirken gleichzeitig, also werden **alle addiert**, Eintrag für Eintrag. Die Richtung steckt schon in den Vorzeichen der Einträge; ein zusätzliches Minus dreht eine Kraft um.`,
      short: String.raw`Kräfte (und Momente) werden addiert; die Richtung steckt in den Vorzeichen.`,
    },
  },
  {
    id: 'vec-force-equilibrium-sign',
    name: 'Gegenkraft mit falschem Vorzeichen',
    wrongFormula: String.raw`\vec F_3 = \vec F_1 + \vec F_2`,
    why: {
      detailed: String.raw`Im Gleichgewicht ist die Summe **aller** Kräfte der Nullvektor: $\vec F_1 + \vec F_2 + \vec F_3 = \vec 0$. Die gesuchte Kraft muss die anderen also aufheben und zeigt genau entgegen ihrer Summe: $\vec F_3 = -(\vec F_1 + \vec F_2)$. Genauso bei Momenten: Das gesuchte Moment hebt die anderen auf.`,
      short: String.raw`Gleichgewicht: Summe aller Kräfte $= \vec 0$, die Gegenkraft zeigt entgegen.`,
    },
  },
  {
    id: 'vec-force-whole',
    name: 'Ganze Kraft statt Anteil',
    wrongFormula: String.raw`F_H = F_G`,
    why: {
      detailed: String.raw`Schräg zur Richtung, um die es geht, wirkt nur ein **Anteil** einer Kraft: der Teil längs dieser Richtung, mit $\sin$ oder $\cos$ des Winkels. Die ganze Kraft zählt nur, wenn sie genau in diese Richtung zeigt.`,
      short: String.raw`Nur der Anteil in der betrachteten Richtung zählt.`,
    },
  },
  {
    id: 'vec-force-solve',
    name: 'Falsch umgestellt',
    wrongFormula: String.raw`F\cos\alpha = W:\; F = W \cdot \cos\alpha`,
    why: {
      detailed: String.raw`Steht die gesuchte Größe mit einem Faktor da, teilst du **beide Seiten** durch diesen Faktor. Probe: Setz deinen Wert in die Gleichung ein; beide Seiten müssen gleich sein.`,
      short: String.raw`Durch den Faktor teilen, nicht malnehmen; Probe durch Einsetzen.`,
    },
  },
  {
    id: 'vec-incline-sin-cos',
    name: 'Sinus und Kosinus am Hang vertauscht',
    wrongFormula: String.raw`F_H = F_G \cos\alpha`,
    why: {
      detailed: String.raw`Der Neigungswinkel $\alpha$ der Ebene steht im Kräftedreieck noch einmal, und zwar zwischen $\vec F_G$ und der Normalkraft. Deshalb liegt die Normalkraft am Winkel an: $F_N = F_G\cos\alpha$, und die Hangabtriebskraft liegt gegenüber: $F_H = F_G\sin\alpha$. Probe: Bei einer flachen Ebene ($\alpha \to 0^\circ$) muss die Hangabtriebskraft fast verschwinden.`,
      short: String.raw`$F_H = F_G\sin\alpha$, $F_N = F_G\cos\alpha$; Probe mit flacher Ebene.`,
    },
  },
  {
    id: 'vec-incline-hold-along',
    name: 'Waagrechte Haltekraft wie die Hangabtriebskraft',
    wrongFormula: String.raw`F = F_G\sin\alpha`,
    why: {
      detailed: String.raw`Eine **waagrechte** Kraft zeigt nicht längs der Ebene. Längs der Ebene wirkt nur ihr Anteil $F\cos\alpha$, und der muss die Hangabtriebskraft $F_G\sin\alpha$ aufheben: $F\cos\alpha = F_G\sin\alpha$. Die waagrechte Kraft ist deshalb größer als die Hangabtriebskraft.`,
      short: String.raw`Längs der Ebene zählt nur $F\cos\alpha$: $F\cos\alpha = F_G\sin\alpha$.`,
    },
  },
  {
    id: 'vec-incline-normal-only',
    name: 'Anteil der Haltekraft in der Normalkraft vergessen',
    wrongFormula: String.raw`F_N = F_G\cos\alpha`,
    why: {
      detailed: String.raw`Die Ebene drückt so stark zurück, wie **alle** Kräfte senkrecht auf sie drücken. Eine schräge Haltekraft drückt mit ihrem Anteil senkrecht zur Ebene mit: Zur Normalkraft kommt deren Anteil dazu. Rechne das Gleichgewicht senkrecht zur Ebene mit allen Kräften.`,
      short: String.raw`Senkrecht zur Ebene: alle Kräfte mitzählen.`,
    },
  },
  {
    id: 'vec-incline-normal-dir',
    name: 'Normalenrichtung falsch',
    wrongFormula: String.raw`\vec n \parallel \vec d`,
    why: {
      detailed: String.raw`Die Normalkraft steht **senkrecht** auf der Ebene und zeigt **von der Ebene weg** zum Körper. Senkrecht auf $\vec d = \begin{pmatrix} d_1 \\ d_2 \end{pmatrix}$ steht $\begin{pmatrix} -d_2 \\ d_1 \end{pmatrix}$ oder sein Gegenstück; welches nach oben vom Hang weg zeigt, siehst du an der $y$-Komponente. Probe: $\vec n \cdot \vec d = 0$ und $\lvert \vec n \rvert = 1$.`,
      short: String.raw`$\vec n \perp \vec d$, Länge 1, vom Hang weg.`,
    },
  },
  {
    id: 'vec-work-no-cos',
    name: 'Winkel zwischen Kraft und Weg vergessen',
    wrongFormula: String.raw`W = \lvert \vec F \rvert \, \lvert \vec s \rvert`,
    why: {
      detailed: String.raw`Arbeit verrichtet nur der Anteil der Kraft **in Richtung des Weges**: $W = \vec F \cdot \vec s = \lvert \vec F \rvert \, \lvert \vec s \rvert \cos\varphi$. Das Produkt der Beträge stimmt nur, wenn Kraft und Weg in dieselbe Richtung zeigen; steht die Kraft senkrecht zum Weg, ist die Arbeit $0$.`,
      short: String.raw`$W = \lvert \vec F \rvert \, \lvert \vec s \rvert \cos\varphi$: nur der Anteil längs des Weges zählt.`,
    },
  },
  {
    id: 'vec-work-sign',
    name: 'Vorzeichen der Arbeit falsch gedeutet',
    wrongFormula: String.raw`W < 0:\; \text{die Kraft hilft}`,
    why: {
      detailed: String.raw`Ist $W > 0$, zeigt die Kraft eher mit der Bewegung (spitzer Winkel), sie hilft. Ist $W < 0$, zeigt sie eher gegen die Bewegung (stumpfer Winkel), sie bremst. Bei $W = 0$ steht sie senkrecht zum Weg und verrichtet keine Arbeit.`,
      short: String.raw`$W > 0$ hilft, $W < 0$ bremst, $W = 0$ senkrecht.`,
    },
  },
  {
    id: 'vec-torque-order',
    name: 'Reihenfolge im Moment vertauscht',
    wrongFormula: String.raw`M = y\,F_x - x\,F_y`,
    why: {
      detailed: String.raw`Das Moment um einen Punkt ist $M = r_x F_y - r_y F_x$ (wie $\vec r \times \vec F$, Hebel zuerst). Vertauschst du die Reihenfolge, kehrt sich das Vorzeichen um, und damit der Drehsinn. Positiv heißt gegen den Uhrzeigersinn.`,
      short: String.raw`$M = r_x F_y - r_y F_x$: Hebel zuerst.`,
    },
  },
  {
    id: 'vec-torque-plus',
    name: 'Plus statt Minus im Moment',
    wrongFormula: String.raw`M = r_x F_y + r_y F_x`,
    why: {
      detailed: String.raw`Im Moment steht ein **Minus**: $M = r_x F_y - r_y F_x$. Anschaulich: $F_y$ mit Hebel $r_x$ dreht gegen den Uhrzeigersinn, $F_x$ mit Hebel $r_y$ dreht im Uhrzeigersinn. Die beiden Drehungen arbeiten gegeneinander.`,
      short: String.raw`$M = r_x F_y - r_y F_x$ mit Minus.`,
    },
  },
  {
    id: 'vec-torque-dot',
    name: 'Skalarprodukt statt Moment',
    wrongFormula: String.raw`M = r_x F_x + r_y F_y`,
    why: {
      detailed: String.raw`Das Skalarprodukt misst, wie weit $\vec F$ **längs** des Hebels zeigt, und genau dieser Anteil dreht nicht. Fürs Moment zählt der Anteil **quer** zum Hebel: Du nimmst die Einträge über Kreuz, $M = r_x F_y - r_y F_x$.`,
      short: String.raw`Moment: über Kreuz, $r_x F_y - r_y F_x$.`,
    },
  },
  {
    id: 'vec-torque-no-reference',
    name: 'Hebel ab dem Ursprung statt ab dem Bezugspunkt',
    wrongFormula: String.raw`M_A = x\,F_y - y\,F_x`,
    why: {
      detailed: String.raw`Der Hebel führt vom **Bezugspunkt** $A$ zum Angriffspunkt $P$ der Kraft: $\vec r = \overrightarrow{AP} = P - A$. Die Koordinaten von $P$ allein gehören zum Moment um den Ursprung, nicht um $A$: $M_A = (x - x_A)F_y - (y - y_A)F_x$.`,
      short: String.raw`Hebel $\vec r = P - A$, vom Bezugspunkt zum Angriffspunkt.`,
    },
  },
  {
    id: 'vec-torque-lever',
    name: 'Hebelarm schräg gemessen',
    wrongFormula: String.raw`M_A = F \cdot \lvert \overrightarrow{AP} \rvert`,
    why: {
      detailed: String.raw`Der Hebelarm ist der **senkrechte** Abstand der Wirkungslinie vom Bezugspunkt, nicht die schräge Strecke $\lvert \overrightarrow{AP} \rvert$. Bei einer senkrechten Kraft zählt nur der waagrechte Abstand, bei einer waagrechten nur der senkrechte. Sicher geht es mit $M_A = r_x F_y - r_y F_x$.`,
      short: String.raw`Hebelarm senkrecht zur Kraft messen.`,
    },
  },
  {
    id: 'vec-torque-sense',
    name: 'Drehsinn falsch abgelesen',
    wrongFormula: String.raw`M < 0:\; \text{gegen den Uhrzeigersinn}`,
    why: {
      detailed: String.raw`Vereinbarung wie in der Mechanik: Ein **positives** Moment dreht **gegen** den Uhrzeigersinn, ein negatives im Uhrzeigersinn. Ist das Moment $0$, dreht die Kraft nicht um diesen Punkt (die Wirkungslinie geht durch ihn).`,
      short: String.raw`$M > 0$: gegen den Uhrzeigersinn; $M < 0$: im Uhrzeigersinn.`,
    },
  },
  {
    id: 'vec-knot-not-normalized',
    name: 'Richtung nicht auf Länge 1 gebracht',
    wrongFormula: String.raw`\vec S = S \cdot \overrightarrow{KA}`,
    why: {
      detailed: String.raw`Eine Kraft mit Betrag $S$ in Richtung $\overrightarrow{KA}$ ist $S$ mal der **Einheitsvektor**: $\vec S = S \, \frac{\overrightarrow{KA}}{\lvert \overrightarrow{KA} \rvert}$. Ohne das Teilen durch die Länge wäre der Betrag $S \cdot \lvert \overrightarrow{KA} \rvert$ statt $S$.`,
      short: String.raw`Richtung durch ihre Länge teilen: Einheitsvektor.`,
    },
  },
  {
    id: 'vec-knot-wrong-component',
    name: 'Falsche Komponente genommen',
    wrongFormula: String.raw`S_A \, e_{Ax} = F_G`,
    why: {
      detailed: String.raw`Eine senkrechte Last hält nur der **senkrechte** Anteil einer Seilkraft, eine waagrechte Kraft nur der **waagrechte**. Schreib das Gleichgewicht getrennt für $x$ und $y$ auf und setz in jede Gleichung nur die Einträge dieser Richtung ein.`,
      short: String.raw`$x$-Gleichung mit $x$-Einträgen, $y$-Gleichung mit $y$-Einträgen.`,
    },
  },
  {
    id: 'vec-knot-swapped',
    name: 'Seilkräfte vertauscht',
    wrongFormula: String.raw`S_A \leftrightarrow S_B`,
    why: {
      detailed: String.raw`Jede Seilkraft gehört zu ihrem Seil. Das steilere Seil trägt mehr von der Last, das flachere weniger. Probe: Setz beide Werte in die $x$- und die $y$-Gleichung ein; beide müssen aufgehen.`,
      short: String.raw`Das steilere Seil trägt mehr; Probe in beiden Gleichungen.`,
    },
  },
  // Kreuzprodukt und Fläche (M7 Schritt 4a)
  {
    id: 'vec-cross-middle-sign',
    name: 'Vorzeichen der mittleren Komponente',
    wrongFormula: String.raw`(\vec a \times \vec b)_2 = a_1 b_3 - a_3 b_1`,
    why: {
      detailed: String.raw`Die mittlere Komponente ist die Falle des Kreuzprodukts: $(\vec a \times \vec b)_2 = a_3 b_1 - a_1 b_3$. Mit den Hilfszeilen passiert das nicht: Deck die zweite Zeile ab und rechne mit den **zwei Zeilen darunter** (dritte Zeile und die wiederholte erste) über Kreuz, links oben mal rechts unten minus rechts oben mal links unten.`,
      short: String.raw`Mitte: $a_3 b_1 - a_1 b_3$; mit den Hilfszeilen immer die zwei Zeilen darunter nehmen.`,
    },
  },
  {
    id: 'vec-cross-order',
    name: 'Reihenfolge beim Kreuzprodukt vertauscht',
    wrongFormula: String.raw`\vec b \times \vec a = \vec a \times \vec b`,
    why: {
      detailed: String.raw`Beim Kreuzprodukt zählt die Reihenfolge: $\vec b \times \vec a = -(\vec a \times \vec b)$. Beide stehen senkrecht auf $\vec a$ und $\vec b$, zeigen aber in entgegengesetzte Richtungen (Rechte-Hand-Regel: Daumen der erste, Zeigefinger der zweite Vektor, der Mittelfinger zeigt das Ergebnis). Im Schema steht der erste Vektor links.`,
      short: String.raw`$\vec b \times \vec a = -(\vec a \times \vec b)$: erster Vektor links im Schema.`,
    },
  },
  {
    id: 'vec-cross-plus',
    name: 'Plus statt Minus im Schema',
    wrongFormula: String.raw`(\vec a \times \vec b)_1 = a_2 b_3 + a_3 b_2`,
    why: {
      detailed: String.raw`Jede Komponente ist eine **Differenz** zweier Produkte: links oben mal rechts unten **minus** rechts oben mal links unten, z. B. $(\vec a \times \vec b)_1 = a_2 b_3 - a_3 b_2$. Probe: Das Ergebnis muss mit $\vec a$ und mit $\vec b$ das Skalarprodukt $0$ haben.`,
      short: String.raw`Über Kreuz malnehmen und die Produkte **abziehen**.`,
    },
  },
  {
    id: 'vec-cross-rows',
    name: 'Falsche Zeilen im Schema',
    wrongFormula: String.raw`(\vec a \times \vec b)_1 = a_1 b_2 - a_2 b_1`,
    why: {
      detailed: String.raw`Für die erste Komponente deckst du die **erste** Zeile ab und rechnest mit der zweiten und dritten; für die zweite mit der dritten und der wiederholten ersten; für die dritte mit der ersten und zweiten. Wer mit den falschen Zeilen anfängt, bekommt die richtigen Zahlen an den falschen Stellen.`,
      short: String.raw`Komponente $i$: Zeile $i$ abdecken, mit den zwei Zeilen darunter rechnen.`,
    },
  },
  {
    id: 'vec-cross-entrywise',
    name: 'Einträge an derselben Stelle malgenommen',
    wrongFormula: String.raw`\vec a \times \vec b = \begin{pmatrix} a_1 b_1 \\ a_2 b_2 \\ a_3 b_3 \end{pmatrix}`,
    why: {
      detailed: String.raw`Eintrag für Eintrag malnehmen ist kein Kreuzprodukt (und auch kein Skalarprodukt, das wäre die Summe davon). Beim Kreuzprodukt wird **über Kreuz** gerechnet: Jede Komponente nimmt die Einträge der beiden **anderen** Zeilen, z. B. $(\vec a \times \vec b)_1 = a_2 b_3 - a_3 b_2$.`,
      short: String.raw`Über Kreuz rechnen: jede Komponente aus den beiden anderen Zeilen.`,
    },
  },
  {
    id: 'vec-area-half-forgotten',
    name: 'Beim Dreieck die Hälfte vergessen',
    wrongFormula: String.raw`A_{\triangle} = \lvert \vec a \times \vec b \rvert`,
    why: {
      detailed: String.raw`$\lvert \vec a \times \vec b \rvert$ ist die Fläche des **Parallelogramms**, das $\vec a$ und $\vec b$ aufspannen. Die Diagonale teilt es in zwei gleiche Dreiecke, das Dreieck hat also die Fläche $\frac{1}{2}\lvert \vec a \times \vec b \rvert$.`,
      short: String.raw`Dreieck: $A = \frac{1}{2}\lvert \vec a \times \vec b \rvert$.`,
    },
  },
  {
    id: 'vec-area-half-parallelogram',
    name: 'Beim Parallelogramm halbiert',
    wrongFormula: String.raw`A_{\square} = \frac{1}{2}\lvert \vec a \times \vec b \rvert`,
    why: {
      detailed: String.raw`Die Länge des Kreuzprodukts ist schon die ganze Fläche des Parallelogramms aus $\vec a$ und $\vec b$: $A = \lvert \vec a \rvert\,\lvert \vec b \rvert \sin\varphi = \lvert \vec a \times \vec b \rvert$. Das $\frac{1}{2}$ gehört nur zum Dreieck.`,
      short: String.raw`Parallelogramm: $A = \lvert \vec a \times \vec b \rvert$, ohne $\frac{1}{2}$.`,
    },
  },
  {
    id: 'vec-area-lengths',
    name: 'Längen malgenommen, Winkel vergessen',
    wrongFormula: String.raw`A = \lvert \vec a \rvert \cdot \lvert \vec b \rvert`,
    why: {
      detailed: String.raw`Seite mal Seite ist nur beim Rechteck die Fläche. Beim Parallelogramm zählt die Höhe: $A = \lvert \vec a \rvert\,\lvert \vec b \rvert \sin\varphi$, und genau das ist $\lvert \vec a \times \vec b \rvert$. Rechne deshalb erst das Kreuzprodukt und dann seine Länge.`,
      short: String.raw`$A = \lvert \vec a \rvert\,\lvert \vec b \rvert \sin\varphi = \lvert \vec a \times \vec b \rvert$.`,
    },
  },
  {
    id: 'vec-area-dot',
    name: 'Skalarprodukt statt Kreuzprodukt',
    wrongFormula: String.raw`A = \lvert \vec a \cdot \vec b \rvert`,
    why: {
      detailed: String.raw`Das Skalarprodukt $\lvert \vec a \rvert\,\lvert \vec b \rvert \cos\varphi$ misst, wie sehr zwei Vektoren in dieselbe Richtung zeigen; bei senkrechten ist es $0$, obwohl die Fläche dann am größten ist. Die Fläche gehört zum Sinus, also zum Kreuzprodukt: $A = \lvert \vec a \times \vec b \rvert$.`,
      short: String.raw`Fläche: Kreuzprodukt (Sinus), nicht Skalarprodukt (Kosinus).`,
    },
  },
  {
    id: 'vec-normal-no-length',
    name: 'Auf Länge 1 gebracht, aber nicht gestreckt',
    wrongFormula: String.raw`\vec n = \frac{\vec a \times \vec b}{\lvert \vec a \times \vec b \rvert} \text{ statt Länge } 6`,
    why: {
      detailed: String.raw`Nach dem Teilen durch die Länge hat der Vektor die Länge $1$. Für eine andere gewünschte Länge nimmst du ihn danach noch mit dieser Länge mal.`,
      short: String.raw`Erst auf Länge $1$ bringen, dann mit der gewünschten Länge malnehmen.`,
    },
  },
  {
    id: 'vec-height-no-divide',
    name: 'Fläche statt Abstand',
    wrongFormula: String.raw`d = \lvert \vec v \times \overrightarrow{PQ} \rvert`,
    why: {
      detailed: String.raw`$\lvert \vec v \times \overrightarrow{PQ} \rvert$ ist die Fläche des Parallelogramms aus $\vec v$ und $\overrightarrow{PQ}$. Fläche ist Grundseite mal Höhe, und die Höhe ist der Abstand. Teile deshalb noch durch die Grundseite $\lvert \vec v \rvert$.`,
      short: String.raw`$d = \frac{\lvert \vec v \times \overrightarrow{PQ} \rvert}{\lvert \vec v \rvert}$: Fläche durch Grundseite.`,
    },
  },
  {
    id: 'vec-height-squared',
    name: 'Durch das Quadrat der Grundseite geteilt',
    wrongFormula: String.raw`d = \frac{\lvert \vec v \times \overrightarrow{PQ} \rvert}{\lvert \vec v \rvert^2}`,
    why: {
      detailed: String.raw`Fläche = Grundseite mal Höhe, also Höhe = Fläche durch Grundseite, einmal geteilt. Das Quadrat $\lvert \vec v \rvert^2$ gehört zur Projektion (dem Faktor vor $\vec v$), nicht zum Abstand mit dem Kreuzprodukt.`,
      short: String.raw`Einmal durch $\lvert \vec v \rvert$ teilen, nicht durch $\lvert \vec v \rvert^2$.`,
    },
  },
  {
    id: 'vec-parallel-dot',
    name: 'Parallel und senkrecht verwechselt',
    wrongFormula: String.raw`\vec a \parallel \vec b \iff \vec a \cdot \vec b = 0`,
    why: {
      detailed: String.raw`$\vec a \cdot \vec b = 0$ heißt **senkrecht**. Parallel heißt: Die Vektoren spannen keine Fläche auf, also $\vec a \times \vec b = \vec 0$; jede Komponente des Kreuzprodukts muss $0$ sein. Probe: Dann ist der eine ein Vielfaches des anderen.`,
      short: String.raw`Parallel: $\vec a \times \vec b = \vec 0$; senkrecht: $\vec a \cdot \vec b = 0$.`,
    },
  },
  {
    id: 'vec-area-min-vertex',
    name: 'Scheitel ohne die 2',
    wrongFormula: String.raw`t^* = -\frac{q}{p} \text{ statt } -\frac{q}{2p}`,
    why: {
      detailed: String.raw`Die Parabel $p\,t^2 + q\,t + r$ hat ihren Scheitel dort, wo die Ableitung $2p\,t + q$ gleich $0$ ist, also bei $t = -\frac{q}{2p}$. Die $2$ kommt aus der Ableitung von $t^2$.`,
      short: String.raw`Scheitel: Ableitung $2p\,t + q = 0$, also durch $2p$ teilen.`,
    },
  },
  // Spatprodukt und Volumen (M7 Schritt 4b)
  {
    id: 'vec-sarrus-swap',
    name: 'Haupt- und Nebendiagonalen vertauscht',
    wrongFormula: String.raw`\det A = (\text{Nebendiagonalen}) - (\text{Hauptdiagonalen})`,
    why: {
      detailed: String.raw`Bei Sarrus zählen die drei Diagonalen von **links oben nach rechts unten** positiv, die drei von rechts oben nach links unten negativ. Andersherum bekommst du das Spatprodukt mit dem falschen Vorzeichen, und dann stimmen Rechts- und Linkssystem nicht mehr.`,
      short: String.raw`Nach rechts unten: Plus; nach links unten: Minus.`,
    },
  },
  {
    id: 'vec-sarrus-plus',
    name: 'Nebendiagonalen addiert',
    wrongFormula: String.raw`\det A = a_{11}a_{22}a_{33} + \ldots + a_{13}a_{22}a_{31} + \ldots`,
    why: {
      detailed: String.raw`Bei Sarrus werden die drei Produkte der Diagonalen nach rechts unten addiert und die drei Produkte der Diagonalen nach links unten **abgezogen**. Schreib die ersten beiden Spalten noch einmal rechts daneben, dann siehst du alle sechs Diagonalen.`,
      short: String.raw`Die drei Diagonalen nach links unten werden abgezogen.`,
    },
  },
  {
    id: 'vec-sarrus-one-diagonal',
    name: 'Nur eine Diagonale je Richtung',
    wrongFormula: String.raw`\det A = a_{11}a_{22}a_{33} - a_{13}a_{22}a_{31}`,
    why: {
      detailed: String.raw`„Hauptdiagonale minus Nebendiagonale" gilt nur bei $2 \times 2$-Matrizen. Bei $3 \times 3$ gehören zu Sarrus **sechs** Produkte: Schreib die ersten beiden Spalten rechts daneben, dann gibt es drei Diagonalen nach rechts unten (Plus) und drei nach links unten (Minus).`,
      short: String.raw`$3 \times 3$: sechs Produkte, drei mit Plus und drei mit Minus.`,
    },
  },
  {
    id: 'vec-spat-cross-twice',
    name: 'Zweimal das Kreuzprodukt',
    wrongFormula: String.raw`(\vec a \times \vec b) \times \vec c`,
    why: {
      detailed: String.raw`Das Spatprodukt ist $(\vec a \times \vec b) \cdot \vec c$: erst das Kreuzprodukt, dann das **Skalarprodukt** mit dem dritten Vektor. Das Ergebnis ist eine Zahl (das Volumen mit Vorzeichen), kein Vektor.`,
      short: String.raw`Zweiter Schritt: Skalarprodukt, das Ergebnis ist eine Zahl.`,
    },
  },
  {
    id: 'vec-spat-orientation',
    name: 'Rechts- und Linkssystem verwechselt',
    wrongFormula: String.raw`(\vec a \times \vec b) \cdot \vec c < 0 \Rightarrow \text{Rechtssystem}`,
    why: {
      detailed: String.raw`Ist das Spatprodukt **positiv**, zeigt $\vec c$ auf dieselbe Seite wie $\vec a \times \vec b$: $\vec a$, $\vec b$, $\vec c$ bilden ein Rechtssystem (rechte Hand: Daumen, Zeigefinger, Mittelfinger). Ist es **negativ**, liegt $\vec c$ auf der anderen Seite: Linkssystem.`,
      short: String.raw`Positiv: Rechtssystem; negativ: Linkssystem.`,
    },
  },
  {
    id: 'vec-spat-coplanar',
    name: 'Komplanar falsch erkannt',
    wrongFormula: String.raw`\text{komplanar} \iff (\vec a \times \vec b) \cdot \vec c \ne 0`,
    why: {
      detailed: String.raw`Komplanar heißt: Alle drei Vektoren liegen in einer Ebene. Dann ist der Spat flach und hat kein Volumen, das Spatprodukt ist **genau** $0$. Ist es nicht $0$, spannen die Vektoren einen echten Spat auf, und sein Vorzeichen sagt Rechts- oder Linkssystem.`,
      short: String.raw`Komplanar genau dann, wenn das Spatprodukt $0$ ist.`,
    },
  },
  {
    id: 'vec-spat-abs',
    name: 'Betrag vergessen',
    wrongFormula: String.raw`V = (\vec a \times \vec b) \cdot \vec c = -12`,
    why: {
      detailed: String.raw`Das Spatprodukt kann negativ sein (Linkssystem), ein Volumen nicht. Das Volumen ist der **Betrag**: $V = \lvert (\vec a \times \vec b) \cdot \vec c \rvert$. Ist ein Volumen gegeben, gibt es deshalb zwei Möglichkeiten für das Spatprodukt: $+V$ und $-V$. Genauso sind Höhe und Abstand nie negativ: Auch dort gehört der Betrag hin.`,
      short: String.raw`$V = \lvert (\vec a \times \vec b) \cdot \vec c \rvert$; bei gegebenem Volumen $\pm$.`,
    },
  },
  {
    id: 'vec-volume-factor',
    name: 'Faktor des Körpers verwechselt',
    wrongFormula: String.raw`V_{\text{Tetraeder}} = \frac{1}{3}\,\lvert (\vec a \times \vec b) \cdot \vec c \rvert`,
    why: {
      detailed: String.raw`Jeder Körper ist ein fester Teil des Spats: Prisma (Dreieck als Grundfläche) $\frac{1}{2}$, Pyramide (Parallelogramm als Grundfläche) $\frac{1}{3}$, Tetraeder (Dreieck als Grundfläche, eine Spitze) $\frac{1}{6}$, denn $\frac{1}{3}$ für die Spitze mal $\frac{1}{2}$ für das Dreieck.`,
      short: String.raw`Spat $1$, Prisma $\frac{1}{2}$, Pyramide $\frac{1}{3}$, Tetraeder $\frac{1}{6}$.`,
    },
  },
  {
    id: 'vec-volume-no-factor',
    name: 'Faktor vergessen',
    wrongFormula: String.raw`V_{\text{Tetraeder}} = \lvert (\vec a \times \vec b) \cdot \vec c \rvert`,
    why: {
      detailed: String.raw`Der Betrag des Spatprodukts ist das Volumen des **ganzen Spats**. Prisma, Pyramide und Tetraeder sind nur ein Teil davon: Prisma $\frac{1}{2}$, Pyramide $\frac{1}{3}$, Tetraeder $\frac{1}{6}$.`,
      short: String.raw`Nur der Spat ist der ganze Betrag; sonst mit $\frac{1}{2}$, $\frac{1}{3}$ oder $\frac{1}{6}$ malnehmen.`,
    },
  },
  {
    id: 'vec-volume-lengths',
    name: 'Längen malgenommen wie beim Quader',
    wrongFormula: String.raw`V = \lvert \vec a \rvert \cdot \lvert \vec b \rvert \cdot \lvert \vec c \rvert`,
    why: {
      detailed: String.raw`Länge mal Breite mal Höhe gilt nur beim Quader, wo alle Kanten senkrecht aufeinander stehen. Ein Spat ist schief: Es zählen die Grundfläche $\lvert \vec a \times \vec b \rvert$ und die Höhe senkrecht dazu. Beides zusammen steckt im Spatprodukt.`,
      short: String.raw`Schiefe Kanten: Volumen über das Spatprodukt, nicht über die Längen.`,
    },
  },
  {
    id: 'vec-volume-slant',
    name: 'Schräge Kante statt Höhe',
    wrongFormula: String.raw`V = \lvert \vec a \times \vec b \rvert \cdot \lvert \vec c \rvert`,
    why: {
      detailed: String.raw`Volumen ist Grundfläche mal **Höhe**, und die Höhe steht senkrecht auf der Grundfläche. $\lvert \vec c \rvert$ ist die schräge Kante, sie ist länger als die Höhe (außer $\vec c$ steht senkrecht). Das Skalarprodukt mit $\vec a \times \vec b$ nimmt nur den senkrechten Anteil von $\vec c$.`,
      short: String.raw`Höhe statt schräger Kante: $(\vec a \times \vec b) \cdot \vec c$.`,
    },
  },
  {
    id: 'vec-spat-height-volume',
    name: 'Volumen statt Höhe',
    wrongFormula: String.raw`h = V`,
    why: {
      detailed: String.raw`Das Volumen ist Grundfläche mal Höhe (beim Tetraeder $\frac{1}{3}$ davon). Für die Höhe musst du noch durch die Grundfläche teilen: $h = \frac{V}{G}$ beim Spat, $h = \frac{3V}{A}$ beim Tetraeder.`,
      short: String.raw`Höhe = Volumen durch Grundfläche (Tetraeder: $\frac{3V}{A}$).`,
    },
  },
  {
    id: 'vec-spat-height-squared',
    name: 'Durch das Quadrat der Grundfläche geteilt',
    wrongFormula: String.raw`h = \frac{\lvert (\vec a \times \vec b) \cdot \vec c \rvert}{\lvert \vec a \times \vec b \rvert^2}`,
    why: {
      detailed: String.raw`Die Grundfläche ist die **Länge** von $\vec a \times \vec b$, also mit Wurzel. Das Quadrat $\lvert \vec a \times \vec b \rvert^2$ ist nur die Summe der Quadrate der Einträge, noch ohne Wurzel. Volumen durch Grundfläche heißt: einmal durch $\lvert \vec a \times \vec b \rvert$ teilen.`,
      short: String.raw`Durch $\lvert \vec a \times \vec b \rvert$ teilen, mit Wurzel.`,
    },
  },
  {
    id: 'vec-spat-height-third',
    name: 'Beim Tetraeder das Drittel vergessen',
    wrongFormula: String.raw`h = \frac{V}{A} \text{ statt } \frac{3V}{A}`,
    why: {
      detailed: String.raw`Beim Tetraeder (und bei jeder Pyramide) ist $V = \frac{1}{3}\,A\,h$. Nach $h$ umgestellt: $h = \frac{3V}{A}$. Wer nur durch $A$ teilt, bekommt ein Drittel der Höhe.`,
      short: String.raw`Pyramide und Tetraeder: $h = \frac{3V}{A}$.`,
    },
  },
  // Linearkombination und Basis (M7 Schritt 5)
  {
    id: 'vec-lc-transposed',
    name: 'Einträge eines Vektors in eine Gleichung geschrieben',
    wrongFormula: String.raw`\lambda \vec a + \mu \vec b = \vec v \;\Rightarrow\; a_1 \lambda + a_2 \mu = v_1`,
    why: {
      detailed: String.raw`Jede Gleichung gehört zu **einer Zeile** der Vektorgleichung: In (I) stehen die ersten Einträge aller Vektoren, $a_1 \lambda + b_1 \mu = v_1$. Die Einträge eines Vektors stehen dagegen alle vor derselben Unbekannten, untereinander in verschiedenen Gleichungen.`,
      short: String.raw`Gleichung (I): erste Einträge aller Vektoren, $a_1 \lambda + b_1 \mu = v_1$.`,
    },
  },
  {
    id: 'vec-lc-swapped',
    name: 'Faktoren den falschen Vektoren zugeordnet',
    wrongFormula: String.raw`\lambda \vec a + \mu \vec b \;\Rightarrow\; b_1 \lambda + a_1 \mu`,
    why: {
      detailed: String.raw`Jeder Faktor gehört fest zu seinem Vektor: $\lambda$ steht vor $\vec a$, $\mu$ vor $\vec b$. In jeder Gleichung und beim Einsetzen muss $\lambda$ also mit den Einträgen von $\vec a$ malgenommen werden. Vertauscht kommen andere Zahlen heraus.`,
      short: String.raw`$\lambda$ gehört zu $\vec a$, $\mu$ zu $\vec b$; nicht vertauschen.`,
    },
  },
  {
    id: 'vec-lc-target-sign',
    name: 'Zielvektor mit falschem Vorzeichen',
    wrongFormula: String.raw`\lambda \vec a + \mu \vec b = \vec v \;\Rightarrow\; a_1 \lambda + b_1 \mu = -v_1`,
    why: {
      detailed: String.raw`Die Einträge von $\vec v$ stehen schon auf der rechten Seite, so wie sie sind. Ein Minus käme nur dazu, wenn du $\vec v$ von der anderen Seite herüberbringst; das ist hier nicht nötig.`,
      short: String.raw`Rechts stehen die Einträge des Zielvektors unverändert.`,
    },
  },
  {
    id: 'vec-lc-homogeneous',
    name: 'Rechte Seite 0 statt Zielvektor',
    wrongFormula: String.raw`\lambda \vec a + \mu \vec b = \vec 0`,
    why: {
      detailed: String.raw`Mit $\vec 0$ auf der rechten Seite prüfst du, ob die Vektoren linear unabhängig sind. Hier soll aber $\vec v$ herauskommen: Rechts stehen die Einträge von $\vec v$.`,
      short: String.raw`Rechts steht $\vec v$, nicht $\vec 0$ (das wäre der Test auf Unabhängigkeit).`,
    },
  },
  {
    id: 'vec-lc-no-check',
    name: 'Übrige Gleichungen nicht geprüft',
    wrongFormula: String.raw`\text{(I), (II) lösbar} \;\Rightarrow\; \vec v \in \operatorname{span}(\vec a, \vec b)`,
    why: {
      detailed: String.raw`Zwei Gleichungen legen $\lambda$ und $\mu$ fest. Im Raum gibt es aber mehr Gleichungen: Erst wenn **jede** mit denselben Zahlen stimmt, ist $\vec v$ eine Linearkombination, liegt also im Spann. Stimmt eine nicht, verfehlen die Vielfachen den Vektor. Deshalb gehört immer die Probe in den übrigen Gleichungen dazu.`,
      short: String.raw`Im Spann nur, wenn auch die übrigen Gleichungen stimmen: Probe machen.`,
    },
  },
  {
    id: 'vec-lc-span-denied',
    name: 'Im Spann übersehen',
    wrongFormula: String.raw`\text{alle Gleichungen stimmen} \;\Rightarrow\; \vec v \notin \operatorname{span}(\vec a, \vec b)`,
    why: {
      detailed: String.raw`Erfüllen dieselben Zahlen $\lambda$ und $\mu$ **alle** Gleichungen, dann ist $\vec v = \lambda \vec a + \mu \vec b$, also eine Linearkombination: $\vec v$ liegt im Spann. Dass zwei Vektoren nur eine Ebene aufspannen, spielt keine Rolle, solange $\vec v$ in dieser Ebene liegt. Rechne die Probe Produkt für Produkt nach.`,
      short: String.raw`Stimmen alle Gleichungen, liegt der Vektor im Spann.`,
    },
  },
  {
    id: 'vec-gauss-rhs',
    name: 'Rechte Seite nicht mitgerechnet',
    wrongFormula: String.raw`3 \cdot \text{I} - 2 \cdot \text{II}: \text{ links abgezogen, rechts nur } 3 \cdot r_1`,
    why: {
      detailed: String.raw`Eine Gleichung ist eine Waage: Was du links machst, musst du auch rechts machen. Nimmst du (I) mal $3$ und ziehst $2$-mal (II) ab, rechnest du rechts genauso: $3 r_1 - 2 r_2$.`,
      short: String.raw`Malnehmen und Abziehen auch auf der rechten Seite.`,
    },
  },
  {
    id: 'vec-gauss-sign',
    name: 'Vorzeichen beim Abziehen',
    wrongFormula: String.raw`\text{I} - \text{II}: \; r_1 + r_2`,
    why: {
      detailed: String.raw`Beim Abziehen zweier Gleichungen wird **jeder** Eintrag der zweiten abgezogen, auch die Zahl rechts und negative Faktoren: $r_1 - (-4) = r_1 + 4$. Rechne Eintrag für Eintrag mit Klammern, dann geht kein Minus verloren.`,
      short: String.raw`Jeden Eintrag abziehen, auch rechts; Minus mal Minus beachten.`,
    },
  },
  {
    id: 'vec-backsub-sign',
    name: 'Beim Einsetzen das Vorzeichen nicht gedreht',
    wrongFormula: String.raw`6 + 2\mu = 4 \;\Rightarrow\; 2\mu = 4 + 6`,
    why: {
      detailed: String.raw`Nach dem Einsetzen steht links eine bekannte Zahl. Sie kommt mit **umgedrehtem** Vorzeichen auf die andere Seite: aus $6 + 2\mu = 4$ wird $2\mu = 4 - 6$.`,
      short: String.raw`Bekannte Zahl mit umgedrehtem Vorzeichen auf die andere Seite.`,
    },
  },
  {
    id: 'vec-backsub-divide',
    name: 'Nicht durch den Faktor geteilt',
    wrongFormula: String.raw`3\mu = 6 \;\Rightarrow\; \mu = 6`,
    why: {
      detailed: String.raw`Am Ende steht noch eine Zahl vor der Unbekannten. Erst wenn du durch diesen Faktor teilst, steht die Unbekannte allein: aus $3\mu = 6$ wird $\mu = \frac{6}{3}$.`,
      short: String.raw`Zum Schluss durch den Faktor vor der Unbekannten teilen.`,
    },
  },
  {
    id: 'vec-indep-swapped',
    name: 'Abhängig und unabhängig verwechselt',
    wrongFormula: String.raw`\det(\vec a, \vec b, \vec c) \ne 0 \;\Rightarrow\; \text{linear abhängig}`,
    why: {
      detailed: String.raw`Determinante **ungleich** $0$: Die Vektoren spannen ein echtes Parallelogramm oder einen echten Spat auf, keiner lässt sich aus den anderen kombinieren, sie sind linear **unabhängig**. Determinante gleich $0$: Die Fläche oder das Volumen ist weg, die Vektoren sind linear abhängig. Mit Parameter heißt das: Abhängig nur für die Lösungen von $\det = 0$, für alle anderen Werte unabhängig.`,
      short: String.raw`$\det \ne 0$: unabhängig; $\det = 0$: abhängig.`,
    },
  },
  {
    id: 'vec-indep-perp',
    name: 'Unabhängig mit senkrecht verwechselt',
    wrongFormula: String.raw`\vec a \cdot \vec b \ne 0 \;\Rightarrow\; \text{linear abhängig}`,
    why: {
      detailed: String.raw`Linear unabhängig heißt nur: Keiner der Vektoren lässt sich aus den anderen kombinieren, sie zeigen in verschiedene Richtungen. Senkrecht müssen sie dafür nicht stehen. Das Skalarprodukt sagt etwas über den Winkel, die Determinante über die Unabhängigkeit.`,
      short: String.raw`Unabhängig heißt nicht senkrecht; entscheidend ist die Determinante.`,
    },
  },
  {
    id: 'vec-indep-no-zero',
    name: 'Faustregel umgedreht: kein Nullvektor',
    wrongFormula: String.raw`\text{kein Nullvektor} \;\Rightarrow\; \text{linear unabhängig}`,
    why: {
      detailed: String.raw`Ist der Nullvektor dabei, sind die Vektoren sicher abhängig. Umgekehrt gilt das nicht: Auch Vektoren ohne Nullvektor können abhängig sein, z. B. $\vec b = 2\vec a$ oder $\vec c = \vec a + \vec b$. Das sagt erst die Rechnung.`,
      short: String.raw`Ohne Nullvektor kann es trotzdem abhängig sein; rechnen.`,
    },
  },
  {
    id: 'vec-indep-pairwise',
    name: 'Nur paarweise auf parallel geprüft',
    wrongFormula: String.raw`\text{keine zwei parallel} \;\Rightarrow\; \vec a, \vec b, \vec c \text{ unabhängig}`,
    why: {
      detailed: String.raw`Bei drei Vektoren reicht es nicht, dass keine zwei parallel sind: $\vec c$ kann trotzdem in der Ebene von $\vec a$ und $\vec b$ liegen, z. B. $\vec c = \vec a + \vec b$. Ob das so ist, sagt die Determinante. Vier Vektoren im Raum sind immer abhängig.`,
      short: String.raw`Drei Vektoren: Determinante prüfen; vier im Raum sind immer abhängig.`,
    },
  },
  {
    id: 'vec-dim-count',
    name: 'Anzahl der Vektoren statt Dimension',
    wrongFormula: String.raw`\dim \operatorname{span}(\vec a, \vec b, \vec c) = 3`,
    why: {
      detailed: String.raw`Die Dimension zählt nur die **linear unabhängigen** Vektoren. Ein Vektor, der sich aus den anderen kombinieren lässt, bringt keine neue Richtung dazu. Eine Basis enthält deshalb keine abhängigen Vektoren.`,
      short: String.raw`Dimension: nur die unabhängigen Vektoren zählen.`,
    },
  },
  {
    id: 'vec-dim-too-low',
    name: 'Zu viele Vektoren gestrichen',
    wrongFormula: String.raw`\det = 0 \;\Rightarrow\; \dim = 1`,
    why: {
      detailed: String.raw`$\det = 0$ heißt nur: Mindestens einer der Vektoren ist überflüssig. Zwei nicht parallele Vektoren zeigen trotzdem in zwei Richtungen und spannen eine Ebene auf. Und ist $\det \ne 0$, zählen alle drei. Eine Basis mit zu wenigen Vektoren lässt eine Richtung aus.`,
      short: String.raw`Nur die abhängigen streichen; nicht parallele zählen weiter.`,
    },
  },
  {
    id: 'vec-dim-parallel',
    name: 'Parallele Vektoren mitgezählt',
    wrongFormula: String.raw`\vec b = 2\vec a \;\Rightarrow\; \dim \operatorname{span}(\vec a, \vec b) = 2`,
    why: {
      detailed: String.raw`Parallele Vektoren zeigen in dieselbe Richtung (oder die genau entgegengesetzte) und bringen keine neue Richtung dazu. Prüf, ob ein Vektor ein Vielfaches eines anderen ist: Dann zählen beide zusammen nur einmal.`,
      short: String.raw`Parallele Vektoren zählen zusammen nur als eine Richtung.`,
    },
  },
  {
    id: 'vec-dim-entries',
    name: 'Zahl der Einträge statt Dimension',
    wrongFormula: String.raw`\vec a, \vec b, \vec c, \vec d \in \mathbb{R}^3 \;\Rightarrow\; \dim = 3`,
    why: {
      detailed: String.raw`Drei Einträge heißt nur: Die Vektoren liegen im Raum, die Dimension ist **höchstens** $3$. Liegen alle in einer Ebene, ist der Spann nur diese Ebene. Das zeigt die Determinante.`,
      short: String.raw`Drei Einträge: Dimension höchstens $3$, nicht immer $3$.`,
    },
  },
  {
    id: 'vec-det2-plus',
    name: 'Plus statt Minus bei der 2 × 2-Determinante',
    wrongFormula: String.raw`\det\begin{pmatrix} a_1 & b_1 \\ a_2 & b_2 \end{pmatrix} = a_1 b_2 + a_2 b_1`,
    why: {
      detailed: String.raw`Bei einer $2 \times 2$-Matrix gilt: Hauptdiagonale **minus** Nebendiagonale, $a_1 b_2 - a_2 b_1$. Mit Plus kommt nicht die Fläche heraus, und bei parallelen Vektoren nicht $0$.`,
      short: String.raw`$a_1 b_2 - a_2 b_1$: Hauptdiagonale minus Nebendiagonale.`,
    },
  },
  {
    id: 'vec-det2-rows',
    name: 'Einträge eines Vektors miteinander malgenommen',
    wrongFormula: String.raw`\det(\vec a, \vec b) = a_1 a_2 - b_1 b_2`,
    why: {
      detailed: String.raw`Die Vektoren sind die **Spalten** der Matrix. Über Kreuz malgenommen wird immer ein Eintrag von $\vec a$ mit einem von $\vec b$: $a_1 b_2 - a_2 b_1$.`,
      short: String.raw`Immer ein Eintrag von $\vec a$ mal einer von $\vec b$.`,
    },
  },
]

export const vectorErrorRule = (id: string): VectorErrorRule => {
  const rule = VECTOR_ERROR_RULES.find((r) => r.id === id)
  if (!rule) throw new Error(`Unbekannter Fehler ${id}`)
  return rule
}
