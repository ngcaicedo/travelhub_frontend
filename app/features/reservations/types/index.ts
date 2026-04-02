import type { Property, ReservationRequest, ReservationResponse } from '~/shared/types/api'

// Re-export for convenience
export type { Property, ReservationRequest, ReservationResponse }

// Reservation form state
export interface ReservationFormState {
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
}

// Reservation confirmation data
export interface ReservationConfirmation {
  reservation: ReservationResponse
  property: Property
  stayDuration: number
  totalPrice: number
}
