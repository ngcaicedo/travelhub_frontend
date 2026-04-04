export type UserRole = 'traveler' | 'hotel_partner'

export interface RegisterPayload {
  email: string
  phone: string
  password: string
  full_name: string
  hotel_name?: string
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
  status: number
}
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

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  comment: string
  verified_stay: boolean
}
