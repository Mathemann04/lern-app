import { type Page, expect, test } from '@playwright/test'

// Brüche Stufe 5 (M2b Schritte 3 und 4): alles ineinander, Doppelbruch im Doppelbruch,
// Differenzenquotienten, dritte Potenzen, Wurzeln (auch mit zwei Buchstaben, Wurzel im Nenner
// beseitigen), Winkelfunktionen, Partialbruchzerlegung (mit Polynomdivision), komplexe Zahlen
// teilen, Grenzwerte; geführt und frei

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
  for (let step = 0; step < 16; step++) {
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
  ['5-101', 'sin² x + cos² x = 1', 'Vereinfache den Nenner mit'],
  ['5-82', 'Doppelbruch im Doppelbruch', 'Was rechnest du zuerst?'],
  ['5-59', 'alles ineinander', 'Was rechnest du zuerst?'],
  ['5-56', 'Differenzenquotient von x³', 'Multipliziere die Klammer im Zähler aus'],
  ['5-139', 'Differenzenquotient von √x', 'Erweitere mit dem Gegenstück des Zählers'],
  ['5-3734', 'zwei Wurzeln', 'Zerlege den Zähler in Faktoren'],
  ['5-4778', 'Wurzel im Nenner', 'Erweitere mit dem Gegenstück des Nenners'],
  ['5-1289', 'dritte Potenz', 'Zerlege den Zähler in Faktoren'],
  ['5-202', 'Partialbrüche', 'Wie lautet die Zerlegung?'],
  ['5-80', 'Partialbrüche mit Polynomdivision', 'Teile deshalb zuerst (Polynomdivision)'],
  ['5-293', 'Partialbrüche mit doppeltem Faktor', 'Welcher Ansatz passt?'],
  ['5-224', 'komplexe Zahlen teilen', 'Erweitere mit dem konjugiert Komplexen des Nenners'],
  ['5-492', 'komplexe Zahlen mit Potenz von i und Minus', 'Rechne die Potenzen von'],
  ['5-134', 'komplexe Zahlen mit Buchstaben', 'Teile in Realteil und Imaginärteil auf'],
  ['5-89', 'Grenzwert x gegen 2', 'Was ist der Grenzwert?'],
  ['5-135', 'Grenzwert einer Summe', 'werden die Nenner'],
  ['5-157', 'Grenzwert unendlich minus unendlich', 'Teile Zähler und Nenner durch die höchste Potenz'],
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
  await page.goto('./#/ueben/brueche/5-101')
  await page.getByRole('button', { name: 'Lernkarten' }).click()
  const sheet = page.getByRole('dialog')
  await sheet.locator('summary', { hasText: 'Bausteine mit eigenen Regeln' }).click()
  await expect(sheet.getByText('Quadrat vergessen')).toBeVisible()
  await expectCleanPage(page, 'Karte')
})

test('Stufe 5 geführt: Wurzel im Nenner, Tipp und Karte', async ({ page }) => {
  // 6/(√x − 2)
  await page.goto('./#/ueben/brueche/5-4778')
  await page.getByRole('button', { name: 'Tipp anzeigen' }).click()
  await expect(page.getByText('Erweitere mit dem Gegenstück der Summe mit Wurzel')).toBeVisible()
  await page.getByRole('button', { name: 'Lernkarten' }).click()
  const sheet = page.getByRole('dialog')
  await sheet.locator('summary', { hasText: 'Wurzeln im Nenner beseitigen' }).click()
  await expect(sheet.getByText('Mit derselben Summe statt mit dem Gegenstück erweitert')).toBeVisible()
  await expectCleanPage(page, 'Karte Wurzel')
})

test('Stufe 5 frei: zwei Wurzeln, Wurzel im Nenner, Differenzenquotient, Winkelfunktionen', async ({ page }) => {
  // (v − u)/(√u − √v)
  await page.goto('./#/frei/brueche/5-3734')
  await expect(field(page)).toBeVisible()
  await enter(page, '\\frac{v-u}{\\sqrt{u}-\\sqrt{v}}')
  await expect(feedback(page)).toContainText('Noch nicht vollständig gekürzt.')
  await enter(page, '-\\sqrt{u}-\\sqrt{v}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'zwei Wurzeln')

  // 6/(√x − 2)
  await page.goto('./#/frei/brueche/5-4778')
  await expect(field(page)).toBeVisible()
  await enter(page, '\\frac{6}{\\sqrt{x}-2}')
  await expect(feedback(page)).toContainText('Erweitere mit dem Gegenstück')
  await enter(page, '\\frac{6\\sqrt{x}+12}{x-2}')
  await expect(feedback(page)).toContainText('Typischer Fehler: Beim Erweitern mit dem Gegenstück die Zahl nicht quadriert.')
  await enter(page, '\\frac{6\\sqrt{x}+12}{x-4}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Wurzel im Nenner')

  // (√(x + h) − √x)/h
  await page.goto('./#/frei/brueche/5-139')
  await expect(field(page)).toBeVisible()
  await enter(page, '\\frac{\\sqrt{x+h}-\\sqrt{x}}{h}')
  await expect(feedback(page)).toContainText('kürzt sich danach')
  await enter(page, '\\frac{1}{\\sqrt{x+h}+\\sqrt{x}}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Differenzenquotient')

  // 3/(1 − sin x) + 3/(1 + sin x)
  await page.goto('./#/frei/brueche/5-101')
  await expect(field(page)).toBeVisible()
  await enter(page, '\\frac{4}{\\cos x}')
  await expect(feedback(page)).toContainText('Typischer Fehler: Quadrat vergessen.')
  await enter(page, '\\frac{4}{1-\\sin^2x}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Winkelfunktionen')
})

test('Stufe 5 frei: Partialbrüche, mit doppeltem Faktor und mit Polynomdivision', async ({ page }) => {
  // (5x² + 24x + 23) / ((x + 1)(x + 3)²)
  await page.goto('./#/frei/brueche/5-293')
  await expect(field(page)).toBeVisible()
  await enter(page, '\\frac{5x^2+24x+23}{(x+1)(x+3)^2}')
  await expect(feedback(page)).toContainText('Zerlege in einfache Brüche')
  await enter(page, '\\frac{1}{x+1}+\\frac{5}{x+3}+\\frac{2}{(x+3)^2}')
  await expect(feedback(page)).toContainText('Typischer Fehler: Beim Koeffizientenvergleich einen Summanden vergessen.')
  await enter(page, '\\frac{1}{x+1}+\\frac{4}{x+3}+\\frac{2}{(x+3)^2}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Partialbrüche doppelt')

  // (2x² − 2x + 6) / (x² − 2x − 8)
  await page.goto('./#/frei/brueche/5-80')
  await expect(field(page)).toBeVisible()
  await enter(page, '\\frac{5}{x-4}-\\frac{3}{x+2}')
  await expect(feedback(page)).toContainText('Typischer Fehler: Polynomdivision vor der Partialbruchzerlegung vergessen.')
  await enter(page, '2+\\frac{5}{x-4}-\\frac{3}{x+2}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Partialbrüche Polynomdivision')
})

test('Stufe 5 frei: komplexe Zahlen teilen', async ({ page }) => {
  // (6 + i) / (−2 − i) = −13/5 + 4/5 i
  await page.goto('./#/frei/brueche/5-501')
  await expect(field(page)).toBeVisible()
  await expect(page.getByText(/Berechne und schreibe das Ergebnis in der Form/)).toBeVisible()
  await enter(page, '\\frac{6+\\mathrm{i}}{-2-\\mathrm{i}}')
  await expect(feedback(page)).toContainText('Im Nenner steht noch')
  await enter(page, '\\frac{-26+8i}{10}')
  await expect(feedback(page)).toContainText('Noch nicht vollständig gekürzt')
  await enter(page, '-3-i')
  await expect(feedback(page)).toContainText('Typischer Fehler: Realteil durch Realteil und Imaginärteil durch Imaginärteil geteilt.')
  await enter(page, '-\\frac{13}{5}+\\frac{4}{5}\\mathrm{i}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'komplexe Zahlen frei')
})

test('Stufe 5 frei: Grenzwerte, gesucht ist eine Zahl', async ({ page }) => {
  // lim n → ∞ 3n² / (2n² − 2n + 2) = 3/2
  await page.goto('./#/frei/brueche/5-5')
  await expect(field(page)).toBeVisible()
  await expect(page.getByText(/Bestimme den Grenzwert/)).toBeVisible()
  await enter(page, '\\frac{3}{2-\\frac{2}{n}+\\frac{2}{n^2}}')
  await expect(feedback(page)).toContainText('Gesucht ist eine Zahl')
  await enter(page, '1')
  await expect(feedback(page)).toContainText('Typischer Fehler')
  await enter(page, '\\frac{3}{2}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Grenzwert unendlich')

  // lim x → 2 (x² − 2x)/(x² + 2x − 8) = 1/3
  await page.goto('./#/frei/brueche/5-89')
  await expect(field(page)).toBeVisible()
  await enter(page, '\\frac{x}{x+4}')
  await expect(feedback(page)).toContainText('Setze die Stelle noch ein')
  await enter(page, '0')
  await expect(feedback(page)).toContainText('Typischer Fehler')
  await enter(page, '\\frac{1}{3}')
  await expect(feedback(page)).toContainText('Richtig!')
  await expectCleanPage(page, 'Grenzwert x gegen 2')
})

test('Stufe 5 frei: Tastatur mit i bei komplexen Zahlen', async ({ page }) => {
  test.skip(!isPhone(), 'Bildschirm-Tastatur nur am Handy')
  await page.goto('./#/frei/brueche/5-134')
  await field(page).tap()
  await expect(page.locator('.ML__keyboard')).toBeVisible()
  await expect(page.locator('.MLK__keycap[data-keycap-value="\\\\mathrm{i}"]').filter({ visible: true })).toHaveCount(1)
  const keys = () => page.locator('.MLK__keycap').filter({ visible: true })
  await expect(keys().filter({ hasText: /^a$/ })).toHaveCount(1)
  await expect(keys().filter({ hasText: /^b$/ })).toHaveCount(1)
  await expectCleanPage(page, 'Tastatur i')
})

test('Stufe 5 frei: Tastatur mit Wurzel, Buchstaben der Aufgabe und tan', async ({ page }) => {
  test.skip(!isPhone(), 'Bildschirm-Tastatur nur am Handy')
  const keys = () => page.locator('.MLK__keycap').filter({ visible: true })
  await page.goto('./#/frei/brueche/5-3734')
  await field(page).tap()
  await expect(page.locator('.ML__keyboard')).toBeVisible()
  await expect(page.locator('.MLK__keycap[data-keycap-value="\\\\sqrt{#0}"]').filter({ visible: true })).toHaveCount(1)
  await expect(keys().filter({ hasText: /^u$/ })).toHaveCount(1)
  await expect(keys().filter({ hasText: /^v$/ })).toHaveCount(1)
  await page.goto('./#/frei/brueche/5-101')
  await field(page).tap()
  await expect(keys().filter({ hasText: /^tan$/ })).toHaveCount(1)
  await expectCleanPage(page, 'Tastatur')
})

test('Lernkarten: Ordner Brüche mit Stufe 5, dritte Potenzen, Wurzeln im Nenner, Partialbrüchen und komplexen Zahlen', async ({ page }) => {
  await page.goto('./#/karten/brueche')
  await expect(page.getByRole('heading', { name: 'Stufe 5' })).toBeVisible()
  for (const title of ['Bausteine mit eigenen Regeln', 'Dritte Potenzen', 'Wurzeln im Nenner beseitigen', 'Polynomdivision', 'Partialbruchzerlegung', 'Komplexe Zahlen teilen', 'Grenzwerte von Brüchen']) {
    await page.goto('./#/karten/brueche')
    await page.getByRole('link', { name: new RegExp(title) }).click()
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Beispiel' })).toBeVisible()
    await expectCleanPage(page, title)
  }
})

test('Brüche funktionieren offline, geführt und frei', async ({ page, context }) => {
  await page.goto('./')
  await expect(page.getByTestId('offline-status')).toHaveText('Offline nutzbar ✓', { timeout: 15_000 })
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('link', { name: /^Grundlagen/ }).click()
  await page.getByRole('link', { name: /^Brüche/ }).click()
  await expect(page.getByRole('heading', { name: 'Brüche', level: 1 })).toBeVisible()

  // geführt: 2/(1 − sin x) + 2/(1 + sin x) ganz durch
  await page.goto('./#/ueben/brueche/5-101')
  await solveWholeTask(page)
  await expectCleanPage(page, 'offline geführt')

  // frei: zwei Wurzeln
  await page.goto('./#/frei/brueche/5-3734')
  await expect(field(page)).toBeVisible()
  await enter(page, '-\\sqrt{u}-\\sqrt{v}')
  await expect(feedback(page)).toContainText('Richtig!')
})

test('Gezielt üben: „Quadrat vergessen" von der Lernkarte aus', async ({ page }) => {
  await page.goto('./#/karten/brueche/fraction-block-rules')
  const error = page.locator('li, article, section, div').filter({ hasText: /^Quadrat vergessen/ }).first()
  await error.getByRole('link', { name: 'Gezielt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/brueche\/5-\d+\?fokus=frac-square-forgotten$/)
  // Der Fehler passiert beim Anwenden der Regel: Diesen Schritt hat die gefundene Aufgabe
  let seen = false
  for (let step = 0; step < 16 && !seen; step++) {
    if (await page.getByRole('heading', { name: 'Geschafft!' }).isVisible()) break
    await expect(page.locator('#question')).toBeVisible()
    seen = await page.getByText(/Regel anwenden/).isVisible()
    const count = await answers(page).count()
    for (let i = 0; i < count && !seen; i++) {
      const button = answers(page).nth(i)
      if (await button.isDisabled()) continue
      await button.click()
      await correctFeedback(page).or(wrongFeedback(page)).waitFor()
      if (await correctFeedback(page).isVisible()) break
    }
    if (!seen) await page.getByRole('button', { name: /^(Weiter|Ergebnis ansehen)$/ }).click()
  }
  expect(seen).toBe(true)
})

test('Gezielt üben: „Zahl nicht quadriert" von der Lernkarte aus', async ({ page }) => {
  await page.goto('./#/karten/brueche/fraction-root-denominator')
  const error = page.locator('li, article, section, div').filter({ hasText: /^Beim Erweitern mit dem Gegenstück die Zahl nicht quadriert/ }).first()
  await error.getByRole('link', { name: 'Gezielt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/brueche\/5-\d+\?fokus=frac-conjugate-square$/)
  await expect(page.locator('#question')).toBeVisible()
  await expectCleanPage(page, 'gezielt Wurzel')
})

test('Gezielt üben: „Doppelten Faktor nur einmal angesetzt" von der Lernkarte aus', async ({ page }) => {
  await page.goto('./#/karten/brueche/fraction-partial')
  const error = page.locator('li, article, section, div').filter({ hasText: /^Doppelten Faktor im Ansatz nur einmal angesetzt/ }).first()
  await error.getByRole('link', { name: 'Gezielt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/brueche\/5-\d+\?fokus=frac-partial-double-once$/)
  await expect(page.locator('#question')).toBeVisible()
  await expectCleanPage(page, 'gezielt Partialbrüche')
})

test('Gezielt üben: „Realteil durch Realteil geteilt" von der Lernkarte aus', async ({ page }) => {
  await page.goto('./#/karten/brueche/fraction-imaginary')
  const error = page.locator('li, article, section, div').filter({ hasText: /^Realteil durch Realteil und Imaginärteil durch Imaginärteil geteilt/ }).first()
  await error.getByRole('link', { name: 'Gezielt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/brueche\/5-\d+\?fokus=frac-imag-direct$/)
  await expect(page.locator('#question')).toBeVisible()
  await expectCleanPage(page, 'gezielt komplexe Zahlen')
})

test('Gezielt üben: „Unendlich durch unendlich als 1" von der Lernkarte aus', async ({ page }) => {
  await page.goto('./#/karten/brueche/fraction-limit')
  const error = page.locator('li, article, section, div').filter({ hasText: /^Die Zahlen vor den höchsten Potenzen geteilt/ }).first()
  await error.getByRole('link', { name: 'Gezielt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/brueche\/5-\d+\?fokus=frac-limit-degree$/)
  await expect(page.locator('#question')).toBeVisible()
  await expectCleanPage(page, 'gezielt Grenzwerte')
})

test('Stufe 5: zehn neue Aufgaben nacheinander mit verschiedener Form', async ({ page }) => {
  for (let i = 0; i < 10; i++) {
    await page.goto('./#/ueben/brueche/5')
    await expect(page).toHaveURL(/#\/ueben\/brueche\/5-\d+$/)
    await expect(page.locator('#question')).toBeVisible()
    await expectCleanPage(page, `Aufgabe ${i + 1}`)
  }
  const forms = await page.evaluate(() => (JSON.parse(localStorage.getItem('rechenweg-formen') ?? '{}') as Record<string, string[]>)['brueche:5'] ?? [])
  expect(forms).toHaveLength(10)
  expect(new Set(forms).size).toBe(10)
})
