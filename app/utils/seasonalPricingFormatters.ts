import type { SeasonalPricingResponse } from '~/types/seasonalPricing'

export function formatSeasonalPricingCurrency(
  amount: number,
  currency: string,
  locale = 'es-CO',
): string {
  const normalizedCurrency = (currency || '').trim().toUpperCase() || 'COP'

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback for malformed currency codes coming from inconsistent API payloads.
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 2,
    }).format(amount)
  }
}

export function formatSeasonalPricingDateRange(
  startDate: string,
  endDate: string,
  locale = 'es-CO',
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })

  function toValidDate(d: string): Date | null {
    try {
      const dt = new Date(d)
      return isNaN(dt.getTime()) ? null : dt
    } catch {
      return null
    }
  }

  const s = toValidDate(startDate)
  const e = toValidDate(endDate)

  if (s && e) {
    return `${formatter.format(s)} - ${formatter.format(e)}`
  }

  if (s && !e) {
    return `${formatter.format(s)} - `
  }

  if (!s && e) {
    return ` - ${formatter.format(e)}`
  }

  return ''
}

export function getSeasonalPricingIntegrityState(
  item: Pick<SeasonalPricingResponse, 'integrity_locked' | 'integrity_valid'>,
): 'normal' | 'locked' | 'compromised' {
  if (!item.integrity_valid) {
    return 'compromised'
  }

  if (item.integrity_locked) {
    return 'locked'
  }

  return 'normal'
}
