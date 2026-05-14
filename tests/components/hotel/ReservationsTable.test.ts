import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, ref, nextTick } from 'vue'
import ReservationsTable from '~/components/hotel/ReservationsTable.vue'
import type { HostReservationsPage } from '~/types/hotel'

describe('HotelReservationsTable', () => {
  const page: HostReservationsPage = {
    items: [
      {
        id: '1',
        reservation_number: 'R-001',
        id_property: 'p1',
        id_room: 'r1',
        id_traveler: 't1',
        guest_full_name: 'Ana López',
        room_type: 'Suite',
        check_in_date: '2026-04-10',
        check_out_date: '2026-04-12',
        number_of_guests: 2,
        total_price: '500.00',
        currency: 'COP',
        status: 'confirmed',
        created_at: '2026-04-01T00:00:00Z',
        available_actions: [],
      }
    ],
    total: 1,
    page: 1,
    page_size: 10
  }

  it('los headers reaccionan al cambio de locale', async () => {
    const Wrapper = defineComponent({
      setup() {
        const { setLocale } = useI18n()
        const sortBy = ref<'check_in_date' | 'created_at' | 'total_price'>('check_in_date')
        const sortDir = ref<'asc' | 'desc'>('desc')
        const pageNum = ref(1)
        return { setLocale, sortBy, sortDir, pageNum }
      },
      render() {
        return h(ReservationsTable, {
          data: page,
          loading: false,
          page: this.pageNum,
          pageSize: 10,
          sortBy: this.sortBy,
          sortDir: this.sortDir
        })
      }
    })

    const wrapper = await mountSuspended(Wrapper)
    const setLocale = (wrapper.vm as unknown as { setLocale: (l: string) => Promise<void> }).setLocale

    await setLocale('en')
    await nextTick()
    await nextTick()
    expect(wrapper.html()).toContain('Guest')

    await setLocale('es')
    await nextTick()
    await nextTick()
    const inSpanish = wrapper.html()
    expect(inSpanish).toContain('Huésped')
    expect(inSpanish).not.toContain('>Guest<')
  })
})
