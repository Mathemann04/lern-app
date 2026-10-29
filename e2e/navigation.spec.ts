import { type Page, expect, test } from '@playwright/test'

const menu = (page: Page) => page.getByRole('navigation', { name: 'Hauptmenü' })
const isPhone = () => test.info().project.name === 'handy'

test('Hauptmenü: Start, Lernkarten, Fortschritt, Einstellungen, der aktuelle Bereich ist markiert', async ({ page }) => {
  await page.goto('./')
  await expect(menu(page).getByRole('link')).toHaveText(['Start', 'Lernkarten', 'Fortschritt', 'Einstellungen'])
  await expect(menu(page).getByRole('link', { name: 'Start' })).toHaveAttribute('aria-current', 'page')

  const box = (await menu(page).boundingBox())!
  const viewport = page.viewportSize()!
  if (isPhone()) {
    // Am Handy als Leiste unten
    expect(box.y + box.height).toBeCloseTo(viewport.height, 0)
  } else {
    // Am Laptop oben im Kopf
    expect(box.y).toBeLessThan(100)
  }

  await menu(page).getByRole('link', { name: 'Fortschritt' }).click()
  await expect(page.getByRole('heading', { name: 'Dein Fortschritt' })).toBeVisible()
  await expect(menu(page).getByRole('link', { name: 'Fortschritt' })).toHaveAttribute('aria-current', 'page')
  await menu(page).getByRole('link', { name: 'Einstellungen' }).click()
  await expect(page).toHaveURL(/#\/einstellungen$/)
  await menu(page).getByRole('link', { name: 'Lernkarten' }).click()
  await page.getByRole('link', { name: /^Ableiten/ }).click()
  await page.getByRole('link', { name: /^Potenzregel/ }).click()
  // Auch auf einer einzelnen Karte bleibt „Lernkarten" markiert
  await expect(menu(page).getByRole('link', { name: 'Lernkarten' })).toHaveAttribute('aria-current', 'page')
  await menu(page).getByRole('link', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Mathematik MB1' })).toBeVisible()
})

test('Die Leiste verdeckt nichts und ist in Aufgaben ausgeblendet', async ({ page }) => {
  await page.goto('./')
  // Ganz nach unten: Das Ende der Seite steht über der Leiste
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const footer = (await page.getByTestId('offline-status').boundingBox())!
  const bar = (await menu(page).boundingBox())!
  if (isPhone()) expect(footer.y + footer.height).toBeLessThanOrEqual(bar.y)

  await page.goto('./#/ueben/1-1')
  await expect(page.locator('#question')).toBeVisible()
  await expect(menu(page)).toHaveCount(0)
  await page.getByRole('link', { name: 'Aufgabe beenden' }).click()
  await expect(menu(page)).toBeVisible()
})

test('Unterseiten haben einen Zurück-Knopf', async ({ page }) => {
  await page.goto('./#/galerie')
  await page.getByRole('main').getByRole('link', { name: 'Einstellungen', exact: true }).click()
  await expect(page).toHaveURL(/#\/einstellungen$/)
  await page.goto('./#/thema/ableiten')
  await page.getByRole('link', { name: 'Differentialrechnung', exact: true }).click()
  await expect(page).toHaveURL(/#\/gebiet\/differentialrechnung$/)
  await page.getByRole('main').getByRole('link', { name: 'Start', exact: true }).click()
  await expect(page).toHaveURL(/#\/$/)
  await page.goto('./#/karten/ableitungen/quotient')
  await page.getByRole('link', { name: 'Ableiten', exact: true }).click()
  await expect(page).toHaveURL(/#\/karten\/ableitungen$/)
  await page.getByRole('link', { name: 'Lernkarten', exact: true }).first().click()
  await expect(page).toHaveURL(/#\/karten$/)
})
