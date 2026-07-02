<route lang="json">
  { "path": "/my-franchise" }
</route>

<template>
  <v-container class="py-8" style="max-width: 760px;">
    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="d-flex align-center ga-3 mb-6">
      <v-btn
        icon="mdi-arrow-left"
        size="small"
        variant="text"
        @click="router.push('/account')"
      />
      <div>
        <h1 class="text-h5 font-weight-bold">{{ t('MyFranchise.title') }}</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">{{ t('MyFranchise.subtitle') }}</p>
      </div>
    </div>

    <!-- ── Not authenticated ───────────────────────────────── -->
    <v-card v-if="authReady && !isAuthenticated" variant="tonal">
      <v-card-text class="text-center py-10">
        <v-icon class="mb-3" color="medium-emphasis" size="48">mdi-account-lock-outline</v-icon>
        <p class="text-body-1 mb-4">{{ t('MyFranchise.loginRequired') }}</p>
        <CxLoginDialog />
      </v-card-text>
    </v-card>

    <!-- ── Loading ─────────────────────────────────────────── -->
    <div v-else-if="!authReady || loading" class="text-center py-12">
      <v-progress-circular color="primary" indeterminate size="48" />
    </div>

    <!-- ── Load error ──────────────────────────────────────── -->
    <v-alert v-else-if="loadError" type="error" variant="tonal">
      {{ loadError }}
      <template #append>
        <v-btn size="small" variant="text" @click="loadAll">{{ t('Franchise.retry') }}</v-btn>
      </template>
    </v-alert>

    <!-- ── Manage existing franchises ──────────────────── -->
    <template v-else-if="mine && !creating">
      <!-- Franchise switcher + create-another (limit enforced server-side) -->
      <v-card class="mb-4" variant="outlined">
        <v-card-text class="d-flex align-center flex-wrap ga-2 py-3">
          <v-chip
            v-for="f in mineList"
            :key="f.id"
            :color="f.id === selectedId ? 'primary' : undefined"
            :variant="f.id === selectedId ? 'flat' : 'tonal'"
            @click="selectFranchise(f.id)"
          >
            <v-icon size="14" start>mdi-storefront-outline</v-icon>
            {{ f.title || f.slug }}
          </v-chip>
          <v-spacer />
          <v-btn
            v-if="canCreateMore"
            prepend-icon="mdi-plus"
            size="small"
            variant="tonal"
            @click="startCreate"
          >{{ t('MyFranchise.createAnother') }}</v-btn>
          <span
            v-else-if="config && mineList.length >= config.maxFranchisesPerUser"
            class="text-caption text-medium-emphasis"
          >
            {{ t('MyFranchise.limitReached', { max: config.maxFranchisesPerUser }) }}
          </span>
        </v-card-text>
      </v-card>

      <!-- Live preview of the franchise storefront header -->
      <div class="text-caption text-medium-emphasis mb-1">{{ t('MyFranchise.previewTitle') }}</div>
      <v-card class="mb-4 overflow-hidden" variant="outlined">
        <div class="fp-hero" :style="previewHeroStyle">
          <div class="fp-hero__overlay pa-4">
            <div class="d-flex align-center ga-3">
              <v-avatar v-if="previewLogoUrl" class="fp-hero__logo" rounded="lg" size="56">
                <v-img :alt="previewTitle" cover :src="previewLogoUrl" />
              </v-avatar>
              <v-avatar
                v-else
                class="fp-hero__logo"
                color="surface-variant"
                rounded="lg"
                size="56"
              >
                <v-icon>mdi-storefront-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">{{ previewTitle }}</div>
                <div class="text-caption text-medium-emphasis">
                  <v-icon class="me-1" icon="mdi-check-decagram" size="14" />
                  {{ t('Franchise.officialOf', { tenant: tenantBrand }) }}
                </div>
              </div>
            </div>
            <p v-if="previewDescription" class="text-body-2 mt-3 mb-0">{{ previewDescription }}</p>
          </div>
        </div>
      </v-card>

      <v-alert
        v-if="mine.status === 'DISABLED'"
        class="mb-4"
        type="warning"
        variant="tonal"
      >
        <div class="text-subtitle-2 mb-1">{{ t('MyFranchise.disabledTitle') }}</div>
        <div v-if="mine.disabledReason" class="text-body-2">{{ mine.disabledReason }}</div>
      </v-alert>

      <v-card class="mb-4">
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="text-subtitle-1 font-weight-bold">{{ mine.title || tenantBrand }}</div>
            <v-chip
              :color="mine.status === 'ACTIVE' ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >
              {{ mine.status === 'ACTIVE' ? t('MyFranchise.statusActive') : t('MyFranchise.statusDisabled') }}
            </v-chip>
          </div>

          <v-list class="pa-0" density="compact">
            <v-list-item class="px-0">
              <template #prepend><v-icon size="small">mdi-link-variant</v-icon></template>
              <v-list-item-title>
                <a :href="storefrontUrl" rel="noopener" target="_blank">{{ storefrontUrl }}</a>
              </v-list-item-title>
              <v-list-item-subtitle>{{ t('MyFranchise.storefrontLabel') }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item class="px-0">
              <template #prepend><v-icon size="small">mdi-percent-outline</v-icon></template>
              <v-list-item-title>{{ formatPercent(mine.commissionPercent) }}</v-list-item-title>
              <v-list-item-subtitle>{{ t('MyFranchise.commissionLabel') }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item class="px-0">
              <template #prepend><v-icon size="small">mdi-wallet-outline</v-icon></template>
              <v-list-item-title class="text-truncate">{{ mine.payoutWallet }}</v-list-item-title>
              <v-list-item-subtitle>{{ t('MyFranchise.payoutLabel') }}</v-list-item-subtitle>
              <template #append>
                <v-btn
                  :disabled="mine.status === 'DISABLED'"
                  icon="mdi-pencil"
                  size="x-small"
                  variant="text"
                  @click="toggleWalletEdit"
                />
              </template>
            </v-list-item>
          </v-list>

          <!-- Inline payout-wallet editor (re-validated server-side) -->
          <v-expand-transition>
            <div v-if="walletEdit.open" class="mt-2">
              <v-text-field
                v-model="walletEdit.wallet"
                :label="t('MyFranchise.fieldPayout')"
                :rules="[walletRule]"
                variant="outlined"
                @update:model-value="walletEdit.inactive = false"
              />
              <v-alert
                v-if="walletEdit.inactive"
                class="mb-3"
                density="compact"
                type="warning"
                variant="tonal"
              >
                {{ t('MyFranchise.errors.wallet_not_activated') }}
              </v-alert>
              <div class="text-caption text-medium-emphasis mb-2">
                {{ t('MyFranchise.walletChangeHint') }}
              </div>
              <div class="d-flex justify-end ga-2">
                <v-btn
                  :disabled="walletEdit.saving"
                  size="small"
                  variant="text"
                  @click="walletEdit.open = false"
                >{{ t('MyFranchise.cancel') }}</v-btn>
                <v-btn
                  color="primary"
                  :loading="walletEdit.saving"
                  size="small"
                  variant="elevated"
                  @click="saveWallet"
                >{{ t('MyFranchise.save') }}</v-btn>
              </div>
            </div>
          </v-expand-transition>
        </v-card-text>
      </v-card>

      <!-- Editable branding -->
      <v-card>
        <v-card-title class="text-subtitle-1">{{ t('MyFranchise.brandingTitle') }}</v-card-title>
        <v-card-text>
          <v-form ref="editFormRef" @submit.prevent="saveBranding">
            <div class="text-caption text-medium-emphasis mb-2">{{ t('MyFranchise.imagesTitle') }}</div>
            <div class="d-flex flex-wrap ga-6 mb-4">
              <!-- Logo -->
              <div>
                <div class="text-caption mb-1">{{ t('MyFranchise.logoLabel') }}</div>
                <v-avatar class="fp-logo-pick" color="surface-variant" rounded="lg" size="72">
                  <v-img v-if="previewLogoUrl" cover :src="previewLogoUrl" />
                  <v-icon v-else>mdi-image-outline</v-icon>
                </v-avatar>
                <div class="d-flex ga-1 mt-1">
                  <v-btn
                    :disabled="mine.status === 'DISABLED'"
                    :loading="uploadingLogo"
                    size="x-small"
                    variant="text"
                    @click="logoInput?.click()"
                  >{{ t('MyFranchise.changeImage') }}</v-btn>
                  <v-btn
                    v-if="mine.logoR2Key"
                    color="error"
                    :disabled="mine.status === 'DISABLED'"
                    size="x-small"
                    variant="text"
                    @click="removeImage('logo')"
                  >{{ t('MyFranchise.removeImage') }}</v-btn>
                </div>
                <input
                  ref="logoInput"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  type="file"
                  @change="onPickImage('logo', $event)"
                >
              </div>
              <!-- Cover -->
              <div class="flex-grow-1" style="min-width: 220px;">
                <div class="text-caption mb-1">{{ t('MyFranchise.coverLabel') }}</div>
                <div
                  class="fp-cover-pick d-flex align-center justify-center"
                  :style="coverPickStyle"
                >
                  <v-icon v-if="!previewCoverUrl" color="medium-emphasis">mdi-image-area</v-icon>
                </div>
                <div class="d-flex ga-1 mt-1">
                  <v-btn
                    :disabled="mine.status === 'DISABLED'"
                    :loading="uploadingCover"
                    size="x-small"
                    variant="text"
                    @click="coverInput?.click()"
                  >{{ t('MyFranchise.changeImage') }}</v-btn>
                  <v-btn
                    v-if="mine.coverR2Key"
                    color="error"
                    :disabled="mine.status === 'DISABLED'"
                    size="x-small"
                    variant="text"
                    @click="removeImage('cover')"
                  >{{ t('MyFranchise.removeImage') }}</v-btn>
                </div>
                <input
                  ref="coverInput"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  type="file"
                  @change="onPickImage('cover', $event)"
                >
              </div>
            </div>
            <div class="text-caption text-medium-emphasis mb-3">{{ t('MyFranchise.imagesHint') }}</div>
            <v-divider class="mb-4" />
            <v-text-field
              v-model="edit.title"
              counter="80"
              :disabled="mine.status === 'DISABLED'"
              :label="t('MyFranchise.fieldTitle')"
              maxlength="80"
              variant="outlined"
            />
            <v-textarea
              v-model="edit.description"
              auto-grow
              counter="280"
              :disabled="mine.status === 'DISABLED'"
              :label="t('MyFranchise.fieldDescription')"
              maxlength="280"
              rows="2"
              variant="outlined"
            />
            <div class="d-flex align-center ga-3">
              <v-text-field
                v-model="edit.accentColor"
                class="flex-grow-1"
                :disabled="mine.status === 'DISABLED'"
                hint="#1E88E5"
                :label="t('MyFranchise.fieldAccent')"
                :rules="[accentRule]"
                variant="outlined"
              />
              <div
                class="accent-swatch"
                :style="{ backgroundColor: isValidAccent(edit.accentColor) ? edit.accentColor : 'transparent' }"
              />
            </div>
            <div class="d-flex justify-end">
              <v-btn
                color="primary"
                :disabled="mine.status === 'DISABLED' || !brandingDirty"
                :loading="saving"
                type="submit"
                variant="elevated"
              >
                {{ t('MyFranchise.save') }}
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </template>

    <!-- ── Create form (available) ─────────────────────────── -->
    <template v-else-if="config && config.available">
      <v-card variant="tonal">
        <v-card-text>
          <div class="d-flex align-center ga-2 mb-2">
            <v-icon color="primary">mdi-handshake-outline</v-icon>
            <span class="text-subtitle-1 font-weight-bold">{{ t('MyFranchise.becomePartner') }}</span>
          </div>
          <p class="text-body-2 text-medium-emphasis mb-1">{{ t('MyFranchise.becomePartnerBody') }}</p>
          <p class="text-body-2">
            {{ t('MyFranchise.commissionDisclosure', { percent: formatPercent(config.defaultCommissionPercent) }) }}
          </p>
        </v-card-text>
      </v-card>

      <v-card class="mt-4">
        <v-card-text>
          <v-form ref="createFormRef" @submit.prevent="submitCreate">
            <div class="text-caption text-medium-emphasis mb-1">{{ t('MyFranchise.previewTitle') }}</div>
            <v-card class="mb-4 overflow-hidden" variant="outlined">
              <div class="fp-hero" :style="previewHeroStyle">
                <div class="fp-hero__overlay pa-4">
                  <div class="d-flex align-center ga-3">
                    <v-avatar class="fp-hero__logo" color="surface-variant" rounded="lg" size="56">
                      <v-icon>mdi-storefront-outline</v-icon>
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">{{ previewTitle }}</div>
                      <div class="text-caption text-medium-emphasis">
                        <v-icon class="me-1" icon="mdi-check-decagram" size="14" />
                        {{ t('Franchise.officialOf', { tenant: tenantBrand }) }}
                      </div>
                    </div>
                  </div>
                  <p v-if="previewDescription" class="text-body-2 mt-3 mb-0">{{ previewDescription }}</p>
                </div>
              </div>
            </v-card>
            <div class="text-caption text-medium-emphasis mb-3">{{ t('MyFranchise.imagesAfterCreate') }}</div>
            <v-text-field
              v-model="create.slug"
              counter="30"
              :hint="storefrontPreview"
              :label="t('MyFranchise.fieldSlug')"
              maxlength="30"
              persistent-hint
              :rules="[slugRule]"
              variant="outlined"
              @update:model-value="onSlugInput"
            />
            <v-text-field
              v-model="create.payoutWallet"
              class="mt-2"
              :label="t('MyFranchise.fieldPayout')"
              :rules="[walletRule]"
              variant="outlined"
              @update:model-value="walletInactive = false"
            />
            <v-alert
              v-if="walletInactive"
              class="mb-4"
              density="compact"
              type="warning"
              variant="tonal"
            >
              {{ t('MyFranchise.errors.wallet_not_activated') }}
              <a
                class="text-decoration-underline"
                href="https://developers.stellar.org/docs/build/guides/transactions/create-account#create-an-account-1"
                rel="noopener noreferrer"
                target="_blank"
              >{{ t('Wallet.learnMore') }}</a>
            </v-alert>
            <v-text-field
              v-model="create.title"
              counter="80"
              :label="t('MyFranchise.fieldTitle')"
              maxlength="80"
              variant="outlined"
            />
            <v-textarea
              v-model="create.description"
              auto-grow
              counter="280"
              :label="t('MyFranchise.fieldDescription')"
              maxlength="280"
              rows="2"
              variant="outlined"
            />
            <div class="d-flex align-center ga-3">
              <v-text-field
                v-model="create.accentColor"
                class="flex-grow-1"
                hint="#1E88E5"
                :label="t('MyFranchise.fieldAccent')"
                :rules="[accentRule]"
                variant="outlined"
              />
              <div
                class="accent-swatch"
                :style="{ backgroundColor: isValidAccent(create.accentColor) ? create.accentColor : 'transparent' }"
              />
            </div>
            <v-checkbox
              v-model="create.acceptTerms"
              color="primary"
              :label="t('MyFranchise.acceptTerms')"
            />
            <div class="d-flex justify-end ga-2">
              <v-btn
                v-if="mineList.length > 0"
                :disabled="saving"
                variant="text"
                @click="creating = false"
              >
                {{ t('MyFranchise.cancel') }}
              </v-btn>
              <v-btn
                color="primary"
                :disabled="!create.acceptTerms"
                :loading="saving"
                type="submit"
                variant="elevated"
              >
                {{ t('MyFranchise.createCta') }}
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </template>

    <!-- ── Not available ───────────────────────────────────── -->
    <v-card v-else variant="tonal">
      <v-card-text class="text-center py-10">
        <v-icon class="mb-3" color="medium-emphasis" size="48">mdi-storefront-outline</v-icon>
        <p class="text-body-1">{{ unavailableMessage }}</p>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
  import type { FranchiseConfigDto, FranchiseImageSlot, ManagedFranchiseDto } from '@/api/api'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { api, ApiError } from '@/api/api'
  import CxLoginDialog from '@/components/CxLoginDialog.vue'
  import { cdnPublicUrl } from '@/config/env'
  import { accountExists } from '@/services/stellar'
  import { useAuthStore } from '@/stores/auth'
  import { useTenantStore } from '@/stores/tenant'

  const router = useRouter()
  const { t } = useI18n()
  const authStore = useAuthStore()
  const { isAuthenticated, isAuthReady: authReady } = storeToRefs(authStore)
  const tenantStore = useTenantStore()

  const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/
  const WALLET_RE = /^G[A-Z2-7]{55}$/
  const ACCENT_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

  // Branding image constraints — must mirror the backend allow-list & ceilings.
  const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
  const IMAGE_MAX_BYTES: Record<FranchiseImageSlot, number> = {
    logo: 2 * 1024 * 1024,
    cover: 6 * 1024 * 1024,
  }

  const logoInput = ref<HTMLInputElement>()
  const coverInput = ref<HTMLInputElement>()
  const uploadingLogo = ref(false)
  const uploadingCover = ref(false)

  const loading = ref(false)
  const saving = ref(false)
  const loadError = ref<string | null>(null)
  const config = ref<FranchiseConfigDto | null>(null)
  const mineList = ref<ManagedFranchiseDto[]>([])
  const selectedId = ref<string | null>(null)
  /** Currently selected franchise (owners can run several, capped server-side). */
  const mine = computed(() => mineList.value.find(f => f.id === selectedId.value) ?? null)
  /** True while the owner is filling the "create another" form. */
  const creating = ref(false)

  const canCreateMore = computed(() =>
    !!config.value?.available
    && mineList.value.length < (config.value?.maxFranchisesPerUser ?? 0),
  )

  const create = reactive({
    slug: '',
    payoutWallet: '',
    title: '',
    description: '',
    accentColor: '',
    acceptTerms: false,
  })

  /** The payout wallet is syntactically valid but not funded on the network. */
  const walletInactive = ref(false)

  /** Inline payout-wallet editor for the selected franchise. */
  const walletEdit = reactive({ open: false, wallet: '', saving: false, inactive: false })

  const edit = reactive({ title: '', description: '', accentColor: '' })
  const editOriginal = reactive({ title: '', description: '', accentColor: '' })

  const snackbar = reactive({ show: false, text: '', color: 'success' })

  const tenantBrand = computed(() => tenantStore.brandText || 'EARNLUMENS')

  const origin = computed(() =>
    typeof window === 'undefined' ? '' : window.location.origin,
  )
  const storefrontPreview = computed(() =>
    `${origin.value}/f/${create.slug || 'your-slug'}`,
  )
  const storefrontUrl = computed(() =>
    mine.value ? `${origin.value}/f/${mine.value.slug}` : '',
  )

  const brandingDirty = computed(() =>
    edit.title !== editOriginal.title
    || edit.description !== editOriginal.description
    || edit.accentColor !== editOriginal.accentColor,
  )

  // ── Live storefront preview (reacts to the form as you type) ──
  const showingCreate = computed(() => creating.value || !mine.value)
  const previewTitle = computed(() => {
    if (showingCreate.value) return create.title || tenantBrand.value
    return edit.title || mine.value?.title || tenantBrand.value
  })
  const previewDescription = computed(() =>
    showingCreate.value ? create.description : edit.description,
  )
  const previewAccent = computed(() => {
    const a = (showingCreate.value ? create.accentColor : edit.accentColor) || ''
    return isValidAccent(a) ? a : null
  })
  const previewLogoUrl = computed(() =>
    !showingCreate.value && mine.value?.logoR2Key ? cdnPublicUrl(mine.value.logoR2Key) : null,
  )
  const previewCoverUrl = computed(() =>
    !showingCreate.value && mine.value?.coverR2Key ? cdnPublicUrl(mine.value.coverR2Key) : null,
  )
  const previewHeroStyle = computed(() => {
    if (previewCoverUrl.value) return { backgroundImage: `url("${previewCoverUrl.value}")` }
    if (previewAccent.value) {
      return { background: `linear-gradient(135deg, ${previewAccent.value}33, ${previewAccent.value}11)` }
    }
    return {}
  })
  const coverPickStyle = computed(() =>
    previewCoverUrl.value ? { backgroundImage: `url("${previewCoverUrl.value}")` } : {},
  )

  const unavailableMessage = computed(() => {
    if (!config.value) return t('MyFranchise.unavailableGeneric')
    if (config.value.banned) return t('MyFranchise.unavailableBanned')
    if (!config.value.franchisesEnabled) return t('MyFranchise.unavailableNotEnabled')
    if (config.value.franchisesPaused) return t('MyFranchise.unavailablePaused')
    return t('MyFranchise.unavailableGeneric')
  })

  // ── Validation rules ──────────────────────────────────────
  function slugRule (v: string): true | string {
    const s = (v || '').trim().toLowerCase()
    if (!s) return t('MyFranchise.errors.slug_required')
    return SLUG_RE.test(s) ? true : t('MyFranchise.errors.slug_format')
  }
  function walletRule (v: string): true | string {
    return WALLET_RE.test((v || '').trim()) ? true : t('MyFranchise.errors.wallet_format')
  }
  function accentRule (v: string): true | string {
    const s = (v || '').trim()
    if (!s) return true
    return ACCENT_RE.test(s) ? true : t('MyFranchise.errors.accent_color_format')
  }
  function isValidAccent (v: string): boolean {
    return ACCENT_RE.test((v || '').trim())
  }

  function onSlugInput (v: string) {
    create.slug = (v || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
  }

  function formatPercent (value: number | null): string {
    if (value == null) return '0%'
    return `${Number(value)}%`
  }

  function notify (text: string, color: 'success' | 'error' = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  /** Maps a backend franchise error code to a localized message. */
  function localiseError (error_: unknown): string {
    if (error_ instanceof ApiError) {
      const code = (error_.message || '').toLowerCase()
      const key = `MyFranchise.errors.${code}`
      const msg = t(key)
      if (msg !== key) return msg
    }
    return t('Franchise.errorTitle')
  }

  /** Loads the edit form (and resets the wallet editor) from a franchise. */
  function syncEditFrom (f: ManagedFranchiseDto) {
    edit.title = f.title ?? ''
    edit.description = f.description ?? ''
    edit.accentColor = f.accentColor ?? ''
    editOriginal.title = edit.title
    editOriginal.description = edit.description
    editOriginal.accentColor = edit.accentColor
    walletEdit.open = false
    walletEdit.wallet = ''
    walletEdit.inactive = false
  }

  /** Replaces (or appends) a franchise in the owned list after a save. */
  function applyUpdated (updated: ManagedFranchiseDto) {
    const index = mineList.value.findIndex(f => f.id === updated.id)
    if (index === -1) {
      mineList.value.push(updated)
    } else {
      mineList.value.splice(index, 1, updated)
    }
  }

  function selectFranchise (id: string) {
    if (id === selectedId.value) return
    selectedId.value = id
    if (mine.value) syncEditFrom(mine.value)
  }

  /** Opens a fresh "create another franchise" form. */
  function startCreate () {
    create.slug = ''
    create.payoutWallet = ''
    create.title = ''
    create.description = ''
    create.accentColor = ''
    create.acceptTerms = false
    walletInactive.value = false
    creating.value = true
  }

  async function loadAll () {
    if (!isAuthenticated.value) return
    loading.value = true
    loadError.value = null
    try {
      const [cfg, owned] = await Promise.all([
        api.franchises.config(),
        api.franchises.mine(),
      ])
      config.value = cfg
      mineList.value = owned
      if (!selectedId.value || !owned.some(f => f.id === selectedId.value)) {
        selectedId.value = owned[0]?.id ?? null
      }
      if (mine.value) syncEditFrom(mine.value)
    } catch (error_) {
      loadError.value = localiseError(error_)
    } finally {
      loading.value = false
    }
  }

  const createFormRef = ref()
  const editFormRef = ref()

  async function submitCreate () {
    const valid = await createFormRef.value?.validate()
    if (valid && !valid.valid) return
    if (!create.acceptTerms) return
    saving.value = true
    try {
      // The payout wallet becomes a payment destination — require an
      // activated (funded) Stellar account up front. It can be replaced
      // later from the manage view, with the same check.
      walletInactive.value = !(await accountExists(create.payoutWallet.trim()))
      if (walletInactive.value) {
        notify(t('MyFranchise.errors.wallet_not_activated'), 'error')
        return
      }
      const created = await api.franchises.create({
        slug: create.slug.trim().toLowerCase(),
        payoutWallet: create.payoutWallet.trim(),
        title: create.title.trim() || undefined,
        description: create.description.trim() || undefined,
        accentColor: create.accentColor.trim() || undefined,
        acceptTerms: create.acceptTerms,
      })
      applyUpdated(created)
      selectedId.value = created.id
      creating.value = false
      syncEditFrom(created)
      notify(t('MyFranchise.createdOk'))
    } catch (error_) {
      notify(localiseError(error_), 'error')
    } finally {
      saving.value = false
    }
  }

  /** Replaces the payout wallet of the selected franchise. */
  async function saveWallet () {
    if (!mine.value) return
    const wallet = walletEdit.wallet.trim()
    if (!WALLET_RE.test(wallet)) {
      notify(t('MyFranchise.errors.wallet_format'), 'error')
      return
    }
    walletEdit.saving = true
    try {
      // Same funding requirement as at creation — the wallet is a payment
      // destination, so it must already exist on the network.
      walletEdit.inactive = !(await accountExists(wallet))
      if (walletEdit.inactive) {
        notify(t('MyFranchise.errors.wallet_not_activated'), 'error')
        return
      }
      const updated = await api.franchises.updateMine(mine.value.id, { payoutWallet: wallet })
      applyUpdated(updated)
      walletEdit.open = false
      notify(t('MyFranchise.walletUpdated'))
    } catch (error_) {
      notify(localiseError(error_), 'error')
    } finally {
      walletEdit.saving = false
    }
  }

  function toggleWalletEdit () {
    walletEdit.open = !walletEdit.open
    if (walletEdit.open) {
      walletEdit.wallet = mine.value?.payoutWallet ?? ''
      walletEdit.inactive = false
    }
  }

  async function saveBranding () {
    if (!mine.value) return
    const valid = await editFormRef.value?.validate()
    if (valid && !valid.valid) return
    saving.value = true
    try {
      const updated = await api.franchises.updateMine(mine.value.id, {
        title: edit.title,
        description: edit.description,
        accentColor: edit.accentColor,
      })
      applyUpdated(updated)
      editOriginal.title = edit.title
      editOriginal.description = edit.description
      editOriginal.accentColor = edit.accentColor
      notify(t('MyFranchise.savedOk'))
    } catch (error_) {
      notify(localiseError(error_), 'error')
    } finally {
      saving.value = false
    }
  }

  /** Validate, upload to R2, then persist the new key on the franchise. */
  async function onPickImage (slot: FranchiseImageSlot, event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = '' // allow re-selecting the same file later
    if (!file || !mine.value) return

    if (!IMAGE_TYPES.has(file.type)) {
      notify(t('MyFranchise.errors.image_type'), 'error')
      return
    }
    if (file.size <= 0 || file.size > IMAGE_MAX_BYTES[slot]) {
      notify(t('MyFranchise.errors.image_size'), 'error')
      return
    }

    const busy = slot === 'logo' ? uploadingLogo : uploadingCover
    busy.value = true
    try {
      const r2Key = await api.franchises.uploadImage(mine.value.id, slot, file)
      const updated = await api.franchises.updateMine(mine.value.id,
                                                      slot === 'logo' ? { logoR2Key: r2Key } : { coverR2Key: r2Key })
      applyUpdated(updated)
      notify(t('MyFranchise.savedOk'))
    } catch (error_) {
      notify(localiseError(error_), 'error')
    } finally {
      busy.value = false
    }
  }

  /** Clear a branding image (sets the key to empty on the franchise). */
  async function removeImage (slot: FranchiseImageSlot) {
    if (!mine.value) return
    const busy = slot === 'logo' ? uploadingLogo : uploadingCover
    busy.value = true
    try {
      const updated = await api.franchises.updateMine(mine.value.id,
                                                      slot === 'logo' ? { logoR2Key: '' } : { coverR2Key: '' })
      applyUpdated(updated)
      notify(t('MyFranchise.savedOk'))
    } catch (error_) {
      notify(localiseError(error_), 'error')
    } finally {
      busy.value = false
    }
  }

  onMounted(loadAll)

  // Auth rehydration may finish after mount; load as soon as we're logged in.
  watch(isAuthenticated, loggedIn => {
    if (loggedIn && !config.value && !loading.value) loadAll()
  })
</script>

<style scoped>
.accent-swatch {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-shrink: 0;
}

.fp-hero {
  background-size: cover;
  background-position: center;
  min-height: 116px;
}

.fp-hero__overlay {
  background: rgba(0, 0, 0, 0.04);
  backdrop-filter: saturate(115%);
  min-height: 116px;
}

.fp-hero__logo {
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.fp-cover-pick {
  height: 72px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.fp-logo-pick {
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
