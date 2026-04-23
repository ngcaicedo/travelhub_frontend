import type { Property } from '~/types/api'

export type ReservationStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'cancelled'
  | 'cancel_requested'
  | 'refund_pending'
  | 'refund_completed'
  | 'refund_failed'
  | 'modification_pending_payment'
  | 'modification_confirmed'
  | 'additional_charge_failed'

export type ReservationIntermediateStatus =
  | 'cancel_requested'
  | 'refund_pending'
  | 'modification_pending_payment'

export type ReservationTerminalStatus = Exclude<ReservationStatus, ReservationIntermediateStatus>

export type ReservationActionApplied = 'modification_confirmed' | 'cancellation_confirmed'

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
  status: ReservationStatus
  total_price: string
  currency: string
  check_in_date: string
  check_out_date: string
  number_of_guests?: number
  created_at: string
}

export interface ReservationWithDetailsResponse {
  id: string
  reservation: ReservationResponse
}

export interface ReservationModificationPreviewRequest {
  check_in_date: string
  check_out_date: string
  number_of_guests: number
}

export interface ReservationModificationPreviewResponse {
  reservation_before: ReservationResponse
  reservation_after_preview: ReservationResponse
  delta_amount: string
  requires_additional_charge: boolean
  estimated_refund_amount: string
  policy_applied: string | null
  change_allowed: boolean
  reasons: string[]
}

export interface ReservationModificationConfirmRequest extends ReservationModificationPreviewRequest {
  idempotency_key: string
}

export interface ReservationCancellationPreviewResponse {
  refund_amount: string
  penalty_amount: string
  refund_type: 'none' | 'partial' | 'full'
  eligible_until: string | null
  policy_applied: string | null
  change_allowed: boolean
  reasons: string[]
}

export interface ReservationCancellationConfirmRequest {
  idempotency_key: string
  reason?: string
}

export interface ReservationConfirmResponse {
  reservation: ReservationResponse
  status_before: ReservationStatus
  status_after: ReservationStatus
  action_applied: ReservationActionApplied
  idempotency_key: string
  additional_charge_amount: string
  refund_amount: string
}

export interface ReservationHistoryEvent {
  id?: string
  type: string
  timestamp: string
  user_id?: string | null
  ip?: string | null
  metadata?: Record<string, unknown>
}

export interface ReservationPollResult {
  state: 'completed' | 'timeout'
  reservation: ReservationResponse
  attempts: number
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
