import type {
  PropertyAvailabilityRequest,
  PropertyAvailabilityResponse,
  SearchRequest,
  SearchResponse
} from '~/types/search'
import { createSearchClient } from './_client'

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
    const searchClient = createSearchClient()
    const query = new URLSearchParams()

    appendSearchParams(query, 'city', params.city)
    appendSearchParams(query, 'check_in', params.check_in)
    appendSearchParams(query, 'check_out', params.check_out)
    appendSearchParams(query, 'guests', params.guests)
    appendArrayParams(query, 'amenities', params.amenities)
    appendSearchParams(query, 'min_price', params.min_price)
    appendSearchParams(query, 'max_price', params.max_price)
    appendSearchParams(query, 'order_by', params.order_by)
    appendSearchParams(query, 'order_dir', params.order_dir)
    appendSearchParams(query, 'page', params.page)
    appendSearchParams(query, 'page_size', params.page_size)

    return searchClient<SearchResponse>(`/api/v1/search?${query.toString()}`, {
      method: 'GET'
    })
  },

  checkAvailability(params: PropertyAvailabilityRequest) {
    const searchClient = createSearchClient()
    const query = new URLSearchParams()

    appendSearchParams(query, 'check_in', params.check_in)
    appendSearchParams(query, 'check_out', params.check_out)
    appendSearchParams(query, 'guests', params.guests)

    return searchClient<PropertyAvailabilityResponse>(
      `/api/v1/search/properties/${params.property_id}/availability?${query.toString()}`,
      { method: 'GET' }
    )
  }
}
