// API Response & Request types

export interface PropertyImage {
  id: string
  url: string
  alt_text?: string
  position: number
}

export interface Property {
  id: string
  name: string
  description: string
  location: string
  latitude?: number
  longitude?: number
  price_per_night: number
  currency: string
  rating: number
  review_count: number
  bedrooms: number
  bathrooms: number
  max_guests: number
  amenities: string[]
  images: PropertyImage[]
}

export interface ReservationRequest {
  id_traveler: string
  id_property: string
  id_room?: string
  check_in_date: string // ISO 8601
  check_out_date: string // ISO 8601
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
  created_at: string
}

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  comment: string
  verified_stay: boolean
}
