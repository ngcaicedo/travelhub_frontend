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

const TAX_RATES: Record<string, number> = {
  COP: 0.19,
  USD: 0.08,
  ARS: 0.21,
  CLP: 0.19,
  PEN: 0.18,
  MXN: 0.16
}

export const calculateTotalPrice = (
  pricePerNight: number,
  nights: number,
  currency: string = 'COP',
  numberOfGuests: number = 1
): number => {
  const taxRate = TAX_RATES[currency] ?? 0
  const subtotal = pricePerNight * numberOfGuests * nights
  const tax = subtotal * taxRate
  return subtotal + tax
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
