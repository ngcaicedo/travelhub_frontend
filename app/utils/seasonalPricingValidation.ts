import type {
  SeasonalPricingValidationErrors,
  SeasonalPricingWritePayload,
} from '~/types/seasonalPricing'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value: string): boolean {
  return ISO_DATE_REGEX.test(value)
}

export function validateSeasonalPricingPayload(
  payload: SeasonalPricingWritePayload,
): { isValid: boolean, errors: SeasonalPricingValidationErrors } {
  const errors: SeasonalPricingValidationErrors = {}

  if (!isIsoDate(payload.season_start)) {
    errors.season_start = 'errors.validation.invalidDate'
  }

  if (!isIsoDate(payload.season_end)) {
    errors.season_end = 'errors.validation.invalidDate'
  }

  if (isIsoDate(payload.season_start) && isIsoDate(payload.season_end) && payload.season_start >= payload.season_end) {
    errors.season_end = 'errors.validation.invalidDateRange'
  }

  if (payload.price_per_night < 0) {
    errors.price_per_night = 'errors.validation.negativeAmount'
  }

  if (payload.currency.length !== 3) {
    errors.currency = 'errors.validation.invalidCurrency'
  }

  if (payload.tax_rate < 0 || payload.tax_rate > 1) {
    errors.tax_rate = 'errors.validation.invalidTaxRate'
  }

  if (payload.cleaning_fee < 0) {
    errors.cleaning_fee = 'errors.validation.negativeAmount'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
