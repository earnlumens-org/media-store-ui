<template>
  <v-responsive :aspect-ratio="aspectRatio">
    <div
      class="position-absolute top-0 left-0 w-100 h-100"
      :class="{ 'media-frame--protected': protect }"
      @contextmenu="onContextMenu"
      @dragstart="onDragStart"
    >
      <v-img
        v-if="src"
        class="w-100 h-100"
        :class="[roundedClass, grayscale ? 'grayscale opacity-60' : '']"
        cover
        height="100%"
        :sizes="srcset ? sizes : undefined"
        :src="src"
        :srcset="srcset"
        width="100%"
      >
        <template #placeholder>
          <v-sheet
            class="w-100 h-100 skeleton-pulse"
            :class="[roundedClass]"
            color="surface-variant"
          />
        </template>

        <template #error>
          <v-sheet
            class="w-100 h-100 d-flex align-center justify-center"
            :class="[roundedClass, grayscale ? 'grayscale opacity-60' : '']"
            :color="fallbackColor"
          >
            <v-icon
              :color="fallbackIconColor"
              :size="fallbackIconSize"
            >
              {{ fallbackIcon }}
            </v-icon>
          </v-sheet>
        </template>
      </v-img>

      <v-sheet
        v-else
        class="w-100 h-100 d-flex align-center justify-center"
        :class="[roundedClass, grayscale ? 'grayscale opacity-60' : '']"
        :color="fallbackColor"
      >
        <v-icon
          :color="fallbackIconColor"
          :size="fallbackIconSize"
        >
          {{ fallbackIcon }}
        </v-icon>
      </v-sheet>

      <slot name="overlay" />
    </div>
  </v-responsive>
</template>

<script setup lang="ts">
  interface Props {
    src?: string
    /**
     * Optional `<img srcset>` string built from the server-supplied
     * variants prefix. When set, the browser picks the best WebP
     * variant for the current display width using the {@link sizes}
     * hint. Falls back to {@link src} when the worker has not (yet)
     * generated variants for this asset.
     */
    srcset?: string
    /**
     * Sizes attribute paired with {@link srcset}. Should describe the
     * rendered width of the image at each breakpoint so the browser
     * can pick the smallest variant that still looks crisp. Ignored
     * when {@link srcset} is empty. Defaults to {@code 100vw} which is
     * always safe but never the smallest possible variant.
     */
    sizes?: string
    aspectRatio?: number
    roundedClass?: string
    grayscale?: boolean
    /**
     * When true, blocks the right-click context menu and native drag
     * on the underlying `<img>`. This is a soft deterrent meant for
     * locked paid media (mainly image entries) so casual users can't
     * “Save image as…” the high-quality `1280.webp` variant from a
     * card or recommendation. It does not prevent determined users
     * from extracting the asset — only the real entitlement check on
     * the API/CDN does.
     */
    protect?: boolean
    fallbackColor?: string
    fallbackIcon?: string
    fallbackIconColor?: string
    fallbackIconSize?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    aspectRatio: 16 / 9,
    sizes: '100vw',
    roundedClass: 'rounded-lg',
    grayscale: false,
    protect: false,
    fallbackColor: 'grey-lighten-3',
    fallbackIcon: 'mdi-image-outline',
    fallbackIconColor: 'grey',
    fallbackIconSize: 64,
  })

  function onContextMenu (event: MouseEvent) {
    if (props.protect) event.preventDefault()
  }

  function onDragStart (event: DragEvent) {
    if (props.protect) event.preventDefault()
  }
</script>

<style scoped>
  .skeleton-pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }

  /*
   * Soft right-click / drag protection. Disabling pointer-events on
   * the actual <img> makes the contextmenu/dragstart events fire on
   * the wrapper div instead, where preventDefault() blocks them.
   */
  .media-frame--protected :deep(img) {
    -webkit-user-drag: none;
    user-select: none;
    pointer-events: none;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
