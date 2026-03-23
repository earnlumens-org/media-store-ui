<template>
  <v-sheet class="position-relative" height="84">
    <v-card-text class="px-1 pt-2 pb-0 d-flex align-start">
      <router-link
        v-if="showAuthor"
        class="me-4 flex-shrink-0"
        :to="`/${collection.authorName}`"
      >
        <AvatarFrame
          :size="48"
          :src="collection.authorAvatarUrl"
        />
      </router-link>

      <div class="flex-grow-1 overflow-hidden">
        <router-link
          class="text-body-1 font-weight-medium text-medium-emphasis text-decoration-none d-block"
          style="color: inherit"
          :to="`/collection/${collection.id}`"
        >
          <div
            ref="titleRef"
            :style="{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }"
          >
            {{ collection.title }}
          </div>
        </router-link>

        <!-- Título 1 línea: username ocupa su propia fila -->
        <div
          v-if="showAuthor && !isTitleMultiLine"
          class="mt-1 d-flex align-center overflow-hidden"
          style="min-width: 0"
        >
          <router-link
            class="text-body-1 font-weight-medium text-decoration-none text-truncate"
            style="color: inherit"
            :to="`/${collection.authorName}`"
          >
            {{ collection.authorName }}
          </router-link>
          <v-avatar
            v-if="profileBadgeSrc"
            class="ms-2 flex-shrink-0"
            color="transparent"
            size="18"
          >
            <v-img :src="profileBadgeSrc" />
          </v-avatar>
        </div>
      </div>

      <!-- Título 2 líneas: username + fecha en la misma fila -->
      <div
        v-if="showAuthor && isTitleMultiLine"
        class="position-absolute d-flex align-center justify-space-between"
        style="bottom: 4px; left: 68px; right: 4px"
      >
        <div class="d-flex align-center overflow-hidden" style="min-width: 0">
          <router-link
            class="text-body-1 font-weight-medium text-decoration-none text-truncate"
            style="color: inherit"
            :to="`/${collection.authorName}`"
          >
            {{ collection.authorName }}
          </router-link>
          <v-avatar
            v-if="profileBadgeSrc"
            class="ms-2 flex-shrink-0"
            color="transparent"
            size="18"
          >
            <v-img :src="profileBadgeSrc" />
          </v-avatar>
        </div>
        <span class="text-caption text-medium-emphasis flex-shrink-0 mx-3 text-no-wrap">{{ formattedDate }}</span>
      </div>

      <!-- Fecha sola en la esquina inferior derecha (con autor, título 1 línea) -->
      <span
        v-if="showAuthor && !isTitleMultiLine"
        class="position-absolute text-caption text-medium-emphasis text-no-wrap"
        style="bottom: 4px; right: 4px"
      >
        {{ formattedDate }}
      </span>

      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            class="mt-2"
            density="compact"
            icon="mdi-dots-vertical"
            variant="text"
          />
        </template>

        <v-list density="compact">
          <v-list-item @click="onShare">
            <template #prepend>
              <v-icon icon="mdi-share-variant" size="small" />
            </template>
            {{ $t('Common.share') }}
          </v-list-item>
          <v-list-item @click="onToggleFavorite">
            <template #prepend>
              <v-icon :icon="isFav ? 'mdi-heart' : 'mdi-heart-outline'" size="small" />
            </template>
            {{ isFav ? $t('Common.removeFromFavorites') : $t('Common.saveToFavorites') }}
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon icon="mdi-flag" size="small" />
            </template>
            {{ $t('Common.report') }}
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-text>

    <v-snackbar
      v-model="snackbar"
      :timeout="2000"
    >
      {{ snackbarText }}
    </v-snackbar>

    <div
      v-if="!showAuthor"
      class="position-absolute bottom-0 left-0 ml-2 mb-1 text-caption text-medium-emphasis"
    >
      <span v-if="collection.itemsCount">{{ collection.itemsCount }} items</span>
      <span v-else>{{ collection.collectionType }}</span>
    </div>

    <div
      v-if="!showAuthor"
      class="position-absolute bottom-0 right-0 mr-2 mb-0 text-caption text-medium-emphasis"
    >
      {{ formattedDate }}
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
  import type { Collection } from './CollectionCard.vue'

  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import AvatarFrame from '@/components/media/AvatarFrame.vue'

  import { getProfileBadgeSrc } from '@/lib/profileBadge'
  import { useShare } from '@/lib/useShare'
  import { useAuthStore } from '@/stores/auth'
  import { useFavoritesStore } from '@/stores/favorites'

  interface Props {
    collection: Collection
    showAuthor?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    showAuthor: true,
  })

  const { t } = useI18n()
  const auth = useAuthStore()
  const favoritesStore = useFavoritesStore()

  const snackbar = ref(false)
  const snackbarText = ref('')

  // Detección de líneas del título (one-shot + watch para infinite scroll)
  const titleRef = ref<HTMLElement>()
  const isTitleMultiLine = ref(false)

  function checkTitleLines () {
    const el = titleRef.value
    if (el) {
      const lh = Number.parseFloat(getComputedStyle(el).lineHeight)
      isTitleMultiLine.value = el.scrollHeight > lh * 1.5
    }
  }

  onMounted(checkTitleLines)

  watch(() => props.collection.title, () => nextTick(checkTitleLines))

  const { share } = useShare(snackbar, snackbarText)

  const isFav = computed(() => favoritesStore.isFavorite(props.collection.id))

  async function onToggleFavorite () {
    if (!auth.isAuthenticated) return

    const result = await favoritesStore.toggleFavorite(props.collection.id, 'COLLECTION')

    if (result != null) {
      snackbarText.value = result
        ? t('Common.addedToFavorites')
        : t('Common.removedFromFavorites')
      snackbar.value = true
    }
  }

  function onShare () {
    const url = `${window.location.origin}/collection/${props.collection.id}`
    share(props.collection.title, url)
  }

  const formattedDate = computed(() => {
    if (!props.collection.publishedAt) return ''

    const date = props.collection.publishedAt instanceof Date
      ? props.collection.publishedAt
      : new Date(props.collection.publishedAt)

    if (Number.isNaN(date.getTime())) return ''

    return date.toLocaleDateString('en-CA')
  })

  const profileBadgeSrc = computed(() => getProfileBadgeSrc(props.collection.profileBadge))
</script>
