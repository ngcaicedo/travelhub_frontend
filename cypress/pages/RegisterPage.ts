import { screenshot } from '../support/screenshots'

interface TravelerData {
  fullName: string
  email: string
  phone: string
  password: string
}

interface HotelPartnerData {
  hotelName: string
  contactName: string
  email: string
  phone: string
  password: string
}

export class RegisterPage {
  visit() {
    cy.visit('/register')
    screenshot.take('register_page_loaded')
  }

  selectTravelerTab() {
    cy.contains('[role="tab"]', 'Viajero').click()
    screenshot.take('register_traveler_tab')
  }

  selectHotelPartnerTab() {
    cy.contains('[role="tab"]', 'Socio Hotelero').click()
    screenshot.take('register_hotel_partner_tab')
  }

  fillTravelerForm(data: TravelerData) {
    cy.get('[data-cy=register-fullname]').type(data.fullName)
    cy.get('[data-cy=register-email]').type(data.email)
    cy.get('[data-cy=register-phone]').type(data.phone)
    cy.get('[data-cy=register-password]').type(data.password)
    screenshot.take('register_traveler_form_filled')
  }

  fillHotelPartnerForm(data: HotelPartnerData) {
    cy.get('[data-cy=register-hotel-name]').type(data.hotelName)
    cy.get('[data-cy=register-contact-name]').type(data.contactName)
    cy.get('[data-cy=register-email]').type(data.email)
    cy.get('[data-cy=register-phone]').type(data.phone)
    cy.get('[data-cy=register-password]').type(data.password)
    screenshot.take('register_hotel_partner_form_filled')
  }

  acceptTerms() {
    cy.get('[data-cy=register-terms]').click()
  }

  submit() {
    cy.get('[data-cy=register-submit]').click()
    screenshot.take('register_form_submitted')
  }

  getErrorMessage() {
    return cy.get('[role="alert"]')
  }
}
