import { type BrowserContext, type Page, expect, test } from '@playwright/test'

// Chemie 1 (M4, Schritt S1): Atombau mit Wissensfragen, Stufen mit Namen, „Frage melden", Fehler als
// Aussage, Testseite „Fragen durchsehen"; S1b: Unterthemen ankreuzen und Themen mischen

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

// Nummer der Frage aus der Adresse: Grundform (bis 9999) oder 500000 + 50 · Nummer + Fassung (auch mit
// ?mischen= dahinter)
function questionNo(url: string): number {
  const seed = Number(/-(\d+)(?:\?.*)?$/.exec(url)![1])
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
  const prompt = (await page.locator('#question').textContent())!.trim()
  const index = await indexOfAnswer(page, correct)
  expect(index, `„${correct}" unter den Antworten`).toBeGreaterThanOrEqual(0)
  await answers(page).nth(index).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()

  // Der Live-Bereich für die Bestätigung ist schon vor dem Melden da (sonst lesen Vorlesehilfen sie oft nicht vor)
  const reportStatus = page.getByRole('status')
  await expect(reportStatus).toHaveText('')
  await page.getByRole('button', { name: 'Frage melden' }).click()
  await expect(reportStatus).toHaveText('Gemeldet. Die Liste findest du in den Einstellungen.')
  // Der Knopf bleibt mit dem Fokus stehen, meldet aber nicht noch einmal
  const reported = page.getByRole('button', { name: 'Gemeldet', exact: true })
  await expect(reported).toHaveAttribute('aria-disabled', 'true')
  await expect(reported).toBeFocused()
  await reported.click({ force: true })
  await expect(page.getByRole('button', { name: 'Frage melden' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Ergebnis ansehen' }).click()
  await expect(page.getByRole('heading', { name: 'Geschafft!' })).toBeVisible()
  await expect(page.getByTestId('result')).toContainText(correct)
  // mit der Frage selbst, damit die Antwort einen Zusammenhang hat
  await expect(page.getByTestId('result')).toContainText(prompt)
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
  // „Fortschritt löschen" lässt die Liste stehen und beginnt die Runden der Fragen von vorn
  const rounds = () => page.evaluate(() => JSON.parse(localStorage.getItem('rechenweg-fragen') ?? '{}') as Record<string, number[]>)
  expect((await rounds())['chem-atombau:1']).toHaveLength(2)
  await page.goto('./#/fortschritt')
  await page.getByRole('button', { name: 'Fortschritt löschen' }).click()
  await page.getByRole('button', { name: 'Ja, löschen' }).click()
  expect(await rounds()).toEqual({})
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

// Nummern der Fragen eines Unterthemas, abgelesen auf der Testseite „Fragen durchsehen"
async function questionsOfPart(context: BrowserContext, part: string): Promise<Set<number>> {
  const gallery = await context.newPage()
  await gallery.goto('./#/galerie/chem-atombau')
  // Die Seite wird erst bei Bedarf geladen
  await gallery.locator('article[data-question-no]').first().waitFor()
  const nos = await gallery.locator(`article[data-part="${part}"]`).evaluateAll((cards) => cards.map((card) => Number(card.getAttribute('data-question-no'))))
  await gallery.close()
  return new Set(nos)
}

test('Chemie: Unterthemen ankreuzen, nur Atommodelle in der Vertiefung', async ({ page, context }) => {
  const errors = collectErrors(page)
  await page.goto('./#/thema/chem-atombau')
  const parts = page.getByRole('group', { name: 'Was soll drankommen?' })
  await expect(parts.getByRole('checkbox')).toHaveCount(5)
  for (const box of await parts.getByRole('checkbox').all()) await expect(box).toBeChecked()
  // In den Grundlagen gibt es Atommodelle sowie Licht und Spektren noch nicht
  await expect(parts.getByText('erst ab Vertiefung')).toHaveCount(2)
  for (const name of ['Stoffe, Trennverfahren, Reaktionen', 'Kern, Hülle und ihre Teilchen', 'Isotope und Ionen', 'Licht und Spektren']) {
    await parts.getByRole('checkbox', { name }).uncheck()
  }
  await expect(parts.getByRole('checkbox', { name: 'Atommodelle' })).toBeChecked()
  // Grundlagen: kein angekreuztes Unterthema hat Fragen, der Knopf ist nicht klickbar
  await expect(page.getByRole('link', { name: 'Grundlagen geführt üben' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Grundlagen geführt üben' })).toBeDisabled()
  await expect(page.getByText('Kreuze unten mindestens ein Unterthema an, das es in Grundlagen gibt.')).toBeVisible()
  await expectCleanPage(page, 'Thema ohne passende Unterthemen')

  // Vertiefung: nur Fragen zu Atommodellen, jede einmal
  await page.getByText('Ionen, Größe von Kern und Atom, Atommodelle, Licht und Spektren').click()
  await expect(page.getByText('In Vertiefung: 1 von 4 Unterthemen angekreuzt')).toBeVisible()
  await expect(parts.getByText('nicht in Vertiefung')).toHaveCount(1)
  const models = await questionsOfPart(context, 'modelle')
  expect(models.size).toBeGreaterThanOrEqual(10)
  await page.getByRole('link', { name: 'Vertiefung geführt üben' }).click()
  const seen: number[] = []
  for (let i = 0; i < 10; i++) {
    if (i > 0) await page.goto('./#/ueben/chem-atombau/2')
    await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/2-\d+$/)
    await expect(page.locator('#question')).toBeVisible()
    const no = questionNo(page.url())
    expect(models, `Frage ${no} gehört zu Atommodelle`).toContain(no)
    seen.push(no)
  }
  // keine Frage doppelt, solange noch nicht alle dran waren
  expect(new Set(seen).size).toBe(Math.min(10, models.size))

  // Zurück in Grundlagen: „Weitermachen" bietet kein Üben an, sondern die Auswahl (wie die Themenseite)
  await page.goto('./#/thema/chem-atombau')
  await page.getByText('Stoffe, Elementarteilchen, Kernsymbol und Isotope').click()
  await expect(page.getByRole('button', { name: 'Grundlagen geführt üben' })).toBeDisabled()
  await page.goto('./')
  // noch nichts beantwortet: Die Karte heißt „Los geht’s"
  const card = page.getByRole('region', { name: /^(Weitermachen|Los geht’s)$/ })
  await expect(card).toContainText('Atombau')
  await expect(card).toContainText('Kreuze mindestens ein Unterthema an, das es in Grundlagen gibt.')
  await expect(card.getByRole('link', { name: /^Weiter üben/ })).toHaveCount(0)
  await expect(card.getByRole('link', { name: 'Auswahl ändern' })).toHaveAttribute('href', '#/thema/chem-atombau')
  await expectCleanPage(page, 'Weitermachen ohne passende Unterthemen')

  // „Alle wählen" kreuzt wieder alles an
  await page.goto('./#/thema/chem-atombau')
  await page.getByRole('button', { name: 'Alle wählen' }).click()
  for (const box of await parts.getByRole('checkbox').all()) await expect(box).toBeChecked()
  await expect(page.getByRole('button', { name: 'Alle wählen' })).toHaveCount(0)
  expect(errors).toEqual([])
})

test('Chemie: Themen mischen, „Nächste Aufgabe" bleibt in der Mischung, X und „Weitermachen"', async ({ page, context }) => {
  const errors = collectErrors(page)
  await page.goto('./')
  await page.getByRole('link', { name: /^Themen mischen/ }).click()
  await expect(page).toHaveURL(/#\/mischen\/chemie$/)
  await expect(page.getByRole('heading', { name: 'Themen mischen', level: 1 })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Atombau' })).toBeChecked()
  await expectCleanPage(page, 'Mischseite')

  // Unterthemen aufklappen: dieselben Kästchen wie auf der Themenseite
  const toggle = page.getByRole('button', { name: /^Unterthemen: alle/ })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('checkbox', { name: 'Licht und Spektren' }).uncheck()
  await expect(page.getByRole('button', { name: /^Unterthemen: 4 von 5/ })).toBeVisible()

  // Ohne angekreuztes Thema nicht klickbar
  await page.getByRole('checkbox', { name: 'Atombau' }).uncheck()
  await expect(page.getByRole('button', { name: 'Grundlagen gemischt üben' })).toBeDisabled()
  await expect(page.getByText('Kreuze unten mindestens ein Thema an, das es in Grundlagen gibt.')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Atombau' }).check()
  // Atombau angekreuzt, aber keins seiner angekreuzten Unterthemen gibt es in Grundlagen: Der Hinweis
  // nennt das Thema
  const basics = ['Stoffe, Trennverfahren, Reaktionen', 'Kern, Hülle und ihre Teilchen', 'Isotope und Ionen']
  for (const name of basics) await page.getByRole('checkbox', { name }).uncheck()
  await expect(page.getByRole('button', { name: 'Grundlagen gemischt üben' })).toBeDisabled()
  await expect(page.getByText('Kreuze unten bei Atombau mindestens ein Unterthema an, das es in Grundlagen gibt.')).toBeVisible()
  for (const name of basics) await page.getByRole('checkbox', { name }).check()

  await page.locator('label', { hasText: 'Klausurniveau' }).click()
  await expect(page.getByText('Fragen aus Atombau (4 von 5 Unterthemen)')).toBeVisible()
  await page.getByRole('link', { name: 'Klausurniveau gemischt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/3-\d+\?mischen=chemie$/)
  await expect(page.getByText('Themen mischen · Atombau')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Hauptmenü' })).toHaveCount(0)
  // Die Auswahl gilt auch hier: keine Frage zu Licht und Spektren
  const light = await questionsOfPart(context, 'licht')
  expect(light).not.toContain(questionNo(page.url()))

  const { correct } = await answersFromGallery(context, questionNo(page.url()))
  await answers(page).nth(await indexOfAnswer(page, correct)).click()
  await page.getByRole('button', { name: 'Ergebnis ansehen' }).click()
  await expect(page.getByRole('heading', { name: 'Geschafft!' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Eine Stufe höher?' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Zur Übersicht' })).toHaveAttribute('href', '#/mischen/chemie')
  await page.getByRole('link', { name: 'Nächste Aufgabe' }).click()
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/3-\d+\?mischen=chemie$/)
  await expect(page.locator('#question')).toBeVisible()

  // Das X führt zur Mischung zurück
  await page.getByRole('link', { name: 'Aufgabe beenden' }).click()
  await expect(page).toHaveURL(/#\/mischen\/chemie$/)

  // „Weitermachen" setzt die Mischung fort
  await page.goto('./')
  const card = page.getByRole('region', { name: 'Weitermachen' })
  await expect(card).toContainText('Themen mischen')
  await expect(card).toContainText('Klausurniveau: Atombau (4 von 5 Unterthemen)')
  await expect(card.getByRole('link', { name: 'Weiter üben · geführt' })).toHaveAttribute('href', '#/mischen/chemie/3')
  await expect(card.getByRole('link', { name: 'Auswahl ändern' })).toHaveAttribute('href', '#/mischen/chemie')
  await expectCleanPage(page, 'Startseite mit Mischung')
  await card.getByRole('link', { name: 'Weiter üben · geführt' }).click()
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/3-\d+\?mischen=chemie$/)

  // Mischung ohne Thema: „Auswahl ändern" ist der Hauptknopf
  await page.goto('./#/mischen/chemie')
  await page.getByRole('checkbox', { name: 'Atombau' }).uncheck()
  await page.goto('./')
  await expect(card).toContainText('Kreuze mindestens ein Thema an, das es in Klausurniveau gibt.')
  await expect(card.getByRole('link', { name: /^Weiter üben/ })).toHaveCount(0)
  await expect(card.getByRole('link', { name: 'Auswahl ändern' })).toHaveAttribute('href', '#/mischen/chemie')

  // Ein einzelnes Thema üben: „Weitermachen" zeigt wieder das Thema, in Grundlagen ohne Zählung (Licht
  // und Spektren gibt es dort nicht, also ist dort alles angekreuzt)
  await page.goto('./#/ueben/chem-atombau/1')
  await expect(page.locator('#question')).toBeVisible()
  await page.goto('./')
  await expect(card).toContainText('Atombau')
  await expect(card).not.toContainText('Unterthemen')
  await expect(card).not.toContainText('Themen mischen')
  expect(errors).toEqual([])
})
