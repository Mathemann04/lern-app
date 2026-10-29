import { type Page, expect, test } from '@playwright/test'

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

const answers = (page: Page) => page.getByRole('group', { name: 'Antworten' }).getByRole('button')
const correctFeedback = (page: Page) => page.getByText('Richtig!', { exact: true })
const wrongFeedback = (page: Page) => page.getByText('Nicht ganz. Versuch es noch einmal.')

async function expectCleanPage(page: Page, context: string) {
  await expect(page.locator('code.text-red-700'), context).toHaveCount(0)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${context}: ragt seitlich heraus`).toBeLessThanOrEqual(0)
}

// Löst den aktuellen Schritt durch Ausprobieren. Gibt zurück, ob eine falsche Antwort dabei war.
async function solveStep(page: Page, askWhy: boolean): Promise<boolean> {
  const count = await answers(page).count()
  let hadWrong = false
  for (let i = 0; i < count; i++) {
    const button = answers(page).nth(i)
    if (await button.isDisabled()) continue
    await button.click()
    await correctFeedback(page).or(wrongFeedback(page)).waitFor()
    if (await correctFeedback(page).isVisible()) return hadWrong
    hadWrong = true
    if (askWhy) {
      await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
      const box = page.locator('[aria-live="polite"]')
      await expect(box).toContainText(/\S{10,}/)
    }
  }
  throw new Error('Keine richtige Antwort gefunden')
}

async function solveWholeTask(page: Page, resultLabel = 'f′(x)') {
  let askedWhy = false
  for (let step = 0; step < 8; step++) {
    if (await page.getByRole('heading', { name: 'Geschafft!' }).isVisible()) break
    await expect(page.locator('#question')).toBeVisible()
    await expectCleanPage(page, `Schritt ${step + 1}`)
    const hadWrong = await solveStep(page, !askedWhy)
    askedWhy ||= hadWrong
    await expectCleanPage(page, `Schritt ${step + 1} gelöst`)
    await page.getByRole('button', { name: /^(Weiter|Ergebnis ansehen)$/ }).click()
  }
  await expect(page.getByRole('heading', { name: 'Geschafft!' })).toBeVisible()
  await expect(page.getByTestId('result')).toContainText(resultLabel)
  await expectCleanPage(page, 'Abschluss')
}

test('Eine Aufgabe der Stufe 1 lässt sich geführt komplett lösen', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./')
  await page.getByRole('link', { name: 'Stufe 1 geführt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/1-\d+$/)

  await solveWholeTask(page)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', /\d+/)
  expect(errors).toEqual([])

  await page.getByRole('link', { name: 'Nächste Aufgabe' }).click()
  await expect(page.locator('#question')).toBeVisible()
})

test('Stufenwahl bleibt gespeichert, Stufe 2 lässt sich komplett lösen', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./')
  await expect(page.getByRole('radio', { name: /^Stufe 5/ })).toBeEnabled()
  await page.getByText('Mit e-Funktion, ln, sin und cos').click()
  await expect(page.getByRole('radio', { name: /^Stufe 2/ })).toBeChecked()
  await page.reload()
  await expect(page.getByRole('radio', { name: /^Stufe 2/ })).toBeChecked()

  await page.getByRole('link', { name: 'Stufe 2 geführt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/2-\d+$/)
  await expect(page.getByText(/^Stufe 2 · Aufgabe 2-\d+/)).toBeVisible()
  await solveWholeTask(page)
  expect(errors).toEqual([])
})

// Stufe 4: Beispiel aus dem Plan (Quotient mit Produkt und Kette: u', v', Einsetzen) und eine
// Kettenregel ohne eigenen Schritt für die äußere Ableitung (innere Ableitung, Zusammensetzen)
for (const [task, established] of [
  ['4-75', 3],
  ['4-2', 2],
] as const) {
  test(`Stufe 4: Aufgabe ${task} lässt sich komplett lösen`, async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto(`./#/ueben/${task}`)
    await expect(page.getByText(/^Stufe 4 · Aufgabe/)).toBeVisible()
    await solveWholeTask(page)
    await expect(page.getByLabel('Bisher').locator('.katex')).toHaveCount(established)
    expect(errors).toEqual([])
  })
}

// Stufe 5: logarithmisches Ableiten (x^x), Hyperbel- und Areafunktion
for (const [task, established] of [
  ['5-14', 3],
  ['5-35', 2],
  ['5-12', 2],
] as const) {
  test(`Stufe 5: Aufgabe ${task} lässt sich komplett lösen`, async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto(`./#/ueben/${task}`)
    await expect(page.getByText(/^Stufe 5 · Aufgabe/)).toBeVisible()
    await solveWholeTask(page)
    await expect(page.getByLabel('Bisher').locator('.katex')).toHaveCount(established)
    expect(errors).toEqual([])
  })
}

test('Stufe 5: Bei x^x sind Potenzregel und die Regel für a^x falsch, dann wird logarithmiert', async ({ page }) => {
  await page.goto('./#/ueben/5-14')
  await answers(page).filter({ hasText: 'Potenzregel' }).click()
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(page.locator('[aria-live="polite"]')).toContainText('feste Zahl')
  await answers(page).filter({ hasText: 'Logarithmisches Ableiten' }).click()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.getByText('Logarithmieren', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Logarithmieren')
})

// Stufe 5: implizites Ableiten (Kreis, xy + e^y, sin(xy))
for (const task of ['5-15', '5-43', '5-8']) {
  test(`Stufe 5: implizite Aufgabe ${task} lässt sich komplett lösen`, async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto(`./#/ueben/${task}`)
    await expect(page.getByText(/^Stufe 5 · Aufgabe 5-\d+ · Leite implizit ab$/)).toBeVisible()
    await solveWholeTask(page, 'y′')
    await expect(page.getByLabel('Bisher').locator('.katex')).toHaveCount(3)
    expect(errors).toEqual([])
  })
}

test('Stufe 5: Beim Kreis ist y wie eine feste Zahl abgeleitet falsch', async ({ page }) => {
  // Aufgabe 5-15: x² + y² = 4
  await page.goto('./#/ueben/5-15')
  await expect(page.getByText('Term ableiten', { exact: true })).toBeVisible()
  // die Antwort 0 (nur der sichtbare Teil der Formel, ohne den Text für Vorleseprogramme)
  await answers(page).filter({ has: page.locator('.katex-html', { hasText: /^0$/ }) }).click()
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(page.locator('[aria-live="polite"]')).toContainText('hängt von')
  await expectCleanPage(page, 'Term ableiten')
})

// Je eine Aufgabe mit Produkt-, Quotienten- und Kettenregel
for (const task of ['3-2', '3-4', '3-9']) {
  test(`Stufe 3: Aufgabe ${task} lässt sich komplett lösen`, async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto(`./#/ueben/${task}`)
    await solveWholeTask(page)
    // Nach dem Lösen steht der ganze Rechenweg unter „Bisher"
    await expect(page.getByLabel('Bisher').locator('.katex')).toHaveCount(3)
    expect(errors).toEqual([])
  })
}

test('Tipp lässt sich vor dem Antworten aufrufen', async ({ page }) => {
  await page.goto('./#/ueben/1-1')
  await page.getByRole('button', { name: 'Tipp anzeigen' }).click()
  await expect(page.getByText('Tipp', { exact: true })).toBeVisible()
  await expect(page.getByText(/Teile des ganzen Terms/)).toBeVisible()
})

test('Gleiche Adresse zeigt nach dem Neuladen dieselbe Aufgabe', async ({ page }) => {
  await page.goto('./#/ueben/1')
  await expect(page).toHaveURL(/#\/ueben\/1-\d+$/)
  const url = page.url()
  const task = await page.getByText(/Aufgabe 1-\d+/).textContent()
  await page.reload()
  expect(page.url()).toBe(url)
  await expect(page.getByText(/Aufgabe 1-\d+/)).toHaveText(task ?? '')
})

test('Einstellungen werden gespeichert und wirken in der Aufgabe', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Einstellungen' }).click()
  await page.getByRole('radio', { name: /Kurz/ }).check()
  await page.getByLabel('Erklärungen nach jeder Antwort zeigen').uncheck()
  await page.reload()
  await expect(page.getByRole('radio', { name: /Kurz/ })).toBeChecked()
  await expect(page.getByLabel('Erklärungen nach jeder Antwort zeigen')).not.toBeChecked()

  await page.goto('./#/ueben/1-1')
  await expect(page.getByRole('button', { name: 'Erklärungen: Aus' })).toBeVisible()
  await solveStep(page, false)
  // Bei ausgeschalteten Erklärungen: nur „Richtig!" und der Knopf zum Weitergehen
  await expect(page.locator('[aria-live="polite"]')).toHaveText(/^Richtig!Weiter$/)

  // Nur für diese Aufgabe wieder einschalten
  await page.getByRole('button', { name: 'Erklärungen: Aus' }).click()
  await expect(page.getByRole('button', { name: 'Erklärungen: Ausführlich' })).toBeVisible()
  await expect(page.locator('[aria-live="polite"]')).toContainText('Summenregel')
})
