<script setup lang="ts">
import { useProperties } from '~/composables/useProperties'
import PropertyCard from '~/components/properties/PropertyCard.vue'

const { t } = useI18n()
const { properties, loading, error } = useProperties()

useSeoMeta({
  title: () => `${t('property.properties')} - TravelHub`,
  description: () => t('property.discoverAmazingPlaces') || ''
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Content -->
    <div class="max-w-7xl mx-auto px-safe py-12">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">
          {{ t('property.properties') }}
        </h1>
        <UButton
          to="/search"
          icon="i-lucide-search"
          size="lg"
          variant="outline"
          color="primary"
        >
          {{ t('property.advancedSearch') }}
        </UButton>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div
          v-for="i in 4"
          :key="i"
        >
          <USkeleton class="w-full h-96 rounded-xl" />
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex justify-center py-12">
        <UAlert
          icon="i-lucide-alert-circle"
          color="error"
          :title="t('errors.failedToLoadProperties')"
          :description="error"
        />
      </div>

      <!-- Properties Grid -->
      <div
        v-else-if="properties && properties.length > 0"
        class="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <PropertyCard
          v-for="property in properties"
          :key="property.id"
          :property="property"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-12 space-y-4"
      >
        <UIcon
          name="i-lucide-inbox"
          class="w-12 h-12 text-gray-400"
        />
        <p class="text-gray-600">
          {{ t('property.noPropertiesFound') }}
        </p>
      </div>
    </div>
  </div>
</template>
