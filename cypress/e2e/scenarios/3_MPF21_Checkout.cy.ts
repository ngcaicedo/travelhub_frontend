import { CheckoutPage } from '../../pages/CheckoutPage'

const checkoutPage = new CheckoutPage()

function stubStripeClient(win: Cypress.AUTWindow) {
  const stripeWindow = win as Cypress.AUTWindow & {
    Stripe?: () => {
      elements: () => {
        submit: () => Promise<Record<string, never>>
        create: () => {
          mount: () => void
          unmount: () => void
          destroy: () => void
        }
      }
      createConfirmationToken: () => Promise<{ confirmationToken: { id: string } }>
      handleNextAction: () => Promise<Record<string, never>>
    }
  }

  stripeWindow.Stripe = () => ({
    elements: () => ({
      submit: async () => ({}),
      create: () => ({
        mount: () => {},
        unmount: () => {},
        destroy: () => {}
      })
    }),
    createConfirmationToken: async () => ({
      confirmationToken: { id: 'ctoken_cypress_insufficient' }
    }),
    handleNextAction: async () => ({})
  })
}

describe('MPF-21 | Checkout seguro y tokenizacion', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/payments/config', {
      provider: 'stripe_test',
      stripe_enabled: true,
      publishable_key: 'pk_test_cypress'
    }).as('getPaymentsConfig')

    cy.intercept('POST', '**/api/payments/create-intent', {
      statusCode: 201,
      body: {
        payment_transaction_id: 'txn-stripe-insufficient',
        amount_in_cents: 287650,
        currency: 'COP',
        publishable_key: 'pk_test_cypress',
        stripe_enabled: true
      }
    }).as('createIntent')

    cy.intercept('POST', '**/api/payments/finalize', (req) => {
      expect(req.body).to.have.keys(['payment_transaction_id', 'confirmation_token_id'])
      expect(req.body).to.have.property('payment_transaction_id', 'txn-stripe-insufficient')
      expect(req.body).to.have.property('confirmation_token_id', 'ctoken_cypress_insufficient')
      expect(req.body).not.to.have.property('card_number')
      expect(req.body).not.to.have.property('cvv')
      expect(req.body).not.to.have.property('expiration')

      req.reply({
        statusCode: 200,
        body: {
          status: 'failed',
          payment_id: 'pay-stripe-insufficient',
          payment_intent_id: 'pi_stripe_insufficient',
          client_secret: null,
          error: 'insufficient_funds'
        }
      })
    }).as('finalizePayment')

    cy.intercept('GET', '**/api/payments/pay-stripe-insufficient', {
      statusCode: 200,
      body: {
        payment_id: 'pay-stripe-insufficient',
        reservation_id: '11111111-1111-1111-1111-111111111111',
        status: 'failed',
        amount_in_cents: 287650,
        currency: 'COP',
        gateway_charge_id: 'pi_stripe_insufficient',
        receipt_id: null,
        receipt_number: null,
        failure_reason: 'card_declined'
      }
    }).as('getFailedPayment')

    cy.intercept('GET', '**/api/payments/pay-stripe-insufficient/events', {
      statusCode: 200,
      body: [
        {
          event_id: 'evt-payment-failed',
          payment_id: 'pay-stripe-insufficient',
          event_type: 'payment.failed',
          payload: {
            failure_reason: 'insufficient_funds'
          },
          created_at: '2026-04-12T12:00:00Z'
        }
      ]
    }).as('getFailedPaymentEvents')
  })

  it('usa Stripe en modo seguro y muestra el mensaje de fondos insuficientes', () => {
    checkoutPage.visit({
      onBeforeLoad(win) {
        stubStripeClient(win)
      }
    })

    checkoutPage.manualCardNumberField().should('not.exist')
    checkoutPage.manualTokenField().should('not.exist')
    checkoutPage.secureElement().should('exist')

    checkoutPage.clickPayNow()

    cy.wait('@createIntent')
    cy.wait('@finalizePayment')
    cy.wait('@getFailedPayment')
    cy.wait('@getFailedPaymentEvents')

    checkoutPage.feedback().should('contain.text', 'fondos insuficientes')
  })
})
