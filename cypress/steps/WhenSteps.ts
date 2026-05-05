import { CheckoutPage } from '../pages/CheckoutPage'
import { HotelDashboardPage } from '../pages/HotelDashboardPage'
import { HotelReservationDetailPage } from '../pages/HotelReservationDetailPage'
import { LoginPage } from '../pages/LoginPage'
import { PaymentConfirmationPage } from '../pages/PaymentConfirmationPage'
import { PropertyDetailPage } from '../pages/PropertyDetailPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ReservationCancelPage } from '../pages/ReservationCancelPage'
import { ReservationModifyPage } from '../pages/ReservationModifyPage'
import { ReservationsListPage } from '../pages/ReservationsListPage'
import { SearchPage, type SearchFilters } from '../pages/SearchPage'
import { VerifyOtpPage } from '../pages/VerifyOtpPage'

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

interface StripeStubScenario {
  confirmationTokenId: string
}

const checkoutPage = new CheckoutPage()
const hotelDashboardPage = new HotelDashboardPage()
const hotelReservationDetailPage = new HotelReservationDetailPage()
const loginPage = new LoginPage()
const paymentConfirmationPage = new PaymentConfirmationPage()
const propertyDetailPage = new PropertyDetailPage()
const registerPage = new RegisterPage()
const reservationCancelPage = new ReservationCancelPage()
const reservationModifyPage = new ReservationModifyPage()
const reservationsListPage = new ReservationsListPage()
const searchPage = new SearchPage()
const verifyOtpPage = new VerifyOtpPage()

function installStripeStub(win: Cypress.AUTWindow, confirmationTokenId: string) {
  const stripeWindow = win as Cypress.AUTWindow & {
    Stripe?: () => {
      elements: () => {
        submit: () => Promise<Record<string, never>>
        create: () => {
          mount: () => void
          unmount: () => void
          destroy: () => void
        }
      }
      createConfirmationToken: () => Promise<{ confirmationToken: { id: string } }>
      handleNextAction: () => Promise<Record<string, never>>
    }
  }

  stripeWindow.Stripe = () => ({
    elements: () => ({
      submit: async () => ({}),
      create: () => ({
        mount: () => {},
        unmount: () => {},
        destroy: () => {}
      })
    }),
    createConfirmationToken: async () => ({
      confirmationToken: { id: confirmationTokenId }
    }),
    handleNextAction: async () => ({})
  })
}

export const whenSteps = {
  whenIRegisterAsTraveler(data: TravelerData) {
    registerPage.selectTravelerTab()
    registerPage.fillTravelerForm(data)
    registerPage.acceptTerms()
    registerPage.submit()
  },

  whenIRegisterAsHotelPartner(data: HotelPartnerData) {
    registerPage.selectHotelPartnerTab()
    registerPage.fillHotelPartnerForm(data)
    registerPage.acceptTerms()
    registerPage.submit()
  },

  whenIRegisterAsTravelerWithoutAcceptingTerms(data: TravelerData) {
    registerPage.selectTravelerTab()
    registerPage.fillTravelerForm(data)
    registerPage.submit()
  },

  whenISelectHotelPartnerTab() {
    registerPage.selectHotelPartnerTab()
  },

  whenISubmitTheEmptyRegisterForm() {
    registerPage.submit()
  },

  whenILogInWith(email: string, password: string) {
    loginPage.typeEmail(email)
    loginPage.typePassword(password)
    loginPage.submit()
  },

  whenIEnterTheOtpCode(code: string) {
    verifyOtpPage.typeCode(code)
    verifyOtpPage.submit()
  },

  whenISearchProperties(filters: SearchFilters) {
    searchPage.search(filters)
  },

  whenISelectSort(optionLabel: string) {
    searchPage.selectSort(optionLabel)
  },

  whenIVisitCheckout() {
    checkoutPage.visit()
  },

  whenIPayNowOnCheckout() {
    checkoutPage.clickPayNow()
  },

  whenIRunStripeFailureFlow(scenario: StripeStubScenario) {
    cy.visit('/checkout', {
      onBeforeLoad(win) {
        installStripeStub(win, scenario.confirmationTokenId)
      }
    })

    cy.get('[data-cy=checkout-card-number]').should('not.exist')
    cy.get('[data-cy=checkout-token]').should('not.exist')
    cy.get('[data-cy=checkout-stripe-element]').should('exist')

    cy.get('[data-cy=checkout-pay-now]').click()
  },

  whenIVisitPaymentConfirmation(paymentId: string) {
    paymentConfirmationPage.visit(paymentId)
  },

  whenIClickViewReservations() {
    paymentConfirmationPage.clickViewReservations()
  },

  whenISelectReservationsTab(tab: 'upcoming' | 'past' | 'cancelled') {
    reservationsListPage.selectTab(tab)
  },

  whenIOpenSearchResultProperty(propertyId: string) {
    cy.get(`[data-cy=search-result-card][data-cy-property-id="${propertyId}"]`)
      .find('[data-cy=search-result-view-property]')
      .click()
  },

  whenIClickReserveOnWidget() {
    propertyDetailPage.clickReserve()
  },

  whenIFillReservationWidget(checkIn: string, checkOut: string, guests: number) {
    propertyDetailPage.fillReservationDates(checkIn, checkOut)
    propertyDetailPage.setGuests(guests)
  },

  whenISelectCheckoutScenario(scenario: 'success' | 'insufficient' | 'declined') {
    checkoutPage.chooseScenario(scenario)
  },

  whenIClickModifyOnReservationCard(reservationId: string) {
    reservationsListPage.cardById(reservationId)
      .find('[data-cy=reservation-card-modify]')
      .click()
  },

  whenIClickCancelOnReservationCard(reservationId: string) {
    reservationsListPage.cardById(reservationId)
      .find('[data-cy=reservation-card-cancel]')
      .click()
  },

  whenIConfirmCancellation() {
    reservationCancelPage.clickConfirm()
  },

  whenIChangeReservationDates(checkIn: string, checkOut: string) {
    reservationModifyPage.setDates(checkIn, checkOut)
  },

  whenIRunModificationPreview() {
    reservationModifyPage.runPreview()
  },

  whenIApplyHotelDashboardDateRange(startDate: string, endDate: string) {
    hotelDashboardPage.applyDateRange(startDate, endDate)
  },

  whenIOpenHotelReservationDetail(reservationId: string) {
    cy.get(`[data-cy=hotel-row-view-detail][data-cy-reservation-id="${reservationId}"]`).click()
  },

  whenIVisitHotelReservationDetail(reservationId: string) {
    hotelReservationDetailPage.visit(reservationId)
  },

  whenHotelConfirmsReservationFromDetail() {
    cy.intercept('POST', '**/api/v1/hotel/reservations/*/confirm').as('hotelConfirm')
    hotelReservationDetailPage.confirmActionButton().scrollIntoView().click()
    hotelReservationDetailPage.confirmModalProceed().click()
    cy.wait('@hotelConfirm', { timeout: 15000 })
  },

  whenHotelCancelsReservationFromDetail() {
    cy.intercept('POST', '**/api/v1/hotel/reservations/*/cancel').as('hotelCancel')
    hotelReservationDetailPage.cancelActionButton().scrollIntoView().click()
    hotelReservationDetailPage.cancelModalProceed().click()
    cy.wait('@hotelCancel', { timeout: 15000 })
  }
}
