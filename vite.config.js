import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        // Split large, independent vendor groups into their own chunks so the
        // initial app payload is smaller and they can be cached separately.
        // (Rolldown/Vite 8 expects manualChunks as a function.)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
            if (id.includes('@dnd-kit')) return 'dnd';
          }
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png'],
      workbox: {
        // html2pdf is a heavy, on-demand chunk (only loaded when the user clicks
        // "Download PDF"). Keep it out of the install-time precache so first load
        // stays light; it's fetched from the network when actually needed.
        globIgnores: ['**/html2pdf-*.js'],
        maximumFileSizeToCacheInBytes: 600 * 1024,
        // New SW activates immediately on install without waiting for old tabs
        // to close, then claims all clients so the reload serves fresh assets.
        skipWaiting: true,
        clientsClaim: true,
        // Broadcast a message to all tabs when the SW activates so UpdateToast
        // can trigger a reload even if the page didn't detect needRefresh.
        runtimeCaching: [],
      },
      manifest: {
        name: 'CV Mate - CV Generator',
        short_name: 'CV Mate',
        description: 'Build professional CVs, resumes & cover letters',
        theme_color: '#0f172a',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
