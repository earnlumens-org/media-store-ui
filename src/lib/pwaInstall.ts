// PWA install detection + trigger.
//
// Implemented as a module-level singleton because the browser fires the
// `beforeinstallprompt` event ONCE, early in the page lifecycle — often before
// any component (e.g. the /account page) is mounted. Registering the listener
// at import time (this module is imported from main.ts) guarantees we capture
// the deferred prompt so the install button can replay it on demand.
//
// Platform behaviour:
//   - Android / desktop Chromium: native install via the captured prompt.
//     IMPORTANT: `beforeinstallprompt` does NOT fire when the app is already
//     installed, inside in-app webviews / Custom Tabs, or in browsers without
//     the API (e.g. some Samsung Internet versions). Android therefore falls
//     back to `android` (manual instructions), NEVER to a "use Chrome" hint —
//     that produced a bogus "install Chrome" message on devices where the app
//     (and Chrome) were already installed.
//   - `navigator.getInstalledRelatedApps()` (Android Chromium, requires the
//     manifest's `related_applications` webapp entry) additionally detects an
//     already-installed app while browsing in a normal tab.
//   - iOS (all): no programmatic install API — we surface manual
//     "Add to Home Screen" instructions. iOS < 16.4 additionally gets a
//     caveat note (push + some PWA capabilities, and the OAuth cookie-jar
//     round-trip, are unreliable below 16.4).
//   - Other browsers (desktop Firefox/Safari): no install path — custom hint.

import { readonly, ref } from 'vue'

export type PwaPlatform = 'android' | 'ios' | 'desktop' | 'other'

/**
 * - `installed`    — already running as an installed PWA, or the installed app
 *                    was detected via `getInstalledRelatedApps` (hide the button).
 * - `installable`  — a deferred install prompt was captured (Android/desktop).
 * - `ios`          — iOS device; show manual Add-to-Home-Screen instructions.
 * - `android`      — Android without a captured prompt (already installed,
 *                    Samsung Internet, in-app webview, Custom Tab, criteria
 *                    not met yet…); show manual instructions.
 * - `unsupported`  — desktop/other with no install path; show a custom hint.
 */
export type PwaInstallState = 'installed' | 'installable' | 'ios' | 'android' | 'unsupported'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>
}

const installState = ref<PwaInstallState>('unsupported')
const platform = ref<PwaPlatform>('other')
/** True when the app is running in standalone display-mode (installed PWA). */
const isStandalone = ref(false)
/** iOS version as `major.minor` (e.g. 16.4), or null when not iOS / unknown. */
const iosVersion = ref<number | null>(null)
/** True when the iOS version is >= 16.4 (or unknown — assume capable). */
const iosSupported = ref(true)

let deferredPrompt: BeforeInstallPromptEvent | null = null
let initialised = false

function detectStandalone (): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  const mql = window.matchMedia?.('(display-mode: standalone)')
  // `navigator.standalone` is the legacy iOS-only flag.
  return Boolean(mql?.matches) || (window.navigator as any).standalone === true
}

function detectPlatform (): PwaPlatform {
  if (typeof navigator === 'undefined') {
    return 'other'
  }
  const ua = navigator.userAgent || ''
  const isIOS
    = /iphone|ipad|ipod/i.test(ua)
      // iPadOS 13+ masquerades as macOS — distinguish via touch support.
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) {
    return 'ios'
  }
  if (/android/i.test(ua)) {
    return 'android'
  }
  if (/windows|macintosh|linux|cros/i.test(ua)) {
    return 'desktop'
  }
  return 'other'
}

function detectIosVersion (): number | null {
  if (typeof navigator === 'undefined') {
    return null
  }
  const m = navigator.userAgent.match(/OS (\d+)_(\d+)/i)
  if (!m) {
    return null
  }
  return Number(`${m[1]}.${m[2]}`)
}

function onBeforeInstallPrompt (e: Event): void {
  // Stop Chrome's default mini-infobar; we drive installation from our button.
  e.preventDefault()
  deferredPrompt = e as BeforeInstallPromptEvent
  if (installState.value !== 'installed') {
    installState.value = 'installable'
  }
}

/**
 * Best-effort detection of the already-installed app while browsing in a
 * normal tab (Android Chromium only; needs the manifest's
 * `related_applications` webapp entry, so it only resolves on the origin the
 * manifest URL points at — harmless empty result elsewhere).
 */
async function detectInstalledRelatedApp (): Promise<void> {
  try {
    const getApps = (navigator as any).getInstalledRelatedApps as (() => Promise<unknown[]>) | undefined
    if (typeof getApps !== 'function') {
      return
    }
    const apps = await getApps.call(navigator)
    if (Array.isArray(apps) && apps.length > 0) {
      installState.value = 'installed'
      deferredPrompt = null
    }
  } catch {
    // Unsupported / cross-origin manifest URL — ignore.
  }
}

function onAppInstalled (): void {
  installState.value = 'installed'
  deferredPrompt = null
}

function init (): void {
  if (initialised || typeof window === 'undefined') {
    return
  }
  initialised = true

  platform.value = detectPlatform()
  isStandalone.value = detectStandalone()

  if (platform.value === 'ios') {
    iosVersion.value = detectIosVersion()
    iosSupported.value = iosVersion.value == null ? true : iosVersion.value >= 16.4
  }

  if (detectStandalone()) {
    installState.value = 'installed'
  } else if (platform.value === 'ios') {
    installState.value = 'ios'
  } else if (platform.value === 'android') {
    // Android: manual-instructions fallback. `beforeinstallprompt` upgrades
    // this to `installable` when (and only when) the browser offers a native
    // prompt — it never fires when the app is already installed, in Custom
    // Tabs / in-app webviews, or in browsers without the API.
    installState.value = 'android'
  } else {
    // Desktop/other: stays `unsupported` until (and unless) the browser
    // fires `beforeinstallprompt`, which flips it to `installable`.
    installState.value = 'unsupported'
  }

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)

  // If the display-mode flips to standalone mid-session (e.g. the OS moves the
  // document into the freshly installed app), reflect it reactively.
  const mql = window.matchMedia?.('(display-mode: standalone)')
  mql?.addEventListener?.('change', event => {
    if (event.matches) {
      isStandalone.value = true
      installState.value = 'installed'
      deferredPrompt = null
    }
  })

  // Async, best-effort: flags `installed` while browsing in a tab on Android.
  void detectInstalledRelatedApp()
}

// Register listeners as early as possible (import-time side effect).
init()

/**
 * Triggers the native install prompt on Android/desktop. On iOS there is no
 * programmatic API, so callers should instead open the manual-instructions
 * dialog (see {@link PwaInstallState} === 'ios').
 *
 * @returns the user's choice, or `'unavailable'` when no prompt was captured.
 */
async function promptInstall (): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    // The captured prompt was consumed (e.g. dismissed earlier) and the
    // browser hasn't re-fired `beforeinstallprompt` yet. Callers must fall
    // back to the manual instructions instead of a dead button.
    return 'unavailable'
  }
  try {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      installState.value = 'installed'
    }
    return outcome
  } catch {
    // A prompt can only be used once; a stale/duplicate call throws.
    return 'unavailable'
  } finally {
    deferredPrompt = null
  }
}

export function usePwaInstall () {
  return {
    installState: readonly(installState),
    platform: readonly(platform),
    isStandalone: readonly(isStandalone),
    iosVersion: readonly(iosVersion),
    iosSupported: readonly(iosSupported),
    promptInstall,
  }
}
