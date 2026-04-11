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
  check_in_date: string | null
  check_out_date: string | null
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
  checkInDate: string | null
  checkOutDate: string | null
}
