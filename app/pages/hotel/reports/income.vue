<script setup lang="ts">
definePageMeta({
  layout: 'hotel',
  middleware: 'hotel-only',
})

const { t, locale } = useI18n()

useSeoMeta({
  title: () => `${t('hotel.income.metaTitle')} - TravelHub`,
})

const { params, comparison, trends, loading, error, load } = useIncomeReport()

const currencyOptions = computed(() => {
  const list = trends.value?.available_currencies?.length
    ? trends.value.available_currencies
    : comparison.value?.current.available_currencies ?? []
  return list.map(code => ({ label: code, value: code }))
})

const trendsChartKey = computed(() =>
  [
    params.value.year,
    params.value.month ?? 'all',
    params.value.currency ?? 'default',
    trends.value?.buckets?.map(b => `${b.bucket}:${b.revenue}`).join('|') ?? 'empty',
  ].join('::'),
)

const rangeLabel = computed(() => {
  const { year, month } = params.value
  if (month === null) return String(year)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString(locale.value, { month: 'long', year: 'numeric' })
})

function onCurrencyChange(value: string) {
  params.value.currency = value
  void load()
}

watch(
  () => [params.value.year, params.value.month],
  () => load(),
)

onMounted(() => load())
</script>

<template>
  <div class="flex flex-col gap-8 p-8" data-cy="hotel-income-report">
    <div class="flex flex-col gap-1">
      <UButton
        to="/hotel/dashboard"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        size="sm"
        class="w-fit"
      >
        {{ t('hotel.detail.backToDashboard') }}
      </UButton>
      <h1 class="mt-2 text-3xl font-black tracking-tight text-(--ui-text-highlighted)">
        {{ t('hotel.income.title') }}
      </h1>
      <p class="text-base text-(--ui-text-muted)">
        {{ t('hotel.income.subtitle') }}
      </p>
    </div>

    <UAlert
      v-if="error"
      data-cy="hotel-income-error"
      icon="i-lucide-alert-circle"
      color="error"
      :title="t('hotel.income.errors.load')"
      :description="error"
    />

    <div class="flex flex-wrap items-end gap-4">
      <HotelIncomeMonthYearPicker
        :year="params.year"
        :month="params.month"
        @update:year="(v) => { params.year = v }"
        @update:month="(v) => { params.month = v }"
      />
    </div>

    <HotelIncomeRevenueSummaryCard
      :comparison="comparison"
      :loading="loading && !comparison"
      data-testid="income-summary-card"
    />

    <HotelRevenueTrendsChart
      :key="trendsChartKey"
      :data="trends"
      :loading="loading && !trends"
      :range-label="rangeLabel"
      :currency-options="currencyOptions"
      :selected-currency="params.currency"
      @update:currency="onCurrencyChange"
    />
  </div>
</template>
