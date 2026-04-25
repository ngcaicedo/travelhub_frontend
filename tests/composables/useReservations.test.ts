import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'

const mockCreateReservation = vi.fn()
const mockGetReservation = vi.fn()
const mockGetReservationsByUser = vi.fn()
const mockPreviewReservationModification = vi.fn()
const mockConfirmReservationModification = vi.fn()
const mockPreviewReservationCancellation = vi.fn()
const mockConfirmReservationCancellation = vi.fn()
const mockGetReservationHistory = vi.fn()

vi.mock('~/services/reservationService', () => ({
  createReservation: (...args: unknown[]) => mockCreateReservation(...args),
  getReservation: (...args: unknown[]) => mockGetReservation(...args),
  getReservationsByUser: (...args: unknown[]) => mockGetReservationsByUser(...args),
  previewReservationModification: (...args: unknown[]) => mockPreviewReservationModification(...args),
  confirmReservationModification: (...args: unknown[]) => mockConfirmReservationModification(...args),
  previewReservationCancellation: (...args: unknown[]) => mockPreviewReservationCancellation(...args),
  confirmReservationCancellation: (...args: unknown[]) => mockConfirmReservationCancellation(...args),
  getReservationHistory: (...args: unknown[]) => mockGetReservationHistory(...args)
}))

const reservationData = {
  id_traveler: 'user-1',
  id_property: 'prop-1',
  id_room: 'room-1',
  check_in_date: '2026-10-12T00:00:00.000Z',
  check_out_date: '2026-10-17T00:00:00.000Z',
  number_of_guests: 2,
  currency: 'COP'
}

function createTestComponent(setupFn: () => Record<string, unknown>) {
  return defineComponent({
    setup() {
      return setupFn()
    },
    template: '<div>test</div>'
  })
}

describe('useReservations', () => {
  beforeEach(() => {
    mockCreateReservation.mockReset()
    mockGetReservation.mockReset()
    mockGetReservationsByUser.mockReset()
    mockPreviewReservationModification.mockReset()
    mockConfirmReservationModification.mockReset()
    mockPreviewReservationCancellation.mockReset()
    mockConfirmReservationCancellation.mockReset()
    mockGetReservationHistory.mockReset()
  })

  it('initializes with loading false and no error', async () => {
    const Component = createTestComponent(() => {
      const { loading, error } = useReservations()
      return { loading, error }
    })

    const wrapper = await mountSuspended(Component)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBeNull()
  })

  it('createReservation returns response on success', async () => {
    const mockResponse = { id: 'res-123', status: 'confirmed' }
    mockCreateReservation.mockResolvedValue(mockResponse)

    let createFn: (data: typeof reservationData) => Promise<unknown>
    const Component = createTestComponent(() => {
      const composable = useReservations()
      createFn = composable.createReservation
      return { loading: composable.loading, error: composable.error }
    })

    const wrapper = await mountSuspended(Component)
    const result = await createFn!(reservationData)

    expect(result).toEqual(mockResponse)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBeNull()
  })

  it('createReservation sets error and rethrows on failure', async () => {
    mockCreateReservation.mockRejectedValue({ message: 'errors.validation' })

    let createFn: (data: typeof reservationData) => Promise<unknown>
    const Component = createTestComponent(() => {
      const composable = useReservations()
      createFn = composable.createReservation
      return { loading: composable.loading, error: composable.error }
    })

    const wrapper = await mountSuspended(Component)
    await expect(createFn!(reservationData)).rejects.toBeTruthy()

    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBeTruthy()
  })

  it('getReservation returns response on success', async () => {
    const mockResponse = { id: 'res-123', status: 'confirmed' }
    mockGetReservation.mockResolvedValue(mockResponse)

    let getFn: (id: string) => Promise<unknown>
    const Component = createTestComponent(() => {
      const composable = useReservations()
      getFn = composable.getReservation
      return { loading: composable.loading, error: composable.error }
    })

    const wrapper = await mountSuspended(Component)
    const result = await getFn!('res-123')

    expect(result).toEqual(mockResponse)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBeNull()
  })

  it('getReservation sets error and rethrows on failure', async () => {
    mockGetReservation.mockRejectedValue({ message: 'errors.notFound' })

    let getFn: (id: string) => Promise<unknown>
    const Component = createTestComponent(() => {
      const composable = useReservations()
      getFn = composable.getReservation
      return { loading: composable.loading, error: composable.error }
    })

    const wrapper = await mountSuspended(Component)
    await expect(getFn!('not-found')).rejects.toBeTruthy()

    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBeTruthy()
  })

  it('getReservationsByUser returns response on success', async () => {
    const mockResponse = [{ id: 'res-123', reservation: { id: 'res-123', status: 'confirmed' } }]
    mockGetReservationsByUser.mockResolvedValue(mockResponse)

    let getByUserFn: (userId: string, statusGroup?: string) => Promise<unknown>
    const Component = createTestComponent(() => {
      const composable = useReservations()
      getByUserFn = composable.getReservationsByUser
      return { loading: composable.loading, error: composable.error }
    })

    const wrapper = await mountSuspended(Component)
    const result = await getByUserFn!('traveler-1')

    expect(result).toEqual(mockResponse)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.error).toBeNull()
  })

  it('getReservationsByUser passes statusGroup to service', async () => {
    mockGetReservationsByUser.mockResolvedValue([])

    let getByUserFn: (userId: string, statusGroup?: 'active' | 'past' | 'cancelled') => Promise<unknown>
    const Component = createTestComponent(() => {
      const composable = useReservations()
      getByUserFn = composable.getReservationsByUser
      return {}
    })

    await mountSuspended(Component)
    await getByUserFn!('traveler-1', 'cancelled')

    expect(mockGetReservationsByUser).toHaveBeenCalledWith('traveler-1', 'cancelled')
  })

  it('getReservationsByUser sets error and rethrows on failure', async () => {
    mockGetReservationsByUser.mockRejectedValue({ message: 'errors.forbidden' })

    let getByUserFn: (userId: string) => Promise<unknown>
    const Component = createTestComponent(() => {
      const composable = useReservations()
      getByUserFn = composable.getReservationsByUser
      return { error: composable.error }
    })

    const wrapper = await mountSuspended(Component)
    await expect(getByUserFn!('traveler-1')).rejects.toBeTruthy()

    expect(wrapper.vm.error).toBeTruthy()
  })

  it('sets generic error when error has no message', async () => {
    mockCreateReservation.mockRejectedValue({})

    let createFn: (data: typeof reservationData) => Promise<unknown>
    const Component = createTestComponent(() => {
      const composable = useReservations()
      createFn = composable.createReservation
      return { error: composable.error }
    })

    await mountSuspended(Component)
    await expect(createFn!(reservationData)).rejects.toBeTruthy()
  })

  it('previewModification returns response on success', async () => {
    const previewResponse = { change_allowed: true, reasons: [] }
    mockPreviewReservationModification.mockResolvedValue(previewResponse)

    const Component = createTestComponent(() => {
      const composable = useReservations()
      return {
        previewFn: composable.previewModification
      }
    })

    const wrapper = await mountSuspended(Component)
    const result = await (wrapper.vm as unknown as {
      previewFn: (id: string, payload: {
        check_in_date: string
        check_out_date: string
        number_of_guests: number
      }) => Promise<unknown>
    }).previewFn('res-1', {
      check_in_date: '2026-10-12T00:00:00.000Z',
      check_out_date: '2026-10-13T00:00:00.000Z',
      number_of_guests: 2
    })

    expect(result).toEqual(previewResponse)
  })

  it('confirmCancellation returns response on success', async () => {
    const confirmResponse = { status_after: 'cancel_requested' }
    mockConfirmReservationCancellation.mockResolvedValue(confirmResponse)

    const Component = createTestComponent(() => {
      const composable = useReservations()
      return {
        confirmFn: composable.confirmCancellation
      }
    })

    const wrapper = await mountSuspended(Component)
    const result = await (wrapper.vm as unknown as {
      confirmFn: (id: string, travelerId: string, payload: { idempotency_key: string }) => Promise<unknown>
    }).confirmFn('res-1', 'traveler-1', {
      idempotency_key: 'idem-1'
    })

    expect(result).toEqual(confirmResponse)
  })

  it('pollReservationUntilFinal returns completed when terminal status is reached', async () => {
    mockGetReservation
      .mockResolvedValueOnce({ id: 'res-1', status: 'refund_pending' })

    const Component = createTestComponent(() => {
      const composable = useReservations()
      return {
        pollFn: composable.pollReservationUntilFinal
      }
    })

    const wrapper = await mountSuspended(Component)

    const result = await (wrapper.vm as unknown as {
      pollFn: (id: string, options: { maxAttempts: number, intervalMs: number }) => Promise<unknown>
    }).pollFn('res-1', {
      maxAttempts: 2,
      intervalMs: 0
    }) as { state: string, attempts: number }

    expect(result.state).toBe('completed')
    expect(result.attempts).toBe(1)
  })

  it('pollReservationUntilFinal returns timeout when terminal status is not reached', async () => {
    mockGetReservation
      .mockResolvedValueOnce({ id: 'res-1', status: 'confirmed' })
      .mockResolvedValueOnce({ id: 'res-1', status: 'confirmed' })

    const Component = createTestComponent(() => {
      const composable = useReservations()
      return {
        pollFn: composable.pollReservationUntilFinal
      }
    })

    const wrapper = await mountSuspended(Component)

    const result = await (wrapper.vm as unknown as {
      pollFn: (id: string, options: {
        maxAttempts: number
        intervalMs: number
        terminalStatuses: string[]
      }) => Promise<unknown>
    }).pollFn('res-1', {
      maxAttempts: 2,
      intervalMs: 0,
      terminalStatuses: ['refund_completed']
    }) as { state: string, attempts: number }

    expect(result.state).toBe('timeout')
    expect(result.attempts).toBe(2)
  })

  it('buildIdempotencyKey returns a prefixed key', async () => {
    const Component = createTestComponent(() => {
      const composable = useReservations()
      return {
        buildIdempotencyKeyFn: composable.buildIdempotencyKey
      }
    })

    const wrapper = await mountSuspended(Component)

    const key = (wrapper.vm as unknown as {
      buildIdempotencyKeyFn: (prefix?: string) => string
    }).buildIdempotencyKeyFn('reservation-test')
    expect(key.startsWith('reservation-test-')).toBe(true)
  })
})
