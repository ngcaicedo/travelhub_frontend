import { describe, expect, it } from 'vitest'
import { formatSeasonalPricingCurrency } from '~/utils/seasonalPricingFormatters'

describe('seasonalPricingFormatters', () => {
  it('formats amount with valid currency', () => {
    const result = formatSeasonalPricingCurrency(125000, 'COP')

    expect(result).toContain('125')
  })

  it('falls back when currency is missing', () => {
    expect(() => formatSeasonalPricingCurrency(120, '')).not.toThrow()
  })

  it('falls back when currency is malformed', () => {
    expect(() => formatSeasonalPricingCurrency(120, '??')).not.toThrow()
  })
})
