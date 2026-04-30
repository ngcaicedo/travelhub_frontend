import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'
import { buildTraveler, loginAsTraveler, seedUser, type SessionUser } from '../../support/auth'
import { DEMO_PROPERTY_RENAISSANCE } from '../../support/demoData'
import { uniqueDateRange } from '../../support/uniqueDates'

const GUESTS = 2

describe('MPF-31 | Autogestion de reserva (viajero)', () => {
  let traveler: SessionUser
  let reservationId: string

  before(() => {
    seedUser(buildTraveler({ emailPrefix: 'mpf31' })).then((seeded) => {
      traveler = seeded
    })
  })

  before(() => {
    // Crear reserva confirmada via UI completa (mismo flujo que Fase 5)
    const { checkIn, checkOut } = uniqueDateRange(10)

    cy.intercept('POST', '**/api/v1/reservations').as('createReservation')
    loginAsTraveler(traveler)
    givenSteps.givenIAmOnPropertyDetailWithDates(
      DEMO_PROPERTY_RENAISSANCE.id,
      checkIn,
      checkOut,
      GUESTS
    )

    whenSteps.whenIClickReserveOnWidget()
    cy.wait('@createReservation', { timeout: 15000 })
    thenSteps.thenIAmOnCheckoutWithReservation()

    cy.location('search').then((search) => {
      const params = new URLSearchParams(search)
      const id = params.get('reservationId')
      expect(id, 'reservationId in URL').to.be.a('string')
      expect(id).to.have.length.greaterThan(0)
      reservationId = id as string
    })

    whenSteps.whenIPayNowOnCheckout()
    thenSteps.thenIAmOnPaymentConfirmationPage()
  })

  it('previsualiza modificacion de fechas sin mutar la reserva', () => {
    const { checkIn, checkOut } = uniqueDateRange(11)

    // Given: viajero autenticado con reserva confirmada
    loginAsTraveler(traveler)
    givenSteps.givenIAmOnReservationsList()

    // When: abrir modify desde el card
    whenSteps.whenIClickModifyOnReservationCard(reservationId)

    // Then: aterrizar en pagina modify
    thenSteps.thenIAmOnReservationModifyPage(reservationId)

    // When: cambiar fechas y correr preview
    whenSteps.whenIChangeReservationDates(checkIn, checkOut)
    whenSteps.whenIRunModificationPreview()

    // Then: preview indica que el cambio es permitido
    thenSteps.thenTheModificationPreviewIsAllowed()
  })

  it('cancela la reserva confirmada y aterriza en /cancelled', () => {
    // Given: viajero autenticado con reserva confirmada
    loginAsTraveler(traveler)
    givenSteps.givenIAmOnReservationsList()

    // When: abrir cancel desde el card
    whenSteps.whenIClickCancelOnReservationCard(reservationId)

    // Then: pagina de cancelacion con desglose de reembolso
    thenSteps.thenIAmOnReservationCancelPage(reservationId)
    thenSteps.thenISeeRefundBreakdown()

    // When: confirmar cancelacion
    whenSteps.whenIConfirmCancellation()

    // Then: redirect a /cancelled con estado terminal
    thenSteps.thenIAmOnReservationCancelledPage(reservationId)
    thenSteps.thenTheReservationIsCancelled()

    // And: la cancelacion persiste — al volver al listado ya no aparece
    // en proximas y aparece en canceladas con estado terminal
    givenSteps.givenIAmOnReservationsList()
    thenSteps.thenTheReservationIsNotInUpcomingTab(reservationId)
    whenSteps.whenISelectReservationsTab('cancelled')
    thenSteps.thenTheReservationCardHasCancelledStatus(reservationId)
  })
})
