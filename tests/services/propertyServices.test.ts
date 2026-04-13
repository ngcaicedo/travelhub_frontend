import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAllProperties, getPropertyDetails } from '~/services/propertyServices'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('propertyServices', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('getAllProperties', () => {
    it('returns list of properties on success', async () => {
      const mockProperties = [{ id: '1', name: 'Hotel A' }]
      mockFetch.mockResolvedValue(mockProperties)

      const result = await getAllProperties()
      expect(result).toEqual(mockProperties)
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/properties'))
    })

    it('throws when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(getAllProperties()).rejects.toThrow('Network error')
    })
  })

  describe('getPropertyDetails', () => {
    it('rejects when propertyId is undefined', async () => {
      await expect(getPropertyDetails(undefined as unknown as string)).rejects.toThrow('Property ID is required')
    })

    it('returns property with reviews on success', async () => {
      const mockProperty = { id: 'prop-1', name: 'Hotel B', reviews: [{ id: 'r1', text: 'Great' }] }
      mockFetch.mockResolvedValue(mockProperty)

      const result = await getPropertyDetails('prop-1')
      expect(result.property).toEqual(mockProperty)
      expect(result.reviews).toEqual(mockProperty.reviews)
    })

    it('returns empty reviews when property has none', async () => {
      const mockProperty = { id: 'prop-1', name: 'Hotel C' }
      mockFetch.mockResolvedValue(mockProperty)

      const result = await getPropertyDetails('prop-1')
      expect(result.reviews).toEqual([])
    })

    it('throws when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))
      await expect(getPropertyDetails('prop-1')).rejects.toThrow('Not found')
    })
  })
})
