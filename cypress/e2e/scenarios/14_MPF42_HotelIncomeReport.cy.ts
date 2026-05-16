import { givenSteps } from '../../steps/GivenSteps'
import { thenSteps } from '../../steps/ThenSteps'
import { DEMO_HOTEL_A } from '../../support/demoData'
import { screenshot } from '../../support/screenshots'
import { HotelIncomeReportPage } from '../../pages/HotelIncomeReportPage'

const page = new HotelIncomeReportPage()

/**
 * Builds a fake JWT with role='hotel' and sets it as the auth cookie.
 * This bypasses the real login flow so the test focuses on the income
 * report feature, not authentication.
 */
function setHotelAuthCookie() {
  function b64url(value: string): string {
    return btoa(value).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  }
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    sub: DEMO_HOTEL_A.id,
    email: DEMO_HOTEL_A.email,
    role: 'hotel',
  }))
  const fakeToken = `${header}.${payload}.cypress-signature`
  cy.setCookie('auth_token', fakeToken)
}

/**
 * Intercepts the 3 API calls made by useIncomeReport on mount:
 * - 1st metrics call  → current period  (hostMetrics.json)
 * - 2nd metrics call  → previous period (hostMetricsPrev.json)
 * - revenue-trends    → hostRevenueTrends.json
 *
 * Cypress intercepts are matched last-registered-first, so registering
 * prevMetrics before currentMetrics makes currentMetrics win the first
 * request; once consumed (times: 1), prevMetrics matches the second.
 */
function interceptIncomeApis() {
  // Register previous-period fixture first (lower priority)
  cy.intercept(
    { method: 'GET', url: '**/api/v1/reservations/host/me/metrics**', times: 1 },
    { statusCode: 200, fixture: 'responses/hostMetricsPrev.json' },
  ).as('hostMetricsPrev')

  // Register current-period fixture second (higher priority, matched first)
  cy.intercept(
    { method: 'GET', url: '**/api/v1/reservations/host/me/metrics**', times: 1 },
    { statusCode: 200, fixture: 'responses/hostMetrics.json' },
  ).as('hostMetricsCurrent')

  cy.intercept('GET', '**/api/v1/reservations/host/me/revenue-trends**', {
    statusCode: 200,
    fixture: 'responses/hostRevenueTrends.json',
  }).as('hostTrends')
}

function waitForIncomeLoad() {
  cy.wait('@hostMetricsCurrent', { timeout: 15000 })
  cy.wait('@hostMetricsPrev', { timeout: 15000 })
  cy.wait('@hostTrends', { timeout: 15000 })
}

describe('MPF-42 | Reporte de ingresos (hotel)', () => {
  it('la página carga y muestra el selector de período y la tarjeta de resumen', () => {
    setHotelAuthCookie()
    interceptIncomeApis()
    page.visit()
    waitForIncomeLoad()

    page.root().should('exist')
    page.yearSelect().should('exist')
    page.monthSelect().should('exist')
    page.summaryCard().should('exist')
    screenshot.take('hotel_income_report_full')
  })

  it('la tarjeta de resumen muestra el ingreso total formateado (no guión)', () => {
    setHotelAuthCookie()
    interceptIncomeApis()
    page.visit()
    waitForIncomeLoad()

    page.revenueTotal()
      .should('be.visible')
      .invoke('text')
      .should('not.eq', '—')
      .and('match', /[\d.,]+/)
    screenshot.take('hotel_income_revenue_total_visible')
  })

  it('muestra el porcentaje de cambio positivo vs período anterior', () => {
    setHotelAuthCookie()
    interceptIncomeApis()
    page.visit()
    waitForIncomeLoad()

    // fixture: current=5_200_000, previous=3_250_000 → change ≈ +60.0%
    page.summaryCard()
      .should('contain.text', '+')
    screenshot.take('hotel_income_change_pct_visible')
  })

  it('el sidebar del portal hotel muestra el enlace "Reporte de ingresos"', () => {
    setHotelAuthCookie()
    cy.intercept('GET', '**/api/v1/reservations/host/me/metrics**', { statusCode: 200, body: {} })
    cy.intercept('GET', '**/api/v1/reservations/host/me/revenue-trends**', { statusCode: 200, body: {} })
    cy.intercept('GET', '**/api/v1/reservations/host/me**', { statusCode: 200, body: { items: [], total: 0, page: 1, page_size: 10 } })
    cy.visit('/hotel/dashboard')
    cy.get('[data-cy=hotel-dashboard]', { timeout: 15000 }).should('exist')

    // Nav label in Spanish locale ('es') is "Reporte de ingresos"
    cy.get('nav').contains('a', 'Reporte de ingresos').should('exist')
    screenshot.take('hotel_income_nav_link_visible')
  })

  it('el botón volver navega de regreso al dashboard', () => {
    setHotelAuthCookie()
    interceptIncomeApis()
    page.visit()
    waitForIncomeLoad()

    // UButton with to="/hotel/dashboard" renders as <a href="/hotel/dashboard">
    cy.get('a[href="/hotel/dashboard"]').first().click()
    cy.url().should('include', '/hotel/dashboard')
    cy.get('[data-cy=hotel-dashboard]', { timeout: 15000 }).should('exist')
    screenshot.take('hotel_income_back_to_dashboard')
  })

  it('cambiar el año activa nuevas llamadas a la API', () => {
    setHotelAuthCookie()
    interceptIncomeApis()
    page.visit()
    waitForIncomeLoad()

    // Set up new intercepts for the reload triggered by year change
    interceptIncomeApis()

    page.yearSelect().click()
    cy.get('[role=option]', { timeout: 8000 })
      .contains(String(new Date().getFullYear() - 1))
      .click()

    waitForIncomeLoad()

    page.summaryCard().should('exist')
    screenshot.take('hotel_income_year_changed')
  })
})
