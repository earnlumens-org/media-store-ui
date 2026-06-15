import { fileURLToPath, URL } from 'node:url'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Vue from '@vitejs/plugin-vue'
// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
// Utilities
import { defineConfig, type Plugin } from 'vite'

import { VitePWA } from 'vite-plugin-pwa'
import Layouts from 'vite-plugin-vue-layouts-next'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

/**
 * Build-time brand de-cabling: rewrites the canonical tokens baked into the
 * static `index.html` (og/twitter meta) and the verbatim-copied `_headers`
 * CSP file to this deployment's domain/name. Driven by `VITE_PRIMARY_HOST`
 * (default `earnlumens.org`), so a single env var re-brands a fresh build.
 *   `earnlumens.org` -> <primary host>     (og:url, og:image host, CSP apex)
 *   `EARNLUMENS`      -> <name, uppercase>  (og:title, twitter:title)
 */
function brandTokens (): Plugin {
  const primaryHost = (process.env.VITE_PRIMARY_HOST || 'earnlumens.org').trim().toLowerCase()
  const platformName = (primaryHost.split('.')[0] || primaryHost).toUpperCase()
  const rewrite = (s: string): string => s
    .split('earnlumens.org').join(primaryHost)
    .split('EARNLUMENS').join(platformName)
  let outDir = 'dist'
  return {
    name: 'brand-tokens',
    apply: 'build',
    configResolved (config) {
      outDir = config.build.outDir
    },
    transformIndexHtml (html) {
      return rewrite(html)
    },
    closeBundle () {
      const headersPath = resolve(outDir, '_headers')
      if (existsSync(headersPath)) {
        writeFileSync(headersPath, rewrite(readFileSync(headersPath, 'utf8')))
      }
    },
  }
}

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
    brandTokens(),
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
