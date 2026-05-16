<script setup lang="ts">
import type { Property } from '~/types/api'
import type { DeepReadonly } from 'vue'
import { encodePropertyRouteId } from '~/utils/propertyRouteId'

interface Props {
  property: Property | DeepReadonly<Property>
}

const props = defineProps<Props>()
const router = useRouter()
const { t, locale } = useI18n()

const handleClick = () => {
  router.push(`/properties/${encodePropertyRouteId(props.property.id)}`)
}

const mainImage = computed(() => props.property.images[0])
const rating = computed(() => props.property.rating.toFixed(2))

const currencyFormatter = computed(() => new Intl.NumberFormat(locale.value, {
  style: 'currency',
  currency: props.property.currency || 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}))
const formattedPrice = computed(() => currencyFormatter.value.format(props.property.price_per_night))
const hasDiscount = computed(() =>
  Boolean(props.property.has_seasonal_discount && props.property.base_price_per_night)
)
const formattedBasePrice = computed(() =>
  hasDiscount.value && props.property.base_price_per_night
    ? currencyFormatter.value.format(props.property.base_price_per_night)
    : null,
)
const discountPercent = computed(() => {
  const base = props.property.base_price_per_night
  if (!hasDiscount.value || !base) return 0
  return Math.round((1 - props.property.price_per_night / base) * 100)
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
      <h2 class="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
        {{ property.name }}
      </h2>

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
        <div class="flex flex-col">
          <span
            v-if="hasDiscount"
            class="inline-flex items-center self-start rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-semibold"
          >
            -{{ discountPercent }}% {{ t('property.seasonalDiscount') }}
          </span>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold text-gray-900">
              {{ formattedPrice }}/{{ t('common.night') }}
            </p>
            <p
              v-if="hasDiscount && formattedBasePrice"
              class="text-sm text-gray-400 line-through"
            >
              {{ formattedBasePrice }}
            </p>
          </div>
        </div>
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
