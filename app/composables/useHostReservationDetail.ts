import type { HostReservationDetail, HostReservationInternalNote } from '~/types/hotel'
import {
  addHostReservationNote,
  getHostReservationDetail,
} from '~/services/hostReservationsService'
import {
  cancelHotelReservation,
  confirmHotelReservation,
} from '~/services/reservationService'
import type { ReservationCancellationReason } from '~/types/reservations'

export function useHostReservationDetail() {
  const auth = useAuthStore()

  const detail = ref<HostReservationDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(reservationId: string) {
    loading.value = true
    error.value = null
    try {
      detail.value = await getHostReservationDetail(auth.token, reservationId)
    } catch (e: unknown) {
      const apiError = e as { message?: string }
      error.value = apiError.message ?? 'errors.unknown'
    } finally {
      loading.value = false
    }
  }

  async function addNote(reservationId: string, content: string): Promise<HostReservationInternalNote | null> {
    error.value = null
    try {
      const note = await addHostReservationNote(auth.token, reservationId, content)
      if (detail.value) {
        detail.value = {
          ...detail.value,
          internal_notes: [...detail.value.internal_notes, note],
        }
      }
      return note
    } catch (e: unknown) {
      const apiError = e as { message?: string }
      error.value = apiError.message ?? 'errors.unknown'
      return null
    }
  }

  async function confirm(reservationId: string): Promise<boolean> {
    error.value = null
    try {
      await confirmHotelReservation(reservationId, auth.token ?? '')
      await load(reservationId)
      return true
    } catch (e: unknown) {
      const apiError = e as { message?: string }
      error.value = apiError.message ?? 'errors.unknown'
      return false
    }
  }

  async function cancel(
    reservationId: string,
    reason: ReservationCancellationReason,
    note?: string,
  ): Promise<boolean> {
    error.value = null
    try {
      await cancelHotelReservation(reservationId, auth.token ?? '', reason, note)
      await load(reservationId)
      return true
    } catch (e: unknown) {
      const apiError = e as { message?: string }
      error.value = apiError.message ?? 'errors.unknown'
      return false
    }
  }

  return {
    detail,
    loading,
    error,
    load,
    addNote,
    confirm,
    cancel,
  }
}
