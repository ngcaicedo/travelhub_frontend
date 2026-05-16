export type UserRole = 'traveler' | 'hotel' | 'admin'

export interface RegisterPayload {
  email: string
  phone: string
  password: string
  full_name: string
  hotel_name?: string
  country_code?: string
  role: UserRole
}

export interface LoginResponse {
  message: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  role: UserRole
}

export interface UserResponse {
  id: string
  email: string
  phone: string
  full_name: string
  hotel_name?: string
  country_code: string
  data_region: string
  status: number
}
// API Response & Request types

export interface PropertyImage {
  id: string
  url: string
  url_hires?: string | null
  alt_text?: string
  position: number
  is_cover?: boolean
}

export interface Property {
  id: string
  name: string
  description: string
  location: string
  latitude?: number
  longitude?: number
  price_per_night: number
  base_price_per_night?: number | null
  has_seasonal_discount?: boolean
  currency: string
  rating: number
  review_count: number
  bedrooms: number
  bathrooms: number
  max_guests: number
  amenities: string[]
  images: PropertyImage[]
  reviews?: Review[]
  status?: number
  cancellation_policy?: string
  tax_rate?: number
  cleaning_fee?: number
}

export interface PriceBreakdown {
  accommodation_in_cents: number
  cleaning_fee_in_cents: number
  service_fee_in_cents: number
  taxes_in_cents: number
  total_in_cents: number
  currency: string
  nights: number
  nightly_rate_in_cents: number
}

export interface Review {
  id: string
  author: string
  rating: number
  review_date: string
  comment: string
  verified_stay: boolean
}
