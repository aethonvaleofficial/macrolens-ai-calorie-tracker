import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Use the existing manifest file in public folder
      manifest: false,
      // Register service worker with auto update
      registerType: 'autoUpdate',
      // Workbox options for offline fallback
      workbox: {
        navigateFallback: '/offline.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
            },
          },
        ],
      },
      // Enable PWA in dev for easier testing
      devOptions: { enabled: true },
    }),
  ],
})
