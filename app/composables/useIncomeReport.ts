import type {
  HostIncomeComparison,
  HostIncomeReportParams,
  HostRevenueTrends,
} from '~/types/hotel'
import {
  getHostMetrics,
  getRevenueTrends,
} from '~/services/hostReservationsService'

function buildDateRange(year: number, month: number | null): { start_date: string, end_date: string } {
  if (month === null) {
    return {
      start_date: `${year}-01-01T00:00:00.000Z`,
      end_date: `${year}-12-31T23:59:59.999Z`,
    }
  }
  const end = new Date(year, month, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    start_date: `${year}-${pad(month)}-01T00:00:00.000Z`,
    end_date: `${year}-${pad(month)}-${pad(end.getDate())}T23:59:59.999Z`,
  }
}

function previousPeriod(year: number, month: number | null): { year: number, month: number | null } {
  if (month === null) return { year: year - 1, month: null }
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}

function calcChangePercent(current: string, previous: string): number | null {
  const curr = Number(current)
  const prev = Number(previous)
  if (!Number.isFinite(curr) || !Number.isFinite(prev) || prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

export function useIncomeReport() {
  const auth = useAuthStore()

  const params = ref<HostIncomeReportParams>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    currency: undefined,
  })

  const comparison = ref<HostIncomeComparison | null>(null)
  const trends = ref<HostRevenueTrends | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    comparison.value = null
    trends.value = null

    try {
      const { year, month, currency } = params.value
      const currRange = buildDateRange(year, month)
      const prev = previousPeriod(year, month)
      const prevRange = buildDateRange(prev.year, prev.month)
      const granularity = month === null ? 'month' : 'day'

      const [current, previous, trendsData] = await Promise.all([
        getHostMetrics(auth.token, { ...currRange, currency }),
        getHostMetrics(auth.token, { ...prevRange, currency }),
        getRevenueTrends(auth.token, { ...currRange, granularity, currency }),
      ])

      comparison.value = {
        current,
        previous,
        change_percent: calcChangePercent(current.revenue_amount, previous.revenue_amount),
      }
      trends.value = trendsData
    } catch (e: unknown) {
      const apiError = e as { message?: string }
      error.value = apiError.message ?? 'errors.unknown'
    } finally {
      loading.value = false
    }
  }

  return { params, comparison, trends, loading, error, load }
}
