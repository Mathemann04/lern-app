import { type Page, expect, test } from '@playwright/test'

// Thema Gleichungen umstellen im Gebiet Grundlagen: geführt üben (Stufen 1 bis 4), frei eintippen,
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

async function solveWholeTask(page: Page) {
  for (let step = 0; step < 30; step++) {
    if (await page.getByRole('heading', { name: 'Geschafft!' }).isVisible()) return
    await expect(page.locator('#question')).toBeVisible()
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

test('Von der Startseite zu „Gleichungen umstellen" und eine Aufgabe der Stufe 2 geführt lösen', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: /^Grundlagen/ }).click()
  await page.getByRole('link', { name: /^Gleichungen umstellen/ }).click()
  await expect(page).toHaveURL(/#\/thema\/umstellen$/)
  await expect(page.getByRole('heading', { name: 'Gleichungen umstellen', level: 1 })).toBeVisible()
  // Stufen 1 bis 4 spielbar, geführt und frei; Stufe 5 folgt bald
  await expect(page.getByRole('radio', { name: /^Stufe 1/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: /^Stufe 4/ })).toBeEnabled()
  await expect(page.getByRole('radio', { name: /^Stufe 5.*folgt bald/ })).toBeDisabled()
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
  await expect(page.locator('main li a')).toHaveCount(13)
  await expectCleanPage(page, 'Ordner')

  await page.getByRole('link', { name: /^Variable im Nenner/ }).click()
  await expect(page.getByRole('heading', { name: 'Variable im Nenner', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Beispiel' })).toContainText('Beide Seiten mal')
  // gezielt üben kommt erst später für dieses Thema
  await expect(page.getByRole('link', { name: 'Gezielt üben' })).toHaveCount(0)
  await expectCleanPage(page, 'Lernkarte')
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
