import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'spa-fallback-generator',
      closeBundle() {
        const distDir = path.resolve(import.meta.dirname, 'dist')
        const indexHtml = path.join(distDir, 'index.html')
        if (fs.existsSync(indexHtml)) {
          fs.copyFileSync(indexHtml, path.join(distDir, '200.html'))
          fs.copyFileSync(indexHtml, path.join(distDir, '404.html'))
        }
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Skincluv',
        short_name: 'Skincluv',
        description: 'Asisten kesehatan kulit berbasis AI',
        theme_color: '#006591',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor'
          }
          if (id.includes('node_modules/@supabase')) {
            return 'supabase'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons'
          }
          if (id.includes('node_modules/@mediapipe')) {
            return 'vision-ai'
          }
        },
      },
    },
  },
})
