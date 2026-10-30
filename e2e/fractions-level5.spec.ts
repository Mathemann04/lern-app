import { type Page, expect, test } from '@playwright/test'

// Brüche Stufe 5: Bausteine mit Regeln, verschachtelte Doppelbrüche, mehrere Rechenarten, zwei
// Variablen; geführt und frei

const answers = (page: Page) => page.getByRole('group', { name: 'Antworten' }).getByRole('button')
const correctFeedback = (page: Page) => page.getByText('Richtig!', { exact: true })
const wrongFeedback = (page: Page) => page.getByText('Nicht ganz. Versuch es noch einmal.')
const field = (page: Page) => page.locator('math-field[data-ready]')
const feedback = (page: Page) => page.locator('[aria-live="polite"]')
const isPhone = () => test.info().project.name === 'handy'

// Löst eine geführte Aufgabe, indem je Schritt die Antworten der Reihe nach ausprobiert werden;
// liefert die Fragen
async function solveWholeTask(page: Page): Promise<string[]> {
  const questions: string[] = []
  for (let step = 0; step < 8; step++) {
    if (await page.getByRole('heading', { name: 'Geschafft!' }).isVisible()) return questions
    await expect(page.locator('#question')).toBeVisible()
    questions.push((await page.locator('#question').textContent()) ?? '')
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
  return questions
}

async function expectCleanPage(page: Page, context: string) {
  await expect(page.locator('code.text-red-700'), context).toHaveCount(0)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${context}: ragt seitlich heraus`).toBeLessThanOrEqual(0)
}

// Setzt die Eingabe direkt und prüft sie (das Tippen selbst testet free.spec.ts)
async function enter(page: Page, latex: string) {
  await page.evaluate((value) => {
    const element = document.querySelector('math-field') as HTMLElement & { value: string; executeCommand: (c: string) => void }
    element.value = value
    element.executeCommand('commit')
  }, latex)
}

for (const [ref, what, question] of [
  ['5-1', 'sin² x + cos² x = 1', 'Vereinfache den Nenner mit'],
  ['5-17', 'verschachtelter Doppelbruch', 'Löse zuerst den inneren Doppelbruch'],
  ['5-15', 'mehrere Rechenarten', 'Fasse die erste Klammer zu einem Bruch zusammen.'],
  ['5-3', 'Klammer quadrieren', 'Multipliziere die Klammer im Zähler aus'],
] as const) {
  test(`Stufe 5 geführt: ${what} (${ref})`, async ({ page }) => {
    await page.goto(`./#/ueben/brueche/${ref}`)
    const questions = await solveWholeTask(page)
    expect(questions.some((q) => q.includes(question)), questions.join(' | ')).toBe(true)
    await expectCleanPage(page, ref)
  })
}

test('Stufe 5 geführt: Karte „Bausteine mit eigenen Regeln" aus der Aufgabe', async ({ page }) => {
  // 3/(1 − sin x) + 3/(1 + sin x)
  await page.goto('./#/ueben/brueche/5-1')
  await page.getByRole('button', { name: 'Lernkarten' }).click()
  const sheet = page.getByRole('dialog')
  await sheet.locator('summary', { hasText: 'Bausteine mit eigenen Regeln' }).click()
  await expect(sheet.getByText('Quadrat vergessen')).toBeVisible()
  await expectCleanPage(page, 'Karte')
})

test('Stufe 5 frei: Wurzel und Winkelfunktionen', async ({ page }) => {
  // (x − 9)/(√x − 3)
  await page.goto('./#/frei/brueche/5-2')
  await expect(field(page)).toBeVisible()
  await enter(page, '\\frac{x-9}{\\sqrt{x}-3}')
  await expect(feedback(page)).toContainText('Noch nicht vollständig gekürzt.')
  await enter(page, '\\sqrt{x}+3')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Wurzel')

  // 3/(1 − sin x) + 3/(1 + sin x)
  await page.goto('./#/frei/brueche/5-1')
  await expect(field(page)).toBeVisible()
  await enter(page, '\\frac{6}{\\cos x}')
  await expect(feedback(page)).toContainText('Typischer Fehler: Quadrat vergessen.')
  await enter(page, '\\frac{6}{1-\\sin^2x}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Winkelfunktionen')
})

test('Stufe 5 frei: Tastatur mit Wurzel und tan', async ({ page }) => {
  test.skip(!isPhone(), 'Bildschirm-Tastatur nur am Handy')
  const keys = () => page.locator('.MLK__keycap').filter({ visible: true })
  await page.goto('./#/frei/brueche/5-2')
  await field(page).tap()
  await expect(page.locator('.ML__keyboard')).toBeVisible()
  await expect(page.locator('.MLK__keycap[data-keycap-value="\\\\sqrt{#0}"]').filter({ visible: true })).toHaveCount(1)
  await page.goto('./#/frei/brueche/5-1')
  await field(page).tap()
  await expect(keys().filter({ hasText: /^tan$/ })).toHaveCount(1)
  await expectCleanPage(page, 'Tastatur')
})

test('Lernkarten: Ordner Brüche mit Stufe 5', async ({ page }) => {
  await page.goto('./#/karten/brueche')
  await expect(page.getByRole('heading', { name: 'Stufe 5' })).toBeVisible()
  await page.getByRole('link', { name: /Bausteine mit eigenen Regeln/ }).click()
  await expect(page.getByRole('heading', { name: 'Bausteine mit eigenen Regeln', level: 1 })).toBeVisible()
  await expectCleanPage(page, 'Karte')
})
