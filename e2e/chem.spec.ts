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

// Ab S2 kommen zwischen den Fragen auch erzeugte Rechnungen (Nummern 10000 bis 499999). Tests, die eine
// Wissensfrage brauchen, ziehen so lange neu, bis eine kommt.
const isCalc = (url: string) => {
  const seed = Number(/-(\d+)(?:\?.*)?$/.exec(url)?.[1] ?? 0)
  return seed >= 10_000 && seed < 500_000
}
async function ensureQuestion(page: Page, href: string) {
  for (let i = 0; i < 30 && isCalc(page.url()); i++) {
    await page.goto(href)
    await expect(page).toHaveURL(/-\d+(\?.*)?$/)
  }
  expect(isCalc(page.url()), 'nach 30 Versuchen noch keine Frage').toBe(false)
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
  // seit S6a sind beide Themen spielbar
  await expect(page.getByText('kommt bald')).toHaveCount(0)
  await expectCleanPage(page, 'Gebiet')

  await page.getByRole('link', { name: /^Atombau/ }).click()
  await expect(page).toHaveURL(/#\/thema\/chem-atombau$/)
  await expect(page.getByRole('heading', { name: 'Atombau', level: 1 })).toBeVisible()
  // Stufen mit Namen, seit S8b auch frei; Vorschau-Formeln mit mhchem
  await expect(page.getByRole('radio', { name: /^Grundlagen/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: /^Klausurniveau/ })).toBeEnabled()
  await expect(page.getByRole('radio', { name: /Frei/ })).toBeEnabled()
  expect(await page.locator('.katex').count()).toBeGreaterThanOrEqual(5)
  await expectCleanPage(page, 'Thema')

  await page.getByRole('link', { name: 'Grundlagen geführt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/1-\d+$/)
  await ensureQuestion(page, './#/ueben/chem-atombau/1')
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
  await ensureQuestion(page, './#/ueben/chem-atombau/1')
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
  // … und leert die Wiederholung (S8a)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('rechenweg-wiederholung') ?? 'null') as unknown)).toEqual({ tick: 0, last: null, items: {} })
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
  await ensureQuestion(page, './#/ueben/chem-atombau/2')
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
  await expect(page.getByText('Gelöst mit 1 Fehlversuch. Die Frage kommt nach drei anderen Aufgaben noch einmal.')).toBeVisible()

  // Wiederholung (S8a): nach drei anderen Aufgaben kommt dieselbe Frage zuerst, in einer anderen Fassung
  const wrongNo = questionNo(page.url())
  const wrongUrl = page.url()
  await expect(page.getByTestId('review-note')).toHaveCount(0)
  for (const seed of [11, 12]) {
    await page.goto(`./#/ueben/brueche/1-${seed}`)
    await expect(page.getByText(/^Stufe 1 · Aufgabe 1-/)).toBeVisible()
  }
  await page.goto('./#/ueben/chem-atombau/2')
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/2-\d+$/)
  // erst zwei andere Aufgaben: die neue Aufgabe ist die dritte, noch keine Wiederholung
  expect(questionNo(page.url())).not.toBe(wrongNo)
  await page.goto('./#/ueben/chem-atombau/2')
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/2-\d+$/)
  expect(questionNo(page.url())).toBe(wrongNo)
  expect(page.url()).not.toBe(wrongUrl)
  await expect(page.getByTestId('review-note')).toHaveText('Wiederholung: Diese Frage hattest du schon einmal falsch.')
  await expectCleanPage(page, 'Wiederholung')

  // Fortschritt: Atombau mit Stufennamen und dem Denkfehler als Aussage
  await page.goto('./#/fortschritt')
  const atombau = page.getByRole('region', { name: 'Atombau', exact: true })
  await expect(atombau.getByRole('listitem', { name: 'Vertiefung' })).toContainText('1 gelöst · zuletzt 0 von 1 ohne Fehler')
  await expect(atombau).toContainText('So sieht der Fehler aus:')
  // ab S2 lässt sich jeder Fehler gezielt üben
  await expect(atombau.getByRole('link', { name: 'Gezielt üben' }).first()).toBeVisible()
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
  await ensureQuestion(page, './#/ueben/chem-atombau/1')
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
  await expect(page.getByRole('checkbox', { name: 'Stoffmenge und Umsatz' })).toBeChecked()
  await expectCleanPage(page, 'Mischseite')
  // Dieser Test mischt nur Atombau
  await page.getByRole('checkbox', { name: 'Stoffmenge und Umsatz' }).uncheck()
  await page.getByRole('checkbox', { name: 'Reaktionsgleichungen' }).uncheck()
  await page.getByRole('checkbox', { name: 'Gase und Lösungen' }).uncheck()
  await page.getByRole('checkbox', { name: 'Ionenbindung und Salze' }).uncheck()
  await page.getByRole('checkbox', { name: 'Moleküle' }).uncheck()
  await page.getByRole('checkbox', { name: 'Zwischenmolekulare Kräfte' }).uncheck()
  await page.getByRole('checkbox', { name: 'Metallbindung und Hybridisierung' }).uncheck()
  await page.getByRole('checkbox', { name: 'Elektronen', exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'Aufbau des Periodensystems', exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'Trends im Periodensystem', exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'Chemisches Gleichgewicht', exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'Energie bei Reaktionen', exact: true }).uncheck()

  // Unterthemen aufklappen: dieselben Kästchen wie auf der Themenseite (Atombau steht zuerst)
  const toggle = page.getByRole('button', { name: /^Unterthemen: alle/ }).first()
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

  // Stufenwahl (das Unterthema „Molekülorbitale“ nennt im Hinweis auch „Klausurniveau“)
  await page.locator('label', { hasText: /^\s*3\s*Klausurniveau/ }).click()
  await expect(page.getByText('Fragen aus Atombau (4 von 5 Unterthemen)')).toBeVisible()
  await page.getByRole('link', { name: 'Klausurniveau gemischt üben' }).click()
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/3-\d+\?mischen=chemie$/)
  await ensureQuestion(page, './#/mischen/chemie/3')
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

// S2: erste Rechnungen (Protonen, Neutronen, Elektronen; Energie des Lichts), Fehler gezielt üben
async function chooseAnswer(page: Page, text: string) {
  const texts = (await answers(page).allTextContents()).map((t) => t.trim())
  // KaTeX schreibt die Formel mehrfach in den Text (für Vorlesehilfen und sichtbar): der erste Teil zählt
  const index = texts.findIndex((t) => t.split('\\displaystyle')[0].trim() === text)
  expect(index, `„${text}" unter ${texts.join(' | ')}`).toBeGreaterThanOrEqual(0)
  await answers(page).nth(index).click()
}

test('Chemie: Rechnung zu ³⁷Cl⁻, Massenzahl als Neutronenzahl, Fehler gezielt üben', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/ueben/chem-atombau/2-11309')
  await expect(page.getByText(/^Vertiefung · Aufgabe 2-11309 · Bestimme Protonen, Neutronen und Elektronen/)).toBeVisible()
  await expectCleanPage(page, 'Rechnung')
  await expect(page.locator('#question')).toHaveText('Wie viele Protonen hat das Teilchen?')
  await chooseAnswer(page, '17')
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.locator('#question')).toHaveText('Wie viele Neutronen hat das Teilchen?')
  // absichtlich die Massenzahl
  await chooseAnswer(page, '37')
  await expect(page.getByText('Nicht ganz. Versuch es noch einmal.')).toBeVisible()
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(page.locator('[aria-live="polite"]')).toContainText('Protonen und Neutronen zusammen')
  await chooseAnswer(page, '20')
  await page.getByRole('button', { name: 'Weiter' }).click()
  await chooseAnswer(page, '18')
  await page.getByRole('button', { name: 'Ergebnis ansehen' }).click()
  await expect(page.getByTestId('result')).toContainText('17 Protonen, 20 Neutronen, 18 Elektronen')
  await expectCleanPage(page, 'Ergebnis der Rechnung')

  // Fortschritt: der Rechenfehler als Formel, gezielt üben führt zu einer Rechnung mit diesem Fehler
  await page.goto('./#/fortschritt')
  const atombau = page.getByRole('region', { name: 'Atombau', exact: true })
  await expect(atombau).toContainText('Massenzahl und Neutronenzahl gleichgesetzt')
  await atombau.getByRole('link', { name: 'Gezielt üben' }).first().click()
  await expect(page).toHaveURL(/#\/ueben\/chem-atombau\/[1-3]-\d+\?fokus=chem-neutrons-mass-number$/)
  await expect(page.getByText(/^Gezielt üben: Massenzahl und Neutronenzahl gleichgesetzt/)).toBeVisible()
  await expectCleanPage(page, 'Gezielt üben')

  // Energie des Lichts: die Aufgabe nennt die Konstanten
  await page.goto('./#/ueben/chem-atombau/2-10005')
  await expect(page.getByText(/Rechne mit/)).toBeVisible()
  await expect(answers(page)).toHaveCount(3)
  await expectCleanPage(page, 'Energie des Lichts')

  // Testseite: Rechnungen mit Abwechslung
  await page.goto('./#/galerie/chem-atombau')
  await expect(page.getByRole('heading', { name: 'Rechnungen', level: 2 })).toBeVisible()
  await page.getByRole('button', { name: 'Abwechslung zählen' }).first().click()
  await expect(page.getByText(/Abwechslung: \d+ Formen unter 200 Aufgaben/).first()).toBeVisible()
  await expectCleanPage(page, 'Rechnungen in der Galerie')
  expect(errors).toEqual([])
})

// S3a: Thema „Stoffmenge und Umsatz" nur mit Rechnungen
test('Chemie: Molmasse von Zn(OH)₂ mit Klammer, Üben, Lernkarten', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/thema/chem-stoffmenge')
  await expect(page.getByRole('heading', { name: 'Stoffmenge und Umsatz', level: 1 })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Was soll drankommen?' }).getByRole('checkbox')).toHaveCount(3)
  await expectCleanPage(page, 'Thema Stoffmenge')

  await page.goto('./#/ueben/chem-stoffmenge/2-10078')
  await expect(page.getByText(/^Vertiefung · Aufgabe 2-10078 · Berechne die molare Masse/)).toBeVisible()
  await expect(page.getByText(/Werte aus dem PSE/)).toBeVisible()
  await expectCleanPage(page, 'Molmasse')
  // absichtlich die Klammer nur auf das H bezogen
  const texts = (await answers(page).allTextContents()).map((t) => t.replace(/\s+/g, ''))
  const bracket = texts.findIndex((t) => t.includes('O:1') && t.includes('H:2'))
  expect(bracket).toBeGreaterThanOrEqual(0)
  await answers(page).nth(bracket).click()
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(page.locator('[aria-live="polite"]')).toContainText('hinter einer Klammer')
  const right = (await answers(page).allTextContents()).map((t) => t.replace(/\s+/g, '')).findIndex((t) => t.includes('O:2') && t.includes('H:2'))
  await answers(page).nth(right).click()
  await page.getByRole('button', { name: 'Weiter' }).click()
  const molar = (await answers(page).allTextContents()).findIndex((t) => t.startsWith('99,4'))
  expect(molar).toBeGreaterThanOrEqual(0)
  await answers(page).nth(molar).click()
  await page.getByRole('button', { name: 'Ergebnis ansehen' }).click()
  await expect(page.getByTestId('result')).toContainText('99,4')
  await expectCleanPage(page, 'Ergebnis Molmasse')

  // seit S3c kommen Fragen und Rechnungen gemischt
  await page.goto('./#/ueben/chem-stoffmenge/1')
  await expect(page).toHaveURL(/#\/ueben\/chem-stoffmenge\/1-\d+$/)
  await expect(page.locator('#question')).toBeVisible()
  await expectCleanPage(page, 'Stoffmenge üben')

  // Lernkarten-Ordner
  await page.goto('./#/karten/chem-stoffmenge')
  await expect(page.getByRole('link', { name: /Molare Masse/ })).toBeVisible()
  await expectCleanPage(page, 'Lernkarten Stoffmenge')
  expect(errors).toEqual([])
})

// S3b: Reaktionsgleichungen ausgleichen, Verbrennung mit Bruch vor O2
test('Chemie: Verbrennung von Butan mit 13/2 O₂, ganzzahlig machen, Lernkarten', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/ueben/chem-gleichungen/3-10000')
  await expect(page.getByText(/^Klausurniveau · Aufgabe 3-10000 · Stelle die Gleichung der vollständigen Verbrennung auf/)).toBeVisible()
  await expectCleanPage(page, 'Verbrennung')
  const pick = async (test: (t: string) => boolean) => {
    // die mhchem-Formel steht im Text für Vorlesehilfen: \ce{…}
    const texts = (await answers(page).allTextContents()).map((t) => /\\ce\{([^}]*)\}/.exec(t.replace(/\s+/g, ''))?.[1] ?? t)
    const index = texts.findIndex(test)
    expect(index, texts.join(' | ')).toBeGreaterThanOrEqual(0)
    await answers(page).nth(index).click()
  }
  // C und H: 4 CO2 und 5 H2O
  await pick((t) => t === '4CO2+5H2O')
  await page.getByRole('button', { name: 'Weiter' }).click()
  // absichtlich nicht halbiert: 13 O2
  await pick((t) => t === '13O2')
  await page.getByRole('button', { name: 'Warum ist das falsch?' }).click()
  await expect(page.locator('[aria-live="polite"]')).toContainText('zwei Sauerstoffatome')
  await pick((t) => t === '13/2O2')
  await expectCleanPage(page, 'Bruch vor O2')
  await page.getByRole('button', { name: 'Weiter' }).click()
  await pick((t) => t === '2C4H10+13O2->8CO2+10H2O')
  await page.getByRole('button', { name: 'Ergebnis ansehen' }).click()
  await expectCleanPage(page, 'Ergebnis Verbrennung')

  await page.goto('./#/karten/chem-gleichungen')
  await expect(page.getByRole('link', { name: /Vollständige Verbrennung/ })).toBeVisible()
  await expectCleanPage(page, 'Lernkarten Gleichungen')
  expect(errors).toEqual([])
})

// S3c: Wissensfragen zu Reaktionsgleichungen und Stoffmenge
test('Chemie: Wissensfragen zu Reaktionsgleichungen und Stoffmenge in der Galerie und beim Üben', async ({ page }) => {
  const errors = collectErrors(page)
  for (const course of ['chem-gleichungen', 'chem-stoffmenge']) {
    await page.goto(`./#/galerie/${course}`)
    await page.locator('article[data-question-no]').first().waitFor()
    expect(await page.locator('article[data-question-no]').count(), course).toBeGreaterThanOrEqual(45)
    await expectCleanPage(page, `Galerie ${course}`)
    // eine Frage in der Grundform
    await page.goto(`./#/ueben/${course}/1-101`)
    await expect(page.getByText(/· Wähle die richtige Antwort/)).toBeVisible()
    await expect(answers(page)).toHaveCount(4)
    await expectCleanPage(page, `Frage ${course}`)
  }
  expect(errors).toEqual([])
})

test('Chemie: Klausuraufgabe 4 üben, alle Teile beantworten, abgeben, Auswertung mit Punkten', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-stoechiometrie')
  await page.getByRole('link', { name: /Klausuraufgabe 4 üben/ }).click()
  // ohne Nummer würfelt die Seite eine und leitet weiter
  await expect(page).toHaveURL(/#\/klausur\/chemie\/aufgabe\/4\/\d+$/)
  await expect(page.getByRole('heading', { name: /Klausuraufgabe 4/ })).toBeVisible()
  await expectCleanPage(page, 'Klausuraufgabe 4')

  // Abgeben mit offenen Fragen fragt nach
  await page.getByRole('button', { name: 'Abgeben' }).click()
  await expect(page.getByText(/Fragen offen/)).toBeVisible()

  // jede Frage: die erste Antwort (spätere Fragen erscheinen, sobald die davor beantwortet sind)
  for (let i = 0; i < 20; i++) {
    const open = page.getByTestId('exam-item').getByRole('group', { name: 'Antworten' }).filter({ hasNot: page.locator('[aria-pressed="true"]') })
    if ((await open.count()) === 0) break
    await open.first().getByRole('button').first().click()
  }
  await expect(page.getByText('Kommt, sobald die Fragen davor beantwortet sind.')).toHaveCount(0)
  await page.getByRole('button', { name: 'Abgeben' }).click()
  await expect(page.getByTestId('exam-score')).toHaveText(/^\d+(,5)? von 14 Punkten$/)
  await expect(page.getByText('Punkte nach dem Schema der App, Teilpunkte geschätzt.')).toBeVisible()
  await expectCleanPage(page, 'Auswertung')
  // Lösungsweg aufklappen
  await page.getByText('Lösungsweg').first().click()
  await expectCleanPage(page, 'Lösungsweg')

  // Neuladen zeigt dieselbe Aufgabe; „Neue Aufgabe" würfelt eine andere Nummer
  const url = page.url()
  await page.getByRole('link', { name: 'Neue Aufgabe' }).first().click()
  await expect(page).toHaveURL(/#\/klausur\/chemie\/aufgabe\/4\/\d+$/)
  expect(page.url()).not.toBe(url)
  expect(errors).toEqual([])
})

test('Chemie: Ionenbindung und Salze, Rechnung zur Formel, Lernkarte mit Gitterbildern', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-bindung')
  await page.getByRole('link', { name: /Ionenbindung und Salze/ }).click()
  await expect(page.getByRole('heading', { name: 'Ionenbindung und Salze' })).toBeVisible()
  // eine feste Rechnung der Grundlagen (Formel, Name oder Zerfall in Ionen)
  await page.goto('./#/ueben/chem-ionen/1-10000')
  await expect(answers(page).first()).toBeVisible()
  await expectCleanPage(page, 'Rechnung zu Salzen')
  // Lernkarte mit drei Bildern
  await page.goto('./#/karten/chem-ionen/ionen-gitter')
  await expect(page.getByTestId('chem-figure')).toHaveCount(3)
  await expectCleanPage(page, 'Ionengitter')
  expect(errors).toEqual([])
})


// Schritt für Schritt lösen, ohne die Lösung zu kennen: Antworten der Reihe nach antippen, bis „Weiter" erscheint
async function solveStepByTrying(page: Page) {
  const buttons = answers(page)
  const count = await buttons.count()
  for (let i = 0; i < count; i++) {
    if (await buttons.nth(i).isDisabled()) continue
    await buttons.nth(i).click()
    const next = page.getByRole('button', { name: /^(Weiter|Ergebnis ansehen)$/ })
    if (await next.waitFor({ state: 'visible', timeout: 1500 }).then(() => true, () => false)) {
      await next.click()
      return
    }
  }
}

test('Chemie: Moleküle, Lewis-Formeln als Bilder zur Auswahl, Gestalt mit Bild, Lernkarten', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-bindung')
  await page.getByRole('link', { name: /Moleküle/ }).click()
  await expect(page.getByRole('heading', { name: 'Moleküle' })).toBeVisible()
  // Lewis-Formel von H₂S (Grundlagen): Valenzelektronen, Paare, dann die Formel als Bild wählen
  await page.goto('./#/ueben/chem-molekuele/1-10003')
  await expect(answers(page).first()).toBeVisible()
  await solveStepByTrying(page)
  await solveStepByTrying(page)
  await expect(page.getByRole('heading', { name: /Welche Lewis-Formel/ })).toBeVisible()
  await expect(answers(page).locator('svg[role="img"]')).toHaveCount(await answers(page).count())
  await expectCleanPage(page, 'Lewis-Formeln zur Auswahl')
  await solveStepByTrying(page)
  await expect(page.getByTestId('result').getByTestId('chem-figure')).toBeVisible()
  // Gestalt von NH₃: die Lewis-Formel steht unter der ersten Frage, das räumliche Bild im Ergebnis
  await page.goto('./#/ueben/chem-molekuele/1-10008')
  await expect(page.getByTestId('chem-figure')).toBeVisible()
  await expectCleanPage(page, 'Gestalt mit Lewis-Formel')
  // Lernkarte mit drei räumlichen Bildern
  await page.goto('./#/karten/chem-molekuele/mol-gestalt')
  await expect(page.getByTestId('chem-figure')).toHaveCount(3)
  await expectCleanPage(page, 'Gestalt der Moleküle')
  expect(errors).toEqual([])
})

test('Chemie: Zwischenmolekulare Kräfte, Rechnung zur stärksten Kraft, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-bindung')
  await page.getByRole('link', { name: /Zwischenmolekulare Kräfte/ }).click()
  await expect(page.getByRole('heading', { name: 'Zwischenmolekulare Kräfte' })).toBeVisible()
  await page.goto('./#/ueben/chem-zmk/2-10000')
  await expect(answers(page).first()).toBeVisible()
  await expectCleanPage(page, 'Rechnung zu zwischenmolekularen Kräften')
  await page.goto('./#/karten/chem-zmk/zmk-siedepunkte')
  await expect(page.getByRole('heading', { name: 'Siedepunkte vergleichen' })).toBeVisible()
  await expectCleanPage(page, 'Siedepunkte vergleichen')
  expect(errors).toEqual([])
})

test('Chemie: Metallbindung und Hybridisierung, Rechnung und Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-bindung')
  await page.getByRole('link', { name: /Metallbindung und Hybridisierung/ }).click()
  await expect(page.getByRole('heading', { name: 'Metallbindung und Hybridisierung' })).toBeVisible()
  await page.goto('./#/ueben/chem-metalle/2-10000')
  await expect(answers(page).first()).toBeVisible()
  await expectCleanPage(page, 'Rechnung zu Metallen und Hybridisierung')
  await page.goto('./#/karten/chem-metalle/met-baender')
  await expect(page.getByRole('heading', { name: /Bändermodell/ })).toBeVisible()
  await expectCleanPage(page, 'Bändermodell')
  expect(errors).toEqual([])
})

test('Chemie: Klausuraufgabe 3 üben, Lewis-Formeln als Bilder, abgeben, Auswertung mit Punkten', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-bindung')
  await page.getByRole('link', { name: /Klausuraufgabe 3 üben/ }).click()
  await expect(page).toHaveURL(/#\/klausur\/chemie\/aufgabe\/3\/\d+$/)
  await page.goto('./#/klausur/chemie/aufgabe/3/7')
  await expect(page.getByRole('heading', { name: /Aufgabe 3/ })).toBeVisible()
  const items = page.getByTestId('exam-item')
  await expect(items).toHaveCount(12)
  // Teil b zeigt die Lewis-Formeln als Bilder
  await expect(items.nth(2).locator('svg[role="img"]').first()).toBeVisible()
  await expectCleanPage(page, 'Klausuraufgabe 3')
  // jeweils die erste Antwort wählen und abgeben
  for (let i = 0; i < 12; i++) await items.nth(i).getByRole('group', { name: 'Antworten' }).getByRole('button').first().click()
  await page.getByRole('button', { name: 'Abgeben' }).click()
  await expect(page.getByTestId('exam-score')).toHaveText(/^\d+(,5)? von 12 Punkten$/)
  await expectCleanPage(page, 'Auswertung Klausuraufgabe 3')
  expect(errors).toEqual([])
})

test('Chemie: Elektronen, Kästchenbilder als Antworten und Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-materie')
  await page.getByRole('link', { name: /Elektronen/ }).click()
  await expect(page.getByRole('heading', { name: 'Elektronen' })).toBeVisible()
  await page.goto('./#/ueben/chem-elektronen/1-10004')
  await expect(answers(page).first()).toBeVisible()
  await expectCleanPage(page, 'Rechnung zu Elektronen')
  await page.goto('./#/karten/chem-elektronen/el-hund')
  await expect(page.getByRole('heading', { name: /Hund/ })).toBeVisible()
  await expect(page.getByTestId('chem-figure')).toBeVisible()
  await expectCleanPage(page, 'Hund’sche Regel')
  expect(errors).toEqual([])
})

test('Chemie: Klausuraufgabe 1 üben, Wissensfragen und Rechnungen, abgeben, Auswertung mit Erklärungen', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-materie')
  await page.getByRole('link', { name: /Klausuraufgabe 1 üben/ }).click()
  await expect(page).toHaveURL(/#\/klausur\/chemie\/aufgabe\/1\/\d+$/)
  await page.goto('./#/klausur/chemie/aufgabe/1/7')
  await expect(page.getByRole('heading', { name: /Aufgabe 1/ })).toBeVisible()
  const items = page.getByTestId('exam-item')
  const count = await items.count()
  expect(count).toBeGreaterThanOrEqual(7)
  await expectCleanPage(page, 'Klausuraufgabe 1')
  // jeweils die letzte Antwort wählen und abgeben
  for (let i = 0; i < count; i++) await items.nth(i).getByRole('group', { name: 'Antworten' }).getByRole('button').last().click()
  await page.getByRole('button', { name: 'Abgeben' }).click()
  await expect(page.getByTestId('exam-score')).toHaveText(/^\d+(,5)? von 8 Punkten$/)
  await expectCleanPage(page, 'Auswertung Klausuraufgabe 1')
  expect(errors).toEqual([])
})

test('Chemie: Aufbau des Periodensystems, Rechnung mit Ausschnitt des Periodensystems und Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-periodensystem')
  await page.getByRole('link', { name: /Aufbau des Periodensystems/ }).click()
  await expect(page.getByRole('heading', { name: 'Aufbau des Periodensystems' })).toBeVisible()
  await page.goto('./#/ueben/chem-pse/2-10000')
  await expect(answers(page).first()).toBeVisible()
  await expectCleanPage(page, 'Rechnung zum Periodensystem')
  await page.goto('./#/karten/chem-pse/pse-bloecke')
  await expect(page.getByRole('heading', { name: /Blöcke/ })).toBeVisible()
  await expect(page.getByTestId('chem-figure')).toBeVisible()
  await expectCleanPage(page, 'Blöcke')
  expect(errors).toEqual([])
})

test('Chemie: Trends im Periodensystem, Rechnung mit Pfeilen im Periodensystem und Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-periodensystem')
  await page.getByRole('link', { name: /Trends im Periodensystem/ }).click()
  await expect(page.getByRole('heading', { name: 'Trends im Periodensystem' })).toBeVisible()
  await page.goto('./#/ueben/chem-trends/2-10000')
  await expect(answers(page).first()).toBeVisible()
  await expectCleanPage(page, 'Rechnung zu Trends')
  await page.goto('./#/karten/chem-trends/tr-atomradius')
  await expect(page.getByRole('heading', { name: 'Atomradius' })).toBeVisible()
  await expect(page.getByTestId('chem-figure')).toBeVisible()
  await expectCleanPage(page, 'Atomradius')
  expect(errors).toEqual([])
})

test('Chemie: Klausuraufgabe 2 üben, Periodensystem, abgeben, Auswertung mit Punkten', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-periodensystem')
  await page.getByRole('link', { name: /Klausuraufgabe 2 üben/ }).click()
  await expect(page).toHaveURL(/#\/klausur\/chemie\/aufgabe\/2\/\d+$/)
  await page.goto('./#/klausur/chemie/aufgabe/2/7')
  await expect(page.getByRole('heading', { name: /Aufgabe 2/ })).toBeVisible()
  const items = page.getByTestId('exam-item')
  const count = await items.count()
  expect(count).toBeGreaterThanOrEqual(5)
  await expectCleanPage(page, 'Klausuraufgabe 2')
  for (let i = 0; i < count; i++) await items.nth(i).getByRole('group', { name: 'Antworten' }).getByRole('button').first().click()
  await page.getByRole('button', { name: 'Abgeben' }).click()
  await expect(page.getByTestId('exam-score')).toHaveText(/^\d+(,5)? von 6 Punkten$/)
  await expectCleanPage(page, 'Auswertung Klausuraufgabe 2')
  expect(errors).toEqual([])
})

test('Chemie: Chemisches Gleichgewicht, Rechnung und Lernkarte mit Energiediagramm', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-gleichgewicht')
  await page.getByRole('link', { name: /Chemisches Gleichgewicht/ }).click()
  await expect(page.getByRole('heading', { name: 'Chemisches Gleichgewicht' })).toBeVisible()
  await page.goto('./#/ueben/chem-mwg/2-10000')
  await expect(answers(page).first()).toBeVisible()
  await expectCleanPage(page, 'Rechnung zum Gleichgewicht')
  await page.goto('./#/karten/chem-mwg/gg-katalysator')
  await expect(page.getByRole('heading', { name: 'Katalysator' })).toBeVisible()
  await expect(page.getByTestId('chem-figure')).toBeVisible()
  await expectCleanPage(page, 'Katalysator')
  expect(errors).toEqual([])
})

test('Chemie: Energie bei Reaktionen, Rechnung und Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-gleichgewicht')
  await page.getByRole('link', { name: /Energie bei Reaktionen/ }).click()
  await expect(page.getByRole('heading', { name: 'Energie bei Reaktionen' })).toBeVisible()
  await page.goto('./#/ueben/chem-energie/2-10000')
  await expect(answers(page).first()).toBeVisible()
  await expectCleanPage(page, 'Rechnung zur Energie')
  await page.goto('./#/karten/chem-energie/en-reaktionsenthalpie')
  await expect(page.getByRole('heading', { name: 'Reaktionsenthalpie aus Bildungsenthalpien' })).toBeVisible()
  await expectCleanPage(page, 'Reaktionsenthalpie')
  expect(errors).toEqual([])
})

test('Chemie: Klausuraufgabe 5 üben, Gleichgewicht und Energie, abgeben, Auswertung mit Punkten', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/gebiet/chem-gleichgewicht')
  await page.getByRole('link', { name: /Klausuraufgabe 5 üben/ }).click()
  await expect(page).toHaveURL(/#\/klausur\/chemie\/aufgabe\/5\/\d+$/)
  await page.goto('./#/klausur/chemie/aufgabe/5/7')
  await expect(page.getByRole('heading', { name: /Aufgabe 5/ })).toBeVisible()
  const items = page.getByTestId('exam-item')
  const count = await items.count()
  expect(count).toBeGreaterThanOrEqual(6)
  await expectCleanPage(page, 'Klausuraufgabe 5')
  for (let i = 0; i < count; i++) await items.nth(i).getByRole('group', { name: 'Antworten' }).getByRole('button').first().click()
  await page.getByRole('button', { name: 'Abgeben' }).click()
  await expect(page.getByTestId('exam-score')).toHaveText(/^\d+(,5)? von 10 Punkten$/)
  await expectCleanPage(page, 'Auswertung Klausuraufgabe 5')
  expect(errors).toEqual([])
})
