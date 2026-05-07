import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'
import { buildTraveler, loginAsTraveler, seedUser, type SessionUser } from '../../support/auth'
import { DEMO_PROPERTY_RENAISSANCE } from '../../support/demoData'
import { uniqueDateRange } from '../../support/uniqueDates'

const GUESTS = 2

describe('MPF-29 | Confirmacion de reserva end-to-end', () => {
  let traveler: SessionUser

  before(() => {
    seedUser(buildTraveler({ emailPrefix: 'mpf29' })).then((seeded) => {
      traveler = seeded
    })
  })

  it('busqueda → login redirect → reserva → pago exitoso → confirmacion', () => {
    const { checkIn, checkOut } = uniqueDateRange(0)

    // Given: usuario sin sesion entra a busqueda
    cy.clearCookies()
    cy.clearAllSessionStorage()
    givenSteps.givenIAmOnSearch()

    // When: busca y abre el detalle de la propiedad
    whenSteps.whenISearchProperties({
      city: 'Fiesole',
      checkIn,
      checkOut,
      guests: GUESTS
    })
    whenSteps.whenIOpenSearchResultProperty(DEMO_PROPERTY_RENAISSANCE.id)

    // Then: aterriza en property detail (id codificado por encodePropertyRouteId)
    cy.location('pathname').should('match', /^\/properties\//)
    thenSteps.thenISeeThePropertyName(DEMO_PROPERTY_RENAISSANCE.name)

    // When: intenta reservar sin sesion
    whenSteps.whenIClickReserveOnWidget()

    // Then: redirect al login con redirect query
    cy.location('pathname').should('eq', '/login')
    cy.location('search').should('include', 'redirect=')

    // Given: stub OTP con JWT del traveler seedeado (Cypress no puede leer
    // el correo del codigo OTP)
    cy.intercept('POST', '**/api/v1/auth/verify-otp', {
      statusCode: 200,
      body: {
        access_token: buildJwtForTraveler(traveler),
        token_type: 'bearer',
        role: 'traveler'
      }
    }).as('verifyOtp')

    // When: completa login + OTP
    whenSteps.whenILogInWith(traveler.email, traveler.password)
    whenSteps.whenIEnterTheOtpCode('123456')
    cy.wait('@verifyOtp')

    // Then: regresa a property detail con datos preservados
    cy.location('pathname').should('match', /^\/properties\//)
    cy.location('search').should('include', `check_in=${checkIn}`)

    // When: reserva ahora autenticado
    whenSteps.whenIClickReserveOnWidget()

    // Then: aterriza en checkout con reservationId
    thenSteps.thenIAmOnCheckoutWithReservation()

    // When: pago exitoso (escenario success por defecto en fake_stripe)
    whenSteps.whenIPayNowOnCheckout()

    // Then: pagina de confirmacion
    thenSteps.thenIAmOnPaymentConfirmationPage()
  })

  it('reserva con escenario insufficient muestra fondos insuficientes', () => {
    const { checkIn, checkOut } = uniqueDateRange(1)

    // Given: viajero autenticado con sesion cacheada
    cy.intercept('POST', '**/api/v1/reservations').as('createReservation')
    loginAsTraveler(traveler)
    givenSteps.givenIAmOnPropertyDetailWithDates(
      DEMO_PROPERTY_RENAISSANCE.id,
      checkIn,
      checkOut,
      GUESTS
    )

    // When: reservar y elegir escenario insufficient
    whenSteps.whenIClickReserveOnWidget()
    cy.wait('@createReservation', { timeout: 15000 })
    thenSteps.thenIAmOnCheckoutWithReservation()
    whenSteps.whenISelectCheckoutScenario('insufficient')
    whenSteps.whenIPayNowOnCheckout()

    // Then
    thenSteps.thenISeeCheckoutFeedback('fondos insuficientes')
  })

  it('reserva con escenario declined muestra tarjeta rechazada', () => {
    const { checkIn, checkOut } = uniqueDateRange(2)

    // Given: viajero autenticado con sesion cacheada
    cy.intercept('POST', '**/api/v1/reservations').as('createReservation')
    loginAsTraveler(traveler)
    givenSteps.givenIAmOnPropertyDetailWithDates(
      DEMO_PROPERTY_RENAISSANCE.id,
      checkIn,
      checkOut,
      GUESTS
    )

    // When
    whenSteps.whenIClickReserveOnWidget()
    cy.wait('@createReservation', { timeout: 15000 })
    thenSteps.thenIAmOnCheckoutWithReservation()
    whenSteps.whenISelectCheckoutScenario('declined')
    whenSteps.whenIPayNowOnCheckout()

    // Then
    thenSteps.thenISeeCheckoutFeedback('tarjeta fue rechazada')
  })
})

// Util local para construir un JWT con el sub real del traveler seedeado.
// El backend de security firma con su propia clave; la UI sólo decodifica
// el payload para extraer userId/email/role, por eso un JWT no firmado sirve.
function buildJwtForTraveler(user: SessionUser): string {
  const encode = (value: string) =>
    btoa(value).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  const header = encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = encode(JSON.stringify({
    sub: user.userId,
    email: user.email,
    role: user.role
  }))
  return `${header}.${payload}.cypress-signature`
}
