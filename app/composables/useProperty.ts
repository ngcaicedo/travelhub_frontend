import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from '#imports'
import type { Property, Review } from '~/types/api'
import { getPropertyDetails } from '~/services/propertyServices'
import { handleApiError } from '~/utils/api'

export const useProperty = (propertyId?: MaybeRefOrGetter<string | undefined>) => {
  const { t } = useI18n()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const property = ref<Property | null>(null)
  const reviews = ref<Review[]>([])

  const fetchProperty = async () => {
    loading.value = true
    error.value = null

    try {
      const details = await getPropertyDetails(toValue(propertyId))
      property.value = details.property
      reviews.value = details.reviews
    } catch (err: unknown) {
      const apiError = handleApiError(err)
      error.value = t(apiError.message)
      console.error('Property fetch error:', apiError)
    } finally {
      loading.value = false
    }
  }

  // Cargar automáticamente si se proporciona propertyId
  watch(
    () => toValue(propertyId),
    (newId) => {
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
