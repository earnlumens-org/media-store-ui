<template>
  <v-card class="w-100" :max-width="maxWidth" style="margin: auto">
    <v-card-title v-if="title" class="text-subtitle-1">
      {{ title }}
    </v-card-title>

    <v-card-text class="pa-0">
      <div class="w-100" :style="{ height: heightCss }">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </v-card-text>

    <v-divider v-if="total !== undefined" />

    <v-card-actions v-if="total !== undefined" class="justify-center">
      <span class="text-overline">{{ resolvedTotalLabel }}</span>
      <span class="text-primary font-weight-bold ms-1">{{ total }}</span>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
  import {
    CategoryScale,
    type ChartData,
    type ChartDataset,
    Chart as ChartJS,
    type ChartOptions,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
  } from 'chart.js'
  import { computed } from 'vue'
  import { Line } from 'vue-chartjs'
  import { useTheme } from 'vuetify'

  defineOptions({ name: 'CxLineChartCard' })

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  )

  interface Props {
    labels: string[]
    values?: Array<number | null>
    datasets?: Array<ChartDataset<'line', Array<number | null>>>
    options?: ChartOptions<'line'>

    title?: string
    total?: string | number
    totalLabel?: string

    datasetLabel?: string
    color?: string

    height?: number | string
    maxWidth?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '',
    totalLabel: '',
    datasetLabel: '',
    height: 350,
    maxWidth: 800,
  })

  const theme = useTheme()

  function toRgba (color: string, alpha: number): string {
    const hex = color.trim()
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex)
    if (!match) return color

    const raw = match[1]
    if (!raw) return color

    let normalized = raw
    if (raw.length === 3) {
      normalized = raw.split('').map(c => c + c).join('')
    } else if (raw.length === 8) {
      normalized = raw.slice(0, 6)
    }

    const r = Number.parseInt(normalized.slice(0, 2), 16)
    const g = Number.parseInt(normalized.slice(2, 4), 16)
    const b = Number.parseInt(normalized.slice(4, 6), 16)
    const a = Math.max(0, Math.min(1, alpha))
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  const heightCss = computed(() => {
    if (typeof props.height === 'number') return `${props.height}px`
    return props.height
  })

  const resolvedTotalLabel = computed(() => props.totalLabel || props.title)

  const resolvedPrimary = computed(() => props.color || theme.current.value.colors.primary || 'currentColor')
  const resolvedOnSurface = computed(() => theme.current.value.colors['on-surface'] || theme.current.value.colors.primary || 'currentColor')

  const chartData = computed<ChartData<'line', Array<number | null>>>(() => {
    const labels = props.labels

    const datasets = props.datasets?.length
      ? props.datasets.map(ds => ({
        ...ds,
        data: Array.isArray(ds.data) ? [...ds.data] : ds.data,
      }))
      : [
        {
          label: props.datasetLabel || undefined,
          data: props.values ? [...props.values] : [],
          borderColor: resolvedPrimary.value,
          backgroundColor: toRgba(resolvedPrimary.value, 0.2),
          pointBackgroundColor: resolvedPrimary.value,
          pointBorderColor: resolvedPrimary.value,
          tension: 0.35,
        },
      ]

    return { labels, datasets }
  })

  const defaultOptions = computed<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: toRgba(resolvedOnSurface.value, 0.7) },
        grid: { color: toRgba(resolvedOnSurface.value, 0.14) },
      },
      y: {
        ticks: { color: toRgba(resolvedOnSurface.value, 0.7) },
        grid: { color: toRgba(resolvedOnSurface.value, 0.14) },
      },
    },
    plugins: {
      legend: {
        labels: { color: toRgba(resolvedOnSurface.value, 0.8) },
      },
    },
  }))

  const chartOptions = computed<ChartOptions<'line'>>(() => {
    const incoming = props.options
    if (!incoming) return defaultOptions.value

    return {
      ...defaultOptions.value,
      ...incoming,
      plugins: {
        ...defaultOptions.value.plugins,
        ...incoming.plugins,
        legend: {
          ...defaultOptions.value.plugins?.legend,
          ...incoming.plugins?.legend,
          labels: {
            ...defaultOptions.value.plugins?.legend?.labels,
            ...incoming.plugins?.legend?.labels,
          },
        },
      },
      scales: {
        ...defaultOptions.value.scales,
        ...incoming.scales,
      },
    }
  })
</script>
