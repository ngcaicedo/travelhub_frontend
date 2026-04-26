export type ReservationStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'cancelled'
  | 'completed'

export interface HostReservationItem {
  id: string
  reservation_number: string
  id_property: string
  id_room: string
  id_traveler: string
  guest_full_name: string | null
  room_type: string | null
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  total_price: string
  currency: string
  status: ReservationStatus
  created_at: string
}

export interface HostReservationsPage {
  items: HostReservationItem[]
  total: number
  page: number
  page_size: number
}

export interface HostMetrics {
  active_reservations: number
  occupancy_rate: number
  revenue_amount: string
  revenue_currency: string | null
  available_currencies: string[]
  average_daily_rate: string
  total_nights: number
}

export interface HostRevenueBucket {
  bucket: string
  revenue: string
  reservations: number
}

export interface HostRevenueTrends {
  granularity: 'day' | 'week' | 'month'
  currency: string | null
  available_currencies: string[]
  buckets: HostRevenueBucket[]
}

export interface HostReservationsFilters {
  status?: ReservationStatus[]
  start_date?: string
  end_date?: string
  guest_name?: string
  sort_by?: 'check_in_date' | 'created_at' | 'total_price'
  sort_dir?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface HostReservationDetailPriceBreakdown {
  accommodation_in_cents: number
  cleaning_fee_in_cents: number
  service_fee_in_cents: number
  taxes_in_cents: number
  total_in_cents: number
  currency: string
  nights: number
  nightly_rate_in_cents: number
}

export interface HostReservationDetailReservation {
  id: string
  id_traveler: string
  id_property: string
  id_room: string
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  total_price: string
  currency: string
  status: ReservationStatus
  hold_expires_at: string
  version: number
  created_at: string
  updated_at: string
  price_breakdown: HostReservationDetailPriceBreakdown | null
}

export interface HostReservationGuest {
  id: string
  full_name: string
  email: string
  phone: string | null
}

export interface HostReservationChangeHistoryEvent {
  id: string
  reservation_id: string
  action: string
  previous_status: string | null
  new_status: string
  reason: string | null
  actor_user_id: string | null
  source_ip: string | null
  created_at: string
}

export interface HostReservationInternalNote {
  id: string
  reservation_id: string
  content: string
  author_user_id: string | null
  author_name: string | null
  created_at: string
}

export interface HostReservationAvailableAction {
  action: 'confirm' | 'cancel'
  label: string
}

export interface HostReservationDetail {
  reservation: HostReservationDetailReservation
  guest: HostReservationGuest | null
  change_history: HostReservationChangeHistoryEvent[]
  internal_notes: HostReservationInternalNote[]
  available_actions: HostReservationAvailableAction[]
}
