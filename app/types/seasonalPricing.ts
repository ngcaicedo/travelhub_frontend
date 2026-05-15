export interface SeasonalPricingResponse {
  id: string
  property_id: string
  season_start: string
  season_end: string
  price_per_night: number
  currency: string
  tax_rate: number
  cleaning_fee: number
  signature_hash: string
  signature_algo: string
  integrity_locked: boolean
  integrity_checked_at: string | null
  created_at: string
  updated_at: string
  integrity_valid: boolean
}

export interface SeasonalPricingWritePayload {
  season_start: string
  season_end: string
  price_per_night: number
  currency: string
  tax_rate: number
  cleaning_fee: number
}

export type SeasonalPricingUpdatePayload = Partial<SeasonalPricingWritePayload>

export interface SeasonalPricingValidationErrors {
  season_start?: string
  season_end?: string
  price_per_night?: string
  currency?: string
  tax_rate?: string
  cleaning_fee?: string
}
