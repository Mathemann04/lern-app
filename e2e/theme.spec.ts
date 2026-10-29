import { expect, test } from '@playwright/test'

test('Dunkles Design: automatisch wie das Gerät oder fest gewählt', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('./')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)

  await page.goto('./#/einstellungen')
  await expect(page.getByRole('radio', { name: 'Automatisch' })).toBeChecked()
  await page.getByText('Hell', { exact: true }).click()
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  // Die Wahl bleibt nach dem Neuladen (das Skript in index.html setzt sie vor dem ersten Bild)
  await page.reload()
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)

  await page.emulateMedia({ colorScheme: 'light' })
  await page.getByText('Dunkel', { exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#09090b')
  // Auch die Mathe-Tastatur (MathLive) folgt der Wahl
  await expect(page.locator('body')).toHaveAttribute('theme', 'dark')
})

test('Gebiete zeigen sich in ihrer eigenen Farbe', async ({ page }) => {
  // Hintergrund des Übungsknopfs: Blau der Differentialrechnung statt Blaugrün der App
  await page.goto('./#/thema/ableiten')
  const button = page.getByRole('link', { name: 'Stufe 1 geführt üben' })
  const blue = await button.evaluate((el) => getComputedStyle(el).backgroundColor)
  await page.goto('./#/galerie')
  const teal = await page.getByRole('button', { name: 'Neue Aufgaben' }).evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(blue).not.toEqual(teal)
  await page.goto('./')
  await expect(page.getByRole('link', { name: /^Differentialrechnung/ })).toHaveAttribute('data-tone', 'blue')
  await expect(page.getByRole('region', { name: 'Los geht’s' })).toHaveAttribute('data-tone', 'blue')
})
