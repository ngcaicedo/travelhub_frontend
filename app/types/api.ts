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
