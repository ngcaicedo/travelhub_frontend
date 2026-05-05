import { screenshot } from '../support/screenshots'

export class HotelReservationDetailPage {
  visit(reservationId: string) {
    cy.visit(`/hotel/reservations/${reservationId}`)
    cy.get('[data-cy=hotel-reservation-detail]', { timeout: 15000 })
      .should('have.attr', 'data-cy-reservation-id', reservationId)
    cy.get('[data-cy=hotel-detail-reservation-number]', { timeout: 15000 })
      .should('be.visible')
    screenshot.take('hotel_reservation_detail_loaded')
  }

  root() {
    return cy.get('[data-cy=hotel-reservation-detail]')
  }

  reservationNumber() {
    return cy.get('[data-cy=hotel-detail-reservation-number]')
  }

  status() {
    return cy.get('[data-cy=hotel-detail-status]')
  }

  guestName() {
    return cy.get('[data-cy=hotel-detail-guest-name]')
  }

  guestEmail() {
    return cy.get('[data-cy=hotel-detail-guest-email]')
  }

  checkIn() {
    return cy.get('[data-cy=hotel-detail-check-in]')
  }

  checkOut() {
    return cy.get('[data-cy=hotel-detail-check-out]')
  }

  guests() {
    return cy.get('[data-cy=hotel-detail-guests]')
  }

  paymentTotal() {
    return cy.get('[data-cy=hotel-detail-payment-total]')
  }

  confirmActionButton() {
    return cy.get('[data-cy=hotel-detail-action-confirm]')
  }

  cancelActionButton() {
    return cy.get('[data-cy=hotel-detail-action-cancel]')
  }

  confirmModalProceed() {
    return cy.get('[data-cy=hotel-detail-confirm-modal-proceed]')
  }

  cancelModalProceed() {
    return cy.get('[data-cy=hotel-detail-cancel-modal-proceed]')
  }

  successAlert() {
    return cy.get('[data-cy=hotel-detail-action-success]')
  }
}
