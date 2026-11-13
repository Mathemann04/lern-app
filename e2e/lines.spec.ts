import { type Page, expect, test } from '@playwright/test'

// Geraden und Ebenen (M7 Schritt 6): Kachel auf der Mathe-Seite, Seite der Tätigkeit mit zwei Bausteinen, je Stufe eine
// Aufgabe geführt lösen, Bild zum Ergebnis, Lernkarte, freier Modus mit Parameterform und Koordinatenform in Kästchen
// (gleichwertige Formen sind richtig), Hessesche Normalform

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

test('Mathe-Seite zeigt die Kachel „Geraden und Ebenen“, die Seite der Tätigkeit hat zwei Bausteine', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/fach/mathe')
  await page.getByRole('link', { name: /Geraden und Ebenen/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Geraden und Ebenen', level: 1 })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Geraden', exact: true })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Ebenen', exact: true })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Lage', exact: true })).toBeChecked()
  await expect(page.getByTestId('example').locator('.katex').first()).toBeVisible()
  await expectCleanPage(page, 'Tätigkeit Geraden und Ebenen')
  expect(errors).toEqual([])
})

test('Geraden und Ebenen: jede Stufe lässt sich lösen, Bild zum Ergebnis, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  for (const block of ['gerade', 'ebene', 'lage']) {
    for (const level of [1, 2, 3, 4, 5]) {
      await page.goto(`./#/ueben/geraden/${block}.${level}-${60 + level}`)
      await solveWholeTask(page)
      await expect(page.getByTestId('result').getByTestId('vector-figure')).toBeVisible()
      await expectCleanPage(page, `${block} Stufe ${level}`)
    }
  }
  await page.goto('./#/karten/geraden/gl-hesse')
  await expect(page.getByRole('heading', { name: 'Hessesche Normalform' })).toBeVisible()
  await expect(page.getByTestId('vector-figure').first()).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Hesse')
  expect(errors).toEqual([])
})

test('Frei: Parameterform in Spalten, Ortsvektor als Richtung wird erkannt, andere gleichwertige Form ist richtig', async ({ page }) => {
  const errors = collectErrors(page)
  // gerade.1-2: g durch P(0 | 2) und Q(−4 | 3), z. B. x = (0, 2) + s (−4, 1)
  await page.goto('./#/frei/geraden/gerade.1-2')
  await typeInto(page, '1. Eintrag des Stützvektors', '0')
  await typeInto(page, '2. Eintrag des Stützvektors', '2')
  await typeInto(page, '1. Eintrag des Richtungsvektors', '-4')
  await typeInto(page, '2. Eintrag des Richtungsvektors', '3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Ortsvektor statt Richtungsvektor.')).toBeVisible()
  // Stützpunkt Q, Richtung verdoppelt und umgedreht: dieselbe Gerade
  await typeInto(page, '1. Eintrag des Stützvektors', '-4')
  await typeInto(page, '2. Eintrag des Stützvektors', '3')
  await typeInto(page, '1. Eintrag des Richtungsvektors', '8')
  await typeInto(page, '2. Eintrag des Richtungsvektors', '-2')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Gerade frei')
  expect(errors).toEqual([])
})

test('Frei: Koordinatenform in Kästchen, Vorzeichen rechts wird erkannt, Vielfaches ist richtig; Hesse nur normiert', async ({ page }) => {
  const errors = collectErrors(page)
  // ebene.1-3: Normalenform → F: y − 3z = 7
  await page.goto('./#/frei/geraden/ebene.1-3')
  await typeInto(page, 'Zahl vor x', '0')
  await typeInto(page, 'Zahl vor y', '1')
  await typeInto(page, 'Zahl vor z', '-3')
  await typeInto(page, 'Rechte Seite', '-7')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Vorzeichen der rechten Seite.')).toBeVisible()
  await typeInto(page, 'Zahl vor y', '-2')
  await typeInto(page, 'Zahl vor z', '6')
  await typeInto(page, 'Rechte Seite', '-14')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Koordinatenform frei')

  // ebene.2-8: E: 2x + y − 2z = −20, Hessesche Normalform mit rechts 20/3
  await page.goto('./#/frei/geraden/ebene.2-8')
  await typeInto(page, 'Zahl vor x', '2')
  await typeInto(page, 'Zahl vor y', '1')
  await typeInto(page, 'Zahl vor z', '-2')
  await typeInto(page, 'Rechte Seite', '-20')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Nicht normiert.')).toBeVisible()
  await expectCleanPage(page, 'Hesse frei')
  expect(errors).toEqual([])
})

// M7 Schritt 7a: Lage
test('Frei: Lage zweier Geraden zum Antippen, Schnittpunkt mit vertauschtem Parameter wird erkannt', async ({ page }) => {
  const errors = collectErrors(page)
  // lage.2-8: windschiefe Geraden; „Schnittpunkt“ heißt: dritte Gleichung nicht geprüft
  await page.goto('./#/frei/geraden/lage.2-8')
  await expect(page.getByRole('radiogroup', { name: 'Lage der Geraden:' })).toBeVisible()
  await page.getByRole('radio', { name: 'Schnittpunkt' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Dritte Gleichung nicht geprüft.')).toBeVisible()
  await page.getByRole('radio', { name: 'windschief' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Lage frei')

  // lage.1-3: g: (−1, 0) + λ (1, −3), h: (−8, 6) + μ (−2, 1), S(−2 | 3); λ = −1 in h eingesetzt ergibt (−6 | 5)
  await page.goto('./#/frei/geraden/lage.1-3')
  await typeInto(page, '1. Koordinate', '-6')
  await typeInto(page, '2. Koordinate', '5')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Parameter in die falsche Gerade eingesetzt.')).toBeVisible()
  await typeInto(page, '1. Koordinate', '-2')
  await typeInto(page, '2. Koordinate', '3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()

  await page.goto('./#/karten/geraden/gl-lage-geraden')
  await expect(page.getByRole('heading', { name: 'Lage zweier Geraden' })).toBeVisible()
  await expect(page.getByTestId('vector-figure').first()).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Lage')
  expect(errors).toEqual([])
})
