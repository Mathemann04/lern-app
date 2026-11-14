import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { RichText } from './RichText.tsx'

// Formeln hier als <i>…</i> statt mit KaTeX, damit sich der Aufbau leicht lesen lässt
vi.mock('./Formula.tsx', () => ({ Formula: ({ tex }: { tex: string }) => createElement('i', null, tex) }))

// Aufbau eines Textes: Textstücke zwischen | (ganz an eine Formel gebundener Text bleibt als leeres
// Stück || zurück), Formeln als <i>, Stücke ohne Umbruch in [ ]
function layout(text: string): string {
  return renderToStaticMarkup(createElement(RichText, { text, inline: true }))
    .replace(/^<span class="">|<\/span>$/g, '')
    .replace(/<span class="whitespace-nowrap">((?:(?!<\/span>).)*)<\/span>/g, '[$1]')
    .replace(/<\/?span>/g, '|')
}

describe('RichText: Formeln mit Satzzeichen und Klammern', () => {
  it('hält eine kurze Formel mit Satzzeichen dahinter zusammen', () => {
    expect(layout(String.raw`Wie viele Neutronen hat $\ce{^{14}_{6}C}$?`)).toBe(String.raw`|Wie viele Neutronen hat |[<i>\ce{^{14}_{6}C}</i>?]||`)
  })

  it('hält eine öffnende Klammer oder ein Anführungszeichen direkt davor mit der Formel zusammen', () => {
    expect(layout(String.raw`Ein Elektron ($m = 9{,}1 \cdot 10^{-31}\,\mathrm{kg}$) fliegt.`)).toBe(
      String.raw`|Ein Elektron |[(<i>m = 9{,}1 \cdot 10^{-31}\,\mathrm{kg}</i>)]| fliegt.|`,
    )
    expect(layout(String.raw`Kalium ($39{,}1\,\mathrm{u}$) ist schwerer.`)).toBe(String.raw`|Kalium |[(<i>39{,}1\,\mathrm{u}</i>)]| ist schwerer.|`)
    expect(layout(String.raw`Das Zeichen „$\ce{Na+}$“ steht für ein Ion.`)).toBe(String.raw`|Das Zeichen |[„<i>\ce{Na+}</i>“]| steht für ein Ion.|`)
    // nur die Klammer davor, ohne Satzzeichen dahinter
    expect(layout('Masse ($m$ in kg)')).toBe('|Masse |[(<i>m</i>]| in kg)|')
  })

  it('lässt Klammern mit Abstand und lange Formeln umbrechen', () => {
    expect(layout('Masse ( $m$ ) und Ladung')).not.toContain('[')
    const long = `$${'a + '.repeat(20)}b$`
    expect(layout(`Lang (${long}) und mehr`)).not.toContain('[')
    // Rechenketten mit mehreren Gleichheitszeichen brechen am Handy um (M7 Schritt 13)
    expect(layout(String.raw`Also $\det M = (-1) \cdot 6 - 2 \cdot (-4) = 2$.`)).not.toContain('[')
    expect(layout(String.raw`Also $-2a - 8 - (2a + 6) \cdot (-a - 4) = 2a^2 + 12a + 16$.`)).not.toContain('[')
  })

  it('verliert keinen Text, auch zwischen zwei Formeln', () => {
    for (const text of ['$a$($b$)', 'x ($a$), ($b$).', '„$a$“ und „$b$“', '(($a$))', '$a$)($b$']) {
      const html = renderToStaticMarkup(createElement(RichText, { text, inline: true }))
      expect(html.replace(/<i>([^<]*)<\/i>/g, '$$$1$$').replace(/<[^>]+>/g, ''), text).toBe(text)
    }
    expect(layout('$a$)($b$')).toBe('[<i>a</i>)]||[(<i>b</i>]')
  })
})

describe('RichText: fett', () => {
  const html = (text: string) => renderToStaticMarkup(createElement(RichText, { text, inline: true }))
  it('setzt **…** fett, auch über eine Formel hinweg, und lässt keine Sternchen stehen', () => {
    expect(html('Das ist **wichtig** hier.')).toContain('<strong>wichtig</strong>')
    const across = html('Die Determinante wird **$k$-mal so groß** sein.')
    expect(across).toContain('<strong><i>k</i></strong>')
    expect(across).toContain('<strong>-mal so groß</strong>')
    expect(across).not.toContain('*')
    expect(html('Nur **Text**.')).not.toContain('*')
  })
})
