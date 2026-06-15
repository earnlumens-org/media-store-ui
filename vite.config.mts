import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
// Utilities
import { defineConfig } from 'vite'

import { VitePWA } from 'vite-plugin-pwa'
import Layouts from 'vite-plugin-vue-layouts-next'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter({
      dts: 'src/typed-router.d.ts',
    }),
    Layouts(),
    // PWA: installable app for Android / iOS / desktop. The OAuth callback
    // (/oauth2/callback?UUID=…) re-enters this same origin so it stays inside
    // the PWA scope and completes the token exchange in the PWA's storage jar.
    // Manifest name/icons are platform-generic for now (single static
    // manifest); per-tenant branding would require a dynamic edge-served
    // manifest (see DEPLOY notes).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa/apple-touch-icon.png'],
      // Don't precache large media; only the app shell. Navigation falls back
      // to index.html so deep links (incl. /oauth2/callback) work offline-first.
      workbox: {
        navigateFallback: '/index.html',
        // Never let the SW intercept the OAuth handshake / API calls.
        navigateFallbackDenylist: [/^\/oauth2\//, /^\/api\//, /^\/login\//],
        globPatterns: ['**/*.{js,css,html,woff2}'],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Earn Lumens',
        short_name: 'Earn Lumens',
        description: 'A collaborative financial education platform on the Stellar network',
        theme_color: '#10131A',
        background_color: '#10131A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',
        icons: [
          { src: '/pwa/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
    AutoImport({
      imports: [
        'vue',
        VueRouterAutoImports,
        {
          pinia: ['defineStore', 'storeToRefs'],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
    Components({
      dts: 'src/components.d.ts',
    }),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
  ],
  optimizeDeps: {
    exclude: [
      'vuetify',
      'vue-router',
      'unplugin-vue-router/runtime',
      'unplugin-vue-router/data-loaders',
      'unplugin-vue-router/data-loaders/basic',
    ],
  },
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['.earnlumens.org'],
  },
})
