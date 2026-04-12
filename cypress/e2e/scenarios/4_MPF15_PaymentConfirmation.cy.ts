import { CheckoutPage } from '../../pages/CheckoutPage'
import { PaymentConfirmationPage } from '../../pages/PaymentConfirmationPage'

const checkoutPage = new CheckoutPage()
const paymentConfirmationPage = new PaymentConfirmationPage()

const paymentSummary = {
  payment_id: 'pay-confirmed-cypress',
  reservation_id: '11111111-1111-1111-1111-111111111111',
  traveler_id: '22222222-2222-2222-2222-222222222222',
  status: 'confirmed',
  amount_in_cents: 287650,
  currency: 'COP',
  receipt_id: 'receipt-001',
  receipt_number: 'REC-001',
  property_name: 'Renaissance Estate & Private Vineyard',
  check_in_date: '2026-10-12',
  check_out_date: '2026-10-17'
}

describe('MPF-15 | Confirmacion del pago', () => {
  it('redirige desde checkout a la confirmacion y muestra el comprobante', () => {
    cy.intercept('GET', '**/api/payments/config', {
      provider: 'fake_stripe',
      stripe_enabled: false,
      publishable_key: ''
    }).as('getPaymentsConfig')

    cy.intercept('POST', '**/api/payments/charges', {
      statusCode: 201,
      body: {
        payment_id: 'pay-confirmed-cypress',
        reservation_id: '11111111-1111-1111-1111-111111111111',
        status: 'confirmed',
        amount_in_cents: 287650,
        currency: 'COP',
        gateway_charge_id: 'ch_cypress_success',
        receipt_id: 'receipt-001',
        receipt_number: 'REC-001',
        failure_reason: null
      }
    }).as('createCharge')

    cy.intercept('GET', '**/api/payments/pay-confirmed-cypress', {
      statusCode: 200,
      body: {
        payment_id: 'pay-confirmed-cypress',
        reservation_id: '11111111-1111-1111-1111-111111111111',
        status: 'confirmed',
        amount_in_cents: 287650,
        currency: 'COP',
        gateway_charge_id: 'ch_cypress_success',
        receipt_id: 'receipt-001',
        receipt_number: 'REC-001',
        failure_reason: null
      }
    }).as('getPayment')

    cy.intercept('GET', '**/api/payments/pay-confirmed-cypress/events', {
      statusCode: 200,
      body: [
        {
          event_id: 'evt-payment-succeeded',
          payment_id: 'pay-confirmed-cypress',
          event_type: 'payment.succeeded',
          payload: {
            receipt_number: 'REC-001'
          },
          created_at: '2026-04-12T12:00:00Z'
        }
      ]
    }).as('getPaymentEvents')

    cy.intercept('GET', '**/api/v1/payments/pay-confirmed-cypress/confirmation', {
      statusCode: 200,
      body: paymentSummary
    }).as('getPaymentConfirmation')

    checkoutPage.visit()
    checkoutPage.clickPayNow()

    cy.wait('@createCharge')
    cy.wait('@getPayment')
    cy.wait('@getPaymentEvents')
    cy.wait('@getPaymentConfirmation')

    cy.url().should('include', '/notifications/payment-confirmation?paymentId=pay-confirmed-cypress')
    paymentConfirmationPage.title().should('contain.text', 'Reserva confirmada')
    paymentConfirmationPage.reservationId().should('contain.text', paymentSummary.reservation_id)
    cy.contains(paymentSummary.property_name).should('be.visible')
    cy.contains('REC-001').should('be.visible')
  })

  it('permite navegar a mis reservas desde la confirmacion', () => {
    cy.intercept('GET', '**/api/v1/payments/pay-confirmed-cypress/confirmation', {
      statusCode: 200,
      body: paymentSummary
    }).as('getPaymentConfirmation')

    paymentConfirmationPage.visit('pay-confirmed-cypress')
    cy.wait('@getPaymentConfirmation')

    paymentConfirmationPage.clickViewReservations()
    cy.url().should('include', '/reservations')
  })
})
