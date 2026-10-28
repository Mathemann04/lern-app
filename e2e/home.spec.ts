import { expect, test } from '@playwright/test'

test('Startseite zeigt Themen und gesetzte Formeln', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('./')

  await expect(page.getByRole('heading', { name: 'Mathe Schritt für Schritt selbst lösen' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ableitungen' })).toBeVisible()
  await expect(page.locator('.katex').first()).toBeVisible()
  expect(await page.locator('.katex').count()).toBeGreaterThanOrEqual(15)
  // Rote Ersatzanzeige erscheint nur, wenn eine Formel nicht gesetzt werden konnte
  await expect(page.locator('code.text-red-700')).toHaveCount(0)

  // Nichts ragt seitlich über den Bildschirm hinaus
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)

  expect(errors).toEqual([])
})

test('App funktioniert nach dem ersten Besuch auch offline', async ({ page, context }) => {
  await page.goto('./')
  await expect(page.getByTestId('offline-status')).toHaveText('Offline nutzbar ✓', { timeout: 15_000 })

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { name: 'Ableitungen' })).toBeVisible()
  await expect(page.locator('.katex').first()).toBeVisible()
  await expect(page.getByTestId('offline-status')).toHaveText('Offline nutzbar ✓')
})
