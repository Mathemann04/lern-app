import { type Page, expect, test } from '@playwright/test'

// Vektoren (M7 Schritt 1): Kachel auf der Mathe-Seite, Seite der Tätigkeit, eine Aufgabe je Stufe geführt lösen, Bilder
// (Ebene, Raum zum Drehen, Antworten als Bilder, Abspielen), Lernkarte mit Bild

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

test('Mathe-Seite zeigt die Kachel „Vektoren", die Seite der Tätigkeit hat Baustein und Stufen', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/fach/mathe')
  await page.getByRole('link', { name: /Vektoren/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Vektoren', level: 1 })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Rechnen und Länge', exact: true })).toBeChecked()
  await expect(page.getByTestId('example').locator('.katex').first()).toBeVisible()
  await expectCleanPage(page, 'Tätigkeit Vektoren')
  expect(errors).toEqual([])
})

// Stufe 1, Nummer 3: Verbindungsvektor mit „Welcher Pfeil?" (Bilder als Antworten), dann die Rechnung
test('Stufe 1: Bilder als Antworten, Ergebnis mit Bild und Abspielen', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/ueben/vektoren/rechnen.1-3')
  await expect(page.getByTestId('vector-figure')).toBeVisible()
  await expect(answers(page)).toHaveCount(4)
  await expect(answers(page).first().locator('svg')).toBeVisible()
  await expectCleanPage(page, 'Bild wählen')
  await solveWholeTask(page)
  const figure = page.getByTestId('result').getByTestId('vector-figure')
  await expect(figure).toBeVisible()
  await figure.getByRole('button', { name: 'Abspielen' }).click()
  await expect(figure.locator('svg').first()).toBeVisible()
  await expectCleanPage(page, 'Ergebnis')
  expect(errors).toEqual([])
})

test('Jede Stufe lässt sich lösen, räumliche Bilder lassen sich drehen', async ({ page }) => {
  const errors = collectErrors(page)
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/vektoren/rechnen.${level}-${10 + level}`)
    await solveWholeTask(page)
    await expectCleanPage(page, `Stufe ${level}`)
  }
  // Stufe 2: Bild im Raum, Ziehen dreht es
  await page.goto('./#/ueben/vektoren/rechnen.2-1')
  await solveWholeTask(page)
  const svg = page.getByTestId('result').getByTestId('vector-figure').locator('svg').first()
  await expect(page.getByText('Zum Drehen im Bild ziehen')).toBeVisible()
  const before = await svg.innerHTML()
  const box = (await svg.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 20, { steps: 5 })
  await page.mouse.up()
  expect(await svg.innerHTML()).not.toBe(before)
  expect(errors).toEqual([])
})

test('Lernkarte „Länge eines Vektors" mit Beispiel und Bild', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/karten/vektoren/vec-laenge')
  await expect(page.getByRole('heading', { name: 'Länge eines Vektors' })).toBeVisible()
  await expect(page.getByTestId('vector-figure')).toBeVisible()
  await expectCleanPage(page, 'Lernkarte')
  expect(errors).toEqual([])
})

// M7 Schritt 1b: freier Modus mit je einem Kästchen pro Eintrag; falsche Einträge werden markiert
async function typeInto(page: Page, label: string, text: string) {
  const field = page.locator(`math-field[data-ready][aria-label="${label}"]`)
  await field.focus()
  await expect(field).toBeFocused()
  await page.keyboard.press('Control+A')
  await page.keyboard.press('Backspace')
  await page.keyboard.type(text)
}

test('Frei: Punkt und Länge in Kästchen, typischer Fehler mit Markierung, dann richtig', async ({ page }) => {
  const errors = collectErrors(page)
  // Parallelogramm, Stufe 5: F(−2 | −4 | 3) und Diagonale √13
  await page.goto('./#/frei/vektoren/rechnen.5-5')
  await expect(page.getByTestId('entry')).toHaveCount(4)
  await expectCleanPage(page, 'frei leer')
  await typeInto(page, '1. Koordinate von Teil 1', '-2')
  await typeInto(page, '2. Koordinate von Teil 1', '-4')
  await typeInto(page, '3. Koordinate von Teil 1', '3')
  await typeInto(page, 'Dein Ergebnis von Teil 2', '13')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Wurzel vergessen.')).toBeVisible()
  // nur das Kästchen der Länge ist markiert
  await expect(page.locator('[data-testid="entry"][data-marked]')).toHaveCount(1)
  await typeInto(page, 'Dein Ergebnis von Teil 2', 'sqrt13')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  // Bild zum Ergebnis in der Rückmeldung
  await expect(page.locator('[aria-live="polite"]').getByTestId('vector-figure')).toBeVisible()
  await expectCleanPage(page, 'frei gelöst')
  expect(errors).toEqual([])
})

test('Frei: Einheitsvektor als Spalte, ungekürzter Bruch ist noch nicht fertig', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/frei/vektoren/rechnen.2-10')
  await expect(page.getByTestId('entry')).toHaveCount(3)
  await typeInto(page, '1. Eintrag', '-6/9')
  await typeInto(page, '2. Eintrag', '2/3')
  await typeInto(page, '3. Eintrag', '1/3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig gerechnet, aber noch nicht fertig.')).toBeVisible()
  await expect(page.locator('[data-testid="entry"][data-marked]')).toHaveCount(1)
  await typeInto(page, '1. Eintrag', '-2/3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Einheitsvektor frei')
  expect(errors).toEqual([])
})
