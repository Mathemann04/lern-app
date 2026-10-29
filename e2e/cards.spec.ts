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
  await expect(page.locator('code.text-red-700'), context).toHaveCount(0)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${context}: ragt seitlich heraus`).toBeLessThanOrEqual(0)
}

const sheet = (page: Page) => page.getByRole('dialog')
const answers = (page: Page) => page.getByRole('group', { name: 'Antworten' })

test('Lernkarten über das Menü: Ordner, Karte, anderes Beispiel, zurück, gezielt üben', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./')
  await page.getByRole('navigation', { name: 'Hauptmenü' }).getByRole('link', { name: 'Lernkarten' }).click()
  await expect(page.getByRole('heading', { name: 'Lernkarten', level: 1 })).toBeVisible()
  await expectCleanPage(page, 'Ordner')

  // Ordner öffnen: Namen der Formeln mit den Formeln
  await page.getByRole('link', { name: /^Ableiten/ }).click()
  await expect(page).toHaveURL(/#\/karten\/ableitungen$/)
  await expect(page.getByRole('heading', { name: 'Ableiten', level: 1 })).toBeVisible()
  await expect(page.locator('main li a')).toHaveCount(20)
  await expectCleanPage(page, 'Ordner Ableiten')

  await page.getByRole('link', { name: /^Produktregel/ }).click()
  await expect(page).toHaveURL(/#\/karten\/ableitungen\/product$/)
  await expect(page.getByRole('heading', { name: 'Produktregel', level: 1 })).toBeVisible()
  await expect(page.getByText('Einmal den ersten Faktor ableiten')).toBeVisible()
  const example = page.getByRole('region', { name: 'Beispiel' })
  await expect(example).toContainText('1 von 3')
  await expect(example).toContainText('Die beiden Faktoren:')
  await expect(example).toContainText('u = x^{2}, \\quad v = e^{x}')
  await expectCleanPage(page, 'Produktregel')

  await example.getByRole('button', { name: 'Anderes Beispiel' }).click()
  await expect(example).toContainText('2 von 3')
  await expect(example).toContainText('v = \\sin x')
  await expectCleanPage(page, 'Produktregel, Beispiel 2')

  await page.getByRole('link', { name: /Nächste Karte/ }).click()
  await expect(page.getByRole('heading', { name: 'Kettenregel', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Beispiel' })).toContainText('1 von 4')
  await expectCleanPage(page, 'Kettenregel')

  // Zurück führt in den Ordner, von dort zu allen Ordnern
  await page.getByRole('link', { name: 'Ableiten', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ableiten', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Lernkarten', exact: true }).first().click()
  await expect(page).toHaveURL(/#\/karten$/)
  await page.goto('./#/karten/ableitungen/chain')

  await page.getByRole('link', { name: 'Gezielt üben' }).first().click()
  await expect(page).toHaveURL(/#\/ueben\/2-\d+\?fokus=chain-inner-forgotten$/)
  await expect(page.locator('#question')).toBeVisible()
  expect(errors).toEqual([])
})

test('Lernkarten aus einer geführten Aufgabe: Fenster über der Aufgabe, Zurück schließt es', async ({ page }) => {
  // Aufgabe 2-4: f(x) = x² sin x
  await page.goto('./#/ueben/2-4')
  await expect(page.locator('#question')).toContainText('Welche Regel')

  // Bei der Regelwahl: alle angebotenen Regeln, keine ist aufgeklappt
  await page.getByRole('button', { name: 'Lernkarten' }).click()
  await expect(sheet(page)).toBeVisible()
  await expect(sheet(page).getByRole('heading', { name: 'Die Regeln zur Auswahl' })).toBeVisible()
  const choices = await answers(page).getByRole('button').count()
  await expect(sheet(page).locator('details')).toHaveCount(choices)
  await sheet(page).locator('summary', { hasText: 'Produktregel' }).click()
  await expect(sheet(page).getByRole('heading', { name: 'Merksatz' })).toBeVisible()
  await expectCleanPage(page, 'Fenster Regelwahl')
  await sheet(page).getByRole('button', { name: 'Schließen' }).click()
  await expect(sheet(page)).toBeHidden()

  // Weiter zum ersten Faktor: eine Karte (Potenzregel), direkt offen
  await answers(page).getByRole('button', { name: /^Produktregel/ }).click()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.getByText('Ersten Faktor ableiten')).toBeVisible()
  await page.getByRole('button', { name: 'Lernkarte', exact: true }).click()
  await expect(sheet(page).getByRole('heading', { name: 'Potenzregel' })).toBeVisible()
  await expect(sheet(page).getByRole('region', { name: 'Beispiel' })).toBeVisible()
  // Innerhalb einer Aufgabe kein „Gezielt üben": Die Aufgabe ginge sonst verloren
  await expect(sheet(page).getByRole('link', { name: 'Gezielt üben' })).toHaveCount(0)
  // Lange Karten lassen sich im Fenster bis zu den typischen Fehlern scrollen
  await sheet(page).getByText('Exponent nicht verringert').scrollIntoViewIfNeeded()
  await expect(sheet(page).getByText('Exponent nicht verringert')).toBeInViewport()
  await expectCleanPage(page, 'Fenster Potenzregel')

  // Zurück schließt nur das Fenster, die Aufgabe bleibt beim selben Schritt
  await page.goBack()
  await expect(sheet(page)).toBeHidden()
  await expect(page).toHaveURL(/#\/ueben\/2-4$/)
  await expect(page.getByText('Ersten Faktor ableiten')).toBeVisible()

  // Escape schließt ebenfalls
  await page.getByRole('button', { name: 'Lernkarte', exact: true }).click()
  await expect(sheet(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sheet(page)).toBeHidden()
  await expect(page.getByText('Ersten Faktor ableiten')).toBeVisible()
})

test('Freier Modus: Lernkarten zur Aufgabe und nach dem Lösen zum Nachlesen', async ({ page }) => {
  await page.goto('./#/frei/2-4')
  await expect(page.locator('math-field[data-ready]')).toBeVisible()
  await page.getByRole('button', { name: 'Lernkarten' }).click()
  await expect(sheet(page).getByRole('heading', { name: 'Lernkarten zu dieser Aufgabe' })).toBeVisible()
  await expect(sheet(page).locator('summary')).toHaveText([/Produktregel/, /Potenzregel/, /Sinus und Kosinus/])
  await expectCleanPage(page, 'Fenster frei')
  await sheet(page).getByRole('button', { name: 'Schließen' }).click()
  await expect(sheet(page)).toBeHidden()

  await page.evaluate(() => {
    const field = document.querySelector('math-field') as HTMLElement & { value: string; executeCommand: (c: string) => void }
    field.value = '2x\\sin x+x^2\\cos x'
    field.executeCommand('commit')
  })
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  const links = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await links.getByRole('link', { name: 'Sinus und Kosinus' }).click()
  await expect(page).toHaveURL(/#\/karten\/ableitungen\/sin-cos$/)
  await expect(page.getByRole('heading', { name: 'Sinus und Kosinus', level: 1 })).toBeVisible()
})
