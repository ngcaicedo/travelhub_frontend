import { useI18n } from '#imports'
import type { Property } from '~/types/api'
import { getAllProperties } from '~/services/propertyServices'
import { handleApiError } from '~/utils/api'

export const useProperties = () => {
  const { t } = useI18n()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const properties = ref<Property[]>([])

  const fetchProperties = async () => {
    loading.value = true
    error.value = null

    try {
      properties.value = await getAllProperties()
    } catch (err: unknown) {
      const apiError = handleApiError(err)
      error.value = t(apiError.message)
      console.error('Properties fetch error:', apiError)
    } finally {
      loading.value = false
    }
  }

  // Cargar propiedades automáticamente
  onMounted(() => {
    fetchProperties()
  })

  return {
    properties: readonly(properties),
    loading: readonly(loading),
    error: readonly(error),
    fetchProperties
  }
}
