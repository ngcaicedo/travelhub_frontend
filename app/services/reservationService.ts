import type { ReservationRequest, ReservationResponse } from '~/types/reservations'
import { getApiBaseUrls, handleApiError } from '~/utils/api'

export const createReservation = async (data: ReservationRequest): Promise<ReservationResponse> => {
  const { reservationsBaseUrl } = getApiBaseUrls()

  try {
    return await $fetch<ReservationResponse>('/api/v1/reservations', {
      baseURL: reservationsBaseUrl,
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error: unknown) {
    throw handleApiError(error)
  }
}

export const getReservation = async (reservationId: string): Promise<ReservationResponse> => {
  const { reservationsBaseUrl } = getApiBaseUrls()

  try {
    return await $fetch<ReservationResponse>(`/api/v1/reservations/${reservationId}`, {
      baseURL: reservationsBaseUrl,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error: unknown) {
    throw handleApiError(error)
  }
}
