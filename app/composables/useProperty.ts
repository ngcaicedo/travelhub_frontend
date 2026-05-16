import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from '#imports'
import type { Property, Review } from '~/types/api'
import { getPropertyDetails } from '~/services/propertyServices'
import { handleApiError } from '~/utils/api'

export const useProperty = (
  propertyId?: MaybeRefOrGetter<string | undefined>,
  range?: {
    checkIn?: MaybeRefOrGetter<string | null | undefined>,
    checkOut?: MaybeRefOrGetter<string | null | undefined>,
  },
) => {
  const { t } = useI18n()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const property = ref<Property | null>(null)
  const reviews = ref<Review[]>([])

  const fetchProperty = async () => {
    loading.value = true
    error.value = null

    try {
      const checkIn = range?.checkIn ? toValue(range.checkIn) ?? null : null
      const checkOut = range?.checkOut ? toValue(range.checkOut) ?? null : null
      const { property: fetchedProperty, reviews: fetchedReviews } = await getPropertyDetails(
        toValue(propertyId),
        { checkIn, checkOut },
      )
      property.value = fetchedProperty
      reviews.value = fetchedProperty.reviews || fetchedReviews || []
    } catch (err: unknown) {
      const apiError = handleApiError(err)
      error.value = t(apiError.message)
      console.error('Property fetch error:', apiError)
    } finally {
      loading.value = false
    }
  }

  watch(
    [
      () => toValue(propertyId),
      () => range?.checkIn ? toValue(range.checkIn) : null,
      () => range?.checkOut ? toValue(range.checkOut) : null,
    ],
    ([newId]) => {
      if (newId) {
        fetchProperty()
      }
    },
    { immediate: true }
  )

  return {
    property: readonly(property),
    reviews: readonly(reviews),
    loading: readonly(loading),
    error: readonly(error),
    fetchProperty
  }
}
