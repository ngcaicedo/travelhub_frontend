import { screenshot } from '../support/screenshots'

export class HotelIncomeReportPage {
  visit() {
    cy.visit('/hotel/reports/income')
    cy.get('[data-cy=hotel-income-report]', { timeout: 15000 }).should('exist')
    screenshot.take('hotel_income_report_loaded')
  }

  root() {
    return cy.get('[data-cy=hotel-income-report]')
  }

  summaryCard() {
    return cy.get('[data-cy=hotel-income-summary-card]')
  }

  revenueTotal() {
    return cy.get('[data-cy=hotel-income-revenue-total]')
  }

  yearSelect() {
    return cy.get('[data-testid=income-year-select]')
  }

  monthSelect() {
    return cy.get('[data-testid=income-month-select]')
  }

  errorAlert() {
    return cy.get('[data-cy=hotel-income-error]')
  }
}
