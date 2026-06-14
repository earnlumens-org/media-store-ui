<!--
  RatingPill — compact like / dislike control for an entry or collection.

  A single rounded pill: thumbs-up · like-percentage · thumbs-down. The
  percentage is the public aggregate; the thumbs are the interactive vote.

  Anti-fraud / anti-abuse (enforced server-side, mirrored here):
    1. One vote per user per target — clicking your current vote removes it,
       clicking the other switches it; votes never stack (unique index on the
       backend).
    2. Voting requires authentication — an anonymous click shows a sign-in hint
       and never hits the API destructively (the API also returns 401).
    3. Paid content requires a verified purchase (403 otherwise).

  Emits `update:count` so a parent can render the vote total elsewhere
  (e.g. "12.5K views • 320 votes").
-->
<template>
  <!-- No votes yet: two separate, standalone thumb buttons. -->
  <div v-if="!hasVotes" class="d-inline-flex align-center ga-1">
    <v-btn
      :aria-label="t('rating.like')"
      :color="myLiked === true ? 'success' : undefined"
      :disabled="submitting"
      icon
      rounded="pill"
      size="small"
      variant="text"
      @click="vote(true)"
    >
      <v-icon>{{ myLiked === true ? 'mdi-thumb-up' : 'mdi-thumb-up-outline' }}</v-icon>
    </v-btn>
    <v-btn
      :aria-label="t('rating.dislike')"
      :color="myLiked === false ? 'error' : undefined"
      :disabled="submitting"
      icon
      rounded="pill"
      size="small"
      variant="text"
      @click="vote(false)"
    >
      <v-icon>{{ myLiked === false ? 'mdi-thumb-down' : 'mdi-thumb-down-outline' }}</v-icon>
    </v-btn>
  </div>

  <!-- At least one vote: compact Roblox-style pill with the like percentage. -->
  <v-sheet
    v-else
    class="rating-pill d-inline-flex align-center"
    color="surface"
    rounded="pill"
  >
    <v-btn
      :aria-label="t('rating.like')"
      :color="myLiked === true ? 'success' : undefined"
      density="comfortable"
      :disabled="submitting"
      icon
      size="small"
      variant="text"
      @click="vote(true)"
    >
      <v-icon>{{ myLiked === true ? 'mdi-thumb-up' : 'mdi-thumb-up-outline' }}</v-icon>
    </v-btn>

    <span class="rating-pill-percent text-body-2 font-weight-medium px-1">
      {{ likePercentLabel }}
    </span>

    <div class="rating-pill-divider" />

    <v-btn
      :aria-label="t('rating.dislike')"
      :color="myLiked === false ? 'error' : undefined"
      density="comfortable"
      :disabled="submitting"
      icon
      size="small"
      variant="text"
      @click="vote(false)"
    >
      <v-icon>{{ myLiked === false ? 'mdi-thumb-down' : 'mdi-thumb-down-outline' }}</v-icon>
    </v-btn>
  </v-sheet>
</template>

<script setup lang="ts">
  import type { RatingTargetType } from '@/api/types/rating.types'

  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { api } from '@/api/api'
  import { ApiError } from '@/api/apiRequest'
  import { showGlobalNotification } from '@/services/globalNotification'
  import { useAuthStore } from '@/stores/auth'

  interface Props {
    targetType: RatingTargetType
    targetId: string
    /** True when the current user is allowed to vote (auth + not owner + free/unlocked). */
    canRate?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    canRate: false,
  })

  const emit = defineEmits<{
    (e: 'update:count', value: number): void
  }>()

  const { t } = useI18n()
  const authStore = useAuthStore()

  const likes = ref(0)
  const dislikes = ref(0)
  /** null = not voted, true = liked, false = disliked. */
  const myLiked = ref<boolean | null>(null)
  const submitting = ref(false)

  const count = computed(() => likes.value + dislikes.value)
  const hasVotes = computed(() => count.value > 0)
  const likePercent = computed(() =>
    count.value === 0 ? 0 : Math.round((likes.value / count.value) * 100),
  )
  const likePercentLabel = computed(() => `${likePercent.value}%`)

  // Keep the parent's vote count in sync with the local tally.
  watch(count, c => emit('update:count', c), { immediate: true })

  function applyAggregate (aggLikes: number, aggDislikes: number) {
    likes.value = aggLikes
    dislikes.value = aggDislikes
  }

  async function loadSummary () {
    try {
      const agg = await api.ratings.summary(props.targetType, props.targetId)
      applyAggregate(agg.likes, agg.dislikes)
    } catch (error) {
      console.error('[RatingPill] Failed to load summary:', error)
    }
  }

  async function loadMyVote () {
    if (!props.canRate) {
      myLiked.value = null
      return
    }
    try {
      const mine = await api.ratings.mine(props.targetType, props.targetId)
      myLiked.value = mine ? mine.liked : null
    } catch (error) {
      console.error('[RatingPill] Failed to load my vote:', error)
    }
  }

  async function vote (liked: boolean) {
    if (submitting.value) return

    if (!authStore.isAuthenticated) {
      showGlobalNotification('rating.loginRequired')
      return
    }

    submitting.value = true
    try {
      if (myLiked.value === liked) {
        // Clicking the current vote removes it. The DELETE returns no body, so
        // we adjust the tally locally instead of re-reading a possibly-stale
        // aggregate from a replica.
        await api.ratings.remove(props.targetType, props.targetId)
        if (myLiked.value === true) {
          likes.value = Math.max(0, likes.value - 1)
        } else if (myLiked.value === false) {
          dislikes.value = Math.max(0, dislikes.value - 1)
        }
        myLiked.value = null
      } else {
        const res = await api.ratings.submit(props.targetType, props.targetId, { liked })
        myLiked.value = res.rating.liked
        applyAggregate(res.aggregate.likes, res.aggregate.dislikes)
      }
    } catch (error) {
      handleError(error)
    } finally {
      submitting.value = false
    }
  }

  function handleError (error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        showGlobalNotification('rating.loginRequired')
        return
      }
      if (error.status === 403) {
        showGlobalNotification('rating.purchaseRequired')
        return
      }
      if (error.status === 429) {
        showGlobalNotification('rating.dailyLimit')
        return
      }
      const code = (error.data as { error?: string })?.error
      if (code === 'CANNOT_RATE_OWN_CONTENT') {
        showGlobalNotification('rating.ownContent')
        return
      }
    }
    showGlobalNotification('rating.error')
  }

  function reload () {
    if (!props.targetId) {
      applyAggregate(0, 0)
      myLiked.value = null
      return
    }
    loadSummary()
    loadMyVote()
  }

  watch(
    () => [props.targetId, props.canRate] as const,
    () => reload(),
    { immediate: true },
  )
</script>

<style scoped>
  .rating-pill {
    padding-inline: 4px;
  }

  .rating-pill-percent {
    min-width: 40px;
    text-align: center;
  }

  .rating-pill-divider {
    width: 1px;
    height: 20px;
    background-color: rgba(var(--v-border-color), var(--v-border-opacity));
  }
</style>
