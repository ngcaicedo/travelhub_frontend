import { screenshot } from '../support/screenshots'

export class ReservationsListPage {
  visit() {
    cy.visit('/reservations')
    cy.get('[data-cy=reservation-list], [data-cy=reservation-empty]', { timeout: 15000 })
      .should('be.visible')
    screenshot.take('reservations_list_loaded')
  }

  list() {
    return cy.get('[data-cy=reservation-list]')
  }

  cards() {
    return cy.get('[data-cy=reservation-card]')
  }

  emptyState() {
    return cy.get('[data-cy=reservation-empty]')
  }

  cardById(reservationId: string) {
    return cy.get(`[data-cy=reservation-card][data-cy-reservation-id="${reservationId}"]`)
  }

  selectTab(tab: 'upcoming' | 'past' | 'cancelled') {
    cy.get(`[data-cy=reservation-tab-${tab}]`).click()
    screenshot.take(`reservations_tab_${tab}`)
  }
}
