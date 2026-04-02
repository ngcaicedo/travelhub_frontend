import type { ReservationRequest, ReservationResponse } from '~/shared/types/api'
import { useApi } from '~/shared/composables/useApi'

export const useReservations = () => {
  const { reservationsBaseUrl, handleApiError } = useApi()

  const loading = ref(false)
  const error = ref<string | null>(null)

  const createReservation = async (data: ReservationRequest): Promise<ReservationResponse> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<ReservationResponse>(
        '/api/v1/reservations',
        {
          baseURL: reservationsBaseUrl,
          method: 'POST',
          body: data,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      return response
    } catch (err: unknown) {
      const apiError = handleApiError(err)
      error.value = apiError.message
      console.error('Reservation creation error:', apiError)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getReservation = async (reservationId: string): Promise<ReservationResponse> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<ReservationResponse>(
        `/api/v1/reservations/${reservationId}`,
        {
          baseURL: reservationsBaseUrl,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      return response
    } catch (err: unknown) {
      const apiError = handleApiError(err)
      error.value = apiError.message
      console.error('Get reservation error:', apiError)
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
