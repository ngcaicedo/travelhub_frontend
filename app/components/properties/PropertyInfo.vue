<script setup lang="ts">
interface Section {
  id: string
  label: string
  icon: string
}

interface Props {
  property: {
    name: string
    location: string
    rating: number
    review_count: number
    bedrooms: number
    bathrooms: number
    max_guests: number
  }
  sections?: Section[]
  activeSection?: string
}

const props = withDefaults(defineProps<Props>(), {
  sections: () => [],
  activeSection: 'overview'
})

const emit = defineEmits<{
  navigate: [sectionId: string]
}>()

const { t } = useI18n()

const rating = computed(() => props.property.rating.toFixed(2))

const navigateToSection = (sectionId: string) => {
  emit('navigate', sectionId)
}
</script>

<template>
  <div
    v-if="props.property"
    class="space-y-4"
  >
    <!-- Header with title and actions -->
    <div class="flex items-start justify-between">
      <div>
        <h1
          class="text-4xl font-bold text-gray-900"
          data-cy="property-name"
        >
          {{ props.property.name }}
        </h1>
        <p
          class="text-lg text-gray-600 mt-2 flex items-center gap-2"
          data-cy="property-location"
        >
          <UIcon
            name="i-lucide-map-pin"
            class="w-5 h-5"
          />
          {{ props.property.location }}
        </p>
      </div>

      <!-- Share and favorite buttons -->
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-share-2"
          variant="ghost"
          size="lg"
          :aria-label="t('property.shareProperty')"
        />
        <UButton
          icon="i-lucide-heart"
          variant="ghost"
          size="lg"
          :aria-label="t('property.addToFavorites')"
        />
      </div>
    </div>

    <!-- Rating and reviews -->
    <div class="flex items-center gap-4 pt-4 border-t border-gray-200">
      <div class="flex items-center gap-2">
        <div class="flex items-center">
          <UIcon
            name="i-lucide-star"
            class="w-5 h-5 fill-yellow-400 text-yellow-400"
          />
          <span
            class="text-xl font-semibold text-gray-900 ml-1"
            data-cy="property-rating"
          >
            {{ rating }}
          </span>
        </div>
        <div class="text-gray-600">
          <span class="font-medium">{{ props.property.review_count }}</span>
          <span>&nbsp;{{ t('common.reviews') }}</span>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs using UTabs -->
    <!-- Navigation Tabs -->
    <div v-if="props.sections && props.sections.length > 0" class="border-b border-gray-200 pt-4">
      <div class="flex gap-6">
        <UButton
          v-for="section in props.sections"
          :key="section.id"
          :label="section.label"
          :leading-icon="section.icon"
          variant="ghost"
          color="neutral"
          class="rounded-none px-1 border-b-2 transition-colors"
          :class="[
            props.activeSection === section.id
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-700 hover:text-primary hover:border-primary'
          ]"
          @click="navigateToSection(section.id)"
        />
      </div>
    </div>

    <!-- TravelHub Plus Badge -->
    <div class="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
      <UIcon
        name="i-lucide-award"
        class="w-6 h-6 text-travelhub-500 shrink-0"
      />
      <div>
        <p class="text-sm font-semibold text-slate-900">
          {{ t('property.travelHubPlus') }}
        </p>
        <p class="text-xs text-slate-600">
          {{ t('property.travelHubPlusDesc') }}
        </p>
      </div>
    </div>

    <!-- Property features grid -->
    <div
      class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-b border-gray-200 pb-4"
      data-cy="property-features"
      :data-cy-bedrooms="props.property.bedrooms"
      :data-cy-bathrooms="props.property.bathrooms"
      :data-cy-max-guests="props.property.max_guests"
    >
      <!-- Bedrooms -->
      <div class="flex items-center gap-3">
        <div class="bg-gray-100 rounded-lg p-3">
          <UIcon
            name="i-lucide-bed"
            class="w-6 h-6 text-gray-700"
          />
        </div>
        <div>
          <p class="text-xs text-gray-600">
            {{ t('property.bedrooms') }}
          </p>
          <p class="font-semibold text-sm text-gray-900">
            {{ props.property.bedrooms }}
          </p>
        </div>
      </div>

      <!-- Bathrooms -->
      <div class="flex items-center gap-3">
        <div class="bg-gray-100 rounded-lg p-3">
          <UIcon
            name="i-lucide-bath"
            class="w-6 h-6 text-gray-700"
          />
        </div>
        <div>
          <p class="text-xs text-gray-600">
            {{ t('property.bathrooms') }}
          </p>
          <p class="font-semibold text-sm text-gray-900">
            {{ props.property.bathrooms }}
          </p>
        </div>
      </div>

      <!-- Capacity -->
      <div class="flex items-center gap-3">
        <div class="bg-gray-100 rounded-lg p-3">
          <UIcon
            name="i-lucide-users"
            class="w-6 h-6 text-gray-700"
          />
        </div>
        <div>
          <p class="text-xs text-gray-600">
            {{ t('property.capacity') }}
          </p>
          <p class="font-semibold text-sm text-gray-900">
            {{ props.property.max_guests }}
          </p>
        </div>
      </div>

      <!-- Superhost -->
      <div class="flex items-center gap-3">
        <div class="bg-gray-100 rounded-lg p-3">
          <UIcon
            name="i-lucide-badge-check"
            class="w-6 h-6 text-gray-700"
          />
        </div>
        <div>
          <p class="text-xs text-gray-600">
            {{ t('property.host') }}
          </p>
          <p class="font-semibold text-sm text-gray-900">
            Superhost
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
