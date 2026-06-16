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
        // Take over immediately when a new SW is installed so users never get
        // stuck on a stale cached build after a deploy.
        skipWaiting: true,
        clientsClaim: true
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
