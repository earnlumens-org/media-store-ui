<template>
  <v-container class="overflow-x-hidden pa-2 pa-sm-4 pa-md-6 mx-auto" fluid style="max-width: 1200px;">
    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="d-flex align-center ga-3 mb-4 mb-md-6">
      <v-btn
        icon="mdi-arrow-left"
        size="small"
        variant="text"
        @click="router.push('/creator-studio')"
      />
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold">
          {{ t('Subscribers.title') }}
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          {{ t('Subscribers.subtitle', { count: totalElements }) }}
        </p>
      </div>
    </div>

    <!-- Loading state -->
    <v-row v-if="loading" dense>
      <v-col
        v-for="n in 12"
        :key="`skeleton-${n}`"
        cols="12"
        lg="3"
        md="4"
        sm="6"
      >
        <v-skeleton-loader class="rounded-lg" type="list-item-avatar-two-line" />
      </v-col>
    </v-row>

    <!-- Error state -->
    <v-alert
      v-else-if="error"
      class="ma-4"
      closable
      :text="t('Subscribers.errorDescription')"
      :title="t('Subscribers.errorTitle')"
      type="error"
      @click:close="fetchSubscribers"
    />

    <!-- Empty state -->
    <v-row v-else-if="subscribers.length === 0" justify="center" no-gutters>
      <v-col cols="12" md="6">
        <v-empty-state
          icon="mdi-account-group-outline"
          :text="t('Subscribers.emptyDescription')"
          :title="t('Subscribers.empty')"
        />
      </v-col>
    </v-row>

    <!-- Subscribers grid -->
    <v-row v-else dense>
      <v-col
        v-for="item in subscribers"
        :key="item.userId"
        cols="12"
        lg="3"
        md="4"
        sm="6"
      >
        <v-card
          class="h-100"
          :to="`/${item.username}`"
          variant="outlined"
        >
          <v-card-text class="d-flex align-center ga-3">
            <v-avatar color="surface-variant" size="48">
              <v-img
                v-if="item.avatarUrl"
                :alt="item.displayName"
                :src="item.avatarUrl"
              />
              <v-icon v-else>mdi-account</v-icon>
            </v-avatar>
            <div class="flex-grow-1" style="min-width: 0">
              <div class="text-body-1 font-weight-medium text-truncate">
                {{ item.displayName || item.username }}
              </div>
              <div class="text-body-2 text-medium-emphasis text-truncate">
                @{{ item.username }}
              </div>
              <div v-if="item.subscribedAt" class="text-caption text-disabled">
                {{ t('Subscribers.since', { date: formatDate(item.subscribedAt) }) }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Load more -->
    <v-row v-if="hasMorePages && !loading" justify="center">
      <v-btn
        class="my-4"
        :loading="loadingMore"
        variant="outlined"
        @click="loadMore"
      >
        {{ t('Common.loadMore') }}
      </v-btn>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { SubscriptionUserModel } from '@/api/types/subscription.types'

  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'

  import { api } from '@/api/api'

  const { t } = useI18n()
  const router = useRouter()

  const subscribers = ref<SubscriptionUserModel[]>([])
  const loading = ref(true)
  const loadingMore = ref(false)
  const error = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)
  const totalElements = ref(0)

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  function formatDate (dateStr: string): string {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  async function fetchSubscribers () {
    loading.value = true
    error.value = false

    try {
      const response = await api.subscriptions.mySubscribers({ page: 0, size: 24 })
      subscribers.value = response.items
      currentPage.value = response.page
      totalElements.value = response.totalElements
      totalPages.value = Math.ceil(response.totalElements / Math.max(response.size, 1))
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  async function loadMore () {
    loadingMore.value = true
    try {
      const response = await api.subscriptions.mySubscribers({
        page: currentPage.value + 1,
        size: 24,
      })
      subscribers.value.push(...response.items)
      currentPage.value = response.page
      totalElements.value = response.totalElements
      totalPages.value = Math.ceil(response.totalElements / Math.max(response.size, 1))
    } catch {
      // Silently fail on load-more
    } finally {
      loadingMore.value = false
    }
  }

  onMounted(() => {
    fetchSubscribers()
  })
</script>

<route lang="json">
{
  "path": "/creator-studio/subscribers",
  "meta": { "requiresAuth": true }
}
</route>
