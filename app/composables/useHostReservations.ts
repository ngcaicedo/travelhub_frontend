import type {
  HostMetrics,
  HostReservationsFilters,
  HostReservationsPage,
  HostRevenueTrends,
} from '~/types/hotel'
import {
  getHostMetrics,
  getRevenueTrends,
  listHostReservations,
} from '~/services/hostReservationsService'

export function useHostReservations() {
  const auth = useAuthStore()

  const reservations = ref<HostReservationsPage | null>(null)
  const metrics = ref<HostMetrics | null>(null)
  const trends = ref<HostRevenueTrends | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function refreshReservations(filters: HostReservationsFilters) {
    loading.value = true
    error.value = null
    try {
      reservations.value = await listHostReservations(auth.token, filters)
    } catch (e: unknown) {
      const apiError = e as { message?: string }
      error.value = apiError.message ?? 'errors.unknown'
    } finally {
      loading.value = false
    }
  }

  async function refreshMetrics(range: { start_date?: string, end_date?: string, currency?: string }) {
    try {
      metrics.value = await getHostMetrics(auth.token, range)
    } catch (e: unknown) {
      const apiError = e as { message?: string }
      error.value = apiError.message ?? 'errors.unknown'
    }
  }

  async function refreshTrends(range: { start_date?: string, end_date?: string, granularity?: 'day' | 'week' | 'month', currency?: string }) {
    try {
      trends.value = await getRevenueTrends(auth.token, range)
    } catch (e: unknown) {
      const apiError = e as { message?: string }
      error.value = apiError.message ?? 'errors.unknown'
    }
  }

  return {
    reservations,
    metrics,
    trends,
    loading,
    error,
    refreshReservations,
    refreshMetrics,
    refreshTrends,
  }
}
