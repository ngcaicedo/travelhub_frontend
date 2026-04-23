export interface ValidationResult {
  valid: boolean
  error: string | null
}

export const validateReservationDates = (checkIn: Date, checkOut: Date): ValidationResult => {
  if (checkOut <= checkIn) {
    return {
      valid: false,
      error: 'checkout_after_checkin'
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (checkIn < today) {
    return {
      valid: false,
      error: 'no_past_dates'
    }
  }

  return { valid: true, error: null }
}

export const calculateStayDuration = (checkIn: Date, checkOut: Date): number => {
  return Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  )
}

export interface PriceBreakdown {
  subtotal: number
  taxes: number
  cleaningFee: number
  total: number
}

export const calculateTotalPrice = (
  pricePerNight: number,
  nights: number,
  taxRate: number = 0,
  cleaningFee: number = 0
): PriceBreakdown => {
  const subtotal = pricePerNight * nights
  const taxes = subtotal * taxRate
  const total = subtotal + taxes + cleaningFee
  return { subtotal, taxes, cleaningFee, total }
}

export const formatCurrency = (
  amount: number,
  currency: string = 'COP',
  locale: string = 'es-CO'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
