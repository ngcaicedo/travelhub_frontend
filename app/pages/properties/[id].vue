<script setup lang="ts">
import { useProperty } from '~/composables/useProperty'
import PropertyGallery from '~/components/properties/PropertyGallery.vue'
import PropertyInfo from '~/components/properties/PropertyInfo.vue'
import PropertyDescription from '~/components/properties/PropertyDescription.vue'
import AmenitiesList from '~/components/properties/AmenitiesList.vue'
import ReviewsList from '~/components/properties/ReviewsList.vue'
import LocationMap from '~/components/properties/LocationMap.vue'
import PropertyPolicies from '~/components/properties/PropertyPolicies.vue'
import ReservationWidget from '~/components/reservations/ReservationWidget.vue'

const { t } = useI18n()
const route = useRoute()

// Simulamos que recibimos el ID de la propiedad desde la ruta
const propertyId = computed(() => route.params.id as string | undefined)

const { property, reviews, loading } = useProperty(propertyId)

// Refs para scroll
const overviewRef = ref<HTMLElement | null>(null)
const amenitiesRef = ref<HTMLElement | null>(null)
const reviewsRef = ref<HTMLElement | null>(null)
const locationRef = ref<HTMLElement | null>(null)
const policiesRef = ref<HTMLElement | null>(null)
const activeSection = ref('overview')

// Navegación entre secciones
const navigateToSection = (sectionId: string) => {
  activeSection.value = sectionId
  const refs: Record<string, Ref<HTMLElement | null>> = {
    overview: overviewRef,
    amenities: amenitiesRef,
    reviews: reviewsRef,
    location: locationRef,
    policies: policiesRef
  }

  const element = refs[sectionId]?.value
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const sections = [
  { id: 'overview', label: 'Descripción', icon: 'i-lucide-info' },
  { id: 'amenities', label: 'Amenidades', icon: 'i-lucide-sparkles' },
  { id: 'reviews', label: 'Reseñas', icon: 'i-lucide-star' },
  { id: 'location', label: 'Ubicación', icon: 'i-lucide-map-pin' },
  { id: 'policies', label: 'Políticas', icon: 'i-lucide-shield' }
]

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
      class="space-y-0"
    >
      <!-- Gallery Section -->
      <section class="relative -mx-safe top-0 left-0 right-0">
        <PropertyGallery :images="property.images" />
      </section>

      <!-- Main Content Container -->
      <div class="max-w-7xl mx-auto px-safe py-12">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Property Info -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Property Header Info -->
            <PropertyInfo 
              :property="property"
              :sections="sections"
              :active-section="activeSection"
              @navigate="navigateToSection"
            />

            <!-- Overview Section -->
            <div ref="overviewRef">
              <PropertyDescription :description="property.description" />
            </div>

            <!-- Amenities Section -->
            <div ref="amenitiesRef">
              <AmenitiesList :amenities="property.amenities" />
            </div>

            <!-- Reviews Section -->
            <div ref="reviewsRef">
              <ReviewsList
                :reviews="reviews"
                :rating="property.rating"
                :review-count="property.review_count"
              />
            </div>

            <!-- Location Map Section -->
            <div ref="locationRef">
              <LocationMap
                :latitude="property.latitude || 0"
                :longitude="property.longitude || 0"
                :location="property.location"
              />
            </div>

            <!-- Policies Section -->
            <div ref="policiesRef">
              <PropertyPolicies cancellation-policy="flexible" />
            </div>
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

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
