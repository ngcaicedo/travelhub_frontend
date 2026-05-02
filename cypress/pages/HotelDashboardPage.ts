import { screenshot } from '../support/screenshots'

export class HotelDashboardPage {
  visit() {
    cy.visit('/hotel/dashboard')
    // El layout hotel tiene sidebar fixed que rompe la check 'be.visible';
    // basta con que el root exista y los KPIs ya cargados.
    cy.get('[data-cy=hotel-dashboard]', { timeout: 15000 }).should('exist')
    cy.get('[data-cy=hotel-kpis]', { timeout: 15000 }).should('exist')
    screenshot.take('hotel_dashboard_loaded')
  }

  root() {
    return cy.get('[data-cy=hotel-dashboard]')
  }

  kpis() {
    return cy.get('[data-cy=hotel-kpis]')
  }

  kpiRevenue() {
    return cy.get('[data-cy=hotel-kpi-revenue]')
  }

  kpiOccupancy() {
    return cy.get('[data-cy=hotel-kpi-occupancy]')
  }

  kpiAdr() {
    return cy.get('[data-cy=hotel-kpi-adr]')
  }

  kpiActiveBookings() {
    return cy.get('[data-cy=hotel-kpi-active-bookings]')
  }

  reservationsTable() {
    return cy.get('[data-cy=hotel-reservations-table]')
  }

  reservationRows() {
    return cy.get('[data-cy=hotel-reservation-row]')
  }

  rowByReservationId(reservationId: string) {
    return cy.get(`[data-cy=hotel-reservation-row][data-cy-reservation-id="${reservationId}"]`)
  }

  applyDateRange(startDate: string, endDate: string) {
    cy.intercept('GET', '**/api/v1/reservations/host/me/metrics**').as('hostMetrics')
    cy.intercept('GET', '**/api/v1/reservations/host/me/revenue-trends**').as('hostTrends')

    cy.get('[data-cy=hotel-filter-start-date]').clear().type(startDate)
    cy.get('[data-cy=hotel-filter-end-date]').clear().type(endDate)
    screenshot.take('hotel_filter_dates_set')
    cy.get('[data-cy=hotel-filter-apply]').click()

    cy.wait(['@hostMetrics', '@hostTrends'], { timeout: 15000 })
    // Margen para que echarts pinte la serie tras recibir los datos.
    cy.wait(300)
    screenshot.take('hotel_filter_applied')
  }
}
