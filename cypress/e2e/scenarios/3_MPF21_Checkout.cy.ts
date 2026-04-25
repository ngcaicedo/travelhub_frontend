type FailureScenario = {
  transactionId: string
  confirmationTokenId: string
  paymentId: string
  paymentIntentId: string
  finalizeError: string
  paymentFailureReason: string
  eventFailureReason: string
  expectedFeedback: string
}

function stubStripeClient(win: Cypress.AUTWindow, confirmationTokenId: string) {
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
      confirmationToken: { id: confirmationTokenId }
    }),
    handleNextAction: async () => ({})
  })
}

function registerStripeFailureScenario(scenario: FailureScenario) {
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
        payload: {
          failure_reason: scenario.eventFailureReason
        },
        created_at: '2026-04-12T12:00:00Z'
      }
    ]
  }).as('getFailedPaymentEvents')
}

function runStripeFailureScenario(scenario: FailureScenario) {
  cy.visit('/checkout', {
    onBeforeLoad(win) {
      stubStripeClient(win, scenario.confirmationTokenId)
    }
  })

  cy.wait('@getPaymentsConfig')

  cy.get('[data-cy=checkout-card-number]').should('not.exist')
  cy.get('[data-cy=checkout-token]').should('not.exist')
  cy.get('[data-cy=checkout-stripe-element]').should('exist')

  cy.get('[data-cy=checkout-pay-now]').click()

  cy.wait('@createIntent')
  cy.wait('@finalizePayment')
  cy.wait('@getFailedPayment')
  cy.wait('@getFailedPaymentEvents')

  cy.get('[data-cy=checkout-feedback]')
    .should('contain.text', scenario.expectedFeedback)
}

describe('MPF-21 | Checkout seguro y tokenizacion', () => {
  it('usa Stripe en modo seguro y muestra el mensaje de fondos insuficientes', () => {
    registerStripeFailureScenario({
      transactionId: 'txn-stripe-insufficient',
      confirmationTokenId: 'ctoken_cypress_insufficient',
      paymentId: 'pay-stripe-insufficient',
      paymentIntentId: 'pi_stripe_insufficient',
      finalizeError: 'insufficient_funds',
      paymentFailureReason: 'card_declined',
      eventFailureReason: 'insufficient_funds',
      expectedFeedback: 'fondos insuficientes'
    })

    runStripeFailureScenario({
      transactionId: 'txn-stripe-insufficient',
      confirmationTokenId: 'ctoken_cypress_insufficient',
      paymentId: 'pay-stripe-insufficient',
      paymentIntentId: 'pi_stripe_insufficient',
      finalizeError: 'insufficient_funds',
      paymentFailureReason: 'card_declined',
      eventFailureReason: 'insufficient_funds',
      expectedFeedback: 'fondos insuficientes'
    })
  })

  it('usa Stripe en modo seguro y muestra el mensaje de tarjeta rechazada', () => {
    registerStripeFailureScenario({
      transactionId: 'txn-stripe-declined',
      confirmationTokenId: 'ctoken_cypress_declined',
      paymentId: 'pay-stripe-declined',
      paymentIntentId: 'pi_stripe_declined',
      finalizeError: 'card_declined',
      paymentFailureReason: 'card_declined',
      eventFailureReason: 'card_declined',
      expectedFeedback: 'tarjeta fue rechazada'
    })

    runStripeFailureScenario({
      transactionId: 'txn-stripe-declined',
      confirmationTokenId: 'ctoken_cypress_declined',
      paymentId: 'pay-stripe-declined',
      paymentIntentId: 'pi_stripe_declined',
      finalizeError: 'card_declined',
      paymentFailureReason: 'card_declined',
      eventFailureReason: 'card_declined',
      expectedFeedback: 'tarjeta fue rechazada'
    })
  })
})
