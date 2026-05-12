import type {
  SeasonalPricingResponse,
  SeasonalPricingUpdatePayload,
  SeasonalPricingWritePayload,
} from '~/types/seasonalPricing'
import { handleApiError } from '~/utils/api'

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function getPropertiesApiUrl(): string {
  return useRuntimeConfig().public.propertiesApiUrl
}

export async function listSeasonalPricing(propertyId: string): Promise<SeasonalPricingResponse[]> {
  try {
    return await $fetch<SeasonalPricingResponse[]>(`/api/v1/properties/${propertyId}/seasonal-pricing`, {
      baseURL: getPropertiesApiUrl(),
      method: 'GET',
    })
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function getSeasonalPricing(
  propertyId: string,
  seasonalPriceId: string,
): Promise<SeasonalPricingResponse> {
  try {
    return await $fetch<SeasonalPricingResponse>(
      `/api/v1/properties/${propertyId}/seasonal-pricing/${seasonalPriceId}`,
      {
        baseURL: getPropertiesApiUrl(),
        method: 'GET',
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
