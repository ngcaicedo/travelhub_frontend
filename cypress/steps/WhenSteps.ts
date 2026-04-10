import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
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

const loginPage = new LoginPage()
const registerPage = new RegisterPage()
const verifyOtpPage = new VerifyOtpPage()

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
  }
}
