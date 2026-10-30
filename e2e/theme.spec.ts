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

test('Dunkles Design: Eingabe im freien Modus ist lesbar', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('./#/frei/brueche/1-949')
  const field = page.locator('math-field[data-ready]')
  await expect(field).toBeVisible()
  // Wie auf manchen Handys: Die Schriftfarbe des Browsers für Eingabefelder bleibt schwarz
  await page.addStyleTag({ content: 'math-field { color-scheme: light; }' })
  await field.evaluate((el) => {
    ;(el as HTMLElement & { value: string }).value = '\\frac{19}{12}'
  })
  const colors = await field.evaluate((el) => ({
    text: getComputedStyle(el).color,
    page: getComputedStyle(document.body).color,
  }))
  expect(colors.text).toBe(colors.page)
})

test('Gebiete zeigen sich in ihrer eigenen Farbe', async ({ page }) => {
  // Hintergrund des Übungsknopfs: Blau der Differentialrechnung
  await page.goto('./#/thema/ableiten')
  const button = page.getByRole('link', { name: 'Stufe 1 geführt üben' })
  const blue = await button.evaluate((el) => getComputedStyle(el).backgroundColor)
  // In der Galerie: Ableiten blau wie die Differentialrechnung, Brüche orange wie die Grundlagen
  await page.goto('./#/galerie')
  const newTasks = page.getByRole('button', { name: 'Neue Aufgaben' })
  expect(await newTasks.evaluate((el) => getComputedStyle(el).backgroundColor)).toEqual(blue)
  await page.getByRole('button', { name: 'Brüche' }).click()
  await expect.poll(() => newTasks.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toEqual(blue)
  await page.goto('./')
  await expect(page.getByRole('link', { name: /^Differentialrechnung/ })).toHaveAttribute('data-tone', 'blue')
  await expect(page.getByRole('region', { name: 'Los geht’s' })).toHaveAttribute('data-tone', 'blue')
})
