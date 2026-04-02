<script setup lang="ts">
interface Props {
  amenities: readonly string[]
  visibleCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  visibleCount: 8
})

const { t } = useI18n()
const showAll = ref(false)

const displayedAmenities = computed(() => {
  if (showAll.value) {
    return props.amenities
  }
  return props.amenities.slice(0, props.visibleCount || 8)
})

const hasMore = computed(() => (props.amenities?.length || 0) > (props.visibleCount || 8))

const getAmenityIcon = (amenity: string): string => {
  const iconMap: Record<string, string> = {
    'Private Infinity Pool': 'i-lucide-waves',
    'High-speed Fiber WiFi': 'i-lucide-wifi',
    'Private Vineyard Access': 'i-lucide-grape',
    'Professional Kitchen': 'i-lucide-utensils',
    'Free Valet Parking': 'i-lucide-car',
    'Climate Control': 'i-lucide-thermometer',
    'Smart Home System': 'i-lucide-home',
    'Wine Cellar': 'i-lucide-wine-2'
  }
  return iconMap[amenity] || 'i-lucide-check'
}
</script>

<template>
  <section class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-900">
      {{ t('property.whatThisOffers') }}
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="amenity in displayedAmenities"
        :key="amenity"
        class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <UIcon
          :name="getAmenityIcon(amenity)"
          class="w-6 h-6 text-primary flex-shrink-0"
        />
        <span class="text-gray-700">{{ amenity }}</span>
      </div>
    </div>

    <UButton
      v-if="hasMore"
      @click="showAll = !showAll"
      variant="soft"
      color="primary"
      :icon="showAll ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
    >
      {{ showAll ? t('common.showLess') : t('common.showAll') }} {{ t('property.amenities') }}
    </UButton>
  </section>
</template>
