<template>
  <v-container class="pa-0" fluid>
    <v-sheet class="px-6 py-6">
      <v-container>
        <v-row>
          <v-col>
            <v-card flat>
              <v-card-text class="d-flex align-center ga-3 pa-0">
                <v-icon color="primary" size="large">mdi-sparkles</v-icon>
                <div>
                  <div class="text-h6 font-weight-semibold">{{ $t('Themes.title') }}</div>
                  <div class="text-body-2 text-medium-emphasis">{{ $t('Themes.subtitle') }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>

    <v-divider />

    <v-container>
      <v-row>
        <v-col
          cols="12"
          :md="mobileView ? 12 : 3"
          :sm="mobileView ? 12 : 3"
        >
          <v-sheet :class="mobileView ? 'pa-1' : 'pa-4'">
            <CategoryList
              v-model="selectedCategoryKey"
              :categories="categories"
            />
          </v-sheet>
        </v-col>

        <v-col
          cols="12"
          :md="mobileView ? 12 : 9"
          :sm="mobileView ? 12 : 9"
        >
          <v-sheet class="pa-6">
            <v-row class="mb-4">
              <v-col>
                <div class="text-subtitle-1 font-weight-semibold">
                  {{ $t('Themes.categoryThemes', { category: selectedCategoryLabel }) }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ $t('Themes.themesAvailable', { count: filteredThemes.length }) }}
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col
                v-for="t in filteredThemes"
                :key="t.key"
                cols="12"
                lg="3"
                md="4"
                sm="6"
              >
                <ThemeCard
                  :colors="t.colors"
                  :description="$t('Themes.themeDescription.' + t.key)"
                  :name="t.name"
                  :selected="t.key === appStore.themeName"
                  :theme-key="t.key"
                  @apply="applyTheme"
                />
              </v-col>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>

    <v-snackbar
      v-model="snackbar"
      timeout="1500"
    >
      {{ $t('Themes.themeApplied') }}
    </v-snackbar>

    <!-- Desktop: Fixed button -->
    <v-btn
      v-if="canRevert && !mobileView"
      class="position-fixed"
      color="primary"
      prepend-icon="mdi-restore"
      size="large"
      style="bottom: 24px; right: 24px; z-index: 1000;"
      variant="elevated"
      @click="revertTheme"
    >
      {{ $t('Themes.revertTheme') }}
    </v-btn>

    <!-- Mobile: Footer -->
    <v-footer
      v-if="canRevert && mobileView"
      app
      class="pa-4"
      color="surface"
      elevation="8"
    >
      <v-btn
        block
        color="primary"
        prepend-icon="mdi-restore"
        size="large"
        variant="elevated"
        @click="revertTheme"
      >
        {{ $t('Themes.revertTheme') }}
      </v-btn>
    </v-footer>
  </v-container>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTheme } from 'vuetify'
  import CategoryList from '@/components/themes/CategoryList.vue'
  import ThemeCard from '@/components/themes/ThemeCard.vue'
  import { useAppStore } from '@/stores/app'

  type ThemeKey = string

  type SwatchColors = {
    background: string
    primary: string
    secondary: string
    accent: string
  }

  type ThemeItem = {
    key: ThemeKey
    name: string
    description: string
    colors: SwatchColors
  }

  type Category = {
    key: string
    themes: ThemeKey[]
  }

  const appStore = useAppStore()
  const { mobileView } = storeToRefs(appStore)
  const vuetifyTheme = useTheme()
  const { t } = useI18n()

  const snackbar = ref(false)
  const lastAppliedTheme = ref<ThemeKey | null>(null)

  function setTheme (name: string) {
    const maybeTheme = vuetifyTheme as unknown as { change?: (name: string) => void }
    if (typeof maybeTheme.change === 'function') {
      maybeTheme.change(name)
      return
    }

    vuetifyTheme.global.name.value = name
  }

  const THEME_ITEMS: ThemeItem[] = [
    // Education
    {
      key: 'academicClean',
      name: 'Academic Clean',
      description: 'Calm, focused learning',
      colors: { background: '#FFFFFF', primary: '#0969DA', secondary: '#6E7781', accent: '#8250DF' },
    },
    {
      key: 'nord',
      name: 'Nord',
      description: 'Structured, academic',
      colors: { background: '#ECEFF4', primary: '#88C0D0', secondary: '#81A1C1', accent: '#8FBCBB' },
    },
    {
      key: 'rosePineDawn',
      name: 'Rosé Pine Dawn',
      description: 'Warm, humanistic',
      colors: { background: '#FAF4ED', primary: '#B4637A', secondary: '#D7827E', accent: '#907AA9' },
    },

    // Finance / Tech
    {
      key: 'fintechPro',
      name: 'Fintech Pro',
      description: 'Professional, modern',
      colors: { background: '#060B14', primary: '#00D4AA', secondary: '#38BDF8', accent: '#A78BFA' },
    },
    {
      key: 'corporateClassic',
      name: 'Corporate Classic',
      description: 'Formal, executive',
      colors: { background: '#F5F7FA', primary: '#1E3A8A', secondary: '#64748B', accent: '#0891B2' },
    },
    {
      key: 'dracula',
      name: 'Dracula',
      description: 'Developer dark',
      colors: { background: '#282A36', primary: '#BD93F9', secondary: '#FF79C6', accent: '#8BE9FD' },
    },
    {
      key: 'gruvbox',
      name: 'Gruvbox',
      description: 'Retro developer',
      colors: { background: '#282828', primary: '#FABD2F', secondary: '#83A598', accent: '#D3869B' },
    },
    {
      key: 'solarizedDark',
      name: 'Solarized Dark',
      description: 'Readable classic',
      colors: { background: '#002B36', primary: '#268BD2', secondary: '#2AA198', accent: '#B58900' },
    },
    {
      key: 'catppuccinMocha',
      name: 'Catppuccin Mocha',
      description: 'Elegant coding',
      colors: { background: '#1E1E2E', primary: '#CBA6F7', secondary: '#89B4FA', accent: '#94E2D5' },
    },

    // Gaming
    {
      key: 'gamerArena',
      name: 'Gamer Arena',
      description: 'Competitive, high energy',
      colors: { background: '#070A12', primary: '#00C853', secondary: '#7C4DFF', accent: '#00B8D4' },
    },
    {
      key: 'tokyoNight',
      name: 'Tokyo Night',
      description: 'Neon gaming',
      colors: { background: '#1A1B26', primary: '#7AA2F7', secondary: '#BB9AF7', accent: '#73DACA' },
    },
    {
      key: 'synthwave84',
      name: 'Synthwave 84',
      description: 'Retro futuristic',
      colors: { background: '#262335', primary: '#FF7EDB', secondary: '#03EDF9', accent: '#FEDE5D' },
    },

    // Wellness
    {
      key: 'zen',
      name: 'Zen',
      description: 'Peaceful, mindful',
      colors: { background: '#F7F3EA', primary: '#6B8F71', secondary: '#A7C4A0', accent: '#C2A878' },
    },
    {
      key: 'earthGaia',
      name: 'Earth Gaia',
      description: 'Natural, organic',
      colors: { background: '#F4F7EE', primary: '#2F855A', secondary: '#4C9F70', accent: '#C2A14A' },
    },
    {
      key: 'mintFresh',
      name: 'Mint Fresh',
      description: 'Clean, refreshing',
      colors: { background: '#F1FFF8', primary: '#00897B', secondary: '#00796B', accent: '#26A69A' },
    },

    // Crypto / Future
    {
      key: 'cyberpunk',
      name: 'Cyberpunk',
      description: 'High-tech future',
      colors: { background: '#0D0221', primary: '#FF2A6D', secondary: '#05D9E8', accent: '#FAFF00' },
    },
    {
      key: 'cyberpunkNeon',
      name: 'Cyberpunk Neon',
      description: 'Ultra futuristic',
      colors: { background: '#06020A', primary: '#00F5D4', secondary: '#FF2A6D', accent: '#B6FF00' },
    },
    {
      key: 'matrix',
      name: 'Matrix',
      description: 'Hacker aesthetic',
      colors: { background: '#000000', primary: '#00FF41', secondary: '#00C853', accent: '#76FF03' },
    },
    {
      key: 'nebula',
      name: 'Nebula',
      description: 'Cosmic sci-fi',
      colors: { background: '#0B1020', primary: '#7C3AED', secondary: '#60A5FA', accent: '#22D3EE' },
    },
    {
      key: 'constellations',
      name: 'Constellations',
      description: 'Space elegance',
      colors: { background: '#070B1A', primary: '#A78BFA', secondary: '#38BDF8', accent: '#FDE047' },
    },

    // Art / Creative
    {
      key: 'neoBrutalArt',
      name: 'Neo Brutal Art',
      description: 'Bold, expressive',
      colors: { background: '#FFFEF9', primary: '#FF6B35', secondary: '#004E89', accent: '#F5E600' },
    },
    {
      key: 'creativeStudio',
      name: 'Creative Studio',
      description: 'Professional creative',
      colors: { background: '#F8FAFC', primary: '#3B82F6', secondary: '#6366F1', accent: '#F59E0B' },
    },
    {
      key: 'lavenderDreams',
      name: 'Lavender Dreams',
      description: 'Soft artistic',
      colors: { background: '#F7F4FF', primary: '#7B1FA2', secondary: '#8E24AA', accent: '#9C27B0' },
    },

    // Pop Culture / Cute
    {
      key: 'anime',
      name: 'Anime',
      description: 'Colorful, fun',
      colors: { background: '#FFF5F7', primary: '#FF3366', secondary: '#3357FF', accent: '#FFD700' },
    },
    {
      key: 'kawaiiPastel',
      name: 'Kawaii Pastel',
      description: 'Cute, playful',
      colors: { background: '#FFF0F6', primary: '#FF8CCB', secondary: '#FFB3C6', accent: '#FFD6A5' },
    },
    {
      key: 'softPastel',
      name: 'Soft Pastel',
      description: 'Gentle, sweet',
      colors: { background: '#FFF0F5', primary: '#D81B60', secondary: '#EC407A', accent: '#F06292' },
    },
    {
      key: 'roseQuartz',
      name: 'Rose Quartz',
      description: 'Romantic, soft',
      colors: { background: '#FFF5F8', primary: '#C2185B', secondary: '#D81B60', accent: '#E91E63' },
    },
    {
      key: 'skyBlush',
      name: 'Sky Blush',
      description: 'Dreamy',
      colors: { background: '#F0F8FF', primary: '#0277BD', secondary: '#0288D1', accent: '#039BE5' },
    },
    {
      key: 'peachCream',
      name: 'Peach Cream',
      description: 'Warm lifestyle',
      colors: { background: '#FFF8F0', primary: '#E64A19', secondary: '#FF5722', accent: '#FF7043' },
    },

    // Dark / Alternative
    {
      key: 'darkVoid',
      name: 'Dark Void',
      description: 'Deep dark',
      colors: { background: '#0A0A0F', primary: '#8B5CF6', secondary: '#6B21A8', accent: '#DC2626' },
    },
    {
      key: 'melancholy',
      name: 'Melancholy',
      description: 'Moody',
      colors: { background: '#0B1020', primary: '#6C8CFF', secondary: '#38BDF8', accent: '#A78BFA' },
    },
    {
      key: 'cozy',
      name: 'Cozy',
      description: 'Warm dark',
      colors: { background: '#1C1410', primary: '#D08C60', secondary: '#C9A227', accent: '#8BB174' },
    },
    {
      key: 'everforestDark',
      name: 'Everforest Dark',
      description: 'Natural dark',
      colors: { background: '#2D353B', primary: '#A7C080', secondary: '#83C092', accent: '#DBBC7F' },
    },

    // Productivity
    {
      key: 'nordDark',
      name: 'Nord Dark',
      description: 'Focus mode',
      colors: { background: '#2E3440', primary: '#88C0D0', secondary: '#81A1C1', accent: '#8FBCBB' },
    },
    {
      key: 'amoledGray',
      name: 'AMOLED Gray',
      description: 'Minimal dark',
      colors: { background: '#000000', primary: '#BB86FC', secondary: '#03DAC6', accent: '#8AB4F8' },
    },
    {
      key: 'amoledBlack',
      name: 'AMOLED Black',
      description: 'Pure black focus',
      colors: { background: '#000000', primary: '#BB86FC', secondary: '#03DAC6', accent: '#CF6679' },
    },

    // Business
    {
      key: 'institutional',
      name: 'Institutional',
      description: 'Formal authority',
      colors: { background: '#F4F6F8', primary: '#0F2A44', secondary: '#5C6F82', accent: '#C9A227' },
    },

    // Emotional / Lifestyle
    {
      key: 'motivation',
      name: 'Motivation',
      description: 'Energetic positive',
      colors: { background: '#FFF6E8', primary: '#FF6B6B', secondary: '#FFD93D', accent: '#4ECDC4' },
    },
    {
      key: 'vanillaLatte',
      name: 'Vanilla Latte',
      description: 'Warm cozy',
      colors: { background: '#FBF8F3', primary: '#5D4037', secondary: '#6D4C41', accent: '#795548' },
    },
    {
      key: 'lilacMist',
      name: 'Lilac Mist',
      description: 'Soft calm',
      colors: { background: '#FBF7FF', primary: '#8E24AA', secondary: '#9C27B0', accent: '#AB47BC' },
    },
    {
      key: 'coralSunset',
      name: 'Coral Sunset',
      description: 'Optimistic glow',
      colors: { background: '#FFF5F5', primary: '#D32F2F', secondary: '#E53935', accent: '#F44336' },
    },
    {
      key: 'butterscotch',
      name: 'Butterscotch',
      description: 'Comfort warm',
      colors: { background: '#FFFEF5', primary: '#F57C00', secondary: '#FB8C00', accent: '#FF9800' },
    },

    // Urban
    {
      key: 'urbanStreet',
      name: 'Urban Street',
      description: 'Street culture',
      colors: { background: '#0F1115', primary: '#FF3D00', secondary: '#FFD600', accent: '#2979FF' },
    },
  ]

  const CATEGORIES: Category[] = [
    { key: 'education', themes: ['academicClean', 'nord', 'rosePineDawn'] },
    { key: 'finance-tech', themes: ['fintechPro', 'corporateClassic', 'dracula', 'gruvbox', 'solarizedDark', 'catppuccinMocha'] },
    { key: 'gaming', themes: ['gamerArena', 'tokyoNight', 'synthwave84'] },
    { key: 'wellness', themes: ['zen', 'earthGaia', 'mintFresh'] },
    { key: 'crypto-future', themes: ['cyberpunk', 'cyberpunkNeon', 'matrix', 'nebula', 'constellations'] },
    { key: 'art-creative', themes: ['neoBrutalArt', 'creativeStudio', 'lavenderDreams'] },
    { key: 'pop-culture-cute', themes: ['anime', 'kawaiiPastel', 'softPastel', 'roseQuartz', 'skyBlush', 'peachCream'] },
    { key: 'dark-alternative', themes: ['darkVoid', 'melancholy', 'cozy', 'everforestDark'] },
    { key: 'productivity', themes: ['nordDark', 'amoledGray', 'amoledBlack'] },
    { key: 'business', themes: ['corporateClassic', 'institutional', 'fintechPro'] },
    { key: 'emotional-lifestyle', themes: ['motivation', 'vanillaLatte', 'lilacMist', 'coralSunset', 'butterscotch'] },
    { key: 'urban', themes: ['urbanStreet'] },
    { key: 'creative-pro', themes: ['creativeStudio', 'neoBrutalArt'] },
    { key: 'legal-institutional', themes: ['institutional'] },
  ]

  const DEFAULT_CATEGORY: Category = CATEGORIES[0] ?? { key: 'education', themes: [] }

  const selectedCategoryKey = ref(DEFAULT_CATEGORY.key)

  const categories = computed(() => CATEGORIES.map(c => ({ key: c.key, label: t(`Themes.category.${c.key}`) })))

  const selectedCategory = computed(() => CATEGORIES.find(c => c.key === selectedCategoryKey.value) ?? DEFAULT_CATEGORY)

  const selectedCategoryLabel = computed(() => t(`Themes.category.${selectedCategory.value.key}`))

  const themeByKey = computed(() => {
    const map = new Map<ThemeKey, ThemeItem>()
    for (const item of THEME_ITEMS) {
      map.set(item.key, item)
    }
    return map
  })

  const filteredThemes = computed(() => {
    const keys = selectedCategory.value.themes
    const uniqueKeys = Array.from(new Set(keys))
    return uniqueKeys
      .map(k => themeByKey.value.get(k))
      .filter((v): v is ThemeItem => v !== undefined)
  })

  function applyTheme (themeKey: ThemeKey) {
    if (themeKey === appStore.themeName) return

    lastAppliedTheme.value = appStore.themeName
    appStore.setThemeName(themeKey)
    localStorage.setItem('themeName', themeKey)
    setTheme(themeKey)

    snackbar.value = true
  }

  const canRevert = computed(() => {
    return lastAppliedTheme.value !== null && lastAppliedTheme.value !== appStore.themeName
  })

  function revertTheme () {
    if (!lastAppliedTheme.value) return

    const target = lastAppliedTheme.value
    lastAppliedTheme.value = null

    appStore.setThemeName(target)
    localStorage.setItem('themeName', target)
    setTheme(target)

    snackbar.value = true
  }
</script>
