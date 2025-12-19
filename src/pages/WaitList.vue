<template>
  <v-container fluid>
    <CxLineChartCard
      dataset-label="users"
      :height="350"
      :labels="labels"
      :max-width="900"
      title="Waitlist Users"
      :total="total"
      total-label="Total users on waitlist"
      :values="values"
    />
  </v-container>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'

  import { api } from '@/api/api'

  const labels = ref<string[]>([])
  const values = ref<number[]>([])

  onMounted(async () => {
    const stats = await api.waitlist.getStats()
    labels.value = stats.labels
    values.value = stats.values
  })

  const total = computed(() => values.value.at(-1) ?? 0)
</script>

<route lang="json">
{
  "path": "/waitlist"
}
</route>
