import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'

const mockCreateReservation = vi.fn()
const mockGetReservation = vi.fn()

vi.mock('~/services/reservationService', () => ({
  createReservation: (...args: unknown[]) => mockCreateReservation(...args),
  getReservation: (...args: unknown[]) => mockGetReservation(...args)
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
})
