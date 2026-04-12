import { screenshot } from '../support/screenshots'

export class PaymentConfirmationPage {
  visit(paymentId: string) {
    cy.visit(`/notifications/payment-confirmation?paymentId=${paymentId}`)
    screenshot.take('payment_confirmation_loaded')
  }

  title() {
    return cy.get('[data-cy=payment-confirmation-title]')
  }

  reservationId() {
    return cy.get('[data-cy=payment-confirmation-reservation-id]')
  }

  clickViewReservations() {
    cy.get('[data-cy=payment-confirmation-view-reservations]').click()
    screenshot.take('payment_confirmation_view_reservations')
  }

  clickDownloadReceipt() {
    cy.get('[data-cy=payment-confirmation-download-receipt]').click()
    screenshot.take('payment_confirmation_download_receipt')
  }

  clickBackHome() {
    cy.get('[data-cy=payment-confirmation-back-home]').click()
    screenshot.take('payment_confirmation_back_home')
  }
}
