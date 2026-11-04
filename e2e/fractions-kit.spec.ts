import { type Page, expect, test } from '@playwright/test'

// Brüche aus dem Baukasten (M2b): Punkt vor Strich, Dezimalzahlen, Abwechslung beim Ziehen

const answers = (page: Page) => page.getByRole('group', { name: 'Antworten' }).getByRole('button')
const correctFeedback = (page: Page) => page.getByText('Richtig!', { exact: true })
const wrongFeedback = (page: Page) => page.getByText('Nicht ganz. Versuch es noch einmal.')

async function solveWholeTask(page: Page) {
  for (let step = 0; step < 16; step++) {
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

test('Punkt vor Strich: erst die Reihenfolge, dann Teil für Teil', async ({ page }) => {
  // 3/5 + 7/10 · 4/5
  await page.goto('./#/ueben/brueche/1-29')
  await expect(page.locator('#question')).toHaveText('Was rechnest du zuerst?')
  await expectCleanPage(page, 'Reihenfolge')
  // von links nach rechts (3/5 + 7/10) wäre falsch
  await answers(page).filter({ hasText: '+' }).click()
  await expect(wrongFeedback(page)).toBeVisible()
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(page.getByText('Punkt vor Strich gilt auch bei Brüchen')).toBeVisible()
  await answers(page).filter({ hasNotText: '+' }).click()
  await expect(correctFeedback(page)).toBeVisible()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.getByText('Teilrechnung:')).toBeVisible()
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' }).getByRole('link', { name: 'Punkt vor Strich und Klammern' })).toBeVisible()
  await expectCleanPage(page, 'Ergebnis')
})

test('Dezimalzahl zuerst als Bruch', async ({ page }) => {
  // −2 − 1/2 + 0,75 + 1/4
  await page.goto('./#/ueben/brueche/1-1')
  await expect(page.locator('#question')).toContainText('als gekürzten Bruch')
  await answers(page).filter({ hasText: '75' }).first().click()
  await expect(wrongFeedback(page)).toBeVisible()
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(page.getByText('Jede Stelle nach dem Komma')).toBeVisible()
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toBeVisible()
  await expectCleanPage(page, 'Dezimalzahl')
})

test('Abwechslung: zehn neue Aufgaben nacheinander mit verschiedener Form', async ({ page }) => {
  for (let i = 0; i < 10; i++) {
    await page.goto('./#/ueben/brueche/1')
    await expect(page).toHaveURL(/#\/ueben\/brueche\/1-\d+$/)
    await expect(page.locator('#question')).toBeVisible()
  }
  const forms = await page.evaluate(() => (JSON.parse(localStorage.getItem('rechenweg-formen') ?? '{}') as Record<string, string[]>)['brueche:1'] ?? [])
  expect(forms).toHaveLength(10)
  expect(new Set(forms).size).toBe(10)
})
