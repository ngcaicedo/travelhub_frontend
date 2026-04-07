export type SearchOrderBy = 'price' | 'rating' | 'name'
export type SearchOrderDirection = 'asc' | 'desc'

export interface SearchRequest {
  ciudad: string
  check_in: string
  check_out: string
  huespedes: number
  amenidades?: string[]
  precio_min?: number
  precio_max?: number
  order_by?: SearchOrderBy
  order_dir?: SearchOrderDirection
  page?: number
  page_size?: number
}

export interface SearchResultItem {
  id: string
  nombre: string
  ciudad: string
  pais: string
  capacidad_maxima: number
  imagen_principal_url: string
  rating: number
  precio_desde: string
  moneda: string
  amenidades: string[]
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