# Vision: Rechenweg (Arbeitstitel)

Eine Lern-App im Stil von Brilliant, zuerst auf mich zugeschnitten
(Maschinenbau, 1. Semester, THU, Vorlesung „Mathematik MB1"): Man lernt,
indem man Aufgaben Schritt für Schritt selbst löst. Langfristig soll sie von
der Grundschule bis zum Mathestudium alles abdecken können, die Inhalte
entstehen aber zuerst für mein Uni-Niveau.

## Zwei Modi pro Aufgabe

### Geführt
- Die Lösung ist in Schritte zerlegt, jeder Schritt ist Multiple Choice.
- Schritt 1 ist immer „Welche Regel brauchst du?".
- Die falschen Optionen sind typische Denkfehler, z. B. $(u \cdot v)' = u' \cdot v'$
  oder die vergessene innere Ableitung.
- Bei einer falschen Antwort kann man sich erklären lassen, warum genau sie
  falsch ist.
- Vor dem Antworten gibt es auf Wunsch einen Tipp.

### Frei
- Man tippt das komplette Ergebnis selbst ein, über eine Mathe-Tastatur
  (auch am Handy).
- Geprüft wird mathematisch, nicht zeichengenau: Gleichwertige Formen zählen
  als richtig.
- Entspricht die Eingabe einem typischen Fehler, nennt die App ihn konkret.
- Danach lässt sich der Lösungsweg Schritt für Schritt aufdecken.

## Erklärungen
- Jederzeit ein- und ausschaltbar (global und pro Aufgabe).
- Zwei Stufen: „Ausführlich" (einfache Sprache, alle Fachbegriffe erklärt) und
  „Kurz" (nur die Rechnung).

## Schwierigkeitsstufen
- Jedes Thema hat 5 Stufen. Ich wähle die Stufe selbst, und sie bleibt, bis
  ich sie ändere.
- Die App darf vorschlagen, eine Stufe höher zu gehen (z. B. nach 8 von 10
  richtig), wechselt aber nie automatisch.
- Stufen am Beispiel Ableitungen:
  1. Potenz-, Faktor-, Summenregel, z. B. $4x^3 - \frac{2}{x} + \sqrt{x}$
  2. eine Regel mit $e^x$, $\ln$, $\sin$, $\cos$, z. B. $x^2 e^x$, $\sin(3x)$
  3. zwei Regeln kombiniert, z. B. $e^{x^2}\cos x$, $\frac{\ln x}{x^2}$
  4. Uni-Niveau, mehrere Regeln verschachtelt, auch $a^x$, $\log_a$, $\tan$,
     $\arctan$, z. B. $\frac{x^2 e^{-3x}}{\sqrt{1+x^2}}$,
     $\ln\left(\frac{x^2+1}{x-1}\right)$
  5. Profi: logarithmisches Ableiten ($x^x$, $x^{\sin x}$), implizites
     Ableiten, Umkehr- und Hyperbelfunktionen

## Schreibweise
- Alle Formeln sauber gesetzt wie im Skript: echte Bruchstriche, Exponenten,
  Wurzeln. Nie als Text wie „x^2/(3x+1)".
- Deutsche Konventionen: Dezimalkomma, Malpunkt, $\ln$, $f'(x)$.

## Design
- Ruhig und hochwertig wie Brilliant: viel Weißraum, große Formeln, ein
  Schritt pro Bildschirm, sofortiges Feedback, dezente Animationen.
- Mobile first, aber auch am Laptop gut nutzbar. Oberfläche auf Deutsch.
- Fortschritt pro Thema und Stufe. Die App merkt sich meine häufigsten Fehler
  und bietet gezieltes Üben dazu an.
- Zu jeder Regel eine kurze Lernkarte (Regel, Merksatz, durchgerechnetes
  Beispiel), jederzeit aufrufbar.

## Technische Leitplanken
- Web-App (PWA): auf dem Homescreen installierbar und offline nutzbar. So
  gebaut, dass wir sie später mit Capacitor als echte App veröffentlichen
  können.
- Tech-Stack: Vite, React, TypeScript, Tailwind, KaTeX (Darstellung),
  MathLive (Eingabe), Vitest (Tests). Bessere Alternativen gern mit kurzer
  Begründung.
- Vorerst kein Server und keine KI in der App. Fortschritt und Einstellungen
  werden lokal gespeichert.
- Herzstück ist eine Mathe-Engine. Sie
  - erzeugt unbegrenzt Aufgaben pro Stufe aus Vorlagen mit
    Zufallsparametern,
  - berechnet Lösung und jeden Zwischenschritt selbst (Regel +
    Zwischenergebnis),
  - bildet typische Fehler als „Fehlerregeln" ab; daraus entstehen die
    falschen Optionen und die Fehlerdiagnose im freien Modus,
  - baut Erklärungen aus Textbausteinen je Regel und Fehlerregel, mit den
    Termen der Aufgabe,
  - prüft Gleichwertigkeit symbolisch und numerisch an vielen Zufallsstellen
    im Definitionsbereich.
- Mathematische Korrektheit hat oberste Priorität: Alle Lösungen und
  Beispiele kommen aus der Engine, nichts von Hand. Viele automatische Tests
  pro Regel und Stufe, auch dafür, dass eine falsche Option nie zufällig doch
  richtig ist.
