import { givenSteps } from '../../steps/GivenSteps'
import { whenSteps } from '../../steps/WhenSteps'
import { thenSteps } from '../../steps/ThenSteps'
import { DEMO_PROPERTY_ALPINE, DEMO_PROPERTY_RENAISSANCE } from '../../support/demoData'

// Las disponibilidades del search service estan seedeadas para los dias 10-16
// de cada mes de 2026 (ver travelhub_miso/services/search/src/db/seed.py).
const CHECK_IN = '2026-12-10'
const CHECK_OUT = '2026-12-12'

describe('Busqueda de hospedaje | filtros ciudad/fechas/capacidad', () => {
  beforeEach(() => {
    // Given
    givenSteps.givenIAmOnSearch()
  })

  it('devuelve la propiedad seedeada en Bogota cuando los filtros son validos', () => {
    // When
    whenSteps.whenISearchProperties({
      city: 'Bogota',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 2
    })

    // Then
    thenSteps.thenISeeSearchResultCount(1)
    thenSteps.thenTheFirstSearchResultIs(DEMO_PROPERTY_RENAISSANCE.id, DEMO_PROPERTY_RENAISSANCE.name)
    thenSteps.thenTheSearchSummaryContains('1')
  })

  it('respeta el filtro de ciudad al cambiar a Cali', () => {
    // When
    whenSteps.whenISearchProperties({
      city: 'Cali',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 2
    })

    // Then
    thenSteps.thenISeeSearchResultCount(1)
    thenSteps.thenTheFirstSearchResultIs(DEMO_PROPERTY_ALPINE.id, DEMO_PROPERTY_ALPINE.name)
  })

  it('muestra empty state cuando los huespedes superan la capacidad disponible', () => {
    // When
    whenSteps.whenISearchProperties({
      city: 'Bogota',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 20
    })

    // Then
    thenSteps.thenISeeTheSearchEmptyState()
    thenSteps.thenISeeSearchResultCount(0)
  })
})
