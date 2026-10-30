import { type Page, expect, test } from '@playwright/test'

// Thema Gleichungen umstellen im Gebiet Grundlagen: geführt üben (Stufen 1 bis 3), frei eintippen,
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
  for (let step = 0; step < 16; step++) {
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
  // Stufen 1 bis 3 spielbar, geführt und frei; ab Stufe 4 folgt bald
  await expect(page.getByRole('radio', { name: /^Stufe 1/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: /^Stufe 3/ })).toBeEnabled()
  await expect(page.getByRole('radio', { name: /^Stufe 4.*folgt bald/ })).toBeDisabled()
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
  // a(5x − b) − c = d nach x
  await page.goto('./#/ueben/umstellen/1-1')
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
  await expect(page.locator('main li a')).toHaveCount(7)
  await expectCleanPage(page, 'Ordner')

  await page.getByRole('link', { name: /^Variable im Nenner/ }).click()
  await expect(page.getByRole('heading', { name: 'Variable im Nenner', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Beispiel' })).toContainText('Beide Seiten mal')
  // gezielt üben kommt erst später für dieses Thema
  await expect(page.getByRole('link', { name: 'Gezielt üben' })).toHaveCount(0)
  await expectCleanPage(page, 'Lernkarte')
})

test('Umstellen Stufe 3: zweimal quadrieren geführt, mit Lernkarte „Wurzel und Quadrat"', async ({ page }) => {
  // y = √(x + 4a) − √x
  await page.goto('./#/ueben/umstellen/3-19')
  await expect(page.locator('#question')).toHaveText('Was kommt heraus?')
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' }).getByRole('link', { name: 'Wurzel und Quadrat' })).toBeVisible()
  await expectCleanPage(page, 'Stufe 3')
})

test('Umstellen frei: noch nicht fertig, Wurzel gliedweise gezogen, dann richtig', async ({ page }) => {
  // y = a√(b² − x²) nach x
  await page.goto('./#/frei/umstellen/3-16')
  await expect(field(page)).toBeVisible()
  await expect(page.getByLabel('Deine Antwort')).toContainText('x =')
  await expect(page.getByText('Alle Buchstaben stehen für positive Zahlen.')).toBeVisible()
  await expectCleanPage(page, 'Start')

  // richtig umgeformt, aber x steht noch nicht allein: zählt nicht als Fehler
  await enter(page, 'x^2=b^2-\\frac{y^2}{a^2}')
  await expect(feedback(page)).toContainText('Richtig umgeformt, aber noch nicht fertig.')
  await expect(feedback(page)).toContainText('muss allein auf einer Seite stehen')

  // richtig gerechnet, aber noch nicht zu einem Bruch zusammengefasst
  await enter(page, '\\sqrt{b^2-\\frac{y^2}{a^2}}')
  await expect(feedback(page)).toContainText('Richtig gerechnet, aber noch nicht fertig.')
  await expect(feedback(page)).toContainText('Fasse noch zu einem einzigen Bruch zusammen.')

  // typischer Fehler mit Erklärung
  await enter(page, '\\frac{ab-y}{a}')
  await expect(feedback(page)).toContainText('Wurzel aus jedem Summanden einzeln gezogen')
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expectCleanPage(page, 'Fehler')

  await enter(page, '\\frac{\\sqrt{a^2b^2-y^2}}{a}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expect(page.getByTestId('result')).toBeVisible()
  await expectCleanPage(page, 'Richtig')

  // gezählt: gelöst, aber nicht ohne Fehler
  await page.goto('./#/fortschritt')
  const progress = page.getByRole('region', { name: 'Gleichungen umstellen', exact: true })
  await expect(progress.getByRole('listitem', { name: 'Stufe 3' })).toContainText('1 gelöst')
  await expect(progress.getByRole('region', { name: 'Deine häufigsten Fehler' })).toContainText('Wurzel aus jedem Summanden einzeln gezogen')
})
