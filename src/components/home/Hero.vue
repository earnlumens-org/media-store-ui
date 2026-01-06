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

          <h1 class="title-hero mb-6">
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
              class="px-8 text-none font-weight-bold"
              color="primary"
              elevation="2"
              rounded="lg"
              size="x-large"
              to="/waitlist"
            >
              <v-icon class="me-2" icon="mdi-calendar-clock" />
              {{ $t("Home.joinWaitlist") }}
            </v-btn>

            <v-btn
              class="px-6 text-none font-weight-medium"
              href="https://stellar.org/learn/lumens"
              rel="noopener noreferrer"
              rounded="lg"
              size="x-large"
              target="_blank"
              variant="outlined"
            >
              <span class="me-2 d-inline-flex" v-html="stellarSvgIcon" />
              {{ $t("Home.aboutXLM") }}
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'

  import fireLogoImg from '@/assets/fire.svg'
  import stellarSvg from '@/assets/stellar.svg?raw'

  const fireLogo = ref(fireLogoImg)

  const stellarSvgIcon = computed(() => {
    return stellarSvg
      .replace(/\swidth="[^"]*"/, ' width="18"')
      .replace(/\sheight="[^"]*"/, ' height="18"')
  })
</script>

<style scoped>
.title-hero {
  font-size: 2.5rem;
  line-height: 1.05;
  font-weight: 900;
  letter-spacing: -0.02em;
}

@media (min-width: 960px) {
  .title-hero {
    font-size: 4.75rem;
  }
}

.hero-container {
  overflow-x: clip;
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
