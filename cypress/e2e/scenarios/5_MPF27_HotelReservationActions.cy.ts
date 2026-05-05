function buildJwt(payload: Record<string, unknown>) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encode = (value: unknown) => btoa(JSON.stringify(value))
  return `${encode(header)}.${encode(payload)}.signature`
}

function setHotelSession() {
  const token = buildJwt({
    sub: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    email: 'hotel-a@travelhub.demo',
    role: 'hotel',
  })

  cy.setCookie('auth_token', token)
}

function stubDashboardRequests() {
  cy.intercept('GET', '**/api/v1/reservations/host/me', (req) => {
    const sortDir = req.query.sort_dir
    const statuses = req.query.status
    const normalizedStatuses = Array.isArray(statuses)
      ? statuses
      : typeof statuses === 'string'
        ? [statuses]
        : []
    const isConfirmedBounds =
      normalizedStatuses.includes('confirmed') || normalizedStatuses.includes('modification_confirmed')

    if (isConfirmedBounds && sortDir === 'asc') {
      req.reply({
        statusCode: 200,
        body: {
          items: [
            {
              id: 'confirmed-early',
              reservation_number: 'EARLY-1',
              id_property: 'prop-1',
              id_room: 'room-1',
              id_traveler: 'trav-early',
              guest_full_name: 'Early Guest',
              room_type: 'Suite Deluxe',
              check_in_date: '2026-08-01T00:00:00.000Z',
              check_out_date: '2026-08-03T00:00:00.000Z',
              number_of_guests: 2,
              total_price: '300.00',
              currency: 'COP',
              status: 'confirmed',
              created_at: '2026-07-20T00:00:00.000Z',
              available_actions: [{ action: 'cancel', label: 'Cancelar reserva' }],
            },
          ],
          total: 1,
          page: 1,
          page_size: 1,
        },
      })
      return
    }

    if (isConfirmedBounds && sortDir === 'desc') {
      req.reply({
        statusCode: 200,
        body: {
          items: [
            {
              id: 'confirmed-late',
              reservation_number: 'LATE-1',
              id_property: 'prop-1',
              id_room: 'room-2',
              id_traveler: 'trav-late',
              guest_full_name: 'Late Guest',
              room_type: 'Suite Deluxe',
              check_in_date: '2026-12-15T00:00:00.000Z',
              check_out_date: '2026-12-17T00:00:00.000Z',
              number_of_guests: 2,
              total_price: '420.00',
              currency: 'COP',
              status: 'confirmed',
              created_at: '2026-12-01T00:00:00.000Z',
              available_actions: [{ action: 'cancel', label: 'Cancelar reserva' }],
            },
          ],
          total: 1,
          page: 1,
          page_size: 1,
        },
      })
      return
    }

    req.reply({
      statusCode: 200,
      body: {
        items: [
          {
            id: 'res-pending',
            reservation_number: 'RES-PENDING',
            id_property: 'prop-1',
            id_room: 'room-pending',
            id_traveler: 'trav-1',
            guest_full_name: 'Ana Pendiente',
            room_type: 'Suite Deluxe',
            check_in_date: '2026-10-12T00:00:00.000Z',
            check_out_date: '2026-10-15T00:00:00.000Z',
            number_of_guests: 2,
            total_price: '357.00',
            currency: 'COP',
            status: 'pending_payment',
            created_at: '2026-10-11T00:00:00.000Z',
            available_actions: [
              { action: 'confirm', label: 'Confirmar reserva' },
              { action: 'cancel', label: 'Cancelar reserva' },
            ],
          },
          {
            id: 'res-mod',
            reservation_number: 'RES-MOD',
            id_property: 'prop-1',
            id_room: 'room-mod',
            id_traveler: 'trav-2',
            guest_full_name: 'Bruno Modificado',
            room_type: 'Suite Junior',
            check_in_date: '2026-11-02T00:00:00.000Z',
            check_out_date: '2026-11-05T00:00:00.000Z',
            number_of_guests: 2,
            total_price: '410.00',
            currency: 'COP',
            status: 'modification_confirmed',
            created_at: '2026-11-01T00:00:00.000Z',
            available_actions: [
              { action: 'confirm', label: 'Confirmar reserva' },
              { action: 'cancel', label: 'Cancelar reserva' },
            ],
          },
          {
            id: 'res-completed',
            reservation_number: 'RES-COMP',
            id_property: 'prop-1',
            id_room: 'room-completed',
            id_traveler: 'trav-3',
            guest_full_name: 'Carla Completada',
            room_type: 'Suite Master',
            check_in_date: '2026-09-01T00:00:00.000Z',
            check_out_date: '2026-09-03T00:00:00.000Z',
            number_of_guests: 2,
            total_price: '520.00',
            currency: 'COP',
            status: 'completed',
            created_at: '2026-08-20T00:00:00.000Z',
            available_actions: [],
          },
        ],
        total: 3,
        page: 1,
        page_size: 10,
      },
    })
  }).as('hostReservations')

  cy.intercept('GET', '**/api/v1/reservations/host/me/metrics**', {
    statusCode: 200,
    body: {
      active_reservations: 2,
      occupancy_rate: 0.5,
      revenue_amount: '767.00',
      revenue_currency: 'COP',
      available_currencies: ['COP'],
      average_daily_rate: '191.75',
      total_nights: 4,
    },
  }).as('hostMetrics')

  cy.intercept('GET', '**/api/v1/reservations/host/me/revenue-trends**', {
    statusCode: 200,
    body: {
      granularity: 'week',
      currency: 'COP',
      available_currencies: ['COP'],
      buckets: [
        { bucket: '2026-08-01T00:00:00.000Z', revenue: '300.00', reservations: 1 },
        { bucket: '2026-12-15T00:00:00.000Z', revenue: '420.00', reservations: 1 },
      ],
    },
  }).as('hostRevenueTrends')
}

describe('MPF-27 | Confirmar y cancelar reservas desde hotel', () => {
  beforeEach(() => {
    setHotelSession()
  })

  it('muestra acciones consistentes en dashboard y confirma una reserva pendiente desde el detalle', () => {
    stubDashboardRequests()

    cy.intercept('GET', '**/api/v1/hotel/reservations/res-pending', {
      statusCode: 200,
      body: {
        reservation: {
          id: 'res-pending',
          id_traveler: 'trav-1',
          id_property: 'prop-1',
          id_room: 'Suite Deluxe',
          check_in_date: '2026-10-12T00:00:00.000Z',
          check_out_date: '2026-10-15T00:00:00.000Z',
          number_of_guests: 2,
          total_price: '357.00',
          currency: 'COP',
          status: 'pending_payment',
          hold_expires_at: '2026-10-11T00:15:00.000Z',
          version: 1,
          created_at: '2026-10-11T00:00:00.000Z',
          updated_at: '2026-10-11T00:00:00.000Z',
          price_breakdown: null,
        },
        guest: {
          id: 'trav-1',
          full_name: 'Ana Pendiente',
          email: 'ana@example.com',
          phone: '+573001112233',
        },
        change_history: [],
        internal_notes: [],
        available_actions: [
          { action: 'confirm', label: 'Confirmar reserva' },
          { action: 'cancel', label: 'Cancelar reserva' },
        ],
      },
    }).as('getPendingReservationDetail')

    cy.intercept('POST', '**/api/v1/hotel/reservations/res-pending/confirm', (req) => {
      expect(req.body.reason).to.match(/manual hotel confirmation|confirmación manual del hotel|confirmação manual do hotel/i)
      expect(req.body.locale).to.be.a('string')
      req.reply({
        statusCode: 200,
        body: {
          reservation: {
            id: 'res-pending',
            id_property: 'prop-1',
            status: 'confirmed',
            total_price: '357.00',
            currency: 'COP',
            check_in_date: '2026-10-12T00:00:00.000Z',
            check_out_date: '2026-10-15T00:00:00.000Z',
            hold_expires_at: '2026-10-11T00:15:00.000Z',
            created_at: '2026-10-11T00:00:00.000Z',
          },
          status_before: 'pending_payment',
          status_after: 'confirmed',
          action_applied: 'confirmed',
          reason: req.body.reason,
          refund_requested: false,
        },
      })
    }).as('confirmPendingReservation')

    cy.visit('/hotel/dashboard')
    cy.wait('@hostReservations')
    cy.wait('@hostReservations')
    cy.wait('@hostReservations')
    cy.wait('@hostMetrics')
    cy.wait('@hostRevenueTrends')

    cy.contains(/Modificación confirmada|Modification confirmed|Modificação confirmada/i).should('be.visible')
    cy.get('input[type="date"]').first().should('have.value', '2026-08-01')
    cy.get('input[type="date"]').eq(1).should('have.value', '2026-12-17')

    cy.contains('Ana Pendiente')
      .closest('tr')
      .within(() => {
        cy.contains('button', /Confirmar reserva|Confirm reservation/i).should('not.exist')
      })

    cy.get('[data-cy="hotel-row-view-detail"][data-cy-reservation-id="res-pending"]').click()
    cy.wait('@getPendingReservationDetail')
    cy.contains('button', /Confirmar reserva|Confirm reservation/i).click()

    cy.wait('@confirmPendingReservation')
    cy.contains(/La reserva fue confirmada|reservation was confirmed|reserva foi confirmada/i).should('be.visible')
  })

  it('permite cancelar desde el detalle con motivo y nota adicional', () => {
    cy.intercept('GET', '**/api/v1/hotel/reservations/res-mod', {
      statusCode: 200,
      body: {
        reservation: {
          id: 'res-mod',
          id_traveler: 'trav-2',
          id_property: 'prop-1',
          id_room: 'Suite Junior',
          check_in_date: '2026-11-02T00:00:00.000Z',
          check_out_date: '2026-11-05T00:00:00.000Z',
          number_of_guests: 2,
          total_price: '410.00',
          currency: 'COP',
          status: 'modification_confirmed',
          hold_expires_at: '2026-11-01T00:15:00.000Z',
          version: 3,
          created_at: '2026-11-01T00:00:00.000Z',
          updated_at: '2026-11-01T00:00:00.000Z',
          price_breakdown: null,
        },
        guest: {
          id: 'trav-2',
          full_name: 'Bruno Modificado',
          email: 'bruno@example.com',
          phone: '+573001112233',
        },
        change_history: [
          {
            id: 'evt-1',
            reservation_id: 'res-mod',
            action: 'hotel.confirm',
            previous_status: 'pending_payment',
            new_status: 'modification_confirmed',
            reason: 'hotel_confirmation',
            actor_user_id: 'hotel-1',
            source_ip: '192.168.0.10',
            created_at: '2026-11-01T00:00:00.000Z',
          },
        ],
        internal_notes: [],
        available_actions: [
          { action: 'confirm', label: 'Confirmar reserva' },
          { action: 'cancel', label: 'Cancelar reserva' },
        ],
      },
    }).as('getHostReservationDetail')

    cy.intercept('POST', '**/api/v1/hotel/reservations/res-mod/cancel', (req) => {
      expect(req.body.reason).to.equal('maintenance')
      expect(req.body.note).to.contain('tubería principal')
      expect(req.body.locale).to.be.a('string')
      req.reply({
        statusCode: 200,
        body: {
          reservation: {
            id: 'res-mod',
            id_property: 'prop-1',
            status: 'cancelled',
            total_price: '410.00',
            currency: 'COP',
            check_in_date: '2026-11-02T00:00:00.000Z',
            check_out_date: '2026-11-05T00:00:00.000Z',
            hold_expires_at: '2026-11-01T00:15:00.000Z',
            created_at: '2026-11-01T00:00:00.000Z',
          },
          status_before: 'modification_confirmed',
          status_after: 'cancelled',
          action_applied: 'cancelled',
          reason: 'maintenance',
          refund_requested: false,
        },
      })
    }).as('cancelReservationFromDetail')

    cy.visit('/hotel/reservations/res-mod')
    cy.wait('@getHostReservationDetail')

    cy.contains('button', /Cancelar reserva|Cancel reservation/i)
      .should('be.visible')
      .click()

    cy.get('[data-testid="detail-cancel-reason-select"]').click()
    cy.contains('maintenance').click({ force: true })
    cy.get('[data-testid="detail-cancel-note-textarea"]').should('be.visible')
    cy.get('textarea').clear().type('Se dañó la tubería principal')
    cy.contains('button', /Proceder|Proceed|Prosseguir/i).click()

    cy.wait('@cancelReservationFromDetail')
  })
})
