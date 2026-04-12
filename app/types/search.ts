export type SearchOrderBy = 'price' | 'rating' | 'name'
export type SearchOrderDirection = 'asc' | 'desc'

export interface SearchRequest {
  city: string
  check_in: string
  check_out: string
  guests: number
  amenities?: string[]
  min_price?: number
  max_price?: number
  order_by?: SearchOrderBy
  order_dir?: SearchOrderDirection
  page?: number
  page_size?: number
}

export interface SearchResultItem {
  id: string
  name: string
  city: string
  country: string
  max_capacity: number
  main_image_url: string | null
  rating: number
  price_from: string
  currency: string
  amenities: readonly string[]
}

export interface SearchPagination {
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface SearchEmptyStateItem {
  code: string
  message: string
}

export interface SearchResponse {
  items: SearchResultItem[]
  pagination: SearchPagination
  empty_state: SearchEmptyStateItem[]
}