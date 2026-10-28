// Erzeugt das App-Symbol in allen nötigen Größen (public/).
// Aufruf: node scripts/generate-icons.ts
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const ACCENT = '#0f766e'

// Treppe, die in einem Punkt endet: Schritt für Schritt zum Ziel.
// Mittig und innerhalb der sicheren Zone (Kreis mit 80 % Durchmesser), damit
// auch zugeschnittene Android-Symbole vollständig sind.
const mark = `
  <path d="M110 346 H198 V266 H278 V186 H342" fill="none" stroke="#fff"
        stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="382" cy="186" r="40" fill="#fff"/>`

function svg(rounded: boolean): string {
  const radius = rounded ? 112 : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${radius}" fill="${ACCENT}"/>${mark}
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
