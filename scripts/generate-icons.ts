// Erzeugt das App-Symbol in allen nötigen Größen (public/).
// Aufruf: node scripts/generate-icons.ts
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

// Blaugrün der App als Verlauf (hell oben links, dunkel unten rechts)
const LIGHT = '#2dd4bf'
const DARK = '#0f766e'
const GOAL = '#fbbf24'

// „Wurzel-Weg": ein Wurzelzeichen, dessen Strich zu einem gelben Ziel-Punkt führt: Schritt für
// Schritt zum Ergebnis. Auf 84 % verkleinert und mittig, also innerhalb der sicheren Zone (Kreis mit
// 80 % Durchmesser), damit auch zugeschnittene Android-Symbole vollständig sind.
const mark = `
  <g transform="translate(256 256) scale(0.84) translate(-256 -256)">
    <path d="M92 300 L150 270 L214 392 L292 128 H396" fill="none" stroke="#fff"
          stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="430" cy="128" r="34" fill="${GOAL}"/>
  </g>`

function svg(rounded: boolean): string {
  const radius = rounded ? 112 : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${LIGHT}"/>
      <stop offset="1" stop-color="${DARK}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#bg)"/>${mark}
</svg>
`
}

writeFileSync('public/favicon.svg', svg(true))

const browser = await chromium.launch()
const page = await browser.newPage()

async function png(file: string, size: number, rounded: boolean) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<html><body style="margin:0;background:transparent">
       <div style="width:${size}px;height:${size}px">${svg(rounded).replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>
     </body></html>`,
  )
  await page.screenshot({ path: `public/${file}`, omitBackground: true })
}

await png('pwa-192.png', 192, true)
await png('pwa-512.png', 512, true)
// Android schneidet maskierbare Symbole selbst zu, iOS rundet selbst ab
await png('pwa-maskable-512.png', 512, false)
await png('apple-touch-icon.png', 180, false)

await browser.close()
console.log('Symbole erzeugt.')
