import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression2'

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon-khaoskontrol.webp',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
      ],
      manifest: {
        name: 'Khaos Kontrol - CRM para Maquiadoras',
        short_name: 'Khaos Kontrol',
        description: 'Sistema de gestão profissional para maquiadoras',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['business', 'productivity'],
        shortcuts: [
          {
            name: 'Nova Agenda',
            short_name: 'Agendar',
            description: 'Criar novo agendamento',
            url: '/projects/new',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Calendário',
            short_name: 'Agenda',
            description: 'Ver calendário',
            url: '/calendar',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    } as any),

    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
    } as any),

    ...(process.env.ANALYZE
      ? [
          visualizer({
            open: true,
            filename: 'dist/stats.html',
          }),
        ]
      : []),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    sourcemap: mode !== 'production',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
            'zustand',
            'react-helmet-async',
            'lucide-react',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
          ],

          'vendor-supabase': ['@supabase/supabase-js'],

          'vendor-utils': ['date-fns', 'uuid', 'nanoid', 'zod'],

          'ai-engine': ['@mlc-ai/web-llm'],
          'ai-markdown': ['react-markdown', 'remark-gfm'],

          'feature-calendar': ['react-big-calendar'],
          'feature-forms': ['react-hook-form', '@hookform/resolvers'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
}))
