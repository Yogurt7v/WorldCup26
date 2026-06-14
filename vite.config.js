import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  server: {
    proxy: {
      '/api/supabase': {
        target: 'https://whobwjaymbhychlbgfom.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/supabase/, ''),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      selfDestroying: mode === 'development',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'ЧМ-2026 — Прогнозы на матчи',
        short_name: 'ЧМ-2026 Прогнозы',
        description: 'Приложение для прогнозов на матчи чемпионата мира по футболу 2026',
        theme_color: '#f8fafc',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ru',
        start_url: '/',
        icons: [
          { src: '/icons/16x16.png', sizes: '16x16', type: 'image/png' },
          { src: '/icons/32x32.png', sizes: '32x32', type: 'image/png' },
          { src: '/icons/72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/120x120.png', sizes: '120x120', type: 'image/png' },
          { src: '/icons/128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/180x180.png', sizes: '180x180', type: 'image/png' },
          { src: '/icons/192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          {
            src: '/screenshots/narrow.png',
            sizes: '750x1334',
            type: 'image/png',
          },
          {
            src: '/screenshots/wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      },
    }),
  ],
}))
