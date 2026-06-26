<template>
  <v-container class="hero-container pt-md-10" fluid>
    <v-row align="center" class="flex-column flex-md-row mx-auto hero-row">
      <!-- RIGHT (first on mobile) -->
      <v-col class="order-1 order-md-2" cols="12" md="6">
        <div class="d-flex align-center justify-center h-100">
          <div class="logo-glow-container">
            <div class="gargantua-effect" />
            <v-img
              alt="EARNLUMENS logo"
              class="mx-auto fire-logo"
              contain
              max-width="420"
              :src="fireLogo"
              width="100%"
            />
          </div>
        </div>
      </v-col>

      <!-- LEFT (second on mobile) -->
      <v-col class="order-2 order-md-1 text-center text-md-left" cols="12" md="6">
        <div class="mx-auto">
          <v-chip
            class="mb-6 text-uppercase font-weight-medium"
            color="primary"
            label
            size="small"
            variant="tonal"
          >
            {{ $t("Common.welcome") }}
          </v-chip>

          <h1 class="title-hero mb-6" :class="{ 'title-hero--ready': fontsReady }">
            EARNLUMENS
          </h1>

          <p class="text-body-1 text-md-h6 text-medium-emphasis mb-10">
            {{ $t("Common.shortAbout") }}
          </p>

          <v-card class="mb-10 quote-card" color="transparent" flat>
            <v-card-text class="pa-0 d-flex">
              <v-divider
                class="me-4 border-opacity-100"
                color="primary"
                thickness="3"
                vertical
              />
              <p class="text-subtitle-1 text-medium-emphasis ma-0">
                {{ $t("Common.blockquote") }}
              </p>
            </v-card-text>
          </v-card>

          <div class="d-flex flex-wrap ga-4 justify-center justify-md-start">
            <v-btn
              :block="smAndDown"
              class="hero-btn px-8 text-none font-weight-bold"
              color="primary"
              elevation="2"
              rounded="lg"
              size="x-large"
              @click="showVerification = true"
            >
              {{ $t("Home.claimFreeVerification") }}
              <template #append>
                <v-icon icon="mdi-check-decagram" />
              </template>
            </v-btn>

            <VerificationDialog v-model="showVerification" />

            <v-btn
              :block="smAndDown"
              class="hero-btn px-6 text-none font-weight-medium"
              rounded="lg"
              size="x-large"
              to="/explore"
              variant="outlined"
            >
              <template #prepend>
                <v-icon icon="mdi-compass-outline" />
              </template>
              {{ $t("Home.aboutXLM") }}
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useDisplay } from 'vuetify'

  import fireLogoImg from '@/assets/fire.svg'
  import VerificationDialog from '@/components/home/VerificationDialog.vue'

  const { smAndDown } = useDisplay()

  const fireLogo = ref(fireLogoImg)
  const showVerification = ref(false)

  // The title renders at font-weight 900. Until the real Roboto Black face is
  // loaded the browser paints a faux-bold fallback whose glyph widths differ,
  // so a plain reveal would still show a swap. Keep the title invisible (its
  // box stays reserved, so nothing below shifts) until the 900 face is ready,
  // then fade it in — the user only ever sees the final Roboto Black. A short
  // safety cap guarantees the title is never hidden for long on slow networks.
  const fontsReady = ref(false)
  onMounted(() => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (!fonts?.load) {
      fontsReady.value = true
      return
    }
    let settled = false
    const reveal = () => {
      if (settled) return
      settled = true
      fontsReady.value = true
    }
    fonts.load('900 1rem "Roboto"').then(reveal).catch(reveal)
    setTimeout(reveal, 1200)
  })
</script>

<style scoped>
.title-hero {
  font-size: 2.5rem;
  line-height: 1.05;
  font-weight: 900;
  letter-spacing: -0.02em;
  /* Hidden until the Roboto Black face is loaded (see fontsReady), keeping its
     box reserved so the fade-in introduces no layout shift. */
  opacity: 0;
  transition: opacity 0.4s ease;
}

.title-hero--ready {
  opacity: 1;
}

@media (min-width: 960px) {
  .title-hero {
    font-size: 4.75rem;
  }
}

.hero-container {
  overflow-x: clip;
}

/* Let long localized labels wrap instead of overflowing/clipping the button,
   and allow the button to grow vertically while keeping the tap target. */
.hero-btn {
  height: auto;
  min-height: 52px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.hero-btn :deep(.v-btn__content) {
  white-space: normal;
  word-break: break-word;
  text-align: center;
  line-height: 1.25;
}

.hero-row {
  max-width: 1200px;
}

.fire-logo {
  will-change: transform;
  animation: floaty 14s cubic-bezier(0.37, 0, 0.63, 1) infinite;
}

.logo-glow-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  contain: layout style;
}

.gargantua-effect {
  position: absolute;
  inset: -25%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(var(--v-theme-primary), 0.23) 0%,
    rgba(var(--v-theme-primary), 0.10) 40%,
    transparent 70%
  );
  filter: blur(32px);
  pointer-events: none;
  will-change: opacity;
  animation: pulse-aura 14s ease-in-out infinite;
}

.gargantua-effect::before,
.gargantua-effect::after {
  content: '';
  position: absolute;
  inset: 18%;
  border-radius: 50%;
  background: conic-gradient(
    from -12deg,
    transparent 0deg,
    rgba(var(--v-theme-primary), 0.50) 12deg,
    rgba(var(--v-theme-primary), 0.35) 22deg,
    transparent 42deg
  );
  filter: blur(6px);
  will-change: transform, opacity;
}

.gargantua-effect::before {
  animation: wave-cw 14s linear infinite -3s;
}

.gargantua-effect::after {
  animation: wave-ccw 12s linear infinite -7s;
}

@keyframes wave-cw {
  0% { transform: rotate(180deg); opacity: 0; }
  6% { opacity: 0.81; }
  94% { transform: rotate(360deg); opacity: 0.81; }
  100% { transform: rotate(360deg); opacity: 0; }
}

@keyframes wave-ccw {
  0% { transform: rotate(180deg); opacity: 0; }
  6% { opacity: 0.69; }
  94% { transform: rotate(0deg); opacity: 0.69; }
  100% { transform: rotate(0deg); opacity: 0; }
}

@keyframes pulse-aura {
  0%, 100% { opacity: 0.50; }
  50% { opacity: 0.81; }
}

@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@media (prefers-reduced-motion: reduce) {
  .fire-logo,
  .gargantua-effect,
  .gargantua-effect::before,
  .gargantua-effect::after {
    animation: none;
  }
  .gargantua-effect { opacity: 0.63; }
}
</style>
