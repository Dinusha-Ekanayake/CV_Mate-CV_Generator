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
      manifest: {
        name: 'CV Mate - CV Generator',
        short_name: 'CV Mate',
        description: 'Advanced AI/SE CV Generator',
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
