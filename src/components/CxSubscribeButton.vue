<!--
  CxSubscribeButton — Subscribe/Unsubscribe toggle backed by the subscriptions store / API.

  Usage:
    <CxSubscribeButton target-user-id="abc-123" />
    <CxSubscribeButton target-user-id="abc-123" variant="icon" />
    <CxSubscribeButton target-user-id="abc-123" variant="block" />

  Variants:
    • "pill"   (default) — rounded pill button     ☐ Subscribe / ✓ Subscribed
    • "icon"   — icon-only button (compact spaces)
    • "block"  — full-width block button (profile sidebar, read page author card)
-->
<template>
  <!-- Own content → "Edit" button that navigates to Creator Studio -->
  <v-btn
    v-if="isOwn && variant === 'icon'"
    v-bind="$attrs"
    :aria-label="t('Common.edit')"
    color="primary"
    icon="mdi-pencil-outline"
    :size="size"
    variant="text"
    @click.stop="goToStudio"
  />

  <v-btn
    v-else-if="isOwn"
    v-bind="$attrs"
    :aria-label="t('Common.edit')"
    :block="variant === 'block'"
    color="primary"
    prepend-icon="mdi-pencil-outline"
    rounded="pill"
    :size="size"
    variant="flat"
    @click.stop="goToStudio"
  >
    {{ t('Common.edit') }}
  </v-btn>

  <!-- Other user → Subscribe / Unsubscribe toggle -->
  <v-btn
    v-else-if="variant === 'icon'"
    v-bind="$attrs"
    :aria-label="ariaLabel"
    :color="isSub ? 'primary' : undefined"
    :icon="isSub ? 'mdi-bell-check' : 'mdi-bell-plus-outline'"
    :loading="toggling"
    :size="size"
    variant="text"
    @click.stop="onToggle"
  />

  <v-btn
    v-else
    v-bind="$attrs"
    :aria-label="ariaLabel"
    :block="variant === 'block'"
    :color="isSub ? undefined : 'primary'"
    :loading="toggling"
    :prepend-icon="isSub ? 'mdi-bell-check' : 'mdi-bell-plus-outline'"
    rounded="pill"
    :size="size"
    :variant="isSub ? 'outlined' : 'flat'"
    @click.stop="onToggle"
  >
    {{ label }}
  </v-btn>

  <v-snackbar
    v-model="snackbar"
    :timeout="2000"
  >
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup lang="ts">
  defineOptions({ inheritAttrs: false })

  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'

  import { useAuthStore } from '@/stores/auth'
  import { useSubscriptionsStore } from '@/stores/subscriptions'

  interface Props {
    /** The user ID to subscribe to / unsubscribe from */
    targetUserId: string
    /** Visual variant: pill (default), icon, or block */
    variant?: 'pill' | 'icon' | 'block'
    /** Button size (Vuetify size prop) */
    size?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'pill',
    size: 'default',
  })

  const { t } = useI18n()
  const auth = useAuthStore()
  const router = useRouter()
  const subscriptionsStore = useSubscriptionsStore()

  const snackbar = ref(false)
  const snackbarText = ref('')
  const toggling = ref(false)

  /** True when the authenticated user is viewing their own content */
  const isOwn = computed(() => auth.isAuthenticated && auth.user?.id === props.targetUserId)

  const isSub = computed(() => subscriptionsStore.isSubscribed(props.targetUserId))

  const ariaLabel = computed(() =>
    isSub.value
      ? t('Common.unsubscribe')
      : t('Common.subscribe'),
  )

  const label = computed(() =>
    isSub.value
      ? t('Common.subscribed')
      : t('Common.subscribe'),
  )

  function goToStudio () {
    router.push('/creator-studio')
  }

  async function onToggle () {
    if (!auth.isAuthenticated) return
    // Prevent self-subscription (safety — UI should show "Edit" for own content)
    if (isOwn.value) {
      return
    }

    toggling.value = true
    try {
      const result = await subscriptionsStore.toggleSubscription(props.targetUserId)

      if (result != null) {
        snackbarText.value = result
          ? t('Common.subscribedNotification')
          : t('Common.unsubscribedNotification')
        snackbar.value = true
      }
    } finally {
      toggling.value = false
    }
  }
</script>
