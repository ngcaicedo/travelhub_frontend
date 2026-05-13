<script setup lang="ts">
import type { SeasonalPricingWritePayload } from '~/types/seasonalPricing'
import { formatSeasonalPricingCurrency } from '~/utils/seasonalPricingFormatters'

const props = defineProps<{
  draft: SeasonalPricingWritePayload
}>()

const { t } = useI18n()

const revenueUplift = computed(() => {
  const amount = props.draft.price_per_night * 0.12
  return formatSeasonalPricingCurrency(amount, props.draft.currency || 'COP')
})

const adrChange = computed(() => {
  const amount = props.draft.price_per_night * 0.08
  return formatSeasonalPricingCurrency(amount, props.draft.currency || 'COP')
})

const thresholdHits = computed(() => {
  const hits = Math.round((props.draft.tax_rate + 0.1) * 10)
  return Math.max(1, hits)
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold text-(--ui-text-highlighted)">{{ t('hotel.pricing.preview.title') }}</h2>
        <UBadge color="success" variant="subtle">{{ t('hotel.pricing.preview.simulated') }}</UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-xs uppercase tracking-wide text-(--ui-text-muted)">
        {{ t('hotel.pricing.preview.estimatedImpact') }}
      </p>

      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-(--ui-text-muted)">{{ t('hotel.pricing.preview.revenueUplift') }}</span>
          <span class="text-sm font-semibold text-emerald-500">{{ revenueUplift }}</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-(--ui-text-muted)">{{ t('hotel.pricing.preview.avgAdrChange') }}</span>
          <span class="text-sm font-semibold text-primary">{{ adrChange }}</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-(--ui-text-muted)">{{ t('hotel.pricing.preview.occThresholdHits') }}</span>
          <span class="text-sm font-semibold text-(--ui-text-highlighted)">{{ thresholdHits }} {{ t('hotel.pricing.preview.nightsSuffix') }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>
