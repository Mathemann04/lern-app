import { toLatex } from '../expr/print.ts'
import type { Expr } from '../expr/types.ts'
import { m } from './format.ts'
import type { Explanation } from './texts.ts'

// Texte fürs Umstellen im geführten Modus: Fragen, Tipps, Erklärungen und „Warum ist das falsch?".
// Format Text mit $…$-Formeln (richText.ts). Die Terme kommen aus dem Rechenweg der Umstell-Engine
// (guided/rearrangePlan.ts); „Warum ist das falsch?" nennt den Fehler und die Regel, verrät aber
// nicht das Ergebnis des Schritts.

const same = (text: string): Explanation => ({ detailed: text, short: text })

// --- Warum ist das falsch? (je Fehlerregel aus rearrange/errorRules.ts) ---

export const REARRANGE_ERROR_TEXTS: Readonly<Record<string, Explanation>> = {
  'eq-sign-not-flipped': {
    detailed:
      'Bringst du einen Summanden auf die andere Seite, wechselt sein Vorzeichen. Das ist die Gegenrechnung auf beiden Seiten: Aus $+b$ wird $-b$, aus $-b$ wird $+b$.',
    short: 'Beim Rüberbringen wechselt das Vorzeichen: aus $+b$ wird $-b$.',
  },
  'eq-inverse-op': {
    detailed:
      'Auf beiden Seiten muss dieselbe Rechnung stehen. Teilst du die eine Seite, musst du auch die andere teilen; nimmst du die eine mal, auch die andere: $a \\cdot x = c \\Leftrightarrow x = \\frac{c}{a}$.',
    short: 'Beide Seiten gleich behandeln: $a \\cdot x = c \\Leftrightarrow x = \\frac{c}{a}$.',
  },
  'eq-divide-one-term': {
    detailed:
      'Teilst du eine Summe, wird jeder Summand geteilt, nicht nur der erste. Setze die Summe in Gedanken in Klammern: $\\frac{c + d}{a} = \\frac{c}{a} + \\frac{d}{a}$.',
    short: 'Jeden Summanden teilen: $\\frac{c + d}{a} = \\frac{c}{a} + \\frac{d}{a}$.',
  },
  'eq-fraction-flipped': {
    detailed:
      'Beim Teilen kommt das, wodurch du teilst, in den Nenner, nicht in den Zähler. Aus $a \\cdot x = c$ wird $x = \\frac{c}{a}$, nicht $\\frac{a}{c}$.',
    short: 'Der Teiler kommt in den Nenner: $a \\cdot x = c \\Leftrightarrow x = \\frac{c}{a}$.',
  },
  'eq-denominator-bracket': {
    detailed:
      'Ist der Nenner eine Summe, nimmst du mit der ganzen Summe mal. Sie gehört in Klammern, sonst wird nur ihr erster Summand malgenommen: $y \\cdot (x - 3) = xy - 3y$.',
    short: 'Den ganzen Nenner in Klammern malnehmen: $y \\cdot (x - 3) = xy - 3y$.',
  },
  'eq-bracket-first-term': {
    detailed: 'Beim Ausmultiplizieren wird jeder Summand in der Klammer malgenommen, nicht nur der erste: $a(x + b) = ax + ab$.',
    short: 'Jeden Summanden malnehmen: $a(x + b) = ax + ab$.',
  },
  'eq-factor-one-lost': {
    detailed:
      'Klammerst du $x$ aus einem Summanden aus, der nur $x$ ist, bleibt in der Klammer eine $1$ stehen: $xy - x = x(y - 1)$. Prüfe es, indem du die Klammer wieder ausmultiplizierst.',
    short: 'Beim Ausklammern bleibt eine $1$: $xy - x = x(y - 1)$.',
  },
  'eq-reciprocal-termwise': {
    detailed:
      'Den Kehrwert darfst du nur von einem einzigen Bruch nehmen, nicht von jedem Summanden einzeln: $\\frac{1}{b} - \\frac{1}{x}$ ist nicht der Kehrwert von $b - x$. Fasse die Seite erst zu einem Bruch zusammen.',
    short: 'Kehrwert erst nach dem Zusammenfassen zu einem Bruch.',
  },
  'eq-root-termwise': {
    detailed:
      'Die Wurzel aus einer Summe ist nicht die Summe der Wurzeln: $\\sqrt{a^2 + b^2} \\neq a + b$. Fasse unter der Wurzel zusammen und lass die Wurzel stehen.',
    short: 'Nicht gliedweise: $\\sqrt{a^2 + b^2} \\neq a + b$.',
  },
  'eq-square-one-factor': {
    detailed:
      'Beim Quadrieren wird alles quadriert, bei einem Bruch Zähler und Nenner: $\\left(\\frac{y}{a}\\right)^2 = \\frac{y^2}{a^2}$, bei einem Produkt jeder Faktor: $(2y)^2 = 4y^2$.',
    short: 'Alles quadrieren: $\\left(\\frac{y}{a}\\right)^2 = \\frac{y^2}{a^2}$.',
  },
  'eq-square-middle': {
    detailed:
      'Eine Summe quadrierst du mit der binomischen Formel, mit Mittelglied: $(a + b)^2 = a^2 + 2ab + b^2$. Ohne das Mittelglied $2ab$ stimmt es nicht.',
    short: 'Binomische Formel: $(a + b)^2 = a^2 + 2ab + b^2$.',
  },
  'eq-multiply-one-term': {
    detailed:
      'Nimmst du eine Seite mal, wird jeder Summand malgenommen, nicht nur der erste, auch einer ohne Bruch. Setze die Seite in Gedanken in Klammern: $(c - b) \\cdot a = ac - ab$.',
    short: 'Jeden Summanden malnehmen: $(c - b) \\cdot a = ac - ab$.',
  },
  'eq-minus-bracket': {
    detailed:
      'Ein Minus vor einer Klammer dreht das Vorzeichen jedes Summanden in der Klammer um, nicht nur das des ersten: $-c(x - d) = -cx + cd$.',
    short: 'Das Minus gilt für die ganze Klammer: $-c(x - d) = -cx + cd$.',
  },
  'eq-square-halved': {
    detailed:
      'Die Hochzahl $2$ ist kein Faktor: Aus $x^2 = c$ wird nicht $x = \\frac{c}{2}$. Die Gegenrechnung zum Quadrat ist die Wurzel, auf beiden Seiten: $x = \\sqrt{c}$.',
    short: 'Gegen das Quadrat hilft die Wurzel, nicht das Halbieren.',
  },
  'eq-factor-sign': {
    detailed:
      'Beim Ausklammern bleibt jedes Vorzeichen in der Klammer stehen: $ax - bx = x(a - b)$. Prüfe es, indem du die Klammer wieder ausmultiplizierst.',
    short: 'Vorzeichen bleiben: $ax - bx = x(a - b)$.',
  },
  'eq-nested-root': {
    detailed:
      'Beim Quadrieren fällt nur die äußere Wurzel weg, die innere bleibt stehen: Aus $\\sqrt{a + \\sqrt{u}} = y$ wird $a + \\sqrt{u} = y^2$. Die innere Wurzel stellst du danach allein und quadrierst noch einmal.',
    short: 'Quadrieren entfernt nur die äußere Wurzel.',
  },
  'eq-ln-forgotten': {
    detailed:
      'Logarithmieren heißt: auf beiden Seiten den $\\ln$ nehmen. Auf der Seite mit der Potenz holt er die Hochzahl herunter, auf der anderen Seite bleibt er stehen: aus $e^{kx} = w$ wird $kx = \\ln w$.',
    short: 'Auf beiden Seiten den $\\ln$: $e^{kx} = w \\Leftrightarrow kx = \\ln w$.',
  },
  'eq-exp-forgotten': {
    detailed:
      'Gegen einen Logarithmus hilft seine Basis hoch, auf beiden Seiten: aus $\\ln u = b$ wird $u = e^b$, aus $\\log_a u = b$ wird $u = a^b$. Lässt du den Logarithmus nur weg, stimmt die Gleichung nicht mehr.',
    short: 'Beide Seiten hoch: $\\ln u = b \\Leftrightarrow u = e^b$.',
  },
  'eq-exp-minus-lost': {
    detailed: 'Das Minus gehört zur Hochzahl und bleibt beim Logarithmieren stehen: aus $e^{-kx} = w$ wird $-kx = \\ln w$.',
    short: 'Das Minus bleibt: $e^{-kx} = w \\Leftrightarrow -kx = \\ln w$.',
  },
  'eq-ln-of-sum': {
    detailed:
      'Für den Logarithmus einer Summe gibt es kein Gesetz: $\\ln(a + b) \\neq \\ln a + \\ln b$. Nur Produkte und Quotienten lassen sich auseinanderziehen. Lass $\\ln(a + b)$ so stehen.',
    short: '$\\ln(a + b) \\neq \\ln a + \\ln b$.',
  },
  'eq-exp-of-sum': {
    detailed: 'Eine Summe in der Hochzahl wird zu einem Produkt, nicht zu einer Summe: $e^{a + b} = e^a \\cdot e^b \\neq e^a + e^b$. Schreibe einfach $e^{a + b}$.',
    short: '$e^{a + b} = e^a \\cdot e^b$, nicht $e^a + e^b$.',
  },
  'eq-log-base-forgotten': {
    detailed:
      'Nur bei der Basis $e$ hebt der $\\ln$ die Potenz ganz auf. Bei einer anderen Basis bleibt ein Faktor stehen: $\\ln\\left(a^x\\right) = x \\ln a$.',
    short: '$\\ln\\left(a^x\\right) = x\\ln a$: der Faktor $\\ln a$ bleibt.',
  },
  'eq-divide-inside-ln': {
    detailed: 'Teilst du beide Seiten durch $k$, wird der ganze $\\ln$ geteilt, nicht das, was in ihm steht: $\\frac{\\ln w}{k} \\neq \\ln\\frac{w}{k}$.',
    short: 'Den ganzen $\\ln$ teilen: $\\frac{\\ln w}{k} \\neq \\ln\\frac{w}{k}$.',
  },
  'eq-log-product': {
    detailed: 'Der Logarithmus macht aus einem Produkt eine Summe: $\\ln(u \\cdot v) = \\ln u + \\ln v$. Ein Produkt von Logarithmen entsteht dabei nicht.',
    short: '$\\ln(u \\cdot v) = \\ln u + \\ln v$.',
  },
  'eq-log-sum': {
    detailed: 'Eine Summe von Logarithmen wird zum Logarithmus eines Produkts: $\\ln u + \\ln v = \\ln(u \\cdot v)$, nicht $\\ln(u + v)$.',
    short: '$\\ln u + \\ln v = \\ln(u \\cdot v)$.',
  },
  'eq-log-quotient': {
    detailed: 'Eine Differenz von Logarithmen wird zum Logarithmus eines Quotienten: $\\ln u - \\ln v = \\ln\\frac{u}{v}$. Der Bruch steht im $\\ln$, nicht zwischen zwei Logarithmen.',
    short: '$\\ln u - \\ln v = \\ln\\frac{u}{v}$.',
  },
  'eq-power-sum': {
    detailed: 'Eine Summe in der Hochzahl wird zu einem Produkt: $a^{x + 1} = a^x \\cdot a^1 = a \\cdot a^x$. Als Summe $a^x + a$ stimmt es nicht.',
    short: '$a^{x + 1} = a \\cdot a^x$, nicht $a^x + a$.',
  },
  'eq-inverse-forgotten': {
    detailed:
      'Gegen eine Funktion hilft ihre Umkehrfunktion, auf beiden Seiten: aus $\\sin u = w$ wird $u = \\arcsin w$, aus $\\arctan u = w$ wird $u = \\tan w$. Lässt du die Funktion nur weg, stimmt die Gleichung nicht mehr.',
    short: 'Auf beiden Seiten die Umkehrfunktion: $\\sin u = w \\Leftrightarrow u = \\arcsin w$.',
  },
  'eq-inverse-reciprocal': {
    detailed:
      'Die Umkehrfunktion ist nicht der Kehrwert: $\\arcsin w \\neq \\frac{1}{\\sin w}$. Die Taste $\\sin^{-1}$ auf dem Taschenrechner meint die Umkehrfunktion $\\arcsin$. Gegen $\\tan$ hilft $\\arctan$, gegen $\\sinh$ hilft $\\operatorname{arsinh}$.',
    short: 'Umkehrfunktion, nicht Kehrwert: $\\arctan w \\neq \\frac{1}{\\tan w}$.',
  },
  'eq-divide-inside-arc': {
    detailed: 'Teilst du beide Seiten durch $k$, wird die ganze Umkehrfunktion geteilt, nicht das, was in ihr steht: $\\frac{\\arcsin w}{k} \\neq \\arcsin\\frac{w}{k}$.',
    short: 'Die ganze Umkehrfunktion teilen: $\\frac{\\arcsin w}{k} \\neq \\arcsin\\frac{w}{k}$.',
  },
  'eq-pythagoras-square': {
    detailed:
      'Aus $\\sin^2 u + \\cos^2 u = 1$ folgt $\\sin^2 u = 1 - \\cos^2 u$: Das Quadrat bleibt stehen. $1 - \\cos u$ ist etwas anderes. Bei Hyperbelfunktionen gilt dasselbe: $\\sinh^2 u = \\cosh^2 u - 1$.',
    short: '$\\sin^2 u = 1 - \\cos^2 u$, mit Quadrat.',
  },
  'eq-hyperbolic-sign': {
    detailed:
      'Bei den Hyperbelfunktionen gilt $\\cosh^2 u - \\sinh^2 u = 1$, mit Minus, nicht eine Summe wie bei $\\sin$ und $\\cos$. Also ist $\\sinh^2 u = \\cosh^2 u - 1$ und $\\cosh^2 u = 1 + \\sinh^2 u$.',
    short: '$\\cosh^2 u - \\sinh^2 u = 1$, also $\\sinh^2 u = \\cosh^2 u - 1$.',
  },
  'eq-tan-flipped': {
    detailed:
      '$\\tan u = \\frac{\\sin u}{\\cos u}$: Der Sinus steht oben. Teilst du durch $\\cos u$, wird aus $\\sin u$ der $\\tan u$ und aus $\\cos u$ die $1$. Teilst du durch $\\sin u$, entsteht $\\frac{\\cos u}{\\sin u} = \\frac{1}{\\tan u}$, nicht $\\tan u$. Bei $\\sinh$ und $\\cosh$ genauso mit $\\tanh u = \\frac{\\sinh u}{\\cosh u}$.',
    short: '$\\tan u = \\frac{\\sin u}{\\cos u}$, nicht $\\frac{\\cos u}{\\sin u}$.',
  },
  'eq-divide-cos-partly': {
    detailed:
      'Ein Bruch behält seinen Wert nur, wenn du Zähler und Nenner durch dasselbe teilst; bei einer Gleichung teilst du beide Seiten. Teilst du nur einen Teil durch $\\cos u$, ändert sich der Wert.',
    short: 'Zähler und Nenner (bzw. beide Seiten) durch $\\cos u$ teilen.',
  },
  'eq-substitute-power': {
    detailed:
      'Die Hochzahl $2x$ heißt „zweimal malnehmen", nicht „mal 2": Mit $u = e^x$ ist $e^{2x} = \\left(e^x\\right)^2 = u^2$. Genauso ist mit $u = \\sqrt{x}$ dann $x = \\left(\\sqrt{x}\\right)^2 = u^2$ und mit $u = x^2$ dann $x^4 = u^2$.',
    short: '$e^{2x} = \\left(e^x\\right)^2 = u^2$, nicht $2u$.',
  },
  'eq-substitute-reciprocal': {
    detailed: 'Ein Minus in der Hochzahl heißt Kehrwert, nicht Minus davor: $e^{-x} = \\frac{1}{e^x} = \\frac{1}{u}$. Mit $-u$ hättest du $-e^x$ eingesetzt.',
    short: '$e^{-x} = \\frac{1}{e^x} = \\frac{1}{u}$, nicht $-u$.',
  },
  'eq-pq-sign': {
    detailed:
      'Für $u^2 + pu + q = 0$ gilt $u_{1,2} = -\\frac{p}{2} \\pm \\sqrt{\\left(\\frac{p}{2}\\right)^2 - q}$. Vorn steht $-\\frac{p}{2}$: Lies $p$ mit seinem Vorzeichen ab, dann wechselt es. Bei $u^2 - 2yu - 1 = 0$ ist $p = -2y$, also $-\\frac{p}{2} = y$.',
    short: 'Vorn steht $-\\frac{p}{2}$: Das Vorzeichen von $p$ wechselt.',
  },
  'eq-pq-q-sign': {
    detailed:
      'Unter der Wurzel steht $\\left(\\frac{p}{2}\\right)^2 - q$. Lies $q$ mit seinem Vorzeichen ab: Bei $u^2 - 2yu - 1 = 0$ ist $q = -1$, unter der Wurzel steht also $y^2 + 1$.',
    short: 'Unter der Wurzel $\\left(\\frac{p}{2}\\right)^2 - q$: Das Vorzeichen von $q$ wechselt.',
  },
  'eq-pq-half': {
    detailed: 'Unter der Wurzel steht das Quadrat von $\\frac{p}{2}$, nicht von $p$: $\\left(\\frac{p}{2}\\right)^2 = \\frac{p^2}{4}$.',
    short: '$\\left(\\frac{p}{2}\\right)^2 = \\frac{p^2}{4}$, nicht $p^2$.',
  },
  'eq-spurious-root': {
    detailed:
      'Die $pq$-Formel liefert zwei Lösungen, aber nicht jede passt zur Aufgabe. Prüfe, welche Werte möglich sind: $u = e^x$ ist immer positiv, $u = \\sqrt{x}$ und $u = x^2$ sind nie negativ, und $x$ muss positiv sein und die Bedingungen der Aufgabe erfüllen. Die andere Lösung ist eine Scheinlösung.',
    short: 'Nicht jede Lösung passt: $e^x$ ist zum Beispiel immer positiv.',
  },
  'eq-not-resubstituted': {
    detailed: 'Die $pq$-Formel liefert $u$, gesucht ist aber $x$. Setze für $u$ wieder den Baustein ein, zum Beispiel $e^x$, und löse dann nach $x$ auf.',
    short: 'Zurück einsetzen: $u$ ist noch nicht $x$.',
  },
  // Werkzeuge der Stufe 5 (Schritt 7a): Integrale
  'eq-partial-factor': {
    detailed:
      'Die Partialbrüche müssen zusammen wieder den Bruch ergeben. Rechne zur Probe zurück: $\\frac{1}{t} - \\frac{1}{t + b} = \\frac{b}{t(t + b)}$, also fehlt noch der Faktor $\\frac{1}{b}$. Die Zahlen vor den Partialbrüchen bekommst du, indem du die Nullstellen der Nennerfaktoren einsetzt.',
    short: 'Probe: Die Partialbrüche zusammen müssen den Bruch ergeben, oft fehlt ein Faktor.',
  },
  'eq-int-inner-factor': {
    detailed:
      'Leite deine Stammfunktion zur Probe ab: Bei $\\ln\\left(t^2 + a^2\\right)$ oder $e^{2t}$ kommt mit der Kettenregel die innere Ableitung als Faktor dazu. Damit die Ableitung genau den Integranden ergibt, musst du beim Integrieren durch diesen Faktor teilen, z. B. $\\int e^{2t}\\,\\mathrm{d}t = \\frac{1}{2}e^{2t}$.',
    short: 'Probe durch Ableiten: Durch die innere Ableitung teilen.',
  },
  'eq-int-derived': {
    detailed:
      'Integrieren ist die Umkehrung des Ableitens. Hier wurde abgeleitet: Bei $e^{kt}$ kommt der Faktor $k$ beim Ableiten dazu, beim Integrieren wird durch $k$ geteilt. Probe: Die Ableitung der Stammfunktion muss wieder der Integrand sein.',
    short: 'Integrieren ist die Umkehrung des Ableitens: durch $k$ teilen, nicht malnehmen.',
  },
  'eq-int-power': {
    detailed:
      'Bei der Potenzregel fürs Integrieren steigt der Exponent um $1$, und du teilst durch den neuen Exponenten: $\\int t^n\\,\\mathrm{d}t = \\frac{t^{n + 1}}{n + 1}$. Probe: Leite das Ergebnis ab, dann muss wieder $t^n$ herauskommen.',
    short: 'Durch den neuen Exponenten teilen: $\\frac{t^{n + 1}}{n + 1}$.',
  },
  'eq-int-sign': {
    detailed:
      "Achte auf die Vorzeichen: $\\int \\sin t\\,\\mathrm{d}t = -\\cos t$, weil $(\\cos t)' = -\\sin t$. Und ein Minus vor einem Partialbruch bleibt auch vor seinem $\\ln$ stehen: $\\int \\left(\\frac{1}{t} - \\frac{1}{t + b}\\right)\\mathrm{d}t = \\ln t - \\ln(t + b)$.",
    short: 'Vorzeichen prüfen: $\\int \\sin t\\,\\mathrm{d}t = -\\cos t$.',
  },
  'eq-int-bounds-swapped': {
    detailed:
      'Beim Einsetzen der Grenzen kommt die obere Grenze zuerst: $\\int_a^x f(t)\\,\\mathrm{d}t = F(x) - F(a)$. Mit vertauschten Grenzen ändert sich das Vorzeichen des Ergebnisses.',
    short: 'Obere minus untere Grenze: $F(x) - F(a)$.',
  },
  'eq-int-lower-forgotten': {
    detailed:
      'Auch die untere Grenze wird eingesetzt und abgezogen, selbst wenn sie $0$ ist: $F(0)$ ist oft nicht $0$, z. B. $e^0 = 1$ oder $\\ln a$. Also $\\int_0^x f(t)\\,\\mathrm{d}t = F(x) - F(0)$.',
    short: 'Die untere Grenze nicht vergessen: $F(x) - F(0)$.',
  },
  // Werkzeuge der Stufe 5 (Schritt 7b): Summen, Reihen, Grenzwerte
  'eq-sum-count': {
    detailed:
      'In der Formel $\\sum_{k=0}^{m-1} q^k = \\frac{q^m - 1}{q - 1}$ steht im Exponenten die Anzahl $m$ der Summanden. Zähle nach: Von $k = 0$ bis $k = n - 1$ sind es $n$ Summanden, von $k = 0$ bis $k = n$ sind es $n + 1$, von $k = 1$ bis $k = n$ wieder $n$.',
    short: 'Im Exponenten steht die Anzahl der Summanden: von $k = 0$ bis $n - 1$ sind es $n$.',
  },
  'eq-series-start': {
    detailed:
      'Die Formeln $\\sum_{k=0}^{\\infty} q^k = \\frac{1}{1 - q}$ und $\\sum_{k=0}^{n-1} q^k = \\frac{q^n - 1}{q - 1}$ beginnen mit dem Summanden $q^0 = 1$. Beginnt die Summe bei $k = 1$, ist der erste Summand $q$: Klammere ihn aus, $\\sum_{k=1}^{\\infty} q^k = q\\sum_{k=0}^{\\infty} q^k$. Genauso bei der abgeleiteten Reihe: $\\sum_{k=1}^{\\infty} kq^k = q\\sum_{k=1}^{\\infty} kq^{k-1}$.',
    short: 'Auf den ersten Summanden achten: Beginnt die Summe mit $q$ statt mit $1$, kommt der Faktor $q$ dazu.',
  },
  'eq-series-sign': {
    detailed:
      'Für $0 < q < 1$ geht $q^n$ gegen $0$: Aus $\\frac{q^n - 1}{q - 1}$ wird $\\frac{-1}{q - 1} = \\frac{1}{1 - q}$. Die Reihe ist dann positiv, $\\frac{1}{q - 1}$ wäre negativ. Bei der endlichen Summe stehen oben und unten die Summanden in derselben Reihenfolge: $\\frac{q^n - 1}{q - 1}$ oder $\\frac{1 - q^n}{1 - q}$. Und $\\sum_{k=1}^{\\infty} \\frac{q^k}{k} = -\\ln(1 - q)$ hat ein Minus, denn $\\ln(1 - q)$ ist negativ.',
    short: 'Vorzeichen prüfen: Für $0 < q < 1$ ist $\\sum_{k=0}^{\\infty} q^k = \\frac{1}{1 - q}$ positiv.',
  },
  'eq-series-not-geometric': {
    detailed:
      'In einer geometrischen Reihe entsteht jeder Summand aus dem vorigen durch Malnehmen mit $q$. Steht $k$ vor oder unter $q^k$, ist das nicht so. $\\sum_{k=1}^{\\infty} kq^{k-1} = \\frac{1}{(1 - q)^2}$ ist die abgeleitete geometrische Reihe, $\\sum_{k=1}^{\\infty} \\frac{q^k}{k} = -\\ln(1 - q)$ die integrierte.',
    short: 'Mit $k$ im Summanden: abgeleitete bzw. integrierte geometrische Reihe.',
  },
  'eq-lim-one': {
    detailed:
      '„1 hoch unendlich" hat keinen festen Wert: Die Klammer geht gegen $1$, aber die Hochzahl wächst über alle Grenzen. Beides wirkt gegeneinander, und es gilt $\\lim_{n \\to \\infty}\\left(1 + \\frac{x}{n}\\right)^n = e^x$.',
    short: '„1 hoch unendlich" ist nicht $1$: $\\left(1 + \\frac{x}{n}\\right)^n \\to e^x$.',
  },
  'eq-lim-exponent': {
    detailed:
      'Steht in der Hochzahl ein Vielfaches von $n$, nimmst du den Faktor mit: $\\left(1 + \\frac{x}{n}\\right)^{sn} = \\left(\\left(1 + \\frac{x}{n}\\right)^n\\right)^s \\to \\left(e^x\\right)^s = e^{sx}$.',
    short: 'Der Faktor in der Hochzahl bleibt: $\\left(1 + \\frac{x}{n}\\right)^{sn} \\to e^{sx}$.',
  },
  'eq-lim-denominator': {
    detailed:
      'Im Bruch wirkt auch der Nenner. Teile Zähler und Nenner durch $n$: $\\left(\\frac{n + p}{n + r}\\right)^n = \\frac{\\left(1 + \\frac{p}{n}\\right)^n}{\\left(1 + \\frac{r}{n}\\right)^n} \\to \\frac{e^p}{e^r} = e^{p - r}$.',
    short: 'Der Nenner zählt mit: $\\left(\\frac{n + p}{n + r}\\right)^n \\to e^{p - r}$.',
  },
  // Werkzeuge der Stufe 5 (Schritt 7c): Differentialgleichungen
  'eq-ode-initial-unused': {
    detailed:
      "Prüfe die Anfangswerte, indem du $x = 0$ einsetzt. Bei $f' = kf$ ist $f(x) = Ce^{kx}$, und $f(0) = C$ legt die Konstante fest. Bei $f'' = k^2 f$ gibt es zwei Lösungen, $e^{kx}$ und $e^{-kx}$, also zwei Konstanten: $f(x) = C_1e^{kx} + C_2e^{-kx}$. Beide Anfangswerte werden gebraucht: $C_1 + C_2 = f(0)$ und $k(C_1 - C_2) = f'(0)$.",
    short: "Setze $x = 0$ ein, dann muss $f(0)$ herauskommen: Bei $f' = kf$ ist $C = f(0)$, bei $f'' = k^2 f$ braucht es beide Anfangswerte.",
  },
  'eq-ode-not-halved': {
    detailed:
      "Prüfe beide Anfangswerte bei $x = 0$: Mit $e^0 = 1$ ist $f(0) = C_1 + C_2$ und $f'(0) = k(C_1 - C_2)$. Ein Anfangswert verteilt sich auf zwei Konstanten. Nimmst du für jede den ganzen Wert, kommt bei $x = 0$ das Doppelte heraus.",
    short: "Probe bei $x = 0$: $C_1 + C_2 = f(0)$ und $k(C_1 - C_2) = f'(0)$, sonst kommt das Doppelte heraus.",
  },
  'eq-ode-inner-factor': {
    detailed:
      "Leite den Ansatz mit der Kettenregel ab: $\\left(e^{kx}\\right)' = ke^{kx}$ und $\\left(e^{-kx}\\right)' = -ke^{-kx}$. Bei $x = 0$ ist also $f'(0) = k(C_1 - C_2)$, mit dem Faktor $k$.",
    short: "$\\left(e^{kx}\\right)' = ke^{kx}$: In $f'(0) = k(C_1 - C_2)$ steht der Faktor $k$.",
  },
  'eq-ode-oscillation': {
    detailed:
      "$\\cos(kx)$ und $\\sin(kx)$ lösen $f'' = -k^2 f$, die Schwingung: $\\left(\\cos(kx)\\right)'' = -k^2\\cos(kx)$. Hier steht $f'' = k^2 f$ ohne Minus. Der Ansatz $e^{\\lambda x}$ ergibt $\\lambda^2 = k^2$, also $\\lambda = \\pm k$: Die Lösungen sind $e^{kx}$ und $e^{-kx}$.",
    short: "$f'' = +k^2 f$ hat die Lösungen $e^{kx}$ und $e^{-kx}$, nicht $\\cos$ und $\\sin$.",
  },
  'eq-ode-root': {
    detailed:
      "Setze den Ansatz $e^{\\lambda x}$ in $f'' = k^2 f$ ein: $\\lambda^2 e^{\\lambda x} = k^2 e^{\\lambda x}$, also $\\lambda^2 = k^2$. In die Hochzahl kommt $\\lambda = \\pm k$, die Wurzel aus der Zahl vor $f$: Bei $f'' = 4f$ ist $\\lambda^2 = 4$ und $\\lambda = \\pm 2$.",
    short: "$\\lambda^2 = k^2 \\Rightarrow \\lambda = \\pm k$: Bei $f'' = 4f$ steht $e^{\\pm 2x}$ da.",
  },
  'eq-ode-constant-added': {
    detailed:
      "Die Konstante steht als Faktor vor der e-Funktion: $e^{kx + C} = e^C \\cdot e^{kx}$, also $f(x) = Ce^{kx}$. Probe: Mit $f(x) = e^{kx} + C$ wäre $f' = ke^{kx}$, aber $kf = ke^{kx} + kC$. Die Differentialgleichung stimmt dann nicht.",
    short: "$f(x) = Ce^{kx}$: Die Konstante ist ein Faktor, denn $e^{kx + C} = e^C \\cdot e^{kx}$.",
  },
  'eq-ode-exp-sign': {
    detailed:
      "Das Vorzeichen in der Gleichung bestimmt die Hochzahl: $f' = kf$ hat $e^{kx}$ (Wachstum), $f' = -kf$ hat $e^{-kx}$ (Abnahme). Beim Abkühlen $f' = k(b - f)$ nähert sich $f$ dem Endwert $b$, der Abstand nimmt ab wie $e^{-kx}$. Probe: Leite ab und vergleiche mit der rechten Seite.",
    short: "$f' = -kf$ gibt $e^{-kx}$, $f' = kf$ gibt $e^{kx}$; beim Abkühlen $e^{-kx}$.",
  },
  'eq-ode-constant-start': {
    detailed:
      "Bei $f' = k(b - f)$ ist $f(x) = b + Ce^{-kx}$: $b$ ist der Endwert, $Ce^{-kx}$ der Abstand dazu. Setze $x = 0$ ein: $f(0) = b + C$. Die Konstante ist also nicht der Anfangswert selbst, sondern sein Abstand zum Endwert.",
    short: "Probe bei $x = 0$: $f(0) = b + C$, die Konstante ist der Abstand zum Endwert.",
  },
}

export function explainRearrangeError(id: string): Explanation {
  const text = REARRANGE_ERROR_TEXTS[id]
  if (!text) throw new Error(`Kein Text zur Fehlerregel ${id}`)
  return text
}

// --- Was machst du als Nächstes? (Irrwege, je Art des Schritts) ---

// Eine Umformung, die das Ziel der Frage nicht erreicht, mit Erklärung
export type WrongMove = { readonly label: string; readonly why: Explanation }

const ONE_SIDED: Explanation = {
  detailed:
    'Eine Gleichung ist wie eine Waage: Was du auf einer Seite rechnest, musst du auch auf der anderen rechnen. Sonst stimmt sie nicht mehr.',
  short: 'Immer auf beiden Seiten dasselbe rechnen.',
}

// „auf der linken Seite", „nur die linke Seite"
const sideName = (side: 'lhs' | 'rhs') => (side === 'lhs' ? 'linken' : 'rechten')
const sideAccusative = (side: 'lhs' | 'rhs') => (side === 'lhs' ? 'linke' : 'rechte')
// Faktor in einer Umformung, Summen in Klammern: „mal $(b - 2)$"
const factorText = (e: Expr) => (e.kind === 'add' || e.kind === 'neg' ? `$(${toLatex(e)})$` : m(e))

// Summand mit Vorzeichen als Text: „$+c$", „$-\frac{b}{c}$"
export const signed = (term: Expr, negative: boolean) => `$${negative ? '-' : '+'}${toLatex(term)}$`

export function addMoves(term: string, opposite: string, side: 'lhs' | 'rhs', divisor: Expr | null): WrongMove[] {
  return [
    {
      label: `Auf beiden Seiten ${term}`,
      why: {
        detailed: `Damit kommt ${term} noch einmal dazu, statt zu verschwinden. Die Gegenrechnung zu ${term} ist ${opposite}.`,
        short: `Gegenrechnung zu ${term} ist ${opposite}.`,
      },
    },
    ...(divisor
      ? [
          {
            label: `Beide Seiten durch ${m(divisor)}`,
            why: {
              detailed: `Teilen hilft gegen einen Faktor, nicht gegen einen Summanden. Nach dem Teilen steht ${m(divisor)} immer noch als Teil der Summe da.`,
              short: 'Teilen hilft nur gegen Faktoren, nicht gegen Summanden.',
            },
          },
        ]
      : []),
    { label: `Nur auf der ${sideName(side)} Seite ${opposite}`, why: ONE_SIDED },
  ]
}

export function moveMoves(term: Expr, side: 'lhs' | 'rhs'): WrongMove[] {
  const t = toLatex(term)
  return [
    {
      label: `Das Minus vor $${t}$ einfach weglassen`,
      why: { detailed: 'Ein Minus darfst du nicht einfach weglassen, dann stimmt die Gleichung nicht mehr. Bringe den Summanden auf die andere Seite: Dort steht er mit Plus.', short: 'Das Minus nicht weglassen, sondern den Summanden rüberbringen.' },
    },
    {
      label: `Auf beiden Seiten $-${t}$`,
      why: { detailed: `Damit steht dort zweimal $-${t}$, statt dass es verschwindet. Die Gegenrechnung zu einem Minus ist ein Plus.`, short: 'Gegenrechnung zu einem Minus ist ein Plus.' },
    },
    { label: `Nur auf der ${sideName(side)} Seite $+${t}$`, why: ONE_SIDED },
  ]
}

export function divideMoves(divisor: Expr, side: 'lhs' | 'rhs' | null): WrongMove[] {
  const d = m(divisor)
  return [
    {
      label: `Beide Seiten mal ${factorText(divisor)}`,
      why: { detailed: `Malnehmen macht den Faktor ${d} nur größer. Die Gegenrechnung zum Malnehmen ist das Teilen.`, short: 'Gegenrechnung zum Malnehmen ist das Teilen.' },
    },
    {
      label: `Auf beiden Seiten ${divisor.kind === 'add' ? `$-(${toLatex(divisor)})$` : `$-${toLatex(divisor)}$`}`,
      why: { detailed: `Abziehen hilft gegen einen Summanden, nicht gegen einen Faktor. ${d} bleibt danach als Faktor stehen.`, short: 'Abziehen hilft nur gegen Summanden.' },
    },
    ...(side ? [{ label: `Nur die ${sideAccusative(side)} Seite durch ${factorText(divisor)}`, why: ONE_SIDED }] : []),
  ]
}

export function multiplyMoves(denominator: Expr, side: 'lhs' | 'rhs' | null, cancelInside: boolean): WrongMove[] {
  const d = m(denominator)
  return [
    {
      label: `Beide Seiten durch ${factorText(denominator)}`,
      why: { detailed: `Teilen macht den Nenner nur größer, ${d} steht dann zweimal unten. Gegen einen Nenner hilft das Malnehmen.`, short: 'Gegen einen Nenner hilft das Malnehmen.' },
    },
    ...(side ? [{ label: `Nur die ${sideAccusative(side)} Seite mal ${factorText(denominator)}`, why: ONE_SIDED }] : []),
    ...(cancelInside
      ? [
          {
            label: 'Im Bruch die Variable oben und unten wegkürzen',
            why: { detailed: 'Kürzen darfst du nur ganze Faktoren, nicht Teile einer Summe. Im Zähler und im Nenner stehen hier Summen.', short: 'Aus Summen darf man nicht kürzen.' },
          },
        ]
      : [
          {
            label: `Auf beiden Seiten ${denominator.kind === 'add' ? `$+(${toLatex(denominator)})$` : `$+${toLatex(denominator)}$`}`,
            why: { detailed: 'Addieren hilft nicht gegen einen Nenner: Der Bruch bleibt ein Bruch.', short: 'Addieren beseitigt keinen Nenner.' },
          },
        ]),
  ]
}

export function negateMoves(side: 'lhs' | 'rhs'): WrongMove[] {
  return [
    { label: 'Das Minus einfach weglassen', why: { detailed: 'Ein Minus darfst du nicht einfach weglassen, dann stimmt die Gleichung nicht mehr. Nimm beide Seiten mal $(-1)$.', short: 'Nicht weglassen: beide Seiten mal $(-1)$.' } },
    { label: `Nur die ${sideAccusative(side)} Seite mal $(-1)$`, why: ONE_SIDED },
  ]
}

export function reciprocalMoves(target: string, side: 'lhs' | 'rhs'): WrongMove[] {
  return [
    { label: `Kehrwert nur auf der ${sideName(side)} Seite`, why: ONE_SIDED },
    {
      label: `Beide Seiten durch $${target}$`,
      why: { detailed: `Dann steht $${target}$ zweimal im Nenner, statt herauszukommen. Steht auf beiden Seiten genau ein Bruch, drehst du beide um.`, short: 'Dann steht die Variable zweimal im Nenner.' },
    },
  ]
}

export const COMBINE_MOVES: readonly WrongMove[] = [
  { label: 'Von jedem Bruch einzeln den Kehrwert nehmen', why: REARRANGE_ERROR_TEXTS['eq-reciprocal-termwise'] },
  {
    label: 'Zähler minus Zähler und Nenner minus Nenner rechnen',
    why: { detailed: 'Brüche fasst du über den Hauptnenner zusammen: erweitern, dann nur die Zähler zusammenrechnen. Die Nenner werden nicht abgezogen.', short: 'Über den Hauptnenner zusammenfassen, Nenner nicht abziehen.' },
  },
]

// Zusammenfassen, bevor mit dem Nenner (mit der Variable) malgenommen wird
export const COMBINE_BEFORE_MULTIPLY_MOVES: readonly WrongMove[] = [
  COMBINE_MOVES[1],
  {
    label: 'Die Nenner auf dieser Seite einfach weglassen',
    why: {
      detailed: 'Einen Nenner darfst du nicht einfach weglassen, dann ändert sich der Wert der Seite. Fasse die Seite über den Hauptnenner zu einem Bruch zusammen.',
      short: 'Nenner nicht weglassen, sondern zusammenfassen.',
    },
  },
]

// Zusammenfassen, bevor die Wurzel gezogen wird
export const COMBINE_BEFORE_ROOT_MOVES: readonly WrongMove[] = [
  { label: 'Die Wurzel aus jedem Summanden einzeln ziehen', why: REARRANGE_ERROR_TEXTS['eq-root-termwise'] },
  COMBINE_BEFORE_MULTIPLY_MOVES[1],
]

// Zusammenfassen, bevor quadriert wird
export const COMBINE_BEFORE_SQUARE_MOVES: readonly WrongMove[] = [
  {
    label: 'Jeden Summanden einzeln quadrieren',
    why: { detailed: 'Eine Summe quadrierst du nicht Summand für Summand: $(a + b)^2 = a^2 + 2ab + b^2$. Fasse die Seite zuerst zu einem Bruch zusammen, dann quadrierst du Zähler und Nenner.', short: 'Nicht Summand für Summand quadrieren.' },
  },
  COMBINE_BEFORE_MULTIPLY_MOVES[1],
]

// Zusammenfassen, bevor logarithmiert wird
export const COMBINE_BEFORE_LOG_MOVES: readonly WrongMove[] = [
  { label: 'Von jedem Summanden einzeln den $\\ln$ nehmen', why: REARRANGE_ERROR_TEXTS['eq-ln-of-sum'] },
  COMBINE_BEFORE_MULTIPLY_MOVES[1],
]

// e hoch beide Seiten (log: \ln bzw. \log_a als LaTeX, base: e bzw. a)
export function expMoves(logLatex: string, base: string, side: 'lhs' | 'rhs'): WrongMove[] {
  return [
    { label: `Den $${logLatex}$ einfach weglassen`, why: REARRANGE_ERROR_TEXTS['eq-exp-forgotten'] },
    {
      label: `Beide Seiten durch $${logLatex}$ teilen`,
      why: {
        detailed: `$${logLatex}$ ist keine Zahl, sondern eine Rechenvorschrift; durch sie kannst du nicht teilen. Gegen den Logarithmus hilft $${base}$ hoch.`,
        short: `Gegen den Logarithmus hilft $${base}$ hoch.`,
      },
    },
    { label: `Nur die ${sideAccusative(side)} Seite als Hochzahl von $${base}$ schreiben`, why: ONE_SIDED },
  ]
}

// Logarithmieren
export function logMoves(side: 'lhs' | 'rhs' | null): WrongMove[] {
  return [
    { label: 'Die Hochzahl einfach herunterholen', why: REARRANGE_ERROR_TEXTS['eq-ln-forgotten'] },
    {
      label: 'Auf beiden Seiten die Wurzel ziehen',
      why: { detailed: 'Die Wurzel hilft gegen ein Quadrat. Steht die Variable in der Hochzahl, hilft der Logarithmus.', short: 'Gegen die Variable in der Hochzahl hilft der $\\ln$.' },
    },
    ...(side ? [{ label: `Nur die ${sideAccusative(side)} Seite logarithmieren`, why: ONE_SIDED }] : []),
  ]
}

// Logarithmen zusammenfassen
export const LOG_COMBINE_MOVES: readonly WrongMove[] = [
  { label: 'Zum $\\ln$ der Summe der beiden Terme zusammenfassen', why: REARRANGE_ERROR_TEXTS['eq-log-sum'] },
  { label: 'Durch den zweiten Logarithmus teilen', why: REARRANGE_ERROR_TEXTS['eq-log-quotient'] },
  {
    label: 'Jeden Logarithmus einzeln mit $e$ hoch auflösen',
    why: { detailed: '$e$ hoch eine Summe ist ein Produkt: $e^{\\ln u + \\ln v} = u \\cdot v$, nicht $u + v$. Fasse die Logarithmen zuerst zu einem einzigen zusammen.', short: 'Erst zu einem einzigen Logarithmus zusammenfassen.' },
  },
]

// Logarithmusgesetze anwenden
export const LOG_LAW_MOVES: readonly WrongMove[] = [
  { label: 'Den $\\ln$ des Produkts als Produkt der Logarithmen schreiben', why: REARRANGE_ERROR_TEXTS['eq-log-product'] },
  { label: 'Die Hochzahl herunterholen und den Faktor $\\ln a$ weglassen', why: REARRANGE_ERROR_TEXTS['eq-log-base-forgotten'] },
  {
    label: 'Den $\\ln$ auf beiden Seiten einfach weglassen',
    why: { detailed: 'Der $\\ln$ steht auf beiden Seiten, weil du gerade logarithmiert hast. Weglassen würde das rückgängig machen. Ziehe ihn mit den Logarithmusgesetzen auseinander, dann kommt die Hochzahl als Faktor herunter.', short: 'Nicht weglassen, mit den Gesetzen auseinanderziehen.' },
  },
]

// Potenzgesetz
export const POWER_LAW_MOVES: readonly WrongMove[] = [
  { label: '$a^{x + 1}$ als $a^x + a$ schreiben', why: REARRANGE_ERROR_TEXTS['eq-power-sum'] },
  { label: 'Von jedem Summanden einzeln den $\\ln$ nehmen', why: REARRANGE_ERROR_TEXTS['eq-ln-of-sum'] },
  {
    label: 'Die Hochzahlen einfach weglassen',
    why: { detailed: 'Ohne die Hochzahlen ändert sich der Wert. Zerlege die Potenzen mit $a^{m + n} = a^m \\cdot a^n$, bis überall dieselbe Potenz steht.', short: 'Hochzahlen nicht weglassen.' },
  },
]

// Umkehrfunktion auf beiden Seiten (fn: \sin, arc: \arcsin, als LaTeX)
export function arcMoves(fnLatex: string, arcLatex: string, side: 'lhs' | 'rhs'): WrongMove[] {
  return [
    { label: `Den $${fnLatex}$ einfach weglassen`, why: REARRANGE_ERROR_TEXTS['eq-inverse-forgotten'] },
    { label: `Auf beiden Seiten den Kehrwert $\\frac{1}{${fnLatex}}$ nehmen`, why: REARRANGE_ERROR_TEXTS['eq-inverse-reciprocal'] },
    {
      label: `Beide Seiten durch $${fnLatex}$ teilen`,
      why: {
        detailed: `$${fnLatex}$ ist keine Zahl, sondern eine Rechenvorschrift; durch sie kannst du nicht teilen. Gegen $${fnLatex}$ hilft die Umkehrfunktion $${arcLatex}$.`,
        short: `Gegen $${fnLatex}$ hilft $${arcLatex}$.`,
      },
    },
    { label: `Nur auf der ${sideName(side)} Seite $${arcLatex}$`, why: ONE_SIDED },
  ]
}

// Funktion auf beiden Seiten gegen eine Umkehrfunktion (arc: \arctan, fn: \tan, als LaTeX)
export function trigMoves(arcLatex: string, fnLatex: string, side: 'lhs' | 'rhs'): WrongMove[] {
  return [
    { label: `Den $${arcLatex}$ einfach weglassen`, why: REARRANGE_ERROR_TEXTS['eq-inverse-forgotten'] },
    {
      label: `Beide Seiten durch $${arcLatex}$ teilen`,
      why: {
        detailed: `$${arcLatex}$ ist keine Zahl, sondern eine Rechenvorschrift; durch sie kannst du nicht teilen. Gegen die Umkehrfunktion hilft die Funktion selbst: $${fnLatex}$.`,
        short: `Gegen $${arcLatex}$ hilft $${fnLatex}$.`,
      },
    },
    { label: `Nur auf der ${sideName(side)} Seite $${fnLatex}$`, why: ONE_SIDED },
  ]
}

// Quadrat ersetzen (square: das ersetzte Quadrat, partner: die andere Funktion ohne Quadrat, als LaTeX)
// plain: der Partner steht ohne Quadrat da (\cos^2 x und \sin x)
export function pythagorasMoves(square: string, partner: string, hyperbolic: boolean, plain = false): WrongMove[] {
  return [
    hyperbolic
      ? { label: `$${square}$ durch $1 - ${partner}^2$ ersetzen`, why: REARRANGE_ERROR_TEXTS['eq-hyperbolic-sign'] }
      : { label: `$${square}$ durch $1 - ${partner}$ ersetzen`, why: REARRANGE_ERROR_TEXTS['eq-pythagoras-square'] },
    plain
      ? {
          label: `Beide Seiten durch $${partner}$ teilen`,
          why: {
            detailed: `Dann steht $${square}$ im Zähler und $${partner}$ im Nenner, wieder zwei Funktionen. Ersetze besser das Quadrat, dann steht nur noch $${partner}$ da.`,
            short: 'Hilft nicht; besser das Quadrat ersetzen.',
          },
        }
      : {
          label: 'Die beiden Quadrate einfach zu $1$ zusammenfassen',
          why: {
            detailed: 'Zu $1$ zusammenfassen darfst du nur, wenn beide Quadrate genau so dastehen wie in der Formel, mit demselben Faktor. Ersetze stattdessen ein Quadrat durch das andere.',
            short: 'Nur bei gleichen Faktoren; besser ein Quadrat ersetzen.',
          },
        },
    {
      label: 'Auf beiden Seiten die Wurzel ziehen',
      why: {
        detailed: 'Die Wurzel aus einer Summe lässt sich nicht Summand für Summand ziehen. Sorge zuerst dafür, dass nur noch eine Funktion in der Gleichung steht.',
        short: 'Erst nur noch eine Funktion, dann weiter.',
      },
    },
  ]
}

// Durch \cos u teilen (sin, cos, tan: als LaTeX, z. B. \sin x, \cos x und \tan x)
export function tanQuotientMoves(sin: string, cos: string, tan: string, fraction: boolean): WrongMove[] {
  return [
    { label: fraction ? `Nur den Zähler durch $${cos}$ teilen` : `Nur die linke Seite durch $${cos}$ teilen`, why: REARRANGE_ERROR_TEXTS['eq-divide-cos-partly'] },
    { label: `Durch $${sin}$ teilen und $\\frac{${cos}}{${sin}}$ als $${tan}$ schreiben`, why: REARRANGE_ERROR_TEXTS['eq-tan-flipped'] },
    {
      label: `$${sin}$ und $${cos}$ gegeneinander kürzen`,
      why: {
        detailed: 'Kürzen darfst du nur gleiche Faktoren. $\\sin$ und $\\cos$ sind verschiedene Funktionen, und es stehen Summen da.',
        short: 'Verschiedene Funktionen lassen sich nicht kürzen.',
      },
    },
  ]
}

// Substituieren (block: der Baustein als LaTeX, z. B. e^{x}; kind: Art des Bausteins)
export function substituteMoves(block: string, kind: 'power' | 'root' | 'trig' | 'ln' | 'square', inverse: string | null): WrongMove[] {
  const first: WrongMove =
    kind === 'root'
      ? {
          label: 'Beide Seiten quadrieren',
          why: {
            detailed: 'Quadrierst du eine Summe mit $\\sqrt{x}$, entsteht ein Mittelglied, in dem $\\sqrt{x}$ wieder steht. Setze besser $u = \\sqrt{x}$, dann ist $x = u^2$ und die Gleichung quadratisch.',
            short: 'Die Wurzel bleibt; besser $u = \\sqrt{x}$ setzen.',
          },
        }
      : kind === 'square'
        ? {
            label: 'Auf beiden Seiten die Wurzel ziehen',
            why: {
              detailed: 'Die Wurzel aus einer Summe lässt sich nicht Summand für Summand ziehen. Setze besser $u = x^2$, dann ist $x^4 = u^2$ und die Gleichung quadratisch.',
              short: 'Wurzel aus einer Summe geht nicht; besser $u = x^2$ setzen.',
            },
          }
        : {
            label: `Auf beiden Seiten $${inverse ?? '\\ln'}$ nehmen`,
            why: {
              detailed: `$${inverse ?? '\\ln'}$ einer Summe lässt sich nicht Summand für Summand ausrechnen. Setze besser $u = ${block}$; dann wird die Gleichung quadratisch in $u$.`,
              short: `Nicht von einer Summe; besser $u = ${block}$ setzen.`,
            },
          }
  return [
    first,
    {
      label: 'Die Summanden mit $x$ zu einem zusammenfassen',
      why: {
        detailed: `Zusammenfassen kannst du nur gleichartige Summanden. Hier stehen verschiedene Potenzen von $${block}$, etwa $\\left(${block}\\right)^2$ und $${block}$.`,
        short: 'Verschiedene Potenzen lassen sich nicht zusammenfassen.',
      },
    },
    {
      label: `Durch $${block}$ teilen`,
      why: {
        detailed: `Danach steht $${block}$ immer noch mehrfach da, teils im Nenner. Setze $u = ${block}$, dann siehst du die quadratische Gleichung und kannst die $pq$-Formel nehmen.`,
        short: `Hilft nicht; besser $u = ${block}$ setzen.`,
      },
    },
  ]
}

// Quadratische Gleichung in u: alles nach links (u als LaTeX)
export function zeroMoves(u: string): WrongMove[] {
  return [
    {
      label: 'Auf beiden Seiten die Wurzel ziehen',
      why: {
        detailed: `Neben $${u}^2$ steht noch $${u}$ allein; die Wurzel aus einer Summe lässt sich nicht Summand für Summand ziehen. Für die $pq$-Formel muss alles auf einer Seite stehen und rechts $0$.`,
        short: 'Wurzel aus einer Summe geht nicht; erst alles nach links.',
      },
    },
    {
      label: `Beide Seiten durch $${u}$ teilen`,
      why: {
        detailed: `Dann steht $${u}$ immer noch zweimal da, einmal im Nenner. Bringe alles auf eine Seite, dann hilft die $pq$-Formel.`,
        short: 'Hilft nicht; erst alles nach links.',
      },
    },
    {
      label: `$${u}$ ausklammern und durch die Klammer teilen`,
      why: {
        detailed: `In der Klammer steht dann wieder $${u}$; so wird $${u}$ nicht allein. Bei $${u}^2$ und $${u}$ zusammen hilft die $pq$-Formel, dafür alles nach links.`,
        short: 'Die Klammer enthält wieder die Unbekannte.',
      },
    },
  ]
}

// Normalform: durch die Zahl vor u^2 teilen
export function normalizeMoves(u: string, lead: string): WrongMove[] {
  return [
    {
      label: 'Gleich die $pq$-Formel anwenden',
      why: {
        detailed: `Die $pq$-Formel gilt nur für die Normalform $${u}^2 + p${u} + q = 0$, mit einer $1$ vor $${u}^2$. Teile vorher durch $${lead}$.`,
        short: `Erst durch $${lead}$ teilen, dann $pq$-Formel.`,
      },
    },
    { label: `Nur den Summanden mit $${u}^2$ durch $${lead}$ teilen`, why: REARRANGE_ERROR_TEXTS['eq-divide-one-term'] },
    {
      label: 'Auf beiden Seiten die Wurzel ziehen',
      why: { detailed: `Neben $${u}^2$ stehen weitere Summanden; die Wurzel aus einer Summe geht nicht Summand für Summand.`, short: 'Wurzel aus einer Summe geht nicht.' },
    },
  ]
}

// pq-Formel
export function pqMoves(u: string): WrongMove[] {
  return [
    {
      label: 'Auf beiden Seiten die Wurzel ziehen',
      why: {
        detailed: `Neben $${u}^2$ stehen $p${u}$ und $q$; die Wurzel aus einer Summe geht nicht Summand für Summand. Die $pq$-Formel liefert die Lösungen direkt.`,
        short: 'Wurzel aus einer Summe geht nicht; $pq$-Formel.',
      },
    },
    {
      label: `$${u}$ ausklammern`,
      why: {
        detailed: `Ausklammern hilft nur, wenn kein Summand ohne $${u}$ dasteht. Hier bleibt $q$ übrig; nimm die $pq$-Formel.`,
        short: `Wegen $q$ hilft Ausklammern nicht.`,
      },
    },
    {
      label: `Beide Seiten durch $${u}$ teilen`,
      why: { detailed: `Dann steht $${u}$ im Nenner und weiter mehrfach da. Die $pq$-Formel liefert die Lösungen direkt.`, short: 'Hilft nicht; $pq$-Formel.' },
    },
  ]
}

// Zurück einsetzen (u: Buchstabe, block: Baustein, target: gesuchte Variable, als LaTeX)
export function resubstituteMoves(u: string, block: string, target: string): WrongMove[] {
  return [
    { label: `$${target} = ${u}$ setzen, fertig`, why: REARRANGE_ERROR_TEXTS['eq-not-resubstituted'] },
    {
      label: `$${u}$ noch einmal in die $pq$-Formel einsetzen`,
      why: {
        detailed: `Die $pq$-Formel hat ihre Arbeit getan: $${u}$ steht schon allein. Jetzt muss $${u}$ wieder zu $${block}$ werden, damit du nach $${target}$ auflösen kannst.`,
        short: `Jetzt zurück: $${u} = ${block}$.`,
      },
    },
  ]
}

export const EXPAND_MOVES: readonly WrongMove[] = [
  { label: 'Die Klammern einfach weglassen', why: { detailed: 'Ohne Klammer gehört der Faktor nur noch zum ersten Summanden. Jeder Summand in der Klammer muss malgenommen werden.', short: 'Klammern nicht weglassen, ausmultiplizieren.' } },
  { label: 'Die Zahl vor der Klammer nur mit dem ersten Summanden malnehmen', why: REARRANGE_ERROR_TEXTS['eq-bracket-first-term'] },
]

// Doppelbruch mit Brüchen im Nenner
export const EXTEND_MOVES: readonly WrongMove[] = [
  {
    label: 'Nur den Zähler mit dem inneren Nenner malnehmen',
    why: { detailed: 'Nimmst du nur den Zähler mal, ändert sich der Wert des Bruchs. Beim Erweitern nimmst du Zähler und Nenner mit demselben Term mal.', short: 'Erweitern: Zähler und Nenner mit demselben Term mal.' },
  },
  {
    label: 'Die inneren Nenner einfach weglassen',
    why: { detailed: 'Einen Nenner darfst du nicht einfach weglassen, dann ändert sich der Wert. Erweitere den Doppelbruch mit dem Hauptnenner der inneren Brüche.', short: 'Nicht weglassen, mit dem inneren Hauptnenner erweitern.' },
  },
]

// unknown: die Unbekannte als LaTeX, x oder \sqrt{x} (dann ist √x die Unbekannte, x = (√x)²)
export function collectMoves(target: string, unknown = target): WrongMove[] {
  const rootUnknown = unknown !== target
  return [
    {
      label: rootUnknown ? `Durch den Faktor vor $${unknown}$ teilen` : `Durch den Faktor vor dem ersten $${target}$ teilen`,
      why: { detailed: `Danach steht $${target}$ immer noch auf beiden Seiten. Erst müssen alle Summanden mit $${unknown}$ auf eine Seite.`, short: `Danach steht $${target}$ immer noch auf beiden Seiten.` },
    },
    rootUnknown
      ? {
          label: 'Beide Seiten noch einmal quadrieren',
          why: { detailed: `Solange neben $${unknown}$ noch andere Summanden stehen, entsteht beim Quadrieren wieder eine Wurzel. Stelle zuerst den Summanden mit $${unknown}$ allein.`, short: `Erst den Summanden mit $${unknown}$ allein stellen.` },
        }
      : {
          label: `Die Summanden mit $${target}$ auf beiden Seiten streichen`,
          why: { detailed: 'Streichen darfst du nur, was auf beiden Seiten genau gleich ist. Bringe die Summanden mit der Variable stattdessen auf eine Seite.', short: 'Nur genau Gleiches darf man auf beiden Seiten streichen.' },
        },
    { label: `Alles mit $${unknown}$ nach links, ohne die Vorzeichen zu ändern`, why: REARRANGE_ERROR_TEXTS['eq-sign-not-flipped'] },
  ]
}

export function factorMoves(unknown: string): WrongMove[] {
  return [
    {
      label: `Die Zahlen und Buchstaben vor $${unknown}$ malnehmen`,
      why: { detailed: `Summanden werden nicht malgenommen. Was in jedem Summanden steckt, kommt vor die Klammer: $a${unknown} + b${unknown} = ${unknown}(a + b)$.`, short: `Ausklammern: $a${unknown} + b${unknown} = ${unknown}(a + b)$.` },
    },
    {
      label: `Ein $${unknown}$ einfach streichen`,
      why: { detailed: 'Streichen ändert den Wert der Seite, dann stimmt die Gleichung nicht mehr. Klammere die Variable aus.', short: 'Nicht streichen, ausklammern.' },
    },
  ]
}

export const SQUARE_MOVES: readonly WrongMove[] = [
  { label: 'Die Wurzel einfach weglassen', why: { detailed: 'Weglassen ändert den Wert der Seite. Gegen eine Wurzel hilft das Quadrieren, auf beiden Seiten.', short: 'Gegen die Wurzel: beide Seiten quadrieren.' } },
  { label: 'Beide Seiten durch $2$ teilen', why: { detailed: 'Teilen ändert an der Wurzel nichts. Die Gegenrechnung zur Quadratwurzel ist das Quadrieren.', short: 'Gegenrechnung zur Wurzel ist das Quadrieren.' } },
]

export const ROOT_MOVES: readonly WrongMove[] = [
  { label: 'Beide Seiten durch $2$ teilen', why: { detailed: 'Die Hochzahl $2$ ist kein Faktor: $\\frac{x^2}{2}$ ist nicht $x$. Die Gegenrechnung zum Quadrieren ist die Wurzel.', short: 'Gegenrechnung zum Quadrieren ist die Wurzel.' } },
  { label: 'Das Quadrat einfach weglassen', why: { detailed: 'Weglassen ändert den Wert der Seite. Ziehe auf beiden Seiten die Wurzel.', short: 'Auf beiden Seiten die Wurzel ziehen.' } },
]

// --- Tipps ---

export const REARRANGE_HINTS = {
  derive: 'Leite den Term in der Klammer nach $x$ ab, mit den Regeln aus „Ableiten" (Quotienten-, Produkt- und Kettenregel), und fasse zusammen.',
  partial: 'Zerlege den Nenner in Faktoren und setze an: $\\frac{A}{t + p} + \\frac{B}{t + q}$. Die Nullstellen der Faktoren eingesetzt liefern $A$ und $B$.',
  antiderivative: 'Suche eine Funktion, deren Ableitung der Integrand ist. Teile durch die innere Ableitung, z. B. $\\int e^{2t}\\,\\mathrm{d}t = \\frac{1}{2}e^{2t}$.',
  bounds: 'Setze erst die obere, dann die untere Grenze ein und ziehe ab: $F(x) - F(a)$.',
  sumFormula: 'Geometrische Summe: $\\sum_{k=0}^{m-1} q^k = \\frac{q^m - 1}{q - 1}$ mit der Anzahl $m$ der Summanden. Beginnt die Summe nicht mit $q^0 = 1$, klammere den ersten Summanden aus.',
  series: 'Geometrische Reihe für $0 < q < 1$: $\\sum_{k=0}^{\\infty} q^k = \\frac{1}{1 - q}$. Abgeleitet: $\\sum_{k=1}^{\\infty} kq^k = \\frac{q}{(1 - q)^2}$, integriert: $\\sum_{k=1}^{\\infty} \\frac{q^k}{k} = -\\ln(1 - q)$.',
  limit: '$\\lim_{n \\to \\infty}\\left(1 + \\frac{p}{n}\\right)^n = e^p$. Einen Faktor in der Hochzahl nimmst du mit, einen Bruch teilst du oben und unten durch $n$.',
  ode: "Ansatz $e^{\\lambda x}$: Bei $f' = kf$ ist $f(x) = f(0) \\cdot e^{kx}$, bei $f' = k(b - f)$ ist $f(x) = b + Ce^{-kx}$. Bei $f'' = k^2 f$ ist $f(x) = C_1e^{kx} + C_2e^{-kx}$ mit $C_1 + C_2 = f(0)$ und $k(C_1 - C_2) = f'(0)$.",
  add: 'Ein Summand verschwindet mit der Gegenrechnung: Aus $+c$ wird auf beiden Seiten $-c$.',
  move: 'Bringe den Summanden mit Minus auf die andere Seite, dort steht er mit Plus. Den Rest bringst du herüber.',
  divide: 'Einen Faktor wirst du los, indem du beide Seiten durch ihn teilst.',
  multiply: 'Einen Nenner wirst du los, indem du beide Seiten mit ihm malnimmst.',
  denominator: 'Steht die Variable im Nenner, nimm beide Seiten mit dem Nenner mal. Dann steht sie oben.',
  clear: 'Nimm beide Seiten mit dem Hauptnenner mal. Dann kürzen sich alle Nenner weg.',
  negate: 'Mal $(-1)$ dreht auf beiden Seiten alle Vorzeichen um.',
  reciprocal: 'Steht auf beiden Seiten genau ein Bruch, darfst du beide umdrehen.',
  combine: 'Den Kehrwert darfst du nur von einem einzigen Bruch nehmen.',
  combineBeforeMultiply: 'Fasse die Seite zuerst zu einem Bruch zusammen. Sonst entsteht beim Malnehmen und Teilen ein Doppelbruch.',
  combineBeforeRoot: 'Fasse die Seite zuerst zu einem Bruch zusammen. Dann ziehst du die Wurzel aus einem einzigen Bruch.',
  combineBeforeSquare: 'Fasse die Seite zuerst zu einem Bruch zusammen. Dann quadrierst du Zähler und Nenner.',
  combineBeforeLog: 'Fasse die Seite zuerst zu einem Bruch zusammen. Den $\\ln$ einer Summe kannst du nicht auseinanderziehen.',
  exp: 'Gegen einen Logarithmus hilft seine Basis hoch, auf beiden Seiten: $e^{\\ln u} = u$.',
  log: 'Steht die Variable in der Hochzahl, nimm auf beiden Seiten den $\\ln$: $\\ln\\left(e^u\\right) = u$, $\\ln\\left(a^u\\right) = u\\ln a$.',
  logLaw: 'Ziehe den $\\ln$ mit den Gesetzen auseinander: $\\ln(u \\cdot v) = \\ln u + \\ln v$, $\\ln\\left(a^u\\right) = u\\ln a$.',
  logCombine: 'Fasse die Logarithmen mit den Gesetzen zusammen: $\\ln u + \\ln v = \\ln(uv)$, $\\ln u - \\ln v = \\ln\\frac{u}{v}$.',
  powerLaw: 'Zerlege die Potenzen mit $a^{m + n} = a^m \\cdot a^n$, bis überall dieselbe Potenz steht.',
  arc: 'Gegen eine Winkel- oder Hyperbelfunktion hilft ihre Umkehrfunktion, auf beiden Seiten: $\\sin u = w \\Leftrightarrow u = \\arcsin w$.',
  trig: 'Gegen eine Umkehrfunktion hilft die Funktion selbst, auf beiden Seiten: $\\arctan u = w \\Leftrightarrow u = \\tan w$.',
  pythagoras: 'Mit $\\sin^2 u + \\cos^2 u = 1$ (bei Hyperbelfunktionen $\\cosh^2 u - \\sinh^2 u = 1$) ersetzt du ein Quadrat durch die andere Funktion.',
  tanQuotient: 'Teile durch $\\cos u$: Aus $\\frac{\\sin u}{\\cos u}$ wird $\\tan u$, aus $\\frac{\\cos u}{\\cos u}$ wird $1$. Bei Hyperbelfunktionen genauso mit $\\tanh u$.',
  substitute: 'Stehen $e^{2x}$ und $e^x$ da, setze $u = e^x$: Dann ist $e^{2x} = u^2$, und die Gleichung wird quadratisch in $u$. Genauso mit $u = \\sqrt{x}$, $u = \\sin x$ oder $u = x^2$.',
  zero: 'Für die $pq$-Formel muss rechts $0$ stehen: Bringe alles auf die linke Seite, $u^2$ mit Plus vorn.',
  normalize: 'Die $pq$-Formel gilt für $u^2 + pu + q = 0$. Teile vorher durch die Zahl vor $u^2$.',
  pq: '$u^2 + pu + q = 0 \\;\\Rightarrow\\; u_{1,2} = -\\frac{p}{2} \\pm \\sqrt{\\left(\\frac{p}{2}\\right)^2 - q}$, $p$ und $q$ mit Vorzeichen.',
  choose: 'Prüfe beide Lösungen: $u = e^x$ ist immer positiv, $\\sqrt{x}$ nie negativ, und $x$ muss im Bereich der Aufgabe liegen.',
  resubstitute: 'Gesucht ist $x$: Setze für $u$ wieder den Baustein ein und löse nach $x$ auf.',
  extend: 'Erweitere den Doppelbruch: Zähler und Nenner mal den Hauptnenner der inneren Brüche. Dann kürzen sich die inneren Nenner weg.',
  expand: 'Jeder Summand in der Klammer wird malgenommen: $a(b + c) = ab + ac$.',
  collect: 'Alle Summanden mit der Variable auf eine Seite, alle anderen auf die andere. Was die Seite wechselt, wechselt das Vorzeichen.',
  factor: 'Klammere die Variable aus: $ax + bx = x(a + b)$. Steht ein Summand nur als $x$ da, bleibt in der Klammer eine $1$.',
  square: 'Die Gegenrechnung zur Wurzel ist das Quadrieren, auf beiden Seiten.',
  root: 'Die Gegenrechnung zum Quadrat ist die Wurzel. Alle Buchstaben sind positiv, also brauchst du kein $\\pm$.',
  finish: 'Bringe alles auf einen Hauptnenner und fasse die Zähler zusammen.',
  result: 'Rechne die Umformung auf beiden Seiten aus. Auf der Seite mit der Variable hebt sich etwas weg.',
} as const

// Tipp für die ganze Aufgabe (im freien Modus)
export type TaskTool = 'derivative' | 'integral' | 'series' | 'limit' | 'ode'

export function rearrangeTaskHint(target: string, several: boolean, block: string | null = null, quadratic = false, tool: TaskTool | null = null): Explanation {
  if (tool === 'derivative') return same(`Rechne zuerst die Ableitung aus. Dann steht eine gewöhnliche Gleichung da, die du nach $${target}$ auflöst.`)
  if (tool === 'integral') return same(`Rechne zuerst das Integral aus: Stammfunktion, dann die Grenzen einsetzen. Dann löst du nach $${target}$ auf.`)
  if (tool === 'series') return same(`Rechne zuerst die Summe mit der Formel der geometrischen Summe bzw. Reihe aus. Dann löst du nach $${target}$ auf.`)
  if (tool === 'limit') return same(`Rechne zuerst den Grenzwert aus, mit $\\left(1 + \\frac{p}{n}\\right)^n \\to e^p$. Dann löst du nach $${target}$ auf.`)
  if (tool === 'ode') return same(`Löse zuerst die Differentialgleichung mit den Anfangswerten (Ansatz $e^{\\lambda x}$). Dann steht eine Gleichung mit e-Funktionen da, die du nach $${target}$ auflöst.`)
  if (block) return same(`Setze $u = ${block}$ und löse die quadratische Gleichung in $u$ mit der $pq$-Formel. Wähle die passende Lösung, setze zurück ein und löse nach $${target}$ auf.`)
  if (quadratic) return same(`Forme um, bis $${target}^2$ und $${target}$ in einer Gleichung stehen. Bringe alles auf eine Seite, nimm die $pq$-Formel und wähle die passende Lösung.`)
  return several
    ? same(`Nenner beseitigen, ausmultiplizieren, alle Summanden mit $${target}$ auf eine Seite, $${target}$ ausklammern und teilen.`)
    : same(`Mache die Rechnungen um $${target}$ von außen nach innen rückgängig, immer auf beiden Seiten.`)
}

// --- Erklärungen der richtigen Schritte ---

// unknown: x oder \sqrt{x} (siehe collectMoves)
export function explainMove(kind: string, operation: string, target: string, unknown = target): Explanation {
  switch (kind) {
    case 'add':
      return { detailed: `Der Summand steht ganz außen. Mit der Gegenrechnung ${operation.replace(/^Auf beiden Seiten /, '')} auf beiden Seiten verschwindet er dort, und die Gleichung stimmt weiter.`, short: `${operation}: Gegenrechnung auf beiden Seiten.` }
    case 'move':
      return { detailed: 'Der Summand mit der Variable steht mit Minus da. Auf der anderen Seite steht er mit Plus; dafür kommt die andere Seite mit umgekehrtem Vorzeichen herüber.', short: 'Rüberbringen: Das Vorzeichen wechselt.' }
    case 'divide':
      return { detailed: `Der Faktor steht ganz außen um $${target}$. Die Gegenrechnung zum Malnehmen ist das Teilen, auf beiden Seiten.`, short: `${operation}: Gegenrechnung zum Malnehmen.` }
    case 'multiply':
      return { detailed: 'Der Nenner wird beseitigt, indem du beide Seiten mit ihm malnimmst. Auf seiner Seite kürzt er sich weg.', short: `${operation}: Der Nenner kürzt sich weg.` }
    case 'negate':
      return { detailed: `Vor $${target}$ steht ein Minus. Mal $(-1)$ auf beiden Seiten dreht alle Vorzeichen um.`, short: 'Mal $(-1)$: alle Vorzeichen drehen sich um.' }
    case 'reciprocal':
      return { detailed: 'Auf beiden Seiten steht genau ein Bruch. Sind zwei Brüche gleich, sind es auch ihre Kehrwerte. So kommt die Variable aus dem Nenner.', short: 'Gleiche Brüche haben gleiche Kehrwerte.' }
    case 'combine':
      return { detailed: 'Bevor du den Kehrwert nimmst, muss auf der Seite genau ein Bruch stehen. Fasse sie deshalb über den Hauptnenner zusammen.', short: 'Erst zu einem Bruch, dann Kehrwert.' }
    case 'combine-multiply':
      return { detailed: 'Auf der anderen Seite steht eine Summe mit Brüchen. Fasse sie erst über den Hauptnenner zu einem Bruch zusammen; dann bleibt nach dem Malnehmen mit dem Nenner kein Doppelbruch übrig.', short: 'Erst zu einem Bruch, dann mit dem Nenner malnehmen.' }
    case 'combine-root':
      return { detailed: 'Auf der anderen Seite steht eine Summe mit Brüchen. Fasse sie erst über den Hauptnenner zu einem Bruch zusammen; dann ziehst du die Wurzel aus einem einzigen Bruch.', short: 'Erst zu einem Bruch, dann die Wurzel ziehen.' }
    case 'combine-square':
      return { detailed: 'Auf der anderen Seite steht eine Summe mit Brüchen. Fasse sie erst über den Hauptnenner zu einem Bruch zusammen; dann quadrierst du einfach Zähler und Nenner.', short: 'Erst zu einem Bruch, dann quadrieren.' }
    case 'combine-log':
      return { detailed: 'Auf der anderen Seite steht eine Summe mit Brüchen. Fasse sie erst über den Hauptnenner zu einem Bruch zusammen; den $\\ln$ einer Summe kannst du nämlich nicht auseinanderziehen.', short: 'Erst zu einem Bruch, dann logarithmieren.' }
    case 'exp':
      return { detailed: 'Die Variable steckt in einem Logarithmus. Die Potenz zu seiner Basis hebt ihn auf: $e^{\\ln u} = u$, $a^{\\log_a u} = u$. Also schreibst du beide Seiten als Hochzahl dieser Basis.', short: `${operation}: hebt den Logarithmus auf.` }
    case 'log':
      return { detailed: 'Die Variable steckt in einer Hochzahl. Nimm auf beiden Seiten den $\\ln$: Er hebt die e-Funktion auf, $\\ln\\left(e^u\\right) = u$. Bei einer anderen Basis oder einem Produkt holen ihn danach die Logarithmusgesetze herunter.', short: 'Logarithmieren: $\\ln$ auf beiden Seiten.' }
    case 'logLaw':
      return { detailed: 'Im $\\ln$ steht ein Produkt oder eine Potenz mit der Variable in der Hochzahl. Mit den Logarithmusgesetzen wird daraus eine Summe, und die Hochzahl kommt als Faktor herunter: $\\ln(u \\cdot v) = \\ln u + \\ln v$, $\\ln\\left(a^u\\right) = u\\ln a$.', short: 'Logarithmusgesetze: die Hochzahl kommt herunter.' }
    case 'logCombine':
      return { detailed: 'Die Variable steckt in mehreren Logarithmen. Mit den Logarithmusgesetzen wird daraus einer: $\\ln u + \\ln v = \\ln(uv)$, $\\ln u - \\ln v = \\ln\\frac{u}{v}$. Den löst du dann mit der Basis hoch auf.', short: 'Logarithmusgesetze: aus mehreren Logarithmen wird einer.' }
    case 'powerLaw':
      return { detailed: 'Die Variable steht in mehreren Hochzahlen, die sich nur um einen festen Teil unterscheiden. Mit $a^{m + n} = a^m \\cdot a^n$ steht danach überall dieselbe Potenz, die du ausklammern kannst.', short: 'Potenzgesetz: überall dieselbe Potenz.' }
    case 'arc':
      return { detailed: 'Die Variable steckt in einer Winkel- oder Hyperbelfunktion. Ihre Umkehrfunktion hebt sie auf: $\\arcsin(\\sin u) = u$, solange $u$ im Bereich der Aufgabe liegt. Also nimmst du auf beiden Seiten die Umkehrfunktion.', short: `${operation}: hebt die Funktion auf.` }
    case 'trig':
      return { detailed: 'Die Variable steckt in einer Umkehrfunktion. Die Funktion selbst hebt sie auf: $\\tan(\\arctan u) = u$. Also nimmst du auf beiden Seiten diese Funktion.', short: `${operation}: hebt die Umkehrfunktion auf.` }
    case 'pythagoras':
      return { detailed: 'In der Gleichung stehen zwei verschiedene Funktionen, mindestens eine im Quadrat. Mit $\\sin^2 u + \\cos^2 u = 1$ (bei Hyperbelfunktionen $\\cosh^2 u - \\sinh^2 u = 1$) ersetzt du das Quadrat durch die andere Funktion. Dann steht nur noch eine Funktion da, nach der du auflöst wie nach $x$.', short: 'Das Quadrat durch die andere Funktion ersetzen.' }
    case 'tanQuotient':
      return { detailed: 'In jedem Summanden steht genau ein $\\sin u$ oder $\\cos u$. Teilst du durch $\\cos u$, wird aus $\\sin u$ der $\\tan u$ und aus $\\cos u$ die $1$; bei einem Bruch teilst du Zähler und Nenner, dann bleibt sein Wert gleich. Danach steht nur noch $\\tan u$ da (bei Hyperbelfunktionen $\\tanh u$).', short: `${operation}: nur noch der Tangens.` }
    case 'substitute':
      return {
        detailed: 'Die Variable steckt in verschiedenen Potenzen desselben Bausteins, zum Beispiel $e^{2x} = \\left(e^x\\right)^2$ und $e^x$. Mit $u$ für den Baustein wird daraus eine quadratische Gleichung in $u$, die du mit der $pq$-Formel löst.',
        short: `${operation}: quadratisch in $u$.`,
      }
    case 'zero':
      return { detailed: `Die Gleichung ist quadratisch in $${unknown}$. Für die $pq$-Formel bringst du alles auf die linke Seite; was die Seite wechselt, wechselt das Vorzeichen. Rechts steht dann $0$.`, short: 'Alles nach links, rechts $0$.' }
    case 'normalize':
      return { detailed: `Die $pq$-Formel braucht die Normalform $${unknown}^2 + p${unknown} + q = 0$, vor $${unknown}^2$ also eine $1$. Teile dafür jeden Summanden durch die Zahl vor $${unknown}^2$.`, short: `${operation}: vor $${unknown}^2$ eine $1$.` }
    case 'pq':
      return {
        detailed: `Die Gleichung hat die Normalform $${unknown}^2 + p${unknown} + q = 0$. Lies $p$ und $q$ mit ihren Vorzeichen ab und setze sie ein: $${unknown}_{1,2} = -\\frac{p}{2} \\pm \\sqrt{\\left(\\frac{p}{2}\\right)^2 - q}$.`,
        short: '$pq$-Formel mit $p$ und $q$ samt Vorzeichen.',
      }
    case 'resubstitute':
      return { detailed: `$${unknown}$ war nur ein Platzhalter für den Baustein. Setze ihn zurück ein; dann löst du nach $${target}$ auf wie gewohnt.`, short: `${operation}: zurück zu $${target}$.` }
    case 'expand':
      return { detailed: 'Die Variable steckt in Klammern. Nach dem Ausmultiplizieren stehen alle Summanden einzeln da und lassen sich sortieren.', short: 'Ausmultiplizieren, dann sortieren.' }
    case 'extend':
      return { detailed: 'Im Zähler und Nenner stehen weitere Brüche. Nimmst du Zähler und Nenner mit dem Hauptnenner der inneren Brüche mal, kürzen sich die inneren Nenner weg, und der Wert bleibt gleich.', short: `${operation}: Die inneren Nenner kürzen sich weg.` }
    case 'collect':
      if (unknown !== target) {
        return { detailed: `Bringe den Summanden mit $${unknown}$ auf eine Seite und alle anderen auf die andere; was die Seite wechselt, wechselt das Vorzeichen. Steht $${unknown}$ allein, kannst du noch einmal quadrieren.`, short: `Summand mit $${unknown}$ nach links, Rest nach rechts.` }
      }
      return { detailed: `$${target}$ kommt in mehreren Summanden vor. Bringe alle Summanden mit $${target}$ auf eine Seite und alle anderen auf die andere; was die Seite wechselt, wechselt das Vorzeichen.`, short: `Summanden mit $${target}$ nach links, Rest nach rechts.` }
    case 'factor':
      return { detailed: `Links steht $${unknown}$ in mehreren Summanden. Klammerst du $${unknown}$ aus, steht es nur noch einmal da: $a${unknown} + b${unknown} = ${unknown}(a + b)$.`, short: `$${unknown}$ ausklammern.` }
    case 'square':
      return { detailed: 'Die Gegenrechnung zur Wurzel ist das Quadrieren. Weil beide Seiten positiv sind, bleibt die Lösung dieselbe.', short: 'Gegenrechnung zur Wurzel: quadrieren.' }
    case 'root':
      return { detailed: 'Die Gegenrechnung zum Quadrat ist die Wurzel. Weil alle Buchstaben positiv sind, gilt nur das Plus.', short: 'Gegenrechnung zum Quadrat: Wurzel.' }
    default:
      return same(operation)
  }
}

// Erklärung zum Ergebnis eines Schritts: vorher → nachher
export function explainResult(kind: string, before: string, after: string): Explanation {
  const lines = `$${before}$\n$${after}$`
  switch (kind) {
    case 'finish':
      return { detailed: `Die rechte Seite wird über den Hauptnenner zu einem Bruch zusammengefasst und gekürzt:\n${lines}`, short: lines }
    case 'expand':
      return { detailed: `Jeder Summand in der Klammer wird malgenommen:\n${lines}`, short: lines }
    case 'collect':
    case 'zero':
      return { detailed: `Die Summanden, die die Seite wechseln, wechseln ihr Vorzeichen:\n${lines}`, short: lines }
    case 'substitute':
      return { detailed: `Jeder Teil mit der Variable wird durch eine Potenz von $u$ ersetzt:\n${lines}`, short: lines }
    case 'normalize':
      return { detailed: `Jeder Summand wird durch die Zahl vor dem Quadrat geteilt:\n${lines}`, short: lines }
    case 'pq':
      return { detailed: `$p$ und $q$ mit ihren Vorzeichen in die $pq$-Formel eingesetzt:\n${lines}`, short: lines }
    case 'resubstitute':
      return { detailed: `Für $u$ steht wieder der Baustein da:\n${lines}`, short: lines }
    case 'derive':
      return { detailed: `Die Ableitung ausgerechnet (mit den Regeln aus „Ableiten") und zusammengefasst:\n${lines}`, short: lines }
    case 'partial':
      return { detailed: `Der Bruch im Integral in Partialbrüche zerlegt (Probe: zusammen ergeben sie wieder den Bruch):\n${lines}`, short: lines }
    case 'antiderivative':
      return { detailed: `Eine Stammfunktion, mit den Grenzen in eckigen Klammern (Probe: abgeleitet ergibt sie den Integranden):\n${lines}`, short: lines }
    case 'bounds':
      return { detailed: `Die obere Grenze eingesetzt, minus die untere:\n${lines}`, short: lines }
    case 'sumFormula':
      return { detailed: `Die Formel der geometrischen Summe angewandt, im Exponenten die Anzahl der Summanden:\n${lines}`, short: lines }
    case 'series':
      return { detailed: `Die Formel der geometrischen Reihe angewandt und zusammengefasst:\n${lines}`, short: lines }
    case 'limit':
      return { detailed: `Der Grenzwert mit $\\left(1 + \\frac{p}{n}\\right)^n \\to e^p$:\n${lines}`, short: lines }
    case 'ode':
      return { detailed: `Die Differentialgleichung mit den Anfangswerten gelöst:\n${lines}`, short: lines }
    default:
      return { detailed: `Auf beiden Seiten dieselbe Rechnung:\n${lines}`, short: lines }
  }
}

// Lösung einer Differentialgleichung: Ansatz und Konstanten aus den Anfangswerten (tools/ode.ts, odeWork);
// lambda: was der Ansatz e^{\lambda x} bei zweiter Ordnung ergibt
export function explainOde(ode: string, approach: string, constants: string, before: string, after: string, lambda?: string): Explanation {
  const lines = `$${before}$\n$${after}$`
  const start = lambda
    ? `Für $${ode}$ ergibt der Ansatz $e^{\\lambda x}$: $${lambda}$, also $${approach}$.`
    : `Für $${ode}$ setzt du $${approach}$ an.`
  return {
    detailed: `${start} Die Anfangswerte bei $x = 0$ liefern $${constants}$. Eingesetzt:\n${lines}`,
    short: `$${approach}$ mit $${constants}$:\n${lines}`,
  }
}

// Warum fällt die andere Lösung der pq-Formel weg? rejected: die andere Lösung, why: Grund als Satz
export function explainChoose(rejected: string, why: string, after: string): Explanation {
  return {
    detailed: `Die andere Lösung $${rejected}$ passt nicht: ${why} Also bleibt\n$${after}$`,
    short: why,
  }
}
