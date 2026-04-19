export interface PaymentConfirmationSummary {
  payment_id: string
  reservation_id: string
  traveler_id: string
  status: string
  amount_in_cents: number
  currency: string
  receipt_id: string | null
  receipt_number: string | null
  property_name: string | null
  property_address: string | null
  check_in_date: string | null
  check_out_date: string | null
  guests_count: number | null
  nights: number | null
  nightly_rate_in_cents: number | null
  taxes_in_cents: number | null
  total_in_cents: number | null
  cancellation_policy: string | null
}

export interface ReservationHistoryEntry {
  paymentId: string
  reservationId: string
  travelerId: string
  status: string
  amountInCents: number
  currency: string
  receiptId: string | null
  receiptNumber: string | null
  propertyName: string | null
  propertyAddress: string | null
  checkInDate: string | null
  checkOutDate: string | null
  guestsCount: number | null
  nights: number | null
  nightlyRateInCents: number | null
  taxesInCents: number | null
  totalInCents: number | null
  cancellationPolicy: string | null
}
