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
    :class="[containerClass, { 'shaka-is-buffering': isBuffering }]"
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
      @canplay="isBuffering = false"
      @ended="$emit('ended')"
      @loadeddata="isBuffering = false"
      @pause="$emit('pause')"
      @play="$emit('play')"
      @playing="onPlaying"
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
  /**
   * True while the player is loading the source or buffering during playback.
   * Used to hide Shaka's big centered play button while the spinner is visible
   * (otherwise both overlap — most noticeable on mobile where autoplay is
   * blocked and the video stays paused after load).
   */
  const isBuffering = ref(false)

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
    isBuffering.value = true

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
      // Buffering listener — keep the play button hidden while the spinner shows
      player.addEventListener('buffering', onBuffering)

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

  /** Track Shaka buffering state to hide the centered play button while loading */
  function onBuffering (event: Event) {
    isBuffering.value = !!(event as Event & { buffering?: boolean }).buffering
  }

  /** Build a human-readable string with full error info for debugging */
  function formatErrorDetail (error: unknown): string {
    const lines: string[] = [
      `Timestamp: ${new Date().toISOString()}`,
      `Source: ${props.src}`,
      `User-Agent: ${navigator.userAgent}`,
      '',
    ]

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
      setTimeout(() => {
        copied.value = false
      }, 2000)
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
      player.removeEventListener('buffering', onBuffering)
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

  /** True when this player's <video> is the active Picture-in-Picture element */
  function isInPictureInPicture (): boolean {
    const video = videoRef.value
    if (!video) return false
    if (document.pictureInPictureElement === video) return true
    // Safari/iOS uses a non-standard presentation mode flag
    return (video as { webkitPresentationMode?: string }).webkitPresentationMode === 'picture-in-picture'
  }

  /**
   * Keep a Picture-in-Picture video playing across SPA navigation.
   *
   * When the user navigates away while PiP is open, Vue would unmount this
   * component and remove the <video> from the DOM, which closes the PiP window.
   * To avoid that, we move the <video> into a hidden, persistent host appended
   * to <body> *before* Vue tears the component down. Vue unmounts nested
   * children without removing them individually, so once the node is reparented
   * it survives and the PiP keeps playing. We keep the Shaka player alive and
   * tear everything down only when the user finally closes PiP.
   *
   * @returns true if the video was handed off (caller must skip destroyPlayer).
   */
  function handoffToPictureInPicture (): boolean {
    const video = videoRef.value
    if (!video || !isInPictureInPicture()) return false

    const host = document.createElement('div')
    host.dataset.pipOrphan = 'true'
    host.style.cssText = 'position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;'
    document.body.append(host)
    host.append(video)

    let cleaned = false
    const cleanup = async () => {
      if (cleaned) return
      cleaned = true
      video.removeEventListener('leavepictureinpicture', cleanup)
      // Make sure the PiP window is actually closed (it may still be open when
      // cleanup is triggered programmatically rather than by the user).
      try {
        if (document.pictureInPictureElement === video) {
          await document.exitPictureInPicture()
        } else if ((video as { webkitPresentationMode?: string }).webkitPresentationMode === 'picture-in-picture') {
          (video as { webkitSetPresentationMode?: (mode: string) => void }).webkitSetPresentationMode?.('inline')
        }
      } catch { /* PiP already closed */ }
      await destroyPlayer()
      host.remove()
    }
    // Expose cleanup so a freshly-mounted player can close this orphan when it
    // starts playing.
    ;(host as { _pipCleanup?: () => Promise<void> })._pipCleanup = cleanup
    video.addEventListener('leavepictureinpicture', cleanup)
    return true
  }

  /**
   * Close any Picture-in-Picture window that survived a previous navigation
   * (an orphaned <video> parked in <body>). Called when a fresh player starts
   * playing so the old PiP doesn't keep running alongside the new video.
   */
  async function closeOrphanedPipPlayers () {
    const hosts = document.querySelectorAll('[data-pip-orphan="true"]')
    for (const host of hosts) {
      await (host as { _pipCleanup?: () => Promise<void> })._pipCleanup?.()
    }
  }

  /** Video started playing — clear the spinner and close any orphaned PiP */
  function onPlaying () {
    isBuffering.value = false
    // A handed-off (orphaned) <video> keeps Vue's leftover @playing listener
    // attached even after unmount, because we keep the node alive in <body>.
    // Guard against it: only a live, in-page player should close previous
    // orphans — otherwise the orphan would close (and stop) itself.
    if (videoRef.value?.closest('[data-pip-orphan="true"]')) return
    void closeOrphanedPipPlayers()
  }

  onBeforeUnmount(async () => {
    // If the video is in Picture-in-Picture, keep it alive across navigation
    // instead of destroying it.
    if (handoffToPictureInPicture()) return
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

  /*
   * While loading/buffering, Shaka shows its spinner. Hide the big centered
   * play button during that window so it doesn't overlap the spinner. Most
   * visible on mobile (iOS/Android), where autoplay is blocked and the video
   * stays paused after load — once buffering ends the play button reappears
   * so the user can tap to start.
   */
  .shaka-player-container.shaka-is-buffering .shaka-play-button-container,
  .shaka-player-container.shaka-is-buffering .shaka-play-button {
    display: none !important;
  }
</style>
