<template>
  <v-dialog v-model="dialog" scrollable width="auto">
    <template #activator="{ props }">
      <v-btn
        v-if="mobileView"
        v-bind="props"
        class="my-2 mr-1"
        icon="mdi-translate"
        size="small"
        variant="text"
      />

      <v-btn
        v-else
        v-bind="props"
        class="my-2"
        prepend-icon="mdi-translate"
        variant="text"
      >
        {{ $t("Common.language") }}
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="pb-2">
        <v-text-field
          v-model="search"
          clearable
          density="compact"
          hide-details
          :placeholder="$t('Common.language')"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
        />
      </v-card-title>
      <v-divider />

      <v-card-text ref="scrollEl" style="height: 300px">
        <v-radio-group v-model="selectedLanguage" column hide-details>
          <v-radio
            v-for="lang in filteredLanguages"
            :key="lang.code"
            :data-code="lang.code"
            :label="`${lang.native} (${$t('Language.' + lang.key)})`"
            :value="lang.code"
          />
        </v-radio-group>

        <div
          v-if="filteredLanguages.length === 0"
          class="text-medium-emphasis text-body-2 py-2"
        >
          {{ $t("Search.noResults") }}
        </div>
      </v-card-text>

      <template v-if="loggedIn">
        <v-divider />
        <v-list class="py-0" density="compact" nav>
          <v-list-item
            prepend-icon="mdi-web"
            :title="$t('ContentLanguagePreferences.title')"
            @click="openContentLanguages"
          />
        </v-list>
      </template>

      <v-divider />

      <v-card-actions>
        <v-btn color="primary" prepend-icon="mdi-close" variant="text" @click="dialog = false">
          {{ $t("Common.close") }}
        </v-btn>

        <v-btn
          class="ml-3"
          color="primary"
          prepend-icon="mdi-content-save"
          variant="text"
          @click="save"
        >
          {{ $t("Common.save") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <ContentLanguageDialog v-if="loggedIn" v-model="contentLangOpen" hide-activator />
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import ContentLanguageDialog from '@/components/ContentLanguageDialog.vue'
  import { determineLanguageCode, loadLanguage } from '@/main'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'

  // Ordered by approximate worldwide speaker population (native + L2). Closely
  // related variants are grouped together at the position of the higher-population
  // member: Chinese (zh-cn → zh-tw) and Malay/Indonesian (id → ms). `native` is
  // the autonym (endonym); `key` resolves the localized name via Language.*.
  const LANGUAGES: { code: string, native: string, key: string }[] = [
    { code: 'en', native: 'English', key: 'english' },
    { code: 'zh-cn', native: '简体中文', key: 'simplifiedChinese' },
    { code: 'zh-tw', native: '繁體中文', key: 'traditionalChinese' },
    { code: 'hi', native: 'हिंदी', key: 'hindi' },
    { code: 'es', native: 'Español', key: 'spanish' },
    { code: 'ar', native: 'عرب', key: 'arabic' },
    { code: 'fr', native: 'Français', key: 'french' },
    { code: 'bn', native: 'বাংলা', key: 'bengali' },
    { code: 'pt', native: 'Português', key: 'portuguese' },
    { code: 'ru', native: 'Русский', key: 'russian' },
    { code: 'ur', native: 'اردو', key: 'urdu' },
    { code: 'id', native: 'Bahasa Indonesia', key: 'indonesian' },
    { code: 'ms', native: 'Melayu', key: 'malay' },
    { code: 'pa', native: 'ਪੰਜਾਬੀ', key: 'punjabi' },
    { code: 'de', native: 'Deutsch', key: 'german' },
    { code: 'fa', native: 'فارسی', key: 'persian' },
    { code: 'ja', native: '日本語', key: 'japanese' },
    { code: 'te', native: 'తెలుగు', key: 'telugu' },
    { code: 'mr', native: 'मराठी', key: 'marathi' },
    { code: 'tr', native: 'Türkçe', key: 'turkish' },
    { code: 'ta', native: 'தமிழ்', key: 'tamil' },
    { code: 'vi', native: 'Tiếng Việt', key: 'vietnamese' },
    { code: 'ko', native: '한국어', key: 'korean' },
    { code: 'tl', native: 'Tagalog', key: 'tagalog' },
    { code: 'it', native: 'Italiano', key: 'italian' },
    { code: 'th', native: 'ไทย', key: 'thai' },
    { code: 'kn', native: 'ಕನ್ನಡ', key: 'kannada' },
    { code: 'gu', native: 'ગુજરાતી', key: 'gujarati' },
    { code: 'ps', native: 'پښتو', key: 'pashto' },
    { code: 'am', native: 'አማርኛ', key: 'amharic' },
    { code: 'pl', native: 'Polski', key: 'polish' },
    { code: 'my', native: 'မြန်မာ', key: 'burmese' },
    { code: 'uk', native: 'Українська', key: 'ukrainian' },
    { code: 'or', native: 'ଓଡ଼ିଆ', key: 'odia' },
    { code: 'ml', native: 'മലയാളം', key: 'malayalam' },
    { code: 'sd', native: 'سنڌي', key: 'sindhi' },
    { code: 'ne', native: 'नेपाली', key: 'nepali' },
    { code: 'lo', native: 'ລາວ', key: 'lao' },
    { code: 'nl', native: 'Nederlands', key: 'dutch' },
    { code: 'ro', native: 'română', key: 'romanian' },
    { code: 'si', native: 'සිංහල', key: 'sinhala' },
    { code: 'km', native: 'ខ្មែរ', key: 'khmer' },
    { code: 'el', native: 'Ελληνικά', key: 'greek' },
    { code: 'hu', native: 'magyar', key: 'hungarian' },
    { code: 'ht', native: 'Haitian Creole', key: 'haitianCreole' },
    { code: 'sr', native: 'српски', key: 'serbian' },
    { code: 'ug', native: 'ئۇيغۇرچە', key: 'uyghur' },
    { code: 'cs', native: 'čeština', key: 'czech' },
    { code: 'sv', native: 'svenska', key: 'swedish' },
    { code: 'ca', native: 'català', key: 'catalan' },
    { code: 'he', native: 'עברית', key: 'hebrew' },
    { code: 'ckb', native: 'کوردیی ناوەندی', key: 'soraniKurdish' },
    { code: 'bg', native: 'български', key: 'bulgarian' },
    { code: 'hy', native: 'Հայերեն', key: 'armenian' },
    { code: 'bo', native: 'བོད་སྐད་', key: 'tibetan' },
    { code: 'da', native: 'dansk', key: 'danish' },
    { code: 'fi', native: 'suomi', key: 'finnish' },
    { code: 'no', native: 'norsk', key: 'norwegian' },
    { code: 'ka', native: 'ქართული', key: 'georgian' },
    { code: 'lt', native: 'lietuvių', key: 'lithuanian' },
    { code: 'sl', native: 'slovenščina', key: 'slovenian' },
    { code: 'eo', native: 'Esperanto', key: 'esperanto' },
    { code: 'lv', native: 'latviešu', key: 'latvian' },
    { code: 'et', native: 'eesti', key: 'estonian' },
    { code: 'cy', native: 'Cymraeg', key: 'welsh' },
    { code: 'eu', native: 'euskara', key: 'basque' },
    { code: 'is', native: 'íslenska', key: 'icelandic' },
    { code: 'dv', native: 'ދިވެހި', key: 'divehi' },
  ]

  const dialog = ref(false)
  const contentLangOpen = ref(false)
  const selectedLanguage = ref('')
  const search = ref('')
  const scrollEl = ref<{ $el: HTMLElement } | null>(null)

  // PINIA store
  const appStore = useAppStore()
  const { mobileView } = storeToRefs(appStore)
  const authStore = useAuthStore()
  const { isAuthenticated: loggedIn } = storeToRefs(authStore)
  const { t } = useI18n()

  // Lowercase + strip diacritics so a query typed in plain ASCII (e.g.
  // "espanol", "francais") still matches accented autonyms ("Español",
  // "Français"). Non-Latin scripts fall back to a raw lowercase substring
  // match, so users can search in their own script too.
  function normalize (value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase()
  }

  const filteredLanguages = computed(() => {
    const q = normalize((search.value || '').trim())
    if (!q) return LANGUAGES
    return LANGUAGES.filter(lang => {
      const localized = t('Language.' + lang.key)
      return (
        normalize(lang.native).includes(q)
        || normalize(localized).includes(q)
        || lang.code.toLowerCase().includes(q)
      )
    })
  })

  // Bring the currently selected language into view, vertically centered in the
  // scroll area, so on reopen it isn't lost far down the (long) list.
  function scrollSelectedIntoView () {
    const root = scrollEl.value?.$el
    if (!root) return
    const target = root.querySelector<HTMLElement>(
      `[data-code="${CSS.escape(selectedLanguage.value)}"]`,
    )
    if (!target) return
    const rootRect = root.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    root.scrollTop
      += (targetRect.top - rootRect.top)
        - (root.clientHeight - target.clientHeight) / 2
  }

  watch(dialog, open => {
    if (open) {
      // Wait for the dialog content + transition to lay out before measuring.
      nextTick(() => requestAnimationFrame(scrollSelectedIntoView))
    } else {
      // Reset the filter when the dialog closes so it reopens on the full list.
      search.value = ''
    }
  })

  onMounted(() => {
    const browser = navigator.language || 'en'
    const stored = localStorage.getItem('selectedLanguage')
    selectedLanguage.value = stored || determineLanguageCode(browser)
  })

  function save () {
    dialog.value = false
    localStorage.setItem('selectedLanguage', selectedLanguage.value)
    loadLanguage(selectedLanguage.value)
  }

  function openContentLanguages () {
    dialog.value = false
    // Defer so the language dialog finishes its close transition before the
    // content-language dialog opens — avoids overlay z-index/focus glitches.
    setTimeout(() => {
      contentLangOpen.value = true
    }, 150)
  }
</script>
