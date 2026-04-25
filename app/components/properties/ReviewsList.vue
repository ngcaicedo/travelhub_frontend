<script setup lang="ts">
import type { Review } from '~/types/api'

interface Props {
  reviews: readonly Review[]
  rating: number
  reviewCount: number
}

const props = defineProps<Props>()

const { t, locale } = useI18n()
const visibleReviews = ref(2)

const displayedReviews = computed(() => props.reviews.slice(0, visibleReviews.value))
const hasMore = computed(() => props.reviews.length > visibleReviews.value)

const loadMore = () => {
  visibleReviews.value += 2
}

const formatReviewDate = (isoDate: string): string => {
  const [yearStr, monthStr, dayStr] = isoDate.split('-')
  if (!yearStr || !monthStr || !dayStr) return isoDate
  const date = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))
  return new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'long' }).format(date)
}
</script>

<template>
  <section class="space-y-6">
    <!-- Rating Summary + Sort -->
    <div class="flex items-center justify-between border-t border-gray-200 pt-6">
      <div class="flex items-center gap-4">
        <div class="text-5xl font-extrabold text-gray-900">
          {{ props.rating.toFixed(2) }}
        </div>
        <div>
          <div class="flex gap-0.5">
            <UIcon
              v-for="i in 5"
              :key="i"
              name="i-lucide-star"
              class="w-4 h-4 fill-yellow-400 text-yellow-400"
            />
          </div>
          <p class="text-sm font-semibold text-gray-900 mt-1">
            {{ props.reviewCount }} {{ t('common.reviews') }}
          </p>
        </div>
      </div>
      <span class="text-sm text-slate-500">
        {{ t('property.sortBy') }}:
        <span class="text-travelhub-500 font-medium">{{ t('property.mostRecent') }}</span>
      </span>
    </div>

    <!-- Reviews Grid (2 columns) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="review in displayedReviews"
        :key="review.id"
        class="border border-gray-200 rounded-lg p-6"
      >
        <!-- Review Header -->
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="font-semibold text-gray-900">
              {{ review.author }}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <div class="flex gap-0.5">
                <UIcon
                  v-for="i in 5"
                  :key="i"
                  name="i-lucide-star"
                  :class="
                    i <= review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  "
                  class="w-4 h-4"
                />
              </div>
              <span class="text-sm text-gray-600">{{ formatReviewDate(review.review_date) }}</span>
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
      variant="soft"
      color="primary"
      block
      @click="loadMore"
    >
      {{ t('common.loadMore') }}
    </UButton>
  </section>
</template>
