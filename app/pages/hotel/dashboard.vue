<script setup lang="ts">
import type { HostReservationsFilters } from '~/types/hotel'

definePageMeta({
  layout: 'hotel',
  middleware: 'hotel-only',
})

const { t, locale } = useI18n()
const {
  reservations,
  metrics,
  trends,
  loading,
  error,
  refreshReservations,
  refreshMetrics,
  refreshTrends,
} = useHostReservations()

const today = new Date()
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
const defaultRange = {
  start_date: thirtyDaysAgo.toISOString(),
  end_date: today.toISOString(),
}

const filters = reactive<HostReservationsFilters>({
  status: [],
  start_date: thirtyDaysAgo.toISOString().slice(0, 10),
  end_date: today.toISOString().slice(0, 10),
  guest_name: '',
  sort_by: 'check_in_date',
  sort_dir: 'desc',
  page: 1,
  page_size: 10,
})

function buildFilters(): HostReservationsFilters {
  const out: HostReservationsFilters = { ...filters }
  if (out.start_date) out.start_date = new Date(out.start_date).toISOString()
  if (out.end_date) out.end_date = new Date(out.end_date).toISOString()
  return out
}

async function reload() {
  await Promise.all([
    refreshReservations(buildFilters()),
    refreshMetrics(defaultRange),
    refreshTrends({ ...defaultRange, granularity: 'week' }),
  ])
}

watch(
  () => [filters.page, filters.sort_by, filters.sort_dir],
  () => refreshReservations(buildFilters()),
)

function onFiltersUpdate(value: HostReservationsFilters) {
  Object.assign(filters, value, { page: 1 })
  refreshReservations(buildFilters())
}

onMounted(() => reload())

const formattedRevenue = computed(() => {
  if (!metrics.value) return '—'
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: metrics.value.revenue_currency?.toUpperCase() || 'COP',
    maximumFractionDigits: 0,
  }).format(Number(metrics.value.revenue_amount))
})

const formattedAdr = computed(() => {
  if (!metrics.value) return '—'
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: metrics.value.revenue_currency?.toUpperCase() || 'COP',
    maximumFractionDigits: 0,
  }).format(Number(metrics.value.average_daily_rate))
})

const occupancyPct = computed(() => {
  if (!metrics.value) return '—'
  return `${(metrics.value.occupancy_rate * 100).toFixed(1)}%`
})
</script>

<template>
  <UPageBody class="flex flex-col gap-8">
    <UPageHeader
      :title="t('hotel.dashboard.welcomeTitle')"
      :description="t('hotel.dashboard.welcomeSubtitle')"
    />

    <UAlert
      v-if="error"
      icon="i-lucide-alert-circle"
      color="error"
      :title="t('hotel.dashboard.error')"
      :description="error"
    />

    <UPageGrid class="sm:grid-cols-2 lg:grid-cols-4">
      <HotelKpiCard
        icon="i-lucide-banknote"
        :label="t('hotel.dashboard.kpi.revenue')"
        :value="formattedRevenue"
      />
      <HotelKpiCard
        icon="i-lucide-bed-double"
        :label="t('hotel.dashboard.kpi.occupancy')"
        :value="occupancyPct"
        icon-color="bg-amber-50 text-amber-600"
      />
      <HotelKpiCard
        icon="i-lucide-trending-up"
        :label="t('hotel.dashboard.kpi.adr')"
        :value="formattedAdr"
        icon-color="bg-emerald-50 text-emerald-600"
      />
      <HotelKpiCard
        icon="i-lucide-calendar-check"
        :label="t('hotel.dashboard.kpi.activeBookings')"
        :value="metrics ? String(metrics.active_reservations) : '—'"
        icon-color="bg-fuchsia-50 text-fuchsia-600"
      />
    </UPageGrid>

    <HotelRevenueTrendsChart
      :data="trends"
      :loading="loading && !trends"
    />

    <UCard>
      <template #header>
        <h3 class="text-base font-bold text-(--ui-text-highlighted)">
          {{ t('hotel.dashboard.filters.title') }}
        </h3>
      </template>
      <HotelReservationFilters
        :model-value="filters"
        @update:model-value="onFiltersUpdate"
      />
    </UCard>

    <HotelReservationsTable
      :data="reservations"
      :loading="loading"
      :page="filters.page ?? 1"
      :page-size="filters.page_size ?? 10"
      :sort-by="filters.sort_by ?? 'check_in_date'"
      :sort-dir="filters.sort_dir ?? 'desc'"
      @update:page="(value) => (filters.page = value)"
      @update:sort-by="(value) => (filters.sort_by = value)"
      @update:sort-dir="(value) => (filters.sort_dir = value)"
    />
  </UPageBody>
</template>
