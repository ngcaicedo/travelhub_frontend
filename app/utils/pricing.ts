/**
 * Cálculo canónico del desglose de precio (espejo del backend).
 *
 * Fórmula:
 *   accommodation = price_per_night × nights × guests
 *   cleaning      = property.cleaning_fee
 *   service_fee   = round(accommodation × SERVICE_FEE_RATE)
 *   subtotal      = accommodation + cleaning + service_fee
 *   taxes         = round(subtotal × property.tax_rate)
 *   total         = subtotal + taxes
 *
 * Mantener sincronizado con
 * services/reservations/src/domain/use_cases/create_reservation.py
 */

export const SERVICE_FEE_RATE = 0.08

export interface CanonicalBreakdown {
  accommodationInCents: number
  cleaningFeeInCents: number
  serviceFeeInCents: number
  taxesInCents: number
  totalInCents: number
  nights: number
  nightlyRateInCents: number
}

interface ComputeArgs {
  pricePerNight: number
  cleaningFee?: number
  taxRate?: number
  nights: number
  guests: number
  serviceFeeRate?: number
}

export function computeCanonicalBreakdown({
  pricePerNight,
  cleaningFee = 0,
  taxRate = 0,
  nights,
  guests,
  serviceFeeRate = SERVICE_FEE_RATE
}: ComputeArgs): CanonicalBreakdown {
  const safeNights = Math.max(1, Math.floor(nights))
  const safeGuests = Math.max(1, Math.floor(guests))

  const accommodationInCents = Math.round(pricePerNight * safeNights * safeGuests * 100)
  const cleaningFeeInCents = Math.round(cleaningFee * 100)
  const serviceFeeInCents = Math.round(accommodationInCents * serviceFeeRate)
  const subtotalInCents = accommodationInCents + cleaningFeeInCents + serviceFeeInCents
  const taxesInCents = Math.round(subtotalInCents * taxRate)
  const totalInCents = subtotalInCents + taxesInCents
  const nightlyRateInCents = safeNights > 0 ? Math.round(accommodationInCents / safeNights) : accommodationInCents

  return {
    accommodationInCents,
    cleaningFeeInCents,
    serviceFeeInCents,
    taxesInCents,
    totalInCents,
    nights: safeNights,
    nightlyRateInCents
  }
}
