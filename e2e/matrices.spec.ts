import { type Page, expect, test } from '@playwright/test'

// Matrizen und Gleichungssysteme (M7 Schritt 8a): Kachel auf der Mathe-Seite, Seite der Tätigkeit mit dem Baustein
// „Matrizen rechnen“, je Stufe eine Aufgabe geführt lösen, Bild bei Matrix mal Vektor, Lernkarte, freier Modus mit
// einer Matrix in Kästchen (falscher Eintrag markiert, typischer Fehler erkannt)

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

test('Mathe-Seite zeigt die Kachel „Matrizen und Gleichungssysteme“, die Seite der Tätigkeit hat den Baustein', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/fach/mathe')
  await page.getByRole('link', { name: /Matrizen und Gleichungssysteme/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Matrizen und Gleichungssysteme', level: 1 })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Matrizen rechnen', exact: true })).toBeChecked()
  await expect(page.getByTestId('example').locator('.katex').first()).toBeVisible()
  await expectCleanPage(page, 'Tätigkeit Matrizen')
  expect(errors).toEqual([])
})

test('Matrizen: jede Stufe lässt sich lösen, Bild bei Matrix mal Vektor, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/matrizen/matrix.${level}-${60 + level}`)
    await solveWholeTask(page)
    await expectCleanPage(page, `Matrizen Stufe ${level}`)
  }
  // matrix.2-1: Matrix mal Vektor mit Bild (Einheitsquadrat wird zum Parallelogramm)
  await page.goto('./#/ueben/matrizen/matrix.2-1')
  await expect(page.getByTestId('vector-figure').first()).toBeVisible()
  await solveWholeTask(page)
  await expect(page.getByTestId('result').getByTestId('vector-figure')).toBeVisible()
  await expectCleanPage(page, 'Matrix mal Vektor')
  await page.goto('./#/karten/matrizen/mat-produkt')
  await expect(page.getByRole('heading', { name: 'Produkt mit dem Falk-Schema' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Produkt')
  expect(errors).toEqual([])
})

// M7 Schritt 8b: Falk-Schema als Bild. Vor der Antwort leer mit „?“ und ohne Knopf, danach „Abspielen“: Zeile und Spalte
// leuchten auf, die Rechnung wächst, der Eintrag erscheint; „Alles zeigen“ springt ans Ende. Auch auf der Lernkarte.
async function solveStep(page: Page) {
  const count = await answers(page).count()
  for (let i = 0; i < count; i++) {
    const button = answers(page).nth(i)
    if (await button.isDisabled()) continue
    await button.click()
    await correctFeedback(page).or(wrongFeedback(page)).waitFor()
    if (await correctFeedback(page).isVisible()) return
  }
}

test('Falk-Schema: erst nach der Antwort abspielen, Eintrag für Eintrag, auch auf der Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  // matrix.3-4: AB mit zwei 3 × 3-Matrizen, zuerst ein Eintrag, dann das ganze Produkt
  await page.goto('./#/ueben/matrizen/matrix.3-4')
  const scheme = page.getByTestId('falk-scheme')
  await expect(scheme).toBeVisible()
  await expect(scheme.locator('[data-falk="product"] .katex-html').filter({ hasText: '?' })).toHaveCount(1)
  await expect(scheme.getByRole('button', { name: 'Abspielen' })).toHaveCount(0)
  await solveStep(page)
  await scheme.getByRole('button', { name: 'Abspielen' }).click()
  await expect(scheme.getByRole('button', { name: 'Alles zeigen' })).toBeVisible()
  await expect(scheme.locator('.bg-accent-100').first()).toBeVisible()
  await expect(scheme.getByRole('button', { name: 'Abspielen' })).toBeVisible({ timeout: 8000 })
  await expect(scheme.locator('figcaption .katex').first()).toContainText('=')
  await expectCleanPage(page, 'Falk-Schema Eintrag')
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.getByTestId('falk-scheme')).toBeVisible()
  await solveStep(page)
  await page.getByTestId('falk-scheme').getByRole('button', { name: 'Abspielen' }).click()
  await page.getByTestId('falk-scheme').getByRole('button', { name: 'Alles zeigen' }).click()
  await expect(page.getByTestId('falk-scheme').locator('[data-falk="product"] .katex')).toHaveCount(9)
  await expectCleanPage(page, 'Falk-Schema Produkt')
  // Bewegung reduzieren: Der Knopf zeigt gleich das Ende
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./#/karten/matrizen/mat-produkt')
  const onCard = page.getByTestId('falk-scheme').first()
  await expect(onCard).toBeVisible()
  await onCard.getByRole('button', { name: 'Abspielen' }).click()
  await expect(onCard.getByRole('button', { name: 'Abspielen' })).toBeVisible()
  await expect(onCard.getByRole('button', { name: 'Alles zeigen' })).toHaveCount(0)
  await expect(onCard.locator('figcaption .katex').first()).toBeVisible()
  await expectCleanPage(page, 'Lernkarte mit Falk-Schema')
  expect(errors).toEqual([])
})

test('Frei: Matrix in Kästchen, falscher Eintrag markiert, typischer Fehler beim Transponieren erkannt', async ({ page }) => {
  const errors = collectErrors(page)
  // matrix.1-1: P = (−3 −2 −2 | 5 0 −2), Pᵀ = (−3 5 | −2 0 | −2 −2)
  await page.goto('./#/frei/matrizen/matrix.1-1')
  const fill = async (rows: readonly (readonly string[])[]) => {
    for (const [i, row] of rows.entries()) for (const [j, x] of row.entries()) await typeInto(page, `Zeile ${i + 1}, Spalte ${j + 1}`, x)
  }
  // nur ins neue Format umgefüllt
  await fill([
    ['-3', '-2'],
    ['-2', '5'],
    ['0', '-2'],
  ])
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Einträge nur ins neue Format umgefüllt.')).toBeVisible()
  // ein Eintrag falsch: nur dieser markiert
  await fill([
    ['-3', '5'],
    ['-2', '0'],
    ['-2', '2'],
  ])
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.locator('[data-testid="entry"][data-marked="true"]')).toHaveCount(1)
  await typeInto(page, 'Zeile 3, Spalte 2', '-2')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Matrix frei')
  expect(errors).toEqual([])
})

// Determinanten (M7 Schritt 9a): Baustein auf der Seite der Tätigkeit, je Stufe eine Aufgabe, Fläche als Bild,
// Lernkarte, freier Modus mit Betrag vergessen und zwei Lösungen in beliebiger Reihenfolge
test('Determinanten: Baustein, jede Stufe lösbar, Bild der Fläche, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/thema/matrizen')
  await expect(page.getByRole('checkbox', { name: 'Determinanten', exact: true })).toBeChecked()
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/matrizen/determinante.${level}-${70 + level}`)
    await solveWholeTask(page)
    await expectCleanPage(page, `Determinanten Stufe ${level}`)
  }
  // determinante.1-2: 2 × 2 mit Fläche, beim Ergebnis wird das Einheitsquadrat zum Parallelogramm
  await page.goto('./#/ueben/matrizen/determinante.1-2')
  await solveWholeTask(page)
  await expect(page.getByTestId('result').getByTestId('vector-figure')).toBeVisible()
  await page.goto('./#/karten/matrizen/det-entwickeln')
  await expect(page.getByRole('heading', { name: 'Entwickeln mit dem Schachbrett' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Entwickeln')
  expect(errors).toEqual([])
})

test('Determinanten frei: Betrag vergessen erkannt, Lösungen in beliebiger Reihenfolge', async ({ page }) => {
  const errors = collectErrors(page)
  // determinante.1-2: B = (1 2 | 5 −4), det B = −14, F = 14
  await page.goto('./#/frei/matrizen/determinante.1-2')
  await typeInto(page, 'Dein Ergebnis von Teil 1', '-14')
  await typeInto(page, 'Dein Ergebnis von Teil 2', '-14')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Betrag vergessen (Fläche oder Volumen negativ).')).toBeVisible()
  await typeInto(page, 'Dein Ergebnis von Teil 2', '14')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  // determinante.4-2: nicht invertierbar für a = −3 und a = −2
  await page.goto('./#/frei/matrizen/determinante.4-2')
  await typeInto(page, '1. Lösung', '-2')
  await typeInto(page, '2. Lösung', '-3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Determinanten frei')
  expect(errors).toEqual([])
})

// M7 Schritt 9b: Sarrus als Bild. Vor der Antwort nur das Schema ohne Knopf, danach „Abspielen“: erst leuchten die
// abgeschriebenen Spalten, dann je Diagonale drei Felder, die Rechnung wächst; „Alles zeigen“ springt ans Ende. Auch
// auf der Lernkarte und beim Spatprodukt.
test('Sarrus: erst nach der Antwort abspielen, Diagonale für Diagonale, auch auf der Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  // determinante.1-1: 3 × 3 mit Sarrus
  await page.goto('./#/ueben/matrizen/determinante.1-1')
  const scheme = page.getByTestId('sarrus-scheme')
  await expect(scheme).toBeVisible()
  await expect(scheme.locator('[data-sarrus="copy"]')).toHaveCount(6)
  await expect(scheme.getByRole('button', { name: 'Abspielen' })).toHaveCount(0)
  await solveStep(page)
  await scheme.getByRole('button', { name: 'Abspielen' }).click()
  await expect(scheme.getByRole('button', { name: 'Alles zeigen' })).toBeVisible()
  await expect(scheme.locator('[data-sarrus="copy"][data-lit="true"]')).toHaveCount(6)
  await expect(scheme.locator('[data-lit="true"]')).toHaveCount(3)
  await expect(scheme.getByText('nach links unten: Minus')).toBeVisible()
  await expect(scheme.getByRole('button', { name: 'Abspielen' })).toBeVisible({ timeout: 10000 })
  await expect(scheme.locator('figcaption .katex')).toHaveCount(1)
  await expectCleanPage(page, 'Sarrus')
  // Spatprodukt mit Sarrus (Vektoren)
  await page.goto('./#/ueben/vektoren/spat.2-1')
  await expect(page.getByTestId('sarrus-scheme')).toBeVisible()
  // Bewegung reduzieren: Der Knopf zeigt gleich das Ende
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./#/karten/matrizen/det-sarrus')
  const onCard = page.getByTestId('sarrus-scheme').first()
  await expect(onCard).toBeVisible()
  await onCard.getByRole('button', { name: 'Abspielen' }).click()
  await expect(onCard.getByRole('button', { name: 'Alles zeigen' })).toHaveCount(0)
  await expect(onCard.locator('figcaption .katex')).toHaveCount(1)
  await expectCleanPage(page, 'Lernkarte mit Sarrus')
  expect(errors).toEqual([])
})

// Gauß-Verfahren (M7 Schritt 10a): Baustein auf der Seite der Tätigkeit, je Stufe eine Aufgabe, Lernkarte, freier Modus
// mit „keine Lösung“ als Auswahl und einer Lösungsmenge mit Parameter (andere Darstellung derselben Geraden zählt)
test('Gauß-Verfahren: Baustein, jede Stufe lösbar, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/thema/matrizen')
  await expect(page.getByRole('checkbox', { name: 'Gauß-Verfahren', exact: true })).toBeChecked()
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/matrizen/gauss.${level}-${80 + level}`)
    await solveWholeTask(page)
    await expectCleanPage(page, `Gauß Stufe ${level}`)
  }
  await page.goto('./#/karten/matrizen/gauss-faelle')
  await expect(page.getByRole('heading', { name: 'Eine, keine oder unendlich viele Lösungen' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Gauß')
  expect(errors).toEqual([])
})

test('Gauß-Verfahren frei: keine Lösung als Auswahl, Lösungsmenge mit Parameter', async ({ page }) => {
  const errors = collectErrors(page)
  // gauss.1-1: zwei parallele Geraden, keine Lösung
  await page.goto('./#/frei/matrizen/gauss.1-1')
  await page.getByRole('radio', { name: 'unendlich viele Lösungen' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Widerspruch mit einer Nullzeile verwechselt.')).toBeVisible()
  await page.getByRole('radio', { name: 'keine Lösung' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  // gauss.1-12: L: x = (4, 0) + t (−1, 1); anderer Stützpunkt (3, 1) und Richtung (1, −1) ist dieselbe Gerade
  await page.goto('./#/frei/matrizen/gauss.1-12')
  await typeInto(page, '1. Eintrag des Stützvektors', '3')
  await typeInto(page, '2. Eintrag des Stützvektors', '1')
  await typeInto(page, '1. Eintrag des Richtungsvektors', '1')
  await typeInto(page, '2. Eintrag des Richtungsvektors', '-1')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Gauß frei')
  expect(errors).toEqual([])
})

// Gauß-Verfahren mit Bildern (M7 Schritt 10b): vor der Antwort kein Bild, danach die Geraden mit „Abspielen“ und dem
// typischen Fehler „rechte Seite vergessen“ (rot); im Raum Ebenen; beim Ergebnis der Schnittpunkt; im freien Modus das
// Bild zum Ergebnis in der Rückmeldung
test('Gauß-Verfahren: Geraden und Ebenen als Bild nach der Antwort und beim Ergebnis', async ({ page }) => {
  const errors = collectErrors(page)
  const figure = page.getByTestId('vector-figure')
  // gauss.1-81: zwei Geraden, erster Schritt „Spalte 1: Nullen erzeugen“
  await page.goto('./#/ueben/matrizen/gauss.1-81')
  await expect(page.locator('#question')).toBeVisible()
  await expect(figure).toHaveCount(0)
  const count = await answers(page).count()
  for (let i = 0; i < count; i++) {
    await answers(page).nth(i).click()
    await correctFeedback(page).or(wrongFeedback(page)).waitFor()
    if (await correctFeedback(page).isVisible()) break
  }
  await expect(figure).toBeVisible()
  await expect(figure).toContainText('dreht Gerade II um ihren Schnittpunkt')
  await page.getByRole('button', { name: 'Abspielen' }).click()
  await page.getByRole('button', { name: 'Typischen Fehler zeigen' }).click()
  await expect(figure).toContainText('Rechte Seite nicht mitgerechnet')
  await expectCleanPage(page, 'Gauß Bild Gerade')
  await page.goto('./#/ueben/matrizen/gauss.1-81')
  await solveWholeTask(page)
  await expect(figure).toContainText('schneiden sich in genau einem Punkt')
  // gauss.2-3: drei Ebenen, Bild beim Ergebnis
  await page.goto('./#/ueben/matrizen/gauss.2-3')
  await solveWholeTask(page)
  await expect(figure).toContainText('Alle drei Ebenen gehen durch genau einen Punkt')
  await expectCleanPage(page, 'Gauß Bild Ebenen')
  // frei: keine Lösung, Bild in der Rückmeldung
  await page.goto('./#/frei/matrizen/gauss.1-1')
  await expect(figure).toHaveCount(0)
  await page.getByRole('radio', { name: 'keine Lösung' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(figure).toContainText('parallel und verschieden')
  expect(errors).toEqual([])
})

// Cramersche Regel (M7 Schritt 11a): Baustein auf der Seite der Tätigkeit, je Stufe eine Aufgabe, Lernkarte, freier Modus
// mit Parameter (Vorzeichenfehler beim Auflösen erkannt)
test('Cramersche Regel: Baustein, jede Stufe lösbar, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/thema/matrizen')
  await expect(page.getByRole('checkbox', { name: 'Cramersche Regel', exact: true })).toBeChecked()
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/matrizen/cramer.${level}-${80 + level}`)
    await solveWholeTask(page)
    await expectCleanPage(page, `Cramer Stufe ${level}`)
  }
  await page.goto('./#/karten/matrizen/cramer-parameter')
  await expect(page.getByRole('heading', { name: 'Cramersche Regel mit Parameter' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Cramer')
  expect(errors).toEqual([])
})

test('Cramersche Regel frei: Wert für a, Vorzeichenfehler erkannt', async ({ page }) => {
  const errors = collectErrors(page)
  // cramer.4-1: genau eine Lösung mit dem vorgegebenen Wert für a = 3
  await page.goto('./#/frei/matrizen/cramer.4-1')
  await typeInto(page, 'Dein Ergebnis', '-3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Vorzeichenfehler beim Auflösen nach a.')).toBeVisible()
  await typeInto(page, 'Dein Ergebnis', '3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Cramer frei')
  expect(errors).toEqual([])
})

// Einsetzen, Gleichsetzen, Addieren (M7 Schritt 10c): Baustein auf der Seite der Tätigkeit, je Stufe eine Aufgabe, Bild nach
// dem Addieren, Lernkarte, freier Modus (Vorzeichenfehler beim Einsetzen erkannt)
test('Einsetzen, Gleichsetzen, Addieren: Baustein, jede Stufe lösbar, Bild, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/thema/matrizen')
  await expect(page.getByRole('checkbox', { name: 'Einsetzen, Gleichsetzen, Addieren', exact: true })).toBeChecked()
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/matrizen/einsetzen.${level}-${80 + level}`)
    await solveWholeTask(page)
    await expectCleanPage(page, `Schulverfahren Stufe ${level}`)
  }
  await page.goto('./#/karten/matrizen/eqs-addieren')
  await expect(page.getByRole('heading', { name: 'Additionsverfahren' })).toBeVisible()
  await expect(page.locator('svg').first()).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Addieren')
  expect(errors).toEqual([])
})

test('Einsetzen, Gleichsetzen, Addieren frei: Vorzeichenfehler beim Einsetzen erkannt', async ({ page }) => {
  const errors = collectErrors(page)
  // einsetzen.1-1: Gleichsetzen, Lösung x = -3, y = 4
  await page.goto('./#/frei/matrizen/einsetzen.1-1')
  await typeInto(page, 'Dein Ergebnis von Teil 1', '5')
  await typeInto(page, 'Dein Ergebnis von Teil 2', '4')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Vorzeichen beim Einsetzen verloren.')).toBeVisible()
  await typeInto(page, 'Dein Ergebnis von Teil 1', '-3')
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Schulverfahren frei')
  expect(errors).toEqual([])
})

// Gleichungssysteme mit Parameter (M7 Schritt 11b): Baustein auf der Seite der Tätigkeit, je Stufe eine Aufgabe, Lernkarte,
// freier Modus (Vorzeichen der Nullstelle erkannt)
test('Gleichungssysteme mit Parameter: Baustein, jede Stufe lösbar, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/thema/matrizen')
  await expect(page.getByRole('checkbox', { name: 'Gleichungssysteme mit Parameter', exact: true })).toBeChecked()
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/matrizen/lgsparam.${level}-${80 + level}`)
    await solveWholeTask(page)
    await expectCleanPage(page, `Parameter Stufe ${level}`)
  }
  await page.goto('./#/karten/matrizen/lgsp-rang')
  await expect(page.getByRole('heading', { name: 'Rang und Lösbarkeit' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Rang')
  expect(errors).toEqual([])
})

test('Gleichungssysteme mit Parameter frei: Sonderwert und was dort gilt, Fehler beim Deuten erkannt', async ({ page }) => {
  const errors = collectErrors(page)
  // lgsparam.1-1: Sonderwert a = 3, dort keine Lösung
  await page.goto('./#/frei/matrizen/lgsparam.1-1')
  await typeInto(page, 'Dein Ergebnis von Teil 1', '3')
  await page.getByRole('radio', { name: 'unendlich viele Lösungen' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Widerspruch mit einer Nullzeile verwechselt.')).toBeVisible()
  await page.getByRole('radio', { name: 'keine Lösung' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Parameter frei')
  expect(errors).toEqual([])
})

// Bilder mit Parameter (M7 Schritt 11c): Schieberegler beim Ergebnis (auch im freien Modus), Knopf zum Sonderwert;
// Cramer als Flächen auf der Lernkarte
test('Schieberegler für den Parameter und Cramer als Flächen', async ({ page }) => {
  const errors = collectErrors(page)
  // lgsparam.1-1: Sonderwert a = 3, dort keine Lösung
  await page.goto('./#/frei/matrizen/lgsparam.1-1')
  await typeInto(page, 'Dein Ergebnis von Teil 1', '3')
  await page.getByRole('radio', { name: 'keine Lösung' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  const slider = page.getByRole('slider', { name: 'Wert von a' })
  await expect(slider).toHaveAttribute('aria-valuetext', 'a gleich 3')
  const figure = page.getByTestId('vector-figure')
  await expect(figure).toContainText('parallel und verschieden')
  await slider.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(slider).toHaveAttribute('aria-valuetext', 'a gleich 2,75')
  await expect(figure).toContainText('genau eine Lösung')
  const special = page.getByTestId('param-slider').getByRole('button')
  await expect(special).toHaveAttribute('aria-pressed', 'false')
  await special.click()
  await expect(special).toHaveAttribute('aria-pressed', 'true')
  await expect(slider).toHaveAttribute('aria-valuetext', 'a gleich 3')
  await expectCleanPage(page, 'Schieberegler')
  await page.goto('./#/karten/matrizen/cramer-regel')
  await page.getByRole('button', { name: 'Strecken und Scheren' }).click()
  await expect(page.getByTestId('vector-figure').first()).toContainText('Scheren')
  await expectCleanPage(page, 'Cramer als Flächen')
  expect(errors).toEqual([])
})

// Inverse Matrix (M7 Schritt 12a): Baustein auf der Seite der Tätigkeit, je Stufe eine Aufgabe, Bild „Rückgängig machen“,
// Lernkarte, freier Modus (nicht durch det A geteilt erkannt, „nicht invertierbar“ zum Antippen)
test('Inverse Matrix: Baustein, jede Stufe lösbar, Bild, Lernkarte', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('./#/thema/matrizen')
  await expect(page.getByRole('checkbox', { name: 'Inverse Matrix', exact: true })).toBeChecked()
  for (const level of [1, 2, 3, 4, 5]) {
    await page.goto(`./#/ueben/matrizen/inverse.${level}-${80 + level}`)
    await solveWholeTask(page)
    await expectCleanPage(page, `Inverse Stufe ${level}`)
  }
  // inverse.1-1: 2 × 2 mit Bild beim Ergebnis
  await page.goto('./#/ueben/matrizen/inverse.1-1')
  await solveWholeTask(page)
  await expect(page.getByRole('button', { name: 'Rückgängig machen' })).toBeVisible()
  await page.goto('./#/karten/matrizen/inv-gauss-jordan')
  await expect(page.getByRole('heading', { name: 'Inverse mit Gauß-Jordan' })).toBeVisible()
  await expectCleanPage(page, 'Lernkarte Gauß-Jordan')
  expect(errors).toEqual([])
})

test('Inverse Matrix frei: nicht geteilt erkannt, nicht invertierbar zum Antippen', async ({ page }) => {
  const errors = collectErrors(page)
  // inverse.1-1: M = (-1 2; -4 6), M⁻¹ = (3 -1; 2 -1/2)
  await page.goto('./#/frei/matrizen/inverse.1-1')
  const fill = async (xs: readonly string[]) => {
    for (const [k, x] of xs.entries()) await typeInto(page, `Zeile ${Math.floor(k / 2) + 1}, Spalte ${(k % 2) + 1}`, x)
  }
  await fill(['6', '-2', '4', '-1'])
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Typischer Fehler: Nicht durch det A geteilt.')).toBeVisible()
  await fill(['3', '-1', '2', '-1/2'])
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  await expectCleanPage(page, 'Inverse frei')
  // inverse.2-4: nicht invertierbar
  await page.goto('./#/frei/matrizen/inverse.2-4')
  await page.getByRole('radio', { name: 'nicht invertierbar' }).click()
  await page.getByRole('button', { name: 'Prüfen' }).click()
  await expect(page.getByText('Richtig!', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
