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

export const getPropertyDetails = async (propertyId?: string): Promise<PropertyDetails> => {
  if (!propertyId) {
    throw new Error('Property ID is required')
  }

  const config = useRuntimeConfig()
  const baseUrl = config.public.propertiesApiUrl

  try {
    const propertyData = await $fetch<Property>(`${baseUrl}/api/v1/properties/${propertyId}`)
    
    return {
      property: propertyData,
      reviews: propertyData.reviews || []
    }
  } catch (error) {
    console.error(`Error fetching property ${propertyId}:`, error)
    throw error
  }
}
