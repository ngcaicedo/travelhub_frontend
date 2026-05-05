import { givenSteps, type StripeFailureScenario } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'

const insufficientFundsScenario: StripeFailureScenario = {
  transactionId: 'txn-stripe-insufficient',
  confirmationTokenId: 'ctoken_cypress_insufficient',
  paymentId: 'pay-stripe-insufficient',
  paymentIntentId: 'pi_stripe_insufficient',
  finalizeError: 'insufficient_funds',
  paymentFailureReason: 'card_declined',
  eventFailureReason: 'insufficient_funds',
  expectedFeedback: 'fondos insuficientes'
}

const cardDeclinedScenario: StripeFailureScenario = {
  transactionId: 'txn-stripe-declined',
  confirmationTokenId: 'ctoken_cypress_declined',
  paymentId: 'pay-stripe-declined',
  paymentIntentId: 'pi_stripe_declined',
  finalizeError: 'card_declined',
  paymentFailureReason: 'card_declined',
  eventFailureReason: 'card_declined',
  expectedFeedback: 'tarjeta fue rechazada'
}

describe('MPF-21 | Checkout seguro y tokenizacion', () => {
  it('usa Stripe en modo seguro y muestra el mensaje de fondos insuficientes', () => {
    // Given
    givenSteps.givenStripeFailureScenarioIsConfigured(insufficientFundsScenario)

    // When
    whenSteps.whenIRunStripeFailureFlow(insufficientFundsScenario)

    // Then
    thenSteps.thenTheStripeFailureFlowCompletes()
    thenSteps.thenISeeCheckoutFeedback(insufficientFundsScenario.expectedFeedback)
  })

  it('usa Stripe en modo seguro y muestra el mensaje de tarjeta rechazada', () => {
    // Given
    givenSteps.givenStripeFailureScenarioIsConfigured(cardDeclinedScenario)

    // When
    whenSteps.whenIRunStripeFailureFlow(cardDeclinedScenario)

    // Then
    thenSteps.thenTheStripeFailureFlowCompletes()
    thenSteps.thenISeeCheckoutFeedback(cardDeclinedScenario.expectedFeedback)
  })
})
