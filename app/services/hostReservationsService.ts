import type {
  HostMetrics,
  HostReservationsFilters,
  HostReservationsPage,
  HostRevenueTrends,
} from '~/types/hotel'
import { getApiBaseUrls, handleApiError } from '~/utils/api'

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function toQuery(filters: HostReservationsFilters): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {}
  if (filters.status?.length) query.status = filters.status
  if (filters.start_date) query.start_date = filters.start_date
  if (filters.end_date) query.end_date = filters.end_date
  if (filters.guest_name) query.guest_name = filters.guest_name
  if (filters.sort_by) query.sort_by = filters.sort_by
  if (filters.sort_dir) query.sort_dir = filters.sort_dir
  if (filters.page) query.page = String(filters.page)
  if (filters.page_size) query.page_size = String(filters.page_size)
  return query
}

export async function listHostReservations(
  token: string | null,
  filters: HostReservationsFilters = {},
): Promise<HostReservationsPage> {
  const { reservationsApiUrl } = getApiBaseUrls()
  try {
    return await $fetch<HostReservationsPage>('/api/v1/reservations/host/me', {
      baseURL: reservationsApiUrl,
      method: 'GET',
      query: toQuery(filters),
      headers: authHeaders(token),
    })
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function getHostMetrics(
  token: string | null,
  range: { start_date?: string, end_date?: string } = {},
): Promise<HostMetrics> {
  const { reservationsApiUrl } = getApiBaseUrls()
  try {
    return await $fetch<HostMetrics>('/api/v1/reservations/host/me/metrics', {
      baseURL: reservationsApiUrl,
      method: 'GET',
      query: range,
      headers: authHeaders(token),
    })
  } catch (error) {
    throw handleApiError(error)
  }
}

export async function getRevenueTrends(
  token: string | null,
  range: { start_date?: string, end_date?: string, granularity?: 'day' | 'week' | 'month' } = {},
): Promise<HostRevenueTrends> {
  const { reservationsApiUrl } = getApiBaseUrls()
  try {
    return await $fetch<HostRevenueTrends>(
      '/api/v1/reservations/host/me/revenue-trends',
      {
        baseURL: reservationsApiUrl,
        method: 'GET',
        query: range,
        headers: authHeaders(token),
      },
    )
  } catch (error) {
    throw handleApiError(error)
  }
}
