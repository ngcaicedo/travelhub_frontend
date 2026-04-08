import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'

describe('Login with OTP', () => {
  const data = {
    fullName: 'Ana García',
    email: `traveler.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`,
    phone: '3001234567',
    password: 'Test1234!'
  }

  before(() => {
    // Seed the user via API so login tests can authenticate
    cy.request('POST', `${Cypress.env('usersApiUrl')}/api/v1/users`, {
      email: data.email,
      phone: data.phone,
      password: data.password,
      full_name: data.fullName,
      role: 'traveler'
    })
  })

  beforeEach(() => {
    givenSteps.givenIAmOnLogin()
  })

  it('Successful login with valid OTP', () => {
    // Given - only the OTP is stubbed
    givenSteps.givenOtpServiceResponds()

    // When: enter real credentials against the backend
    whenSteps.whenILogInWith(data.email, data.password)

    // Then: redirect to OTP verification
    thenSteps.thenISeeTheOtpVerification(data.email)

    // When: enter OTP code (stubbed)
    whenSteps.whenIEnterTheOtpCode('123456')

    // Then: redirect to dashboard and have token
    cy.wait('@verifyOtp')
    thenSteps.thenIAmOn('/dashboard')
    thenSteps.thenIHaveAToken()
  })

  it('Redirect to OTP verification after correct credentials', () => {
    // When: real credentials
    whenSteps.whenILogInWith(data.email, data.password)

    // Then
    thenSteps.thenISeeTheOtpVerification(data.email)
  })

  it('Error when entering invalid credentials', () => {
    // When: invalid credentials against the real backend
    whenSteps.whenILogInWith('noexiste@example.com', 'WrongPass123!')

    // Then
    thenSteps.thenISeeALoginError()
    thenSteps.thenIAmOn('/login')
  })

  it('Error when entering invalid OTP', () => {
    // Given - only the invalid OTP response is stubbed
    givenSteps.givenOtpServiceFails(401, {
      detail: 'Código OTP inválido o expirado'
    })

    // When: real credentials
    whenSteps.whenILogInWith(data.email, data.password)
    thenSteps.thenISeeTheOtpVerification(data.email)

    // When: invalid OTP
    whenSteps.whenIEnterTheOtpCode('000000')

    // Then
    cy.wait('@verifyOtp')
    thenSteps.thenISeeAnOtpError()
    thenSteps.thenIAmOn('/verify-otp')
  })
})
