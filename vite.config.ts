import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression2'
import prerender from '@prerenderer/rollup-plugin'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { readFileSync } from 'fs'

// Versão real do package.json injetada como VITE_APP_VERSION pra
// release tracking do Sentry. Sem isso o Sentry agrupava todos
// os erros sob "khaos-kontrol@1.0.0" (fallback hardcoded).
const pkgVersion = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
).version

const PRERENDER_ROUTES = [
  '/',
  '/recursos',
  '/planos',
  '/contato',
  '/privacidade',
  '/termos',
  '/reembolso',
  '/seguranca',
  '/cookies',
  '/dpa',
]

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Amplify's default SPA rewrite captures `.webmanifest` (it's not in
      // the excluded-extensions regex) and returns index.html — the browser
      // then tries to parse HTML as JSON and logs "Line 1, column 1, Syntax
      // error". `.json` IS in Amplify's default exclusion list, so serving
      // the manifest as manifest.json avoids the rewrite without needing a
      // custom redirect rule.
      filename: 'manifest.json',
      includeAssets: [
        'favicon-khaoskontrol.webp',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'Khaos Kontrol - Gestão para Maquiadoras',
        short_name: 'Khaos Kontrol',
        description:
          'Organize clientes, contratos, agenda e financeiro em um só lugar.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/dashboard',
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
            name: 'Nova Cliente',
            short_name: 'Cliente',
            description: 'Cadastrar nova cliente',
            url: '/clientes',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Calendário',
            short_name: 'Agenda',
            description: 'Ver calendário de eventos',
            url: '/calendar',
            icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Contratos',
            short_name: 'Contratos',
            description: 'Gerenciar contratos',
            url: '/contratos',
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
        importScripts: ['/push-handler.js'],
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
              cacheName: 'google-fonts',
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
              cacheName: 'gstatic-fonts',
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
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
    // vite-plugin-compression2 renamed `algorithm` → `algorithms` in newer
    // types but still accepts the singular form at runtime. Keep singular to
    // avoid regressing compression output; cast via Parameters<> so TS and
    // eslint stay happy without `any`.
    compression({
      algorithms: ['gzip'],
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024,
    } as unknown as Parameters<typeof compression>[0]),
    compression({
      algorithms: ['brotliCompress'],
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024,
    } as unknown as Parameters<typeof compression>[0]),
    ...(process.env.ANALYZE
      ? [
          visualizer({
            open: true,
            filename: 'dist/stats.html',
          }),
        ]
      : []),
    // Sourcemaps + release tracking pro Sentry. Roda só em build prod e
    // só se SENTRY_AUTH_TOKEN estiver no ambiente (CI/local). Sem o token
    // o plugin é noop — não quebra build local sem credencial.
    ...(mode === 'production' && process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: 'khaos-kontrol',
            project: 'khaos-kontrol-prod',
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: `khaos-kontrol@${pkgVersion}` },
            sourcemaps: {
              filesToDeleteAfterUpload: ['./dist/**/*.map'],
            },
          }),
        ]
      : []),
    ...(mode === 'production' && !process.env.SKIP_PRERENDER
      ? [
          prerender({
            routes: PRERENDER_ROUTES,
            renderer: '@prerenderer/renderer-puppeteer',
            rendererOptions: {
              renderAfterTime: 5000,
              maxConcurrentRoutes: 1,
              headless: true,
              viewport: { width: 1280, height: 800 },
              timeout: 180000,
              launchOptions: {
                args: [
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                  '--disable-dev-shm-usage',
                ],
              },
            },
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
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkgVersion),
  },
  build: {
    // 'hidden' em prod: gera .map mas omite a referência sourceMappingURL
    // do .js, então users no browser NÃO baixam sourcemap. Os .map ficam
    // no dist/ só pro sentryVitePlugin upload, depois são deletados.
    sourcemap: mode === 'production' ? 'hidden' : true,
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
          'vendor-charts': ['recharts'],
          // exceljs, jspdf, html2canvas, @mlc-ai/web-llm, @react-pdf/renderer
          // NÃO ficam em manualChunks: todos são dynamic import-only, e listá-los
          // aqui força o chunk pro preload do entry HTML (era o caso da
          // v5.8.18 que shipou ~1.5MB de react-pdf + 587KB de jspdf no primeiro
          // paint mesmo sem uso). Deixando o Rollup criar chunks automáticos
          // eles só carregam quando a maquiadora clica em "Gerar PDF" ou
          // "Exportar Excel".
          'ai-markdown': ['react-markdown', 'remark-gfm'],
          'feature-calendar': ['react-big-calendar'],
          'feature-forms': ['react-hook-form', '@hookform/resolvers'],
        },
      },
    },
    chunkSizeWarningLimit: 8000,
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
