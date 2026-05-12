import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createSeasonalPricing,
  getSeasonalPricing,
  listSeasonalPricing,
  updateSeasonalPricing,
} from '~/services/seasonalPricingService'

const mockFetch = vi.fn()

vi.stubGlobal('$fetch', mockFetch)

describe('seasonalPricingService', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('lists seasonal pricing records', async () => {
    mockFetch.mockResolvedValue([{ id: 'sp-1' }])

    await listSeasonalPricing('prop-1')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/properties/prop-1/seasonal-pricing',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('gets a seasonal pricing record by id', async () => {
    mockFetch.mockResolvedValue({ id: 'sp-1' })

    await getSeasonalPricing('prop-1', 'sp-1')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/properties/prop-1/seasonal-pricing/sp-1',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('creates seasonal pricing with auth header', async () => {
    mockFetch.mockResolvedValue({ id: 'sp-1' })

    await createSeasonalPricing(
      'prop-1',
      {
        season_start: '2026-12-01',
        season_end: '2027-01-15',
        price_per_night: 120,
        currency: 'USD',
        tax_rate: 0.19,
        cleaning_fee: 18,
      },
      'jwt-token',
    )

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/properties/prop-1/seasonal-pricing',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    )
  })

  it('updates seasonal pricing with auth header', async () => {
    mockFetch.mockResolvedValue({ id: 'sp-1' })

    await updateSeasonalPricing(
      'prop-1',
      'sp-1',
      { price_per_night: 130 },
      'jwt-token',
    )

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/properties/prop-1/seasonal-pricing/sp-1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
      }),
    )
  })
})
