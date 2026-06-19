<template>
  <div class="text-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom"
    >
      <!-- Activador: avatar -->
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          class="mr-3"
          icon
          variant="text"
        >
          <!--
            color="surface-variant" keeps the avatar slot a visible, theme-toned
            disc so the menu button never collapses into an empty/invisible
            circle when the X profile image is missing or fails to load.
            referrerpolicy="no-referrer" is the actual fix for the intermittent
            blank avatar: pbs.twimg.com sometimes 403s requests that carry a
            Referer header (varies by device/cache), and @error falls back to
            the account icon when it does.
          -->
          <v-avatar color="surface-variant">
            <v-img
              v-if="avatarUrl"
              :alt="displayName || username || 'avatar'"
              referrerpolicy="no-referrer"
              :src="avatarUrl"
              @error="onAvatarError"
            />
            <v-icon v-else color="on-surface-variant" icon="mdi-account-circle" />
          </v-avatar>
        </v-btn>
      </template>

      <!-- Contenido del Popover -->
      <v-card min-width="300">

        <!-- Perfil -->
        <v-list>
          <v-list-item
            :subtitle="username"
            :title="displayName"
            @click="goToProfile"
          >
            <!--
              Same palliative as the activator avatar: a themed disc with an
              account-icon fallback so a missing/failed X profile image never
              leaves an empty hole in the profile row (shares avatarUrl /
              avatarFailed so both recover together on a fresh login).
            -->
            <template #prepend>
              <v-avatar color="surface-variant">
                <v-img
                  v-if="avatarUrl"
                  :alt="displayName || username || 'avatar'"
                  referrerpolicy="no-referrer"
                  :src="avatarUrl"
                  @error="onAvatarError"
                />
                <v-icon v-else color="on-surface-variant" icon="mdi-account-circle" />
              </v-avatar>
            </template>
            <template #append>
              <v-icon>mdi-chevron-right</v-icon>
            </template>
          </v-list-item>
        </v-list>

        <v-divider />

        <!-- Opciones -->
        <v-list class="popover-menu-list">
          <!-- Temas + Dark mode toggle como dos botones independientes -->
          <div class="d-flex align-center px-2">
            <v-btn
              class="text-none justify-start"
              prepend-icon="mdi-palette-outline"
              variant="text"
              @click="goToThemes"
            >
              {{ $t('Common.themes') }}
            </v-btn>
            <v-spacer />
            <v-btn
              icon="mdi-circle-half-full"
              size="small"
              variant="text"
              @click="toggleTheme"
            />
          </div>

          <!-- Creator Studio -->
          <div class="d-flex align-center px-2">
            <v-btn
              class="text-none justify-start"
              prepend-icon="mdi-movie-open-edit-outline"
              variant="text"
              @click="goToCreatorStudio"
            >
              {{ $t('Account.creatorStudio') }}
            </v-btn>
          </div>

          <!-- Botón subir (resaltado) -->
          <div class="d-flex align-center px-2">
            <v-btn
              class="text-uppercase font-weight-medium text-none justify-start"
              color="primary"
              prepend-icon="mdi-cloud-upload-outline"
              variant="text"
              @click="openUploadDialog"
            >
              {{ $t('Common.upload') }}
            </v-btn>
          </div>
        </v-list>

        <v-divider />

        <v-list class="popover-menu-list">
          <div class="d-flex align-center px-2">
            <v-btn
              class="text-none justify-start"
              prepend-icon="mdi-cog-outline"
              variant="text"
              @click="goToAccount"
            >
              {{ $t('Account.account') }}
            </v-btn>
          </div>
          <div class="d-flex align-center px-2">
            <v-btn
              class="text-none justify-start"
              prepend-icon="mdi-help-circle-outline"
              variant="text"
              @click="openHelp"
            >
              {{ $t('Common.helpCenter') }}
            </v-btn>
          </div>
        </v-list>

        <v-divider />

        <!-- Logout -->
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="text-uppercase"
            color="error"
            variant="text"
            @click="handleLogout"
          >
            <v-icon start>mdi-logout</v-icon>
            {{ $t("Common.logout") }}
          </v-btn>
        </v-card-actions>

      </v-card>
    </v-menu>

    <!-- Upload type selector dialog -->
    <UploadTypeDialog v-model="showUploadDialog" />

    <!--
      Avatar diagnostics modal. Only reachable via the Help item when an avatar
      load error was captured (otherwise the Help button is a no-op). Surfaces
      the failing URL + best-effort HTTP status so the real cause of the
      intermittent blank avatar can be identified on the affected device.
    -->
    <v-dialog v-model="showHelpDialog" max-width="560" scrollable>
      <v-card v-if="avatarError">
        <v-card-title class="text-h6">Diagnóstico de avatar</v-card-title>
        <v-card-text style="max-height: 70vh; overflow-y: auto;">
          <p class="text-body-2 mb-3">
            La imagen de perfil no pudo cargarse en este dispositivo. Estos
            datos ayudan a identificar el motivo real:
          </p>
          <v-table density="compact">
            <tbody>
              <tr>
                <td class="font-weight-medium">URL</td>
                <td style="word-break: break-all;">{{ avatarError.url }}</td>
              </tr>
              <tr>
                <td class="font-weight-medium">Status</td>
                <td>{{ avatarError.status ?? '—' }} {{ avatarError.statusText }}</td>
              </tr>
              <tr>
                <td class="font-weight-medium">Cuándo</td>
                <td>{{ avatarError.when }}</td>
              </tr>
              <tr>
                <td class="font-weight-medium">Nota</td>
                <td>{{ avatarError.note }}</td>
              </tr>
              <tr>
                <td class="font-weight-medium">Navegador</td>
                <td style="word-break: break-all;">{{ avatarError.userAgent }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="copyAvatarError">{{ copied ? 'Copiado' : 'Copiar' }}</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="showHelpDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useTheme } from 'vuetify'
  import { logout } from '@/api/modules/auth.api'
  import UploadTypeDialog from '@/components/upload/UploadTypeDialog.vue'
  import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME } from '@/plugins/vuetify'
  import { broadcastAuthEvent } from '@/services/authBroadcast'
  import { clearToken } from '@/services/tokenWorkerClient'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'
  import { usePurchasesStore } from '@/stores/purchases'
  import { useTenantStore } from '@/stores/tenant'

  const menu = ref(false)
  const showUploadDialog = ref(false)

  const router = useRouter()
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const tenantStore = useTenantStore()
  const theme = useTheme()

  // Computed: true if current theme is dark
  const isDarkMode = computed(() => theme.global.current.value.dark)

  function setTheme (name: string) {
    const maybeTheme = theme as unknown as { change?: (name: string) => void }
    if (typeof maybeTheme.change === 'function') {
      maybeTheme.change(name)
      return
    }
    theme.global.name.value = name
  }

  function toggleTheme () {
    // Mirror CxDarkLightMode: prefer the tenant owner's curated default for
    // the target mode so the storefront switches into the configured palette
    // instead of the hardcoded platform fallback. Only fall back to the
    // built-in defaults when the owner has not picked a per-tenant theme.
    const nextThemeName = isDarkMode.value
      ? (tenantStore.defaultLightTheme || DEFAULT_LIGHT_THEME)
      : (tenantStore.defaultDarkTheme || DEFAULT_DARK_THEME)
    appStore.setThemeName(nextThemeName)
    localStorage.setItem('themeName', nextThemeName)
    setTheme(nextThemeName)
  }

  function goToThemes () {
    menu.value = false
    router.push('/themes')
  }

  function goToCreatorStudio () {
    menu.value = false
    router.push('/creator-studio')
  }

  function openUploadDialog () {
    menu.value = false
    showUploadDialog.value = true
  }

  function goToAccount () {
    menu.value = false
    router.push('/account')
  }

  function goToProfile () {
    menu.value = false
    const name = authStore.user?.username
    if (name) {
      router.push(`/${name}`)
    }
  }

  async function handleLogout () {
    if (appStore.isAppLocked) return
    menu.value = false
    appStore.setIsAppLocked(true)

    try {
      await logout()
    } catch {
      // Ignore logout errors
    }

    await clearToken()
    usePurchasesStore().clearAll()
    broadcastAuthEvent('LOGOUT')
    window.location.assign('/')
  }

  // User profile from auth store
  const profileImageUrl = computed(() => authStore.user?.profileImageUrl ?? '')
  const username = computed(() => authStore.user?.username ? `@${authStore.user.username}` : '')
  const displayName = computed(() => authStore.user?.displayName ?? '')

  // Avatar with graceful degradation: when the X profile image is absent or
  // fails to load, avatarUrl becomes '' and the template shows the themed
  // account-icon fallback instead of an empty circle.
  const avatarFailed = ref(false)
  const avatarUrl = computed(() => (avatarFailed.value ? '' : profileImageUrl.value))
  // A fresh login / profile change re-arms the load attempt and clears any
  // previously captured diagnostic.
  watch(profileImageUrl, () => {
    avatarFailed.value = false
    avatarError.value = null
  })

  // Avatar load-failure diagnostics. The captured info is shown in a modal via
  // the Help item; the Help button is a no-op while avatarError is null.
  interface AvatarErrorInfo {
    url: string
    when: string
    userAgent: string
    status: number | null
    statusText: string
    note: string
  }
  const avatarError = ref<AvatarErrorInfo | null>(null)
  const showHelpDialog = ref(false)
  const copied = ref(false)

  async function onAvatarError () {
    avatarFailed.value = true
    const url = profileImageUrl.value
    if (!url) return
    const info: AvatarErrorInfo = {
      url,
      when: new Date().toISOString(),
      userAgent: navigator.userAgent,
      status: null,
      statusText: '',
      note: '',
    }
    // Best-effort probe of the failing URL. The <img> error event carries no
    // HTTP status, so re-request it: a CORS fetch can read the status when the
    // host allows it; otherwise a no-cors fetch at least distinguishes "the
    // resource was reachable but blocked from rendering" (Referer/policy) from
    // a genuine network failure.
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors', referrerPolicy: 'no-referrer', cache: 'no-store' })
      info.status = res.status
      info.statusText = res.statusText
      info.note = res.ok
        ? 'El recurso respondió OK vía fetch: el bloqueo es de render, no de red (probable Referer/SW/caché).'
        : 'El servidor respondió con error HTTP.'
    } catch {
      try {
        await fetch(url, { method: 'GET', mode: 'no-cors', referrerPolicy: 'no-referrer', cache: 'no-store' })
        info.note = 'CORS impidió leer el status; en modo no-cors el recurso fue alcanzable (respuesta opaca). Probable bloqueo de imagen por Referer/políticas, no caída de red.'
      } catch (noCorsErr) {
        info.note = `Fallo de red al alcanzar la imagen: ${(noCorsErr as Error)?.message ?? 'desconocido'}`
      }
    }
    avatarError.value = info
  }

  function openHelp () {
    // No captured avatar error → the Help item does nothing.
    if (!avatarError.value) return
    menu.value = false
    showHelpDialog.value = true
  }

  async function copyAvatarError () {
    if (!avatarError.value) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(avatarError.value, null, 2))
      copied.value = true
      setTimeout(() => { copied.value = false }, 1500)
    } catch {
      // Clipboard unavailable (insecure context / permissions) — ignore.
    }
  }
</script>
