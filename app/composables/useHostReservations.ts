import type {
  HostMetrics,
  HostReservationsFilters,
  HostReservationsPage,
  HostRevenueTrends
} from '~/types/hotel'
import {
  getHostMetrics,
  getRevenueTrends,
  listHostReservations
} from '~/services/hostReservationsService'

export function useHostReservations() {
  const auth = useAuthStore()

  const reservations = ref<HostReservationsPage | null>(null)
  const metrics = ref<HostMetrics | null>(null)
  const trends = ref<HostRevenueTrends | null>(null)
  const inflight = ref(0)
  const loading = computed(() => inflight.value > 0)
  const error = ref<string | null>(null)

  async function track<T>(fn: () => Promise<T>, assign: (value: T) => void) {
    inflight.value++
    error.value = null
    try {
      assign(await fn())
    } catch (e: unknown) {
      const apiError = e as { message?: string }
      error.value = apiError.message ?? 'errors.unknown'
    } finally {
      inflight.value--
    }
  }

  async function refreshReservations(filters: HostReservationsFilters) {
    await track(
      () => listHostReservations(auth.token, filters),
      (value) => { reservations.value = value }
    )
  }

  async function refreshMetrics(range: { start_date?: string, end_date?: string, currency?: string }) {
    await track(
      () => getHostMetrics(auth.token, range),
      (value) => { metrics.value = value }
    )
  }

  async function refreshTrends(range: { start_date?: string, end_date?: string, granularity?: 'day' | 'week' | 'month', currency?: string }) {
    await track(
      () => getRevenueTrends(auth.token, range),
      (value) => { trends.value = value }
    )
  }

  return {
    reservations,
    metrics,
    trends,
    loading,
    error,
    refreshReservations,
    refreshMetrics,
    refreshTrends
  }
}
