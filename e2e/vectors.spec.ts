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
  await expect(page.getByRole('checkbox', { name: 'Skalarprodukt und Winkel', exact: true })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Projektion und Zerlegung', exact: true })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Kräfte', exact: true })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Kreuzprodukt und Fläche', exact: true })).toBeChecked()
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

// M7 Schritt 2: Skalarprodukt und Winkel
test('Skalarprodukt: jede Stufe lässt sich lösen, Bild mit Winkelbogen, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/vektoren/skalar.${level}-${20 + level}`)
    await solveWholeTask(page)
    await expectCleanPage(page, `Skalarprodukt Stufe ${level}`)
  }
  // Winkel im Raum: Ergebnis mit Bild und Winkelbogen
  await page.goto('./#/ueben/vektoren/skalar.2-3')
  await solveWholeTask(page)
  const figure = page.getByTestId('result').getByTestId('vector-figure')
  await expect(figure.locator('svg path').first()).toBeVisible()
  await page.goto('./#/karten/vektoren/vec-winkel')
  await expect(page.getByRole('heading', { name: 'Winkel zwischen Vektoren' })).toBeVisible()
  await expect(page.getByTestId('vector-figure').first()).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Winkel')
  expect(errors).toEqual([])
})

test('Frei: Skalarprodukt und Art des Winkels zum Antippen', async ({ page }) => {
  const errors = collectErrors(page)
  // p = (3, 5), q = (−3, 2): p · q = 1, spitz
  await page.goto('./#/frei/vektoren/skalar.1-3')
  await expect(page.getByRole('radiogroup', { name: 'Der Winkel ist' })).toBeVisible()
  await expectCleanPage(page, 'Art frei leer')
  await typeInto(page, 'Dein Ergebnis von Teil 1', '1')
  await page.getByRole('radio', { name: 'stumpf' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Spitz und stumpf verwechselt.')).toBeVisible()
  await expect(page.locator('[data-testid="entry-choice"][data-marked]')).toHaveCount(1)
  await page.getByRole('radio', { name: 'spitz' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Art frei gelöst')
  expect(errors).toEqual([])
})

test('Frei: Ungleichung mit Zeichen und Winkel in Grad', async ({ page }) => {
  const errors = collectErrors(page)
  // p = (−2, 4, 1), q = (3t + 2, 4, 1): Lösung t < 13/6 (die frühere Nummer 4-10 ist seit Schritt 2b eine Zieh-Aufgabe)
  await page.goto('./#/frei/vektoren/skalar.4-69')
  await page.getByRole('radio', { name: 'größer als' }).click()
  await typeInto(page, 'Dein Ergebnis', '13/6')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Ungleichung falsch umgedreht.')).toBeVisible()
  await page.getByRole('radio', { name: 'kleiner als' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Ungleichung frei')
  // Winkel 30° zwischen (1, 1, −2) und (2, 0, −2)
  await page.goto('./#/frei/vektoren/skalar.2-3')
  await typeInto(page, 'Dein Ergebnis', '30')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Winkel frei')
  expect(errors).toEqual([])
})

// M7 Schritt 2b: Pfeil ziehen (skalar.1-14: p = (−3, 2), q senkrecht dazu ziehen)
test('Pfeil ziehen: Prüfen ohne Ziehen zählt nicht, typischer Fehler, dann richtig mit den Knöpfen', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/ueben/vektoren/skalar.1-14')
  await expect(page.getByTestId('drag-surface')).toBeVisible()
  await expectCleanPage(page, 'Ziehen leer')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('So geht es nicht.')).toBeVisible()
  // parallel ziehen: q = p (im Bild auf die Spitze von p tippen)
  const surface = page.getByTestId('drag-surface')
  const box = (await surface.boundingBox())!
  // Ausschnitt −5,6 bis 5,6: die Stelle (−3 | 2) liegt bei (2,6 / 11,2; 3,6 / 11,2)
  await page.mouse.click(box.x + (box.width * 2.6) / 11.2, box.y + (box.height * 3.6) / 11.2)
  await expect(page.getByLabel('1. Eintrag', { exact: true })).toHaveValue('−3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Senkrecht falsch erkannt')).toBeVisible()
  // mit den Knöpfen: q = (2, 3)
  await page.getByLabel('1. Eintrag', { exact: true }).fill('2')
  await page.getByLabel('2. Eintrag', { exact: true }).fill('3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expect(page.getByLabel('1. Eintrag', { exact: true })).toBeDisabled()
  await expectCleanPage(page, 'Ziehen gelöst')
  await page.getByRole('button', { name: 'Ergebnis ansehen' }).click()
  await expect(page.getByRole('heading', { name: 'Geschafft!' })).toBeVisible()
  // jede Stufe einmal: Lösung zeigen und weiter
  for (const [level, s] of [[2, 36], [3, 19], [4, 10], [5, 5]]) {
    await page.goto(`./#/ueben/vektoren/skalar.${level}-${s}`)
    await page.getByLabel(/um 1 größer/).first().click()
    await page.getByRole('button', { name: 'Prüfen' }).click()
    await expect(page.getByText(/^(Richtig!|Nicht ganz\. Versuch es noch einmal\.|So geht es nicht\.)$/)).toBeVisible()
    await expectCleanPage(page, `Ziehen Stufe ${level}`)
  }
  // frei: dieselbe Aufgabe, Stelle im Bild statt Kästchen
  await page.goto('./#/frei/vektoren/skalar.1-14')
  await page.getByLabel('1. Eintrag', { exact: true }).fill('-2')
  await page.getByLabel('2. Eintrag', { exact: true }).fill('-3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Ziehen frei')
  expect(errors).toEqual([])
})

// M7 Schritt 3a: Projektion und Zerlegung
test('Projektion: jede Stufe lässt sich lösen, „Licht an“ und typischer Fehler im Bild, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/vektoren/projektion.${level}-${30 + level}`)
    await solveWholeTask(page)
    await expectCleanPage(page, `Projektion Stufe ${level}`)
  }
  // projektion.1-10: p = (4, 2), q = (−2, 2), Schatten (1, −1); im Bild der rote Schatten beim Teilen durch |q|
  await page.goto('./#/ueben/vektoren/projektion.1-10')
  await solveWholeTask(page)
  const figure = page.getByTestId('result').getByTestId('vector-figure')
  await figure.getByRole('button', { name: 'Licht an' }).click()
  const mistake = figure.getByRole('button', { name: 'Typischen Fehler zeigen' })
  await mistake.click()
  await expect(figure.getByRole('button', { name: 'Fehler ausblenden' })).toHaveAttribute('aria-pressed', 'true')
  await expect(figure.getByText(/^Rot: der Schatten/)).toBeVisible()
  await expectCleanPage(page, 'Projektion mit Fehler im Bild')
  await page.goto('./#/karten/vektoren/vec-projektion')
  await expect(page.getByRole('heading', { name: 'Projektion: der Schatten eines Vektors' })).toBeVisible()
  await expect(page.getByTestId('vector-figure').first()).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Projektion')
  expect(errors).toEqual([])
})

test('Frei: Schatten als Spalte, Projektion auf den falschen Vektor wird erkannt', async ({ page }) => {
  const errors = collectErrors(page)
  // projektion.1-9: a = (1, −3), b = (3, 3), Schatten (−1, −1); auf a projiziert: (−3/5, 9/5)
  await page.goto('./#/frei/vektoren/projektion.1-9')
  await typeInto(page, '1. Eintrag', '-3/5')
  await typeInto(page, '2. Eintrag', '9/5')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Auf den falschen Vektor projiziert.')).toBeVisible()
  await typeInto(page, '1. Eintrag', '-1')
  await typeInto(page, '2. Eintrag', '-1')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Projektion frei')
  expect(errors).toEqual([])
})

// M7 Schritt 3b: Kräfte
test('Kräfte: jede Stufe lässt sich lösen, Bild zum Ergebnis, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/vektoren/kraefte.${level}-${40 + level}`)
    await solveWholeTask(page)
    await expect(page.getByTestId('result').getByTestId('vector-figure')).toBeVisible()
    await expectCleanPage(page, `Kräfte Stufe ${level}`)
  }
  await page.goto('./#/karten/vektoren/vec-kraft')
  await expect(page.getByRole('heading', { name: 'Kraft zerlegen und zusammensetzen' })).toBeVisible()
  await expect(page.getByTestId('vector-figure').first()).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Kräfte')
  expect(errors).toEqual([])
})

test('Frei: Komponenten mit Einheit N, Sinus und Kosinus vertauscht wird erkannt', async ({ page }) => {
  const errors = collectErrors(page)
  // kraefte.1-10: F_S = 50 N, β = 30° zur y-Achse; F_Sx = 25 N, F_Sy = 25√3 N; vertauscht: F_Sy = 25 N
  await page.goto('./#/frei/vektoren/kraefte.1-10')
  await expect(page.getByText('N', { exact: true }).first()).toBeVisible()
  await typeInto(page, 'Dein Ergebnis von Teil 1', '25')
  await typeInto(page, 'Dein Ergebnis von Teil 2', '25')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Sinus und Kosinus vertauscht.')).toBeVisible()
  await typeInto(page, 'Dein Ergebnis von Teil 2', '25sqrt3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Kräfte frei')
  expect(errors).toEqual([])
})

// M7 Schritt 4a: Kreuzprodukt und Fläche
test('Kreuzprodukt: jede Stufe lässt sich lösen, Bild zum Ergebnis, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/vektoren/kreuz.${level}-${50 + level}`)
    await solveWholeTask(page)
    await expect(page.getByTestId('result').getByTestId('vector-figure')).toBeVisible()
    await expectCleanPage(page, `Kreuzprodukt Stufe ${level}`)
  }
  await page.goto('./#/karten/vektoren/vec-kreuz')
  await expect(page.getByRole('heading', { name: 'Kreuzprodukt mit dem Schema' })).toBeVisible()
  await expect(page.getByTestId('vector-figure').first()).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Kreuzprodukt')
  expect(errors).toEqual([])
})

test('Frei: zwei Normalen in beliebiger Reihenfolge, zweite vergessen wird erkannt', async ({ page }) => {
  const errors = collectErrors(page)
  // kreuz.4-3: Länge 18 senkrecht auf a und b; n_1 = (6, 12, 12), n_2 = (−6, −12, −12)
  await page.goto('./#/frei/vektoren/kreuz.4-3')
  await typeInto(page, '1. Eintrag von Teil 1', '-6')
  await typeInto(page, '2. Eintrag von Teil 1', '-12')
  await typeInto(page, '3. Eintrag von Teil 1', '-12')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Zweite Lösung vergessen.')).toBeVisible()
  await typeInto(page, '1. Eintrag von Teil 2', '6')
  await typeInto(page, '2. Eintrag von Teil 2', '12')
  await typeInto(page, '3. Eintrag von Teil 2', '12')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Kreuzprodukt frei')
  expect(errors).toEqual([])
})
