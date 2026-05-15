<script setup lang="ts">
import type { SeasonalPricingResponse } from '~/types/seasonalPricing'
import { getSeasonalPricingIntegrityState } from '~/utils/seasonalPricingFormatters'

const props = defineProps<{
  rule: Pick<SeasonalPricingResponse, 'integrity_locked' | 'integrity_valid'>
}>()

const { t } = useI18n()

const state = computed(() => getSeasonalPricingIntegrityState(props.rule))

const badge = computed(() => {
  if (state.value === 'compromised') {
    return {
      label: t('hotel.pricing.integrity.compromised'),
      color: 'error' as const,
    }
  }

  if (state.value === 'locked') {
    return {
      label: t('hotel.pricing.integrity.locked'),
      color: 'warning' as const,
    }
  }

  return {
    label: t('hotel.pricing.integrity.normal'),
    color: 'success' as const,
  }
})
</script>

<template>
  <UBadge :color="badge.color" variant="subtle">
    {{ badge.label }}
  </UBadge>
</template>
