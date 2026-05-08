import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'
import { demoHotelA, loginAsHotelPartner } from '../../support/auth'

function stubDashboardRequests() {
  cy.intercept('GET', '**/api/v1/reservations/host/me**', {
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
            { action: 'cancel', label: 'Cancelar reserva' }
          ]
        },
        {
          id: 'res-confirmed',
          reservation_number: 'RES-CONF',
          id_property: 'prop-1',
          id_room: 'room-confirmed',
          id_traveler: 'trav-2',
          guest_full_name: 'Bruno Confirmado',
          room_type: 'Suite Junior',
          check_in_date: '2026-11-02T00:00:00.000Z',
          check_out_date: '2026-11-05T00:00:00.000Z',
          number_of_guests: 2,
          total_price: '410.00',
          currency: 'COP',
          status: 'confirmed',
          created_at: '2026-11-01T00:00:00.000Z',
          available_actions: [{ action: 'cancel', label: 'Cancelar reserva' }]
        }
      ],
      total: 2,
      page: 1,
      page_size: 10
    }
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
      total_nights: 4
    }
  }).as('hostMetrics')

  cy.intercept('GET', '**/api/v1/reservations/host/me/revenue-trends**', {
    statusCode: 200,
    body: {
      granularity: 'day',
      currency: 'COP',
      available_currencies: ['COP'],
      buckets: [{ bucket: '2026-10-12T00:00:00.000Z', revenue: '357.00', reservations: 1 }]
    }
  }).as('hostRevenueTrends')
}

function stubPendingReservationDetail() {
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
        price_breakdown: null
      },
      guest: {
        id: 'trav-1',
        full_name: 'Ana Pendiente',
        email: 'ana@example.com',
        phone: '+573001112233'
      },
      change_history: [],
      internal_notes: [],
      available_actions: [
        { action: 'confirm', label: 'Confirmar reserva' },
        { action: 'cancel', label: 'Cancelar reserva' }
      ]
    }
  }).as('getPendingReservationDetail')
}

function stubConfirmedReservationDetail() {
  cy.intercept('GET', '**/api/v1/hotel/reservations/res-confirmed', {
    statusCode: 200,
    body: {
      reservation: {
        id: 'res-confirmed',
        id_traveler: 'trav-2',
        id_property: 'prop-1',
        id_room: 'Suite Junior',
        check_in_date: '2026-11-02T00:00:00.000Z',
        check_out_date: '2026-11-05T00:00:00.000Z',
        number_of_guests: 2,
        total_price: '410.00',
        currency: 'COP',
        status: 'confirmed',
        hold_expires_at: '2026-11-01T00:15:00.000Z',
        version: 3,
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T00:00:00.000Z',
        price_breakdown: null
      },
      guest: {
        id: 'trav-2',
        full_name: 'Bruno Confirmado',
        email: 'bruno@example.com',
        phone: '+573001112233'
      },
      change_history: [],
      internal_notes: [],
      available_actions: [{ action: 'cancel', label: 'Cancelar reserva' }]
    }
  }).as('getConfirmedReservationDetail')
}

describe('MPF-27 | Confirmar y cancelar reservas desde hotel', () => {
  beforeEach(() => {
    loginAsHotelPartner(demoHotelA)
  })

  it('permite confirmar una reserva pendiente desde el detalle', () => {
    // Given: hotel A ve una reserva pendiente en su dashboard
    stubDashboardRequests()
    stubPendingReservationDetail()

    cy.intercept('POST', '**/api/v1/hotel/reservations/res-pending/confirm', {
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
          created_at: '2026-10-11T00:00:00.000Z'
        },
        status_before: 'pending_payment',
        status_after: 'confirmed',
        action_applied: 'confirmed',
        reason: 'manual hotel confirmation',
        refund_requested: false
      }
    }).as('confirmPendingReservation')

    givenSteps.givenIAmOnHotelDashboard()
    thenSteps.thenIAmOnHotelDashboard()
    cy.wait('@hostReservations')
    cy.wait('@hostMetrics')
    cy.wait('@hostRevenueTrends')

    cy.get('[data-cy=hotel-reservation-row][data-cy-reservation-id="res-pending"]')
      .within(() => {
        cy.contains('button', /Confirmar reserva|Confirm reservation/i).should('not.exist')
      })

    // When: abre el detalle y confirma la reserva
    whenSteps.whenIOpenHotelReservationDetail('res-pending')
    cy.wait('@getPendingReservationDetail')
    whenSteps.whenHotelConfirmsReservationFromDetail()
    cy.wait('@confirmPendingReservation')

    // Then: el hotel ve confirmación de éxito
    thenSteps.thenISeeHotelReservationActionSuccess()
  })

  it('permite cancelar una reserva desde el detalle con motivo y nota', () => {
    // Given: hotel A abre el detalle de una reserva confirmada
    stubConfirmedReservationDetail()

    cy.intercept('POST', '**/api/v1/hotel/reservations/res-confirmed/cancel', {
      statusCode: 200,
      body: {
        reservation: {
          id: 'res-confirmed',
          id_property: 'prop-1',
          status: 'cancelled',
          total_price: '410.00',
          currency: 'COP',
          check_in_date: '2026-11-02T00:00:00.000Z',
          check_out_date: '2026-11-05T00:00:00.000Z',
          hold_expires_at: '2026-11-01T00:15:00.000Z',
          created_at: '2026-11-01T00:00:00.000Z'
        },
        status_before: 'confirmed',
        status_after: 'cancelled',
        action_applied: 'cancelled',
        reason: 'hotel_policy',
        refund_requested: false
      }
    }).as('cancelReservationFromDetail')

    whenSteps.whenIVisitHotelReservationDetail('res-confirmed')
    cy.wait('@getConfirmedReservationDetail')
    thenSteps.thenIAmOnHotelReservationDetail('res-confirmed')

    // When: abre el modal, registra una nota y cancela la reserva
    cy.get('[data-cy=hotel-detail-action-cancel]').click({ force: true })
    cy.get('[data-testid="detail-cancel-note-textarea"]').type('Se dañó la tubería principal')
    cy.get('[data-cy=hotel-detail-cancel-modal-proceed]').click({ force: true })
    cy.wait('@cancelReservationFromDetail')

    // Then: el hotel ve confirmación de éxito
    thenSteps.thenISeeHotelReservationActionSuccess()
  })
})