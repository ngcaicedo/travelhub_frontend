import type {
  HotelReservationActionResponse,
  HotelReservationListItem,
  ReservationCancellationReason,
  ReservationRequest,
  ReservationResponse
  ReservationHistoryResponse,
  ReservationModificationPreviewRequest,
  ReservationModificationPreviewResponse,
  ReservationModificationConfirmRequest,
  ReservationCancellationPreviewResponse,
  ReservationCancellationConfirmRequest,
  ReservationConfirmResponse,
  ReservationWithDetailsResponse,
} from '~/types/reservations'
import { getApiBaseUrls, handleApiError } from '~/utils/api'

const withTravelerHeaders = (travelerId?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (travelerId) {
    headers['X-Traveler-Id'] = travelerId
  }

  return headers
}

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

export const getReservation = async (reservationId: string, travelerId?: string): Promise<ReservationResponse> => {
  const { reservationsApiUrl } = getApiBaseUrls()

  try {
    return await $fetch<ReservationResponse>(`/api/v1/reservations/${reservationId}`, {
      baseURL: reservationsApiUrl,
      method: 'GET',
      headers: withTravelerHeaders(travelerId)
    })
  } catch (error: unknown) {
    throw handleApiError(error)
  }
}

export const getReservationsByUser = async (userId: string, statusGroup?: 'active' | 'past' | 'cancelled'): Promise<ReservationWithDetailsResponse[]> => {
  const { reservationsApiUrl } = getApiBaseUrls()

  try {
    const query = statusGroup ? `?status_group=${statusGroup}` : ''
    return await $fetch<ReservationWithDetailsResponse[]>(`/api/v1/reservations/users/${userId}${query}`, {
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

export const previewReservationModification = async (
  reservationId: string,
  data: ReservationModificationPreviewRequest
): Promise<ReservationModificationPreviewResponse> => {
  const { reservationsApiUrl } = getApiBaseUrls()

  try {
    return await $fetch<ReservationModificationPreviewResponse>(`/api/v1/reservations/${reservationId}/modifications/preview`, {
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

export const confirmReservationModification = async (
  reservationId: string,
  travelerId: string,
  data: ReservationModificationConfirmRequest
): Promise<ReservationConfirmResponse> => {
  const { reservationsApiUrl } = getApiBaseUrls()

  try {
    return await $fetch<ReservationConfirmResponse>(`/api/v1/reservations/${reservationId}/modifications/confirm`, {
      baseURL: reservationsApiUrl,
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/json',
        'X-Traveler-Id': travelerId
      }
    })
  } catch (error: unknown) {
    throw handleApiError(error)
  }
}

export const previewReservationCancellation = async (
  reservationId: string,
  travelerId?: string
): Promise<ReservationCancellationPreviewResponse> => {
  const { reservationsApiUrl } = getApiBaseUrls()

  try {
    return await $fetch<ReservationCancellationPreviewResponse>(`/api/v1/reservations/${reservationId}/cancellation/preview`, {
      baseURL: reservationsApiUrl,
      method: 'POST',
      headers: withTravelerHeaders(travelerId)
    })
  } catch (error: unknown) {
    throw handleApiError(error)
  }
}

export const confirmReservationCancellation = async (
  reservationId: string,
  travelerId: string,
  data: ReservationCancellationConfirmRequest
): Promise<ReservationConfirmResponse> => {
  const { reservationsApiUrl } = getApiBaseUrls()

  try {
    return await $fetch<ReservationConfirmResponse>(`/api/v1/reservations/${reservationId}/cancellation/confirm`, {
      baseURL: reservationsApiUrl,
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/json',
        'X-Traveler-Id': travelerId
      }
    })
  } catch (error: unknown) {
    throw handleApiError(error)
  }
}

export const getReservationHistory = async (
  reservationId: string,
  travelerId: string
): Promise<ReservationHistoryResponse> => {
  const { reservationsApiUrl } = getApiBaseUrls()

  try {
    return await $fetch<ReservationHistoryResponse>(`/api/v1/reservations/${reservationId}/history`, {
      baseURL: reservationsApiUrl,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Traveler-Id': travelerId
      }
    })
  } catch (error: unknown) {
    throw handleApiError(error)
  }
}
