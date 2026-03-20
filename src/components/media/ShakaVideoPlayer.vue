<!--
  ShakaVideoPlayer — Reusable video player powered by Shaka Player (Google).

  FEATURES:
  - Plays raw video files (MP4, WebM) via direct URL
  - Plays HLS (.m3u8) and DASH (.mpd) manifests with adaptive bitrate
  - Authenticated CDN playback via credentials (cookies)
  - Poster/thumbnail support
  - Error state with retry
  - Responsive 16:9 container

  FUTURE-READY:
  - DRM (Widevine/FairPlay) — add `drmConfig` prop when needed
  - HLS transcoding — just change src from raw URL to .m3u8 manifest
-->
<template>
  <div
    ref="containerRef"
    class="shaka-player-container bg-black position-relative"
    :class="containerClass"
  >
    <!-- Player error overlay -->
    <div
      v-if="playerError"
      class="position-absolute w-100 h-100 d-flex flex-column align-center justify-center"
      style="z-index: 10; background: rgba(0, 0, 0, 0.85);"
    >
      <v-icon
        class="mb-3"
        color="error"
        size="48"
        style="cursor: pointer;"
        @click="showErrorDetail = true"
      >
        mdi-alert-circle-outline
      </v-icon>
      <p class="text-body-2 text-white text-center mb-4 px-4">
        {{ playerError }}
      </p>
      <v-btn
        color="primary"
        prepend-icon="mdi-refresh"
        size="small"
        variant="flat"
        @click="retry"
      >
        {{ $t('Common.retry') }}
      </v-btn>
    </div>

    <!-- Error detail dialog (for debugging on mobile) -->
    <v-dialog v-model="showErrorDetail" max-width="500" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="error" size="small">mdi-bug-outline</v-icon>
          Error Details
        </v-card-title>
        <v-card-text>
          <pre class="text-caption" style="white-space: pre-wrap; word-break: break-all;">{{ errorDetail }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-btn size="small" variant="text" @click="copyErrorDetail">{{ copied ? 'Copied!' : 'Copy' }}</v-btn>
          <v-spacer />
          <v-btn size="small" variant="text" @click="showErrorDetail = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- HTML5 video element — Shaka attaches to this -->
    <video
      ref="videoRef"
      class="shaka-video w-100 h-100"
      :crossorigin="crossorigin"
      playsinline
      :poster="poster"
      @ended="$emit('ended')"
      @pause="$emit('pause')"
      @play="$emit('play')"
      @timeupdate="onTimeUpdate"
    />
  </div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

  import 'shaka-player/dist/controls.css'

  interface Props {
    /** Media URL — raw file, HLS manifest (.m3u8), or DASH manifest (.mpd) */
    src: string
    /** Poster/thumbnail image URL */
    poster?: string
    /** Whether to auto-play when loaded */
    autoplay?: boolean
    /** crossorigin attribute for authenticated CDN requests */
    crossorigin?: '' | 'anonymous' | 'use-credentials'
    /** Additional CSS class for the container */
    containerClass?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    poster: undefined,
    autoplay: false,
    crossorigin: 'use-credentials',
    containerClass: 'rounded-0 rounded-md-lg overflow-hidden',
  })

  const emit = defineEmits<{
    play: []
    pause: []
    ended: []
    timeupdate: [currentTime: number, duration: number]
    error: [message: string]
  }>()

  const containerRef = ref<HTMLDivElement>()
  const videoRef = ref<HTMLVideoElement>()
  const playerError = ref<string | null>(null)
  const errorDetail = ref<string>('')
  const showErrorDetail = ref(false)
  const copied = ref(false)

  /*
   * Shaka Player types are declared globally via `declare namespace shaka { ... }`
   * but the compiled vs UI d.ts files conflict when resolved through package.json "types".
   * Since Shaka is loaded dynamically for tree-shaking, we use `any` for module-level refs.
   * This is the recommended approach for dynamic Shaka imports in TypeScript.
   */
  let shakaLib: any = null
  let player: any = null
  let uiOverlay: any = null

  /** Load shaka-player ES module (lazy) */
  async function loadShaka () {
    if (shakaLib) return shakaLib
    const mod = await import('shaka-player/dist/shaka-player.ui')
    shakaLib = mod.default ?? mod
    return shakaLib
  }

  /** Initialize Shaka Player and attach to video element */
  async function initPlayer () {
    playerError.value = null

    try {
      const lib = await loadShaka()

      // Install polyfills (call once per page, safe to call multiple times)
      lib.polyfill.installAll()

      if (!lib.Player.isBrowserSupported()) {
        throw new Error('Your browser does not support video playback.')
      }

      // Destroy previous instance if any (e.g., on src change)
      await destroyPlayer()

      // Create player and attach to video element
      const p = new lib.Player()
      await p.attach(videoRef.value!)
      player = p

      // Configure networking: send credentials only for authenticated CDN requests
      if (props.crossorigin === 'use-credentials') {
        player.getNetworkingEngine()?.registerRequestFilter((_type: number, request: { allowCrossSiteCredentials: boolean }) => {
          request.allowCrossSiteCredentials = true
        })
      }

      // Configure player defaults
      player.configure({
        streaming: {
          // Buffer goals — reasonable defaults for direct file playback
          bufferingGoal: 30,
          rebufferingGoal: 2,
          // Retry parameters
          retryParameters: {
            maxAttempts: 3,
            baseDelay: 1000,
            backoffFactor: 2,
            fuzzFactor: 0.5,
          },
        },
      })

      // Attach Shaka UI controls
      const overlay = new lib.ui.Overlay(
        player,
        containerRef.value!,
        videoRef.value!,
      )

      // Configure UI controls
      overlay.configure({
        addSeekBar: true,
        controlPanelElements: [
          'play_pause',
          'time_and_duration',
          'spacer',
          'mute',
          'volume',
          'fullscreen',
          'overflow_menu',
        ],
        overflowMenuButtons: [
          'quality',
          'playback_rate',
          'picture_in_picture',
        ],
      })

      uiOverlay = overlay

      // Error listener
      player.addEventListener('error', onPlayerError)

      // Load the media source
      await player.load(props.src)

      // Auto-play immediately after load (YouTube behavior)
      if (videoRef.value) {
        try {
          await videoRef.value.play()
        } catch {
          // Autoplay blocked by browser policy — user must click play manually
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to initialize video player'
      playerError.value = message
      errorDetail.value = formatErrorDetail(error)
      emit('error', message)
      console.error('[ShakaVideoPlayer] Init error:', error)
    }
  }

  /** Handle Shaka error events */
  function onPlayerError (event: Event) {
    const detail = (event as CustomEvent).detail
    const code = detail?.code ?? 'UNKNOWN'
    const message = `Playback error (code: ${code})`
    playerError.value = message
    errorDetail.value = formatErrorDetail(detail)
    emit('error', message)
    console.error('[ShakaVideoPlayer] Shaka error:', detail)
  }

  /** Build a human-readable string with full error info for debugging */
  function formatErrorDetail (error: unknown): string {
    const lines: string[] = []
    lines.push(`Timestamp: ${new Date().toISOString()}`)
    lines.push(`Source: ${props.src}`)
    lines.push(`User-Agent: ${navigator.userAgent}`)
    lines.push('')

    if (error && typeof error === 'object') {
      const e = error as Record<string, unknown>
      if (e.code != null) lines.push(`Code: ${e.code}`)
      if (e.category != null) lines.push(`Category: ${e.category}`)
      if (e.severity != null) lines.push(`Severity: ${e.severity}`)
      if (e.message) lines.push(`Message: ${e.message}`)
      if (e.data) {
        try {
          lines.push(`Data: ${JSON.stringify(e.data, null, 2)}`)
        } catch {
          lines.push(`Data: ${String(e.data)}`)
        }
      }
      if (e.name) lines.push(`Name: ${e.name}`)
      if (e.stack) lines.push(`\nStack:\n${e.stack}`)
    } else {
      lines.push(`Error: ${String(error)}`)
    }

    return lines.join('\n')
  }

  /** Copy error detail to clipboard */
  async function copyErrorDetail () {
    try {
      await navigator.clipboard.writeText(errorDetail.value)
      copied.value = true
      setTimeout(() => { copied.value = false }, 2000)
    } catch {
      // Fallback: select text if clipboard API is unavailable
    }
  }

  /** Forward timeupdate events */
  function onTimeUpdate () {
    if (videoRef.value) {
      emit('timeupdate', videoRef.value.currentTime, videoRef.value.duration || 0)
    }
  }

  /** Retry loading the current source */
  async function retry () {
    await initPlayer()
  }

  /** Cleanly destroy the Shaka player instance */
  async function destroyPlayer () {
    if (uiOverlay) {
      uiOverlay.destroy()
      uiOverlay = null
    }
    if (player) {
      player.removeEventListener('error', onPlayerError)
      await player.destroy()
      player = null
    }
  }

  // Expose methods for parent component usage
  defineExpose({
    /** Seek to a specific time in seconds */
    seekTo: (time: number) => {
      if (videoRef.value) videoRef.value.currentTime = time
    },
    /** Pause playback */
    pause: () => videoRef.value?.pause(),
    /** Resume playback */
    play: () => videoRef.value?.play(),
  })

  // Watch for src changes — re-initialize player
  watch(() => props.src, async (newSrc, oldSrc) => {
    if (newSrc && newSrc !== oldSrc) {
      if (player) {
        try {
          playerError.value = null
          await player.load(newSrc)
        } catch {
          // If load fails, try full re-init
          await initPlayer()
        }
      } else {
        await initPlayer()
      }
    }
  })

  onMounted(() => {
    initPlayer()
  })

  onBeforeUnmount(async () => {
    await destroyPlayer()
  })
</script>

<style scoped>
  .shaka-player-container {
    aspect-ratio: 16 / 9;
    width: 100%;
    position: relative;
  }

  .shaka-video {
    display: block;
    object-fit: contain;
    background: black;
  }
</style>

<style>
  /*
   * Shaka UI overrides — keep the player controls visually consistent
   * with the EarnLumens dark theme. These are global because Shaka
   * injects its UI elements outside scoped component boundaries.
   */
  .shaka-player-container .shaka-controls-container {
    /* Ensure controls sit above poster/overlays */
    z-index: 2;
  }
</style>
