import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'
import {
  buildTraveler,
  demoHotelB,
  loginAs,
  loginAsTraveler,
  seedUser,
  type SessionUser
} from '../../support/auth'
import { DEMO_PROPERTY_ALPINE } from '../../support/demoData'
import { uniqueDateRange } from '../../support/uniqueDates'

const GUESTS = 2

describe('MPF-36 | Confirmar y cancelar reservas (hotel)', () => {
  let traveler: SessionUser
  let reservationToConfirm: string
  let reservationToCancel: string

  before(() => {
    seedUser(buildTraveler({ emailPrefix: 'mpf36' })).then((seeded) => {
      traveler = seeded
    })
  })

  // Crear dos reservas en pending_payment (sin pasar por el pago) para que el
  // backend ofrezca tanto "confirm" como "cancel" en available_actions
  // (frozenset _CONFIRMABLE_STATUSES = {pending_payment, modification_confirmed}).
  function seedPendingReservation(slot: number): Cypress.Chainable<string> {
    const { checkIn, checkOut } = uniqueDateRange(slot)

    cy.intercept('POST', '**/api/v1/reservations').as('createReservation')
    loginAsTraveler(traveler)
    givenSteps.givenIAmOnPropertyDetailWithDates(
      DEMO_PROPERTY_ALPINE.id,
      checkIn,
      checkOut,
      GUESTS
    )

    whenSteps.whenIClickReserveOnWidget()
    cy.wait('@createReservation', { timeout: 15000 })
    thenSteps.thenIAmOnCheckoutWithReservation()

    return cy.location('search').then((search) => {
      const params = new URLSearchParams(search)
      const id = params.get('reservationId')
      expect(id, 'reservationId in URL').to.be.a('string')
      expect(id).to.have.length.greaterThan(0)
      return id as string
    })
  }

  before(() => {
    seedPendingReservation(40).then((id) => {
      reservationToConfirm = id
    })
  })

  before(() => {
    seedPendingReservation(41).then((id) => {
      reservationToCancel = id
    })
  })

  it('hotel B confirma una reserva pendiente y el viajero ve el estado actualizado', () => {
    // Given: hotel B autenticado
    loginAs(demoHotelB)
    whenSteps.whenIVisitHotelReservationDetail(reservationToConfirm)
    thenSteps.thenIAmOnHotelReservationDetail(reservationToConfirm)
    thenSteps.thenTheHotelReservationStatusIs(/^pending_payment$/)

    // When: confirma la reserva desde el detalle
    whenSteps.whenHotelConfirmsReservationFromDetail()

    // Then: el detalle refleja el nuevo estado
    thenSteps.thenISeeHotelReservationActionSuccess()
    thenSteps.thenTheHotelReservationStatusIs(/^confirmed$/)

    // And: el viajero ve la reserva como confirmada en su listado
    loginAsTraveler(traveler)
    givenSteps.givenIAmOnReservationsList()
    thenSteps.thenISeeReservationWithStatus(reservationToConfirm, 'confirmed')
  })

  it('hotel B cancela una reserva pendiente y el viajero la ve en cancelled', () => {
    // Given: hotel B autenticado en el detalle de la reserva a cancelar
    loginAs(demoHotelB)
    whenSteps.whenIVisitHotelReservationDetail(reservationToCancel)
    thenSteps.thenIAmOnHotelReservationDetail(reservationToCancel)
    thenSteps.thenTheHotelReservationStatusIs(/^pending_payment$/)

    // When: cancela la reserva desde el detalle (motivo default = hotel_policy)
    whenSteps.whenHotelCancelsReservationFromDetail()

    // Then: el detalle refleja el cambio de estado
    thenSteps.thenISeeHotelReservationActionSuccess()
    thenSteps.thenTheHotelReservationStatusIs(/^cancelled$/)

    // And: el viajero ya no la ve en upcoming y aparece en cancelled
    loginAsTraveler(traveler)
    givenSteps.givenIAmOnReservationsList()
    thenSteps.thenTheReservationIsNotInUpcomingTab(reservationToCancel)
    whenSteps.whenISelectReservationsTab('cancelled')
    thenSteps.thenTheReservationCardHasCancelledStatus(reservationToCancel)
  })
})
