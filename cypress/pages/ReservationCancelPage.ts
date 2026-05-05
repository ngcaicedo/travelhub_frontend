import { screenshot } from '../support/screenshots'

export class ReservationCancelPage {
  visit(reservationId: string) {
    cy.visit(`/reservations/${reservationId}/cancel`)
    screenshot.take('reservation_cancel_loaded')
  }

  root() {
    return cy.get('[data-cy=reservation-cancel]')
  }

  refundAmount() {
    return cy.get('[data-cy=cancel-refund-amount]')
  }

  penaltyAmount() {
    return cy.get('[data-cy=cancel-penalty-amount]')
  }

  confirmButton() {
    return cy.get('[data-cy=cancel-confirm]')
  }

  keepButton() {
    return cy.get('[data-cy=cancel-keep]')
  }

  clickConfirm() {
    this.confirmButton().click()
    screenshot.take('reservation_cancel_confirm_clicked')
  }
}
