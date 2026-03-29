import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    allowedHosts: ['.ngrok-free.app'],
  },
  plugins: [tailwindcss()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('maplibre-gl')) {
            return 'maplibre'
          }
        },
      },
    },
  },
})
