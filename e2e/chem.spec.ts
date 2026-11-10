import { type BrowserContext, type Page, expect, test } from '@playwright/test'

// Chemie 1 (M4, Schritt S1): Atombau mit Wissensfragen, Stufen mit Namen, „Frage melden", Fehler als
// Aussage, Testseite „Fragen durchsehen"

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

async function expectCleanPage(page: Page, context: string) {
  // Rote Ersatzanzeige erscheint nur, wenn eine Formel nicht gesetzt werden konnte
  await expect(page.locator('code.text-red-700'), context).toHaveCount(0)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `${context}: ragt seitlich heraus`).toBeLessThanOrEqual(0)
}

const answers = (page: Page) => page.getByRole('group', { name: 'Antworten' }).getByRole('button')

// Nummer der Frage aus der Adresse: Grundform (bis 9999) oder 500000 + 50 · Nummer + Fassung
function questionNo(url: string): number {
  const seed = Number(/-(\d+)$/.exec(url)![1])
  return seed < 10_000 ? seed : Math.floor((seed - 500_000) / 50)
}

// Richtige und falsche Antworten einer Frage, abgelesen auf der Testseite „Fragen durchsehen"
async function answersFromGallery(context: BrowserContext, no: number): Promise<{ correct: string; wrong: string[] }> {
  const gallery = await context.newPage()
  await gallery.goto('./#/galerie/chem-atombau')
  const card = gallery.locator(`article[data-question-no="${no}"]`)
  const correct = (await card.getByTestId('correct-answer').textContent())!.trim()
  const wrong = (await card.getByTestId('wrong-answer').allTextContents()).map((t) => t.trim())
  await gallery.close()
  return { correct, wrong }
}

async function indexOfAnswer(page: Page, text: string): Promise<number> {
  return (await answers(page).allTextContents()).findIndex((t) => t.trim() === text)
}

test('Chemie: Start → Atombau → Grundlagen, Frage richtig beantworten, melden, Liste in den Einstellungen', async ({ page, context }) => {
  const errors = collectErrors(page)
  await page.goto('./')
  await page.getByRole('link', { name: /^Aufbau der Materie/ }).click()
  await expect(page).toHaveURL(/#\/gebiet\/chem-materie$/)
  await expect(page.getByRole('heading', { name: 'Aufbau der Materie', level: 1 })).toBeVisible()
  // Elektronen kommen bald
  await expect(page.getByText('kommt bald')).toHaveCount(1)
  await expectCleanPage(page, 'Gebiet')

  await page.getByRole('link', { name: /^Atombau/ }).click()
  await expect(page).toHaveURL(/#\/thema\/chem-atombau$/)
  await expect(page.getByRole('heading', { name: 'Atombau', level: 1 })).toBeVisible()
  // Stufen mit Namen, nur geführt; Vorschau-Formeln mit mhchem
  await expect(page.getByRole('radio', { name: /^Grundlagen/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: /^Klausurniveau/ })).toBeEnabled()
  await expect(page.getByRole('radio', { name: /Frei/ })).toBeDisabled()
  expect(await page.locator('.katex').count()).toBeGreaterThanOrEqual(5)
  await expectCleanPage(page, 'Thema')

  await page.getByRole('link', { name: 'Grundlagen geführt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/1-\d+$/)
  await expect(page.locator('#question')).toBeVisible()
  await expect(page.getByText(/^Grundlagen · Aufgabe 1-\d+ · Wähle die richtige Antwort/)).toBeVisible()
  await expect(answers(page)).toHaveCount(4)
  await expectCleanPage(page, 'Frage')

  const { correct } = await answersFromGallery(context, questionNo(page.url()))
  const index = await indexOfAnswer(page, correct)
  expect(index, `„${correct}" unter den Antworten`).toBeGreaterThanOrEqual(0)
  await answers(page).nth(index).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Frage melden' }).click()
  await expect(page.getByText('Gemeldet. Die Liste findest du in den Einstellungen.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Frage melden' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Ergebnis ansehen' }).click()
  await expect(page.getByRole('heading', { name: 'Geschafft!' })).toBeVisible()
  await expect(page.getByTestId('result')).toContainText(correct)
  await expectCleanPage(page, 'Abschluss')

  // „Nächste Aufgabe" zieht wieder eine Frage der Grundlagen
  await page.getByRole('link', { name: 'Nächste Aufgabe' }).click()
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/1-\d+$/)
  await expect(page.locator('#question')).toBeVisible()

  // Einstellungen: Liste kopieren und leeren
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('./#/einstellungen')
  const reports = page.getByRole('region', { name: 'Gemeldete Fragen' })
  await expect(reports).toContainText('1 Frage gemeldet.')
  await reports.getByRole('button', { name: 'Liste kopieren' }).click()
  await expect(reports).toContainText('Kopiert.')
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toMatch(/^Gemeldete Fragen aus Rechenweg \(1\):\n1\. chem-atombau, Aufgabe 1-\d+, Frage [a-z0-9-]+ \(gemeldet am/)
  await expectCleanPage(page, 'Einstellungen')
  // „Fortschritt löschen" lässt die Liste stehen
  await page.goto('./#/fortschritt')
  await page.getByRole('button', { name: 'Fortschritt löschen' }).click()
  await page.getByRole('button', { name: 'Ja, löschen' }).click()
  await page.goto('./#/einstellungen')
  await expect(reports).toContainText('1 Frage gemeldet.')
  await reports.getByRole('button', { name: 'Liste leeren' }).click()
  await reports.getByRole('button', { name: 'Ja, leeren' }).click()
  await expect(page.getByRole('region', { name: 'Gemeldete Fragen' })).toHaveCount(0)
  expect(errors).toEqual([])
})

test('Chemie: falsche Antwort mit „Warum ist das falsch?", Denkfehler im Fortschritt, Lernkarten', async ({ page, context }) => {
  const errors = collectErrors(page)
  await page.goto('./#/ueben/chem-atombau/2')
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/2-\d+$/)
  await expect(page.getByText(/^Vertiefung · Aufgabe 2-\d+/)).toBeVisible()
  const { correct, wrong } = await answersFromGallery(context, questionNo(page.url()))
  const texts = (await answers(page).allTextContents()).map((t) => t.trim())
  const wrongIndex = texts.findIndex((t) => wrong.includes(t))
  expect(wrongIndex).toBeGreaterThanOrEqual(0)
  await answers(page).nth(wrongIndex).click()
  await expect(page.getByText('Nicht ganz. Versuch es noch einmal.')).toBeVisible()
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(page.locator('[aria-live="polite"]')).toContainText(/\S{10,}/)
  await answers(page).nth(await indexOfAnswer(page, correct)).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Lernkarte' }).or(page.getByRole('button', { name: 'Lernkarten' })).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expectCleanPage(page, 'Lernkarte in der Aufgabe')
  await page.getByRole('dialog').getByRole('button', { name: 'Schließen' }).click()
  await page.getByRole('button', { name: 'Ergebnis ansehen' }).click()
  await expect(page.getByText('Gelöst mit 1 Fehlversuch.')).toBeVisible()

  // Fortschritt: Atombau mit Stufennamen und dem Denkfehler als Aussage
  await page.goto('./#/fortschritt')
  const atombau = page.getByRole('region', { name: 'Atombau', exact: true })
  await expect(atombau.getByRole('listitem', { name: 'Vertiefung' })).toContainText('1 gelöst · zuletzt 0 von 1 ohne Fehler')
  await expect(atombau).toContainText('So sieht der Fehler aus:')
  await expect(atombau.getByRole('link', { name: 'Gezielt üben' })).toHaveCount(0)
  await expectCleanPage(page, 'Fortschritt')

  // Lernkarten: Ordner Atombau nach Stufennamen, Karte ohne Formel-Pflicht
  await page.goto('./#/karten')
  await page.getByRole('link', { name: /^Atombau/ }).click()
  await expect(page).toHaveURL(/#\/karten\/chem-atombau$/)
  await expect(page.getByRole('heading', { name: 'Grundlagen', level: 2 })).toBeVisible()
  await page.locator('main li a').first().click()
  await expect(page.getByText(/^Lernkarte · ab (Grundlagen|Vertiefung|Klausurniveau)$/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Beispiel' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte')
  expect(errors).toEqual([])
})

test('Chemie: Adressen mit falscher Stufe, zu hoher Stufe und ohne Frage', async ({ page }) => {
  await page.goto('./#/ueben/chem-atombau/1')
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/1-\d+$/)
  const seed = /-(\d+)$/.exec(page.url())![1]
  // Die Nummer legt die Stufe fest: falsche Stufe in der Adresse wird berichtigt
  await page.goto(`./#/ueben/chem-atombau/3-${seed}`)
  await expect(page).toHaveURL(new RegExp(`#/ueben/chem-atombau/1-${seed}$`))
  await expect(page.locator('#question')).toBeVisible()
  // Chemie hat drei Stufen: Stufe 5 führt zum Klausurniveau
  await page.goto('./#/ueben/chem-atombau/5')
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/3-\d+$/)
  await expect(page.getByText(/^Klausurniveau · Aufgabe 3-\d+/)).toBeVisible()
  // Eine Nummer ohne Frage
  await page.goto('./#/ueben/chem-atombau/1-9999')
  await expect(page.getByRole('heading', { name: 'Diese Aufgabe gibt es nicht (mehr).' })).toBeVisible()
  await page.getByRole('link', { name: 'Neue Aufgabe' }).click()
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/1-\d+$/)
  await expect(page.locator('#question')).toBeVisible()
})

test('Galerie: Chemie-Kachel und Seite „Fragen durchsehen"', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/galerie')
  await expect(page.getByRole('heading', { name: 'Chemie 1' })).toBeVisible()
  const tile = page.getByRole('link', { name: /^Atombau/ })
  await expect(tile).toContainText('Fragen durchsehen · Grundlagen, Vertiefung und Klausurniveau')
  await tile.click()
  await expect(page).toHaveURL(/#\/galerie\/chem-atombau$/)
  await expect(page.getByRole('heading', { name: 'Atombau: Fragen durchsehen', level: 1 })).toBeVisible()
  for (const level of ['Grundlagen', 'Vertiefung', 'Klausurniveau']) await expect(page.getByRole('heading', { name: level, level: 2 })).toBeVisible()
  expect(await page.locator('article[data-question-no]').count()).toBeGreaterThanOrEqual(45)
  await expect(page.getByRole('heading', { name: 'Denkfehler', level: 2 })).toBeVisible()
  await expectCleanPage(page, 'Fragen durchsehen')
  expect(errors).toEqual([])
})
