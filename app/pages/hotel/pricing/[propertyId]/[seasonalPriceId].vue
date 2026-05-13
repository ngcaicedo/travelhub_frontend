<script setup lang="ts">
definePageMeta({
  layout: 'hotel',
  middleware: 'hotel-only',
})

import PricingRuleForm from '~/components/hotel/pricing/PricingRuleForm.vue'
import PricingRulePreview from '~/components/hotel/pricing/PricingRulePreview.vue'
import PricingRuleIntegrityBadge from '~/components/hotel/pricing/PricingRuleIntegrityBadge.vue'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const propertyId = computed(() => String(route.params.propertyId || ''))
const seasonalPriceId = computed(() => String(route.params.seasonalPriceId || ''))

const {
  selectedRule,
  formDraft,
  loading,
  saving,
  error,
  canEdit,
  submitUpdate,
} = useSeasonalPricing(propertyId, seasonalPriceId)

function cancel() {
  router.push(`/hotel/pricing/${propertyId.value}`)
}

async function submit() {
  const updated = await submitUpdate(formDraft.value)
  if (updated) {
    router.push(`/hotel/pricing/${propertyId.value}/${updated.id}`)
  }
}
</script>

<template>
  <div class="p-8 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <UBreadcrumb
        :items="[
          { label: t('hotel.pricing.breadcrumb.dashboard'), to: '/hotel/pricing' },
          { label: t('hotel.pricing.breadcrumb.propertyRules'), to: `/hotel/pricing/${propertyId}` },
          { label: t('hotel.pricing.breadcrumb.editRule') },
        ]"
      />

      <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" @click="cancel">
        {{ t('hotel.pricing.actions.backToRules') }}
      </UButton>
    </div>

    <div class="space-y-2">
      <h1 class="text-3xl font-black tracking-tight text-(--ui-text-highlighted)">
        {{ t('hotel.pricing.edit.title') }}
      </h1>
      <p class="text-sm text-(--ui-text-muted)">
        {{ t('hotel.pricing.edit.subtitle') }}
      </p>
    </div>

    <UAlert
      v-if="!canEdit"
      color="warning"
      icon="i-lucide-lock"
      :title="t('hotel.pricing.edit.lockedTitle')"
      :description="t('hotel.pricing.edit.lockedDescription')"
    />

    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      :title="t('hotel.pricing.edit.updateErrorTitle')"
      :description="error"
    />

    <div v-if="loading" class="rounded-xl border border-default p-6 text-sm text-(--ui-text-muted)">
      {{ t('hotel.pricing.edit.loading') }}
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <PricingRuleForm
        v-model="formDraft"
        :loading="saving"
        :can-edit="canEdit"
        :submit-label="t('hotel.pricing.actions.updateRule')"
        @submit="submit"
        @cancel="cancel"
      />

      <div class="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <PricingRulePreview :draft="formDraft" />
        <UCard v-if="selectedRule">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-(--ui-text-muted)">{{ t('hotel.pricing.edit.integrityStatus') }}</span>
            <PricingRuleIntegrityBadge :rule="selectedRule" />
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
