<script setup lang="ts">
import PricingRuleForm from '~/components/hotel/pricing/PricingRuleForm.vue'
import PricingRulePreview from '~/components/hotel/pricing/PricingRulePreview.vue'

definePageMeta({
  layout: 'hotel',
})

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const propertyId = computed(() => String(route.params.propertyId || ''))

const {
  formDraft,
  loading,
  saving,
  error,
  submitCreate,
} = useSeasonalPricing(propertyId)

function cancel() {
  router.push(`/hotel/pricing/${propertyId.value}`)
}

async function submit() {
  const created = await submitCreate(formDraft.value)
  if (created) {
    router.push(`/hotel/pricing/${propertyId.value}`)
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
            { label: t('hotel.pricing.breadcrumb.addRule') },
        ]"
      />

      <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" @click="cancel">
        {{ t('hotel.pricing.actions.backToRules') }}
      </UButton>
    </div>

    <div class="space-y-2">
      <h1 class="text-3xl font-black tracking-tight text-(--ui-text-highlighted)">
        {{ t('hotel.pricing.create.title') }}
      </h1>
      <p class="text-sm text-(--ui-text-muted)">
        {{ t('hotel.pricing.create.subtitle') }}
      </p>
    </div>

    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      :title="t('hotel.pricing.create.saveErrorTitle')"
      :description="error"
    />

    <div v-if="loading" class="rounded-xl border border-default p-6 text-sm text-(--ui-text-muted)">
      {{ t('hotel.pricing.create.loading') }}
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <PricingRuleForm
        v-model="formDraft"
        :loading="saving"
        :can-edit="true"
        :submit-label="t('hotel.pricing.actions.createRule')"
        @submit="submit"
        @cancel="cancel"
      />

      <div class="lg:sticky lg:top-6 lg:self-start">
        <PricingRulePreview :draft="formDraft" />
      </div>
    </div>
  </div>
</template>
