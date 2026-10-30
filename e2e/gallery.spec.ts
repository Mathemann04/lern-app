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
  // Aufbau wie die Startseite: Fach, Gebiete, Themen
  await expect(page.getByRole('heading', { name: 'Mathematik MB1' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Grundlagen' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Differentialrechnung' })).toBeVisible()
  for (const topic of ['Brüche', 'Gleichungen umstellen', 'Ableiten']) await expect(page.getByRole('link', { name: new RegExp(`^${topic}`) })).toBeVisible()
  const notation = page.getByRole('region', { name: 'Schreibweise' })
  await expect(notation.locator('.katex')).toHaveCount(14)
  await expect(notation.getByRole('heading', { name: /Kommt mit Stufe 5/ })).toBeVisible()
  await expect(notation.locator('code.text-red-700')).toHaveCount(0)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, 'Übersicht ragt seitlich heraus').toBeLessThanOrEqual(0)
  await page.getByRole('link', { name: /^Ableiten/ }).click()
  await expect(page).toHaveURL(/#\/galerie\/ableiten$/)
  await expect(page.getByRole('heading', { name: 'Ableiten', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Formel-Galerie', exact: true }).click()
  await expect(page).toHaveURL(/#\/galerie$/)
  await page.getByRole('link', { name: 'Rechenweg' }).click()
  await expect(page.getByRole('heading', { name: 'Mathematik MB1' })).toBeVisible()
})

test('Galerie zeigt in jeder Stufe sauber gesetzte Aufgaben', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/galerie/ableiten')

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
  await page.goto('./#/galerie/ableiten')
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
  await page.goto('./#/galerie/ableiten')
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
  await page.goto('./#/galerie/ableiten')
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

test('Galerie zeigt Bruchaufgaben der Stufen 1 bis 5 mit Rechenweg und typischen Fehlern', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/galerie')
  await page.getByRole('link', { name: /^Brüche/ }).click()
  await expect(page.getByRole('heading', { name: 'Brüche', level: 1 })).toBeVisible()
  await page.getByLabel('Rechenweg zeigen').check()
  await page.getByLabel('Typische Fehler zeigen').check()

  for (const level of [1, 2, 3, 4, 5]) {
    await page.getByRole('button', { name: `Stufe ${level}` }).click()
    await expect(randomTasks(page)).toHaveCount(8)
    await expect(randomTasks(page).first()).toContainText(`Aufgabe ${level}-`)
    await expect(page.getByTestId('fraction-result')).toHaveCount(8)
    await expect(page.getByRole('heading', { name: 'Rechenweg' }).first()).toBeVisible()
    await expect(page.locator('code.text-red-700')).toHaveCount(0)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, `Stufe ${level} ragt seitlich heraus`).toBeLessThanOrEqual(0)
  }

  // Aufgabe über ihre Nummer, z. B. 3-2: \frac{4}{x + 1} - \frac{3}{x - 3}
  await page.getByLabel('Aufgabe über ihre Nummer aufrufen').fill('3-2')
  await page.getByRole('button', { name: 'Anzeigen' }).click()
  const card = page.getByRole('region', { name: 'Aufgerufene Aufgabe' }).getByRole('article')
  await expect(card).toContainText('Aufgabe 3-2')
  await expect(card.getByText('Hauptnenner', { exact: true })).toBeVisible()
  // Stufe 5, z. B. 5-1: \frac{3}{1 - \sin x} + \frac{3}{1 + \sin x} mit sin² x + cos² x = 1
  await page.getByLabel('Aufgabe über ihre Nummer aufrufen').fill('5-1')
  await page.getByRole('button', { name: 'Anzeigen' }).click()
  await expect(card).toContainText('Aufgabe 5-1')
  await expect(card.getByText('Regel des Bausteins anwenden', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('Galerie zeigt Umstell-Aufgaben der Stufen 1 bis 3 mit Rechenweg und typischen Fehlern', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/galerie')
  await page.getByRole('link', { name: /^Gleichungen umstellen/ }).click()
  await expect(page.getByRole('heading', { name: 'Gleichungen umstellen', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Stufe 4' })).toBeDisabled()
  await page.getByLabel('Rechenweg zeigen').check()
  await page.getByLabel('Typische Fehler zeigen').check()

  for (const level of [1, 2, 3]) {
    await page.getByRole('button', { name: `Stufe ${level}` }).click()
    await expect(randomTasks(page)).toHaveCount(8)
    await expect(randomTasks(page).first()).toContainText(`Aufgabe ${level}-`)
    await expect(page.getByTestId('rearrange-result')).toHaveCount(8)
    await expect(page.getByRole('heading', { name: 'Rechenweg' }).first()).toBeVisible()
    await expect(page.locator('code.text-red-700')).toHaveCount(0)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, `Stufe ${level} ragt seitlich heraus`).toBeLessThanOrEqual(0)
  }

  // Aufgabe über ihre Nummer, z. B. 3-1: \frac{3x + a}{x - a} = b nach x
  await page.getByLabel('Aufgabe über ihre Nummer aufrufen').fill('3-1')
  await page.getByRole('button', { name: 'Anzeigen' }).click()
  const card = page.getByRole('region', { name: 'Aufgerufene Aufgabe' }).getByRole('article')
  await expect(card).toContainText('Aufgabe 3-1')
  await expect(card).toContainText('Löse nach')
  await expect(card.getByText('ausklammern').first()).toBeVisible()
  await expect(card.getByText('Beim Ausklammern die')).toBeVisible()
  expect(errors).toEqual([])
})
