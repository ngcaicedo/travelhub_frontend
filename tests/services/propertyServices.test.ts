import { describe, it, expect } from 'vitest'
import { getAllProperties, getPropertyDetails } from '~/services/propertyServices'

describe('propertyServices', () => {
  it('getAllProperties is a function that exists', () => {
    expect(typeof getAllProperties).toBe('function')
  })

  it('getPropertyDetails is a function that exists', () => {
    expect(typeof getPropertyDetails).toBe('function')
  })

  it('getPropertyDetails rejects when propertyId is undefined', async () => {
    try {
      await getPropertyDetails(undefined as unknown as string)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain('Property ID is required')
    }
  })
})
