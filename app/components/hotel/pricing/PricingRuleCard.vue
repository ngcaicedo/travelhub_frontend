<script setup lang="ts">
import type { SeasonalPricingResponse } from '~/types/seasonalPricing'
import {
  formatSeasonalPricingCurrency,
  formatSeasonalPricingDateRange,
} from '~/utils/seasonalPricingFormatters'

import PricingRuleIntegrityBadge from '~/components/hotel/pricing/PricingRuleIntegrityBadge.vue'

const props = defineProps<{
  rule: SeasonalPricingResponse
  propertyId: string
}>()

const { t } = useI18n()

const formattedPrice = computed(() =>
  formatSeasonalPricingCurrency(
    props.rule.price_per_night,
    props.rule.currency,
  ),
)

const formattedRange = computed(() =>
  formatSeasonalPricingDateRange(
    props.rule.season_start,
    props.rule.season_end,
  ),
)
</script>

<template>
  <UCard>
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <p class="text-sm font-semibold text-(--ui-text-highlighted)">
          {{ formattedRange }}
        </p>
        <p class="text-xs text-(--ui-text-muted)">
          {{ t('hotel.pricing.ruleCard.baseRate') }}: {{ formattedPrice }}
        </p>
      </div>

      <PricingRuleIntegrityBadge :rule="rule" />
    </div>

    <template #footer>
      <div class="flex items-center justify-end">
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-pencil"
          :to="`/hotel/pricing/edit/${propertyId}/${rule.id}`"
        >
          {{ t('hotel.pricing.actions.editRule') }}
        </UButton>
      </div>
    </template>
  </UCard>
</template>
