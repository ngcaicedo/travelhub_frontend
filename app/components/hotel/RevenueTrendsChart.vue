<script setup lang="ts">
import type { HostRevenueTrends } from '~/types/hotel'

const props = defineProps<{
  data: HostRevenueTrends | null
  loading: boolean
}>()

const { t, locale } = useI18n()

const option = computed(() => {
  const buckets = props.data?.buckets ?? []
  return {
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: { name: string, value: number }[]) => {
        const item = params?.[0]
        if (!item) return ''
        const value = new Intl.NumberFormat(locale.value, {
          style: 'currency',
          currency: props.data?.currency?.toUpperCase() || 'COP',
          maximumFractionDigits: 0,
        }).format(item.value)
        return `${item.name}<br/><strong>${value}</strong>`
      },
    },
    xAxis: {
      type: 'category',
      data: buckets.map(b => new Date(b.bucket).toLocaleDateString(locale.value, {
        month: 'short',
        day: '2-digit',
      })),
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#135bec', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(19, 91, 236, 0.25)' },
              { offset: 1, color: 'rgba(19, 91, 236, 0.0)' },
            ],
          },
        },
        data: buckets.map(b => Number(b.revenue)),
      },
    ],
  }
})
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-base font-bold text-slate-900">
        {{ t('hotel.dashboard.chart.title') }}
      </h3>
    </template>
    <div v-if="loading" class="h-[260px]">
      <USkeleton class="h-full w-full" />
    </div>
    <div v-else-if="!data || data.buckets.length === 0" class="h-[260px] flex items-center justify-center text-sm text-slate-500">
      {{ t('hotel.dashboard.chart.empty') }}
    </div>
    <ClientOnly v-else>
      <VChart class="h-[260px]" :option="option" autoresize />
    </ClientOnly>
  </UCard>
</template>
