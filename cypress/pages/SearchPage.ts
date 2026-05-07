import { screenshot } from '../support/screenshots'

export interface SearchFilters {
  city?: string
  checkIn?: string
  checkOut?: string
  guests?: number
}

export class SearchPage {
  visit() {
    cy.visit('/search')
    // Nuxt SPA (ssr: false): esperar a que el form se hidrate antes de capturar
    cy.get('[data-cy=search-submit]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-cy=search-city]').should('be.visible')
    screenshot.take('search_page_loaded')
  }

  fillCity(city: string) {
    cy.get('[data-cy=search-city]').clear().type(city)
  }

  fillCheckIn(date: string) {
    cy.get('[data-cy=search-check-in]').clear().type(date)
  }

  fillCheckOut(date: string) {
    cy.get('[data-cy=search-check-out]').clear().type(date)
  }

  fillGuests(guests: number) {
    cy.get('[data-cy=search-guests]').clear().type(String(guests))
  }

  applyFilters(filters: SearchFilters) {
    if (filters.city !== undefined) this.fillCity(filters.city)
    if (filters.checkIn !== undefined) this.fillCheckIn(filters.checkIn)
    if (filters.checkOut !== undefined) this.fillCheckOut(filters.checkOut)
    if (filters.guests !== undefined) this.fillGuests(filters.guests)
    screenshot.take('search_form_filled')
  }

  submit() {
    cy.get('[data-cy=search-submit]').click()
    // Esperar a que aparezca o el grid de resultados o el empty state antes de capturar
    cy.get('[data-cy=search-results], [data-cy=search-empty-state]', { timeout: 15000 })
      .should('be.visible')
    screenshot.take('search_submitted', { fullPage: true })
  }

  search(filters: SearchFilters) {
    this.applyFilters(filters)
    this.submit()
  }

  resultsContainer() {
    return cy.get('[data-cy=search-results]')
  }

  resultCards() {
    return cy.get('[data-cy=search-result-card]')
  }

  emptyState() {
    return cy.get('[data-cy=search-empty-state]')
  }

  summary() {
    return cy.get('[data-cy=search-summary]')
  }

  sortTrigger() {
    return cy.get('[data-cy=search-sort-trigger]')
  }

  selectSort(optionLabel: string) {
    this.sortTrigger().click()
    cy.get('[role=menu]').contains(optionLabel).click()
    // El dropdown debe haberse cerrado y el label del trigger reflejar la nueva opcion
    cy.get('[role=menu]').should('not.exist')
    this.sortTrigger().should('contain.text', optionLabel)
    cy.get('[data-cy=search-results]').should('be.visible')
    screenshot.take(
      `search_sort_${optionLabel.replace(/\s+/g, '_').toLowerCase()}`,
      { fullPage: true }
    )
  }
}
