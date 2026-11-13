import { type Page, expect, test } from '@playwright/test'

// Matrizen und Gleichungssysteme (M7 Schritt 8a): Kachel auf der Mathe-Seite, Seite der Tätigkeit mit dem Baustein
// „Matrizen rechnen“, je Stufe eine Aufgabe geführt lösen, Bild bei Matrix mal Vektor, Lernkarte, freier Modus mit
// einer Matrix in Kästchen (falscher Eintrag markiert, typischer Fehler erkannt)

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

const answers = (page: Page) => page.getByRole('group', { name: 'Antworten' }).getByRole('button')
const correctFeedback = (page: Page) => page.getByText('Richtig!', { exact: true })
const wrongFeedback = (page: Page) => page.getByText('Nicht ganz. Versuch es noch einmal.')

async function solveWholeTask(page: Page) {
  for (let step = 0; step < 30; step++) {
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

async function typeInto(page: Page, label: string, text: string) {
  const field = page.locator(`math-field[data-ready][aria-label="${label}"]`)
  await field.focus()
  await expect(field).toBeFocused()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Backspace')
  await page.keyboard.type(text)
}

test('Mathe-Seite zeigt die Kachel „Matrizen und Gleichungssysteme“, die Seite der Tätigkeit hat den Baustein', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/fach/mathe')
  await page.getByRole('link', { name: /Matrizen und Gleichungssysteme/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Matrizen und Gleichungssysteme', level: 1 })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Matrizen rechnen', exact: true })).toBeChecked()
  await expect(page.getByTestId('example').locator('.katex').first()).toBeVisible()
  await expectCleanPage(page, 'Tätigkeit Matrizen')
  expect(errors).toEqual([])
})

test('Matrizen: jede Stufe lässt sich lösen, Bild bei Matrix mal Vektor, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/matrizen/matrix.${level}-${60 + level}`)
    await solveWholeTask(page)
    await expectCleanPage(page, `Matrizen Stufe ${level}`)
  }
  // matrix.2-1: Matrix mal Vektor mit Bild (Einheitsquadrat wird zum Parallelogramm)
  await page.goto('./#/ueben/matrizen/matrix.2-1')
  await expect(page.getByTestId('vector-figure').first()).toBeVisible()
  await solveWholeTask(page)
  await expect(page.getByTestId('result').getByTestId('vector-figure')).toBeVisible()
  await expectCleanPage(page, 'Matrix mal Vektor')
  await page.goto('./#/karten/matrizen/mat-produkt')
  await expect(page.getByRole('heading', { name: 'Produkt mit dem Falk-Schema' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Produkt')
  expect(errors).toEqual([])
})

test('Frei: Matrix in Kästchen, falscher Eintrag markiert, typischer Fehler beim Transponieren erkannt', async ({ page }) => {
  const errors = collectErrors(page)
  // matrix.1-1: P = (−3 −2 −2 | 5 0 −2), Pᵀ = (−3 5 | −2 0 | −2 −2)
  await page.goto('./#/frei/matrizen/matrix.1-1')
  const fill = async (rows: readonly (readonly string[])[]) => {
    for (const [i, row] of rows.entries()) for (const [j, x] of row.entries()) await typeInto(page, `Zeile ${i + 1}, Spalte ${j + 1}`, x)
  }
  // nur ins neue Format umgefüllt
  await fill([
    ['-3', '-2'],
    ['-2', '5'],
    ['0', '-2'],
  ])
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Einträge nur ins neue Format umgefüllt.')).toBeVisible()
  // ein Eintrag falsch: nur dieser markiert
  await fill([
    ['-3', '5'],
    ['-2', '0'],
    ['-2', '2'],
  ])
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.locator('[data-testid="entry"][data-marked="true"]')).toHaveCount(1)
  await typeInto(page, 'Zeile 3, Spalte 2', '-2')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Matrix frei')
  expect(errors).toEqual([])
})
