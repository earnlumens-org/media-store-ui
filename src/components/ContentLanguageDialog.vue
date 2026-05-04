<template>
  <v-dialog v-model="dialog" max-width="500" scrollable>
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-if="mobileView"
        v-bind="activatorProps"
        class="my-2 mr-1"
        :icon="iconName"
        size="small"
        :title="$t('ContentLanguagePreferences.chipTooltip')"
        variant="text"
        @click="onOpen"
      />

      <v-btn
        v-else
        v-bind="activatorProps"
        class="my-2"
        :prepend-icon="iconName"
        :title="$t('ContentLanguagePreferences.chipTooltip')"
        variant="text"
        @click="onOpen"
      >
        {{ chipLabel }}
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" icon="mdi-earth" />
        {{ $t("ContentLanguagePreferences.title") }}
      </v-card-title>
      <v-card-subtitle class="text-wrap pb-2">
        {{ $t("ContentLanguagePreferences.subtitle") }}
      </v-card-subtitle>
      <v-divider />

      <v-card-text>
        <!-- Show-all toggle: prominent escape hatch -->
        <v-switch
          v-model="form.showAllLanguages"
          color="primary"
          density="comfortable"
          hide-details
          inset
          :label="$t('ContentLanguagePreferences.showAll')"
        />
        <p class="text-caption text-medium-emphasis mt-1 mb-3">
          {{ $t("ContentLanguagePreferences.showAllHint") }}
        </p>

        <v-divider class="mb-4" />

        <!-- Language picker (disabled when "show all" is on) -->
        <div :class="{ 'opacity-50': form.showAllLanguages }">
          <p class="text-subtitle-2 mb-2">
            {{ $t("ContentLanguagePreferences.yourLanguages") }}
          </p>
          <v-autocomplete
            v-model="form.contentLanguages"
            chips
            closable-chips
            :disabled="form.showAllLanguages"
            hide-details
            item-title="title"
            item-value="value"
            :items="languageItems"
            multiple
            :placeholder="$t('ContentLanguagePreferences.pickerPlaceholder')"
            variant="outlined"
          />
          <p class="text-caption text-medium-emphasis mt-2 mb-4">
            {{ $t("ContentLanguagePreferences.yourLanguagesHint") }}
          </p>

          <v-divider class="mb-3" />

          <!-- Include "multi" content toggle -->
          <v-switch
            v-model="form.includeMulti"
            color="primary"
            density="comfortable"
            :disabled="form.showAllLanguages"
            hide-details
            inset
            :label="$t('ContentLanguagePreferences.includeMulti')"
          />
          <p class="text-caption text-medium-emphasis mt-1 mb-0">
            {{ $t("ContentLanguagePreferences.includeMultiHint") }}
          </p>
        </div>

        <!-- Footgun warning: empty langs + no multi + filter on = empty feed -->
        <v-alert
          v-if="warnEmptyFeed"
          class="mt-4"
          density="compact"
          type="warning"
          variant="tonal"
        >
          {{ $t("ContentLanguagePreferences.warnEmpty") }}
        </v-alert>

        <v-alert
          v-if="prefsStore.error"
          class="mt-4"
          density="compact"
          type="error"
          variant="tonal"
        >
          {{ prefsStore.error }}
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          :disabled="prefsStore.saving"
          prepend-icon="mdi-close"
          variant="text"
          @click="onCancel"
        >
          {{ $t("Common.cancel") }}
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          :disabled="!isDirty || prefsStore.saving || warnEmptyFeed"
          :loading="prefsStore.saving"
          prepend-icon="mdi-content-save"
          variant="flat"
          @click="onSave"
        >
          {{ $t("Common.save") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { CONTENT_LANGUAGES } from '@/config/contentLanguages'
  import { useAppStore } from '@/stores/app'
  import { useContentLanguagePreferencesStore } from '@/stores/contentLanguagePreferences'

  const { t } = useI18n()
  const appStore = useAppStore()
  const { mobileView } = storeToRefs(appStore)
  const prefsStore = useContentLanguagePreferencesStore()

  const dialog = ref(false)

  // Local working copy of the form so the user can cancel without persisting.
  const form = reactive({
    contentLanguages: [] as string[],
    includeMulti: true,
    showAllLanguages: false,
  })

  const languageItems = CONTENT_LANGUAGES // already excludes "multi" (reserved)

  const iconName = computed(() => prefsStore.showAllLanguages
    ? 'mdi-earth'
    : 'mdi-earth-arrow-right')

  const chipLabel = computed(() => {
    if (prefsStore.showAllLanguages) {
      return t('ContentLanguagePreferences.chipAll')
    }
    const langs = prefsStore.contentLanguages
    if (langs.length === 0) {
      return prefsStore.includeMulti
        ? t('ContentLanguagePreferences.chipMultiOnly')
        : t('ContentLanguagePreferences.chipNone')
    }
    const head = langs.slice(0, 2).map(l => l.toUpperCase()).join(', ')
    const tail = langs.length > 2 ? ` +${langs.length - 2}` : ''
    return head + tail
  })

  const isDirty = computed(() =>
    form.showAllLanguages !== prefsStore.showAllLanguages
    || form.includeMulti !== prefsStore.includeMulti
    || form.contentLanguages.length !== prefsStore.contentLanguages.length
    || form.contentLanguages.some((l, i) => l !== prefsStore.contentLanguages[i]),
  )

  // The configuration "no languages + no multi + filter on" yields an empty
  // feed. We block save with a warning rather than silently break the UX.
  const warnEmptyFeed = computed(() =>
    !form.showAllLanguages
    && form.contentLanguages.length === 0
    && !form.includeMulti,
  )

  function syncFormFromStore () {
    form.contentLanguages = [...prefsStore.contentLanguages]
    form.includeMulti = prefsStore.includeMulti
    form.showAllLanguages = prefsStore.showAllLanguages
  }

  // Re-sync the form whenever the store finishes loading (e.g. after the
  // initial /me fetch completes while the dialog is closed).
  watch(() => prefsStore.loaded, loaded => {
    if (loaded && !dialog.value) {
      syncFormFromStore()
    }
  }, { immediate: true })

  async function onOpen () {
    await prefsStore.loadIfNeeded()
    syncFormFromStore()
  }

  function onCancel () {
    dialog.value = false
    syncFormFromStore()
  }

  async function onSave () {
    try {
      await prefsStore.update({
        contentLanguages: form.contentLanguages,
        includeMulti: form.includeMulti,
        showAllLanguages: form.showAllLanguages,
      })
      dialog.value = false
    } catch {
      // Error surfaced via prefsStore.error in the alert above; keep dialog open.
    }
  }
</script>
