<!--
  Preview Page (Paywall)

  Shows locked content preview with paywall:
  - Type-specific preview (video=thumbnail, audio=disabled player, image=blurred, entry=excerpt, collection=locked list)
  - Paywall panel with price, creator info, what's included
  - Checkout dialog integration
  - Redirect to destination route after purchase

  RESPONSIVE LAYOUT:
  - Mobile (< 960px): Single column, preview stacked above paywall
  - Desktop (>= 960px): Two-column layout, preview left, paywall right (sticky)

  DESTINATION ROUTES:
  - video → /watch/:id
  - audio → /listen/:id
  - image → /view/:id
  - entry → /read/:id
  - collection → /collection/:id
-->
<template>
  <div>
    <!-- MOBILE: Top Toolbar -->
    <v-toolbar
      class="d-md-none"
      color="surface"
      density="compact"
      flat
    >
      <v-btn
        aria-label="Go back"
        icon="mdi-arrow-left"
        variant="text"
        @click="goBack"
      />

      <v-toolbar-title v-if="content" class="text-body-1">
        {{ content.title }}
      </v-toolbar-title>
      <v-toolbar-title v-else>
        <v-skeleton-loader type="text" width="200" />
      </v-toolbar-title>
    </v-toolbar>

    <!-- LOADING STATE -->
    <template v-if="loading">
      <v-row class="ma-0" no-gutters>
        <v-col cols="12" lg="8" md="7">
          <v-container class="pa-4" fluid>
            <v-skeleton-loader class="rounded-lg" height="400" type="image" />
            <v-skeleton-loader class="mt-4" type="heading" />
            <div class="d-flex align-center mt-4">
              <v-skeleton-loader class="me-4" type="avatar" />
              <div class="flex-grow-1">
                <v-skeleton-loader type="text" width="150" />
                <v-skeleton-loader class="mt-1" type="text" width="100" />
              </div>
            </div>
          </v-container>
        </v-col>
        <v-col class="d-none d-md-block" cols="12" lg="4" md="5">
          <v-container class="pa-4" fluid>
            <v-skeleton-loader height="300" type="card" />
          </v-container>
        </v-col>
      </v-row>
    </template>

    <!-- ERROR STATE -->
    <template v-else-if="error">
      <v-container class="fill-height">
        <v-row align="center" justify="center">
          <v-col cols="12" lg="4" md="6" sm="8">
            <v-alert
              class="mb-4"
              prominent
              type="error"
              variant="tonal"
            >
              <v-alert-title>Failed to load content</v-alert-title>
              {{ errorMessage }}
            </v-alert>
            <div class="d-flex ga-2 justify-center">
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                variant="flat"
                @click="fetchContent"
              >
                Retry
              </v-btn>
              <v-btn
                prepend-icon="mdi-home"
                variant="outlined"
                @click="goHome"
              >
                Go Home
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- NOT FOUND STATE -->
    <template v-else-if="notFound">
      <v-container class="fill-height">
        <v-row align="center" justify="center">
          <v-col
            class="text-center"
            cols="12"
            lg="4"
            md="6"
            sm="8"
          >
            <v-icon color="grey" size="120">mdi-file-hidden</v-icon>
            <h2 class="text-h5 mt-4 mb-2">Content not found</h2>
            <p class="text-body-2 text-medium-emphasis mb-6">
              The content you're looking for doesn't exist or has been removed.
            </p>
            <div class="d-flex ga-2 justify-center">
              <v-btn
                color="primary"
                prepend-icon="mdi-arrow-left"
                variant="flat"
                @click="goBack"
              >
                Go Back
              </v-btn>
              <v-btn
                prepend-icon="mdi-home"
                variant="outlined"
                @click="goHome"
              >
                Go Home
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- SUCCESS STATE -->
    <template v-else-if="content">
      <v-row class="ma-0" no-gutters>
        <!-- Left Column: Preview Content -->
        <v-col cols="12" lg="8" md="7">
          <v-container class="pa-0 pa-md-4" fluid>
            <!-- Desktop: Back button and title -->
            <div class="d-none d-md-flex align-center mb-4">
              <v-btn
                aria-label="Go back"
                class="me-2"
                density="comfortable"
                icon="mdi-arrow-left"
                variant="text"
                @click="goBack"
              />
              <h1 class="text-h5 font-weight-bold">
                {{ content.title }}
              </h1>
            </div>

            <!-- TYPE-SPECIFIC PREVIEW -->

            <!-- VIDEO Preview: Thumbnail with play overlay + locked badge -->
            <v-sheet
              v-if="contentType === 'video'"
              class="rounded-0 rounded-md-lg overflow-hidden position-relative"
            >
              <v-img
                aspect-ratio="16/9"
                cover
                :src="content.thumbnailUrl || 'https://picsum.photos/seed/video-preview/800/450'"
              >
                <template #placeholder>
                  <v-sheet class="h-100 w-100 d-flex align-center justify-center" color="grey-darken-4">
                    <v-progress-circular color="white" indeterminate />
                  </v-sheet>
                </template>
              </v-img>
              <!-- Locked overlay -->
              <v-overlay
                class="d-flex align-center justify-center"
                contained
                :model-value="true"
                persistent
                scrim="black"
              >
                <div class="text-center">
                  <v-icon color="white" size="80">mdi-lock</v-icon>
                  <div class="text-h6 text-white mt-2">Premium Video</div>
                  <div class="text-body-2 text-white-secondary">Unlock to watch</div>
                </div>
              </v-overlay>
              <!-- Duration badge -->
              <v-chip
                v-if="content.durationSec"
                class="position-absolute"
                color="black"
                size="small"
                style="bottom: 12px; right: 12px; opacity: 0.8;"
              >
                {{ formatDuration(content.durationSec) }}
              </v-chip>
            </v-sheet>

            <!-- AUDIO Preview: Disabled player UI -->
            <v-card
              v-else-if="contentType === 'audio'"
              class="rounded-0 rounded-md-lg"
              color="surface"
              variant="flat"
            >
              <v-card-text class="d-flex flex-column align-center justify-center py-12">
                <!-- Album art placeholder -->
                <v-avatar
                  v-if="content.thumbnailUrl"
                  class="mb-6"
                  rounded="lg"
                  size="200"
                >
                  <v-img cover :src="content.thumbnailUrl">
                    <v-overlay
                      class="d-flex align-center justify-center"
                      contained
                      :model-value="true"
                      persistent
                      scrim="black"
                    >
                      <v-icon color="white" size="60">mdi-lock</v-icon>
                    </v-overlay>
                  </v-img>
                </v-avatar>
                <v-avatar
                  v-else
                  class="mb-6"
                  color="primary"
                  rounded="lg"
                  size="200"
                  variant="tonal"
                >
                  <v-icon color="primary" size="80">mdi-music</v-icon>
                </v-avatar>

                <div class="text-h6 mb-1">{{ content.title }}</div>
                <div class="text-body-2 text-medium-emphasis mb-6">
                  by {{ content.authorName }}
                </div>

                <!-- Disabled progress bar -->
                <v-slider
                  class="w-100"
                  color="grey"
                  disabled
                  hide-details
                  :model-value="30"
                  style="max-width: 400px;"
                  track-color="grey-darken-3"
                />
                <div class="d-flex justify-space-between w-100 mt-1" style="max-width: 400px;">
                  <span class="text-caption text-disabled">0:00</span>
                  <span class="text-caption text-disabled">
                    {{ content.durationSec ? formatDuration(content.durationSec) : '--:--' }}
                  </span>
                </div>

                <!-- Disabled controls -->
                <div class="d-flex align-center ga-2 mt-4">
                  <v-btn disabled icon="mdi-skip-previous" variant="text" />
                  <v-btn
                    color="primary"
                    disabled
                    icon="mdi-lock"
                    size="large"
                    variant="flat"
                  />
                  <v-btn disabled icon="mdi-skip-next" variant="text" />
                </div>

                <v-chip class="mt-6" color="warning" prepend-icon="mdi-lock">
                  Unlock to listen
                </v-chip>
              </v-card-text>
            </v-card>

            <!-- IMAGE Preview: Blurred with lock overlay -->
            <v-sheet
              v-else-if="contentType === 'image'"
              class="rounded-0 rounded-md-lg overflow-hidden position-relative"
            >
              <v-img
                aspect-ratio="4/3"
                class="blur-preview"
                cover
                :src="content.thumbnailUrl || 'https://picsum.photos/seed/image-preview/800/600'"
              >
                <template #placeholder>
                  <v-sheet class="h-100 w-100 d-flex align-center justify-center" color="grey-darken-4">
                    <v-progress-circular color="white" indeterminate />
                  </v-sheet>
                </template>
              </v-img>
              <!-- Locked overlay -->
              <v-overlay
                class="d-flex align-center justify-center"
                contained
                :model-value="true"
                persistent
                scrim="rgba(0,0,0,0.6)"
              >
                <div class="text-center">
                  <v-icon color="white" size="80">mdi-lock</v-icon>
                  <div class="text-h6 text-white mt-2">Premium Image</div>
                  <div class="text-body-2 text-white-secondary">Unlock for full resolution</div>
                </div>
              </v-overlay>
            </v-sheet>

            <!-- ENTRY Preview: First 200 chars excerpt -->
            <v-card
              v-else-if="contentType === 'entry'"
              class="rounded-0 rounded-md-lg"
              variant="flat"
            >
              <!-- Feature image if available -->
              <v-img
                v-if="content.thumbnailUrl"
                class="blur-preview-light"
                cover
                height="200"
                :src="content.thumbnailUrl"
              >
                <v-overlay
                  contained
                  :model-value="true"
                  persistent
                  scrim="rgba(0,0,0,0.4)"
                />
              </v-img>

              <v-card-text class="pa-6">
                <div class="text-h5 font-weight-bold mb-2">{{ content.title }}</div>
                <div class="d-flex align-center text-body-2 text-medium-emphasis mb-4">
                  <span>{{ content.authorName }}</span>
                  <v-icon class="mx-2" size="4">mdi-circle</v-icon>
                  <span>{{ formatDate(content.publishedAt) }}</span>
                </div>

                <!-- Excerpt with fade -->
                <div class="entry-excerpt position-relative">
                  <p class="text-body-1" style="line-height: 1.8;">
                    {{ mockExcerpt }}
                  </p>
                  <!-- Fade overlay -->
                  <div class="excerpt-fade" />
                </div>

                <!-- Locked indicator -->
                <v-alert
                  class="mt-4"
                  density="compact"
                  type="warning"
                  variant="tonal"
                >
                  <div class="d-flex align-center">
                    <v-icon class="mr-2">mdi-lock</v-icon>
                    <span>This article is locked. Unlock to continue reading.</span>
                  </div>
                </v-alert>
              </v-card-text>
            </v-card>

            <!-- COLLECTION Preview: Items list (locked) -->
            <v-card
              v-else-if="contentType === 'collection'"
              class="rounded-0 rounded-md-lg"
              variant="flat"
            >
              <!-- Cover image -->
              <v-img
                v-if="collectionData?.coverUrl"
                class="blur-preview-light"
                cover
                height="200"
                :src="collectionData.coverUrl"
              >
                <v-overlay
                  contained
                  :model-value="true"
                  persistent
                  scrim="rgba(0,0,0,0.4)"
                >
                  <div class="text-center">
                    <v-icon color="white" size="60">mdi-folder-lock</v-icon>
                    <div class="text-h6 text-white mt-2">Premium Collection</div>
                  </div>
                </v-overlay>
              </v-img>

              <v-card-text class="pa-4">
                <div class="text-h5 font-weight-bold mb-2">{{ collectionData?.title || content.title }}</div>
                <div class="d-flex align-center text-body-2 text-medium-emphasis mb-4">
                  <span>{{ collectionData?.authorName || content.authorName }}</span>
                  <v-icon class="mx-2" size="4">mdi-circle</v-icon>
                  <span>{{ collectionData?.itemsCount || 0 }} items</span>
                </div>

                <!-- Locked items list -->
                <v-list class="bg-transparent" density="compact">
                  <v-list-item
                    v-for="n in Math.min(collectionData?.itemsCount || 5, 5)"
                    :key="n"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-avatar class="mr-3" color="grey-darken-3" rounded="lg" size="48">
                        <v-icon color="grey">mdi-lock</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="text-medium-emphasis">
                      Locked item {{ n }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-disabled">
                      Unlock collection to view
                    </v-list-item-subtitle>
                    <template #append>
                      <v-icon color="grey" size="small">mdi-lock</v-icon>
                    </template>
                  </v-list-item>
                </v-list>

                <v-alert
                  v-if="(collectionData?.itemsCount || 0) > 5"
                  class="mt-2"
                  density="compact"
                  type="info"
                  variant="tonal"
                >
                  + {{ (collectionData?.itemsCount || 0) - 5 }} more items
                </v-alert>
              </v-card-text>
            </v-card>

            <!-- Mobile: Paywall card inline -->
            <div class="d-md-none pa-4">
              <!-- Paywall Card -->
              <v-card class="rounded-lg" variant="outlined">
                <v-card-text class="pa-4">
                  <!-- Creator info -->
                  <div class="d-flex align-center mb-4">
                    <v-avatar
                      class="mr-3"
                      :color="content.authorAvatarUrl ? undefined : 'primary'"
                      :image="content.authorAvatarUrl"
                      size="48"
                    >
                      <span v-if="!content.authorAvatarUrl" class="text-h6">
                        {{ content.authorName?.charAt(0).toUpperCase() }}
                      </span>
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-1 font-weight-medium">
                        {{ content.authorName }}
                      </div>
                      <div class="text-body-2 text-medium-emphasis">
                        Creator
                      </div>
                    </div>
                  </div>

                  <!-- Price -->
                  <v-card class="mb-4" color="primary" variant="tonal">
                    <v-card-text class="d-flex align-center justify-space-between py-3">
                      <span class="text-body-2">Unlock price</span>
                      <span class="text-h5 font-weight-bold">{{ formatPrice(mockPrice) }}</span>
                    </v-card-text>
                  </v-card>

                  <!-- What's included -->
                  <div class="text-subtitle-2 font-weight-medium mb-2">What you get</div>
                  <v-list class="bg-transparent pa-0 mb-4" density="compact">
                    <v-list-item
                      v-for="(benefit, idx) in typeBenefits"
                      :key="idx"
                      class="px-0"
                    >
                      <template #prepend>
                        <v-icon class="mr-2" color="success" icon="mdi-check-circle" size="small" />
                      </template>
                      <v-list-item-title class="text-body-2">{{ benefit }}</v-list-item-title>
                    </v-list-item>
                  </v-list>

                  <!-- Unlock button -->
                  <v-btn
                    block
                    color="primary"
                    prepend-icon="mdi-lock-open"
                    size="large"
                    @click="openCheckout"
                  >
                    Unlock for {{ formatPrice(mockPrice) }}
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
          </v-container>
        </v-col>

        <!-- Right Column: Paywall Panel (Desktop, Sticky) -->
        <v-col class="d-none d-md-block" cols="12" lg="4" md="5">
          <v-container class="pa-4" fluid>
            <v-card class="rounded-lg position-sticky" style="top: 80px;" variant="outlined">
              <v-card-text class="pa-6">
                <!-- Creator info -->
                <div class="d-flex align-center mb-6">
                  <v-avatar
                    class="mr-4"
                    :color="content.authorAvatarUrl ? undefined : 'primary'"
                    :image="content.authorAvatarUrl"
                    size="56"
                  >
                    <span v-if="!content.authorAvatarUrl" class="text-h5">
                      {{ content.authorName?.charAt(0).toUpperCase() }}
                    </span>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-weight-medium">
                      {{ content.authorName }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      Creator
                    </div>
                  </div>
                </div>

                <!-- Price card -->
                <v-card class="mb-6" color="primary" variant="tonal">
                  <v-card-text class="d-flex align-center justify-space-between py-4">
                    <span class="text-body-1">Unlock price</span>
                    <span class="text-h4 font-weight-bold">{{ formatPrice(mockPrice) }}</span>
                  </v-card-text>
                </v-card>

                <!-- What's included -->
                <div class="text-subtitle-1 font-weight-medium mb-3">What you get</div>
                <v-list class="bg-transparent pa-0 mb-6" density="compact">
                  <v-list-item
                    v-for="(benefit, idx) in typeBenefits"
                    :key="idx"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon class="mr-3" color="success" icon="mdi-check-circle" size="small" />
                    </template>
                    <v-list-item-title class="text-body-1">{{ benefit }}</v-list-item-title>
                  </v-list-item>
                </v-list>

                <!-- Unlock button -->
                <v-btn
                  block
                  color="primary"
                  prepend-icon="mdi-lock-open"
                  size="x-large"
                  @click="openCheckout"
                >
                  Unlock for {{ formatPrice(mockPrice) }}
                </v-btn>

                <!-- Security note -->
                <div class="d-flex align-center justify-center mt-4 text-body-2 text-medium-emphasis">
                  <v-icon class="mr-1" size="small">mdi-shield-check</v-icon>
                  Secure payment via Stellar
                </div>
              </v-card-text>
            </v-card>
          </v-container>
        </v-col>
      </v-row>
    </template>

    <!-- Checkout Dialog -->
    <CheckoutDialog
      v-model="checkoutOpen"
      :item="checkoutItem"
      @purchased="onPurchased"
    />
  </div>
</template>

<script setup lang="ts">
  import type { CollectionModel, EntryModel } from '@/api/types/entryMock.types'

  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  import { api } from '@/api/api'
  import CheckoutDialog from '@/components/checkout/CheckoutDialog.vue'
  import { usePurchasesStore } from '@/stores/purchases'

  const route = useRoute()
  const router = useRouter()
  const purchasesStore = usePurchasesStore()

  // Route param
  const contentId = computed(() => {
    const params = route.params as { id?: string }
    return params.id ?? ''
  })

  // Content type can be passed via query param for testing
  const forcedType = computed(() => route.query.type as string | undefined)

  // State
  const content = ref<EntryModel | null>(null)
  const collectionData = ref<CollectionModel | null>(null)
  const loading = ref(true)
  const error = ref(false)
  const notFound = ref(false)
  const errorMessage = ref('')

  // Checkout state
  const checkoutOpen = ref(false)

  // Computed content type
  const contentType = computed((): 'video' | 'audio' | 'image' | 'entry' | 'collection' => {
    if (collectionData.value) return 'collection'
    return content.value?.type || 'entry'
  })

  // Mock data
  const mockPrice = computed(() => {
    const prices: Record<string, number> = {
      video: 5,
      audio: 2.5,
      image: 1,
      entry: 3,
      collection: 10,
    }
    return prices[contentType.value] || 3
  })

  const mockExcerpt = `This is a premium article that explores fascinating topics in depth.
The author shares unique insights and perspectives that you won't find anywhere else.
Unlock this content to discover the full story and support the creator's work.
Premium content helps creators continue producing quality work for their audience...`

  // Benefits per type
  const typeBenefits = computed(() => {
    const benefits: Record<string, string[]> = {
      video: ['Full HD streaming', 'Download in multiple formats', 'Lifetime access', 'Support the creator'],
      audio: ['High-quality audio (FLAC/MP3)', 'Download for offline', 'Lifetime access', 'Support the creator'],
      image: ['Full resolution download', 'Commercial use license', 'Lifetime access', 'Support the creator'],
      entry: ['Full article access', 'Future updates', 'No ads experience', 'Support the creator'],
      collection: ['Access to all items', 'Future additions included', 'Bulk discount applied', 'Lifetime access'],
    }
    return benefits[contentType.value] || benefits.entry
  })

  // Checkout item for dialog
  const checkoutItem = computed(() => {
    if (!content.value && !collectionData.value) return null

    const data = collectionData.value || content.value
    if (!data) return null

    return {
      id: contentId.value,
      title: data.title,
      creator: {
        name: data.authorName,
        avatar: data.authorAvatarUrl,
      },
      price: mockPrice.value,
      type: contentType.value,
      thumbnail: collectionData.value?.coverUrl || content.value?.thumbnailUrl,
    }
  })

  // Destination route mapping
  const destinationRoutes: Record<string, string> = {
    video: '/watch',
    audio: '/listen',
    image: '/view',
    entry: '/read',
    collection: '/collection',
  }

  // Format helpers
  function formatPrice (price: number): string {
    return `${price.toFixed(2)} XLM`
  }

  function formatDuration (seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function formatDate (date: string | Date): string {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Fetch content data
  async function fetchContent () {
    loading.value = true
    error.value = false
    notFound.value = false
    errorMessage.value = ''
    collectionData.value = null
    content.value = null

    // Check if already purchased - redirect to destination
    if (purchasesStore.isUnlocked(contentId.value)) {
      const purchase = purchasesStore.getPurchase(contentId.value)
      const targetRoute = destinationRoutes[purchase?.type || 'entry'] || '/read'
      router.replace(`${targetRoute}/${contentId.value}`)
      return
    }

    try {
      // Try to determine if this is a collection or entry
      // In production, we'd have a unified endpoint or type hint
      const isCollection = forcedType.value === 'collection' || contentId.value.startsWith('col-')

      if (isCollection) {
        const data = await api.mock.getCollectionById(contentId.value)
        collectionData.value = data
        // Create a pseudo-entry for common fields
        content.value = {
          id: data.id,
          type: 'entry',
          title: data.title,
          authorName: data.authorName,
          authorAvatarUrl: data.authorAvatarUrl,
          publishedAt: data.publishedAt,
          thumbnailUrl: data.coverUrl,
          locked: data.locked,
        }
      } else {
        const data = await api.mock.getEntryById(contentId.value, forcedType.value)
        content.value = data

        // If content is NOT locked, redirect to proper view page
        if (!data.locked) {
          const targetRoute = destinationRoutes[data.type] || '/read'
          router.replace(`${targetRoute}/${contentId.value}`)
          return
        }
      }
    } catch (error_: unknown) {
      console.error('[PreviewPage] Failed to fetch content:', error_)

      if (error_ && typeof error_ === 'object' && 'status' in error_ && (error_ as { status: number }).status === 404) {
        notFound.value = true
      } else {
        error.value = true
        errorMessage.value = error_ instanceof Error ? error_.message : 'An unexpected error occurred'
      }
    } finally {
      loading.value = false
    }
  }

  // Open checkout dialog
  function openCheckout () {
    checkoutOpen.value = true
  }

  // Handle successful purchase
  function onPurchased (itemId: string) {
    // Redirect to destination
    const targetRoute = destinationRoutes[contentType.value] || '/read'
    router.replace(`${targetRoute}/${itemId}`)
  }

  // Navigation
  function goBack () {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  function goHome () {
    router.push('/')
  }

  // Watch for route changes
  watch(contentId, () => {
    if (contentId.value) {
      fetchContent()
    }
  })

  // Initial load
  onMounted(() => {
    fetchContent()
  })
</script>

<style scoped>
/* Blur effect for locked previews - using Vuetify utility where possible */
.blur-preview :deep(.v-img__img) {
  filter: blur(20px);
  transform: scale(1.1);
}

.blur-preview-light :deep(.v-img__img) {
  filter: blur(8px);
  transform: scale(1.05);
}

/* Entry excerpt fade effect */
.entry-excerpt {
  max-height: 150px;
  overflow: hidden;
}

.excerpt-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(transparent, rgb(var(--v-theme-surface)));
  pointer-events: none;
}
</style>

<route lang="json">
{
  "path": "/preview/:id"
}
</route>
