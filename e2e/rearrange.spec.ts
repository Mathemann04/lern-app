import { type Page, expect, test } from '@playwright/test'

// Thema Gleichungen umstellen im Gebiet Grundlagen: geführt üben (Stufen 1 bis 5), frei eintippen,
// Lernkarten, Fortschritt

const answers = (page: Page) => page.getByRole('group', { name: 'Antworten' }).getByRole('button')
const correctFeedback = (page: Page) => page.getByText('Richtig!', { exact: true })
const wrongFeedback = (page: Page) => page.getByText('Nicht ganz. Versuch es noch einmal.')
const field = (page: Page) => page.locator('math-field[data-ready]')
const feedback = (page: Page) => page.locator('[aria-live="polite"]')

// Setzt die Eingabe im freien Modus direkt und prüft sie (das Tippen selbst testet free.spec.ts)
async function enter(page: Page, latex: string) {
  await page.evaluate((value) => {
    const element = document.querySelector('math-field') as HTMLElement & { value: string; executeCommand: (c: string) => void }
    element.value = value
    element.executeCommand('commit')
  }, latex)
}

// each: Prüfung bei jeder Frage
async function solveWholeTask(page: Page, each?: (step: number) => Promise<void>) {
  for (let step = 0; step < 30; step++) {
    if (await page.getByRole('heading', { name: 'Geschafft!' }).isVisible()) return
    await expect(page.locator('#question')).toBeVisible()
    await each?.(step)
    const count = await answers(page).count()
    for (let i = 0; i < count; i++) {
      const button = answers(page).nth(i)
      if (await button.isDisabled()) continue
      await button.click()
      await correctFeedback(page).or(wrongFeedback(page)).waitFor()
      if (await correctFeedback(page).isVisible()) break
    }
    await page.getByRole('button', { name: /^(Weiter|Ergebnis ansehen)$/ }).click()
  }
  await expect(page.getByRole('heading', { name: 'Geschafft!' })).toBeVisible()
}

async function expectCleanPage(page: Page, context: string) {
  await expect(page.locator('code.text-red-700'), context).toHaveCount(0)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${context}: ragt seitlich heraus`).toBeLessThanOrEqual(0)
}

// Aufgabe oben und Antworten wischen nicht seitlich (eine angeschnittene Matrix wäre nicht zu lesen)
async function expectNoInnerScroll(page: Page, context: string) {
  const wide = await page.evaluate(() => [...document.querySelectorAll('main .overflow-x-auto')].filter((e) => e.scrollWidth > e.clientWidth + 1).length)
  expect(wide, `${context}: wischt seitlich`).toBe(0)
}

test('Von der Startseite zu „Gleichungen umstellen" und eine Aufgabe der Stufe 2 geführt lösen', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: /^Grundlagen/ }).click()
  await page.getByRole('link', { name: /^Gleichungen umstellen/ }).click()
  await expect(page).toHaveURL(/#\/thema\/umstellen$/)
  await expect(page.getByRole('heading', { name: 'Gleichungen umstellen', level: 1 })).toBeVisible()
  // Stufen 1 bis 5 spielbar, geführt und frei
  await expect(page.getByRole('radio', { name: /^Stufe 1/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: /^Stufe 4/ })).toBeEnabled()
  await expect(page.getByRole('radio', { name: /^Stufe 5/ })).toBeEnabled()
  await expect(page.getByRole('radio', { name: /Frei/ })).toBeEnabled()
  await expectCleanPage(page, 'Thema')

  await page.getByText('Die Variable kommt mehrfach vor oder steht im Nenner').click()
  await expect(page.getByRole('radio', { name: /^Stufe 2/ })).toBeChecked()
  await page.getByRole('link', { name: 'Stufe 2 geführt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/umstellen\/2-\d+$/)
  await expect(page.getByText('Alle Buchstaben stehen für positive Zahlen.')).toBeVisible()
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  await expectCleanPage(page, 'Aufgabe gelöst')
  await page.getByRole('link', { name: 'Zur Übersicht' }).click()
  await expect(page).toHaveURL(/#\/thema\/umstellen$/)
  await expect(page.getByText('1 gelöst')).toBeVisible()

  // Fortschritt hat einen eigenen Abschnitt
  await page.goto('./#/fortschritt')
  const progress = page.getByRole('region', { name: 'Gleichungen umstellen', exact: true })
  await expect(progress.getByRole('listitem', { name: 'Stufe 2' })).toContainText('1 gelöst')
  await expectCleanPage(page, 'Fortschritt')
})

test('Umstellen Stufe 1: falsche Umformung mit Erklärung, Lernkarte, ganze Aufgabe', async ({ page }) => {
  // b(x + a) + c = d nach x
  await page.goto('./#/ueben/umstellen/1-31')
  await expect(page.locator('#question')).toContainText('auf der linken Seite los?')
  await answers(page).filter({ hasText: 'Nur auf der linken Seite' }).click()
  await expect(wrongFeedback(page)).toBeVisible()
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(page.getByText('Eine Gleichung ist wie eine Waage')).toBeVisible()
  await answers(page).filter({ hasText: /^Auf beiden Seiten/ }).nth(0).click()
  await correctFeedback(page).or(wrongFeedback(page)).waitFor()
  if (await wrongFeedback(page).isVisible()) await answers(page).filter({ hasText: /^Auf beiden Seiten/ }).nth(1).click()
  await expect(correctFeedback(page)).toBeVisible()

  // Lernkarte zum Schritt als Fenster über der Aufgabe
  await page.getByRole('button', { name: 'Lernkarte', exact: true }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('heading', { name: 'Rüberbringen mit Vorzeichenwechsel' })).toBeVisible()
  await sheet.getByRole('button', { name: 'Schließen' }).click()
  await expect(sheet).toBeHidden()

  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.locator('#question')).toHaveText('Was kommt heraus?')
  await solveWholeTask(page)
  await expect(page.getByText(/^Gelöst mit \d+ Fehlversuchen?\.$/)).toBeVisible()
  await expect(page.getByLabel('Bisher')).toBeVisible()
  await expectCleanPage(page, 'Ergebnis')
})

test('Umstellen: Lernkarten-Ordner mit durchgerechneten Beispielen', async ({ page }) => {
  await page.goto('./#/karten')
  await page.getByRole('link', { name: /^Gleichungen umstellen/ }).click()
  await expect(page).toHaveURL(/#\/karten\/umstellen$/)
  await expect(page.getByRole('heading', { name: 'Stufe 1' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Stufe 2' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Stufe 3' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Stufe 4' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Stufe 5' })).toBeVisible()
  await expect(page.locator('main li a')).toHaveCount(21)
  await expect(page.getByRole('link', { name: /^Geometrische Summe und Reihe/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Differentialgleichungen/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Determinanten/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Betrag und Winkel komplexer Zahlen/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Vektoren: Länge, Skalarprodukt, Winkel/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Additionstheoreme/ })).toBeVisible()
  await expectCleanPage(page, 'Ordner')

  await page.getByRole('link', { name: /^Variable im Nenner/ }).click()
  await expect(page.getByRole('heading', { name: 'Variable im Nenner', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Beispiel' })).toContainText('Beide Seiten mal')
  // gezielt üben für jeden typischen Fehler der Karte (seit Schritt 9)
  await expect(page.getByRole('link', { name: 'Gezielt üben' }).first()).toBeVisible()
  await expectCleanPage(page, 'Lernkarte')
})

test('Umstellen gezielt üben: „Beim Betrag die Wurzel vergessen" von der Lernkarte aus, findet eine Aufgabe der Stufe 5', async ({ page }) => {
  await page.goto('./#/karten/umstellen/rearrange-complex')
  const error = page.locator('li').filter({ hasText: /^Beim Betrag die Wurzel vergessen/ }).first()
  await error.getByRole('link', { name: 'Gezielt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/umstellen\/5-\d+\?fokus=eq-abs-root$/, { timeout: 20_000 })
  await expect(page.getByText('Gezielt üben:')).toBeVisible()
  // der Fehler passiert gleich beim Ausrechnen des Betrags: „Was steht da eigentlich?"
  await expect(page.getByText('Was steht da eigentlich?')).toBeVisible()
  await expect(page.locator('#question')).toContainText('Betrag')
  await expectCleanPage(page, 'Gezielt üben Betrag')
})

test('Umstellen Stufe 3: zwei Wurzeln, zweimal quadrieren geführt, mit Lernkarte „Wurzel und Quadrat"', async ({ page }) => {
  // √(x + a) + √(x + b) = y
  await page.goto('./#/ueben/umstellen/3-29')
  await expect(page.locator('#question')).toHaveText('Was kommt heraus?')
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' }).getByRole('link', { name: 'Wurzel und Quadrat' })).toBeVisible()
  await expectCleanPage(page, 'Stufe 3')
})

test('Umstellen Stufe 4: Logarithmen zusammenfassen, e hoch beide Seiten, mit beiden neuen Lernkarten', async ({ page }) => {
  // s + \log_{10}(x + 9) - \log_{10}(x - r) = y
  await page.goto('./#/ueben/umstellen/4-13')
  await expect(page.locator('#question')).toContainText('steht in mehreren Logarithmen. Was machst du zuerst?')
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await expect(cards.getByRole('link', { name: 'Logarithmus- und Potenzgesetze' })).toBeVisible()
  await expect(cards.getByRole('link', { name: 'e-Funktion und Logarithmus' })).toBeVisible()
  await expectCleanPage(page, 'Stufe 4')
})

test('Umstellen Stufe 4 frei: Bruch aus e^{3x}, im ln geteilt, dann richtig mit Logarithmusgesetz', async ({ page }) => {
  // y = \frac{4p(ke^{3x} - m)}{5e^{3x} + n}
  await page.goto('./#/frei/umstellen/4-54')
  await expect(field(page)).toBeVisible()
  await expectCleanPage(page, 'Start Stufe 4')
  await enter(page, '\\ln\\left(\\frac{ny+4mp}{3(4kp-5y)}\\right)')
  await expect(feedback(page)).toContainText('geteilt statt den ganzen')
  // jede gleichwertige Form zählt, auch mit dem Logarithmusgesetz auseinandergezogen
  await enter(page, '\\frac{\\ln(ny+4mp)-\\ln(4kp-5y)}{3}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Richtig Stufe 4')
})

test('Umstellen Stufe 4: e^{2x} und e^x, substituieren, pq-Formel, Scheinlösung verwerfen, mit beiden Lernkarten aus Teil 6c', async ({ page }) => {
  // 3e^{2x} + e^{x} = r
  await page.goto('./#/ueben/umstellen/4-9')
  await expect(page.locator('#question')).toContainText('steckt in verschiedenen Potenzen von')
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  // nach der pq-Formel stehen beide Lösungen mit ± unter „Bisher"
  await expect(page.locator('.katex-html', { hasText: '±' }).first()).toBeVisible()
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await expect(cards.getByRole('link', { name: 'Substitution' })).toBeVisible()
  await expect(cards.getByRole('link', { name: /Formel/ })).toBeVisible()
  await expectCleanPage(page, 'Stufe 4 pq-Formel')
})

test('Umstellen Stufe 4 frei: nach der Substitution nicht zurückgerechnet, dann richtig', async ({ page }) => {
  // 3e^{2x} + e^{x} = r
  await page.goto('./#/frei/umstellen/4-9')
  await expect(field(page)).toBeVisible()
  await enter(page, '\\frac{\\sqrt{12r+1}-1}{6}')
  await expect(feedback(page)).toContainText('nicht zurückgerechnet')
  await enter(page, 'u=\\frac{\\sqrt{12r+1}-1}{6}')
  await expect(feedback(page)).toContainText('Gesucht ist')
  // auch die Form direkt aus der pq-Formel zählt
  await enter(page, '\\ln\\left(-\\frac{1}{6}+\\sqrt{\\frac{1}{36}+\\frac{r}{3}}\\right)')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Richtig Stufe 4 pq-Formel')
})

test('Umstellen Stufe 5: Integral mit Partialbrüchen geführt, „Was steht da eigentlich?", mit Lernkarte', async ({ page }) => {
  // \int_a^x \frac{\mathrm{d}t}{t(t + b)} = y mit x > a
  await page.goto('./#/ueben/umstellen/5-568')
  await expect(page.getByText('Was steht da eigentlich?')).toBeVisible()
  await expect(page.locator('#question')).toContainText('Partialbrüche')
  await expectCleanPage(page, 'Start Stufe 5')
  // richtig und „Faktor bei den Partialbrüchen vergessen"
  await expect(answers(page)).toHaveCount(2)
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await expect(cards.getByRole('link', { name: 'Stammfunktionen und Partialbrüche' })).toBeVisible()
  await expectCleanPage(page, 'Stufe 5 Integral')
})

test('Umstellen Stufe 5 frei: Ableitung, Nenner nicht quadriert, dann richtig', async ({ page }) => {
  // \frac{\mathrm{d}}{\mathrm{d}x}\left(\frac{x^2}{x + a}\right) = b (5-6 gehört seit Teil 8b zu Betrag und Winkel)
  await page.goto('./#/frei/umstellen/5-760')
  await expect(field(page)).toBeVisible()
  await expectCleanPage(page, 'Start Stufe 5 frei')
  await enter(page, '\\frac{b-2a+\\sqrt{b^2+4a^2}}{2}')
  await expect(feedback(page)).toContainText('Nenner nicht quadriert')
  // jede gleichwertige Form zählt
  await enter(page, '\\frac{a}{\\sqrt{1-b}}-a')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Richtig Stufe 5')
})

test('Umstellen Stufe 5: Grenzwert geführt, „1 hoch unendlich" als falsche Antwort, mit Lernkarte aus Teil 7b', async ({ page }) => {
  // m - \lim_{n \to \infty}\left(\frac{n}{n + x}\right)^{3n} = p
  await page.goto('./#/ueben/umstellen/5-120')
  await expect(page.getByText('Was steht da eigentlich?')).toBeVisible()
  await expect(page.locator('#question')).toContainText('Grenzwert')
  await expectCleanPage(page, 'Start Stufe 5 Grenzwert')
  // richtig, „1 hoch unendlich ist 1" und „Faktor in der Hochzahl vergessen"
  await expect(answers(page)).toHaveCount(3)
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await expect(cards.getByRole('link', { name: /^Grenzwert/ })).toBeVisible()
  await expectCleanPage(page, 'Stufe 5 Grenzwert')
})

test('Umstellen Stufe 5 frei: geometrische Summe nach n, Anzahl der Summanden verschoben, dann richtig', async ({ page }) => {
  // y = \sum_{k=0}^{n - 1} 2^k
  await page.goto('./#/frei/umstellen/5-484')
  await expect(field(page)).toBeVisible()
  await expectCleanPage(page, 'Start Stufe 5 Summe frei')
  await enter(page, '\\frac{\\ln(y+1)}{\\ln 2}+1')
  await expect(feedback(page)).toContainText('Anzahl der Summanden')
  await enter(page, 'n=\\frac{\\ln(y+1)}{\\ln 2}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Richtig Stufe 5 Summe')
})

test('Umstellen Stufe 5: Differentialgleichung geführt (Beispiel aus dem Plan), zwei Konstanten, mit Lernkarte aus Teil 7c', async ({ page }) => {
  // f'' = k^2 f, f(0) = a, f'(0) = 0 und y = f(x)
  await page.goto('./#/ueben/umstellen/5-427')
  await expect(page.getByText('Was steht da eigentlich?')).toBeVisible()
  await expect(page.locator('#question')).toContainText('Differentialgleichung')
  await expectCleanPage(page, 'Start Stufe 5 DGL')
  // richtig, nur e^{kx} angesetzt, Konstanten nicht halbiert, mit der Schwingung verwechselt
  await expect(answers(page)).toHaveCount(4)
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await expect(cards.getByRole('link', { name: /^Differentialgleichungen/ })).toBeVisible()
  await expectCleanPage(page, 'Stufe 5 DGL')
})

test('Umstellen Stufe 5 frei: Differentialgleichung, Anfangswert nicht genutzt, dann richtig', async ({ page }) => {
  // f'' = k^2 f, f(0) = a, f'(0) = 0 und y = f(x)
  await page.goto('./#/frei/umstellen/5-427')
  await expect(field(page)).toBeVisible()
  await expectCleanPage(page, 'Start Stufe 5 DGL frei')
  await enter(page, '\\frac{\\ln\\frac{y}{a}}{k}')
  await expect(feedback(page)).toContainText('Anfangswert')
  await enter(page, 'x=\\frac{1}{k}\\ln\\left(\\frac{y+\\sqrt{y^2-a^2}}{a}\\right)')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Richtig Stufe 5 DGL')
})

test('Umstellen Stufe 5: Determinante geführt (Beispiel aus dem Plan), mit Lernkarte aus Teil 8a', async ({ page }) => {
  // \det\begin{pmatrix} e^{x} & e^{-x} \\ a & b \end{pmatrix} = y
  await page.goto('./#/ueben/umstellen/5-1460')
  await expect(page.getByText('Was steht da eigentlich?')).toBeVisible()
  await expect(page.locator('#question')).toContainText('Determinante')
  await expectCleanPage(page, 'Start Stufe 5 Determinante')
  await expectNoInnerScroll(page, 'Start Stufe 5 Determinante')
  // richtig und drei der vier Fehler: Plus statt Minus, vertauscht, in Zeilen oder Spalten, nur die Hauptdiagonale
  await expect(answers(page)).toHaveCount(4)
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await expect(cards.getByRole('link', { name: /^Determinanten/ })).toBeVisible()
  await expectCleanPage(page, 'Stufe 5 Determinante')

  // die Lernkarte mit durchgerechnetem Beispiel
  await cards.getByRole('link', { name: /^Determinanten/ }).click()
  await expect(page.getByRole('heading', { name: 'Determinanten', level: 1 })).toBeVisible()
  await expect(page.getByText(/^Hauptdiagonale minus Nebendiagonale/).first()).toBeVisible()
  await expect(page.getByRole('region', { name: 'Beispiel' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Determinanten')
})

test('Umstellen Stufe 5: Determinante 3 × 3 geführt, erst entwickeln, nichts wischt seitlich', async ({ page }) => {
  // \det\begin{pmatrix} 3 & 1 & c \\ x & a & 0 \\ 2 & x + b & 0 \end{pmatrix} = d
  await page.goto('./#/ueben/umstellen/5-9')
  await expect(page.locator('#question')).toContainText('Entwickle nach der Zeile oder Spalte mit zwei Nullen')
  await solveWholeTask(page, (step) => expectNoInnerScroll(page, `Frage ${step + 1}`))
  await expectCleanPage(page, 'Stufe 5 Determinante 3 × 3')
})

test('Umstellen Stufe 5 frei: Determinante, in Zeilen statt über Kreuz, mehrdeutiger Fehler, dann richtig', async ({ page }) => {
  // \det\begin{pmatrix} e^{x} & e^{-x} \\ a & b \end{pmatrix} = y
  await page.goto('./#/frei/umstellen/5-1460')
  await expect(field(page)).toBeVisible()
  await expectCleanPage(page, 'Start Stufe 5 Determinante frei')
  await expectNoInnerScroll(page, 'Start Stufe 5 Determinante frei')
  await enter(page, '\\ln\\left(\\frac{y+\\sqrt{y^2+4ab}}{2a}\\right)')
  await expect(feedback(page)).toContainText('In Zeilen oder Spalten statt über Kreuz malgenommen')
  // Diagonalen vertauscht oder später ein Vorzeichen: Die App nennt alle passenden Fehler
  await enter(page, '\\ln\\left(\\frac{\\sqrt{y^2+4ab}-y}{2b}\\right)')
  await expect(feedback(page)).toContainText('passt zu mehreren typischen Fehlern')
  await expect(feedback(page)).toContainText('Haupt- und Nebendiagonale vertauscht')
  await expectCleanPage(page, 'Stufe 5 Determinante frei, mehrdeutig')
  await enter(page, 'x=\\ln\\left(\\frac{y+\\sqrt{y^2+4ab}}{2b}\\right)')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Richtig Stufe 5 Determinante')
})

test('Umstellen Stufe 5: Winkel zwischen Vektoren geführt (Beispiel aus dem Plan), nichts wischt seitlich, mit Lernkarten aus Teil 8b und 6b', async ({ page }) => {
  // \sphericalangle\left((x, k, 3), (1, 0, 0)\right) = y mit y < \frac{\pi}{2}
  await page.goto('./#/ueben/umstellen/5-1899')
  await expect(page.getByText('Was steht da eigentlich?')).toBeVisible()
  await expect(page.locator('#question')).toContainText('Winkel zwischen den Vektoren')
  await expectCleanPage(page, 'Start Stufe 5 Winkel')
  // richtig und drei Fehler: nicht durch die Längen geteilt, Sinus statt Kosinus, Wurzel vergessen
  await expect(answers(page)).toHaveCount(4)
  await solveWholeTask(page, (step) => expectNoInnerScroll(page, `Frage ${step + 1}`))
  await expect(page.getByTestId('result')).toBeVisible()
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await expect(cards.getByRole('link', { name: /^Vektoren: Länge, Skalarprodukt, Winkel/ })).toBeVisible()
  // 1 - \cos^2 y = \sin^2 y und das Ergebnis mit \tan y
  await expect(cards.getByRole('link', { name: /^Winkel- und Hyperbelfunktionen/ })).toBeVisible()
  await expectCleanPage(page, 'Stufe 5 Winkel')

  await cards.getByRole('link', { name: /^Vektoren: Länge, Skalarprodukt, Winkel/ }).click()
  await expect(page.getByRole('heading', { name: 'Vektoren: Länge, Skalarprodukt, Winkel', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Beispiel' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Vektoren')
})

test('Umstellen Stufe 5 frei: Betrag eines Bruchs (Beispiel aus dem Plan), Wurzel vergessen, dann richtig', async ({ page }) => {
  // \left\lvert\frac{x + a\mathrm{i}}{x - b\mathrm{i}}\right\rvert = y
  await page.goto('./#/frei/umstellen/5-465')
  await expect(field(page)).toBeVisible()
  await expectCleanPage(page, 'Start Stufe 5 Betrag frei')
  await expectNoInnerScroll(page, 'Start Stufe 5 Betrag frei')
  if (test.info().project.name === 'handy') {
    // ohne Winkel in der Aufgabe keine Taste \pi
    await field(page).tap()
    await expect(field(page)).toBeFocused()
    await expect(page.locator('.MLK__keycap', { hasText: /^a$/ }).filter({ visible: true }).first()).toBeVisible()
    await expect(page.locator('.MLK__keycap[data-keycap-value="\\\\pi"]').filter({ visible: true })).toHaveCount(0)
  }
  await enter(page, '\\sqrt{\\frac{a^2-b^2y}{y-1}}')
  await expect(feedback(page)).toContainText('Beim Betrag die Wurzel vergessen')
  await enter(page, 'x=\\sqrt{\\frac{a^2-b^2y^2}{y^2-1}}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Richtig Stufe 5 Betrag')
})

test('Umstellen Stufe 5: Winkel einer komplexen Zahl geführt, frei mit π im Ergebnis', async ({ page }) => {
  // \arg\left((1 + \mathrm{i})(x + a\mathrm{i})\right) = y
  await page.goto('./#/ueben/umstellen/5-1155')
  await expect(page.locator('#question')).toContainText('Rechne den Winkel aus')
  await solveWholeTask(page)
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await expect(cards.getByRole('link', { name: /^Betrag und Winkel komplexer Zahlen/ })).toBeVisible()
  await expectCleanPage(page, 'Stufe 5 Winkel komplex')

  await cards.getByRole('link', { name: /^Betrag und Winkel komplexer Zahlen/ }).click()
  await expect(page.getByRole('heading', { name: 'Betrag und Winkel komplexer Zahlen', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Beispiel' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte komplexe Zahlen')
  await expectNoInnerScroll(page, 'Lernkarte komplexe Zahlen')

  await page.goto('./#/frei/umstellen/5-1155')
  await expect(field(page)).toBeVisible()
  if (test.info().project.name === 'handy') {
    // mit Winkel in der Aufgabe die Taste \pi
    await field(page).tap()
    await expect(field(page)).toBeFocused()
    await expect(page.locator('.MLK__keycap[data-keycap-value="\\\\pi"]').filter({ visible: true })).toHaveCount(1)
  }
  await enter(page, 'x=\\frac{a}{\\tan\\left(y-\\frac{\\pi}{4}\\right)}')
  await expect(feedback(page)).toContainText('Richtig!')
})

test('Umstellen Stufe 5: Additionstheorem geführt (Beispiel aus dem Plan), durch cos x teilen, mit Lernkarte aus Teil 8c', async ({ page }) => {
  // b\sin(x + a) = y\cos x mit x < \frac{\pi}{2}
  await page.goto('./#/ueben/umstellen/5-2333')
  await expect(page.getByText('Was steht da eigentlich?')).toBeVisible()
  await expect(page.locator('#question')).toContainText('mit dem Additionstheorem aus')
  await expectCleanPage(page, 'Start Stufe 5 Additionstheorem')
  // richtig und drei Fehler: gliedweise, Vorzeichen in der Mitte, Sinus und Kosinus falsch gepaart
  await expect(answers(page)).toHaveCount(4)
  await solveWholeTask(page, (step) => expectNoInnerScroll(page, `Frage ${step + 1}`))
  await expect(page.getByTestId('result')).toBeVisible()
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await expect(cards.getByRole('link', { name: /^Additionstheoreme/ })).toBeVisible()
  await expectCleanPage(page, 'Stufe 5 Additionstheorem')

  await cards.getByRole('link', { name: /^Additionstheoreme/ }).click()
  await expect(page.getByRole('heading', { name: 'Additionstheoreme', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Beispiel' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Additionstheoreme')
  await expectNoInnerScroll(page, 'Lernkarte Additionstheoreme')
})

test('Umstellen Stufe 5 frei: doppelter Winkel (Beispiel aus dem Plan), Plus statt Minus, die 2 vorgezogen, dann richtig', async ({ page }) => {
  // \cos(2x) = y\sin x mit x < \frac{\pi}{2}
  await page.goto('./#/frei/umstellen/5-1539')
  await expect(field(page)).toBeVisible()
  await expectCleanPage(page, 'Start Stufe 5 doppelter Winkel frei')
  await enter(page, '\\arcsin\\left(\\frac{1}{y}\\right)')
  await expect(feedback(page)).toContainText('Plus statt Minus')
  await enter(page, '\\arctan\\left(\\frac{2}{y}\\right)')
  await expect(feedback(page)).toContainText('aus dem Winkel vor die Funktion gezogen')
  await expectCleanPage(page, 'Stufe 5 doppelter Winkel frei, Fehler')
  await enter(page, 'x=\\arcsin\\left(\\frac{\\sqrt{y^2+8}-y}{4}\\right)')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Richtig Stufe 5 doppelter Winkel')
})

test('Umstellen Stufe 4: sin² und cos², ein Quadrat ersetzen, Umkehrfunktion, mit beiden Lernkarten aus Teil 6b', async ({ page }) => {
  // n\cos^2 x = m - k\sin^2 x mit x < \frac{\pi}{2}
  await page.goto('./#/ueben/umstellen/4-16')
  await expect(page.locator('#question')).toContainText('Wie bleibt nur eine Funktion übrig?')
  await expect(page.getByText(/dazu/).first()).toBeVisible()
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await expect(cards.getByRole('link', { name: 'Winkel- und Hyperbelfunktionen' })).toBeVisible()
  await expect(cards.getByRole('link', { name: 'Umkehrfunktionen' })).toBeVisible()
  await expectCleanPage(page, 'Stufe 4 Winkel')
})

test('Umstellen Stufe 4 frei: sin und cos im Bruch, Kehrwert statt Umkehrfunktion, dann richtig', async ({ page }) => {
  // \frac{p\sin x + 3\cos x}{q\sin x + \cos x} = y
  await page.goto('./#/frei/umstellen/4-73')
  await expect(field(page)).toBeVisible()
  await expectCleanPage(page, 'Start Stufe 4 Winkel')
  if (test.info().project.name === 'handy') {
    // zweite Tastaturseite mit den Winkel- und Umkehrfunktionen
    await field(page).tap()
    await expect(field(page)).toBeFocused()
    await page.getByText('Funktionen', { exact: true }).first().tap()
    await expect(page.locator('.MLK__keycap', { hasText: /^arctan$/ }).filter({ visible: true }).first()).toBeVisible()
  }
  await enter(page, '\\frac{1}{\\tan\\left(\\frac{3-y}{qy-p}\\right)}')
  await expect(feedback(page)).toContainText('Kehrwert verwechselt')
  await enter(page, '\\arctan\\left(\\frac{3-y}{qy-p}\\right)')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Richtig Stufe 4 Winkel')
})

test('Umstellen Stufe 2 frei: Aufgabe aus dem Baukasten, Minus beim Ausklammern verloren, dann richtig', async ({ page }) => {
  // ax − c = bx − dg nach x
  await page.goto('./#/frei/umstellen/2-37')
  await expect(field(page)).toBeVisible()
  await expectCleanPage(page, 'Start Stufe 2')
  await enter(page, '\\frac{c-dg}{a+b}')
  await expect(feedback(page)).toContainText('Beim Ausklammern das Minus verloren')
  await enter(page, '\\frac{c-dg}{a-b}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Richtig Stufe 2')
})

test('Umstellen frei: noch nicht fertig, Wurzel gliedweise gezogen, dann richtig', async ({ page }) => {
  // y = b√(a² − x²) nach x
  await page.goto('./#/frei/umstellen/3-2047')
  await expect(field(page)).toBeVisible()
  await expect(page.getByLabel('Deine Antwort')).toContainText('x =')
  await expect(page.getByText('Alle Buchstaben stehen für positive Zahlen.')).toBeVisible()
  await expectCleanPage(page, 'Start')

  // richtig umgeformt, aber x steht noch nicht allein: zählt nicht als Fehler
  await enter(page, 'x^2=a^2-\\frac{y^2}{b^2}')
  await expect(feedback(page)).toContainText('Richtig umgeformt, aber noch nicht fertig.')
  await expect(feedback(page)).toContainText('muss allein auf einer Seite stehen')

  // richtig gerechnet, aber noch nicht zu einem Bruch zusammengefasst
  await enter(page, '\\sqrt{a^2-\\frac{y^2}{b^2}}')
  await expect(feedback(page)).toContainText('Richtig gerechnet, aber noch nicht fertig.')
  await expect(feedback(page)).toContainText('Fasse noch zu einem einzigen Bruch zusammen.')

  // typischer Fehler mit Erklärung
  await enter(page, '\\frac{ab-y}{b}')
  await expect(feedback(page)).toContainText('Wurzel aus jedem Summanden einzeln gezogen')
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expectCleanPage(page, 'Fehler')

  await enter(page, '\\frac{\\sqrt{a^2b^2-y^2}}{b}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expect(page.getByTestId('result')).toBeVisible()
  await expectCleanPage(page, 'Richtig')

  // gezählt: gelöst, aber nicht ohne Fehler
  await page.goto('./#/fortschritt')
  const progress = page.getByRole('region', { name: 'Gleichungen umstellen', exact: true })
  await expect(progress.getByRole('listitem', { name: 'Stufe 3' })).toContainText('1 gelöst')
  await expect(progress.getByRole('region', { name: 'Deine häufigsten Fehler' })).toContainText('Wurzel aus jedem Summanden einzeln gezogen')
})
