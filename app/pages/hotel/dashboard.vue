<script setup lang="ts">
import type { HostReservationItem, HostReservationsFilters } from '~/types/hotel'

definePageMeta({
  layout: 'hotel',
  middleware: 'hotel-only',
})

const router = useRouter()
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

function onReservationSelect(item: HostReservationItem) {
  router.push(`/hotel/reservations/${item.id}`)
}

const today = new Date()
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

const initialStart = thirtyDaysAgo.toISOString().slice(0, 10)
const initialEnd = today.toISOString().slice(0, 10)

const filters = reactive<HostReservationsFilters>({
  status: [],
  start_date: initialStart,
  end_date: initialEnd,
  guest_name: '',
  sort_by: 'check_in_date',
  sort_dir: 'desc',
  page: 1,
  page_size: 10,
})

const dateRangeDraft = reactive({
  start_date: initialStart,
  end_date: initialEnd,
})

const selectedCurrency = ref<string | undefined>(undefined)

function buildFilters(): HostReservationsFilters {
  const out: HostReservationsFilters = { ...filters }
  if (out.start_date) out.start_date = new Date(out.start_date).toISOString()
  if (out.end_date) out.end_date = new Date(out.end_date).toISOString()
  return out
}

function buildRange() {
  return {
    start_date: filters.start_date ? new Date(filters.start_date).toISOString() : undefined,
    end_date: filters.end_date ? new Date(filters.end_date).toISOString() : undefined,
    currency: selectedCurrency.value,
  }
}

async function reload() {
  const range = buildRange()
  await Promise.all([
    refreshReservations(buildFilters()),
    refreshMetrics(range),
    refreshTrends({ ...range, granularity: 'week' }),
  ])
}

watch(
  () => [filters.page, filters.sort_by, filters.sort_dir],
  () => refreshReservations(buildFilters()),
)

function applyDateRange() {
  filters.start_date = dateRangeDraft.start_date
  filters.end_date = dateRangeDraft.end_date
  filters.page = 1
  reload()
}

function resetDateRange() {
  dateRangeDraft.start_date = initialStart
  dateRangeDraft.end_date = initialEnd
  applyDateRange()
}

function onTableFiltersUpdate(value: HostReservationsFilters) {
  Object.assign(filters, value, {
    page: 1,
    start_date: filters.start_date,
    end_date: filters.end_date,
  })
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

const rangeLabel = computed(() => {
  if (!filters.start_date || !filters.end_date) return ''
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(locale.value, { month: 'short', day: '2-digit' })
  return `${fmt(filters.start_date)} – ${fmt(filters.end_date)}`
})

const currencyOptions = computed(() => {
  const list = trends.value?.available_currencies?.length
    ? trends.value.available_currencies
    : metrics.value?.available_currencies ?? []
  return list.map(code => ({ label: code, value: code }))
})

watch(
  () => trends.value?.available_currencies,
  (list) => {
    if (!selectedCurrency.value && list && list.length > 0) {
      selectedCurrency.value = list[0]
    }
  },
)

function onCurrencyChange(value: string) {
  selectedCurrency.value = value
  reload()
}
</script>

<template>
  <div class="flex flex-col gap-8 p-8">
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-black tracking-tight text-(--ui-text-highlighted)">
        {{ t('hotel.dashboard.welcomeTitle') }}
      </h1>
      <p class="text-base text-(--ui-text-muted)">
        {{ t('hotel.dashboard.welcomeSubtitle') }}
      </p>
    </div>

    <UAlert
      v-if="error"
      icon="i-lucide-alert-circle"
      color="error"
      :title="t('hotel.dashboard.error')"
      :description="error"
    />

    <UCard :ui="{ body: 'p-4' }">
      <div class="flex flex-wrap items-end gap-3">
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-(--ui-text-muted)">
            {{ t('hotel.dashboard.filters.startDate') }}
          </span>
          <UInput v-model="dateRangeDraft.start_date" type="date" class="w-[150px]" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-(--ui-text-muted)">
            {{ t('hotel.dashboard.filters.endDate') }}
          </span>
          <UInput v-model="dateRangeDraft.end_date" type="date" class="w-[150px]" />
        </label>
        <UButton
          variant="ghost"
          :label="t('hotel.dashboard.filters.clear')"
          @click="resetDateRange"
        />
        <UButton
          :label="t('hotel.dashboard.filters.apply')"
          @click="applyDateRange"
        />
      </div>
    </UCard>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>

    <HotelRevenueTrendsChart
      :data="trends"
      :loading="loading && !trends"
      :range-label="rangeLabel"
      :currency-options="currencyOptions"
      :selected-currency="selectedCurrency"
      @update:currency="onCurrencyChange"
    />

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
      @select="onReservationSelect"
    >
      <template #filters>
        <HotelReservationFilters
          :model-value="filters"
          @update:model-value="onTableFiltersUpdate"
        />
      </template>
    </HotelReservationsTable>
  </div>
</template>
