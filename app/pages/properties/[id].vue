<script setup lang="ts">
import { useProperty } from '~/features/properties/composables/useProperty'
import PropertyGallery from '~/features/properties/components/PropertyGallery.vue'
import PropertyInfo from '~/features/properties/components/PropertyInfo.vue'
import PropertyDescription from '~/features/properties/components/PropertyDescription.vue'
import AmenitiesList from '~/features/properties/components/AmenitiesList.vue'
import ReviewsList from '~/features/properties/components/ReviewsList.vue'
import LocationMap from '~/features/properties/components/LocationMap.vue'
import ReservationWidget from '~/features/properties/components/ReservationWidget.vue'

const { t } = useI18n()
const route = useRoute()

// Simulamos que recibimos el ID de la propiedad desde la ruta
const propertyId = route.params.id as string

const { property, reviews, loading } = useProperty(propertyId)

useSeoMeta({
  title: () => `${property.value?.name || t('property.loading')} - TravelHub`,
  description: () => property.value?.description || ''
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center min-h-screen"
    >
      <USkeleton class="w-full h-96" />
    </div>

    <!-- Property Content -->
    <div
      v-else-if="property"
      class="space-y-12"
    >
      <!-- Gallery Section -->
      <section class="relative -mx-safe top-0 left-0 right-0">
        <PropertyGallery :images="property.images" />
      </section>

      <!-- Main Content Container -->
      <div class="max-w-7xl mx-auto px-safe">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Property Info -->
          <div class="lg:col-span-2 space-y-12">
            <!-- Property Header Info -->
            <PropertyInfo :property="property" />

            <!-- Description -->
            <PropertyDescription :description="property.description" />

            <!-- Amenities -->
            <AmenitiesList :amenities="property.amenities" />

            <!-- Reviews -->
            <ReviewsList
              :reviews="reviews"
              :rating="property.rating"
              :review-count="property.review_count"
            />

            <!-- Location Map -->
            <LocationMap
              :latitude="property.latitude || 0"
              :longitude="property.longitude || 0"
              :location="property.location"
            />
          </div>

          <!-- Right Column: Reservation Widget -->
          <div class="lg:col-span-1">
            <ReservationWidget :property="property" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else
      class="max-w-7xl mx-auto px-safe py-12"
    >
      <UAlert
        icon="i-lucide-alert-circle"
        color="error"
        :title="t('errors.propertyNotFound')"
        :description="t('errors.tryAgainLater')"
      />
    </div>
  </div>
</template>
