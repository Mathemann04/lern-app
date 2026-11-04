import { type Page, expect, test } from '@playwright/test'

// Brüche Stufen 3 und 4 aus dem Baukasten (M2b): Zahl vorn, in Gruppen ausklammern, Abwechslung

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

// Probiert die Antworten des Schritts durch, bis „Warum ist das falsch?" den gesuchten Text zeigt
async function findWrongAnswer(page: Page, why: string) {
  const count = await answers(page).count()
  for (let i = 0; i < count; i++) {
    const button = answers(page).nth(i)
    if (await button.isDisabled()) continue
    await button.click()
    await correctFeedback(page).or(wrongFeedback(page)).waitFor()
    if (await correctFeedback(page).isVisible()) continue
    await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
    if (await page.getByText(why).isVisible()) return
  }
  throw new Error(`keine Antwort mit „${why}"`)
}

async function expectCleanPage(page: Page, context: string) {
  await expect(page.locator('code.text-red-700'), context).toHaveCount(0)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${context}: ragt seitlich heraus`).toBeLessThanOrEqual(0)
}

test('Stufe 4: Zerlegen mit Zahl vorn, typischer Fehler und Lernkarte', async ({ page }) => {
  // (2x² − 7x + 3)/(x² − 6x + 9)
  await page.goto('./#/ueben/brueche/4-132?fokus=frac-leading-forgotten')
  await expect(page.locator('#question')).toHaveText('Zerlege den Zähler in Faktoren.')
  await page.getByRole('button', { name: 'Tipp anzeigen' }).click()
  await expect(page.getByText('Steht eine Zahl')).toBeVisible()
  await findWrongAnswer(page, 'gehört sie mit in die Zerlegung')
  await expectCleanPage(page, 'Zahl vorn')
  await solveWholeTask(page)
  await expect(page.getByTestId('result')).toContainText('Gilt für')
  await expect(page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' }).getByRole('link', { name: 'Zerlegen mit Zahl vorn' })).toBeVisible()
  await expectCleanPage(page, 'Ergebnis')
})

test('Stufe 4: in Gruppen ausklammern, Lernkarte mit Beispiel', async ({ page }) => {
  // (pu − 4p + u − 4)/(u² − 8u + 16)
  await page.goto('./#/ueben/brueche/4-303')
  await expect(page.locator('#question')).toHaveText('Zerlege den Zähler in Faktoren.')
  await page.getByRole('button', { name: 'Tipp anzeigen' }).click()
  await expect(page.getByText('Fasse je zwei Summanden zu einer Gruppe zusammen')).toBeVisible()
  await solveWholeTask(page)
  const cards = page.getByRole('navigation', { name: 'Lernkarten zu dieser Aufgabe' })
  await cards.getByRole('link', { name: 'In Gruppen ausklammern' }).click()
  await expect(page.getByRole('heading', { name: 'In Gruppen ausklammern', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Beispiel' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte')
})

for (const level of [3, 4]) {
  test(`Stufe ${level}: zehn neue Aufgaben nacheinander mit verschiedener Form`, async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.goto(`./#/ueben/brueche/${level}`)
      await expect(page).toHaveURL(new RegExp(`#/ueben/brueche/${level}-\\d+$`))
      await expect(page.locator('#question')).toBeVisible()
      await expectCleanPage(page, `Aufgabe ${i + 1}`)
    }
    const forms = await page.evaluate((key) => (JSON.parse(localStorage.getItem('rechenweg-formen') ?? '{}') as Record<string, string[]>)[key] ?? [], `brueche:${level}`)
    expect(forms).toHaveLength(10)
    expect(new Set(forms).size).toBe(10)
  })
}
