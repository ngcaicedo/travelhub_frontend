import type {
  SearchRequest,
  SearchResponse
} from '~/types/search'
import { getApiBaseUrls } from '~/utils/api'

const appendSearchParams = (
  params: URLSearchParams,
  key: string,
  value: string | number | undefined | null
) => {
  if (value === undefined || value === null || value === '') {
    return
  }

  params.append(key, String(value))
}

const appendArrayParams = (params: URLSearchParams, key: string, values?: string[]) => {
  if (!values?.length) {
    return
  }

  values.forEach(value => params.append(key, value))
}

export const searchService = {
  searchProperties(params: SearchRequest) {
    const { searchBaseUrl } = getApiBaseUrls()
    const query = new URLSearchParams()

    appendSearchParams(query, 'ciudad', params.ciudad)
    appendSearchParams(query, 'check_in', params.check_in)
    appendSearchParams(query, 'check_out', params.check_out)
    appendSearchParams(query, 'huespedes', params.huespedes)
    appendArrayParams(query, 'amenidades', params.amenidades)
    appendSearchParams(query, 'precio_min', params.precio_min)
    appendSearchParams(query, 'precio_max', params.precio_max)
    appendSearchParams(query, 'order_by', params.order_by)
    appendSearchParams(query, 'order_dir', params.order_dir)
    appendSearchParams(query, 'page', params.page)
    appendSearchParams(query, 'page_size', params.page_size)

    return $fetch<SearchResponse>(`/api/v1/search?${query.toString()}`, {
      baseURL: searchBaseUrl,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}