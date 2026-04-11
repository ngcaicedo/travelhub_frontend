import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'

describe('Traveler Registration', () => {
  const data = {
    fullName: 'Ana García',
    email: `traveler.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`,
    phone: '3001234567',
    password: 'Test1234!'
  }

  beforeEach(() => {
    givenSteps.givenIAmOnRegister()
  })

  it('Successful registration as traveler', () => {
    // When
    whenSteps.whenIRegisterAsTraveler(data)

    // Then
    thenSteps.thenIAmOn('/login')
  })

  it('Failed registration with already existing email', () => {
    // Given - the previous test registered this user
    // When
    whenSteps.whenIRegisterAsTraveler(data)

    // Then
    thenSteps.thenISeeARegisterError()
  })

  it('Failed registration without accepting terms and conditions', () => {
    // When
    whenSteps.whenIRegisterAsTravelerWithoutAcceptingTerms(data)

    // Then
    thenSteps.thenISeeARegisterError()
  })
})
