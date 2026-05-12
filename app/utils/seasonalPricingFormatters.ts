import type { SeasonalPricingResponse } from '~/types/seasonalPricing'

export function formatSeasonalPricingCurrency(
  amount: number,
  currency: string,
  locale = 'es-CO',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
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

  return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`
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
