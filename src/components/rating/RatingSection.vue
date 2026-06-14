<!--
  RatingSection — fraud-resistant like / dislike block for an entry or a collection.

  Roblox-style: users give a thumbs up (like) or thumbs down (dislike); the
  public score is the percentage of likes, shown above a split green/red bar.

  Anti-fraud / anti-abuse (enforced server-side, mirrored here):
    1. One vote per user per target — a user can switch like↔dislike but never
       stack votes (unique index + upsert on the backend).
    2. Voting requires authentication — the interactive controls are only
       shown to eligible users (`canRate`); anonymous callers are rejected
       with 401 by the API.
    3. Paid content requires a verified purchase to vote (403 otherwise).

  UX constraints (intentional):
    1. Cards never show the score — this block only lives on detail pages.
    2. Nothing about the aggregate is rendered until there is at least one
       vote (count > 0), avoiding unfair "0% liked" press.
-->
<template>
  <section v-if="visible" class="rating-section mt-6">
    <!-- Aggregate summary — only once the target has at least one vote -->
    <div v-if="hasAggregate" class="mb-4">
      <div class="d-flex flex-wrap align-center ga-3 mb-2">
        <div class="d-flex align-center ga-2">
          <v-icon color="success" size="22">mdi-thumb-up</v-icon>
          <span class="text-h5 font-weight-bold">{{ likePercentLabel }}</span>
        </div>
        <span class="text-body-2 text-medium-emphasis">
          {{ t('rating.basedOn', { count: aggregate!.count }, aggregate!.count) }}
        </span>
        <v-chip
          v-if="aggregate!.verifiedCount > 0"
          color="success"
          prepend-icon="mdi-shield-check"
          size="small"
          variant="tonal"
        >
          {{ t('rating.verifiedLikes', { value: verifiedLikePercentLabel, count: aggregate!.verifiedCount }) }}
        </v-chip>
      </div>

      <!-- Roblox-style split bar: green = likes, red = dislikes -->
      <div
        :aria-label="t('rating.barAria', { percent: likePercentLabel })"
        class="rating-bar"
        role="img"
      >
        <div class="rating-bar-likes" :style="{ width: aggregate!.likePercent + '%' }" />
        <div class="rating-bar-dislikes" :style="{ width: (100 - aggregate!.likePercent) + '%' }" />
      </div>

      <div class="d-flex justify-space-between mt-1">
        <span class="text-caption text-success d-flex align-center ga-1">
          <v-icon size="14">mdi-thumb-up</v-icon>{{ aggregate!.likes }}
        </span>
        <span class="text-caption text-error d-flex align-center ga-1">
          {{ aggregate!.dislikes }}<v-icon size="14">mdi-thumb-down</v-icon>
        </span>
      </div>
    </div>

    <!-- Current user's vote controls — eligible (authenticated) users only -->
    <v-card
      v-if="showSelector"
      class="mb-4"
      color="surface"
      variant="flat"
    >
      <v-card-text>
        <div class="text-subtitle-2 font-weight-medium mb-2">
          {{ myRating ? t('rating.yourVote') : t('rating.rateThis') }}
        </div>
        <div class="d-flex align-center ga-2 mb-3">
          <v-btn
            :color="draftLiked === true ? 'success' : undefined"
            :disabled="submitting"
            prepend-icon="mdi-thumb-up"
            :variant="draftLiked === true ? 'flat' : 'outlined'"
            @click="onVote(true)"
          >
            {{ t('rating.like') }}
          </v-btn>
          <v-btn
            :color="draftLiked === false ? 'error' : undefined"
            :disabled="submitting"
            prepend-icon="mdi-thumb-down"
            :variant="draftLiked === false ? 'flat' : 'outlined'"
            @click="onVote(false)"
          >
            {{ t('rating.dislike') }}
          </v-btn>
        </div>
        <v-textarea
          v-model="draftComment"
          auto-grow
          :counter="1000"
          :disabled="submitting || draftLiked === null"
          :label="t('rating.commentLabel')"
          :maxlength="1000"
          :placeholder="t('rating.commentPlaceholder')"
          rows="2"
          variant="outlined"
        />
        <div class="d-flex ga-2 justify-end">
          <v-btn
            v-if="myRating"
            :disabled="submitting"
            variant="text"
            @click="onRemove"
          >
            {{ t('rating.remove') }}
          </v-btn>
          <v-btn
            color="primary"
            :disabled="draftLiked === null"
            :loading="submitting"
            variant="flat"
            @click="onSubmit"
          >
            {{ myRating ? t('rating.update') : t('rating.submit') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Reviews list -->
    <div v-if="reviews.length > 0">
      <h3 class="text-subtitle-1 font-weight-bold mb-3">
        {{ t('rating.reviews') }}
      </h3>
      <div
        v-for="r in reviews"
        :key="r.id"
        class="rating-review mb-4"
      >
        <div class="d-flex align-center ga-2 mb-1">
          <v-icon
            :color="r.liked ? 'success' : 'error'"
            size="16"
          >
            {{ r.liked ? 'mdi-thumb-up' : 'mdi-thumb-down' }}
          </v-icon>
          <span class="text-body-2 font-weight-medium">
            {{ r.username || t('rating.anonymous') }}
          </span>
          <v-chip
            v-if="r.verified"
            color="success"
            density="comfortable"
            prepend-icon="mdi-shield-check"
            size="x-small"
            variant="tonal"
          >
            {{ t('rating.verifiedPurchase') }}
          </v-chip>
          <span class="text-caption text-medium-emphasis ms-auto">
            {{ formatDate(r.updatedAt || r.createdAt) }}
          </span>
        </div>
        <p v-if="r.comment" class="text-body-2 mt-1 mb-0 rating-review-comment">
          {{ r.comment }}
        </p>
      </div>

      <div v-if="hasMore" class="text-center">
        <v-btn
          :loading="loadingMore"
          variant="text"
          @click="loadMore"
        >
          {{ t('rating.loadMore') }}
        </v-btn>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import type { RatingAggregate, RatingItem, RatingTargetType } from '@/api/types/rating.types'

  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { api } from '@/api/api'
  import { ApiError } from '@/api/apiRequest'
  import { showGlobalNotification } from '@/services/globalNotification'

  interface Props {
    targetType: RatingTargetType
    targetId: string
    /** True when the current user is allowed to vote (auth + not owner + free/unlocked). */
    canRate?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    canRate: false,
  })

  const { t, locale } = useI18n()

  const PAGE_SIZE = 10

  const aggregate = ref<RatingAggregate | null>(null)
  const reviews = ref<RatingItem[]>([])
  const myRating = ref<RatingItem | null>(null)
  const page = ref(0)
  const hasMore = ref(false)
  const loadingMore = ref(false)
  const submitting = ref(false)

  /** null = not chosen yet, true = like, false = dislike. */
  const draftLiked = ref<boolean | null>(null)
  const draftComment = ref('')

  const hasAggregate = computed(() => !!aggregate.value && aggregate.value.count > 0)
  const showSelector = computed(() => props.canRate && !!props.targetId)
  // Render the whole block only when there is something meaningful to show:
  // an existing aggregate, existing reviews, or an eligible user who can vote.
  const visible = computed(() => hasAggregate.value || reviews.value.length > 0 || showSelector.value)

  const likePercentLabel = computed(() =>
    aggregate.value ? `${Math.round(aggregate.value.likePercent)}%` : '0%',
  )
  const verifiedLikePercentLabel = computed(() =>
    aggregate.value ? `${Math.round(aggregate.value.verifiedLikePercent)}%` : '0%',
  )

  function formatDate (date?: string): string {
    if (!date) return ''
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  async function loadAggregateAndReviews () {
    try {
      const list = await api.ratings.get(props.targetType, props.targetId, 0, PAGE_SIZE)
      aggregate.value = list.aggregate
      reviews.value = list.items
      page.value = list.page
      hasMore.value = list.hasMore
    } catch (error) {
      console.error('[RatingSection] Failed to load ratings:', error)
    }
  }

  async function loadMyRating () {
    if (!props.canRate) {
      myRating.value = null
      draftLiked.value = null
      draftComment.value = ''
      return
    }
    try {
      const mine = await api.ratings.mine(props.targetType, props.targetId)
      myRating.value = mine
      draftLiked.value = mine ? mine.liked : null
      draftComment.value = mine?.comment ?? ''
    } catch (error) {
      console.error('[RatingSection] Failed to load my rating:', error)
    }
  }

  async function loadMore () {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    try {
      const list = await api.ratings.get(props.targetType, props.targetId, page.value + 1, PAGE_SIZE)
      reviews.value = [...reviews.value, ...list.items]
      page.value = list.page
      hasMore.value = list.hasMore
    } catch (error) {
      console.error('[RatingSection] Failed to load more reviews:', error)
    } finally {
      loadingMore.value = false
    }
  }

  function onVote (liked: boolean) {
    if (submitting.value) return
    draftLiked.value = liked
  }

  async function onSubmit () {
    if (draftLiked.value === null || submitting.value) return
    submitting.value = true
    try {
      const res = await api.ratings.submit(props.targetType, props.targetId, {
        liked: draftLiked.value,
        comment: draftComment.value.trim() || undefined,
      })
      aggregate.value = res.aggregate
      myRating.value = res.rating
      showGlobalNotification('rating.saved')
      // Refresh the first page so the user's review appears in context.
      await loadAggregateAndReviews()
    } catch (error) {
      handleError(error)
    } finally {
      submitting.value = false
    }
  }

  async function onRemove () {
    if (submitting.value) return
    submitting.value = true
    try {
      await api.ratings.remove(props.targetType, props.targetId)
      myRating.value = null
      draftLiked.value = null
      draftComment.value = ''
      showGlobalNotification('rating.removed')
      await loadAggregateAndReviews()
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

  async function reload () {
    if (!props.targetId) return
    aggregate.value = null
    reviews.value = []
    myRating.value = null
    page.value = 0
    hasMore.value = false
    await Promise.all([loadAggregateAndReviews(), loadMyRating()])
  }

  watch(
    () => [props.targetId, props.canRate] as const,
    () => reload(),
    { immediate: true },
  )
</script>

<style scoped>
  .rating-bar {
    display: flex;
    width: 100%;
    height: 10px;
    border-radius: 5px;
    overflow: hidden;
    background-color: rgba(var(--v-theme-error), 0.25);
  }

  .rating-bar-likes {
    background-color: rgb(var(--v-theme-success));
    transition: width 0.3s ease;
  }

  .rating-bar-dislikes {
    background-color: rgb(var(--v-theme-error));
    transition: width 0.3s ease;
  }

  .rating-review-comment {
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
