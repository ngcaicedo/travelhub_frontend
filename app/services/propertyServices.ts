import type { Property, Review } from '~/types/api'

type PropertyDetails = {
  property: Property
  reviews: Review[]
}

export const getAllProperties = async (): Promise<Property[]> => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.propertiesApiUrl

  try {
    const response = await $fetch<Property[]>(`${baseUrl}/api/v1/properties`)
    return response
  } catch (error) {
    console.error('Error fetching properties:', error)
    throw error
  }
}

/**
 * Hotel partner-scoped variant of getAllProperties: only returns properties
 * owned by `ownerId`. Backed by `GET /api/v1/properties?owner_id=...`.
 *
 * The unscoped getAllProperties() returns *every* property in the system —
 * fine for the traveler-facing search, dangerous for the partner workflows
 * (a partner would otherwise see properties they cannot modify and the
 * backend would reject the write with 403).
 */
export const getPropertiesByOwner = async (ownerId: string): Promise<Property[]> => {
  if (!ownerId) {
    throw new Error('ownerId is required')
  }
  const config = useRuntimeConfig()
  const baseUrl = config.public.propertiesApiUrl

  try {
    return await $fetch<Property[]>(`${baseUrl}/api/v1/properties`, {
      query: { owner_id: ownerId },
    })
  } catch (error) {
    console.error(`Error fetching properties for owner ${ownerId}:`, error)
    throw error
  }
}

export const getPropertyDetails = async (
  propertyId?: string,
  range?: { checkIn?: string | null, checkOut?: string | null },
): Promise<PropertyDetails> => {
  if (!propertyId) {
    throw new Error('Property ID is required')
  }

  const config = useRuntimeConfig()
  const baseUrl = config.public.propertiesApiUrl


  const query: Record<string, string> = {}
  if (range?.checkIn && range?.checkOut) {
    query.check_in = range.checkIn
    query.check_out = range.checkOut
  }

  try {
    const propertyData = await $fetch<Property>(
      `${baseUrl}/api/v1/properties/${propertyId}`,
      Object.keys(query).length ? { query } : undefined,
    )

    return {
      property: propertyData,
      reviews: propertyData.reviews || []
    }
  } catch (error) {
    console.error(`Error fetching property ${propertyId}:`, error)
    throw error
  }
}
