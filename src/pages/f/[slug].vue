<template>
  <div>
    <!-- Loading -->
    <div
      v-if="franchiseStore.status === 'loading' || franchiseStore.status === 'idle'"
      class="d-flex justify-center py-16"
    >
      <v-progress-circular color="primary" indeterminate size="56" />
    </div>

    <!-- Not found -->
    <v-container v-else-if="franchiseStore.status === 'notFound'" class="py-16 text-center">
      <v-icon class="mb-4" color="medium-emphasis" icon="mdi-store-off-outline" size="64" />
      <div class="text-h6 mb-2">{{ $t('Franchise.notFoundTitle') }}</div>
      <div class="text-body-2 text-medium-emphasis mb-6">{{ $t('Franchise.notFoundBody') }}</div>
      <v-btn color="primary" to="/" variant="flat">{{ $t('Franchise.backToStore') }}</v-btn>
    </v-container>

    <!-- Error -->
    <v-container v-else-if="franchiseStore.status === 'error'" class="py-16 text-center">
      <v-icon class="mb-4" color="error" icon="mdi-alert-circle-outline" size="64" />
      <div class="text-h6 mb-2">{{ $t('Franchise.errorTitle') }}</div>
      <v-btn class="mt-4" color="primary" variant="flat" @click="reload">
        {{ $t('Franchise.retry') }}
      </v-btn>
    </v-container>

    <!-- Franchise storefront -->
    <template v-else>
      <!-- Hero -->
      <div class="franchise-hero" :style="heroStyle">
        <div class="franchise-hero__overlay">
          <v-container class="py-6">
            <div class="d-flex align-center ga-4">
              <v-avatar
                v-if="franchiseStore.logoUrl"
                class="franchise-hero__logo"
                rounded="lg"
                size="72"
              >
                <v-img :alt="title" cover :src="franchiseStore.logoUrl" />
              </v-avatar>
              <div>
                <h1 class="text-h5 font-weight-bold mb-1">{{ title }}</h1>
                <div class="text-body-2 text-medium-emphasis">
                  <v-icon
                    class="me-1"
                    icon="mdi-check-decagram"
                    size="16"
                  />
                  {{ $t('Franchise.officialOf', { tenant: tenantName }) }}
                  · {{ $t('Franchise.poweredBy') }}
                </div>
              </div>
            </div>
            <p
              v-if="franchiseStore.active?.description"
              class="text-body-2 mt-3 mb-0"
              style="max-width: 720px"
            >
              {{ franchiseStore.active.description }}
            </p>
          </v-container>
        </div>
      </div>

      <!-- Catalog (same tenant catalogue, sold under this franchise) -->
      <EntryCardGrid />
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import EntryCardGrid from '@/components/entry/EntryCardGrid.vue'
  import { useFranchiseStore } from '@/stores/franchise'
  import { useTenantStore } from '@/stores/tenant'

  const route = useRoute()
  const franchiseStore = useFranchiseStore()
  const tenantStore = useTenantStore()

  const slug = computed(() => String((route.params as Record<string, string | string[] | undefined>).slug ?? ''))

  const title = computed(
    () => franchiseStore.brandText ?? tenantStore.brandText ?? 'EARNLUMENS',
  )
  const tenantName = computed(() => tenantStore.brandText ?? 'EarnLumens')

  const heroStyle = computed(() => {
    const accent = franchiseStore.accentColor
    const cover = franchiseStore.coverUrl
    if (cover) {
      return { backgroundImage: `url("${cover}")` }
    }
    if (accent) {
      return { background: `linear-gradient(135deg, ${accent}33, ${accent}11)` }
    }
    return {}
  })

  function reload () {
    if (slug.value) franchiseStore.loadBySlug(slug.value)
  }

  watch(
    slug,
    next => {
      if (next) franchiseStore.loadBySlug(next)
    },
    { immediate: true },
  )

  // Leaving the franchise context restores the plain tenant storefront
  // branding and stops attributing future purchases to the franchise.
  onBeforeUnmount(() => {
    franchiseStore.clear()
  })
</script>

<style scoped>
  .franchise-hero {
    background-size: cover;
    background-position: center;
  }

  .franchise-hero__overlay {
    background: rgba(0, 0, 0, 0.04);
    backdrop-filter: saturate(115%);
  }

  .franchise-hero__logo {
    border: 2px solid rgba(255, 255, 255, 0.6);
  }
</style>

<route lang="json">
{
  "path": "/f/:slug"
}
</route>
