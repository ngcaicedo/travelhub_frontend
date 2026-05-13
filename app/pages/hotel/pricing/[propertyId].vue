<script setup lang="ts">
definePageMeta({
  layout: 'hotel',
  middleware: 'hotel-only',
})

import PricingRuleList from '~/components/hotel/pricing/PricingRuleList.vue'

const { t } = useI18n()

const route = useRoute()

const propertyId = computed(() => String(route.params.propertyId || ''))

const {
  items,
  loading,
  error,
} = useSeasonalPricing(propertyId)
</script>

<template>
  <div class="p-8 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="space-y-1">
        <UBreadcrumb
          :items="[
            { label: t('hotel.pricing.breadcrumb.dashboard'), to: '/hotel/pricing' },
            { label: t('hotel.pricing.breadcrumb.propertyRules') },
          ]"
        />
        <h1 class="text-3xl font-black tracking-tight text-(--ui-text-highlighted)">
          {{ t('hotel.pricing.rules.title') }}
        </h1>
      </div>

      <UButton
        color="primary"
        icon="i-lucide-plus"
        :to="`/hotel/pricing/new/${propertyId}`"
      >
        {{ t('hotel.pricing.actions.addNewRule') }}
      </UButton>
    </div>

    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      :title="t('hotel.pricing.rules.loadErrorTitle')"
      :description="error"
    />

    <div v-if="loading" class="rounded-xl border border-default p-6 text-sm text-(--ui-text-muted)">
      {{ t('hotel.pricing.rules.loading') }}
    </div>

    <PricingRuleList
      v-else
      :items="items"
      :property-id="propertyId"
    />
  </div>
</template>
