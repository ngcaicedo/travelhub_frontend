import type {
  SeasonalPricingResponse,
  SeasonalPricingUpdatePayload,
  SeasonalPricingWritePayload,
} from '~/types/seasonalPricing'
import { handleApiError } from '~/utils/api'

type SeasonalPricingListResponse = {
  items: SeasonalPricingResponse[]
  total?: number
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function getPropertiesApiUrl(): string {
  return useRuntimeConfig().public.propertiesApiUrl
}

function normalizeSeasonalPricingList(
  payload: SeasonalPricingResponse[] | SeasonalPricingListResponse,
): SeasonalPricingResponse[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload && Array.isArray(payload.items)) {
    return payload.items
  }

  return []
}

export async function listSeasonalPricing(
  propertyId: string,
  adminToken: string | null = null,
): Promise<SeasonalPricingResponse[]> {
  try {
    const response = await $fetch<SeasonalPricingResponse[] | SeasonalPricingListResponse>(
      `/api/v1/properties/${propertyId}/seasonal-pricing`,
      {
        baseURL: getPropertiesApiUrl(),
        method: 'GET',
        headers: {
          ...authHeaders(adminToken),
        },
      },
    )

    return normalizeSeasonalPricingList(response)
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function getSeasonalPricing(
  propertyId: string,
  seasonalPriceId: string,
  adminToken: string | null = null,
): Promise<SeasonalPricingResponse> {
  try {
    return await $fetch<SeasonalPricingResponse>(
      `/api/v1/properties/${propertyId}/seasonal-pricing/${seasonalPriceId}`,
      {
        baseURL: getPropertiesApiUrl(),
        method: 'GET',
        headers: {
          ...authHeaders(adminToken),
        },
      },
    )
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function createSeasonalPricing(
  propertyId: string,
  payload: SeasonalPricingWritePayload,
  adminToken: string | null,
): Promise<SeasonalPricingResponse> {
  try {
    return await $fetch<SeasonalPricingResponse>(`/api/v1/properties/${propertyId}/seasonal-pricing`, {
      baseURL: getPropertiesApiUrl(),
      method: 'POST',
      body: payload,
      headers: {
        ...authHeaders(adminToken),
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function updateSeasonalPricing(
  propertyId: string,
  seasonalPriceId: string,
  payload: SeasonalPricingUpdatePayload,
  adminToken: string | null,
): Promise<SeasonalPricingResponse> {
  try {
    return await $fetch<SeasonalPricingResponse>(
      `/api/v1/properties/${propertyId}/seasonal-pricing/${seasonalPriceId}`,
      {
        baseURL: getPropertiesApiUrl(),
        method: 'PATCH',
        body: payload,
        headers: {
          ...authHeaders(adminToken),
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    throw handleApiError(error)
  }
}
