<script setup lang="ts">
import type { Review } from '~/shared/types/api'

interface Props {
  reviews: readonly Review[]
  rating: number
  reviewCount: number
}

const props = defineProps<Props>()

const { t } = useI18n()
const visibleReviews = ref(2)

const displayedReviews = computed(() => props.reviews.slice(0, visibleReviews.value))
const hasMore = computed(() => props.reviews.length > visibleReviews.value)

const loadMore = () => {
  visibleReviews.value += 2
}

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }).map((_, i) => i < rating)
}
</script>

<template>
  <section class="space-y-6">
    <!-- Rating Summary -->
    <div class="bg-gray-50 rounded-lg p-6">
      <div class="flex items-center gap-4">
        <div class="text-center">
          <div class="text-5xl font-bold text-gray-900">{{ props.rating.toFixed(2) }}</div>
          <div class="flex gap-1 mt-2 justify-center">
            <UIcon
              v-for="i in 5"
              :key="i"
              name="i-lucide-star"
              class="w-4 h-4 fill-yellow-400 text-yellow-400"
            />
          </div>
          <p class="text-sm text-gray-600 mt-2">{{ props.reviewCount }} {{ t('common.reviews') }}</p>
        </div>
      </div>
    </div>

    <!-- Reviews List -->
    <div class="space-y-4">
      <div
        v-for="review in displayedReviews"
        :key="review.id"
        class="border border-gray-200 rounded-lg p-6"
      >
        <!-- Review Header -->
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="font-semibold text-gray-900">{{ review.author }}</p>
            <div class="flex items-center gap-2 mt-1">
              <div class="flex gap-0.5">
                <UIcon
                  v-for="i in 5"
                  :key="i"
                  name="i-lucide-star"
                  :class="
                    i < review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  "
                  class="w-4 h-4"
                />
              </div>
              <span class="text-sm text-gray-600">{{ review.date }}</span>
            </div>
          </div>
          <UBadge
            v-if="review.verified_stay"
            color="success"
            variant="subtle"
          >
            {{ t('property.verifiedStay') }}
          </UBadge>
        </div>

        <!-- Review Comment -->
        <p class="text-gray-700 leading-relaxed">
          {{ review.comment }}
        </p>
      </div>
    </div>

    <!-- Load More Button -->
    <UButton
      v-if="hasMore"
      @click="loadMore"
      variant="soft"
      color="primary"
      block
    >
      {{ t('common.loadMore') }}
    </UButton>
  </section>
</template>
