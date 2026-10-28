/// <reference types="vitest/config" />
import { execSync } from 'node:child_process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Unterordner, unter dem die App liegt. GitHub Pages: /lern-app/, sonst /
const base = process.env.BASE_PATH ?? '/'

// Zeitpunkt und Commit des Builds, damit man in der App sieht, welche Version läuft
function buildInfo() {
  let commit = process.env.GITHUB_SHA?.slice(0, 7)
  if (!commit) {
    try {
      commit = execSync('git rev-parse --short HEAD').toString().trim()
    } catch {
      commit = 'lokal'
    }
  }
  return { builtAt: new Date().toISOString(), commit }
}

export default defineConfig({
  base,
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Neue Versionen werden erst nach Bestätigung aktiv, damit keine Aufgabe mittendrin neu lädt
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rechenweg',
        short_name: 'Rechenweg',
        description: 'Mathe Schritt für Schritt selbst lösen',
        lang: 'de',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Nur woff2-Schriften vorhalten: Jeder aktuelle Browser kann sie, ältere Formate wären doppelt
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
