import { screenshot } from '../support/screenshots'

export class ReservationModifyPage {
  visit(reservationId: string) {
    cy.visit(`/reservations/${reservationId}/modify`)
    screenshot.take('reservation_modify_loaded')
  }

  root() {
    return cy.get('[data-cy=reservation-modify]')
  }

  checkInInput() {
    return cy.get('[data-cy=modify-check-in]')
  }

  checkOutInput() {
    return cy.get('[data-cy=modify-check-out]')
  }

  guestsInput() {
    return cy.get('[data-cy=modify-guests]')
  }

  runPreviewButton() {
    return cy.get('[data-cy=modify-run-preview]')
  }

  confirmButton() {
    return cy.get('[data-cy=modify-confirm]')
  }

  preview() {
    return cy.get('[data-cy=modify-preview]')
  }

  changeAllowedLabel() {
    return cy.get('[data-cy=modify-change-allowed]')
  }

  setDates(checkIn: string, checkOut: string) {
    this.checkInInput().clear().type(checkIn)
    this.checkOutInput().clear().type(checkOut)
    screenshot.take('reservation_modify_dates_set')
  }

  runPreview() {
    this.runPreviewButton().click()
    screenshot.take('reservation_modify_preview_run')
  }
}
