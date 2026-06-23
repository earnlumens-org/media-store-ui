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
      <v-card-title>{{ $t("Common.language") }}</v-card-title>
      <v-divider />

      <v-card-text style="height: 300px">
        <v-radio-group v-model="selectedLanguage" column>
          <v-radio :label="`简体中文 (${$t('Language.simplifiedChinese')})`" value="zh-cn" />
          <v-radio :label="`繁體中文 (${$t('Language.traditionalChinese')})`" value="zh-tw" />
          <v-radio :label="`English (${$t('Language.english')})`" value="en" />
          <v-radio :label="`हिंदी (${$t('Language.hindi')})`" value="hi" />
          <v-radio :label="`عرب (${$t('Language.arabic')})`" value="ar" />
          <v-radio :label="`Español (${$t('Language.spanish')})`" value="es" />
          <v-radio :label="`Melayu (${$t('Language.malay')})`" value="ms" />
          <v-radio :label="`Русский (${$t('Language.russian')})`" value="ru" />
          <v-radio :label="`日本語 (${$t('Language.japanese')})`" value="ja" />
          <v-radio :label="`Português (${$t('Language.portuguese')})`" value="pt" />
          <v-radio :label="`Українська (${$t('Language.ukrainian')})`" value="uk" />
          <v-radio :label="`Deutsch (${$t('Language.german')})`" value="de" />
          <v-radio :label="`Français (${$t('Language.french')})`" value="fr" />
          <v-radio :label="`한국어 (${$t('Language.korean')})`" value="ko" />
          <v-radio :label="`Italiano (${$t('Language.italian')})`" value="it" />
          <v-radio :label="`Polski (${$t('Language.polish')})`" value="pl" />
          <v-radio :label="`Tiếng Việt (${$t('Language.vietnamese')})`" value="vi" />
          <v-radio :label="`Türkçe (${$t('Language.turkish')})`" value="tr" />
          <v-radio :label="`اردو (${$t('Language.urdu')})`" value="ur" />
          <v-radio :label="`বাংলা (${$t('Language.bengali')})`" value="bn" />
          <v-radio :label="`Bahasa Indonesia (${$t('Language.indonesian')})`" value="id" />
          <v-radio :label="`ਪੰਜਾਬੀ (${$t('Language.punjabi')})`" value="pa" />
          <v-radio :label="`فارسی (${$t('Language.persian')})`" value="fa" />
          <v-radio :label="`मराठी (${$t('Language.marathi')})`" value="mr" />
          <v-radio :label="`తెలుగు (${$t('Language.telugu')})`" value="te" />
          <v-radio :label="`Tagalog (${$t('Language.tagalog')})`" value="tl" />
          <v-radio :label="`தமிழ் (${$t('Language.tamil')})`" value="ta" />
          <v-radio :label="`བོད་སྐད་ (${$t('Language.tibetan')})`" value="bo" />
          <v-radio :label="`ไทย (${$t('Language.thai')})`" value="th" />
          <v-radio :label="`ಕನ್ನಡ (${$t('Language.kannada')})`" value="kn" />
          <v-radio :label="`ગુજરાતી (${$t('Language.gujarati')})`" value="gu" />
          <v-radio :label="`አማርኛ (${$t('Language.amharic')})`" value="am" />
          <v-radio :label="`پښتو (${$t('Language.pashto')})`" value="ps" />
          <v-radio :label="`မြန်မာ (${$t('Language.burmese')})`" value="my" />
          <v-radio :label="`ଓଡ଼ିଆ (${$t('Language.odia')})`" value="or" />
          <v-radio :label="`Nederlands (${$t('Language.dutch')})`" value="nl" />
          <v-radio :label="`മലയാളം (${$t('Language.malayalam')})`" value="ml" />
          <v-radio :label="`नेपाली (${$t('Language.nepali')})`" value="ne" />
          <v-radio :label="`سنڌي (${$t('Language.sindhi')})`" value="sd" />
          <v-radio :label="`ລາວ (${$t('Language.lao')})`" value="lo" />
          <v-radio :label="`română (${$t('Language.romanian')})`" value="ro" />
          <v-radio :label="`ខ្មែរ (${$t('Language.khmer')})`" value="km" />
          <v-radio :label="`සිංහල (${$t('Language.sinhala')})`" value="si" />
          <v-radio :label="`Ελληνικά (${$t('Language.greek')})`" value="el" />
          <v-radio :label="`čeština (${$t('Language.czech')})`" value="cs" />
          <v-radio :label="`magyar (${$t('Language.hungarian')})`" value="hu" />
          <v-radio :label="`svenska (${$t('Language.swedish')})`" value="sv" />
          <v-radio :label="`ئۇيغۇرچە (${$t('Language.uyghur')})`" value="ug" />
        </v-radio-group>
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
  import { onMounted, ref } from 'vue'
  import ContentLanguageDialog from '@/components/ContentLanguageDialog.vue'
  import { determineLanguageCode, loadLanguage } from '@/main'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'

  const dialog = ref(false)
  const contentLangOpen = ref(false)
  const selectedLanguage = ref('')

  // PINIA store
  const appStore = useAppStore()
  const { mobileView } = storeToRefs(appStore)
  const authStore = useAuthStore()
  const { isAuthenticated: loggedIn } = storeToRefs(authStore)

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
