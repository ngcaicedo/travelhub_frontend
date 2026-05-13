<script setup lang="ts">
import type { SeasonalPricingResponse } from '~/types/seasonalPricing'
import PricingRuleCard from '~/components/hotel/pricing/PricingRuleCard.vue'

defineProps<{
  items: ReadonlyArray<SeasonalPricingResponse>
  propertyId: string
}>()

const { t } = useI18n()
</script>

<template>
  <div v-if="items.length === 0" class="rounded-xl border border-dashed border-default p-8 text-center">
    <p class="text-sm text-(--ui-text-muted)">
      {{ t('hotel.pricing.rules.empty') }}
    </p>
  </div>

  <div v-else class="grid gap-4">
    <PricingRuleCard
      v-for="rule in items"
      :key="rule.id"
      :rule="rule"
      :property-id="propertyId"
    />
  </div>
</template>
