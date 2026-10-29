import { type Page, expect, test } from '@playwright/test'

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

async function expectCleanPage(page: Page, context: string) {
  // Rote Ersatzanzeige erscheint nur, wenn eine Formel nicht gesetzt werden konnte
  await expect(page.locator('code.text-red-700'), context).toHaveCount(0)
  // Nichts ragt seitlich über den Bildschirm hinaus
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${context}: ragt seitlich heraus`).toBeLessThanOrEqual(0)
}

test('Startseite zeigt Fächer mit Gebieten, Kommendes blass, und „Los geht’s"', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./')

  await expect(page.getByRole('heading', { name: 'Mathe Schritt für Schritt selbst lösen' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Los geht’s', 'Mathematik MB1', 'Physik', 'Technische Mechanik'])
  // Nur die Differentialrechnung lässt sich öffnen; Grundlagen, Integralrechnung, Physik und Statik kommen bald
  await expect(page.getByRole('link', { name: /^Differentialrechnung/ })).toBeVisible()
  await expect(page.getByText('kommt bald')).toHaveCount(4)
  await expect(page.getByRole('link', { name: /Integralrechnung/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Erste Aufgabe · geführt' })).toHaveAttribute('href', '#/ueben/1')
  await expectCleanPage(page, 'Startseite')
  expect(errors).toEqual([])
})

test('Von der Startseite über Gebiet und Thema zur Aufgabe und zurück', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./')
  await page.getByRole('link', { name: /^Differentialrechnung/ }).click()
  await expect(page).toHaveURL(/#\/gebiet\/differentialrechnung$/)
  await expect(page.getByRole('heading', { name: 'Differentialrechnung', level: 1 })).toBeVisible()
  await expectCleanPage(page, 'Gebiet')

  await page.getByRole('link', { name: /^Ableiten/ }).click()
  await expect(page).toHaveURL(/#\/thema\/ableiten$/)
  await expect(page.getByRole('heading', { name: 'Ableiten', level: 1 })).toBeVisible()
  // Beispiel-Formeln aller fünf Stufen
  expect(await page.locator('.katex').count()).toBeGreaterThanOrEqual(11)
  await expectCleanPage(page, 'Thema')

  await page.getByText('Zwei Regeln kombiniert').click()
  await page.getByRole('link', { name: 'Stufe 3 geführt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/3-\d+$/)
  // Das X führt zurück zum Thema
  await page.getByRole('link', { name: 'Aufgabe beenden' }).click()
  await expect(page).toHaveURL(/#\/thema\/ableiten$/)

  // „Weitermachen" merkt sich Stufe und Art
  await page.goto('./')
  await expect(page.getByText('Stufe 3: Zwei Regeln kombiniert')).toBeVisible()
  await page.getByRole('link', { name: 'Erste Aufgabe · geführt' }).click()
  await expect(page).toHaveURL(/#\/ueben\/3-\d+$/)
  expect(errors).toEqual([])
})

test('Gelöste Aufgaben: „Weitermachen" mit Fortschritt', async ({ page }) => {
  await page.addInitScript(() => {
    const attempts = [true, false, true].map((clean, i) => ({ level: 4, mode: 'free', clean, at: i }))
    const settings = { explanations: true, detail: 'detailed', derivativeLevel: 4, practiceMode: 'free' }
    localStorage.setItem('rechenweg', JSON.stringify({ version: 2, settings, progress: { attempts, errors: {}, suggestionDismissed: {} } }))
  })
  await page.goto('./')
  const card = page.getByRole('region', { name: 'Weitermachen' })
  await expect(card).toContainText('Stufe 4: Uni-Niveau')
  await expect(card).toContainText('3 gelöst · zuletzt 2 von 3 ohne Fehler')
  await expect(card.getByRole('link', { name: 'Weiter üben · frei' })).toHaveAttribute('href', '#/frei/4')
  await card.getByRole('link', { name: 'Stufe oder Art ändern' }).click()
  await expect(page).toHaveURL(/#\/thema\/ableiten$/)
  await expect(page.getByRole('radio', { name: /^Stufe 4/ })).toBeChecked()
})

test('App funktioniert nach dem ersten Besuch auch offline', async ({ page, context }) => {
  await page.goto('./')
  await expect(page.getByTestId('offline-status')).toHaveText('Offline nutzbar ✓', { timeout: 15_000 })

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { name: 'Mathematik MB1' })).toBeVisible()
  await expect(page.getByTestId('offline-status')).toHaveText('Offline nutzbar ✓')
  await page.getByRole('link', { name: /^Differentialrechnung/ }).click()
  await page.getByRole('link', { name: /^Ableiten/ }).click()
  await expect(page.locator('.katex').first()).toBeVisible()
  await page.getByRole('link', { name: 'Stufe 1 geführt üben' }).click()
  await expect(page.locator('#question')).toBeVisible()
  // Auch die Seiten, die erst bei Bedarf geladen werden, liegen schon auf dem Gerät
  await page.goto('./#/karten/ableitungen/product')
  await expect(page.getByRole('heading', { name: 'Produktregel', level: 1 })).toBeVisible()
  await page.goto('./#/fortschritt')
  await expect(page.getByRole('heading', { name: 'Dein Fortschritt' })).toBeVisible()
  await page.goto('./#/galerie')
  await expect(page.getByRole('heading', { name: 'Formel-Galerie' })).toBeVisible()
})
