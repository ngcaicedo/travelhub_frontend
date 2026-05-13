<script setup lang="ts">
import type { SeasonalPricingWritePayload } from '~/types/seasonalPricing'

const props = withDefaults(defineProps<{
  modelValue: SeasonalPricingWritePayload
  loading?: boolean
  canEdit?: boolean
  submitLabel?: string
}>(), {
  loading: false,
  canEdit: true,
})

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'submit' | 'cancel'): void
  (e: 'update:modelValue', value: SeasonalPricingWritePayload): void
}>()

const triggerType = ref('occupancy')
const occupancyThreshold = ref(80)
const action = ref('increase_price')
const adjustmentAmount = ref(15)
const adjustmentUnit = ref('%')
const roomTypes = reactive({
  standard: true,
  deluxe: true,
  suite: false,
})

function setField<K extends keyof SeasonalPricingWritePayload>(
  key: K,
  value: SeasonalPricingWritePayload[K],
) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

function onSubmit() {
  if (!props.canEdit || props.loading) {
    return
  }

  emit('submit')
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-sliders-horizontal" class="size-5 text-(--ui-primary)" />
          <h2 class="font-semibold text-(--ui-text-highlighted)">{{ t('hotel.pricing.form.ruleBasics') }}</h2>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2">
        <UFormField :label="t('hotel.pricing.form.seasonStart')">
          <UInput
            :model-value="modelValue.season_start"
            type="date"
            :disabled="!canEdit"
            @update:model-value="setField('season_start', String($event))"
          />
        </UFormField>

        <UFormField :label="t('hotel.pricing.form.seasonEnd')">
          <UInput
            :model-value="modelValue.season_end"
            type="date"
            :disabled="!canEdit"
            @update:model-value="setField('season_end', String($event))"
          />
        </UFormField>

        <UFormField :label="t('hotel.pricing.form.pricePerNight')">
          <UInput
            :model-value="modelValue.price_per_night"
            type="number"
            min="0"
            :disabled="!canEdit"
            @update:model-value="setField('price_per_night', Number($event || 0))"
          />
        </UFormField>

        <UFormField :label="t('hotel.pricing.form.currency')">
          <UInput
            :model-value="modelValue.currency"
            maxlength="3"
            :disabled="!canEdit"
            @update:model-value="setField('currency', String($event).toUpperCase())"
          />
        </UFormField>

        <UFormField :label="t('hotel.pricing.form.taxRate')">
          <UInput
            :model-value="modelValue.tax_rate"
            type="number"
            min="0"
            max="1"
            step="0.01"
            :disabled="!canEdit"
            @update:model-value="setField('tax_rate', Number($event || 0))"
          />
        </UFormField>

        <UFormField :label="t('hotel.pricing.form.cleaningFee')">
          <UInput
            :model-value="modelValue.cleaning_fee"
            type="number"
            min="0"
            step="0.01"
            :disabled="!canEdit"
            @update:model-value="setField('cleaning_fee', Number($event || 0))"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-gauge" class="size-5 text-(--ui-primary)" />
          <h2 class="font-semibold text-(--ui-text-highlighted)">{{ t('hotel.pricing.form.triggersAndLogic') }}</h2>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2">
        <UFormField :label="t('hotel.pricing.form.triggerType')">
          <USelect
            v-model="triggerType"
            :disabled="!canEdit"
            :items="[
              { label: t('hotel.pricing.form.triggerOptions.occupancy'), value: 'occupancy' },
              { label: t('hotel.pricing.form.triggerOptions.calendar'), value: 'calendar' },
              { label: t('hotel.pricing.form.triggerOptions.demandSpike'), value: 'demand_spike' },
            ]"
          />
        </UFormField>

        <UFormField :label="t('hotel.pricing.form.whenOccupancyExceeds')">
          <UInput v-model="occupancyThreshold" type="number" min="0" max="100" :disabled="!canEdit" />
        </UFormField>

        <UFormField :label="t('hotel.pricing.form.action')">
          <USelect
            v-model="action"
            :disabled="!canEdit"
            :items="[
              { label: t('hotel.pricing.form.actionOptions.increasePrice'), value: 'increase_price' },
              { label: t('hotel.pricing.form.actionOptions.decreasePrice'), value: 'decrease_price' },
            ]"
          />
        </UFormField>

        <UFormField :label="t('hotel.pricing.form.adjustmentAmount')">
          <UInput v-model="adjustmentAmount" type="number" min="0" :disabled="!canEdit">
            <template #trailing>
              <USelect
                v-model="adjustmentUnit"
                :disabled="!canEdit"
                :items="[
                  { label: '%', value: '%' },
                  { label: '$', value: '$' },
                ]"
                class="w-20"
              />
            </template>
          </UInput>
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-bed-single" class="size-5 text-(--ui-primary)" />
          <h2 class="font-semibold text-(--ui-text-highlighted)">{{ t('hotel.pricing.form.applicability') }}</h2>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-3">
          <p class="text-sm font-medium text-(--ui-text-highlighted)">{{ t('hotel.pricing.form.roomTypes') }}</p>
          <div class="space-y-2 rounded-xl border border-default p-3">
            <UCheckbox v-model="roomTypes.standard" :label="t('hotel.pricing.form.roomTypeOptions.standard')" :disabled="!canEdit" />
            <UCheckbox v-model="roomTypes.deluxe" :label="t('hotel.pricing.form.roomTypeOptions.deluxe')" :disabled="!canEdit" />
            <UCheckbox v-model="roomTypes.suite" :label="t('hotel.pricing.form.roomTypeOptions.suite')" :disabled="!canEdit" />
          </div>
        </div>

        <div class="space-y-3">
          <p class="text-sm font-medium text-(--ui-text-highlighted)">{{ t('hotel.pricing.form.activePeriod') }}</p>
          <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.pricing.form.activePeriodHint') }}</p>
        </div>
      </div>
    </UCard>

    <div class="sticky bottom-0 rounded-xl border border-default bg-(--ui-bg)/95 p-4 backdrop-blur">
      <div class="flex items-center justify-between gap-4">
        <p class="text-xs text-(--ui-text-muted)">
          {{ t('hotel.pricing.form.realTimeHint') }}
        </p>
        <div class="flex items-center gap-3">
          <UButton
            type="button"
            variant="ghost"
            color="neutral"
            @click="emit('cancel')"
          >
            {{ t('hotel.pricing.actions.cancel') }}
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!canEdit"
          >
            {{ submitLabel || t('hotel.pricing.actions.saveRule') }}
          </UButton>
        </div>
      </div>
    </div>
  </form>
</template>
