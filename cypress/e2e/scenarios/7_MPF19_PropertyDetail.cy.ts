import { givenSteps } from '../../steps/GivenSteps'
import { thenSteps } from '../../steps/ThenSteps'
import {
  DEMO_PROPERTY_ALPINE,
  DEMO_PROPERTY_RENAISSANCE
} from '../../support/demoData'

describe('MPF-19 | Detalle de propiedad', () => {
  it('muestra los datos completos de la Mansion Renacentista', () => {
    // Given
    givenSteps.givenIAmOnPropertyDetail(DEMO_PROPERTY_RENAISSANCE.id)

    // Then
    thenSteps.thenISeeThePropertyName(DEMO_PROPERTY_RENAISSANCE.name)
    thenSteps.thenISeeThePropertyLocation(DEMO_PROPERTY_RENAISSANCE.location)
    thenSteps.thenISeeThePropertyRatingMatches(/^\d+\.\d+$/)
    thenSteps.thenISeeThePropertyDescriptionContains('mansión renacentista')
    thenSteps.thenISeeAtLeastOneAmenity()
    thenSteps.thenISeeThePropertyHasMaxGuests(12)
    thenSteps.thenISeeTheReserveCallToAction()
  })

  it('muestra los datos completos del Refugio Alpino', () => {
    // Given
    givenSteps.givenIAmOnPropertyDetail(DEMO_PROPERTY_ALPINE.id)

    // Then
    thenSteps.thenISeeThePropertyName(DEMO_PROPERTY_ALPINE.name)
    thenSteps.thenISeeThePropertyLocation(DEMO_PROPERTY_ALPINE.location)
    thenSteps.thenISeeThePropertyDescriptionContains('refugio')
    thenSteps.thenISeeAtLeastOneAmenity()
    thenSteps.thenISeeThePropertyHasMaxGuests(14)
    thenSteps.thenISeeTheReserveCallToAction()
  })
})
