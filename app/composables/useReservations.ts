import { useI18n } from '#imports'
import type {
  ReservationCancellationConfirmRequest,
  ReservationCancellationPreviewResponse,
  ReservationConfirmResponse,
  ReservationHistoryResponse,
  ReservationModificationConfirmRequest,
  ReservationModificationPreviewRequest,
  ReservationModificationPreviewResponse,
  ReservationPollResult,
  ReservationRequest,
  ReservationResponse,
  ReservationWithDetailsResponse,
  ReservationStatus
} from '~/types/reservations'
import {
  confirmReservationCancellation as confirmReservationCancellationService,
  confirmReservationModification as confirmReservationModificationService,
  createReservation as createReservationService,
  getReservation as getReservationService,
  getReservationsByUser as getReservationsByUserService,
  getReservationHistory as getReservationHistoryService,
  previewReservationCancellation as previewReservationCancellationService,
  previewReservationModification as previewReservationModificationService
} from '~/services/reservationService'

const DEFAULT_POLL_ATTEMPTS = 8
const DEFAULT_POLL_INTERVAL_MS = 3000
const DEFAULT_TERMINAL_STATUSES: ReservationStatus[] = [
  'pending_payment',
  'confirmed',
  'cancelled',
  'refund_completed',
  'refund_failed',
  'modification_confirmed',
  'additional_charge_failed'
]

export interface PollReservationOptions {
  maxAttempts?: number
  intervalMs?: number
  terminalStatuses?: ReservationStatus[]
}

export const buildReservationIdempotencyKey = (prefix = 'reservation-action'): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const wait = async (ms: number) => {
  await new Promise(resolve => setTimeout(resolve, ms))
}

export const useReservations = () => {
  const { t } = useI18n()
  const authStore = useAuthStore()

  const loading = ref(false)
  const error = ref<string | null>(null)

  const resolveTravelerId = (travelerId?: string): string | undefined => {
    return travelerId || authStore.userId || undefined
  }

  const createReservation = async (data: ReservationRequest): Promise<ReservationResponse> => {
    loading.value = true
    error.value = null

    try {
      return await createReservationService(data)
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      error.value = apiError.message ? t(apiError.message) : t('errors.unknown')
      console.error('Reservation creation error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getReservation = async (reservationId: string, travelerId?: string): Promise<ReservationResponse> => {
    loading.value = true
    error.value = null

    try {
      return await getReservationService(reservationId, resolveTravelerId(travelerId))
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      error.value = apiError.message ? t(apiError.message) : t('errors.unknown')
      console.error('Get reservation error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getReservationsByUser = async (userId: string, statusGroup?: 'active' | 'past' | 'cancelled'): Promise<ReservationWithDetailsResponse[]> => {
    loading.value = true
    error.value = null

    try {
      return await getReservationsByUserService(userId, statusGroup)
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      error.value = apiError.message ? t(apiError.message) : t('errors.unknown')
      console.error('Get reservations by user error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const previewModification = async (
    reservationId: string,
    data: ReservationModificationPreviewRequest
  ): Promise<ReservationModificationPreviewResponse> => {
    loading.value = true
    error.value = null

    try {
      return await previewReservationModificationService(reservationId, data)
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      error.value = apiError.message ? t(apiError.message) : t('errors.unknown')
      console.error('Reservation modification preview error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const confirmModification = async (
    reservationId: string,
    travelerId: string,
    data: ReservationModificationConfirmRequest
  ): Promise<ReservationConfirmResponse> => {
    loading.value = true
    error.value = null

    try {
      return await confirmReservationModificationService(reservationId, travelerId, data)
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      error.value = apiError.message ? t(apiError.message) : t('errors.unknown')
      console.error('Reservation modification confirm error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const previewCancellation = async (
    reservationId: string,
    travelerId?: string
  ): Promise<ReservationCancellationPreviewResponse> => {
    loading.value = true
    error.value = null

    try {
      return await previewReservationCancellationService(reservationId, resolveTravelerId(travelerId))
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      error.value = apiError.message ? t(apiError.message) : t('errors.unknown')
      console.error('Reservation cancellation preview error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const confirmCancellation = async (
    reservationId: string,
    travelerId: string,
    data: ReservationCancellationConfirmRequest
  ): Promise<ReservationConfirmResponse> => {
    loading.value = true
    error.value = null

    try {
      return await confirmReservationCancellationService(reservationId, travelerId, data)
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      error.value = apiError.message ? t(apiError.message) : t('errors.unknown')
      console.error('Reservation cancellation confirm error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getReservationHistory = async (
    reservationId: string,
    travelerId: string
  ): Promise<ReservationHistoryResponse> => {
    loading.value = true
    error.value = null

    try {
      return await getReservationHistoryService(reservationId, travelerId)
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      error.value = apiError.message ? t(apiError.message) : t('errors.unknown')
      console.error('Reservation history error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const pollReservationUntilFinal = async (
    reservationId: string,
    options: PollReservationOptions = {},
    travelerId?: string
  ): Promise<ReservationPollResult> => {
    const maxAttempts = options.maxAttempts ?? DEFAULT_POLL_ATTEMPTS
    const intervalMs = options.intervalMs ?? DEFAULT_POLL_INTERVAL_MS
    const terminalStatuses = options.terminalStatuses ?? DEFAULT_TERMINAL_STATUSES

    loading.value = true
    error.value = null

    let lastReservation: ReservationResponse | null = null

    const resolvedTravelerId = resolveTravelerId(travelerId)

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        lastReservation = await getReservationService(reservationId, resolvedTravelerId)

        if (terminalStatuses.includes(lastReservation.status)) {
          return {
            state: 'completed',
            reservation: lastReservation,
            attempts: attempt
          }
        }

        if (attempt < maxAttempts) {
          await wait(intervalMs)
        }
      }

      if (!lastReservation) {
        lastReservation = await getReservationService(reservationId, resolvedTravelerId)
      }

      return {
        state: 'timeout',
        reservation: lastReservation,
        attempts: maxAttempts
      }
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      error.value = apiError.message ? t(apiError.message) : t('errors.unknown')
      console.error('Reservation polling error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    createReservation,
    getReservation,
    getReservationsByUser,
    previewModification,
    confirmModification,
    previewCancellation,
    confirmCancellation,
    getReservationHistory,
    pollReservationUntilFinal,
    buildIdempotencyKey: buildReservationIdempotencyKey,
    loading: readonly(loading),
    error: readonly(error)
  }
}
