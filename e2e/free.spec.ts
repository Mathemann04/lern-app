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

// bereit, sobald MathLive das Feld aufgebaut hat
const field = (page: Page) => page.locator('math-field[data-ready]')
const feedback = (page: Page) => page.locator('[aria-live="polite"]')
const isPhone = () => test.info().project.name === 'handy'

// Tasten der Bildschirm-Tastatur, auf der gerade sichtbaren Seite
// (Backslashes wie in \\frac müssen im Suchausdruck doppelt stehen)
const key = (page: Page, label: string) =>
  page.locator(`.MLK__keycap[aria-label="${label.replaceAll('\\', '\\\\')}"]`).filter({ visible: true }).first()
const commandKey = (page: Page, command: string) => page.locator(`[data-command*="${command}"]`).filter({ visible: true }).first()

// Gibt eine Antwort ein: am Handy über die Bildschirm-Tastatur, am Laptop über die normale Tastatur.
// Die Tasten sind Folgen von Beschriftungen; „→" springt aus einer Klammer heraus.
async function enter(page: Page, keys: string[], typed: string) {
  // MathLive setzt den Fokus nach dem Antippen leicht verzögert
  if (isPhone()) {
    await field(page).tap()
    await expect(field(page)).toBeFocused()
    await expect(page.locator('.ML__keyboard')).toBeVisible()
    for (const k of keys) {
      if (k === '→') await commandKey(page, 'moveToNextChar').tap()
      else await key(page, k).tap()
    }
  } else {
    await field(page).click()
    await expect(field(page)).toBeFocused()
    await page.keyboard.type(typed)
  }
}

async function submit(page: Page) {
  if (isPhone()) await commandKey(page, 'commit').tap()
  else await page.keyboard.press('Enter')
}

// Aufgabe 2-4: f(x) = x² sin x
const TASK = './#/frei/2-4'

test('Freier Modus: richtige Antwort, dann Lösungsweg aufdecken', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto(TASK)
  await expect(field(page)).toBeVisible()
  await expectCleanPage(page, 'Start')

  await enter(page, ['2', 'x', 'sin', 'x', '→', '+', 'x', '#@^{2}', 'cos', 'x', '→'], '2xsin(x)+x^2cos(x)')
  await expect(field(page)).toHaveJSProperty('value', '2x\\sin\\left(x\\right)+x^2\\cos\\left(x\\right)')
  await submit(page)

  await expect(feedback(page)).toContainText('Richtig!')
  await expect(page.getByTestId('result')).toContainText('f′(x)')
  await expectCleanPage(page, 'Richtig')

  await page.getByRole('button', { name: 'Lösungsweg ansehen' }).click()
  const path = page.getByRole('region', { name: 'Lösungsweg' })
  await expect(path.getByText('Regel wählen')).toBeVisible()
  for (let i = 0; i < 6 && (await page.getByRole('button', { name: /^(Nächster Schritt|Ergebnis zeigen)$/ }).isVisible()); i++) {
    await page.getByRole('button', { name: /^(Nächster Schritt|Ergebnis zeigen)$/ }).click()
  }
  await expect(path.getByLabel('Ergebnis')).toContainText('f′(x)')
  await expect(path.getByText('Einsetzen')).toBeVisible()
  await expectCleanPage(page, 'Lösungsweg')
  expect(errors).toEqual([])

  await page.getByRole('link', { name: 'Nächste Aufgabe' }).click()
  await expect(page).toHaveURL(/#\/frei\/2-\d+$/)
  await expect(field(page)).toBeVisible()
})

test('Freier Modus: erkennt typische Fehler und erklärt sie', async ({ page }) => {
  await page.goto(TASK)
  await enter(page, ['2', 'x', 'cos', 'x', '→'], '2xcos(x)')
  await submit(page)
  await expect(feedback(page)).toContainText('Typischer Fehler: Ableitungen der Faktoren multipliziert.')
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(feedback(page)).toContainText('Produktregel')
  await expectCleanPage(page, 'Fehler')
})

test('Freier Modus: meldet Unlesbares verständlich und hilft weiter', async ({ page }) => {
  await page.goto(TASK)
  await enter(page, ['2', 'x', '+'], '2x+')
  await submit(page)
  await expect(feedback(page)).toContainText('Das kann ich noch nicht lesen.')
  await expect(feedback(page)).toContainText('Nach „+" fehlt noch etwas.')

  await page.getByRole('button', { name: 'Tipp anzeigen' }).click()
  await expect(page.getByText('Ein Produkt')).toBeVisible()

  await page.getByRole('link', { name: 'Geführt lösen' }).click()
  await expect(page).toHaveURL(/#\/ueben\/2-4$/)
  await expect(page.locator('#question')).toBeVisible()
})

test('Moduswahl bleibt gespeichert, auch für „Weitermachen" auf der Startseite', async ({ page }) => {
  await page.goto('./#/thema/ableiten')
  await page.getByText('Selbst eintippen').click()
  await expect(page.getByRole('link', { name: 'Stufe 1 frei üben' })).toBeVisible()
  await page.goto('./')
  await expect(page.getByRole('link', { name: 'Erste Aufgabe · frei' })).toBeVisible()
  await page.goto('./#/thema/ableiten')
  await page.reload()
  await page.getByRole('link', { name: 'Stufe 1 frei üben' }).click()
  await expect(page).toHaveURL(/#\/frei\/1-\d+$/)
  await expect(field(page)).toBeVisible()
})

test('Freier Modus funktioniert offline', async ({ page, context }) => {
  await page.goto('./')
  await expect(page.getByTestId('offline-status')).toHaveText('Offline nutzbar ✓', { timeout: 15_000 })
  await context.setOffline(true)
  await page.goto(TASK)
  await page.reload()
  await expect(field(page)).toBeVisible()
  await enter(page, ['2', 'x', 'cos', 'x', '→'], '2xcos(x)')
  await submit(page)
  await expect(feedback(page)).toContainText('Typischer Fehler')
})

test('Freier Modus in Stufe 4: erkennt den vergessenen Faktor ln a', async ({ page }) => {
  // Aufgabe 4-8: f(x) = 5^{\sin(4x)}; ohne ln 5 ist es ein typischer Fehler
  await page.goto('./#/frei/4-8')
  await expect(field(page)).toBeVisible()
  await page.evaluate(() => {
    const mf = document.querySelector('math-field') as HTMLElement & { value: string; executeCommand: (c: string) => void }
    mf.value = '5^{\\sin\\left(4x\\right)}\\cdot4\\cos\\left(4x\\right)'
    mf.executeCommand('commit')
  })
  await expect(feedback(page)).toContainText('Typischer Fehler: Faktor')
  await expect(feedback(page).locator('.katex-html').first()).toHaveText('lna')
  await page.evaluate(() => {
    const mf = document.querySelector('math-field') as HTMLElement & { value: string; executeCommand: (c: string) => void }
    mf.value = '4\\ln5\\cdot5^{\\sin\\left(4x\\right)}\\cos\\left(4x\\right)'
    mf.executeCommand('commit')
  })
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Stufe 4 frei')
})

test('Freier Modus in Stufe 5: Hyperbelfunktion über die zweite Tastaturseite', async ({ page }) => {
  // Aufgabe 5-35: f(x) = sinh(2x)
  await page.goto('./#/frei/5-35')
  await expect(field(page)).toBeVisible()
  if (isPhone()) {
    await field(page).tap()
    await expect(field(page)).toBeFocused()
    await page.getByText('Mehr Funktionen').first().tap()
    // Tasten der gerade sichtbaren Tastaturseite
    const visibleKey = (text: string) => page.locator('.MLK__keycap', { hasText: new RegExp(`^${text}$`) }).filter({ visible: true }).first()
    for (const k of ['2', 'cosh', '2', 'x']) await visibleKey(k).tap()
    await commandKey(page, 'moveToNextChar').tap()
    await expect(field(page)).toHaveJSProperty('value', '2\\cosh\\left(2x\\right)')
  } else {
    await field(page).click()
    await expect(field(page)).toBeFocused()
    await page.keyboard.type('2cosh(2x)')
  }
  await submit(page)
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Stufe 5 frei')
})

test('Freier Modus in Stufe 5: implizit ableiten, mit y auf der Tastatur', async ({ page }) => {
  // Aufgabe 5-15: x² + y² = 4, Lösung y' = −x/y
  const errors = collectErrors(page)
  await page.goto('./#/frei/5-15')
  await expect(field(page)).toBeVisible()
  await expect(page.getByText(/· Leite implizit ab$/)).toBeVisible()
  await expect(page.getByLabel('Deine Antwort')).toContainText("y′=")

  // x/y: bis auf das Vorzeichen richtig
  await enter(page, ['x', '\\frac{#@}{#?}', 'y'], 'x/y')
  await expect(field(page)).toHaveJSProperty('value', '\\frac{x}{y}')
  await submit(page)
  await expect(feedback(page)).toContainText('Bis auf das Vorzeichen')

  const answer = async (latex: string) =>
    page.evaluate((value) => {
      const mf = document.querySelector('math-field') as HTMLElement & { value: string; executeCommand: (c: string) => void }
      mf.value = value
      mf.executeCommand('commit')
    }, latex)

  // durch die falsche Seite geteilt
  await answer('-\\frac{y}{x}')
  await expect(feedback(page)).toContainText('beim Auflösen')
  // y durch einen Term mit x ersetzt
  await answer('-\\frac{x}{\\sqrt{4-x^2}}')
  await expect(feedback(page)).toContainText('im Ergebnis stehen')
  // y' gehört nicht ins Ergebnis
  await answer("-\\frac{x}{y'}")
  await expect(feedback(page)).toContainText('Löse nach')

  await answer('-\\frac{x}{y}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expect(page.getByTestId('result')).toContainText('y′')
  await expectCleanPage(page, 'Stufe 5 implizit frei')
  expect(errors).toEqual([])
})
