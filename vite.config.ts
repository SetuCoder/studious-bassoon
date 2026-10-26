import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import { APP_NAME } from './src/lib/constants.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Fonts are self-hosted; cache them too so the installed app looks right offline.
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] },
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        description: 'See everything you owe. Know what to do with your next rupee.',
        // Aubergine bar and launch screen; Android draws its splash from these, the name and the 512 icon.
        theme_color: '#3A0F34',
        background_color: '#3A0F34',
        display: 'standalone',
        start_url: '/',
        // Drawn by scripts/make-icons.mjs (npm run icons).
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
