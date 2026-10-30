import { type Page, expect, test } from '@playwright/test'

// Thema Brüche im Gebiet Grundlagen: geführt üben, Lernkarten, Fortschritt neben Ableiten

const answers = (page: Page) => page.getByRole('group', { name: 'Antworten' }).getByRole('button')
const correctFeedback = (page: Page) => page.getByText('Richtig!', { exact: true })
const wrongFeedback = (page: Page) => page.getByText('Nicht ganz. Versuch es noch einmal.')

async function solveWholeTask(page: Page) {
  for (let step = 0; step < 8; step++) {
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

test('Von der Startseite über Grundlagen zu den Brüchen und eine Aufgabe geführt lösen', async ({ page }) => {
  // alter Speicherstand (Version 2) mit Stufe 3 beim Ableiten
  await page.addInitScript(() => {
    if (sessionStorage.getItem('test-seeded')) return
    sessionStorage.setItem('test-seeded', '1')
    const attempts = [{ level: 3, mode: 'guided', clean: true, at: 1 }]
    const settings = { explanations: true, detail: 'detailed', derivativeLevel: 3, practiceMode: 'free' }
    localStorage.setItem('rechenweg', JSON.stringify({ version: 2, settings, progress: { attempts, errors: { 'cos-sign': 2 }, suggestionDismissed: {} } }))
  })
  await page.goto('./')
  await page.getByRole('link', { name: /^Grundlagen/ }).click()
  await expect(page).toHaveURL(/#\/gebiet\/grundlagen$/)
  await expect(page.getByRole('heading', { name: 'Grundlagen', level: 1 })).toBeVisible()
  // Formeln umstellen und Potenzen kommen bald
  await expect(page.getByText('kommt bald')).toHaveCount(2)
  await expect(page.getByRole('link', { name: /Formeln umstellen/ })).toHaveCount(0)
  await expectCleanPage(page, 'Grundlagen')

  await page.getByRole('link', { name: /^Brüche/ }).click()
  await expect(page).toHaveURL(/#\/thema\/brueche$/)
  await expect(page.getByRole('heading', { name: 'Brüche', level: 1 })).toBeVisible()
  // Frei kommt erst später: geübt wird geführt, auch wenn beim Ableiten „Frei" gewählt ist
  await expect(page.getByRole('radio', { name: /Frei/ })).toBeDisabled()
  await expect(page.getByRole('radio', { name: /^Stufe 1/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: /^Stufe 4/ })).toBeEnabled()
  await expect(page.getByRole('radio', { name: /^Stufe 5/ })).toBeDisabled()
  await expectCleanPage(page, 'Thema Brüche')

  await page.getByRole('link', { name: 'Stufe 1 geführt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/brueche\/1-\d+$/)
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  await expectCleanPage(page, 'Aufgabe gelöst')
  await page.getByRole('link', { name: 'Zur Übersicht' }).click()
  await expect(page).toHaveURL(/#\/thema\/brueche$/)
  await expect(page.getByText('1 gelöst')).toBeVisible()

  // „Weitermachen" führt jetzt zu den Brüchen, beim Ableiten bleibt Stufe 3 gewählt
  await page.goto('./')
  const card = page.getByRole('region', { name: 'Weitermachen' })
  await expect(card).toContainText('Brüche')
  await expect(card).toContainText('Stufe 1: Zahlenbrüche')
  await expect(card.getByRole('link', { name: 'Weiter üben · geführt' })).toHaveAttribute('href', '#/ueben/brueche/1')
  await page.goto('./#/thema/ableiten')
  await expect(page.getByRole('radio', { name: /^Stufe 3/ })).toBeChecked()
  await expect(page.getByRole('link', { name: 'Stufe 3 frei üben' })).toBeVisible()

  // Fortschritt getrennt je Thema, der alte Stand beim Ableiten ist noch da
  await page.goto('./#/fortschritt')
  const fractions = page.getByRole('region', { name: 'Brüche', exact: true })
  const derivatives = page.getByRole('region', { name: 'Ableiten', exact: true })
  await expect(fractions.getByRole('listitem', { name: 'Stufe 1' })).toContainText('1 gelöst')
  await expect(derivatives.getByRole('listitem', { name: 'Stufe 3' })).toContainText('1 gelöst')
  await expect(derivatives.getByRole('region', { name: 'Deine häufigsten Fehler' })).toContainText('Minuszeichen beim Kosinus vergessen')
  await expectCleanPage(page, 'Fortschritt')
})

test('Brüche: falsche Antwort mit Erklärung, Lernkarte und Ergebnis mit Hauptnenner', async ({ page }) => {
  // 5/6 + 1/10: Hauptnenner 30
  await page.goto('./#/ueben/brueche/1-88')
  await expect(page.locator('#question')).toHaveText('Was ist der Hauptnenner?')
  await answers(page).filter({ hasText: '16' }).click()
  await expect(wrongFeedback(page)).toBeVisible()
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(page.getByText('Für den Hauptnenner werden die Nenner nicht addiert.')).toBeVisible()
  await answers(page).filter({ hasText: '30' }).click()
  await expect(correctFeedback(page)).toBeVisible()

  // Lernkarte zum Schritt als Fenster über der Aufgabe
  await page.getByRole('button', { name: 'Lernkarte', exact: true }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('heading', { name: 'Plus und minus' })).toBeVisible()
  await sheet.getByRole('button', { name: 'Schließen' }).click()
  await expect(sheet).toBeHidden()

  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.getByLabel('Bisher')).toContainText('Hauptnenner')
  await solveWholeTask(page)
  await expect(page.getByText(/^Gelöst mit \d+ Fehlversuchen?\.$/)).toBeVisible()
  await expectCleanPage(page, 'Ergebnis')
})

test('Brüche: Potenzen kürzen in Stufe 2, Lernkarten-Ordner und gezieltes Üben', async ({ page }) => {
  await page.goto('./#/ueben/brueche/2-2')
  await expect(page.locator('#question')).toHaveText('Kürze so weit wie möglich.')
  await solveWholeTask(page)
  await expect(page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' }).getByRole('link', { name: 'Potenzen kürzen' })).toBeVisible()

  await page.goto('./#/karten')
  await page.getByRole('link', { name: /^Brüche/ }).click()
  await expect(page).toHaveURL(/#\/karten\/brueche$/)
  await expect(page.getByRole('heading', { name: 'Stufe 1' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Stufe 2' })).toBeVisible()
  await page.getByRole('link', { name: /^Potenzen kürzen/ }).click()
  await expect(page.getByRole('heading', { name: 'Potenzen kürzen', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Beispiel' })).toContainText('Kürzen durch')
  await expectCleanPage(page, 'Lernkarte')

  // Gezielt üben aus der Karte: eine Aufgabe, in der der Fehler als Antwort vorkommt
  await page.getByRole('link', { name: 'Gezielt üben' }).first().click()
  await expect(page).toHaveURL(/#\/ueben\/brueche\/2-\d+\?fokus=frac-power-reversed$/)
  await expect(page.getByText('Gezielt üben: Hochzahlen falsch herum abgezogen')).toBeVisible()
})

test('Brüche: Ohne freien Modus geht es geführt weiter', async ({ page }) => {
  await page.goto('./#/frei/brueche/1-5')
  await expect(page).toHaveURL(/#\/ueben\/brueche\/1-5$/)
  await expect(page.locator('#question')).toBeVisible()
})

test('Brüche Stufe 3: Zähler und Nenner zerlegen, dann kürzen', async ({ page }) => {
  // (x² − 9)/(2x + 6)
  await page.goto('./#/ueben/brueche/3-189')
  await expect(page.locator('#question')).toHaveText('Zerlege den Zähler in Faktoren.')
  await page.getByRole('button', { name: 'Tipp anzeigen' }).click()
  await expect(page.getByText('Zwei Quadrate mit Minus dazwischen')).toBeVisible()
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toContainText('Gilt für')
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await expect(cards.getByRole('link', { name: 'Binomische Formeln' })).toBeVisible()
  await expect(cards.getByRole('link', { name: 'Ausklammern' })).toBeVisible()
  await expectCleanPage(page, 'Stufe 3')
})

test('Brüche Stufe 4: Doppelbruch Schritt für Schritt', async ({ page }) => {
  // (1 + 1/x)/(1 − 1/x²)
  await page.goto('./#/ueben/brueche/4-37')
  await expect(page.locator('#question')).toHaveText('Fasse den Zähler zu einem Bruch zusammen.')
  await solveWholeTask(page)
  await expect(page.getByText('Gilt für')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' }).getByRole('link', { name: 'Doppelbrüche' })).toBeVisible()
  await expectCleanPage(page, 'Stufe 4')

  // Der Ordner zeigt jetzt die Karten bis Stufe 4
  await page.goto('./#/karten/brueche')
  for (const level of ['Stufe 1', 'Stufe 2', 'Stufe 3', 'Stufe 4']) await expect(page.getByRole('heading', { name: level })).toBeVisible()
})
