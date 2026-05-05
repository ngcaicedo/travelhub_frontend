import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'
import { buildTraveler, loginAsTraveler, seedUser, type SessionUser } from '../../support/auth'
import {
  DEMO_PROPERTY_ALPINE,
  DEMO_PROPERTY_RENAISSANCE
} from '../../support/demoData'
import { seedReservation, type SeededReservation } from '../../support/reservationsApi'

describe('MPF-28 | Consultar reservas del viajero', () => {
  let traveler: SessionUser
  let renaissanceReservation: SeededReservation
  let alpineReservation: SeededReservation

  before(() => {
    seedUser(buildTraveler({ emailPrefix: 'mpf28' })).then((seeded) => {
      traveler = seeded
      cy.wrap(traveler.userId, { log: false }).should('be.a', 'string')

      seedReservation({
        travelerId: traveler.userId!,
        propertyId: DEMO_PROPERTY_RENAISSANCE.id,
        checkInDate: '2026-12-10',
        checkOutDate: '2026-12-12',
        guests: 2,
        currency: 'COP'
      }).then((reservation) => {
        renaissanceReservation = reservation
      })

      seedReservation({
        travelerId: traveler.userId!,
        propertyId: DEMO_PROPERTY_ALPINE.id,
        checkInDate: '2026-11-10',
        checkOutDate: '2026-11-13',
        guests: 3,
        currency: 'EUR'
      }).then((reservation) => {
        alpineReservation = reservation
      })
    })
  })

  beforeEach(() => {
    // Given: viajero autenticado con sesion cacheada
    loginAsTraveler(traveler)
  })

  it('lista las reservas del viajero con su estado', () => {
    // Given
    givenSteps.givenIAmOnReservationsList()

    // Then
    thenSteps.thenISeeReservationCount(2)
    thenSteps.thenISeeReservationWithStatus(renaissanceReservation.id, 'pending_payment')
    thenSteps.thenISeeReservationWithStatus(alpineReservation.id, 'pending_payment')
    thenSteps.thenTheReservationCardContains(
      renaissanceReservation.id,
      DEMO_PROPERTY_RENAISSANCE.name
    )
    thenSteps.thenTheReservationCardContains(
      alpineReservation.id,
      DEMO_PROPERTY_ALPINE.name
    )
  })

  it('permite cambiar entre las pestanas upcoming y cancelled', () => {
    // Given
    givenSteps.givenIAmOnReservationsList()
    thenSteps.thenISeeReservationCount(2)

    // When
    whenSteps.whenISelectReservationsTab('cancelled')

    // Then: ambas reservas seedeadas estan en pending_payment, no cancelled
    thenSteps.thenISeeReservationCount(0)

    // When: volver a upcoming
    whenSteps.whenISelectReservationsTab('upcoming')

    // Then
    thenSteps.thenISeeReservationCount(2)
  })
})
