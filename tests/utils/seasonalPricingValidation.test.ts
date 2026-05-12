import { describe, expect, it } from 'vitest'
import { validateSeasonalPricingPayload } from '~/utils/seasonalPricingValidation'

describe('seasonalPricingValidation', () => {
  const validPayload = {
    season_start: '2026-12-01',
    season_end: '2027-01-15',
    price_per_night: 120,
    currency: 'USD',
    tax_rate: 0.19,
    cleaning_fee: 18,
  }

  it('accepts a valid payload', () => {
    const result = validateSeasonalPricingPayload(validPayload)
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('rejects inverted date ranges', () => {
    const result = validateSeasonalPricingPayload({
      ...validPayload,
      season_start: '2027-01-15',
      season_end: '2026-12-01',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.season_end).toBe('errors.validation.invalidDateRange')
  })

  it('rejects negative amounts', () => {
    const result = validateSeasonalPricingPayload({
      ...validPayload,
      price_per_night: -1,
      cleaning_fee: -3,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.price_per_night).toBe('errors.validation.negativeAmount')
    expect(result.errors.cleaning_fee).toBe('errors.validation.negativeAmount')
  })

  it('rejects invalid currency and tax rate', () => {
    const result = validateSeasonalPricingPayload({
      ...validPayload,
      currency: 'US',
      tax_rate: 2,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.currency).toBe('errors.validation.invalidCurrency')
    expect(result.errors.tax_rate).toBe('errors.validation.invalidTaxRate')
  })
})
