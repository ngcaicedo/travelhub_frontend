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
const DASHBOARD_RANGE_START = '2026-01-01'
const DASHBOARD_RANGE_END = '2026-12-31'

describe('MPF-37 | Detalle de reserva (hotel)', () => {
  let traveler: SessionUser
  let reservationId: string
  const reservationDates = { checkIn: '', checkOut: '' }

  before(() => {
    seedUser(buildTraveler({ emailPrefix: 'mpf37' })).then((seeded) => {
      traveler = seeded
    })
  })

  // Crear una reserva real contra DEMO_PROPERTY_ALPINE (owner = DEMO_HOTEL_B)
  // via UI completa (search → reserve → checkout success) para que el detalle
  // del lado hotel tenga datos reales (huesped, fechas, pago).
  before(() => {
    const { checkIn, checkOut } = uniqueDateRange(30)
    reservationDates.checkIn = checkIn
    reservationDates.checkOut = checkOut

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

  it('hotel B abre el detalle de la reserva desde el dashboard y ve toda la info', () => {
    // Given: hotel B autenticado en su dashboard con la reserva en la tabla
    loginAs(demoHotelB)
    givenSteps.givenIAmOnHotelDashboard()
    thenSteps.thenIAmOnHotelDashboard()
    whenSteps.whenIApplyHotelDashboardDateRange(DASHBOARD_RANGE_START, DASHBOARD_RANGE_END)
    thenSteps.thenTheHotelDashboardListsReservation(reservationId)

    // When: abre el detalle desde el chevron de la fila
    whenSteps.whenIOpenHotelReservationDetail(reservationId)

    // Then: aterriza en /hotel/reservations/:id con la info correcta
    thenSteps.thenIAmOnHotelReservationDetail(reservationId)
    thenSteps.thenISeeHotelReservationGuest(traveler.fullName, traveler.email)
    thenSteps.thenISeeHotelReservationDates(reservationDates.checkIn, reservationDates.checkOut)
    thenSteps.thenISeeHotelReservationGuests(GUESTS)
    thenSteps.thenISeeHotelReservationStatus(/^(pending|confirmed|payment_completed)$/)
    thenSteps.thenISeeHotelReservationPaymentBreakdown()
  })
})
