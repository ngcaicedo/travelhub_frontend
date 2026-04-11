import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'

describe('Hotel Partner Registration', () => {
  const data = {
    hotelName: 'Gran Hotel Colonial',
    contactName: 'Carlos López',
    email: `partner.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`,
    phone: '6017654321',
    password: 'Hotel5678!'
  }

  beforeEach(() => {
    givenSteps.givenIAmOnRegister()
  })

  it('Successful registration as hotel partner', () => {
    // When
    whenSteps.whenIRegisterAsHotelPartner(data)

    // Then
    thenSteps.thenIAmOn('/login')
  })

  it('Failed registration with incomplete data', () => {
    // When - submit the form without filling any field
    whenSteps.whenISelectHotelPartnerTab()
    whenSteps.whenISubmitTheEmptyRegisterForm()

    // Then - stays on register because required fields are empty
    thenSteps.thenIAmOn('/register')
  })
})
