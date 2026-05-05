import { givenSteps, type PaymentSummaryFixture } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'

const paymentSummary: PaymentSummaryFixture = {
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
    // Given
    givenSteps.givenPaymentsConfigIsFakeStripe()
    givenSteps.givenFakeChargeIsConfirmed(paymentSummary)

    // When
    whenSteps.whenIVisitCheckout()
    whenSteps.whenIPayNowOnCheckout()

    // Then
    thenSteps.thenTheFakeChargeFlowCompletes()
    thenSteps.thenIAmOnPaymentConfirmation(paymentSummary.payment_id)
    thenSteps.thenISeeTheReservationConfirmation(
      paymentSummary.reservation_id,
      paymentSummary.property_name,
      paymentSummary.receipt_number
    )
  })

  it('permite navegar a mis reservas desde la confirmacion', () => {
    // Given
    givenSteps.givenPaymentConfirmationIsAvailable(paymentSummary)

    // When
    whenSteps.whenIVisitPaymentConfirmation(paymentSummary.payment_id)
    cy.wait('@getPaymentConfirmation')
    whenSteps.whenIClickViewReservations()

    // Then
    thenSteps.thenIAmOn('/reservations')
  })
})
