import type {
  HotelReservationActionResponse,
  HotelReservationListItem,
  ReservationCancellationReason,
  ReservationRequest,
  ReservationResponse
} from '~/types/reservations'
import { getApiBaseUrls, handleApiError } from '~/utils/api'

export const createReservation = async (data: ReservationRequest): Promise<ReservationResponse> => {
  const { reservationsApiUrl } = getApiBaseUrls()

  try {
    return await $fetch<ReservationResponse>('/api/v1/reservations', {
      baseURL: reservationsApiUrl,
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
  const { reservationsApiUrl } = getApiBaseUrls()

  try {
    return await $fetch<ReservationResponse>(`/api/v1/reservations/${reservationId}`, {
      baseURL: reservationsApiUrl,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error: unknown) {
    throw handleApiError(error)
  }
}

export const getHotelReservations = async (
  propertyId: string,
  token: string,
  status?: string
): Promise<HotelReservationListItem[]> => {
  const { reservationsApiUrl } = getApiBaseUrls()
  const query = new URLSearchParams({ propertyId })
  if (status) query.set('status', status)

  try {
    return await $fetch<HotelReservationListItem[]>(`/api/v1/hotel/reservations?${query.toString()}`, {
      baseURL: reservationsApiUrl,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error: unknown) {
    throw handleApiError(error)
  }
}

export const confirmHotelReservation = async (
  reservationId: string,
  token: string,
  reason?: string
): Promise<HotelReservationActionResponse> => {
  const { reservationsApiUrl } = getApiBaseUrls()

  try {
    return await $fetch<HotelReservationActionResponse>(`/api/v1/hotel/reservations/${reservationId}/confirm`, {
      baseURL: reservationsApiUrl,
      method: 'POST',
      body: { reason },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
  } catch (error: unknown) {
    throw handleApiError(error)
  }
}

export const cancelHotelReservation = async (
  reservationId: string,
  token: string,
  reason: ReservationCancellationReason,
  note?: string
): Promise<HotelReservationActionResponse> => {
  const { reservationsApiUrl } = getApiBaseUrls()

  try {
    return await $fetch<HotelReservationActionResponse>(`/api/v1/hotel/reservations/${reservationId}/cancel`, {
      baseURL: reservationsApiUrl,
      method: 'POST',
      body: { reason, note },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
  } catch (error: unknown) {
    throw handleApiError(error)
  }
}
