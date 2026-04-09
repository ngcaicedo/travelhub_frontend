<script setup lang="ts">
import type { Property, PropertyImage, Review } from '~/types/api'

interface Props {
  property: Omit<Property, 'amenities' | 'images' | 'reviews'> & {
    amenities: readonly string[] | string[]
    images: readonly PropertyImage[] | PropertyImage[]
    reviews?: readonly Review[] | Review[]
  }
}

const props = defineProps<Props>()
const router = useRouter()
const { t } = useI18n()

const handleClick = () => {
  router.push(`/properties/${props.property.id}`)
}

const mainImage = computed(() => props.property.images[0])
const rating = computed(() => props.property.rating.toFixed(2))
const formattedPrice = computed(() => {
  return props.property.price_per_night.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
})
</script>

<template>
  <div
    class="group cursor-pointer rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
    @click="handleClick"
  >
    <!-- Image Container -->
    <div class="relative h-80 overflow-hidden bg-gray-100">
      <img
        v-if="mainImage"
        :src="mainImage.url"
        :alt="mainImage.alt_text || props.property.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      >
      
      <!-- Rating Badge -->
      <div class="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg">
        <div class="flex items-center gap-1">
          <UIcon
            name="i-lucide-star"
            class="w-4 h-4 fill-yellow-400 text-yellow-400"
          />
          <span class="text-sm font-semibold text-gray-900">{{ rating }}</span>
        </div>
      </div>
    </div>

    <!-- Content Container -->
    <div class="p-4 space-y-3">
      <!-- Title -->
      <h3 class="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
        {{ property.name }}
      </h3>

      <!-- Location -->
      <div class="flex items-center gap-2 text-gray-600">
        <UIcon
          name="i-lucide-map-pin"
          class="w-4 h-4 flex-shrink-0"
        />
        <p class="text-sm line-clamp-1">
          {{ property.location }}
        </p>
      </div>

      <!-- Price and Book Button -->
      <div class="border-t border-gray-200 pt-3 flex items-center justify-between gap-3">
        <p class="text-2xl font-bold text-gray-900">
          {{ formattedPrice }}/{{ t('common.night') }}
        </p>
        <UButton
          size="sm"
          color="primary"
          @click.stop="handleClick"
        >
          {{ t('property.bookNow') }}
        </UButton>
      </div>
    </div>
  </div>
</template>
