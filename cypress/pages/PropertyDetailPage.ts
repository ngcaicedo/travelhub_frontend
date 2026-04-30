import { screenshot } from '../support/screenshots'

export class PropertyDetailPage {
  visit(propertyId: string) {
    cy.visit(`/properties/${propertyId}`)
    screenshot.take('property_detail_loaded')
  }

  name() {
    return cy.get('[data-cy=property-name]')
  }

  location() {
    return cy.get('[data-cy=property-location]')
  }

  rating() {
    return cy.get('[data-cy=property-rating]')
  }

  features() {
    return cy.get('[data-cy=property-features]')
  }

  description() {
    return cy.get('[data-cy=property-description]')
  }

  amenitiesSection() {
    return cy.get('[data-cy=property-amenities]')
  }

  amenityItems() {
    return cy.get('[data-cy=property-amenity-item]')
  }

  reserveButton() {
    return cy.get('[data-cy=reservation-confirm]')
  }
}
