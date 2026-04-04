import type { ReservationRequest, ReservationResponse } from '~/types/reservations'
import { createReservation as createReservationService, getReservation as getReservationService } from '~/services/reservationService'

export const useReservations = () => {
  const { t } = useI18n()

  const loading = ref(false)
  const error = ref<string | null>(null)

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

  const getReservation = async (reservationId: string): Promise<ReservationResponse> => {
    loading.value = true
    error.value = null

    try {
      return await getReservationService(reservationId)
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      error.value = apiError.message ? t(apiError.message) : t('errors.unknown')
      console.error('Get reservation error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    createReservation,
    getReservation,
    loading: readonly(loading),
    error: readonly(error)
  }
}
