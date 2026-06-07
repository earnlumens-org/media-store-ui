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
//   - iOS (all): no programmatic install API — we surface manual
//     "Add to Home Screen" instructions. iOS < 16.4 additionally gets a
//     caveat note (push + some PWA capabilities, and the OAuth cookie-jar
//     round-trip, are unreliable below 16.4).
//   - Other browsers (e.g. Firefox): no install support — show a custom hint.

import { readonly, ref } from 'vue'

export type PwaPlatform = 'android' | 'ios' | 'desktop' | 'other'

/**
 * - `installed`    — already running as an installed PWA (hide the button).
 * - `installable`  — a deferred install prompt was captured (Android/desktop).
 * - `ios`          — iOS device; show manual Add-to-Home-Screen instructions.
 * - `unsupported`  — no install path available; show a custom hint.
 */
export type PwaInstallState = 'installed' | 'installable' | 'ios' | 'unsupported'

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
  if (typeof window === 'undefined') return false
  const mql = window.matchMedia?.('(display-mode: standalone)')
  // `navigator.standalone` is the legacy iOS-only flag.
  return Boolean(mql?.matches) || (window.navigator as any).standalone === true
}

function detectPlatform (): PwaPlatform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent || ''
  const isIOS
    = /iphone|ipad|ipod/i.test(ua)
      // iPadOS 13+ masquerades as macOS — distinguish via touch support.
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) return 'ios'
  if (/android/i.test(ua)) return 'android'
  if (/windows|macintosh|linux|cros/i.test(ua)) return 'desktop'
  return 'other'
}

function detectIosVersion (): number | null {
  if (typeof navigator === 'undefined') return null
  const m = navigator.userAgent.match(/OS (\d+)_(\d+)/i)
  if (!m) return null
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

function onAppInstalled (): void {
  installState.value = 'installed'
  deferredPrompt = null
}

function init (): void {
  if (initialised || typeof window === 'undefined') return
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
  } else {
    // Android / desktop: stays `unsupported` until (and unless) the browser
    // fires `beforeinstallprompt`, which flips it to `installable`.
    installState.value = 'unsupported'
  }

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)
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
  if (!deferredPrompt) return 'unavailable'
  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') installState.value = 'installed'
  deferredPrompt = null
  return outcome
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
