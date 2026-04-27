<!--
  Rendered when the visitor is on a syntactically valid `<sub>.earnlumens.org`
  that has no active tenant. Replaces the storefront entirely so we never
  leak default-tenant content for an unknown subdomain.

  Bilingual (es/en) hardcoded on purpose: this page must render BEFORE
  i18n / vuetify routes are involved, and it ships before any tenant data
  is fetched.
-->
<template>
  <div class="tenant-not-found">
    <div class="tenant-not-found__card">
      <div aria-hidden="true" class="tenant-not-found__logo" v-html="logoSvg" />

      <p class="tenant-not-found__eyebrow">EARNLUMENS</p>

      <h1 class="tenant-not-found__title">{{ texts.title }}</h1>

      <p class="tenant-not-found__subdomain">
        <code>{{ subdomain }}.earnlumens.org</code>
      </p>

      <p class="tenant-not-found__body">{{ texts.body }}</p>

      <a class="tenant-not-found__cta" :href="apexHref">
        {{ texts.cta }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import logoSvg from '@/assets/logo.svg?raw'

  const props = defineProps<{
    subdomain: string
  }>()

  const navigatorLang = typeof navigator === 'undefined' ? 'en' : navigator.language
  const isSpanish = navigatorLang.toLowerCase().startsWith('es')

  const texts = computed(() => isSpanish
    ? {
      title: 'Este tenant no existe',
      body: 'El subdominio al que estás intentando acceder no corresponde a ningún marketplace activo en EarnLumens.',
      cta: 'Ir a earnlumens.org',
    }
    : {
      title: 'This tenant doesn’t exist',
      body: 'The subdomain you are trying to reach does not match any active marketplace on EarnLumens.',
      cta: 'Go to earnlumens.org',
    },
  )

  const apexHref = computed(() => {
    if (typeof window === 'undefined') return 'https://earnlumens.org'
    return `${window.location.protocol}//earnlumens.org`
  })

  // Reference the prop so TS / linters don't flag it as unused — the
  // template binding alone isn't enough for `<script setup>` lints.
  void props.subdomain
</script>

<style scoped>
.tenant-not-found {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(ellipse at top, #2a1010 0%, #0b0608 60%, #050203 100%);
  color: #f4f1ee;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  z-index: 9999;
}

.tenant-not-found__card {
  max-width: 480px;
  width: 100%;
  text-align: center;
}

.tenant-not-found__logo {
  width: 96px;
  height: 96px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tenant-not-found__logo :deep(svg) {
  width: 100%;
  height: 100%;
}

.tenant-not-found__eyebrow {
  display: inline-block;
  margin: 0 0 16px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 100, 60, 0.5);
  font-size: 11px;
  letter-spacing: 0.2em;
  color: #ff8a5c;
}

.tenant-not-found__title {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.tenant-not-found__subdomain {
  margin: 0 0 20px;
  font-size: 14px;
  opacity: 0.75;
}

.tenant-not-found__subdomain code {
  font-family: "SF Mono", Menlo, Consolas, monospace;
  background: rgba(255, 255, 255, 0.06);
  padding: 4px 10px;
  border-radius: 6px;
}

.tenant-not-found__body {
  margin: 0 0 28px;
  font-size: 15px;
  line-height: 1.5;
  opacity: 0.85;
}

.tenant-not-found__cta {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  background: #ff6a3c;
  color: #1a0a05;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: background 0.15s ease;
}

.tenant-not-found__cta:hover {
  background: #ff8255;
}
</style>
