<!--
  TenantBanner — per-tenant hero rendered at the top of the storefront home
  page. The data comes from the visitor probe (`useTenantStore().banner`)
  which is populated server-side from the Tenant document. The owner edits
  the fields in admin-ui at /settings/banner.

  Rendering rules:
    - Mount only when `tenantStore.banner` is non-null (master switch on).
    - Background image is optional: when missing, the block falls back to
      a subtle gradient so the copy is still readable.
    - CTA renders as an internal RouterLink for relative paths and as an
      external anchor with rel="noopener noreferrer" for https URLs. The
      scheme allowlist is enforced server-side (see TenantService), but we
      defend in depth here too.
-->
<template>
  <section v-if="banner" :class="['tenant-banner', { 'tenant-banner--no-image': !bannerImageUrl }]">
    <div
      class="tenant-banner-bg"
      :style="bannerImageUrl ? { backgroundImage: `url(${bannerImageUrl})` } : undefined"
    >
      <!-- Hidden img for screen readers / SEO when a background image is set. -->
      <img
        v-if="bannerImageUrl"
        :alt="banner.imageAlt || ''"
        class="tenant-banner-srcset"
        :src="bannerImageUrl"
      >
      <div class="tenant-banner-overlay" />

      <v-container class="tenant-banner-container" fluid>
        <div class="tenant-banner-content">
          <v-chip
            v-if="banner.eyebrow"
            class="mb-3 text-uppercase font-weight-medium"
            color="primary"
            label
            size="small"
            variant="flat"
          >
            {{ banner.eyebrow }}
          </v-chip>

          <h1 v-if="banner.headline" class="tenant-banner-headline">
            {{ banner.headline }}
          </h1>

          <p v-if="banner.subheadline" class="tenant-banner-subheadline">
            {{ banner.subheadline }}
          </p>

          <div v-if="ctaHref" class="mt-4">
            <v-btn
              class="text-none font-weight-bold"
              color="primary"
              elevation="2"
              :href="ctaIsExternal ? ctaHref : undefined"
              rel="noopener noreferrer"
              rounded="lg"
              size="x-large"
              :target="ctaIsExternal ? '_blank' : undefined"
              :to="ctaIsExternal ? undefined : ctaHref"
            >
              {{ banner.ctaLabel }}
              <v-icon class="ms-2" icon="mdi-arrow-right" />
            </v-btn>
          </div>
        </div>
      </v-container>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'

  import { useTenantStore } from '@/stores/tenant'

  const tenantStore = useTenantStore()

  const banner = computed(() => tenantStore.banner)
  const bannerImageUrl = computed(() => tenantStore.bannerImageUrl)

  // Defense-in-depth: only render a CTA when the URL passes the same
  // scheme allowlist enforced server-side. Anything else is silently
  // dropped so a stale tenant document with a bad value cannot inject
  // a javascript:/data: link into the storefront.
  const ctaIsExternal = computed(() => {
    const url = banner.value?.ctaUrl
    return typeof url === 'string' && /^https:\/\//i.test(url)
  })

  const ctaHref = computed<string | null>(() => {
    const url = banner.value?.ctaUrl
    const label = banner.value?.ctaLabel
    if (!url || !label) return null
    if (ctaIsExternal.value) return url
    if (url.startsWith('/') && !url.startsWith('//')) return url
    return null
  })
</script>

<style scoped>
.tenant-banner {
  position: relative;
  width: 100%;
  isolation: isolate;
}

.tenant-banner-bg {
  position: relative;
  width: 100%;
  min-height: 320px;
  background-color: rgb(var(--v-theme-surface-variant, var(--v-theme-surface)));
  background-size: cover;
  background-position: center;
}

.tenant-banner--no-image .tenant-banner-bg {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.22) 0%,
    rgba(var(--v-theme-primary), 0.06) 60%,
    transparent 100%
  );
}

/*
 * Hidden img so the banner image is part of the document tree (alt text
 * announced by screen readers, image crawlable by search engines) even
 * though the visual itself is set via background-image for cover sizing.
 */
.tenant-banner-srcset {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.tenant-banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.4) 55%,
    rgba(0, 0, 0, 0.12) 100%
  );
}

.tenant-banner--no-image .tenant-banner-overlay {
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-on-surface), 0.05) 0%,
    transparent 60%
  );
}

.tenant-banner-container {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  padding: 0;
}

.tenant-banner-content {
  padding: 32px 24px;
  max-width: 720px;
  color: #fff;
}

.tenant-banner--no-image .tenant-banner-content {
  color: rgb(var(--v-theme-on-surface));
}

.tenant-banner-headline {
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.01em;
  margin: 0 0 12px;
}

.tenant-banner-subheadline {
  font-size: 1rem;
  line-height: 1.5;
  opacity: 0.94;
  margin: 0;
  max-width: 560px;
}

@media (min-width: 600px) {
  .tenant-banner-bg {
    min-height: 360px;
  }
  .tenant-banner-content {
    padding: 48px 32px;
  }
  .tenant-banner-headline {
    font-size: 2.75rem;
  }
  .tenant-banner-subheadline {
    font-size: 1.125rem;
  }
}

@media (min-width: 960px) {
  .tenant-banner-bg {
    min-height: 420px;
  }
  .tenant-banner-content {
    padding: 64px 48px;
  }
  .tenant-banner-headline {
    font-size: 3.5rem;
  }
}
</style>
