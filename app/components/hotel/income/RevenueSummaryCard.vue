<script setup lang="ts">
import type { HostIncomeComparison } from '~/types/hotel'

const props = defineProps<{
  comparison: HostIncomeComparison | null
  loading: boolean
}>()

const { t, locale } = useI18n()

function formatRevenue(amount: string, currency: string | null) {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: currency?.toUpperCase() ?? 'COP',
    maximumFractionDigits: 0,
  }).format(Number(amount))
}

const formattedTotal = computed(() => {
  if (!props.comparison) return '—'
  const { current } = props.comparison
  return formatRevenue(current.revenue_amount, current.revenue_currency)
})

const formattedAdr = computed(() => {
  if (!props.comparison) return '—'
  const { current } = props.comparison
  return formatRevenue(current.average_daily_rate, current.revenue_currency)
})

const formattedOccupancy = computed(() => {
  if (!props.comparison) return '—'
  return `${(props.comparison.current.occupancy_rate * 100).toFixed(1)}%`
})

const changePct = computed(() => props.comparison?.change_percent ?? null)

const changeLabel = computed(() => {
  if (changePct.value === null) return null
  const abs = Math.abs(changePct.value).toFixed(1)
  if (changePct.value > 0) return `+${abs}%`
  if (changePct.value < 0) return `${changePct.value.toFixed(1)}%`
  return '0%'
})

const changeColor = computed(() => {
  if (changePct.value === null) return ''
  if (changePct.value > 0) return 'text-green-600 bg-green-50'
  if (changePct.value < 0) return 'text-red-600 bg-red-50'
  return 'text-slate-600 bg-slate-100'
})
</script>

<template>
  <UCard :ui="{ body: 'p-6' }" data-cy="hotel-income-summary-card">
    <div v-if="loading" class="space-y-3">
      <USkeleton class="h-5 w-32" />
      <USkeleton class="h-9 w-48" />
      <USkeleton class="h-4 w-24" />
    </div>

    <template v-else>
      <p class="text-sm font-medium text-(--ui-text-muted)">
        {{ t('hotel.income.summary.total') }}
      </p>

      <p class="mt-1 text-4xl font-black tracking-tight text-(--ui-text-highlighted)" data-cy="hotel-income-revenue-total">
        {{ formattedTotal }}
      </p>

      <div class="mt-2 flex items-center gap-2">
        <span
          v-if="changeLabel"
          class="rounded-full px-2 py-0.5 text-xs font-bold"
          :class="changeColor"
        >
          {{ changeLabel }}
        </span>
        <span class="text-xs text-(--ui-text-muted)">
          {{ t('hotel.income.summary.vsLastPeriod') }}
        </span>
      </div>

      <div v-if="comparison" class="mt-6 grid grid-cols-3 gap-4 border-t border-(--ui-border) pt-4">
        <div>
          <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.dashboard.kpi.adr') }}</p>
          <p class="mt-0.5 text-sm font-bold text-(--ui-text-highlighted)">{{ formattedAdr }}</p>
        </div>
        <div>
          <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.dashboard.kpi.occupancy') }}</p>
          <p class="mt-0.5 text-sm font-bold text-(--ui-text-highlighted)">{{ formattedOccupancy }}</p>
        </div>
        <div>
          <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.dashboard.kpi.activeBookings') }}</p>
          <p class="mt-0.5 text-sm font-bold text-(--ui-text-highlighted)">
            {{ comparison.current.active_reservations }}
          </p>
        </div>
      </div>
    </template>
  </UCard>
</template>
