import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'
import {
  buildTraveler,
  demoHotelA,
  loginAs,
  loginAsTraveler,
  seedUser,
  type SessionUser
} from '../../support/auth'
import { DEMO_PROPERTY_BEACHFRONT } from '../../support/demoData'
import { uniqueDateRange } from '../../support/uniqueDates'

const GUESTS = 2
// Rango de fechas amplio que cubre TODAS las ventanas de seed (2026 entero).
// El dashboard del hotel filtra por defecto a ultimos 30 dias y nuestras
// reservas E2E caen en meses futuros, por eso ampliamos el rango via UI.
const DASHBOARD_RANGE_START = '2026-01-01'
const DASHBOARD_RANGE_END = '2026-12-31'

describe('MPF-35 | Dashboard de reservas (hotel)', () => {
  let traveler: SessionUser
  const reservationIds: string[] = []

  before(() => {
    seedUser(buildTraveler({ emailPrefix: 'mpf35' })).then((seeded) => {
      traveler = seeded
    })
  })

  function createReservationAgainstHotelA(slot: number) {
    const { checkIn, checkOut } = uniqueDateRange(slot)

    cy.intercept('POST', '**/api/v1/reservations').as('createReservation')
    loginAsTraveler(traveler)
    givenSteps.givenIAmOnPropertyDetailWithDates(
      DEMO_PROPERTY_BEACHFRONT.id,
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
      expect(id).to.have.length.greaterThan(0)
      reservationIds.push(id as string)
    })

    whenSteps.whenIPayNowOnCheckout()
    thenSteps.thenIAmOnPaymentConfirmationPage()
  }

  // Crear 2 reservas reales contra DEMO_PROPERTY_RENAISSANCE (owner = DEMO_HOTEL_A)
  // para que el dashboard del hotel A tenga datos en KPIs y tabla.
  before(() => createReservationAgainstHotelA(20))
  before(() => createReservationAgainstHotelA(21))

  it('hotel A ve KPIs y las reservas creadas tras ampliar el rango de fechas', () => {
    // Given: hotel A autenticado
    loginAs(demoHotelA)
    givenSteps.givenIAmOnHotelDashboard()
    thenSteps.thenIAmOnHotelDashboard()

    // When: amplia el rango para cubrir las fechas futuras de las reservas
    whenSteps.whenIApplyHotelDashboardDateRange(DASHBOARD_RANGE_START, DASHBOARD_RANGE_END)

    // Then: KPIs visibles y tabla con ambas reservas
    thenSteps.thenISeeAllHotelKpis()
    thenSteps.thenTheHotelDashboardListsReservation(reservationIds[0]!)
    thenSteps.thenTheHotelDashboardListsReservation(reservationIds[1]!)
  })
})
