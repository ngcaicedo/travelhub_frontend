import type { Property } from '~/types/api'

export interface ReservationRequest {
  id_traveler: string
  id_property: string
  id_room?: string
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  currency: string
}

export interface ReservationResponse {
  id: string
  status: 'pending_payment' | 'confirmed' | 'cancelled'
  total_price: string
  currency: string
  check_in_date: string
  check_out_date: string
  hold_expires_at: string
  created_at: string
}

// Re-export for convenience
export type { Property }

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
