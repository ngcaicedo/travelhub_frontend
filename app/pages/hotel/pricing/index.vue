<script setup lang="ts">
import type { Property } from '~/types/api'
import { getAllProperties } from '~/services/propertyServices'

definePageMeta({
  layout: 'hotel',
  middleware: 'hotel-only',
})

const { t } = useI18n()

const loading = ref(false)
const error = ref<string | null>(null)
const properties = ref<Property[]>([])

async function loadProperties() {
  loading.value = true
  error.value = null
  try {
    properties.value = await getAllProperties()
  } catch (e: unknown) {
    const apiError = e as { message?: string }
    error.value = apiError.message ?? 'errors.unknown'
  } finally {
    loading.value = false
  }
}

onMounted(loadProperties)
</script>

<template>
  <div class="p-8 space-y-6">
    <div class="space-y-2">
      <h1 class="text-3xl font-black tracking-tight text-(--ui-text-highlighted)">
        {{ t('hotel.pricing.dashboard.title') }}
      </h1>
      <p class="text-sm text-(--ui-text-muted)">
        {{ t('hotel.pricing.dashboard.subtitle') }}
      </p>
    </div>

    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      :title="t('hotel.pricing.dashboard.loadPropertiesErrorTitle')"
      :description="error"
    />

    <div v-if="loading" class="rounded-xl border border-default p-6 text-sm text-(--ui-text-muted)">
      {{ t('hotel.pricing.dashboard.loadingProperties') }}
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <UCard
        v-for="property in properties"
        :key="property.id"
      >
        <div class="space-y-2">
          <p class="text-base font-semibold text-(--ui-text-highlighted)">
            {{ property.name }}
          </p>
          <p class="text-sm text-(--ui-text-muted)">
            {{ property.location }}
          </p>
        </div>

        <template #footer>
          <UButton color="primary" variant="soft" :to="`/hotel/pricing/${property.id}`">
            {{ t('hotel.pricing.actions.managePricing') }}
          </UButton>
        </template>
      </UCard>
    </div>
  </div>
</template>
