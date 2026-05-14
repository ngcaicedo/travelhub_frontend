<script setup lang="ts">
import type { HostRevenueTrends } from '~/types/hotel'

const props = defineProps<{
  data: HostRevenueTrends | null
  loading: boolean
  rangeLabel?: string
  currencyOptions?: { label: string, value: string }[]
  selectedCurrency?: string
}>()

const emit = defineEmits<{
  'update:currency': [string]
}>()

const { t, locale } = useI18n()

function formatAxisNumber(value: number) {
  return new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatBusinessDateLabel(value: string) {
  const datePart = value.slice(0, 10)
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return value

  return new Date(year, month - 1, day, 12).toLocaleDateString(locale.value, {
    month: 'short',
    day: '2-digit',
  })
}

const option = computed(() => {
  const buckets = props.data?.buckets ?? []
  const values = buckets.map(b => Number(b.revenue))
  const maxValue = values.length ? Math.max(...values) : 0
  return {
    grid: { left: 56, right: 24, top: 24, bottom: 32 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: { name: string, value: number }[]) => {
        const item = params?.[0]
        if (!item) return ''
        const value = new Intl.NumberFormat(locale.value, {
          style: 'currency',
          currency: props.data?.currency?.toUpperCase() || 'COP',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(item.value)
        return `${item.name}<br/><strong>${value}</strong>`
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: buckets.map(b => formatBusinessDateLabel(b.bucket)),
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: values.length === 1 ? Math.ceil(maxValue * 1.5) : undefined,
      axisLabel: {
        color: '#94a3b8',
        fontSize: 10,
        formatter: (value: number) => formatAxisNumber(value),
      },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbolSize: 10,
        lineStyle: { color: '#135bec', width: 3 },
        itemStyle: { color: '#135bec' },
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
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-base font-bold text-(--ui-text-highlighted)">
          {{ t('hotel.dashboard.chart.title') }}
        </h2>
        <div class="flex items-center gap-2">
          <USelect
            v-if="currencyOptions && currencyOptions.length > 1"
            :model-value="selectedCurrency"
            :items="currencyOptions"
            size="xs"
            class="w-[90px]"
            @update:model-value="(value: string) => emit('update:currency', value)"
          />
          <span
            v-if="rangeLabel"
            class="rounded-lg bg-(--ui-bg-elevated) px-3 py-1 text-xs font-bold text-(--ui-text-highlighted)"
          >
            {{ rangeLabel }}
          </span>
        </div>
      </div>
    </template>
    <div v-if="loading" class="h-[220px]">
      <USkeleton class="h-full w-full" />
    </div>
    <div v-else-if="!data || data.buckets.length === 0" class="h-[220px] flex items-center justify-center text-sm text-(--ui-text-muted)">
      {{ t('hotel.dashboard.chart.empty') }}
    </div>
    <ClientOnly v-else>
      <div class="h-[220px] w-full">
        <VChart class="h-full w-full" :option="option" autoresize />
      </div>
    </ClientOnly>
  </UCard>
</template>
