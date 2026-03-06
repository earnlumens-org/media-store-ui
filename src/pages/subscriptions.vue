<template>
  <v-container class="py-4 px-1 px-sm-4" fluid>
    <!-- Loading state -->
    <v-row v-if="loading" dense>
      <v-col
        v-for="n in 12"
        :key="`skeleton-${n}`"
        cols="12"
        lg="3"
        md="4"
        sm="6"
        xxl="2"
      >
        <v-skeleton-loader class="rounded-lg" type="list-item-avatar-two-line" />
      </v-col>
    </v-row>

    <!-- Error state -->
    <v-alert
      v-else-if="error"
      class="ma-4"
      closable
      :text="$t('Subscriptions.errorDescription')"
      :title="$t('Subscriptions.errorTitle')"
      type="error"
      @click:close="fetchSubscriptions"
    />

    <!-- Login required -->
    <v-row v-else-if="!auth.isAuthenticated" justify="center">
      <v-col cols="12" md="6">
        <v-empty-state
          class="mt-8"
          icon="mdi-bell-outline"
          :text="$t('Subscriptions.loginRequiredDescription')"
          :title="$t('Subscriptions.loginRequired')"
        />
      </v-col>
    </v-row>

    <!-- Empty state -->
    <v-row v-else-if="subscriptions.length === 0" justify="center">
      <v-col cols="12" md="6">
        <v-empty-state
          class="mt-8"
          icon="mdi-bell-outline"
          :text="$t('Subscriptions.emptyDescription')"
          :title="$t('Subscriptions.empty')"
        />
      </v-col>
    </v-row>

    <!-- Subscriptions grid -->
    <v-row v-else dense>
      <v-col
        v-for="item in subscriptions"
        :key="item.userId"
        cols="12"
        lg="3"
        md="4"
        sm="6"
        xxl="2"
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
            </div>
            <CxSubscribeButton
              :size="$vuetify.display.smAndDown ? 'small' : 'default'"
              :target-user-id="item.userId"
              variant="pill"
              @click.prevent
            />
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
        {{ $t('Common.loadMore') }}
      </v-btn>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { SubscriptionUserModel } from '@/api/types/subscription.types'

  import { computed, onMounted, ref } from 'vue'

  import { api } from '@/api/api'
  import CxSubscribeButton from '@/components/CxSubscribeButton.vue'
  import { useAuthStore } from '@/stores/auth'

  const auth = useAuthStore()

  const subscriptions = ref<SubscriptionUserModel[]>([])
  const loading = ref(true)
  const loadingMore = ref(false)
  const error = ref(false)
  const currentPage = ref(0)
  const totalPages = ref(0)

  const hasMorePages = computed(() => currentPage.value < totalPages.value - 1)

  async function fetchSubscriptions () {
    if (!auth.isAuthenticated) {
      loading.value = false
      return
    }

    loading.value = true
    error.value = false

    try {
      const response = await api.subscriptions.mySubscriptions({ page: 0, size: 24 })
      subscriptions.value = response.items
      currentPage.value = response.page
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
      const response = await api.subscriptions.mySubscriptions({
        page: currentPage.value + 1,
        size: 24,
      })
      subscriptions.value.push(...response.items)
      currentPage.value = response.page
      totalPages.value = Math.ceil(response.totalElements / Math.max(response.size, 1))
    } catch {
      // Silently fail on load-more
    } finally {
      loadingMore.value = false
    }
  }

  onMounted(() => {
    fetchSubscriptions()
  })
</script>
