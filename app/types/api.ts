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
