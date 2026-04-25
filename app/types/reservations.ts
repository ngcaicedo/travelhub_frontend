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
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed'
  total_price: string
  currency: string
  check_in_date: string
  check_out_date: string
  hold_expires_at: string
  created_at: string
}

export type ReservationCancellationReason =
  | 'maintenance'
  | 'overbooking'
  | 'hotel_policy'
  | 'other'

export interface HotelReservationListItem {
  id: string
  id_traveler: string
  id_property: string
  id_room: string
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  total_price: string
  currency: string
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed'
  hold_expires_at: string
  created_at: string
  updated_at: string
}

export interface HotelReservationActionResponse {
  reservation: ReservationResponse
  status_before: string
  status_after: string
  action_applied: string
  reason: string
  refund_requested: boolean
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
