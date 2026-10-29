import { type Page, expect, test } from '@playwright/test'

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

const randomTasks = (page: Page) => page.getByRole('region', { name: 'Zufällige Aufgaben' }).getByRole('article')

test('Galerie ist über die Einstellungen erreichbar, mit der Schreibweise der Formeln', async ({ page }) => {
  await page.goto('./#/einstellungen')
  await page.getByRole('link', { name: /Formel-Galerie/ }).click()
  await expect(page.getByRole('heading', { name: 'Formel-Galerie' })).toBeVisible()
  const notation = page.getByRole('region', { name: 'Schreibweise' })
  await expect(notation.locator('.katex')).toHaveCount(6)
  await expect(notation.locator('code.text-red-700')).toHaveCount(0)
  await page.getByRole('link', { name: 'Rechenweg' }).click()
  await expect(page.getByRole('heading', { name: 'Mathematik MB1' })).toBeVisible()
})

test('Galerie zeigt in jeder Stufe sauber gesetzte Aufgaben', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/galerie')

  for (const level of [1, 2, 3, 4, 5]) {
    await page.getByRole('button', { name: `Stufe ${level}` }).click()
    await expect(page.getByRole('button', { name: `Stufe ${level}` })).toHaveAttribute('aria-pressed', 'true')
    await expect(randomTasks(page)).toHaveCount(8)
    await expect(randomTasks(page).first()).toContainText(`Aufgabe ${level}-`)
    await expect(page.locator('code.text-red-700')).toHaveCount(0)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, `Stufe ${level} ragt seitlich heraus`).toBeLessThanOrEqual(0)
  }

  expect(errors).toEqual([])
})

test('Neue Aufgaben würfelt neu, Rechenweg und typische Fehler lassen sich einblenden', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/galerie')
  const before = await randomTasks(page).first().textContent()
  await page.getByRole('button', { name: 'Neue Aufgaben' }).click()
  await expect(randomTasks(page).first()).not.toHaveText(before ?? '')

  await expect(page.getByTestId('derivative').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Rechenweg' })).toHaveCount(0)

  for (const level of [1, 3, 4, 5]) {
    await page.getByRole('button', { name: `Stufe ${level}` }).click()
    await page.getByLabel('Rechenweg zeigen').check()
    await page.getByLabel('Typische Fehler zeigen').check()
    await expect(page.getByRole('heading', { name: /Typische Fehler/ }).first()).toBeVisible()
    await expect(page.locator('code.text-red-700')).toHaveCount(0)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, `Stufe ${level} ragt seitlich heraus`).toBeLessThanOrEqual(0)
  }
  await expect(page.getByRole('heading', { name: 'Rechenweg' }).first()).toBeVisible()
  expect(errors).toEqual([])
})

test('Gleiche Aufgaben-Nummer ergibt immer dieselbe Aufgabe', async ({ page }) => {
  await page.goto('./#/galerie')
  const field = page.getByLabel('Aufgabe über ihre Nummer aufrufen')
  const card = page.getByRole('region', { name: 'Aufgerufene Aufgabe' }).getByRole('article')

  await field.fill('3-48213')
  await page.getByRole('button', { name: 'Anzeigen' }).click()
  await expect(card).toContainText('Aufgabe 3-48213')
  const first = await card.locator('.katex-mathml').first().textContent()

  await page.reload()
  await field.fill('3-48213')
  await page.getByRole('button', { name: 'Anzeigen' }).click()
  await expect(card.locator('.katex-mathml').first()).toHaveText(first ?? '')

  await field.fill('9-1')
  await page.getByRole('button', { name: 'Anzeigen' }).click()
  await expect(page.getByText('Bitte so eingeben')).toBeVisible()
})

test('Implizite Aufgabe in der Galerie: y\', beide Seiten im Rechenweg, typische Fehler', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/galerie')
  await page.getByLabel('Rechenweg zeigen').check()
  await page.getByLabel('Typische Fehler zeigen').check()
  await page.getByLabel('Aufgabe über ihre Nummer aufrufen').fill('5-43')
  await page.getByRole('button', { name: 'Anzeigen' }).click()
  const card = page.getByRole('region', { name: 'Aufgerufene Aufgabe' }).getByRole('article')
  await expect(card.getByTestId('derivative')).toContainText('y′')
  await expect(card.getByText('Linke Seite')).toBeVisible()
  await expect(card.getByText('Rechte Seite')).toBeVisible()
  await expect(card.getByRole('heading', { name: /Typische Fehler \([1-9]/ })).toBeVisible()
  await expect(page.locator('code.text-red-700')).toHaveCount(0)
  expect(errors).toEqual([])
})
