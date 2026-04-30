import { LoginPage } from '../pages/LoginPage'
import { PropertyDetailPage } from '../pages/PropertyDetailPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ReservationsListPage } from '../pages/ReservationsListPage'
import { SearchPage } from '../pages/SearchPage'

const loginPage = new LoginPage()
const propertyDetailPage = new PropertyDetailPage()
const registerPage = new RegisterPage()
const reservationsListPage = new ReservationsListPage()
const searchPage = new SearchPage()

export interface StripeFailureScenario {
  transactionId: string
  confirmationTokenId: string
  paymentId: string
  paymentIntentId: string
  finalizeError: string
  paymentFailureReason: string
  eventFailureReason: string
  expectedFeedback: string
}

export interface PaymentSummaryFixture {
  payment_id: string
  reservation_id: string
  traveler_id: string
  status: string
  amount_in_cents: number
  currency: string
  receipt_id: string
  receipt_number: string
  property_name: string
  check_in_date: string
  check_out_date: string
}

export const givenSteps = {
  givenIAmOnLogin() {
    loginPage.visit()
  },

  givenIAmOnRegister() {
    registerPage.visit()
  },

  givenIAmOnSearch() {
    searchPage.visit()
  },

  givenIAmOnPropertyDetail(propertyId: string) {
    propertyDetailPage.visit(propertyId)
  },

  givenIAmOnReservationsList() {
    reservationsListPage.visit()
  },

  givenOtpServiceResponds(statusCode = 200, fixture = 'responses/otpSuccess.json') {
    cy.intercept('POST', '**/api/v1/auth/verify-otp', {
      statusCode,
      fixture
    }).as('verifyOtp')
  },

  givenOtpServiceFails(statusCode: number, body: object) {
    cy.intercept('POST', '**/api/v1/auth/verify-otp', {
      statusCode,
      body
    }).as('verifyOtp')
  },

  givenSearchRequestIsTracked() {
    cy.intercept('GET', '**/api/v1/search**').as('searchRequest')
  },

  givenPaymentsConfigIsFakeStripe() {
    cy.intercept('GET', '**/api/v1/payments/config', {
      provider: 'fake_stripe',
      stripe_enabled: false,
      publishable_key: ''
    }).as('getPaymentsConfig')
  },

  givenFakeChargeIsConfirmed(summary: PaymentSummaryFixture) {
    cy.intercept('POST', '**/api/v1/payments/charges', {
      statusCode: 201,
      body: {
        payment_id: summary.payment_id,
        reservation_id: summary.reservation_id,
        status: 'confirmed',
        amount_in_cents: summary.amount_in_cents,
        currency: summary.currency,
        gateway_charge_id: 'ch_cypress_success',
        receipt_id: summary.receipt_id,
        receipt_number: summary.receipt_number,
        failure_reason: null
      }
    }).as('createCharge')

    cy.intercept('GET', `**/api/v1/payments/${summary.payment_id}`, {
      statusCode: 200,
      body: {
        payment_id: summary.payment_id,
        reservation_id: summary.reservation_id,
        status: 'confirmed',
        amount_in_cents: summary.amount_in_cents,
        currency: summary.currency,
        gateway_charge_id: 'ch_cypress_success',
        receipt_id: summary.receipt_id,
        receipt_number: summary.receipt_number,
        failure_reason: null
      }
    }).as('getPayment')

    cy.intercept('GET', `**/api/v1/payments/${summary.payment_id}/events`, {
      statusCode: 200,
      body: [
        {
          event_id: 'evt-payment-succeeded',
          payment_id: summary.payment_id,
          event_type: 'payment.succeeded',
          payload: { receipt_number: summary.receipt_number },
          created_at: '2026-04-12T12:00:00Z'
        }
      ]
    }).as('getPaymentEvents')

    cy.intercept('GET', `**/api/v1/payments/${summary.payment_id}/confirmation`, {
      statusCode: 200,
      body: summary
    }).as('getPaymentConfirmation')
  },

  givenPaymentConfirmationIsAvailable(summary: PaymentSummaryFixture) {
    cy.intercept('GET', `**/api/v1/payments/${summary.payment_id}/confirmation`, {
      statusCode: 200,
      body: summary
    }).as('getPaymentConfirmation')
  },

  givenStripeFailureScenarioIsConfigured(scenario: StripeFailureScenario) {
    cy.intercept('GET', '**/api/v1/payments/config', {
      provider: 'stripe_test',
      stripe_enabled: true,
      publishable_key: 'pk_test_cypress'
    }).as('getPaymentsConfig')

    cy.intercept('POST', '**/api/v1/payments/create-intent', {
      statusCode: 201,
      body: {
        payment_transaction_id: scenario.transactionId,
        amount_in_cents: 287650,
        currency: 'COP',
        publishable_key: 'pk_test_cypress',
        stripe_enabled: true
      }
    }).as('createIntent')

    cy.intercept('POST', '**/api/v1/payments/finalize', (req) => {
      expect(req.body).to.deep.equal({
        payment_transaction_id: scenario.transactionId,
        confirmation_token_id: scenario.confirmationTokenId
      })

      req.reply({
        statusCode: 200,
        body: {
          status: 'failed',
          payment_id: scenario.paymentId,
          payment_intent_id: scenario.paymentIntentId,
          client_secret: null,
          error: scenario.finalizeError
        }
      })
    }).as('finalizePayment')

    cy.intercept('GET', `**/api/v1/payments/${scenario.paymentId}`, {
      statusCode: 200,
      body: {
        payment_id: scenario.paymentId,
        reservation_id: '11111111-1111-1111-1111-111111111111',
        status: 'failed',
        amount_in_cents: 287650,
        currency: 'COP',
        gateway_charge_id: scenario.paymentIntentId,
        receipt_id: null,
        receipt_number: null,
        failure_reason: scenario.paymentFailureReason
      }
    }).as('getFailedPayment')

    cy.intercept('GET', `**/api/v1/payments/${scenario.paymentId}/events`, {
      statusCode: 200,
      body: [
        {
          event_id: `evt-${scenario.paymentId}-failed`,
          payment_id: scenario.paymentId,
          event_type: 'payment.failed',
          payload: { failure_reason: scenario.eventFailureReason },
          created_at: '2026-04-12T12:00:00Z'
        }
      ]
    }).as('getFailedPaymentEvents')
  }
}
