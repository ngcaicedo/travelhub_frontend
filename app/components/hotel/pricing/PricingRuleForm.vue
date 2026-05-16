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
  submitLabel: '',
})

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'submit' | 'cancel'): void
  (e: 'update:modelValue', value: SeasonalPricingWritePayload): void
}>()

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
            :model-value="modelValue.tax_rate * 100"
            type="number"
            min="0"
            max="100"
            step="1"
            :disabled="!canEdit"
            @update:model-value="setField('tax_rate', Number($event || 0) / 100)"
          >
            <template #trailing>
              <span class="text-sm text-(--ui-text-muted)">%</span>
            </template>
          </UInput>
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
