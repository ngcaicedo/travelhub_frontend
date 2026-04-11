import { useI18n } from '#imports'
import type { SearchRequest, SearchResponse } from '~/types/search'
import { searchService } from '~/services/search'
import { handleApiError } from '~/utils/api'

export const useSearch = () => {
  const { t } = useI18n()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const results = ref<SearchResponse | null>(null)

  const searchProperties = async (params: SearchRequest): Promise<SearchResponse> => {
    loading.value = true
    error.value = null

    try {
      const response = await searchService.searchProperties(params)
      results.value = response
      return response
    } catch (err: unknown) {
      const apiError = handleApiError(err)
      error.value = t(apiError.message)
      console.error('Search properties error:', apiError)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    results: readonly(results),
    loading: readonly(loading),
    error: readonly(error),
    searchProperties
  }
}