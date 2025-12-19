<template>
  <v-container fluid>
    <v-row class="mb-4" justify="end">
      <v-col cols="auto">
        <v-btn variant="text" @click="regenerate">
          Regenerar
        </v-btn>
      </v-col>
    </v-row>

    <CxLineChartCard
      :height="350"
      :labels="labels"
      :max-width="900"
      title="WaitList (demo)"
      :total="total"
      total-label="Total"
      :values="values"
    />
  </v-container>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'

  const labels = Array.from({ length: 15 }, (_, i) => `#${i + 1}`)

  function generateValues (): number[] {
    return Array.from({ length: 15 }, () => Math.floor(Math.random() * 100))
  }

  const values = ref<number[]>(generateValues())

  function regenerate () {
    values.value = generateValues()
  }

  const total = computed(() => values.value.reduce((sum, n) => sum + n, 0))
</script>

<route lang="json">
{
  "path": "/waitlist/stats"
}
</route>
