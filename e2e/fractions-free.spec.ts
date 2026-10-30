import { type Page, expect, test } from '@playwright/test'

// Brüche im freien Modus: Ergebnis eintippen, Hinweise bei unfertigen Formen, typische Fehler

const field = (page: Page) => page.locator('math-field[data-ready]')
const feedback = (page: Page) => page.locator('[aria-live="polite"]')
const isPhone = () => test.info().project.name === 'handy'

// Setzt die Eingabe direkt und prüft sie (das Tippen selbst testet free.spec.ts)
async function enter(page: Page, latex: string) {
  await page.evaluate((value) => {
    const element = document.querySelector('math-field') as HTMLElement & { value: string; executeCommand: (c: string) => void }
    element.value = value
    element.executeCommand('commit')
  }, latex)
}

async function expectCleanPage(page: Page, context: string) {
  await expect(page.locator('code.text-red-700'), context).toHaveCount(0)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${context}: ragt seitlich heraus`).toBeLessThanOrEqual(0)
}

test('Beispiel aus dem Plan: 3/(x − 1) − 2/(x + 1) frei lösen', async ({ page }) => {
  await page.goto('./#/frei/brueche/3-11641')
  await expect(field(page)).toBeVisible()
  await expect(page.getByLabel('Deine Antwort')).toContainText('=')
  await expectCleanPage(page, 'Start')

  // richtig gerechnet, aber noch nicht fertig: zählt nicht als Fehler
  await enter(page, '\\frac{3x+3-2x+2}{x^2-1}')
  await expect(feedback(page)).toContainText('Richtig gerechnet, aber noch nicht fertig.')
  await expect(feedback(page)).toContainText('Fasse den Zähler noch zusammen')

  // Klammer nach dem Minus vergessen, auch weitergekürzt erkannt
  await enter(page, '\\frac{1}{x-1}')
  await expect(feedback(page)).toContainText('Typischer Fehler: Klammer nach dem Minus vergessen.')
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(feedback(page)).toContainText('Das Minus vor einem Bruch gilt für seinen ganzen Zähler')

  await enter(page, '\\frac{x+5}{x^2-1}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expect(page.getByTestId('result')).toBeVisible()
  await expect(feedback(page)).toContainText('Gilt für')
  await expectCleanPage(page, 'Richtig')

  // Lösungsweg aus dem geführten Modus
  await page.getByRole('button', { name: 'Lösungsweg ansehen' }).click()
  const path = page.getByRole('region', { name: 'Lösungsweg' })
  await expect(path.getByText('Hauptnenner', { exact: true })).toBeVisible()

  // gezählt: gelöst, aber nicht ohne Fehler
  await page.goto('./#/fortschritt')
  const fractions = page.getByRole('region', { name: 'Brüche', exact: true })
  await expect(fractions.getByRole('listitem', { name: 'Stufe 3' })).toContainText('1 gelöst · zuletzt 0 von 1 ohne Fehler')
  await expect(fractions.getByRole('region', { name: 'Deine häufigsten Fehler' })).toContainText('Klammer nach dem Minus vergessen')
})

test('Zahlenbrüche: noch nicht gekürzt, dann richtig', async ({ page }) => {
  // 3/4 + 5/6
  await page.goto('./#/frei/brueche/1-949')
  await expect(field(page)).toBeVisible()
  await enter(page, '\\frac{38}{24}')
  await expect(feedback(page)).toContainText('Noch nicht vollständig gekürzt.')
  await enter(page, '\\frac{19}{12}')
  await expect(feedback(page)).toContainText('Richtig!')
  // ohne Fehler gelöst
  await page.goto('./#/fortschritt')
  await expect(page.getByRole('region', { name: 'Brüche', exact: true }).getByRole('listitem', { name: 'Stufe 1' })).toContainText('1 gelöst · zuletzt 1 von 1 ohne Fehler')
})

test('Die Tastatur zeigt die Buchstaben der Aufgabe', async ({ page }) => {
  test.skip(!isPhone(), 'Bildschirm-Tastatur nur am Handy')
  const keys = () => page.locator('.MLK__keycap').filter({ visible: true })
  // (6x²y)/(9xy³) o. ä.: Stufe 2 mit x und y bzw. a und b
  await page.goto('./#/frei/brueche/2-2')
  await field(page).tap()
  await expect(page.locator('.ML__keyboard')).toBeVisible()
  await expect(keys().filter({ hasText: /^a$/ })).toHaveCount(1)
  await expect(keys().filter({ hasText: /^b$/ })).toHaveCount(1)
  await expect(keys().filter({ hasText: /^sin$/ })).toHaveCount(0)

  // Stufe 4 mit Bausteinen: auch sin, cos, ln
  await page.goto('./#/frei/brueche/4-1')
  await field(page).tap()
  await expect(keys().filter({ hasText: /^cos$/ })).toHaveCount(1)
})
