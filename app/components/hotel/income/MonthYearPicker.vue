<script setup lang="ts">
const props = defineProps<{
  year: number
  month: number | null
}>()

const emit = defineEmits<{
  'update:year': [number]
  'update:month': [number | null]
}>()

const { t } = useI18n()

const currentYear = new Date().getFullYear()
const yearOptions = computed(() =>
  Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - i
    return { label: String(y), value: y }
  }),
)

const monthOptions = computed(() => [
  { label: t('hotel.income.picker.fullYear'), value: null },
  { label: t('hotel.income.picker.months.jan'), value: 1 },
  { label: t('hotel.income.picker.months.feb'), value: 2 },
  { label: t('hotel.income.picker.months.mar'), value: 3 },
  { label: t('hotel.income.picker.months.apr'), value: 4 },
  { label: t('hotel.income.picker.months.may'), value: 5 },
  { label: t('hotel.income.picker.months.jun'), value: 6 },
  { label: t('hotel.income.picker.months.jul'), value: 7 },
  { label: t('hotel.income.picker.months.aug'), value: 8 },
  { label: t('hotel.income.picker.months.sep'), value: 9 },
  { label: t('hotel.income.picker.months.oct'), value: 10 },
  { label: t('hotel.income.picker.months.nov'), value: 11 },
  { label: t('hotel.income.picker.months.dec'), value: 12 },
])

const selectedYear = computed({
  get: () => props.year,
  set: (v: number) => emit('update:year', v),
})

const selectedMonth = computed({
  get: () => props.month,
  set: (v: number | null) => emit('update:month', v),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-(--ui-text-muted)">
        {{ t('hotel.income.picker.year') }}
      </label>
      <USelect
        v-model="selectedYear"
        :items="yearOptions"
        value-key="value"
        class="w-28"
        data-testid="income-year-select"
      />
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-(--ui-text-muted)">
        {{ t('hotel.income.picker.month') }}
      </label>
      <USelect
        v-model="selectedMonth"
        :items="monthOptions"
        value-key="value"
        class="w-40"
        data-testid="income-month-select"
      />
    </div>
  </div>
</template>
