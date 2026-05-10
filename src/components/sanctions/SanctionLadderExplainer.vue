<template>
  <div>
    <p v-if="intro" class="text-body-2 text-medium-emphasis mb-3">
      {{ intro }}
    </p>
    <ol class="sanction-ladder-list pl-0 ma-0">
      <li v-for="(step, idx) in steps" :key="idx" class="d-flex align-start ga-3 mb-3">
        <v-avatar
          class="flex-shrink-0"
          :color="step.color"
          size="32"
          variant="tonal"
        >
          <v-icon size="20">{{ step.icon }}</v-icon>
        </v-avatar>
        <div class="flex-grow-1">
          <div class="text-body-2 font-weight-medium">{{ step.title }}</div>
          <div class="text-caption text-medium-emphasis">{{ step.body }}</div>
        </div>
      </li>
    </ol>
    <p v-if="severeNote" class="text-caption text-medium-emphasis mt-2 mb-0">
      <v-icon class="me-1" color="error" size="14">mdi-alert-octagon-outline</v-icon>
      {{ severeNote }}
    </p>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'

  const { t, te } = useI18n()

  function tr (key: string, fallback: string): string {
    return te(key) ? t(key) : fallback
  }

  const intro = computed(() =>
    tr(
      'Sanctions.intro',
      'EarnLumens uses a 3-strike system inspired by the largest video platforms. Every infraction is reviewed by a human moderator before a strike is recorded.',
    )
  )

  const severeNote = computed(() =>
    tr(
      'Sanctions.severeNote',
      'Severe violations (fraud, harm to minors, deepfakes, doxxing) skip the ladder and result in an immediate permanent ban.',
    )
  )

  const steps = computed(() => [
    {
      icon: 'mdi-bell-alert-outline',
      color: 'warning',
      title: tr('Sanctions.steps.warning.title', 'Warning'),
      body: tr(
        'Sanctions.steps.warning.body',
        'First minor infraction. The content is removed but your account is not blocked. You stay logged in.',
      ),
    },
    {
      icon: 'mdi-alert-decagram',
      color: 'warning',
      title: tr('Sanctions.steps.strike1.title', 'First strike — 7-day block'),
      body: tr(
        'Sanctions.steps.strike1.body',
        'Login is blocked for 7 days. The account auto-unbans when the timer expires; the strike stays on record.',
      ),
    },
    {
      icon: 'mdi-alert-decagram',
      color: 'warning',
      title: tr('Sanctions.steps.strike2.title', 'Second strike — 30-day block'),
      body: tr(
        'Sanctions.steps.strike2.body',
        'A second strike within the same record extends the block to 30 days.',
      ),
    },
    {
      icon: 'mdi-account-cancel',
      color: 'error',
      title: tr('Sanctions.steps.strike3.title', 'Third strike — permanent ban'),
      body: tr(
        'Sanctions.steps.strike3.body',
        'A third strike permanently bans the account. Permanent bans can only be lifted by a moderator after appeal.',
      ),
    },
  ])
</script>

<style scoped>
.sanction-ladder-list {
  list-style: none;
}
</style>
